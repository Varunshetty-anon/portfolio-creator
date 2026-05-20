/**
 * FRAMES Server Entry Point
 *
 * Env vars used:
 *   PORT          — HTTP port (default: 5000)
 *   MONGODB_URI   — MongoDB connection string
 */

import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = parseInt(process.env.PORT ?? '5000', 10);

async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB before accepting requests
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`🚀 FRAMES server running on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV ?? 'development'}`);
    });

    // ── Graceful shutdown ───────────────────────────────────────────
    const shutdown = (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully…`);
      server.close(() => {
        console.log('💤 HTTP server closed.');
        process.exit(0);
      });

      // Force exit if graceful shutdown hangs
      setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout.');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
