/**
 * JWT Authentication Middleware
 *
 * Env vars used:
 *   JWT_SECRET — Secret key for signing / verifying JWTs
 */

import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errors.js';

export interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

// Extend Express Request to carry the authenticated user id
declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}

const COOKIE_NAME = 'frames_token';

/**
 * Requires a valid JWT in the httpOnly cookie.
 * Attaches decoded payload to `req.user`.
 */
export function authenticateToken(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token: string | undefined = req.cookies?.[COOKIE_NAME];

    if (!token) {
      throw new AppError('Authentication required. Please log in.', 401);
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new AppError('Server misconfiguration: JWT_SECRET is not set.', 500);
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof AppError) {
      return next(err);
    }
    if (err instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token expired. Please log in again.', 401));
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid token.', 401));
    }
    next(err);
  }
}

/**
 * Like `authenticateToken` but does NOT fail when no token is present.
 * If a valid token exists it is decoded; otherwise `req.user` stays undefined.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token: string | undefined = req.cookies?.[COOKIE_NAME];
    if (!token) {
      return next();
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next();
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    // Invalid / expired — silently continue without user
    next();
  }
}
