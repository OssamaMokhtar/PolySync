// Boots the production bundle and checks three things a reviewer would try
// first. The server previously crashed on boot ("app is not defined") and no
// gate noticed, because nothing ever started it.
import { spawn } from "node:child_process";

const srv = spawn("node", ["dist/server.cjs"], { env: { ...process.env, NODE_ENV: "production", ALLOW_DEV_USER_HEADER: "1", PORT: "3999" }, stdio: ["ignore", "pipe", "pipe"] });
let log = "";
srv.stdout.on("data", (d) => (log += d));
srv.stderr.on("data", (d) => (log += d));
const fail = (m) => { console.error(`boot-check FAIL: ${m}\n${log}`); srv.kill(); process.exit(1); };

const deadline = Date.now() + 20000;
while (!log.includes("standing by")) {
  if (srv.exitCode !== null) fail(`server exited with ${srv.exitCode}`);
  if (Date.now() > deadline) fail("server did not start within 20 s");
  await new Promise((r) => setTimeout(r, 200));
}
const base = "http://127.0.0.1:3999";
const spa = await fetch(base + "/");
if (spa.status !== 200) fail(`SPA returned ${spa.status}`);
const body = JSON.stringify({ profile: { level: "intermediate", priority: "endurance", availableDays: [0, 2, 4], strengthSessions: 2, powerSessions: 0, hardEnduranceSessions: 2, easyEnduranceSessions: 1, allowDoubles: true, sessionMinutes: 60 } });
const anon = await fetch(base + "/api/hybrid/week", { method: "POST", headers: { "content-type": "application/json" }, body });
if (anon.status !== 401) fail(`unauthenticated request returned ${anon.status}, expected 401`);
const spoof = await fetch(base + "/api/fitness/plan", { headers: { "x-user-id": "victim" } });
if (spoof.status !== 401) fail(`x-user-id impersonation returned ${spoof.status} in production, expected 401`);
srv.kill();
console.log("boot-check OK: production bundle boots; SPA 200; anonymous 401; x-user-id impersonation 401");
