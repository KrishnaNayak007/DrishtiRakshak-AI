# backend/evidence/vector_store.py
import os
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue

class VectorStore:
    def __init__(self, collection_name="drishti_evidence"):
        host = os.getenv("QDRANT_HOST", "localhost")
        port = int(os.getenv("QDRANT_PORT", 6333))
        self.client = QdrantClient(host=host, port=port)
        self.collection_name = collection_name
        self._ensure_collection()

    def _ensure_collection(self):
        try:
            collections = self.client.get_collections().collections
            exists = any(c.name == self.collection_name for c in collections)
            if not exists:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=768, distance=Distance.COSINE),
                )
        except Exception as e:
            print(f"Failed to query/configure Qdrant collection: {e}")

    def search_evidence(self, query_vector: list[float], organization_id: str, limit: int = 5):
        # Multi-Tenant Payload Isolation Filter
        filter_query = Filter(
            must=[
                FieldCondition(
                    key="organization_id",
                    match=MatchValue(value=str(organization_id))
                )
            ]
        )
        return self.client.search(
            collection_name=self.collection_name,
            query_vector=query_vector,
            query_filter=filter_query,
            limit=limit
        )