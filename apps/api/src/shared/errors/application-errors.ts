/** Errors raised by use cases; mapped to HTTP status codes by the error handler. */
export abstract class ApplicationError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;
}

export class NotFoundError extends ApplicationError {
  readonly statusCode = 404;
  readonly code = 'NOT_FOUND';
}

/** The request conflicts with existing data (duplicate, dependent records...). */
export class ConflictError extends ApplicationError {
  readonly statusCode = 409;
  readonly code = 'CONFLICT';
}

export class InvalidRequestError extends ApplicationError {
  readonly statusCode = 400;
  readonly code = 'INVALID_REQUEST';
}
