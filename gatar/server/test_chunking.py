from pypdf import PdfReader
import spacy
import tiktoken
from openai import OpenAI
import os
import json
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct

# install in terminal:
# pip install pypdf spacy tiktoken openai sentence_transformers qdrant-client
# python -m spacy download en_core_web_sm
# set API key: $env:OPENAI_API_KEY="insert API key here"
# check if API key is valid if needed: echo $env:OPENAI_API_KEY


# process of chunking:
# 1. Get PDF filepath
# 2. Extract text from PDFs with pyPDF
# 3. Break it into paragraphs with pyPDF
# 4. Detect section headings with SpaCy
# 5. Merge common ideas with LLM (sliding context window)
# 6. Re-split chunks based on token limit (512) using tiktoken
# 7. Embedding using e5-large


# initialize spacy, tiktoken, openai, e5-large
nlp = spacy.load("en_core_web_sm")
enc = tiktoken.get_encoding("cl100k_base")
client = OpenAI(
    api_key= os.environ.get("OPENAI_API_KEY"),
    base_url="https://api.ai.it.ufl.edu"
)
e5_model = SentenceTransformer("intfloat/e5-large")


# extract the text using pypdf
def extract_pages(pdf_path):
    reader = PdfReader(pdf_path)
    pages = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if text:
            pages.append({
                "page": i + 1,
                "text": text.strip()
            })
    return pages

# split the text into paragraphs
def split_paragraphs(text):
    return [p.strip() for p in text.split("\n\n") if len(p.strip()) > 50]

# split the text into paragraphs by each page
# (makes it quicker to break up the text)
def page_to_paragraphs(pages):
    paragraphs = []
    for page in pages:
        for split_para in split_paragraphs(page["text"]):
            paragraphs.append({
                "page": page["page"],
                "text": split_para
            })        
    return paragraphs

# use spacy to tag potential section headings
def potential_heading(text):
    doc = nlp(text)
    if len(text) < 120 and text.isupper():
        return True
    if len(doc) < 10 and sum(1 for t in doc if t.pos_ == "NOUN") >= 2:
        return True
    if text[:2].isdigit():
        return True
    return False

# clasify paragraph headings using previous functions
# Add additional classifications for clarity
def classify_paragraph(text):
    doc = nlp(text)

    return {
        "is_heading": potential_heading(text),
        "noun_ratio": sum(1 for t in doc if t.pos_ == "NOUN") / max(len(doc), 1),
        "sentence_count": len(list(doc.sents))
    }

# Prompt construction using chunked paragraphs
def merge_paragraphs_llm(paragraphs, model="gpt-5.1"):

    prompt = f"""
    You are preparing text chunks for vector embeddings using the E5-large model.

    Rules:
    - Each chunk must cover ONE clear topic.
    - Chunks should be understandable without surrounding text.
    - Prefer 150–350 tokens per chunk (max 500).
    - Do not merge unrelated paragraphs.
    - Preserve important definitions.

    Input paragraphs:
    {json.dumps(paragraphs, indent=2)}

    Return JSON ONLY in this format:
    [
    {{
        "chunk_title": "...",
        "chunk_text": "...",
        "paragraph_ids": [0,1]
    }}
    ]
    """

    response = client.responses.create(
        model=model,
        input=prompt,
        reasoning={"effort": "medium"},
        # text={"verbosity": "high"}
    )

    raw = response.output_text.strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        print("LLM returned invalid JSON:")
        print(raw)
        raise



# Enforce token limits after the LLM output
def split_if_needed(text, max_tokens=350):
    tokens = enc.encode(text)
    if len(tokens) <= max_tokens:
        return [text]

    chunks = []
    start = 0
    while start < len(tokens):
        end = start + max_tokens
        chunk = enc.decode(tokens[start:end])
        chunks.append(chunk)
        start = end
    return chunks

# Prepare metadata for chunks
# Add metadata for course, lecture, chapter, page numbers, etc.
def format_for_e5(chunk, doc_title=None, section_header=None, page_range=None):
    prefix = "passage: "
    meta = []

    if doc_title:
        meta.append(f"Document: {doc_title}")
    if section_header:
        meta.append(f"Section: {section_header}")
    if page_range:
        meta.append(f"Pages: {page_range}")

    metadata_block = " | ".join(meta)
    return f"{prefix}{metadata_block}\n{chunk}"



# full pdf -> embedding prepared pipeling
def pdf_to_embedded_chunks(pdf_path, llm_model = "gpt-5.1", max_tokens = 350):
    
    # extract pdf title, pages, split into paragraphs, generate ids for paragraph metadata
    doc_title = os.path.splitext(os.path.basename(pdf_path))[0]
    pages = extract_pages(pdf_path)
    paragraphs = page_to_paragraphs(pages)
    para_ids = [{"id": index, "text": p["text"]} for index, p in enumerate(paragraphs)]

    # use llm to merge the paragraphs into relevant sections and resplit if needed to match token limit
    merged_chunks = merge_paragraphs_llm(para_ids, model = llm_model)

    final_chunks = []
    for chunk in merged_chunks:
        txt_split = split_if_needed(chunk["chunk_text"], max_tokens = max_tokens)
        for i, split_text in enumerate(txt_split):
            final_chunks.append({
                "chunk_title": f"{chunk['chunk_title']} ({i+1})" if len(txt_split) > 1 else chunk["chunk_title"],
                "chunk_text": split_text,
                "paragraph_ids": chunk["paragraph_ids"]
            })
    
    # format for e5-large vector embedding
    embedding_chunks = []
    for chunk in final_chunks:
        pg_numbers = [paragraphs[p]["page"] for p in chunk["paragraph_ids"]]
        pg_range = f"{min(pg_numbers)}-{max(pg_numbers)}"
        embedding_chunks.append({
            "text_for_embedding" : format_for_e5(chunk["chunk_text"], doc_title=doc_title, section_header=chunk["chunk_title"], page_range=pg_range),
            "metadata": {
                "title": doc_title,
                "section_header": chunk["chunk_title"],
                "pages": pg_range,
                "paragraph_ids": chunk["paragraph_ids"]
            }
        })

    return embedding_chunks

# embed similarity vectors using e5-large
def embed_with_e5(chunks):
    return e5_model.encode(
        chunks, normalize_embeddings=True, show_progress_bar=True
    )

# helper func so the LLM will only use the retrieved similarity vectors correcponding to the query
def build_llm_context(results):
    # join the context vectors and return
    context = []
    for r in results:
        curr = r.payload
        context.append(
            f""" 
            Title: {curr['title']}
            Pages: {curr['pages']}
            {curr['text']}
            """
        )
    return "\n\n---\n\n".join(context)

# if __name__ == "__main__":
    # testing API key is valid
    # print(client.models.list())

    # testing the chunking->embedding pipeline
    # pdf_file = "C:/Users/Sophie Shah/Downloads/OSI_model.pdf"
    # chunks = pdf_to_embedded_chunks(pdf_file)
    # print(json.dumps(chunks, indent=2))