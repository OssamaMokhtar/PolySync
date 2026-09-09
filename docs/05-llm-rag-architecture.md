# PolySync — LLM / RAG Architecture

> Status: PROPOSED · Owner: Ossama Mokhtar

**Purpose.** What the model is allowed to know, and what it must refuse to answer.

## 1. Corpus

| Source | Contents | Freshness | Licence |
|---|---|---|---|
| Coach-approved protocol library | Programming protocols, progression rules, deload criteria, exercise substitutions — each with an ID and an owning coach | Versioned, reviewed | Owned |
| Sports-science reference set | Concurrent-training, periodisation, load-management literature summaries | Annual review | TBD — check redistribution rights |
| Athlete's own history | Sessions, RPE, injuries, readiness | Live | Consented |
| Org policy layer | Per-org constraints (equipment, facility hours, sport rules) | Per contract | Owned |

**The protocol library is the moat, not the model.** Any competitor can call the same API. A coach-reviewed, versioned, citable protocol library with attribution back to named coaches is what an org buyer is actually purchasing, and it is what makes the human-in-loop promise structural rather than cosmetic.

## 2. Ingestion and chunking

Protocol-level chunking, not fixed-token — a protocol is the atomic unit a coach reviews and a citation points to. Metadata: `protocol_id`, `owning_coach`, `sport_modality`, `training_age_band`, `contraindications[]`, `version`. Rejected: 512-token sliding window, which splits a progression rule from its deload condition and produces exactly the dangerous half.

## 3. Retrieval

| Stage | Method | k | Notes |
|---|---|---|---|
| Pre-filter | Hard filter on `contraindications` vs athlete injury history | — | Non-negotiable, runs before similarity |
| Recall | Hybrid BM25 + dense | PROPOSED 20 | Modality and training-age filtered |
| Rerank | Cross-encoder | PROPOSED 5 | |

The contraindication pre-filter is a hard SQL filter, not a soft signal in the prompt. A retrieved-but-contraindicated protocol must never enter context.

## 4. Grounding and abstention

- Every recommendation cites ≥ 1 `protocol_id`, surfaced in the UI as "why".
- Empty retrieval → abstain and route to coach. Never generate a protocol.
- Out-of-scope requests (medical diagnosis, nutrition prescription, pharmacology, weight targets) → refuse and route to the appropriate human. The scope boundary is written into the system prompt *and* enforced by the classifier, because prompt-only scope holds until the first jailbreak.

## 5. Retrieval quality

| Metric | Gate (PROPOSED) | Current |
|---|---|---|
| Recall@5 on golden protocol set | ≥ 0.90 | TBD |
| Contraindication leak rate | **0** | TBD |
| Groundedness (cited protocol supports the claim) | ≥ 0.95 | TBD |
