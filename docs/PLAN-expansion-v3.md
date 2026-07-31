# app-mario — Expansion v3 Plan

Two deliverables:
**A.** 23 new themed levels (20–42) + refresh of 4 existing themes.
**B.** Mobile: landscape-only play with a "rotate your phone" overlay in portrait.

Target audience: 6–7 year olds. Lithuanian UI, English-learning popups.
All sprites are generated programmatically (Canvas API in `js/utils/sprites.js`) —
**no external image assets**.

---

## 0. Current state (do not break)

- 19 levels, `GameScene.getLevelData(level)` dispatches to `getLevel<N>Data()`.
- Every map is post-processed by `extendMapTo300`, `injectBonusPipe`,
  `injectPowerups`, `_unstackBlocks`.
- Tilemap: 300 cols × 19 rows, `TILE = 32`. Rows 0–10 sky, 11 coins,
  12 floating platforms, 17–18 ground.
- Tile IDs: `1`=grass `2`=earth `3`=brick `4`=? `6-9`=pipe `11`=stone
  `12`/`13`/`44`=solid variants `40-43`=special ? blocks (42=fire flower, 43=1-UP)
  `50`=coin `60`=goomba `61`=koopa `70`=flagpole.
- Boss levels: 5, 10, 15, 19 (`BOSS_LEVELS` in `injectPowerups`).
- Per-level `bgColors` + `tileTint` maps live inline in `GameScene.create`.
- `MenuScene` has a hardcoded `levels` array + a 5-column grid sized for 19 entries.
- Sequential cookie-based unlock.

---

## Phase 0 — Theme system refactor (do this FIRST)

Adding 23 levels by copy-pasting the current inline pattern is unmaintainable.
Extract a data-driven theme layer:

Create `js/data/themes.js` exporting `window.LEVEL_THEMES` — one entry per level:

```js
{
  num: 20,
  name: 'GARDEN', lt: 'Sodas',
  bg: '#8FD98F',            // camera background
  tint: 0x9ee89e,           // ground/stone tile tint
  menuColor: 0x30A030,
  icon: 'hill',             // MenuScene icon key
  decorSet: 'garden',       // key into SpriteGenerator decoration sets
  words: ['flower','tree','bee','garden','seed','water','grow','leaf'],
  music: 'overworld'        // existing audio.js track key
}
```

Then:
1. `GameScene.create` reads `bg`/`tint` from `LEVEL_THEMES` instead of the inline maps
   (keep the inline maps as fallback for levels 1–19 until migrated, then delete them).
2. `MenuScene.levels` is generated from `LEVEL_THEMES`.
3. `english.js` gains `getWordsForLevel(n)` backed by `theme.words`, falling back to
   the existing global pool. Keep the anti-repeat logic.
4. Add `js/data/themes.js` to `index.html` **before** `js/scenes/*`.

Also extract map building: add a `buildThemedMap(opts)` helper in a new
`js/utils/levelBuilder.js` so each new level's `getLevel<N>Data` is ~30 lines
(sections of terrain + hazards + reward pockets) rather than a hand-typed 300-col array.
It must produce maps that pass `window.validateLevelMap` (`js/utils/levelValidator.js`).

**Gate:** levels 1–19 must still load and be completable after this refactor.
Run the existing Playwright tests before moving on.

---

## Phase 1 — Mobile landscape + rotate overlay (independent, do in parallel)

1. `index.html`: add `<div id="rotate-overlay">` with a rotating-phone icon
   (pure CSS/SVG, no external assets) and Lithuanian text
   **„Pasuk telefoną 🔄"** / sub-line „Žaidimas veikia gulsčiai".
2. `css/style.css`:
   - Show the overlay only on touch devices in portrait:
     `@media (orientation: portrait) and (pointer: coarse)` → `display:flex`,
     full-viewport, above the canvas and above `#touch-controls`.
   - Landscape on phones: `#game-container` fills `100dvh`, no page scroll,
     `body { overflow: hidden; overscroll-behavior: none; }`.
   - Enlarge touch buttons in landscape (min 64px hit target, safe-area insets via
     `env(safe-area-inset-*)` so notches don't cover D-pad / JUMP).
3. `js/utils/touch.js`: on `orientationchange`/`resize`, clear all held touch state
   (otherwise a button stays "stuck" after rotation) and call `game.scale.refresh()`.
4. `js/config.js`: keep `Phaser.Scale.FIT` + `CENTER_BOTH`; add
   `scale.min`/`scale.max` so the canvas scales sanely on tall/short phones.
5. When the overlay is visible, pause the game (`scene.pause('GameScene')`) and
   resume on return to landscape.

**Verify:** Playwright with a phone viewport, both orientations — overlay appears in
portrait, disappears in landscape, controls work after rotating.

---

## Phase 2 — Levels 20–32 (user's requested themes)

| # | Theme | LT | Notes |
|---|-------|-----|-------|
| 20 | GARDEN | Sodas | flowers, hedges, watering cans, bees as flying hazards |
| 21 | SHIP | Laivas | deck planks, masts/sails, sea bg, gulls, crates; rocking platforms |
| 22 | SCHOOL | Mokykla | blackboards, desks, books as platforms, chalk-dust particles |
| 23 | KINDERGARTEN | Darželis | building blocks, toy blocks as bricks, plush enemies, crayon colors |
| 24 | SUPERMARKET | Supermarketas | shelves as platforms, shopping carts, fruit/veg pickups |
| 25 | COUNTRIES | Šalys | world tour: flags + landmark silhouettes (Eiffel, pyramid, Big Ben, Gediminas tower) |
| 26 | METRO | Metro | tunnels, rails, train cars, platform edges, station tiles |
| 27 | WATER PARK | Vandens parkas | slides (steep ramps), pools, splash effects, floating rings |
| 28 | POOP DEMONS | Kakos demonai | **BOSS LEVEL** — silly poop-shaped enemies, brown/green palette, "stink cloud" hazard. Keep it goofy-funny and child-appropriate, no gross-out detail |
| 29 | DEEP SPACE | Kosmosas 2 | refreshed space: planets, asteroids, low-gravity section |
| 30 | DEEP FOREST | Miškas 2 | refreshed forest: tall pines, fireflies, mushrooms |
| 31 | LOST JUNGLE | Džiunglės 2 | refreshed jungle: vines, temple ruins, swinging platforms |
| 32 | DEEP UNDERGROUND | Požemis 2 | **BOSS LEVEL** — refreshed underground: crystals, lava veins, minecart rails |

Also **refresh the existing** levels 2 (Underground), 6 (Forest), 11 (Jungle),
13 (Space): richer themed decorations + a distinct `words` set, no geometry changes
that would break existing progress.

---

## Phase 3 — Levels 33–42 (10 additional proposed themes)

| # | Theme | LT | Hook |
|---|-------|-----|------|
| 33 | ZOO | Zoologijos sodas | cages, animal silhouettes, animal English words |
| 34 | CIRCUS | Cirkas | tents, trampolines (bounce pads), clowns, tightropes |
| 35 | FARM | Ūkis | **BOSS** — barns, hay bales, tractors, farm-animal words |
| 36 | DINO LAND | Dinozaurai | volcanoes, ferns, dino enemies, fossil blocks |
| 37 | PIRATE ISLAND | Piratų sala | palm trees, treasure chests, cannons, plank bridges |
| 38 | ROBOT FACTORY | Robotų fabrikas | conveyor belts (moving floors), gears, sparks |
| 39 | HOSPITAL | Ligoninė | corridors, beds, bandage/medicine words, gentle theme |
| 40 | STADIUM | Stadionas | tracks, goals, balls as rolling hazards, sports words |
| 41 | AIRPORT | Oro uostas | runways, planes, luggage belts, travel words |
| 42 | HAUNTED HOUSE | Vaiduoklių namas | **FINAL BOSS** — friendly-spooky ghosts, candles, creaky floors |

New boss levels: **28, 35, 42** (add to `BOSS_LEVELS`; level 19 stops being final).
Each boss reuses the existing `Boss.js` pattern with a themed sprite + tuned HP.

---

## Phase 4 — Menu, progression, win screen

- `MenuScene`: 42 levels no longer fit one screen. Implement **world pages** —
  group into worlds of ~7 levels with left/right page arrows (touch + keyboard),
  showing world name and lock state. Keep the existing unlock cookie format;
  extend it to 42.
- `WinScene`: "next level" flow must handle 42; final celebration moves to level 42.
- `SettingsScene`: add a level-select/unlock-all dev toggle if one doesn't exist.
- Verify `test-unlockall.js` still works.

---

## Phase 5 — Sprites & audio

- `js/utils/sprites.js`: add themed decoration sets and enemy variants for every new
  theme. Follow the existing **4x resolution** convention (`ctx.scale(4,4)` for scaled
  sprites, doubled canvas/frame sizes, `setScale(0.25)` for characters,
  `setScale(0.5)` for tiles). Physics body `setSize`/`setOffset` values must be
  doubled relative to logical size — see the Sprite Scale Reference in CLAUDE.md.
- `js/utils/audio.js`: reuse existing tracks; map each theme to the closest-fitting
  one via `theme.music`. Only add new tracks if a theme clearly needs it.

---

## Phase 6 — Testing (required, not optional)

1. `node --check` on every JS file.
2. `window.validateLevelMap` on **all 42** maps — no unreachable ? blocks,
   no impossible gaps (max jump ≈ 169px ≈ 5.3 tiles), a flagpole present,
   spawn point clear.
3. Playwright: a smoke test per new level (boot → load level N → player spawns →
   move right → no console errors), plus a completion test for at least the
   boss levels.
4. Mobile test: phone viewport in both orientations (Phase 1 checks).
5. Regression: existing `test-game.js`, `test-4x.js`, `test-expansion.js`,
   `test-new-levels.js`, `test-math-feature.js`, `test-koopa-patrol.js` must pass.

**No phase is "done" until its tests actually run and pass — paste the output.**

---

## Phase 7 — Deploy

`cd /workspace/child/app-mario && bash deploy.sh` (FTP → mario.godeliauskas.com).
Only after Phase 6 is green, and only when the user asks.
