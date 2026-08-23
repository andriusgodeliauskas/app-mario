/**
 * MenuScene — Main menu screen with title, decorations, and paged level selection.
 * All sprites are generated in BootScene — no external assets needed.
 * Cookie-based progress: levels unlock sequentially.
 */

// Cookie progress helper
window.GameProgress = {
    maxLevel: 52,
    getMaxLevel: function() {
        var match = document.cookie.match(/marioMaxLevel=(\d+)/);
        var level = match ? parseInt(match[1]) : 1;
        if (!isFinite(level) || level < 1) level = 1;
        if (level > this.maxLevel) level = this.maxLevel;
        return level;
    },
    unlockLevel: function(level) {
        if (level > this.maxLevel) level = this.maxLevel;
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
        // 4b. SETTINGS BUTTON (top-right gear)
        // ========================================
        var settingsBtnX = W - 50;
        var settingsBtnY = 50;
        var settingsBg = this.add.graphics().setDepth(5);
        settingsBg.fillStyle(0x000000, 0.6);
        settingsBg.fillRoundedRect(settingsBtnX - 28, settingsBtnY - 28, 56, 56, 12);
        settingsBg.lineStyle(3, 0xF8B800, 1);
        settingsBg.strokeRoundedRect(settingsBtnX - 28, settingsBtnY - 28, 56, 56, 12);

        var settingsLabel = this.add.text(settingsBtnX, settingsBtnY, '⚙', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '36px',
            color: '#F8D830'
        }).setOrigin(0.5).setDepth(6);

        var settingsZone = this.add.zone(settingsBtnX, settingsBtnY, 56, 56)
            .setDepth(7).setInteractive({ useHandCursor: true });

        settingsZone.on('pointerover', function () { settingsLabel.setScale(1.15); });
        settingsZone.on('pointerout',  function () { settingsLabel.setScale(1.0); });
        settingsZone.on('pointerdown', function () {
            self.scene.start('SettingsScene');
        });

        this.add.text(settingsBtnX, settingsBtnY + 36, 'NUSTATYMAI', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px',
            color: '#FFFFFF'
        }).setOrigin(0.5).setDepth(6);

        // ----------------------------------
        // CARD COLLECTION button (mirrors the settings button, top-left)
        // ----------------------------------
        var cardsBtnX = 46;
        var cardsBtnY = 150;
        var cardsBg = this.add.graphics().setDepth(5);
        cardsBg.fillStyle(0x000000, 0.6);
        cardsBg.fillRoundedRect(cardsBtnX - 28, cardsBtnY - 28, 56, 56, 12);
        cardsBg.lineStyle(3, 0xF8B800, 1);
        cardsBg.strokeRoundedRect(cardsBtnX - 28, cardsBtnY - 28, 56, 56, 12);

        var cardsLabel = this.add.text(cardsBtnX, cardsBtnY, '\u{1F0CF}', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '32px',
            color: '#F8D830'
        }).setOrigin(0.5).setDepth(6);

        this.cardsButtonZone = this.add.zone(cardsBtnX, cardsBtnY, 56, 56)
            .setDepth(7).setInteractive({ useHandCursor: true });
        this.cardsButtonZone.on('pointerover', function () { cardsLabel.setScale(1.15); });
        this.cardsButtonZone.on('pointerout',  function () { cardsLabel.setScale(1.0); });
        this.cardsButtonZone.on('pointerdown', function () { self.scene.start('CardsScene'); });

        var foundCards = window.CardCollection ? CardCollection.unlockedCount() : 0;
        var totalCards = window.Cards ? Cards.TOTAL : 0;
        this.add.text(cardsBtnX, cardsBtnY + 34, 'KORTELES', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px',
            color: '#FFFFFF'
        }).setOrigin(0.5).setDepth(6);
        this.add.text(cardsBtnX, cardsBtnY + 48, foundCards + '/' + totalCards, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px',
            color: foundCards === totalCards ? '#6CD82C' : '#F8D830'
        }).setOrigin(0.5).setDepth(6);

        // ========================================
        // 5. LEVEL SELECTION — world pages
        // ========================================
        this.add.text(W / 2, 146, 'PASIRINK PASAULI:', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '12px',
            color: '#F8D830'
        }).setOrigin(0.5);

        var levels = [];
        var themes = window.LEVEL_THEMES || [];
        for (var ti = 0; ti < themes.length; ti++) {
            levels.push({
                num: themes[ti].num,
                name: themes[ti].name,
                lt: themes[ti].lt,
                color: themes[ti].menuColor,
                icon: themes[ti].icon,
                scene: themes[ti].scene || 'GameScene'
            });
        }

        this.levels = levels;
        this.levelsPerWorld = 7;
        this.currentWorldPage = 0;
        this.levelCardObjects = [];
        this.createWorldPager(W, H);
        this.renderWorldPage();

        // ========================================
        // 6. DECORATIVE SPRITES
        // ========================================
        this.add.sprite(W / 2 - 230, 90, 'star', 0).setOrigin(0.5).setScale(0.25).play('star-flash');
        this.add.sprite(W / 2 + 230, 90, 'star', 0).setOrigin(0.5).setScale(0.25).play('star-flash');

        // Hero picker — the whole cast stands on the ground, tap to choose
        this.createHeroPicker(W, groundY);

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


        this.isStarting = false;
        console.log('[MenuScene] Menu created successfully.');
    },

    // ==========================================
    // WORLD PAGER
    // ==========================================
    createWorldPager: function (W, H) {
        this.totalWorldPages = Math.max(1, Math.ceil(this.levels.length / this.levelsPerWorld));

        this.worldTitleText = this.add.text(W / 2, 174, '', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '14px',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        this.worldRangeText = this.add.text(W / 2, 196, '', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '9px',
            color: '#E8F8FF'
        }).setOrigin(0.5);

        this.prevWorldButton = this.createWorldArrow(54, 318, '<', -1);
        this.nextWorldButton = this.createWorldArrow(W - 54, 318, '>', 1);

        var self = this;
        this.input.keyboard.on('keydown-LEFT', function () {
            self.changeWorldPage(-1);
        });
        this.input.keyboard.on('keydown-RIGHT', function () {
            self.changeWorldPage(1);
        });
    },

    createWorldArrow: function (x, y, label, dir) {
        var self = this;
        var parts = [];
        var bg = this.add.graphics().setDepth(8);
        bg.fillStyle(0xFFFFFF, 0.95);
        bg.fillRoundedRect(x - 36, y - 52, 72, 104, 18);
        bg.lineStyle(5, 0xF8B800, 1);
        bg.strokeRoundedRect(x - 36, y - 52, 72, 104, 18);
        parts.push(bg);

        var txt = this.add.text(x, y - 2, label, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '38px',
            color: '#E8261C'
        }).setOrigin(0.5).setDepth(9);
        parts.push(txt);

        var zone = this.add.zone(x, y, 76, 108).setDepth(10).setInteractive({ useHandCursor: true });
        zone.on('pointerover', function () {
            txt.setScale(1.12);
        });
        zone.on('pointerout', function () {
            txt.setScale(1.0);
        });
        zone.on('pointerdown', function () {
            self.changeWorldPage(dir);
        });
        parts.push(zone);

        return { bg: bg, text: txt, zone: zone, parts: parts };
    },

    setWorldArrowEnabled: function (button, enabled) {
        for (var i = 0; i < button.parts.length; i++) {
            button.parts[i].setAlpha(enabled ? 1 : 0.35);
        }
        if (enabled) button.zone.setInteractive({ useHandCursor: true });
        else button.zone.disableInteractive();
    },

    changeWorldPage: function (dir) {
        var next = this.currentWorldPage + dir;
        if (next < 0 || next >= this.totalWorldPages) return;
        this.currentWorldPage = next;
        this.renderWorldPage();
    },

    renderWorldPage: function () {
        var W = this.cameras.main.width;
        var first = this.currentWorldPage * this.levelsPerWorld;
        var last = Math.min(first + this.levelsPerWorld, this.levels.length);

        for (var i = 0; i < this.levelCardObjects.length; i++) {
            this.levelCardObjects[i].destroy();
        }
        this.levelCardObjects = [];

        this.worldTitleText.setText('PASAULIS ' + (this.currentWorldPage + 1) + ' / ' + this.totalWorldPages);
        if (last > first) {
            this.worldRangeText.setText('LYGIAI ' + this.levels[first].num + '-' + this.levels[last - 1].num);
        } else {
            this.worldRangeText.setText('');
        }

        var cardW = 150;
        var cardH = 100;
        var gapX = 20;
        var cols = 4;
        var startX = W / 2 - (cardW * cols + gapX * (cols - 1)) / 2;
        var startY = 200;

        for (var li = first; li < last; li++) {
            var local = li - first;
            var col = local % cols;
            var row = Math.floor(local / cols);
            var cx = startX + col * (cardW + gapX) + cardW / 2;
            var cy = startY + row * (cardH + 18) + cardH / 2;
            this.createLevelCard(cx, cy, cardW, cardH, this.levels[li]);
        }

        this.setWorldArrowEnabled(this.prevWorldButton, this.currentWorldPage > 0);
        this.setWorldArrowEnabled(this.nextWorldButton, this.currentWorldPage < this.totalWorldPages - 1);
    },

    // ==========================================
    // CREATE LEVEL CARD
    // ==========================================
    createLevelCard: function (cx, cy, w, h, levelInfo) {
        var self = this;
        var maxLevel = window.GameProgress.getMaxLevel();
        // "Visi lygiai" setting unlocks every level for free play / testing.
        var unlockAll = window.MathSettings && window.MathSettings.load().unlockAll === true;
        var isLocked = !unlockAll && levelInfo.num > maxLevel;
        var g = this.add.graphics();
        this.levelCardObjects.push(g);

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
        this.levelCardObjects.push(this.add.text(cx, cy - h / 2 + 13, 'WORLD 1-' + levelInfo.num, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px',
            color: isLocked ? '#888888' : '#FFFFFF'
        }).setOrigin(0.5));

        if (isLocked) {
            // Locked card content
            this.levelCardObjects.push(this.add.text(cx, cy + 4, 'UZRAKINTA', {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '9px',
                color: '#666666'
            }).setOrigin(0.5));

            this.levelCardObjects.push(this.add.text(cx, cy + h / 2 - 18, '🔒', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '22px',
                color: '#AAAAAA'
            }).setOrigin(0.5));

            this.levelCardObjects.push(this.add.text(cx, cy + h / 2 - 38, levelInfo.lt, {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '7px',
                color: '#777777'
            }).setOrigin(0.5));
        } else {
            // Level name (English)
            this.levelCardObjects.push(this.add.text(cx, cy + 4, levelInfo.name, {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '8px',
                color: '#F8D830'
            }).setOrigin(0.5));

            // Level name (Lithuanian)
            this.levelCardObjects.push(this.add.text(cx, cy + 22, levelInfo.lt, {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '7px',
                color: '#AAAAAA'
            }).setOrigin(0.5));

            // Decorative icon on card
            if (levelInfo.icon === 'hill') {
                this.levelCardObjects.push(this.add.image(cx, cy - 17, 'hill').setScale(0.135).setTint(levelInfo.color));
            } else if (levelInfo.icon === 'cloud') {
                this.levelCardObjects.push(this.add.image(cx, cy - 17, 'cloud').setScale(0.22));
            } else {
                var frame = levelInfo.num === 2 ? 3 : 11;
                this.levelCardObjects.push(this.add.image(cx, cy - 17, 'tiles', frame).setScale(0.38));
            }

            // "PLAY" text
            this.levelCardObjects.push(this.add.text(cx, cy + h / 2 - 16, 'ZAISTI', {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '9px',
                color: '#30FF30'
            }).setOrigin(0.5));

            // Hover border graphics (separate so we can show/hide)
            var hoverG = this.add.graphics();
            this.levelCardObjects.push(hoverG);
            hoverG.setVisible(false);
            hoverG.lineStyle(3, 0xF8D830, 1);
            hoverG.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);

            // Interactive zone
            var zone = this.add.zone(cx, cy, w, h).setInteractive({ useHandCursor: true });
            this.levelCardObjects.push(zone);

            zone.on('pointerover', function () {
                hoverG.setVisible(true);
            });
            zone.on('pointerout', function () {
                hoverG.setVisible(false);
            });
            zone.on('pointerdown', function () {
                self.startLevel(levelInfo);
            });
        }
    },

    // ==========================================
    // START SPECIFIC LEVEL
    // ==========================================
    /**
     * The hero picker: every playable character standing on the ground below
     * the level cards. Tapping one selects it immediately — there is no
     * confirm step, because the only feedback a pre-reader needs is seeing
     * their character grow.
     *
     * If the registry or its textures are missing for any reason, the menu
     * falls back to the lone decorative Mario it had before.
     */
    createHeroPicker: function (W, groundY) {
        var self = this;
        var Chars = window.Characters;
        var Settings = window.CharacterSettings;

        if (!Chars || !Settings) {
            this.add.sprite(W / 2, groundY - 16, 'mario', 0).setOrigin(0.5, 1).setScale(0.25).play('mario-idle');
            return;
        }

        var ids = Chars.PLAYABLE_IDS;
        var spacing = W / (ids.length + 1);
        var rowY = groundY - 10;

        // The hills and bushes behind the ground swallow small sprites, so the
        // row gets its own dark strip — same treatment as the title panel.
        var strip = this.add.graphics().setDepth(3);
        strip.fillStyle(0x000000, 0.45);
        strip.fillRoundedRect(12, groundY - 106, W - 24, 104, 12);
        strip.lineStyle(3, 0xF8B800, 0.9);
        strip.strokeRoundedRect(12, groundY - 106, W - 24, 104, 12);

        this.add.text(W / 2, groundY - 96, 'PASIRINK VEIKEJA:', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '10px',
            color: '#F8D830'
        }).setOrigin(0.5).setDepth(6);

        this.heroNameText = this.add.text(W / 2, groundY - 78, '', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '9px',
            color: '#FFFFFF'
        }).setOrigin(0.5).setDepth(6);

        this.heroButtons = [];

        ids.forEach(function (id, i) {
            var x = Math.round(spacing * (i + 1));
            var key = (id === 'mario') ? 'mario' : 'hero-' + id;
            if (!self.textures.exists(key)) return;

            var ring = self.add.graphics().setDepth(4);
            var spr = self.add.sprite(x, rowY, key, 0).setOrigin(0.5, 1).setScale(0.26).setDepth(5);
            var zone = self.add.zone(x, rowY - 32, spacing - 4, 72)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });

            zone.on('pointerdown', function () { self.selectHero(id); });
            zone.on('pointerover', function () { if (self.selectedHeroId !== id) spr.setAlpha(1); });
            zone.on('pointerout', function () { if (self.selectedHeroId !== id) spr.setAlpha(0.75); });

            self.heroButtons.push({ id: id, sprite: spr, ring: ring, zone: zone, x: x, y: rowY });
        });

        this.selectHero(Settings.selectedId(), true);
    },

    /**
     * Mark a hero as chosen and persist it. `silent` skips the click sound for
     * the initial restore-from-storage call.
     */
    selectHero: function (id, silent) {
        var ch = window.Characters.byId(id);
        if (!ch) return;

        this.selectedHeroId = id;
        window.CharacterSettings.save({ id: id });
        if (this.heroNameText) {
            var en = ch.name.toUpperCase();
            var lt = ch.lt.toUpperCase();
            this.heroNameText.setText(en === lt ? en : en + '  -  ' + lt);
        }

        this.heroButtons.forEach(function (b) {
            var on = (b.id === id);
            b.sprite.setScale(on ? 0.36 : 0.26);
            b.sprite.setAlpha(on ? 1 : 0.75);
            b.ring.clear();
            if (on) {
                b.ring.fillStyle(0xF8D830, 0.18);
                b.ring.fillRoundedRect(b.x - 30, b.y - 66, 60, 70, 8);
                b.ring.lineStyle(3, 0xF8D830, 1);
                b.ring.strokeRoundedRect(b.x - 30, b.y - 66, 60, 70, 8);
            }
        });

        if (!silent && window.AudioManager && AudioManager.playCoin) {
            try { AudioManager.playCoin(); } catch (e) { /* audio is optional */ }
        }
    },

    startLevel: function (levelInfo) {
        if (this.isStarting) return;
        this.isStarting = true;

        if (window.AudioManager) AudioManager.init();

        var self = this;
        var levelNum = (typeof levelInfo === 'number') ? levelInfo : levelInfo.num;
        var sceneKey = (levelInfo && levelInfo.scene) ? levelInfo.scene : 'GameScene';
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', function () {
            self.scene.start(sceneKey, { level: levelNum });
        });
    },

    update: function () {
        // No per-frame logic needed
    }
});

// Attach to window for global access
window.MenuScene = MenuScene;
