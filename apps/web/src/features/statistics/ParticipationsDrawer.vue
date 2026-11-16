<script setup lang="ts">
import type {
  Page,
  ParticipationDetail,
  PerformanceFilters,
  PerformanceMetrics,
} from '@pmu/shared';
import { NDataTable, NDrawer, NDrawerContent, NTag, type DataTableColumns } from 'naive-ui';
import { h, ref, watch } from 'vue';
import { participationsApi } from '@/services/data-api';
import { formatDate, INDICATORS } from '@/utils/metric-format';

const props = defineProps<{
  title: string;
  subtitle: string;
  filters: PerformanceFilters | null;
  metrics: PerformanceMetrics | null;
}>();
const show = defineModel<boolean>('show', { required: true });

const page = ref<Page<ParticipationDetail>>({ items: [], total: 0 });
const loading = ref(false);
const error = ref<string | null>(null);

watch(
  () => [show.value, props.filters] as const,
  async ([visible, filters]) => {
    if (!visible || !filters) return;
    loading.value = true;
    error.value = null;
    try {
      page.value = await participationsApi.list({ ...filters, limit: 500 });
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : String(cause);
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);

function positionType(position: number): 'warning' | 'success' | 'default' {
  if (position === 1) return 'warning';
  return position <= 3 ? 'success' : 'default';
}

const columns: DataTableColumns<ParticipationDetail> = [
  { title: 'Date', key: 'raceDate', width: 96, render: (row) => formatDate(row.raceDate) },
  { title: 'Hippodrome', key: 'racecourseName', ellipsis: { tooltip: true } },
  { title: 'Cheval', key: 'horseName', ellipsis: { tooltip: true } },
  { title: 'Terrain', key: 'terrainConditionLabel', width: 100 },
  {
    title: 'Dist.',
    key: 'distanceMeters',
    width: 70,
    align: 'right',
    render: (row) => `${row.distanceMeters} m`,
  },
  {
    title: 'Rang',
    key: 'finishPosition',
    width: 64,
    align: 'center',
    render: (row) =>
      h(
        NTag,
        { size: 'small', round: true, bordered: false, type: positionType(row.finishPosition) },
        () => `${row.finishPosition}`,
      ),
  },
];
</script>

<template>
  <NDrawer v-model:show="show" :width="720" placement="right" :auto-focus="false">
    <NDrawerContent closable :native-scrollbar="false">
      <template #header>
        <div>{{ title }}</div>
        <div class="drawer-subtitle">{{ subtitle }}</div>
      </template>
      <div v-if="metrics" class="drawer-metrics">
        <div v-for="indicator in INDICATORS" :key="indicator.key" class="drawer-metric">
          <span class="drawer-metric__label">{{ indicator.label }}</span>
          <span class="drawer-metric__value tabular">{{
            indicator.format(metrics[indicator.key])
          }}</span>
        </div>
      </div>
      <p class="muted">
        {{ page.total }} participation(s) à l'origine de cette statistique{{
          page.total > page.items.length ? ` — ${page.items.length} affichées` : ''
        }}.
      </p>
      <p v-if="error" class="drawer-error">{{ error }}</p>
      <NDataTable
        :columns="columns"
        :data="page.items"
        :loading="loading"
        size="small"
        :max-height="'calc(100vh - 300px)'"
        :row-key="(row: ParticipationDetail) => row.id"
      />
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped>
.drawer-subtitle {
  font-size: 13px;
  font-weight: 400;
  color: var(--text-secondary);
  margin-top: 4px;
}
.drawer-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 8px;
  margin-bottom: 16px;
}
.drawer-metric {
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.drawer-metric__label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.drawer-metric__value {
  font-size: 17px;
  font-weight: 600;
}
.drawer-error {
  color: var(--danger);
}
</style>
