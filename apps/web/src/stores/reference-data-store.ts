import type { RaceDistance, TerrainCondition } from '@pmu/shared';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { referenceDataApi } from '@/services/data-api';

/** Terrains and distances used by filters and forms across pages. */
export const useReferenceDataStore = defineStore('reference-data', () => {
  const terrainConditions = ref<TerrainCondition[]>([]);
  const distances = ref<RaceDistance[]>([]);

  const activeTerrainConditions = computed(() =>
    terrainConditions.value.filter((terrain) => terrain.isActive),
  );
  const activeDistances = computed(() => distances.value.filter((distance) => distance.isActive));

  async function refresh(): Promise<void> {
    const [terrains, raceDistances] = await Promise.all([
      referenceDataApi.terrainConditions(),
      referenceDataApi.distances(),
    ]);
    terrainConditions.value = terrains;
    distances.value = raceDistances;
  }

  return { terrainConditions, activeTerrainConditions, distances, activeDistances, refresh };
});
