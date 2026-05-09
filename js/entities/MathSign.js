/**
 * MathSign — wooden sign displaying a math problem ("a + b = ?") above answer mushrooms.
 * Owns a sprite + a text object; spawn/destroy animations are tween-based.
 */

var MathSign = function (scene, x, y, problem) {
    this.scene = scene;
    this.problem = problem;
    this.destroyed = false;

    // Wood sign sprite — world 160x48 (canvas 640x192, scale 0.25)
    this.sprite = scene.add.sprite(x, y, 'wood-sign')
        .setScale(0.25)
        .setDepth(20);

    var problemText = problem.a + ' ' + problem.symbol + ' ' + problem.b + ' = ?';
    this.text = scene.add.text(x, y - 4, problemText, {
        fontFamily: '"Press Start 2P", "Arial Black", sans-serif',
        fontSize: '14px',
        color: '#1a1a1a',
        stroke: '#FFFACD',
        strokeThickness: 2,
        align: 'center'
    }).setOrigin(0.5).setDepth(21);

    // Spawn animation: appear from above, fade in
    this.sprite.setAlpha(0);
    this.text.setAlpha(0);
    var initialY = y - 16;
    this.sprite.y = initialY;
    this.text.y = initialY - 6;

    scene.tweens.add({
        targets: [this.sprite, this.text],
        alpha: 1,
        y: '+=16',
        duration: 350,
        ease: 'Cubic.Out'
    });
};

MathSign.prototype.destroy = function () {
    if (this.destroyed) return;
    this.destroyed = true;

    var sprite = this.sprite, text = this.text;
    this.scene.tweens.add({
        targets: [sprite, text],
        alpha: 0,
        y: '-=24',
        duration: 250,
        ease: 'Cubic.In',
        onComplete: function () {
            if (sprite && sprite.destroy) sprite.destroy();
            if (text && text.destroy) text.destroy();
        }
    });

    this.sprite = null;
    this.text = null;
};

if (typeof window !== 'undefined') window.MathSign = MathSign;
