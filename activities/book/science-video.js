/* The science explainer video inside THINK. It plays just BEFORE the science round (the workbook's last page):
   SBVideo.play({ src, title, text, img }) shows a "Science time!" card with a big play button (a tap is needed so phones
   allow the sound), then the video on the stage with Skip; the promise resolves when the video ends or is skipped.
   Videos are made in video/<name>/ (see CLAUDE.md, Science explainer videos) and copied next to the page as science.mp4.
   Loaded after kit.js: uses its overlay look, buttons and SB.stopVoice. Follows the sound switch (cl.muted). */
(function () {
  const css = document.createElement('style');
  css.textContent = `
  .sv{position:absolute;inset:0;z-index:45;display:grid;place-items:center;background:rgba(43,31,79,.72)}
  .sv .sv-box{position:relative;width:1060px;height:596px;border-radius:26px;overflow:hidden;background:#1b1b1b;box-shadow:0 0 0 8px #fff,0 24px 60px rgba(20,10,40,.5)}
  .sv video{width:100%;height:100%;display:block;background:#1b1b1b}
  .sv .sv-skip{position:absolute;right:70px;top:36px;z-index:2}
  .sv .sv-tag{position:absolute;left:70px;top:40px;font:700 26px Fredoka,sans-serif;color:#fff;text-shadow:0 2px 0 rgba(20,10,40,.5)}`;
  document.head.appendChild(css);
  function play({ src, title, text, img }) {
    return new Promise(resolve => {
      const stage = document.getElementById('stage');
      if (window.SB && SB.stopVoice) SB.stopVoice();
      const card = document.createElement('div'); card.className = 'overlay'; card.style.position = 'absolute';
      card.innerHTML = `<div class="sheet"><span class="kicker">SCIENCE TIME</span>${img ? `<img src="${img}" alt="">` : ''}<h1>${title}</h1><p>${text}</p><button class="clb clb--go clb--lg clb--pulse" id="svPlay"><span class="i">▶</span>Watch the video</button></div>`;
      stage.appendChild(card);
      card.querySelector('#svPlay').addEventListener('click', () => {
        card.remove();
        const o = document.createElement('div'); o.className = 'sv';
        o.innerHTML = `<span class="sv-tag">🔬 Science time</span><button class="clb sv-skip" id="svSkip">Skip <span class="i">⏭</span></button><div class="sv-box"><video src="${src}" playsinline preload="auto"></video></div>`;
        stage.appendChild(o);
        const v = o.querySelector('video'); let muted = false; try { muted = localStorage.getItem('cl.muted') === '1'; } catch (e) {}
        v.muted = muted;
        let done = false; const end = () => { if (done) return; done = true; try { v.pause(); } catch (e) {} o.remove(); resolve(); };
        v.addEventListener('ended', () => setTimeout(end, 600));
        v.addEventListener('error', end);                       // a missing or broken file never blocks the activity
        v.addEventListener('click', () => { if (v.paused) v.play(); else v.pause(); });
        o.querySelector('#svSkip').addEventListener('click', end);
        const p = v.play(); if (p && p.catch) p.catch(() => { v.controls = true; });
      });
    });
  }
  window.SBVideo = { play };
})();
