/**
 * Hero spritesheets — one per playable character in js/data/characters.js.
 *
 * Every sheet is drawn to EXACTLY the layout the built-in 'mario' sheet uses:
 *   hero-<id>       640x128, 5 frames: idle, run1, run2, jump, death
 *   hero-<id>-big   512x256, 4 frames: idle, run1, run2, jump
 * That is what lets BootScene build hero animations with the same frame ranges
 * as Mario's and lets GameScene swap textures on the mushroom transition
 * without knowing anything about which hero is active.
 *
 * A character's look comes from two data fields only: `palette` (colors) and
 * `shape` (silhouette). Adding a hero means adding a registry entry — no
 * drawing code changes unless the hero needs a silhouette nobody has yet.
 *
 * Registers itself through the project's EXTRA_SPRITE_GENERATORS hook, like the
 * themed decoration files do.
 */
(function () {
    'use strict';

    window.EXTRA_SPRITE_GENERATORS = window.EXTRA_SPRITE_GENERATORS || [];

    // ── canvas helpers (same local-copy pattern as sprites-themed-*.js) ──────
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

    // ── metrics ─────────────────────────────────────────────────────────────
    // Both sizes draw on a 32-wide logical grid at scale(4). Small is 32 tall,
    // big is 64 tall — the extra height goes into the torso and legs, which is
    // what makes big heroes read as the same character grown up.
    var SMALL = {
        h: 32, hatY: 2, hatH: 8, faceY: 14, faceRx: 8, faceRy: 6,
        bodyY: 18, bodyH: 7, armY: 21, armR: 3, legY: 25, legH: 4, shoeY: 28, shoeH: 4
    };
    var BIG = {
        h: 64, hatY: 3, hatH: 11, faceY: 20, faceRx: 9, faceRy: 8,
        bodyY: 28, bodyH: 15, armY: 34, armR: 6, legY: 43, legH: 10, shoeY: 53, shoeH: 6
    };

    // ── shared parts ────────────────────────────────────────────────────────

    function drawEyes(ctx, pose, cx, cy, spread, P) {
        if (pose === 'death') {
            ctx.strokeStyle = BLACK;
            ctx.lineWidth = 1.5;
            [-spread, spread].forEach(function (dx) {
                ctx.beginPath();
                ctx.moveTo(cx + dx - 1.5, cy - 1.5); ctx.lineTo(cx + dx + 1.5, cy + 1.5);
                ctx.moveTo(cx + dx + 1.5, cy - 1.5); ctx.lineTo(cx + dx - 1.5, cy + 1.5);
                ctx.stroke();
            });
            return;
        }
        [-spread, spread].forEach(function (dx) {
            fillEllipse(ctx, cx + dx, cy, 2.5, 2, WHITE);
            fillCircle(ctx, cx + dx + 0.8, cy, 1.2, P.eye || BLACK);
            fillCircle(ctx, cx + dx - 0.4, cy - 0.8, 0.6, WHITE);
        });
    }

    function drawArms(ctx, pose, P, M, gloves) {
        var skin = P.skin;
        if (pose === 'jump' || pose === 'death') {
            ctx.fillStyle = skin;
            ctx.beginPath(); ctx.ellipse(8, M.armY - 7, 2.5, M.armR + 1, -0.4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(24, M.armY - 7, 2.5, M.armR + 1, 0.4, 0, Math.PI * 2); ctx.fill();
            if (gloves) {
                fillCircle(ctx, 6, M.armY - 9, 2, WHITE);
                fillCircle(ctx, 26, M.armY - 9, 2, WHITE);
            }
        } else {
            fillEllipse(ctx, 8, M.armY, 2.5, M.armR, skin);
            fillEllipse(ctx, 24, M.armY, 2.5, M.armR, skin);
            if (gloves) {
                fillCircle(ctx, 8, M.armY + M.armR - 0.5, 2, WHITE);
                fillCircle(ctx, 24, M.armY + M.armR - 0.5, 2, WHITE);
            }
        }
    }

    /** Legs + shoes for the walking silhouettes (everything except `dress`). */
    function drawLegs(ctx, pose, P, M) {
        var legC = P.legs || P.bodyDark;
        var shoeC = P.shoe;
        if (pose === 'run1') {
            fillRoundRect(ctx, 8, M.legY, 7, M.legH, 2, legC);
            fillRoundRect(ctx, 17, M.legY, 7, M.legH, 2, legC);
            fillRoundRect(ctx, 7, M.shoeY, 8, M.shoeH, 2, shoeC);
            fillRoundRect(ctx, 18, M.shoeY, 8, M.shoeH, 2, shoeC);
        } else if (pose === 'run2') {
            fillRoundRect(ctx, 11, M.legY, 10, M.legH, 2, legC);
            fillRoundRect(ctx, 10, M.shoeY, 12, M.shoeH, 2, shoeC);
        } else {
            fillRoundRect(ctx, 9, M.legY, 6, M.legH, 2, legC);
            fillRoundRect(ctx, 17, M.legY, 6, M.legH, 2, legC);
            fillRoundRect(ctx, 8, M.shoeY, 7, M.shoeH, 2, shoeC);
            fillRoundRect(ctx, 18, M.shoeY, 7, M.shoeH, 2, shoeC);
        }
    }

    function drawTorso(ctx, P, M) {
        ctx.fillStyle = vGrad(ctx, M.bodyY, M.bodyY + M.bodyH, P.bodyBright, P.bodyDark);
        roundRect(ctx, 9, M.bodyY, 14, M.bodyH, 2);
        ctx.fill();
    }

    // ── silhouettes ─────────────────────────────────────────────────────────

    /** Mario / Luigi: cap with a brim, moustache, overalls over a shirt. */
    function shapePlumber(ctx, pose, P, M, big) {
        var hatX = pose === 'death' ? 6 : 8;
        ctx.fillStyle = vGrad(ctx, M.hatY, M.hatY + M.hatH + 4, P.hatBright, P.hatDark);
        roundRect(ctx, hatX, M.hatY, big ? 20 : 18, M.hatH, big ? 4 : 3);
        ctx.fill();
        fillRoundRect(ctx, hatX - 2, M.hatY + M.hatH, big ? 16 : 14, big ? 4 : 3, 1.5, P.hatDark);
        if (big) {
            fillCircle(ctx, 16, M.hatY + 5, 3, WHITE);
            ctx.fillStyle = P.hatDark;
            ctx.font = 'bold 5px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText((P.initial || 'M'), 16, M.hatY + 7);
        }

        fillEllipse(ctx, 16, M.faceY, M.faceRx, M.faceRy, P.skin);
        ctx.fillStyle = (function () {
            var g = ctx.createRadialGradient(16, M.faceY, 1, 16, M.faceY, M.faceRx);
            g.addColorStop(0, P.skinLight || P.skin);
            g.addColorStop(1, P.skinDark);
            return g;
        })();
        ctx.globalAlpha = 0.35;
        fillEllipse(ctx, 16, M.faceY, M.faceRx, M.faceRy, ctx.fillStyle);
        ctx.globalAlpha = 1;

        fillEllipse(ctx, 16 - M.faceRx + 1, M.faceY - 1, 2.5, 4, P.hair);
        fillEllipse(ctx, 16 + M.faceRx - 1, M.faceY - 1, 2, 3, P.hair);
        drawEyes(ctx, pose, 16, M.faceY - 2, 3, P);
        fillEllipse(ctx, 16, M.faceY + 1, 2, 1.5, P.skinDark);

        // Moustache
        ctx.fillStyle = P.hair;
        ctx.beginPath();
        var my = M.faceY + 2;
        ctx.moveTo(10, my);
        ctx.quadraticCurveTo(13, my + 3, 16, my + 1);
        ctx.quadraticCurveTo(19, my + 3, 22, my);
        ctx.quadraticCurveTo(19, my + 2, 16, my + 2);
        ctx.quadraticCurveTo(13, my + 2, 10, my);
        ctx.fill();

        drawTorso(ctx, P, M);
        // Overall bib + buttons
        fillRoundRect(ctx, 11, M.bodyY + 2, 10, M.bodyH - 2, 1, P.overalls || P.bodyDark);
        fillCircle(ctx, 13, M.bodyY + 4, 1, P.trim);
        fillCircle(ctx, 19, M.bodyY + 4, 1, P.trim);
        drawArms(ctx, pose, P, M, true);
        drawLegs(ctx, pose, P, M);
    }

    /** Peach / Daisy / Rosalina: crown, long hair, bell skirt instead of legs. */
    function shapeDress(ctx, pose, P, M, big) {
        // Long hair behind everything
        fillEllipse(ctx, 16, M.faceY + 2, M.faceRx + 2.5, M.faceRy + 5, P.hair);

        // Crown
        ctx.fillStyle = P.hatBright;
        ctx.beginPath();
        var cy = M.hatY + 4;
        ctx.moveTo(11, cy + 3);
        ctx.lineTo(11, cy - 1); ctx.lineTo(13.5, cy + 1); ctx.lineTo(16, cy - 3);
        ctx.lineTo(18.5, cy + 1); ctx.lineTo(21, cy - 1); ctx.lineTo(21, cy + 3);
        ctx.closePath();
        ctx.fill();
        fillCircle(ctx, 16, cy, 1.1, P.trim);

        fillEllipse(ctx, 16, M.faceY, M.faceRx - 1, M.faceRy, P.skin);
        // Fringe
        ctx.fillStyle = P.hair;
        ctx.beginPath();
        ctx.ellipse(16, M.faceY - M.faceRy + 1.5, M.faceRx - 1, 3, 0, Math.PI, 0);
        ctx.fill();
        drawEyes(ctx, pose, 16, M.faceY - 1, 3, P);
        // Earrings
        fillCircle(ctx, 16 - M.faceRx + 1, M.faceY + 1, 1, P.trim);
        fillCircle(ctx, 16 + M.faceRx - 1, M.faceY + 1, 1, P.trim);
        // Smile
        ctx.strokeStyle = '#C05070';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(16, M.faceY + 1.5, 2, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();

        // Bodice
        ctx.fillStyle = vGrad(ctx, M.bodyY, M.bodyY + M.bodyH, P.bodyBright, P.bodyDark);
        roundRect(ctx, 11, M.bodyY, 10, M.bodyH - 1, 2);
        ctx.fill();
        fillCircle(ctx, 16, M.bodyY + 2, 1.4, P.trim);

        // Puffy sleeves
        fillCircle(ctx, 9.5, M.bodyY + 2, 2.6, P.bodyBright);
        fillCircle(ctx, 22.5, M.bodyY + 2, 2.6, P.bodyBright);
        // Arms
        if (pose === 'jump' || pose === 'death') {
            fillEllipse(ctx, 7.5, M.armY - 6, 2, M.armR, P.skin);
            fillEllipse(ctx, 24.5, M.armY - 6, 2, M.armR, P.skin);
            fillCircle(ctx, 6.5, M.armY - 8, 1.8, WHITE);
            fillCircle(ctx, 25.5, M.armY - 8, 1.8, WHITE);
        } else {
            fillEllipse(ctx, 8, M.armY, 2, M.armR, P.skin);
            fillEllipse(ctx, 24, M.armY, 2, M.armR, P.skin);
            fillCircle(ctx, 8, M.armY + M.armR, 1.8, WHITE);
            fillCircle(ctx, 24, M.armY + M.armR, 1.8, WHITE);
        }

        // Bell skirt — sways with the run cycle so the walk still reads
        var skirtTop = M.bodyY + M.bodyH - 1;
        var skirtBottom = M.shoeY + 1;
        var sway = pose === 'run1' ? -1.5 : (pose === 'run2' ? 1.5 : 0);
        ctx.fillStyle = vGrad(ctx, skirtTop, skirtBottom, P.bodyBright, P.bodyDark);
        ctx.beginPath();
        ctx.moveTo(12, skirtTop);
        ctx.lineTo(20, skirtTop);
        ctx.quadraticCurveTo(25 + sway, skirtBottom - 2, 24 + sway, skirtBottom);
        ctx.lineTo(8 + sway, skirtBottom);
        ctx.quadraticCurveTo(7 + sway, skirtBottom - 2, 12, skirtTop);
        ctx.closePath();
        ctx.fill();
        // Hem
        fillRoundRect(ctx, 8 + sway, skirtBottom - 1.5, 16, 2.5, 1, P.bodyDark);

        // Shoes peeking out
        if (pose === 'run1') {
            fillRoundRect(ctx, 9 + sway, M.shoeY + 1, 6, M.shoeH - 1, 2, P.shoe);
            fillRoundRect(ctx, 18 + sway, M.shoeY + 2, 6, M.shoeH - 1, 2, P.shoe);
        } else if (pose === 'run2') {
            fillRoundRect(ctx, 13 + sway, M.shoeY + 1, 8, M.shoeH - 1, 2, P.shoe);
        } else {
            fillRoundRect(ctx, 10, M.shoeY + 1, 5, M.shoeH - 1, 2, P.shoe);
            fillRoundRect(ctx, 18, M.shoeY + 1, 5, M.shoeH - 1, 2, P.shoe);
        }
        if (big) fillCircle(ctx, 16, skirtTop + 3, 1.6, P.trim);
    }

    /** Toad: the cap IS the head — wide, spotted, sitting straight on the body. */
    function shapeMushroom(ctx, pose, P, M) {
        // Body first: Toad's cap is so wide that it overlaps the shoulders, and
        // his face sits low enough to land inside the torso rectangle. Drawing
        // the body underneath is what keeps both of them visible.
        drawTorso(ctx, P, M);
        fillRoundRect(ctx, 11, M.bodyY, 4, M.bodyH, 1, P.trim);
        fillRoundRect(ctx, 17, M.bodyY, 4, M.bodyH, 1, P.trim);
        drawArms(ctx, pose, P, M, false);
        drawLegs(ctx, pose, P, M);

        var capRx = M.faceRx + 2.5;
        var capRy = M.faceRy + 1;
        var capCy = M.hatY + capRy - 1;

        // Face tucked under the cap, its crown overlapped so the two read as
        // one head rather than a hat hovering above a child.
        var fy = capCy + capRy - 0.5;
        fillEllipse(ctx, 16, fy, 6.5, 5, P.skin);
        drawEyes(ctx, pose, 16, fy - 1, 2.6, P);
        if (pose !== 'death') {
            ctx.strokeStyle = '#B07040';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.arc(16, fy + 0.5, 1.8, 0.15 * Math.PI, 0.85 * Math.PI);
            ctx.stroke();
        }

        // Cap on top of everything
        ctx.fillStyle = vGrad(ctx, capCy - capRy, capCy + capRy, P.hatBright, P.hatDark);
        ctx.beginPath();
        ctx.ellipse(16, capCy, capRx, capRy, 0, Math.PI, 0);
        ctx.lineTo(16 + capRx, capCy + 1.5);
        ctx.quadraticCurveTo(16, capCy + 4.5, 16 - capRx, capCy + 1.5);
        ctx.closePath();
        ctx.fill();
        fillEllipse(ctx, 16, capCy - capRy + 3, 2.6, 2.2, P.hair);
        fillEllipse(ctx, 16 - capRx + 3, capCy - 0.5, 2.2, 2, P.hair);
        fillEllipse(ctx, 16 + capRx - 3, capCy - 0.5, 2.2, 2, P.hair);
    }

    /** Yoshi: snout, saddle, white belly, chunky boots. */
    function shapeDino(ctx, pose, P, M) {
        // Head + snout
        fillEllipse(ctx, 16, M.faceY - 1, M.faceRx, M.faceRy, P.skin);
        fillEllipse(ctx, 16 + M.faceRx - 2, M.faceY + 1, 4.5, 3, P.skin);
        fillCircle(ctx, 16 + M.faceRx + 1, M.faceY + 0.5, 0.7, P.skinDark);
        // Cheek crest
        ctx.fillStyle = P.hair;
        ctx.beginPath();
        ctx.moveTo(16 - M.faceRx + 1, M.faceY - M.faceRy);
        ctx.quadraticCurveTo(16 - M.faceRx - 3, M.faceY - M.faceRy - 3, 16 - M.faceRx - 1, M.faceY - 1);
        ctx.quadraticCurveTo(16 - M.faceRx + 1, M.faceY - 2, 16 - M.faceRx + 1, M.faceY - M.faceRy);
        ctx.fill();
        // Big eyes sit high on the head
        if (pose === 'death') {
            drawEyes(ctx, pose, 16, M.faceY - M.faceRy + 1, 2.6, P);
        } else {
            fillEllipse(ctx, 14, M.faceY - M.faceRy + 1, 2.6, 3.2, WHITE);
            fillEllipse(ctx, 18.5, M.faceY - M.faceRy + 1, 2.6, 3.2, WHITE);
            fillCircle(ctx, 14.4, M.faceY - M.faceRy + 1.4, 1.2, BLACK);
            fillCircle(ctx, 18.9, M.faceY - M.faceRy + 1.4, 1.2, BLACK);
        }
        // Mouth line
        if (pose !== 'death') {
            ctx.strokeStyle = '#B03020';
            ctx.lineWidth = 0.9;
            ctx.beginPath();
            ctx.moveTo(16 + 2, M.faceY + 2.5);
            ctx.lineTo(16 + M.faceRx + 1, M.faceY + 2.5);
            ctx.stroke();
        }

        // Body: green back, pale belly
        ctx.fillStyle = vGrad(ctx, M.bodyY, M.bodyY + M.bodyH, P.skin, P.skinDark);
        roundRect(ctx, 9, M.bodyY, 14, M.bodyH, 3);
        ctx.fill();
        fillEllipse(ctx, 16, M.bodyY + M.bodyH / 2 + 0.5, 5, M.bodyH / 2 - 0.5, P.bodyBright);
        // Saddle shell
        fillRoundRect(ctx, 10, M.bodyY - 1, 12, 3.5, 1.5, P.trim);

        drawArms(ctx, pose, P, M, false);
        drawLegs(ctx, pose, P, M);
    }

    /** Diddy Kong: cap, muzzle, fur, star shirt, tail. */
    function shapeMonkey(ctx, pose, P, M) {
        // Tail curling out behind
        ctx.strokeStyle = P.hair;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(9, M.bodyY + M.bodyH - 2);
        ctx.quadraticCurveTo(3, M.bodyY + M.bodyH - 1, 4, M.bodyY + 1);
        ctx.stroke();

        // Head fur + ears
        fillCircle(ctx, 16 - M.faceRx + 1, M.faceY - 1, 2.2, P.hair);
        fillCircle(ctx, 16 + M.faceRx - 1, M.faceY - 1, 2.2, P.hair);
        fillEllipse(ctx, 16, M.faceY - 1, M.faceRx - 1, M.faceRy, P.hair);
        // Muzzle
        fillEllipse(ctx, 16, M.faceY + 2, M.faceRx - 3, M.faceRy - 2.5, P.skin);
        fillCircle(ctx, 16, M.faceY + 1, 0.8, P.skinDark);
        drawEyes(ctx, pose, 16, M.faceY - 2, 2.6, P);
        if (pose !== 'death') {
            ctx.strokeStyle = '#7A4A20';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.arc(16, M.faceY + 2, 2, 0.15 * Math.PI, 0.85 * Math.PI);
            ctx.stroke();
        }
        // Cap
        ctx.fillStyle = vGrad(ctx, M.hatY, M.hatY + M.hatH, P.hatBright, P.hatDark);
        ctx.beginPath();
        ctx.ellipse(16, M.faceY - M.faceRy + 1, M.faceRx - 0.5, M.faceRy - 1.5, 0, Math.PI, 0);
        ctx.fill();
        fillRoundRect(ctx, 16, M.faceY - M.faceRy + 0.5, 9, 2, 1, P.hatDark);

        // Shirt with a star
        drawTorso(ctx, P, M);
        ctx.fillStyle = P.trim;
        ctx.beginPath();
        var sx = 16, sy = M.bodyY + M.bodyH / 2, sr = 2.4;
        for (var i = 0; i < 10; i++) {
            var ang = -Math.PI / 2 + i * Math.PI / 5;
            var r = (i % 2 === 0) ? sr : sr / 2.3;
            ctx[i ? 'lineTo' : 'moveTo'](sx + Math.cos(ang) * r, sy + Math.sin(ang) * r);
        }
        ctx.closePath();
        ctx.fill();

        drawArms(ctx, pose, P, M, false);
        drawLegs(ctx, pose, P, M);
    }

    var SHAPES = {
        plumber: shapePlumber,
        dress: shapeDress,
        mushroom: shapeMushroom,
        dino: shapeDino,
        monkey: shapeMonkey
    };

    // ── sheet assembly ──────────────────────────────────────────────────────

    var SMALL_POSES = ['idle', 'run1', 'run2', 'jump', 'death'];
    var BIG_POSES = ['idle', 'run1', 'run2', 'jump'];

    function drawSheet(scene, key, ch, M, poses, frameH) {
        var frameW = 128;
        var canvas = makeCanvas(frameW * poses.length, frameH);
        var ctx = canvas.getContext('2d');
        var shape = SHAPES[ch.shape];
        var big = frameH > 128;

        poses.forEach(function (pose, i) {
            ctx.save();
            ctx.translate(frameW * i, 0);
            ctx.scale(4, 4);
            shape(ctx, pose, ch.palette, M, big);
            ctx.restore();
            addOutline(ctx, frameW * i, 0, frameW, frameH);
        });

        scene.textures.addSpriteSheet(key, canvas, { frameWidth: frameW, frameHeight: frameH });
    }

    function generateHeroes(scene) {
        var Chars = window.Characters;
        if (!Chars) {
            console.warn('[sprites-heroes] Characters registry missing — no hero sheets generated.');
            return;
        }
        Chars.LIST.forEach(function (ch) {
            if (!SHAPES[ch.shape]) {
                console.warn('[sprites-heroes] unknown shape "' + ch.shape + '" for ' + ch.id);
                return;
            }
            if (scene.textures.exists('hero-' + ch.id)) return;
            drawSheet(scene, 'hero-' + ch.id, ch, SMALL, SMALL_POSES, 128);
            drawSheet(scene, 'hero-' + ch.id + '-big', ch, BIG, BIG_POSES, 256);
        });
    }

    window.EXTRA_SPRITE_GENERATORS.push(generateHeroes);
})();
