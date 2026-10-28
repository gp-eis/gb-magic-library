/* Shared helpers for the Sugar Bugs step activities.
   window.SB: stage fit, Gerry (talk/blink), say() with word highlighting, object voice clips,
   sounds, stars, finishing and returning to the library quest. */
(function () {
  'use strict';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = s => document.querySelector(s);
  const stage = $('#stage');
  const STEPS = ['read', 'question', 'think', 'express', 'create'];
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  let muted = store.get('cl.muted') === '1';
  /* which book: a month book (window.SB_BOOK = {id, key}) or Sugar Bugs */
  const BK = window.SB_BOOK || null;
  const PFX = BK ? 'cl.bk.' + BK.id + '.' : 'cl.sb5.', RET = BK ? BK.key : 'B3';

  /* ---------- fit the 1180x820 stage to the window ---------- */
  /* ui/stage.js scales and centres it, and lets the page background fill the rest of the window */
  document.body.classList.add('sb-stage');
  function fit() {
    if (window.CLStage) return void CLStage.fit(stage);
    const s = Math.min(innerWidth / 1180, innerHeight / 820);
    stage.style.transform = `scale(${s})`;
    stage.style.left = (innerWidth - 1180 * s) / 2 + 'px';
    stage.style.top = (innerHeight - 820 * s) / 2 + 'px';
  }
  if (!window.CLStage) addEventListener('resize', fit);
  fit();
  /* phones: fit the activity itself (everything but the bar, My Mate, the bubble and pop-ups) to the screen height.
     The area only grows as new parts appear, so the picture does not jump between questions. */
  if (window.CLStage) {
    const SKIP = '.bar,.gerry,.say,.overlay,.spark,.flystar';
    let box = null, down = false, queued = 0;
    const measure = () => {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      const pos = el => { let x = 0, y = 0; for (let e = el; e && e !== stage; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; } return [x, y]; };
      (function walk(parent) {
        for (const el of parent.children) {
          if (el.matches(SKIP)) continue;
          const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
          const w = el.offsetWidth, h = el.offsetHeight; if (!w || !h) continue;
          if (w >= 1100 && h >= 760) { walk(el); continue; }   // a whole-stage holder (a round): look inside it
          const [x, y] = pos(el); x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + w); y1 = Math.max(y1, y + h);
        }
      })(stage);
      if (x0 === Infinity) return box || { x: 150, y: 100, w: 880, h: 560 };
      if (box) { x0 = Math.min(x0, box.x); y0 = Math.min(y0, box.y); x1 = Math.max(x1, box.x + box.w); y1 = Math.max(y1, box.y + box.h); }
      return (box = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
    };
    CLStage.usePhone({ content: () => box || measure(), left: 156, right: 300, pad: 18 });
    const check = () => { queued = 0; if (down || !CLStage.phone) return;
      const was = box && JSON.stringify(box); measure(); if (JSON.stringify(box) !== was) CLStage.refresh(); };
    new MutationObserver(() => { if (!queued) queued = setTimeout(check, 250); })
      .observe(stage, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
    addEventListener('pointerdown', () => { down = true; }, true);
    addEventListener('pointerup', () => { down = false; if (!queued) queued = setTimeout(check, 250); }, true);
    addEventListener('load', () => { measure(); CLStage.refresh(); });
  }

  /* ---------- top bar ---------- */
  function bar(stepKey, title) {
    const i = STEPS.indexOf(stepKey);
    const el = document.createElement('div'); el.className = 'bar';
    el.innerHTML = `<button class="clb" id="sbBack" aria-label="Back to my quest"><span class="i">←</span>Quest</button>
      <span class="stepchip">${stepKey.toUpperCase()}</span><span class="title">${title}</span>
      <span class="dots" aria-label="Step ${i + 1} of 5">${STEPS.map((s, n) => `<i class="${store.get(PFX + s) === '1' || (!BK && s === 'create' && store.get('cl.sb5.createDone') === '1') ? 'on' : n === i ? 'now' : ''}"></i>`).join('')}</span>
      <span class="clchip" id="sbStars">⭐ ${stars()}</span>
      <button class="clb clb--icon" id="sbSound" type="button"></button>`;
    stage.appendChild(el);
    $('#sbBack').addEventListener('click', () => goBack());
    const sb = $('#sbSound');
    const paint = () => { sb.textContent = muted ? '🔇' : '🔊'; sb.setAttribute('aria-label', muted ? 'Turn voice on' : 'Turn voice off'); };
    sb.addEventListener('click', () => { muted = !muted; store.set('cl.muted', muted ? '1' : '0'); if (muted) stopVoice(); paint(); });
    paint();
  }
  function wardrobe() { try { return JSON.parse(store.get('cl.wardrobe')) || {}; } catch (e) { return {}; } }
  function stars() { return +(store.get('cl.sb5.stars') || 0) + 12 - (+wardrobe().spent || 0); }

  /* ---------- Gerry ---------- */
  let gerryEl = null; const timers = {};
  function gerry() {
    gerryEl = document.createElement('div'); gerryEl.className = 'gerry'; gerryEl.setAttribute('aria-hidden', 'true');
    gerryEl.innerHTML = ['idle', 'talk', 'blink'].map((f, n) => `<img data-f="${f}" class="${n ? '' : 'on'}" src="${window.CLMate ? CLMate.src(f, '../../') : '../../art/outfits/wizard/gerry-' + f + '.webp'}" alt="">`).join('');
    stage.appendChild(gerryEl);
    const bubble = document.createElement('div'); bubble.className = 'say hide'; bubble.id = 'sbSay'; bubble.setAttribute('aria-live', 'polite');
    stage.appendChild(bubble);
    (function loop() { setTimeout(() => { if (!gerryEl.classList.contains('talking')) { frame('blink'); setTimeout(() => { if (!gerryEl.classList.contains('talking')) frame('idle'); }, 140); } loop(); }, 2400 + Math.random() * 2600); })();
  }
  function frame(f) { gerryEl.querySelectorAll('img').forEach(i => i.classList.toggle('on', i.dataset.f === f)); }
  function flap(on) {
    clearTimeout(timers.flap);
    if (!on) { gerryEl.classList.remove('talking'); frame('idle'); return; }
    if (!RM) gerryEl.classList.add('talking');
    let open = false;
    (function step() { open = !open; frame(open ? 'talk' : 'idle'); timers.flap = setTimeout(step, open ? 120 + Math.random() * 80 : 70 + Math.random() * 70); })();
  }

  /* ---------- voice ---------- */
  let current = null;
  function stopVoice() {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    if (current && current.audio) { current.audio.pause(); }
    if (current && current.resolve) current.resolve();
    current = null; if (gerryEl) flap(false);
  }
  function words(el, text) {
    el.innerHTML = text.split(' ').map((w, i) => `<span class="w" data-i="${i}">${w}</span>`).join(' ');
  }
  function light(el, upto) { el.querySelectorAll('.w').forEach(s => s.classList.toggle('lit', +s.dataset.i <= upto)); }
  function timedLight(el, text, ms, token) {
    const n = text.split(' ').length; let i = 0;
    (function next() { if (current !== token || i >= n) return; light(el, i); i++; setTimeout(next, ms / n); })();
  }
  /** Gerry says a line: bubble with lighting words, moving mouth, browser voice (stand-in). */
  function say(text, opts = {}) {
    stopVoice();
    const bubble = opts.el || $('#sbSay'); const own = !opts.el || !!opts.gerry; words(bubble, text); bubble.classList.remove('hide');
    if (opts.replay !== false) { const r = document.createElement('button'); r.className = 'replay'; r.textContent = '🔊'; r.setAttribute('aria-label', 'Hear it again'); r.addEventListener('click', e => { e.stopPropagation(); say(text, opts); }); bubble.appendChild(r); }
    return new Promise(resolve => {
      const token = { resolve }; current = token; if (own) flap(true); else if (opts.bounce && !RM) opts.bounce.style.animation = 'talkBounce .45s ease-in-out infinite';
      const est = Math.max(1600, text.split(' ').length * 380);
      const finish = () => { if (current !== token) return; light(bubble, 999); if (own) flap(false); if (opts.bounce) opts.bounce.style.animation = ''; current = null; resolve(); };
      if (!muted && 'speechSynthesis' in window) {
        try {
          const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = opts.rate || .92; u.pitch = opts.pitch || (window.CLMate ? CLMate.pitch() : 1.2);
          let gotBoundary = false;
          u.onboundary = e => { if (current !== token) return; gotBoundary = true; light(bubble, text.slice(0, e.charIndex).split(' ').length - 1); };
          u.onend = finish; u.onerror = () => setTimeout(finish, est);
          let started = false; u.onstart = () => { started = true; };
          speechSynthesis.speak(u);
          // some phones never start the browser voice: then the words light up on their own and the step carries on
          setTimeout(() => { if (current === token && !started && !speechSynthesis.speaking) setTimeout(finish, est - 1500); }, 1500);
          setTimeout(() => { if (current === token && !gotBoundary) timedLight(bubble, text, est, token); }, 700);
          setTimeout(finish, est + 6000); // safety net if the voice never reports its end
          return;
        } catch (e) { /* fall through to silent timing */ }
      }
      timedLight(bubble, text, est, token); setTimeout(finish, est);
    });
  }
  /** A Sugar Bugs object speaks with its recorded clip; its picture bounces while the words light up. */
  function clip(url, text, bubbleEl, bounceEl) {
    stopVoice();
    words(bubbleEl, text); bubbleEl.classList.remove('hide');
    return new Promise(resolve => {
      const audio = new Audio(url); const token = { resolve, audio }; current = token;
      const done = () => { if (current !== token) return; light(bubbleEl, 999); if (bounceEl) bounceEl.style.animation = ''; current = null; resolve(); };
      if (bounceEl && !RM) bounceEl.style.animation = 'talkBounce .45s ease-in-out infinite';
      audio.addEventListener('loadedmetadata', () => timedLight(bubbleEl, text, (audio.duration || 4) * 1000 * .95, token));
      audio.addEventListener('ended', done); audio.addEventListener('error', () => { timedLight(bubbleEl, text, 4000, token); setTimeout(done, 4200); });
      if (muted) { timedLight(bubbleEl, text, text.split(' ').length * 330, token); setTimeout(done, text.split(' ').length * 330 + 300); return; }
      audio.play().catch(() => { timedLight(bubbleEl, text, 4000, token); setTimeout(done, 4200); });
    });
  }

  /* ---------- sounds (tiny generated tones, no files) ---------- */
  let ctx = null;
  function tone(freqs, dur = .12, type = 'sine', gain = .12) {
    if (muted) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      freqs.forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = f;
        const t = ctx.currentTime + i * dur * .8; g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
        o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur + .02);
      });
    } catch (e) {}
  }
  const sfx = {
    good: () => tone([660, 880, 1320], .12, 'triangle'),
    bad: () => tone([300, 220], .14, 'sine', .1),
    pop: () => tone([520, 780], .07, 'triangle', .08),
    win: () => tone([523, 659, 784, 1046, 1318], .13, 'triangle')
  };

  /* ---------- sparkles and stars ---------- */
  function rectOf(el) { const s = stage.getBoundingClientRect(), r = el.getBoundingClientRect(), k = s.width / 1180; return { x: (r.left - s.left) / k, y: (r.top - s.top) / k, w: r.width / k, h: r.height / k }; }
  function sparkle(el, n = 16) {
    if (RM || !el) return; const r = rectOf(el), cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    for (let i = 0; i < n; i++) { const s = document.createElement('span'); s.className = 'spark'; const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 110;
      s.style.left = cx + 'px'; s.style.top = cy + 'px'; s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d + 'px'); stage.appendChild(s); setTimeout(() => s.remove(), 950); }
  }
  function star(fromEl) {
    store.set('cl.sb5.stars', String(+(store.get('cl.sb5.stars') || 0) + 1));
    const target = $('#sbStars'); const t = rectOf(target);
    const s = document.createElement('div'); s.className = 'flystar'; s.textContent = '⭐';
    const f = fromEl ? rectOf(fromEl) : { x: 590, y: 410, w: 0, h: 0 };
    s.style.left = f.x + f.w / 2 - 22 + 'px'; s.style.top = f.y + f.h / 2 - 22 + 'px'; stage.appendChild(s);
    requestAnimationFrame(() => requestAnimationFrame(() => { s.style.left = t.x + 10 + 'px'; s.style.top = t.y - 4 + 'px'; s.style.transform = 'scale(.6)'; }));
    setTimeout(() => { s.remove(); target.textContent = '⭐ ' + stars(); target.classList.add('bump'); setTimeout(() => target.classList.remove('bump'), 220); }, RM ? 10 : 820);
  }

  /* ---------- start, finish, return ---------- */
  function startScreen({ kicker, title, text, img }) {
    return new Promise(resolve => {
      const o = document.createElement('div'); o.className = 'overlay';
      o.innerHTML = `<div class="sheet"><span class="kicker">${kicker}</span>${img ? `<img src="${img}" alt="">` : ''}<h1>${title}</h1><p>${text}</p><button class="clb clb--go clb--lg clb--pulse" id="sbStart"><span class="i">▶</span>Let's start</button></div>`;
      stage.appendChild(o);
      $('#sbStart').addEventListener('click', () => { o.remove(); resolve(); });
    });
  }
  function goBack() {
    stopVoice();
    try { sessionStorage.setItem('cl.return', 'quest:' + RET); } catch (e) {}
    location.href = '../../index.html';
  }
  function finish(stepKey, { title, text, img }) {
    store.set(PFX + stepKey, '1'); sfx.win();
    const o = document.createElement('div'); o.className = 'overlay';
    o.innerHTML = `<div class="sheet"><span class="kicker">${stepKey.toUpperCase()} · DONE</span>${img ? `<img src="${img}" alt="">` : ''}<h1>${title}</h1><p>${text}</p><button class="clb clb--done clb--lg" id="sbHome">Back to my quest <span class="i">⭐</span></button></div>`;
    stage.appendChild(o); sparkle(o.querySelector('.sheet'), 30);
    $('#sbHome').addEventListener('click', goBack);
  }

  /* ---------- tap-or-drag helper for 3-to-5-year-olds ---------- */
  /** Makes item elements draggable onto targets, with tap-item-then-tap-target as an alternative. */
  function dragTap(items, targets, onDrop) {
    let picked = null;
    const pick = el => { if (picked) picked.classList.remove('picked'); picked = el; if (el) el.classList.add('picked'); };
    targets.forEach(t => t.addEventListener('click', () => { if (picked) { const p = picked; pick(null); onDrop(p, t); } }));
    items.forEach(el => {
      let start = null, moved = false, ox = 0, oy = 0;
      el.addEventListener('pointerdown', e => {
        if (el.dataset.placed) return;
        start = { x: e.clientX, y: e.clientY }; moved = false; el.setPointerCapture(e.pointerId);
      });
      el.addEventListener('pointermove', e => {
        if (!start) return; const k = stage.getBoundingClientRect().width / 1180;
        ox = (e.clientX - start.x) / k; oy = (e.clientY - start.y) / k;
        if (!moved && Math.hypot(ox, oy) > 8) { moved = true; el.classList.add('dragging'); pick(null); }
        if (moved) el.style.translate = `${ox}px ${oy}px`;
      });
      const end = e => {
        if (!start) return; start = null;
        if (!moved) { pick(picked === el ? null : el); sfx.pop(); return; }
        el.classList.remove('dragging'); el.style.translate = '';
        const hit = targets.find(t => { const r = t.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; });
        if (hit) onDrop(el, hit);
      };
      el.addEventListener('pointerup', end); el.addEventListener('pointercancel', () => { start = null; el.classList.remove('dragging'); el.style.translate = ''; });
    });
    return { clear: () => pick(null) };
  }

  const style = document.createElement('style');
  style.textContent = '@keyframes talkBounce{50%{transform:translateY(-10px) rotate(-2deg)}}';
  document.head.appendChild(style);

  /* My Mate's words for a moment (ui/mate-lines.js), or the given fallback */
  function line(m, v, fallback) { return (window.CLLines && CLLines.text(m, v)) || fallback || ''; }
  window.SB = { line, bar, gerry, say, clip, stopVoice, sfx, sparkle, star, startScreen, finish, goBack, dragTap, rectOf, store, RM };
})();
