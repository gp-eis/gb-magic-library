/* My Library 꾸미기: the child decorates their own reading room (My Library) with stars.
   Seven fixed spots (rug, seat, lamp, plant & pet corner, ceiling, two wall pictures), four items each; the first item of
   each spot is free. Same star wallet as the Magic Wardrobe (window.CLWardrobe.spend/left).
   Saved per child in localStorage 'cl.room' = {owned:[item ids], place:{spot: item id or ''}} (swapped by profiles.js).
   Art: art/my-room.webp (the room with the decoratable things removed) and art/deco/<spot>-<n>.webp
   (made in ChatGPT, cut by design/tools/cut_deco.py). Positions are on the 1180 x 820 stage. */
(function () {
  const nook = document.getElementById('nook');
  if (!nook) return;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* where each spot sits in the room: the item box (left, top, width, height) and the marker for decorating mode.
     The room picture has an empty wall between the second bookcase and the window for the two wall pictures. */
  const SPOTS = {
    ceiling: { name: 'Ceiling', ko: '천장', icon: '🌟', box: [800, -6, 230, 190], mark: [915, 130], fit: 'top' },
    wall1: { name: 'Wall picture', ko: '벽 그림', icon: '🖼️', box: [780, 240, 100, 140], mark: [830, 310], fit: 'fit', items: 'wall' },
    wall2: { name: 'Wall picture', ko: '벽 그림', icon: '🖼️', box: [898, 240, 100, 140], mark: [948, 310], fit: 'fit', items: 'wall' },
    lamp: { name: 'Lamp', ko: '램프', icon: '💡', box: [658, 446, 118, 170], mark: [717, 530], fit: 'bottom', ground: true },
    plant: { name: 'Plant & pet', ko: '화분과 친구', icon: '🪴', box: [250, 492, 150, 150], mark: [325, 565], fit: 'bottom', ground: true },   // on the floor in front of the pillar
    rug: { name: 'Rug', ko: '러그', icon: '🟢', box: [320, 640, 480, 150], mark: [560, 715], fit: 'fill', ground: true },   // squashed to the room's low floor perspective
    seat: { name: 'Seat', ko: '의자', icon: '🛋️', box: [26, 620, 180, 180], mark: [116, 710], fit: 'bottom', ground: true }
  };
  /* the free empty frame shows the child's own book page (from My Library's pages, see index.html fillFrames) */
  const PAGE_FRAME = 'walls-1', PAGE_INSET = [16, 16.5, 22, 12.5];   // % in from left, right, top, bottom
  const ITEMS = {
    rug: [['rugs-1', 'Star rug', '별 러그', 0], ['rugs-2', 'Rainbow rug', '무지개 러그', 8], ['rugs-3', 'Ocean rug', '바다 러그', 10], ['rugs-4', 'Flower rug', '꽃 러그', 12]],
    seat: [['seats-1', 'Velvet pouf', '벨벳 푸프', 0], ['seats-2', 'Beanbag', '빈백', 10], ['seats-3', 'Blue armchair', '파란 안락의자', 15], ['seats-4', 'Storybook chair', '동화책 의자', 20]],
    lamp: [['lamps-1', 'Table lamp', '탁자 램프', 0], ['lamps-2', 'Mushroom lamp', '버섯 램프', 8], ['lamps-3', 'Moon lamp', '달 램프', 12], ['lamps-4', 'Lighthouse lamp', '등대 램프', 15]],
    plant: [['plants-1', 'Plant & books', '화분과 책', 0], ['plants-2', 'Sleepy kitten', '잠자는 고양이', 12], ['plants-3', 'Fish bowl', '어항', 10], ['plants-4', 'Sunflower', '해바라기', 8]],
    ceiling: [['ceiling-1', 'Star garland', '별 가랜드', 0], ['ceiling-2', 'Moon mobile', '달 모빌', 10], ['ceiling-3', 'Paper lanterns', '종이 등', 12], ['ceiling-4', 'Hot-air balloon', '열기구', 15]],
    wall: [['walls-1', 'My book page', '내가 만든 그림', 0], ['walls-2', 'Castle painting', '성 그림', 8], ['walls-3', 'World map', '세계 지도', 10], ['walls-4', 'Rainbow painting', '무지개 그림', 8]]
  };
  const listOf = spot => ITEMS[SPOTS[spot].items || spot];
  const START = { owned: ['rugs-1', 'seats-1', 'lamps-1', 'plants-1', 'ceiling-1', 'walls-1'], place: { rug: 'rugs-1', seat: 'seats-1', lamp: 'lamps-1', plant: 'plants-1', ceiling: '', wall1: 'walls-1', wall2: 'walls-1' } };
  const src = id => `art/deco/${id}.webp`;
  const itemOf = (spot, id) => listOf(spot).find(i => i[0] === id);

  function load() {
    try { const s = JSON.parse(localStorage.getItem('cl.room')); if (s && s.place) { const d = JSON.parse(JSON.stringify(START)); return { owned: [...new Set(d.owned.concat(s.owned || []))], place: Object.assign(d.place, s.place) }; } } catch (e) {}
    return JSON.parse(JSON.stringify(START));
  }
  let state = load();
  const save = () => { try { localStorage.setItem('cl.room', JSON.stringify(state)); } catch (e) {} };
  const owned = id => !id || state.owned.includes(id) || (ITEMS_PRICE[id] || 0) === 0;
  const ITEMS_PRICE = {}; Object.values(ITEMS).forEach(list => list.forEach(i => { ITEMS_PRICE[i[0]] = i[3]; }));
  const left = () => (window.CLWardrobe && CLWardrobe.left ? CLWardrobe.left() : 0);
  const say = (m, v) => { const b = document.getElementById('nookBubble'); if (b && window.CLLines) b.textContent = CLLines.text(m, v); };

  /* ---------- the room ---------- */
  const bg = nook.querySelector('.bg'); if (bg) bg.src = 'art/my-room.webp';
  const layer = document.createElement('div'); layer.className = 'room-deco';
  const [il, ir, it, ib] = PAGE_INSET;
  layer.innerHTML = Object.entries(SPOTS).map(([k, s]) => `<div class="rd rd-${k} fit-${s.fit}${s.ground ? ' ground' : ''}" data-spot="${k}" style="left:${s.box[0]}px;top:${s.box[1]}px;width:${s.box[2]}px;height:${s.box[3]}px"><img alt="">`
    + (s.items === 'wall' ? `<span class="rd-page" style="left:${il}%;right:${ir}%;top:${it}%;bottom:${ib}%"><img alt=""><i>✏️</i></span>` : '') + `</div>`).join('');
  bg.after(layer);
  /* the child's own pages: index.html puts them into the hidden .artframe boxes; the wall frames show them in order */
  let pages = [];
  let trying = null;   // the item being tried on, kept when the room redraws for new pages
  function readPages() { pages = [...nook.querySelectorAll('.artframe img.real')].map(i => i.src); paint(trying); }
  new MutationObserver(readPages).observe(nook, { childList: true, subtree: true });
  function paint(preview) {
    trying = preview || null;
    let n = 0;
    Object.keys(SPOTS).forEach(k => {
      const id = preview && preview.spot === k ? preview.id : state.place[k];
      const el = layer.querySelector(`[data-spot="${k}"]`), im = el.querySelector('img');
      el.classList.toggle('empty', !id);
      if (id) { if (im.getAttribute('src') !== src(id)) im.src = src(id); } else im.removeAttribute('src');
      const page = el.querySelector('.rd-page');
      if (page) {
        const mine = id === PAGE_FRAME, p = mine ? pages[n++] : null, pi = page.querySelector('img');
        page.hidden = !mine; page.classList.toggle('blank', mine && !p);
        if (p) { if (pi.getAttribute('src') !== p) pi.src = p; } else pi.removeAttribute('src');
      }
    });
  }
  paint();

  /* ---------- decorating mode ---------- */
  const marks = document.createElement('div'); marks.className = 'room-marks'; marks.hidden = true;
  marks.innerHTML = Object.entries(SPOTS).map(([k, s]) => `<button type="button" class="rm" data-spot="${k}" style="left:${s.mark[0]}px;top:${s.mark[1]}px" aria-label="${s.name}"><span>${s.icon}</span></button>`).join('');
  nook.appendChild(marks);
  const tray = document.createElement('div'); tray.className = 'room-tray'; tray.hidden = true; nook.appendChild(tray);
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'clb clb--place room-btn'; btn.innerHTML = '<span class="i">🎨</span>꾸미기';
  btn.setAttribute('aria-label', 'Decorate My Library');
  const right = nook.querySelector('.clright'); if (right) right.prepend(btn);

  let editing = false, spot = null, pick = null;
  function setMode(on) {
    editing = on; marks.hidden = !on; nook.classList.toggle('decorating', on);
    btn.innerHTML = on ? '<span class="i">✓</span>Done' : '<span class="i">🎨</span>꾸미기';
    btn.classList.toggle('clb--done', on); btn.classList.toggle('clb--place', !on);
    if (!on) { closeTray(); say('room.done'); } else say('room.open');
  }
  btn.addEventListener('click', () => setMode(!editing));

  function openTray(k) {
    spot = k; pick = state.place[k];
    marks.querySelectorAll('.rm').forEach(m => m.classList.toggle('sel', m.dataset.spot === k));
    tray.classList.toggle('top', SPOTS[k].mark[1] > 420);
    drawTray(); tray.hidden = false; requestAnimationFrame(() => tray.classList.add('on'));
    say('room.spot');
  }
  function closeTray() { spot = null; pick = null; paint(); tray.classList.remove('on'); setTimeout(() => { if (!spot) tray.hidden = true; }, 220); marks.querySelectorAll('.rm').forEach(m => m.classList.remove('sel')); }
  function drawTray() {
    const S = SPOTS[spot], list = listOf(spot), cur = state.place[spot];
    const none = [['', 'Nothing', '비우기', 0]];
    const cards = none.concat(list).map(([id, name, ko, price]) => {
      const using = id === cur, mine = owned(id);
      const tag = using ? 'Using' : mine ? (price ? 'Mine ✓' : 'Free') : '⭐ ' + price;
      const pic = id ? `<img src="${src(id)}" alt="">` : '<span class="blank">✕</span>';
      return `<button type="button" class="rt-card ${using ? 'using' : ''} ${pick === id ? 'sel' : ''} ${mine ? 'mine' : ''}" data-id="${id}"><span class="rt-tag">${tag}</span><span class="rt-pic">${pic}</span><b>${esc(name)}</b><small>${ko}</small></button>`;
    }).join('');
    const p = itemOf(spot, pick) || ['', 'Nothing', '', 0];
    let act;
    if (pick === cur) act = `<button class="clb clb--lg" type="button" disabled>✓ In your room</button>`;
    else if (owned(pick)) act = `<button class="clb clb--done clb--lg clb--pulse" type="button" data-do="keep"><span class="i">✓</span>Keep it</button>`;
    else if (left() >= p[3]) act = `<button class="clb clb--go clb--lg clb--pulse" type="button" data-do="buy">Get it for <span class="i">⭐</span>${p[3]}</button>`;
    else act = `<button class="clb clb--go clb--lg" type="button" disabled>⭐ ${p[3]}</button><span class="rt-hint">${p[3] - left()} more ⭐ needed</span>`;
    tray.innerHTML = `<div class="rt-head"><b>${S.icon} ${S.name}</b><span>${S.ko}</span><span class="clchip">⭐ ${left()}</span><button class="clb clb--icon clb--sm" type="button" data-close aria-label="Close">✕</button></div>
      <div class="rt-cards">${cards}</div><div class="rt-act">${act}</div>`;
  }
  marks.addEventListener('click', e => { const m = e.target.closest('[data-spot]'); if (m) openTray(m.dataset.spot); });
  tray.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) return closeTray();
    const c = e.target.closest('.rt-card');
    if (c) { pick = c.dataset.id; paint({ spot, id: pick }); drawTray(); pop(spot); return; }
    const a = e.target.closest('[data-do]'); if (!a) return;
    const p = itemOf(spot, pick);
    if (a.dataset.do === 'buy') {
      if (!window.CLWardrobe || !CLWardrobe.spend(p[3])) { say('room.need', { need: p[3] - left() }); return; }
      state.owned.push(pick);
    }
    state.place[spot] = pick; save(); paint(); drawTray(); chime(); pop(spot); sparkle(spot);
    say('room.kept');
  });

  /* little effects */
  function pop(k) { if (RM) return; const el = layer.querySelector(`[data-spot="${k}"]`); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
  function sparkle(k) {
    if (RM) return; const s = SPOTS[k], app = document.getElementById('app');
    for (let i = 0; i < 14; i++) { const sp = document.createElement('span'); sp.className = 'spark'; const a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 80;
      sp.style.left = s.mark[0] + 'px'; sp.style.top = s.mark[1] + 'px'; sp.style.setProperty('--dx', Math.cos(a) * d + 'px'); sp.style.setProperty('--dy', Math.sin(a) * d + 'px'); app.appendChild(sp); setTimeout(() => sp.remove(), 950); }
  }
  function chime() {
    try { if (localStorage.getItem('cl.muted') === '1') return; const ac = chime.ac = chime.ac || new (window.AudioContext || window.webkitAudioContext)();
      [659, 784, 988, 1319].forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + i * .07; o.frequency.value = f; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.12, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .35); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + .4); });
    } catch (e) {}
  }

  /* leaving My Library ends decorating */
  new MutationObserver(() => { if (editing && !nook.classList.contains('on')) setMode(false); }).observe(nook, { attributes: true, attributeFilter: ['class'] });
  window.CLRoom = { reset() { state = JSON.parse(JSON.stringify(START)); save(); paint(); }, SPOTS, ITEMS };
})();
