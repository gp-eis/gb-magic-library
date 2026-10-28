/* Editable autosave for this LOCAL copy only. Nothing is uploaded or published. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const BOOK_ID = 'bye-bye-sugar-bugs', DELAY = 600;
  const homeGroup = document.createElement('div');
  homeGroup.className = 'storybook-home-group';
  homeGroup.innerHTML = '<a id="libraryHomeLink" class="storybook-home-link" href="../index.html" aria-label="Back to home"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/></svg><span>Home</span></a>';
  const header = $('header');
  header.classList.add('storybook-header');
  header.insertBefore(homeGroup, $('.brand'));
  homeGroup.appendChild($('.brand'));
  const saveControl = document.createElement('div');
  saveControl.className = 'library-save-control';
  saveControl.dataset.state = 'loading';
  saveControl.innerHTML = '<button id="saveToLibrary" class="library-save-button" type="button" disabled><span class="library-save-symbol" aria-hidden="true"><svg class="save-icon-book" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M12 5v15M3 4.5C6 3.5 9 4 12 6c3-2 6-2.5 9-1.5V19c-3-1-6-.5-9 1.5C9 18.5 6 18 3 19Z"/></svg><svg class="save-icon-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="m5 12 4 4L19 6"/></svg><span class="library-save-spinner"></span></span><span id="saveLibraryLabel">Save now</span></button><span id="libraryAutoSaveStatus" class="library-autosave-status" role="status" aria-live="polite">Opening your book…</span>';
  $('.header-tools').insertBefore(saveControl, $('.language-switch'));
  const feedback = document.createElement('div');
  feedback.className = 'library-feedback'; feedback.hidden = true;
  feedback.innerHTML = '<span class="library-feedback-mark" aria-hidden="true">✓</span><p id="librarySaveStatus" role="status" aria-live="polite" aria-atomic="true"></p><a id="libraryViewLink" href="../index.html#myLibrary" hidden>View My Library <span aria-hidden="true">→</span></a><button id="dismissLibraryMessage" class="library-feedback-close" type="button" aria-label="Dismiss library message">×</button>';
  $('main').appendChild(feedback);
  const loading = document.createElement('div');
  loading.className = 'library-restore-veil';
  loading.innerHTML = '<span class="library-restore-spinner" aria-hidden="true"></span><p role="status">Opening your saved work…</p>';
  document.body.appendChild(loading);
  const oldStorageNotes = new Set([
    'Pictures and drawings stay in this browser session. Refreshing resets the work.',
    'Unfinished editor work resets on refresh. Finished work saved to My Library stays in this browser until its site data is cleared.'
  ]);
  for (const note of [...oldStorageNotes]) oldStorageNotes.add(window.ui?.translate(note) || note);
  for (const paragraph of document.querySelectorAll('#grownupContent p')) if (oldStorageNotes.has(paragraph.textContent)) {
    paragraph.textContent = 'Your edits save automatically in this browser. Use Home or Back to story to finish saving before leaving. Clearing site data removes saved work.';
  }
  const saveButton = $('#saveToLibrary'), status = $('#librarySaveStatus'), viewLink = $('#libraryViewLink');
  const profileId = currentProfileId();
  const params = new URLSearchParams(location.search);
  const requestedProject = params.get('project');
  if (!requestedProject) loading.querySelector('p').textContent = 'Getting your new coloring ready…';
  if (['three','creative'].includes(params.get('edition'))) { startMultiPage(); return; }
  // Monthly Goals opens a fresh attempt. Only an explicit Library project URL
  // resumes a prior one; a new visit must never silently replace older artwork.
  const attemptToken = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const projectId = requestedProject || `coloring-attempt:${profileId}:${attemptToken}`;
  let projectInAddress = !!requestedProject;
  let restoring = true, restoreFailure = null, record = null, expectedRevision = 0;
  let dirty = false, userEdited = false, demoOnly = false, editRevision = 0, completionRevision = -1;
  let timer = null, pending = null, saveState = 'loading', lastError = null, initialization, completionIntent = false;

  function currentProfileId() {
    try { return JSON.parse(localStorage.getItem('gp.reading.profile.v1'))?.id || 'local-reader'; }
    catch (_) { return 'local-reader'; }
  }
  function hasWriting() { return !!document.querySelector('.story-line.has-writing img'); }
  function hasWork() { return !demoOnly && !!window.sampleTest?.isReady() && (hasWriting() || (userEdited && window.sampleTest.hasArtworkChanges())); }
  function canPersist() { return !demoOnly && userEdited && (hasWork() || !!record); }
  function changedState() {
    const state = restoring ? 'loading' : pending ? 'saving' : saveState;
    saveControl.dataset.state = state;
    saveButton.disabled = restoring || !!pending || (!canPersist() && !lastError);
    saveButton.setAttribute('aria-busy', String(restoring || !!pending));
    saveButton.title = lastError ? 'Try saving again. You can also export your picture.' : 'Save your latest changes in this browser';
    $('#saveLibraryLabel').textContent = pending ? 'Saving…' : lastError ? 'Try saving again' : 'Save now';
    $('#libraryAutoSaveStatus').textContent = restoring ? 'Opening your book…' : pending ? 'Saving…' : lastError ? 'Save failed. Retry.' : demoOnly ? 'Practice design · not saved' : saveState === 'saved' ? 'All changes saved' : dirty ? 'Waiting to save…' : 'Your changes save automatically';
    document.dispatchEvent(new CustomEvent('autosave-state-change', { detail: { restoring, state, dirty, projectId, revision: expectedRevision, error: lastError?.message || null } }));
  }
  function message(text, error = false, canView = false) {
    feedback.hidden = false; feedback.dataset.error = String(error);
    status.textContent = text; status.dataset.error = String(error); viewLink.hidden = !canView;
    $('.library-feedback-mark').textContent = error ? '!' : '✓';
  }
  $('#dismissLibraryMessage').addEventListener('click', () => { feedback.hidden = true; });
  function cancelTimer() { if (timer) clearTimeout(timer); timer = null; }
  function schedule() {
    cancelTimer();
    if (!canPersist() || restoring || restoreFailure) return;
    timer = setTimeout(() => { timer = null; flush().catch(() => {}); }, DELAY);
  }
  function markEdit() {
    if (restoring) return;
    userEdited = true; demoOnly = false; dirty = true; editRevision++; completionRevision = -1;
    if (!record && !pending && !hasWork()) dirty = false;
    saveState = dirty ? 'ready' : 'empty'; lastError = null; feedback.hidden = true;
    changedState(); schedule();
  }
  document.addEventListener('artwork-edited', event => { if (event.detail?.changed === true) markEdit(); });
  document.addEventListener('handwriting-edited', event => { if (event.detail?.changed === true) markEdit(); });
  document.addEventListener('artwork-applied', event => { if (event.detail?.changed !== false) markEdit(); });
  document.addEventListener('paper-writing-applied', event => { if (event.detail?.changed === true || (event.detail?.changed === undefined && event.detail?.applied > 0)) markEdit(); });
  $('#example')?.addEventListener('click', () => {
    if (restoring) return;
    cancelTimer(); userEdited = false; demoOnly = true; dirty = false; editRevision++; completionRevision = -1;
    saveState = 'empty'; lastError = null; feedback.hidden = true; changedState();
  });

  function canvasBlob(canvas, type = 'image/png', quality) {
    return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Your picture could not be prepared. Please try again.')), type, quality));
  }
  function retainProjectAddress() {
    if (projectInAddress || !window.history?.replaceState) return;
    const next = new URLSearchParams(location.search);
    next.set('project', projectId);
    try {
      // Do this only AFTER a real save. A blank visit has no persisted item and
      // needs no resumable URL; a removed explicit project stays a hard error.
      window.history.replaceState(window.history.state, '', `?${next.toString()}${location.hash || ''}`);
      projectInAddress = true;
    } catch (_) {
      message('Saved to My Library. Use Continue there to reopen this attempt; this browser could not update the address.', false, true);
    }
  }
  // Freeze every source synchronously, before any PNG encoding/decoding awaits.
  // The preview and editable layers therefore describe the same edit revision.
  function captureCover(){
    window.sampleTest.redraw();const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=563;canvas.getContext('2d').drawImage($('#editor'),0,0);
    const thumbnail=document.createElement('canvas');thumbnail.width=480;thumbnail.height=270;thumbnail.getContext('2d').drawImage(canvas,0,0,480,270);
    return Promise.all([canvasBlob(canvas),canvasBlob(thumbnail,'image/jpeg',.88)]).then(([imageBlob,thumbnailBlob])=>({imageBlob,thumbnailBlob}));
  }
  function captureComposition(handwritingPromise, activityTitle = 'My coloring and handwriting') {
    window.sampleTest.redraw();
    const art = document.createElement('canvas'); art.width = 1000; art.height = 563;
    art.getContext('2d').drawImage($('#editor'), 0, 0);
    const lines = [...document.querySelectorAll('.story-line')].filter(row => !row.hidden).map(row => ({ id: row.id, text: row.querySelector('.line-print')?.textContent || row.textContent })).filter(row => row.text.trim());
    return (async () => {
      const handwriting = await handwritingPromise;
      const canvas = document.createElement('canvas'); canvas.width = 1500; canvas.height = 740;
      const context = canvas.getContext('2d');
      context.fillStyle = '#fffdf7'; context.fillRect(0, 0, 1500, 740);
      context.fillStyle = '#254e49'; context.font = 'bold 34px "Andika Literacy", sans-serif'; context.fillText('Bye-Bye Sugar Bugs!', 42, 65);
      context.font = '20px "Andika Literacy", sans-serif'; context.fillStyle = '#658277'; context.fillText(activityTitle, 42, 103);
      context.fillStyle = '#f2eee3'; context.fillRect(412, 140, 2, 563); context.drawImage(art, 438, 140, 1000, 563);
      for (let i = 0; i < lines.length; i++) {
        const rowTop = 185 + i * 116;
        const written = handwriting.lines.find(line => line.id === lines[i].id);
        if (written) {
          const image = new Image(), url = URL.createObjectURL(written.imageBlob);
          try {
            image.src = url; await image.decode();
            const scale = Math.min(326 / image.naturalWidth, 86 / image.naturalHeight);
            context.drawImage(image, 42, rowTop, image.naturalWidth * scale, image.naturalHeight * scale);
          } finally { URL.revokeObjectURL(url); }
        } else {   // not traced yet: the words in dotted outline, like the tracing guide
          context.font = '34px "Andika Literacy", sans-serif'; context.strokeStyle = '#4f6470'; context.lineWidth = 1.6; context.setLineDash([5, 3]);
          context.strokeText(lines[i].text, 42, rowTop + 55); context.setLineDash([]);
        }
      }
      const thumbnail = document.createElement('canvas'); thumbnail.width = 480; thumbnail.height = Math.round(480 * 740 / 1500);
      thumbnail.getContext('2d').drawImage(canvas, 0, 0, thumbnail.width, thumbnail.height);
      const [imageBlob, thumbnailBlob] = await Promise.all([canvasBlob(canvas), canvasBlob(thumbnail, 'image/jpeg', .88)]);
      return { imageBlob, thumbnailBlob, pages: [{ id: 'spread-1', title: activityTitle, imageBlob, layout: 'spread' }] };
    })();
  }

  async function saveLoop() {
    while (dirty && canPersist()) {
      if (restoreFailure) throw restoreFailure;
      if (currentProfileId() !== profileId) throw new Error('The local profile changed in another tab. Export your picture, then reopen this book from Home.');
      const capturedRevision = editRevision;
      const completed = completionRevision === capturedRevision && hasWork();
      // Engine exporters clone their canvases immediately. No editing lock is
      // needed while encoding; edits during the await are saved on the next pass.
      const drawingPromise = window.sampleTest.exportState();
      const handwritingPromise = window.handwriting.exportState();
      const previewPromise = captureComposition(handwritingPromise);
      const [drawing, handwriting, images] = await Promise.all([drawingPromise, handwritingPromise, previewPromise]);
      if (currentProfileId() !== profileId) throw new Error('The local profile changed. Export your picture, then reopen your own book.');
      // An edit (or a practice-design reset) during encoding invalidates this
      // snapshot, especially an older Done request. Capture the latest instead.
      if (editRevision !== capturedRevision) continue;
      const saved = await window.GPLibrary.save({
        id: projectId, expectedRevision, profileId, bookId: BOOK_ID, title: 'Bye-Bye Sugar Bugs!', type: 'coloring', ...images,
        activityUrl: `coloring/index.html?mode=color&project=${encodeURIComponent(projectId)}`,
        editableState: { kind: 'sugar-bugs-v1', version: 1, drawing, handwriting },
        metadata: { hasHandwriting: handwriting.lines.length > 0, localOnly: true, status: completed ? 'completed' : 'in-progress', bookCompleted: completed, completedPages: completed ? 1 : 0, totalPages: 1 }
      });
      record = saved; expectedRevision = saved.revision; retainProjectAddress();
      if (editRevision === capturedRevision) dirty = false;
      // A practice design never replaces a child's previous saved draft.
      if (demoOnly) dirty = false;
    }
    if (!record && !hasWork()) dirty = false;
    return record;
  }
  async function flush(options = {}) {
    cancelTimer();
    if (restoring) await initialization;
    if (options.manual && restoreFailure && !userEdited) {
      restoring = true; restoreFailure = null; lastError = null;
      changedState(); initialization = initialize(); await initialization;
      if (restoreFailure) throw restoreFailure;
      return record;
    }
    if (options.complete === true && hasWork() && userEdited && !demoOnly) {
      completionRevision = ++editRevision; dirty = true;
    }
    if (pending) { await pending; return dirty && canPersist() ? flush() : record; }
    if (!dirty || !canPersist()) {
      if (lastError && restoreFailure && userEdited) throw lastError;
      return record;
    }
    saveState = 'saving'; lastError = null;
    // Promise.resolve makes pending visible before the worker starts.
    pending = Promise.resolve().then(saveLoop);
    changedState();
    try {
      const saved = await pending; saveState = dirty ? 'ready' : record ? 'saved' : 'empty';
      if (options.manual) message('Saved! Your latest changes are safe in this browser.', false, true);
      return saved;
    } catch (error) {
      saveState = 'error'; lastError = error;
      message(error.code === 'REVISION_CONFLICT' ? error.message : `${error.message || 'Your work could not be saved.'} Your picture is still here. Try saving again or use Save my picture to export a backup.`, true);
      throw error;
    } finally { pending = null; changedState(); }
  }
  saveButton.addEventListener('click', () => flush({ manual: true }).catch(() => {}));
  for (const button of [$('#finish'), $('#studioFinish')]) button?.addEventListener('click', () => {
    completionIntent = !button.disabled && hasWork() && userEdited && !demoOnly;
  }, true);
  document.addEventListener('book-mode-change', event => {
    if (restoring) return;
    if (event.detail?.mode === 'move') {
      const complete = completionIntent; completionIntent = false;
      flush({ complete }).catch(() => {});
    }
    else changedState();
  });
  $('#studioClose')?.addEventListener('click', () => { if (!restoring) flush().catch(() => {}); });
  $('#coloringStudio')?.addEventListener('cancel', () => { if (!restoring) flush().catch(() => {}); });
  $('#libraryHomeLink').addEventListener('click', async event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    try { await flush(); location.href = $('#libraryHomeLink').href; } catch (_) { /* Stay with the unsaved drawing and visible recovery message. */ }
  });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush().catch(() => {}); });
  window.addEventListener('pagehide', () => { flush().catch(() => {}); });
  window.GPAutoSave = Object.freeze({
    flush, isRestoring: () => restoring,
    getPageInfo: () => ({ pages: [{ id: 'treats', title: 'My coloring and handwriting', completed: record?.metadata?.bookCompleted === true }], activeIndex: 0, completedPages: record?.metadata?.bookCompleted === true ? 1 : 0, busy: restoring || !!pending, multiPage: false }),
    switchPage: async () => false,
    getState: () => ({ restoring, dirty, projectId, revision: expectedRevision, state: saveState, hasRecord: !!record, error: lastError?.message || null })
  });

  async function waitForEngines() {
    const started = Date.now();
    while (!window.sampleTest?.isReady() || !window.sampleTest.exportState || !window.handwriting?.exportState) {
      if (Date.now() - started > 20000) throw new Error('The coloring tools could not finish opening. Please refresh this local page.');
      await new Promise(resolve => setTimeout(resolve, 60));
    }
    await window.handwriting.ready;
    if (document.fonts?.ready) await document.fonts.ready;
  }
  async function initialize() {
    document.body.appendChild(loading);
    $('main').inert = true; header.inert = true; document.body.classList.add('library-restoring');
    let backup;
    try {
      await waitForEngines();
      // A normal entry intentionally does not look up any stable/prior project.
      const stored = requestedProject ? await window.GPLibrary.get(projectId) : null;
      if (currentProfileId() !== profileId) throw new Error('The local profile changed while opening. Please reopen this book from Home.');
      if (requestedProject && !stored) throw new Error('This saved book was removed or cannot be found. Return Home to choose another activity.');
      if (stored) {
        if (stored.profileId !== profileId || stored.bookId !== BOOK_ID || stored.editableState?.kind !== 'sugar-bugs-v1' || stored.editableState.version !== 1) throw new Error('This saved item cannot be continued in this editor. Its original library picture has not been changed.');
        backup = await Promise.all([window.sampleTest.exportState(), window.handwriting.exportState()]);
        await window.sampleTest.importState(stored.editableState.drawing);
        await window.handwriting.importState(stored.editableState.handwriting);
        if (currentProfileId() !== profileId) throw new Error('The local profile changed while restoring. Please reopen your own book from Home.');
        record = stored; expectedRevision = stored.revision || 0; userEdited = true; saveState = 'saved';
      } else saveState = 'empty';
    } catch (error) {
      if (backup) { try { await window.sampleTest.importState(backup[0]); await window.handwriting.importState(backup[1]); } catch (_) {} }
      restoreFailure = error; lastError = error; saveState = 'error';
      message(`${error.message} No saved work was overwritten. Export any new drawing before refreshing.`, true);
    } finally {
      restoring = false; $('main').inert = false; header.inert = false;
      document.body.classList.remove('library-restoring'); loading.remove(); changedState();
      if (params.get('mode') === 'color' && window.sampleTest?.isReady() && window.storybook) window.storybook.show('color');
    }
  }
  /* New three-activity edition. Deliberately separate from the V1 path above:
     old saved books never acquire pages or have their schema rewritten. */
  function startMultiPage() {
    const creative=params.get('edition')==='creative',edition=creative?'creative':'three';
    const configs = (creative?window.GPBookPages?.creativePages:window.GPBookPages?.pages) || [];
    const token = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const id = requestedProject || `coloring-attempt:${profileId}:${token}`;
    let addressHasProject = !!requestedProject, activeIndex = 0, savedRecord = null, expected = 0;
    let states = new Map(), snapshots = new Map();
    let restoringPage = true, switching = false, restoreError = null, error = null, state = 'loading';
    let dirtyPage = false, dirtyVisit = false, dirtyBook = false, edited = false, demo = false, revision = 0, complete = false, doneIntent = false;
    let debounce = null, saving = null, initialized;
    const active = () => configs[activeIndex];
    const busy = () => restoringPage || switching || !!saving;
    const content = () => !demo && !!window.sampleTest?.isReady() && (hasWriting() || (edited && window.sampleTest.hasArtworkChanges()));
    const canSave = () => (dirtyPage && !demo && (content() || states.has(active()?.id))) || (dirtyVisit && !!savedRecord);
    const progress = () => configs.filter(config => states.get(config.id)?.completed === true).length;
    function info() {
      return { pages: configs.map(config => ({ id: config.id, title: config.title, completed: states.get(config.id)?.completed === true })), activeIndex, completedPages: progress(), busy: busy(), multiPage: true,edition };
    }
    function update() {
      saveControl.dataset.state = restoringPage || switching ? 'loading' : saving ? 'saving' : state;
      saveButton.disabled = busy() || (!canSave() && !error);
      saveButton.setAttribute('aria-busy', String(busy()));
      saveButton.title = error ? 'Try saving again. You can also export your picture.' : 'Save your latest changes in this browser';
      $('#saveLibraryLabel').textContent = saving ? 'Saving…' : error ? 'Try saving again' : 'Save now';
      $('#libraryAutoSaveStatus').textContent = restoringPage ? 'Opening your book…' : switching ? 'Opening the next activity…' : saving ? 'Saving…' : error ? 'Save failed. Retry.' : demo ? 'Practice design · not saved' : dirtyBook ? 'Waiting to save…' : savedRecord ? 'All changes saved' : 'Your changes save automatically';
      document.dispatchEvent(new CustomEvent('autosave-state-change', { detail: { restoring: restoringPage || switching, state, dirty: dirtyBook, projectId: id, revision: expected, error: error?.message || null, ...info() } }));
    }
    function lock(value, text = 'Opening the next activity…') {
      $('main').inert = value; header.inert = value;
      for (const selector of ['#coloringStudio', '#writingDialog', '#editor', '#traceInk']) { const node = $(selector); if (node) node.inert = value; }
      document.body.classList[value ? 'add' : 'remove']('library-restoring');
      if (value) {
        loading.querySelector('p').textContent = text;
        const studio = $('#coloringStudio'); (studio?.open ? studio : document.body).appendChild(loading);
      } else loading.remove();
    }
    function cancel() { if (debounce) clearTimeout(debounce); debounce = null; }
    function queue() {
      cancel();
      if (!canSave() || restoringPage || switching || restoreError) return;
      debounce = setTimeout(() => { debounce = null; flushMulti().catch(() => {}); }, DELAY);
    }
    function fail(problem) {
      error = problem; state = 'error';
      message(problem.code === 'REVISION_CONFLICT' ? problem.message : `${problem.message || 'Your work could not be saved.'} Your picture is still here. Try saving again or use Save my picture to export a backup.`, true);
    }
    function mark() {
      if (restoringPage || switching) return;
      edited = true; demo = false; dirtyPage = true; dirtyBook = true; complete = false; revision++;
      const previous = states.get(active()?.id);
      if (previous?.completed) states.set(previous.id, { ...previous, completed: false });
      if (!states.has(active()?.id) && !saving && !content()) dirtyPage = false;
      dirtyBook = dirtyPage || dirtyVisit;
      state = dirtyBook ? 'ready' : savedRecord ? 'saved' : 'empty'; error = null; feedback.hidden = true; update(); queue();
    }
    document.addEventListener('artwork-edited', event => { if (event.detail?.changed === true) mark(); });
    document.addEventListener('handwriting-edited', event => { if (event.detail?.changed === true) mark(); });
    document.addEventListener('artwork-applied', event => { if (event.detail?.changed !== false) mark(); });
    document.addEventListener('paper-writing-applied', event => { if (event.detail?.changed === true || (event.detail?.changed === undefined && event.detail?.applied > 0)) mark(); });
    $('#example')?.addEventListener('click', () => {
      if (restoringPage || switching) return;
      cancel(); edited = false; demo = true; dirtyPage = false; dirtyBook = dirtyVisit; complete = false; revision++;
      const previous = creative&&active()?.id==='cover-title'?savedRecord?.editableState?.cover:savedRecord?.editableState?.pages?.find(page => page.id === active()?.id);
      if (previous) states.set(previous.id, { ...previous }); else states.delete(active()?.id);
      error = null; state = 'empty'; feedback.hidden = true; update();
    });
    $('#dismissLibraryMessage').addEventListener('click', () => { feedback.hidden = true; });
    function retainAddress() {
      if (addressHasProject || !window.history?.replaceState) return;
      const next = new URLSearchParams(location.search); next.set('project', id); next.set('edition', edition);
      try { window.history.replaceState(window.history.state, '', `?${next.toString()}${location.hash || ''}`); addressHasProject = true; }
      catch (_) { message('Saved to My Library. Use Continue there to reopen this attempt; this browser could not update the address.', false, true); }
    }
    async function saveMultiLoop() {
      while (dirtyBook && canSave()) {
        if (restoreError) throw restoreError;
        if (currentProfileId() !== profileId) throw new Error('The local profile changed. Export your picture, then reopen your own book.');
        const captured = revision, config = active(), candidates = new Map(states), previews = new Map(snapshots);
        const capturePage = dirtyPage && !demo && (content() || states.has(config.id));
        let images;
        if (capturePage) {
          const drawingPromise = window.sampleTest.exportState(), writingPromise = window.handwriting.exportState();
          const previewPromise = creative&&config.cover?captureCover():captureComposition(writingPromise, config.title);
          const [drawing, handwriting, picture] = await Promise.all([drawingPromise, writingPromise, previewPromise]);
          images = picture;
          if (captured !== revision) continue;
          candidates.set(config.id, { id: config.id, completed: complete && content() && (!creative||window.sampleTest.getCompletionStatus().canFinish), drawing, handwriting });
          previews.set(config.id, { id: config.id, title: config.title, imageBlob: picture.imageBlob, layout: 'spread' });
        }
        if (captured !== revision) continue;
        if (currentProfileId() !== profileId) throw new Error('The local profile changed. Export your picture, then reopen your own book.');
        const allPages = configs.filter(page => candidates.has(page.id)).map(page => candidates.get(page.id));
        const pages = creative?allPages.filter(page=>page.id!=='cover-title'):allPages;
        const imagePages = configs.filter(page => candidates.has(page.id)&&(!creative||!page.cover)).map(page => previews.get(page.id));
        if (!allPages.length) { dirtyPage = false; dirtyVisit = false; dirtyBook = false; break; }
        if (imagePages.some(page => !(page?.imageBlob instanceof Blob))) throw new Error('A saved activity picture is missing. Your existing book has not been overwritten.');
        const count = allPages.filter(page => page.completed).length, finished = count === configs.length;
        const result = await window.GPLibrary.save({
          id, expectedRevision: expected, profileId, bookId: BOOK_ID, title: 'Bye-Bye Sugar Bugs!', type: 'coloring',
          imageBlob: images?.imageBlob || savedRecord?.imageBlob, thumbnailBlob: images?.thumbnailBlob || savedRecord?.thumbnailBlob,
          ...(creative&&previews.get('cover-title')?{coverBlob:previews.get('cover-title').imageBlob}:{}),
          pages: imagePages, activityUrl: `coloring/index.html?mode=color&edition=${edition}&project=${encodeURIComponent(id)}`,
          editableState: creative?{kind:'sugar-bugs-v3',version:3,pages,...(candidates.has('cover-title')?{cover:candidates.get('cover-title')}:{}),activePageId:config.id,lastVisitedPageId:config.id}:{ kind: 'sugar-bugs-v2', version: 2, pages, activePageId: config.id, lastVisitedPageId: config.id },
          metadata: { hasHandwriting: pages.some(page => page.handwriting.lines.length > 0), localOnly: true, status: finished ? 'completed' : 'in-progress', bookCompleted: finished, completedPages: count, totalPages: configs.length }
        });
        savedRecord = result; expected = result.revision; states = candidates; snapshots = previews; retainAddress();
        if (captured === revision) { dirtyPage = false; dirtyVisit = false; dirtyBook = false; complete = false; }
        else if (dirtyPage && states.has(active().id)) states.set(active().id, { ...states.get(active().id), completed: false });
        if (demo) { dirtyPage = false; dirtyBook = dirtyVisit; }
      }
      if (!states.has(active()?.id) && !content()) dirtyPage = false;
      dirtyBook = dirtyPage || (dirtyVisit && !!savedRecord);
      return savedRecord;
    }
    async function flushMulti(options = {}) {
      cancel(); if (restoringPage) await initialized;
      if (options.manual && restoreError && !edited) {
        restoringPage = true; restoreError = null; error = null; update(); initialized = initializeMulti(); await initialized;
        if (restoreError) throw restoreError; return savedRecord;
      }
      if (options.complete && edited && content() && !demo && (!creative||window.sampleTest.getCompletionStatus().canFinish)) { complete = true; dirtyPage = true; dirtyBook = true; revision++; }
      if (saving) { await saving; return dirtyBook && canSave() ? flushMulti() : savedRecord; }
      if (!dirtyBook || !canSave()) { if (restoreError && edited) throw restoreError; return savedRecord; }
      error = null; state = 'saving'; saving = Promise.resolve().then(saveMultiLoop); update();
      try { const result = await saving; state = dirtyBook ? 'ready' : result ? 'saved' : 'empty'; if (options.manual) message('Saved! Your latest changes are safe in this browser.', false, true); return result; }
      catch (problem) { fail(problem); throw problem; }
      finally { saving = null; update(); }
    }
    async function load(config, value) {
      await window.sampleTest.loadScene(config);
      await window.handwriting.setPageLines(config.lines);
      if (value) { await window.sampleTest.importState(value.drawing); await window.handwriting.importState(value.handwriting); }
      const original = $('#originalScene'); if (original) { original.src = creative?window.sampleTest.getPreviewDataURL():config.original; original.alt = config.title; }
      $('#editor')?.setAttribute('aria-label', `Coloring picture: ${config.title}`);
    }
    function activityChanged() {
      document.dispatchEvent(new CustomEvent('book-activity-change', { detail: { page: active(), index: activeIndex, pages: info().pages, multiPage: true } }));
    }
    async function switchPage(value) {
      const target = typeof value === 'number' && Number.isInteger(value) ? value : configs.findIndex(page => page.id === value);
      if (target < 0 || target >= configs.length || target === activeIndex || restoringPage || switching) return false;
      switching = true; lock(true); update();
      const previousIndex = activeIndex;
      let backup, previousFlags;
      try {
        await flushMulti();
        previousFlags = { edited, demo, dirtyPage, dirtyVisit, dirtyBook, complete, doneIntent };
        backup = await Promise.all([window.sampleTest.exportState(), window.handwriting.exportState()]);
        await load(configs[target], states.get(configs[target].id));
        if (currentProfileId() !== profileId) throw new Error('The local profile changed while opening an activity. Please reopen your own book from Home.');
        activeIndex = target; edited = states.has(active().id); demo = false; dirtyPage = false; complete = false; doneIntent = false;
        error = null; state = savedRecord ? 'saved' : 'empty';
        if (savedRecord) { dirtyVisit = true; dirtyBook = true; revision++; await flushMulti(); }
        else { dirtyVisit = false; dirtyBook = false; }
        activityChanged(); return true;
      } catch (problem) {
        activeIndex = previousIndex;
        if (backup) {
          try { await load(configs[previousIndex], { drawing: backup[0], handwriting: backup[1] }); }
          catch (_) { restoreError = new Error('This activity could not be restored safely. Export your picture before refreshing.'); }
          ({ edited, demo, dirtyPage, dirtyVisit, dirtyBook, complete, doneIntent } = previousFlags);
        }
        fail(problem); throw problem;
      } finally { switching = false; lock(false); update(); }
    }
    function checkStored(stored) {
      const value = stored.editableState, known = new Set(configs.map(page => page.id));
      if (stored.profileId !== profileId || stored.bookId !== BOOK_ID || value?.kind !== (creative?'sugar-bugs-v3':'sugar-bugs-v2') || value.version !== (creative?3:2)) throw new Error('This saved item belongs to a different book edition. Its original library picture has not been changed.');
      if (!Array.isArray(value.pages) || (!value.pages.length&&!(creative&&value.cover)) || value.pages.length > (creative?3:configs.length) || new Set(value.pages.map(page => page.id)).size !== value.pages.length || value.pages.some(page => !known.has(page.id) || page.id==='cover-title' || typeof page.completed !== 'boolean') || !known.has(value.activePageId) || !known.has(value.lastVisitedPageId)) throw new Error('This saved activity book is not supported. Its original work has not been changed.');
      if(creative&&value.cover&&(value.cover.id!=='cover-title'||typeof value.cover.completed!=='boolean'||!(stored.coverBlob instanceof Blob)||!stored.coverBlob.size))throw new Error('The saved book cover is missing. Your original work has not been changed.');
      if (!Array.isArray(stored.pages) || stored.pages.length !== value.pages.length || new Set(stored.pages.map(page => page.id)).size !== stored.pages.length) throw new Error('The saved activity pictures do not match this edition. Your original work has not been changed.');
      const previews = new Map(stored.pages.map(page => [page.id, page]));
      if (value.pages.some(page => !(previews.get(page.id)?.imageBlob instanceof Blob) || !previews.get(page.id).imageBlob.size)) throw new Error('A saved activity picture is missing. Your original work has not been changed.');
      if(creative&&value.cover)previews.set('cover-title',{id:'cover-title',title:'My book cover',imageBlob:stored.coverBlob,layout:'spread'});
      return { value, previews };
    }
    async function initializeMulti() {
      lock(true, requestedProject ? 'Opening your saved work…' : 'Getting your new coloring ready…');
      let backup;
      try {
        await waitForEngines();
        if (configs.length !== (creative?4:3) || !window.sampleTest.loadScene || !window.handwriting.setPageLines) throw new Error('The activity pages could not finish opening. Please refresh this page.');
        const stored = requestedProject ? await window.GPLibrary.get(id) : null;
        if (currentProfileId() !== profileId) throw new Error('The local profile changed while opening. Please reopen this book from Home.');
        if (requestedProject && !stored) throw new Error('This saved book was removed or cannot be found. Return Home to choose another activity.');
        let target = 0, prepared;
        if (stored) {
          prepared = checkStored(stored);
          states = new Map([...prepared.value.pages,...(creative&&prepared.value.cover?[prepared.value.cover]:[])].map(page => [page.id, { ...page }])); snapshots = prepared.previews;
          const last = configs.findIndex(page => page.id === prepared.value.lastVisitedPageId);
          target = last >= 0 && !states.get(configs[last].id)?.completed ? last : configs.findIndex(page => !states.get(page.id)?.completed);
          if (target < 0) target = Math.max(0, configs.findIndex(page => page.id === prepared.value.activePageId));
        }
        backup = await Promise.all([window.sampleTest.exportState(), window.handwriting.exportState()]);
        await load(configs[target], states.get(configs[target].id));
        if (currentProfileId() !== profileId) throw new Error('The local profile changed while restoring. Please reopen your own book from Home.');
        activeIndex = target; savedRecord = stored; expected = stored?.revision || 0; edited = states.has(active().id);
        dirtyPage = false; dirtyVisit = false; dirtyBook = false; complete = false; demo = false; state = stored ? 'saved' : 'empty';
        activityChanged();
      } catch (problem) {
        if (backup && configs[0]) { try { await load(configs[0], { drawing: backup[0], handwriting: backup[1] }); } catch (_) {} }
        states = new Map(); snapshots = new Map(); activeIndex = 0; restoreError = problem; error = problem; state = 'error';
        message(`${problem.message} No saved work was overwritten. Export any new drawing before refreshing.`, true);
      } finally { restoringPage = false; lock(false); update(); if (params.get('mode') === 'color' && window.sampleTest?.isReady() && window.storybook) window.storybook.show('color'); }
    }
    saveButton.addEventListener('click', () => flushMulti({ manual: true }).catch(() => {}));
    for (const button of [$('#finish'), $('#studioFinish')]) button?.addEventListener('click', () => { doneIntent = !button.disabled && edited && content() && !demo && (!creative||window.sampleTest.getCompletionStatus().canFinish); }, true);
    document.addEventListener('book-mode-change', event => {
      if (restoringPage || switching) return;
      if (event.detail?.mode === 'move') { const finish = doneIntent; doneIntent = false; flushMulti({ complete: finish }).catch(() => {}); }
      else update();
    });
    $('#studioClose')?.addEventListener('click', () => { if (!restoringPage && !switching) flushMulti().catch(() => {}); });
    $('#coloringStudio')?.addEventListener('cancel', () => { if (!restoringPage && !switching) flushMulti().catch(() => {}); });
    $('#libraryHomeLink').addEventListener('click', async event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); try { await flushMulti(); location.href = $('#libraryHomeLink').href; } catch (_) {}
    });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushMulti().catch(() => {}); });
    window.addEventListener('pagehide', () => { flushMulti().catch(() => {}); });
    window.GPAutoSave = Object.freeze({ flush: flushMulti, isRestoring: () => restoringPage || switching, getPageInfo: info, switchPage,
      getState: () => ({ restoring: restoringPage || switching, dirty: dirtyBook, projectId: id, revision: expected, state, hasRecord: !!savedRecord, error: error?.message || null, ...info() }) });
    update(); initialized = initializeMulti();
  }
  changedState();
  initialization = initialize();
})();
