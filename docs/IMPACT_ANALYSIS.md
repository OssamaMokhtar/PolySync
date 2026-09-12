# PolySync — Impact Analysis & Prioritization

> **AI Fitness Coach · Feature Prioritization via RICE + Dependency Mapping · v1.0 · 2026-09-11**

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

### 2.1 Phase 0 — Foundation (Enablers; not user-facing) — **COMPLETED**

| # | Feature | Reach | Impact | Conf. | Effort (pw) | RICE | Priority | Dependency | Status |
|---|---|---|---|---|---|---|---|---|---|
| 0.6 | Exercise Library data file (101 exercises) | 5 | 3 | 95% | 0.5 | **9.50** | 🔴 P0 | None — standalone data file | ✅ DONE |
| 0.7 | Firestore data model + security rules (fitness collections + consent gate) | 5 | 3 | 95% | 0.5 | **9.50** | 🔴 P0 | None; blocks 1.1–1.7 | ✅ DONE |
| 0.8 | types.ts update with fitness types | 5 | 2 | 100% | 0.5 | **10.0** | 🔴 P0 | None; blocks 0.9, 1.1 | ✅ DONE |
| 0.9 | server.ts: fitness API routes + agent system prompts | 5 | 3 | 90% | 2 | **6.75** | 🔴 P0 | 0.6, 0.7, 0.8 | 🔴 NOT STARTED |
| 0.10 | AthenaCodeStore.ts: fitness agent code samples | 3 | 1 | 80% | 0.5 | **4.80** | 🟡 P1 | 0.9 (code samples reference agent logic) | 🔴 NOT STARTED |
| 0.11 | metadata.json + package.json description update | 5 | 1 | 100% | 0.1 | **50.0** | 🔴 P0 | None; documentation only | 🔴 NOT STARTED |
| 0.12 | CI/CD deploy.yml | 5 | 2 | 80% | 1 | **8.00** | 🟡 P1 | Required before any production deploy | 🔴 NOT STARTED |

**Note:** Phase 0 items are enablers — they have high RICE because they're low-effort and block everything else, not because they're user-facing features. Items 0.6–0.8 are complete; 0.9 is the critical next step.

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

## 3. Prioritized Build Order (Critical Path)

```
PHASE 0 — FOUNDATION (Week 1–2) — PARTIALLY COMPLETE
├── 0.11 metadata.json + package.json description update [15 min] 🔴
├── 0.6 ExerciseLibrary.ts (101 exercises) [done] ✅
├── 0.8 types.ts + fitness types [done] ✅
├── 0.7 Firestore rules update (fitness collections + consent gate) [done] ✅
├── 0.9 server.ts fitness API routes + agent system prompts [4–6 hours] 🔴 NEXT
├── 0.10 AthenaCodeStore.ts fitness agent samples [1 hour] 🔴
├── 0.1 README.md fitness pivot [done] ✅
├── 0.2 PRD.md [done] ✅
├── 0.3 ARCHITECTURE.md [done] ✅
├── 0.4 FEATURES_ROADMAP.md [done] ✅
├── 0.5 GAP_ANALYSIS.md [done] ✅
├── 0.6 IMPACT_ANALYSIS.md [done] ✅
└── 0.12 CI/CD deploy.yml [2–3 hours] 🔴
    → COMMIT + PUSH (Phase 0 complete milestone)

PHASE 1 — CORE COACHING LOOP (Week 3–5) — NOT STARTED
├── 1.1 FitnessOnboarding.tsx (profile capture UI) [3–4 hours]
├── 1.2 F02 Workout Generator Agent logic + /api/fitness/generate-plan [3–4 hours]
├── 1.3 WeeklyPlanView.tsx (7-day grid) [2–3 hours]
├── 1.4 WorkoutSession.tsx (active workout + set logging + rest timer) [4–6 hours]
├── 1.5 POST /api/fitness/log-workout + Firestore save [1–2 hours]
├── 1.6 F05 Plan Adaptor Agent + adaptation logic [3–4 hours]
└── 1.7 ProgressDashboard.tsx (strength trends, frequency) [2–3 hours]
    → MVP COMPLETE (user can onboard → get plan → do workout → see adaptation)
    → COMMIT + PUSH (Phase 1 milestone)

PHASE 2 — COACH + WEARABLES (Week 6–8) — NOT STARTED
├── 2.4 F04 Recovery Analyst Agent + /api/fitness/recovery [2–3 hours]
├── 2.5 Recovery-based plan adjustment (F05 integration) [1–2 hours]
├── 2.1 F06 Coaching Chat Agent + /api/fitness/chat + CoachingChat.tsx [5–7 hours]
├── 2.2 Apple HealthKit integration (web) [3–4 hours]
├── 2.3 Google Fit integration (web) [2–3 hours]
├── 2.6 Wearable data view dashboards [2–3 hours]
└── 2.7 Strava/Garmin/WHOOP/Oura (as resources allow) [2–4 hours each]
    → COMMIT + PUSH (Phase 2 milestone)

PHASE 3 — ENGAGEMENT (Week 9–11) — NOT STARTED
├── 3.3 Check-in flow UI + /api/fitness/checkin [2–3 hours]
├── 3.2 F09 Motivation Coach Agent + sentiment logic [2–3 hours]
├── 3.1 Push notifications (FCM) + daily digest scheduler [4–6 hours]
├── 3.4 Streaks & consistency tracking [1–2 hours]
└── 3.5 NUX funnel analytics [1–2 hours]
    → COMMIT + PUSH (Phase 3 milestone)

PHASE 4 — MONETIZATION (Week 12–14) — NOT STARTED
├── 4.1 Stripe integration + tier gating [4–6 hours]
├── 4.2 F08 Nutrition Advisor Agent + /api/fitness/nutrition [2–3 hours]
├── 4.4 Exercise substitution engine [1–2 hours]
├── 4.3 GLP-1 / special mode programming [2–3 hours]
└── 4.5 Text-based form coaching (F07 integration) [1–2 hours]
    → COMMIT + PUSH (Phase 4 milestone)

PHASE 5 — ADVANCED (3–6 months out) — NOT STARTED
├── 5.1 Mobile app (React Native or PWA upgrade)
├── 5.2 CV form analysis (TensorFlow.js / MediaPipe)
├── 5.3 Coach marketplace (Stripe Connect)
└── 5.4 B2B dashboard
```

**Total estimated effort to MVP (Phase 1 complete): ~18–25 person-days**
**Total estimated effort to Phase 4 (monetized): ~30–40 person-days**
**Phase 0 remaining: ~10–12 hours**

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

## 5. Summary — What to Build First

| Priority | Features | Why |
|---|---|---|
| **P0 (MVP spine)** | 0.9, 0.11, 0.12, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6 | Without these, there is no product. A user cannot onboard, get a plan, do a workout, or see adaptation. Foundation data + types are done; domain logic + UI remain. |
| **P1 (Differentiators + Engagement)** | 2.1, 2.4, 2.5, 3.1, 3.2, 3.3, 4.1, 4.4, 0.10 | Chat coach + recovery analysis are the competitive moat. Notifications + check-ins drive retention. Stripe unlocks revenue. |
| **P2 (Premium features + Polish)** | 1.7, 2.2, 2.3, 2.6, 3.4, 3.5, 4.2, 4.3, 4.5 | Progress dashboards, wearable integrations, nutrition advice, form coaching — valuable but build after core + differentiators are solid. |
| **P3 (Future / Nice-to-have)** | 2.7, 5.x | Additional wearable sources, CV form analysis, human coach marketplace, B2B — wait for traction before investing. |

---

*Document version: 1.0 — RICE-based impact analysis and prioritized build sequence for PolySync.*
*All RICE scores are estimates based on market research (see PRD Section 1) and PolyVerses architecture reuse assessment.*
*Updated: 2026-09-11 — reflects Phase 0 foundation completion (exercise library, types, Firestore rules)*
