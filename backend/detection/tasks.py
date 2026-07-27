import logging
import uuid
from celery import shared_task
from django.db import transaction

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def process_evidence_task(self, evidence_id_str: str):
    """
    Celery background task that runs the process_evidence orchestrator.
    Handles exceptions like VideoReadError, capturing errors directly on the model.
    """
    from evidence.models import Evidence
    from detection.pipeline import process_evidence  # Isolation constraint boundary
    from detection.service import VideoReadError

    try:
        evidence_id = uuid.UUID(evidence_id_str)
    except ValueError as val_err:
        logger.error(f"Provided evidence_id is not a valid UUID: {evidence_id_str}")
        return "INVALID_UUID"

    try:
        # Atomic lock on the record to transition status to PROCESSING
        with transaction.atomic():
            evidence = Evidence.objects.select_for_update().get(pk=evidence_id)
            
            if evidence.processing_status == Evidence.ProcessingStatus.PROCESSING:
                logger.warning(f"Evidence {evidence_id} is already processing. Terminating task.")
                return "ALREADY_PROCESSING"

            evidence.processing_status = Evidence.ProcessingStatus.PROCESSING
            evidence.task_id = self.request.id
            evidence.save(update_fields=["processing_status", "task_id"])

        # Execute the pipeline synchronously inside the worker thread
        process_evidence(evidence)

        # Refresh the instance from the database to capture changes made in process_evidence (processed, lock states)
        evidence.refresh_from_db()
        evidence.processing_status = Evidence.ProcessingStatus.COMPLETED
        evidence.error_message = None
        evidence.save(update_fields=["processing_status", "error_message"])
        
        return "SUCCESS"

    except (VideoReadError, Exception) as exc:
        logger.exception(f"Pipeline processing failed for Evidence {evidence_id_str}")
        
        # Roll back transactional locks and safely persist failure states
        try:
            from django.db import connection
            if connection.needs_rollback:
                connection.rollback()
                
            evidence = Evidence.objects.get(pk=evidence_id)
            evidence.processing_status = Evidence.ProcessingStatus.FAILED
            evidence.error_message = str(exc)
            evidence.save(update_fields=["processing_status", "error_message"])
        except Exception as db_err:
            logger.critical(f"Database update of failure status failed for Evidence {evidence_id_str}: {db_err}")
            
        raise exc