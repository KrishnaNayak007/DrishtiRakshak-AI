# ADR-0003: Detection boundary (framework-agnostic AI-engine contract)

- **Status:** Accepted
- **Date:** 2026-07-10
- **Deciders:** Founding CTO

## Context

Computer-vision and ML libraries (ultralytics, opencv, torch) are heavy, fast-
moving, and swappable. If model-specific code leaks throughout the codebase,
changing models or adding stages (tracking, OCR, LLM narration) becomes a
cross-cutting rewrite, and business logic becomes untestable without GPU-class
dependencies.

The codebase already implements this boundary well and it is the strongest
architectural asset in the project.

## Decision

Maintain a hard boundary around the AI engine:

- `detection/interface.py` defines the **stable contract** (`Detection`,
  `FrameDetections`) as plain dataclasses.
- **Nothing outside `detection/service.py`** imports ultralytics/opencv or any
  model-specific code.
- The ORM and the CV/ML layer meet in **exactly one place**:
  `detection/pipeline.py`.
- `detection/risk.py` depends only on the interface — it is pure and testable
  with no DB and no CV deps.
- Contract evolution is **additive** (e.g. adding `track_id`, later `ocr_text`);
  additive changes are safe by design.
- Tests inject a **fake detector** implementing the interface, so integration
  tests run without heavy dependencies.

## Consequences

- **Positive:** models/stages are swappable; risk logic is trivially testable; a
  stub fallback keeps the whole pipeline runnable without torch installed.
- **Positive:** future stages (tracking, OCR, LLM) slot in behind the same
  boundary without touching business logic.
- **Negative:** a small amount of mapping/glue in `pipeline.py`. Negligible and
  worth it.
- **Revisit if:** never, casually. This boundary is considered frozen; changes
  require the Engineering Bible §1 conditions and a superseding ADR.
