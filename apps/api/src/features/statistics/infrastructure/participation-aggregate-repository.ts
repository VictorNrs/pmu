import type { PerformanceDimension, PerformanceFilters } from '@pmu/shared';
import { Prisma } from '../../../generated/prisma/client';
import {
  PARTICIPATION_SOURCE,
  buildParticipationCriteria,
} from '../../../shared/database/participation-criteria';
import type { Database } from '../../../shared/database/prisma-client';
import type { GroupCounts } from '../domain/performance-matrix';
import {
  PLACE_POSITIONS,
  WIN_POSITION,
  type ParticipationCounts,
} from '../domain/performance-metrics';

export interface StallionCounts extends ParticipationCounts {
  stallionId: number;
}

export interface StallionPeriodCounts extends StallionCounts {
  /** First day of the month, YYYY-MM-DD. */
  period: string;
}

interface AggregateRow extends StallionCounts {
  groupKey: string | number | null;
}

/** Whitelisted grouping expressions: never interpolate user input here. */
const GROUP_EXPRESSIONS = {
  none: Prisma.sql`NULL::int`,
  terrain: Prisma.sql`r.terrain_condition_id`,
  distance: Prisma.sql`r.distance_meters`,
  month: Prisma.sql`to_char(date_trunc('month', r.race_date), 'YYYY-MM-DD')`,
} as const;

/**
 * Counts participations per stallion with PostgreSQL. The classification of finish
 * positions comes from the domain constants, so SQL and domain cannot diverge.
 */
export class ParticipationAggregateRepository {
  constructor(private readonly database: Database) {}

  async countByStallion(filters: PerformanceFilters): Promise<StallionCounts[]> {
    const rows = await this.aggregate('none', filters);
    return rows.map(({ groupKey: _groupKey, ...counts }) => counts);
  }

  async countByStallionAndColumn(
    dimension: PerformanceDimension,
    filters: PerformanceFilters,
  ): Promise<GroupCounts[]> {
    const rows = await this.aggregate(dimension, filters);
    return rows.map(({ groupKey, ...counts }) => ({ ...counts, columnKey: Number(groupKey) }));
  }

  async countByStallionAndMonth(filters: PerformanceFilters): Promise<StallionPeriodCounts[]> {
    const rows = await this.aggregate('month', filters);
    return rows.map(({ groupKey, ...counts }) => ({ ...counts, period: String(groupKey) }));
  }

  private async aggregate(
    grouping: keyof typeof GROUP_EXPRESSIONS,
    filters: PerformanceFilters,
  ): Promise<AggregateRow[]> {
    return this.database.$queryRaw<AggregateRow[]>(Prisma.sql`
      SELECT
        h.stallion_id AS "stallionId",
        ${GROUP_EXPRESSIONS[grouping]} AS "groupKey",
        COUNT(*)::int AS "raceCount",
        COUNT(*) FILTER (WHERE p.finish_position = ${WIN_POSITION})::int AS "winCount",
        COUNT(*) FILTER (WHERE p.finish_position IN (${Prisma.join(PLACE_POSITIONS)}))::int
          AS "placeCount",
        COALESCE(SUM(p.finish_position), 0)::int AS "finishPositionSum"
      FROM ${PARTICIPATION_SOURCE}
      ${buildParticipationCriteria(filters)}
      GROUP BY 1, 2
      ORDER BY 1, 2`);
  }
}
