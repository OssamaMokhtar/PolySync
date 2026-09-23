// Hybrid scheduling layer (doc 12). This is the part of PolySync that is about
// hybrid athletes specifically: it places strength, power and endurance
// sessions in a week so they interfere as little as the evidence says they
// need to, and it checks every proposed change against the same rules.
//
// Same contract as the rest of the engine (ADR-004): pure functions, no model,
// no randomness, no network. A model may PROPOSE a week; only
// prescribeHybrid() decides what reaches the athlete.
//
// Every rule carries the evidence ids it rests on (product/data/evidence.json).
// Two rules (H5, H6) are deliberately NOT sold as injury prevention: the
// studies we read do not support that claim, so they are conservative product
// limits that route to a coach instead.

import type { Level } from "./types";

export type Modality = "strength" | "power" | "endurance_easy" | "endurance_hard";
export type Quality = "endurance" | "strength" | "power";
export type Readiness = "green" | "amber" | "red";
export type Slot = "am" | "pm";

export interface HybridProfile {
  level: Level;
  /** The quality this block develops; the others are maintained (doc 12, Priority). */
  priority: Quality;
  /** 0 = Monday … 6 = Sunday. */
  availableDays: number[];
  strengthSessions: number;
  powerSessions: number;
  hardEnduranceSessions: number;
  easyEnduranceSessions: number;
  /** May the athlete train twice on one day (am + pm)? */
  allowDoubles: boolean;
  sessionMinutes: number;
}

export interface HybridSession {
  id: string;
  day: number;
  slot: Slot;
  /** Hour of day the session starts; am = 07:00, pm = 18:00 by default. */
  startHour: number;
  modality: Modality;
  minutes: number;
  /** Target session RPE (CR-10). Load = minutes × RPE (session-RPE method). */
  rpe: number;
  lowerBody: boolean;
}

export interface HybridWeek {
  priority: Quality;
  sessions: HybridSession[];
  prescribedBy: "engine" | "llm-proposal-accepted";
  /** Sessions the athlete asked for that could not be placed without breaking a rule. Shown to the coach, never dropped silently. */
  shortfall?: { modality: Modality; count: number }[];
}

export type HybridRuleId =
  | "H1_CONFLICT_SEPARATION"
  | "H2_POWER_AFTER_ENDURANCE"
  | "H3_PRIORITY_FIRST"
  | "H4_CONFLICT_WITHIN_24H"
  | "H5_WEEKLY_LOAD_JUMP"
  | "H6_ACUTE_CHRONIC_ATTENTION"
  | "H7_READINESS"
  | "H8_UNAVAILABLE_DAY"
  | "H9_MALFORMED";

export interface HybridFinding {
  rule: HybridRuleId;
  /** block = cannot reach the athlete; attention = allowed, but a coach sees it. */
  severity: "block" | "attention";
  detail: string;
  evidence: string[];
}

export const HYBRID_PARAMS = {
  amHour: 7,
  pmHour: 18,
  /** H1: conflicting hard sessions on one day need this gap (SCI-005: 6 h beat 0 h). */
  minSeparationHours: 6,
  /** H2: power work within this many hours after endurance is blocked (SCI-004: >= 3 h removed the attenuation). */
  powerAfterEnduranceHours: 3,
  /** H4: conflicting hard sessions closer than this get coach attention (SCI-005: 24 h was best). */
  preferredSeparationHours: 24,
  /** H5: week-over-week load increase above this goes to a coach. A product limit, not injury prevention (SCI-006). */
  maxWeeklyLoadIncrease: 0.1,
  /** H6: acute:chronic above this is a coach-attention signal only (SCI-007: no protective sweet spot). */
  acwrAttention: 1.5,
  rpe: { strength: 8, power: 7, endurance_hard: 8, endurance_easy: 4 } as Record<Modality, number>,
  easyMinutesFactor: 0.75,
};

export const RULE_EVIDENCE: Record<HybridRuleId, string[]> = {
  H1_CONFLICT_SEPARATION: ["SCI-004", "SCI-005"],
  H2_POWER_AFTER_ENDURANCE: ["SCI-003", "SCI-004"],
  H3_PRIORITY_FIRST: ["SCI-005"],
  H4_CONFLICT_WITHIN_24H: ["SCI-005"],
  H5_WEEKLY_LOAD_JUMP: ["SCI-006"],
  H6_ACUTE_CHRONIC_ATTENTION: ["SCI-007"],
  H7_READINESS: [],
  H8_UNAVAILABLE_DAY: [],
  H9_MALFORMED: [],
};

const HARD: Modality[] = ["strength", "power", "endurance_hard"];
const isEndurance = (m: Modality) => m === "endurance_easy" || m === "endurance_hard";
const isResistance = (m: Modality) => m === "strength" || m === "power";
const qualityOf = (m: Modality): Quality => (isEndurance(m) ? "endurance" : m === "power" ? "power" : "strength");

/** Absolute hour in the week, for gap arithmetic. */
const at = (s: HybridSession) => s.day * 24 + s.startHour;

/** Two hard sessions of opposing type conflict (endurance vs resistance). */
function conflicting(a: HybridSession, b: HybridSession): boolean {
  return HARD.includes(a.modality) && HARD.includes(b.modality) && isEndurance(a.modality) !== isEndurance(b.modality);
}

export function sessionLoad(s: HybridSession): number {
  return s.minutes * s.rpe;
}

export function weeklyLoad(w: HybridWeek): number {
  return w.sessions.reduce((sum, s) => sum + sessionLoad(s), 0);
}

// ── Engine: deterministic placement ─────────────────────────────────────────

/**
 * Pick n days from `days`, spread evenly, skipping days already taken. Falls
 * back to the nearest free day so a requested session is never silently lost
 * while a free day exists.
 */
function pickDays(days: number[], n: number, taken: Set<number>): number[] {
  const out: number[] = [];
  const free = () => days.filter((d) => !taken.has(d) && !out.includes(d));
  for (let i = 0; i < n; i++) {
    const avail = free();
    if (avail.length === 0) break;
    const ideal = days[Math.floor((i * days.length) / Math.max(1, n))];
    avail.sort((a, b) => Math.abs(a - ideal) - Math.abs(b - ideal) || a - b);
    out.push(avail[0]);
  }
  return out;
}

function make(id: string, day: number, slot: Slot, modality: Modality, minutes: number, lowerBody: boolean): HybridSession {
  return {
    id,
    day,
    slot,
    startHour: slot === "am" ? HYBRID_PARAMS.amHour : HYBRID_PARAMS.pmHour,
    modality,
    minutes,
    rpe: HYBRID_PARAMS.rpe[modality],
    lowerBody,
  };
}

/**
 * Build the week. Priority sessions are placed first on evenly spread days;
 * the opposing quality goes on the days furthest from them; if a day must be
 * shared, the priority session takes the morning (H3) and the other the
 * evening (11 h apart, clearing H1). Easy endurance never sits in the 3 h
 * before power work (H2).
 */
export function generateHybridWeek(p: HybridProfile): HybridWeek {
  const days = [...new Set(p.availableDays)].filter((d) => d >= 0 && d <= 6).sort((a, b) => a - b);
  const mins = Math.max(20, p.sessionMinutes);
  const easyMins = Math.round(mins * HYBRID_PARAMS.easyMinutesFactor);

  type Want = { modality: Modality; count: number };
  const endurance: Want = { modality: "endurance_hard", count: p.hardEnduranceSessions };
  const resistance: Want[] = [
    { modality: "strength", count: p.strengthSessions },
    { modality: "power", count: p.powerSessions },
  ];
  const first: Want[] = p.priority === "endurance" ? [endurance] : resistance.filter((r) => (p.priority === "power" ? r.modality === "power" : r.modality === "strength")).concat(resistance.filter((r) => (p.priority === "power" ? r.modality !== "power" : r.modality !== "strength")));
  const second: Want[] = p.priority === "endurance" ? resistance : [endurance];

  const sessions: HybridSession[] = [];
  let n = 0;
  const occupied = (day: number, slot: Slot) => sessions.some((x) => x.day === day && x.slot === slot);
  const hardOn = (day: number) => sessions.filter((s) => s.day === day && HARD.includes(s.modality));

  // Priority quality: morning slots, spread across the week.
  const taken = new Set<number>();
  for (const w of first) {
    for (const day of pickDays(days, w.count, taken)) {
      sessions.push(make(`s${++n}`, day, "am", w.modality, mins, true));
      taken.add(day);
    }
  }

  // Opposing quality: prefer days with no hard session and the largest gap to one.
  const distanceToHard = (day: number) => {
    const hardDays = sessions.filter((s) => HARD.includes(s.modality)).map((s) => s.day);
    return hardDays.length === 0 ? 7 : Math.min(...hardDays.map((h) => Math.abs(h - day)));
  };
  for (const w of second) {
    for (let k = 0; k < w.count; k++) {
      const free = days.filter((d) => hardOn(d).length === 0).sort((a, b) => distanceToHard(b) - distanceToHard(a) || a - b);
      if (free.length > 0) {
        sessions.push(make(`s${++n}`, free[0], "am", w.modality, mins, true));
      } else if (p.allowDoubles) {
        const shared = days.filter((d) => !occupied(d, "pm") && hardOn(d).length === 1).sort((a, b) => a - b);
        if (shared.length > 0) sessions.push(make(`s${++n}`, shared[0], "pm", w.modality, mins, true));
      }
      // Otherwise the session does not fit this week; the coach console shows the shortfall.
    }
  }

  // Easy endurance: free days first, then evenings that do not precede power (H2 looks backwards only).
  for (let k = 0; k < p.easyEnduranceSessions; k++) {
    const freeDay = days.find((d) => !sessions.some((s) => s.day === d));
    if (freeDay !== undefined) {
      sessions.push(make(`s${++n}`, freeDay, "am", "endurance_easy", easyMins, true));
      continue;
    }
    if (!p.allowDoubles) break;
    const evening = days.find((d) => !occupied(d, "pm") && !sessions.some((s) => s.day === d + 1 && s.slot === "am" && s.modality === "power"));
    if (evening !== undefined) sessions.push(make(`s${++n}`, evening, "pm", "endurance_easy", easyMins, true));
  }

  sessions.sort((a, b) => at(a) - at(b));
  const asked: Record<Modality, number> = {
    strength: p.strengthSessions,
    power: p.powerSessions,
    endurance_hard: p.hardEnduranceSessions,
    endurance_easy: p.easyEnduranceSessions,
  };
  const shortfall = (Object.keys(asked) as Modality[])
    .map((m) => ({ modality: m, count: Math.max(0, asked[m] - sessions.filter((x) => x.modality === m).length) }))
    .filter((x) => x.count > 0);
  return { priority: p.priority, sessions, prescribedBy: "engine", shortfall };
}

// ── Checker ─────────────────────────────────────────────────────────────────

export interface CheckContext {
  previous?: HybridWeek;
  /** Mean weekly load of the last 4 weeks, for the acute:chronic signal. */
  chronicWeeklyLoad?: number;
  /** Readiness by day (0-6). Missing = green. */
  readiness?: Partial<Record<number, Readiness>>;
}

function isWeek(x: unknown): x is HybridWeek {
  if (!x || typeof x !== "object") return false;
  const w = x as HybridWeek;
  return (
    Array.isArray(w.sessions) &&
    w.sessions.every(
      (s) =>
        s &&
        typeof s.day === "number" && s.day >= 0 && s.day <= 6 &&
        typeof s.startHour === "number" && s.startHour >= 0 && s.startHour < 24 &&
        ["strength", "power", "endurance_easy", "endurance_hard"].includes(s.modality) &&
        typeof s.minutes === "number" && s.minutes > 0 && s.minutes <= 240 &&
        typeof s.rpe === "number" && s.rpe >= 1 && s.rpe <= 10
    )
  );
}

export function checkHybridWeek(week: unknown, p: HybridProfile, ctx: CheckContext = {}): { ok: boolean; findings: HybridFinding[] } {
  const f: HybridFinding[] = [];
  const add = (rule: HybridRuleId, severity: "block" | "attention", detail: string) => f.push({ rule, severity, detail, evidence: RULE_EVIDENCE[rule] });

  if (!isWeek(week)) {
    add("H9_MALFORMED", "block", "Proposal is not a valid week of sessions");
    return { ok: false, findings: f };
  }
  const s = [...week.sessions].sort((a, b) => at(a) - at(b));

  for (const x of s) {
    if (!p.availableDays.includes(x.day)) add("H8_UNAVAILABLE_DAY", "block", `${x.id} is on day ${x.day}, which the athlete did not make available`);
  }

  for (let i = 0; i < s.length; i++) {
    for (let j = i + 1; j < s.length; j++) {
      const a = s[i];
      const b = s[j];
      const gap = at(b) - at(a);
      if (conflicting(a, b)) {
        if (a.day === b.day && gap < HYBRID_PARAMS.minSeparationHours) {
          add("H1_CONFLICT_SEPARATION", "block", `${a.modality} and ${b.modality} on day ${a.day} are ${gap} h apart (minimum ${HYBRID_PARAMS.minSeparationHours} h)`);
        } else if (gap < HYBRID_PARAMS.preferredSeparationHours) {
          add("H4_CONFLICT_WITHIN_24H", "attention", `${a.modality} → ${b.modality} ${gap} h apart; 24 h is the best-supported gap`);
        }
        if (a.day === b.day && qualityOf(a.modality) !== week.priority && qualityOf(b.modality) === week.priority) {
          add("H3_PRIORITY_FIRST", "block", `Day ${a.day}: the ${week.priority} session should come first; ${a.modality} is scheduled before it`);
        }
      }
      if (isEndurance(a.modality) && b.modality === "power" && gap < HYBRID_PARAMS.powerAfterEnduranceHours) {
        add("H2_POWER_AFTER_ENDURANCE", "block", `Power work ${gap} h after endurance on day ${b.day} (minimum ${HYBRID_PARAMS.powerAfterEnduranceHours} h)`);
      }
    }
  }

  const load = weeklyLoad(week);
  if (ctx.previous) {
    const prev = weeklyLoad(ctx.previous);
    if (prev > 0 && load > prev * (1 + HYBRID_PARAMS.maxWeeklyLoadIncrease)) {
      add("H5_WEEKLY_LOAD_JUMP", "block", `Weekly load ${load} is ${Math.round((load / prev - 1) * 100)}% above last week (${prev}); product limit is +${HYBRID_PARAMS.maxWeeklyLoadIncrease * 100}%`);
    }
  }
  if (ctx.chronicWeeklyLoad && ctx.chronicWeeklyLoad > 0 && load / ctx.chronicWeeklyLoad > HYBRID_PARAMS.acwrAttention) {
    add("H6_ACUTE_CHRONIC_ATTENTION", "attention", `Acute:chronic ${(load / ctx.chronicWeeklyLoad).toFixed(2)} (> ${HYBRID_PARAMS.acwrAttention}); shown to the coach, not treated as an injury predictor`);
  }

  for (const x of s) {
    const r = ctx.readiness?.[x.day] ?? "green";
    if (r === "red") add("H7_READINESS", "block", `Day ${x.day} readiness is red (pain or illness): no autonomous session; coach decides`);
    else if (r === "amber" && HARD.includes(x.modality)) add("H7_READINESS", "block", `Day ${x.day} readiness is amber; ${x.modality} must be moved or made easy`);
  }

  return { ok: !f.some((x) => x.severity === "block"), findings: f };
}

// ── Routing: the only path to the athlete ───────────────────────────────────

export interface HybridPrescription {
  week: HybridWeek;
  prescribedBy: HybridWeek["prescribedBy"];
  needsCoachReview: boolean;
  findings: HybridFinding[];
}

export function prescribeHybrid(p: HybridProfile, engineWeek: HybridWeek, proposal?: unknown, ctx: CheckContext = {}): HybridPrescription {
  if (proposal === undefined) {
    const own = checkHybridWeek(engineWeek, p, ctx);
    return { week: engineWeek, prescribedBy: "engine", needsCoachReview: own.findings.length > 0, findings: own.findings };
  }
  const v = checkHybridWeek(proposal, p, ctx);
  if (v.ok) {
    const week = { ...(proposal as HybridWeek), prescribedBy: "llm-proposal-accepted" as const };
    return { week, prescribedBy: "llm-proposal-accepted", needsCoachReview: v.findings.length > 0, findings: v.findings };
  }
  return { week: engineWeek, prescribedBy: "engine", needsCoachReview: true, findings: v.findings };
}

// ── Daily adaptation (doc 12 §4 worked example) ─────────────────────────────

export interface DailySignal {
  day: number;
  readiness: Readiness;
  /** Hard session delivered the previous day, if any. */
  yesterday?: { modality: Modality; rpe: number; lowerBody: boolean };
  painFlag?: boolean;
}

export interface Adaptation {
  week: HybridWeek;
  escalate: boolean;
  steps: { rule: string; outcome: string }[];
}

/**
 * Engine-owned adaptation for one day. Red readiness or a pain flag never
 * adapts autonomously: it escalates. Amber readiness after a hard lower-body
 * day moves today's hard session to the next day that passes every rule and
 * makes today easy.
 */
export function adaptDay(week: HybridWeek, p: HybridProfile, sig: DailySignal): Adaptation {
  const steps: Adaptation["steps"] = [];
  if (sig.painFlag || sig.readiness === "red") {
    steps.push({ rule: "H7_READINESS", outcome: "Red tier: no autonomous change; escalate to the named coach" });
    return { week, escalate: true, steps };
  }
  const today = week.sessions.find((s) => s.day === sig.day && HARD.includes(s.modality));
  if (sig.readiness === "green" || !today) {
    steps.push({ rule: "H7_READINESS", outcome: "No change needed" });
    return { week, escalate: false, steps };
  }
  steps.push({ rule: "H7_READINESS", outcome: "Amber readiness: cap today's intensity" });
  if (sig.yesterday && sig.yesterday.rpe >= 8 && sig.yesterday.lowerBody) {
    steps.push({ rule: "H4_CONFLICT_WITHIN_24H", outcome: `Yesterday was a hard ${sig.yesterday.modality} session (RPE ${sig.yesterday.rpe}); today's ${today.modality} is inside 24 h` });
  }
  const others = week.sessions.filter((s) => s.id !== today.id);
  const easy: HybridSession = { ...today, id: `${today.id}-easy`, modality: "endurance_easy", rpe: HYBRID_PARAMS.rpe.endurance_easy, minutes: Math.round(today.minutes * 0.6) };
  const candidates = p.availableDays.filter((d) => d > sig.day).sort((a, b) => a - b);
  const slotAt = (slot: Slot) => (slot === "am" ? HYBRID_PARAMS.amHour : HYBRID_PARAMS.pmHour);
  for (const d of candidates) {
    // Variants, most conservative first: free morning; free evening; take the
    // morning and move that day's session to the evening. Doubles only if allowed.
    const amTaken = others.find((s) => s.day === d && s.slot === "am");
    const pmTaken = others.find((s) => s.day === d && s.slot === "pm");
    const variants: { label: string; sessions: HybridSession[] }[] = [];
    const moved = (slot: Slot): HybridSession => ({ ...today, day: d, slot, startHour: slotAt(slot) });
    if (!amTaken) variants.push({ label: `day ${d} morning`, sessions: [...others, moved("am")] });
    if (p.allowDoubles && amTaken && !pmTaken) {
      variants.push({ label: `day ${d} evening`, sessions: [...others, moved("pm")] });
      variants.push({
        label: `day ${d} morning, ${amTaken.modality} moved to the evening`,
        sessions: [...others.filter((s) => s.id !== amTaken.id), moved("am"), { ...amTaken, slot: "pm", startHour: slotAt("pm") }],
      });
    }
    for (const v of variants) {
      const next: HybridWeek = { ...week, sessions: [...v.sessions, easy].sort((a, b) => at(a) - at(b)), prescribedBy: "engine" };
      // The adaptation is held to the same rules as any proposal, including the
      // H5 load limit against the week it replaces.
      const check = checkHybridWeek(next, p, { readiness: { [sig.day]: "amber" }, previous: week });
      if (check.ok) {
        steps.push({ rule: "H3_PRIORITY_FIRST", outcome: `Protect the ${week.priority} quality: keep the ${today.modality} session, move it to ${v.label}` });
        steps.push({ rule: "check", outcome: `Today becomes easy aerobic (${easy.minutes} min); the moved week passes every blocking rule` });
        return { week: next, escalate: false, steps };
      }
    }
  }
  steps.push({ rule: "check", outcome: "No later day passes the rules; escalate" });
  return { week, escalate: true, steps };
}
