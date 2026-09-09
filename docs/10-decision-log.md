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

**Consequences.** Protocol library depth over breadth; one compliance regime; reference customers concentrated enough to be quotable.

**Reversal trigger.** Beachhead segment saturated (TBD% penetration of reachable orgs) or a second region's inbound demand exceeds TBD% of pipeline unprompted.

**TBD:** name the beachhead explicitly in this ADR. A decision log that says "we narrowed" without saying to what is not yet a decision.
