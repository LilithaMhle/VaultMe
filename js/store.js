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
      // Videos: { name, duration, src (base64 data URL) }
      videos: [],
      // Extra spotlight phrases user types (shown in ticker alongside achievements)
      spotlightPhrases: [],
      profileStrength: 0,
    };
  },

  // ── Load ──────────────────────────────────────────────────────────
  async getCurrentUser() {
    try {
      const { data } = await supabase.auth.getSession();
      return data?.session?.user || null;
    } catch (err) {
      console.error('Auth session failed', err);
      return null;
    }
  },

  async load() {
    try {
      const user = await this.getCurrentUser();
      if (!user) return this.defaults();

      const [profileRes, achievementsRes, certificatesRes, skillsRes, projectsRes, videosRes, phrasesRes] = await Promise.allSettled([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('achievements').select('*').eq('profile_id', user.id),
        supabase.from('certificates').select('*').eq('profile_id', user.id),
        supabase.from('skills').select('*').eq('profile_id', user.id),
        supabase.from('projects').select('*').eq('profile_id', user.id),
        supabase.from('videos').select('*').eq('profile_id', user.id),
        supabase.from('spotlight_phrases').select('*').eq('profile_id', user.id)
      ]);

      // IMPORTANT: the Supabase client does not reject its promises on query
      // errors (bad RLS policy, missing table/column, etc.) — it resolves with
      // { data: null, error: {...} } instead. That means `status` here is almost
      // always 'fulfilled' even when a query genuinely failed, so checking only
      // `status === 'rejected'` misses real errors completely and silently
      // returns empty data with no log to explain why. extractData() below checks
      // both the Promise status AND the Supabase-level `error` field.
      function extractData(settledResult, label) {
        if (settledResult.status === 'rejected') {
          console.error(label + ' query failed (rejected)', settledResult.reason);
          return null;
        }
        const { data, error } = settledResult.value;
        if (error) {
          console.error(label + ' query failed', error);
          return null;
        }
        return data;
      }

      const profile = extractData(profileRes, 'Profile');
      if (!profile) {
        return this.defaults();
      }

      const achievementsData = extractData(achievementsRes, 'Achievements') || [];
      const certificatesData = extractData(certificatesRes, 'Certificates') || [];
      const skillsData = extractData(skillsRes, 'Skills') || [];
      const projectsData = extractData(projectsRes, 'Projects') || [];
      const videosData = extractData(videosRes, 'Videos') || [];
      const phrasesData = extractData(phrasesRes, 'Spotlight phrases') || [];

      return {
        ...this.defaults(),

        name: profile.full_name || '',
        role: profile.role || '',
        location: profile.location || '',
        email: profile.email || '',

        linkedin: profile.linkedin || '',
        github: profile.github || '',

        bio: profile.bio || '',

        profilePhoto: profile.profile_photo || '',
        cv: profile.cv || '',
        cvName: profile.cv_name || '',

        achievements: (achievementsData || []).map(a => ({
          label: a.label,
          spotlightText: a.spotlight_text || '',
          photo: a.photo || ''
        })),

        certs: (certificatesData || []).map(c => ({
          name: c.certificate_name,
          org: c.organisation || '',
          year: c.year_completed || '',
          icon: c.icon || ''
        })),

        skills: (skillsData || []).map(s => ({
          name: s.skill_name,
          pct: s.proficiency_percentage
        })),

        projects: (projectsData || []).map(p => ({
          name: p.project_name,
          desc: p.description,
          url: p.project_url,
          tags: p.tags || []
        })),

        videos: (videosData || []).map(v => ({
          name: v.video_name,
          duration: v.duration,
          src: v.video || ''
        })),

        spotlightPhrases: (phrasesData || []).map(p => p.phrase),

        profileStrength: profile.profile_strength || 0
      };
    } catch (err) {
      console.error(err);
      return this.defaults();
    }
  },

  async save(profile) {
    profile.profileStrength = this.calcStrength(profile);

    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return null;
      }

    const result = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: profile.name,
      role: profile.role,
      location: profile.location,
      email: profile.email,
      linkedin: profile.linkedin,
      github: profile.github,
      bio: profile.bio,
      profile_photo: profile.profilePhoto,
      cv: profile.cv,
      cv_name: profile.cvName,
      profile_strength: profile.profileStrength
    });

    if (result.error) {
      console.error(result.error);
      alert(result.error.message);
      return null;
    }

    const sync = await this.syncRelatedTables(user.id, profile);
    if (!sync) {
      alert('Failed to save related profile data.');
      return null;
    }

    return profile;
  } catch (err) {
    console.error(err);
    alert("Failed to save profile");
    return null;
  }
},

async syncRelatedTables(profileId, profile) {
  const tableOps = [
    { table: 'achievements', deleteCols: ['profile_id'], insert: (items) => items.map(i => ({ profile_id: profileId, label: i.label, spotlight_text: i.spotlightText, photo: i.photo })) },
    { table: 'certificates', deleteCols: ['profile_id'], insert: (items) => items.map(i => ({ profile_id: profileId, certificate_name: i.name, organisation: i.org, year_completed: i.year, icon: i.icon || '' })) },
    { table: 'skills', deleteCols: ['profile_id'], insert: (items) => items.map(i => ({ profile_id: profileId, skill_name: i.name, proficiency_percentage: i.pct })) },
    { table: 'projects', deleteCols: ['profile_id'], insert: (items) => items.map(i => ({ profile_id: profileId, project_name: i.name, description: i.desc, project_url: i.url, tags: i.tags || [] })) },
    { table: 'videos', deleteCols: ['profile_id'], insert: (items) => items.map(i => ({ profile_id: profileId, video_name: i.name, duration: i.duration, video: i.src })) },
    { table: 'spotlight_phrases', deleteCols: ['profile_id'], insert: (items) => items.map(i => ({ profile_id: profileId, phrase: i })) }
  ];

  try {
    for (const op of tableOps) {
      const del = await supabase.from(op.table).delete().eq('profile_id', profileId);
      if (del.error) {
        console.error('Delete failed for', op.table, del.error);
        return false;
      }

      const items = op.table === 'spotlight_phrases' ? profile.spotlightPhrases || [] : profile[op.table === 'achievements' ? 'achievements' : op.table === 'certificates' ? 'certs' : op.table === 'skills' ? 'skills' : op.table === 'projects' ? 'projects' : op.table === 'videos' ? 'videos' : 'spotlightPhrases'] || [];
      const rows = op.insert(items);
      if (rows.length === 0) continue;
      const ins = await supabase.from(op.table).insert(rows);
      if (ins.error) {
        console.error('Insert failed for', op.table, ins.error);
        return false;
      }
    }

    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
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

  // ── Helper: read file as base64 data URL (with size check) ────────
  readFile(file, maxMB) {
    return new Promise((res, rej) => {
      if (maxMB && file.size > maxMB * 1024 * 1024) {
        rej(new Error('FILE_TOO_LARGE'));
        return;
      }
      const r = new FileReader();
      r.onload = e => res(e.target.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  },

  // ── Validate email format ─────────────────────────────────────────
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  // ── Normalise social URL (always returns full https:// URL or '') ──
  normaliseSocialUrl(raw) {
    if (!raw) return '';
    const s = raw.trim();
    if (!s) return '';
    // Already has a protocol
    if (/^https?:\/\//i.test(s)) return s;
    // Starts with www. or a known domain fragment
    return 'https://' + s;
  },

  // ── Build ticker items from profile ──────────────────────────────
  buildTickerItems(profile) {
    const items = [];
    profile.achievements.forEach(a => {
      if (a.spotlightText) items.push({ icon: 'ti-sparkles', text: a.spotlightText });
    });
    profile.spotlightPhrases.forEach(p => {
      if (p) items.push({ icon: 'ti-star', text: p });
    });
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