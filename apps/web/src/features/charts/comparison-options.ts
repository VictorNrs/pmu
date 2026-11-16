import type {
  PerformanceMatrix,
  PerformanceMetrics,
  StallionRankingEntry,
  StallionTrend,
} from '@pmu/shared';
import type { EChartsCoreOption } from 'echarts/core';
import { palette } from '@/styles/theme';
import { formatDate, type IndicatorDefinition } from '@/utils/metric-format';
import { isSignificant } from '@/features/statistics/performance-highlight';
import { axisStyle, baseChartOption } from './echarts-setup';

/** Colors follow the stallion (its position in the user's selection), never its rank. */
export type StallionColors = ReadonlyMap<number, string>;

export function assignStallionColors(stallionIds: readonly number[]): StallionColors {
  return new Map(
    stallionIds.map((id, index) => [id, palette.series[index % palette.series.length] as string]),
  );
}

function valueAxis(indicator: IndicatorDefinition) {
  const isRate = indicator.key === 'winRate' || indicator.key === 'placeRate';
  return {
    type: 'value',
    inverse: indicator.better === 'lower',
    max: isRate ? 1 : undefined,
    ...axisStyle,
    axisLabel: { ...axisStyle.axisLabel, formatter: (value: number) => indicator.format(value) },
  };
}

function tooltipLine(
  name: string,
  metrics: PerformanceMetrics,
  indicator: IndicatorDefinition,
): string {
  return (
    `<b>${name}</b><br/>${indicator.label} : <b>${indicator.format(metrics[indicator.key])}</b><br/>` +
    `<span style="color:${palette.textSecondary}">${metrics.raceCount} course(s) · ${metrics.winCount} V · ${metrics.placeCount} P</span>`
  );
}

export function buildRankingOption(
  entries: readonly StallionRankingEntry[],
  indicator: IndicatorDefinition,
): EChartsCoreOption {
  const ordered = [...entries].reverse();
  return {
    ...baseChartOption,
    grid: { left: 8, right: 64, top: 8, bottom: 8, containLabel: true },
    tooltip: {
      ...baseChartOption.tooltip,
      trigger: 'item',
      formatter: (params: { dataIndex: number }) => {
        const entry = ordered[params.dataIndex];
        return entry
          ? tooltipLine(`${entry.rank}. ${entry.stallionName}`, entry.metrics, indicator)
          : '';
      },
    },
    xAxis: { ...valueAxis(indicator), inverse: false, max: undefined, splitNumber: 4 },
    yAxis: {
      type: 'category',
      data: ordered.map((entry) => entry.stallionName),
      ...axisStyle,
      axisLabel: { color: palette.textPrimary },
    },
    series: [
      {
        type: 'bar',
        barMaxWidth: 18,
        itemStyle: { color: palette.series[0], borderRadius: [0, 4, 4, 0] },
        label: {
          show: true,
          position: 'right',
          color: palette.textSecondary,
          formatter: (params: { dataIndex: number }) => {
            const entry = ordered[params.dataIndex];
            return entry
              ? `${indicator.format(entry.metrics[indicator.key])}  (${entry.metrics.raceCount} c.)`
              : '';
          },
        },
        data: ordered.map((entry) => entry.metrics[indicator.key]),
      },
    ],
  };
}

export function buildComparisonOption(
  matrix: PerformanceMatrix,
  indicator: IndicatorDefinition,
  colors: StallionColors,
  minRaces: number,
): EChartsCoreOption {
  return {
    ...baseChartOption,
    grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
    legend: { ...baseChartOption.legend, top: 0, left: 0 },
    tooltip: {
      ...baseChartOption.tooltip,
      trigger: 'item',
      formatter: (params: { seriesIndex: number; dataIndex: number }) => {
        const row = matrix.rows[params.seriesIndex];
        const column = matrix.columns[params.dataIndex];
        const metrics = row && column ? row.cells[column.key] : undefined;
        return row && column && metrics
          ? tooltipLine(`${row.stallionName} · ${column.label}`, metrics, indicator)
          : '';
      },
    },
    xAxis: { type: 'category', data: matrix.columns.map((column) => column.label), ...axisStyle },
    yAxis: valueAxis(indicator),
    series: matrix.rows.map((row) => ({
      name: row.stallionName,
      type: 'bar',
      barMaxWidth: 22,
      barGap: '10%',
      itemStyle: {
        color: colors.get(row.stallionId),
        borderRadius: indicator.better === 'lower' ? [0, 0, 4, 4] : [4, 4, 0, 0],
        borderColor: palette.surface,
        borderWidth: 1,
      },
      data: matrix.columns.map((column) => {
        const metrics = row.cells[column.key];
        const value = metrics?.[indicator.key] ?? null;
        // Small samples stay visible but faded, like the greyed cells of the tables.
        return metrics && isSignificant(metrics, minRaces)
          ? value
          : { value, itemStyle: { opacity: 0.3 } };
      }),
    })),
  };
}

export function buildTrendOption(
  trends: readonly StallionTrend[],
  indicator: IndicatorDefinition,
  colors: StallionColors,
): EChartsCoreOption {
  const periods = [
    ...new Set(trends.flatMap((trend) => trend.points.map((point) => point.period))),
  ].sort();
  return {
    ...baseChartOption,
    grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
    legend: { ...baseChartOption.legend, top: 0, left: 0 },
    tooltip: {
      ...baseChartOption.tooltip,
      trigger: 'axis',
      axisPointer: { type: 'line', lineStyle: { color: palette.textMuted } },
      valueFormatter: (value: number | null) => indicator.format(value ?? null),
    },
    xAxis: {
      type: 'category',
      data: periods.map((period) => formatDate(period).slice(3)),
      ...axisStyle,
      boundaryGap: false,
    },
    yAxis: valueAxis(indicator),
    series: trends.map((trend) => {
      const byPeriod = new Map(
        trend.points.map((point) => [point.period, point.metrics[indicator.key]]),
      );
      return {
        name: trend.stallionName,
        type: 'line',
        connectNulls: true,
        symbolSize: 8,
        lineStyle: { width: 2 },
        itemStyle: {
          color: colors.get(trend.stallionId),
          borderColor: palette.surface,
          borderWidth: 2,
        },
        data: periods.map((period) => byPeriod.get(period) ?? null),
      };
    }),
  };
}
