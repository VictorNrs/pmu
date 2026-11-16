import fastifyStatic from '@fastify/static';
import type { FastifyInstance } from 'fastify';

/**
 * Serves the built Vue application from the API (Docker deployment: one container, one port).
 * Unknown non-API GET routes return index.html so that client-side routes can be reloaded.
 */
export async function registerWebClient(
  app: FastifyInstance,
  distDirectory: string,
): Promise<void> {
  await app.register(fastifyStatic, { root: distDirectory });
  app.setNotFoundHandler((request, reply) => {
    if (request.method === 'GET' && !request.url.startsWith('/api/')) {
      return reply.sendFile('index.html');
    }
    return reply.status(404).send({ error: 'NOT_FOUND', message: 'Route introuvable.' });
  });
}
