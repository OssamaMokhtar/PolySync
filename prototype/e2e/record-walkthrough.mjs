// Records the prototype walkthrough used in the case study (docs/media/prototype-walkthrough.*).
// Club member, HYROX, 5 days: onboarding → first set → pain report → Today check-in → What
// changed + Why this? → a chat proposal the rules reject → a safety card. Every outcome is the
// production engine's; nothing is staged. Run after `npm run build`.
import { chromium } from "playwright";
import { mkdirSync, readdirSync, renameSync } from "node:fs";

const OUT = "e2e/out/video";
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "dark", recordVideo: { dir: OUT, size: { width: 390, height: 844 } } });
const page = await ctx.newPage();
const url = "file://" + process.cwd() + "/dist/index.html";
const pause = (ms = 900) => page.waitForTimeout(ms);
const b = async (name, ms) => { await page.getByRole("button", { name, exact: true }).first().click(); await pause(ms); };
const r = async (name, ms) => { await page.getByRole("radio", { name }).first().click(); await pause(ms ?? 450); };

await page.goto(url);
await page.evaluate(() => { localStorage.clear(); localStorage.setItem("polysync-proto-state", JSON.stringify({ today: 0 })); });
await page.reload();
await pause(1600);
await b("I have a club code");
await page.getByLabel("Club code (6 characters)").pressSequentially("HRB001", { delay: 90 });
await pause(700);
await b("Join my club");
await r(/^Race HYROX/);
await b("Continue");
await page.getByRole("checkbox", { name: "Tue" }).click(); await pause(300);
await page.getByRole("checkbox", { name: "Thu" }).click(); await pause(500);
await b("Continue");
await r("Yes"); await b("Continue");
await r("60 min"); await b("Continue");
await r(/^Some experience/); await b("Continue");
for (let i = 0; i < 3; i++) { await page.getByRole("radio", { name: "No", exact: true }).nth(i).click(); await pause(350); }
await b("Continue", 2200); // Your week, built by the engine on the device
await b("Start today's session", 1400);
if (await page.getByRole("button", { name: /^Log set 1$/ }).count()) {
  await b("Log set 1", 2600); // rest ring
  await b("Report pain", 900);
  await r("Knee", 500);
  await page.getByRole("button", { name: "More", exact: true }).click(); await pause(300);
  await b("Continue", 1600);
  await b("End session", 1400);
} else {
  await b("Start", 2500);
  await b("Finish", 700);
  await page.getByRole("radio", { name: "7", exact: true }).click(); await pause(1400);
}
await b("Continue", 900);
await b("Continue with email", 1600);

// Next day: a low check-in on a hard day
await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("polysync-proto-state")); s.today = 1; s.checkin = null; localStorage.setItem("polysync-proto-state", JSON.stringify(s)); });
await page.reload();
await pause(1400);
await r("Badly"); await r("Sore");
await page.getByRole("radiogroup", { name: "Any pain?" }).getByRole("radio", { name: "No" }).click(); await pause(500);
await b("Done", 2400);
await page.locator('[aria-label^="What changed:"]').first().getByRole("button", { name: "Why this?" }).click();
await pause(3600);
await b("Keep it", 900);

// Coach: the model suggests, the rules decide; then a red flag
await page.getByRole("button", { name: /^Coach, tab 4/ }).click(); await pause(1000);
const say = async (text) => { await page.getByLabel("Message").pressSequentially(text, { delay: 35 }); await pause(300); await page.getByRole("button", { name: "Send" }).click(); await pause(1500); };
await say("Move my hard run to Sunday");
await page.getByRole("button", { name: "Check this change" }).last().click(); await pause(2200);
await say("I felt chest pain on the last interval");
await pause(2600);

await ctx.close();
await browser.close();
const f = readdirSync(OUT).filter((x) => x.endsWith(".webm")).sort().pop();
renameSync(`${OUT}/${f}`, `${OUT}/walkthrough.webm`);
console.log("✔ e2e/out/video/walkthrough.webm");
