/* A full-screen workspace using the SAME canvas, tools, photo flow and save bridge. */
(() => {
  'use strict';
  const $=selector=>document.querySelector(selector),dialog=$('#coloringStudio'),editor=$('#editor');
  const origins=[];
  let canvasStyle=null,mounted=false,exiting=false,zoom=1,panMode=false,panPointer=null;
  const canvasArea=$('#studioCanvasArea'),canvasMount=$('#studioCanvasMount');
  const zoomControls=document.createElement('div');
  zoomControls.id='studioZoomControls';zoomControls.className='studio-zoom-controls';
  zoomControls.setAttribute('role','group');zoomControls.setAttribute('data-keep-english','');
  zoomControls.innerHTML='<button id="studioZoomOut" type="button">−</button><span id="studioZoomValue" aria-live="polite">100%</span><button id="studioZoomIn" type="button">+</button><button id="studioZoomFit" type="button">Fit</button><button id="studioPan" type="button" aria-pressed="false">Move</button>';
  $('.studio-art-heading').appendChild(zoomControls);
  canvasArea.setAttribute('tabindex','0');
  const korean=()=>window.ui?.getLanguage?.()==='ko'||document.documentElement?.lang==='ko';
  const hints={brush:'Soft, see-through strokes that build up',pencil:'Fine lines with a paper-like grain',marker:'Smooth, solid color',crayon:'Rich, waxy texture',fill:'Fill one area with color',erase:'Gently erase your marks'};
  function move(node,mount){
    if(!node||!mount)return;
    const marker=document.createComment('Color Studio return point');
    node.before(marker);origins.push({node,marker});mount.appendChild(node);
  }
  function fitCanvas(){
    if(!dialog.open)return;
    const area=canvasArea.getBoundingClientRect();
    const padding=area.width<650?24:56;
    const scale=Math.max(.01,Math.min((area.width-padding)/1000,(area.height-padding)/563));
    const oldWidth=parseFloat(canvasMount.style.width)||area.width,oldHeight=parseFloat(canvasMount.style.height)||area.height;
    const centerX=((canvasArea.scrollLeft||0)+area.width/2)/Math.max(1,oldWidth),centerY=((canvasArea.scrollTop||0)+area.height/2)/Math.max(1,oldHeight);
    const width=Math.floor(1000*scale*zoom),height=Math.floor(563*scale*zoom);
    const mountWidth=Math.max(area.width,width+padding),mountHeight=Math.max(area.height,height+padding);
    editor.style.width=`${width}px`;editor.style.height=`${height}px`;
    canvasMount.style.width=`${mountWidth}px`;canvasMount.style.height=`${mountHeight}px`;
    canvasArea.scrollLeft=Math.max(0,Math.min(mountWidth-area.width,centerX*mountWidth-area.width/2));
    canvasArea.scrollTop=Math.max(0,Math.min(mountHeight-area.height,centerY*mountHeight-area.height/2));
  }
  function refreshView(){
    const ko=korean(),blocked=exiting||!!window.GPAutoSave?.isRestoring()||$('#upload').disabled||!$('#alignment').hidden;
    $('#studioZoomValue').textContent=`${Math.round(zoom*100)}%`;
    $('#studioZoomOut').disabled=blocked||zoom<=1;$('#studioZoomIn').disabled=blocked||zoom>=3;
    $('#studioZoomFit').disabled=blocked;$('#studioPan').disabled=blocked||zoom<=1;
    $('#studioPan').setAttribute('aria-pressed',String(panMode));
    $('#studioZoomFit').textContent=ko?'맞춤':'Fit';$('#studioPan').textContent=ko?'이동':'Move';
    const labels={studioZoomOut:ko?'그림 축소':'Zoom out',studioZoomIn:ko?'그림 확대':'Zoom in',studioZoomFit:ko?'그림 전체 보기':'Fit picture',studioPan:ko?'이동 모드: 색칠하지 않고 그림 끌기':'Move picture without coloring'};
    for(const [id,label]of Object.entries(labels)){$('#'+id).setAttribute('aria-label',label);$('#'+id).title=label;}
    zoomControls.setAttribute('aria-label',ko?'그림 크기와 이동':'Picture zoom and movement');
    canvasArea.setAttribute('aria-label',panMode?(ko?'확대한 그림을 끌거나 방향키로 이동해요.':'Drag the enlarged picture, or use the arrow keys to move it.'):(ko?'색칠 영역':'Coloring area'));
    canvasArea.classList.toggle('is-panning',panMode);
  }
  function setPan(value){panMode=!!value&&zoom>1;panPointer=null;refreshView();}
  function setZoom(value){
    if(!Number.isFinite(value))return;
    zoom=Math.max(1,Math.min(3,value));if(zoom===1)panMode=false;panPointer=null;fitCanvas();refreshView();
  }
  function resetView(){zoom=1;panMode=false;panPointer=null;canvasArea.scrollLeft=0;canvasArea.scrollTop=0;fitCanvas();refreshView();}
  function panStart(event){
    if(!dialog.open||!panMode||zoom<=1||event.button>0)return;
    event.preventDefault();event.stopImmediatePropagation();
    panPointer={id:event.pointerId,x:event.clientX,y:event.clientY,left:canvasArea.scrollLeft||0,top:canvasArea.scrollTop||0};
    try{editor.setPointerCapture(event.pointerId);}catch(_){}
  }
  function panMove(event){
    if(!panPointer||panPointer.id!==event.pointerId)return;
    event.preventDefault();event.stopImmediatePropagation();
    canvasArea.scrollLeft=panPointer.left+panPointer.x-event.clientX;
    canvasArea.scrollTop=panPointer.top+panPointer.y-event.clientY;
  }
  function panEnd(event){
    if(!panPointer||panPointer.id!==event.pointerId)return;
    event.preventDefault();event.stopImmediatePropagation();panPointer=null;
    try{editor.releasePointerCapture(event.pointerId);}catch(_){}
  }
  function refreshPhotoAction(){
    const button=$('#paperButton'),info=window.GPAutoSave?.getPageInfo?.(),scene=window.storybook?.getScene?.();
    const supported=info?.multiPage?scene?.id==='treats'&&scene.workbook===true:(!scene||scene.id==='treats')&&scene?.workbook!==false;
    const visible=mounted&&dialog.open&&dialog.contains(button)&&window.storybook?.getState()==='color'&&window.storybook?.getPage?.()!=='cover'&&supported;
    const hidden=!visible,disabled=hidden||exiting||!!window.GPAutoSave?.isRestoring()||$('#upload').disabled;
    // Story mode also updates this SAME button. Keep it private to the open studio.
    if(button.hidden!==hidden)button.hidden=hidden;
    if(button.disabled!==disabled)button.disabled=disabled;
    $('#studioPhotoMount').hidden=hidden;
    $('.studio-photo-note').hidden=hidden;
  }
  function refresh(){
    const hint=hints[$('#tool').value]||hints.brush;
    $('#studioToolHint').textContent=hint;
    const restoring=!!window.GPAutoSave?.isRestoring();
    $('#studioFinish').disabled=exiting||restoring||!window.sampleTest?.isReady()||$('#upload').disabled||!$('#alignment').hidden;
    $('#studioClose').disabled=exiting||restoring;
    $('#studioAlignmentMount').hidden=$('#alignment').hidden;
    const completion=window.sampleTest?.getCompletionStatus?.();
    if(completion){
      $('#studioFinish').disabled=$('#studioFinish').disabled||completion.hasColoring!==true;
      const label=$('#studioFinish span');
      if(label){label.setAttribute('data-keep-english','');label.textContent=completion.requiredWritingLines>completion.completedWritingLines?(korean()?'다음: 쓰기':'Next: write'):(korean()?'완료!':'Done!');}
    }
    refreshView();
    refreshPhotoAction();
  }
  function restore(){
    if(!mounted){refreshPhotoAction();return;}
    mounted=false;
    zoom=1;panMode=false;panPointer=null;refreshView();
    refreshPhotoAction();
    for(const {node,marker} of origins.splice(0).reverse())marker.replaceWith(node);
    editor.style.width=canvasStyle.width;editor.style.height=canvasStyle.height;
    document.body.classList.remove('color-studio-open');
  }
  function open(){
    if(dialog.open)return true;
    if(!window.sampleTest?.isReady()||window.GPAutoSave?.isRestoring())return false;
    if(window.storybook.getState()!=='color'){window.storybook.show('color');return dialog.open;}
    canvasStyle={width:editor.style.width,height:editor.style.height};
    mounted=true;
    move(editor,$('#studioCanvasMount'));
    move($('#drawingControls'),$('#studioToolsMount'));
    move($('#paperButton'),$('#studioPhotoMount'));
    move($('#upload'),$('#studioPhotoMount'));
    move($('#alignment'),$('#studioAlignmentContents'));
    move($('#photoBusy'),$('#studioBusyMount'));
    move($('#status'),$('#studioStatusMount'));
    move($('.library-save-control'),$('#studioSaveMount'));
    move($('.library-feedback'),$('#studioFeedbackMount'));
    document.body.classList.add('color-studio-open');
    $('#drawingControls').hidden=false;editor.hidden=false;
    dialog.showModal();resetView();refresh();fitCanvas();
    window.sampleTest.pause();
    return true;
  }
  function close(options={}){
    if(!dialog.open&&!mounted)return false;
    if(dialog.open)dialog.close();
    restore();
    if(options.finish===true)window.storybook.finish();
    else if(options.keepMode!==true&&window.storybook.getState()==='color')window.storybook.show('read');
    return true;
  }
  async function saveAndClose(){
    if(exiting||window.GPAutoSave?.isRestoring())return;
    if(!window.GPAutoSave)return close();
    exiting=true;refresh();
    try{await window.GPAutoSave.flush();close();}
    catch(_){/* The save bridge shows the actionable error; keep the work open. */}
    finally{exiting=false;refresh();}
  }
  $('#studioClose').addEventListener('click',saveAndClose);
  $('#studioFinish').addEventListener('click',()=>{if(!$('#studioFinish').disabled)close({finish:true});});
  $('#studioCancelPhoto').addEventListener('click',()=>{$('#alignment').hidden=true;refresh();});
  dialog.addEventListener('cancel',event=>{event.preventDefault();saveAndClose();});
  dialog.addEventListener('close',()=>{if(!dialog.open&&mounted){restore();if(window.storybook.getState()==='color')window.storybook.show('read');}});
  document.addEventListener('book-mode-change',event=>{
    if(event.detail?.mode==='color'&&event.detail?.page!=='cover')open();
    else if(dialog.open||mounted)close({keepMode:true});
    refreshPhotoAction();
  });
  document.addEventListener('book-activity-change',()=>{resetView();refresh();});
  document.querySelectorAll('[data-tool]').forEach(button=>button.addEventListener('click',()=>{setPan(false);refresh();}));
  $('#tool').addEventListener('change',refresh);
  document.addEventListener('artwork-edited',refresh);
  document.addEventListener('artwork-applied',refresh);
  document.addEventListener('handwriting-edited',refresh);
  document.addEventListener('autosave-state-change',()=>{
    refresh();
    if(!dialog.open&&window.storybook?.getState()==='color'&&!window.GPAutoSave?.isRestoring())open();
  });
  window.addEventListener('resize',fitCanvas);
  $('#studioZoomOut').addEventListener('click',()=>{if(!$('#studioZoomOut').disabled)setZoom(zoom-.5);});
  $('#studioZoomIn').addEventListener('click',()=>{if(!$('#studioZoomIn').disabled)setZoom(zoom+.5);});
  $('#studioZoomFit').addEventListener('click',()=>{if(!$('#studioZoomFit').disabled)resetView();});
  $('#studioPan').addEventListener('click',()=>{if(!$('#studioPan').disabled){setPan(!panMode);if(panMode)canvasArea.focus();}});
  editor.addEventListener('pointerdown',panStart,true);editor.addEventListener('pointermove',panMove,true);
  editor.addEventListener('pointerup',panEnd,true);editor.addEventListener('pointercancel',panEnd,true);editor.addEventListener('lostpointercapture',panEnd,true);
  canvasArea.addEventListener('keydown',event=>{
    if(!panMode||zoom<=1||event.target!==canvasArea)return;
    const delta={ArrowLeft:[-70,0],ArrowRight:[70,0],ArrowUp:[0,-70],ArrowDown:[0,70]}[event.key];
    if(delta){event.preventDefault();event.stopPropagation();canvasArea.scrollLeft=(canvasArea.scrollLeft||0)+delta[0];canvasArea.scrollTop=(canvasArea.scrollTop||0)+delta[1];}
  });
  if(typeof ResizeObserver==='function')new ResizeObserver(fitCanvas).observe($('#studioCanvasArea'));
  if(typeof MutationObserver==='function'){
    const observer=new MutationObserver(refresh);
    observer.observe($('#upload'),{attributes:true,attributeFilter:['disabled']});
    observer.observe($('#alignment'),{attributes:true,attributeFilter:['hidden']});
    observer.observe($('#paperButton'),{attributes:true,attributeFilter:['hidden','disabled']});
    if(document.documentElement)new MutationObserver(refresh).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  }
  // Change only the button's illustration; keep its existing upload handler.
  $('#paperButton').innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7h4l2-3h6l2 3h4v13H3Z"/><circle cx="12" cy="13" r="4"/></svg><span>Use my workbook photo</span>';
  refreshPhotoAction();
  window.coloringStudio=Object.freeze({open,close,isOpen:()=>dialog.open,setZoom,setPan,resetView,getView:()=>({zoom,pan:panMode})});
  if(window.storybook?.getState()==='color'&&window.sampleTest?.isReady())open();
})();
