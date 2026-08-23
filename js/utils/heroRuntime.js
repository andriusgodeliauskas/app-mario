/**
 * HeroRuntime — resolves the hero the player picked into the texture and
 * animation keys a scene needs.
 *
 * Three scenes put the player on screen (GameScene, WonderScene for levels
 * 43-52, and BonusRoomScene), and all three need the same answer. This is that
 * answer in one place, so a hero added to the registry shows up everywhere the
 * player does instead of only in the main levels.
 *
 *   HeroRuntime.resolve(this);          // sets this.heroKey, .heroBigKey, ...
 *   this.player.play(this.heroKey + '-idle');
 */
(function () {
    'use strict';

    var FALLBACK = { speedMul: 1, jumpMul: 1 };

    /**
     * Read the selection, validate it against the registry AND against the
     * textures that actually generated, and write the result onto `scene`.
     * Falls back to Mario at every step — a broken hero must never leave a
     * child with an invisible player.
     */
    /**
     * Stand-in used when heroPowers.js did not load. GameScene calls into
     * HeroPowers from its per-frame movement code, so a missing module would
     * otherwise throw on every single frame.
     */
    function installPowerFallback() {
        if (window.HeroPowers) return;
        console.warn('[HeroRuntime] HeroPowers missing — heroes will play without their powers.');
        window.HeroPowers = {
            reset: function () {},
            speedFactor: function () { return 1; },
            applyStop: function () { return false; },
            tryAirJump: function () { return false; },
            stompBounce: function (scene, base) { return base; },
            update: function () {}
        };
    }

    function resolve(scene) {
        installPowerFallback();
        var id = 'mario';
        if (window.CharacterSettings) id = window.CharacterSettings.selectedId();

        var ch = window.Characters ? window.Characters.byId(id) : null;
        if (!ch) { id = 'mario'; ch = window.Characters ? window.Characters.byId('mario') : null; }

        var key = (id === 'mario') ? 'mario' : 'hero-' + id;
        if (!scene.textures.exists(key)) {
            console.warn('[HeroRuntime] missing texture ' + key + ' — falling back to Mario');
            id = 'mario';
            key = 'mario';
            ch = window.Characters ? window.Characters.byId('mario') : null;
        }

        scene.heroId = id;
        scene.hero = ch;
        scene.heroKey = key;
        scene.heroBigKey = key + '-big';
        scene.heroPhysics = (ch && ch.physics) ? ch.physics : FALLBACK;
        return key;
    }

    /** Ensure resolve() has run, then hand back the small-form texture key. */
    function keyFor(scene) {
        if (!scene.heroKey) resolve(scene);
        return scene.heroKey;
    }

    /** Ensure resolve() has run, then hand back the big-form texture key. */
    function bigKeyFor(scene) {
        if (!scene.heroBigKey) resolve(scene);
        return scene.heroBigKey;
    }

    /**
     * Who sits in the cage. Rescuing yourself makes no sense, so a player who
     * IS Peach finds Daisy behind the bars instead.
     */
    function captiveKey(scene) {
        if (keyFor(scene) === 'hero-peach' && scene.textures.exists('hero-daisy')) return 'hero-daisy';
        return 'princess';
    }

    window.HeroRuntime = {
        resolve: resolve,
        keyFor: keyFor,
        bigKeyFor: bigKeyFor,
        captiveKey: captiveKey
    };
})();
