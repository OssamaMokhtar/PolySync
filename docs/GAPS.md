# PolySync — Gaps

> Status: AUTHORED · Updated 2026-09-24 · Owner: Ossama Mokhtar

Ranked by how badly each undermines credibility with a technical interviewer or an org buyer's risk function. Resolved rows stay, so the history is visible.

| # | Gap | Doc | Damage if unfilled | Effort | Status |
|---|---|---|---|---|---|
| 12 | Server reads and writes Firestore with the **client SDK and no credentials**. With the published owner-only rules, every server-side read is denied; without them, data is open | app/server.ts | **Severe.** The API cannot work against production Firestore | Medium (~130 call sites; adapter onto `firebase-admin`, emulator tests) | **Open — P0 before any pilot** |
| 1 | No model-in-the-loop eval results (golden programming, free-text safety, live injection) | 07 | **Severe.** Both deterministic layers are measured; model quality is not | High | **Narrowed 2026-09-24** — safety layer and hybrid layer measured in CI; model sets open |
| 2 | Coach minutes per athlete-month unmeasured | 11 | **Severe.** Decides software vs services | Medium | **Narrowed 2026-09-24** — [financial model](../product/financial-model.md) built on simulated amber-day outcomes by schedule segment (ADR-008); real minutes come from the [pilot](../product/pilot-plan.md) |
| 13 | The React UI does not call the hybrid engine yet; it is exposed through `POST /api/hybrid/week` and `/adapt` and runs in the [ProjectOS demo](../product/README.md) | app/src | High. The athlete-facing product still shows the older single-modality plan | Medium | **Open** |
| 4 | Protocol library and rule parameters not coach-signed | 12 | High. Parameters now come from the literature ([evidence](../product/data/evidence.json)), which beats TBD but is not a coach's sign-off | High (calendars) | **Open — start now** |
| 6 | No DPIA, sub-processor register, retention automation | 08 | **High now**: ADR-006 moves the pilot to the UAE, where the PDPL treats physical-condition data as sensitive | Medium | **Open — required before the pilot** |
| 14 | Amber-day outcomes (moved, made easy, escalated) are simulated from the engine's own rules, not observed | 11 | Medium. Segment coach minutes and ADR-008 rest on a simulation | Low (pilot measures it) | **Open — pilot** |
| 7 | Injection eval against a live model unbuilt | 07, 08 | Medium. Checkers block hostile output (M5, M8, HM8); the model itself is untested | Medium | **Partly addressed** |
| 8 | Design tokens not extracted; no product screens in the repo | 09 | Medium | Low | **Open** — the ProjectOS demo shows the engine, not the athlete app |
| 9 | Scale envelope empty | 01 | Low until a real roster exists | Low | **Open** |
| 15 | Server trusted an `x-user-id` header (any caller could act as any athlete); production bundle crashed on boot | app/server.ts | **Severe** (fixed) | — | **Resolved 2026-09-24** — verified Firebase ID tokens; boot check in CI |
| 11 | Beachhead geography undecided (US in ADR-005 vs UAE pilot) | 10 | High | Low | **Resolved 2026-09-24** — [ADR-006](10-decision-log.md#adr-006-validate-in-the-uae-scale-in-the-us): validate in the UAE, scale in the US |
| 5 | Athlete-vs-org data ownership on offboarding | 02 | High | Low | **Resolved 2026-09-23** — [decision](02-data-ownership-decision.md) |
| 10 | Runtime let Gemini write plans directly, contradicting ADR-004 | app/server.ts | **Severe** (fixed) | — | **Resolved 2026-09-23** |
| 3 | Beachhead not named | 10 | High | Low | **Resolved** — ADR-005 |

**Fill order: 12 → 6 → 13 → 4 → pilot (closes 2 and 14) → 1.** Items 12 and 6 block the pilot outright. Item 13 is what a pilot athlete would actually use. Item 4 has the longest lead time, so it starts in parallel. The pilot then replaces the model's two biggest hypotheses with observed numbers.
