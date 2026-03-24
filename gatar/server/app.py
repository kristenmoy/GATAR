from dotenv import load_dotenv
load_dotenv()

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from qdrant_client.http.models import PointStruct
from qdrant_service import client, ensure_collection, COLLECTION
from embeddings import embed_texts, embed_query
from test_chunking import pdf_to_embedded_chunks, embed_with_e5, build_llm_context
from test_chunking import client as llm_client
import uuid


def create_app():
    app = Flask(__name__)
    CORS(app)  # fine for dev; tighten later

    # Ensure Qdrant collection exists at startup
    try:
        ensure_collection()
    except Exception as e:
        # Don't crash silently; show a useful error
        print("Failed to ensure Qdrant collection:", repr(e))

    @app.get("/")
    def home():
        return "Backend is running. Try /api/health", 200

    @app.get("/api/health")
    def health():
        return jsonify({"ok": True})

    @app.post("/api/ingest")
    def ingest():
        data = request.get_json(force=True) or {}
        docs = data.get("documents", [])
        if not docs:
            return jsonify({"error": "No documents"}), 400

        # Validate docs
        for i, d in enumerate(docs):
            if "id" not in d or "text" not in d:
                return jsonify({"error": f"Document at index {i} must include 'id' and 'text'"}), 400

        vectors = embed_texts([d["text"] for d in docs])

        points = [
            PointStruct(
                id=d["id"],
                vector=v,
                payload={
                    "text": d["text"],
                    "doc_title": d.get("doc_title"),
                    "section_header": d.get("section_header"),
                    "page": d.get("page"),
                }
            )
            for d, v in zip(docs, vectors)
        ]

        client.upsert(collection_name=COLLECTION, points=points)
        return jsonify({"ok": True, "count": len(points)})

    @app.post("/api/upload-pdf")
    def upload_pdf():

        # check if valid PDF file uploaded
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files["file"]

        if file.filename == "" or not file.filename.lower().endswith(".pdf"):
            return jsonify({"error": "Invalid PDF file"}), 400

        # Save temporarily to uploads directory
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        unique_name = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(upload_dir, unique_name)
        file.save(file_path)
        print("saving file")
        try:
            print("starting ingestion pipeline")
            # LLM chunking pipeline from test_chunking
            embedding_chunks = pdf_to_embedded_chunks(file_path)

            # Convert to existing ingestion format with unique chunk id
            points = []

            vectors = embed_with_e5([c["text"] for c in embedding_chunks])

            for chunk, vector in zip(embedding_chunks, vectors):
                point = PointStruct(
                    id=str(uuid.uuid4()),
                    vector=vector,
                    payload={
                        "text": chunk["text"],
                        "doc_title": chunk.get("doc_title"),
                        "section_header": chunk.get("section_header"),
                        "page": chunk.get("page"),
                        "course_code": chunk.get("course_code")
                    }
                )
                points.append(point)

            client.upsert(collection_name=COLLECTION, points=points)

            return jsonify({
                "ok": True,
                "chunks_created": len(points)
            })

        except Exception as e:
            print("PDF processing failed:", repr(e))
            return jsonify({"error": "PDF Processing failed"}), 500
        finally:
            if os.path.exists(file_path):
                os.remove(file_path)
    
    @app.get("/api/qdrant-test")
    def qdrant_test():
        try:
            collections = client.get_collections()
            return jsonify({
                "connected": True,
                "collections": [c.name for c in collections.collections]
            })
        except Exception as e:
            return jsonify({
                "connected": False,
                "error": str(e)
            }), 500

    
    @app.post("/api/search")
    def search():
        data = request.get_json(force=True) or {}
        q = data.get("query", "")
        limit = int(data.get("limit", 5))

        if not q:
            return jsonify({"error": "Missing query"}), 400

        qvec = embed_query(q)
        hits = client.search(collection_name=COLLECTION, query_vector=qvec, limit=limit)

        return jsonify(
            {
                "results": [
                    {"id": h.id, "score": h.score, "payload": h.payload}
                    for h in hits
                ]
            }
        )
    
    @app.post("/api/ask")
    def ask():
        # future addition: add memory so chatbot remembers conversation
        data = request.json
        question = data.get("question")

        if not question:
            return jsonify({"error": "No question provided"}), 400

        try:
            # embed question with e5 then search qdrant for top results
            '''
            add a query filter by course  later
            query_filter={
                "must": [
                    {"key": "title", "match": {"value": course}}
                ]
            }
            '''
            query_vector = embed_with_e5([f"query: {question}"])[0]

            results = client.search(
                collection_name=COLLECTION,
                query_vector=query_vector,
                limit=5
            )

            # make sure LLM uses only the retrieved similarity vectors
            context = build_llm_context(results)

            # prompt design
            response = llm_client.responses.create(
                model="gpt-5.1",
                input=f"""
                - Answer the question using ONLY the context below. 
                - DO NOT use any outside context or sources to answer this question.
                - DO NOT make up information.
                - If the answer is not in the context, then say "I don't know based on the provided material."
                - Be clear and concise.
                - Cite sources using (Page X-Y).

                Context:
                {context}

                Question:
                {question}
                """
            )

            answer = response.output_text.strip()

            return jsonify({
                "answer": answer,
                "sources": [r.payload for r in results]
            })

        except Exception as e:
            print("Query failed:", repr(e))
            return jsonify({"error": "Query failed"}), 500

    return app


app = create_app()

if __name__ == "__main__":
    # This avoids FLASK_APP detection issues on Windows
    port = int(os.getenv("PORT", "5000"))
    app.run(host="127.0.0.1", port=port, debug=True)
