import type { Stallion, StallionData } from '@pmu/shared';
import { Prisma } from '../../generated/prisma/client';
import type { Database } from '../../shared/database/prisma-client';
import { toNameKey } from '../../shared/utils/name-key';

interface StallionRow {
  id: number;
  name: string;
  birthYear: number | null;
  country: string | null;
  notes: string | null;
  horseCount: number;
  participationCount: number;
}

export class StallionRepository {
  constructor(private readonly database: Database) {}

  async list(search?: string): Promise<Stallion[]> {
    const condition = search
      ? Prisma.sql`WHERE s.name_key LIKE ${`%${toNameKey(search)}%`}`
      : Prisma.empty;
    return this.query(condition);
  }

  async findById(id: number): Promise<Stallion | undefined> {
    const [stallion] = await this.query(Prisma.sql`WHERE s.id = ${id}`);
    return stallion;
  }

  async findIdByName(name: string): Promise<number | undefined> {
    const stallion = await this.database.stallion.findUnique({
      where: { nameKey: toNameKey(name) },
      select: { id: true },
    });
    return stallion?.id;
  }

  async create(data: StallionData): Promise<number> {
    const created = await this.database.stallion.create({
      data: { ...data, nameKey: toNameKey(data.name) },
    });
    return created.id;
  }

  async update(id: number, data: StallionData): Promise<void> {
    await this.database.stallion.update({
      where: { id },
      data: { ...data, nameKey: toNameKey(data.name) },
    });
  }

  async delete(id: number): Promise<void> {
    await this.database.stallion.delete({ where: { id } });
  }

  private async query(condition: Prisma.Sql): Promise<Stallion[]> {
    return this.database.$queryRaw<StallionRow[]>(Prisma.sql`
      SELECT
        s.id, s.name, s.birth_year AS "birthYear", s.country, s.notes,
        COUNT(DISTINCT h.id)::int AS "horseCount",
        COUNT(p.id)::int AS "participationCount"
      FROM stallions s
      LEFT JOIN horses h ON h.stallion_id = s.id
      LEFT JOIN participations p ON p.horse_id = h.id
      ${condition}
      GROUP BY s.id
      ORDER BY s.name_key`);
  }
}
