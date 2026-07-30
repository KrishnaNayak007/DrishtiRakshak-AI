import logging
import hashlib
import os
from typing import List

from evidence.models import Evidence, TimelineEvent
from incidents.models import Incident

from detection.risk import score_frames
from detection.service import detect_video

# Phase 3 Orchestration Imports
from detection.llm.client import LLMClient
from detection.vector_store import QdrantVectorStore

logger = logging.getLogger(__name__)

# Pull configured sample rate from environment variables, defaulting safely to 15 (2 FPS)
SAMPLE_RATE = int(os.environ.get("CV_SAMPLE_RATE", 15))


def generate_local_fallback_embedding(text: str, dimension: int = 384) -> List[float]:
    """
    Generates a deterministic vector representation of text for offline/fallback use.
    """
    hasher = hashlib.sha256(text.encode("utf-8"))
    hash_bytes = hasher.digest()
    
    # Repeat and scale bytes to fill the target vector dimensions
    vector = []
    for i in range(dimension):
        byte_val = hash_bytes[i % len(hash_bytes)]
        # Normalize to a float range between -1.0 and 1.0
        normalized = (byte_val / 127.5) - 1.0
        vector.append(normalized)
        
    return vector


def process_evidence(evidence: Evidence) -> Incident:
    """
    Runs detection + heuristic risk scoring on an Evidence video.
    """
    # 1. Run core CV inference with temporal decimation
    frame_detections = detect_video(evidence.video_file.path, sample_every_n_frames=SAMPLE_RATE)
    assessment = score_frames(frame_detections)

    # 2. Persist high-frequency Timeline Events
    timeline_event_objects = []
    serialized_events_for_llm = []

    for event in assessment.events:
        db_event = TimelineEvent.objects.create(
            evidence=evidence,
            timestamp_offset_seconds=event.timestamp_seconds,
            event_type=event.event_type,
            confidence=event.confidence,
            description=event.description,
        )
        timeline_event_objects.append(db_event)
        
        # Structure payload for our LLM client
        serialized_events_for_llm.append({
            "offset": event.timestamp_seconds,
            "type": event.event_type,
            "confidence": event.confidence,
            "description": event.description
        })

    # 3. Generate the dynamic summary using our LLM Client abstraction
    logger.info(f"Generating dynamic incident report summary for Evidence {evidence.id}")
    llm_client = LLMClient()
    generated_summary = llm_client.generate_summary(
        timeline_events=serialized_events_for_llm,
        risk_score=assessment.risk_score
    )

    # 4. Save the incident in Postgres database
    incident, _ = Incident.objects.update_or_create(
        evidence=evidence,
        defaults={
            "risk_score": assessment.risk_score, 
            "summary": generated_summary
        },
    )

    # 5. Index the incident inside our Qdrant Semantic Memory database
    organization_id = str(evidence.vehicle.organization.id)
    
    logger.info(f"Indexing incident vectors in Qdrant for Tenant organization {organization_id}")
    qdrant_store = QdrantVectorStore()
    
    # Initialize collection if not already active
    qdrant_store.init_collection()

    # Generate semantic embedding matching Qdrant schema vector dimension rules.
    vector = llm_client.generate_embedding(
        text=generated_summary,
        dimension=qdrant_store.VECTOR_DIMENSION
    )

    # Prepare search payload metadata
    payload = {
        "incident_id": str(incident.id),
        "evidence_id": str(evidence.id),
        "vehicle_id": str(evidence.vehicle.id),
        "risk_score": assessment.risk_score,
        "summary": generated_summary,
        "timeline_events_count": len(serialized_events_for_llm)
    }

    # Upsert directly to Qdrant collection
    qdrant_store.upsert_event_vector(
        event_id=str(incident.id),
        vector=vector,
        organization_id=organization_id,
        payload=payload
    )

    # 6. Lock evidence and finalize state
    evidence.processed = True
    evidence.save(update_fields=["processed"])
    evidence.lock()

    logger.info(f"Successfully processed and indexed Evidence {evidence.id}")
    return incident