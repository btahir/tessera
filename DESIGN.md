# How a Tessera theme is designed

A theme is a whole vibe: colors, art, motion, words and sound that all say the same thing. People also read in it for hours. So there are two kinds of rule here. **Floors** protect reading and apply to every theme. **Character** is what makes a theme itself, and each theme chooses.

`bun scripts/check.ts` enforces the rules marked **checked**.

## Three wings

- **Essentials.** Clean defaults with little or no scenery. If you want a neutral grey, a deep purple, a navy, a warm retro, a pastel or a high contrast theme, start here.
- **Bold.** Graphic themes with attitude: neon, concrete, primary shapes, a green screen, a blueprint, gold.
- **Places.** Soft scenes: rain on a window, a forest in mist, a greenhouse.

Many themes name their **kin**: well known themes whose fans should feel at home. Kin is a mood to honor. The colors and art are Tessera's own.

## Floors: every theme

1. **Text reads without effort.** Each theme declares a contrast level, and body text on the page must sit in its range: `low` 7:1 to 10:1, `standard` 9:1 to 14:1, `high` 14:1 and up. **checked**
2. **Muted text stays readable.** At least 4.5:1 on the page and on panels, and 7:1 in a high contrast theme. Many terminal themes drop comments under 3:1, and that is their most common complaint. Here muted text carries tool summaries and timestamps. **checked**
3. **Readable over the worst pixel.** With the glass over the scene, body and muted text keep their floors over the brightest and the darkest point of the scene, at six moments of its animation. **checked**
4. **The middle stays quiet.** Nothing in the center half of the frame differs from the page by more than 1.6:1. Art lives at the edges and corners. Nothing sits at the foot, where the message box is. **checked**
5. **Still while you read.** A scene moves only while Claude is working. When the answer lands, it stops. A reading study found animated backgrounds slow reading, and nobody reads while the spinner runs.
6. **Nothing flashes.** No element blinks faster than once in two seconds. Pulses may travel, the screen never strobes.
7. **Reduced motion means none.** Every moving scene stops under the system's reduced motion setting. **checked**
8. **Off switches.** `/tessera still` stops motion for good. `/tessera quiet` stops all sound. A theme installed alone answers to its own name, such as `/pluvia still`.
9. **Roles keep their meaning.** Danger is a red, success a green, warning an amber, and any two roles sit at least 30 degrees of hue apart, so they survive color blindness. **checked**
10. **Rank text by lightness, not hue.** Primary, secondary and muted are three steps of one hue. Eyes separate lightness far better than hue.
11. **The page is never loud.** Page chroma stays at or under 0.06, and its lightness stays in the range its contrast level allows. **checked**
12. **Sound is a signal.** The chime plays only after a turn of 20 seconds or more, when you may have looked away. It is under 1.5 seconds and soft.
13. **Music is opt in.** The bed, a quiet loop of the room's own sound, plays only for people who type `/tessera music`, and only while Claude works. Silence means the answer is ready.
14. **The spinner keeps real information.** Theme words replace only the generic "Working". When the app names the step it is on, that name stays.
15. **One SVG, both modes.** No scripts, no outside files, under 131,072 characters, colors swapped by one `prefers-color-scheme` rule. **checked**

## Character: each theme chooses

16. **A vibe in three or four words.** "Wet, quiet, late." "Raw, heavy, plain." Every other choice answers to those words.
17. **A contrast level.** Low for calm themes, standard for most, high for stark ones. Developers who choose dark themes often prefer less contrast than tools ship with, and some need far more. Both get a theme.
18. **Calm or vivid accents.** Muted accents stay at or under 0.17 chroma on a dark page. Vivid ones may reach 0.27. **checked**
19. **A tint, or none.** A neutral grey page is as valid as a tinted one.
20. **An art style.** Soft illustration, flat cut paper, thin line drawing, hard slabs, halftone dots. Pick one and hold it. A flat style uses no gradients, a soft one no hard rules.
21. **A way of moving, or stillness.** Drifting, drawing itself, sliding along a grid, pulsing along a wire. An essential theme may not move at all.
22. **Both modes, same idea.** Dark is a second telling of the idea (lamp lit paper, not inverted paper). A theme leads with the mode that suits it.
23. **Words, a chime and a bed in its own voice.** Spinner words from the theme's world, one short sound, one loop.
24. **A Latin name and a plain line.** One Latin word, its meaning, and one sentence that says what you will see.
25. **Your own art.** Take the spirit of a place, an era or a well loved theme. Never a company's logo, artwork, font or product look, and never another theme's hex values.

## What a theme cannot change

The app's fonts, its layout and its permission prompts stay the app's own. A theme works with color, the scene behind the conversation, the frosting over it, the spinner's words, code highlighting and sound.

## Where the numbers come from

Background lightness, chroma and contrast were measured on Solarized, Selenized, Gruvbox, Nord, Dracula, One Dark, Tokyo Night, Catppuccin, Rosé Pine, Everforest, Kanagawa, GitHub and Monokai. Their dark pages sit between 0.18 and 0.33 lightness and their body text between 4:1 and 16:1, most between 9:1 and 13:1. The reading and motion rules lean on Piepenbrock and colleagues on light and dark polarity, Material's dark theme guidance, the Modus themes' contrast work, Nikita Prokopov's essay on syntax highlighting, a 2022 OsloMet study on animated backgrounds, and WCAG 2.2.2.
