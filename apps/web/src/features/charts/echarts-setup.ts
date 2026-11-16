import { BarChart, HeatmapChart, LineChart } from 'echarts/charts';
import {
  AxisPointerComponent,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components';
import { use } from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';
import { palette } from '@/styles/theme';

use([
  BarChart,
  LineChart,
  HeatmapChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
  AxisPointerComponent,
  DataZoomComponent,
  SVGRenderer,
]);

const CHART_FONT = "'Segoe UI', system-ui, -apple-system, Roboto, sans-serif";

/** Shared chart styling: recessive axes and grid, text in text tokens, never in series colors. */
export const baseChartOption = {
  backgroundColor: 'transparent',
  color: [...palette.series],
  // An explicit family keeps ECharts' text measurement equal to the rendered text.
  textStyle: { color: palette.textSecondary, fontFamily: CHART_FONT },
  tooltip: {
    backgroundColor: palette.surfaceRaised,
    borderColor: palette.border,
    textStyle: { color: palette.textPrimary, fontSize: 12 },
    extraCssText: 'box-shadow: 0 6px 20px rgba(0,0,0,.35); border-radius: 8px;',
  },
  legend: {
    textStyle: { color: palette.textSecondary, fontFamily: CHART_FONT },
    itemGap: 18,
    icon: 'roundRect',
    itemWidth: 12,
    itemHeight: 8,
  },
};

export const axisStyle = {
  axisLine: { lineStyle: { color: palette.border } },
  axisTick: { show: false },
  axisLabel: { color: palette.textSecondary },
  splitLine: { lineStyle: { color: 'rgba(38, 48, 65, 0.6)' } },
};
