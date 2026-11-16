<script setup lang="ts">
import type { Horse } from '@pmu/shared';
import { NButton, NDataTable, NInput, NSpace, type DataTableColumns } from 'naive-ui';
import { computed, h, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import { useConfirmedDeletion } from '@/composables/use-confirmed-action';
import { horsesApi } from '@/services/data-api';
import { matchesSearch } from '@/utils/search';
import HorseFormModal from './HorseFormModal.vue';

const horses = ref<Horse[]>([]);
const loading = ref(false);
const search = ref('');
const formVisible = ref(false);
const editedHorse = ref<Horse | null>(null);
const confirmDeletion = useConfirmedDeletion();

const filtered = computed(() =>
  horses.value.filter(
    (horse) =>
      matchesSearch(horse.name, search.value) || matchesSearch(horse.stallionName, search.value),
  ),
);

async function load(): Promise<void> {
  loading.value = true;
  try {
    horses.value = await horsesApi.list();
  } finally {
    loading.value = false;
  }
}

function openForm(horse: Horse | null): void {
  editedHorse.value = horse;
  formVisible.value = true;
}

function remove(horse: Horse): void {
  confirmDeletion({
    title: `Supprimer ${horse.name} ?`,
    content:
      horse.participationCount > 0
        ? `Ce cheval a ${horse.participationCount} résultat(s) : supprimez d'abord ses résultats depuis la page Courses.`
        : 'Cette action est définitive.',
    successMessage: 'Cheval supprimé.',
    action: () => horsesApi.remove(horse.id),
    onSuccess: load,
  });
}

const columns: DataTableColumns<Horse> = [
  {
    title: 'Cheval',
    key: 'name',
    sorter: (left, right) => left.name.localeCompare(right.name, 'fr'),
  },
  {
    title: 'Père',
    key: 'stallionName',
    sorter: (left, right) => left.stallionName.localeCompare(right.stallionName, 'fr'),
    render: (row) =>
      h(
        RouterLink,
        { to: { name: 'stallion-detail', params: { id: row.stallionId } }, class: 'link' },
        () => row.stallionName,
      ),
  },
  {
    title: 'Participations',
    key: 'participationCount',
    width: 140,
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
        <h1>Chevaux</h1>
        <p>
          Chaque cheval est rattaché à son père. Ses résultats alimentent les statistiques de
          l'étalon.
        </p>
      </div>
      <NButton type="primary" @click="openForm(null)">
        <template #icon><AppIcon name="plus" /></template>
        Ajouter un cheval
      </NButton>
    </header>
    <NInput
      v-model:value="search"
      placeholder="Rechercher un cheval ou un père"
      clearable
      class="search"
    >
      <template #prefix><AppIcon name="search" :size="16" /></template>
    </NInput>
    <NDataTable
      :columns="columns"
      :data="filtered"
      :loading="loading"
      :row-key="(row: Horse) => row.id"
      :pagination="{ pageSize: 25 }"
      size="small"
    />
    <HorseFormModal v-model:show="formVisible" :horse="editedHorse" @saved="load" />
  </section>
</template>

<style scoped>
.search {
  max-width: 320px;
  margin-bottom: 14px;
}
:deep(.link:hover) {
  color: var(--primary);
}
</style>
