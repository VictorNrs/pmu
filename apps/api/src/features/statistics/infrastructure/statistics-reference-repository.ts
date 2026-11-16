import type { PerformanceDimension, StatisticsOverview } from '@pmu/shared';
import type { Database } from '../../../shared/database/prisma-client';
import { toIsoDate } from '../../../shared/utils/iso-date';
import { formatDistance, type ColumnOption } from '../domain/performance-columns';
import type { StallionReference } from '../domain/performance-matrix';

/** Reference data the statistics need to build complete grids (rows and columns). */
export class StatisticsReferenceRepository {
  constructor(private readonly database: Database) {}

  async findStallions(stallionIds?: number[]): Promise<StallionReference[]> {
    return this.database.stallion.findMany({
      where: stallionIds?.length ? { id: { in: stallionIds } } : {},
      select: { id: true, name: true },
      orderBy: { nameKey: 'asc' },
    });
  }

  async countSources(): Promise<StatisticsOverview> {
    const [stallionCount, horseCount, raceCount, participationCount, dates] = await Promise.all([
      this.database.stallion.count(),
      this.database.horse.count(),
      this.database.race.count(),
      this.database.participation.count(),
      this.database.race.aggregate({ _min: { raceDate: true }, _max: { raceDate: true } }),
    ]);
    return {
      stallionCount,
      horseCount,
      raceCount,
      participationCount,
      firstRaceDate: dates._min.raceDate ? toIsoDate(dates._min.raceDate) : null,
      lastRaceDate: dates._max.raceDate ? toIsoDate(dates._max.raceDate) : null,
    };
  }

  /** Column options of a table, in display order. */
  async findColumnOptions(dimension: PerformanceDimension): Promise<ColumnOption[]> {
    if (dimension === 'distance') {
      const distances = await this.database.raceDistance.findMany({ orderBy: { meters: 'asc' } });
      return distances.map(({ meters, isActive }) => ({
        key: meters,
        label: formatDistance(meters),
        isActive,
      }));
    }
    const terrains = await this.database.terrainCondition.findMany({
      orderBy: [{ sortOrder: 'asc' }, { labelKey: 'asc' }],
    });
    return terrains.map(({ id, label, isActive }) => ({ key: id, label, isActive }));
  }
}
