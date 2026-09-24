# PolySync — Security and Deployment

> Status: PARTIALLY BUILT (controls marked **Built** are in code and gated in CI; the rest is PROPOSED) · Owner: Ossama Mokhtar

## 1. Threat model

| Threat | Vector | Control | Residual |
|---|---|---|---|
| Cross-tenant leakage | Roster query missing org scope | Tenancy at gateway + row-level policy + a test that asserts every query is scoped | Low |
| Prompt injection | Coach free-text notes, athlete messages, wearable device names | Untrusted-content fencing; classifier on retrieved text; **prescription path is deterministic: model output, injected or not, reaches an athlete only as a plan that passes every rule, so injection can at most produce a plan the rules already allow** | Medium — measured, see doc 07 |
| Health data exfiltration | Model output echoing another athlete's data | Context assembled per-athlete only; no cross-athlete retrieval; output scanned for foreign IDs | Low |
| Cost attack | Conversation endpoint abuse | **Built:** per-user fixed-window rate limit on `/api` (60/min default, `API_RATE_PER_MIN`), 100 KB body limit. **Planned:** per-athlete token budget, degrade to templated responses | Low |
| Impersonation | Client-supplied user id | **Built:** Firebase ID tokens verified (RS256, issuer, audience); dev header refused in production; CI boot check asserts 401 | Low |
| Malformed input | Unvalidated request fields | **Built:** every hybrid field parsed and bounded; JSON 404 for unknown API paths; route errors caught and logged | Low |
| Coach account compromise | Approves malicious deltas at scale | Bounds checker applies to coach actions too; bulk-approval rate limit | Medium |
| Model regression | Provider silently updates | Pinned versions + nightly eval run + alert on gate drift | Medium |

Note row 2: the architecture decision in doc 01 is also the primary injection control. That is the strongest security argument in this repo — make it in interviews.

## 1a. Operational logs (built)

The API writes one JSON line per event (`server/ops.ts`): `hybrid_proposal_rejected`, `bounds_rejected`, `coach_escalation`, `session_moved`, `session_downgraded`, `rate_limited`, `route_error`, `unhandled_rejection`. Each carries a timestamp and the user id where one exists, never plan content or health data. These are the events the [telemetry plan](../product/telemetry-plan.md) marks as instrumented. The limiter is in-memory, which is correct for one instance; a multi-instance deploy needs a shared store or a gateway limit.

## 2. Secrets

Provider keys server-side only; never in the app bundle. Rotation TBD. Wearable OAuth tokens encrypted at rest, per-athlete revocable — revocation must actually delete, not flag.

## 3. Pipeline

```mermaid
flowchart LR
  PR[PR] --> CI[typecheck · build · dep audit · unit · **eval gates**]
  CI --> PRE[Preview env, synthetic roster]
  PRE --> PROD[Production]
  PROD --> MON[Nightly eval + drift alert]
  MON -->|gate breach| RB[Rollback to pinned model + last good prompts]
```

Prompts and model versions are deployed artefacts under version control, not config edited in a console. A prompt change is a code change.

## 4. Rollback

Trigger: any hard-block gate breach, or coach-agreement drop > 5 pts. Mechanism: revert to pinned model + prompt bundle; the deterministic engine is unaffected, so athletes keep training through a rollback. Time to restore: TBD. Decision owner: **Ossama Mokhtar** (named 2026-09-24, [decision log](10-decision-log.md#operating-decisions)).

## 5. Compliance posture

Special-category data under GDPR Art. 9 / UAE PDPL. Explicit athlete consent, withdrawable, athlete-not-org as data subject. Data residency per org contract — TBD which regions you can actually serve today. **Not yet met:** formal DPIA, sub-processor register, retention automation. State this honestly in the repo; an org buyer's security questionnaire will find it anyway, and admitting it first is worth more than hiding it.
