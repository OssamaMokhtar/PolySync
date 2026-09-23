# PolySync — Gaps

Ranked by how badly each undermines credibility with a technical interviewer or an org buyer's risk function.

| # | Gap | Doc | Damage if unfilled | Effort | Status |
|---|---|---|---|---|---|
| 1 | No model-in-the-loop eval results (golden programming, free-text safety, live injection) | 07 | **Severe.** The safety layer is now measured (0 leaks / 8,640 plans; 2,067 of 2,067 unsafe proposals blocked); model quality is not | High | **Narrowed 2026-09-23** — safety-layer evals run in CI; model sets open |
| 2 | Coach minutes / athlete-month unknown | 11 | **Severe.** You cannot say whether this is software or services. An investor will ask in the first meeting | Medium | **Open** |
| 3 | Beachhead not named in ADR-005 | 10 | High. "We narrowed" without naming the target reads as indecision | Low | **Resolved** — beachhead named in ADR-005 (US boutique hybrid gyms, state privacy law, concurrent endurance+resistance) |
| 4 | Protocol library not coach-signed | 12 | High. The moat is unverified; the domain doc is framing without authority | High | **Open** |
| 5 | Athlete-vs-org data ownership on offboarding undecided | 02 | High. Blocks the first enterprise contract | Low (decision) | **Open — decision pending** |
| 6 | No DPIA, sub-processor register, retention automation | 08 | High for enterprise, low for portfolio | Medium | **Open** |
| 7 | Injection eval against a live model unbuilt | 07, 08 | Medium. The checker now blocks hostile output (M5 invented exercise, M8 malformed JSON); the model itself is untested | Medium | **Partly addressed** |
| 8 | Design tokens not extracted from implementation | 09 | Low | Low | **Open** |
| 9 | Scale envelope empty | 01 | Low until a real roster exists | Low | **Open** |
| 10 | Code and design authority disagreed: the runtime let Gemini write plans directly, contradicting ADR-004 | app/server.ts | **Severe** (fixed) | — | **Resolved 2026-09-23** — engine prescribes, `prescribe()` gates every proposal, code moved into `app/` |
| 11 | Beachhead geography: ADR-005 names US boutique gyms under US state privacy law; the owner is Dubai-based and the audits recommend a UAE Hyrox-box pilot | 10 | High. Pilot, DPIA and data-residency choices all depend on it | Low (decision) | **Open — decision pending** |

**Fill order: 3 → 5 → 2 → 1 → 4.** Items 3 and 5 are decisions you can make in an hour and they unlock the docs around them. Item 3 (beachhead) is now **resolved** — ADR-005 names it explicitly. Item 5 (data ownership decision) is next: a decision to make, not a build to do. Item 2 needs one week of real coach-time logging. Item 1 needs the harness built. Item 4 needs other people's calendars — start it now because it has the longest lead time.
