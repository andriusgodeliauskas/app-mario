/**
 * Villains — Wario, Waluigi, Boo, Bowser Jr. and Donkey Kong.
 *
 * They live in the same physics group as Goombas and Koopas so all the existing
 * colliders, culling and shell interactions keep working. What differs is
 * behaviour, and that lives here rather than growing GameScene's already long
 * patrol loop:
 *
 *   Villains.spawn(scene, type, x, y)     create one (returns the sprite)
 *   Villains.updateOne(scene, e, delta)   true = it handled movement itself
 *   Villains.onStomp(scene, enemy)        'ignore' | 'damage' | 'kill'
 *
 * Tile codes 62-66 place them, next to 60 (goomba) and 61 (koopa).
 */
(function () {
    'use strict';

    var TILE_CODES = { 62: 'wario', 63: 'waluigi', 64: 'boo', 65: 'bowser-jr', 66: 'dk' };
    var TYPES = { 'wario': 1, 'waluigi': 1, 'boo': 1, 'bowser-jr': 1, 'dk': 1 };

    // Tuning, kept together so the difficulty can be read as a set.
    var WARIO_SIGHT = 190;      // px — how far Wario notices the player
    var WARIO_CHARGE = 2.1;     // speed multiplier while charging
    var WALUIGI_SIGHT = 150;
    var WALUIGI_HOP = -330;
    var WALUIGI_COOLDOWN = 1400;
    var BOO_SPEED = 48;         // slow — being unstompable is threat enough
    var BOO_SIGHT = 420;
    var JR_HP = 2;
    var JR_SPEED = 1.6;         // multiplier on the base enemy speed
    var DK_THROW_MS = 2600;
    var BARREL_SPEED = 130;

    function isVillain(type) {
        return Object.prototype.hasOwnProperty.call(TYPES, type);
    }

    function typeForTile(tileId) {
        return Object.prototype.hasOwnProperty.call(TILE_CODES, tileId) ? TILE_CODES[tileId] : null;
    }

    /**
     * Vertical spawn correction, in px. All the sheets are 128px tall but the
     * bodies inside them are not: dropping every villain at the tile centre
     * buries the tall ones in the ground (the bug that once pinned Koopas in
     * place). Boo simply floats higher because he ignores gravity.
     */
    var SPAWN_LIFT = { 'wario': 12, 'waluigi': 14, 'boo': 46, 'bowser-jr': 12, 'dk': 16 };

    /** Create one villain in scene.enemies and return it. */
    function spawn(scene, type, x, y) {
        if (!isVillain(type) || !scene.textures.exists(type)) return null;

        var e = scene.enemies.create(x, y - (SPAWN_LIFT[type] || 0), type);
        // DK is a mini-boss; at the rank-and-file 0.25 he read as just another
        // goomba-sized enemy stood in the jungle.
        e.setScale(type === 'dk' ? 0.34 : 0.25);
        e.enemyType = type;
        e.isVillain = true;
        e.isSquished = false;
        e.isShell = false;
        e.setBounce(0);

        if (type === 'boo') {
            // Boo floats: no gravity, no patrol, no ground needed.
            e.setSize(104, 104).setOffset(12, 16);
            e.body.setAllowGravity(false);
            e.setDepth(8);
            e.customMotion = true;
        } else if (type === 'dk') {
            // DK holds his ground and throws; he never patrols.
            //
            // Deliberately NOT immovable: an immovable Arcade body is not
            // separated on collision, so an immovable DK with gravity falls
            // straight through the floor (and then spawns his barrels down
            // there, where the fall-death check eats them instantly). He stays
            // put because updateDK zeroes his X velocity every frame.
            e.setSize(120, 136).setOffset(4, 24);
            e.customMotion = true;
            e._throwTimer = DK_THROW_MS;
        } else if (type === 'bowser-jr') {
            e.setSize(112, 128).setOffset(8, 28);
            e.hp = JR_HP;
            e.patrolDir = -1;
            e.setVelocityX(-scene._enemyBaseSpeed * JR_SPEED);
        } else {
            e.setSize(112, 132).setOffset(8, 20);
            e.patrolDir = -1;
            e.setVelocityX(-scene._enemyBaseSpeed);
        }

        if (scene.anims.exists(type + '-walk')) e.play(type + '-walk');
        return e;
    }

    /**
     * Per-frame behaviour.
     *
     * Returns true when this villain moved itself and GameScene's patrol loop
     * should leave it alone (Boo and DK). Wario and Waluigi return false: they
     * still want the normal patrol, edge detection and stuck recovery, with
     * their own flourish layered on top.
     */
    function updateOne(scene, e, delta) {
        if (!e.isVillain || e.isSquished) return false;
        var player = scene.player;
        if (!player || !player.body) return false;

        var dx = player.x - e.x;
        var dist = Math.abs(dx);

        switch (e.enemyType) {
            case 'wario':   return updateWario(scene, e, dx, dist);
            case 'waluigi': return updateWaluigi(scene, e, delta, dist);
            case 'boo':     return updateBoo(scene, e, dx, dist);
            case 'bowser-jr': return updateJr(scene, e);
            case 'dk':      return updateDK(scene, e, delta, dx);
            case 'dk-barrel': return updateBarrel(scene, e);
        }
        return false;
    }

    /**
     * A barrel rolls in one direction until something stops it. It keeps its
     * own velocity because the patrol logic would turn it around at the first
     * wall, and a barrel that bounces back and forth forever is furniture, not
     * a threat.
     */
    function updateBarrel(scene, e) {
        if (e.body.blocked.left || e.body.blocked.right || e.y > 650) {
            e.destroy();
            return true;
        }
        e.setVelocityX(e.barrelDir * BARREL_SPEED);
        return true;
    }

    /** Wario ambles until he spots you, then puts his shoulder down. */
    function updateWario(scene, e, dx, dist) {
        var charging = dist < WARIO_SIGHT && Math.abs(scene.player.y - e.y) < 60;
        var speed = scene._enemyBaseSpeed * (charging ? WARIO_CHARGE : 1);

        if (charging) {
            e.patrolDir = dx > 0 ? 1 : -1;
            e.setFlipX(e.patrolDir > 0);
            e.setTint(0xFFD0D0);
        } else {
            e.clearTint();
        }
        e.setVelocityX(speed * e.patrolDir);
        return false;   // still wants normal edge/stuck handling
    }

    /** Waluigi hops over you with those long legs. */
    function updateWaluigi(scene, e, delta, dist) {
        e._hopTimer = (e._hopTimer || 0) - delta;
        if (dist < WALUIGI_SIGHT && e._hopTimer <= 0 && e.body.blocked.down) {
            e.setVelocityY(WALUIGI_HOP);
            e._hopTimer = WALUIGI_COOLDOWN;
        }
        return false;
    }

    /**
     * Boo freezes when you look at him and chases when you turn away — the
     * behaviour from his own character bio, and the one children find funniest.
     * Being unstompable is what makes it matter: you have to look at him.
     */
    function updateBoo(scene, e, dx, dist) {
        var player = scene.player;
        // player.flipX is true when facing left
        var playerFacing = player.flipX ? -1 : 1;
        var dirToBoo = dx > 0 ? -1 : 1;         // sign of (boo - player)
        var beingWatched = (playerFacing === dirToBoo) && dist < BOO_SIGHT;

        e.isFrozen = beingWatched;

        if (beingWatched) {
            e.body.setVelocity(0, 0);
            if (scene.anims.exists('boo-shy')) e.play('boo-shy', true);
            e.setAlpha(1);
            return true;
        }

        if (scene.anims.exists('boo-walk')) e.play('boo-walk', true);
        e.setAlpha(0.85);
        if (dist > BOO_SIGHT) { e.body.setVelocity(0, 0); return true; }

        var dy = player.y - e.y;
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        e.body.setVelocity((dx / len) * BOO_SPEED, (dy / len) * BOO_SPEED);
        e.setFlipX(dx > 0);
        return true;
    }

    /** Bowser Jr. patrols faster than anyone and takes two stomps. */
    function updateJr(scene, e) {
        if (Math.abs(e.body.velocity.x) < 10 && e.body.blocked.down) {
            e.setVelocityX(scene._enemyBaseSpeed * JR_SPEED * e.patrolDir);
        }
        return false;
    }

    /** DK stands his ground and rolls barrels downhill at you. */
    function updateDK(scene, e, delta, dx) {
        e.body.setVelocityX(0);
        e.setFlipX(dx > 0);

        e._throwTimer -= delta;
        if (e._throwTimer > 0) return true;
        e._throwTimer = DK_THROW_MS;

        if (Math.abs(dx) > 520) return true;    // don't litter the level off-screen

        var dir = dx > 0 ? 1 : -1;
        var barrel = scene.enemies.create(e.x + dir * 24, e.y - 10, 'dk-barrel');
        barrel.setScale(0.25);
        barrel.enemyType = 'dk-barrel';
        barrel.isVillain = true;
        barrel.isSquished = false;
        barrel.isShell = false;
        barrel.customMotion = true;
        barrel.setSize(96, 96).setOffset(16, 16);
        barrel.barrelDir = dir;
        barrel.setVelocityX(dir * BARREL_SPEED);
        barrel.setBounce(0.2);
        if (scene.anims.exists('dk-barrel-roll')) barrel.play('dk-barrel-roll');
        return true;
    }

    /**
     * What a stomp does. GameScene asks before running its own squish logic.
     *   'ignore' — the stomp does nothing (Boo); the player takes the hit
     *   'damage' — a hit landed but the villain survives (Bowser Jr. round 1)
     *   'kill'   — treat it like any other enemy
     */
    function onStomp(scene, enemy) {
        if (!enemy.isVillain) return 'kill';
        if (enemy.enemyType === 'boo') return 'ignore';

        if (enemy.enemyType === 'bowser-jr') {
            enemy.hp = (enemy.hp || 1) - 1;
            if (enemy.hp > 0) {
                enemy.setTint(0xFF8080);
                scene.time.delayedCall(220, function () { if (enemy.active) enemy.clearTint(); });
                return 'damage';
            }
        }
        return 'kill';
    }

    /** Frame to show once squished — every villain sheet keeps it at index 2. */
    function squishAnim(enemy) {
        return enemy.enemyType + '-squish';
    }

    window.Villains = {
        TILE_CODES: TILE_CODES,
        isVillain: isVillain,
        typeForTile: typeForTile,
        spawn: spawn,
        updateOne: updateOne,
        onStomp: onStomp,
        squishAnim: squishAnim,
        TUNING: {
            WARIO_SIGHT: WARIO_SIGHT, WARIO_CHARGE: WARIO_CHARGE,
            BOO_SPEED: BOO_SPEED, BOO_SIGHT: BOO_SIGHT, JR_HP: JR_HP
        }
    };
})();
