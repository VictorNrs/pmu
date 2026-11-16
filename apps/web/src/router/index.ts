import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import type { IconName } from '@/components/icons';

declare module 'vue-router' {
  interface RouteMeta {
    title: string;
    icon?: IconName;
    /** Shown in the side navigation. */
    navigation?: boolean;
  }
}

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/features/dashboard/DashboardPage.vue'),
    meta: { title: 'Tableau de bord', icon: 'dashboard', navigation: true },
  },
  {
    path: '/statistiques/terrain',
    name: 'terrain-statistics',
    component: () => import('@/features/statistics/PerformanceTablePage.vue'),
    props: { dimension: 'terrain' },
    meta: { title: 'Stats par terrain', icon: 'terrain', navigation: true },
  },
  {
    path: '/statistiques/distance',
    name: 'distance-statistics',
    component: () => import('@/features/statistics/PerformanceTablePage.vue'),
    props: { dimension: 'distance' },
    meta: { title: 'Stats par distance', icon: 'distance', navigation: true },
  },
  {
    path: '/graphiques',
    name: 'charts',
    component: () => import('@/features/charts/ChartsPage.vue'),
    meta: { title: 'Graphiques', icon: 'chart', navigation: true },
  },
  {
    path: '/courses',
    name: 'races',
    component: () => import('@/features/races/RacesPage.vue'),
    meta: { title: 'Courses & résultats', icon: 'race', navigation: true },
  },
  {
    path: '/etalons',
    name: 'stallions',
    component: () => import('@/features/pedigrees/StallionsPage.vue'),
    meta: { title: 'Étalons', icon: 'stallion', navigation: true },
  },
  {
    path: '/etalons/:id',
    name: 'stallion-detail',
    component: () => import('@/features/pedigrees/StallionDetailPage.vue'),
    props: (route) => ({ stallionId: Number(route.params.id) }),
    meta: { title: 'Fiche étalon' },
  },
  {
    path: '/chevaux',
    name: 'horses',
    component: () => import('@/features/horses/HorsesPage.vue'),
    meta: { title: 'Chevaux', icon: 'horse', navigation: true },
  },
  {
    path: '/parametres',
    name: 'settings',
    component: () => import('@/features/settings/SettingsPage.vue'),
    meta: { title: 'Paramètres', icon: 'settings', navigation: true },
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

export const router = createRouter({ history: createWebHistory(), routes });

router.afterEach((to) => {
  document.title = `${to.meta.title} · AlexisPD`;
});
