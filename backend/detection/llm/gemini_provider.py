import os
import logging
from .base import BaseLLMProvider
from google import genai  # The official unified Google GenAI SDK

logger = logging.getLogger(__name__)

class GeminiProvider(BaseLLMProvider):
    """
    Primary provider interfacing directly with Google's Gemini models
    using the modern 'google-genai' SDK.
    """
    def __init__(self):
        # We look for GEMINI_API_KEY directly now
        self.api_key = os.environ.get("GEMINI_API_KEY")
        self.model = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
        
        # Initialize direct Google GenAI client
        self.client = genai.Client(api_key=self.api_key) if self.api_key else None

    def generate_summary(self, timeline_events: list, risk_score: float) -> str:
        if not self.client:
            raise ValueError("Gemini Client not initialized: missing GEMINI_API_KEY.")

        events_str = "\n".join([
            f"- At {e.get('offset', 0)}s: {e.get('type', 'Other')} (Confidence: {e.get('confidence', 0.0):.2f}) - {e.get('description', '')}"
            for e in timeline_events
        ])

        prompt = (
            f"You are DrishtiRakshak AI, an explainable connected-vehicle threat risk observer on Indian roads.\n"
            f"Analyze the following timeline events and provide a clean, professional, and objective summary "
            f"of the event sequence, traffic context, and safety implications.\n\n"
            f"Computed Rules-Based Heuristic Risk Score: {risk_score:.2f} / 1.00\n\n"
            f"Timeline Events Observed:\n{events_str}\n\n"
            f"Requirements:\n"
            f"- Format your response as a professional, 2-3 sentence markdown description.\n"
            f"- Do not use sensationalized or subjective language.\n"
            f"- Frame risk strictly based on the heuristic score provided."
        )

        try:
            # Native Google GenAI call
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
            )
            return response.text.strip()
        except Exception as e:
            logger.error(f"Direct Gemini API request failed for model {self.model}: {e}")
            raise e