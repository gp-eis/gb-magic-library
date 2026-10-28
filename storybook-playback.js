/* Read-only playback of actual saved Sugar Bugs pages. No editor or storage writes. */
(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.GPBookPlayback=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
  'use strict';
  const BOOK_ID='bye-bye-sugar-bugs',W=1500,H=740;
  const PICTURE=Object.freeze({x:438,y:140,width:1000,height:563});
  const SCENES=new Set(['treats','sugar-bugs','toothache']);
  const IMAGE_TYPES=new Set(['image/png','image/jpeg','image/webp','image/gif']);
  const AUDIO_FILES=Object.freeze({treats:'story-narration.m4a','sugar-bugs':'pages/sugar-bugs-narration.m4a',toothache:'pages/toothache-narration.m4a'});
  const leases=new WeakMap();
  const scriptURL=root.document?.currentScript?.src;
  const baseURL=scriptURL?new URL('coloring/',scriptURL).href:null;
  const imageBlob=value=>typeof Blob!=='undefined'&&value instanceof Blob&&value.size>0&&value.size<=32*1024*1024&&IMAGE_TYPES.has(value.type.toLowerCase().split(';')[0].trim());
  const pageOf=spread=>Array.isArray(spread?.pages)?(spread.kind==='spread'&&spread.pages.length===1?spread.pages[0]:null):spread;

  function savedScene(record,spread){
    if(!record||record.bookId!==BOOK_ID)return null;
    if(record.editableState?.kind==='sugar-bugs-v3'&&record.editableState.version!==3)return null;
    const saved=Array.isArray(record.pages)&&record.pages.length>0?record.pages:null;
    const creative=record.editableState?.kind==='sugar-bugs-v3'&&record.editableState.version===3;
    if(spread==null)return (!creative||saved)&&((creative&&imageBlob(record.coverBlob))||imageBlob(record.imageBlob)||saved?.some(page=>imageBlob(page?.imageBlob)))?{cover:true}:null;
    const page=pageOf(spread);
    if(!page||!imageBlob(page.imageBlob)||page.layout&&page.layout!=='spread')return null;
    // Use the actual supplied snapshot, never a title, active page, or unsaved manifest page.
    if(saved){
      const matching=saved.filter(candidate=>candidate?.id===page.id);
      if(matching.length!==1||matching[0].imageBlob!==page.imageBlob)return null;
    }else if(page.id!=='saved-spread'||record.imageBlob!==page.imageBlob)return null;
    let id=page.id;
    if(id==='spread-1'||id==='saved-spread'){
      if(saved&&saved.length!==1)return null;
      const state=record.editableState;
      if(state&&!(state.kind==='sugar-bugs-v1'&&state.version===1))return null;
      id='treats';
    }
    if(!SCENES.has(id))return null;
    const manifest=creative?root.GPBookPages?.creativePages:root.GPBookPages?.pages;
    const config=manifest?.find(candidate=>candidate.id===id);
    if(!config||config.audio!==AUDIO_FILES[id])return null;
    return {cover:false,id,page,config,creative};
  }

  function isSupported(record,spread){return !!savedScene(record,spread);}
  function assetURL(path){
    if(typeof path!=='string'||!/^[a-zA-Z0-9_/-]+\.(?:png|jpe?g|webp|m4a)$/i.test(path)||path.split('/').includes('..'))throw new Error('This book media is not available.');
    return new URL(path,baseURL||new URL('coloring/',root.document.baseURI).href).href;
  }
  function drawingFor(record,id){
    const state=record.editableState;
    if(state?.kind==='sugar-bugs-v1'&&state.version===1&&id==='treats')return state.drawing;
    if(((state?.kind==='sugar-bugs-v2'&&state.version===2)||(state?.kind==='sugar-bugs-v3'&&state.version===3))&&Array.isArray(state.pages)){
      const matches=state.pages.filter(page=>page?.id===id);
      if(matches.length===1)return matches[0].drawing;
    }
    return null;
  }
  function actualLayers(record,scene){
    const drawing=drawingFor(record,scene.id),parts=scene.config.parts;
    if(!drawing||drawing.version!==1||!Array.isArray(drawing.parts)||!Array.isArray(parts)||drawing.parts.length!==parts.length)return null;
    const ids=new Set();
    for(const part of drawing.parts){
      if(!part||ids.has(part.id)||!parts.some(known=>known.id===part.id)||!imageBlob(part.imageBlob)||part.imageBlob.type!=='image/png'||part.imageBlob.size>16*1024*1024)return null;
      ids.add(part.id);
    }
    return parts.map(part=>({config:part,blob:drawing.parts.find(saved=>saved.id===part.id).imageBlob}));
  }
  function cancelled(){const error=new Error('This book playback was closed.');error.name='AbortError';return error;}

  async function mount(options={}){
    const {record,spread=null,host,onEnded,onError,signal}=options,scene=savedScene(record,spread);
    if(!scene)throw new Error('Read my book is not available for this saved activity.');
    if(!host||typeof host.append!=='function')throw new Error('The saved book viewer is not ready.');
    leases.get(host)?.destroy();
    let destroyed=false,playing=false,frame=0,canvas=null,ctx=null,snapshot=null,background=null,layers=null,illustration=null;
    let animationKind='still',playRevision=0,errorReported=false;
    const urls=new Set(),images=new Set();
    let resolveCancellation;
    const cancellation=new Promise(resolve=>{resolveCancellation=resolve;});
    const audio=new root.Audio();audio.preload='auto';
    const motionQuery=typeof root.matchMedia==='function'?root.matchMedia('(prefers-reduced-motion: reduce)'):null;
    const requestedMotion=()=>{
      const requested=options.shouldAnimate===undefined?options.animate:options.shouldAnimate;
      try{return (typeof requested==='function'?requested():requested)!==false&&!motionQuery?.matches;}catch(_){return false;}
    };
    const owns=()=>!destroyed&&leases.get(host)===controller;
    const currentTime=()=>Number.isFinite(audio.currentTime)?Math.max(0,audio.currentTime):0;
    const cancelFrame=()=>{if(frame){root.cancelAnimationFrame(frame);frame=0;}};
    function fail(error){
      if(!owns())return;
      playing=false;playRevision++;audio.pause();cancelFrame();
      if(!errorReported){errorReported=true;try{onError?.(error instanceof Error?error:new Error('The original story audio could not be played.'));}catch(_){}}
    }
    function drawSnapshot(){
      if(!ctx||!snapshot||!owns())return;
      ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(snapshot,0,0,canvas.width,canvas.height);
    }
    function outline(context,part){
      context.save();context.scale(1000/1672,563/941);context.strokeStyle='#211d22';context.lineWidth=4;context.lineJoin='round';context.stroke(part.path);
      if(part.id==='soda'){context.beginPath();context.ellipse(1448,661,57,18,.43,0,Math.PI*2);context.stroke();}
      context.restore();
    }
    function draw(time){
      drawSnapshot();
      if(!ctx||!requestedMotion()||animationKind==='still'||!owns())return;
      ctx.save();ctx.beginPath();ctx.rect(PICTURE.x,PICTURE.y,PICTURE.width,PICTURE.height);ctx.clip();
      if(animationKind==='saved-layers'){
        ctx.translate(PICTURE.x,PICTURE.y);ctx.drawImage(background,0,0,1000,563);
        // The same transforms used by the activity, applied only to the child's saved pixels.
        const action=layers[Math.floor(time/4)%layers.length]?.id;
        for(const part of layers){
          ctx.save();
          if(action===part.id){
            const x=part.x*1000/1672,y=part.y*563/941;ctx.translate(x,y);
            if(part.id==='donut'){ctx.translate(0,-Math.abs(Math.sin(time*3))*65);ctx.rotate(Math.sin(time*3)*.18);}
            if(part.id==='candy'){ctx.translate(0,-12*Math.abs(Math.sin(time*3)));ctx.rotate(Math.sin(time*2)*.75);}
            if(part.id==='soda'){ctx.translate(0,-Math.abs(Math.sin(time*4))*10);ctx.rotate(Math.sin(time*5)*.14);}
            ctx.translate(-x,-y);
          }
          ctx.drawImage(part.image,0,0);if(part.outline!==false)outline(ctx,part);ctx.restore();
        }
      }else if(animationKind==='scene-motion'){
        ctx.translate(PICTURE.x,PICTURE.y);
        root.GPSceneMotion.draw(ctx,{sceneId:scene.id,source:illustration,time,width:PICTURE.width,height:PICTURE.height,reducedMotion:false});
      }else{
        // New pages gently move their entire saved illustration. Nothing is cut out or invented.
        const remaining=Number.isFinite(audio.duration)?Math.max(0,audio.duration-time):1;
        const ease=Math.max(0,Math.min(1,time/.6,remaining/.6));
        const scale=1+ease*(.018+.004*Math.sin(time*.65)),dx=ease*3*Math.sin(time*.45),dy=ease*2*Math.sin(time*.55);
        ctx.translate(PICTURE.x+500+dx,PICTURE.y+281.5+dy);ctx.scale(scale,scale);
        ctx.drawImage(snapshot,PICTURE.x,PICTURE.y,1000,563,-500,-281.5,1000,563);
      }
      ctx.restore();
    }
    function tick(){
      frame=0;if(!owns()||!playing)return;
      draw(currentTime());
      if(requestedMotion()&&animationKind!=='still')frame=root.requestAnimationFrame(tick);
    }
    function schedule(){cancelFrame();if(owns()&&playing&&requestedMotion()&&animationKind!=='still')frame=root.requestAnimationFrame(tick);}
    function pause(){if(!owns())return;playing=false;playRevision++;audio.pause();cancelFrame();}
    function stop(){if(!owns())return;pause();try{audio.currentTime=0;}catch(_){}drawSnapshot();}
    function destroy(){
      if(destroyed)return;
      destroyed=true;playing=false;playRevision++;resolveCancellation();cancelFrame();
      audio.pause();audio.removeEventListener('ended',ended);audio.removeEventListener('error',audioError);
      audio.removeEventListener('seeked',seeked);audio.removeEventListener('pause',audioPaused);
      signal?.removeEventListener?.('abort',aborted);
      if(motionQuery?.removeEventListener)motionQuery.removeEventListener('change',motionChanged);
      else motionQuery?.removeListener?.(motionChanged);
      audio.removeAttribute('src');audio.load?.();
      images.forEach(image=>{image.onload=null;image.onerror=null;image.removeAttribute?.('src');});images.clear();
      urls.forEach(url=>root.URL.revokeObjectURL(url));urls.clear();
      canvas?.remove();canvas=null;ctx=null;snapshot=null;background=null;layers=null;
      if(leases.get(host)===controller)leases.delete(host);
    }
    const controller={
      async play(){
        if(!owns())return;
        const revision=++playRevision;errorReported=false;
        if(audio.ended){try{audio.currentTime=0;}catch(_){}}
        try{
          // Start native audio immediately on the user's Play gesture; animation follows its clock.
          const started=audio.play();playing=true;draw(currentTime());schedule();
          await started;
          if(!owns()||revision!==playRevision)return;
        }catch(error){
          if(owns()&&revision===playRevision){fail(error);throw error;}
        }
      },
      pause,stop,destroy,
      get currentTime(){return currentTime();},
      set currentTime(value){if(!owns()||!Number.isFinite(value))return;const end=Number.isFinite(audio.duration)?audio.duration:Infinity;try{audio.currentTime=Math.max(0,Math.min(end,value));draw(currentTime());}catch(_){}},
      get duration(){return Number.isFinite(audio.duration)?audio.duration:null;},
      get isPlaying(){return owns()&&playing;},
      get animationKind(){return animationKind;}
    };
    leases.set(host,controller);
    function ended(){if(!owns()||!playing)return;playing=false;playRevision++;cancelFrame();drawSnapshot();try{onEnded?.();}catch(_){}}
    function audioError(){fail(new Error('The original story audio could not be loaded. Your saved pictures have not been changed.'));}
    function audioPaused(){if(!owns()||!audio.paused||audio.ended)return;playing=false;cancelFrame();}
    function seeked(){if(owns())draw(currentTime());}
    function motionChanged(){if(!owns())return;draw(currentTime());schedule();}
    function aborted(){destroy();}
    audio.addEventListener('ended',ended);audio.addEventListener('error',audioError);
    audio.addEventListener('seeked',seeked);audio.addEventListener('pause',audioPaused);
    if(motionQuery?.addEventListener)motionQuery.addEventListener('change',motionChanged);
    else motionQuery?.addListener?.(motionChanged);
    signal?.addEventListener?.('abort',aborted,{once:true});
    async function decode(source,dimensions){
      if(!owns())throw cancelled();
      const image=new root.Image();images.add(image);
      let url;
      if(typeof source==='string')url=assetURL(source);
      else{url=root.URL.createObjectURL(source);urls.add(url);}
      image.src=url;
      const loaded=typeof image.decode==='function'?image.decode():new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('A saved picture could not be opened.'));});
      await Promise.race([loaded,cancellation.then(()=>{throw cancelled();})]);
      if(!owns())throw cancelled();
      const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;
      if(!width||!height||width*height>24*1024*1024||dimensions&&(width!==dimensions[0]||height!==dimensions[1]))throw new Error('A saved picture has an unsupported size.');
      return image;
    }
    try{
      if(signal?.aborted){destroy();throw cancelled();}
      audio.src=assetURL(scene.cover?'cover-narration.m4a':scene.config.audio);
      if(!scene.cover){
        snapshot=await decode(scene.page.imageBlob);
        if(!owns())throw cancelled();
        const exactComposite=snapshot.naturalWidth===W&&snapshot.naturalHeight===H;
        if(requestedMotion()&&exactComposite){
          if(scene.id==='treats'){
            const saved=actualLayers(record,scene);
            if(saved&&typeof root.Path2D==='function'){
              try{
                const [clean,...pictures]=await Promise.all([decode(scene.creative?scene.config.background:'clean-kitchen.png'),...saved.map(part=>decode(part.blob,[1000,563]))]);
                if(!owns())throw cancelled();
                const prepared=saved.map((part,index)=>{
                  const image=root.document.createElement('canvas');image.width=1000;image.height=563;
                  const context=image.getContext('2d'),path=new root.Path2D(part.config.path);
                  context.save();context.scale(1000/1672,563/941);context.clip(path,'evenodd');context.scale(1672/1000,941/563);context.drawImage(pictures[index],0,0);context.restore();
                  return {...part.config,path,image};
                });
                background=clean;layers=prepared;animationKind='saved-layers';
              }catch(error){if(!owns()||error.name==='AbortError')throw error;/* Old/incomplete layers keep their actual snapshot and audio. */}
            }
          }else if(scene.creative){
            if(typeof root.GPSceneMotion?.draw==='function'){
              illustration=root.document.createElement('canvas');illustration.width=PICTURE.width;illustration.height=PICTURE.height;
              illustration.getContext('2d').drawImage(snapshot,PICTURE.x,PICTURE.y,PICTURE.width,PICTURE.height,0,0,PICTURE.width,PICTURE.height);
              animationKind='scene-motion';
            }
          }else animationKind='picture-motion';
        }
        if(!owns())throw cancelled();
        canvas=root.document.createElement('canvas');canvas.width=snapshot.naturalWidth;canvas.height=snapshot.naturalHeight;
        canvas.className='saved-book-playback-canvas';canvas.setAttribute('aria-hidden','true');
        Object.assign(canvas.style,{position:'absolute',inset:'0',display:'block',width:'100%',height:'100%',objectFit:'contain',pointerEvents:'none'});
        ctx=canvas.getContext('2d');if(!ctx)throw new Error('This browser cannot show the saved animation.');
        drawSnapshot();host.append(canvas);
      }
      if(!owns())throw cancelled();
      return Object.freeze(controller);
    }catch(error){destroy();throw error;}
  }
  return Object.freeze({isSupported,mount});
});
