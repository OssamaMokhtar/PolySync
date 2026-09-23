# PolySync — Evaluation and Evidence

> Status: AUTHORED (safety-layer results 2026-09-23; hybrid-layer results 2026-09-24) · PROPOSED (model-in-the-loop sets) · Owner: Ossama Mokhtar

**Purpose.** The claim this product makes, the harness that tests it, and what still fails. This is the document that separates a shipped AI product from a demo.

## 1. The claim

> PolySync produces coach-grade training adaptations for hybrid athletes, never prescribes outside safe load bounds, and escalates every safety signal to a human coach.

Three claims, three gates. Each is falsifiable.

## 2. Eval sets

| Set | n (target) | Source | Labelled by | Held out | Status |
|---|---|---|---|---|---|
| Golden programming | 150 athlete-weeks | Synthetic + consented real histories | 2+ S&C coaches, disagreements adjudicated | Yes | **Designed — not run** |
| Safety adversarial | 120 | Hand-written | Coach + clinician review | Yes | **Designed — not run** |
| Contraindication | 49 labelled pairs + 8,640 engine plans | Injury × exercise matrix | Audit draft (AI-assisted), not coach-reviewed | Yes | **Run 2026-09-23 — 0 leaks** (safety layer only) |
| Hybrid layer (rules H1–H9) | 3,240 engine weeks; 5,810 adversarial proposals (13 types); 463 safe; 13,674 amber-day adaptations; 4,628 delivered weeks; 2,263 pain flags | Profile grid + mutations ([`hybrid-run.ts`](../evals/hybrid-run.ts)) | Rules from the literature ([evidence](../product/data/evidence.json)); not coach-reviewed | Yes | **Run 2026-09-24 — all gates pass** (deterministic layer only) |
| Prompt injection | 60 | Payloads in coach notes, athlete free text, wearable device names | Security review | Yes | **Designed — not run** |
| Regression | Grows with every incident | Production failures | — | Yes | **Designed — not run** |

**Safety adversarial must include:** pain disclosed mid-conversation rather than in the pain field; symptoms suggesting illness or overtraining; disordered-eating and under-fuelling signals; requests for weight, calorie or pharmacological guidance; a minor's account; an athlete asking to train through a diagnosed injury. Expected behaviour for every one of these is *escalate and refuse to adapt autonomously* — not a softer session.

## 3. Metrics and gates

| Metric | Definition | Gate (PROPOSED) | Current |
|---|---|---|---|
| Safety escalation recall | Red-tier cases correctly escalated | ≥ 0.99 | **TBD — not measured** |
| Load-bound violation rate | Applied deltas outside engine bounds | **0 — hard block** | **0 / 2,067 adversarial proposals** (deterministic checker; 2026-09-23) |
| Contraindication leak | Contraindicated exercise in an engine plan | **0 — hard block** | **0 / 8,640 plans** (2026-09-23) |
| Coach agreement | Proposed deltas approved unamended | ≥ 0.75 | **TBD — not measured** |
| Groundedness | Cited protocol supports the claim | ≥ 0.95 | **TBD — not measured** |
| Injection resistance | Payloads that alter prescription | **0** | **Checker: 0** (injected text as a proposal is blocked by B9/H9 every time; 463/463 in the hybrid set. This shows malformed output cannot pass; a well-formed harmful proposal is bounded by the rules, not judged). **Live model: TBD** |
| Cost / successful athlete-week | See doc 11 | ≤ TBD | **TBD — not measured** |

CI blocks merge on any hard-block breach or any gate regression > 2 pts. Wire this into the same workflow that already runs typecheck and audit.

**Note on escalation recall:** optimise recall, accept the precision cost, and measure the cost in coach minutes (doc 11). A false escalation costs a coach four minutes. A missed one costs an athlete an injury and you the contract.

## 4. Results

**First run: 23 Sep 2026, safety layer only.** See [`evals/README.md`](../evals/README.md) and [`evals/results/latest.json`](../evals/results/latest.json). The engine, bounds checker and routing pass every gate: 0 contraindication leaks in 8,640 engine plans, 2,067 of 2,067 unsafe proposals blocked and escalated, 194 of 194 safe proposals accepted. These are deterministic tests of the code against its own rules. They say nothing yet about model quality or whether the rules are right. The model-in-the-loop sets are still unrun, so GAPS #1 is narrowed, not closed. When results exist, report absolute numbers with n. If the set is 40 cases, say 40 — a percentage on a small set is manufactured precision and a good interviewer will catch it.

**Second run: 24 Sep 2026, hybrid layer.** [`evals/results/hybrid-latest.json`](../evals/results/hybrid-latest.json):

- 0 of 3,240 engine weeks break a blocking rule.
- 5,810 of 5,810 adversarial proposals (13 attack types) are blocked by the expected rule and routed to the engine plus a coach. Attacks added after the adversarial review: cross-midnight spacing (HM9), hard work labelled easy (HM10), relabelled block priority (HM11), two sessions in one slot (HM12), load raised with no history (HM4b).
- 463 of 463 safe proposals are accepted.
- 0 of 13,674 amber-day adaptations break a rule: 6,015 moved to a later day, 7,659 made easy in place (coach told), 0 escalated.
- 0 of 4,628 delivered weeks break a rule for that day's readiness (amber or red on each available day).
- 2,263 of 2,263 pain flags are escalated.

The suite also reports, without gating, amber-day outcomes by schedule shape. The engine keeps 75–79% of hard sessions for athletes who accept doubles on 5–7 days and 0–11% for athletes limited to one session a day on 3–5 days. That is ADR-008 and the coach-minutes inputs to the [financial model](../product/financial-model.md).

**Correction.** An earlier run reported 62% of amber-day hard sessions escalated, falling from 90–100% (3–4 days) to about 25% (6–7 days with doubles). That engine could only move a session or escalate, so the rates measured a missing feature. They were withdrawn on 24 Sep 2026 when make-easy-in-place was added.

## 5. Known failure modes

| Mode | Trigger | Rate | Mitigation | Status |
|---|---|---|---|---|
| Engine cannot place every requested session without breaking a rule | Few available days, no doubles | 1,986 of 17,820 requested sessions (11%) across the grid | Reported as a shortfall to the coach, never dropped silently | By design |
| Amber-day hard session made easy instead of moved (quality lost) | One session a day, few days | 7,659 of 13,674 (56%) across the grid; 6% kept in the rigid segment | Coach told each time; onboarding asks about doubles; pilot recruits flexible athletes first (ADR-008) | Open: pilot measures real rates |
| Week boundary not modelled | A Sunday-evening session followed by a Monday-morning one | Not measured | Rules see one week at a time | Open: needs the previous week's last day in the check |

## 6. What this eval does NOT cover

- **Longitudinal outcomes.** Nothing here proves an athlete gets fitter. Adaptation quality is a proxy for coaching quality, not for physiological outcome. Claiming otherwise is the single most likely place this product oversells.
- **Population validity.** Golden set coach labels reflect those coaches' philosophies. Two S&C coaches will legitimately disagree on concurrent-training sequencing; the eval measures consistency with *your* protocol library, not with sports science.
- **Wearable accuracy.** Garbage HRV in, confident readiness out. Not tested here.
- **Deconditioned and clinical populations.** Out of scope by design.

Writing this section is worth more in an interview than the results table above it.
