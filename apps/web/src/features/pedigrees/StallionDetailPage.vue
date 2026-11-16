<script setup lang="ts">
import type { Horse, Stallion } from '@pmu/shared';
import { NAlert, NButton, NCard, NGrid, NGi, NTag } from 'naive-ui';
import { computed, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import StatCard from '@/components/StatCard.vue';
import { horsesApi, stallionsApi } from '@/services/data-api';
import { statisticsApi } from '@/services/statistics-api';
import { formatAverage, formatCount, formatPercent } from '@/utils/metric-format';
import ConditionBreakdownTable from '@/features/statistics/ConditionBreakdownTable.vue';
import { emptyMatrix } from '@/features/statistics/empty-matrix';
import StallionFormModal from './StallionFormModal.vue';

const props = defineProps<{ stallionId: number }>();

const stallion = ref<Stallion | null>(null);
const horses = ref<Horse[]>([]);
const byTerrain = ref(emptyMatrix('terrain'));
const byDistance = ref(emptyMatrix('distance'));
const loading = ref(false);
const error = ref<string | null>(null);
const formVisible = ref(false);

const total = computed(() => byTerrain.value.rows[0]?.total ?? null);

async function load(): Promise<void> {
  loading.value = true;
  error.value = null;
  const stallionIds = [props.stallionId];
  try {
    [stallion.value, horses.value, byTerrain.value, byDistance.value] = await Promise.all([
      stallionsApi.get(props.stallionId),
      horsesApi.list({ stallionId: props.stallionId }),
      statisticsApi.performance({ dimension: 'terrain', stallionIds }),
      statisticsApi.performance({ dimension: 'distance', stallionIds }),
    ]);
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause);
  } finally {
    loading.value = false;
  }
}

watch(() => props.stallionId, load, { immediate: true });
</script>

<template>
  <section>
    <RouterLink :to="{ name: 'stallions' }" class="back">← Tous les étalons</RouterLink>
    <NAlert v-if="error" type="error" title="Chargement impossible">{{ error }}</NAlert>
    <template v-if="stallion">
      <header class="page-header">
        <div>
          <h1>{{ stallion.name }}</h1>
          <p>
            <NTag v-if="stallion.country" size="small" :bordered="false">{{
              stallion.country
            }}</NTag>
            <span v-if="stallion.birthYear" class="muted"> Né en {{ stallion.birthYear }}</span>
            <span v-if="stallion.notes" class="notes">{{ stallion.notes }}</span>
          </p>
        </div>
        <NButton @click="formVisible = true">Modifier</NButton>
      </header>

      <div class="card-grid block">
        <StatCard
          label="Courses"
          :value="formatCount(total?.raceCount ?? 0)"
          :hint="`${stallion.horseCount} descendant(s)`"
        />
        <StatCard
          label="Victoires"
          :value="formatCount(total?.winCount ?? 0)"
          :hint="formatPercent(total?.winRate ?? null)"
          accent="gold"
        />
        <StatCard
          label="Places (2e-3e)"
          :value="formatCount(total?.placeCount ?? 0)"
          :hint="formatPercent(total?.placeRate ?? null)"
          accent="primary"
        />
        <StatCard
          label="Rang moyen"
          :value="formatAverage(total?.averageFinishPosition ?? null)"
          hint="Plus bas = meilleur"
        />
      </div>

      <NGrid :cols="24" :x-gap="16" :y-gap="16" item-responsive responsive="screen">
        <NGi span="24 l:12">
          <NCard title="Par état du terrain" size="small">
            <ConditionBreakdownTable
              :matrix="byTerrain"
              :stallion-id="stallionId"
              :loading="loading"
            />
          </NCard>
        </NGi>
        <NGi span="24 l:12">
          <NCard title="Par distance" size="small">
            <ConditionBreakdownTable
              :matrix="byDistance"
              :stallion-id="stallionId"
              :loading="loading"
            />
          </NCard>
        </NGi>
        <NGi span="24">
          <NCard :title="`Descendants (${horses.length})`" size="small">
            <p v-if="horses.length === 0" class="muted">Aucun cheval enregistré pour cet étalon.</p>
            <div class="horses">
              <NTag v-for="horse in horses" :key="horse.id" :bordered="false" round>
                {{ horse.name }}
                <span class="muted">· {{ horse.participationCount }} course(s)</span>
              </NTag>
            </div>
          </NCard>
        </NGi>
      </NGrid>
      <StallionFormModal v-model:show="formVisible" :stallion="stallion" @saved="load" />
    </template>
  </section>
</template>

<style scoped>
.back {
  display: inline-block;
  color: var(--text-secondary);
  margin-bottom: 14px;
  font-size: 13px;
}
.back:hover {
  color: var(--primary);
}
.notes {
  display: block;
  margin-top: 8px;
  white-space: pre-line;
}
.block {
  margin-bottom: 16px;
}
.horses {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
