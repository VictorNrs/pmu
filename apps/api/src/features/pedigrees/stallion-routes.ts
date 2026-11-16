import { idParamsSchema, searchQuerySchema, stallionInputSchema } from '@pmu/shared';
import type { FastifyInstance } from 'fastify';
import type { StallionService } from './stallion-service';

export function registerStallionRoutes(app: FastifyInstance, stallions: StallionService): void {
  app.get('/api/stallions', async (request) =>
    stallions.list(searchQuerySchema.parse(request.query).search),
  );

  app.get('/api/stallions/:id', async (request) =>
    stallions.get(idParamsSchema.parse(request.params).id),
  );

  app.post('/api/stallions', async (request, reply) => {
    const stallion = await stallions.create(stallionInputSchema.parse(request.body));
    return reply.status(201).send(stallion);
  });

  app.put('/api/stallions/:id', async (request) =>
    stallions.update(
      idParamsSchema.parse(request.params).id,
      stallionInputSchema.parse(request.body),
    ),
  );

  app.delete('/api/stallions/:id', async (request, reply) => {
    await stallions.delete(idParamsSchema.parse(request.params).id);
    return reply.status(204).send();
  });
}
