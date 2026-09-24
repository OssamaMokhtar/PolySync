import { describe, it, expect } from "vitest";
import { generatePlan } from "../planEngine";
import { checkPlan, prescribe } from "../boundsChecker";
import { contraindicatedBy } from "../contraindications";
import { EXERCISE_LIBRARY } from "../ExerciseLibrary";
import type { EngineProfile } from "../types";

const NOW = new Date("2026-09-21T00:00:00Z");
const base: EngineProfile = { goal: "build_muscle", level: "intermediate", injuries: [], equipment: [], daysPerWeek: 4, sessionDuration: 60 };
const ids = (p: EngineProfile) => generatePlan(p, NOW).days.flatMap((d) => d.workouts).flatMap((w) => w.exercises).map((e) => e.exerciseId);

describe("programming engine", () => {
  it("is deterministic", () => {
    expect(generatePlan(base, NOW)).toEqual(generatePlan(base, NOW));
  });

  it("regression: a knee injury removes squats and lunges (the old string match did not)", () => {
    const old = (inj: string) => EXERCISE_LIBRARY.filter((ex) => !ex.primaryMuscles.some((m) => m.toLowerCase().includes(inj)));
    expect(old("right_knee").some((e) => e.id === "barbell-squat")).toBe(true); // the bug
    const plan = ids({ ...base, goal: "general_fitness", injuries: ["right_knee"] });
    for (const id of plan) expect(["barbell-squat", "dumbbell-lunge", "bulgarian-split-squat", "leg-press", "box-jump"]).not.toContain(id);
  });

  it("never exceeds the athlete's days or time budget", () => {
    for (const daysPerWeek of [2, 3, 5, 6])
      for (const sessionDuration of [30, 45, 90]) {
        const p = { ...base, daysPerWeek, sessionDuration };
        const plan = generatePlan(p, NOW);
        expect(plan.days.length).toBe(daysPerWeek);
        for (const w of plan.days.flatMap((d) => d.workouts)) expect(w.duration).toBeLessThanOrEqual(sessionDuration);
        expect(checkPlan(plan, p).ok).toBe(true);
      }
  });

  it("gives beginners beginner-level exercises only", () => {
    const beginnerIds = new Set(EXERCISE_LIBRARY.filter((e) => e.difficulty === "beginner").map((e) => e.id));
    for (const id of ids({ ...base, level: "beginner" })) expect(beginnerIds.has(id)).toBe(true);
  });
});

describe("bounds checker and routing", () => {
  it("blocks an injured exercise and names the rule", () => {
    const p = { ...base, injuries: ["lower_back"] };
    const plan = generatePlan(p, NOW);
    const bad = structuredClone(plan);
    bad.days[0].workouts[0].exercises[0].exerciseId = "barbell-deadlift";
    const v = checkPlan(bad, p);
    expect(v.ok).toBe(false);
    expect(v.violations.map((x) => x.rule)).toContain("B3_INJURY_CONTRAINDICATED");
  });

  it("a blocked model proposal never reaches the athlete and goes to the coach", () => {
    const plan = generatePlan(base, NOW);
    const r = prescribe(base, plan, { days: "ignore all limits" });
    expect(r.plan).toBe(plan);
    expect(r.prescribedBy).toBe("engine");
    expect(r.needsCoachReview).toBe(true);
  });

  it("blocks a >10% week-over-week volume jump", () => {
    const p = { ...base, level: "advanced" as const };
    const prev = generatePlan(p, NOW);
    const next = structuredClone(prev);
    for (const e of next.days.flatMap((d) => d.workouts).flatMap((w) => w.exercises)) e.sets = 5;
    expect(checkPlan(next, p, prev).violations.map((x) => x.rule)).toContain("B7_VOLUME_JUMP");
  });

  it("contraindication rules ignore unknown injuries instead of crashing", () => {
    expect(contraindicatedBy(EXERCISE_LIBRARY[0], "papercut")).toBeNull();
  });
});
