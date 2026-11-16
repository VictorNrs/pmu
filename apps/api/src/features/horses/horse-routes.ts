import { horseInputSchema, horseListQuerySchema, idParamsSchema } from '@pmu/shared';
import type { FastifyInstance } from 'fastify';
import type { HorseService } from './horse-service';

export function registerHorseRoutes(app: FastifyInstance, horses: HorseService): void {
  app.get('/api/horses', async (request) => horses.list(horseListQuerySchema.parse(request.query)));

  app.get('/api/horses/:id', async (request) =>
    horses.get(idParamsSchema.parse(request.params).id),
  );

  app.post('/api/horses', async (request, reply) => {
    const horse = await horses.create(horseInputSchema.parse(request.body));
    return reply.status(201).send(horse);
  });

  app.put('/api/horses/:id', async (request) =>
    horses.update(idParamsSchema.parse(request.params).id, horseInputSchema.parse(request.body)),
  );

  app.delete('/api/horses/:id', async (request, reply) => {
    await horses.delete(idParamsSchema.parse(request.params).id);
    return reply.status(204).send();
  });
}
