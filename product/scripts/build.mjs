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
// No dependencies. Output is deterministic (no clock), so --check is exact.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const P = (...x) => join(ROOT, ...x);
const read = (f) => JSON.parse(readFileSync(P(f), "utf8"));
const CHECK = process.argv.includes("--check");

const evidence = read("product/data/evidence.json");
const model = read("product/data/model.json");
const risks = read("product/data/risks.json");
const metrics = read("product/data/metrics.json");
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
const escTable = hybrid.sets.amber_escalation_by_schedule.byDaysAndDoubles;
for (const seg of model.segments) for (const k of seg.scheduleKeys) if (!escTable[k]) errors.push(`segment ${seg.id}: no CI escalation data for ${k}`);

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

if (errors.length) {
  console.error("product build: INVALID\n- " + errors.join("\n- "));
  process.exit(1);
}

// ── Compute ─────────────────────────────────────────────────────────────────
const r2 = (x) => Math.round(x * 100) / 100;
const r3 = (x) => Math.round(x * 1000) / 1000;
const WEEKS = 4.33;
const FX = E.get("CST-004").value;
const escRate = (seg) => {
  let n = 0, e = 0;
  for (const k of seg.scheduleKeys) { n += escTable[k].n; e += escTable[k].escalated; }
  return e / n;
};
const baseWage = { UAE: 4556 / 173.33 / FX, US: E.get("CST-001").value };

function unit(v, market, seg) {
  const coachHourly = baseWage[market] * v.coachLoading * v.specialistPremium;
  const esc = escRate(seg);
  const escalations = v.amberDaysPerAthleteMonth * v.hardShareOnAmber * esc + v.painFlagsPerAthleteMonth + v.llmProposalsPerAthleteMonth * v.proposalRejectRate;
  const withMin = v.triageMinutesPerAthleteWeek * WEEKS + escalations * v.minutesPerEscalation;
  const manualMin = v.manualMinutesPerAthleteWeek * WEEKS;
  const savedMin = manualMin - withMin;
  const clubValue = (savedMin / 60) * coachHourly;
  const capacityMin = v.coachProgrammingHoursPerWeek * 60 * WEEKS;
  const inference = (v.llmCallsPerAthleteMonth * (v.llmTokensInPerProposal * v.priceInPer1M + v.llmTokensOutPerProposal * v.priceOutPer1M)) / 1e6;
  const price = v.pricePerAthleteMonthUsd;
  const softwareCogs = inference + v.infraPerAthleteMonthUsd + price * v.paymentFeeRate;
  const coachCost = (withMin / 60) * coachHourly;
  const managedBreakEven = (coachCost + inference + v.infraPerAthleteMonthUsd) / (1 - v.targetGrossMargin - v.paymentFeeRate);
  return {
    escalationRate: esc,
    escalationsPerAthleteMonth: escalations,
    coachMinutesWith: withMin,
    coachMinutesManual: manualMin,
    coachMinutesSaved: savedMin,
    coachHourlyUsd: coachHourly,
    clubValueUsd: clubValue,
    clubRoi: clubValue / price,
    athletesPerCoachManual: capacityMin / manualMin,
    athletesPerCoachWith: capacityMin / withMin,
    inferenceUsd: inference,
    softwareGrossMargin: 1 - softwareCogs / price,
    managedCoachCostUsd: coachCost,
    managedBreakEvenPriceUsd: managedBreakEven,
  };
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
  hybrid: {
    engineWeeksValid: hybrid.sets.engine_weeks_valid,
    adversarial: { n: hybrid.sets.adversarial_blocked.n, blocked: hybrid.sets.adversarial_blocked.blocked },
    safeAccepted: hybrid.sets.safe_proposals_accepted,
    amberAdaptation: hybrid.sets.amber_adaptation,
    painFlags: hybrid.sets.pain_flag_escalation,
    escalationBySchedule: escTable,
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
fm += `| Market / segment | Escalation rate (simulated) | Coach min with PolySync | Coach min by hand | Club value | Club ROI at ${usd(base.pricePerAthleteMonthUsd)} | Athletes per coach (hand → PolySync) | Software GM | Managed break-even price |\n|---|---|---|---|---|---|---|---|---|\n`;
for (const [k, u] of Object.entries(grid)) fm += `| ${k} | ${pct(u.escalationRate)} | ${u.coachMinutesWith.toFixed(1)} | ${u.coachMinutesManual.toFixed(1)} | ${usd(u.clubValueUsd)} | ${u.clubRoi.toFixed(2)}x | ${Math.round(u.athletesPerCoachManual)} → ${Math.round(u.athletesPerCoachWith)} | ${pct(u.softwareGrossMargin)} | ${usd(u.managedBreakEvenPriceUsd)} |\n`;
fm += `\nEscalation rates come from the hybrid eval (\`evals/results/hybrid-latest.json\`), a simulation of the engine's own rules (OWN-002). Real rates are unmeasured (GAPS #14).\n\n`;
fm += `### What the table says\n\n`;
fm += `1. **Inference is not the business risk.** ${usd(grid["UAE/standard"].inferenceUsd)} per athlete-month at list price. The engine prescribes and the model only proposes and explains (ADR-004), so model spend per athlete is small and bounded; it is not what sets the margin.\n`;
fm += `2. **Coach capacity is the product.** A coach handles about ${Math.round(grid["UAE/standard"].athletesPerCoachManual)} hybrid athletes by hand in the hours modelled, and about ${Math.round(grid["UAE/standard"].athletesPerCoachWith)} with PolySync (standard segment). Sell that, not features.\n`;
fm += `3. **The UAE is a harder ROI market than the US.** Lower coach wages mean the same minutes saved are worth less, so the UAE pitch has to be capacity (more athletes per coach), not cost.\n`;
fm += `4. **Rigid schedules cost coach time.** The rigid segment needs ${(grid["UAE/rigid"].coachMinutesWith - grid["UAE/flexible"].coachMinutesWith).toFixed(1)} more coach minutes per athlete-month than the flexible one (ADR-008).\n\n`;
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
fm += `\nCoach base wage: UAE AED 4,556/month (CST-002, grade B) ÷ 173.33 h ÷ ${FX} = ${usd(baseWage.UAE)}/h; US $22.67/h (CST-001, grade A). Both are multiplied by on-cost and specialist premium. Also available as a spreadsheet with live formulas: [polysync-unit-economics.xlsx](generated/polysync-unit-economics.xlsx).\n`;

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
  ev += `| ${c.id} | ${c.grade} | ${c.claim} | ${val} | [${c.source.split(",")[0].split(".")[0].slice(0, 60)}](${link}) | ${c.usedIn.join(", ") || "—"} |\n`;
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

const files = {
  "product/financial-model.md": fm,
  "product/risk-register.md": rr,
  "product/evidence.md": ev,
  "product/telemetry-plan.md": tp,
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
