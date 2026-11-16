import type {
  PerformanceColumn,
  PerformanceMatrix,
  PerformanceMetrics,
  StallionPerformanceRow,
} from '@pmu/shared';
import type { DataTableColumn, DataTableColumns } from 'naive-ui';
import { h } from 'vue';
import { RouterLink } from 'vue-router';
import type { IndicatorDefinition } from '@/utils/metric-format';
import { compareToAverage } from './average-comparison';
import {
  compareIndicator,
  findBestValue,
  heatIntensity,
  isSignificant,
} from './performance-highlight';

export const TOTAL_COLUMN_KEY = 'total';
export type ColumnKey = number | typeof TOTAL_COLUMN_KEY;

export interface SortState {
  columnKey: string;
  order: 'ascend' | 'descend' | false;
}

export interface TableColumnOptions {
  matrix: PerformanceMatrix;
  indicators: readonly IndicatorDefinition[];
  highlight: IndicatorDefinition;
  minRaces: number;
  /** Shows the gap to the reference average next to rates and average positions. */
  showAverageDelta: boolean;
  sort: SortState | null;
  onCellClick: (row: StallionPerformanceRow, column: PerformanceColumn | null) => void;
}

function metricsOf(row: StallionPerformanceRow, key: ColumnKey): PerformanceMetrics {
  return key === TOTAL_COLUMN_KEY ? row.total : (row.cells[key] as PerformanceMetrics);
}

export function averageOf(matrix: PerformanceMatrix, key: ColumnKey): PerformanceMetrics {
  return key === TOTAL_COLUMN_KEY
    ? matrix.average.total
    : (matrix.average.cells[key] as PerformanceMetrics);
}

export function leafKey(columnKey: ColumnKey, indicator: IndicatorDefinition): string {
  return `${columnKey}:${indicator.key}`;
}

function renderCell(
  metrics: PerformanceMetrics,
  indicator: IndicatorDefinition,
  options: TableColumnOptions,
  best: number | null,
  average: PerformanceMetrics,
) {
  const value = metrics[indicator.key];
  const significant = isSignificant(metrics, options.minRaces);
  const isHighlighted = indicator.key === options.highlight.key && significant;
  const intensity = isHighlighted ? heatIntensity(value, best, indicator) : 0;
  const isBest = isHighlighted && value !== null && value === best;
  const delta =
    options.showAverageDelta && significant
      ? compareToAverage(value, average[indicator.key], indicator)
      : null;
  return h(
    'div',
    {
      class: [
        'metric-cell',
        'tabular',
        {
          'metric-cell--empty': metrics.raceCount === 0,
          'metric-cell--low-sample': metrics.raceCount > 0 && !significant,
          'metric-cell--best': isBest,
        },
      ],
      style: intensity > 0 ? { '--heat': intensity.toFixed(2) } : undefined,
      title:
        metrics.raceCount === 0
          ? 'Aucune course'
          : `${metrics.raceCount} course(s) — cliquer pour le détail`,
    },
    delta
      ? [
          h('span', indicator.format(value)),
          h('span', { class: `metric-delta metric-delta--${delta.direction}` }, delta.text),
        ]
      : indicator.format(value),
  );
}

function buildGroup(
  options: TableColumnOptions,
  key: ColumnKey,
  title: string,
  column: PerformanceColumn | null,
): DataTableColumn<StallionPerformanceRow> {
  const cells = options.matrix.rows.map((row) => metricsOf(row, key));
  const average = averageOf(options.matrix, key);
  return {
    title,
    key: String(key),
    align: 'center',
    className: key === TOTAL_COLUMN_KEY ? 'group-total' : 'group-start',
    children: options.indicators.map((indicator, index) => {
      const columnKey = leafKey(key, indicator);
      const best = findBestValue(cells, indicator, options.minRaces);
      return {
        title: () => h('span', { title: indicator.description }, indicator.shortLabel),
        key: columnKey,
        align: 'right',
        width: indicator.key === 'raceCount' ? 52 : 70,
        className: index === 0 ? 'group-start' : undefined,
        sortOrder: options.sort?.columnKey === columnKey ? options.sort.order : false,
        sorter: (left: StallionPerformanceRow, right: StallionPerformanceRow) =>
          compareIndicator(
            metricsOf(left, key)[indicator.key],
            metricsOf(right, key)[indicator.key],
            options.sort?.order === 'ascend' ? 'ascend' : 'descend',
          ),
        cellProps: (row: StallionPerformanceRow) => ({
          class: 'clickable-cell',
          onClick: () => options.onCellClick(row, column),
        }),
        render: (row: StallionPerformanceRow) =>
          renderCell(metricsOf(row, key), indicator, options, best, average),
      };
    }),
  };
}

export function buildTableColumns(
  options: TableColumnOptions,
): DataTableColumns<StallionPerformanceRow> {
  const stallionColumn: DataTableColumn<StallionPerformanceRow> = {
    title: 'Étalon',
    key: 'stallionName',
    fixed: 'left',
    width: 190,
    ellipsis: { tooltip: true },
    sortOrder: options.sort?.columnKey === 'stallionName' ? options.sort.order : false,
    sorter: (left, right) => left.stallionName.localeCompare(right.stallionName, 'fr'),
    render: (row) =>
      h(
        RouterLink,
        { to: { name: 'stallion-detail', params: { id: row.stallionId } }, class: 'stallion-link' },
        () => row.stallionName,
      ),
  };
  return [
    stallionColumn,
    buildGroup(options, TOTAL_COLUMN_KEY, 'Toutes conditions', null),
    ...options.matrix.columns.map((column) =>
      buildGroup(options, column.key, column.label, column),
    ),
  ];
}
