/**
 * Multer Upload Middleware
 *
 * Memory storage is used so files can be streamed directly to Cloudinary
 * without touching disk.
 */

import multer, { type FileFilterCallback } from 'multer';
import type { Request } from 'express';
import { AppError } from './errors.js';

// ── Allowed MIME prefixes ───────────────────────────────────────────
const IMAGE_MIMES = /^image\/(jpeg|png|gif|webp|svg\+xml|avif)$/;
const VIDEO_MIMES = /^video\/(mp4|quicktime|x-msvideo|webm|x-matroska)$/;
const MEDIA_MIMES = new RegExp(`${IMAGE_MIMES.source}|${VIDEO_MIMES.source}`);

// ── File filter factories ───────────────────────────────────────────
function imageFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void {
  if (IMAGE_MIMES.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files (JPEG, PNG, GIF, WebP, AVIF, SVG) are allowed.', 400));
  }
}

function videoFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void {
  if (VIDEO_MIMES.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only video files (MP4, MOV, AVI, WebM, MKV) are allowed.', 400));
  }
}

function mediaFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void {
  if (MEDIA_MIMES.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only image or video files are allowed.', 400));
  }
}

// ── Configured multer instances ─────────────────────────────────────

/** Upload single image — max 10 MB */
export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: imageFilter,
});

/** Upload single video — max 500 MB */
export const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter: videoFilter,
});

/** Upload single image OR video — max 500 MB */
export const uploadMedia = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter: mediaFilter,
});
