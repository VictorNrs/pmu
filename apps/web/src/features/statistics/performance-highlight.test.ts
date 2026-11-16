import type { PerformanceMetrics } from '@pmu/shared';
import { describe, expect, it } from 'vitest';
import { getIndicator } from '@/utils/metric-format';
import {
  compareIndicator,
  findBestValue,
  heatIntensity,
  isSignificant,
} from './performance-highlight';

function metrics(
  raceCount: number,
  winRate: number | null,
  average: number | null,
): PerformanceMetrics {
  return {
    raceCount,
    winCount: 0,
    placeCount: 0,
    winRate,
    placeRate: null,
    averageFinishPosition: average,
  };
}

const winRate = getIndicator('winRate');
const average = getIndicator('averageFinishPosition');

describe('performance highlight', () => {
  const cells = [metrics(10, 0.3, 4), metrics(1, 1, 1), metrics(5, 0.4, 3), metrics(0, null, null)];

  it('ignores samples below the minimum number of races', () => {
    expect(isSignificant(cells[1] as PerformanceMetrics, 3)).toBe(false);
    expect(findBestValue(cells, winRate, 3)).toBe(0.4);
    expect(findBestValue(cells, winRate, 1)).toBe(1);
  });

  it('uses the lowest value when lower is better', () => {
    expect(findBestValue(cells, average, 3)).toBe(3);
  });

  it('returns null when no cell is significant', () => {
    expect(findBestValue([metrics(0, null, null)], winRate, 1)).toBeNull();
  });

  it('scales the heat relative to the best value', () => {
    expect(heatIntensity(0.2, 0.4, winRate)).toBe(0.5);
    expect(heatIntensity(6, 3, average)).toBe(0.5);
    expect(heatIntensity(null, 0.4, winRate)).toBe(0);
    expect(heatIntensity(0, 0, winRate)).toBe(0);
  });

  it('sorts null values last in both directions', () => {
    const values = [0.2, null, 0.5];
    expect([...values].sort((a, b) => compareIndicator(a, b, 'ascend'))).toEqual([0.2, 0.5, null]);
    const descending = [...values].sort((a, b) => -compareIndicator(a, b, 'descend'));
    expect(descending).toEqual([0.5, 0.2, null]);
  });
});
