import { expect, test, type APIRequestContext } from '@playwright/test';

const API = 'http://127.0.0.1:3001';

async function post<T>(request: APIRequestContext, path: string, data: object): Promise<T> {
  const response = await request.post(`${API}${path}`, { data });
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()) as T;
}

/** Deterministic pseudo-random sequence so that screenshots are reproducible. */
function* sequence(seed: number): Generator<number> {
  let value = seed;
  for (;;) {
    value = (value * 1103515245 + 12345) % 2147483648;
    yield value / 2147483648;
  }
}

test('renders tables and charts on a realistic data set', async ({ page, request }) => {
  const terrains = (await (await request.get(`${API}/api/terrain-conditions`)).json()) as {
    id: number;
  }[];
  const stallionNames = [
    'Kingman',
    'Frankel',
    'Lope de Vega',
    'Wootton Bassett',
    'Le Havre',
    'Kendargent',
  ];
  const horses: number[] = [];
  for (const [index, name] of stallionNames.entries()) {
    const stallion = await post<{ id: number }>(request, '/api/stallions', { name });
    for (let child = 0; child < 3; child += 1) {
      const horse = await post<{ id: number }>(request, '/api/horses', {
        name: `${name.split(' ')[0]} Junior ${index}-${child}`,
        stallionId: stallion.id,
      });
      horses.push(horse.id);
    }
  }
  const random = sequence(42);
  const distances = [1200, 1400, 1600, 2000, 2400];
  for (let day = 0; day < 40; day += 1) {
    const date = new Date(Date.UTC(2026, 0, 3 + day * 7)).toISOString().slice(0, 10);
    const runners = [...horses].sort(() => (random.next().value as number) - 0.5).slice(0, 6);
    await post(request, '/api/races', {
      raceDate: date,
      racecourseName: ['Longchamp', 'Chantilly', 'Deauville'][day % 3],
      distanceMeters: distances[day % distances.length],
      terrainConditionId: terrains[Math.floor((random.next().value as number) * 6)]?.id,
      participations: runners.map((horseId, position) => ({
        horseId,
        finishPosition: position + 1,
      })),
    });
  }

  await page.goto('/statistiques/terrain');
  await expect(page.getByRole('link', { name: 'Frankel' })).toBeVisible();
  await expect(page.locator('.metric-cell--best').first()).toBeVisible();
  await page.screenshot({ path: 'test-results/rich-terrain-table.png' });

  await page.goto('/statistiques/distance');
  await expect(page.locator('th', { hasText: '2400 m' })).toBeVisible();
  await page.screenshot({ path: 'test-results/rich-distance-table.png' });

  await page.goto('/graphiques');
  await expect(page.locator('.n-card div[role="img"]')).toHaveCount(4);
  await expect(page.locator('div[role="img"] svg').first()).toBeVisible();
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'test-results/rich-charts.png', fullPage: true });
});
