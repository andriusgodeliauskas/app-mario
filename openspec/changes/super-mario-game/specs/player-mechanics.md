## ADDED: Player Movement and Mechanics

### Requirements
- Mario sprite: 32x32 pixels, animations for idle, walk (4 frames), jump, death
- Horizontal movement speed: 200 px/s, acceleration-based (not instant)
- Sprint modifier: hold Shift to run at 350 px/s
- Jump velocity: -450 (variable height based on button hold duration, min -250)
- Coyote time: 80ms grace period to jump after leaving a platform edge
- Jump buffering: 100ms buffer window; if jump is pressed just before landing, jump executes on landing
- Wall slide: not implemented (keep it simple, classic Mario style)
- Sprite flips horizontally based on movement direction
- Small Mario: 32x32 hitbox, dies on any enemy contact (except stomp)
- Big Mario (after mushroom): 32x64 hitbox, takes hit to shrink back to small, brief invincibility flash (2s)
- Star power-up: invincible for 10 seconds, sprite flashes rainbow, kills enemies on contact
- Player collides with tilemap ground/platform layers and cannot pass through solid tiles
- Player falls into pits (Y > map height) and dies
- Death animation: Mario jumps up then falls off screen, 1 life lost
- Respawn at last checkpoint or level start after 1.5s delay
- Lives system: start with 3 lives, game over at 0
- Extra life at 100 coins

### Scenarios
- Given Mario is on the ground, When the player presses right arrow, Then Mario accelerates right with walk animation
- Given Mario is on the ground, When the player presses jump, Then Mario jumps with velocity proportional to hold duration
- Given Mario just walked off a platform edge, When the player presses jump within 80ms, Then Mario still jumps (coyote time)
- Given Mario is in the air approaching a platform, When the player presses jump within 100ms before landing, Then Mario jumps immediately upon landing (jump buffer)
- Given Mario is small, When Mario collides with a mushroom, Then Mario grows to big (32x64), "Mushroom!" popup appears in English
- Given Mario is big, When an enemy touches Mario (not stomp), Then Mario shrinks to small with 2s invincibility flash
- Given Mario is small, When an enemy touches Mario (not stomp), Then death animation plays and a life is lost
- Given Mario has star power-up, When Mario contacts any enemy, Then the enemy dies and Mario continues running
- Given Mario falls below the map, When Y position exceeds map height, Then Mario dies immediately
- Given Mario has 0 lives, When Mario dies, Then GameOverScene is shown with final score
- Given Mario collects 100th coin, When coin count reaches 100, Then lives increase by 1 and coin counter resets to 0
