/* My Mate: the GP Friend who guides each child (chosen in the Magic Wardrobe). Shared by the library, the
   activities and the book maker. The choice is saved with the child's outfits in localStorage 'cl.wardrobe'
   ({mate, wearing, owned, spent}), so every child has their own mate.
   Gerry wears the wardrobe outfits (art/outfits/<outfit>/gerry-*.webp); the other friends have their own talking
   frames (art/mates/<id>/mate-*.webp, made by design/tools/make_outfit_frames.py --mates). */
(function () {
  const MATES = [
    { id: 'gerry', name: 'Gerry', pitch: 1.2, ready: true },
    { id: 'penny', name: 'Penny', pitch: 1.45, ready: true },
    { id: 'ria', name: 'Ria', pitch: 1.5, ready: true },
    { id: 'syd', name: 'Syd', pitch: 1.05, ready: true },
    { id: 'wanda', name: 'Wanda', pitch: 1.35, ready: true },
    { id: 'don', name: 'Don', pitch: 0.9, ready: true },
    { id: 'coover', name: 'Coover', pitch: 1.1, ready: true }
  ];
  const state = () => { try { return JSON.parse(localStorage.getItem('cl.wardrobe')) || {}; } catch (e) { return {}; } };
  function current() {
    const id = state().mate;
    const m = MATES.find(x => x.id === id && x.ready);
    return m || MATES[0];
  }
  /* picture for a frame ('idle' | 'talk' | 'blink'); base is the path back to app/ ('', '../', '../../') */
  function src(f, base, mateId, outfit) {
    const m = mateId ? (MATES.find(x => x.id === mateId) || MATES[0]) : current();
    if (m.id === 'gerry') return `${base || ''}art/outfits/${outfit || state().wearing || 'wizard'}/gerry-${f}.webp`;
    return `${base || ''}art/mates/${m.id}/mate-${f}.webp`;
  }
  window.CLMate = { MATES, current, src, name: () => current().name, pitch: () => current().pitch };
  /* My Mate's voice is the browser's own speech for now. iPhones (and some other phones) keep it silent until it has
     once been started by a tap, so the child's first tap anywhere quietly switches it on for the rest of the page. */
  if ('speechSynthesis' in window) {
    const wake = () => {
      removeEventListener('pointerdown', wake, true);
      try { if (!speechSynthesis.speaking) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } speechSynthesis.getVoices(); } catch (e) {}
    };
    addEventListener('pointerdown', wake, true);
  }
})();
