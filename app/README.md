# PolyVerses — AI Fitness Coach Platform

> An agentic AI fitness coaching platform: orchestrate specialist fitness agents, watch them work, and inspect exactly how each coaching recommendation was built.

`TypeScript` · `React` · `Vite` · `Firebase` · `Gemini`

![PolyVerses access portal](docs/screenshot.png)

*Entry portal. The orchestration console, agent network diagram, and observability dashboard sit behind SSO.*

---

## What it is

PolyVerses started as a multi-agent product management workbench, and the architecture has been repurposed as a **fitness coaching platform**. The core insight is the same: most "AI fitness" apps are chat boxes with a fitness prompt. PolyVerses is the opposite bet — a **network of specialist fitness agents** with orchestration, observability, and a prompt console — so the interesting question isn't *what did the model say*, it's *which agent ran, on what input, and why*.

The platform generates adaptive weekly workout plans, coaches users through sessions, ingests wearable data for recovery-based adjustments, and provides a conversational AI coach backed by user history — all traceable through a 12-agent mesh.

## Core surfaces

| Component | What it does |
|---|---|
| **Onboarding & Profile** | Capture goals, fitness level, injuries, equipment, availability |
| **Weekly Plan Dashboard** | View the generated week; tap a day to see the workout |
| **Active Workout Session** | Log sets/reps/weight; rest timer; complete/skip/modify per exercise |
| **Coaching Chat** | Natural language coach with full user context (profile, history, wearables) |
| **Progress Dashboard** | Strength trends, volume charts, frequency, recovery scores (D3/Recharts) |
| **Wearable Data View** | Apple HealthKit / Google Fit / Strava / Garmin / WHOOP / Oura ingestion |
| **Agent Network Diagram** | Visualise how the 12 fitness agents hand off to each other |
| **Observability Dashboard** | Coaching quality metrics, agent telemetry, retention funnel, adaptation rates |
| **Prompt Console** | Iterate on the 12 agent system prompts against live state |
| **Daily Digest** | Morning Slack-style notification: sleep recap, yesterday's workout, today's plan |

## Architecture

The Gemini key is held **server-side** (`server.ts`) and the client calls the app's own endpoints — the key is never shipped to the browser.

Firestore access is governed by [`firestore.rules`](firestore.rules): default-deny, ownership checks, email verification, per-field validation, health data consent gating before wearable processing, and immutability constraints on sensitive fields. See [`security_spec.md`](security_spec.md) for the model.

### Agent roster (12 agents)

| ID | Name | Priority | Role |
|---|---|---|---|
| F00 | Orchestrator Router | High | Master coordinator — routes requests, manages multi-agent workflows |
| F01 | Profile Agent | High | Validates and structures user fitness profiles; flags contradictions |
| F02 | Workout Generator | High | Generates weekly plans from profile + exercise library; applies periodization |
| F03 | Exercise Library | Medium | Serves exercise metadata; handles substitutions and form cues |
| F04 | Recovery Analyst | High | Ingests wearable data → recovery score → train/reduce/rest recommendation |
| F05 | Plan Adaptor | Medium | Adjusts next week based on completion, recovery, feedback, progressive overload |
| F06 | Coaching Chat | High | Conversational coach with full user context; safety-gated by Compliance Agent |
| F07 | Form Coach | Medium | Form cues from exercise + user description; text-based guidance |
| F08 | Nutrition Advisor | Medium | Calorie/macro estimation; meal suggestions; nutrition Q&A |
| F09 | Motivation Coach | Low | Sentiment analysis of check-ins/chat; dropout-risk detection; tone adjustment |
| F10 | Data Ingest | Medium | Normalizes wearable data from all sources into common schema |
| F11 | Compliance Gate | High | Safety checks: injury contradictions, medical advice blocking, health data consent |

### Data flow (typical coaching loop)

```
User Profile (F01) → Workout Generator (F02) → Compliance Gate (F11)
     → Weekly Plan View
     → Daily: Active Workout Session → Log to Firestore
     → Plan Adaptor (F05) adjusts next week based on completion + Recovery Analyst (F04)
     → Coaching Chat (F06) answers questions with full context
     → Morning: Daily Digest (notifications) pulls sleep + yesterday + today's plan
```

### External integrations

- **Apple HealthKit** (web → iOS Safari `requestAuthorization`; mobile → native SDK)
- **Google Fit** (OAuth Web API; mobile → native SDK)
- **Strava** (OAuth, workout/activity history)
- **Garmin Connect** (API)
- **WHOOP** (OAuth, recovery/sleep/HRV)
- **Oura** (OAuth, sleep/HRV/readiness)
- **Stripe** (subscription tiers: Free / Premium / Elite)

## Run locally

**Prerequisites:** Node.js 18+

```bash
npm install
cp .env.example .env.local     # add your GEMINI_API_KEY
npm run dev
```

## Feature inventory — what's done vs. what's not

### ✅ Done (Phase 0 foundation)

| Layer | Status | Details |
|---|---|---|
| **Exercise library** | ✅ Done | 101 exercises across 7 categories (strength 49, mobility 17, core 13, hypertrophy 11, cardio 5, plyometric 5, endurance 1) with full metadata: muscle groups, equipment, difficulty, instructions, common mistakes, substitutions, video URLs. `src/ExerciseLibrary.ts` |
| **Fitness types** | ✅ Done | 33 TypeScript interfaces: FitnessProfile, WorkoutPlan, WorkoutLogEntry, ExerciseLog, SetLog, DailyWorkout, ExerciseTarget, RecoveryAssessment, WellnessSnapshot, ChatSession, ChatMessage, CheckIn, UserSubscription, WearableDataPoint, HealthDataConsent, SubscriptionTier, etc. `src/types.ts` |
| **Firestore security rules** | ✅ Done | 419-line ruleset covering 10 user subcollections (profile, workouts, plans, wearableData, chatSessions, checkIns, recovery, subscription, settings, dailyDigest) + public exercise library. Health data consent gating, field validation, timestamp integrity, ABAC patterns. `firestore.rules` |
| **README pivot** | ✅ Done | `README.md` rewritten as AI Fitness Coach Platform with agent roster, architecture, data flow, integrations, feature inventory, and quick start. |
| **Market research** | ✅ Done | $3.2B–$21.79B market (2025), 18–25% CAGR through 2034, 340M+ users, 10-competitor feature comparison, 8-market-report synthesis, Forbes + ISSA sources. Referenced in `docs/PRD.md` sections 1 and 9. |
| **PRD** | ✅ Done | `docs/PRD.md` — 13 sections: executive summary, problem statement, target users, 26 user stories, full feature inventory (done vs. not), architecture overview (system diagram + 12-agent table + data flow + API routes + Firestore data model), success metrics, non-functional requirements, competitive landscape (12 competitors + 9 differentiators), GTM strategy, risks, open questions, appendix. |
| **Gap analysis** | ✅ Done | `docs/GAP_ANALYSIS.md` — reusable PolyVerses infrastructure (40% reuse), gaps to build from scratch broken down by data (8 items), domain logic (12 agents), UI surfaces (9 screens), integrations (6), compliance (5), with priority ordering. |
| **Impact analysis** | ✅ Done | `docs/IMPACT_ANALYSIS.md` — RICE scoring for all 3 phases (reach 1–5, impact 1–3, confidence 50–100%, effort in person-weeks), prioritized build order with critical path, risk assessment matrix, summary of what to build first (P0/P1/P2/P3). |
| **Architecture doc** | ✅ Done | `docs/ARCHITECTURE.md` — 7 sections: system diagram (updated v2), 12-agent ledger, fitness data flow diagram, infrastructure stack table (8 layers), reuse/adaptation table (11 items), custom-build table (15 items), 3-action architecture guidance. |
| **Multi-agent orchestration** | ✅ Reused | 23-agent mesh from PM workbench → 12-agent fitness mesh. State management, routing, circuit breakers, MoE conflict resolution, workflow execution, human-in-the-loop gates, prompt console — all reusable. |
| **D3 + Recharts** | ✅ Reused | Same visualization libraries for progress charts, agent heatmaps, recovery score distribution. |
| **Firebase Auth + Firestore** | ✅ Reused | Google SSO + per-user Firestore storage, extended with fitness collections. |
| **Server-side Gemini API** | ✅ Reused | Express endpoint + sandbox fallback pattern, extended with fitness endpoints. |

### 🔴 Not started (Phase 1 — Core Coaching Loop)

| Feature | Effort | Dependencies | MVP? |
|---|---|---|---|
| **F01 Profile Agent** — validates profile, detects contradictions, suggests clarifications | 1–2h | types.ts, server.ts | Yes |
| **F02 Workout Generator Agent** — generates weekly plan from profile + exercise library; periodization; respects injuries + equipment | 3–4h | ExerciseLibrary.ts, types.ts, server.ts, onboarding | Yes |
| **F11 Compliance Gate Agent** — injury conflict check, medical disclaimer, health consent gate, safety thresholds, special mode | 2–3h | server.ts, types.ts | Yes |
| **Fitness onboarding UI** (`Onboarding.tsx` rewrite) — Google SSO → fitness profile capture → complete | 3–4h | ExerciseLibrary.ts, types.ts, F01 logic | Yes |
| **Weekly plan view** (`WeeklyPlan.tsx`) — 7-day grid, expandable, workout name + focus + exercise count per day | 2–3h | F02 (plan generation) | Yes |
| **Active workout session UI** (`WorkoutSession.tsx`) — set logging (sets/reps/weight), rest timer, complete/skip/modify, substitution flow | 4–6h | WeeklyPlan.tsx, ExerciseLibrary.ts | Yes |
| **Workout logging API** (`/api/fitness/log-workout`) — saves completed workout to Firestore, triggers adaptation | 1–2h | firestore.rules, types.ts, session UI | Yes |
| **F05 Plan Adaptor Agent** — adjusts next week: completed/skipped, recovery, feedback, progressive overload | 3–4h | log-workout API, recovery agent (optional for MVP) | Yes |
| **App tab navigation** (`App.tsx` update) — replace PM tabs with fitness tabs (today's workout, weekly plan, progress, coach chat, settings) | 1–2h | — | Yes |
| **Progress dashboard** (`ProgressDashboard.tsx`) — strength trends, workout frequency heatmap, volume trends, body weight log | 2–3h | log-workout data | No (post-MVP) |

**MVP = F01 + F02 + F11 + onboarding UI + weekly plan view + workout session UI + log-workout API + plan adaptor + app tab nav.**

### 🟡 Planned (Phase 2–4)

| Feature | Phase | Effort | Notes |
|---|---|---|---|
| F06 Coaching Chat Agent + chat UI | 2 | 5–7h | #1 differentiator; full user context; safety-gated |
| F04 Recovery Analyst Agent + `/api/fitness/recovery` | 2 | 2–3h | Wearable data + workout frequency → recovery score 0–100 |
| Apple HealthKit integration (web) | 2 | 3–4h | Safari web API for sleep, HR, steps, active calories |
| Google Fit integration (web) | 2 | 2–3h | OAuth + REST API |
| F03 Exercise Library Agent + `/api/fitness/substitute` | 2 | 1–2h | Lookup + substitution queries |
| F07 Form Coach Agent + `/api/fitness/form-cue` | 2 | 1–2h | Form cues + common mistakes per exercise |
| Wearable data view dashboards | 2 | 2–3h | Sleep trends, HRV, RHR, steps/calories per source |
| F09 Motivation Coach Agent | 3 | 2–3h | Sentiment + dropout risk + tone adjustment |
| Check-in flow UI + `/api/fitness/checkin` | 3 | 2–3h | Post-workout + end-of-day check-ins |
| Push notifications (FCM) + daily digest | 3 | 4–6h | Morning digest: sleep + yesterday + today's plan |
| Streaks & consistency tracking | 3 | 1–2h | Visual streaks, consistency score |
| F08 Nutrition Advisor Agent + `/api/fitness/nutrition` | 4 | 2–3h | Calorie/macro estimation + meal suggestions |
| GLP-1 / special mode programming | 4 | 2–3h | Adjusted intensity, recovery emphasis, nutrition guidance |
| Exercise substitution engine (during workout) | 4 | 1–2h | Real-time swap flow in WorkoutSession UI |
| Text-based form coaching (F07 + chat) | 4 | 1–2h | "How do I do this exercise?" → form cues |
| Stripe subscription (3 tiers) | 4 | 4–6h | Free / Premium / Elite tier gating |
| Strava / Garmin / WHOOP / Oura integrations | 5 | 2–4h each | Expand beyond HealthKit + Google Fit |

### ⚪ Future (Phase 5+)

Mobile app (React Native / PWA), CV form analysis (TensorFlow.js / MediaPipe), coach marketplace (Stripe Connect), B2B dashboard, AR form overlay, CGM integration, advanced periodization, custom workout builder, social features, nutrition tracking.

## Status

Working prototype — repurposed from PM workbench to fitness coaching platform. The agent orchestration infrastructure, observability dashboard, prompt console, and multi-agent workflow engine are real and reusable. The fitness-domain layer (exercise library, workout generator, recovery analyst, wearable integrations, active session UI, chat agent) is under construction.

**Current phase:** Phase 0 complete (foundation). Phase 1 not yet started (core coaching loop).

## Documentation

| Document | File | Purpose |
|---|---|---|
| Product Requirements Document | `docs/PRD.md` | Full PRD: market, users, 26 user stories, feature inventory, architecture, API, data model, success metrics, GTM, risks, open questions |
| Architecture | `docs/ARCHITECTURE.md` | System diagram, 12-agent ledger, fitness data flow, infra stack, reuse/adaptation map, custom-build map, architecture guidance |
| Gap Analysis | `docs/GAP_ANALYSIS.md` | What PolyVerses provides (reusable) vs. what must be built from scratch; gap closure priority |
| Impact Analysis | `docs/IMPACT_ANALYSIS.md` | RICE scoring + dependency-mapped build order + risk assessment |
| Security Spec | `security_spec.md` | Firestore ABAC/Zero-Trust model, "Dirty Dozen" attack payloads, test runner spec |
| CI/CD | `.github/workflows/ci.yml` | Lint, typecheck, build, dependency audit on push/PR to main |
| Screenshot | `docs/screenshot.png` | Access portal screenshot |

## License

MIT
