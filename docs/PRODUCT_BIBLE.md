# DrishtiRakshak AI — Product Bible

> The single source of truth for **what** we are building and **why**.
> Engineering "how" lives in `ENGINEERING_BIBLE.md` and `ARCHITECTURE.md`.

## 1. What the product is

DrishtiRakshak AI is a **vehicle-safety evidence platform**. An organization or
individual uploads dashcam / vehicle-camera footage; the platform runs computer
vision over it, produces an **explainable risk assessment**, and stores the clip
as **tamper-evident evidence** with a timeline of detected events.

The product's core promise is **trustworthy, explainable safety intelligence** —
not opaque AI scores. Every risk number must trace back to specific detections a
human can verify against the video.

## 2. Who it serves (five-year horizon)

- Logistics fleets
- Cab / ride operators
- School transport operators
- Individual vehicle owners

The data model already encodes these as `Organization.OrgType`. Multi-tenancy
(many organizations on one platform, strictly isolated) is a first-class,
long-term requirement — see `ARCHITECTURE.md` and ADR-0001.

## 3. The three-tier honesty rule (non-negotiable)

This project distinguishes three tiers and **never blurs them** in any README,
pitch, demo, or interview:

- **Current** — verified working code in the repo today.
- **Planned** — scheduled on the roadmap, not yet built.
- **Future Vision** — long-term direction, **not** scheduled, built only when
  real pilot usage data justifies the complexity.

Overclaiming (describing Planned/Future as Current) is treated as a defect.

### Specific honesty commitments

- **Evidence "locking"** computes a sha256 hash and marks a record immutable at
  the application level. This demonstrates the *pattern* of tamper-evidence. It
  is **not** a legally admissible chain-of-custody system and must never be
  described as one without legal review.
- **The risk engine is a transparent heuristic**, not a learned "threat model."
  Its summaries always state which events drove the score.

## 4. Current capabilities (verified)

- Upload footage against a registered vehicle in an organization.
- Run detection (YOLOv8n) + heuristic risk scoring; persist a timeline of
  events and one incident with a human-readable summary.
- Hash + lock the evidence after analysis.
- Review via a React console (upload, list with risk chips, video player with a
  clickable event timeline) or Django admin.

## 5. Planned (on the roadmap — see `ROADMAP.md`)

- Authentication, multi-tenant isolation, and role-based access.
- Object tracking (ByteTrack) so "sustained proximity" means the *same* vehicle.
- Async processing, Postgres, S3-compatible object storage, containerized deploy.
- One grounded LLM feature: readable incident narratives over already-computed
  events (never computing risk itself).

## 6. Future Vision (NOT scheduled — do not present as built)

Multi-agent orchestration, semantic search / embeddings (e.g. Qdrant/pgvector),
license-plate OCR, learned risk scoring, model fine-tuning, n8n workflows,
Kubernetes, multi-region, legally-admissible chain-of-custody, cross-vehicle
correlation, emergency-service integration.

Each of these is a multi-month commitment that pays off only with usage data we
do not yet have. They are direction, not plan.

## 7. Product principles

1. **Explainability over accuracy theater.** In a safety product, a rule a human
   can verify beats an opaque model that scores marginally better.
2. **Right-sized, not feature-maximal.** We add capability when a real user need
   justifies its maintenance cost.
3. **The deterministic safety path stays deterministic.** AI/LLM features narrate
   and assist; they never sit on the critical risk-scoring path.
