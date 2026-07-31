/**
 * Phaser Game Configuration
 * Super Mario — Learn English Adventure
 */

var gameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#000000',
    pixelArt: false,
    roundPixels: false,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        // Take the whole #game-container fullscreen, not just the canvas.
        // Without this Phaser builds its own anonymous wrapper div and reparents
        // ONLY the canvas into it, which leaves #touch-controls (D-pad, JUMP,
        // fire) outside the fullscreen element — the browser then hides them and
        // the game becomes unplayable in fullscreen on a phone.
        fullscreenTarget: 'game-container',
        min: {
            width: 320,
            height: 240
        },
        max: {
            width: 1200,
            height: 900
        }
    },
    scene: [BootScene, MenuScene, SettingsScene, GameScene, BonusRoomScene, HUDScene, WinScene]
};

// Create the game instance
var game = new Phaser.Game(gameConfig);
