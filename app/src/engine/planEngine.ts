// Deterministic programming engine (ADR-004: the engine owns every load
// prescription). Pure function of the profile and a date: same input, same plan.
// No network, no model, no randomness.

import { EXERCISE_LIBRARY, type Exercise } from "../ExerciseLibrary";
import { contraindicatedBy } from "./contraindications";
import { BOUNDS } from "./boundsChecker";
import type { EngineProfile, EnginePlan, Level, PlanDay, PlanExercise } from "./types";

const LEVEL_RANK: Record<Level, number> = { beginner: 0, intermediate: 1, advanced: 2 };

export const ENGINE_PARAMS = {
  exercisesPerWorkout: { beginner: 4, intermediate: 5, advanced: 6 } as Record<Level, number>,
  setsPerExercise: { beginner: 2, intermediate: 3, advanced: 4 } as Record<Level, number>,
  rpeTarget: { beginner: 6, intermediate: 7, advanced: 8 } as Record<Level, number>,
  /** Minutes per working set including rest; used to fit sessions to the athlete's time. */
  minutesPerSet: 2.5,
  warmupMinutes: 8,
};

const GOAL_CATEGORY: Record<string, Exercise["category"][]> = {
  build_muscle: ["hypertrophy", "strength", "core"],
  lose_weight: ["cardio", "plyometric", "strength", "core"],
  improve_endurance: ["endurance", "cardio", "core"],
  general_fitness: ["strength", "core", "cardio", "mobility"],
  maintain: ["strength", "mobility", "core"],
};

function repRange(goal: string, level: Level): string {
  if (goal === "build_muscle" || goal === "maintain") return level === "beginner" ? "10-12" : level === "advanced" ? "6-10" : "8-12";
  if (goal === "lose_weight") return level === "beginner" ? "12-15" : "10-15";
  if (goal === "improve_endurance") return "15-20";
  return "8-12";
}

function restSeconds(goal: string): number {
  return goal === "build_muscle" ? 90 : goal === "lose_weight" ? 45 : goal === "improve_endurance" ? 30 : 60;
}

function hasEquipment(ex: Exercise, equipment: string[]): boolean {
  if (equipment.length === 0) return true; // not specified: do not filter
  const have = equipment.map((e) => e.toLowerCase());
  return ex.equipment.every((opt) =>
    opt
      .toLowerCase()
      .split("|")
      .map((s) => s.trim())
      .some((o) => o === "none" || o === "mat" || o === "wall" || o === "chair" || have.includes(o) || have.includes(o.replace(/s$/, "")) || have.includes(`${o}s`))
  );
}

/** Exercises the engine may prescribe for this profile, in goal-priority order. */
export function eligibleExercises(profile: EngineProfile): Exercise[] {
  const order = GOAL_CATEGORY[profile.goal] ?? GOAL_CATEGORY.general_fitness;
  return EXERCISE_LIBRARY.filter((ex) => ex.category !== "warmup")
    .filter((ex) => LEVEL_RANK[ex.difficulty] <= LEVEL_RANK[profile.level])
    .filter((ex) => hasEquipment(ex, profile.equipment))
    .filter((ex) => !profile.injuries.some((inj) => contraindicatedBy(ex, inj)))
    .map((ex, i) => ({ ex, i, p: order.indexOf(ex.category) === -1 ? order.length : order.indexOf(ex.category) }))
    .sort((a, b) => a.p - b.p || a.i - b.i)
    .map(({ ex }) => ex);
}

function iso(d: Date): string {
  return d.toISOString().split("T")[0];
}

function monday(d: Date): Date {
  const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = m.getUTCDay() || 7;
  m.setUTCDate(m.getUTCDate() - dow + 1);
  return m;
}

function isoWeek(d: Date): number {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - y0.getTime()) / 86400000 + 1) / 7);
}

export function generatePlan(profile: EngineProfile, now: Date = new Date()): EnginePlan {
  const level = profile.level;
  const days = Math.max(1, Math.min(7, Math.floor(profile.daysPerWeek)));
  const pool = eligibleExercises(profile);

  let sets = ENGINE_PARAMS.setsPerExercise[level];
  if (profile.specialMode && ["glp1", "postpartum", "senior"].includes(profile.specialMode)) sets = Math.max(1, sets - 1);

  // Fit the session to the athlete's time budget.
  const budget = Math.max(0, profile.sessionDuration - ENGINE_PARAMS.warmupMinutes);
  const perExercise = sets * ENGINE_PARAMS.minutesPerSet;
  const fit = Math.max(1, Math.floor(budget / perExercise));
  // Stay inside the weekly volume ceiling the bounds checker enforces.
  const weeklyFit = Math.max(1, Math.floor(BOUNDS.maxWeeklySets[level] / (days * sets)));
  const perWorkout = Math.min(ENGINE_PARAMS.exercisesPerWorkout[level], fit, weeklyFit, pool.length);

  const start = monday(now);
  const spacing = Math.floor(7 / days);
  const planDays: PlanDay[] = [];
  for (let d = 0; d < days; d++) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + d * spacing);
    // Rotate through the pool so consecutive days differ.
    const exercises: PlanExercise[] = [];
    for (let k = 0; k < perWorkout; k++) {
      const ex = pool[(d * perWorkout + k) % pool.length];
      if (exercises.some((e) => e.exerciseId === ex.id)) continue;
      exercises.push({
        exerciseId: ex.id,
        exerciseName: ex.name,
        targetMuscles: ex.primaryMuscles,
        equipment: ex.equipment,
        sets,
        reps: repRange(profile.goal, level),
        rest: restSeconds(profile.goal),
        rpeTarget: ENGINE_PARAMS.rpeTarget[level],
        instructions: ex.instructions,
        commonMistakes: ex.commonMistakes,
        substitutionIds: ex.substitutions,
        allowsSubstitution: true,
      });
    }
    planDays.push({
      dayIndex: (date.getUTCDay() + 6) % 7,
      date: iso(date),
      workouts: [
        {
          workoutId: `workout-${d + 1}`,
          workoutName: `Session ${d + 1}`,
          focus: profile.goal,
          duration: Math.min(profile.sessionDuration, Math.round(ENGINE_PARAMS.warmupMinutes + exercises.length * perExercise)),
          exercises,
        },
      ],
    });
  }

  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return {
    weekNumber: isoWeek(now),
    startDate: iso(start),
    endDate: iso(end),
    days: planDays,
    version: 1,
    prescribedBy: "engine",
  };
}
