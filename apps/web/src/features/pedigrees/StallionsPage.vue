<script setup lang="ts">
import type { Stallion } from '@pmu/shared';
import { NButton, NDataTable, NInput, NSpace, type DataTableColumns } from 'naive-ui';
import { computed, h, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import { useConfirmedDeletion } from '@/composables/use-confirmed-action';
import { stallionsApi } from '@/services/data-api';
import { matchesSearch } from '@/utils/search';
import StallionFormModal from './StallionFormModal.vue';

const stallions = ref<Stallion[]>([]);
const loading = ref(false);
const search = ref('');
const formVisible = ref(false);
const editedStallion = ref<Stallion | null>(null);
const confirmDeletion = useConfirmedDeletion();

const filtered = computed(() =>
  stallions.value.filter((stallion) => matchesSearch(stallion.name, search.value)),
);

async function load(): Promise<void> {
  loading.value = true;
  try {
    stallions.value = await stallionsApi.list();
  } finally {
    loading.value = false;
  }
}

function openForm(stallion: Stallion | null): void {
  editedStallion.value = stallion;
  formVisible.value = true;
}

function remove(stallion: Stallion): void {
  confirmDeletion({
    title: `Supprimer ${stallion.name} ?`,
    content:
      stallion.horseCount > 0
        ? `Cet étalon a ${stallion.horseCount} descendant(s) : la suppression sera refusée tant qu'ils existent.`
        : 'Cette action est définitive.',
    successMessage: 'Étalon supprimé.',
    action: () => stallionsApi.remove(stallion.id),
    onSuccess: load,
  });
}

const columns: DataTableColumns<Stallion> = [
  {
    title: 'Nom',
    key: 'name',
    sorter: (left, right) => left.name.localeCompare(right.name, 'fr'),
    render: (row) =>
      h(
        RouterLink,
        { to: { name: 'stallion-detail', params: { id: row.id } }, class: 'link-strong' },
        () => row.name,
      ),
  },
  { title: 'Naissance', key: 'birthYear', width: 110, render: (row) => row.birthYear ?? '—' },
  { title: 'Pays', key: 'country', width: 90, render: (row) => row.country ?? '—' },
  { title: 'Descendants', key: 'horseCount', width: 120, align: 'right', sorter: 'default' },
  {
    title: 'Participations',
    key: 'participationCount',
    width: 130,
    align: 'right',
    sorter: 'default',
  },
  {
    title: '',
    key: 'actions',
    width: 110,
    align: 'right',
    render: (row) =>
      h(NSpace, { size: 4, justify: 'end' }, () => [
        h(
          NButton,
          {
            quaternary: true,
            circle: true,
            size: 'small',
            title: 'Modifier',
            onClick: () => openForm(row),
          },
          { icon: () => h(AppIcon, { name: 'edit', size: 16 }) },
        ),
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
      ]),
  },
];

onMounted(load);
</script>

<template>
  <section>
    <header class="page-header">
      <div>
        <h1>Étalons</h1>
        <p>
          Les pères des chevaux suivis. Chaque étalon apparaît automatiquement dans les tableaux
          comparatifs.
        </p>
      </div>
      <NButton type="primary" @click="openForm(null)">
        <template #icon><AppIcon name="plus" /></template>
        Ajouter un étalon
      </NButton>
    </header>
    <NInput v-model:value="search" placeholder="Rechercher un étalon" clearable class="search">
      <template #prefix><AppIcon name="search" :size="16" /></template>
    </NInput>
    <NDataTable
      :columns="columns"
      :data="filtered"
      :loading="loading"
      :row-key="(row: Stallion) => row.id"
      :pagination="{ pageSize: 25 }"
      size="small"
    />
    <StallionFormModal v-model:show="formVisible" :stallion="editedStallion" @saved="load" />
  </section>
</template>

<style scoped>
.search {
  max-width: 320px;
  margin-bottom: 14px;
}
:deep(.link-strong) {
  font-weight: 600;
}
:deep(.link-strong:hover) {
  color: var(--primary);
}
</style>
