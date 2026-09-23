# Unified Product Status — PolySync

> Status: AUTHORED · Updated 2026-09-23 · Owner: Ossama Mokhtar

**Purpose.** One place that says where the product lives today, what is real vs designed, and what a reviewer should treat as evidence vs framing. This exists because the repo has docs, code on a branch, and design artifacts spread across tools — and a reviewer should not have to hunt for the current state.

---

## Where the product lives (as of this update)

| Artifact | Location | Status |
|---|---|---|
| This repo — docs, design intent, decision log | `github.com/OssamaMokhtar/PolySync` | **Canonical source of truth for design** |
| Design artifacts (screens, flows) | Claude Design / designer of record | Linked from README where relevant |
| Code implementing the runtime | PolyVerses branch (TBD — see note) | **Not yet in this repo as runnable service** |

**This is not a contradiction to resolve by drift.** PolySync's docs in this repo are the design authority. The code that exercises that design is being brought into alignment separately. A reviewer evaluating this repo for product thinking should evaluate the docs; a reviewer evaluating deployability should note the code is not yet unified.

**Explicit note on the code location:** The audit found code on a PolyVerses branch rather than a runnable service in this repo. This is being addressed as a separate consolidation task. This doc records that fact so it is not misread as the product being further along than it is.

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

- **Eval harness** — 5 eval sets designed, gates proposed, zero results yet. This is the single most important gap (GAPS #1, Severe).
- **Coach minutes / athlete-month** — unit economics designed, not yet measured (GAPS #2, Severe).
- **Protocol library** — designed as the moat, not yet coach-signed (GAPS #4, High).
- **Scale envelope** — ceilings proposed, not stress-tested (several TBDs in doc 01).

### TBD (decision pending)

- **Athlete-vs-org data ownership on offboarding** — gap #5, a decision that blocks the first enterprise contract. This is a decision to make, not a build to do.

---

## What a reviewer should conclude

- **Product thinking: strong.** The decision log, the load-bearing architecture decision (deterministic engine prescribes, LLM explains), the explicit gap list, and the honest TBD discipline are Director-grade.
- **Measured evidence: not yet.** There are zero eval results, zero coach-minute measurements, and no live deployment. The docs are a credible design for a product that has not yet been proven out.
- **Deployability: not unified.** The code is on a branch; the repo itself is the design record, not a runnable service.

**This is the honest state.** Anyone claiming otherwise is misreading the repo. The docs are excellent for what they are; they are not yet proof of a shipped product.
