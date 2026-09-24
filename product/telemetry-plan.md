# PolySync telemetry plan

> Status: GENERATED from `product/data/*.json` by `product/scripts/build.mjs` · As of 2026-09-24 · Do not edit by hand

**North star:** Adapted sessions completed per athlete per week. Requires all three parts to work: the engine delivered a plan, it changed in response to the athlete, and the athlete did it (doc 11).

Formula: `count(session_completed where adapted = true) / active athletes / week`

## Inputs

| Metric | Formula | Why |
|---|---|---|
| Plan adherence | `session_completed / sessions prescribed` |  |
| Coach minutes per athlete-month | `sum(coach_decision.active_s)/60 + coach_console_active_min, per active athlete-month` | Decides software vs services (ADR-003, ADR-008) |
| Amber-day outcomes by schedule segment | `session_moved, session_downgraded, coach_escalation / adaptation_requested{band=amber}, split by onboarding flexibility segment` | Replaces the simulated driver (GAPS #14) |
| Rule rejection rate | `bounds_rejected / adaptation_proposed` | Model quality proxy; coach-queue load |
| Cost per accepted adaptation | `sum(llm_call.cost_usd) / adaptations accepted` | Unit cost of the AI layer |

## Guardrails

| Guardrail | Threshold | Action |
|---|---|---|
| Contraindication leaks | 0 | Block release |
| Pain flags escalated | 100% | Block release |
| Unsafe proposals reaching an athlete | 0 | Block release |

## Events

5 of 15 are logged today as structured JSON lines; the rest are planned.

| Event | Properties | Status | Replaces model hypothesis |
|---|---|---|---|
| `readiness_band_recorded` | band, source | planned | Amber-readiness days per athlete-month |
| `adaptation_requested` | day, band, session_modality | planned | Share of amber days with a hard session scheduled |
| `pain_flag_raised` | region, source | planned | Pain or illness flags per athlete-month (always escalate) |
| `adaptation_proposed` | source, rules_checked | planned | Model proposals per athlete-month |
| `bounds_rejected` | uid, rules | instrumented (app/server.ts (plan route)) | Share of model proposals the rules block (each needs coach review) |
| `hybrid_proposal_rejected` | uid, rules | instrumented (app/server.ts (/api/hybrid/week)) | — |
| `coach_escalation` | uid, reason | instrumented (app/server.ts (/api/hybrid/adapt)) | — |
| `session_moved` | uid, day | instrumented (app/server.ts (/api/hybrid/adapt)) | — |
| `session_downgraded` | uid, day | instrumented (app/server.ts (/api/hybrid/adapt)) | Coach minutes to review a hard session the engine made easy |
| `coach_decision` | decision, latency_s, active_s, rule | planned | Coach minutes per escalation (pain flag, blocked proposal, or no safe adaptation) |
| `coach_console_active_min` | coach_id, athletes | planned | Coach weekly triage per athlete with PolySync |
| `llm_call` | model, tokens_in, tokens_out, cost_usd, purpose | planned | Input tokens per model call; Output tokens per model call; Model calls per athlete-month (proposals + explanations + chat) |
| `session_completed` | modality, adapted, rpe_reported | planned | — |
| `roster_activated` | club_id, athletes | planned | Active PolySync athletes per club |
| `onboarding_completed` | days_available, doubles_ok, priority | planned | — |

## Studies (hypotheses no event can measure)

| Study | What | When | Replaces |
|---|---|---|---|
| coach-time-diary | Pre-pilot: 3 clubs log coach minutes per athlete-week for 2 weeks of hand programming | Pilot week -2 to 0 | Coach minutes per athlete-week programming hybrid athletes by hand (baseline) |
| coach-interviews | Semi-structured interviews with 5 club owners and their head coaches: hours, rates, pain points | Weeks 1-3 | Hybrid/HYROX specialist premium over median trainer wage; Coach hours per week available for programming and review |
| pilot-loi | Letters of intent stating price per athlete-month | Weeks 3-6 | Price to the club per active athlete-month |
| payroll-ranges | Club payroll on-cost ranges (no individual data) | During LOI talks | Employer on-cost multiplier on base wage |
| cloud-bill | Monthly infrastructure bill divided by active athletes | Pilot months 1-3 | Hosting, database, logs per athlete-month |
| processor-statements | Payment and invoicing fees | First invoice | Payment and invoicing fees |
