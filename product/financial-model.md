# PolySync financial model

> Status: GENERATED from `product/data/*.json` by `product/scripts/build.mjs` · As of 2026-09-24 · Do not edit by hand

**The answer first.** At the modelled price of $8.00 (AED 29) per athlete-month, PolySync is software for the club: gross margin is 93% and inference is $0.20 per athlete-month. Whether the club gets its money back depends on market and schedule segment. The US case pays back 4.8x for flexible athletes. The UAE pilot case is 1.4x, because UAE coach wages are lower. If PolySync ran the coaching itself (the managed variant), a 70% margin would need about $14.60 per athlete-month in the UAE and $43.41 in the US. That is services pricing, not software.

**How much to trust it.** 3 of 23 drivers are evidence-backed and 2 are recorded decisions. The other 18 are hypotheses. Each hypothesis names the telemetry event or study that will replace it. The model is mainly a map of what the [pilot](pilot-plan.md) has to measure.

## Unit economics per athlete-month (base case)

Coach time is the club's cost under B2B2C (ADR-001). PolySync's value is the coach time it saves; its own cost is inference, hosting and fees.

| Market / segment | Escalation rate (simulated) | Coach min with PolySync | Coach min by hand | Club value | Club ROI at $8.00 | Athletes per coach (hand → PolySync) | Software GM | Managed break-even price |
|---|---|---|---|---|---|---|---|---|
| UAE/flexible | 24% | 12.6 | 65.0 | $12.18 | 1.52x | 40 → 206 | 93% | $12.16 |
| UAE/standard | 54% | 15.4 | 65.0 | $11.52 | 1.44x | 40 → 168 | 93% | $14.60 |
| UAE/rigid | 85% | 18.4 | 65.0 | $10.82 | 1.35x | 40 → 141 | 93% | $17.18 |
| US/flexible | 24% | 12.6 | 65.0 | $38.57 | 4.82x | 40 → 206 | 93% | $35.70 |
| US/standard | 54% | 15.4 | 65.0 | $36.48 | 4.56x | 40 → 168 | 93% | $43.41 |
| US/rigid | 85% | 18.4 | 65.0 | $34.28 | 4.28x | 40 → 141 | 93% | $51.59 |

Escalation rates come from the hybrid eval (`evals/results/hybrid-latest.json`), a simulation of the engine's own rules (OWN-002). Real rates are unmeasured (GAPS #14).

### What the table says

1. **Inference is not the business risk.** $0.20 per athlete-month at list price. The engine prescribes and the model only proposes and explains (ADR-004), so model spend per athlete is small and bounded; it is not what sets the margin.
2. **Coach capacity is the product.** A coach handles about 40 hybrid athletes by hand in the hours modelled, and about 168 with PolySync (standard segment). Sell that, not features.
3. **The UAE is a harder ROI market than the US.** Lower coach wages mean the same minutes saved are worth less, so the UAE pitch has to be capacity (more athletes per coach), not cost.
4. **Rigid schedules cost coach time.** The rigid segment needs 5.8 more coach minutes per athlete-month than the flexible one (ADR-008).

## Sensitivity (reference case: UAE / standard)

Bear takes the unfavourable end of every range at once; bull the favourable end.

| Metric | Bear | Base | Bull |
|---|---|---|---|
| Club ROI | -0.39x | 1.44x | 11.29x |
| Software gross margin | 65% | 93% | 97% |
| Managed break-even price | $126.94 | $14.60 | $2.23 |

### What moves club ROI most

| Driver | Low value → | High value → | Swing |
|---|---|---|---|
| Coach minutes per athlete-week programming hybrid athletes by hand (baseline) | 0.56x | 3.33x | 2.77x |
| Hybrid/HYROX specialist premium over median trainer wage | 0.96x | 2.40x | 1.44x |
| Price to the club per active athlete-month | 2.30x | 0.96x | 1.34x |
| Coach minutes per escalation review | 1.57x | 1.18x | 0.39x |
| Employer on-cost multiplier on base wage | 1.33x | 1.66x | 0.33x |
| Coach weekly triage per athlete with PolySync | 1.57x | 1.25x | 0.32x |
| Amber-readiness days per athlete-month | 1.51x | 1.29x | 0.22x |
| Share of model proposals the rules block (each needs coach review) | 1.49x | 1.36x | 0.13x |

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
| Coach minutes per escalation review | 4 | 2–8 | min | Hypothesis → measured by `event:coach_decision` |
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
