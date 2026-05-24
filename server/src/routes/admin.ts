import express, { Request, Response } from 'express';
import mongoose from 'mongoose';

const router = express.Router();

const ADMIN_SECRET = 'SUPER_SECRET_WIPE_TOKEN_123';

router.post('/reset', async (req: Request, res: Response) => {
  const secret = req.headers['x-admin-secret'];
  if (secret !== ADMIN_SECRET) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ success: false, error: 'DB not connected' });
    }

    const dbName = db.databaseName;

    // STEP 1: AUDIT
    const collectionsBefore = await db.listCollections().toArray();
    const existingCollections = collectionsBefore.map(c => c.name);

    // Get specific counts
    let beforeCounts = {};
    for (const name of existingCollections) {
      beforeCounts[name] = await db.collection(name).countDocuments();
    }

    // STEP 2: SAFE RESET
    // Only wipe specific collections in frames database
    const targets = ['users', 'portfolios', 'projects', 'analytics', 'settings'];
    
    let wiped = [];
    for (const target of targets) {
      if (existingCollections.includes(target)) {
        await db.collection(target).deleteMany({}); // wipe documents but keep indexes
        wiped.push(target);
      }
    }

    // Wait, let's actually drop them to ensure perfectly clean schemas? No, deleteMany is safer to preserve indexes.
    
    // STEP 3: POST-AUDIT
    let afterCounts = {};
    for (const name of existingCollections) {
      afterCounts[name] = await db.collection(name).countDocuments();
    }

    return res.json({
      success: true,
      data: {
        databaseName: dbName,
        status: 'CLEAN_ROOM_RESET_COMPLETE',
        audit: {
          existingCollections,
          beforeCounts,
          wiped,
          afterCounts
        }
      }
    });

  } catch (error) {
    console.error('Reset error:', error);
    return res.status(500).json({ success: false, error: 'Reset failed' });
  }
});

export default router;
