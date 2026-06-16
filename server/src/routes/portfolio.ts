/**
 * Portfolio Routes — /api/v1/portfolio
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

import Portfolio from '../models/Portfolio.js';
import Project from '../models/Project.js';
import Analytics from '../models/Analytics.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { AppError } from '../middleware/errors.js';
import { sanitizeUsername } from '../utils/helpers.js';

const router = Router();

function serializePortfolio(portfolio: any) {
  return {
    _id: portfolio._id,
    username: portfolio.username,
    name: portfolio.name,
    role: portfolio.role,
    bio: portfolio.bio,
    location: portfolio.location,
    languages: portfolio.languages,
    contactEmail: portfolio.contactEmail,
    profileImageUrl: portfolio.profileImageUrl,
    heroProjectId: portfolio.heroProjectId?.toString(),
    showreelUrl: portfolio.showreelUrl,
    showreelThumbnailUrl: portfolio.showreelThumbnailUrl,
    socials: portfolio.socials,
    availability: portfolio.availability,
    theme: portfolio.theme,
    primaryTool: portfolio.primaryTool,
    tools: portfolio.tools,
    aiTools: portfolio.aiTools,
    publishedAt: portfolio.publishedAt,
  };
}

function serializeProject(project: any) {
  return {
    _id: project._id,
    id: project._id?.toString(),
    title: project.title,
    description: project.description,
    thumbnailUrl: project.thumbnailUrl,
    videoUrl: project.videoUrl,
    imageUrl: project.imageUrl,
    videoSource: project.videoSource,
    aspectRatio: project.aspectRatio,
    contentType: project.contentType,
    subjectMatter: project.subjectMatter,
    softwareUsed: project.softwareUsed,
    aiToolsUsed: project.aiToolsUsed,
    order: project.order,
  };
}

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
      'profileImageUrl', 'heroProjectId', 'showreelUrl', 'showreelThumbnailUrl',
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
          imageUrl: p.imageUrl || '',
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

      const projects = await Project.find({ portfolioId: portfolio._id }).sort({ order: 1 });

      portfolio.isPublished = true;
      portfolio.publishedAt = new Date();
      portfolio.liveContent = {
        portfolio: {
          ...serializePortfolio(portfolio),
          isPublished: true,
          publishedAt: portfolio.publishedAt,
        },
        projects: projects.map(serializeProject),
      };
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
      const liveContent = portfolio.liveContent as any;
      const livePortfolio = liveContent?.portfolio;
      const liveProjects = Array.isArray(liveContent?.projects) ? liveContent.projects : null;

      res.json({
        success: true,
        data: {
          portfolio: livePortfolio || {
            ...serializePortfolio(portfolio),
            liveContent: portfolio.liveContent,
          },
          projects: liveProjects || projects.map(serializeProject),
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// Cache for resolved Google Drive download URLs
const driveUrlCache = new Map<string, { url: string; expiresAt: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

async function getResolvedDriveUrl(fileId: string): Promise<string> {
  const cached = driveUrlCache.get(fileId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  const ucUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const headers = { 'User-Agent': 'Mozilla/5.0' };

  // Fetch only the first byte to check if it's a virus scan page or get the final redirect URL
  const response = await fetch(ucUrl, {
    headers: { ...headers, Range: 'bytes=0-0' }
  });

  let finalUrl = '';

  if (response.status === 200 && response.headers.get('content-type')?.includes('text/html')) {
    const text = await response.text();
    
    // Try new UUID format first (drive.usercontent.google.com)
    const actionMatch = text.match(/action="([^"]+)"/);
    const uuidMatch = text.match(/name="uuid" value="([^"]+)"/);
    
    // Try old confirm token format
    const oldConfirmMatch = text.match(/confirm=([a-zA-Z0-9_-]+)/);
    
    if (actionMatch && uuidMatch) {
      const actionUrl = actionMatch[1].startsWith('http') ? actionMatch[1] : `https://drive.google.com${actionMatch[1]}`;
      finalUrl = `${actionUrl}?id=${fileId}&export=download&confirm=t&uuid=${uuidMatch[1]}`;
    } else if (oldConfirmMatch) {
      finalUrl = `${ucUrl}&confirm=${oldConfirmMatch[1]}`;
    } else {
      throw new Error('Google Drive file not found or private');
    }
  } else {
    // If it's a 206 (or 200 direct file), follow the final redirect URL
    finalUrl = response.url;
  }

  // Cache it
  driveUrlCache.set(fileId, {
    url: finalUrl,
    expiresAt: Date.now() + CACHE_TTL
  });

  return finalUrl;
}

// ── GET /drive-proxy/:id — public proxy for Google Drive videos ──────
router.get(
  '/drive-proxy/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fileId = req.params.id as string;
      let finalUrl = '';

      try {
        finalUrl = await getResolvedDriveUrl(fileId);
      } catch (err) {
        return res.status(404).json({ success: false, error: 'File not found or private' });
      }

      const clientRange = req.headers.range;
      const rangeHeader = Array.isArray(clientRange) ? clientRange[0] : (clientRange || 'bytes=0-');

      // Fetch the requested range from Google Drive
      let videoRes = await fetch(finalUrl, {
        headers: {
          Range: rangeHeader,
          'User-Agent': 'Mozilla/5.0'
        }
      });

      // If the cached URL returns 403 or 401, it might have expired. Clear cache and retry once.
      if (videoRes.status === 403 || videoRes.status === 401) {
        driveUrlCache.delete(fileId);
        try {
          finalUrl = await getResolvedDriveUrl(fileId);
          videoRes = await fetch(finalUrl, {
            headers: {
              Range: rangeHeader,
              'User-Agent': 'Mozilla/5.0'
            }
          });
        } catch (err) {
          return res.status(404).json({ success: false, error: 'File not found or private' });
        }
      }

      // Forward status and safe streaming headers, stripping sandbox & same-site policies
      res.status(videoRes.status);
      
      const headersToForward = [
        'content-type',
        'content-length',
        'content-range',
        'accept-ranges',
        'last-modified',
        'etag'
      ];

      for (const header of headersToForward) {
        const val = videoRes.headers.get(header);
        if (val) {
          res.setHeader(header, val);
        }
      }

      // Ensure Accept-Ranges is set to bytes (required for iOS Safari scrub controls)
      res.setHeader('Accept-Ranges', 'bytes');

      // Override global Express API prevent-caching headers specifically for this video stream
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.removeHeader('Pragma');
      res.removeHeader('Expires');
      res.removeHeader('Surrogate-Control');

      if (videoRes.body) {
        try {
          await pipeline(Readable.fromWeb(videoRes.body as any), res);
        } catch (err: any) {
          if (
            err.code !== 'ERR_STREAM_PREMATURE_CLOSE' &&
            err.code !== 'ECONNRESET' &&
            err.code !== 'EPIPE'
          ) {
            console.error('Stream pipe error:', err);
          }
        }
        return;
      } else {
        return res.status(500).send('Error streaming video');
      }
    } catch (err) {
      console.error('Drive proxy error:', err);
      res.status(500).send('Error processing Google Drive video');
    }
  }
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
