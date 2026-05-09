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
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MenuScene, SettingsScene, GameScene, HUDScene, WinScene]
};

// Create the game instance
var game = new Phaser.Game(gameConfig);
