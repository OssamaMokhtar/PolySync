# PolySync runtime (`app/`)

React + Vite client, Express server (`server.ts`), Firebase Auth + Firestore, Gemini for explanations and proposals.

Moved here from `OssamaMokhtar/PolyVerses` on 23 Sep 2026 with full history (the fitness pivot there began at `9dd46ed`, 11 Sep 2026). Design authority is the repo-level [`docs/`](../docs/); this folder is the code.

## The safety layer (ADR-004, now in code)

| Piece | File | What it does |
|---|---|---|
| Programming engine | [`src/engine/planEngine.ts`](src/engine/planEngine.ts) | Deterministic weekly plan from the profile. Filters by level, equipment and injury; fits the time budget and the weekly volume ceiling |
| Contraindications | [`src/engine/contraindications.ts`](src/engine/contraindications.ts) | Injury → exercises to avoid, by muscle and movement pattern. v0, **not coach-signed** |
| Bounds checker | [`src/engine/boundsChecker.ts`](src/engine/boundsChecker.ts) | Rules B1–B9 (days, duration, injury, unknown exercise, sets, weekly sets, +10% volume jump, difficulty, malformed). `prescribe()` is the only path to the athlete |
| Wiring | `server.ts` → `POST /api/fitness/generate-plan`, `generateAdaptation()` | Engine prescribes; a Gemini plan is a proposal that replaces it only if it passes every rule; blocked proposals set `needsCoachReview` and log `bounds_rejected` |

**Before this change** the route saved Gemini's JSON directly as the athlete's plan and used the engine only as a fallback. The engine's injury filter compared `"right_knee"` against muscle names, so it never removed squats. The engine also called an `ExerciseLibrary.getAllExercises()` that did not exist. 31 exercises had equipment written as `'a' | 'b'`, which JavaScript evaluates to `0`.

## Run

```bash
npm install
npm run dev              # server + client on :3000 (needs Firebase config; Gemini optional)
npm test                 # engine unit tests
npm run eval             # safety-layer evals (../evals/run.ts)
npm run build
```

## Gates (CI, every push)

Strict typecheck of `src/engine` (0 errors) · type-error ratchet for the rest (`typecheck-baseline.json`, currently 93 inherited errors, down from 206; it may only go down) · unit tests · evals · build · client-bundle check · `npm audit` (high and critical).

## Known debt

- 93 type errors in `server.ts` and UI components, inherited. The ratchet stops new ones.
- `server.ts` is 2,300 lines with several routes the UI does not use yet (nutrition, wearables, streaks).
- The exercise library has typos in ids (`calve-raise`, `incline-barbbell-bench-press`, `" Arnold-press"`); they are kept so saved plans still resolve.
- `docs/` in this folder are PolyVerses-era planning docs, kept for history. The current design is in the repo-level `docs/`.
