import type {
  Page,
  ParticipationDetail,
  PerformanceMatrix,
  StallionRankingEntry,
  StallionTrend,
  StatisticsOverview,
} from '@pmu/shared';
import { createHorse, createRace, createStallion } from './helpers/fixtures';
import {
  closeTestContext,
  createTestContext,
  resetDatabase,
  terrainIdsByLabel,
  type TestContext,
} from './helpers/test-app';

/**
 * Controlled data set (finish positions):
 *            R1 Bon 1600   R2 Souple 1600   R3 Bon 2000   R4 Lourd 1600
 * Alpha:     A1 = 1        A1 = 2, A2 = 5   A2 = 1        A1 = 7
 * Bravo:     B1 = 3                         B1 = 2        B1 = 1
 * Zulu:      no horse
 */
describe('Statistics (PostgreSQL)', () => {
  let context: TestContext;
  let terrain: Record<string, number>;
  let alpha: number;
  let bravo: number;
  let zulu: number;

  beforeAll(async () => {
    context = await createTestContext();
    await resetDatabase(context.database);
    terrain = await terrainIdsByLabel(context.database);
    const { app } = context;
    alpha = await createStallion(app, 'Alpha');
    bravo = await createStallion(app, 'Bravo');
    zulu = await createStallion(app, 'Zulu');
    const a1 = await createHorse(app, 'A1', alpha);
    const a2 = await createHorse(app, 'A2', alpha);
    const b1 = await createHorse(app, 'B1', bravo);
    const race = (raceDate: string, terrainLabel: string, distanceMeters: number) => ({
      raceDate,
      distanceMeters,
      terrainConditionId: terrain[terrainLabel] ?? 0,
    });
    await createRace(app, {
      ...race('2026-01-10', 'Bon', 1600),
      participations: [
        { horseId: a1, finishPosition: 1 },
        { horseId: b1, finishPosition: 3 },
      ],
    });
    await createRace(app, {
      ...race('2026-01-20', 'Souple', 1600),
      participations: [
        { horseId: a1, finishPosition: 2 },
        { horseId: a2, finishPosition: 5 },
      ],
    });
    await createRace(app, {
      ...race('2026-02-05', 'Bon', 2000),
      participations: [
        { horseId: a2, finishPosition: 1 },
        { horseId: b1, finishPosition: 2 },
      ],
    });
    await createRace(app, {
      ...race('2026-02-15', 'Lourd', 1600),
      participations: [
        { horseId: a1, finishPosition: 7 },
        { horseId: b1, finishPosition: 1 },
      ],
    });
  });

  afterAll(async () => closeTestContext(context));

  async function get<T>(url: string): Promise<T> {
    const response = await context.app.inject({ method: 'GET', url });
    expect(response.statusCode).toBe(200);
    return response.json<T>();
  }

  const row = (matrix: PerformanceMatrix, stallionId: number) =>
    matrix.rows.find((candidate) => candidate.stallionId === stallionId);

  describe('terrain table', () => {
    let matrix: PerformanceMatrix;
    beforeAll(async () => {
      matrix = await get('/api/statistics/performance?dimension=terrain');
    });

    it('shows every stallion, including those without race, sorted by name', () => {
      expect(matrix.rows.map((entry) => entry.stallionName)).toEqual(['Alpha', 'Bravo', 'Zulu']);
      expect(row(matrix, zulu)?.total).toMatchObject({ raceCount: 0, winRate: null });
    });

    it('shows every active terrain as a column, in the reference order', () => {
      expect(matrix.columns.map((column) => column.label)).toEqual([
        'Bon',
        'Souple',
        'Très souple',
        'Collant',
        'Lourd',
        'PSF',
      ]);
    });

    it('groups participations by terrain', () => {
      const cells = row(matrix, alpha)?.cells ?? {};
      expect(cells[terrain.Bon ?? 0]).toEqual({
        raceCount: 2,
        winCount: 2,
        placeCount: 0,
        winRate: 1,
        placeRate: 0,
        averageFinishPosition: 1,
      });
      expect(cells[terrain.Souple ?? 0]).toMatchObject({
        raceCount: 2,
        winCount: 0,
        placeCount: 1,
        placeRate: 0.5,
        averageFinishPosition: 3.5,
      });
      expect(cells[terrain.Lourd ?? 0]).toMatchObject({ raceCount: 1, averageFinishPosition: 7 });
      expect(row(matrix, bravo)?.cells[terrain.Souple ?? 0]).toMatchObject({
        raceCount: 0,
        winRate: null,
        averageFinishPosition: null,
      });
    });

    it('computes totals that match the sum of the columns', () => {
      expect(row(matrix, alpha)?.total).toEqual({
        raceCount: 5,
        winCount: 2,
        placeCount: 1,
        winRate: 0.4,
        placeRate: 0.2,
        averageFinishPosition: 3.2,
      });
      for (const entry of matrix.rows) {
        const columnSum = Object.values(entry.cells).reduce((sum, cell) => sum + cell.raceCount, 0);
        expect(columnSum).toBe(entry.total.raceCount);
      }
    });
  });

  describe('distance table', () => {
    it('uses the same rules with the reference distances as columns', async () => {
      const matrix = await get<PerformanceMatrix>('/api/statistics/performance?dimension=distance');
      expect(matrix.columns.map((column) => column.label)).toEqual([
        '1200 m',
        '1400 m',
        '1600 m',
        '2000 m',
        '2400 m',
      ]);
      expect(row(matrix, alpha)?.cells[1200]).toMatchObject({ raceCount: 0, winRate: null });
      expect(row(matrix, alpha)?.cells[1600]).toMatchObject({
        raceCount: 4,
        winCount: 1,
        placeCount: 1,
        averageFinishPosition: 3.75,
      });
      expect(row(matrix, bravo)?.cells[1600]).toMatchObject({
        raceCount: 2,
        winCount: 1,
        placeCount: 1,
        averageFinishPosition: 2,
      });
      expect(row(matrix, bravo)?.total).toEqual(
        (await get<PerformanceMatrix>('/api/statistics/performance?dimension=terrain')).rows.find(
          (entry) => entry.stallionId === bravo,
        )?.total,
      );
    });

    it('restricts the columns to the selected distances', async () => {
      const matrix = await get<PerformanceMatrix>(
        '/api/statistics/performance?dimension=distance&distances=2000',
      );
      expect(matrix.columns.map((column) => column.key)).toEqual([2000]);
      expect(row(matrix, alpha)?.total.raceCount).toBe(1);
    });
  });

  describe('cross analysis and traceability', () => {
    it('combines a terrain and a distance with the same rules', async () => {
      const url = `/api/statistics/performance?dimension=terrain&distances=1600&terrainConditionIds=${terrain.Bon}`;
      const matrix = await get<PerformanceMatrix>(url);
      expect(row(matrix, alpha)?.cells[terrain.Bon ?? 0]).toMatchObject({
        raceCount: 1,
        winCount: 1,
      });
      expect(row(matrix, bravo)?.cells[terrain.Bon ?? 0]).toMatchObject({
        raceCount: 1,
        placeCount: 1,
      });
    });

    it('lists exactly the participations behind a cell', async () => {
      const page = await get<Page<ParticipationDetail>>(
        `/api/participations?stallionIds=${alpha}&terrainConditionIds=${terrain.Bon}`,
      );
      expect(page.total).toBe(2);
      expect(
        page.items.map((item) => [item.horseName, item.finishPosition, item.raceDate]),
      ).toEqual([
        ['A2', 1, '2026-02-05'],
        ['A1', 1, '2026-01-10'],
      ]);
    });

    it('filters on a date range', async () => {
      const matrix = await get<PerformanceMatrix>(
        '/api/statistics/performance?dimension=terrain&from=2026-02-01',
      );
      expect(row(matrix, alpha)?.total.raceCount).toBe(2);
    });
  });

  describe('rankings, trends and overview', () => {
    it('ranks stallions on win rate and on average finish position', async () => {
      const byWinRate = await get<StallionRankingEntry[]>(
        '/api/statistics/rankings?metric=winRate',
      );
      expect(byWinRate.map((entry) => entry.stallionName)).toEqual(['Alpha', 'Bravo']);
      const byAverage = await get<StallionRankingEntry[]>(
        '/api/statistics/rankings?metric=averageFinishPosition',
      );
      expect(byAverage.map((entry) => entry.stallionName)).toEqual(['Bravo', 'Alpha']);
      const filtered = await get<StallionRankingEntry[]>('/api/statistics/rankings?minRaces=4');
      expect(filtered.map((entry) => entry.stallionName)).toEqual(['Alpha']);
    });

    it('computes monthly trends', async () => {
      const trends = await get<StallionTrend[]>(`/api/statistics/trends?stallionIds=${alpha}`);
      expect(trends[0]?.points.map((point) => [point.period, point.metrics.raceCount])).toEqual([
        ['2026-01-01', 3],
        ['2026-02-01', 2],
      ]);
    });

    it('summarizes the volumes for the dashboard', async () => {
      const overview = await get<StatisticsOverview>('/api/statistics/overview');
      expect(overview).toEqual({
        stallionCount: 3,
        horseCount: 3,
        raceCount: 4,
        participationCount: 8,
        firstRaceDate: '2026-01-10',
        lastRaceDate: '2026-02-15',
      });
    });

    it('returns the reference average of each column, all stallions together', async () => {
      const matrix = await get<PerformanceMatrix>('/api/statistics/performance?dimension=terrain');
      // Bon: Alpha 1, 1 ; Bravo 3, 2 -> 4 races, 2 wins, 2 places, average 7 / 4
      expect(matrix.average.cells[terrain.Bon ?? 0]).toEqual({
        raceCount: 4,
        winCount: 2,
        placeCount: 2,
        winRate: 0.5,
        placeRate: 0.5,
        averageFinishPosition: 1.75,
      });
      expect(matrix.average.total).toMatchObject({
        raceCount: 8,
        winCount: 3,
        placeCount: 3,
        averageFinishPosition: 2.75,
      });
    });
  });
});
