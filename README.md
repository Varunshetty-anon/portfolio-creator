# FRAMES Studio

Premium portfolio builder for video editors, filmmakers, and motion designers.

## Architecture

```
portfolio-creator/
├── client/          # Frontend (Vite + React 18 + React Router v6)
├── server/          # Backend (Express.js + MongoDB + Cloudinary)
├── render.yaml      # Render deployment config
└── .env.example     # Environment variables template
```

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Cloudinary account
- Google Cloud OAuth credentials (optional)

### Setup

1. Clone and install:
```bash
git clone https://github.com/Varunshetty-anon/portfolio-creator.git
cd portfolio-creator

# Install dependencies
cd client && npm install && cd ..
cd server && npm install && cd ..
```

2. Configure environment:
```bash
cp .env.example server/.env
# Edit server/.env with your credentials
```

3. Run development:
```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
cd client && npm run dev
```

4. Open `http://localhost:3000`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, Framer Motion |
| Routing | React Router v6 |
| Backend | Express.js, TypeScript |
| Database | MongoDB Atlas (Mongoose) |
| Auth | Passport.js (Local + Google OAuth2), JWT |
| Media | Cloudinary CDN |
| Deployment | Render |

## Environment Variables

See [.env.example](.env.example) for all required variables.

## License

Private — All rights reserved.
