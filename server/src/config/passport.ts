/**
 * Passport.js Strategy Configuration
 *
 * Env vars used:
 *   GOOGLE_CLIENT_ID     — Google OAuth 2.0 client ID
 *   GOOGLE_CLIENT_SECRET — Google OAuth 2.0 client secret
 *   GOOGLE_CALLBACK_URL  — Google OAuth callback URL (e.g. http://localhost:5000/api/v1/auth/google/callback)
 */

import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

import User, { type IUser } from '../models/User.js';

// ── Serialization ───────────────────────────────────────────────────
passport.serializeUser((user, done) => {
  done(null, (user as IUser)._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// ── Local Strategy (email + password) ───────────────────────────────
passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
          return done(null, false, { message: 'Invalid email or password.' });
        }

        if (!user.passwordHash) {
          return done(null, false, {
            message: 'This account uses Google sign-in. Please log in with Google.',
          });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return done(null, false, { message: 'Invalid email or password.' });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

// ── Google OAuth 2.0 Strategy ───────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ??
          'http://localhost:5000/api/v1/auth/google/callback',
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          // Check if user already exists by googleId
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            return done(null, user);
          }

          // Check if a user with the same email already exists (link accounts)
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = await User.findOne({ email: email.toLowerCase() });
            if (user) {
              user.googleId = profile.id;
              if (!user.displayName && profile.displayName) {
                user.displayName = profile.displayName;
              }
              await user.save();
              return done(null, user);
            }
          }

          // Create new user
          user = await User.create({
            email: email?.toLowerCase(),
            googleId: profile.id,
            displayName: profile.displayName ?? '',
          });

          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      },
    ),
  );
} else {
  console.warn('⚠️  Google OAuth credentials not set — Google login disabled.');
}

export default passport;
