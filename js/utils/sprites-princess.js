(function () {
    'use strict';

    window.EXTRA_SPRITE_GENERATORS = window.EXTRA_SPRITE_GENERATORS || [];

    function makeCanvas(w, h) {
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        return canvas;
    }

    function roundRect(ctx, x, y, w, h, r) {
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

    function drawDoor(ctx, x, y, w, h, leftSide) {
        var gold = ctx.createLinearGradient(x, y, x, y + h);
        gold.addColorStop(0, '#FFF1A6');
        gold.addColorStop(0.45, '#F4C542');
        gold.addColorStop(1, '#A86A1B');

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2;
        ctx.strokeStyle = gold;
        roundRect(ctx, x, y, w, h, 3);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 1.3;
        var bars = leftSide ? [x + 10, x + 20, x + 30] : [x + 8, x + 18, x + 28];
        for (var i = 0; i < bars.length; i++) {
            ctx.beginPath();
            ctx.moveTo(bars[i], y + 2);
            ctx.lineTo(bars[i], y + h - 2);
            ctx.stroke();
        }

        ctx.strokeStyle = gold;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 3, y + 12);
        ctx.lineTo(x + w - 3, y + 12);
        ctx.moveTo(x + 3, y + 24);
        ctx.lineTo(x + w - 3, y + 24);
        ctx.stroke();
    }

    function generatePrincessCageSprites(scene) {
        if (scene.textures.exists('princess-cage-closed')) return;

        var closed = makeCanvas(144, 156);
        var ctx = closed.getContext('2d');
        ctx.save();
        ctx.scale(4, 4);
        ctx.fillStyle = 'rgba(28, 50, 88, 0.28)';
        roundRect(ctx, 5, 4, 26, 31, 3);
        ctx.fill();
        drawDoor(ctx, 5, 4, 26, 31, true);
        ctx.strokeStyle = '#F4C542';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(18, 2);
        ctx.lineTo(18, 4);
        ctx.stroke();
        ctx.restore();
        scene.textures.addImage('princess-cage-closed', closed);

        var left = makeCanvas(52, 124);
        ctx = left.getContext('2d');
        ctx.save();
        ctx.scale(4, 4);
        drawDoor(ctx, 0, 0, 13, 31, true);
        ctx.restore();
        scene.textures.addImage('princess-cage-left', left);

        var right = makeCanvas(52, 124);
        ctx = right.getContext('2d');
        ctx.save();
        ctx.scale(4, 4);
        drawDoor(ctx, 0, 0, 13, 31, false);
        ctx.restore();
        scene.textures.addImage('princess-cage-right', right);
    }

    window.EXTRA_SPRITE_GENERATORS.push(generatePrincessCageSprites);
}());
