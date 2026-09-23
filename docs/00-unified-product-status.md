# Unified Product Status — PolySync

> Status: AUTHORED · Updated 2026-09-23 (code consolidation) · Owner: Ossama Mokhtar

**Purpose.** One place that says where the product lives today, what is real vs designed, and what a reviewer should treat as evidence vs framing. This exists because the repo has docs, code on a branch, and design artifacts spread across tools — and a reviewer should not have to hunt for the current state.

---

## Where the product lives (as of this update)

| Artifact | Location | Status |
|---|---|---|
| This repo — docs, design intent, decision log | `github.com/OssamaMokhtar/PolySync` | **Canonical source of truth for design** |
| Design artifacts (screens, flows) | Claude Design / designer of record | Linked from README where relevant |
| Code implementing the runtime | [`app/`](../app/) in this repo (moved from PolyVerses main with history, 2026-09-23) | **Builds and runs locally; not deployed** |

**Update 2026-09-23.** Code and docs now live in one repo. Moving the code in exposed a real contradiction: the runtime saved Gemini's JSON directly as the athlete's plan, the opposite of ADR-004. That is fixed: `app/src/engine/` prescribes, and Gemini output is a proposal gated by the bounds checker (rules B1–B9). Design screens are still in Claude Design (GAPS #8).

---

## What is real vs designed vs TBD

This matters because the repo's strongest asset is its honest documentation of what is designed but not yet measured. The line between "designed and plausible" and "measured and proven" must be visible.

### Real (exists as written, visible in this repo)

- **Decision log** — 5 ADRs, each with rejected options and reversal triggers. ADR-005 now names the beachhead explicitly.
- **System architecture** — container view, load-bearing decision, scale envelope (with TBDs where unmeasured).
- **Data model** — athlete, program, wearable, protocol entities.
- **API endpoints** — listed with intent.
- **AI architecture** — LLM proposer + bounds checker + escalation, with the design rationale.
- **RAG architecture** — grounding over signed protocols, with abstention on empty retrieval.
- **User journeys** — athlete, coach, org admin.
- **Hybrid programming engine** — the domain logic that is the actual product.
- **Gaps** — ranked list of what is unresolved, with damage-if-unfilled and effort.
- **Coach onboarding doc** — how a coach gets started.
- **Security and deployment doc** — current posture, what is designed, what is TBD.

### Designed but not yet measured (PROPOSED in docs, TBD in results)

- **Eval harness** — the safety layer is measured in CI (0 contraindication leaks in 8,640 engine plans; 2,067/2,067 unsafe proposals blocked and escalated). The model-in-the-loop sets (golden programming, free-text safety, live injection) have no results yet (GAPS #1, narrowed).
- **Coach minutes / athlete-month** — unit economics designed, not yet measured (GAPS #2, Severe).
- **Protocol library** — designed as the moat, not yet coach-signed (GAPS #4, High).
- **Scale envelope** — ceilings proposed, not stress-tested (several TBDs in doc 01).

### TBD (decision pending)

- **Athlete-vs-org data ownership on offboarding** — gap #5, a decision that blocks the first enterprise contract. This is a decision to make, not a build to do.

---

## What a reviewer should conclude

- **Product thinking: strong.** The decision log, the load-bearing architecture decision (deterministic engine prescribes, LLM explains), the explicit gap list, and the honest TBD discipline are Director-grade.
- **Measured evidence: safety layer only.** Deterministic evals pass in CI; there are zero model-quality results, zero coach-minute measurements, and no live deployment. The docs are a credible design for a product that has not yet been proven out.
- **Deployability: unified, not deployed.** Code is in `app/` with CI gates; 93 inherited type errors are held by a ratchet. No live URL yet.

**This is the honest state.** Anyone claiming otherwise is misreading the repo. The docs are excellent for what they are; they are not yet proof of a shipped product.
