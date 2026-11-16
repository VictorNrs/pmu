import { z } from 'zod';
import { performanceFiltersSchema } from './filters';

export const PERFORMANCE_DIMENSIONS = ['terrain', 'distance'] as const;
export type PerformanceDimension = (typeof PERFORMANCE_DIMENSIONS)[number];

export const performanceMatrixQuerySchema = performanceFiltersSchema.extend({
  dimension: z.enum(PERFORMANCE_DIMENSIONS),
});
export type PerformanceMatrixQuery = z.infer<typeof performanceMatrixQuerySchema>;

/**
 * Indicators computed from the participations of a group.
 * Rates and average are `null` when the group has no participation:
 * "no data" must never be displayed as 0 %.
 */
export interface PerformanceMetrics {
  raceCount: number;
  winCount: number;
  placeCount: number;
  winRate: number | null;
  placeRate: number | null;
  averageFinishPosition: number | null;
}

export interface PerformanceColumn {
  /** Terrain condition id, or distance in meters. */
  key: number;
  label: string;
}

export interface StallionPerformanceRow {
  stallionId: number;
  stallionName: string;
  total: PerformanceMetrics;
  /** Indexed by column key. Every column is present, possibly with zero races. */
  cells: Record<number, PerformanceMetrics>;
}

/**
 * Reference average: indicators computed on every participation of the selection,
 * all stallions together, per column and in total. Used to compare a stallion to the mean.
 */
export interface PerformanceAverage {
  total: PerformanceMetrics;
  cells: Record<number, PerformanceMetrics>;
}

export interface PerformanceMatrix {
  dimension: PerformanceDimension;
  columns: PerformanceColumn[];
  rows: StallionPerformanceRow[];
  average: PerformanceAverage;
}

export const RANKING_METRICS = ['winRate', 'placeRate', 'averageFinishPosition'] as const;
export type RankingMetric = (typeof RANKING_METRICS)[number];

export const rankingQuerySchema = performanceFiltersSchema.extend({
  metric: z.enum(RANKING_METRICS).default('winRate'),
  minRaces: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
export type RankingQuery = z.infer<typeof rankingQuerySchema>;

export interface StallionRankingEntry {
  rank: number;
  stallionId: number;
  stallionName: string;
  metrics: PerformanceMetrics;
}

export interface PerformanceTrendPoint {
  /** First day of the month, YYYY-MM-DD. */
  period: string;
  metrics: PerformanceMetrics;
}

export interface StallionTrend {
  stallionId: number;
  stallionName: string;
  points: PerformanceTrendPoint[];
}

/** Data volumes shown on the dashboard. */
export interface StatisticsOverview {
  stallionCount: number;
  horseCount: number;
  raceCount: number;
  participationCount: number;
  firstRaceDate: string | null;
  lastRaceDate: string | null;
}
