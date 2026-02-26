/**
 * HUDScene — Overlay scene for score, lives, coins, world indicator
 * Runs on top of GameScene with fixed-position UI elements.
 */

var HUDScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function HUDScene() {
        Phaser.Scene.call(this, { key: 'HUDScene' });
    },

    create: function () {
        var self = this;
        var W = this.cameras.main.width;  // 800
        var H = this.cameras.main.height; // 600

        // ----------------------------------
        // Semi-transparent top bar
        // ----------------------------------
        this.topBar = this.add.rectangle(W / 2, 22, W, 44, 0x000000, 0.6);
        this.topBar.setDepth(0);

        // ----------------------------------
        // Font style shared across all HUD text
        // ----------------------------------
        var labelStyle = {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px',
            color: '#AAAAAA'
        };

        var valueStyle = {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '12px',
            color: '#FFFFFF'
        };

        // ----------------------------------
        // SCORE (top-left)
        // ----------------------------------
        this.add.text(20, 8, 'SCORE', labelStyle).setDepth(1);
        this.scoreText = this.add.text(20, 22, '000000', valueStyle).setDepth(1);

        // ----------------------------------
        // COINS (top-center-left)
        // ----------------------------------
        this.add.text(200, 8, 'COINS', labelStyle).setDepth(1);

        // Coin icon — small animated sprite
        this.coinIcon = this.add.sprite(200, 30, 'coin');
        this.coinIcon.play('coin-spin');
        this.coinIcon.setScale(0.3);
        this.coinIcon.setDepth(1);

        this.coinsText = this.add.text(214, 22, 'x00', valueStyle).setDepth(1);

        // ----------------------------------
        // WORLD (top-center)
        // ----------------------------------
        var worldX = W / 2;
        this.add.text(worldX, 8, 'WORLD', labelStyle).setOrigin(0.5, 0).setDepth(1);

        var currentLevel = this.registry.get('level') || 1;
        this.worldText = this.add.text(worldX, 22, '1-' + currentLevel, valueStyle)
            .setOrigin(0.5, 0).setDepth(1);

        // ----------------------------------
        // LIVES (top-right)
        // ----------------------------------
        var livesX = W - 20;
        this.add.text(livesX, 8, 'LIVES', labelStyle).setOrigin(1, 0).setDepth(1);

        var currentLives = this.registry.get('lives') || 3;
        this.livesText = this.add.text(livesX, 22, this.getLivesDisplay(currentLives), valueStyle)
            .setOrigin(1, 0).setDepth(1);

        // ----------------------------------
        // Mini Mario icon next to lives
        // ----------------------------------
        this.marioIcon = this.add.sprite(livesX - 80, 30, 'mario', 0);
        this.marioIcon.setScale(0.175);
        this.marioIcon.setDepth(1);

        // ----------------------------------
        // Restart/Quit button
        // ----------------------------------
        var restartBtnX = livesX - 120;
        var restartBtn = this.add.text(restartBtnX, 14, '[X]', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '14px',
            color: '#FF6666'
        }).setDepth(2).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });

        restartBtn.on('pointerover', function() { restartBtn.setColor('#FF0000'); });
        restartBtn.on('pointerout', function() { restartBtn.setColor('#FF6666'); });
        restartBtn.on('pointerdown', function() { self.showQuitDialog(); });

        // ----------------------------------
        // Quit dialog state
        // ----------------------------------
        this.quitDialogVisible = false;

        // ----------------------------------
        // Listen to registry events for live updates
        // ----------------------------------
        this.registry.events.on('changedata-score', function (parent, value) {
            self.scoreText.setText(self.padScore(value));
        });

        this.registry.events.on('changedata-coins', function (parent, value) {
            self.coinsText.setText('x' + self.padNumber(value, 2));
        });

        this.registry.events.on('changedata-lives', function (parent, value) {
            self.livesText.setText(self.getLivesDisplay(value));
        });

        this.registry.events.on('changedata-level', function (parent, value) {
            self.worldText.setText('1-' + value);
        });

        // ----------------------------------
        // Initial values from registry
        // ----------------------------------
        var initScore = this.registry.get('score') || 0;
        var initCoins = this.registry.get('coins') || 0;
        this.scoreText.setText(this.padScore(initScore));
        this.coinsText.setText('x' + this.padNumber(initCoins, 2));
    },

    update: function () {
        // HUD is event-driven via registry.events, no per-frame updates needed
    },

    // ==========================================
    // QUIT DIALOG
    // ==========================================
    showQuitDialog: function () {
        if (this.quitDialogVisible) return;
        this.quitDialogVisible = true;

        var W = this.cameras.main.width;
        var H = this.cameras.main.height;
        var self = this;

        // Pause the game scene
        var gameScene = this.scene.get('GameScene');
        if (gameScene) gameScene.scene.pause();

        // Dark overlay
        this.quitOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7)
            .setDepth(50).setInteractive();

        // Dialog panel
        var panelW = 400;
        var panelH = 200;
        this.quitPanel = this.add.graphics().setDepth(51);
        this.quitPanel.fillStyle(0x222244, 1);
        this.quitPanel.fillRoundedRect(W / 2 - panelW / 2, H / 2 - panelH / 2, panelW, panelH, 16);
        this.quitPanel.lineStyle(3, 0xF8B800, 1);
        this.quitPanel.strokeRoundedRect(W / 2 - panelW / 2, H / 2 - panelH / 2, panelW, panelH, 16);

        // Question text
        this.quitText = this.add.text(W / 2, H / 2 - 40, 'Ar nori baigti\nžaidimą?', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '14px',
            color: '#FFFFFF',
            align: 'center',
            lineSpacing: 8
        }).setOrigin(0.5).setDepth(52);

        // YES button
        var yesBtnX = W / 2 - 80;
        var yesBtnY = H / 2 + 40;
        this.yesBtnBg = this.add.graphics().setDepth(52);
        this.yesBtnBg.fillStyle(0xE8261C, 1);
        this.yesBtnBg.fillRoundedRect(yesBtnX - 60, yesBtnY - 18, 120, 36, 8);

        this.yesBtnText = this.add.text(yesBtnX, yesBtnY, 'TAIP', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '14px',
            color: '#FFFFFF'
        }).setOrigin(0.5).setDepth(53);

        var yesZone = this.add.zone(yesBtnX, yesBtnY, 120, 36)
            .setDepth(54).setInteractive({ useHandCursor: true });
        this.yesZone = yesZone;

        yesZone.on('pointerdown', function() {
            self.quitGame();
        });

        // NO button
        var noBtnX = W / 2 + 80;
        var noBtnY = H / 2 + 40;
        this.noBtnBg = this.add.graphics().setDepth(52);
        this.noBtnBg.fillStyle(0x30A030, 1);
        this.noBtnBg.fillRoundedRect(noBtnX - 60, noBtnY - 18, 120, 36, 8);

        this.noBtnText = this.add.text(noBtnX, noBtnY, 'NE', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '14px',
            color: '#FFFFFF'
        }).setOrigin(0.5).setDepth(53);

        var noZone = this.add.zone(noBtnX, noBtnY, 120, 36)
            .setDepth(54).setInteractive({ useHandCursor: true });
        this.noZone = noZone;

        noZone.on('pointerdown', function() {
            self.hideQuitDialog();
        });
    },

    hideQuitDialog: function () {
        this.quitDialogVisible = false;

        // Resume game
        var gameScene = this.scene.get('GameScene');
        if (gameScene) gameScene.scene.resume();

        // Destroy dialog elements
        if (this.quitOverlay) this.quitOverlay.destroy();
        if (this.quitPanel) this.quitPanel.destroy();
        if (this.quitText) this.quitText.destroy();
        if (this.yesBtnBg) this.yesBtnBg.destroy();
        if (this.yesBtnText) this.yesBtnText.destroy();
        if (this.yesZone) this.yesZone.destroy();
        if (this.noBtnBg) this.noBtnBg.destroy();
        if (this.noBtnText) this.noBtnText.destroy();
        if (this.noZone) this.noZone.destroy();
    },

    quitGame: function () {
        // Stop music
        if (window.AudioManager) AudioManager.stopMusic();

        // Stop both scenes and go to menu
        this.scene.stop('GameScene');
        this.scene.stop('HUDScene');
        this.scene.start('MenuScene');
    },

    // ==========================================
    // SHUTDOWN — clean up registry listeners to prevent leaks
    // ==========================================
    shutdown: function () {
        // Clean up quit dialog if open
        this.hideQuitDialog();

        this.registry.events.off('changedata-score');
        this.registry.events.off('changedata-coins');
        this.registry.events.off('changedata-lives');
        this.registry.events.off('changedata-level');
    },

    // ==========================================
    // HELPER: Pad score to 6 digits
    // ==========================================
    padScore: function (value) {
        var str = String(value);
        while (str.length < 6) {
            str = '0' + str;
        }
        return str;
    },

    // ==========================================
    // HELPER: Pad number to N digits
    // ==========================================
    padNumber: function (value, digits) {
        var str = String(value);
        while (str.length < digits) {
            str = '0' + str;
        }
        return str;
    },

    // ==========================================
    // HELPER: Lives display with hearts
    // ==========================================
    getLivesDisplay: function (lives) {
        if (lives <= 0) return 'x0';

        // Show heart symbols for up to 5 lives, then number
        if (lives <= 5) {
            var hearts = '';
            for (var i = 0; i < lives; i++) {
                hearts += 'M ';
            }
            return hearts.trim();
        }

        return 'x' + lives;
    }
});

// Attach to window for global access
window.HUDScene = HUDScene;
