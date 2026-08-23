/**
 * Villain spritesheets — Wario, Waluigi, Boo, Bowser Jr. and Donkey Kong.
 *
 * Layout follows the Goomba/Koopa convention so GameScene can treat them like
 * any other enemy: 3 frames of 128x128 — walk1, walk2, squished. Boo's third
 * frame is "shy" (eyes covered) rather than squished, because he cannot be
 * stomped; Bowser Jr.'s is his hurt frame.
 *
 * Drawn on the same 32x32 logical grid at scale(4) as every other sprite here.
 * Registers through EXTRA_SPRITE_GENERATORS like the other extension files.
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

    function fillCircle(ctx, cx, cy, r, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
    }

    function fillEllipse(ctx, cx, cy, rx, ry, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    function vGrad(ctx, y0, y1, top, bottom) {
        var g = ctx.createLinearGradient(0, y0, 0, y1);
        g.addColorStop(0, top);
        g.addColorStop(1, bottom);
        return g;
    }

    function addOutline(ctx, x, y, w, h) {
        var temp = makeCanvas(w + 8, h + 8);
        var tc = temp.getContext('2d');
        tc.drawImage(ctx.canvas, x, y, w, h, 4, 4, w, h);
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.globalAlpha = 0.4;
        ctx.drawImage(temp, x - 6, y - 2);
        ctx.drawImage(temp, x - 2, y - 2);
        ctx.drawImage(temp, x - 4, y - 6);
        ctx.drawImage(temp, x - 4, y - 2);
        ctx.restore();
    }

    var WHITE = '#FFFFFF';
    var BLACK = '#101010';

    function eyes(ctx, cx, cy, spread, rx, ry, angry) {
        [-spread, spread].forEach(function (dx) {
            fillEllipse(ctx, cx + dx, cy, rx, ry, WHITE);
            fillCircle(ctx, cx + dx + 0.5, cy, rx * 0.5, BLACK);
        });
        if (!angry) return;
        ctx.strokeStyle = BLACK;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx - spread - rx, cy - ry - 1.5); ctx.lineTo(cx - spread + rx, cy - ry + 0.5);
        ctx.moveTo(cx + spread + rx, cy - ry - 1.5); ctx.lineTo(cx + spread - rx, cy - ry + 0.5);
        ctx.stroke();
    }

    /** Stubby legs that swap on the walk cycle — shared by the walkers. */
    function legs(ctx, pose, y, color) {
        if (pose === 'walk1') {
            fillRoundRect(ctx, 8, y, 7, 5, 2, color);
            fillRoundRect(ctx, 18, y + 1, 7, 4, 2, color);
        } else {
            fillRoundRect(ctx, 8, y + 1, 7, 4, 2, color);
            fillRoundRect(ctx, 18, y, 7, 5, 2, color);
        }
    }

    // ── Wario: broad, yellow, zigzag moustache ──────────────────────────────
    function drawWario(ctx, pose) {
        if (pose === 'squished') {
            fillEllipse(ctx, 16, 27, 13, 3.5, '#F8D030');
            fillRoundRect(ctx, 6, 25, 20, 2, 1, '#7A3FA0');
            eyes(ctx, 16, 26, 5, 1.8, 1.2, false);
            return;
        }
        legs(ctx, pose, 26, '#2FA02F');
        fillRoundRect(ctx, 7, 17, 18, 10, 4, '#7A3FA0');      // overalls
        fillRoundRect(ctx, 9, 15, 14, 5, 2, '#F8D030');       // shirt
        fillCircle(ctx, 11, 20, 1.1, '#F8F0B0');
        fillCircle(ctx, 21, 20, 1.1, '#F8F0B0');
        fillEllipse(ctx, 6, 20, 2.6, 3, '#F8D030');           // arms
        fillEllipse(ctx, 26, 20, 2.6, 3, '#F8D030');
        fillCircle(ctx, 5, 23, 2.2, WHITE);
        fillCircle(ctx, 27, 23, 2.2, WHITE);

        fillEllipse(ctx, 16, 11, 8, 6.5, '#FFC890');          // head
        fillEllipse(ctx, 8, 11, 2, 2.6, '#FFC890');           // ears
        fillEllipse(ctx, 24, 11, 2, 2.6, '#FFC890');
        ctx.fillStyle = vGrad(ctx, 3, 9, '#FFE04A', '#C89A10');
        roundRect(ctx, 8, 3, 17, 6, 3); ctx.fill();           // cap
        fillRoundRect(ctx, 6, 8, 13, 2.5, 1, '#C89A10');
        ctx.fillStyle = '#3A3AC0';
        ctx.font = 'bold 5px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('W', 16, 8);

        eyes(ctx, 16, 10, 3, 2.2, 1.8, true);
        fillEllipse(ctx, 16, 13, 2.4, 1.8, '#F0A868');        // big nose
        // Zigzag moustache — the one thing that says "Wario" instantly
        ctx.strokeStyle = BLACK;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(9, 15); ctx.lineTo(12, 17); ctx.lineTo(14, 15);
        ctx.lineTo(18, 15); ctx.lineTo(20, 17); ctx.lineTo(23, 15);
        ctx.stroke();
    }

    // ── Waluigi: tall, thin, pointed everything ─────────────────────────────
    function drawWaluigi(ctx, pose) {
        if (pose === 'squished') {
            fillEllipse(ctx, 16, 27, 12, 3, '#6A3FA0');
            eyes(ctx, 16, 26, 4, 1.6, 1.1, false);
            return;
        }
        if (pose === 'walk1') {
            fillRoundRect(ctx, 9, 24, 5, 7, 2, '#2A2A45');
            fillRoundRect(ctx, 18, 25, 5, 6, 2, '#2A2A45');
        } else {
            fillRoundRect(ctx, 9, 25, 5, 6, 2, '#2A2A45');
            fillRoundRect(ctx, 18, 24, 5, 7, 2, '#2A2A45');
        }
        fillRoundRect(ctx, 7, 27, 7, 4, 2, '#F08020');        // shoes
        fillRoundRect(ctx, 18, 27, 7, 4, 2, '#F08020');
        fillRoundRect(ctx, 10, 15, 12, 10, 3, '#2A2A45');     // overalls
        fillRoundRect(ctx, 11, 13, 10, 4, 2, '#6A3FA0');
        fillEllipse(ctx, 8, 17, 2, 4, '#6A3FA0');             // long arms
        fillEllipse(ctx, 24, 17, 2, 4, '#6A3FA0');
        fillCircle(ctx, 7, 21, 2, WHITE);
        fillCircle(ctx, 25, 21, 2, WHITE);

        fillEllipse(ctx, 16, 9, 5.5, 6.5, '#FFC890');         // long head
        ctx.fillStyle = vGrad(ctx, 2, 7, '#8A5FC0', '#4A2080');
        roundRect(ctx, 10, 2, 13, 5, 2.5); ctx.fill();
        fillRoundRect(ctx, 8, 6, 11, 2, 1, '#4A2080');
        eyes(ctx, 16, 8, 2.4, 1.8, 1.6, true);
        // Pointed nose and the thin moustache
        ctx.fillStyle = '#F0A868';
        ctx.beginPath();
        ctx.moveTo(16, 10); ctx.lineTo(21, 12); ctx.lineTo(16, 13);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = BLACK;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(11, 13); ctx.lineTo(14, 14.5);
        ctx.moveTo(21, 13); ctx.lineTo(18, 14.5);
        ctx.stroke();
    }

    // ── Boo: round ghost; frame 2 is "shy", covering his eyes ───────────────
    function drawBoo(ctx, pose) {
        var bodyY = pose === 'walk2' ? 15 : 14;   // gentle bob
        // Tail wisps
        ctx.fillStyle = '#E8E8F0';
        ctx.beginPath();
        ctx.moveTo(8, bodyY + 6);
        ctx.quadraticCurveTo(6, bodyY + 12, 10, bodyY + 11);
        ctx.quadraticCurveTo(14, bodyY + 13, 16, bodyY + 10);
        ctx.quadraticCurveTo(18, bodyY + 13, 22, bodyY + 11);
        ctx.quadraticCurveTo(26, bodyY + 12, 24, bodyY + 6);
        ctx.closePath();
        ctx.fill();
        fillCircle(ctx, 16, bodyY, 10, '#F4F4FA');
        fillCircle(ctx, 12, bodyY - 4, 3, WHITE);             // highlight

        if (pose === 'squished') {
            // Shy: arms up over the eyes, mouth a small line
            fillCircle(ctx, 11, bodyY - 2, 3.4, '#E8E8F0');
            fillCircle(ctx, 21, bodyY - 2, 3.4, '#E8E8F0');
            ctx.strokeStyle = '#404050';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(16, bodyY + 4, 2, 0.15 * Math.PI, 0.85 * Math.PI);
            ctx.stroke();
            return;
        }

        // Sleepy angled eyes
        ctx.fillStyle = '#303040';
        ctx.beginPath(); ctx.ellipse(12, bodyY - 2, 1.8, 2.4, 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(20, bodyY - 2, 1.8, 2.4, -0.3, 0, Math.PI * 2); ctx.fill();
        // Open mouth with a tongue and little fangs
        ctx.fillStyle = '#8A1030';
        ctx.beginPath();
        ctx.ellipse(16, bodyY + 5, 4.5, 3.2, 0, 0, Math.PI * 2);
        ctx.fill();
        fillEllipse(ctx, 16, bodyY + 6.5, 2.4, 1.8, '#E8608A');
        ctx.fillStyle = WHITE;
        ctx.beginPath();
        ctx.moveTo(13, bodyY + 3); ctx.lineTo(14.6, bodyY + 5); ctx.lineTo(15.4, bodyY + 3);
        ctx.moveTo(17.6, bodyY + 3); ctx.lineTo(18.4, bodyY + 5); ctx.lineTo(19.6, bodyY + 3);
        ctx.fill();
    }

    // ── Bowser Jr.: small koopa with a painted bandana ──────────────────────
    function drawBowserJr(ctx, pose) {
        if (pose === 'squished') {
            fillEllipse(ctx, 16, 27, 12, 4, '#3A9A3A');
            fillEllipse(ctx, 16, 25, 8, 3, '#F8E8A0');
            eyes(ctx, 16, 25, 4, 1.6, 1.1, false);
            return;
        }
        legs(ctx, pose, 26, '#F8D848');
        fillEllipse(ctx, 16, 20, 10, 7, '#3A9A3A');           // shell
        fillEllipse(ctx, 16, 21, 7.5, 5, '#F8E8A0');
        [[12, 18], [20, 18], [16, 23]].forEach(function (s) {
            fillCircle(ctx, s[0], s[1], 1.6, '#FFFFFF');
        });
        fillEllipse(ctx, 6, 20, 2.4, 3, '#F8D848');           // arms
        fillEllipse(ctx, 26, 20, 2.4, 3, '#F8D848');

        fillEllipse(ctx, 16, 11, 7.5, 6, '#F8D848');          // head
        fillEllipse(ctx, 16, 13.5, 5, 3.5, '#F8E8A0');        // muzzle
        fillCircle(ctx, 14, 13, 0.7, '#B08830');
        fillCircle(ctx, 18, 13, 0.7, '#B08830');
        // Red mohawk
        ctx.fillStyle = '#E83010';
        ctx.beginPath();
        ctx.moveTo(13, 6); ctx.lineTo(15, 1.5); ctx.lineTo(16.5, 5);
        ctx.lineTo(18, 1.5); ctx.lineTo(20, 6);
        ctx.closePath(); ctx.fill();
        // Green shell-cap over the brow
        ctx.fillStyle = '#3A9A3A';
        ctx.beginPath();
        ctx.ellipse(16, 8, 7.5, 4, 0, Math.PI, 0);
        ctx.fill();
        eyes(ctx, 16, 10, 2.8, 2, 1.8, true);
        // The bandana with its drawn-on grin
        fillRoundRect(ctx, 10, 15, 12, 4, 1.5, '#F0F0F0');
        ctx.strokeStyle = '#B01020';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(11.5, 16); ctx.lineTo(13, 18); ctx.lineTo(14.5, 16);
        ctx.lineTo(16, 18); ctx.lineTo(17.5, 16); ctx.lineTo(19, 18); ctx.lineTo(20.5, 16);
        ctx.stroke();
    }

    // ── Donkey Kong: bulky ape with the red tie ─────────────────────────────
    function drawDK(ctx, pose) {
        if (pose === 'squished') {
            fillEllipse(ctx, 16, 27, 14, 4, '#7A4A22');
            fillEllipse(ctx, 16, 26, 6, 2.4, '#C09060');
            eyes(ctx, 16, 26, 4, 1.6, 1.1, false);
            return;
        }
        if (pose === 'walk1') {
            fillRoundRect(ctx, 7, 24, 8, 7, 3, '#7A4A22');
            fillRoundRect(ctx, 18, 25, 8, 6, 3, '#7A4A22');
        } else {
            fillRoundRect(ctx, 7, 25, 8, 6, 3, '#7A4A22');
            fillRoundRect(ctx, 18, 24, 8, 7, 3, '#7A4A22');
        }
        fillEllipse(ctx, 16, 19, 10, 7, '#7A4A22');           // chest
        fillEllipse(ctx, 16, 20, 6, 4.5, '#C09060');
        fillEllipse(ctx, 5, 18, 3, 4.5, '#7A4A22');           // long arms
        fillEllipse(ctx, 27, 18, 3, 4.5, '#7A4A22');
        // Red tie with DK on it
        fillRoundRect(ctx, 14, 14, 4, 7, 1, '#E02020');
        ctx.fillStyle = '#F8D030';
        ctx.font = 'bold 3px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('DK', 16, 19);

        fillEllipse(ctx, 16, 9, 7.5, 6, '#7A4A22');           // head
        fillCircle(ctx, 8, 8, 2.4, '#7A4A22');                // ears
        fillCircle(ctx, 24, 8, 2.4, '#7A4A22');
        fillEllipse(ctx, 16, 11, 5.5, 4, '#C09060');          // muzzle
        fillCircle(ctx, 14.4, 9.5, 0.7, '#5A3010');
        fillCircle(ctx, 17.6, 9.5, 0.7, '#5A3010');
        eyes(ctx, 16, 7, 2.6, 1.9, 1.6, true);
        // Grin
        ctx.strokeStyle = '#5A3010';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(16, 11.5, 2.6, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
    }

    var VILLAINS = {
        'wario': drawWario,
        'waluigi': drawWaluigi,
        'boo': drawBoo,
        'bowser-jr': drawBowserJr,
        'dk': drawDK
    };

    var POSES = ['walk1', 'walk2', 'squished'];

    /**
     * DK's barrel — its own 2-frame sheet (the rolling cycle), not part of the
     * villain sheets, because it is a projectile rather than a character.
     */
    function generateBarrel(scene) {
        if (scene.textures.exists('dk-barrel')) return;
        var frameW = 128, frameH = 128;
        var canvas = makeCanvas(frameW * 2, frameH);
        var ctx = canvas.getContext('2d');

        [0, 1].forEach(function (frame) {
            ctx.save();
            ctx.translate(frameW * frame, 0);
            ctx.scale(4, 4);

            fillRoundRect(ctx, 8, 12, 16, 14, 5, '#A06028');
            ctx.fillStyle = vGrad(ctx, 12, 26, '#C88040', '#7A4418');
            roundRect(ctx, 9, 13, 14, 12, 4); ctx.fill();

            // Staves rotate between the two frames so the roll reads
            ctx.strokeStyle = '#6A3810';
            ctx.lineWidth = 0.9;
            var shift = frame ? 2 : 0;
            [11, 16, 21].forEach(function (sx) {
                ctx.beginPath();
                ctx.moveTo(sx + shift, 13);
                ctx.lineTo(sx - shift, 25);
                ctx.stroke();
            });
            // Metal hoops
            fillRoundRect(ctx, 8, 15, 16, 2, 1, '#D8D8E0');
            fillRoundRect(ctx, 8, 21, 16, 2, 1, '#D8D8E0');

            ctx.restore();
            addOutline(ctx, frameW * frame, 0, frameW, frameH);
        });

        scene.textures.addSpriteSheet('dk-barrel', canvas, { frameWidth: frameW, frameHeight: frameH });
    }

    function generateVillains(scene) {
        Object.keys(VILLAINS).forEach(function (key) {
            if (scene.textures.exists(key)) return;
            var frameW = 128, frameH = 128;
            var canvas = makeCanvas(frameW * POSES.length, frameH);
            var ctx = canvas.getContext('2d');

            POSES.forEach(function (pose, i) {
                ctx.save();
                ctx.translate(frameW * i, 0);
                ctx.scale(4, 4);
                VILLAINS[key](ctx, pose);
                ctx.restore();
                addOutline(ctx, frameW * i, 0, frameW, frameH);
            });

            scene.textures.addSpriteSheet(key, canvas, { frameWidth: frameW, frameHeight: frameH });
        });
        generateBarrel(scene);
    }

    window.EXTRA_SPRITE_GENERATORS.push(generateVillains);
})();
