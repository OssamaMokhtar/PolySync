# PolyVerses — Impact Analysis & Prioritization

> **AI Fitness Coach · RICE + Dependency Mapping + Updated Progress · v1.1 · 2026-09-12**

---

## 1. Methodology

Features are scored using a **RICE framework** adapted for an AI fitness coach:

| Factor | Scale | Definition |
|---|---|---|
| **Reach** | 1–5 | How many users does this affect? 1 = niche, 5 = every user |
| **Impact** | 1–3 | How much does this move the product? 1 = nice-to-have, 2 = meaningful, 3 = core value / differentiator |
| **Confidence** | 50–100% | How certain are we about the estimates? Based on market data, user surveys, competitive analysis |
| **Effort** | person-weeks | Engineering effort to ship (design + frontend + backend + testing) |

**RICE Score = (Reach × Impact × Confidence) / Effort**

---

## 2. Feature Prioritization Matrix

### 2.1 Phase 0 — Foundation (Enablers; not user-facing) — STATUS UPDATE

| # | Feature | Reach | Impact | Conf. | Effort (pw) | RICE | Priority | Dependency | Status |
|---|---|---|---|---|---|---|---|---|---|
| 0.6 | Exercise Library data file (101 exercises) | 5 | 3 | 95% | 0.5 | **9.50** | 🔴 P0 | None — standalone data file | ✅ DONE (2026-09-11) |
| 0.7 | Firestore data model + security rules (fitness collections + consent gate) | 5 | 3 | 95% | 0.5 | **9.50** | 🔴 P0 | None; blocks 1.1–1.7 | ✅ DONE (2026-09-11) |
| 0.8 | types.ts update with fitness types | 5 | 2 | 100% | 0.5 | **10.0** | 🔴 P0 | None; blocks 0.9, 1.1 | ✅ DONE (2026-09-11) |
| 0.9 | server.ts: fitness API routes + agent system prompts | 5 | 3 | 90% | 2 | **6.75** | 🔴 P0 | 0.6, 0.7, 0.8 | 🔴 IN PROGRESS |
| 0.10 | AthenaCodeStore.ts: fitness agent code samples | 3 | 1 | 80% | 0.5 | **4.80** | 🟡 P1 | 0.9 (code samples reference agent logic) | 🔴 NOT STARTED |
| 0.11 | metadata.json + package.json description update | 5 | 1 | 100% | 0.1 | **50.0** | 🔴 P0 | None; documentation only | ✅ DONE (2026-09-11) |
| 0.12 | CI/CD deploy.yml | 5 | 2 | 80% | 1 | **8.00** | 🟡 P1 | Required before any production deploy | 🔴 NOT STARTED |

**Phase 0 summary:** 4 of 7 items complete (0.6, 0.7, 0.8, 0.11). 0.9 is in progress — this is the critical path item that unlocks all of Phase 1.

### 2.2 Phase 1 — Core Coaching Loop (Must Have for MVP)

| # | Feature | Reach | Impact | Conf. | Effort (pw) | RICE | Priority | Dependency | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1.1 | Fitness onboarding flow (profile capture) | 5 | 3 | 95% | 1.5 | **9.50** | 🔴 P0 | 0.6, 0.7, 0.8, 0.9 | 🔴 NOT STARTED |
| 1.2 | Workout Generator Agent (weekly plan from profile) | 5 | 3 | 90% | 2 | **6.75** | 🔴 P0 | 0.6, 0.8, 0.9, 1.1 | 🔴 NOT STARTED |
| 1.3 | Weekly plan view (7-day grid UI) | 5 | 3 | 95% | 1 | **14.25** | 🔴 P0 | 1.2 | 🔴 NOT STARTED |
| 1.4 | Active workout session UI (set logging, rest timer) | 5 | 3 | 95% | 2 | **7.13** | 🔴 P0 | 1.3, 0.6 | 🔴 NOT STARTED |
| 1.5 | Workout logging to Firestore | 5 | 3 | 95% | 1 | **14.25** | 🔴 P0 | 1.4, 0.7 | 🔴 NOT STARTED |
| 1.6 | Plan adaptation (F05: progressive overload + recovery-aware) | 5 | 3 | 85% | 2 | **6.38** | 🔴 P0 | 1.5, 2.4 | 🔴 NOT STARTED |
| 1.7 | Progress dashboard (strength trends, frequency charts) | 4 | 2 | 85% | 1.5 | **4.53** | 🟡 P1 | 1.5 | 🔴 NOT STARTED |

**MVP Definition:** A user can sign up, complete a fitness profile, receive a weekly workout plan, do a workout (log sets/reps/weight), and see their plan adapt for the next week. This is features 1.1–1.6. Without these, there is no product.

### 2.3 Phase 2 — Conversational Coach + Wearables (Differentiators)

| # | Feature | Reach | Impact | Conf. | Effort (pw) | RICE | Priority | Dependency | Status |
|---|---|---|---|---|---|---|---|---|---|
| 2.1 | Coaching Chat Agent + chat UI | 5 | 3 | 90% | 2.5 | **5.40** | 🔴 P0 | 0.9, 1.1, 1.2 (needs user context) | 🔴 NOT STARTED |
| 2.2 | Apple HealthKit integration | 4 | 2 | 75% | 1.5 | **4.00** | 🟡 P1 | 0.7, 0.9, 2.4 | 🔴 NOT STARTED |
| 2.3 | Google Fit integration | 3 | 2 | 70% | 1 | **4.20** | 🟡 P1 | 0.7, 0.9, 2.4 | 🔴 NOT STARTED |
| 2.4 | Recovery Analyst Agent (score + recommendation) | 4 | 3 | 85% | 1 | **10.20** | 🔴 P0 | 0.7, 0.9, 2.2 or 2.3 (needs wearable data for full value) | 🔴 NOT STARTED |
| 2.5 | Recovery-based plan adjustment (F05 uses recovery score) | 4 | 3 | 80% | 1 | **9.60** | 🔴 P0 | 2.4, 1.6 | 🔴 NOT STARTED |
| 2.6 | Wearable data view dashboards | 3 | 1 | 80% | 1 | **2.40** | 🟡 P2 | 2.2, 2.3 | 🔴 NOT STARTED |
| 2.7 | Strava/Garmin/WHOOP/Oura integrations | 2 | 2 | 60% | 2 each | **1.20** | ⚪ P3 | 2.2 or 2.3 (pattern established) | ⚪ FUTURE |

**Rationale:** The conversational coach (2.1) is the single biggest differentiator vs. static-plan apps. Recovery analysis (2.4) + recovery-based adaptation (2.5) is the second differentiator — no mobile app does this autonomously. HealthKit/Google Fit are necessary to power recovery analysis with real data, but the recovery agent can work with user-reported data (check-ins) until wearables are connected, so 2.4 can ship before 2.2/2.3 are complete.

### 2.4 Phase 3 — Engagement & Retention (Growth)

| # | Feature | Reach | Impact | Conf. | Effort (pw) | RICE | Priority | Dependency | Status |
|---|---|---|---|---|---|---|---|---|---|
| 3.1 | Push notifications + daily digest | 5 | 2 | 80% | 2 | **4.00** | 🔴 P1 | 0.9, 2.2 or 2.3 (digest content needs wearable data), 1.5 | 🔴 NOT STARTED |
| 3.2 | Motivation Coach Agent (sentiment + dropout risk) | 4 | 2 | 75% | 1.5 | **4.00** | 🔴 P1 | 2.1 (chat data), 3.3 (check-in data) | 🔴 NOT STARTED |
| 3.3 | Check-in flow (post-workout + end-of-day) | 4 | 2 | 80% | 1 | **6.40** | 🔴 P1 | 0.7, 0.9, 3.2 | 🔴 NOT STARTED |
| 3.4 | Streaks & consistency tracking | 4 | 1 | 85% | 1 | **3.40** | 🟡 P2 | 1.5 | 🔴 NOT STARTED |
| 3.5 | NUX funnel analytics | 2 | 2 | 80% | 1 | **3.20** | 🟡 P2 | 1.1–1.4 (funnel events) | 🔴 NOT STARTED |

**Rationale:** Push notifications + daily digest (3.1) is the highest-impact engagement feature — the AFR article about Joel Richards' DIY AI trainer specifically calls out the morning Slack notification as the magic moment. Motivation coaching (3.2) is a unique differentiator (no competitor does sentiment-aware coaching) but depends on having chat + check-in data first.

### 2.5 Phase 4 — Monetization & Premium Features

| # | Feature | Reach | Impact | Conf. | Effort (pw) | RICE | Priority | Dependency | Status |
|---|---|---|---|---|---|---|---|---|---|
| 4.1 | Stripe subscription (3 tiers) | 5 | 3 | 90% | 2 | **6.75** | 🔴 P1 | 1.1–1.6 (need working product before charging) | ⚪ FUTURE |
| 4.2 | Nutrition Advisor Agent + endpoint | 4 | 2 | 80% | 1.5 | **4.27** | 🟡 P1 | 0.9, 1.1 | 🔴 NOT STARTED |
| 4.3 | GLP-1 / special mode programming | 2 | 3 | 70% | 1 | **4.20** | 🟡 P2 | 4.2, 1.2 (adjusted plans), 1.1 (profile flag) | 🔴 NOT STARTED |
| 4.4 | Exercise substitution engine (during workout) | 4 | 2 | 85% | 1 | **6.80** | 🔴 P1 | 0.6, 1.4 | 🔴 NOT STARTED |
| 4.5 | Text-based form coaching | 3 | 2 | 75% | 1 | **3.75** | 🟡 P2 | 2.1 (chat), 0.6 (exercise library) | 🔴 NOT STARTED |

**Rationale:** Stripe subscription (4.1) is the monetization gateway — nothing else matters if there's no revenue. It depends on having a working MVP (Phase 1) so there's something to charge for. Nutrition advisor (4.2) is a high-value premium feature that fills a major gap (no app integrates AI nutrition + training). Exercise substitution (4.4) is high-RICE because it's relatively low-effort and improves the core workout experience for everyone.

---

## 3. Dependency Graph (Updated)

```
PHASE 0 — FOUNDATION (Week 1–2)
│
├── 0.6 ExerciseLibrary.ts (101 exercises) ──────────────✅ DONE
├── 0.7 Firestore rules (fitness collections + consent) ─✅ DONE
├── 0.8 types.ts + fitness types ────────────────────────✅ DONE
├── 0.11 metadata.json + package.json ──────────────────✅ DONE
│
├── 0.9 server.ts: fitness API routes + agent prompts ──🔴 IN PROGRESS
│   │  └── depends on: 0.6, 0.7, 0.8
│   │  └── unlocks: ALL of Phase 1, Phase 2 agent endpoints
│   │
│   ├── F01 Profile Agent ──────────────────────────────→ endpoint: POST /api/fitness/profile
│   ├── F11 Compliance Gate Agent ──────────────────────→ endpoint: POST /api/fitness/consent
│   │                                                  → endpoint: POST /api/fitness/validate-profile
│   ├── F02 Workout Generator Agent ────────────────────→ endpoint: POST /api/fitness/generate-plan
│   │                                                  → endpoint: GET /api/fitness/plan
│   ├── F03 Exercise Library Agent ─────────────────────→ endpoint: POST /api/fitness/substitute
│   │                                                  → endpoint: POST /api/fitness/form-cue
│   ├── F04 Recovery Analyst Agent ─────────────────────→ endpoint: POST /api/fitness/recovery
│   ├── F05 Plan Adaptor Agent ─────────────────────────→ endpoint: POST /api/fitness/log-workout
│   │                                                  → endpoint: POST /api/fitness/adapt-plan
│   ├── F06 Coaching Chat Agent ────────────────────────→ endpoint: POST /api/fitness/chat
│   ├── F07 Form Coach Agent ───────────────────────────→ endpoint: POST /api/fitness/form-cue
│   ├── F08 Nutrition Advisor Agent ────────────────────→ endpoint: POST /api/fitness/nutrition
│   ├── F09 Motivation Coach Agent ─────────────────────→ endpoint: POST /api/fitness/checkin
│   └── F10 Data Ingest Agent ──────────────────────────→ endpoint: POST /api/fitness/webhook/*
│
├── 0.10 AthenaCodeStore.ts fitness agent samples ───────🟡 DEPENDS ON 0.9
│   └── (code samples reference agent logic written in 0.9)
│
└── 0.12 CI/CD deploy.yml ───────────────────────────────🟡 INDEPENDENT
    └── (can be done anytime before production deploy)

PHASE 1 — CORE COACHING LOOP (Week 3–5)
│
├── 1.1 FitnessOnboarding.tsx (profile capture UI) ─────depends on: 0.6, 0.7, 0.8, 0.9
│   │  └── uses: F01 (profile validation), F11 (consent gate)
│   │  └── unlocks: 1.2 (plan generation needs profile)
│   │
│   ├── 1.2 F02 Workout Generator Agent + /api/fitness/generate-plan
│   │   │  └── depends on: 0.6, 0.8, 0.9, 1.1
│   │   │  └── unlocks: 1.3 (weekly plan view needs generated plans)
│   │   │
│   │   ├── 1.3 WeeklyPlanView.tsx (7-day grid)
│   │   │   │  └── depends on: 1.2
│   │   │   │  └── unlocks: 1.4 (workout session needs plan to execute)
│   │   │   │
│   │   │   ├── 1.4 WorkoutSession.tsx (active workout + set logging + rest timer)
│   │   │   │   │  └── depends on: 1.3, 0.6 (exercise library for exercise details)
│   │   │   │   │  └── unlocks: 1.5 (logging needs session to log from)
│   │   │   │   │
│   │   │   │   ├── 1.5 POST /api/fitness/log-workout + Firestore save
│   │   │   │   │   │  └── depends on: 1.4, 0.7 (Firestore rules)
│   │   │   │   │   │  └── unlocks: 1.6 (adaptation needs logged workouts)
│   │   │   │   │   │  └── unlocks: 1.7 (progress dashboard needs logged data)
│   │   │   │   │   │
│   │   │   │   │   ├── 1.6 F05 Plan Adaptor Agent + adaptation logic
│   │   │   │   │   │   │  └── depends on: 1.5, 2.4 (recovery-aware adaptation needs wearable data)
│   │   │   │   │   │   │  └── unlocks: Recovery-based adaptation (Phase 2.5)
│   │   │   │   │   │   │
│   │   │   │   │   │   └── 1.7 ProgressDashboard.tsx (strength trends, frequency)
│   │   │   │   │   │       └── depends on: 1.5 (logged workout data)
│   │   │   │   │   └── 4.4 Exercise substitution engine (during workout)
│   │   │   │   │       └── depends on: 0.6, 1.4, F03 (substitution endpoint)
│   │   │   │   └── 4.5 Text-based form coaching
│   │   │   │       └── depends on: 2.1 (chat), 0.6 (exercise library)
│   │   │   └── 2.1 F06 Coaching Chat Agent + chat UI
│   │   │       └── depends on: 0.9, 1.1, 1.2 (needs user context: profile + plan)
│   │   │       └── unlocks: 3.2 (motivation coach needs chat data), 4.5 (form coaching)
│   │   │
│   │   └── 2.4 F04 Recovery Analyst Agent + /api/fitness/recovery
│   │       └── depends on: 0.7, 0.9 (Firestore + server), 2.2 or 2.3 (wearable data for full value)
│   │       └── NOTE: Can work with user-reported check-in data (3.3) before wearables connected
│   │       └── unlocks: 2.5 (recovery-based plan adjustment), 3.1 (digest content)
│   │
│   └── 3.3 Check-in flow UI + /api/fitness/checkin
│       └── depends on: 0.7, 0.9, 3.2 (motivation coach analyzes check-ins)
│       └── NOTE: Can ship before 3.2; motivation coach can wait for check-in data
│
├── 2.2 Apple HealthKit integration (web) ───────────────depends on: 0.7, 0.9, 2.4
├── 2.3 Google Fit integration (web) ────────────────────depends on: 0.7, 0.9, 2.4
├── 2.5 Recovery-based plan adjustment (F05 + F04) ─────depends on: 2.4, 1.6
├── 2.6 Wearable data view dashboards ───────────────────depends on: 2.2, 2.3
├── 2.7 Strava/Garmin/WHOOP/Oura ───────────────────────depends on: 2.2 or 2.3 (pattern)
│
├── 3.1 Push notifications (FCM) + daily digest ────────depends on: 0.9, 2.2 or 2.3, 1.5
├── 3.2 F09 Motivation Coach Agent + sentiment ──────────depends on: 2.1 (chat data), 3.3 (check-in data)
├── 3.4 Streaks & consistency tracking ──────────────────depends on: 1.5
├── 3.5 NUX funnel analytics ────────────────────────────depends on: 1.1–1.4 (funnel events)
│
├── 4.1 Stripe subscription (3 tiers) ───────────────────depends on: 1.1–1.6 (need working product)
├── 4.2 F08 Nutrition Advisor Agent + /api/fitness/nutrition ─depends on: 0.9, 1.1
├── 4.3 GLP-1 / special mode programming ────────────────depends on: 4.2, 1.2, 1.1
│
└── 5.x Advanced (3–6 months out)
    ├── 5.1 Mobile app (React Native / PWA upgrade)
    ├── 5.2 CV form analysis (TensorFlow.js / MediaPipe)
    ├── 5.3 Coach marketplace (Stripe Connect)
    └── 5.4 B2B dashboard
```

### Critical Path (MVP)

```
0.6 ✅ → 0.7 ✅ → 0.8 ✅ → 0.9 🔴 → 1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6
                                                                          ↑
                                                                  (2.4 optional for MVP;
                                                                   recovery-agnostic adaptation works without it)
```

**MVP critical path length:** 0.9 (in progress) + 1.1–1.6 = ~6 items, estimated 15–20 person-days.

**Note:** 2.4 (Recovery Analyst) is NOT on the MVP critical path. A recovery-agnostic plan adaptor (1.6) can ship first, and recovery-based adjustment (2.5) can be added in Phase 2 when wearable data is available. This means MVP does NOT require 2.2/2.3 (HealthKit/Google Fit) — the product works without wearable integration at launch.

---

## 4. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Gemini API quality insufficient for coaching chat** | Medium | High — chat is the #1 differentiator | Use Flash Thinking / Pro for F06; invest in system prompt quality; allow user feedback ("was this helpful?") to iterate |
| **Exercise library quality / coverage gaps** | Low | Medium — 101 well-documented exercises is a solid start | Allow user feedback on substitutions; expand library based on usage patterns; target 200+ by Phase 2 |
| **HealthKit/Google Fit web API limitations** | High | Medium — web APIs are limited vs. native | Ship with user-reported check-ins as fallback; prioritize native mobile app (Phase 5) for full wearable access |
| **User acquisition cost high in competitive market** | High | High — $6.2B market has many players | Differentiate on: (1) conversational coach quality, (2) recovery-based adaptation, (3) multi-wearable aggregation, (4) affordable pricing; target niche first (GLP-1 users, injury-aware) before broadening |
| **Dropout / retention below targets** | High | High — fitness apps have high churn | Invest in Phase 3 (notifications, motivation, check-ins) early; track NUX funnel from day 1; iterate on onboarding completeness |
| **Liability / safety issues** | Low | Very High — injury from bad advice | F11 Compliance Gate is safety-critical; never skip it; clear disclaimers everywhere; conservative exercise recommendations; no medical advice |
| **Gemini API cost exceeds budget at scale** | Medium | Medium | Use Flash for standard agents; route only F06 (chat) and F02 (plan generation) to higher-tier models; cache responses where possible; target < $0.05/active user/day |

---

## 5. Summary — What to Build First (Updated)

| Priority | Features | Why | Status |
|---|---|---|---|
| **P0 (MVP spine)** | 0.9, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6 | Without these, there is no product. Foundation data + types + rules are done; **0.9 (server API routes) is in progress**; Phase 1 UI + agent logic remains. | 🔴 In progress |
| **P1 (Differentiators + Engagement)** | 2.1, 2.4, 2.5, 3.1, 3.2, 3.3, 4.1, 4.4, 0.10 | Chat coach + recovery analysis are the competitive moat. Notifications + check-ins drive retention. Stripe unlocks revenue. | 🔴 Not started |
| **P2 (Premium features + Polish)** | 1.7, 2.2, 2.3, 2.6, 3.4, 3.5, 4.2, 4.3, 4.5 | Progress dashboards, wearable integrations, nutrition advice, form coaching — valuable but build after core + differentiators are solid. | 🔴 Not started |
| **P3 (Future / Nice-to-have)** | 2.7, 5.x | Additional wearable sources, CV form analysis, human coach marketplace, B2B — wait for traction before investing. | ⚪ Future |

---

## 6. What's Been Built (Since Last Update)

| Date | Item | Status |
|---|---|---|
| 2026-09-11 | 0.6 ExerciseLibrary.ts (101 exercises) | ✅ Done |
| 2026-09-11 | 0.7 Firestore rules (fitness collections + consent gate) | ✅ Done |
| 2026-09-11 | 0.8 types.ts (33 fitness interfaces) | ✅ Done |
| 2026-09-11 | 0.11 metadata.json + package.json description update | ✅ Done |
| 2026-09-11 | README.md fitness pivot | ✅ Done |
| 2026-09-11 | docs/PRD.md (v1.0) | ✅ Done |
| 2026-09-11 | docs/ARCHITECTURE.md (v1.0) | ✅ Done |
| 2026-09-11 | docs/GAP_ANALYSIS.md (v1.0) | ✅ Done |
| 2026-09-11 | docs/IMPACT_ANALYSIS.md (v1.0 — this document's predecessor) | ✅ Done |
| 2026-09-12 | 0.9 server.ts fitness API routes (F01, F11, F02, F03, F05, F09 — 6 endpoints) | 🔴 In progress |

---

## 7. Next Actions (Priority Order)

1. **0.9 Complete — Finish remaining server endpoints:** F04 (recovery), F06 (chat), F07 (form cue), F08 (nutrition) — these follow the same pattern as the 6 already built. Estimated 2–3 hours.
2. **0.9 Wire up Firebase server SDK** for server-side Firestore reads/writes (profile, plan generation, workout logging, adaptation). This is the bridge between the Express endpoints and the data layer. Estimated 2 hours.
3. **1.1 Fitness onboarding UI** — rewrite `src/components/Onboarding.tsx` to capture fitness profile instead of PM product config. Estimated 3–4 hours.
4. **1.2 Test F02 Workout Generator** — trigger plan generation with a sample profile, verify output quality and compliance gate behavior. Estimated 1–2 hours.
5. **1.3 Weekly Plan View** — new component `src/components/WeeklyPlan.tsx`. Estimated 2–3 hours.
6. **1.4 Active Workout Session UI** — new component `src/components/WorkoutSession.tsx`. Estimated 4–6 hours.
7. **1.5 Test workout logging** — log a sample workout, verify Firestore write + adaptation trigger. Estimated 1 hour.
8. **1.6 Test plan adaptation** — verify F05 adjusts next week based on logged workout. Estimated 1–2 hours.
9. **App.tsx tab navigation** — replace PM tabs with fitness tabs. Estimated 1–2 hours.

---

*Document version: 1.1 — Updated with 2026-09-12 progress (0.9 in progress, 6 server endpoints built).*
*All RICE scores are estimates based on market research (see PRD Section 1) and PolyVerses architecture reuse assessment.*
