from dotenv import load_dotenv
load_dotenv()

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from qdrant_client.http.models import PointStruct
from server.qdrant_service import client
from server.embeddings import embed_texts, embed_query


def create_app():
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

        # Validate docs
        for i, d in enumerate(docs):
            if "id" not in d or "text" not in d:
                return jsonify({"error": f"Document at index {i} must include 'id' and 'text'"}), 400

        vectors = embed_texts([d["text"] for d in docs])

        points = [
            PointStruct(
                id=d["id"],
                vector=v,
                payload={**(d.get("meta") or {}), "text": d["text"]},
            )
            for d, v in zip(docs, vectors)
        ]

        return jsonify({"ok": True, "count": len(points)})

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
        
        return jsonify(
            {
                "results": [
                    {"id": h.id, "score": h.score, "payload": h.payload}
                    for h in hits
                ]
            }
        )

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="127.0.0.1", port=port, debug=True)
