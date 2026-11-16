<script setup lang="ts">
import { stallionInputSchema, type Stallion, type StallionInput } from '@pmu/shared';
import { NButton, NForm, NFormItem, NInput, NInputNumber, NModal, NSpace } from 'naive-ui';
import { ref, watch } from 'vue';
import { useFeedback } from '@/composables/use-confirmed-action';
import { stallionsApi } from '@/services/data-api';
import { useSchemaErrors } from '@/composables/use-schema-errors';

const props = defineProps<{ stallion: Stallion | null }>();
const show = defineModel<boolean>('show', { required: true });
const emit = defineEmits<{ saved: [] }>();

const form = ref<StallionInput>({ name: '' });
const saving = ref(false);
const runWithFeedback = useFeedback();
const { errors, validate } = useSchemaErrors(stallionInputSchema);

watch(show, (visible) => {
  if (!visible) return;
  errors.value = {};
  form.value = props.stallion
    ? {
        name: props.stallion.name,
        birthYear: props.stallion.birthYear,
        country: props.stallion.country,
        notes: props.stallion.notes,
      }
    : { name: '', birthYear: null, country: null, notes: null };
});

async function submit(): Promise<void> {
  const data = validate(form.value);
  if (!data) return;
  saving.value = true;
  const target = props.stallion;
  const succeeded = await runWithFeedback(
    () => (target ? stallionsApi.update(target.id, data) : stallionsApi.create(data)),
    target ? 'Étalon modifié.' : 'Étalon ajouté.',
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
    :title="stallion ? `Modifier ${stallion.name}` : 'Nouvel étalon'"
    class="form-modal"
    :mask-closable="false"
  >
    <NForm label-placement="top" @submit.prevent="submit">
      <NFormItem
        label="Nom"
        required
        :feedback="errors.name"
        :validation-status="errors.name ? 'error' : undefined"
      >
        <NInput v-model:value="form.name" placeholder="Ex. Siyouni" autofocus />
      </NFormItem>
      <div class="form-grid">
        <NFormItem
          label="Année de naissance"
          :feedback="errors.birthYear"
          :validation-status="errors.birthYear ? 'error' : undefined"
        >
          <NInputNumber
            v-model:value="form.birthYear"
            :show-button="false"
            placeholder="Facultatif"
            clearable
          />
        </NFormItem>
        <NFormItem label="Pays" :feedback="errors.country">
          <NInput v-model:value="form.country" placeholder="Ex. FR, IRE, GB" clearable />
        </NFormItem>
      </div>
      <NFormItem label="Notes" :feedback="errors.notes">
        <NInput
          v-model:value="form.notes"
          type="textarea"
          :autosize="{ minRows: 2, maxRows: 6 }"
          placeholder="Facultatif"
        />
      </NFormItem>
      <NSpace justify="end">
        <NButton @click="show = false">Annuler</NButton>
        <NButton type="primary" attr-type="submit" :loading="saving">Enregistrer</NButton>
      </NSpace>
    </NForm>
  </NModal>
</template>
