import path from 'node:path';
import { defineConfig } from 'prisma/config';
import { loadEnvironmentFile } from './src/config/load-environment-file';

loadEnvironmentFile();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not defined (see .env.example)');

export default defineConfig({
  schema: path.join('..', '..', 'database', 'prisma', 'schema.prisma'),
  migrations: { path: path.join('..', '..', 'database', 'migrations') },
  datasource: { url: databaseUrl },
});
