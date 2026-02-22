/**
 * MenuScene — Main menu screen with title, decorations, and level selection.
 * All sprites are generated in BootScene — no external assets needed.
 */

var MenuScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function MenuScene() {
        Phaser.Scene.call(this, { key: 'MenuScene' });
    },

    create: function () {
        var W = this.cameras.main.width;   // 800
        var H = this.cameras.main.height;  // 600
        var groundY = 536;
        var self = this;

        // ========================================
        // 1. SKY BACKGROUND
        // ========================================
        this.cameras.main.setBackgroundColor('#6B8CFF');

        // ========================================
        // 2. DECORATIVE BACKGROUND
        // ========================================
        this.add.image(-30, groundY, 'hill').setOrigin(0, 1).setScale(2.0, 1.4).setTint(0x70B870).setAlpha(0.7);
        this.add.image(350, groundY, 'hill').setOrigin(0, 1).setScale(1.4, 1.0).setTint(0x78C078).setAlpha(0.7);
        this.add.image(580, groundY, 'hill').setOrigin(0, 1).setScale(2.5, 1.7).setTint(0x70B870).setAlpha(0.7);

        this.add.image(0, groundY, 'hill').setOrigin(0, 1).setScale(2.0, 1.5).setTint(0x30A030);
        this.add.image(320, groundY, 'hill').setOrigin(0, 1).setScale(1.5, 1.1).setTint(0x28A028);
        this.add.image(530, groundY, 'hill').setOrigin(0, 1).setScale(2.5, 1.8).setTint(0x30A030);

        this.add.image(80, 60, 'cloud').setOrigin(0, 0).setScale(1.2);
        this.add.image(350, 80, 'cloud').setOrigin(0, 0).setScale(0.9);
        this.add.image(620, 40, 'cloud').setOrigin(0, 0).setScale(1.4);

        this.add.image(80, groundY - 8, 'bush').setOrigin(0, 1);
        this.add.image(600, groundY - 6, 'bush').setOrigin(0, 1).setScale(0.9);

        // ========================================
        // 3. GROUND
        // ========================================
        var tileSize = 32;
        for (var gx = 0; gx < W; gx += tileSize) {
            this.add.image(gx, groundY, 'tiles', 1).setOrigin(0, 0);
            this.add.image(gx, groundY + tileSize, 'tiles', 2).setOrigin(0, 0);
        }

        // ========================================
        // 4. TITLE
        // ========================================
        var panelGraphics = this.add.graphics();
        panelGraphics.fillStyle(0x000000, 0.55);
        panelGraphics.fillRoundedRect(W / 2 - 240, 20, 480, 110, 12);
        panelGraphics.lineStyle(4, 0xF8B800, 1);
        panelGraphics.strokeRoundedRect(W / 2 - 240, 20, 480, 110, 12);

        this.add.text(W / 2 + 3, 53, 'SUPER', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '36px',
            color: '#B01010'
        }).setOrigin(0.5);
        this.add.text(W / 2, 50, 'SUPER', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '36px',
            color: '#E8261C'
        }).setOrigin(0.5);

        this.add.text(W / 2 + 3, 93, 'MARIO', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '36px',
            color: '#A08000'
        }).setOrigin(0.5);
        this.add.text(W / 2, 90, 'MARIO', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '36px',
            color: '#F8D830'
        }).setOrigin(0.5);

        this.add.text(W / 2, 122, 'Learn English Adventure', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        // ========================================
        // 5. LEVEL SELECTION — "Pasirink lygį"
        // ========================================
        this.add.text(W / 2, 155, 'PASIRINK LYGI:', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '12px',
            color: '#F8D830'
        }).setOrigin(0.5);

        var levels = [
            { num: 1, name: 'GRASSLAND',   lt: 'Pieva',     color: 0x30A030, bgColor: '#6B8CFF', icon: 'hill' },
            { num: 2, name: 'UNDERGROUND',  lt: 'Požemis',   color: 0x8B6914, bgColor: '#000000', icon: 'tiles' },
            { num: 3, name: 'SKY',          lt: 'Dangus',    color: 0x9494FF, bgColor: '#9494FF', icon: 'cloud' },
            { num: 4, name: 'CASTLE',       lt: 'Pilis',     color: 0x666666, bgColor: '#1A0A1E', icon: 'tiles' }
        ];

        var cardW = 160;
        var cardH = 140;
        var gapX = 20;
        var gapY = 15;
        var startX = W / 2 - cardW - gapX / 2;
        var startY = 175;

        for (var i = 0; i < levels.length; i++) {
            var lv = levels[i];
            var col = i % 2;
            var row = Math.floor(i / 2);
            var cx = startX + col * (cardW + gapX) + cardW / 2;
            var cy = startY + row * (cardH + gapY) + cardH / 2;

            this.createLevelCard(cx, cy, cardW, cardH, lv);
        }

        // ========================================
        // 6. DECORATIVE SPRITES
        // ========================================
        this.add.sprite(W / 2 - 230, 90, 'star', 0).setOrigin(0.5).play('star-flash');
        this.add.sprite(W / 2 + 230, 90, 'star', 0).setOrigin(0.5).play('star-flash');

        // Mario on ground
        this.add.sprite(W / 2, groundY - 16, 'mario', 0).setOrigin(0.5, 1).play('mario-idle');

        // Decorative coins
        var coinPos = [{ x: W / 2 - 260, y: 50 }, { x: W / 2 + 260, y: 50 }];
        for (var ci = 0; ci < coinPos.length; ci++) {
            var coinSpr = this.add.sprite(coinPos[ci].x, coinPos[ci].y, 'coin', 0)
                .setOrigin(0.5).play('coin-spin');
            this.tweens.add({
                targets: coinSpr,
                y: coinPos[ci].y - 6,
                duration: 600 + ci * 100,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // ========================================
        // 7. FOOTER
        // ========================================
        this.add.text(W / 2, H - 16, '2026 mario.godeliauskas.com', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px',
            color: '#666666'
        }).setOrigin(0.5);

        // Blinking prompt
        this.promptText = this.add.text(W / 2, groundY - 40, 'Pasirink lygi auksciau!', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px',
            color: '#888888'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: this.promptText,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.isStarting = false;
        console.log('[MenuScene] Menu created successfully.');
    },

    // ==========================================
    // CREATE LEVEL CARD
    // ==========================================
    createLevelCard: function (cx, cy, w, h, levelInfo) {
        var self = this;
        var g = this.add.graphics();

        // Card shadow
        g.fillStyle(0x000000, 0.4);
        g.fillRoundedRect(cx - w / 2 + 3, cy - h / 2 + 3, w, h, 10);

        // Card background
        g.fillStyle(0x1A1A3A, 0.9);
        g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);

        // Color stripe at top
        g.fillStyle(levelInfo.color, 1);
        g.fillRoundedRect(cx - w / 2, cy - h / 2, w, 32, { tl: 10, tr: 10, bl: 0, br: 0 });

        // Level number
        this.add.text(cx, cy - h / 2 + 16, 'WORLD 1-' + levelInfo.num, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '10px',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        // Level name (English)
        this.add.text(cx, cy + 5, levelInfo.name, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '10px',
            color: '#F8D830'
        }).setOrigin(0.5);

        // Level name (Lithuanian)
        this.add.text(cx, cy + 25, levelInfo.lt, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px',
            color: '#AAAAAA'
        }).setOrigin(0.5);

        // Decorative icon on card
        if (levelInfo.icon === 'hill') {
            this.add.image(cx, cy - 18, 'hill').setScale(0.3).setTint(levelInfo.color);
        } else if (levelInfo.icon === 'cloud') {
            this.add.image(cx, cy - 18, 'cloud').setScale(0.5);
        } else {
            var frame = levelInfo.num === 2 ? 3 : 11;
            this.add.image(cx, cy - 18, 'tiles', frame).setScale(0.8);
        }

        // "PLAY" text
        this.add.text(cx, cy + h / 2 - 22, 'ZAISTI', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '10px',
            color: '#30FF30'
        }).setOrigin(0.5);

        // Hover border graphics (separate so we can show/hide)
        var hoverG = this.add.graphics();
        hoverG.setVisible(false);
        hoverG.lineStyle(3, 0xF8D830, 1);
        hoverG.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);

        // Interactive zone
        var zone = this.add.zone(cx, cy, w, h).setInteractive({ useHandCursor: true });

        zone.on('pointerover', function () {
            hoverG.setVisible(true);
        });
        zone.on('pointerout', function () {
            hoverG.setVisible(false);
        });
        zone.on('pointerdown', function () {
            self.startLevel(levelInfo.num);
        });
    },

    // ==========================================
    // START SPECIFIC LEVEL
    // ==========================================
    startLevel: function (levelNum) {
        if (this.isStarting) return;
        this.isStarting = true;

        if (window.AudioManager) AudioManager.init();

        var self = this;
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', function () {
            self.scene.start('GameScene', { level: levelNum });
        });
    },

    update: function () {
        // No per-frame logic needed
    }
});

// Attach to window for global access
window.MenuScene = MenuScene;
