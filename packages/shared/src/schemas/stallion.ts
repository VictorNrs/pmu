import { z } from 'zod';
import { nameSchema } from './common';

const currentYear = new Date().getFullYear();

export const stallionInputSchema = z.object({
  name: nameSchema,
  birthYear: z.number().int().min(1900).max(currentYear).nullable().default(null),
  country: z.string().trim().max(60).nullable().default(null),
  notes: z.string().trim().max(2000).nullable().default(null),
});
export type StallionInput = z.input<typeof stallionInputSchema>;
export type StallionData = z.output<typeof stallionInputSchema>;

export interface Stallion {
  id: number;
  name: string;
  birthYear: number | null;
  country: string | null;
  notes: string | null;
  horseCount: number;
  participationCount: number;
}
