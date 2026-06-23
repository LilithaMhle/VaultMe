/**
 * VaultMe — Express Backend Server
 *
 * Responsibilities:
 *  1. Serve the static frontend files (HTML/CSS/JS)
 *  2. Provide a secure /api/vela proxy endpoint that calls the
 *     Anthropic API server-side, so the API key is NEVER exposed
 *     to the browser.
 *  3. Apply security headers (Helmet), CORS restrictions, and
 *     rate limiting to protect the API from abuse.
 *
 * Usage:
 *   1. Copy .env.example to .env and set ANTHROPIC_API_KEY
 *   2. npm install
 *   3. npm start        (production)
 *      npm run dev      (development, auto-restarts on changes)
 *   4. Open http://localhost:3000 in your browser
 */

'use strict';

// ── Load environment variables from .env ──────────────────────────────────────
require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const Anthropic    = require('@anthropic-ai/sdk');
const path         = require('path');

// ── Validate required environment variables ───────────────────────────────────
if (!process.env.ANTHROPIC_API_KEY) {
  console.error(
    '\n[VaultMe] ERROR: ANTHROPIC_API_KEY is not set.\n' +
    'Copy .env.example to .env and add your key.\n'
  );
  process.exit(1);
}

// ── Initialise Anthropic client ───────────────────────────────────────────────
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Express app setup ─────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

// ── Security: HTTP headers via Helmet ─────────────────────────────────────────
// Sets X-Content-Type-Options, X-Frame-Options, Referrer-Policy, etc.
// Content-Security-Policy is configured to allow the CDN resources used by
// the frontend (Tabler Icons, Google Fonts) while blocking everything else.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        scriptSrc:   ["'self'", "'unsafe-inline'"],   // inline scripts in HTML pages
        styleSrc:    ["'self'", "'unsafe-inline'",
                      'https://cdn.jsdelivr.net',
                      'https://fonts.googleapis.com'],
        fontSrc:     ["'self'",
                      'https://cdn.jsdelivr.net',
                      'https://fonts.gstatic.com'],
        imgSrc:      ["'self'", 'data:'],             // data: for base64 images
        connectSrc:  ["'self'"],                      // no direct browser → Anthropic
        mediaSrc:    ["'self'", 'data:'],             // base64 videos
        objectSrc:   ["'none'"],
        frameSrc:    ["'none'"],
      },
    },
  })
);

// ── CORS ──────────────────────────────────────────────────────────────────────
// In development, allow any localhost or file:// origin.
// In production, restrict to the configured ALLOWED_ORIGIN.
const allowedOrigin = process.env.ALLOWED_ORIGIN || null;

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (same-origin, Postman, curl)
      if (!origin) return callback(null, true);

      // Allow localhost and file:// origins in development
      if (
        !allowedOrigin ||
        origin === allowedOrigin ||
        /^http:\/\/localhost(:\d+)?$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) ||
        origin === 'null'   // file:// pages report origin as "null"
      ) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '64kb' }));   // 64 KB cap — profile summaries are small

// ── Rate limiting for the AI endpoint ────────────────────────────────────────
// Prevents a single user (or bot) from exhausting the Anthropic quota.
const velaLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1-minute window
  max:      20,         // max 20 requests per IP per minute
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    error: 'Too many requests. Please wait a moment before asking Vela again.',
  },
});

// ── Static files (the frontend) ───────────────────────────────────────────────
// Serve index.html, pages/, css/, js/, assets/ directly from this folder.
app.use(express.static(path.join(__dirname)));

// ── POST /api/vela — Secure Anthropic proxy ───────────────────────────────────
/**
 * Request body:
 *   {
 *     "message":        string   — the user's typed message or quick-action key
 *     "profileSummary": string   — plain-text profile context built on the client
 *     "quickAction":    string?  — optional: "jobs" | "achieve" | "learn" | "ready"
 *   }
 *
 * Response (200):
 *   { "reply": string }
 *
 * Error responses:
 *   400 — missing / invalid input
 *   429 — rate limit exceeded
 *   500 — upstream Anthropic error
 */
app.post('/api/vela', velaLimiter, async (req, res) => {
  const { message, profileSummary, quickAction } = req.body;

  // ── Input validation ────────────────────────────────────────────────────────
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required.' });
  }
  if (message.length > 1000) {
    return res.status(400).json({ error: 'Message is too long (max 1000 characters).' });
  }
  if (profileSummary && typeof profileSummary !== 'string') {
    return res.status(400).json({ error: 'Invalid profile summary.' });
  }

  // ── Build system prompt ─────────────────────────────────────────────────────
  // Quick-action buttons get a focused directive so the answers are specific
  // rather than generic, while still drawing on the user's real profile data.
  const quickActionDirectives = {
    jobs:    'The user wants to know what job roles best match their current profile. Be specific about role titles that suit their skills, projects, and certificates. Mention any gaps they should address first.',
    achieve: 'The user wants to know how to best use their achievements in job applications and interviews. Give concrete, actionable advice about where and how to present each achievement.',
    learn:   'The user wants to know what to learn next to advance their career. Look at their current skill percentages and recommend the most impactful next skill or certification to pursue.',
    ready:   'The user wants to know if their profile is ready for job applications. Give an honest assessment based on profile strength and missing sections. Be encouraging but specific about what still needs to be done.',
  };

  const quickDirective = quickAction && quickActionDirectives[quickAction]
    ? `\n\nFOCUS FOR THIS RESPONSE: ${quickActionDirectives[quickAction]}`
    : '';

  const systemPrompt =
    `You are Vela, a friendly and knowledgeable Career AI assistant built into VaultMe — a personal portfolio and achievement vault app. ` +
    `Your job is to answer user questions about their career profile, job readiness, and the VaultMe system itself. ` +
    `When the user asks about app features, navigation, data entry, or supported content, explain how VaultMe works and what the user can do. ` +
    `Keep responses concise (3-5 sentences), warm, and practical. ` +
    `Do not use markdown formatting — plain text only. ` +
    `Address the user by their first name if you know it. ` +
    `Never make up information about the user that is not in their profile.` +
    quickDirective +
    `\n\nVaultMe is a static frontend served by Express. It includes: dashboard, sign-up/edit profile, analytics, upload assets, and public profile pages. ` +
    `It stores profile details, achievements, certificates, projects, skills, videos, and CV data. ` +
    `If the user asks about the system, answer based on VaultMe's features and behavior, not on unknown personal data.` +
    (profileSummary
      ? `\n\nHere is the user's current VaultMe profile:\n\n${profileSummary.slice(0, 2000)}`
      : '\n\nThe user has not yet set up their profile.');

  // ── Call Anthropic API (server-side — key never leaves this file) ───────────
  try {
    const response = await anthropic.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 300,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: message.trim() }],
    });

    const reply = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join(' ')
      .trim();

    return res.json({ reply });

  } catch (err) {
    // Log server-side but never expose raw error details to the client
    console.error('[VaultMe /api/vela] Anthropic error:', err.message || err);

    // Return a friendly, non-leaking error message
    const status = err.status || 500;
    return res.status(status >= 400 && status < 600 ? status : 500).json({
      error: 'Vela is temporarily unavailable. Please try again in a moment.',
    });
  }
});

// ── Health-check endpoint (useful for deployment platforms) ──────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'VaultMe', timestamp: new Date().toISOString() });
});

// ── 404 handler — serve index.html for unmatched routes (SPA fallback) ───────
app.use((_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  ✅  VaultMe server running at http://localhost:${PORT}\n`);
});

module.exports = app; // exported for testing
