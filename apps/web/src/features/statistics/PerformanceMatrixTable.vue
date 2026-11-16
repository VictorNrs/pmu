<script setup lang="ts">
import type { PerformanceColumn, PerformanceMatrix, StallionPerformanceRow } from '@pmu/shared';
import { NDataTable, NEmpty, type DataTableSortState } from 'naive-ui';
import { computed, ref } from 'vue';
import type { IndicatorDefinition } from '@/utils/metric-format';
import { buildTableColumns, type SortState } from './performance-table-columns';
import { buildAverageSummary } from './performance-table-summary';

const props = defineProps<{
  matrix: PerformanceMatrix;
  rows: StallionPerformanceRow[];
  indicators: readonly IndicatorDefinition[];
  highlight: IndicatorDefinition;
  minRaces: number;
  showAverageDelta: boolean;
  loading: boolean;
}>();

const emit = defineEmits<{
  cellClick: [row: StallionPerformanceRow, column: PerformanceColumn | null];
}>();

const sort = ref<SortState | null>(null);

const columns = computed(() =>
  buildTableColumns({
    matrix: props.matrix,
    indicators: props.indicators,
    highlight: props.highlight,
    minRaces: props.minRaces,
    showAverageDelta: props.showAverageDelta,
    sort: sort.value,
    onCellClick: (row, column) => emit('cellClick', row, column),
  }),
);

const summary = () => buildAverageSummary(props.matrix, props.indicators);

const scrollWidth = computed(() => {
  const groupWidth = props.indicators.reduce(
    (sum, indicator) => sum + (indicator.key === 'raceCount' ? 52 : 70),
    0,
  );
  return 190 + groupWidth * (props.matrix.columns.length + 1);
});

function onSorterChange(state: DataTableSortState | DataTableSortState[] | null): void {
  const single = Array.isArray(state) ? state[0] : state;
  sort.value = single ? { columnKey: String(single.columnKey), order: single.order } : null;
}
</script>

<template>
  <NDataTable
    class="performance-table"
    :columns="columns"
    :data="rows"
    :row-key="(row: StallionPerformanceRow) => row.stallionId"
    :loading="loading"
    :scroll-x="scrollWidth"
    :max-height="'calc(100vh - 330px)'"
    :min-height="240"
    virtual-scroll
    size="small"
    :single-line="false"
    striped
    :summary="summary"
    summary-placement="bottom"
    @update:sorter="onSorterChange"
  >
    <template #empty>
      <NEmpty description="Aucun étalon ne correspond aux critères." />
    </template>
  </NDataTable>
</template>

<style scoped>
.performance-table :deep(th.group-start),
.performance-table :deep(td.group-start) {
  border-left: 1px solid #344157 !important;
}
.performance-table :deep(th.group-total) {
  color: var(--gold);
}
.performance-table :deep(.clickable-cell) {
  cursor: pointer;
  padding: 0 !important;
}
.performance-table :deep(.metric-cell) {
  padding: 7px 10px;
  text-align: right;
  background: rgba(63, 182, 139, calc(var(--heat, 0) * 0.42));
  transition: background-color 0.15s;
}
.performance-table :deep(.clickable-cell:hover .metric-cell) {
  outline: 1px solid rgba(90, 169, 230, 0.6);
  outline-offset: -1px;
}
.performance-table :deep(.metric-cell--empty) {
  color: var(--text-muted);
  opacity: 0.55;
}
.performance-table :deep(.metric-cell--low-sample) {
  color: var(--text-muted);
  font-style: italic;
}
.performance-table :deep(.metric-delta) {
  display: block;
  font-size: 10.5px;
  font-style: normal;
  line-height: 1.2;
}
.performance-table :deep(.metric-delta--better) {
  color: #5fd3a5;
}
.performance-table :deep(.metric-delta--worse) {
  color: #f08f8f;
}
.performance-table :deep(.metric-delta--equal) {
  color: var(--text-muted);
}
.performance-table :deep(.metric-cell--summary) {
  font-weight: 600;
  color: var(--text-secondary);
}
.performance-table :deep(.summary-label) {
  font-weight: 700;
  color: var(--gold);
}
.performance-table :deep(.metric-cell--best) {
  color: #ffe08a;
  font-weight: 700;
  box-shadow: inset 0 0 0 1px rgba(227, 179, 65, 0.7);
}
.performance-table :deep(.stallion-link) {
  font-weight: 600;
  color: var(--text-primary);
}
.performance-table :deep(.stallion-link:hover) {
  color: var(--primary);
}
</style>
