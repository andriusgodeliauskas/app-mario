/**
 * BonusRoomScene — a small underground room reached by entering a pipe.
 *
 * Launched (parallel) by GameScene.enterBonusPipe() while the main level is
 * paused. Mario can walk/jump, collect a handful of coins, and solve one math
 * challenge. Reaching the exit pipe (press UP) returns to the level with all
 * rewards carried back. Score/coins/lives mirror the GameScene and are copied
 * back on exit; the shared registry keeps the HUD in sync throughout.
 */

var BonusRoomScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function BonusRoomScene() {
        Phaser.Scene.call(this, { key: 'BonusRoomScene' });
    },

    create: function () {
        var W = 800, H = 600, TILE = 32;
        var self = this;
        this._exiting = false;

        this.main = this.scene.get('GameScene');
        // Mirror the running totals so MathChallenge (which mutates scene.score/
        // scene.coins) operates on live values; copied back on exit.
        this.score = (this.main && this.main.score) || this.registry.get('score') || 0;
        this.coins = (this.main && this.main.coins) || this.registry.get('coins') || 0;
        this.lives = (this.main && this.main.lives) || this.registry.get('lives') || 3;

        this.cameras.main.setBackgroundColor('#0A0A1E');
        this.physics.world.setBounds(0, 0, W, H);

        // Title hint
        this.add.text(W / 2, 40, 'SLAPTAS KAMBARYS', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '16px',
            color: '#F8D830', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(30);

        // ---- Solid geometry: floor + side walls ----
        this.solids = this.physics.add.staticGroup();
        var groundTop = H - TILE * 2;            // 536
        for (var c = 0; c < W / TILE; c++) {
            var f = this.solids.create(c * TILE + TILE / 2, groundTop + TILE / 2, 'tiles', 2);
            f.setScale(0.5).setSize(TILE, TILE).refreshBody();
            f.setTint(0x6B4A2A);
        }
        // Invisible walls
        var leftWall = this.add.rectangle(4, H / 2, 8, H, 0x000000, 0);
        var rightWall = this.add.rectangle(W - 4, H / 2, 8, H, 0x000000, 0);
        this.physics.add.existing(leftWall, true);
        this.physics.add.existing(rightWall, true);
        this.solids.add(leftWall);
        this.solids.add(rightWall);

        // ---- Player ----
        this.player = this.physics.add.sprite(90, groundTop - 40, 'mario');
        this.player.setScale(0.25);
        this.player.setSize(96, 120).setOffset(16, 8);
        this.player.setCollideWorldBounds(true);
        this.player.play('mario-idle');
        this.player.setDepth(10);
        this.physics.add.collider(this.player, this.solids);

        // ---- Coins ----
        this.coinGroup = this.physics.add.group({ allowGravity: false });
        for (var i = 0; i < 6; i++) {
            var coin = this.coinGroup.create(180 + i * 70, groundTop - 110, 'coin');
            coin.setScale(0.25);
            coin.play('coin-spin');
        }
        this.physics.add.overlap(this.player, this.coinGroup, this.grabCoin, null, this);

        // ---- Exit pipe (right side) ----
        this.exitPipe = this.add.sprite(W - 70, groundTop - TILE, 'tiles', 6).setScale(0.5).setDepth(5);
        this.add.sprite(W - 70, groundTop, 'tiles', 8).setScale(0.5).setDepth(5);
        this.exitHint = this.add.text(W - 70, groundTop - 80, '↑\nGRIZTI', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '11px',
            color: '#7CFC00', stroke: '#000', strokeThickness: 3, align: 'center'
        }).setOrigin(0.5).setDepth(6);
        this.tweens.add({ targets: this.exitHint, y: this.exitHint.y - 6, duration: 500,
            yoyo: true, repeat: -1, ease: 'Sine.InOut' });

        // ---- One math challenge in the middle ----
        if (window.MathChallenge && window.MathSettings) {
            var settings = window.MathSettings.load();
            this._mathHistory = [];
            this.mathChallenge = new window.MathChallenge(
                this, settings, this._mathHistory, W / 2, groundTop, function () {
                    self.mathChallenge = null;
                });
        }

        // ---- Input ----
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    },

    grabCoin: function (player, coin) {
        coin.destroy();
        if (window.AudioManager) AudioManager.play('coin');
        this.coins += 1;
        this.score += 50;
        this.registry.set('coins', this.coins);
        this.registry.set('score', this.score);
        this.events.emit('coinCollect', this.coins);
        this.events.emit('scoreChange', this.score);
    },

    // Gentle "wrong answer" handler so MathChallenge can call it. No deaths in
    // the bonus room — just a small score nick and a hop back.
    loseOnePower: function () {
        if (this.player && this.player.body) this.player.setVelocityY(-180);
        this.score = Math.max(0, this.score - 20);
        this.registry.set('score', this.score);
        this.events.emit('scoreChange', this.score);
    },

    update: function () {
        if (this._exiting || !this.player) return;
        var player = this.player;
        var onGround = player.body.blocked.down || player.body.touching.down;

        var left = this.cursors.left.isDown || this.keyA.isDown ||
                   (window.TouchController && window.TouchController.leftPressed);
        var right = this.cursors.right.isDown || this.keyD.isDown ||
                    (window.TouchController && window.TouchController.rightPressed);
        if (left) { player.setVelocityX(-180); player.setFlipX(true); }
        else if (right) { player.setVelocityX(180); player.setFlipX(false); }
        else player.setVelocityX(0);

        var up = Phaser.Input.Keyboard.JustDown(this.keySpace) ||
                 Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                 Phaser.Input.Keyboard.JustDown(this.keyW) ||
                 (window.TouchController && window.TouchController.jumpJustPressed);
        if (up && onGround) {
            player.setVelocityY(-480);
            if (window.AudioManager) AudioManager.play('jump');
        }

        // Animations
        if (!onGround) player.play('mario-jump', true);
        else if (player.body.velocity.x !== 0) player.play('mario-run', true);
        else player.play('mario-idle', true);

        // Exit when standing near the pipe and pressing up (only after math done)
        var nearExit = Math.abs(player.x - this.exitPipe.x) < 36 && onGround;
        var upHeld = this.cursors.up.isDown || this.keyW.isDown ||
                     (window.TouchController && window.TouchController.jumpPressed);
        if (nearExit && upHeld && !this.mathChallenge) {
            this.exitRoom();
        }

        if (window.TouchController && window.TouchController.enabled) {
            window.TouchController.update();
        }
    },

    exitRoom: function () {
        if (this._exiting) return;
        this._exiting = true;
        var self = this;
        if (window.AudioManager) AudioManager.play('powerup');

        // Copy rewards back to the main level.
        if (this.main) {
            this.main.score = this.score;
            this.main.coins = this.coins;
            this.main.lives = this.lives;
        }
        this.registry.set('score', this.score);
        this.registry.set('coins', this.coins);
        this.registry.set('lives', this.lives);

        self.scene.resume('GameScene');
        self.scene.stop();
    }
});

if (typeof window !== 'undefined') window.BonusRoomScene = BonusRoomScene;
