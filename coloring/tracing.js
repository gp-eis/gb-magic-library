(() => {
  'use strict';
  const $ = s => document.querySelector(s), dialog = $('#writingDialog');
  const ink = $('#traceInk'), guide = $('#traceGuide');
  const ctx = ink.getContext('2d', { willReadFrequently: true }), gx = guide.getContext('2d');
  const results = new Map();
  let layout, alphabet, active, strokes = [], current, base = null, pen = '#263e50', paperGeneration = 0, openGeneration = 0, strokeBefore = null, pointerId = null, restoredActiveLineId = null;
  const ready = Promise.all([fetch('tracing-layout.json').then(r => { if (!r.ok) throw Error('Tracing layout unavailable'); return r.json(); }),window.traceGuides.ready]).then(([data, letters]) => { layout = data; alphabet = letters; return data; });

  function canvasCopy(source) {
    const c = document.createElement('canvas'); c.width = source.width; c.height = source.height;
    c.getContext('2d').drawImage(source, 0, 0); return c;
  }
  function sameCanvas(first, second) {
    if (!first || !second || first.width !== second.width || first.height !== second.height) return false;
    const one = first.getContext('2d').getImageData(0, 0, first.width, first.height).data;
    const two = second.getContext('2d').getImageData(0, 0, second.width, second.height).data;
    for (let index = 0; index < one.length; index++) if (one[index] !== two[index]) return false;
    return true;
  }
  function padWidth(line) { return Math.max(350, Math.ceil(window.traceGuides.measure(line.text, 96) + 56)); }
  function editingBase(result, width, height) {
    if (!result) return null;
    if (result.raw) return canvasCopy(result.raw);
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const scale = Math.min(1, (width - 48) / result.image.width, (height - 30) / result.image.height);
    const drawnWidth = result.image.width * scale, drawnHeight = result.image.height * scale;
    canvas.getContext('2d').drawImage(result.image, 24, Math.max(15, 136 - drawnHeight), drawnWidth, drawnHeight);
    return canvas;
  }
  function stroke(path) {
    ctx.strokeStyle = path.color; ctx.fillStyle = path.color; ctx.lineWidth = 6;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath();
    path.points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.stroke();
    for (const p of [path.points[0], path.points.at(-1)]) if (p) { ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill(); }
  }
  function render() {
    ctx.clearRect(0, 0, ink.width, ink.height);
    if (base) ctx.drawImage(base, 0, 0, ink.width, ink.height);
    strokes.forEach(stroke);
    $('#traceUndo').disabled = strokes.length === 0;
    $('#traceClear').disabled = $('#traceDone').disabled = !base && !strokes.length;
  }
  async function open(id) {
    const generation = ++openGeneration;
    await ready;
    // Wait for the bundled teaching font. Do not draw double-storey fallback
    // letter guides while a slow font download is still in progress.
    await document.fonts.load('96px "Andika Literacy"');
    if (generation !== openGeneration) return;
    end();
    active = layout.lines.find(line => line.id === id && line.text.trim());
    if (!active) return;
    document.querySelector('#narration')?.pause(); window.sampleTest.pause();
    $('#writingLine').textContent = active.text;
    ink.width = guide.width = padWidth(active);
    ink.height = guide.height = 190;
    $('.trace-pad').style.width = `${ink.width}px`;
    window.traceGuides.draw(gx,active.text,96,28,136);
    gx.setLineDash([]); gx.strokeStyle = '#e3e9e4'; gx.lineWidth = 1;
    gx.beginPath(); gx.moveTo(18, 145); gx.lineTo(guide.width - 18, 145); gx.stroke();
    restoredActiveLineId = id;
    strokes = []; current = null; strokeBefore = null; pointerId = null; base = editingBase(results.get(id), ink.width, ink.height);
    render(); if (!dialog.open) dialog.showModal(); ink.focus();
  }
  function cropped(source) {
    const data = source.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, source.width, source.height);
    let left = source.width, top = source.height, right = -1, bottom = -1, count = 0;
    for (let y = 0; y < source.height; y++) for (let x = 0; x < source.width; x++) if (data.data[(y * source.width + x) * 4 + 3] > 40) {
      left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y); count++;
    }
    if (!count) return null;
    left = Math.max(0, left - 5); top = Math.max(0, top - 5); right = Math.min(source.width - 1, right + 5); bottom = Math.min(source.height - 1, bottom + 5);
    const c = document.createElement('canvas'); c.width = right - left + 1; c.height = bottom - top + 1;
    c.getContext('2d').drawImage(source, left, top, c.width, c.height, 0, 0, c.width, c.height);
    return { canvas: c, count };
  }
  function install(id, image, source, raw = null, encoded = null) {
    const line = document.getElementById(id);
    let img = line.querySelector('img');
    if (!img) { img = document.createElement('img'); img.alt = ''; img.setAttribute('aria-hidden', 'true'); line.append(img); }
    img.src = encoded || image.toDataURL('image/png'); line.classList.add('has-writing');
    results.set(id, { source, raw, image: canvasCopy(image) });
  }
  function removeInline(id) {
    const line = document.getElementById(id);
    line.querySelector('img')?.remove(); line.classList.remove('has-writing'); results.delete(id);
  }
  function commitActive(action) {
    if (!active) return false;
    const found = cropped(ink), previous = results.get(active.id);
    if (!found) {
      if (!previous) return false;
      removeInline(active.id);
    } else {
      if (previous?.source === 'screen' && previous.raw && sameCanvas(previous.raw, ink)) return false;
      install(active.id, found.canvas, 'screen', canvasCopy(ink));
    }
    document.dispatchEvent(new CustomEvent('handwriting-edited', { detail: { changed: true, action, lineId: active.id } }));
    return true;
  }
  const message = text => { $('#writingStatus').hidden = false; $('#writingStatus').textContent = text; };
  document.querySelectorAll('.story-line').forEach(line => {
    const text = line.textContent, print = document.createElement('span'); print.className = 'line-print'; print.textContent = text;
    line.replaceChildren(print); line.tabIndex = 0; line.setAttribute('role', 'button'); line.setAttribute('aria-label', `Trace: ${text}`);
    line.setAttribute('aria-haspopup', 'dialog');
    line.onclick = () => open(line.id);
    line.onkeydown = event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); open(line.id); } };
  });
  ink.tabIndex = 0;
  const point = e => { const r = ink.getBoundingClientRect(); return { x: (e.clientX - r.left) * ink.width / r.width, y: (e.clientY - r.top) * ink.height / r.height }; };
  ink.onpointerdown = e => {
    if (e.button !== 0 || !active || current) return;
    paperGeneration++; strokeBefore = canvasCopy(ink); pointerId = e.pointerId;
    e.preventDefault(); ink.setPointerCapture(e.pointerId); current = { color: pen, points: [point(e)] }; strokes.push(current); render();
  };
  ink.onpointermove = e => { if (!current || e.pointerId !== pointerId) return; e.preventDefault(); const events=e.getCoalescedEvents?.(); for (const item of events?.length ? events : [e]) current.points.push(point(item)); render(); };
  function end(event) {
    if (!current || (event?.pointerId != null && event.pointerId !== pointerId)) return;
    if (event?.type === 'pointerup' && Number.isFinite(event.clientX) && Number.isFinite(event.clientY)) { current.points.push(point(event)); render(); }
    const changed = strokeBefore && !sameCanvas(strokeBefore, ink), finishedPointer = pointerId;
    current = null; pointerId = null; strokeBefore = null;
    if (changed) commitActive('stroke');
    try { if (finishedPointer != null && ink.hasPointerCapture?.(finishedPointer)) ink.releasePointerCapture(finishedPointer); } catch (_) {}
  }
  ink.onpointerup = end; ink.onpointercancel = end; ink.onlostpointercapture = end;
  $('#traceUndo').onclick = () => {
    if (!active || !strokes.length) return;
    paperGeneration++; const before = canvasCopy(ink), heldPointer = pointerId; strokes.pop(); current = null; pointerId = null; strokeBefore = null;
    try { if (heldPointer != null && ink.hasPointerCapture?.(heldPointer)) ink.releasePointerCapture(heldPointer); } catch (_) {}
    render();
    if (!sameCanvas(before, ink)) commitActive('undo');
  };
  $('#traceClear').onclick = () => {
    if (!active) return;
    paperGeneration++; const before = canvasCopy(ink), heldPointer = pointerId; strokes = []; current = null; pointerId = null; strokeBefore = null; base = null;
    try { if (heldPointer != null && ink.hasPointerCapture?.(heldPointer)) ink.releasePointerCapture(heldPointer); } catch (_) {}
    render();
    if (!sameCanvas(before, ink) || results.has(active.id)) commitActive('clear');
  };
  $('#traceDone').onclick = () => {
    end(); const found = cropped(ink); if (!found) return;
    message('Your own handwriting is in the story! Tap another line to write more.'); dialog.close();
  };
  $('#closeWriting').onclick = () => dialog.close();
  dialog.addEventListener('close', () => { if (dialog.open || (!active && !current)) return; end(); if (active) document.getElementById(active.id).focus(); active = null; current = null; pointerId = null; strokeBefore = null; restoredActiveLineId = null; openGeneration++; });
  document.querySelectorAll('[data-pen]').forEach(button => button.onclick = () => {
    pen = button.dataset.pen; document.querySelectorAll('[data-pen]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  });

  function encodePNG(canvas) {
    return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Your editable handwriting could not be saved.')), 'image/png'));
  }
  async function decodeLinePNG(blob, exactWidth = null, exactHeight = null) {
    if (!(blob instanceof Blob) || blob.type.toLowerCase().split(';')[0].trim() !== 'image/png' || !blob.size || blob.size > 16777216) throw new Error('Saved handwriting must use PNG pictures.');
    const header = new Uint8Array(await blob.slice(0, 33).arrayBuffer()), signature = [137, 80, 78, 71, 13, 10, 26, 10];
    if (header.length < 33 || signature.some((value, index) => header[index] !== value) || String.fromCharCode(...header.slice(12, 16)) !== 'IHDR') throw new Error('A saved handwriting picture is not a valid PNG.');
    const dimensions = new DataView(header.buffer, header.byteOffset, header.byteLength), width = dimensions.getUint32(16), height = dimensions.getUint32(20);
    if (!width || !height || width > 4096 || height > 1024 || width * height > 4194304 || (exactWidth != null && width !== exactWidth) || (exactHeight != null && height !== exactHeight)) throw new Error('A saved handwriting picture has unsupported dimensions.');
    const url = URL.createObjectURL(blob);
    try {
      const image = new Image(); image.src = url; await image.decode();
      if (image.naturalWidth !== width || image.naturalHeight !== height) throw new Error('A saved handwriting picture has inconsistent dimensions.');
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; canvas.getContext('2d').drawImage(image, 0, 0);
      return canvas;
    } finally { URL.revokeObjectURL(url); }
  }
  function exportState() {
    if (!layout) return Promise.reject(new Error('The handwriting activity is not ready yet.'));
    // Snapshot actual ink now, not after asynchronous PNG encoding. Include an
    // in-progress pointer stroke even if the child has not lifted the pen yet.
    const copies = new Map([...results].map(([id, result]) => [id, { id, source: result.source, image: canvasCopy(result.image), raw: result.raw ? canvasCopy(result.raw) : null }]));
    if (active && current) {
      const found = cropped(ink);
      if (found) copies.set(active.id, { id: active.id, source: 'screen', image: found.canvas, raw: canvasCopy(ink) });
      else copies.delete(active.id);
    }
    const activeLineId = active?.id || restoredActiveLineId || undefined;
    return Promise.all([...copies.values()].map(async item => {
      const imageBlob = await encodePNG(item.image);
      const line = { id: item.id, source: item.source, imageBlob };
      if (item.raw) line.rawBlob = await encodePNG(item.raw);
      return line;
    })).then(lines => ({ version: 1, lines, ...(activeLineId ? { activeLineId } : {}) }));
  }
  async function importState(state) {
    const generation = ++paperGeneration, openVersion = ++openGeneration;
    await ready;
    const known = new Map(layout.lines.map(line => [line.id, line]));
    if (!state || state.version !== 1 || !Array.isArray(state.lines) || state.lines.length > 4 || new Set(state.lines.map(line => line?.id)).size !== state.lines.length || state.lines.some(line => !known.get(line?.id)?.text.trim() || !['screen', 'paper'].includes(line.source)) || (state.activeLineId !== undefined && !known.get(state.activeLineId)?.text.trim())) throw new Error('This editable handwriting state is not supported.');
    const prepared = await Promise.all(state.lines.map(async line => {
      const image = await decodeLinePNG(line.imageBlob), raw = line.rawBlob == null ? null : await decodeLinePNG(line.rawBlob, padWidth(known.get(line.id)), 190);
      if (!cropped(image) || (raw && !cropped(raw))) throw new Error('A saved handwriting line does not contain any ink.');
      return { id: line.id, source: line.source, image, raw, encoded: image.toDataURL('image/png') };
    }));
    if (generation !== paperGeneration || openVersion !== openGeneration) throw new Error('A newer handwriting action replaced this restore request.');
    // All pictures are decoded before the first live result is changed. Restore
    // emits no handwriting-edited event and never resurrects a cleared line.
    const heldPointer = pointerId; current = null; pointerId = null; strokeBefore = null; active = null; strokes = []; base = null;
    try { if (heldPointer != null && ink.hasPointerCapture?.(heldPointer)) ink.releasePointerCapture(heldPointer); } catch (_) {}
    if (dialog.open) dialog.close();
    for (const id of known.keys()) removeInline(id);
    for (const line of prepared) install(line.id, line.image, line.source, line.raw, line.encoded);
    ctx.clearRect(0, 0, ink.width, ink.height); paperReview?.remove(); paperReview = null; $('#writingStatus').hidden = true;
    restoredActiveLineId = state.activeLineId || null;
  }
  async function setPageLines(texts) {
    await ready; await document.fonts.load('96px "Andika Literacy"');
    if (!Array.isArray(texts) || texts.length !== 4 || texts.some(text => typeof text !== 'string' || text.length > 140)) throw new Error('A story page needs four short text rows.');
    const copy = texts.map(text => text.trim());
    const missing = [...new Set(copy.join(''))].filter(character => !alphabet.glyphs[character]);
    if (missing.length) throw new Error(`The tracing guides do not include these letters: ${missing.join(' ')}`);
    if (copy.some(text => window.traceGuides.measure(text, 96) + 56 > 4096)) throw new Error('A story text row is too long for its handwriting pad.');
    await importState({ version: 1, lines: [] });
    for (let index = 0; index < layout.lines.length; index++) {
      const line = layout.lines[index], text = copy[index], element = document.getElementById(line.id);
      line.text = text; element.querySelector('.line-print').textContent = text;
      element.hidden = !text; element.tabIndex = text ? 0 : -1;
      element.setAttribute('aria-disabled', String(!text)); element.setAttribute('aria-label', `Trace: ${text}`);
    }
    $('#writingLine').textContent = '';
  }

  // Keep the entire visible writing column, including oversized strokes. Region
  // boundaries fall BETWEEN the guide glyphs, not at the old 100px crop edges.
  function writingRegions() {
    const bounds = layout.lines.map(line => {
      const chars = [...line.text].map(c => alphabet.glyphs[c]);
      const scale = Math.min(line.fontSize / alphabet.nominalSize, (line.width - 16) / chars.reduce((w,c) => w+c.advance+alphabet.spacing,0));
      const ys = chars.flatMap(c => c.paths.flatMap(path => path.flatMap(command => command.slice(2).filter((_,i) => i%2===0))));
      return { top:line.y+line.baseline+(Math.min(...ys)-alphabet.baseline)*scale,
        bottom:line.y+line.baseline+(Math.max(...ys)-alphabet.baseline)*scale };
    });
    return layout.lines.map((line,i) => {
      const top = i ? Math.floor((bounds[i-1].bottom+bounds[i].top)/2) : line.y-35;
      const bottom = i<layout.lines.length-1 ? Math.floor((bounds[i].bottom+bounds[i+1].top)/2) : line.y+line.height+35;
      const x=Math.max(0,line.x-45),right=Math.min(layout.scene.x-15,line.x+line.width+40);
      return {...line,x,y:Math.max(0,top),width:right-x,height:bottom-Math.max(0,top),
        glyphEnvelope:{top:bounds[i].top-Math.max(0,top)-line.fontSize*.5,bottom:bounds[i].bottom-Math.max(0,top)+line.fontSize*.5}};
    });
  }
  function separateInk(raw,template,width,height,envelope) {
    const count=width*height,out=new ImageData(width,height),candidate=new Uint8Array(count),seeds=new Uint8Array(count),luminance=new Float32Array(count),colored=new Uint8Array(count);
    // A continuous grayscale closing fills narrow pen strokes while following
    // broad paper shadows. Independent tile whites created visible gray blocks
    // at tile boundaries. Invalid, off-photo samples must not act as black ink.
    const photoLight=new Float32Array(count);
    for(let i=0;i<count;i++)photoLight[i]=raw[i*4+3] ? .2126*raw[i*4]+.7152*raw[i*4+1]+.0722*raw[i*4+2] : NaN;
    function extrema(input,radius,maximum) {
      function pass(values,horizontal) {
        const output=new Float32Array(count),length=horizontal?width:height,lines=horizontal?height:width;
        const queue=new Int32Array(length),at=(line,p)=>horizontal?line*width+p:p*width+line;
        for(let line=0;line<lines;line++){
          let head=0,tail=0,next=0;
          for(let p=0;p<length;p++){
            while(next<length&&next<=p+radius){
              const value=values[at(line,next)];
              if(Number.isFinite(value)){
                while(tail>head&&(maximum?values[at(line,queue[tail-1])]<=value:values[at(line,queue[tail-1])]>=value))tail--;
                queue[tail++]=next;
              }
              next++;
            }
            while(tail>head&&queue[head]<p-radius)head++;
            output[at(line,p)]=tail>head?values[at(line,queue[head])]:NaN;
          }
        }
        return output;
      }
      return pass(pass(input,true),false);
    }
    const paperLight=extrema(extrema(photoLight,17,true),17,false);
    // A second, pen-width scale prevents a narrow crease from being filled by
    // the larger background model and then mistaken for a broad graphite mark.
    // Very dark/color ink is retained independently, including thick markers.
    const finePaperLight=extrema(extrema(photoLight,4,true),4,false);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const index=y*width+x,k=index*4;if(!raw[k+3])continue;
      const white=Math.max(30,paperLight[index]),rgb=[0,1,2].map(c=>Math.min(255,raw[k+c]*255/white));
      const lum=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2],chroma=Math.max(...rgb)-Math.min(...rgb);
      const fineLum=255*photoLight[index]/Math.max(30,finePaperLight[index]);
      let expected=255;
      for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<width&&yy>=0&&yy<height){const q=(yy*width+xx)*4;expected=Math.min(expected,.2126*template[q]+.7152*template[q+1]+.0722*template[q+2])}}
      const difference=expected-lum;
      luminance[index]=lum;colored[index]=chroma>32?1:0;
      const strong=lum<140||(chroma>35&&lum<240)||(lum<224&&difference>25&&fineLum<225);
      const weak=strong||(lum<238&&(difference>9||lum<205)&&fineLum<235)||(chroma>25&&lum<245);
      if(weak){candidate[index]=1;seeds[index]=strong?1:0;for(let c=0;c<3;c++)out.data[k+c]=rgb[c]}
    }
    // Grow faint stroke edges from real ink. Small dark punctuation is retained;
    // isolated pale printed dots are not turned into a child's handwriting.
    for(let seed=0;seed<count;seed++)if(candidate[seed]===1){
      const queue=[seed];candidate[seed]=2;let strong=0,dark=0,color=0,left=width,right=-1,top=height,bottom=-1;
      for(let n=0;n<queue.length;n++){
        const i=queue[n],x=i%width,y=Math.floor(i/width);strong+=seeds[i];dark+=luminance[i]<140?1:0;color+=colored[i];
        left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,j=yy*width+xx;if(xx>=0&&xx<width&&yy>=0&&yy<height&&candidate[j]===1){candidate[j]=2;queue.push(j)}}
      }
      // A clip/table edge can enter the generous photo margins. Exclude only
      // isolated boundary debris entirely outside the expanded letter band;
      // never crop a connected letter or discard small real punctuation.
      const edge=left===0||right===width-1||top===0||bottom===height-1;
      const debris=edge&&(bottom<envelope.top||top>envelope.bottom);
      if(!debris&&strong&&((queue.length>=24)||(queue.length>=2&&dark>=2)||(queue.length>=6&&color>=2)))for(const i of queue)out.data[i*4+3]=255;
    }
    return out;
  }
  let paperReview;
  function showPaperReview(previews) {
    if(!paperReview){
      paperReview=document.createElement('details');paperReview.id='paperWritingReview';paperReview.className='paper-writing-review';
      const summary=document.createElement('summary');summary.textContent='Check writing from my photo';paperReview.append(summary);
      $('#writingStatus').after(paperReview);
    }
    paperReview.querySelector('.writing-previews')?.remove();
    const grid=document.createElement('div');grid.className='writing-previews';
    for(const preview of previews){
      const item=document.createElement('section'),heading=document.createElement('h3'),label=document.createElement('p'),button=document.createElement('button');
      heading.textContent=preview.line.text;heading.lang='en';heading.dataset.keepEnglish='';
      label.textContent='Original photo line';preview.raw.setAttribute('aria-label','Original photo line');
      button.textContent='Use full photo line';button.type='button';
      button.onclick=()=>{const previous=results.get(preview.line.id),changed=!previous||previous.source!=='paper'||!sameCanvas(previous.image,preview.raw);paperGeneration++;install(preview.line.id,preview.raw,'paper');if(changed)document.dispatchEvent(new CustomEvent('handwriting-edited',{detail:{changed:true,action:'paper-line',lineId:preview.line.id}}));message('Full photo line applied. Paper and tracing dots are kept so no writing is filtered out.');};
      item.append(heading,label,preview.raw,button);grid.append(item);
    }
    const help=document.createElement('p');help.textContent='If any marks are missing, use the full photo line. This keeps its paper and tracing dots too.';grid.prepend(help);paperReview.append(grid);paperReview.hidden=!previews.length;
  }
  // Known-layout extraction, not OCR. Out-of-frame margins are transparent;
  // they must never cause a complete visible sentence to be silently skipped.
  async function extractPaper(photo, h) {
    const generation=++paperGeneration;
    await ready;
    const source = photo.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, photo.width, photo.height).data;
    const project = (x, y) => { const z = h[6] * x + h[7] * y + 1; return { x: (h[0] * x + h[1] * y + h[2]) / z, y: (h[3] * x + h[4] * y + h[5]) / z }; };
    const worksheet = $('#worksheet'); if (!worksheet.complete) await worksheet.decode();
    const ref = document.createElement('canvas'); ref.width = layout.width; ref.height = layout.height;
    const rx = ref.getContext('2d', { willReadFrequently: true }); rx.drawImage(worksheet, 0, 0, ref.width, ref.height);
    let applied = 0, visible = 0;const previews=[],diagnostics=[],pending=[];
    for (const line of writingRegions()) {
      let valid=0;
      const raw = new Uint8ClampedArray(line.width * line.height * 4);
      for (let y=0;y<line.height;y++) for (let x=0;x<line.width;x++) {
        const p=project(line.x+x,line.y+y), ax=Math.floor(p.x), ay=Math.floor(p.y), fx=p.x-ax, fy=p.y-ay, k=(y*line.width+x)*4;
        if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||ax<0||ay<0||ax>=photo.width-1||ay>=photo.height-1)continue;
        valid++;raw[k+3]=255;
        for (let ch=0;ch<3;ch++) {
          const at=(xx,yy)=>source[(yy*photo.width+xx)*4+ch];
          raw[k+ch]=at(ax,ay)*(1-fx)*(1-fy)+at(ax+1,ay)*fx*(1-fy)+at(ax,ay+1)*(1-fx)*fy+at(ax+1,ay+1)*fx*fy;
        }
      }
      if(valid<line.width*line.height*.12)continue;
      visible++;
      const template=rx.getImageData(line.x,line.y,line.width,line.height).data;
      const c=document.createElement('canvas');c.width=line.width;c.height=line.height;const cx=c.getContext('2d'),out=separateInk(raw,template,line.width,line.height,line.glyphEnvelope);
      cx.putImageData(out,0,0);const found=cropped(c);
      const original=document.createElement('canvas');original.width=line.width;original.height=line.height;original.getContext('2d').putImageData(new ImageData(raw,line.width,line.height),0,0);previews.push({line,raw:original});
      diagnostics.push({id:line.id,available:valid/(line.width*line.height),pixels:found?.count||0,region:{x:line.x,y:line.y,width:line.width,height:line.height}});
      if(found&&found.count>=20){pending.push({id:line.id,image:found.canvas});applied++}
    }
    if(generation!==paperGeneration)return {applied:0,visible,lines:diagnostics,superseded:true};
    // Commit a photo as one replacement, including blank/missing lines. Do not
    // retain fragments from the preceding photo or erase screen-authored work
    // when the new photo has no handwriting for that line.
    const before = new Map(results);
    for(const [id,data] of results)if(data.source==='paper'){
      const line=document.getElementById(id);line.querySelector('img')?.remove();line.classList.remove('has-writing');results.delete(id);
    }
    for(const item of pending)install(item.id,item.image,'paper');
    showPaperReview(previews);
    message(applied ? `Photo writing applied to ${applied} of 4 lines. Please check every line.` : visible ? 'No handwriting found in this photo. Screen writing is kept. Try a clearer photo of the whole workbook.' : 'The photo shows only the picture. Screen writing is kept. Upload the whole workbook to include writing.');
    const changed = before.size !== results.size || [...before].some(([id, previous]) => { const next = results.get(id); return !next || previous.source !== next.source || !sameCanvas(previous.image, next.image) || (!!previous.raw !== !!next.raw) || (previous.raw && !sameCanvas(previous.raw, next.raw)); });
    document.dispatchEvent(new CustomEvent('paper-writing-applied',{detail:{applied,visible,changed}}));
    return {applied,visible,changed,lines:diagnostics};
  }
  document.addEventListener('workbook-rectified', event => extractPaper(event.detail.photo, event.detail.homography).catch(() => message('Paper handwriting could not be extracted. Your screen writing is unchanged. Try a clearer full-page photo with dark writing.')));
  window.handwriting = { ready, open, extractPaper, exportState, importState, setPageLines, getResults: () => [...results].map(([id,data]) => ({id,source:data.source})) };
  ready.catch(() => { $('.trace-hint').hidden = true; });
})();
