import type { PerformanceMetrics } from '@pmu/shared';

export type IndicatorKey = keyof PerformanceMetrics;

export interface IndicatorDefinition {
  key: IndicatorKey;
  label: string;
  shortLabel: string;
  description: string;
  /** Direction used for highlighting and sorting the "best" values. */
  better: 'higher' | 'lower';
  format: (value: number | null) => string;
}

const percentFormat = new Intl.NumberFormat('fr-FR', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const averageFormat = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const countFormat = new Intl.NumberFormat('fr-FR');

export const NO_DATA = '—';

export function formatPercent(value: number | null): string {
  return value === null ? NO_DATA : percentFormat.format(value);
}

export function formatAverage(value: number | null): string {
  return value === null ? NO_DATA : averageFormat.format(value);
}

export function formatCount(value: number | null): string {
  return value === null ? NO_DATA : countFormat.format(value);
}

export function formatDate(isoDate: string | null): string {
  if (!isoDate) return NO_DATA;
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

/** Display metadata only: the values themselves are computed by the backend. */
export const INDICATORS: readonly IndicatorDefinition[] = [
  {
    key: 'raceCount',
    label: 'Courses',
    shortLabel: 'C',
    description: 'Nombre de courses disputées',
    better: 'higher',
    format: formatCount,
  },
  {
    key: 'winCount',
    label: 'Victoires',
    shortLabel: 'V',
    description: 'Nombre de 1res places',
    better: 'higher',
    format: formatCount,
  },
  {
    key: 'placeCount',
    label: 'Places',
    shortLabel: 'P',
    description: 'Nombre de 2es et 3es places',
    better: 'higher',
    format: formatCount,
  },
  {
    key: 'winRate',
    label: '% Victoires',
    shortLabel: '% V',
    description: 'Victoires / courses',
    better: 'higher',
    format: formatPercent,
  },
  {
    key: 'placeRate',
    label: '% Places',
    shortLabel: '% P',
    description: '2es et 3es places / courses',
    better: 'higher',
    format: formatPercent,
  },
  {
    key: 'averageFinishPosition',
    label: 'Rang moyen',
    shortLabel: 'Moy.',
    description: "Moyenne des rangs d'arrivée (plus bas = meilleur)",
    better: 'lower',
    format: formatAverage,
  },
];

export function getIndicator(key: IndicatorKey): IndicatorDefinition {
  const indicator = INDICATORS.find((candidate) => candidate.key === key);
  if (!indicator) throw new Error(`Unknown indicator ${key}`);
  return indicator;
}
