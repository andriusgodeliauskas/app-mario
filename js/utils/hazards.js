/**
 * Hazards — the environmental threats that only exist on `hard`.
 *
 * On every other difficulty this module does nothing at all: init() returns
 * immediately unless the difficulty profile carries `hazards: true`. A younger
 * child on easy must never meet any of this.
 *
 * The rule that shapes all of it: THREATS ARE TELEGRAPHED. A hazard that takes
 * a life with no warning is not difficult, it is unfair, and a six-year-old
 * stops playing. Every one of these announces itself before it can hurt you.
 *
 *   Hazards.init(scene)            once, in create()
 *   Hazards.update(scene, delta)   every frame
 *
 * State lives on the scene (scene._hazards), so restarting a level clears it.
 * Nothing here knows about the HUD — it emits 'hazard' events and the HUD
 * listens, which is also what lets the tests run without a HUD scene.
 */
(function () {
    'use strict';

    // ── Tuning, kept together so the difficulty reads as one set ─────────────
    var CALM_MS = 35000;        // quiet stretch between storms
    var WARN_MS = 3000;         // sky darkens, thunder rolls
    var STORM_MS = 6000;
    var RAIN_TICK_MS = 800;     // how often the rain checks for a roof
    var RAIN_GRACE_MS = 800;    // ...and it never checks the instant it starts

    var BOLT_EVERY_MS = 2500;
    var BOLT_TELL_MS = 1000;    // shadow on the ground before the strike
    var BOLT_RADIUS = 40;

    var WIND_SWITCH_MS = 12000;
    var WIND_FORCE = 45;        // px/s added to horizontal speed

    var CHASER_DELAY_MS = 20000;
    var CHASER_SPEED = 170;     // 85% of the player's 200
    var CHASER_LEASH = 1000;    // further behind than this and it catches up

    var LEVEL_TIME_MS = 300000; // 5 minutes, the classic
    var TIME_WARNING_MS = 60000;

    var ROOF_PROBES = [20, 52, 84, 116];   // px above the player's head

    function profileWants(scene) {
        return !!(scene.difficultyProfile && scene.difficultyProfile.hazards);
    }

    function isActive(scene) {
        return !!(scene._hazards && scene._hazards.enabled);
    }

    /** Is there anything solid over the player's head right now? */
    function underRoof(scene) {
        var pl = scene.player;
        if (!pl || !pl.body || !scene.hasSolidTileAtPoint) return false;
        for (var i = 0; i < ROOF_PROBES.length; i++) {
            if (scene.hasSolidTileAtPoint(pl.x, pl.body.top - ROOF_PROBES[i])) return true;
        }
        return false;
    }

    function emit(scene, payload) {
        if (scene.events) scene.events.emit('hazard', payload);
    }

    function init(scene) {
        if (scene._hazards) cleanup(scene);
        if (!profileWants(scene)) { scene._hazards = { enabled: false }; return; }

        var h = {
            enabled: true,
            phase: 'calm',
            phaseMs: CALM_MS,
            rainTick: 0,
            boltMs: BOLT_EVERY_MS,
            bolt: null,
            windMs: WIND_SWITCH_MS,
            windDir: 1,
            chaserMs: CHASER_DELAY_MS,
            chaser: null,
            timeLeft: LEVEL_TIME_MS,
            timeUp: false,
            gfx: null,
            overlay: null
        };

        var cam = scene.cameras.main;
        h.overlay = scene.add.rectangle(0, 0, cam.width, cam.height, 0x101830, 0)
            .setOrigin(0).setScrollFactor(0).setDepth(1500);
        h.gfx = scene.add.graphics().setScrollFactor(0).setDepth(1501);

        h.drops = [];
        for (var i = 0; i < 90; i++) {
            h.drops.push({ x: Math.random() * cam.width, y: Math.random() * cam.height,
                           len: 10 + Math.random() * 14, spd: 620 + Math.random() * 420 });
        }

        scene._hazards = h;
        emit(scene, { type: 'enabled', timeLeft: h.timeLeft });
        emit(scene, { type: 'wind', dir: h.windDir, force: WIND_FORCE });
    }

    function cleanup(scene) {
        var h = scene._hazards;
        if (!h) return;
        if (h.gfx) h.gfx.destroy();
        if (h.overlay) h.overlay.destroy();
        if (h.chaser && h.chaser.active) h.chaser.destroy();
        scene._hazards = null;
    }

    function update(scene, delta) {
        var h = scene._hazards;
        if (!h || !h.enabled) return;
        if (scene.isDead || scene.levelComplete) return;
        if (!scene.player || !scene.player.body) return;

        // The HUD scene starts after GameScene, so it misses the wind event sent
        // from init(). Announce once more on the first frame, when it is listening.
        if (!h.windAnnounced) {
            h.windAnnounced = true;
            emit(scene, { type: 'wind', dir: h.windDir, force: WIND_FORCE });
        }

        updateStormCycle(scene, h, delta);
        updateWind(scene, h, delta);
        updateChaser(scene, h, delta);
        updateTimer(scene, h, delta);
        drawWeather(scene, h, delta);
    }

    // ── Storm: calm → warning → storm → calm ─────────────────────────────────
    function updateStormCycle(scene, h, delta) {
        h.phaseMs -= delta;

        if (h.phaseMs <= 0) {
            if (h.phase === 'calm') {
                h.phase = 'warning'; h.phaseMs = WARN_MS;
                emit(scene, { type: 'warning' });
                if (window.AudioManager) { try { AudioManager.play('bump'); } catch (e) {} }
            } else if (h.phase === 'warning') {
                h.phase = 'storm'; h.phaseMs = STORM_MS; h.rainTick = RAIN_GRACE_MS;
                h.boltMs = BOLT_EVERY_MS;
                emit(scene, { type: 'storm' });
            } else {
                h.phase = 'calm'; h.phaseMs = CALM_MS;
                h.bolt = null;
                emit(scene, { type: 'calm' });
            }
        }

        if (h.phase !== 'storm') return;

        // Rain: no roof, no mercy — but only once per tick, never instantly.
        h.rainTick -= delta;
        if (h.rainTick <= 0) {
            h.rainTick = RAIN_TICK_MS;
            if (!underRoof(scene)) {
                emit(scene, { type: 'soaked' });
                scene.playerHit();
                return;
            }
        }

        updateLightning(scene, h, delta);
    }

    /** A bolt shows its shadow on the ground for a second before it lands. */
    function updateLightning(scene, h, delta) {
        if (h.bolt) {
            h.bolt.ms -= delta;
            if (h.bolt.ms > 0) return;

            var pl = scene.player;
            var hit = Math.abs(pl.x - h.bolt.x) < BOLT_RADIUS && !underRoof(scene);
            emit(scene, { type: 'bolt', x: h.bolt.x, hit: hit });
            h.bolt = null;
            if (hit) {
                if (window.AudioManager) { try { AudioManager.play('bump'); } catch (e) {} }
                scene.playerHit();
            }
            return;
        }

        h.boltMs -= delta;
        if (h.boltMs > 0) return;
        h.boltMs = BOLT_EVERY_MS;

        // Aimed near the player, not at them: a dodgeable threat, not a punishment.
        var offset = (Math.random() * 260) - 130;
        h.bolt = { x: scene.player.x + offset, ms: BOLT_TELL_MS };
        emit(scene, { type: 'boltWarning', x: h.bolt.x });
    }

    // ── Wind ────────────────────────────────────────────────────────────────
    function updateWind(scene, h, delta) {
        h.windMs -= delta;
        if (h.windMs <= 0) {
            h.windMs = WIND_SWITCH_MS;
            h.windDir = -h.windDir;
            emit(scene, { type: 'wind', dir: h.windDir, force: WIND_FORCE });
        }
        // Applied after GameScene has set the frame's velocity, so it reads as a
        // steady push rather than fighting the controls.
        var body = scene.player.body;
        body.velocity.x += h.windDir * WIND_FORCE;
    }

    // ── Chaser ──────────────────────────────────────────────────────────────
    function updateChaser(scene, h, delta) {
        if (!window.Villains || !scene.enemies) return;

        if (!h.chaser) {
            h.chaserMs -= delta;
            if (h.chaserMs > 0) return;
            var spawnX = scene.player.x - 420;
            if (spawnX < 40) spawnX = 40;
            h.chaser = window.Villains.spawn(scene, 'boo', spawnX, scene.player.y);
            if (!h.chaser) return;
            h.chaser.chaseSpeed = CHASER_SPEED;
            h.chaser.isChaser = true;
            h.chaser.setAlpha(0.9);
            emit(scene, { type: 'chaser' });
            return;
        }

        if (!h.chaser.active) { h.chaser = null; h.chaserMs = CHASER_DELAY_MS; return; }

        // Do not let it fall so far behind that it stops mattering.
        if (scene.player.x - h.chaser.x > CHASER_LEASH) {
            h.chaser.x = scene.player.x - 600;
            h.chaser.y = scene.player.y - 40;
        }
    }

    // ── Level timer ─────────────────────────────────────────────────────────
    function updateTimer(scene, h, delta) {
        if (h.timeUp) return;
        h.timeLeft -= delta;
        if (h.timeLeft <= 0) {
            h.timeLeft = 0;
            h.timeUp = true;
            emit(scene, { type: 'timeup' });
            scene.playerHit();
            return;
        }
        emit(scene, { type: 'time', left: h.timeLeft, warning: h.timeLeft < TIME_WARNING_MS });
    }

    // ── Visuals ─────────────────────────────────────────────────────────────
    function drawWeather(scene, h, delta) {
        var cam = scene.cameras.main;
        var g = h.gfx;
        g.clear();

        if (h.phase === 'calm') { h.overlay.setAlpha(0); return; }

        if (h.phase === 'warning') {
            // Sky darkens over the three seconds, so it is impossible to miss
            var t = 1 - (h.phaseMs / WARN_MS);
            h.overlay.setAlpha(0.35 * t);
            return;
        }

        h.overlay.setAlpha(0.4);

        var slant = h.windDir * 6;
        g.lineStyle(2, 0xA8D8F8, 0.75);
        for (var i = 0; i < h.drops.length; i++) {
            var d = h.drops[i];
            d.y += d.spd * (delta / 1000);
            d.x += slant;
            if (d.y > cam.height) { d.y = -20; d.x = Math.random() * cam.width; }
            if (d.x > cam.width) d.x = 0;
            if (d.x < 0) d.x = cam.width;
            g.lineBetween(d.x, d.y, d.x - slant, d.y + d.len);
        }

        if (h.bolt) {
            // The tell: a bright column on the ground where it will land
            var sx = h.bolt.x - cam.scrollX;
            var warn = 1 - (h.bolt.ms / BOLT_TELL_MS);
            g.fillStyle(0xFFF080, 0.15 + 0.35 * warn);
            g.fillRect(sx - BOLT_RADIUS, 0, BOLT_RADIUS * 2, cam.height);
        }
    }

    window.Hazards = {
        init: init,
        update: update,
        cleanup: cleanup,
        isActive: isActive,
        underRoof: underRoof,
        TUNING: {
            CALM_MS: CALM_MS, WARN_MS: WARN_MS, STORM_MS: STORM_MS,
            RAIN_TICK_MS: RAIN_TICK_MS, WIND_FORCE: WIND_FORCE,
            CHASER_SPEED: CHASER_SPEED, LEVEL_TIME_MS: LEVEL_TIME_MS,
            BOLT_TELL_MS: BOLT_TELL_MS, BOLT_RADIUS: BOLT_RADIUS
        }
    };
})();
