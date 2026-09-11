# PolySync — AI Fitness Coach

> **Product Requirements Document · v1.0 · 2026-09-11**

---

## 1. Executive Summary

**PolySync** is an AI-powered personal fitness coach that generates adaptive weekly workout plans, coaches users through every session, responds to natural-language questions, and adjusts recommendations in real time based on wearable biometric data and user feedback. Unlike static-plan apps, PolySync's multi-agent AI architecture means every recommendation is individually reasoned — the workout generator, recovery analyst, form coach, and nutrition advisor operate as specialist agents that hand off to each other, with a compliance gate ensuring safety at every step.

The market for AI-driven personalized fitness coaching is valued at **$6.2B in 2025**, projected to reach **$46.8B by 2034 at 25.1% CAGR** (MarketIntelo). The narrower agentic AI fitness coaching segment is **$3.8B in 2025 → $27.4B by 2034 at 24.5% CAGR** (ResearchIntelo). **340M+ people globally** already use AI-assisted fitness guidance. Yet **only 10% of consumers prefer AI over a human coach** (Les Mills 2026) — meaning the winning product is a hybrid: AI that handles the routine, with human-like coaching quality and the option for human connection at the premium tier.

PolySync targets the gap: an affordable ($12–15/mo), LLM-powered coach that adapts in real time, integrates with the wearables users already own, and provides the conversational depth of a human coach — all without the $100–150/mo price tag of Future or Caliber.

---

## 2. Problem Statement

| Problem | Current Alternatives | Pain |
|---|---|---|
| **Static workout plans** — most apps generate a plan once and rarely adapt | Fitbod, Caliber (basic tier) | Users plateau; plans don't respond to injury, fatigue, or schedule changes |
| **No real-time adaptation** — plans adjust weekly at best, not mid-workout or based on daily recovery | All mobile apps except Tonal (hardware-locked) | Users train hard on poor-recovery days or skip workouts because the plan feels too hard |
| **No conversational coach** — users can't ask "Can I do this with knee pain?" or "Why am I not progressing?" | Most apps have no chat; Freeletics Flo and iFIT Tailor are the only NL coaches | Users make mistakes, get injured, or quit because they have no one to ask |
| **Wearable data sits unused** — Apple Watch, Garmin, WHOOP, Oura, Strava data is siloed; apps don't aggregate or act on it | Each app integrates 1–2 devices at most | Rich biometric data (sleep, HRV, recovery) goes unused for coaching decisions |
| **Human coaches are expensive** — $100–150/mo for Future, Caliber premium | Future, Caliber | The majority of fitness consumers can't afford a real coach |
| **No motivation/sentiment awareness** — apps don't detect when a user is losing motivation or struggling | None | Dropoff rates are high; no proactive re-engagement |

---

## 3. Target Users

| Segment | Description | Size (est.) | Willingness to Pay |
|---|---|---|---|
| **Self-driven intermediates** | 25–45, own a wearable, work out 2–5x/week, want structure + coaching without a human | Largest segment | $10–20/mo |
| **Wearable owners seeking insight** | Apple Watch / Garmin / WHOOP / Oura users who track data but don't act on it | ~100M+ device owners globally | $8–15/mo |
| **GLP-1 users** | People on weight-loss medications needing strength-preserving, recovery-aware programming | Rapidly growing | $10–20/mo |
| **Return-to-fitness / injury-aware** | Users with minor injuries or returning after a break who need safe, adapted programming | Large underserved segment | $10–15/mo |
| **Premium hybrid seekers** | Users who want AI for daily coaching + optional human coach for form checks and accountability | Niche but high ARPU | $30–50/mo (AI + human add-on) |

**Out of scope for MVP:** Clinical rehabilitation (requires medical credentials), competitive athletes (needs sport-specific coaching depth), complete beginners who need in-person form instruction (use CV feature later).

---

## 4. Product Vision

A pocket-sized AI personal trainer that:
- **Knows you** — your goals, fitness level, injuries, equipment, schedule, and wearable data
- **Plans for you** — generates a weekly workout plan that's realistic, progressive, and safe
- **Coaches you in real time** — conversational AI that answers questions, gives form cues, adjusts on the fly
- **Adapts to your body** — uses sleep, HRV, resting heart rate, and workout history to suggest rest or intensity changes
- **Pays attention to your motivation** — notices when you're slipping and re-engages with the right tone
- **Costs less than a single group class** — $12–15/mo for the full experience

---

## 5. Core User Stories

### 5.1 Onboarding & Profile
- **US-1:** As a new user, I can sign up with Google and complete a fitness onboarding flow (goals, level, injuries, equipment, days/week, session duration) in under 2 minutes.
- **US-2:** As a user, I can edit my profile at any time and my future plans adapt to the changes.
- **US-3:** As a user with an injury, I can declare it in my profile and receive workouts that avoid or accommodate it.

### 5.2 Weekly Plan & Workout Execution
- **US-4:** As a user, I see my week's workouts laid out by day, with each day showing the workout name, focus, and exercise list.
- **US-5:** As a user, I tap a workout to start an active session where I log sets, reps, and weight for each exercise, with a built-in rest timer.
- **US-6:** As a user, I can skip, modify, or mark a workout as complete, and my plan adapts for the next week.
- **US-7:** As a user doing an exercise I can't perform (equipment missing, injury flare-up), I can request a substitution and get an alternative exercise targeting the same muscles.

### 5.3 Conversational Coach
- **US-8:** As a user, I can chat with my AI coach at any time — asking about form, nutrition, recovery, why I'm not progressing, or what to do on rest days.
- **US-9:** As a user, my coach knows my actual profile, recent workouts, and current plan, so advice is personalized, not generic.
- **US-10:** As a user with a medical condition or on GLP-1 medication, I can enable a special mode and receive programming and nutrition guidance appropriate to my situation.

### 5.4 Wearable Integration & Recovery
- **US-11:** As a user with an Apple Watch, I can connect Apple HealthKit and my coach uses my sleep, resting heart rate, and activity data.
- **US-12:** As a user with a Garmin/WHOOP/Oura/Strava account, I can connect it and the same recovery insights apply.
- **US-13:** As a user, I see a daily morning digest (push notification or in-app) summarizing my sleep, yesterday's workout, and today's plan.
- **US-14:** As a user, if my recovery is low, my coach suggests a lighter workout or rest day and explains why.

### 5.5 Progress & Motivation
- **US-15:** As a user, I see progress charts: strength trends per exercise, workout frequency, volume over time, and body weight trend (if I log it).
- **US-16:** As a user, I earn streaks and consistency scores that motivate me to keep going.
- **US-17:** As a user whose check-ins show declining motivation, I receive a supportive re-engagement message rather than a generic "you're slacking" nudge.

### 5.6 Privacy & Compliance
- **US-18:** As a user, I must explicitly consent to health data processing before any wearable data is used.
- **US-19:** As a user, I can export my data or request deletion at any time (GDPR/CCPA).
- **US-20:** As a user, I see a clear disclaimer that the AI coach provides fitness guidance, not medical advice, and I should consult a professional for injuries or medical conditions.

### 5.7 Monetization
- **US-21:** As a free user, I can create a profile, get a basic weekly plan, log workouts, and use limited chat.
- **US-22:** As a premium user ($12–15/mo), I get full adaptive plans, unlimited chat, wearable integration, daily digests, motivation coaching, and progress analytics.
- **US-23:** As an elite user ($20–30/mo), I get all premium features plus multi-wearable aggregation, sentiment coaching, GLP-1 mode, and priority support.

---

## 6. Agent Architecture

PolySync uses a **12-agent specialist mesh**, inheriting the orchestration pattern from PolyVerses' 23-agent PM workbench but refocused on fitness domain logic.

### 6.1 Agent Roster

| ID | Agent | Priority | Role | Responsibility | Gemini Route |
|---|---|---|---|---|---|
| F00 | **Orchestrator Router** | High | Master Coordinator | Routes user requests to correct agents; manages multi-agent workflows; idempotency; circuit breaker on repeated failures | Standard |
| F01 | **Profile Agent** | High | Onboarding & Profile Manager | Validates fitness profile; detects contradictions (e.g., "advanced" + "can't do pushups"); suggests clarifications; structures profile for downstream agents | Standard |
| F02 | **Workout Generator Agent** | High | Plan Architect | Generates weekly workout plan from profile + exercise library; applies periodization basics; selects exercises, sets, reps, rest, RPE; ensures equipment match and injury constraints | Reasoning |
| F03 | **Exercise Library Agent** | Medium | Knowledge Base | Serves exercise metadata; handles substitution queries; provides form cues and common mistakes per exercise; looks up by muscle group, equipment, difficulty | Standard (mostly lookup) |
| F04 | **Recovery Analyst Agent** | High | Biometric Interpreter | Ingests wearable data (sleep, HRV, RHR, steps) + workout frequency → recovery score 0–100; recommends rest / normal / reduced intensity with reasoning | Reasoning |
| F05 | **Plan Adaptor Agent** | Medium | Adaptive Engine | Adjusts next week's plan based on: completed vs. skipped workouts, recovery score, user feedback, progressive overload rules | Reasoning |
| F06 | **Coaching Chat Agent** | High | Conversational Coach | Answers questions about workouts, form, nutrition, recovery, motivation; has a supportive coach persona; references user's actual data; flags unsafe questions to Compliance Gate | Reasoning (highest quality) |
| F07 | **Form Coach Agent** | Medium | Form Guidance | Given exercise name + user description of how it felt → provides form cues, common mistakes, cue words; if CV available, compares pose to ideal | Standard |
| F08 | **Nutrition Advisor Agent** | Medium | Nutrition Coach | Estimates calorie/macro targets based on profile + goal + activity; answers nutrition questions; suggests meal ideas; respects dietary preferences; flags medical nutrition questions to disclaimer | Standard |
| F09 | **Motivation Coach Agent** | Low | Sentiment & Engagement | Analyzes user check-ins and chat tone; detects dropout risk; adjusts messaging tone; generates motivational messages; triggers re-engagement nudges | Standard + light sentiment |
| F10 | **Data Ingest Agent** | Medium | Wearable Data Pipeline | Normalizes data from Apple HealthKit, Google Fit, Strava, Garmin, WHOOP, Oura into common schema; handles missing data; forwards to Recovery Analyst | Rule-based + light Gemini |
| F11 | **Compliance Gate Agent** | High | Safety & Legal | Checks workout recommendations for injury-risk contradictions; enforces disclaimers; blocks medical advice; ensures health data consent before processing wearable data | Reasoning (safety-critical) |

### 6.2 Agent Interaction Topology

```
User Request
    │
    ▼
[F00: Orchestrator Router] ──→ determines which agent(s) to invoke
    │
    ├────────────────────────────────────────────────────────────┐
    │                                                             │
    ▼                                                             │
[F01: Profile Agent] ──→ validates/suggests profile           │
    │                                                            │
    ▼                                                            │
[F02: Workout Generator] ──→ generates weekly plan            │
    │                    │                                       │
    │                    ▼                                       │
    │              [F11: Compliance Gate] ←── checks safety     │
    │                    │                                       │
    │                    ▼                                       │
    │              [F05: Plan Adaptor] ←── adjusts for recovery│
    │                    ▲                                       │
    │                    │                                       │
    └────────────────────┼───────────────────────────────────────┘
                         │
                         ▼
                   [F04: Recovery Analyst] ←── [F10: Data Ingest]
                         │                          ▲
                         │                          │
                         ▼                          │
              User sees recovery        Apple HealthKit / Google Fit /
              score + recommendation    Strava / Garmin / WHOOP / Oura
                                        │
                                        ▼
                                 [F03: Exercise Library]
                                         ▲
                                         │
                    [F07: Form Coach] ────┘
                         │
                         ▼
                    [F06: Coaching Chat] ←──→ [F09: Motivation Coach]
                         │                          ▲
                         │                          │
                         └──────┬───────────────────┘
                               │
                               ▼
                         [F08: Nutrition Advisor]
```

### 6.3 Server API Routes

| Method | Endpoint | Agent | Description |
|---|---|---|---|
| POST | `/api/fitness/profile` | F01 | Save/update user fitness profile |
| GET | `/api/fitness/profile` | F01 | Get current user profile |
| POST | `/api/fitness/generate-plan` | F02 | Generate weekly workout plan |
| GET | `/api/fitness/plan` | F02 | Get current week's plan |
| POST | `/api/fitness/log-workout` | F05 | Save completed workout; trigger adaptation |
| POST | `/api/fitness/adapt-plan` | F05 | Manually trigger plan adaptation |
| POST | `/api/fitness/chat` | F06 | Send message to coaching chat; get response |
| POST | `/api/fitness/recovery` | F04 | Compute recovery score + recommendation |
| POST | `/api/fitness/nutrition` | F08 | Get nutrition guidance for query |
| POST | `/api/fitness/form-cue` | F07 | Get form cues for exercise |
| POST | `/api/fitness/substitute` | F03 | Find exercise substitution |
| POST | `/api/fitness/checkin` | F09 | Submit daily check-in (energy, mood, pain, motivation) |
| POST | `/api/fitness/webhook/healthkit` | F10 | Apple HealthKit callback |
| POST | `/api/fitness/webhook/googlefit` | F10 | Google Fit callback |
| GET | `/api/fitness/progress` | — | Aggregated progress data (charts) |
| POST | `/api/fitness/consent` | F11 | Set health data consent flag |

All routes use **server-side Gemini 3.5 Flash** with agent-specific `systemInstruction`; fallback to sandbox generator if API key is missing.

---

## 7. Data Model

### 7.1 Firestore Collections

```
users/{userId}/
  profile/
    goal: "strength" | "hypertrophy" | "endurance" | "weight_loss" | "general_fitness"
    fitnessLevel: "beginner" | "intermediate" | "advanced"
    injuries: string[]            // e.g. ["left knee pain", "lower back discomfort"]
    equipment: string[]           // e.g. ["dumbbells", "barbell", "pull-up bar", "none"]
    daysPerWeek: number           // 1–7
    sessionDuration: number       // minutes, 15–90
    primaryFocus: string
    weight?: number               // kg/lb, optional
    height?: number
    age?: number
    gender?: string
    healthDataConsent: boolean    // REQUIRED before wearable data processing
    specialMode?: "none" | "glp1" | "postpartum" | "injury_rehab"
    createdAt: timestamp
    updatedAt: timestamp

  workouts/
    {workoutId}/
      date: timestamp
      planId: string
      exercises: [
        {
          exerciseId: string
          name: string
          sets: [{ reps: number, weight: number, rpe?: number, completed: boolean }]
          status: "completed" | "skipped" | "modified"
        }
      ]
      duration: number            // minutes
      overallRpe: number
      notes: string
      createdFromPlanId: string

  plans/
    {planId}/
      weekNumber: number
      startDate: timestamp
      days: [
        {
          day: number
          date: timestamp
          workouts: [
            {
              workoutName: string
              focus: string
              exercises: [
                { exerciseId: string, name: string, sets: number, reps: string, restSeconds: number, rpeTarget: number }
              ]
            }
          ]
          recoveryRecommendation?: "train" | "reduce" | "rest"
        }
      ]
      version: number             // for adaptation history

  wearableData/
    {source}/                     // "healthkit" | "googlefit" | "strava" | "garmin" | "whoop" | "oura"
      {timestamp}/
        steps?: number
        activeCalories?: number
        sleepDuration?: number
        sleepStages?: { deep: number, light: number, rem: number, awake: number }
        restingHeartRate?: number
        hrv?: number              // ms
        workoutSessions?: [...]

  chatSessions/
    {sessionId}/
      messages: [{ role: "user" | "assistant" | "system", content: string, timestamp: timestamp }]
      context: { workoutId?: string, planId?: string, profileSnapshot?: map }

  checkIns/
    {checkInId}/
      date: timestamp
      workoutId?: string
      energyLevel: number         // 1–10
      mood: string
      painOrIssues: string
      sleepQuality: number        // 1–10
      motivationLevel: number     // 1–10

  subscriptions/
    {subscriptionId}/
      tier: "free" | "premium" | "elite"
      stripeCustomerId: string
      stripeSubscriptionId: string
      status: "active" | "canceled" | "past_due"
      currentPeriodEnd: timestamp
```

---

## 8. UI Surface Map

| Screen / View | Description | Tab |
|---|---|---|
| **Onboarding Flow** | Google SSO → fitness profile (goals, level, injuries, equipment, days, duration, focus, optional weight/height/age/gender, health data consent, special mode) → complete | Pre-login |
| **Today's Workout** | If a workout is scheduled for today: show exercises with set logging, rest timer, complete/skip/modify. If no workout: show recovery score + recommendation + option to do a suggested workout | Primary (home) |
| **Weekly Plan** | 7-day grid view; each day expandable to show workout; tap to start; shows recovery recommendation per day | Tab 1 |
| **Progress Dashboard** | Strength trends (per exercise, bar/line chart), workout frequency (calendar heatmap), volume trends, body weight log | Tab 2 |
| **Coach Chat** | Conversation UI with AI coach; quick-action buttons for common queries ("What should I eat?", "My knee hurts", "Why am I stuck?"); context-aware | Tab 3 |
| **Settings** | Profile edit, wearable connections (HealthKit, Google Fit, Strava, Garmin, WHOOP, Oura), notification preferences, data export/delete, subscription management, disclaimer acknowledgment | Tab 4 |
| **Wearable Data View** | Simple dashboards for each connected wearable: sleep trends, HRV trend, resting HR trend, steps/active calories | Settings sub-view |
| **Admin/Observability** | (Premium tier / internal) Coaching quality metrics, agent performance heatmap, user engagement funnel, retention cohorts, API cost tracking | Hidden/debug |

---

## 9. Success Metrics (Launch Targets)

| Metric | Target | Measurement |
|---|---|---|
| **Onboarding completion rate** | > 70% of sign-ups reach profile complete | Funnel: sign-up → steps completed → profile saved |
| **First workout completion** | > 50% of onboarded users complete their first workout within 48 hours | Event: workout logged within 48h of sign-up |
| **7-day retention** | > 40% | Users who log ≥ 1 workout in day 7 |
| **30-day retention** | > 20% | Users who log ≥ 1 workout in day 30 |
| **Workout completion rate** | > 60% of scheduled workouts completed | Completed / (completed + skipped) |
| **Chat engagement** | > 30% of active users send ≥ 1 chat message per week | Chat session count |
| **Plan adaptation adoption** | > 80% of users have ≥ 1 plan adaptation within first 3 weeks | Adaptation events per user |
| **Wearable connection rate** | > 40% of premium users connect ≥ 1 wearable | Wearable data writes per user |
| **Daily digest open rate** | > 50% | Push notification open rate |
| **AI response quality** | < 2% of chat responses flagged as unhelpful or unsafe | User thumbs-down + Compliance Gate escalations |

---

## 10. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Latency** | Chat responses < 3 seconds; plan generation < 5 seconds; recovery score < 1 second (cached) |
| **Availability** | 99.5% uptime for core coaching features during peak hours (6am–10pm local) |
| **Privacy** | Health data consent gate enforced at API level; wearable data encrypted at rest (Firebase); GDPR/CCPA deletion pipeline; no health data used for model training |
| **Safety** | Compliance Gate rejects workout recommendations that contradict declared injuries; medical advice queries get disclaimer response; all workout plans include "consult a professional" footer |
| **Scalability** | Server-side Gemini calls are stateless; Firestore scales automatically; exercise library is static data (served from CDN or bundled); wearable webhooks are idempotent |
| **Mobile** | Responsive web app (PWA-capable) with mobile-first UX; push notifications via FCM; offline workout logging queued for sync when online |
| **Cost** | Gemini 3.5 Flash for standard agents; Gemini 3.5 Pro / Flash Thinking for coaching chat and workout generation; target < $0.05 per active user per day at scale |

---

## 11. Out of Scope (for MVP / Phase 1–2)

- Computer vision form analysis (Phase 5)
- AR form overlay (Phase 5)
- Human coach marketplace (Phase 5)
- B2B / enterprise dashboard (Phase 5)
- Native iOS/Android app (PWA-first; native later if traction)
- Social features (friends, leaderboards, challenges)
- Continuous glucose monitor integration
- Advanced periodization models (block periodization, peaking for events) — basic progressive overload is sufficient for MVP
- Custom workout builder (user-assembled workouts) — adaptation covers this need for MVP
- Nutrition tracking with food logging — calorie/macro targets + suggestions are in; food diary is out

---

## 12. Open Questions

| # | Question | Decision Needed By |
|---|---|---|
| OQ-1 | Full pivot of PolyVerses → PolySync, or new tab/module alongside PM workbench? | Now |
| OQ-2 | Apple HealthKit on web: use HealthKit JS API (Safari-only) or wait for native mobile app? | Before Phase 2 |
| OQ-3 | Push notification provider: Firebase Cloud Messaging (web) only, or also APNs via a service like OneSignal? | Before Phase 3 |
| OQ-4 | Subscription billing: Stripe directly or a merchant-of-record like Lemon Squeezy for global tax handling? | Before Phase 4 |
| OQ-5 | Exercise library source: build from scratch, scrape a public dataset (e.g., ExerciseDB API), or use a licensed database? | Before Phase 1 |
| OQ-6 | Gemini model tier: Flash only for cost, or Flash + Pro routing for coaching quality? | Before launch |

---

*Document version: 1.0 — Initial PRD based on market research and PolyVerses architecture assessment.*
*Next review: after Phase 1 MVP build complete.*
