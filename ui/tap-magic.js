/* Tap-to-respond scenery for the magic library (benchmark idea: "everything responds to touch").
   Floating books spin, candles flare, the owl loops and hoots, and Gerry hops and says something.
   Sounds are made in the browser (no files) and follow the same mute switch as Gerry's voice (cl.muted). */
(function () {
  const app = document.querySelector('.app');
  if (!app) return;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const css = document.createElement('style');
  css.textContent = `
.floaters .fl{pointer-events:auto;cursor:pointer;-webkit-tap-highlight-color:transparent}
.floaters .fl::after{content:"";position:absolute;inset:-12px}
.owl{pointer-events:auto;cursor:pointer;-webkit-tap-highlight-color:transparent}
.guide{pointer-events:auto;cursor:pointer;-webkit-tap-highlight-color:transparent}
#hall #cases{pointer-events:none}
#hall #cases>*{pointer-events:auto}
.fl.fbook.tap img{animation:tapSpin .9s cubic-bezier(.3,1.4,.5,1)}
.fl.fcandle.tap img{animation:tapWobble .7s ease-in-out}
.fl.fcandle.tap .glow{animation:tapFlare .9s ease-out}
.owl.tap .bob{animation:tapLoop 1s ease-in-out}
.guide.tap{animation:tapHop .55s cubic-bezier(.3,1.6,.5,1)}
@keyframes tapSpin{0%{transform:translateY(0) rotate(0) scale(1)}45%{transform:translateY(-28%) rotate(200deg) scale(1.25)}100%{transform:translateY(0) rotate(360deg) scale(1)}}
@keyframes tapWobble{0%,100%{transform:rotate(0)}25%{transform:rotate(-9deg)}50%{transform:rotate(7deg)}75%{transform:rotate(-4deg)}}
@keyframes tapFlare{0%{opacity:1;scale:1}30%{opacity:1;scale:1.9}100%{opacity:.85;scale:1}}
@keyframes tapLoop{0%{transform:translateY(0) rotate(0)}50%{transform:translateY(-60px) rotate(-180deg)}100%{transform:translateY(0) rotate(-360deg)}}
@keyframes tapHop{0%,100%{translate:0 0}40%{translate:0 -14%}}
@media (prefers-reduced-motion: reduce){.fl.tap img,.fl.tap .glow,.owl.tap .bob,.guide.tap{animation:none}}`;
  document.head.appendChild(css);

  /* little sounds, synthesized */
  let ac = null;
  function muted() { try { return localStorage.getItem('cl.muted') === '1'; } catch (e) { return false; } }
  function tone(freq, start, dur, type, vol, slideTo) {
    const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + start;
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  const SOUNDS = {
    book() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.07, 0.35, 'sine', 0.12)); },
    candle() { tone(220, 0, 0.35, 'triangle', 0.08, 660); tone(1320, 0.12, 0.3, 'sine', 0.05); },
    owl() { tone(420, 0, 0.28, 'sine', 0.18, 360); tone(400, 0.38, 0.42, 'sine', 0.18, 330); },
    gerry() { tone(330, 0, 0.16, 'square', 0.04, 660); tone(660, 0.14, 0.2, 'sine', 0.08); }
  };
  function play(name) {
    if (muted()) return;
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); SOUNDS[name](); } catch (e) {}
  }

  /* gold sparkles, using the page's .spark style */
  function sparkle(el, n, up) {
    if (RM) return;
    const a = app.getBoundingClientRect(), r = el.getBoundingClientRect(), s = a.width / 1180;
    const x = (r.left + r.width / 2 - a.left) / s, y = (r.top + r.height * (up ? 0.25 : 0.5) - a.top) / s;
    for (let i = 0; i < n; i++) {
      const sp = document.createElement('span'); sp.className = 'spark';
      const ang = up ? -Math.PI / 2 + (Math.random() - 0.5) * 1.6 : Math.random() * Math.PI * 2, d = 40 + Math.random() * 70;
      sp.style.left = x + 'px'; sp.style.top = y + 'px';
      sp.style.setProperty('--dx', Math.cos(ang) * d + 'px'); sp.style.setProperty('--dy', Math.sin(ang) * d + 'px');
      app.appendChild(sp); setTimeout(() => sp.remove(), 950);
    }
  }
  function replay(el, ms) { el.classList.remove('tap'); void el.offsetWidth; el.classList.add('tap'); clearTimeout(el._tap); el._tap = setTimeout(() => el.classList.remove('tap'), ms); }

  /* what My Mate says when tapped, per scene, in their own words (ui/mate-lines.js); the bubble speaks it */
  const MOMENT = { outBubble: 'tapOutside', hallBubble: 'tapHall', nookBubble: 'tapNook' };
  function gerrySays(guide) {
    const bubble = guide.parentElement && guide.parentElement.querySelector('.bubble');
    const m = bubble && MOMENT[bubble.id];
    if (!m || !window.CLLines) return;
    bubble.textContent = CLLines.text(m);
  }

  app.addEventListener('click', e => {
    const fl = e.target.closest('.floaters .fl');
    if (fl) {
      const book = fl.classList.contains('fbook');
      replay(fl, 950); play(book ? 'book' : 'candle'); sparkle(fl, book ? 12 : 7, !book);
      return;
    }
    const owl = e.target.closest('.owl');
    if (owl) { replay(owl, 1000); play('owl'); sparkle(owl, 10); return; }
    const guide = e.target.closest('.guide');
    if (guide) { replay(guide, 600); play('gerry'); gerrySays(guide); }
  });
})();
