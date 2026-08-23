/**
 * BootScene — Generates all sprites and creates animations
 * No external assets loaded; everything is drawn via Canvas API.
 */

var BootScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function BootScene() {
        Phaser.Scene.call(this, { key: 'BootScene' });
    },

    preload: function () {
        // Show loading text
        var w = this.cameras.main.width;
        var h = this.cameras.main.height;
        this.loadingText = this.add.text(w / 2, h / 2, 'Loading...', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '16px',
            color: '#F8D830'
        }).setOrigin(0.5);
    },

    create: function () {
        // ----------------------------
        // 1. Generate all sprites
        // ----------------------------
        SpriteGenerator.generateAll(this);

        // ----------------------------
        // 2. Create all animations
        // ----------------------------
        this.createAnimations();

        // ----------------------------
        // 3. Start MenuScene
        // ----------------------------
        if (this.loadingText) {
            this.loadingText.destroy();
        }
        this.scene.start('MenuScene');
    },


    /**
     * Build idle/run/jump/death (and big idle/run/jump) for every registry
     * hero. Skips Mario: his textures come from sprites.js under the legacy
     * 'mario' keys, which the animations below already cover.
     */
/**
     * Villain animations. Every villain sheet is walk1/walk2/squished, so one
     * loop covers all of them; Boo's third frame is "shy" (he cannot be
     * stomped) and gets its own key alongside the shared one.
     */
    createVillainAnimations: function () {
        var anims = this.anims;
        var self = this;
        var types = window.Villains ? Object.keys(window.Villains.TILE_CODES).map(function (k) {
            return window.Villains.TILE_CODES[k];
        }) : [];

        types.forEach(function (type) {
            if (!self.textures.exists(type)) {
                console.warn('[BootScene] missing villain texture ' + type);
                return;
            }
            anims.create({ key: type + '-walk', frames: anims.generateFrameNumbers(type, { start: 0, end: 1 }), frameRate: 5, repeat: -1 });
            anims.create({ key: type + '-squish', frames: [{ key: type, frame: 2 }], frameRate: 1, repeat: 0 });
        });

        if (this.textures.exists('boo')) {
            anims.create({ key: 'boo-shy', frames: [{ key: 'boo', frame: 2 }], frameRate: 1, repeat: -1 });
        }
        if (this.textures.exists('dk-barrel')) {
            anims.create({ key: 'dk-barrel-roll', frames: anims.generateFrameNumbers('dk-barrel', { start: 0, end: 1 }), frameRate: 12, repeat: -1 });
        }
    },

    createHeroAnimations: function () {
        var anims = this.anims;
        var Chars = window.Characters;
        if (!Chars) return;

        Chars.LIST.forEach(function (ch) {
            if (ch.id === 'mario') return;

            var key = 'hero-' + ch.id;
            var bigKey = key + '-big';
            if (!this.textures.exists(key)) {
                console.warn('[BootScene] missing texture for hero ' + ch.id);
                return;
            }

            anims.create({ key: key + '-idle', frames: [{ key: key, frame: 0 }], frameRate: 1, repeat: -1 });
            anims.create({ key: key + '-run', frames: anims.generateFrameNumbers(key, { start: 0, end: 2 }), frameRate: 10, repeat: -1 });
            anims.create({ key: key + '-jump', frames: [{ key: key, frame: 3 }], frameRate: 1, repeat: 0 });
            anims.create({ key: key + '-death', frames: [{ key: key, frame: 4 }], frameRate: 1, repeat: 0 });

            if (!this.textures.exists(bigKey)) return;
            anims.create({ key: bigKey + '-idle', frames: [{ key: bigKey, frame: 0 }], frameRate: 1, repeat: -1 });
            anims.create({ key: bigKey + '-run', frames: anims.generateFrameNumbers(bigKey, { start: 0, end: 2 }), frameRate: 10, repeat: -1 });
            anims.create({ key: bigKey + '-jump', frames: [{ key: bigKey, frame: 3 }], frameRate: 1, repeat: 0 });
        }, this);
    },

    createAnimations: function () {
        var anims = this.anims;

        // ========================================
        // HERO ANIMATIONS (one set per playable character)
        // ========================================
        // Every hero sheet has Mario's exact frame layout, so the same frame
        // ranges work for all of them. Mario himself keeps the original
        // 'mario' / 'mario-big' keys defined below — his sheet is hand-drawn
        // in sprites.js, not generated from the registry.
        this.createHeroAnimations();
        this.createVillainAnimations();

        // ========================================
        // MARIO (small) ANIMATIONS
        // ========================================

        // mario-idle: frame 0 (standing)
        anims.create({
            key: 'mario-idle',
            frames: [{ key: 'mario', frame: 0 }],
            frameRate: 1,
            repeat: -1
        });

        // mario-run: frames 0, 1, 2 (standing, legs apart, legs together)
        anims.create({
            key: 'mario-run',
            frames: anims.generateFrameNumbers('mario', { start: 0, end: 2 }),
            frameRate: 10,
            repeat: -1
        });

        // mario-jump: frame 3 (arms up)
        anims.create({
            key: 'mario-jump',
            frames: [{ key: 'mario', frame: 3 }],
            frameRate: 1,
            repeat: 0
        });

        // mario-death: frame 4 (X eyes)
        anims.create({
            key: 'mario-death',
            frames: [{ key: 'mario', frame: 4 }],
            frameRate: 1,
            repeat: 0
        });

        // ========================================
        // RUNNER MARIO (back view) ANIMATIONS
        // ========================================
        anims.create({
            key: 'mario-runner-idle',
            frames: [{ key: 'mario-runner', frame: 0 }],
            frameRate: 1,
            repeat: -1
        });

        anims.create({
            key: 'mario-runner-run',
            frames: anims.generateFrameNumbers('mario-runner', { start: 0, end: 2 }),
            frameRate: 10,
            repeat: -1
        });

        anims.create({
            key: 'mario-runner-jump',
            frames: [{ key: 'mario-runner', frame: 3 }],
            frameRate: 1,
            repeat: 0
        });

        // ========================================
        // BIG MARIO ANIMATIONS
        // ========================================

        // mario-big-idle
        anims.create({
            key: 'mario-big-idle',
            frames: [{ key: 'mario-big', frame: 0 }],
            frameRate: 1,
            repeat: -1
        });

        // mario-big-run: frames 0, 1, 2
        anims.create({
            key: 'mario-big-run',
            frames: anims.generateFrameNumbers('mario-big', { start: 0, end: 2 }),
            frameRate: 10,
            repeat: -1
        });

        // mario-big-jump: frame 3
        anims.create({
            key: 'mario-big-jump',
            frames: [{ key: 'mario-big', frame: 3 }],
            frameRate: 1,
            repeat: 0
        });

        // ========================================
        // COIN ANIMATION
        // ========================================

        // coin-spin: 4 frames for spinning
        anims.create({
            key: 'coin-spin',
            frames: anims.generateFrameNumbers('coin', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        // ========================================
        // GOOMBA ANIMATIONS
        // ========================================

        // goomba-walk: frames 0, 1
        anims.create({
            key: 'goomba-walk',
            frames: anims.generateFrameNumbers('goomba', { start: 0, end: 1 }),
            frameRate: 4,
            repeat: -1
        });

        // goomba-squish: frame 2
        anims.create({
            key: 'goomba-squish',
            frames: [{ key: 'goomba', frame: 2 }],
            frameRate: 1,
            repeat: 0
        });

        // ========================================
        // KOOPA ANIMATIONS
        // ========================================

        // koopa-walk: frames 0, 1
        anims.create({
            key: 'koopa-walk',
            frames: anims.generateFrameNumbers('koopa', { start: 0, end: 1 }),
            frameRate: 4,
            repeat: -1
        });

        // koopa-shell: frame 2 (stationary shell)
        anims.create({
            key: 'koopa-shell',
            frames: [{ key: 'koopa', frame: 2 }],
            frameRate: 1,
            repeat: 0
        });

        // koopa-shell-spin: frames 2, 3 (spinning shell)
        anims.create({
            key: 'koopa-shell-spin',
            frames: anims.generateFrameNumbers('koopa', { start: 2, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        var wonderEnemyKeys = [
            'wonder-plains-walker', 'wonder-cloud-puff', 'wonder-glow-crawler',
            'wonder-depths-fish', 'wonder-depths-crab', 'wonder-neon-bot',
            'wonder-ice-penguin', 'wonder-sand-crab', 'wonder-windup-bot',
            'wonder-metal-bug', 'wonder-mirror-creature'
        ];
        for (var wi = 0; wi < wonderEnemyKeys.length; wi++) {
            anims.create({
                key: wonderEnemyKeys[wi] + '-walk',
                frames: anims.generateFrameNumbers(wonderEnemyKeys[wi], { start: 0, end: 1 }),
                frameRate: 4,
                repeat: -1
            });
            anims.create({
                key: wonderEnemyKeys[wi] + '-squish',
                frames: [{ key: wonderEnemyKeys[wi], frame: 2 }],
                frameRate: 1,
                repeat: 0
            });
        }
        anims.create({
            key: 'wonder-shell-enemy-walk',
            frames: anims.generateFrameNumbers('wonder-shell-enemy', { start: 0, end: 1 }),
            frameRate: 4,
            repeat: -1
        });
        anims.create({
            key: 'wonder-shell-enemy-shell',
            frames: [{ key: 'wonder-shell-enemy', frame: 2 }],
            frameRate: 1,
            repeat: 0
        });
        anims.create({
            key: 'wonder-shell-enemy-spin',
            frames: anims.generateFrameNumbers('wonder-shell-enemy', { start: 2, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        // ========================================
        // STAR ANIMATION
        // ========================================

        // star-flash: 4 frames flashing
        anims.create({
            key: 'star-flash',
            frames: anims.generateFrameNumbers('star', { start: 0, end: 3 }),
            frameRate: 6,
            repeat: -1
        });

        // ========================================
        // MUSHROOM ANIMATION (single frame, but define for consistency)
        // ========================================
        anims.create({
            key: 'mushroom-idle',
            frames: [{ key: 'mushroom', frame: 0 }],
            frameRate: 1,
            repeat: 0
        });

        // ========================================
        // FIREBALL ANIMATION
        // ========================================
        anims.create({
            key: 'fireball-spin',
            frames: anims.generateFrameNumbers('fireball', { start: 0, end: 1 }),
            frameRate: 10,
            repeat: -1
        });

        // ========================================
        // BOWSER ANIMATIONS
        // ========================================
        anims.create({
            key: 'bowser-walk',
            frames: anims.generateFrameNumbers('bowser', { start: 0, end: 1 }),
            frameRate: 3,
            repeat: -1
        });

        anims.create({
            key: 'bowser-idle',
            frames: [{ key: 'bowser', frame: 0 }],
            frameRate: 1,
            repeat: -1
        });

        // ========================================
        // PRINCESS (single frame)
        // ========================================
        anims.create({
            key: 'princess-idle',
            frames: [{ key: 'princess', frame: 0 }],
            frameRate: 1,
            repeat: 0
        });

        // ========================================
        // FLAGPOLE (single frame)
        // ========================================
        anims.create({
            key: 'flagpole-idle',
            frames: [{ key: 'flagpole', frame: 0 }],
            frameRate: 1,
            repeat: 0
        });

        console.log('[BootScene] All animations created successfully.');
    }
});

// Attach to window for global access
window.BootScene = BootScene;
