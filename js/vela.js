// Vela Chatbot — with real AI responses via Anthropic API
(function(){
  var co = false;
  window.toggleC = function(e) {
    e.stopPropagation();
    co = !co;
    var w = document.getElementById('cwin');
    if (w) w.classList.toggle('open', co);
  };

  window.askV = function(key) {
    var profile = VM.load();
    var kb = VM.velaKnowledge(profile);
    var qEl = document.querySelector('.cq[data-key="' + key + '"]');
    if (qEl) addM(qEl.textContent, 'user');
    var qs = document.getElementById('cwqs');
    if (qs) qs.style.display = 'none';
    setTimeout(function(){ addM(kb[key] || 'Great question! Keep building your vault and Vela will give you better insights as your profile grows.', 'ai'); }, 650);
  };

  window.sendV = function() {
    var inp = document.getElementById('cwinput');
    if (!inp) return;
    var v = inp.value.trim();
    if (!v) return;
    addM(v, 'user');
    inp.value = '';
    var qs = document.getElementById('cwqs');
    if (qs) qs.style.display = 'none';

    // Show typing indicator
    var typingId = 'vela-typing-' + Date.now();
    addTyping(typingId);

    // Build profile summary for context
    var profile = VM.load();
    var profileSummary = buildProfileSummary(profile);

    // Call Anthropic API
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: 'You are Vela, a friendly and knowledgeable Career AI assistant built into VaultMe — a personal portfolio and achievement vault app. Your job is to give actionable, specific career guidance based on the user\'s profile data. Keep responses concise (2-4 sentences), warm, and practical. Do not use markdown formatting. Address the user by name if you know it. Here is the user\'s current profile:\n\n' + profileSummary,
        messages: [{ role: 'user', content: v }]
      })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      removeTyping(typingId);
      var text = (data.content && data.content[0] && data.content[0].text)
        ? data.content[0].text
        : 'I had trouble connecting. Check your internet and try again.';
      addM(text, 'ai');
    })
    .catch(function() {
      removeTyping(typingId);
      addM('I\'m having trouble connecting right now. Try again in a moment!', 'ai');
    });
  };

  function buildProfileSummary(p) {
    var lines = [];
    lines.push('Name: ' + (p.name || 'Not set'));
    lines.push('Role: ' + (p.role || 'Not set'));
    lines.push('Location: ' + (p.location || 'Not set'));
    lines.push('Bio: ' + (p.bio || 'Not set'));
    lines.push('Profile strength: ' + (p.profileStrength || 0) + '%');
    lines.push('Achievements (' + p.achievements.length + '): ' + p.achievements.map(function(a){ return a.label; }).join(', '));
    lines.push('Certificates (' + p.certs.length + '): ' + p.certs.map(function(c){ return c.name + ' (' + c.org + ')'; }).join(', '));
    lines.push('Skills: ' + p.skills.map(function(s){ return s.name + ' ' + s.pct + '%'; }).join(', '));
    lines.push('Projects (' + p.projects.length + '): ' + p.projects.map(function(pr){ return pr.name; }).join(', '));
    lines.push('Has CV: ' + (p.cv ? 'Yes' : 'No'));
    lines.push('Has profile photo: ' + (p.profilePhoto ? 'Yes' : 'No'));
    return lines.join('\n');
  }

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
    d.innerHTML = '<span class="vela-typing"><span></span><span></span><span></span></span>';
    el.appendChild(d);
    el.scrollTop = el.scrollHeight;
  }

  function removeTyping(id) {
    var el = document.getElementById(id);
    if (el) el.remove();
  }

  // Personalise greeting on load
  window.addEventListener('DOMContentLoaded', function(){
    var profile = VM.load();
    var greeting = document.getElementById('vela-greeting');
    if (greeting) {
      var name = profile.name ? ' ' + profile.name.split(' ')[0] + '!' : '!';
      var strength = profile.profileStrength || 0;
      greeting.innerHTML = 'Hi' + name + ' &#128075; I&rsquo;m <strong>Vela</strong>, your Career AI. Your profile is at <strong style="color:var(--rm);">' + strength + '%</strong> strength. Ask me anything about your career!';
    }
  });
})();