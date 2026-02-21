/**
 * GameScene — Main gameplay scene with level, player, enemies, collectibles
 * Builds level from hardcoded 2D tile arrays, handles all game logic.
 */

var GameScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function GameScene() {
        Phaser.Scene.call(this, { key: 'GameScene' });
    },

    init: function (data) {
        this.currentLevel = (data && data.level) ? data.level : 1;
        // Preserve score/coins/lives across level transitions and respawns
        this.score = (data && data.score !== undefined) ? data.score : 0;
        this.coins = (data && data.coins !== undefined) ? data.coins : 0;
        this.lives = (data && data.lives !== undefined) ? data.lives : 3;
        this.isBig = false;
        this.isInvincible = false;
        this.isDead = false;
        this.levelComplete = false;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.wasOnGround = false;
        this.starPower = false;
        this.starTimer = 0;
        this.invincibleTimer = 0;
    },

    create: function () {
        var self = this;

        // ----------------------------------
        // Store state in registry for HUD
        // ----------------------------------
        this.registry.set('score', this.score);
        this.registry.set('coins', this.coins);
        this.registry.set('lives', this.lives);
        this.registry.set('level', this.currentLevel);

        // ----------------------------------
        // World bounds
        // ----------------------------------
        var WORLD_W = 6400;
        var WORLD_H = 600;
        var TILE = 32;
        var COLS = 200; // 6400 / 32
        var ROWS = 19;  // 608 / 32 — we use 19 rows, bottom at y=608 but world is 600

        this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H + 64);

        // ----------------------------------
        // Sky background — per level
        // ----------------------------------
        var bgColors = { 1: '#6B8CFF', 2: '#000000', 3: '#9494FF', 4: '#1A0A1E' };
        this.cameras.main.setBackgroundColor(bgColors[this.currentLevel] || '#6B8CFF');

        // ----------------------------------
        // Get level data
        // ----------------------------------
        var levelData = this.getLevelData(this.currentLevel);

        // ----------------------------------
        // Decorative background elements (behind everything)
        // ----------------------------------
        this.createDecorations(levelData.decorations);

        // ----------------------------------
        // Build tile layers from 2D array
        // ----------------------------------
        this.groundTiles = this.physics.add.staticGroup();
        this.brickTiles = this.physics.add.staticGroup();
        this.questionTiles = this.physics.add.staticGroup();
        this.pipeTiles = this.physics.add.staticGroup();

        // Coin positions and enemy spawn points collected from tilemap
        var coinPositions = [];
        var enemySpawns = [];
        var flagpolePos = null;

        var map = levelData.map;
        for (var row = 0; row < map.length; row++) {
            for (var col = 0; col < map[row].length; col++) {
                var tileId = map[row][col];
                if (tileId === 0) continue;

                var tx = col * TILE + TILE / 2;
                var ty = row * TILE + TILE / 2;

                if (tileId === 1 || tileId === 2) {
                    // Ground tiles (grass top or earth)
                    var gt = this.groundTiles.create(tx, ty, 'tiles', tileId);
                    gt.setSize(TILE, TILE).refreshBody();
                } else if (tileId === 3) {
                    // Brick block
                    var bt = this.brickTiles.create(tx, ty, 'tiles', 3);
                    bt.setSize(TILE, TILE).refreshBody();
                    bt.tileType = 'brick';
                    bt.isUsed = false;
                } else if (tileId === 4) {
                    // Question block
                    var qt = this.questionTiles.create(tx, ty, 'tiles', 4);
                    qt.setSize(TILE, TILE).refreshBody();
                    qt.tileType = 'question';
                    qt.isUsed = false;
                    qt.content = 'coin'; // default content
                } else if (tileId === 40) {
                    // Question block with mushroom
                    var qm = this.questionTiles.create(tx, ty, 'tiles', 4);
                    qm.setSize(TILE, TILE).refreshBody();
                    qm.tileType = 'question';
                    qm.isUsed = false;
                    qm.content = 'mushroom';
                } else if (tileId === 41) {
                    // Question block with star
                    var qs = this.questionTiles.create(tx, ty, 'tiles', 4);
                    qs.setSize(TILE, TILE).refreshBody();
                    qs.tileType = 'question';
                    qs.isUsed = false;
                    qs.content = 'star';
                } else if (tileId === 6 || tileId === 7 || tileId === 8 || tileId === 9) {
                    // Pipe tiles
                    var pt = this.pipeTiles.create(tx, ty, 'tiles', tileId);
                    pt.setSize(TILE, TILE).refreshBody();
                } else if (tileId === 11) {
                    // Stone platform
                    var st = this.groundTiles.create(tx, ty, 'tiles', 11);
                    st.setSize(TILE, TILE).refreshBody();
                } else if (tileId === 50) {
                    // Coin spawn marker
                    coinPositions.push({ x: tx, y: ty });
                } else if (tileId === 60) {
                    // Goomba spawn
                    enemySpawns.push({ x: tx, y: ty, type: 'goomba' });
                } else if (tileId === 61) {
                    // Koopa spawn
                    enemySpawns.push({ x: tx, y: ty, type: 'koopa' });
                } else if (tileId === 70) {
                    // Flagpole position
                    flagpolePos = { x: tx, y: ty };
                }
            }
        }

        // ----------------------------------
        // Create player (Mario)
        // ----------------------------------
        var spawnX = 100;
        var spawnY = (ROWS - 3) * TILE + TILE / 2; // Above the ground rows

        this.player = this.physics.add.sprite(spawnX, spawnY, 'mario');
        this.player.setSize(24, 30);
        this.player.setOffset(4, 2);
        this.player.setBounce(0);
        this.player.setCollideWorldBounds(false);
        this.player.setDepth(10);
        this.player.play('mario-idle');

        // ----------------------------------
        // Coins
        // ----------------------------------
        this.coinGroup = this.physics.add.group();
        for (var ci = 0; ci < coinPositions.length; ci++) {
            var c = this.coinGroup.create(coinPositions[ci].x, coinPositions[ci].y, 'coin');
            c.play('coin-spin');
            c.body.setAllowGravity(false);
            c.setSize(12, 14);
            c.setImmovable(true);
        }

        // ----------------------------------
        // Enemies
        // ----------------------------------
        this.enemies = this.physics.add.group();
        for (var ei = 0; ei < enemySpawns.length; ei++) {
            var esp = enemySpawns[ei];
            var enemy;
            if (esp.type === 'goomba') {
                enemy = this.enemies.create(esp.x, esp.y, 'goomba');
                enemy.play('goomba-walk');
                enemy.setSize(28, 28);
                enemy.setOffset(2, 4);
                enemy.enemyType = 'goomba';
            } else if (esp.type === 'koopa') {
                enemy = this.enemies.create(esp.x, esp.y, 'koopa');
                enemy.play('koopa-walk');
                enemy.setSize(28, 40);
                enemy.setOffset(2, 8);
                enemy.enemyType = 'koopa';
            }
            if (enemy) {
                enemy.setBounce(0);
                enemy.setVelocityX(-60);
                enemy.patrolDir = -1;
                enemy.isSquished = false;
                enemy.isShell = false;
            }
        }

        // ----------------------------------
        // Mushrooms group (spawned from ? blocks)
        // ----------------------------------
        this.mushrooms = this.physics.add.group();

        // ----------------------------------
        // Stars group (spawned from ? blocks)
        // ----------------------------------
        this.stars = this.physics.add.group();

        // ----------------------------------
        // Flagpole
        // ----------------------------------
        if (flagpolePos) {
            this.flagpole = this.physics.add.sprite(flagpolePos.x, flagpolePos.y, 'flagpole');
            this.flagpole.setOrigin(0.5, 1);
            this.flagpole.y = (ROWS - 2) * TILE; // Place base at ground level
            this.flagpole.body.setAllowGravity(false);
            this.flagpole.setImmovable(true);
            this.flagpole.setSize(48, 256);
            this.flagpole.setOffset(-16, 0);
            this.flagpole.setDepth(5);
        } else {
            this.flagpole = null;
        }

        // ----------------------------------
        // Colliders
        // ----------------------------------
        this.physics.add.collider(this.player, this.groundTiles);
        this.physics.add.collider(this.player, this.pipeTiles);
        this.physics.add.collider(this.player, this.brickTiles, this.hitBrick, null, this);
        this.physics.add.collider(this.player, this.questionTiles, this.hitQuestion, null, this);
        this.physics.add.collider(this.enemies, this.groundTiles);
        this.physics.add.collider(this.enemies, this.pipeTiles);
        this.physics.add.collider(this.enemies, this.brickTiles);
        this.physics.add.collider(this.mushrooms, this.groundTiles);
        this.physics.add.collider(this.mushrooms, this.pipeTiles);
        this.physics.add.collider(this.stars, this.groundTiles);
        this.physics.add.collider(this.stars, this.pipeTiles);

        // Overlaps
        this.physics.add.overlap(this.player, this.coinGroup, this.collectCoin, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.handleEnemyCollision, null, this);
        this.physics.add.overlap(this.player, this.mushrooms, this.collectMushroom, null, this);
        this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);
        if (this.flagpole) {
            this.physics.add.overlap(this.player, this.flagpole, this.reachFlagpole, null, this);
        }

        // ----------------------------------
        // Camera
        // ----------------------------------
        this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setDeadzone(100, 50);

        // ----------------------------------
        // Input
        // ----------------------------------
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // ----------------------------------
        // Launch HUD overlay (only if not already running)
        // ----------------------------------
        if (!this.scene.isActive('HUDScene')) {
            this.scene.launch('HUDScene');
        }

        // ----------------------------------
        // Touch controls (mobile/tablet)
        // ----------------------------------
        if (window.TouchController) {
            window.TouchController.init();
        }

        // ----------------------------------
        // English word popup container
        // ----------------------------------
        this.wordPopups = [];

        // ----------------------------------
        // Audio — init and start level music
        // ----------------------------------
        if (window.AudioManager) { AudioManager.init(); }
        var musicMap = { 1: 'overworld', 2: 'underground', 3: 'overworld', 4: 'castle' };
        if (window.AudioManager) AudioManager.startMusic(musicMap[this.currentLevel] || 'overworld');
    },

    update: function (time, delta) {
        if (this.isDead || this.levelComplete) return;

        var player = this.player;
        var onGround = player.body.blocked.down || player.body.touching.down;

        // ----------------------------------
        // Coyote time tracking
        // ----------------------------------
        if (onGround) {
            this.coyoteTimer = 80; // 80ms grace
        } else if (this.wasOnGround && !onGround) {
            // Just left ground — start counting down
        }
        if (!onGround && this.coyoteTimer > 0) {
            this.coyoteTimer -= delta;
        }
        this.wasOnGround = onGround;

        // ----------------------------------
        // Jump buffer tracking
        // ----------------------------------
        var touchJump = (window.TouchController && window.TouchController.jumpJustPressed);
        var jumpPressed = Phaser.Input.Keyboard.JustDown(this.keySpace) ||
                          Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                          Phaser.Input.Keyboard.JustDown(this.keyW) ||
                          touchJump;

        if (jumpPressed) {
            this.jumpBufferTimer = 100; // 100ms buffer
        }
        if (this.jumpBufferTimer > 0) {
            this.jumpBufferTimer -= delta;
        }

        // ----------------------------------
        // Horizontal movement
        // ----------------------------------
        var moveLeft = this.cursors.left.isDown || this.keyA.isDown ||
                       (window.TouchController && window.TouchController.leftPressed);
        var moveRight = this.cursors.right.isDown || this.keyD.isDown ||
                        (window.TouchController && window.TouchController.rightPressed);
        var speed = 200;

        if (moveLeft) {
            player.setVelocityX(-speed);
            player.setFlipX(true);
        } else if (moveRight) {
            player.setVelocityX(speed);
            player.setFlipX(false);
        } else {
            player.setVelocityX(0);
        }

        // ----------------------------------
        // Jumping
        // ----------------------------------
        var canJump = onGround || this.coyoteTimer > 0;

        if (this.jumpBufferTimer > 0 && canJump) {
            player.setVelocityY(-520);
            this.coyoteTimer = 0;
            this.jumpBufferTimer = 0;
            if (window.AudioManager) AudioManager.play('jump');
        }

        // Variable jump height — release early for shorter jump
        var jumpHeld = this.keySpace.isDown || this.cursors.up.isDown || this.keyW.isDown ||
                       (window.TouchController && window.TouchController.jumpPressed);
        if (!jumpHeld && player.body.velocity.y < -200) {
            player.setVelocityY(-200);
        }

        // ----------------------------------
        // Animations
        // ----------------------------------
        var prefix = this.isBig ? 'mario-big-' : 'mario-';

        if (!onGround) {
            player.play(prefix + 'jump', true);
        } else if (player.body.velocity.x !== 0) {
            player.play(prefix + 'run', true);
        } else {
            player.play(prefix + 'idle', true);
        }

        // ----------------------------------
        // Fall death (pit)
        // ----------------------------------
        if (player.y > 620) {
            this.playerDeath();
        }

        // ----------------------------------
        // Safety: auto-trigger flagpole if Mario passes it
        // ----------------------------------
        if (this.flagpole && !this.levelComplete && player.x > this.flagpole.x + 32) {
            this.reachFlagpole(player, this.flagpole);
        }

        // ----------------------------------
        // Enemy patrol AI
        // ----------------------------------
        var enemies = this.enemies.getChildren();
        for (var i = 0; i < enemies.length; i++) {
            var e = enemies[i];
            if (!e.active || e.isSquished) continue;

            // Turn around at edges or walls
            if (e.body.blocked.left) {
                e.setVelocityX(60);
                e.patrolDir = 1;
                e.setFlipX(true);
            } else if (e.body.blocked.right) {
                e.setVelocityX(-60);
                e.patrolDir = -1;
                e.setFlipX(false);
            }

            // Fall death for enemies
            if (e.y > 650) {
                e.destroy();
            }
        }

        // ----------------------------------
        // Invincibility flash
        // ----------------------------------
        if (this.isInvincible && this.invincibleTimer) {
            this.invincibleTimer -= delta;
            player.setAlpha(Math.floor(this.invincibleTimer / 100) % 2 === 0 ? 0.4 : 1);
            if (this.invincibleTimer <= 0) {
                this.isInvincible = false;
                this.invincibleTimer = 0;
                player.setAlpha(1);
            }
        }

        // ----------------------------------
        // Star power flash
        // ----------------------------------
        if (this.starPower && this.starTimer) {
            this.starTimer -= delta;
            var tintColors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF, 0x00FFFF];
            var colorIdx = Math.floor(time / 80) % tintColors.length;
            player.setTint(tintColors[colorIdx]);
            if (this.starTimer <= 0) {
                this.starPower = false;
                this.starTimer = 0;
                player.clearTint();
            }
        }

        // ----------------------------------
        // Touch controller frame update
        // ----------------------------------
        if (window.TouchController && window.TouchController.enabled) {
            window.TouchController.update();
        }
    },

    // ==========================================
    // COIN COLLECTION
    // ==========================================
    collectCoin: function (player, coin) {
        coin.destroy();
        if (window.AudioManager) AudioManager.play('coin');
        this.coins++;
        this.score += 100;
        this.registry.set('score', this.score);
        this.registry.set('coins', this.coins);
        this.events.emit('scoreChange', this.score);
        this.events.emit('coinCollect', this.coins);

        // Extra life at 100 coins
        if (this.coins >= 100) {
            this.coins = 0;
            this.lives++;
            this.registry.set('coins', this.coins);
            this.registry.set('lives', this.lives);
            this.events.emit('livesChange', this.lives);
            this.showEnglishPopup('life');
        } else {
            this.showEnglishPopup('coin');
        }
    },

    // ==========================================
    // HIT BRICK FROM BELOW
    // ==========================================
    hitBrick: function (player, brick) {
        // Check if player is hitting block from below based on relative positions
        var playerTop = player.body.y;
        var blockBottom = brick.body.y + brick.body.height;
        var playerCenterX = player.body.x + player.body.width / 2;
        var blockLeft = brick.body.x;
        var blockRight = brick.body.x + brick.body.width;

        // Player's top should be near block's bottom, and player should be under the block
        if (playerTop > blockBottom || playerCenterX < blockLeft || playerCenterX > blockRight) return;
        // Only trigger once per collision
        if (brick._justHit) return;
        brick._justHit = true;
        var self = this;
        this.time.delayedCall(200, function() { brick._justHit = false; });

        if (this.isBig) {
            // Big Mario breaks bricks
            if (window.AudioManager) AudioManager.play('brickBreak');
            this.score += 50;
            this.registry.set('score', this.score);
            this.events.emit('scoreChange', this.score);

            // Simple break effect — small particles
            this.createBreakEffect(brick.x, brick.y);
            brick.destroy();
            this.showEnglishPopup('brick');
        } else {
            // Small Mario — bump only
            if (window.AudioManager) AudioManager.play('bump');
            this.bumpBlock(brick);
        }
    },

    // ==========================================
    // HIT QUESTION BLOCK FROM BELOW
    // ==========================================
    hitQuestion: function (player, block) {
        // Check if player is hitting block from below based on relative positions
        var playerTop = player.body.y;
        var blockBottom = block.body.y + block.body.height;
        var playerCenterX = player.body.x + player.body.width / 2;
        var blockLeft = block.body.x;
        var blockRight = block.body.x + block.body.width;

        // Player's top should be near block's bottom, and player should be under the block
        if (playerTop > blockBottom || playerCenterX < blockLeft || playerCenterX > blockRight) return;
        // Only trigger once per collision
        if (block._justHit) return;
        block._justHit = true;
        var self = this;
        this.time.delayedCall(200, function() { block._justHit = false; });

        if (block.isUsed) return;

        block.isUsed = true;
        block.setFrame(5); // Used block frame

        // Bump animation
        if (window.AudioManager) AudioManager.play('bump');
        this.bumpBlock(block);

        if (block.content === 'coin') {
            // Spawn coin above block that floats up and disappears
            var popCoin = this.add.sprite(block.x, block.y - 32, 'coin');
            popCoin.play('coin-spin');
            this.tweens.add({
                targets: popCoin,
                y: block.y - 80,
                alpha: 0,
                duration: 600,
                onComplete: function () { popCoin.destroy(); }
            });
            this.coins++;
            this.score += 100;
            this.registry.set('score', this.score);
            this.registry.set('coins', this.coins);
            this.events.emit('scoreChange', this.score);
            this.events.emit('coinCollect', this.coins);
            this.showEnglishPopup('coin');
        } else if (block.content === 'mushroom') {
            // Spawn mushroom
            var mush = this.mushrooms.create(block.x, block.y - 32, 'mushroom');
            mush.play('mushroom-idle');
            mush.setBounce(0.2);
            mush.setVelocityX(80);
            mush.setSize(28, 28);
            mush.setOffset(2, 4);
            this.showEnglishPopup('mushroom');
        } else if (block.content === 'star') {
            // Spawn star
            var star = this.stars.create(block.x, block.y - 32, 'star');
            star.play('star-flash');
            star.setBounce(0.8);
            star.setVelocityX(100);
            star.setVelocityY(-200);
            star.setSize(28, 28);
            star.setOffset(2, 2);
        }
    },

    // ==========================================
    // COLLECT MUSHROOM (Power-up)
    // ==========================================
    collectMushroom: function (player, mushroom) {
        mushroom.destroy();
        if (window.AudioManager) AudioManager.play('powerup');
        this.score += 1000;
        this.registry.set('score', this.score);
        this.events.emit('scoreChange', this.score);

        if (!this.isBig) {
            this.isBig = true;
            player.setTexture('mario-big');
            player.setSize(24, 56);
            player.setOffset(4, 8);
            player.y -= 16; // Shift up so we don't clip into ground
            player.play('mario-big-idle');
        }
        this.showEnglishPopup('mushroom');
    },

    // ==========================================
    // COLLECT STAR (Invincibility)
    // ==========================================
    collectStar: function (player, star) {
        star.destroy();
        if (window.AudioManager) AudioManager.play('powerup');
        this.score += 1000;
        this.registry.set('score', this.score);
        this.events.emit('scoreChange', this.score);

        this.starPower = true;
        this.starTimer = 10000; // 10 seconds
        this.showEnglishPopup('star');
    },

    // ==========================================
    // ENEMY COLLISION
    // ==========================================
    handleEnemyCollision: function (player, enemy) {
        if (!enemy.active || enemy.isSquished) return;

        // Star power — kill enemy on contact
        if (this.starPower) {
            this.squishEnemy(enemy);
            return;
        }

        // Determine if stomping from above
        var playerBottom = player.body.y + player.body.height;
        var enemyTop = enemy.body.y;
        var isStomping = player.body.velocity.y > 0 && (playerBottom - enemyTop) < 16;

        if (isStomping) {
            // Stomp the enemy
            this.squishEnemy(enemy);
            // Bounce player up
            player.setVelocityY(-250);
        } else {
            // Player takes damage
            if (this.isInvincible) return;
            this.playerHit();
        }
    },

    // ==========================================
    // SQUISH ENEMY
    // ==========================================
    squishEnemy: function (enemy) {
        if (window.AudioManager) AudioManager.play('stomp');
        enemy.isSquished = true;
        enemy.body.setVelocity(0, 0);
        enemy.body.setAllowGravity(false);
        enemy.body.setEnable(false);

        if (enemy.enemyType === 'goomba') {
            enemy.play('goomba-squish');
            this.score += 100;
        } else if (enemy.enemyType === 'koopa') {
            enemy.play('koopa-shell');
            this.score += 100;
        }

        this.registry.set('score', this.score);
        this.events.emit('scoreChange', this.score);
        this.showEnglishPopup(enemy.enemyType === 'koopa' ? 'turtle' : 'score');

        // Remove after short delay
        var self = this;
        this.time.delayedCall(500, function () {
            if (enemy && enemy.active) {
                enemy.destroy();
            }
        });
    },

    // ==========================================
    // PLAYER HIT (take damage)
    // ==========================================
    playerHit: function () {
        if (this.isInvincible || this.isDead) return;

        if (this.isBig) {
            // Shrink to small Mario
            if (window.AudioManager) AudioManager.play('bump');
            this.isBig = false;
            this.player.setTexture('mario');
            this.player.setSize(24, 30);
            this.player.setOffset(4, 2);
            this.player.play('mario-idle');
            this.isInvincible = true;
            this.invincibleTimer = 2000; // 2 seconds
        } else {
            // Small Mario — death
            this.playerDeath();
        }
    },

    // ==========================================
    // PLAYER DEATH
    // ==========================================
    playerDeath: function () {
        if (this.isDead) return;
        this.isDead = true;

        if (window.AudioManager) { AudioManager.stopMusic(); AudioManager.play('death'); }

        this.player.play('mario-death');
        this.player.body.setVelocity(0, 0);
        this.player.body.setAllowGravity(false);
        this.player.body.setEnable(false);

        // Death bounce animation
        var self = this;
        this.tweens.add({
            targets: this.player,
            y: this.player.y - 60,
            duration: 400,
            ease: 'Power2',
            yoyo: false,
            onComplete: function () {
                self.tweens.add({
                    targets: self.player,
                    y: 700,
                    duration: 600,
                    ease: 'Power1',
                    onComplete: function () {
                        self.lives--;
                        self.registry.set('lives', self.lives);
                        self.events.emit('livesChange', self.lives);

                        if (self.lives <= 0) {
                            // Game over
                            self.time.delayedCall(500, function () {
                                self.scene.stop('HUDScene');
                                self.scene.start('MenuScene');
                            });
                        } else {
                            // Respawn — preserve lives, score, coins
                            self.time.delayedCall(1000, function () {
                                self.scene.restart({
                                    level: self.currentLevel,
                                    score: self.score,
                                    coins: self.coins,
                                    lives: self.lives
                                });
                            });
                        }
                    }
                });
            }
        });
    },

    // ==========================================
    // REACH FLAGPOLE — level complete
    // ==========================================
    reachFlagpole: function (player, flagpole) {
        if (this.levelComplete) return;
        this.levelComplete = true;

        if (window.AudioManager) { AudioManager.stopMusic(); AudioManager.play('flagpole'); }

        // Calculate score bonus based on height
        var flagTop = flagpole.y - 180;
        var flagBottom = flagpole.y;
        var grabHeight = 1 - ((player.y - flagTop) / (flagBottom - flagTop));
        grabHeight = Phaser.Math.Clamp(grabHeight, 0, 1);

        var bonus;
        if (grabHeight > 0.8) {
            bonus = 5000;
        } else if (grabHeight > 0.5) {
            bonus = 2000;
        } else {
            bonus = 500;
        }

        this.score += bonus;
        this.registry.set('score', this.score);
        this.events.emit('scoreChange', this.score);
        this.showEnglishPopup('flag');

        // Stop player and slide down
        player.body.setVelocity(0, 0);
        player.body.setAllowGravity(false);
        player.body.setEnable(false);
        player.x = flagpole.x;

        var self = this;
        this.tweens.add({
            targets: player,
            y: flagBottom - 48,
            duration: 800,
            ease: 'Linear',
            onComplete: function () {
                player.body.setAllowGravity(true);
                player.body.setEnable(true);

                self.time.delayedCall(1500, function () {
                    self.scene.stop('HUDScene');
                    if (self.currentLevel >= 4) {
                        self.scene.start('WinScene', {
                            score: self.score,
                            coins: self.coins,
                            lives: self.lives,
                            level: self.currentLevel
                        });
                    } else {
                        self.scene.start('GameScene', {
                            level: self.currentLevel + 1,
                            score: self.score,
                            coins: self.coins,
                            lives: self.lives
                        });
                    }
                });
            }
        });
    },

    // ==========================================
    // BUMP BLOCK ANIMATION
    // ==========================================
    bumpBlock: function (block) {
        this.tweens.add({
            targets: block,
            y: block.y - 8,
            duration: 80,
            yoyo: true,
            ease: 'Power1'
        });
    },

    // ==========================================
    // BREAK EFFECT (brick particles)
    // ==========================================
    createBreakEffect: function (x, y) {
        var self = this;
        var offsets = [
            { vx: -80, vy: -200 },
            { vx: 80, vy: -200 },
            { vx: -50, vy: -150 },
            { vx: 50, vy: -150 }
        ];

        for (var i = 0; i < offsets.length; i++) {
            (function (vx, vy) {
                var piece = self.add.rectangle(x, y, 10, 10, 0xC84C0C);
                piece.setDepth(15);
                self.tweens.add({
                    targets: piece,
                    x: x + vx,
                    y: y + vy - 50,
                    angle: 360,
                    alpha: 0,
                    duration: 500,
                    ease: 'Power1',
                    onComplete: function () { piece.destroy(); }
                });
            })(offsets[i].vx, offsets[i].vy);
        }
    },

    // ==========================================
    // ENGLISH WORD POPUP
    // ==========================================
    showEnglishPopup: function (wordKey) {
        var word = window.EnglishWords ? window.EnglishWords.getWord(wordKey) : null;
        if (!word) {
            // Try random word as fallback
            word = window.EnglishWords ? window.EnglishWords.getRandomWord() : null;
        }
        if (!word) return;

        var text = word.en + '! (' + word.lt + ')';
        var popup = this.add.text(this.player.x, this.player.y - 40, text, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '10px',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        this.tweens.add({
            targets: popup,
            y: popup.y - 50,
            alpha: 0,
            duration: 1500,
            ease: 'Power1',
            onComplete: function () {
                popup.destroy();
            }
        });
    },

    // ==========================================
    // DECORATIVE BACKGROUNDS
    // ==========================================
    createDecorations: function (decorations) {
        if (!decorations) return;

        // Clouds (far background)
        if (decorations.clouds) {
            for (var ci = 0; ci < decorations.clouds.length; ci++) {
                var cd = decorations.clouds[ci];
                var cloud = this.add.image(cd.x, cd.y, 'cloud');
                cloud.setDepth(0);
                cloud.setAlpha(0.8);
                if (cd.scale) cloud.setScale(cd.scale);
                cloud.setScrollFactor(0.3); // Parallax
            }
        }

        // Hills (mid background)
        if (decorations.hills) {
            for (var hi = 0; hi < decorations.hills.length; hi++) {
                var hd = decorations.hills[hi];
                var hill = this.add.image(hd.x, hd.y, 'hill');
                hill.setDepth(1);
                hill.setOrigin(0.5, 1);
                if (hd.scale) hill.setScale(hd.scale);
                hill.setScrollFactor(0.5); // Parallax
            }
        }

        // Bushes (near ground)
        if (decorations.bushes) {
            for (var bi = 0; bi < decorations.bushes.length; bi++) {
                var bd = decorations.bushes[bi];
                var bush = this.add.image(bd.x, bd.y, 'bush');
                bush.setDepth(2);
                bush.setOrigin(0.5, 1);
                if (bd.scale) bush.setScale(bd.scale);
            }
        }
    },

    // ==========================================
    // LEVEL DATA — hardcoded tilemaps
    // ==========================================
    getLevelData: function (level) {
        if (level === 1) {
            return this.getLevel1Data();
        } else if (level === 2) {
            return this.getLevel2Data();
        } else if (level === 3) {
            return this.getLevel3Data();
        } else {
            return this.getLevel4Data();
        }
    },

    // ==========================================
    // LEVEL 1 — GRASSLAND (main level, detailed)
    // ==========================================
    getLevel1Data: function () {
        // Tile legend:
        //  0 = empty
        //  1 = grass top
        //  2 = earth body
        //  3 = brick
        //  4 = question (coin)
        //  40 = question (mushroom)
        //  41 = question (star)
        //  6 = pipe top-left, 7 = pipe top-right
        //  8 = pipe body-left, 9 = pipe body-right
        // 11 = stone platform
        // 50 = coin spawn
        // 60 = goomba spawn
        // 61 = koopa spawn
        // 70 = flagpole

        // 200 columns (6400px), 19 rows (608px)
        // Row 0 = top, Row 17 = grass, Row 18 = earth
        var _ = 0;

        // Build the map row by row
        // For readability, I'll define sections and merge them
        var map = [];
        var r;

        // Jump: -520 velocity, 800 gravity → max 169px = 5.3 tiles
        // Row 12 = 5 tiles above ground → comfortably reachable
        // Coins at row 11 above platforms → reachable by jumping from platform

        // Row 0-10: sky (empty)
        for (r = 0; r < 11; r++) {
            map[r] = this.makeRow(200, _);
        }

        // Row 11: coins above platforms (reachable by jumping from row 12 platform)
        map[11] = this.makeRow(200, _);
        map[11][17] = 50; map[11][18] = 50; map[11][19] = 50;
        map[11][56] = 50; map[11][57] = 50;
        map[11][111] = 50; map[11][112] = 50; map[11][113] = 50;

        // ---- FLOATING PLATFORMS at ROW 12 (5 tiles above ground) ----
        map[12] = this.makeRow(200, _);
        // First brick/? group (col 16-20)
        map[12][16] = 3; map[12][17] = 4; map[12][18] = 3; map[12][19] = 40; map[12][20] = 3;
        // Second brick/? group (col 55-58)
        map[12][55] = 3; map[12][56] = 4; map[12][57] = 4; map[12][58] = 3;
        // Third platform with star (col 88-92)
        map[12][88] = 3; map[12][89] = 4; map[12][90] = 41; map[12][91] = 4; map[12][92] = 3;
        // Fourth platform (col 110-114)
        map[12][110] = 3; map[12][111] = 40; map[12][112] = 3; map[12][113] = 4; map[12][114] = 3;
        // Fifth platform (col 70-74)
        map[12][70] = 3; map[12][71] = 4; map[12][72] = 40; map[12][73] = 4; map[12][74] = 3;
        // Platform near col 130
        map[12][130] = 3; map[12][131] = 4; map[12][132] = 3;
        // Safety bridge over gap 1 (col 44-48)
        map[12][44] = 3; map[12][45] = 3; map[12][46] = 3; map[12][47] = 3; map[12][48] = 3;
        // Safety bridge over gap 2 (col 136-140)
        map[12][136] = 3; map[12][137] = 3; map[12][138] = 3; map[12][139] = 3; map[12][140] = 3;

        // Row 13-14: empty
        map[13] = this.makeRow(200, _);
        map[14] = this.makeRow(200, _);

        // ---- PIPES (sit on ground, row 15-16) ----
        map[15] = this.makeRow(200, _);
        map[16] = this.makeRow(200, _);

        // Short pipe A (2 tiles tall): top at row 15, body at row 16 — col 28
        map[15][28] = 6; map[15][29] = 7;
        map[16][28] = 8; map[16][29] = 9;

        // Medium pipe B (3 tiles tall): top at row 14 — col 50
        map[14][50] = 6; map[14][51] = 7;
        map[15][50] = 8; map[15][51] = 9;
        map[16][50] = 8; map[16][51] = 9;

        // Short pipe C — col 95 (2 tiles)
        map[15][95] = 6; map[15][96] = 7;
        map[16][95] = 8; map[16][96] = 9;

        // Short pipe D — col 155
        map[15][155] = 6; map[15][156] = 7;
        map[16][155] = 8; map[16][156] = 9;

        // ---- COINS at ground level (row 16, easy to grab running) ----
        var groundCoins = [5,6,7,8,9, 25,26,27, 35,36,37,38, 60,61,62,63,
                           65,66,67,68, 80,81,82,83, 100,101,102,103,
                           120,121,122,123,124, 145,146,147,148, 160,161,162,163,
                           170,171,172,173];

        // Row 17: Grass top (continuous with small gaps)
        map[17] = this.makeRow(200, 1);
        // Gap 1 (small, 3 wide) at col 45-47
        map[17][45] = _; map[17][46] = _; map[17][47] = _;
        // Gap 2 (small, 3 wide) at col 137-139
        map[17][137] = _; map[17][138] = _; map[17][139] = _;
        // Clear the end area past flagpole
        for (var fc = 195; fc < 200; fc++) {
            map[17][fc] = _;
        }
        // Make sure flagpole area has ground
        // Flagpole at col 190
        for (fc = 185; fc < 195; fc++) {
            map[17][fc] = 1;
        }

        // Row 18: Earth body (mirrors grass row)
        map[18] = this.makeRow(200, 2);
        map[18][45] = _; map[18][46] = _; map[18][47] = _;
        map[18][137] = _; map[18][138] = _; map[18][139] = _;
        for (fc = 195; fc < 200; fc++) {
            map[18][fc] = _;
        }
        for (fc = 185; fc < 195; fc++) {
            map[18][fc] = 2;
        }

        // Staircase near the end (col 175-183) — fun for kids to climb
        // Step 1: row 16, col 175
        map[16][175] = 11;
        // Step 2: row 15-16, col 176-177
        map[16][176] = 11; map[16][177] = 11;
        map[15][176] = 11; map[15][177] = 11;
        // Step 3: row 14-16, col 178-179
        map[16][178] = 11; map[16][179] = 11;
        map[15][178] = 11; map[15][179] = 11;
        map[14][178] = 11; map[14][179] = 11;
        // Step 4: row 13-16, col 180-181
        map[16][180] = 11; map[16][181] = 11;
        map[15][180] = 11; map[15][181] = 11;
        map[14][180] = 11; map[14][181] = 11;
        map[13][180] = 11; map[13][181] = 11;
        // Step 5: row 12-16, col 182-183
        map[16][182] = 11; map[16][183] = 11;
        map[15][182] = 11; map[15][183] = 11;
        map[14][182] = 11; map[14][183] = 11;
        map[13][182] = 11; map[13][183] = 11;
        map[12][182] = 11; map[12][183] = 11;

        // Flagpole at col 190
        map[5][190] = 70;

        // Enemy spawns (few, this is for a kid!)
        // Goomba 1 at col 35
        map[16][35] = 60;
        // Goomba 2 at col 75
        map[16][75] = 60;
        // Goomba 3 at col 115
        map[16][115] = 60;
        // Koopa 1 at col 150
        map[16][150] = 61;

        // Extra coins along the way (ground level, easy to collect)
        var extraCoinCols = [
            10, 11, 12, 13, 14,     // Near start
            43, 44,                   // Before gap
            48, 49,                   // After gap
            82, 83, 84, 85,          // Mid level
            103, 104, 105,            // Mid level
            145, 146, 147, 148,      // Near end
            165, 166, 167, 168       // Near staircase
        ];
        for (var eci = 0; eci < extraCoinCols.length; eci++) {
            var ec = extraCoinCols[eci];
            if (map[16][ec] === 0) {
                map[16][ec] = 50;
            }
        }

        // Decorations
        var decorations = {
            clouds: [
                { x: 100, y: 60, scale: 1 },
                { x: 400, y: 40, scale: 0.8 },
                { x: 700, y: 70, scale: 1.2 },
                { x: 1100, y: 50, scale: 0.9 },
                { x: 1500, y: 35, scale: 1.1 },
                { x: 1900, y: 65, scale: 0.7 },
                { x: 2400, y: 45, scale: 1 },
                { x: 2900, y: 55, scale: 0.85 },
                { x: 3400, y: 40, scale: 1.1 },
                { x: 3900, y: 60, scale: 0.9 },
                { x: 4400, y: 50, scale: 1 },
                { x: 5000, y: 35, scale: 0.8 },
                { x: 5500, y: 65, scale: 1.2 },
                { x: 6000, y: 45, scale: 0.9 }
            ],
            hills: [
                { x: 200, y: 544, scale: 1.2 },
                { x: 800, y: 544, scale: 0.8 },
                { x: 1600, y: 544, scale: 1.0 },
                { x: 2400, y: 544, scale: 1.3 },
                { x: 3200, y: 544, scale: 0.9 },
                { x: 4000, y: 544, scale: 1.1 },
                { x: 4800, y: 544, scale: 0.7 },
                { x: 5600, y: 544, scale: 1.0 }
            ],
            bushes: [
                { x: 350, y: 544, scale: 1 },
                { x: 900, y: 544, scale: 0.8 },
                { x: 1300, y: 544, scale: 1.1 },
                { x: 2000, y: 544, scale: 0.9 },
                { x: 2700, y: 544, scale: 1 },
                { x: 3500, y: 544, scale: 0.8 },
                { x: 4200, y: 544, scale: 1.2 },
                { x: 5100, y: 544, scale: 0.9 },
                { x: 5800, y: 544, scale: 1 }
            ]
        };

        return {
            map: map,
            decorations: decorations
        };
    },

    // ==========================================
    // LEVEL 2 — UNDERGROUND (simple)
    // ==========================================
    getLevel2Data: function () {
        var _ = 0;
        var map = [];

        // Rows 0-1: ceiling
        map[0] = this.makeRow(200, 10);
        map[1] = this.makeRow(200, 10);

        // Rows 2-16: mostly empty, with platforms
        for (var r = 2; r < 17; r++) {
            map[r] = this.makeRow(200, _);
        }

        // Ground
        map[17] = this.makeRow(200, 1);
        map[18] = this.makeRow(200, 2);

        // Brick platforms throughout — row 12 (5 tiles above ground)
        for (var bp = 10; bp < 190; bp += 20) {
            map[12][bp] = 10; map[12][bp+1] = 10; map[12][bp+2] = 10;
            map[12][bp+3] = 4; map[12][bp+4] = 10;
        }

        // Coins
        for (var cc = 12; cc < 185; cc += 8) {
            map[16][cc] = 50;
        }

        // Few enemies
        map[16][40] = 60;
        map[16][80] = 60;
        map[16][120] = 60;

        // Flagpole
        map[5][190] = 70;

        return {
            map: map,
            decorations: { clouds: [], hills: [], bushes: [] }
        };
    },

    // ==========================================
    // LEVEL 3 — SKY (simple)
    // ==========================================
    getLevel3Data: function () {
        var _ = 0;
        var map = [];

        for (var r = 0; r < 19; r++) {
            map[r] = this.makeRow(200, _);
        }

        // Deterministic cloud platform pattern — easy ascending/descending
        // Gap between platforms: 3-4 cols (easy for kid to jump)
        var platformPattern = [
            { col: 5, row: 16, width: 6 },
            { col: 14, row: 15, width: 5 },
            { col: 22, row: 14, width: 6 },
            { col: 31, row: 13, width: 5 },
            { col: 39, row: 14, width: 6 },
            { col: 48, row: 15, width: 5 },
            { col: 56, row: 14, width: 6 },
            { col: 65, row: 13, width: 5 },
            { col: 73, row: 13, width: 6 },
            { col: 82, row: 14, width: 5 },
            { col: 90, row: 13, width: 6 },
            { col: 99, row: 14, width: 5 },
            { col: 107, row: 15, width: 6 },
            { col: 116, row: 14, width: 5 },
            { col: 124, row: 13, width: 6 },
            { col: 133, row: 14, width: 5 },
            { col: 141, row: 15, width: 6 },
            { col: 150, row: 14, width: 5 },
            { col: 158, row: 13, width: 6 },
            { col: 167, row: 14, width: 5 },
            { col: 175, row: 15, width: 6 }
        ];

        for (var pi = 0; pi < platformPattern.length; pi++) {
            var plat = platformPattern[pi];
            // Place stone tiles for the platform
            for (var pw = 0; pw < plat.width; pw++) {
                map[plat.row][plat.col + pw] = 11;
            }
            // Coins one row above the platform
            for (var cw = 1; cw < plat.width - 1; cw++) {
                map[plat.row - 1][plat.col + cw] = 50;
            }
            // Place enemies on wider platforms (width 6)
            if (plat.width >= 6) {
                map[plat.row - 1][plat.col + 2] = 60;
            }
        }

        // Ground start area
        for (var gs = 0; gs < 8; gs++) {
            map[17][gs] = 1; map[18][gs] = 2;
        }

        // Ground end area
        for (var ge = 185; ge < 200; ge++) {
            map[17][ge] = 1; map[18][ge] = 2;
        }

        // Flagpole
        map[5][190] = 70;

        return {
            map: map,
            decorations: {
                clouds: [
                    { x: 200, y: 40, scale: 1.5 },
                    { x: 600, y: 30, scale: 1.2 },
                    { x: 1000, y: 50, scale: 1.8 },
                    { x: 1500, y: 35, scale: 1.3 },
                    { x: 2200, y: 45, scale: 1.6 },
                    { x: 3000, y: 30, scale: 1.4 }
                ],
                hills: [],
                bushes: []
            }
        };
    },

    // ==========================================
    // LEVEL 4 — CASTLE (simple)
    // ==========================================
    getLevel4Data: function () {
        var _ = 0;
        var map = [];

        // Ceiling
        map[0] = this.makeRow(200, 11);
        map[1] = this.makeRow(200, 11);

        // Rows 2-16: empty with stone platforms
        for (var r = 2; r < 17; r++) {
            map[r] = this.makeRow(200, _);
        }

        // Ground
        map[17] = this.makeRow(200, 11);
        map[18] = this.makeRow(200, 11);

        // Lava gaps (3-wide)
        map[17][40] = _; map[17][41] = _; map[17][42] = _;
        map[18][40] = _; map[18][41] = _; map[18][42] = _;
        map[17][80] = _; map[17][81] = _; map[17][82] = _;
        map[18][80] = _; map[18][81] = _; map[18][82] = _;

        // Stone platforms — row 12 (5 tiles above ground)
        for (var sp = 15; sp < 180; sp += 25) {
            map[12][sp] = 11; map[12][sp+1] = 11; map[12][sp+2] = 11;
            map[12][sp+3] = 4; map[12][sp+4] = 11;
        }

        // Coins
        for (var cc = 10; cc < 180; cc += 6) {
            map[16][cc] = 50;
        }

        // Enemies
        map[16][30] = 60; map[16][60] = 60; map[16][100] = 60;

        // Flagpole
        map[5][190] = 70;

        return {
            map: map,
            decorations: { clouds: [], hills: [], bushes: [] }
        };
    },

    // ==========================================
    // HELPER: make a row filled with a value
    // ==========================================
    makeRow: function (length, value) {
        var row = [];
        for (var i = 0; i < length; i++) {
            row[i] = value;
        }
        return row;
    }
});

// Attach to window for global access
window.GameScene = GameScene;
