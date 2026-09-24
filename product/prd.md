# PolySync PRD: the pilot release

> Status: AUTHORED · 2026-09-24 · Owner: Ossama Mokhtar · One page. Detail lives in the linked docs; if this page and a linked doc disagree, the doc wins and this page is wrong.

## Problem

Hybrid athletes train strength and endurance together, and the evidence says the cost is mostly in **scheduling**: power suffers when the two share a session, and rest between them changes outcomes ([evidence](evidence.md), SCI-001 to SCI-005). Coaches solve this by hand, one athlete a week at a time, so a club's hybrid roster grows only as fast as it can hire coaches. Consumer apps now claim to automate the scheduling for $9–10 a month, but they leave out the coach and the club ([landscape](competitive-landscape.md)).

## Who

| Role | Job | Pilot success for them |
|---|---|---|
| **Club owner** (buyer) | More hybrid members without hiring coaches linearly | Signs a paid LOI; continues after week 8 (pass bars 1, 8) |
| **Head coach** (gatekeeper) | See only the athletes who need me; trust the rest | ≤ 18 coach minutes per athlete-month (pass bar 3) |
| **Hybrid athlete** (user) | One plan that makes the strength-endurance trade-off for me | ≥ 70% of prescribed sessions completed (pass bar 7) |

## Decision this release makes

The engine prescribes; the model proposes and explains; the coach handles what neither can resolve ([ADR-004](../docs/10-decision-log.md)). PolySync sells the **coach console and the audit trail**, not the scheduler ([ADR-009](../docs/10-decision-log.md)).

## Requirements (P0 for the pilot)

| # | Requirement | Acceptance | State |
|---|---|---|---|
| P0-1 | Weekly plan from the hybrid engine, rules H1–H9 | 0 of 3,240 engine weeks break a blocking rule | **Built**, CI |
| P0-2 | Model proposals pass every rule or never reach the athlete | 7,877 of 7,877 attacks blocked by the expected rule | **Built**, CI |
| P0-3 | Amber day: move, else make easy (coach told), else escalate; red or pain always escalates | 0 of 13,674 adaptations and 0 of 4,628 delivered weeks break a rule | **Built**, CI |
| P0-4 | Onboarding asks "can you train twice on some days?" first | Segment recorded for every athlete ([ADR-008](../docs/10-decision-log.md)) | Not built |
| P0-5 | **Coach console**: one queue of lost sessions, escalations and pain flags, each with the rule, the evidence and a one-tap decision | Median review ≤ 2 min per item, logged as `coach_decision` | Not built (GAPS #13) |
| P0-6 | Athlete app on the hybrid engine: today, why (≤ 60 words, cites the rule), log | Every plan screen shows the rule behind a change | Not built (GAPS #13) |
| P0-7 | Server data layer with verified identity | Emulator tests pass; no client-SDK access from the server | Not built (GAPS #12) |
| P0-8 | Consent, export and delete; DPIA under UAE PDPL | DPIA signed before the first athlete record | Not built (GAPS #6) |
| P0-9 | Telemetry for every model driver | 15 events and 6 studies mapped ([telemetry plan](telemetry-plan.md)) | 5 of 15 events logged |

## Metrics

- **North star:** adapted sessions completed per athlete per week.
- **Business:** coach minutes per athlete-month; club ROI at the pilot price.
- **Guardrails, each blocking release:** 0 contraindication leaks, 100% of pain flags escalated, 0 unsafe proposals reaching an athlete.

## Non-goals

A consumer tier, clinical or rehab populations, wearable-first features, any injury-prevention or performance claim not measured ([ADR-007](../docs/10-decision-log.md)), and a managed coaching service.

## Top risks

1. Coach minutes by hand are lower than modelled, so the club's time-saved case is thin (pass bar 2, break-even 10.8 min per athlete-week).
2. A coach platform ships interference-aware scheduling with coach review (MKT-03, ADR-009's reversal trigger).
3. Model proposals are poor and flood the coach queue (AI-01; model-in-the-loop evals, GAPS #1).

Full register: [risk register](risk-register.md). Sequence: [roadmap](roadmap.md). Economics: [financial model](financial-model.md). Pilot design: [pilot plan](pilot-plan.md).
