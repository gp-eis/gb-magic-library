(() => {
  'use strict';
  let alphabet;
  const ready = fetch('tracing-strokes.json').then(r => { if(!r.ok)throw Error('Tracing strokes unavailable'); return r.json(); }).then(data => { alphabet=data; return data; });
  function measure(text,size) { return [...text].reduce((sum,char)=>sum+alphabet.glyphs[char].advance+alphabet.spacing,0)*size/alphabet.nominalSize; }
  function draw(ctx,text,size,x,baseline) {
    const scale=size/alphabet.nominalSize;
    ctx.save();ctx.translate(x,baseline);ctx.scale(scale,scale);ctx.translate(0,-alphabet.baseline);
    ctx.strokeStyle='#999999';ctx.lineWidth=5.5;ctx.lineCap='round';ctx.lineJoin='round';ctx.setLineDash([.1,10]);
    let offset=0;
    for(const char of text){
      const glyph=alphabet.glyphs[char];
      if(!glyph)throw Error('Unsupported tracing letter');
      ctx.beginPath();
      for(const path of glyph.paths)for(const command of path){
        const [kind,...p]=command;
        if(kind==='M')ctx.moveTo(offset+p[0],p[1]);
        else if(kind==='L')ctx.lineTo(offset+p[0],p[1]);
        else if(kind==='C')ctx.bezierCurveTo(offset+p[0],p[1],offset+p[2],p[3],offset+p[4],p[5]);
      }
      ctx.stroke();offset+=glyph.advance+alphabet.spacing;
    }
    ctx.restore();
  }
  window.traceGuides={ready,measure,draw};
})();
