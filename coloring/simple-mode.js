/* Simple book maker: adds html.cl-simple (see simple-mode.css) unless a grown-up chose the original one.
   The choice is kept in localStorage 'cl.bookmaker' ('classic' = original, all buttons); ?classic in the address
   also shows the original. The switch sits in the "For grown-ups" menu. */
(function () {
  'use strict';
  const KEY = 'cl.bookmaker';
  let classic = /[?&]classic\b/.test(location.search);
  try { classic = classic || localStorage.getItem(KEY) === 'classic'; } catch (e) {}
  if (!classic) document.documentElement.classList.add('cl-simple');

  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  ready(() => {
    /* grown-ups: the language buttons and the simple/original switch */
    const content = document.getElementById('grownupContent');
    if (content) {
      const sw = document.createElement('label'); sw.className = 'cl-simple-switch';
      sw.style.cssText = 'display:flex;gap:8px;align-items:center;margin:8px 0;font-size:14px;cursor:pointer';
      sw.innerHTML = `<input type="checkbox" ${classic ? '' : 'checked'}> Simple book maker for children (fewer, bigger buttons)`;
      sw.querySelector('input').addEventListener('change', e => {
        try { localStorage.setItem(KEY, e.target.checked ? 'simple' : 'classic'); } catch (err) {}
        location.replace(location.href.replace(/([?&])classic\b&?/, '$1').replace(/[?&]$/, ''));
      });
      content.prepend(sw);
      if (!classic) { const lang = document.querySelector('.header-tools > .language-switch'); if (lang) content.prepend(lang.cloneNode(true)); }
    }
    if (classic) return;
    /* the cloned language buttons work through the real (hidden) ones */
    const real = [...document.querySelectorAll('.header-tools > .language-switch button')];
    document.querySelectorAll('#grownupContent .language-switch button').forEach((b, i) => b.addEventListener('click', () => real[i] && real[i].click()));

    /* Done shows (big and green) only once the page is ready to finish */
    const finish = document.getElementById('finish'), controls = document.querySelector('.main-controls');
    const paint = () => { if (finish && controls) controls.classList.toggle('cl-ready', !finish.disabled && finish.getAttribute('aria-disabled') !== 'true' && !finish.hidden); };
    if (finish) { new MutationObserver(paint).observe(finish, { attributes: true }); paint(); }

    /* if an old saved choice was the (hidden) crayon, start on the brush */
    const pick = () => {
      const on = document.querySelector('.tool-buttons button[aria-pressed=true]');
      if (on && on.dataset.tool === 'crayon') { const brush = document.querySelector('.tool-buttons button[data-tool=brush]'); if (brush) brush.click(); }
    };
    document.addEventListener('click', e => { if (e.target.closest('#begin,#edit')) setTimeout(pick, 300); }, true);
  });
})();
