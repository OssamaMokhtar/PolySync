# PolySync runtime (`app/`)

React + Vite client, Express server (`server.ts`), Firebase Auth + Firestore, Gemini for explanations and proposals. The deterministic engine the runtime calls lives in [`../engine/`](../engine/); where each part of the repo sits and what it may depend on is in [ARCHITECTURE.md](../ARCHITECTURE.md). Design authority is the repo-level [`docs/`](../docs/); this folder is the code.

## The safety layer (ADR-004, now in code)

| Piece | File | What it does |
|---|---|---|
| Programming engine | [`engine/planEngine.ts`](../engine/planEngine.ts) | Deterministic weekly plan from the profile. Filters by level, equipment and injury; fits the time budget and the weekly volume ceiling |
| Contraindications | [`engine/contraindications.ts`](../engine/contraindications.ts) | Injury → exercises to avoid, by muscle and movement pattern. v0, **not coach-signed** |
| Bounds checker | [`engine/boundsChecker.ts`](../engine/boundsChecker.ts) | Rules B1–B9 (days, duration, injury, unknown exercise, sets, weekly sets, +10% volume jump, difficulty, malformed). `prescribe()` is the only path to the athlete |
| Wiring | `server.ts` → `POST /api/fitness/generate-plan`, `generateAdaptation()` | Engine prescribes; a Gemini plan is a proposal that replaces it only if it passes every rule; blocked proposals set `needsCoachReview` and log `bounds_rejected` |

**Before this change** the route saved Gemini's JSON directly as the athlete's plan and used the engine only as a fallback. The engine's injury filter compared `"right_knee"` against muscle names, so it never removed squats. The engine also called an `ExerciseLibrary.getAllExercises()` that did not exist. 31 exercises had equipment written as `'a' | 'b'`, which JavaScript evaluates to `0`.

## Run

```bash
npm install
npm run dev              # server + client on :3000 (needs Firebase config; Gemini optional)
npm test                 # server and client unit tests
npm run build
# engine tests and evals run in ../engine: npm test, npm run eval
```

## Gates (CI, every push)

Type-error ratchet (`typecheck-baseline.json`, currently 75 inherited errors, down from 206; it may only go down) · unit tests · build · client-bundle check · boot check · `npm audit` (high and critical). The engine's gates (strict typecheck with 0 errors, unit tests, evals) run in the `engine` CI job.

## Known debt

- 75 type errors in `server.ts` and UI components, inherited. The ratchet stops new ones.
- `server.ts` is 2,300 lines with several routes the UI does not use yet (nutrition, wearables, streaks).
- The exercise library has typos in ids (`calve-raise`, `incline-barbbell-bench-press`, `" Arnold-press"`); they are kept so saved plans still resolve.
- The Firestore database id in `firebase-applet-config.json` predates the repo split; renaming it means migrating data, so it stays (ADR-012).
