import type { IndicatorDefinition } from '@/utils/metric-format';

export interface AverageDelta {
  text: string;
  direction: 'better' | 'worse' | 'equal';
}

const RATE_KEYS = new Set(['winRate', 'placeRate']);
const pointsFormat = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
});
const positionFormat = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: 'exceptZero',
});

/**
 * Display gap between a value and the reference average, both computed by the backend:
 * percentage points for rates, positions for the average finish position.
 * Counts are not compared (they depend on the sample size, not on performance).
 */
export function compareToAverage(
  value: number | null,
  average: number | null,
  indicator: IndicatorDefinition,
): AverageDelta | null {
  const isRate = RATE_KEYS.has(indicator.key);
  if (!isRate && indicator.key !== 'averageFinishPosition') return null;
  if (value === null || average === null) return null;
  const gap = isRate ? (value - average) * 100 : value - average;
  const rounded = Math.round(gap * (isRate ? 10 : 100)) / (isRate ? 10 : 100);
  if (rounded === 0) return { text: '= moy.', direction: 'equal' };
  const isBetter = indicator.better === 'higher' ? rounded > 0 : rounded < 0;
  return {
    text: isRate ? `${pointsFormat.format(rounded)} pts` : positionFormat.format(rounded),
    direction: isBetter ? 'better' : 'worse',
  };
}
