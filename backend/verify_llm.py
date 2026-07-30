"""
Verification script for DrishtiRakshak AI LLM abstraction.
Runs a test sequence through LLMClient to verify generative pipelines
and rule-based fallbacks.
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'drishtirakshak.settings')

import django
try:
    django.setup()
except Exception:
    pass

from detection.llm.client import LLMClient

def run_test():
    print("=" * 60)
    print("DrishtiRakshak AI - LLM Integration Verification")
    print("=" * 60)

    client = LLMClient()

    mock_events = [
        {
            "offset": 1.2,
            "type": "vehicle_detected",
            "confidence": 0.94,
            "description": "Commercial vehicle detected close to camera view."
        },
        {
            "offset": 3.5,
            "type": "sustained_proximity",
            "confidence": 0.85,
            "description": "Tailgating behavior detected under low-visibility conditions."
        },
        {
            "offset": 5.0,
            "type": "sudden_deceleration",
            "confidence": 0.91,
            "description": "Abrupt brake indicator active in front zone."
        }
    ]

    mock_risk_score = 0.78

    print(f"\nSimulated Risk Score: {mock_risk_score}")
    print(f"Simulated Timeline Events Count: {len(mock_events)}")
    print("\nStarting generation process...")

    summary = client.generate_summary(mock_events, mock_risk_score)

    print("\n" + "=" * 40)
    print("GENERATED SUMMARY REPORT:")
    print("=" * 40)
    print(summary)
    print("=" * 40 + "\n")

if __name__ == "__main__":
    run_test()