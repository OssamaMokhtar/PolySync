// The unit-economics formula, shared by product/scripts/build.mjs (docs and
// CI) and the ProjectOS portal (live sliders), so the two cannot disagree.
//
// v: driver values by id (see product/data/model.json)
// wageUsd: base hourly wage for the market, before on-cost and premium
// escRate: simulated amber-day escalation rate for the schedule segment

export const WEEKS_PER_MONTH = 4.33;

export function computeUnit(v, wageUsd, escRate) {
  const coachHourly = wageUsd * v.coachLoading * v.specialistPremium;
  const escalations = v.amberDaysPerAthleteMonth * v.hardShareOnAmber * escRate + v.painFlagsPerAthleteMonth + v.llmProposalsPerAthleteMonth * v.proposalRejectRate;
  const withMin = v.triageMinutesPerAthleteWeek * WEEKS_PER_MONTH + escalations * v.minutesPerEscalation;
  const manualMin = v.manualMinutesPerAthleteWeek * WEEKS_PER_MONTH;
  const savedMin = manualMin - withMin;
  const clubValue = (savedMin / 60) * coachHourly;
  const capacityMin = v.coachProgrammingHoursPerWeek * 60 * WEEKS_PER_MONTH;
  const inference = (v.llmCallsPerAthleteMonth * (v.llmTokensInPerProposal * v.priceInPer1M + v.llmTokensOutPerProposal * v.priceOutPer1M)) / 1e6;
  const price = v.pricePerAthleteMonthUsd;
  const softwareCogs = inference + v.infraPerAthleteMonthUsd + price * v.paymentFeeRate;
  const coachCost = (withMin / 60) * coachHourly;
  return {
    escalationRate: escRate,
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

/** n-weighted escalation rate for a segment's schedule keys. */
export function segmentEscalation(table, keys) {
  let n = 0;
  let e = 0;
  for (const k of keys) {
    n += table[k].n;
    e += table[k].escalated;
  }
  return e / n;
}

/** Base hourly wage in USD per market. */
export function marketWage(market, fxAedPerUsd, usHourly) {
  return market === "UAE" ? 4556 / 173.33 / fxAedPerUsd : usHourly;
}
