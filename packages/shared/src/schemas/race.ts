import { z } from 'zod';
import { idSchema, isoDateSchema, nameSchema } from './common';

export const MIN_DISTANCE_METERS = 400;
export const MAX_DISTANCE_METERS = 8000;
export const MAX_FINISH_POSITION = 40;

export const participationInputSchema = z.object({
  horseId: idSchema,
  finishPosition: z.number().int().min(1).max(MAX_FINISH_POSITION),
});
export type ParticipationInput = z.infer<typeof participationInputSchema>;

export const raceInputSchema = z.object({
  raceDate: isoDateSchema,
  racecourseName: nameSchema,
  distanceMeters: z.number().int().min(MIN_DISTANCE_METERS).max(MAX_DISTANCE_METERS),
  terrainConditionId: idSchema,
  participations: z
    .array(participationInputSchema)
    .min(1, 'Au moins un cheval doit être renseigné')
    .refine(
      (entries) => new Set(entries.map((entry) => entry.horseId)).size === entries.length,
      'Un même cheval ne peut pas apparaître deux fois dans une course',
    ),
});
export type RaceInput = z.input<typeof raceInputSchema>;
export type RaceData = z.output<typeof raceInputSchema>;

export interface RaceParticipation {
  id: number;
  horseId: number;
  horseName: string;
  stallionId: number;
  stallionName: string;
  finishPosition: number;
}

export interface RaceSummary {
  id: number;
  raceDate: string;
  racecourseId: number;
  racecourseName: string;
  distanceMeters: number;
  terrainConditionId: number;
  terrainConditionLabel: string;
  participationCount: number;
}

export interface RaceDetail extends RaceSummary {
  participations: RaceParticipation[];
}

/** One horse's result in one race, with the race conditions it was obtained in. */
export interface ParticipationDetail extends RaceParticipation {
  raceId: number;
  raceDate: string;
  racecourseName: string;
  distanceMeters: number;
  terrainConditionId: number;
  terrainConditionLabel: string;
}

export const raceListQuerySchema = z.object({
  from: isoDateSchema.optional(),
  to: isoDateSchema.optional(),
  terrainConditionId: idSchema.optional(),
  distanceMeters: z.coerce.number().int().positive().optional(),
  racecourseId: idSchema.optional(),
  horseId: idSchema.optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type RaceListQuery = z.infer<typeof raceListQuerySchema>;

export interface Page<T> {
  items: T[];
  total: number;
}
