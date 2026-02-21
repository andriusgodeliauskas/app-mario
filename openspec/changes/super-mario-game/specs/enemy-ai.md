## ADDED: Enemy AI System

### Requirements
- All enemies use Arcade Physics bodies with gravity
- Enemies are placed via object layer in Tiled tilemaps with type property

#### Goomba
- Sprite: 32x32, brown mushroom-like, 2-frame walk animation
- Behavior: walks in one direction at 60 px/s
- Turns around when hitting a wall or solid tile edge
- Edge detection: reverses direction when no ground tile is detected ahead (does not walk off platforms)
- Stomped: flattened sprite for 0.3s, then removed; player bounces up with velocity -300
- Gives 100 points when stomped
- Dies instantly if hit by star-powered Mario or a Koopa shell

#### Koopa Troopa
- Sprite: 32x48, green turtle, 2-frame walk animation
- Behavior: walks in one direction at 50 px/s, turns at walls and edges (same as Goomba)
- Stomped first time: retreats into shell (stationary 32x32 sprite), player bounces up
- Shell behavior: stays still until Mario touches it from the side, then slides at 400 px/s in the kick direction
- Sliding shell kills all enemies it contacts and breaks brick blocks
- Sliding shell bounces off walls
- Sliding shell can hurt Mario if he touches it from the side while it's moving
- Stomping a moving shell stops it
- Shell gives 100 points when kicked, each enemy killed by shell gives 200 points (combo)
- Koopa gives 200 points when initially stomped

#### Enemy Spawning
- Enemies activate when they scroll within 64px of the camera viewport edge (not all at once)
- Enemies that fall off the map are destroyed and freed from memory
- Maximum 10 active enemies on screen at once

### Scenarios
- Given a Goomba is walking right, When it reaches a wall, Then it turns and walks left
- Given a Goomba is walking on a platform, When it reaches the platform edge, Then it turns around
- Given Mario jumps on a Goomba, When Mario's bottom collides with Goomba's top half, Then the Goomba is squished, Mario bounces, 100 points awarded
- Given Mario touches a Goomba from the side, When collision is lateral, Then Mario takes damage (shrinks or dies)
- Given Mario stomps a Koopa, When Mario's bottom collides with Koopa's top, Then Koopa retreats into shell, player bounces, 200 points awarded
- Given a Koopa shell is stationary, When Mario walks into it, Then the shell launches in the direction Mario was facing at 400 px/s
- Given a Koopa shell is sliding, When it hits a Goomba, Then the Goomba dies and 200 points are awarded
- Given a Koopa shell is sliding, When it hits Mario from the side, Then Mario takes damage
- Given Mario stomps a moving shell, When Mario's bottom hits the shell top, Then the shell stops
- Given Mario has star power, When Mario touches any enemy, Then the enemy dies immediately with a flip animation and points are awarded
- Given an enemy is off-screen below the map, When its Y exceeds map bounds, Then it is destroyed
