import type { FastifyInstance } from 'fastify';

export async function createStallion(app: FastifyInstance, name: string): Promise<number> {
  const response = await app.inject({ method: 'POST', url: '/api/stallions', payload: { name } });
  if (response.statusCode !== 201) throw new Error(`createStallion failed: ${response.body}`);
  return response.json<{ id: number }>().id;
}

export async function createHorse(
  app: FastifyInstance,
  name: string,
  stallionId: number,
): Promise<number> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/horses',
    payload: { name, stallionId },
  });
  if (response.statusCode !== 201) throw new Error(`createHorse failed: ${response.body}`);
  return response.json<{ id: number }>().id;
}

export interface RaceFixture {
  raceDate: string;
  racecourseName?: string;
  distanceMeters: number;
  terrainConditionId: number;
  participations: { horseId: number; finishPosition: number }[];
}

export async function createRace(app: FastifyInstance, race: RaceFixture): Promise<number> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/races',
    payload: { racecourseName: 'Longchamp', ...race },
  });
  if (response.statusCode !== 201) throw new Error(`createRace failed: ${response.body}`);
  return response.json<{ id: number }>().id;
}
