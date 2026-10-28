/* Read-only, caller-driven effects over the child's actual composited illustration.
   time is elapsed SECONDS. There are no timers, media, editor or storage calls. */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.GPSceneMotion=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const TAU=Math.PI*2,ART_WIDTH=1672,ART_HEIGHT=941;
  function dimensions(value,fallback){
    const result=value===undefined?fallback:value;
    if(!Number.isFinite(result)||result<=0||result>8192)throw new RangeError('Scene dimensions must be finite positive pixels.');
    return result;
  }
  function sparkle(ctx,x,y,r,color,angle){
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=color;
    ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r*.28,-r*.28);ctx.lineTo(r,0);ctx.lineTo(r*.28,r*.28);
    ctx.lineTo(0,r);ctx.lineTo(-r*.28,r*.28);ctx.lineTo(-r,0);ctx.lineTo(-r*.28,-r*.28);ctx.closePath();ctx.fill();ctx.restore();
  }
  function digging(ctx,t){
    const cycle=t%7,progress=Math.min(1,cycle/4.4),fade=cycle<5.8?1:Math.max(0,(7-cycle)/1.2);
    const x=988,y=315,rx=11+progress*34,ry=8+progress*23;
    ctx.save();
    // All marks stay on the existing right-hand tooth, away from both colored bugs.
    ctx.beginPath();ctx.rect(851,169,269,299);ctx.clip();ctx.globalAlpha=fade;
    ctx.fillStyle='#9b8c7c';ctx.beginPath();ctx.ellipse(x,y,rx+5,ry+4,-.12,0,TAU);ctx.fill();
    ctx.fillStyle='#59565b';ctx.beginPath();ctx.ellipse(x,y,rx,ry,-.12,0,TAU);ctx.fill();
    ctx.strokeStyle='#b6aaa0';ctx.lineWidth=3;ctx.lineCap='round';
    ctx.beginPath();ctx.ellipse(x-1,y-1,Math.max(5,rx-5),Math.max(4,ry-5),-.12,Math.PI*.96,Math.PI*1.73);ctx.stroke();
    ctx.strokeStyle='#8d817a';ctx.lineWidth=2.5;
    const cracks=[[-1,-.55,-17,-23],[1,-.32,23,-19],[-.8,.7,-19,23],[.95,.6,22,20]];
    for(const [dx,dy,ex,ey]of cracks){
      const sx=x+dx*rx,sy=y+dy*ry;
      ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+ex*progress*.55,sy+ey*progress*.4);
      ctx.lineTo(sx+ex*progress,sy+ey*progress);ctx.stroke();
    }
    // Small puffs lift from the same hole; no copied or replacement source objects.
    for(let i=0;i<7;i++){
      const flight=(t*.7+i*.143)%1,side=i%2?-1:1;
      const px=x+side*(rx*.7+flight*(19+i*2))+Math.sin(t*4+i)*3;
      const py=y-ry*.25-flight*(30+i*3);
      ctx.globalAlpha=fade*(1-flight)*.65;ctx.fillStyle=i%2?'#b4a696':'#897b70';
      ctx.beginPath();ctx.ellipse(px,py,2.5+(i%3),2+(i%2),i*.4,0,TAU);ctx.fill();
    }
    ctx.restore();
  }
  function cheek(ctx,t){
    const pulse=(Math.sin(t*TAU*.65)+1)/2;
    ctx.save();
    ctx.globalAlpha=.1+pulse*.085;ctx.fillStyle='#ff9c4e';
    ctx.beginPath();ctx.ellipse(680,500,45+pulse*13,34+pulse*9,-.18,0,TAU);ctx.fill();
    ctx.strokeStyle='#f6a45d';ctx.lineWidth=3;ctx.globalAlpha=.28+pulse*.25;
    ctx.beginPath();ctx.ellipse(680,500,58+pulse*13,44+pulse*8,-.18,Math.PI*.96,Math.PI*1.43);ctx.stroke();
    for(let i=0;i<3;i++){
      const float=Math.sin(t*2.8+i*1.9),x=609-i*23,y=443-i*32+float*7;
      ctx.globalAlpha=.38+((float+1)/2)*.4;
      sparkle(ctx,x,y,7+((float+1)/2)*3,i%2?'#f6ac63':'#ffd773',Math.sin(t+i)*.17);
    }
    ctx.restore();
  }
  function draw(ctx,options){
    const o=options||{};
    if(!ctx||typeof ctx.drawImage!=='function'||!o.source)throw new TypeError('A drawing context and the actual colored source are required.');
    const width=dimensions(o.width,1000),height=dimensions(o.height,563);
    const t=Number.isFinite(o.time)?Math.max(0,o.time):0;
    const animated=o.reducedMotion!==true&&(o.sceneId==='sugar-bugs'||o.sceneId==='toothache');
    ctx.save();
    if(animated){
      ctx.beginPath();ctx.rect(0,0,width,height);ctx.clip();
      // A tiny pain wobble moves the complete saved illustration together, never a cutout.
      if(o.sceneId==='toothache')ctx.translate(Math.sin(t*5.1)*1.35,Math.sin(t*4.3+.7)*1.2);
    }
    ctx.drawImage(o.source,0,0,width,height);
    if(animated){
      ctx.scale(width/ART_WIDTH,height/ART_HEIGHT);
      if(o.sceneId==='sugar-bugs')digging(ctx,t);else cheek(ctx,t);
    }
    ctx.restore();
  }
  return Object.freeze({draw});
});
