# Tasks: Graphics Upgrade to 4x Resolution

## Phase 1: Character Sprites (Agent 1)
- [ ] 1.1 Upgrade generateMario(): canvas 128x128, ctx.scale(4,4), frameW=128, frameH=128
- [ ] 1.2 Upgrade generateBigMario(): canvas 128x256, ctx.scale(4,4), frameW=128, frameH=256
- [ ] 1.3 Add more visual detail to Mario: better gradients, smoother hat curves, richer face detail
- [ ] 1.4 Add more visual detail to Big Mario: 'M' emblem, belt buckle, more shirt folds

## Phase 2: Tiles + Environment (Agent 2)
- [ ] 2.1 Upgrade generateTiles(): T=64, canvas 64x16=1024 wide, each tile 64x64 internally
- [ ] 2.2 Add tile detail: brick mortar depth, grass blade variations, pipe reflections
- [ ] 2.3 Upgrade generateCloud(): w=128, h=64
- [ ] 2.4 Upgrade generateHill(): w=256, h=128
- [ ] 2.5 Upgrade generateBush(): w=128, h=64
- [ ] 2.6 Upgrade deco sprites (flower 32x32, grass 32x24, mushroom-deco 24x24, rock 48x32, fence 64x48)

## Phase 3: Enemy Sprites (Agent 3)
- [ ] 3.1 Upgrade generateGoomba(): canvas 128x128, ctx.scale(4,4)
- [ ] 3.2 Upgrade generateKoopa(): canvas 128x192, ctx.scale(4,4)
- [ ] 3.3 Upgrade generateBowser(): canvas 256x256, ctx.scale(4,4)
- [ ] 3.4 Add enemy detail: Goomba angry eyebrows, Koopa shell pattern, Bowser fire breath

## Phase 4: Collectibles + Power-ups (Agent 4)
- [ ] 4.1 Upgrade generateCoin(): canvas 64x64, ctx.scale(4,4), frameW=64, frameH=64
- [ ] 4.2 Upgrade generateMushroom(): canvas 128x128, ctx.scale(4,4)
- [ ] 4.3 Upgrade generateStar(): canvas 128x128, ctx.scale(4,4)
- [ ] 4.4 Upgrade generateFireball(): canvas 64x64, ctx.scale(4,4)
- [ ] 4.5 Add collectible detail: coin rim detail, mushroom spots, star sparkle, fireball glow

## Phase 5: Special Sprites (Agent 5)
- [ ] 5.1 Upgrade generateFlagpole(): w=32, h=384
- [ ] 5.2 Upgrade generatePrincess(): canvas 128x256, ctx.scale(4,4)
- [ ] 5.3 Add princess detail: tiara gems, dress ruffles, hair gradient

## Phase 6: GameScene.js Updates
- [ ] 6.1 Update all setScale(0.5) → setScale(0.25) for character/enemy/collectible sprites
- [ ] 6.2 Update tile placement to use setScale(0.5) for 64x64 tiles on 32px grid
- [ ] 6.3 Update physics body sizes: double all setSize/setOffset values again
- [ ] 6.4 Update decoration placement scales

## Phase 7: Verification
- [ ] 7.1 Run syntax check on all modified JS files
- [ ] 7.2 Deploy and test in browser — verify all sprites render correctly
- [ ] 7.3 Verify Mario stands ON blocks (not inside them)
- [ ] 7.4 Test all 4 levels
- [ ] 7.5 Test on mobile (touch controls, performance)
