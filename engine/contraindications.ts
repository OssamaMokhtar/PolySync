// Injury → exercises to avoid. v0, written by the product owner, NOT coach-signed
// (docs/GAPS.md #4). The bounds checker cites the rule id for every block, so a
// coach can review and overturn each one.
//
// Why this exists: the previous filter matched the injury string against muscle
// names (`"right_knee"` vs `["quadriceps", ...]`), which never matched, so a
// knee injury did not remove squats or lunges.

import type { Exercise } from "./ExerciseLibrary";

export interface ContraRule {
  region: string;
  muscles: string[];
  nameKeywords: string[];
}

export const CONTRAINDICATIONS: Record<string, ContraRule> = {
  shoulder: {
    region: "shoulder",
    muscles: ["shoulders", "front delts", "rear delts", "deltoids", "side delts", "rotator cuff"],
    nameKeywords: ["overhead", "shoulder", "military", "arnold", "lateral raise", "upright row", "dip", "handstand", "snatch", "jerk", "push press", "pike push"],
  },
  elbow: {
    region: "elbow",
    muscles: ["triceps", "biceps"],
    nameKeywords: ["bicep curl", "hammer curl", "preacher curl", "cable curl", "reverse curl", "skull", "tricep", "pushdown", "push down", "dip", "close-grip"],
  },
  wrist: {
    region: "wrist",
    muscles: ["forearms", "wrists"],
    nameKeywords: ["push-up", "push up", "pushup", "front squat", "clean", "handstand", "burpee", "plank", "bicep curl", "hammer curl", "preacher curl", "reverse curl", "wrist curl", "mountain climber"],
  },
  lower_back: {
    region: "lower back",
    muscles: ["lower back", "erector spinae", "spinal erectors"],
    nameKeywords: ["deadlift", "good morning", "back extension", "bent-over", "bent over", "kettlebell swing", "clean", "snatch", "superman", "back squat"],
  },
  upper_back: {
    region: "upper back",
    muscles: ["traps", "rhomboids", "upper back"],
    nameKeywords: ["shrug", "face pull", "high pull"],
  },
  knee: {
    region: "knee",
    muscles: ["quadriceps", "quads"],
    nameKeywords: ["squat", "lunge", "leg press", "leg extension", "step-up", "step up", "jump", "box", "split", "pistol", "burpee", "sprint", "skater", "wall sit", "run"],
  },
  ankle: {
    region: "ankle",
    muscles: ["calves"],
    nameKeywords: ["calf raise", "jump", "sprint", "skip", "hop", "box", "burpee", "run", "lunge", "skater", "jack"],
  },
  neck: {
    region: "neck",
    muscles: ["neck"],
    nameKeywords: ["shrug", "neck", "back squat", "overhead", "headstand"],
  },
  hip: {
    region: "hip",
    muscles: ["hip flexors", "adductors", "abductors"],
    nameKeywords: ["squat", "lunge", "deadlift", "hip thrust", "split", "step-up", "step up", "leg raise", "bridge", "sumo"],
  },
};

/** "right_knee" → "knee", "lower_back" → "lower_back". Unknown injuries map to null. */
export function injuryRegion(injury: string): string | null {
  const key = injury.toLowerCase().replace(/^(left|right)_/, "").replace(/\s+/g, "_");
  return CONTRAINDICATIONS[key] ? key : null;
}

function lc(xs: string[] | undefined): string[] {
  return (xs ?? []).map((x) => x.toLowerCase());
}

/**
 * Returns the region that makes this exercise unsafe for the injury, or null.
 * Primary muscles and exercise-name patterns both count; secondary muscles do
 * not, except for the lower back, where loaded spinal flexion is the concern.
 */
export function contraindicatedBy(
  ex: Pick<Exercise, "name" | "primaryMuscles" | "secondaryMuscles">,
  injury: string
): string | null {
  const key = injuryRegion(injury);
  if (!key) return null;
  const rule = CONTRAINDICATIONS[key];
  const name = ex.name.toLowerCase();
  const primary = lc(ex.primaryMuscles);
  const secondary = key === "lower_back" ? lc(ex.secondaryMuscles) : [];
  const muscleHit = [...primary, ...secondary].some((m) => rule.muscles.some((r) => m.includes(r)));
  const nameHit = rule.nameKeywords.some((k) => name.includes(k));
  return muscleHit || nameHit ? rule.region : null;
}
