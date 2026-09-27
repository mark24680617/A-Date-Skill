/*
 * Example: an English seaside day (uses the city-neutral scenes).
 * To try it: copy this file over js/config.js in a fresh site (scripts/new-site.mjs),
 * set <html lang="en"> and <title> in index.html, and add <input name="brunch"> to the hidden trip-reply form.
 */
window.TRIP_CONFIG = {
  lang: 'en',
  title: 'Seaside & Us',
  subtitle: 'One Day With You',
  date: 'Autumn 2026',
  names: { a: 'Sam', b: 'Mia' },
  skyline: 'generic',
  music: 'assets/audio/bgm.mp3',
  reply: { to: 'netlify' },

  characters: {
    walk: { src: '', cols: 3, rows: 2, frames: 6, fps: 9 },
    poses: { src: '', cols: 3, rows: 2, frames: 6, normalize: false, list: [
      { name: 'hold', say: 'Hold my hand~' }, { name: 'hug', say: 'Hug!' }, { name: 'heart', say: '♥' },
      { name: 'stroll', say: 'Let’s wander' }, { name: 'piggyback', say: 'Hop on!' }, { name: 'chin', say: 'I like looking at you' },
    ] },
    coverPose: 'heart',
    height: 0.37,
    builtin: {
      a: { skin: '#F1C7A3', hair: '#3B2A22', top: '#F6F1E7', bottom: '#46618A' },
      b: { skin: '#FFE0C8', hair: '#8A5A3B', dress: '#FFC1CC', shoes: '#C9564F' },
    },
  },

  lines: ['Love you~', 'Hold on tight', 'Best day ever!', 'You look lovely today', 'Tired yet?', 'Hug?'],

  scenes: [
    {
      id: 'home', bg: 'bedroom', icon: '🛏️', time: '09:30',
      title: 'Slow morning', place: 'Home · under the duvet',
      text: 'No alarm today. Five more minutes, then five more. The sea can wait for us.',
      tasks: ['Snooze once (only once)', 'Say good morning', 'Pack the sunscreen'],
      accent: '#FFB547', nextLabel: 'Up we get', lines: ['Five more minutes…', 'Morning ☀️', 'So cosy'],
      labels: { frame: 'us', door: 'Day off' },
      idle: { type: 'sleep', pose: 'hug' },
    },
    {
      id: 'brunch', bg: 'cafe', mood: 'day', icon: '☕️', time: '10:30',
      title: 'Brunch first', place: 'Salt & Crumb café',
      text: 'Coffee number one of the day. You choose what we share — I already know I’ll steal a bite.',
      accent: '#C98A5B', labels: { name: 'Salt & Crumb', menuTitle: 'Brunch', menu: ['Flat white', 'Iced latte', 'Pancakes', 'Croissant'] },
      lines: ['Smells amazing', 'Cheers with coffee!', 'One more bite?'],
      idle: { type: 'sit', pose: 'chin' },
      choice: {
        key: 'brunch', ask: 'Pick what we share first~',
        options: [
          { id: 'pancakes', icon: '🥞', label: 'Pancakes', say: 'Extra syrup!' },
          { id: 'croissant', icon: '🥐', label: 'Croissants', say: 'Flaky crumbs everywhere' },
          { id: 'waffles', icon: '🧇', label: 'Waffles', say: 'Waffles it is!' },
        ],
      },
    },
    {
      id: 'beach', bg: 'beach', mood: 'day', icon: '🏖️', time: '13:00',
      title: 'Beach time', place: 'The long beach',
      text: 'Shoes off, toes in the sand. Race you to the water — loser buys ice cream.',
      tasks: ['Build a tiny sandcastle', 'Find a pretty shell', 'Ice cream break'],
      accent: '#3FA7D6', lines: ['The water’s cold!', 'Look, a boat!', 'Sunscreen on?'],
      idle: { type: 'stand', pose: 'stroll' },
    },
    {
      id: 'pier', bg: 'amusement', mood: 'sunset', icon: '🎡', time: '17:30',
      title: 'The pier fair', place: 'Funfair on the pier',
      text: 'Candy floss, the Ferris wheel at golden hour, and one very competitive ring toss.',
      tasks: ['Ride the Ferris wheel', 'Win you a prize', 'Share candy floss'],
      accent: '#E0533D', labels: { name: 'Pier Fun', tickets: 'Tickets' },
      lines: ['Top of the wheel!', 'I’ll win you that bear', 'So many lights'],
      idle: { type: 'stand', pose: 'piggyback' },
    },
    {
      id: 'dinner', bg: 'bistro', mood: 'night', icon: '🍝', time: '19:30',
      title: 'Dinner by candlelight', place: 'A little bistro by the harbour',
      text: 'Candles, pasta, and the last of the sunset in the window. First bite is yours.',
      tasks: ['Toast to today', 'Order dessert anyway'],
      accent: '#9B6BE0', nextLabel: 'End of our day ♥',
      labels: { name: 'Harbour Bistro', menuTitle: "Tonight's menu", menu: ['Seafood pasta', 'Steak frites', 'Tomato soup', 'Tiramisu'] },
      lines: ['Cheers!', 'This is so good', 'Dessert?'],
      idle: { type: 'sit', pose: 'hold' },
      diet: {
        icon: '🍴',
        button: '🍴 Anything you don’t eat?', title: 'Anything you don’t eat?', hint: 'I’ll order around it — pick as many as you like',
        options: ['Spicy', 'Seafood', 'Pork', 'Nuts', 'Dairy', 'Gluten', 'Mushrooms', 'Raw fish'],
        none: 'I eat everything!', otherPlaceholders: ['Anything else…', 'e.g. allergic to peanuts'],
        empty: 'Pick one, or tap “I eat everything!”', send: 'That’s all', cancel: 'Not now',
        saved: 'Noted — I’ll order around it ✓', savedNone: 'Great, anything goes!', summary: 'Avoid: ',
      },
    },
  ],

  cover: { question: 'Ready for our day?', yes: 'Ready!', no: 'Nope' },

  datePick: {
    title: 'Which day?', hint: 'Any of these two weekends works for me',
    dates: ['2026-10-17', '2026-10-18', '2026-10-24', '2026-10-25'],
    confirm: 'This day →', pickFirst: 'Pick a day first', disabled: 'Only the highlighted days, sorry!',
  },

  ending: {
    title: 'One day by the sea,\nand I’d stay forever.',
    question: 'Where should we go next time?',
    placeholders: ['Next time…', 'The mountains?', 'A cabin in the woods?', 'Tokyo?'],
    approve: 'Approved', feedback: 'I have suggestions', approved: 'Stamped and sealed ♥',
    summary: true, stamp: 'YES',
    feedbackTitle: 'Your suggestions', feedbackHint: 'What would make it even better?',
    feedbackPlaceholders: ['e.g. more ice cream', 'e.g. sleep in longer'], feedbackEmpty: 'Write something~',
    send: 'Send', cancel: 'Never mind', thanks: 'Got it — changes coming 🫡', replay: '↺ Once more',
  },
};
