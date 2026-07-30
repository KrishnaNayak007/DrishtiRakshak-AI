# backend/evidence/views.py
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from common.permissions import IsTenantMember, TenantScopedQuerySetMixin
from evidence.models import Evidence
from evidence.serializers import EvidenceSerializer
from detection.tasks import process_evidence_task

# Semantic search and multi-tenant vector storage imports
from detection.llm import LLMClient
from detection.vector_store import QdrantVectorStore  # Corrected Import
from qdrant_client.models import Filter, FieldCondition, MatchValue


class EvidenceViewSet(TenantScopedQuerySetMixin, viewsets.ModelViewSet):
    """
    Standard CRUD for uploading evidence clips, plus custom actions:
    POST /api/evidence/{id}/process/ — schedules the detection+risk pipeline.
    POST /api/evidence/search/ — performs a tenant-scoped semantic query.
    """

    # Explicit order_by guarantees stable database pagination and silences warnings
    queryset = Evidence.objects.all().order_by("-uploaded_at")
    serializer_class = EvidenceSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsTenantMember]

    @action(detail=True, methods=["post"])
    def process(self, request, pk=None):
        evidence = self.get_object()  # Multi-tenant scoping automatically verified here

        if evidence.locked:
            return Response(
                {"detail": "This evidence is already locked/processed and cannot be reprocessed."},
                status=status.HTTP_409_CONFLICT,
            )

        # Prevent duplicate processing tasks if one is already pending or actively executing
        if evidence.processing_status in [Evidence.ProcessingStatus.PROCESSING, Evidence.ProcessingStatus.PENDING]:
            return Response(
                {
                    "detail": "Processing is already active or queued for this evidence item.",
                    "status": evidence.processing_status,
                    "task_id": evidence.task_id
                },
                status=status.HTTP_200_OK
            )

        # Update local model state to PENDING and wipe out past failures
        evidence.processing_status = Evidence.ProcessingStatus.PENDING
        evidence.error_message = None
        evidence.save(update_fields=["processing_status", "error_message"])

        # Schedule async worker task passing UUID string representation
        task = process_evidence_task.delay(str(evidence.id))

        # Save generated task signature identifier
        evidence.task_id = task.id
        evidence.save(update_fields=["task_id"])

        # Return updated serialized object context back immediately with HTTP 202
        evidence.refresh_from_db()
        serializer = self.get_serializer(evidence)
        return Response(serializer.data, status=status.HTTP_202_ACCEPTED)

    @action(detail=False, methods=["post"], url_path="search")
    def semantic_search(self, request):
        """
        POST /api/evidence/search/
        Payload: {"query": "dangerous motorcycle overtaking"}
        
        Applies current active tenant organization ID as a strict isolation 
        filter parameter to Qdrant.
        """
        query_text = request.data.get("query")
        if not query_text:
            return Response(
                {"detail": "A semantic query string 'query' is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Retrieve tenant scope from active authenticated operator session
        user = request.user
        organization_id = getattr(user, "organization_id", None)
        if not organization_id and hasattr(user, "organization"):
            org = getattr(user, "organization", None)
            organization_id = getattr(org, "id", None) if org else None

        if not organization_id:
            return Response(
                {"detail": "No tenant context mapped to the active session."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            # 1. Generate text embedding vector using LLMClient (768 dimensions)
            llm_client = LLMClient()
            query_vector = llm_client.generate_embedding(query_text)

            # 2. Query Qdrant with tenant isolation logic applied on the underlying client
            qdrant_store = QdrantVectorStore()
            
            # Dynamically pull the registered collection name from your vector store module
            collection_name = getattr(qdrant_store, "collection_name", None) or getattr(qdrant_store, "COLLECTION_NAME", "drishti_events")

            raw_hits = qdrant_store.client.search(
                collection_name=collection_name,
                query_vector=query_vector,
                query_filter=Filter(
                    must=[
                        FieldCondition(
                            key="organization_id",
                            match=MatchValue(value=str(organization_id))
                        )
                    ]
                ),
                limit=10
            )

            # 3. Structure search payload matching frontend serializers
            results = []
            for hit in raw_hits:
                results.append({
                    "id": hit.id,
                    "score": hit.score,
                    "payload": hit.payload
                })

            return Response({"results": results}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"detail": f"Vector search operation failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )