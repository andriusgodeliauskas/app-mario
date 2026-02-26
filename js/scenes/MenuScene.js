/**
 * MenuScene — Main menu screen with title, decorations, and 9-level selection.
 * All sprites are generated in BootScene — no external assets needed.
 * Cookie-based progress: levels unlock sequentially.
 */

// Cookie progress helper
window.GameProgress = {
    getMaxLevel: function() {
        var match = document.cookie.match(/marioMaxLevel=(\d+)/);
        return match ? parseInt(match[1]) : 1;
    },
    unlockLevel: function(level) {
        var current = this.getMaxLevel();
        if (level > current) {
            document.cookie = 'marioMaxLevel=' + level + ';path=/;max-age=31536000';
        }
    }
};

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
        this.add.image(-30, groundY, 'hill').setOrigin(0, 1).setScale(1.0, 0.7).setTint(0x70B870).setAlpha(0.7);
        this.add.image(350, groundY, 'hill').setOrigin(0, 1).setScale(0.7, 0.5).setTint(0x78C078).setAlpha(0.7);
        this.add.image(580, groundY, 'hill').setOrigin(0, 1).setScale(1.25, 0.85).setTint(0x70B870).setAlpha(0.7);

        this.add.image(0, groundY, 'hill').setOrigin(0, 1).setScale(1.0, 0.75).setTint(0x30A030);
        this.add.image(320, groundY, 'hill').setOrigin(0, 1).setScale(0.75, 0.55).setTint(0x28A028);
        this.add.image(530, groundY, 'hill').setOrigin(0, 1).setScale(1.25, 0.9).setTint(0x30A030);

        this.add.image(80, 60, 'cloud').setOrigin(0, 0).setScale(0.6);
        this.add.image(350, 80, 'cloud').setOrigin(0, 0).setScale(0.45);
        this.add.image(620, 40, 'cloud').setOrigin(0, 0).setScale(0.7);

        this.add.image(80, groundY - 8, 'bush').setOrigin(0, 1).setScale(0.5);
        this.add.image(600, groundY - 6, 'bush').setOrigin(0, 1).setScale(0.45);

        // ========================================
        // 3. GROUND
        // ========================================
        var tileSize = 32;
        for (var gx = 0; gx < W; gx += tileSize) {
            this.add.image(gx, groundY, 'tiles', 1).setOrigin(0, 0).setScale(0.5);
            this.add.image(gx, groundY + tileSize, 'tiles', 2).setOrigin(0, 0).setScale(0.5);
        }

        // ========================================
        // 4. TITLE (compact)
        // ========================================
        var panelGraphics = this.add.graphics();
        panelGraphics.fillStyle(0x000000, 0.55);
        panelGraphics.fillRoundedRect(W / 2 - 240, 15, 480, 105, 12);
        panelGraphics.lineStyle(4, 0xF8B800, 1);
        panelGraphics.strokeRoundedRect(W / 2 - 240, 15, 480, 105, 12);

        this.add.text(W / 2 + 3, 48, 'SUPER', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '36px',
            color: '#B01010'
        }).setOrigin(0.5);
        this.add.text(W / 2, 45, 'SUPER', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '36px',
            color: '#E8261C'
        }).setOrigin(0.5);

        this.add.text(W / 2 + 3, 83, 'MARIO', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '36px',
            color: '#A08000'
        }).setOrigin(0.5);
        this.add.text(W / 2, 80, 'MARIO', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '36px',
            color: '#F8D830'
        }).setOrigin(0.5);

        this.add.text(W / 2, 112, 'Learn English Adventure', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        // ========================================
        // 5. LEVEL SELECTION — "Pasirink lygi"
        // ========================================
        this.add.text(W / 2, 148, 'PASIRINK LYGI:', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '12px',
            color: '#F8D830'
        }).setOrigin(0.5);

        var levels = [
            { num: 1, name: 'GRASSLAND',   lt: 'Pieva',       color: 0x30A030, icon: 'hill' },
            { num: 2, name: 'UNDERGROUND', lt: 'Pozemis',      color: 0x8B6914, icon: 'tiles' },
            { num: 3, name: 'SKY',         lt: 'Dangus',       color: 0x9494FF, icon: 'cloud' },
            { num: 4, name: 'CASTLE',      lt: 'Pilis',        color: 0x666666, icon: 'tiles' },
            { num: 5, name: 'BEACH',       lt: 'Papludimys',   color: 0x44BBDD, icon: 'cloud' },
            { num: 6, name: 'FOREST',      lt: 'Miskas',       color: 0x1B7A1B, icon: 'hill' },
            { num: 7, name: 'DESERT',      lt: 'Dykuma',       color: 0xD4A030, icon: 'tiles' },
            { num: 8, name: 'SNOW',        lt: 'Sniegas',      color: 0xB0D0E8, icon: 'cloud' },
            { num: 9, name: 'VOLCANO',     lt: 'Ugnikalnis',   color: 0xCC2200, icon: 'tiles' }
        ];

        var cardW = 130;
        var cardH = 95;
        var gapX = 15;
        var gapY = 10;
        var startX = W / 2 - (cardW * 3 + gapX * 2) / 2;
        var startY = 165;

        for (var i = 0; i < levels.length; i++) {
            var lv = levels[i];
            var col = i % 3;
            var row = Math.floor(i / 3);
            var cx = startX + col * (cardW + gapX) + cardW / 2;
            var cy = startY + row * (cardH + gapY) + cardH / 2;

            this.createLevelCard(cx, cy, cardW, cardH, lv);
        }

        // ========================================
        // 6. DECORATIVE SPRITES
        // ========================================
        this.add.sprite(W / 2 - 230, 90, 'star', 0).setOrigin(0.5).setScale(0.25).play('star-flash');
        this.add.sprite(W / 2 + 230, 90, 'star', 0).setOrigin(0.5).setScale(0.25).play('star-flash');

        // Mario on ground
        this.add.sprite(W / 2, groundY - 16, 'mario', 0).setOrigin(0.5, 1).setScale(0.25).play('mario-idle');

        // Decorative coins
        var coinPos = [{ x: W / 2 - 260, y: 50 }, { x: W / 2 + 260, y: 50 }];
        for (var ci = 0; ci < coinPos.length; ci++) {
            var coinSpr = this.add.sprite(coinPos[ci].x, coinPos[ci].y, 'coin', 0)
                .setOrigin(0.5).setScale(0.25).play('coin-spin');
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
        var maxLevel = window.GameProgress.getMaxLevel();
        var isLocked = levelInfo.num > maxLevel;
        var g = this.add.graphics();

        // Card shadow
        g.fillStyle(0x000000, 0.4);
        g.fillRoundedRect(cx - w / 2 + 3, cy - h / 2 + 3, w, h, 10);

        // Card background
        if (isLocked) {
            g.fillStyle(0x0A0A1A, 0.9);
        } else {
            g.fillStyle(0x1A1A3A, 0.9);
        }
        g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);

        // Color stripe at top
        if (isLocked) {
            g.fillStyle(0x444444, 1);
        } else {
            g.fillStyle(levelInfo.color, 1);
        }
        g.fillRoundedRect(cx - w / 2, cy - h / 2, w, 24, { tl: 10, tr: 10, bl: 0, br: 0 });

        // Level number
        this.add.text(cx, cy - h / 2 + 12, 'WORLD 1-' + levelInfo.num, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px',
            color: isLocked ? '#888888' : '#FFFFFF'
        }).setOrigin(0.5);

        if (isLocked) {
            // Locked card content
            this.add.text(cx, cy + 2, 'UZRAKINTA', {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '8px',
                color: '#666666'
            }).setOrigin(0.5);

            this.add.text(cx, cy + h / 2 - 16, 'LOCKED', {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '8px',
                color: '#555555'
            }).setOrigin(0.5);
        } else {
            // Level name (English)
            this.add.text(cx, cy + 2, levelInfo.name, {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '8px',
                color: '#F8D830'
            }).setOrigin(0.5);

            // Level name (Lithuanian)
            this.add.text(cx, cy + 18, levelInfo.lt, {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '7px',
                color: '#AAAAAA'
            }).setOrigin(0.5);

            // Decorative icon on card
            if (levelInfo.icon === 'hill') {
                this.add.image(cx, cy - 14, 'hill').setScale(0.125).setTint(levelInfo.color);
            } else if (levelInfo.icon === 'cloud') {
                this.add.image(cx, cy - 14, 'cloud').setScale(0.2);
            } else {
                var frame = levelInfo.num === 2 ? 3 : 11;
                this.add.image(cx, cy - 14, 'tiles', frame).setScale(0.35);
            }

            // "PLAY" text
            this.add.text(cx, cy + h / 2 - 16, 'ZAISTI', {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '8px',
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
        }
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
