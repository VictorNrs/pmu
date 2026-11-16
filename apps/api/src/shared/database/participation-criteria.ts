import type { PerformanceFilters } from '@pmu/shared';
import { Prisma } from '../../generated/prisma/client';

/**
 * FROM clause shared by every query working on participations.
 * Aliases: p = participations, h = horses, r = races.
 */
export const PARTICIPATION_SOURCE = Prisma.sql`
  participations p
  JOIN horses h ON h.id = p.horse_id
  JOIN races r ON r.id = p.race_id`;

/**
 * Single translation of the filters into SQL. Statistics and the participation list
 * both use it, so a statistic can always be traced back to the exact participations
 * that produced it.
 */
export function buildParticipationCriteria(
  filters: PerformanceFilters,
  extraConditions: Prisma.Sql[] = [],
): Prisma.Sql {
  const conditions: Prisma.Sql[] = [...extraConditions];
  if (filters.stallionIds?.length) {
    conditions.push(Prisma.sql`h.stallion_id IN (${Prisma.join(filters.stallionIds)})`);
  }
  if (filters.terrainConditionIds?.length) {
    conditions.push(
      Prisma.sql`r.terrain_condition_id IN (${Prisma.join(filters.terrainConditionIds)})`,
    );
  }
  if (filters.distances?.length) {
    conditions.push(Prisma.sql`r.distance_meters IN (${Prisma.join(filters.distances)})`);
  }
  if (filters.from) conditions.push(Prisma.sql`r.race_date >= ${filters.from}::date`);
  if (filters.to) conditions.push(Prisma.sql`r.race_date <= ${filters.to}::date`);
  if (conditions.length === 0) return Prisma.empty;
  return Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;
}
