/* Finger drawing pad for THINK pages (window.SBDraw). SBDraw.make({pad, canvas, paints, done, colors}) wires a canvas
   inside a pad box with colour dots, "Start again" and a Done button; returns {wipe, strokes(), snapshot(w,h)}.
   The canvas is transparent so a printed picture can sit under it (the pad's background). */
(function () {
  const COLORS = ['#e5342e', '#ff8a1f', '#ffd21f', '#3fae49', '#2f8fe0', '#8a4fd0', '#7a4a2a', '#1d1a2b'];
  function make({ pad, canvas, paints, done, colors, onStroke }) {
    const cv = canvas, ctx = cv.getContext('2d'); let color = (colors || COLORS)[0], strokes = 0, drawing = false, last = null;
    const pos = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * cv.width, y: (e.clientY - r.top) / r.height * cv.height }; };
    const dot = p => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, 7); ctx.fill(); };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) {} drawing = true; last = pos(e); dot(last); pad.classList.add('used'); });
    cv.addEventListener('pointermove', e => { if (!drawing) return; const p = pos(e); ctx.strokeStyle = color; ctx.lineWidth = 18; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p; });
    const up = () => { if (!drawing) return; drawing = false; strokes++; if (done) { done.disabled = false; done.classList.add('clb--pulse'); } if (onStroke) onStroke(strokes); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    function wipe() { ctx.clearRect(0, 0, cv.width, cv.height); strokes = 0; pad.classList.remove('used'); if (done) { done.disabled = true; done.classList.remove('clb--pulse'); } }
    paints.innerHTML = '';
    (colors || COLORS).forEach((c, n) => { const b = document.createElement('button'); b.type = 'button'; b.style.background = c; b.setAttribute('aria-label', 'Colour ' + (n + 1)); if (c === color) b.className = 'on';
      b.addEventListener('click', () => { color = c; [...paints.querySelectorAll('button')].forEach(x => x.classList.toggle('on', x === b)); }); paints.appendChild(b); });
    const w = document.createElement('button'); w.type = 'button'; w.className = 'wipe'; w.textContent = 'Start again'; w.addEventListener('click', wipe); paints.appendChild(w);
    /* a small JPEG of the pad (picture under the drawing included) for the grown-ups' report, kept on this device */
    function snapshot(w, h) { try { const s = document.createElement('canvas'); s.width = w; s.height = h; const c = s.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); const bg = pad.querySelector('img'); if (bg) c.drawImage(bg, 0, 0, w, h); c.drawImage(cv, 0, 0, w, h); return s.toDataURL('image/jpeg', .7); } catch (e) { return null; } }
    return { wipe, strokes: () => strokes, snapshot };
  }
  window.SBDraw = { make, COLORS };
})();
