import type {
  PerformanceFilters,
  PerformanceMatrix,
  PerformanceMatrixQuery,
  RankingQuery,
  StallionRankingEntry,
  StallionTrend,
  StatisticsOverview,
} from '@pmu/shared';
import { apiClient } from './api-client';

/** Every statistic comes from the backend Statistics domain; nothing is computed here. */
export const statisticsApi = {
  performance: (query: PerformanceMatrixQuery) =>
    apiClient.get<PerformanceMatrix>('/api/statistics/performance', { ...query }),
  rankings: (query: Partial<RankingQuery>) =>
    apiClient.get<StallionRankingEntry[]>('/api/statistics/rankings', { ...query }),
  trends: (filters: PerformanceFilters) =>
    apiClient.get<StallionTrend[]>('/api/statistics/trends', { ...filters }),
  overview: () => apiClient.get<StatisticsOverview>('/api/statistics/overview'),
};
