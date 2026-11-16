import { z } from 'zod';
import { idSchema, nameSchema } from './common';

export const horseInputSchema = z.object({
  name: nameSchema,
  stallionId: idSchema,
});
export type HorseInput = z.input<typeof horseInputSchema>;
export type HorseData = z.output<typeof horseInputSchema>;

export const horseListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  stallionId: idSchema.optional(),
});
export type HorseListQuery = z.infer<typeof horseListQuerySchema>;

export interface Horse {
  id: number;
  name: string;
  stallionId: number;
  stallionName: string;
  participationCount: number;
}
