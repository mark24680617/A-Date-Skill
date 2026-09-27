# Gathering inputs and writing the trip guide

The person you're helping may never have touched code. Ask for everything in one friendly message, offer a default for each question, and start building as soon as you have the must-haves. You can fill in the rest later.

## The one message to send

Adapt this to what they've already told you, and write it in *their* language:

> To make your date website I need a few things (anything you skip gets a sensible default):
> 1. **Who's it for?** Your two names or nicknames. They're optional, and shown on the cover.
> 2. **Language** the site should be in (the language your partner reads).
> 3. **The plan.** Paste your itinerary or trip guide. Or just tell me the city and roughly what you'd enjoy, and I'll draft one for you.
> 4. **Photos (optional).** One clear photo of each of you: facing the camera, good light, whole body if possible. I only use them to create the cartoon versions of you two.
> 5. **Dates.** Which day(s) could the date happen? Your partner picks one on the site.
> 6. **Little extras (defaults in brackets):**
>    - Should your partner choose something along the way, like how to get there or what dessert to have? [how to get there, if you're travelling]
>    - A "what don't you eat?" question at the meal? [yes]
>    - A pet in the opening scene? [no]
>    - The final question to your partner? ["Where should we go next time?"]

**Must-haves before you build:** the language, and either a plan or a city. Everything else can default:
- names: none on the cover;
- dates: skip the calendar;
- photos: built-in cartoon couple;
- extras: as above.

**Where the answers go** is a hosting question, not something to ask up front. Default to Netlify Forms (see deploy.md).

## Turning their plan into stops

- **Keep 4–6 stops.** More than 6 crowds the top bar on phones. Merge tiny steps ("buy coffee" belongs inside a stop). Split a stop only if the place really changes.
- **First and last stops.** A home or "sleep in" opener is charming but optional. End on an evening stop (dinner, a view, a bar, a walk).
- **For each stop, write:**
  - **time.** Keep it realistic, including travel time between places.
  - **title.** Short: ≤ 12 Chinese characters or ≤ 20 Latin letters. Longer titles wrap, and the card then covers the couple. The top bar, captions and next button use `name` if you set a shorter one.
  - **place.** The actual venue or area.
  - **text.** 1–2 sentences, ≤ 60 Chinese characters or ≤ 105 Latin characters. The card must not cover the couple on small phones.
  - **tasks.** 2–5 tiny "missions" to tick off, each ≤ 12 Chinese / ≤ 24 Latin characters: `Photo on the bridge`, `Share a dessert`.
  - **lines.** 3 speech-bubble lines.
  - **icon.** One emoji.
  - **accent.** A colour that suits the place.
- **Pick a background** for each stop from scenes.md, with a `mood` that matches the time of day.
- **Choices** belong where there's a real decision: transport, dessert, film, activity (e.g. "bike or boat on the lake"). Each choice needs a `key`, and its answer is recorded under that key.
- **Sanity-check their plan too.** Check that places exist, their opening days (many museums close on Mondays), whether reservations are needed, and whether the dates they gave fall on the weekday they said. Put what you found in the hand-off; don't silently change their plan.

## Drafting a plan when they don't have one

1. **Clarify quickly.** You need: the city or area; one day or part of a day; the vibe (relaxed, foodie, artsy, outdoorsy, nightlife); budget; how they'll get around; what their partner loves or hates.
2. **Research if you can.** Use web search to check that places exist, their usual opening days and hours (many museums close on Mondays), and whether reservations are needed.
   - Prefer clusters of places near each other, so the day isn't spent in transit.
   - If you can't browse, say so, and suggest they double-check hours.
   - Never invent a venue.
3. **Propose it as a short table** (time · stop · one line on why they'll love it), plus one or two alternatives. Ask "OK, or anything to change?" before building.
4. **Build a balanced day:**
   - a slow start;
   - one "wow" moment: a view, a museum, a landmark;
   - food at sensible times;
   - a rest stop (café, park);
   - a cosy evening;
   - weather: if there's no backup day, include one indoor option for rain (a museum or café can double as it).
5. **Rain and backup days.**
   - A backup day the *partner* may choose: put both days in `datePick` with `labels` (e.g. `'Plan A'` / `'If it rains'`).
   - A backup day the *weather* decides: delete `datePick` and mention it on the cover or in the first stop's text.
6. **Seasonal events** (illuminations, festivals, cherry blossom): the dates often aren't announced months ahead. Say so in the hand-off rather than guessing.

Example shapes to adapt:
- **City classic:** sleep in → brunch café → museum or gallery → riverside walk → dinner → cocktail bar.
- **Seaside:** morning café → beach → seafood lunch → sunset on the beach → amusement park or night market.
- **Low-key:** home → park picnic → bookshop café → cinema → home-cooked dinner.

## Writing the text

- **Voice and detail.** Write *to* the partner in the first person plural ("we", "us" / "我们"). Use the specific details the user gave you: inside jokes, the partner's favourite drink, the pet's name. These make the site feel personal.
- **Tone.** Sweet, playful and light. Mix romance with humour, like the "no" button that runs away. Avoid piling on clichés.
- **Chinese.** Use a natural spoken, cute tone (～, ！, 呀, 嘛) without overdoing it.
- **English.** Warm and casual.
- **Other languages.** Write naturally, and set every `ui` string in config (see config.md).
- **Don't invent facts** about the couple's history. When you want a personal touch you don't have, ask.
- **Keep the tasks doable on the day.** They double as a checklist.
