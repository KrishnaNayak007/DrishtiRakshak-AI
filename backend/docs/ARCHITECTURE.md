# DrishtiRakshak AI — Architecture (Baseline)

> This is the ratified baseline as of the architecture-validation phase.
> Changes require the conditions in `ENGINEERING_BIBLE.md` §1 and a new ADR.

## 1. System overview

```
┌─────────────────────── Frontend (React 19 + Vite) ────────────────────────┐
│  App.jsx ─ UploadForm / EvidenceList / EvidenceDetail                       │
│  api.js  ─ fetch wrapper to /api  (JWT bearer token — Phase 1)              │
└───────────────────────────────┬────────────────────────────────────────────┘
                                 │ REST (DRF, IsAuthenticated — Phase 1)
┌────────────────────────────────▼───────────────────────────────────────────┐
│ Django monolith `drishtirakshak`                                            │
│                                                                              │
│  organizations ─< vehicles ─< evidence ─1:1─ incidents                       │
│                                  └─< TimelineEvent                            │
│                                                                              │
│  detection/  (framework-agnostic package)                                    │
│    interface.py  Detection / FrameDetections  ← stable contract              │
│    service.py    YOLOv8n + OpenCV sampling + stub fallback                    │
│    risk.py       pure, explainable heuristic scoring                         │
│    pipeline.py   the ONLY bridge: detection ↔ ORM                            │
│                                                                              │
│  Postgres (dev via compose — Phase 1) · media (local → S3-compatible P3)     │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 2. Load-bearing decisions (five-year-grade — do not casually change)

- **Monolith Django + DRF.** (ADR-0001)
- **Detection boundary:** ORM and CV libs meet only in `pipeline.py`; nothing
  outside `service.py` imports ultralytics/opencv. (ADR-0003)
- **Domain app structure:** `organizations`, `vehicles`, `evidence`, `incidents`
  + framework-agnostic `detection` package.
- **Explainable, rules-based risk engine.** (ADR-0004)
- **JWT authentication** for a decoupled SPA + future clients. (ADR-0002)
- **LLM behind a provider interface**, Gemini primary, rule-based fallback. (ADR-0005)

## 3. Area-by-area baseline

| Area | Baseline decision | Phase |
|---|---|---|
| Frontend | React+Vite SPA; add `react-router` + fetch/auth wrapper; no state lib | P1 |
| Backend | Django 6 monolith + DRF; single env-driven `settings.py` | P1 |
| App structure | 4 domain apps + `detection` pkg; add `accounts` with tenancy | P2 |
| REST API | DRF ModelViewSets; `/api/v1/` prefix; pagination; `/process/` action | P1 |
| Authentication | JWT (SimpleJWT): short access TTL, refresh rotation, blocklist | P1 |
| Authorization / tenancy | Shared-DB, FK-scoped; base scoped-queryset mixin + object perms; roles owner/operator/viewer | P2 |
| AI engine boundary | `detection/interface.py` dataclass contract; additive fields only | frozen |
| CV pipeline | YOLOv8n + frame sampling + stub fallback; add ByteTrack tracking | P2 |
| Risk engine | Pure, explainable heuristic; track-aware rewrite; more event types incremental | P2 |
| Evidence mgmt | Upload + sha256 lock; add upload validation (P1); versioned reprocess (P2/3) | P1→ |
| LLM abstraction | `LLMProvider` protocol; **two** impls only (Gemini + rule-based fallback) | P4 |
| Background jobs | Celery + Redis; idempotent tasks + retries | P3 |
| Storage | Local FS → `django-storages` S3-compatible, private, signed URLs | P3 |
| Database | Postgres (dev via compose in P1); managed Postgres in prod | P1/P3 |
| Docker | Multi-stage image (one image, web/worker roles); minimal compose P1, full P3 | P1/P3 |
| Deployment | Cloud-agnostic: same env-driven image on Render/Railway; **no Kubernetes** | P3 |
| Logging | Structured JSON to stdout (12-factor); correlation + org IDs | P1/P2 |
| Monitoring | Sentry + `/healthz`; metrics/APM postponed until traffic justifies | P3 |
| Testing | pytest + pytest-django; fake detector via interface; CI on Postgres | P1/P2 |
| Security | Layered: secrets/DEBUG/JWT/upload-val (P1) → tenancy/RBAC (P2) → media/HTTPS/rate-limit (P3) | P1→ |
| Config | `django-environ`, single settings file, `.env.example` committed | P1 |

## 4. Explicitly postponed (data-gated, NOT scheduled)

Learned risk scoring · OCR · model fine-tuning + eval harness · multi-agent
orchestration · embeddings/semantic search · n8n · Kubernetes · metrics/APM
dashboards · multi-region · legal chain-of-custody.

## 5. Open note — the `ai/` directory

The project layout reserves a top-level `ai/` directory. The **approved** LLM
location is `backend/detection/llm/` (keeps the AI engine behind the existing
detection boundary and inside the Django app that consumes it). Whether `ai/`
becomes a distinct top-level home for models/notebooks/training assets is a
**Phase 4 decision**, to be recorded in a future ADR rather than pre-scaffolded
now. It is intentionally not created empty today.

## 6. Directories

- `backend/` — Django monolith (exists).
- `frontend/` — React + Vite SPA (exists).
- `docs/` — this documentation set + ADRs (exists).
- `docker/`, `scripts/` — created when their phase needs them (P1+), not before.
- `ai/` — deferred; see §5.
