from dotenv import load_dotenv
load_dotenv()

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from qdrant_client.http.models import PointStruct
from qdrant_client.models import VectorParams, Distance
from server.qdrant_service import get_client, upload_to_qdrant, query_qdrant
from server.test_chunking import pdf_to_embedded_chunks, embed_with_e5, build_llm_context
from server.test_chunking import client as llm_client
import uuid

#COLLECTION = os.getenv("QDRANT_COLLECTION")

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

        # check if valid PDF file uploaded
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400


        file = request.files["file"]
        course_code = request.form.get("course_code")

        if not course_code:
            return jsonify({"error": "Missing course_code"}), 400


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
                        "course_code": course_code
                    }
                )
                points.append(point)


            client.upsert(collection_name=course_code, points=points)


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


    @app.post("/api/create-course")
    def create_course():
        data = request.get_json(force=True) or {}
        course_code = data.get("course_code")

        if not course_code:
            return jsonify({"error": "Missing course_code"}), 400

        course_code = course_code.upper()

        client = get_client()

        existing = [c.name for c in client.get_collections().collections]

        if course_code not in existing:
            client.create_collection(
                collection_name=course_code,
                vectors_config=VectorParams(
                    size=1024,
                    distance=Distance.COSINE
                )
            )

            client.create_payload_index(
                collection_name=course_code,
                field_name="course_code",
                field_schema="keyword"
            )

        if "courses" not in existing:
            client.create_collection(
                collection_name="courses",
                vectors_config=VectorParams(
                    size=1,
                    distance=Distance.COSINE
                )
            )

        client.upsert(
            collection_name="courses",
            points=[
                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=[0.0],
                    payload={"course_code": course_code}
                )
            ]
        )

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
   
    # @app.post("/api/ask")
    # def ask():
    #     # future addition: add memory so chatbot remembers conversation
    #     data = request.json
    #     question = data.get("question")
    #     course_code = data.get("course_code")


    #     if not question:
    #         return jsonify({"error": "No question provided"}), 400


    #     try:
    #         # embed question with e5 then search qdrant for top results
    #         '''
    #         add a query filter by course  later
    #         query_filter={
    #             "must": [
    #                 {"key": "title", "match": {"value": course}}
    #             ]
    #         }
    #         '''
    #         query_vector = embed_with_e5([f"query: {question}"])[0]


    #         results = client.search(
    #             collection_name=course_code,
    #             query_vector=query_vector,
    #             limit=5
    #         )


    #         # make sure LLM uses only the retrieved similarity vectors
    #         context = build_llm_context(results)


    #         # prompt design
    #         response = llm_client.responses.create(
    #             model="gpt-5.1",
    #             input=f"""
    #             - Answer the question using ONLY the context below.
    #             - DO NOT use any outside context or sources to answer this question.
    #             - DO NOT make up information.
    #             - If the answer is not in the context, then say "I don't know based on the provided material."
    #             - Be clear and concise.
    #             - Cite sources using (Page X-Y).


    #             Context:
    #             {context}


    #             Question:
    #             {question}
    #             """
    #         )


    #         answer = response.output_text.strip()


    #         return jsonify({
    #             "answer": answer,
    #             "sources": [r.payload for r in results]
    #         })


    #     except Exception as e:
    #         print("Query failed:", repr(e))
    #         return jsonify({"error": "Query failed"}), 500


    @app.post("/api/chat")
    def chat():
        print("made it to chat")
        data = request.get_json(force=True) or {}
        q = data.get("message", "")
        print("question is: ", q)
        if not q:
            return jsonify({"error": "Missing message"}), 400

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
        for i in hits:
            print(type(i))
            print(i.payload)
        print("qdrant search completed")

        # 3. Build context
        context = build_llm_context(hits)
        print("finished building context")

        # 4. Prompt design
        prompt = f"""
        You are a helpful tutor.

        - Use ONLY the context below to answer the question.
        - DO NOT use any outside context or sources other than what is provided.
        - If you do not have enough context to answer, say "I do not have enough context to answer this question"

        Context:
        {context}

        Question:
        {q}

        Answer clearly and concisely.
        """

        response = llm_client.responses.create(
            model="gpt-oss-120b",
            input=prompt
        )

        answer = response.output_text
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
    app.run(host="127.0.0.1", port=port, debug=True)


