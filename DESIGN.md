# How a Tessera theme is designed

People read in these themes for hours. A theme earns its place by being comfortable first and pretty second. These rules come from measuring 19 terminal and editor themes people choose to live in, and from reading research. `bun scripts/check.ts` enforces the ones marked **checked**.

## Colors

1. **No black, no white.** A dark page (`surface-0`) sits at OKLCH lightness 0.20 to 0.30. A light page sits at 0.93 to 0.98. Popular dark themes cluster near 0.27. **checked**
2. **Tint every neutral.** Take all surfaces and text from one hue, with chroma between 0.005 and 0.05 on the page. Grey with no hue looks dead, and more chroma than that tires the eye. **checked**
3. **Body text contrast between 9:1 and 14:1.** The floor for any text level on any surface is 7:1 for `text-primary`. Above 14:1 on a dark page, text starts to glare. Most loved themes land at 9 to 13. **checked**
4. **Muted text stays readable: 4.5:1 or better** on `surface-0` and `surface-2`. Terminal themes often drop comments under 3:1, and that is their most common complaint. Here muted text carries tool summaries and timestamps. **checked**
5. **Rank text by lightness, not hue.** Primary, secondary and muted are three steps of the same hue. Eyes separate lightness far better than hue.
6. **Surfaces sit close together.** Each surface is a few percent of lightness from the next, so a card reads as paper on paper.
7. **Roles keep their meaning.** Danger is a red, success a green, warning an amber. Tune them toward the theme, and keep at least 30 degrees of hue between any two roles so they survive color blindness and never read as the same color. **checked**
8. **Mute accents on dark.** Saturated color on a dark page vibrates. Keep role chroma at or under 0.17 in dark mode. **checked**
9. **Both modes, same idea.** Dark is a second telling of the idea (lamp-lit paper, not inverted paper). Keep the same lightness steps between text levels in both, so contrast feels the same after a switch.

## The scene behind the text

10. **Still while you read.** A scene moves only while Claude is working. When the answer lands, the scene stops. A reading study found animated backgrounds slow reading, and nobody reads while the spinner runs.
11. **The middle stays quiet.** Detail and motion live at the edges and corners. The center column, where the words are, holds only soft gradients. Nothing sits at the foot, where the message box is.
12. **Readable over the worst pixel.** With the glass over it, `text-primary` keeps 7:1 and `text-muted` keeps 4.5:1 over the brightest and the darkest point of the scene, at six moments of its animation. **checked**
13. **Low contrast inside the scene.** No scene element differs from the page by more than 1.6:1 in the center half of the frame. Fine sharp texture behind text crowds the letters. **checked**
14. **Slow and small.** Nothing flashes. No element blinks faster than once in two seconds. Large shapes take eight seconds or more per cycle.
15. **Reduced motion means none.** Every scene has a `prefers-reduced-motion` rule that stops all animation. **checked**
16. **One switch turns it off.** `/tessera still` stops motion for good and `/tessera quiet` stops sound. A theme installed alone answers to its own name, such as `/pluvia still`. Motion longer than five seconds needs an off switch people can find.
17. **One SVG, both modes.** Colors are CSS variables, swapped by exactly `@media (prefers-color-scheme:dark)`. No scripts, no outside files, under 131,072 characters. **checked**

## Sound

18. **Sound is a signal, not decoration.** The chime plays only when a turn took 20 seconds or longer, the point where you may have looked away. Short turns stay silent.
19. **Short and soft.** Under 1.5 seconds, gain 0.5 or lower, no sharp attack.

## Words

20. **The spinner keeps real information.** Theme words replace only the generic "Working". When the app names the step it is on, that name stays.

## Names and art

21. **Your own art.** Take the spirit of a place or an era. Never a company's logo, artwork, font or product look.
22. **A Latin name and a plain line.** One Latin word, its meaning, and one sentence that says what you will see.

## Where the numbers come from

Background lightness, chroma and contrast were measured on Solarized, Selenized, Gruvbox, Nord, Dracula, One Dark, Tokyo Night, Catppuccin, Rosé Pine, Everforest, Kanagawa, GitHub and Monokai. The reading and motion rules lean on Piepenbrock and colleagues on light and dark polarity, Material's dark theme guidance, the Modus themes' contrast work, Nikita Prokopov's (tonsky) essay on syntax highlighting, a 2022 OsloMet study on animated backgrounds, and WCAG 2.2.2.
