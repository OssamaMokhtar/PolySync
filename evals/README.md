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
cd app && WRITE_RESULTS=1 npm run eval     # also rewrites results/latest.json
```
