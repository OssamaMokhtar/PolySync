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

**Amended by ADR-010 (2026-09-24):** a freemium athlete app now runs alongside the club tier, on the same engine and safety layer.

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

## ADR-009: Sell the coach console and the audit trail, not the scheduler

**Status:** Accepted 2026-09-24 · Owner: Ossama Mokhtar

**Context.** A competitor scan on 24 Sep 2026 ([landscape](../product/competitive-landscape.md)) found three consumer apps that already claim interference-aware hybrid scheduling for $9–10 a month: Hypla, HybridX and Athletica (COM-001 to COM-003). The 10 Sep radar said cross-sport load management was unclaimed; that is no longer true. Coach platforms (Trainerize, FITR, TrainHeroic) own the coach relationship but leave the strength-endurance trade-off to the coach or to a generic AI builder. Demand still leans human: only 10% of fitness participants prefer an AI-created workout (MKT-008), and Future dropped its AI coaching beta after four months (MKT-009).

**Decision.**
1. PolySync competes with coach platforms for the club, not with consumer apps for the athlete.
2. The next build is the coach console (queue of lost sessions, escalations and pain flags, with the rule and evidence behind each) and the audit trail a club's risk owner can read. Not more scheduler features.
3. The scheduler stays open (rules and evals published). It earns trust; it is not the moat.

**Rejected.**
- A consumer tier to compete at $9–10 *on scheduling*: no coach, no club, no differentiation. (ADR-010 later added an athlete tier that competes on trust and safety instead.)
- Out-featuring consumer apps on scheduling: they ship faster and it does not change who pays.

**Reversal trigger.** A coach platform ships interference-aware scheduling with coach review and published rules. Then the moat is only coach-signed protocols and outcome data (strategy §5), and the price must be re-tested.

## ADR-010: Two tiers: a freemium athlete app alongside the club tier

**Status:** Accepted 2026-09-24 · Owner: Ossama Mokhtar · Amends ADR-001 (direct-to-consumer was rejected) and ADR-009 (a consumer tier was rejected)

**Context.** The design engagement ([polysync-design-system](https://github.com/OssamaMokhtar/polysync-design-system), Phase 1) set its KPIs as time to first workout, D7/D30 retention, AI trust and paywall conversion. The last three need a direct athlete relationship. The same research found that consumer AI coaches lose trust over invented data and surprise billing: on Trustpilot they sit 1.3–2.0 points below their App Store ratings. PolySync's engine, rules and CI-proven safety answer exactly that.

**Decision.**
1. Ship a freemium athlete app sold directly, built on the same engine, rules (H1–H9, B1–B9) and safety layer as the club tier. No separate "consumer" logic.
2. The club tier (ADR-001, ADR-009) stays. Club members get the paid tier through their club, and the coach console remains the club's product.
3. The athlete app competes on **trust and safety**, not on scheduling (ADR-009 still holds: the scheduler is not the moat). It never shows a number the system didn't measure; every change shows its rule; billing is transparent.
4. Every plan, in either tier, comes from the engine and passes the rules. The model only explains and proposes (ADR-004).

**Rejected.**
- A consumer tier with its own lighter safety layer: that recreates the trust gap the research found.
- Club-only: no direct funnel, and the retention and paywall KPIs can't be measured.

**Consequences.**
- Two funnels share one engineer. The coach console (GAPS #13) and athlete onboarding (GAPS #16) compete for the same capacity.
- GDPR applies when the athlete app launches in the EU (ADR-006 sequence: UAE, then US and EU).

**Reversal trigger.** Download-to-paid by day 35 stays below the Health & Fitness median (2.9%, RevenueCat 2026) after two paywall iterations. Then fold the athlete app back into club-only distribution.

---

## ADR-011: One wedge, three gated options; the super-app expansion is not the plan

**Status:** Accepted 2026-09-24 · Owner: Ossama Mokhtar · Reaffirms ADR-005 (one sport context, one beachhead) · Evidence: [idea validation vision](../product/idea-validation-vision.md)

**Context.** An expanded "super-app" narrative proposed adding martial-arts AI shadowing, a global coach marketplace, computer vision trained on social-media video, automatic athlete tiers, body-photo tracking, a youth-football "golden ratio" and a five-region launch. Each claim was checked against a primary source ([validation data](../product/data/validation.json)). Three load-bearing claims are unverifiable or wrong, one statistic contradicts itself, and three ideas cross legal or safety lines.

**Decision.**
1. PolySync stays one product: the hybrid engine, the coach console and the athlete app, piloted in UAE HYROX clubs (ADR-005, ADR-006, ADR-010).
2. Three expansions become options, each with a cheap test and a kill criterion before any code: **A** technique drills for slow skills through club coaches; **B** youth football through academies; **C** a coach marketplace beyond clubs, only after 20+ coaches actively use the console.
3. Not built: training models on scraped social-media video; body-fat estimates from photos; any named player's likeness; five regions at once.

**Rejected.**
- The full super-app: five businesses, three surfaces and five regulatory regimes for one engineer.
- Dropping the ideas outright: A and B have plausible buyers and cheap tests.

**Consequences.**
- The roadmap gains three gated items and three "not planned" items.
- UAE Federal Law 2/2019 (health data localisation) joins the pilot's counsel questions (risk REG-03).
- Every claim has a repair path ([claim repair plan](../product/idea-validation-vision.md#claim-repair-plan)): 2 restated claims are validated by existing evidence; 9 are testable and each names the proof that would validate it. The repaired vision runs in five gated stages; a failed proof stops its stage.

**Reversal trigger.** An option's test passes its bar (A: 30%+ of 20 concierge athletes would pay and coaches agree on scores; B: an academy co-designs and pays; C: 20+ active console coaches). Then it gets its own ADR and build plan.

---

## ADR-012: One product per repo; the engine is its own package

**Status:** Accepted 2026-09-24 · Owner: Ossama Mokhtar · Boundaries: [ARCHITECTURE.md](../ARCHITECTURE.md)

**Context.** The PolySync runtime was first built inside PolyVerses, an agentic product-management workbench, and moved here on 2026-09-23 with its full history. That history carried 187 commits of Product Leadership OS (PLOS) skills and the PolyVerses workbench, and the tree kept leftovers: PolyVerses planning docs, a PM onboarding screen, a Firestore blueprint for workbench documents and PolyVerses copy in the app. The engine sat inside the app (`app/src/engine`) while the evals, the prototype and ProjectOS imported it from there, and the prototype imported code from ProjectOS.

**Decision.**
1. This repo holds PolySync only. PolyVerses and PLOS stay in their own repositories. The PolySync branch is rebuilt on the squashed `main` history, so its commits contain no PolyVerses or PLOS work.
2. The leftovers are removed: PolyVerses-era docs in `app/docs`, the unused PM onboarding screen, the workbench Firestore blueprint and security spec, and PolyVerses copy and links.
3. The engine moves to a top-level `engine/` package with no runtime dependencies; the exercise library and the body-load display model move with it. `app/`, `evals/`, `prototype/` and `portal/` import it; nothing imports the leaves.
4. `scripts/check-boundaries.mjs` gates both rules in CI: allowed imports per area, and no PolyVerses or PLOS names, agents, skills or orchestration components outside a short allow-list.

**Rejected.**
- Keeping the imported history for provenance: it made PLOS look like part of PolySync on every branch and pull request. Provenance is recorded here instead.
- A monorepo with npm workspaces: one shared package does not justify workspace tooling; relative imports plus the gate give the same guarantee.
- Renaming the Firestore database: it predates the split and renaming it means a data migration for no user benefit.

**Consequences.**
- Branch and pull-request history no longer shows PolyVerses or PLOS commits. One file (`AthenaCodeStore.ts`) remains in the history of the squash commit that merged PR #3 on `main`; old pull-request refs keep their commits until GitHub removes them.
- CI gains `engine` and `boundaries` jobs; the app job no longer runs the engine's tests or evals.

**Reversal trigger.** A second product needs the engine: then publish `engine/` as a versioned package rather than sharing the repo.

---

## Operating decisions

| Decision | Owner | Date |
|---|---|---|
| Rollback decision owner (doc 08 §4) | Ossama Mokhtar | 2026-09-24 |
| HIPAA treated as not applicable: PolySync is not a covered entity or a business associate of one. **Counsel to confirm** before any US health-system partnership. Health data is still handled as sensitive under UAE PDPL and, at EU launch, GDPR special-category rules | Ossama Mokhtar | 2026-09-24 |
| Data ownership on offboarding: org owns roster and programme data; athlete owns and can export personal physiological data ([doc 02 decision](02-data-ownership-decision.md)) | Ossama Mokhtar | 2026-09-23 |
