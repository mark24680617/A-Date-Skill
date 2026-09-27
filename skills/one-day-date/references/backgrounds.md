# Generated background plates (optional)

The built-in backgrounds (scenes.md) cover most dates and cost nothing. Generate a plate only when a stop needs something they don't have:
- a famous landmark (the Eiffel Tower, Fushimi Inari, the Golden Gate). If you can't generate images, pick the nearest scene, set `skyline: 'none'` for historic places, and let the card text name the landmark;
- a very specific place (their favourite bookshop);
- a style that should match AI-generated characters.

A plate is one image per stop. It replaces the drawn background, but the stop's table (the `prop` layer) stays in front of the couple. The couple still walks between stops with the usual transition.

## Prompt

```text
Create a 3D animated-movie (Pixar-style) background plate with no people: [SCENE], [LIGHT]. Eye-level camera, 1536×1024 landscape, with a flat walkable ground running left to right across the bottom of the frame — the spot where two characters would stand is in the centre, about 82% of the way down the image — and the main landmark in the upper middle behind that spot. Rich but uncluttered detail, soft depth of field, no text, no watermark.
```

- `[SCENE]`: the place, concretely. For example, "the Seine riverbank in Paris with the Eiffel Tower across the water, cobblestones, a green bookseller's stall, plane trees".
- `[LIGHT]`: matches the stop's time. For example, "soft golden late-afternoon light" or "blue hour with warm street lamps".

## Using it

1. Save the plate as `assets/backgrounds/<stop-id>.webp` (or `.png` / `.jpg`). Keep each plate under about 400 KB, e.g. WebP at quality 80.
2. On the stop:
   ```js
   { bg: 'riverside', bgImage: 'assets/backgrounds/seine.webp', groundY: 0.82, … }
   ```
   Keep `bg` set to the closest built-in scene. It's the fallback if the image fails to load, and it decides the table prop.
3. Preview (`node scripts/preview.mjs <site>`). If the couple floats above the ground or sinks into it, adjust `groundY`, the fraction of image height where their feet should be: raise it (0.86) to move them down, lower it (0.78) to move them up.
4. Phones show only the middle of a wide image. Keep the landmark near the centre.

**Copyright.** Don't use photos you found online as plates; the site is public. Generate plates, or use photos the user took.
