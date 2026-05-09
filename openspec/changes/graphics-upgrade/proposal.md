# Graphics Upgrade: 4x Resolution + Enhanced Sprite Quality

## Problem
Current sprites are at 2x resolution (64x64 for characters, drawn via ctx.scale(2,2) from 32x32 logical coordinates). The visual quality is acceptable but can be significantly improved with higher resolution and more detailed artwork.

## Goals
- Upgrade all sprites to **4x resolution** (128x128 for characters, 64x64 for tiles)
- Add more visual detail: better gradients, sub-pixel shading, more shape complexity
- Maintain the same game mechanics (physics bodies unchanged)
- Keep all sprites programmatically generated via Canvas API (no external images)
- Maintain performance on mobile devices

## Non-goals
- Changing game mechanics or level layout
- Adding new sprite types
- Changing animation frame counts
- Modifying the physics system

## Scope
- `js/utils/sprites.js` — 20 sprite generators, all need 4x upgrade
- `js/scenes/GameScene.js` — update setScale from 0.5 to 0.25 for all scaled sprites
- `js/scenes/BootScene.js` — no changes needed (animation definitions are frame-based)

## Risk
- Performance: 4x sprites use 4x more canvas memory. Mitigate by keeping sprite sheets compact.
- Visual consistency: Each agent upgrades independently. Mitigate with shared color palette.
