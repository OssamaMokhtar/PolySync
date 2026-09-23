// Validation for hybrid-engine requests. The engine trusts its inputs, so the
// API must not: every field is typed and bounded here.
import type { HybridProfile, Quality } from "../src/engine/hybrid";
import type { Level } from "../src/engine/types";

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
