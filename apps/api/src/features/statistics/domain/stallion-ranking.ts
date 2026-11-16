import type { PerformanceMetrics, RankingMetric, StallionRankingEntry } from '@pmu/shared';

export interface StallionMetrics {
  stallionId: number;
  stallionName: string;
  metrics: PerformanceMetrics;
}

export interface RankingCriteria {
  metric: RankingMetric;
  /** Stallions with fewer races are excluded to avoid ranking on tiny samples. */
  minRaces: number;
  limit: number;
}

/** Lower average finish position is better; higher rates are better. */
const LOWER_IS_BETTER: Record<RankingMetric, boolean> = {
  winRate: false,
  placeRate: false,
  averageFinishPosition: true,
};

/**
 * Ranks stallions on one indicator. Ties are broken by the number of races
 * (larger sample first), then by name, so the order is reproducible.
 */
export function rankStallions(
  candidates: readonly StallionMetrics[],
  criteria: RankingCriteria,
): StallionRankingEntry[] {
  const direction = LOWER_IS_BETTER[criteria.metric] ? 1 : -1;
  return candidates
    .filter((candidate) => candidate.metrics.raceCount >= Math.max(1, criteria.minRaces))
    .sort((left, right) => {
      const leftValue = left.metrics[criteria.metric] ?? 0;
      const rightValue = right.metrics[criteria.metric] ?? 0;
      return (
        direction * (leftValue - rightValue) ||
        right.metrics.raceCount - left.metrics.raceCount ||
        left.stallionName.localeCompare(right.stallionName, 'fr')
      );
    })
    .slice(0, criteria.limit)
    .map((candidate, index) => ({ rank: index + 1, ...candidate }));
}
