## ADDED: Touch Controls for Mobile Devices

### Requirements
- Virtual controls rendered as semi-transparent HTML overlay elements on top of the game canvas
- Only displayed on touch-capable devices (detected via `'ontouchstart' in window` or `navigator.maxTouchPoints > 0`)
- Hidden on desktop/mouse-only devices; keyboard input used instead

#### D-Pad (Left Side)
- Positioned: bottom-left corner, 20px margin from edges
- Layout: left arrow and right arrow buttons side by side (no up/down needed for this game)
- Button size: 64x64px each, with 8px gap between them
- Visual: semi-transparent white circles (opacity 0.4) with arrow icons, opacity increases to 0.7 when pressed
- Left button sends left cursor key events, right button sends right cursor key events
- Supports hold: continuous movement while finger is held down

#### Jump Button (Right Side)
- Positioned: bottom-right corner, 20px margin from edges
- Single circular button, 80x80px
- Visual: semi-transparent white circle (opacity 0.4) with "A" label or up-arrow, opacity 0.7 when pressed
- Tap triggers jump; hold duration controls jump height (same as keyboard)
- Must support variable jump height (short tap = low jump, long hold = full jump)

#### Responsive Sizing
- On screens narrower than 480px: buttons scale to 48x48 (d-pad) and 64x64 (jump)
- On screens narrower than 360px: buttons scale to 40x40 (d-pad) and 56x56 (jump)
- Buttons always maintain minimum 44x44px touch target (accessibility)

#### Multi-Touch
- Support simultaneous d-pad + jump (player must be able to move and jump at the same time)
- Each button tracks its own touch pointer ID to prevent conflicts
- Touch events use `preventDefault()` to avoid scrolling and zooming

#### Sprint
- Sprint activated by double-tapping and holding the direction button (right or left)
- Alternative: a small sprint toggle button above the d-pad (32x32px)

### Scenarios
- Given the game loads on a phone, When touch capability is detected, Then virtual d-pad and jump button appear as overlays
- Given the game loads on a desktop, When no touch capability is detected, Then virtual controls are hidden
- Given the player touches the right d-pad button, When the touch starts, Then Mario moves right continuously
- Given the player releases the right d-pad button, When the touch ends, Then Mario stops moving right
- Given the player taps the jump button briefly, When touch duration is short, Then Mario performs a low jump
- Given the player holds the jump button, When touch duration is long, Then Mario performs a full-height jump
- Given the player holds right d-pad and taps jump simultaneously, When both touches are active, Then Mario moves right and jumps at the same time
- Given the screen width is 375px, When controls render, Then d-pad buttons are 48x48px and jump button is 64x64px
- Given the player touches the screen, When a touch event fires, Then default browser scroll and zoom behaviors are prevented
