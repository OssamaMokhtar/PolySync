// Validation for hybrid-engine requests. The engine trusts its inputs, so the
// API must not: every field is typed and bounded here.
import { weekStructureError, type DailySignal, type HybridProfile, type HybridWeek, type Modality, type Quality } from "../../engine/hybrid";
import type { Level } from "../../engine/types";

const LEVELS: Level[] = ["beginner", "intermediate", "advanced"];
const QUALITIES: Quality[] = ["endurance", "strength", "power"];
const int = (v: unknown, min: number, max: number) => typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

export function parseHybridProfile(x: unknown): { profile: HybridProfile } | { error: string } {
  if (!x || typeof x !== "object") return { error: "profile is required" };
  const p = x as Record<string, unknown>;
  if (!LEVELS.includes(p.level as Level)) return { error: "level must be beginner, intermediate or advanced" };
  if (!QUALITIES.includes(p.priority as Quality)) return { error: "priority must be endurance, strength or power" };
  const days = p.availableDays;
  if (!Array.isArray(days) || days.length === 0 || days.length > 7 || !days.every((d) => int(d, 0, 6))) return { error: "availableDays must be 1-7 integers 0-6" };
  for (const k of ["strengthSessions", "powerSessions", "hardEnduranceSessions", "easyEnduranceSessions"]) {
    if (!int(p[k], 0, 7)) return { error: `${k} must be an integer 0-7` };
  }
  if (typeof p.allowDoubles !== "boolean") return { error: "allowDoubles must be true or false" };
  if (!int(p.sessionMinutes, 20, 180)) return { error: "sessionMinutes must be an integer 20-180" };
  return {
    profile: {
      level: p.level as Level,
      priority: p.priority as Quality,
      availableDays: [...new Set(days as number[])],
      strengthSessions: p.strengthSessions as number,
      powerSessions: p.powerSessions as number,
      hardEnduranceSessions: p.hardEnduranceSessions as number,
      easyEnduranceSessions: p.easyEnduranceSessions as number,
      allowDoubles: p.allowDoubles,
      sessionMinutes: p.sessionMinutes as number,
    },
  };
}

/** A week sent by a client (last week's plan, or the week to adapt). Structure only; the rules run later. */
export function parseWeek(x: unknown, field: string): { week: HybridWeek } | { error: string } {
  const why = weekStructureError(x);
  if (why) return { error: `${field}: ${why}` };
  const w = x as HybridWeek;
  return {
    week: {
      priority: QUALITIES.includes(w.priority) ? w.priority : "endurance",
      prescribedBy: "engine",
      sessions: w.sessions.map((s) => ({ id: s.id, day: s.day, slot: s.slot, startHour: s.startHour, modality: s.modality, minutes: s.minutes, rpe: s.rpe, lowerBody: s.lowerBody })),
    },
  };
}

const MODALITIES: Modality[] = ["strength", "power", "endurance_easy", "endurance_hard"];

export function parseSignal(x: unknown): { signal: DailySignal } | { error: string } {
  if (!x || typeof x !== "object") return { error: "signal is required" };
  const s = x as Record<string, unknown>;
  if (!int(s.day, 0, 6)) return { error: "signal.day must be an integer 0-6" };
  if (!["green", "amber", "red"].includes(s.readiness as string)) return { error: "signal.readiness must be green, amber or red" };
  if (s.painFlag !== undefined && typeof s.painFlag !== "boolean") return { error: "signal.painFlag must be true or false" };
  let yesterday: DailySignal["yesterday"];
  if (s.yesterday !== undefined) {
    const y = s.yesterday as Record<string, unknown>;
    if (!y || !MODALITIES.includes(y.modality as Modality) || !int(y.rpe, 1, 10) || typeof y.lowerBody !== "boolean") return { error: "signal.yesterday must have modality, integer rpe 1-10 and lowerBody" };
    yesterday = { modality: y.modality as Modality, rpe: y.rpe as number, lowerBody: y.lowerBody };
  }
  return { signal: { day: s.day as number, readiness: s.readiness as DailySignal["readiness"], painFlag: s.painFlag === true, ...(yesterday ? { yesterday } : {}) } };
}
