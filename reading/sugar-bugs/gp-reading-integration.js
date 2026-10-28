/* Navigation only: packet drawings stay in its own local mini-library, not the home library. */
(function(){
  'use strict';
  const home=document.getElementById('readingHomeLabel');
  const activity=document.getElementById('readingActivityLabel');
  const coloring=document.getElementById('readingColoringLabel');
  const navigation=document.getElementById('readingSiteNav');
  const homeLink=document.getElementById('readingHomeLink');
  const coloringLink=document.getElementById('readingColoringLink');
  function updateLabels(){
    const korean=document.documentElement.lang==='ko';
    if(home)home.textContent=korean?'홈':'Home';
    if(activity)activity.textContent=korean?'읽고 놀아요':'READ & PLAY';
    if(coloring)coloring.textContent=korean?'색칠하기':'Coloring';
    if(navigation)navigation.setAttribute('aria-label',korean?'리딩 활동 메뉴':'Reading activity navigation');
    if(homeLink)homeLink.setAttribute('aria-label',korean?'홈으로 돌아가기':'Back to home');
    if(coloringLink)coloringLink.setAttribute('aria-label',korean?'색칠하기 책 열기':'Open the coloring book');
  }
  updateLabels();
  if(typeof MutationObserver==='function'){
    new MutationObserver(updateLabels).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  }
})();
