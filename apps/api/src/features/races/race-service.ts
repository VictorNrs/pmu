import type {
  DistanceUsage,
  Page,
  RaceData,
  RaceDetail,
  RaceListQuery,
  RaceSummary,
} from '@pmu/shared';
import type { Prisma } from '../../generated/prisma/client';
import {
  ConflictError,
  InvalidRequestError,
  NotFoundError,
} from '../../shared/errors/application-errors';
import type { RaceRepository } from './race-repository';
import type { RaceWriter } from './race-writer';

export class RaceService {
  constructor(
    private readonly races: RaceRepository,
    private readonly writer: RaceWriter,
  ) {}

  async list(query: RaceListQuery): Promise<Page<RaceSummary>> {
    return this.races.list(query);
  }

  async listDistances(): Promise<DistanceUsage[]> {
    return this.races.listDistances();
  }

  async get(id: number): Promise<RaceDetail> {
    const race = await this.races.findById(id);
    if (!race) throw new NotFoundError('Course introuvable.');
    return race;
  }

  async create(data: RaceData): Promise<RaceDetail> {
    const id = await this.writer.transaction(async (transaction) => {
      await this.assertValid(transaction, data);
      return this.writer.create(transaction, data);
    });
    return this.get(id);
  }

  async update(id: number, data: RaceData): Promise<RaceDetail> {
    await this.get(id);
    await this.writer.transaction(async (transaction) => {
      await this.assertValid(transaction, data, id);
      await this.writer.update(transaction, id, data);
    });
    return this.get(id);
  }

  async delete(id: number): Promise<void> {
    await this.get(id);
    await this.writer.delete(id);
  }

  async deleteParticipation(id: number): Promise<void> {
    await this.writer.deleteParticipation(id);
  }

  private async assertValid(
    transaction: Prisma.TransactionClient,
    data: RaceData,
    raceId?: number,
  ): Promise<void> {
    if (!(await this.writer.terrainConditionExists(transaction, data.terrainConditionId))) {
      throw new InvalidRequestError("L'état du terrain sélectionné n'existe pas.");
    }
    const horseIds = data.participations.map((entry) => entry.horseId);
    if ((await this.writer.countExistingHorses(transaction, horseIds)) !== horseIds.length) {
      throw new InvalidRequestError("Au moins un des chevaux sélectionnés n'existe pas.");
    }
    await this.assertOneRacePerDay(transaction, horseIds, data.raceDate, raceId);
  }

  /**
   * Duplicate guard: a horse runs at most one race per day. Without a race number,
   * this is what prevents the same result from being entered twice.
   * PostgreSQL enforces the same rule (unique horse_id + race_date) as a safety net.
   */
  private async assertOneRacePerDay(
    transaction: Prisma.TransactionClient,
    horseIds: number[],
    raceDate: string,
    raceId?: number,
  ): Promise<void> {
    const conflicts = await this.writer.findSameDayParticipations(
      transaction,
      horseIds,
      raceDate,
      raceId,
    );
    if (conflicts.length > 0) {
      const names = conflicts.map((conflict) => conflict.horseName).join(', ');
      throw new ConflictError(
        `Déjà enregistré : ${names} a déjà une course le ${raceDate}. Un cheval ne court qu'une course par jour.`,
      );
    }
  }
}
