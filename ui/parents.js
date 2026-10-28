/* Parent area (부모님 공간), opened by any .parents button after a parent check (a times-table question).
   Tabs: this month's books, levels, word lists (with listening), and a learning report with the child's recordings.
   Content comes from ui/parent-data.js; progress from this device only (localStorage, IndexedDB 'cl-voice').
   The library page provides window.clProgress() (stand-in quest progress) and window.clStars(). */
(function () {
  const D = window.CLParentData, app = document.getElementById('app');
  if (!D || !app) return;
  const BOOK_IDS = [0, 1, 2, 3];   // weeks on each shelf; the books come from the live month (window.clBook)
  const REAL = window.clRealKey || 'B3';   // the book with its own hand-made activities (Sugar Bugs)
  const book = (L, i) => (window.clBook ? window.clBook(L, i) : { id: '', t: '', c: '' });
  const allBooks = () => ['A', 'B', 'C'].reduce((a, L) => a.concat(BOOK_IDS.map(i => Object.assign({ L }, book(L, i)))), []);
  const wordsOf = id => (D.books[id] || {});
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };

  /* ---------- progress on this device ---------- */
  function realSteps() {
    const s = {}; ['read', 'question', 'think', 'express'].forEach(k => { s[k] = get('cl.sb5.' + k) === '1'; });
    s.create = get('cl.sb5.createDone') === '1'; return s;
  }
  function bookState(level, i) {
    const key = level + i;
    if (key === REAL) { const n = Object.values(realSteps()).filter(Boolean).length; return { n, of: 5 }; }
    const p = (window.clProgress ? window.clProgress() : {})[key] || 0; return { n: Math.min(p, 5), of: 5 };
  }
  function pill(st) {
    if (st.n >= st.of) return '<span class="pa-pill done">완료 ✓</span>';
    if (st.n > 0) return `<span class="pa-pill doing">진행 중 ${st.n}/${st.of}</span>`;
    return '<span class="pa-pill">시작 전</span>';
  }
  function wardrobe() { try { return JSON.parse(get('cl.wardrobe')) || {}; } catch (e) { return {}; } }
  function clips() {
    return new Promise(res => {
      try {
        const r = indexedDB.open('cl-voice', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('clips', { keyPath: 'id' });
        r.onsuccess = () => { try { const q = r.result.transaction('clips').objectStore('clips').getAll(); q.onsuccess = () => res(q.result || []); q.onerror = () => res([]); } catch (e) { res([]); } };
        r.onerror = () => res([]);
      } catch (e) { res([]); }
    });
  }

  /* ---------- listening ---------- */
  let audio = null;
  function stopSound() { try { speechSynthesis.cancel(); } catch (e) {} if (audio) { audio.pause(); audio = null; } box.querySelectorAll('.pa-say.on').forEach(b => b.classList.remove('on')); }
  function speak(text, btn) {
    stopSound(); if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = .85;
    if (btn) { btn.classList.add('on'); u.onend = () => btn.classList.remove('on'); }
    speechSynthesis.speak(u);
  }

  /* ---------- the overlay ---------- */
  const box = document.createElement('div');
  box.className = 'pa'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', '부모님 공간');
  app.appendChild(box);
  let tab = 'month', wordBook = (Object.keys(D.books).find(id => (D.books[id].words || []).length) || '');

  function gate() {
    const a = 3 + Math.floor(Math.random() * 7), b = 3 + Math.floor(Math.random() * 7), ans = a * b;
    const opts = new Set([ans]); while (opts.size < 4) { const d = ans + (Math.floor(Math.random() * 9) - 4) * (Math.random() < .5 ? 1 : a); if (d > 0) opts.add(d); }
    box.innerHTML = `<div class="pa-gate"><div class="pa-gatebox">
      <h2>부모님 확인</h2><p>아래 문제의 답을 눌러 주세요. · Parents only</p>
      <div class="q">${a} × ${b} = ?</div>
      <div class="opts">${[...opts].sort(() => Math.random() - .5).map(n => `<button type="button" data-n="${n}">${n}</button>`).join('')}</div>
      <button type="button" class="cancel" data-close>아이 화면으로 돌아가기</button></div></div>`;
    box.querySelector('.opts').addEventListener('click', e => {
      const btn = e.target.closest('[data-n]'); if (!btn) return;
      if (+btn.dataset.n === ans) room(); else { btn.classList.remove('no'); void btn.offsetWidth; btn.classList.add('no'); }
    });
  }

  const TABS = [['month', '📚', '이번 달 학습', 'THIS MONTH'], ['levels', '🪜', '레벨 안내', 'LEVELS'], ['words', '🔤', '단어장', 'WORDS'], ['report', '📈', '학습 리포트', 'REPORT'], ['family', '👨‍👩‍👧', '가족 프로필', 'FAMILY']];
  const PR = window.CLProfiles;
  const kid = () => PR ? PR.active() : { id: 'local-reader', name: 'Anna', avatar: 'ria' };
  let familyChanged = false;
  function room() {
    box.innerHTML = `<div class="pa-room">
      <nav class="pa-nav" role="tablist">
        <div class="pa-brand"><b>부모님 공간</b><span>FOR PARENTS</span></div>
        ${TABS.map(([id, ic, ko, en]) => `<button class="tab" type="button" role="tab" data-tab="${id}" aria-selected="${tab === id}"><i>${ic}</i><span>${ko}<small>${en}</small></span></button>`).join('')}
        <div class="spacer"></div>
        <div class="child"><img src="assets/avatars/face-${kid().avatar}.webp" alt=""><span><b>${esc(kid().name)}</b><br><small>지금 읽는 아이</small></span></div>
        <button class="back" type="button" data-close>아이 화면으로 ›</button>
      </nav>
      <main class="pa-main" id="paMain"></main></div>`;
    box.querySelector('.pa-nav').addEventListener('click', e => { const t = e.target.closest('[data-tab]'); if (!t) return; tab = t.dataset.tab; box.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === tab)); draw(); });
    draw();
  }

  function draw() {
    stopSound();
    const m = box.querySelector('#paMain');
    m.scrollTop = 0;
    m.innerHTML = ({ month, levels, words, report, family })[tab]();
    if (tab === 'report') { fillVoices(); fillCerts(); }
  }

  function month() {
    const P = D.program;
    let done = 0; D.levels.forEach(l => BOOK_IDS.forEach((_, i) => { const s = bookState(l.id, i); if (s.n >= s.of) done++; }));
    return `<h1>이번 달 학습</h1><p class="sub">${esc(window.CLMonth ? CLMonth.ko + "의 책 · " + CLMonth.label : P.month)} · 레벨마다 일주일에 한 권, 한 달에 네 권씩 새 책이 열려요.</p>
      <div class="pa-row">
        <div class="pa-card pa-program"><div class="big">${done}<small style="font-size:22px;color:#ded6f7">/12</small></div>
          <div><b>${esc(P.name)} · ${esc(P.tagline)}</b><span>이번 달 완료한 책 · 일 년 동안 ${P.perYear}권의 좋은 책을 만나요.</span><span>${esc(P.note)}</span></div></div>
        <div class="pa-card"><h3>책 한 권의 학습 순서</h3><div class="pa-cycle">${D.cycle.map(c => `<div><b>${c.en}</b><strong>${c.ko}</strong><span>${esc(c.text)}</span></div>`).join('')}</div></div>
        <div class="pa-levels">${D.levels.map(l => `<div class="pa-card pa-lv"><h4><i style="background:${l.color}">${l.icon}</i>${l.name}</h4>
          ${BOOK_IDS.map(i => { const b = book(l.id, i); return `<div class="pa-book"><img src="${b.c}" alt=""><b>${i + 1}주 · ${esc(b.t)}</b>${pill(bookState(l.id, i))}</div>`; }).join('')}</div>`).join('')}</div>
      </div>`;
  }

  function levels() {
    return `<h1>레벨 안내</h1><p class="sub">GB Magic Library의 세 레벨이 무엇을 연습하는지 알려 드려요.</p>
      <div class="pa-levels">${D.levels.map(l => `<div class="pa-card pa-lvcard" style="--c:${l.color}">
        <span class="tag">${l.icon} ${l.name}</span><div class="focus">${esc(l.focus)}</div>
        <ul>${l.skills.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
        <div class="ex">“${esc(l.sample)}”</div></div>`).join('')}</div>
      <div class="pa-note">아이는 세 레벨의 책을 모두 자유롭게 볼 수 있어요. 아이 화면에는 나이나 학년이 표시되지 않아, 쉬운 책과 어려운 책을 부담 없이 오가며 읽을 수 있어요.</div>`;
  }

  function words() {
    const all = allBooks(), cur = all.find(x => x.id === wordBook) || all[0] || {}, b = Object.assign({ words: [] }, wordsOf(cur.id));
    const chips = all.map(x => `<button type="button" data-book="${x.id}" aria-pressed="${x.id === cur.id}"><img src="${x.c}" alt="">${x.L} · ${esc(x.t)}</button>`).join('');
    const list = b.words.length
      ? `<div class="pa-words">${b.words.map(([en, ko, ex]) => `<div class="pa-word"><button class="pa-say" type="button" data-say="${esc(en)}" aria-label="Listen: ${esc(en)}">🔊</button><div><b>${esc(en)}</b><em>${esc(ko)}</em><p>${esc(ex)}</p></div></div>`).join('')}</div>`
      : '<div class="pa-card pa-empty">이 책의 단어장은 책이 앱에 추가되면 함께 열려요.</div>';
    const sent = b.sentences ? `<div class="pa-card" style="margin-top:16px"><h3>함께 말해 볼 문장</h3><div class="pa-sentences">${b.sentences.map(s => `<button type="button" data-say="${esc(s)}">🔊 ${esc(s)}</button>`).join('')}</div></div>` : '';
    setTimeout(() => {
      const m = box.querySelector('#paMain');
      m.querySelector('.pa-chips').addEventListener('click', e => { const c = e.target.closest('[data-book]'); if (c) { wordBook = c.dataset.book; draw(); } });
    });
    return `<h1>단어장</h1><p class="sub">책에 나온 단어를 들어 보고 아이와 함께 말해 보세요.</p><div class="pa-chips">${chips}</div>${list}${sent}`;
  }

  function report() {
    const s = realSteps(), w = wardrobe();
    let done = 0; D.levels.forEach(l => BOOK_IDS.forEach((_, i) => { const st = bookState(l.id, i); if (st.n >= st.of) done++; }));
    const earned = window.clStars ? window.clStars() : 12, spent = +w.spent || 0;
    const rk = REAL !== 'none' ? book(REAL[0], +REAL.slice(1)) : null, sb = Object.assign({ talk: [], talkKo: [] }, rk ? wordsOf(rk.id) : {});
    return `<h1>학습 리포트</h1><p class="sub">${esc(kid().name)}의 이번 달 기록이에요.</p>
      <div class="pa-row">
        <div class="pa-kpis">
          <div class="pa-card pa-kpi"><div class="n">${done}<small>/12</small></div><div class="l">완료한 책</div></div>
          <div class="pa-card pa-kpi"><div class="n">${earned}</div><div class="l">모은 별 ⭐ (사용 ${spent})</div></div>
          <div class="pa-card pa-kpi"><div class="n" id="paVoiceN">–</div><div class="l">아이 목소리 녹음</div></div>
          <div class="pa-card pa-kpi"><div class="n">${(w.owned || ['everyday', 'wizard']).length}<small>/6</small></div><div class="l">My Mate 옷장</div></div>
        </div>
        <div class="pa-card"><h3>${esc(rk ? rk.t : '')} · 학습 단계</h3>
          <div class="pa-steps">${D.cycle.map(c => `<div class="pa-step ${s[c.key] ? 'ok' : ''}"><div class="dot">${s[c.key] ? '✓' : ''}</div><b>${c.en}</b><span>${c.ko}</span></div>`).join('')}</div></div>
        <div class="pa-card"><h3>월간 인증서 · Certificates</h3><div class="pa-certs" id="paCerts"></div></div>
        <div class="pa-card"><h3>아이 목소리 듣기 · EXPRESS</h3><div class="pa-voice" id="paVoice"><div class="pa-empty" style="padding:14px">불러오는 중…</div></div></div>
        <div class="pa-card"><h3>오늘 아이와 이야기해 보세요</h3><div class="pa-talk">${sb.talk.map((t, i) => `<div><b>${esc(t)}</b><span>${esc(sb.talkKo[i])}</span></div>`).join('')}</div></div>
      </div>
      <p class="pa-privacy">🔒 모든 기록과 녹음은 이 기기에만 저장돼요. 계정이 생기면 가족 기기끼리 안전하게 이어져요.</p>`;
  }
  /* ---------- family profiles ---------- */
  let confirmDel = null;
  function family() {
    if (!PR) return '<h1>가족 프로필</h1><div class="pa-card pa-empty">프로필을 불러오지 못했어요.</div>';
    const list = PR.list(), now = kid().id;
    const faces = (sel, id) => `<div class="pa-faces">${PR.AVATARS.map(a => `<button type="button" class="${a === sel ? 'on' : ''}" data-avatar="${a}" data-for="${id}" aria-label="${a}"><img src="assets/avatars/face-${a}.webp" alt=""></button>`).join('')}</div>`;
    return `<h1>가족 프로필</h1><p class="sub">아이마다 별, 학습 단계, 만든 책, 녹음, My Mate의 옷이 따로 저장돼요. 최대 ${PR.MAX}명까지 만들 수 있어요.</p>
      <div class="pa-family">${list.map(p => `<div class="pa-card pa-kid ${p.id === now ? 'now' : ''}">
          <div class="top"><img class="big" src="assets/avatars/face-${p.avatar}.webp" alt=""><div class="who">
            <input type="text" maxlength="12" value="${esc(p.name)}" data-name="${p.id}" aria-label="아이 이름">
            ${p.id === now ? '<span class="pa-pill done">지금 읽는 아이</span>' : `<button type="button" class="pa-btn" data-switch="${p.id}">이 아이로 바꾸기</button>`}</div></div>
          <div class="pa-eyebrow" style="margin:12px 0 6px">캐릭터 고르기</div>${faces(p.avatar, p.id)}
          <div class="del">${list.length < 2 ? '' : confirmDel === p.id
            ? `<span>${esc(p.name)}의 기록이 모두 지워져요. 지울까요?</span><button type="button" class="pa-btn danger" data-del-yes="${p.id}">지우기</button><button type="button" class="pa-btn" data-del-no>취소</button>`
            : `<button type="button" class="pa-link" data-del="${p.id}">프로필 삭제</button>`}</div></div>`).join('')}
        ${list.length < PR.MAX ? `<div class="pa-card pa-kid add"><h3>＋ 아이 추가</h3>
          <input type="text" maxlength="12" placeholder="이름 (예: Mina)" id="paNewName" aria-label="새 아이 이름">
          <div class="pa-eyebrow" style="margin:12px 0 6px">캐릭터 고르기</div>${faces(PR.AVATARS[list.length % PR.AVATARS.length], 'new')}
          <button type="button" class="pa-btn primary" data-add style="margin-top:14px">추가하기</button></div>` : ''}
      </div>
      <p class="pa-privacy">🔒 프로필과 기록은 이 기기에만 저장돼요.</p>`;
  }
  box.addEventListener('change', e => {
    const n = e.target.closest('[data-name]'); if (n && PR) { PR.update(n.dataset.name, { name: n.value }); familyChanged = true; }
  });
  box.addEventListener('click', async e => {
    if (!PR || tab !== 'family') return;
    const av = e.target.closest('[data-avatar]');
    if (av) {
      if (av.dataset.for === 'new') { av.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === av)); return; }
      PR.update(av.dataset.for, { avatar: av.dataset.avatar }); familyChanged = true; return draw();
    }
    if (e.target.closest('[data-add]')) {
      const input = box.querySelector('#paNewName'), name = input.value.trim(); if (!name) { input.focus(); return; }
      const sel = box.querySelector('.pa-kid.add [data-avatar].on');
      PR.add(name, sel ? sel.dataset.avatar : null); familyChanged = true; return draw();
    }
    const sw = e.target.closest('[data-switch]');
    if (sw) { if (PR.switchTo(sw.dataset.switch)) location.reload(); return; }
    const d = e.target.closest('[data-del]'); if (d) { confirmDel = d.dataset.del; return draw(); }
    if (e.target.closest('[data-del-no]')) { confirmDel = null; return draw(); }
    const y = e.target.closest('[data-del-yes]');
    if (y) { const wasMe = y.dataset.delYes === kid().id; confirmDel = null; await PR.remove(y.dataset.delYes); if (wasMe) return location.reload(); familyChanged = true; return draw(); }
  });

  /* ---------- certificates: view, save as an image, print ---------- */
  function fillCerts() {
    const el = box.querySelector('#paCerts'); if (!el) return;
    const C = window.CLCerts, certs = C ? C.list() : {}, months = Object.keys(certs).map(Number).sort((a, b) => a - b);
    if (!months.length) { el.innerHTML = `<div class="pa-empty" style="padding:14px">한 레벨의 이번 달 책 4권을 모두 끝내면 ${C ? C.MONTH : ''}월 인증서를 받아요. 다른 레벨도 끝내면 인증서에 리본이 더해져요.</div>`; return; }
    el.innerHTML = months.map(m => `<div class="pa-cert"><canvas data-cert="${m}"></canvas><div><b>${m}월 인증서</b><span>${certs[m].levels.map(l => 'Level ' + l).join(' · ')}</span>
      <div class="acts"><button type="button" class="pa-btn" data-cert-save="${m}">이미지로 저장</button><button type="button" class="pa-btn" data-cert-print="${m}">인쇄하기</button></div></div></div>`).join('');
    el.querySelectorAll('canvas[data-cert]').forEach(cv => C.draw(cv, +cv.dataset.cert));
  }
  async function certPng(m) { const cv = document.createElement('canvas'); await window.CLCerts.draw(cv, m); return cv.toDataURL('image/png'); }
  box.addEventListener('click', async e => {
    const sv = e.target.closest('[data-cert-save]'), pr = e.target.closest('[data-cert-print]');
    if (!sv && !pr) return;
    const m = +(sv || pr).dataset[sv ? 'certSave' : 'certPrint'], url = await certPng(m), name = kid().name;
    if (sv) { const a = document.createElement('a'); a.href = url; a.download = `${name}-${m}월-인증서.png`; document.body.appendChild(a); a.click(); a.remove(); return; }
    const w = window.open('', '_blank'); if (!w) return;
    w.document.write(`<!doctype html><title>${esc(name)} ${m}월 인증서</title><style>@page{size:A4 landscape;margin:0}html,body{margin:0}img{width:100vw;height:100vh;object-fit:contain}</style><img src="${url}" onload="setTimeout(()=>print(),200)">`);
    w.document.close();
  });

  let voiceUrls = [];
  async function fillVoices() {
    const first = PR ? PR.list()[0].id : 'local-reader';
    const list = (await clips()).filter(c => c.blob && String(c.id).indexOf('sugar-bugs:') >= 0 && (c.profile || first) === kid().id);
    const el = box.querySelector('#paVoice'), n = box.querySelector('#paVoiceN');
    if (!el) return;
    if (n) n.textContent = list.length;
    voiceUrls.forEach(u => URL.revokeObjectURL(u)); voiceUrls = [];
    if (!list.length) { el.innerHTML = '<div class="pa-empty" style="padding:14px">아직 녹음이 없어요. EXPRESS 활동에서 아이가 문장을 말하면 여기에 모여요.</div>'; return; }
    el.innerHTML = list.map((c, i) => { const u = URL.createObjectURL(c.blob); voiceUrls.push(u);
      return `<div class="item"><button class="pa-say" type="button" data-play="${i}" aria-label="Play">▶</button><div><b>${esc(c.text || '')}</b><br><span>${c.at ? new Date(c.at).toLocaleDateString('ko-KR') : ''}</span></div><button class="pa-say" type="button" data-say="${esc(c.text || '')}" aria-label="Hear the sentence">🔊</button></div>`; }).join('');
  }

  box.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) return close();
    const say = e.target.closest('[data-say]'); if (say) return speak(say.dataset.say, say.classList.contains('pa-say') ? say : null);
    const play = e.target.closest('[data-play]');
    if (play) { stopSound(); audio = new Audio(voiceUrls[+play.dataset.play]); play.classList.add('on'); audio.onended = () => play.classList.remove('on'); audio.play().catch(() => play.classList.remove('on')); }
  });

  function open(startTab) { tab = TABS.some(t => t[0] === startTab) ? startTab : 'month'; confirmDel = null; gate(); box.hidden = false; requestAnimationFrame(() => box.classList.add('on')); try { speechSynthesis.cancel(); } catch (e) {} }
  function close() { stopSound(); if (familyChanged) { try { sessionStorage.setItem('cl.picked', '1'); } catch (e) {} return location.reload(); } box.classList.remove('on'); setTimeout(() => { box.hidden = true; box.innerHTML = ''; }, 200); }
  document.querySelectorAll('.parents').forEach(b => b.addEventListener('click', () => open()));
  window.CLParents = { open };
})();
