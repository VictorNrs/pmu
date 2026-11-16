import type {
  DistanceUsage,
  Page,
  RaceDetail,
  RaceListQuery,
  RaceParticipation,
  RaceSummary,
} from '@pmu/shared';
import { Prisma } from '../../generated/prisma/client';
import type { Database } from '../../shared/database/prisma-client';
import { toIsoDate } from '../../shared/utils/iso-date';

interface RaceSummaryRow extends Omit<RaceSummary, 'raceDate'> {
  raceDate: Date;
}

const RACE_SUMMARY_SELECT = Prisma.sql`
  SELECT
    r.id, r.race_date AS "raceDate", r.racecourse_id AS "racecourseId",
    rc.name AS "racecourseName", r.distance_meters AS "distanceMeters",
    r.terrain_condition_id AS "terrainConditionId", t.label AS "terrainConditionLabel",
    (SELECT COUNT(*)::int FROM participations p WHERE p.race_id = r.id) AS "participationCount"
  FROM races r
  JOIN racecourses rc ON rc.id = r.racecourse_id
  JOIN terrain_conditions t ON t.id = r.terrain_condition_id`;

/** Read side of races: listing, detail, and the distances in use. */
export class RaceRepository {
  constructor(private readonly database: Database) {}

  async list(query: RaceListQuery): Promise<Page<RaceSummary>> {
    const where = buildRaceConditions(query);
    const [rows, totals] = await Promise.all([
      this.database.$queryRaw<RaceSummaryRow[]>(Prisma.sql`
        ${RACE_SUMMARY_SELECT} ${where}
        ORDER BY r.race_date DESC, r.id DESC
        LIMIT ${query.limit} OFFSET ${query.offset}`),
      this.database.$queryRaw<{ total: number }[]>(
        Prisma.sql`SELECT COUNT(*)::int AS total FROM races r ${where}`,
      ),
    ]);
    return { items: rows.map(toRaceSummary), total: totals[0]?.total ?? 0 };
  }

  async findById(id: number): Promise<RaceDetail | undefined> {
    const [row] = await this.database.$queryRaw<RaceSummaryRow[]>(
      Prisma.sql`${RACE_SUMMARY_SELECT} WHERE r.id = ${id}`,
    );
    if (!row) return undefined;
    const participations = await this.database.$queryRaw<RaceParticipation[]>(Prisma.sql`
      SELECT p.id, p.horse_id AS "horseId", h.name AS "horseName",
        h.stallion_id AS "stallionId", s.name AS "stallionName",
        p.finish_position AS "finishPosition"
      FROM participations p
      JOIN horses h ON h.id = p.horse_id
      JOIN stallions s ON s.id = h.stallion_id
      WHERE p.race_id = ${id}
      ORDER BY p.finish_position, h.name_key`);
    return { ...toRaceSummary(row), participations };
  }

  async listDistances(): Promise<DistanceUsage[]> {
    return this.database.$queryRaw<DistanceUsage[]>(Prisma.sql`
      SELECT distance_meters AS "distanceMeters", COUNT(*)::int AS "raceCount"
      FROM races GROUP BY distance_meters ORDER BY distance_meters`);
  }
}

function buildRaceConditions(query: RaceListQuery): Prisma.Sql {
  const conditions: Prisma.Sql[] = [];
  if (query.from) conditions.push(Prisma.sql`r.race_date >= ${query.from}::date`);
  if (query.to) conditions.push(Prisma.sql`r.race_date <= ${query.to}::date`);
  if (query.terrainConditionId) {
    conditions.push(Prisma.sql`r.terrain_condition_id = ${query.terrainConditionId}`);
  }
  if (query.distanceMeters)
    conditions.push(Prisma.sql`r.distance_meters = ${query.distanceMeters}`);
  if (query.racecourseId) conditions.push(Prisma.sql`r.racecourse_id = ${query.racecourseId}`);
  if (query.horseId) {
    conditions.push(
      Prisma.sql`EXISTS (SELECT 1 FROM participations p WHERE p.race_id = r.id AND p.horse_id = ${query.horseId})`,
    );
  }
  return conditions.length ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` : Prisma.empty;
}

function toRaceSummary(row: RaceSummaryRow): RaceSummary {
  return { ...row, raceDate: toIsoDate(row.raceDate) };
}
