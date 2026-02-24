import uuid
import os
from qdrant_client import QdrantClient
from qdrant_client.models import ( VectorParams, Distance, PointStruct, Filter )
from server import embed_with_e5

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION = os.getenv("QDRANT_COLLECTION", "docs")
EMBED_DIM = int(os.getenv("EMBED_DIM", "384"))

#client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
def get_client():
    return QdrantClient(
        url=os.getenv("QDRANT_URL"),
        api_key=os.getenv("QDRANT_API_KEY"),
        prefer_grpc=False
    )

''' add embeddings to qdrant
create a collection (one for each class)
add vectors (from embedding_chunks) '''
def upload_to_qdrant(embedding_chunks, collection_name):

    client = get_client()

    if not embedding_chunks:
        print("No chunks to upload.")
        return

    vectors = embed_with_e5(
        [f"passage: {chunk['text']}" for chunk in embedding_chunks]
    )

    if len(vectors) != len(embedding_chunks):
        raise ValueError("Mismatch between embeddings and chunks.")
    
    vector_size = len(vectors[0])

    # Create Collection
    collections = client.get_collections().collections
    existing_collections = [c.name for c in collections]

    if collection_name not in existing_collections:
        print(f"Creating collection: {collection_name}")

        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(
                size=vector_size,
                distance=Distance.COSINE
            )
        )

    # Create Qdrant Points
    points = []

    for chunk, vector in zip(embedding_chunks, vectors):
        point = PointStruct(
            id=str(uuid.uuid4()),
            vector=vector,
            payload={
                "text": chunk["text"],
                "source": chunk.get("source"),
                "page": chunk.get("page")
            }
        )
        points.append(point)

    # Upload
    client.upsert(
        collection_name=collection_name,
        points=points
    )

    print(f"Uploaded {len(points)} chunks to '{collection_name}' successfully.")


''' RAG retrieval
Embed the query, conduct a qdrant search & return results 
top_k refers to the top vector similarity results for the query '''
def query_qdrant(query, collection_name, top_k=5):
    client = get_client()

    # Embed Query
    query_embedding = embed_with_e5([f"query: {query}"])[0]

    # Search Qdrant
    results = client.query_points(
        collection_name=collection_name,
        query=query_embedding,
        limit=top_k
    ).points

    # Format Results
    return [
        {
            "id": r.id,
            "score": r.score,
            "payload": r.payload
        }
        for r in results
    ]
