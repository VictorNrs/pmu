import { z } from 'zod';

export const idSchema = z.coerce.number().int().positive();
export const idParamsSchema = z.object({ id: idSchema });
export type IdParams = z.infer<typeof idParamsSchema>;

/** Trimmed, single-spaced, non-empty label (names of stallions, horses, racecourses...). */
export const nameSchema = z
  .string()
  .transform((value) => value.trim().replace(/\s+/g, ' '))
  .pipe(z.string().min(1, 'Champ obligatoire').max(120, '120 caractères maximum'));

/** Calendar date without time, formatted YYYY-MM-DD. */
export const isoDateSchema = z.iso.date({ message: 'Date invalide (AAAA-MM-JJ)' });

export const searchQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
});

export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
}
