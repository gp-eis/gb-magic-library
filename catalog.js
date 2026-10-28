/* Supplied reading activities stay local; unprovided books keep their coming-soon pages. */
(function (root, factory) {
  const catalog=factory();
  if(typeof module==='object'&&module.exports)module.exports=catalog;
  else root.GPCatalog=catalog;
})(typeof window!=='undefined'?window:globalThis,function(){
  return {
    label:'Level B · Month 8',
    note:'Local preview uses the available Level B, Month 8 books—not a confirmed class assignment.',
    avatars:[
      {id:'penny',name:'Penny'},{id:'gerry',name:'Gerry'},{id:'ria',name:'Ria'},{id:'syd',name:'Syd'},
      {id:'wanda',name:'Wanda'},{id:'don',name:'Don'},{id:'coover',name:'Coover'}
    ],
    books:[
      {id:'hello-hello',week:1,title:'Hello! Hello!',category:'Culture',cover:'assets/covers/month8-week1.webp',tone:'yellow',readingReady:false,readingHref:'activities/coming-soon.html?book=hello-hello',coloringHref:null},
      {id:'where-is-your-home',week:2,title:'Where Is Your Home?',category:'Animal World',cover:'assets/covers/month8-week2.webp',tone:'mint',readingReady:false,readingHref:'activities/coming-soon.html?book=where-is-your-home',coloringHref:null},
      {id:'why-do-we-wait',week:3,title:'Why Do We Wait?',category:'Philosophy',cover:'assets/covers/month8-week3.webp',tone:'lavender',readingReady:false,readingHref:'activities/coming-soon.html?book=why-do-we-wait',coloringHref:null},
      {id:'bye-bye-sugar-bugs',week:4,title:'Bye-Bye Sugar Bugs!',category:'Life',cover:'assets/covers/month8-week4.webp',tone:'peach',readingReady:true,readingHref:'reading/sugar-bugs/index.html',coloringHref:'coloring/index.html?mode=color&edition=creative&book=bye-bye-sugar-bugs'}
    ]
  };
});
