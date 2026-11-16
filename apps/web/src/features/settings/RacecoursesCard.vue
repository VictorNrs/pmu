<script setup lang="ts">
import type { Racecourse } from '@pmu/shared';
import { NButton, NCard, NDataTable, NInput, type DataTableColumns } from 'naive-ui';
import { h, onMounted, ref } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import { useConfirmedDeletion, useFeedback } from '@/composables/use-confirmed-action';
import { referenceDataApi } from '@/services/data-api';

const racecourses = ref<Racecourse[]>([]);
const loading = ref(false);
const runWithFeedback = useFeedback();
const confirmDeletion = useConfirmedDeletion();

async function load(): Promise<void> {
  loading.value = true;
  try {
    racecourses.value = await referenceDataApi.racecourses();
  } finally {
    loading.value = false;
  }
}

async function rename(racecourse: Racecourse): Promise<void> {
  const ok = await runWithFeedback(
    async () =>
      (racecourses.value = await referenceDataApi.renameRacecourse(racecourse.id, racecourse.name)),
    'Hippodrome renommé.',
  );
  if (!ok) await load();
}

function remove(racecourse: Racecourse): void {
  confirmDeletion({
    title: `Supprimer « ${racecourse.name} » ?`,
    content:
      racecourse.raceCount > 0
        ? `Cet hippodrome est utilisé par ${racecourse.raceCount} course(s) : la suppression sera refusée.`
        : 'Cette action est définitive.',
    successMessage: 'Hippodrome supprimé.',
    action: () => referenceDataApi.removeRacecourse(racecourse.id),
    onSuccess: load,
  });
}

const columns: DataTableColumns<Racecourse> = [
  {
    title: 'Hippodrome',
    key: 'name',
    render: (row) =>
      h(NInput, {
        value: row.name,
        size: 'small',
        onUpdateValue: (value: string) => (row.name = value),
        onBlur: () => rename(row),
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
  <NCard title="Hippodromes" size="small">
    <p class="muted hint">
      Créés automatiquement lors de la saisie d'une course. Renommez-les ici pour corriger une faute
      de frappe.
    </p>
    <NDataTable
      :columns="columns"
      :data="racecourses"
      :loading="loading"
      size="small"
      :row-key="(row: Racecourse) => row.id"
      :pagination="{ pageSize: 15 }"
    />
  </NCard>
</template>

<style scoped>
.hint {
  margin-top: 0;
  font-size: 13px;
}
</style>
