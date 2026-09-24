# PolySync competitive landscape

> Status: GENERATED from `product/data/*.json` by `product/scripts/build.mjs` · As of 2026-09-24 · Do not edit by hand

**The finding.** Interference-aware scheduling is no longer a differentiator: three consumer apps at $9-10 a month claim it. No product we checked combines a club buyer, a coach in the loop and rules plus safety evals a club can audit. That combination, not the scheduler, is what PolySync sells (ADR-009).

Desk research on vendor pages opened 2026-09-24, plus prices already graded in evidence.json. 'claimed' means the vendor says it; we did not use or audit the product. Only PolySync's 'yes' values come from our own CI.

| Product | Category | Buyer | Price | Interference-aware | Readiness-adaptive | Coach in the loop | Auditable | Note | Source |
|---|---|---|---|---|---|---|---|---|---|
| **PolySync** | This product | Club | $8 per athlete-month (hypothesis) | ● Yes | ● Yes | ◐ Partial | ● Yes | Routing to a coach is built; the coach console is not (GAPS #13) | [OWN-001](data/evidence.json), [OWN-002](data/evidence.json) |
| Hypla | Consumer hybrid AI | Athlete | $10/month | ◐ Claimed | ◐ Partial | ◐ Claimed | ○ No | Says it never schedules heavy lifting after a long run | [COM-001](data/evidence.json) |
| HybridX | Consumer hybrid AI | Athlete | $9/month | ◐ Claimed | ? Unknown | ○ No | ○ No | Garmin two-way sync; 'coach chat' is in-app | [COM-002](data/evidence.json) |
| Athletica | Consumer hybrid AI | Athlete (coach tier) | Not shown | ◐ Claimed | ◐ Claimed | ◐ Partial | ○ No | Closest overall: HRV readiness plus strength-run sequencing | [COM-003](data/evidence.json) |
| Strava + Runna | Consumer running | Athlete | $149.99/year | ○ No | ◐ Partial | ○ No | ○ No | Running plans; strength is not scheduled against runs | [PRC-004](data/evidence.json) |
| Ladder | Consumer strength | Athlete | $29.99/month | ○ No | ○ No | ◐ Partial | ○ No | Team programmes led by a coach, not individual review | [PRC-003](data/evidence.json) |
| WHOOP | Wearable | Athlete | Membership | ○ No | ◐ Claimed | ○ No | ○ No | $10.1B valuation; recovery data, not programming | [COM-006](data/evidence.json) |
| TrainHeroic | Coach platform | Coach | $1.50 per athlete-month at capacity | ○ No | ○ No | ● Yes | ○ No | Delivers the coach's plan; the trade-off is the coach's job | [PRC-001](data/evidence.json) |
| TrueCoach | Coach platform | Coach | $2.74 per client-month at capacity | ○ No | ○ No | ● Yes | ○ No | Delivery software | [PRC-002](data/evidence.json) |
| ABC Trainerize | Coach platform | Coach / club | From ~$23/month plus add-ons | ○ No | ○ No | ● Yes | ○ No | Generic AI workout builder; paid add-ons for payments and nutrition | [COM-004](data/evidence.json) |
| FITR | Coach platform | Coach / gym | Not shown | ? Unknown | ? Unknown | ● Yes | ○ No | 'Fitr AI' for programming; markets to HYROX coaches | [COM-005](data/evidence.json) |
| Future | Human coaching | Athlete | $129-399/month | ? Unknown | ◐ Partial | ● Yes | ○ No | Dropped its AI coaching beta in Jun 2026 | [MKT-009](data/evidence.json) |

**Interference-aware:** Schedules strength and endurance to limit interference. **Readiness-adaptive:** Adapts the plan to readiness or recovery signals. **Coach in the loop:** A human coach reviews what the software cannot resolve. **Auditable:** Publishes its rules and safety evals, so a club can audit why a plan was given.

**Legend.** ● shown by our own CI · ◐ claimed by the vendor or partly present · ○ not offered · ? not stated.

**What it means for the roadmap.** Stop selling the scheduler. Sell the coach console and the audit trail: the screens and evidence a club's head coach and risk owner need (ADR-009).
