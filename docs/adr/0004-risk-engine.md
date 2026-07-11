# ADR-0004: Explainable, rules-based risk engine

- **Status:** Accepted
- **Date:** 2026-07-10
- **Deciders:** Founding CTO

## Context

DrishtiRakshak AI is a **safety** product. Users, pilot partners, and regulators
must be able to trust *why* a clip was flagged. A learned "threat model" could
score marginally better on paper but produces opaque numbers that cannot be
defended clip-by-clip and cannot be improved without a labeled dataset and an
evaluation harness we do not yet have.

The current `detection/risk.py` is a pure-function, weighted heuristic:
sustained presence of 2+ vehicle-class detections across consecutive sampled
frames raises risk, and every score traces to a specific rule firing on specific
detections.

## Decision

Keep the risk engine **rules-based and fully explainable**. Requirements:

- Every risk score must trace to specific detections/events a human can verify
  against the video; summaries state which events drove the score.
- The engine stays **pure** (no DB, no I/O) and unit-tested.
- Improvements are incremental (track-aware scoring in Phase 2 so "sustained"
  means the *same* vehicle; additional event types as real footage justifies).
- **Learned/ML risk scoring is postponed and data-gated**: introduced only when
  (a) labeled pilot data exists and (b) an eval harness proves it beats the
  rules. Even then, an ML model must not become an unexplainable black box on the
  safety-critical path.

## Consequences

- **Positive:** defensible, testable, honest scoring; no dataset dependency to
  ship value now; refactors are safe behind unit tests.
- **Negative:** heuristics may miss patterns a learned model would catch —
  accepted deliberately; revisited only with data and measurement.
- **Relationship to LLM (ADR-0005):** the LLM narrates already-computed risk; it
  **never computes risk**. The deterministic path stays deterministic.
- **Revisit if:** labeled data + an eval harness demonstrate a measurable
  accuracy gain that justifies the added opacity and maintenance.
