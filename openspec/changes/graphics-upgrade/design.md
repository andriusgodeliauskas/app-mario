# Design: Graphics Upgrade

## Architecture

### Resolution Strategy
- Current: `ctx.scale(2, 2)` with 64x64 canvas → setScale(0.5) in game
- Target: `ctx.scale(4, 4)` with 128x128 canvas → setScale(0.25) in game
- Tiles: Current 32x32 → Target 64x64, no game scale (tiles don't use setScale)
- Decorations: Scale proportionally (flower 16→32, grass 16→24, etc.)

### Drawing Approach
All sprites keep the same 32x32 (or equivalent) logical coordinate space.
The `ctx.scale(4, 4)` multiplier provides 4x more resolution for curves, gradients, and details.
Each generator function's `drawXxx()` inner function stays at the same coordinate system.

### What Changes Per Sprite
1. Canvas size: multiply by 2 (since current is already 2x, going to 4x)
2. `ctx.scale(2, 2)` → `ctx.scale(4, 4)` in each draw function
3. `frameWidth/frameHeight` values doubled
4. For tiles: `var T = 32` → `var T = 64`
5. In GameScene.js: `setScale(0.5)` → `setScale(0.25)` for characters
6. In GameScene.js: Tile placement stays at 32px grid, but tile sprites render at 64x64

### Physics Body Adjustments
After going to 4x, physics body values must be updated again:
- setSize values doubled again (since texture doubles)
- setOffset values doubled again
- Example: Mario setSize(48, 60) → setSize(96, 120), setOffset(8, 4) → setOffset(16, 8)

### Tile System Special Handling
Tiles are unique: they're placed on a 32px grid with `gt.setSize(TILE, TILE).refreshBody()`.
With 4x tiles (64x64), each tile sprite is 64x64 but represents a 32x32 game tile.
Options:
- **Option A**: Keep TILE=32, tiles at 64x64 with setScale(0.5) ← simplest, consistent with characters
- **Option B**: Change all tile positioning ← invasive, risky

**Decision: Option A** — tile sprites become 64x64, use setScale(0.5) in placement, physics body stays TILE×TILE.

### Parallel Work Split
Work is split into 5 independent agents (each modifies only its section of sprites.js):

| Agent | Sprites | Lines in sprites.js |
|-------|---------|-------------------|
| 1. Characters | Mario, Big Mario | 181-520 |
| 2. Tiles + Environment | Tiles, Cloud, Hill, Bush, Deco | 525-988, 1670-2350 |
| 3. Enemies | Goomba, Koopa, Bowser | 1059-1178, 1179-1335, 1916-2081 |
| 4. Collectibles | Coin, Mushroom, Star, Fireball | 989-1058, 1336-1413, 1414-1484, 1854-1915 |
| 5. Special | Flagpole, Princess | 1485-1550, 1551-1669 |

### Color Palette (shared)
All agents MUST use the existing color constants `C.xxx` defined at lines 103-176 of sprites.js.
