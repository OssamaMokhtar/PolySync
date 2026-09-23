# Case study: making an AI coach that is not allowed to prescribe

> Status: AUTHORED · Updated 2026-09-24 · Owner: Ossama Mokhtar

**Outcome so far:** the safety and scheduling layers are measured in CI. An AI coaching product was reframed around the one number that decides its business: coach minutes per athlete. No users yet, and the pilot is designed to change that.

## Problem

Hybrid athletes train strength and endurance at the same time. The obvious AI product is a chatbot that writes their plan. I rejected that for three reasons:

- A model's plan cannot be audited.
- A prompt injection could change training load.
- Clubs, the paying customer, will not accept liability for a plan nobody can explain.

## Decisions and trade-offs

| Decision | Trade-off accepted | Record |
|---|---|---|
| A deterministic engine prescribes; the model only proposes and explains | Less "wow" in a demo; more engineering | ADR-004 |
| Sell to clubs (B2B2C), with a human coach in the loop | Longer sales cycle; coach time becomes the unit cost | ADR-001, ADR-003 |
| Parameters from peer-reviewed evidence, each rule citing its source | Slower than picking plausible numbers | [Evidence register](evidence.md) |
| Refuse injury-prevention claims the evidence does not support | Weaker marketing copy | ADR-007 |
| Validate in the UAE, scale in the US | A stricter data regime first (sensitive physical-condition data) | ADR-006 |
| Segment and price by schedule flexibility | A more complex onboarding | ADR-008 |

## What I found when I audited my own flagship

A portfolio audit on 23–24 Sep 2026 read the code against the docs, and the code was behind the docs in four places:

1. **The engine had no hybrid logic.** It generated generic gym sessions. The interference rules existed only in a design doc. **Fixed:** built `hybrid.ts` with rules H1–H9.
2. **The model's plan was saved directly**, contradicting ADR-004. **Fixed:** every proposal now passes the checkers.
3. **The server trusted a client-supplied user id**, so anyone could act as any athlete. **Fixed:** verified Firebase ID tokens.
4. **The production server crashed on boot**, and no gate ever started it. **Fixed:** a CI boot check.

The lesson: a design doc is a claim. Each fix above now ships with a test or a CI gate, so the claim cannot drift from the code again.

## Results (measured, reproducible from CI)

| What | Result |
|---|---|
| Engine weeks that break a blocking rule | **0 of 3,240** profiles |
| Adversarial proposals blocked (8 attack types, including injected text) | **3,593 of 3,593**, each by the expected rule and routed to a coach |
| Safe proposals accepted | **463 of 463** |
| Contraindicated exercises in generated plans | **0 of 8,640** |
| Amber-day adaptations that break a rule | **0 of 13,674** simulated |

The finding that changed the product came from the simulation, not the model. Share of hard sessions a coach must handle on low-readiness days:

- **About 25%** for athletes available 6–7 days who accept doubles.
- **90–100%** for athletes with 3–4 fixed days.

Coach minutes decide whether PolySync is software or services, so schedule flexibility became the first onboarding question and the pilot's recruiting filter.

## What is not proven

- Real coach minutes.
- Whether clubs pay.
- Whether athletes adhere.

18 of the 23 model drivers are hypotheses, each mapped to the telemetry event or study that will replace it. The [pilot](pilot-plan.md) has eight pass bars written before any data exists.

## What I would kill

- **The managed-coaching variant.** A 70% margin would need $12–17 per athlete-month in the UAE and $36–52 in the US. That is a services business, and I would rather not build it by accident.
- **Any feature that makes the model write plans.** It is the demo everyone asks for and the one I will not ship.
