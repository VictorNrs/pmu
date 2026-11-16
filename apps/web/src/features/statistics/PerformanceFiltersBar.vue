<script setup lang="ts">
import type { PerformanceDimension } from '@pmu/shared';
import {
  NButton,
  NCheckbox,
  NCheckboxGroup,
  NDatePicker,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
  NTooltip,
} from 'naive-ui';
import { computed } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import { useReferenceDataStore } from '@/stores/reference-data-store';
import { INDICATORS } from '@/utils/metric-format';
import { createDefaultFilterState, type PerformanceFilterState } from './performance-filter-state';

const props = defineProps<{ dimension: PerformanceDimension }>();
const state = defineModel<PerformanceFilterState>({ required: true });
const referenceData = useReferenceDataStore();

const terrainOptions = computed(() =>
  referenceData.terrainConditions.map((terrain) => ({
    label: terrain.isActive ? terrain.label : `${terrain.label} (inactif)`,
    value: terrain.id,
  })),
);
const distanceOptions = computed(() =>
  referenceData.distances.map((distance) => ({
    label: `${distance.distanceMeters} m (${distance.raceCount} course${distance.raceCount > 1 ? 's' : ''})`,
    value: distance.distanceMeters,
  })),
);
const highlightOptions = INDICATORS.filter((indicator) => indicator.key !== 'raceCount').map(
  (indicator) => ({ label: indicator.label, value: indicator.key }),
);
const columnsLabel = computed(() =>
  props.dimension === 'terrain' ? 'Terrains affichés' : 'Distances affichées',
);

function reset(): void {
  state.value = createDefaultFilterState();
}
</script>

<template>
  <div class="filters">
    <div class="filters__row">
      <NInput
        v-model:value="state.search"
        placeholder="Rechercher un étalon"
        clearable
        class="filters__search"
      >
        <template #prefix><AppIcon name="search" :size="16" /></template>
      </NInput>
      <NSelect
        v-if="dimension === 'terrain'"
        v-model:value="state.terrainConditionIds"
        :options="terrainOptions"
        multiple
        clearable
        max-tag-count="responsive"
        :placeholder="`${columnsLabel} : tous les terrains actifs`"
        class="filters__select"
      />
      <NSelect
        v-model:value="state.distances"
        :options="distanceOptions"
        multiple
        clearable
        max-tag-count="responsive"
        :placeholder="
          dimension === 'distance' ? `${columnsLabel} : toutes` : 'Restreindre à des distances'
        "
        class="filters__select"
      />
      <NSelect
        v-if="dimension === 'distance'"
        v-model:value="state.terrainConditionIds"
        :options="terrainOptions"
        multiple
        clearable
        max-tag-count="responsive"
        placeholder="Restreindre à des terrains"
        class="filters__select"
      />
      <NDatePicker
        v-model:value="state.period"
        type="daterange"
        clearable
        format="dd/MM/yyyy"
        start-placeholder="Du"
        end-placeholder="Au"
        class="filters__period"
      />
    </div>
    <div class="filters__row filters__row--secondary">
      <NCheckboxGroup v-model:value="state.indicatorKeys">
        <NSpace :size="14">
          <NCheckbox
            v-for="indicator in INDICATORS"
            :key="indicator.key"
            :value="indicator.key"
            :label="indicator.label"
          />
        </NSpace>
      </NCheckboxGroup>
      <div class="filters__group">
        <span class="filters__label">Mettre en évidence</span>
        <NSelect
          v-model:value="state.highlightKey"
          :options="highlightOptions"
          size="small"
          class="filters__highlight"
        />
        <NTooltip>
          <template #trigger>
            <span class="filters__label filters__label--help">à partir de</span>
          </template>
          Les cellules avec moins de courses sont grisées et jamais mises en évidence.
        </NTooltip>
        <NInputNumber
          v-model:value="state.minRaces"
          :min="1"
          :max="100"
          size="small"
          class="filters__min"
        >
          <template #suffix>courses</template>
        </NInputNumber>
      </div>
      <NCheckbox v-model:checked="state.hideStallionsWithoutRace"
        >Masquer les étalons sans course</NCheckbox
      >
      <NButton quaternary size="small" @click="reset">Réinitialiser</NButton>
    </div>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
}
.filters__row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
.filters__row--secondary {
  gap: 18px;
  font-size: 13px;
}
.filters__search {
  width: 240px;
}
.filters__select {
  width: 280px;
}
.filters__period {
  width: 260px;
}
.filters__group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.filters__label {
  color: var(--text-secondary);
  white-space: nowrap;
}
.filters__label--help {
  text-decoration: underline dotted;
  cursor: help;
}
.filters__highlight {
  width: 140px;
}
.filters__min {
  width: 130px;
}
@media (max-width: 768px) {
  .filters__search,
  .filters__select,
  .filters__period {
    width: 100%;
  }
}
</style>
