/**
 * Portfolio Routes — /api/v1/portfolio
 */

import { Router, type Request, type Response, type NextFunction } from 'express';

import Portfolio from '../models/Portfolio.js';
import Project from '../models/Project.js';
import Analytics from '../models/Analytics.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { AppError } from '../middleware/errors.js';
import { sanitizeUsername } from '../utils/helpers.js';

const router = Router();

// ── GET / — current user's portfolio ────────────────────────────────
router.get('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.user!.userId });
    if (!portfolio) {
      return res.json({ success: true, data: { portfolio: null } });
    }

    // Sync onboarded flag if missing (to prevent infinite frontend redirect loops)
    const user = await User.findById(req.user!.userId);
    if (user && !user.onboarded) {
      user.onboarded = true;
      await user.save();
    }

    // Also fetch projects
    const projects = await Project.find({ portfolioId: portfolio._id }).sort({ order: 1 });

    res.json({ success: true, data: { portfolio, projects } });
  } catch (err) {
    next(err);
  }
});

// ── POST / — create portfolio ───────────────────────────────────────
router.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    // One portfolio per user
    const existing = await Portfolio.findOne({ userId });
    if (existing) {
      throw new AppError('You already have a portfolio. Use PUT to update.', 409);
    }

    const username = sanitizeUsername(req.body.username ?? '');
    if (!username || username.length < 3) {
      throw new AppError('Username must be at least 3 characters (letters, numbers, hyphens).', 400);
    }

    // Uniqueness check
    const taken = await Portfolio.findOne({ username });
    if (taken) {
      throw new AppError('This username is already taken.', 409);
    }

    const portfolio = await Portfolio.create({
      userId,
      username,
      name: req.body.name,
      role: req.body.role,
      bio: req.body.bio,
      location: req.body.location,
      languages: req.body.languages,
      contactEmail: req.body.contactEmail,
      profileImageUrl: req.body.profileImageUrl,
      showreelUrl: req.body.showreelUrl,
      showreelThumbnailUrl: req.body.showreelThumbnailUrl,
      socials: req.body.socials,
      availability: req.body.availability,
      theme: req.body.theme || 'minimalism',
      draftContent: req.body.draftContent,
    });

    await User.findByIdAndUpdate(userId, { onboarded: true });

    res.status(201).json({ success: true, data: { portfolio } });
  } catch (err) {
    next(err);
  }
});

// ── PUT / — update portfolio draft ──────────────────────────────────
router.put('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.user!.userId });
    if (!portfolio) {
      throw new AppError('Portfolio not found. Create one first.', 404);
    }

    // Allow updating all editable fields
    const editable = [
      'name', 'role', 'bio', 'location', 'languages', 'contactEmail',
      'profileImageUrl', 'showreelUrl', 'showreelThumbnailUrl',
      'socials', 'availability', 'theme', 'draftContent',
      'primaryTool', 'tools', 'aiTools',
    ] as const;

    for (const field of editable) {
      if (req.body[field] !== undefined) {
        (portfolio as any)[field] = req.body[field];
      }
    }

    await portfolio.save();

    // Sync Projects if provided
    if (req.body.projects && Array.isArray(req.body.projects)) {
      // Find existing projects to know what to delete
      const existingProjects = await Project.find({ portfolioId: portfolio._id });
      const incomingIds = req.body.projects.map((p: any) => p._id).filter(Boolean);
      
      // Delete removed projects
      const toDelete = existingProjects.filter(p => !incomingIds.includes(p._id.toString()));
      if (toDelete.length > 0) {
        await Project.deleteMany({ _id: { $in: toDelete.map(p => p._id) } });
      }

      // Upsert projects
      for (const [index, p] of req.body.projects.entries()) {
        const projectData = {
          portfolioId: portfolio._id,
          userId: portfolio.userId,
          title: p.title || 'Untitled Project',
          description: p.description || '',
          thumbnailUrl: p.thumbnailUrl || '',
          videoUrl: p.videoUrl || '',
          videoSource: p.videoSource || 'youtube',
          aspectRatio: p.aspectRatio || '16:9',
          contentType: p.contentType || '',
          subjectMatter: p.subjectMatter || '',
          softwareUsed: p.softwareUsed || [],
          aiToolsUsed: p.aiToolsUsed || [],
          order: p.order ?? index,
        };

        if (p._id && p._id.length === 24) { // Valid ObjectId
          await Project.findByIdAndUpdate(p._id, projectData);
        } else {
          await Project.create(projectData);
        }
      }
    }

    // Fetch updated projects to return
    const updatedProjects = await Project.find({ portfolioId: portfolio._id }).sort({ order: 1 });

    res.json({ success: true, data: { portfolio, projects: updatedProjects } });
  } catch (err) {
    next(err);
  }
});

// ── POST /publish — copy draft → live ───────────────────────────────
router.post(
  '/publish',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const portfolio = await Portfolio.findOne({ userId: req.user!.userId });
      if (!portfolio) {
        throw new AppError('Portfolio not found.', 404);
      }

      portfolio.liveContent = portfolio.draftContent;
      portfolio.isPublished = true;
      portfolio.publishedAt = new Date();
      await portfolio.save();

      res.json({ success: true, data: { portfolio } });
    } catch (err) {
      next(err);
    }
  },
);

// ── POST /unpublish ─────────────────────────────────────────────────
router.post(
  '/unpublish',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const portfolio = await Portfolio.findOne({ userId: req.user!.userId });
      if (!portfolio) {
        throw new AppError('Portfolio not found.', 404);
      }

      portfolio.isPublished = false;
      await portfolio.save();

      res.json({ success: true, data: { portfolio } });
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /check-username/:username ───────────────────────────────────
router.get(
  '/check-username/:username',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const username = sanitizeUsername(String(req.params.username));
      if (!username || username.length < 3) {
        return res.json({ success: true, data: { available: false, reason: 'Too short.' } });
      }

      const existing = await Portfolio.findOne({ username });
      res.json({ success: true, data: { available: !existing } });
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /public/:username — public portfolio view ───────────────────
router.get(
  '/public/:username',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const portfolio = await Portfolio.findOne({
        username: String(req.params.username).toLowerCase(),
        isPublished: true,
      });

      if (!portfolio) {
        throw new AppError('Portfolio not found or not published.', 404);
      }

      const projects = await Project.find({ portfolioId: portfolio._id }).sort({ order: 1 });

      res.json({
        success: true,
        data: {
          portfolio: {
            username: portfolio.username,
            name: portfolio.name,
            role: portfolio.role,
            bio: portfolio.bio,
            location: portfolio.location,
            languages: portfolio.languages,
            contactEmail: portfolio.contactEmail,
            profileImageUrl: portfolio.profileImageUrl,
            showreelUrl: portfolio.showreelUrl,
            showreelThumbnailUrl: portfolio.showreelThumbnailUrl,
            socials: portfolio.socials,
            availability: portfolio.availability,
            theme: portfolio.theme,
            primaryTool: portfolio.primaryTool,
            tools: portfolio.tools,
            aiTools: portfolio.aiTools,
            liveContent: portfolio.liveContent,
            publishedAt: portfolio.publishedAt,
          },
          projects,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /stats — analytics summary ──────────────────────────────────
router.get(
  '/stats',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const portfolio = await Portfolio.findOne({ userId: req.user!.userId });
      if (!portfolio) {
        return res.json({ success: true, data: { views: 0, clicks: 0, uniqueVisitors: 0 } });
      }

      const [viewCount, clickCount, uniqueVisitors] = await Promise.all([
        Analytics.countDocuments({ portfolioId: portfolio._id, type: 'view' }),
        Analytics.countDocuments({ portfolioId: portfolio._id, type: 'click' }),
        Analytics.distinct('visitorHash', { portfolioId: portfolio._id, type: 'view' }).then(
          (arr) => arr.length,
        ),
      ]);

      res.json({
        success: true,
        data: { views: viewCount, clicks: clickCount, uniqueVisitors },
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
