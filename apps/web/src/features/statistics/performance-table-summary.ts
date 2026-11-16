import type { PerformanceMatrix } from '@pmu/shared';
import { h, type VNodeChild } from 'vue';
import type { IndicatorDefinition } from '@/utils/metric-format';
import { averageOf, leafKey, TOTAL_COLUMN_KEY, type ColumnKey } from './performance-table-columns';

/** Shape of a Naive UI summary row (the type is not exported by the library). */
type SummaryRowData = Record<string, { value: VNodeChild }>;

/**
 * "Moyenne" row at the bottom of the table: the reference average computed by the
 * backend on every participation of the selection, all stallions together.
 */
export function buildAverageSummary(
  matrix: PerformanceMatrix,
  indicators: readonly IndicatorDefinition[],
): SummaryRowData {
  const keys: ColumnKey[] = [TOTAL_COLUMN_KEY, ...matrix.columns.map((column) => column.key)];
  const row: SummaryRowData = {
    stallionName: {
      value: h(
        'span',
        { class: 'summary-label', title: 'Tous les étalons de la sélection' },
        'Moyenne',
      ),
    },
  };
  for (const key of keys) {
    const metrics = averageOf(matrix, key);
    for (const indicator of indicators) {
      row[leafKey(key, indicator)] = {
        value: h(
          'div',
          { class: 'metric-cell metric-cell--summary tabular' },
          indicator.format(metrics[indicator.key]),
        ),
      };
    }
  }
  return row;
}
