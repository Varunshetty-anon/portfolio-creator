/**
 * Auth Routes — /api/v1/auth
 *
 * Env vars used:
 *   JWT_SECRET       — Secret for signing tokens
 *   JWT_REFRESH_SECRET — Secret for refresh tokens
 *   CLIENT_URL       — Frontend URL (for OAuth redirect)
 *   NODE_ENV         — Controls cookie secure flag
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import passport from 'passport';
import rateLimit from 'express-rate-limit';

import User, { type IUser } from '../models/User.js';
import Portfolio from '../models/Portfolio.js';
import Project from '../models/Project.js';
import Analytics from '../models/Analytics.js';
import Settings from '../models/Settings.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errors.js';
import { generateJWT } from '../utils/helpers.js';

const router = Router();

// ── Helpers ─────────────────────────────────────────────────────────

/** Cookie options for access / refresh tokens */
function cookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
    maxAge: maxAgeMs,
    path: '/',
  };
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** Issue access + refresh (30 d) JWTs */
function generateTokens(userId: string): TokenPair {
  const jwtSecret = process.env.JWT_SECRET!;
  const refreshSecret = process.env.JWT_REFRESH_SECRET ?? jwtSecret;

  const accessToken = generateJWT({ userId }, jwtSecret, '30d');
  const refreshToken = generateJWT({ userId }, refreshSecret, '30d');
  return { accessToken, refreshToken };
}

/** Set both tokens as httpOnly cookies on the response */
function setTokenCookies(res: Response, tokens: TokenPair): void {
  res.cookie('frames_token', tokens.accessToken, cookieOptions(30 * 24 * 60 * 60 * 1000));
  res.cookie('frames_refresh', tokens.refreshToken, cookieOptions(30 * 24 * 60 * 60 * 1000));
}

// ── Rate Limiting ───────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts, please try again later.' },
});

// ── POST /signup ────────────────────────────────────────────────────
router.post('/signup', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required.', 400);
    }

    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters long.', 400);
    }

    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new AppError('An account with this email already exists.', 409);
    }

    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash: password, // pre-save hook hashes it
      displayName: displayName ?? '',
    });

    const tokens = generateTokens(user._id.toString());
    setTokenCookies(res, tokens);

    res.status(201).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
});

// ── POST /login ─────────────────────────────────────────────────────
router.post('/login', authLimiter, (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate(
    'local',
    { session: false },
    (err: Error | null, user: IUser | false, info: { message: string } | undefined) => {
      if (err) return next(err);
      if (!user) {
        return next(new AppError(info?.message ?? 'Invalid credentials.', 401));
      }

      const tokens = generateTokens(user._id.toString());
      setTokenCookies(res, tokens);

      res.json({ success: true, data: { user } });
    },
  )(req, res, next);
});

// ── GET /google ─────────────────────────────────────────────────────
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false }),
);

// ── GET /google/callback ────────────────────────────────────────────
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req: Request, res: Response) => {
    const user = req.user as unknown as IUser;
    const tokens = generateTokens(user._id.toString());
    setTokenCookies(res, tokens);
    res.redirect(process.env.CLIENT_URL ?? 'http://localhost:5173');
  },
);

// ── POST /refresh ───────────────────────────────────────────────────
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken: string | undefined = req.cookies?.frames_refresh;
    if (!refreshToken) {
      throw new AppError('No refresh token provided.', 401);
    }

    const jwt = await import('jsonwebtoken');
    const refreshSecret = process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET!;
    const decoded = jwt.default.verify(refreshToken, refreshSecret) as { userId: string };

    // Verify user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AppError('User no longer exists.', 401);
    }

    const tokens = generateTokens(user._id.toString());
    setTokenCookies(res, tokens);

    res.json({ success: true, data: { message: 'Tokens refreshed.' } });
  } catch (err) {
    next(err);
  }
});

// ── POST /logout ────────────────────────────────────────────────────
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('frames_token', { path: '/' });
  res.clearCookie('frames_refresh', { path: '/' });
  res.json({ success: true, data: { message: 'Logged out.' } });
});

// ── GET /me ─────────────────────────────────────────────────────────
router.get('/session', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) {
      return res.json({ success: true, data: { user: null } });
    }

    const user = await User.findById(req.user.userId);
    res.json({ success: true, data: { user: user || null } });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /account ─────────────────────────────────────────────────
router.delete(
  '/account',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      // Cascade delete all user data
      const portfolio = await Portfolio.findOne({ userId });
      if (portfolio) {
        await Project.deleteMany({ portfolioId: portfolio._id });
        await Analytics.deleteMany({ portfolioId: portfolio._id });
        await Settings.deleteOne({ portfolioId: portfolio._id });
        await portfolio.deleteOne();
      }
      await User.findByIdAndDelete(userId);

      res.clearCookie('frames_token', { path: '/' });
      res.clearCookie('frames_refresh', { path: '/' });

      res.json({ success: true, data: { message: 'Account and all associated data deleted.' } });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
