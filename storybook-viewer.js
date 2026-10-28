/* A read-only paper reader. Only actual saved images are ever shown as pages. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),model=window.GPStoryLibraryModel;
  const dialog=$('workDialog'),stage=$('savedBookStage'),TURN_MS=820;
  let book=null,record=null,index=0,urls=[],turnTimer,session=0,touchStart=null,turning=false,finishCurrentTurn=null;
  let resolveTurn=null,readerEpoch=0,fullscreenPending=false,fullscreenError='';
  const fullscreenWarnings=new Set();
  let media=null,mediaHost=null,mediaAbort=null,mediaIndex=-1,mediaTicket=0,mediaEnded=false,readRun=0;
  let autoRead=false,readPaused=false,readLoading=false,readFinished=false,readError='',advancing=false;
  const inProgress=()=>record?.metadata?.status==='in-progress'||record?.metadata?.bookCompleted===false;
  const motionQuery=typeof window.matchMedia==='function'?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
  const animate=()=>!!motionQuery&&!motionQuery.matches;
  function supportsReading(){
    const api=window.GPBookPlayback;
    if(!book||!book.spreads.length||!record||typeof api?.mount!=='function'||typeof api?.isSupported!=='function')return false;
    try{return api.isSupported(record,null)&&book.spreads.every(spread=>api.isSupported(record,spread));}catch(_){return false;}
  }
  function updateReading(){
    const button=$('readSavedBook'),label=$('readSavedBookLabel'),status=$('savedReadStatus');
    const supported=supportsReading();
    if(button){
      button.disabled=!supported||(!autoRead&&turning);
      button.setAttribute('aria-pressed',String(autoRead&&!readPaused));
      button.setAttribute('aria-busy',String(readLoading));
      button.title=supported?'Read your actual saved book aloud':'Read aloud is not available for this saved book.';
    }
    if(label)label.textContent=autoRead?(readPaused?'Resume reading':'Pause reading'):'Read my book';
    if(status)status.textContent=readError||fullscreenError||(readFinished?'You read your saved book!':autoRead&&readPaused?'Reading paused.':autoRead&&turning?'Turning the page…':readLoading?'Getting the story ready…':autoRead?'Reading your saved book…':supported?'Press Read my book to listen and watch.':'Read aloud is not available for this saved book.');
  }
  function updateFullscreen(){
    const button=$('toggleSavedFullscreen');if(!button)return;
    const target=$('savedReaderFullscreenRoot');
    const active=!!target&&document.fullscreenElement===target,available=typeof target?.requestFullscreen==='function'&&document.fullscreenEnabled!==false;
    const label=active?'Exit fullscreen':'Enter fullscreen';
    button.disabled=fullscreenPending||(!active&&!available);button.setAttribute('aria-pressed',String(active));button.setAttribute('aria-label',label);
    button.title=available||active?label:'Fullscreen is not available in this browser.';
    const text=$('savedFullscreenLabel');if(text)text.textContent=label;else button.textContent=label;
  }
  function destroyMedia(){
    mediaTicket++;
    try{mediaAbort?.abort();}catch(_){}mediaAbort=null;
    try{media?.stop?.();}catch(_){}try{media?.destroy?.();}catch(_){}
    media=null;mediaIndex=-1;mediaEnded=false;readLoading=false;mediaHost?.remove?.();mediaHost=null;
  }
  function stopReading(){
    readRun++;autoRead=false;readPaused=false;readFinished=false;readError='';advancing=false;destroyMedia();updateReading();
  }
  function readingFailed(problem,run){
    if(run!==readRun||!dialog.open)return;
    stopReading();readError='Reading could not start. Tap Read my book to try again.';
    if($('savedReadStatus'))$('savedReadStatus').title=typeof problem?.message==='string'?problem.message:'';
    updateReading();
  }
  async function startMedia(position,run){
    if(run!==readRun||!autoRead||!book||!dialog.open)return;
    destroyMedia();const ticket=mediaTicket;
    const abort=typeof window.AbortController==='function'?new window.AbortController():null;mediaAbort=abort;
    const host=document.createElement('div');host.className='saved-book-playback-host';host.setAttribute('aria-hidden','true');
    const frame=stage.children[0];if(!frame)return;
    frame.append(host);mediaHost=host;readLoading=true;updateReading();
    try{
      const controller=await window.GPBookPlayback.mount({record,spread:position===0?null:book.spreads[position-1],host,signal:abort?.signal,shouldAnimate:()=>animate(),
        onEnded:()=>{
          if(run!==readRun||ticket!==mediaTicket||!autoRead||!dialog.open)return;
          mediaEnded=true;if(!readPaused)advanceReading(run).catch(problem=>readingFailed(problem,run));
        },
        onError:problem=>{if(run===readRun&&ticket===mediaTicket)readingFailed(problem,run);}
      });
      if(run!==readRun||ticket!==mediaTicket||!autoRead||!dialog.open){try{controller?.destroy?.();}catch(_){}host.remove?.();return;}
      media=controller;mediaIndex=position;mediaEnded=false;readLoading=false;updateReading();
      if(readPaused){controller.pause();return;}
      await controller.play();
      if(run===readRun&&ticket===mediaTicket)updateReading();
    }catch(problem){if(run===readRun&&ticket===mediaTicket)readingFailed(problem,run);}
  }
  async function advanceReading(run){
    if(run!==readRun||!autoRead||readPaused||advancing||!book||!dialog.open)return;
    advancing=true;
    try{
      destroyMedia();
      if(index>=book.spreads.length){autoRead=false;readPaused=false;readFinished=true;updateReading();return;}
      const landed=await goTo(index+1);
      if(!landed||run!==readRun||!autoRead||!dialog.open)return;
      await startMedia(index,run);
    }finally{if(run===readRun)advancing=false;}
  }
  async function toggleReading(){
    if(!supportsReading()||!dialog.open||(!autoRead&&turning))return;
    fullscreenError='';readError='';
    if(autoRead){
      readPaused=!readPaused;
      if(readPaused)media?.pause?.();
      else if(mediaEnded){const run=readRun;advanceReading(run).catch(problem=>readingFailed(problem,run));}
      else if(media&&mediaIndex===index){const run=readRun;Promise.resolve(media.play()).catch(problem=>readingFailed(problem,run));}
      // A pending decode or turn will honor this pause flag when it finishes.
      updateReading();return;
    }
    const replay=readFinished;stopReading();autoRead=true;readPaused=false;const run=readRun;updateReading();
    if(replay&&index!==0){const landed=await goTo(0);if(!landed||run!==readRun||!autoRead)return;}
    await startMedia(index,run);
  }
  function exitOwnFullscreen(){
    const target=$('savedReaderFullscreenRoot');
    if(!target||document.fullscreenElement!==target||typeof document.exitFullscreen!=='function')return;
    try{Promise.resolve(document.exitFullscreen()).catch(()=>{});}catch(_){}
  }
  async function toggleFullscreen(){
    if(!dialog.open||fullscreenPending)return;
    const epoch=readerEpoch;fullscreenPending=true;fullscreenError='';updateFullscreen();updateReading();
    if($('savedReadStatus')&&!readError)$('savedReadStatus').title='';
    try{
      const target=$('savedReaderFullscreenRoot');
      if(target&&document.fullscreenElement===target){if(typeof document.exitFullscreen==='function')await document.exitFullscreen();}
      else if(typeof target?.requestFullscreen==='function')await target.requestFullscreen();
      else throw new Error('Fullscreen is not available in this browser.');
      if(epoch!==readerEpoch||!dialog.open)exitOwnFullscreen();
    }catch(problem){
      if(epoch===readerEpoch&&dialog.open){
        fullscreenError='Fullscreen could not start. You can still use the large reader.';
        const reason=typeof problem?.message==='string'?problem.message.slice(0,500):'The browser declined this fullscreen request.';
        if($('savedReadStatus'))$('savedReadStatus').title=reason;
        if(!fullscreenWarnings.has(reason)){fullscreenWarnings.add(reason);window.console?.warn?.('GP reader fullscreen:',reason);}
      }
    }
    finally{fullscreenPending=false;updateFullscreen();updateReading();}
  }
  function revoke(list){list.forEach(url=>URL.revokeObjectURL(url));}
  function release(){revoke(urls);urls=[];}
  function blobURL(blob){const url=URL.createObjectURL(blob);urls.push(url);return url;}
  function savedImage(blob,alt,className){
    const image=document.createElement('img');image.className=className;image.alt=alt;image.src=blobURL(blob);image.draggable=false;
    const currentSession=session;
    image.addEventListener('error',()=>{if(currentSession===session&&dialog.open)$('savedBookError').hidden=false;});
    return image;
  }
  function coverImage(){
    if(book.cover.blob)return savedImage(book.cover.blob,`${book.title} front cover`,'saved-cover-image');
    const image=document.createElement('img'),currentSession=session;
    image.className='saved-cover-image';image.src=book.cover.src;image.alt=`${book.title} front cover`;image.draggable=false;
    image.addEventListener('error',()=>{if(currentSession===session&&dialog.open)$('savedBookError').hidden=false;});
    return image;
  }
  function makeView(position){
    const frame=document.createElement('div');frame.className=`saved-book-frame${position===0?' is-closed':''}`;
    if(!position){
      const cover=document.createElement('div');cover.className='saved-book-cover';cover.append(coverImage());frame.append(cover);
    }else{
      const spread=book.spreads[position-1],paper=document.createElement('div');
      paper.className=`saved-book-spread ${spread.kind==='spread'?'saved-wide-art':'saved-page-pair'}`;
      if(spread.kind==='spread')paper.append(savedImage(spread.pages[0].imageBlob,spread.pages[0].title,'saved-spread-image'));
      else{
        spread.pages.forEach((page,offset)=>{
          const leaf=document.createElement('section');leaf.className='saved-book-leaf';leaf.setAttribute('aria-label',`Page ${spread.startPage+offset}: ${page.title}`);
          leaf.append(savedImage(page.imageBlob,page.title,'saved-page-image'));
          const number=document.createElement('span');number.className='saved-leaf-number';number.textContent=String(spread.startPage+offset);leaf.append(number);paper.append(leaf);
        });
        if(spread.pages.length===1){const blank=document.createElement('div');blank.className='saved-book-leaf saved-blank-leaf';blank.setAttribute('aria-hidden','true');blank.innerHTML='<span>✦</span>';paper.append(blank);}
      }
      frame.append(paper);
    }
    return frame;
  }
  function updateControls(){
    if(!book)return;
    stage.dataset.view=index===0?'cover':'pages';stage.dataset.turning=String(turning);stage.setAttribute('aria-busy',String(turning));
    $('savedBookHint').textContent=!book.spreads.length?'Your cover is saved. Continue your book whenever you are ready.':!index?'Open your book to see what you made.':inProgress()?'Your work is saved. Continue your book whenever you are ready.':index===book.spreads.length?'You made it to the end. This storybook is yours!':'Your completed activity pages, just as you saved them.';
    $('savedPageLabel').textContent=model.pageLabel(book,index);
    $('savedPageDetail').textContent=!index?`${book.totalPages} saved page${book.totalPages===1?'':'s'} inside`:`${index} of ${book.spreads.length} saved spread${book.spreads.length===1?'':'s'}`;
    $('previousSavedPage').disabled=turning||index===0;$('nextSavedPage').disabled=turning||index===book.spreads.length;
    $('nextSavedPageLabel').textContent=!book.spreads.length?'Saved cover':index===0?'Open book':index===book.spreads.length?(inProgress()?'Saved pages':'The end'):'Next page';
    $('restartSavedBook').hidden=index===0;$('restartSavedBook').disabled=turning;
    $('savedBookProgress').max=book.spreads.length;$('savedBookProgress').value=index;
    updateReading();updateFullscreen();
  }
  function render(){
    session++;release();stage.replaceChildren();$('savedBookError').hidden=true;
    stage.append(makeView(index));updateControls();
  }
  // A turning sheet has TWO different real faces, not a faded replacement of
  // the whole spread. Wide saved artwork is clipped in half only on this moving
  // decorative layer; the stationary reader always retains the full image.
  function sheetFace(position,side){
    const face=document.createElement('div');face.className='saved-turn-face';
    let content,wide=false;
    if(!position){
      content=coverImage();content.alt='';content.className='saved-turn-art';face.classList.add('saved-turn-cover-face');
    }
    else{
      const spread=book.spreads[position-1];
      if(spread.kind==='spread'){
        content=savedImage(spread.pages[0].imageBlob,'','saved-turn-art saved-turn-wide-art');wide=true;
      }else{
        const page=spread.pages[side==='left'?0:1];
        if(page)content=savedImage(page.imageBlob,'','saved-turn-art saved-turn-page-art');
        else face.classList.add('saved-turn-blank-face');
      }
    }
    if(content){if(wide)content.style.left=side==='left'?'0':'-100%';face.append(content);}
    return face;
  }
  function settle(frame,baseChildren,oldURLs,extraURLs,token){
    if(token!==session||!book||!turning)return;
    if(!dialog.open){cleanup();return;}
    clearTimeout(turnTimer);turnTimer=null;finishCurrentTurn=null;
    frame.classList.remove('is-opening','is-closing');frame.replaceChildren(...baseChildren);stage.replaceChildren(frame);
    revoke([...oldURLs,...extraURLs]);const retired=new Set([...oldURLs,...extraURLs]);urls=urls.filter(url=>!retired.has(url));
    turning=false;stage.classList.remove('turn-forward','turn-back');updateControls();
    const resolve=resolveTurn;resolveTurn=null;resolve?.(true);
  }
  async function goTo(position){
    if(!book||!dialog.open||turning)return false;
    const next=model.clampIndex(position,book.spreads.length);
    if(next===index)return true;
    if(!animate()){index=next;render();return true;}
    const landing=new Promise(resolve=>{resolveTurn=resolve;});
    const previous=index,direction=next>previous?'forward':'back',oldURLs=[...urls];
    const token=++session;turning=true;touchStart=null;index=next;$('savedBookError').hidden=true;updateControls();
    const frame=makeView(next),baseChildren=[...frame.children],baseURLCount=urls.length;
    const sheet=document.createElement('div');sheet.className=`saved-turn-sheet saved-sheet-${direction}`;sheet.setAttribute('aria-hidden','true');
    const front=sheetFace(previous,direction==='forward'?'right':'left');front.classList.add('saved-turn-front');
    const back=sheetFace(next,direction==='forward'?'left':'right');back.classList.add('saved-turn-back');sheet.append(front,back);
    // Preserve the departing stationary half until the moving page lands.
    if(previous!==0){
      const mask=document.createElement('div');mask.className=`saved-turn-underlay saved-underlay-${direction==='forward'?'left':'right'}`;mask.setAttribute('aria-hidden','true');
      mask.append(sheetFace(previous,direction==='forward'?'left':'right'));frame.append(mask);
    }
    const cast=document.createElement('div');cast.className=`saved-turn-cast saved-cast-${direction}`;cast.setAttribute('aria-hidden','true');frame.append(cast,sheet);
    const extraURLs=urls.slice(baseURLCount);
    if(previous===0)frame.classList.add('is-opening');if(next===0)frame.classList.add('is-closing');
    const finish=()=>settle(frame,baseChildren,oldURLs,extraURLs,token);finishCurrentTurn=finish;
    sheet.addEventListener('animationend',event=>{if(event.target===sheet&&(event.animationName==='saved-leaf-forward'||event.animationName==='saved-leaf-back'))finish();});
    // Decode EVERY real image, including both leaf faces and the stationary
    // old-page mask. CSS backgrounds can stay unpainted during a GPU flip;
    // decoded image elements keep actual artwork visible throughout the turn.
    const images=[];
    const collect=node=>{if(node.tagName==='IMG')images.push(node);[...node.children].forEach(collect);};collect(frame);
    await Promise.all(images.map(image=>typeof image.decode==='function'?image.decode().catch(()=>{}):Promise.resolve()));
    if(token!==session||!book||!dialog.open)return false;
    if(!turning)return landing;
    if(!animate()){finish();return landing;}
    stage.replaceChildren(frame);stage.classList.add(`turn-${direction}`);
    // A native animationend can be missed after a tab is hidden; the fallback
    // is also generation-guarded, so it cannot reopen a closed reader.
    turnTimer=setTimeout(finish,TURN_MS+160);
    return landing;
  }
  function manualGoTo(position){
    if(!book||!dialog.open||turning||model.clampIndex(position,book.spreads.length)===index)return false;
    stopReading();return goTo(position);
  }
  function turn(delta){return manualGoTo(index+delta);}
  function cleanup(){
    readerEpoch++;stopReading();fullscreenError='';exitOwnFullscreen();
    const resolve=resolveTurn;resolveTurn=null;resolve?.(false);
    session++;clearTimeout(turnTimer);turnTimer=null;finishCurrentTurn=null;turning=false;
    release();stage.replaceChildren();stage.classList.remove('turn-forward','turn-back');stage.dataset.turning='false';stage.setAttribute('aria-busy','false');
    book=null;record=null;touchStart=null;updateReading();updateFullscreen();
  }
  function open(input,options={}){
    const prepared=model.createBook(input,options.catalogBook);
    cleanup();record=input;book=prepared;index=0;
    $('workTitle').textContent=book.title;
    $('workMeta').textContent=`${options.readerName||'Your'}${options.readerName?"’s":''} storybook · ${inProgress()?'Work in progress':input.type==='reading'?'Reading activities':input.type==='coloring'?'Coloring and handwriting':'Completed activities'}`;
    const editable=input.editableState;
    const v1=editable?.kind==='sugar-bugs-v1'&&editable?.version===1,v2=editable?.kind==='sugar-bugs-v2'&&editable?.version===2,v3=editable?.kind==='sugar-bugs-v3'&&editable?.version===3;
    const canContinue=inProgress()&&(v1||v2||v3)&&typeof input.id==='string'&&!!input.id;
    $('savedBookDraftActions').hidden=!canContinue;
    $('continueSavedBook').href=canContinue?`coloring/index.html?mode=color${v3?'&edition=creative':v2?'&edition=three':''}&project=${encodeURIComponent(input.id)}`:'coloring/index.html?mode=color';
    $('downloadWork').disabled=!(input.imageBlob instanceof Blob);$('requestRemoveWork').disabled=typeof input.id!=='string'||!input.id;
    const more=$('savedReaderMore');if(more)more.open=false;
    render();if(!dialog.open)dialog.showModal();updateReading();updateFullscreen();
  }
  function close(){if(dialog.open)dialog.close();cleanup();}
  function closeIf(id){if(record?.id!==id)return false;close();return true;}
  $('closeSavedBook').addEventListener('click',close);
  $('previousSavedPage').addEventListener('click',()=>turn(-1));$('nextSavedPage').addEventListener('click',()=>turn(1));
  $('restartSavedBook').addEventListener('click',()=>manualGoTo(0));
  $('readSavedBook')?.addEventListener('click',()=>{const task=toggleReading(),run=readRun;task.catch(problem=>readingFailed(problem,run));});
  $('toggleSavedFullscreen')?.addEventListener('click',()=>{toggleFullscreen().catch(()=>{});});
  document.addEventListener('fullscreenchange',()=>{fullscreenError='';updateFullscreen();updateReading();});
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  dialog.addEventListener('close',()=>{if(!dialog.open)cleanup();});
  motionQuery?.addEventListener?.('change',event=>{if(event.matches&&finishCurrentTurn)finishCurrentTurn();});
  document.addEventListener('keydown',event=>{
    if(!dialog.open)return;
    const top=[...document.querySelectorAll('dialog[open]')].at(-1);if(top&&top!==dialog)return;
    if(event.altKey||event.ctrlKey||event.metaKey||['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))return;
    if(event.key==='ArrowRight'){event.preventDefault();turn(1);}if(event.key==='ArrowLeft'){event.preventDefault();turn(-1);}
  });
  stage.addEventListener('touchstart',event=>{touchStart=!turning&&event.touches.length===1?{x:event.touches[0].clientX,y:event.touches[0].clientY}:null;},{passive:true});
  stage.addEventListener('touchend',event=>{
    if(!touchStart)return;const touch=event.changedTouches?.[0],start=touchStart;touchStart=null;if(!touch)return;
    const dx=touch.clientX-start.x,dy=touch.clientY-start.y;
    if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.5)turn(dx<0?1:-1);
  },{passive:true});
  stage.addEventListener('touchcancel',()=>{touchStart=null;},{passive:true});
  $('downloadWork').addEventListener('click',()=>{
    if(!(record?.imageBlob instanceof Blob))return;
    const url=URL.createObjectURL(record.imageBlob),link=document.createElement('a');link.href=url;
    const mime=record.imageBlob.type.toLowerCase().split(';')[0].trim(),ext={'image/jpeg':'jpg','image/webp':'webp','image/gif':'gif'}[mime]||'png';
    link.download=`${String(record.bookId||'my-storybook').replace(/[^a-z0-9-]/gi,'-')}-my-creation.${ext}`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  $('requestRemoveWork').addEventListener('click',()=>{
    if(!dialog.open||typeof record?.id!=='string'||!record.id)return;
    window.dispatchEvent(new CustomEvent('gp-request-remove-creation',{detail:{id:record.id}}));
  });
  window.addEventListener('pagehide',close);
  window.GPStorybookViewer=Object.freeze({open,close,closeIf});
})();
