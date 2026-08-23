/**
 * HeroPowers — the one thing each hero can do that the others cannot.
 *
 * The physics multipliers in the registry are deliberately tiny (a hero may
 * never be worse than Mario, and never more than 10% better), so this is where
 * the characters actually become different to play.
 *
 * Every power is bounded on purpose. A glide that never ends or a double jump
 * that stacks would let a child float over level geometry the designer meant
 * them to solve, which reads as "the game is broken" rather than "I am strong".
 *
 * GameScene calls into four hooks:
 *   HeroPowers.reset(scene)                     when the player lands
 *   HeroPowers.speedFactor(scene, d, l, r)      multiplies run speed
 *   HeroPowers.applyStop(scene, player)         handles "no key held"
 *   HeroPowers.tryAirJump(scene, player)        an extra mid-air jump
 *   HeroPowers.update(scene, delta, jumpHeld)   per-frame effects
 *   HeroPowers.stompBounce(scene, base)         bounce off a stomped enemy
 */
(function () {
    'use strict';

    // Tuning. Kept together so the numbers can be read as a set.
    var GLIDE_MAX_MS = 600;     // Peach hangs for at most this long per jump
    var GLIDE_FALL_SPEED = 60;  // px/s while gliding (normal fall reaches ~500)
    var AIR_JUMP_FACTOR = 0.6;  // Yoshi's second jump, relative to the first
    var QUICKSTART_MS = 220;    // Toad's burst after standing still
    var QUICKSTART_MUL = 1.35;
    var SLIP_DECAY = 0.88;      // Luigi keeps this share of his speed per frame
    var SLIP_STOP = 20;         // ...until he is slow enough to just stop
    var DASH_MS = 400;          // Diddy's roll
    var DASH_MUL = 1.6;
    var DASH_WINDOW_MS = 260;   // double-tap has to land inside this
    var MAGNET_RANGE = 90;      // Rosalina's Luma reach, px
    var MAGNET_PULL = 170;      // px/s the coin drifts toward her
    var BOUNCE_MUL = 1.4;       // Daisy's stomp rebound

    function powerOf(scene) {
        return (scene.hero && scene.hero.power) ? scene.hero.power : 'fireball';
    }

    function state(scene) {
        if (!scene._powerState) {
            scene._powerState = {
                glideMs: 0, airJumpUsed: false, standingMs: 0,
                dashMs: 0, lastTapDir: 0, lastTapAt: 0, elapsed: 0
            };
        }
        return scene._powerState;
    }

    /** Called when the hero is back on the ground: recharge everything. */
    function reset(scene) {
        var s = state(scene);
        s.glideMs = GLIDE_MAX_MS;
        s.airJumpUsed = false;
    }

    /**
     * Run-speed multiplier for this frame. Covers Toad's burst off the mark and
     * Diddy's double-tap roll; everyone else gets 1.
     */
    function speedFactor(scene, delta, moveLeft, moveRight) {
        var s = state(scene);
        var power = powerOf(scene);
        var moving = moveLeft || moveRight;

        s.elapsed += delta;

        if (power === 'quickstart') {
            if (!moving) { s.standingMs += delta; return 1; }
            // Burst only after an actual standstill, so holding right across a
            // level does not turn into a permanent speed boost.
            if (s.standingMs > 150) {
                s.standingMs = -QUICKSTART_MS;   // negative = burst countdown
            }
            if (s.standingMs < 0) {
                s.standingMs += delta;
                return QUICKSTART_MUL;
            }
            return 1;
        }

        if (power === 'rolldash') {
            var dir = moveLeft ? -1 : (moveRight ? 1 : 0);
            if (dir !== 0 && dir !== s.heldDir) {
                // direction pressed this frame (rising edge)
                if (dir === s.lastTapDir && (s.elapsed - s.lastTapAt) < DASH_WINDOW_MS) {
                    s.dashMs = DASH_MS;
                }
                s.lastTapDir = dir;
                s.lastTapAt = s.elapsed;
            }
            s.heldDir = dir;

            if (s.dashMs > 0) {
                s.dashMs -= delta;
                return DASH_MUL;
            }
            return 1;
        }

        return 1;
    }

    /**
     * "No direction held" behaviour. Returns true when the power handled it;
     * false means the caller should stop the player dead as usual.
     */
    function applyStop(scene, player) {
        if (powerOf(scene) !== 'slippery') return false;
        var vx = player.body.velocity.x;
        if (Math.abs(vx) < SLIP_STOP) { player.setVelocityX(0); return true; }
        player.setVelocityX(vx * SLIP_DECAY);
        return true;
    }

    /**
     * An extra jump while airborne. Returns true if one was spent, which tells
     * the caller to consume the jump request.
     */
    function tryAirJump(scene, player) {
        if (powerOf(scene) !== 'doublejump') return false;
        var s = state(scene);
        if (s.airJumpUsed) return false;
        s.airJumpUsed = true;

        var base = 520 * (scene.heroPhysics ? scene.heroPhysics.jumpMul : 1);
        player.setVelocityY(-base * AIR_JUMP_FACTOR);
        if (window.AudioManager) {
            try { AudioManager.play('jump'); } catch (e) { /* audio is optional */ }
        }
        return true;
    }

    /** Bounce velocity after stomping an enemy (Daisy chains higher). */
    function stompBounce(scene, base) {
        return powerOf(scene) === 'superbounce' ? base * BOUNCE_MUL : base;
    }

    /** Per-frame effects: Peach's glide and Rosalina's Luma. */
    function update(scene, delta, jumpHeld) {
        var power = powerOf(scene);
        var s = state(scene);
        var player = scene.player;
        if (!player || !player.body) return;

        if (power === 'glide') {
            var falling = player.body.velocity.y > GLIDE_FALL_SPEED;
            if (jumpHeld && falling && s.glideMs > 0 && !player.body.blocked.down) {
                s.glideMs -= delta;
                player.setVelocityY(GLIDE_FALL_SPEED);
            }
        }

        if (power === 'luma') pullCoins(scene, delta);
    }

    /**
     * Rosalina's Luma tugs nearby coins toward her. It moves the coin rather
     * than collecting it, so the normal overlap handler still awards the score
     * and the English word popup.
     */
    function pullCoins(scene, delta) {
        // scene.coins is the coin COUNTER; the sprites live in coinGroup.
        if (!scene.coinGroup || !scene.coinGroup.getChildren) return;
        var px = scene.player.x, py = scene.player.y;
        var step = MAGNET_PULL * (delta / 1000);
        var kids = scene.coinGroup.getChildren();

        for (var i = 0; i < kids.length; i++) {
            var coin = kids[i];
            if (!coin.active) continue;
            var dx = px - coin.x, dy = py - coin.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > MAGNET_RANGE || dist < 1) continue;
            coin.x += (dx / dist) * step;
            coin.y += (dy / dist) * step;
            if (coin.body && coin.body.updateFromGameObject) coin.body.updateFromGameObject();
        }
    }

    window.HeroPowers = {
        reset: reset,
        speedFactor: speedFactor,
        applyStop: applyStop,
        tryAirJump: tryAirJump,
        stompBounce: stompBounce,
        update: update,
        // exposed for tests / tuning readouts
        TUNING: {
            GLIDE_MAX_MS: GLIDE_MAX_MS, GLIDE_FALL_SPEED: GLIDE_FALL_SPEED,
            AIR_JUMP_FACTOR: AIR_JUMP_FACTOR, DASH_MUL: DASH_MUL,
            MAGNET_RANGE: MAGNET_RANGE, BOUNCE_MUL: BOUNCE_MUL
        }
    };
})();
