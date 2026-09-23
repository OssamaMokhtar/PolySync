import "./styles.css";
import { computeUnit, marketWage, segmentOutcomes } from "../../product/scripts/model-core.mjs";
import { HYBRID_PARAMS, RULE_EVIDENCE, type HybridRuleId } from "../../app/src/engine/hybrid";
import { adrs, blob, outcomeTable, evidence, evidenceById, gaps, gradeRubric, hybridResults, model, modelOutput, passBars, risks, safetyResults, metrics, type Risk } from "./data";
import { chartCard, groupedColumns, h, legend, tableView, tornado } from "./charts";
import { engineDemo } from "./demo";
import { evidenceChip } from "./evidence";

const app = document.getElementById("app")!;
const fmt = {
  x: (v: number) => `${v.toFixed(v < 10 ? 2 : 1)}x`,
  usd: (v: number) => `$${v.toFixed(2)}`,
  pct: (v: number) => `${Math.round(v * 100)}%`,
  int: (v: number) => Math.round(v).toLocaleString("en-US"),
};
const FX = evidenceById.get("CST-004")!.value as number;
const WAGES = { fxAedPerUsd: FX, uaeMonthlyAed: evidenceById.get("CST-002")!.value as number, usHourly: evidenceById.get("CST-001")!.value as number };

// ── Theme toggle (explicit; defaults to the OS setting) ─────────────────────
function themeToggle(): HTMLElement {
  const b = h("button", { class: "btn no-print", type: "button", "aria-label": "Toggle colour theme" }, "Theme");
  b.addEventListener("click", () => {
    const cur = document.documentElement.dataset.theme ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("polysync-theme", next); } catch { /* storage unavailable */ }
  });
  return b;
}
try {
  const t = localStorage.getItem("polysync-theme");
  if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
} catch { /* storage unavailable */ }

// ── Sections ────────────────────────────────────────────────────────────────
const NAV = [
  ["overview", "Overview"],
  ["engine", "Engine"],
  ["economics", "Economics"],
  ["risks", "Risks"],
  ["pilot", "Pilot"],
  ["evidence", "Evidence"],
  ["decisions", "Decisions"],
] as const;

function header(): HTMLElement {
  const nav = h("nav", { class: "flex flex-wrap gap-x-4 gap-y-1 text-sm", "aria-label": "Sections" });
  for (const [id, label] of NAV) nav.append(h("a", { href: `#${id}` }, label));
  return h("header", { class: "sm:sticky top-0 z-40 border-b no-print", style: "background:color-mix(in oklab, var(--page) 88%, transparent);backdrop-filter:blur(8px);border-color:var(--ring)" },
    h("div", { class: "max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3" },
      h("div", { class: "flex items-baseline gap-3" }, h("span", { class: "font-semibold" }, "PolySync"), h("span", { class: "text-sm muted" }, "ProjectOS")),
      nav,
      h("div", { class: "flex items-center gap-2" }, h("a", { class: "text-sm", href: "https://github.com/OssamaMokhtar/PolySync" }, "Repository"), themeToggle())));
}

function sectionTitle(id: string, title: string, lead: string): HTMLElement {
  return h("div", { class: "mb-4", id }, h("h2", { class: "text-xl font-semibold" }, title), h("p", { class: "ink-2 mt-1 max-w-3xl" }, lead));
}

function stateLegend(): HTMLElement {
  const items: [string, string][] = [
    ["Measured", "produced by CI on every push"],
    ["Built", "code in this repo"],
    ["Simulated", "the engine's own rules, not real athletes"],
    ["Hypothesis", "a number the pilot will replace"],
  ];
  return h("div", { class: "flex flex-wrap gap-x-5 gap-y-1 text-xs ink-2" }, ...items.map(([k, v]) => h("span", {}, h("span", { class: "state" }, k), ` ${v}`)));
}

function statTile(label: string, value: string, sub: string, state: string): HTMLElement {
  return h("div", { class: "card p-4" }, h("div", { class: "text-sm ink-2" }, label), h("div", { class: "text-2xl font-semibold mt-1" }, value), h("div", { class: "text-xs muted mt-1" }, sub), h("div", { class: "state mt-2" }, state));
}

function overview(): HTMLElement {
  const s = safetyResults.sets;
  const hy = hybridResults.sets;
  const blocked = s.bounds_adversarial.blocked + hy.adversarial_blocked.blocked;
  const total = s.bounds_adversarial.n + hy.adversarial_blocked.n;
  const std = modelOutput as unknown as { unitEconomics: Record<string, Record<string, number>> };
  const uaeStd = std.unitEconomics["UAE/standard"];
  return h("section", { class: "flex flex-col gap-6" },
    h("div", { id: "overview" },
      h("p", { class: "state" }, `As of ${model.asOf} · generated from the repo at build time`),
      h("h1", { class: "text-3xl sm:text-4xl font-semibold mt-2 max-w-4xl leading-tight" }, "AI coaching for hybrid athletes, where the model can propose but never prescribe."),
      h("p", { class: "ink-2 mt-3 max-w-3xl" }, "A deterministic engine schedules strength, power and endurance under nine evidence-cited rules. The model explains and proposes; a proposal reaches the athlete only if every rule passes, and everything the engine cannot resolve goes to the club's coach. PolySync sells that coach capacity to clubs.")),
    h("div", { class: "card p-6" },
      h("div", { class: "text-sm ink-2" }, "Unsafe proposals blocked before reaching an athlete"),
      h("div", { class: "font-semibold mt-1", style: "font-size:clamp(40px, 9vw, 56px);line-height:1.05" }, `${fmt.int(blocked)} of ${fmt.int(total)}`),
      h("div", { class: "text-sm ink-2 mt-2" }, `${s.bounds_adversarial.n.toLocaleString("en-US")} single-plan attacks (${Object.keys(s.bounds_adversarial.byMutation).length} types) + ${hy.adversarial_blocked.n.toLocaleString("en-US")} hybrid-week attacks (${Object.keys(hy.adversarial_blocked.byMutation).length} types, including injected text, effort labelled easy, and a run 3.5 h after late squats end). Each blocked by the expected rule and routed to a coach. This shows the rules hold; it does not show a proposal that passes is a good plan.`),
      h("div", { class: "state mt-2" }, "Measured · CI")),
    h("div", { class: "grid sm:grid-cols-2 lg:grid-cols-4 gap-3" },
      statTile("Engine weeks breaking a blocking rule", `0 of ${fmt.int(hy.engine_weeks_valid.n_profiles)}`, "Across levels, priorities, schedules", "Measured · CI"),
      statTile("Contraindicated exercises in plans", `${s.contraindication_leak.contraindicated_exercises_in_plans} of ${fmt.int(s.contraindication_leak.n_plans)}`, "Injury filter + bounds checker", "Measured · CI"),
      statTile("Delivered weeks breaking a rule on a low-readiness day", `${fmt.int(hy.delivered_week_valid.invalid)} of ${fmt.int(hy.delivered_week_valid.n)}`, `Pain flags: ${fmt.int(hy.pain_flag_escalation.escalated)} of ${fmt.int(hy.pain_flag_escalation.n)} escalated`, "Measured · CI"),
      statTile("Athletes per coach, by hand → with PolySync", `${Math.round(uaeStd.athletesPerCoachManual)} → ${Math.round(uaeStd.athletesPerCoachWith)}`, "UAE, standard schedule segment", "Hypothesis + simulation")),
    stateLegend());
}

function rulesTable(): HTMLElement {
  const desc: Record<HybridRuleId, [string, string]> = {
    H1_CONFLICT_SEPARATION: [`At least ${HYBRID_PARAMS.minSeparationHours} h rest between conflicting hard sessions, end to start, across midnight`, "Blocks"],
    H2_POWER_AFTER_ENDURANCE: [`No power work within ${HYBRID_PARAMS.powerAfterEnduranceHours} h after endurance ends`, "Blocks"],
    H3_PRIORITY_FIRST: ["On a shared day, the athlete's block priority goes first (a proposal cannot relabel it)", "Blocks"],
    H4_CONFLICT_WITHIN_24H: [`Conflicting hard sessions under ${HYBRID_PARAMS.preferredSeparationHours} h apart`, "Coach attention"],
    H5_WEEKLY_LOAD_JUMP: [`Weekly load above +${HYBRID_PARAMS.maxWeeklyLoadIncrease * 100}% over last week, or the engine's week without history (a product limit, not an injury claim)`, "Blocks → coach"],
    H6_ACUTE_CHRONIC_ATTENTION: [`Acute:chronic above ${HYBRID_PARAMS.acwrAttention} (attention only; no sweet spot claimed)`, "Coach attention"],
    H7_READINESS: ["Red readiness: nothing autonomous; amber: no hard session", "Blocks → coach"],
    H8_UNAVAILABLE_DAY: ["Sessions only on days the athlete made available", "Blocks"],
    H9_MALFORMED: ["Not a possible week: injected text, overlaps, two sessions in one slot, effort outside the modality's RPE band", "Blocks"],
  };
  const t = h("table", { class: "data" });
  t.append(h("thead", {}, h("tr", {}, h("th", {}, "Rule"), h("th", {}, "What it enforces"), h("th", {}, "Severity"), h("th", {}, "Evidence"))));
  const tb = h("tbody", {});
  for (const id of Object.keys(desc) as HybridRuleId[]) {
    const ev = h("td", {});
    const ids = RULE_EVIDENCE[id];
    if (ids.length) ids.forEach((e) => ev.append(evidenceChip(e), " "));
    else ev.append(h("span", { class: "muted" }, "Product rule"));
    tb.append(h("tr", {}, h("td", { class: "font-mono text-xs" }, id.split("_")[0]), h("td", {}, desc[id][0]), h("td", { class: "ink-2" }, desc[id][1]), ev));
  }
  t.append(tb);
  return h("section", { class: "card p-5" },
    h("h3", { class: "font-semibold" }, "Why these rules"),
    h("p", { class: "text-sm ink-2 mt-1 max-w-3xl" }, "The largest recent meta-analysis found no significant interference on maximal strength or hypertrophy, but a significant loss in explosive strength, concentrated in same-session training. So the rules protect power and separate sessions; they do not treat all concurrent training as harmful. Parameters are literature defaults and are not yet coach-signed."),
    h("div", { class: "overflow-x-auto mt-3" }, t));
}

// ── Economics (reactive) ────────────────────────────────────────────────────
function economics(): HTMLElement {
  const D = Object.fromEntries(model.drivers.map((d) => [d.id, d]));
  const v: Record<string, number> = Object.fromEntries(model.drivers.map((d) => [d.id, d.base]));
  let market = "UAE";
  const sliders: [string, (x: number) => string, number][] = [
    ["pricePerAthleteMonthUsd", (x) => `$${x.toFixed(2)} (AED ${Math.round(x * FX)})`, 0.5],
    ["manualMinutesPerAthleteWeek", (x) => `${x} min`, 1],
    ["specialistPremium", (x) => `${x.toFixed(1)}x`, 0.1],
    ["coachLoading", (x) => `${x.toFixed(2)}x`, 0.05],
    ["triageMinutesPerAthleteWeek", (x) => `${x} min`, 0.5],
    ["minutesPerLostSession", (x) => `${x} min`, 0.5],
    ["amberDaysPerAthleteMonth", (x) => `${x} days`, 1],
  ];
  const tiles = h("div", { class: "grid sm:grid-cols-2 lg:grid-cols-4 gap-3" });
  const roiHolder = h("div", {});
  const controls = h("div", { class: "card p-5 flex flex-col gap-4" });

  const segCase = (mk: string, segId: string) => {
    const seg = model.segments.find((x) => x.id === segId)!;
    return computeUnit(v, marketWage(mk, WAGES), segmentOutcomes(outcomeTable, seg.scheduleKeys));
  };
  const renderAll = () => {
    const u = segCase(market, "standard");
    tiles.replaceChildren(
      statTile("Club ROI at this price", fmt.x(u.clubRoi), `${market}, standard segment · value of coach minutes saved ÷ price`, "Hypothesis-driven"),
      statTile("Athletes per coach", `${Math.round(u.athletesPerCoachManual)} → ${Math.round(u.athletesPerCoachWith)}`, "By hand → with PolySync, same coach hours", "Hypothesis + simulation"),
      statTile("PolySync software margin", fmt.pct(u.softwareGrossMargin), `Inference ${fmt.usd(u.inferenceUsd)} per athlete-month`, "Evidence price + hypotheses"),
      statTile("Managed-coaching break-even", fmt.usd(u.managedBreakEvenPriceUsd), "Price needed if PolySync employed the coach (70% margin)", "Not offered: services"),
    );
    const cats = model.segments.map((x) => x.id[0].toUpperCase() + x.id.slice(1));
    const series = model.markets.map((m, i) => ({ name: m.id, color: i === 0 ? "var(--s1)" : "var(--s2)", values: model.segments.map((sg) => segCase(m.id, sg.id).clubRoi) }));
    roiHolder.replaceChildren(chartCard(
      "Club ROI by schedule segment and market",
      "Value of coach minutes saved ÷ price. Recomputes with the controls; 1.0x is break-even for the club.",
      () => h("div", {}, legend(series), groupedColumns({ categories: cats, series, format: (x) => `${x.toFixed(1)}x`, yLabel: "Club ROI", refLine: { value: 1, label: "Break-even 1.0x" } })),
      () => tableView(["Segment", ...series.map((x) => `${x.name} ROI`)], cats.map((c, i) => [c, ...series.map((x) => fmt.x(x.values[i]))]), [1, 2]),
    ));
  };

  const mkBtns = h("div", { class: "flex gap-2", role: "group", "aria-label": "Market" });
  for (const m of model.markets) {
    const b = h("button", { class: "btn", type: "button", "aria-pressed": String(m.id === market), title: m.label }, m.id === "UAE" ? "UAE (pilot)" : "US (scale)");
    b.addEventListener("click", () => { market = m.id; mkBtns.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); renderAll(); });
    mkBtns.append(b);
  }
  controls.append(h("div", { class: "flex flex-wrap items-center justify-between gap-2" }, h("h3", { class: "font-semibold" }, "Change the assumptions"), mkBtns));
  for (const [id, show, step] of sliders) {
    const d = D[id];
    const out = h("span", { class: "tabnum font-semibold" }, show(v[id]));
    const input = h("input", { type: "range", min: String(d.low), max: String(d.high), step: String(step), value: String(d.base), "aria-label": d.label }) as HTMLInputElement;
    input.addEventListener("input", () => { v[id] = Number(input.value); out.textContent = show(v[id]); renderAll(); });
    controls.append(h("label", { class: "flex flex-col gap-1 text-sm" },
      h("span", { class: "flex justify-between gap-3" }, h("span", { class: "ink-2" }, d.label), out),
      input,
      h("span", { class: "text-xs muted" }, `Range ${d.low}–${d.high} · ${d.hypothesis ? `hypothesis, measured by ${d.hypothesis.measuredBy}` : "evidence"}`)));
  }
  const reset = h("button", { class: "btn self-start", type: "button" }, "Reset to base");
  reset.addEventListener("click", () => {
    for (const [id] of sliders) v[id] = D[id].base;
    controls.querySelectorAll<HTMLInputElement>("input[type=range]").forEach((i, k) => { i.value = String(D[sliders[k][0]].base); i.dispatchEvent(new Event("input")); });
  });
  controls.append(reset);

  // Amber-day outcomes by schedule (static CI data)
  const days = [3, 4, 5, 6, 7];
  const escSeries = [
    { name: "Doubles OK", color: "var(--s1)", values: days.map((d) => outcomeTable[`${d}d-doubles`].kept_rate) },
    { name: "One session a day", color: "var(--s2)", values: days.map((d) => outcomeTable[`${d}d-singles`].kept_rate) },
  ];
  const escCard = chartCard(
    "Training twice a day decides whether hard sessions survive a bad day",
    "Share of hard sessions the engine keeps by moving them on an amber-readiness day; the rest are made easy in place and the coach is told. Simulated across 3,240 profiles in CI; the pilot measures real rates.",
    () => h("div", {}, legend(escSeries), groupedColumns({ categories: days.map((d) => `${d} days`), series: escSeries, format: (x) => `${Math.round(x * 100)}%`, yLabel: "Hard sessions kept" })),
    () => tableView(["Days available", "Doubles OK", "One a day"], days.map((d, i) => [`${d}`, fmt.pct(escSeries[0].values[i]), fmt.pct(escSeries[1].values[i])]), [1, 2]),
  );

  const sens = modelOutput.sensitivity.clubRoi as { base: number; bear: number; bull: number; tornado: { label: string; low: number; high: number }[] };
  const torCard = chartCard(
    "What moves club ROI most (UAE, standard segment)",
    `Each driver at the low and high end of its range, others at base. Blue raises ROI, red lowers it. Bear case ${fmt.x(sens.bear)}, bull ${fmt.x(sens.bull)}: these are the pilot's measurement priorities.`,
    () => tornado({ base: sens.base, bars: sens.tornado, format: (x) => `${x.toFixed(2)}x`, lowLabel: "at low end", highLabel: "at high end" }),
    () => tableView(["Driver", "At low end", "At high end"], sens.tornado.map((b) => [b.label, fmt.x(b.low), fmt.x(b.high)]), [1, 2]),
  );

  const p = modelOutput.penetration;
  const prov = modelOutput.provenance;
  renderAll();
  return h("section", { class: "flex flex-col gap-4" },
    sectionTitle("economics", "Economics", `Under B2B2C the club's coaches review what the engine cannot resolve, so PolySync sells coach capacity. ${prov.evidenceBacked} of ${prov.drivers} drivers are evidence-backed and ${prov.hypotheses} are hypotheses, each mapped to the event or study that will replace it.`),
    tiles,
    h("div", { class: "grid lg:grid-cols-[340px_minmax(0,1fr)] gap-4" }, controls, h("div", { class: "min-w-0" }, roiHolder)),
    h("div", { class: "grid lg:grid-cols-2 gap-4 [&>*]:min-w-0" }, escCard, torCard),
    h("p", { class: "text-sm ink-2" }, `Required penetration, not a forecast: $1M ARR at the base price needs about ${fmt.int(p.athletes)} athletes, or ${p.clubs} clubs, about ${(p.shareOfHyroxGyms * 100).toFixed(1)}% of HYROX-affiliated gyms (company-reported, grade ${p.hyroxGymsGrade}). `, h("a", { href: blob("product/financial-model.md") }, "Full model"), " · ", h("a", { href: blob("product/generated/polysync-unit-economics.xlsx") }, "Spreadsheet with live formulas")));
}

// ── Risks ───────────────────────────────────────────────────────────────────
function riskSection(): HTMLElement {
  let mode: "inherent" | "residual" = "inherent";
  const grid = h("div", {});
  const list = h("div", { class: "flex flex-col gap-2" });
  const band = (x: number) => (x >= 15 ? ["critical", "var(--critical)", "▲"] : x >= 8 ? ["warning", "var(--warning)", "◆"] : ["good", "var(--good)", "●"]) as [string, string, string];
  const LI = (r: Risk) => (mode === "inherent" ? [r.likelihood, r.impact] : [r.residual.likelihood, r.residual.impact]);
  const showList = (items: Risk[], title: string) => {
    list.replaceChildren(h("div", { class: "text-sm font-semibold" }, title));
    for (const r of items.sort((a, b) => a.id.localeCompare(b.id))) {
      const [l, i] = LI(r);
      const ctrl = r.controlEvidence.length ? h("span", {}, ...r.controlEvidence.map((f, k) => h("span", {}, k ? ", " : "", h("a", { href: blob(f) }, f.split("/").pop()!)))) : h("span", { style: "color:var(--bad-ink)" }, "None: unmitigated");
      list.append(h("div", { class: "rounded-md p-3 text-sm", style: "background:var(--surface-2)" },
        h("div", { class: "flex flex-wrap items-center gap-2" }, h("span", { class: "font-mono text-xs font-semibold" }, r.id), h("span", { class: "state" }, r.category), h("span", { class: "text-xs ink-2 tabnum" }, `L${l} × I${i} = ${l * i}`)),
        h("div", { class: "mt-1" }, r.risk),
        h("div", { class: "ink-2 mt-1" }, h("span", { class: "font-semibold" }, "Trigger: "), r.trigger),
        h("div", { class: "ink-2" }, h("span", { class: "font-semibold" }, "Mitigation: "), r.mitigation),
        h("div", { class: "ink-2" }, h("span", { class: "font-semibold" }, "Control evidence: "), ctrl)));
    }
  };
  const render = () => {
    const W = 5;
    const g = h("div", { class: "grid gap-[2px]", style: "grid-template-columns:auto repeat(5, minmax(44px,1fr))", role: "grid", "aria-label": "Risk heatmap: likelihood by impact" });
    for (let l = W; l >= 1; l--) {
      g.append(h("div", { class: "text-xs muted pr-2 flex items-center justify-end" }, l === 5 ? "Likely 5" : l === 1 ? "Rare 1" : String(l)));
      for (let i = 1; i <= W; i++) {
        const here = risks.filter((r) => { const [a, b] = LI(r); return a === l && b === i; });
        const [name, color, icon] = band(l * i);
        const cell = h("button", { type: "button", class: "rounded-sm text-xs flex flex-col items-center justify-center min-h-[44px]", style: `background:color-mix(in oklab, ${color} ${here.length ? 34 : 10}%, var(--surface));color:var(--ink);border:none;cursor:${here.length ? "pointer" : "default"}`, "aria-label": `Likelihood ${l}, impact ${i}, ${name}: ${here.length} risks` },
          here.length ? h("span", { class: "font-semibold" }, `${icon} ${here.length}`) : "",
          here.length ? h("span", { class: "muted" }, here.map((r) => r.id).join(" ")) : "");
        if (here.length) cell.addEventListener("click", () => showList(here, `Likelihood ${l} × impact ${i}`));
        g.append(cell);
      }
    }
    g.append(h("div", {}));
    for (let i = 1; i <= W; i++) g.append(h("div", { class: "text-xs muted text-center pt-1" }, i === 5 ? "Severe 5" : i === 1 ? "1" : String(i)));
    grid.replaceChildren(g, h("div", { class: "text-xs muted mt-2" }, "Impact →   ·   ▲ red 15+ · ◆ amber 8–14 · ● green < 8"));
    showList([...risks].filter((r) => { const [a, b] = LI(r); return a * b >= 15; }), mode === "inherent" ? "Red before mitigation" : "Red after mitigation");
  };
  const toggle = h("div", { class: "flex gap-2", role: "group", "aria-label": "Inherent or residual" });
  for (const m of ["inherent", "residual"] as const) {
    const b = h("button", { class: "btn", type: "button", "aria-pressed": String(m === mode) }, m === "inherent" ? "Before mitigation" : "After mitigation");
    b.addEventListener("click", () => { mode = m; toggle.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); render(); });
    toggle.append(b);
  }
  render();
  const unmitigated = risks.filter((r) => !r.controlEvidence.length).length;
  return h("section", {},
    sectionTitle("risks", "Risks", `${risks.length} risks scored likelihood × impact. A mitigation counts only if it points to a test, CI gate or decision in the repo; ${unmitigated} ${unmitigated === 1 ? "has" : "have"} none yet and ${unmitigated === 1 ? "is" : "are"} scored as unmitigated.`),
    h("div", { class: "card p-5 grid lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-6" }, h("div", { class: "min-w-0" }, toggle, h("div", { class: "mt-4 overflow-x-auto" }, grid)), h("div", { class: "min-w-0" }, list)),
    h("p", { class: "text-sm mt-2" }, h("a", { href: blob("product/risk-register.md") }, "Full risk register")));
}

function pilotSection(): HTMLElement {
  return h("section", {},
    sectionTitle("pilot", "Pilot", "UAE, 3 HYROX training clubs, 8 weeks, flexible-schedule athletes first. The pass bars were set before any data exists, so the result cannot be argued into a win."),
    h("div", { class: "card p-5 overflow-x-auto" }, tableView(["#", "Measure", "Pass", "Fails means"], passBars.map((b) => [b.n, b.measure, b.pass, b.fails]))),
    h("p", { class: "text-sm mt-2" }, h("a", { href: blob("product/pilot-plan.md") }, "Pilot plan"), " · ", h("a", { href: blob("product/telemetry-plan.md") }, `Telemetry plan (${metrics.events.length} events, ${metrics.studies.length} studies)`)));
}

function evidenceSection(): HTMLElement {
  const grades = new Set(["A", "B", "C", "D"]);
  let q = "";
  const body = h("div", { class: "overflow-x-auto" });
  const render = () => {
    const rows = evidence.filter((c) => grades.has(c.grade) && (q === "" || `${c.id} ${c.claim} ${c.source}`.toLowerCase().includes(q)));
    const t = h("table", { class: "data" });
    t.append(h("thead", {}, h("tr", {}, h("th", {}, "Id"), h("th", {}, "Grade"), h("th", {}, "Claim"), h("th", {}, "Source"))));
    const tb = h("tbody", {});
    for (const c of rows) {
      const url = c.url.startsWith("http") ? c.url : blob(c.url);
      tb.append(h("tr", {}, h("td", {}, evidenceChip(c.id)), h("td", {}, h("span", { class: "grade" }, c.grade)), h("td", {}, c.claim), h("td", { class: "ink-2" }, h("a", { href: url, target: "_blank", rel: "noopener" }, (c.source.length > 70 ? c.source.slice(0, 68).trimEnd() + "…" : c.source)))));
    }
    t.append(tb);
    body.replaceChildren(rows.length ? t : h("p", { class: "text-sm ink-2" }, "No claims match."));
  };
  const chips = h("div", { class: "flex flex-wrap gap-2 items-center" });
  for (const g of ["A", "B", "C", "D"]) {
    const n = evidence.filter((c) => c.grade === g).length;
    const b = h("button", { class: "chip", type: "button", "aria-pressed": "true", title: gradeRubric[g] }, `Grade ${g} · ${n}`);
    b.addEventListener("click", () => { if (grades.has(g)) grades.delete(g); else grades.add(g); b.setAttribute("aria-pressed", String(grades.has(g))); render(); });
    chips.append(b);
  }
  const search = h("input", { type: "search", placeholder: "Search claims", "aria-label": "Search claims" }) as HTMLInputElement;
  search.addEventListener("input", () => { q = search.value.toLowerCase(); render(); });
  chips.append(search);
  render();
  return h("section", {},
    sectionTitle("evidence", "Evidence", `${evidence.length} claims, each graded and linked to the page it came from. D-grade claims can never feed the model; the build fails if one does.`),
    h("div", { class: "card p-5 flex flex-col gap-3" }, chips, body));
}

function decisionsSection(): HTMLElement {
  const adrList = h("ul", { class: "flex flex-col gap-2 text-sm" }, ...adrs.map((a) => h("li", {}, h("a", { href: `${blob("docs/10-decision-log.md")}#${a.anchor}` }, `${a.id}: ${a.title}`), a.status ? h("span", { class: "muted" }, ` · ${a.status}`) : "")));
  const open = gaps.filter((g) => !/^Resolved/.test(g.status));
  const gapTable = tableView(["#", "Gap", "Status"], open.map((g) => [g.id, g.gap, g.status]));
  return h("section", {},
    sectionTitle("decisions", "Decisions and open gaps", "Every decision names what was rejected and what evidence would reverse it. Open gaps are ranked by how badly they undermine credibility."),
    h("div", { class: "grid lg:grid-cols-2 gap-4 [&>*]:min-w-0" },
      h("div", { class: "card p-5" }, h("h3", { class: "font-semibold mb-3" }, `Decision log (${adrs.length} ADRs)`), adrList),
      h("div", { class: "card p-5 overflow-x-auto" }, h("h3", { class: "font-semibold mb-3" }, `Open gaps (${open.length})`), gapTable, h("p", { class: "text-sm mt-2" }, h("a", { href: blob("docs/GAPS.md") }, "All gaps, including resolved")))));
}

function footer(): HTMLElement {
  return h("footer", { class: "text-sm muted py-10 border-t mt-12", style: "border-color:var(--ring)" },
    h("p", {}, "Generated at build time from product/data, evals/results and docs in the ", h("a", { href: "https://github.com/OssamaMokhtar/PolySync" }, "PolySync repository"), ". Every number is read from those files when the page is built; the words around them are written by hand."),
    h("p", { class: "mt-1" }, "Ossama Mokhtar · Dubai, UAE"));
}

app.append(
  header(),
  h("main", { class: "max-w-6xl mx-auto px-4 py-8 flex flex-col gap-14" },
    overview(),
    h("section", { class: "flex flex-col gap-4" }, sectionTitle("engine", "Engine", "Change the athlete, then try a model proposal. The verdicts come from the same code CI tests."), engineDemo(), rulesTable()),
    economics(),
    riskSection(),
    pilotSection(),
    evidenceSection(),
    decisionsSection(),
    footer()));
