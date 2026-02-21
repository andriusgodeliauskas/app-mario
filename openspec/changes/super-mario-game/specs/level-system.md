## ADDED: Level System with 4 Themed Worlds

### Requirements
- 4 levels, each a Tiled JSON tilemap: Grassland (1-1), Underground (1-2), Sky (1-3), Castle (1-4)
- Tile size: 32x32 pixels
- Each level is horizontally scrolling, camera follows player with deadzone
- Tilemap layers: background (decorative), ground (collidable), platforms (collidable), objects (interactive)
- Level width: approximately 200 tiles (6400px), height: 20 tiles (640px)
- Tilemaps generated procedurally at build time or hand-crafted as JSON files

#### Tile Types
- Ground tiles: solid, collidable from all sides
- Platform tiles: collidable only from top (pass-through from below)
- Brick blocks: breakable by big Mario (hit from below), contain nothing or coins
- ? blocks: hit from below to release item (coin or power-up), become empty after hit
- Pipes: solid decorative obstacles, green colored, some mark level transitions
- Coins: collectible, floating, give 1 coin and 100 points each
- Checkpoints: midpoint flag, sets respawn position when touched

#### Level Themes
- **Grassland (1-1)**: blue sky background, green ground, hills, clouds, easy difficulty, introduces basic mechanics
- **Underground (1-2)**: dark background, brown/gray bricks, ceiling, tighter spaces, more brick blocks
- **Sky (1-3)**: cloud platforms, open sky, moving platforms, gaps, vertically oriented sections
- **Castle (1-4)**: dark red/gray stone, fire bars (rotating obstacles), lava pits (instant death), Bowser-style boss area

#### Level Completion
- Levels 1-1 to 1-3: end with a flagpole; player slides down, score bonus based on height
- Level 1-4: ends with reaching the princess; triggers victory dialogue
- Completing a level unlocks the next; progress stored in localStorage
- Flag score bonus: top = 5000pts, middle = 2000pts, bottom = 500pts

### Scenarios
- Given level 1-1 starts, When GameScene loads, Then Grassland tilemap renders with blue sky, ground, and platforms
- Given Mario moves right, When Mario passes the camera deadzone edge, Then the camera scrolls to follow Mario
- Given Mario is big and hits a brick block from below, When collision is detected on the brick layer, Then the brick breaks with particle effect and gives 50 points
- Given Mario hits a ? block from below, When the block contains a coin, Then a coin pops out, score increases by 100, and block becomes empty
- Given Mario hits a ? block from below, When the block contains a power-up, Then a mushroom or star emerges and moves right along the ground
- Given Mario touches a coin, When overlap is detected, Then coin disappears, coin count increases by 1, score increases by 100
- Given Mario reaches the flagpole, When Mario touches the flag, Then Mario slides down, score bonus is awarded based on grab height, and next level loads
- Given Mario reaches the princess in level 1-4, When overlap is detected, Then victory dialogue plays and game is won
- Given Mario touches a checkpoint flag, When overlap is detected, Then flag animates, respawn point updates to checkpoint position
- Given Mario falls into lava in Castle level, When Mario overlaps lava tiles, Then Mario dies immediately regardless of power-up state
- Given a level is completed, When score is tallied, Then the completion state is saved to localStorage
