/**
 * Boss — a pacing Bowser-style boss with HP, telegraphed attacks and a
 * vulnerability/invulnerability cycle. Visuals + movement live here; the
 * encounter logic (math gate, projectiles, win handling) lives in GameScene.
 *
 *   var boss = new Boss(scene, x, y, { hp: 3, minX: .., maxX: .. });
 *   boss.update(delta, playerX);          // each frame
 *   boss.takeDamage();                    // returns true if a hit landed
 *   boss.attackReady                      // scene reads → spawn a projectile
 */

var Boss = function (scene, x, y, opts) {
    opts = opts || {};
    this.scene = scene;
    this.maxHp = opts.hp || 3;
    this.hp = this.maxHp;
    this.minX = opts.minX !== undefined ? opts.minX : x - 140;
    this.maxX = opts.maxX !== undefined ? opts.maxX : x + 140;
    this.defeated = false;
    this.invuln = 0;
    this.attackReady = false;
    this._attackTimer = 1800;
    this._dir = -1;
    this._speed = opts.speed || 70;

    var spr = scene.physics.add.sprite(x, y, 'bowser');
    spr.setScale(opts.scale || 0.4).setDepth(9);
    spr.setSize(150, 190).setOffset(53, 60);
    spr.body.setAllowGravity(true);
    spr.setCollideWorldBounds(false);
    if (scene.anims.exists('bowser-walk')) spr.play('bowser-walk');
    spr.setVelocityX(this._dir * this._speed);
    spr.setFlipX(false);
    this.sprite = spr;
    spr._boss = this;
};

Boss.prototype.update = function (delta, playerX) {
    if (this.defeated || !this.sprite || !this.sprite.active) return;
    var spr = this.sprite;

    // Pace between bounds.
    if (spr.x <= this.minX && this._dir < 0) { this._dir = 1; spr.setFlipX(true); }
    else if (spr.x >= this.maxX && this._dir > 0) { this._dir = -1; spr.setFlipX(false); }
    spr.setVelocityX(this._dir * this._speed);

    if (this.invuln > 0) {
        this.invuln -= delta;
        spr.setAlpha(Math.floor(this.invuln / 80) % 2 === 0 ? 0.4 : 1);
        if (this.invuln <= 0) spr.setAlpha(1);
    }

    // Attack cadence — flag for the scene to spawn a projectile.
    this._attackTimer -= delta;
    if (this._attackTimer <= 0) {
        this.attackReady = true;
        this._attackTimer = 2000 + Math.floor(this.maxHp - this.hp) * 0; // steady
    }
};

// Apply one point of damage. Returns true if the hit registered.
Boss.prototype.takeDamage = function () {
    if (this.defeated || this.invuln > 0) return false;
    this.hp -= 1;
    this.invuln = 1200;
    if (window.AudioManager) AudioManager.play('bossHit');

    // Knockback hop
    if (this.sprite && this.sprite.body) {
        this.sprite.setVelocityY(-220);
        this.sprite.setTint(0xff5555);
        var spr = this.sprite, scene = this.scene;
        scene.time.delayedCall(160, function () { if (spr && spr.active) spr.clearTint(); });
    }

    if (this.hp <= 0) this._defeat();
    return true;
};

Boss.prototype._defeat = function () {
    this.defeated = true;
    var spr = this.sprite, scene = this.scene;
    if (window.AudioManager) AudioManager.play('bossDefeat');
    if (spr && spr.body) {
        spr.body.setEnable(false);
        scene.tweens.add({
            targets: spr, angle: 180, y: spr.y + 80, alpha: 0,
            duration: 900, ease: 'Cubic.In',
            onComplete: function () { if (spr) spr.destroy(); }
        });
    }
};

if (typeof window !== 'undefined') window.Boss = Boss;
