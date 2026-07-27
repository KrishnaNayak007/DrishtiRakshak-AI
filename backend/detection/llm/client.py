import logging
from .gemini_provider import GeminiProvider
from .fallback_provider import RuleBasedFallbackProvider

logger = logging.getLogger(__name__)

class LLMClient:
    """
    Public LLM Client interface orchestrating primary Gemini model generation
    and fallback to rule-based explanations.
    """
    def __init__(self):
        self.primary = GeminiProvider()
        self.fallback = RuleBasedFallbackProvider()

    def generate_summary(self, timeline_events: list, risk_score: float) -> str:
        if not self.primary.api_key:
            logger.info("GEMINI_API_KEY not found in environment. Defaulting to local fallback provider.")
            return self.fallback.generate_summary(timeline_events, risk_score)

        try:
            return self.primary.generate_summary(timeline_events, risk_score)
        except Exception as e:
            logger.warning(f"Primary Gemini generation failed ({e}). Dropping back to rule-based fallback.")
            return self.fallback.generate_summary(timeline_events, risk_score)