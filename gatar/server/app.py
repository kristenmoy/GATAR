from dotenv import load_dotenv
load_dotenv()

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from qdrant_client.http.models import PointStruct
from server.qdrant_service import get_client, upload_to_qdrant, query_qdrant
from server.test_chunking import pdf_to_embedded_chunks, embed_with_e5, build_llm_context
from server.test_chunking import client as llm_client
import uuid
from qdrant_client.models import VectorParams, Distance

COLLECTION = os.getenv("QDRANT_COLLECTION")

def create_app():
    client = get_client()

    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})  # fine for dev; tighten later

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


        vectors = embed_with_e5([d["text"] for d in docs])


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
        # client.recreate_collection(
        #     collection_name=COLLECTION,
        #     vectors_config=VectorParams(size=1024, distance=Distance.COSINE)
        # )
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
            info = client.get_collection(COLLECTION)
            # print(info)
            print("starting ingestion pipeline")
            # LLM chunking pipeline from test_chunking
            embedding_chunks = pdf_to_embedded_chunks(file_path)
            print("finished chunks for embedding in app.py")

            # Convert to existing ingestion format with unique chunk id
            points = []


            vectors = embed_with_e5([c["text_for_embedding"] for c in embedding_chunks])
            
            for chunk, vector in zip(embedding_chunks, vectors):
                metadata = chunk["metadata"]

                point = PointStruct(
                    id=str(uuid.uuid4()),
                    vector=vector,
                    payload={
                        "text": chunk["text_for_embedding"],
                        "doc_title": metadata.get("title"),
                        "section_header": metadata.get("section_header"),
                        "page": metadata.get("pages"),
                        "course_code": chunk.get("course_code")
                    }
                )
                points.append(point)
            print("embedded chunks with e5")

            # print("Vector length:", len(vectors[0]))
            info = client.get_collection(COLLECTION)
            # print(info)
            client.upsert(collection_name=COLLECTION, points=points)
            print("saved chunks to Qdrant")

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


        qvec = embed_with_e5([q])[0]
        hits = client.search(collection_name=COLLECTION, query_vector=qvec, limit=limit)


        return jsonify(
            {
                "results": [
                    {"id": h.id, "score": h.score, "payload": h.payload}
                    for h in hits
                ]
            }
        )
   
    @app.post("/api/chat")
    def chat():
        print("made it to chat")
        data = request.get_json(force=True) or {}
        messages = data.get("messages", [])
        if not messages:
            return jsonify({"error": "Missing message"}), 400
        
        q = messages[-1]["content"]
        print("question is: ", q)

        # 1. Embed query
        qvec = embed_with_e5([q])[0]
        print("query embedded")

        # 2. Qdrant search
        results = client.query_points(
            collection_name="test",
            query=qvec,
            limit=5
        )
        hits = results.points
        # for i in hits:
        #     print(type(i))
        #     print(i.payload)
        print("qdrant search completed")

        # 3. Build context
        context = build_llm_context(hits)
        chat_history = "\n".join(
            [f"{m['role']}: {m['content']}" for m in messages]
        )
        print("finished building context")

        # 4. Prompt design
        prompt = f"""
        You are a helpful tutor.

        - Use ONLY the context below to answer the question.
        - If you do not have enough context to answer, say "I do not have enough context to answer this question"

        Conversation history:
        {chat_history}

        Context:
        {context}

        Latest question:
        {q}

        Answer the latest user question clearly and concisely.
        """

        response = llm_client.responses.create(
            model="gpt-oss-120b",
            input=prompt,
            temperature=0.2
        )

        answer = None
        for item in response.output:
            if item.type=="message":
                for content in item.content:
                    if content.type=="output_text":
                        answer = content.text
        if answer is None:
            raise ValueError("No answer text output from model")

        print("llm outputted answer")
        return jsonify({
            "answer": answer,
            "sources": [h.payload for h in hits]
        })

    return app




app = create_app()


if __name__ == "__main__":
    # This avoids FLASK_APP detection issues on Windows
    port = int(os.getenv("PORT", "5000"))
    app.run(host="127.0.0.1", port=port, debug=True, use_reloader=False)


