import {
  EMPTY_COUNTS,
  addCounts,
  computePerformanceMetrics,
  sumCounts,
  type ParticipationCounts,
} from './performance-metrics';

function counts(
  raceCount: number,
  winCount: number,
  placeCount: number,
  finishPositionSum: number,
): ParticipationCounts {
  return { raceCount, winCount, placeCount, finishPositionSum };
}

describe('computePerformanceMetrics', () => {
  it('computes rates and average finish position on the number of races', () => {
    // Finishes 1, 2, 3, 5 -> 1 win, 2 places, average 11 / 4
    expect(computePerformanceMetrics(counts(4, 1, 2, 11))).toEqual({
      raceCount: 4,
      winCount: 1,
      placeCount: 2,
      winRate: 0.25,
      placeRate: 0.5,
      averageFinishPosition: 2.75,
    });
  });

  it('returns null indicators, not zero, when there is no race', () => {
    expect(computePerformanceMetrics(EMPTY_COUNTS)).toEqual({
      raceCount: 0,
      winCount: 0,
      placeCount: 0,
      winRate: null,
      placeRate: null,
      averageFinishPosition: null,
    });
  });

  it('returns a 0 % rate when races exist without any win or place', () => {
    const metrics = computePerformanceMetrics(counts(2, 0, 0, 13));
    expect(metrics.winRate).toBe(0);
    expect(metrics.placeRate).toBe(0);
    expect(metrics.averageFinishPosition).toBe(6.5);
  });

  it('handles a single-race sample', () => {
    expect(computePerformanceMetrics(counts(1, 1, 0, 1))).toMatchObject({
      winRate: 1,
      placeRate: 0,
      averageFinishPosition: 1,
    });
  });

  it.each([
    ['negative counts', counts(-1, 0, 0, 0)],
    ['non integer counts', counts(1.5, 0, 0, 2)],
    ['more wins and places than races', counts(2, 2, 1, 4)],
    ['finish position sum lower than races', counts(3, 0, 0, 2)],
  ])('rejects inconsistent counters: %s', (_label, invalid) => {
    expect(() => computePerformanceMetrics(invalid)).toThrow(RangeError);
  });
});

describe('addCounts / sumCounts', () => {
  it('adds every counter', () => {
    expect(addCounts(counts(2, 1, 0, 5), counts(3, 0, 2, 9))).toEqual(counts(5, 1, 2, 14));
  });

  it('returns empty counters for an empty list', () => {
    expect(sumCounts([])).toEqual(EMPTY_COUNTS);
  });

  it('gives the average of the merged population, not the average of averages', () => {
    // Group A finishes 1, 4 (avg 2.5) ; group B finishes 2, 2, 7 (avg 3.67)
    const merged = sumCounts([counts(2, 1, 0, 5), counts(3, 0, 2, 11)]);
    expect(computePerformanceMetrics(merged).averageFinishPosition).toBeCloseTo(16 / 5);
  });
});
