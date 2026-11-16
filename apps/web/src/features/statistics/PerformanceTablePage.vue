<script setup lang="ts">
import type {
  PerformanceColumn,
  PerformanceDimension,
  PerformanceFilters,
  PerformanceMatrix,
  PerformanceMetrics,
  StallionPerformanceRow,
} from '@pmu/shared';
import { NAlert } from 'naive-ui';
import { computed, onMounted, ref, watch } from 'vue';
import { statisticsApi } from '@/services/statistics-api';
import { useReferenceDataStore } from '@/stores/reference-data-store';
import { getIndicator, INDICATORS } from '@/utils/metric-format';
import { matchesSearch } from '@/utils/search';
import { emptyMatrix } from './empty-matrix';
import ParticipationsDrawer from './ParticipationsDrawer.vue';
import PerformanceFiltersBar from './PerformanceFiltersBar.vue';
import PerformanceMatrixTable from './PerformanceMatrixTable.vue';
import {
  cellFilters,
  createDefaultFilterState,
  toPerformanceFilters,
} from './performance-filter-state';

const props = defineProps<{ dimension: PerformanceDimension }>();

const COPY = {
  terrain: {
    title: 'Performances par état du terrain',
    description:
      'Chaque ligne est un étalon, chaque colonne un état du terrain. Cliquez sur une cellule pour voir les courses qui la composent.',
  },
  distance: {
    title: 'Performances par distance',
    description:
      'Chaque ligne est un étalon, chaque colonne une distance de course. Cliquez sur une cellule pour voir les courses qui la composent.',
  },
} as const;

const referenceData = useReferenceDataStore();
const state = ref(createDefaultFilterState());
const matrix = ref<PerformanceMatrix>(emptyMatrix(props.dimension));
const loading = ref(false);
const error = ref<string | null>(null);

const filters = computed(() => toPerformanceFilters(state.value));
const indicators = computed(() =>
  INDICATORS.filter((indicator) => state.value.indicatorKeys.includes(indicator.key)),
);
const highlight = computed(() => getIndicator(state.value.highlightKey));
const visibleRows = computed(() =>
  matrix.value.rows.filter(
    (row) =>
      matchesSearch(row.stallionName, state.value.search) &&
      (!state.value.hideStallionsWithoutRace || row.total.raceCount > 0),
  ),
);
const totalRaces = computed(() =>
  visibleRows.value.reduce((sum, row) => sum + row.total.raceCount, 0),
);

async function load(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    matrix.value = await statisticsApi.performance({
      dimension: props.dimension,
      ...filters.value,
    });
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause);
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.dimension,
  () => (state.value = createDefaultFilterState()),
);
watch([() => props.dimension, () => JSON.stringify(filters.value)], load);
onMounted(async () => {
  await Promise.all([load(), referenceData.refresh()]);
});

const drawer = ref({
  show: false,
  title: '',
  subtitle: '',
  filters: null as PerformanceFilters | null,
  metrics: null as PerformanceMetrics | null,
});

function openCell(row: StallionPerformanceRow, column: PerformanceColumn | null): void {
  const metrics = column ? (row.cells[column.key] ?? null) : row.total;
  drawer.value = {
    show: true,
    title: row.stallionName,
    subtitle: column ? column.label : 'Toutes conditions de la sélection',
    filters: cellFilters(filters.value, props.dimension, row.stallionId, column?.key ?? null),
    metrics,
  };
}
</script>

<template>
  <section>
    <header class="page-header">
      <div>
        <h1>{{ COPY[dimension].title }}</h1>
        <p>{{ COPY[dimension].description }}</p>
      </div>
      <div class="summary tabular">
        <span
          ><strong>{{ visibleRows.length }}</strong> étalon(s)</span
        >
        <span
          ><strong>{{ totalRaces }}</strong> participation(s)</span
        >
      </div>
    </header>

    <PerformanceFiltersBar v-model="state" :dimension="dimension" />

    <NAlert v-if="error" type="error" title="Chargement impossible" class="block">{{
      error
    }}</NAlert>

    <div class="legend">
      <span
        ><i class="legend__swatch legend__swatch--heat" /> Intensité relative au meilleur
        {{ highlight.label.toLowerCase() }} de la colonne</span
      >
      <span><i class="legend__swatch legend__swatch--best" /> Meilleure valeur de la colonne</span>
      <span class="legend__low">Italique grisé : moins de {{ state.minRaces }} course(s)</span>
      <span>— : aucune course</span>
    </div>

    <PerformanceMatrixTable
      :matrix="matrix"
      :rows="visibleRows"
      :indicators="indicators"
      :highlight="highlight"
      :min-races="state.minRaces"
      :show-average-delta="state.showAverageDelta"
      :loading="loading"
      @cell-click="openCell"
    />

    <ParticipationsDrawer
      v-model:show="drawer.show"
      :title="drawer.title"
      :subtitle="drawer.subtitle"
      :filters="drawer.filters"
      :metrics="drawer.metrics"
    />
  </section>
</template>

<style scoped>
.summary {
  display: flex;
  gap: 18px;
  color: var(--text-secondary);
}
.summary strong {
  color: var(--text-primary);
  font-size: 18px;
}
.block {
  margin-bottom: 16px;
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 10px;
}
.legend__swatch {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  vertical-align: -2px;
  margin-right: 4px;
}
.legend__swatch--heat {
  background: linear-gradient(90deg, rgba(63, 182, 139, 0.08), rgba(63, 182, 139, 0.42));
}
.legend__swatch--best {
  box-shadow: inset 0 0 0 1px rgba(227, 179, 65, 0.9);
}
.legend__low {
  font-style: italic;
}
</style>
