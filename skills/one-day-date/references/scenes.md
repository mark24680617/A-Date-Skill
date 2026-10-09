# Background scenes

Each stop picks a hand-drawn background with `bg`. All scenes are layered SVG with parallax. The couple stands in the middle with their feet on the ground line.

`scenes-overview.jpg`, next to this file, shows all 12 in their default mood. To see them all:
1. Serve the skill's own template: `node <skill>/scripts/serve.mjs <skill>/template`. Sites you create don't include `tools/`.
2. Open `/tools/scenes.html?moods=1`.
   - Add `&lang=en` for the English defaults, `&only=cafe` to see one scene large, or `&skyline=shanghai` for the Shanghai skyline.
   - The dashed box shows what a phone sees.

## Which signs show on a phone

A portrait phone shows only the middle strip, and the card covers the top.
- **Visible on phones:**
  - `street`: `arch`, `metro`, `bus` / `busHead`;
  - `park`: `sign` (a short Chinese or Japanese name goes on a vertical plaque in view);
  - `bar`: the `sign` plate;
  - `cafe`: the bottom of the menu board.
- **Everything else** shows on computers only.

Relabel so nothing is wrong, but don't agonise over signs a phone never shows.

`scenes-moods.jpg` shows the six scenes that have moods in day, sunset and night.

## Choosing

1. **Pick the closest match.** The card's title and text name the actual place, so the background only has to *feel* right.
2. **Set `mood` to match the time**, where the scene supports it:
   - before about 16:30: `day`;
   - golden hour: `sunset`;
   - after dark: `night`.
3. **Relabel or hide the painted signs** with `labels`. `''` hides a sign. Label defaults follow `lang`. Place names default to hidden.
4. **Skyline.** City scenes draw a skyline:
   - `skyline: 'generic'` suits any city;
   - `'shanghai'` draws the Lujiazui towers, for Shanghai only;
   - `'none'` hides it.
5. **Nothing close?** Use a generated plate (backgrounds.md), or the most neutral scene: `park` outdoors, `cafe` indoors.

| Kind of stop | Good `bg` |
|---|---|
| Home, sleeping in, getting ready | `bedroom` |
| Leaving home, choosing transport, a city street | `street` |
| River or waterfront walk, bridge, promenade, harbour | `riverside` |
| Park, garden, picnic, **lake or pond** (e.g. West Lake), zoo, botanical garden, campus walk | `park` |
| Coffee, brunch, dessert, bakery, tea house, bookshop café | `cafe` |
| Museum, gallery, exhibition, aquarium lobby, concert hall foyer | `museum` |
| Beach, seaside, island (palms, lighthouse, sandcastle; not for lakes) | `beach` |
| Amusement park, funfair, night market with rides, festival | `amusement` |
| Chinese / Asian restaurant, hot pot, dumplings, noodles (relabel the menu) | `restaurant` |
| Western restaurant, pasta, steak, wine, anniversary dinner | `bistro` |
| Old town, temple fair, lanterns, Chinese garden, night food street | `yuyuan` |
| Bar, cocktails, live music, rooftop drinks | `bar` |

## The scenes

### `bedroom`: home, late morning
- **What's in it:** a cosy bedroom with a sunny window (a skyline outside), a bed and plants.
- **Opening stop:** with `idle: { type: 'sleep' }`, the built-in couple is asleep in bed until your partner taps "yes". Image-model characters stand by the empty bed instead, drowsy ("five more minutes"), in the stop's `idle.pose`.
- **Options:**
  - `pet: 'samoyed'` adds a fluffy dog.
  - `labels.frame` is the photo-frame caption: 我们 / us.
  - `labels.door` is the door sign: 今天放假 / Day off.
- **Mood:** fixed (morning).

### `street`: city street at noon
- **What's in it:**
  - Shanghai-style shikumen lane houses (grey brick, black doors, laundry poles), with an arched lane gateway behind the couple. It reads as "an older Asian city street"; for a Western city, the card text carries the place;
  - a metro entrance and a bus stop;
  - a taxi at the curb, parked bikes, and a traffic light.
- **Transport choice.** The scene is made for a `choice` with option ids `taxi`, `metro` and `bike`:
  - the taxi drives up and honks;
  - the metro and bus signs glow;
  - the bikes roll in and hop.
- **Labels:**
  - `arch`: the gateway plaque, hidden by default;
  - `metro`: 地铁 / Metro;
  - `metroSub`: Metro ↓ / Subway ↓;
  - `busHead`: the red header on the bus sign (BUS);
  - `bus`: 公交 / hidden in English, since the header already says BUS;
  - `busTo`: the bus direction, hidden by default;
  - `taxi`: the roof sign (TAXI).
- **Mood:** fixed (noon). A skyline appears far behind.

### `riverside`: waterfront, afternoon
- **What's in it:**
  - a river promenade with a white railing, plane trees and a big steel arch bridge;
  - a skyline across the water, and a boat passing;
  - a kite, birds, and a wayfinding sign.
- **Shanghai West Bund details:** white oil tanks, a red dock crane and old railway tracks. They are only drawn with the Shanghai skyline, or when you set `docks: true`; `docks: false` forces them off.
- **No bridge:** `bridge: false` leaves the arch bridge out.
- **Lakes:** for a lake, prefer `park` (pond, willow, gazebo).
- **Labels:**
  - `bridge`: the bridge name;
  - `sign`: the signpost's main line;
  - `signSub`: its second line.

  All three are hidden by default. The signpost disappears when both `sign` and `signSub` are empty.
- **Mood:** fixed (afternoon).

### `yuyuan`: Chinese old town at dusk
It is clearly *Chinese*: red lanterns, a Yu Garden–style pavilion, a candied-haw stand. For Japanese or Korean temples and shrines, use an autumn `park` (or a generated plate) instead.
- **What's in it:**
  - a teahouse pavilion with upturned eaves over a pond, and a zigzag bridge;
  - strings of red lanterns and old shopfronts;
  - a candied-fruit stand, and a skyline behind.
- **Labels:**
  - `pavilion`: the plaque under the pavilion, hidden by default;
  - `gate`: the big shop sign, hidden by default;
  - `banner`: the vertical banner, 3 characters max (小笼包 / hidden);
  - `snack`: the stand sign (糖葫芦 / Candy).
- **Best for:** Chinese old streets, temple fairs, night food streets.
- **Mood:** fixed (dusk).

### `restaurant`: Chinese restaurant, evening
- **What's in it:** a round moon-gate window with the city at night, lamps, a menu board and a scroll. The couple sits at a table in front, with dumplings, rice bowls and braised pork. Use `idle: { type: 'sit' }`.
- **Menu:** the default is Shanghainese dishes. Set `labels.menu` to the real restaurant's dishes (validate lists the defaults still showing).
- **Table food is fixed:** a steamer of dumplings, rice bowls, braised pork. For other cuisines use `bistro` (its table is fixed too: pasta, steak, red wine), and let the card text name the real dishes.
- **Labels:**
  - `menuTitle`: 今日推荐 / Today's menu;
  - `menu`: up to 4 dishes, as an array or comma-separated;
  - `scroll`: vertical scroll text, 4 characters max (好好吃饭 / hidden);
  - `cuisine`: a small framed sign, hidden by default;
  - `jar`: the character on the wine jars (酒 / hidden).
- **Mood:** fixed (evening).

### `bar`: cocktail bar at night
- **What's in it:** backlit bottle shelves, a window with the city at night, a neon script on the wall, a record player, and two glasses that clink on the table in front. Use `idle: { type: 'cheers' }`.
- **Labels:**
  - `neon`: the neon script (今晚月色真美 / Cheers to us);
  - `poster`: the record-sleeve poster (JAZZ).
- **Neon sign plate:** set `sign: 'Moon Bar'` on the stop to hang a neon name plate on the wall. `signIcon` is `'glass'` (default), `'heart'` or `'berry'`.
- **Mood:** fixed (night).

### `park`: city park or garden
- **What's in it:**
  - a winding path under the couple and a duck pond behind them;
  - blossom and green trees, a gazebo, a bench, lamp posts, tulips;
  - a picnic blanket with a basket to their right, and a faint skyline far away.
- **Season:** `season: 'spring'` (default: pink blossom), `'summer'` (all green) or `'autumn'` (orange and gold).
- **Moods:**
  - `day` (default): butterflies and petals;
  - `sunset`: a low sun and warm light;
  - `night`: moon, glowing lamps, fireflies.
- **Labels:** `sign` is the park name, hidden by default. Up to 6 Chinese characters go on a vertical plaque; anything else goes on a horizontal board.
- **Idle:** `stand`.

### `cafe`: coffee shop
- **What's in it:**
  - a counter with a pastry case and an espresso machine;
  - a chalkboard menu and a hanging shop sign;
  - windows onto a little street, plants, lamps, and a sleepy cat.
- **The couple's table:** in front, with lattes and cake. Use `idle: { type: 'sit' }`. With `table: false`, the table is removed; use `stand`.
- **Moods:** `day` (default), `sunset`, `night`. The window view, the lighting and even the clock change.
- **Labels:**
  - `name`: the shop sign (咖啡馆 / Café; `''` hides it);
  - `menuTitle`: 今日咖啡 / Coffee;
  - `menu`: up to 4 items, as an array or comma-separated.

### `museum`: art museum or gallery
- **What's in it:**
  - cream walls with skylights and spotlights;
  - a large gold-framed swirl painting right behind the couple, and other artworks;
  - a sculpture, a bench, and velvet ropes.
- **Moods:**
  - `day` (default);
  - `sunset`: golden shafts through the skylights;
  - `night`: "museum night", with dim walls and bright spotlights.
- **Labels:**
  - `name`: an exhibition banner, hidden by default;
  - `plaque`: the main painting's plaque text.
- **Idle:** `stand`.

### `beach`: seaside
- **What's in it:**
  - the sea to the horizon with animated foam, and the sun or moon right behind the couple;
  - a lighthouse on a headland, a sailboat;
  - an umbrella and towels, a sandcastle, a palm tree, a crab.
- **Moods:**
  - `day` (default);
  - `sunset`: the hero look, with the sun on the horizon and a glitter path;
  - `night`: moon path, sweeping lighthouse beam.
- **Labels:** `sign` is a wooden arrow sign, hidden by default.
- **Idle:** `stand`.

### `amusement`: amusement park or funfair
- **What's in it:**
  - a big Ferris wheel slowly turning behind the couple;
  - a carousel, a drop tower, a roller coaster, a big-top tent;
  - bulb strings, a balloon cart, a ticket booth.
- **Moods:** `night` (default: stars, fireworks, every light on), `sunset`, `day`.
- **Labels:**
  - `name`: the entrance sign (游乐园 / Funland);
  - `tickets`: 售票 / Tickets.

  `''` removes a sign.
- **Idle:** `stand`.

### `bistro`: Western restaurant for a dinner date
- **What's in it:**
  - a tall arched window behind the couple onto the city (skyline setting applies), with velvet curtains;
  - string lights, a wine rack, olive trees, a chalkboard menu.
- **The couple's table:** in front, with a candle, wine, pasta, steak and a rose. Use `idle: { type: 'sit' }`. With `table: false`, the table is removed.
- **Moods:** `night` (default), `sunset`, `day`.
- **Labels:**
  - `name`: a plaque above the menu, hidden by default;
  - `menuTitle`: 今晚菜单 / Tonight's menu;
  - `menu`: up to 4 dishes.
