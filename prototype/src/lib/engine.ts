// Adapters between the prototype UI and the production engine.
//
// Everything that decides training comes from engine unchanged:
// generateHybridWeek, adaptDay, applyReadiness, checkHybridWeek, prescribeHybrid
// (hybrid path) and generatePlan / eligibleExercises (strength path).
//
// A few behaviours the Phase 2 design needs don't exist in the engine yet. They
// are marked STAND-IN below, reuse engine parameters rather than new numbers,
// and are listed in prototype/README.md as engine work:
//   1. onboarding answers → HybridProfile session counts
//   2. check-in answers → readiness tier
//   3. the 15-minute starter session (always a session today)
//   4. missed-session repair (repairWeek)
//   5. strength-path adaptation and the gentle cap (mirror applyReadiness)
//   6. exercises for a hybrid strength day (taken from generatePlan)
import {
  adaptDay,
  applyReadiness,
  checkHybridWeek,
  generateHybridWeek,
  prescribeHybrid,
  sessionLoad,
  HYBRID_PARAMS,
  RULE_EVIDENCE,
  type Adaptation,
  type HybridFinding,
  type HybridProfile,
  type HybridSession,
  type HybridWeek,
  type Modality,
  type Quality,
  type Readiness,
  type Slot,
} from "../../../engine/hybrid";
import { eligibleExercises, generatePlan } from "../../../engine/planEngine";
import type { EngineProfile, Level, PlanExercise } from "../../../engine/types";
import { EXERCISE_BY_ID } from "../../../engine/ExerciseLibrary";

export { sessionLoad, HYBRID_PARAMS, RULE_EVIDENCE };
export type { Modality, Readiness, Level, PlanExercise, HybridFinding };

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const DAYS_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export type Goal = "fitter" | "hybrid" | "hyrox";
export interface Answers {
  goal: Goal;
  days: number[];
  doubles: boolean;
  minutes: number;
  level: Level;
  readinessYes: [boolean, boolean, boolean];
  injuries: string[];
  equipment: string[];
}
export const DEFAULT_ANSWERS: Answers = { goal: "hybrid", days: [0, 2, 4], doubles: false, minutes: 45, level: "beginner", readinessYes: [false, false, false], injuries: [], equipment: [] };

export interface Session extends HybridSession {
  title: string;
  source: "engine" | "starter" | "moved";
  exercises?: PlanExercise[];
}
export interface Plan {
  kind: "hybrid" | "strength";
  profile?: HybridProfile;
  week: { sessions: Session[]; priority: Quality; prescribedBy: HybridWeek["prescribedBy"] };
  gentle: boolean;
}

export const MOD_LABEL: Record<Modality, string> = { strength: "Strength", power: "Power", endurance_hard: "Hard run", endurance_easy: "Easy run" };
export const RULE_NAME: Record<string, string> = {
  H1_CONFLICT_SEPARATION: "H1 · hard sessions apart",
  H2_POWER_AFTER_ENDURANCE: "H2 · power before endurance",
  H3_PRIORITY_FIRST: "H3 · priority first",
  H4_CONFLICT_WITHIN_24H: "H4 · hard sessions within 24 h",
  H5_WEEKLY_LOAD_JUMP: "H5 · weekly load limit",
  H6_ACUTE_CHRONIC_ATTENTION: "H6 · coach attention",
  H7_READINESS: "H7 · readiness",
  H8_UNAVAILABLE_DAY: "H8 · your days",
  H9_MALFORMED: "H9 · valid week",
  check: "Checked against every rule",
};

/** Engine text uses day indices and modality ids; show people words. */
export function humanize(text: string): string {
  return text
    .replace(/\bday (\d)\b/gi, (_, d) => DAYS_LONG[Number(d)])
    .replace(/\b(endurance_hard|endurance_easy|strength|power)\b/g, (m) => MOD_LABEL[m as Modality].toLowerCase())
    .replace(/\bRPE (\d+)\b/g, "effort $1/10");
}

const titleFor = (m: Modality, minutes: number) =>
  m === "endurance_hard" ? "Threshold run" : m === "endurance_easy" ? (minutes <= 20 ? "Easy aerobic" : "Easy run") : m === "power" ? "Power session" : "Strength session";

// STAND-IN 1: onboarding → hybrid profile. Counts scale with the days chosen; the engine
// places what fits and reports any shortfall. Product assumption, to be owned by the engine.
export function hybridProfile(a: Answers): HybridProfile {
  const n = a.days.length;
  return {
    level: a.level,
    priority: a.goal === "hybrid" ? "strength" : "endurance",
    availableDays: [...a.days].sort((x, y) => x - y),
    strengthSessions: n >= 3 ? 2 : 1,
    powerSessions: n >= 5 ? 1 : 0,
    hardEnduranceSessions: n >= 4 ? 2 : 1,
    easyEnduranceSessions: Math.max(0, n - 3) + (a.doubles ? 1 : 0),
    allowDoubles: a.doubles,
    sessionMinutes: a.minutes,
  };
}

function strengthPlan(a: Answers, days: number) {
  const profile: EngineProfile = { goal: "general_fitness", level: a.level, injuries: a.injuries, equipment: a.equipment, daysPerWeek: Math.max(1, days), sessionDuration: a.minutes };
  return generatePlan(profile, new Date("2026-09-21T00:00:00Z"));
}

// STAND-IN 5: the strength path has no readiness adaptation in the engine yet. These
// mirror applyReadiness exactly: hard → easy aerobic at the engine's easy RPE, keeping
// amberMinutesFactor of the minutes.
export function gentleVersion(s: Session): Session {
  if (s.modality === "endurance_easy") return s;
  const minutes = Math.max(10, Math.round(s.minutes * HYBRID_PARAMS.amberMinutesFactor));
  return { ...s, id: `${s.id}-easy`, modality: "endurance_easy", rpe: HYBRID_PARAMS.rpe.endurance_easy, minutes, title: titleFor("endurance_easy", minutes), exercises: undefined };
}

export function buildPlan(a: Answers): Plan {
  const gentle = a.readinessYes.some(Boolean);
  if (a.goal === "fitter") {
    const plan = strengthPlan(a, a.days.length);
    const days = [...a.days].sort((x, y) => x - y);
    // The engine spaces sessions by floor(7 / days) from Monday; the prototype places them on the
    // days the athlete chose, in order (engine work: planEngine should take availableDays).
    let sessions: Session[] = plan.days.map((d, i) => {
      const w = d.workouts[0];
      return { id: `p${i + 1}`, day: days[i] ?? d.dayIndex, slot: "am" as Slot, startHour: HYBRID_PARAMS.amHour, modality: "strength" as Modality, minutes: w.duration, rpe: w.exercises[0]?.rpeTarget ?? HYBRID_PARAMS.rpe.strength, lowerBody: true, title: `Full body ${String.fromCharCode(65 + i)}`, source: "engine" as const, exercises: w.exercises };
    });
    if (gentle) sessions = sessions.map(gentleVersion);
    return { kind: "strength", week: { sessions, priority: "strength", prescribedBy: "engine" }, gentle };
  }
  const profile = hybridProfile(a);
  let week = generateHybridWeek(profile);
  if (gentle) week = applyReadiness(week, profile, Object.fromEntries(profile.availableDays.map((d) => [d, "amber" as Readiness])));
  return { kind: "hybrid", profile, week: { ...week, sessions: decorate(week.sessions, a) }, gentle };
}

// STAND-IN 6: the hybrid engine prescribes a strength day as modality + minutes + RPE, not
// exercises. The prototype fills exercises from generatePlan (same level, injuries, equipment).
function decorate(sessions: HybridSession[], a: Answers): Session[] {
  const strengthDays = sessions.filter((s) => s.modality === "strength");
  const plan = strengthDays.length ? strengthPlan(a, strengthDays.length) : null;
  let k = 0;
  return sessions.map((s) => ({
    ...s,
    title: titleFor(s.modality, s.minutes),
    source: "engine" as const,
    exercises: s.modality === "strength" && plan ? plan.days[k++ % plan.days.length].workouts[0].exercises : undefined,
  }));
}

// STAND-IN 3: "always a session today" (Phase 2 onboarding rule 4). Engine parameters only:
// easy endurance at the engine's easy RPE; 15 minutes is the design's starter length.
export function starterSession(day: number): Session {
  return { id: `starter-${day}`, day, slot: "am", startHour: HYBRID_PARAMS.amHour, modality: "endurance_easy", minutes: 15, rpe: HYBRID_PARAMS.rpe.endurance_easy, lowerBody: false, title: "15-minute starter", source: "starter" };
}

export const sessionsOn = (plan: Plan, day: number) => plan.week.sessions.filter((s) => s.day === day).sort((x, y) => x.startHour - y.startHour);

// STAND-IN 2: check-in → readiness. Pain always escalates (as adaptDay requires); a bad night
// or sore legs caps intensity. Mapping to be owned by the engine and signed off by a coach.
export interface CheckIn { sleep: "well" | "ok" | "badly"; legs: "fresh" | "heavy" | "sore"; pain: boolean }
export function readinessFrom(c: CheckIn): Readiness {
  if (c.pain) return "red";
  if (c.sleep === "badly" || c.legs === "sore" || (c.sleep === "ok" && c.legs === "heavy")) return "amber";
  return "green";
}

export interface Change {
  id: string;
  outcome: Adaptation["outcome"] | "repaired" | "dropped" | "accepted" | "kept";
  title: string;
  body: string;
  rules: string[];
  steps: { rule: string; outcome: string }[];
  movedSessionId?: string;
  by: "engine" | "coach";
  at: number;
}

const toHybridWeek = (plan: Plan): HybridWeek => ({ priority: plan.week.priority, prescribedBy: plan.week.prescribedBy, sessions: plan.week.sessions });
const merge = (plan: Plan, w: HybridWeek): Plan => {
  const byId = new Map(plan.week.sessions.map((s) => [s.id.replace(/-easy$/, ""), s]));
  const sessions = w.sessions.map((s) => {
    const prev = byId.get(s.id.replace(/-easy$/, ""));
    const t = titleFor(s.modality, s.minutes);
    return { ...s, title: t, source: prev && prev.day !== s.day ? ("moved" as const) : ("engine" as const), exercises: s.modality === "strength" ? prev?.exercises : undefined };
  });
  return { ...plan, week: { ...plan.week, sessions, prescribedBy: w.prescribedBy } };
};

export function adaptToday(plan: Plan, a: Answers, day: number, readiness: Readiness, pain: boolean, coach?: string): { plan: Plan; change: Change | null } {
  const now = Date.now();
  if (plan.kind === "hybrid" && plan.profile) {
    const r = adaptDay(toHybridWeek(plan), plan.profile, { day, readiness, painFlag: pain });
    if (r.outcome === "unchanged") return { plan, change: null };
    const next = merge(plan, r.week);
    const moved = next.week.sessions.find((s) => s.source === "moved");
    const who = coach ? `Coach ${coach}` : "a coach";
    const copy =
      r.outcome === "moved"
        ? { title: `${moved?.title ?? "Session"} moved to ${DAYS_LONG[moved?.day ?? day]}`, body: "Your check-in was low. We kept the session and moved it to a day that passes every rule. Today is easy." }
        : r.outcome === "downgraded"
          ? { title: "Today is easy aerobic", body: `No later day fitted, so today's session is easy.${coach ? ` Coach ${coach} has been told.` : ""}` }
          : { title: coach ? `Waiting for Coach ${coach}` : "We kept today easy", body: coach ? `Until ${who} decides, today stays easy.` : "Nothing changes automatically on a pain or red day. Tell us how you feel tomorrow." };
    return { plan: r.outcome === "escalated" ? escalatedPlan(plan, day) : next, change: { id: `c${now}`, outcome: r.outcome, ...copy, rules: [...new Set(r.steps.map((s) => s.rule))], steps: r.steps, movedSessionId: moved?.id, by: "engine", at: now } };
  }
  // Strength path (STAND-IN 5).
  if (readiness === "green") return { plan, change: null };
  if (readiness === "red" || pain) {
    return { plan: escalatedPlan(plan, day), change: { id: `c${now}`, outcome: "escalated", title: coach ? `Waiting for Coach ${coach}` : "We kept today easy", body: "Nothing changes automatically on a pain or red day.", rules: ["H7_READINESS"], steps: [{ rule: "H7_READINESS", outcome: "Red tier: no autonomous change; escalate" }], by: "engine", at: now } };
  }
  const sessions = plan.week.sessions.map((s) => (s.day === day ? gentleVersion(s) : s));
  return { plan: { ...plan, week: { ...plan.week, sessions } }, change: { id: `c${now}`, outcome: "downgraded", title: "Today is easy aerobic", body: "Your check-in was low, so today's strength session becomes easy aerobic.", rules: ["H7_READINESS"], steps: [{ rule: "H7_READINESS", outcome: "Amber readiness: cap today's intensity" }], by: "engine", at: now } };
}

/** On an escalated day nothing loaded is offered; the athlete gets the easy starter until a person decides. */
function escalatedPlan(plan: Plan, day: number): Plan {
  return { ...plan, week: { ...plan.week, sessions: plan.week.sessions.filter((s) => s.day !== day).concat({ ...starterSession(day), title: "Easy aerobic, 15 minutes" }) } };
}

// STAND-IN 4: missed-session repair. Tries later available days (morning first), and keeps a
// move only if the production checker passes it; otherwise the session is dropped, never
// crammed in. Engine work: repairWeek.
export function repairMissed(plan: Plan, missed: Session, today: number, days: number[]): { plan: Plan; change: Change } {
  const now = Date.now();
  const rest = plan.week.sessions.filter((s) => s.id !== missed.id);
  for (const d of days.filter((x) => x >= today).sort((x, y) => x - y)) {
    for (const slot of ["am", "pm"] as Slot[]) {
      if (rest.some((s) => s.day === d && s.slot === slot)) continue;
      if (slot === "pm" && plan.profile && !plan.profile.allowDoubles) continue;
      const moved: Session = { ...missed, day: d, slot, startHour: slot === "am" ? HYBRID_PARAMS.amHour : HYBRID_PARAMS.pmHour, source: "moved" };
      const candidate = { ...plan.week, sessions: [...rest, moved] };
      const ok = plan.kind === "hybrid" && plan.profile ? checkHybridWeek(candidate, plan.profile, { previous: toHybridWeek(plan) }).ok : !rest.some((s) => s.day === d);
      if (ok) {
        return { plan: { ...plan, week: candidate }, change: { id: `c${now}`, outcome: "repaired", title: `${missed.title} moved to ${DAYS_LONG[d]}`, body: `${DAYS_LONG[missed.day]}'s session didn't happen. We moved it to ${DAYS_LONG[d]}; the rest of your week still fits.`, rules: ["check"], steps: [{ rule: "check", outcome: "The repaired week passes every blocking rule" }], movedSessionId: moved.id, by: "engine", at: now } };
      }
    }
  }
  return { plan: { ...plan, week: { ...plan.week, sessions: rest } }, change: { id: `c${now}`, outcome: "dropped", title: `We let ${DAYS_LONG[missed.day]}'s session go`, body: "It didn't fit this week without overloading you. Next week starts fresh.", rules: ["H5_WEEKLY_LOAD_JUMP"], steps: [{ rule: "check", outcome: "No later day passes every rule" }], by: "engine", at: now } };
}

/** A chat proposal ("move X to Friday") goes through prescribeHybrid; the rules decide. */
export function checkProposal(plan: Plan, sessionId: string, toDay: number): { accepted: boolean; plan: Plan; findings: HybridFinding[] } {
  const s = plan.week.sessions.find((x) => x.id === sessionId);
  if (!s || plan.kind !== "hybrid" || !plan.profile) return { accepted: false, plan, findings: [] };
  const proposal = { ...toHybridWeek(plan), prescribedBy: "llm-proposal-accepted" as const, sessions: plan.week.sessions.map((x) => (x.id === sessionId ? { ...x, day: toDay, slot: "am" as Slot, startHour: HYBRID_PARAMS.amHour } : x)) };
  if (!plan.profile.availableDays.includes(toDay)) {
    const findings = checkHybridWeek(proposal, plan.profile, { previous: toHybridWeek(plan) }).findings;
    return { accepted: false, plan, findings };
  }
  const r = prescribeHybrid(plan.profile, toHybridWeek(plan), proposal, { previous: toHybridWeek(plan) });
  if (r.prescribedBy !== "llm-proposal-accepted") return { accepted: false, plan, findings: r.findings };
  const sessions = plan.week.sessions.map((x) => (x.id === sessionId ? { ...x, day: toDay, slot: "am" as Slot, startHour: HYBRID_PARAMS.amHour, source: "moved" as const } : x));
  return { accepted: true, plan: { ...plan, week: { ...plan.week, sessions, prescribedBy: "llm-proposal-accepted" } }, findings: r.findings };
}

/** Swap: same-movement substitutes from the library that the engine would allow for this athlete. */
export function swapOptions(ex: PlanExercise, a: Answers) {
  const allowed = new Set(eligibleExercises({ goal: "general_fitness", level: a.level, injuries: a.injuries, equipment: a.equipment, daysPerWeek: 3, sessionDuration: a.minutes }).map((e) => e.id));
  return (EXERCISE_BY_ID[ex.exerciseId]?.substitutions ?? [])
    .map((id) => EXERCISE_BY_ID[id])
    .filter((e) => e && allowed.has(e.id))
    .slice(0, 3);
}

export const weekLoad = (plan: Plan) => plan.week.sessions.reduce((t, s) => t + sessionLoad(s), 0);
export const INJURY_OPTIONS = ["knee", "lower_back", "shoulder", "hip", "ankle", "neck", "upper_back", "elbow", "wrist"];
export const injuryLabel = (k: string) => k.replace("_", " ").replace(/^./, (c) => c.toUpperCase());
