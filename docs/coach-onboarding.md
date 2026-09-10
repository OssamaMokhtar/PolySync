# Coach Onboarding — PolySync

**Status:** Flow design — to be implemented.

## The Coach's Role

In the PolySync B2B2C model, the coach is the distribution layer. Athletes adopt PolySync because their coach uses it. The coach's experience must be excellent, or coaches won't adopt.

## Coach Onboarding Flow

### Step 1: Sign Up

- Coach creates an account (email, name, credentials)
- Coach specifies: coaching niche (hybrid athletes, endurance, strength, general fitness), coaching experience, location (for timezone and regional context)

### Step 2: Connect Athletes

- Coach invites athletes (email, link, QR code)
- Athlete accepts invitation, creates account
- Athlete connects to coach (one coach per athlete, or multiple coaches for different purposes)

### Step 3: Initial Assessment

- Athlete completes initial assessment (current training status, injury history, goals, available equipment, preferences)
- Assessment results seed the programming engine's initial state

### Step 4: First Week of Programming

- Programming engine generates the first week of training based on the assessment
- Coach reviews the programming (can modify, approve, or reject)
- Athlete receives the first week of training

### Step 5: Ongoing Loop

- Each week: programming engine proposes adaptations based on athlete's progress
- Coach reviews proposals (accept, modify, reject)
- Athlete receives approved adaptations
- Athlete reports progress (completed workouts, perceived effort, any issues)
- Loop repeats

## Coach Dashboard

The coach needs a dashboard that shows:

- **Athlete overview:** list of athletes, current training status, recent progress, flags (injuries, missed workouts, unusual progress)
- **Proposal review queue:** LLM-proposed adaptations waiting for coach review, with context (why this proposal, what data supports it, what are the risks)
- **Programming overview:** current week's programming for each athlete, history of adaptations, response to adaptations
- **Analytics:** aggregate athlete progress, trend analysis, insights (which adaptations work, which don't)

## Coach Tools

- **Modify programming:** adjust an athlete's training load, swap exercises, add rest days
- **Approve/reject proposals:** accept LLM proposals, reject with reason, modify before approving
- **Communicate with athletes:** send messages, feedback, encouragement
- **View history:** see past programming, adaptations, athlete responses

## Coach Incentives

Why would a coach use PolySync?

- **Time savings:** automated programming reduces the time spent on routine programming
- **Better outcomes:** data-driven adaptations may produce better athlete results
- **Safety:** bounds checker reduces the risk of recommending unsafe training
- **Scalability:** coach more athletes without proportionally more time
- **Differentiation:** offer AI-augmented coaching as a premium service

## Coach Acquisition

- **Direct outreach:** contact coaches in Dubai/GCC, offer free trial
- **Coach communities:** engage with coach forums, groups, conferences
- **Athlete demand:** athletes ask their coaches to use PolySync
- **Partnerships:** gyms, fitness centers, sports clubs that employ coaches

## Relationship to Improvement Plan

This coach onboarding flow is Phase 2 of the PolySync improvement plan. See [[01-Improvement-Plan-PolySync]].
