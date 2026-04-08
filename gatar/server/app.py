from dotenv import load_dotenv
load_dotenv()

import os
import json
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from qdrant_client.http.models import PointStruct
from qdrant_client.models import VectorParams, Distance
from server.qdrant_service import get_client, upload_to_qdrant, query_qdrant
from server.test_chunking import pdf_to_embedded_chunks, embed_with_e5, build_llm_context
from server.test_chunking import client as llm_client
import uuid

# ── simple file registry (lives next to app.py) ──────────────────────────────
REGISTRY_PATH = Path("file_registry.json")

def _load_registry() -> list:
    if REGISTRY_PATH.exists():
        return json.loads(REGISTRY_PATH.read_text())
    return []

def _save_registry(records: list):
    REGISTRY_PATH.write_text(json.dumps(records, indent=2))


def create_app():
    client = get_client()

    app = Flask(__name__)
    CORS(app)

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
        course_code = data.get("course_code")


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


        client.upsert(collection_name=course_code, points=points)
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
        course_code = request.form.get("course_code")

        if not course_code:
            return jsonify({"error": "Missing course_code"}), 400


        if file.filename == "" or not file.filename.lower().endswith(".pdf"):
            return jsonify({"error": "Invalid PDF file"}), 400
        course_code = request.form.get("course_code", "UNKNOWN")

        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        upload_id = str(uuid.uuid4())
        unique_name = f"{upload_id}_{file.filename}"
        file_path = os.path.join(upload_dir, unique_name)
        file.save(file_path)
        print("saving file")
        try:
            info = client.get_collection(course_code)
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
                        "course_code": course_code,
                        "upload_id": upload_id,
                    }
                )
                points.append(point)
            print("embedded chunks with e5")

            # print("Vector length:", len(vectors[0]))
            info = client.get_collection(course_code)
            # print(info)
            client.upsert(collection_name=course_code, points=points)
            print("saved chunks to Qdrant")

            registry = _load_registry()
            registry.append({
                "id": upload_id,
                "name": file.filename,
                "course_code": course_code,
                "chunks": len(points),
            })
            _save_registry(registry)

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

    @app.get("/api/files/<class_code>")
    def list_files(class_code):
        registry = _load_registry()
        files = [r for r in registry if r["course_code"] == class_code]
        return jsonify(files)

    @app.delete("/api/files/<file_id>")
    def delete_file(file_id):
        registry = _load_registry()
        record = next((r for r in registry if r["id"] == file_id), None)
        if not record:
            return jsonify({"error": "File not found"}), 404

        print("Deleting upload_id:", file_id)

        try:
            client.delete(
                collection_name=COLLECTION,
                points_selector={
                    "filter": {
                        "must": [
                            {
                                "key": "upload_id",
                                "match": {"value": file_id}
                            }
                        ]
                    }
                }
            )
        except Exception as e:
            print("Qdrant delete error:", repr(e))
            # continue anyway

        _save_registry([r for r in registry if r["id"] != file_id])

        return jsonify({"ok": True})


    @app.post("/api/create-course")
    def create_course():
        data = request.get_json(force=True) or {}
        course_code = data.get("course_code")

        if not course_code:
            return jsonify({"error": "Missing course_code"}), 400

        course_code = course_code.upper()
        client = get_client()

        # Get existing collections
        collections = client.get_collections().collections
        existing = [c.name for c in collections]

        if course_code not in existing:
            client.create_collection(
                collection_name=course_code,
                vectors_config=VectorParams(
                    size=1024,
                    distance=Distance.COSINE
                )
            )

            try:
                client.create_payload_index(
                    collection_name=course_code,
                    field_name="course_code",
                    field_schema="keyword"
                )
            except Exception:
                pass

        recreate_courses_collection = False

        if "courses" in existing:
            info = client.get_collection("courses")
            current_dim = info.config.params.vectors.size

            if current_dim != 1024:
                recreate_courses_collection = True

        if "courses" not in existing or recreate_courses_collection:
            if "courses" in existing:
                client.delete_collection("courses")

            client.create_collection(
                collection_name="courses",
                vectors_config=VectorParams(
                    size=1024,
                    distance=Distance.COSINE
                )
            )

        point = PointStruct(
            id=str(uuid.uuid4()),
            vector=[0.0] * 1024,
            payload={"course_code": course_code}
        )

        client.upsert(
            collection_name="courses",
            points=[point]
        )

        results = client.scroll(
            collection_name="courses",
            limit=10,
            with_vectors=False
        )[0]

        print("COURSES COLLECTION:", results)

        return jsonify({"ok": True, "course": course_code})


    @app.get("/api/courses")
    def get_courses():
        client = get_client()

        results = client.scroll(
            collection_name="courses",
            limit=100
        )[0]

        return jsonify([
            r.payload["course_code"] for r in results
        ])
   

    @app.post("/api/search")
    def search():
        data = request.get_json(force=True) or {}
        q = data.get("query", "")
        limit = int(data.get("limit", 5))
        course_code = data.get("course_code")


        if not q:
            return jsonify({"error": "Missing query"}), 400


        qvec = embed_with_e5([q])[0]
        hits = client.search(collection_name=course_code, query_vector=qvec, limit=limit)


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
        course_code = data.get("course_code")
        if not course_code:
            return jsonify({"error": "Missing course_code"}), 400

        # 1. Embed query
        qvec = embed_with_e5([q])[0]
        print("query embedded")

        # 2. Qdrant search
        results = client.query_points(
            collection_name=course_code,
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