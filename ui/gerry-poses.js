/* Gerry's whole-body poses (user 2026-11-24: "fix Gerry a bit like how we did with the GPFIS site").
   Like the GPFIS site, Gerry changes his whole picture for a moment instead of a cut-apart puppet: wave, cheer, point,
   think, thumbs up. The pose is picked from the words he is saying, so every page gets it without its own wiring:
     think  "Hmm", "Oops", "Try again", "Not quite"          cheer  "Woo-hoo", "Yay", "We did it", "complete", "Hooray"
     wave   "Hi", "Hello", "Welcome", "See you", "Bye"        thumb  "Great", "Awesome", "Good job", "You got it", "Well done"
     point  "Tap", "Pick", "Look", "Drag", "Choose", "Find"
   The pose shows for about 1.8 s, then his normal talking frames come back. Only outfits with a poses/ folder take part
   (art/outfits/wizard/poses, made by design/tools/fit_poses.py from a ChatGPT pose sheet; same canvas as his frames, wider
   for the arms). Other outfits and other GP Friends simply keep their three frames.
   Used by index.html (the bubbles' observer) and the activity kit (kit.js say()). */
(function () {
  if (window.CLPose) return;
  const me = document.currentScript, base = ((me && me.src) || '').replace(/ui\/gerry-poses\.js.*$/, '');
  const POSED = ['wizard'], NAMES = ['wave', 'cheer', 'point', 'think', 'thumb'];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = document.createElement('style');
  /* img.gpose.gpose: beats the pages' own ".guide img" / ".gerry img" rules (full-box width, inset 0, hidden) */
  css.textContent = `img.gpose.gpose{position:absolute;top:0;bottom:auto;right:auto;height:100%;width:auto;max-width:none;left:50%;transform:translateX(-50%);
    opacity:0;pointer-events:none;mix-blend-mode:normal;filter:drop-shadow(0 8px 10px rgba(40,20,10,.33))}
  .posing>img:not(.gpose){opacity:0!important} .posing>img.gpose.gpose{opacity:1} .posing.talking{animation:none!important}
  .posing>img.gpose.gpose.pop{animation:gposePop .32s cubic-bezier(.3,1.6,.5,1)}
  @keyframes gposePop{0%{transform:translateX(-50%) scale(.94)}100%{transform:translateX(-50%) scale(1)}}
  @media (prefers-reduced-motion: reduce){.posing>.gpose.pop{animation:none}}`;
  document.head.appendChild(css);

  function dir() {                          // the current outfit's poses folder, or null
    if (window.CLMate && CLMate.current().id !== 'gerry') return null;
    const idle = window.CLMate ? CLMate.src('idle', base) : base + 'art/outfits/wizard/gerry-idle.webp';
    const m = idle.match(/outfits\/([^/]+)\/gerry-idle\.webp$/); if (!m || !POSED.includes(m[1])) return null;
    return idle.replace(/gerry-idle\.webp$/, 'poses/');
  }
  let warmed = '';
  function warm() { const d = dir(); if (!d || d === warmed) return; warmed = d; NAMES.forEach(n => { const i = new Image(); i.src = d + n + '.webp'; }); }

  function pick(text) {
    const t = ' ' + String(text || '').toLowerCase().replace(/[’‘]/g, "'") + ' ';
    if (/\b(hmm+|oops|try again|not quite|let's look again)\b/.test(t)) return 'think';
    if (/\b(woo-?hoo|yay|hooray|we did it|you did it|complete|all six|you sorted all)\b/.test(t)) return 'cheer';
    if (/\b(hi|hello|welcome|see you|bye|goodbye)\b/.test(t) && !/bye-bye, sugar bugs/.test(t)) return 'wave';
    if (/\b(great|awesome|good job|you got it|well done|nice job|that sounds great)\b/.test(t)) return 'thumb';
    if (/\b(tap|pick|look|drag|choose|find|press)\b/.test(t)) return 'point';
    return null;
  }
  const timers = new WeakMap();
  function show(box, pose, ms) {
    const d = dir(); if (!box || !d || !NAMES.includes(pose)) return false;
    let img = box.querySelector(':scope>.gpose');
    if (!img) { img = document.createElement('img'); img.className = 'gpose'; img.alt = ''; box.appendChild(img); }
    const src = d + pose + '.webp';
    const go = () => { box.classList.add('posing'); if (!RM) { img.classList.remove('pop'); void img.offsetWidth; img.classList.add('pop'); } };
    if (img.getAttribute('src') !== src) { img.onload = go; img.src = src; } else go();
    clearTimeout(timers.get(box)); timers.set(box, setTimeout(() => box.classList.remove('posing'), ms || 1800));
    return true;
  }
  function react(box, text, ms) { warm(); const p = pick(text); return p ? show(box, p, ms) : false; }
  warm();
  window.CLPose = { show, pick, react, NAMES };
})();
