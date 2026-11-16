import type { RaceDistance } from '@pmu/shared';
import type { Database } from '../../shared/database/prisma-client';
import { ConflictError, NotFoundError } from '../../shared/errors/application-errors';

/** Administration of the reference list of distances (one column each in the distance table). */
export class RaceDistanceService {
  constructor(private readonly database: Database) {}

  async list(): Promise<RaceDistance[]> {
    const rows = await this.database.raceDistance.findMany({
      include: { _count: { select: { races: true } } },
      orderBy: { meters: 'asc' },
    });
    return rows.map(({ meters, isActive, _count }) => ({
      distanceMeters: meters,
      isActive,
      raceCount: _count.races,
    }));
  }

  async create(distanceMeters: number, isActive: boolean): Promise<void> {
    const existing = await this.database.raceDistance.count({ where: { meters: distanceMeters } });
    if (existing > 0) throw new ConflictError(`La distance ${distanceMeters} m existe déjà.`);
    await this.database.raceDistance.create({ data: { meters: distanceMeters, isActive } });
  }

  async setActive(distanceMeters: number, isActive: boolean): Promise<void> {
    await this.findRaceCount(distanceMeters);
    await this.database.raceDistance.update({
      where: { meters: distanceMeters },
      data: { isActive },
    });
  }

  /** A distance used by races cannot be deleted; it can be deactivated instead. */
  async delete(distanceMeters: number): Promise<void> {
    const raceCount = await this.findRaceCount(distanceMeters);
    if (raceCount > 0) {
      throw new ConflictError(
        `La distance ${distanceMeters} m est utilisée par ${raceCount} course(s). Désactivez-la plutôt que de la supprimer.`,
      );
    }
    await this.database.raceDistance.delete({ where: { meters: distanceMeters } });
  }

  private async findRaceCount(distanceMeters: number): Promise<number> {
    const distance = await this.database.raceDistance.findUnique({
      where: { meters: distanceMeters },
      include: { _count: { select: { races: true } } },
    });
    if (!distance) throw new NotFoundError('Distance introuvable.');
    return distance._count.races;
  }
}
