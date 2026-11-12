/* Recorded voice for My Mate (2026-11-12). Until now every line was spoken by the phone's own reading voice
   (speechSynthesis), which many phones do not give to web pages (KakaoTalk's built-in browser, Android phones with only a
   Korean voice), so My Mate was silent there. Now a line is first looked up among recorded clips:
     voice/<mate>/<id>.mp3, listed with its length in voice/<mate>/clips.js (window.CLVoiceClips[mate][id] = seconds),
     both made by tools/make_voice.cjs from the list of tools/voice_lines.cjs.
   id = a short code worked out from the words themselves (hash), so the pages need no list of line numbers: whatever
   text a page asks My Mate to say, the clip for exactly those words is played if it exists; if not, the caller falls
   back to the phone's voice as before. The child's name is never in a recording: "Hi, Anna!" is looked up as
   "Hi, {name}!", whose clip says "Hi!".
   CLVoice.has(text)  ->  true when a clip exists for the current mate
   CLVoice.play(text, { onend, onerror })  ->  { dur } (seconds) when it started a clip, else null
   CLVoice.stop()
   Phones only let a page make sound after a tap, so the first tap anywhere quietly switches the player on. */
(function () {
  'use strict';
  const base = (document.currentScript && document.currentScript.src || '').replace(/ui\/voice\.js.*$/, '') + 'voice/';
  const norm = t => String(t).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
  const hash = t => { let h = 2166136261; for (const c of norm(t)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).padStart(8, '0'); };
  const mate = () => (window.CLMate ? window.CLMate.current().id : 'gerry');
  function childName() {
    try { if (window.CLProfiles) return window.CLProfiles.active().name || ''; const p = JSON.parse(localStorage.getItem('cl.profiles') || 'null'); const a = p && p.list && p.list.find(x => x.id === p.active); return (a && a.name) || ''; } catch (e) { return ''; }
  }
  function find(text) {
    const clips = (window.CLVoiceClips || {})[mate()]; if (!clips) return null;
    const t = norm(text), n = childName(), tries = [t]; if (n && t.includes(n)) tries.unshift(t.split(n).join('{name}'));
    for (const k of tries) { const id = hash(k); if (clips[id] != null) return { url: base + mate() + '/' + id + '.mp3', dur: clips[id] }; }
    return null;
  }
  const audio = new Audio(); audio.preload = 'auto'; let turn = 0, woke = false;
  const SILENT = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
  function wake() {               // inside the child's first tap: a silent play, after which this player may make sound by itself
    if (woke) return; woke = true;
    try { audio.src = SILENT; const p = audio.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
  }
  addEventListener('pointerdown', wake, true); addEventListener('keydown', wake, true);
  function play(text, o) {
    const c = find(text); if (!c) return null; const my = ++turn; o = o || {};
    audio.onended = () => { if (my === turn && o.onend) o.onend(); };
    audio.onerror = () => { if (my === turn && o.onerror) o.onerror(); };
    try { audio.src = c.url; const p = audio.play(); if (p && p.catch) p.catch(() => { if (my === turn && o.onerror) o.onerror(); }); } catch (e) { return null; }
    return c;
  }
  function stop() { turn++; try { audio.pause(); } catch (e) {} }
  window.CLVoice = { has: t => !!find(t), play, stop, hash, norm };
})();
