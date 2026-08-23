/**
 * Currently not wired into the game; kept in the repo for future runner work.
 *
 * RunnerScene — Level 43 behind-the-back runner.
 *
 * This scene intentionally does not share GameScene's side-scrolling world,
 * physics, English word popups, or map data. It only shares registry keys and
 * WinScene/HUDScene flow so progression and the overlay keep working.
 */

var RunnerScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function RunnerScene() {
        Phaser.Scene.call(this, { key: 'RunnerScene' });
    },

    init: function (data) {
        this.currentLevel = (data && data.level) ? data.level : 43;
        this.mathSettings = window.MathSettings ? window.MathSettings.load() : null;
        this.difficultyProfile = window.MathSettings
            ? window.MathSettings.difficultyProfile(this.mathSettings)
            : { lives: 3, invincibleMs: 2000, mathAnswerTimeMul: 1, distractorCloseness: 'far' };
        this.score = (data && data.score !== undefined) ? data.score : 0;
        this.coins = (data && data.coins !== undefined) ? data.coins : 0;
        this.lives = (data && data.lives !== undefined) ? data.lives : this.difficultyProfile.lives;
    },

    create: function () {
        var W = this.cameras.main.width;
        var H = this.cameras.main.height;

        this.levelComplete = false;
        this.isDead = false;
        this.distance = 0;
        this._lastFrameMs = 0;   // wall-clock frame timing (see update)
        this.trackLength = 9800;
        this.speed = 92;
        this.maxSpeed = 128;
        this.baseSpeed = 92;
        this.speedRamp = 1.0;
        this.lane = 0;
        this.targetLane = 0;
        this.visualLane = 0;
        this.laneTween = null;
        this.jumpY = 0;
        this.jumpVelocity = 0;
        this.invincibleTimer = 0;
        this.feedbackTimer = 0;
        this.jumpScaleTimer = 0;
        this.landingPuffs = [];
        this._laneCooldown = 0;
        this._mathHistory = [];
        this._checkedObjects = {};
        this.runnerStats = { lowObstacles: 0, solidObstacles: 0, lowCleared: 0, lowHits: 0 };

        this.focal = 315;
        this.horizonY = 150;
        this.groundY = 548;
        this.laneWidth = 245;
        this.nearClip = 35;
        this.farClip = 1250;
        this.objectRenderFarClip = 750;

        this.registry.set('score', this.score);
        this.registry.set('coins', this.coins);
        this.registry.set('lives', this.lives);
        this.registry.set('level', this.currentLevel);

        this.levelTheme = window.getLevelTheme ? window.getLevelTheme(this.currentLevel) : null;
        this.cameras.main.setBackgroundColor((this.levelTheme && this.levelTheme.bg) || '#91D8FF');

        this.createRunnerSceneryTextures();
        this.createBackground(W, H);
        this.buildRoadsideScenery();
        this.createTrackLayers(W, H);
        this.scale.on('resize', this.resizeTrack, this);
        this.shadow = this.add.ellipse(W / 2, this.groundY - 18, 70, 20, 0x000000, 0.28).setDepth(80);
        this.player = this.add.sprite(W / 2, this.groundY - 70, 'mario-runner', 0);
        this.player.setOrigin(0.5, 1);
        this.player.setScale(0.62);
        this.player.setDepth(90);
        this.player.play('mario-runner-run');
        this._playerAnim = 'mario-runner-run';

        // The HUD bar occupies the top 116px and the quit button's hit zone
        // reaches y=132 around x=572..668 — keep this row clear of both, or the
        // quit button sits on top of the FINISH label.
        this.progressBg = this.add.rectangle(W / 2, 144, 330, 14, 0x000000, 0.45).setDepth(95);
        this.progressFill = this.add.rectangle(W / 2 - 163, 144, 0, 8, 0x7CFF72, 1).setOrigin(0, 0.5).setDepth(96);
        this.finishLabel = this.add.text(W / 2 + 182, 144, 'FINISH', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0, 0.5).setDepth(96);

        // Below the HUD bar, not inside it — the sum is the main thing to read.
        this.problemText = this.add.text(W / 2, 178, '', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '20px',
            color: '#FFFFFF',
            stroke: '#19285A',
            strokeThickness: 5,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        this.feedbackText = this.add.text(W / 2, 214, '', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '13px',
            color: '#F8D830',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Bind the on-screen D-pad / JUMP buttons. Only GameScene used to call
        // this, so entering level 43 straight from the menu left the buttons
        // completely inert — the scene read TouchController's flags but nothing
        // ever set them. init() guards itself against double-binding.
        if (window.TouchController) {
            window.TouchController.init();
        }

        this.objects = [];
        this.buildTrackObjects();
        window.__runnerScene = this;

        if (!this.scene.isActive('HUDScene')) {
            this.scene.launch('HUDScene');
        }

        if (window.AudioManager) {
            AudioManager.init();
            AudioManager.startMusic((this.levelTheme && this.levelTheme.music) || 'overworld');
        }

        this.events.on('shutdown', this.shutdown, this);
        console.log('[RunnerScene] Level 43 runner created. lowObstacle=' + this.runnerStats.lowObstacles + ' obstacle=' + this.runnerStats.solidObstacles);
    },

    createBackground: function (W, H) {
        this.drawStaticTrack(W, H);
    },

    createRunnerSceneryTextures: function () {
        if (this.textures.exists('runner-roadside-pop')) return;

        var c, ctx;

        c = document.createElement('canvas');
        c.width = 4;
        c.height = 4;
        ctx = c.getContext('2d');
        ctx.fillStyle = '#6478F2';
        ctx.fillRect(0, 0, 4, 4);
        this.textures.addCanvas('runner-road-band-light', c);

        c = document.createElement('canvas');
        c.width = 4;
        c.height = 4;
        ctx = c.getContext('2d');
        ctx.fillStyle = '#495ED8';
        ctx.fillRect(0, 0, 4, 4);
        this.textures.addCanvas('runner-road-band-dark', c);

        c = document.createElement('canvas');
        c.width = 4;
        c.height = 4;
        ctx = c.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 4, 4);
        this.textures.addCanvas('runner-speed-line', c);

        c = document.createElement('canvas');
        c.width = 110;
        c.height = 96;
        ctx = c.getContext('2d');
        ctx.fillStyle = 'rgba(71,217,255,0.28)';
        ctx.strokeStyle = 'rgba(255,255,255,0.65)';
        ctx.lineWidth = 4;
        ctx.fillRect(6, 6, 98, 84);
        ctx.strokeRect(6, 6, 98, 84);
        ctx.fillStyle = 'rgba(255,247,232,0.96)';
        ctx.strokeStyle = '#2868F0';
        ctx.lineWidth = 5;
        ctx.fillRect(12, 11, 86, 74);
        ctx.strokeRect(12, 11, 86, 74);
        ctx.fillStyle = '#FFD447';
        ctx.fillRect(16, 11, 78, 8);
        this.textures.addCanvas('runner-math-panel', c);

        c = document.createElement('canvas');
        c.width = 96;
        c.height = 160;
        ctx = c.getContext('2d');
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(48, 154);
        ctx.lineTo(48, 50);
        ctx.stroke();
        ctx.fillStyle = '#FF5EA8';
        ctx.beginPath();
        ctx.arc(48, 42, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.72)';
        ctx.beginPath();
        ctx.arc(40, 34, 8, 0, Math.PI * 2);
        ctx.fill();
        this.textures.addCanvas('runner-roadside-pop', c);

        c = document.createElement('canvas');
        c.width = 96;
        c.height = 160;
        ctx = c.getContext('2d');
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(48, 154);
        ctx.lineTo(48, 55);
        ctx.stroke();
        ctx.fillStyle = '#FFD447';
        ctx.beginPath();
        ctx.moveTo(48, 18);
        ctx.lineTo(23, 70);
        ctx.lineTo(73, 70);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#D88A00';
        ctx.lineWidth = 4;
        ctx.stroke();
        this.textures.addCanvas('runner-roadside-sign', c);

        c = document.createElement('canvas');
        c.width = 128;
        c.height = 160;
        ctx = c.getContext('2d');
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(64, 154);
        ctx.lineTo(64, 56);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(72,247,255,0.82)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(64, 94, 46, Math.PI, 0);
        ctx.stroke();
        this.textures.addCanvas('runner-roadside-arc', c);
    },

    createTrackLayers: function (W, H) {
        this.roadBandPool = [];
        this.speedLinePool = [];
        this.cloudSprites = [];
        this.roadsideSprites = [];

        for (var i = 0; i < 3; i++) {
            this.cloudSprites.push(this.add.image(0, 0, 'cloud', 0).setOrigin(0.5).setAlpha(0.76).setDepth(0.2));
        }

        for (var band = 0; band < 4; band++) {
            this.roadBandPool.push(this.add.image(0, 0, band % 2 === 0 ? 'runner-road-band-light' : 'runner-road-band-dark')
                .setOrigin(0.5)
                .setAlpha(0.7)
                .setDepth(1.1)
                .setVisible(false));
        }

        for (var s = 0; s < 4; s++) {
            this.speedLinePool.push(this.add.image(0, 0, 'runner-speed-line')
                .setOrigin(0.5)
                .setAlpha(0.16)
                .setDepth(1.3)
                .setVisible(false));
        }

        for (var r = 0; r < this.roadsideObjects.length; r++) {
            var key = this.roadsideObjects[r].kind === 0 ? 'runner-roadside-pop' :
                (this.roadsideObjects[r].kind === 1 ? 'runner-roadside-sign' : 'runner-roadside-arc');
            this.roadsideSprites.push(this.add.image(0, 0, key).setOrigin(0.5, 1).setDepth(2).setVisible(false));
        }
    },

    resizeTrack: function (gameSize) {
        var W = (gameSize && gameSize.width) || this.cameras.main.width;
        var H = (gameSize && gameSize.height) || this.cameras.main.height;
        this.drawStaticTrack(W, H);
    },

    drawStaticTrack: function (W, H) {
        var textureScale = 0.5;
        var textureW = Math.max(1, Math.round(W * textureScale));
        var textureH = Math.max(1, Math.round(H * textureScale));
        var key = 'runner-static-track-' + textureW + 'x' + textureH;
        if (!this.textures.exists(key)) {
            var c = document.createElement('canvas');
            c.width = textureW;
            c.height = textureH;
            var ctx = c.getContext('2d');
            var grad;
            ctx.scale(textureScale, textureScale);

            grad = ctx.createLinearGradient(0, 0, W, H);
            grad.addColorStop(0, '#4CC8FF');
            grad.addColorStop(0.36, '#66D9FF');
            grad.addColorStop(0.68, '#FFE2F6');
            grad.addColorStop(1, '#B9F5FF');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            ctx.globalAlpha = 0.95;
            ctx.fillStyle = '#FFF7B8';
            ctx.beginPath();
            ctx.arc(W - 105, 70, 33, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 0.72;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(W - 115, 60, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;

            ctx.fillStyle = '#B8F08A';
            ctx.beginPath();
            ctx.ellipse(80, this.horizonY + 25, 130, 39, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(280, this.horizonY + 34, 150, 41, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#78D979';
            ctx.beginPath();
            ctx.ellipse(610, this.horizonY + 32, 180, 48, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(785, this.horizonY + 22, 105, 35, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#4FC76F';
            ctx.fillRect(0, this.horizonY + 33, W, 20);

            ctx.lineCap = 'round';
            ctx.globalAlpha = 0.72;
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(W / 2, this.horizonY + 42, 185, Math.PI + 0.12, Math.PI * 1.88);
            ctx.stroke();
            ctx.globalAlpha = 0.75;
            ctx.strokeStyle = '#FF5EA8';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(W / 2, this.horizonY + 42, 200, Math.PI + 0.12, Math.PI * 1.88);
            ctx.stroke();
            ctx.globalAlpha = 0.82;
            ctx.strokeStyle = '#FFD447';
            ctx.beginPath();
            ctx.arc(W / 2, this.horizonY + 42, 215, Math.PI + 0.12, Math.PI * 1.88);
            ctx.stroke();
            ctx.globalAlpha = 1;

            grad = ctx.createLinearGradient(0, this.horizonY, W, this.groundY + 80);
            grad.addColorStop(0, '#7DE86D');
            grad.addColorStop(0.35, '#6FDD78');
            grad.addColorStop(0.7, '#37B96D');
            grad.addColorStop(1, '#46CC78');
            ctx.fillStyle = grad;
            ctx.fillRect(0, this.horizonY, W, this.groundY - this.horizonY + 80);

            var farLeft = this.project(-1.65, this.farClip, 0);
            var farRight = this.project(1.65, this.farClip, 0);
            ctx.globalAlpha = 0.42;
            ctx.strokeStyle = '#FFF175';
            ctx.lineWidth = 18;
            ctx.beginPath();
            ctx.moveTo(farLeft.x - 5, farLeft.y);
            ctx.lineTo(W / 2 - 334, this.groundY + 64);
            ctx.moveTo(farRight.x + 5, farRight.y);
            ctx.lineTo(W / 2 + 334, this.groundY + 64);
            ctx.stroke();
            ctx.globalAlpha = 1;

            ctx.fillStyle = '#5B6CE8';
            ctx.beginPath();
            ctx.moveTo(farLeft.x, farLeft.y);
            ctx.lineTo(farRight.x, farRight.y);
            ctx.lineTo(W / 2 + 320, this.groundY + 58);
            ctx.lineTo(W / 2 - 320, this.groundY + 58);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = 'rgba(255,255,255,0.9)';
            ctx.lineWidth = 5;
            var laneLines = [-0.5, 0.5];
            for (var i = 0; i < laneLines.length; i++) {
                var a = this.project(laneLines[i], this.farClip, 0);
                var b = this.project(laneLines[i], this.nearClip, 0);
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y + 34);
                ctx.stroke();
            }

            this.textures.addCanvas(key, c);
        }

        if (this.staticTrackImage) this.staticTrackImage.destroy();
        this.staticTrackImage = this.add.image(0, 0, key).setOrigin(0).setDepth(0);
        this.staticTrackImage.setDisplaySize(W, H);
    },

    buildRoadsideScenery: function () {
        this.roadsideObjects = [];
        for (var i = 0; i < 12; i++) {
            this.roadsideObjects.push({
                side: (i % 2 === 0) ? -1 : 1,
                offset: i * 285,
                kind: i % 3
            });
        }
    },

    buildTrackObjects: function () {
        var i, lane, dist;

        for (i = 360; i < this.trackLength - 360; i += 185) {
            lane = [-1, 0, 1][Math.floor(Math.random() * 3)];
            this.objects.push(this.createTrackObject('coin', i, lane, null));
            if (i % 370 === 0) this.objects.push(this.createTrackObject('coin', i + 45, lane, null));
        }

        var obstacleIndex = 0;
        for (i = 640; i < this.trackLength - 520; i += 410) {
            lane = [-1, 0, 1][Math.floor(Math.random() * 3)];
            var obstacleType = (obstacleIndex % 2 === 0) ? 'lowObstacle' : 'obstacle';
            this.objects.push(this.createTrackObject(obstacleType, i, lane, null));
            if (obstacleType === 'lowObstacle') this.runnerStats.lowObstacles += 1;
            else this.runnerStats.solidObstacles += 1;
            obstacleIndex += 1;
        }

        var settings = this.mathSettings || ((window.MathSettings && window.MathSettings.load) ? window.MathSettings.load() : null);
        var mathEnabled = window.MathSettings && window.MathSettings.isAnyEnabled && window.MathSettings.isAnyEnabled(settings);
        if (mathEnabled && window.MathGen) {
            for (dist = 1050; dist < this.trackLength - 700; dist += 1350) {
                // Always go through next(settings, history) — MathGen.generate()
                // passes an empty history, which throws away the anti-repeat
                // logic. With the default settings (addition only, max 10) there
                // are few possible sums, so the same one would come up again and
                // again within a single run.
                var problem = window.MathGen.next(settings, this._mathHistory, this.difficultyProfile.distractorCloseness);
                this._mathHistory.push(problem.key);
                if (this._mathHistory.length > 8) this._mathHistory.shift();
                this.objects.push(this.createTrackObject('mathGate', dist, 0, problem));
            }
        }

        this.objects.push(this.createTrackObject('finish', this.trackLength, 0, null));
    },

    createTrackObject: function (type, distance, lane, data) {
        var obj = {
            id: type + ':' + distance + ':' + lane,
            type: type,
            distance: distance,
            lane: lane,
            data: data,
            hit: false,
            passed: false,
            display: []
        };

        if (type === 'coin') {
            obj.display.push(this.add.sprite(0, 0, 'coin', 0).setScale(0.08).play('coin-spin'));
        } else if (type === 'obstacle' || type === 'lowObstacle') {
            obj.display.push(this.add.image(0, 0, type === 'lowObstacle' ? 'runner-low-obstacle' : 'runner-solid-obstacle').setOrigin(0.5, 1));
        } else if (type === 'mathGate') {
            for (var i = 0; i < 3; i++) {
                var value = data.options[i];
                var panel = this.add.image(0, 0, 'runner-math-panel');
                var text = this.add.text(0, 0, String(value), {
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: '28px',
                    color: '#18235A',
                    stroke: '#FFFFFF',
                    strokeThickness: 2,
                    align: 'center'
                }).setOrigin(0.5);
                panel.runnerLane = i - 1;
                text.runnerLane = i - 1;
                obj.display.push(panel);
                obj.display.push(text);
            }
        } else if (type === 'finish') {
            obj.display.push(this.add.rectangle(0, 0, 360, 18, 0xFFFFFF, 1).setStrokeStyle(4, 0x111111, 1));
            obj.display.push(this.add.text(0, -44, 'FINISH', {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '20px',
                color: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 5
            }).setOrigin(0.5));
        }

        for (var d = 0; d < obj.display.length; d++) {
            obj.display[d].setVisible(false);
        }
        return obj;
    },

    update: function (time, delta) {
        if (this.levelComplete || this.isDead) {
            if (window.TouchController) window.TouchController.update();
            return;
        }

        // WALL-CLOCK time, not Phaser's delta. Phaser's TimeStep runs with
        // smoothStep:true / deltaSmoothingMax:10, so the delta handed to update()
        // is smoothed and capped far below the real frame time. A scene that
        // trusts it runs in slow motion on a slow device no matter how it steps.
        // Measured here so the fix stays local — levels 1-42 keep Phaser's
        // default behaviour.
        var nowMs = (window.performance && performance.now) ? performance.now() : Date.now();
        var realMs = this._lastFrameMs ? (nowMs - this._lastFrameMs) : (delta || 16);
        this._lastFrameMs = nowMs;
        var frameMs = Math.min(realMs, 250);
        this._frameMs = frameMs;   // shared by helpers that used game.loop.delta

        // These MUST use the same clock as the movement below. They were on
        // Phaser's delta while the simulation moved to wall-clock, so at ~11fps
        // the 190ms lane cooldown took ~1.7 REAL seconds to expire and every
        // lane change after the first looked like a dead button.
        this._laneCooldown = Math.max(0, this._laneCooldown - frameMs);
        this.invincibleTimer = Math.max(0, this.invincibleTimer - frameMs);
        this.feedbackTimer = Math.max(0, this.feedbackTimer - frameMs);

        this.handleInput();

        // Advance the simulation in <=50ms slices so a long frame cannot step
        // physics too coarsely. Safe against tunnelling: collisions resolve
        // while an object is within z in (-80, 62) — a 142-unit band — and even
        // a capped 250ms frame at top speed 128 advances only ~32 units.
        var remainingMs = frameMs;
        while (remainingMs > 0) {
            var stepMs = Math.min(remainingMs, 50);
            var sdt = stepMs / 1000;
            this.updateJump(sdt);
            this.speed = Math.min(this.maxSpeed, this.speed + sdt * this.speedRamp);
            this.distance += this.speed * sdt;
            remainingMs -= stepMs;
        }

        this.drawTrack();
        this.updateObjects();
        this.updatePlayer();
        this.updateProgress();

        if (this.feedbackTimer <= 0 && this.feedbackText.text !== '') this.feedbackText.setText('');
        if (window.TouchController) window.TouchController.update();
    },

    handleInput: function () {
        var leftJust = Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.keyA);
        var rightJust = Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.keyD);
        if (window.TouchController) {
            leftJust = leftJust || (window.TouchController.leftPressed && this._laneCooldown <= 0);
            rightJust = rightJust || (window.TouchController.rightPressed && this._laneCooldown <= 0);
        }

        if (leftJust) this.changeLane(-1);
        if (rightJust) this.changeLane(1);

        var jumpJust = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
            Phaser.Input.Keyboard.JustDown(this.keyW) ||
            Phaser.Input.Keyboard.JustDown(this.keySpace) ||
            (window.TouchController && window.TouchController.jumpJustPressed);
        if (jumpJust && this.jumpY <= 0) {
            this.jumpVelocity = 430;
            this.jumpScaleTimer = 130;
            this.player.setScale(0.72, 0.52);
            if (window.AudioManager) AudioManager.play('jump');
        }
    },

    changeLane: function (dir) {
        var next = Phaser.Math.Clamp(this.targetLane + dir, -1, 1);
        if (next === this.targetLane) return;
        this.targetLane = next;
        this.lane = next;
        this._laneCooldown = 190;
        if (this.laneTween) this.laneTween.stop();
        this.laneTween = this.tweens.add({
            targets: this,
            visualLane: next,
            duration: 180,
            ease: 'Sine.easeOut'
        });
    },

    updateJump: function (dt) {
        if (this.jumpY > 0 || this.jumpVelocity > 0) {
            this.jumpY += this.jumpVelocity * dt;
            this.jumpVelocity -= 820 * dt;
            if (this.jumpY <= 0) {
                this.jumpY = 0;
                this.jumpVelocity = 0;
                this.jumpScaleTimer = 160;
                this.player.setScale(0.74, 0.54);
                this.addLandingPuff();
            }
        }
    },

    project: function (lane, z, yOffset) {
        var scale = this.focal / (this.focal + Math.max(1, z));
        return {
            x: 400 + lane * this.laneWidth * scale,
            y: this.horizonY + (this.groundY - this.horizonY) * scale + (yOffset || 0) * scale,
            scale: scale
        };
    },

    drawTrack: function () {
        var W = this.cameras.main.width;
        this.updateMovingSky();

        for (var band = 0; band < this.roadBandPool.length; band++) {
            var z1 = ((band * 170 - (this.distance * 1.45 % 170)) + 2040) % 2040;
            var z2 = z1 + 72;
            var bandObj = this.roadBandPool[band];
            if (z1 < 30 || z1 > this.farClip) {
                bandObj.setVisible(false);
                continue;
            }
            var nearY = this.project(0, z1, 0).y;
            var farY  = this.project(0, Math.min(z2, this.farClip), 0).y;
            var width = Math.min(
                this.roadEdgeX(nearY, 1) - this.roadEdgeX(nearY, -1),
                this.roadEdgeX(farY, 1) - this.roadEdgeX(farY, -1)
            ) * 0.985;
            bandObj.setVisible(true);
            bandObj.setPosition(W / 2, (nearY + farY) / 2);
            bandObj.setDisplaySize(Math.max(8, width), Math.max(2, Math.abs(nearY - farY)));
        }

        // Motion cues, NOT objects. Four saturated full-width bars at 0.72 alpha
        // read as barriers to a 6-year-old and competed with the real obstacles;
        // keep them inside the road, thin, and quiet.
        for (var s = 0; s < this.speedLinePool.length; s++) {
            var z = ((s * 150 - (this.distance * 2.05 % 150)) + 1650) % 1650;
            if (z < 50) z += 1400;
            var p = this.project(0, z, 0);
            var inset = 0.86;
            var lx = W / 2 + (this.roadEdgeX(p.y, -1) - W / 2) * inset;
            var rx = W / 2 + (this.roadEdgeX(p.y, 1) - W / 2) * inset;
            var line = this.speedLinePool[s];
            line.setVisible(true);
            line.setPosition((lx + rx) / 2, p.y);
            line.setDisplaySize(Math.max(8, rx - lx), Math.max(1, 6 * p.scale));
        }
        this.updateRoadsideScenery();
    },

    updateMovingSky: function () {
        var W = this.cameras.main.width;
        var drift = this.distance * 0.08;
        for (var i = 0; i < this.cloudSprites.length; i++) {
            var x = ((i * 190 - drift) % (W + 260)) - 130;
            var y = 45 + (i % 3) * 28;
            var scale = 0.72 + (i % 2) * 0.24;
            this.cloudSprites[i].setPosition(x + 42 * scale, y + 2);
            this.cloudSprites[i].setScale(scale * 1.08, scale * 0.8);
        }
    },

    // x of the road edge at a given screen y, matching the base road polygon
    // exactly (far edge from the projection, near edge at W/2 +/- 320).
    // side: -1 = left, 1 = right.
    roadEdgeX: function (y, side) {
        var W = this.scale.width;
        var far = this.project(1.62 * side, this.farClip, 0);
        var nearX = W / 2 + side * 320;
        var nearY = this.groundY + 58;
        if (nearY === far.y) return nearX;
        var t = (y - far.y) / (nearY - far.y);
        if (t < 0) t = 0; else if (t > 1) t = 1;
        return far.x + (nearX - far.x) * t;
    },

    updateRoadsideScenery: function () {
        for (var i = 0; i < this.roadsideObjects.length; i++) {
            var item = this.roadsideObjects[i];
            var sprite = this.roadsideSprites[i];
            var z = ((item.offset - (this.distance * 1.65 % 3410)) + 3410) % 3410;
            if (z < 45 || z > this.farClip) {
                sprite.setVisible(false);
                continue;
            }
            var lane = item.side * (2.05 + (item.kind * 0.18));
            var p = this.project(lane, z, -12);
            sprite.setVisible(true);
            sprite.setPosition(p.x, p.y);
            sprite.setScale(Math.max(0.08, p.scale * 0.9));
            sprite.setDepth(2 + p.scale);
        }
    },

    updateObjects: function () {
        var visible = [];
        var activeProblem = null;

        for (var i = 0; i < this.objects.length; i++) {
            var obj = this.objects[i];
            var z = obj.distance - this.distance;
            if (obj.type === 'mathGate' && !obj.hit && z > 0 && z < 1150 * this.difficultyProfile.mathAnswerTimeMul) {
                activeProblem = obj.data;
            }

            if (z < -80 || z > this.objectRenderFarClip) {
                this.setObjectVisible(obj, false);
                continue;
            }

            this.setObjectVisible(obj, true);
            this.positionObject(obj, z);
            visible.push({ obj: obj, z: z });

            if (!obj.hit && z < 62) {
                this.resolveObject(obj);
            }
        }

        var nextProblemText = activeProblem ? activeProblem.display : '';
        if (this.problemText.text !== nextProblemText) this.problemText.setText(nextProblemText);

        visible.sort(function (a, b) { return b.z - a.z; });
        for (var vi = 0; vi < visible.length; vi++) {
            var depth = 10 + vi;
            for (var d = 0; d < visible[vi].obj.display.length; d++) {
                visible[vi].obj.display[d].setDepth(depth);
            }
        }
    },

    setObjectVisible: function (obj, visible) {
        if (obj.display.length && obj.display[0].visible === visible) return;
        for (var i = 0; i < obj.display.length; i++) obj.display[i].setVisible(visible);
    },

    positionObject: function (obj, z) {
        var p, i, item, lane;
        if (obj.type === 'mathGate') {
            for (i = 0; i < obj.display.length; i++) {
                item = obj.display[i];
                lane = item.runnerLane;
                if (lane === undefined) continue;
                p = this.project(lane, z, -42);
                item.setPosition(p.x, p.y);
                item.setScale(Math.max(0.18, p.scale * 1.55));
            }
            return;
        }

        p = this.project(obj.lane, z, obj.type === 'finish' ? -10 : (obj.type === 'coin' ? -56 : -18));
        for (i = 0; i < obj.display.length; i++) {
            item = obj.display[i];
            item.setPosition(p.x, p.y + (i === 1 ? -34 * p.scale : 0));
            var size = obj.type === 'finish' ? 1.5 : (obj.type === 'coin' ? 1.05 : (obj.type === 'lowObstacle' ? 0.82 : 0.92));
            item.setScale(Math.max(0.1, p.scale * size));
        }
    },

    resolveObject: function (obj) {
        if (obj.type === 'finish') {
            this.finishLevel();
            return;
        }

        if (obj.type === 'coin') {
            if (obj.lane === this.lane) {
                obj.hit = true;
                this.setObjectVisible(obj, false);
                this.collectCoin();
            }
            return;
        }

        if (obj.type === 'obstacle' || obj.type === 'lowObstacle') {
            if (obj.lane === this.lane && this.invincibleTimer <= 0) {
                if (obj.type === 'lowObstacle' && this.jumpY > 24) {
                    obj.hit = true;
                    this.clearLowObstacle();
                    return;
                }
                obj.hit = true;
                if (obj.type === 'lowObstacle') this.runnerStats.lowHits += 1;
                this.hitObstacle();
            }
            return;
        }

        if (obj.type === 'mathGate') {
            obj.hit = true;
            this.answerMathGate(obj);
        }
    },

    collectCoin: function () {
        this.coins += 1;
        this.score += 50;
        this.registry.set('coins', this.coins);
        this.registry.set('score', this.score);
        this.events.emit('coinCollect', this.coins);
        this.events.emit('scoreChange', this.score);
        if (window.AudioManager) AudioManager.play('coin');
    },

    clearLowObstacle: function () {
        this.runnerStats.lowCleared += 1;
        this.score += 125;
        this.registry.set('score', this.score);
        this.events.emit('scoreChange', this.score);
        this.showFeedback('+125 HOP!', '#7CFF72');
        if (window.AudioManager) AudioManager.play('powerup');
        this.sparkleAtPlayer();
    },

    hitObstacle: function () {
        this.lives -= 1;
        this.invincibleTimer = this.difficultyProfile.invincibleMs;
        this.speed = Math.max(this.baseSpeed * 0.78, this.speed - 8);
        this.registry.set('lives', this.lives);
        this.events.emit('livesChange', this.lives);
        this.showFeedback('ATSARGIAI!', '#FFFFFF');
        this.cameras.main.shake(160, 0.006);
        if (window.AudioManager) AudioManager.play('bump');

        if (this.lives <= 0) {
            this.isDead = true;
            if (window.AudioManager) { AudioManager.stopMusic(); AudioManager.play('death'); }
            this.time.delayedCall(700, function () {
                this.scene.stop('HUDScene');
                this.scene.start('MenuScene');
            }, null, this);
        }
    },

    answerMathGate: function (obj) {
        var problem = obj.data;
        var chosen = problem.options[this.lane + 1];
        if (chosen === problem.answer) {
            this.score += 300;
            this.registry.set('score', this.score);
            this.showFeedback('TEISINGAI!', '#7CFF72');
            if (window.AudioManager) AudioManager.play('mathCorrect');
            this.sparkleAtPlayer();
        } else {
            this.score = Math.max(0, this.score - 50);
            this.speed = Math.max(this.baseSpeed * 0.72, this.speed - 12);
            this.registry.set('score', this.score);
            this.showFeedback('Atsakymas: ' + problem.answer, '#F8D830');
            if (window.AudioManager) AudioManager.play('mathWrong');
        }
    },

    showFeedback: function (text, color) {
        this.feedbackText.setText(text);
        this.feedbackText.setColor(color);
        this.feedbackTimer = 1700;
        this.tweens.add({
            targets: this.feedbackText,
            scaleX: 1.16,
            scaleY: 1.16,
            duration: 120,
            yoyo: true,
            ease: 'Sine.easeOut'
        });
    },

    sparkleAtPlayer: function () {
        for (var i = 0; i < 12; i++) {
            var dot = this.add.circle(this.player.x, this.player.y - 46, 4, 0xF8D830, 1).setDepth(101);
            this.tweens.add({
                targets: dot,
                x: dot.x + Phaser.Math.Between(-70, 70),
                y: dot.y + Phaser.Math.Between(-70, 20),
                alpha: 0,
                scaleX: 0.2,
                scaleY: 0.2,
                duration: 520,
                ease: 'Sine.easeOut',
                onComplete: function () { this.destroy(); }
            });
        }
    },

    addLandingPuff: function () {
        for (var i = 0; i < 5; i++) {
            var puff = this.add.circle(this.player.x + Phaser.Math.Between(-18, 18), this.groundY - 24, Phaser.Math.Between(4, 8), 0xFFFFFF, 0.65).setDepth(79);
            this.landingPuffs.push(puff);
            this.tweens.add({
                targets: puff,
                x: puff.x + Phaser.Math.Between(-26, 26),
                y: puff.y + Phaser.Math.Between(-8, 6),
                alpha: 0,
                scaleX: 1.8,
                scaleY: 0.7,
                duration: 330,
                ease: 'Sine.easeOut',
                onComplete: function () { this.destroy(); }
            });
        }
    },

    updatePlayer: function () {
        var W = this.cameras.main.width;
        var px = W / 2 + this.visualLane * 142;
        this.player.x = px;
        this.player.y = this.groundY - 28 - this.jumpY;
        this.shadow.x = px;
        this.shadow.y = this.groundY - 18;
        this.shadow.scaleX = 1 - Math.min(0.5, this.jumpY / 210);
        this.shadow.scaleY = 1 - Math.min(0.28, this.jumpY / 330);
        this.shadow.setAlpha(this.jumpY > 0 ? Math.max(0.08, 0.28 - this.jumpY / 520) : 0.3);

        var nextAnim = this.jumpY > 0 ? 'mario-runner-jump' : 'mario-runner-run';
        if (this._playerAnim !== nextAnim) {
            this._playerAnim = nextAnim;
            this.player.play(nextAnim, true);
        }
        if (this.jumpScaleTimer > 0) {
            this.jumpScaleTimer = Math.max(0, this.jumpScaleTimer - (this._frameMs || 16));
            this.player.scaleX += (0.62 - this.player.scaleX) * 0.22;
            this.player.scaleY += (0.62 - this.player.scaleY) * 0.22;
        } else {
            this.player.setScale(0.62);
        }
        this.player.setAlpha(this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 90) % 2 === 0 ? 0.55 : 1);
    },

    updateProgress: function () {
        var ratio = Phaser.Math.Clamp(this.distance / this.trackLength, 0, 1);
        this.progressFill.width = 326 * ratio;
    },

    finishLevel: function () {
        if (this.levelComplete) return;
        this.levelComplete = true;
        this.score += 1000;
        this.registry.set('score', this.score);
        this.showFeedback('FINISH!', '#FFFFFF');
        if (window.AudioManager) { AudioManager.stopMusic(); AudioManager.play('flagpole'); }
        this.tweens.add({
            targets: this.player,
            y: this.player.y - 80,
            scaleX: 0.45,
            scaleY: 0.45,
            duration: 900,
            ease: 'Sine.easeIn',
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

    shutdown: function () {
        if (this.laneTween) {
            this.laneTween.stop();
            this.laneTween = null;
        }
        this.scale.off('resize', this.resizeTrack, this);
        if (window.__runnerScene === this) window.__runnerScene = null;
    }
});

if (typeof window !== 'undefined') window.RunnerScene = RunnerScene;
