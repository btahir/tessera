# Adding a theme

A theme is three small files in `themes/<name>/`. The shared runtime in `runtime/` does everything else: it sets the colors, draws the scene, moves it only while Claude works, swaps the spinner word and plays the chime.

Read `DESIGN.md` first. It has the rules every theme is held to. `themes/pluvia/` is the reference theme.

## The files

### `theme.json`

```json
{
  "name": "pluvia",
  "numeral": "XVI",
  "title": "Pluvia",
  "meaning": "rain",
  "family": "place",
  "kin": [],
  "vibe": "wet, quiet, late",
  "tagline": "Rain on a window, and a lit city through the glass.",
  "story": "Three or four plain sentences. What you see by day, what you see by night, what moves while Claude works.",
  "modes": ["light", "dark"],
  "contrast": "standard",
  "accents": "muted",
  "words": ["Drizzling", "Pooling", "Pattering", "Gathering clouds", "Listening to the rain"],
  "suffix": " ~",
  "alt": "A rainy city at night seen through a window",
  "chime": "The sound after a long turn. One short natural sound, soft, under 1.5 seconds, no music.",
  "bed": { "kind": "ambience", "prompt": "The loop that plays while Claude works, for people who turn music on." },
  "prompt": "One paragraph a person could paste into Claude to make something like this theme."
}
```

- `name` is the folder name: lowercase letters only.
- `family` is the wing it hangs in. `essential` is a clean default with little or no scene. `bold` is graphic and has attitude. `place` is a soft scene.
- `kin` names well known themes whose fans should feel at home here, such as `["Nord"]`. Leave it empty when there is none. A kin theme is a starting mood, never a palette to copy.
- `vibe` is three or four words for the mood. Everything else in the theme should agree with them: the colors, the art, the motion, the words and both sounds.
- `contrast` sets the ranges the check holds the theme to. `low` is for calm, soft themes (body text 7:1 to 10:1). `standard` is 9:1 to 14:1. `high` is for stark themes on a near black or white page (14:1 and up).
- `accents` is `muted` or `vivid`. Vivid lets the five role colors be loud.
- `words` are four to six spinner words in the theme's world. Each is one to three words and starts with a capital. `suffix` is optional: one or two plain characters after the word, with a leading space.
- `chime` and `bed` describe sounds for a sound model. The chime is one short sound. The bed is a calm loop: `ambience` for a place (rain, a fire, a room) or `music` for a soft instrumental. No voices, nothing with a strong beat.
- `tagline` is one sentence that says what you will see. `story` is for the theme's page on the site.
- Write plainly. No dashes used as punctuation, no hype words, no "not just X but Y".

### `palette.ts`

Exports `PALETTE` and `GLASS`. See `themes/pluvia/palette.ts`.

- Each mode gives `surface-0` (the page), `surface-1` (cards), `surface-2` (panels), `text-primary`, `text-secondary` and `text-muted`. Dark mode also gives `surface-3` (menus). In both modes `surface-0` is the darkest surface and each later one is as light or lighter. In light mode leave `surface-3` out.
- `roles` are five colors: `accent`, `danger`, `success`, `warning`, `pro`. The app keeps each hue and sets its own lightness. Code is colored from them: keywords from `accent`, strings from `success`, literals from `pro`, names from `danger`, variables from `warning`.
- Every color is six-digit hex.
- `GLASS` is how the app frosts its panels over the scene: `blur` in points (16 to 24 works) and `opacity` from 0.6 to 0.75.
- A high contrast theme adds `contrast: 'more'` to `PALETTE`, which asks the app for stronger borders and focus rings.

### `scene.ts`

Exports `SCENE`, one SVG document as a string. It is drawn behind the whole window.

- Root: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">`. The window can be any shape, so the art is cropped from the center. Keep anything that must be seen within the middle 1200 by 700.
- One `<style>` block holds every style, by class. No `style` attributes, no scripts, no event handlers, no outside files or fonts, no `<text>`.
- Colors are CSS variables on `svg`, swapped for dark mode by exactly this rule: `@media (prefers-color-scheme:dark){svg{...}}`. Light values are the default.
- A scene may be completely still. An essential theme can be a flat page with one soft shape.
- Motion is CSS animation only. If anything moves, include `.still .your-class{animation-play-state:paused}` for every animated class, and `@media (prefers-reduced-motion:reduce){...animation:none}`. The runtime adds the `still` class to the root whenever there is an answer to read.
- Spread starting positions with negative `animation-delay`, so the held frame looks composed and motion resumes from the same frame.
- Every `id` starts with the theme's name and a dash, such as `pluvia-sky`.
- Keep it under 40,000 characters if you can. The hard limit is 131,072.
- Build repeated shapes in code with a seeded random generator, as Pluvia does, so the scene is the same on every load.

## Design for the glass

Most of the window is covered by frosted panels: a sidebar on the left and the conversation in the middle. Under them the scene is blurred and veiled by about two thirds. So:

- Large soft shapes and color carry the mood. Fine lines vanish under the glass.
- The corners and the outer edges are where a scene shows most clearly. Put the character there.
- The middle half of the frame holds only soft gradients, within 1.6:1 of the page color.
- Nothing bright sits where the message box is, low in the middle.
- The scene's base color should sit close to `surface-0`, so the panels look like they belong to it.

## Check your work

```bash
bun install
bun scripts/check.ts <name>
bun scripts/shot.ts <name> <a folder outside the repo>
```

`check.ts` must end with "1 themes pass". `shot.ts` writes pictures of each mode: the scene under a plain chat frame, the scene alone held still, and two frames of it moving. Look at them. The still frame should look composed, like a poster. The two moving frames should differ. Text in the chat frame should be easy to read everywhere.

## Then

```bash
bun scripts/pack.ts        # rebuilds plugins/ and the marketplace file
bun scripts/build-site.ts  # refreshes the gallery's data
```

Commit `themes/<name>/` and the regenerated `plugins/`.
