# Wonder V4 — art direction

Derived from reference screenshots of *Super Mario Bros. Wonder* supplied by the
user (snow/night level, beach/wave level). These are **rules for our own
generated art**, not an instruction to copy Nintendo's assets — everything here
is drawn procedurally with the Canvas API, as the rest of this game already is.

## The single biggest change

Our current art is **flat fills with hard edges**. The reference is **soft,
rounded and shaded**. Almost all of the perceived quality gap comes from four
things, in this order of impact:

1. **Every shape is shaded, not flat.** A lighter top and a darker underside on
   the same shape. One vertical `createLinearGradient` per object does most of
   the work.
2. **Silhouettes are rounded and chunky.** No sharp 90° corners on natural forms.
   Use `arc`/`quadraticCurveTo`, generous corner radii, and thick soft outlines
   rather than 1px lines.
3. **Backgrounds are layered, not a single colour.** 3–4 parallax layers, each
   drifting at a different rate, each softer and lower-contrast than the one in
   front.
4. **Skies are gradients.** Never a flat fill. Two or three stops minimum.

## Layer recipe

| Layer | Scroll factor | Content | Contrast |
|---|---|---|---|
| Sky | 0 | vertical gradient, optional stars/sun glow | lowest |
| Far | 0.15 | giant soft rounded masses (snow drifts, clouds, waves, hills) | low, desaturated toward sky colour |
| Mid | 0.4 | smaller shapes of the same family, slightly darker | medium |
| Near/deco | 0.7–1.0 | fences, posts, ropes, plants, crystals | highest, crisp |
| Play layer | 1.0 | terrain, blocks, enemies, player | maximum contrast — must always read first |

**Rule:** nothing in a background layer may be as saturated or as high-contrast
as the play layer. If the child cannot instantly tell what is standable, the
background is too loud. This is the trap we already hit once on level 43 with the
full-width speed bars.

## Terrain

- Build ground from **horizontal strata**: 3–5 bands of related tones (cream →
  tan → deeper sand), each band's boundary a gentle wave, not a straight line.
- Cap the top with a distinct **lip** (grass, snow) that overhangs slightly and
  has its own highlight.
- Round the outer corners of terrain blocks generously.
- Scatter small repeated detail marks (pebbles, cracks) sparsely — the reference
  uses very few, evenly spaced.

## Objects

- **Blocks/crystals:** rounded square, inner facet lighter than the frame, plus a
  soft outer glow (draw the shape 2–3 times at increasing size and decreasing
  alpha before the solid shape).
- **Coins:** chunky ovals with a bright rim, a darker inner ring, and a specular
  highlight — not flat discs.
- **Ropes/chains/fences:** thin connective elements strung between posts add a
  lot of "designed world" for very little cost. Use them.
- **Ice/water:** translucent turquoise with a few lighter faceted polygons inside
  and a bright top edge.

## Atmosphere

- A light particle layer sells the biome cheaply: snow, mist, spray, fireflies,
  bubbles. Keep counts low (tens, not hundreds) and pool the sprites.
- Waterfalls/mist: a soft vertical gradient band plus a cluster of overlapping
  low-alpha circles at the base.

## Palette discipline

Per room, pick **one dominant hue family** and one accent. The snow reference is
purple/blue with pale cyan accents; the beach reference is cyan/sand with green
accents. Avoid using more than two saturated hues in the play layer.

GDD palette: `#10B981` grass, `#FFFFFF` cloud, `#2DD4BF` forest neon,
`#818CF8` water base, `#C084FC` coral rock.

## Cost discipline — non-negotiable

Level 43 dropped to 6fps because it rebuilt `Graphics` paths every frame, and the
child experienced it as "the buttons don't work".

- Bake every static layer **once** into a texture / `RenderTexture` at create
  time. Never re-tessellate paths per frame.
- Parallax = moving a baked image's `tilePositionX` or `x`, nothing more.
- Pool particles and decorations; cull off-screen.
- Gradients and glows are drawn **into the baked texture**, not live.
- The performance gate stands: a Wonder room must measure no worse than
  `GameScene` level 1 on the same rig.
