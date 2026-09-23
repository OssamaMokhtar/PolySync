/// <reference types="vite/client" />
declare module "*.md?raw" {
  const text: string;
  export default text;
}
declare module "../../product/scripts/model-core.mjs" {
  export const WEEKS_PER_MONTH: number;
  export function computeUnit(v: Record<string, number>, wageUsd: number, escRate: number): Record<string, number>;
  export function segmentEscalation(table: Record<string, { n: number; escalated: number }>, keys: string[]): number;
  export function marketWage(market: string, fxAedPerUsd: number, usHourly: number): number;
}
