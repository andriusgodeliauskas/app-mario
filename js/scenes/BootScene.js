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

    createAnimations: function () {
        var anims = this.anims;

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
