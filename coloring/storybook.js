(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  let state = 'read', page = 'cover';
  function activityInfo(){return window.GPAutoSave?.getPageInfo?.()||{multiPage:false,pages:[{id:'treats',title:'Yum! A donut!'}],activeIndex:0,completedPages:0,busy:false};}
  function activeScene(){const info=activityInfo();return (info.edition==='creative'?window.GPBookPages?.creativePages:window.GPBookPages?.pages)?.[info.multiPage?info.activeIndex:0];}
  async function chooseActivity(index){
    const info=activityInfo();
    if(!info.multiPage||info.busy||index<0||index>=info.pages.length||index===info.activeIndex)return;
    try{await window.GPAutoSave.switchPage(index);}
    catch(_){/* The save bridge keeps the current work visible with recovery advice. */}
  }
  function update() {
    const cover = page === 'cover', coloring = state === 'color', moving = state === 'move';
    const info=activityInfo(),multi=info.multiPage,count=info.pages.length,index=info.activeIndex,busy=info.busy,creative=info.edition==='creative',scene=activeScene(),eligibility=window.sampleTest?.getCompletionStatus?.();
    document.body.dataset.activity=scene?.id||'treats';
    document.body.dataset.page = page;
    document.body.dataset.mode = cover ? 'read' : state;
    $('#bookCover').hidden = !cover;
    $('#storybook').hidden = cover;
    $('#originalScene').hidden = state !== 'read';
    $('#editor').hidden = !coloring;
    $('#motion').hidden = !moving;
    $('#drawingControls').hidden = cover || !coloring;
    $('#begin').hidden = cover || state !== 'read';
    $('#begin').disabled = cover;
    $('#begin').setAttribute('aria-pressed', String(!cover && coloring));
    const supportsWorkbook=!multi||activeScene()?.workbook===true;
    $('#paperButton').disabled = cover || $('#upload').disabled || !supportsWorkbook;
    $('#paperButton').hidden = cover || moving || !supportsWorkbook;
    $('#finish').hidden = cover || (creative?moving:!coloring);
    $('#edit').hidden = cover || !moving;
    $('#replay').hidden = cover || !moving || activeScene()?.staticPreview===true || scene?.cover===true;
    $('#readAloud').hidden = !cover && moving && activeScene()?.staticPreview!==true && scene?.cover!==true;
    $('#finish').disabled = cover || !window.sampleTest?.isReady() || (creative?!eligibility?.canFinish:state==='read');
    $('#finish').title=creative&&!eligibility?.writingComplete?'Write every line to finish this page.':'';
    $('#play').hidden = cover || !moving || activeScene()?.staticPreview===true || scene?.cover===true;
    $('#read').hidden = cover || state === 'read';
    $('#previousPage').disabled = cover||busy||(creative&&index===0);
    $('#nextPage').disabled = busy||(!cover&&(!multi||index===count-1));
    $('#previousPage').setAttribute('aria-label',!cover&&multi&&index>0?'Previous activity':'Previous page: front cover');
    $('#nextPage').setAttribute('aria-label',cover?'Next page: open the story':'Next activity');
    $('#nextPageLabel').textContent = cover ? 'Open book' : multi?'Next activity':'Next';
    $('#pageIndicator').innerHTML = multi
      ?cover?`Front cover <span>${count} activities inside</span>`:`Activity ${index+1} of ${count} <span>${info.completedPages} of ${count} finished</span>`
      :cover?'Front cover <span>1 of 2</span>':'Story pages 1–2 <span>2 of 2</span>';
    $('#storybook').setAttribute('aria-label',`Story pages ${index*2+1} and ${index*2+2}`);
    const numbers=$('#storybook').querySelectorAll('.page-number');numbers.forEach((node,offset)=>{node.textContent=String(index*2+offset+1);});
    const activityNav=$('#bookActivityNav');
    if(activityNav){
      activityNav.hidden=!multi||cover;
      const signature=JSON.stringify([index,busy,info.pages.map(item=>[item.id,item.completed])]);
      if(activityNav.dataset.signature!==signature){
        activityNav.dataset.signature=signature;
        activityNav.replaceChildren(...info.pages.map((item,position)=>{
          const button=document.createElement('button');button.type='button';button.dataset.activity=String(position);
          button.className='activity-tab';button.disabled=busy;
          button.setAttribute('aria-label',`Activity ${position+1}: ${item.title}`);
          if(position===index)button.setAttribute('aria-current','step');
          const number=document.createElement('span');number.className='activity-tab-number';number.textContent=item.completed?'✓':String(position+1);
          const label=document.createElement('span');label.textContent=item.title;if(item.id!=='cover-title')label.setAttribute('data-keep-english','');
          button.append(number,label);return button;
        }));
      }
    }
    const studioLabel=$('#studioActivityLabel');
    if(studioLabel){studioLabel.hidden=!multi;studioLabel.textContent=`Activity ${index+1} of ${count}`;}
    $('#modeLabel').textContent = creative&&scene?.cover?(moving?'Your cover is ready!':'Color the white title letters!'):cover ? 'Let’s open our book!' : {
      read: 'Let’s read together!', color: activeScene()?.staticPreview?'Make this picture your own!':'Make the treats your own!', move: activeScene()?.staticPreview?'Look! This activity is yours!':'Look! You made it come alive!'
    }[state];
    $('#status').textContent = creative&&scene?.cover&&moving?'Your cover is ready. Turn to the next activity.':creative&&moving&&scene?.id==='sugar-bugs'?'Watch the sugar bugs dig a hole in the tooth.':creative&&moving&&scene?.id==='toothache'?'Ow! Watch the gentle toothache reaction.':creative&&!moving?(scene?.cover?'Color inside the white title letters, then choose Done.':`Color the picture and write every line. Writing: ${eligibility?.completedWritingLines||0} of ${eligibility?.requiredWritingLines||0}.`):cover
      ? 'Listen to the title, then open your book.'
      : {
        read: 'Listen to the story, trace a line, or choose Color.',
        color: activeScene()?.staticPreview?'Pick a color. Draw inside an outlined object. Tap Done!':'Pick a color. Draw on a treat. Tap Done!',
        move: activeScene()?.staticPreview?(index===count-1?'Your colors and handwriting are saved. Return Home whenever you are ready.':'Your colors and handwriting are saved. Turn to the next activity when you are ready.'):'Your treats are dancing! Tap Again to watch once more.'
      }[state];
    document.querySelectorAll('[data-step]').forEach(x => {
      if (x.dataset.step === (cover ? 'read' : state)) x.setAttribute('aria-current', 'step');
      else x.removeAttribute('aria-current');
    });
    if(creative&&state==='read'&&window.sampleTest?.isReady()&&window.sampleTest.getPreviewDataURL)$('#originalScene').src=window.sampleTest.getPreviewDataURL();
    const traceHint=$('.trace-hint');if(traceHint&&creative)traceHint.textContent=`Write every line: ${eligibility?.completedWritingLines||0} of ${eligibility?.requiredWritingLines||0} finished.`;
  }
  function turnPage(next) {
    if (!['cover', 'story'].includes(next) || next === page) return;
    window.sampleTest.pause();
    page = next;
    update();
    document.dispatchEvent(new CustomEvent('book-page-change', { detail: { page } }));
    document.dispatchEvent(new CustomEvent('book-mode-change', { detail: { mode: state, page } }));
  }
  function show(next) {
    if (!['read', 'color', 'move'].includes(next)) return;
    turnPage('story');
    state = next;
    if (state !== 'move') window.sampleTest.pause();
    update();
    document.dispatchEvent(new CustomEvent('book-mode-change', { detail: { mode: next, page } }));
  }
  function finish() {
    if (!window.sampleTest.isReady()) return;
    if(activityInfo().edition==='creative'&&!window.sampleTest.getCompletionStatus().canFinish){
      show('read');document.dispatchEvent(new CustomEvent('book-completion-needed',{detail:window.sampleTest.getCompletionStatus()}));return;
    }
    show('move');
    if(activeScene()?.cover)window.sampleTest.pause();else window.sampleTest.start();
  }
  $('#previousPage').onclick = () => {const info=activityInfo();if(info.multiPage&&info.activeIndex>0)chooseActivity(info.activeIndex-1);else if(info.edition!=='creative')turnPage('cover');};
  $('#nextPage').onclick = () => {if(page==='cover')turnPage('story');else chooseActivity(activityInfo().activeIndex+1);};
  $('#bookActivityNav')?.addEventListener('click',event=>{const button=event.target.closest('[data-activity]');if(button)chooseActivity(Number(button.dataset.activity));});
  $('#bookViewport').addEventListener('keydown', event => {
    if (event.target !== $('#bookViewport')) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      if(event.key==='ArrowLeft')$('#previousPage').click();else $('#nextPage').click();
    }
  });
  $('#begin').onclick = () => show('color');
  $('#edit').onclick = () => show('color');
  $('#read').onclick = () => show('read');
  $('#finish').onclick = finish;
  $('#apply').addEventListener('click', () => { if (window.sampleTest.getMode() === 'photo') finish(); });
  const wait = setInterval(() => {
    if (window.sampleTest?.isReady()) { update(); clearInterval(wait); }
  }, 100);
  document.addEventListener('autosave-state-change',update);
  document.addEventListener('handwriting-edited',update);
  document.addEventListener('paper-writing-applied',update);
  document.addEventListener('artwork-edited',update);
  document.addEventListener('book-activity-change',()=>{
    const entry=new URLSearchParams(location.search);
    const keepCover=activityInfo().edition!=='creative'&&page==='cover'&&!entry.has('project')&&entry.get('mode')!=='color';
    state='read';if(!keepCover)page='story';update();
    document.dispatchEvent(new CustomEvent('book-page-change',{detail:{page,activityId:activeScene()?.id}}));
    document.dispatchEvent(new CustomEvent('book-mode-change',{detail:{mode:state,page}}));
  });
  window.storybook = { getState: () => state, getPage: () => page, getScene:activeScene, show, finish, turnPage };
  update();
})();
