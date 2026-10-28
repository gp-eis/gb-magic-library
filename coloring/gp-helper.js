/* A quiet in-page GP friend. Reads progress only; no voice, timers, or saved-data writes. */
(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.GPReadingHelper=api;
  if(root.document?.body)api.init();
})(typeof window!=='undefined'?window:globalThis,function(root){
  'use strict';
  const friends={penny:'Penny',gerry:'Gerry',ria:'Ria',syd:'Syd',wanda:'Wanda',don:'Don',coover:'Coover'};
  const prompts={
    'cover-title':{en:'Color the white letters in the title.',ko:'제목의 하얀 글자를 색칠해 보세요.'},
    treats:{en:'Color the donut, candy, and soda.',ko:'도넛과 사탕, 탄산음료를 색칠해 보세요.'},
    'sugar-bugs':{en:'Color the sugar bugs and the tooth.',ko:'충치 벌레와 이를 색칠해 보세요.'},
    toothache:{en:'Color the treats in the picture.',ko:'그림 속 간식들을 색칠해 보세요.'}
  };
  let widget=null,collapsed=false,currentAction=null,currentMissing=[],mobileView=null,lastStep=null,foldTimer=0;
  const autoFold=()=>{try{return root.parent!==root&&/\/pc(\.html)?$/.test(root.parent.location.pathname);}catch(_){return false;}};
  function foldLater(){clearTimeout(foldTimer);foldTimer=setTimeout(()=>{if(!collapsed){collapsed=true;refresh();}},8000);}
  const count=value=>Number.isFinite(value)?Math.max(0,Math.min(4,Math.trunc(value))):Array.isArray(value)?Math.min(4,value.length):0;
  function getGuidance(input={}){
    const ko=input.language==='ko',status=input.status||{},required=count(status.requiredWritingLines),written=Math.min(required,count(status.completedWritingLines));
    const colored=status.hasColoring===true,remaining=Math.max(0,required-written),prompt=prompts[input.sceneId];
    let message='',action=null,actionLabel='';
    if(input.restoring)message=ko?'저장한 활동을 준비하고 있어요. 잠시만 기다려 주세요.':'Getting your saved activity ready. Just a moment!';
    else if(input.frontCover)message=ko?'책을 펼쳐 볼까요? 함께 색칠하고 글씨도 써 봐요!':'Open your book. Let’s color and write together!';
    else if(!prompt)message=ko?'이야기를 색칠하고 글자를 따라 써 봐요!':'Let’s color a story and trace the words together!';
    else if(!colored){
      message=prompt[ko?'ko':'en'];
      if(required&&remaining)message+=ko?' 이야기의 모든 문장도 따라 써요.':' We’ll trace every story line, too.';
      else if(required)message+=ko?' 글씨 쓰기는 준비됐어요!':' Your writing is ready!';
      else message+=ko?' 좋아하는 색을 골라요!':' Pick your favorite colors!';
    }else if(remaining){
      if(input.inStudio){message=ko?'멋지게 색칠했어요! 이제 책으로 돌아가 모든 문장을 따라 써요.':'Lovely colors! Go back to your book and trace every story line.';action='return-to-writing';actionLabel=ko?'이제 글씨 쓰기':'Let’s write';}
      else{message=ko?`색칠이 준비됐어요! 문장을 눌러 따라 써요. ${remaining}줄 더 써 볼까요?`:`Your colors are ready! Tap a story line and trace it. ${remaining} more ${remaining===1?'line':'lines'} to go!`;action='trace-next';actionLabel=ko?'다음 문장 쓰기':'Trace the next line';}
    }else if(input.completed)message=ko?'이 활동을 마쳤어요! 다음 이야기로 가 볼까요?':'Page complete! Ready for your next adventure?';
    else if(input.inStudio)message=ko?'잘했어요! 준비되면 완료!를 눌러요.':'Great work! Tap Done! when you’re ready.';
    else message=ko?'이 페이지가 준비됐어요! 완료!를 눌러 활동을 마쳐요.':'Your page is ready! Tap Done! to finish it.';
    return Object.freeze({
      message,action,actionLabel,
      colorLabel:ko?(colored?'색칠 ✓':'색칠하기'):(colored?'Color ✓':'Color'),
      writingLabel:required?(ko?`쓰기 ${written}/${required}`:`Writing ${written}/${required}`):'',
      hasColoring:colored,requiredWritingLines:required,completedWritingLines:written
    });
  }
  function language(){return root.ui?.getLanguage?.()==='ko'||root.document?.documentElement?.lang==='ko'?'ko':'en';}
  function avatar(){
    try{
      const profile=JSON.parse(root.localStorage?.getItem('gp.reading.profile.v1')||'null');
      const id=profile?.avatarId==='coover-beekeeper'?'coover':profile?.avatarId;
      if(Object.hasOwn(friends,id))return id;
    }catch(_){}
    return 'ria';
  }
  function text(id,value){const node=root.document.getElementById(id);if(node&&node.textContent!==value)node.textContent=value;}
  function updateViewport(){
    const width=root.innerWidth||root.document?.documentElement?.clientWidth||1024,nextMobile=width<=750;
    if(mobileView===null)collapsed=nextMobile;
    else if(mobileView!==nextMobile)collapsed=true;
    mobileView=nextMobile;
  }
  function position(inStudio){
    const doc=root.document,layoutWidth=Math.max(root.innerWidth||1024,doc.documentElement?.clientWidth||0),layoutHeight=Math.max(root.innerHeight||844,doc.documentElement?.clientHeight||0);
    const visual=root.visualViewport,width=visual?.width>0?visual.width:layoutWidth,height=visual?.height>0?visual.height:layoutHeight;
    const left=Number.isFinite(visual?.offsetLeft)?Math.max(0,visual.offsetLeft):0,top=Number.isFinite(visual?.offsetTop)?Math.max(0,visual.offsetTop):0;
    const right=Math.min(layoutWidth,left+width),bottom=Math.min(layoutHeight,top+height),mobile=layoutWidth<=750,gap=mobile?12:20;
    let anchorBottom=bottom-(mobile&&!inStudio?94:mobile?12:22);
    if(!inStudio||mobile){
      const obstacle=doc.querySelector(inStudio?'.studio-sidebar':'.reading-bottom-bar');
      const rect=obstacle&&!obstacle.hidden?obstacle.getBoundingClientRect():null;
      const obstacleVisible=rect&&rect.width>0&&rect.height>0&&rect.bottom>top&&rect.top<bottom&&rect.right>left&&rect.left<right;
      if(obstacleVisible)anchorBottom=Math.min(bottom-gap,rect.top-(inStudio?10:gap));
    }
    // If a very short visible viewport leaves no room above the controls, keep
    // the helper inside the viewport with scrolling text, above controls in z-order.
    if(anchorBottom-top-gap<44)anchorBottom=bottom-gap;
    const available=Math.max(1,anchorBottom-top-gap);
    widget.style.setProperty('--gp-helper-bottom',`${Math.ceil(Math.max(0,layoutHeight-anchorBottom))}px`);
    widget.style.setProperty('--gp-helper-right',`${Math.ceil(Math.max(gap,layoutWidth-right+gap))}px`);
    widget.style.setProperty('--gp-helper-max-height',`${Math.floor(available)}px`);
    widget.style.setProperty('--gp-helper-max-width',`${Math.floor(Math.max(1,right-left-2*gap))}px`);
  }
  function reposition(){if(widget)position(!!root.document.getElementById('coloringStudio')?.open);}
  function refresh(){
    if(!widget)return;
    updateViewport();
    const doc=root.document,studio=doc.getElementById('coloringStudio'),inStudio=!!studio?.open,ko=language()==='ko';
    const parent=inStudio?studio:doc.body;if(widget.parentElement!==parent)parent.appendChild(widget);
    widget.classList.toggle('in-color-studio',inStudio);widget.classList.toggle('is-collapsed',collapsed);
    const scene=root.storybook?.getScene?.(),info=root.GPAutoSave?.getPageInfo?.();
    // In the library's frame (pc.html) the bubble opens for each new page or step, then folds into My Mate
    // after a few seconds or when the child starts working, so it never stays over the picture.
    const stepKey=[scene?.id,inStudio,info?.activeIndex,info?.pages?.[info?.activeIndex]?.completed].join('|');
    if(stepKey!==lastStep){lastStep=stepKey;if(autoFold()){collapsed=false;foldLater();}}
    const status=root.sampleTest?.getCompletionStatus?.()||{hasColoring:false,requiredWritingLines:scene?.lines?.filter(line=>String(line).trim()).length||0,completedWritingLines:0};
    currentMissing=Array.isArray(status.missingLineIds)?status.missingLineIds.slice():[];
    const guidance=getGuidance({sceneId:scene?.id,status,language:ko?'ko':'en',inStudio,restoring:!!root.GPAutoSave?.isRestoring(),completed:info?.pages?.[info.activeIndex]?.completed===true,frontCover:root.storybook?.getPage?.()==='cover'&&scene?.id!=='cover-title'});
    const id=avatar(),name=friends[id],image=doc.getElementById('gpHelperAvatar');
    if(image.dataset.avatar!==id){image.dataset.avatar=id;image.hidden=false;image.src=`../assets/avatars/${id}.webp`;}
    image.alt=name;text('gpHelperName',ko?`${name}와 함께 해요`:`Your GP friend, ${name}`);
    text('gpHelperMessage',guidance.message);text('gpHelperColorProgress',guidance.colorLabel);text('gpHelperWritingProgress',guidance.writingLabel);
    doc.getElementById('gpHelperWritingProgress').hidden=!guidance.writingLabel;
    currentAction=guidance.action;const action=doc.getElementById('gpHelperAction');
    text('gpHelperAction',guidance.actionLabel);action.hidden=!guidance.action;action.disabled=!!root.GPAutoSave?.isRestoring()||(inStudio&&doc.getElementById('studioClose')?.disabled===true);
    doc.getElementById('gpHelperBubble').hidden=collapsed;
    const toggle=doc.getElementById('gpHelperToggle');toggle.setAttribute('aria-expanded',String(!collapsed));
    toggle.setAttribute('aria-label',collapsed?(ko?'GP 친구 도움말 열기':'Open your GP friend’s help'):(ko?'GP 친구 도움말 접기':'Collapse your GP friend’s help'));
    doc.getElementById('gpHelperClose').setAttribute('aria-label',ko?'도움말 접기':'Collapse help');
    widget.setAttribute('aria-label',ko?'나의 GP 친구 도움말':'Your GP friend’s help');position(inStudio);
  }
  function collapse(){collapsed=true;refresh();root.document.getElementById('gpHelperToggle')?.focus();}
  function expand(){updateViewport();collapsed=false;refresh();if(autoFold())foldLater();}
  function act(){
    if(root.GPAutoSave?.isRestoring())return;
    const doc=root.document;
    if(currentAction==='return-to-writing'){const back=doc.getElementById('studioClose');if(back&&!back.disabled)back.click();return;}
    if(currentAction==='trace-next'){
      const ids=root.GPBookPages?.lineIds||['line-yum','line-donut','line-candy','line-yum-again'];
      const candidates=currentMissing.length?currentMissing:ids;
      const line=candidates.filter(id=>ids.includes(id)).map(id=>doc.getElementById(id)).find(row=>row&&!row.hidden&&!row.classList.contains('has-writing'));
      line?.click();
    }
  }
  function init(){
    if(widget||!root.document?.body)return widget;
    const doc=root.document;widget=doc.createElement('aside');widget.id='gpReadingHelper';widget.className='gp-reading-helper';widget.setAttribute('data-keep-english','');
    widget.innerHTML='<section id="gpHelperBubble" class="gp-helper-bubble"><button id="gpHelperClose" class="gp-helper-close" type="button">×</button><p id="gpHelperName" class="gp-helper-name"></p><p id="gpHelperMessage" class="gp-helper-message" role="status" aria-live="polite" aria-atomic="true"></p><div class="gp-helper-progress"><span id="gpHelperColorProgress"></span><span id="gpHelperWritingProgress"></span></div><button id="gpHelperAction" class="gp-helper-action" type="button" hidden></button></section><button id="gpHelperToggle" class="gp-helper-toggle" type="button" aria-controls="gpHelperBubble" aria-expanded="true"><span class="gp-helper-avatar"><span aria-hidden="true">GP</span><img id="gpHelperAvatar" alt="Ria"></span><span class="gp-helper-spark" aria-hidden="true">?</span></button>';
    doc.body.appendChild(widget);
    doc.getElementById('gpHelperClose').addEventListener('click',collapse);
    doc.getElementById('gpHelperToggle').addEventListener('click',()=>collapsed?expand():collapse());
    doc.getElementById('gpHelperAction').addEventListener('click',act);
    doc.addEventListener('pointerdown',event=>{if(autoFold()&&!collapsed&&!widget.contains(event.target)){collapsed=true;refresh();}},true);
    doc.getElementById('gpHelperAvatar').addEventListener('error',event=>{
      const image=event.target;if(image.dataset.avatar!=='ria'){image.dataset.avatar='ria';image.src='../assets/avatars/ria.webp';image.alt='Ria';}else image.hidden=true;
    });
    for(const event of ['book-activity-change','artwork-edited','handwriting-edited','paper-writing-applied','artwork-applied','autosave-state-change','book-mode-change'])doc.addEventListener(event,refresh);
    doc.addEventListener('book-completion-needed',expand);
    root.addEventListener?.('resize',refresh);
    root.addEventListener?.('scroll',reposition,{passive:true,capture:true});
    root.visualViewport?.addEventListener?.('resize',refresh,{passive:true});
    root.visualViewport?.addEventListener?.('scroll',reposition,{passive:true});
    root.addEventListener?.('storage',event=>{if(event.key==='gp.reading.profile.v1'||event.key==='storybook-ui-language')refresh();});
    const Observer=root.MutationObserver||globalThis.MutationObserver;
    if(typeof Observer==='function'){
      if(doc.documentElement)new Observer(refresh).observe(doc.documentElement,{attributes:true,attributeFilter:['lang']});
      const studio=doc.getElementById('coloringStudio');if(studio)new Observer(refresh).observe(studio,{attributes:true,attributeFilter:['open']});
    }
    refresh();return widget;
  }
  return Object.freeze({getGuidance,init,refresh,collapse,expand,getState:()=>({collapsed,action:currentAction})});
});
