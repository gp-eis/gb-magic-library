/* My Library · Decorate: the child decorates their own reading room (My Library) with stars, putting things
   wherever they like (user 2026-11-20: "place the items wherever they want"; the old version had seven fixed spots).
   Kinds of things and where they may go:
     rugs, seats, lamps, plants & pets  -> on the floor (they stand on it: smaller further back, a contact shadow)
     wall pictures                      -> on the wall (hung on a nail with a little wire, flat shadow)
     ceiling things                     -> hanging from the ceiling
   The first thing of each kind is free; the rest cost stars from the Magic Wardrobe wallet (window.CLWardrobe.spend/left).
   Saved per child in localStorage 'cl.room' = {owned:[ids], items:[{id, x, y, f}]} (swapped by profiles.js);
   x = the middle, y = the feet (floor), the middle (wall) or the top (ceiling), f = flipped. Older saves
   ({place:{spot:id}}) are moved over. Art: art/my-room.webp + art/deco/<id>.webp. Positions are stage px (1180 x 820). */
(function () {
  const nook = document.getElementById('nook');
  if (!nook) return;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* the kinds: tray tab, where they go, their size (contain box at the front of the floor scale 1) */
  const KINDS = {
    rugs: { name: 'Rugs', ko: '러그', icon: '🟢', zone: 'floor', rug: true, w: 430 },
    seats: { name: 'Seats', ko: '의자', icon: '🛋️', zone: 'floor', box: [190, 160] },
    lamps: { name: 'Lamps', ko: '램프', icon: '💡', zone: 'floor', box: [150, 195] },
    plants: { name: 'Plants & pets', ko: '화분과 친구', icon: '🪴', zone: 'floor', box: [175, 160] },
    walls: { name: 'Wall', ko: '벽 그림', icon: '🖼️', zone: 'wall', box: [118, 150] },
    ceiling: { name: 'Ceiling', ko: '천장', icon: '🌟', zone: 'ceiling', box: [270, 210] }
  };
  /* [id, name, ko, price, width / height of the picture] */
  const ITEMS = {
    rugs: [['rugs-1', 'Star rug', '별 러그', 0, 1.3], ['rugs-2', 'Rainbow rug', '무지개 러그', 8, 1.32], ['rugs-3', 'Ocean rug', '바다 러그', 10, 1.29], ['rugs-4', 'Flower rug', '꽃 러그', 12, 1.21]],
    seats: [['seats-1', 'Velvet pouf', '벨벳 푸프', 0, 1.18], ['seats-2', 'Beanbag', '빈백', 10, 1.13], ['seats-3', 'Blue armchair', '파란 안락의자', 15, .976], ['seats-4', 'Storybook chair', '동화책 의자', 20, 1.063]],
    lamps: [['lamps-1', 'Table lamp', '탁자 램프', 0, .714], ['lamps-2', 'Mushroom lamp', '버섯 램프', 8, .874], ['lamps-3', 'Moon lamp', '달 램프', 12, .648], ['lamps-4', 'Lighthouse lamp', '등대 램프', 15, .526]],
    plants: [['plants-1', 'Plant & books', '화분과 책', 0, 1.01], ['plants-2', 'Sleepy kitten', '잠자는 고양이', 12, 1.35], ['plants-3', 'Fish bowl', '어항', 10, .905], ['plants-4', 'Sunflower', '해바라기', 8, .536]],
    walls: [['walls-1', 'My book page', '내가 만든 그림', 0, .693], ['walls-2', 'Castle painting', '성 그림', 8, .724], ['walls-3', 'World map', '세계 지도', 10, .764], ['walls-4', 'Rainbow painting', '무지개 그림', 8, .657]],
    ceiling: [['ceiling-1', 'Star garland', '별 가랜드', 0, 1.296], ['ceiling-2', 'Moon mobile', '달 모빌', 10, .66], ['ceiling-3', 'Paper lanterns', '종이 등', 12, 1.288], ['ceiling-4', 'Hot-air balloon', '열기구', 15, .498]]
  };
  const INFO = {}; Object.entries(ITEMS).forEach(([k, list]) => list.forEach(i => { INFO[i[0]] = { id: i[0], kind: k, name: i[1], ko: i[2], price: i[3], ar: i[4] }; }));
  /* the free empty frame shows the child's own book pages (from My Library's pages, see index.html fillFrames) */
  const PAGE_FRAME = 'walls-1', PAGE_INSET = [16, 16.5, 22, 12.5];   // % in from left, right, top, bottom
  const MAX = id => (id === PAGE_FRAME ? 4 : 1);                       // up to four page frames; one of everything else

  /* the room picture (stage px): the floor meets the wall at about y 630; the wall between the arches and the window
     is empty. Floor things: feet between FLOOR[0] (back, drawn smaller) and FLOOR[1] (front). */
  const FLOOR = [650, 812], WALL = [235, 500], CEIL = [-8, 40];
  const depth = y => 0.8 + 0.4 * (y - FLOOR[0]) / (FLOOR[1] - FLOOR[0]);
  function sizeOf(id, y) {
    const it = INFO[id], K = KINDS[it.kind];
    if (K.rug) { const s = depth(y), w = K.w * s; return [w, w * 0.33]; }
    let [bw, bh] = K.box; if (bw / bh > it.ar) bw = bh * it.ar; else bh = bw / it.ar;
    const s = K.zone === 'floor' ? depth(y) : 1; return [bw * s, bh * s];
  }
  /* the part of the stage the child can see: on a wide screen the room goes on past the 1180 stage */
  const reach = () => { const S = window.CLStage, flex = document.documentElement.classList.contains('cl-flex'); return flex && S ? [-Math.max(0, S.l), 1180 + Math.max(0, S.r)] : [0, 1180]; };
  function clampPos(id, x, y) {
    const z = KINDS[INFO[id].kind].zone, [lo, hi] = reach();
    y = Math.round(Math.min(Math.max(y, (z === 'floor' ? FLOOR : z === 'wall' ? WALL : CEIL)[0]), (z === 'floor' ? FLOOR : z === 'wall' ? WALL : CEIL)[1]));
    const w = sizeOf(id, y)[0], m = Math.min(w / 2 - 20, 60);
    x = Math.round(Math.min(Math.max(x, lo + m), hi - m));
    return [x, y];
  }

  const START = { owned: ['rugs-1', 'seats-1', 'lamps-1', 'plants-1', 'ceiling-1', 'walls-1'],
    items: [{ id: 'rugs-1', x: 560, y: 790 }, { id: 'seats-1', x: 116, y: 800 }, { id: 'lamps-1', x: 717, y: 668 }, { id: 'plants-1', x: 325, y: 662 },
      { id: 'walls-1', x: 830, y: 330 }, { id: 'walls-1', x: 950, y: 330 }] };
  /* the old fixed spots, for moving older saves over */
  const OLD = { rug: [560, 790], seat: [116, 800], lamp: [717, 668], plant: [325, 662], ceiling: [915, -6], wall1: [830, 330], wall2: [950, 330] };
  const copy = o => JSON.parse(JSON.stringify(o));
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem('cl.room'));
      if (s && Array.isArray(s.items)) return { owned: [...new Set(START.owned.concat(s.owned || []))], items: s.items.filter(i => INFO[i.id]) };
      if (s && s.place) {
        const items = Object.entries(OLD).map(([k, p]) => s.place[k] ? { id: s.place[k], x: p[0], y: p[1] } : null).filter(i => i && INFO[i.id]);
        return { owned: [...new Set(START.owned.concat(s.owned || []))], items };
      }
    } catch (e) {}
    return copy(START);
  }
  let state = load();
  const save = () => { try { localStorage.setItem('cl.room', JSON.stringify(state)); } catch (e) {} };
  const owned = id => state.owned.includes(id) || INFO[id].price === 0;
  const count = id => state.items.filter(i => i.id === id).length;
  const left = () => (window.CLWardrobe && CLWardrobe.left ? CLWardrobe.left() : 0);
  const say = (m, v) => { const b = document.getElementById('nookBubble'); if (b && window.CLLines) b.textContent = CLLines.text(m, v); };

  /* ---------- the room ---------- */
  const bg = nook.querySelector('.bg'); if (bg) bg.src = 'art/my-room.webp';
  const layer = document.createElement('div'); layer.className = 'room-deco';
  bg.after(layer);
  let pages = [];
  function readPages() { const p = [...nook.querySelectorAll('.artframe img.real')].map(i => i.src); if (p.join() !== pages.join()) { pages = p; paint(); } }
  new MutationObserver(readPages).observe(nook, { childList: true, subtree: true });

  let sel = null;          // the thing chosen in the room (shows turn / put-away buttons)
  const els = new Map();   // item object -> element
  function place(it, el) {
    const K = KINDS[INFO[it.id].kind], [w, h] = sizeOf(it.id, it.y);
    const top = K.zone === 'floor' ? it.y - h : K.zone === 'wall' ? it.y - h / 2 : it.y;
    el.style.cssText = `left:${it.x - w / 2}px;top:${top}px;width:${w}px;height:${h}px;z-index:${K.rug ? 1 : K.zone === 'wall' ? 2 : K.zone === 'ceiling' ? 3 : 10 + Math.round(it.y)}`;
    el.classList.toggle('flip', !!it.f);
  }
  function paint() {
    const seen = new Set();
    state.items.forEach(it => {
      seen.add(it);
      let el = els.get(it);
      if (!el) {
        const info = INFO[it.id], z = KINDS[info.kind].zone;
        el = document.createElement('div'); el.className = `rd zone-${z}${KINDS[info.kind].rug ? ' rug' : ''}`; el.dataset.id = it.id;
        const [il, ir, itp, ib] = PAGE_INSET;
        el.innerHTML = (z === 'wall' ? '<svg class="rd-wire" viewBox="0 0 100 30" preserveAspectRatio="none"><path d="M18 30 L50 3 L82 30"/><circle cx="50" cy="4" r="3.4"/></svg>' : '')
          + `<img alt="" draggable="false" src="art/deco/${it.id}.webp">`
          + (it.id === PAGE_FRAME ? `<span class="rd-page" style="left:${il}%;right:${ir}%;top:${itp}%;bottom:${ib}%"><img alt="" draggable="false"><i>✏️</i></span>` : '');
        el._it = it; els.set(it, el); layer.appendChild(el);
      }
      place(it, el);
    });
    els.forEach((el, it) => { if (!seen.has(it)) { el.remove(); els.delete(it); } });
    /* page frames show the child's pages from left to right */
    state.items.filter(i => i.id === PAGE_FRAME).sort((a, b) => a.x - b.x).forEach((it, n) => {
      const pg = els.get(it).querySelector('.rd-page'), pi = pg.querySelector('img'), p = pages[n];
      pg.classList.toggle('blank', !p);
      if (p) { if (pi.getAttribute('src') !== p) pi.src = p; } else pi.removeAttribute('src');
    });
    if (sel && !els.has(sel)) select(null);
  }
  paint();

  /* ---------- decorating ---------- */
  const tray = document.createElement('div'); tray.className = 'room-tray'; tray.hidden = true; nook.appendChild(tray);
  const tools = document.createElement('div'); tools.className = 'room-tools'; tools.hidden = true;
  tools.innerHTML = '<button type="button" data-t="flip" aria-label="Turn around">↔</button><button type="button" data-t="away" aria-label="Put away">✕</button>';
  nook.appendChild(tools);
  const bin = document.createElement('div'); bin.className = 'room-bin'; bin.hidden = true; bin.innerHTML = '<span>📦</span><b>Put away</b>'; nook.appendChild(bin);
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'clb clb--place room-btn';
  btn.setAttribute('aria-label', 'Decorate My Library');
  const right = nook.querySelector('.clright'); if (right) right.prepend(btn);

  let editing = false, tab = 'rugs', pick = null, tucked = false;
  function setMode(on) {
    editing = on; nook.classList.toggle('decorating', on);
    btn.innerHTML = on ? '<span class="i">✓</span>Done' : '<span class="i">🎨</span>Decorate';
    btn.classList.toggle('clb--done', on); btn.classList.toggle('clb--place', !on);
    select(null);
    if (on) { pick = null; tucked = false; drawTray(); tray.hidden = false; requestAnimationFrame(() => tray.classList.add('on')); say('room.open'); }
    else { tray.classList.remove('on'); setTimeout(() => { if (!editing) tray.hidden = true; }, 220); say('room.done'); }
  }
  btn.innerHTML = '<span class="i">🎨</span>Decorate';
  btn.addEventListener('click', () => setMode(!editing));

  function drawTray() {
    const tabs = Object.entries(KINDS).map(([k, K]) => `<button type="button" class="rt-tab${k === tab ? ' on' : ''}" data-tab="${k}"><span>${K.icon}</span>${K.name}</button>`).join('');
    const cards = ITEMS[tab].map(([id, name, ko, price]) => {
      const mine = owned(id), n = count(id), full = n >= MAX(id);
      const tag = !mine ? '⭐ ' + price : full ? 'In room' : n ? 'One more' : price ? 'Mine ✓' : 'Free';
      return `<button type="button" class="rt-card${mine ? ' mine' : ''}${full ? ' full' : ''}${pick === id ? ' sel' : ''}" data-id="${id}"><span class="rt-tag">${tag}</span><span class="rt-pic"><img src="art/deco/${id}.webp" alt="" draggable="false"></span><b>${esc(name)}</b></button>`;
    }).join('');
    let act = `<span class="rt-hint">Drag it into<br>your room!</span>`;
    const p = pick && INFO[pick];
    if (p && !owned(pick)) act = left() >= p.price ? `<button class="clb clb--go clb--lg clb--pulse" type="button" data-do="buy">Get it for <span class="i">⭐</span>${p.price}</button>`
      : `<button class="clb clb--go clb--lg" type="button" disabled>⭐ ${p.price}</button><span class="rt-hint">${p.price - left()} more ⭐ needed</span>`;
    tray.classList.toggle('tucked', tucked);
    tray.innerHTML = `<div class="rt-head"><div class="rt-tabs">${tabs}</div><span class="clchip">⭐ ${left()}</span><button class="clb clb--icon clb--sm rt-tuck" type="button" data-tuck aria-label="${tucked ? 'Show things' : 'Hide things'}">${tucked ? '▲' : '▼'}</button></div>
      <div class="rt-cards">${cards}</div><div class="rt-act">${act}</div>`;
  }

  /* a new thing goes where the child drops it, or (on a tap) somewhere free in its part of the room */
  function freeSpot(id) {
    const z = KINDS[INFO[id].kind].zone, n = state.items.length;
    if (z === 'wall') { const xs = [830, 950, 760, 1010, 480]; const x = xs.find(x => !state.items.some(i => KINDS[INFO[i.id].kind].zone === 'wall' && Math.abs(i.x - x) < 90)) || 830; return [x, 330]; }
    if (z === 'ceiling') return [[600, 900, 300, 760][n % 4], -6];
    if (KINDS[INFO[id].kind].rug) return [560, 790];
    const xs = [480, 640, 880, 220, 400, 760]; return [xs.find(x => !state.items.some(i => KINDS[INFO[i.id].kind].zone === 'floor' && !KINDS[INFO[i.id].kind].rug && Math.abs(i.x - x) < 110)) || 560, 720];
  }
  function add(id, x, y) {
    if (count(id) >= MAX(id)) return null;
    /* one rug at a time looks tidy: a new rug replaces the old one only if it is dropped on top of it */
    if (x == null) [x, y] = freeSpot(id);
    [x, y] = clampPos(id, x, y);
    const it = { id, x, y }; state.items.push(it); save(); paint(); tucked = true; drawTray();
    pop(it); sparkle(it); chime(); say('room.kept'); return it;
  }
  function putAway(it) {
    state.items = state.items.filter(i => i !== it); save(); select(null); paint(); drawTray(); whoosh();
  }

  /* selected thing: turn it around or put it away */
  function select(it) {
    if (sel && els.get(sel)) els.get(sel).classList.remove('sel');
    sel = it; tools.hidden = !it;
    if (!it) return;
    els.get(it).classList.add('sel'); placeTools();
  }
  function placeTools() {
    if (!sel) return; const el = els.get(sel), r = { l: parseFloat(el.style.left), t: parseFloat(el.style.top), w: parseFloat(el.style.width) };
    tools.style.left = (r.l + r.w / 2) + 'px'; tools.style.top = Math.max(108, r.t - 8) + 'px';
  }
  tools.addEventListener('click', e => {
    const b = e.target.closest('[data-t]'); if (!b || !sel) return;
    if (b.dataset.t === 'flip') { sel.f = !sel.f; save(); place(sel, els.get(sel)); pop(sel); }
    else putAway(sel);
  });

  /* ---------- dragging (stage px from the pointer; the stage is scaled to the window) ---------- */
  function toStage(e) { const r = layer.getBoundingClientRect(), s = r.width / 1180; return [(e.clientX - r.left) / s, (e.clientY - r.top) / s]; }
  let drag = null;   // {it, el, dx, dy, sx, sy, moved, fresh}
  function overBin(e) { if (bin.hidden) return false; const r = bin.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; }
  function startDrag(e, it, fresh) {
    const el = els.get(it), [px, py] = toStage(e);
    const K = KINDS[INFO[it.id].kind];
    /* keep the grab point under the finger; a new thing is held by its feet / middle */
    drag = { it, el, dx: fresh ? 0 : it.x - px, dy: fresh ? (K.zone === 'floor' ? 40 : 0) : it.y - py, sx: e.clientX, sy: e.clientY, moved: !!fresh, fresh };
    el.classList.add('lift'); select(null);
    nook.classList.add('dragging'); bin.hidden = false;
    try { e.target.setPointerCapture && e.target.setPointerCapture(e.pointerId); } catch (er) {}
  }
  function moveDrag(e) {
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 8) return;
    drag.moved = true; e.preventDefault();
    const [px, py] = toStage(e), [x, y] = clampPos(drag.it.id, px + drag.dx, py + drag.dy);
    drag.it.x = x; drag.it.y = y; place(drag.it, drag.el);
    bin.classList.toggle('hot', overBin(e));
  }
  function endDrag(e) {
    if (!drag) return; const d = drag; drag = null;
    d.el.classList.remove('lift'); nook.classList.remove('dragging'); bin.hidden = true; bin.classList.remove('hot');
    if (d.moved && overBin(e)) return putAway(d.it);
    save();
    if (!d.moved) { select(sel === d.it ? null : d.it); say('room.spot'); return; }
    paint(); pop(d.it); thud(); if (d.fresh) { sparkle(d.it); chime(); say('room.kept'); tucked = true; drawTray(); }
  }
  layer.addEventListener('pointerdown', e => {
    if (!editing) return; const el = e.target.closest('.rd'); if (!el) return;
    e.preventDefault(); startDrag(e, el._it, false);
  });
  /* a card: tap = choose (and put an owned thing in the room); drag = carry it into the room */
  let cardDown = null;
  tray.addEventListener('pointerdown', e => { const c = e.target.closest('.rt-card'); if (c) cardDown = { id: c.dataset.id, x: e.clientX, y: e.clientY, e }; });
  addEventListener('pointermove', e => {
    if (cardDown && !drag && Math.hypot(e.clientX - cardDown.x, e.clientY - cardDown.y) > 12) {
      const id = cardDown.id; cardDown = null;
      if (!owned(id) || count(id) >= MAX(id)) return;
      const [px, py] = toStage(e), [x, y] = clampPos(id, px, py + (KINDS[INFO[id].kind].zone === 'floor' ? 40 : 0));
      const it = { id, x, y }; state.items.push(it); paint(); startDrag(e, it, true);
    }
    moveDrag(e);
  }, { passive: false });
  addEventListener('pointerup', e => { cardDown = null; endDrag(e); });
  addEventListener('pointercancel', e => { cardDown = null; endDrag(e); });

  tray.addEventListener('click', e => {
    const t = e.target.closest('[data-tab]'); if (t) { tab = t.dataset.tab; pick = null; tucked = false; drawTray(); say('room.spot'); return; }
    if (e.target.closest('[data-tuck]')) { tucked = !tucked; drawTray(); return; }
    const c = e.target.closest('.rt-card');
    if (c) {
      const id = c.dataset.id; pick = id;
      if (owned(id)) {
        if (count(id) < MAX(id)) add(id);
        else { const it = state.items.find(i => i.id === id); select(it); pop(it); drawTray(); }
      } else drawTray();
      return;
    }
    const a = e.target.closest('[data-do="buy"]'); if (!a || !pick) return;
    const p = INFO[pick];
    if (!window.CLWardrobe || !CLWardrobe.spend(p.price)) { say('room.need', { need: p.price - left() }); return; }
    state.owned.push(pick); save(); add(pick);
  });

  /* little effects */
  function pop(it) { const el = els.get(it); if (RM || !el) return; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
  function sparkle(it) {
    if (RM) return; const el = els.get(it), app = document.getElementById('app'); if (!el) return;
    const cx = parseFloat(el.style.left) + parseFloat(el.style.width) / 2, cy = parseFloat(el.style.top) + parseFloat(el.style.height) / 2;
    for (let i = 0; i < 14; i++) { const sp = document.createElement('span'); sp.className = 'spark'; const a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 80;
      sp.style.left = cx + 'px'; sp.style.top = cy + 'px'; sp.style.setProperty('--dx', Math.cos(a) * d + 'px'); sp.style.setProperty('--dy', Math.sin(a) * d + 'px'); app.appendChild(sp); setTimeout(() => sp.remove(), 950); }
  }
  function tone(list, type, vol, len) {
    try { if (localStorage.getItem('cl.muted') === '1') return; const ac = tone.ac = tone.ac || new (window.AudioContext || window.webkitAudioContext)();
      list.forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + i * .07; o.type = type; o.frequency.value = f; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + len); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + len + .05); });
    } catch (e) {}
  }
  const chime = () => tone([659, 784, 988, 1319], 'sine', .12, .35);
  const thud = () => tone([196, 147], 'triangle', .16, .12);
  const whoosh = () => tone([880, 660, 440], 'sine', .08, .15);

  /* leaving My Library ends decorating */
  new MutationObserver(() => { if (editing && !nook.classList.contains('on')) setMode(false); }).observe(nook, { attributes: true, attributeFilter: ['class'] });
  window.CLRoom = { reset() { state = copy(START); save(); paint(); if (editing) drawTray(); }, reload() { state = load(); paint(); }, KINDS, ITEMS, get state() { return state; } };
})();
