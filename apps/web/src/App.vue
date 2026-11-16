<script setup lang="ts">
import {
  NConfigProvider,
  NDialogProvider,
  NGlobalStyle,
  NMessageProvider,
  dateFrFR,
  frFR,
} from 'naive-ui';
import AppLayout from '@/layouts/AppLayout.vue';
import { theme, themeOverrides } from '@/styles/theme';
</script>

<template>
  <NConfigProvider
    :theme="theme"
    :theme-overrides="themeOverrides"
    :locale="frFR"
    :date-locale="dateFrFR"
  >
    <NGlobalStyle />
    <NMessageProvider placement="bottom-right">
      <NDialogProvider>
        <AppLayout />
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>
