// Operational helpers: structured event logs and a per-client rate limit.
// Kept dependency-free so they are easy to test and to replace with a managed
// service (Cloud Logging, a gateway limiter) when the API is deployed.
import type { NextFunction, Request, Response } from "express";

/** One JSON line per event, the format docs/08 and product/telemetry-plan.md describe. */
export function logEvent(event: string, props: Record<string, unknown> = {}, sink: (line: string) => void = console.log): void {
  sink(JSON.stringify({ ts: new Date().toISOString(), event, ...props }));
}

/**
 * Fixed-window limiter keyed by the caller's bearer token (per user) or IP.
 * In-memory: correct for one instance; a multi-instance deploy needs a shared
 * store (docs/08).
 */
export function rateLimit(opts: { windowMs: number; max: number; now?: () => number }) {
  const now = opts.now ?? Date.now;
  const hits = new Map<string, { start: number; n: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = req.headers.authorization;
    const key = typeof auth === "string" && auth.length > 20 ? `t:${auth.slice(-24)}` : `ip:${req.ip ?? "unknown"}`;
    const t = now();
    let h = hits.get(key);
    if (!h || t - h.start >= opts.windowMs) {
      h = { start: t, n: 0 };
      hits.set(key, h);
      if (hits.size > 10_000) for (const [k, v] of hits) if (t - v.start >= opts.windowMs) hits.delete(k);
    }
    h.n++;
    res.setHeader("RateLimit-Limit", String(opts.max));
    res.setHeader("RateLimit-Remaining", String(Math.max(0, opts.max - h.n)));
    if (h.n > opts.max) {
      res.setHeader("Retry-After", String(Math.ceil((h.start + opts.windowMs - t) / 1000)));
      logEvent("rate_limited", { key: key.startsWith("ip:") ? "ip" : "user", path: req.path });
      res.status(429).json({ error: "Too many requests" });
      return;
    }
    next();
  };
}
