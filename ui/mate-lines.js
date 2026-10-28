/* Everything My Mate says, in each GP Friend's own voice (personalities from the GP Friends profile sheets,
   plan: design/plans/mates-library-tower-plan.html). Story content (a book's questions, sentences, facts) is not here:
   it is the same whoever the mate is. Lines stay short for ages 5 to 7.

   CLLines.text(moment, vars, mateId) -> the line for the chosen mate (or mateId), with {name}, {step}, {n}, {last},
   {outfit}, {price}, {need}, {level}, {count}, {mate} filled in. Several lines for one moment take turns.
   CLLines.id(...) gives the same line's id, e.g. "penny.right.1": the file name its recorded voice will have
   (ElevenLabs, later). CLLines.flourish(moment) plays a mate's little sound (Don's fanfare). */
(function () {
  const L = {
    /* ---------- outside the castle ---------- */
    welcome: {
      gerry: ['It’s Gerry time! Hi, {name}! Yay, let’s go!'],
      penny: ['Hi, {name}! I have so many ideas for today!'],
      ria: ['Hello, {name}! Fascinating new books are waiting!'],
      syd: ['G’day, {name}! Good vibes, big smiles! Let’s do this!'],
      wanda: ['Good morning, {name}! Let’s take care of our library today.'],
      don: ['Welcome, welcome, {name}! Please, after you!'],
      coover: ['Hi, {name}! Hard hat on. Let’s build some reading!']
    },
    enter: {
      gerry: ['Three, two, one… Abracadabra!'],
      penny: ['What if we say the magic word together? Abracadabra!'],
      ria: ['Observe closely… Abracadabra!'],
      syd: ['Ready, set… Abracadabra!'],
      wanda: ['Stay together! Abracadabra!'],
      don: ['Open, by royal order! Abracadabra!'],
      coover: ['Step one: open the door. Abracadabra!']
    },
    goodbye: {
      gerry: ['See you next time, {name}! That was awesome!'],
      penny: ['Bye, {name}! I’ll keep thinking of new ideas for you!'],
      ria: ['Goodbye, {name}! So many questions, so little time!'],
      syd: ['See ya, {name}! Time for a nap. Big day!'],
      wanda: ['Goodbye, {name}! I’ll remember where we stopped.'],
      don: ['Farewell, {name}! It was a splendid day!'],
      coover: ['See you, {name}! We built a lot today.']
    },
    comeBack: {
      gerry: ['Want to go back in? Let’s go, let’s go!'],
      penny: ['Shall we go back in? I have another idea!'],
      ria: ['There’s more to discover. Tap the door!'],
      syd: ['One more round? Tap the door, mate!'],
      wanda: ['The library is still open. Tap the door!'],
      don: ['The door awaits you. After you, please!'],
      coover: ['The door still works great. Tap it!']
    },
    tapOutside: {
      gerry: ['Hi! I’m Gerry. Tap the door to go inside!', 'Did you see the owl? He brings our new books!', 'Psst! Try tapping the flying books!'],
      penny: ['Hi! I’m Penny! What if we tap the flying books?', 'The owl looks happy. Maybe he has new stories!', 'I love this castle. It looks like a story!'],
      ria: ['I’m Ria! Did you know owls can turn their heads very far?', 'Fascinating! The books are flying!', 'Let’s investigate. Tap the door!'],
      syd: ['I’m Syd! Race you to the door!', 'Whoa, those books fly better than my surfboard!', 'Tap the owl. He’s a great flyer!'],
      wanda: ['I’m Wanda! Look closer. The owl brings our books.', 'Safety first, exploring second. Then reading!', 'Let’s keep our library clean and happy.'],
      don: ['I am Don! This castle is truly splendid.', 'Every castle needs a royal welcome. Ta-da!', 'After you! The door is right there.'],
      coover: ['I’m Coover! I checked this door. It’s very strong.', 'Measure twice, read once!', 'The flying books are well built. Tap one!']
    },

    /* ---------- in the hall ---------- */
    hallArrive: {
      gerry: ['Pick a glowing book! Let’s go!'],
      penny: ['Which book feels exciting today? Pick a glowing one!'],
      ria: ['Which book should we investigate? Pick a glowing one!'],
      syd: ['Pick a glowing book. You got this!'],
      wanda: ['Pick a glowing book, explorer!'],
      don: ['Please, choose a glowing book. It is your royal pick!'],
      coover: ['Step one: pick a glowing book!']
    },
    hallBookDone: {
      gerry: ['That book is in My Library now! Pick another one!'],
      penny: ['Your book is in My Library! What should we read next?'],
      ria: ['Book finished! Next discovery, please!'],
      syd: ['Nailed it! Book number two?'],
      wanda: ['Well done. Your book is safe in My Library.'],
      don: ['Splendid! That book is in My Library. Another, please!'],
      coover: ['Job finished properly. Next book!']
    },
    tapHall: {
      gerry: ['Tap a book on the shelves to start a quest!', 'The candles love to be tapped. Try it!', 'Tap Wardrobe to dress me up!'],
      penny: ['What if we try a book from another level?', 'Tap Wardrobe! I have ideas for outfits.', 'The candles look like little ideas. Tap one!'],
      ria: ['Did you know every level has four new books each month?', 'Fascinating candles! Tap one.', 'Let’s investigate a book. Pick one!'],
      syd: ['Let’s stretch before we read. Reach up high!', 'Watch and learn. Tap a candle!', 'Every month, four new books arrive. Let’s go!'],
      wanda: ['Remember, you can read books from every level.', 'Look closer. One book is glowing for you!', 'Tap Wardrobe to change my outfit.'],
      don: ['This hall is fit for a king!', 'Every month, the owl brings four new books per level. Splendid!', 'Tap Wardrobe for something smart to wear.'],
      coover: ['These shelves are very well built.', 'Every problem has a plan. Pick a book!', 'Tap a candle. I checked them. Very safe.']
    },

    /* ---------- My Library ---------- */
    nookArrive: {
      gerry: ['Every book you read lives here! So cool!'],
      penny: ['This is your library! Every book you read lives here.'],
      ria: ['Your collection! Every book you read lives here.'],
      syd: ['Your trophy room for books! Every book lives here.'],
      wanda: ['Every book you read is kept safe here.'],
      don: ['Your royal library! Every book you read lives here.'],
      coover: ['Every book you read gets a place on these shelves.']
    },
    nookFrames: {
      gerry: ['Look! Your own pages are on the wall!'],
      penny: ['Look! Your pages are on the wall. So creative!'],
      ria: ['Observe! Your own pages are on the wall!'],
      syd: ['Check it out! Your pages are on the wall!'],
      wanda: ['Your own pages are on the wall. Lovely work!'],
      don: ['Behold! Your pages hang on the wall!'],
      coover: ['Your pages are on the wall. Nice and straight!']
    },
    tapNook: {
      gerry: ['Finish a quest to add a book here!', 'Let’s fill these shelves together!'],
      penny: ['These are the books you made. Wonderful!', 'What if we fill a whole shelf?'],
      ria: ['I counted your books. Fascinating!', 'Every finished book gets a gold seal.'],
      syd: ['Look at that collection! Big smiles!', 'One more book and we celebrate!'],
      wanda: ['I keep track of every book you finish.', 'Your books are safe and tidy here.'],
      don: ['A library worthy of a king!', 'Every gold seal is a medal. Splendid!'],
      coover: ['There is room for many more books here.', 'Every shelf is level. I checked!']
    },

    /* ---------- the quest trail (five steps) ---------- */
    'quest.read': {
      gerry: ['Three, two, one… go! Let’s watch the story!'],
      penny: ['Let’s start with the story! I wonder what happens.'],
      ria: ['First, we observe. Let’s watch the story!'],
      syd: ['Warm-up time! Let’s watch the story!'],
      wanda: ['Let’s start at the beginning. Watch the story!'],
      don: ['The story begins! Let’s watch it together.'],
      coover: ['Step 1 of 5: watch the story!']
    },
    'quest.question': {
      gerry: ['Three, two, one… question time!'],
      penny: ['Time for questions! What do you think?'],
      ria: ['So many questions! Let’s investigate.'],
      syd: ['Quick stretch! Now, question time!'],
      wanda: ['Time for questions. Look closer!'],
      don: ['Questions, please! Let’s be clever.'],
      coover: ['Step 2 of 5: answer the questions!']
    },
    'quest.think': {
      gerry: ['Three, two, one… thinking time!'],
      penny: ['Thinking time! There’s always another way.'],
      ria: ['Thinking time! Let’s figure it out.'],
      syd: ['Shake your arms! Now let’s think.'],
      wanda: ['Thinking time. Let’s think it through.'],
      don: ['Thinking time! A splendid mind at work.'],
      coover: ['Step 3 of 5: let’s think it through.']
    },
    'quest.express': {
      gerry: ['Three, two, one… say it out loud!'],
      penny: ['Now say it out loud! Your voice is special.'],
      ria: ['Now we speak! Say it out loud.'],
      syd: ['Big breath in! Now say it out loud!'],
      wanda: ['Now say it out loud, nice and clear.'],
      don: ['Now speak, like a royal announcer!'],
      coover: ['Step 4 of 5: say it out loud!']
    },
    'quest.create': {
      gerry: ['Three, two, one… let’s make something!'],
      penny: ['Making time! This is my favorite part!'],
      ria: ['Let’s make something. Fascinating!'],
      syd: ['Last one! Let’s make something!'],
      wanda: ['Let’s make something with care.'],
      don: ['The grand finale! Let’s make something!'],
      coover: ['Step 5 of 5: let’s build something!']
    },
    questResume: {   // only some mates remember the last step out loud
      wanda: ['Last time you finished {last}. Now let’s do {step}!']
    },
    questAllDone: {
      gerry: ['You did all five steps! Want to do one again?'],
      penny: ['All five steps! How did the story make you feel?'],
      ria: ['All five steps done! Want to investigate again?'],
      syd: ['Five out of five! You’re a champion!'],
      wanda: ['All five steps done, carefully and well!'],
      don: ['All five steps! Three cheers for you!'],
      coover: ['Five of five. A job done properly!']
    },
    questFirst: {
      gerry: ['First, the glowing one! Let’s go!'],
      penny: ['What if we try the glowing one first?'],
      ria: ['Observe the glowing one. Start there!'],
      syd: ['Glowing one first, mate!'],
      wanda: ['Let’s go in order. The glowing one first.'],
      don: ['The glowing one first, please!'],
      coover: ['Follow the plan. The glowing one first!']
    },
    bookDone: {
      gerry: ['Quest complete! We did it together!'],
      penny: ['Quest complete! Your ideas helped so much!'],
      ria: ['Quest complete! What a discovery!'],
      syd: ['Quest complete! Teamwork makes the dream work!'],
      wanda: ['Quest complete! Every day is a great day to learn.'],
      don: ['By royal order of Don, this book is finished! Three cheers!'],
      coover: ['Quest complete! With the right tools, we can do anything!']
    },

    /* ---------- activities ---------- */
    cheer: {
      gerry: ['Woo-hoo!', 'Yay!'],
      penny: ['What a clever idea!', 'Yes!'],
      ria: ['Fascinating!', 'Correct!'],
      syd: ['You got this!', 'Nailed it!'],
      wanda: ['Well spotted!', 'Good job!'],
      don: ['Splendid!', 'Simply splendid!'],
      coover: ['Nice work!', 'I did it! I mean, you did it!']
    },
    right: {
      gerry: ['Woo-hoo! You got it!'],
      penny: ['Yes! What a clever idea!'],
      ria: ['Correct! Observation is the first step!'],
      syd: ['You got this! Watch and learn!'],
      wanda: ['Well spotted! You notice the little things.'],
      don: ['Splendid! Simply splendid!'],
      coover: ['Nice work! That fits perfectly.']
    },
    tryAgain: {
      gerry: ['Oops! No problem. Let’s try again!'],
      penny: ['There’s always another way. Let’s look again!'],
      ria: ['Oops, I slip too sometimes! Look again.'],
      syd: ['Shake it off, mate. One more go!'],
      wanda: ['Stay calm and think it through. Try again.'],
      don: ['Even kings try twice. Once more, please!'],
      coover: ['Hmm, that won’t work. Measure twice, try again!']
    },
    'express.listenFirst': {
      gerry: ['Listen first, then say it with me!'],
      penny: ['Listen first, then say it your way!'],
      ria: ['Listen carefully first. Then you say it!'],
      syd: ['Listen up, then it’s your turn!'],
      wanda: ['Listen closely first, then say it with me.'],
      don: ['Listen first, please. Then it’s your turn!'],
      coover: ['Step one: listen. Step two: say it!']
    },
    'express.next': {
      gerry: ['Here comes the next one. Listen!'],
      penny: ['Ooh, the next one! Listen!'],
      ria: ['Next sentence. Listen carefully!'],
      syd: ['Next one! Listen up!'],
      wanda: ['Here is the next one. Listen closely.'],
      don: ['And now, the next sentence!'],
      coover: ['Next sentence. Listen first!']
    },
    'express.yourTurnMic': {
      gerry: ['Your turn! Tap the microphone and say it!'],
      penny: ['Now you! Tap the microphone and say it!'],
      ria: ['Now you! Tap the microphone and say it.'],
      syd: ['Your turn, mate! Tap the microphone!'],
      wanda: ['Now you. Tap the microphone and say it clearly.'],
      don: ['Your turn! Tap the microphone, please.'],
      coover: ['Now you. Tap the microphone and say it.']
    },
    'express.yourTurnSay': {
      gerry: ['Your turn! Say it out loud, then tap the button!'],
      penny: ['Now you! Say it out loud, then tap the button.'],
      ria: ['Now you! Say it out loud, then tap the button.'],
      syd: ['Your turn! Say it loud and proud, then tap!'],
      wanda: ['Now say it out loud, then tap the button.'],
      don: ['Say it grandly, then tap the button!'],
      coover: ['Say it out loud, then tap the button.']
    },
    'express.micOff': {
      gerry: ['No problem! Say it out loud, then tap the button.'],
      penny: ['That’s okay! There’s always another way. Say it out loud!'],
      ria: ['That’s okay! Just say it out loud, then tap.'],
      syd: ['No worries! Say it out loud, then tap the button.'],
      wanda: ['That’s okay. Say it out loud, then tap the button.'],
      don: ['Never mind! Say it out loud, then tap the button.'],
      coover: ['No microphone? No problem. Say it, then tap.']
    },
    'express.recorded': {
      gerry: ['Awesome! Tap Hear me to listen to yourself!'],
      penny: ['Wonderful! Tap Hear me to listen to yourself.'],
      ria: ['Fascinating! Tap Hear me to hear your voice.'],
      syd: ['Nailed it! Tap Hear me to listen!'],
      wanda: ['Lovely and clear! Tap Hear me to listen.'],
      don: ['Splendid! Tap Hear me to hear yourself.'],
      coover: ['Good work! Tap Hear me to check it.']
    },
    'express.said': {
      gerry: ['Great job saying it! Woo-hoo!'],
      penny: ['Great job saying it! I loved that!'],
      ria: ['Great job saying it! Correct!'],
      syd: ['Great job! You got this!'],
      wanda: ['Great job saying it. Well done!'],
      don: ['Great job! Simply splendid!'],
      coover: ['Great job saying it. Nice work!']
    },
    'express.heard': {
      gerry: ['That sounds great!'],
      penny: ['That sounds so special!'],
      ria: ['Your voice is fascinating!'],
      syd: ['That sounds awesome, mate!'],
      wanda: ['That sounds lovely and clear!'],
      don: ['What a splendid voice!'],
      coover: ['That sounds just right!']
    },

    /* ---------- the Magic Wardrobe ---------- */
    'wardrobe.welcome': {
      gerry: ['Welcome to the magic wardrobe! Pick an outfit for me!'],
      penny: ['The magic wardrobe! I have so many outfit ideas!'],
      ria: ['The magic wardrobe! Let’s investigate the outfits.'],
      syd: ['Wardrobe time! Let’s find something cool.'],
      wanda: ['The magic wardrobe! Let’s pick something sensible.'],
      don: ['Ah, the royal wardrobe! Splendid!'],
      coover: ['The magic wardrobe. Very well built!']
    },
    'wardrobe.twirl': {
      gerry: ['Wheee!', 'I love dressing up!', 'Pick an outfit for me!'],
      penny: ['Twirl! What if I spin again?', 'I feel so creative!'],
      ria: ['Whoops! A little wobbly!', 'Fascinating fabric!'],
      syd: ['Check out this spin!', 'Watch and learn!'],
      wanda: ['Careful… twirl!', 'Neat and tidy!'],
      don: ['Ta-da! A royal twirl!', 'How very smart!'],
      coover: ['Spin, step two!', 'Everything fits!']
    },
    'outfit.wearing': {
      gerry: ['This is what I’m wearing now!'], penny: ['This is my outfit right now. I love it!'], ria: ['This is my outfit right now.'],
      syd: ['Wearing it right now. Looking good!'], wanda: ['This is what I’m wearing now.'], don: ['I am wearing this now. Splendid!'], coover: ['I’m wearing this one now.']
    },
    'outfit.owned': {
      gerry: ['My {outfit} clothes! Shall I wear them?'], penny: ['My {outfit} clothes! What if I wear them?'], ria: ['My {outfit} clothes! Shall I wear them?'],
      syd: ['My {outfit} gear! Shall I put it on?'], wanda: ['My {outfit} clothes. Shall I wear them?'], don: ['My {outfit} attire! Shall I wear it?'], coover: ['My {outfit} clothes. Want me to wear them?']
    },
    'outfit.price': {
      gerry: ['Ooh, {outfit}! It costs {price} stars.'], penny: ['{outfit}! I love it! It costs {price} stars.'], ria: ['{outfit}! Fascinating! It costs {price} stars.'],
      syd: ['{outfit}! So cool! {price} stars.'], wanda: ['{outfit}. It costs {price} stars.'], don: ['{outfit}! Splendid! {price} stars, please.'], coover: ['{outfit}. It costs {price} stars.']
    },
    'outfit.need': {
      gerry: ['I love it! We need {need} more stars. Let’s read!'], penny: ['I love it! We need {need} more stars.'], ria: ['We need {need} more stars. Let’s read more!'],
      syd: ['So close! {need} more stars, mate!'], wanda: ['We need {need} more stars. Let’s keep reading.'], don: ['Alas! {need} more stars, please.'], coover: ['We need {need} more stars. Let’s plan our reading!']
    },
    'outfit.bought': {
      gerry: ['Ta-da! I’m a {outfit} now! Thank you!'], penny: ['Ta-da! I’m a {outfit}! Thank you so much!'], ria: ['Ta-da! I’m a {outfit}! Fascinating!'],
      syd: ['Ta-da! {outfit}! Looking good!'], wanda: ['Ta-da! I’m a {outfit}. Thank you!'], don: ['Ta-da! A {outfit}! Splendid!'], coover: ['Ta-da! I’m a {outfit}. Perfect fit!']
    },
    'outfit.wear': {
      gerry: ['Ta-da! How do I look?'], penny: ['Ta-da! How do I look?'], ria: ['Ta-da! How do I look?'], syd: ['Ta-da! Pretty cool, right?'],
      wanda: ['Ta-da! How do I look?'], don: ['Ta-da! Most splendid, yes?'], coover: ['Ta-da! Fits just right.']
    },
    'outfits.soon': {
      gerry: ['My new outfits are coming soon!'], penny: ['My outfits are coming soon. I have ideas!'], ria: ['My outfits are coming soon!'], syd: ['My outfits are coming soon, mate!'],
      wanda: ['My outfits are coming soon.'], don: ['My royal outfits are coming soon!'], coover: ['My outfits are still being built!']
    },
    'mate.hello': {   // said by the friend the child is looking at
      gerry: ['Hi! I’m Gerry! Can I be your mate? Let’s go!'],
      penny: ['Hi! I’m Penny! Can I be your mate? I have ideas!'],
      ria: ['Hello! I’m Ria! Can I be your mate? Let’s investigate!'],
      syd: ['G’day! I’m Syd! Can I be your mate? You got this!'],
      wanda: ['Hello! I’m Wanda! Can I be your mate? I’ll keep you safe.'],
      don: ['Good day! I am Don! May I be your mate?'],
      coover: ['Hi! I’m Coover! Can I be your mate? We can build anything!']
    },
    'mate.mine': {
      gerry: ['I’m your mate! Let’s read together!'], penny: ['I’m your mate! Let’s read together!'], ria: ['I’m your mate! Let’s discover together!'], syd: ['I’m your mate! Let’s do this!'],
      wanda: ['I’m your mate. Let’s explore together!'], don: ['I am your mate! At your service!'], coover: ['I’m your mate. Let’s build together!']
    },
    'mate.chosen': {
      gerry: ['Yay! I’m your mate now! Let’s go!'], penny: ['Yay! I’m your mate now! I’m so happy!'], ria: ['Yay! I’m your mate now! Fascinating!'],
      syd: ['Yes! I’m your mate now! Big smiles!'], wanda: ['Thank you! I’m your mate now. Let’s explore!'], don: ['Hooray! I am your mate now! Three cheers!'], coover: ['Great! I’m your mate now. Let’s build!']
    },
    'mate.soon': {
      gerry: ['{mate} is getting ready. Coming soon!'], penny: ['{mate} is getting ready. Coming soon!'], ria: ['{mate} is getting ready. Coming soon!'], syd: ['{mate} is getting ready, mate. Coming soon!'],
      wanda: ['{mate} is getting ready. Coming soon!'], don: ['{mate} is getting ready. Coming soon!'], coover: ['{mate} is still getting ready. Coming soon!']
    },

    /* ---------- My Library 꾸미기 (decorating the room) ---------- */
    'room.open': {
      gerry: ['Decorating time! Tap a glowing spot. Let’s go!'],
      penny: ['Ooh, decorating! I have so many ideas. Tap a glowing spot!'],
      ria: ['Let’s investigate this room. Tap a glowing spot!'],
      syd: ['Let’s make this room awesome! Tap a glowing spot.'],
      wanda: ['Let’s make our room cozy and tidy. Tap a glowing spot.'],
      don: ['Let us make this room fit for a king! Tap a glowing spot.'],
      coover: ['Hard hat on! Every room has a plan. Tap a glowing spot.']
    },
    'room.spot': {
      gerry: ['Pick one! They all look fun!'],
      penny: ['What if we try this one? Or this one?'],
      ria: ['Fascinating choices! Tap one to try it.'],
      syd: ['Try one on for size!'],
      wanda: ['Look closer and pick your favorite.'],
      don: ['Choose wisely, please!'],
      coover: ['Measure twice! Tap one to try it.']
    },
    'room.kept': {
      gerry: ['Woo-hoo! It looks great!'],
      penny: ['I love it! It’s so creative!'],
      ria: ['Fascinating! Our room looks new!'],
      syd: ['Looking good! Big smiles!'],
      wanda: ['Lovely! Nice and cozy.'],
      don: ['Splendid! A royal room!'],
      coover: ['Perfect fit! I did it! I mean, you did it!']
    },
    'room.need': {
      gerry: ['We need {need} more stars. Let’s read and come back!'],
      penny: ['We need {need} more stars. Let’s read some stories!'],
      ria: ['We need {need} more stars. More reading, more discovering!'],
      syd: ['{need} more stars, mate. You got this!'],
      wanda: ['We need {need} more stars. Let’s keep reading.'],
      don: ['Alas, {need} more stars, please!'],
      coover: ['We need {need} more stars. Let’s plan our reading!']
    },
    'room.done': {
      gerry: ['Our room is awesome! Let’s go read!'],
      penny: ['What a beautiful room! Thank you!'],
      ria: ['A perfect room for reading. Fascinating!'],
      syd: ['Best room ever! Big smiles!'],
      wanda: ['Our room is cozy and tidy. Well done!'],
      don: ['A room fit for a king! Splendid!'],
      coover: ['Room finished. A job done properly!']
    },

    /* ---------- certificates ---------- */
    'cert.earned': {
      gerry: ['Hooray, {name}! The owl brought your certificate! You did it!'],
      penny: ['{name}! The owl brought your certificate! I’m so proud of you!'],
      ria: ['Fascinating, {name}! The owl brought your certificate!'],
      syd: ['Yes, {name}! Your certificate is here! Champion!'],
      wanda: ['Well done, {name}! The owl brought your certificate.'],
      don: ['By royal order, {name}, here is your certificate! Splendid!'],
      coover: ['{name}, the owl brought your certificate. Great work!']
    },
    'cert.ribbon': {
      gerry: ['Amazing, {name}! You finished Level {level} too! New ribbon!'],
      penny: ['{name}, you finished Level {level} too! A new ribbon!'],
      ria: ['Level {level} too! Your certificate got a new ribbon!'],
      syd: ['Level {level} done too! New ribbon, champion!'],
      wanda: ['Level {level} too! Your certificate has a new ribbon.'],
      don: ['Level {level} as well! A royal ribbon for you!'],
      coover: ['Level {level} done too. One more ribbon!']
    },
    'cert.roomSome': {
      gerry: ['Wow, {name}! You have {count} certificates! Tap one!'],
      penny: ['{name}, you have {count} certificates! Tap one to look!'],
      ria: ['{count} certificates! Fascinating! Tap one.'],
      syd: ['{count} certificates! Look at that wall!'],
      wanda: ['You have {count} certificates. Tap one to look.'],
      don: ['{count} certificates! A royal wall!'],
      coover: ['{count} certificates, hung nice and straight!']
    },
    'cert.roomNone': {
      gerry: ['Finish four books of a level, and your first certificate hangs here!'],
      penny: ['Finish four books of a level, and your certificate hangs here!'],
      ria: ['Four books of a level, and a certificate appears here!'],
      syd: ['Four books of a level, and your certificate goes up here!'],
      wanda: ['Finish four books of a level. Your certificate will hang here.'],
      don: ['Finish four books of a level, and a certificate shall hang here!'],
      coover: ['Four books of a level, and I’ll hang your certificate right here.']
    }
  };

  const turn = {};
  let lastId = '';
  const fill = (t, v) => t.replace(/\{(\w+)\}/g, (m, k) => (v && v[k] != null ? v[k] : ''));
  const mateNow = () => (window.CLMate ? window.CLMate.current().id : 'gerry');
  function pick(moment, mateId) {
    const set = L[moment]; if (!set) return null;
    const m = mateId || mateNow(), list = set[m] || (set === L.questResume ? null : set.gerry);
    if (!list || !list.length) return null;
    const k = moment + '|' + m, i = (turn[k] = ((turn[k] ?? -1) + 1) % list.length);
    return { id: `${set[m] ? m : 'gerry'}.${moment}.${i + 1}`, text: list[i] };
  }
  function text(moment, vars, mateId) { const p = pick(moment, mateId); if (!p) return ''; lastId = p.id; return fill(p.text, vars); }
  function has(moment, mateId) { return !!(L[moment] && L[moment][mateId || mateNow()]); }

  /* Don's little fanfare for finished books and certificates (follows the mute switch) */
  function flourish(moment) {
    if (mateNow() !== 'don' || !/^(bookDone|cert\.)/.test(moment)) return;
    try { if (localStorage.getItem('cl.muted') === '1') return; } catch (e) {}
    try {
      const ac = flourish.ac = flourish.ac || new (window.AudioContext || window.webkitAudioContext)();
      [[523, 0], [523, .12], [523, .24], [784, .4], [659, .62], [784, .74], [1047, .9]].forEach(([f, t0]) => {
        const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + t0;
        o.type = 'sawtooth'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + (f === 1047 ? .5 : .16));
        o.connect(g).connect(ac.destination); o.start(t); o.stop(t + .55);
      });
    } catch (e) {}
  }

  window.CLLines = { text, has, flourish, id: () => lastId, moments: () => Object.keys(L), all: L };
})();
