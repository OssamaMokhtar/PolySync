#!/usr/bin/env node
// Type-error ratchet. The runtime came from PolyVerses with 206 type errors
// behind a CI step that could not fail (`|| echo`). The audit pass brought it
// to the number in typecheck-baseline.json. This gate fails if the count goes
// UP; when it goes down, lower the baseline in the same PR.
// The engine (src/engine) is separately checked under strict mode with 0 errors.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const baseline = JSON.parse(readFileSync(new URL("../typecheck-baseline.json", import.meta.url), "utf8")).errors;
let out = "";
try {
  out = execSync("npx tsc --noEmit", { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
} catch (e) {
  out = (e.stdout || "") + (e.stderr || "");
}
const count = (out.match(/error TS\d+/g) || []).length;
console.log(`type errors: ${count} (baseline ${baseline})`);
if (count > baseline) {
  console.error(out.split("\n").filter((l) => l.includes("error TS")).slice(0, 30).join("\n"));
  console.error(`\nType errors went up: ${count} > ${baseline}.`);
  process.exit(1);
}
if (count < baseline) console.log(`Down from ${baseline}. Lower typecheck-baseline.json to ${count}.`);
