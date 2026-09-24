# PolySync product strategy

> Status: AUTHORED · Updated 2026-09-24 · Owner: Ossama Mokhtar

**PolySync sells coach capacity to clubs that train hybrid athletes.** A deterministic engine schedules strength, power and endurance so they interfere as little as the evidence says they need to. It escalates only what it cannot resolve to a human coach. The simulation says a coach goes from about 40 hybrid athletes programmed by hand to 140–200 with PolySync. The pilot's job is to prove or kill that number.

## 1. The problem, as the evidence now frames it

The popular version of the "interference effect" is that cardio kills gains. The best current evidence is narrower, and more useful for product design:

- A 2022 meta-analysis (43 studies, 1,090 participants) found **no significant interference on maximal strength or hypertrophy**, but a **significant loss in explosive strength**. That effect was concentrated where aerobic and strength work shared a session and disappeared with ≥ 3 h separation (SCI-001 to SCI-004).
- Recovery time between sessions changes outcomes: 0 h < 6 h < 24 h for strength and aerobic gains (SCI-005).

So the hybrid athlete's problem is mostly **scheduling**: what goes on which day, in what order, with what gap. Coaches solve it by hand today, one athlete at a time. That is a software-shaped problem with a coach-shaped exception path.

## 2. Who it is for

| Actor | Job to be done | What they pay for |
|---|---|---|
| **Club owner** (buyer) | Sell hybrid coaching to more members without hiring coaches linearly | Coach capacity; retention of competitive members |
| **Head coach** (gatekeeper) | Know which athletes need me this week, and trust the rest | Minutes back; control over every escalation |
| **Hybrid athlete** (user) | One plan that makes the strength-vs-endurance trade-off for me every week | Nothing directly; the club pays (ADR-001) |

The coach can block adoption in a B2B2C deal, so the coach console is a revenue feature, not an admin screen (doc 06).

## 3. Why now

- **HYROX went from 570,000 participants (2024/25) to 1.5 million (2025/26)**, across 105 race weekends (MKT-001, MKT-002, MKT-005). Grades B and C: figures are company-reported.
- It reports about 15,000 affiliated gyms (MKT-003, grade C).
- Demand for hybrid programming is growing faster than qualified coaches can be hired.

These are why-now signals, not the TAM. The penetration check in the [financial model](financial-model.md) uses them only as order of magnitude.

## 4. Positioning

| Category | Examples and observed price | What they do not do |
|---|---|---|
| Coach delivery platforms | TrainHeroic $74.99/month for 50 athletes; TrueCoach $136.99/month for 50 clients: **$1.50–2.74 per athlete-month** (PRC-001, PRC-002); Trainerize from ~$23/month plus add-ons (COM-004); FITR with "Fitr AI" (COM-005) | Deliver the plan a coach wrote. The strength-endurance trade-off is the coach's job, or a generic AI builder's |
| Consumer hybrid AI planners | Hypla $10/month, HybridX $9/month, Athletica (COM-001 to COM-003) | Claim interference-aware scheduling, but sell to the athlete: no club buyer, no coach review of what the software cannot resolve, no published rules or safety evals |
| Consumer training apps | Ladder $29.99/month; Strava + Runna bundle $149.99/year (PRC-003, PRC-004) | No hybrid scheduling; no coach in the loop |
| **PolySync** | Hypothesis: **$8 (AED 29) per active athlete-month**, paid by the club | — |

Vendor features are as the vendors state them; we did not use the products ([landscape](competitive-landscape.md)). **What changed on 24 Sep:** interference-aware scheduling is now claimed by consumer apps at $9–10 a month, so PolySync does not sell the scheduler. It sells the coach console and the audit trail to the club (ADR-009).

**Positioning statement.** For clubs that coach hybrid athletes, PolySync is the coaching layer that makes the strength-endurance trade-off for every athlete, every week, sends the coach only the cases that need judgement, and shows the rule and evidence behind every plan. Delivery platforms leave the trade-off to the coach; consumer apps leave out the coach and the club.

## 5. Moat: what is copyable and what is not

| Asset | Copyable? | Plan |
|---|---|---|
| Scheduling rules H1–H9 | Yes, they are published in this repo on purpose | Openness builds coach trust. The rules are not the moat |
| **Coach-signed protocol library** | Slow to copy: needs named coaches and their time | Start sign-off now (GAPS #4) |
| **Escalation-outcome data**: every coach decision on a blocked proposal | Only accrues with usage | Log `coach_decision` from pilot day 1 |
| Club distribution in the GCC | Relationship-bound | Pilot clubs become reference customers |

## 6. Pricing logic

- **Unit:** per active athlete-month, billed to the club.
- **Level:** $8 (AED 29) is a hypothesis, bounded by delivery software below and consumer apps above. The pilot LOIs test it (pass bar ≥ $5).
- **Athlete tier (ADR-010):** freemium, sold directly. Price not set yet: it is designed against the $9–10 consumer hybrid apps (COM-001, COM-002) and must beat the 2.9% Health & Fitness download-to-paid median.
- **Pitch by market** (model output, base case):

  | Market | Pitch | Club ROI | Coach capacity |
  |---|---|---|---|
  | UAE | Capacity; lower coach wages make the time-saved case thin, and the bear case is negative | 1.5x | ~40 → ~190–230 athletes per coach, by segment |
  | US | Time saved | 4.7–5.0x | ~40 → ~190–230 athletes per coach, by segment |

- **Not offered: a managed coaching service.** To reach a 70% margin, PolySync-employed coaches would need about $11–13 per athlete-month in the UAE and $32–39 in the US ([financial model](financial-model.md)). That is a services business with a different P&L (doc 11's warning, now quantified).

## 7. Go-to-market

1. **UAE pilot:** 3 HYROX training clubs, flexible-schedule athletes first ([pilot plan](pilot-plan.md), ADR-006, ADR-008).
2. **Case study** with the pilot's measured coach minutes and amber-day outcomes by segment.
3. **US boutique hybrid gyms** (ADR-005), through coach networks. Land the head coach, expand to the club.

## 8. Non-goals

- A consumer app with its own, lighter logic. The athlete tier (ADR-010) runs on the same engine and safety layer as the club tier.
- Clinical or rehab populations.
- Plans from outside the engine: every plan, in either tier, comes from the engine and passes the rules.
- Wearable-first features.
- Any injury-prevention or performance claim that has not been measured (ADR-007).

## 9. What would change our mind

| Signal | Decision it reverses |
|---|---|
| Fewer than 2 of 5 UAE owners sign an LOI | UAE-first (ADR-006) |
| Hand-programming baseline under 12 coach minutes per athlete-week (UAE break-even is 10.8) | The time-saved pitch in the UAE |
| Share of amber-day hard sessions kept differs from the simulation by more than 15 points in a segment | The segment model (ADR-008) |
| Coach agreement above 90% for 3 months on green-tier adaptations | Widen autonomous bounds for green tier only (ADR-003) |

## 10. Status of every claim on this page

| Claim | State |
|---|---|
| Interference science | **Evidence**, grade A ([register](evidence.md)) |
| Rules enforced; unsafe proposals blocked | **Measured** in CI ([results](../evals/results/hybrid-latest.json)) |
| Escalation by schedule segment | **Simulated** from the engine's own rules |
| Coach minutes, price, athletes per club | **Hypotheses** that the pilot replaces |
| Market size | **Company-reported**, grade B/C, used as order of magnitude only |
