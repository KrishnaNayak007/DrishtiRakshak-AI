import logging
import os
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.exceptions import UnexpectedResponse

logger = logging.getLogger(__name__)

# Defaults matching standard docker deployment ports
QDRANT_HOST = os.environ.get("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.environ.get("QDRANT_PORT", 6333))
QDRANT_API_KEY = os.environ.get("QDRANT_API_KEY", None)

class QdrantVectorStore:
    """
    Manager class handling communication with the Qdrant vector database.
    Establishes schemas and runs multi-tenant filtered vector queries.
    """
    COLLECTION_NAME = "drishti_evidence_events"
    
    # We will assume a standard 384-dimensional dense vector for lightweight 
    # open-source text embeddings (like sentence-transformers/all-MiniLM-L6-v2).
    # If utilizing Gemini's text-embedding-004, this dimension will be 768.
    VECTOR_DIMENSION = int(os.environ.get("EMBEDDING_DIMENSION", 384))

    def __init__(self):
        self.client = QdrantClient(
            host=QDRANT_HOST,
            port=QDRANT_PORT,
            api_key=QDRANT_API_KEY,
            timeout=5.0
        )

    def init_collection(self) -> bool:
        """
        Idempotently initializes the collection with correct indexing configurations.
        Uses cosine distance for semantic relevance optimization.
        """
        try:
            # Check if collection already exists
            collections_response = self.client.get_collections()
            exist = any(c.name == self.COLLECTION_NAME for c in collections_response.collections)
            
            if exist:
                logger.info(f"Qdrant collection '{self.COLLECTION_NAME}' already initialized.")
                return True

            logger.info(f"Creating new Qdrant collection: {self.COLLECTION_NAME}")
            self.client.create_collection(
                collection_name=self.COLLECTION_NAME,
                vectors_config=models.VectorParams(
                    size=self.VECTOR_DIMENSION,
                    distance=models.Distance.COSINE
                )
            )

            # Create an payload index on organization_id to speed up tenant-isolated lookups
            self.client.create_payload_index(
                collection_name=self.COLLECTION_NAME,
                field_name="organization_id",
                field_schema=models.PayloadSchemaType.KEYWORD,
            )
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize Qdrant collection: {e}")
            return False

    def upsert_event_vector(
        self, 
        event_id: str, 
        vector: List[float], 
        organization_id: str,
        payload: Dict[str, Any]
    ) -> bool:
        """
        Upserts a single timeline event or incident vector payload.
        Enforces payload properties for multi-tenant isolation.
        """
        # Ensure critical isolation key is embedded inside the payload
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
        query_vector: List[float], 
        organization_id: str, 
        limit: int = 5,
        score_threshold: Optional[float] = None
    ) -> List[Dict[str, Any]]:
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
        except UnexpectedResponse as ur:
            logger.error(f"Unexpected response from Qdrant during search: {ur}")
            return []
        except Exception as e:
            logger.error(f"Qdrant query execution error: {e}")
            return []