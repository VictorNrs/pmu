<script setup lang="ts">
import { NGi, NGrid } from 'naive-ui';
import RaceDistancesCard from './RaceDistancesCard.vue';
import RacecoursesCard from './RacecoursesCard.vue';
import TerrainConditionsCard from './TerrainConditionsCard.vue';
</script>

<template>
  <section>
    <header class="page-header">
      <div>
        <h1>Paramètres</h1>
        <p>
          Données de référence utilisées par la saisie des courses et les tableaux statistiques.
        </p>
      </div>
    </header>
    <NGrid :cols="24" :x-gap="16" :y-gap="16" item-responsive responsive="screen">
      <NGi span="24 l:14"><TerrainConditionsCard /></NGi>
      <NGi span="24 l:10"><RaceDistancesCard /></NGi>
      <NGi span="24"><RacecoursesCard /></NGi>
    </NGrid>
  </section>
</template>
