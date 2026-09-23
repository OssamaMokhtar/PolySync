# PolySync financial model

> Status: GENERATED from `product/data/*.json` by `product/scripts/build.mjs` · As of 2026-09-24 · Do not edit by hand

**The answer first.** At the modelled price of $8.00 (AED 29) per athlete-month, PolySync is software for the club: gross margin is 93% and inference is $0.20 per athlete-month. Whether the club gets its money back depends on market and schedule segment. The US case pays back 5.0x for flexible athletes. The UAE pilot case is 1.5x, because UAE coach wages are lower. If PolySync ran the coaching itself (the managed variant), a 70% margin would need about $11.95 per athlete-month in the UAE and $35.02 in the US. That is services pricing, not software.

**How much to trust it.** 3 of 24 drivers are evidence-backed and 2 are recorded decisions. The other 19 are hypotheses. Each hypothesis names the telemetry event or study that will replace it. The model is mainly a map of what the [pilot](pilot-plan.md) has to measure.

## Unit economics per athlete-month (base case)

Coach time is the club's cost under B2B2C (ADR-001). PolySync's value is the coach time it saves; its own cost is inference, hosting and fees.

| Market / segment | Amber-day hard sessions kept (simulated) | Coach min with PolySync | Coach min by hand | Club value | Club ROI at $8.00 | Athletes per coach (hand → PolySync) | Software GM | Managed break-even price |
|---|---|---|---|---|---|---|---|---|
| UAE/flexible | 77% | 11.1 | 65.0 | $12.52 | 1.56x | 40 → 233 | 93% | $10.90 |
| UAE/standard | 43% | 12.4 | 65.0 | $12.23 | 1.53x | 40 → 210 | 93% | $11.95 |
| UAE/rigid | 6% | 13.7 | 65.0 | $11.92 | 1.49x | 40 → 190 | 93% | $13.09 |
| US/flexible | 77% | 11.1 | 65.0 | $39.65 | 4.96x | 40 → 233 | 93% | $31.69 |
| US/standard | 43% | 12.4 | 65.0 | $38.75 | 4.84x | 40 → 210 | 93% | $35.02 |
| US/rigid | 6% | 13.7 | 65.0 | $37.77 | 4.72x | 40 → 190 | 93% | $38.65 |

On an amber day the engine either keeps the hard session by moving it (no coach time), makes it easy in place and tells the coach a session was lost (a short review), or escalates. The rates come from the hybrid eval (`evals/results/hybrid-latest.json`), a simulation of the engine's own rules (OWN-002). Real rates are unmeasured (GAPS #14).

### What the table says

1. **Inference is not the business risk.** $0.20 per athlete-month at list price. The engine prescribes and the model only proposes and explains (ADR-004), so model spend per athlete is small and bounded; it is not what sets the margin.
2. **Coach capacity is the product.** A coach handles about 40 hybrid athletes by hand in the hours modelled, and about 210 with PolySync (standard segment). Sell that, not features.
3. **The UAE is a harder ROI market than the US.** Lower coach wages mean the same minutes saved are worth less, so the UAE pitch has to be capacity (more athletes per coach), not cost.
4. **Schedule shape decides training quality more than coach cost.** The engine keeps 77% of amber-day hard sessions for flexible athletes and 6% for rigid ones. The coach-time difference is small (2.6 min per athlete-month), so the case for segmenting is outcomes and retention, not cost (ADR-008).

## Sensitivity (reference case: UAE / standard)

Bear takes the unfavourable end of every range at once; bull the favourable end.

| Metric | Bear | Base | Bull |
|---|---|---|---|
| Club ROI | -0.24x | 1.53x | 11.35x |
| Software gross margin | 65% | 93% | 97% |
| Managed break-even price | $104.15 | $11.95 | $1.91 |

### What moves club ROI most

| Driver | Low value → | High value → | Swing |
|---|---|---|---|
| Coach minutes per athlete-week programming hybrid athletes by hand (baseline) | 0.65x | 3.42x | 2.77x |
| Hybrid/HYROX specialist premium over median trainer wage | 1.02x | 2.55x | 1.53x |
| Price to the club per active athlete-month | 2.45x | 1.02x | 1.43x |
| Employer on-cost multiplier on base wage | 1.41x | 1.76x | 0.35x |
| Coach weekly triage per athlete with PolySync | 1.66x | 1.34x | 0.32x |
| Coach minutes per escalation (pain flag, blocked proposal, or no safe adaptation) | 1.58x | 1.42x | 0.17x |
| Coach minutes to review a hard session the engine made easy | 1.57x | 1.43x | 0.14x |
| Share of model proposals the rules block (each needs coach review) | 1.58x | 1.45x | 0.13x |

The top drivers are the pilot's measurement priorities: coach minutes by hand (baseline), the price, and the specialist wage premium.

## Required penetration, not a forecast

$1.0M ARR at $8.00 per athlete-month needs about **10,417 active athletes**, or **347 clubs** at 30 athletes each. That is **2.3%** of 15,000 HYROX-affiliated gyms. The gym count is company-reported, grade C ([MKT-003](data/evidence.json)), so treat this as order of magnitude.

## Drivers

| Driver | Base | Range | Unit | Source |
|---|---|---|---|---|
| Amber-readiness days per athlete-month | 4 | 2–8 | days | Hypothesis → measured by `event:readiness_band_recorded` |
| Share of amber days with a hard session scheduled | 0.6 | 0.4–0.8 | ratio | Hypothesis → measured by `event:adaptation_requested` |
| Pain or illness flags per athlete-month (always escalate) | 0.3 | 0.1–0.8 | flags | Hypothesis → measured by `event:pain_flag_raised` |
| Model proposals per athlete-month | 4.33 | 4.33–8.66 | proposals | Hypothesis → measured by `event:adaptation_proposed` |
| Share of model proposals the rules block (each needs coach review) | 0.15 | 0.05–0.3 | ratio | Hypothesis → measured by `event:bounds_rejected` |
| Coach minutes to review a hard session the engine made easy | 1.5 | 0.5–4 | min | Hypothesis → measured by `event:session_downgraded` |
| Coach minutes per escalation (pain flag, blocked proposal, or no safe adaptation) | 4 | 2–8 | min | Hypothesis → measured by `event:coach_decision` |
| Coach weekly triage per athlete with PolySync | 1.5 | 0.5–3 | min/week | Hypothesis → measured by `event:coach_console_active_min` |
| Coach minutes per athlete-week programming hybrid athletes by hand (baseline) | 15 | 8–30 | min/week | Hypothesis → measured by `study:coach-time-diary` |
| Employer on-cost multiplier on base wage | 1.3 | 1.2–1.5 | x | Hypothesis → measured by `study:payroll-ranges` |
| Hybrid/HYROX specialist premium over median trainer wage | 1.5 | 1–2.5 | x | Hypothesis → measured by `study:coach-interviews` |
| Coach hours per week available for programming and review | 10 | 6–15 | h/week | Hypothesis → measured by `study:coach-interviews` |
| Input tokens per model call | 2000 | 1000–4000 | tokens | Hypothesis → measured by `event:llm_call` |
| Output tokens per model call | 600 | 300–1200 | tokens | Hypothesis → measured by `event:llm_call` |
| Model calls per athlete-month (proposals + explanations + chat) | 24 | 12–60 | calls | Hypothesis → measured by `event:llm_call` |
| Gemini 3.5 Flash input price | 1.5 | 1.5–1.5 | USD/1M tokens | Evidence: [CST-003](data/evidence.json) |
| Gemini 3.5 Flash output price | 9 | 9–9 | USD/1M tokens | Evidence: [CST-003](data/evidence.json) |
| Hosting, database, logs per athlete-month | 0.15 | 0.05–0.5 | USD | Hypothesis → measured by `study:cloud-bill` |
| Price to the club per active athlete-month | 8 | 5–12 | USD | Hypothesis → measured by `study:pilot-loi`; anchored on [PRC-001](data/evidence.json), [PRC-002](data/evidence.json), [PRC-003](data/evidence.json), [PRC-004](data/evidence.json) |
| Payment and invoicing fees | 0.03 | 0.02–0.05 | ratio of price | Hypothesis → measured by `study:processor-statements` |
| Active PolySync athletes per club | 30 | 15–60 | athletes | Hypothesis → measured by `event:roster_activated` |
| HYROX-affiliated gyms worldwide (penetration denominator) | 15000 | 15000–24000 | gyms | Evidence: [MKT-003](data/evidence.json) |
| Gross-margin line for 'this is software' | 0.7 | 0.7–0.7 | ratio | Decision: Product target, not a benchmark claim |
| ARR milestone for the penetration check | 1000000 | 1000000–1000000 | USD | Decision: Milestone chosen for scale, not a forecast |

Coach base wage: UAE AED 4,556/month (CST-002, grade B) ÷ 173.33 h ÷ 3.6725 = $7.16/h; US $22.67/h (CST-001, grade A). Both are multiplied by on-cost and specialist premium. Also available as a spreadsheet with live formulas: [polysync-unit-economics.xlsx](generated/polysync-unit-economics.xlsx).
