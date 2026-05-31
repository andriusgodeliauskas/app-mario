/**
 * Fireball — a flame bubble ("liepsnos burbuliukas") shot by Fire Mario.
 *
 * Factory: Fireball.spawn(scene, group, x, y, dir)
 *   - dir: +1 (right) or -1 (left)
 *   - Adds a configured sprite to the given physics group and returns it.
 *
 * Behaviour: arcs under gravity, bounces along the ground, flies horizontally,
 * dies on wall contact, after a short lifetime, or when off-screen. Collisions
 * with enemies/bosses and ground are wired in GameScene.
 */

var Fireball = {
    SPEED: 360,
    LIFETIME: 2500, // ms

    spawn: function (scene, group, x, y, dir) {
        var fb = group.create(x, y, 'fireball');
        fb.setScale(0.25).setDepth(8);
        if (scene.anims.exists('fireball-spin')) fb.play('fireball-spin');
        // Texture frame is 64x64 → at scale 0.25 the sprite is 16x16 world.
        // Body 40px in texture space → 10px world (a tight little bubble).
        fb.setSize(40, 40).setOffset(12, 12);
        fb.body.setAllowGravity(true);
        fb.setBounce(0, 0.55);          // bounces vertically off the ground
        fb.setVelocity(dir * Fireball.SPEED, -140);
        fb.setData('dir', dir);
        fb.setData('bornAt', scene.time.now);
        fb.isFireball = true;
        return fb;
    },

    /**
     * Per-frame maintenance for every active fireball. Keeps horizontal speed
     * constant (gravity only affects y) and destroys spent fireballs.
     * Call from GameScene.update().
     */
    update: function (scene, group) {
        if (!group) return;
        var balls = group.getChildren();
        for (var i = balls.length - 1; i >= 0; i--) {
            var fb = balls[i];
            if (!fb.active) continue;
            var dir = fb.getData('dir') || 1;
            fb.setVelocityX(dir * Fireball.SPEED);

            var dead =
                (scene.time.now - fb.getData('bornAt') > Fireball.LIFETIME) ||
                fb.body.blocked.left || fb.body.blocked.right ||
                fb.x < 0 || fb.x > scene.physics.world.bounds.width ||
                fb.y > 640;

            if (dead) {
                Fireball.burst(scene, fb);
            }
        }
    },

    burst: function (scene, fb) {
        var x = fb.x, y = fb.y;
        fb.destroy();
        // Tiny puff so the fizzle reads clearly
        var puff = scene.add.circle(x, y, 6, 0xFFAA33, 0.8).setDepth(8);
        scene.tweens.add({
            targets: puff, scale: 2, alpha: 0, duration: 180,
            onComplete: function () { puff.destroy(); }
        });
    }
};

if (typeof window !== 'undefined') window.Fireball = Fireball;
