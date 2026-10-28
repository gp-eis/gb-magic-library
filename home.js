(() => {
  'use strict';
  const $=id=>document.getElementById(id),catalog=window.GPCatalog,model=window.GPHomeModel;
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let profile,storedProfile=null,selectedAvatar=null,records=[],libraryURLs=[],toastTimer,loadVersion=0,workOpenVersion=0,pendingOpenId=null;
  let pendingRemoval=null,removalBusy=false,removalInvoker=null;
  const inProgress=record=>record.metadata?.status==='in-progress'||record.metadata?.bookCompleted===false;
  const resumable=record=>((record.editableState?.kind==='sugar-bugs-v1'&&record.editableState?.version===1)||(record.editableState?.kind==='sugar-bugs-v2'&&record.editableState?.version===2)||(record.editableState?.kind==='sugar-bugs-v3'&&record.editableState?.version===3))&&typeof record.id==='string'&&!!record.id;
  const dateLabel=value=>{const date=new Date(value);return Number.isNaN(date.getTime())?'Saved in My Library':new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',month:'short',day:'numeric'}).format(date);};
  function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4500);}
  try{storedProfile=localStorage.getItem(model.PROFILE_KEY);profile=model.normalizeProfile(storedProfile,catalog.avatars);}catch(_){profile=model.normalizeProfile(null,catalog.avatars);}
  // An anonymous first visit stays anonymous until the child chooses a profile.
  if(storedProfile&&(profile.name||profile.avatarId)){
    try{localStorage.setItem(model.PROFILE_KEY,JSON.stringify(profile));}catch(_){/* A usable profile still works in memory. */}
  }
  function updateProfile(){
    const avatar=catalog.avatars.find(item=>item.id===profile.avatarId);
    for(const id of ['greetingName','profileName']){
      if(profile.name)$(id).setAttribute('data-keep-english','');else $(id).removeAttribute('data-keep-english');
    }
    $('greetingName').textContent=profile.name?profile.name+'!':'artist!';
    $('profileName').textContent=profile.name||'Enter your name';
    $('profileName').dataset.placeholder=String(!profile.name);
    $('profilePicture').src=avatar?`assets/avatars/${avatar.id}.webp`:'assets/profile-placeholder.svg';
    $('profilePicture').alt=avatar?`${avatar.name}, your GP character`:'Choose your GP character';
    $('changeProfile').textContent=profile.name&&avatar?'Change my character':'Set up my profile';
  }
  function showDialog(id){const dialog=$(id);if(!dialog.open)dialog.showModal();}
  function renderAvatarPicker(){
    $('avatarGrid').innerHTML=catalog.avatars.map(avatar=>`<button type="button" class="avatar-choice" data-avatar="${avatar.id}" aria-label="Choose ${esc(avatar.name)}" aria-pressed="${avatar.id===selectedAvatar}"><span class="avatar-circle"><img src="assets/avatars/${avatar.id}.webp" alt=""></span><span>${esc(avatar.name)}</span></button>`).join('');
    $('avatarGrid').querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{
      selectedAvatar=button.dataset.avatar;$('profileSelectionError').hidden=true;$('avatarGrid').querySelectorAll('button').forEach(choice=>choice.setAttribute('aria-pressed',String(choice===button)));
    }));
  }
  function editProfile(){selectedAvatar=profile.avatarId;$('nameInput').value=profile.name;$('nameInput').setCustomValidity('');$('profileSelectionError').hidden=true;renderAvatarPicker();showDialog('profileDialog');if(!profile.name)$('nameInput').focus();}
  $('editProfile').addEventListener('click',editProfile);$('changeProfile').addEventListener('click',editProfile);
  $('nameInput').addEventListener('input',()=>$('nameInput').setCustomValidity(''));
  $('profileForm').addEventListener('submit',event=>{
    event.preventDefault();
    const candidate=model.normalizeProfile({name:$('nameInput').value,avatarId:selectedAvatar},catalog.avatars);
    if(!candidate.name){$('nameInput').setCustomValidity(window.GPHomeUI?.translate('Please enter a nickname.')||'Please enter a nickname.');$('nameInput').reportValidity();return;}
    if(!candidate.avatarId){$('profileSelectionError').hidden=false;$('avatarGrid').querySelector('button')?.focus();return;}
    profile=candidate;
    let saved=true;try{localStorage.setItem(model.PROFILE_KEY,JSON.stringify(profile));}catch(_){saved=false;}
    updateProfile();$('profileDialog').close();toast(saved?'Your reading space is ready!':'Profile changed for this visit. Browser storage is blocked.');
  });
  document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>$(button.dataset.close).close()));
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog&&dialog.dataset.busy!=='true'){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}}));
  function renderBooks(){
    const readingDone=new Set(model.finishedBookIds(records)),colored=new Set(records.filter(item=>item.type==='coloring'&&!inProgress(item)).map(item=>item.bookId));
    const drafts=new Map();
    records.forEach(item=>{if(item.type==='coloring'&&inProgress(item)&&resumable(item)&&!drafts.has(item.bookId))drafts.set(item.bookId,item);});
    const readingSaved=new Set(records.filter(item=>item.type==='reading').map(item=>item.bookId));
    const bookStatus=book=>drafts.has(book.id)?'Coloring in progress':readingDone.has(book.id)?'✓ Reading completed':readingSaved.has(book.id)?'✓ Activities saved in My Library':colored.has(book.id)?'✓ Coloring saved in My Library':book.readingReady?'Ready to read':'Reading activity coming soon';
    const comingSoon=book=>bookStatus(book)==='Reading activity coming soon';
    $('monthLabel').textContent=catalog.label;$('catalogLabel').textContent=catalog.label.toUpperCase();
    $('bookGrid').innerHTML=catalog.books.map(book=>`
      <article class="book-card ${book.tone}" aria-labelledby="title-${book.id}">
        <a class="book-cover-link" href="${esc(model.safeLocalHref(book.readingHref))}" aria-label="Open ${esc(book.title)} reading activity${book.readingReady?'':' · coming soon'}">
          <img src="${book.cover}" alt="${esc(book.title)} book cover" width="700" height="420"><span class="week-label">WEEK ${book.week}</span>
          ${comingSoon(book)?'<span class="coming-soon-label" title="Reading activity coming soon">Coming Soon</span>':''}
        </a>
        <div class="book-info">
          <p class="book-category">${esc(book.category)}</p>
          <h3 id="title-${book.id}" data-keep-english>${esc(book.title)}</h3>
          <span class="book-status ${colored.has(book.id)||readingSaved.has(book.id)?'saved':''}"${comingSoon(book)?' hidden':''}>${comingSoon(book)?'':bookStatus(book)}</span>
        </div>
      </article>`).join('');
    $('catalogList').innerHTML=catalog.books.map(book=>`<article class="catalog-item"><a class="catalog-cover-link" href="${esc(model.safeLocalHref(book.readingHref))}" aria-label="Open ${esc(book.title)} reading activity${book.readingReady?'':' · coming soon'}"><img src="${book.cover}" alt="${esc(book.title)} cover"></a><div><p>WEEK ${book.week} · ${esc(book.category)}</p><h3 data-keep-english>${esc(book.title)}</h3><span class="catalog-status">${book.readingReady?'Ready to read':'Reading activity coming soon'}</span></div></article>`).join('');
  }
  const blankIcon='<svg viewBox="0 0 50 50" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="8" y="6" width="34" height="38" rx="4"/><path d="m13 35 9-9 7 5 5-6 5 10M15 16h9"/><circle cx="32" cy="17" r="4"/></svg>';
  function clearLibraryURLs(){libraryURLs.forEach(URL.revokeObjectURL);libraryURLs=[];}
  function workTile(record){
    const button=document.createElement('button');button.className=`work-tile${inProgress(record)?' work-in-progress':''}`;button.type='button';
    const catalogBook=catalog.books.find(book=>book.id===record.bookId);
    const cover=model.safeLocalHref(catalogBook?.cover,'');
    const url=cover||URL.createObjectURL(record.thumbnailBlob||record.imageBlob);
    if(!cover)libraryURLs.push(url);
    const imageAlt=cover?`${catalogBook.title} book cover`:`Saved ${record.type==='coloring'?'coloring':'activity'} for ${record.title}`;
    const progressLabel=inProgress(record)?'<span class="work-progress-label shelf-status-badge">In progress</span>':(record.metadata?.status==='completed'||record.metadata?.bookCompleted===true)?'<span class="work-completed-label shelf-status-badge">Completed</span>':'';
    button.innerHTML=`<span class="shelf-book-cover"><span class="shelf-book-face"><img src="${esc(url)}" alt="${esc(imageAlt)}">${progressLabel}</span></span><b data-keep-english>${esc(record.title)}</b><small>${record.type==='coloring'?'My coloring':record.type==='reading'?'My reading':'My activity'} · ${esc(dateLabel(record.updatedAt||record.createdAt))}</small><span class="work-open-hint">${inProgress(record)?'View my progress':'Open my book'} <span aria-hidden="true">↗</span></span>`;
    if(record.editableState?.kind==='sugar-bugs-v2'||record.editableState?.kind==='sugar-bugs-v3'){
      const progress=document.createElement('small');progress.className='work-page-progress';
      const total=record.editableState.kind==='sugar-bugs-v3'?4:3;
      progress.textContent=`${record.metadata?.completedPages||0} of ${total} activities finished`;
      button.querySelector('.work-open-hint').before(progress);
    }
    button.setAttribute('aria-label',`Open saved ${record.title} storybook`);button.addEventListener('click',()=>openWork(record.id));return button;
  }
  function renderLibrary(){
    clearLibraryURLs();$('libraryPreview').replaceChildren();$('allLibrary').replaceChildren();
    $('libraryCount').textContent=`${records.length} saved creation${records.length===1?'':'s'}`;
    if(!records.length){
      $('libraryPreview').innerHTML=`${Array.from({length:4},()=>`<div class="empty-slot" aria-hidden="true">${blankIcon}</div>`).join('')}<p class="empty-help">Your saved books will appear here.</p>`;
      $('allLibrary').innerHTML='<div class="library-empty">Your collection is waiting for its first creation.</div>';
    }else{
      records.slice(0,4).forEach(record=>$('libraryPreview').append(workTile(record)));
      for(let i=records.length;i<4;i++){const blank=document.createElement('div');blank.className='empty-slot';blank.setAttribute('aria-hidden','true');blank.innerHTML=blankIcon;$('libraryPreview').append(blank);}
      records.forEach(record=>$('allLibrary').append(workTile(record)));
    }
  }
  async function loadLibrary(){
    const version=++loadVersion;
    try{const saved=await GPLibrary.list(profile.id);if(version!==loadVersion)return;records=saved.filter(record=>record.imageBlob instanceof Blob);renderLibrary();renderBooks();}
    catch(_){if(version!==loadVersion)return;records=[];clearLibraryURLs();$('libraryPreview').innerHTML='<p class="library-error">My Library can’t open in this browser window.<br>Please allow local browser storage. You can still explore the books.</p>';$('allLibrary').innerHTML='<p class="library-error">Browser storage is unavailable. No saved work has been removed.</p>';$('libraryCount').textContent='Browser storage unavailable';renderBooks();}
  }
  async function openWork(id){
    const version=++workOpenVersion;pendingOpenId=id;
    try{
      const record=await GPLibrary.get(id);if(version!==workOpenVersion)return;pendingOpenId=null;
      if(!record||record.profileId!==profile.id){toast('This picture is not available in the current library.');return;}
      window.GPStorybookViewer.open(record,{readerName:profile.name,catalogBook:catalog.books.find(book=>book.id===record.bookId)});
    }catch(_){if(version!==workOpenVersion)return;pendingOpenId=null;toast('This storybook could not be opened. Your saved work is unchanged. Please try again.');}
  }
  function restoreLibraryFocus(){
    const top=[...document.querySelectorAll('dialog[open]')].at(-1);
    // Do not steal focus if another modal was opened while the library refreshed.
    if(top&&top!==$('libraryDialog'))return;
    const target=top?$('allLibrary').querySelector('button,a')||top.querySelector('[data-close]'):$('viewLibrary');
    target?.focus();
  }
  function setRemovalBusy(busy){
    removalBusy=busy;const dialog=$('removeCreationDialog');dialog.dataset.busy=String(busy);dialog.setAttribute('aria-busy',String(busy));
    $('keepCreation').disabled=busy;$('confirmRemoveCreation').disabled=busy;
    $('confirmRemoveCreation').textContent=busy?'Removing…':$('confirmRemoveCreation').dataset.retry==='true'?'Try removing again':'Remove';
  }
  function requestRemoval(id){
    if(removalBusy||$('removeCreationDialog').open||typeof id!=='string')return;
    const record=records.find(item=>item.id===id&&item.profileId===profile.id);
    if(!record){toast('This creation is not available in your current library.');return;}
    // Freeze the selected ID/title. A later list refresh cannot redirect deletion.
    pendingRemoval=Object.freeze({id:record.id,title:record.title,profileId:record.profileId});
    removalInvoker=document.activeElement;
    $('removeCreationTitle').textContent=record.title;
    $('removeCreationError').hidden=true;$('removeCreationError').textContent='';
    $('confirmRemoveCreation').dataset.retry='false';setRemovalBusy(false);
    showDialog('removeCreationDialog');$('keepCreation').focus();
  }
  async function confirmRemoval(){
    if(removalBusy||!pendingRemoval||!$('removeCreationDialog').open)return;
    const selected=pendingRemoval;let removed=false;
    setRemovalBusy(true);$('removeCreationError').hidden=true;
    try{
      // Verify current ownership immediately before the only mutating operation.
      const fresh=await GPLibrary.get(selected.id);
      if(pendingRemoval!==selected||selected.profileId!==profile.id||!fresh||fresh.id!==selected.id||fresh.profileId!==profile.id){
        throw new Error('This creation is no longer available in your current library. No other saved work was changed.');
      }
      const didRemove=await GPLibrary.remove(selected.id);
      removed=true;pendingRemoval=null;
      if(pendingOpenId===selected.id){workOpenVersion++;pendingOpenId=null;}
      $('removeCreationDialog').close('removed');
      window.GPStorybookViewer.closeIf(selected.id);
      await loadLibrary();
      toast(didRemove?'This creation was removed. Your other creations and the original activity are unchanged.':'This creation was already removed. Your other creations are unchanged.');
    }catch(error){
      $('confirmRemoveCreation').dataset.retry='true';
      $('removeCreationError').textContent=error.message||'This creation could not be removed. Please try again. Your saved work has not been changed.';
      $('removeCreationError').hidden=false;
    }finally{
      setRemovalBusy(false);
      if(removed)restoreLibraryFocus();else if($('removeCreationDialog').open)$('keepCreation').focus();
    }
  }
  window.addEventListener('gp-request-remove-creation',event=>requestRemoval(event.detail?.id));
  $('confirmRemoveCreation').addEventListener('click',confirmRemoval);
  $('keepCreation').addEventListener('click',()=>{if(!removalBusy)$('removeCreationDialog').close('kept');});
  $('removeCreationDialog').addEventListener('cancel',event=>{if(removalBusy)event.preventDefault();});
  $('removeCreationDialog').addEventListener('close',()=>{
    if($('removeCreationDialog').open)return;
    pendingRemoval=null;
    if(!removalBusy){
      const top=[...document.querySelectorAll('dialog[open]')].at(-1);
      if(removalInvoker?.isConnected&&!removalInvoker.disabled&&(!top||top.contains(removalInvoker)))removalInvoker.focus();
      else restoreLibraryFocus();
    }
    removalInvoker=null;
  });
  $('viewLibrary').addEventListener('click',()=>showDialog('libraryDialog'));
  $('seeMore').addEventListener('click',()=>showDialog('catalogDialog'));
  $('grownupButton').addEventListener('click',()=>showDialog('grownupDialog'));
  window.addEventListener('gp-library-updated',loadLibrary);
  window.addEventListener('storage',event=>{if(event.key==='gp.reading.library.updated')loadLibrary();if(event.key===model.PROFILE_KEY){profile=model.normalizeProfile(event.newValue,catalog.avatars);updateProfile();}});
  window.addEventListener('pageshow',event=>{if(event.persisted)loadLibrary();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)loadLibrary();});
  window.addEventListener('pagehide',clearLibraryURLs);
  updateProfile();renderBooks();loadLibrary();
})();
