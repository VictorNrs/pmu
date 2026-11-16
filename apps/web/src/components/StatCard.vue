<script setup lang="ts">
defineProps<{ label: string; value: string; hint?: string; accent?: 'gold' | 'primary' }>();
</script>

<template>
  <div class="stat-card">
    <div class="stat-card__label">{{ label }}</div>
    <div
      class="stat-card__value tabular"
      :class="accent ? `stat-card__value--${accent}` : undefined"
    >
      {{ value }}
    </div>
    <div v-if="hint" class="stat-card__hint">{{ hint }}</div>
  </div>
</template>

<style scoped>
.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px 18px;
}
.stat-card__label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}
.stat-card__value {
  font-size: 28px;
  font-weight: 700;
  margin-top: 6px;
  line-height: 1.1;
}
.stat-card__value--gold {
  color: var(--gold);
}
.stat-card__value--primary {
  color: var(--primary);
}
.stat-card__hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}
</style>
