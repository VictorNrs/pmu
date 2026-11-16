<script setup lang="ts">
import type { TerrainCondition } from '@pmu/shared';
import {
  NButton,
  NCard,
  NDataTable,
  NInput,
  NInputNumber,
  NSpace,
  NSwitch,
  type DataTableColumns,
} from 'naive-ui';
import { h, onMounted, ref } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import { useConfirmedDeletion, useFeedback } from '@/composables/use-confirmed-action';
import { referenceDataApi } from '@/services/data-api';

const terrains = ref<TerrainCondition[]>([]);
const loading = ref(false);
const draft = ref({ label: '', sortOrder: 80 });
const runWithFeedback = useFeedback();
const confirmDeletion = useConfirmedDeletion();

async function load(): Promise<void> {
  loading.value = true;
  try {
    terrains.value = await referenceDataApi.terrainConditions();
  } finally {
    loading.value = false;
  }
}

async function save(terrain: TerrainCondition): Promise<void> {
  const { id, label, sortOrder, isActive } = terrain;
  const ok = await runWithFeedback(
    async () =>
      (terrains.value = await referenceDataApi.updateTerrainCondition(id, {
        label,
        sortOrder,
        isActive,
      })),
    'Terrain mis à jour.',
  );
  if (!ok) await load();
}

async function add(): Promise<void> {
  const ok = await runWithFeedback(
    async () =>
      (terrains.value = await referenceDataApi.createTerrainCondition({
        ...draft.value,
        isActive: true,
      })),
    'Terrain ajouté.',
  );
  if (ok) draft.value = { label: '', sortOrder: draft.value.sortOrder + 10 };
}

function remove(terrain: TerrainCondition): void {
  confirmDeletion({
    title: `Supprimer « ${terrain.label} » ?`,
    content:
      terrain.raceCount > 0
        ? `Ce terrain est utilisé par ${terrain.raceCount} course(s) : la suppression sera refusée. Désactivez-le plutôt.`
        : 'Cette action est définitive.',
    successMessage: 'Terrain supprimé.',
    action: () => referenceDataApi.removeTerrainCondition(terrain.id),
    onSuccess: load,
  });
}

const columns: DataTableColumns<TerrainCondition> = [
  {
    title: 'Libellé',
    key: 'label',
    render: (row) =>
      h(NInput, {
        value: row.label,
        size: 'small',
        onUpdateValue: (value: string) => (row.label = value),
        onBlur: () => save(row),
      }),
  },
  {
    title: 'Ordre',
    key: 'sortOrder',
    width: 110,
    render: (row) =>
      h(NInputNumber, {
        value: row.sortOrder,
        size: 'small',
        min: 0,
        max: 1000,
        step: 10,
        onUpdateValue: (value: number | null) => (row.sortOrder = value ?? 0),
        onBlur: () => save(row),
      }),
  },
  {
    title: 'Actif',
    key: 'isActive',
    width: 80,
    render: (row) =>
      h(NSwitch, {
        value: row.isActive,
        size: 'small',
        onUpdateValue: (value: boolean) => {
          row.isActive = value;
          void save(row);
        },
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
  <NCard title="États du terrain" size="small">
    <p class="muted hint">
      Les terrains actifs forment les colonnes du tableau par terrain et sont proposés à la saisie.
      Un terrain désactivé reste visible dans les statistiques tant que des courses l'utilisent.
    </p>
    <NDataTable
      :columns="columns"
      :data="terrains"
      :loading="loading"
      size="small"
      :row-key="(row: TerrainCondition) => row.id"
    />
    <NSpace class="add" align="center">
      <NInput
        v-model:value="draft.label"
        placeholder="Nouveau terrain (ex. Collant)"
        size="small"
        @keyup.enter="add"
      />
      <NInputNumber
        v-model:value="draft.sortOrder"
        size="small"
        :min="0"
        :max="1000"
        :step="10"
        class="order"
      >
        <template #prefix>Ordre</template>
      </NInputNumber>
      <NButton size="small" type="primary" :disabled="!draft.label.trim()" @click="add"
        >Ajouter</NButton
      >
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
.order {
  width: 140px;
}
</style>
