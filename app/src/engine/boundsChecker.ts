// Bounds checker (ADR-004). Every plan or proposed change must pass before it
// can reach an athlete. Rules are v0 and NOT coach-signed (GAPS #4): each
// violation names its rule so a coach can review the rule, not just the case.

import { EXERCISE_LIBRARY } from "../ExerciseLibrary";
import { contraindicatedBy } from "./contraindications";
import type { EngineProfile, EnginePlan, Level } from "./types";

export type RuleId =
  | "B1_DAYS_EXCEED"
  | "B2_DURATION_EXCEED"
  | "B3_INJURY_CONTRAINDICATED"
  | "B4_UNKNOWN_EXERCISE"
  | "B5_SETS_PER_EXERCISE"
  | "B6_WEEKLY_SETS"
  | "B7_VOLUME_JUMP"
  | "B8_DIFFICULTY_ABOVE_LEVEL"
  | "B9_MALFORMED";

export interface Violation {
  rule: RuleId;
  detail: string;
  severity: "block";
}

export interface BoundsVerdict {
  ok: boolean;
  violations: Violation[];
  weeklySets: number;
}

export const BOUNDS = {
  durationTolerance: 1.1,
  maxSetsPerExercise: { beginner: 3, intermediate: 4, advanced: 5 } as Record<Level, number>,
  maxWeeklySets: { beginner: 40, intermediate: 80, advanced: 120 } as Record<Level, number>,
  maxWeekOverWeekIncrease: 0.1,
};

const LEVEL_RANK: Record<Level, number> = { beginner: 0, intermediate: 1, advanced: 2 };
const BY_ID = new Map(EXERCISE_LIBRARY.map((e) => [e.id, e]));

export function weeklySets(plan: EnginePlan): number {
  return plan.days.flatMap((d) => d.workouts).flatMap((w) => w.exercises).reduce((s, e) => s + (Number(e.sets) || 0), 0);
}

export function checkPlan(plan: unknown, profile: EngineProfile, previous?: EnginePlan): BoundsVerdict {
  const v: Violation[] = [];
  const p = plan as EnginePlan;
  if (!p || !Array.isArray(p.days) || p.days.some((d) => !Array.isArray(d?.workouts) || d.workouts.some((w) => !Array.isArray(w?.exercises)))) {
    return { ok: false, violations: [{ rule: "B9_MALFORMED", detail: "plan does not match the WeeklyPlan shape", severity: "block" }], weeklySets: 0 };
  }

  const trainingDays = p.days.filter((d) => d.workouts.some((w) => w.exercises.length > 0)).length;
  if (trainingDays > profile.daysPerWeek) {
    v.push({ rule: "B1_DAYS_EXCEED", detail: `${trainingDays} training days > ${profile.daysPerWeek} available`, severity: "block" });
  }

  for (const day of p.days) {
    for (const w of day.workouts) {
      if (w.duration > profile.sessionDuration * BOUNDS.durationTolerance) {
        v.push({ rule: "B2_DURATION_EXCEED", detail: `${w.workoutId}: ${w.duration} min > ${profile.sessionDuration} min budget`, severity: "block" });
      }
      for (const e of w.exercises) {
        const ex = BY_ID.get(e.exerciseId);
        if (!ex) {
          v.push({ rule: "B4_UNKNOWN_EXERCISE", detail: `${e.exerciseId} is not in the exercise library`, severity: "block" });
          continue;
        }
        for (const inj of profile.injuries) {
          const region = contraindicatedBy(ex, inj);
          if (region) v.push({ rule: "B3_INJURY_CONTRAINDICATED", detail: `${ex.name} loads the ${region} (injury: ${inj})`, severity: "block" });
        }
        if (Number(e.sets) > BOUNDS.maxSetsPerExercise[profile.level]) {
          v.push({ rule: "B5_SETS_PER_EXERCISE", detail: `${ex.name}: ${e.sets} sets > ${BOUNDS.maxSetsPerExercise[profile.level]} for ${profile.level}`, severity: "block" });
        }
        if (LEVEL_RANK[ex.difficulty] > LEVEL_RANK[profile.level]) {
          v.push({ rule: "B8_DIFFICULTY_ABOVE_LEVEL", detail: `${ex.name} is ${ex.difficulty}; athlete is ${profile.level}`, severity: "block" });
        }
      }
    }
  }

  const total = weeklySets(p);
  if (total > BOUNDS.maxWeeklySets[profile.level]) {
    v.push({ rule: "B6_WEEKLY_SETS", detail: `${total} weekly sets > ${BOUNDS.maxWeeklySets[profile.level]} for ${profile.level}`, severity: "block" });
  }
  if (previous) {
    const before = weeklySets(previous);
    if (before > 0 && total > before * (1 + BOUNDS.maxWeekOverWeekIncrease)) {
      v.push({ rule: "B7_VOLUME_JUMP", detail: `weekly sets ${before} -> ${total} (+${Math.round((total / before - 1) * 100)}%) > +10%`, severity: "block" });
    }
  }

  return { ok: v.length === 0, violations: v, weeklySets: total };
}

export interface PrescriptionResult {
  plan: EnginePlan;
  prescribedBy: "engine" | "llm-proposal-accepted";
  proposal?: { accepted: boolean; violations: Violation[] };
  /** True when a proposal was blocked: route it to the coach queue. */
  needsCoachReview: boolean;
}

/**
 * The only way a plan reaches an athlete. The engine plan is the default; a
 * model proposal replaces it only if it clears every bound. A blocked proposal
 * is kept for the coach, never shown to the athlete.
 */
export function prescribe(profile: EngineProfile, enginePlan: EnginePlan, proposal?: unknown, previous?: EnginePlan): PrescriptionResult {
  const engineCheck = checkPlan(enginePlan, profile, previous);
  if (!engineCheck.ok) {
    // The engine itself broke a bound: a bug. Fail closed.
    throw new Error(`engine plan violates bounds: ${engineCheck.violations.map((x) => x.rule).join(", ")}`);
  }
  if (proposal === undefined) return { plan: enginePlan, prescribedBy: "engine", needsCoachReview: false };
  const verdict = checkPlan(proposal, profile, previous);
  if (verdict.ok) {
    return {
      plan: { ...(proposal as EnginePlan), prescribedBy: "llm-proposal-accepted" },
      prescribedBy: "llm-proposal-accepted",
      proposal: { accepted: true, violations: [] },
      needsCoachReview: false,
    };
  }
  return { plan: enginePlan, prescribedBy: "engine", proposal: { accepted: false, violations: verdict.violations }, needsCoachReview: true };
}
