# PolySync idea validation vision

> Status: GENERATED from `product/data/*.json` by `product/scripts/build.mjs` · As of 2026-09-24 · Do not edit by hand

**The core idea holds. The super-app expansion is not validated.** The hybrid engine, the coach in the loop and the club buyer are backed by evidence, CI and a market scan. The expansion bundles five businesses into one launch across five regions for one engineer; three of its load-bearing claims are unverifiable or wrong, one statistic contradicts itself, and three ideas cross legal or safety lines. It also reopens ADR-005, which already narrowed PolySync to one sport context and one beachhead.

**Input.** An expanded 'super-app' narrative for PolySync drafted in a DeepSeek conversation (shared 2026-09-24). It added martial-arts AI shadowing, a global coach marketplace, computer vision trained on social-media video, a McKay athlete-tier model, body-photo tracking, a 'Maldini golden ratio' for youth football and a five-region launch. It is treated here as a set of hypotheses to check, not as evidence.

## Claim by claim

| # | Narrative | Claim | What the check found | Verdict | So what | Evidence |
|---|---|---|---|---|---|---|
| N1a | Hybrid athlete trend | Google searches for 'hybrid athlete' tripled between Dec 2025 and Apr 2026 | No source found for the figure | ? **unverified** | Drop it from any pitch. HYROX participation (MKT-001, MKT-005) is the verified demand signal. | — |
| N1b | Hybrid athlete trend | The interference dogma is overturned: concurrent training doesn't impair strength or muscle | The 2022 meta-analysis (43 studies) finds no loss of hypertrophy or maximal strength, but explosive strength is attenuated (SMD -0.28), more so when both are trained in the same session | ✕ **misread** | This framing argues against PolySync. The accurate version, 'mostly compatible except power and timing', is why the engine exists (rules H1, H2). | [SCI-001](data/evidence.json), [SCI-002](data/evidence.json), [SCI-003](data/evidence.json), [SCI-004](data/evidence.json) |
| N2a | Martial-arts AI shadowing | No app has solved martial-arts coaching; 0% of martial-arts gyms coach online | The 0% figure is not in the source it points to. Several AI martial-arts and boxing apps are already on the stores | ✕ **contradicted** | The gap is not that nobody built it; it is that it does not work well yet. | [COM-007](data/evidence.json) |
| N2b | Martial-arts AI shadowing | A phone camera scores a user's technique against elite practitioners in real time | A review of five AI boxing apps found identical feedback across different videos and about 10 of 70 punches tracked; a single camera cannot see weight transfer (reviewer sells a rival app). A review of Zing found its camera claims misleading | ✕ **not-feasible** | Camera scores that feel wrong widen the trust gap that is PolySync's differentiator. Test slow techniques (stances, forms, guard) before fast strikes. | [COM-008](data/evidence.json), [COM-010](data/evidence.json) |
| N3 | Global coach marketplace | AI does 80% of coaching; a worldwide marketplace ranks coaches by credentials and outcomes | Market size and commission figures were not verified. Only 10% of fitness participants prefer an AI-created workout to a human-led one. Two-sided marketplaces face cold start and off-platform leakage; ranking by outcomes rewards picking easy clients | ◐ **plausible** | It conflicts with ADR-009: the club is PolySync's coach supply. A global marketplace is a different company; sequence it after the console has active coaches. | [MKT-008](data/evidence.json) |
| N4 | McKay athlete tiers | Six scientific tiers (with population shares), assigned and updated automatically from performance data | The framework is real. The population table is invented and contradicts itself (Tier 5 is 'top 0.0006%' and '~0.5%'). Tiers are defined by training volume and competition level, which a camera cannot observe | ✕ **misused** | Use it as a self-reported onboarding question. Drop the population table and camera-assigned tiers. | [SCI-009](data/evidence.json) |
| N5 | Youth football 'golden ratio' | Maldini averaged 0.56 challenges per game over his career; a Maldini-derived model tells a child '1.2 m too far from your mark' | Event-level tackle data covers at most the end of a 1985-2009 career, so a career average cannot have been measured. The 'Golden Index' is a team-statistics z-score, not a golden ratio. A single phone camera cannot measure distance to a mark in play. Camera-based youth football apps already exist | ? **folklore** | Separate buyer (parents and academies), separate data, separate law: children's privacy and a named player's image rights. Not part of PolySync's launch. | [COM-009](data/evidence.json) |
| N6 | Body-progress photos | Users, including children, upload body photos for AI body-fat estimates and muscle grades | Body-fat numbers from photos are unmeasured numbers, and body-composition feedback is an eating-disorder risk. Children's photos add children's-privacy law | ⛔ **red-line** | Conflicts with two product principles already shipped: never show an unmeasured number; eating-disorder topics are hard-blocked. Adults only, photos on device, no body-fat numbers, if ever. | — |
| N7 | Vision model trained on social video | Collect YouTube, Instagram and TikTok videos to train pose and technique models | YouTube's terms prohibit scraping; third-party AI training is off by default unless each creator opts in. Academic datasets do not grant commercial rights | ⛔ **red-line** | License datasets or capture consented footage with partner clubs. | [REG-004](data/evidence.json) |
| N8 | Five-region launch | Launch across the Gulf, USA, EU, LatAm and Asia with local compliance; UAE health data must stay in the UAE | The UAE law is real: Article 13 keeps health data in-country unless the health authority approves. Whether it reaches a wellness app is unsettled. Five regimes at once contradicts ADR-005 and ADR-006 | ! **real-constraint** | Blind spot in our own plan: add Federal Law 2/2019 to the pilot's counsel questions (risk REG-03); plan UAE-region hosting or on-device processing. | [REG-003](data/evidence.json), [REG-001](data/evidence.json) |
| N9 | Unit economics | $19.99/month consumer price with event-triggered voice coaching at about $6 per user per month | On the narrative's own numbers, voice alone is about 30% of the price, before app-store fees (15-30%), model calls and cloud GPUs for 3D replays | ◐ **thin-margin** | At the 2.9% download-to-paid median (ADR-010), acquisition cost must be near zero. Voice stays a later feature. | — |

**Verdict scale.** **validated**: Checked against a primary source; holds. **real-constraint**: True, and it changes what we build. **plausible**: Reasonable but untested; needs its own test. **misread**: The source is real but says something different. **misused**: A real framework applied where it does not fit. **unverified**: No source found; do not repeat it. **folklore**: Widely repeated; cannot have been measured. **contradicted**: The evidence says the opposite. **not-feasible**: Current technology cannot deliver it reliably. **thin-margin**: Possible, but the economics barely work. **red-line**: Legal or safety line; do not build.

## What is validated

- Strength and endurance interfere where it matters for athletes: power, and hard sessions close together ([SCI-003](data/evidence.json), [SCI-004](data/evidence.json), [SCI-005](data/evidence.json))
- The engine blocks every unsafe plan in the eval set (7,877 of 7,877) and routes it to a coach ([OWN-001](data/evidence.json))
- People want humans in their training: only 10% prefer an AI-created workout ([MKT-008](data/evidence.json))
- Demand for hybrid racing is real and growing, including in the UAE ([MKT-001](data/evidence.json), [MKT-005](data/evidence.json), [MKT-006](data/evidence.json))
- Consumer hybrid schedulers already exist at $9-10 a month, so the scheduler is not the moat ([COM-001](data/evidence.json), [COM-002](data/evidence.json), [COM-003](data/evidence.json))

## One wedge, three gated options (ADR-011)

| Track | Decision | Cheapest test before code | Kill criterion |
|---|---|---|---|
| **CORE** · PolySync: hybrid engine + coach console, UAE pilot | Build | The pilot as designed: 3 HYROX clubs, 8 weeks | The pilot pass bars (checked in CI) |
| **A** · Technique drills for slow skills (stances, forms, guard), delivered through club coaches | Test first | Two-week concierge test: 20 athletes film shadowing; a human coach scores it; then ask them to pay | Fewer than 30% would pay, or two coaches disagree on the same clip |
| **B** · Youth football through academies (the academy handles consent, not the app) | Test first | Two academy interviews and a letter of intent | No academy will co-design or pay |
| **C** · Coach marketplace beyond clubs | Wait | Only after 20+ coaches actively use the console | Coaches will not list, or athlete-coach pairs leave the platform |
| **X** · Social-video scraping, body-fat from photos, a named player's likeness, five regions at once | Don't build | — | — |

## The vision, if the gates pass

| Stage | What PolySync becomes | Gate |
|---|---|---|
| 1 · Now | The coach console and athlete app on the hybrid engine, in UAE HYROX clubs | Pilot pass bars |
| 2 · If A passes | Technique drills for slow skills, scored by the club's coach with the camera as an aid, not a judge | Concierge test: 30%+ willing to pay; coaches agree on scores |
| 3 · If B passes | An academy product for youth football, with consent, licensed data and no named-player likeness | One academy co-designs and pays |
| 4 · When the console has 20+ active coaches | Coaches outside clubs can list; ranking by credentials and risk-adjusted outcomes | Coach and athlete retention on-platform |

## Corrections to the input narrative

- The product name is PolySync, not 'Polysynce'.
- HIPAA applies to covered entities and their business associates, not to health data in general; PolySync treats it as not applicable (operating decision, counsel to confirm).
- Race claims such as 'first' or 'only' need a source; several competitors exist in every vertical the narrative names.

## Where this lives

- Data: [validation.json](data/validation.json) and new evidence in [evidence.json](data/evidence.json)
- Decision: [ADR-011](../docs/10-decision-log.md#adr-011-one-wedge-three-gated-options-the-super-app-expansion-is-not-the-plan)
- Risk: REG-03 in the [risk register](risk-register.md)
- Roadmap: options and not-planned items in the [roadmap](roadmap.md)
- ProjectOS: the Validation section
