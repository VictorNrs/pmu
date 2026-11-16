import {
  idParamsSchema,
  participationListQuerySchema,
  raceInputSchema,
  raceListQuerySchema,
} from '@pmu/shared';
import type { FastifyInstance } from 'fastify';
import type { ParticipationRepository } from './participation-repository';
import type { RaceService } from './race-service';

export function registerRaceRoutes(
  app: FastifyInstance,
  races: RaceService,
  participations: ParticipationRepository,
): void {
  app.get('/api/races', async (request) => races.list(raceListQuerySchema.parse(request.query)));

  app.get('/api/races/distances', async () => races.listDistances());

  app.get('/api/races/:id', async (request) => races.get(idParamsSchema.parse(request.params).id));

  app.post('/api/races', async (request, reply) => {
    const race = await races.create(raceInputSchema.parse(request.body));
    return reply.status(201).send(race);
  });

  app.put('/api/races/:id', async (request) =>
    races.update(idParamsSchema.parse(request.params).id, raceInputSchema.parse(request.body)),
  );

  app.delete('/api/races/:id', async (request, reply) => {
    await races.delete(idParamsSchema.parse(request.params).id);
    return reply.status(204).send();
  });

  app.get('/api/participations', async (request) =>
    participations.list(participationListQuerySchema.parse(request.query)),
  );

  app.delete('/api/participations/:id', async (request, reply) => {
    await races.deleteParticipation(idParamsSchema.parse(request.params).id);
    return reply.status(204).send();
  });
}
