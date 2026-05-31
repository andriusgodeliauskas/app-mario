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
        this.isFire = false;        // Fire Mario — can shoot fireballs
        this.fireCooldown = 0;      // ms until next shot allowed
        this.isInvincible = false;
        this.isDead = false;
        this.levelComplete = false;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.wasOnGround = false;
        this.starPower = false;
        this.starTimer = 0;
        this.invincibleTimer = 0;
        // Award an extra life for every 100 coins. Seed the milestone from the
        // carried-over coin count so we don't re-award on level transitions.
        this.lifeMilestone = Math.floor(this.coins / 100);
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
        var WORLD_W = 9600;
        var WORLD_H = 600;
        var TILE = 32;
        var COLS = 300; // 9600 / 32 — levels are 50% longer than the original 200-col layout
        var ROWS = 19;  // 608 / 32 — we use 19 rows, bottom at y=608 but world is 600

        this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H + 64);

        // ----------------------------------
        // Sky background — per level
        // ----------------------------------
        var bgColors = {
            1: '#6B8CFF', 2: '#000000', 3: '#9494FF', 4: '#1A0A1E', 5: '#87CEEB',
            6: '#1A3A1A', 7: '#E8A050', 8: '#C0D8E8', 9: '#2A0808',
            10: '#1A1230', 11: '#0E3A1E', 12: '#2E86C1', 13: '#05050F', 14: '#FFB6E6'
        };
        this.cameras.main.setBackgroundColor(bgColors[this.currentLevel] || '#6B8CFF');

        // Per-level tile tint — gives new levels (10-14) a distinct themed look
        // without changing tile geometry/physics. Applied to ground (1/2) and
        // stone (11) tiles only; bricks/?-blocks/pipes stay original.
        var tileTint = { 10: 0x9aa0c0, 11: 0x7bc47b, 12: 0x9ad6ff, 13: 0xc8ccd8, 14: 0xffd6f2 };
        this._tileTint = tileTint[this.currentLevel] || null;

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
        var platformSpecs = [];
        var flagpolePos = null;

        var map = levelData.map;
        this.levelMap = map;   // retained for dev validation (window.validateLevelMap)
        for (var row = 0; row < map.length; row++) {
            for (var col = 0; col < map[row].length; col++) {
                var tileId = map[row][col];
                if (tileId === 0) continue;

                var tx = col * TILE + TILE / 2;
                var ty = row * TILE + TILE / 2;

                // Tile texture frames are 64x64 px. With setScale(0.5) the
                // sprite renders at 32x32 world. Body size is in TEXTURE pixels,
                // so to make the body match the visible 32x32 world block we
                // use setSize(64, 64) — body becomes 64*0.5 = 32 world.
                // (Previously: setSize(32,32) → 16x16 world body — half the
                //  visible size, which made hits hard to land.)
                var BODY = TILE * 2; // 64
                if (tileId === 1 || tileId === 2) {
                    // Ground tiles (grass top or earth)
                    var gt = this.groundTiles.create(tx, ty, 'tiles', tileId);
                    gt.setScale(0.5).setSize(TILE, TILE).refreshBody();
                    if (this._tileTint) gt.setTint(this._tileTint);
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
                } else if (tileId === 42) {
                    // Question block with fire flower
                    var qf = this.questionTiles.create(tx, ty, 'tiles', 4);
                    qf.setScale(0.5).setSize(TILE, TILE).refreshBody();
                    qf.tileType = 'question';
                    qf.isUsed = false;
                    qf.content = 'fireflower';
                } else if (tileId === 43) {
                    // Question block with 1-UP green mushroom
                    var q1 = this.questionTiles.create(tx, ty, 'tiles', 4);
                    q1.setScale(0.5).setSize(TILE, TILE).refreshBody();
                    q1.tileType = 'question';
                    q1.isUsed = false;
                    q1.content = '1up';
                } else if (tileId === 6 || tileId === 7 || tileId === 8 || tileId === 9) {
                    // Pipe tiles
                    var pt = this.pipeTiles.create(tx, ty, 'tiles', tileId);
                    pt.setScale(0.5).setSize(TILE, TILE).refreshBody();
                } else if (tileId === 11) {
                    // Stone platform
                    var st = this.groundTiles.create(tx, ty, 'tiles', 11);
                    st.setScale(0.5).setSize(TILE, TILE).refreshBody();
                    if (this._tileTint) st.setTint(this._tileTint);
                } else if (tileId === 50) {
                    // Coin spawn marker
                    coinPositions.push({ x: tx, y: ty });
                } else if (tileId === 60) {
                    // Goomba spawn
                    enemySpawns.push({ x: tx, y: ty, type: 'goomba' });
                } else if (tileId === 61) {
                    // Koopa spawn
                    enemySpawns.push({ x: tx, y: ty, type: 'koopa' });
                } else if (tileId === 12) {
                    // Horizontal moving platform marker
                    platformSpecs.push({ x: tx, y: ty, axis: 'h' });
                } else if (tileId === 13) {
                    // Vertical moving platform / moving pipe marker
                    platformSpecs.push({ x: tx, y: ty, axis: 'v' });
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

        // Fire flower power-ups (spawned from ? blocks) and Mario's fireballs
        this.fireflowers = this.physics.add.group();
        this.fireballs = this.physics.add.group();

        // 1-UP green mushrooms (extra lives)
        this.oneUps = this.physics.add.group();

        // Moving platforms / moving pipes (kinematic: no gravity, immovable)
        this.movingPlatforms = this.physics.add.group({ allowGravity: false, immovable: true });
        for (var pi = 0; pi < platformSpecs.length; pi++) {
            var spec = platformSpecs[pi];
            var plat = this.movingPlatforms.create(spec.x, spec.y, 'tiles', 11);
            plat.setScale(0.5).setSize(TILE, TILE).refreshBody();
            plat.body.setAllowGravity(false);
            plat.body.setImmovable(true);
            plat.setTint(0xE0A030);          // distinct golden platform look
            plat._axis = spec.axis;
            plat._home = { x: spec.x, y: spec.y };
            plat._range = 96;                // travel ±96px from home
            plat._dir = 1;
            plat._speed = 60;
            plat._prevX = spec.x;
            plat._prevY = spec.y;
            if (spec.axis === 'h') plat.body.setVelocityX(plat._speed);
            else plat.body.setVelocityY(plat._speed);
        }

        // ----------------------------------
        // Flagpole
        // ----------------------------------
        this.groundLevelY = (ROWS - 2) * TILE; // Ground tile top (544)

        if (flagpolePos) {
            var flagBaseY = this.groundLevelY;
            // Sprite is 384px tall with origin 0.5,0.5. Position so bottom of sprite
            // (the green base block) sits exactly on ground top — center = ground - half.
            this.flagpole = this.physics.add.sprite(flagpolePos.x, flagBaseY - 192, 'flagpole');
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
        this.physics.add.collider(this.fireflowers, this.groundTiles);
        this.physics.add.collider(this.fireflowers, this.pipeTiles);
        this.physics.add.collider(this.oneUps, this.groundTiles);
        this.physics.add.collider(this.oneUps, this.pipeTiles);
        this.physics.add.collider(this.player, this.movingPlatforms);
        this.physics.add.collider(this.enemies, this.movingPlatforms);
        // Fireballs bounce off the ground/pipes; enemy hit destroys them.
        this.physics.add.collider(this.fireballs, this.groundTiles);
        this.physics.add.collider(this.fireballs, this.pipeTiles);
        this.physics.add.collider(this.fireballs, this.brickTiles);
        this.physics.add.overlap(this.fireballs, this.enemies, this.fireballHitEnemy, null, this);

        // Overlaps
        this.physics.add.overlap(this.player, this.coinGroup, this.collectCoin, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.handleEnemyCollision, null, this);
        this.physics.add.overlap(this.player, this.mushrooms, this.collectMushroom, null, this);
        this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);
        this.physics.add.overlap(this.player, this.fireflowers, this.collectFireFlower, null, this);
        this.physics.add.overlap(this.player, this.oneUps, this.collectOneUp, null, this);
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
        this.keyFire = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

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
        var musicMap = { 1: 'overworld', 2: 'underground', 3: 'overworld', 4: 'castle', 5: 'overworld', 6: 'overworld', 7: 'underground', 8: 'overworld', 9: 'castle', 10: 'underground', 11: 'overworld', 12: 'overworld', 13: 'castle', 14: 'overworld' };
        if (window.AudioManager) AudioManager.startMusic(musicMap[this.currentLevel] || 'overworld');

        // ----------------------------------
        // Math challenge spawner — periodic in-level math problems
        // ----------------------------------
        // Defensive: tear down any leftover spawner from a previous scene instance
        if (this.mathSpawner) {
            this.mathSpawner.destroy();
            this.mathSpawner = null;
        }
        if (window.MathSpawner && window.MathSettings) {
            this.mathSettings = window.MathSettings.load();
            this.mathSpawner = new window.MathSpawner(this, this.mathSettings);
        }

        // Test hook for Playwright integration tests
        if (typeof window !== 'undefined') {
            window.__mario_test = window.__mario_test || {};
            window.__mario_test.scene = this;
        }
    },

    // ==========================================
    // CLEANUP — internal helper, called from playerDeath / reachFlagpole / quitGame.
    // (Does NOT override Phaser's `shutdown` lifecycle method, which we leave to Phaser.)
    // ==========================================
    cleanupMathSpawner: function () {
        if (this.mathSpawner) {
            this.mathSpawner.destroy();
            this.mathSpawner = null;
        }
    },

    // ==========================================
    // Scan all bricks and ?-blocks whose bottom is at Mario's head level and
    // horizontally overlap him; trigger their hit callbacks. Used as a
    // "head-bump rescue" so adjacent blocks all register when bumped together.
    // ==========================================
    _scanHeadBump: function (player) {
        var pTop = player.body.top;
        var pLeft = player.body.left;
        var pRight = player.body.right;

        function withinHorizontal(b) {
            return b.body && b.body.right > pLeft + 2 && b.body.left < pRight - 2;
        }
        function alignedAtHead(b) {
            return b.body && Math.abs(b.body.bottom - pTop) < 8;
        }

        if (this.brickTiles && this.brickTiles.children) {
            var bArr = this.brickTiles.children.entries;
            for (var i = 0; i < bArr.length; i++) {
                var br = bArr[i];
                if (br && !br._justHit && alignedAtHead(br) && withinHorizontal(br)) {
                    this.hitBrick(player, br);
                }
            }
        }
        if (this.questionTiles && this.questionTiles.children) {
            var qArr = this.questionTiles.children.entries;
            for (var j = 0; j < qArr.length; j++) {
                var qb = qArr[j];
                if (qb && !qb.isUsed && !qb._justHit && alignedAtHead(qb) && withinHorizontal(qb)) {
                    this.hitQuestion(player, qb);
                }
            }
        }
    },

    update: function (time, delta) {
        if (this.isDead || this.levelComplete) return;
        // Defensive: a stale update can fire after scene.start() before create()
        // re-instantiates the player. Skip until the new player is ready.
        if (!this.player || !this.player.body) return;

        // Math challenge spawner — runs every frame, decides when/where to spawn
        if (this.mathSpawner) this.mathSpawner.update(time, delta);

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
        // Shooting fireballs (Fire Mario)
        // ----------------------------------
        if (this.fireCooldown > 0) this.fireCooldown -= delta;
        var touchFire = (window.TouchController && window.TouchController.fireJustPressed);
        var firePressed = Phaser.Input.Keyboard.JustDown(this.keyFire) || touchFire;
        if (firePressed) {
            this.shootFireball();
        }
        window.Fireball.update(this, this.fireballs);

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
        // Head-bump rescue: when Mario's head touches a ceiling, scan for any
        // bricks / ?-blocks horizontally aligned with his head and trigger
        // their hit handlers manually. This catches the case where Mario hits
        // two adjacent blocks at once: Phaser separates one first and the
        // other never has overlap, so its collider callback never fires.
        if (player.body.touching.up && !this._headBumpProcessed) {
            this._headBumpProcessed = true;
            this._scanHeadBump(player);
        }
        if (!player.body.touching.up) {
            this._headBumpProcessed = false;
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
        var SHELL_SPEED = 280;
        for (var i = 0; i < enemies.length; i++) {
            var e = enemies[i];
            if (!e.active) continue;

            // Moving Koopa shell: bounce off walls, mow down other enemies.
            if (e.isShell && e.shellMoving) {
                if (e.body.blocked.left) { e.shellDir = 1; e.setFlipX(true); }
                else if (e.body.blocked.right) { e.shellDir = -1; e.setFlipX(false); }
                e.body.setVelocityX(e.shellDir * SHELL_SPEED);
                for (var s = 0; s < enemies.length; s++) {
                    var o = enemies[s];
                    if (o === e || !o.active || o.isShell || o.isSquished) continue;
                    if (Phaser.Geom.Intersects.RectangleToRectangle(e.body.getBounds(), o.body.getBounds())) {
                        this.squishEnemy(o, true);
                    }
                }
                continue;
            }

            if (e.isSquished) continue;

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
                this.applyMarioTint(); // restore fire tint if Mario is fire
            }
        }

        // ----------------------------------
        // Extra life every 100 coins
        // ----------------------------------
        var milestone = Math.floor(this.coins / 100);
        if (milestone > this.lifeMilestone) {
            this.lives += (milestone - this.lifeMilestone);
            this.lifeMilestone = milestone;
            this.registry.set('lives', this.lives);
            this.events.emit('livesChange', this.lives);
            if (window.AudioManager) AudioManager.play('oneUp');
            this.showFloatingText('1-UP!', 0x33DD55);
        }

        // ----------------------------------
        // Moving platforms
        // ----------------------------------
        this.updateMovingPlatforms(delta);

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
        // From-below detection — accept either the Phaser native flag OR a
        // position match (Mario's body top is at or just below the block's
        // body bottom). The position fallback catches the case where Mario
        // overlaps two adjacent blocks in the same row: Phaser separates one
        // first, after which the second has zero vertical overlap and its
        // touching.down never gets set, so center-y / touching alone misses
        // the hit.
        var alignedFromBelow = Math.abs(player.body.top - brick.body.bottom) < 8 &&
                               player.body.right > brick.body.left + 4 &&
                               player.body.left < brick.body.right - 4;
        if (!brick.body.touching.down && !alignedFromBelow) return;
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
        // See hitBrick — same touching.down + position fallback.
        var alignedFromBelow = Math.abs(player.body.top - block.body.bottom) < 8 &&
                               player.body.right > block.body.left + 4 &&
                               player.body.left < block.body.right - 4;
        if (!block.body.touching.down && !alignedFromBelow) return;
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
        } else if (block.content === 'fireflower') {
            // Spawn fire flower power-up (stays put, gentle hop on emerge)
            var flower = this.fireflowers.create(block.x, block.y - 32, 'fireflower');
            flower.setScale(0.25);
            flower.setBounce(0.2);
            flower.setVelocityX(0);
            flower.setVelocityY(-120);
            flower.setSize(112, 112);
            flower.setOffset(8, 8);
        } else if (block.content === '1up') {
            // Spawn a green 1-UP mushroom (mushroom texture, green tint)
            var oneUp = this.oneUps.create(block.x, block.y - 32, 'mushroom');
            oneUp.setScale(0.25);
            oneUp.play('mushroom-idle');
            oneUp.setTint(0x33DD55);
            oneUp.setBounce(0.2);
            oneUp.setVelocityX(80);
            oneUp.setSize(112, 112);
            oneUp.setOffset(8, 16);
        }
    },

    // ==========================================
    // COLLECT 1-UP (extra life)
    // ==========================================
    collectOneUp: function (player, oneUp) {
        oneUp.destroy();
        if (window.AudioManager) AudioManager.play('oneUp');
        this.lives += 1;
        this.registry.set('lives', this.lives);
        this.events.emit('livesChange', this.lives);
        this.showFloatingText('1-UP!', 0x33DD55);
    },

    // ==========================================
    // FLOATING TEXT — small reward popup above Mario
    // ==========================================
    showFloatingText: function (msg, color) {
        var t = this.add.text(this.player.x, this.player.y - 70, msg, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '16px',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(60);
        if (color !== undefined) t.setTint(color);
        this.tweens.add({
            targets: t, y: t.y - 40, alpha: 0, duration: 1000,
            ease: 'Cubic.Out', onComplete: function () { t.destroy(); }
        });
    },

    // ==========================================
    // MOVING PLATFORMS — reverse at range ends; carry a rider horizontally.
    // ==========================================
    updateMovingPlatforms: function (delta) {
        if (!this.movingPlatforms) return;
        var plats = this.movingPlatforms.getChildren();
        var player = this.player;
        for (var i = 0; i < plats.length; i++) {
            var p = plats[i];
            if (!p.active) continue;

            // Reverse direction at the ends of the travel range.
            if (p._axis === 'h') {
                if (p.x >= p._home.x + p._range && p._dir > 0) { p._dir = -1; p.body.setVelocityX(-p._speed); }
                else if (p.x <= p._home.x - p._range && p._dir < 0) { p._dir = 1; p.body.setVelocityX(p._speed); }
            } else {
                if (p.y >= p._home.y + p._range && p._dir > 0) { p._dir = -1; p.body.setVelocityY(-p._speed); }
                else if (p.y <= p._home.y - p._range && p._dir < 0) { p._dir = 1; p.body.setVelocityY(p._speed); }
            }

            // Carry the player when standing on top of this platform.
            var dx = p.x - p._prevX;
            var dy = p.y - p._prevY;
            if (player && player.body) {
                var onTop = player.body.bottom <= p.body.top + 12 &&
                            player.body.bottom >= p.body.top - 12 &&
                            player.body.right > p.body.left + 2 &&
                            player.body.left < p.body.right - 2 &&
                            player.body.velocity.y >= -10;
                if (onTop) {
                    player.x += dx;
                    if (dy < 0) player.y += dy; // ride a platform rising
                }
            }
            p._prevX = p.x;
            p._prevY = p.y;
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
    // COLLECT FIRE FLOWER (Power-up → Fire Mario)
    // ==========================================
    collectFireFlower: function (player, flower) {
        flower.destroy();
        if (window.AudioManager) AudioManager.play('powerup');
        this.score += 1000;
        this.registry.set('score', this.score);
        this.events.emit('scoreChange', this.score);

        // Fire flower always makes Mario big (if small) and grants fire power.
        if (!this.isBig) {
            this.isBig = true;
            player.setTexture('mario-big');
            player.setSize(96, 224);
            player.setOffset(16, 32);
            player.y -= 16;
            player.play('mario-big-idle');
        }
        this.isFire = true;
        this.applyMarioTint();
        this.showEnglishPopup('mushroom');
    },

    // Re-apply the warm fire tint when Mario is in fire state (unless star power
    // is currently overriding the tint with its rainbow flash).
    applyMarioTint: function () {
        if (!this.player) return;
        if (this.starPower) return;       // star flash handles tint
        if (this.isFire) {
            this.player.setTint(0xFFD9A0);
        } else {
            this.player.clearTint();
        }
    },

    // ==========================================
    // SHOOT FIREBALL (Fire Mario only)
    // ==========================================
    shootFireball: function () {
        if (!this.isFire || this.isDead || this.levelComplete) return;
        if (this.fireCooldown > 0) return;
        // Cap simultaneous fireballs so the screen stays readable.
        if (this.fireballs.countActive(true) >= 2) return;

        var dir = (this.player.flipX ? -1 : 1);
        var bx = this.player.x + dir * 24;
        var by = this.player.y - 8;
        window.Fireball.spawn(this, this.fireballs, bx, by, dir);
        this.fireCooldown = 350;
        if (window.AudioManager) AudioManager.play('fireShoot');
    },

    // Fireball destroys a normal enemy on contact (boss handled separately).
    fireballHitEnemy: function (fireball, enemy) {
        if (!enemy.active || enemy.isSquished) return;
        if (!fireball.active) return;
        if (enemy.isShell) return; // shells aren't damaged by fireballs
        window.Fireball.burst(this, fireball);
        this.squishEnemy(enemy, true);
        this.score += 100;
        this.registry.set('score', this.score);
        this.events.emit('scoreChange', this.score);
    },

    // ==========================================
    // ENEMY COLLISION
    // ==========================================
    handleEnemyCollision: function (player, enemy) {
        if (!enemy.active) return;
        var SHELL_SPEED = 280;

        // ----- Koopa shell interactions -----
        if (enemy.isShell) {
            if (enemy.shellMoving) {
                // A moving shell can be stomped to stop it; otherwise it hurts.
                var stompMoving = player.body.velocity.y > 0 &&
                                  (player.body.bottom - enemy.body.top) < 18;
                if (stompMoving) {
                    enemy.shellMoving = false;
                    enemy.shellDir = 0;
                    enemy.body.setVelocityX(0);
                    player.setVelocityY(-250);
                } else {
                    if (this.isInvincible || this.starPower) return;
                    this.playerHit();
                }
            } else {
                // Stationary shell — kick it away from the player (no damage).
                var kdir = (player.x < enemy.x) ? 1 : -1;
                enemy.shellMoving = true;
                enemy.shellDir = kdir;
                enemy.body.setVelocityX(kdir * SHELL_SPEED);
                enemy.setFlipX(kdir > 0);
                if (window.AudioManager) AudioManager.play('kick');
                player.setVelocityY(-150);
            }
            return;
        }

        if (enemy.isSquished) return;

        // Star power — kill enemy on contact
        if (this.starPower) {
            this.squishEnemy(enemy, true);
            return;
        }

        // Determine if stomping from above
        var playerBottom = player.body.y + player.body.height;
        var enemyTop = enemy.body.y;
        var isStomping = player.body.velocity.y > 0 && (playerBottom - enemyTop) < 16;

        if (isStomping) {
            // Stomp the enemy (Koopa becomes a kickable shell)
            this.squishEnemy(enemy);
            player.setVelocityY(-250);
        } else {
            // Player takes damage
            if (this.isInvincible) return;
            this.playerHit();
        }
    },

    // ==========================================
    // SQUISH ENEMY
    //   forceKill: when true, a Koopa is destroyed outright instead of
    //   turning into a shell (used by star power and fireballs).
    // ==========================================
    squishEnemy: function (enemy, forceKill) {
        if (window.AudioManager) AudioManager.play('stomp');
        enemy.isSquished = true;

        // Koopa → kickable shell (stays alive on the ground).
        if (enemy.enemyType === 'koopa' && !forceKill && !enemy.isShell) {
            enemy.isShell = true;
            enemy.shellMoving = false;
            enemy.shellDir = 0;
            enemy.body.setVelocity(0, 0);
            enemy.body.setAllowGravity(true);
            enemy.play('koopa-shell');
            this.score += 100;
            this.registry.set('score', this.score);
            this.events.emit('scoreChange', this.score);
            this.showEnglishPopup();
            return;
        }

        // Goomba (or force-killed enemy): disable and remove.
        enemy.body.setVelocity(0, 0);
        enemy.body.setAllowGravity(false);
        enemy.body.setEnable(false);
        if (enemy.enemyType === 'goomba') enemy.play('goomba-squish');
        else if (enemy.enemyType === 'koopa') enemy.play('koopa-shell');
        this.score += 100;
        this.registry.set('score', this.score);
        this.events.emit('scoreChange', this.score);
        this.showEnglishPopup();

        this.time.delayedCall(500, function () {
            if (enemy && enemy.active) enemy.destroy();
        });
    },

    // ==========================================
    // PLAYER HIT (take damage from enemy — preserves original behavior)
    // ==========================================
    playerHit: function () {
        this.loseOnePower({ source: 'enemy' });
    },

    // ==========================================
    // LOSE ONE POWER — shared damage handler.
    // All sources (enemy hits AND wrong math answers): big→small, small→death.
    // ==========================================
    loseOnePower: function (opts) {
        if (this.isInvincible || this.isDead) return;
        // Star power makes Mario immune to all damage including math mistakes
        if (this.starPower) return;
        opts = opts || {};

        if (this.isFire) {
            // Fire → big (lose only the fire power, stay big)
            if (window.AudioManager) AudioManager.play('bump');
            this.isFire = false;
            this.applyMarioTint();
            this.isInvincible = true;
            this.invincibleTimer = 2000;
            return;
        }

        if (this.isBig) {
            // Big → small
            if (window.AudioManager) AudioManager.play('bump');
            this.isBig = false;
            this.player.setTexture('mario');
            this.player.setSize(96, 120);
            this.player.setOffset(16, 8);
            this.player.play('mario-idle');
            this.isInvincible = true;
            this.invincibleTimer = 2000;
            return;
        }

        // Small Mario — death (loses a life)
        this.playerDeath();
    },

    // ==========================================
    // PLAYER DEATH
    // ==========================================
    playerDeath: function () {
        if (this.isDead) return;
        this.isDead = true;

        // Cleanup any active math challenge before scene restart
        if (this.mathSpawner) {
            this.mathSpawner.destroy();
            this.mathSpawner = null;
        }

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

        // Cleanup any active math challenge before WinScene
        if (this.mathSpawner) {
            this.mathSpawner.destroy();
            this.mathSpawner = null;
        }

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

        // New-level decorations (levels 10-14) — data-driven to avoid repetition.
        // Ground-standing types use origin (0.5,1); sky/background types float
        // with an origin of (0.5,0.5) and a parallax scrollFactor.
        var newDeco = {
            crystals:    { key: 'crystal-deco',      depth: -4,  origin: [0.5, 1] },
            stalactites: { key: 'stalactite-deco',   depth: -6,  origin: [0.5, 1] },
            vines:       { key: 'vine-deco',         depth: -6,  origin: [0.5, 1] },
            palms:       { key: 'palm-deco',         depth: -8,  origin: [0.5, 1] },
            leaves:      { key: 'leaf-deco',         depth: -4,  origin: [0.5, 1] },
            waves:       { key: 'wave-deco',         depth: -6,  origin: [0.5, 1] },
            corals:      { key: 'coral-deco',        depth: -6,  origin: [0.5, 1] },
            planks:      { key: 'plank-deco',        depth: -6,  origin: [0.5, 1] },
            planets:     { key: 'planet-deco',       depth: -10, origin: [0.5, 0.5], scroll: 0.3 },
            starfields:  { key: 'starfield-deco',    depth: -10, origin: [0.5, 0.5], scroll: 0.3 },
            rockets:     { key: 'rocket-deco',       depth: -9,  origin: [0.5, 0.5], scroll: 0.4 },
            rainbows:    { key: 'rainbow-arch-deco', depth: -8,  origin: [0.5, 1] },
            sparkles:    { key: 'sparkle-deco',      depth: -4,  origin: [0.5, 0.5] }
        };
        for (var key in newDeco) {
            if (!decorations[key]) continue;
            var cfg = newDeco[key];
            var list = decorations[key];
            for (var di = 0; di < list.length; di++) {
                var d = list[di];
                var img = this.add.image(d.x, d.y, cfg.key);
                img.setDepth(cfg.depth);
                img.setOrigin(cfg.origin[0], cfg.origin[1]);
                img.setScale((d.scale || 1) * 0.5);
                if (cfg.scroll) img.setScrollFactor(cfg.scroll);
                if (d.tint) img.setTint(d.tint);
            }
        }
    },

    // ==========================================
    // LEVEL DATA — hardcoded tilemaps
    // ==========================================
    getLevelData: function (level) {
        var fn = 'getLevel' + level + 'Data';
        var data = this[fn] ? this[fn]() : this.getLevel1Data();
        // Uniformly extend every level to 300 cols (50% longer than original).
        // The variant flag (set by some levels — currently level 1) drives which
        // filler pattern is added in the extended section.
        if (data && data.map) {
            this.extendMapTo300(data.map, data.variant || 'a');
        }
        return data;
    },

    // ==========================================
    // LEVEL 1 — GRASSLAND
    // Rotates through 4 variants (a/b/c/d) so a child replaying the level sees
    // a fresh layout each time. Variant choice is persisted in localStorage so
    // the rotation continues across page reloads.
    // ==========================================
    getLevel1Data: function () {
        var variants = ['a', 'b', 'c', 'd'];
        var key = 'app-mario:level1-variant-idx';
        var lastIdx = -1;
        try {
            var stored = (typeof localStorage !== 'undefined') ? localStorage.getItem(key) : null;
            if (stored !== null) lastIdx = parseInt(stored, 10);
            if (isNaN(lastIdx)) lastIdx = -1;
        } catch (e) {}
        var idx = (lastIdx + 1) % variants.length;
        try {
            if (typeof localStorage !== 'undefined') localStorage.setItem(key, String(idx));
        } catch (e) {}

        var variant = variants[idx];
        var data;
        if (variant === 'b') data = this._getLevel1BData();
        else if (variant === 'c') data = this._getLevel1CData();
        else if (variant === 'd') data = this._getLevel1DData();
        else data = this._getLevel1AData();

        data.variant = variant;
        return data;
    },

    // ==========================================
    // LEVEL 1A — original detailed layout (gentle introduction)
    // ==========================================
    _getLevel1AData: function () {
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
    // LEVEL 1B — pipe valley (more pipes, fewer enemies)
    // ==========================================
    _getLevel1BData: function () {
        var _ = 0;
        var map = [];
        var r;
        for (r = 0; r < 11; r++) map[r] = this.makeRow(200, _);

        // Coins above ground
        map[11] = this.makeRow(200, _);
        for (var c11 = 0; c11 < 200; c11 += 12) map[11][c11] = 50;

        // Sparse floating platforms
        map[12] = this.makeRow(200, _);
        var platCols = [22, 60, 100, 140, 175];
        for (var pp = 0; pp < platCols.length; pp++) {
            var pc = platCols[pp];
            map[12][pc] = 3; map[12][pc + 1] = 4; map[12][pc + 2] = 3;
        }

        map[13] = this.makeRow(200, _);
        map[14] = this.makeRow(200, _);
        map[15] = this.makeRow(200, _);
        map[16] = this.makeRow(200, _);

        // Lots of pipes — different heights for jumping practice
        var pipes = [
            { col: 30, height: 2 },
            { col: 55, height: 3 },
            { col: 80, height: 2 },
            { col: 110, height: 4 },
            { col: 130, height: 2 },
            { col: 160, height: 3 }
        ];
        for (var pi = 0; pi < pipes.length; pi++) {
            var p = pipes[pi];
            var topRow = 17 - p.height;
            map[topRow][p.col] = 6; map[topRow][p.col + 1] = 7;
            for (var br = topRow + 1; br < 17; br++) {
                map[br][p.col] = 8; map[br][p.col + 1] = 9;
            }
        }

        // Solid ground
        map[17] = this.makeRow(200, 1);
        map[18] = this.makeRow(200, 2);

        // One enemy only — gentle
        map[16][95] = 60;

        // Ground coins
        var groundCoins = [5, 6, 7, 40, 41, 42, 70, 71, 90, 91, 120, 121, 145, 146, 170, 171];
        for (var gc = 0; gc < groundCoins.length; gc++) {
            if (map[16][groundCoins[gc]] === 0) map[16][groundCoins[gc]] = 50;
        }

        map[5][190] = 70; // flagpole

        return {
            map: map,
            decorations: {
                clouds: [
                    { x: 200, y: 50, scale: 0.9 },
                    { x: 600, y: 30, scale: 0.7 },
                    { x: 1100, y: 60, scale: 1 },
                    { x: 1700, y: 40, scale: 0.8 },
                    { x: 2300, y: 55, scale: 1.1 },
                    { x: 2900, y: 35, scale: 0.9 },
                    { x: 3500, y: 50, scale: 0.7 },
                    { x: 4200, y: 65, scale: 1 },
                    { x: 4800, y: 40, scale: 0.8 },
                    { x: 5400, y: 55, scale: 0.9 }
                ],
                hills: [
                    { x: 300, y: 544, scale: 1, tint: 0x30A030 },
                    { x: 1500, y: 544, scale: 0.8, tint: 0x40B040 },
                    { x: 3000, y: 544, scale: 1.1, tint: 0x30A030 },
                    { x: 4500, y: 544, scale: 0.9, tint: 0x40B040 }
                ],
                bushes: [
                    { x: 500, y: 528, scale: 0.5 },
                    { x: 1200, y: 528, scale: 0.6 },
                    { x: 2200, y: 528, scale: 0.5 },
                    { x: 3300, y: 528, scale: 0.6 },
                    { x: 4400, y: 528, scale: 0.5 },
                    { x: 5400, y: 528, scale: 0.6 }
                ]
            }
        };
    },

    // ==========================================
    // LEVEL 1C — sky platforms (more jumping, climbing focus)
    // ==========================================
    _getLevel1CData: function () {
        var _ = 0;
        var map = [];
        var r;
        for (r = 0; r < 19; r++) map[r] = this.makeRow(200, _);

        // Coins on row 9 (high, reachable from upper platforms)
        for (var c9 = 20; c9 < 180; c9 += 8) map[9][c9] = 50;

        // Upper platforms at row 10
        var upperPlats = [
            [20, 23], [40, 43], [60, 63], [80, 83], [105, 108], [125, 128], [150, 153], [170, 173]
        ];
        for (var up = 0; up < upperPlats.length; up++) {
            for (var uc = upperPlats[up][0]; uc <= upperPlats[up][1]; uc++) {
                map[10][uc] = 3;
            }
        }

        // Mid platforms at row 12 — full bricks (for climbing)
        var midPlats = [
            [10, 14], [30, 33], [50, 53], [70, 73], [95, 98], [115, 119], [140, 144], [160, 165]
        ];
        for (var mp = 0; mp < midPlats.length; mp++) {
            for (var mc = midPlats[mp][0]; mc <= midPlats[mp][1]; mc++) {
                map[12][mc] = 3;
                if (mc === midPlats[mp][0] + 1) map[12][mc] = 4;
            }
        }

        // Ground
        map[17] = this.makeRow(200, 1);
        map[18] = this.makeRow(200, 2);

        // Two small gaps
        map[17][45] = _; map[17][46] = _;
        map[18][45] = _; map[18][46] = _;
        map[17][130] = _; map[17][131] = _;
        map[18][130] = _; map[18][131] = _;

        // Few ground coins
        var gCoins = [5, 6, 25, 26, 65, 66, 88, 89, 110, 111, 155, 156];
        for (var gc2 = 0; gc2 < gCoins.length; gc2++) {
            if (map[16][gCoins[gc2]] === 0) map[16][gCoins[gc2]] = 50;
        }

        // 2 Goombas
        map[16][35] = 60;
        map[16][120] = 60;

        map[5][190] = 70;

        return {
            map: map,
            decorations: {
                clouds: [
                    { x: 100, y: 30, scale: 1.2 },
                    { x: 400, y: 60, scale: 0.8 },
                    { x: 800, y: 25, scale: 1 },
                    { x: 1200, y: 55, scale: 0.9 },
                    { x: 1700, y: 35, scale: 1.1 },
                    { x: 2200, y: 50, scale: 0.7 },
                    { x: 2800, y: 30, scale: 1 },
                    { x: 3400, y: 55, scale: 0.8 },
                    { x: 4000, y: 40, scale: 1 },
                    { x: 4600, y: 35, scale: 0.9 },
                    { x: 5200, y: 60, scale: 1.1 },
                    { x: 5700, y: 25, scale: 0.8 }
                ],
                hills: [
                    { x: 600, y: 544, scale: 1.2, tint: 0x208020 },
                    { x: 2400, y: 544, scale: 0.9, tint: 0x30A030 },
                    { x: 4000, y: 544, scale: 1.1, tint: 0x208020 }
                ],
                bushes: []
            }
        };
    },

    // ==========================================
    // LEVEL 1D — ground march (mostly flat, lots of coins, friendly)
    // ==========================================
    _getLevel1DData: function () {
        var _ = 0;
        var map = [];
        var r;
        for (r = 0; r < 19; r++) map[r] = this.makeRow(200, _);

        // Coin trails on row 11
        for (var t1 = 10; t1 < 50; t1 += 2) map[11][t1] = 50;
        for (var t2 = 70; t2 < 110; t2 += 2) map[11][t2] = 50;
        for (var t3 = 130; t3 < 180; t3 += 2) map[11][t3] = 50;

        // Single ?-block clusters at row 12
        var clusterCols = [25, 65, 90, 125, 155];
        for (var ci = 0; ci < clusterCols.length; ci++) {
            var ccol = clusterCols[ci];
            map[12][ccol] = 4;
            map[12][ccol + 1] = 3;
            map[12][ccol + 2] = 4;
        }

        // Solid ground
        map[17] = this.makeRow(200, 1);
        map[18] = this.makeRow(200, 2);

        // Ground coins (many — friendly run)
        for (var dc = 5; dc < 195; dc += 3) {
            if (map[16][dc] === 0) map[16][dc] = 50;
        }

        // 2 small pipes (low jumping practice)
        map[15][45] = 6; map[15][46] = 7;
        map[16][45] = 8; map[16][46] = 9;
        map[15][140] = 6; map[15][141] = 7;
        map[16][140] = 8; map[16][141] = 9;

        // 2 Goombas
        map[16][70] = 60;
        map[16][115] = 60;

        // Mini-staircase near end
        map[16][168] = 11;
        map[16][169] = 11; map[15][169] = 11;
        map[16][170] = 11; map[15][170] = 11; map[14][170] = 11;
        map[16][171] = 11; map[15][171] = 11; map[14][171] = 11; map[13][171] = 11;

        map[5][190] = 70;

        return {
            map: map,
            decorations: {
                clouds: [
                    { x: 200, y: 40, scale: 0.9 },
                    { x: 700, y: 60, scale: 1.1 },
                    { x: 1400, y: 30, scale: 0.8 },
                    { x: 2100, y: 50, scale: 1 },
                    { x: 2900, y: 35, scale: 0.9 },
                    { x: 3700, y: 60, scale: 1.2 },
                    { x: 4500, y: 40, scale: 0.8 },
                    { x: 5300, y: 55, scale: 1 }
                ],
                hills: [
                    { x: 200, y: 544, scale: 1, tint: 0x30A030 },
                    { x: 1500, y: 544, scale: 1.1, tint: 0x40B040 },
                    { x: 2800, y: 544, scale: 0.9, tint: 0x30A030 },
                    { x: 4100, y: 544, scale: 1.2, tint: 0x40B040 },
                    { x: 5300, y: 544, scale: 1, tint: 0x30A030 }
                ],
                bushes: [
                    { x: 400, y: 528, scale: 0.5 },
                    { x: 900, y: 528, scale: 0.6 },
                    { x: 1700, y: 528, scale: 0.5 },
                    { x: 2400, y: 528, scale: 0.6 },
                    { x: 3200, y: 528, scale: 0.5 },
                    { x: 4000, y: 528, scale: 0.6 },
                    { x: 4800, y: 528, scale: 0.5 },
                    { x: 5500, y: 528, scale: 0.6 }
                ]
            }
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
    // LEVEL 10 — CAVE (vertical climbing, narrow ledges, small pits)
    // ==========================================
    getLevel10Data: function () {
        var _ = 0;
        var map = [];
        map[0] = this.makeRow(200, 11);   // stone ceiling
        map[1] = this.makeRow(200, 11);
        for (var r = 2; r < 17; r++) map[r] = this.makeRow(200, _);
        map[17] = this.makeRow(200, 11);  // stone ground
        map[18] = this.makeRow(200, 11);

        // Narrow stone ledges at varying heights [col, row, width] — optional climb for coins
        var ledges = [
            [14, 15, 3], [20, 13, 3], [27, 11, 3], [34, 13, 3], [41, 15, 3],
            [50, 14, 2], [56, 12, 2], [62, 10, 3], [70, 12, 2], [76, 14, 3],
            [86, 15, 3], [92, 13, 2], [98, 11, 3], [106, 13, 2], [112, 15, 3],
            [122, 14, 3], [129, 12, 3], [137, 10, 3], [145, 12, 2], [152, 14, 3],
            [162, 15, 3], [169, 13, 3], [176, 15, 3]
        ];
        for (var i = 0; i < ledges.length; i++) {
            for (var c = ledges[i][0]; c < ledges[i][0] + ledges[i][2]; c++) map[ledges[i][1]][c] = 11;
        }

        // Small ground pits (3 wide) — jumpable
        var pits = [[24, 26], [44, 46], [80, 82], [116, 118], [156, 158]];
        for (var p = 0; p < pits.length; p++) {
            for (var gc = pits[p][0]; gc <= pits[p][1]; gc++) { map[17][gc] = _; map[18][gc] = _; }
        }

        // Power-up blocks tucked into ledges
        map[11][28] = 40;   // mushroom
        map[10][63] = 41;   // star
        map[10][137] = 4;   // coin block

        // Coins
        var coins = [6, 7, 8, 15, 16, 21, 28, 29, 57, 63, 64, 93, 99, 100, 130, 138, 139, 170, 171, 182, 183, 184];
        for (var ci = 0; ci < coins.length; ci++) { if (map[16][coins[ci]] === _) map[16][coins[ci]] = 50; }

        // Enemies (~12) on ground, away from pits & spawn
        var en = [[18, 60], [33, 61], [48, 60], [60, 60], [72, 61], [88, 60], [104, 61], [120, 60], [134, 61], [148, 60], [164, 61], [178, 60]];
        for (var e = 0; e < en.length; e++) map[16][en[e][0]] = en[e][1];

        // Flagpole + solid run-up
        map[5][190] = 70;
        for (var fc = 180; fc < 200; fc++) { map[17][fc] = 11; map[18][fc] = 11; }

        var gY = 544;
        return {
            map: map,
            decorations: {
                crystals: [
                    { x: 160, y: gY, scale: 1.0 }, { x: 600, y: gY, scale: 0.8 }, { x: 1100, y: gY, scale: 1.2 },
                    { x: 1700, y: gY, scale: 0.9 }, { x: 2300, y: gY, scale: 1.1 }, { x: 2900, y: gY, scale: 1.0 },
                    { x: 3500, y: gY, scale: 1.2 }, { x: 4200, y: gY, scale: 0.9 }, { x: 4900, y: gY, scale: 1.1 }
                ],
                stalactites: [
                    { x: 400, y: gY, scale: 1.0 }, { x: 900, y: gY, scale: 0.8 }, { x: 1500, y: gY, scale: 1.1 },
                    { x: 2100, y: gY, scale: 0.9 }, { x: 2700, y: gY, scale: 1.0 }, { x: 3300, y: gY, scale: 1.2 },
                    { x: 4000, y: gY, scale: 0.9 }, { x: 4700, y: gY, scale: 1.0 }
                ]
            }
        };
    },

    // ==========================================
    // LEVEL 11 — JUNGLE (dense enemies + platform-hopping)
    // ==========================================
    getLevel11Data: function () {
        var _ = 0;
        var map = [];
        for (var r = 0; r < 17; r++) map[r] = this.makeRow(200, _);
        map[17] = this.makeRow(200, 1);
        map[18] = this.makeRow(200, 2);

        // Floating platforms [col, row, width, tile]
        var plats = [
            [16, 12, 3, 3], [22, 12, 1, 4], [30, 11, 3, 3], [44, 13, 3, 3], [52, 12, 3, 3],
            [64, 11, 3, 3], [72, 13, 1, 4], [84, 12, 3, 3], [96, 11, 3, 3], [108, 13, 3, 3],
            [120, 12, 3, 3], [140, 12, 3, 3], [152, 13, 3, 3], [164, 12, 3, 3], [172, 11, 3, 3]
        ];
        for (var i = 0; i < plats.length; i++) {
            for (var c = plats[i][0]; c < plats[i][0] + plats[i][2]; c++) map[plats[i][1]][c] = plats[i][3];
        }

        // Pits — small, with stepping stones over the wider ones
        var pits = [[26, 28], [58, 60], [78, 81], [100, 102], [124, 127], [146, 148], [166, 168]];
        for (var p = 0; p < pits.length; p++) {
            for (var gc = pits[p][0]; gc <= pits[p][1]; gc++) { map[17][gc] = _; map[18][gc] = _; }
        }
        map[14][79] = 11; map[14][80] = 11;     // bridge over 78-81
        map[14][125] = 11; map[14][126] = 11;   // bridge over 124-127

        // Power-ups
        map[11][30] = 40; map[10][64] = 41;

        // Coins
        var coins = [6, 7, 8, 17, 18, 31, 32, 45, 53, 65, 85, 97, 109, 121, 141, 153, 165, 173, 183, 184, 185];
        for (var ci = 0; ci < coins.length; ci++) { if (map[16][coins[ci]] === _) map[16][coins[ci]] = 50; }

        // Enemies (~15)
        var en = [[14, 60], [24, 61], [34, 60], [42, 60], [50, 61], [62, 60], [70, 61], [88, 60], [98, 60], [110, 61], [122, 60], [138, 61], [150, 60], [162, 61], [176, 60]];
        for (var e = 0; e < en.length; e++) map[16][en[e][0]] = en[e][1];

        map[5][190] = 70;
        for (var fc = 180; fc < 200; fc++) { map[17][fc] = 1; map[18][fc] = 2; }

        var gY = 544;
        return {
            map: map,
            decorations: {
                palms: [
                    { x: 200, y: gY, scale: 1.1 }, { x: 700, y: gY, scale: 0.9 }, { x: 1300, y: gY, scale: 1.2 },
                    { x: 1900, y: gY, scale: 1.0 }, { x: 2500, y: gY, scale: 1.1 }, { x: 3100, y: gY, scale: 0.9 },
                    { x: 3700, y: gY, scale: 1.2 }, { x: 4300, y: gY, scale: 1.0 }, { x: 4900, y: gY, scale: 1.1 }
                ],
                vines: [
                    { x: 400, y: gY, scale: 1.0 }, { x: 1000, y: gY, scale: 0.9 }, { x: 1600, y: gY, scale: 1.1 },
                    { x: 2200, y: gY, scale: 1.0 }, { x: 2800, y: gY, scale: 0.9 }, { x: 3400, y: gY, scale: 1.1 },
                    { x: 4000, y: gY, scale: 1.0 }, { x: 4600, y: gY, scale: 0.9 }
                ],
                leaves: [
                    { x: 300, y: gY, scale: 1.0 }, { x: 900, y: gY, scale: 1.1 }, { x: 1500, y: gY, scale: 0.9 },
                    { x: 2100, y: gY, scale: 1.0 }, { x: 2700, y: gY, scale: 1.1 }, { x: 3300, y: gY, scale: 0.9 },
                    { x: 3900, y: gY, scale: 1.0 }, { x: 4500, y: gY, scale: 1.1 }
                ]
            }
        };
    },

    // ==========================================
    // LEVEL 12 — OCEAN (wide water gaps, stepping stones)
    // ==========================================
    getLevel12Data: function () {
        var _ = 0;
        var map = [];
        for (var r = 0; r < 17; r++) map[r] = this.makeRow(200, _);
        map[17] = this.makeRow(200, 1);
        map[18] = this.makeRow(200, 2);

        // Water gaps with stone stepping stones poking out (row 16, every 2 cols)
        var gaps = [[24, 28], [40, 45], [58, 62], [76, 81], [94, 99], [112, 116], [130, 135], [148, 153], [166, 170]];
        for (var i = 0; i < gaps.length; i++) {
            var g = gaps[i];
            for (var c = g[0]; c <= g[1]; c++) { map[17][c] = _; map[18][c] = _; }
            for (var s = g[0] + 1; s < g[1]; s += 2) map[16][s] = 11;
        }

        // Power-ups on safe segments
        map[12][34] = 40; map[12][104] = 41; map[12][160] = 4;

        // Coins
        var coins = [6, 7, 8, 33, 51, 52, 68, 69, 86, 87, 103, 122, 123, 140, 141, 158, 159, 182, 183, 184];
        for (var ci = 0; ci < coins.length; ci++) { if (map[16][coins[ci]] === _) map[16][coins[ci]] = 50; }

        // Enemies (~15) on solid segments
        var en = [[15, 60], [33, 61], [36, 60], [50, 60], [68, 61], [72, 61], [86, 60], [103, 61], [108, 60], [120, 60], [122, 60], [140, 61], [144, 60], [158, 60], [175, 61]];
        for (var e = 0; e < en.length; e++) map[16][en[e][0]] = en[e][1];

        map[5][190] = 70;
        for (var fc = 178; fc < 200; fc++) { map[17][fc] = 1; map[18][fc] = 2; }

        var gY = 544;
        return {
            map: map,
            decorations: {
                waves: [
                    { x: 800, y: gY, scale: 1.2 }, { x: 1300, y: gY, scale: 1.0 }, { x: 1900, y: gY, scale: 1.1 },
                    { x: 2500, y: gY, scale: 1.2 }, { x: 3100, y: gY, scale: 1.0 }, { x: 3800, y: gY, scale: 1.1 },
                    { x: 4400, y: gY, scale: 1.2 }, { x: 5000, y: gY, scale: 1.0 }
                ],
                corals: [
                    { x: 300, y: gY, scale: 1.0 }, { x: 1100, y: gY, scale: 0.9 }, { x: 1700, y: gY, scale: 1.1 },
                    { x: 2300, y: gY, scale: 1.0 }, { x: 2900, y: gY, scale: 0.9 }, { x: 3500, y: gY, scale: 1.1 },
                    { x: 4100, y: gY, scale: 1.0 }, { x: 4700, y: gY, scale: 0.9 }
                ],
                planks: [
                    { x: 600, y: gY, scale: 1.0 }, { x: 1500, y: gY, scale: 1.0 }, { x: 2100, y: gY, scale: 1.0 },
                    { x: 2700, y: gY, scale: 1.0 }, { x: 3300, y: gY, scale: 1.0 }, { x: 4000, y: gY, scale: 1.0 },
                    { x: 4600, y: gY, scale: 1.0 }
                ]
            }
        };
    },

    // ==========================================
    // LEVEL 13 — SPACE (precision over voids, narrow platforms)
    // ==========================================
    getLevel13Data: function () {
        var _ = 0;
        var map = [];
        for (var r = 0; r < 17; r++) map[r] = this.makeRow(200, _);
        map[17] = this.makeRow(200, 11);  // stone ground
        map[18] = this.makeRow(200, 11);

        // Frequent pits; the 4-wide ones get stepping stones at row 16
        var pits = [[20, 22], [30, 32], [42, 45], [54, 56], [66, 69], [78, 80], [90, 93], [102, 104], [114, 117], [126, 128], [138, 141], [150, 152], [162, 165]];
        for (var i = 0; i < pits.length; i++) {
            var g = pits[i];
            for (var c = g[0]; c <= g[1]; c++) { map[17][c] = _; map[18][c] = _; }
            if (g[1] - g[0] >= 3) { map[16][g[0] + 1] = 11; map[16][g[1] - 1] = 11; }
        }

        // Narrow floating platforms (precision hops for coins)
        var plats = [[24, 13, 2], [36, 12, 1], [48, 13, 2], [60, 12, 1], [72, 13, 2], [84, 12, 1], [96, 13, 2], [108, 12, 1], [120, 13, 2], [132, 12, 1], [144, 13, 2], [156, 12, 1], [168, 13, 2]];
        for (var j = 0; j < plats.length; j++) {
            for (var c2 = plats[j][0]; c2 < plats[j][0] + plats[j][2]; c2++) map[plats[j][1]][c2] = 11;
            map[plats[j][1] - 1][plats[j][0]] = 50;   // coin above each
        }

        // Power-ups
        map[12][24] = 40; map[11][96] = 41;

        // Enemies (~17)
        var en = [[16, 60], [26, 61], [38, 60], [50, 61], [58, 60], [64, 60], [74, 61], [86, 60], [96, 61], [108, 60], [110, 60], [120, 61], [132, 60], [144, 61], [156, 60], [168, 61], [176, 60]];
        for (var e = 0; e < en.length; e++) map[16][en[e][0]] = en[e][1];

        map[5][190] = 70;
        for (var fc = 178; fc < 200; fc++) { map[17][fc] = 11; map[18][fc] = 11; }

        return {
            map: map,
            decorations: {
                planets: [
                    { x: 300, y: 120, scale: 1.2 }, { x: 1200, y: 90, scale: 0.9 }, { x: 2400, y: 140, scale: 1.1 },
                    { x: 3600, y: 100, scale: 1.0 }, { x: 4800, y: 130, scale: 1.2 }
                ],
                starfields: [
                    { x: 150, y: 80, scale: 1.0 }, { x: 800, y: 60, scale: 0.9 }, { x: 1600, y: 100, scale: 1.1 },
                    { x: 2200, y: 70, scale: 1.0 }, { x: 3000, y: 90, scale: 0.9 }, { x: 3800, y: 60, scale: 1.1 },
                    { x: 4400, y: 100, scale: 1.0 }, { x: 5200, y: 80, scale: 1.0 }
                ],
                rockets: [
                    { x: 600, y: 160, scale: 1.0 }, { x: 2000, y: 130, scale: 1.1 }, { x: 3400, y: 150, scale: 0.9 },
                    { x: 4600, y: 140, scale: 1.0 }
                ]
            }
        };
    },

    // ==========================================
    // LEVEL 14 — RAINBOW (finale — climbs + gaps + narrow platforms)
    // ==========================================
    getLevel14Data: function () {
        var _ = 0;
        var map = [];
        for (var r = 0; r < 17; r++) map[r] = this.makeRow(200, _);
        map[17] = this.makeRow(200, 1);
        map[18] = this.makeRow(200, 2);

        // Early: climbing ledges
        var ledges = [[12, 15, 3], [18, 13, 3], [24, 11, 3], [30, 13, 3], [36, 15, 3]];
        for (var i = 0; i < ledges.length; i++) {
            for (var c = ledges[i][0]; c < ledges[i][0] + ledges[i][2]; c++) map[ledges[i][1]][c] = 11;
        }

        // Mid: gaps with stepping stones
        var gaps = [[48, 52], [62, 66], [76, 80], [90, 95], [104, 108], [118, 122]];
        for (var g = 0; g < gaps.length; g++) {
            var G = gaps[g];
            for (var c2 = G[0]; c2 <= G[1]; c2++) { map[17][c2] = _; map[18][c2] = _; }
            for (var s = G[0] + 1; s < G[1]; s += 2) map[16][s] = 11;
        }

        // Late: narrow platforms
        var plats = [[132, 13, 2], [140, 12, 2], [150, 13, 2], [160, 12, 2], [170, 14, 3]];
        for (var j = 0; j < plats.length; j++) {
            for (var c3 = plats[j][0]; c3 < plats[j][0] + plats[j][2]; c3++) map[plats[j][1]][c3] = 11;
        }

        // Power-ups for the finale
        map[11][25] = 40; map[12][84] = 41; map[11][155] = 40; map[12][165] = 4;

        // Generous coins
        var coins = [6, 7, 8, 13, 14, 19, 20, 31, 49, 51, 63, 65, 77, 79, 91, 93, 105, 107, 119, 133, 141, 151, 161, 171, 182, 183, 184, 185, 186];
        for (var ci = 0; ci < coins.length; ci++) { if (map[16][coins[ci]] === _) map[16][coins[ci]] = 50; }

        // Enemies (~18)
        var en = [[14, 60], [22, 61], [30, 60], [40, 61], [44, 60], [56, 61], [68, 60], [72, 60], [84, 61], [98, 60], [112, 61], [116, 60], [126, 61], [136, 60], [146, 61], [156, 60], [164, 61], [176, 60]];
        for (var e = 0; e < en.length; e++) map[16][en[e][0]] = en[e][1];

        map[5][190] = 70;
        for (var fc = 178; fc < 200; fc++) { map[17][fc] = 1; map[18][fc] = 2; }

        return {
            map: map,
            decorations: {
                rainbows: [
                    { x: 500, y: 544, scale: 1.2 }, { x: 1500, y: 544, scale: 1.0 }, { x: 2600, y: 544, scale: 1.1 },
                    { x: 3700, y: 544, scale: 1.0 }, { x: 4800, y: 544, scale: 1.2 }
                ],
                sparkles: [
                    { x: 200, y: 120, scale: 1.0 }, { x: 700, y: 90, scale: 0.8 }, { x: 1100, y: 140, scale: 1.1 },
                    { x: 1800, y: 80, scale: 1.0 }, { x: 2300, y: 120, scale: 0.9 }, { x: 2900, y: 100, scale: 1.1 },
                    { x: 3400, y: 90, scale: 1.0 }, { x: 4000, y: 130, scale: 0.9 }, { x: 4500, y: 100, scale: 1.1 },
                    { x: 5100, y: 90, scale: 1.0 }
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
    },

    // ==========================================
    // HELPER: pad an existing 200-col map out to 300 cols.
    // Each level was originally authored for 200 cols + flagpole at col 190.
    // We extend them uniformly: relocate the flagpole to col 290 and fill the
    // 200-289 stretch with fresh content (pipes, gaps, enemies, coins) so the
    // last third feels like more level rather than dead air.
    //
    // The variant param ('a', 'b', 'c'…) lets us produce different filler
    // patterns from the same level data, so kids replaying level 1 see
    // different challenges in the extended section even if the first half is
    // identical (or nearly so).
    // ==========================================
    extendMapTo300: function (map, variant) {
        var _ = 0;
        variant = variant || 'a';
        var TARGET_COLS = 300;
        var origCols = (map[0] && map[0].length) || 200;

        // Pad each row to TARGET_COLS, filling with the row's natural background
        for (var r = 0; r < map.length; r++) {
            var row = map[r];
            var fillTile = _;
            if (r === 17) fillTile = 1;       // grass continues
            else if (r === 18) fillTile = 2;  // earth continues
            while (row.length < TARGET_COLS) {
                row.push(fillTile);
            }
        }

        // Find and relocate flagpole. Old position was around col 190; new is col 290.
        for (var rr = 0; rr < map.length; rr++) {
            for (var cc = 0; cc < map[rr].length; cc++) {
                if (map[rr][cc] === 70) {
                    map[rr][cc] = _;
                    map[5][290] = 70;
                    break;
                }
            }
        }

        // Make sure ground exists under and around the new flagpole
        for (var fc = 280; fc < 298; fc++) {
            if (map[17]) map[17][fc] = 1;
            if (map[18]) map[18][fc] = 2;
        }

        // Add filler content in cols 200-285. Patterns vary by variant so
        // replays differ slightly.
        var sectionStart = origCols;
        var sectionEnd = 285;
        this._addExtensionContent(map, sectionStart, sectionEnd, variant);

        return map;
    },

    _addExtensionContent: function (map, startCol, endCol, variant) {
        // Pipes — placed at offsets that vary by variant
        var pipeOffsets = {
            'a': [10, 35, 60],
            'b': [15, 50, 75],
            'c': [20, 40, 65],
            'd': [12, 45, 70]
        }[variant] || [10, 35, 60];

        for (var p = 0; p < pipeOffsets.length; p++) {
            var pcol = startCol + pipeOffsets[p];
            if (pcol + 1 < endCol && map[15] && map[16]) {
                map[15][pcol] = 6; map[15][pcol + 1] = 7;
                map[16][pcol] = 8; map[16][pcol + 1] = 9;
            }
        }

        // Floating brick + ?-block platforms at row 12 — every 12 cols
        for (var bc = startCol + 6; bc < endCol - 5; bc += 14) {
            if (map[12]) {
                map[12][bc] = 3;
                map[12][bc + 1] = 4;
                map[12][bc + 2] = 3;
            }
        }

        // Coins at ground level — sprinkled throughout
        var coinSpacing = (variant === 'b') ? 4 : 5;
        for (var cc = startCol + 4; cc < endCol; cc += coinSpacing) {
            if (map[16] && map[16][cc] === 0) {
                map[16][cc] = 50;
            }
        }

        // Goombas — 2 in the extension
        var goombaCols = (variant === 'c') ? [25, 55] : [22, 58];
        for (var gi = 0; gi < goombaCols.length; gi++) {
            var gc = startCol + goombaCols[gi];
            if (gc < endCol - 5 && map[16] && map[16][gc] === 0) {
                map[16][gc] = 60;
            }
        }

        // Small gap — single 2-tile pit (kid can jump over)
        var gapCol = startCol + ((variant === 'a') ? 30 : (variant === 'b') ? 55 : 40);
        if (map[17] && gapCol + 1 < endCol - 8) {
            map[17][gapCol] = 0; map[17][gapCol + 1] = 0;
            map[18][gapCol] = 0; map[18][gapCol + 1] = 0;
            // Safety bridge above the gap
            if (map[12]) {
                map[12][gapCol - 1] = 3;
                map[12][gapCol] = 3;
                map[12][gapCol + 1] = 3;
                map[12][gapCol + 2] = 3;
            }
        }
    }
});

// Attach to window for global access
window.GameScene = GameScene;
