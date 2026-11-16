import { z } from 'zod';
import { idSchema, isoDateSchema } from './common';

/** Accepts `1,2,3`, a repeated query parameter, or an array. */
const numberListSchema = z.preprocess((value) => {
  if (value === undefined || value === '') return undefined;
  const items = Array.isArray(value) ? value : String(value).split(',');
  return items.map((item) => String(item).trim()).filter((item) => item !== '');
}, z.array(z.coerce.number().int().positive()).optional());

/**
 * Criteria shared by every statistic and by the participation list,
 * so a statistic can always be traced back to its participations.
 */
export const performanceFiltersSchema = z.object({
  stallionIds: numberListSchema,
  terrainConditionIds: numberListSchema,
  distances: numberListSchema,
  from: isoDateSchema.optional(),
  to: isoDateSchema.optional(),
});
export type PerformanceFilters = z.infer<typeof performanceFiltersSchema>;

export const participationListQuerySchema = performanceFiltersSchema.extend({
  horseId: idSchema.optional(),
  raceId: idSchema.optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(200),
});
export type ParticipationListQuery = z.infer<typeof participationListQuerySchema>;
