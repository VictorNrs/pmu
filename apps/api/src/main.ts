import { buildApp } from './app';
import { readEnvironment } from './config/environment';
import { createDatabase } from './shared/database/prisma-client';

async function start(): Promise<void> {
  const environment = readEnvironment();
  const database = createDatabase(environment.DATABASE_URL);
  const app = await buildApp({ database, webOrigin: environment.WEB_ORIGIN, logger: true });

  const shutdown = async () => {
    await app.close();
    await database.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await app.listen({ port: environment.API_PORT, host: environment.API_HOST });
}

start().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
