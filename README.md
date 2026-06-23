# VaultMe — AI Portfolio Organiser

## Overview
VaultMe is a full-stack web application that lets students and job seekers build a
professional portfolio vault. It includes an AI Career assistant (Vela) powered by
Claude, a responsive multi-page frontend, and a secure Node.js/Express backend.

---

## How to run (full-stack, recommended)

### Prerequisites
- Node.js 18 or later — https://nodejs.org
- An Anthropic API key — https://console.anthropic.com

### Setup steps
```bash
# 1. Install dependencies
npm install

# 2. Create your environment file
cp .env.example .env

# 3. Open .env and paste your Anthropic API key
#    ANTHROPIC_API_KEY=sk-ant-...

# 4. Start the server
npm start
# or for development (auto-restart on file changes):
npm run dev

# 5. Open your browser at:
#    http://localhost:3000
```

> **Why a backend?**  
> The Anthropic API key must never be exposed in browser code. The Express server
> acts as a secure proxy — your key lives only in `.env` on the server.

---

## Pages
- `/` (`index.html`) — Dashboard
- `/pages/signup.html` — Set up or edit your profile
- `/pages/analytics.html` — Profile completion & skill coverage
- `/pages/upload.html` — Upload/manage photos, CV, videos
- `/pages/public.html` — Public view (what employers see)

---

## Architecture

```
Browser (HTML/CSS/JS)
  │
  │  GET /           → serves index.html
  │  GET /pages/*    → serves static pages
  │  GET /css|js/*   → serves static assets
  │
  └─ POST /api/vela  ──→  Express server (server.js)
                               │
                               │  API key from .env (never in browser)
                               │
                               └──→  Anthropic Claude API
                                         │
                                      AI reply
                                         │
                               ←─────────┘
  ← { reply: "..." } ─────────┘
```

### Security features (server.js)
| Feature | Implementation |
|---|---|
| API key protection | Stored in `.env`, read server-side only |
| Helmet headers | CSP, X-Frame-Options, HSTS, Referrer-Policy |
| CORS restriction | Only configured origin(s) allowed |
| Rate limiting | 20 requests/IP/minute on `/api/vela` |
| Input validation | Length + type checks before any API call |
| Body size cap | 64 KB max request body |

---

## Vela AI Chatbot
- All four quick-action buttons now call the real AI (personalised to your profile)
- Free-text chat uses the same secure backend proxy
- The system prompt includes your full profile as context so answers are specific
- If the server is unavailable, Vela shows a clear error message

---

## Database design (SQL Server / SSMS)
All data is stored in `localStorage` for the browser demo. To connect to a real
database, the following schema applies:

```sql
CREATE TABLE profiles (
  user_id     INT PRIMARY KEY IDENTITY,
  name        NVARCHAR(100),
  role        NVARCHAR(100),
  location    NVARCHAR(100),
  email       NVARCHAR(200),
  linkedin    NVARCHAR(300),
  github      NVARCHAR(300),
  bio         NVARCHAR(1000),
  profile_strength INT DEFAULT 0,
  created_at  DATETIME DEFAULT GETDATE()
);

CREATE TABLE achievements (
  id          INT PRIMARY KEY IDENTITY,
  user_id     INT REFERENCES profiles(user_id),
  label       NVARCHAR(200),
  spotlight   NVARCHAR(500),
  photo_url   NVARCHAR(500),
  sort_order  INT DEFAULT 0
);

CREATE TABLE certificates (
  id          INT PRIMARY KEY IDENTITY,
  user_id     INT REFERENCES profiles(user_id),
  name        NVARCHAR(200),
  org         NVARCHAR(200),
  year        INT
);

CREATE TABLE projects (
  id          INT PRIMARY KEY IDENTITY,
  user_id     INT REFERENCES profiles(user_id),
  name        NVARCHAR(200),
  description NVARCHAR(1000),
  url         NVARCHAR(500),
  tags        NVARCHAR(300)
);

CREATE TABLE skills (
  id          INT PRIMARY KEY IDENTITY,
  user_id     INT REFERENCES profiles(user_id),
  name        NVARCHAR(100),
  pct         INT
);

CREATE TABLE videos (
  id          INT PRIMARY KEY IDENTITY,
  user_id     INT REFERENCES profiles(user_id),
  name        NVARCHAR(200),
  duration    NVARCHAR(20)
);
```

---

## Deployment

### Render (recommended — free tier)
1. Push to GitHub
2. Create a new Web Service on https://render.com
3. Build command: `npm install`
4. Start command: `npm start`
5. Add `ANTHROPIC_API_KEY` as an environment variable in Render's dashboard
6. Set `ALLOWED_ORIGIN` to your Render URL (e.g. `https://vaultme.onrender.com`)

### Heroku
```bash
heroku create vaultme
heroku config:set ANTHROPIC_API_KEY=sk-ant-...
heroku config:set ALLOWED_ORIGIN=https://vaultme.herokuapp.com
git push heroku main
```

---

## Development log

### Session 1 — Bug Audit & Fixes

#### 🔴 Critical Fixes

**Silent data loss on localStorage overflow** — `js/store.js`  
The `save()` function had no error handling. When the browser's ~5 MB localStorage
quota is exceeded the write fails silently. Fixed by wrapping `localStorage.setItem`
in a `try/catch` with a clear user alert.

**No file size checks before upload** — `js/store.js`, `pages/signup.html`, `pages/upload.html`  
Added `maxMB` limit to the `readFile()` helper:
- Profile photo → 5 MB
- Achievement photos → 5 MB each
- CV (PDF) → 10 MB
- Videos → 100 MB

**Videos were not real** — `pages/upload.html`, `index.html`, `pages/public.html`  
Replaced fake form with a real `<input type="file" accept="video/mp4,video/quicktime">`.
Auto-detects duration, rejects videos over 3 minutes, stores as base64.

#### 🟠 Functional Bug Fixes

**Vela AI used hardcoded responses** — `js/vela.js`  
Replaced with real API calls routed through the secure Express backend proxy.
Quick-action buttons now also call the real AI with focused directives.

**Email field had no validation** — `js/store.js`  
Added `VM.isValidEmail()` helper.

**LinkedIn/GitHub URLs broke for some formats** — `js/store.js`  
Added `VM.normaliseSocialUrl()` helper.

#### 🟡 UX & Accessibility Fixes

**Form data lost when navigating mid-step** — `pages/signup.html`  
Added `visibilitychange` and `beforeunload` listeners.

**Icon-only buttons had no accessible labels** — all pages  
All icon-only buttons now have `aria-label` and `title`.

#### 🔵 Cross-Browser Fix

**Frosted glass nav broke on Safari/iOS** — `css/shared.css`  
Added `-webkit-backdrop-filter` vendor prefix.

### Session 2 — Theme Redesign (Pink → Blue)

Full colour scheme changed from pink/rose to black and blue.

### Session 3 — Sidebar Navigation Fix

Sidebar anchor links replaced with `navScrollTo()` calls that scroll the inner
`#main-content` div correctly.

### Session 4 — Backend & Security

**API key exposed in browser** — `js/vela.js`  
Moved all Anthropic API calls to a new `server.js` Express backend proxy.
The API key is now stored in `.env` and never sent to the browser.

**No rate limiting or security headers** — `server.js`  
Added Helmet (HTTP security headers), express-rate-limit (20 req/IP/min on
`/api/vela`), input validation, and CORS restriction.

**Quick-action buttons returned hardcoded strings** — `js/vela.js`  
All four buttons now call the real AI with personalised, profile-aware responses.

---

*README maintained by Zibusiso Ntethelelo Msane — VaultMe project.*
