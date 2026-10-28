/* Read-only view model for completed activity snapshots, including older saves. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GPStoryLibraryModel=api;})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const IMAGE_TYPES=new Set(['image/png','image/jpeg','image/webp','image/gif']);
  const isImage=value=>value instanceof Blob&&value.size>0&&IMAGE_TYPES.has(value.type.toLowerCase().split(';')[0].trim());
  const title=(value,fallback)=>typeof value==='string'&&value.trim()?value.trim().slice(0,240):fallback;
  function localCover(value){
    return typeof value==='string'&&/^assets\/covers\/[a-zA-Z0-9_/-]+\.(?:webp|png|jpe?g|gif)$/i.test(value)&&!value.split('/').includes('..')?value:null;
  }
  function createBook(record,catalogBook){
    if(!record||typeof record!=='object')throw new Error('This saved book is not available.');
    const creative=record.editableState?.kind==='sugar-bugs-v3'&&record.editableState.version===3;
    const coverOnly=creative&&Array.isArray(record.pages)&&record.pages.length===0&&record.editableState.cover?.id==='cover-title'&&isImage(record.coverBlob);
    if(creative&&(!Array.isArray(record.pages)||(!record.pages.length&&!coverOnly)||record.pages.some(page=>!['treats','sugar-bugs','toothache'].includes(page?.id)||page.layout!=='spread')))throw new Error('This creative book needs its actual saved interior spreads or its painted cover. Your work has not been changed.');
    const supplied=Array.isArray(record.pages)&&(record.pages.length>0||coverOnly);
    if(supplied&&record.pages.length>100)throw new Error('This saved book has too many pages to open safely. Your original work has not been changed.');
    const pages=supplied?record.pages.map((page,index)=>{
      if(!page||!isImage(page.imageBlob)||!['page','spread'].includes(page.layout||'page'))throw new Error('A saved page could not be opened. Your original work has not been changed.');
      return {id:title(page.id,`page-${index+1}`),title:title(page.title,`Page ${index+1}`),imageBlob:page.imageBlob,layout:page.layout||'page'};
    }):isImage(record.imageBlob)?[{id:'saved-spread',title:'My completed activity',imageBlob:record.imageBlob,layout:'spread'}]:[];
    if(!pages.length&&!coverOnly)throw new Error('This creation does not have any saved pages yet.');
    const spreads=[];
    let pageNumber=1,pending=[];
    function flush(){
      if(!pending.length)return;
      spreads.push({kind:'pages',pages:pending,startPage:pageNumber,endPage:pageNumber+pending.length-1});
      pageNumber+=pending.length;pending=[];
    }
    for(const page of pages){
      if(page.layout==='spread'){
        flush();spreads.push({kind:'spread',pages:[page],startPage:pageNumber,endPage:pageNumber+1});pageNumber+=2;
      }else{pending.push(page);if(pending.length===2)flush();}
    }
    flush();
    const source=localCover(catalogBook?.cover);
    const cover=isImage(record.coverBlob)?{blob:record.coverBlob,src:null}:source?{blob:null,src:source}:{blob:isImage(record.thumbnailBlob)?record.thumbnailBlob:isImage(record.imageBlob)?record.imageBlob:pages[0].imageBlob,src:null};
    return {title:title(record.title,'My storybook'),bookId:String(record.bookId||''),cover,spreads,totalPages:pageNumber-1,legacy:!supplied};
  }
  function clampIndex(index,spreadCount){
    const count=Number.isFinite(spreadCount)?Math.max(0,Math.trunc(spreadCount)):0;
    return Math.min(count,Math.max(0,Number.isFinite(index)?Math.trunc(index):0));
  }
  function pageLabel(book,index){
    const position=clampIndex(index,book.spreads.length);
    if(!position)return 'Front cover';
    const spread=book.spreads[position-1];
    return spread.startPage===spread.endPage?`Page ${spread.startPage} of ${book.totalPages}`:`Pages ${spread.startPage}–${spread.endPage} of ${book.totalPages}`;
  }
  return Object.freeze({createBook,clampIndex,pageLabel});
});
