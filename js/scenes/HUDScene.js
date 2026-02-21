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
        this.coinIcon.setScale(1.2);
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
        this.marioIcon.setScale(0.7);
        this.marioIcon.setDepth(1);

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
    // SHUTDOWN — clean up registry listeners to prevent leaks
    // ==========================================
    shutdown: function () {
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
