# Case study: making an AI coach that is not allowed to prescribe

> Status: AUTHORED · Updated 2026-09-24 · Owner: Ossama Mokhtar

**Outcome so far:** the safety and scheduling layers are measured in CI. An AI coaching product was reframed around the one number that decides its business: coach minutes per athlete. No users yet, and the pilot is designed to change that.

## Problem

Hybrid athletes train strength and endurance at the same time. The obvious AI product is a chatbot that writes their plan. I rejected that for three reasons:

- A model's plan cannot be audited.
- Injected text in a note or a wearable field could reach the plan unchecked.
- Clubs, the paying customer, will not accept liability for a plan nobody can explain.

## Decisions and trade-offs

| Decision | Trade-off accepted | Record |
|---|---|---|
| A deterministic engine prescribes; the model only proposes and explains | Less "wow" in a demo; more engineering | ADR-004 |
| Sell to clubs (B2B2C), with a human coach in the loop | Longer sales cycle; coach time becomes the unit cost | ADR-001, ADR-003 |
| Parameters from peer-reviewed evidence, each rule citing its source | Slower than picking plausible numbers | [Evidence register](evidence.md) |
| Refuse injury-prevention claims the evidence does not support | Weaker marketing copy | ADR-007 |
| Validate in the UAE, scale in the US | A stricter data regime first (sensitive physical-condition data) | ADR-006 |
| Segment by schedule flexibility (can the athlete train twice a day?) | A longer onboarding; rigid athletes told up front they will lose sessions on bad days | ADR-008 |

## What I found when I audited my own flagship

A portfolio audit on 23–24 Sep 2026 read the code against the docs, and the code was behind the docs in four places:

1. **The engine had no hybrid logic.** It generated generic gym sessions. The interference rules existed only in a design doc. **Fixed:** built `hybrid.ts` with rules H1–H9.
2. **The model's plan was saved directly**, contradicting ADR-004. **Fixed:** every proposal now passes the checkers.
3. **The server trusted a client-supplied user id**, so anyone could act as any athlete. **Fixed:** verified Firebase ID tokens.
4. **The production server crashed on boot**, and no gate ever started it. **Fixed:** a CI boot check.

The lesson: a design doc is a claim. Each fix above now ships with a test or a CI gate, so the claim cannot drift from the code again.

## What I got wrong, and how the review caught it

After the fixes above I ran an adversarial review against my own work: one reviewer, told to break the engine and to challenge every number in the README. It found seven problems. All are fixed, and each fix is now a test or a CI gate.

| # | Finding | Fix | Gate that keeps it fixed |
|---|---|---|---|
| 1 | Rest between sessions was measured start-to-start and only within a day, so a 22:00 strength session followed by a 03:00 run passed | Rest is measured end-to-start in absolute hours, across midnight | Attack HM9; unit test |
| 2 | A proposal could relabel its own block priority, or mark heavy strength as RPE 2, to slip past the rules | The athlete's profile sets priority; each modality has an RPE band | Attacks HM10, HM11 |
| 3 | With no training history, a proposal could raise load without limit | Load is held to the engine's own week when no history exists | Attack HM4b |
| 4 | The fallback week, the one the athlete gets when a proposal is blocked, could itself break the readiness rules | Readiness is applied to the engine week before delivery | New set: 0 of 4,628 delivered weeks break a rule |
| 5 | Two API fields were not validated; bad input crashed the route | Parsed and bounded; JSON 404 for unknown API paths; per-user rate limit | Unit tests; production boot check |
| 6 | **My headline finding was an artifact.** "62% of amber days escalate to a coach" came from an engine that could only move a session or escalate | Added make-easy-in-place. Escalations fell to 0; the finding changed from "rigid athletes cost more" to "rigid athletes train worse" | ADR-008 revised; model reads the new outcomes from CI |
| 7 | A pilot pass bar sat below the model's own break-even, so the pilot could "pass" while losing the club money | Bar raised from 8 to 12 hand-minutes per athlete-week (break-even 10.8) | The product build fails if the bar drops below break-even |

The lesson: a green CI run proves the code matches its rules, not that the rules or the story are right. The review was worth more than the first build.

## Results (measured, reproducible from CI)

| What | Result |
|---|---|
| Engine weeks that break a blocking rule | **0 of 3,240** profiles |
| Adversarial proposals blocked (21 attack types across both layers, including injected text) | **7,877 of 7,877**, each by the expected rule and routed to a coach |
| Safe proposals accepted | **657 of 657** |
| Contraindicated exercises in generated plans | **0 of 8,640** |
| Amber-day adaptations that break a rule | **0 of 13,674** simulated |
| Delivered weeks that break a rule for the day's readiness | **0 of 4,628** |

The finding that shaped onboarding came from the simulation, not the model. Share of hard sessions the engine keeps on low-readiness days by moving them rather than making them easy:

- **77%** for athletes who accept doubles on 5–7 days.
- **6%** for athletes limited to one session a day on 3–5 days.

Whether doubles are acceptable matters more than the number of days, so it is the first onboarding question and the pilot's recruiting filter.

## What is not proven

- Real coach minutes.
- Whether clubs pay.
- Whether athletes adhere.

19 of the 24 model drivers are hypotheses, each mapped to the telemetry event or study that will replace it. The [pilot](pilot-plan.md) has eight pass bars written before any data exists.

## What I would kill

- **The managed-coaching variant.** A 70% margin would need about $11–13 per athlete-month in the UAE and $32–39 in the US, against a software price of $8. That is a services business, and I would rather not build it by accident.
- **Any feature that makes the model write plans.** It is the demo everyone asks for and the one I will not ship.
