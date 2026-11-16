import type { Horse, HorseData, HorseListQuery } from '@pmu/shared';
import {
  ConflictError,
  InvalidRequestError,
  NotFoundError,
} from '../../shared/errors/application-errors';
import type { HorseRepository } from './horse-repository';

export class HorseService {
  constructor(private readonly horses: HorseRepository) {}

  async list(query: HorseListQuery): Promise<Horse[]> {
    return this.horses.list(query);
  }

  async get(id: number): Promise<Horse> {
    const horse = await this.horses.findById(id);
    if (!horse) throw new NotFoundError('Cheval introuvable.');
    return horse;
  }

  async create(data: HorseData): Promise<Horse> {
    await this.assertValid(data);
    return this.get(await this.horses.create(data));
  }

  async update(id: number, data: HorseData): Promise<Horse> {
    await this.get(id);
    await this.assertValid(data, id);
    await this.horses.update(id, data);
    return this.get(id);
  }

  /** Deleting a horse with results would silently change the statistics. */
  async delete(id: number): Promise<void> {
    const horse = await this.get(id);
    if (horse.participationCount > 0) {
      throw new ConflictError(
        `Impossible de supprimer ${horse.name} : ${horse.participationCount} résultat(s) enregistré(s). Supprimez d'abord ses résultats.`,
      );
    }
    await this.horses.delete(id);
  }

  private async assertValid(data: HorseData, currentId?: number): Promise<void> {
    if (!(await this.horses.stallionExists(data.stallionId))) {
      throw new InvalidRequestError("L'étalon sélectionné n'existe pas.");
    }
    const existingId = await this.horses.findIdByName(data.name);
    if (existingId !== undefined && existingId !== currentId) {
      throw new ConflictError(`Un cheval nommé « ${data.name} » existe déjà.`);
    }
  }
}
