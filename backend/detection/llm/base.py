# backend/detection/llm/base.py
from abc import ABC, abstractmethod

class BaseLLMProvider(ABC):
    """
    Abstract interface defining capabilities for DrishtiRakshak LLM integrations.
    """
    @abstractmethod
    def generate_summary(self, timeline_events: list, risk_score: float) -> str:
        """
        Generates a semantic report based on timeline events and calculated threat risk.
        """
        pass

    @abstractmethod
    def generate_embedding(self, text: str, dimension: int = 768) -> list[float]:
        """
        Generates a high-dimensional semantic vector representing the text.
        """
        pass