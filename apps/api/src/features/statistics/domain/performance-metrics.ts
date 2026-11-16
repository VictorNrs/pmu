import type { PerformanceMetrics } from '@pmu/shared';

/**
 * Business rules for classifying a finish position.
 * - Victory: 1st place.
 * - Place: 2nd or 3rd place (the winner is NOT counted as placed).
 * Dead heats are allowed: two horses finishing 1st both count as a victory.
 */
export const WIN_POSITION = 1;
export const PLACE_POSITIONS: readonly number[] = [2, 3];

/** Raw additive counters of a group of participations, as aggregated by PostgreSQL. */
export interface ParticipationCounts {
  raceCount: number;
  winCount: number;
  placeCount: number;
  /** Sum of the finish positions, used for the average finish position. */
  finishPositionSum: number;
}

export const EMPTY_COUNTS: ParticipationCounts = Object.freeze({
  raceCount: 0,
  winCount: 0,
  placeCount: 0,
  finishPositionSum: 0,
});

export function addCounts(
  left: ParticipationCounts,
  right: ParticipationCounts,
): ParticipationCounts {
  return {
    raceCount: left.raceCount + right.raceCount,
    winCount: left.winCount + right.winCount,
    placeCount: left.placeCount + right.placeCount,
    finishPositionSum: left.finishPositionSum + right.finishPositionSum,
  };
}

export function sumCounts(groups: Iterable<ParticipationCounts>): ParticipationCounts {
  let total = EMPTY_COUNTS;
  for (const group of groups) total = addCounts(total, group);
  return total;
}

/**
 * Computes the indicators of a group. Every indicator shares the same denominator:
 * the number of races (participations) of the group.
 * - winRate = winCount / raceCount
 * - placeRate = placeCount / raceCount
 * - averageFinishPosition = sum of finish positions / raceCount (lower is better)
 * Rates and average are `null` when the group has no race: absence of data is not 0 %.
 */
export function computePerformanceMetrics(counts: ParticipationCounts): PerformanceMetrics {
  assertConsistentCounts(counts);
  const { raceCount, winCount, placeCount, finishPositionSum } = counts;
  if (raceCount === 0) {
    return {
      raceCount,
      winCount,
      placeCount,
      winRate: null,
      placeRate: null,
      averageFinishPosition: null,
    };
  }
  return {
    raceCount,
    winCount,
    placeCount,
    winRate: winCount / raceCount,
    placeRate: placeCount / raceCount,
    averageFinishPosition: finishPositionSum / raceCount,
  };
}

function assertConsistentCounts(counts: ParticipationCounts): void {
  const values = [counts.raceCount, counts.winCount, counts.placeCount, counts.finishPositionSum];
  if (values.some((value) => !Number.isInteger(value) || value < 0)) {
    throw new RangeError('Participation counts must be non-negative integers');
  }
  if (counts.winCount + counts.placeCount > counts.raceCount) {
    throw new RangeError('Wins and places cannot exceed the number of races');
  }
  if (counts.finishPositionSum < counts.raceCount) {
    throw new RangeError('The sum of finish positions cannot be lower than the number of races');
  }
}
