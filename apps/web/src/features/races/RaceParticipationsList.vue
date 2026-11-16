<script setup lang="ts">
import type { RaceDetail } from '@pmu/shared';
import { NSpin, NTag } from 'naive-ui';
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { racesApi } from '@/services/data-api';

const props = defineProps<{ raceId: number }>();
const race = ref<RaceDetail | null>(null);

onMounted(async () => {
  race.value = await racesApi.get(props.raceId);
});

function positionType(position: number): 'warning' | 'success' | 'default' {
  if (position === 1) return 'warning';
  return position <= 3 ? 'success' : 'default';
}
</script>

<template>
  <NSpin v-if="!race" size="small" />
  <ol v-else class="results">
    <li v-for="entry in race.participations" :key="entry.id" class="results__item">
      <NTag
        size="small"
        round
        :bordered="false"
        :type="positionType(entry.finishPosition)"
        class="tabular"
      >
        {{ entry.finishPosition }}
      </NTag>
      <span class="results__horse">{{ entry.horseName }}</span>
      <RouterLink
        :to="{ name: 'stallion-detail', params: { id: entry.stallionId } }"
        class="muted results__sire"
      >
        par {{ entry.stallionName }}
      </RouterLink>
    </li>
  </ol>
</template>

<style scoped>
.results {
  list-style: none;
  margin: 0;
  padding: 4px 0 4px 8px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 6px 18px;
}
.results__item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.results__horse {
  font-weight: 600;
}
.results__sire:hover {
  color: var(--primary);
}
</style>
