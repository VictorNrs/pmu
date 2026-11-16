import type {
  PerformanceColumn,
  PerformanceDimension,
  PerformanceMatrix,
  StallionPerformanceRow,
} from '@pmu/shared';
import {
  EMPTY_COUNTS,
  computePerformanceMetrics,
  sumCounts,
  type ParticipationCounts,
} from './performance-metrics';

export interface StallionReference {
  id: number;
  name: string;
}

/** Counters of one (stallion, column) pair. */
export interface GroupCounts extends ParticipationCounts {
  stallionId: number;
  columnKey: number;
}

/**
 * Builds the complete stallion × column grid. Every stallion appears, even without
 * any race, and every cell exists: missing combinations get zero races and null rates.
 * The row total is the sum of its cells, so the columns always add up to the total.
 */
export function buildPerformanceMatrix(
  dimension: PerformanceDimension,
  stallions: readonly StallionReference[],
  columns: readonly PerformanceColumn[],
  groups: readonly GroupCounts[],
): PerformanceMatrix {
  assertKnownColumns(columns, groups);
  const countsByCell = indexGroups(groups);
  const rows = stallions.map((stallion): StallionPerformanceRow => {
    const cellCounts = columns.map(
      (column) => countsByCell.get(cellKey(stallion.id, column.key)) ?? EMPTY_COUNTS,
    );
    const cells: StallionPerformanceRow['cells'] = {};
    columns.forEach((column, index) => {
      cells[column.key] = computePerformanceMetrics(cellCounts[index] ?? EMPTY_COUNTS);
    });
    return {
      stallionId: stallion.id,
      stallionName: stallion.name,
      total: computePerformanceMetrics(sumCounts(cellCounts)),
      cells,
    };
  });
  return { dimension, columns: [...columns], rows, average: buildAverage(columns, groups) };
}

/**
 * Reference average of the selection: counters of every stallion are summed first,
 * then the indicators are computed once (never an average of averages).
 */
function buildAverage(
  columns: readonly PerformanceColumn[],
  groups: readonly GroupCounts[],
): PerformanceMatrix['average'] {
  const cells: PerformanceMatrix['average']['cells'] = {};
  for (const column of columns) {
    const columnGroups = groups.filter((group) => group.columnKey === column.key);
    cells[column.key] = computePerformanceMetrics(sumCounts(columnGroups));
  }
  return { total: computePerformanceMetrics(sumCounts(groups)), cells };
}

/** A participation outside the displayed columns would silently disappear from the totals. */
function assertKnownColumns(
  columns: readonly PerformanceColumn[],
  groups: readonly GroupCounts[],
): void {
  const keys = new Set(columns.map((column) => column.key));
  const unknown = groups.find((group) => !keys.has(group.columnKey));
  if (unknown) throw new Error(`Unknown column ${unknown.columnKey} in aggregates`);
}

function indexGroups(groups: readonly GroupCounts[]): Map<string, ParticipationCounts> {
  const index = new Map<string, ParticipationCounts>();
  for (const group of groups) {
    const key = cellKey(group.stallionId, group.columnKey);
    if (index.has(key)) throw new Error(`Duplicate aggregate for cell ${key}`);
    index.set(key, group);
  }
  return index;
}

function cellKey(stallionId: number, columnKey: number): string {
  return `${stallionId}:${columnKey}`;
}
