/* Landscape only: on a phone or tablet held upright, My Mate asks the child to turn it sideways.
   Shown by CSS on touch screens in portrait (ui/rotate.css); everything appears again once the device is turned.
   Load on every page with a fixed landscape stage; `data-base` on the script tag is the path back to app/. */
(function () {
  const me = document.currentScript, base = (me && me.dataset.base) || '';
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = base + 'ui/rotate.css';
  document.head.appendChild(css);
  /* Android phones: the first tap makes the library full screen and turns it sideways by itself, even with the phone's
     rotation lock on. Done by the phone frame (play.html) so it lasts from page to page. iPhones cannot do this. */
  const top_ = (() => { try { return window.top.CL_SHELL ? window.top : window; } catch (e) { return window; } })();
  const canTurn = matchMedia('(pointer: coarse)').matches && !!top_.document.documentElement.requestFullscreen
    && !!(top_.screen.orientation && top_.screen.orientation.lock);
  function build() {
    if (document.getElementById('cl-rotate')) return;
    const mate = window.CLMate ? CLMate.src('idle', base) : base + 'art/outfits/wizard/gerry-idle.webp';
    const name = window.CLMate ? CLMate.name() : 'Gerry';
    const el = document.createElement('div');
    el.id = 'cl-rotate'; el.setAttribute('role', 'alert');
    el.innerHTML = `<div class="rt-box"><img class="rt-mate" src="${mate}" alt="">
      <div class="rt-phone" aria-hidden="true"><span></span></div>
      <p class="rt-en">Turn your phone sideways!</p><p class="rt-ko">휴대폰을 옆으로 돌려 주세요!</p>
      <p class="rt-who">— ${name}, your My Mate</p>
      ${canTurn ? `<button class="rt-go" type="button">▶ Play sideways · 가로로 시작</button>`
        : `<p class="rt-tip">Screen won't turn? Switch off rotation lock.<br>화면이 안 돌아가면 화면 회전 잠금을 꺼 주세요.</p>`}</div>`;
    document.body.appendChild(el);
  }
  if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);

  function full() {
    if (top_.CLFull) return top_.CLFull();
    const d = document.documentElement;
    if (document.fullscreenElement) return;
    d.requestFullscreen({ navigationUI: 'hide' }).then(() => screen.orientation.lock('landscape')).catch(() => {});
  }
  if (canTurn) addEventListener('pointerup', () => { if (!top_.document.fullscreenElement) full(); }, true);
})();
/* small-screen mode: the stage (1180 x 820) is drawn small on phones held sideways */
(function () {
  function check() { const s = Math.min(innerWidth / 1180, innerHeight / 820); document.documentElement.classList.toggle('cl-small', s < 0.62); }
  check(); addEventListener('resize', check); addEventListener('orientationchange', check);
})();
