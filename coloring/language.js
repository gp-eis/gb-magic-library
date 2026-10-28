(() => {
  'use strict';
  // Interface copy only. The reading, handwriting, title art and recorded voice
  // stay in English. Canonical text is retained so toggling never loses content.
  const ko = {
    'Your colors and handwriting are saved. Return Home whenever you are ready.':'색칠과 손글씨를 저장했어요. 준비되면 언제든 홈으로 돌아가요.',
    'Color Studio':'컬러 스튜디오', 'Back to story':'이야기로 돌아가기',
    'Coloring tools':'색칠 도구', 'My coloring canvas':'나의 색칠 그림',
    'Tools':'도구', 'Colors':'색상', 'Size':'굵기',
    'Brush':'붓', 'Pencil':'연필', 'Marker':'마커', 'Crayon':'크레용', 'Bucket':'채우기', 'Eraser':'지우개',
    'Soft, painterly strokes':'부드러운 붓 터치',
    'Fine lines with a paper-like grain':'종이 질감이 느껴지는 섬세한 선',
    'Smooth, translucent color':'매끄럽고 투명한 색감',
    'Rich, waxy texture':'풍부한 크레용 질감',
    'Fill one area with color':'한 영역을 색으로 채워요',
    'Gently erase your marks':'그린 자국을 부드럽게 지워요',
    'From paper to your story.':'종이 위 작품을 이야기 속으로.',
    'A LITTLE COLOR. A LOT OF YOU.':'작은 색으로 펼치는 나만의 세상.',
    '← Back to coloring':'← 색칠로 돌아가기',
    'Home':'홈', 'Back to home':'홈으로 돌아가기',
    'Save to My Library':'내 보관함에 저장', 'Saving…':'저장 중…',
    'Save now':'지금 저장', 'All changes saved':'모든 변경 사항을 저장했어요',
    'Save failed. Retry.':'저장하지 못했어요. 다시 시도해 주세요.',
    'Opening your book…':'내 책을 여는 중…', 'Opening your saved work…':'저장한 작품을 여는 중…',
    'Getting your new coloring ready…':'새 색칠 활동을 준비하는 중…',
    'Opening the next activity…':'다음 활동을 여는 중…',
    'Book activities':'책 활동', 'Previous activity':'이전 활동', 'Next activity':'다음 활동',
    'My book cover':'나의 책 표지',
    'Color the white title letters!':'제목의 하얀 글자를 색칠해요!',
    'Your cover is ready!':'표지가 완성됐어요!',
    'Color inside the white title letters, then choose Done.':'제목의 하얀 글자 안을 색칠한 뒤 완성을 눌러요.',
    'Your cover is ready. Turn to the next activity.':'표지를 완성했어요. 다음 활동으로 넘겨요.',
    'Write every line to finish this page.':'이 페이지를 완성하려면 모든 문장을 써 주세요.',
    'Watch the sugar bugs dig a hole in the tooth.':'설탕 벌레들이 이에 구멍을 내는 모습을 보세요.',
    'Ow! Watch the gentle toothache reaction.':'아야! 이가 아픈 반응을 부드러운 움직임으로 봐요.',
    'Look! This activity is yours!':'우와! 내가 만든 활동이에요!',
    'Your colors and handwriting are saved. Turn to the next activity when you are ready.':'색칠과 손글씨를 저장했어요. 준비되면 다음 활동으로 넘겨 보세요.',
    'Make this picture your own!':'나만의 그림으로 꾸며 보세요!',
    'Tap a story line to trace it. Listen or color your picture.':'이야기 문장을 눌러 글씨를 따라 쓰거나, 이야기를 듣고 그림을 색칠해 보세요.',
    'Pick a color. Draw inside an outlined object. Tap Done!':'색을 골라 테두리 안에 그려 보세요. 다 그렸으면 완성을 눌러요!',
    'Practice design · not saved':'체험용 무늬 · 저장되지 않아요', 'Waiting to save…':'저장을 기다리는 중…',
    'Your changes save automatically':'변경 사항은 자동으로 저장돼요',
    'Try saving again. You can also export your picture.':'다시 저장해 보세요. 그림 파일을 따로 저장할 수도 있어요.',
    'Save your latest changes in this browser':'최신 작품을 이 브라우저에 저장해요',
    'Saved! Your latest changes are safe in this browser.':'저장했어요! 최신 작품을 이 브라우저에 보관했어요.',
    'Saved to My Library. Use Continue there to reopen this attempt; this browser could not update the address.':'내 보관함에 저장했어요. 브라우저 주소를 바꾸지 못했으니 보관함에서 이어하기를 눌러 이 작품을 다시 열어 주세요.',
    'Your edits save automatically in this browser. Use Home or Back to story to finish saving before leaving. Clearing site data removes saved work.':'작업은 이 브라우저에 자동으로 저장돼요. 홈이나 이야기로 돌아가기를 누르면 저장을 마친 후 이동해요. 사이트 데이터를 지우면 저장된 작품도 삭제돼요.',
    'Saved to My Library':'내 보관함에 저장했어요', 'Try saving again':'다시 저장하기',
    'View My Library':'내 보관함 보기', 'Dismiss library message':'저장 알림 닫기',
    'Keep your creation in My Library':'내 작품을 보관함에 저장해요',
    'Add coloring or handwriting to save your creation':'색칠하거나 글씨를 쓴 후 작품을 저장해요',
    'Color or trace something first, then save your creation.':'먼저 색칠하거나 글씨를 따라 쓴 후 작품을 저장해요.',
    'Putting your creation in My Library…':'내 보관함에 작품을 넣고 있어요…',
    'Saved! Your creation is waiting in My Library.':'저장했어요! 내 보관함에서 작품을 만나 보세요.',
    'Saved. Save again to keep your latest changes.':'저장했어요. 새로 꾸민 내용도 다시 저장해 주세요.',
    'Unfinished editor work resets on refresh. Finished work saved to My Library stays in this browser until its site data is cleared.':'새로고침하면 저장하지 않은 작업은 초기화돼요. 내 보관함에 저장한 작품은 이 브라우저의 사이트 데이터를 지우기 전까지 보관돼요.',
    'Go to my book':'책으로 이동', 'My little storybook':'나의 작은 이야기책',
    'For grown-ups':'보호자·선생님', 'Level B · Month 8 · Week 4':'레벨 B · 8월 · 4주',
    'Print the tracing workbook ↗':'따라 쓰기 활동지 인쇄 ↗',
    'Pictures and drawings stay in this browser session. Refreshing resets the work.':'사진과 그림은 현재 브라우저에서만 사용돼요. 새로고침하면 작품이 초기화돼요.',
    'This sample brings the illustration to life; it does not change the original reading video.':'이 체험은 그림 속 사물을 움직여요. 원본 읽기 영상 자체를 바꾸지는 않아요.',
    'Use the new tracing workbook. Take one clear, full-page photo of the writing and picture together. Dark pencil or pen works best. No student name is needed.':'새 따라 쓰기 활동지를 사용하세요. 글씨와 그림이 모두 보이게 한 장으로 촬영해 주세요. 진한 연필이나 펜이 잘 보여요. 이름은 쓰지 않아도 돼요.',
    'LET’S MAKE A STORY!':'나만의 이야기를 만들어요!', 'Your story adventure':'나의 이야기 모험',
    'Listen':'듣기', 'Make':'꾸미기', 'Watch':'감상하기', 'Read with me':'함께 읽어요',
    'Let’s open our book!':'책을 펼쳐 볼까요?', 'Let’s read together!':'함께 읽어 봐요!',
    'Make the treats your own!':'간식에 나만의 무늬를 그려요!', 'Look! You made it come alive!':'우와! 내 작품이 움직여요!',
    'Front cover':'앞표지', 'Story pages 1–2':'이야기 1–2쪽', '1 of 2':'1 / 2', '2 of 2':'2 / 2',
    'Back':'이전', 'Next':'다음', 'Open book':'책 펼치기', 'Turn the book page':'책장 넘기기',
    'Previous page: front cover':'이전 쪽: 앞표지', 'Next page: open the story':'다음 쪽: 이야기 펼치기',
    'Storybook. Use the left and right arrow keys to turn the page.':'이야기책. 왼쪽·오른쪽 방향키로 책장을 넘길 수 있어요.',
    'Story pages 1 and 2':'이야기 1쪽과 2쪽', 'Our story picture':'이야기 그림',
    'Story activities':'이야기 활동', 'Read aloud':'읽어 주기', 'Pause reading':'읽기 멈추기',
    'Story playback':'이야기 재생', 'Read':'읽기',
    'Read the book title aloud':'책 제목 읽어 주기', 'Read the story aloud':'이야기 읽어 주기',
    'Color':'색칠하기', 'Color again':'다시 색칠하기', 'Done!':'완성!', 'Again!':'다시 보기!',
    'Use my workbook photo':'활동지 사진 올리기', 'Back to my book':'책으로 돌아가기',
    'Choose a photo of your traced and colored workbook':'따라 쓰고 색칠한 활동지 사진 선택',
    'Pause':'멈추기', 'Play':'재생', 'Pause the animation':'움직임 멈추기', 'Play the animation':'움직임 재생',
    'Finding your writing and treats…':'글씨와 간식을 찾고 있어요…',
    'Tap Listen to hear the title. Tap the right arrow to open your book.':'듣기를 누르면 제목을 들을 수 있어요. 오른쪽 화살표로 책을 펼쳐요.',
    'Listen to the title, then open your book.':'제목을 듣고 책을 펼쳐 보세요.',
    'Listen to the story, trace a line, or choose Color.':'이야기를 듣고, 글씨를 따라 쓰거나 색칠하기를 눌러 보세요.',
    'Tap a story line to trace it. Listen, color, or upload one photo of your workbook.':'이야기 문장을 누르면 따라 쓸 수 있어요. 듣고, 색칠하거나 활동지 사진 한 장을 올려 보세요.',
    'Pick a color. Draw on a treat. Tap Done!':'색을 골라 간식에 그려요. 다 그렸으면 완성을 눌러요!',
    'Your treats are dancing! Tap Again to watch once more.':'간식이 춤을 춰요! 다시 보기를 눌러 한 번 더 봐요.',
    'Tap a line to trace the letters.':'문장을 눌러 글자를 따라 써요.',
    'My art tools':'나의 미술 도구', 'Pick a color':'색을 골라요', 'Paint colors':'색칠 색상',
    'More colors':'다른 색', 'My color':'나의 색', 'Draw':'그리기', 'Fill':'채우기', 'Erase':'지우기',
    'Drawing tool':'그리기 도구', 'Crayon size':'크레용 굵기', 'Small crayon':'가는 크레용',
    'Medium crayon':'보통 크레용', 'Big crayon':'굵은 크레용', 'Undo':'되돌리기',
    'More choices':'다른 도구', 'Start again':'처음부터', 'Try a design':'무늬 체험하기', 'Save my picture':'내 그림 저장',
    'Purple':'보라', 'Pink':'분홍', 'Green':'초록', 'Yellow':'노랑', 'Blue':'파랑', 'Red':'빨강', 'Brown':'갈색', 'White':'흰색',
    'Draw inside the donut, candy, or soda.':'도넛, 사탕, 탄산음료 안에 그려 주세요.',
    'Looking good! Tap Done to make it move.':'멋져요! 완성을 누르면 움직여요.',
    'Stripes and spots stay attached to the moving treats.':'내가 그린 줄무늬와 점도 간식과 함께 움직여요.',
    'Recognizing your workbook, writing, and treats…':'활동지와 글씨, 간식을 찾고 있어요…',
    'Please help line up this photo below by selecting the picture’s four corners.':'아래에서 그림의 네 모서리를 눌러 사진을 맞춰 주세요.',
    'Please use a clear JPG or PNG photo of this workbook page.':'이 활동지를 선명하게 찍은 JPG 또는 PNG 사진을 사용해 주세요.',
    'The illustration could not load. Refresh the sample.':'그림을 불러오지 못했어요. 페이지를 새로고침해 주세요.',
    'A little grown-up help':'보호자·선생님의 도움이 필요해요', 'Let’s line up your picture':'사진 위치를 맞춰요',
    'Line up using':'맞추는 기준', 'The picture’s four corners':'그림의 네 모서리', 'The whole paper’s four corners':'종이 전체의 네 모서리',
    'Printed workbook corner marks':'이전 활동지의 모서리 표시', 'Select the four corners of the picture':'그림의 네 모서리 선택',
    'Try the corners again':'모서리 다시 선택', 'Done! Make it move':'완성! 움직여 봐요',
    'Ready to bring your paper designs to life.':'준비됐어요! 종이 위 작품을 움직여 봐요.',
    'Select four distinct corner marks.':'서로 다른 네 모서리를 선택해 주세요.',
    'Select top left, top right, bottom right, bottom left.':'왼쪽 위, 오른쪽 위, 오른쪽 아래, 왼쪽 아래 순서로 눌러 주세요.',
    'See my paper designs':'종이 위 작품 보기', 'Made by you!':'내가 만든 작품!',
    'Your donut, candy, and soda are in the story.':'내 도넛, 사탕, 탄산음료가 이야기 속에 들어갔어요.',
    'Your donut':'나의 도넛', 'Your candy':'나의 사탕', 'Your soda':'나의 탄산음료',
    'Only your three colored treats have been placed into the clean story scene.':'색칠한 간식 세 개만 이야기 그림에 넣었어요.',
    'Made by you. Brought to life by your imagination.':'내가 꾸미고, 나의 상상으로 살아나는 이야기.',
    'Trace this line':'이 문장을 따라 써요', 'Trace over the pale letters. Tap Done writing to put your own marks in the book.':'연한 글자를 따라 써요. 다 썼으면 글씨 완성을 눌러 내 글씨를 책에 넣어요.',
    'Close writing':'따라 쓰기 닫기', 'My handwriting':'나의 손글씨', 'Done writing':'글씨 완성',
    'Clear writing':'글씨 지우기', 'Undo stroke':'마지막 획 되돌리기', 'Pen color':'펜 색상',
    'Black pen':'검정 펜', 'Blue pen':'파랑 펜', 'Purple pen':'보라 펜',
    'Your own handwriting is in the story! Tap another line to write more.':'내 손글씨가 이야기 속에 들어갔어요! 다른 문장도 눌러서 써 보세요.',
    'Write on the letters first. You decide when your writing is finished.':'먼저 글자를 따라 써 보세요. 다 썼는지는 내가 정해요.',
    'Paper handwriting could not be extracted. Your screen writing is unchanged. Try a clearer full-page photo with dark writing.':'사진에서 글씨를 찾지 못했어요. 화면에서 쓴 글씨는 그대로예요. 진하게 쓴 활동지 전체를 선명하게 찍어 다시 올려 주세요.',
    'The photo shows only the picture. Your writing is unchanged. Upload the whole tracing workbook to include writing.':'사진에 그림만 보여요. 기존 글씨는 그대로예요. 글씨도 넣으려면 따라 쓰기 활동지 전체를 찍어 올려 주세요.',
    'No handwriting found in this photo. Screen writing is kept. Try a clearer photo of the whole workbook.':'사진에서 쓴 글씨를 찾지 못했어요. 화면에서 쓴 글씨는 그대로예요. 활동지 전체를 선명하게 찍어 다시 올려 주세요.',
    'The photo shows only the picture. Screen writing is kept. Upload the whole workbook to include writing.':'사진에 그림만 보여요. 화면에서 쓴 글씨는 그대로예요. 글씨도 넣으려면 활동지 전체를 찍어 올려 주세요.',
    'Replace writing from photo':'사진 속 글씨 적용', 'Paper writing preview':'사진 속 글씨 미리 보기',
    'Tap Listen to hear the story.':'듣기를 눌러 이야기를 들어 보세요.',
    'The story sound could not load. Please try Listen again.':'소리를 불러오지 못했어요. 듣기를 다시 눌러 주세요.',
    'Check writing from my photo':'사진 속 글씨 확인',
    'Original photo line':'사진 속 원래 문장',
    'Use full photo line':'사진 속 문장 전체 사용',
    'Full photo line applied. Paper and tracing dots are kept so no writing is filtered out.':'문장 전체를 사진 그대로 넣었어요. 글씨가 빠지지 않도록 종이 배경과 따라 쓰기 점도 함께 보여요.',
    'If any marks are missing, use the full photo line. This keeps its paper and tracing dots too.':'빠진 글씨가 있으면 문장 전체 사용을 눌러 주세요. 종이 배경과 따라 쓰기 점도 함께 보여요.'
  };
  const sources = new WeakMap(), attributes = new WeakMap();
  const reverse = Object.fromEntries(Object.entries(ko).map(([a,b]) => [b,a]));
  let language = 'en', queued = false;
  try { language = localStorage.getItem('storybook-ui-language') === 'ko' ? 'ko' : 'en'; } catch (_) {}
  function translate(source) {
    if (language !== 'ko') return source;
    const plain = source.trim();
    let result = ko[plain];
    if (!result) {
      let activityMatch = plain.match(/^Activity (\d+) of (\d+)$/);
      if (activityMatch) result = `활동 ${activityMatch[1]} / ${activityMatch[2]}`;
      activityMatch = plain.match(/^(\d+) of (\d+) finished$/);
      if (activityMatch) result = `${activityMatch[2]}개 중 ${activityMatch[1]}개 완료`;
      activityMatch = plain.match(/^(\d+) activities inside$/);
      if (activityMatch) result = `활동 ${activityMatch[1]}개`;
      activityMatch = plain.match(/^Write every line: (\d+) of (\d+) finished\.$/);
      if (activityMatch) result = `모든 문장을 써요: ${activityMatch[2]}문장 중 ${activityMatch[1]}문장 완료.`;
      activityMatch = plain.match(/^Color the picture and write every line\. Writing: (\d+) of (\d+)\.$/);
      if (activityMatch) result = `그림을 색칠하고 모든 문장을 써요. 글씨: ${activityMatch[2]}문장 중 ${activityMatch[1]}문장 완료.`;
      activityMatch = plain.match(/^Activity (\d+): (.+)$/);
      if (activityMatch) result = `활동 ${activityMatch[1]}: ${activityMatch[2] === 'My book cover' ? ko['My book cover'] : activityMatch[2]}`;
      activityMatch = plain.match(/^Coloring picture: (.+)$/);
      if (activityMatch) result = `색칠 그림: ${activityMatch[1] === 'My book cover' ? ko['My book cover'] : activityMatch[1]}`;
      activityMatch = plain.match(/^Story pages (\d+) and (\d+)$/);
      if (activityMatch) result = `이야기 ${activityMatch[1]}쪽과 ${activityMatch[2]}쪽`;
      let match = plain.match(/^Select (picture corner|printed mark|paper corner) (\d): (top left|top right|bottom right|bottom left)\.$/);
      if (match) result = `${{ 'picture corner':'그림 모서리', 'printed mark':'모서리 표시', 'paper corner':'종이 모서리' }[match[1]]} ${match[2]}: ${{'top left':'왼쪽 위','top right':'오른쪽 위','bottom right':'오른쪽 아래','bottom left':'왼쪽 아래'}[match[3]]}를 눌러 주세요.`;
      match = plain.match(/^Trace: (.+)$/);
      if (match) result = `따라 쓰기: ${match[1]}`;
      match = plain.match(/^Your paper writing is in the story! (\d) of 4 lines found\.$/);
      if (match) result = `사진 속 손글씨가 이야기 속에 들어갔어요! 4문장 중 ${match[1]}문장을 찾았어요.`;
      match = plain.match(/^Photo writing applied to (\d) of 4 lines\. Please check every line\.$/);
      if (match) result = `4문장 중 ${match[1]}문장에 사진 속 글씨를 넣었어요. 빠진 글씨가 없는지 문장마다 확인해 주세요.`;
    }
    return result ? source.replace(plain, result) : source;
  }
  function convert(value, cache) {
    if (!cache || value !== cache.rendered) cache = { source: reverse[value.trim()] ? value.replace(value.trim(), reverse[value.trim()]) : value };
    cache.rendered = translate(cache.source);
    return cache;
  }
  function render() {
    queued = false;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement.closest('script,style,[data-keep-english],.story-line,#caption')) continue;
      const cache = convert(node.data, sources.get(node)); sources.set(node, cache);
      if (node.data !== cache.rendered) node.data = cache.rendered;
    }
    document.querySelectorAll('[aria-label],[title]').forEach(el => {
      if (el.closest('[data-keep-english]')) return;
      const cache = attributes.get(el) || {};
      for (const attr of ['aria-label','title']) if (el.hasAttribute(attr)) {
        cache[attr] = convert(el.getAttribute(attr), cache[attr]);
        if (el.getAttribute(attr) !== cache[attr].rendered) el.setAttribute(attr, cache[attr].rendered);
      }
      attributes.set(el, cache);
    });
  }
  function setLanguage(next) {
    language = next === 'ko' ? 'ko' : 'en';
    document.documentElement.lang = language;
    document.querySelectorAll('[data-language]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.language === language)));
    try { localStorage.setItem('storybook-ui-language', language); } catch (_) {}
    render();
  }
  window.ui = { getLanguage: () => language, setLanguage, translate, refresh: render };
  document.querySelectorAll('[data-language]').forEach(b => b.onclick = () => setLanguage(b.dataset.language));
  new MutationObserver(() => { if (!queued) { queued = true; queueMicrotask(render); } }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['aria-label', 'title'] });
  setLanguage(language);
})();
