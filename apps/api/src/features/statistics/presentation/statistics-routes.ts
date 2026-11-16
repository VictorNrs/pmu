import {
  performanceFiltersSchema,
  performanceMatrixQuerySchema,
  rankingQuerySchema,
} from '@pmu/shared';
import type { FastifyInstance } from 'fastify';
import type { StatisticsUseCases } from '../application/statistics-use-cases';

export function registerStatisticsRoutes(
  app: FastifyInstance,
  statistics: StatisticsUseCases,
): void {
  app.get('/api/statistics/performance', async (request) =>
    statistics.getPerformanceMatrix(performanceMatrixQuerySchema.parse(request.query)),
  );

  app.get('/api/statistics/rankings', async (request) =>
    statistics.getRanking(rankingQuerySchema.parse(request.query)),
  );

  app.get('/api/statistics/trends', async (request) =>
    statistics.getTrends(performanceFiltersSchema.parse(request.query)),
  );

  app.get('/api/statistics/overview', async () => statistics.getOverview());
}
