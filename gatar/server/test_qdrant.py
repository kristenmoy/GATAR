# SAMPLE TEST FILE TO RUN QDRANT_SERVICE.PY
# python -m server.test_qdrant

from dotenv import load_dotenv
load_dotenv()
import os
from qdrant_client import QdrantClient
from server.qdrant_service import upload_to_qdrant, query_qdrant, get_client

load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

print("URL:", QDRANT_URL)
print("API KEY exists:", QDRANT_API_KEY is not None)

client = get_client()
# print("Before delete:", client.get_collections())
# client.delete_collection("test")
# print("After delete:", client.get_collections())

collections = client.get_collections()
print("Connected successfully.")
print("Collections:", collections)

test_chunks = [
    {
        "text": "Databases store and organize data efficiently.",
        "doc_title": "Intro to Databases",
        "section_header": "What is a Database?",
        "page": 1
    },
    {
        "text": "Indexes improve query performance by reducing search time.",
        "doc_title": "Intro to Databases",
        "section_header": "Indexing",
        "page": 5
    },
    {
        "text": "Normalization reduces redundancy and improves data integrity.",
        "doc_title": "Database Design",
        "section_header": "Normalization",
        "page": 10
    },
    {
        "text": "Client-server architecture allows systems to communicate over a network.",
        "doc_title": "Computer Networks",
        "section_header": "Architecture Models",
        "page": 3
    },
    {
        "text": "Protocols define rules for communication between systems, such as HTTP and TCP.",
        "doc_title": "Computer Networks",
        "section_header": "Network Protocols",
        "page": 7
    }
]

collection_name = "test"
upload_to_qdrant(test_chunks, collection_name, course_code="CIS4301")

results = query_qdrant(
    query="How do systems talk to each other?",
    collection_name="test",
    course_code="CIS4301"
)

for r in results:
    print(r)

client.close()