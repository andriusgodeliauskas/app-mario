/**
 * MathChallenge — coordinates one math sign + 3 floating answer blocks.
 * Owns the lifecycle: spawn, hit-from-below detection, correct/wrong handling, cleanup.
 *
 * Constructor:
 *   new MathChallenge(scene, settings, history, x, y, onResolved)
 *     x, y — center of safe ground spot. Blocks are positioned in the air above.
 *
 * Side effects:
 *   - Pushes problem.key into history (and trims to last 8)
 *   - Calls onResolved() exactly once when the challenge is done (success or failure)
 *   - On wrong answer: calls scene.loseOnePower({ source: 'math' })
 */

// Vertical placement (relative to ground top y):
//   block center  = y - BLOCK_OFFSET_Y      (block sits in mid-air)
//   sign center   = y - SIGN_OFFSET_Y       (sign hovers above blocks)
// Mario's max jump height is ~169px, so blocks at y-112 are easily reachable.
var BLOCK_OFFSET_Y = 112;
var SIGN_OFFSET_Y = 192;

var MathChallenge = function (scene, settings, history, x, y, onResolved) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.onResolved = onResolved;
    this.resolved = false;
    this.cleaned = false;

    var problem = window.MathGen.next(settings, history);
    this.problem = problem;
    history.push(problem.key);
    while (history.length > 8) history.shift();

    var blockY = y - BLOCK_OFFSET_Y;

    // Sign hovers above the row of blocks
    this.sign = new MathSign(scene, x, y - SIGN_OFFSET_Y, problem);

    // Three blocks suspended in air at jumping height.
    // Centers 80px apart → 48px visual gap between block edges (easy aim).
    var offsets = [-80, 0, 80];
    this.blocks = [];
    var self = this;

    for (var i = 0; i < 3; i++) {
        var bx = x + offsets[i];
        var value = problem.options[i];
        var isCorrect = (value === problem.answer);
        var block = new AnswerBlock(scene, bx, blockY, value, isCorrect);
        this.blocks.push(block);

        scene.physics.add.collider(scene.player, block.sprite, function (player, blockSprite) {
            self._onCollision(player, blockSprite);
        }, null, scene);
    }

    // Invisible "answer wall" — blocks Mario from running past until ANY block is hit.
    // Positioned right of the rightmost block (at +offsets[2] + 48px), full vertical
    // span of the playable area. Mario walks freely under the blocks but bumps into
    // this wall when he tries to leave without answering.
    var wallX = x + offsets[2] + 48;
    var wallH = 600;             // taller than any reachable jump
    var wallY = y - wallH / 2;   // bottom flush with ground top
    this.wall = scene.add.rectangle(wallX, wallY, 8, wallH, 0xff0000, 0); // alpha 0 = invisible
    scene.physics.add.existing(this.wall, true); // static body
    this.wallCollider = scene.physics.add.collider(scene.player, this.wall);
};

MathChallenge.prototype._onCollision = function (player, blockSprite) {
    if (this.resolved || this.cleaned) return;
    if (!blockSprite || !blockSprite.body) return;
    var block = blockSprite._answerBlock;
    if (!block || block.hit) return;

    // Hit-from-below detection — must be a true bottom-face contact.
    // Phaser sets blockSprite.body.touching.down when Mario's TOP face contacts
    // the block's BOTTOM face. Side hits set touching.left/right instead, which
    // means this check correctly rejects them.
    if (!blockSprite.body.touching.down) {
        return;
    }

    this.resolved = true;

    if (block.isCorrect) {
        this._handleCorrect(player, block);
    } else {
        this._handleWrong(player, block);
    }
};

MathChallenge.prototype._handleCorrect = function (player, block) {
    var scene = this.scene;
    if (window.AudioManager) AudioManager.play('mathCorrect');

    scene.score = (scene.score || 0) + 50;
    scene.coins = (scene.coins || 0) + 1;
    scene.registry.set('score', scene.score);
    scene.registry.set('coins', scene.coins);
    scene.events.emit('scoreChange', scene.score);
    scene.events.emit('coinCollect', scene.coins);

    // Reverse Mario's upward velocity slightly (he bounced off the block)
    player.setVelocityY(80);

    this._showPopup(true);

    block.bump();
    this._removeWall();

    var blocks = this.blocks;
    var self = this;
    // Brief delay so the player sees the bump before the block bursts as a coin
    scene.time.delayedCall(150, function () {
        for (var i = 0; i < blocks.length; i++) {
            if (blocks[i] === block) {
                blocks[i].destroy({ burstAsCoin: true });
            } else {
                blocks[i].destroy();
            }
        }
        if (self.sign && !self.sign.destroyed) self.sign.destroy();
    });

    this._scheduleResolve(900);
};

MathChallenge.prototype._handleWrong = function (player, block) {
    var scene = this.scene;
    if (window.AudioManager) AudioManager.play('mathWrong');

    this._showPopup(false);

    block.bump();
    this._removeWall();

    if (typeof scene.loseOnePower === 'function') {
        scene.loseOnePower({ source: 'math' });
    }

    var blocks = this.blocks;
    var self = this;
    scene.time.delayedCall(150, function () {
        for (var i = 0; i < blocks.length; i++) {
            blocks[i].destroy();
        }
        if (self.sign && !self.sign.destroyed) self.sign.destroy();
    });

    this._scheduleResolve(1100);
};

MathChallenge.prototype._showPopup = function (isCorrect) {
    var scene = this.scene;
    var p = this.problem;
    var text = (isCorrect ? 'TEISINGAI!' : '✗ KLAIDA') +
               '\n' + p.a + ' ' + p.symbol + ' ' + p.b + ' = ' + p.answer;

    var popupX = scene.player.x;
    var popupY = scene.player.y - 90;

    var bgColor = isCorrect ? 0x27AE60 : 0xC0392B;
    var bg = scene.add.graphics().setDepth(50);
    bg.fillStyle(bgColor, 0.95);
    bg.fillRoundedRect(-110, -40, 220, 80, 12);
    bg.lineStyle(3, 0xFFFFFF, 1);
    bg.strokeRoundedRect(-110, -40, 220, 80, 12);
    bg.x = popupX; bg.y = popupY;

    var label = scene.add.text(popupX, popupY, text, {
        fontFamily: '"Press Start 2P", "Arial Black", sans-serif',
        fontSize: '14px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center'
    }).setOrigin(0.5).setDepth(51);

    bg.setScale(0.2);
    label.setScale(0.2);
    bg.setAlpha(0); label.setAlpha(0);

    scene.tweens.add({
        targets: [bg, label],
        scale: 1,
        alpha: 1,
        duration: 300,
        ease: 'Back.Out'
    });

    scene.tweens.add({
        targets: [bg, label],
        alpha: 0,
        y: '-=20',
        duration: 350,
        delay: isCorrect ? 1100 : 1500,
        ease: 'Cubic.In',
        onComplete: function () { bg.destroy(); label.destroy(); }
    });
};

MathChallenge.prototype._removeWall = function () {
    if (this.wall) {
        this.wall.destroy();
        this.wall = null;
    }
};

MathChallenge.prototype._scheduleResolve = function (delay) {
    var self = this;
    this.scene.time.delayedCall(delay, function () {
        if (!self.cleaned) {
            self.cleaned = true;
            if (typeof self.onResolved === 'function') self.onResolved();
        }
    });
};

/**
 * Force-cleanup (called by spawner when player dies, level ends, etc.)
 * Idempotent: safe to call multiple times.
 */
MathChallenge.prototype.cleanup = function () {
    if (this.cleaned) return;
    this.cleaned = true;
    this.resolved = true;

    if (this.sign && !this.sign.destroyed) this.sign.destroy();
    if (this.blocks) {
        for (var i = 0; i < this.blocks.length; i++) {
            if (this.blocks[i] && !this.blocks[i].destroyed) this.blocks[i].destroy();
        }
    }
    this._removeWall();
};

MathChallenge.prototype.getX = function () {
    return this.x;
};

if (typeof window !== 'undefined') window.MathChallenge = MathChallenge;
