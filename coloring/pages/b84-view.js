/* The WHOLE storybook page in the book maker (user, 2026-11-12): when a child reads a page or watches it play, they see
   the designer's whole page, not the zoomed colouring scene. The printed words are blanked on that page and the child's
   own handwriting is shown where they were. Only the colouring screen zooms into the things to colour.
   A page that has `view` (pages/b84-pages.js, from tools/make_create_fullpages.py):
     view.img    the whole page, 1200 x 1387, words blanked, things to colour lifted off
     view.scene  [x, y, w, h] of the colouring scene (1672 x 941) that lies on...
     view.page   [x, y, w, h] ...this rectangle of the page
     view.lines  [x, y, w, h] on the page for each line of handwriting
   1 Reading and playing: the picture box takes the page's tall shape with the page as its background; the book maker's own
     picture and play canvases are laid over the scene's rectangle, and the handwriting over the cloud.
   2 GPB84View.spread(cfg, art, written, title) draws the saved page for My Library the same way (a 1500 x 740 spread:
     the printed words on the left, the child's whole page on the right). Used by library-bridge.js and the library's reader. */
(function () {
  'use strict';
  const PW = 1200, PH = 1387, SW = 1672, SH = 941;
  const $ = s => document.querySelector(s);
  const place = v => { const kx = v.page[2] / v.scene[2], ky = v.page[3] / v.scene[3];        // the whole scene, in page px
    return { x: v.page[0] - v.scene[0] * kx, y: v.page[1] - v.scene[1] * ky, w: SW * kx, h: SH * ky }; };
  const scene = () => window.storybook && window.storybook.getScene ? window.storybook.getScene() : null;

  /* ---------- 1 the page while reading and playing ---------- */
  let hands = null;
  function refresh() {
    const box = $('.reading-page .scene') || $('#storybook .scene'); if (!box) return;
    const cfg = scene(), v = cfg && cfg.view, mode = document.body.dataset.mode, on = !!v && mode !== 'color' && document.body.dataset.page !== 'cover';
    box.classList.toggle('b84-whole', on);
    if (!on) { if (hands) hands.hidden = true; ['--b84-x', '--b84-y', '--b84-w', '--b84-h'].forEach(k => box.style.removeProperty(k)); box.style.backgroundImage = ''; return; }
    const p = place(v), pct = (n, of) => (n / of * 100).toFixed(3) + '%';
    box.style.backgroundImage = 'url("' + v.img + '")';
    box.style.setProperty('--b84-x', pct(p.x, PW)); box.style.setProperty('--b84-y', pct(p.y, PH)); box.style.setProperty('--b84-w', pct(p.w, PW)); box.style.setProperty('--b84-h', pct(p.h, PH));
    box.dataset.fade = (v.page[1] > 0 ? 't' : '') + (v.page[1] + v.page[3] < PH - 2 ? 'b' : '') + (v.page[0] + v.page[2] < PW - 2 ? 'r' : '');
    if (!hands) { hands = document.createElement('div'); hands.className = 'b84-hands'; hands.setAttribute('aria-hidden', 'true'); }
    if (hands.parentNode !== box) box.appendChild(hands);
    hands.hidden = false;
    const rows = [...document.querySelectorAll('.story-line')].filter(r => !r.hidden && (r.querySelector('.line-print') || r).textContent.trim());
    hands.innerHTML = v.lines.map((b, i) => { const row = rows[i], img = row && row.querySelector('img'), text = row ? (row.querySelector('.line-print') || row).textContent.trim() : '';
      const st = `left:${pct(b[0], PW)};top:${pct(b[1], PH)};width:${pct(b[2], PW)};height:${pct(b[3], PH)}`;
      return img ? `<span class="b84-hand" style="${st}"><img src="${img.src}" alt=""></span>` : `<span class="b84-hand b84-empty" style="${st};--n:${Math.max(6, text.length)}"><i>${text.replace(/[<&]/g, c => ({ '<': '&lt;', '&': '&amp;' }[c]))}</i></span>`; }).join('');
  }
  let queued = 0; const soon = () => { if (queued) return; queued = requestAnimationFrame(() => { queued = 0; refresh(); }); };
  ['book-activity-change', 'book-page-change', 'book-mode-change', 'handwriting-edited', 'autosave-state-change'].forEach(e => document.addEventListener(e, soon));
  addEventListener('load', () => { soon(); const lines = $('.story-lines'); if (lines) new MutationObserver(soon).observe(lines, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'class', 'hidden'] });
    new MutationObserver(soon).observe(document.body, { attributes: true, attributeFilter: ['data-mode', 'data-activity', 'data-page'] }); });

  /* ---------- 2 the saved page ---------- */
  const load = src => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = src; });
  /* the whole page drawn at x, y with height h: page picture, the coloured scene (art: canvas or picture of the 1672:941 scene),
     and for each line either the child's handwriting (written[i] = picture) or the words in dotted outline (words[i]) */
  function drawPage(ctx, x, y, h, v, pageImg, art, written, words) {
    const k = h / PH, w = PW * k; ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.drawImage(pageImg, x, y, w, h);
    if (art) {
      const aw = art.naturalWidth || art.width, ah = art.naturalHeight || art.height, s = v.scene, p = v.page;
      const c = document.createElement('canvas'); c.width = Math.round(p[2] * k); c.height = Math.round(p[3] * k); const g = c.getContext('2d');
      g.drawImage(art, s[0] / SW * aw, s[1] / SH * ah, s[2] / SW * aw, s[3] / SH * ah, 0, 0, c.width, c.height);
      const f = Math.round(26 * k); g.globalCompositeOperation = 'destination-in';        // soft edges where the scene meets the rest of the page
      const fade = (x0, y0, x1, y1) => { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, '#000'); return gr; };
      if (p[1] > 0) { g.fillStyle = fade(0, 0, 0, f); g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#000'; }
      const cut = (gr, rx, ry, rw, rh) => { const m = document.createElement('canvas'); m.width = c.width; m.height = c.height; const mg = m.getContext('2d'); mg.fillStyle = '#000'; mg.fillRect(0, 0, m.width, m.height); mg.clearRect(rx, ry, rw, rh); mg.fillStyle = gr; mg.fillRect(rx, ry, rw, rh); g.drawImage(m, 0, 0); };
      g.globalCompositeOperation = 'destination-in';
      if (p[1] + p[3] < PH - 2) cut(fade(0, c.height, 0, c.height - f), 0, c.height - f, c.width, f);
      if (p[0] + p[2] < PW - 2) cut(fade(c.width, 0, c.width - f, 0), c.width - f, 0, f, c.height);
      ctx.drawImage(c, x + p[0] * k, y + p[1] * k);
    }
    v.lines.forEach((b, i) => { const bx = x + b[0] * k, by = y + b[1] * k, bw = b[2] * k, bh = b[3] * k, im = written && written[i];
      if (im) { const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height, sc = Math.min(bw / iw, bh / ih); ctx.drawImage(im, bx + (bw - iw * sc) / 2, by + (bh - ih * sc) / 2, iw * sc, ih * sc); }
      else if (words && words[i]) { let size = Math.floor(bh * .62); ctx.font = size + 'px "Andika Literacy", sans-serif'; const tw = ctx.measureText(words[i]).width; if (tw > bw) { size = Math.floor(size * bw / tw); ctx.font = size + 'px "Andika Literacy", sans-serif'; }
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.strokeStyle = '#6b7a86'; ctx.lineWidth = Math.max(1, size / 26); ctx.setLineDash([size / 7, size / 10]); ctx.strokeText(words[i], bx + bw / 2, by + bh / 2); ctx.setLineDash([]); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; } });
    ctx.restore();
  }
  /* the 1500 x 740 spread kept for My Library. base = path from the page that draws it to the coloring folder ('' or 'coloring/') */
  async function spread(cfg, art, written, title, base) {
    const v = cfg.view, pageImg = await load((base || '') + v.img); const words = cfg.lines.filter(t => t && t.trim());
    const canvas = document.createElement('canvas'); canvas.width = 1500; canvas.height = 740; const x = canvas.getContext('2d');
    x.fillStyle = '#fffdf7'; x.fillRect(0, 0, 1500, 740);
    x.fillStyle = '#254e49'; x.font = 'bold 34px "Andika Literacy", sans-serif'; x.fillText('Bye-Bye Sugar Bugs!', 60, 96);
    x.fillStyle = '#658277'; x.font = '20px "Andika Literacy", sans-serif'; x.fillText(title || 'Read with me', 60, 134);
    x.fillStyle = '#253f47'; words.forEach((t, i) => { let size = 44; x.font = size + 'px "Andika Literacy", sans-serif'; const tw = x.measureText(t).width; if (tw > 640) { size = Math.floor(size * 640 / tw); x.font = size + 'px "Andika Literacy", sans-serif'; } x.fillText(t, 60, 260 + i * 84); });
    const h = 700, w = Math.round(h * PW / PH), px = 1500 - w - 70, py = 20;
    x.fillStyle = 'rgba(60,40,10,.16)'; x.fillRect(px + 6, py + 8, w, h);
    drawPage(x, px, py, h, v, pageImg, art, written, words);
    return canvas;
  }
  window.GPB84View = { refresh, drawPage, spread, load };
})();
