/**
 * Portfolio Model
 *
 * Each user has at most one portfolio. The `username` field doubles as
 * the public URL slug (e.g. /p/jane-doe).
 *
 * Draft vs live separation: editing updates `draftContent`, publishing
 * copies it to `liveContent` and sets `isPublished`.
 */

import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ── Sub-document interfaces ─────────────────────────────────────────
export interface ISocials {
  email?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
  discord?: string;
}

export interface IAvailability {
  status?: boolean;
  link?: string;
}

// ── Main interface ──────────────────────────────────────────────────
export interface IPortfolio extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  username: string;
  isPublished: boolean;
  publishedAt?: Date;
  name?: string;
  role?: string;
  bio?: string;
  location?: string;
  languages?: string;
  contactEmail?: string;
  profileImageUrl?: string;
  showreelUrl?: string;
  showreelThumbnailUrl?: string;
  socials?: ISocials;
  availability?: IAvailability;
  theme?: 'magazine' | 'futuristic' | 'glassmorphic' | 'minimalism';
  draftContent?: Record<string, unknown>;
  liveContent?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ──────────────────────────────────────────────────────────
const portfolioSchema = new Schema<IPortfolio>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    username: {
      type: String,
      required: [true, 'Username is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^[a-z0-9-]+$/, 'Username may only contain lowercase letters, numbers, and hyphens.'],
    },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
    name: { type: String, trim: true },
    role: { type: String, trim: true },
    bio: { type: String, trim: true },
    location: { type: String, trim: true },
    languages: { type: String, trim: true },
    contactEmail: { type: String, trim: true },
    profileImageUrl: { type: String },
    showreelUrl: { type: String },
    showreelThumbnailUrl: { type: String },
    socials: {
      email: { type: String },
      instagram: { type: String },
      linkedin: { type: String },
      twitter: { type: String },
      youtube: { type: String },
      discord: { type: String },
    },
    availability: {
      status: { type: Boolean },
      link: { type: String },
    },
    theme: { type: String, enum: ['magazine', 'futuristic', 'glassmorphic', 'minimalism'], default: 'minimalism' },
    draftContent: { type: Schema.Types.Mixed },
    liveContent: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

const Portfolio: Model<IPortfolio> = mongoose.model<IPortfolio>('Portfolio', portfolioSchema);
export default Portfolio;
