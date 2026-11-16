import { z } from 'zod';
import { nameSchema } from './common';

export const terrainConditionInputSchema = z.object({
  label: nameSchema,
  sortOrder: z.number().int().min(0).max(1000),
  isActive: z.boolean().default(true),
});
export type TerrainConditionInput = z.input<typeof terrainConditionInputSchema>;
export type TerrainConditionData = z.output<typeof terrainConditionInputSchema>;

export interface TerrainCondition {
  id: number;
  label: string;
  sortOrder: number;
  isActive: boolean;
  raceCount: number;
}

export const racecourseInputSchema = z.object({ name: nameSchema });
export type RacecourseInput = z.input<typeof racecourseInputSchema>;

export interface Racecourse {
  id: number;
  name: string;
  raceCount: number;
}
