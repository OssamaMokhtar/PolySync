# PolySync evals

> Status: AUTHORED · first run 2026-09-23 · runs in CI on every push

## What runs today: the safety layer

`evals/run.ts` tests the deterministic layer between any model and the athlete: the programming engine, the bounds checker (rules B1–B9) and the routing in `prescribe()`. Latest results: [`results/latest.json`](results/latest.json).

| Set | n | Result | Gate |
|---|---|---|---|
| Contraindication rule table vs hand labels | 49 injury × exercise pairs | 49/49 agree | 0 disagreements |
| Contraindication leak in engine plans | 8,640 plans (profile grid) | 0 leaks | 0, hard block |
| Engine plans within bounds | 8,640 | 8,640 | all |
| Unsafe proposals blocked (8 mutation types) | 2,067 | 2,067 blocked, right rule each time | all |
| Blocked proposals escalated to coach | 2,067 | 2,067 | all |
| Safe proposals accepted (library substitutions) | 194 | 194 | all |

**How to read this.** Every number above is deterministic code tested against its own specification, plus 49 hand labels. It shows the safety layer does what it claims. It does **not** show the rules are clinically right: the hand labels are an AI-assisted audit draft, and no coach or clinician has reviewed them (GAPS #4). The profile grid is synthetic.

## What runs today: the hybrid layer

`evals/hybrid-run.ts` tests the hybrid scheduling engine (`app/src/engine/hybrid.ts`): rules H1–H9, routing in `prescribeHybrid()`, and daily adaptation. Latest results: [`results/hybrid-latest.json`](results/hybrid-latest.json).

| Set | n | Result | Gate |
|---|---|---|---|
| Engine weeks with no blocking finding | 3,240 profiles | 3,240 | all |
| Sessions placed or reported as shortfall | 17,820 requested | 15,834 placed + 1,986 reported | none lost silently |
| Unsafe proposals blocked by the expected rule, routed to engine + coach (13 attack types) | 5,810 | 5,810 | all |
| Safe proposals accepted | 463 | 463 | all |
| Amber-day adaptations that break a rule (incl. +10% load vs the week replaced) | 13,674 | 0 (6,015 moved, 7,659 made easy, 0 escalated) | 0 |
| Delivered weeks that break a rule for that day's readiness | 4,628 | 0 | 0 |
| Pain flags escalated | 2,263 | 2,263 | all |
| Amber-day outcomes by schedule shape | 10 shapes | reported | none (feeds the financial model) |

CI regenerates both results files and fails if they differ from the committed ones in anything but the timestamp, so a README or model number cannot quietly drift from the code.

## What does not run yet

| Set (docs/07) | Why not |
|---|---|
| Golden programming (150 athlete-weeks) | Needs coach-labelled data |
| Safety adversarial from free text (pain mid-conversation, illness, under-fuelling) | Needs a classifier and labelled set |
| Prompt injection against a live model | Needs model-in-the-loop runs; M5/M8 only test how the checker handles hostile output |
| Coach agreement, groundedness | Needs coaches and the signed protocol library |

## Run

```bash
cd app && npm run eval                     # prints results, exits non-zero on any gate failure
cd app && WRITE_RESULTS=1 npm run eval     # also rewrites results/latest.json and results/hybrid-latest.json
```
