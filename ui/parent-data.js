/* Content for the parent area (ui/parents.js): the program, levels and each book's word list.
   Edit this file every month when new books arrive. Korean first, English second.
   LEVELS text is a draft written for the prototype: confirm the wording with the team before launch. */
window.CLParentData = {
  program: {
    name: 'GB · Great Baccalaureate',
    tagline: '144권의 책으로 시작하는 생각의 여정',
    month: '8월의 책 · Month 8',
    monthNo: 8,
    perYear: 144,
    note: '위대한 바칼로레아: 프랑스 바칼로레아의 교육 철학에서 영감을 받아, 스스로 질문하고 생각을 표현하는 힘을 기르는 독서 과정이에요.'
  },
  cycle: [
    { key: 'read', en: 'READ', ko: '깊이 읽기', text: '이야기를 듣고 읽어요.' },
    { key: 'question', en: 'QUESTION', ko: '질문하기', text: '이야기에 대한 질문에 답해요.' },
    { key: 'think', en: 'THINK', ko: '생각하기', text: '이유를 생각하고 골라요.' },
    { key: 'express', en: 'EXPRESS', ko: '표현하기', text: '문장을 듣고 직접 말해 봐요.' },
    { key: 'create', en: 'CREATE', ko: '창작하기', text: '따라 쓰고 색칠해 나만의 책을 만들어요.' }
  ],
  levels: [
    { id: 'A', name: 'Level A', icon: '✦', color: '#ff8a5c',
      focus: '첫 단어와 짧은 문장', skills: ['그림과 단어 연결하기', '짧은 문장 따라 말하기', '소리와 글자에 익숙해지기'],
      sample: 'Hello! Hello!' },
    { id: 'B', name: 'Level B', icon: '☾', color: '#5b3fa8',
      focus: '이야기 흐름 이해하기', skills: ['이야기 순서 이해하기', '간단한 질문에 답하기', '한두 문장으로 말하기'],
      sample: 'Brush in little circles.' },
    { id: 'C', name: 'Level C', icon: '★', color: '#20b486',
      focus: '생각을 말하고 표현하기', skills: ['이유 설명하기', '이야기와 내 생활 연결하기', '여러 문장으로 표현하기'],
      sample: 'Why do we wait for our turn?' }
  ],
  /* one entry per month book id (a8-1 … c8-4). words: [English, Korean, example sentence] */
  books: {
    /* titles and covers come from the month (app/months/current.js); add a book here to give it a word list */
    'b8-4': {
      title: 'Bye-Bye Sugar Bugs!',
      words: [
        ['teeth', '이, 치아', 'Brush your teeth in little circles.'],
        ['sugar bug', '충치 벌레', 'The sugar bug hides behind your back teeth.'],
        ['brush', '닦다, 칫솔질하다', 'Brush top and bottom, front and back.'],
        ['toothbrush', '칫솔', 'An electric toothbrush buzzes and spins.'],
        ['toothpaste', '치약', 'Squeeze the toothpaste from the bottom.'],
        ['sugar', '설탕', 'Sugar hides in cookies, juice and candy.'],
        ['water', '물', 'Drink water after something sweet.'],
        ['sweet', '달콤한', 'A donut is sweet and sticky.'],
        ['sticky', '끈적끈적한', 'Sticky food hugs your teeth.'],
        ['rinse', '헹구다', 'Rinse with water after a donut.'],
        ['lollipop', '막대사탕', 'Save the lollipop for after a meal.'],
        ['apple', '사과', 'An apple scrubs your teeth.'],
        ['soda', '탄산음료', 'Pick water, not soda.']
      ],
      sentences: ['Brush in little circles.', 'Drink water after sweets.', 'Bye-bye, sugar bugs!'],
      talk: ['Why do we brush in little circles?', 'Where do sugar bugs like to hide?', 'What can we drink after sweets?'],
      talkKo: ['왜 작은 원을 그리며 닦을까요?', '충치 벌레는 어디에 숨을까요?', '단 것을 먹은 뒤엔 무엇을 마실까요?']
    }
  }
};
