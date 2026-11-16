import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import pg from 'pg';

/** Empties the test database (reference terrains are kept) before the end-to-end run. */
export default async function globalSetup(): Promise<void> {
  const { DATABASE_URL } = parseEnv(readFileSync('.env.test', 'utf8'));
  if (!DATABASE_URL?.includes('pmu_test')) throw new Error('E2E tests must target pmu_test');
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();
  await client.query(
    'TRUNCATE participations, races, racecourses, horses, stallions RESTART IDENTITY CASCADE',
  );
  await client.query('UPDATE terrain_conditions SET is_active = true');
  await client.end();
}
