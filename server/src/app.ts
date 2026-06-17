/**
 * Express Application Setup
 *
 * Env vars used:
 *   CLIENT_URL   — Allowed CORS origin (e.g. http://localhost:5173)
 *   NODE_ENV     — 'production' enables static file serving + SPA fallback
 */

import express, { type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import passport from 'passport';

import { errorHandler } from './middleware/errors.js';
import './config/passport.js'; // initialise passport strategies

// ── Route imports ───────────────────────────────────────────────────
import authRoutes from './routes/auth.js';
import portfolioRoutes from './routes/portfolio.js';
import uploadRoutes from './routes/upload.js';
import analyticsRoutes from './routes/analytics.js';


// ── dirname polyfill for ESM ────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ── Core middleware ─────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.youtube.com", "https://s.ytimg.com", "https://player.vimeo.com", "https://f.vimeocdn.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://img.youtube.com", "https://i.ytimg.com", "https://i.vimeocdn.com", "https://*.googleusercontent.com", "https://images.unsplash.com"],
        connectSrc: ["'self'", "https://api.cloudinary.com", "https://www.youtube.com", "https://vimeo.com", "https://*.vimeo.com", "https://*.vimeocdn.com", "https://*.workers.dev"],
        frameSrc: ["'self'", "https://www.youtube.com", "https://player.vimeo.com", "https://drive.google.com"],
        mediaSrc: ["'self'", "blob:", "https://res.cloudinary.com", "https://*.cloudinary.com", "https://*.workers.dev", "https://drive.google.com"],
        workerSrc: ["'self'", "blob:"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── Prevent API Caching ─────────────────────────────────────────────
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

app.use(
  cors({
    origin: process.env.CLIENT_URL ?? 'http://localhost:3000',
    credentials: true,
  }),
);

app.use(passport.initialize());

// ── Rate limiting ───────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Higher limit to support auto-save editor workflows
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

// ── API routes ──────────────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/portfolio', portfolioRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/analytics', analyticsRoutes);


// ── Production: serve static SPA ────────────────────────────────────
const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));

// SPA fallback — all non-API routes serve index.html
app.get('*', (req: Request, res: Response, next: express.NextFunction) => {
  // If the request is for an API route that wasn't matched, return 404 JSON instead of index.html
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(clientDist, 'index.html'));
});

// ── Global error handler (must be last) ─────────────────────────────
app.use(errorHandler);

export default app;
