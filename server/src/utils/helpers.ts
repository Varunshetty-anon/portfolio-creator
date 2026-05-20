/**
 * Utility / Helper Functions
 */

import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

/**
 * Generate a signed JWT.
 */
export function generateJWT(
  payload: Record<string, unknown>,
  secret: string,
  expiresIn: string | number,
): string {
  return jwt.sign(payload, secret, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
}

/**
 * Create a one-way SHA-256 hash of a visitor IP for anonymous analytics.
 * A daily salt ensures hashes rotate, preventing long-term tracking.
 */
export function hashVisitorIP(ip: string): string {
  const dailySalt = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return crypto.createHash('sha256').update(`${ip}:${dailySalt}`).digest('hex');
}

/**
 * Sanitise a username slug: lowercase, keep only a-z 0-9 and hyphens,
 * collapse consecutive hyphens, trim leading/trailing hyphens.
 */
export function sanitizeUsername(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Detect video hosting platform from a URL string.
 */
export function getVideoSource(url: string): 'youtube' | 'vimeo' | 'cloudinary' {
  if (/youtu\.?be/i.test(url)) return 'youtube';
  if (/vimeo\.com/i.test(url)) return 'vimeo';
  return 'cloudinary';
}
