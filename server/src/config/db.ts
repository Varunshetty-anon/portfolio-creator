/**
 * MongoDB Connection
 *
 * Env vars used:
 *   MONGODB_URI — Full MongoDB connection string
 */

import mongoose from 'mongoose';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2_000; // 2 s → 4 s → 8 s

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set.');
  }

  // ── Connection event listeners ──────────────────────────────────
  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected successfully.');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected.');
  });

  // ── Retry loop with exponential back-off ────────────────────────
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(uri);
      return; // success — exit
    } catch (err) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.error(
        `❌ MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed.` +
          (attempt < MAX_RETRIES ? ` Retrying in ${delay / 1000}s…` : ''),
      );
      if (attempt === MAX_RETRIES) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
