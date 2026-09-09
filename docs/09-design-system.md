# PolySync — Design System

> Status: PROPOSED · Owner: Ossama Mokhtar

## 1. Tokens
TBD — extract from the implementation rather than inventing here.

## 2. Surfaces

| Surface | Density | Primary job |
|---|---|---|
| Athlete app | Low — one decision per screen | Do today's session |
| Coach console | High — table-first, scannable | Triage 60 athletes in 20 minutes |
| Org admin | Medium | Prove value at renewal |

Two design languages under one system. The coach console is a professional tool and should look like one; applying consumer-app spacing to a 60-row triage queue is the most common way B2B2C products lose the middle layer.

## 3. AI-specific patterns

| Pattern | Rule |
|---|---|
| Rationale ("why today changed") | ≤ 60 words, always with a protocol citation the athlete can open |
| Confidence | Never a percentage to athletes. Three states: confident / checking with your coach / paused |
| Escalation | Named coach, visible SLA. "Your coach Sara will review this by Tuesday" beats a spinner |
| Abstention | Say what you can't do and who can. Never a generic apology |
| Coach approval | Diff view: engine default vs proposed delta, one-tap approve, amend inline |
| Trade-off | Explicit choice screen when goals conflict — the athlete picks the priority |
| Streaming | Only in conversation. Never for a prescription; a load number must never appear to "type itself" |

## 4. Accessibility
WCAG 2.1 AA. Specific risks: gym lighting and sweat → contrast and touch-target minimums above spec; one-handed reachability mid-session; screen-reader behaviour for streamed conversation (announce completion, not each token).
