import type { PerformanceMatrix } from '@pmu/shared';
import type { EChartsCoreOption } from 'echarts/core';
import { palette } from '@/styles/theme';
import type { IndicatorDefinition } from '@/utils/metric-format';
import { isSignificant } from '@/features/statistics/performance-highlight';
import { axisStyle, baseChartOption } from './echarts-setup';

/**
 * Stallion × condition heatmap for one indicator. Cells below the minimum number of
 * races are left blank (shown as "échantillon insuffisant" in the tooltip).
 */
export function buildHeatmapOption(
  matrix: PerformanceMatrix,
  indicator: IndicatorDefinition,
  minRaces: number,
): EChartsCoreOption {
  const rows = [...matrix.rows].reverse();
  const data: [number, number, number | null][] = [];
  const values: number[] = [];
  rows.forEach((row, rowIndex) => {
    matrix.columns.forEach((column, columnIndex) => {
      const metrics = row.cells[column.key];
      const value = metrics && isSignificant(metrics, minRaces) ? metrics[indicator.key] : null;
      if (value !== null) values.push(value);
      data.push([columnIndex, rowIndex, value]);
    });
  });
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const colors =
    indicator.better === 'lower' ? [...palette.sequential].reverse() : [...palette.sequential];

  return {
    ...baseChartOption,
    grid: { left: 8, right: 16, top: 8, bottom: 56, containLabel: true },
    tooltip: {
      ...baseChartOption.tooltip,
      trigger: 'item',
      formatter: (params: { data: [number, number, number | null] }) => {
        const [columnIndex, rowIndex] = params.data;
        const row = rows[rowIndex];
        const column = matrix.columns[columnIndex];
        const metrics = row && column ? row.cells[column.key] : undefined;
        if (!row || !column || !metrics) return '';
        const value = isSignificant(metrics, minRaces)
          ? `<b>${indicator.format(metrics[indicator.key])}</b>`
          : `<i>échantillon insuffisant</i>`;
        return (
          `<b>${row.stallionName}</b> · ${column.label}<br/>${indicator.label} : ${value}<br/>` +
          `<span style="color:${palette.textSecondary}">${metrics.raceCount} course(s)</span>`
        );
      },
    },
    xAxis: {
      type: 'category',
      data: matrix.columns.map((column) => column.label),
      ...axisStyle,
      splitArea: { show: false },
    },
    yAxis: {
      type: 'category',
      data: rows.map((row) => row.stallionName),
      ...axisStyle,
      axisLabel: { color: palette.textPrimary },
    },
    visualMap: {
      min,
      max: max === min ? min + 1 : max,
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      itemHeight: 160,
      itemWidth: 10,
      textStyle: { color: palette.textSecondary },
      formatter: (value: number) => indicator.format(value),
      inRange: { color: colors },
    },
    series: [
      {
        type: 'heatmap',
        data,
        itemStyle: { borderColor: palette.surface, borderWidth: 2, borderRadius: 4 },
        emphasis: { itemStyle: { borderColor: palette.textPrimary, borderWidth: 1 } },
        label: {
          show: true,
          color: palette.textPrimary,
          fontSize: 11,
          textBorderColor: 'rgba(13, 17, 23, 0.9)',
          textBorderWidth: 3,
          formatter: (params: { data: [number, number, number | null] }) =>
            indicator.format(params.data[2]) === '—' ? '' : indicator.format(params.data[2]),
        },
      },
    ],
  };
}
