# ADR-0005: LLM provider abstraction (Gemini primary, rule-based fallback)

- **Status:** Accepted
- **Date:** 2026-07-10
- **Deciders:** Founding CTO

## Context

Phase 4 introduces one genuine AI feature: **readable, grounded incident
narratives** generated over already-computed risk events (replacing the
hand-built summary string when configured). LLM vendors change pricing, models,
and availability; hard-coupling business logic to one vendor SDK is a lock-in and
maintenance risk. At the same time, the product must never *hard-depend* on an
external API to function.

Chosen primary: **Gemini via Google AI Studio**. Requirement stated by product
owner: be able to switch to OpenAI / Anthropic / a local Ollama model later
without changing business logic.

## Decision

Introduce a provider interface, mirroring the detection boundary (ADR-0003):

- `backend/detection/llm/` defines an `LLMProvider` protocol, e.g.
  `summarize(events, context) -> str`.
- Ship **exactly two implementations initially**: `GeminiProvider` (default) and
  a `RuleBasedProvider` wrapping the existing deterministic summary as a
  zero-config fallback.
- Provider is selected by env (`LLM_PROVIDER`, `GEMINI_API_KEY`). With no key,
  the rule-based fallback runs — the product works unchanged.
- **Business logic (`pipeline.py`) depends only on the protocol**, never a vendor
  SDK. Adding OpenAI/Anthropic/Ollama later means adding one file.
- The LLM is confined to **narration over already-computed events**; it never
  computes risk (see ADR-0004).

## Dependency justification (Engineering Bible §4)

- **Why needed:** human-readable incident narratives add real reviewer value.
- **Why existing insufficient:** the deterministic summary is functional but terse;
  a grounded LLM narrative reads better while staying traceable.
- **Maintenance cost:** one external API + the abstraction. Capped by shipping
  **only two** implementations; more are added only on concrete need.
- **Justified?** Yes — the abstraction is cheap, the fallback removes hard
  dependency, and vendor-switching was an explicit product requirement.

## Consequences

- **Positive:** no vendor lock-in; product never hard-depends on an external API;
  consistent boundary discipline with the CV engine.
- **Negative:** an interface with one live provider is mild extra structure —
  justified by the stated switch requirement; kept minimal (two impls).
- **Guardrail:** do NOT pre-build OpenAI/Anthropic/Ollama adapters speculatively
  (Engineering Bible §4). That would be maintaining code for a switch that may
  never happen.
- **Revisit if:** a concrete need for another provider appears (then add one impl,
  no ADR needed) — or if LLM narration proves low-value (then keep rule-based only).
