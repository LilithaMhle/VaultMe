// Vela Chatbot
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
    var profile = VM.load();
    var name = profile.name || 'you';
    setTimeout(function(){
      addM('Based on your vault, ' + name + ', keep documenting your achievements and adding live projects. The more complete your profile, the better Vela can guide you toward the right opportunities.', 'ai');
    }, 750);
  };

  function addM(text, type) {
    var el = document.getElementById('cwm');
    if (!el) return;
    var d = document.createElement('div');
    d.className = 'cm ' + type;
    d.textContent = text;
    el.appendChild(d);
    el.scrollTop = el.scrollHeight;
  }

  // personalise greeting on load
  window.addEventListener('DOMContentLoaded', function(){
    var profile = VM.load();
    var greeting = document.getElementById('vela-greeting');
    if (greeting) {
      var name = profile.name ? ' ' + profile.name.split(' ')[0] + '!' : '!';
      var strength = profile.profileStrength || 0;
      greeting.innerHTML = 'Hi' + name + ' &#128075; I&rsquo;m <strong>Vela</strong>, your Career AI. Your profile is at <strong style="color:var(--rm);">' + strength + '%</strong> strength. How can I help you today?';
    }
  });
})();
