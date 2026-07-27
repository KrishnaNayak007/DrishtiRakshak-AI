from .base import BaseLLMProvider

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