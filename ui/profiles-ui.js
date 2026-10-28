/* "Who's reading today?" picker and the child's name and face around the library (data: ui/profiles.js).
   Shown when the library opens with two or more children, and whenever the profile picture in a top bar is tapped.
   Adding, renaming and removing children happens in the parent area (가족 프로필). */
(function () {
  const P = window.CLProfiles, app = document.getElementById('app');
  if (!P || !app) return;
  const me = P.active();
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* the child's face in every top bar, and Gerry greets them by name */
  document.querySelectorAll('.app .clprofile').forEach(img => {
    img.src = P.avatarSrc(me.avatar); img.alt = me.name; img.title = me.name;
    img.setAttribute('role', 'button'); img.tabIndex = 0; img.style.cursor = 'pointer';
    img.addEventListener('click', open);
    img.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
  const greet = document.getElementById('outBubble');
  if (greet) greet.textContent = window.CLLines ? CLLines.text('welcome', { name: me.name }) : `Welcome, ${me.name}!`;

  const css = document.createElement('style');
  css.textContent = `
.who{position:absolute;inset:0;z-index:72;display:grid;place-items:center;background:radial-gradient(120% 90% at 50% 20%,rgba(91,63,168,.88),rgba(32,20,66,.94));opacity:0;transition:opacity .25s}
.who.on{opacity:1}.who[hidden]{display:none}
.who h2{margin:0;text-align:center;font-family:"Fredoka",sans-serif;font-weight:700;font-size:48px;color:#fff;text-shadow:0 4px 0 rgba(0,0,0,.2)}
.who h2 small{display:block;font-family:"Noto Sans KR","Gowun Dodum",sans-serif;font-size:20px;font-weight:600;color:#ffd36b;margin-top:6px;text-shadow:none}
.who .kids{display:flex;justify-content:center;gap:34px;margin-top:40px}
.who .kid{display:grid;justify-items:center;gap:12px;border:0;background:none;cursor:pointer;color:#fff;font-family:"Fredoka",sans-serif;font-weight:700;font-size:26px;transition:transform .15s}
.who .kid:hover,.who .kid:focus-visible{transform:translateY(-6px)}
.who .kid:focus-visible{outline:none}
.who .face{position:relative;width:170px;height:170px;border-radius:50%;background:#fff;box-shadow:0 0 0 7px var(--ring),0 14px 0 rgba(0,0,0,.18),0 0 40px rgba(255,211,107,.35);overflow:hidden}
.who .face img{width:100%;height:100%;object-fit:cover}
.who .kid.me .face::after{content:"✓";position:absolute;right:8px;bottom:8px;width:40px;height:40px;border-radius:50%;background:#20b486;color:#fff;display:grid;place-items:center;font-size:24px;box-shadow:0 0 0 4px #fff}
.who .manage{display:block;margin:44px auto 0;border:0;background:rgba(255,255,255,.12);color:#e9e2ff;font-family:"Noto Sans KR",sans-serif;font-weight:600;font-size:16px;padding:12px 22px;border-radius:999px;cursor:pointer}
.who .close{position:absolute;right:26px;top:22px}`;
  document.head.appendChild(css);

  const RINGS = ['#ffd36b', '#ff8a5c', '#7fdcb6', '#9fc3ff'];
  const box = document.createElement('div');
  box.className = 'who'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Who is reading today?');
  app.appendChild(box);
  function draw(canClose) {
    box.innerHTML = `<div>
      ${canClose ? '<button class="clb clb--icon close" type="button" data-close aria-label="Close">✕</button>' : ''}
      <h2>Who’s reading today?<small>오늘은 누가 읽을까요?</small></h2>
      <div class="kids">${P.list().map((k, i) => `<button class="kid ${k.id === me.id ? 'me' : ''}" type="button" data-id="${k.id}" style="--ring:${RINGS[i % 4]}"><span class="face"><img src="${P.avatarSrc(k.avatar)}" alt=""></span>${esc(k.name)}</button>`).join('')}</div>
      <button class="manage" type="button" data-manage>👨‍👩‍👧 부모님 · 프로필 관리</button></div>`;
  }
  function open(canClose = true) { draw(canClose !== false); box.hidden = false; requestAnimationFrame(() => box.classList.add('on')); }
  function close() { box.classList.remove('on'); setTimeout(() => { box.hidden = true; }, 250); }
  box.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) return close();
    if (e.target.closest('[data-manage]')) { close(); if (window.CLParents) window.CLParents.open('family'); return; }
    const k = e.target.closest('[data-id]'); if (!k) return;
    try { sessionStorage.setItem('cl.picked', '1'); } catch (err) {}
    if (k.dataset.id === me.id) return close();
    if (P.switchTo(k.dataset.id)) location.reload();
  });

  let picked = false; try { picked = sessionStorage.getItem('cl.picked') === '1'; } catch (e) {}
  if (P.list().length > 1 && !picked) open(false);
  window.CLWho = { open };
})();
