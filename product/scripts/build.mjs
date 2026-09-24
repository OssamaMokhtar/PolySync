#!/usr/bin/env node
// Product layer build: validate the data, compute the model, render the docs.
//
//   node product/scripts/build.mjs          # regenerate product/*.md and product/generated/
//   node product/scripts/build.mjs --check  # CI: fail if data is invalid or generated files are stale
//
// Rules this enforces (the same ones the docs claim):
// - every evidence id is unique, graded A-D, and has a source URL
// - every model driver cites evidence graded A-C, or is a hypothesis whose
//   `measuredBy` names a telemetry event or study in metrics.json, or is a
//   recorded decision
// - every risk's controlEvidence path exists; every linked id, ADR and GAPS
//   number exists
// - OWN-001 in evidence.json matches evals/results/latest.json (CI output)
// - the README's headline eval numbers match both results files
// No dependencies. Output is deterministic (no clock), so --check is exact.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { computeUnit, segmentOutcomes, marketWage, HOURS_PER_MONTH } from "./model-core.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const P = (...x) => join(ROOT, ...x);
const read = (f) => JSON.parse(readFileSync(P(f), "utf8"));
const CHECK = process.argv.includes("--check");

const evidence = read("product/data/evidence.json");
const model = read("product/data/model.json");
const risks = read("product/data/risks.json");
const metrics = read("product/data/metrics.json");
const competitors = read("product/data/competitors.json");
const roadmap = read("product/data/roadmap.json");
const pilotStatus = read("product/data/pilot-status.json");
const validation = read("product/data/validation.json");
const safety = read("evals/results/latest.json");
const hybrid = read("evals/results/hybrid-latest.json");
const decisionLog = readFileSync(P("docs/10-decision-log.md"), "utf8");
const gaps = readFileSync(P("docs/GAPS.md"), "utf8");

const errors = [];
const E = new Map(evidence.claims.map((c) => [c.id, c]));

// ── Validate evidence ───────────────────────────────────────────────────────
if (E.size !== evidence.claims.length) errors.push("duplicate evidence ids");
for (const c of evidence.claims) {
  if (!["A", "B", "C", "D"].includes(c.grade)) errors.push(`${c.id}: bad grade ${c.grade}`);
  if (!c.url) errors.push(`${c.id}: no source url`);
  if (!c.accessed) errors.push(`${c.id}: no access date`);
}
const own = E.get("OWN-001")?.value;
const s = safety.sets;
const ownExpected = {
  contraindicationLeaks: s.contraindication_leak.contraindicated_exercises_in_plans,
  plans: s.contraindication_leak.n_plans,
  unsafeBlocked: s.bounds_adversarial.blocked,
  unsafeTotal: s.bounds_adversarial.n,
  safeAccepted: s.safe_proposal_acceptance.accepted,
  safeTotal: s.safe_proposal_acceptance.n,
};
for (const [k, v] of Object.entries(ownExpected)) if (own?.[k] !== v) errors.push(`OWN-001.${k} = ${own?.[k]} but CI results say ${v}`);

// ── Validate model ──────────────────────────────────────────────────────────
const eventNames = new Set(metrics.events.map((e) => e.name));
const studyIds = new Set(metrics.studies.map((x) => x.id));
const D = Object.fromEntries(model.drivers.map((d) => [d.id, d]));
for (const d of model.drivers) {
  const kinds = ["evidence", "hypothesis", "decision"].filter((k) => d[k]);
  if (kinds.length !== 1) errors.push(`driver ${d.id}: needs exactly one of evidence/hypothesis/decision`);
  for (const id of d.evidence ?? []) {
    const c = E.get(id);
    if (!c) errors.push(`driver ${d.id}: unknown evidence ${id}`);
    else if (c.grade === "D") errors.push(`driver ${d.id}: uses D-grade evidence ${id}`);
  }
  for (const id of d.anchors ?? []) if (!E.has(id)) errors.push(`driver ${d.id}: unknown anchor ${id}`);
  if (d.hypothesis) {
    const [kind, name] = String(d.hypothesis.measuredBy ?? "").split(":");
    if (kind === "event" ? !eventNames.has(name) : kind === "study" ? !studyIds.has(name) : true) errors.push(`driver ${d.id}: measuredBy '${d.hypothesis.measuredBy}' is not a telemetry event or study`);
  }
  if (!(d.low <= d.base && d.base <= d.high)) errors.push(`driver ${d.id}: base outside low-high`);
}
const escTable = hybrid.sets.amber_outcomes_by_schedule.byDaysAndDoubles;
for (const seg of model.segments) for (const k of seg.scheduleKeys) if (!escTable[k]) errors.push(`segment ${seg.id}: no CI amber-outcome data for ${k}`);
const allKeys = model.segments.flatMap((x) => x.scheduleKeys);
if (new Set(allKeys).size !== allKeys.length || allKeys.length !== Object.keys(escTable).length) errors.push("segments must partition every schedule shape in the eval exactly once");

// ── Validate competitors, roadmap, pilot status ─────────────────────────────
const CAP_VALUES = ["yes", "claimed", "partial", "no", "unknown"];
for (const c of competitors.competitors) {
  for (const k of Object.keys(competitors.capabilities)) if (!CAP_VALUES.includes(c[k])) errors.push(`competitor ${c.name}: ${k} must be one of ${CAP_VALUES.join("/")}`);
  if (!c.evidence?.length) errors.push(`competitor ${c.name}: no evidence`);
  for (const id of c.evidence ?? []) if (!E.has(id)) errors.push(`competitor ${c.name}: unknown evidence ${id}`);
  if (c.name !== "PolySync" && Object.keys(competitors.capabilities).some((k) => c[k] === "yes" && k !== "coachInLoop")) errors.push(`competitor ${c.name}: only our own CI can show 'yes'; use 'claimed' for vendor statements`);
}
const refOk = (ref) => {
  if (/^GAPS #\d+$/.test(ref)) return new RegExp(`^\\| ${ref.slice(6)} \\|`, "m").test(gaps);
  if (/^ADR-\d{3}$/.test(ref)) return decisionLog.includes(`## ${ref}`);
  if (/^(study|event):/.test(ref)) { const [k, n] = ref.split(":"); return k === "study" ? studyIds.has(n) : eventNames.has(n); }
  return existsSync(P(ref));
};
for (const hz of roadmap.horizons) for (const it of hz.items) {
  if (!refOk(it.ref)) errors.push(`roadmap "${it.title}": reference ${it.ref} does not resolve`);
  if (it.status === "done" && !existsSync(P(it.ref))) errors.push(`roadmap "${it.title}": a done item must point to a file`);
}
const pilotBars = (readFileSync(P("product/pilot-plan.md"), "utf8").match(/^\| \d+ \| /gm) ?? []).length;
if (pilotStatus.bars.length !== pilotBars) errors.push(`pilot-status has ${pilotStatus.bars.length} bars, pilot plan has ${pilotBars}`);
for (const b of pilotStatus.bars) {
  if (!["not-started", "measuring", "pass", "fail"].includes(b.status)) errors.push(`pilot bar ${b.n}: bad status ${b.status}`);
  if (["pass", "fail"].includes(b.status) && (b.observed === null || !b.source)) errors.push(`pilot bar ${b.n}: ${b.status} needs an observed value and a source`);
}

// ── Headline numbers quoted in the README ───────────────────────────────────
const fmtN = (n) => n.toLocaleString("en-US");
const headline = {
  unsafeTotal: s.bounds_adversarial.n + hybrid.sets.adversarial_blocked.n,
  unsafeBlocked: s.bounds_adversarial.blocked + hybrid.sets.adversarial_blocked.blocked,
  safeTotal: s.safe_proposal_acceptance.n + hybrid.sets.safe_proposals_accepted.n,
  safeAccepted: s.safe_proposal_acceptance.accepted + hybrid.sets.safe_proposals_accepted.accepted,
};
headline.attackTypes = Object.keys(s.bounds_adversarial.byMutation).length + Object.keys(hybrid.sets.adversarial_blocked.byMutation).length;
const readme = readFileSync(P("README.md"), "utf8");
const prd = readFileSync(P("product/prd.md"), "utf8");
if (!prd.includes(`${fmtN(headline.unsafeBlocked)} of ${fmtN(headline.unsafeTotal)} attacks`)) errors.push("product/prd.md does not quote the current attack result");
const logged = metrics.events.filter((e) => e.status === "instrumented").length;
if (!prd.includes(`${logged} of ${metrics.events.length} events logged`)) errors.push(`product/prd.md does not quote ${logged} of ${metrics.events.length} events logged`);
if (!readme.includes(`(${headline.attackTypes} attack types`)) errors.push(`README does not quote the current number of attack types (${headline.attackTypes})`);
for (const [a, b] of [["unsafeBlocked", "unsafeTotal"], ["safeAccepted", "safeTotal"]]) {
  const quoted = `${fmtN(headline[a])} / ${fmtN(headline[b])}`;
  if (!readme.includes(quoted)) errors.push(`README does not quote the current eval result "${quoted}" (${a})`);
}

// ── Validate risks ──────────────────────────────────────────────────────────
for (const r of risks.risks) {
  for (const f of r.controlEvidence) if (!existsSync(P(f))) errors.push(`risk ${r.id}: controlEvidence ${f} does not exist`);
  for (const l of r.linked) {
    if (/^[A-Z]{3}-\d{3}$/.test(l) && !l.startsWith("ADR-") && !E.has(l)) errors.push(`risk ${r.id}: unknown evidence ${l}`);
    if (/^ADR-\d{3}$/.test(l) && !decisionLog.includes(`## ${l}`)) errors.push(`risk ${r.id}: ${l} not in decision log`);
    const g = l.match(/^GAPS #(\d+)$/);
    if (g && !new RegExp(`^\\| ${g[1]} \\|`, "m").test(gaps)) errors.push(`risk ${r.id}: GAPS #${g[1]} not in GAPS.md`);
  }
}

// ── Validate the idea validation (ADR-011) ──────────────────────────────────
// Every verdict is on the declared scale; "validated" needs evidence; every
// evidence id exists; every option's reference resolves.
const OPTION_STATUS = ["build", "test", "wait", "dont"];
for (const c of validation.claims) {
  if (!validation.verdictScale[c.verdict]) errors.push(`validation ${c.id}: verdict '${c.verdict}' is not on the scale`);
  for (const id of c.evidence) if (!E.has(id)) errors.push(`validation ${c.id}: unknown evidence ${id}`);
  if (c.verdict === "validated" && c.evidence.length === 0) errors.push(`validation ${c.id}: a validated claim needs evidence`);
}
for (const v of validation.validated) {
  if (!v.evidence.length) errors.push(`validation finding '${v.finding}': needs evidence`);
  for (const id of v.evidence) if (!E.has(id)) errors.push(`validation finding '${v.finding}': unknown evidence ${id}`);
}
const REPAIR_TYPES = Object.keys(validation.repairTypes ?? {});
for (const c of validation.claims) {
  const r = c.repair;
  if (!r) { errors.push(`validation ${c.id}: every claim needs a repair path`); continue; }
  if (!REPAIR_TYPES.includes(r.type)) errors.push(`validation ${c.id}: repair type '${r.type}' must be one of ${REPAIR_TYPES.join("/")}`);
  if (!validation.verdictScale[r.after]) errors.push(`validation ${c.id}: repaired verdict '${r.after}' is not on the scale`);
  if (!Number.isInteger(r.stage) || r.stage < 1 || r.stage > validation.vision.length) errors.push(`validation ${c.id}: repair stage ${r.stage} is not a vision stage`);
  for (const id of r.evidence) if (!E.has(id)) errors.push(`validation ${c.id}: repair cites unknown evidence ${id}`);
  // Restating a claim does not validate it: "validated" after repair needs evidence.
  if (r.after === "validated" && r.evidence.length === 0) errors.push(`validation ${c.id}: a repaired claim marked validated needs evidence`);
  if (["red-line", "unverified", "folklore", "contradicted", "not-feasible"].includes(r.after)) errors.push(`validation ${c.id}: a repair must leave a claim testable, not '${r.after}'`);
  if (!r.proof) errors.push(`validation ${c.id}: a repair needs a proof that would validate it`);
}
for (const o of validation.options) {
  if (!OPTION_STATUS.includes(o.status)) errors.push(`validation option ${o.id}: status must be one of ${OPTION_STATUS.join("/")}`);
  if (!refOk(o.ref)) errors.push(`validation option ${o.id}: reference ${o.ref} does not resolve`);
}

if (errors.length) {
  console.error("product build: INVALID\n- " + errors.join("\n- "));
  process.exit(1);
}

// ── Compute ─────────────────────────────────────────────────────────────────
const r2 = (x) => Math.round(x * 100) / 100;
const r3 = (x) => Math.round(x * 1000) / 1000;
const FX = E.get("CST-004").value;
const outcomes = (seg) => segmentOutcomes(escTable, seg.scheduleKeys);
const wageInputs = { fxAedPerUsd: FX, uaeMonthlyAed: E.get("CST-002").value, usHourly: E.get("CST-001").value };
const baseWage = { UAE: marketWage("UAE", wageInputs), US: marketWage("US", wageInputs) };

function unit(v, market, seg) {
  return computeUnit(v, baseWage[market], outcomes(seg));
}

const V = (which) => Object.fromEntries(model.drivers.map((d) => [d.id, d[which]]));
const base = V("base");
const grid = {};
for (const m of model.markets) for (const seg of model.segments) grid[`${m.id}/${seg.id}`] = unit(base, m.id, seg);

// Tornado + bear/bull on the pilot reference case (UAE, standard segment).
const refMarket = "UAE";
const refSeg = model.segments.find((x) => x.id === "standard");
function sweep(metric, better) {
  const baseVal = unit(base, refMarket, refSeg)[metric];
  const bars = [];
  const bear = { ...base };
  const bull = { ...base };
  for (const d of model.drivers) {
    if (d.low === d.high) continue;
    const lo = unit({ ...base, [d.id]: d.low }, refMarket, refSeg)[metric];
    const hi = unit({ ...base, [d.id]: d.high }, refMarket, refSeg)[metric];
    const loWorse = better === "higher" ? lo < hi : lo > hi;
    bear[d.id] = loWorse ? d.low : d.high;
    bull[d.id] = loWorse ? d.high : d.low;
    bars.push({ driver: d.id, label: d.label, low: r3(lo), high: r3(hi), swing: r3(Math.abs(hi - lo)) });
  }
  bars.sort((a, b) => b.swing - a.swing);
  return { metric, base: r3(baseVal), bear: r3(unit(bear, refMarket, refSeg)[metric]), bull: r3(unit(bull, refMarket, refSeg)[metric]), tornado: bars.slice(0, 8) };
}
const sensitivity = {
  referenceCase: `${refMarket} / ${refSeg.id}`,
  clubRoi: sweep("clubRoi", "higher"),
  softwareGrossMargin: sweep("softwareGrossMargin", "higher"),
  managedBreakEvenPriceUsd: sweep("managedBreakEvenPriceUsd", "lower"),
};

// Pilot pass bars 2 and 3 must stay consistent with the model.
const ref = unit(base, "UAE", model.segments.find((x) => x.id === "standard"));
const breakEvenManualMinPerWeek = ((base.pricePerAthleteMonthUsd * 60) / ref.coachHourlyUsd + ref.coachMinutesWith) / 4.33;
const pilot = readFileSync(P("product/pilot-plan.md"), "utf8");
const bar = (n) => {
  const m = pilot.match(new RegExp(`^\\| ${n} \\| [^|]+\\| [≥≤] ([0-9.]+) \\|`, "m"));
  return m ? Number(m[1]) : NaN;
};
if (!(bar(2) >= breakEvenManualMinPerWeek)) errors.push(`pilot pass bar 2 (${bar(2)}) is below the UAE break-even of ${breakEvenManualMinPerWeek.toFixed(1)} hand-minutes per athlete-week`);
if (!(Math.abs(bar(3) - 1.5 * ref.coachMinutesWith) <= 1)) errors.push(`pilot pass bar 3 (${bar(3)}) is not 1.5 x the modelled ${ref.coachMinutesWith.toFixed(1)} coach minutes`);
if (!pilot.includes(`break-even at the modelled price is ${breakEvenManualMinPerWeek.toFixed(1)}`)) errors.push(`pilot plan does not quote the current break-even ${breakEvenManualMinPerWeek.toFixed(1)}`);
if (!pilot.includes(`modelled standard segment (${ref.coachMinutesWith.toFixed(1)})`)) errors.push(`pilot plan does not quote the modelled ${ref.coachMinutesWith.toFixed(1)} coach minutes`);
if (errors.length) {
  console.error("product build: INVALID\n- " + errors.join("\n- "));
  process.exit(1);
}

const athletesForArr = base.arrTargetUsd / (12 * base.pricePerAthleteMonthUsd);
const clubsForArr = athletesForArr / base.athletesPerClub;
const penetration = { arrTargetUsd: base.arrTargetUsd, athletes: Math.round(athletesForArr), clubs: Math.round(clubsForArr), shareOfHyroxGyms: r3(clubsForArr / base.hyroxGyms), hyroxGymsEvidence: "MKT-003", hyroxGymsGrade: E.get("MKT-003").grade };

const drivers = model.drivers;
const provenance = {
  drivers: drivers.length,
  evidenceBacked: drivers.filter((d) => d.evidence).length,
  hypotheses: drivers.filter((d) => d.hypothesis).length,
  decisions: drivers.filter((d) => d.decision).length,
  evidenceGrades: Object.fromEntries(["A", "B", "C", "D"].map((g) => [g, evidence.claims.filter((c) => c.grade === g).length])),
};

const round = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === "number" ? r3(v) : v]));
const output = {
  asOf: model.asOf,
  generatedBy: "product/scripts/build.mjs",
  provenance,
  unitEconomics: Object.fromEntries(Object.entries(grid).map(([k, v]) => [k, round(v)])),
  sensitivity,
  penetration,
  safety: ownExpected,
  headline,
  pilotReference: { breakEvenManualMinPerWeek: r3(breakEvenManualMinPerWeek), modelledCoachMinPerMonth: r3(ref.coachMinutesWith) },
  hybrid: {
    engineWeeksValid: hybrid.sets.engine_weeks_valid,
    adversarial: { n: hybrid.sets.adversarial_blocked.n, blocked: hybrid.sets.adversarial_blocked.blocked },
    safeAccepted: hybrid.sets.safe_proposals_accepted,
    amberAdaptation: hybrid.sets.amber_adaptation,
    painFlags: hybrid.sets.pain_flag_escalation,
    deliveredWeekValid: hybrid.sets.delivered_week_valid,
    amberOutcomesBySchedule: escTable,
  },
  risks: risks.risks.map((r) => ({ id: r.id, category: r.category, risk: r.risk, score: r.likelihood * r.impact, residual: r.residual.likelihood * r.residual.impact, likelihood: r.likelihood, impact: r.impact, mitigated: r.controlEvidence.length > 0 })),
};

// ── Render ──────────────────────────────────────────────────────────────────
const usd = (x) => `$${x.toFixed(2)}`;
const aed = (x) => `AED ${(x * FX).toFixed(0)}`;
const pct = (x) => `${Math.round(x * 100)}%`;
const HDR = (title) => `# ${title}\n\n> Status: GENERATED from \`product/data/*.json\` by \`product/scripts/build.mjs\` · As of ${model.asOf} · Do not edit by hand\n\n`;
const src = (ids) => (ids ?? []).map((id) => `[${id}](data/evidence.json)`).join(", ");

let fm = HDR("PolySync financial model");
fm += `**The answer first.** At the modelled price of ${usd(base.pricePerAthleteMonthUsd)} (${aed(base.pricePerAthleteMonthUsd)}) per athlete-month, PolySync is software for the club: gross margin is ${pct(grid["UAE/standard"].softwareGrossMargin)} and inference is ${usd(grid["UAE/standard"].inferenceUsd)} per athlete-month. Whether the club gets its money back depends on market and schedule segment. The US case pays back ${grid["US/flexible"].clubRoi.toFixed(1)}x for flexible athletes. The UAE pilot case is ${grid["UAE/standard"].clubRoi.toFixed(1)}x, because UAE coach wages are lower. If PolySync ran the coaching itself (the managed variant), a ${pct(base.targetGrossMargin)} margin would need about ${usd(grid["UAE/standard"].managedBreakEvenPriceUsd)} per athlete-month in the UAE and ${usd(grid["US/standard"].managedBreakEvenPriceUsd)} in the US. That is services pricing, not software.\n\n`;
fm += `**How much to trust it.** ${provenance.evidenceBacked} of ${provenance.drivers} drivers are evidence-backed and ${provenance.decisions} are recorded decisions. The other ${provenance.hypotheses} are hypotheses. Each hypothesis names the telemetry event or study that will replace it. The model is mainly a map of what the [pilot](pilot-plan.md) has to measure.\n\n`;
fm += `## Unit economics per athlete-month (base case)\n\nCoach time is the club's cost under B2B2C (ADR-001). PolySync's value is the coach time it saves; its own cost is inference, hosting and fees.\n\n`;
fm += `| Market / segment | Amber-day hard sessions kept (simulated) | Coach min with PolySync | Coach min by hand | Club value | Club ROI at ${usd(base.pricePerAthleteMonthUsd)} | Athletes per coach (hand → PolySync) | Software GM | Managed break-even price |\n|---|---|---|---|---|---|---|---|---|\n`;
for (const [k, u] of Object.entries(grid)) fm += `| ${k} | ${pct(u.keptRate)} | ${u.coachMinutesWith.toFixed(1)} | ${u.coachMinutesManual.toFixed(1)} | ${usd(u.clubValueUsd)} | ${u.clubRoi.toFixed(2)}x | ${Math.round(u.athletesPerCoachManual)} → ${Math.round(u.athletesPerCoachWith)} | ${pct(u.softwareGrossMargin)} | ${usd(u.managedBreakEvenPriceUsd)} |\n`;
fm += `\nOn an amber day the engine either keeps the hard session by moving it (no coach time), makes it easy in place and tells the coach a session was lost (a short review), or escalates. The rates come from the hybrid eval (\`evals/results/hybrid-latest.json\`), a simulation of the engine's own rules (OWN-002). Real rates are unmeasured (GAPS #14).\n\n`;
fm += `### What the table says\n\n`;
fm += `1. **Inference is not the business risk.** ${usd(grid["UAE/standard"].inferenceUsd)} per athlete-month at list price. The engine prescribes and the model only proposes and explains (ADR-004), so model spend per athlete is small and bounded; it is not what sets the margin.\n`;
fm += `2. **Coach capacity is the product.** A coach handles about ${Math.round(grid["UAE/standard"].athletesPerCoachManual)} hybrid athletes by hand in the hours modelled, and about ${Math.round(grid["UAE/standard"].athletesPerCoachWith)} with PolySync (standard segment). Sell that, not features.\n`;
fm += `3. **The UAE is a harder ROI market than the US.** Lower coach wages mean the same minutes saved are worth less, so the UAE pitch has to be capacity (more athletes per coach), not cost.\n`;
fm += `4. **Schedule shape decides training quality more than coach cost.** The engine keeps ${pct(grid["UAE/flexible"].keptRate)} of amber-day hard sessions for flexible athletes and ${pct(grid["UAE/rigid"].keptRate)} for rigid ones. The coach-time difference is small (${(grid["UAE/rigid"].coachMinutesWith - grid["UAE/flexible"].coachMinutesWith).toFixed(1)} min per athlete-month), so the case for segmenting is outcomes and retention, not cost (ADR-008).\n\n`;
const tornadoTable = (sw, fmt) => `| Driver | Low value → | High value → | Swing |\n|---|---|---|---|\n` + sw.tornado.map((b) => `| ${b.label} | ${fmt(b.low)} | ${fmt(b.high)} | ${fmt(b.swing)} |`).join("\n") + "\n";
fm += `## Sensitivity (reference case: ${sensitivity.referenceCase})\n\n`;
fm += `Bear takes the unfavourable end of every range at once; bull the favourable end.\n\n| Metric | Bear | Base | Bull |\n|---|---|---|---|\n`;
fm += `| Club ROI | ${sensitivity.clubRoi.bear.toFixed(2)}x | ${sensitivity.clubRoi.base.toFixed(2)}x | ${sensitivity.clubRoi.bull.toFixed(2)}x |\n`;
fm += `| Software gross margin | ${pct(sensitivity.softwareGrossMargin.bear)} | ${pct(sensitivity.softwareGrossMargin.base)} | ${pct(sensitivity.softwareGrossMargin.bull)} |\n`;
fm += `| Managed break-even price | ${usd(sensitivity.managedBreakEvenPriceUsd.bear)} | ${usd(sensitivity.managedBreakEvenPriceUsd.base)} | ${usd(sensitivity.managedBreakEvenPriceUsd.bull)} |\n\n`;
fm += `### What moves club ROI most\n\n${tornadoTable(sensitivity.clubRoi, (x) => `${x.toFixed(2)}x`)}\n`;
fm += `The top drivers are the pilot's measurement priorities: coach minutes by hand (baseline), the price, and the specialist wage premium.\n\n`;
fm += `## Required penetration, not a forecast\n\n$${(penetration.arrTargetUsd / 1e6).toFixed(1)}M ARR at ${usd(base.pricePerAthleteMonthUsd)} per athlete-month needs about **${penetration.athletes.toLocaleString("en-US")} active athletes**, or **${penetration.clubs} clubs** at ${base.athletesPerClub} athletes each. That is **${(penetration.shareOfHyroxGyms * 100).toFixed(1)}%** of ${base.hyroxGyms.toLocaleString("en-US")} HYROX-affiliated gyms. The gym count is company-reported, grade ${penetration.hyroxGymsGrade} ([MKT-003](data/evidence.json)), so treat this as order of magnitude.\n\n`;
fm += `## Drivers\n\n| Driver | Base | Range | Unit | Source |\n|---|---|---|---|---|\n`;
for (const d of drivers) fm += `| ${d.label} | ${d.base} | ${d.low}–${d.high} | ${d.unit} | ${d.evidence ? `Evidence: ${src(d.evidence)}` : d.decision ? `Decision: ${d.decision}` : `Hypothesis → measured by \`${d.hypothesis.measuredBy}\`${d.anchors ? `; anchored on ${src(d.anchors)}` : ""}`} |\n`;
fm += `\nCoach base wage: UAE AED ${fmtN(wageInputs.uaeMonthlyAed)}/month (CST-002, grade ${E.get("CST-002").grade}) ÷ ${HOURS_PER_MONTH} h ÷ ${FX} = ${usd(baseWage.UAE)}/h; US ${usd(wageInputs.usHourly)}/h (CST-001, grade ${E.get("CST-001").grade}). Both are multiplied by on-cost and specialist premium. Also available as a spreadsheet with live formulas: [polysync-unit-economics.xlsx](generated/polysync-unit-economics.xlsx).\n`;

let rr = HDR("PolySync risk register");
rr += `**${risks.risks.filter((r) => r.likelihood * r.impact >= 15).length} red, ${risks.risks.filter((r) => { const x = r.likelihood * r.impact; return x >= 8 && x < 15; }).length} amber, ${risks.risks.filter((r) => r.likelihood * r.impact < 8).length} green** before mitigation. ${risks.rule}\n\nScale: likelihood and impact 1–5; score = L × I; 15+ red, 8–14 amber, under 8 green.\n\n`;
rr += `| ID | Category | Risk | L×I | Residual | Trigger | Mitigation | Control evidence | Linked |\n|---|---|---|---|---|---|---|---|---|\n`;
for (const r of [...risks.risks].sort((a, b) => b.likelihood * b.impact - a.likelihood * a.impact)) {
  const score = r.likelihood * r.impact;
  const band = score >= 15 ? "red" : score >= 8 ? "amber" : "green";
  rr += `| ${r.id} | ${r.category} | ${r.risk} | ${score} (${band}) | ${r.residual.likelihood * r.residual.impact} | ${r.trigger} | ${r.mitigation} | ${r.controlEvidence.length ? r.controlEvidence.map((f) => `[\`${f.split("/").pop()}\`](../${f})`).join(", ") : "**None: unmitigated**"} | ${r.linked.join(", ")} |\n`;
}

let ev = HDR("PolySync evidence register");
ev += `**${evidence.claims.length} claims:** ${Object.entries(provenance.evidenceGrades).map(([g, n]) => `${n} grade ${g}`).join(", ")}. Grades: ${Object.entries(evidence.gradingRubric).map(([g, t]) => `**${g}** ${t}`).join(" ")}\n\n`;
ev += `| ID | Grade | Claim | Value | Source | Used in |\n|---|---|---|---|---|---|\n`;
for (const c of evidence.claims) {
  const val = c.value === null ? "—" : typeof c.value === "object" ? Object.entries(c.value).map(([k, v]) => `${k} ${v}`).join("; ") : `${c.value} ${c.unit}`;
  const link = c.url.startsWith("http") ? c.url : c.url.replace("../../", "../");
  ev += `| ${c.id} | ${c.grade} | ${c.claim} | ${val} | [${(c.source.length > 70 ? c.source.slice(0, 68).trimEnd() + "…" : c.source).replace(/\|/g, "/")}](${link}) | ${c.usedIn.join(", ") || "—"} |\n`;
}

let tp = HDR("PolySync telemetry plan");
tp += `**North star:** ${metrics.northStar.name}. ${metrics.northStar.why}\n\nFormula: \`${metrics.northStar.formula}\`\n\n`;
tp += `## Inputs\n\n| Metric | Formula | Why |\n|---|---|---|\n` + metrics.inputs.map((i) => `| ${i.name} | \`${i.formula}\` | ${i.why ?? ""} |`).join("\n") + "\n\n";
tp += `## Guardrails\n\n| Guardrail | Threshold | Action |\n|---|---|---|\n` + metrics.guardrails.map((g) => `| ${g.name} | ${g.threshold} | ${g.action} |`).join("\n") + "\n\n";
tp += `## Events\n\n${metrics.events.filter((e) => e.status === "instrumented").length} of ${metrics.events.length} are logged today as structured JSON lines; the rest are planned.\n\n| Event | Properties | Status | Replaces model hypothesis |\n|---|---|---|---|\n`;
for (const e of metrics.events) {
  const feeds = drivers.filter((d) => d.hypothesis?.measuredBy === `event:${e.name}`).map((d) => d.label);
  tp += `| \`${e.name}\` | ${e.properties.join(", ")} | ${e.status}${e.where ? ` (${e.where})` : ""} | ${feeds.join("; ") || "—"} |\n`;
}
tp += `\n## Studies (hypotheses no event can measure)\n\n| Study | What | When | Replaces |\n|---|---|---|---|\n`;
for (const st of metrics.studies) tp += `| ${st.id} | ${st.what} | ${st.when} | ${drivers.filter((d) => d.hypothesis?.measuredBy === `study:${st.id}`).map((d) => d.label).join("; ")} |\n`;

const CAP = { yes: "● Yes", claimed: "◐ Claimed", partial: "◐ Partial", no: "○ No", unknown: "? Unknown" };
let cl = HDR("PolySync competitive landscape");
cl += `**The finding.** ${competitors.finding}\n\n${competitors.method}\n\n`;
cl += `| Product | Category | Buyer | Price | ${Object.values(competitors.capabilities).map((x) => x.label).join(" | ")} | Note | Source |\n|---|---|---|---|${Object.keys(competitors.capabilities).map(() => "---").join("|")}|---|---|\n`;
for (const c of competitors.competitors) cl += `| ${c.name === "PolySync" ? "**PolySync**" : c.name} | ${c.category} | ${c.buyer} | ${c.price} | ${Object.keys(competitors.capabilities).map((k) => CAP[c[k]]).join(" | ")} | ${c.note} | ${c.evidence.map((id) => `[${id}](data/evidence.json)`).join(", ")} |\n`;
cl += `\n${Object.values(competitors.capabilities).map((x) => `**${x.label}:** ${x.description}.`).join(" ")}\n\n**Legend.** ● shown by our own CI · ◐ claimed by the vendor or partly present · ○ not offered · ? not stated.\n\n**What it means for the roadmap.** Stop selling the scheduler. Sell the coach console and the audit trail: the screens and evidence a club's head coach and risk owner need (ADR-009).\n`;

let rm = HDR("PolySync roadmap");
rm += `${roadmap.rule}\n\n`;
for (const hz of roadmap.horizons) {
  const done = hz.id === "done";
  rm += `## ${hz.label} · ${hz.window}\n\n| Item | Status | Reference |${done ? "" : " Why / gate |"}\n|---|---|---|${done ? "" : "---|"}\n`;
  for (const it of hz.items) {
    const ref = existsSync(P(it.ref)) ? `[\`${it.ref.split("/").pop()}\`](../${it.ref})` : it.ref;
    rm += `| ${it.title} | ${it.status} | ${ref} |${done ? "" : ` ${it.why ?? it.gate ?? ""} |`}\n`;
  }
  rm += "\n";
}

const VERDICT_MARK = { validated: "✓", "real-constraint": "!", plausible: "◐", misread: "✕", misused: "✕", unverified: "?", folklore: "?", contradicted: "✕", "not-feasible": "✕", "thin-margin": "◐", "red-line": "⛔" };
const STATUS_WORD = { build: "Build", test: "Test first", wait: "Wait", dont: "Don't build" };
let iv = HDR(validation.title);
iv += `**${validation.verdict.headline}** ${validation.verdict.summary}\n\n**Input.** ${validation.input}\n\n`;
iv += `## Claim by claim\n\n| # | Narrative | Claim | What the check found | Verdict | So what | Evidence |\n|---|---|---|---|---|---|---|\n`;
for (const c of validation.claims) iv += `| ${c.id} | ${c.narrative} | ${c.claim} | ${c.check} | ${VERDICT_MARK[c.verdict] ?? ""} **${c.verdict}** | ${c.implication} | ${src(c.evidence) || "—"} |\n`;
iv += `\n**Verdict scale.** ${Object.entries(validation.verdictScale).map(([k, v]) => `**${k}**: ${v}.`).join(" ")}\n\n`;
iv += `## What is validated\n\n${validation.validated.map((v) => `- ${v.finding} (${src(v.evidence)})`).join("\n")}\n\n`;
iv += `## One wedge, three gated options (ADR-011)\n\n| Track | Decision | Cheapest test before code | Kill criterion |\n|---|---|---|---|\n`;
for (const o of validation.options) iv += `| **${o.id}** · ${o.track} | ${STATUS_WORD[o.status]} | ${o.test} | ${o.kill} |\n`;
const tally = (key) => Object.entries(validation.claims.reduce((m, c) => ((m[key(c)] = (m[key(c)] ?? 0) + 1), m), {})).map(([k, n]) => `${n} ${k}`).join(", ");
iv += `\n## Claim repair plan\n\n${validation.repairRule}\n\n`;
iv += `**Before repair:** ${tally((c) => c.verdict)}. **After repair, before any test:** ${tally((c) => c.repair.after)}. No claim is left wrong or over a red line; nine still need their proof.\n\n`;
iv += `**Repair types.** ${Object.entries(validation.repairTypes).map(([k, v]) => `**${k}**: ${v}.`).join(" ")}\n\n`;
iv += `| # | Before | Repair | Type | Repaired claim | After | Proof that would validate it | Stage |\n|---|---|---|---|---|---|---|---|\n`;
for (const c of validation.claims) { const r = c.repair; iv += `| ${c.id} | ${VERDICT_MARK[c.verdict] ?? ""} ${c.verdict} | ${r.fix} | ${r.type} | ${r.restated}${r.evidence.length ? ` (${src(r.evidence)})` : ""} | ${VERDICT_MARK[r.after] ?? ""} **${r.after}** | ${r.proof} | ${r.stage} |\n`; }
iv += `\n## The repaired vision\n\nEach stage pays for the next and produces the data it needs. A stage starts only when its gate passes.\n\n| Stage | What PolySync becomes | Claims repaired here | Gate |\n|---|---|---|---|\n${validation.vision.map((v, i) => `| ${v.stage} | ${v.what} | ${validation.claims.filter((c) => c.repair.stage === i + 1).map((c) => c.id).join(", ") || "—"} | ${v.gate} |`).join("\n")}\n\n`;
iv += `## Where this could go wrong\n\n${validation.pushback.map((p) => `- ${p}`).join("\n")}\n\n`;
iv += `## Corrections to the input narrative\n\n${validation.corrections.map((c) => `- ${c}`).join("\n")}\n\n`;
iv += `## Where this lives\n\n- Data: [validation.json](data/validation.json) and new evidence in [evidence.json](data/evidence.json)\n- Decision: [ADR-011](../docs/10-decision-log.md#adr-011-one-wedge-three-gated-options-the-super-app-expansion-is-not-the-plan)\n- Risk: REG-03 in the [risk register](risk-register.md)\n- Roadmap: options and not-planned items in the [roadmap](roadmap.md)\n- ProjectOS: the Validation section\n`;

const files = {
  "product/financial-model.md": fm,
  "product/risk-register.md": rr,
  "product/evidence.md": ev,
  "product/telemetry-plan.md": tp,
  "product/competitive-landscape.md": cl,
  "product/roadmap.md": rm,
  "product/idea-validation-vision.md": iv,
  "product/generated/model-output.json": JSON.stringify(output, null, 2) + "\n",
};

let stale = [];
for (const [f, content] of Object.entries(files)) {
  const cur = existsSync(P(f)) ? readFileSync(P(f), "utf8") : null;
  if (CHECK) {
    if (cur !== content) stale.push(f);
  } else if (cur !== content) {
    mkdirSync(dirname(P(f)), { recursive: true });
    writeFileSync(P(f), content);
  }
}
if (CHECK && stale.length) {
  console.error(`product build: STALE — regenerate with 'node product/scripts/build.mjs':\n- ${stale.join("\n- ")}`);
  process.exit(1);
}
console.log(`product build OK: ${evidence.claims.length} evidence claims, ${drivers.length} drivers (${provenance.evidenceBacked} evidence, ${provenance.hypotheses} hypotheses, ${provenance.decisions} decisions), ${risks.risks.length} risks${CHECK ? ", generated files current" : ", files written"}`);
