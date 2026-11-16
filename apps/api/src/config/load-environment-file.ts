import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parseEnv } from 'node:util';

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

/**
 * Loads the root `.env` file, or the file named by ENV_FILE (e.g. `.env.test`).
 * Variables already defined in the process environment take precedence.
 */
export function loadEnvironmentFile(): void {
  const fileName = process.env.ENV_FILE ?? '.env';
  const filePath = path.join(PROJECT_ROOT, fileName);
  if (!existsSync(filePath)) return;
  const variables = parseEnv(readFileSync(filePath, 'utf8'));
  for (const [name, value] of Object.entries(variables)) {
    if (process.env[name] === undefined && value !== undefined) process.env[name] = value;
  }
}
