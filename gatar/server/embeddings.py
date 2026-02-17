from sentence_transformers import SentenceTransformer

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def embed_texts(texts):
    return model.encode(texts).tolist()

def embed_query(text):
    return model.encode([text])[0].tolist()
