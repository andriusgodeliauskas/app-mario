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
        var bgColors = { 1: '#6B8CFF', 2: '#000000', 3: '#9494FF', 4: '#1A0A1E', 5: '#87CEEB', 6: '#1A3A1A', 7: '#E8A050', 8: '#C0D8E8', 9: '#2A0808' };
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
                    gt.setScale(0.5).setSize(TILE, TILE).refreshBody();
                } else if (tileId === 3) {
                    // Brick block
                    var bt = this.brickTiles.create(tx, ty, 'tiles', 3);
                    bt.setScale(0.5).setSize(TILE, TILE).refreshBody();
                    bt.tileType = 'brick';
                    bt.isUsed = false;
                } else if (tileId === 4) {
                    // Question block
                    var qt = this.questionTiles.create(tx, ty, 'tiles', 4);
                    qt.setScale(0.5).setSize(TILE, TILE).refreshBody();
                    qt.tileType = 'question';
                    qt.isUsed = false;
                    qt.content = 'coin'; // default content
                } else if (tileId === 40) {
                    // Question block with mushroom
                    var qm = this.questionTiles.create(tx, ty, 'tiles', 4);
                    qm.setScale(0.5).setSize(TILE, TILE).refreshBody();
                    qm.tileType = 'question';
                    qm.isUsed = false;
                    qm.content = 'mushroom';
                } else if (tileId === 41) {
                    // Question block with star
                    var qs = this.questionTiles.create(tx, ty, 'tiles', 4);
                    qs.setScale(0.5).setSize(TILE, TILE).refreshBody();
                    qs.tileType = 'question';
                    qs.isUsed = false;
                    qs.content = 'star';
                } else if (tileId === 6 || tileId === 7 || tileId === 8 || tileId === 9) {
                    // Pipe tiles
                    var pt = this.pipeTiles.create(tx, ty, 'tiles', tileId);
                    pt.setScale(0.5).setSize(TILE, TILE).refreshBody();
                } else if (tileId === 11) {
                    // Stone platform
                    var st = this.groundTiles.create(tx, ty, 'tiles', 11);
                    st.setScale(0.5).setSize(TILE, TILE).refreshBody();
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
        this.player.setScale(0.25);
        this.player.setSize(96, 120);
        this.player.setOffset(16, 8);
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
            c.setScale(0.25);
            c.play('coin-spin');
            c.body.setAllowGravity(false);
            c.setSize(48, 56);
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
                enemy.setScale(0.25);
                enemy.play('goomba-walk');
                enemy.setSize(112, 112);
                enemy.setOffset(8, 16);
                enemy.enemyType = 'goomba';
            } else if (esp.type === 'koopa') {
                enemy = this.enemies.create(esp.x, esp.y, 'koopa');
                enemy.setScale(0.25);
                enemy.play('koopa-walk');
                enemy.setSize(112, 160);
                enemy.setOffset(8, 32);
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
        this.groundLevelY = (ROWS - 2) * TILE; // Ground tile top (544)

        if (flagpolePos) {
            var flagBaseY = this.groundLevelY;
            this.flagpole = this.physics.add.sprite(flagpolePos.x, flagBaseY - 128, 'flagpole');
            this.flagpole.setOrigin(0.5, 0.5);
            this.flagpole.body.setAllowGravity(false);
            this.flagpole.body.setImmovable(true);
            // Explicitly set physics body size (wide and tall enough to reach ground)
            this.flagpole.body.setSize(80, 320);
            this.flagpole.body.setOffset(
                (this.flagpole.width - 80) / 2,
                (this.flagpole.height - 320) / 2
            );
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
        var musicMap = { 1: 'overworld', 2: 'underground', 3: 'overworld', 4: 'castle', 5: 'overworld', 6: 'overworld', 7: 'underground', 8: 'overworld', 9: 'castle' };
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

            // Initialize tracking vars
            if (e._lastX === undefined) { e._lastX = e.x; e._stuckTime = 0; e._turnCooldown = 0; }

            // Turn cooldown prevents rapid flip-flopping
            if (e._turnCooldown > 0) e._turnCooldown -= delta;

            // Turn around at walls
            if (e.body.blocked.left && e._turnCooldown <= 0) {
                e.setVelocityX(60);
                e.patrolDir = 1;
                e.setFlipX(true);
                e._turnCooldown = 300;
            } else if (e.body.blocked.right && e._turnCooldown <= 0) {
                e.setVelocityX(-60);
                e.patrolDir = -1;
                e.setFlipX(false);
                e._turnCooldown = 300;
            }

            // Edge detection — turn around at platform edges (only if not cooling down)
            if (e.body.blocked.down && e._turnCooldown <= 0) {
                var aheadX = e.patrolDir > 0 ? e.body.right + 4 : e.body.left - 4;
                var belowY = e.body.bottom + 6;
                var hasGround = false;

                var tileGroups = [this.groundTiles, this.brickTiles, this.pipeTiles];
                for (var g = 0; g < tileGroups.length && !hasGround; g++) {
                    var tiles = tileGroups[g].getChildren();
                    for (var t = 0; t < tiles.length; t++) {
                        var tile = tiles[t];
                        if (tile.active &&
                            aheadX >= tile.body.left && aheadX <= tile.body.right &&
                            belowY >= tile.body.top && belowY <= tile.body.bottom) {
                            hasGround = true;
                            break;
                        }
                    }
                }

                if (!hasGround) {
                    e.patrolDir = -e.patrolDir;
                    e.setVelocityX(60 * e.patrolDir);
                    e.setFlipX(e.patrolDir > 0);
                    e._turnCooldown = 400;
                }
            }

            // Stuck detection — if enemy barely moved over 500ms, force reverse
            e._stuckTime += delta;
            if (e._stuckTime > 500) {
                var moved = Math.abs(e.x - e._lastX);
                if (moved < 5) {
                    e.patrolDir = -e.patrolDir;
                    e.setVelocityX(80 * e.patrolDir);
                    e.setFlipX(e.patrolDir > 0);
                    e._turnCooldown = 500;
                }
                e._lastX = e.x;
                e._stuckTime = 0;
            }

            // Re-kick if velocity dropped too low
            if (e.body.blocked.down && Math.abs(e.body.velocity.x) < 10) {
                e.setVelocityX(60 * e.patrolDir);
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
            this.showEnglishPopup(); // random word each time
        }
    },

    // ==========================================
    // HIT BRICK FROM BELOW
    // ==========================================
    hitBrick: function (player, brick) {
        // Only trigger when hitting from below: player center must be below block center
        // (velocity check doesn't work because Phaser resolves collision before callback)
        var pcy = player.body.y + player.body.height / 2;
        var bcy = brick.body.y + brick.body.height / 2;
        if (pcy <= bcy) return;
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
            this.showEnglishPopup(); // random word
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
        // Only trigger when hitting from below: player center must be below block center
        // (velocity check doesn't work because Phaser resolves collision before callback)
        var pcy = player.body.y + player.body.height / 2;
        var bcy = block.body.y + block.body.height / 2;
        if (pcy <= bcy) return;
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
            this.showEnglishPopup(); // random word each time
        } else if (block.content === 'mushroom') {
            // Spawn mushroom
            var mush = this.mushrooms.create(block.x, block.y - 32, 'mushroom');
            mush.setScale(0.25);
            mush.play('mushroom-idle');
            mush.setBounce(0.2);
            mush.setVelocityX(80);
            mush.setSize(112, 112);
            mush.setOffset(8, 16);
            this.showEnglishPopup('mushroom');
        } else if (block.content === 'star') {
            // Spawn star
            var star = this.stars.create(block.x, block.y - 32, 'star');
            star.setScale(0.25);
            star.play('star-flash');
            star.setBounce(0.8);
            star.setVelocityX(100);
            star.setVelocityY(-200);
            star.setSize(112, 112);
            star.setOffset(8, 8);
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
            player.setSize(96, 224);
            player.setOffset(16, 32);
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
        this.showEnglishPopup(); // random word

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
            this.player.setSize(96, 120);
            this.player.setOffset(16, 8);
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

        // Calculate score bonus based on grab height on the visible pole
        var poleVisualTop = flagpole.y - flagpole.height / 2; // top of sprite
        var poleVisualBottom = flagpole.y + flagpole.height / 2; // bottom of sprite
        var grabHeight = 1 - ((player.y - poleVisualTop) / (poleVisualBottom - poleVisualTop));
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

        // Stop player and slide down to ground level
        player.body.setVelocity(0, 0);
        player.body.setAllowGravity(false);
        player.body.setEnable(false);
        player.x = flagpole.x;

        // Slide to ground level (player center = groundY - half player height)
        var slideToY = this.groundLevelY - 16;
        var self = this;
        this.tweens.add({
            targets: player,
            y: slideToY,
            duration: 800,
            ease: 'Linear',
            onComplete: function () {
                self.time.delayedCall(1500, function () {
                    self.scene.stop('HUDScene');
                    self.scene.start('WinScene', {
                        score: self.score,
                        coins: self.coins,
                        lives: self.lives,
                        level: self.currentLevel
                    });
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
    // ENGLISH WORD POPUP — card-style with icon
    // ==========================================
    showEnglishPopup: function (wordKey) {
        var word = window.EnglishWords ? window.EnglishWords.getWord(wordKey) : null;
        if (!word) {
            word = window.EnglishWords ? window.EnglishWords.getRandomWord() : null;
        }
        if (!word) return;

        var self = this;
        var px = this.player.x;
        var py = this.player.y - 70;

        // Category colors
        var catColors = {
            animals: { bg: 0x4A90D9, stripe: 0x2E6BAA },
            nature:  { bg: 0x50B050, stripe: 0x308030 },
            fruits:  { bg: 0xE87A2E, stripe: 0xC05A1E },
            colors:  { bg: 0xCC44CC, stripe: 0x993399 },
            objects: { bg: 0xCCCC33, stripe: 0x999922 },
            body:    { bg: 0xE85050, stripe: 0xBB3333 },
            food:    { bg: 0xE8A030, stripe: 0xCC8020 },
            game:    { bg: 0x6B8CFF, stripe: 0x4A6ACC }
        };
        var cat = word.category || 'game';
        var colors = catColors[cat] || catColors.game;

        // Background card
        var cardW = 160;
        var cardH = 60;
        var card = this.add.graphics().setDepth(99);
        card.fillStyle(0x000000, 0.6);
        card.fillRoundedRect(px - cardW / 2 + 2, py - cardH / 2 + 2, cardW, cardH, 8);
        card.fillStyle(colors.bg, 0.95);
        card.fillRoundedRect(px - cardW / 2, py - cardH / 2, cardW, cardH, 8);
        card.lineStyle(2, 0xFFFFFF, 0.6);
        card.strokeRoundedRect(px - cardW / 2, py - cardH / 2, cardW, cardH, 8);

        // English word (big)
        var enText = this.add.text(px, py - 10, word.en, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '14px',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5).setDepth(101);

        // Lithuanian translation (smaller)
        var ltText = this.add.text(px, py + 12, word.lt, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '9px',
            color: '#FFE880',
            stroke: '#000000',
            strokeThickness: 1,
            align: 'center'
        }).setOrigin(0.5).setDepth(101);

        // Animate — float up and fade
        var elements = [card, enText, ltText];
        for (var ei = 0; ei < elements.length; ei++) {
            this.tweens.add({
                targets: elements[ei],
                y: '-=60',
                alpha: 0,
                duration: 2500,
                delay: 500,
                ease: 'Power1',
                onComplete: function () {
                    this.targets[0].destroy();
                }.bind({ targets: [elements[ei]] })
            });
        }
    },

    // ==========================================
    // DECORATIVE BACKGROUNDS — all behind gameplay (negative depth)
    // Depth layers: -10 clouds, -8 hills, -6 bushes/fences/rocks, -4 flowers/grass/mushrooms
    // Gameplay objects use default depth 0+ so they always render on top
    // ==========================================
    createDecorations: function (decorations) {
        if (!decorations) return;

        // Clouds (far background)
        if (decorations.clouds) {
            for (var ci = 0; ci < decorations.clouds.length; ci++) {
                var cd = decorations.clouds[ci];
                var cloud = this.add.image(cd.x, cd.y, 'cloud');
                cloud.setDepth(-10);
                cloud.setAlpha(0.8);
                cloud.setScale((cd.scale || 1) * 0.5);
                cloud.setScrollFactor(0.3);
            }
        }

        // Hills (mid background)
        if (decorations.hills) {
            for (var hi = 0; hi < decorations.hills.length; hi++) {
                var hd = decorations.hills[hi];
                var hill = this.add.image(hd.x, hd.y, 'hill');
                hill.setDepth(-8);
                hill.setOrigin(0.5, 1);
                hill.setScale((hd.scale || 1) * 0.5);
                hill.setScrollFactor(0.5);
            }
        }

        // Bushes (near ground, behind gameplay)
        if (decorations.bushes) {
            for (var bi = 0; bi < decorations.bushes.length; bi++) {
                var bd = decorations.bushes[bi];
                var bush = this.add.image(bd.x, bd.y, 'bush');
                bush.setDepth(-6);
                bush.setOrigin(0.5, 1);
                bush.setScale((bd.scale || 1) * 0.5);
            }
        }

        // Flowers (behind gameplay)
        if (decorations.flowers) {
            for (var fi = 0; fi < decorations.flowers.length; fi++) {
                var fd = decorations.flowers[fi];
                var fl = this.add.image(fd.x, fd.y, 'flower-deco');
                fl.setDepth(-4);
                fl.setOrigin(0.5, 1);
                fl.setScale((fd.scale || 1) * 0.5);
                if (fd.tint) fl.setTint(fd.tint);
            }
        }

        // Grass tufts (behind gameplay)
        if (decorations.grass) {
            for (var gi = 0; gi < decorations.grass.length; gi++) {
                var gd = decorations.grass[gi];
                var gr = this.add.image(gd.x, gd.y, 'grass-tuft');
                gr.setDepth(-4);
                gr.setOrigin(0.5, 1);
                gr.setScale((gd.scale || 1) * 0.5);
            }
        }

        // Decorative mushrooms (behind gameplay)
        if (decorations.mushrooms) {
            for (var mi = 0; mi < decorations.mushrooms.length; mi++) {
                var md = decorations.mushrooms[mi];
                var mu = this.add.image(md.x, md.y, 'mushroom-deco');
                mu.setDepth(-4);
                mu.setOrigin(0.5, 1);
                mu.setScale((md.scale || 1) * 0.5);
            }
        }

        // Rocks (behind gameplay)
        if (decorations.rocks) {
            for (var ri = 0; ri < decorations.rocks.length; ri++) {
                var rd = decorations.rocks[ri];
                var rk = this.add.image(rd.x, rd.y, 'rock-deco');
                rk.setDepth(-6);
                rk.setOrigin(0.5, 1);
                rk.setScale((rd.scale || 1) * 0.5);
            }
        }

        // Fences (behind gameplay)
        if (decorations.fences) {
            for (var fni = 0; fni < decorations.fences.length; fni++) {
                var fnd = decorations.fences[fni];
                var fn = this.add.image(fnd.x, fnd.y, 'fence');
                fn.setDepth(-6);
                fn.setOrigin(0, 1);
                fn.setScale((fnd.scale || 1) * 0.5);
            }
        }
    },

    // ==========================================
    // LEVEL DATA — hardcoded tilemaps
    // ==========================================
    getLevelData: function (level) {
        var fn = 'getLevel' + level + 'Data';
        if (this[fn]) return this[fn]();
        return this.getLevel1Data();
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

        // Decorations — rich environment like real Mario
        var gY = 544; // ground Y
        var decorations = {
            clouds: [
                { x: 100, y: 60, scale: 1 },
                { x: 300, y: 30, scale: 0.6 },
                { x: 550, y: 50, scale: 0.8 },
                { x: 700, y: 70, scale: 1.2 },
                { x: 1000, y: 25, scale: 0.7 },
                { x: 1100, y: 50, scale: 0.9 },
                { x: 1400, y: 70, scale: 0.5 },
                { x: 1500, y: 35, scale: 1.1 },
                { x: 1800, y: 55, scale: 0.6 },
                { x: 1900, y: 65, scale: 0.7 },
                { x: 2200, y: 30, scale: 0.8 },
                { x: 2400, y: 45, scale: 1 },
                { x: 2700, y: 65, scale: 0.5 },
                { x: 2900, y: 55, scale: 0.85 },
                { x: 3200, y: 30, scale: 0.7 },
                { x: 3400, y: 40, scale: 1.1 },
                { x: 3700, y: 70, scale: 0.6 },
                { x: 3900, y: 60, scale: 0.9 },
                { x: 4200, y: 35, scale: 0.8 },
                { x: 4400, y: 50, scale: 1 },
                { x: 4800, y: 25, scale: 0.6 },
                { x: 5000, y: 35, scale: 0.8 },
                { x: 5300, y: 55, scale: 0.7 },
                { x: 5500, y: 65, scale: 1.2 },
                { x: 5800, y: 30, scale: 0.5 },
                { x: 6000, y: 45, scale: 0.9 }
            ],
            hills: [
                { x: 200, y: gY, scale: 1.2 },
                { x: 600, y: gY, scale: 0.6 },
                { x: 800, y: gY, scale: 0.8 },
                { x: 1200, y: gY, scale: 1.4 },
                { x: 1600, y: gY, scale: 1.0 },
                { x: 2000, y: gY, scale: 0.7 },
                { x: 2400, y: gY, scale: 1.3 },
                { x: 2800, y: gY, scale: 0.6 },
                { x: 3200, y: gY, scale: 0.9 },
                { x: 3600, y: gY, scale: 1.2 },
                { x: 4000, y: gY, scale: 1.1 },
                { x: 4400, y: gY, scale: 0.6 },
                { x: 4800, y: gY, scale: 0.7 },
                { x: 5200, y: gY, scale: 1.3 },
                { x: 5600, y: gY, scale: 1.0 },
                { x: 6000, y: gY, scale: 0.8 }
            ],
            bushes: [
                { x: 180, y: gY, scale: 1 },
                { x: 350, y: gY, scale: 0.7 },
                { x: 550, y: gY, scale: 1.2 },
                { x: 900, y: gY, scale: 0.8 },
                { x: 1100, y: gY, scale: 1.0 },
                { x: 1300, y: gY, scale: 1.1 },
                { x: 1700, y: gY, scale: 0.6 },
                { x: 2000, y: gY, scale: 0.9 },
                { x: 2300, y: gY, scale: 1.2 },
                { x: 2700, y: gY, scale: 1 },
                { x: 3100, y: gY, scale: 0.7 },
                { x: 3500, y: gY, scale: 0.8 },
                { x: 3800, y: gY, scale: 1.1 },
                { x: 4200, y: gY, scale: 1.2 },
                { x: 4600, y: gY, scale: 0.7 },
                { x: 5100, y: gY, scale: 0.9 },
                { x: 5500, y: gY, scale: 1.0 },
                { x: 5800, y: gY, scale: 1 }
            ],
            flowers: [
                { x: 160, y: gY, scale: 1.2 },
                { x: 420, y: gY, scale: 1.0 },
                { x: 680, y: gY, scale: 1.4, tint: 0xFF88FF },
                { x: 1050, y: gY, scale: 1.1 },
                { x: 1350, y: gY, scale: 1.3, tint: 0xFFFF44 },
                { x: 1650, y: gY, scale: 1.0 },
                { x: 1920, y: gY, scale: 1.2, tint: 0xFF88FF },
                { x: 2250, y: gY, scale: 1.1 },
                { x: 2580, y: gY, scale: 1.3 },
                { x: 2850, y: gY, scale: 1.0, tint: 0xFFFF44 },
                { x: 3150, y: gY, scale: 1.2 },
                { x: 3480, y: gY, scale: 1.1, tint: 0xFF88FF },
                { x: 3750, y: gY, scale: 1.3 },
                { x: 4050, y: gY, scale: 1.0 },
                { x: 4380, y: gY, scale: 1.2, tint: 0xFFFF44 },
                { x: 4680, y: gY, scale: 1.1 },
                { x: 4980, y: gY, scale: 1.3, tint: 0xFF88FF },
                { x: 5280, y: gY, scale: 1.0 },
                { x: 5580, y: gY, scale: 1.2 },
                { x: 5880, y: gY, scale: 1.1, tint: 0xFFFF44 }
            ],
            grass: [
                { x: 120, y: gY, scale: 1.0 },
                { x: 250, y: gY, scale: 0.8 },
                { x: 380, y: gY, scale: 1.2 },
                { x: 520, y: gY, scale: 0.9 },
                { x: 640, y: gY, scale: 1.1 },
                { x: 780, y: gY, scale: 1.0 },
                { x: 960, y: gY, scale: 0.8 },
                { x: 1180, y: gY, scale: 1.2 },
                { x: 1420, y: gY, scale: 1.0 },
                { x: 1580, y: gY, scale: 0.9 },
                { x: 1760, y: gY, scale: 1.1 },
                { x: 1950, y: gY, scale: 1.0 },
                { x: 2150, y: gY, scale: 0.8 },
                { x: 2380, y: gY, scale: 1.2 },
                { x: 2620, y: gY, scale: 1.0 },
                { x: 2860, y: gY, scale: 0.9 },
                { x: 3080, y: gY, scale: 1.1 },
                { x: 3320, y: gY, scale: 1.0 },
                { x: 3580, y: gY, scale: 0.8 },
                { x: 3820, y: gY, scale: 1.2 },
                { x: 4050, y: gY, scale: 1.0 },
                { x: 4320, y: gY, scale: 0.9 },
                { x: 4580, y: gY, scale: 1.1 },
                { x: 4820, y: gY, scale: 1.0 },
                { x: 5080, y: gY, scale: 0.8 },
                { x: 5380, y: gY, scale: 1.2 },
                { x: 5680, y: gY, scale: 1.0 },
                { x: 5920, y: gY, scale: 0.9 }
            ],
            mushrooms: [
                { x: 300, y: gY, scale: 1.0 },
                { x: 750, y: gY, scale: 1.2 },
                { x: 1250, y: gY, scale: 0.9 },
                { x: 1800, y: gY, scale: 1.1 },
                { x: 2500, y: gY, scale: 1.0 },
                { x: 3000, y: gY, scale: 1.2 },
                { x: 3600, y: gY, scale: 0.9 },
                { x: 4100, y: gY, scale: 1.1 },
                { x: 4700, y: gY, scale: 1.0 },
                { x: 5200, y: gY, scale: 1.2 },
                { x: 5700, y: gY, scale: 0.9 }
            ],
            rocks: [
                { x: 500, y: gY, scale: 0.8 },
                { x: 1500, y: gY, scale: 1.0 },
                { x: 2200, y: gY, scale: 0.9 },
                { x: 3300, y: gY, scale: 1.1 },
                { x: 4500, y: gY, scale: 0.8 },
                { x: 5400, y: gY, scale: 1.0 }
            ],
            fences: [
                { x: 220, y: gY, scale: 1.0 },
                { x: 252, y: gY, scale: 1.0 },
                { x: 1000, y: gY, scale: 1.0 },
                { x: 1032, y: gY, scale: 1.0 },
                { x: 1064, y: gY, scale: 1.0 },
                { x: 2600, y: gY, scale: 1.0 },
                { x: 2632, y: gY, scale: 1.0 },
                { x: 3900, y: gY, scale: 1.0 },
                { x: 3932, y: gY, scale: 1.0 },
                { x: 3964, y: gY, scale: 1.0 },
                { x: 5050, y: gY, scale: 1.0 },
                { x: 5082, y: gY, scale: 1.0 }
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
            decorations: {
                clouds: [],
                hills: [],
                bushes: [],
                mushrooms: [
                    { x: 200, y: 544, scale: 1.2 },
                    { x: 800, y: 544, scale: 1.0 },
                    { x: 1600, y: 544, scale: 1.1 },
                    { x: 2400, y: 544, scale: 0.9 },
                    { x: 3200, y: 544, scale: 1.2 },
                    { x: 4000, y: 544, scale: 1.0 },
                    { x: 4800, y: 544, scale: 1.1 },
                    { x: 5600, y: 544, scale: 0.9 }
                ],
                rocks: [
                    { x: 500, y: 544, scale: 0.9 },
                    { x: 1200, y: 544, scale: 1.1 },
                    { x: 2000, y: 544, scale: 0.8 },
                    { x: 2800, y: 544, scale: 1.0 },
                    { x: 3600, y: 544, scale: 0.9 },
                    { x: 4400, y: 544, scale: 1.1 },
                    { x: 5200, y: 544, scale: 0.8 }
                ]
            }
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
                    { x: 100, y: 50, scale: 1.5 },
                    { x: 300, y: 25, scale: 0.8 },
                    { x: 500, y: 60, scale: 1.2 },
                    { x: 700, y: 35, scale: 0.6 },
                    { x: 900, y: 55, scale: 1.8 },
                    { x: 1100, y: 20, scale: 1.0 },
                    { x: 1300, y: 45, scale: 0.7 },
                    { x: 1500, y: 35, scale: 1.3 },
                    { x: 1700, y: 60, scale: 0.9 },
                    { x: 1900, y: 25, scale: 1.6 },
                    { x: 2100, y: 50, scale: 0.8 },
                    { x: 2300, y: 40, scale: 1.4 },
                    { x: 2500, y: 55, scale: 0.6 },
                    { x: 2700, y: 30, scale: 1.1 },
                    { x: 2900, y: 65, scale: 1.5 },
                    { x: 3100, y: 20, scale: 0.9 },
                    { x: 3300, y: 45, scale: 1.3 },
                    { x: 3500, y: 55, scale: 0.7 },
                    { x: 3800, y: 30, scale: 1.4 },
                    { x: 4100, y: 50, scale: 1.0 },
                    { x: 4400, y: 25, scale: 0.8 },
                    { x: 4700, y: 60, scale: 1.6 },
                    { x: 5000, y: 35, scale: 1.2 },
                    { x: 5300, y: 45, scale: 0.9 },
                    { x: 5600, y: 55, scale: 1.4 },
                    { x: 5900, y: 20, scale: 1.1 }
                ],
                hills: [],
                bushes: [],
                flowers: [
                    { x: 80, y: 544, scale: 1.5 },
                    { x: 5950, y: 544, scale: 1.5, tint: 0xFFFF44 },
                    { x: 6050, y: 544, scale: 1.2 }
                ]
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
            decorations: {
                clouds: [],
                hills: [],
                bushes: [],
                rocks: [
                    { x: 200, y: 544, scale: 0.8 },
                    { x: 600, y: 544, scale: 1.0 },
                    { x: 1000, y: 544, scale: 0.9 },
                    { x: 1400, y: 544, scale: 1.1 },
                    { x: 1800, y: 544, scale: 0.8 },
                    { x: 2200, y: 544, scale: 1.0 },
                    { x: 2600, y: 544, scale: 0.9 },
                    { x: 3000, y: 544, scale: 1.1 },
                    { x: 3400, y: 544, scale: 0.8 },
                    { x: 3800, y: 544, scale: 1.0 },
                    { x: 4200, y: 544, scale: 0.9 },
                    { x: 4600, y: 544, scale: 1.1 },
                    { x: 5000, y: 544, scale: 0.8 },
                    { x: 5400, y: 544, scale: 1.0 },
                    { x: 5800, y: 544, scale: 0.9 }
                ],
                fences: [
                    { x: 300, y: 544, scale: 1.0 },
                    { x: 332, y: 544, scale: 1.0 },
                    { x: 900, y: 544, scale: 1.0 },
                    { x: 932, y: 544, scale: 1.0 },
                    { x: 964, y: 544, scale: 1.0 },
                    { x: 1700, y: 544, scale: 1.0 },
                    { x: 1732, y: 544, scale: 1.0 },
                    { x: 2500, y: 544, scale: 1.0 },
                    { x: 2532, y: 544, scale: 1.0 },
                    { x: 3300, y: 544, scale: 1.0 },
                    { x: 3332, y: 544, scale: 1.0 },
                    { x: 3364, y: 544, scale: 1.0 }
                ]
            }
        };
    },

    // ==========================================
    // LEVEL 5 — BEACH (easy, lots of coins, few enemies)
    // ==========================================
    getLevel5Data: function () {
        var _ = 0;
        var map = [];
        for (var r = 0; r < 11; r++) map[r] = this.makeRow(200, _);

        // Row 11: coins above platforms
        map[11] = this.makeRow(200, _);
        map[11][20] = 50; map[11][21] = 50; map[11][22] = 50;
        map[11][65] = 50; map[11][66] = 50;
        map[11][100] = 50; map[11][101] = 50; map[11][102] = 50;
        map[11][140] = 50; map[11][141] = 50;

        // Row 12: floating platforms
        map[12] = this.makeRow(200, _);
        map[12][18] = 3; map[12][19] = 4; map[12][20] = 3; map[12][21] = 40; map[12][22] = 3; map[12][23] = 3;
        map[12][45] = 3; map[12][46] = 3; map[12][47] = 4; map[12][48] = 3;
        map[12][63] = 3; map[12][64] = 4; map[12][65] = 3; map[12][66] = 4; map[12][67] = 3;
        map[12][85] = 3; map[12][86] = 41; map[12][87] = 3;
        map[12][98] = 3; map[12][99] = 40; map[12][100] = 3; map[12][101] = 4; map[12][102] = 3;
        map[12][120] = 3; map[12][121] = 4; map[12][122] = 3;
        map[12][138] = 3; map[12][139] = 4; map[12][140] = 3; map[12][141] = 4; map[12][142] = 3;
        map[12][160] = 3; map[12][161] = 40; map[12][162] = 3;

        // Rows 13-16
        map[13] = this.makeRow(200, _);
        map[14] = this.makeRow(200, _);
        map[15] = this.makeRow(200, _);
        map[16] = this.makeRow(200, _);

        // Pipes
        map[15][35] = 6; map[15][36] = 7; map[16][35] = 8; map[16][36] = 9;
        map[15][80] = 6; map[15][81] = 7; map[16][80] = 8; map[16][81] = 9;
        map[15][130] = 6; map[15][131] = 7; map[16][130] = 8; map[16][131] = 9;

        // Ground with islands (gaps for water)
        map[17] = this.makeRow(200, 1);
        map[18] = this.makeRow(200, 2);
        // Water gaps
        var gaps = [[30,33], [55,58], [90,93], [125,128], [155,158]];
        for (var gi = 0; gi < gaps.length; gi++) {
            for (var gc = gaps[gi][0]; gc <= gaps[gi][1]; gc++) {
                map[17][gc] = _; map[18][gc] = _;
            }
        }
        // Safety bridges over gaps
        map[12][30] = 3; map[12][31] = 3; map[12][32] = 3; map[12][33] = 3;
        map[12][55] = 3; map[12][56] = 3; map[12][57] = 3; map[12][58] = 3;
        map[12][90] = 3; map[12][91] = 3; map[12][92] = 3; map[12][93] = 3;
        map[12][125] = 3; map[12][126] = 3; map[12][127] = 3; map[12][128] = 3;
        map[12][155] = 3; map[12][156] = 3; map[12][157] = 3; map[12][158] = 3;

        // Ensure flagpole area has ground
        for (var fc = 185; fc < 195; fc++) { map[17][fc] = 1; map[18][fc] = 2; }
        for (fc = 195; fc < 200; fc++) { map[17][fc] = _; map[18][fc] = _; }

        // Coins at ground level
        var coinCols = [8,9,10,11,12, 25,26,27, 40,41,42,43, 60,61,62, 75,76,77, 95,96,97, 110,111,112,113, 135,136,137, 150,151,152, 165,166,167,168];
        for (var cci = 0; cci < coinCols.length; cci++) {
            if (map[16][coinCols[cci]] === 0) map[16][coinCols[cci]] = 50;
        }

        // Enemies
        map[16][45] = 60; map[16][100] = 60; map[16][140] = 61;

        // Staircase near end
        map[16][175] = 11;
        map[16][176] = 11; map[15][176] = 11;
        map[16][177] = 11; map[15][177] = 11; map[14][177] = 11;
        map[16][178] = 11; map[15][178] = 11; map[14][178] = 11; map[13][178] = 11;
        map[16][179] = 11; map[15][179] = 11; map[14][179] = 11; map[13][179] = 11; map[12][179] = 11;

        // Flagpole
        map[5][190] = 70;

        var gY = 544;
        return {
            map: map,
            decorations: {
                clouds: [
                    {x:100,y:50,scale:1.2},{x:400,y:30,scale:0.8},{x:700,y:55,scale:1.0},
                    {x:1100,y:40,scale:0.7},{x:1500,y:60,scale:1.3},{x:1900,y:35,scale:0.9},
                    {x:2300,y:50,scale:1.1},{x:2800,y:25,scale:0.8},{x:3200,y:45,scale:1.0},
                    {x:3700,y:55,scale:0.7},{x:4200,y:30,scale:1.2},{x:4700,y:50,scale:0.9},
                    {x:5200,y:40,scale:1.1},{x:5700,y:60,scale:0.8},{x:6100,y:35,scale:1.0}
                ],
                hills: [
                    {x:150,y:gY,scale:1.0},{x:500,y:gY,scale:0.7},{x:900,y:gY,scale:1.3},
                    {x:1400,y:gY,scale:0.8},{x:1900,y:gY,scale:1.1},{x:2500,y:gY,scale:0.9},
                    {x:3100,y:gY,scale:1.2},{x:3700,y:gY,scale:0.7},{x:4300,y:gY,scale:1.0},
                    {x:4900,y:gY,scale:0.8},{x:5500,y:gY,scale:1.3},{x:6000,y:gY,scale:0.9}
                ],
                bushes: [
                    {x:200,y:gY,scale:1.0},{x:600,y:gY,scale:0.8},{x:1000,y:gY,scale:1.1},
                    {x:1600,y:gY,scale:0.9},{x:2200,y:gY,scale:1.0},{x:2800,y:gY,scale:0.8},
                    {x:3400,y:gY,scale:1.1},{x:4000,y:gY,scale:0.9},{x:4600,y:gY,scale:1.0},
                    {x:5200,y:gY,scale:0.8},{x:5800,y:gY,scale:1.1}
                ],
                flowers: [
                    {x:250,y:gY,scale:1.2},{x:550,y:gY,scale:1.0,tint:0xFF88FF},
                    {x:850,y:gY,scale:1.3},{x:1200,y:gY,scale:1.1,tint:0xFFFF44},
                    {x:1700,y:gY,scale:1.0},{x:2100,y:gY,scale:1.2,tint:0xFF88FF},
                    {x:2600,y:gY,scale:1.1},{x:3000,y:gY,scale:1.3,tint:0xFFFF44},
                    {x:3500,y:gY,scale:1.0},{x:4000,y:gY,scale:1.2},
                    {x:4500,y:gY,scale:1.1,tint:0xFF88FF},{x:5000,y:gY,scale:1.3},
                    {x:5500,y:gY,scale:1.0,tint:0xFFFF44},{x:5900,y:gY,scale:1.2}
                ],
                grass: [
                    {x:130,y:gY,scale:1.0},{x:350,y:gY,scale:0.8},{x:580,y:gY,scale:1.1},
                    {x:780,y:gY,scale:0.9},{x:1050,y:gY,scale:1.0},{x:1350,y:gY,scale:0.8},
                    {x:1600,y:gY,scale:1.2},{x:1850,y:gY,scale:1.0},{x:2100,y:gY,scale:0.9},
                    {x:2400,y:gY,scale:1.1},{x:2700,y:gY,scale:1.0},{x:3000,y:gY,scale:0.8},
                    {x:3300,y:gY,scale:1.2},{x:3600,y:gY,scale:1.0},{x:3900,y:gY,scale:0.9},
                    {x:4200,y:gY,scale:1.1},{x:4500,y:gY,scale:1.0},{x:4800,y:gY,scale:0.8},
                    {x:5100,y:gY,scale:1.2},{x:5400,y:gY,scale:1.0},{x:5700,y:gY,scale:0.9}
                ]
            }
        };
    },

    // ==========================================
    // LEVEL 6 — FOREST (medium difficulty, dense platforms)
    // ==========================================
    getLevel6Data: function () {
        var _ = 0;
        var map = [];
        for (var r = 0; r < 11; r++) map[r] = this.makeRow(200, _);

        // Row 11: coins
        map[11] = this.makeRow(200, _);
        map[11][25] = 50; map[11][26] = 50; map[11][27] = 50;
        map[11][50] = 50; map[11][51] = 50;
        map[11][75] = 50; map[11][76] = 50; map[11][77] = 50;
        map[11][105] = 50; map[11][106] = 50;
        map[11][135] = 50; map[11][136] = 50; map[11][137] = 50;
        map[11][160] = 50; map[11][161] = 50;

        // Row 12: dense platforms
        map[12] = this.makeRow(200, _);
        map[12][10] = 3; map[12][11] = 4; map[12][12] = 3;
        map[12][23] = 3; map[12][24] = 40; map[12][25] = 3; map[12][26] = 4; map[12][27] = 3; map[12][28] = 3;
        map[12][38] = 3; map[12][39] = 3; map[12][40] = 4; map[12][41] = 3;
        map[12][48] = 3; map[12][49] = 4; map[12][50] = 3; map[12][51] = 4; map[12][52] = 3;
        map[12][62] = 3; map[12][63] = 40; map[12][64] = 3;
        map[12][73] = 3; map[12][74] = 4; map[12][75] = 3; map[12][76] = 41; map[12][77] = 3; map[12][78] = 3;
        map[12][88] = 3; map[12][89] = 4; map[12][90] = 3;
        map[12][100] = 3; map[12][101] = 4; map[12][102] = 40; map[12][103] = 3;
        map[12][115] = 3; map[12][116] = 3; map[12][117] = 4; map[12][118] = 3;
        map[12][133] = 3; map[12][134] = 4; map[12][135] = 3; map[12][136] = 4; map[12][137] = 3;
        map[12][148] = 3; map[12][149] = 40; map[12][150] = 3;
        map[12][158] = 3; map[12][159] = 4; map[12][160] = 3; map[12][161] = 4; map[12][162] = 3;

        map[13] = this.makeRow(200, _);
        map[14] = this.makeRow(200, _);
        map[15] = this.makeRow(200, _);
        map[16] = this.makeRow(200, _);

        // Pipes
        map[15][20] = 6; map[15][21] = 7; map[16][20] = 8; map[16][21] = 9;
        map[14][55] = 6; map[14][56] = 7; map[15][55] = 8; map[15][56] = 9; map[16][55] = 8; map[16][56] = 9;
        map[15][95] = 6; map[15][96] = 7; map[16][95] = 8; map[16][96] = 9;
        map[15][145] = 6; map[15][146] = 7; map[16][145] = 8; map[16][146] = 9;

        // Ground
        map[17] = this.makeRow(200, 1);
        map[18] = this.makeRow(200, 2);
        // Small gaps
        map[17][42] = _; map[17][43] = _; map[17][44] = _;
        map[18][42] = _; map[18][43] = _; map[18][44] = _;
        map[17][110] = _; map[17][111] = _; map[17][112] = _;
        map[18][110] = _; map[18][111] = _; map[18][112] = _;
        // Safety bridges
        map[12][42] = 3; map[12][43] = 3; map[12][44] = 3;
        map[12][110] = 3; map[12][111] = 3; map[12][112] = 3;
        // Flagpole area
        for (var fc = 185; fc < 195; fc++) { map[17][fc] = 1; map[18][fc] = 2; }
        for (fc = 195; fc < 200; fc++) { map[17][fc] = _; map[18][fc] = _; }

        // Ground coins
        var coinCols = [5,6,7, 15,16,17,18, 30,31,32, 45,46,47, 60,61,62,63, 82,83,84, 100,101,102, 120,121,122, 140,141,142, 155,156,157, 165,166,167,168];
        for (var cci = 0; cci < coinCols.length; cci++) {
            if (map[16][coinCols[cci]] === 0) map[16][coinCols[cci]] = 50;
        }

        // Enemies
        map[16][30] = 60; map[16][65] = 60; map[16][90] = 61; map[16][130] = 60; map[16][160] = 61;

        // Staircase
        map[16][175] = 11;
        map[16][176] = 11; map[15][176] = 11;
        map[16][177] = 11; map[15][177] = 11; map[14][177] = 11;
        map[16][178] = 11; map[15][178] = 11; map[14][178] = 11; map[13][178] = 11;
        map[16][179] = 11; map[15][179] = 11; map[14][179] = 11; map[13][179] = 11; map[12][179] = 11;

        map[5][190] = 70;

        var gY = 544;
        return {
            map: map,
            decorations: {
                clouds: [],
                hills: [
                    {x:200,y:gY,scale:1.4},{x:600,y:gY,scale:1.0},{x:1000,y:gY,scale:1.6},
                    {x:1500,y:gY,scale:1.2},{x:2000,y:gY,scale:1.4},{x:2500,y:gY,scale:1.0},
                    {x:3000,y:gY,scale:1.6},{x:3500,y:gY,scale:1.2},{x:4000,y:gY,scale:1.4},
                    {x:4500,y:gY,scale:1.0},{x:5000,y:gY,scale:1.6},{x:5500,y:gY,scale:1.2},
                    {x:6000,y:gY,scale:1.4}
                ],
                bushes: [
                    {x:100,y:gY,scale:1.2},{x:300,y:gY,scale:0.9},{x:500,y:gY,scale:1.1},
                    {x:700,y:gY,scale:1.0},{x:900,y:gY,scale:1.3},{x:1200,y:gY,scale:0.8},
                    {x:1500,y:gY,scale:1.1},{x:1800,y:gY,scale:1.2},{x:2100,y:gY,scale:0.9},
                    {x:2400,y:gY,scale:1.0},{x:2700,y:gY,scale:1.3},{x:3000,y:gY,scale:0.8},
                    {x:3300,y:gY,scale:1.1},{x:3600,y:gY,scale:1.2},{x:3900,y:gY,scale:0.9},
                    {x:4200,y:gY,scale:1.0},{x:4500,y:gY,scale:1.3},{x:4800,y:gY,scale:0.8},
                    {x:5100,y:gY,scale:1.1},{x:5400,y:gY,scale:1.2},{x:5700,y:gY,scale:0.9}
                ],
                mushrooms: [
                    {x:250,y:gY,scale:1.1},{x:550,y:gY,scale:1.3},{x:850,y:gY,scale:0.9},
                    {x:1150,y:gY,scale:1.2},{x:1450,y:gY,scale:1.0},{x:1750,y:gY,scale:1.3},
                    {x:2050,y:gY,scale:0.9},{x:2350,y:gY,scale:1.1},{x:2650,y:gY,scale:1.2},
                    {x:2950,y:gY,scale:1.0},{x:3250,y:gY,scale:1.3},{x:3550,y:gY,scale:0.9},
                    {x:3850,y:gY,scale:1.1},{x:4150,y:gY,scale:1.2},{x:4450,y:gY,scale:1.0},
                    {x:4750,y:gY,scale:1.3},{x:5050,y:gY,scale:0.9},{x:5350,y:gY,scale:1.1},
                    {x:5650,y:gY,scale:1.2},{x:5950,y:gY,scale:1.0}
                ],
                flowers: [
                    {x:180,y:gY,scale:1.0},{x:450,y:gY,scale:1.2,tint:0xFF88FF},
                    {x:750,y:gY,scale:1.1},{x:1050,y:gY,scale:1.3,tint:0xFFFF44},
                    {x:1350,y:gY,scale:1.0},{x:1650,y:gY,scale:1.2,tint:0xFF88FF},
                    {x:1950,y:gY,scale:1.1},{x:2250,y:gY,scale:1.3},
                    {x:2550,y:gY,scale:1.0,tint:0xFFFF44},{x:2850,y:gY,scale:1.2},
                    {x:3150,y:gY,scale:1.1,tint:0xFF88FF},{x:3450,y:gY,scale:1.3},
                    {x:3750,y:gY,scale:1.0},{x:4050,y:gY,scale:1.2,tint:0xFFFF44},
                    {x:4350,y:gY,scale:1.1},{x:4650,y:gY,scale:1.3,tint:0xFF88FF},
                    {x:4950,y:gY,scale:1.0},{x:5250,y:gY,scale:1.2},
                    {x:5550,y:gY,scale:1.1,tint:0xFFFF44},{x:5850,y:gY,scale:1.3}
                ],
                grass: [
                    {x:150,y:gY,scale:1.0},{x:400,y:gY,scale:0.8},{x:650,y:gY,scale:1.1},
                    {x:900,y:gY,scale:0.9},{x:1100,y:gY,scale:1.0},{x:1400,y:gY,scale:0.8},
                    {x:1700,y:gY,scale:1.2},{x:2000,y:gY,scale:1.0},{x:2300,y:gY,scale:0.9},
                    {x:2600,y:gY,scale:1.1},{x:2900,y:gY,scale:1.0},{x:3200,y:gY,scale:0.8},
                    {x:3500,y:gY,scale:1.2},{x:3800,y:gY,scale:1.0},{x:4100,y:gY,scale:0.9},
                    {x:4400,y:gY,scale:1.1},{x:4700,y:gY,scale:1.0},{x:5000,y:gY,scale:0.8},
                    {x:5300,y:gY,scale:1.2},{x:5600,y:gY,scale:1.0},{x:5900,y:gY,scale:0.9}
                ]
            }
        };
    },

    // ==========================================
    // LEVEL 7 — DESERT (stone platforms, wider gaps, pyramids)
    // ==========================================
    getLevel7Data: function () {
        var _ = 0;
        var map = [];
        for (var r = 0; r < 11; r++) map[r] = this.makeRow(200, _);

        map[11] = this.makeRow(200, _);
        map[11][30] = 50; map[11][31] = 50;
        map[11][70] = 50; map[11][71] = 50; map[11][72] = 50;
        map[11][120] = 50; map[11][121] = 50;
        map[11][155] = 50; map[11][156] = 50;

        map[12] = this.makeRow(200, _);
        // Stone platforms
        map[12][15] = 11; map[12][16] = 11; map[12][17] = 11; map[12][18] = 4; map[12][19] = 11;
        map[12][28] = 11; map[12][29] = 40; map[12][30] = 11; map[12][31] = 11;
        map[12][45] = 11; map[12][46] = 11; map[12][47] = 4; map[12][48] = 11;
        map[12][60] = 11; map[12][61] = 11; map[12][62] = 11;
        map[12][68] = 11; map[12][69] = 4; map[12][70] = 11; map[12][71] = 41; map[12][72] = 11;
        map[12][85] = 11; map[12][86] = 40; map[12][87] = 11;
        map[12][100] = 11; map[12][101] = 4; map[12][102] = 11; map[12][103] = 11;
        map[12][118] = 11; map[12][119] = 11; map[12][120] = 4; map[12][121] = 11;
        map[12][135] = 11; map[12][136] = 40; map[12][137] = 11;
        map[12][153] = 11; map[12][154] = 4; map[12][155] = 11; map[12][156] = 4; map[12][157] = 11;

        map[13] = this.makeRow(200, _);
        map[14] = this.makeRow(200, _);
        map[15] = this.makeRow(200, _);
        map[16] = this.makeRow(200, _);

        // Ground
        map[17] = this.makeRow(200, 1);
        map[18] = this.makeRow(200, 2);
        // Wider gaps
        var gaps = [[38,42], [75,79], [108,112], [142,146]];
        for (var gi = 0; gi < gaps.length; gi++) {
            for (var gc = gaps[gi][0]; gc <= gaps[gi][1]; gc++) {
                map[17][gc] = _; map[18][gc] = _;
            }
        }
        // Safety bridges
        map[12][38] = 11; map[12][39] = 11; map[12][40] = 11; map[12][41] = 11; map[12][42] = 11;
        map[12][75] = 11; map[12][76] = 11; map[12][77] = 11; map[12][78] = 11; map[12][79] = 11;
        map[12][108] = 11; map[12][109] = 11; map[12][110] = 11; map[12][111] = 11; map[12][112] = 11;
        map[12][142] = 11; map[12][143] = 11; map[12][144] = 11; map[12][145] = 11; map[12][146] = 11;

        // Pyramidal staircases
        // Pyramid 1 at col 50-54
        map[16][50] = 11; map[16][51] = 11; map[16][52] = 11; map[16][53] = 11; map[16][54] = 11;
        map[15][51] = 11; map[15][52] = 11; map[15][53] = 11;
        map[14][52] = 11;
        // Pyramid 2 at col 92-96
        map[16][92] = 11; map[16][93] = 11; map[16][94] = 11; map[16][95] = 11; map[16][96] = 11;
        map[15][93] = 11; map[15][94] = 11; map[15][95] = 11;
        map[14][94] = 11;

        // Flagpole area
        for (var fc = 185; fc < 195; fc++) { map[17][fc] = 1; map[18][fc] = 2; }
        for (fc = 195; fc < 200; fc++) { map[17][fc] = _; map[18][fc] = _; }

        // End staircase
        map[16][175] = 11;
        map[16][176] = 11; map[15][176] = 11;
        map[16][177] = 11; map[15][177] = 11; map[14][177] = 11;
        map[16][178] = 11; map[15][178] = 11; map[14][178] = 11; map[13][178] = 11;
        map[16][179] = 11; map[15][179] = 11; map[14][179] = 11; map[13][179] = 11; map[12][179] = 11;

        // Ground coins
        var coinCols = [5,6,7,8, 22,23,24, 35,36,37, 55,56,57, 65,66,67, 83,84,85, 97,98,99, 115,116,117, 130,131,132, 148,149,150, 165,166,167,168];
        for (var cci = 0; cci < coinCols.length; cci++) {
            if (map[16][coinCols[cci]] === 0) map[16][coinCols[cci]] = 50;
        }

        // Enemies
        map[16][25] = 60; map[16][55] = 61; map[16][85] = 60; map[16][120] = 61; map[16][150] = 60;

        map[5][190] = 70;

        var gY = 544;
        return {
            map: map,
            decorations: {
                clouds: [
                    {x:200,y:50,scale:0.8},{x:500,y:30,scale:0.6},{x:900,y:55,scale:0.7},
                    {x:1400,y:35,scale:0.5},{x:2000,y:50,scale:0.8},{x:2600,y:40,scale:0.6},
                    {x:3200,y:55,scale:0.7},{x:3800,y:30,scale:0.5},{x:4400,y:50,scale:0.8},
                    {x:5000,y:35,scale:0.6},{x:5600,y:55,scale:0.7}
                ],
                hills: [],
                bushes: [],
                rocks: [
                    {x:200,y:gY,scale:1.0},{x:500,y:gY,scale:0.8},{x:800,y:gY,scale:1.2},
                    {x:1200,y:gY,scale:0.9},{x:1600,y:gY,scale:1.1},{x:2000,y:gY,scale:1.0},
                    {x:2400,y:gY,scale:0.8},{x:2800,y:gY,scale:1.2},{x:3200,y:gY,scale:0.9},
                    {x:3600,y:gY,scale:1.1},{x:4000,y:gY,scale:1.0},{x:4400,y:gY,scale:0.8},
                    {x:4800,y:gY,scale:1.2},{x:5200,y:gY,scale:0.9},{x:5600,y:gY,scale:1.1},
                    {x:6000,y:gY,scale:1.0}
                ],
                grass: [
                    {x:100,y:gY,scale:0.8},{x:350,y:gY,scale:1.0},{x:600,y:gY,scale:0.9},
                    {x:1000,y:gY,scale:1.1},{x:1500,y:gY,scale:0.8},{x:2000,y:gY,scale:1.0},
                    {x:2500,y:gY,scale:0.9},{x:3000,y:gY,scale:1.1},{x:3500,y:gY,scale:0.8},
                    {x:4000,y:gY,scale:1.0},{x:4500,y:gY,scale:0.9},{x:5000,y:gY,scale:1.1},
                    {x:5500,y:gY,scale:0.8},{x:6000,y:gY,scale:1.0}
                ]
            }
        };
    },

    // ==========================================
    // LEVEL 8 — SNOW (elevated sections, mix of enemies)
    // ==========================================
    getLevel8Data: function () {
        var _ = 0;
        var map = [];
        for (var r = 0; r < 11; r++) map[r] = this.makeRow(200, _);

        map[11] = this.makeRow(200, _);
        map[11][20] = 50; map[11][21] = 50;
        map[11][55] = 50; map[11][56] = 50; map[11][57] = 50;
        map[11][90] = 50; map[11][91] = 50;
        map[11][125] = 50; map[11][126] = 50; map[11][127] = 50;
        map[11][160] = 50; map[11][161] = 50;

        map[12] = this.makeRow(200, _);
        map[12][18] = 11; map[12][19] = 4; map[12][20] = 11; map[12][21] = 4; map[12][22] = 11;
        map[12][35] = 11; map[12][36] = 40; map[12][37] = 11;
        map[12][50] = 11; map[12][51] = 11; map[12][52] = 4; map[12][53] = 11;
        map[12][53] = 4; map[12][54] = 11; map[12][55] = 11; map[12][56] = 41; map[12][57] = 11;
        map[12][70] = 11; map[12][71] = 4; map[12][72] = 11;
        map[12][88] = 11; map[12][89] = 40; map[12][90] = 11; map[12][91] = 4; map[12][92] = 11;
        map[12][105] = 11; map[12][106] = 11; map[12][107] = 4; map[12][108] = 11;
        map[12][123] = 11; map[12][124] = 4; map[12][125] = 11; map[12][126] = 40; map[12][127] = 11;
        map[12][140] = 11; map[12][141] = 4; map[12][142] = 11;
        map[12][158] = 11; map[12][159] = 4; map[12][160] = 11; map[12][161] = 4; map[12][162] = 11;

        map[13] = this.makeRow(200, _);
        map[14] = this.makeRow(200, _);
        map[15] = this.makeRow(200, _);
        map[16] = this.makeRow(200, _);

        // Pipes
        map[15][30] = 6; map[15][31] = 7; map[16][30] = 8; map[16][31] = 9;
        map[14][65] = 6; map[14][66] = 7; map[15][65] = 8; map[15][66] = 9; map[16][65] = 8; map[16][66] = 9;
        map[15][115] = 6; map[15][116] = 7; map[16][115] = 8; map[16][116] = 9;
        map[15][155] = 6; map[15][156] = 7; map[16][155] = 8; map[16][156] = 9;

        // Ground with gaps
        map[17] = this.makeRow(200, 1);
        map[18] = this.makeRow(200, 2);
        var gaps = [[40,43], [80,83], [120,123], [148,151]];
        for (var gi = 0; gi < gaps.length; gi++) {
            for (var gc = gaps[gi][0]; gc <= gaps[gi][1]; gc++) {
                map[17][gc] = _; map[18][gc] = _;
            }
        }
        // Safety bridges
        map[12][40] = 11; map[12][41] = 11; map[12][42] = 11; map[12][43] = 11;
        map[12][80] = 11; map[12][81] = 11; map[12][82] = 11; map[12][83] = 11;
        map[12][120] = 11; map[12][121] = 11; map[12][122] = 11; map[12][123] = 11;
        map[12][148] = 11; map[12][149] = 11; map[12][150] = 11; map[12][151] = 11;

        // Flagpole area
        for (var fc = 185; fc < 195; fc++) { map[17][fc] = 1; map[18][fc] = 2; }
        for (fc = 195; fc < 200; fc++) { map[17][fc] = _; map[18][fc] = _; }

        // End staircase
        map[16][175] = 11;
        map[16][176] = 11; map[15][176] = 11;
        map[16][177] = 11; map[15][177] = 11; map[14][177] = 11;
        map[16][178] = 11; map[15][178] = 11; map[14][178] = 11; map[13][178] = 11;
        map[16][179] = 11; map[15][179] = 11; map[14][179] = 11; map[13][179] = 11; map[12][179] = 11;

        // Ground coins
        var coinCols = [5,6,7, 15,16,17, 33,34,35, 48,49,50, 68,69,70, 85,86,87, 100,101,102, 128,129,130, 140,141,142, 165,166,167,168];
        for (var cci = 0; cci < coinCols.length; cci++) {
            if (map[16][coinCols[cci]] === 0) map[16][coinCols[cci]] = 50;
        }

        // Enemies
        map[16][25] = 60; map[16][50] = 61; map[16][75] = 60; map[16][100] = 60; map[16][135] = 61; map[16][160] = 60;

        map[5][190] = 70;

        var gY = 544;
        return {
            map: map,
            decorations: {
                clouds: [
                    {x:100,y:50,scale:1.3},{x:350,y:30,scale:0.9},{x:600,y:55,scale:1.1},
                    {x:900,y:35,scale:0.7},{x:1200,y:50,scale:1.4},{x:1500,y:40,scale:0.8},
                    {x:1800,y:55,scale:1.0},{x:2200,y:30,scale:1.3},{x:2600,y:50,scale:0.9},
                    {x:3000,y:35,scale:1.1},{x:3400,y:55,scale:0.7},{x:3800,y:40,scale:1.4},
                    {x:4200,y:50,scale:0.8},{x:4600,y:30,scale:1.0},{x:5000,y:55,scale:1.3},
                    {x:5400,y:35,scale:0.9},{x:5800,y:50,scale:1.1},{x:6200,y:40,scale:0.7}
                ],
                hills: [
                    {x:200,y:gY,scale:1.0},{x:700,y:gY,scale:0.7},{x:1200,y:gY,scale:1.3},
                    {x:1800,y:gY,scale:0.9},{x:2400,y:gY,scale:1.1},{x:3000,y:gY,scale:0.8},
                    {x:3600,y:gY,scale:1.2},{x:4200,y:gY,scale:1.0},{x:4800,y:gY,scale:0.7},
                    {x:5400,y:gY,scale:1.3},{x:6000,y:gY,scale:0.9}
                ],
                bushes: [],
                rocks: [
                    {x:300,y:gY,scale:0.9},{x:800,y:gY,scale:1.1},{x:1300,y:gY,scale:0.8},
                    {x:1800,y:gY,scale:1.0},{x:2300,y:gY,scale:1.2},{x:2800,y:gY,scale:0.9},
                    {x:3300,y:gY,scale:1.1},{x:3800,y:gY,scale:0.8},{x:4300,y:gY,scale:1.0},
                    {x:4800,y:gY,scale:1.2},{x:5300,y:gY,scale:0.9},{x:5800,y:gY,scale:1.1}
                ]
            }
        };
    },

    // ==========================================
    // LEVEL 9 — VOLCANO (hardest, many enemies, lava pits)
    // ==========================================
    getLevel9Data: function () {
        var _ = 0;
        var map = [];

        // Ceiling (dark stone)
        map[0] = this.makeRow(200, 11);
        map[1] = this.makeRow(200, 11);

        for (var r = 2; r < 11; r++) map[r] = this.makeRow(200, _);

        map[11] = this.makeRow(200, _);
        map[11][25] = 50; map[11][26] = 50;
        map[11][55] = 50; map[11][56] = 50;
        map[11][85] = 50; map[11][86] = 50; map[11][87] = 50;
        map[11][115] = 50; map[11][116] = 50;
        map[11][145] = 50; map[11][146] = 50;

        map[12] = this.makeRow(200, _);
        // Platforms with power-ups
        map[12][10] = 11; map[12][11] = 4; map[12][12] = 11;
        map[12][23] = 11; map[12][24] = 40; map[12][25] = 11; map[12][26] = 4; map[12][27] = 11;
        map[12][40] = 11; map[12][41] = 4; map[12][42] = 11;
        map[12][53] = 11; map[12][54] = 4; map[12][55] = 11; map[12][56] = 41; map[12][57] = 11;
        map[12][68] = 11; map[12][69] = 40; map[12][70] = 11;
        map[12][83] = 11; map[12][84] = 4; map[12][85] = 11; map[12][86] = 4; map[12][87] = 11;
        map[12][100] = 11; map[12][101] = 40; map[12][102] = 11;
        map[12][113] = 11; map[12][114] = 4; map[12][115] = 11; map[12][116] = 4; map[12][117] = 11;
        map[12][130] = 11; map[12][131] = 4; map[12][132] = 11;
        map[12][143] = 11; map[12][144] = 40; map[12][145] = 11; map[12][146] = 4; map[12][147] = 11;
        map[12][160] = 11; map[12][161] = 41; map[12][162] = 11;

        map[13] = this.makeRow(200, _);
        map[14] = this.makeRow(200, _);
        map[15] = this.makeRow(200, _);
        map[16] = this.makeRow(200, _);

        // Ground (stone)
        map[17] = this.makeRow(200, 11);
        map[18] = this.makeRow(200, 11);

        // Many lava gaps
        var gaps = [[18,21], [32,35], [48,51], [62,65], [78,81], [95,98], [108,111], [125,128], [138,141], [152,155]];
        for (var gi = 0; gi < gaps.length; gi++) {
            for (var gc = gaps[gi][0]; gc <= gaps[gi][1]; gc++) {
                map[17][gc] = _; map[18][gc] = _;
            }
        }
        // Safety bridges over EVERY gap
        for (gi = 0; gi < gaps.length; gi++) {
            for (gc = gaps[gi][0]; gc <= gaps[gi][1]; gc++) {
                map[12][gc] = 11;
            }
        }

        // Flagpole area
        for (var fc = 185; fc < 195; fc++) { map[17][fc] = 11; map[18][fc] = 11; }
        for (fc = 195; fc < 200; fc++) { map[17][fc] = _; map[18][fc] = _; }

        // End staircase
        map[16][175] = 11;
        map[16][176] = 11; map[15][176] = 11;
        map[16][177] = 11; map[15][177] = 11; map[14][177] = 11;
        map[16][178] = 11; map[15][178] = 11; map[14][178] = 11; map[13][178] = 11;
        map[16][179] = 11; map[15][179] = 11; map[14][179] = 11; map[13][179] = 11; map[12][179] = 11;

        // Ground coins
        var coinCols = [5,6,7, 14,15,16, 25,26, 38,39, 53,54, 68,69, 84,85, 100,101, 114,115, 130,131, 145,146, 160,161, 165,166,167,168];
        for (var cci = 0; cci < coinCols.length; cci++) {
            if (map[16][coinCols[cci]] === 0) map[16][coinCols[cci]] = 50;
        }

        // Many enemies
        map[16][15] = 60; map[16][28] = 60; map[16][42] = 61; map[16][58] = 60; map[16][72] = 61;
        map[16][88] = 60; map[16][102] = 60; map[16][118] = 61; map[16][135] = 60; map[16][148] = 61; map[16][160] = 60;

        map[5][190] = 70;

        var gY = 544;
        return {
            map: map,
            decorations: {
                clouds: [],
                hills: [],
                bushes: [],
                rocks: [
                    {x:200,y:gY,scale:1.0},{x:500,y:gY,scale:0.8},{x:800,y:gY,scale:1.2},
                    {x:1100,y:gY,scale:0.9},{x:1400,y:gY,scale:1.1},{x:1700,y:gY,scale:1.0},
                    {x:2000,y:gY,scale:0.8},{x:2300,y:gY,scale:1.2},{x:2600,y:gY,scale:0.9},
                    {x:2900,y:gY,scale:1.1},{x:3200,y:gY,scale:1.0},{x:3500,y:gY,scale:0.8},
                    {x:3800,y:gY,scale:1.2},{x:4100,y:gY,scale:0.9},{x:4400,y:gY,scale:1.1},
                    {x:4700,y:gY,scale:1.0},{x:5000,y:gY,scale:0.8},{x:5300,y:gY,scale:1.2},
                    {x:5600,y:gY,scale:0.9},{x:5900,y:gY,scale:1.1}
                ],
                fences: [
                    {x:250,y:gY,scale:1.0},{x:282,y:gY,scale:1.0},
                    {x:750,y:gY,scale:1.0},{x:782,y:gY,scale:1.0},{x:814,y:gY,scale:1.0},
                    {x:1500,y:gY,scale:1.0},{x:1532,y:gY,scale:1.0},
                    {x:2200,y:gY,scale:1.0},{x:2232,y:gY,scale:1.0},{x:2264,y:gY,scale:1.0},
                    {x:3000,y:gY,scale:1.0},{x:3032,y:gY,scale:1.0},
                    {x:3800,y:gY,scale:1.0},{x:3832,y:gY,scale:1.0},{x:3864,y:gY,scale:1.0},
                    {x:4500,y:gY,scale:1.0},{x:4532,y:gY,scale:1.0},
                    {x:5200,y:gY,scale:1.0},{x:5232,y:gY,scale:1.0},{x:5264,y:gY,scale:1.0}
                ]
            }
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
