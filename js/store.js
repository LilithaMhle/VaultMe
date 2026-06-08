// VaultMe — Data Store
// All profile data lives in localStorage under key "vaultme_profile"

const VM = {

  // ── Default empty profile ─────────────────────────────────────────
  defaults() {
    return {
      name: '',
      role: '',
      location: '',
      email: '',
      linkedin: '',
      github: '',
      bio: '',
      profilePhoto: '',   // base64 data URL
      cv: '',             // base64 data URL
      cvName: '',
      // Standout achievements (max 2) — each has: label, spotlightText, photo (base64)
      achievements: [],
      // Certificates array: { name, org, year, icon }
      certs: [],
      // Skills: { name, pct }
      skills: [],
      // Projects: { name, desc, url, tags }
      projects: [],
      // Videos: { name, duration }
      videos: [],
      // Extra spotlight phrases user types (shown in ticker alongside achievements)
      spotlightPhrases: [],
      profileStrength: 0,
    };
  },

  // ── Load ──────────────────────────────────────────────────────────
  load() {
    try {
      const raw = localStorage.getItem('vaultme_profile');
      if (raw) return { ...this.defaults(), ...JSON.parse(raw) };
    } catch(e) {}
    return this.defaults();
  },

  // ── Save ──────────────────────────────────────────────────────────
  save(profile) {
    profile.profileStrength = this.calcStrength(profile);
    localStorage.setItem('vaultme_profile', JSON.stringify(profile));
    return profile;
  },

  // ── Calc profile strength ─────────────────────────────────────────
  calcStrength(p) {
    let s = 0;
    if (p.name) s += 10;
    if (p.role) s += 5;
    if (p.bio) s += 5;
    if (p.profilePhoto) s += 10;
    if (p.cv) s += 10;
    if (p.achievements.length >= 1) s += 15;
    if (p.achievements.length >= 2) s += 5;
    if (p.certs.length >= 1) s += 10;
    if (p.certs.length >= 3) s += 5;
    if (p.skills.length >= 3) s += 8;
    if (p.projects.length >= 1) s += 7;
    if (p.projects.length >= 2) s += 5;
    if (p.videos.length >= 1) s += 5;
    return Math.min(s, 100);
  },

  // ── Helper: read file as base64 data URL ──────────────────────────
  readFile(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = e => res(e.target.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  },

  // ── Build ticker items from profile ──────────────────────────────
  buildTickerItems(profile) {
    const items = [];
    // From achievements
    profile.achievements.forEach(a => {
      if (a.spotlightText) items.push({ icon: 'ti-sparkles', text: a.spotlightText });
    });
    // User-entered spotlight phrases
    profile.spotlightPhrases.forEach(p => {
      if (p) items.push({ icon: 'ti-star', text: p });
    });
    // Auto-generated from certs/projects
    if (profile.certs.length > 0) {
      items.push({ icon: 'ti-certificate', text: `${profile.certs.length} verified certificate${profile.certs.length > 1 ? 's' : ''} — industry-recognised credentials` });
    }
    if (profile.projects.length > 0) {
      items.push({ icon: 'ti-code', text: `${profile.projects.length} live project${profile.projects.length > 1 ? 's' : ''} — real deployed work` });
    }
    if (profile.skills.length > 0) {
      const top = profile.skills.slice(0,3).map(s=>s.name).join(', ');
      items.push({ icon: 'ti-trending-up', text: `Top skills: ${top}` });
    }
    // Duplicate for seamless loop
    const doubled = [...items, ...items];
    return doubled;
  },

  // ── Render ticker HTML ─────────────────────────────────────────────
  renderTicker(profile) {
    const items = this.buildTickerItems(profile);
    if (!items.length) {
      return `<div class="ticker-bar"><div class="ticker-lbl"><i class="ti ti-sparkles" style="font-size:12px;"></i>&nbsp;AI Spotlight</div><div class="ticker-scroll"><div class="ticker-inner" style="animation:none;"><span class="titem"><i class="ti ti-info-circle"></i>Add your achievements on the Sign Up page to see your AI Spotlight</span></div></div></div>`;
    }
    const html = items.map(it => `<span class="titem"><i class="ti ${it.icon}"></i>${escHtml(it.text)}</span>`).join('');
    const speed = Math.max(20, items.length * 4);
    return `<div class="ticker-bar"><div class="ticker-lbl"><i class="ti ti-sparkles" style="font-size:12px;"></i>&nbsp;AI Spotlight</div><div class="ticker-scroll"><div class="ticker-inner" style="animation:tickH ${speed}s linear infinite;">${html}</div></div></div>`;
  },

  // ── Render drag animation ──────────────────────────────────────────
  renderDragAnim(profile, prefix='') {
    const a = profile.achievements;
    const face1 = a[0]
      ? `<img src="${a[0].photo || ''}" alt="${escHtml(a[0].label)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/><div class="drag-placeholder" style="display:none;"><i class="ti ti-photo" style="font-size:28px;color:var(--b3);margin-bottom:6px;"></i><br/>${escHtml(a[0].label)}</div><div class="drag-photo-badge">${escHtml(a[0].label)}</div>`
      : `<div class="drag-placeholder"><i class="ti ti-photo" style="font-size:28px;color:var(--b3);margin-bottom:6px;display:block;"></i>Achievement 1</div>`;
    const face2 = a[1]
      ? `<img src="${a[1].photo || ''}" alt="${escHtml(a[1].label)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/><div class="drag-placeholder" style="display:none;"><i class="ti ti-photo" style="font-size:28px;color:var(--b3);margin-bottom:6px;"></i><br/>${escHtml(a[1].label)}</div><div class="drag-photo-badge">${escHtml(a[1].label)}</div>`
      : `<div class="drag-placeholder"><i class="ti ti-photo" style="font-size:28px;color:var(--b3);margin-bottom:6px;display:block;"></i>Achievement 2</div>`;

    const flipAnim = a.length >= 2 ? 'animation:auto-flip 14s ease-in-out infinite;' : '';
    return `<div class="drag-stage">
  <div class="drag-floor"></div><div class="drag-glow-floor"></div>
  <div class="drag-shadow" style="animation:drag-move 7s ease-in-out infinite;animation-delay:.1s;"></div>
  <div class="drag-group" style="animation:drag-move 7s ease-in-out infinite;">
    <div class="drag-flip-wrap">
      <div class="drag-flip-inner" style="${flipAnim}">
        <div class="drag-flip-face">${face1}</div>
        <div class="drag-flip-face drag-flip-back">${face2}</div>
      </div>
    </div>
    <div class="drag-connector">
      <div class="drag-rope"></div>
      <div class="drag-hands"><div class="drag-hand"></div><div class="drag-hand"></div></div>
      <div class="drag-arms"><div class="drag-arm l"></div><div class="drag-arm r"></div></div>
      <div class="drag-legs"><div class="drag-leg l"></div><div class="drag-leg r"></div></div>
      <div class="drag-shoes"><div class="drag-shoe"></div><div class="drag-shoe"></div></div>
    </div>
  </div>
</div>`;
  },

  // ── Vela AI chatbot knowledge ─────────────────────────────────────
  velaKnowledge(profile) {
    const name = profile.name || 'there';
    const certCount = profile.certs.length;
    const projCount = profile.projects.length;
    const achNames = profile.achievements.map(a=>a.label).join(' and ');
    return {
      jobs: `Based on your profile${name ? ' ' + name : ''}: your ${certCount} cert${certCount!==1?'s':''}, ${projCount} project${projCount!==1?'s':''}, and achievements (${achNames || 'not yet set'}) position you well for roles that match your strongest skills. Add more certificates and live project links to get specific role recommendations from employers.`,
      achieve: `Your standout achievements — ${achNames || 'add them in the Sign Up page'} — are genuine differentiators. Lead with them in your CV summary, reference them in interviews, and make sure they are visible at the top of your public profile.`,
      learn: `Based on your current skill stack, focus on deepening what you already have: add more projects using your top skills, get one more cloud or data certification, and document everything on your VaultMe public profile.`,
      ready: `You are at ${profile.profileStrength}% profile strength. ${profile.profileStrength >= 80 ? 'Your profile is strong — ready to share publicly and reference in applications.' : 'Add your achievements, more certificates, and at least 2 live projects to reach 80%+ and be application-ready.'}`
    };
  }
};

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
