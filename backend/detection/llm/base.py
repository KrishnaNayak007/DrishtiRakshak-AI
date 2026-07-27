class BaseLLMProvider:
    """
    Abstract interface defining capabilities for DrishtiRakshak LLM integrations.
    """
    def generate_summary(self, timeline_events: list, risk_score: float) -> str:
        """
        Generates a semantic report based on timeline events and calculated threat risk.
        """
        raise NotImplementedError