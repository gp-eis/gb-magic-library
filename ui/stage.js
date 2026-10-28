/* Flexible screen: each page's 1180 x 820 picture (the "safe area") is drawn as big as the window allows; the space
   around it (wider or taller screens) is filled by the page's own background instead of bands.
   CLStage.fit(el) scales and places el in the window. CSS gets --cl-l / --cl-r / --cl-t / --cl-b: how many stage
   pixels the window reaches past the safe area on the left, right, top and bottom (negative = the window edge is inside
   it), so backgrounds can stretch to the edges and buttons / My Mate can pin to them. A 'clstage' event follows changes.
   Phone layout (CLStage.phone): on small screens a page can ask for its activity alone to fill the height, with a
   button column on the left and a My Mate column on the right (html.cl-phone); see ui/stage.css.
   Load with `data-base` = path back to app/ (like ui/rotate.js). */
(function () {
  const SW = 1180, SH = 820, SMALL = 0.62, els = [];
  const me = document.currentScript, base = (me && me.dataset.base) || '';
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = base + 'ui/stage.css';
  document.head.appendChild(css);
  let phoneOpts = null;
  const st = window.CLStage = {
    S: 1, phone: false, l: 0, r: 0, t: 0, b: 0,
    fit(el) { if (!els.includes(el)) els.push(el); layout(); return st; },
    /* opts: { content() -> {x, y, w, h} in stage px (the part that must show), left, right: column widths, pad } */
    usePhone(opts) { phoneOpts = opts; layout(); return st; },
    refresh() { layout(); }
  };
  function layout() {
    if (!els.length) return;
    const iw = innerWidth, ih = innerHeight;
    let S = Math.min(iw / SW, ih / SH), x = (iw - SW * S) / 2, y = (ih - SH * S) / 2;
    const phone = !!phoneOpts && S < SMALL;
    if (phone) {
      const box = phoneOpts.content(), L = phoneOpts.left, R = phoneOpts.right, P = phoneOpts.pad || 20;
      const needW = box.w + L + R + 2 * P, needH = box.h + 2 * P;
      S = Math.min(iw / needW, ih / needH);
      x = (L + P) * S + (iw - needW * S) / 2 - box.x * S;
      y = (ih - box.h * S) / 2 - box.y * S;
    }
    Object.assign(st, { S, phone, l: x / S, t: y / S, r: (iw - x) / S - SW, b: (ih - y) / S - SH });
    const root = document.documentElement;
    root.classList.add('cl-flex'); root.classList.toggle('cl-phone', phone);
    for (const k of ['l', 'r', 't', 'b']) root.style.setProperty('--cl-' + k, st[k].toFixed(2));
    els.forEach(el => { el.style.transform = `scale(${S})`; el.style.left = x + 'px'; el.style.top = y + 'px'; });
    dispatchEvent(new CustomEvent('clstage', { detail: st }));
  }
  addEventListener('resize', layout);
})();
