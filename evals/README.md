# Eval Suite — PolySync

**Status:** Structure defined — eval cases to be written after codebase is available.

## Purpose

The eval suite measures whether PolySync's coaching recommendations are useful, safe, and acceptable to coaches and athletes. The core question: "Does the LLM-proposed adaptation improve the athlete's training, or does it need to be rejected by the bounds checker or the coach?"

## Eval Categories

### 1. Bounds Checker Eval

- **Purpose:** Verify that the bounds checker correctly accepts safe proposals and rejects unsafe proposals.
- **Metric:** Accuracy (percentage of proposals correctly classified as safe/unsafe)
- **Failure condition:** Bounds checker accepts a proposal that would cause injury (critical failure)

### 2. Coaching Recommendation Quality Eval

- **Purpose:** Measure whether LLM-proposed adaptations are high-quality coaching suggestions.
- **Metric:** Coach acceptance rate (percentage of proposals the coach accepts without modification)
- **Secondary metrics:** Proposal relevance, proposal specificity, proposal safety (does it respect the athlete's context?)

### 3. Athlete Context Eval

- **Purpose:** Verify that proposals respect the athlete's context (current training load, injury history, available equipment, goals).
- **Metric:** Context adherence rate (percentage of proposals that respect all relevant context)
- **Failure condition:** Proposal ignores a critical context element (e.g., proposes high-intensity work for an injured athlete)

### 4. Explanation Quality Eval

- **Purpose:** Measure whether the LLM's explanations of the programming engine's decisions are clear, accurate, and useful.
- **Metric:** Explanation clarity (coach rating), explanation accuracy (does the explanation match the actual decision?)

### 5. Escalation Eval

- **Purpose:** Verify that out-of-bounds proposals are correctly escalated to the coach.
- **Metric:** Escalation accuracy (percentage of out-of-bounds proposals correctly escalated)
- **Failure condition:** Out-of-bounds proposal reaches the athlete without coach review (critical failure)

## Eval Execution

```bash
npm run test:eval        # Run eval suite
npm run test:eval -- --watch  # Run in watch mode
npm run test:eval -- --coverage  # Run with coverage
```

## CI Integration

Evals run in CI on every push and pull request. A failed eval blocks the merge.

## Relationship to Improvement Plan

This eval suite is Phase 2 of the PolySync improvement plan. See [[01-Improvement-Plan-PolySync]].
