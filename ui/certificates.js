/* Monthly reading certificates (benchmark idea from Milk T).
   A child earns the month's certificate by finishing all four books of a level that month; every other level they
   finish adds that level's ribbon to the same certificate. Saved per child in localStorage 'cl.certs' =
   {"<monthNo>": {levels:['B'], at: ISO date}} (swapped with the other per-child keys by profiles.js).
   - CLCerts.draw(canvas, monthNo): the certificate itself, drawn on a canvas (used on the wall, in the ceremony,
     and for saving / printing in the parent area).
   - The hall shows this month's seals; the Hall of Certificates room (art/certificate-room.webp) holds 12 frames.
   The library calls CLCerts.check() after any book is finished. Needs window.clProgress (library page). */
(function () {
  const D = window.CLParentData;
  const MONTH = (window.CLMonth && window.CLMonth.no) || (D && D.program.monthNo) || 8;
  const REAL = 'B3';
  const LEVELS = ['A', 'B', 'C'];
  const LEVEL_COLOR = { A: '#ff8a5c', B: '#5b3fa8', C: '#20b486' };
  const COVERS = [1, 2, 3, 4].map(n => `assets/month8-week${n}.webp`);
  const TITLES = ['Hello! Hello!', 'Where Is Your Home?', 'Why Do We Wait?', 'Bye-Bye Sugar Bugs!'];
  const STEPS = ['READ', 'QUESTION', 'THINK', 'EXPRESS', 'CREATE'];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- saved certificates ---------- */
  const load = () => { try { return JSON.parse(localStorage.getItem('cl.certs')) || {}; } catch (e) { return {}; } };
  const save = c => { try { localStorage.setItem('cl.certs', JSON.stringify(c)); } catch (e) {} };
  const child = () => (window.CLProfiles ? window.CLProfiles.active() : { name: 'Anna', avatar: 'ria' });
  function booksDone(level) {
    const p = window.clProgress ? window.clProgress() : {};
    return [0, 1, 2, 3].filter(i => (p[level + i] || 0) >= 5).length;
  }

  /* ---------- drawing the certificate ---------- */
  const imgCache = {};
  const img = src => imgCache[src] || (imgCache[src] = new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }));
  async function fonts() {
    if (!document.fonts) return;
    await Promise.all(['700 70px Fraunces', '700 60px Fredoka', '600 30px Fredoka', '700 28px "Noto Sans KR"', '600 24px Sora', '700 26px Nunito', 'italic 600 26px Nunito'].map(f => document.fonts.load(f).catch(() => {})));
  }
  function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function star(c, x, y, r, color) {
    c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    c.closePath(); c.fillStyle = color; c.fill();
  }
  function circleImg(c, im, x, y, r, sx, sy, sw, sh) {
    c.save(); c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.closePath(); c.fillStyle = '#fff'; c.fill(); c.clip();
    if (im) c.drawImage(im, sx ?? 0, sy ?? 0, sw ?? im.width, sh ?? im.height, x - r, y - r, r * 2, r * 2);
    c.restore(); c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.lineWidth = 5; c.strokeStyle = '#BB8520'; c.stroke();
  }
  function seal(c, x, y, r) {
    const g = c.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r); g.addColorStop(0, '#ffe58f'); g.addColorStop(1, '#c98a12');
    c.beginPath(); for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, rr = i % 2 ? r * .9 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    c.closePath(); c.fillStyle = g; c.fill();
    c.beginPath(); c.arc(x, y, r * .72, 0, Math.PI * 2); c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,.7)'; c.stroke();
  }
  /* W = 1414 x 1000 (A4 landscape) */
  async function draw(canvas, monthNo) {
    const cert = load()[monthNo]; if (!cert) return false;
    const me = child(), W = 1414, H = 1000;
    canvas.width = W; canvas.height = H;
    const c = canvas.getContext('2d');
    await fonts();
    let wearing = 'wizard'; try { wearing = JSON.parse(localStorage.getItem('cl.wardrobe')).wearing || wearing; } catch (e) {}
    const lv0 = cert.levels.slice().sort()[0];
    const bks = [0, 1, 2, 3].map(i => window.clBook ? window.clBook(lv0, i) : { c: COVERS[i], t: TITLES[i] });
    const [face, mate, ...covers] = await Promise.all([img(`assets/avatars/face-${me.avatar}.webp`), img(!window.CLMate || CLMate.current().id === 'gerry' ? `art/outfits/${wearing}/gerry-idle.webp` : `assets/avatars/face-${CLMate.current().id}.webp`), ...bks.map(b => img(b.c))]);

    // paper and frame
    const bg = c.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 800); bg.addColorStop(0, '#fffdf6'); bg.addColorStop(1, '#f5e6c4');
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    c.lineWidth = 14; c.strokeStyle = '#0B2644'; c.strokeRect(22, 22, W - 44, H - 44);
    c.lineWidth = 3; c.strokeStyle = '#BB8520'; c.strokeRect(46, 46, W - 92, H - 92);
    c.lineWidth = 1.5; c.strokeRect(56, 56, W - 112, H - 112);
    [[70, 70], [W - 70, 70], [70, H - 70], [W - 70, H - 70]].forEach(([x, y]) => star(c, x, y, 22, '#BB8520'));
    for (let i = 0; i < 26; i++) star(c, 90 + Math.random() * (W - 180), 90 + Math.random() * (H - 180), 3 + Math.random() * 4, 'rgba(187,133,32,.18)');

    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillStyle = '#BB8520'; c.font = '600 24px Sora'; c.fillText('G B   M A G I C   L I B R A R Y', W / 2, 122);
    c.fillStyle = '#0B2644'; c.font = '700 74px Fraunces'; c.fillText('Certificate of Reading', W / 2, 206);
    c.fillStyle = '#5b4a2a'; c.font = '700 28px "Noto Sans KR"'; c.fillText(`${monthNo}월 독서 인증서`, W / 2, 252);

    c.fillStyle = '#6b6050'; c.font = 'italic 600 26px Nunito'; c.fillText('This certificate is proudly presented to', W / 2, 314);
    c.font = '700 84px Fredoka'; const nw = c.measureText(me.name).width;
    c.fillStyle = '#2a2340'; c.fillText(me.name, W / 2 + 50, 410);
    circleImg(c, face, W / 2 + 50 - nw / 2 - 72, 382, 54);
    c.strokeStyle = '#BB8520'; c.lineWidth = 3; c.beginPath(); c.moveTo(W / 2 - 330, 436); c.lineTo(W / 2 + 330, 436); c.stroke();

    const lv = cert.levels.slice().sort();
    c.fillStyle = '#3b3552'; c.font = '700 27px Nunito';
    c.fillText(`for reading all four books of Month ${monthNo} and sharing big ideas!`, W / 2, 486);
    c.fillStyle = '#5b4a2a'; c.font = '600 24px "Noto Sans KR"'; c.fillText(`이번 달의 동화 4권을 모두 읽고, 묻고, 생각하고, 표현했어요.`, W / 2, 524);

    // the four books, each with a gold seal
    const bw = 214, bh = 120, gap = 34, x0 = (W - (bw * 4 + gap * 3)) / 2, by = 560;
    covers.forEach((im, i) => {
      const x = x0 + i * (bw + gap);
      c.save(); c.shadowColor = 'rgba(40,30,10,.25)'; c.shadowBlur = 14; c.shadowOffsetY = 6; roundRect(c, x, by, bw, bh, 12); c.fillStyle = '#fff'; c.fill(); c.restore();
      c.save(); roundRect(c, x, by, bw, bh, 12); c.clip(); if (im) c.drawImage(im, x, by, bw, bh); c.restore();
      seal(c, x + bw - 10, by + 8, 26); c.fillStyle = '#fff'; c.font = '700 26px Fredoka'; c.fillText('✓', x + bw - 10, by + 18);
      c.fillStyle = '#3b3552'; c.font = '600 18px Fredoka'; c.fillText(bks[i].t, x + bw / 2, by + bh + 28);
    });

    // levels finished and the five steps
    let lx = W / 2 - (lv.length * 150 + (lv.length - 1) * 14) / 2;
    lv.forEach(l => { roundRect(c, lx, 742, 150, 44, 22); c.fillStyle = LEVEL_COLOR[l]; c.fill(); c.fillStyle = '#fff'; c.font = '700 24px Fredoka'; c.fillText('Level ' + l + ' ★', lx + 75, 772); lx += 164; });
    STEPS.forEach((s, i) => {
      const x = W / 2 + (i - 2) * 112, y = 826;
      c.beginPath(); c.arc(x, y, 20, 0, Math.PI * 2); c.fillStyle = '#20b486'; c.fill();
      c.fillStyle = '#fff'; c.font = '700 22px Fredoka'; c.fillText('✓', x, y + 8);
      c.fillStyle = '#0B2644'; c.font = '600 14px Sora'; c.fillText(s, x, y + 44);
    });

    // date, GB seal, My Mate
    const d = new Date(cert.at || Date.now());
    c.textAlign = 'left'; c.fillStyle = '#3b3552'; c.font = '700 26px Fredoka'; c.fillText(`${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`, 110, 900);
    c.fillStyle = '#8a7f6a'; c.font = '600 16px Sora'; c.fillText('DATE', 110, 926);
    c.textAlign = 'right';
    if (!window.CLMate || CLMate.current().id === 'gerry') circleImg(c, mate, W - 160, 868, 50, 65, 105, 300, 300);   // Gerry's face from his outfit frame
    else circleImg(c, mate, W - 160, 868, 50);
    c.fillStyle = '#3b3552'; c.font = '700 24px Fredoka'; c.fillText('My Mate · ' + (window.CLMate ? CLMate.name() : 'Gerry'), W - 222, 878);
    c.fillStyle = '#8a7f6a'; c.font = '600 16px Sora'; c.fillText('YOUR READING FRIEND', W - 222, 902);
    c.textAlign = 'center';
    c.fillStyle = '#8a7f6a'; c.font = '600 18px "Noto Sans KR"'; c.fillText('GB GREAT BACCALAUREATE · 144권의 책으로 시작하는 생각의 여정', W / 2, 924);
    // big GB seal on the left of the steps
    seal(c, 236, 790, 76);
    c.fillStyle = '#fff'; c.font = '700 46px Fraunces'; c.fillText('GB', 236, 804);
    c.font = '700 13px Sora'; c.fillText('GREAT', 236, 826); c.font = '600 9px Sora'; c.fillText('BACCALAUREATE', 236, 840);
    return true;
  }

  /* ---------- earning ---------- */
  const queue = [];
  function check() {
    const certs = load(), m = certs[MONTH] || { levels: [], at: null };
    const fresh = LEVELS.filter(l => booksDone(l) === 4 && !m.levels.includes(l));
    if (!fresh.length) { drawCard(); return; }
    const first = !m.levels.length;
    m.levels = m.levels.concat(fresh); if (!m.at) m.at = new Date().toISOString();
    certs[MONTH] = m; save(certs);
    drawCard();
    fresh.forEach(l => queue.push({ level: l, first }));
    if (!document.querySelector('.cert-show')) ceremony();
  }

  /* ---------- this month's seals in the hall ---------- */
  const app = document.getElementById('app');
  const hall = document.getElementById('hall');
  const card = document.createElement('button');
  card.type = 'button'; card.className = 'cert-card'; card.setAttribute('aria-label', 'My certificates');
  if (hall) hall.appendChild(card);
  function drawCard() {
    const m = load()[MONTH];
    card.innerHTML = `<span class="medal">${m ? '🏅' : '🎖️'}</span><span class="txt"><b>${MONTH}월 인증서</b><small>${m ? 'Earned! Tap to see' : 'Finish 4 books of a level'}</small></span>
      <span class="rows">${LEVELS.map(l => { const n = booksDone(l); return `<span class="row"><i style="background:${LEVEL_COLOR[l]}">${l}</i>${[0, 1, 2, 3].map(k => `<em class="${k < n ? 'on' : ''}"></em>`).join('')}</span>`; }).join('')}</span>`;
    card.classList.toggle('earned', !!m);
  }
  card.addEventListener('click', () => openRoom());

  /* ---------- Hall of Certificates ---------- */
  const room = document.createElement('section');
  room.className = 'cert-room'; room.hidden = true; room.setAttribute('aria-label', 'Hall of Certificates');
  room.innerHTML = `<img class="bg" src="art/certificate-room.webp" alt="">
    <div class="clbar cert-bar"><button class="clb" type="button" data-room-close><span class="i">←</span>Back</button>
      <div class="clmid"><span class="cert-title">My Certificates <small>나의 인증서</small></span></div><div class="clright"></div></div>
    <div class="cert-wall" id="certWall"></div>
    <div class="guide cert-mate"><img class="gf on" data-f="idle" src="art/outfits/wizard/gerry-idle.webp" alt=""></div>
    <div class="bubble tail-right cert-bubble" id="certBubble"></div>`;
  if (app) app.appendChild(room);
  function wall(highlight) {
    const certs = load(), me = child();
    let wearing = 'wizard'; try { wearing = JSON.parse(localStorage.getItem('cl.wardrobe')).wearing || wearing; } catch (e) {}
    room.querySelector('.cert-mate img').src = window.CLMate ? CLMate.src('idle') : `art/outfits/${wearing}/gerry-idle.webp`;
    room.querySelector('#certWall').innerHTML = Array.from({ length: 12 }, (_, i) => {
      const n = i + 1, c = certs[n];
      if (c) return `<button type="button" class="cert-frame got ${n === highlight ? 'new' : ''}" data-month="${n}"><canvas></canvas><span class="m">${n}월</span><span class="ribbons">${c.levels.map(l => `<i style="background:${LEVEL_COLOR[l]}">${l}</i>`).join('')}</span></button>`;
      if (n === MONTH) return `<div class="cert-frame now"><span class="big">${LEVELS.reduce((a, l) => Math.max(a, booksDone(l)), 0)}/4</span><span class="m">${n}월 · this month</span></div>`;
      return `<div class="cert-frame empty"><span class="m">${n}월</span></div>`;
    }).join('');
    room.querySelectorAll('.cert-frame.got').forEach(f => draw(f.querySelector('canvas'), +f.dataset.month));
    const got = Object.keys(certs).length;
    room.querySelector('#certBubble').textContent = !window.CLLines ? '' : got ? CLLines.text('cert.roomSome', { name: me.name, count: got }) : CLLines.text('cert.roomNone');
  }
  function openRoom(highlight) {
    wall(highlight); room.hidden = false; requestAnimationFrame(() => room.classList.add('on'));
  }
  function closeRoom() { room.classList.remove('on'); setTimeout(() => { room.hidden = true; }, 300); }
  room.addEventListener('click', e => {
    if (e.target.closest('[data-room-close]')) return closeRoom();
    const f = e.target.closest('.cert-frame.got'); if (f) show(+f.dataset.month, false);
  });

  /* ---------- the big certificate (view, and the ceremony when earned) ---------- */
  function speak(text) {
    let muted = false; try { muted = localStorage.getItem('cl.muted') === '1'; } catch (e) {}
    if (muted || !('speechSynthesis' in window)) return;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = .95; u.pitch = window.CLMate ? CLMate.pitch() : 1.2; speechSynthesis.speak(u); } catch (e) {}
  }
  function confetti() {
    if (RM) return;
    const colors = ['#ffd36b', '#ff8a5c', '#5b3fa8', '#20b486', '#9fc3ff'];
    for (let i = 0; i < 70; i++) {
      const p = document.createElement('i'); p.className = 'cert-confetti';
      p.style.left = 590 + (Math.random() - .5) * 200 + 'px'; p.style.top = '360px'; p.style.background = colors[i % 5];
      p.style.setProperty('--dx', (Math.random() - .5) * 1100 + 'px'); p.style.setProperty('--dy', 200 + Math.random() * 500 + 'px'); p.style.setProperty('--r', Math.random() * 720 + 'deg');
      app.appendChild(p); setTimeout(() => p.remove(), 2200);
    }
  }
  function show(month, earned, level) {
    const v = document.createElement('div'); v.className = 'cert-show' + (earned ? ' earned' : '');
    v.innerHTML = `${earned ? `<div class="owl-deliver"><img src="art/owl-up.webp" alt=""><span class="scroll">📜</span></div>` : ''}
      <div class="sheet"><canvas></canvas></div>
      <div class="cert-actions">${earned ? `<button class="clb clb--go clb--lg clb--pulse" type="button" data-hang><span class="i">✨</span>Hang it on my wall</button>` : `<button class="clb clb--lg" type="button" data-shut><span class="i">←</span>Back</button>`}</div>`;
    app.appendChild(v);
    draw(v.querySelector('canvas'), month);
    requestAnimationFrame(() => v.classList.add('on'));
    if (earned) {
      setTimeout(() => { v.classList.add('open'); confetti(); }, RM ? 0 : 1300);
      const me = child();
      if (window.CLLines) { speak(level && !lastFirst ? CLLines.text('cert.ribbon', { name: me.name, level }) : CLLines.text('cert.earned', { name: me.name })); CLLines.flourish('cert.earned'); }
    } else v.classList.add('open');
    v.addEventListener('click', e => {
      if (e.target.closest('[data-shut]') || e.target === v) { v.remove(); return; }
      if (e.target.closest('[data-hang]')) { v.remove(); if (queue.length) return ceremony(); openRoom(month); }
    });
  }
  let lastFirst = true;   // false when the certificate already existed and this level only adds a ribbon
  function ceremony() {
    const next = queue.shift(); if (!next) return;
    lastFirst = next.first; show(MONTH, true, next.level);
  }

  window.CLCerts = { check, draw, list: () => load(), openRoom, MONTH };
  drawCard();
})();
