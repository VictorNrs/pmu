<script setup lang="ts">
import type { RaceDistance } from '@pmu/shared';
import {
  NButton,
  NCard,
  NDataTable,
  NInputNumber,
  NSpace,
  NSwitch,
  type DataTableColumns,
} from 'naive-ui';
import { h, onMounted, ref } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import { useConfirmedDeletion, useFeedback } from '@/composables/use-confirmed-action';
import { referenceDataApi } from '@/services/data-api';

const distances = ref<RaceDistance[]>([]);
const loading = ref(false);
const draft = ref<number | null>(null);
const runWithFeedback = useFeedback();
const confirmDeletion = useConfirmedDeletion();

async function load(): Promise<void> {
  loading.value = true;
  try {
    distances.value = await referenceDataApi.distances();
  } finally {
    loading.value = false;
  }
}

async function setActive(distance: RaceDistance, isActive: boolean): Promise<void> {
  await runWithFeedback(
    async () =>
      (distances.value = await referenceDataApi.setDistanceActive(
        distance.distanceMeters,
        isActive,
      )),
    isActive ? 'Distance activée.' : 'Distance désactivée.',
  );
}

async function add(): Promise<void> {
  const distanceMeters = draft.value;
  if (distanceMeters === null) return;
  const ok = await runWithFeedback(
    async () => (distances.value = await referenceDataApi.createDistance({ distanceMeters })),
    'Distance ajoutée.',
  );
  if (ok) draft.value = null;
}

function remove(distance: RaceDistance): void {
  confirmDeletion({
    title: `Supprimer ${distance.distanceMeters} m ?`,
    content:
      distance.raceCount > 0
        ? `Cette distance est utilisée par ${distance.raceCount} course(s) : la suppression sera refusée. Désactivez-la plutôt.`
        : 'Cette action est définitive.',
    successMessage: 'Distance supprimée.',
    action: () => referenceDataApi.removeDistance(distance.distanceMeters),
    onSuccess: load,
  });
}

const columns: DataTableColumns<RaceDistance> = [
  { title: 'Distance', key: 'distanceMeters', render: (row) => `${row.distanceMeters} m` },
  {
    title: 'Active',
    key: 'isActive',
    width: 80,
    render: (row) =>
      h(NSwitch, {
        value: row.isActive,
        size: 'small',
        onUpdateValue: (value: boolean) => setActive(row, value),
      }),
  },
  { title: 'Courses', key: 'raceCount', width: 90, align: 'right' },
  {
    title: '',
    key: 'actions',
    width: 56,
    render: (row) =>
      h(
        NButton,
        {
          quaternary: true,
          circle: true,
          size: 'small',
          type: 'error',
          title: 'Supprimer',
          onClick: () => remove(row),
        },
        { icon: () => h(AppIcon, { name: 'trash', size: 16 }) },
      ),
  },
];

onMounted(load);
</script>

<template>
  <NCard title="Distances" size="small">
    <p class="muted hint">
      Les distances actives forment les colonnes du tableau par distance et sont les seules
      proposées à la saisie d'une course.
    </p>
    <NDataTable
      :columns="columns"
      :data="distances"
      :loading="loading"
      size="small"
      :row-key="(row: RaceDistance) => row.distanceMeters"
    />
    <NSpace class="add" align="center">
      <NInputNumber
        v-model:value="draft"
        size="small"
        :min="400"
        :max="8000"
        :step="100"
        placeholder="Ex. 1800"
        class="distance"
        @keyup.enter="add"
      >
        <template #suffix>m</template>
      </NInputNumber>
      <NButton size="small" type="primary" :disabled="draft === null" @click="add">Ajouter</NButton>
    </NSpace>
  </NCard>
</template>

<style scoped>
.hint {
  margin-top: 0;
  font-size: 13px;
}
.add {
  margin-top: 12px;
}
.distance {
  width: 150px;
}
</style>
