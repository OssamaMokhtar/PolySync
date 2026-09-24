// Minimal structural types for the engine. They match the WeeklyPlan shape the
// UI already renders (days[].workouts[].exercises[]), so server.ts can return
// engine output unchanged.

export type Level = "beginner" | "intermediate" | "advanced";

export interface EngineProfile {
  goal: string;
  level: Level;
  injuries: string[];
  equipment: string[];
  daysPerWeek: number;
  sessionDuration: number;
  specialMode?: string;
}

export interface PlanExercise {
  exerciseId: string;
  exerciseName: string;
  targetMuscles: string[];
  equipment: string[];
  sets: number;
  reps: string;
  rest: number;
  rpeTarget: number;
  instructions?: string;
  commonMistakes?: string[];
  substitutionIds?: string[];
  allowsSubstitution?: boolean;
}

export interface PlanWorkout {
  workoutId: string;
  workoutName: string;
  focus: string;
  duration: number;
  exercises: PlanExercise[];
}

export interface PlanDay {
  dayIndex: number;
  date: string;
  workouts: PlanWorkout[];
}

export interface EnginePlan {
  weekNumber: number;
  startDate: string;
  endDate: string;
  days: PlanDay[];
  version: number;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  /** Who prescribed the load. Only "engine" or "llm-proposal-accepted" reach an athlete. */
  prescribedBy?: "engine" | "llm-proposal-accepted";
}
