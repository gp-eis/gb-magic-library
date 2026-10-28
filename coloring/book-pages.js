/* Three real activity scenes from the existing reading video, in story order.
   Edition-less links deliberately keep older one-page projects unchanged. */
(function(root,factory){
  const book=factory();
  if(typeof module==='object'&&module.exports)module.exports=book;else root.GPBookPages=book;
})(typeof window!=='undefined'?window:globalThis,function(){
  const lineIds=['line-yum','line-donut','line-candy','line-yum-again'];
  const pages=[
    {id:'treats',title:'Yum! A donut!',original:'table-scene.png',template:'blank-treats-scene.png',background:'clean-kitchen.png',workbook:true,
      lines:['Yum!','A donut!','Candy and soda!','Yum!'],audio:'story-narration.m4a',
      cues:[{id:lineIds[0],start:.48,end:1.18},{id:lineIds[1],start:1.45,end:2.62},{id:lineIds[2],start:5.96,end:7.9},{id:lineIds[3],start:7.9,end:8.78}],
      parts:[
        {id:'donut',path:'M402 733 A118 102 0 1 0 166 733 A118 102 0 1 0 402 733 M319 715 A34 26 0 1 1 251 715 A34 26 0 1 1 319 715',x:284,y:733},
        {id:'candy',path:'M658 696 A76 77 0 1 0 506 696 A76 77 0 1 0 658 696 M420 682 H504 Q514 682 514 691 V692 Q514 701 504 701 H420 Q410 701 410 692 V691 Q410 682 420 682 Z',x:582,y:696},
        {id:'soda',path:'M1394 642 Q1448 629 1500 676 L1440 826 Q1426 860 1370 844 Q1308 830 1318 781 Z',x:1410,y:745}
      ]},
    {id:'sugar-bugs',title:'This tooth is sweet!',original:'pages/source-02-sugar-bugs-050500.png',template:'pages/source-02-sugar-bugs-050500.png',background:'pages/source-02-sugar-bugs-050500.png',staticPreview:true,
      lines:['Sugar!','Yum, yum!','This tooth is sweet!',"Let’s dig a hole!"],audio:'pages/sugar-bugs-narration.m4a',cues:[],
      parts:[
        {id:'bug-round',path:'M276 361 C276 405 236 448 167 448 C94 448 53 418 53 368 C53 330 88 303 117 287 C143 271 181 273 207 286 C246 304 276 325 276 361 Z',x:165,y:360,outline:false},
        {id:'bug-long',path:'M617 357 C617 293 640 254 686 254 C736 252 772 305 774 363 C780 406 746 447 696 446 C644 446 612 420 617 357 Z',x:697,y:352,outline:false},
        {id:'tooth',path:'M846 157 C864 150 888 153 913 153 H1073 Q1118 154 1130 191 V478 H846 Z',x:988,y:315,outline:false}
      ]},
    {id:'toothache',title:'Ow! My tooth hurts!',original:'pages/source-03-toothache-065500.png',template:'pages/toothache-coloring.png',background:'pages/toothache-coloring.png',staticPreview:true,
      lines:['Ow!', 'My tooth hurts!', 'Why does it hurt?', ''],audio:'pages/toothache-narration.m4a',cues:[],
      parts:[
        {id:'donut',path:'M1040 485 Q1044 501 1057 494 Q1057 513 1071 508 Q1077 531 1100 518 Q1124 531 1135 514 Q1156 511 1155 478 L1176 483 Q1167 504 1194 525 L1219 525 Q1235 564 1211 602 L1193 622 L1180 590 Q1165 580 1150 600 L1131 594 Q1119 593 1113 617 Q1097 609 1085 628 L1092 657 Q1060 649 1035 621 Q987 575 999 535 L1016 530 Q1040 520 1040 485 Z M1132 547 C1127 530 1085 538 1084 557 C1081 582 1123 578 1132 547 Z',x:1110,y:563,outline:false},
        {id:'candy',path:'M660 694 A80 77 0 1 0 500 694 A80 77 0 1 0 660 694 M414 702 L504 692 V713 L415 723 Q404 723 405 711 Q404 703 414 702 Z',x:580,y:694,outline:false},
        {id:'soda',path:'M1396 640 Q1444 623 1495 675 L1446 803 Q1428 855 1375 842 Q1315 829 1315 777 Z',x:1409,y:745,outline:false}
      ]}
  ];
  const cover={id:'cover-title',title:'My book cover',original:'book-cover.webp',template:'book-cover.webp',background:'book-cover.webp',workbook:false,cover:true,requiredWriting:false,
    lines:['','','',''],audio:'cover-narration.m4a',cues:[],parts:[
      {id:'title-top',path:'M260 20 H690 V465 H260 Z',x:475,y:230,whiteOnly:true,outline:false},
      {id:'title-middle',path:'M690 20 H1100 V465 H690 Z',x:895,y:230,whiteOnly:true,outline:false},
      {id:'title-bottom',path:'M1100 20 H1240 V225 H1550 V435 H1100 Z',x:1320,y:230,whiteOnly:true,outline:false}
    ]};
  const creativePages=[cover,...pages.map(page=>({...page,requiredWriting:true,staticPreview:false,blankObjects:page.id==='sugar-bugs'}))];
  return Object.freeze({lineIds:Object.freeze(lineIds),pages:Object.freeze(pages.map(page=>Object.freeze(page))),creativePages:Object.freeze(creativePages.map(page=>Object.freeze(page)))});
});
