import type { StatisticsOverview } from '@pmu/shared';
import type { Database } from '../../../shared/database/prisma-client';
import { toIsoDate } from '../../../shared/utils/iso-date';
import type { StallionReference } from '../domain/performance-matrix';

export type SourceVolumes = Omit<StatisticsOverview, 'global'>;

export interface TerrainReference {
  id: number;
  label: string;
  isActive: boolean;
}

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

  async countSources(): Promise<SourceVolumes> {
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

  async findTerrainConditions(): Promise<TerrainReference[]> {
    return this.database.terrainCondition.findMany({
      select: { id: true, label: true, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { labelKey: 'asc' }],
    });
  }
}
