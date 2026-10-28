/* Makes Gerry's speech bubbles pop in whenever their text changes (style in cl-bubble.css). */
(function () {
  function pop(b) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
  new MutationObserver(list => {
    const seen = new Set();
    list.forEach(m => {
      const n = m.target.nodeType === 1 ? m.target : m.target.parentElement;
      const b = n && n.closest('.bubble, .say');
      if (b && !seen.has(b)) { seen.add(b); pop(b); }
    });
  }).observe(document.body, { childList: true, characterData: true, subtree: true });
  document.addEventListener('animationend', e => { if (e.animationName === 'bbPop') e.target.classList.remove('pop'); });
})();
