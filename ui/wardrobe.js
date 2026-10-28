/* Magic Wardrobe: choose your My Mate (a GP Friend) and spend stars on outfits (benchmark: "earn, then spend on yourself").
   Saved per child in localStorage 'cl.wardrobe' = {mate, owned:[outfit ids], wearing:outfit id, spent:stars}.
   Mates and their pictures come from ui/mate.js (window.CLMate). Only Gerry has outfits so far
   (art/outfits/<id>/gerry-{idle,talk,blink}.webp, made by design/tools/make_outfit_frames.py); other friends show
   coming-soon outfit slots. The activities (kit.js) and book maker (magic-theme.js) use CLMate too.
   The library page provides window.clStars() (stars earned) and window.clDrawStars() (redraw the counters). */
(function () {
  const M = window.CLMate;
  const OUTFITS = [
    { id: 'everyday', name: 'Everyday', ko: '평소 옷', price: 0 },
    { id: 'wizard', name: 'Star Wizard', ko: '별 마법사', price: 0 },
    { id: 'knight', name: 'Moon Knight', ko: '달 기사', price: 10 },
    { id: 'dragon', name: 'Dragon Rider', ko: '드래곤 라이더', price: 15 },
    { id: 'pirate', name: 'Star Pirate', ko: '별 해적', price: 20 },
    { id: 'prince', name: 'Little Prince', ko: '꼬마 왕자', price: 25 }
  ];
  const START = { mate: 'gerry', owned: ['everyday', 'wizard'], wearing: 'wizard', spent: 0 };
  const FRAMES = ['idle', 'talk', 'blink'];
  const mateOf = id => M.MATES.find(m => m.id === id) || M.MATES[0];

  function load() {
    try { const s = JSON.parse(localStorage.getItem('cl.wardrobe')); if (s && s.owned) return Object.assign({ mate: 'gerry' }, s); } catch (e) {}
    return JSON.parse(JSON.stringify(START));
  }
  let state = load();
  function save() { try { localStorage.setItem('cl.wardrobe', JSON.stringify(state)); } catch (e) {} }
  const left = () => (window.clStars ? window.clStars() : 12) - state.spent;
  window.CLWardrobe = { spent: () => state.spent, wearing: () => state.wearing, reset() { state = JSON.parse(JSON.stringify(START)); save(); dressAll(); },
    /* one star wallet for outfits and My Library 꾸미기 (ui/room.js) */
    left, spend(n) { if (n > left()) return false; state.spent += n; save(); if (window.clDrawStars) window.clDrawStars(); return true; } };

  /* dress every My Mate on the page */
  function dressAll() {
    document.querySelectorAll('.app .guide img.gf').forEach(img => { img.src = M.src(img.dataset.f); });
    if (window.clDrawStars) window.clDrawStars();
  }
  dressAll();

  /* ---------- the dressing room ---------- */
  const app = document.getElementById('app');
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const box = document.createElement('div');
  box.className = 'wardrobe'; box.id = 'wardrobe'; box.hidden = true;
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Magic Wardrobe');
  box.innerHTML = `
    <div class="wd-panel">
      <div class="wd-head">
        <div class="wd-title"><span class="wd-kicker">MY MATE · MAGIC WARDROBE · 마법 옷장</span><h2 id="wdTitle"></h2></div>
        <span class="clchip" data-stars>⭐ 0</span>
        <button class="clb clb--icon" id="wdClose" type="button" aria-label="Close the wardrobe">✕</button>
      </div>
      <div class="wd-stage">
        <div class="wd-spot"></div><div class="wd-valance"></div><div class="wd-rug"></div>
        <div class="wd-gerry" id="wdGerry">${FRAMES.map((f, n) => `<img class="gf${n ? '' : ' on'}" data-f="${f}" alt="">`).join('')}</div>
        <div class="bubble wd-bubble" id="wdBubble"></div>
        <div class="wd-name" id="wdName"></div>
      </div>
      <div class="wd-mates" id="wdMates"></div>
      <div class="wd-grid" id="wdGrid"></div>
      <div class="wd-action" id="wdAction"></div>
    </div>`;
  app.appendChild(box);
  const $ = id => box.querySelector('#' + id);
  const g = $('wdGerry');
  let pickMate = state.mate, sel = state.wearing;   // what the child is looking at (not yet chosen)

  /* the mate on stage talks: speech + mouth flaps, following the shared mute switch */
  let flap = 0;
  const T = (m, v) => (window.CLLines ? CLLines.text(m, v, pickMate) : '');   // words of the friend on stage
  function frame(f) { g.querySelectorAll('img').forEach(i => i.classList.toggle('on', i.dataset.f === f)); }
  function say(text) {
    $('wdBubble').textContent = text;
    clearTimeout(flap); g.classList.add('talking');
    let open = false; const end = Date.now() + Math.min(5000, 360 * text.split(/\s+/).length);
    (function step() { if (Date.now() > end) { frame('idle'); g.classList.remove('talking'); return; } open = !open; frame(open ? 'talk' : 'idle'); flap = setTimeout(step, open ? 140 : 90); })();
    let muted = false; try { muted = localStorage.getItem('cl.muted') === '1'; } catch (e) {}
    if (!muted && 'speechSynthesis' in window) { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = .95; u.pitch = mateOf(pickMate).pitch; speechSynthesis.speak(u); } catch (e) {} }
  }
  setInterval(() => { if (box.hidden || g.classList.contains('talking')) return; frame('blink'); setTimeout(() => { if (!g.classList.contains('talking')) frame('idle'); }, 140); }, 3200);

  /* Swap the mate's three frames (idle, talk, blink) only once the new outfit's pictures are loaded, all together:
     swapping before they load left frames of two outfits flickering during the twirl and the talking. */
  let dressToken = 0;
  const loaded = url => { const im = new Image(); im.src = url; return (im.decode ? im.decode() : Promise.resolve()).catch(() => {}); };
  function dress(spin) {
    const frames = [...g.querySelectorAll('img')], urls = frames.map(i => M.src(i.dataset.f, '', pickMate, sel)), token = ++dressToken;
    const ready = Promise.all(urls.map(loaded));
    const put = () => ready.then(() => { if (token === dressToken) frames.forEach((i, k) => { if (i.getAttribute('src') !== urls[k]) i.src = urls[k]; }); });
    if (!spin || RM) return put();
    g.classList.remove('twirl'); void g.offsetWidth; g.classList.add('twirl');
    setTimeout(put, 120); setTimeout(() => g.classList.remove('twirl'), 520);
  }

  function chime() {
    try { if (localStorage.getItem('cl.muted') === '1') return; } catch (e) {}
    try {
      const ac = chime.ac = chime.ac || new (window.AudioContext || window.webkitAudioContext)();
      [523, 659, 784, 1047, 1319].forEach((f, i) => {
        const o = ac.createOscillator(), v = ac.createGain(), t = ac.currentTime + i * 0.08;
        o.frequency.value = f; v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(0.13, t + 0.02); v.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
        o.connect(v).connect(ac.destination); o.start(t); o.stop(t + 0.45);
      });
    } catch (e) {}
  }
  function flyStars(n) {
    if (RM) return;
    const a = app.getBoundingClientRect(), s = a.width / 1180;
    const from = box.querySelector('[data-stars]').getBoundingClientRect(), to = g.getBoundingClientRect();
    for (let i = 0; i < Math.min(n, 8); i++) {
      const st = document.createElement('span'); st.className = 'wd-fly'; st.textContent = '⭐';
      st.style.left = (from.left - a.left) / s + 'px'; st.style.top = (from.top - a.top) / s + 'px';
      app.appendChild(st);
      setTimeout(() => { st.style.left = (to.left + to.width * (0.3 + Math.random() * 0.4) - a.left) / s + 'px'; st.style.top = (to.top + to.height * 0.35 - a.top) / s + 'px'; st.style.transform = 'scale(.5) rotate(200deg)'; st.style.opacity = '0'; }, 30 + i * 70);
      setTimeout(() => st.remove(), 1400);
    }
  }

  function draw() {
    const pm = mateOf(pickMate), gerry = pm.id === 'gerry', isMine = pm.id === state.mate;
    $('wdTitle').textContent = `Dress up ${mateOf(state.mate).name}!`;
    $('wdMates').innerHTML = `<span class="lab">My Mate</span>` + M.MATES.map(m => `<button type="button" class="wd-mate ${m.ready ? '' : 'soon'} ${m.id === pickMate ? 'sel' : ''} ${m.id === state.mate ? 'mine' : ''}" data-mate="${m.id}" aria-label="${m.name}${m.ready ? '' : ' (coming soon)'}"><img src="assets/avatars/face-${m.id}.webp" alt=""><span>${m.name}</span></button>`).join('');
    if (gerry) {
      $('wdGrid').innerHTML = OUTFITS.map(o => {
        const owned = state.owned.includes(o.id), wearing = isMine && state.wearing === o.id;
        const cls = ['wd-card', owned ? 'owned' : '', wearing ? 'wearing' : '', sel === o.id ? 'sel' : ''].join(' ');
        const tag = wearing ? 'Wearing' : owned ? 'Mine ✓' : '⭐ ' + o.price;
        return `<button class="${cls}" type="button" data-id="${o.id}"><span class="wd-tag">${tag}</span><span class="pic"><img src="${M.src('idle', '', 'gerry', o.id)}" alt=""></span><b>${o.name}</b><small>${o.ko}</small></button>`;
      }).join('');
    } else {
      $('wdGrid').innerHTML = `<button class="wd-card ${isMine ? 'wearing' : ''} sel" type="button" data-id="everyday"><span class="wd-tag">${isMine ? 'Wearing' : 'Mine ✓'}</span><span class="pic"><img src="${M.src('idle', '', pm.id)}" alt=""></span><b>Everyday</b><small>평소 옷</small></button>`
        + Array.from({ length: 5 }, () => `<button class="wd-card soon" type="button" data-id="soon" aria-disabled="true"><span class="wd-tag">🔒</span><span class="pic"><img src="${M.src('idle', '', pm.id)}" alt=""></span><b>Coming soon</b><small>곧 만나요</small></button>`).join('');
    }
    $('wdName').textContent = gerry ? `${pm.name} · ${OUTFITS.find(x => x.id === sel).name}` : pm.name;
    const act = $('wdAction');
    if (!isMine) act.innerHTML = `<button class="clb clb--done clb--lg clb--pulse" type="button" data-do="mate"><span class="i">🤝</span>Choose ${pm.name} as my mate</button>`;
    else if (!gerry) act.innerHTML = `<button class="clb clb--done clb--lg" type="button" disabled><span class="i">✓</span>${pm.name} is my mate</button>`;
    else {
      const o = OUTFITS.find(x => x.id === sel), owned = state.owned.includes(sel);
      if (state.wearing === sel) act.innerHTML = `<button class="clb clb--done clb--lg" type="button" disabled><span class="i">✓</span>${pm.name} is wearing it</button>`;
      else if (owned) act.innerHTML = `<button class="clb clb--done clb--lg clb--pulse" type="button" data-do="wear"><span class="i">👕</span>Wear it!</button>`;
      else if (left() >= o.price) act.innerHTML = `<button class="clb clb--go clb--lg clb--pulse" type="button" data-do="buy">Get it for <span class="i">⭐</span>${o.price}</button>`;
      else act.innerHTML = `<button class="clb clb--go clb--lg" type="button" disabled>⭐ ${o.price}</button><span class="wd-hint">Read more books to earn ${o.price - left()} more ⭐</span>`;
    }
    if (window.clDrawStars) window.clDrawStars();
  }

  $('wdMates').addEventListener('click', e => {
    const b = e.target.closest('[data-mate]'); if (!b) return;
    const m = mateOf(b.dataset.mate);
    if (!m.ready) { say(T('mate.soon', { mate: m.name })); return; }
    if (pickMate === m.id) return;
    pickMate = m.id; sel = m.id === 'gerry' ? state.wearing : 'everyday';
    dress(true); draw();
    say(m.id === state.mate ? T('mate.mine') : T('mate.hello'));
  });
  $('wdGrid').addEventListener('click', e => {
    const c = e.target.closest('.wd-card'); if (!c) return;
    if (c.dataset.id === 'soon') { say(T('outfits.soon')); return; }
    if (pickMate !== 'gerry') return;
    const o = OUTFITS.find(x => x.id === c.dataset.id);
    if (sel === o.id) return;
    sel = o.id; dress(true); draw();
    const owned = state.owned.includes(sel);
    say(state.wearing === sel ? T('outfit.wearing') : owned ? T('outfit.owned', { outfit: o.name }) : left() >= o.price ? T('outfit.price', { outfit: o.name, price: o.price }) : T('outfit.need', { need: o.price - left() }));
  });
  $('wdAction').addEventListener('click', e => {
    const b = e.target.closest('[data-do]'); if (!b) return;
    if (b.dataset.do === 'mate') {
      state.mate = pickMate; save(); dressAll(); draw(); chime(); dress(true);
      say(T('mate.chosen'));
      return;
    }
    const o = OUTFITS.find(x => x.id === sel);
    if (b.dataset.do === 'buy') {
      if (left() < o.price) return;
      state.spent += o.price; state.owned.push(o.id); flyStars(o.price); chime();
      say(T('outfit.bought', { outfit: o.name }));
    } else say(T('outfit.wear'));
    state.wearing = o.id; save(); dressAll(); draw();
    if (b.dataset.do === 'wear') { dress(true); chime(); }
  });
  g.addEventListener('click', () => { dress(true); say(T('wardrobe.twirl')); });

  let warmed = false;
  function open() {
    if (!warmed) { warmed = true; OUTFITS.forEach(o => ['idle', 'talk', 'blink'].forEach(f => loaded(M.src(f, '', 'gerry', o.id)))); }   // ready before the first try-on
    pickMate = state.mate; sel = state.mate === 'gerry' ? state.wearing : 'everyday'; dress(); draw();
    box.hidden = false; requestAnimationFrame(() => box.classList.add('on'));
    say(T('wardrobe.welcome'));
  }
  function close() {
    box.classList.remove('on'); setTimeout(() => { box.hidden = true; }, 250);
    try { speechSynthesis.cancel(); } catch (e) {}
  }
  $('wdClose').addEventListener('click', close);
  box.addEventListener('click', e => { if (e.target === box) close(); });
  document.querySelectorAll('[data-wardrobe]').forEach(b => b.addEventListener('click', open));
  window.CLWardrobe.open = open;
})();
