/**
 * Global Error Handling
 */

import type { Request, Response, NextFunction } from 'express';

// ── Custom application error ────────────────────────────────────────
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// ── Helper: normalise known error types into AppError ────────────────
function normaliseError(err: any): AppError {
  // Mongoose validation error
  if (err.name === 'ValidationError' && err.errors) {
    const messages = Object.values(err.errors)
      .map((e: any) => e.message)
      .join('. ');
    return new AppError(messages, 400);
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? 'field';
    return new AppError(`A record with that ${field} already exists.`, 409);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return new AppError('Invalid resource ID.', 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return new AppError('Invalid token.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return new AppError('Token expired.', 401);
  }

  // Multer file-size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError('File size exceeds the allowed limit.', 400);
  }

  // Already an AppError — return as-is
  if (err instanceof AppError) {
    return err;
  }

  // Unknown / unexpected error
  return new AppError('Internal server error.', 500, false);
}

// ── Express error-handling middleware ────────────────────────────────
export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const appError = normaliseError(err);

  // Log unexpected errors for debugging
  if (!appError.isOperational) {
    console.error('🔥 Unexpected error:', err);
  }

  const response: Record<string, unknown> = {
    success: false,
    error: appError.message,
  };

  // Attach stack trace only in development
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(appError.statusCode).json(response);
}
