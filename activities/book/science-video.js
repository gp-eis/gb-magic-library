/* The science explainer video inside THINK. It plays just BEFORE the science round (the workbook's last page):
   SBVideo.play({ src, title, text, img }) shows a "Science time!" card with a big play button (a tap is needed so phones
   allow the sound), then the video on the stage with Skip; the promise resolves when the video ends or is skipped.
   Controls (user asked, 2026-11-12): a bar under the picture with play/pause, a time bar to drag to any moment, the time,
   and a full-screen button (the whole box goes full screen so the bar stays; iPhones use the video's own full screen).
   Tapping the picture also pauses and plays.
   SBVideo.again(opts) puts a "Video" button in the top bar beside Quest, so the child can watch it again during the science
   round (it opens the player straight away, and the round waits underneath).
   Videos are made in video/<name>/ (see CLAUDE.md, Science explainer videos) and copied next to the page as science.mp4.
   Loaded after kit.js: uses its overlay look, buttons and SB.stopVoice. Follows the sound switch (cl.muted). */
(function () {
  const css = document.createElement('style');
  css.textContent = `
  .sv{position:absolute;inset:0;z-index:45;display:grid;place-items:center;background:rgba(43,31,79,.72)}
  .sv .sv-box{position:relative;width:1060px;height:656px;margin-top:40px;border-radius:26px;overflow:hidden;background:#1b1b1b;box-shadow:0 0 0 8px #fff,0 24px 60px rgba(20,10,40,.5);display:flex;flex-direction:column}
  .sv video{flex:1 1 0;min-height:0;width:100%;display:block;background:#1b1b1b;cursor:pointer}
  .sv .sv-skip{position:absolute;right:70px;top:22px;z-index:2}
  .sv .sv-tag{position:absolute;left:70px;top:28px;font:700 26px Fredoka,sans-serif;color:#fff;text-shadow:0 2px 0 rgba(20,10,40,.5)}
  .sv .sv-bar{flex:0 0 60px;display:flex;align-items:center;gap:14px;padding:0 16px;background:#2b1f4f;box-sizing:border-box}
  .sv .sv-btn{flex:0 0 44px;width:44px;height:44px;border:0;border-radius:50%;background:#ffd23f;color:#2b1f4f;font-size:20px;line-height:1;display:grid;place-items:center;cursor:pointer;padding:0;box-shadow:0 3px 0 rgba(0,0,0,.3)}
  .sv .sv-btn:active{transform:translateY(2px);box-shadow:0 1px 0 rgba(0,0,0,.3)}
  .sv .sv-btn svg{width:22px;height:22px;display:block}
  .sv .sv-time{flex:0 0 auto;min-width:96px;text-align:center;font:600 18px Fredoka,sans-serif;color:#fff;font-variant-numeric:tabular-nums}
  .sv .sv-seek{flex:1 1 auto;min-width:0;height:44px;margin:0;background:transparent;-webkit-appearance:none;appearance:none;cursor:pointer;touch-action:none}
  .sv .sv-seek::-webkit-slider-runnable-track{height:12px;border-radius:6px;background:linear-gradient(to right,#ffd23f var(--p,0%),rgba(255,255,255,.3) var(--p,0%))}
  .sv .sv-seek::-moz-range-track{height:12px;border-radius:6px;background:rgba(255,255,255,.3)}
  .sv .sv-seek::-moz-range-progress{height:12px;border-radius:6px;background:#ffd23f}
  .sv .sv-seek::-webkit-slider-thumb{-webkit-appearance:none;width:30px;height:30px;margin-top:-9px;border-radius:50%;background:#fff;border:4px solid #ffd23f;box-shadow:0 2px 4px rgba(0,0,0,.35)}
  .sv .sv-seek::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:#fff;border:4px solid #ffd23f}
  .sv .sv-box:fullscreen{width:100vw;height:100vh;margin:0;border-radius:0;box-shadow:none}
  .sv .sv-box:fullscreen .sv-bar{flex-basis:72px}
  .sv .sv-box:-webkit-full-screen{width:100vw;height:100vh;margin:0;border-radius:0;box-shadow:none}`;
  document.head.appendChild(css);
  const ICON = {
    play: '<svg viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><rect x="5" y="4" width="5" height="16" rx="1.5" fill="currentColor"/><rect x="14" y="4" width="5" height="16" rx="1.5" fill="currentColor"/></svg>',
    full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    small: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>'
  };
  const mmss = s => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  function play({ src, title, text, img }) {
    return new Promise(resolve => {
      const stage = document.getElementById('stage');
      if (window.SB && SB.stopVoice) SB.stopVoice();
      const card = document.createElement('div'); card.className = 'overlay'; card.style.position = 'absolute';
      card.innerHTML = `<div class="sheet"><span class="kicker">SCIENCE TIME</span>${img ? `<img src="${img}" alt="">` : ''}<h1>${title}</h1><p>${text}</p><button class="clb clb--go clb--lg clb--pulse" id="svPlay"><span class="i">▶</span>Watch the video</button></div>`;
      stage.appendChild(card);
      card.querySelector('#svPlay').addEventListener('click', () => { card.remove(); open({ src }).then(resolve); });
    });
  }
  /* the player itself */
  function open({ src }) {
    return new Promise(resolve => {
      const stage = document.getElementById('stage');
      if (window.SB && SB.stopVoice) SB.stopVoice();
      {
        const o = document.createElement('div'); o.className = 'sv';
        o.innerHTML = `<span class="sv-tag">🔬 Science time</span><button class="clb sv-skip" id="svSkip">Skip <span class="i">⏭</span></button>
          <div class="sv-box"><video src="${src}" playsinline preload="auto"></video>
          <div class="sv-bar"><button class="sv-btn" id="svPP" aria-label="Pause">${ICON.pause}</button>
          <input class="sv-seek" id="svSeek" type="range" min="0" max="1000" step="1" value="0" aria-label="Move through the video">
          <span class="sv-time" id="svTime">0:00 / 0:00</span>
          <button class="sv-btn" id="svFull" aria-label="Full screen">${ICON.full}</button></div></div>`;
        stage.appendChild(o);
        const v = o.querySelector('video'), box = o.querySelector('.sv-box'), pp = o.querySelector('#svPP'), seek = o.querySelector('#svSeek'), time = o.querySelector('#svTime'), full = o.querySelector('#svFull');
        let muted = false; try { muted = localStorage.getItem('cl.muted') === '1'; } catch (e) {}
        v.muted = muted;
        const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
        let done = false; const end = () => { if (done) return; done = true; try { v.pause(); } catch (e) {}
          try { if (fsEl() === box) (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) {}
          document.removeEventListener('fullscreenchange', onFs); document.removeEventListener('webkitfullscreenchange', onFs); o.remove(); resolve(); };
        /* play / pause */
        const toggle = () => { if (v.paused) { if (v.ended) v.currentTime = 0; v.play(); } else v.pause(); };
        const showPP = () => { pp.innerHTML = v.paused ? ICON.play : ICON.pause; pp.setAttribute('aria-label', v.paused ? 'Play' : 'Pause'); };
        v.addEventListener('click', toggle); pp.addEventListener('click', toggle); v.addEventListener('play', showPP); v.addEventListener('pause', showPP);
        /* time bar: follows the video, and dragging it moves the video (it keeps playing or stays paused as it was) */
        let dragging = false;
        const show = () => { const d = v.duration || 0, t = dragging && d ? seek.value / 1000 * d : v.currentTime; if (!dragging && d) seek.value = Math.round(v.currentTime / d * 1000);
          seek.style.setProperty('--p', (seek.value / 10) + '%'); time.textContent = mmss(t) + ' / ' + mmss(d); };
        ['timeupdate', 'loadedmetadata', 'durationchange', 'seeked'].forEach(e => v.addEventListener(e, show));
        (function tick() { if (done) return; show(); requestAnimationFrame(tick); })();
        seek.addEventListener('pointerdown', () => { dragging = true; });
        seek.addEventListener('input', () => { dragging = true; if (v.duration) v.currentTime = seek.value / 1000 * v.duration; show(); });
        const drop = () => { dragging = false; }; seek.addEventListener('change', drop); seek.addEventListener('pointerup', drop); seek.addEventListener('pointercancel', drop);
        /* full screen: the whole box, so the bar stays; iPhones can only show the video's own full screen */
        const onFs = () => { const on = fsEl() === box; full.innerHTML = on ? ICON.small : ICON.full; full.setAttribute('aria-label', on ? 'Leave full screen' : 'Full screen'); };
        document.addEventListener('fullscreenchange', onFs); document.addEventListener('webkitfullscreenchange', onFs);
        full.addEventListener('click', () => {
          try {
            if (fsEl() === box) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
            const req = box.requestFullscreen || box.webkitRequestFullscreen;
            if (req) { const r = req.call(box); if (r && r.catch) r.catch(() => { if (v.webkitEnterFullscreen) v.webkitEnterFullscreen(); }); }
            else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
          } catch (e) {}
        });
        /* the video ends or is skipped: go on with the activity; while the child is moving the time bar at the very end, wait */
        v.addEventListener('ended', () => setTimeout(() => { if (v.ended && !dragging) end(); }, 900));
        v.addEventListener('error', end);                       // a missing or broken file never blocks the activity
        o.querySelector('#svSkip').addEventListener('click', end);
        const p = v.play(); if (p && p.catch) p.catch(() => { showPP(); });
      }
    });
  }
  function again(opts) {
    const back = document.getElementById('sbBack'); if (!back || document.getElementById('svAgain')) return;
    const b = document.createElement('button'); b.className = 'clb'; b.id = 'svAgain'; b.type = 'button'; b.setAttribute('aria-label', 'Watch the science video again');
    b.innerHTML = '<span class="i">▶</span>Video'; back.insertAdjacentElement('afterend', b);
    b.addEventListener('click', () => { if (!document.querySelector('.sv')) open(opts); });
  }
  window.SBVideo = { play, again };
})();
