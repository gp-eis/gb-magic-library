/* Browser-only artwork storage. No account, server, upload, or hosted Site calls. */
(() => {
  'use strict';
  const DB_NAME = 'gp-reading-library-local-v1';
  const STORE = 'artworks';
  const UPDATE_KEY = 'gp.reading.library.updated';
  const SNAPSHOT_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
  const PART_IDS = new Set(['donut', 'candy', 'soda']);
  const LINE_IDS = new Set(['line-yum', 'line-donut', 'line-candy', 'line-yum-again']);
  const TOOLS = new Set(['brush', 'pencil', 'marker', 'crayon', 'fill', 'erase']);
  let databasePromise;

  function snapshotImage(blob, label) {
    if (!(blob instanceof Blob) || !blob.size || !SNAPSHOT_TYPES.has(blob.type.toLowerCase().split(';')[0])) {
      throw new Error(`${label} must be a saved PNG, JPEG, WebP, or GIF picture. SVG pages are not supported.`);
    }
    return blob;
  }

  function pageText(value, fallback, maximum) {
    if (value == null || value === '') return fallback;
    if (typeof value !== 'string' && typeof value !== 'number') throw new Error('Page names and IDs must be plain text.');
    return String(value).replace(/\0/g, '').trim().slice(0, maximum) || fallback;
  }

  function normalizePages(pages, allowEmpty = false) {
    if (!Array.isArray(pages) || (!pages.length && !allowEmpty) || pages.length > 100) {
      throw new Error('A storybook needs between 1 and 100 completed picture pages.');
    }
    const ids = new Set();
    return pages.map((page, index) => {
      if (!page || typeof page !== 'object' || Array.isArray(page)) throw new Error('Each storybook page needs an actual saved picture.');
      const id = pageText(page.id, `page-${index + 1}`, 120);
      if (ids.has(id)) throw new Error('Each storybook page needs its own unique ID.');
      ids.add(id);
      const layout = page.layout == null ? 'page' : page.layout;
      if (!['page', 'spread'].includes(layout)) throw new Error('A storybook page layout must be page or spread.');
      return {
        id, title: pageText(page.title, `Page ${index + 1}`, 240),
        imageBlob: snapshotImage(page.imageBlob, `Page ${index + 1}`), layout
      };
    });
  }

  function pngState(blob) {
    if (!(blob instanceof Blob) || blob.type !== 'image/png' || !blob.size || blob.size > 16 * 1024 * 1024) {
      throw new Error('Editable drawing layers must be non-empty PNG pictures no larger than 16 MB.');
    }
    return blob;
  }

  function normalizeEditableState(state, allowedParts = PART_IDS) {
    if (state?.kind === 'sugar-bugs-v3') {
      const sceneParts = {'cover-title':new Set(['title-top','title-middle','title-bottom']),treats:PART_IDS,'sugar-bugs':new Set(['bug-round','bug-long','tooth']),toothache:PART_IDS};
      if (state.version !== 3 || !Array.isArray(state.pages) || state.pages.length > 3 || typeof state.activePageId !== 'string' || typeof state.lastVisitedPageId !== 'string' || !Object.hasOwn(sceneParts,state.activePageId) || !Object.hasOwn(sceneParts,state.lastVisitedPageId)) throw new Error('This creative book is not supported.');
      const cleanPage = (page, cover = false) => {
        if (!page || typeof page.id !== 'string' || (page.id === 'cover-title') !== cover || !Object.hasOwn(sceneParts,page.id) || typeof page.completed !== 'boolean') throw new Error('Each creative activity needs a known page and completion state.');
        const cleaned = normalizeEditableState({kind:'sugar-bugs-v1',version:1,drawing:page.drawing,handwriting:page.handwriting},sceneParts[page.id]);
        const required = cover ? [] : page.id === 'toothache' ? ['line-yum','line-donut','line-candy'] : [...LINE_IDS];
        if (cleaned.handwriting.lines.some(line => !required.includes(line.id)) || cleaned.handwriting.activeLineId != null && !required.includes(cleaned.handwriting.activeLineId)) throw new Error('This creative page contains handwriting for an unavailable line.');
        if (page.completed && required.some(id => !cleaned.handwriting.lines.some(line => line.id === id))) throw new Error('Finish every story line before completing this activity.');
        return {id:page.id,completed:page.completed,drawing:cleaned.drawing,handwriting:cleaned.handwriting};
      };
      const cover = state.cover === undefined ? undefined : cleanPage(state.cover,true);
      const ids = new Set();
      const pages = state.pages.map(page => {
        if (ids.has(page?.id)) throw new Error('Each creative activity needs its own unique page.');
        const clean = cleanPage(page); ids.add(clean.id); return clean;
      });
      if (!cover && !pages.length) throw new Error('Save actual cover or story work before creating this book.');
      const result = {kind:'sugar-bugs-v3',version:3,activePageId:state.activePageId,lastVisitedPageId:state.lastVisitedPageId,pages};
      if (cover) result.cover = cover;
      return result;
    }
    if (state?.kind === 'sugar-bugs-v2') {
      const sceneParts = {treats:PART_IDS,'sugar-bugs':new Set(['bug-round','bug-long','tooth']),toothache:PART_IDS};
      if (state.version !== 2 || !Array.isArray(state.pages) || !state.pages.length || state.pages.length > 3 || !Object.hasOwn(sceneParts,state.activePageId) || !Object.hasOwn(sceneParts,state.lastVisitedPageId)) throw new Error('This multi-page book is not supported.');
      const ids = new Set();
      const pages = state.pages.map(page => {
        if (!page || !Object.hasOwn(sceneParts,page.id) || ids.has(page.id) || typeof page.completed !== 'boolean') throw new Error('Each saved activity needs a known, unique page and completion state.');
        ids.add(page.id);
        const cleaned = normalizeEditableState({kind:'sugar-bugs-v1',version:1,drawing:page.drawing,handwriting:page.handwriting},sceneParts[page.id]);
        return {id:page.id,completed:page.completed,drawing:cleaned.drawing,handwriting:cleaned.handwriting};
      });
      return {kind:'sugar-bugs-v2',version:2,activePageId:state.activePageId,lastVisitedPageId:state.lastVisitedPageId,pages};
    }
    if (!state || state.kind !== 'sugar-bugs-v1' || state.version !== 1) throw new Error('This editable book format is not supported.');
    const drawing = state.drawing, writing = state.handwriting;
    if (!drawing || drawing.version !== 1 || !['draw', 'photo'].includes(drawing.mode) || !Array.isArray(drawing.parts) || drawing.parts.length !== 3) throw new Error('This book needs its three editable drawing layers.');
    const partIds = new Set();
    const parts = drawing.parts.map(part => {
      if (!part || !allowedParts.has(part.id) || partIds.has(part.id)) throw new Error('The editable drawing contains an unknown or duplicate treat.');
      partIds.add(part.id);
      return { id: part.id, imageBlob: pngState(part.imageBlob) };
    });
    if (!TOOLS.has(drawing.tool) || typeof drawing.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(drawing.color) || !Number.isFinite(drawing.size) || drawing.size < 1 || drawing.size > 96) throw new Error('The saved painting tool is not valid.');
    if (!writing || writing.version !== 1 || !Array.isArray(writing.lines) || writing.lines.length > 4) throw new Error('The saved handwriting is not valid.');
    const lineIds = new Set();
    const lines = writing.lines.map(line => {
      if (!line || !LINE_IDS.has(line.id) || lineIds.has(line.id) || !['screen', 'paper'].includes(line.source)) throw new Error('The saved handwriting contains an unknown or duplicate line.');
      lineIds.add(line.id);
      const result = { id: line.id, source: line.source, imageBlob: pngState(line.imageBlob) };
      if (line.rawBlob !== undefined) result.rawBlob = pngState(line.rawBlob);
      return result;
    });
    const handwriting = { version: 1, lines };
    if (writing.activeLineId != null) {
      if (!LINE_IDS.has(writing.activeLineId)) throw new Error('The saved handwriting line is not supported.');
      handwriting.activeLineId = writing.activeLineId;
    }
    return { kind: 'sugar-bugs-v1', version: 1, drawing: { version: 1, mode: drawing.mode, parts, tool: drawing.tool, color: drawing.color, size: drawing.size }, handwriting };
  }

  function revisionConflict() {
    const error = new Error('This book was changed or removed in another tab. Your work is still here. Export your picture before reopening the latest copy.');
    error.code = 'REVISION_CONFLICT';
    return error;
  }

  function openDatabase() {
    if (!('indexedDB' in window)) return Promise.reject(new Error('This browser cannot save the library. Please use a regular browser window.'));
    if (!databasePromise) databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE)) {
          const store = database.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('profileId', 'profileId', { unique: false });
        }
      };
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => { database.close(); databasePromise = null; };
        resolve(database);
      };
      request.onerror = () => { databasePromise = null; reject(new Error('The library could not open. Browser storage may be blocked.')); };
      request.onblocked = () => { databasePromise = null; reject(new Error('Please close other copies of this local page, then try saving again.')); };
    });
    return databasePromise;
  }

  function transactionResult(database, mode, operation) {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, mode);
      let value;
      transaction.oncomplete = () => resolve(value);
      transaction.onerror = () => reject(new Error('The library could not save this work. Check that your browser has free storage.'));
      transaction.onabort = () => reject(new Error('The library operation was cancelled. Please try again.'));
      try {
        const request = operation(transaction.objectStore(STORE));
        request.onsuccess = () => { value = request.result; };
      } catch (error) { transaction.abort(); reject(error); }
    });
  }

  function notify() {
    const updatedAt = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try { localStorage.setItem(UPDATE_KEY, updatedAt); } catch (_) { /* IndexedDB can still work when localStorage is blocked. */ }
    window.dispatchEvent(new CustomEvent('gp-library-updated', { detail: { updatedAt } }));
  }

  async function get(id) {
    if (typeof id !== 'string' || !id) return null;
    const result = await transactionResult(await openDatabase(), 'readonly', store => store.get(id));
    return result || null;
  }

  async function list(profileId = 'local-reader') {
    const records = await transactionResult(await openDatabase(), 'readonly', store => store.index('profileId').getAll(String(profileId)));
    return records.sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)));
  }

  async function save(input) {
    if (!input || !(input.imageBlob instanceof Blob) || !input.imageBlob.type.startsWith('image/')) {
      throw new Error('An actual saved picture is required for My Library.');
    }
    if (!input.bookId || !input.title) throw new Error('The activity needs a book ID and title before it can be saved.');
    if (input.expectedRevision !== undefined && (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 0)) throw new Error('The expected saved revision is not valid.');
    const suppliedEditable = input.editableState === undefined ? undefined : normalizeEditableState(input.editableState);
    // V3 can contain a real painted cover before any interior snapshot exists.
    // Validate the empty-page exception against the final edition inside the write.
    const suppliedPages = input.pages === undefined ? undefined : normalizePages(input.pages, true);
    const suppliedCover = input.coverBlob == null ? input.coverBlob : snapshotImage(input.coverBlob, 'The storybook cover');
    const now = new Date().toISOString();
    const id = input.id || (window.crypto?.randomUUID?.() || `art-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const database = await openDatabase();
    // The lookup, revision check and write share ONE readwrite transaction.
    // A stale tab cannot overwrite a newer revision or resurrect a removed book.
    const record = await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, 'readwrite');
      const store = transaction.objectStore(STORE);
      let result, failure;
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(failure || new Error('The library could not save this work. Check that your browser has free storage.'));
      transaction.onabort = () => reject(failure || new Error('The library operation was cancelled. Please try again.'));
      const request = store.get(id);
      request.onsuccess = () => {
        try {
          const previous = request.result;
          if (input.expectedRevision !== undefined && (input.expectedRevision === 0 ? !!previous : !previous || (previous.revision || 0) !== input.expectedRevision)) throw revisionConflict();
          result = {
            id,
            profileId: String(input.profileId || 'local-reader'),
            bookId: String(input.bookId), title: String(input.title),
            type: String(input.type || 'coloring'),
            imageBlob: input.imageBlob,
            thumbnailBlob: input.thumbnailBlob instanceof Blob ? input.thumbnailBlob : input.imageBlob,
            createdAt: previous?.createdAt || input.createdAt || now,
            updatedAt: now,
            revision: (previous?.revision || 0) + 1,
            activityUrl: typeof input.activityUrl === 'string' ? input.activityUrl : 'coloring/index.html',
            metadata: input.metadata && typeof input.metadata === 'object' ? input.metadata : {}
          };
          // Added record fields need no IndexedDB schema/version change. Old flat
          // records remain flat; metadata-only updates cannot erase saved pages.
          const pages = suppliedPages === undefined ? previous?.pages : suppliedPages;
          if (pages !== undefined) result.pages = pages;
          const cover = input.coverBlob === undefined ? previous?.coverBlob : suppliedCover;
          if (cover != null) result.coverBlob = cover;
          const editable = suppliedEditable === undefined ? previous?.editableState : suppliedEditable;
          if (editable !== undefined) result.editableState = editable;
          if (pages !== undefined && !pages.length && !(editable?.kind === 'sugar-bugs-v3' && editable.version === 3 && editable.cover && cover instanceof Blob)) throw new Error('A saved book needs actual story pages or its actual painted cover.');
          if (editable?.kind === 'sugar-bugs-v3' && editable.version === 3) {
            if (!Array.isArray(pages) || pages.some(page => !editable.pages.some(saved => saved.id === page.id) || page.layout !== 'spread')) throw new Error('Creative story pages must be actual saved interior activity spreads.');
            const completedPages = (editable.cover?.completed ? 1 : 0) + editable.pages.filter(page => page.completed).length;
            result.metadata = {...result.metadata,totalPages:4,completedPages,bookCompleted:completedPages === 4,status:completedPages === 4 ? 'completed' : 'in-progress'};
          }
          if (previous && previous.profileId !== result.profileId) throw new Error('This artwork belongs to a different local profile.');
          store.put(result);
        } catch (error) { failure = error; transaction.abort(); }
      };
    });
    notify();
    return record;
  }

  async function remove(id) {
    const record = await get(id);
    if (!record) return false;
    await transactionResult(await openDatabase(), 'readwrite', store => store.delete(id));
    notify();
    return true;
  }

  window.GPLibrary = Object.freeze({ list, save, get, remove });
})();
