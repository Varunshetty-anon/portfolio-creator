/**
 * Settings Model
 *
 * Per-portfolio settings (SEO, theme). One-to-one with Portfolio.
 */

import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface ISettings extends Document {
  _id: mongoose.Types.ObjectId;
  portfolioId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  seoTitle?: string;
  seoDescription?: string;
  theme: string;
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    portfolioId: {
      type: Schema.Types.ObjectId,
      ref: 'Portfolio',
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    seoTitle: { type: String, trim: true },
    seoDescription: { type: String, trim: true },
    theme: { type: String, default: 'dark', trim: true },
  },
  { timestamps: true },
);

const Settings: Model<ISettings> = mongoose.model<ISettings>('Settings', settingsSchema);
export default Settings;
