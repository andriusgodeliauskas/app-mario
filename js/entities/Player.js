/**
 * Player — Mario player class
 * Handles movement, jumping, power-ups, and animations
 */

var Player = new Phaser.Class({
    Extends: Phaser.Physics.Arcade.Sprite,

    initialize: function Player(scene, x, y) {
        Phaser.Physics.Arcade.Sprite.call(this, scene, x, y, 'mario');
        // TODO: Setup player physics, animations, state
    },

    update: function (cursors) {
        // TODO: Handle input, movement, jumping
    }
});

// Attach to window for global access
window.Player = Player;
