# app-mario — Wonder V4: rooms 44–53 (10 new rooms)

Source: user's "SUPER MARIO WONDER (V4 ULTIMATE)" game design document.

## Renderer decision (read this first)

The GDD specifies **Three.js with PBR, volumetric clouds, bloom and refraction**.
We are **not** doing that, and the reason is measured, not aesthetic:

- The game is Phaser 3 with all art generated via the Canvas API. Three.js would
  mean a second renderer and, realistically, a rewrite.
- Level 43's runner scene dropped to **6 fps on this project's own test rig** with
  nothing but 2D graphics, and the child reported the game running in slow motion.
  PBR + bloom on the same phone is not a risk worth taking for a 6-year-old's game.

**What we do instead:** implement every *mechanic* in the GDD faithfully, and
approximate the *look* with 2D techniques. The concrete, codeable rules for that
live in **`docs/ART-wonder-v4.md`**, derived from reference screenshots the user
supplied. If real 3D is wanted later it is a separate project.

## Architecture

Levels 44–48 run in a **new `WonderScene`** (side-scrolling, like GameScene) —
NOT in GameScene. Levels 1–42 must not be touched; level 43 keeps RunnerScene.
Routing reuses the existing mechanism: `theme.scene` on the level's entry in
`js/data/themes-ext.js`, defaulting to `'GameScene'`.

Level layouts live in `js/data/levels-44-48.js` via `window.LEVEL_GENERATORS`,
same as levels 20–42.

## New physics systems (shared, in WonderScene)

**Water.** A per-level `waterLevel` Y. Below it:
- gravity reduced ~60%, fall speed capped (~150 px/s)
- horizontal friction `vx *= 0.92`
- jump becomes a swim stroke (`vy = -350`) that works repeatedly, not only on ground
- splash effect when crossing the surface in either direction
- bubbles on each stroke; coins underwater bob with a larger amplitude
- a visible surface line with a refraction-style offset band

**Segmented platforms.** Chains of linked segments; each segment follows the one
before it with a small time offset, `y = startY + sin(t * speed + offset) * 20`.
Solid to stand on, and they carry the player.

**Dissolving clouds.** Standing on a cloud edge shrinks it to zero over ~2s, then
it respawns after a delay. Must telegraph clearly (wobble + fade) so a child sees
it coming.

**Bouncers.** Mushroom caps: on contact `vy` inverts and is multiplied by 1.2,
capped so it never launches off-screen.

**Rubber blocks.** 3x3 blocks that compress on landing (Hooke-style) and launch
the player upward.

**Gravity flip / wall running** (room 48 only): the "Wonder effect". Gravity axis
changes; collect 5 keys to open the boss door.

**Ice friction** (49), **lateral wind + sinking sand** (50), **rotating gear
platforms** (51), **magnetic attract/repel** (52), **mirrored twin** (53) — one
signature system per room, each introduced gently before it is required.

## Arithmetic stays in every room

This is an educational game first. Every Wonder room keeps the existing maths
challenge — reuse `window.MathSpawner` with `window.MathSettings.load()`, exactly
as `GameScene` does:

```js
if (window.MathSpawner && window.MathSettings) {
    this.mathSettings = window.MathSettings.load();
    this.mathSpawner = new window.MathSpawner(this, this.mathSettings);
}
```

Call `mathSpawner.update(time, delta)` each frame and `destroy()` on shutdown.
It must respect the player's SettingsScene choices (which operations, which max)
and must be skipped cleanly when maths is disabled.

## The ten rooms

Rooms 44–48 come from the GDD. Rooms 49–53 extend it in the same spirit: each
Wonder room is built around ONE signature mechanic a 6-year-old can understand
within seconds of seeing it.

| # | Room | Look | Signature mechanic |
|---|------|------|--------------------|
| 44 | Wonder Plains | diamond-patterned green grass, bright blue sky | yellow 3x3 rubber blocks |
| 45 | Fluff-Puff Peaks | giant soft clouds, pale translucent sky, no solid ground | segmented wobbling platforms + dissolving cloud edges |
| 46 | Bioluminescent Forest | night, cyan/green glowing plants, dark geometric ground | glowing mushroom-cap bouncers; enemies from yellow pots |
| 47 | Pastel Depths | split air/water, refracting surface, violet rounded rocks | full water physics |
| 48 | Neon Underground | black, strong purple/pink neon | gravity flip, wall climbing, 5 keys → boss door |
| 49 | Ice Slide | pale blue ice, frost sparkle | near-frictionless ground; momentum carries, stopping takes planning |
| 50 | Wind Dunes | warm sand, dust haze, low sun | constant lateral wind pushes the player; patches of sinking sand |
| 51 | Clockwork Gears | brass and copper, ticking background | rotating gear platforms; timing-based hops |
| 52 | Magnet Caves | dark rock with red/blue glow | polarity switch attracts or repels metal blocks and rails |
| 53 | Mirror Hall | symmetrical pastel halls, reflective floor | a mirrored twin copies the player's moves inverted; both must reach the exit |

Palette from the GDD: `#10B981` grass, `#FFFFFF` clouds, `#2DD4BF` forest neon,
`#818CF8` water base, `#C084FC` coral rock.

## Non-negotiables

- Levels 1–43 unchanged; regression-tested every wave.
- Child-design rules from `/workspace/child/CLAUDE.md`: readable, bright, forgiving.
- Mobile landscape, `--gesture-inset`, HUD/lives/score/quit all keep working.
- All art generated in code. No external assets.
- **Performance gate:** WonderScene must measure no worse than GameScene on the
  same rig (fps and median frame time). This is a hard gate — level 43 taught us
  that pretty is worthless if the frame rate collapses.
- `deploy.sh` uploads a hardcoded file list; every new file must be added to it.

## Waves

1. `WonderScene` foundation + water + segmented platforms + rubber blocks + maths
   integration; rooms 44, 45.
2. Rooms 46, 47, 48 (bouncers, full water level, gravity flip + keys + boss door).
3. Rooms 49–53 (ice, wind/sand, gears, magnets, mirror twin).
4. Art polish, performance measurement, menu/progression to 53.

Each wave is regression-tested against levels 1–43 before the next starts.
