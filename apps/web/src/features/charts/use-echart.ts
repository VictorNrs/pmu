import { init, type EChartsCoreOption, type EChartsType } from 'echarts/core';
import { onBeforeUnmount, onMounted, shallowRef, watch, type Ref } from 'vue';
import './echarts-setup';

/** Mounts an ECharts instance on an element and keeps it in sync with a reactive option. */
export function useEChart(element: Ref<HTMLElement | null>, option: Ref<EChartsCoreOption>) {
  const chart = shallowRef<EChartsType | null>(null);
  let observer: ResizeObserver | null = null;

  onMounted(() => {
    if (!element.value) return;
    chart.value = init(element.value, undefined, { renderer: 'svg' });
    chart.value.setOption(option.value);
    observer = new ResizeObserver(() => requestAnimationFrame(() => chart.value?.resize()));
    observer.observe(element.value);
  });

  watch(option, (value) => chart.value?.setOption(value, { notMerge: true }), { deep: true });

  onBeforeUnmount(() => {
    observer?.disconnect();
    chart.value?.dispose();
  });

  return chart;
}
