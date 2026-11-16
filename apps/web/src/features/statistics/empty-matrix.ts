import type { PerformanceDimension, PerformanceMatrix } from '@pmu/shared';

/** Placeholder displayed while the matrix is loading. */
export function emptyMatrix(dimension: PerformanceDimension): PerformanceMatrix {
  return {
    dimension,
    columns: [],
    rows: [],
    average: {
      total: {
        raceCount: 0,
        winCount: 0,
        placeCount: 0,
        winRate: null,
        placeRate: null,
        averageFinishPosition: null,
      },
      cells: {},
    },
  };
}
