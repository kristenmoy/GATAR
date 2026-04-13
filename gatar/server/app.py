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
                        "text": chunk["chunk_text"],
                        "doc_title": os.path.splitext(file.filename)[0],
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


    @app.get("/api/files/<course_code>")
    def list_files(course_code):
        try:
            results, _ = client.scroll(
                collection_name=course_code,
                limit=1000,
                with_payload=True,
                with_vectors=False
            )

            files = {}
            for r in results:
                upload_id = r.payload.get("upload_id")
                title = r.payload.get("doc_title")

                if upload_id and upload_id not in files:
                    files[upload_id] = {
                        "id": upload_id,
                        "name": title
                    }

            return jsonify(list(files.values()))

        except Exception as e:
            print("Error fetching files:", e)
            return jsonify({"error": "Failed to fetch files"}), 500
        

    @app.delete("/api/files/<file_id>")
    def delete_file(file_id):
        course_code = request.args.get("course_code")

        if not course_code:
            return jsonify({"error": "Missing course_code"}), 400

        from qdrant_client.models import Filter, FieldCondition, MatchValue

        client.delete(
            collection_name=course_code,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="upload_id",
                        match=MatchValue(value=file_id)
                    )
                ]
            )
        )

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
                    field_name="upload_id",
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


        qvec = embed_with_e5([f"query: {q}"])[0]
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
        qvec = embed_with_e5([f"query: {q}"])[0]
        print("query embedded")

        # 2. Qdrant search
        results = client.query_points(
            collection_name=course_code,
            query=qvec,
            limit=5
        )

        # Print out points
        hits = results.points
        print(f"qdrant search completed: {len(hits)} hits")
        for h in hits:
            print(f"  score={h.score:.4f} | doc={h.payload.get('doc_title')} | section={h.payload.get('section_header')} | text_preview={str(h.payload.get('text',''))[:80]}")

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

        
        Give a citation for all of the context you used as a new line for each part in the form of Citation: Title: title, Section Header: section header, Page numbers: page numbers using the metadata from the {context}
        Format the entire answer including citations in HTML, using <strong> for emphasis and <br> for new lines.
        Include clear titles based on the {context} provided, and do not include any words related to HTML concepts unless specifically mentioned in the {context}. Specifically, do not include a title listed HTML Answer in any form unless the {context} explicitly includes a section header with the title HTML Answer. If the {context} does not include a section header with the title HTML Answer, do not include any titles in your answer.
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