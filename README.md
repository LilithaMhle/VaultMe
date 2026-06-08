# VaultMe — AI Portfolio Organiser

## How to run
1. Unzip the folder
2. Open `index.html` in any modern browser (Chrome, Edge, Firefox)
3. No server needed — runs entirely in the browser
4. All data saves to your browser's localStorage automatically

## Pages
- `index.html` — Dashboard (your main view)
- `pages/signup.html` — Set up or edit your profile
- `pages/analytics.html` — Profile completion & skill coverage
- `pages/upload.html` — Upload/manage photos, CV, videos
- `pages/public.html` — Public view (what employers see)

## How to set up your profile
1. Open `pages/signup.html`
2. Fill in Identity (name, role, location, email, LinkedIn, GitHub, bio, photo)
3. Add Achievements (max 2) — each needs a label, a spotlight sentence, and a photo
4. Add Certificates, Skills & Projects, then upload your CV
5. Click "Finish & go to dashboard" — everything populates automatically

## The animation
- The achievement photos are dragged across the screen by an animated figure (legs + arms only)
- If you add 2 achievements, the photo card flips between them while being dragged
- The AI Spotlight ticker at the top scrolls the sentences you entered for each achievement, plus any extra phrases

## Data & privacy
- All data is stored in your browser's localStorage — nothing is sent to any server
- To clear all data: open browser DevTools → Application → localStorage → delete `vaultme_profile`

## Database (SSMS)
The app uses localStorage for the frontend demo. To connect to SQL Server:
- Table: `profiles` — store the JSON blob per user
- Table: `achievements` — user_id, label, spotlight_text, photo_url, sort_order
- Table: `certificates` — user_id, name, org, year
- Table: `projects` — user_id, name, desc, url, tags
- Table: `skills` — user_id, name, pct
- Table: `videos` — user_id, name, duration
