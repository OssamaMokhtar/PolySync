/// <reference types="vite/client" />
declare module "*.md?raw" {
  const text: string;
  export default text;
}
declare module "../../product/scripts/model-core.mjs" {
  export const WEEKS_PER_MONTH: number;
  export const HOURS_PER_MONTH: number;
  export interface SegmentOutcomes { keptRate: number; downgradeRate: number; escalationRate: number }
  export function computeUnit(v: Record<string, number>, wageUsd: number, seg: SegmentOutcomes): Record<string, number>;
  export function segmentOutcomes(table: Record<string, { n: number; moved: number; downgraded: number; escalated: number }>, keys: string[]): SegmentOutcomes;
  export function marketWage(market: string, w: { fxAedPerUsd: number; uaeMonthlyAed: number; usHourly: number }): number;
}
