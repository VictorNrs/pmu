import { z } from 'zod';
import { loadEnvironmentFile } from './load-environment-file';

const environmentSchema = z.object({
  DATABASE_URL: z.string().startsWith('postgresql://', 'DATABASE_URL must be a PostgreSQL URL'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  API_HOST: z.string().default('127.0.0.1'),
  WEB_ORIGIN: z.string().url().default('http://localhost:5173'),
});

export type Environment = z.infer<typeof environmentSchema>;

/** Loads and validates the environment once at startup; fails fast with a readable message. */
export function readEnvironment(): Environment {
  loadEnvironmentFile();
  const result = environmentSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    throw new Error(`Invalid environment configuration:\n- ${issues.join('\n- ')}`);
  }
  return result.data;
}
