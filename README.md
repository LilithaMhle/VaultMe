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

---

---

## Changes & Additions — Group Development Log

The following is a full record of every bug fix, improvement and addition made to this project after the initial build. This section documents the work done so the group can see exactly what was changed and why.

---

### Session 1 — Bug Audit & Fixes

A full audit of the codebase was carried out. The following problems were found and fixed.

---

#### 🔴 Critical Fixes

**Silent data loss on localStorage overflow** — `js/store.js`
The `save()` function had no error handling. When the browser's ~5 MB localStorage quota is exceeded (easy to hit with photos + a PDF CV stored as base64), the write fails silently and all profile data is lost with no warning. Fixed by wrapping `localStorage.setItem` in a `try/catch`. If the quota is hit, the user now sees a clear alert: *"Storage limit reached. Try using smaller images."*

**No file size checks before upload** — `js/store.js`, `pages/signup.html`, `pages/upload.html`
Files were read and encoded immediately with no size check, so a large image would silently cause the storage write to fail later. Fixed by adding a `maxMB` limit to the `readFile()` helper. Limits enforced:
- Profile photo → 5 MB
- Achievement photos → 5 MB each
- CV (PDF) → 10 MB
- Videos → 100 MB

Each limit shows a specific alert if exceeded.

**Videos were not real** — `pages/upload.html`, `index.html`, `pages/public.html`
The "Videos" section only let users type a title and duration — there was no actual file input. The dashboard showed a fake play button with no video behind it. Fixed by replacing the fake form with a real `<input type="file" accept="video/mp4,video/quicktime">`. The video's real duration is now auto-detected, videos over 3 minutes are rejected before upload, the file is stored as base64, and a real `<video controls>` element plays it back on the dashboard and public profile.

---

#### 🟠 Functional Bug Fixes

**Vela AI was returning hardcoded responses** — `js/vela.js`
Vela was labelled "Career AI" but only returned fixed strings for four preset buttons. Any text typed into the free-text box got the same generic reply regardless of what was written. Replaced with real API calls to the Anthropic Claude API. Vela now receives a structured summary of the user's full profile as context and returns genuinely personalised answers. A typing animation (three bouncing dots) shows while the response loads. The four quick-action buttons still use fast local responses.

**Email field had no validation** — `js/store.js`, `pages/signup.html`, `pages/public.html`
The email was saved and used to build `mailto:` links with no format check. A typo or random text would produce a broken link on the public profile. Fixed by adding a `VM.isValidEmail()` helper that validates format before saving and before generating any link.

**LinkedIn and GitHub URLs broke for some input formats** — `js/store.js`, `pages/public.html`, `pages/signup.html`
The URL handling used a regex strip + `https://` prepend that broke for inputs like `linkedin.com/in/yourname` (no protocol). A `VM.normaliseSocialUrl()` helper was added that correctly handles all common formats.

**Dashboard showed "empty vault" even when data existed** — `index.html`
The empty-state check was `!p.name && !p.achievements.length && !p.certs.length`. A user who only had skills or projects filled in would still see the empty state and their data would be hidden. Fixed to also check `p.projects.length` and `p.skills.length`.

**CV file type mismatch between pages** — `pages/signup.html`
The signup page accepted `.pdf`, `.doc` and `.docx`. The upload page only accepted `.pdf`. A `.doc` CV saved from signup could not be replaced from the upload page. Fixed signup to only accept `.pdf`, consistent with the upload page.

**Syntax error from unescaped quotes** — `pages/upload.html`
The `renderAchUpload()` function built an `onclick` attribute string using unescaped single quotes inside a single-quoted string. This broke the JavaScript parser entirely on that page. Fixed by storing the element ID in a variable first and using properly escaped quotes.

---

#### 🟡 UX & Accessibility Fixes

**Form data lost when navigating mid-step** — `pages/signup.html`
`saveAll()` only ran when the Next or Back buttons were clicked. If a user filled in Step 2 then clicked a top nav link, all their Step 2 input was discarded. Fixed by adding `visibilitychange` and `beforeunload` event listeners that call `saveAll()` any time the user leaves the page.

**Icon-only buttons had no accessible labels** — `index.html`, `pages/analytics.html`, `pages/signup.html`, `pages/upload.html`
The Vela chat open/close/send buttons and all dynamically generated trash buttons had no `aria-label` or `title` attribute. Screen readers could not identify them and they triggered accessibility errors in the Microsoft Edge Tools linter. All icon-only buttons now have `aria-label` and `title`.

**Analytics page implied it tracked visitors** — `pages/analytics.html`
The analytics page looked like it was showing engagement data. It was only reading the user's own profile from localStorage. A clear note was added: *"Analytics show your profile strength and data coverage — not visitor tracking."*

---

#### 🔵 Cross-Browser Fix

**Frosted glass nav did not work on Safari / iOS** — `css/shared.css`, `pages/public.html`
`backdrop-filter: blur(14px)` is not supported on Safari without the `-webkit-` vendor prefix. The nav bar appeared fully opaque on Safari and iOS. Fixed by adding `-webkit-backdrop-filter: blur(14px)` before the standard property on both `.topnav` and `.pub-nav`.

---

### Session 2 — Theme Redesign (Pink → Blue)

The full colour scheme was changed from pink/rose to black and blue.

**CSS variables updated** — `css/shared.css`

| Variable | Before (Pink) | After (Blue) |
|----------|--------------|-------------|
| Primary accent | `#be185d` | `#1d4ed8` |
| Bright accent | `#ec4899` | `#3b82f6` |
| Light tint | `#fbcfe8` | `#bfdbfe` |
| Dark background | `#3d0018` | `#0a1628` |
| Base background | `#09000f` | `#060b14` |
| Body text | pinkish white | `#f0f6ff` |
| Subtext | `#f9a8d4` | `#93c5fd` |
| Glow effects | `rgba(190,24,93,...)` | `rgba(59,130,246,...)` |

**Hardcoded hex values also updated across all HTML files:**
- Favicon icon background colour
- Certificate and project card background colour arrays (`COLORS`)
- Video card gradient backgrounds (`VID_BG`)
- Signup page hero radial gradient
- Analytics SVG progress ring track colour
- Analytics ring percentage text fill colour

Every file was audited to ensure no pink/rose hex values remained after the variable update.

---

### Session 3 — Sidebar Navigation Fix

**Sidebar scroll links were completely broken** — `index.html`

The Certificates, Projects, Skills and Videos links in the left sidebar were using `href="#certs"`, `href="#projects"` etc. as anchor links. These did not work for two reasons:

1. The anchor targets (`<a name="certs">`) were inside `display:none` containers so the browser could not find them.
2. The page content scrolls inside `#main-content` (an inner `div` with `overflow-y: auto`), not the window. Browser anchor links scroll `window`, so even a correct ID would have had no visible effect.

**Fix:** All four broken anchor links were replaced with `onclick="navScrollTo('section-id')"` calls. The `navScrollTo()` function scrolls the `#main-content` div directly using `scrollTo({ behavior: 'smooth' })` and updates the active highlight on the clicked nav item. If a section has no data yet (still hidden), a friendly toast message appears instead: *"No certificates yet — add them in Edit profile"* — so the button always gives useful feedback rather than doing nothing.

Files changed: `index.html` only.

---

*README maintained by Zibusiso Ntethelelo Msane — VaultMe project.*