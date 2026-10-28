(()=>{'use strict';const $=s=>document.querySelector(s),W=1000,H=563,SX=W/1672,SY=H/941,editor=$('#editor'),ec=editor.getContext('2d'),stage=$('#motion'),sc=stage.getContext('2d'),template=$('#template'),background=$('#background'),color=$('#color'),tool=$('#tool'),size=$('#size');
const donut=new Path2D();donut.ellipse(284,733,118,102,0,0,Math.PI*2);donut.moveTo(319,715);donut.ellipse(285,715,34,26,0,0,Math.PI*2,true);
const candy=new Path2D();candy.ellipse(582,696,76,77,0,0,Math.PI*2);candy.roundRect(410,682,104,19,9);
const soda=new Path2D('M1394 642 Q1448 629 1500 676 L1440 826 Q1426 860 1370 844 Q1308 830 1318 781 Z');
const parts=[{name:'donut',path:donut,x:284,y:733},{name:'candy',path:candy,x:582,y:696},{name:'soda',path:soda,x:1410,y:745}].map(p=>{const c=document.createElement('canvas');c.width=W;c.height=H;return{...p,c,ctx:c.getContext('2d',{willReadFrequently:true})}});
let ready=false,history=[],drawing=null,last=null,playing=false,phase=0,previous=0,photo=null,fit=null,marks=[],lastCaption='',mode='drawing',baselinePixels=null,gesture=null,strokeSequence=0,importGeneration=0;
const textures=window.GPPaintTextures,eraseLayer=document.createElement('canvas');eraseLayer.width=W;eraseLayer.height=H;const eraseContext=eraseLayer.getContext('2d');editor.style.touchAction='none';
let sceneTemplate=template,sceneBackground=background,sceneId='treats',sceneCaption='',sceneStaticPreview=false,sceneGeneration=0,sceneCreative=false,sceneWritingLines=[];
function imageReady(img){return img.complete&&img.naturalWidth?Promise.resolve():new Promise((res,rej)=>{img.onload=res;img.onerror=rej})}
function captureParts(){return parts.map(p=>p.ctx.getImageData(0,0,W,H))}
function pushSnapshot(state){history.push(state);if(history.length>8)history.shift()}
function snapshot(){pushSnapshot(captureParts())}
function differentPixels(first,second){if(first.length!==second.length)return true;for(let i=0;i<first.length;i++)if(first[i]!==second[i])return true;return false}
function partsChanged(before){return parts.some((p,i)=>differentPixels(before[i].data,p.ctx.getImageData(0,0,W,H).data))}
function edited(action,paintTool){document.dispatchEvent(new CustomEvent('artwork-edited',{detail:{action,tool:paintTool,changed:true}}))}
function copyCanvas(source){const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;canvas.getContext('2d').drawImage(source,0,0);return canvas}
function encodePNG(canvas){return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('The editable coloring could not be saved.')),'image/png'))}
async function decodePartPNG(blob){
 if(!(blob instanceof Blob)||blob.type.toLowerCase().split(';')[0].trim()!=='image/png'||!blob.size||blob.size>16777216)throw new Error('Each editable coloring layer must be a PNG picture.');
 const header=new Uint8Array(await blob.slice(0,33).arrayBuffer()),signature=[137,80,78,71,13,10,26,10];
 if(header.length<33||signature.some((value,index)=>header[index]!==value)||String.fromCharCode(...header.slice(12,16))!=='IHDR')throw new Error('An editable coloring layer is not a valid PNG.');
 const dimensions=new DataView(header.buffer,header.byteOffset,header.byteLength);if(dimensions.getUint32(16)!==W||dimensions.getUint32(20)!==H)throw new Error('Editable coloring layers must be 1000 by 563 pixels.');
 const url=URL.createObjectURL(blob);try{const image=new Image();image.src=url;await image.decode();if(image.naturalWidth!==W||image.naturalHeight!==H)throw new Error('An editable coloring layer has the wrong dimensions.');const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;canvas.getContext('2d').drawImage(image,0,0);return canvas;}finally{URL.revokeObjectURL(url)}
}
function exportState(){
 if(!ready)return Promise.reject(new Error('The coloring picture is not ready yet.'));
 // Clone synchronously before PNG callbacks: later pen movement cannot change
 // the revision being saved, and no original uploaded photograph is included.
 const copies=parts.map(part=>({id:part.name,canvas:copyCanvas(part.c)})),settings={tool:tool.value,color:color.value,size:Number(size.value)},savedMode=mode==='photo'?'photo':'draw';
 return Promise.all(copies.map(async part=>({id:part.id,imageBlob:await encodePNG(part.canvas)}))).then(saved=>({version:1,mode:savedMode,parts:saved,...settings}));
}
async function importState(state){
 const generation=++importGeneration;await illustrationReady;
 const ids=parts.map(part=>part.name);
 if(!state||state.version!==1||!['draw','photo'].includes(state.mode)||!Array.isArray(state.parts)||state.parts.length!==parts.length||new Set(state.parts.map(part=>part?.id)).size!==parts.length||state.parts.some(part=>!ids.includes(part?.id)))throw new Error('This editable coloring state is not supported.');
 if(!textures.TOOLS.includes(state.tool)||!/^#[0-9a-f]{6}$/i.test(state.color)||!Number.isFinite(state.size)||state.size<1||state.size>96)throw new Error('The saved painting tool settings are not valid.');
 const decoded=await Promise.all(state.parts.map(async saved=>({id:saved.id,image:await decodePartPNG(saved.imageBlob)})));
 if(generation!==importGeneration)throw new Error('A newer coloring action replaced this restore request.');
 const prepared=decoded.map(saved=>{const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(saved.image,0,0);const pixels=context.getImageData(0,0,W,H),part=parts.find(item=>item.name===saved.id);for(let at=0;at<pixels.data.length;at+=4)if(!part.originalPixels[at+3])pixels.data.fill(0,at,at+4);return {part,pixels};});
 if(generation!==importGeneration)throw new Error('A newer coloring action replaced this restore request.');
 // Validation and decoding are complete. Apply all three layers together, and
 // discard only ephemeral gesture/history state, never the original baseline.
 const pointer=gesture?.pointerId;gesture=null;drawing=null;last=null;history=[];playing=false;phase=0;
 try{if(pointer!=null&&editor.hasPointerCapture?.(pointer))editor.releasePointerCapture(pointer)}catch(_){}
 for(const item of prepared)item.part.ctx.putImageData(item.pixels,0,0);
 mode=state.mode==='photo'?'photo':'drawing';tool.value=state.tool;color.value=state.color;size.min=String(Math.min(Number(size.min)||1,state.size));size.max=String(Math.max(Number(size.max)||96,state.size));size.value=String(state.size);photo=null;fit=null;marks=[];$('#alignment').hidden=true;
 document.querySelectorAll('[data-tool]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.tool===state.tool)));
 document.querySelectorAll('[data-size]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.size)===state.size)));
 redraw();playLabel();tool.dispatchEvent(new Event('change'));color.dispatchEvent(new Event('input'));size.dispatchEvent(new Event('input'));
 // The legacy custom-color input handler deliberately clears the palette.
 // Restore the saved palette selection after that handler has run.
 $('#swatches').querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String((button.dataset.color||button.style.getPropertyValue('--paint')).trim().toLowerCase()===state.color.toLowerCase())));
}
async function loadScene(config){
 const generation=++sceneGeneration;importGeneration++;
 const localImage=value=>typeof value==='string'&&/^[a-z0-9_./-]+\.(?:png|webp|jpe?g)$/i.test(value)&&!value.startsWith('/')&&!value.split('/').includes('..');
 if(!config||typeof config.id!=='string'||!config.id||config.id.length>100||!localImage(config.template)||!localImage(config.background)||!Array.isArray(config.parts)||![2,3].includes(config.parts.length)||new Set(config.parts.map(part=>part?.id)).size!==config.parts.length)throw new Error('This coloring scene configuration is not supported.');
 const definitions=config.parts.map(part=>{if(!part||!/^[a-z][a-z0-9-]{0,63}$/.test(part.id)||typeof part.path!=='string'||!part.path||part.path.length>20000||!Number.isFinite(part.x)||!Number.isFinite(part.y)||part.x<0||part.x>1672||part.y<0||part.y>941)throw new Error('A coloring scene has an invalid object mask.');return{...part,path:new Path2D(part.path)};});
 await illustrationReady;
 const decode=async source=>{const image=new Image();image.src=source;await image.decode();if(!image.naturalWidth||!image.naturalHeight)throw new Error('A coloring scene picture could not load.');return image;};
 const [nextTemplate,nextBackground]=await Promise.all([decode(config.template),decode(config.background)]);
 const prepared=definitions.map(definition=>{const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const part={name:definition.id,path:definition.path,x:definition.x,y:definition.y,outline:definition.outline!==false,c:canvas,ctx:canvas.getContext('2d',{willReadFrequently:true})};part.ctx.save();clip(part.ctx,part);part.ctx.drawImage(nextTemplate,0,0,W,H);part.ctx.restore();
  if(definition.whiteOnly||config.blankObjects){const pixels=part.ctx.getImageData(0,0,W,H);for(let at=0;at<pixels.data.length;at+=4){if(!pixels.data[at+3])continue;const light=.2126*pixels.data[at]+.7152*pixels.data[at+1]+.0722*pixels.data[at+2];if(definition.whiteOnly){if(Math.min(pixels.data[at],pixels.data[at+1],pixels.data[at+2])<232)pixels.data.fill(0,at,at+4);}else{const shade=light<205?35:255;pixels.data[at]=pixels.data[at+1]=pixels.data[at+2]=shade;}}part.ctx.putImageData(pixels,0,0);if(definition.whiteOnly){part.pixelMask=copyCanvas(canvas);const maskContext=part.pixelMask.getContext('2d'),mask=maskContext.getImageData(0,0,W,H);for(let at=3;at<mask.data.length;at+=4)mask.data[at]=mask.data[at]?255:0;maskContext.putImageData(mask,0,0);}}
  part.originalPixels=part.ctx.getImageData(0,0,W,H).data.slice();return part;});
 if(generation!==sceneGeneration)throw new Error('A newer page replaced this scene request.');
 importGeneration++;const heldPointer=gesture?.pointerId;gesture=null;drawing=null;last=null;history=[];playing=false;phase=0;photo=null;fit=null;marks=[];
 try{if(heldPointer!=null&&editor.hasPointerCapture?.(heldPointer))editor.releasePointerCapture(heldPointer)}catch(_){}
 sceneTemplate=nextTemplate;sceneBackground=nextBackground;sceneId=config.id;sceneCaption=typeof config.caption==='string'?config.caption.slice(0,400):'';sceneStaticPreview=config.staticPreview===true;sceneCreative=config.requiredWriting===true||config.cover===true;sceneWritingLines=config.requiredWriting===true?(config.lines||[]).map((text,index)=>text.trim()?['line-yum','line-donut','line-candy','line-yum-again'][index]:null).filter(Boolean):[];parts.splice(0,parts.length,...prepared);mode='drawing';lastCaption='';$('#alignment').hidden=true;
 redraw();baselinePixels=ec.getImageData(0,0,W,H).data.slice();playLabel();
}
function clip(ctx,p){ctx.scale(SX,SY);ctx.clip(p.path,'evenodd');ctx.scale(1/SX,1/SY)}
function initialize(){for(const p of parts){if(p.originalPixels&&sceneCreative){const pixels=p.ctx.createImageData(W,H);pixels.data.set(p.originalPixels);p.ctx.putImageData(pixels,0,0);continue;}p.ctx.clearRect(0,0,W,H);p.ctx.save();clip(p.ctx,p);p.ctx.drawImage(sceneTemplate,0,0,W,H);p.ctx.restore();if(!p.originalPixels)p.originalPixels=p.ctx.getImageData(0,0,W,H).data.slice()}}
function outline(ctx,p){if(sceneId!=='treats'||p.outline===false)return;ctx.save();ctx.scale(SX,SY);ctx.strokeStyle='#211d22';ctx.lineWidth=4;ctx.lineJoin='round';ctx.stroke(p.path);if(p.name==='soda'){ctx.beginPath();ctx.ellipse(1448,661,57,18,.43,0,Math.PI*2);ctx.stroke()}ctx.restore()}
/* the picture's own black lines stay on top of the colour: where a part is painted, the picture is multiplied back
   over the paint (white leaves the colour as it is, black lines stay black) */
const lineLayer=document.createElement('canvas');lineLayer.width=W;lineLayer.height=H;const lc=lineLayer.getContext('2d');
function keepLines(ctx,p){lc.globalCompositeOperation='source-over';lc.clearRect(0,0,W,H);lc.drawImage(p.c,0,0);lc.globalCompositeOperation='source-in';lc.drawImage(sceneTemplate,0,0,W,H);ctx.save();ctx.globalCompositeOperation='multiply';ctx.drawImage(lineLayer,0,0);ctx.restore()}
function paintParts(ctx,t,action){for(const p of parts){ctx.save();let moving=action==='all'||action===p.name;if(moving){const x=p.x*SX,y=p.y*SY;ctx.translate(x,y);if(p.name==='donut'){ctx.translate(0,-Math.abs(Math.sin(t*3))*65);ctx.rotate(Math.sin(t*3)*.18)}if(p.name==='candy'){ctx.translate(0,-12*Math.abs(Math.sin(t*3)));ctx.rotate(Math.sin(t*2)*.75)}if(p.name==='soda'){ctx.translate(0,-Math.abs(Math.sin(t*4))*10);ctx.rotate(Math.sin(t*5)*.14)}ctx.translate(-x,-y)}ctx.drawImage(p.c,0,0);keepLines(ctx,p);outline(ctx,p);ctx.restore()}}
function renderEditor(){if(!ready)return;for(const part of parts)if(part.pixelMask){part.ctx.save();part.ctx.globalCompositeOperation='destination-in';part.ctx.drawImage(part.pixelMask,0,0);part.ctx.restore();}ec.clearRect(0,0,W,H);ec.drawImage(sceneTemplate,0,0,W,H);paintParts(ec,0,'still')}
function actionAt(){let a=$('#action').value;return a==='story'?parts[Math.floor(phase/4)%parts.length].name:a}
function renderStage(){if(!ready)return;sc.clearRect(0,0,W,H);let action=actionAt();if(sceneCreative&&['sugar-bugs','toothache','cover-title'].includes(sceneId)){if(window.GPSceneMotion)window.GPSceneMotion.draw(sc,{sceneId,source:editor,time:phase,width:W,height:H,reducedMotion:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true});else sc.drawImage(editor,0,0);}else if(sceneStaticPreview)sc.drawImage(editor,0,0);else{sc.drawImage(sceneBackground,0,0,W,H);paintParts(sc,phase,action)}let caption=sceneCaption||(sceneId==='treats'?{donut:'Yum! A donut!',candy:'Candy and soda!',soda:'Yum!',all:'My treats come to life!'}[action]:'My coloring picture.');if(caption!==lastCaption){$('#caption').textContent=caption;lastCaption=caption}}
function redraw(){renderEditor();renderStage();$('#undo').disabled=history.length===0}
function xy(e){const r=editor.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
function hit(pt){ec.save();ec.setTransform(SX,0,0,SY,0,0);let p=[...parts].reverse().find(p=>ec.isPointInPath(p.path,pt.x,pt.y,'evenodd'));ec.restore();return p}
function renderGesture(){
 if(!gesture)return;const {part,base,points,options}=gesture,c=part.ctx;c.putImageData(base,0,0);c.save();clip(c,part);
 if(options.tool==='erase'){
  eraseContext.clearRect(0,0,W,H);const bounds=textures.renderStroke(eraseContext,points,options);
  // Interpolate only masked pixels back to the actual original line art.
  // A broad destination-over redraw would darken untouched antialiased edges.
  if(bounds){const mask=eraseContext.getImageData(bounds.x,bounds.y,bounds.width,bounds.height).data,image=c.getImageData(bounds.x,bounds.y,bounds.width,bounds.height),original=part.originalPixels;
   for(let y=0;y<bounds.height;y++)for(let x=0;x<bounds.width;x++){const local=(y*bounds.width+x)*4,global=((y+bounds.y)*W+x+bounds.x)*4,amount=mask[local+3]/255;if(!amount||!original[global+3])continue;for(let channel=0;channel<4;channel++)image.data[local+channel]=Math.round(base.data[global+channel]*(1-amount)+original[global+channel]*amount)}
   c.putImageData(image,bounds.x,bounds.y);
  }
 }else textures.renderStroke(c,points,options);
 c.restore();redraw();
}
function fillRegion(part,point,hex){
 const image=part.ctx.getImageData(0,0,W,H),data=image.data,x=Math.max(0,Math.min(W-1,Math.floor(point.x))),y=Math.max(0,Math.min(H-1,Math.floor(point.y))),start=y*W+x,offset=start*4;
 if(data[offset+3]<24)return false;
 const probe=document.createElement('canvas');probe.width=probe.height=1;const probeContext=probe.getContext('2d');probeContext.fillStyle=hex;probeContext.fillRect(0,0,1,1);const paint=probeContext.getImageData(0,0,1,1).data;
 const target=[data[offset],data[offset+1],data[offset+2]],replacement=[paint[0],paint[1],paint[2]];
 if(target.every((value,index)=>value===replacement[index]))return false;
 const visited=new Uint8Array(W*H),queue=new Int32Array(W*H);let head=0,tail=1,changed=false;queue[0]=start;visited[start]=1;
 const matches=index=>{const at=index*4;return data[at+3]>=24&&Math.abs(data[at]-target[0])<=38&&Math.abs(data[at+1]-target[1])<=38&&Math.abs(data[at+2]-target[2])<=38};
 while(head<tail){const index=queue[head++],at=index*4;if(!matches(index))continue;
  if(data[at]!==replacement[0]||data[at+1]!==replacement[1]||data[at+2]!==replacement[2])changed=true;
  data[at]=replacement[0];data[at+1]=replacement[1];data[at+2]=replacement[2];
  const px=index%W,py=Math.floor(index/W);for(const next of [px>0?index-1:-1,px<W-1?index+1:-1,py>0?index-W:-1,py<H-1?index+W:-1])if(next>=0&&!visited[next]){visited[next]=1;queue[tail++]=next;}
 }
 if(changed)part.ctx.putImageData(image,0,0);return changed;
}
function end(event){
 if(!gesture)return;if(event?.pointerId!=null&&event.pointerId!==gesture.pointerId)return;
 if(event?.type==='pointerup'&&Number.isFinite(event.clientX)&&Number.isFinite(event.clientY)){const point=xy(event);if(Math.hypot(point.x-last.x,point.y-last.y)>.15){gesture.points.push(point);last=point;renderGesture()}}
 const finished=gesture;gesture=null;drawing=null;last=null;
 const changed=differentPixels(finished.base.data,finished.part.ctx.getImageData(0,0,W,H).data);
 if(changed){pushSnapshot(finished.before);$('#status').textContent='Looking good! Tap Done to make it move.';edited('stroke',finished.options.tool);}
 try{if(editor.hasPointerCapture?.(finished.pointerId))editor.releasePointerCapture(finished.pointerId)}catch(_){}
 redraw();
}
editor.onpointerdown=e=>{
 if(!ready||gesture||(e.button!=null&&e.button!==0))return;e.preventDefault();const point=xy(e),part=hit(point);
 if(!part){$('#status').textContent='Draw inside the donut, candy, or soda.';return}
 if(!textures){$('#status').textContent='The painting tools could not load. Please refresh this local page.';return}
 importGeneration++;
 mode='drawing';const before=captureParts(),options=textures.normalizeOptions({tool:tool.value,color:color.value,size:Number(size.value),seed:++strokeSequence});
 if(options.tool==='fill'){if(fillRegion(part,point,options.color)){pushSnapshot(before);edited('fill','fill');$('#status').textContent='Your color filled this space. Tap Done when you are ready.'}redraw();return}
 drawing=part;last=point;gesture={pointerId:e.pointerId,part,before,base:before[parts.indexOf(part)],points:[point],options};
 try{editor.setPointerCapture(e.pointerId)}catch(_){}renderGesture();
};
editor.onpointermove=e=>{
 if(!gesture||e.pointerId!==gesture.pointerId)return;e.preventDefault();const events=e.getCoalescedEvents?.()||[];
 for(const event of events.length?events:[e]){const point=xy(event);if(Math.hypot(point.x-last.x,point.y-last.y)>.15){gesture.points.push(point);last=point}}
 renderGesture();
};
editor.onpointerup=end;editor.onpointercancel=end;editor.onlostpointercapture=end;
for(const selector of ['#undo','#clear','#example'])$(selector).addEventListener('click',()=>{importGeneration++},true);
$('#upload').addEventListener('change',()=>{importGeneration++},true);
for(const [name,hex] of [['Purple','#a46cda'],['Pink','#f078b1'],['Green','#43bba5'],['Yellow','#f2bf43'],['Blue','#468ad6'],['Red','#f16d59'],['Brown','#714329'],['White','#ffffff']]){let b=document.createElement('button');b.dataset.color=hex;b.style.setProperty('--paint',hex);b.setAttribute('aria-label',name);b.setAttribute('aria-pressed',String(hex===color.value));b.onclick=()=>{color.value=hex;$('#swatches').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)))};$('#swatches').append(b)}
$('#undo').onclick=()=>{if(!ready)return;end();const old=history.pop();if(old){const changed=partsChanged(old);parts.forEach((p,i)=>p.ctx.putImageData(old[i],0,0));if(changed)edited('undo',tool.value)}redraw()};$('#clear').onclick=()=>{if(!ready)return;end();const before=captureParts();initialize();mode='drawing';if(partsChanged(before)){pushSnapshot(before);edited('clear',tool.value)}redraw()};
$('#example').onclick=()=>{if(!ready)return;snapshot();initialize();for(let i=0;i<parts.length;i++){const p=parts[i],c=p.ctx;c.save();clip(c,p);c.fillStyle=['#d7bdf0','#9bdfcf','#f7d885'][i];c.fillRect(0,0,W,H);c.strokeStyle=['#9155ce','#e45d9c','#328bb5'][i];c.lineWidth=8;if(i!==1){for(let x=-H;x<W;x+=23){c.beginPath();c.moveTo(x,0);c.lineTo(x+H,H);c.stroke()}}else{c.fillStyle='#e45d9c';for(let y=0;y<H;y+=24)for(let x=0;x<W;x+=24){c.beginPath();c.arc(x,y,6,0,Math.PI*2);c.fill()}}c.restore()}mode='drawing';redraw();$('#status').textContent='Stripes and spots stay attached to the moving treats.'};
function playLabel(){$('#play').innerHTML=`<span class="button-icon" aria-hidden="true">${playing?'Ⅱ':'▶'}</span><span>${playing?'Pause':'Play'}</span>`;$('#play').setAttribute('aria-label',playing?'Pause the animation':'Play the animation');$('#play').setAttribute('aria-pressed',String(playing))}$('#play').onclick=()=>{if(!ready)return;playing=!playing;playLabel()};$('#replay').onclick=()=>{phase=0;playing=true;playLabel();renderStage()};$('#action').onchange=()=>{phase=0;renderStage()};
$('#save').onclick=()=>{if(!ready)return;let a=document.createElement('a');a.download='my-sugar-bugs-design.png';a.href=editor.toDataURL('image/png');a.click()};
const pc=$('#photoCanvas'),px=pc.getContext('2d');function prompt(){const type=$('#alignmentType')?.value;$('#cornerHelp').textContent=marks.length===4?'Ready to bring your paper designs to life.':`Select ${type==='scene'?'picture corner':type==='paper'?'paper corner':'printed mark'} ${marks.length+1}: ${['top left','top right','bottom right','bottom left'][marks.length]}.`;$('#apply').disabled=marks.length!==4}
function drawPhoto(){px.clearRect(0,0,700,550);if(!photo)return;px.drawImage(photo,fit.x,fit.y,fit.w,fit.h);marks.forEach((p,i)=>{px.beginPath();px.arc(p.x,p.y,12,0,Math.PI*2);px.fillStyle='#245e53';px.fill();px.strokeStyle='white';px.lineWidth=2;px.stroke();px.fillStyle='white';px.font='bold 15px Arial';px.textAlign='center';px.fillText(i+1,p.x,p.y+5)})}
$('#upload').onchange=async e=>{let f=e.target.files[0];if(!f)return;e.target.disabled=true;playing=false;playLabel();document.getElementById('narration')?.pause();$('#status').textContent='Recognizing your workbook, writing, and treats…';let url=URL.createObjectURL(f);try{const img=new Image();img.src=url;await img.decode();let s=Math.min(1,2400/Math.max(img.naturalWidth,img.naturalHeight));photo=document.createElement('canvas');photo.width=Math.round(img.naturalWidth*s);photo.height=Math.round(img.naturalHeight*s);photo.getContext('2d').drawImage(img,0,0,photo.width,photo.height);s=Math.min(700/photo.width,550/photo.height);fit={x:(700-photo.width*s)/2,y:(550-photo.height*s)/2,w:photo.width*s,h:photo.height*s,s};marks=[];$('#alignment').hidden=true;const found=await window.recognizeWorkbook(photo);if(found){$('#alignmentType').value='page';marks=found.map(p=>({x:fit.x+p.x*fit.s,y:fit.y+p.y*fit.s}));drawPhoto();prompt();while(!ready)await new Promise(r=>setTimeout(r,50));$('#apply').click()}else{$('#alignmentType').value='scene';$('#alignment').hidden=false;drawPhoto();prompt();$('#status').textContent='Please help line up this photo below by selecting the picture’s four corners.';$('#alignment').scrollIntoView({block:'start'})}}catch(e){$('#status').textContent='Please use a clear JPG or PNG photo of this workbook page.'}finally{e.target.disabled=false;e.target.value='';URL.revokeObjectURL(url)}};
pc.onclick=e=>{if(!photo||marks.length===4)return;const r=pc.getBoundingClientRect(),p={x:(e.clientX-r.left)*700/r.width,y:(e.clientY-r.top)*550/r.height};if(p.x<fit.x||p.x>fit.x+fit.w||p.y<fit.y||p.y>fit.y+fit.h)return;marks.push(p);drawPhoto();prompt()};$('#restart').onclick=()=>{marks=[];drawPhoto();prompt()};
$('#apply').addEventListener('click',()=>{mode='aligning'},true);
function homography(src,dst){let rows=[];for(let i=0;i<4;i++){const [x,y]=src[i],[u,v]=dst[i];rows.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v])}for(let i=0;i<8;i++){let p=i;for(let j=i+1;j<8;j++)if(Math.abs(rows[j][i])>Math.abs(rows[p][i]))p=j;[rows[i],rows[p]]=[rows[p],rows[i]];let d=rows[i][i];if(Math.abs(d)<1e-8)throw Error('Select four distinct corner marks.');for(let k=i;k<9;k++)rows[i][k]/=d;for(let j=0;j<8;j++)if(j!==i){let f=rows[j][i];for(let k=i;k<9;k++)rows[j][k]-=f*rows[i][k]}}return rows.map(r=>r[8])}
$('#apply').onclick=()=>{if(!ready)return;try{let dst=marks.map(p=>[(p.x-fit.x)/fit.s,(p.y-fit.y)/fit.s]);for(let i=0;i<4;i++){let a=dst[i],b=dst[(i+1)%4],c=dst[(i+2)%4];if((b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0])<=0)throw Error('Select top left, top right, bottom right, bottom left.')}const h=homography(window.registrationSourceCorners(),dst),source=photo.getContext('2d').getImageData(0,0,photo.width,photo.height).data,rect=document.createElement('canvas');rect.width=W;rect.height=H;let rc=rect.getContext('2d'),out=rc.createImageData(W,H);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const u=650+x/W*850,v=340+y/H*478.125,z=h[6]*u+h[7]*v+1,a=(h[0]*u+h[1]*v+h[2])/z,b=(h[3]*u+h[4]*v+h[5])/z,k=(y*W+x)*4;out.data[k+3]=255;if(a<0||b<0||a>=photo.width-1||b>=photo.height-1){out.data[k]=out.data[k+1]=out.data[k+2]=255;continue}let ax=Math.floor(a),by=Math.floor(b),fx=a-ax,fy=b-by;for(let ch=0;ch<3;ch++){const at=(xx,yy)=>source[(yy*photo.width+xx)*4+ch];out.data[k+ch]=at(ax,by)*(1-fx)*(1-fy)+at(ax+1,by)*fx*(1-fy)+at(ax,by+1)*(1-fx)*fy+at(ax+1,by+1)*fx*fy}}rc.putImageData(out,0,0);snapshot();for(const p of parts){p.ctx.clearRect(0,0,W,H);p.ctx.save();clip(p.ctx,p);p.ctx.drawImage(rect,0,0);p.ctx.restore()}mode='photo';redraw();$('#alignment').hidden=true;document.dispatchEvent(new CustomEvent('workbook-rectified',{detail:{photo,homography:h}}));document.dispatchEvent(new CustomEvent('artwork-applied'));$('#status').textContent='Only your three colored treats have been placed into the clean story scene.'}catch(e){$('#cornerHelp').textContent=e.message}};
const illustrationReady=Promise.all([imageReady(template),imageReady(background)]).then(()=>{ready=true;initialize();redraw();baselinePixels=ec.getImageData(0,0,W,H).data.slice()});illustrationReady.catch(()=>{$('#status').textContent='The illustration could not load. Refresh the sample.'});
function tick(now){if(playing)phase+=Math.min((now-previous)/1000,.05);previous=now;if(playing)renderStage();requestAnimationFrame(tick)}requestAnimationFrame(tick);
function hasArtworkChanges(){if(!ready||!baselinePixels)return false;renderEditor();const current=ec.getImageData(0,0,W,H).data;for(let i=0;i<current.length;i++)if(current[i]!==baselinePixels[i])return true;return false}
function getCompletionStatus(){const written=new Set(window.handwriting?.getResults?.().map(line=>line.id)||[]),missingLineIds=sceneWritingLines.filter(id=>!written.has(id)),hasColoring=hasArtworkChanges();return {hasColoring,requiredWritingLines:sceneWritingLines.length,completedWritingLines:sceneWritingLines.length-missingLineIds.length,missingLineIds,writingComplete:missingLineIds.length===0,canFinish:hasColoring&&missingLineIds.length===0};}
window.sampleTest={parts,homography,redraw,exportState,importState,loadScene,getMode:()=>mode,isReady:()=>ready,isPlaying:()=>playing,getPhase:()=>phase,hasArtworkChanges,getCompletionStatus,getPreviewDataURL:()=>{renderEditor();return editor.toDataURL('image/png');},pause:()=>{playing=false;playLabel()},resume:()=>{playing=true;playLabel()},start:()=>{phase=0;playing=true;playLabel();renderStage()}};
})();
