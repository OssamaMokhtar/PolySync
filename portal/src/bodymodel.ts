// Body model shared by the ProjectOS Load screen and the prototype (prototype/):
// which regions a session loads, and the 2D body geometry. Display model only.
import { sessionLoad, type HybridSession, type HybridWeek, type Modality } from "../../app/src/engine/hybrid";

// ── Region model ────────────────────────────────────────────────────────────
// Mapping v1: how a session's load (minutes × RPE) is shared across regions.
// A product assumption for display, NOT a physiological measurement and not
// coach-signed (docs/13 §7). The engine programmes lower-body work only, so
// upper-body regions are shown as "not programmed yet" rather than invented.
export type Region = "quads" | "hamstrings" | "glutes" | "calves" | "hips" | "core";
export const REGION_LABEL: Record<Region, string> = { quads: "Quads", hamstrings: "Hamstrings", glutes: "Glutes", calves: "Calves", hips: "Hip flexors", core: "Core" };
const RUN: Record<Region, number> = { calves: 0.25, quads: 0.25, hamstrings: 0.15, glutes: 0.15, hips: 0.15, core: 0.05 };
export const REGION_SHARE: Record<Modality, Record<Region, number>> = {
  strength: { quads: 0.3, glutes: 0.25, hamstrings: 0.2, core: 0.15, hips: 0.05, calves: 0.05 },
  power: { calves: 0.25, quads: 0.25, glutes: 0.2, hamstrings: 0.15, core: 0.1, hips: 0.05 },
  endurance_hard: RUN,
  endurance_easy: RUN,
};

export function regionLoads(w: HybridWeek) {
  const out = Object.fromEntries(Object.keys(REGION_LABEL).map((r) => [r, { load: 0, from: [] as { s: HybridSession; load: number }[] }])) as Record<Region, { load: number; from: { s: HybridSession; load: number }[] }>;
  for (const s of w.sessions) {
    const L = sessionLoad(s);
    for (const [r, share] of Object.entries(REGION_SHARE[s.modality]) as [Region, number][]) {
      out[r].load += L * share;
      out[r].from.push({ s, load: L * share });
    }
  }
  for (const r of Object.values(out)) r.load = Math.round(r.load);
  return out;
}


// ── Body geometry (viewBox 200 × 420) ───────────────────────────────────────
export type Shape = { region?: Region; d: string };
const cap = (x: number, y: number, w: number, hgt: number, r = Math.min(w, hgt) / 2) =>
  `M${x + r},${y}h${w - 2 * r}a${r},${r} 0 0 1 ${r},${r}v${hgt - 2 * r}a${r},${r} 0 0 1 -${r},${r}h-${w - 2 * r}a${r},${r} 0 0 1 -${r},-${r}v-${hgt - 2 * r}a${r},${r} 0 0 1 ${r},-${r}z`;
export const BODY: Record<"front" | "back", Shape[]> = {
  front: [
    { d: cap(80, 12, 40, 46, 20) }, // head
    { d: cap(90, 56, 20, 16, 6) }, // neck
    { d: cap(48, 74, 34, 30, 15) }, { d: cap(118, 74, 34, 30, 15) }, // shoulders
    { d: cap(72, 76, 56, 44, 14) }, // chest
    { d: cap(40, 106, 18, 92, 9) }, { d: cap(142, 106, 18, 92, 9) }, // arms
    { region: "core", d: cap(76, 124, 48, 56, 14) },
    { region: "hips", d: cap(76, 184, 48, 18, 9) },
    { region: "quads", d: cap(74, 206, 24, 82, 12) }, { region: "quads", d: cap(102, 206, 24, 82, 12) },
    { region: "calves", d: cap(76, 294, 20, 78, 10) }, { region: "calves", d: cap(104, 294, 20, 78, 10) },
    { d: cap(72, 376, 26, 14, 7) }, { d: cap(102, 376, 26, 14, 7) }, // feet
  ],
  back: [
    { d: cap(80, 12, 40, 46, 20) },
    { d: cap(90, 56, 20, 16, 6) },
    { d: cap(48, 74, 34, 30, 15) }, { d: cap(118, 74, 34, 30, 15) },
    { d: cap(72, 76, 56, 58, 14) }, // upper back
    { d: cap(40, 106, 18, 92, 9) }, { d: cap(142, 106, 18, 92, 9) },
    { region: "core", d: cap(78, 138, 44, 36, 12) }, // lower back
    { region: "glutes", d: cap(74, 178, 25, 32, 12) }, { region: "glutes", d: cap(101, 178, 25, 32, 12) },
    { region: "hamstrings", d: cap(74, 214, 24, 74, 12) }, { region: "hamstrings", d: cap(102, 214, 24, 74, 12) },
    { region: "calves", d: cap(76, 294, 20, 78, 10) }, { region: "calves", d: cap(104, 294, 20, 78, 10) },
    { d: cap(72, 376, 26, 14, 7) }, { d: cap(102, 376, 26, 14, 7) },
  ],
};
