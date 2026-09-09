# PolySync — API Contract

> Status: PROPOSED (verify against implementation) · Owner: Ossama Mokhtar

## 1. Conventions

Base `/v1` · tenant resolved from token, never from path · idempotency key required on all writes · cursor pagination · all timestamps UTC ISO-8601 with athlete-local offset stored separately (training days are local-day bounded).

## 2. Endpoints

| Method | Path | Purpose | Actor | p95 target |
|---|---|---|---|---|
| GET | `/athletes/{id}/today` | Today's session + readiness + rationale | Athlete | 400 ms |
| POST | `/sessions/{id}/log` | Log delivered work | Athlete | 300 ms |
| POST | `/sessions/{id}/feedback` | RPE, pain flag, free text | Athlete | 300 ms |
| POST | `/athletes/{id}/adapt` | Request re-plan | Athlete/system | async |
| GET | `/coach/roster` | Roster with escalation-sorted attention queue | Coach | 800 ms |
| GET | `/coach/reviews` | Pending approval queue | Coach | 500 ms |
| POST | `/coach/reviews/{id}` | Approve / amend / reject a proposed delta | Coach | 400 ms |
| POST | `/webhooks/wearable/{provider}` | Sample ingestion | System | 200 ms |
| GET | `/org/outcomes` | Roster-level adherence and outcome rollup | Org admin | 1.5 s |

## 3. Error taxonomy

| Code | Meaning | Client action | Retryable |
|---|---|---|---|
| 409 | Session already logged | Show existing | No |
| 422 | Delta outside safe bounds | Surface "sent to your coach" | No |
| 424 | Wearable data stale > 72 h | Degrade to self-report readiness | No |
| 429 | Rate limited | Backoff | Yes |
| 503 | Model provider unavailable | Serve last deterministic plan, suppress rationale | Yes |

`422` and `503` are product moments, not errors. Both have designed copy in [doc 09](09-design-system.md).

## 4. Limits
TBD per tier. Note: conversational endpoints, not training endpoints, are the cost driver.
