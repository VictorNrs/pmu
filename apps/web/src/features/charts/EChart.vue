<script setup lang="ts">
import type { EChartsCoreOption } from 'echarts/core';
import { ref, toRef } from 'vue';
import { useEChart } from './use-echart';

const props = defineProps<{ option: EChartsCoreOption; height: number; description: string }>();
const element = ref<HTMLElement | null>(null);
useEChart(element, toRef(props, 'option'));
</script>

<template>
  <div
    ref="element"
    role="img"
    :aria-label="description"
    :style="{ height: `${height}px`, width: '100%' }"
  />
</template>
