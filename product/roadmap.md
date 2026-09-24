# PolySync roadmap

> Status: GENERATED from `product/data/*.json` by `product/scripts/build.mjs` · As of 2026-09-24 · Do not edit by hand

Horizons are sequenced by GAPS.md's fill order and the ADR reversal triggers, not by dates. A 'done' item must point to a file in this repo; the product build fails otherwise.

## Done · Shipped and gated in CI

| Item | Status | Reference |
|---|---|---|
| Hybrid engine: rules H1-H9, move / make easy / escalate | done | [`hybrid.ts`](../app/src/engine/hybrid.ts) |
| The model proposes, the engine prescribes (ADR-004), enforced on both plan routes | done | [`boundsChecker.ts`](../app/src/engine/boundsChecker.ts) |
| Verified ID tokens, validated inputs, rate limit, event logs | done | [`ops.ts`](../app/server/ops.ts) |
| Safety and hybrid evals: 7,877 attacks, results diffed in CI | done | [`README.md`](../evals/README.md) |
| Product layer generated from data: model, risks, evidence, telemetry | done | [`build.mjs`](../product/scripts/build.mjs) |
| Beachhead, data ownership, rollback owner decided | done | [`10-decision-log.md`](../docs/10-decision-log.md) |
| Adversarial review: 7 findings fixed | done | [`case-study.md`](../product/case-study.md) |
| UX/UI baseline review and design brief | done | [`13-ux-review.md`](../docs/13-ux-review.md) |
| Athlete Load screen prototype on the engine (polished from Claude Design) | done | [`loadmap.ts`](../portal/src/loadmap.ts) |
| Idea validation of the super-app expansion: 11 claims checked, one wedge and three gated options | done | [`idea-validation-vision.md`](../product/idea-validation-vision.md) |

## Now · 0-6 weeks: unblock the pilot

| Item | Status | Reference | Why / gate |
|---|---|---|---|
| Server data layer on the Firebase Admin SDK | next | GAPS #12 | Blocks the pilot outright |
| DPIA and sub-processor register for UAE PDPL | next | GAPS #6 | Blocks the pilot outright |
| Coach console and athlete flows on the hybrid engine (Claude Design screens) | in-progress | GAPS #13 | The buyer's value is coach capacity; there is no coach screen yet |
| Onboarding rebuild: doubles first, consent before health data, no clinical modes | next | GAPS #16 | ADR-008 decided but not built; UX review U1-U3 |
| Two HYROX coaches sign the rule sheet | next | GAPS #4 | Longest lead time; starts in parallel |
| Pre-pilot coach time diary, 2 weeks, 3 clubs | next | study:coach-time-diary | Pass bar 2 baseline; the model's biggest driver |

## Next · 2-4 months: the UAE pilot

| Item | Status | Reference | Why / gate |
|---|---|---|---|
| 3 UAE HYROX clubs, 8 weeks, flexible athletes first | planned | [`pilot-plan.md`](../product/pilot-plan.md) | Measures coach minutes and amber-day outcomes (GAPS #2, #14) |
| Model-in-the-loop evals: live injection set and golden athlete-weeks | planned | GAPS #1 | The largest unmeasured claim |
| Rules across the week boundary (Sunday evening to Monday morning) | planned | [`07-evaluation-and-evidence.md`](../docs/07-evaluation-and-evidence.md) | Known failure mode |
| Upper-body programming (sled, row, wall balls, carries) with coach input | planned | GAPS #17 | The Load screen shows the upper body as not programmed |

## Later · 4-9 months: after pass bars

| Item | Status | Reference | Why / gate |
|---|---|---|---|
| Price from measured coach minutes, not hypotheses | gated | [`financial-model.md`](../product/financial-model.md) | Pilot pass bars 1-3 |
| US boutique hybrid gyms through coach networks | gated | ADR-006 | UAE pilot passes; ADR-006 scale step |
| Club dashboard: coach capacity and adherence rollup | gated | [`telemetry-plan.md`](../product/telemetry-plan.md) | First paid renewal in sight |

## Gated · Only when a trigger fires

| Item | Status | Reference | Why / gate |
|---|---|---|---|
| Widen autonomous bounds for green-tier days only | gated | ADR-003 | Coach agreement at or above 90% for 3 months |
| Option A: technique drills for slow skills, via club coaches (concierge test first) | gated | ADR-011 | 30%+ of 20 concierge athletes would pay; coaches agree on scores |
| Option B: youth football through academies | gated | ADR-011 | One academy co-designs and pays |
| Option C: coach marketplace beyond clubs | gated | ADR-011 | 20+ coaches actively use the console |
| Managed coaching service | killed | [`strategy.md`](../product/strategy.md) | Services economics: $11-13 (UAE) and $32-39 (US) per athlete-month to break even, against an $8 software price |
| Vision models trained on scraped social-media video | killed | ADR-011 | YouTube's terms prohibit scraping; third-party AI training is off unless creators opt in (REG-004) |
| Body-fat estimates from progress photos | killed | ADR-011 | An unmeasured number and an eating-disorder risk; conflicts with the safety layer |
| Five-region launch | killed | ADR-011 | Five regulatory regimes for one engineer; ADR-005 and ADR-006 sequence regions |

