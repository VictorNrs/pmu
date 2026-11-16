import type { RaceDetail } from '@pmu/shared';
import { createHorse, createRace, createStallion } from './helpers/fixtures';
import {
  closeTestContext,
  createTestContext,
  resetDatabase,
  terrainIdsByLabel,
  type TestContext,
} from './helpers/test-app';

describe('Data integrity (PostgreSQL)', () => {
  let context: TestContext;
  let terrain: Record<string, number>;

  beforeAll(async () => {
    context = await createTestContext();
    terrain = await terrainIdsByLabel(context.database);
  });
  beforeEach(async () => resetDatabase(context.database));
  afterAll(async () => closeTestContext(context));

  const request = (method: 'POST' | 'PUT' | 'DELETE', url: string, payload?: object) =>
    context.app.inject({ method, url, ...(payload ? { payload } : {}) });

  async function setUpRace() {
    const stallionId = await createStallion(context.app, 'Siyouni');
    const horseA = await createHorse(context.app, 'Horse A', stallionId);
    const horseB = await createHorse(context.app, 'Horse B', stallionId);
    const race = {
      raceDate: '2026-03-01',
      distanceMeters: 1600,
      terrainConditionId: terrain.Bon ?? 0,
      participations: [{ horseId: horseA, finishPosition: 1 }],
    };
    const raceId = await createRace(context.app, race);
    return { stallionId, horseA, horseB, race, raceId };
  }

  describe('duplicates', () => {
    it('rejects a stallion name differing only by case, accents or spaces', async () => {
      await createStallion(context.app, 'Élusive City');
      const response = await request('POST', '/api/stallions', { name: '  elusive   CITY ' });
      expect(response.statusCode).toBe(409);
    });

    it('rejects a horse name already used', async () => {
      const { stallionId } = await setUpRace();
      const response = await request('POST', '/api/horses', { name: 'HORSE A', stallionId });
      expect(response.statusCode).toBe(409);
    });

    it('rejects the same horse twice in one race', async () => {
      const { race, horseA } = await setUpRace();
      const response = await request('POST', '/api/races', {
        ...race,
        racecourseName: 'Chantilly',
        participations: [
          { horseId: horseA, finishPosition: 1 },
          { horseId: horseA, finishPosition: 2 },
        ],
      });
      expect(response.statusCode).toBe(400);
    });

    it('rejects a second race for the same horse on the same day', async () => {
      const { race } = await setUpRace();
      const response = await request('POST', '/api/races', {
        ...race,
        racecourseName: 'Deauville',
      });
      expect(response.statusCode).toBe(409);
      expect(response.json<{ message: string }>().message).toContain('Horse A');
    });

    it('reuses an existing racecourse whatever its spelling', async () => {
      const { horseB, race } = await setUpRace();
      await createRace(context.app, {
        ...race,
        racecourseName: 'LONGCHAMP',
        participations: [{ horseId: horseB, finishPosition: 2 }],
      });
      expect(await context.database.racecourse.count()).toBe(1);
    });

    it('enforces one race per day per horse in PostgreSQL as well', async () => {
      const { horseA, raceId } = await setUpRace();
      const other = await context.database.race.create({
        data: {
          raceDate: new Date('2026-03-01T00:00:00Z'),
          racecourseId: (await context.database.racecourse.findFirstOrThrow()).id,
          distanceMeters: 2000,
          terrainConditionId: terrain.Lourd ?? 0,
        },
      });
      await expect(
        context.database.participation.create({
          data: { raceId: other.id, raceDate: other.raceDate, horseId: horseA, finishPosition: 3 },
        }),
      ).rejects.toThrow();
      expect(raceId).toBeGreaterThan(0);
    });
  });

  describe('protected deletions', () => {
    it('refuses to delete a stallion that has descendants', async () => {
      const { stallionId } = await setUpRace();
      expect((await request('DELETE', `/api/stallions/${stallionId}`)).statusCode).toBe(409);
    });

    it('deletes a stallion without descendants', async () => {
      const stallionId = await createStallion(context.app, 'Lonely');
      expect((await request('DELETE', `/api/stallions/${stallionId}`)).statusCode).toBe(204);
    });

    it('refuses to delete a horse with results, or a terrain used by races', async () => {
      const { horseA } = await setUpRace();
      expect((await request('DELETE', `/api/horses/${horseA}`)).statusCode).toBe(409);
      expect((await request('DELETE', `/api/terrain-conditions/${terrain.Bon}`)).statusCode).toBe(
        409,
      );
    });

    it('deletes a race together with its participations', async () => {
      const { raceId } = await setUpRace();
      expect((await request('DELETE', `/api/races/${raceId}`)).statusCode).toBe(204);
      expect(await context.database.participation.count()).toBe(0);
    });
  });

  describe('race update', () => {
    it('replaces the participations and moves them to the new date', async () => {
      const { race, raceId, horseA, horseB } = await setUpRace();
      const response = await request('PUT', `/api/races/${raceId}`, {
        ...race,
        racecourseName: 'Longchamp',
        raceDate: '2026-03-08',
        participations: [
          { horseId: horseA, finishPosition: 4 },
          { horseId: horseB, finishPosition: 1 },
        ],
      });
      expect(response.statusCode).toBe(200);
      const updated = response.json<RaceDetail>();
      expect(updated.raceDate).toBe('2026-03-08');
      expect(
        updated.participations.map((entry) => [entry.horseName, entry.finishPosition]),
      ).toEqual([
        ['Horse B', 1],
        ['Horse A', 4],
      ]);
      const dates = await context.database.participation.findMany({ select: { raceDate: true } });
      expect(dates.every((entry) => entry.raceDate.toISOString().startsWith('2026-03-08'))).toBe(
        true,
      );
    });

    it('validates the input', async () => {
      const { race, raceId } = await setUpRace();
      const response = await request('PUT', `/api/races/${raceId}`, {
        ...race,
        racecourseName: 'Longchamp',
        distanceMeters: 50,
      });
      expect(response.statusCode).toBe(400);
    });
  });
});
