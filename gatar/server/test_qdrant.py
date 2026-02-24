# SAMPLE TEST FILE TO RUN QDRANT_SERVICE.PY
# python -m server.test_qdrant

from dotenv import load_dotenv
load_dotenv()
import os
from qdrant_client import QdrantClient
from server.qdrant_service import upload_to_qdrant, query_qdrant

load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

print("URL:", QDRANT_URL)
print("API KEY exists:", QDRANT_API_KEY is not None)

client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY
)

collections = client.get_collections()
print("Connected successfully.")
print("Collections:", collections)

test_chunks = [
    {
        "text": "Databases are helpful.",
        "source": "sample.pdf",
        "page": 1
    },
    {
        "text": "Databases are useful.",
        "source": "sample.pdf",
        "page": 2
    }
]

collection_name = "test"
upload_to_qdrant(test_chunks, collection_name)

results = query_qdrant(
    query="Why use a database?",
    collection_name="docs",
    top_k=3
)

for r in results:
    print(r)