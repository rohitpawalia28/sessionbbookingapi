import { ErrorRequestHandler, RequestHandler, Response } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

interface DuplicateKeyError {
  code: 11000;
  keyValue?: Record<string, unknown>;
}

function isDuplicateKeyError(err: unknown): err is DuplicateKeyError {
  return typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 11000;
}

function isJsonParseError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { type?: unknown }).type === 'entity.parse.failed';
}

function sendError(res: Response, status: number, message: string, details?: unknown): void {
  res.status(status).json({
    success: false,
    error: details === undefined ? { message } : { message, details },
  });
}

export const notFoundHandler: RequestHandler = (req, res) => {
  sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.message, err.details);
    return;
  }

  if (isJsonParseError(err)) {
    sendError(res, 400, 'Request body is not valid JSON');
    return;
  }

  if (isDuplicateKeyError(err)) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
    sendError(res, 409, `A record with this ${field} already exists`);
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    sendError(res, 400, 'Validation failed', details);
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    sendError(res, 400, `Invalid value for ${err.path}`);
    return;
  }

  console.error(err);
  const message = env.isProduction ? 'Internal server error' : (err as Error)?.message || 'Internal server error';
  sendError(res, 500, message);
};
