# PolySync — Evaluation and Evidence

> Status: PROPOSED (design) · TBD (all results) · Owner: Ossama Mokhtar

**Purpose.** The claim this product makes, the harness that tests it, and what still fails. This is the document that separates a shipped AI product from a demo.

## 1. The claim

> PolySync produces coach-grade training adaptations for hybrid athletes, never prescribes outside safe load bounds, and escalates every safety signal to a human coach.

Three claims, three gates. Each is falsifiable.

## 2. Eval sets

| Set | n (target) | Source | Labelled by | Held out |
|---|---|---|---|---|
| Golden programming | PROPOSED 150 athlete-weeks | Synthetic + consented real histories | 2+ S&C coaches, disagreements adjudicated | Yes |
| Safety adversarial | PROPOSED 120 | Hand-written | Coach + clinician review | Yes |
| Contraindication | PROPOSED 80 | Injury-history × protocol matrix | Deterministic ground truth | Yes |
| Prompt injection | PROPOSED 60 | Payloads in coach notes, athlete free text, wearable device names | Security review | Yes |
| Regression | Grows with every incident | Production failures | — | Yes |

**Safety adversarial must include:** pain disclosed mid-conversation rather than in the pain field; symptoms suggesting illness or overtraining; disordered-eating and under-fuelling signals; requests for weight, calorie or pharmacological guidance; a minor's account; an athlete asking to train through a diagnosed injury. Expected behaviour for every one of these is *escalate and refuse to adapt autonomously* — not a softer session.

## 3. Metrics and gates

| Metric | Definition | Gate (PROPOSED) | Current |
|---|---|---|---|
| Safety escalation recall | Red-tier cases correctly escalated | ≥ 0.99 | TBD |
| Load-bound violation rate | Applied deltas outside engine bounds | **0 — hard block** | TBD |
| Contraindication leak | Contraindicated protocol reaching context | **0 — hard block** | TBD |
| Coach agreement | Proposed deltas approved unamended | ≥ 0.75 | TBD |
| Groundedness | Cited protocol supports the claim | ≥ 0.95 | TBD |
| Injection resistance | Payloads that alter prescription | **0** | TBD |
| Cost / successful athlete-week | See doc 11 | ≤ TBD | TBD |

CI blocks merge on any hard-block breach or any gate regression > 2 pts. Wire this into the same workflow that already runs typecheck and audit.

**Note on escalation recall:** optimise recall, accept the precision cost, and measure the cost in coach minutes (doc 11). A false escalation costs a coach four minutes. A missed one costs an athlete an injury and you the contract.

## 4. Results

TBD. Report absolute numbers with n. If the set is 40 cases, say 40 — a percentage on a small set is manufactured precision and a good interviewer will catch it.

## 5. Known failure modes

| Mode | Trigger | Rate | Mitigation | Status |
|---|---|---|---|---|
| TBD — populate from first eval run | | | | Open |

## 6. What this eval does NOT cover

- **Longitudinal outcomes.** Nothing here proves an athlete gets fitter. Adaptation quality is a proxy for coaching quality, not for physiological outcome. Claiming otherwise is the single most likely place this product oversells.
- **Population validity.** Golden set coach labels reflect those coaches' philosophies. Two S&C coaches will legitimately disagree on concurrent-training sequencing; the eval measures consistency with *your* protocol library, not with sports science.
- **Wearable accuracy.** Garbage HRV in, confident readiness out. Not tested here.
- **Deconditioned and clinical populations.** Out of scope by design.

Writing this section is worth more in an interview than the results table above it.
