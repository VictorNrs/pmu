import type { PerformanceMetrics } from '@pmu/shared';
import type { IndicatorDefinition } from '@/utils/metric-format';

/**
 * Visual comparison of values already computed by the backend: no statistic is
 * computed here. Cells below the minimum number of races are never highlighted,
 * to avoid presenting a single lucky race as the best performance.
 */
export function isSignificant(metrics: PerformanceMetrics, minRaces: number): boolean {
  return metrics.raceCount > 0 && metrics.raceCount >= minRaces;
}

/** Best value of one indicator within a column, among significant cells only. */
export function findBestValue(
  cells: readonly PerformanceMetrics[],
  indicator: IndicatorDefinition,
  minRaces: number,
): number | null {
  const values = cells
    .filter((cell) => isSignificant(cell, minRaces))
    .map((cell) => cell[indicator.key])
    .filter((value): value is number => value !== null);
  if (values.length === 0) return null;
  return indicator.better === 'higher' ? Math.max(...values) : Math.min(...values);
}

/** Heat intensity between 0 and 1, relative to the best value of the column. */
export function heatIntensity(
  value: number | null,
  best: number | null,
  indicator: IndicatorDefinition,
): number {
  if (value === null || best === null) return 0;
  if (indicator.better === 'higher') return best === 0 ? 0 : clamp(value / best);
  return value === 0 ? 0 : clamp(best / value);
}

/** Null values always sort last, whatever the direction chosen by the user. */
export function compareIndicator(
  left: number | null,
  right: number | null,
  order: 'ascend' | 'descend',
): number {
  if (left === null && right === null) return 0;
  if (left === null) return order === 'ascend' ? 1 : -1;
  if (right === null) return order === 'ascend' ? -1 : 1;
  return left - right;
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}
