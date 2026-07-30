import os
import logging
from .base import BaseLLMProvider
from google import genai  # The official unified Google GenAI SDK
from google.genai import types

logger = logging.getLogger(__name__)

class GeminiProvider(BaseLLMProvider):
    """
    Primary provider interfacing directly with Google's Gemini models
    using the modern 'google-genai' SDK with performance configurations.
    """
    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY")
        
        # Read environment or default to gemini-3.5-flash
        model_env = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash")
        
        # Maps retired/legacy models that are restricted for new API projects
        legacy_models = {
            "gemini-1.5-flash",
            "gemini-2.0-flash",
            "gemini-2.5-flash"
        }
        
        # Self-healing interceptor to dynamically upgrade any legacy models
        if model_env in legacy_models:
            logger.info(f"Legacy model '{model_env}' detected in environment. Dynamically upgrading to 'gemini-3.5-flash'.")
            self.model = "gemini-3.5-flash"
        else:
            self.model = model_env
            
        self.embedding_model = os.environ.get("EMBEDDING_MODEL", "text-embedding-004")
        
        # Initialize direct Google GenAI client
        self.client = genai.Client(api_key=self.api_key) if self.api_key else None

    def generate_summary(self, timeline_events: list, risk_score: float) -> str:
        if not self.client:
            raise ValueError("Gemini Client not initialized: missing GEMINI_API_KEY.")

        # Compress timeline description strings to preserve token context
        events_str = "\n".join([
            f"- At {e.get('offset', 0)}s: {e.get('type', 'Other')} (Conf: {e.get('confidence', 0.0):.2f})"
            for e in timeline_events
        ])

        # Core payload focusing strictly on telemetry numbers
        prompt = (
            f"Computed Rules-Based Heuristic Risk Score: {risk_score:.2f} / 1.00\n\n"
            f"Timeline Events Observed:\n{events_str}"
        )

        try:
            # Native Google GenAI call with optimized parameters for complete generation
            config = types.GenerateContentConfig(
                system_instruction=(
                    "You are DrishtiRakshak AI, an explainable connected-vehicle threat risk observer on Indian roads. "
                    "Analyze timeline events and provide a clean, professional, objective summary of the event sequence. "
                    "Format response strictly as a professional, 2-3 sentence markdown description. "
                    "Do not use sensationalized language, and frame risk strictly on the heuristic score."
                ),
                temperature=0.4,       # Predictable, fluent generation
                max_output_tokens=300,  # Ample token headroom to prevent truncation
            )

            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=config
            )
            
            # Sanitize Windows carriage returns (\r\n and \r) to prevent terminal cursor overwrites
            clean_text = response.text.strip().replace('\r\n', '\n').replace('\r', ' ')
            return clean_text
        except Exception as e:
            logger.error(f"Direct Gemini API request failed for model {self.model}: {e}")
            raise e

    def generate_embedding(self, text: str, dimension: int = 768) -> list[float]:
        """
        Generates semantic text embeddings with target output dimensions.
        """
        if not self.client:
            raise ValueError("Gemini Client not initialized: missing GEMINI_API_KEY.")

        try:
            # Enforce target output dimensionality inside the API call config
            config = types.EmbedContentConfig(output_dimensionality=dimension)
            response = self.client.models.embed_content(
                model=self.embedding_model,
                contents=text,
                config=config
            )
            if response.embeddings and len(response.embeddings) > 0:
                return response.embeddings[0].values
            raise ValueError("No embeddings returned from Gemini service.")
        except Exception as e:
            logger.error(f"Direct Gemini embedding call failed for model {self.embedding_model}: {e}")
            raise e