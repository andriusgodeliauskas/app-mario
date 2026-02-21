/**
 * Goomba — Basic enemy class
 * Walks back and forth, defeated by stomping
 */

var Goomba = new Phaser.Class({
    Extends: Phaser.Physics.Arcade.Sprite,

    initialize: function Goomba(scene, x, y) {
        Phaser.Physics.Arcade.Sprite.call(this, scene, x, y, 'goomba');
        // TODO: Setup enemy physics, patrol behavior
    },

    update: function () {
        // TODO: Patrol movement, edge detection
    }
});

// Attach to window for global access
window.Goomba = Goomba;
