import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import { HorseRepository } from './features/horses/horse-repository';
import { registerHorseRoutes } from './features/horses/horse-routes';
import { HorseService } from './features/horses/horse-service';
import { StallionRepository } from './features/pedigrees/stallion-repository';
import { registerStallionRoutes } from './features/pedigrees/stallion-routes';
import { StallionService } from './features/pedigrees/stallion-service';
import { ParticipationRepository } from './features/races/participation-repository';
import { RaceRepository } from './features/races/race-repository';
import { registerRaceRoutes } from './features/races/race-routes';
import { RaceService } from './features/races/race-service';
import { RaceWriter } from './features/races/race-writer';
import { registerReferenceDataRoutes } from './features/races/reference-data-routes';
import { ReferenceDataService } from './features/races/reference-data-service';
import { StatisticsUseCases } from './features/statistics/application/statistics-use-cases';
import { ParticipationAggregateRepository } from './features/statistics/infrastructure/participation-aggregate-repository';
import { StatisticsReferenceRepository } from './features/statistics/infrastructure/statistics-reference-repository';
import { registerStatisticsRoutes } from './features/statistics/presentation/statistics-routes';
import type { Database } from './shared/database/prisma-client';
import { handleError } from './shared/errors/error-handler';

export interface AppOptions {
  database: Database;
  webOrigin: string;
  logger?: boolean;
}

/** Composition root: wires repositories, services and routes. */
export async function buildApp(options: AppOptions): Promise<FastifyInstance> {
  const { database } = options;
  const app = Fastify({ logger: options.logger ?? false });
  await app.register(cors, {
    origin: options.webOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });
  app.setErrorHandler(handleError);

  registerStallionRoutes(app, new StallionService(new StallionRepository(database)));
  registerHorseRoutes(app, new HorseService(new HorseRepository(database)));
  registerRaceRoutes(
    app,
    new RaceService(new RaceRepository(database), new RaceWriter(database)),
    new ParticipationRepository(database),
  );
  registerReferenceDataRoutes(app, new ReferenceDataService(database));
  registerStatisticsRoutes(
    app,
    new StatisticsUseCases(
      new ParticipationAggregateRepository(database),
      new StatisticsReferenceRepository(database),
    ),
  );
  app.get('/api/health', async () => ({ status: 'ok' }));
  return app;
}
