(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const audio = document.createElement('audio'), button = $('#readAloud');
  const lines = [...document.querySelectorAll('.story-line')];
  // Seconds in the existing source-video excerpt (video in-point: 21 s).
  // Independent speech windows replace the old 8.8 s paragraph switch.
  // Music-only gaps have no highlight; playback position is the only clock.
  let cues = [
    { id: 'line-yum', start: 0.48, end: 1.18 },
    { id: 'line-donut', start: 1.45, end: 2.62 },
    { id: 'line-candy', start: 5.96, end: 7.90 },
    { id: 'line-yum-again', start: 7.90, end: 8.78 }
  ];
  let frame = 0, playRequest = 0;
  audio.id = 'narration';
  audio.preload = 'auto';
  document.body.append(audio);
  const moving = () => window.storybook.getPage() === 'story' && window.storybook.getState() === 'move';
  function highlight() {
    const cue = window.storybook.getPage() === 'story' && !audio.paused && !audio.ended
      ? cues.find(c => audio.currentTime >= c.start && audio.currentTime < c.end) : null;
    lines.forEach(line => {
      const active = line.id === cue?.id;
      line.classList.toggle('reading-now', active);
      if (active) line.setAttribute('aria-current', 'true');
      else line.removeAttribute('aria-current');
    });
  }
  function tick() {
    highlight();
    frame = !audio.paused && !audio.ended ? requestAnimationFrame(tick) : 0;
  }
  function update() {
    const active = !audio.paused && !audio.ended;
    button.innerHTML = `<span class="button-icon" aria-hidden="true">${active ? 'Ⅱ' : '♫'}</span><span>${active ? 'Pause reading' : 'Listen'}</span>`;
    button.setAttribute('aria-label', active ? 'Pause reading' : window.storybook.getPage() === 'cover'||window.storybook.getScene?.()?.cover ? 'Read the book title aloud' : 'Read the story aloud');
    button.setAttribute('aria-pressed', String(active));
    cancelAnimationFrame(frame);
    frame = 0;
    if (active) tick(); else highlight();
  }
  function pause() { ++playRequest; audio.pause(); update(); }
  async function speak(restart = false) {
    const request = ++playRequest;
    if (restart || audio.ended) audio.currentTime = 0;
    try { await audio.play(); update(); }
    catch (e) {
      if (request !== playRequest || e.name === 'AbortError') return;
      $('#status').textContent = 'Tap Listen to hear the story.';
      update();
    }
  }
  function loadPage() {
    pause();
    const scene=window.storybook.getScene?.();
    if(scene?.cues)cues=scene.cues;
    audio.src = window.storybook.getPage() === 'cover' ? 'cover-narration.m4a' : scene?.audio||'story-narration.m4a';
    audio.load();
    update();
  }
  button.onclick = () => {
    if (!audio.paused) { pause(); if (moving()) window.sampleTest.pause(); }
    else { if (moving()) window.sampleTest.resume(); speak(); }
  };
  $('#finish').addEventListener('click', () => { if (moving()) speak(true); });
  $('#apply').addEventListener('click', () => { if (moving() && window.sampleTest.getMode() === 'photo') speak(true); });
  $('#replay').addEventListener('click', () => speak(true));
  $('#play').addEventListener('click', () => { if (!window.sampleTest.isPlaying()) pause(); else speak(); });
  for (const id of ['begin', 'edit', 'read', 'paperButton']) $('#' + id).addEventListener('click', pause);
  document.addEventListener('book-page-change', loadPage);
  for (const event of ['play', 'pause', 'timeupdate', 'seeked', 'seeking']) audio.addEventListener(event, update);
  audio.addEventListener('ended', () => { if (moving()) window.sampleTest.pause(); update(); });
  audio.addEventListener('error', () => { $('#status').textContent = 'The story sound could not load. Please try Listen again.'; update(); });
  loadPage();
})();
