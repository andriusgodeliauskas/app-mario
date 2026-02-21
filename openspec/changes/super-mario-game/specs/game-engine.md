## ADDED: Phaser 3 Game Engine Setup

### Requirements
- Use Phaser 3 framework with Canvas renderer (WebGL fallback)
- Game resolution: 800x600 logical pixels, scaled to fit viewport with `Phaser.Scale.FIT`
- Target 60 FPS game loop
- Arcade Physics engine with gravity Y = 800
- Scene management with dedicated scenes: BootScene, PreloadScene, MenuScene, GameScene, UIScene (overlay), GameOverScene
- BootScene loads minimal assets needed for a loading bar
- PreloadScene loads all sprites, tilemaps, audio assets and displays loading progress
- MenuScene shows title screen with "Start Game" and level select
- GameScene handles core gameplay, instantiated per level
- UIScene runs as a parallel overlay scene for HUD elements (score, lives, coins, level name)
- GameOverScene shows final score with restart option
- Asset pipeline: all sprites as spritesheets, tilemaps as JSON, audio as generated Web Audio buffers
- Game container is a single `<div id="game-container">` centered on page with black background
- Keyboard input via `this.input.keyboard.createCursorKeys()` plus WASD bindings
- Pause support via P key or tap on pause icon

### Scenarios
- Given the page loads, When Phaser initializes, Then Canvas element is created inside `#game-container` and BootScene starts
- Given BootScene completes, When PreloadScene starts, Then a progress bar displays while all assets load
- Given all assets are loaded, When PreloadScene completes, Then MenuScene is displayed with title and start button
- Given the player presses Start, When GameScene launches, Then UIScene starts as a parallel overlay scene
- Given the game is running, When the player presses P, Then the game pauses and a "Paused" overlay appears
- Given the browser tab loses focus, When visibility changes, Then the game automatically pauses
- Given the window resizes, When Phaser scale manager detects it, Then the game canvas scales to fit while maintaining aspect ratio
