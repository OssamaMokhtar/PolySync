# PolySync — Decision Log

> Status: AUTHORED from decisions already made · Owner: Ossama Mokhtar

Each ADR states what was rejected and the measurable condition that would reverse the call. An ADR without a reversal trigger is a press release.

## ADR-001 — B2B2C over direct-to-consumer

**Status:** Accepted

**Context.** Consumer fitness has brutal CAC and 3-month retention cliffs. The product's differentiator — a human coach in the loop — is unaffordable at consumer price points and is exactly what orgs already pay for.

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| D2C subscription | Fast feedback, no sales cycle | CAC, churn, coach economics impossible | Rejected |
| **B2B2C via gyms, teams, federations, corporate wellness** | Coach cost already in the buyer's P&L; roster distribution; contract retention | Long sales cycle; three stakeholders to satisfy; the coach can block adoption | **Chosen** |
| Pure B2B tooling for coaches | Simplest | Cedes the athlete relationship and the data | Rejected |

**Consequences.** Makes coach console quality a revenue dependency, not a nice-to-have. Makes athlete engagement necessary but not sufficient — renewal is an org decision.

**Reversal trigger.** Sales cycle exceeds TBD months at median, or org-level renewal falls below TBD% while athlete engagement holds — that combination means the value is landing on athletes and the wrong party is being asked to pay.

---

## ADR-002 — Hybrid athletes as a conviction segment

**Status:** Accepted

**Context.** Hybrid athletes are underserved precisely because their problem is hard: endurance and strength adaptations interfere, and no mainstream app resolves the trade-off — they run two plans in parallel and let the athlete collide them.

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| Broad "fitness" | Bigger TAM | No wedge, competes with incumbents on brand | Rejected |
| Single-sport (running or lifting) | Clear comparables | Crowded; no defensible logic | Rejected |
| **Hybrid athletes** | The interference problem *requires* real programming logic — a defensible moat; passionate, articulate segment | Smaller TAM; harder to explain to generalist buyers | **Chosen** |

**Consequences.** The programming engine (doc 12) must actually resolve concurrent-training interference. This is the product; everything else is delivery.

**Reversal trigger.** If the org buyers who convert are systematically *not* hybrid-focused, the segment is a marketing story rather than a product constraint — narrow the claim or widen the engine deliberately, not by drift.

---

## ADR-003 — Human coach in the loop, structurally

**Status:** Accepted

**Context.** Autonomous training prescription carries injury liability and, in B2B2C, the coach is also the adoption gatekeeper. Human-in-loop is both a safety control and a channel strategy.

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| Fully autonomous | Software margins | Liability, low trust, coach hostility | Rejected |
| Human-on-the-loop (post-hoc review) | Cheaper | Review after harm is not a control | Rejected |
| **Human-in-the-loop on escalations and out-of-bounds deltas** | Real safety gate; coach leverage story; labelled training data from amendments | Coach minutes become a unit cost that scales with athletes | **Chosen** |

**Consequences.** Gross margin is a function of coach-minutes-per-athlete. See doc 11 — this is the number that decides whether the business is software or services.

**Reversal trigger.** Coach agreement rate sustained above 90% across 3 months on a held-out set → widen autonomous bounds for green-tier adaptations only. Escalation and red tier never becomes autonomous.

---

## ADR-004 — Deterministic engine prescribes; LLM explains and proposes

**Status:** Accepted

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| LLM writes the programme | Fast to build, feels magical | Unauditable, non-reproducible, unbounded regression risk | Rejected |
| **Deterministic engine + LLM proposal within bounds** | Reproducible, auditable, injection-resistant, degrades gracefully | More engineering; less "wow" in demo | **Chosen** |

**Consequences.** Provider outage degrades explanation, not training. Injection cannot change load. Eval gates become meaningful because prescription is testable.

**Reversal trigger.** None foreseeable at current liability posture. Revisit only if an independently-audited model demonstrates bounded prescription with formal guarantees.

---

## ADR-005 — Narrow from multi-region, multi-sport to a single beachhead

**Status:** Accepted

**Context.** Initial scope spanned USA, Europe, EMEA and APAC across multiple sports. That is a research scope, not a build scope — a funded build needs one buyer archetype in one regulatory regime.

**Beachhead (named):** US-based boutique endurance + strength hybrid athletics gyms and coach-staffed hybrid training programs operating under US state-level privacy law (no GDPR, no HIPAA-triggering claims). Single sport context: concurrent endurance + resistance training. Single coach archetype: certified S&C coach managing 20–60 hybrid athletes.

**Why this beachhead:**
- US state privacy law is the simplest regime to ship under and audit against.
- Boutique gyms have the coach-in-the-loop economics already in their P&L (ADR-001).
- Hybrid athletes are the segment where the interference problem is acute enough to make the deterministic engine's logic a real moat (ADR-002).
- One sport context (concurrent endurance + resistance) keeps the protocol library depth-focused (ADR-002 consequence).

**What this excludes for now:**
- EU/GDPR (defer until beachhead retention proves the model).
- Direct-to-consumer (ADR-001).
- Single-sport specialist apps (no defensible moat — ADR-002).
- Clinical or deconditioned populations (out of scope by design — see doc 07 §6).

**Consequences.** Protocol library depth over breadth; one compliance regime; reference customers concentrated enough to be quotable.

**Reversal trigger.** Beachhead segment saturated (TBD% penetration of reachable orgs) or a second region's inbound demand exceeds TBD% of pipeline unprompted.

**Status note:** Beachhead named and the ADR is now complete. This closes gap #3 from GAPS.md (filled 2026-09-23).

---

## ADR-006: Validate in the UAE, scale in the US

**Status:** Accepted 2026-09-24 · Owner: Ossama Mokhtar · Closes GAPS #11

**Context.** ADR-005 named US boutique hybrid gyms as the beachhead. The founder is in Dubai, the first pilot has to be run in person, and the UAE has a dense, fast-growing HYROX scene. HYROX Abu Dhabi sold out, and at least four UAE gym brands run HYROX prep classes, including GymNation, an official HYROX Performance Center and Training Club in four emirates ([evidence](../product/data/evidence.json) MKT-006, MKT-007).

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| US first (ADR-005 as written) | Largest market; simplest privacy regime | No in-person access for coach interviews and pilot support; slow first signal | Rejected for the pilot |
| **UAE pilot, US scale** | Founder on site; HYROX clubs reachable directly; bilingual AR/EN is a real differentiator | UAE PDPL treats health and physical-condition data as sensitive (REG-001), so a DPIA comes before the pilot, not after | **Chosen** |
| Both at once | Wider funnel | Two regimes, two DPIAs, split attention for a solo builder | Rejected |

**Consequences.**
- ADR-005's US segment stays the **scale** beachhead.
- The pilot targets 3 UAE HYROX training clubs (see [pilot plan](../product/pilot-plan.md)).
- A DPIA under the UAE PDPL is required before any athlete data is collected. Whether the health-data carve-out or a free-zone regime (DIFC, ADGM) applies needs legal review (GAPS #6).

**Reversal trigger.** Fewer than 2 of 5 UAE club owners interviewed sign a pilot letter of intent within 6 weeks. Then run the same interview script with 5 US boutique gyms before building anything else.

---

## ADR-007: Claims we refuse to make

**Status:** Accepted 2026-09-24 · Owner: Ossama Mokhtar

**Context.** Fitness products routinely claim injury prevention from load rules. We checked the evidence behind our own rules.
- A 10%-per-week progression rule did not reduce injuries in a 532-runner RCT (SCI-006).
- 27.5% of injuries in one elite cohort happened inside the ACWR "sweet spot" (SCI-007).

**Decision.**
- The weekly load limit (H5, B7) and the acute:chronic signal (H6) stay in the product as **conservative limits that route to a coach**. They are never marketed as injury prevention.
- PolySync makes no claim it cannot measure. "Resolves the interference trade-off" is a claim about scheduling, which the evals check. "Reduces injuries" or "makes you faster" are outcome claims, and they wait for pilot data.

**Rejected.** Using the ACWR sweet spot as a safety claim. It is easy to market and not supported.

**Reversal trigger.** Pilot or published evidence showing a specific load rule changes injury incidence in hybrid athletes.

---

## ADR-008: Segment by schedule flexibility

**Status:** Accepted 2026-09-24 · Revised 2026-09-24 after adversarial review · Owner: Ossama Mokhtar

**Context.** The hybrid eval simulates an amber-readiness day for every hard session across 3,240 athlete schedules ([results](../evals/results/hybrid-latest.json), `amber_outcomes_by_schedule`). The engine moves the session to a later day if a move passes every rule; otherwise it makes the session easy in place and tells the coach a session was lost; it escalates only if neither passes. The share of hard sessions kept by moving them is 77% for athletes who accept doubles on 5–7 days, 43% in the middle segment, and 6% for athletes limited to one session a day on 3–5 days. Whether doubles are acceptable matters more than the number of days.

**First version and why it changed.** The first version of this ADR said escalation fell from 90–100% (3–4 fixed days) to about 25% (6–7 days with doubles) and priced segments by coach cost. That engine could only move or escalate. An adversarial review showed the rates were an artifact of the missing make-easy option. With it, escalations in the grid are 0 and the coach-time gap between segments is about 2.6 minutes per athlete-month. The segment still matters, but for training quality, not cost.

**Decision.**
1. Onboarding asks whether the athlete can train twice on some days, then which days, before anything else.
2. The pilot recruits flexible athletes first ([pilot plan](../product/pilot-plan.md)).
3. Rigid athletes are told at onboarding that on low-readiness days most hard sessions will be made easy, not moved.
4. The [financial model](../product/financial-model.md) keeps segment-level coach minutes, and one blended price.

**Rejected.** Pricing by segment. The cost difference is too small to justify the complexity. Revisit if pilot rates differ.

**Reversal trigger.** In the pilot, the share of amber-day hard sessions kept differs from the simulation by more than 15 points in any segment (pass bar 4). Then re-fit the model to observed rates.

---

## Operating decisions

| Decision | Owner | Date |
|---|---|---|
| Rollback decision owner (doc 08 §4) | Ossama Mokhtar | 2026-09-24 |
| Data ownership on offboarding: org owns roster and programme data; athlete owns and can export personal physiological data ([doc 02 decision](02-data-ownership-decision.md)) | Ossama Mokhtar | 2026-09-23 |
