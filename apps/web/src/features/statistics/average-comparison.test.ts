import { describe, expect, it } from 'vitest';
import { getIndicator } from '@/utils/metric-format';
import { compareToAverage } from './average-comparison';

const winRate = getIndicator('winRate');
const average = getIndicator('averageFinishPosition');

describe('compareToAverage', () => {
  it('shows rate gaps in percentage points', () => {
    expect(compareToAverage(0.25, 0.12, winRate)).toEqual({
      text: '+13,0 pts',
      direction: 'better',
    });
    expect(compareToAverage(0.05, 0.12, winRate)?.direction).toBe('worse');
  });

  it('treats a lower average finish position as better', () => {
    expect(compareToAverage(3.2, 4, average)).toEqual({ text: '-0,80', direction: 'better' });
    expect(compareToAverage(5, 4, average)?.direction).toBe('worse');
  });

  it('reports equality and missing data', () => {
    expect(compareToAverage(0.2, 0.2, winRate)?.direction).toBe('equal');
    expect(compareToAverage(null, 0.2, winRate)).toBeNull();
    expect(compareToAverage(3, 2, getIndicator('raceCount'))).toBeNull();
  });
});
