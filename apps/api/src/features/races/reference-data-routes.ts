import { idParamsSchema, racecourseInputSchema, terrainConditionInputSchema } from '@pmu/shared';
import type { FastifyInstance } from 'fastify';
import type { ReferenceDataService } from './reference-data-service';

export function registerReferenceDataRoutes(
  app: FastifyInstance,
  referenceData: ReferenceDataService,
): void {
  app.get('/api/terrain-conditions', async () => referenceData.listTerrainConditions());

  app.post('/api/terrain-conditions', async (request, reply) => {
    await referenceData.createTerrainCondition(terrainConditionInputSchema.parse(request.body));
    return reply.status(201).send(await referenceData.listTerrainConditions());
  });

  app.put('/api/terrain-conditions/:id', async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    await referenceData.updateTerrainCondition(id, terrainConditionInputSchema.parse(request.body));
    return referenceData.listTerrainConditions();
  });

  app.delete('/api/terrain-conditions/:id', async (request, reply) => {
    await referenceData.deleteTerrainCondition(idParamsSchema.parse(request.params).id);
    return reply.status(204).send();
  });

  app.get('/api/racecourses', async () => referenceData.listRacecourses());

  app.put('/api/racecourses/:id', async (request) => {
    const { id } = idParamsSchema.parse(request.params);
    await referenceData.renameRacecourse(id, racecourseInputSchema.parse(request.body).name);
    return referenceData.listRacecourses();
  });

  app.delete('/api/racecourses/:id', async (request, reply) => {
    await referenceData.deleteRacecourse(idParamsSchema.parse(request.params).id);
    return reply.status(204).send();
  });
}
