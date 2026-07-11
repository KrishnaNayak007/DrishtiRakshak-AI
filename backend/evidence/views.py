from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from evidence.models import Evidence
from evidence.serializers import EvidenceSerializer
from detection.pipeline import process_evidence
from detection.service import VideoReadError

class EvidenceViewSet(viewsets.ModelViewSet):
    """
    Standard CRUD for uploading evidence clips, plus one custom action:
    POST /api/evidence/{id}/process/ — runs the detection+risk pipeline.

    Kept as an explicit, separate action (not automatic on upload) so that
    processing time — which will grow once real CV inference is enabled —
    never blocks the upload request itself. This is deliberately synchronous
    for now; Month 2+ note below explains when that should change.

    PLANNED: once real ultralytics inference makes /process/ slow enough to
    time out an HTTP request, move it to a Celery task. Not needed yet with
    the stub detector, and adding Celery before that pain exists would be
    exactly the premature complexity we agreed to avoid.
    """

    queryset = Evidence.objects.all()
    serializer_class = EvidenceSerializer
    parser_classes = [MultiPartParser, FormParser]

    @action(detail=True, methods=["post"])
    def process(self, request, pk=None):
        evidence = self.get_object()

        if evidence.locked:
            return Response(
                {"detail": "This evidence is already locked/processed and cannot be reprocessed."},
                status=status.HTTP_409_CONFLICT,
            )

        try:
            incident = process_evidence(evidence)
        except VideoReadError as e:
            return Response(
                {"detail": f"Could not process video: {e}"},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        evidence.refresh_from_db()
        serializer = self.get_serializer(evidence)
        return Response(serializer.data, status=status.HTTP_200_OK)
