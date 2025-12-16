# Deployment Guide for Portfolio Creator

Your portfolio creator is built and ready to deploy! Here are your deployment options:

## Option 1: Firebase Hosting (Recommended - Already Configured)

Firebase Hosting is ideal since you already have Firebase configured in your project.

### Quick Start:
```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Login to Firebase
firebase login

# 3. Initialize Firebase (if not already done)
firebase init hosting

# 4. Deploy to Firebase Hosting
firebase deploy
```

**Your project will get a public URL like:**
```
https://video-portfolio-c38e0.web.app
https://video-portfolio-c38e0.firebaseapp.com
```

---

## Option 2: Vercel (Easiest for Git Integration)

Vercel provides automatic deployments whenever you push to GitHub.

### Quick Start:
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Select your `portfolio-creator` repository
5. Click "Deploy"

**Your project will get a public URL like:**
```
https://portfolio-creator.vercel.app
```

---

## Option 3: Netlify (Alternative)

Netlify offers similar features to Vercel.

### Quick Start:
1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click "New site from Git"
4. Connect your repository
5. Settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click "Deploy site"

**Your project will get a public URL like:**
```
https://your-site-name.netlify.app
```

---

## Recommended Configuration for SPA (Single Page App)

Since this is a React SPA, ensure your deployment platform handles client-side routing correctly.

**Firebase Hosting:** ✅ Already configured in `firebase.json`

**Vercel:** ✅ Auto-configures for Next.js/React

**Netlify:** Add `_redirects` file:
```
/*    /index.html   200
```

---

## Environment Variables

If you need to add environment variables (API keys, etc.):

### Firebase Hosting:
```bash
firebase functions:config:set someservice.key="YOUR_KEY"
```

### Vercel:
Add them in Project Settings → Environment Variables

### Netlify:
Add them in Site Settings → Build & Deploy → Environment

---

## Next Steps

1. **Choose your deployment platform** (Firebase, Vercel, or Netlify)
2. **Follow the Quick Start** for your chosen platform
3. **Test your deployed site** at the public URL
4. **Configure custom domain** (optional) through your hosting provider

Your portfolio creator is production-ready! 🚀
