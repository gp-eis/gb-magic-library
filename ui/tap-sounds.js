/* Tap sounds for every button (user 2026-11-24: "bouncy, maybe also magical sound effects for clicking, like Fresh Math").
   Made in code like Fresh Math's (forest-math/world/world.js snd.boing/pop/whoosh): no sound files.
   - any button, card or link: a bouncy "boing" that slides up, with a tiny magic sparkle of two high bell notes on top
     (the notes are picked at random from a happy scale, so taps never sound exactly the same)
   - Back / Close / ✕ / Done: the boing slides down instead (a soft "pop away")
   - moving to another room of the library (a .scene turning on): a magic shimmer, bells running up with a soft swish
   Things that already make their own sound are left alone: the floating books, candles, owl and My Mate (ui/tap-magic.js),
   and anything marked data-nosfx. Follows the same sound switch as My Mate's voice (localStorage cl.muted = '1').
   Load on any page: <script src="ui/tap-sounds.js"></script> (path from the page). */
(function () {
  if (window.CLTapSounds) return;
  let ac = null;
  const muted = () => { try { return localStorage.getItem('cl.muted') === '1'; } catch (e) { return false; } };
  const ctx = () => { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); return ac; };
  function tone(f0, f1, dur, vol, type, when) {
    const a = ctx(), o = a.createOscillator(), g = a.createGain(), t = a.currentTime + (when || 0);
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.03);
  }
  function swish(dur, vol) {                     // soft airy whoosh: noise through a filter that sweeps up
    const a = ctx(), n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / n);
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime;
    f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(600, t); f.frequency.exponentialRampToValueAtTime(5000, t + dur);
    g.gain.value = vol; s.buffer = b; s.connect(f).connect(g).connect(a.destination); s.start(t);
  }
  const BELLS = [1568, 1760, 2093, 2349, 2637, 3136];            // G6 A6 C7 D7 E7 G7: a happy pentatonic scale
  const pick = () => BELLS[Math.floor(Math.random() * BELLS.length)];
  const S = {
    tap() {                                                          // boing up, then two little bells (a fifth apart)
      const lift = 1 + Math.random() * 0.12, a = pick(), b = a * 1.5 > 3200 ? a * 0.75 : a * 1.5;
      tone(230 * lift, 640 * lift, 0.16, 0.11, 'triangle'); tone(a, a, 0.22, 0.028, 'sine', 0.05); tone(b, b, 0.26, 0.022, 'sine', 0.1); },
    away() { tone(620, 230, 0.15, 0.1, 'triangle'); tone(1319, 1319, 0.18, 0.022, 'sine', 0.04); },
    magic() { [1047, 1319, 1568, 2093, 2637].forEach((f, i) => tone(f, f, 0.32, 0.026, 'sine', i * 0.045)); swish(0.45, 0.05); }
  };
  function play(name) { if (muted()) return; try { S[name](); } catch (e) {} }

  /* what counts as something pressed */
  const PRESS = 'button, summary, a[href], [role="button"], .clb, .book, .rt-card, .rt-tab, .card, .dot, [data-step], .choice, .opt, label[for], .story-line, .activity-tab, .storybook-home-link';
  const OWN = '.fl, .owl, .guide, [data-nosfx], .rd';            // already make their own sound / are dragged
  const AWAY = /(^|\s)(←|✕|×)|\b(back|close|done|hall)\b/i;
  let last = 0;
  addEventListener('pointerdown', e => {
    const el = e.target.closest && e.target.closest(PRESS); if (!el || el.closest(OWN)) return;
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') return;
    const now = performance.now(); if (now - last < 60) return; last = now;
    const words = (el.getAttribute('aria-label') || '') + ' ' + (el.textContent || '').trim().slice(0, 24);
    play(AWAY.test(words) ? 'away' : 'tap');
  }, true);
  /* a new room of the library: any .scene that turns on (index.html's show()) */
  const seen = new WeakSet();
  new MutationObserver(list => {
    for (const m of list) { const s = m.target; if (!s.classList || !s.classList.contains('scene')) continue;
      const on = s.classList.contains('on'); if (on && !seen.has(s)) { seen.add(s); play('magic'); } if (!on) seen.delete(s); }
  }).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['class'] });
  window.CLTapSounds = { play };
})();
