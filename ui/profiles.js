/* Child profiles: up to four children per family on one device (benchmark: Epic, Lingokids, Little Fox).
   Load this first in <head>: it makes sure the active child is set before any page reads its data.

   How each child's data is kept apart:
   - Saved books (GPLibrary) already belong to a reader id: we set 'gp.reading.profile.v1' to the active child.
   - EXPRESS recordings carry the child's id (field 'profile').
   - Steps, stars and outfits live in plain localStorage keys (cl.sb5.*, cl.wardrobe) that every page reads, so the
     active child's values sit in those keys and the others wait in 'cl.pdata.<id>'. Switching child swaps them.
   Registry: localStorage 'cl.profiles' = {list:[{id,name,avatar}], active:id}. */
(function () {
  const MAX = 4;
  const AVATARS = ['ria', 'penny', 'gerry', 'syd', 'wanda', 'don', 'coover'];
  const OWN = k => k.indexOf('cl.sb5.') === 0 || k.indexOf('cl.bk.') === 0 || k === 'cl.wardrobe' || k === 'cl.certs' || k === 'cl.room';
  const ls = window.localStorage;
  const read = (k, d) => { try { return JSON.parse(ls.getItem(k)) ?? d; } catch (e) { return d; } };
  const write = (k, v) => { try { ls.setItem(k, JSON.stringify(v)); } catch (e) {} };

  /* first visit: the existing reader becomes the first child, keeping everything already saved */
  let reg = read('cl.profiles', null);
  if (!reg || !reg.list || !reg.list.length) {
    const old = read('gp.reading.profile.v1', {}) || {};
    reg = { list: [{ id: old.id || 'local-reader', name: old.name || 'Anna', avatar: 'ria' }], active: old.id || 'local-reader' };
    write('cl.profiles', reg);
  }
  if (!reg.list.some(p => p.id === reg.active)) reg.active = reg.list[0].id;
  const active = () => reg.list.find(p => p.id === reg.active);
  function syncReader() {
    const p = active();
    write('gp.reading.profile.v1', { id: p.id, name: p.name, avatar: p.avatar });
    try { ls.setItem('anchor_child', p.name); } catch (e) {}
  }
  syncReader();

  function ownKeys() { const out = []; for (let i = 0; i < ls.length; i++) { const k = ls.key(i); if (OWN(k)) out.push(k); } return out; }
  function stash(id) {
    const snap = {}; ownKeys().forEach(k => { snap[k] = ls.getItem(k); });
    write('cl.pdata.' + id, snap);           // written before anything is removed
    return snap;
  }
  function switchTo(id) {
    if (id === reg.active || !reg.list.some(p => p.id === id)) return false;
    stash(reg.active);
    ownKeys().forEach(k => ls.removeItem(k));
    const snap = read('cl.pdata.' + id, {});
    Object.keys(snap).forEach(k => { if (OWN(k) && snap[k] != null) ls.setItem(k, snap[k]); });
    ls.removeItem('cl.pdata.' + id);
    reg.active = id; write('cl.profiles', reg); syncReader();
    try { sessionStorage.setItem('cl.picked', '1'); sessionStorage.removeItem('cl.return'); } catch (e) {}
    return true;
  }
  function add(name, avatar) {
    if (reg.list.length >= MAX) return null;
    const p = { id: 'child-' + Date.now().toString(36), name: String(name || '').trim().slice(0, 12) || 'Reader', avatar: AVATARS.includes(avatar) ? avatar : AVATARS[reg.list.length % AVATARS.length] };
    reg.list.push(p); write('cl.profiles', reg); return p;
  }
  function update(id, changes) {
    const p = reg.list.find(x => x.id === id); if (!p) return;
    if (changes.name != null) p.name = String(changes.name).trim().slice(0, 12) || p.name;
    if (changes.avatar && AVATARS.includes(changes.avatar)) p.avatar = changes.avatar;
    write('cl.profiles', reg); if (id === reg.active) syncReader();
  }
  /* removes the child and everything saved for them on this device */
  async function remove(id) {
    if (reg.list.length < 2 || !reg.list.some(p => p.id === id)) return false;
    if (id === reg.active) switchTo(reg.list.find(p => p.id !== id).id);
    ls.removeItem('cl.pdata.' + id);
    reg.list = reg.list.filter(p => p.id !== id); write('cl.profiles', reg);
    try { if (window.GPLibrary) for (const r of await window.GPLibrary.list(id)) await window.GPLibrary.remove(r.id); } catch (e) {}
    try {
      await new Promise(res => {
        const q = indexedDB.open('cl-voice', 1);
        q.onupgradeneeded = () => q.result.createObjectStore('clips', { keyPath: 'id' });
        q.onsuccess = () => { const st = q.result.transaction('clips', 'readwrite').objectStore('clips'); const c = st.openCursor(); c.onsuccess = () => { const cur = c.result; if (!cur) return res(); if (cur.value.profile === id) cur.delete(); cur.continue(); }; c.onerror = res; };
        q.onerror = res;
      });
    } catch (e) {}
    return true;
  }

  window.CLProfiles = {
    MAX, AVATARS,
    list: () => reg.list.slice(), active, switchTo, add, update, remove,
    avatarSrc: (a, base) => (base || '') + 'assets/avatars/face-' + a + '.webp'
  };
})();
