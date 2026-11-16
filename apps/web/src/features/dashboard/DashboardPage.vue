<script setup lang="ts">
import type { RaceSummary, StallionRankingEntry, StatisticsOverview } from '@pmu/shared';
import { NButton, NCard, NGi, NGrid, NSteps, NStep, NTag } from 'naive-ui';
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import StatCard from '@/components/StatCard.vue';
import { racesApi } from '@/services/data-api';
import { statisticsApi } from '@/services/statistics-api';
import {
  formatAverage,
  formatCount,
  formatDate,
  formatPercent,
  getIndicator,
} from '@/utils/metric-format';

const RANKING_MIN_RACES = 3;
const overview = ref<StatisticsOverview | null>(null);
const byWinRate = ref<StallionRankingEntry[]>([]);
const byAverage = ref<StallionRankingEntry[]>([]);
const recentRaces = ref<RaceSummary[]>([]);

const isEmpty = computed(() => overview.value !== null && overview.value.participationCount === 0);
const onboardingStep = computed(() => {
  if (!overview.value) return 1;
  if (overview.value.stallionCount === 0) return 1;
  return overview.value.horseCount === 0 ? 2 : 3;
});
const rankings = computed(() => [
  {
    title: 'Meilleurs % de victoires',
    entries: byWinRate.value,
    indicator: getIndicator('winRate'),
  },
  {
    title: 'Meilleurs rangs moyens',
    entries: byAverage.value,
    indicator: getIndicator('averageFinishPosition'),
  },
]);

onMounted(async () => {
  const [stats, wins, averages, races] = await Promise.all([
    statisticsApi.overview(),
    statisticsApi.rankings({ metric: 'winRate', minRaces: RANKING_MIN_RACES, limit: 5 }),
    statisticsApi.rankings({
      metric: 'averageFinishPosition',
      minRaces: RANKING_MIN_RACES,
      limit: 5,
    }),
    racesApi.list({ limit: 6 }),
  ]);
  overview.value = stats;
  byWinRate.value = wins;
  byAverage.value = averages;
  recentRaces.value = races.items;
});
</script>

<template>
  <section>
    <header class="page-header">
      <div>
        <h1>Tableau de bord</h1>
        <p>
          Vue d'ensemble des données saisies
          <template v-if="overview?.firstRaceDate">
            — courses du {{ formatDate(overview.firstRaceDate) }} au
            {{ formatDate(overview.lastRaceDate) }}
          </template>
        </p>
      </div>
      <RouterLink :to="{ name: 'races' }"
        ><NButton type="primary">Saisir une course</NButton></RouterLink
      >
    </header>

    <NCard v-if="isEmpty" title="Bien démarrer" size="small" class="block">
      <NSteps :current="onboardingStep" vertical>
        <NStep
          title="Ajouter les étalons"
          description="Les pères dont vous suivez les descendants."
        >
          <RouterLink :to="{ name: 'stallions' }" class="step-link"
            >Ouvrir la page Étalons →</RouterLink
          >
        </NStep>
        <NStep
          title="Ajouter les chevaux"
          description="Chaque cheval est rattaché à son père. Vous pouvez aussi les créer pendant la saisie d'une course."
        >
          <RouterLink :to="{ name: 'horses' }" class="step-link"
            >Ouvrir la page Chevaux →</RouterLink
          >
        </NStep>
        <NStep
          title="Saisir les courses"
          description="Date, hippodrome, distance, terrain et classement : les statistiques se calculent automatiquement."
        >
          <RouterLink :to="{ name: 'races' }" class="step-link"
            >Ouvrir la page Courses →</RouterLink
          >
        </NStep>
      </NSteps>
    </NCard>

    <div v-if="overview" class="card-grid block">
      <StatCard
        label="Étalons"
        :value="formatCount(overview.stallionCount)"
        :hint="`${overview.horseCount} cheval(aux) suivi(s)`"
      />
      <StatCard
        label="Courses saisies"
        :value="formatCount(overview.raceCount)"
        :hint="`${overview.participationCount} participation(s)`"
      />
      <StatCard
        label="% Victoires"
        :value="formatPercent(overview.global.winRate)"
        :hint="`${overview.global.winCount} victoire(s)`"
        accent="gold"
      />
      <StatCard
        label="% Places (2e-3e)"
        :value="formatPercent(overview.global.placeRate)"
        :hint="`${overview.global.placeCount} place(s)`"
        accent="primary"
      />
      <StatCard
        label="Rang moyen"
        :value="formatAverage(overview.global.averageFinishPosition)"
        hint="Tous chevaux suivis"
      />
    </div>

    <NGrid :cols="24" :x-gap="16" :y-gap="16" item-responsive responsive="screen">
      <NGi v-for="ranking in rankings" :key="ranking.title" span="24 m:12 l:8">
        <NCard :title="ranking.title" size="small">
          <template #header-extra
            ><span class="muted small">≥ {{ RANKING_MIN_RACES }} courses</span></template
          >
          <ol v-if="ranking.entries.length" class="ranking">
            <li v-for="entry in ranking.entries" :key="entry.stallionId">
              <span class="ranking__rank tabular">{{ entry.rank }}</span>
              <RouterLink
                :to="{ name: 'stallion-detail', params: { id: entry.stallionId } }"
                class="ranking__name"
                >{{ entry.stallionName }}</RouterLink
              >
              <span class="ranking__value tabular">{{
                ranking.indicator.format(entry.metrics[ranking.indicator.key])
              }}</span>
              <span class="muted small tabular">{{ entry.metrics.raceCount }} c.</span>
            </li>
          </ol>
          <p v-else class="muted">Pas encore assez de courses.</p>
        </NCard>
      </NGi>
      <NGi span="24 l:8">
        <NCard title="Dernières courses" size="small">
          <template #header-extra
            ><RouterLink :to="{ name: 'races' }" class="small step-link"
              >Tout voir</RouterLink
            ></template
          >
          <ul v-if="recentRaces.length" class="recent">
            <li v-for="race in recentRaces" :key="race.id">
              <span class="tabular muted">{{ formatDate(race.raceDate) }}</span>
              <span class="recent__name">{{ race.racecourseName }}</span>
              <NTag size="tiny" :bordered="false">{{ race.distanceMeters }} m</NTag>
              <NTag size="tiny" :bordered="false">{{ race.terrainConditionLabel }}</NTag>
            </li>
          </ul>
          <p v-else class="muted">Aucune course saisie.</p>
        </NCard>
      </NGi>
    </NGrid>
  </section>
</template>

<style scoped>
.block {
  margin-bottom: 16px;
}
.small {
  font-size: 12px;
}
.step-link {
  color: var(--primary);
  font-size: 13px;
}
.ranking,
.recent {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ranking li {
  display: grid;
  grid-template-columns: 22px 1fr auto 44px;
  align-items: center;
  gap: 8px;
}
.ranking__rank {
  color: var(--text-muted);
}
.ranking__name {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ranking__name:hover {
  color: var(--primary);
}
.ranking__value {
  font-weight: 600;
  color: var(--gold);
}
.recent li {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.recent__name {
  flex: 1;
  font-weight: 500;
}
</style>
