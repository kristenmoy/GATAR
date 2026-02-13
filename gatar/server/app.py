from flask import Flask, jsonify, request
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    @app.get("/api/health")
    def health():
        return jsonify(status="ok")

    @app.post("/api/ask")
    def ask():
        data = request.get_json(silent=True) or {}
        question = (data.get("question") or "").strip()
        if not question:
            return jsonify(error="Missing 'question'"), 400

        # TODO: replace with RAG
        answer = f"You asked: {question}"

        return jsonify(answer=answer)

    return app

app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
