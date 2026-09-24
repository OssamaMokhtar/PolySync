import { describe, expect, it } from "vitest";
import { logEvent, rateLimit } from "./ops";

function call(mw: ReturnType<typeof rateLimit>, headers: Record<string, string> = {}, ip = "1.2.3.4") {
  const out = { status: 200, headers: {} as Record<string, string>, next: false };
  const res = {
    setHeader: (k: string, v: string) => (out.headers[k] = v),
    status: (s: number) => ({ json: () => (out.status = s) }),
  };
  mw({ headers, ip, path: "/api/x" } as never, res as never, () => (out.next = true));
  return out;
}

describe("rate limit", () => {
  it("allows up to max per window, then 429 with Retry-After, then resets", () => {
    let t = 0;
    const mw = rateLimit({ windowMs: 60_000, max: 3, now: () => t });
    for (let i = 0; i < 3; i++) expect(call(mw).next).toBe(true);
    const blocked = call(mw);
    expect(blocked.status).toBe(429);
    expect(blocked.headers["Retry-After"]).toBe("60");
    t = 60_000;
    expect(call(mw).next).toBe(true);
  });

  it("keys by user token, so one user cannot exhaust another's budget", () => {
    const mw = rateLimit({ windowMs: 60_000, max: 1, now: () => 0 });
    expect(call(mw, { authorization: "Bearer aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }).next).toBe(true);
    expect(call(mw, { authorization: "Bearer bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" }).next).toBe(true);
    expect(call(mw, { authorization: "Bearer aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }).status).toBe(429);
  });
});

describe("event log", () => {
  it("writes one JSON line with a timestamp and the event name", () => {
    const lines: string[] = [];
    logEvent("coach_escalation", { uid: "u1" }, (l) => lines.push(l));
    const e = JSON.parse(lines[0]);
    expect(e.event).toBe("coach_escalation");
    expect(e.uid).toBe("u1");
    expect(typeof e.ts).toBe("string");
  });
});
