/* The Library Tower: My Library grows one floor every month (12 books each, up to 144 a year).
   Outside view: ground floor = My Room (decorated, ui/room.js), one floor per imported month (app/months/catalog.js),
   the next month's floor as "coming soon", and the roof = Hall of Certificates.
   A month floor: that month's 12 books on three bookcases (Level A, B, C) with each child's progress
   (localStorage cl.bk.<id>.<step>, five steps per book). An elevator on the side moves between floors.
   Art: art/tower/{roof,floor,base}.webp (stackable ChatGPT parts) and art/floor-room.webp (tower room, same
   three bookcases as the hall). Stage 1180 x 820. */
(function () {
  const app = document.getElementById('app');
  const C = window.CLMonths;
  if (!app || !C) return;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const MONTHS = Object.values(C.months).sort((a, b) => a.no - b.no);
  const STEPS = ['read', 'question', 'think', 'express', 'create'];
  const LEVELS = ['A', 'B', 'C'];
  const LEVEL_ICON = { A: '✦', B: '☾', C: '★' };
  /* where books stand on the floor room's three bookcases (stage coordinates, measured on art/floor-room.webp) */
  const CASES = { A: { x: 112, w: 238, ledges: [412, 500] }, B: { x: 459, w: 258, ledges: [415, 502] }, C: { x: 826, w: 248, ledges: [412, 500] } };
  const say = (m, v) => (window.CLLines ? CLLines.text(m, v) : '');

  function stepsDone(id) { let n = 0; try { STEPS.forEach(s => { if (localStorage.getItem('cl.bk.' + id + '.' + s) === '1') n++; }); } catch (e) {} return n; }
  /* the hand-made Sugar Bugs book keeps its own progress keys */
  function bookDone(b) {
    if (b.custom === 'sugar-bugs' && window.clProgress && window.clRealKey) return (window.clProgress()[window.clRealKey] || 0);
    return stepsDone(b.id);
  }
  function monthStats(m) {
    let done = 0, started = 0;
    LEVELS.forEach(L => (m.levels[L] || []).forEach(b => { const n = bookDone(b); if (n >= 5) done++; else if (n > 0) started++; }));
    return { done, started };
  }

  /* ---------- outside: the tower ---------- */
  const tower = document.createElement('section');
  tower.className = 'tw-scene'; tower.hidden = true; tower.setAttribute('aria-label', 'Library Tower');
  tower.innerHTML = `<div class="tw-sky"></div>
    <div class="clbar tw-bar"><button class="clb" type="button" data-tw="close"><span class="i">←</span>My Library</button>
      <div class="clmid"><span class="tw-title">Library Tower <small>나의 도서관 탑</small></span></div><div class="clright"><span class="clchip tw-count"></span></div></div>
    <div class="tw-scroll"><div class="tw-stack" id="twStack"></div></div>
    <div class="tw-help">Tap a floor to visit · 층을 눌러 보세요</div>
    <button type="button" class="clb tw-zoom" data-tw="zoom"><span class="i">🔭</span>Whole tower</button>
    <div class="tw-mate"><img alt=""></div><div class="bubble tw-mate-say" id="twMateSay"></div>`;
  app.appendChild(tower);

  function drawTower() {
    const live = C.live, next = Math.max(...MONTHS.map(m => m.no)) + 1;
    let total = 0;
    const floors = MONTHS.map(m => {
      const s = monthStats(m); total += s.done;
      const lit = s.done + s.started > 0;
      return `<button type="button" class="tw-part tw-floor ${lit ? 'lit' : ''} ${m.no === live ? 'now' : ''}" data-floor="${m.no}" aria-label="${m.ko} floor, ${s.done} of 12 books finished">
        <img src="art/tower/floor-body.webp" alt=""><span class="tw-plate"><b>${esc(m.ko)}</b><small>${s.done}/12</small></span>${m.no === live ? '<span class="tw-new">NEW</span>' : ''}</button>`;
    }).reverse().join('');
    tower.querySelector('#twStack').innerHTML =
      `<button type="button" class="tw-part tw-roof" data-tw="certs" aria-label="Hall of Certificates"><img src="art/tower/roof.webp" alt=""><span class="tw-plate gold"><b>🏅</b><small>Certificates</small></span></button>`
      + `<div class="tw-part tw-floor ghost" aria-label="${next}월 floor, coming soon"><img src="art/tower/floor-body.webp" alt=""><span class="tw-plate"><b>${next > 12 ? next - 12 : next}월</b><small>coming soon</small></span></div>`
      + floors
      + `<button type="button" class="tw-part tw-base" data-tw="room" aria-label="My Room"><img src="art/tower/base-body.webp" alt=""><span class="tw-plate"><b>1F</b><small>My Room</small></span></button>`;
    // each part sits in front of the one below it, so its gold rim covers the join (one band per floor)
    [...tower.querySelector('#twStack').children].forEach((el, i) => { el.style.zIndex = 50 - i; });
    tower.querySelector('.tw-count').textContent = `📚 ${total} / ${MONTHS.length * 12}`;
  }

  /* ---------- a month floor ---------- */
  const floor = document.createElement('section');
  floor.className = 'tw-scene tw-room'; floor.hidden = true;
  floor.innerHTML = `<img class="bg" src="art/floor-room.webp" alt="">
    <div class="clbar tw-bar"><button class="clb" type="button" data-tw="tower"><span class="i">←</span>Tower</button>
      <div class="clmid"><span class="tw-title" id="twFloorTitle"></span></div><div class="clright"><span class="clchip" id="twFloorCount"></span></div></div>
    <div id="twBooks"></div>
    <nav class="tw-lift" id="twLift" aria-label="Elevator"></nav>
    <div class="bubble tw-bubble" id="twBubble"></div>`;
  app.appendChild(floor);
  let shown = null;

  function drawFloor(no) {
    const m = C.months[no]; if (!m) return;
    shown = no;
    const s = monthStats(m);
    floor.querySelector('#twFloorTitle').innerHTML = `${esc(m.ko)} · ${esc(m.label)} <small>${s.done}/12</small>`;
    floor.querySelector('#twFloorCount').textContent = `⭐ ${s.done} finished`;
    const live = no === C.live;
    floor.querySelector('#twBooks').innerHTML = LEVELS.map(L => {
      const c = CASES[L], pad = (c.w - 2 * 110 - 14) / 2;
      return `<span class="lvlpill tw-lv" style="left:${c.x + c.w / 2}px;top:300px">${LEVEL_ICON[L]} Level ${L}</span>` + (m.levels[L] || []).map((b, i) => {
        const n = bookDone(b), st = n >= 5 ? 'done' : n > 0 ? 'part' : 'wait';
        const tag = st === 'done' ? '<span class="seal">★</span>' : st === 'part' ? `<span class="count">${n}/5</span>` : '';
        return `<button type="button" class="tw-book ${st} ${live ? 'live' : ''}" data-l="${L}" data-i="${i}" style="left:${c.x + pad + (i % 2) * 124}px;top:${c.ledges[i < 2 ? 0 : 1] - 64}px" aria-label="Level ${L}, week ${b.week}: ${esc(b.title)}">
          <img src="${b.cover}" alt="">${tag}</button>`;
      }).join('');
    }).join('');
    drawLift();
    const b = floor.querySelector('#twBubble');
    b.textContent = s.done === 12 ? 'Every book on this floor is finished! Wow!' : s.done + s.started === 0 ? `Welcome to the ${m.ko} floor! Its books are waiting for you.` : `${s.done} of 12 books finished on this floor. Keep going!`;
  }
  function drawLift() {
    const btns = [`<button type="button" data-tw="certs" class="top">🏅</button>`]
      .concat(MONTHS.slice().reverse().map(m => `<button type="button" data-floor="${m.no}" class="${m.no === shown ? 'here' : ''} ${m.no === C.live ? 'now' : ''}">${esc(m.ko)}</button>`))
      .concat([`<button type="button" data-tw="room">1F</button>`]);
    floor.querySelector('#twLift').innerHTML = `<span class="tw-lift-lab">🛗</span>` + btns.join('');
  }

  /* ---------- moving around ---------- */
  function open(el) { el.hidden = false; requestAnimationFrame(() => el.classList.add('on')); }
  function shut(el) { el.classList.remove('on'); setTimeout(() => { if (!el.classList.contains('on')) el.hidden = true; }, 300); }
  /* open at the newest floor, with My Mate pointing it out */
  function showNewest() {
    const sc = tower.querySelector('.tw-scroll'), now = tower.querySelector('.tw-floor.now') || tower.querySelector('.tw-base');
    // layout positions are not changed by the zoom animation, so this is right even while the tower grows back
    sc.scrollTop = now.offsetTop + now.offsetHeight / 2 - sc.clientHeight / 2;
  }
  function mateSays() {
    const m = C.months[C.live], img = tower.querySelector('.tw-mate img');
    if (window.CLMate) img.src = CLMate.src('idle');
    tower.querySelector('#twMateSay').textContent = m ? `Look! The ${m.ko} floor is the newest. Tap it!` : 'Tap a floor to visit!';
  }
  /* zoom out to see the whole tower at once, and back */
  function setZoom(on) {
    const sc = tower.querySelector('.tw-scroll'), st = tower.querySelector('#twStack');
    tower.classList.toggle('zoomed', on);
    if (on) {
      st.style.transform = ''; const k = Math.min(1, (sc.clientHeight - 10) / st.scrollHeight);
      st.style.transform = `scale(${k})`; sc.scrollTop = sc.scrollHeight;   // the tower shrinks toward its base, at the bottom
      tower.querySelector('.tw-zoom').innerHTML = '<span class="i">🔍</span>Back to my floor';
    } else {
      st.style.transform = ''; tower.querySelector('.tw-zoom').innerHTML = '<span class="i">🔭</span>Whole tower';
      setTimeout(showNewest, 60);   // a timer, not an animation frame: it also runs while the tab is in the background
    }
  }
  function openTower() { drawTower(); mateSays(); open(tower); shut(floor); setZoom(false); }
  function openFloor(no) {
    if (!RM && !floor.hidden) { floor.classList.add('ride'); setTimeout(() => floor.classList.remove('ride'), 600); }
    drawFloor(no); open(floor); shut(tower);
  }
  function closeAll() { shut(tower); shut(floor); }
  function act(t) {
    const tw = t.closest('[data-tw]'), fl = t.closest('[data-floor]');
    if (fl) return openFloor(+fl.dataset.floor);
    if (!tw) return;
    const what = tw.dataset.tw;
    if (what === 'close' || what === 'room') { closeAll(); if (window.clShowNook) window.clShowNook(); }
    else if (what === 'tower') openTower();
    else if (what === 'zoom') setZoom(!tower.classList.contains('zoomed'));
    else if (what === 'certs') { closeAll(); if (window.CLCerts) CLCerts.openRoom(); }
  }
  tower.addEventListener('click', e => {
    if (tower.classList.contains('zoomed') && e.target.closest('[data-floor],[data-tw="room"],[data-tw="certs"]')) { setZoom(false); }
    act(e.target);
  });
  floor.addEventListener('click', e => {
    const bk = e.target.closest('.tw-book');
    if (!bk) return act(e.target);
    if (!bk.classList.contains('live')) { floor.querySelector('#twBubble').textContent = 'This book is from an earlier month. Reading it again is coming soon!'; return; }
    shut(floor);
    if (window.clOpenBook) window.clOpenBook(bk, bk.dataset.l, +bk.dataset.i);
  });

  window.CLTower = { openTower, openFloor, reopen() { if (shown) openFloor(shown); else openTower(); } };
})();
