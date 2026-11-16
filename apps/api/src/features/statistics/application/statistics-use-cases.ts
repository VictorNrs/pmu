import type {
  PerformanceColumn,
  PerformanceFilters,
  PerformanceMatrix,
  PerformanceMatrixQuery,
  RankingQuery,
  StallionRankingEntry,
  StallionTrend,
  StatisticsOverview,
} from '@pmu/shared';
import { selectDistanceColumns, selectTerrainColumns } from '../domain/performance-columns';
import { buildPerformanceMatrix, type GroupCounts } from '../domain/performance-matrix';
import { computePerformanceMetrics, sumCounts } from '../domain/performance-metrics';
import { rankStallions } from '../domain/stallion-ranking';
import type { ParticipationAggregateRepository } from '../infrastructure/participation-aggregate-repository';
import type { StatisticsReferenceRepository } from '../infrastructure/statistics-reference-repository';

/**
 * Entry point of every statistic displayed by the application (tables, charts,
 * dashboard), so that all views share exactly the same rules.
 */
export class StatisticsUseCases {
  constructor(
    private readonly aggregates: ParticipationAggregateRepository,
    private readonly references: StatisticsReferenceRepository,
  ) {}

  async getPerformanceMatrix(query: PerformanceMatrixQuery): Promise<PerformanceMatrix> {
    const { dimension, ...filters } = query;
    const [stallions, groups] = await Promise.all([
      this.references.findStallions(filters.stallionIds),
      this.aggregates.countByStallionAndColumn(dimension, filters),
    ]);
    const columns = await this.selectColumns(query, groups);
    return buildPerformanceMatrix(dimension, stallions, columns, groups);
  }

  async getRanking(query: RankingQuery): Promise<StallionRankingEntry[]> {
    const { metric, minRaces, limit, ...filters } = query;
    const [stallions, counts] = await Promise.all([
      this.references.findStallions(filters.stallionIds),
      this.aggregates.countByStallion(filters),
    ]);
    const namesById = new Map(stallions.map((stallion) => [stallion.id, stallion.name]));
    const candidates = counts.map(({ stallionId, ...rest }) => ({
      stallionId,
      stallionName: namesById.get(stallionId) ?? '',
      metrics: computePerformanceMetrics(rest),
    }));
    return rankStallions(candidates, { metric, minRaces, limit });
  }

  async getOverview(): Promise<StatisticsOverview> {
    const [volumes, counts] = await Promise.all([
      this.references.countSources(),
      this.aggregates.countByStallion({}),
    ]);
    return { ...volumes, global: computePerformanceMetrics(sumCounts(counts)) };
  }

  async getTrends(filters: PerformanceFilters): Promise<StallionTrend[]> {
    const [stallions, counts] = await Promise.all([
      this.references.findStallions(filters.stallionIds),
      this.aggregates.countByStallionAndMonth(filters),
    ]);
    return stallions
      .map((stallion) => ({
        stallionId: stallion.id,
        stallionName: stallion.name,
        points: counts
          .filter((row) => row.stallionId === stallion.id)
          .map(({ period, stallionId: _stallionId, ...rest }) => ({
            period,
            metrics: computePerformanceMetrics(rest),
          })),
      }))
      .filter((trend) => trend.points.length > 0);
  }

  private async selectColumns(
    query: PerformanceMatrixQuery,
    groups: readonly GroupCounts[],
  ): Promise<PerformanceColumn[]> {
    const keysWithData = new Set(groups.map((group) => group.columnKey));
    if (query.dimension === 'distance') return selectDistanceColumns(query.distances, keysWithData);
    const terrains = await this.references.findTerrainConditions();
    return selectTerrainColumns(terrains, query.terrainConditionIds, keysWithData);
  }
}
