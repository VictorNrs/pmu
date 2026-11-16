<script setup lang="ts">
import type { PerformanceMatrix, PerformanceMetrics } from '@pmu/shared';
import { NDataTable, type DataTableColumns } from 'naive-ui';
import { computed } from 'vue';
import { INDICATORS } from '@/utils/metric-format';

/** One stallion's performances, one line per terrain or distance. */
const props = defineProps<{ matrix: PerformanceMatrix; stallionId: number; loading: boolean }>();

interface BreakdownRow {
  key: number;
  label: string;
  metrics: PerformanceMetrics;
}

const rows = computed<BreakdownRow[]>(() => {
  const row = props.matrix.rows.find((candidate) => candidate.stallionId === props.stallionId);
  if (!row) return [];
  return props.matrix.columns.map((column) => ({
    key: column.key,
    label: column.label,
    metrics: row.cells[column.key] as PerformanceMetrics,
  }));
});

const columns = computed<DataTableColumns<BreakdownRow>>(() => [
  {
    title: props.matrix.dimension === 'terrain' ? 'Terrain' : 'Distance',
    key: 'label',
    width: 120,
  },
  ...INDICATORS.map((indicator) => ({
    title: indicator.shortLabel,
    key: indicator.key,
    align: 'right' as const,
    className: 'tabular',
    render: (row: BreakdownRow) => indicator.format(row.metrics[indicator.key]),
  })),
]);
</script>

<template>
  <NDataTable
    :columns="columns"
    :data="rows"
    :loading="loading"
    size="small"
    :row-key="(row: BreakdownRow) => row.key"
    :row-class-name="(row: BreakdownRow) => (row.metrics.raceCount === 0 ? 'row-empty' : '')"
  />
</template>

<style scoped>
:deep(.row-empty td) {
  color: var(--text-muted);
}
</style>
