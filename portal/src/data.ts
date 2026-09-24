// Everything the portal shows is read here, at build time, from the repo.
import evidenceFile from "../../product/data/evidence.json";
import modelFile from "../../product/data/model.json";
import risksFile from "../../product/data/risks.json";
import metricsFile from "../../product/data/metrics.json";
import output from "../../product/generated/model-output.json";
import safety from "../../evals/results/latest.json";
import hybrid from "../../evals/results/hybrid-latest.json";
import decisionLog from "../../docs/10-decision-log.md?raw";
import gapsMd from "../../docs/GAPS.md?raw";
import pilotMd from "../../product/pilot-plan.md?raw";
import competitorsFile from "../../product/data/competitors.json";
import roadmapFile from "../../product/data/roadmap.json";
import pilotStatusFile from "../../product/data/pilot-status.json";
import validationFile from "../../product/data/validation.json";

export type Cap = "yes" | "claimed" | "partial" | "no" | "unknown";
export interface Competitor { name: string; category: string; buyer: string; price: string; interference: Cap; readiness: Cap; coachInLoop: Cap; auditable: Cap; evidence: string[]; note: string }
export const competitors = competitorsFile as unknown as { asOf: string; method: string; finding: string; capabilities: Record<"interference" | "readiness" | "coachInLoop" | "auditable", { label: string; description: string }>; competitors: Competitor[] };
export interface RoadmapItem { title: string; ref: string; status: string; why?: string; gate?: string }
export const roadmap = roadmapFile as unknown as { rule: string; horizons: { id: string; label: string; window: string; items: RoadmapItem[] }[] };
export const pilotStatus = pilotStatusFile as unknown as { state: string; note: string; bars: { n: number; status: string; observed: string | number | null; source: string | null }[] };

export interface ClaimRepair { type: string; stage: number; fix: string; restated: string; after: string; evidence: string[]; proof: string }
export interface ValidationClaim { id: string; narrative: string; claim: string; check: string; verdict: string; evidence: string[]; implication: string; repair: ClaimRepair }
export interface ValidationOption { id: string; track: string; status: "build" | "test" | "wait" | "dont"; test: string; kill: string; ref: string }
export const validation = validationFile as unknown as {
  asOf: string; title: string; input: string;
  verdict: { headline: string; summary: string };
  verdictScale: Record<string, string>;
  claims: ValidationClaim[];
  validated: { finding: string; evidence: string[] }[];
  options: ValidationOption[];
  vision: { stage: string; what: string; gate: string }[];
  corrections: string[];
  repairRule: string;
  repairTypes: Record<string, string>;
  pushback: string[];
};

export const REPO = "https://github.com/OssamaMokhtar/PolySync";
export const blob = (path: string) => `${REPO}/blob/main/${path.replace(/^(\.\.\/)+/, "")}`;

export interface Claim {
  id: string;
  topic: string;
  claim: string;
  value: unknown;
  unit: string;
  source: string;
  url: string;
  accessed: string;
  grade: "A" | "B" | "C" | "D";
  usedIn: string[];
}
export const evidence = evidenceFile.claims as Claim[];
export const evidenceById = new Map(evidence.map((c) => [c.id, c]));
export const gradeRubric = evidenceFile.gradingRubric as Record<string, string>;

export interface Driver {
  id: string;
  label: string;
  unit: string;
  base: number;
  low: number;
  high: number;
  evidence?: string[];
  hypothesis?: { measuredBy: string };
  decision?: string;
}
export const model = modelFile as unknown as {
  asOf: string;
  markets: { id: string; label: string }[];
  segments: { id: string; label: string; scheduleKeys: string[] }[];
  drivers: Driver[];
};

export interface Risk {
  id: string;
  category: string;
  risk: string;
  trigger: string;
  likelihood: number;
  impact: number;
  mitigation: string;
  controlEvidence: string[];
  residual: { likelihood: number; impact: number };
  linked: string[];
  costIfHit: string;
}
export const risks = risksFile.risks as Risk[];
export const metrics = metricsFile;
export const modelOutput = output as unknown as {
  asOf: string;
  provenance: { drivers: number; evidenceBacked: number; hypotheses: number; decisions: number; evidenceGrades: Record<string, number> };
  sensitivity: Record<string, { metric: string; base: number; bear: number; bull: number; tornado: { driver: string; label: string; low: number; high: number; swing: number }[] } | string>;
  penetration: { athletes: number; clubs: number; shareOfHyroxGyms: number; hyroxGymsGrade: string };
};
export const safetyResults = safety;
export const hybridResults = hybrid;
export const outcomeTable = hybrid.sets.amber_outcomes_by_schedule.byDaysAndDoubles as Record<string, { n: number; moved: number; downgraded: number; escalated: number; kept_rate: number; coach_rate: number }>;

// ── Markdown sources parsed for lists (the docs stay the source of truth) ──
const plain = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/`([^`]+)`/g, "$1").trim();

export interface Adr { id: string; title: string; status: string; anchor: string }
export const adrs: Adr[] = [...decisionLog.matchAll(/^## (ADR-\d{3})\s*[—:-]\s*(.+)$/gm)].map((m) => {
  const after = decisionLog.slice((m.index ?? 0) + m[0].length);
  const status = (after.match(/\*\*Status:\*\*\s*([^\n]+)/) ?? [])[1] ?? "";
  const heading = m[0].slice(3); // GitHub slugs the full heading text
  const anchor = heading.toLowerCase().replace(/[^\w\- ]/g, "").replace(/ /g, "-");
  return { id: m[1], title: m[2].trim(), status: plain(status), anchor };
});

function tableRows(md: string, after: string): string[][] {
  const start = md.indexOf(after);
  const lines = md.slice(start).split("\n");
  const rows: string[][] = [];
  let seen = false;
  for (const l of lines) {
    if (l.startsWith("|")) {
      seen = true;
      if (/^\|[\s|:-]+\|$/.test(l)) continue;
      rows.push(l.split("|").slice(1, -1).map((c) => plain(c)));
    } else if (seen) break;
  }
  return rows.slice(1); // drop header
}
export const gaps = tableRows(gapsMd, "| # |").map((r) => ({ id: r[0], gap: r[1], damage: r[3], status: r[5] }));
export const passBars = tableRows(pilotMd, "## Pass bars").map((r) => ({ n: r[0], measure: r[1], pass: r[2], source: r[3], fails: r[4] }));
