#!/usr/bin/env node
// Architecture gate (ADR-012, ARCHITECTURE.md). Fails CI when:
//   1. a module imports across a boundary the architecture does not allow, or
//   2. content from another product (PolyVerses, Product Leadership OS) lands in this repo.
// No dependencies: runs with plain Node before any npm install.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, normalize, relative, resolve } from "node:path";

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), "..");
const files = execSync("git ls-files", { cwd: ROOT, encoding: "utf8" }).split("\n").filter(Boolean);
const errors = [];

// ── 1. Import boundaries ─────────────────────────────────────────────────────
// Which top-level areas each area may import from (besides itself and npm packages).
const ALLOWED = {
  engine: [],                                          // pure domain core: depends on nothing
  app: ["engine"],                                     // runtime: client + server
  prototype: ["engine"],                               // design prototype on the real engine
  evals: ["engine"],                                   // tests the engine against its specification
  portal: ["engine", "product", "evals", "docs"],      // ProjectOS reads data and results at build time
  product: [],                                         // product data and its build script
  scripts: [],
};
const CODE = /\.(ts|tsx|mjs|js)$/;
const IMPORT = /(?:import|export)\s[^'"]*?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|^\s*import\s*["']([^"']+)["']/gm;
for (const f of files) {
  const area = f.split("/")[0];
  if (!(area in ALLOWED) || !CODE.test(f) || f.includes("node_modules/")) continue;
  const src = readFileSync(resolve(ROOT, f), "utf8");
  for (const m of src.matchAll(IMPORT)) {
    const spec = (m[1] ?? m[2] ?? m[3] ?? "").replace(/\?raw$/, "");
    if (!spec.startsWith(".")) continue; // npm package or node: built-in
    const target = normalize(relative(ROOT, resolve(ROOT, dirname(f), spec)));
    if (target.startsWith("..")) { errors.push(`${f}: imports outside the repo (${spec})`); continue; }
    const to = target.split("/")[0];
    if (to !== area && !ALLOWED[area].includes(to)) errors.push(`${f}: ${area}/ may not import from ${to}/ (${spec}). Allowed: ${ALLOWED[area].join(", ") || "nothing outside " + area + "/"}`);
  }
}

// The engine has no runtime dependencies (devDependencies are for tests only).
const enginePkg = JSON.parse(readFileSync(resolve(ROOT, "engine/package.json"), "utf8"));
if (enginePkg.dependencies && Object.keys(enginePkg.dependencies).length) errors.push(`engine/package.json: the engine must have no runtime dependencies (${Object.keys(enginePkg.dependencies).join(", ")})`);

// ── 2. One product per repo ─────────────────────────────────────────────────
// PolyVerses and Product Leadership OS (PLOS) live in their own repositories.
const FOREIGN_PATH = /(^|\/)(skills|agents|prompts)\/|AthenaCodeStore|OrchestrationConsole|PromptConsole|AgentNetwork/i;
const FOREIGN_TEXT = /PolyVerses|Product Leadership OS|\bPLOS\b|product-leadership-os/i;
// Files allowed to name the other products: the decision that separates them, this
// gate, a dated UX review that records the clean-up, and an infrastructure id
// (the Firestore database name cannot be renamed without migrating data; ADR-012).
const MAY_NAME = new Set(["ARCHITECTURE.md", "docs/10-decision-log.md", "docs/13-ux-review.md", "scripts/check-boundaries.mjs", "app/firebase-applet-config.json"]);
const TEXT = /\.(ts|tsx|mjs|js|json|md|html|css|yml|yaml|txt)$/;
for (const f of files) {
  if (FOREIGN_PATH.test(f)) errors.push(`${f}: looks like PolyVerses/PLOS content (agents, skills, prompts, orchestration). It belongs in its own repo.`);
  if (MAY_NAME.has(f) || !TEXT.test(f) || f.endsWith("package-lock.json")) continue;
  const lines = readFileSync(resolve(ROOT, f), "utf8").split("\n");
  lines.forEach((l, i) => { if (FOREIGN_TEXT.test(l)) errors.push(`${f}:${i + 1}: names another product ("${l.trim().slice(0, 80)}")`); });
}

if (errors.length) {
  console.error(errors.map((e) => `✕ ${e}`).join("\n"));
  console.error(`\n${errors.length} boundary violation(s). See ARCHITECTURE.md.`);
  process.exit(1);
}
console.log(`boundaries OK: ${files.length} files; imports follow ARCHITECTURE.md; no PolyVerses or PLOS content`);
