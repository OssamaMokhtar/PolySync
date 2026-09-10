# Privacy Policy

**Status:** Draft — for active build phase. Not a substitute for legal advice.

## Data We Collect

| Data | Purpose | Retention |
|------|---------|-----------|
| Athlete profiles (name, contact, training history) | Coaching and programming | Per coach-athlete relationship; deletable on request |
| Training data (loads, adaptations, metrics) | Programming engine + coaching | Per athlete; historical data retained for trend analysis |
| Coach communications (drafts, feedback) | Human-in-the-loop coaching | Per coaching relationship |
| LLM prompts and responses (if persisted) | Debugging, eval, improvement | Minimized; not persisted by default |
| Usage analytics | Product improvement, heatmap generation | Aggregated, de-identified where possible |

## Data Storage

- Athlete data is stored in the coaching platform's database (prototype: TBD — not in this repo).
- LLM prompts/responses are not persisted by default (to be confirmed in implementation).
- No data is shared with third parties except as required for LLM inference (Gemini API, server-side only).

## Your Rights

Under UAE PDPL and applicable data protection laws, athletes and coaches have the right to:

- Access their data
- Correct inaccurate data
- Request deletion of their data (subject to coaching record retention requirements)
- Withdraw consent (where processing is consent-based)

## Coach Data

Coaches have separate data rights and responsibilities. Coach data includes their athlete assignments, draft adaptations, and feedback. Coaches are responsible for the data of their athletes.

## Contact

For privacy inquiries, contact the maintainer.

---

*See [Improvement Plan — PolySync](../../Obsidian/Portfolio-Due-Diligence/01-Improvement-Plan-PolySync.md) for the full compliance roadmap.*
