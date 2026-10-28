(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GPHomeModel=api;})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const PROFILE_KEY='gp.reading.profile.v1';
  function normalizeProfile(input,avatars){
    let value=input;
    if(typeof value==='string'){try{value=JSON.parse(value);}catch(_){value=null;}}
    if(!value||typeof value!=='object')value={};
    const name=typeof value.name==='string'?value.name.replace(/[\u0000-\u001f\u007f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,24):'';
    const requestedAvatar=value.avatarId==='coover-beekeeper'?'coover':value.avatarId;
    const avatarId=avatars.some(item=>item.id===requestedAvatar)?requestedAvatar:null;
    return {id:'local-reader',name,avatarId};
  }
  function safeLocalHref(value,fallback='./index.html'){
    if(typeof value!=='string'||!value.trim()||/[\u0000-\u0020\\]/.test(value)||/^(?:[a-z][a-z0-9+.-]*:|\/\/|\/)/i.test(value))return fallback;
    try{const parsed=new URL(value,'http://local-preview.invalid/');return parsed.origin==='http://local-preview.invalid'?value:fallback;}catch(_){return fallback;}
  }
  function finishedBookIds(records){return [...new Set(records.filter(item=>item.type==='reading'&&item.metadata?.bookCompleted!==false&&typeof item.bookId==='string').map(item=>item.bookId))];}
  return {PROFILE_KEY,normalizeProfile,safeLocalHref,finishedBookIds};
});
