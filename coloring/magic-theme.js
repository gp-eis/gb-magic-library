/* GB Magic Library layer for the book maker: Gerry as the helper (talks and blinks),
   sparkles on taps, a star trail while painting, confetti on finishing, soft sounds,
   and Home returning to the Sugar Bugs quest. Reads the page only; never touches saved work. */
(function () {
  'use strict';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = s => document.querySelector(s);
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  let muted = store.get('cl.muted') === '1';
  let interacted = false;

  /* fonts */
  const fonts = document.createElement('link'); fonts.rel = 'stylesheet';
  fonts.href = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700;800&display=swap';
  document.head.appendChild(fonts);
  document.body.classList.add('cl-magic');

  /* ---------- sounds ---------- */
  let ctx = null;
  function tone(freqs, dur = .1, type = 'triangle', gain = .07) {
    if (muted) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      freqs.forEach((f, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = f;
        const t = ctx.currentTime + i * dur * .8; g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
        o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur + .02); });
    } catch (e) {}
  }
  const pop = () => tone([620, 930], .06), chime = () => tone([523, 659, 784, 1046, 1318], .12, 'triangle', .08);

  /* ---------- sparkles ---------- */
  const COLORS = ['#ffd36b', '#ff8a7d', '#8fe0c0', '#b9a2ff', '#ffffff'];
  function burst(x, y, n = 10) {
    if (RM) return;
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span'); s.className = 'cl-spark';
      const a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 60;
      s.style.left = x - 8 + 'px'; s.style.top = y - 8 + 'px'; s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d + 'px');
      s.style.setProperty('--c', COLORS[i % COLORS.length]);
      layer().appendChild(s); setTimeout(() => s.remove(), 850);
    }
  }
  /* open dialogs sit in the top layer, so effects go inside the open dialog when there is one */
  function layer() { return document.querySelector('dialog[open]') || document.body; }
  function confetti() {
    if (RM) return;
    for (let i = 0; i < 70; i++) {
      const c = document.createElement('i'); c.className = 'cl-confetti';
      c.style.left = Math.random() * 100 + 'vw'; c.style.background = COLORS[i % COLORS.length]; c.style.animationDelay = Math.random() * .6 + 's';
      layer().appendChild(c); setTimeout(() => c.remove(), 2800);
    }
  }
  document.addEventListener('pointerdown', e => {
    interacted = true;
    const t = e.target.closest('button,summary,.story-line,.activity-tab,.storybook-home-link');
    if (!t || t.disabled) return;
    burst(e.clientX, e.clientY, 9); pop();
  }, true);

  /* a little star trail while painting or tracing */
  let lastTrail = 0;
  function paintColor() {
    const pressed = document.querySelector('#swatches button[aria-pressed="true"]');
    if (pressed) return pressed.style.getPropertyValue('--paint') || pressed.dataset.color || '#ffd36b';
    const c = $('#color'); return c ? c.value : '#ffd36b';
  }
  document.addEventListener('pointermove', e => {
    if (RM || !(e.buttons & 1)) return;
    if (!(e.target instanceof HTMLCanvasElement) || !/^(editor|traceInk)$/.test(e.target.id)) return;
    const now = performance.now(); if (now - lastTrail < 45) return; lastTrail = now;
    const s = document.createElement('span'); s.className = 'cl-trail';
    s.style.left = e.clientX - 6 + 'px'; s.style.top = e.clientY - 6 + 'px';
    s.style.setProperty('--c', e.target.id === 'traceInk' ? '#ffd36b' : paintColor());
    layer().appendChild(s); setTimeout(() => s.remove(), 750);
  }, true);

  /* celebrations */
  document.addEventListener('click', e => {
    const t = e.target.closest('#finish,#studioFinish,#traceDone,#apply');
    if (t && !t.disabled) { setTimeout(() => { confetti(); chime(); }, 120); }
  }, true);

  /* Home goes back to the Sugar Bugs quest in the library */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href="../index.html"],a[href="../index.html#myLibrary"]');
    if (!a) return;
    if (/book=bye-bye-sugar-bugs|project=/.test(location.search) && a.getAttribute('href') === '../index.html') {
      try { sessionStorage.setItem('cl.return', 'quest:B3'); } catch (err) {}
    }
  }, true);

  /* ---------- Gerry takes over the helper ---------- */
  function speak(text) {
    if (muted || !interacted || !('speechSynthesis' in window) || !text) return false;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const ko = (document.documentElement.lang || '').startsWith('ko');
      u.lang = ko ? 'ko-KR' : 'en-US'; u.rate = .95; u.pitch = window.CLMate ? CLMate.pitch() : 1.15;
      u.onend = () => talk(0);
      speechSynthesis.speak(u); return true;
    } catch (e) { return false; }
  }
  let gerry = null, flapTimer = 0, talkUntil = 0;
  function frame(f) { if (gerry) gerry.querySelectorAll('img').forEach(i => i.classList.toggle('on', i.dataset.f === f)); }
  function talk(ms) {
    if (!gerry) return;
    clearTimeout(flapTimer);
    if (!ms) { gerry.classList.remove('talking'); frame('idle'); return; }
    talkUntil = Date.now() + ms; if (!RM) gerry.classList.add('talking');
    let open = false;
    (function step() { if (Date.now() > talkUntil) { talk(0); return; } open = !open; frame(open ? 'talk' : 'idle'); flapTimer = setTimeout(step, open ? 120 + Math.random() * 80 : 70 + Math.random() * 70); })();
  }
  function setupGerry() {
    const toggle = $('#gpHelperToggle'); if (!toggle) return false;
    if (toggle.querySelector('.cl-gerry')) return true;
    gerry = document.createElement('span'); gerry.className = 'cl-gerry'; gerry.setAttribute('aria-hidden', 'true');
    let outfit = 'wizard'; try { outfit = JSON.parse(localStorage.getItem('cl.wardrobe')).wearing || outfit; } catch (e) {}
    gerry.innerHTML = ['idle', 'talk', 'blink'].map((f, n) => `<img data-f="${f}" class="${n ? '' : 'on'}" src="${window.CLMate ? CLMate.src(f, '../') : '../art/outfits/' + outfit + '/gerry-' + f + '.webp'}" alt="">`).join('');
    toggle.prepend(gerry);
    const name = $('#gpHelperName');
    const fixName = () => {
      const ko = (document.documentElement.lang || '').startsWith('ko');
      const mn = window.CLMate ? CLMate.name() : 'Gerry';
      const want = ko ? `마이 메이트 ${mn}와 함께 해요` : `${mn}, your magic guide`;
      if (name && name.textContent !== want) name.textContent = want;
    };
    if (name) { fixName(); new MutationObserver(fixName).observe(name, { childList: true, characterData: true, subtree: true }); }
    const msg = $('#gpHelperMessage'); let last = '';
    if (msg) new MutationObserver(() => {
      const t = msg.textContent.trim(); if (!t || t === last) return; last = t;
      const spoken = speak(t); talk(spoken ? 15000 : Math.min(5000, 330 * t.split(/\s+/).length));
    }).observe(msg, { childList: true, characterData: true, subtree: true });
    toggle.addEventListener('click', () => { const t = msg && msg.textContent.trim(); if (t) { const s = speak(t); talk(s ? 15000 : 2500); } });
    (function blink() { setTimeout(() => { if (!gerry.classList.contains('talking')) { frame('blink'); setTimeout(() => { if (!gerry.classList.contains('talking')) frame('idle'); }, 140); } blink(); }, 2400 + Math.random() * 2600); })();
    return true;
  }
  (function waitForHelper(tries) { if (!setupGerry() && tries > 0) setTimeout(() => waitForHelper(tries - 1), 200); })(25);

  /* the back button is named after where it goes */
  (function renameHome(tries) {
    const a = document.getElementById('libraryHomeLink');
    if (!a) { if (tries > 0) setTimeout(() => renameHome(tries - 1), 200); return; }
    if (!/book=bye-bye-sugar-bugs|project=/.test(location.search)) return;
    const span = a.querySelector('span'); if (span) span.textContent = 'Quest';
    a.setAttribute('aria-label', 'Back to my quest');
    /* a second way out: straight to My Library, to look at the book so far. It goes through the Quest link's own
       click, which saves the book before leaving. */
    const my = document.createElement('a'); my.className = 'storybook-home-link cl-mylib'; my.href = '../index.html#myLibrary';
    my.innerHTML = '<span aria-hidden="true">📚</span><span>My Library</span>'; my.setAttribute('aria-label', 'Go to My Library to see my book');
    my.addEventListener('click', e => { e.preventDefault(); a.setAttribute('href', '../index.html#myLibrary'); a.click(); });
    a.after(my);
  })(25);

  /* ---------- a sound switch next to the language buttons ---------- */
  const tools = $('.header-tools');
  if (tools) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'cl-sound';
    const paint = () => { b.textContent = muted ? '🔇' : '🔊'; b.setAttribute('aria-label', muted ? 'Turn sound on' : 'Turn sound off'); };
    b.addEventListener('click', () => { muted = !muted; store.set('cl.muted', muted ? '1' : '0'); if (muted && 'speechSynthesis' in window) speechSynthesis.cancel(); paint(); });
    paint(); tools.prepend(b);
  }
})();

/* ---------- running inside the PC-size frame (pc.html) ---------- */
(function () {
  'use strict';
  let top = null;
  try { if (window.parent !== window && /\/coloring\/pc(\.html)?$/.test(window.parent.location.pathname)) top = window.parent; } catch (e) { top = null; }
  if (!top) return;
  // links that leave the book maker (Home, View My Library) open in the whole window, not inside the frame
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]'); if (!a || e.defaultPrevented) return;
    const url = new URL(a.getAttribute('href'), location.href);
    if (url.origin !== location.origin || url.pathname.indexOf('/coloring/') !== -1 || a.target === '_blank') return;
    e.preventDefault(); top.location.href = url.href;
  });
  // keep the outer address in step when the book maker records its saved project, so a refresh continues it
  const original = history.replaceState.bind(history);
  history.replaceState = function (state, title, url) {
    const r = original(state, title, url);
    try { top.history.replaceState(null, '', 'pc.html' + location.search + location.hash); } catch (e) {}
    return r;
  };
  document.title = document.title; try { top.document.title = document.title; } catch (e) {}
})();
