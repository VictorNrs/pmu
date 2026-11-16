<script setup lang="ts">
import type {
  PerformanceDimension,
  PerformanceMatrix,
  StallionRankingEntry,
  StallionTrend,
} from '@pmu/shared';
import {
  NCard,
  NEmpty,
  NGi,
  NGrid,
  NInputNumber,
  NRadioButton,
  NRadioGroup,
  NSelect,
} from 'naive-ui';
import { computed, onMounted, ref, watch } from 'vue';
import { statisticsApi } from '@/services/statistics-api';
import { getIndicator, type IndicatorKey } from '@/utils/metric-format';
import {
  assignStallionColors,
  buildComparisonOption,
  buildRankingOption,
  buildTrendOption,
} from './comparison-options';
import EChart from './EChart.vue';
import { buildHeatmapOption } from './heatmap-option';

const MAX_COMPARED = 8;
type ChartIndicator = Extract<IndicatorKey, 'winRate' | 'placeRate' | 'averageFinishPosition'>;

const dimension = ref<PerformanceDimension>('terrain');
const indicatorKey = ref<ChartIndicator>('winRate');
const minRaces = ref(3);
const selectedIds = ref<number[]>([]);
const matrix = ref<PerformanceMatrix>({ dimension: 'terrain', columns: [], rows: [] });
const ranking = ref<StallionRankingEntry[]>([]);
const trends = ref<StallionTrend[]>([]);

const indicator = computed(() => getIndicator(indicatorKey.value));
const indicatorOptions = [
  { label: '% Victoires', value: 'winRate' },
  { label: '% Places (2e-3e)', value: 'placeRate' },
  { label: 'Rang moyen', value: 'averageFinishPosition' },
];
const stallionOptions = computed(() =>
  matrix.value.rows.map((row) => ({
    label: `${row.stallionName} (${row.total.raceCount} c.)`,
    value: row.stallionId,
    disabled:
      !selectedIds.value.includes(row.stallionId) && selectedIds.value.length >= MAX_COMPARED,
  })),
);
const colors = computed(() => assignStallionColors(selectedIds.value));
const comparedMatrix = computed<PerformanceMatrix>(() => ({
  ...matrix.value,
  rows: selectedIds.value.flatMap((id) => matrix.value.rows.filter((row) => row.stallionId === id)),
}));
const heatmapMatrix = computed<PerformanceMatrix>(() => ({
  ...matrix.value,
  rows: matrix.value.rows.filter((row) => row.total.raceCount >= minRaces.value),
}));

async function loadMatrix(): Promise<void> {
  matrix.value = await statisticsApi.performance({ dimension: dimension.value });
  if (selectedIds.value.length === 0) {
    selectedIds.value = [...matrix.value.rows]
      .filter((row) => row.total.raceCount > 0)
      .sort((left, right) => right.total.raceCount - left.total.raceCount)
      .slice(0, 5)
      .map((row) => row.stallionId);
  }
}

async function loadRanking(): Promise<void> {
  ranking.value = await statisticsApi.rankings({
    metric: indicatorKey.value,
    minRaces: minRaces.value,
    limit: 15,
  });
}

async function loadTrends(): Promise<void> {
  trends.value = selectedIds.value.length
    ? await statisticsApi.trends({ stallionIds: selectedIds.value })
    : [];
}

watch(dimension, loadMatrix);
watch([indicatorKey, minRaces], loadRanking);
watch(selectedIds, loadTrends, { deep: true });
onMounted(async () => {
  await loadMatrix();
  await Promise.all([loadRanking(), loadTrends()]);
});
</script>

<template>
  <section>
    <header class="page-header">
      <div>
        <h1>Graphiques</h1>
        <p>
          Les valeurs viennent du même moteur statistique que les tableaux. Le nombre de courses est
          rappelé au survol de chaque élément.
        </p>
      </div>
    </header>

    <div class="controls">
      <NRadioGroup v-model:value="dimension">
        <NRadioButton value="terrain">Par terrain</NRadioButton>
        <NRadioButton value="distance">Par distance</NRadioButton>
      </NRadioGroup>
      <NSelect
        v-model:value="indicatorKey"
        :options="indicatorOptions"
        class="controls__indicator"
      />
      <NInputNumber v-model:value="minRaces" :min="1" :max="100" class="controls__min">
        <template #prefix>Min.</template>
        <template #suffix>courses</template>
      </NInputNumber>
      <NSelect
        v-model:value="selectedIds"
        :options="stallionOptions"
        multiple
        filterable
        max-tag-count="responsive"
        :placeholder="`Étalons à comparer (${MAX_COMPARED} max.)`"
        class="controls__stallions"
      />
    </div>

    <NGrid :cols="24" :x-gap="16" :y-gap="16" item-responsive responsive="screen">
      <NGi span="24 l:10">
        <NCard :title="`Classement — ${indicator.label}`" size="small">
          <p class="muted caption">
            Étalons ayant au moins {{ minRaces }} course(s), toutes conditions confondues.
          </p>
          <EChart
            v-if="ranking.length"
            :option="buildRankingOption(ranking, indicator)"
            :height="Math.max(220, ranking.length * 30)"
            :description="`Classement des étalons par ${indicator.label}`"
          />
          <NEmpty v-else description="Pas assez de données pour établir un classement." />
        </NCard>
      </NGi>
      <NGi span="24 l:14">
        <NCard
          :title="`Comparaison ${dimension === 'terrain' ? 'par terrain' : 'par distance'} — ${indicator.label}`"
          size="small"
        >
          <p class="muted caption">
            Les étalons sélectionnés, condition par condition. Barres estompées : moins de
            {{ minRaces }} course(s).
          </p>
          <EChart
            v-if="comparedMatrix.rows.length && matrix.columns.length"
            :option="buildComparisonOption(comparedMatrix, indicator, colors, minRaces)"
            :height="360"
            :description="'Comparaison des étalons sélectionnés'"
          />
          <NEmpty v-else description="Sélectionnez des étalons à comparer." />
        </NCard>
      </NGi>
      <NGi span="24">
        <NCard :title="`Carte de chaleur — ${indicator.label}`" size="small">
          <p class="muted caption">
            Tous les étalons ayant au moins {{ minRaces }} course(s). Une case vide signale un
            échantillon insuffisant.
          </p>
          <EChart
            v-if="heatmapMatrix.rows.length && matrix.columns.length"
            :option="buildHeatmapOption(heatmapMatrix, indicator, minRaces)"
            :height="Math.max(240, heatmapMatrix.rows.length * 34 + 90)"
            :description="'Carte de chaleur des performances'"
          />
          <NEmpty v-else description="Aucun étalon n'atteint le minimum de courses." />
        </NCard>
      </NGi>
      <NGi span="24">
        <NCard :title="`Évolution mensuelle — ${indicator.label}`" size="small">
          <p class="muted caption">
            Calculée mois par mois : les petits échantillons mensuels varient fortement.
          </p>
          <EChart
            v-if="trends.length"
            :option="buildTrendOption(trends, indicator, colors)"
            :height="320"
            :description="'Évolution mensuelle des étalons sélectionnés'"
          />
          <NEmpty v-else description="Aucune donnée temporelle pour la sélection." />
        </NCard>
      </NGi>
    </NGrid>
  </section>
</template>

<style scoped>
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 18px;
}
.controls__indicator {
  width: 180px;
}
.controls__min {
  width: 170px;
}
.controls__stallions {
  flex: 1 1 320px;
  max-width: 560px;
}
.caption {
  margin: -4px 0 8px;
  font-size: 12px;
}
</style>
