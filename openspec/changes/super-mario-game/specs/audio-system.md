## ADDED: 8-Bit Audio System

### Requirements
- All sounds generated programmatically using Web Audio API (no external audio files)
- Sounds are synthesized at game boot and cached as AudioBuffer objects
- Master volume control: default 0.5, adjustable via settings
- Mute toggle via M key or UI button

#### Sound Effects (Generated via OscillatorNode + GainNode)
- **Jump**: short rising square wave, 200Hz to 600Hz over 150ms
- **Coin**: two quick high-pitched square wave notes, C6 (1047Hz) then E6 (1319Hz), 50ms each
- **Power-up**: ascending arpeggio (C5-E5-G5-C6), square wave, 80ms per note
- **Enemy stomp**: short noise burst + low square wave, 100ms
- **Player death**: descending slide, 400Hz to 100Hz over 600ms, square wave
- **Level complete**: triumphant ascending melody (C5-E5-G5-C6-E6-G6), 100ms per note, square wave
- **Brick break**: noise burst 50ms
- **1-UP**: distinctive ascending arpeggio, different from power-up (E5-G5-B5-E6), 60ms per note
- **Fireball/shell kick**: short descending noise, 80ms

#### Background Music
- Simple looping 8-bit melody generated with Web Audio API
- Tempo: 140 BPM
- Uses square wave oscillator for melody and triangle wave for bass
- Overworld theme: major key repeating melody (8 bars), loops continuously
- Underground theme: minor key, slower feel
- Castle theme: diminished/tense chords, faster tempo
- Star power: faster tempo override of current level music
- Music pauses when game pauses, resumes on unpause

#### Audio Context
- AudioContext created on first user interaction (click/tap) to comply with browser autoplay policy
- Single AudioContext instance shared across all sounds
- Gain nodes for SFX channel and Music channel, both routed to master gain

### Scenarios
- Given the game starts, When the player clicks Start or taps the screen for the first time, Then AudioContext is created and audio is enabled
- Given Mario jumps, When jump is triggered, Then a rising square wave plays (200Hz to 600Hz, 150ms)
- Given Mario collects a coin, When coin overlap is detected, Then two quick high notes play (C6, E6)
- Given Mario collects a mushroom, When power-up is obtained, Then ascending arpeggio plays
- Given Mario stomps a Goomba, When enemy is defeated, Then stomp sound plays
- Given Mario dies, When death sequence starts, Then descending slide sound plays
- Given Mario reaches the flagpole, When level complete triggers, Then triumphant ascending melody plays and background music stops
- Given the overworld level is playing, When GameScene is active, Then looping 8-bit overworld melody plays in the background
- Given the player enters the castle level, When level 1-4 loads, Then tense castle theme plays instead of overworld theme
- Given the player presses M, When mute is toggled, Then master gain is set to 0 (or restored to previous value)
- Given the browser tab is inactive, When visibility changes, Then audio is suspended to save resources
