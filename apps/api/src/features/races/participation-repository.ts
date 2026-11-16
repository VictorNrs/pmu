import type { Page, ParticipationDetail, ParticipationListQuery } from '@pmu/shared';
import { Prisma } from '../../generated/prisma/client';
import {
  PARTICIPATION_SOURCE,
  buildParticipationCriteria,
} from '../../shared/database/participation-criteria';
import type { Database } from '../../shared/database/prisma-client';
import { toIsoDate } from '../../shared/utils/iso-date';

interface ParticipationRow extends Omit<ParticipationDetail, 'raceDate'> {
  raceDate: Date;
}

/**
 * Individual results matching the same criteria as the statistics:
 * this is how a figure of a table is traced back to its races.
 */
export class ParticipationRepository {
  constructor(private readonly database: Database) {}

  async list(query: ParticipationListQuery): Promise<Page<ParticipationDetail>> {
    const extraConditions: Prisma.Sql[] = [];
    if (query.horseId) extraConditions.push(Prisma.sql`p.horse_id = ${query.horseId}`);
    if (query.raceId) extraConditions.push(Prisma.sql`p.race_id = ${query.raceId}`);
    const where = buildParticipationCriteria(query, extraConditions);
    const [rows, totals] = await Promise.all([
      this.database.$queryRaw<ParticipationRow[]>(Prisma.sql`
        SELECT
          p.id, p.race_id AS "raceId", p.race_date AS "raceDate",
          p.horse_id AS "horseId", h.name AS "horseName",
          h.stallion_id AS "stallionId", s.name AS "stallionName",
          p.finish_position AS "finishPosition",
          rc.name AS "racecourseName", r.distance_meters AS "distanceMeters",
          r.terrain_condition_id AS "terrainConditionId", t.label AS "terrainConditionLabel"
        FROM ${PARTICIPATION_SOURCE}
        JOIN stallions s ON s.id = h.stallion_id
        JOIN racecourses rc ON rc.id = r.racecourse_id
        JOIN terrain_conditions t ON t.id = r.terrain_condition_id
        ${where}
        ORDER BY p.race_date DESC, p.race_id DESC, p.finish_position
        LIMIT ${query.limit}`),
      this.database.$queryRaw<{ total: number }[]>(
        Prisma.sql`SELECT COUNT(*)::int AS total FROM ${PARTICIPATION_SOURCE} ${where}`,
      ),
    ]);
    return {
      items: rows.map((row) => ({ ...row, raceDate: toIsoDate(row.raceDate) })),
      total: totals[0]?.total ?? 0,
    };
  }
}
