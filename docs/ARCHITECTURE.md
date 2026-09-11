# PolySync — Architecture

> **AI Fitness Coach · Multi-Agent Orchestration Platform · v1.0 · 2026-09-11**

---

## 1. Overview

PolySync is a **server-rendered React + Vite + TypeScript + Firebase + Express** web application that orchestrates a **12-agent specialist AI mesh** to deliver personalized, adaptive fitness coaching. The Gemini API key is held **server-side** in `server.ts`; the client calls the app's own API endpoints and never sees the key.

The architecture inherits PolyVerses' multi-agent orchestration pattern — agent network visualization, observability dashboard, human-in-the-loop gates, and per-agent system prompts — but replaces the PM workbench domain with **fitness coaching domain logic**.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            CLIENT (React SPA / PWA)                      │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Weekly Plan │  │ Today's      │  │ Progress     │  │ Coach Chat   │ │
│  │  (7-day grid)│  │ Workout      │  │ Dashboard    │  │ (LLM chat)   │ │
│  │              │  │ (active log) │  │ (charts)     │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Onboarding   │  │ Wearable Data│  │ Check-ins    │  │ Settings     │ │
│  │ (fitness     │  │ (sleep/HRV/  │  │ (energy/mood/│  │ (profile edit│ │
│  │  profile)    │  │  RHR trends) │  │  pain/motiva)│  │  + wearables,│ │
│  │              │  │              │  │              │  │  subscription│ │
│  └──────────────┘  └──────────────┘  └──────────────┘  │  + data export│
│                                                          │  + disclaimer │
│  ┌───────────────────────────────────────────────────────┘  └──────────────┘ │
│  │                   Fitness Agent Network (D3 Topology + Heatmap)          │
│  │  [F01:Profile] → [F02:WorkoutGen] → [F11:Compliance] → [F05:PlanAdapt] │
│  │       ↑              ↑                   ↑                   ↑            │
│  │  [F10:DataIngest] [F03:ExerciseLib]  [F07:FormCoach]   [F04:Recovery]  │
│  │       ↑              │                   │                   │            │
│  │       └── HealthKit/GoogleFit/Strava/Garmin/WHOOP/Oura ──┘            │
│  │                                                                    │      │
│  │  [F06:CoachingChat] ←→ [F09:Motivation] ←→ [F08:Nutrition]           │
│  └──────────────────────────────────────────────────────────────────────────┘
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐
│  │                     Observability Dashboard (D3 / Recharts)              │
│  │  Agent telemetry heatmap · Coaching quality metrics · Engagement funnel  │
│  │  Retention cohorts · API cost tracking · Recovery score distribution      │
│  └─────────────────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────────────────┘
                                │  HTTP (REST)
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SERVER (Express + Vite, port 3000)                   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  FITNESS API ROUTES                                                     ││
│  │  POST /api/fitness/profile          → F01: save/update profile         ││
│  │  GET  /api/fitness/profile          → F01: get profile                 ││
│  │  POST /api/fitness/generate-plan    → F02: generate weekly plan        ││
│  │  GET  /api/fitness/plan             → F02: get current plan            ││
│  │  POST /api/fitness/log-workout      → F05: log workout + adapt          ││
│  │  POST /api/fitness/adapt-plan       → F05: manual re-adaptation         ││
│  │  POST /api/fitness/chat             → F06: coaching chat                ││
│  │  POST /api/fitness/recovery         → F04: recovery score + rec         ││
│  │  POST /api/fitness/nutrition        → F08: nutrition guidance            ││
│  │  POST /api/fitness/form-cue         → F07: form cues for exercise       ││
│  │  POST /api/fitness/substitute       → F03: find exercise substitute     ││
│  │  POST /api/fitness/checkin          → F09: record check-in + sentiment  ││
│  │  POST /api/fitness/webhook/healthkit → F10: Apple HealthKit callback    ││
│  │  POST /api/fitness/webhook/googlefit → F10: Google Fit callback         ││
│  │  GET  /api/fitness/progress         → aggregated progress data           ││
│  │  POST /api/fitness/consent          → F11: set health data consent       ││
│  │                                                                          ││
│  │  All routes: server-side Gemini 3.5 Flash with agent-specific           ││
│  │  systemInstruction; sandbox fallback if GEMINI_API_KEY is missing.       ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  STATIC SERVING                                                          ││
│  │  Dev: Vite middleware mode                                              ││
│  │  Prod: express.static(dist) + SPA fallback                             ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                │
             ┌──────────────────┼──────────────────┐
             ▼                  ▼                  ▼
        ┌─────────┐      ┌──────────┐      ┌──────────────┐
        │Firebase │      │  Gemini  │      │  External    │
        │ Auth +  │      │  API     │      │  APIs        │
        │Firestore│      │(server-  │      │ ┌───────────┐│
        │         │      │  side)   │      │ │Apple      ││
        │users/   │      │          │      │ │HealthKit  ││
        │{uid}/   │      │          │      │ ├───────────┤│
        │profile  │      │          │      │ │Google Fit ││
        │{uid}/   │      │          │      │ ├───────────┤│
        │workouts │      │          │      │ │Strava     ││
        │{uid}/   │      │          │      │ ├───────────┤│
        │plans    │      │          │      │ │Garmin     ││
        │{uid}/   │      │          │      │ ├───────────┤│
        │logs     │      │          │      │ │WHOOP      ││
        │{uid}/   │      │          │      │ ├───────────┤│
        │wearable │      │          │      │ │Oura       ││
        │{uid}/   │      │          │      │ ├───────────┤│
        │chat     │      │          │      │ │Stripe     ││
        │{uid}/   │      │          │      │ └───────────┘│
        │checkIns │      │          │      │              │
        │{uid}/   │      │          │      │              │
        │notifications             │          │              │
        └─────────┘      └──────────┘      └──────────────┘
```

---

## 3. Agent Details

### 3.1 F00 — Orchestrator Router
- **Purpose:** Entry point for all user requests; determines which agent(s) to invoke and in what order
- **Inputs:** User request type, user profile availability,_auth context
- **Logic:** Route to single agent or orchestrate multi-agent chain (e.g., generate plan → compliance check → adapt)
- **System prompt:** Router persona; knows all 12 agents and their responsibilities; idempotent key handling; circuit breaker on repeated failures
- **Gemini route:** Standard (Flash)

### 3.2 F01 — Profile Agent
- **Purpose:** Validate and structure user fitness profile; detect contradictions
- **Inputs:** Onboarding form data or profile update
- **Logic:** Check for contradictions (advanced + no equipment + can't do pushups → suggest clarification); normalize goal/level/equipment enums; ensure required fields present
- **System prompt:** Expert fitness assessor; knows exercise prerequisites per fitness level; suggests missing fields politely
- **Gemini route:** Standard (Flash)

### 3.3 F02 — Workout Generator Agent
- **Purpose:** Generate a weekly workout plan from profile + exercise library
- **Inputs:** User profile (goal, level, injuries, equipment, days/week, session duration, focus), exercise library (searchable by muscle group, equipment, difficulty)
- **Logic:**
  - Select exercises matching equipment + avoiding injury exercises
  - Distribute across available days (e.g., 4 days → upper/lower split or full-body)
  - Assign sets, reps, rest, RPE targets per exercise based on goal + level
  - Apply progressive overload logic: if previous week's workouts were completed at target RPE, increase weight/reps slightly
  - Include warm-up and cool-down suggestions
- **System prompt:** Expert strength & conditioning coach; knows periodization basics; generates concrete, actionable plans; cites exercise library IDs
- **Gemini route:** Reasoning (Flash Thinking or Pro for quality)

### 3.4 F03 — Exercise Library Agent
- **Purpose:** Serve exercise metadata; handle substitution queries
- **Inputs:** Exercise ID or query (muscle group, equipment, difficulty, substitute for X)
- **Logic:** Lookup in bundled `ExerciseLibrary.ts`; return exercise metadata; for substitutions: find exercises targeting same primary muscle groups with matching equipment availability
- **System prompt:** Exercise science reference; knows muscle targeting, common substitutions, regressions and progressions
- **Gemini route:** Standard (Flash) — mostly lookup, light reasoning for substitutions

### 3.5 F04 — Recovery Analyst Agent
- **Purpose:** Compute recovery score (0–100) from wearable data + workout frequency; recommend train/reduce/rest
- **Inputs:** Sleep duration + quality (if available), HRV trend (if available), resting heart rate trend (if available), steps/active calories (if available), workout frequency last 7 days, user-reported energy/mood from check-ins
- **Logic:**
  - Score components: sleep (0–30 pts), HRV vs baseline (0–25 pts), RHR vs baseline (0–20 pts), workout frequency reasonableness (0–15 pts), user-reported energy (0–10 pts)
  - Missing data → lower confidence, use available signals only
  - Output: score 0–100 + label (recovered / moderate / low / poor) + recommendation (train normally / reduce volume / rest day) + explanation
- **System prompt:** Sports science recovery specialist; interprets biometric trends conservatively; never advises training through injury
- **Gemini route:** Reasoning (Flash Thinking)

### 3.6 F05 — Plan Adaptor Agent
- **Purpose:** Adjust next week's plan based on completed/skipped workouts, recovery scores, user feedback
- **Inputs:** Current week's plan, workout log (completed/skipped per session, actual sets/reps/weight vs target), recovery scores for the week, user feedback notes
- **Logic:**
  - If workout completed at or above target RPE → increase weight/reps next week (+2.5–5% or +1 rep)
  - If workout completed below target → maintain or slight increase
  - If workout skipped → maintain or reduce volume next week (don't pile on)
  - If recovery score was low on workout days → reduce volume/intensity for upcoming week
  - If user feedback indicates pain/discomfort → swap problematic exercises via F03
- **System prompt:** Adaptive programming coach; conservative progression; respects recovery signals
- **Gemini route:** Reasoning (Flash Thinking)

### 3.7 F06 — Coaching Chat Agent
- **Purpose:** Conversational AI fitness coach; answers user questions with context from their profile, workouts, plan, and wearables
- **Inputs:** User message + conversation history + current profile snapshot + recent workouts + current plan + latest recovery score + wearable data summary
- **Logic:**
  - Understand user intent (form question / nutrition question / recovery question / motivation / general fitness advice)
  - Route to relevant specialist knowledge (F03 for form, F08 for nutrition, F04 for recovery, F02 for program questions)
  - Synthesize answer in a supportive coach tone; reference user's actual data ("Based on your squat numbers this week...")
  - If medical/injury question → pass to F11 Compliance Gate for disclaimer + safe response
  - Store conversation history in Firestore for context continuity
- **System prompt:** Supportive, knowledgeable fitness coach persona; uses user's data; never gives medical advice; encourages but doesn't pressure
- **Gemini route:** Reasoning (highest quality — Flash Thinking or Pro)

### 3.8 F07 — Form Coach Agent
- **Purpose:** Provide form cues and common mistakes for exercises; interpret user descriptions of how a movement felt
- **Inputs:** Exercise name/ID, user's description of movement feel (optional)
- **Logic:** Look up exercise in library for standard form cues and common mistakes; if user provides description, compare to common error patterns and suggest corrections
- **System prompt:** Experienced personal trainer; knows cueing language; focuses on safety and effectiveness
- **Gemini route:** Standard (Flash)

### 3.9 F08 — Nutrition Advisor Agent
- **Purpose:** Estimate calorie/macro targets; answer nutrition questions; suggest meal ideas
- **Inputs:** User profile (goal, weight, height, age, gender, activity level from workouts), dietary preferences (if provided), user question
- **Logic:**
  - Calculate TDEE estimate (Mifflin-St Jeor or similar) + activity adjustment from workout frequency
  - Apply goal-based deficit/surplus (weight loss: -300 to -500 kcal; hypertrophy: +200 to +300 kcal; maintenance: TDEE)
  - Set protein target (1.6–2.2g/kg depending on goal)
  - Answer questions within scope; flag medical nutrition questions (e.g., "should I take this supplement for my condition") to disclaimer
- **System prompt:** Evidence-based nutrition coach; conservative estimates; always includes disclaimer for medical questions
- **Gemini route:** Standard (Flash)

### 3.10 F09 — Motivation Coach Agent
- **Purpose:** Analyze user check-ins and chat sentiment; detect dropout risk; generate motivational messages; adjust tone
- **Inputs:** Check-in data (energy, mood, pain, motivation scores), chat message sentiment (light analysis), workout frequency trend (declining?)
- **Logic:**
  - Score dropout risk: declining frequency + low motivation + low energy + negative mood → high risk
  - Adjust messaging tone: high motivation → challenging/encouraging; low motivation → supportive/empathetic; very low → gentle re-engagement, no pressure
  - Generate daily/weekly motivational messages tuned to current state
  - Flag high dropout risk to trigger re-engagement notification
- **System prompt:** Empathetic motivation coach; reads between the lines; never shames; adapts tone to user state
- **Gemini route:** Standard (Flash) + simple rule-based sentiment threshold

### 3.11 F10 — Data Ingest Agent
- **Purpose:** Normalize wearable data from multiple sources into common schema
- **Inputs:** Webhook payloads from Apple HealthKit, Google Fit, Strava, Garmin, WHOOP, Oura
- **Logic:**
  - Validate source and data shape
  - Normalize to common schema: steps, activeCalories, sleepDuration, sleepStages, restingHeartRate, hrv, workoutSessions
  - Handle missing fields gracefully (not all sources provide all fields)
  - Store in `users/{uid}/wearableData/{source}/{timestamp}`
  - Forward relevant data to F04 Recovery Analyst on request
- **System prompt:** Data integration specialist; handles partial data; no imputation of missing values (uses what's available)
- **Gemini route:** Rule-based (no LLM needed; this is ETL logic in server.ts)

### 3.12 F11 — Compliance Gate Agent
- **Purpose:** Safety and legal gate; checks workout recommendations against declared injuries; enforces disclaimers; blocks medical advice
- **Inputs:** Workout plan or recommendation, user profile (injuries, special mode), health data consent flag
- **Logic:**
  - Check if any recommended exercise directly conflicts with declared injuries (e.g., recommending heavy squats to someone with "knee pain" → flag)
  - If health data consent is false → block wearable data processing endpoints
  - If user query is medical ("do I have a torn meniscus?", "should I take this medication?") → return disclaimer + recommend professional consultation
  - All plans include "consult a healthcare professional before starting any exercise program" footer
  - Special modes (GLP-1, postpartum, injury rehab) → adjust safety thresholds appropriately
- **System prompt:** Safety-first compliance officer; errs on the side of caution; knows red flags for medical vs. fitness questions
- **Gemini route:** Reasoning (safety-critical — use highest quality available)

---

## 4. Data Flow

### 4.1 Onboarding Flow
```
User signs up (Google OAuth via Firebase Auth)
    → Onboarding screen: collect fitness profile fields
    → POST /api/fitness/profile (F01 validates)
    → Save to Firestore: users/{uid}/profile
    → Trigger F02: generate initial weekly plan
    → Save to Firestore: users/{uid}/plans/{planId}
    → Redirect to Today's Workout / Weekly Plan view
```

### 4.2 Workout Execution Flow
```
User taps today's workout
    → GET /api/fitness/plan (current plan from Firestore)
    → User logs sets/reps/weight for each exercise
    → POST /api/fitness/log-workout (F05)
    → Save to Firestore: users/{uid}/workouts/{workoutId}
    → F05 schedules adaptation for end of week (or immediate if requested)
    → If wearable connected: F10 updates wearableData; F04 recomputes recovery
```

### 4.3 Conversational Coach Flow
```
User sends message in Coach Chat
    → POST /api/fitness/chat (F06)
    → Server fetches: profile, recent workouts, current plan, latest recovery score
    → F06 generates response with full context
    → Response saved to Firestore: users/{uid}/chatSessions/{sessionId}/messages
    → Response returned to client
```

### 4.4 Daily Digest Flow
```
Every morning (cron or scheduled function):
    → For each active premium user:
        → Fetch: sleep data (if wearable connected), yesterday's workout (if any), today's plan
        → Compose digest message
        → Send push notification via FCM
    → Log: digest sent timestamp per user
```

---

## 5. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | React | 19.x |
| Build tool | Vite | 6.x |
| Language | TypeScript | ~5.8 |
| Styling | Tailwind CSS | 4.x |
| Animation | Motion (framer-motion successor) | 12.x |
| Charts | Recharts + D3 | 3.9 / 7.9 |
| Icons | Lucide React | 0.546 |
| Server runtime | Express + tsx (dev) / esbuild (prod) | 4.21 / 4.21 / 0.25 |
| AI backend | @google/genai (Gemini) | 2.4 |
| Auth | Firebase Auth (Google SSO) | 12.15 |
| Database | Firebase Firestore | 12.15 |
| Deployment | Node.js server (self-hosted or serverless) | 18+ |
| Future: Push notifications | Firebase Cloud Messaging | — |
| Future: Payments | Stripe | — |
| Future: Mobile | React Native or PWA upgrade | — |

---

## 6. Security Model

- **Auth:** Firebase Google SSO; email verification required for write operations
- **Firestore rules:** Default-deny; per-user ownership checks; email verification required; validated schemas for each collection; immutable fields (createdAt, workout logs) protected; health data consent checked before wearable data read/write
- **API key:** Gemini API key held server-side only; never shipped to browser
- **Health data:** Consent flag gate at API level; Firestore rules enforce; data encrypted at rest by Firebase; not used for model training
- **Compliance:** All AI-generated workout content includes fitness disclaimer; medical queries get disclaimer + professional referral; GDPR/CCPA deletion pipeline via Firebase Admin SDK

See `firestore.rules` and `security_spec.md` for full security model.

---

## 7. Deployment Model

- **Development:** `npm run dev` → tsx server.ts (Vite middleware + Express)
- **Production build:** `npm run build` → vite build + esbuild server.ts bundle → `node dist/server.cjs`
- **Hosting options:** Self-hosted Node.js server, or deploy to a serverless platform (Vercel, AWS Lambda with adapter, Google Cloud Run)
- **Firebase:** Hosted in Firebase project `mythical-hour-zbndl`; Firestore database `ai-studio-polyverses-619398f7-7b6f-4bfd-a018-f7c56956dd81`

---

*Document version: 1.0 — Architecture for PolySync AI Fitness Coach.*
*Inherits PolyVerses orchestration patterns; replaces PM domain with fitness domain.*
