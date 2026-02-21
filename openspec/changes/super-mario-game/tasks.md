## 1. Project Setup

- [ ] 1.1 Create project file structure (index.html, js/, assets/, css/ directories)
- [ ] 1.2 Setup index.html with Phaser 3 CDN, viewport meta, basic HTML structure
- [ ] 1.3 Create Phaser game config (800x600, Arcade physics, scale FIT)
- [ ] 1.4 Create deploy.sh FTP script for mario.godeliauskas.com
- [ ] 1.5 Create .htaccess with HTTPS redirect
- [ ] 1.6 Create .gitignore (deploy.sh, .env)

## 2. Visual Design Mockup

- [ ] 2.1 Create static HTML/CSS mockup showing game screen layout, HUD, menu
- [ ] 2.2 Get user approval on visual design before proceeding

## 3. Asset Generation

- [ ] 3.1 Generate Mario sprite sheet (idle, run, jump, death, big/small states) via Canvas
- [ ] 3.2 Generate tileset sprites (ground, bricks, ? blocks, pipes, coins) via Canvas
- [ ] 3.3 Generate enemy sprites (Goomba walk/squish, Koopa walk/shell) via Canvas
- [ ] 3.4 Generate background elements (clouds, hills, bushes, sky gradients) via Canvas
- [ ] 3.5 Generate power-up sprites (mushroom, star) via Canvas
- [ ] 3.6 Generate princess sprite via Canvas

## 4. Scene System

- [ ] 4.1 Create BootScene — load all assets
- [ ] 4.2 Create MenuScene — title screen with "Start" button, level select
- [ ] 4.3 Create GameScene — main game loop, camera, world setup
- [ ] 4.4 Create HUDScene — overlay with Score, Coins, Lives, World display
- [ ] 4.5 Create WinScene — level complete / princess dialogue screen

## 5. Player Mechanics

- [ ] 5.1 Implement Mario movement (acceleration, deceleration, speed cap)
- [ ] 5.2 Implement jumping (variable height, coyote time 80ms, jump buffer 100ms)
- [ ] 5.3 Implement gravity and ground collision
- [ ] 5.4 Implement small/big Mario states
- [ ] 5.5 Implement mushroom power-up (grow animation)
- [ ] 5.6 Implement star power-up (invincibility 10s, flashing)
- [ ] 5.7 Implement player death and respawn
- [ ] 5.8 Implement sprite animations (idle, run, jump, death)

## 6. Level System

- [ ] 6.1 Create tilemap data structure for Level 1 — Grassland
- [ ] 6.2 Create tilemap data for Level 2 — Underground
- [ ] 6.3 Create tilemap data for Level 3 — Sky
- [ ] 6.4 Create tilemap data for Level 4 — Castle
- [ ] 6.5 Implement tile collision (ground, platforms, bricks, pipes)
- [ ] 6.6 Implement ? block hit mechanics (coin/power-up drop)
- [ ] 6.7 Implement brick block breaking (big Mario only)
- [ ] 6.8 Implement coin collection with counter
- [ ] 6.9 Implement flagpole / level completion trigger
- [ ] 6.10 Implement level progression and localStorage save

## 7. Enemy AI

- [ ] 7.1 Implement Goomba (walk, turn at edges, stomp death)
- [ ] 7.2 Implement Koopa (walk, shell state, shell sliding)
- [ ] 7.3 Implement enemy-player collision (stomp = kill, side = damage)
- [ ] 7.4 Implement enemy spawn near viewport

## 8. English Learning Elements

- [ ] 8.1 Implement English word popup on object collection ("Coin!", "Mushroom!", "Star!")
- [ ] 8.2 Setup HUD labels in English (Score, Coins, Lives, World)
- [ ] 8.3 Implement princess dialogue scene (EN/LT) at Castle level end

## 9. Audio System

- [ ] 9.1 Generate 8-bit sounds via Web Audio API (jump, coin, power-up, stomp, death)
- [ ] 9.2 Generate level complete jingle
- [ ] 9.3 Generate background music loop
- [ ] 9.4 Implement mute toggle (M key)

## 10. Touch Controls

- [ ] 10.1 Create virtual D-pad (left/right) on bottom-left
- [ ] 10.2 Create jump button on bottom-right
- [ ] 10.3 Show touch controls only on touch devices
- [ ] 10.4 Implement multi-touch for simultaneous move + jump

## 11. Polish & Deploy

- [ ] 11.1 Test all 4 levels end-to-end
- [ ] 11.2 Test mobile touch controls
- [ ] 11.3 Optimize performance (sprite batching, viewport culling)
- [ ] 11.4 Deploy to mario.godeliauskas.com
