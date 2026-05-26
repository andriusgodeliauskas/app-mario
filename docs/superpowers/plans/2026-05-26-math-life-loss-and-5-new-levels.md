# Math life-loss + 5 new levels (10–14) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make wrong math answers cost a life (like an enemy hit), spawn math challenges 10% more often, and add 5 harder new levels (10–14) with brand-new visual motifs.

**Architecture:** Vanilla Phaser 3, no module system — scenes/utils are globals attached to `window`. Levels are hardcoded 2D tile arrays in `GameScene.getLevelNData()`. Sprites are Canvas-generated in `js/utils/sprites.js`, registered in `BootScene`. Theme config (sky color, tile tint, music) lives in data tables in `GameScene`.

**Tech Stack:** Phaser 3, vanilla JS (ES5-ish style, `var`, prototype objects), Canvas API sprites, Playwright for smoke tests, `node --check` for syntax.

**Verification:** No unit framework for scene logic; use `node --check` for syntax, a pure tilemap-validation test for level reachability, Playwright for end-to-end, and manual playtest before deploy.

---

## File Structure

- `js/entities/MathChallenge.js` — wrong-answer handler (Item 1)
- `js/scenes/GameScene.js` — `loseOnePower`, `bgColors`, `musicMap`, tile tint table, 5 new `getLevelNData`, `createDecorations` branches (Items 1 & 3)
- `js/systems/MathSpawner.js` — spawn interval constant (Item 2)
- `js/utils/sprites.js` — new decoration sprite generators (Item 3)
- `js/scenes/BootScene.js` — register new sprites (Item 3)
- `js/scenes/MenuScene.js` — 5 new cards + 5-column grid (Item 3)
- `js/scenes/WinScene.js` — final-level threshold 9 → 14 (Item 3)
- `tests/unit/levels.test.js` — NEW: tilemap reachability validation
- `deploy.sh` — confirm upload list

---

## Task 1: Math wrong answer costs a life

**Files:**
- Modify: `js/entities/MathChallenge.js` (wrong-answer handler)
- Modify: `js/scenes/GameScene.js` (`loseOnePower`, ~lines 849–891)

- [ ] **Step 1: Find the wrong-answer call in MathChallenge.js**

Run: `grep -n "loseOnePower\|source.*math\|wrong\|onWrong\|incorrect" js/entities/MathChallenge.js`
Expected: a call like `scene.loseOnePower({ source: 'math' })`.

- [ ] **Step 2: Change the wrong-answer call to use enemy rules**

In `MathChallenge.js`, change the wrong-answer branch from `{ source: 'math' }` to `{ source: 'enemy' }`. Keep the red educational popup and `mathWrong` SFX BEFORE the `loseOnePower` call.

- [ ] **Step 3: Remove the now-dead math branch in loseOnePower**

In `GameScene.js` `loseOnePower`, delete the `if (source === 'math') { ... }` block (knockback/score-penalty/2.5s invuln). Update the doc comment to: "big→small, small→death for all sources." Big-Mario branch and the final `this.playerDeath()` stay.

- [ ] **Step 4: Syntax check**

Run: `node --check js/entities/MathChallenge.js && node --check js/scenes/GameScene.js`
Expected: no output (pass).

- [ ] **Step 5: Commit**

```bash
git add js/entities/MathChallenge.js js/scenes/GameScene.js
git commit -m "feat: wrong math answer costs a life (enemy rules)"
```

---

## Task 2: Math challenges 10% more often

**Files:**
- Modify: `js/systems/MathSpawner.js:22`

- [ ] **Step 1: Change interval**

In `MathSpawner.js`, change `this.SPAWN_INTERVAL = 6000;` to `this.SPAWN_INTERVAL = 5400;` (10% more frequent).

- [ ] **Step 2: Syntax check**

Run: `node --check js/systems/MathSpawner.js`
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add js/systems/MathSpawner.js
git commit -m "feat: math challenges 10% more frequent (6000->5400ms)"
```

---

## Task 3: New decoration sprites

**Files:**
- Modify: `js/utils/sprites.js` (add generators)
- Modify: `js/scenes/BootScene.js` (register textures)

New sprite keys (pixel-art Canvas, matching existing decoration style, drawn to a Phaser texture):
- Cave: `crystal-deco`, `stalactite-deco`
- Jungle: `vine-deco`, `palm-deco`, `leaf-deco`
- Ocean: `wave-deco`, `coral-deco`, `plank-deco`
- Space: `planet-deco`, `starfield-deco`, `rocket-deco`
- Rainbow: `rainbow-arch-deco`, `sparkle-deco`

- [ ] **Step 1: Inspect an existing decoration generator for the pattern**

Run: `grep -n "generate.*Deco\|rock-deco\|flower-deco\|grass-tuft\|generateRock\|generateFlower" js/utils/sprites.js js/scenes/BootScene.js`
Read one generator (e.g. rock) to copy the canvas/texture-registration idiom.

- [ ] **Step 2: Add the 13 generators in sprites.js**

Follow the existing idiom exactly (same canvas-size, `ctx.scale`, `addOutline` if used, and the way the texture is registered). Each is a small pixel-art drawing. Group them with a comment header `// ---- New-level decorations (levels 10-14) ----`.

- [ ] **Step 3: Register them in BootScene**

Add calls mirroring how existing decorations are generated/registered in `BootScene.js`.

- [ ] **Step 4: Syntax check**

Run: `node --check js/utils/sprites.js && node --check js/scenes/BootScene.js`
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add js/utils/sprites.js js/scenes/BootScene.js
git commit -m "feat: add decoration sprites for levels 10-14"
```

---

## Task 4: Theme config + createDecorations branches

**Files:**
- Modify: `js/scenes/GameScene.js` (`bgColors` ~line 56, `musicMap` ~line 309, new `tileTint` table, tile-creation tint, `createDecorations` ~lines 1142–1235)

- [ ] **Step 1: Extend bgColors**

Add to `bgColors`: `10:'#1A1230', 11:'#0E3A1E', 12:'#2E86C1', 13:'#05050F', 14:'#FFB6E6'`.

- [ ] **Step 2: Extend musicMap**

Add: `10:'underground', 11:'overworld', 12:'overworld', 13:'castle', 14:'overworld'`.

- [ ] **Step 3: Add tileTint table + apply**

Near `bgColors`, add:
```js
var tileTint = { 10:0x9aa0c0, 11:0x7bc47b, 12:0x9ad6ff, 13:0xc8ccd8, 14:0xffd6f2 };
this._tileTint = tileTint[this.currentLevel] || null;
```
In the tile-creation loop, after each `groundTiles`/stone create, if `this._tileTint` is set, call `.setTint(this._tileTint)` on the created tile (ground id 1/2 and stone id 11). Leave brick/question/pipe untinted.

- [ ] **Step 4: Add createDecorations branches**

For each new decoration key (`decorations.crystals`, `.stalactites`, `.vines`, `.palms`, `.leaves`, `.waves`, `.corals`, `.planks`, `.planets`, `.starfields`, `.rockets`, `.rainbows`, `.sparkles`), add a render block mirroring the existing `rocks`/`fences` blocks (depth -6..-4, `setScale((d.scale||1)*0.5)`, appropriate origin). Reuse the exact loop idiom.

- [ ] **Step 5: Syntax check**

Run: `node --check js/scenes/GameScene.js`
Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add js/scenes/GameScene.js
git commit -m "feat: theme config (sky/tint/music) + decoration render for levels 10-14"
```

---

## Tasks 5–9: Level data (one task per level)

**Shared construction rules** (apply to every new level; copy from existing `getLevel9Data` idiom):
- 200-col base array (auto-extended to 300 by `getLevelData`), 19 rows, `makeRow(200, value)`.
- Ground rows 17–18 (id 11 stone or 1/2 ground per theme feel).
- Player spawns at col ~0–3 on solid ground; **first 5 cols always flat & enemy-free** (safe start).
- Flagpole id 70 near col 190; cols 195–199 cleared; end staircase (id 11) before it.
- Coins id 50, power-up `?` blocks id 4/40/41 along the path.
- **Fairness invariant:** every pit ≤ 5 cols wide AND has a reachable landing; no required vertical jump > 5 tiles; every lethal pit has at least one stone bridge (row ~12) OR a jumpable platform chain. Enemies (60/61) never within first 5 cols.
- Return `{ map, decorations }` with theme decorations populated (use the new keys from Task 3).

Tile ids reference: 1=grass,2=earth,3=brick,4=?,6–9=pipe,11=stone,40=?+mushroom,41=?+star,50=coin,60=goomba,61=koopa,70=flagpole.

### Task 5: Level 10 — CAVE (vertical climbing, narrow platforms)

**Files:** Modify `js/scenes/GameScene.js` (new `getLevel10Data`), register in `getLevelData` dispatch (already uses `'getLevel'+level+'Data'`, so no dispatch edit needed — just define the function).

- [ ] **Step 1:** Write `getLevel10Data()`: stone-walled cave, ~12 enemies, small/rare pits, many stone platforms at varying heights (rows 9–15) forming a climb. Decorations: `crystals`, `stalactites`. ~6–8 coins, 2 `?` blocks.
- [ ] **Step 2:** Syntax check: `node --check js/scenes/GameScene.js` → pass.
- [ ] **Step 3:** Commit: `git commit -am "feat: level 10 Cave"`.

### Task 6: Level 11 — JUNGLE (dense enemies + platform-hopping)

- [ ] **Step 1:** Write `getLevel11Data()`: green theme, ~16 enemies in clusters, medium pits each with landing platform, vine/palm/leaf decorations. Floating brick/`?` platforms.
- [ ] **Step 2:** Syntax check → pass.
- [ ] **Step 3:** Commit: `git commit -am "feat: level 11 Jungle"`.

### Task 7: Level 12 — OCEAN (wide gaps, plank platforms)

- [ ] **Step 1:** Write `getLevel12Data()`: water theme, ~16 enemies, wider pits (≤5 cols) crossed via short plank/stone platforms, wave/coral/plank decorations.
- [ ] **Step 2:** Syntax check → pass.
- [ ] **Step 3:** Commit: `git commit -am "feat: level 12 Ocean"`.

### Task 8: Level 13 — SPACE (precision over voids, narrow platforms)

- [ ] **Step 1:** Write `getLevel13Data()`: dark space theme, ~18 enemies, frequent narrow platforms over voids, minimal safety bridges (still ≤5-tile jumps), planet/starfield/rocket decorations.
- [ ] **Step 2:** Syntax check → pass.
- [ ] **Step 3:** Commit: `git commit -am "feat: level 13 Space"`.

### Task 9: Level 14 — RAINBOW (finale, everything combined)

- [ ] **Step 1:** Write `getLevel14Data()`: rainbow theme, ~20 enemies, longest gauntlet combining climbs + gaps + narrow platforms, widest gaps with minimal bridges (still fair), rainbow-arch/sparkle decorations, generous coins as reward.
- [ ] **Step 2:** Syntax check → pass.
- [ ] **Step 3:** Commit: `git commit -am "feat: level 14 Rainbow (finale)"`.

---

## Task 10: Tilemap reachability validation test

**Files:**
- Create: `tests/unit/levels.test.js`

- [ ] **Step 1: Write the test**

Pure Node test (no Phaser): load `GameScene.js` source, extract each `getLevelNData` is hard via require (it's a Phaser object). Instead, write a standalone validator that the level-builder will be checked against manually. Simpler: assert structural rules by instantiating the level objects is not feasible without Phaser. So this test validates the **raw map arrays** via a helper the levels export.

Pragmatic approach: add at the bottom of `GameScene.js` (guarded by `typeof module !== 'undefined'`) an export of a `validateLevelMap(map)` pure function that checks: (a) row 17/18 exist, (b) exactly one flagpole (70), (c) no horizontal pit (no ground in rows 17–18) wider than 5 cols without a stone bridge in rows 9–14 above it, (d) first 5 cols of rows 17–18 are solid. Then test each map.

If exporting from GameScene is impractical, create `js/utils/levelValidator.js` with `validateLevelMap(map)`, load it in BootScene-independent context, and unit-test it. Levels call nothing from it at runtime; it's a dev tool.

```js
// tests/unit/levels.test.js
const assert = require('assert');
const { validateLevelMap } = require('../../js/utils/levelValidator.js');
// Build sample maps mirroring level rules, assert validateLevelMap passes/fails correctly.
```

- [ ] **Step 2: Implement `js/utils/levelValidator.js`**

Pure function `validateLevelMap(map, opts)` returning `{ ok, errors[] }`. Export via `if (typeof module!=='undefined') module.exports={validateLevelMap}` and `if (typeof window!=='undefined') window.validateLevelMap=validateLevelMap`.

- [ ] **Step 3: Run test**

Run: `node tests/unit/levels.test.js`
Expected: prints PASS / exits 0.

- [ ] **Step 4: Commit**

```bash
git add tests/unit/levels.test.js js/utils/levelValidator.js
git commit -m "test: tilemap reachability validator for new levels"
```

---

## Task 11: Menu — 5 new cards + 5-column grid

**Files:**
- Modify: `js/scenes/MenuScene.js` (`levels` array ~144–153, grid loop ~155–171)

- [ ] **Step 1: Add 5 level entries**

Append to `levels`:
```js
{ num: 10, name: 'CAVE',    lt: 'Ola',         color: 0x5A4A7A, icon: 'tiles' },
{ num: 11, name: 'JUNGLE',  lt: 'Dziungles',   color: 0x1B7A1B, icon: 'hill' },
{ num: 12, name: 'OCEAN',   lt: 'Vandenynas',  color: 0x2E86C1, icon: 'cloud' },
{ num: 13, name: 'SPACE',   lt: 'Kosmosas',    color: 0x202840, icon: 'tiles' },
{ num: 14, name: 'RAINBOW', lt: 'Vaivorykste', color: 0xFF6FB5, icon: 'cloud' }
```

- [ ] **Step 2: Switch grid to 5 columns**

Change `var col = i % 3;` → `i % 5;`, `var row = Math.floor(i / 3);` → `Math.floor(i / 5);`, and `startX = W / 2 - (cardW * 3 + gapX * 2) / 2;` → `W / 2 - (cardW * 5 + gapX * 4) / 2;`. Keep cardW=130, cardH=95 (5×130+4×15=710<800; 3 rows end at 480<600).

- [ ] **Step 3: Syntax check + visual sanity**

Run: `node --check js/scenes/MenuScene.js`
Expected: pass. (Visual confirmed in manual playtest, Task 13.)

- [ ] **Step 4: Commit**

```bash
git add js/scenes/MenuScene.js
git commit -m "feat: menu shows 14 levels in 5-column grid"
```

---

## Task 12: WinScene — final threshold 9 → 14

**Files:**
- Modify: `js/scenes/WinScene.js` (`playerLevel >= 9` ~line 39, `unlockLevel(9)` ~line 522)

- [ ] **Step 1: Update final-level check**

Change `if (this.playerLevel >= 9)` → `>= 14`. This makes the princess/final screen show only after level 14; levels 1–13 show the normal "next level" complete screen.

- [ ] **Step 2: Update unlock call**

Change the final `unlockLevel(9)` to `unlockLevel(14)`. Verify intermediate completion still unlocks `level+1` (check the normal-complete path ~line 226 `unlock next level`).

- [ ] **Step 3: Syntax check**

Run: `node --check js/scenes/WinScene.js`
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add js/scenes/WinScene.js
git commit -m "feat: final victory after level 14, unlock chain to 14"
```

---

## Task 13: Verification + deploy

**Files:** none (verification), then `deploy.sh`

- [ ] **Step 1: All syntax checks**

Run: `for f in js/scenes/*.js js/utils/*.js js/systems/*.js js/entities/*.js; do node --check "$f" || echo "FAIL $f"; done`
Expected: no FAIL lines.

- [ ] **Step 2: Level validator over all new maps**

Run: `node tests/unit/levels.test.js`
Expected: PASS.

- [ ] **Step 3: Playwright smoke (if env available)**

Run the existing/updated Playwright suite against a local server. Confirm: each of levels 10–14 loads without console error; math wrong answer decrements lives; menu shows 14 cards.

- [ ] **Step 4: Manual playtest**

Serve locally, play each new level start→flagpole, confirm reachability and decorations render. Fix any unreachable section in the relevant `getLevelNData`.

- [ ] **Step 5: Code review**

Dispatch code-review of the full diff (correctness, reachability, regressions in math/lives).

- [ ] **Step 6: Deploy**

Confirm `deploy.sh` upload list includes all modified files (GameScene, sprites, BootScene, MenuScene, WinScene, MathSpawner, MathChallenge, levelValidator). Then:
Run: `bash deploy.sh`
Expected: FTP upload success. Verify live at https://mario.godeliauskas.com.

- [ ] **Step 7: Final commit + push**

```bash
git add -A -- js docs tests deploy.sh
git commit -m "feat: 5 new levels (10-14) + math life-loss + faster math spawns"
git push origin main
```

---

## Self-Review

- **Spec coverage:** Item 1 → Task 1. Item 2 → Task 2. Item 3 (sprites → T3, theme/tint/music → T4, levels → T5–9, validation → T10, menu → T11, win/unlock → T12, deploy → T13). All spec sections covered.
- **Type consistency:** decoration keys in Task 3 (sprite gen) match Task 4 (render branches) match Tasks 5–9 (level decorations). `tileTint`/`bgColors`/`musicMap` keys 10–14 consistent. `validateLevelMap` name consistent T10/T13.
- **Placeholders:** level layouts are specified by construction rules + per-level difficulty params rather than full 100-line arrays — acceptable because execution is inline this session, not handed to a zero-context engineer; the fairness invariant + validator (T10) enforce correctness.
