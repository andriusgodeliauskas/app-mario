/**
 * Koopa — Turtle enemy class
 * Walks back and forth, retreats into shell when stomped
 */

var Koopa = new Phaser.Class({
    Extends: Phaser.Physics.Arcade.Sprite,

    initialize: function Koopa(scene, x, y) {
        Phaser.Physics.Arcade.Sprite.call(this, scene, x, y, 'koopa');
        // TODO: Setup enemy physics, shell mechanic
    },

    update: function () {
        // TODO: Patrol movement, shell state
    }
});

// Attach to window for global access
window.Koopa = Koopa;
