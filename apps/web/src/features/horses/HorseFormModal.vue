<script setup lang="ts">
import { horseInputSchema, type Horse, type Stallion } from '@pmu/shared';
import { NButton, NForm, NFormItem, NInput, NModal, NSelect, NSpace } from 'naive-ui';
import { computed, ref, watch } from 'vue';
import { useFeedback } from '@/composables/use-confirmed-action';
import { useSchemaErrors } from '@/composables/use-schema-errors';
import { horsesApi, stallionsApi } from '@/services/data-api';

const props = defineProps<{
  horse: Horse | null;
  initialName?: string;
  initialStallionId?: number;
}>();
const show = defineModel<boolean>('show', { required: true });
const emit = defineEmits<{ saved: [horse: Horse] }>();

const form = ref<{ name: string; stallionId: number | null }>({ name: '', stallionId: null });
const stallions = ref<Stallion[]>([]);
const saving = ref(false);
const runWithFeedback = useFeedback();
const { errors, validate } = useSchemaErrors(horseInputSchema);

const stallionOptions = computed(() =>
  stallions.value.map((stallion) => ({ label: stallion.name, value: stallion.id })),
);

watch(show, async (visible) => {
  if (!visible) return;
  errors.value = {};
  form.value = props.horse
    ? { name: props.horse.name, stallionId: props.horse.stallionId }
    : { name: props.initialName ?? '', stallionId: props.initialStallionId ?? null };
  stallions.value = await stallionsApi.list();
});

async function submit(): Promise<void> {
  const data = validate(form.value);
  if (!data) return;
  saving.value = true;
  const target = props.horse;
  let saved: Horse | undefined;
  const succeeded = await runWithFeedback(
    async () => {
      saved = target ? await horsesApi.update(target.id, data) : await horsesApi.create(data);
    },
    target ? 'Cheval modifié.' : 'Cheval ajouté.',
  );
  saving.value = false;
  if (succeeded && saved) {
    show.value = false;
    emit('saved', saved);
  }
}
</script>

<template>
  <NModal
    v-model:show="show"
    preset="card"
    :title="horse ? `Modifier ${horse.name}` : 'Nouveau cheval'"
    class="form-modal"
    :mask-closable="false"
  >
    <NForm label-placement="top" @submit.prevent="submit">
      <NFormItem
        label="Nom du cheval"
        required
        :feedback="errors.name"
        :validation-status="errors.name ? 'error' : undefined"
      >
        <NInput v-model:value="form.name" placeholder="Nom du cheval" autofocus />
      </NFormItem>
      <NFormItem
        label="Père (étalon)"
        required
        :feedback="errors.stallionId"
        :validation-status="errors.stallionId ? 'error' : undefined"
      >
        <NSelect
          v-model:value="form.stallionId"
          :options="stallionOptions"
          filterable
          placeholder="Rechercher un étalon"
        />
      </NFormItem>
      <p v-if="stallions.length === 0" class="muted">
        Aucun étalon : créez d'abord l'étalon depuis la page Étalons.
      </p>
      <NSpace justify="end">
        <NButton @click="show = false">Annuler</NButton>
        <NButton type="primary" attr-type="submit" :loading="saving">Enregistrer</NButton>
      </NSpace>
    </NForm>
  </NModal>
</template>
