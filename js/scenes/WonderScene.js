/**
 * WonderScene — side-scrolling Wonder rooms with isolated mechanics.
 */

var WonderScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function WonderScene() {
        Phaser.Scene.call(this, { key: 'WonderScene' });
    },

    init: function (data) {
        this.currentLevel = (data && data.level) ? data.level : 44;
        this.mathSettings = window.MathSettings ? window.MathSettings.load() : null;
        this.difficultyProfile = window.MathSettings
            ? window.MathSettings.difficultyProfile(this.mathSettings)
            : { lives: 3, enemyCount: 1, enemySpeed: 1, coyoteMs: 150, jumpBufferMs: 190,
                firePowerupRatio: 1, oneUp: 'guaranteed', invincibleMs: 2000,
                bossHpMul: 1, mathAnswerTimeMul: 1, distractorCloseness: 'far' };
        this.score = (data && data.score !== undefined) ? data.score : 0;
        this.coins = (data && data.coins !== undefined) ? data.coins : 0;
        this.lives = (data && data.lives !== undefined) ? data.lives : this.difficultyProfile.lives;
        this.isBig = false;
        this.isFire = false;
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.starPower = false;
        this.isDead = false;
        this.levelComplete = false;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.wasInWater = false;
        this.gravityAxis = 'down';
        this.magnetPolarity = 'blue';
        this.keysCollected = 0;
        this.keyGoal = 0;
        this.mirrorPlayerAtExit = false;
        this.mirrorTwinAtExit = false;
        this._mirrorStuckMs = 0;
        this._lastFrameMs = 0;
        this._enemyBaseSpeed = 56 * (this.difficultyProfile.enemySpeed || 1);
        this._enemyStuckSpeed = 78 * (this.difficultyProfile.enemySpeed || 1);
        this._bubblePool = [];
        this._splashPool = [];
        this.lifeMilestone = Math.floor(this.coins / 100);
    },

    create: function () {
        this.TILE = 32;
        this.levelData = this.getLevelData(this.currentLevel);
        this.worldWidth = this.levelData.worldWidth || 5200;
        this.worldHeight = 600;
        this.groundLevelY = this.levelData.finishGroundY || 544;

        this.registry.set('score', this.score);
        this.registry.set('coins', this.coins);
        this.registry.set('lives', this.lives);
        this.registry.set('level', this.currentLevel);

        this.levelTheme = window.getLevelTheme ? window.getLevelTheme(this.currentLevel) : null;
        this.cameras.main.setBackgroundColor((this.levelTheme && this.levelTheme.bg) || '#9ADFFF');
        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight + 96);

        this.createBackground();
        this.createPhysicsGroups();
        this.buildGround();
        this.buildWonderSystems();
        this.createWonderEnemies();
        this.createCoins();
        this.createFlag();
        this.createPlayer();
        this.createColliders();
        this.createInput();

        if (window.TouchController) {
            window.TouchController.init();
        }

        if (!this.scene.isActive('HUDScene')) {
            this.scene.launch('HUDScene');
        }

        if (window.AudioManager) {
            AudioManager.init();
            AudioManager.startMusic((this.levelTheme && this.levelTheme.music) || 'overworld');
        }

        if (this.mathSpawner) {
            this.mathSpawner.destroy();
            this.mathSpawner = null;
        }
        if (window.MathSpawner && window.MathSettings) {
            this.mathSettings = window.MathSettings.load();
            this.mathSpawner = new window.MathSpawner(this, this.mathSettings);
        }

        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.12, 0.12, -80, 60);
        this.updateCulling(true);

        this.events.on('shutdown', this.shutdown, this);

        if (typeof window !== 'undefined') {
            window.__wonderScene = this;
            window.__mario_test = window.__mario_test || {};
            window.__mario_test.scene = this;
        }
    },

    getLevelData: function (level) {
        if (window.LEVEL_GENERATORS && window.LEVEL_GENERATORS[level]) {
            return window.LEVEL_GENERATORS[level]();
        }
        return window.LEVEL_GENERATORS[43]();
    },

    createPhysicsGroups: function () {
        this.groundTiles = this.createMathGroundGroup();
        this.solidGround = this.physics.add.staticGroup();
        this.pipeTiles = this.physics.add.staticGroup();
        this.brickTiles = this.physics.add.staticGroup();
        this.questionTiles = this.physics.add.staticGroup();
        this.enemies = this.physics.add.group();
        this.coinGroup = this.physics.add.group({ allowGravity: false, immovable: true });
        this.rubberBlocks = this.physics.add.group({ allowGravity: false, immovable: true });
        this.bouncers = this.physics.add.group({ allowGravity: false, immovable: true });
        this.wonderEnemies = this.physics.add.group();
        this.keyGroup = this.physics.add.group({ allowGravity: false, immovable: true });
        this.gravityPads = this.physics.add.group({ allowGravity: false, immovable: true });
        this.segmentedPlatforms = this.physics.add.group({ allowGravity: false, immovable: true });
        this.dissolvingClouds = this.physics.add.group({ allowGravity: false, immovable: true });
        this._solidRects = [];
        this.terrainVisuals = [];
        this.bgLayers = [];
        this.atmoParticles = [];
        this.detailVisuals = [];
        this.sinkingSandGroup = this.physics.add.group({ allowGravity: false, immovable: true });
        this.gearPlatforms = this.physics.add.group({ allowGravity: false, immovable: true });
        this.magnetSwitches = this.physics.add.group({ allowGravity: false, immovable: true });
        this.magnetZones = this.physics.add.group({ allowGravity: false, immovable: true });
        this.mirrorExitGroup = this.physics.add.group({ allowGravity: false, immovable: true });
        this.magnets = [];
    },

    createMathGroundGroup: function () {
        return {
            children: { entries: [] },
            getChildren: function () { return this.children.entries; }
        };
    },

    createBackground: function () {
        var bg = this.levelData.bg || 'plains';
        var top = bg === 'neon' ? '#05030B' : (bg === 'forest' ? '#071827' : (bg === 'depths' ? '#A9E7FF' : (bg === 'peaks' ? '#DDF7FF' : (bg === 'ice' ? '#DFF9FF' : (bg === 'dunes' ? '#FFE8B8' : (bg === 'gears' ? '#3B271B' : (bg === 'magnet' ? '#0C0A16' : (bg === 'mirror' ? '#F8EFFF' : '#6DD7FF'))))))));
        var mid = bg === 'neon' ? '#160A24' : (bg === 'forest' ? '#0B2A36' : (bg === 'depths' ? '#C6F2FF' : (bg === 'peaks' ? '#F1FBFF' : (bg === 'ice' ? '#BDEFFF' : (bg === 'dunes' ? '#F8C66E' : (bg === 'gears' ? '#6B4424' : (bg === 'magnet' ? '#1C1530' : (bg === 'mirror' ? '#DDEBFF' : '#BDF7FF'))))))));
        var bot = bg === 'neon' ? '#07040F' : (bg === 'forest' ? '#102E2E' : (bg === 'depths' ? '#818CF8' : (bg === 'peaks' ? '#FFFFFF' : (bg === 'ice' ? '#EEF9FF' : (bg === 'dunes' ? '#E7B45B' : (bg === 'gears' ? '#2C1A13' : (bg === 'magnet' ? '#090711' : (bg === 'mirror' ? '#EBD7FF' : '#D7FFE6'))))))));
        if (this.game && this.game.canvas) {
            this.game.canvas.style.background = 'linear-gradient(' + top + ', ' + mid + ' 62%, ' + bot + ')';
        }
        this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
        this.bgLayers = [];
    },

    createBakedBackgroundLayers: function (bg) {
        var key = 'wonder-bg-' + bg + '-single';
        if (!this.textures.exists(key)) this.bakeWonderSingleBackgroundTexture(key, bg, 800, 600);
        var layer = this.add.image(0, 0, key).setOrigin(0, 0).setScrollFactor(0).setDepth(-3);
        layer._parallax = 0;
        this.bgLayers.push(layer);
    },

    bakeWonderSingleBackgroundTexture: function (key, bg, w, h) {
        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        var ctx = c.getContext('2d');
        var g = ctx.createLinearGradient(0, 0, 0, h);
        var i, x, y;
        if (bg === 'peaks') {
            g.addColorStop(0, '#DDF7FF');
            g.addColorStop(0.64, '#F1FBFF');
            g.addColorStop(1, '#FFFFFF');
        } else if (bg === 'depths') {
            g.addColorStop(0, '#B9F1FF');
            g.addColorStop(0.62, '#D7F4FF');
            g.addColorStop(1, '#AEB8F7');
        } else if (bg === 'ice') {
            g.addColorStop(0, '#DFF9FF');
            g.addColorStop(0.62, '#EBFCFF');
            g.addColorStop(1, '#F7FEFF');
        } else if (bg === 'dunes') {
            g.addColorStop(0, '#FFEEC9');
            g.addColorStop(0.62, '#F8DA9B');
            g.addColorStop(1, '#F1C572');
        } else if (bg === 'mirror') {
            g.addColorStop(0, '#FBF6FF');
            g.addColorStop(0.62, '#E7F0FF');
            g.addColorStop(1, '#EBD7FF');
        } else {
            g.addColorStop(0, '#8FE6FF');
            g.addColorStop(0.62, '#BDF7FF');
            g.addColorStop(1, '#DFFFEA');
        }
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        if (bg === 'peaks') {
            for (i = 0; i < 9; i++) this.drawSoftCloud(ctx, i * 122 - 80, 70 + (i % 4) * 44, 1.25 + (i % 3) * 0.18, 0.24);
            ctx.fillStyle = 'rgba(194,233,244,0.18)';
            for (i = 0; i < 8; i++) {
                ctx.beginPath();
                ctx.ellipse(i * 126 - 20, 430 + (i % 3) * 12, 116, 32, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (bg === 'depths') {
            ctx.fillStyle = 'rgba(192,132,252,0.15)';
            for (i = 0; i < 10; i++) {
                ctx.beginPath();
                ctx.ellipse(i * 118 - 35, 185 + (i % 5) * 52, 60, 22, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (bg === 'ice') {
            ctx.fillStyle = 'rgba(148,203,226,0.18)';
            for (i = 0; i < 10; i++) {
                x = i * 104 - 30;
                y = h - 112 - (i % 4) * 16;
                ctx.beginPath();
                ctx.moveTo(x, h - 70);
                ctx.quadraticCurveTo(x + 56, y, x + 128, h - 70);
                ctx.fill();
            }
        } else if (bg === 'dunes') {
            ctx.fillStyle = 'rgba(180,135,74,0.15)';
            for (i = 0; i < 8; i++) {
                x = i * 150 - 80;
                y = h - 128 - (i % 3) * 18;
                ctx.beginPath();
                ctx.moveTo(x, h - 70);
                ctx.quadraticCurveTo(x + 110, y, x + 245, h - 70);
                ctx.fill();
            }
        } else if (bg === 'mirror') {
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            for (i = 0; i < 12; i++) {
                ctx.beginPath();
                ctx.ellipse(i * 74, h - 104 - (i % 3) * 8, 50, 13, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            ctx.fillStyle = 'rgba(68,166,112,0.18)';
            for (i = 0; i < 8; i++) {
                x = i * 150 - 70;
                y = h - 120 - (i % 4) * 14;
                ctx.beginPath();
                ctx.moveTo(x, h - 70);
                ctx.quadraticCurveTo(x + 90, y, x + 220, h - 70);
                ctx.fill();
            }
        }
        this.textures.addCanvas(key, c);
    },

    bakeBackgroundPanel: function (key, w, h, index) {
        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        var ctx = c.getContext('2d');
        var bg = this.levelData.bg || 'plains';
        var peaks = bg === 'peaks';
        var forest = bg === 'forest';
        var depths = bg === 'depths';
        var neon = bg === 'neon';
        var grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, neon ? '#05030B' : (forest ? '#071827' : (depths ? '#A9E7FF' : (peaks ? '#DDF7FF' : '#6DD7FF'))));
        grad.addColorStop(0.62, neon ? '#160A24' : (forest ? '#0B2A36' : (depths ? '#C6F2FF' : (peaks ? '#F1FBFF' : '#BDF7FF'))));
        grad.addColorStop(1, neon ? '#07040F' : (forest ? '#102E2E' : (depths ? '#818CF8' : (peaks ? '#FFFFFF' : '#D7FFE6'))));
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        var i, x, y, s, g;
        if (neon) {
            ctx.strokeStyle = 'rgba(244,114,182,0.28)';
            ctx.lineWidth = 5;
            for (i = 0; i < 9; i++) {
                x = (i * 170 + index * 77) % w;
                ctx.beginPath();
                ctx.moveTo(x, 120 + (i % 3) * 80);
                ctx.lineTo(x + 140, 80 + (i % 4) * 92);
                ctx.lineTo(x + 260, 160 + (i % 2) * 120);
                ctx.stroke();
            }
        } else if (forest) {
            for (i = 0; i < 15; i++) {
                x = (i * 86 + index * 43) % (w + 120) - 60;
                g = ctx.createLinearGradient(0, 190, 0, 560);
                g.addColorStop(0, 'rgba(18,78,82,0.34)');
                g.addColorStop(1, 'rgba(7,24,39,0.68)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.ellipse(x, 418, 44 + (i % 3) * 12, 205, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (depths) {
            ctx.fillStyle = 'rgba(192,132,252,0.28)';
            for (i = 0; i < 12; i++) {
                x = (i * 150 + index * 91) % (w + 160) - 80;
                y = 270 + (i % 4) * 70;
                ctx.beginPath();
                ctx.ellipse(x, y, 86 + (i % 3) * 22, 32 + (i % 2) * 18, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        } else for (i = 0; i < 10; i++) {
            x = ((i * 230 + index * 117) % (w + 260)) - 120;
            y = peaks ? 90 + (i % 4) * 54 : 48 + (i % 3) * 42;
            s = peaks ? 1.9 + (i % 3) * 0.35 : 0.8 + (i % 3) * 0.25;
            this.drawSoftCloud(ctx, x, y, s, peaks ? 0.72 : 0.55);
        }

        if (!peaks && !forest && !depths && !neon) {
            ctx.fillStyle = 'rgba(53,170,82,0.32)';
            ctx.beginPath();
            ctx.ellipse(190, 540, 330, 115, 0, 0, Math.PI * 2);
            ctx.ellipse(910, 548, 420, 145, 0, 0, Math.PI * 2);
            ctx.ellipse(1390, 545, 310, 105, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        this.textures.addCanvas(key, c);
    },

    drawSoftCloud: function (ctx, x, y, s, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        var g = ctx.createRadialGradient(x + 100 * s, y + 20 * s, 5, x + 100 * s, y + 20 * s, 120 * s);
        g.addColorStop(0, '#FFFFFF');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(x + 70 * s, y + 45 * s, 80 * s, 28 * s, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 135 * s, y + 46 * s, 95 * s, 34 * s, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 112 * s, y + 18 * s, 58 * s, 34 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    bakeWonderBackgroundTexture: function (key, bg, layer, w, h) {
        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        var ctx = c.getContext('2d');
        var g = ctx.createLinearGradient(0, 0, 0, h);
        var i, x, y, r;
        if (bg === 'ice') {
            g.addColorStop(0, layer === 'sky' ? '#DFF9FF' : 'rgba(223,249,255,0.05)');
            g.addColorStop(1, layer === 'sky' ? '#F4FDFF' : 'rgba(180,235,250,0.05)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = layer === 'far' ? 'rgba(148,203,226,0.34)' : (layer === 'mid' ? 'rgba(115,188,220,0.36)' : 'rgba(214,249,255,0.45)');
            for (i = 0; i < 12; i++) {
                x = i * 104 - 30;
                y = h - 44 - (i % 4) * 18;
                ctx.beginPath();
                ctx.moveTo(x, h);
                ctx.quadraticCurveTo(x + 56, y, x + 128, h);
                ctx.fill();
            }
            ctx.strokeStyle = layer === 'near' ? 'rgba(255,255,255,0.62)' : 'rgba(255,255,255,0.28)';
            ctx.lineWidth = layer === 'near' ? 3 : 2;
            for (i = 0; i < 18; i++) {
                x = i * 70 + (layer === 'mid' ? 28 : 0);
                y = 40 + (i % 5) * 38;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + 34, y + 8);
                ctx.lineTo(x + 12, y + 30);
                ctx.stroke();
            }
        } else if (bg === 'plains') {
            g.addColorStop(0, layer === 'sky' ? '#8FE6FF' : 'rgba(143,230,255,0.04)');
            g.addColorStop(1, layer === 'sky' ? '#DFFFEA' : 'rgba(223,255,234,0.04)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = layer === 'far' ? 'rgba(92,192,128,0.18)' : (layer === 'mid' ? 'rgba(68,166,112,0.22)' : 'rgba(37,132,88,0.16)');
            for (i = 0; i < 9; i++) {
                x = i * 160 - 80;
                y = h - 48 - (i % 4) * 16;
                ctx.beginPath();
                ctx.moveTo(x, h);
                ctx.quadraticCurveTo(x + 90, y, x + 230, h);
                ctx.fill();
            }
            ctx.strokeStyle = layer === 'near' ? 'rgba(26,112,76,0.22)' : 'rgba(255,255,255,0.16)';
            ctx.lineWidth = layer === 'near' ? 3 : 2;
            for (i = 0; i < 16; i++) {
                x = i * 78 + (layer === 'mid' ? 36 : 0);
                y = 110 + (i % 5) * 34;
                ctx.beginPath();
                ctx.moveTo(x, y + 22);
                ctx.quadraticCurveTo(x + 18, y - 6, x + 38, y + 22);
                ctx.stroke();
            }
        } else if (bg === 'peaks') {
            g.addColorStop(0, layer === 'sky' ? '#DDF7FF' : 'rgba(221,247,255,0.03)');
            g.addColorStop(1, layer === 'sky' ? '#F8FDFF' : 'rgba(248,253,255,0.04)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
            if (layer === 'sky') {
                for (i = 0; i < 7; i++) this.drawSoftCloud(ctx, i * 150 - 60, 46 + (i % 3) * 28, 1.05 + (i % 2) * 0.22, 0.30);
            } else {
                for (i = 0; i < 8; i++) {
                    x = i * 150 - 70;
                    y = 58 + (i % 4) * 34;
                    this.drawSoftCloud(ctx, x, y, layer === 'far' ? 1.45 : (layer === 'mid' ? 1.18 : 0.95), layer === 'near' ? 0.36 : 0.26);
                }
            }
            ctx.fillStyle = layer === 'near' ? 'rgba(159,211,230,0.20)' : 'rgba(194,233,244,0.18)';
            for (i = 0; i < 10; i++) {
                x = i * 112 - 30;
                ctx.beginPath();
                ctx.ellipse(x, h - 24 - (i % 3) * 9, 92, 24, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (bg === 'depths') {
            g.addColorStop(0, layer === 'sky' ? '#B9F1FF' : 'rgba(185,241,255,0.04)');
            g.addColorStop(1, layer === 'sky' ? '#AEB8F7' : 'rgba(174,184,247,0.04)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = layer === 'far' ? 'rgba(192,132,252,0.16)' : (layer === 'mid' ? 'rgba(129,140,248,0.20)' : 'rgba(45,212,191,0.13)');
            for (i = 0; i < 12; i++) {
                x = i * 128 - 45;
                y = 118 + (i % 5) * 42;
                ctx.beginPath();
                ctx.ellipse(x, y, 54 + (i % 3) * 18, 18 + (i % 2) * 9, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.strokeStyle = layer === 'near' ? 'rgba(91,33,182,0.20)' : 'rgba(255,255,255,0.16)';
            ctx.lineWidth = layer === 'near' ? 4 : 2;
            for (i = 0; i < 12; i++) {
                x = i * 92 + 20;
                y = h - 68 - (i % 4) * 16;
                ctx.beginPath();
                ctx.moveTo(x, h);
                ctx.quadraticCurveTo(x + 16, y, x + 34, h);
                ctx.stroke();
            }
        } else if (bg === 'dunes') {
            g.addColorStop(0, layer === 'sky' ? '#FFEEC9' : 'rgba(255,238,201,0.03)');
            g.addColorStop(1, layer === 'sky' ? '#F7D48D' : 'rgba(247,212,141,0.04)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
            if (layer === 'sky') {
                g = ctx.createRadialGradient(780, 92, 8, 780, 92, 140);
                g.addColorStop(0, 'rgba(255,247,200,0.78)');
                g.addColorStop(1, 'rgba(255,247,200,0)');
                ctx.fillStyle = g;
                ctx.fillRect(620, 0, 310, 220);
            }
            ctx.fillStyle = layer === 'far' ? 'rgba(226,184,116,0.18)' : (layer === 'mid' ? 'rgba(211,166,94,0.22)' : 'rgba(180,135,74,0.16)');
            for (i = 0; i < 9; i++) {
                x = i * 150 - 80;
                y = h - 36 - (i % 3) * 18;
                ctx.beginPath();
                ctx.moveTo(x, h);
                ctx.quadraticCurveTo(x + 110, y, x + 245, h);
                ctx.fill();
            }
            ctx.strokeStyle = layer === 'near' ? 'rgba(144,104,52,0.24)' : 'rgba(255,255,255,0.16)';
            ctx.lineWidth = 2;
            for (i = 0; i < 18; i++) {
                x = i * 68;
                y = 80 + (i % 6) * 24;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.quadraticCurveTo(x + 24, y - 8, x + 58, y - 2);
                ctx.stroke();
            }
        } else if (bg === 'gears') {
            g.addColorStop(0, layer === 'sky' ? '#3B271B' : 'rgba(59,39,27,0.03)');
            g.addColorStop(1, layer === 'sky' ? '#23140F' : 'rgba(35,20,15,0.04)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
            ctx.strokeStyle = layer === 'near' ? 'rgba(217,164,65,0.34)' : 'rgba(151,101,43,0.25)';
            ctx.lineWidth = layer === 'near' ? 5 : 3;
            for (i = 0; i < 14; i++) {
                x = i * 86 + (layer === 'mid' ? 42 : 0);
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x + 40, h);
                ctx.stroke();
            }
            for (i = 0; i < 9; i++) {
                x = i * 128 + 46;
                y = 70 + (i % 4) * 54;
                r = layer === 'near' ? 30 : 22;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(x, y, r * 0.42, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else if (bg === 'magnet') {
            g.addColorStop(0, layer === 'sky' ? '#0C0A16' : 'rgba(12,10,22,0.02)');
            g.addColorStop(1, layer === 'sky' ? '#1C1530' : 'rgba(28,21,48,0.05)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = layer === 'far' ? 'rgba(68,55,96,0.38)' : (layer === 'mid' ? 'rgba(48,43,72,0.58)' : 'rgba(22,18,36,0.62)');
            for (i = 0; i < 14; i++) {
                x = i * 86 - 22;
                ctx.beginPath();
                ctx.moveTo(x, h);
                ctx.lineTo(x + 38, 40 + (i % 5) * 35);
                ctx.lineTo(x + 94, h);
                ctx.fill();
            }
            ctx.strokeStyle = layer === 'near' ? 'rgba(96,165,250,0.42)' : 'rgba(248,113,113,0.22)';
            ctx.lineWidth = 4;
            for (i = 0; i < 10; i++) {
                x = i * 112 + 30;
                y = 92 + (i % 4) * 42;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + 54, y + 22);
                ctx.stroke();
            }
        } else {
            g.addColorStop(0, layer === 'sky' ? '#FBF6FF' : 'rgba(251,246,255,0.03)');
            g.addColorStop(1, layer === 'sky' ? '#E7F0FF' : 'rgba(231,240,255,0.04)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
            ctx.strokeStyle = layer === 'near' ? 'rgba(168,85,247,0.16)' : 'rgba(96,165,250,0.14)';
            ctx.lineWidth = layer === 'near' ? 4 : 2;
            for (i = 0; i < 12; i++) {
                x = i * 92 + 20;
                ctx.beginPath();
                ctx.roundRect ? ctx.roundRect(x, 36 + (i % 4) * 40, 42, 118, 10) : ctx.rect(x, 36 + (i % 4) * 40, 42, 118);
                ctx.stroke();
            }
            ctx.fillStyle = 'rgba(255,255,255,0.16)';
            for (i = 0; i < 16; i++) {
                ctx.beginPath();
                ctx.ellipse(i * 68, h - 34 - (i % 3) * 8, 48, 12, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        this.textures.addCanvas(key, c);
    },

    buildGround: function () {
        var ground = this.levelData.ground || [];
        for (var i = 0; i < ground.length; i++) {
            if (this.levelData.noGround) this.addStaticCloudIsland(ground[i]);
            else this.addSolidRect(ground[i], this.levelData.groundTop || 'wonder-grass-block', this.levelData.groundFill || 'wonder-earth-block');
        }
        var platforms = this.levelData.platforms || [];
        for (i = 0; i < platforms.length; i++) {
            this.addSolidRect({ x: platforms[i].x, y: platforms[i].y, width: platforms[i].width, height: 32 }, this.levelData.platformTop || 'wonder-grass-block', this.levelData.platformTop || 'wonder-grass-block');
        }
    },

    addSolidRect: function (rect, topKey, fillKey) {
        var cols = Math.ceil(rect.width / this.TILE);
        var rows = Math.ceil(rect.height / this.TILE);
        var startX = rect.x;
        var startY = rect.y;
        var topVisual = this.add.tileSprite(startX, startY, cols * this.TILE, this.TILE, topKey).setOrigin(0, 0).setDepth(3);
        topVisual._cullLeft = startX;
        topVisual._cullRight = startX + cols * this.TILE;
        this.terrainVisuals.push(topVisual);
        this.addSurfaceLip(startX, startY, cols * this.TILE, topKey);
        if (rows > 1) {
            var fillVisual = this.add.tileSprite(startX, startY + this.TILE, cols * this.TILE, (rows - 1) * this.TILE, fillKey).setOrigin(0, 0).setDepth(3);
            fillVisual._cullLeft = startX;
            fillVisual._cullRight = startX + cols * this.TILE;
            this.terrainVisuals.push(fillVisual);
        }
        var zone = this.add.zone(startX + cols * this.TILE / 2, startY + rows * this.TILE / 2, cols * this.TILE, rows * this.TILE);
        this.physics.add.existing(zone, true);
        this.solidGround.add(zone);
        this.addMathGroundMarkers(startX, startY, cols, rows);
        this._solidRects.push({ x: rect.x, y: rect.y, width: cols * this.TILE, height: rows * this.TILE });
    },

    getSurfaceLipColor: function (topKey) {
        if (topKey === 'wonder-cloud-platform' || topKey === 'wonder-segment') return 0x1B79A1;
        if (topKey === 'wonder-ice-top') return 0x0F5F84;
        if (topKey === 'wonder-sand-top') return 0x6A3D0E;
        if (topKey === 'wonder-brass-top') return 0x5A3216;
        if (topKey === 'wonder-mirror-top') return 0x5936B4;
        if (topKey === 'wonder-depths-top') return 0x5B21B6;
        if (topKey === 'wonder-forest-top') return 0x2DD4BF;
        if (topKey === 'wonder-neon-top') return 0xF472B6;
        if (topKey === 'wonder-magnet-top') return 0x60A5FA;
        return 0x047857;
    },

    addSurfaceLip: function (x, y, width, topKey) {
        var lip = this.add.rectangle(x + width / 2, y + 9, width, 10, this.getSurfaceLipColor(topKey), 0.96).setDepth(4);
        lip._cullLeft = x;
        lip._cullRight = x + width;
        this.terrainVisuals.push(lip);
        var shine = this.add.rectangle(x + width / 2, y + 2, width, 3, 0xFFFFFF, 0.70).setDepth(5);
        shine._cullLeft = x;
        shine._cullRight = x + width;
        this.terrainVisuals.push(shine);
    },

    addStaticCloudIsland: function (rect) {
        var cloud = this.solidGround.create(rect.x + rect.width / 2, rect.y + rect.height / 2 - 18, 'wonder-cloud-platform');
        cloud.setDisplaySize(rect.width, 76);
        cloud.refreshBody();
        cloud.setDepth(4);
        this.addSurfaceLip(rect.x, rect.y, rect.width, 'wonder-cloud-platform');
        this.addMathGroundMarkers(rect.x, rect.y, Math.ceil(rect.width / this.TILE), 1);
        this._solidRects.push({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
    },

    addMathGroundMarkers: function (startX, startY, cols, rows) {
        for (var c = 0; c < cols; c++) {
            this.groundTiles.children.entries.push({
                active: true,
                x: startX + c * this.TILE + 16,
                body: {
                    top: startY,
                    bottom: startY + rows * this.TILE,
                    left: startX + c * this.TILE,
                    right: startX + (c + 1) * this.TILE
                }
            });
        }
    },

    buildWonderSystems: function () {
        this.createWater();
        this.createBiomeDetails();
        this.createRubberBlocks();
        this.createBouncers();
        this.createSegmentedPlatforms();
        this.createDissolvingClouds();
        this.createPotEnemies();
        this.createGravityPads();
        this.createKeysAndDoor();
        this.createSinkingSand();
        this.createGearPlatforms();
        this.createMagnets();
        this.createMirrorTwin();
        this.createAtmosphere();
    },

    createWater: function () {
        this.waterLevel = this.levelData.waterLevel || null;
        this.waterZones = this.levelData.waterZones || [];
        this.waterSurfaces = [];
        for (var i = 0; i < this.waterZones.length; i++) {
            var z = this.waterZones[i];
            var water = this.add.rectangle(z.x + z.width / 2, z.y + z.height / 2, z.width, z.height, 0x2DD4BF, 0.38).setDepth(2);
            var band = this.add.rectangle(z.x + z.width / 2, z.y + 5, z.width, 10, 0xFFFFFF, 0.45).setDepth(3);
            var line = this.add.rectangle(z.x + z.width / 2, z.y, z.width, 3, 0xB8FFFF, 0.95).setDepth(4);
            this.waterSurfaces.push({ zone: z, water: water, band: band, line: line });
        }
    },

    createBiomeDetails: function () {
        var i, d, img, post, rope;
        var scaffolds = this.levelData.scaffolds || [];
        for (i = 0; i < scaffolds.length; i++) {
            d = scaffolds[i];
            post = this.add.rectangle(d.x + 22, d.y + d.height / 2, 12, d.height, 0x6B3F25, 1).setDepth(2);
            rope = this.add.rectangle(d.x + d.width / 2, d.y + 18, d.width - 30, 6, 0xB8874E, 1).setDepth(2);
            this.detailVisuals.push(post, rope, this.add.rectangle(d.x + d.width - 22, d.y + d.height / 2, 12, d.height, 0x6B3F25, 1).setDepth(2));
        }
        var plants = this.levelData.glowPlants || [];
        for (i = 0; i < plants.length; i++) {
            d = plants[i];
            img = this.add.image(d.x, d.y, 'wonder-bubble').setTint(0x2DD4BF).setScale(1.1).setDepth(4);
            img._sway = { x: d.x, y: d.y, amp: 4, speed: 760, phase: i * 0.7 };
            this.detailVisuals.push(img);
            this.detailVisuals.push(this.add.rectangle(d.x, d.y + 16, 10, 34, 0x0F766E, 1).setDepth(3));
        }
        var bubbles = this.levelData.bubbles || [];
        for (i = 0; i < bubbles.length; i++) {
            d = bubbles[i];
            img = this.add.image(d.x, d.y, 'wonder-bubble').setScale(0.9).setDepth(4);
            this.detailVisuals.push(img);
        }
        var neonPosts = this.levelData.neonPosts || [];
        for (i = 0; i < neonPosts.length; i++) {
            d = neonPosts[i];
            this.detailVisuals.push(this.add.rectangle(d.x, d.y, 12, 92, 0xF472B6, 0.86).setDepth(3));
            this.detailVisuals.push(this.add.rectangle(d.x - 42, d.y - 42, 84, 5, 0x22D3EE, 0.72).setDepth(3));
        }
        var crystals = this.levelData.iceCrystals || [];
        for (i = 0; i < crystals.length; i++) {
            d = crystals[i];
            img = this.add.image(d.x, d.y, 'wonder-ice-crystal').setScale(0.72 + (i % 2) * 0.16).setDepth(4);
            img._sway = { x: d.x, y: d.y, amp: 2, speed: 920, phase: i * 0.9 };
            this.detailVisuals.push(img);
        }
        var duneGrass = this.levelData.duneGrass || [];
        for (i = 0; i < duneGrass.length; i++) {
            d = duneGrass[i];
            img = this.add.image(d.x, d.y, 'wonder-dune-grass').setScale(0.8).setDepth(4);
            img._sway = { x: d.x, y: d.y, amp: 6, speed: 520, phase: i * 0.8 };
            this.detailVisuals.push(img);
        }
        var pipes = this.levelData.pipes || [];
        for (i = 0; i < pipes.length; i++) {
            d = pipes[i];
            this.detailVisuals.push(this.add.rectangle(d.x + d.width / 2, d.y, d.width, 10, 0xB7791F, 0.72).setDepth(2));
            this.detailVisuals.push(this.add.rectangle(d.x + 18, d.y + 20, 12, 44, 0x7C4A1D, 0.82).setDepth(2));
            this.detailVisuals.push(this.add.rectangle(d.x + d.width - 18, d.y + 20, 12, 44, 0x7C4A1D, 0.82).setDepth(2));
        }
        var columns = this.levelData.mirrorColumns || [];
        for (i = 0; i < columns.length; i++) {
            d = columns[i];
            this.detailVisuals.push(this.add.image(d.x, d.y, 'wonder-mirror-column').setScale(0.85).setAlpha(0.38).setDepth(2));
        }
        this.createWonderBackdropDetails();
    },

    createWonderBackdropDetails: function () {
        var bg = this.levelData.bg || 'plains';
        if (bg !== 'plains' && bg !== 'peaks' && bg !== 'depths' && bg !== 'ice' && bg !== 'dunes' && bg !== 'gears' && bg !== 'magnet' && bg !== 'mirror') return;
        var x, i, obj;
        for (i = 0; i < Math.ceil(this.worldWidth / 360); i++) {
            x = 180 + i * 360;
            if (bg === 'plains') {
                obj = this.add.ellipse(x, 424 + (i % 3) * 14, 230, 64, 0x69C78B, 0.20).setDepth(1);
                this.detailVisuals.push(obj);
                this.detailVisuals.push(this.add.rectangle(x + 74, 504, 120, 7, 0x2F8F61, 0.22).setDepth(1));
                this.detailVisuals.push(this.add.rectangle(x + 14, 486, 8, 42, 0x2F8F61, 0.24).setDepth(1));
                this.detailVisuals.push(this.add.rectangle(x + 134, 486, 8, 42, 0x2F8F61, 0.24).setDepth(1));
            } else if (bg === 'peaks') {
                obj = this.add.ellipse(x, 398 + (i % 3) * 16, 260, 82, 0xBFE9F5, 0.24).setDepth(1);
                this.detailVisuals.push(obj);
                this.detailVisuals.push(this.add.ellipse(x - 72, 372 + (i % 2) * 20, 116, 58, 0xFFFFFF, 0.30).setDepth(1));
                this.detailVisuals.push(this.add.ellipse(x + 62, 360 + (i % 3) * 18, 142, 68, 0xE9FAFF, 0.28).setDepth(1));
            } else if (bg === 'depths') {
                obj = this.add.ellipse(x, 404 + (i % 3) * 18, 230, 60, 0x7DD3FC, 0.18).setDepth(1);
                this.detailVisuals.push(obj);
                this.detailVisuals.push(this.add.ellipse(x + 84, 334 + (i % 4) * 26, 54, 16, 0xC084FC, 0.18).setDepth(1));
                this.detailVisuals.push(this.add.line(x - 76, 474, -16, 34, 0, -20, 0x6D28D9, 0.22).setLineWidth(4).setDepth(1));
                this.detailVisuals.push(this.add.line(x - 76, 474, 0, -20, 20, 32, 0x6D28D9, 0.20).setLineWidth(4).setDepth(1));
            } else if (bg === 'ice') {
                obj = this.add.ellipse(x, 384 + (i % 3) * 18, 210, 58, 0xE9FBFF, 0.42).setDepth(1);
                this.detailVisuals.push(obj);
                this.detailVisuals.push(this.add.line(x + 70, 300 + (i % 2) * 36, -34, 22, 0, -34, 0xFFFFFF, 0.36).setLineWidth(3).setDepth(1));
                this.detailVisuals.push(this.add.line(x + 70, 300 + (i % 2) * 36, 0, -34, 34, 22, 0xFFFFFF, 0.36).setLineWidth(3).setDepth(1));
            } else if (bg === 'dunes') {
                obj = this.add.ellipse(x, 396 + (i % 4) * 12, 260, 72, 0xD8A04F, 0.28).setDepth(1);
                this.detailVisuals.push(obj);
                this.detailVisuals.push(this.add.line(x - 64, 304 + (i % 3) * 38, -42, 0, 42, -10, 0x9C783E, 0.18).setLineWidth(3).setDepth(1));
                this.detailVisuals.push(this.add.triangle(x + 120, 305 + (i % 3) * 38, 0, 0, 26, 10, 2, 20, 0xA47A3D, 0.16).setDepth(1));
            } else if (bg === 'gears') {
                obj = this.add.circle(x, 258 + (i % 4) * 44, 42, 0xB7791F, 0.18).setDepth(1);
                this.detailVisuals.push(obj);
                this.detailVisuals.push(this.add.circle(x, 258 + (i % 4) * 44, 17, 0x1B100A, 0.55).setDepth(1));
                this.detailVisuals.push(this.add.rectangle(x + 150, 420, 190, 8, 0xA86820, 0.34).setDepth(1));
            } else if (bg === 'magnet') {
                this.detailVisuals.push(this.add.triangle(x, 388, 0, 90, 52, 0, 104, 90, 0x33284D, 0.48).setDepth(1));
                this.detailVisuals.push(this.add.circle(x + 80, 300 + (i % 3) * 52, 18, i % 2 ? 0xF87171 : 0x60A5FA, 0.18).setDepth(1));
                this.detailVisuals.push(this.add.rectangle(x + 80, 300 + (i % 3) * 52, 84, 5, i % 2 ? 0xF87171 : 0x60A5FA, 0.22).setDepth(1));
            } else if (bg === 'mirror') {
                obj = this.add.ellipse(x, 398 + (i % 3) * 14, 230, 54, 0xFFFFFF, 0.20).setDepth(1);
                this.detailVisuals.push(obj);
                this.detailVisuals.push(this.add.rectangle(x + 86, 306 + (i % 3) * 38, 34, 116, 0xC4B5FD, 0.11).setDepth(1));
                this.detailVisuals.push(this.add.rectangle(x + 86, 306 + (i % 3) * 38, 4, 116, 0xFFFFFF, 0.24).setDepth(1));
            }
        }
    },

    createRubberBlocks: function () {
        var list = this.levelData.rubberBlocks || [];
        for (var i = 0; i < list.length; i++) {
            var b = this.rubberBlocks.create(list[i].x, list[i].y, 'wonder-rubber-block');
            b.setDisplaySize(96, 96);
            b.body.setSize(384, 384);
            b.body.setAllowGravity(false);
            b.body.setImmovable(true);
            b._restY = list[i].y;
            b._restScaleX = b.scaleX;
            b._restScaleY = b.scaleY;
            b._squash = 0;
            b._cooldown = 0;
            b.setDepth(5);
        }
    },

    createBouncers: function () {
        var list = this.levelData.bouncers || [];
        for (var i = 0; i < list.length; i++) {
            var cap = this.bouncers.create(list[i].x, list[i].y, 'wonder-mushroom-cap');
            cap.setDisplaySize(list[i].width || 150, 60);
            cap.body.setSize(560, 150);
            cap.body.setAllowGravity(false);
            cap.body.setImmovable(true);
            cap._cooldown = 0;
            cap._restScaleX = cap.scaleX;
            cap._restScaleY = cap.scaleY;
            cap.setDepth(6);
        }
    },

    createSegmentedPlatforms: function () {
        var list = this.levelData.segmented || [];
        for (var i = 0; i < list.length; i++) {
            var spec = list[i];
            for (var s = 0; s < spec.count; s++) {
                var seg = this.segmentedPlatforms.create(spec.x + s * 52, spec.y, 'wonder-segment');
                seg.setDisplaySize(48, 16);
                seg.body.setSize(192, 64);
                seg.body.setAllowGravity(false);
                seg.body.setImmovable(true);
                seg._home = { x: spec.x + s * 52, y: spec.y };
                seg._speed = spec.speed || 1.8;
                seg._offset = s * (spec.offset || 0.45);
                seg._prevX = seg.x;
                seg._prevY = seg.y;
                seg.setDepth(5);
            }
        }
    },

    createDissolvingClouds: function () {
        var list = this.levelData.dissolvingClouds || [];
        for (var i = 0; i < list.length; i++) {
            var cl = this.dissolvingClouds.create(list[i].x, list[i].y, 'wonder-cloud-platform');
            cl.setDisplaySize(list[i].width || 176, 72);
            cl.body.setSize(192, 42);
            cl.body.setOffset(0, 38);
            cl.body.setAllowGravity(false);
            cl.body.setImmovable(true);
            cl._base = { x: list[i].x, y: list[i].y, width: list[i].width || 176 };
            cl._restScaleX = cl.scaleX;
            cl._restScaleY = cl.scaleY;
            cl._standMs = 0;
            cl._respawnMs = 0;
            cl._gone = false;
            cl.setDepth(5);
        }
    },

    createPotEnemies: function () {
        var list = this.levelData.pots || [];
        for (var i = 0; i < list.length; i++) {
            var spec = list[i];
            var pot = this.add.image(spec.x, spec.y + 22, 'wonder-yellow-pot').setDisplaySize(56, 70).setDepth(6);
            this.detailVisuals.push(pot);
            this.spawnWonderEnemy({
                x: spec.enemyX || spec.x,
                y: spec.y - 20,
                kind: 'pot',
                dir: (i % 2 === 0) ? 1 : -1,
                patrol: 118,
                speed: 42
            });
        }
    },

    createWonderEnemies: function () {
        var list = this.applyWonderEnemyDifficulty(this.getWonderEnemySpecs());
        for (var i = 0; i < list.length; i++) this.spawnWonderEnemy(list[i]);
    },

    applyWonderEnemyDifficulty: function (enemySpawns) {
        var profile = this.difficultyProfile || { enemyCount: 1 };
        var multiplier = profile.enemyCount || 1;
        if (multiplier <= 1 || enemySpawns.length === 0) return enemySpawns;

        var targetCount = Math.round(enemySpawns.length * multiplier);
        var expanded = enemySpawns.slice();
        var extra = targetCount - enemySpawns.length;
        var spacing = 96;
        for (var i = 0; i < extra; i++) {
            var base = enemySpawns[i % enemySpawns.length];
            var wave = Math.floor(i / enemySpawns.length) + 1;
            var clone = {};
            for (var k in base) {
                if (Object.prototype.hasOwnProperty.call(base, k)) clone[k] = base[k];
            }
            clone.x = base.x + ((base.dir || (i % 2 ? -1 : 1)) * spacing * wave);
            clone.dir = -(base.dir || -1);
            expanded.push(clone);
        }
        return expanded;
    },

    getWonderEnemySpecs: function () {
        var level = this.currentLevel;
        if (level === 43) return [
            { x: 430, y: 506, kind: 'plains-walker', dir: -1 },
            { x: 1140, y: 506, kind: 'plains-shell', dir: -1 },
            { x: 1460, y: 356, kind: 'plains-walker', dir: 1, patrol: 150 },
            { x: 2480, y: 506, kind: 'plains-walker', dir: -1 },
            { x: 2920, y: 372, kind: 'plains-shell', dir: 1, patrol: 140 },
            { x: 3540, y: 506, kind: 'plains-walker', dir: -1 },
            { x: 4620, y: 506, kind: 'plains-walker', dir: -1 }
        ];
        if (level === 44) return [
            { x: 190, y: 390, kind: 'cloud-puff', dir: -1, patrol: 96, speed: 42, float: true },
            { x: 610, y: 374, kind: 'cloud-puff', dir: 1, patrol: 120, speed: 42, float: true },
            { x: 1260, y: 338, kind: 'cloud-puff', dir: -1, patrol: 140, speed: 40, float: true },
            { x: 2050, y: 384, kind: 'cloud-puff', dir: 1, patrol: 116, speed: 42, float: true },
            { x: 3140, y: 346, kind: 'cloud-puff', dir: -1, patrol: 154, speed: 40, float: true },
            { x: 4300, y: 374, kind: 'cloud-puff', dir: 1, patrol: 142, speed: 42, float: true },
            { x: 5290, y: 390, kind: 'cloud-puff', dir: -1, patrol: 130, speed: 40, float: true }
        ];
        if (level === 45) return [
            { x: 360, y: 506, kind: 'glow-crawler', dir: -1 },
            { x: 2220, y: 360, kind: 'glow-crawler', dir: -1, patrol: 160 },
            { x: 5200, y: 506, kind: 'glow-crawler', dir: -1 }
        ];
        if (level === 46) return [
            { x: 430, y: 506, kind: 'depths-crab', dir: -1 },
            { x: 1040, y: 392, kind: 'depths-fish', dir: 1, patrol: 170, speed: 34, swim: true },
            { x: 1650, y: 346, kind: 'depths-fish', dir: -1, patrol: 160, speed: 34, swim: true },
            { x: 2280, y: 412, kind: 'depths-crab', dir: 1, patrol: 160 },
            { x: 2940, y: 350, kind: 'depths-fish', dir: -1, patrol: 180, speed: 34, swim: true },
            { x: 3720, y: 414, kind: 'depths-crab', dir: 1, patrol: 152 },
            { x: 4560, y: 354, kind: 'depths-fish', dir: -1, patrol: 170, speed: 34, swim: true }
        ];
        if (level === 47) return [
            { x: 450, y: 506, kind: 'neon-bot', dir: -1 },
            { x: 1500, y: 58, kind: 'neon-bot', dir: 1, gravity: 'up', patrol: 190 },
            { x: 2220, y: 330, kind: 'neon-bot', dir: -1, patrol: 150 },
            { x: 3120, y: 58, kind: 'neon-shell', dir: -1, gravity: 'up', patrol: 190 },
            { x: 3560, y: 356, kind: 'neon-bot', dir: 1, patrol: 150 },
            { x: 4860, y: 506, kind: 'neon-shell', dir: -1 },
            { x: 5480, y: 506, kind: 'neon-bot', dir: 1 }
        ];
        if (level === 48) return [
            { x: 430, y: 506, kind: 'ice-penguin', dir: -1, speed: 64 },
            { x: 1260, y: 506, kind: 'ice-penguin', dir: 1, speed: 64 },
            { x: 1720, y: 366, kind: 'ice-shell', dir: -1, patrol: 170, speed: 60 },
            { x: 2920, y: 372, kind: 'ice-penguin', dir: 1, patrol: 150, speed: 64 },
            { x: 4040, y: 506, kind: 'ice-penguin', dir: -1, speed: 64 },
            { x: 4340, y: 352, kind: 'ice-penguin', dir: 1, patrol: 170, speed: 60 },
            { x: 5200, y: 506, kind: 'ice-shell', dir: -1, speed: 60 }
        ];
        if (level === 49) return [
            { x: 450, y: 506, kind: 'sand-crab', dir: -1 },
            { x: 1240, y: 382, kind: 'sand-crab', dir: 1, patrol: 150 },
            { x: 1800, y: 506, kind: 'sand-crab', dir: -1 },
            { x: 2140, y: 360, kind: 'sand-shell', dir: -1, patrol: 150 },
            { x: 3300, y: 380, kind: 'sand-crab', dir: 1, patrol: 170 },
            { x: 3960, y: 506, kind: 'sand-crab', dir: -1 },
            { x: 5000, y: 352, kind: 'sand-crab', dir: 1, patrol: 150 }
        ];
        if (level === 50) return [
            { x: 430, y: 392, kind: 'windup-bot', dir: -1, patrol: 128 },
            { x: 980, y: 382, kind: 'windup-bot', dir: 1, patrol: 128 },
            { x: 1580, y: 334, kind: 'windup-bot', dir: -1, patrol: 138 },
            { x: 2290, y: 382, kind: 'windup-shell', dir: 1, patrol: 130 },
            { x: 3020, y: 344, kind: 'windup-bot', dir: -1, patrol: 142 },
            { x: 3860, y: 386, kind: 'windup-bot', dir: 1, patrol: 130 },
            { x: 4680, y: 350, kind: 'windup-bot', dir: -1, patrol: 142 },
            { x: 5320, y: 392, kind: 'windup-shell', dir: 1, patrol: 132 }
        ];
        if (level === 51) return [
            { x: 430, y: 506, kind: 'metal-bug', dir: -1, metal: true },
            { x: 1180, y: 506, kind: 'metal-bug', dir: 1, metal: true },
            { x: 1680, y: 350, kind: 'metal-shell', dir: -1, patrol: 150, metal: true },
            { x: 2860, y: 364, kind: 'metal-bug', dir: 1, patrol: 170, metal: true },
            { x: 4080, y: 346, kind: 'metal-bug', dir: -1, patrol: 150, metal: true },
            { x: 5140, y: 372, kind: 'metal-shell', dir: 1, patrol: 150, metal: true },
            { x: 5620, y: 506, kind: 'metal-bug', dir: -1, metal: true }
        ];
        if (level === 52) return [
            { x: 680, y: 376, kind: 'mirror-creature', dir: -1, patrol: 150 },
            { x: 1540, y: 350, kind: 'mirror-creature', dir: 1, patrol: 150 },
            { x: 2200, y: 392, kind: 'mirror-shell', dir: -1, patrol: 150 },
            { x: 3400, y: 506, kind: 'mirror-creature', dir: 1 },
            { x: 3836, y: 350, kind: 'mirror-creature', dir: -1, patrol: 150 },
            { x: 4696, y: 376, kind: 'mirror-shell', dir: 1, patrol: 150 },
            { x: 5240, y: 506, kind: 'mirror-creature', dir: -1 }
        ];
        return [];
    },

    spawnWonderEnemy: function (spec) {
        var key = this.getWonderEnemyTexture(spec.kind);
        var e = this.wonderEnemies.create(spec.x, spec.y, key);
        var shellType = this.isWonderShellType(spec.kind);
        e.enemyType = shellType ? 'koopa' : 'goomba';
        e.wonderKind = spec.kind;
        e.isShell = false;
        e.shellMoving = false;
        e.shellDir = 0;
        e.isSquished = false;
        e.patrolDir = spec.dir || -1;
        e._originX = spec.x;
        e._patrol = spec.patrol || 180;
        e._baseSpeed = (spec.speed || this._enemyBaseSpeed) * (this.difficultyProfile.enemySpeed || 1);
        e._turnCooldown = 0;
        e._lastX = e.x;
        e._stuckTime = 0;
        e._float = spec.float === true;
        e._swim = spec.swim === true;
        e._metal = spec.metal === true;
        e._gravityAxis = spec.gravity || 'down';
        e.setDepth(9);
        e.setScale(0.5);
        e.setSize(34, shellType ? 34 : 30);
        e.setOffset(shellType ? 7 : 9, shellType ? 8 : 14);
        e.setFlipX(e.patrolDir > 0);
        e.body.setAllowGravity(!e._float && !e._swim);
        if (e._gravityAxis === 'up') {
            e.body.setGravityY(-3200);
            e.setAngle(180);
        }
        if (e._swim || e._float) e.setVelocityY(0);
        e.setVelocityX(e._baseSpeed * e.patrolDir);
        if (shellType) e.play('wonder-shell-enemy-walk', true);
        else e.play(key + '-walk', true);
        return e;
    },

    getWonderEnemyTexture: function (kind) {
        if (kind === 'plains-shell' || kind === 'neon-shell' || kind === 'ice-shell' ||
                kind === 'sand-shell' || kind === 'windup-shell' || kind === 'metal-shell' ||
                kind === 'mirror-shell') return 'wonder-shell-enemy';
        if (kind === 'plains-walker' || kind === 'pot') return 'wonder-plains-walker';
        if (kind === 'cloud-puff') return 'wonder-cloud-puff';
        if (kind === 'glow-crawler') return 'wonder-glow-crawler';
        if (kind === 'depths-fish') return 'wonder-depths-fish';
        if (kind === 'depths-crab') return 'wonder-depths-crab';
        if (kind === 'neon-bot') return 'wonder-neon-bot';
        if (kind === 'ice-penguin') return 'wonder-ice-penguin';
        if (kind === 'sand-crab') return 'wonder-sand-crab';
        if (kind === 'windup-bot') return 'wonder-windup-bot';
        if (kind === 'metal-bug') return 'wonder-metal-bug';
        if (kind === 'mirror-creature') return 'wonder-mirror-creature';
        return 'wonder-enemy';
    },

    isWonderShellType: function (kind) {
        return kind === 'plains-shell' || kind === 'neon-shell' || kind === 'ice-shell' ||
            kind === 'sand-shell' || kind === 'windup-shell' || kind === 'metal-shell' ||
            kind === 'mirror-shell';
    },

    createGravityPads: function () {
        var list = this.levelData.gravityZones || [];
        for (var i = 0; i < list.length; i++) {
            var spec = list[i];
            var key = spec.axis === 'up' ? 'wonder-gravity-up' : 'wonder-gravity-down';
            var pad = this.gravityPads.create(spec.x, spec.y, key);
            pad.setDisplaySize(86, 86);
            pad.body.setSize(220, 220);
            pad.body.setAllowGravity(false);
            pad.body.setImmovable(true);
            pad._axis = spec.axis || 'down';
            pad._cooldown = 0;
            pad.setDepth(7);
        }
    },

    createKeysAndDoor: function () {
        this.keyGoal = this.levelData.keyGoal || 0;
        this.keysCollected = 0;
        var list = this.levelData.keys || [];
        for (var i = 0; i < list.length; i++) {
            var k = this.keyGroup.create(list[i].x, list[i].y, 'wonder-key');
            k.setDisplaySize(42, 42);
            k.body.setSize(120, 120);
            k.body.setAllowGravity(false);
            k._baseY = list[i].y;
            k.setDepth(8);
        }
        if (this.levelData.bossDoor) {
            var d = this.levelData.bossDoor;
            this.bossDoor = this.physics.add.sprite(d.x, d.y, 'wonder-boss-door');
            this.bossDoor.setDisplaySize(80, 112);
            this.bossDoor.body.setAllowGravity(false);
            this.bossDoor.body.setImmovable(true);
            this.bossDoor.setDepth(7);
            this.bossDoorLocked = this.keyGoal > 0;
        }
    },

    createSinkingSand: function () {
        var list = this.levelData.sinkingSand || [];
        for (var i = 0; i < list.length; i++) {
            var spec = list[i];
            var sand = this.sinkingSandGroup.create(spec.x + spec.width / 2, spec.y + spec.height / 2, 'wonder-sinking-sand');
            sand.setDisplaySize(spec.width, spec.height);
            sand.body.setSize(256, 48);
            sand.body.setAllowGravity(false);
            sand.body.setImmovable(true);
            sand._zone = { x: spec.x, y: spec.y, width: spec.width, height: spec.height };
            sand.setDepth(5);
        }
    },

    createGearPlatforms: function () {
        var list = this.levelData.gearPlatforms || [];
        for (var i = 0; i < list.length; i++) {
            var spec = list[i];
            var gear = this.gearPlatforms.create(spec.x, spec.y, 'wonder-gear-platform');
            gear.setDisplaySize(150, 46);
            gear.body.setSize(600, 148);
            gear.body.setAllowGravity(false);
            gear.body.setImmovable(true);
            gear._centerX = spec.x;
            gear._centerY = spec.y;
            gear._radiusX = spec.radiusX || 70;
            gear._radiusY = spec.radiusY || 28;
            gear._speed = spec.speed || 0.55;
            gear._phase = spec.phase || 0;
            gear._prevX = gear.x;
            gear._prevY = gear.y;
            gear.setDepth(6);
            this.detailVisuals.push(this.add.line(spec.x, spec.y, -spec.radiusX, 0, spec.radiusX, 0, 0xA86820, 0.46).setLineWidth(4).setDepth(2));
        }
    },

    createMagnets: function () {
        this.magnetPolarity = this.levelData.magnetPolarity || 'blue';
        this.magnets = [];
        var i, spec, sw, rail, color;
        var switches = this.levelData.magnetSwitches || [];
        for (i = 0; i < switches.length; i++) {
            spec = switches[i];
            sw = this.magnetSwitches.create(spec.x, spec.y, 'wonder-magnet-switch');
            sw.setDisplaySize(74, 58);
            sw.body.setSize(256, 180);
            sw.body.setAllowGravity(false);
            sw.body.setImmovable(true);
            sw._cooldown = 0;
            sw.setDepth(7);
        }
        var rails = this.levelData.rails || [];
        for (i = 0; i < rails.length; i++) {
            spec = rails[i];
            color = spec.polarity === 'red' ? 0xF87171 : 0x60A5FA;
            rail = this.add.rectangle(spec.x, spec.y, spec.width, 10, color, 0.72).setDepth(4);
            this.detailVisuals.push(rail);
            this.detailVisuals.push(this.add.image(spec.x - spec.width / 2 + 22, spec.y, 'wonder-metal-node').setTint(color).setScale(0.72).setDepth(5));
            this.detailVisuals.push(this.add.image(spec.x + spec.width / 2 - 22, spec.y, 'wonder-metal-node').setTint(color).setScale(0.72).setDepth(5));
        }
        var magnets = this.levelData.magnets || [];
        for (i = 0; i < magnets.length; i++) {
            spec = magnets[i];
            color = spec.polarity === 'red' ? 0xF87171 : 0x60A5FA;
            this.magnets.push({
                x: spec.x,
                y: spec.y,
                polarity: spec.polarity || 'blue',
                radius: spec.radius || 340,
                strength: spec.strength || 0.14
            });
            this.detailVisuals.push(this.add.circle(spec.x, spec.y, 42, color, 0.28).setDepth(3));
            this.detailVisuals.push(this.add.image(spec.x, spec.y, 'wonder-metal-node').setTint(color).setScale(1.2).setDepth(5));
        }
        if (this.levelData.magnets || this.levelData.magnetSwitches) {
            this.magnetBadgeBg = this.add.rectangle(118, 82, 142, 26, 0x2563EB, 0.9).setOrigin(0, 0).setScrollFactor(0).setDepth(999);
            this.magnetBadge = this.add.text(118, 82, 'MAGNET: BLUE', {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '10px',
                color: '#FFFFFF',
                padding: { x: 8, y: 6 }
            }).setScrollFactor(0).setDepth(1000);
        }
    },

    createMirrorTwin: function () {
        if (!this.levelData.mirrorTwin) return;
        var spawn = this.levelData.mirrorSpawn || { x: this.worldWidth - 118, y: 438 };
        this.mirrorTwin = this.physics.add.sprite(spawn.x, spawn.y, 'mario');
        this.mirrorTwin.setScale(0.25);
        this.mirrorTwin.setSize(96, 120);
        this.mirrorTwin.setOffset(16, 8);
        this.mirrorTwin.setTint(0x9BD7FF);
        this.mirrorTwin.setAlpha(0.58);
        this.mirrorTwin.setDepth(10);
        this.mirrorTwin.play('mario-idle');
        var mf = this.levelData.mirrorFlag || { x: 180, y: 352 };
        this.mirrorFlagpole = this.physics.add.sprite(mf.x, mf.y, 'flagpole');
        this.mirrorFlagpole.setOrigin(0.5, 0.5);
        this.mirrorFlagpole.body.setAllowGravity(false);
        this.mirrorFlagpole.body.setImmovable(true);
        this.mirrorFlagpole.setSize(64, 360);
        this.mirrorFlagpole.setOffset(96, 12);
        this.mirrorFlagpole.setTint(0x9BD7FF);
        this.mirrorFlagpole.setAlpha(0.68);
        this.mirrorFlagpole.setDepth(4);
    },

    createAtmosphere: function () {
        var bg = this.levelData.bg || 'plains';
        var color = bg === 'forest' ? 0x2DD4BF : (bg === 'depths' ? 0xD9FFFF : (bg === 'neon' ? 0xF472B6 : (bg === 'ice' ? 0xDFF9FF : (bg === 'dunes' ? 0xFACC15 : (bg === 'magnet' ? 0x60A5FA : (bg === 'mirror' ? 0xF0ABFC : 0xFFFFFF))))));
        var count = bg === 'plains' ? 18 : 28;
        if (bg === 'peaks') count = 20;
        if (bg === 'ice' || bg === 'dunes' || bg === 'gears' || bg === 'magnet' || bg === 'mirror') count = 24;
        for (var i = 0; i < count; i++) {
            var p = this.add.image(Phaser.Math.Between(0, 800), Phaser.Math.Between(70, 560), 'wonder-bubble').setScrollFactor(0).setDepth(1);
            p.setTint(color);
            p.setAlpha(bg === 'neon' ? 0.32 : 0.25);
            p.setScale(0.18 + Math.random() * 0.28);
            p._speed = 0.15 + Math.random() * 0.45;
            p._phase = Math.random() * 6.28;
            this.atmoParticles.push(p);
        }
    },

    createCoins: function () {
        var list = this.levelData.coins || [];
        for (var i = 0; i < list.length; i++) {
            var c = this.coinGroup.create(list[i].x, list[i].y, 'coin');
            c.setScale(0.25);
            c.body.setAllowGravity(false);
            c.setSize(48, 56);
            c._baseY = list[i].y;
            c.play('coin-spin');
            c.setDepth(8);
        }
    },

    createFlag: function () {
        var f = this.levelData.flag || { x: this.worldWidth - 180, y: 352 };
        this.flagpole = this.physics.add.sprite(f.x, f.y, 'flagpole');
        this.flagpole.setOrigin(0.5, 0.5);
        this.flagpole.body.setAllowGravity(false);
        this.flagpole.body.setImmovable(true);
        this.flagpole.setSize(64, 360);
        this.flagpole.setOffset(96, 12);
        this.flagpole.setDepth(4);
    },

    createPlayer: function () {
        var spawn = this.levelData.spawn || { x: 96, y: 450 };
        this.player = this.physics.add.sprite(spawn.x, spawn.y, 'mario');
        this.player.setScale(0.25);
        this.player.setSize(96, 120);
        this.player.setOffset(16, 8);
        this.player.setBounce(0);
        this.player.setCollideWorldBounds(false);
        this.player.setDepth(10);
        this.player.play('mario-idle');
    },

    createColliders: function () {
        this.physics.add.collider(this.player, this.solidGround);
        this.physics.add.collider(this.player, this.segmentedPlatforms);
        this.physics.add.collider(this.player, this.gearPlatforms);
        this.physics.add.collider(this.player, this.dissolvingClouds, this.touchCloud, null, this);
        this.physics.add.collider(this.player, this.rubberBlocks, this.hitRubberBlock, null, this);
        this.physics.add.collider(this.player, this.bouncers, this.hitBouncer, null, this);
        this.physics.add.overlap(this.player, this.bouncers, this.hitBouncer, null, this);
        this.physics.add.collider(this.wonderEnemies, this.solidGround);
        this.physics.add.collider(this.wonderEnemies, this.segmentedPlatforms);
        this.physics.add.collider(this.wonderEnemies, this.gearPlatforms);
        this.physics.add.collider(this.wonderEnemies, this.dissolvingClouds);
        this.physics.add.collider(this.player, this.wonderEnemies, this.hitWonderEnemy, null, this);
        if (this.bossDoor) this.physics.add.collider(this.player, this.bossDoor, this.touchBossDoor, null, this);
        this.physics.add.overlap(this.player, this.coinGroup, this.collectCoin, null, this);
        this.physics.add.overlap(this.player, this.keyGroup, this.collectKey, null, this);
        this.physics.add.overlap(this.player, this.gravityPads, this.touchGravityPad, null, this);
        this.physics.add.overlap(this.player, this.sinkingSandGroup, this.touchSinkingSand, null, this);
        this.physics.add.overlap(this.player, this.magnetSwitches, this.touchMagnetSwitch, null, this);
        this.physics.add.overlap(this.player, this.flagpole, this.reachFlagpole, null, this);
        if (this.mirrorTwin) {
            this.physics.add.collider(this.mirrorTwin, this.solidGround);
            this.physics.add.collider(this.mirrorTwin, this.segmentedPlatforms);
            this.physics.add.collider(this.mirrorTwin, this.gearPlatforms);
            this.physics.add.overlap(this.mirrorTwin, this.mirrorFlagpole, this.reachMirrorFlagpole, null, this);
        }
    },

    createInput: function () {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    },

    update: function (time, delta) {
        if (this.isDead || this.levelComplete) {
            if (window.TouchController) window.TouchController.update();
            return;
        }
        if (!this.player || !this.player.body) return;

        try {
            var nowMs = (window.performance && performance.now) ? performance.now() : Date.now();
            var realMs = this._lastFrameMs ? (nowMs - this._lastFrameMs) : (delta || 16);
            this._lastFrameMs = nowMs;
            var frameMs = Math.min(realMs, 50);

            if (this.mathSpawner) this.mathSpawner.update(time, delta);
            this.updateSegmentedPlatforms(time / 1000);
            this.updateGearPlatforms(time / 1000);
            this.updateClouds(frameMs, time);
            this.updateRubberBlocks(frameMs);
            this.updateBouncers(frameMs);
            this.updateWonderEnemies(frameMs);
            this.updateCoins(time);
            this.updateWater(time);
            this.updateGravityPads(frameMs, time);
            this.updateMagnetSwitches(frameMs, time);
            this.updateKeys(time);
            this.updateBackgroundParallax(time);
            this.updateAtmosphere(frameMs, time);
            this.updateDetailMotion(time);
            this.updateCulling(false);
            this.handlePlayer(frameMs);
            this.handleMirrorTwin(frameMs);
            this.applyMagnetForces(frameMs);
            this.updateWonderInvincibility(frameMs);

            if (this.player.y > 720 || this.player.y < -140) this.playerDeath();
            if (this.mirrorTwin && (this.mirrorTwin.y > 720 || this.mirrorTwin.y < -140)) this.respawnMirrorTwin();
            if (this.flagpole && (!this.bossDoorLocked || !this.bossDoor) && this.player.x > this.flagpole.x + 30) this.reachFlagpole(this.player, this.flagpole);

            if (window.TouchController && window.TouchController.enabled) {
                window.TouchController.update();
            }
        } catch (e) {
            this._updateErrorCount = (this._updateErrorCount || 0) + 1;
            if (this._updateErrorCount <= 5) console.error('[WonderScene.update] caught error:', e);
        }
    },

    handlePlayer: function (frameMs) {
        var p = this.player;
        var inWater = this.isPointInWater(p.x, p.body.center.y);
        var upsideDown = this.gravityAxis === 'up';
        var onGround = upsideDown ? (p.body.blocked.up || p.body.touching.up) : (p.body.blocked.down || p.body.touching.down);

        if (inWater !== this.wasInWater) {
            this.makeSplash(p.x, this.waterLevel || p.y);
            this.wasInWater = inWater;
        }

        if (onGround) this.coyoteTimer = 150;
        else this.coyoteTimer = Math.max(0, this.coyoteTimer - frameMs);

        var touchJump = false;
        if (window.TouchController && window.TouchController.jumpJustPressed) {
            touchJump = true;
            window.TouchController.jumpJustPressed = false;
            window.TouchController._jumpConsumed = false;
        }
        var jumpPressed = Phaser.Input.Keyboard.JustDown(this.keySpace) ||
            Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
            Phaser.Input.Keyboard.JustDown(this.keyW) ||
            touchJump;
        if (jumpPressed) this.jumpBufferTimer = 190;
        this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - frameMs);

        var left = this.cursors.left.isDown || this.keyA.isDown || (window.TouchController && window.TouchController.leftPressed);
        var right = this.cursors.right.isDown || this.keyD.isDown || (window.TouchController && window.TouchController.rightPressed);
        var speed = inWater ? 145 : (this.levelData.iceFriction ? 245 : 205);
        var vx = p.body.velocity.x;
        if (this.levelData.iceFriction && !inWater) {
            var accel = onGround ? 0.08 : 0.035;
            if (left) {
                vx -= accel * frameMs;
                p.setFlipX(true);
            } else if (right) {
                vx += accel * frameMs;
                p.setFlipX(false);
            } else if (onGround) {
                vx *= 0.992;
            } else {
                vx *= 0.997;
            }
            vx = Phaser.Math.Clamp(vx, -speed, speed);
            p.setVelocityX(vx);
        } else if (left) {
            p.setVelocityX(-speed);
            p.setFlipX(true);
        } else if (right) {
            p.setVelocityX(speed);
            p.setFlipX(false);
        } else if (inWater) {
            p.setVelocityX(p.body.velocity.x * 0.92);
        } else {
            p.setVelocityX(0);
        }

        if (this.levelData.windForce && !inWater) {
            var wind = (this.levelData.windDirection || 1) * this.levelData.windForce * frameMs;
            p.setVelocityX(Phaser.Math.Clamp(p.body.velocity.x + wind, -260, 260));
        }

        if (inWater) {
            p.body.setGravityY(-480);
            if (p.body.velocity.y > 145) p.setVelocityY(145);
            if (this.jumpBufferTimer > 0) {
                p.setVelocityY(-260);
                this.jumpBufferTimer = 0;
                this.makeBubbles(p.x, p.y);
                if (window.AudioManager) AudioManager.play('jump');
            }
        } else if (this.isPlayerInSinkingSand(p)) {
            p.body.setGravityY(0);
            p.setVelocityY(Math.min(p.body.velocity.y + 0.12 * frameMs, 150));
            if (this.jumpBufferTimer > 0) {
                p.setVelocityY(-440);
                this.jumpBufferTimer = 0;
                this.coyoteTimer = 0;
                this.makeBubbles(p.x, p.y + 20, 0xFACC15);
                if (window.AudioManager) AudioManager.play('jump');
            }
        } else {
            p.body.setGravityY(upsideDown ? -1600 : 0);
            if (this.jumpBufferTimer > 0 && (onGround || this.coyoteTimer > 0)) {
                p.setVelocityY(upsideDown ? 520 : -520);
                this.jumpBufferTimer = 0;
                this.coyoteTimer = 0;
                if (window.AudioManager) AudioManager.play('jump');
            }
        }

        var jumpHeld = this.keySpace.isDown || this.cursors.up.isDown || this.keyW.isDown ||
            (window.TouchController && window.TouchController.jumpPressed);
        p._rubberBounceMs = Math.max(0, (p._rubberBounceMs || 0) - frameMs);
        if (!jumpHeld && !inWater && !upsideDown && p.body.velocity.y < -210 && p._rubberBounceMs <= 0) p.setVelocityY(-210);
        if (!jumpHeld && !inWater && upsideDown && p.body.velocity.y > 210 && p._rubberBounceMs <= 0) p.setVelocityY(210);

        if (!onGround) p.play('mario-jump', true);
        else if (Math.abs(p.body.velocity.x) > 2) p.play('mario-run', true);
        else p.play('mario-idle', true);
        p.setAngle(upsideDown ? 180 : 0);
    },

    isPointInWater: function (x, y) {
        for (var i = 0; i < this.waterZones.length; i++) {
            var z = this.waterZones[i];
            if (x >= z.x && x <= z.x + z.width && y >= z.y && y <= z.y + z.height) return true;
        }
        return false;
    },

    updateWater: function (time) {
        for (var i = 0; i < this.waterSurfaces.length; i++) {
            var w = this.waterSurfaces[i];
            var wave = Math.sin(time / 180 + i) * 3;
            w.band.x = w.zone.x + w.zone.width / 2 + wave;
            w.line.x = w.zone.x + w.zone.width / 2 - wave;
        }
    },

    updateBackgroundParallax: function (time) {
        if (!this.bgLayers) return;
        var cam = this.cameras.main;
        for (var i = 0; i < this.bgLayers.length; i++) {
            this.bgLayers[i].tilePositionX = cam.scrollX * this.bgLayers[i]._parallax + time * 0.002 * this.bgLayers[i]._parallax;
        }
    },

    updateAtmosphere: function (frameMs, time) {
        if (!this.atmoParticles) return;
        var wind = this.levelData.windDirection || 0;
        var bg = this.levelData.bg || 'plains';
        for (var i = 0; i < this.atmoParticles.length; i++) {
            var p = this.atmoParticles[i];
            if (!p) continue;
            p.x += ((bg === 'dunes' ? wind * 0.09 : 0.012) + p._speed * 0.018) * frameMs;
            p.y += Math.sin(time / 420 + p._phase) * 0.12;
            if (p.x > 840) p.x = -30;
            if (p.x < -40) p.x = 830;
        }
    },

    updateDetailMotion: function (time) {
        if (!this.detailVisuals) return;
        for (var i = 0; i < this.detailVisuals.length; i++) {
            var obj = this.detailVisuals[i];
            if (!obj || !obj._sway || !obj.visible) continue;
            obj.x = obj._sway.x + Math.sin(time / obj._sway.speed + obj._sway.phase) * obj._sway.amp;
        }
    },

    updateCoins: function (time) {
        var arr = this.coinGroup.getChildren();
        for (var i = 0; i < arr.length; i++) {
            var c = arr[i];
            if (!c.active) continue;
            var amp = this.isPointInWater(c.x, c._baseY) ? 10 : 4;
            c.y = c._baseY + Math.sin(time / 300 + i) * amp;
        }
    },

    updateKeys: function (time) {
        var arr = this.keyGroup.getChildren();
        for (var i = 0; i < arr.length; i++) {
            var k = arr[i];
            if (!k.active) continue;
            k.y = k._baseY + Math.sin(time / 260 + i) * 7;
            k.setAngle(Math.sin(time / 360 + i) * 8);
        }
        if (this.bossDoor && !this.bossDoorLocked) {
            this.bossDoor.setTint(0xFFFFFF);
            this.bossDoor.setAlpha(0.92 + Math.sin(time / 160) * 0.08);
        }
    },

    updateBouncers: function (frameMs) {
        var arr = this.bouncers.getChildren();
        for (var i = 0; i < arr.length; i++) {
            var b = arr[i];
            b._cooldown = Math.max(0, b._cooldown - frameMs);
            b.scaleX += (b._restScaleX - b.scaleX) * 0.24;
            b.scaleY += (b._restScaleY - b.scaleY) * 0.24;
        }
    },

    updateWonderEnemies: function (frameMs) {
        var arr = this.wonderEnemies.getChildren();
        var shellSpeed = 280 * (this.difficultyProfile.enemySpeed || 1);
        for (var i = 0; i < arr.length; i++) {
            var e = arr[i];
            if (!e.active) continue;
            if (!e.body) continue;

            e._turnCooldown = Math.max(0, (e._turnCooldown || 0) - frameMs);

            if (e.isShell && e.shellMoving) {
                if (e.body.blocked.left) { e.shellDir = 1; e.setFlipX(true); }
                else if (e.body.blocked.right) { e.shellDir = -1; e.setFlipX(false); }
                e.body.setVelocityX(e.shellDir * shellSpeed);
                if (e.anims && e.anims.currentAnim && e.anims.currentAnim.key !== 'wonder-shell-enemy-spin') {
                    e.play('wonder-shell-enemy-spin', true);
                }
                this.wonderShellHitEnemies(e, arr);
                continue;
            }

            if (e.isSquished) continue;

            if (e._swim || e._float) {
                e.body.setAllowGravity(false);
                e.setVelocityY(Math.sin(this.time.now / 420 + i) * (e._swim ? 16 : 10));
            } else if (e._gravityAxis === 'up') {
                e.body.setGravityY(-3200);
            }

            if (this.levelData.windForce && !e._swim) {
                e.setVelocityX(Phaser.Math.Clamp(e.body.velocity.x + (this.levelData.windDirection || 1) * this.levelData.windForce * 0.22 * frameMs, -110, 110));
            }

            if (e._metal && this.magnets && this.magnets.length) this.applyMagnetForcesToEnemy(e, frameMs);

            if (e.x < e._originX - e._patrol && e._turnCooldown <= 0) this.turnWonderEnemy(e, 1, 260);
            if (e.x > e._originX + e._patrol && e._turnCooldown <= 0) this.turnWonderEnemy(e, -1, 260);

            if (e.body.blocked.left && e._turnCooldown <= 0) this.turnWonderEnemy(e, 1, 300);
            else if (e.body.blocked.right && e._turnCooldown <= 0) this.turnWonderEnemy(e, -1, 300);

            if (this.isWonderEnemyOnGround(e) && e._turnCooldown <= 0) {
                var aheadX = e.patrolDir > 0 ? e.body.right + 5 : e.body.left - 5;
                var belowY = e._gravityAxis === 'up' ? e.body.top - 7 : e.body.bottom + 7;
                if (!this.hasSolidTileAtPoint(aheadX, belowY)) {
                    this.turnWonderEnemy(e, -e.patrolDir, 400);
                }
            }

            e._stuckTime = (e._stuckTime || 0) + frameMs;
            if (e._stuckTime > 500) {
                if (Math.abs(e.x - (e._lastX || e.x)) < 5) this.turnWonderEnemy(e, -e.patrolDir, 500, this._enemyStuckSpeed);
                e._lastX = e.x;
                e._stuckTime = 0;
            }

            if ((this.isWonderEnemyOnGround(e) || e._swim || e._float) && Math.abs(e.body.velocity.x) < 10) {
                e.setVelocityX((e._baseSpeed || this._enemyBaseSpeed) * e.patrolDir);
            }

            if (e.y > 720 || e.y < -160) e.destroy();
        }
    },

    turnWonderEnemy: function (enemy, dir, cooldown, speed) {
        enemy.patrolDir = dir;
        enemy.setVelocityX((speed || enemy._baseSpeed || this._enemyBaseSpeed) * dir);
        enemy.setFlipX(dir > 0);
        enemy._turnCooldown = cooldown || 300;
    },

    isWonderEnemyOnGround: function (enemy) {
        if (!enemy || !enemy.body) return false;
        if (enemy._gravityAxis === 'up') return enemy.body.blocked.up || enemy.body.touching.up;
        return enemy.body.blocked.down || enemy.body.touching.down;
    },

    wonderShellHitEnemies: function (shell, arr) {
        for (var i = 0; i < arr.length; i++) {
            var other = arr[i];
            if (other === shell || !other.active || other.isShell || other.isSquished || !other.body) continue;
            if (shell.body.right > other.body.left && shell.body.left < other.body.right &&
                    shell.body.bottom > other.body.top && shell.body.top < other.body.bottom) {
                this.squishWonderEnemy(other, true);
            }
        }
    },

    applyMagnetForcesToEnemy: function (enemy, frameMs) {
        for (var i = 0; i < this.magnets.length; i++) {
            var m = this.magnets[i];
            var dx = m.x - enemy.x;
            var dy = m.y - enemy.y;
            var distSq = dx * dx + dy * dy;
            if (distSq > m.radius * m.radius || distSq < 100) continue;
            var dist = Math.sqrt(distSq);
            var same = this.magnetPolarity === m.polarity;
            var push = (same ? -1 : 1) * (m.strength || 0.12) * frameMs;
            enemy.setVelocityX(Phaser.Math.Clamp(enemy.body.velocity.x + (dx / dist) * push, -120, 120));
        }
    },

    updateGravityPads: function (frameMs, time) {
        var arr = this.gravityPads.getChildren();
        for (var i = 0; i < arr.length; i++) {
            var p = arr[i];
            p._cooldown = Math.max(0, p._cooldown - frameMs);
            p.setAlpha(0.78 + Math.sin(time / 150 + i) * 0.18);
        }
    },

    updateMagnetSwitches: function (frameMs, time) {
        var arr = this.magnetSwitches.getChildren();
        var tint = this.magnetPolarity === 'red' ? 0xF87171 : 0x60A5FA;
        for (var i = 0; i < arr.length; i++) {
            var sw = arr[i];
            sw._cooldown = Math.max(0, sw._cooldown - frameMs);
            sw.setTint(tint);
            sw.setAlpha(0.85 + Math.sin(time / 170 + i) * 0.12);
        }
        if (this.magnetBadge) {
            this.magnetBadge.setTint(this.magnetPolarity === 'red' ? 0xFFE4E6 : 0xDBEAFE);
        }
        if (this.magnetBadgeBg) {
            this.magnetBadgeBg.setFillStyle(this.magnetPolarity === 'red' ? 0xDC2626 : 0x2563EB, 0.9);
        }
    },

    isPlayerInSinkingSand: function (player) {
        var list = this.levelData.sinkingSand || [];
        if (!player || !player.body) return false;
        for (var i = 0; i < list.length; i++) {
            var z = list[i];
            if (player.body.center.x >= z.x && player.body.center.x <= z.x + z.width &&
                player.body.bottom >= z.y - 8 && player.body.top <= z.y + z.height) return true;
        }
        return false;
    },

    touchSinkingSand: function () {},

    touchMagnetSwitch: function (player, sw) {
        if (sw._cooldown > 0) return;
        sw._cooldown = 720;
        this.magnetPolarity = this.magnetPolarity === 'blue' ? 'red' : 'blue';
        if (this.magnetBadge) this.magnetBadge.setText('MAGNET: ' + this.magnetPolarity.toUpperCase());
        this.cameras.main.flash(100, this.magnetPolarity === 'red' ? 248 : 96, this.magnetPolarity === 'red' ? 113 : 165, this.magnetPolarity === 'red' ? 113 : 250, false);
        this.makeBubbles(sw.x, sw.y, this.magnetPolarity === 'red' ? 0xF87171 : 0x60A5FA);
        if (window.AudioManager) AudioManager.play('powerup');
    },

    applyMagnetForces: function (frameMs) {
        if (!this.magnets || !this.magnets.length || !this.player || !this.player.body) return;
        for (var i = 0; i < this.magnets.length; i++) {
            var m = this.magnets[i];
            var dx = m.x - this.player.x;
            var dy = m.y - this.player.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= 8 || dist > m.radius) continue;
            var same = this.magnetPolarity === m.polarity;
            var sign = same ? -1 : 1;
            var falloff = 1 - dist / m.radius;
            var push = sign * m.strength * frameMs * falloff;
            this.player.setVelocityX(Phaser.Math.Clamp(this.player.body.velocity.x + (dx / dist) * push * 120, -290, 290));
            this.player.setVelocityY(Phaser.Math.Clamp(this.player.body.velocity.y + (dy / dist) * push * 80, -620, 620));
        }
    },

    handleMirrorTwin: function (frameMs) {
        var t = this.mirrorTwin;
        if (!t || !t.body || !t.body.enable) return;
        var onGround = t.body.blocked.down || t.body.touching.down;
        var left = this.cursors.left.isDown || this.keyA.isDown || (window.TouchController && window.TouchController.leftPressed);
        var right = this.cursors.right.isDown || this.keyD.isDown || (window.TouchController && window.TouchController.rightPressed);
        var speed = 205;
        if (left) {
            t.setVelocityX(speed);
            t.setFlipX(false);
        } else if (right) {
            t.setVelocityX(-speed);
            t.setFlipX(true);
        } else {
            t.setVelocityX(0);
        }
        if (onGround) this.mirrorCoyoteTimer = 150;
        else this.mirrorCoyoteTimer = Math.max(0, (this.mirrorCoyoteTimer || 0) - frameMs);
        var jumpHeld = this.keySpace.isDown || this.cursors.up.isDown || this.keyW.isDown ||
            (window.TouchController && window.TouchController.jumpPressed);
        if (jumpHeld && !t._jumpHeldLast && (onGround || this.mirrorCoyoteTimer > 0)) {
            t.setVelocityY(-520);
            this.mirrorCoyoteTimer = 0;
        }
        t._jumpHeldLast = jumpHeld;
        if (!jumpHeld && t.body.velocity.y < -210) t.setVelocityY(-210);
        if (!onGround) t.play('mario-jump', true);
        else if (Math.abs(t.body.velocity.x) > 2) t.play('mario-run', true);
        else t.play('mario-idle', true);

        var targetX = this.levelData.mirrorAxisX ? (this.levelData.mirrorAxisX * 2 - this.player.x) : t.x;
        if (Math.abs(t.x - targetX) > 480 && onGround) {
            this._mirrorStuckMs += frameMs;
            if (this._mirrorStuckMs > 900) this.respawnMirrorTwin();
        } else {
            this._mirrorStuckMs = 0;
        }
    },

    respawnMirrorTwin: function () {
        if (!this.mirrorTwin || !this.mirrorTwin.body) return;
        var axis = this.levelData.mirrorAxisX || (this.worldWidth / 2);
        this.mirrorTwin.x = Phaser.Math.Clamp(axis * 2 - this.player.x, 64, this.worldWidth - 64);
        this.mirrorTwin.y = Math.max(120, Math.min(this.player.y, 438));
        this.mirrorTwin.body.setVelocity(0, 0);
        this._mirrorStuckMs = 0;
        this.makeBubbles(this.mirrorTwin.x, this.mirrorTwin.y, 0x9BD7FF);
    },

    reachMirrorFlagpole: function () {
        if (!this.levelData.mirrorTwin) return;
        this.mirrorTwinAtExit = true;
        this.tryMirrorComplete();
    },

    tryMirrorComplete: function () {
        if (!this.levelData.mirrorTwin) return false;
        if (this.mirrorPlayerAtExit && this.mirrorTwinAtExit) {
            this.finishLevelNow();
            return true;
        }
        return false;
    },

    updateCulling: function (force) {
        var cam = this.cameras.main;
        var camCol = Math.floor(cam.scrollX / 32);
        this._cullTick = (this._cullTick || 0) + 1;
        if (!force && camCol === this._lastCullCol && this._cullTick % 8 !== 0) return;
        this._lastCullCol = camCol;
        var left = cam.scrollX - 96;
        var right = cam.scrollX + cam.width + 96;
        this.cullGroup(this.groundTiles, left, right);
        this.cullGroup(this.solidGround, left, right);
        this.cullGroup(this.coinGroup, left, right);
        this.cullGroup(this.rubberBlocks, left, right);
        this.cullGroup(this.bouncers, left, right);
        this.cullGroup(this.wonderEnemies, left, right);
        this.cullGroup(this.keyGroup, left, right);
        this.cullGroup(this.gravityPads, left, right);
        this.cullGroup(this.segmentedPlatforms, left, right);
        this.cullGroup(this.dissolvingClouds, left, right);
        this.cullGroup(this.sinkingSandGroup, left, right);
        this.cullGroup(this.gearPlatforms, left, right);
        this.cullGroup(this.magnetSwitches, left, right);
        this.cullTerrainVisuals(left, right);
        this.cullDetailVisuals(left, right);
    },

    cullTerrainVisuals: function (left, right) {
        if (!this.terrainVisuals) return;
        for (var i = 0; i < this.terrainVisuals.length; i++) {
            var obj = this.terrainVisuals[i];
            var nextVisible = obj._cullRight >= left && obj._cullLeft <= right;
            if (obj.visible !== nextVisible) obj.setVisible(nextVisible);
        }
    },

    cullDetailVisuals: function (left, right) {
        if (!this.detailVisuals) return;
        for (var i = 0; i < this.detailVisuals.length; i++) {
            var obj = this.detailVisuals[i];
            if (!obj || !obj.setVisible) continue;
            var nextVisible = obj.x >= left && obj.x <= right;
            if (obj.visible !== nextVisible) obj.setVisible(nextVisible);
        }
    },

    cullGroup: function (group, left, right) {
        if (!group || !group.getChildren) return;
        var arr = group.getChildren();
        for (var i = 0; i < arr.length; i++) {
            var obj = arr[i];
            if (!obj || !obj.active || obj._gone || !obj.setVisible) continue;
            var nextVisible = obj.x >= left && obj.x <= right;
            if (obj.visible !== nextVisible) obj.setVisible(nextVisible);
        }
    },

    updateSegmentedPlatforms: function (t) {
        var arr = this.segmentedPlatforms.getChildren();
        var p = this.player;
        for (var i = 0; i < arr.length; i++) {
            var seg = arr[i];
            if (!seg.active) continue;
            var cam = this.cameras.main;
            if (seg.x < cam.scrollX - 240 || seg.x > cam.scrollX + cam.width + 240) {
                if (seg.visible) seg.setVisible(false);
                continue;
            } else if (!seg.visible) {
                seg.setVisible(true);
            }
            seg._prevX = seg.x;
            seg._prevY = seg.y;
            seg.y = seg._home.y + Math.sin(t * seg._speed + seg._offset) * 20;
            seg.body.updateFromGameObject();
            var dx = seg.x - seg._prevX;
            var dy = seg.y - seg._prevY;
            if (p && p.body && this.isStandingOn(p, seg)) {
                p.x += dx;
                if (dy < 0) p.y += dy;
            }
        }
    },

    updateGearPlatforms: function (t) {
        var arr = this.gearPlatforms.getChildren();
        var p = this.player;
        for (var i = 0; i < arr.length; i++) {
            var gear = arr[i];
            if (!gear.active) continue;
            var cam = this.cameras.main;
            if (gear.x < cam.scrollX - 260 || gear.x > cam.scrollX + cam.width + 260) {
                if (gear.visible) gear.setVisible(false);
                continue;
            } else if (!gear.visible) {
                gear.setVisible(true);
            }
            gear._prevX = gear.x;
            gear._prevY = gear.y;
            var playerWasRiding = p && p.body && this.isRidingPlatform(p, gear);
            var twinWasRiding = this.mirrorTwin && this.mirrorTwin.body && this.isRidingPlatform(this.mirrorTwin, gear);
            var a = t * gear._speed + gear._phase;
            gear.x = gear._centerX + Math.cos(a) * gear._radiusX;
            gear.y = gear._centerY + Math.sin(a) * gear._radiusY;
            gear.setAngle((a * 180 / Math.PI) % 360);
            gear.body.updateFromGameObject();
            var dx = gear.x - gear._prevX;
            var dy = gear.y - gear._prevY;
            if ((playerWasRiding || (p && p.body && this.isStandingOn(p, gear)))) {
                p.x += dx;
                if (dy < 0) p.y += dy;
            }
            if (twinWasRiding || (this.mirrorTwin && this.mirrorTwin.body && this.isStandingOn(this.mirrorTwin, gear))) {
                this.mirrorTwin.x += dx;
                if (dy < 0) this.mirrorTwin.y += dy;
            }
        }
    },

    updateClouds: function (frameMs, time) {
        var arr = this.dissolvingClouds.getChildren();
        for (var i = 0; i < arr.length; i++) {
            var cl = arr[i];
            if (!cl.active) continue;
            if (cl._gone) {
                cl._respawnMs -= frameMs;
                if (cl._respawnMs <= 0) {
                    cl._gone = false;
                    cl._standMs = 0;
                    cl.setVisible(true).setAlpha(1).setScale(cl._restScaleX, cl._restScaleY);
                    cl.body.enable = true;
                }
                continue;
            }

            var playerNear = this.player && this.player.body &&
                this.player.body.right > cl.body.left + 4 &&
                this.player.body.left < cl.body.right - 4 &&
                this.player.body.bottom >= cl.body.top - 24 &&
                this.player.body.bottom <= cl.body.top + 88;
            if (this.isStandingOn(this.player, cl) || (cl._standMs > 0 && playerNear)) {
                cl._standMs += frameMs * 1.5;
            } else {
                cl._standMs = Math.max(0, cl._standMs - frameMs * 1.4);
            }

            var ratio = Phaser.Math.Clamp(cl._standMs / 800, 0, 1);
            cl.setTint(ratio > 0.45 ? 0xFFE6F7 : 0xFFFFFF);
            cl.x = cl._base.x + Math.sin(time / 55) * ratio * 6;
            cl.setScale(
                cl._restScaleX * (1 + Math.sin(time / 70) * ratio * 0.08),
                cl._restScaleY * Math.max(0.16, 1 - ratio * 0.86)
            );
            cl.setAlpha(1 - ratio * 0.45);
            if (ratio >= 1) {
                cl._gone = true;
                cl._respawnMs = 1650;
                cl.setVisible(false);
                cl.body.enable = false;
            }
        }
    },

    updateRubberBlocks: function (frameMs) {
        var arr = this.rubberBlocks.getChildren();
        for (var i = 0; i < arr.length; i++) {
            var b = arr[i];
            b._cooldown = Math.max(0, b._cooldown - frameMs);
            b.scaleX += (b._restScaleX - b.scaleX) * 0.22;
            b.scaleY += (b._restScaleY - b.scaleY) * 0.22;
            b.y += (b._restY - b.y) * 0.22;
        }
    },

    isStandingOn: function (player, obj) {
        if (!player || !player.body || !obj || !obj.body || !obj.body.enable) return false;
        return player.body.bottom <= obj.body.top + 14 &&
            player.body.bottom >= obj.body.top - 12 &&
            player.body.right > obj.body.left + 4 &&
            player.body.left < obj.body.right - 4 &&
            player.body.velocity.y >= -20;
    },

    isRidingPlatform: function (player, obj) {
        if (!player || !player.body || !obj || !obj.body || !obj.body.enable) return false;
        return player.body.bottom <= obj.body.top + 26 &&
            player.body.bottom >= obj.body.top - 28 &&
            player.body.right > obj.body.left + 6 &&
            player.body.left < obj.body.right - 6 &&
            player.body.velocity.y >= -80;
    },

    touchCloud: function () {},

    hitRubberBlock: function (player, block) {
        if (!this.isStandingOn(player, block) || block._cooldown > 0) return;
        block._cooldown = 260;
        block.setScale(block._restScaleX * 1.08, block._restScaleY * 0.74);
        block.y = block._restY + 12;
        player._rubberBounceMs = 280;
        player.setVelocityY(-610);
        this.makeBubbles(block.x, block.y - 52, 0xFFD447);
        if (window.AudioManager) AudioManager.play('powerup');
    },

    hitBouncer: function (player, cap) {
        if (cap._cooldown > 0) return;
        var vy = player.body.velocity.y;
        var nextVy;
        if (this.gravityAxis === 'up') {
            nextVy = Math.min(Math.max(Math.abs(vy) * 1.2, 480), 640);
        } else {
            nextVy = -Math.min(Math.max(Math.abs(vy) * 1.2, 480), 640);
        }
        cap._cooldown = 220;
        cap.setScale(cap._restScaleX * 1.08, cap._restScaleY * 0.78);
        player._rubberBounceMs = 260;
        player.setVelocityY(nextVy);
        this.makeBubbles(cap.x, cap.y - 22, 0x2DD4BF);
        if (window.AudioManager) AudioManager.play('jump');
    },

    hitWonderEnemy: function (player, enemy) {
        if (!enemy.active) return;
        var shellSpeed = 280 * (this.difficultyProfile.enemySpeed || 1);

        if (enemy.isShell) {
            if (enemy.shellMoving) {
                if (this.time.now < (enemy._kickGraceUntil || 0)) return;
                var shellStomp = this.gravityAxis === 'up' ?
                    (player.body.velocity.y < -40 && player.body.top <= enemy.body.bottom + 20) :
                    (player.body.velocity.y > -40 && player.body.bottom <= enemy.body.top + 22);
                if (shellStomp) {
                    enemy.shellMoving = false;
                    enemy.shellDir = 0;
                    enemy.body.setVelocityX(0);
                    enemy.play('wonder-shell-enemy-shell', true);
                    player.setVelocityY(this.gravityAxis === 'up' ? 250 : -250);
                } else if (!this.isInvincible && !this.starPower) {
                    this.playerHit();
                }
            } else {
                var kdir = (player.x < enemy.x) ? 1 : -1;
                enemy.shellMoving = true;
                enemy.shellDir = kdir;
                enemy.body.setVelocityX(kdir * shellSpeed);
                enemy.setFlipX(kdir > 0);
                enemy._kickGraceUntil = this.time.now + 300;
                enemy.play('wonder-shell-enemy-spin', true);
                player.setVelocityY(this.gravityAxis === 'up' ? 150 : -150);
                if (window.AudioManager) AudioManager.play('kick');
            }
            return;
        }

        if (enemy.isSquished) return;
        if (this.starPower) {
            this.squishWonderEnemy(enemy, true);
            return;
        }

        var stomp = this.gravityAxis === 'up' ?
            (player.body.velocity.y < -40 && player.body.top <= enemy.body.bottom + 16) :
            (player.body.velocity.y > 40 && player.body.bottom >= enemy.body.top - 16);
        if (stomp) {
            this.squishWonderEnemy(enemy, false);
            player.setVelocityY(this.gravityAxis === 'up' ? 320 : -320);
        } else {
            if (this.isInvincible) return;
            this.playerHit();
        }
    },

    squishWonderEnemy: function (enemy, forceKill) {
        if (!enemy.active || enemy.isSquished) return;
        if (window.AudioManager) AudioManager.play('stomp');
        enemy.isSquished = true;

        if (enemy.enemyType === 'koopa' && !forceKill && !enemy.isShell) {
            enemy.isShell = true;
            enemy.shellMoving = false;
            enemy.shellDir = 0;
            enemy.body.setVelocity(0, 0);
            enemy.body.setAllowGravity(enemy._gravityAxis !== 'up');
            enemy.play('wonder-shell-enemy-shell', true);
            this.score += 200;
            this.registry.set('score', this.score);
            this.events.emit('scoreChange', this.score);
            return;
        }

        enemy.body.setVelocity(0, 0);
        enemy.body.setAllowGravity(false);
        enemy.body.setEnable(false);
        if (enemy.enemyType === 'koopa') enemy.play('wonder-shell-enemy-shell', true);
        else enemy.play(enemy.texture.key + '-squish', true);
        this.score += 200;
        this.registry.set('score', this.score);
        this.events.emit('scoreChange', this.score);
        this.time.delayedCall(450, function () {
            if (enemy && enemy.active) enemy.destroy();
        });
    },

    playerHit: function () {
        this.loseOnePower({ source: 'enemy' });
    },

    loseOnePower: function () {
        if (this.isInvincible || this.isDead || this.starPower) return;
        if (this.isFire) {
            if (window.AudioManager) AudioManager.play('bump');
            this.isFire = false;
            this.isBig = true;
            this.isInvincible = true;
            this.invincibleTimer = this.difficultyProfile.invincibleMs;
            return;
        }
        if (this.isBig) {
            if (window.AudioManager) AudioManager.play('bump');
            this.isBig = false;
            this.player.setTexture('mario');
            this.player.setSize(96, 120);
            this.player.setOffset(16, 8);
            this.player.play('mario-idle');
            this.isInvincible = true;
            this.invincibleTimer = this.difficultyProfile.invincibleMs;
            return;
        }
        this.playerDeath();
    },

    updateWonderInvincibility: function (frameMs) {
        if (!this.isInvincible || !this.invincibleTimer || !this.player) return;
        this.invincibleTimer -= frameMs;
        this.player.setAlpha(Math.floor(this.invincibleTimer / 100) % 2 === 0 ? 0.4 : 1);
        if (this.invincibleTimer <= 0) {
            this.isInvincible = false;
            this.invincibleTimer = 0;
            this.player.setAlpha(1);
        }
    },

    touchGravityPad: function (player, pad) {
        if (pad._cooldown > 0 || this.gravityAxis === pad._axis) return;
        pad._cooldown = 900;
        this.gravityAxis = pad._axis;
        player.setVelocityY(pad._axis === 'up' ? -80 : 80);
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.cameras.main.flash(120, pad._axis === 'up' ? 244 : 34, pad._axis === 'up' ? 114 : 211, pad._axis === 'up' ? 182 : 238, false);
        this.makeBubbles(player.x, player.y, pad._axis === 'up' ? 0xF472B6 : 0x22D3EE);
        if (window.AudioManager) AudioManager.play('powerup');
    },

    collectKey: function (player, key) {
        key.destroy();
        this.keysCollected++;
        this.score += 250;
        this.registry.set('score', this.score);
        this.events.emit('scoreChange', this.score);
        if (window.AudioManager) AudioManager.play('coin');
        if (this.bossDoor && this.keysCollected >= this.keyGoal) {
            this.bossDoorLocked = false;
            this.bossDoor.body.enable = false;
            this.bossDoor.setTint(0xA7F3D0);
            this.makeBubbles(this.bossDoor.x, this.bossDoor.y, 0xFACC15);
        }
    },

    touchBossDoor: function (player, door) {
        if (this.bossDoorLocked) {
            player.x = Math.min(player.x, door.x - 62);
            player.setVelocityX(-120);
            return;
        }
        this.reachFlagpole();
    },

    collectCoin: function (player, coin) {
        coin.destroy();
        this.coins++;
        this.score += 100;
        this.registry.set('score', this.score);
        this.registry.set('coins', this.coins);
        this.events.emit('scoreChange', this.score);
        this.events.emit('coinCollect', this.coins);
        if (window.AudioManager) AudioManager.play('coin');

        var milestone = Math.floor(this.coins / 100);
        if (milestone > this.lifeMilestone) {
            this.lives += milestone - this.lifeMilestone;
            this.lifeMilestone = milestone;
            this.registry.set('lives', this.lives);
            this.events.emit('livesChange', this.lives);
        }
    },

    makeSplash: function (x, y) {
        for (var i = 0; i < 8; i++) {
            var drop = this.add.circle(x, y, 3, 0xD9FFFF, 0.85).setDepth(12);
            this.tweens.add({
                targets: drop,
                x: x + Phaser.Math.Between(-42, 42),
                y: y + Phaser.Math.Between(-28, 12),
                alpha: 0,
                duration: 360,
                ease: 'Sine.easeOut',
                onComplete: function () { this.destroy(); }
            });
        }
    },

    makeBubbles: function (x, y, tint) {
        for (var i = 0; i < 6; i++) {
            var b = this.add.image(x + Phaser.Math.Between(-18, 18), y + Phaser.Math.Between(-8, 14), 'wonder-bubble').setDepth(12);
            if (tint) b.setTint(tint);
            b.setScale(0.35 + Math.random() * 0.35);
            this.tweens.add({
                targets: b,
                y: b.y - Phaser.Math.Between(28, 54),
                x: b.x + Phaser.Math.Between(-14, 14),
                alpha: 0,
                duration: 560,
                ease: 'Sine.easeOut',
                onComplete: function () { this.destroy(); }
            });
        }
    },

    reachFlagpole: function () {
        if (this.levelComplete) return;
        if (this.levelData.mirrorTwin) {
            this.mirrorPlayerAtExit = true;
            if (!this.tryMirrorComplete()) {
                this.player.setVelocityX(0);
                this.player.x = Math.min(this.player.x, this.flagpole.x - 18);
            }
            return;
        }
        this.finishLevelNow();
    },

    finishLevelNow: function () {
        if (this.levelComplete) return;
        this.levelComplete = true;
        this.cleanupMathSpawner();
        this.score += 1000;
        this.registry.set('score', this.score);
        if (window.AudioManager) { AudioManager.stopMusic(); AudioManager.play('flagpole'); }
        this.player.body.setVelocity(0, 0);
        this.player.body.setAllowGravity(false);
        this.player.body.setEnable(false);
        if (this.mirrorTwin && this.mirrorTwin.body) {
            this.mirrorTwin.body.setVelocity(0, 0);
            this.mirrorTwin.body.setAllowGravity(false);
            this.mirrorTwin.body.setEnable(false);
        }
        this.tweens.add({
            targets: this.player,
            y: this.groundLevelY - 16,
            duration: 650,
            ease: 'Sine.easeOut',
            onComplete: function () {
                this.scene.stop('HUDScene');
                this.scene.start('WinScene', {
                    score: this.score,
                    coins: this.coins,
                    lives: this.lives,
                    level: this.currentLevel
                });
            },
            callbackScope: this
        });
    },

    playerDeath: function () {
        if (this.isDead) return;
        this.isDead = true;
        this.cleanupMathSpawner();
        if (window.AudioManager) { AudioManager.stopMusic(); AudioManager.play('death'); }
        this.player.play('mario-death');
        this.player.body.setVelocity(0, 0);
        this.player.body.setAllowGravity(false);
        this.player.body.setEnable(false);
        this.tweens.add({
            targets: this.player,
            y: this.player.y - 60,
            duration: 320,
            yoyo: true,
            ease: 'Sine.easeOut',
            onComplete: function () {
                this.lives--;
                this.registry.set('lives', this.lives);
                this.events.emit('livesChange', this.lives);
                if (this.lives <= 0) {
                    this.scene.stop('HUDScene');
                    this.scene.start('MenuScene');
                } else {
                    this.scene.restart({
                        level: this.currentLevel,
                        score: this.score,
                        coins: this.coins,
                        lives: this.lives
                    });
                }
            },
            callbackScope: this
        });
    },

    hasSolidTileAtPoint: function (x, y) {
        for (var i = 0; i < this._solidRects.length; i++) {
            var r = this._solidRects[i];
            if (x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height) return true;
        }
        return false;
    },

    cleanupMathSpawner: function () {
        if (this.mathSpawner) {
            this.mathSpawner.destroy();
            this.mathSpawner = null;
        }
    },

    shutdown: function () {
        this.cleanupMathSpawner();
        this.events.off('shutdown', this.shutdown, this);
        if (window.__wonderScene === this) window.__wonderScene = null;
    }
});

if (typeof window !== 'undefined') window.WonderScene = WonderScene;
