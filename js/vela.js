// Vela Chatbot — profile-aware local responses
//
// NOTE: An earlier version of this file called https://api.anthropic.com/v1/messages
// directly from the browser. That call could never work: it shipped no API key (and
// embedding a real key in client-side JS would expose it to every visitor), and the
// Anthropic API does not accept direct browser requests. It also called VM.load()
// without awaiting it, so every call site was working with a Promise object instead
// of the actual profile -- which threw immediately and left the UI stuck on the
// typing indicator forever. Both issues are fixed below: every VM.load() call is
// now properly awaited, and replies are generated locally from the user's real
// profile data (the same approach already used for the four quick-action buttons).
(function(){
  var co = false;
  window.toggleC = function(e) {
    e.stopPropagation();
    co = !co;
    var w = document.getElementById('cwin');
    if (w) w.classList.toggle('open', co);
  };

  window.askV = async function(key) {
    var qEl = document.querySelector('.cq[data-key="' + key + '"]');
    if (qEl) addM(qEl.textContent, 'user');
    var qs = document.getElementById('cwqs');
    if (qs) qs.style.display = 'none';

    var typingId = 'vela-typing-' + Date.now();
    addTyping(typingId);

    try {
      var profile = await VM.load();
      var kb = VM.velaKnowledge(profile);
      setTimeout(function(){
        removeTyping(typingId);
        addM(kb[key] || 'Great question! Keep building your vault and Vela will give you better insights as your profile grows.', 'ai');
      }, 500);
    } catch (err) {
      console.error('Vela failed to load profile', err);
      removeTyping(typingId);
      addM('Something went wrong loading your profile. Please try again in a moment.', 'ai');
    }
  };

  window.sendV = async function() {
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

    try {
      var profile = await VM.load();
      var reply = generateReply(v, profile);
      // Small delay so the typing indicator is visible and the reply feels considered,
      // rather than popping in instantly.
      setTimeout(function(){
        removeTyping(typingId);
        addM(reply, 'ai');
      }, 500);
    } catch (err) {
      console.error('Vela failed to generate a reply', err);
      removeTyping(typingId);
      addM('Something went wrong loading your profile. Please try again in a moment.', 'ai');
    }
  };

  // -- Local reply engine --------------------------------------------
  // Vela runs entirely client-side with no server, so it can't safely call a
  // hosted AI model (there is nowhere to keep an API key secret). Instead it
  // matches the free-text question against the same knowledge categories used
  // by the quick-action buttons, falling back to a helpful general response
  // that still reflects the user's real profile data.
  function generateReply(question, profile) {
    var q = question.toLowerCase();
    var kb = VM.velaKnowledge(profile);

    if (/ready|apply|application|strength|complete/.test(q)) return kb.ready;
    if (/achiev|standout|highlight|spotlight/.test(q)) return kb.achieve;
    if (/learn|skill|improve|study|course|certif/.test(q)) return kb.learn;
    if (/job|role|career|hire|position|match/.test(q)) return kb.jobs;

    var name = profile.name ? ' ' + profile.name.split(' ')[0] : '';
    return 'Thanks for the question' + name + '! I can currently help with career direction, ' +
      'how to use your achievements, what to learn next, and whether your profile is ' +
      'application-ready -- try asking about one of those, or tap a suggestion below.';
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
  window.addEventListener('DOMContentLoaded', async function(){
    var greeting = document.getElementById('vela-greeting');
    if (!greeting) return;
    try {
      var profile = await VM.load();
      var name = profile.name ? ' ' + profile.name.split(' ')[0] + '!' : '!';
      var strength = profile.profileStrength || 0;
      greeting.innerHTML = 'Hi' + name + ' &#128075; I&rsquo;m <strong>Vela</strong>, your Career AI. Your profile is at <strong style="color:var(--rm);">' + strength + '%</strong> strength. Ask me anything about your career!';
    } catch (err) {
      console.error('Vela greeting failed to load profile', err);
      greeting.innerHTML = 'Hi! I&rsquo;m <strong>Vela</strong>, your Career AI. Ask me anything about your career!';
    }
  });
})();
