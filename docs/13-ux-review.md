# PolySync — UX/UI review and design brief

> Status: AUTHORED · 2026-09-24 · Owner: Ossama Mokhtar · Baseline before the Claude Design screens are merged. It also serves as the acceptance checklist for those screens.

## 1. What was reviewed, and how

| Surface | Build | Method |
|---|---|---|
| Athlete app (`app/`) | Production build, first screen at 390 × 844 and 1280 × 860 | Rendered in Chromium; contrast and hit targets measured in the browser; onboarding flow read from `FitnessOnboarding.tsx` because every step after the first needs a Google sign-in |
| ProjectOS (`portal/`) | Production build, light and dark | Same measurements; colour tokens checked directly |
| Coach console | Does not exist | Not reviewable; see §5 |

Benchmarks:
- **Apple Human Interface Guidelines:** [managing accounts](https://developer.apple.com/design/human-interface-guidelines/managing-accounts) (delay sign-in until it adds value), 44 × 44 pt hit targets, and the App Store's [sufficient-contrast criteria](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/sufficient-contrast-evaluation-criteria).
- **WCAG 2.1 AA.**
- **Four sports products, each for the one pattern it does best:**
  - [WHOOP](https://www.whoop.com/us/en/thelocker/how-does-whoop-recovery-work-101/): one readiness state with its contributors;
  - [TrainingPeaks](https://help.trainingpeaks.com/hc/en-us/articles/204861204-Workout-Card-Overview): planned-vs-done compliance colours on the coach's calendar;
  - Strava: the activity comes first and the account second;
  - Nike Training Club: a workout is visible before any commitment.

## 2. Scorecard

| Principle | Athlete app today | ProjectOS |
|---|---|---|
| Value before sign-in (HIG) | ✕ Sign-in wall on step 1 of 9 | ✓ No account |
| One decision per screen (doc 09) | ◐ One per step, but 9 steps | n/a |
| Asks only what the engine uses | ✕ Asks for goals, focus areas, biometrics, medical "modes"; never asks the questions the hybrid engine needs (training days, doubles, block priority) | n/a |
| Contrast ≥ 4.5:1 for text | ✕ Primary buttons 2.7:1; body copy 3.9–4.0:1 | ◐ Link text 4.2–4.3:1 in light mode; **fixed** (≥ 5.4:1) |
| Hit targets ≥ 44 pt | ✕ 38–40 px | ◐ 20 px nav links on touch; **fixed** (44 px on coarse pointers) |
| No horizontal scroll at 390 px | ✕ 75 px overflow (9-dot stepper) | ✓ 0 px |
| Honest AI state (doc 09 §3) | ✕ "AI Fitness Coach" badge; the model does not prescribe | ✓ Measured / built / simulated / hypothesis labels on every number |
| Correct product identity | ✕ Browser tab said "PolyVerses – The Agentic Product Suite"; **fixed** | ✓ |

## 3. Findings, by severity

| # | Severity | Finding | Evidence | Fix | When |
|---|---|---|---|---|---|
| U1 | **Critical** | Onboarding offers GLP-1, postpartum, injury-rehab and 65+ "special modes". Clinical and rehab populations are a stated non-goal (strategy §8, PRD), and no rule, eval or coach sign-off covers them | `FitnessOnboarding.tsx` SPECIAL_MODES | Remove the modes. A health condition becomes a coach referral, not a programme variant | Onboarding rebuild |
| U2 | **High** | Health data (injuries, biometrics, conditions) is requested at steps 4–8 and consent at step 9. Nothing is saved before consent, so there is no leak, but people are asked for sensitive data before being told why | Profile written only on completion | Put consent, with the reason, directly before the first health question. Ask only what the engine uses | Onboarding rebuild |
| U3 | **High** | Onboarding asks the wrong questions. The hybrid engine needs available days (which ones, not how many), doubles yes/no, block priority and session length. The app asks for goal, focus areas and equipment. ADR-008 says doubles comes first | Engine input vs onboarding fields | Onboarding asks: 1. doubles, 2. which days, 3. priority, 4. session length, 5. injuries (with consent), then shows the week | Onboarding rebuild |
| U4 | **High** | No coach console. The buyer's value (coach capacity) has no screen | GAPS #13 | §5 brief | Design merge |
| U5 | High | Sign-in wall before any value (HIG: delay sign-in) | Step 1 | Show the generated week first; ask for sign-in to save it, the way Nike Training Club shows a workout first | Onboarding rebuild |
| U6 | High | White on sky blue: 2.7:1 on every primary button | Measured | Darken the brand blue for fills, or use dark text on it; target ≥ 4.5:1 | Design tokens |
| U7 | Medium | 9-dot stepper overflows at 390 px; tap targets 38–40 px | Measured | ≤ 5 steps; progress as "Step 2 of 5" text plus a thin bar; 44 px targets | Onboarding rebuild |
| U8 | Medium | "AI Fitness Coach" contradicts the product: the engine prescribes and a human coach decides edge cases (ADR-004) | Badge copy | "Your plan, checked by your coach", with the coach's name | Copy |
| U9 | Medium | 1.26 MB JavaScript on first load: slow on gym Wi-Fi | Build output | Split routes; lazy-load charts and chat | Engineering |
| U10 | Low | Seven unused PolyVerses components (code browser, prompt console, orchestration views) and two unused chart libraries in the app | Unreferenced files | **Removed**; the type-error baseline fell from 90 to 77 | Done |

## 4. Patterns to adopt from the sports leaders

| Pattern | Who does it best | PolySync version |
|---|---|---|
| One readiness state with its contributors | WHOOP (green / yellow / red recovery; HRV, resting heart rate, sleep) | Today screen leads with green / amber / red and says why ("slept 5 h 20, heavy legs yesterday"), then what changed and the rule behind it |
| Planned vs done at a glance | TrainingPeaks compliance colours on the calendar | Coach roster: each athlete's week as 7 cells (done, moved, made easy, missed), with **icon + label**, never colour alone |
| The activity first, the account second | Strava, Nike Training Club | The athlete sees their first week before signing in |
| Rationale in one line | Doc 09 §3 (≤ 60 words, cites a protocol) | Every changed session shows "Moved to Thursday: 6 h rest rule after heavy legs · SCI-005" |
| A named human | Doc 09 §3 (escalation with a named coach and SLA) | "Coach Sara will review this by 6 pm" instead of a spinner |

## 5. Design brief: acceptance criteria for the Claude Design screens

Each screen is accepted only if it meets its criteria, plus the global ones.

**Global.**
- Text ≥ 4.5:1 (≥ 3:1 for text ≥ 24 px), in light and dark.
- 44 × 44 pt targets.
- No horizontal scroll at 390 px.
- State is never colour alone.
- Supports Dynamic Type / 200% zoom.
- Every number on screen comes from the engine or telemetry, never typed into the design.

| Screen | Must show | Must not |
|---|---|---|
| **Coach queue** (P0-5) | One list: lost sessions, escalations and pain flags, newest first, pain flags pinned. Each row shows the athlete, what happened, the rule and evidence, and one-tap approve / amend / message. Target review time ≤ 2 min per item | Consumer spacing: it is a table-first professional tool (doc 09 §2). No charts above the queue |
| **Coach roster** | 7-cell week per athlete (done / moved / made easy / missed), segment (flexible / standard / rigid), last readiness | Leaderboards or streaks |
| **Onboarding** (P0-4) | Doubles first, then which days, priority, session length; consent directly before injuries; the week shown before sign-in | Medical modes; more than 5 steps |
| **Today** (P0-6) | Readiness state and why, today's session, the one-line rationale with its rule, "done" logging | A percentage confidence; a prescription that "types itself" |
| **Amber day** | What moved or was made easy, the rule, and that the coach was told | The word "AI" as the actor. The engine and the coach are the actors |

## 6. What was fixed in this pass

- The app's browser title now reads "PolySync".
- Unused PolyVerses components and the d3 and Recharts dependencies are removed.
- ProjectOS link colour now passes 4.5:1 in both themes.
- ProjectOS touch targets are now 44 px.

Everything marked "Onboarding rebuild" or "Design merge" waits for the Claude Design screens.

Current ProjectOS screens: [overview](screens/projectos-overview.png) · [engine blocks an injection](screens/engine-blocks-injection.png) · [amber-day adaptation](screens/engine-adapts-amber-day.png) · [economics](screens/economics-dashboard.png) · [walkthrough video](media/projectos-walkthrough.mp4).
