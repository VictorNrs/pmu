import type {
  DistanceUsage,
  Horse,
  HorseInput,
  HorseListQuery,
  Page,
  ParticipationDetail,
  ParticipationListQuery,
  RaceDetail,
  RaceInput,
  RaceListQuery,
  RaceSummary,
  Racecourse,
  Stallion,
  StallionInput,
  TerrainCondition,
  TerrainConditionInput,
} from '@pmu/shared';
import { apiClient } from './api-client';

export const stallionsApi = {
  list: (search?: string) => apiClient.get<Stallion[]>('/api/stallions', { search }),
  get: (id: number) => apiClient.get<Stallion>(`/api/stallions/${id}`),
  create: (input: StallionInput) => apiClient.post<Stallion>('/api/stallions', input),
  update: (id: number, input: StallionInput) =>
    apiClient.put<Stallion>(`/api/stallions/${id}`, input),
  remove: (id: number) => apiClient.delete(`/api/stallions/${id}`),
};

export const horsesApi = {
  list: (query: Partial<HorseListQuery> = {}) => apiClient.get<Horse[]>('/api/horses', query),
  create: (input: HorseInput) => apiClient.post<Horse>('/api/horses', input),
  update: (id: number, input: HorseInput) => apiClient.put<Horse>(`/api/horses/${id}`, input),
  remove: (id: number) => apiClient.delete(`/api/horses/${id}`),
};

export const racesApi = {
  list: (query: Partial<RaceListQuery> = {}) =>
    apiClient.get<Page<RaceSummary>>('/api/races', query),
  get: (id: number) => apiClient.get<RaceDetail>(`/api/races/${id}`),
  create: (input: RaceInput) => apiClient.post<RaceDetail>('/api/races', input),
  update: (id: number, input: RaceInput) => apiClient.put<RaceDetail>(`/api/races/${id}`, input),
  remove: (id: number) => apiClient.delete(`/api/races/${id}`),
  distances: () => apiClient.get<DistanceUsage[]>('/api/races/distances'),
};

export const participationsApi = {
  list: (query: Partial<ParticipationListQuery> = {}) =>
    apiClient.get<Page<ParticipationDetail>>('/api/participations', query),
  remove: (id: number) => apiClient.delete(`/api/participations/${id}`),
};

export const referenceDataApi = {
  terrainConditions: () => apiClient.get<TerrainCondition[]>('/api/terrain-conditions'),
  createTerrainCondition: (input: TerrainConditionInput) =>
    apiClient.post<TerrainCondition[]>('/api/terrain-conditions', input),
  updateTerrainCondition: (id: number, input: TerrainConditionInput) =>
    apiClient.put<TerrainCondition[]>(`/api/terrain-conditions/${id}`, input),
  removeTerrainCondition: (id: number) => apiClient.delete(`/api/terrain-conditions/${id}`),
  racecourses: () => apiClient.get<Racecourse[]>('/api/racecourses'),
  renameRacecourse: (id: number, name: string) =>
    apiClient.put<Racecourse[]>(`/api/racecourses/${id}`, { name }),
  removeRacecourse: (id: number) => apiClient.delete(`/api/racecourses/${id}`),
};
