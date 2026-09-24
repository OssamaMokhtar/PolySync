# PolySync

**AI coaching for hybrid athletes, where the model can propose but never prescribe.** B2B2C: clubs buy coach capacity; a human coach handles what the engine cannot resolve.

**[Open ProjectOS](https://ossamamokhtar.github.io/PolySync/)** (interactive: runs the real engine in your browser) · [One-page PRD](product/prd.md) · [Case study](product/case-study.md) · [Strategy](product/strategy.md) · [Competitive landscape](product/competitive-landscape.md) · [Roadmap](product/roadmap.md) · [Financial model](product/financial-model.md) · [Pilot plan](product/pilot-plan.md)

**Architecture docs:** [full set](docs/README.md) · [status](docs/00-unified-product-status.md) · [system architecture](docs/01-system-architecture.md) · [AI architecture](docs/04-ai-architecture.md) · [hybrid engine](docs/12-hybrid-athlete-programming-engine.md) · [evaluation](docs/07-evaluation-and-evidence.md) · [security](docs/08-security-and-deployment.md) · [decision log](docs/10-decision-log.md) · [UX review](docs/13-ux-review.md) · [gaps](docs/GAPS.md)

![ProjectOS walkthrough: a prompt injection and a cross-midnight spacing attack are blocked, a safe edit is accepted, and an amber day is handled with and without doubles](docs/media/projectos-walkthrough.gif)

*32 seconds of [ProjectOS](https://ossamamokhtar.github.io/PolySync/), which runs [`app/src/engine/hybrid.ts`](app/src/engine/hybrid.ts) unchanged in the browser. [Full 70-second walkthrough (MP4)](docs/media/projectos-walkthrough.mp4) covers the market finding, live economics, roadmap and pilot tracker.*

## The load-bearing decision

The **deterministic engine owns every load prescription** ([ADR-004](docs/10-decision-log.md)). The LLM explains and *proposes* changes. A proposal reaches the athlete only if it passes every rule; otherwise the engine's plan stands and a coach is asked.

- Model output, including injected instructions, reaches the athlete only as a week that passes every rule. Anything else is blocked and the engine's week stands. The rules bound what a proposal can do; they do not make it a good plan (GAPS #1).
- A model outage degrades the explanation, not the training.
- Safety is auditable by a club's risk function, and the evals mean something, because prescription is reproducible.

## What the engine does for hybrid athletes

It schedules strength, power and endurance under nine rules, each citing the study behind it ([evidence](product/evidence.md)). The largest recent meta-analysis ([Schumann et al., *Sports Medicine* 2022](https://link.springer.com/doi/10.1007/s40279-021-01587-7), 43 studies) found **no significant interference on strength or hypertrophy, but a real loss in power**, concentrated in same-session training. So the rules:

- protect power: no power work within 3 h after endurance;
- separate conflicting sessions by at least 6 h;
- put the block's priority quality first on shared days.

Two popular load rules stay as coach-attention limits, and **PolySync does not claim they prevent injuries**. The trials we read do not support that ([ADR-007](docs/10-decision-log.md#adr-007-claims-we-refuse-to-make)).

## Measured on every push

| Set | n | Result |
|---|---|---|
| Engine weeks breaking a blocking rule (hybrid) | 3,240 profiles | **0** |
| Unsafe proposals blocked by the expected rule and routed to a coach | 2,067 single-plan + 5,810 hybrid-week (21 attack types, including injected text, mislabelled effort and cross-midnight spacing) | **7,877 / 7,877** |
| Safe proposals accepted (the rules are not a wall) | 194 + 463 | **657 / 657** |
| Contraindicated exercises in generated plans | 8,640 plans | **0** |
| Amber-day adaptations that break a rule (moved or made easy) | 13,674 | **0** |
| Delivered weeks that break a rule for the day's readiness | 4,628 | **0** |
| Pain flags escalated to a coach | 2,263 | **2,263** |

Results: [`evals/results/`](evals/results/). These check the code against its own rules. They do not show that the rules are coach-approved (GAPS #4), that model proposals are good (GAPS #1), or that athletes do better (pilot).

## The finding that changed the product

On a low-readiness (amber) day the engine has three options for a hard session: **move** it to a later day, **make it easy** in place and tell the coach a session was lost, or **escalate**. The simulation showed that which one it can use depends mostly on one onboarding answer: *can the athlete train twice on some days?*

| Segment | Hard sessions kept on amber days (moved, not lost) |
|---|---|
| Flexible: doubles OK, 5–7 days | **77%** |
| Standard: doubles on 3–4 days, or 6–7 single-session days | 43% |
| Rigid: one session a day, 3–5 days | **6%** |

The coach-time difference between segments is small (about 2.6 minutes per athlete-month), so this is a training-quality finding, not a cost one. Rigid athletes lose most hard sessions on bad days. So onboarding asks about doubles first, the pilot recruits flexible athletes first, and rigid athletes are told up front what adapting will cost them ([ADR-008](docs/10-decision-log.md#adr-008-segment-by-schedule-flexibility)).

An earlier cut of this finding said 62% of amber days escalate to a coach. An adversarial review showed that was an artifact of an engine that could only move or escalate. With make-easy-in-place, escalations in the grid fell to 0 and the finding changed from "rigid athletes cost more" to "rigid athletes train worse" ([case study](product/case-study.md#what-i-got-wrong-and-how-the-review-caught-it)).

## The market finding

Three consumer apps at $9–10 a month already claim interference-aware hybrid scheduling ([landscape](product/competitive-landscape.md)). So PolySync does not sell the scheduler. It sells what none of the 11 products checked combine: a club buyer, a coach who reviews what the software cannot resolve, and rules plus safety evals a club can audit. The next build is the coach console ([ADR-009](docs/10-decision-log.md#adr-009-sell-the-coach-console-and-the-audit-trail-not-the-scheduler)). A freemium athlete app runs alongside the club tier on the same engine and safety layer, and competes on trust rather than scheduling ([ADR-010](docs/10-decision-log.md#adr-010-two-tiers-a-freemium-athlete-app-alongside-the-club-tier)).

## Product layer

| | |
|---|---|
| [One-page PRD](product/prd.md) | Problem, users, P0 requirements with acceptance criteria and state, metrics, non-goals |
| [Strategy](product/strategy.md) · [Competitive landscape](product/competitive-landscape.md) | Customer, positioning, moat, pricing, go-to-market; 12 products compared on four capabilities, sourced (ADR-009) |
| [Roadmap](product/roadmap.md) | Done / Now / Next / Later / Gated, sequenced by the gaps that block the pilot; a "done" item must point to a file |
| [Financial model](product/financial-model.md) · [xlsx](product/generated/polysync-unit-economics.xlsx) | Club ROI, coach capacity (~40 → ~210 athletes per coach), software margin, managed-service break-even; 19 of 24 drivers are hypotheses, each mapped to the event that will measure it |
| [Pilot plan](product/pilot-plan.md) | UAE, 3 HYROX clubs, 8 weeks, pass bars set before data ([ADR-006](docs/10-decision-log.md#adr-006-validate-in-the-uae-scale-in-the-us)) |
| [Risk register](product/risk-register.md) | 15 risks; a mitigation counts only with a test, gate or decision behind it |
| [Telemetry plan](product/telemetry-plan.md) · [Evidence](product/evidence.md) | North star, events, studies; 26 claims graded A–D |

All product numbers are generated from [`product/data/`](product/data/) by [`product/scripts/build.mjs`](product/scripts/build.mjs). CI fails in any of these cases:

- a driver has no source;
- a risk's control evidence does not exist;
- the evidence drifts from eval results;
- a generated doc is stale;
- the README's headline eval numbers or the pilot pass bars disagree with the results and the model.

## Architecture

```mermaid
flowchart LR
  APP[Athlete app] --> API[API<br/>verified ID tokens]
  CON[Coach console] --> API
  API --> ENG[Engine<br/>deterministic]
  API --> LLM[Model<br/>proposes, explains]
  LLM --> CHK[Rules H1-H9<br/>+ bounds B1-B9]
  CHK -->|pass| ENG
  CHK -->|block| ESC[Coach queue]
```

## Status

| Layer | State |
|---|---|
| Engine: single-modality plans + bounds checker (B1–B9) | **Built**, enforced on the plan route |
| Engine: hybrid scheduling (H1–H9), adaptation (move, make easy, escalate), API (`/api/hybrid/week`, `/adapt`) | **Built** 24 Sep 2026; literature parameters, **not coach-signed** |
| API: verified Firebase ID tokens, validated inputs, per-user rate limit, JSON event logs; production boot check | **Built** 24 Sep 2026 (the server used to trust a client header and crashed on boot) |
| Coach console; athlete app on the hybrid engine | **Not yet** in `app/` (GAPS #13, #16). First athlete screen (Load, polished from Claude Design) runs on the engine in [ProjectOS](https://ossamamokhtar.github.io/PolySync/); acceptance criteria in the [UX review](docs/13-ux-review.md) |
| Server data access in production | **Blocked**: client SDK without credentials (GAPS #12, P0 before the pilot) |
| Model-in-the-loop evals, coach minutes, users | **Not measured**; the [pilot](product/pilot-plan.md) measures coach minutes and users |

## Run it

```bash
cd app && npm install
npm test                 # 53 tests: engine, hybrid rules, routing, auth, input validation, rate limit, session content
npm run eval             # safety-layer + hybrid-layer evals (non-zero exit on any breach)
npm run build && npm run boot-check
node ../product/scripts/build.mjs --check      # product layer
cd ../portal && npm install && npm run dev     # ProjectOS on localhost
```

## Repository layout

| Path | What |
|---|---|
| `docs/` | Design authority: architecture, ADRs, evaluation, gaps |
| `app/` | Runtime: React + Express + Firebase + Gemini; engine in `app/src/engine/` |
| `evals/` | Safety-layer and hybrid-layer eval runners and results |
| `product/` | Strategy, evidence, model, risks, telemetry, pilot, case study |
| `portal/` | ProjectOS: one self-contained HTML file, deployed to GitHub Pages |

CI: [`ci.yml`](.github/workflows/ci.yml) (strict engine typecheck, type-error ratchet, tests, evals, build, boot check, bundle and identity checks, portal build) · [`docs.yml`](.github/workflows/docs.yml) (links, Mermaid, status lines, product layer) · [`pages.yml`](.github/workflows/pages.yml) (ProjectOS deploy).

---

Ossama Mokhtar · Dubai, UAE
