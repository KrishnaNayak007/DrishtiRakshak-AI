import os
import logging
from qdrant_client import QdrantClient
from qdrant_client.http import models

logger = logging.getLogger(__name__)

# Defaults matching standard docker deployment ports
QDRANT_HOST = os.environ.get("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.environ.get("QDRANT_PORT", 6333))
QDRANT_API_KEY = os.environ.get("QDRANT_API_KEY", None)

class QdrantVectorStore:
    """
    Manager class handling communication with the Qdrant vector database.
    Idempotent initialization calls are cached inside the container lifecycle.
    """
    COLLECTION_NAME = "drishti_evidence_events"
    VECTOR_DIMENSION = int(os.environ.get("EMBEDDING_DIMENSION", 768)) # Default to 768 for Gemini
    
    # Class-level state cache to eliminate duplicate sequential collection lookups
    _collection_checked = False

    def __init__(self):
        self.client = QdrantClient(
            host=QDRANT_HOST,
            port=QDRANT_PORT,
            api_key=QDRANT_API_KEY,
            timeout=5.0
        )

    def init_collection(self) -> bool:
        """
        Idempotently initializes the collection.
        Uses cached class-level state validation to avoid duplicate API calls.
        """
        # If checked once in this container lifecycle, return immediately (saves sequential round-trip)
        if QdrantVectorStore._collection_checked:
            return True

        try:
            collections_response = self.client.get_collections()
            exist = any(c.name == self.COLLECTION_NAME for c in collections_response.collections)
            
            if exist:
                logger.info(f"Qdrant collection '{self.COLLECTION_NAME}' active.")
                QdrantVectorStore._collection_checked = True
                return True

            logger.info(f"Creating new Qdrant collection: {self.COLLECTION_NAME}")
            self.client.create_collection(
                collection_name=self.COLLECTION_NAME,
                vectors_config=models.VectorParams(
                    size=self.VECTOR_DIMENSION,
                    distance=models.Distance.COSINE
                )
            )

            self.client.create_payload_index(
                collection_name=self.COLLECTION_NAME,
                field_name="organization_id",
                field_schema=models.PayloadSchemaType.KEYWORD,
            )
            
            QdrantVectorStore._collection_checked = True
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize Qdrant collection: {e}")
            return False

    def upsert_event_vector(
        self, 
        event_id: str, 
        vector: list[float], 
        organization_id: str,
        payload: dict
    ) -> bool:
        """
        Upserts a single timeline event or incident vector payload.
        Enforces payload properties for multi-tenant isolation.
        """
        payload["organization_id"] = organization_id

        try:
            self.client.upsert(
                collection_name=self.COLLECTION_NAME,
                points=[
                    models.PointStruct(
                        id=event_id,
                        vector=vector,
                        payload=payload
                    )
                ]
            )
            return True
        except Exception as e:
            logger.error(f"Failed to upsert vector with ID {event_id} to Qdrant: {e}")
            return False

    def search_semantic_events(
        self, 
        query_vector: list[float], 
        organization_id: str, 
        limit: int = 5,
        score_threshold: float = None
    ) -> list[dict]:
        """
        Searches the collection for matching events.
        Strictly applies filter for organization_id to prevent multi-tenant data leaks.
        """
        try:
            results = self.client.search(
                collection_name=self.COLLECTION_NAME,
                query_vector=query_vector,
                query_filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="organization_id",
                            match=models.MatchValue(value=organization_id)
                        )
                    ]
                ),
                limit=limit,
                score_threshold=score_threshold
            )
            
            return [
                {
                    "id": hit.id,
                    "score": hit.score,
                    "payload": hit.payload
                }
                for hit in results
            ]
        except Exception as e:
            logger.error(f"Qdrant query execution error: {e}")
            return []