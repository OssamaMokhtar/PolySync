import { createContext, useContext } from "react";
import type { Answers, Change, CheckIn, Plan, Readiness } from "./lib/engine";
import { DEFAULT_ANSWERS } from "./lib/engine";
import type { Card, Category, Region } from "./lib/safety";

export type Step = "S0" | "S0b" | "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S6b" | "S7";
export type Stage = "onboarding" | "session" | "done" | "save" | "plans" | "app";
export type Tab = "today" | "plan" | "recover" | "coach" | "you";

export interface Fact { id: string; text: string; source: string }
export interface Proposal { sessionId: string; toDay: number; state: "proposed" | "accepted" | "kept"; rules?: string[] }
export interface Msg { id: string; from: "you" | "ai" | "coach"; text: string; proposal?: Proposal; offer?: "motivation" | "pain" | "fasting"; ruleIds?: string[] }
export interface Settings { theme: "system" | "dark" | "light"; motion: "system" | "reduce"; textScale: number; region: Region; haptics: boolean; testPanel: boolean }
export interface SessionLog { sets: number; minutes: number; effort?: number; swaps: number; stopped?: boolean }

export interface State {
  stage: Stage;
  step: Step;
  answers: Answers;
  readinessAnswered: [boolean | null, boolean | null, boolean | null];
  club: { name: string; coach: string } | null;
  plan: Plan | null;
  basePlan: Plan | null;
  today: number;
  checkin: { c: CheckIn; readiness: Readiness; day: number } | null;
  changes: Change[];
  logs: Record<string, SessionLog>;
  missed: string[];
  activeSession: string | null;
  tab: Tab;
  memory: Fact[];
  chat: Msg[];
  coachThread: Msg[];
  settings: Settings;
  safety: { card: Card; category: Category } | null;
  paused: boolean;
  account: "none" | "local" | "apple" | "google" | "email";
  subscription: "free" | "trial";
}

export const todayIndex = () => (new Date().getDay() + 6) % 7;

export const initialState = (): State => ({
  stage: "onboarding",
  step: "S0",
  answers: { ...DEFAULT_ANSWERS },
  readinessAnswered: [null, null, null],
  club: null,
  plan: null,
  basePlan: null,
  today: todayIndex(),
  checkin: null,
  changes: [],
  logs: {},
  missed: [],
  activeSession: null,
  tab: "today",
  memory: [],
  chat: [],
  coachThread: [],
  settings: { theme: "system", motion: "system", textScale: 1, region: "UAE", haptics: true, testPanel: true },
  safety: null,
  paused: false,
  account: "none",
  subscription: "free",
});

export interface Ctx { s: State; update: (fn: (s: State) => State) => void }
export const StateCtx = createContext<Ctx>(null as unknown as Ctx);
export const useApp = () => useContext(StateCtx);
