/**
 * Upload Routes — /api/v1/upload
 *
 * Provides cryptographic signatures for Direct-to-Cloudinary uploads
 * to bypass Render memory limitations.
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import cloudinary from '../config/cloudinary.js';
import { authenticateToken } from '../middleware/auth.js';
import { AppError } from '../middleware/errors.js';

const router = Router();

// ── GET /signature ──────────────────────────────────────────────────
// Returns a signed payload so the client can upload directly to Cloudinary
router.get(
  '/signature',
  authenticateToken,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const timestamp = Math.round(new Date().getTime() / 1000);
      const isVideo = req.query.type === 'video';
      
      console.log('--- Upload Route Hit: Checking Cloudinary Config ---');
      console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'set' : 'undefined');
      console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'set' : 'undefined');
      console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'set' : 'undefined');

      if (!process.env.CLOUDINARY_API_SECRET) {
        throw new AppError('Server is missing Cloudinary API Secret. Upload cannot proceed.', 500);
      }
      
      const paramsToSign: Record<string, any> = {
        timestamp,
        folder: isVideo ? 'frames/projects/videos' : 'frames/projects/images',
      };

      if (isVideo) {
        paramsToSign.eager = 'sp_hd/m3u8';
        paramsToSign.eager_async = true;
      }

      // Generate signature using Cloudinary's utility
      const signature = cloudinary.utils.api_sign_request(
        paramsToSign, 
        process.env.CLOUDINARY_API_SECRET as string
      );
      
      res.json({
        success: true,
        data: {
          signature,
          timestamp,
          apiKey: process.env.CLOUDINARY_API_KEY,
          cloudName: process.env.CLOUDINARY_CLOUD_NAME,
          folder: paramsToSign.folder,
          eager: paramsToSign.eager,
          eagerAsync: paramsToSign.eager_async,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── DELETE /:publicId — delete asset from Cloudinary ────────────────
router.delete(
  '/:publicId(*)',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const publicId = String(req.params.publicId);
      if (!publicId) {
        throw new AppError('Public ID is required.', 400);
      }

      // Try deleting as image first, then video
      let result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
      if (result.result === 'not found') {
        result = await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
      }

      res.json({
        success: true,
        data: { result: result.result },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── POST /validate-drive ──────────────────────────────────────────
router.post(
  '/validate-drive',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { url } = req.body;
      if (!url) throw new AppError('URL is required', 400);

      const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
      if (!match) throw new AppError('Invalid Google Drive URL', 400);

      const fileId = match[1];
      const checkUrl = `https://drive.google.com/uc?id=${fileId}`;

      const response = await fetch(checkUrl, { method: 'HEAD', redirect: 'manual' });
      
      const location = response.headers.get('location');
      const isPrivate = response.status === 403 || 
                        response.status === 401 || 
                        (response.status >= 300 && response.status < 400 && location?.includes('ServiceLogin'));
                        
      res.json({
        success: true,
        data: {
          isPrivate,
          isValid: true,
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
