<script setup lang="ts">
import { NLayout, NLayoutContent, NLayoutSider, NMenu, type MenuOption } from 'naive-ui';
import { computed, h, ref } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import { routes } from '@/router';

const route = useRoute();
const collapsed = ref(false);

const sections: { label: string; names: string[] }[] = [
  { label: 'Analyse', names: ['dashboard', 'terrain-statistics', 'distance-statistics', 'charts'] },
  { label: 'Données', names: ['races', 'stallions', 'horses'] },
  { label: 'Administration', names: ['settings'] },
];

const menuOptions = computed<MenuOption[]>(() =>
  sections.map((section) => ({
    type: 'group',
    key: section.label,
    label: section.label,
    children: section.names.flatMap((name) => {
      const record = routes.find((candidate) => candidate.name === name);
      if (!record?.meta?.icon) return [];
      const icon = record.meta.icon;
      return [
        {
          key: name,
          label: () => h(RouterLink, { to: { name } }, () => record.meta?.title),
          icon: () => h(AppIcon, { name: icon }),
        },
      ];
    }),
  })),
);

const activeKey = computed(() =>
  route.name === 'stallion-detail' ? 'stallions' : String(route.name ?? ''),
);
</script>

<template>
  <NLayout has-sider class="app-shell">
    <NLayoutSider
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="232"
      :collapsed="collapsed"
      show-trigger="bar"
      :native-scrollbar="false"
      @collapse="collapsed = true"
      @expand="collapsed = false"
    >
      <div class="brand" :class="{ 'brand--collapsed': collapsed }">
        <img src="/favicon.svg" alt="" class="brand__logo" />
        <div v-if="!collapsed">
          <div class="brand__name">AlexisPD</div>
          <div class="brand__tagline">Performances des étalons</div>
        </div>
      </div>
      <NMenu
        :value="activeKey"
        :options="menuOptions"
        :collapsed="collapsed"
        :collapsed-width="64"
        :indent="18"
      />
    </NLayoutSider>
    <NLayoutContent :native-scrollbar="false" content-class="app-content">
      <RouterView />
    </NLayoutContent>
  </NLayout>
</template>

<style scoped>
.app-shell {
  height: 100vh;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 18px 16px;
}
.brand--collapsed {
  justify-content: center;
  padding-inline: 0;
}
.brand__logo {
  width: 32px;
  height: 32px;
}
.brand__name {
  font-weight: 700;
  font-size: 17px;
  letter-spacing: 0.02em;
}
.brand__tagline {
  font-size: 12px;
  color: var(--text-muted);
}
:deep(.app-content) {
  padding: 28px 32px 40px;
  max-width: 1680px;
  margin: 0 auto;
}
@media (max-width: 768px) {
  :deep(.app-content) {
    padding: 16px;
  }
}
</style>
