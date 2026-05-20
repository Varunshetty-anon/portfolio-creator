/**
 * Cloudinary Configuration
 *
 * Env vars used:
 *   CLOUDINARY_CLOUD_NAME — Cloudinary cloud name
 *   CLOUDINARY_API_KEY    — Cloudinary API key
 *   CLOUDINARY_API_SECRET — Cloudinary API secret
 */

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
