# PolySync — AI Fitness Coach

> **Agentic AI Fitness Coaching Platform · Multi-Agent Orchestration · Adaptive Workout Plans · Conversational Coach · Wearable Integration**

![PolySync AI Fitness Coach](docs/screenshot.png)

*Entry portal. The orchestration console, agent network diagram, and observability dashboard sit behind SSO.*

---

## What It Is

**PolySync** is an AI-powered personal fitness coach that generates **adaptive weekly workout plans**, coaches users through every session via **natural-language chat**, and adjusts recommendations in **real time** based on wearable biometric data and user feedback.

Unlike static-plan apps (Fitbod, Caliber basic), PolySync's **12-agent specialist AI mesh** means every recommendation is individually reasoned:
- **Workout Generator Agent** builds your weekly plan from your profile + exercise library
- **Recovery Analyst Agent** computes your daily recovery score from sleep, HRV, resting heart rate, and workout frequency
- **Coaching Chat Agent** answers your questions with full context of your actual data
- **Plan Adaptor Agent** adjusts next week's plan based on what you completed, skipped, and how you felt
- **Compliance Gate Agent** ensures every recommendation is safe for your declared injuries

The Gemini API key is held **server-side** (`server.ts`) and the client calls the app's own endpoints — the key is never shipped to the browser.

Firestore access is governed by [`firestore.rules`](firestore.rules): default-deny, ownership checks, email verification, per-field validation, health data consent gating, and immutability constraints on sensitive fields. See [`security_spec.md`](security_spec.md) for the model.

---

## Core Surfaces

| Component | What It Does |
|---|---|
| **Fitness Onboarding** | Google SSO → fitness profile capture (goals, level, injuries, equipment, days/week, session duration, health consent, special mode) |
| **Today's Workout** | Active workout session with set logging, rest timer, complete/skip/modify, exercise substitution |
| **Weekly Plan** | 7-day grid view of generated workouts with recovery recommendations per day |
| **Coach Chat** | Conversational AI fitness coach with full context of your profile, recent workouts, current plan, and recovery data |
| **Progress Dashboard** | Strength trends, workout frequency, volume trends, body weight log (D3 / Recharts) |
| **Wearable Integration** | Apple HealthKit, Google Fit — sleep, HRV, resting heart rate, steps → recovery insights |
| **Daily Digest** | Morning push notification with sleep summary, yesterday's workout, today's plan, motivation tip |
| **Check-ins** | Post-workout energy/mood/pain/motivation tracking → dropout risk detection → sentiment-aware re-engagement |
| **Observability Dashboard** | Agent telemetry heatmap, coaching quality metrics, user engagement funnel, retention cohorts, API cost tracking |
| **Agent Network Diagram** | D3 force graph visualizing how 12 fitness agents hand off to each other |
| **Prompt Console** | Browse and copy the 12 fitness agent system prompts (F01–F11 + Orchestrator) |

---

## Architecture

The app uses a **12-agent specialist mesh** inheriting the orchestration pattern from PolyVerses' 23-agent PM workbench:

```
User Request → [F00: Orchestrator Router]
    ├── [F01: Profile Agent] — validates/suggests profile
    ├── [F02: Workout Generator] → [F11: Compliance Gate] → [F05: Plan Adaptor]
    ├── [F04: Recovery Analyst] ← [F10: Data Ingest] ← HealthKit / Google Fit / Strava / Garmin / WHOOP / Oura
    ├── [F06: Coaching Chat] ←→ [F09: Motivation Coach] ←→ [F08: Nutrition Advisor]
    └── [F03: Exercise Library] ←→ [F07: Form Coach] (text-based form cues)
```

**Tech Stack:** React 19 · Vite 6 · TypeScript · Tailwind CSS 4 · Motion · D3 · Recharts · Express · Firebase Auth + Firestore · Gemini 3.5 Flash (server-side)

---

## Run Locally

**Prerequisites:** Node.js 18+

```bash
npm install
cp .env.example .env.local     # add your GEMINI_API_KEY
npm run dev
```

Open `http://localhost:3000` and sign in with Google. Complete the fitness onboarding to generate your first adaptive workout plan.

---

## Status

**Phase 0 — Foundation:** Architecture, PRD, Impact Analysis, Gap Analysis, and Feature Roadmap are complete. Exercise library (200+ exercises) is built into `src/AthenaCodeStore.ts`. Firestore rules updated for fitness data model. Codebase refactored from PM workbench to fitness coaching platform.

**Phase 1 — Core Coaching Loop (next):** Fitness onboarding UI, Workout Generator Agent, weekly plan view, active workout session UI, workout logging, plan adaptation.

**Known refactor:** `OrchestrationConsole.tsx` is ~2,000 lines and should be decomposed into separate workflow components.

---

## Documentation

| Document | Description |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Full Product Requirements Document — market analysis, user stories, agent architecture, data model, success metrics |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System architecture, agent details (F00–F11), data flow diagrams, technology stack, security model |
| [`docs/IMPACT_ANALYSIS.md`](docs/IMPACT_ANALYSIS.md) | RICE-based feature prioritization matrix, critical path, build sequence, risk assessment |
| [`docs/GAP_ANALYSIS.md`](docs/GAP_ANALYSIS.md) | What PolyVerses provides (reusable) vs. what must be built from scratch for PolySync |
| [`docs/FEATURES_ROADMAP.md`](docs/FEATURES_ROADMAP.md) | Complete feature inventory with status (Done / Not Started / Planned / Future) and phased roadmap |

---

## Agent Roster

| ID | Agent | Role | Priority |
|---|---|---|---|
| F00 | Orchestrator Router | Master Coordinator | High |
| F01 | Profile Agent | Onboarding & Profile Manager | High |
| F02 | Workout Generator | Plan Architect | High |
| F03 | Exercise Library | Knowledge Base | Medium |
| F04 | Recovery Analyst | Biometric Interpreter | High |
| F05 | Plan Adaptor | Adaptive Engine | Medium |
| F06 | Coaching Chat | Conversational Coach | High |
| F07 | Form Coach | Form Guidance | Medium |
| F08 | Nutrition Advisor | Nutrition Coach | Medium |
| F09 | Motivation Coach | Sentiment & Engagement | Low |
| F10 | Data Ingest | Wearable Data Pipeline | Medium |
| F11 | Compliance Gate | Safety & Legal | High |

---

## License

MIT
