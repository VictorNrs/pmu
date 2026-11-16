import type { PerformanceMetrics } from '@pmu/shared';
import { rankStallions, type StallionMetrics } from './stallion-ranking';

function candidate(
  stallionId: number,
  stallionName: string,
  metrics: Partial<PerformanceMetrics>,
): StallionMetrics {
  return {
    stallionId,
    stallionName,
    metrics: {
      raceCount: 0,
      winCount: 0,
      placeCount: 0,
      winRate: null,
      placeRate: null,
      averageFinishPosition: null,
      ...metrics,
    },
  };
}

const candidates = [
  candidate(1, 'Alpha', { raceCount: 10, winRate: 0.3, averageFinishPosition: 4 }),
  candidate(2, 'Bravo', { raceCount: 2, winRate: 0.5, averageFinishPosition: 2 }),
  candidate(3, 'Charlie', { raceCount: 20, winRate: 0.3, averageFinishPosition: 3.5 }),
  candidate(4, 'Delta', { raceCount: 0 }),
];

describe('rankStallions', () => {
  it('orders by descending win rate and breaks ties with the larger sample', () => {
    const ranking = rankStallions(candidates, { metric: 'winRate', minRaces: 1, limit: 10 });
    expect(ranking.map((entry) => [entry.rank, entry.stallionName])).toEqual([
      [1, 'Bravo'],
      [2, 'Charlie'],
      [3, 'Alpha'],
    ]);
  });

  it('orders by ascending average finish position (lower is better)', () => {
    const ranking = rankStallions(candidates, {
      metric: 'averageFinishPosition',
      minRaces: 1,
      limit: 10,
    });
    expect(ranking.map((entry) => entry.stallionName)).toEqual(['Bravo', 'Charlie', 'Alpha']);
  });

  it('excludes samples smaller than the minimum number of races', () => {
    const ranking = rankStallions(candidates, { metric: 'winRate', minRaces: 5, limit: 10 });
    expect(ranking.map((entry) => entry.stallionName)).toEqual(['Charlie', 'Alpha']);
  });

  it('never ranks a stallion without race, even with minRaces at 0', () => {
    const ranking = rankStallions(candidates, { metric: 'winRate', minRaces: 0, limit: 10 });
    expect(ranking.some((entry) => entry.stallionName === 'Delta')).toBe(false);
  });

  it('applies the limit', () => {
    expect(rankStallions(candidates, { metric: 'winRate', minRaces: 1, limit: 1 })).toHaveLength(1);
  });
});
