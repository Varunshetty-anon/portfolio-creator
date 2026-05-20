/**
 * User Model
 *
 * Stores authentication data. Password is optional (null for Google-only users).
 */

import mongoose, { Schema, type Document, type Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// ── Interface ───────────────────────────────────────────────────────
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash?: string | null;
  googleId?: string;
  displayName: string;
  onboarded: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// ── Schema ──────────────────────────────────────────────────────────
const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address.'],
    },
    passwordHash: {
      type: String,
      default: null,
    },
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
    displayName: {
      type: String,
      default: '',
      trim: true,
    },
    onboarded: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// ── Pre-save hook: hash password when modified ──────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

// ── Instance method: compare candidate password ─────────────────────
userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// ── Ensure passwordHash is never sent to the client ─────────────────
userSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(_doc: any, ret: any) {
    ret.passwordHash = undefined;
    ret.__v = undefined;
    return ret;
  },
});

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
export default User;
