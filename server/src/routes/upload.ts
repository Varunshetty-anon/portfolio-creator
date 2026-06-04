/**
 * Upload Routes — /api/v1/upload
 *
 * All uploads go through Multer (memory storage) then stream to Cloudinary.
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { Readable } from 'node:stream';

import cloudinary from '../config/cloudinary.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadImage, uploadVideo, uploadMedia } from '../middleware/upload.js';
import { AppError } from '../middleware/errors.js';

const router = Router();

// ── Helper: stream a buffer to Cloudinary ───────────────────────────
function uploadBufferToCloudinary(
  buffer: Buffer,
  options: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err || !result) return reject(err ?? new Error('Cloudinary upload failed.'));
      resolve(result);
    });
    Readable.from(buffer).pipe(stream);
  });
}

// ── POST /profile-image ─────────────────────────────────────────────
router.post(
  '/profile-image',
  authenticateToken,
  uploadImage.single('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError('No image file provided.', 400);
      }

      const result = await uploadBufferToCloudinary(req.file.buffer, {
        folder: 'frames/profiles',
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      });

      res.json({
        success: true,
        data: {
          url: (result as any).secure_url,
          publicId: (result as any).public_id,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── POST /project-media ─────────────────────────────────────────────
router.post(
  '/project-media',
  authenticateToken,
  uploadMedia.single('media'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError('No media file provided.', 400);
      }

      const isVideo = req.file.mimetype.startsWith('video/');
      
      if (!isVideo && req.file.size > 15 * 1024 * 1024) {
        throw new AppError('Image too large. Max size is 15MB.', 400);
      }

      const resourceType = isVideo ? 'video' : 'image';

      const uploadOptions: Record<string, unknown> = {
        folder: isVideo ? 'frames/projects/videos' : 'frames/projects/images',
        resource_type: resourceType,
      };

      if (!isVideo) {
        uploadOptions.transformation = [{ quality: 'auto', fetch_format: 'auto' }];
      } else {
        // Video: enable streaming profile
        uploadOptions.eager = [{ streaming_profile: 'hd', format: 'm3u8' }];
        uploadOptions.eager_async = true;
      }

      const result = await uploadBufferToCloudinary(req.file.buffer, uploadOptions);

      res.json({
        success: true,
        data: {
          url: (result as any).secure_url,
          publicId: (result as any).public_id,
          resourceType,
          format: (result as any).format,
          width: (result as any).width,
          height: (result as any).height,
          duration: (result as any).duration ?? null,
          bytes: (result as any).bytes,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── POST /showreel ──────────────────────────────────────────────────
router.post(
  '/showreel',
  authenticateToken,
  uploadVideo.single('video'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError('No video file provided.', 400);
      }

      const result = await uploadBufferToCloudinary(req.file.buffer, {
        folder: 'frames/showreels',
        resource_type: 'video',
        eager: [{ streaming_profile: 'hd', format: 'm3u8' }],
        eager_async: true,
      });

      res.json({
        success: true,
        data: {
          url: (result as any).secure_url,
          publicId: (result as any).public_id,
          duration: (result as any).duration ?? null,
          width: (result as any).width,
          height: (result as any).height,
        },
      });
    } catch (err) {
      next(err);
    }
  },
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
