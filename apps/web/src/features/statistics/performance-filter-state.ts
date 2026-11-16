import type { PerformanceDimension, PerformanceFilters } from '@pmu/shared';
import { timestampToIsoDate } from '@/utils/date';
import type { IndicatorKey } from '@/utils/metric-format';

export interface PerformanceFilterState {
  search: string;
  terrainConditionIds: number[];
  distances: number[];
  period: [number, number] | null;
  minRaces: number;
  indicatorKeys: IndicatorKey[];
  highlightKey: IndicatorKey;
  hideStallionsWithoutRace: boolean;
}

export function createDefaultFilterState(): PerformanceFilterState {
  return {
    search: '',
    terrainConditionIds: [],
    distances: [],
    period: null,
    minRaces: 3,
    indicatorKeys: [
      'raceCount',
      'winCount',
      'placeCount',
      'winRate',
      'placeRate',
      'averageFinishPosition',
    ],
    highlightKey: 'winRate',
    hideStallionsWithoutRace: false,
  };
}

/** Criteria sent to the backend; search and display options stay client-side. */
export function toPerformanceFilters(state: PerformanceFilterState): PerformanceFilters {
  return {
    terrainConditionIds: state.terrainConditionIds,
    distances: state.distances,
    from: state.period ? timestampToIsoDate(state.period[0]) : undefined,
    to: state.period ? timestampToIsoDate(state.period[1]) : undefined,
  };
}

/** Criteria of one cell: the table filters narrowed to the clicked stallion and column. */
export function cellFilters(
  filters: PerformanceFilters,
  dimension: PerformanceDimension,
  stallionId: number,
  columnKey: number | null,
): PerformanceFilters {
  const narrowed: PerformanceFilters = { ...filters, stallionIds: [stallionId] };
  if (columnKey === null) return narrowed;
  return dimension === 'terrain'
    ? { ...narrowed, terrainConditionIds: [columnKey] }
    : { ...narrowed, distances: [columnKey] };
}
