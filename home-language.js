/* Home interface language only. Books, nicknames, character names and saved art
   retain their original content. No user work or profile is written here. */
(() => {
  'use strict';
  const STORAGE_KEY = 'storybook-ui-language';
  const ko = {
    'In progress':'진행 중', 'Completed':'완료', 'Work in progress':'진행 중인 작품',
    'Coloring in progress':'색칠 진행 중', 'Continue coloring':'이어서 색칠하기',
    'Color again':'새로 색칠하기',
    'Start a new coloring. Your saved work stays in My Library.':'새 색칠 활동을 시작해요. 기존 작품은 내 보관함에 그대로 남아요.',
    'View my progress':'진행 상황 보기', 'Continue my book':'이어서 하기', 'Saved pages':'저장한 쪽',
    'Your work is saved. Continue your book whenever you are ready.':'작품을 저장했어요. 준비되면 언제든 이어서 해요.',
    'Go to My Library':'내 보관함으로 이동', 'GP Reading home':'GP Reading 홈',
    'MY LITTLE READING WORLD':'나의 작은 리딩 세상', 'Main navigation':'주요 메뉴',
    'My Library':'내 보관함', 'Monthly Goals':'이번 달 목표', 'Local preview':'로컬 미리보기',
    'For grown-ups':'보호자·선생님', 'A LITTLE READING. A LOT OF WONDER.':'작은 읽기에서 시작되는 커다란 호기심.',
    'Hello,':'안녕,', 'artist!':'아티스트!', 'Hello, artist!':'안녕, 아티스트!',
    'A new story. A new adventure. Something made by you.':'새로운 이야기와 모험, 그리고 내가 만든 작품.',
    'Your stories. Your creations. Your little collection.':'나의 이야기와 작품이 모이는 작은 보관함.',
    'See all':'모두 보기', 'Made by you, kept with care':'소중하게 보관하는 나의 작품',
    'Your reader profile':'나의 독서 프로필', 'Choose your GP character and change your name':'GP 캐릭터와 이름 설정하기',
    'Choose your GP character':'GP 캐릭터 선택하기', 'Enter your name':'이름을 입력해 주세요',
    'Every great story starts with you.':'멋진 이야기는 나에게서 시작돼요.',
    'Set up my profile':'내 프로필 만들기', 'Change my character':'내 캐릭터 바꾸기',
    'Pick a story and let your next adventure begin.':'책을 골라 새로운 모험을 시작해요.',
    'See more':'더 보기', 'Coming Soon':'준비 중',
    'Culture':'문화', 'Animal World':'동물 세계', 'Philosophy':'철학', 'Life':'삶과 경험',
    '✓ Reading completed':'✓ 읽기 완료', '✓ Activities saved in My Library':'✓ 내 보관함에 활동 저장 완료',
    '✓ Coloring saved in My Library':'✓ 내 보관함에 색칠 저장 완료', 'Coloring is ready!':'색칠할 수 있어요!',
    'Ready to read':'읽을 준비 완료', 'Reading activity coming soon':'읽기 활동 준비 중',
    'Coloring':'색칠하기', 'A little color. A whole lot of imagination.':'색으로 펼치는 무한한 상상.',
    'Bring':'이야기를 꾸며요:', 'to life. Your colors save as you go.':'색칠한 내용은 자동으로 저장돼요.',
    'Let’s color':'색칠하러 가기', 'Read more. Make more. Grow brighter.':'더 읽고, 더 만들고, 더 밝게 자라요.',
    'Your profile and creations stay in this browser.':'프로필과 작품은 이 브라우저에 보관돼요.',
    'MAKE THIS SPACE YOURS':'나만의 공간을 만들어요', 'Close profile editor':'프로필 설정 닫기',
    'My name':'나의 이름', 'Choose your GP friend':'나의 GP 친구를 골라요',
    'Please choose a GP character.':'GP 캐릭터를 선택해 주세요.', 'Please enter a nickname.':'이름을 입력해 주세요.',
    'Just a nickname and a GP character. No photo upload or sign-in needed.':'이름과 GP 캐릭터만 골라 주세요. 사진 업로드나 로그인은 필요 없어요.',
    'Not now':'나중에', 'That’s me!':'완료!', 'MY VERY OWN COLLECTION':'나만의 소중한 작품 모음',
    'Close My Library':'내 보관함 닫기', 'Your saved progress and finished creations, together.':'진행 중인 활동과 완성한 작품을 함께 보관해요.',
    'Your saved books will appear here.':'저장한 책이 여기에 모여요.',
    'Your collection is waiting for its first creation.':'나의 첫 작품을 기다리고 있어요.',
    'Saved in My Library':'내 보관함에 저장한 작품', 'Open my book':'내 책 펼치기',
    'MY VERY OWN STORYBOOK':'나만의 소중한 이야기책', 'My storybook':'나의 이야기책',
    'Close storybook':'이야기책 닫기', 'Saved storybook pages':'저장한 이야기책',
    'A saved picture could not load. Your original work is unchanged. Close the book and try again.':'저장한 그림을 불러오지 못했어요. 원본 작품은 그대로예요. 책을 닫고 다시 열어 주세요.',
    'Open your book to see what you made.':'책을 펼쳐 나의 작품을 만나 보세요.',
    'You made it to the end. This storybook is yours!':'끝까지 읽었어요. 나만의 이야기책이 완성됐어요!',
    'Your completed activity pages, just as you saved them.':'내가 저장한 그대로의 완성된 활동이에요.',
    'Turn your saved storybook page':'저장한 이야기책 책장 넘기기', 'Previous page':'이전 쪽', 'Previous':'이전',
    'Next page':'다음 쪽', 'Open book':'책 펼치기', 'The end':'끝', 'Front cover':'앞표지',
    'Storybook progress':'이야기책 진행 상태', 'Back to cover':'표지로 돌아가기',
    'Library':'내 보관함', 'Read my book':'내 책 읽어 줘요', 'Pause reading':'잠깐 멈추기', 'Resume reading':'이어서 읽기',
    'Read your actual saved book aloud':'저장한 내 책을 소리 내어 읽어요',
    'Full screen':'전체 화면', 'Enter fullscreen':'전체 화면으로 보기', 'Exit fullscreen':'전체 화면 나가기',
    'More book options':'책 옵션 더 보기',
    'Press Read my book to listen and watch.':'내 책 읽어 줘요를 눌러 보고 들어요.',
    'Reading your saved book…':'저장한 책을 읽고 있어요…', 'Reading paused.':'잠깐 멈췄어요.',
    'Getting the story ready…':'이야기를 준비하고 있어요…', 'Turning the page…':'책장을 넘기고 있어요…',
    'You read your saved book!':'내 책을 끝까지 읽었어요!',
    'Read aloud is not available for this saved book.':'이 책은 아직 소리 내어 읽기를 지원하지 않아요.',
    'Fullscreen is not available in this browser.':'이 브라우저는 전체 화면을 지원하지 않아요.',
    'Fullscreen could not start. You can still use the large reader.':'전체 화면으로 전환하지 못했어요. 큰 책 화면은 계속 사용할 수 있어요.',
    'Reading could not start. Tap Read my book to try again.':'읽기를 시작하지 못했어요. 내 책 읽어 줘요를 눌러 다시 시도해 주세요.',
    'Only your saved activity pages are in this book.':'저장한 활동만 모아 놓은 책이에요.',
    'Download the saved activity picture':'저장한 활동 그림 내려받기', 'Save a copy':'사본 저장',
    'Remove this saved creation from My Library':'내 보관함에서 이 작품 삭제하기', 'Remove creation':'작품 삭제',
    'Remove this creation?':'이 작품을 삭제할까요?',
    'Only this saved creation will be removed from My Library in this browser. The original book and activity will stay. Save a copy first if you want to keep your picture.':'이 브라우저의 내 보관함에서 이 작품만 삭제돼요. 원본 책과 활동은 그대로 남아요. 그림을 따로 보관하려면 먼저 사본을 저장해 주세요.',
    'Keep it':'그대로 두기', 'Remove':'삭제', 'Removing…':'삭제 중…', 'Try removing again':'다시 삭제하기',
    'This creation is not available in your current library.':'현재 내 보관함에서 이 작품을 찾을 수 없어요.',
    'This creation is no longer available in your current library. No other saved work was changed.':'현재 내 보관함에서 이 작품을 찾을 수 없어요. 다른 작품은 변경되지 않았어요.',
    'This creation could not be removed. Please try again. Your saved work has not been changed.':'작품을 삭제하지 못했어요. 다시 시도해 주세요. 저장한 작품은 그대로예요.',
    'This creation was removed. Your other creations and the original activity are unchanged.':'이 작품을 삭제했어요. 다른 작품과 원본 활동은 그대로예요.',
    'This creation was already removed. Your other creations are unchanged.':'이미 삭제된 작품이에요. 다른 작품은 그대로예요.',
    'Your reading adventures':'나의 읽기 모험', 'Close reading adventures':'읽기 모험 닫기',
    'Open reading activity':'읽기 활동 열기', 'Reading · coming soon':'읽기 · 준비 중', 'Open coloring ↗':'색칠하기 열기 ↗',
    'More books and activity pages will appear here when your teacher adds them.':'선생님이 책과 활동을 추가하면 여기에서 만나 볼 수 있어요.',
    'LOCAL REVIEW VERSION':'로컬 검토 버전', 'A note for grown-ups':'보호자·선생님께',
    'Close grown-up information':'보호자·선생님 안내 닫기', 'The live website has not been changed.':'실제 운영 중인 웹사이트는 변경하지 않았어요.',
    'This is a separate local homepage and a local copy of the existing coloring activity.':'이 페이지는 별도의 로컬 홈페이지와 기존 색칠 활동의 로컬 사본이에요.',
    'The four books shown are the available':'현재 이용 가능한 네 권은',
    'set. They are preview content, not a confirmed class assignment.':'도서예요. 미리보기용이며 확정된 학급 과제는 아니에요.',
    'Reading activities:':'읽기 활동:',
    'your coworker’s HTML pages are not connected yet. The reading links lead to clearly labeled coming-soon pages.':'동료가 만드는 HTML 활동은 아직 연결하지 않았어요. 읽기 링크를 누르면 준비 중 안내가 나와요.',
    'Coloring:':'색칠하기:',
    'Your coloring and handwriting save automatically in this browser. Choose':'색칠과 손글씨는 이 브라우저에 자동으로 저장돼요. 활동을 마치면',
    'Done!':'완료!', 'when finished.':'를 눌러 주세요.',
    'Bye-Bye Sugar Bugs! now opens a local three-activity preview. The other three reading activities are waiting for your coworker’s HTML pages.':'Bye-Bye Sugar Bugs!는 활동 세 개가 있는 로컬 미리보기로 열려요. 다른 세 권의 읽기 활동은 동료가 만드는 HTML을 기다리고 있어요.',
    'Bye-Bye Sugar Bugs! opens the supplied interactive reading page. Its Coloring button opens the three-activity coloring book. The other three reading activities are waiting for your coworker’s HTML pages.':'Bye-Bye Sugar Bugs!는 제공된 인터랙티브 리딩 페이지로 열려요. 색칠하기를 누르면 활동 세 개가 있는 색칠 책을 볼 수 있어요. 다른 세 권은 동료가 만드는 HTML을 기다리고 있어요.',
    'The reading page’s “my pictures” collection is separate from My Library for now.':'리딩 페이지의 “내 그림”은 현재 홈페이지의 내 보관함과 별도로 저장돼요.',
    'to finish the current activity. The book is complete when all three activities are finished.':'를 눌러 현재 활동을 마쳐요. 세 활동을 모두 마치면 책이 완성돼요.',
    'Start from Monthly Goals for a new coloring. To update saved work, open it in My Library and choose Continue my book.':'새 작품은 이번 달 목표에서 시작해요. 저장한 작품을 이어서 하려면 내 보관함에서 작품을 열고 이어서 하기를 눌러 주세요.',
    'Privacy:':'개인정보:',
    'no account, analytics, uploads or cloud sync are added. Browser data can be cleared, so use':'계정, 이용 분석, 업로드, 클라우드 동기화는 추가하지 않았어요. 브라우저 데이터는 지워질 수 있으므로',
    'for pictures you want to keep.':'기능으로 원하는 그림을 따로 보관해 주세요.',
    'The other book activities can be linked later through the local catalog. The integration guide is included with this project.':'다른 책의 활동도 나중에 로컬 도서 목록에서 연결할 수 있어요. 프로젝트에 연결 안내를 포함했어요.',
    'Your reading space is ready!':'나만의 읽기 공간이 준비됐어요!',
    'Profile changed for this visit. Browser storage is blocked.':'이번 방문에 사용할 프로필을 바꿨어요. 브라우저 저장은 차단되어 있어요.',
    'This picture is not available in the current library.':'현재 내 보관함에서 이 그림을 찾을 수 없어요.',
    'This storybook could not be opened. Your saved work is unchanged. Please try again.':'이야기책을 열지 못했어요. 저장한 작품은 그대로예요. 다시 시도해 주세요.',
    'My Library can’t open in this browser window.':'이 브라우저 창에서 내 보관함을 열 수 없어요.',
    'Please allow local browser storage. You can still explore the books.':'브라우저 저장을 허용해 주세요. 책은 계속 살펴볼 수 있어요.',
    'Browser storage is unavailable. No saved work has been removed.':'브라우저 저장을 사용할 수 없어요. 저장한 작품은 삭제하지 않았어요.',
    'Browser storage unavailable':'브라우저 저장을 사용할 수 없어요',
    'The library could not open. Browser storage may be blocked.':'보관함을 열지 못했어요. 브라우저 저장이 차단되었을 수 있어요.',
    'The library could not save this work. Check that your browser has free storage.':'작업을 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.',
    'The library operation was cancelled. Please try again.':'보관함 작업이 취소됐어요. 다시 시도해 주세요.'
  };
  const reverse = Object.fromEntries(Object.entries(ko).map(([source, translated]) => [translated, source]));
  const sources = new WeakMap(), attributes = new WeakMap();
  const skip = 'script,style,textarea,[contenteditable],[data-keep-english],#savedBookStage,.book-info h3,.catalog-item h3,.work-tile b,.avatar-choice>span:last-child';
  const pageTitle = document.title;
  let language = 'en', queued = false;
  try { language = localStorage.getItem(STORAGE_KEY) === 'ko' ? 'ko' : 'en'; } catch (_) {}

  function translate(source) {
    if (typeof source !== 'string' || language !== 'ko') return source;
    const plain = source.trim();
    let result = ko[plain], match;
    if (!result && (match = plain.match(/^(.+?)\s+([↗→←↓])$/))) {
      const label = translate(match[1]);
      if (label !== match[1]) result = `${label} ${match[2]}`;
    }
    if (!result && (match = plain.match(/^Level ([A-Z]) · Month (\d+)(?: · Week (\d+))?$/i))) result = `레벨 ${match[1].toUpperCase()} · ${match[2]}개월차${match[3] ? ` · ${match[3]}주차` : ''}`;
    if (!result && (match = plain.match(/^WEEK (\d+)(?: · (.+))?$/i))) result = `${match[1]}주차${match[2] ? ` · ${ko[match[2]] || match[2]}` : ''}`;
    if (!result && (match = plain.match(/^(\d+) saved creations?$/))) result = `저장한 작품 ${match[1]}개`;
    if (!result && (match = plain.match(/^(\d+) saved pages? inside$/))) result = `저장한 ${match[1]}쪽`;
    if (!result && (match = plain.match(/^(\d+) of (\d+) saved spreads?$/))) result = `저장한 책장 ${match[1]} / ${match[2]}`;
    if (!result && (match = plain.match(/^(\d+) of (\d+) activities finished$/))) result = `활동 ${match[2]}개 중 ${match[1]}개 완료`;
    if (!result && (match = plain.match(/^Page (\d+) of (\d+)$/))) result = `${match[1]} / ${match[2]}쪽`;
    if (!result && (match = plain.match(/^Pages (\d+)–(\d+) of (\d+)$/))) result = `${match[1]}–${match[2]} / ${match[3]}쪽`;
    if (!result && (match = plain.match(/^Choose (.+)$/))) result = `${match[1]} 선택하기`;
    if (!result && (match = plain.match(/^(.+), your GP character$/))) result = `나의 GP 캐릭터 ${match[1]}`;
    if (!result && (match = plain.match(/^Open saved (.+) storybook$/))) result = `저장한 ${match[1]} 이야기책 열기`;
    if (!result && (match = plain.match(/^Open (.+) reading activity( · coming soon)?$/))) result = `${match[1]} 읽기 활동 열기${match[2] ? ' · 준비 중' : ''}`;
    if (!result && (match = plain.match(/^Saved (coloring|activity) for (.+)$/))) result = `${match[2]}의 저장한 ${match[1] === 'coloring' ? '색칠 작품' : '활동'}`;
    if (!result && (match = plain.match(/^(.+) (book cover|cover)$/))) result = `${match[1]} 표지`;
    if (!result && (match = plain.match(/^(My coloring|My reading|My activity) · (.+)$/))) result = `${{ 'My coloring':'나의 색칠', 'My reading':'나의 읽기', 'My activity':'나의 활동' }[match[1]]} · ${match[2]}`;
    if (!result && (match = plain.match(/^(Your|.+’s) storybook · (Reading activities|Coloring and handwriting|Completed activities|Work in progress)$/))) {
      const owner = match[1] === 'Your' ? '나의' : `${match[1].slice(0, -2)}의`;
      result = `${owner} 이야기책 · ${{'Reading activities':'읽기 활동','Coloring and handwriting':'색칠과 손글씨','Completed activities':'완성한 활동','Work in progress':'진행 중인 작품'}[match[2]]}`;
    }
    return result ? source.replace(plain, result) : source;
  }
  function convert(value, cache) {
    if (!cache || value !== cache.rendered) {
      const original = reverse[value.trim()];
      cache = { source: original ? value.replace(value.trim(), original) : value };
    }
    cache.rendered = translate(cache.source);
    return cache;
  }
  function render() {
    queued = false;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.parentElement || node.parentElement.closest(skip)) continue;
      const cache = convert(node.data, sources.get(node)); sources.set(node, cache);
      if (node.data !== cache.rendered) node.data = cache.rendered;
    }
    document.querySelectorAll('[aria-label],[title],[placeholder],[alt]').forEach(element => {
      const protectedContent = !!element.closest(skip), cache = attributes.get(element) || {};
      for (const attribute of ['aria-label', 'title', 'placeholder', 'alt']) {
        // Input values are never read or translated. Its fixed UI placeholder
        // remains localizable even though the nickname input is protected.
        if (!element.hasAttribute(attribute) || (protectedContent && !(element.id === 'nameInput' && attribute === 'placeholder'))) continue;
        cache[attribute] = convert(element.getAttribute(attribute), cache[attribute]);
        if (element.getAttribute(attribute) !== cache[attribute].rendered) element.setAttribute(attribute, cache[attribute].rendered);
      }
      attributes.set(element, cache);
    });
  }
  function setLanguage(next, persist = true) {
    language = next === 'ko' ? 'ko' : 'en';
    document.documentElement.lang = language;
    document.title = language === 'ko' && pageTitle === 'GP Reading · My little reading world' ? 'GP Reading · 나의 작은 리딩 세상' : pageTitle;
    document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
    if (persist) try { localStorage.setItem(STORAGE_KEY, language); } catch (_) {}
    render();
  }
  window.GPHomeUI = Object.freeze({ getLanguage: () => language, setLanguage, translate, refresh: render });
  document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.language)));
  new MutationObserver(() => {
    if (!queued) { queued = true; queueMicrotask(render); }
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['aria-label', 'title', 'placeholder', 'alt', 'data-keep-english'] });
  window.addEventListener('storage', event => { if (event.key === STORAGE_KEY) setLanguage(event.newValue, false); });
  setLanguage(language);
})();
