/**
 * Analytics Model
 *
 * Lightweight event tracking for portfolio views and clicks.
 * A TTL index automatically purges records older than 90 days.
 */

import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IAnalytics extends Document {
  _id: mongoose.Types.ObjectId;
  portfolioId: mongoose.Types.ObjectId;
  type: 'view' | 'click';
  metadata?: Record<string, unknown>;
  visitorHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const analyticsSchema = new Schema<IAnalytics>(
  {
    portfolioId: {
      type: Schema.Types.ObjectId,
      ref: 'Portfolio',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['view', 'click'],
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    visitorHash: {
      type: String,
    },
  },
  { timestamps: true },
);

// Automatically delete records after 90 days
analyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const Analytics: Model<IAnalytics> = mongoose.model<IAnalytics>('Analytics', analyticsSchema);
export default Analytics;
