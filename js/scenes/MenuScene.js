/**
 * MenuScene — Main menu screen with title, decorations, and start button.
 * Matches the mockup.html drawMenuScreen() design.
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
        var groundY = 536; // ground starts here (bottom 64px)

        // ========================================
        // 1. SKY BACKGROUND — solid NES blue
        // ========================================
        this.cameras.main.setBackgroundColor('#6B8CFF');

        // ========================================
        // 2. DECORATIVE BACKGROUND — hills, clouds, bushes
        // ========================================

        // Far hills (larger, lighter feel via tint)
        this.add.image(-30, groundY, 'hill').setOrigin(0, 1).setScale(2.0, 1.4).setTint(0x70B870).setAlpha(0.7);
        this.add.image(350, groundY, 'hill').setOrigin(0, 1).setScale(1.4, 1.0).setTint(0x78C078).setAlpha(0.7);
        this.add.image(580, groundY, 'hill').setOrigin(0, 1).setScale(2.5, 1.7).setTint(0x70B870).setAlpha(0.7);

        // Near hills (more saturated)
        this.add.image(0, groundY, 'hill').setOrigin(0, 1).setScale(2.0, 1.5).setTint(0x30A030);
        this.add.image(320, groundY, 'hill').setOrigin(0, 1).setScale(1.5, 1.1).setTint(0x28A028);
        this.add.image(530, groundY, 'hill').setOrigin(0, 1).setScale(2.5, 1.8).setTint(0x30A030);

        // Clouds
        this.add.image(80, 60, 'cloud').setOrigin(0, 0).setScale(1.2);
        this.add.image(350, 80, 'cloud').setOrigin(0, 0).setScale(0.9);
        this.add.image(620, 40, 'cloud').setOrigin(0, 0).setScale(1.4);
        this.add.image(200, 100, 'cloud').setOrigin(0, 0).setScale(0.7).setAlpha(0.6);
        this.add.image(500, 55, 'cloud').setOrigin(0, 0).setScale(1.0).setAlpha(0.5);

        // Bushes at ground level
        this.add.image(80, groundY - 8, 'bush').setOrigin(0, 1);
        this.add.image(370, groundY - 8, 'bush').setOrigin(0, 1);
        this.add.image(600, groundY - 6, 'bush').setOrigin(0, 1).setScale(0.9);

        // ========================================
        // 3. GROUND — rows of ground tiles at bottom
        // ========================================
        // Top row: ground-top tiles (frame 1), bottom row: ground-body (frame 2)
        var tileSize = 32;
        for (var gx = 0; gx < W; gx += tileSize) {
            this.add.image(gx, groundY, 'tiles', 1).setOrigin(0, 0);
            this.add.image(gx, groundY + tileSize, 'tiles', 2).setOrigin(0, 0);
        }

        // ========================================
        // 4. PIPES — decorative pipes using pipe tiles
        // ========================================
        // Left small pipe (2 tiles wide, 2 rows tall)
        this.add.image(30, groundY - tileSize, 'tiles', 6).setOrigin(0, 0);
        this.add.image(30 + tileSize, groundY - tileSize, 'tiles', 7).setOrigin(0, 0);
        this.add.image(30, groundY, 'tiles', 8).setOrigin(0, 0).setDepth(1);
        this.add.image(30 + tileSize, groundY, 'tiles', 9).setOrigin(0, 0).setDepth(1);

        // Right taller pipe (2 tiles wide, 3 rows tall)
        this.add.image(660, groundY - tileSize * 3, 'tiles', 6).setOrigin(0, 0);
        this.add.image(660 + tileSize, groundY - tileSize * 3, 'tiles', 7).setOrigin(0, 0);
        this.add.image(660, groundY - tileSize * 2, 'tiles', 8).setOrigin(0, 0);
        this.add.image(660 + tileSize, groundY - tileSize * 2, 'tiles', 9).setOrigin(0, 0);
        this.add.image(660, groundY - tileSize, 'tiles', 8).setOrigin(0, 0);
        this.add.image(660 + tileSize, groundY - tileSize, 'tiles', 9).setOrigin(0, 0);
        this.add.image(660, groundY, 'tiles', 8).setOrigin(0, 0).setDepth(1);
        this.add.image(660 + tileSize, groundY, 'tiles', 9).setOrigin(0, 0).setDepth(1);

        // ========================================
        // 5. TITLE — "SUPER MARIO" in Press Start 2P
        // ========================================

        // Title background panel (semi-transparent dark box with gold border)
        var panelGraphics = this.add.graphics();
        // Shadow/fill
        panelGraphics.fillStyle(0x000000, 0.55);
        panelGraphics.fillRoundedRect(W / 2 - 240, 85, 480, 130, 12);
        // Gold border
        panelGraphics.lineStyle(4, 0xF8B800, 1);
        panelGraphics.strokeRoundedRect(W / 2 - 240, 85, 480, 130, 12);

        // "SUPER" text — red with dark shadow
        this.add.text(W / 2 + 3, 128 + 3, 'SUPER', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '42px',
            color: '#B01010'
        }).setOrigin(0.5);

        this.add.text(W / 2, 128, 'SUPER', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '42px',
            color: '#E8261C'
        }).setOrigin(0.5);

        // "MARIO" text — gold with dark shadow
        this.add.text(W / 2 + 3, 178 + 3, 'MARIO', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '42px',
            color: '#A08000'
        }).setOrigin(0.5);

        this.add.text(W / 2, 178, 'MARIO', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '42px',
            color: '#F8D830'
        }).setOrigin(0.5);

        // ========================================
        // 6. SUBTITLE — "Learn English Adventure"
        // ========================================
        this.add.text(W / 2, 208, 'Learn English Adventure', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '10px',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        // ========================================
        // 7. START BUTTON — Red rounded rectangle, interactive
        // ========================================
        var btnY = 270;
        var btnW = 208;
        var btnH = 50;
        var btnX = W / 2 - btnW / 2;

        // Button shadow
        var btnGraphics = this.add.graphics();
        btnGraphics.fillStyle(0xB01010, 1);
        btnGraphics.fillRoundedRect(btnX - 2, btnY + 3, btnW + 4, btnH + 2, 8);

        // Button main body
        btnGraphics.fillStyle(0xE8261C, 1);
        btnGraphics.fillRoundedRect(btnX, btnY, btnW, btnH, 8);

        // Button highlight (top half shine)
        btnGraphics.fillStyle(0xFFFFFF, 0.2);
        btnGraphics.fillRoundedRect(btnX + 4, btnY + 2, btnW - 8, btnH / 2 - 3, 6);

        // "START" text on button
        this.add.text(W / 2, btnY + btnH / 2, 'START', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '18px',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        // Invisible interactive zone over the button
        var startBtn = this.add.zone(W / 2, btnY + btnH / 2, btnW + 10, btnH + 10)
            .setInteractive({ useHandCursor: true });

        var self = this;
        startBtn.on('pointerdown', function () {
            self.startGame();
        });

        // Hover effect: make button slightly brighter
        startBtn.on('pointerover', function () {
            btnGraphics.clear();
            // Shadow
            btnGraphics.fillStyle(0xB01010, 1);
            btnGraphics.fillRoundedRect(btnX - 2, btnY + 3, btnW + 4, btnH + 2, 8);
            // Brighter red
            btnGraphics.fillStyle(0xFF3030, 1);
            btnGraphics.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
            // Highlight
            btnGraphics.fillStyle(0xFFFFFF, 0.3);
            btnGraphics.fillRoundedRect(btnX + 4, btnY + 2, btnW - 8, btnH / 2 - 3, 6);
        });

        startBtn.on('pointerout', function () {
            btnGraphics.clear();
            // Shadow
            btnGraphics.fillStyle(0xB01010, 1);
            btnGraphics.fillRoundedRect(btnX - 2, btnY + 3, btnW + 4, btnH + 2, 8);
            // Normal red
            btnGraphics.fillStyle(0xE8261C, 1);
            btnGraphics.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
            // Highlight
            btnGraphics.fillStyle(0xFFFFFF, 0.2);
            btnGraphics.fillRoundedRect(btnX + 4, btnY + 2, btnW - 8, btnH / 2 - 3, 6);
        });

        // ========================================
        // 8. DECORATIVE SPRITES
        // ========================================

        // Mario standing on ground
        this.add.sprite(W / 2 - 64, groundY - 16, 'mario', 0)
            .setOrigin(0.5, 1)
            .play('mario-idle');

        // Mushroom near Mario
        this.add.image(W / 2 + 40, groundY - 16, 'mushroom', 0)
            .setOrigin(0.5, 1);

        // Star decoration on the left
        this.add.sprite(W / 2 - 120, groundY - 20, 'star', 0)
            .setOrigin(0.5, 1)
            .play('star-flash');

        // Decorative coins around title with bounce animation
        var coinPositions = [
            { x: W / 2 - 200, y: 120 },
            { x: W / 2 + 200, y: 120 },
            { x: W / 2 - 200, y: 170 },
            { x: W / 2 + 200, y: 170 }
        ];

        this.coins = [];
        for (var i = 0; i < coinPositions.length; i++) {
            var coin = this.add.sprite(coinPositions[i].x, coinPositions[i].y, 'coin', 0)
                .setOrigin(0.5)
                .play('coin-spin');
            this.coins.push(coin);

            // Simple coin bounce tween
            this.tweens.add({
                targets: coin,
                y: coinPositions[i].y - 6,
                duration: 600 + i * 100,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Stars flanking title (outside the panel)
        this.add.sprite(W / 2 - 230, 145, 'star', 0)
            .setOrigin(0.5)
            .play('star-flash');
        this.add.sprite(W / 2 + 230, 145, 'star', 0)
            .setOrigin(0.5)
            .play('star-flash');

        // ? blocks row — decorative row using tile frame 4
        var qBlockXPositions = [100, 280, 460, 640];
        for (var qi = 0; qi < qBlockXPositions.length; qi++) {
            this.add.image(qBlockXPositions[qi], groundY - 160, 'tiles', 4).setOrigin(0, 0).setScale(0.875);
        }

        // Brick block decorations using tile frame 3
        this.add.image(150, groundY - 130, 'tiles', 3).setOrigin(0, 0).setScale(0.875);
        this.add.image(620, groundY - 130, 'tiles', 3).setOrigin(0, 0).setScale(0.875);

        // ========================================
        // 9. FOOTER
        // ========================================
        this.add.text(W / 2, H - 16, '2026 mario.godeliauskas.com', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px',
            color: '#666666'
        }).setOrigin(0.5);

        // "Press SPACE or tap START" prompt with blinking
        this.promptText = this.add.text(W / 2, 350, 'Press SPACE or tap START', {
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

        // ========================================
        // 10. INPUT HANDLING
        // ========================================

        // SPACE key starts game
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.spaceKey.on('down', function () {
            self.startGame();
        });

        // ENTER key also starts game (common alternative)
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.enterKey.on('down', function () {
            self.startGame();
        });

        // Flag to prevent double-start
        this.isStarting = false;

        console.log('[MenuScene] Menu created successfully.');
    },

    startGame: function () {
        if (this.isStarting) {
            return;
        }
        this.isStarting = true;

        // Initialize audio on first user interaction
        if (window.AudioManager) AudioManager.init();

        var self = this;

        // Brief flash/fade transition
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', function () {
            self.scene.start('GameScene', { level: 1 });
        });
    },

    update: function () {
        // No per-frame logic needed — all animations handled by tweens and Phaser anims
    }
});

// Attach to window for global access
window.MenuScene = MenuScene;
