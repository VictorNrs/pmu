import type { Racecourse, TerrainCondition, TerrainConditionData } from '@pmu/shared';
import type { Database } from '../../shared/database/prisma-client';
import { ConflictError, NotFoundError } from '../../shared/errors/application-errors';
import { toNameKey } from '../../shared/utils/name-key';

/** Administration of the terrain conditions and racecourses used by races. */
export class ReferenceDataService {
  constructor(private readonly database: Database) {}

  async listTerrainConditions(): Promise<TerrainCondition[]> {
    const rows = await this.database.terrainCondition.findMany({
      include: { _count: { select: { races: true } } },
      orderBy: [{ sortOrder: 'asc' }, { labelKey: 'asc' }],
    });
    return rows.map(({ id, label, sortOrder, isActive, _count }) => ({
      id,
      label,
      sortOrder,
      isActive,
      raceCount: _count.races,
    }));
  }

  async createTerrainCondition(data: TerrainConditionData): Promise<void> {
    await this.assertTerrainLabelAvailable(data.label);
    await this.database.terrainCondition.create({
      data: { ...data, labelKey: toNameKey(data.label) },
    });
  }

  async updateTerrainCondition(id: number, data: TerrainConditionData): Promise<void> {
    await this.findTerrainCondition(id);
    await this.assertTerrainLabelAvailable(data.label, id);
    await this.database.terrainCondition.update({
      where: { id },
      data: { ...data, labelKey: toNameKey(data.label) },
    });
  }

  /** A terrain used by races cannot be deleted; it can be deactivated instead. */
  async deleteTerrainCondition(id: number): Promise<void> {
    const raceCount = await this.database.race.count({ where: { terrainConditionId: id } });
    await this.findTerrainCondition(id);
    if (raceCount > 0) {
      throw new ConflictError(
        `Ce terrain est utilisé par ${raceCount} course(s). Désactivez-le plutôt que de le supprimer.`,
      );
    }
    await this.database.terrainCondition.delete({ where: { id } });
  }

  async listRacecourses(): Promise<Racecourse[]> {
    const rows = await this.database.racecourse.findMany({
      include: { _count: { select: { races: true } } },
      orderBy: { nameKey: 'asc' },
    });
    return rows.map(({ id, name, _count }) => ({ id, name, raceCount: _count.races }));
  }

  async renameRacecourse(id: number, name: string): Promise<void> {
    const existing = await this.database.racecourse.findUnique({
      where: { nameKey: toNameKey(name) },
    });
    if (existing && existing.id !== id)
      throw new ConflictError(`L'hippodrome « ${name} » existe déjà.`);
    await this.database.racecourse.update({
      where: { id },
      data: { name, nameKey: toNameKey(name) },
    });
  }

  async deleteRacecourse(id: number): Promise<void> {
    const raceCount = await this.database.race.count({ where: { racecourseId: id } });
    if (raceCount > 0) {
      throw new ConflictError(`Cet hippodrome est utilisé par ${raceCount} course(s).`);
    }
    await this.database.racecourse.delete({ where: { id } });
  }

  private async findTerrainCondition(id: number): Promise<void> {
    const count = await this.database.terrainCondition.count({ where: { id } });
    if (count === 0) throw new NotFoundError('État du terrain introuvable.');
  }

  private async assertTerrainLabelAvailable(label: string, currentId?: number): Promise<void> {
    const existing = await this.database.terrainCondition.findUnique({
      where: { labelKey: toNameKey(label) },
    });
    if (existing && existing.id !== currentId) {
      throw new ConflictError(`L'état de terrain « ${label} » existe déjà.`);
    }
  }
}
