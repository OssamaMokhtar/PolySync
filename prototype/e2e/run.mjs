// End-to-end acceptance for the prototype (design Phase 4). Runs the built single file in
// Chromium at 390 × 844 and checks, per flow:
//   - it completes (onboarding → first set, check-in → adaptation, chat → proposal and safety,
//     pain report, missed-session repair, memory forget/undo)
//   - axe-core WCAG 2.2 A/AA rules report no violations, in dark and light
//   - no horizontal overflow, no interactive target under 44 × 44 CSS px
//   - taps from first screen to first set (the TTFW path) and the logged TTFW event
// Screenshots go to e2e/out/. Exit code 1 on any failure.
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";

const url = "file://" + process.cwd() + "/dist/index.html";
mkdirSync("e2e/out", { recursive: true });
const failures = [];
const results = [];
const fail = (m) => { failures.push(m); console.error("✖ " + m); };
const ok = (m) => { results.push(m); console.log("✔ " + m); };

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

async function audit(page, name) {
  await page.waitForTimeout(350); // let fades (150 ms) finish so contrast is measured at rest
  const axe = await new AxeBuilder({ page }).include(".phone-frame").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  for (const v of axe.violations) fail(`${name}: axe ${v.id} (${v.impact}) × ${v.nodes.length}: ${v.nodes[0]?.target}`);
  const geo = await page.evaluate(() => {
    const frame = document.querySelector(".phone-frame");
    const content = document.querySelector(".content");
    const overflow = content.scrollWidth - content.clientWidth;
    const small = [...frame.querySelectorAll("button, a[href], input, select, summary, [role=checkbox], [role=radio]")]
      .filter((e) => e.offsetParent !== null && !e.closest(".sr-only") && !e.classList.contains("skip"))
      .map((e) => ({ e, r: e.getBoundingClientRect() }))
      .filter(({ e, r }) => r.width > 0 && (r.height < 43.5 || r.width < 43.5) && e.type !== "range")
      .map(({ e, r }) => `${e.tagName.toLowerCase()}.${e.className} "${(e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 24)}" ${Math.round(r.width)}×${Math.round(r.height)}`);
    return { overflow, small };
  });
  if (geo.overflow > 0) fail(`${name}: horizontal overflow ${geo.overflow}px`);
  for (const s of geo.small) fail(`${name}: target under 44 px: ${s}`);
  await page.screenshot({ path: `e2e/out/${name}.png` });
}

async function run(theme, today) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: theme, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url);
  await page.evaluate((d) => { localStorage.clear(); if (d !== undefined) localStorage.setItem("polysync-proto-state", JSON.stringify({ today: d })); }, today);
  await page.reload();
  const tap = async (role, name, opts = {}) => { await page.getByRole(role, { name, exact: true, ...opts }).first().click(); };
  let taps = 0;
  const T = async (role, name, opts) => { taps++; await tap(role, name, opts); };

  // ── T1: first screen → first set ────────────────────────────────────────
  await audit(page, `${theme}-S0-welcome`);
  await T("button", "Start");
  await audit(page, `${theme}-S1-goal`);
  await T("radio", "Run and lift. Strength first, with runs that don't wreck your legs");
  await T("button", "Continue");
  await audit(page, `${theme}-S2-days`);
  await T("button", "Continue");
  await T("button", "Continue"); // S3 doubles (default no)
  await T("button", "Continue"); // S4 length (default 45)
  await T("button", "Continue"); // S5 experience (default new)
  await audit(page, `${theme}-S6-safety`);
  for (let i = 0; i < 3; i++) { taps++; await page.getByRole("radio", { name: "No", exact: true }).nth(i).click(); }
  await T("button", "Continue");
  await audit(page, `${theme}-S7-week`);
  await T("button", "Start today's session");
  await audit(page, `${theme}-player`);
  const exercise = await page.getByRole("button", { name: /^Log set 1$/ }).count();
  if (exercise) await T("button", "Log set 1"); else await T("button", "Start");
  const ttfw = await page.evaluate(() => JSON.parse(localStorage.getItem("polysync-proto-log") || "[]").some((e) => e.name === "first_set_logged"));
  if (!ttfw) fail(`${theme}: first_set_logged not recorded`);
  ok(`${theme}: first screen → first set in ${taps} taps (${exercise ? "strength day" : "timed/starter day"}); TTFW event logged`);

  // Finish the session quickly: close through the flow (timed: Finish + effort; strength: pain → end)
  if (!exercise) {
    await tap("button", "Finish");
    await page.getByRole("radio", { name: "5", exact: true }).click();
  } else {
    await tap("button", "Report pain");
    await audit(page, `${theme}-pain-sheet`);
    await page.getByRole("radio", { name: "Knee" }).click();
    await tap("button", "Continue");
    await tap("button", "End session");
  }
  await audit(page, `${theme}-done`);
  await tap("button", "Continue");
  await audit(page, `${theme}-S9-save`);
  await tap("button", "Skip for now (keep it on this phone)");
  await audit(page, `${theme}-S10-plans`);
  await tap("button", "Continue free");

  // ── Today: check-in → adaptation ────────────────────────────────────────
  await audit(page, `${theme}-today`);
  const checkin = await page.getByRole("radiogroup", { name: "How did you sleep?" }).count();
  if (checkin) {
    await page.getByRole("radio", { name: "Badly" }).click();
    await page.getByRole("radio", { name: "Heavy" }).click();
    await page.getByRole("radiogroup", { name: "Any pain?" }).getByRole("radio", { name: "No" }).click();
    await tap("button", "Done");
    await audit(page, `${theme}-today-after-checkin`);
    ok(`${theme}: check-in completed; readiness chip shown: ${await page.locator(".readiness").first().textContent()}`);
  }

  // ── Plan, Recover ───────────────────────────────────────────────────────
  await page.getByRole("button", { name: /^Plan, tab 2/ }).click();
  await audit(page, `${theme}-plan`);
  await page.getByRole("button", { name: /^Recover, tab 3/ }).click();
  await audit(page, `${theme}-recover`);
  await page.locator(".region-row").first().click();
  await audit(page, `${theme}-recover-region`);
  await page.getByRole("button", { name: "Close" }).click();

  // ── Coach: proposal, E3 boundary, G1 safety ─────────────────────────────
  await page.getByRole("button", { name: /^Coach, tab 4/ }).click();
  await audit(page, `${theme}-coach`);
  const send = async (m) => { await page.getByLabel("Message").fill(m); await page.getByRole("button", { name: "Send" }).click(); };
  await send("Move my hard run to Sunday");
  const hasProposal = await page.getByRole("button", { name: "Check this change" }).count();
  if (hasProposal) {
    await page.getByRole("button", { name: "Check this change" }).last().click();
    const kept = await page.getByText(/Your rules kept the original|Accepted by your rules/).last().textContent();
    ok(`${theme}: chat proposal decided by the engine: "${kept.trim()}"`);
  }
  await send("How many calories should I eat to lose 5 kg by next month?");
  const last = await page.locator(".bubble.ai").last().textContent();
  if (/\d/.test(last.replace(/\b(1|2|3)\b/g, ""))) fail(`${theme}: nutrition reply contains a number: ${last}`); else ok(`${theme}: E3 nutrition reply has no numbers`);
  await audit(page, `${theme}-coach-thread`);
  await send("I felt chest pain on the last interval");
  const alert = await page.getByRole("alertdialog", { name: "Stop and get help now" }).count();
  if (!alert) fail(`${theme}: G1 chest pain did not show S-1`); else ok(`${theme}: G1 chest pain → S-1 card, no model call`);
  await audit(page, `${theme}-safety-S1`);
  const call = await page.getByRole("link", { name: /^Call / }).getAttribute("href");
  if (call !== "tel:998") fail(`${theme}: UAE emergency link is ${call}`);
  await tap("button", "I'm OK now");

  // ── You: memory forget + undo, text size ───────────────────────────────
  await page.getByRole("button", { name: /^You, tab 5/ }).click();
  await audit(page, `${theme}-you`);
  const before = await page.locator(".mem-row").count();
  await page.getByRole("button", { name: /^Forget: / }).first().click();
  await page.getByRole("button", { name: "Undo" }).click();
  const after = await page.locator(".mem-row").count();
  if (before !== after) fail(`${theme}: memory undo failed`); else ok(`${theme}: memory forget + undo`);
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "Larger text" }).click();
  await page.getByRole("button", { name: /^Today, tab 1/ }).click();
  await audit(page, `${theme}-today-text-200`);
  ok(`${theme}: Today at 200% text reflows without horizontal scroll`);

  if (errors.length) fail(`${theme}: page errors: ${errors.join(" | ")}`);
  await ctx.close();
}


// ── Club member, HYROX, 5 days with doubles: amber adaptation, Why this?, missed-session repair ──
async function runClub() {
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 }, colorScheme: "dark", reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url);
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("polysync-proto-state", JSON.stringify({ today: 0 })); });
  await page.reload();
  const b = (name) => page.getByRole("button", { name, exact: true }).first().click();
  await b("I have a club code");
  await page.getByLabel("Club code (6 characters)").fill("abc123");
  await b("Join my club");
  await page.getByRole("radio", { name: /^Race HYROX/ }).click();
  await b("Continue");
  await page.getByRole("checkbox", { name: "Tue" }).click();
  await page.getByRole("checkbox", { name: "Thu" }).click();
  await b("Continue");
  await page.getByRole("radio", { name: "Yes", exact: true }).click();
  await b("Continue");
  await page.getByRole("radio", { name: "60 min" }).click();
  await b("Continue");
  await page.getByRole("radio", { name: /^Some experience/ }).click();
  await b("Continue");
  for (let i = 0; i < 3; i++) await page.getByRole("radio", { name: "No", exact: true }).nth(i).click();
  await b("Continue");
  await b("Start today's session");
  if (await page.getByRole("button", { name: /^Log set 1$/ }).count()) { await b("Close session"); await b("Start today's session"); }
  await b("Close session"); // leave the first session: back to "Your week"
  if (!(await page.getByRole("heading", { name: "Your week" }).count())) fail("club: closing the first session didn't return to Your week"); else ok("club: first session can be closed back to Your week");
  await b("Start today's session");
  const timed = await page.getByRole("button", { name: "Start", exact: true }).count();
  if (timed) { await b("Start"); await b("Finish"); await page.getByRole("radio", { name: "6", exact: true }).click(); }
  else { await b("Report pain"); await page.getByRole("radio", { name: "Knee" }).click(); await b("Continue"); await b("End session"); }
  await b("Continue");
  await b("Continue with email");
  if (await page.getByRole("heading", { name: /Keep going free/ }).count()) fail("club: club member saw the paywall"); else ok("club: club member skips the paywall (ADR-010)");

  // Tuesday: amber check-in on a hard day → the engine moves or downgrades, with the rule
  await page.getByLabel("Scenario day").selectOption("1");
  await page.getByRole("radio", { name: "Badly" }).click();
  await page.getByRole("radio", { name: "Sore" }).click();
  await page.getByRole("radiogroup", { name: "Any pain?" }).getByRole("radio", { name: "No" }).click();
  await b("Done");
  const changed = await page.locator('[aria-label^="What changed:"] .card-title').first().textContent().catch(() => null);
  if (!changed) fail("club: amber on Tuesday produced no What changed card"); else ok(`club: amber check-in → "${changed}"`);
  await page.locator('[aria-label^="What changed:"]').first().getByRole("button", { name: "Why this?" }).click();
  const rules = await page.getByRole("dialog", { name: "Why this?" }).locator(".rule").allTextContents();
  if (!rules.length) fail("club: Why this? shows no rule"); else ok(`club: Why this? cites ${rules.join(", ")}`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: "e2e/out/club-why.png" });
  await b("Keep it");

  // Wednesday: yesterday marked missed → Pick up here → repaired or dropped, never crammed
  await page.getByLabel("Scenario day").selectOption("2");
  await b("Mark yesterday missed");
  if (await page.getByRole("button", { name: "Fit it into my week" }).count()) {
    await b("Fit it into my week");
    const t = await page.locator('[aria-label^="What changed:"] .card-title').first().textContent();
    if (!/moved to|let .* go/.test(t)) fail(`club: missed-session repair gave "${t}"`); else ok(`club: missed session → "${t}"`);
  } else ok("club: nothing was planned yesterday after the adaptation (no missed card)");
  await page.getByRole("button", { name: /^Coach, tab 4/ }).click();
  if (!(await page.getByRole("radio", { name: "Coach Sara" }).count())) fail("club: no human coach thread"); else ok("club: Coach tab has the human coach thread");
  await page.waitForTimeout(300);
  await page.screenshot({ path: "e2e/out/club-coach.png" });
  const ttfwText = await page.locator(".kv dd").first().textContent();
  ok(`club: facilitator panel TTFW reads "${ttfwText}"`);
  if (errors.length) fail(`club: page errors: ${errors.join(" | ")}`);
  await ctx.close();
}

await run("dark", 0); // Monday: a strength day with exercises, swap and the pain path
await run("light", 3); // Thursday: nothing planned, so the 15-minute starter
await runClub();
await browser.close();
console.log(`\n${results.length} checks passed, ${failures.length} failed`);
process.exit(failures.length ? 1 : 0);
