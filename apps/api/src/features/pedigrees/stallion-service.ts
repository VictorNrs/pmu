import type { Stallion, StallionData } from '@pmu/shared';
import { ConflictError, NotFoundError } from '../../shared/errors/application-errors';
import type { StallionRepository } from './stallion-repository';

export class StallionService {
  constructor(private readonly stallions: StallionRepository) {}

  async list(search?: string): Promise<Stallion[]> {
    return this.stallions.list(search);
  }

  async get(id: number): Promise<Stallion> {
    const stallion = await this.stallions.findById(id);
    if (!stallion) throw new NotFoundError('Étalon introuvable.');
    return stallion;
  }

  async create(data: StallionData): Promise<Stallion> {
    await this.assertNameAvailable(data.name);
    return this.get(await this.stallions.create(data));
  }

  async update(id: number, data: StallionData): Promise<Stallion> {
    await this.get(id);
    await this.assertNameAvailable(data.name, id);
    await this.stallions.update(id, data);
    return this.get(id);
  }

  /** A stallion with descendants cannot be deleted: their results would lose their sire. */
  async delete(id: number): Promise<void> {
    const stallion = await this.get(id);
    if (stallion.horseCount > 0) {
      throw new ConflictError(
        `Impossible de supprimer ${stallion.name} : ${stallion.horseCount} cheval(aux) y sont rattaché(s).`,
      );
    }
    await this.stallions.delete(id);
  }

  private async assertNameAvailable(name: string, currentId?: number): Promise<void> {
    const existingId = await this.stallions.findIdByName(name);
    if (existingId !== undefined && existingId !== currentId) {
      throw new ConflictError(`Un étalon nommé « ${name} » existe déjà.`);
    }
  }
}
