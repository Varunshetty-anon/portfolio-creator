/**
 * Analytics Routes — /api/v1/analytics
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

import Analytics from '../models/Analytics.js';
import Portfolio from '../models/Portfolio.js';
import { authenticateToken } from '../middleware/auth.js';
import { AppError } from '../middleware/errors.js';
import { hashVisitorIP } from '../utils/helpers.js';

const router = Router();

// Stricter rate limit for public tracking endpoints (30 per 15 min per IP)
const trackingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many tracking requests.' },
});

// ── POST /view/:portfolioId — track page view ──────────────────────
router.post(
  '/view/:portfolioId',
  trackingLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { portfolioId } = req.params;

      // Verify portfolio exists
      const portfolio = await Portfolio.findById(portfolioId);
      if (!portfolio) {
        throw new AppError('Portfolio not found.', 404);
      }

      const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
      const visitorHash = hashVisitorIP(ip);

      await Analytics.create({
        portfolioId,
        type: 'view',
        visitorHash,
        metadata: {
          userAgent: req.headers['user-agent'],
          referer: req.headers.referer ?? null,
        },
      });

      res.status(201).json({ success: true, data: { tracked: true } });
    } catch (err) {
      next(err);
    }
  },
);

// ── POST /click/:portfolioId — track click ──────────────────────────
router.post(
  '/click/:portfolioId',
  trackingLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { portfolioId } = req.params;

      const portfolio = await Portfolio.findById(portfolioId);
      if (!portfolio) {
        throw new AppError('Portfolio not found.', 404);
      }

      await Analytics.create({
        portfolioId,
        type: 'click',
        metadata: req.body.metadata ?? {},
      });

      res.status(201).json({ success: true, data: { tracked: true } });
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /summary — authenticated stats for own portfolio ────────────
router.get(
  '/summary',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const portfolio = await Portfolio.findOne({ userId: req.user!.userId });
      if (!portfolio) {
        return res.json({
          success: true,
          data: { totalViews: 0, totalClicks: 0, uniqueVisitors: 0, recentViews: [] },
        });
      }

      // Aggregate daily views for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [totalViews, totalClicks, uniqueVisitors, recentViews] = await Promise.all([
        Analytics.countDocuments({ portfolioId: portfolio._id, type: 'view' }),
        Analytics.countDocuments({ portfolioId: portfolio._id, type: 'click' }),
        Analytics.distinct('visitorHash', {
          portfolioId: portfolio._id,
          type: 'view',
        }).then((arr) => arr.length),
        Analytics.aggregate([
          {
            $match: {
              portfolioId: portfolio._id,
              type: 'view',
              createdAt: { $gte: thirtyDaysAgo },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

      res.json({
        success: true,
        data: {
          totalViews,
          totalClicks,
          uniqueVisitors,
          recentViews: recentViews.map((r) => ({ date: r._id, views: r.count })),
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
