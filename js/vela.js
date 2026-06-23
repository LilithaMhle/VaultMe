/**
 * VaultMe — Vela AI Chatbot (client-side)
 *
 * All AI calls go through the backend proxy at /api/vela.
 * The Anthropic API key is NEVER present in this file or any
 * other browser-side code — it lives only in server.js via .env.
 *
 * Quick-action buttons now also use real AI responses (with a
 * focused directive sent to the server) instead of hardcoded strings.
 */
(function () {
  'use strict';

  // ── Chat window open/close ────────────────────────────────────────
  var chatOpen = false;

  var faqAnswers = {
    profile: 'Open the Sign up / Edit profile page and fill in your details, skills, projects, certificates, and bio. Save the form to update your dashboard and analytics.',
    cv: 'Use the Upload page to upload a CV file. The CV is stored locally and can be linked to your public profile once it is uploaded.',
    certificates: 'Add certificates in your profile form by entering the certificate name, issuing organisation, and year. They will then appear on your dashboard.',
    videos: 'Upload videos on the Upload page. Videos must be shorter than 3 minutes and will show on your dashboard and public profile if added.',
    publicProfile: 'Your public profile is available on the Public view page. Share that page link with employers once your profile is complete.',
    profileStrength: 'Profile strength measures how complete your VaultMe profile is. Adding more skills, achievements, certificates, projects, and a CV improves your score.',
    analytics: 'The Analytics page shows how complete your profile is and where you have strong or weak areas. Use it to track your progress and fill in missing sections.',
    achievements: 'Achievements are highlighted items that show your best awards, projects, or skills. Add them in your profile to make your vault stand out.',
    uploads: 'The Upload page lets you add profile photos, CV files, and videos. Each file is stored locally and can be shown on your public profile if uploaded.',
    support: 'VaultMe stores profile data locally in your browser, while the AI requests are proxied securely through the server. Your Anthropic API key is never exposed in browser code.'
  };

  function getFaqAnswer(key) {
    return faqAnswers[key] || '';
  }

  window.toggleC = function (e) {
    e.stopPropagation();
    chatOpen = !chatOpen;
    var w = document.getElementById('cwin');
    if (w) w.classList.toggle('open', chatOpen);
  };

  // ── Quick-action buttons (now use real AI, not hardcoded strings) ─
  window.askV = function (key) {
    var profile = VM.load();
    var qEl = document.querySelector('.cq[data-key="' + key + '"]');
    var questionText = qEl ? qEl.textContent : key;

    addM(questionText, 'user');
    var qs = document.getElementById('cwqs');
    if (qs) qs.style.display = 'none';

    var faqResponse = getFaqAnswer(key);
    if (faqResponse) {
      addM(faqResponse, 'ai');
      return;
    }

    var typingId = 'vela-typing-' + Date.now();
    addTyping(typingId);

    callVelaAPI(questionText, buildProfileSummary(profile), key)
      .then(function (reply) {
        removeTyping(typingId);
        addM(reply, 'ai');
      })
      .catch(function () {
        removeTyping(typingId);
        addM(
          'I had a little trouble answering that. Try typing your question instead!',
          'ai'
        );
      });
  };

  // ── Free-text send ────────────────────────────────────────────────
  window.sendV = function () {
    var inp = document.getElementById('cwinput');
    if (!inp) return;
    var v = inp.value.trim();
    if (!v) return;

    addM(v, 'user');
    inp.value = '';

    var qs = document.getElementById('cwqs');
    if (qs) qs.style.display = 'none';

    var typingId = 'vela-typing-' + Date.now();
    addTyping(typingId);

    var profile = VM.load();

    callVelaAPI(v, buildProfileSummary(profile), null)
      .then(function (reply) {
        removeTyping(typingId);
        addM(reply, 'ai');
      })
      .catch(function () {
        removeTyping(typingId);
        addM(
          "I'm having trouble connecting right now. Try again in a moment!",
          'ai'
        );
      });
  };

  // ── Core API call — routes through /api/vela on the Express server ─
  /**
   * @param {string}      message        The user's message
   * @param {string}      profileSummary Plain-text profile context
   * @param {string|null} quickAction    "jobs" | "achieve" | "learn" | "ready" | null
   * @returns {Promise<string>} Vela's reply text
   */
  function callVelaAPI(message, profileSummary, quickAction) {
    return fetch('/api/vela', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message:        message,
        profileSummary: profileSummary,
        quickAction:    quickAction || undefined,
      }),
    })
      .then(function (r) {
        if (!r.ok) {
          return r.json().then(function (err) {
            throw new Error(err.error || 'Server error');
          });
        }
        return r.json();
      })
      .then(function (data) {
        if (!data.reply) throw new Error('Empty response from server');
        return data.reply;
      });
  }

  // ── Build plain-text profile summary for the system prompt ────────
  function buildProfileSummary(p) {
    var lines = [];
    lines.push('Name: '             + (p.name     || 'Not set'));
    lines.push('Role: '             + (p.role     || 'Not set'));
    lines.push('Location: '         + (p.location || 'Not set'));
    lines.push('Bio: '              + (p.bio      || 'Not set'));
    lines.push('Profile strength: ' + (p.profileStrength || 0) + '%');
    lines.push('Achievements ('     + p.achievements.length + '): ' +
      p.achievements.map(function (a) { return a.label; }).join(', '));
    lines.push('Certificates ('     + p.certs.length + '): ' +
      p.certs.map(function (c) { return c.name + ' (' + c.org + ')'; }).join(', '));
    lines.push('Skills: ' +
      p.skills.map(function (s) { return s.name + ' ' + s.pct + '%'; }).join(', '));
    lines.push('Projects ('         + p.projects.length + '): ' +
      p.projects.map(function (pr) { return pr.name; }).join(', '));
    lines.push('Has CV: '           + (p.cv           ? 'Yes' : 'No'));
    lines.push('Has profile photo: ' + (p.profilePhoto ? 'Yes' : 'No'));
    return lines.join('\n');
  }

  // ── DOM helpers ───────────────────────────────────────────────────
  function addM(text, type) {
    var el = document.getElementById('cwm');
    if (!el) return;
    var d = document.createElement('div');
    d.className = 'cm ' + type;
    d.textContent = text;
    el.appendChild(d);
    el.scrollTop = el.scrollHeight;
  }

  function addTyping(id) {
    var el = document.getElementById('cwm');
    if (!el) return;
    var d = document.createElement('div');
    d.className = 'cm ai';
    d.id = id;
    d.innerHTML =
      '<span class="vela-typing">' +
      '<span></span><span></span><span></span>' +
      '</span>';
    el.appendChild(d);
    el.scrollTop = el.scrollHeight;
  }

  function removeTyping(id) {
    var el = document.getElementById(id);
    if (el) el.remove();
  }

  // ── Personalise greeting on page load ────────────────────────────
  window.addEventListener('DOMContentLoaded', function () {
    var profile  = VM.load();
    var greeting = document.getElementById('vela-greeting');
    if (!greeting) return;
    var firstName = profile.name ? ' ' + profile.name.split(' ')[0] + '!' : '!';
    var strength  = profile.profileStrength || 0;
    greeting.innerHTML =
      'Hi' + firstName +
      ' &#128075; I&rsquo;m <strong>Vela</strong>, your Career AI.' +
      ' Your profile is at <strong style="color:var(--rm);">' +
      strength + '%</strong> strength.' +
      ' Ask me anything about your career or VaultMe features, such as uploads, profile setup, or certificates.';
  });
})();
