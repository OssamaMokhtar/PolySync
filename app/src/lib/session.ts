// What the Today screen may show for a planned session.
//
// The engine (and the bounds checker) are the only source of exercises. If a
// planned workout arrives with no exercises, the app must say so; it must
// never fill the gap from the exercise library, because library picks skip
// the injury filter and the bounds checker (UX-01, docs/13).

export interface PlannedExercise {
  exerciseId: string;
  [key: string]: unknown;
}

export type SessionContent<E extends PlannedExercise = PlannedExercise> =
  | { kind: "ready"; exercises: E[] }
  | { kind: "empty"; reason: string };

export function sessionContent<E extends PlannedExercise>(workout: { exercises?: E[] | null } | null | undefined): SessionContent<E> {
  const list = workout?.exercises;
  if (!Array.isArray(list) || list.length === 0) {
    return { kind: "empty", reason: "This session has no exercises yet. Rebuild your plan to get a checked session." };
  }
  return { kind: "ready", exercises: list };
}
