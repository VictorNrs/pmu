import type { ApiError } from '@pmu/shared';
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { Prisma } from '../../generated/prisma/client';
import { ApplicationError } from './application-errors';

interface HttpError {
  statusCode: number;
  body: ApiError;
}

/** Last-resort mapping of database constraint violations that use cases did not anticipate. */
const PRISMA_ERRORS: Record<string, HttpError> = {
  P2002: {
    statusCode: 409,
    body: { error: 'CONFLICT', message: 'Cet enregistrement existe déjà.' },
  },
  P2003: {
    statusCode: 409,
    body: { error: 'CONFLICT', message: 'Opération impossible : des données liées existent.' },
  },
  P2025: {
    statusCode: 404,
    body: { error: 'NOT_FOUND', message: 'Enregistrement introuvable.' },
  },
};

function toHttpError(error: unknown): HttpError | undefined {
  if (error instanceof ApplicationError) {
    return { statusCode: error.statusCode, body: { error: error.code, message: error.message } };
  }
  if (error instanceof ZodError) {
    const body: ApiError = {
      error: 'VALIDATION_ERROR',
      message: error.issues[0]?.message ?? 'Données invalides',
      details: error.issues.map((issue) => ({ path: issue.path, message: issue.message })),
    };
    return { statusCode: 400, body };
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) return PRISMA_ERRORS[error.code];
  return undefined;
}

export function handleError(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): FastifyReply {
  const httpError = toHttpError(error);
  if (httpError) return reply.status(httpError.statusCode).send(httpError.body);
  if (error.statusCode && error.statusCode < 500) {
    return reply.status(error.statusCode).send({ error: 'BAD_REQUEST', message: error.message });
  }
  request.log.error(error);
  return reply.status(500).send({ error: 'INTERNAL_ERROR', message: 'Erreur interne du serveur.' });
}
