# PolySync — Data Ownership Decision (Offboarding)

> Status: AUTHORED · Owner: Ossama Mokhtar

## The decision

**Org owns roster and program data. Athlete owns their personal physiological data and can export it.**

When an athlete leaves an org (offboarding):
- The org retains: roster membership, assigned programs, program history, coach notes about the athlete, aggregate outcomes for the org.
- The athlete retains and can export: their personal physiological data (HRV, readiness, training loadhistory), their subjective logs, their personal program adaptations.
- The athlete does NOT retain: other athletes' data, the org's private protocol library, coach annotations about other athletes.

**Why this decision:**
- It is the simplest model that satisfies both the org's retention interest (they keep what they paid for) and the athlete's privacy interest (their body data is theirs).
- It maps to US state privacy law without requiring GDPR-grade consent machinery at beachhead (ADR-005).
- It blocks the first enterprise contract less than any other model because orgs expect to retain their roster data.

**What this does not decide yet:**
- Export format (CSV, JSON, portability to another coach/org) — TBD, design doc 02 has the entity model; export is an implementation detail.
- Whether an athlete can take their program history to a competitor org — TBD, this is a commercial decision, not a data decision. The data ownership decision above does not answer it.

**Reversal trigger:** If a beachhead org demands athlete data portability to a competitor as a condition of contract, revisit. If US state privacy law changes materially, revisit.

---

**Status:** This closes gap #5 from GAPS.md (data ownership on offboarding — decision made, 2026-09-23). The implementation detail (export format) remains TBD in doc 02.
