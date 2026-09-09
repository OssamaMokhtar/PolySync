# PolySync — Hybrid Athlete Programming Engine

> Status: AUTHORED (domain framing) · TBD (your actual parameters) · Owner: Ossama Mokhtar

**Purpose.** The domain logic that makes PolySync defensible. Everything else in this repo is delivery; this is the product. Fill the parameters from your own protocol library — the structure is the contribution, the numbers must be yours and your coaches'.

## 1. The domain problem

Hybrid athletes pursue endurance and strength adaptations concurrently. These adaptations compete: high-volume endurance work blunts strength and hypertrophy gains (the "interference effect"), while heavy lifting under accumulated endurance fatigue degrades both quality and safety. Mainstream apps do not resolve this — they run two independent plans and let the athlete absorb the collision.

The engine's job is to make the trade-off **explicitly, weekly, and visibly** rather than implicitly and badly.

## 2. Engine layers

| Layer | Decides | Horizon | Determinism |
|---|---|---|---|
| Macrocycle | Which quality is prioritised in each block, given the athlete's event calendar | Months | Rules + coach |
| Mesocycle | Volume and intensity distribution per modality | Weeks | Rules |
| Microcycle | Session sequencing and spacing | Days | Rules |
| Session adaptation | Today's modification from readiness and yesterday's delivery | Hours | Rules, LLM-proposed within bounds |

## 3. Core rule families

Each rule is a protocol in the library with an ID, an owning coach and a version. Parameters below are placeholders for your coaches' values.

| Family | Rule shape | Parameter | Source |
|---|---|---|---|
| Priority | One quality is primary per mesocycle; the other is maintained, not developed | Block sequence | Coach + event calendar |
| Sequencing | Minimum separation between conflicting sessions; if same day, prioritised quality goes first | `min_separation_h` = TBD | Protocol library |
| Distribution | Intensity distribution per modality per block (polarised / pyramidal / threshold) | Ratios = TBD | Protocol library |
| Load progression | Bounded weekly progression per modality | `max_weekly_increase` = TBD | Protocol library |
| Acute:chronic load | Ratio guardrail; breach caps progression, does not silently truncate the plan | Band = TBD | Protocol library |
| Readiness modulation | Readiness band → permitted session intensity range | Bands = TBD | Protocol library |
| Deload | Trigger conditions and depth | TBD | Protocol library |
| Taper | Volume reduction with intensity maintenance into a target event | TBD | Protocol library |
| Substitution | Contraindication-safe exercise swaps | Matrix | Protocol library |
| Re-entry | Return protocol after ≥ N missed sessions | TBD | Protocol library |

**The bounds checker** (doc 01) enforces load progression, ACWR and readiness rules on every delta, whoever proposed it — LLM, athlete or coach.

## 4. Worked example

> Athlete: 34, training age 6 y. Goal: half-marathon in 9 weeks *and* hold a 1.5×BW back squat. Current block: endurance-primary. Wednesday: threshold run prescribed. Tuesday delivered: heavy lower-body session, RPE 9, HRV down, sleep 5 h 20 m.

Engine trace:

| Step | Rule | Outcome |
|---|---|---|
| 1 | Readiness modulation | Readiness band = low → cap intensity |
| 2 | Sequencing | < `min_separation_h` since heavy lower-body → threshold run conflicts |
| 3 | Priority | Block is endurance-primary → protect the endurance quality, not the volume |
| 4 | Proposal | Move threshold to Thursday; Wednesday becomes easy aerobic, reduced duration |
| 5 | Bounds check | Within weekly volume and ACWR bounds → apply |
| 6 | Rationale | "Yesterday was heavy and you slept 5h. Today is easy — your threshold run moves to Thursday so it's actually fast." Cites `PROTO-SEQ-014`, `PROTO-RDY-003` |

Same inputs with a *pain flag* on the Tuesday session: step 1 becomes red-tier, no autonomous adaptation, escalate to the named coach, offer a session that avoids the flagged pattern.

## 5. Edge cases

| Case | Resolution |
|---|---|
| Both goals peak in the same week | Trade-off screen — the athlete chooses the primary. Never resolved silently |
| Wearable absent | Self-report readiness; widen bounds conservatively, lower confidence display |
| Athlete consistently overrides toward more volume | Surface to coach; the engine does not enter an arms race with the athlete |
| Travel / facility change | Substitution matrix + org equipment constraints |
| Illness reported | Red tier; return-to-training protocol, coach-owned |

## 6. Validation

The engine is only as credible as the coaches behind it. Required before this doc is publishable as evidence:
1. Two or more S&C coaches sign off on each rule family, named in the protocol metadata.
2. Golden set of athlete-weeks with coach-labelled correct adaptations (doc 07).
3. Documented inter-coach disagreement rate — if two qualified coaches disagree 30% of the time on sequencing, your coach-agreement gate cannot honestly exceed 70%, and saying so is a strength, not a weakness.
