# The two characters

There are three levels. Always do level 1: it's instant and the site works with it. Offer level 2, which makes the site feel like *them*.

| Level | What it is | Needs |
|---|---|---|
| 1. Built-in couple, their colours | A hand-drawn cartoon pair with a real walk cycle, recoloured to match their hair, skin and clothes | Nothing (photos help) |
| 2. AI 3D characters | Pixar-style versions of the two of them, generated from their photos as sprite sheets | An image model that accepts reference photos |
| 3. Extras | A special animation at one stop (a toast, feeding each other) | Level 2 |

## Level 1: colour the built-in couple

The built-in pair is fixed in shape:
- `a` (left): short hair, shirt, trousers;
- `b` (right): long hair, dress.

If you can see the photos, pick colours from them. Otherwise ask ("hair colour? favourite outfit colours?").

```js
characters: {
  walk: { src: '' }, poses: { src: '' },   // '' = built-in couple
  builtin: {
    a: { skin: '#E8B894', hair: '#1F1A17', top: '#F4F1EA', bottom: '#2F3E5C' },
    b: { skin: '#FFDCC2', hair: '#6B4331', dress: '#FFB7C5', shoes: '#A8423F' },
  },
}
```

- Keep colours soft and a little brighter than in the photo: the cartoon style likes pastels.
- Skin: use a mid-tone of the person's skin. Shading is derived automatically.
- If the couple doesn't match the a/b look (two women, two men, anyone who wouldn't wear the dress), use level 2. Level 2 draws them as they are. Tell the user that this is why you recommend it.
- **What's fixed in the built-in look:**
  - `a` has short straight hair and a collared shirt;
  - `b` has long straight hair, a pink bow, a dress and a small crossbody bag;
  - no curls, hoods, glasses or hats.

  Get close with colours: a green hoodie becomes a green `top`.
- **Skin tone unknown** (no photo, and you can't ask)? Keep the template defaults (`#FFDCC2` for both) and mention it in the hand-off, so the user can tell you.
- **When the built-in look is wrong for them** (e.g. two people with short hair), say so in the hand-off: "until you send photos, the cartoon shows X with long hair". Include the AI prompt, ready for when the photos arrive.

## Level 2: AI characters from photos

You need two sprite sheets:
- `walk`: required. A 6-frame walk cycle holding hands.
- `poses`: optional but lovely. Six still poses; one is used per stop, and tapping the couple switches between them.

The site processes the sheets automatically:
- keys out the green background;
- finds each frame;
- aligns the frames on the feet and upper body so the animation doesn't wobble;
- times the steps to the scrolling ground.

### Who generates the images

- **You have an image tool that takes reference images?** Generate the sheets yourself, attaching both photos, and save them into `assets/characters/`. That could be an image-generation tool in your environment, or an OpenAI / Google API key the user gives you.
- **Otherwise**, hand the user the prompt below, filled in, plus short instructions. Good apps, most of which have a free tier:
  - **ChatGPT**: upload both photos and paste the prompt.
  - **Google Gemini**: upload both photos and paste the prompt.
  - **豆包 Doubao / 即梦 Jimeng**: easiest from mainland China.

  Ask them to send back or save the images. Many chat apps show a download button on the image. They must save the *original* image, not a screenshot.
- **Privacy.** Only send the photos to the image service the user chose. Don't upload them anywhere else.

### Prompt (fill in the [brackets])

Attach photo 1 (the person on the left) and photo 2 (the person on the right), then:

```text
Using the two attached photos as reference (photo 1 is the person on the left, photo 2 is the person on the right), create a 3D animated-movie version of this couple in a Pixar-style cartoon look: keep their faces, hairstyles and hair colours recognisable, but stylise them with slightly bigger heads (about 1:3 head-to-body), large expressive eyes, soft rounded shapes, smooth matte skin and warm, soft studio lighting. The person on the left wears [OUTFIT 1]; the person on the right wears [OUTFIT 2] — nothing [KEY COLOUR NAME] on either of them. Show both full-body at the same scale, [ACTION]. The characters, outfits, colours, proportions, lighting and camera angle must be identical in every frame, as if every frame were rendered from the same animation rig.

Lay it out as a clean animation sprite sheet on a 1536×1024 landscape canvas: a grid of [3 columns × 2 rows] equal cells holding [6] frames, read left-to-right then top-to-bottom, that loop seamlessly. Centre the couple in each cell with their feet on the same baseline near the bottom of the cell, filling about 80% of the cell height, and leave clear empty space between cells so nothing touches or crosses a cell edge. The background must be one flat, pure chroma-key [KEY COLOUR NAME] ([KEY HEX]) everywhere — no floor, no cast shadows, no gradient, no grid lines, borders, frame numbers, text or watermark.
```

- **Outfits.** Describe what they'll really wear on the date, or what they wear in the photos. Be specific: "a cream knit sweater, light-blue jeans and white sneakers".
- **Key colour.** Normally use green (`#00FF00`). If either person wears green (a green hoodie or dress), use **magenta (`#FF00FF`)** instead. The site detects the background colour automatically, and clothes in the key colour turn see-through. With magenta, pink and red clothes are the risk; with green, green and teal are.

| File | Grid | `[ACTION]` |
|---|---|---|
| `walk.png` | 3 × 2, 6 frames | walking to the right in a three-quarter side view, holding hands between them, in one complete walk cycle — contact, down, passing, up for each leg — with their free arms swinging naturally and a slight up-and-down bob; frames 3 and 6 are the passing poses with the legs almost together |
| `poses.png` | 3 × 2, 6 poses | six different sweet still poses rather than an animation, in this order: standing holding hands; a hug with one of them lifting a foot; making a heart shape with their hands together; strolling hand in hand; one giving the other a piggyback ride with a V sign; squatting side by side with their chins resting on their hands |
| `idle.png` (optional) | 2 × 2, 4 frames | standing hand in hand, turned slightly toward the viewer, gently swaying and breathing, glancing at each other and smiling, with one blink |
| `cheers.png` (optional) | 2 × 2, 4 frames | standing side by side, each holding a drink, raising them and clinking gently, then smiling at each other |
| `dinner.png` (optional) | 2 × 2, 4 frames | seated side by side on low stools with no table, turned slightly toward the viewer; one feeds the other a bite with a fork/chopsticks and they lean in happily |

- **2 × 2 sheets.** Also change `[3 columns × 2 rows]` to `[2 columns × 2 rows]` and `[6]` to `[4]`.
- **`poses`.** Replace "that loop seamlessly" with "each a separate pose".
- **Different poses.** If you change the poses, update `poses.list` names and `say` lines to match their order.

### Put the sheets in the site

1. Save the sheets as `assets/characters/walk.png` and `poses.png`. `.webp` is smaller: convert with `cwebp -q 85 in.png -o out.webp`, or Python PIL `img.save('out.webp', quality=85)`.
2. Set the paths in the config:
   ```js
   walk:  { src: 'assets/characters/walk.png',  cols: 3, rows: 2, frames: 6, fps: 9 },
   poses: { src: 'assets/characters/poses.png', cols: 3, rows: 2, frames: 6, normalize: false, list: [...] },
   ```
3. Check them in the sprite checker. It lives in the skill, not in the site you built:
   - run `node <skill>/scripts/serve.mjs <skill>/template`;
   - open `/tools/sprite-check.html`;
   - drag the sheet in.

   It shows:
   - the detected frames;
   - the aligned loop with an onion skin;
   - the exact `cols / rows / frames` line to paste.

   Without a browser, run `node scripts/preview.mjs <site>` and look at the screenshots instead.
4. Choose poses per stop with `idle.pose`, and set `coverPose`.

### When it goes wrong

| Problem | Fix |
|---|---|
| The model drew a different grid (e.g. 4 × 2) | Set `cols` / `rows` / `frames` to what it drew. |
| One frame has a different outfit or face | Regenerate. Consistency beats detail. |
| Frames are different sizes | Usually fine: frames are auto-scaled for the walk. Use `normalize: false` on poses (a squatting pose should stay small). |
| Green fringe around hair | Regenerate with a cleaner background, or accept it. On phones it's barely visible. |
| White or transparent background instead of green | Transparent works. White works unless they wear white. |
| Part of an outfit turned see-through | The outfit is close to the key colour. Regenerate with the other key (green ↔ magenta). |
| The couple walks the wrong way | Nothing to do: the site mirrors them when walking back. They should face **right** in the sheet. |
| Characters look too big or small | `characters.height` (0.3–0.42). |
| They float or sink on a generated background | `groundY` of that stop (backgrounds.md). |

## Level 3: a special animation at one stop

Add `idle.sprite` to a stop:

```js
idle: { type: 'cheers', sprite: { src: 'assets/characters/cheers.png', cols: 2, rows: 2, frames: 4, fps: 4, height: 0.34 } }
```

`height` is relative to the scene. Tune it until the characters look right next to the table.
