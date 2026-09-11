# PolySync — Gap Analysis

> **AI Fitness Coach · PolyVerses → PolySync Domain Gap Assessment · v1.0 · 2026-09-11**

---

## 1. Purpose

This document catalogs the gap between **PolyVerses' current capabilities** (agentic PM workbench) and **PolySync's target capabilities** (AI fitness coach), so engineering can systematically close each gap.

---

## 2. What PolyVerses Provides (Reusable)

| Capability | Reuse for PolySync | Effort to Adapt |
|---|---|---|
| 23-agent orchestration mesh (state management, routing, circuit breakers) | → 12-agent fitness mesh; same orchestration patterns, new agent definitions | Low — refactor agent list + system prompts |
| Agent network diagram (D3 force graph with 23 nodes + links) | → Visualize 12 fitness agents + their handoff relationships | Low — update node/link definitions |
| Observability dashboard (telemetry heatmap, SLA metrics, failover UI) | → Coaching quality metrics, agent performance, user engagement funnel, retention | Medium — new metric definitions + workout/retention charts |
| Human-in-the-loop gates (compliance gate UI, 15-min undo window, RBAC) | → Safety gate for injury conflicts + medical disclaimer + health consent | Low — reuse gate UI; change gate content from PM compliance to fitness safety |
| Prompt console (23 system prompts browsable + copyable) | → 12 fitness agent system prompts | Low — replace prompt content |
| RBAC (CPO / Group PM / PM / Product Ops) | → User / Premium / Elite tiers OR Coach / Admin roles | Low — refactor permission matrix |
| Firebase Auth (Google SSO) + Firestore per-user storage | → Same; add fitness collections | Low — new collection rules in firestore.rules |
| Server-side Gemini API (Express endpoint + sandbox fallback) | → Add fitness API routes; same Gemini client pattern | Medium — new endpoints + agent-specific system instructions |
| Workflow execution with step-by-step logging | → Fitness workflow: Profile → Generate Plan → Compliance Check → Serve Plan → Log Workout → Adapt | Low — refactor workflow steps |
| Conflict resolution (MoE council) | → When Recovery Agent says "rest" but Plan Adaptor says "push", resolve via consensus | Low — new conflict scenarios |
| D3 + Recharts visualizations | → Progress charts, recovery score distribution, agent heatmaps | Low — new chart data; same visualization components |
| CodeBrowser with AthenaCodeStore (sample code for all agents) | → Replace PM agent samples with fitness agent samples | Medium — write new sample code for F01–F11 |

**Reuse estimate: ~40% of PolyVerses infrastructure is directly reusable.**

---

## 3. What Must Be Built From Scratch

### 3.1 Domain Data (Critical)

| Gap | Severity | Effort | Notes |
|---|---|---|---|
| **Exercise library** (200+ exercises with: name, muscle groups, equipment, difficulty, instructions, common mistakes, substitutions, video ref URLs) | 🔴 Critical | 2–3 hours (data entry) | Core data asset; everything depends on it. Can be JSON/TS file initially; database later if needed. |
| **Fitness profile model** (goals, level, injuries, equipment, days/week, session duration, focus, optional demographics, health consent, special mode) | 🔴 Critical | 1 hour (types + Firestore rules) | Replaces PM-oriented productConfig; this is the user model everything is based on. |
| **Workout plan model** (week number, start date, 7 days, each day with workouts → exercises → sets/reps/rest/RPE targets) | 🔴 Critical | 1 hour (types + Firestore rules) | The generated output of F02; input to workout session UI. |
| **Workout log model** (date, plan ID, exercises performed with actual sets/reps/weight, duration, RPE, notes) | 🔴 Critical | 1 hour (types + Firestore rules) | Enables adaptation, progress tracking, retention analytics. |
| **Wearable data model** (per-source, per-timestamp: steps, calories, sleep, HRV, RHR) | 🟡 High | 0.5 hours (types + Firestore rules) | Normalized schema from multiple sources. |
| **Chat session model** (messages array with role/content/timestamp, context snapshot) | 🟡 High | 0.5 hours (types + Firestore rules) | Enables conversational coach with memory. |
| **Check-in model** (date, workout ID, energy/mood/pain/sleep quality/motivation scores) | 🟡 High | 0.5 hours (types + Firestore rules) | Feeds motivation coach + recovery analyst. |
| **Subscription model** (tier, Stripe IDs, status, period end) | ⚪ Future | 0.5 hours | Needed for monetization; can wait until Phase 4. |

### 3.2 Domain Logic (Critical)

| Gap | Severity | Effort | Notes |
|---|---|---|---|
| **F02 Workout Generator Agent** — generates weekly plan from profile + exercise library; applies periodization basics; respects injuries + equipment | 🔴 Critical | 3–4 hours (system prompt + logic) | Core value proposition. Without this, no plans. |
| **F04 Recovery Analyst Agent** — computes recovery score from wearable data + workout frequency + check-ins; recommends train/reduce/rest | 🔴 Critical | 2–3 hours (system prompt + scoring logic) | Key differentiator; no mobile app does this autonomously. |
| **F05 Plan Adaptor Agent** — adjusts next week based on completed/skipped, recovery, feedback; progressive overload | 🔴 Critical | 3–4 hours (system prompt + logic) | Makes plans adaptive, not static. |
| **F06 Coaching Chat Agent** — conversational coach with full user context; routes to specialist knowledge; safety gate integration | 🔴 Critical | 4–6 hours (system prompt + context assembly + endpoint) | #1 differentiator vs. static-plan apps. |
| **F01 Profile Agent** — validates profile, detects contradictions, suggests clarifications | 🟡 High | 1–2 hours (system prompt) | Ensures data quality before plan generation. |
| **F03 Exercise Library Agent** — lookup + substitution logic | 🟡 High | 1–2 hours (system prompt + lookup logic) | Enables substitution during workouts. |
| **F07 Form Coach Agent** — form cues + common mistakes per exercise; interprets user descriptions | 🟡 High | 1–2 hours (system prompt) | Differentiator; text-based for MVP (CV later). |
| **F08 Nutrition Advisor Agent** — calorie/macro estimation + meal suggestions + dietary preferences | ⚪ Future | 2–3 hours (system prompt + calculation logic) | Premium feature; fills nutrition gap. |
| **F09 Motivation Coach Agent** — sentiment analysis + dropout risk + tone adjustment | ⚪ Future | 2–3 hours (system prompt + rule-based sentiment) | Differentiator; depends on check-in data. |
| **F10 Data Ingest Agent** — normalizes wearable data from multiple sources | 🟡 High | 2–3 hours (ETL logic, no LLM) | Enables recovery analysis with real data. |
| **F11 Compliance Gate Agent** — injury conflict check, medical disclaimer, health consent gate, safety thresholds | 🔴 Critical | 2–3 hours (system prompt + logic) | Safety-critical; never skip. |

### 3.3 UI Surfaces (Critical)

| Gap | Severity | Effort | Notes |
|---|---|---|---|
| **Fitness onboarding flow** (replace PM onboarding with fitness profile capture) | 🔴 Critical | 3–4 hours (Onboarding.tsx rewrite) | First user experience; must be smooth and fast. |
| **Today's Workout view** (active workout if scheduled; recovery + suggestion if not) | 🔴 Critical | 3–4 hours (new component) | Primary daily interaction point. |
| **Weekly Plan view** (7-day grid, expandable, recovery recommendation per day) | 🔴 Critical | 2–3 hours (new component) | Planning surface. |
| **Active Workout Session UI** (set logging, rest timer, complete/skip/modify, substitution) | 🔴 Critical | 4–6 hours (new component) | The actual workout experience; most detailed UI. |
| **Coach Chat UI** (message list, input, quick-action buttons, streaming response) | 🔴 Critical | 3–4 hours (new component) | Differentiator surface. |
| **Progress Dashboard** (strength trends, frequency, volume, body weight) | 🟡 High | 2–3 hours (new component reusing D3/Recharts) | User motivation + visible progress. |
| **Settings screen** (profile edit, wearable connections, notifications, data export/delete, subscription, disclaimer) | 🟡 High | 2–3 hours (new component) | Account management. |
| **Wearable data view** (per-source dashboards) | ⚪ Future | 2–3 hours (new component) | Shows users their data; builds trust in recovery insights. |
| **App tab navigation** (replace PM tabs with fitness tabs) | 🔴 Critical | 1–2 hours (App.tsx update) | Structural change to App.tsx. |

### 3.4 Integration & Infrastructure (High)

| Gap | Severity | Effort | Notes |
|---|---|---|---|
| **Apple HealthKit integration** (web Safari API + future native) | 🟡 High | 3–4 hours (web) | Required for iOS users; web API is limited but usable for sleep, HR, steps. |
| **Google Fit integration** (web OAuth + future native) | 🟡 High | 2–3 hours (web) | Required for Android users. |
| **Push notifications (FCM)** | 🟡 High | 3–4 hours (setup + daily digest) | Primary engagement channel; daily digest is key feature. |
| **Stripe subscription** | ⚪ Future | 4–6 hours (Phase 4) | Monetization; wait until MVP is solid. |
| **Scheduled functions (daily digest, recovery recalculation)** | 🟡 High | 1–2 hours (Cloud Functions or server cron) | Needed for digest + proactive features. |
| **PWA manifest + offline support** | ⚪ Future | 1–2 hours | Improves mobile experience before native app. |

### 3.5 Compliance & Safety (High)

| Gap | Severity | Effort | Notes |
|---|---|---|---|
| **Fitness disclaimer on all workout content** | 🔴 Critical | 0.5 hours (UI footer + F11 prompt) | Legal protection; must be everywhere. |
| **Medical advice blocking** | 🔴 Critical | 1 hour (F11 logic) | Safety; never give medical advice. |
| **Health data consent gate** (API-level + Firestore rules) | 🔴 Critical | 1 hour (endpoint guard + rules) | GDPR/CCPA; health data is sensitive. |
| **GDPR/CCPA deletion pipeline** | 🟡 High | 2–3 hours (admin function) | Legal requirement; can be manual at first. |
| **Data export** | 🟡 High | 1–2 hours (settings UI + function) | GDPR right to portability. |

---

## 4. Gap Closure Priority

| Priority | Gaps to Close | Why First |
|---|---|---|
| **P0 (blocks MVP)** | Exercise library, fitness profile model, workout plan model, workout log model, F02 Workout Generator, F11 Compliance Gate, fitness onboarding UI, today's workout view, weekly plan view, active workout session UI, app tab navigation | Without these, there is no product. A user cannot onboard, get a plan, do a workout, or see adaptation. |
| **P1 (differentiators + retention)** | F04 Recovery Analyst, F05 Plan Adaptor (recovery-aware), F06 Coaching Chat, check-in model, F09 Motivation Coach, push notifications + daily digest, HealthKit + Google Fit integration | Chat + recovery adaptation are the competitive moat. Notifications + check-ins drive retention. |
| **P2 (premium features + polish)** | F03 Exercise Library Agent (substitution), F07 Form Coach, F08 Nutrition Advisor, progress dashboard, wearable data views, streaks, NUX analytics, data export, GDPR deletion pipeline | Valuable but build after core + differentiators are solid. |
| **P3 (future)** | F10 multi-source wearable expansion (Strava/Garmin/WHOOP/Oura beyond HealthKit/Google Fit), Stripe subscription tiers, PWA/offline, CV form analysis, AR, coach marketplace, B2B | Wait for traction before investing. |

---

*Document version: 1.0 — Gap analysis between PolyVerses PM workbench and PolySync AI fitness coach.*
*Updated: 2026-09-11*
