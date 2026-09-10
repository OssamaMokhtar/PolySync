# Security

> Status: Active build — documentation-complete, code-level security posture TBD (codebase not in this repo).

## Architecture Safety Model (from docs)

The PolySync safety architecture is documented in [docs/04-ai-architecture.md](docs/04-ai-architecture.md) and is the load-bearing security design:

1. **Deterministic programming engine** owns every load prescription. The LLM cannot change training load.
2. **LLM orchestrator** proposes adaptations as structured deltas only.
3. **Bounds checker** validates every proposed delta against safe bounds before it reaches an athlete.
4. **Escalation pipeline** sends out-of-bounds proposals to a named human coach as a draft.

**Consequences:**
- Prompt injection cannot change training load (the LLM has no write path to the programming engine).
- A model provider outage degrades the explanation, not the training.
- Eval gates are meaningful because prescription is reproducible.

## API Key Protection

- The Gemini API key is held server-side only.
- A build-time check asserts the key cannot appear in the client bundle.
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

*See [Improvement Plan — PolySync](../../Obsidian/Portfolio-Due-Diligence/01-Improvement-Plan-PolySync.md) for the full security hardening roadmap.*
