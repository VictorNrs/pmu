import type { Horse, HorseData, HorseListQuery } from '@pmu/shared';
import { Prisma } from '../../generated/prisma/client';
import type { Database } from '../../shared/database/prisma-client';
import { toNameKey } from '../../shared/utils/name-key';

export class HorseRepository {
  constructor(private readonly database: Database) {}

  async list(query: HorseListQuery): Promise<Horse[]> {
    const conditions: Prisma.Sql[] = [];
    if (query.search)
      conditions.push(Prisma.sql`h.name_key LIKE ${`%${toNameKey(query.search)}%`}`);
    if (query.stallionId) conditions.push(Prisma.sql`h.stallion_id = ${query.stallionId}`);
    return this.query(conditions);
  }

  async findById(id: number): Promise<Horse | undefined> {
    const [horse] = await this.query([Prisma.sql`h.id = ${id}`]);
    return horse;
  }

  async findIdByName(name: string): Promise<number | undefined> {
    const horse = await this.database.horse.findUnique({
      where: { nameKey: toNameKey(name) },
      select: { id: true },
    });
    return horse?.id;
  }

  async stallionExists(stallionId: number): Promise<boolean> {
    return (await this.database.stallion.count({ where: { id: stallionId } })) > 0;
  }

  async create(data: HorseData): Promise<number> {
    const created = await this.database.horse.create({
      data: { ...data, nameKey: toNameKey(data.name) },
    });
    return created.id;
  }

  async update(id: number, data: HorseData): Promise<void> {
    await this.database.horse.update({
      where: { id },
      data: { ...data, nameKey: toNameKey(data.name) },
    });
  }

  async delete(id: number): Promise<void> {
    await this.database.horse.delete({ where: { id } });
  }

  private async query(conditions: Prisma.Sql[]): Promise<Horse[]> {
    const where = conditions.length
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
      : Prisma.empty;
    return this.database.$queryRaw<Horse[]>(Prisma.sql`
      SELECT
        h.id, h.name, h.stallion_id AS "stallionId", s.name AS "stallionName",
        COUNT(p.id)::int AS "participationCount"
      FROM horses h
      JOIN stallions s ON s.id = h.stallion_id
      LEFT JOIN participations p ON p.horse_id = h.id
      ${where}
      GROUP BY h.id, s.name
      ORDER BY h.name_key`);
  }
}
