/**
 * Project Model
 *
 * A portfolio has many projects. Projects are ordered via the `order` field.
 */

import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId;
  portfolioId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  videoSource?: 'cloudinary' | 'youtube' | 'vimeo';
  aspectRatio?: '16:9' | '9:16' | '4:3' | '1:1';
  contentType?: string;
  subjectMatter?: string;
  softwareUsed?: string[];
  aiToolsUsed?: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    portfolioId: {
      type: Schema.Types.ObjectId,
      ref: 'Portfolio',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    thumbnailUrl: { type: String },
    videoUrl: { type: String },
    videoSource: {
      type: String,
      enum: ['cloudinary', 'youtube', 'vimeo', 'gdrive', 'direct'],
    },
    aspectRatio: {
      type: String,
      enum: ['16:9', '9:16', '4:3', '1:1'],
      default: '16:9',
    },
    contentType: { type: String, trim: true },
    subjectMatter: { type: String, trim: true },
    softwareUsed: [{ type: String }],
    aiToolsUsed: [{ type: String }],
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Compound index for efficient queries sorted by order within a portfolio
projectSchema.index({ portfolioId: 1, order: 1 });

const Project: Model<IProject> = mongoose.model<IProject>('Project', projectSchema);
export default Project;
