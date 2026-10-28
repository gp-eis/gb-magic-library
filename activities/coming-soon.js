(() => {
  'use strict';
  const id=new URLSearchParams(location.search).get('book'),book=GPCatalog.books.find(item=>item.id===id);
  if(!book){document.getElementById('comingTitle').textContent='Choose your next story';document.getElementById('comingCover').hidden=true;return;}
  document.title=`${book.title} · Reading activity coming soon`;
  document.getElementById('comingTitle').textContent=book.title;
  document.getElementById('comingCover').src=`../${book.cover}`;document.getElementById('comingCover').alt=`${book.title} book cover`;
  if(book.coloringHref){const link=document.getElementById('comingColoring');link.hidden=false;link.href=`../${book.coloringHref}`;}
})();
