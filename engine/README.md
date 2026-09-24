# PolySync engine (`engine/`)

The deterministic core. It decides every load prescription; a model can only propose a change, and the change reaches the athlete only if it passes these rules ([ADR-004](../docs/10-decision-log.md)). Pure TypeScript with no runtime dependencies, compiled unchanged into the app, the prototype and ProjectOS. Boundaries: [ARCHITECTURE.md](../ARCHITECTURE.md).

| File | What it does |
|---|---|
| [`hybrid.ts`](hybrid.ts) | Hybrid weeks (strength, power, endurance): rules H1–H9, `prescribeHybrid()` routing, daily adaptation (move, make easy, escalate). Parameters and their evidence ([doc 12](../docs/12-hybrid-athlete-programming-engine.md)) |
| [`planEngine.ts`](planEngine.ts) | Single-modality weekly plan from the profile: level, equipment, injury, time budget, weekly volume ceiling |
| [`boundsChecker.ts`](boundsChecker.ts) | Rules B1–B9; `prescribe()` is the only path from a proposal to the athlete |
| [`contraindications.ts`](contraindications.ts) | Injury → exercises to avoid, by muscle and movement pattern. v0, **not coach-signed** (GAPS #4) |
| [`ExerciseLibrary.ts`](ExerciseLibrary.ts) | The exercise library the engine programmes from |
| [`bodymodel.ts`](bodymodel.ts) | Display model: how a session's load is shared across body regions (mapping v1, a product assumption, not coach-signed) |
| [`types.ts`](types.ts) | Engine input and output types |

## Run

```bash
npm install
npm run typecheck   # strict, 0 errors
npm test            # unit tests (engine, hybrid rules, bounds, routing)
npm run eval        # safety-layer and hybrid-layer evals (../evals); WRITE_RESULTS=1 to update results
```

CI runs all three on every push (`engine` job). Committed eval results must match the run.
