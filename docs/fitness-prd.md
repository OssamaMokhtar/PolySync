# PolyVerses AI Fitness Coach — Product Requirements Document

**Version:** 1.0  
**Status:** Draft  
**Owner:** Product  
**Last updated:** 2026-09-11  

---

## 1. Executive Summary

PolyVerses is being repurposed from a multi-agent product management workbench into an **AI Fitness Coach Platform** — a 12-agent orchestration system that generates adaptive weekly workout plans, coaches users through sessions via natural language, ingests wearable data for recovery-based plan adjustments, and provides a full workout logging + progress tracking experience.

**Why now:**
- The AI-driven personalized fitness coaching market is valued at **$6.2B in 2025**, growing at **25.1% CAGR** to $46.8B by 2034 (MarketIntelo).
- 340M+ people globally use AI-assisted fitness guidance; projected to surpass 1.1B by 2034.
- Only 10% of consumers prefer AI-only coaching over human coaches (Les Mills 2026) — the human-in-the-loop / mid-tier hybrid model ($12–30/mo) is the open opportunity.
- No major player offers true real-time biometric adaptation, sentiment-aware coaching tone, or LLM-powered conversational form guidance — all differentiators PolyVerses can ship.

**Value proposition:** A coach-quality adaptive fitness platform at $12–15/mo (Premium tier) that uses a multi-agent AI mesh — not a single chat prompt — to generate, adapt, and explain every coaching decision, with full observability into which agent produced what and why.

---

## 2. Target Users

| Segment | Description | Tier |
|---|---|---|
| **Beginner lifters** | New to structured training, need guidance on form, exercise selection, progressive overload | Free + Premium |
| **Intermediate trainees** | Have experience but lack a coherent plan; want adaptation based on recovery and progress | Premium |
| **Home gym / limited equipment users** | Train with dumbbells, bands, bodyweight; need substitution logic | Free + Premium |
| **Wearable owners** | Apple Watch, Garmin, WHOOP, Oura users who want their data to actually drive coaching decisions | Premium + Elite |
| **GLP-1 users / special populations** | Need adjusted programming (strength preservation, slower progression, nutrition emphasis) | Elite |
| **Coaches / personal trainers** | Use PolyVerses as a tool to generate plans and track clients (future B2B) | Future |

---

## 3. Success Metrics

| Metric | Target | Timeline |
|---|---|---|
| Sign-up → onboarding complete | > 70% | Launch |
| Onboarding complete → first workout logged | > 50% | Launch |
| 7-day retention (signed up → still active) | > 35% | Launch + 1 month |
| 30-day retention | > 20% | Launch + 2 months |
| Workout completion rate (planned → logged) | > 60% | Ongoing |
| Chat session adoption (% of active users who chat in a week) | > 40% | Launch + 1 month |
| Average sessions per active user per week | > 3 | Ongoing |
| Premium conversion (free → paid) | > 5% | Launch + 3 months |
| Net Promoter Score (post-workout survey) | > 40 | Ongoing |

---

## 4. Core Features — Detailed Specification

### 4.1 User Onboarding & Profiling (F1)

**Purpose:** Capture everything needed to generate a safe, appropriate first workout plan.

**Flow:**
1. Welcome screen — product explanation, what PolyVerses does
2. Goal selection — single-select: Strength, Hypertrophy, Endurance, Weight Loss, General Fitness, Sport-Specific
3. Fitness level — beginner / intermediate / advanced (with brief descriptions for each)
4. Injuries & limitations — free text field + hint: "e.g. left knee pain, lower back tightness, shoulder impingement"
5. Available equipment — multi-select: Barbell, Dumbbells, Kettlebell, Pull-up bar, Resistance bands, Bench, Box/Step, Treadmill, Stationary bike, Rowing machine, None (bodyweight only)
6. Days per week — slider 1–7
7. Session duration — slider 15–90 minutes
8. Optional biometrics — weight, height, age, gender (all optional, marked as such)
9. Health data consent — explicit checkbox: "I consent to PolyVerses reading my wearable data (Apple Health, Google Fit) to adapt my workouts to my recovery. I can revoke this at any time." — required before wearable features unlock
10. Disclaimer acceptance — explicit checkbox: "I understand that PolyVerses provides AI-generated fitness guidance and is not a substitute for professional medical or training advice. I will consult a physician before starting any new exercise program." — required before first workout is generated
11. Review & confirm — summary of profile, edit any field, confirm

**Profile stored as:** `users/{uid}/profile/main` — see `firestore.rules` and `types.ts` (FitnessProfile)

**Edge cases:**
- Contradictory profile (e.g. "advanced" + "can't do pushups") — flag to user inline, suggest clarification
- No equipment selected — default to bodyweight + bands; show message "Bodyweight focus — great for travel and home workouts"
- Age < 18 — show enhanced disclaimer, require parental consent note (future)

---

### 4.2 Exercise Library (F3, F03)

**Purpose:** The foundational data asset for all workout generation, substitution, and form coaching.

**Contents:** 101 exercises (initial release) across 7 categories:
- **Strength (49):** Barbell compounds, dumbbell compounds, bodyweight, machines
- **Mobility (17):** Stretches, yoga poses, joint mobility drills
- **Core (13):** Planks, dead bugs, crunches, anti-rotation
- **Hypertrophy (11):** Isolation movements, flys, raises
- **Cardio (5):** Jump rope, high knees, jogging, mountain climbers
- **Plyometric (5):** Jump squats, box jumps, burpees, broad jumps
- **Endurance (1):** Wall sit

Each exercise has: id, name, category, primary muscles, secondary muscles, equipment required, difficulty (beginner/intermediate/advanced), full written instructions, common mistakes list, substitution IDs, video reference URL, gender-neutral flag.

**Helpful exports:**
- `EXERCISE_BY_ID` — O(1) lookup
- `EXERCISES_BY_CATEGORY` — category browsing
- `EXERCISES_BY_MUSCLE` — muscle-targeted selection
- `EXERCISES_BY_EQUIPMENT` — equipment-filtered lists
- `searchExercises(query)` — text search across name, muscles, category, equipment
- `getSubstitutes(exerciseId)` — returns substitute exercise objects
- `getExercisesByEquipment(availableEquipment)` — all exercises the user can do

**Substitution logic:** Each exercise lists up to 3 substitute IDs. Substitutes must use subset or equal equipment. The Workout Generator Agent uses substitutes when the user's equipment doesn't match an exercise, or when an exercise conflicts with a listed injury.

**Future expansion:** Computer vision form references (video clips), muscle activation diagrams, progression/regressions ladder (easier → harder variations).

---

### 4.3 Workout Generator Agent (F2, F02)

**Purpose:** Generate a 7-day adaptive workout plan from the user's profile and exercise library.

**Inputs:**
- FitnessProfile (goals, level, injuries, equipment, days/week, session duration)
- ExerciseLibrary (filtered to user's available equipment)
- Optional: recoveryScore (from F04), adaptationSourcePlanId (for subsequent weeks)

**Process (agent workflow):**

1. **F01 Profile Agent** validates profile, flags contradictions, normalizes equipment list, maps goal → training emphasis (strength = lower reps/higher weight, hypertrophy = 8–12 reps, endurance = higher reps/lower weight, weight loss = mix + calorie context, general = balanced)

2. **F02 Workout Generator Agent** constructs the week:
   - Determine training split based on days/week:
     - 1–2 days: Full body each session
     - 3 days: Full body A/B/C rotation or Upper/Lower/Full
     - 4 days: Upper/Lower split (2x each)
     - 5 days: Push/Pull/Legs/Upper/Lower or Body part split
     - 6–7 days: Body part split with active recovery
   - For each day:
     - Select 1–3 focus areas based on split
     - Pick compound primary exercises (1–3 per movement pattern)
     - Add accessory/isolation exercises to fill remaining time
     - Select warmup exercises (2–3, low intensity, movement prep)
     - Select cooldown/stretch exercises (2–3, target muscles used)
     - Calculate sets/reps/RPE based on goal and level:
       - Beginner: 2–3 sets, 8–12 reps, RPE 5–7, more rest
       - Intermediate: 3–4 sets, 6–12 reps, RPE 6–8
       - Advanced: 3–5 sets, 3–12 reps, RPE 7–9, periodized
     - Ensure total estimated time fits sessionDuration (allow 5 min warmup + 5 min cooldown buffer)
     - Exclude exercises requiring equipment the user doesn't have
     - Exclude or substitute exercises conflicting with injuries
   - Ensure no muscle group is trained 3+ days in a row (recovery consideration)

3. **F11 Compliance Gate Agent** checks the generated plan:
   - Are there exercises that conflict with listed injuries?
   - Is the volume appropriate for the user's stated level? (too much = injury risk for beginners)
   - Are there any unsafe progressions? (e.g. advanced plyometrics for a beginner)
   - Returns warnings/approved status

4. **F05 Plan Adaptor Agent** (for week 2+): reviews previous week's completion data, adjusts volume/intensity accordingly.

**Output:** WeeklyPlan object stored as `users/{uid}/plans/{planId}`.

**Example plan (3-day full body, intermediate, dumbbells + bench):**

```
Monday — Full Body A
  Warmup: cat-cow (2 min), bodyweight squat (10 reps), arm circles
  Main:
    - Goblet Squat: 3 sets × 8–10 reps, 90s rest, RPE 7
    - Dumbbell Bench Press: 3 sets × 8–10 reps, 90s rest, RPE 7
    - Single-Arm Dumbbell Row: 3 sets × 8–10 reps (each side), 60s rest, RPE 7
    - Dumbbell Shoulder Press: 3 sets × 8–10 reps, 75s rest, RPE 7
    - Plank: 3 sets × 30–45s hold
  Cooldown: chest stretch doorway, child's pose, hamstring stretch seated

Wednesday — Full Body B
  Warmup: cat-cow, world's greatest stretch, light jumping jacks
  Main:
    - Dumbbell Romanian Deadlift: 3 sets × 8–10 reps, 90s rest, RPE 7
    - Incline Dumbbell Bench Press: 3 sets × 8–10 reps, 90s rest, RPE 7
    - Bulgarian Split Squat: 3 sets × 8–10 reps (each leg), 90s rest, RPE 7
    - Dumbbell Bicep Curl: 3 sets × 10–12 reps, 60s rest, RPE 7
    - Dumbbell Tricep Overhead Extension: 3 sets × 10–12 reps, 60s rest, RPE 7
  Cooldown: hip flexor stretch, lying quad stretch, downward dog

Friday — Full Body C
  Warmup: cat-cow, bodyweight lunge (5 each leg), band pull-apart
  Main:
    - Goblet Squat: 3 sets × 10–12 reps, 90s rest, RPE 7
    - Push-Up (or Incline Push-Up): 3 sets × max reps, 75s rest, RPE 7
    - Seated Cable Row substitute (Dumbbell Row): 3 sets × 10–12 reps, 60s rest, RPE 7
    - Lateral Raise: 3 sets × 12–15 reps, 45s rest, RPE 6
    - Dead Bug: 3 sets × 10 reps (each side), 30s rest
    - Walking Lunge: 2 sets × 10 reps (each leg), 60s rest, RPE 6
  Cooldown: pigeon pose, calf stretch wall, cross-body shoulder stretch
```

**RPE guide shown to users:**
- RPE 5–6: Easy, could do 4–5 more reps
- RPE 7: Moderate, could do 3 more reps
- RPE 8: Challenging, could do 2 more reps
- RPE 9: Hard, could do 1 more rep
- RPE 10: Maximum effort, no reps left

---

### 4.4 Weekly Plan Dashboard (F4 part 1)

**Purpose:** Show the user their week at a glance; tap a day to see the workout.

**Layout:**
- Header: "Week 1 · Jun 8 – Jun 14" with navigation arrows
- 7-day grid (Mon–Sun):
  - Rest days: gray, "Rest Day" label
  - Training days: show workout name(s), estimated duration, focus tag
  - Recovery-adjusted days: yellow banner "Recovery score 62 — consider reducing intensity"
- Tap a day → expands to show full workout list (exercises, sets, reps, rest)
- "Start Workout" button on each training day → opens Active Workout Session

**States:**
- Plan loaded, not started
- Plan in progress (some days completed)
- Plan completed
- Plan adapted (show "Updated based on your progress" badge)

---

### 4.5 Active Workout Session (F4 part 2, F5)

**Purpose:** The core in-workout experience — log sets, track rest, complete exercises.

**Layout:**
- Header: workout name, day, estimated time remaining (countdown from sessionDuration minus elapsed)
- Exercise list, one at a time (or scrollable list with current exercise highlighted):
  - Exercise name, target sets × reps, rest time
  - Current set: input fields for reps performed, weight used
  - RPE selector (1–10) after each set (optional, toggleable)
  - "Complete Set" button → auto-starts rest timer
  - Rest timer: countdown circles, skip button, "+5s" button
  - "Skip Exercise" button (with optional reason: "too hard", "no equipment", "injury", "don't like it")
  - "Modify Exercise" → opens substitution picker (shows substitute exercises for this one, filtered by available equipment)
- Progress bar: X of Y exercises completed
- "Finish Workout" button → opens post-workout summary

**Post-workout summary:**
- Exercises completed, total sets, total volume (sets × reps × weight summed)
- Overall RPE (1–10) — prompted
- How did it feel? (Energy 1–10, Mood, Muscle soreness 1–10, Stress 1–10)
- Notes (optional free text)
- "Log Workout" button → saves to Firestore, triggers plan adaptation

**Rest timer behavior:**
- After completing a set, rest timer starts automatically (default: prescribed restSeconds for that exercise)
- Timer circles count down visually
- Audio/vibration notification when rest is done (if browser permits)
- "Skip Rest" and "+5s" buttons available

**Offline behavior (future):** Workout session data cached locally; synced when back online.

---

### 4.6 Coaching Chat (F6, F06)

**Purpose:** Natural language coaching powered by Gemini, with full user context.

**Inputs to the agent:**
- User's fitness profile (current version)
- Current plan (id, version)
- Recent workout logs (last 7 days summary)
- Recovery score (if available, and how old the data is)
- Chat history (last 10 messages for context)

**Agent persona:** Supportive, knowledgeable fitness coach. Encouraging but honest. Adjusts tone based on user's check-in data (see Motivation Coach F09). Avoids medical advice; refers to disclaimer when needed.

**Example conversations:**

*User:* "Can I do the goblet squat if my knee hurts?"
*Coach:* "It depends on the type of knee pain. Goblet squats are generally more knee-friendly than barbell back squats because the weight is centred in front, which reduces shear force on the knee. That said:
- If it's patellar tendon pain (pain just below the kneecap), reduce depth and see if pain decreases
- If it's meniscus pain (pain on the side of the knee), avoid deep flexion
- If the pain is sharp or persists after the workout, stop and see a physio

For now, I'd suggest trying the Goblet Squat at a shallower depth (quarter squat) with lighter weight and see how it feels. If you want, I can substitute it with a Glute Bridge or Leg Press (if you have a machine) — which are lower-load options for the same muscles. What kind of knee pain is it?"

*User:* "I'm not progressing on my bench press."
*Coach:* "Let's troubleshoot. A few things that commonly stall bench progress:
1. **Recovery** — are you sleeping enough and eating enough protein? Bench strength is built during recovery, not during the workout. If your recovery score has been low this week, that may be the culprit.
2. **Volume** — are you hitting 10–20 sets per week for chest? Below that, you may not be doing enough.
3. **Progressive overload** — have you been adding weight or reps each week? Even 1–2 lb or 1 rep per week adds up.
4. **Form** — elbow flare, bouncing the bar, inconsistent touch point — all of these can mask strength.

Looking at your history, your last 3 bench sessions were all at the same weight. That's a sign to either (a) add a set, (b) increase weight by 2.5–5 lb and drop reps to 6–8, or (c) check recovery. Want me to adjust next week's plan to include a heavier, lower-rep bench day?"

**Safety gates:**
- If user mentions pain, injury symptoms, or medical conditions — Compliance Gate triggers, coach responds with "I'm not a medical professional. For anything concerning your health, please consult a physician or physio. Here's what I can tell you about the fitness side..."
- If user asks about nutrition for a medical condition — same gate
- If user asks "should I work out with [ Injury X ]" — gate, provide general guidance only, recommend professional consultation

**Context snapshot stored with each assistant message** (for traceability in Observability Dashboard):
```json
{
  "profileVersion": 3,
  "planId": "plan-1718000000000",
  "planVersion": 2,
  "recentWorkoutIds": ["w-1", "w-2", "w-3"],
  "recoveryScore": 72,
  "dataAgeHours": 4
}
```

---

### 4.7 Recovery Analyst Agent (F7, F04)

**Purpose:** Interpret wearable data + workout frequency → recovery score + recommendation.

**Inputs:**
- WearableDataPoint[] — most recent 24–48 hours of data from all connected sources
- RecentWorkoutCount — workouts in the last 7 days
- Optional: CheckIn data (subjective sleep quality, stress level, muscle soreness)

**Recovery Score calculation (0–100, simplified model):**

| Factor | Weight | Scoring |
|---|---|---|
| Sleep duration | 25% | 7–9h = 100, <5h or >10h = 40, linear interpolation |
| HRV (relative to user's baseline) | 20% | Within 10% of baseline = 100, >20% below = 50, >30% below = 30 |
| Resting heart rate (relative to baseline) | 20% | Within 5 bpm of baseline = 100, >10 bpm above = 50, >15 bpm above = 30 |
| Workout frequency (last 7 days) | 15% | 2–3 = 100, 4–5 = 70, 6–7 = 50, 0–1 = 80 (under-training slightly) |
| Subjective sleep quality (if check-in available) | 10% | 8–10 = 100, 5–7 = 70, 1–4 = 40 |
| Subjective stress (if check-in available) | 10% | 1–3 = 100, 4–6 = 60, 7–10 = 30 |

**Recommendation logic:**

| Score Range | Recommendation |
|---|---|
| 80–100 | Train normal — full intensity, proceed with planned workout |
| 60–79 | Reduce intensity — lower volume by ~20%, drop RPE by 1–2 points, skip accessories if short on time |
| 40–59 | Active recovery or rest — suggest light mobility, walking, or rest day; if user has a planned workout, offer option to reduce to 50% volume |
| 0–39 | Rest day — recommend full rest, gentle stretching only |

**Data freshness rule:** If the most recent wearable data is > 48 hours old, recovery score is marked "based on limited data" and recommendation is conservative (reduce intensity by default).

**Output:** RecoveryAssessment stored as `users/{uid}/recovery/{assessmentId}`, also embedded in the daily plan view as a banner.

---

### 4.8 Progress Dashboard (F7 second part)

**Purpose:** Show users their progress over time to drive motivation and retention.

**Views:**
1. **Strength progress** — per-exercise charts (weight × reps over time), selectable by exercise. Shows best lift per exercise, trend line.
2. **Volume trend** — total weekly volume (sets × reps × weight) bar chart over last 8 weeks.
3. **Workout frequency** — workouts per week over last 12 weeks, heatmap.
4. **Body weight** (if user logs it) — line chart with trend, % change.
5. **Recovery trend** — average recovery score per week, if wearable data available.
6. **Consistency** — current streak, best streak, workouts per week average vs goal.

**Implementation:** Uses D3/Recharts (already in codebase) — adapt ObservabilityDashboard components for user-facing charts.

---

### 4.9 Plan Adaptation (F8, F05)

**Purpose:** Adjust next week's plan based on what happened this week.

**Triggers:**
- User logs a workout (real-time minor adjustment: if they completed all exercises at RPE target, next week's volume increases by 1 set per exercise or weight increases by 2.5–5 lb)
- End of week (full adaptation pass): generate new plan version incorporating all completion data + recovery assessment

**Adaptation rules (simplified):**

| Condition | Action |
|---|---|
| All exercises completed at prescribed RPE or higher, for 2+ consecutive workouts | Increase weight by 2.5–5 lb (or 2.5–5% for dumbbells) OR add 1 set to the main compound |
| Exercise completed but RPE below target (too easy) | Increase weight or reps next week; if already at max reps, add a set |
| Exercise skipped | Remove from next week OR substitute with a simpler variation; ask user in chat why it was skipped |
| Exercise modified (substituted) | Keep the substitution in next week's plan unless user overrides |
| 2+ consecutive rest days (user didn't work out) | Reduce volume by 20–30% in the next plan; add a Motivation Coach nudge |
| Recovery score < 60 for 3+ days | Insert an extra rest day or active recovery day in the next week |
| Workout duration consistently exceeds sessionDuration | Reduce exercises per session (drop accessories) or reduce sets |

**Adaptation stored as:** new plan version with `adaptedFromPlanId` and `adaptationReason`.

---

### 4.10 Wearable Data Integration (F9, F10)

**Purpose:** Pull biometric data from wearables to feed the Recovery Analyst and adaptation engine.

**Supported sources (initial release):**
- Apple HealthKit (iOS web via `requestAuthorization`; mobile via native SDK)
- Google Fit (Android web via OAuth; mobile via native SDK)

**Future sources:** Strava, Garmin Connect, WHOOP, Oura (Elite tier)

**Data flow:**
1. User connects a source → OAuth flow → access token stored securely (Firebase — encrypted at rest via rules)
2. Data Ingest Agent (F10) polls / receives webhook → normalizes into WearableDataPoint schema → writes to `users/{uid}/wearableData/{dataId}`
3. Recovery Analyst (F04) reads recent wearable data → computes recovery score
4. Plan Adaptor (F05) uses recovery score for adaptation decisions
5. Daily digest notification includes sleep summary if available

**Health data consent:** Required before any wearable data is read or stored. Stored as `profile.healthDataConsent: true`. If user revokes consent, all wearable data is deleted and recovery-based features are disabled.

**Privacy:** Wearable data is personal health data — Firestore rules gate access on `healthDataConsent == true`. Data is never shared with third parties or used for advertising.

---

### 4.11 Daily Digest Notification (F10)

**Purpose:** Morning engagement — Slack-style notification summarizing yesterday, today, and motivation.

**Content template (morning):**
```
Good morning, [Name]! ☀️

Yesterday: [completed workout name / rest day]
  → [stats if workout: sets × reps × weight, RPE, time]
  → [sleep summary if wearable data: "You slept 7h 23m, HRV +3ms vs your baseline — solid recovery"]

Today: [workout name] · [estimated duration]
  → [exercise count] exercises, focus on [focus area]
  → [recovery banner if applicable: "Recovery score 74 — train as planned" or "Recovery score 58 — consider reducing intensity"]

Tip: [motivation / form tip / nutrition pointer — from Motivation Coach or Coaching Chat]

[Reply "modify" to adjust today's workout, or "skip" if you need a rest day]
```

**Delivery:** Push notification via FCM (web) / APNs (mobile). Tapping opens the app to today's workout.

**Frequency:** Daily, sent at user's preferred time (default: 7:00 AM local time). User can disable in settings.

---

### 4.12 Motivation Coach Agent (F11, F09)

**Purpose:** Analyze user sentiment and engagement signals → adjust messaging, detect dropout risk.

**Inputs:**
- Chat messages (tone analysis: positive, neutral, frustrated, tired, motivated)
- Check-in data (energy, motivation, stress, mood)
- Workout completion pattern (declining frequency, increasing skips)
- Time since last workout

**Outputs:**
- **Tone adjustment for daily digest** — if user's motivation is low, use more supportive/gentle language; if high, use more challenging language
- **Re-engagement nudge** — if no workout logged in 5+ days, send a "let's get back to it" message via chat or notification, with low-barrier option ("a 15-min full body session is ready for you")
- **Dropout risk flag** — if 2+ weeks of declining frequency + negative sentiment in chat → surface to user in chat ("I've noticed you've been skipping workouts lately — want to talk about what's getting in the way?")

**Sentiment analysis:** Done via Gemini on chat messages + check-in text. Simple classification: positive / neutral / frustrated / tired / unmotivated. Not stored permanently — used in the moment for tone adjustment.

**Dropout risk model (simplified):**
- 7+ days since last workout → medium risk
- 14+ days since last workout → high risk
- Declining energy/motivation scores in last 3 check-ins → medium risk
- Negative sentiment in last 3 chat messages → medium risk
- 2+ risk factors → high risk, trigger re-engagement flow

---

### 4.13 Nutrition Advisor Agent (F12, F08) — Premium/Elite

**Purpose:** Provide calorie and macro targets, answer nutrition questions, suggest meals.

**Calculation (simplified):**
- BMR (Mifflin-St Jeor):
  - Male: 10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5
  - Female: 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161
- TDEE = BMR × activity multiplier:
  - Sedentary (1–2 workouts/week): 1.2
  - Lightly active (3–4): 1.375
  - Moderately active (5–6): 1.55
  - Very active (7+): 1.725
- Goal adjustment:
  - Fat loss: TDEE - 300–500 kcal (0.5–1 lb/week)
  - Muscle gain: TDEE + 200–300 kcal
  - Maintenance: TDEE
- Macro split (default, adjustable):
  - Strength/Hypertrophy: 30% protein / 40% carbs / 30% fat
  - Weight loss: 35% protein / 35% carbs / 30% fat
  - Endurance: 25% protein / 55% carbs / 20% fat
  - General: 25% protein / 45% carbs / 30% fat

**Protein target:** 1.6–2.2 g/kg bodyweight (depending on goal and activity level)

**Conversational capabilities:**
- "How many calories should I eat?" → returns calorie target + macros + explanation
- "What should I eat before a workout?" → pre-workout meal suggestion (carbs + moderate protein, 1–3h before)
- "What about after?" → post-workout suggestion (protein + carbs, within 2h after)
- "Give me a meal plan" → 3-day sample meal plan based on preferences (future)

**Safety gate:** If user mentions a medical condition (diabetes, kidney disease, eating disorder, etc.) — refuse to give specific nutrition prescriptions, recommend registered dietitian.

---

### 4.14 Form Coach Agent (F13, F07)

**Purpose:** Provide text-based form cues for exercises.

**Capabilities:**
- Given an exercise name → return form cues (key points, common mistakes, cue words)
- Given exercise + user description of how it felt → suggest form adjustments
- "My knees cave in when I squat" → specific cues: "Push your knees out as you descend — imagine screwing your feet into the floor. Strengthen your glute medius with banded walks or clamshells. Reduce weight until you can keep knees tracked."

**Limitations (current):** Text-only. No computer vision. Explicitly stated to the user — "I can help with form cues based on what you tell me, but I can't see your movement. For form feedback, consider filming your sets from the side and comparing to the video reference, or working with a coach in person."

**Video references:** Each exercise in the library has a `videoRef` URL (exrx.net links initially). Coach can share these with users.

---

### 4.15 Exercise Substitution Engine (F14)

**Purpose:** Allow users to swap exercises when they can't or don't want to do a prescribed one.

**Flow in workout session:**
1. User taps "Modify Exercise" on a planned exercise
2. System shows substitute options (from exercise library substitution list, filtered by user's available equipment)
3. User picks a substitute
4. System confirms: "Swapped Barbell Back Squat → Goblet Squat. Same primary muscles (quads, glutes). Note: Goblet squat uses less weight — you may need to adjust reps."
5. Substitution is recorded in the workout log (modifiedExercises) and remembered for next week's plan adaptation

**Equipment filter:** If user selects "none" for equipment, substitutes are filtered to bodyweight-only options.

---

### 4.16 Subscription & Billing (F15)

**Tiers:**
| Tier | Price | Features |
|---|---|---|
| Free | $0 | Basic weekly plan (non-adaptive), exercise library, workout logging, progress dashboard, 5 chat sessions/week |
| Premium | $12/mo (or $10/mo annual) | Fully adaptive plans, unlimited chat, HealthKit/Google Fit integration, recovery adaptation, daily digest, motivation coach, exercise substitution, plan adaptation on completion |
| Elite | $20/mo (or $18/mo annual) | All Premium + Strava/Garmin/WHOOP/Oura integration, nutrition advisor, GLP-1/special population mode, text form coaching, priority support, early access to CV/AR features |

**Trial:** 7-day free trial of Premium on sign-up ( 사용자가 premium 기능을 먼저 체험). Billed after trial unless cancelled.

**Implementation:** Stripe (future). For initial prototype, tiers are role-based flags in Firestore (`users/{uid}/subscription/main.tier`) without actual billing — used to gate features in the UI.

---

### 4.17 Compliance, Safety & Legal (F16, F11)

**Key compliance requirements:**

1. **Disclaimer on first use** — user must accept before first workout generated. Stored as `profile.disclaimerAccepted: true`.
2. **Injury conflict detection** — Compliance Gate checks every generated plan and every workout modification against the user's listed injuries. If a conflict is detected, plan is flagged and user is notified.
3. **Medical advice blocking** — Coaching Chat and Nutrition Advisor refuse to give specific medical advice. They provide general fitness information and direct users to professionals.
4. **Health data consent** — explicit opt-in before any wearable data is read. User can revoke at any time (deletes all wearable data).
5. **Data deletion (GDPR/CCPA)** — user can request full account deletion. All user data (profile, workouts, plans, chat history, wearable data, check-ins) is deleted. Firestore rules + server endpoint handle this.
6. **Data export** — user can export their data as JSON (workouts, plans, chat history). Future: CSV export.
7. **Children's data** — users under 13 should not use the service (COPPA). Age field captured optionally; if age < 13, service is restricted (future enforcement).

**Liability reduction:**
- Disclaimer prominently displayed at onboarding and in settings
- Every workout plan includes a footer: "This plan was generated by AI. Listen to your body — if something hurts, stop. Consult a professional if you're unsure."
- Coaching Chat always includes a reminder if the topic touches on injury/medical: "I'm an AI coach, not a doctor or physio. For health concerns, please consult a professional."

---

### 4.18 Admin / Observability Dashboard

**Purpose:** Product team visibility into coaching quality, agent performance, and retention.

**Metrics tracked:**
- Daily active users (DAU), weekly active users (WAU)
- Sign-up → onboarding completion rate
- Onboarding → first workout rate
- 7-day and 30-day retention
- Workout completion rate (planned → logged)
- Chat session volume (per day, per user)
- Plan adaptation count (per week)
- Recovery score distribution
- Chat sentiment trend (avg positive/neutral/frustrated ratio)
- Subscription tier distribution
- Feature adoption (which features are being used)

**Agent telemetry (from PolyVerses existing infrastructure):**
- Per-agent latency, success rate, load (heatmap)
- Workflow execution traces (which agents ran for each request)
- Human gate trigger count (how often compliance/safety gates fire)
- Circuit breaker events

**Implementation:** Repurpose existing ObservabilityDashboard + AgentNetworkDiagram components with fitness-specific metrics.

---

## 5. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Latency** | Workout plan generation < 10 seconds (Gemini API call + agent processing) |
| **Chat response** | < 5 seconds for simple queries, < 15 seconds for complex contextual queries |
| **Availability** | 99.5% uptime target (service is client-side rendered with Firebase; server is lightweight Express) |
| **Security** | Gemini API key server-side only; Firebase Auth with email verification; Firestore rules enforce per-user isolation; health data gated on consent flag |
| **Privacy** | Health/wearable data never shared with third parties; user can delete all data; GDPR/CCPA compliant data handling |
| **Scalability** | Firebase scales automatically; server.ts is lightweight; Gemini calls are per-request (no queueing needed for MVP) |
| **Browser support** | Modern Chrome, Safari, Firefox, Edge (React 19 + Vite 6) |
| **Mobile** | Responsive web app (PWA-ready); mobile-specific features (push, native wearable SDKs) planned for Phase 5 |

---

## 6. Out of Scope (for v1)

- Computer vision form analysis (Phase 5)
- AR coaching overlay (Phase 5)
- Mobile native app (Phase 5 — PWA first)
- Coach marketplace / human coach matching (Phase 5)
- B2B / enterprise dashboard (Phase 5)
- Social features (friends, challenges, leaderboards)
- Advanced nutrition planning (meal plans, grocery lists)
- Continuous glucose monitor integration
- Strava / Garmin / WHOOP / Oura integrations (Elite tier, post-MVP)

---

## 7. Open Questions

1. **Pricing validation** — is $12/mo Premium and $20/mo Elite the right price point? Need user research / competitor pricing confirmation.
2. **Exercise library breadth** — 101 exercises is a start; what's the minimum viable set for a good user experience across all common goals and equipment levels?
3. **Wearable integration timeline** — Apple HealthKit web API has limitations; is a PWA/mobile app required before wearable features are usable?
4. **Adaptation algorithm** — the rules above are a starting point; should we invest in a more sophisticated model (RL-based, or supervised on user outcomes) later?
5. **Monetization** — Stripe integration timeline; is the 7-day trial the right hook?
6. **Liability / legal** — does the disclaimer + safety gate approach sufficiently reduce liability, or do we need a lawyer review before launch?

---

*End of PRD.*
