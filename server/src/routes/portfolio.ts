/**
 * Portfolio Routes — /api/v1/portfolio
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { spawn } from 'child_process';
import https from 'https';

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

        // Trigger background migration if it's a Google Drive video
        if (projectData.videoSource === 'gdrive' && projectData.videoUrl) {
          const match = projectData.videoUrl.match(/[-\w]{25,}/);
          if (match) {
            const fileId = match[0];
            const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN as string;
            const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID as string;
            getResolvedDriveUrl(fileId)
              .then(url => streamToR2(url, fileId, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID))
              .then(() => console.log(`[R2 Migration] Successfully migrated ${fileId} on save`))
              .catch(err => console.error(`[R2 Migration] Failed for ${fileId}:`, err));
          }
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

const resolveFlight = new Map<string, Promise<string>>();

async function getResolvedDriveUrl(fileId: string): Promise<string> {
  const cached = driveUrlCache.get(fileId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  if (resolveFlight.has(fileId)) {
    return resolveFlight.get(fileId)!;
  }

  const promise = (async () => {
    try {
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
    } finally {
      resolveFlight.delete(fileId);
    }
  })();

  resolveFlight.set(fileId, promise);
  return promise;
}

// ── GET /drive-url/:id — returns resolved direct download URL ────────
router.get(
  '/drive-url/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fileId = req.params.id as string;
      const finalUrl = await getResolvedDriveUrl(fileId);
      res.json({ success: true, url: finalUrl });
    } catch (err) {
      console.error('Drive URL resolve error:', err);
      res.status(404).json({ success: false, error: 'File not found or private' });
    }
  }
);

const keepAliveAgent = new https.Agent({ keepAlive: true });

// ── GET & HEAD /drive-proxy/:id — public proxy for Google Drive videos ──────
const driveProxyHandler = async (req: Request, res: Response, next: NextFunction) => {
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
    const userAgent = req.headers['user-agent'] || 'Mozilla/5.0';
    const isHead = req.method === 'HEAD';

    const makeRequest = (urlToFetch: string, redirectCount = 0): Promise<any> => {
      return new Promise((resolve, reject) => {
        if (redirectCount > 5) return reject(new Error('Too many redirects'));
        const reqOpt = {
          method: isHead ? 'HEAD' : 'GET',
          agent: keepAliveAgent,
          headers: {
            'Range': rangeHeader,
            'User-Agent': userAgent
          }
        };
        const request = https.request(urlToFetch, reqOpt, (response) => {
          if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            // Follow redirect
            let redirectUrl = response.headers.location;
            if (!redirectUrl.startsWith('http')) {
               redirectUrl = new URL(redirectUrl, urlToFetch).toString();
            }
            resolve(makeRequest(redirectUrl, redirectCount + 1));
          } else {
            resolve(response);
          }
        });
        request.on('error', reject);
        request.end(); // Needed for https.request
      });
    };

    // Fetch the requested range from Google Drive
    let videoRes = await makeRequest(finalUrl);

    // If the cached URL returns 403 or 401, it might have expired. Clear cache and retry once.
    if (videoRes.statusCode === 403 || videoRes.statusCode === 401) {
      driveUrlCache.delete(fileId);
      try {
        finalUrl = await getResolvedDriveUrl(fileId);
        videoRes = await makeRequest(finalUrl);
      } catch (err) {
        return res.status(404).json({ success: false, error: 'File not found or private' });
      }
    }

    if (!videoRes.statusCode || videoRes.statusCode >= 400) {
      return res.status(videoRes.statusCode || 500).json({ success: false, error: 'Drive returned ' + videoRes.statusCode });
    }

    // Forward status and safe streaming headers, stripping sandbox & same-site policies
    res.status(videoRes.statusCode);
    
    const headersToForward = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'last-modified',
      'etag'
    ];

    for (const header of headersToForward) {
      const val = videoRes.headers[header];
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

    if (isHead) {
      res.end();
      videoRes.destroy();
    } else {
      videoRes.pipe(res);
      
      videoRes.on('error', (err: any) => {
        console.error('Stream pipe error:', err);
        if (!res.headersSent) res.status(500).end();
      });
      
      res.on('close', () => {
        videoRes.destroy();
      });
    }

  } catch (err) {
    console.error('Drive proxy error:', err);
    res.status(500).send('Error processing Google Drive video');
  }
};

router.get('/drive-proxy/:id', driveProxyHandler);
router.head('/drive-proxy/:id', driveProxyHandler);

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

// ── POST /migrate-to-r2/:id — trigger migration asynchronously ────
router.post('/migrate-to-r2/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fileId = req.params.id as string;
    if (!fileId) throw new AppError('Missing file ID', 400);

    const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN as string;
    const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID as string;

    const finalUrl = await getResolvedDriveUrl(fileId);

    // Run asynchronously, don't wait for completion to respond
    streamToR2(finalUrl, fileId, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)
      .then(() => console.log(`[R2 Migration] Successfully migrated ${fileId}`))
      .catch((err) => console.error(`[R2 Migration] Failed for ${fileId}:`, err));

    res.json({ success: true, message: 'Migration triggered' });
  } catch (err) {
    next(err);
  }
});

function streamToR2(url: string, fileId: string, token: string, accountId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const makeRequest = (urlToFetch: string, redirectCount = 0) => {
      if (redirectCount > 5) return reject(new Error('Too many redirects'));
      const reqOpt = {
        method: 'GET',
        agent: keepAliveAgent,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      };
      
      const request = https.request(urlToFetch, reqOpt, (response) => {
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          let redirectUrl = response.headers.location;
          if (!redirectUrl.startsWith('http')) {
             redirectUrl = new URL(redirectUrl, urlToFetch).toString();
          }
          makeRequest(redirectUrl, redirectCount + 1);
        } else if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
          const contentType = response.headers['content-type'] || 'video/mp4';
          const isWin = process.platform === 'win32';
          const wranglerCmd = isWin ? 'cmd.exe' : 'npx';
          const wranglerArgs = isWin 
            ? ['/c', `npx -y wrangler@latest r2 object put frames-videos-r2/${fileId} --remote --pipe --content-type "${contentType}"`]
            : ['-y', 'wrangler@latest', 'r2', 'object', 'put', `frames-videos-r2/${fileId}`, '--remote', '--pipe', '--content-type', contentType];

          const wrangler = spawn(wranglerCmd, wranglerArgs, {
            env: {
              ...process.env,
              CLOUDFLARE_API_TOKEN: token,
              CLOUDFLARE_ACCOUNT_ID: accountId
            }
          });

          let stderrData = '';
          wrangler.stderr.on('data', (d: any) => stderrData += d.toString());

          wrangler.on('error', (err: Error) => {
            response.destroy();
            reject(new Error(`Wrangler spawn failed: ${err.message}`));
          });

          wrangler.on('close', (code: number) => {
            if (code === 0) resolve();
            else reject(new Error(`Wrangler exited with code ${code}. Stderr: ${stderrData}`));
          });

          response.pipe(wrangler.stdin);

          response.on('error', (err: Error) => {
            wrangler.kill();
            reject(new Error(`Download stream error: ${err.message}`));
          });
        } else {
          response.destroy();
          reject(new Error(`Drive returned ${response.statusCode}`));
        }
      });
      request.on('error', reject);
      request.end();
    };
    makeRequest(url);
  });
}

export default router;
