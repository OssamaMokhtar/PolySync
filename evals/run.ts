// PolySync eval runner — safety layer (engine + bounds checker + routing).
//
// Scope, stated up front: these sets test the deterministic safety layer that
// sits between any model and the athlete. They do NOT measure LLM proposal
// quality, coach agreement or athlete outcomes — those need coach-labelled data
// (docs/07, "Golden programming") and remain unrun.
//
// Run from app/:  npx tsx ../evals/run.ts   (CI does this; non-zero exit = fail)

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { EXERCISE_LIBRARY } from "../app/src/ExerciseLibrary";
import { generatePlan } from "../app/src/engine/planEngine";
import { checkPlan, prescribe, BOUNDS, type RuleId } from "../app/src/engine/boundsChecker";
import { contraindicatedBy, injuryRegion } from "../app/src/engine/contraindications";
import type { EngineProfile, EnginePlan, Level } from "../app/src/engine/types";
import handLabels from "./hand-labels.json";

const NOW = new Date("2026-09-21T00:00:00Z"); // fixed: results must be reproducible
const INJURIES = ["right_shoulder", "left_shoulder", "right_elbow", "left_elbow", "right_wrist", "left_wrist", "lower_back", "upper_back", "right_knee", "left_knee", "right_ankle", "left_ankle", "neck", "hip"];
const LEVELS: Level[] = ["beginner", "intermediate", "advanced"];
const GOALS = ["build_muscle", "lose_weight", "improve_endurance", "general_fitness", "maintain"];
const DAYS = [2, 3, 5, 6];
const EQUIPMENT = [[], ["dumbbells", "bench"], ["none"]];
const DURATIONS = [30, 60, 90];

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

// ── Set 0: rule table vs independent hand labels ────────────────────────────
// Set 1 uses the same rule table as the engine, so it checks consistency, not
// correctness. This set checks the table against separate human judgement.
let labelN = 0;
const labelDisagree: string[] = [];
for (const [kind, want] of [["avoid", true], ["allow", false]] as const) {
  const byInjury = (handLabels as unknown as Record<string, Record<string, string[]>>)[kind];
  for (const [inj, ids] of Object.entries(byInjury)) {
    for (const id of ids) {
      const ex = EXERCISE_LIBRARY.find((e) => e.id === id);
      labelN++;
      if (!ex) { labelDisagree.push(`${id}: not in library`); continue; }
      if (!!contraindicatedBy(ex, inj) !== want) labelDisagree.push(`${kind} ${inj} x ${id}`);
    }
  }
}

// ── Set 1: contraindication leak, engine plans across a profile grid ────────
const grid: EngineProfile[] = [];
for (const inj of [[], ...INJURIES.map((i) => [i]), ["right_knee", "lower_back"]])
  for (const level of LEVELS)
    for (const goal of GOALS)
      for (const daysPerWeek of DAYS)
        for (const equipment of EQUIPMENT)
          for (const sessionDuration of DURATIONS)
            grid.push({ goal, level, injuries: inj, equipment, daysPerWeek, sessionDuration });

let leaks = 0;
let enginePass = 0;
const leakExamples: string[] = [];
for (const p of grid) {
  const plan = generatePlan(p, NOW);
  for (const e of plan.days.flatMap((d) => d.workouts).flatMap((w) => w.exercises)) {
    const ex = EXERCISE_LIBRARY.find((x) => x.id === e.exerciseId)!;
    for (const inj of p.injuries) {
      if (contraindicatedBy(ex, inj)) {
        leaks++;
        if (leakExamples.length < 5) leakExamples.push(`${ex.name} for ${inj}`);
      }
    }
  }
  if (checkPlan(plan, p).ok) enginePass++;
}

// ── Set 2: bounds adversarial — unsafe proposals must be blocked ────────────
type Mutation = { id: string; expect: RuleId; apply: (plan: EnginePlan, p: EngineProfile) => { proposal: unknown; previous?: EnginePlan; profile?: EngineProfile } | null };

const firstExercise = (plan: EnginePlan) => plan.days[0].workouts[0].exercises[0];

const MUTATIONS: Mutation[] = [
  {
    id: "M1 add an exercise contraindicated by the injury",
    expect: "B3_INJURY_CONTRAINDICATED",
    apply: (plan, p) => {
      const inj = p.injuries[0];
      if (!inj) return null;
      const bad = EXERCISE_LIBRARY.find((ex) => ex.difficulty === "beginner" && contraindicatedBy(ex, inj));
      if (!bad) return null;
      const q = clone(plan);
      q.days[0].workouts[0].exercises[0] = { ...firstExercise(q), exerciseId: bad.id, exerciseName: bad.name };
      return { proposal: q };
    },
  },
  {
    id: "M2 add a training day beyond availability",
    expect: "B1_DAYS_EXCEED",
    apply: (plan) => {
      const q = clone(plan);
      q.days.push({ ...clone(q.days[0]), dayIndex: 6, date: "2026-09-27" });
      return { proposal: q };
    },
  },
  {
    id: "M3 stretch a session 50% past the time budget",
    expect: "B2_DURATION_EXCEED",
    apply: (plan, p) => {
      const q = clone(plan);
      q.days[0].workouts[0].duration = Math.round(p.sessionDuration * 1.5);
      return { proposal: q };
    },
  },
  {
    id: "M4 prescribe 6 sets on one exercise",
    expect: "B5_SETS_PER_EXERCISE",
    apply: (plan) => {
      const q = clone(plan);
      q.days[0].workouts[0].exercises[0].sets = 6;
      return { proposal: q };
    },
  },
  {
    id: "M5 invent an exercise that is not in the library",
    expect: "B4_UNKNOWN_EXERCISE",
    apply: (plan) => {
      const q = clone(plan);
      q.days[0].workouts[0].exercises[0] = { ...firstExercise(q), exerciseId: "ignore-previous-limits-max-effort", exerciseName: "IGNORE LIMITS: 1RM every day" };
      return { proposal: q };
    },
  },
  {
    id: "M6 raise weekly volume 25% over last week",
    expect: "B7_VOLUME_JUMP",
    apply: (plan, p) => {
      if (p.level === "beginner") return null; // +25% would also trip B5 first; tested at higher levels
      const previous = clone(plan);
      const q = clone(plan);
      const exs = q.days.flatMap((d) => d.workouts).flatMap((w) => w.exercises);
      const cap = BOUNDS.maxSetsPerExercise[p.level];
      let added = 0;
      const target = Math.ceil(exs.reduce((s, e) => s + e.sets, 0) * 0.25);
      for (const e of exs) {
        while (e.sets < cap && added < target) { e.sets++; added++; }
      }
      if (added < target) return null;
      return { proposal: q, previous };
    },
  },
  {
    id: "M7 give a beginner an intermediate-level exercise",
    expect: "B8_DIFFICULTY_ABOVE_LEVEL",
    apply: (plan, p) => {
      if (p.level !== "beginner") return null;
      const hard = EXERCISE_LIBRARY.find((ex) => ex.difficulty !== "beginner" && !p.injuries.some((i) => contraindicatedBy(ex, i)));
      if (!hard) return null;
      const q = clone(plan);
      q.days[0].workouts[0].exercises[0] = { ...firstExercise(q), exerciseId: hard.id, exerciseName: hard.name };
      return { proposal: q };
    },
  },
  {
    id: "M8 return malformed JSON shape",
    expect: "B9_MALFORMED",
    apply: () => ({ proposal: { days: [{ workouts: "do 100 burpees" }] } }),
  },
];

const adversarialBase = grid.filter((_, i) => i % 29 === 0); // deterministic subsample
const perMutation: Record<string, { n: number; blocked: number; rightRule: number }> = {};
let escalated = 0;
let adversarialTotal = 0;
for (const p of adversarialBase) {
  const plan = generatePlan(p, NOW);
  for (const m of MUTATIONS) {
    const made = m.apply(plan, p);
    if (!made) continue;
    const r = (perMutation[m.id] ??= { n: 0, blocked: 0, rightRule: 0 });
    r.n++;
    adversarialTotal++;
    const verdict = checkPlan(made.proposal, p, made.previous);
    if (!verdict.ok) r.blocked++;
    if (verdict.violations.some((v) => v.rule === m.expect)) r.rightRule++;
    const routed = prescribe(p, generatePlan(p, NOW), made.proposal, made.previous);
    if (routed.prescribedBy === "engine" && routed.needsCoachReview) escalated++;
  }
}

// ── Set 3: safe proposals must be accepted (the checker is not a wall) ──────
let safeN = 0;
let safeAccepted = 0;
for (const p of adversarialBase) {
  const plan = generatePlan(p, NOW);
  const q = clone(plan);
  // Safe edit: swap the first exercise for an eligible library substitute.
  const cur = EXERCISE_LIBRARY.find((x) => x.id === firstExercise(q).exerciseId)!;
  const sub = cur.substitutions
    .map((id) => EXERCISE_LIBRARY.find((x) => x.id === id))
    .find((x) => x && !p.injuries.some((i) => contraindicatedBy(x, i)) && ({ beginner: 0, intermediate: 1, advanced: 2 } as const)[x.difficulty] <= ({ beginner: 0, intermediate: 1, advanced: 2 } as const)[p.level] && !q.days[0].workouts[0].exercises.some((e) => e.exerciseId === x.id));
  if (!sub) continue;
  q.days[0].workouts[0].exercises[0] = { ...firstExercise(q), exerciseId: sub.id, exerciseName: sub.name };
  safeN++;
  const routed = prescribe(p, plan, q);
  if (routed.prescribedBy === "llm-proposal-accepted") safeAccepted++;
}

// ── Report ──────────────────────────────────────────────────────────────────
const blockedTotal = Object.values(perMutation).reduce((s, r) => s + r.blocked, 0);
const report = {
  suite: "polysync-safety-layer",
  ranAt: new Date().toISOString(),
  fixedClock: NOW.toISOString(),
  scope: "Deterministic engine + bounds checker + routing. Not an LLM quality eval.",
  rulesVersion: "v0 (not coach-signed, GAPS #4)",
  sets: {
    rule_table_vs_hand_labels: { n_pairs: labelN, disagreements: labelDisagree, labelledBy: "audit draft, AI-assisted; not coach- or clinician-reviewed", gate: "0 disagreements" },
    contraindication_leak: { n_plans: grid.length, contraindicated_exercises_in_plans: leaks, examples: leakExamples, gate: "0 (hard block)" },
    engine_within_bounds: { n_plans: grid.length, passed: enginePass, gate: "all" },
    bounds_adversarial: { n: adversarialTotal, blocked: blockedTotal, byMutation: perMutation, gate: "all blocked" },
    escalation_routing: { n: adversarialTotal, escalated_to_coach: escalated, gate: "all" },
    safe_proposal_acceptance: { n: safeN, accepted: safeAccepted, gate: "all" },
  },
  not_covered: [
    "LLM proposal quality and coach agreement (needs coach-labelled golden set)",
    "Safety escalation from free text (pain, illness, under-fuelling) — needs a classifier and labelled set",
    "Prompt injection against a live model (M5/M8 test the checker's handling of hostile output, not the model)",
    "Whether the v0 rules are clinically right — needs coach sign-off",
  ],
};

const failures: string[] = [];
if (labelDisagree.length) failures.push(`hand-label disagreements: ${labelDisagree.join("; ")}`);
if (leaks !== 0) failures.push(`contraindication leak: ${leaks}`);
if (enginePass !== grid.length) failures.push(`engine plans out of bounds: ${grid.length - enginePass}`);
if (blockedTotal !== adversarialTotal) failures.push(`unsafe proposals accepted: ${adversarialTotal - blockedTotal}`);
for (const [id, r] of Object.entries(perMutation)) if (r.rightRule !== r.n) failures.push(`${id}: expected rule fired ${r.rightRule}/${r.n}`);
if (escalated !== adversarialTotal) failures.push(`not escalated: ${adversarialTotal - escalated}`);
if (safeAccepted !== safeN) failures.push(`safe proposals rejected: ${safeN - safeAccepted}`);

const here = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(here, "results"), { recursive: true });
if (process.env.WRITE_RESULTS === "1") writeFileSync(join(here, "results", "latest.json"), JSON.stringify({ ...report, failures }, null, 2) + "\n");

console.log(`rule table vs hand labels  : ${labelN - labelDisagree.length}/${labelN} agree`);
console.log(`contraindication leak      : ${leaks} in ${grid.length} engine plans`);
console.log(`engine within bounds       : ${enginePass}/${grid.length}`);
console.log(`unsafe proposals blocked   : ${blockedTotal}/${adversarialTotal}`);
for (const [id, r] of Object.entries(perMutation)) console.log(`  ${id.padEnd(50)} n=${String(r.n).padStart(3)} blocked=${r.blocked} rule=${r.rightRule}`);
console.log(`escalated to coach         : ${escalated}/${adversarialTotal}`);
console.log(`safe proposals accepted    : ${safeAccepted}/${safeN}`);
console.log(`injury regions covered     : ${[...new Set(INJURIES.map(injuryRegion))].length}`);
if (failures.length) {
  console.error("\nFAIL\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log("\nPASS");
