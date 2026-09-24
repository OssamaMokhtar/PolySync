// The unit-economics formula, shared by product/scripts/build.mjs (docs and
// CI) and the ProjectOS portal (live sliders), so the two cannot disagree.
//
// v:       driver values by id (see product/data/model.json)
// wageUsd: base hourly wage for the market, before on-cost and premium
// seg:     simulated amber-day outcomes for the schedule segment, from
//          evals/results/hybrid-latest.json (segmentOutcomes below):
//          keptRate (hard session moved, no coach time), downgradeRate (made
//          easy in place; the coach reviews a lost session), escalationRate
//          (a coach decides)

export const WEEKS_PER_MONTH = 4.33;

export function computeUnit(v, wageUsd, seg) {
  const coachHourly = wageUsd * v.coachLoading * v.specialistPremium;
  const hardAmber = v.amberDaysPerAthleteMonth * v.hardShareOnAmber;
  const lostSessions = hardAmber * seg.downgradeRate;
  const escalations = hardAmber * seg.escalationRate + v.painFlagsPerAthleteMonth + v.llmProposalsPerAthleteMonth * v.proposalRejectRate;
  const withMin = v.triageMinutesPerAthleteWeek * WEEKS_PER_MONTH + lostSessions * v.minutesPerLostSession + escalations * v.minutesPerEscalation;
  const manualMin = v.manualMinutesPerAthleteWeek * WEEKS_PER_MONTH;
  const savedMin = manualMin - withMin;
  const clubValue = (savedMin / 60) * coachHourly;
  const capacityMin = v.coachProgrammingHoursPerWeek * 60 * WEEKS_PER_MONTH;
  const inference = (v.llmCallsPerAthleteMonth * (v.llmTokensInPerProposal * v.priceInPer1M + v.llmTokensOutPerProposal * v.priceOutPer1M)) / 1e6;
  const price = v.pricePerAthleteMonthUsd;
  const softwareCogs = inference + v.infraPerAthleteMonthUsd + price * v.paymentFeeRate;
  const coachCost = (withMin / 60) * coachHourly;
  return {
    keptRate: seg.keptRate,
    downgradeRate: seg.downgradeRate,
    escalationRate: seg.escalationRate,
    lostSessionsPerAthleteMonth: lostSessions,
    escalationsPerAthleteMonth: escalations,
    coachMinutesWith: withMin,
    coachMinutesManual: manualMin,
    coachMinutesSaved: savedMin,
    coachHourlyUsd: coachHourly,
    clubValueUsd: clubValue,
    clubRoi: clubValue / price,
    athletesPerCoachManual: capacityMin / manualMin,
    athletesPerCoachWith: capacityMin / withMin,
    inferenceUsd: inference,
    softwareGrossMargin: 1 - softwareCogs / price,
    managedCoachCostUsd: coachCost,
    managedBreakEvenPriceUsd: (coachCost + inference + v.infraPerAthleteMonthUsd) / (1 - v.targetGrossMargin - v.paymentFeeRate),
  };
}

/** n-weighted amber-day outcome rates for a segment's schedule keys. */
export function segmentOutcomes(table, keys) {
  let n = 0;
  let moved = 0;
  let downgraded = 0;
  let escalated = 0;
  for (const k of keys) {
    n += table[k].n;
    moved += table[k].moved;
    downgraded += table[k].downgraded;
    escalated += table[k].escalated;
  }
  return { keptRate: moved / n, downgradeRate: downgraded / n, escalationRate: escalated / n };
}

/**
 * Base hourly wage in USD per market. UAE: monthly salary in AED (CST-002)
 * over 173.33 working hours, converted at the peg (CST-004). US: hourly (CST-001).
 */
export const HOURS_PER_MONTH = 173.33;
export function marketWage(market, { fxAedPerUsd, uaeMonthlyAed, usHourly }) {
  return market === "UAE" ? uaeMonthlyAed / HOURS_PER_MONTH / fxAedPerUsd : usHourly;
}
