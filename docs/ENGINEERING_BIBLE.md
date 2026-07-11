# DrishtiRakshak AI — Engineering Bible

> How we build. These rules are binding for every contributor, human or AI.
> Product "what/why" lives in `PRODUCT_BIBLE.md`.

## 1. The baseline rule

The architecture ratified in `ARCHITECTURE.md` is the **baseline**. Do not
rewrite it or revisit previously approved decisions **unless** one of these is
demonstrably true:

- a measurable performance bottleneck,
- a maintainability problem,
- a security issue,
- a scalability limitation,
- or a new business requirement.

Absent one of these, **preserve the existing architecture.**

## 2. The implementation workflow (every change follows this)

1. **Inspect** the current implementation.
2. **Explain what already exists.**
3. **Explain what is missing.**
4. **Explain why** the proposed change is necessary.
5. **Describe the measurable benefit.**
6. **Describe the architectural trade-offs.**
7. **Implement only the agreed changes.**
8. **Verify the application remains runnable.**
9. **Update documentation** when architecture or behavior changes (incl. a new
   ADR for significant decisions — see §5).

## 3. No gratuitous rewrites

- Never rewrite working code because a different implementation exists.
- Every change must **improve the existing system**, not replace it.
- Prefer **additive** changes (new field, new module behind an existing
  boundary) over invasive ones.

## 4. Dependency & technology gate

**Technology supports the product; it never becomes the product.** Before adding
**any** dependency, framework, infrastructure service, or external API, answer in
writing (in the PR description and, if significant, an ADR):

1. **Why is it needed?**
2. **Why are existing components insufficient?**
3. **What long-term maintenance cost does it introduce?**
4. **Does the benefit justify that cost?**

If the honest answer to (4) is *no*, **recommend postponing it.**

Do not adopt a technology merely because it is newer.

## 5. Architecture Decision Records (ADRs)

- Location: `docs/adr/NNNN-short-title.md`, zero-padded, incrementing.
- A **significant** decision (anything that shapes the baseline, adds a core
  dependency, or changes a boundary) requires an ADR.
- Format (Michael Nygard style): **Title · Status · Context · Decision ·
  Consequences**. Status is one of `Proposed | Accepted | Superseded by NNNN |
  Deprecated`.
- ADRs are **append-only history**: to reverse a decision, write a new ADR that
  supersedes the old one; do not delete or silently edit the original.

## 6. Testing discipline

- Pure logic (e.g. `detection/risk.py`) must have unit tests.
- Pipeline/integration tests inject a **fake detector via `detection/interface.py`**
  so tests run without heavy CV dependencies.
- A change to logic ships with the tests that lock its behavior.
- The application must **remain runnable at the end of every phase** (a working
  fallback path is preferred over a hard dependency).

## 7. Boundaries to protect (see ARCHITECTURE.md + ADR-0003)

- The ORM and CV/ML libraries meet **only** in `detection/pipeline.py`.
- Nothing outside `detection/service.py` imports `ultralytics`/`opencv`.
- External LLM providers sit behind a provider interface (ADR-0005); business
  logic depends on the interface, never a vendor SDK.

## 8. Configuration & secrets

- 12-factor: all environment-specific values come from the environment
  (`django-environ`), never hardcoded. `.env` is gitignored; `.env.example` is
  committed. No secret is ever committed.

## 9. Documentation upkeep

When architecture or externally-visible behavior changes, update the relevant
doc **in the same change**: `ARCHITECTURE.md`, `ROADMAP.md`, the app README, and
a new ADR if the decision is significant. Docs drifting from code is a defect.
