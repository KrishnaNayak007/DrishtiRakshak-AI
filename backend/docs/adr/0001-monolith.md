# ADR-0001: Monolithic Django backend with domain apps

- **Status:** Accepted
- **Date:** 2026-07-10
- **Deciders:** Founding CTO

## Context

DrishtiRakshak AI is a five-year, multi-tenant product still at the prototype
stage. We must choose a backend shape that serves many organizations without
imposing operational cost the team cannot yet afford. Microservices offer
independent scaling but demand service discovery, network reliability,
distributed tracing, and multiple deploy pipelines — cost that only pays off with
team and load we do not have.

The existing code is already a Django project with four domain apps
(`organizations`, `vehicles`, `evidence`, `incidents`) plus a framework-agnostic
`detection` package.

## Decision

Keep a **single Django monolith** organized into **domain apps**. Django's
batteries (ORM, migrations, admin, auth) map directly onto this domain. Scale
vertically and via background workers before considering service extraction.
Extraction of any component (e.g. detection) is deferred until a *measurable*
bottleneck justifies it (per Engineering Bible §1).

## Consequences

- **Positive:** lowest maintenance and cognitive cost; one deploy; strong local
  parity; admin available as a fallback UI; fast feature delivery.
- **Positive:** domain-app boundaries give clean seams should extraction ever be
  warranted later.
- **Negative:** the whole app scales as a unit; a very heavy CV workload could
  eventually pressure the web tier — mitigated by moving inference to Celery
  workers (see ROADMAP Phase 3), not by splitting services.
- **Revisit if:** a measured performance/scalability limit in one component
  cannot be solved within the monolith + worker model.
