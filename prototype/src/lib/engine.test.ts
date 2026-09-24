import { describe, expect, it } from "vitest";
import { checkHybridWeek } from "../../../app/src/engine/hybrid";
import { adaptToday, buildPlan, checkProposal, DEFAULT_ANSWERS, readinessFrom, repairMissed, sessionsOn, starterSession, swapOptions, type Answers } from "./engine";

const hybrid: Answers = { ...DEFAULT_ANSWERS, goal: "hyrox", days: [0, 1, 2, 3, 5], doubles: true, minutes: 60, level: "intermediate" };

describe("prototype adapters over the production engine", () => {
  it("every onboarding path produces a week the production checker passes", () => {
    for (const goal of ["hybrid", "hyrox"] as const)
      for (const days of [[0, 2, 4], [0, 1, 3, 5], [0, 1, 2, 3, 5]])
        for (const doubles of [true, false]) {
          const a = { ...DEFAULT_ANSWERS, goal, days, doubles };
          const p = buildPlan(a);
          expect(checkHybridWeek(p.week, p.profile!, {}).ok).toBe(true);
          expect(p.week.sessions.every((s) => days.includes(s.day))).toBe(true);
        }
  });
  it("strength path uses generatePlan and the athlete's own days", () => {
    const p = buildPlan({ ...DEFAULT_ANSWERS, goal: "fitter", days: [1, 3, 5] });
    expect(p.week.sessions.map((s) => s.day)).toEqual([1, 3, 5]);
    expect(p.week.sessions.every((s) => (s.exercises?.length ?? 0) > 0)).toBe(true);
  });
  it("any readiness 'yes' in onboarding leaves no hard session (gentle cap)", () => {
    for (const goal of ["fitter", "hybrid", "hyrox"] as const) {
      const p = buildPlan({ ...hybrid, goal, readinessYes: [false, false, true] });
      expect(p.gentle).toBe(true);
      expect(p.week.sessions.every((s) => s.modality === "endurance_easy")).toBe(true);
    }
  });
  it("the starter session exists for any day with nothing planned", () => {
    expect(starterSession(6)).toMatchObject({ day: 6, minutes: 15, modality: "endurance_easy" });
  });
  it("check-in mapping: pain → red, bad sleep → amber, fresh → green", () => {
    expect(readinessFrom({ sleep: "well", legs: "fresh", pain: true })).toBe("red");
    expect(readinessFrom({ sleep: "badly", legs: "fresh", pain: false })).toBe("amber");
    expect(readinessFrom({ sleep: "well", legs: "fresh", pain: false })).toBe("green");
  });
  it("amber on a hard day: adaptDay moves or downgrades, and the result passes the checker", () => {
    const p = buildPlan(hybrid);
    const hardDay = p.week.sessions.find((s) => s.modality !== "endurance_easy")!.day;
    const { plan, change } = adaptToday(p, hybrid, hardDay, "amber", false, "Sara");
    expect(["moved", "downgraded"]).toContain(change?.outcome);
    expect(sessionsOn(plan, hardDay).every((s) => s.modality === "endurance_easy")).toBe(true);
    expect(checkHybridWeek(plan.week, plan.profile!, { readiness: { [hardDay]: "amber" }, previous: p.week }).ok).toBe(true);
  });
  it("pain escalates: nothing loaded that day", () => {
    const p = buildPlan(hybrid);
    const d = p.week.sessions[0].day;
    const { plan, change } = adaptToday(p, hybrid, d, "red", true);
    expect(change?.outcome).toBe("escalated");
    expect(sessionsOn(plan, d).every((s) => s.modality === "endurance_easy")).toBe(true);
  });
  it("missed-session repair never produces a week the checker rejects", () => {
    const p = buildPlan(hybrid);
    for (const s of p.week.sessions) {
      const { plan, change } = repairMissed(p, s, s.day + 1, hybrid.days);
      expect(["repaired", "dropped"]).toContain(change.outcome);
      expect(checkHybridWeek(plan.week, plan.profile!, {}).findings.filter((f) => f.severity === "block")).toEqual([]);
    }
  });
  it("chat proposals are decided by prescribeHybrid, not the model", () => {
    const p = buildPlan(hybrid);
    const run = p.week.sessions.find((s) => s.modality === "endurance_hard")!;
    const r = checkProposal(p, run.id, 6); // Sunday is not an available day
    expect(r.accepted).toBe(false);
  });
  it("swap offers only exercises the engine allows for this athlete", () => {
    const a = { ...DEFAULT_ANSWERS, goal: "fitter" as const, injuries: ["knee"] };
    const p = buildPlan(a);
    for (const ex of p.week.sessions[0].exercises!) for (const o of swapOptions(ex, a)) expect(o.name.toLowerCase()).not.toMatch(/squat|lunge/);
  });
});
