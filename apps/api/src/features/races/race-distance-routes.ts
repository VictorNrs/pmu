import {
  distanceParamsSchema,
  raceDistanceInputSchema,
  raceDistanceUpdateSchema,
} from '@pmu/shared';
import type { FastifyInstance } from 'fastify';
import type { RaceDistanceService } from './race-distance-service';

export function registerRaceDistanceRoutes(
  app: FastifyInstance,
  distances: RaceDistanceService,
): void {
  app.get('/api/race-distances', async () => distances.list());

  app.post('/api/race-distances', async (request, reply) => {
    const { distanceMeters, isActive } = raceDistanceInputSchema.parse(request.body);
    await distances.create(distanceMeters, isActive);
    return reply.status(201).send(await distances.list());
  });

  app.put('/api/race-distances/:distanceMeters', async (request) => {
    const { distanceMeters } = distanceParamsSchema.parse(request.params);
    await distances.setActive(
      distanceMeters,
      raceDistanceUpdateSchema.parse(request.body).isActive,
    );
    return distances.list();
  });

  app.delete('/api/race-distances/:distanceMeters', async (request, reply) => {
    await distances.delete(distanceParamsSchema.parse(request.params).distanceMeters);
    return reply.status(204).send();
  });
}
