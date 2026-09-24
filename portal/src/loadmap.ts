// Athlete screen: "Load". Polished from the Claude Design "Body Impact"
// exploration (docs/13 §7). Every number comes from the production engine
// (engine/hybrid.ts): the week it generates, minutes × RPE per
// session, and adaptDay() for a low-readiness day. Nothing is typed in.
import {
  adaptDay,
  generateHybridWeek,
  sessionLoad,
  weeklyLoad,
  type Adaptation,
  type HybridProfile,
  type HybridSession,
  type HybridWeek,
  type Modality,
} from "../../engine/hybrid";
import { h } from "./charts";
import { BODY, REGION_LABEL, regionLoads, type Region } from "../../engine/bodymodel";

const NS = "http://www.w3.org/2000/svg";
const svg = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, ...kids: SVGElement[]) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  e.append(...kids);
  return e;
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const COACH = "Sara";

const MOD_LABEL: Record<Modality, string> = { strength: "Strength", power: "Power", endurance_hard: "Hard run", endurance_easy: "Easy run" };
// Validated categorical palette, dark steps (same entity → same colour as the engine demo).
const MOD_COLOR: Record<Modality, string> = { strength: "#3987e5", endurance_hard: "#d95926", power: "#199e70", endurance_easy: "#c98500" };
// Sequential single-hue ramp (low → high), stepped for a dark surface.
const RAMP = ["#44572a", "#5b7d2a", "#77a82f", "#a2d241", "#d4f482"];
const binOf = (v: number, max: number) => (max <= 0 ? 0 : Math.min(4, Math.floor((v / max) * 5 - 1e-9)));

// ── Screen ──────────────────────────────────────────────────────────────────
export function loadMapScreen(): HTMLElement {
  const profile: HybridProfile = { level: "intermediate", priority: "endurance", availableDays: [0, 1, 2, 3, 5], strengthSessions: 2, powerSessions: 1, hardEnduranceSessions: 2, easyEnduranceSessions: 2, allowDoubles: true, sessionMinutes: 60 };
  const plan = generateHybridWeek(profile);
  const st: { view: "front" | "back"; region: Region | null; day: number | null; readiness: "amber" | "red" } = { view: "front", region: "quads", day: null, readiness: "amber" };

  const screen = h("div", { class: "phone", role: "group", "aria-label": "PolySync athlete app, Load screen (prototype)" });
  const render = () => {
    let week = plan;
    let a: Adaptation | null = null;
    if (st.day !== null) {
      a = adaptDay(plan, profile, { day: st.day, readiness: st.readiness, yesterday: st.day > 0 ? { modality: "strength", rpe: 9, lowerBody: true } : undefined });
      if (!a.escalate) week = a.week;
    }
    const regions = regionLoads(week);
    const total = weeklyLoad(week);
    const max = Math.max(...Object.values(regions).map((r) => r.load));

    // Header
    const head = h("header", { class: "ph-head" },
      h("div", { class: "ph-eyebrow" }, "Week of 21 Sep · Endurance block"),
      h("h1", { class: "ph-title" }, "Load"),
      h("p", { class: "ph-sub" }, "Where this week's training lands, from your planned and logged sessions (minutes × effort)."));

    // Body map
    const seg = h("div", { class: "ph-seg", role: "radiogroup", "aria-label": "Body view" });
    for (const v of ["front", "back"] as const) {
      const b = h("button", { type: "button", role: "radio", "aria-checked": String(st.view === v) }, v === "front" ? "Front" : "Back");
      b.addEventListener("click", () => { st.view = v; render(); });
      seg.append(b);
    }
    const defs = svg("defs", {}, svg("pattern", { id: "ph-hatch", width: 6, height: 6, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, svg("rect", { width: 6, height: 6, fill: "#1b2124" }), svg("line", { x1: 0, y1: 0, x2: 0, y2: 6, stroke: "#2c3438", "stroke-width": 2 })));
    const body = svg("svg", { viewBox: "0 0 200 400", class: "ph-body", role: "img", "aria-label": `${st.view === "front" ? "Front" : "Back"} body map. ${Object.entries(regions).sort((x, y) => y[1].load - x[1].load).map(([r, v]) => `${REGION_LABEL[r as Region]} ${v.load}`).join(", ")}. Upper body not programmed yet.` }, defs);
    for (const sh of BODY[st.view]) {
      if (!sh.region) { body.append(svg("path", { d: sh.d, fill: "url(#ph-hatch)", stroke: "#0e1214", "stroke-width": 2 })); continue; }
      const r = sh.region;
      const p = svg("path", { d: sh.d, fill: RAMP[binOf(regions[r].load, max)], stroke: st.region === r ? "#f4f7f2" : "#0e1214", "stroke-width": st.region === r ? 2.5 : 2, tabindex: 0, role: "button", "aria-label": `${REGION_LABEL[r]}: load ${regions[r].load}, ${Math.round((regions[r].load / total) * 100)}% of the week`, "aria-pressed": String(st.region === r), class: "ph-region" });
      const pick = () => { st.region = r; render(); };
      p.addEventListener("click", pick);
      p.addEventListener("keydown", (e) => { if ((e as KeyboardEvent).key === "Enter" || (e as KeyboardEvent).key === " ") { e.preventDefault(); pick(); } });
      body.append(p);
    }
    const legend = h("div", { class: "ph-legend", "aria-hidden": "true" },
      h("span", {}, "Lower"), ...RAMP.map((c) => h("i", { style: `background:${c}` })), h("span", {}, "Higher"),
      h("span", { class: "ph-untracked" }, h("i", { class: "hatch" }), "Not programmed yet"));

    // Every region as text: the table view for the map (colour is never the only carrier)
    const ranked = (Object.entries(regions) as [Region, { load: number }][]).sort((x, y) => y[1].load - x[1].load);
    const table = h("ul", { class: "ph-rank", "aria-label": "Load by region" }, ...ranked.map(([r, v]) => {
      const b = h("button", { type: "button", "aria-pressed": String(st.region === r) }, h("span", { class: "ph-sw", style: `background:${RAMP[binOf(v.load, max)]}` }), REGION_LABEL[r], h("b", {}, `${v.load}`));
      b.addEventListener("click", () => { st.region = r; render(); });
      return h("li", {}, b);
    }));

    // Region detail
    const R = st.region ?? "quads";
    const from = regions[R].from.filter((x) => x.load > 0).sort((x, y) => y.load - x.load);
    const detail = h("div", { class: "ph-card", "aria-live": "polite" },
      h("div", { class: "ph-row" }, h("h2", { class: "ph-h2" }, REGION_LABEL[R]), h("span", { class: "ph-num" }, `${regions[R].load}`, h("small", {}, ` · ${Math.round((regions[R].load / total) * 100)}% of week`))),
      h("ul", { class: "ph-list" }, ...from.slice(0, 4).map((x) => h("li", {},
        h("span", { class: "ph-dot", style: `background:${MOD_COLOR[x.s.modality]}` }),
        h("span", {}, `${DAYS[x.s.day]} ${String(x.s.startHour).padStart(2, "0")}:00 · ${MOD_LABEL[x.s.modality]}`),
        h("span", { class: "ph-dim" }, `${x.s.minutes} min · RPE ${x.s.rpe}`),
        h("span", { class: "ph-numsm" }, `${Math.round(x.load)}`))),
        ...(from.length > 4 ? [h("li", { class: "ph-more" }, h("span", {}), h("span", { class: "ph-dim" }, `+ ${from.length - 4} more session${from.length - 4 > 1 ? "s" : ""}`), h("span", { class: "ph-numsm" }, `${Math.round(from.slice(4).reduce((t, x) => t + x.load, 0))}`))] : [])),
      h("p", { class: "ph-foot" }, "Tap another region to compare. Share of each session per region follows mapping v1, a display estimate that is not coach-signed yet."));

    // Readiness strip → engine adaptation
    const strip = h("div", { class: "ph-days", role: "group", "aria-label": "Simulate readiness for a day" });
    for (let d = 0; d < 7; d++) {
      const hard = plan.sessions.some((x) => x.day === d && x.modality !== "endurance_easy");
      const avail = profile.availableDays.includes(d);
      const state = st.day === d ? st.readiness : "green";
      const b = h("button", { type: "button", class: `ph-day ${state}`, "aria-label": `${DAYS[d]}: ${!avail ? "rest day" : state === "green" ? "ready" : state === "amber" ? "low readiness" : "pain or illness"}. ${hard ? "Tap to change." : ""}`, ...(hard ? {} : { disabled: "" }) },
        h("span", { class: "ph-dayname" }, DAYS[d]),
        h("span", { class: "ph-dayicon", "aria-hidden": "true" }, !avail ? "–" : state === "green" ? "●" : state === "amber" ? "◐" : "✕"),
        h("span", { class: "ph-daylabel" }, !avail ? "Rest" : state === "green" ? "Ready" : state === "amber" ? "Low" : "Pain"));
      if (hard) b.addEventListener("click", () => {
        if (st.day !== d) { st.day = d; st.readiness = "amber"; }
        else if (st.readiness === "amber") st.readiness = "red";
        else st.day = null;
        render();
      });
      strip.append(b);
    }

    // What changed (the engine and the coach are the actors, never "AI")
    let changed: HTMLElement;
    if (!a) {
      changed = h("div", { class: "ph-card ph-quiet" }, h("h2", { class: "ph-h2" }, "What changed"), h("p", { class: "ph-dim" }, "Nothing this week. Tap a day above to see what the engine does when readiness drops."));
    } else {
      const title = { moved: `${DAYS[st.day!]}'s hard session moves to a later day`, downgraded: `${DAYS[st.day!]} becomes an easy session`, escalated: `Coach ${COACH} decides ${DAYS[st.day!]}`, unchanged: "No change needed" }[a.outcome];
      const who = a.outcome === "moved" ? "Kept by the engine; nothing lost." : a.outcome === "downgraded" ? `Coach ${COACH} is told the session was lost.` : a.outcome === "escalated" ? `No automatic change. ${COACH} reviews by 6 pm.` : "";
      const rules = [...new Set(a.steps.map((s0) => s0.rule).filter((r) => /^H\d/.test(r)))];
      changed = h("div", { class: `ph-card ph-change ${a.outcome}` },
        h("div", { class: "ph-eyebrow" }, a.outcome === "escalated" ? "✕ Coach review" : a.outcome === "downgraded" ? "◐ Made easy" : "● Moved"),
        h("h2", { class: "ph-h2" }, title),
        h("p", { class: "ph-dim" }, who),
        h("div", { class: "ph-rules" }, ...rules.map((r) => h("span", { class: "ph-rule" }, r.replace(/_/g, " ").replace(/^(H\d) /, "$1 · ").toLowerCase().replace(/^h/, "H")))));
    }

    // Balance bar (categorical: same entity colours as the engine demo)
    const byMod = (["strength", "power", "endurance_hard", "endurance_easy"] as Modality[]).map((m) => ({ m, load: week.sessions.filter((x) => x.modality === m).reduce((t, x) => t + sessionLoad(x), 0) })).filter((x) => x.load > 0);
    const bar = h("div", { class: "ph-bar", role: "img", "aria-label": `Week balance: ${byMod.map((x) => `${MOD_LABEL[x.m]} ${Math.round((x.load / total) * 100)}%`).join(", ")}` },
      ...byMod.map((x) => h("span", { style: `flex:${x.load};background:${MOD_COLOR[x.m]}` })));
    const barLabels = h("ul", { class: "ph-barlabels" }, ...byMod.map((x) => h("li", {}, h("span", { class: "ph-dot", style: `background:${MOD_COLOR[x.m]}` }), `${MOD_LABEL[x.m]} `, h("b", {}, `${Math.round((x.load / total) * 100)}%`))));

    // Tiles
    const hardPlanned = plan.sessions.filter((x) => x.modality !== "endurance_easy").length;
    const hardKept = week.sessions.filter((x) => x.modality !== "endurance_easy").length;
    const delta = Math.round((total / weeklyLoad(plan) - 1) * 100);
    const tiles = h("div", { class: "ph-tiles" },
      h("div", { class: "ph-tile" }, h("div", { class: "ph-tl" }, "Weekly load"), h("div", { class: "ph-tv" }, total.toLocaleString("en-US")), h("div", { class: "ph-ts" }, delta === 0 ? "As planned" : `${delta > 0 ? "+" : ""}${delta}% vs plan`)),
      h("div", { class: "ph-tile" }, h("div", { class: "ph-tl" }, "Hard sessions"), h("div", { class: "ph-tv" }, `${hardKept}`, h("small", {}, ` / ${hardPlanned}`)), h("div", { class: "ph-ts" }, hardKept === hardPlanned ? "All kept" : "One made easy")),
      h("div", { class: "ph-tile" }, h("div", { class: "ph-tl" }, "Limit"), h("div", { class: "ph-tv" }, "+10%"), h("div", { class: "ph-ts" }, "Max weekly rise (H5)")));

    screen.replaceChildren(
      h("div", { class: "ph-status", "aria-hidden": "true" }, h("span", {}, "9:41"), h("span", {}, "●●● ▮")),
      h("div", { class: "ph-scroll" },
        head,
        h("section", { class: "ph-card ph-mapcard", "aria-label": "Body map" }, h("div", { class: "ph-row" }, h("h2", { class: "ph-h2" }, "By region"), seg), body, legend, table),
        detail,
        h("section", { "aria-label": "Readiness" }, h("h2", { class: "ph-h2 ph-pad" }, "Readiness"), strip),
        changed,
        h("section", { class: "ph-card", "aria-label": "Week balance" }, h("h2", { class: "ph-h2" }, "Week balance"), bar, barLabels),
        tiles,
        h("p", { class: "ph-legal" }, "Estimates from session type, minutes and effort. Not a medical assessment, and not a prediction of injury.")),
      h("nav", { class: "ph-tabs", "aria-label": "App sections (prototype)" }, ...["Today", "Week", "Load", "Coach"].map((t) => h("span", t === "Load" ? { class: "on", "aria-current": "page" } : {}, t))));
  };
  render();
  return screen;
}

export const BEFORE_AFTER: [string, string, string][] = [
  ["\"Injury Risk\" card and \"reduced injury risk −15%\"", "Removed. Footer says it is not an injury prediction", "ADR-007: the evidence does not support injury prediction; REG-02"],
  ["\"LIVE · All sources synced\", VO2 Max, Overall Fitness 82", "Only what the engine knows: planned and logged sessions, minutes × effort, readiness", "No wearable integration exists; every number must come from the engine or telemetry (docs/13 §5)"],
  ["\"AI Coach Insights\" with unsourced percentages", "\"What changed\": the engine's decision, the rule behind it, and the named coach", "The engine and the coach are the actors (ADR-004, docs/13 U8)"],
  ["Red means \"peak adaptation\" (good); red and green carry meaning alone", "One-hue ramp for load; readiness as icon + word (● Ready, ◐ Low, ✕ Pain)", "Red is reserved for risk; colour is never the only signal (WCAG 1.4.1)"],
  ["WebGL mannequin from a CDN; blank in 2 of 5 of the project's own captures", "2D SVG front/back map: renders instantly, works offline, is accessible to screen readers", "Launch fast and never blank the hero (HIG); muscle maps are 2D in Garmin Connect and WHOOP Strength Trainer"],
  ["All ten regions coloured, including upper body", "Upper body hatched: \"Not programmed yet\"", "The engine programmes lower-body sessions only; showing load there would be invented"],
  ["7 filters × 5 timelines × 3 views", "One lens (load), Front/Back, and a region list as the table view", "One decision per screen (doc 09); filters overlapped (Muscles vs Strength vs Performance)"],
  ["Desktop dashboard", "390 pt phone layout, 44 pt targets, large title, tab bar", "The athlete app is used on a phone in a gym (docs/13 §5)"],
];
