# Security

> Status: AUTHORED · Updated 2026-09-23 — the runtime now lives in [`app/`](app/); controls below marked (enforced) are checked in CI.

## Architecture Safety Model (from docs)

The PolySync safety architecture is documented in [docs/04-ai-architecture.md](docs/04-ai-architecture.md) and is the load-bearing security design:

1. **Deterministic programming engine** owns every load prescription. The LLM cannot change training load.
2. **LLM orchestrator** proposes adaptations as structured deltas only.
3. **Bounds checker** validates every proposed delta against safe bounds before it reaches an athlete. (enforced) [`engine/boundsChecker.ts`](engine/boundsChecker.ts), evaluated on every push by [`evals/run.ts`](evals/run.ts).
4. **Escalation pipeline** sends out-of-bounds proposals to a named human coach as a draft.

**Consequences:**
- The LLM has no write path to the programming engine. Its output, including any injected instructions, reaches an athlete only as a plan that passes every rule (B1–B9, H1–H9); anything else is blocked and the engine's plan stands. The rules bound a proposal; they do not judge its quality.
- A model provider outage degrades the explanation, not the training.
- Eval gates are meaningful because prescription is reproducible.

## API Key Protection

- The Gemini API key is held server-side only.
- (enforced) `app/scripts/check-bundle.mjs` fails CI if the client bundle references the Gemini API or contains the key. The Firebase web `apiKey` in `app/firebase-applet-config.json` is a public identifier by design; Firestore access is governed by [`app/firestore.rules`](app/firestore.rules).
- The key is never exposed to the browser.

## Data Classification

| Data Type | Classification | Notes |
|-----------|---------------|-------|
| Athlete profiles, training data | Sensitive (health-adjacent) | Training load, biometrics, adaptations |
| Coach communications | Internal | Draft adaptations, feedback |
| LLM prompts and responses | Internal | Not persisted by default (TBD) |
| Usage analytics / heatmaps | Internal | Aggregated, de-identified where possible |

## Known Security Gaps

| Gap | Severity | Roadmap |
|-----|----------|---------|
| Full codebase not in this repo — security posture of the implementation unverified | High | Code review of implementation repo |
| No encryption at rest documented for athlete data | High | Pre-production |
| No RBAC beyond basic ownership (if implemented) | High | Pre-production |
| No SSO (SAML/OIDC) | High | Pre-production (mentioned in README) |
| No penetration test | High | Pre-production |
| No dependency vulnerability scanning | Medium | CI (this PR) |

## Reporting a Vulnerability

Contact the maintainer directly. Do not open a public issue for security vulnerabilities.

---

*See [security and deployment](docs/08-security-and-deployment.md) for the full security hardening roadmap.*
