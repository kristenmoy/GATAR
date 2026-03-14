# SAMPLE TEST FILE TO RUN QDRANT_SERVICE.PY
# python -m server.test_qdrant

from dotenv import load_dotenv
load_dotenv()

import os
from qdrant_client import QdrantClient
from server.qdrant_service import upload_to_qdrant, query_qdrant, get_client

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

print("URL:", QDRANT_URL)
print("API KEY exists:", QDRANT_API_KEY is not None)

client = get_client()

collections = client.get_collections()
print("Connected successfully.")
print("Collections:", collections)

# Updated chunk structure
test_chunks = [
    {
        "text_for_embedding": "passage: Databases are helpful.",
        "metadata": {
            "title": "sample.pdf",
            "section_header": "Intro",
            "pages": "1",
            "paragraph_ids": [1]
        }
    },
    {
        "text_for_embedding": "passage: Databases are useful.",
        "metadata": {
            "title": "sample.pdf",
            "section_header": "Intro",
            "pages": "2",
            "paragraph_ids": [2]
        }
    }
]

collection_name = "test"

upload_to_qdrant(test_chunks, collection_name)

results = query_qdrant(
    query="Why use a database?",
    collection_name="test",
    top_k=3
)

for r in results:
    print(r)