# DrishtiRakshak AI — Roadmap

> Ratified phased plan. Each phase satisfies three rules:
> **(1) the app stays runnable · (2) no later phase requires a rewrite ·
> (3) every completed phase delivers measurable business value.**
> Phase order: **safe → correct → scale → smart.**

## Phase 1 — Foundation & Safety
**Business value:** the API stops being publicly open; the project becomes
deployable without leaking secrets and testable in CI.

- `django-environ` config; `SECRET_KEY`/`DEBUG`/`ALLOWED_HOSTS`/CORS from env;
  `.env.example`.
- JWT auth (SimpleJWT): `IsAuthenticated` default, short access TTL, refresh
  rotation, blocklist; `/api/token/` + refresh endpoints.
- `/api/v1/` prefix; DRF pagination.
- Upload validation (type/size) in the evidence viewset.
- Structured JSON logging.
- Dev Postgres via a **minimal `docker-compose`** (web + Postgres).
- **pytest + pytest-django** skeleton and a **GitHub Actions** CI running on
  Postgres.
- Frontend: `react-router` + auth-aware fetch wrapper + login flow.

*Files (indicative):* `backend/drishtirakshak/settings.py`, `.../urls.py`,
`backend/requirements.txt`, `backend/evidence/views.py`, all serializers/viewsets
(config only), `frontend/src/api.js`, `frontend/src/App.jsx`, `docker/`,
`scripts/`, `.github/workflows/`.

*Runnable check:* server boots with env config; `IsAuthenticated` enforced;
login → token → authorized request works; CI green.

## Phase 2 — Correctness & Trust
**Business value:** risk scores become **accurate** (same tracked vehicle) and
**isolated** (no cross-tenant data leakage) — the two things that make a pilot
trustworthy.

- ByteTrack tracking via `model.track()`; additive `track_id` on
  `detection/interface.py`.
- Track-aware rewrite of `detection/risk.py`; populate `TimelineEvent.bounding_boxes`.
- `transaction.atomic()` around DB writes in `detection/pipeline.py`.
- Multi-tenant enforcement: base scoped-queryset mixin/manager + object-level
  permissions; `accounts`/membership app; roles owner/operator/viewer.
- Tests written with the rewrite (unit on risk, pipeline via fake detector).
- Correlation + org IDs in logs.

*Runnable check:* existing flow still works; a user in Org A cannot read Org B's
evidence; risk tests pass.

## Phase 3 — Scale & Operability
**Business value:** survives real video sizes and concurrent users; deployable to
Render/Railway.

- Celery + Redis; `process_evidence` → idempotent task with retries; `/process/`
  returns `202` + status; UI polls a status field on `Evidence`.
- `django-storages` S3-compatible private media + signed URLs.
- Full `docker-compose` (web + worker + Postgres + Redis); multi-stage Dockerfile
  (one image, web/worker roles).
- Sentry + `/healthz`; HTTPS/HSTS/secure cookies; rate limiting.

*Runnable check:* sync fallback remains until async is proven; processing a large
clip does not time out the HTTP request.

## Phase 4 — Intelligence Seed
**Business value:** first genuine AI feature — readable, grounded incident
narratives — plus review workflow, without touching the deterministic safety path.

- `backend/detection/llm/`: `LLMProvider` protocol, `GeminiProvider` (Google AI
  Studio), rule-based fallback; env-selected; called from `pipeline.py` over
  already-computed events.
- Incident status workflow (open→reviewed→closed) via PATCH + UI controls.
- Ops docs / deploy runbook.

*Runnable check:* with no `GEMINI_API_KEY`, the rule-based fallback produces
summaries exactly as today; the deterministic risk path is unchanged.

## Postponed (data-gated — NOT scheduled)
Learned risk scoring · OCR · model fine-tuning + eval harness · multi-agent
orchestration · embeddings/semantic search · n8n · Kubernetes · metrics/APM
dashboards · multi-region · legal chain-of-custody.

## Amendments vs. the original four-week draft
1. Postgres + minimal Docker + CI **pulled forward** into Phase 1 (dev/prod
   engine parity is nearly free early, expensive later).
2. **Authentication (P1) split from authorization/tenancy (P2)** — auth without
   tenancy is a false sense of security.
3. LLM abstraction **capped at two implementations** (Gemini + rule-based) until
   a concrete need for another provider appears.
