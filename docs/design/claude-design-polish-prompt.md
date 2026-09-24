# Prompt: polish "PolySync Body Impact" in Claude Design

> Status: AUTHORED · 2026-09-24 · Paste the block below into the PolySync project in Claude Design. It applies [docs/13 §7](../13-ux-review.md#7-review-claude-design-body-impact).

```text
Polish "PolySync Body Impact" into the athlete app's "Load" screen. Keep the dark look and the lime accent. Apply these rules exactly:

1. Honest data only. Remove the Injury Risk card, VO2 Max, Overall Fitness and every percentage improvement.
   Remove "LIVE · ALL SOURCES SYNCED" and the tagline "Where training is changing you".
   The only inputs are planned and logged sessions (type, minutes, RPE 1-10), daily readiness (Ready / Low / Pain) and engine decisions.
   Load = minutes × RPE.
2. Replace the 3D WebGL mannequin with a 2D SVG body, Front / Back segmented control.
   Coloured regions: quads, hamstrings, glutes, calves, hip flexors, core.
   Chest, shoulders, back and arms are hatched grey with the legend "Not programmed yet".
3. Colour: one-hue lime ramp, 5 steps, low → high load. No red or green on the body.
   Readiness uses icon + word: ● Ready, ◐ Low, ✕ Pain.
   Under the body, list all six regions with their load number as tappable rows.
   Tapping a region shows the sessions that contributed (day, time, type, minutes, RPE, load).
4. Replace "AI Coach Insights" with "What changed".
   One card that names the outcome (moved to a later day / made easy, coach told / coach decides), the rule id (e.g. H7 readiness) and the coach by name ("Coach Sara").
   Never use "AI" as the actor.
5. Replace the six summary cards with three tiles:
   - Weekly load (with % vs plan);
   - Hard sessions kept (x / y);
   - Limit (+10% max weekly rise, rule H5).
6. Add a 7-day readiness strip (Mon-Sun) and a week-balance bar (strength / power / hard run / easy run share of load, with direct labels).
7. Phone layout at 390 pt:
   - large title "Load" and a subtitle line;
   - tab bar: Today / Week / Load / Coach;
   - all targets at least 44 × 44 pt;
   - text at least 4.5:1 contrast;
   - reduced-motion safe.
8. Footer: "Estimates from session type, minutes and effort. Not a medical assessment, and not a prediction of injury."
9. Cut the filter row (Muscles / Performance / Recovery / Health / Mobility / Strength / Endurance) and the 5-option timeline. Keep one timeframe: this week.
```

Reference build: ProjectOS → "Athlete app: Load" (`portal/src/loadmap.ts`), which runs the real engine.
