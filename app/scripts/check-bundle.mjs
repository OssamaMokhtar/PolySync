#!/usr/bin/env node
// Asserts the client bundle cannot reach Gemini directly and carries no Gemini
// key. SECURITY.md claimed this check existed before it did; now it does.
// (The Firebase web config apiKey in the bundle is public by design.)
import { readdirSync, readFileSync } from "node:fs";

const dir = new URL("../dist/assets/", import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith(".js"));
if (files.length === 0) { console.error("no client bundle found; run npm run build first"); process.exit(1); }
const key = process.env.GEMINI_API_KEY;
const bad = [];
for (const f of files) {
  const js = readFileSync(new URL(f, dir), "utf8");
  if (/generativelanguage\.googleapis\.com|@google\/genai|GoogleGenAI/.test(js)) bad.push(`${f}: client code references the Gemini API`);
  if (key && js.includes(key)) bad.push(`${f}: contains the GEMINI_API_KEY value`);
}
if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
console.log(`client bundle clean (${files.length} files): no Gemini client, no Gemini key`);
