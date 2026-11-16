import type { RaceData } from '@pmu/shared';
import type { Prisma } from '../../generated/prisma/client';
import type { Database } from '../../shared/database/prisma-client';
import { fromIsoDate, toIsoDate } from '../../shared/utils/iso-date';
import { toNameKey } from '../../shared/utils/name-key';

type Transaction = Prisma.TransactionClient;

export interface SameDayParticipation {
  horseName: string;
  raceDate: string;
}

/** Write side of races: a race and its participations are always saved together. */
export class RaceWriter {
  constructor(private readonly database: Database) {}

  async transaction<T>(work: (transaction: Transaction) => Promise<T>): Promise<T> {
    return this.database.$transaction(work);
  }

  async create(transaction: Transaction, data: RaceData): Promise<number> {
    const racecourseId = await findOrCreateRacecourse(transaction, data.racecourseName);
    const race = await transaction.race.create({
      data: {
        raceDate: fromIsoDate(data.raceDate),
        racecourseId,
        distanceMeters: data.distanceMeters,
        terrainConditionId: data.terrainConditionId,
      },
    });
    await transaction.participation.createMany({
      data: data.participations.map((entry) => ({
        ...entry,
        raceId: race.id,
        raceDate: race.raceDate,
      })),
    });
    return race.id;
  }

  /** Replaces the race conditions and its list of participations. */
  async update(transaction: Transaction, id: number, data: RaceData): Promise<void> {
    const racecourseId = await findOrCreateRacecourse(transaction, data.racecourseName);
    const race = await transaction.race.update({
      where: { id },
      data: {
        raceDate: fromIsoDate(data.raceDate),
        racecourseId,
        distanceMeters: data.distanceMeters,
        terrainConditionId: data.terrainConditionId,
      },
    });
    const horseIds = data.participations.map((entry) => entry.horseId);
    await transaction.participation.deleteMany({
      where: { raceId: id, horseId: { notIn: horseIds } },
    });
    for (const entry of data.participations) {
      await transaction.participation.upsert({
        where: { raceId_horseId: { raceId: id, horseId: entry.horseId } },
        update: { finishPosition: entry.finishPosition },
        create: { ...entry, raceId: id, raceDate: race.raceDate },
      });
    }
  }

  async delete(id: number): Promise<void> {
    await this.database.race.delete({ where: { id } });
  }

  async deleteParticipation(id: number): Promise<void> {
    await this.database.participation.delete({ where: { id } });
  }

  async countExistingHorses(transaction: Transaction, horseIds: number[]): Promise<number> {
    return transaction.horse.count({ where: { id: { in: horseIds } } });
  }

  async findDistance(
    transaction: Transaction,
    distanceMeters: number,
  ): Promise<{ isActive: boolean } | null> {
    return transaction.raceDistance.findUnique({
      where: { meters: distanceMeters },
      select: { isActive: true },
    });
  }

  async terrainConditionExists(transaction: Transaction, id: number): Promise<boolean> {
    return (await transaction.terrainCondition.count({ where: { id } })) > 0;
  }

  /** Participations of these horses on that day in another race. */
  async findSameDayParticipations(
    transaction: Transaction,
    horseIds: number[],
    raceDate: string,
    excludedRaceId?: number,
  ): Promise<SameDayParticipation[]> {
    const rows = await transaction.participation.findMany({
      where: {
        horseId: { in: horseIds },
        raceDate: fromIsoDate(raceDate),
        ...(excludedRaceId ? { raceId: { not: excludedRaceId } } : {}),
      },
      select: { raceDate: true, horse: { select: { name: true } } },
    });
    return rows.map((row) => ({ horseName: row.horse.name, raceDate: toIsoDate(row.raceDate) }));
  }
}

async function findOrCreateRacecourse(transaction: Transaction, name: string): Promise<number> {
  const racecourse = await transaction.racecourse.upsert({
    where: { nameKey: toNameKey(name) },
    update: {},
    create: { name, nameKey: toNameKey(name) },
  });
  return racecourse.id;
}
