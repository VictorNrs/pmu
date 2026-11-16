import { z } from 'zod';
import { nameSchema } from './common';
import { MAX_DISTANCE_METERS, MIN_DISTANCE_METERS } from './race';

/** A distance of the reference list: races can only use these values. */
export const raceDistanceInputSchema = z.object({
  distanceMeters: z.number().int().min(MIN_DISTANCE_METERS).max(MAX_DISTANCE_METERS),
  isActive: z.boolean().default(true),
});
export type RaceDistanceInput = z.input<typeof raceDistanceInputSchema>;

export const raceDistanceUpdateSchema = z.object({ isActive: z.boolean() });

export const distanceParamsSchema = z.object({
  distanceMeters: z.coerce.number().int().positive(),
});

export interface RaceDistance {
  distanceMeters: number;
  /** Inactive distances are no longer offered when entering a race. */
  isActive: boolean;
  raceCount: number;
}

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
