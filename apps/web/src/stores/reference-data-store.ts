import type { DistanceUsage, TerrainCondition } from '@pmu/shared';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { racesApi, referenceDataApi } from '@/services/data-api';

/** Terrains and distances used by filters and forms across pages. */
export const useReferenceDataStore = defineStore('reference-data', () => {
  const terrainConditions = ref<TerrainCondition[]>([]);
  const distances = ref<DistanceUsage[]>([]);

  const activeTerrainConditions = computed(() =>
    terrainConditions.value.filter((terrain) => terrain.isActive),
  );

  async function refresh(): Promise<void> {
    const [terrains, usedDistances] = await Promise.all([
      referenceDataApi.terrainConditions(),
      racesApi.distances(),
    ]);
    terrainConditions.value = terrains;
    distances.value = usedDistances;
  }

  return { terrainConditions, activeTerrainConditions, distances, refresh };
});
