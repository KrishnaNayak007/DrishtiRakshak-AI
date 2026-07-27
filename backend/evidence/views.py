from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from common.permissions import IsTenantMember, TenantScopedQuerySetMixin
from evidence.models import Evidence
from evidence.serializers import EvidenceSerializer
from detection.tasks import process_evidence_task  # Changed from pipeline import to task import


class EvidenceViewSet(TenantScopedQuerySetMixin, viewsets.ModelViewSet):
    """
    Standard CRUD for uploading evidence clips, plus one custom action:
    POST /api/evidence/{id}/process/ — schedules the detection+risk pipeline.
    """

    # Explicit order_by guarantees stable database pagination and silences warnings [11]
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