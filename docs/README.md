# PolySync — Documentation

AI coaching for hybrid athletes. B2B2C, human coach in the loop.

**Status legend** — every doc is marked per section:
- `AUTHORED` — written from product decisions already made. Verify against code before merge.
- `PROPOSED` — my recommendation, not yet a decision. Accept, amend or delete.
- `TBD` — only you have the answer. Fill before this repo goes on your profile.

No measured metric in this set is invented. Every results cell is `TBD` until an eval run produces it.

| # | Doc | What it answers |
|---|---|---|
| 01 | [System architecture](01-system-architecture.md) | How the system is composed, and why the LLM cannot prescribe load |
| 02 | [Data model](02-data-model.md) | Entities, and the special-category health data posture |
| 03 | [API contract](03-api-endpoints.md) | Multi-tenant surface, wearable ingestion, coach actions |
| 04 | [AI architecture](04-ai-architecture.md) | Model portfolio, risk-tier routing, guardrail chain |
| 05 | [LLM / RAG architecture](05-llm-rag-architecture.md) | Protocol library grounding and abstention |
| 06 | [User journeys](06-user-journeys.md) | Athlete loop, coach loop, failure states |
| 07 | [Evaluation and evidence](07-evaluation-and-evidence.md) | Eval sets, CI gates, failure modes |
| 08 | [Security and deployment](08-security-and-deployment.md) | Threat model, tenancy isolation, rollback |
| 09 | [Design system](09-design-system.md) | Tokens, AI-specific patterns, accessibility |
| 10 | [Decision log](10-decision-log.md) | ADRs with rejected options and reversal triggers |
| 11 | [Metrics and unit economics](11-metrics-and-unit-economics.md) | North star, guardrails, coach-minutes economics |
| 12 | [Hybrid programming engine](12-hybrid-athlete-programming-engine.md) | The domain logic that makes this defensible |
| — | [Gaps](GAPS.md) | Everything unresolved, ranked by credibility damage |
