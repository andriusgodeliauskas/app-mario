/**
 * WinScene -- Victory screen shown after completing a level.
 *
 * Levels 1-3: "Level Complete!" with score recap + vocabulary learned.
 * Level 4 (final): Princess/Victory screen with castle, dialogue, confetti.
 *
 * Accepts data via init(data): { score, coins, level, lives }
 */

var WinScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function WinScene() {
        Phaser.Scene.call(this, { key: 'WinScene' });
    },

    init: function (data) {
        this.playerScore = data.score || 0;
        this.playerCoins = data.coins || 0;
        this.playerLevel = data.level || 1;
        this.playerLives = data.lives || 3;
    },

    create: function () {
        this.W = this.cameras.main.width;
        this.H = this.cameras.main.height;

        // Confetti particles array (managed manually)
        this.confetti = [];
        this.stars = [];
        this.elapsed = 0;

        // Stop any game music
        if (window.AudioManager) {
            AudioManager.stopMusic();
        }

        if (this.playerLevel >= 4) {
            this.createPrincessScreen();
        } else {
            this.createLevelCompleteScreen();
        }
    },

    // ========================================
    // LEVEL 1-3: "LEVEL COMPLETE!" SCREEN
    // ========================================
    createLevelCompleteScreen: function () {
        var W = this.W;
        var H = this.H;
        var self = this;

        // --- Sky gradient background ---
        var bg = this.add.graphics();
        bg.fillGradientStyle(0x6B8CFF, 0x6B8CFF, 0x9494FF, 0x9494FF, 1);
        bg.fillRect(0, 0, W, H);

        // --- Ground strip ---
        bg.fillStyle(0x30C030, 1);
        bg.fillRect(0, H - 60, W, 60);
        bg.fillStyle(0x208020, 1);
        bg.fillRect(0, H - 60, W, 4);

        // --- Confetti particles ---
        this.createConfetti(40);

        // --- "LEVEL COMPLETE!" title with shadow ---
        this.add.text(W / 2 + 3, 73, 'LEVEL COMPLETE!', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '28px',
            color: '#885500'
        }).setOrigin(0.5);

        var titleText = this.add.text(W / 2, 70, 'LEVEL COMPLETE!', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '28px',
            color: '#F8D830'
        }).setOrigin(0.5);

        // Title bounce-in
        titleText.setScale(0);
        this.tweens.add({
            targets: titleText,
            scaleX: 1,
            scaleY: 1,
            ease: 'Back.easeOut',
            duration: 600
        });

        // --- Score panel background ---
        var panelY = 130;
        var panel = this.add.graphics();
        panel.fillStyle(0x000000, 0.6);
        panel.fillRoundedRect(W / 2 - 200, panelY, 400, 160, 12);
        panel.lineStyle(3, 0xF8D830, 1);
        panel.strokeRoundedRect(W / 2 - 200, panelY, 400, 160, 12);

        // --- World label ---
        this.add.text(W / 2, panelY + 25, 'WORLD ' + this.playerLevel + '-1', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '14px',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        // --- Score ---
        this.add.text(W / 2 - 150, panelY + 60, 'SCORE:', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '12px',
            color: '#AAAAAA'
        });
        this.add.text(W / 2 + 150, panelY + 60, String(this.playerScore).padStart(6, '0'), {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '12px',
            color: '#FFFFFF'
        }).setOrigin(1, 0);

        // --- Coins ---
        this.add.text(W / 2 - 150, panelY + 90, 'COINS:', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '12px',
            color: '#AAAAAA'
        });
        this.add.text(W / 2 + 150, panelY + 90, 'x' + String(this.playerCoins).padStart(2, '0'), {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '12px',
            color: '#F8D830'
        }).setOrigin(1, 0);

        // --- Lives ---
        this.add.text(W / 2 - 150, panelY + 120, 'LIVES:', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '12px',
            color: '#AAAAAA'
        });
        var heartsStr = '';
        for (var i = 0; i < this.playerLives; i++) { heartsStr += 'M '; }
        this.add.text(W / 2 + 150, panelY + 120, heartsStr.trim(), {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '12px',
            color: '#E8261C'
        }).setOrigin(1, 0);

        // --- Vocabulary recap ---
        var vocabY = 320;
        this.add.text(W / 2, vocabY, 'WORDS LEARNED:', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '11px',
            color: '#F8D830'
        }).setOrigin(0.5);

        var vocabWords = this.getVocabForLevel(this.playerLevel);
        for (var v = 0; v < vocabWords.length; v++) {
            var word = vocabWords[v];
            var vy = vocabY + 30 + v * 28;

            // English word
            this.add.text(W / 2 - 120, vy, word.en + '!', {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '10px',
                color: '#FFFFFF'
            });

            // Lithuanian translation
            this.add.text(W / 2 + 120, vy, '(' + word.lt + ')', {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '9px',
                color: '#999999'
            }).setOrigin(1, 0);
        }

        // --- "NEXT LEVEL" button ---
        var btnY = H - 120;
        var btnBg = this.add.graphics();
        btnBg.fillStyle(0xB01010, 1);
        btnBg.fillRoundedRect(W / 2 - 104, btnY + 3, 208, 50, 8);
        btnBg.fillStyle(0xE8261C, 1);
        btnBg.fillRoundedRect(W / 2 - 102, btnY, 204, 48, 8);

        // Button highlight
        btnBg.fillStyle(0xFFFFFF, 0.2);
        btnBg.fillRoundedRect(W / 2 - 98, btnY + 2, 196, 20, 6);

        var btnText = this.add.text(W / 2, btnY + 24, 'NEXT LEVEL', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '14px',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        // Make button interactive
        var btnZone = this.add.zone(W / 2, btnY + 24, 210, 52).setInteractive();
        btnZone.on('pointerdown', function () {
            self.goToNextLevel();
        });
        btnZone.on('pointerover', function () {
            btnText.setColor('#F8D830');
        });
        btnZone.on('pointerout', function () {
            btnText.setColor('#FFFFFF');
        });

        // Also allow keyboard / space
        this.input.keyboard.on('keydown-SPACE', function () {
            self.goToNextLevel();
        });
        this.input.keyboard.on('keydown-ENTER', function () {
            self.goToNextLevel();
        });

        // --- Auto-advance after 5 seconds ---
        this.autoTimer = this.time.delayedCall(5000, function () {
            self.goToNextLevel();
        });

        // --- Play level complete sound ---
        if (window.AudioManager) {
            AudioManager.play('levelComplete');
        }

        // --- Decorative stars ---
        this.createStars(8);
    },

    // ========================================
    // LEVEL 4 (FINAL): PRINCESS / VICTORY SCREEN
    // ========================================
    createPrincessScreen: function () {
        var W = this.W;
        var H = this.H;
        var self = this;
        var groundY = H - 60;

        // --- Sky background ---
        var bg = this.add.graphics();
        bg.fillGradientStyle(0x6B8CFF, 0x6B8CFF, 0x9494FF, 0x9494FF, 1);
        bg.fillRect(0, 0, W, H);

        // --- Clouds ---
        this.drawCloudGraphic(bg, 50, 40, 1.1);
        this.drawCloudGraphic(bg, 350, 55, 0.8);
        this.drawCloudGraphic(bg, 620, 30, 1.2);

        // --- Castle background ---
        var castle = this.add.graphics();

        // Main castle body
        castle.fillStyle(0xE0D8D0, 1);
        castle.fillRect(W / 2 - 120, 80, 240, groundY - 80);
        // Stone pattern
        for (var cy = 90; cy < groundY; cy += 24) {
            var cr = Math.floor((cy - 90) / 24);
            var co = (cr % 2 === 0) ? 0 : 20;
            for (var cx = W / 2 - 118; cx < W / 2 + 118; cx += 40) {
                castle.fillStyle(0xD8D0C8, 1);
                castle.fillRect(cx + co, cy, 38, 22);
                castle.fillStyle(0xE8E0D8, 1);
                castle.fillRect(cx + co, cy, 38, 2);
            }
        }

        // Towers
        castle.fillStyle(0xD0C8C0, 1);
        castle.fillRect(W / 2 - 150, 45, 50, groundY - 45);
        castle.fillRect(W / 2 + 100, 45, 50, groundY - 45);

        // Crenellations
        for (var ci = 0; ci < 4; ci++) {
            castle.fillStyle(0xD0C8C0, 1);
            castle.fillRect(W / 2 - 150 + ci * 14, 28, 10, 17);
            castle.fillRect(W / 2 + 100 + ci * 14, 28, 10, 17);
            castle.fillStyle(0xE8E0D8, 1);
            castle.fillRect(W / 2 - 150 + ci * 14, 28, 10, 3);
            castle.fillRect(W / 2 + 100 + ci * 14, 28, 10, 3);
        }

        // Door (arch shape via rounded rect)
        castle.fillStyle(0x8B4513, 1);
        castle.fillRoundedRect(W / 2 - 22, groundY - 60, 44, 60, { tl: 22, tr: 22, bl: 0, br: 0 });
        castle.fillStyle(0xA0522D, 1);
        castle.fillRoundedRect(W / 2 - 18, groundY - 55, 36, 55, { tl: 18, tr: 18, bl: 0, br: 0 });
        // Door knob
        castle.fillStyle(0xF8D830, 1);
        castle.fillRect(W / 2 + 6, groundY - 34, 5, 5);

        // Windows
        castle.fillStyle(0x6B8CFF, 1);
        castle.fillRoundedRect(W / 2 - 85, 135, 30, 40, 15);
        castle.fillRoundedRect(W / 2 + 55, 135, 30, 40, 15);
        // Window frames
        castle.lineStyle(3, 0xB8B0A8, 1);
        castle.strokeRoundedRect(W / 2 - 85, 135, 30, 40, 15);
        castle.strokeRoundedRect(W / 2 + 55, 135, 30, 40, 15);

        // Flag on tower
        castle.fillStyle(0x888888, 1);
        castle.fillRect(W / 2 - 128, 6, 4, 28);
        // Pink flag
        for (var fy = 0; fy < 16; fy++) {
            castle.fillStyle(0xFF69B4, 1);
            castle.fillRect(W / 2 - 124, 8 + fy, 16 - fy, 1);
        }

        // --- Ground ---
        bg.fillStyle(0x30C030, 1);
        bg.fillRect(0, groundY, W, H - groundY);
        bg.fillStyle(0x58E858, 1);
        bg.fillRect(0, groundY, W, 4);
        bg.fillStyle(0x208020, 1);
        bg.fillRect(0, groundY + 14, W, H - groundY - 14);

        // --- Confetti / sparkles ---
        this.createConfetti(50);

        // --- Stars decoration ---
        this.createStars(6);

        // --- Mario sprite (left) -- bounce-in ---
        var marioSprite = null;
        try {
            marioSprite = this.add.sprite(W / 2 - 80, groundY - 24, 'mario', 0);
            marioSprite.setScale(3);
            marioSprite.setOrigin(0.5, 1);
            marioSprite.play('mario-idle');
        } catch (e) {
            // Fallback: draw a colored rect if sprite not available
            marioSprite = this.add.rectangle(W / 2 - 80, groundY - 32, 32, 48, 0xE8261C);
        }

        // Bounce-in animation for Mario
        marioSprite.setScale(0);
        this.tweens.add({
            targets: marioSprite,
            scaleX: 3,
            scaleY: 3,
            ease: 'Back.easeOut',
            duration: 700,
            delay: 200
        });

        // --- Princess sprite (right) -- bounce-in ---
        var princessSprite = null;
        try {
            princessSprite = this.add.sprite(W / 2 + 80, groundY - 24, 'princess', 0);
            princessSprite.setScale(3);
            princessSprite.setOrigin(0.5, 1);
        } catch (e) {
            princessSprite = this.add.rectangle(W / 2 + 80, groundY - 32, 32, 56, 0xFF69B4);
        }

        // Bounce-in animation for Princess
        princessSprite.setScale(0);
        this.tweens.add({
            targets: princessSprite,
            scaleX: 3,
            scaleY: 3,
            ease: 'Back.easeOut',
            duration: 700,
            delay: 500
        });

        // --- Pixel heart between them ---
        var heartGfx = this.add.graphics();
        this.drawPixelHeart(heartGfx, W / 2 - 8, groundY - 50);
        heartGfx.setAlpha(0);
        this.tweens.add({
            targets: heartGfx,
            alpha: 1,
            ease: 'Bounce.easeOut',
            duration: 500,
            delay: 1000
        });
        // Pulse the heart
        this.tweens.add({
            targets: heartGfx,
            scaleX: 1.2,
            scaleY: 1.2,
            yoyo: true,
            repeat: -1,
            duration: 600,
            delay: 1500,
            ease: 'Sine.easeInOut'
        });

        // --- "YOU WIN!" title ---
        // Shadow
        this.add.text(W / 2 + 3, 258, 'YOU WIN!', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '26px',
            color: '#885500'
        }).setOrigin(0.5);
        // Main
        var winText = this.add.text(W / 2, 255, 'YOU WIN!', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '26px',
            color: '#F8D830'
        }).setOrigin(0.5);

        winText.setScale(0);
        this.tweens.add({
            targets: winText,
            scaleX: 1,
            scaleY: 1,
            ease: 'Back.easeOut',
            duration: 600,
            delay: 800
        });

        // --- Dialog box ---
        var dialogY = 310;
        var dialogBg = this.add.graphics();
        dialogBg.fillStyle(0x000000, 0.85);
        dialogBg.fillRoundedRect(W / 2 - 260, dialogY, 520, 115, 8);
        dialogBg.lineStyle(3, 0xF8D830, 1);
        dialogBg.strokeRoundedRect(W / 2 - 260, dialogY, 520, 115, 8);

        // Princess name tag
        dialogBg.fillStyle(0xFF69B4, 1);
        dialogBg.fillRoundedRect(W / 2 - 248, dialogY - 12, 90, 18, 4);
        this.add.text(W / 2 - 244, dialogY - 8, 'PRINCESS', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px',
            color: '#FFFFFF'
        });

        // --- Typewriter dialogue ---
        this.dialogLines = [
            { text: 'Thank you Mario!', color: '#FFFFFF', size: '12px' },
            { text: 'You are my hero!', color: '#FFFFFF', size: '12px' },
            { text: '(Aciu Mario! Tu mano didvyris!)', color: '#999999', size: '9px' }
        ];

        // Create text objects for each line (initially empty)
        this.dialogTexts = [];
        var lineYStart = dialogY + 30;
        for (var li = 0; li < this.dialogLines.length; li++) {
            var dl = this.dialogLines[li];
            var txt = this.add.text(W / 2, lineYStart + li * 28, '', {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: dl.size,
                color: dl.color
            }).setOrigin(0.5, 0);
            this.dialogTexts.push(txt);
        }

        // Start typewriter effect after characters bounce in
        this.time.delayedCall(1500, function () {
            self.startTypewriter();
        });

        // --- Final score display ---
        var scoreStr = 'FINAL SCORE: ' + String(this.playerScore).padStart(6, '0') +
                       '  COINS: ' + String(this.playerCoins).padStart(2, '0');
        this.add.text(W / 2, 455, scoreStr, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '10px',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        // --- "PLAY AGAIN" button ---
        var btnY = H - 80;
        var btnBgGfx = this.add.graphics();
        btnBgGfx.fillStyle(0xB01010, 1);
        btnBgGfx.fillRoundedRect(W / 2 - 106, btnY + 3, 212, 50, 8);
        btnBgGfx.fillStyle(0xE8261C, 1);
        btnBgGfx.fillRoundedRect(W / 2 - 104, btnY, 208, 48, 8);
        btnBgGfx.fillStyle(0xFFFFFF, 0.2);
        btnBgGfx.fillRoundedRect(W / 2 - 100, btnY + 2, 200, 20, 6);

        var playAgainText = this.add.text(W / 2, btnY + 24, 'PLAY AGAIN', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '14px',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        var btnZone = this.add.zone(W / 2, btnY + 24, 214, 54).setInteractive();
        btnZone.on('pointerdown', function () {
            self.goToMenu();
        });
        btnZone.on('pointerover', function () {
            playAgainText.setColor('#F8D830');
        });
        btnZone.on('pointerout', function () {
            playAgainText.setColor('#FFFFFF');
        });

        // Keyboard
        this.input.keyboard.on('keydown-SPACE', function () {
            self.goToMenu();
        });
        this.input.keyboard.on('keydown-ENTER', function () {
            self.goToMenu();
        });

        // --- Play level complete / victory sound ---
        if (window.AudioManager) {
            AudioManager.play('levelComplete');
        }
    },

    // ========================================
    // TYPEWRITER EFFECT
    // ========================================
    startTypewriter: function () {
        var self = this;
        var lineIndex = 0;
        var charIndex = 0;
        var currentLine = this.dialogLines[lineIndex];

        this.typewriterTimer = this.time.addEvent({
            delay: 40,
            callback: function () {
                if (lineIndex >= self.dialogLines.length) {
                    // All lines done
                    self.typewriterTimer.remove(false);
                    return;
                }

                currentLine = self.dialogLines[lineIndex];
                charIndex++;

                var displayText = currentLine.text.substring(0, charIndex);
                self.dialogTexts[lineIndex].setText(displayText);

                if (charIndex >= currentLine.text.length) {
                    // Move to next line
                    lineIndex++;
                    charIndex = 0;
                }
            },
            loop: true
        });
    },

    // ========================================
    // CONFETTI SYSTEM
    // ========================================
    createConfetti: function (count) {
        var colors = [0xFF69B4, 0xF8D830, 0x30C030, 0x6B8CFF, 0xE8261C, 0xFF8800, 0xFFFFFF];
        for (var i = 0; i < count; i++) {
            var c = this.add.rectangle(
                Phaser.Math.Between(0, this.W),
                Phaser.Math.Between(-50, -10),
                Phaser.Math.Between(3, 7),
                Phaser.Math.Between(3, 7),
                Phaser.Utils.Array.GetRandom(colors)
            );
            c.setAlpha(Phaser.Math.FloatBetween(0.6, 1));
            this.confetti.push({
                obj: c,
                speedY: Phaser.Math.FloatBetween(40, 120),
                speedX: Phaser.Math.FloatBetween(-30, 30),
                rotSpeed: Phaser.Math.FloatBetween(-180, 180),
                wobble: Phaser.Math.FloatBetween(0, Math.PI * 2)
            });
        }
    },

    // ========================================
    // TWINKLING STARS
    // ========================================
    createStars: function (count) {
        for (var i = 0; i < count; i++) {
            var sx = Phaser.Math.Between(30, this.W - 30);
            var sy = Phaser.Math.Between(10, 80);
            var starGfx = this.add.graphics();
            this.drawPixelStar(starGfx, sx, sy, Phaser.Math.Between(2, 4));
            this.stars.push(starGfx);

            // Twinkle animation
            this.tweens.add({
                targets: starGfx,
                alpha: 0.2,
                yoyo: true,
                repeat: -1,
                duration: Phaser.Math.Between(400, 900),
                delay: Phaser.Math.Between(0, 1000),
                ease: 'Sine.easeInOut'
            });
        }
    },

    // ========================================
    // PIXEL ART HELPERS
    // ========================================

    /** Draw a small pixel star */
    drawPixelStar: function (gfx, x, y, size) {
        gfx.fillStyle(0xF8D830, 1);
        gfx.fillRect(x - size, y, size * 2, size);       // horizontal bar
        gfx.fillRect(x - Math.floor(size / 2), y - size, size, size * 2 + size); // vertical bar
        gfx.fillStyle(0xFFF8A0, 1);
        gfx.fillRect(x - Math.floor(size / 2), y, Math.floor(size / 2), Math.floor(size / 2)); // center shine
    },

    /** Draw a pixel heart */
    drawPixelHeart: function (gfx, x, y) {
        gfx.fillStyle(0xE8261C, 1);
        gfx.fillRect(x + 2, y, 5, 3);
        gfx.fillRect(x + 9, y, 5, 3);
        gfx.fillRect(x, y + 2, 16, 4);
        gfx.fillRect(x + 1, y + 6, 14, 3);
        gfx.fillRect(x + 3, y + 9, 10, 2);
        gfx.fillRect(x + 5, y + 11, 6, 2);
        gfx.fillRect(x + 7, y + 13, 2, 2);
        // Highlight
        gfx.fillStyle(0xFF6666, 1);
        gfx.fillRect(x + 3, y + 1, 3, 2);
    },

    /** Draw cloud using graphics */
    drawCloudGraphic: function (gfx, x, y, scale) {
        var s = scale || 1;
        // Shadow
        gfx.fillStyle(0xA0C0FF, 1);
        gfx.fillCircle(x + 12 * s, y + 22 * s, 14 * s);
        gfx.fillCircle(x + 32 * s, y + 22 * s, 16 * s);
        gfx.fillCircle(x + 52 * s, y + 22 * s, 14 * s);
        // Main body
        gfx.fillStyle(0xFFFFFF, 1);
        gfx.fillCircle(x + 10 * s, y + 16 * s, 14 * s);
        gfx.fillCircle(x + 26 * s, y + 10 * s, 18 * s);
        gfx.fillCircle(x + 44 * s, y + 8 * s, 20 * s);
        gfx.fillCircle(x + 58 * s, y + 12 * s, 16 * s);
        gfx.fillRect(x + 4 * s, y + 10 * s, 58 * s, 14 * s);
    },

    // ========================================
    // VOCABULARY PER LEVEL
    // ========================================
    getVocabForLevel: function (level) {
        // Use EnglishWords dictionary if available
        var EW = window.EnglishWords;
        var levelVocab = {
            1: ['coin', 'mushroom', 'brick', 'jump'],
            2: ['star', 'run', 'turtle', 'life'],
            3: ['cloud', 'flag', 'score', 'castle'],
            4: ['princess', 'hero', 'coin', 'star']
        };
        var keys = levelVocab[level] || levelVocab[1];
        var words = [];
        for (var i = 0; i < keys.length; i++) {
            if (EW && EW.getWord) {
                var w = EW.getWord(keys[i]);
                if (w) {
                    words.push(w);
                    continue;
                }
            }
            // Fallback
            words.push({ en: keys[i].charAt(0).toUpperCase() + keys[i].slice(1), lt: keys[i] });
        }
        return words;
    },

    // ========================================
    // NAVIGATION
    // ========================================
    goToNextLevel: function () {
        if (this.autoTimer) {
            this.autoTimer.remove(false);
        }
        var nextLevel = this.playerLevel + 1;
        if (nextLevel > 4) {
            nextLevel = 1; // wrap around (should not happen -- level 4 uses princess screen)
        }
        this.scene.start('GameScene', {
            level: nextLevel,
            score: this.playerScore,
            coins: this.playerCoins,
            lives: this.playerLives
        });
    },

    goToMenu: function () {
        this.scene.start('MenuScene');
    },

    // ========================================
    // UPDATE LOOP -- animate confetti + stars
    // ========================================
    update: function (time, delta) {
        var dt = delta / 1000; // seconds
        this.elapsed += dt;

        // Animate confetti falling
        for (var i = 0; i < this.confetti.length; i++) {
            var c = this.confetti[i];
            c.obj.y += c.speedY * dt;
            c.obj.x += c.speedX * dt + Math.sin(this.elapsed * 2 + c.wobble) * 0.5;
            c.obj.angle += c.rotSpeed * dt;

            // Reset when off screen
            if (c.obj.y > this.H + 20) {
                c.obj.y = Phaser.Math.Between(-30, -5);
                c.obj.x = Phaser.Math.Between(0, this.W);
            }
        }
    }
});

// Attach to window for global access
window.WinScene = WinScene;
