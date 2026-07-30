# backend/detection/llm/fallback_provider.py
import hashlib
import logging
from .base import BaseLLMProvider

logger = logging.getLogger(__name__)

class RuleBasedFallbackProvider(BaseLLMProvider):
    """
    A non-ML fallback provider that compiles a deterministic summary of timeline events.
    Guarantees explanation continuity without external network requests.
    """
    def generate_summary(self, timeline_events: list, risk_score: float) -> str:
        if not timeline_events:
            return (
                f"Nominal operating conditions. DrishtiRakshak AI observed no significant threat "
                f"events. The rules-based heuristic risk score is {risk_score:.2f}."
            )

        event_counts = {}
        for event in timeline_events:
            etype = event.get("type", "Other").replace("_", " ").title()
            event_counts[etype] = event_counts.get(etype, 0) + 1

        summary_parts = [f"{count} x {etype}" for etype, count in event_counts.items()]
        events_summary = ", ".join(summary_parts)

        # Classify the threat levels strictly using our heuristic risk score
        if risk_score >= 0.7:
            threat_context = "critical safety concerns requiring review"
        elif risk_score >= 0.4:
            threat_context = "moderate alert status under observation"
        else:
            threat_context = "minimal threat conditions"

        return (
            f"DrishtiRakshak Local Fallback Report: Observed {events_summary} across the captured "
            f"timeline. The explainable heuristic threat assessment sits at {risk_score:.2f} / 1.00, "
            f"indicating {threat_context}."
        )

    def generate_embedding(self, text: str, dimension: int = 384) -> list[float]:
        """
        Generates a deterministic vector representation of text for offline/fallback use.
        Ensures that Qdrant indexing does not crash if there is no internet or active API key.
        """
        logger.info(f"Generating deterministic local fallback embedding of dimension {dimension}")
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