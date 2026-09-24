// Prototype runtime: persisted state, the usability-test event log (TTFW), haptics,
// screen-reader announcements and the Dynamic Type simulation. No network calls.
import { tokens } from "./tokens";

export interface LogEvent { t: number; name: string; props?: Record<string, unknown> }
const LOG_KEY = "polysync-proto-log";
const STATE_KEY = "polysync-proto-state";

const safeGet = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode: in-memory only */ } };
const safeDel = (k: string) => { try { localStorage.removeItem(k); } catch { /* ignore */ } };

let events: LogEvent[] = (() => { try { return JSON.parse(safeGet(LOG_KEY) ?? "[]"); } catch { return []; } })();
const listeners = new Set<() => void>();
export function track(name: string, props?: Record<string, unknown>) {
  events = [...events, { t: Date.now(), name, props }];
  safeSet(LOG_KEY, JSON.stringify(events));
  listeners.forEach((l) => l());
}
export const getEvents = () => events;
export const onEvents = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

/** Time to first workout: first tap in onboarding → first set (or first timed block) logged. */
export function ttfw(): { ms: number | null; taps: number } {
  const start = events.find((e) => e.name === "onboarding_start");
  const end = events.find((e) => e.name === "first_set_logged");
  const taps = start ? events.filter((e) => e.name === "tap" && e.t >= start.t && (!end || e.t <= end.t)).length : 0;
  return { ms: start && end ? end.t - start.t : null, taps };
}

export function exportLog() {
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ttfw: ttfw(), events }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `polysync-session-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function loadState<T>(): T | null { try { return JSON.parse(safeGet(STATE_KEY) ?? "null"); } catch { return null; } }
export const saveState = (s: unknown) => safeSet(STATE_KEY, JSON.stringify(s));
export function resetAll() { safeDel(STATE_KEY); safeDel(LOG_KEY); events = []; listeners.forEach((l) => l()); }

// ── Haptics (motion spec §3). iOS maps these to UIFeedbackGenerator; the web uses vibrate()
// where supported (Android), and the test panel shows every haptic so it can be observed.
export type Haptic = "light" | "soft" | "success" | "warning" | "selection";
const PATTERN: Record<Haptic, number | number[]> = { light: 10, soft: 8, success: [12, 40, 12], warning: [20, 60, 20], selection: 6 };
let hapticsOn = true;
export const setHaptics = (on: boolean) => { hapticsOn = on; };
export function haptic(kind: Haptic) {
  if (!hapticsOn) return;
  try { navigator.vibrate?.(PATTERN[kind]); } catch { /* unsupported */ }
  track("haptic", { kind });
}

// ── Announcements (WCAG 4.1.3). Polite by default; assertive for safety.
export function announce(message: string, assertive = false) {
  const el = document.getElementById(assertive ? "sr-assertive" : "sr-polite");
  if (!el) return;
  el.textContent = "";
  window.setTimeout(() => { el.textContent = message; }, 30);
}

// ── Dynamic Type simulation: rescale every text style token, keeping line-height ratios.
const STYLES = Object.keys(tokens.dark.text) as (keyof typeof tokens.dark.text)[];
export function applyTextScale(el: HTMLElement, scale: number) {
  for (const k of STYLES) {
    const t = tokens.dark.text[k];
    const fam = (t.fontFamily as readonly string[]).map((f) => (f.includes(" ") ? `'${f}'` : f)).join(", ");
    el.style.setProperty(`--ps-text-${k}`, `${t.fontWeight} ${Math.round(t.fontSize * scale)}px/${Math.round(t.lineHeight * scale)}px ${fam}`);
  }
  el.style.setProperty("--proto-scale", String(scale));
}
