<script setup lang="ts">
import { raceInputSchema, type Horse, type RaceDetail, type Racecourse } from '@pmu/shared';
import {
  NAutoComplete,
  NButton,
  NDatePicker,
  NForm,
  NFormItem,
  NInputNumber,
  NModal,
  NSelect,
  NSpace,
} from 'naive-ui';
import { computed, ref, watch } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import { useFeedback } from '@/composables/use-confirmed-action';
import { useSchemaErrors } from '@/composables/use-schema-errors';
import HorseFormModal from '@/features/horses/HorseFormModal.vue';
import { horsesApi, racesApi, referenceDataApi } from '@/services/data-api';
import { useReferenceDataStore } from '@/stores/reference-data-store';
import { matchesSearch } from '@/utils/search';
import {
  createParticipationDraft,
  createRaceFormState,
  nextFinishPosition,
  toRaceInput,
  type ParticipationDraft,
  type RaceFormState,
} from './race-form-state';

const props = defineProps<{ race: RaceDetail | null }>();
const show = defineModel<boolean>('show', { required: true });
const emit = defineEmits<{ saved: [] }>();

const referenceData = useReferenceDataStore();
const form = ref<RaceFormState>(createRaceFormState(null, Date.now()));
const horses = ref<Horse[]>([]);
const racecourses = ref<Racecourse[]>([]);
const saving = ref(false);
const horseModal = ref<{ show: boolean; target: ParticipationDraft | null }>({
  show: false,
  target: null,
});
const runWithFeedback = useFeedback();
const { errors, validate } = useSchemaErrors(raceInputSchema);

const horseOptions = computed(() =>
  horses.value.map((horse) => ({
    label: `${horse.name} — ${horse.stallionName}`,
    value: horse.id,
  })),
);
const racecourseOptions = computed(() =>
  racecourses.value
    .filter((racecourse) => matchesSearch(racecourse.name, form.value.racecourseName))
    .map((racecourse) => racecourse.name),
);
const terrainOptions = computed(() =>
  referenceData.activeTerrainConditions.map((terrain) => ({
    label: terrain.label,
    value: terrain.id,
  })),
);
/** Active distances of the reference list, plus the current one when editing a race. */
const distanceOptions = computed(() =>
  referenceData.distances
    .filter(
      (distance) => distance.isActive || distance.distanceMeters === props.race?.distanceMeters,
    )
    .map((distance) => ({ label: `${distance.distanceMeters} m`, value: distance.distanceMeters })),
);

watch(show, async (visible) => {
  if (!visible) return;
  errors.value = {};
  form.value = createRaceFormState(props.race, Date.now());
  [horses.value, racecourses.value] = await Promise.all([
    horsesApi.list(),
    referenceDataApi.racecourses(),
    referenceData.refresh(),
  ]);
});

function addRow(): void {
  form.value.participations.push(
    createParticipationDraft(nextFinishPosition(form.value.participations)),
  );
}

function removeRow(uid: number): void {
  form.value.participations = form.value.participations.filter((entry) => entry.uid !== uid);
}

function createHorseFor(target: ParticipationDraft): void {
  horseModal.value = { show: true, target };
}

function onHorseCreated(horse: Horse): void {
  horses.value = [...horses.value, horse];
  if (horseModal.value.target) horseModal.value.target.horseId = horse.id;
}

function rowError(index: number): string | undefined {
  return (
    errors.value[`participations.${index}.horseId`] ??
    errors.value[`participations.${index}.finishPosition`]
  );
}

async function submit(): Promise<void> {
  const data = validate(toRaceInput(form.value));
  if (!data) return;
  saving.value = true;
  const target = props.race;
  const succeeded = await runWithFeedback(
    () => (target ? racesApi.update(target.id, data) : racesApi.create(data)),
    target ? 'Course modifiée.' : 'Course enregistrée.',
  );
  saving.value = false;
  if (succeeded) {
    show.value = false;
    emit('saved');
  }
}
</script>

<template>
  <NModal
    v-model:show="show"
    preset="card"
    :title="race ? 'Modifier la course' : 'Nouvelle course'"
    class="form-modal--wide"
    :mask-closable="false"
  >
    <NForm label-placement="top" @submit.prevent="submit">
      <div class="form-grid">
        <NFormItem
          label="Date"
          required
          :feedback="errors.raceDate"
          :validation-status="errors.raceDate ? 'error' : undefined"
        >
          <NDatePicker v-model:value="form.raceDate" type="date" format="dd/MM/yyyy" class="full" />
        </NFormItem>
        <NFormItem
          label="Hippodrome"
          required
          :feedback="errors.racecourseName"
          :validation-status="errors.racecourseName ? 'error' : undefined"
        >
          <NAutoComplete
            v-model:value="form.racecourseName"
            :options="racecourseOptions"
            placeholder="Ex. Longchamp"
            clearable
          />
        </NFormItem>
        <NFormItem
          label="Distance (m)"
          required
          :feedback="errors.distanceMeters"
          :validation-status="errors.distanceMeters ? 'error' : undefined"
        >
          <NSelect
            v-model:value="form.distanceMeters"
            :options="distanceOptions"
            placeholder="Choisir"
          />
        </NFormItem>
        <NFormItem
          label="État du terrain"
          required
          :feedback="errors.terrainConditionId"
          :validation-status="errors.terrainConditionId ? 'error' : undefined"
        >
          <NSelect
            v-model:value="form.terrainConditionId"
            :options="terrainOptions"
            placeholder="Choisir"
          />
        </NFormItem>
      </div>

      <div class="participations-header">
        <h3>Chevaux et classements</h3>
        <span class="muted"
          >Saisissez uniquement les chevaux suivis. Les ex-aequo sont autorisés.</span
        >
      </div>
      <p v-if="errors.participations" class="error-text">{{ errors.participations }}</p>
      <div v-for="(entry, index) in form.participations" :key="entry.uid" class="participation-row">
        <NSelect
          v-model:value="entry.horseId"
          :options="horseOptions"
          filterable
          clearable
          placeholder="Rechercher un cheval"
          class="participation-row__horse"
          :status="rowError(index) ? 'error' : undefined"
        />
        <NButton
          secondary
          size="small"
          title="Créer un nouveau cheval"
          @click="createHorseFor(entry)"
        >
          <template #icon><AppIcon name="plus" :size="14" /></template>
          Nouveau
        </NButton>
        <NInputNumber
          v-model:value="entry.finishPosition"
          :min="1"
          :max="40"
          placeholder="Rang"
          class="participation-row__position"
          :status="rowError(index) ? 'error' : undefined"
        >
          <template #prefix>Rang</template>
        </NInputNumber>
        <NButton
          quaternary
          circle
          type="error"
          title="Retirer"
          :disabled="form.participations.length === 1"
          @click="removeRow(entry.uid)"
        >
          <template #icon><AppIcon name="trash" :size="16" /></template>
        </NButton>
        <span v-if="rowError(index)" class="error-text participation-row__error">{{
          rowError(index)
        }}</span>
      </div>
      <NButton dashed block class="add-row" @click="addRow">
        <template #icon><AppIcon name="plus" /></template>
        Ajouter un cheval
      </NButton>

      <NSpace justify="end">
        <NButton @click="show = false">Annuler</NButton>
        <NButton type="primary" attr-type="submit" :loading="saving">Enregistrer la course</NButton>
      </NSpace>
    </NForm>
    <HorseFormModal v-model:show="horseModal.show" :horse="null" @saved="onHorseCreated" />
  </NModal>
</template>

<style scoped>
.full {
  width: 100%;
}
.participations-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
  margin: 8px 0 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}
.participations-header h3 {
  margin: 0;
  font-size: 15px;
}
.participations-header .muted {
  font-size: 12px;
}
.participation-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.participation-row__horse {
  flex: 1 1 280px;
}
.participation-row__position {
  width: 130px;
}
.participation-row__error {
  flex-basis: 100%;
}
.error-text {
  color: var(--danger);
  font-size: 12px;
  margin: 0;
}
.add-row {
  margin: 4px 0 20px;
}
</style>
