<script setup lang="ts">
import type { RaceDetail, RaceSummary } from '@pmu/shared';
import {
  NButton,
  NDataTable,
  NDatePicker,
  NSelect,
  NSpace,
  NTag,
  type DataTableColumns,
  type PaginationProps,
} from 'naive-ui';
import { computed, h, onMounted, reactive, ref, watch } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import { useConfirmedDeletion } from '@/composables/use-confirmed-action';
import { racesApi } from '@/services/data-api';
import { useReferenceDataStore } from '@/stores/reference-data-store';
import { timestampToIsoDate } from '@/utils/date';
import { formatDate } from '@/utils/metric-format';
import RaceFormModal from './RaceFormModal.vue';
import RaceParticipationsList from './RaceParticipationsList.vue';

const PAGE_SIZE = 25;
const referenceData = useReferenceDataStore();
const confirmDeletion = useConfirmedDeletion();

const races = ref<RaceSummary[]>([]);
const total = ref(0);
const loading = ref(false);
const page = ref(1);
const filters = reactive({
  period: null as [number, number] | null,
  terrainConditionId: null as number | null,
  distanceMeters: null as number | null,
});
const form = ref<{ show: boolean; race: RaceDetail | null }>({ show: false, race: null });

const terrainOptions = computed(() =>
  referenceData.terrainConditions.map((terrain) => ({ label: terrain.label, value: terrain.id })),
);
const distanceOptions = computed(() =>
  referenceData.distances.map((distance) => ({
    label: `${distance.distanceMeters} m`,
    value: distance.distanceMeters,
  })),
);
const pagination = computed<PaginationProps>(() => ({
  page: page.value,
  pageSize: PAGE_SIZE,
  itemCount: total.value,
  prefix: ({ itemCount }) => `${itemCount ?? 0} course(s)`,
}));

async function load(): Promise<void> {
  loading.value = true;
  try {
    const result = await racesApi.list({
      from: filters.period ? timestampToIsoDate(filters.period[0]) : undefined,
      to: filters.period ? timestampToIsoDate(filters.period[1]) : undefined,
      terrainConditionId: filters.terrainConditionId ?? undefined,
      distanceMeters: filters.distanceMeters ?? undefined,
      limit: PAGE_SIZE,
      offset: (page.value - 1) * PAGE_SIZE,
    });
    races.value = result.items;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}

async function refreshAll(): Promise<void> {
  await Promise.all([load(), referenceData.refresh()]);
}

async function openForm(race: RaceSummary | null): Promise<void> {
  form.value = { show: true, race: race ? await racesApi.get(race.id) : null };
}

function remove(race: RaceSummary): void {
  confirmDeletion({
    title: 'Supprimer cette course ?',
    content: `${race.racecourseName}, ${formatDate(race.raceDate)} : ${race.participationCount} résultat(s) seront supprimés et les statistiques recalculées.`,
    successMessage: 'Course supprimée.',
    action: () => racesApi.remove(race.id),
    onSuccess: refreshAll,
  });
}

const columns: DataTableColumns<RaceSummary> = [
  {
    type: 'expand',
    renderExpand: (row) => h(RaceParticipationsList, { raceId: row.id }),
  },
  { title: 'Date', key: 'raceDate', width: 110, render: (row) => formatDate(row.raceDate) },
  { title: 'Hippodrome', key: 'racecourseName' },
  {
    title: 'Distance',
    key: 'distanceMeters',
    width: 110,
    align: 'right',
    render: (row) => `${row.distanceMeters} m`,
  },
  {
    title: 'Terrain',
    key: 'terrainConditionLabel',
    width: 140,
    render: (row) => h(NTag, { size: 'small', bordered: false }, () => row.terrainConditionLabel),
  },
  { title: 'Chevaux saisis', key: 'participationCount', width: 130, align: 'right' },
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

watch(filters, () => {
  page.value = 1;
  void load();
});
watch(page, load);
onMounted(refreshAll);
</script>

<template>
  <section>
    <header class="page-header">
      <div>
        <h1>Courses & résultats</h1>
        <p>
          Saisissez une course et le classement des chevaux suivis : les statistiques sont
          recalculées automatiquement.
        </p>
      </div>
      <NButton type="primary" @click="openForm(null)">
        <template #icon><AppIcon name="plus" /></template>
        Saisir une course
      </NButton>
    </header>
    <div class="toolbar">
      <NDatePicker
        v-model:value="filters.period"
        type="daterange"
        clearable
        format="dd/MM/yyyy"
        start-placeholder="Du"
        end-placeholder="Au"
      />
      <NSelect
        v-model:value="filters.terrainConditionId"
        :options="terrainOptions"
        clearable
        placeholder="Tous terrains"
        class="toolbar__select"
      />
      <NSelect
        v-model:value="filters.distanceMeters"
        :options="distanceOptions"
        clearable
        placeholder="Toutes distances"
        class="toolbar__select"
      />
    </div>
    <NDataTable
      remote
      :columns="columns"
      :data="races"
      :loading="loading"
      :pagination="pagination"
      :row-key="(row: RaceSummary) => row.id"
      size="small"
      @update:page="(value: number) => (page = value)"
    />
    <RaceFormModal v-model:show="form.show" :race="form.race" @saved="refreshAll" />
  </section>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}
.toolbar__select {
  width: 200px;
}
</style>
