import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';
import { readEnvironment } from '../../src/config/environment';
import { createDatabase, type Database } from '../../src/shared/database/prisma-client';

export interface TestContext {
  app: FastifyInstance;
  database: Database;
}

export async function createTestContext(): Promise<TestContext> {
  process.env.ENV_FILE = '.env.test';
  const environment = readEnvironment();
  if (!environment.DATABASE_URL.includes('pmu_test')) {
    throw new Error('Integration tests must run against the pmu_test database');
  }
  const database = createDatabase(environment.DATABASE_URL);
  const app = await buildApp({ database, webOrigin: environment.WEB_ORIGIN });
  return { app, database };
}

/** Removes every source record; the reference terrains and distances of the migrations are kept. */
export async function resetDatabase(database: Database): Promise<void> {
  await database.$executeRawUnsafe(
    'TRUNCATE participations, races, racecourses, horses, stallions RESTART IDENTITY CASCADE',
  );
  await database.$executeRawUnsafe(
    "DELETE FROM terrain_conditions WHERE label_key NOT IN ('bon','souple','tres souple','collant','lourd','psf')",
  );
  await database.$executeRawUnsafe('UPDATE terrain_conditions SET is_active = true');
  await database.$executeRawUnsafe(
    'DELETE FROM race_distances WHERE distance_meters NOT IN (1200, 1400, 1600, 2000, 2400)',
  );
  await database.$executeRawUnsafe('UPDATE race_distances SET is_active = true');
}

export async function closeTestContext(context: TestContext): Promise<void> {
  await context.app.close();
  await context.database.$disconnect();
}

export async function terrainIdsByLabel(database: Database): Promise<Record<string, number>> {
  const terrains = await database.terrainCondition.findMany();
  return Object.fromEntries(terrains.map((terrain) => [terrain.label, terrain.id]));
}
