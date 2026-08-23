/**
 * The collectible card pickup — a small glinting card floating in the level.
 *
 * Four frames of a shine sweeping across it, so it catches the eye from a
 * distance: a hidden collectible nobody notices is just a wasted level tile.
 * Deliberately reads as a "card" (portrait frame, star, rounded corners) rather
 * than another coin.
 */
(function () {
    'use strict';

    window.EXTRA_SPRITE_GENERATORS = window.EXTRA_SPRITE_GENERATORS || [];

    function makeCanvas(w, h) {
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        return c;
    }

    function roundRect(ctx, x, y, w, h, r) {
        if (r > w / 2) r = w / 2;
        if (r > h / 2) r = h / 2;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    function fillRoundRect(ctx, x, y, w, h, r, color) {
        ctx.fillStyle = color;
        roundRect(ctx, x, y, w, h, r);
        ctx.fill();
    }

    function star(ctx, cx, cy, r, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        for (var i = 0; i < 10; i++) {
            var ang = -Math.PI / 2 + i * Math.PI / 5;
            var rr = (i % 2 === 0) ? r : r / 2.3;
            ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr);
        }
        ctx.closePath();
        ctx.fill();
    }

    function generateCardPickup(scene) {
        if (scene.textures.exists('card-pickup')) return;

        var frameW = 128, frameH = 128, frames = 4;
        var canvas = makeCanvas(frameW * frames, frameH);
        var ctx = canvas.getContext('2d');

        for (var f = 0; f < frames; f++) {
            ctx.save();
            ctx.translate(frameW * f, 0);
            ctx.scale(4, 4);

            // Card body with a gold border
            fillRoundRect(ctx, 8, 5, 16, 22, 3, '#F8D030');
            fillRoundRect(ctx, 9.5, 6.5, 13, 19, 2.5, '#FFF6D8');
            // Portrait window
            fillRoundRect(ctx, 11, 8, 10, 10, 1.5, '#7EC8F0');
            star(ctx, 16, 13, 3.6, '#F8D030');
            // Two text lines standing in for the name and description
            fillRoundRect(ctx, 11, 20, 10, 1.4, 0.7, '#C0B090');
            fillRoundRect(ctx, 11, 22.5, 7, 1.2, 0.6, '#C0B090');

            // The shine: a diagonal band sweeping left to right across frames
            ctx.save();
            roundRect(ctx, 8, 5, 16, 22, 3);
            ctx.clip();
            ctx.globalAlpha = 0.55;
            ctx.fillStyle = '#FFFFFF';
            ctx.translate(-6 + f * 8, 0);
            ctx.rotate(-0.35);
            ctx.fillRect(6, -6, 3.5, 40);
            ctx.restore();

            ctx.restore();
        }

        scene.textures.addSpriteSheet('card-pickup', canvas, { frameWidth: frameW, frameHeight: frameH });
    }

    window.EXTRA_SPRITE_GENERATORS.push(generateCardPickup);
})();
