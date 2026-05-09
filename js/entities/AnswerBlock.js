/**
 * AnswerBlock — a floating green ?-style block with a numbered medallion above it.
 *
 * Mario hits this from BELOW (jumping up into the block's underside). On hit,
 * MathChallenge decides whether the answer is correct or wrong.
 *
 * The block is suspended in the air at jumping height; Mario walks freely
 * underneath it.
 */

var AnswerBlock = function (scene, x, y, value, isCorrect) {
    this.scene = scene;
    this.value = value;
    this.isCorrect = isCorrect;
    this.destroyed = false;
    this.hit = false;          // becomes true after Mario bumps it from below

    // Physics sprite (the answer block)
    // 'answer-block' texture: 128x128 canvas, world 32x32 with setScale(0.25)
    this.sprite = scene.physics.add.sprite(x, y, 'answer-block', 0)
        .setScale(0.25)
        .setDepth(15);

    // Body matches the visible block
    this.sprite.body.setSize(120, 120);
    this.sprite.body.setOffset(4, 4);
    this.sprite.body.setImmovable(true);
    this.sprite.body.setAllowGravity(false);

    // Back-reference so MathChallenge.onCollision can resolve which block fired
    this.sprite._answerBlock = this;

    // Medallion above the block (world 48x48 with setScale(0.25))
    this.medallion = scene.add.sprite(x, y - 36, 'answer-medallion')
        .setScale(0.25)
        .setDepth(16);

    this.numberText = scene.add.text(x, y - 36, String(value), {
        fontFamily: '"Press Start 2P", "Arial Black", sans-serif',
        fontSize: '20px',
        color: '#000000',
        stroke: '#FFFFFF',
        strokeThickness: 4,
        align: 'center'
    }).setOrigin(0.5).setDepth(17);

    // Spawn animation: scale 0 → 1 with a slight bounce
    var spr = this.sprite, med = this.medallion, txt = this.numberText;
    var origScaleSpr = spr.scale;
    var origScaleMed = med.scale;
    var origScaleTxt = txt.scale;
    spr.setScale(0);
    med.setScale(0);
    txt.setScale(0);

    scene.tweens.add({ targets: spr, scale: origScaleSpr, duration: 450, ease: 'Back.Out' });
    scene.tweens.add({ targets: med, scale: origScaleMed, duration: 450, delay: 150, ease: 'Back.Out' });
    scene.tweens.add({ targets: txt, scale: origScaleTxt, duration: 450, delay: 150, ease: 'Back.Out' });

    // Idle floating: medallion + text bob gently
    this.idleTween = scene.tweens.add({
        targets: [med, txt],
        y: '-=4',
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
        delay: 450
    });
};

/**
 * Bump animation — block jumps up 8px and back, like the classic Mario
 * brick-block hit. Used for both correct and wrong answers (visual feedback).
 */
AnswerBlock.prototype.bump = function () {
    if (this.hit || !this.sprite) return;
    this.hit = true;
    var spr = this.sprite;
    var origY = spr.y;
    this.scene.tweens.add({
        targets: spr,
        y: origY - 8,
        duration: 90,
        yoyo: true,
        ease: 'Quad.Out'
    });
    // Also switch to the "used" frame
    if (this.scene.textures.exists('answer-block') &&
        this.scene.textures.get('answer-block').frameTotal > 2) {
        spr.setFrame(1);
    }
};

AnswerBlock.prototype.destroy = function (opts) {
    if (this.destroyed) return;
    this.destroyed = true;

    opts = opts || {};
    var scene = this.scene;
    var spr = this.sprite, med = this.medallion, txt = this.numberText;

    if (this.idleTween) { this.idleTween.stop(); this.idleTween = null; }

    if (opts.burstAsCoin && spr) {
        var coin = scene.add.sprite(spr.x, spr.y, 'coin')
            .setScale(0.25)
            .setDepth(18);
        if (scene.anims && scene.anims.exists('coin-spin')) coin.play('coin-spin');
        scene.tweens.add({
            targets: coin,
            y: coin.y - 80,
            alpha: 0,
            duration: 700,
            ease: 'Cubic.Out',
            onComplete: function () { coin.destroy(); }
        });
    }

    if (spr && spr.body) spr.body.setEnable(false);

    scene.tweens.add({
        targets: [spr, med, txt],
        alpha: 0,
        scale: 0,
        duration: 220,
        ease: 'Cubic.In',
        onComplete: function () {
            if (spr && spr.destroy) spr.destroy();
            if (med && med.destroy) med.destroy();
            if (txt && txt.destroy) txt.destroy();
        }
    });

    this.sprite = null;
    this.medallion = null;
    this.numberText = null;
};

if (typeof window !== 'undefined') {
    window.AnswerBlock = AnswerBlock;
    // Backwards-compat alias for any external code still referencing AnswerMushroom
    window.AnswerMushroom = AnswerBlock;
}
