/**
 * SpriteGenerator — Smooth modern 2D sprite generation
 * All sprites drawn via Canvas 2D API with gradients, arcs, curves.
 * No external images needed. Modern mobile-game quality graphics.
 */

(function () {
    'use strict';

    // ========================================
    // HELPER FUNCTIONS
    // ========================================

    /** Create an offscreen canvas */
    function makeCanvas(w, h) {
        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        return c;
    }

    /** Draw a rounded rectangle path */
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

    /** Fill a circle */
    function fillCircle(ctx, cx, cy, r, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
    }

    /** Fill an ellipse */
    function fillEllipse(ctx, cx, cy, rx, ry, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    /** Fill a rounded rect */
    function fillRoundRect(ctx, x, y, w, h, r, color) {
        ctx.fillStyle = color;
        roundRect(ctx, x, y, w, h, r);
        ctx.fill();
    }

    /** Stroke a rounded rect */
    function strokeRoundRect(ctx, x, y, w, h, r, color, lw) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lw || 1;
        roundRect(ctx, x, y, w, h, r);
        ctx.stroke();
    }

    /** Draw a 5-pointed star path */
    function starPath(ctx, cx, cy, outerR, innerR, points) {
        points = points || 5;
        ctx.beginPath();
        for (var i = 0; i < points * 2; i++) {
            var r = (i % 2 === 0) ? outerR : innerR;
            var angle = (Math.PI / 2 * -1) + (Math.PI / points) * i;
            var x = cx + Math.cos(angle) * r;
            var y = cy + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
    }

    /** Add dark outline around drawn content on a canvas region */
    function addOutline(ctx, x, y, w, h) {
        // Create temp canvas with the region (doubled offsets for 4x sprites)
        var temp = makeCanvas(w + 8, h + 8);
        var tc = temp.getContext('2d');
        tc.drawImage(ctx.canvas, x, y, w, h, 4, 4, w, h);

        // Draw outline by stamping dark version in 4 directions
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.globalAlpha = 0.4;
        ctx.drawImage(temp, x - 6, y - 2);
        ctx.drawImage(temp, x - 2, y - 2);
        ctx.drawImage(temp, x - 4, y - 6);
        ctx.drawImage(temp, x - 4, y - 2);
        ctx.restore();
    }

    // ========================================
    // COLOR CONSTANTS
    // ========================================
    var C = {
        // Mario
        marioRed: '#E8261C',
        marioRedBright: '#FF4030',
        marioRedDark: '#B01010',
        marioSkin: '#FCA044',
        marioSkinLight: '#FFD0A0',
        marioSkinDark: '#D07020',
        marioBrown: '#8B5A2B',
        marioBrownDark: '#5C3A1A',
        marioBlue: '#3030C0',
        marioBlueDark: '#202090',
        // Tiles
        grassGreen: '#58E858',
        grassGreenDark: '#208020',
        grassGreenMid: '#40C040',
        earthBrown: '#C06000',
        earthBrownLight: '#D88030',
        earthBrownDark: '#804000',
        brick: '#C84C0C',
        brickLight: '#E09050',
        brickDark: '#803808',
        mortar: '#E8A060',
        // Question block
        questionGold: '#F8B800',
        questionLight: '#FFF0A0',
        questionDark: '#885500',
        // Coin
        coinYellow: '#F8D830',
        coinDark: '#C8A020',
        coinLight: '#FFF8A0',
        // Pipe
        pipeGreen: '#30C030',
        pipeLight: '#58E858',
        pipeDark: '#188018',
        pipeHighlight: '#78FF78',
        // Goomba
        goombaBrown: '#A0522D',
        goombaBrownDark: '#8B4513',
        goombaTan: '#F5DEB3',
        // Koopa
        koopaGreen: '#30C030',
        koopaGreenDark: '#208020',
        koopaGreenLight: '#48D848',
        koopaBelly: '#F8D830',
        // Mushroom
        mushRed: '#E8261C',
        mushRedDark: '#B01010',
        // Star
        starYellow: '#F8D830',
        starLight: '#FFF8A0',
        starOrange: '#F8B800',
        // Princess
        princessPink: '#FF69B4',
        princessPinkDark: '#CC5599',
        princessPinkLight: '#FFB0D0',
        princessGold: '#F8D830',
        princessHair: '#E0B020',
        // Bowser
        bowserGreen: '#30C030',
        bowserGreenDark: '#208020',
        bowserShell: '#445544',
        bowserHorn: '#F8D830',
        bowserBelly: '#F8D830',
        // General
        black: '#000000',
        white: '#FFFFFF',
        gray: '#AAAAAA',
        grayLight: '#CCCCCC',
        grayDark: '#555555',
    };

    // ========================================
    // 1. MARIO SPRITES (small: 32x32, 5 frames)
    // ========================================
    function generateMario(scene) {
        var frameW = 128, frameH = 128;
        var numFrames = 5;
        var canvas = makeCanvas(frameW * numFrames, frameH);
        var ctx = canvas.getContext('2d');

        function drawSmallMario(ox, pose) {
            ctx.save();
            ctx.translate(ox, 0);
            ctx.scale(4, 4);

            // === HAT ===
            var hatGrad = ctx.createLinearGradient(0, 2, 0, 12);
            hatGrad.addColorStop(0, C.marioRedBright);
            hatGrad.addColorStop(1, C.marioRedDark);

            if (pose === 'death') {
                // Hat slightly askew
                ctx.fillStyle = hatGrad;
                roundRect(ctx, 6, 2, 20, 8, 3);
                ctx.fill();
                // Brim
                fillRoundRect(ctx, 4, 8, 14, 3, 1.5, C.marioRedDark);
            } else if (pose === 'jump') {
                // Hat
                ctx.fillStyle = hatGrad;
                roundRect(ctx, 8, 2, 18, 8, 3);
                ctx.fill();
                // Brim extending right
                fillRoundRect(ctx, 6, 8, 14, 3, 1.5, C.marioRedDark);
            } else {
                // Normal hat
                ctx.fillStyle = hatGrad;
                roundRect(ctx, 8, 2, 18, 8, 3);
                ctx.fill();
                // Brim
                fillRoundRect(ctx, 6, 8, 14, 3, 1.5, C.marioRedDark);
            }

            // === FACE ===
            var faceGrad = ctx.createRadialGradient(16, 14, 1, 16, 14, 8);
            faceGrad.addColorStop(0, C.marioSkinLight);
            faceGrad.addColorStop(1, C.marioSkinDark);
            fillEllipse(ctx, 16, 14, 8, 6, C.marioSkin);
            // Skin gradient overlay
            ctx.fillStyle = faceGrad;
            ctx.beginPath();
            ctx.ellipse(16, 14, 8, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            // Hair / sideburns
            fillEllipse(ctx, 9, 13, 2.5, 4, C.marioBrown);
            fillEllipse(ctx, 23, 13, 2, 3, C.marioBrown);

            // Eyes
            if (pose === 'death') {
                // X eyes
                ctx.strokeStyle = C.black;
                ctx.lineWidth = 1.5;
                // Left X
                ctx.beginPath();
                ctx.moveTo(12, 11); ctx.lineTo(15, 14);
                ctx.moveTo(15, 11); ctx.lineTo(12, 14);
                ctx.stroke();
                // Right X
                ctx.beginPath();
                ctx.moveTo(18, 11); ctx.lineTo(21, 14);
                ctx.moveTo(21, 11); ctx.lineTo(18, 14);
                ctx.stroke();
            } else {
                // Normal eyes: white with black pupil
                fillEllipse(ctx, 13, 12, 2.5, 2, C.white);
                fillEllipse(ctx, 19, 12, 2.5, 2, C.white);
                fillCircle(ctx, 14, 12, 1.2, C.black);
                fillCircle(ctx, 20, 12, 1.2, C.black);
                // Eye highlights
                fillCircle(ctx, 13, 11, 0.6, C.white);
                fillCircle(ctx, 19, 11, 0.6, C.white);
            }

            // Nose
            fillEllipse(ctx, 16, 15, 2, 1.5, '#E08040');

            // Mustache
            ctx.fillStyle = C.marioBrown;
            ctx.beginPath();
            ctx.moveTo(10, 16);
            ctx.quadraticCurveTo(13, 19, 16, 17);
            ctx.quadraticCurveTo(19, 19, 22, 16);
            ctx.quadraticCurveTo(19, 18, 16, 18);
            ctx.quadraticCurveTo(13, 18, 10, 16);
            ctx.fill();

            // === BODY (shirt) ===
            var bodyGrad = ctx.createLinearGradient(0, 18, 0, 24);
            bodyGrad.addColorStop(0, C.marioRedBright);
            bodyGrad.addColorStop(1, C.marioRedDark);
            ctx.fillStyle = bodyGrad;
            roundRect(ctx, 9, 18, 14, 7, 2);
            ctx.fill();

            // Overalls (blue straps)
            fillRoundRect(ctx, 11, 20, 10, 5, 1, C.marioBlue);
            // Overall buttons
            fillCircle(ctx, 13, 22, 1, '#F8D830');
            fillCircle(ctx, 19, 22, 1, '#F8D830');

            // === ARMS ===
            if (pose === 'jump' || pose === 'death') {
                // Arms raised
                ctx.fillStyle = C.marioSkin;
                // Left arm up
                ctx.beginPath();
                ctx.ellipse(8, 14, 2.5, 4, -0.4, 0, Math.PI * 2);
                ctx.fill();
                // Right arm up
                ctx.beginPath();
                ctx.ellipse(24, 14, 2.5, 4, 0.4, 0, Math.PI * 2);
                ctx.fill();
                // Gloves
                fillCircle(ctx, 6, 12, 2, C.white);
                fillCircle(ctx, 26, 12, 2, C.white);
            } else {
                // Arms at sides
                fillEllipse(ctx, 8, 21, 2.5, 3, C.marioSkin);
                fillEllipse(ctx, 24, 21, 2.5, 3, C.marioSkin);
            }

            // === LEGS / SHOES ===
            if (pose === 'run1') {
                // Legs apart: left forward, right back
                fillRoundRect(ctx, 8, 25, 7, 4, 2, C.marioBlue);
                fillRoundRect(ctx, 17, 25, 7, 4, 2, C.marioBlue);
                // Shoes
                fillRoundRect(ctx, 7, 28, 8, 4, 2, C.marioBrown);
                fillRoundRect(ctx, 18, 28, 8, 4, 2, C.marioBrown);
            } else if (pose === 'run2') {
                // Legs together
                fillRoundRect(ctx, 11, 25, 10, 4, 2, C.marioBlue);
                fillRoundRect(ctx, 10, 28, 12, 4, 2, C.marioBrown);
            } else if (pose === 'jump') {
                // Legs tucked
                fillRoundRect(ctx, 9, 25, 6, 4, 2, C.marioBlue);
                fillRoundRect(ctx, 17, 25, 6, 4, 2, C.marioBlue);
                fillRoundRect(ctx, 8, 28, 7, 4, 2, C.marioBrown);
                fillRoundRect(ctx, 18, 28, 7, 4, 2, C.marioBrown);
            } else {
                // Idle / death standing
                fillRoundRect(ctx, 9, 25, 6, 4, 2, C.marioBlue);
                fillRoundRect(ctx, 17, 25, 6, 4, 2, C.marioBlue);
                fillRoundRect(ctx, 8, 28, 7, 4, 2, C.marioBrown);
                fillRoundRect(ctx, 18, 28, 7, 4, 2, C.marioBrown);
            }

            // Shoe highlights
            if (pose !== 'run2') {
                fillCircle(ctx, 11, 29, 1, C.earthBrownLight);
                fillCircle(ctx, 22, 29, 1, C.earthBrownLight);
            } else {
                fillCircle(ctx, 16, 29, 1, C.earthBrownLight);
            }

            ctx.restore();
        }

        // Frame 0: idle
        drawSmallMario(0, 'idle');
        addOutline(ctx, 0, 0, frameW, frameH);
        // Frame 1: run1
        drawSmallMario(frameW, 'run1');
        addOutline(ctx, frameW, 0, frameW, frameH);
        // Frame 2: run2
        drawSmallMario(frameW * 2, 'run2');
        addOutline(ctx, frameW * 2, 0, frameW, frameH);
        // Frame 3: jump
        drawSmallMario(frameW * 3, 'jump');
        addOutline(ctx, frameW * 3, 0, frameW, frameH);
        // Frame 4: death
        drawSmallMario(frameW * 4, 'death');
        addOutline(ctx, frameW * 4, 0, frameW, frameH);

        scene.textures.addSpriteSheet('mario', canvas, {
            frameWidth: frameW,
            frameHeight: frameH
        });
    }

    // ========================================
    // 1b. BIG MARIO (32x64, 4 frames)
    // ========================================
    function generateBigMario(scene) {
        var frameW = 128, frameH = 256;
        var numFrames = 4;
        var canvas = makeCanvas(frameW * numFrames, frameH);
        var ctx = canvas.getContext('2d');

        function drawBigMario(ox, pose) {
            ctx.save();
            ctx.translate(ox, 0);
            ctx.scale(4, 4);

            // === HAT ===
            var hatGrad = ctx.createLinearGradient(0, 2, 0, 14);
            hatGrad.addColorStop(0, C.marioRedBright);
            hatGrad.addColorStop(1, C.marioRedDark);
            ctx.fillStyle = hatGrad;
            roundRect(ctx, 6, 2, 20, 10, 4);
            ctx.fill();
            // Brim
            fillRoundRect(ctx, 4, 10, 16, 4, 2, C.marioRedDark);
            // Hat 'M' emblem circle
            fillCircle(ctx, 16, 6, 3, C.white);
            ctx.fillStyle = C.marioRed;
            ctx.font = 'bold 5px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('M', 16, 7);

            // === FACE ===
            var faceGrad = ctx.createRadialGradient(16, 18, 1, 16, 18, 9);
            faceGrad.addColorStop(0, C.marioSkinLight);
            faceGrad.addColorStop(1, C.marioSkinDark);
            fillEllipse(ctx, 16, 18, 9, 7, C.marioSkin);
            ctx.fillStyle = faceGrad;
            ctx.beginPath();
            ctx.ellipse(16, 18, 9, 7, 0, 0, Math.PI * 2);
            ctx.fill();

            // Hair / sideburns
            fillEllipse(ctx, 7, 17, 3, 5, C.marioBrown);
            fillEllipse(ctx, 25, 17, 2.5, 4, C.marioBrown);

            // Eyes
            fillEllipse(ctx, 12, 16, 3, 2.5, C.white);
            fillEllipse(ctx, 20, 16, 3, 2.5, C.white);
            fillCircle(ctx, 13, 16, 1.5, C.black);
            fillCircle(ctx, 21, 16, 1.5, C.black);
            fillCircle(ctx, 12.5, 15, 0.7, C.white);
            fillCircle(ctx, 20.5, 15, 0.7, C.white);

            // Nose
            fillEllipse(ctx, 16, 20, 2.5, 2, '#E08040');

            // Mustache
            ctx.fillStyle = C.marioBrown;
            ctx.beginPath();
            ctx.moveTo(8, 22);
            ctx.quadraticCurveTo(12, 26, 16, 23);
            ctx.quadraticCurveTo(20, 26, 24, 22);
            ctx.quadraticCurveTo(20, 24, 16, 24);
            ctx.quadraticCurveTo(12, 24, 8, 22);
            ctx.fill();

            // === BODY (shirt) ===
            var bodyGrad = ctx.createLinearGradient(0, 26, 0, 38);
            bodyGrad.addColorStop(0, C.marioRedBright);
            bodyGrad.addColorStop(1, C.marioRedDark);
            ctx.fillStyle = bodyGrad;
            roundRect(ctx, 7, 26, 18, 12, 3);
            ctx.fill();

            // Overalls
            var overGrad = ctx.createLinearGradient(0, 34, 0, 50);
            overGrad.addColorStop(0, C.marioBlue);
            overGrad.addColorStop(1, C.marioBlueDark);
            ctx.fillStyle = overGrad;
            roundRect(ctx, 8, 34, 16, 14, 2);
            ctx.fill();
            // Straps
            fillRoundRect(ctx, 10, 28, 4, 8, 1, C.marioBlue);
            fillRoundRect(ctx, 18, 28, 4, 8, 1, C.marioBlue);
            // Buttons
            fillCircle(ctx, 12, 36, 1.5, '#F8D830');
            fillCircle(ctx, 20, 36, 1.5, '#F8D830');

            // === ARMS ===
            if (pose === 'jump') {
                // Arms raised
                ctx.fillStyle = C.marioSkin;
                ctx.beginPath();
                ctx.ellipse(5, 22, 3, 6, -0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(27, 22, 3, 6, 0.3, 0, Math.PI * 2);
                ctx.fill();
                fillCircle(ctx, 3, 18, 2.5, C.white);
                fillCircle(ctx, 29, 18, 2.5, C.white);
            } else {
                // Arms at sides
                fillEllipse(ctx, 5, 34, 3, 5, C.marioSkin);
                fillEllipse(ctx, 27, 34, 3, 5, C.marioSkin);
                // Gloves
                fillCircle(ctx, 5, 38, 2.5, C.white);
                fillCircle(ctx, 27, 38, 2.5, C.white);
            }

            // === LEGS ===
            if (pose === 'run1') {
                fillRoundRect(ctx, 7, 48, 8, 8, 2, C.marioBlue);
                fillRoundRect(ctx, 17, 48, 8, 8, 2, C.marioBlue);
                fillRoundRect(ctx, 5, 54, 10, 5, 2.5, C.marioBrown);
                fillRoundRect(ctx, 17, 54, 10, 5, 2.5, C.marioBrown);
                fillCircle(ctx, 10, 55, 1.2, C.earthBrownLight);
                fillCircle(ctx, 22, 55, 1.2, C.earthBrownLight);
            } else if (pose === 'run2') {
                fillRoundRect(ctx, 10, 48, 12, 8, 2, C.marioBlue);
                fillRoundRect(ctx, 8, 54, 16, 5, 2.5, C.marioBrown);
                fillCircle(ctx, 16, 55, 1.2, C.earthBrownLight);
            } else if (pose === 'jump') {
                fillRoundRect(ctx, 6, 48, 8, 7, 2, C.marioBlue);
                fillRoundRect(ctx, 18, 48, 8, 7, 2, C.marioBlue);
                fillRoundRect(ctx, 4, 53, 10, 5, 2.5, C.marioBrown);
                fillRoundRect(ctx, 18, 53, 10, 5, 2.5, C.marioBrown);
            } else {
                // Idle
                fillRoundRect(ctx, 8, 48, 7, 8, 2, C.marioBlue);
                fillRoundRect(ctx, 17, 48, 7, 8, 2, C.marioBlue);
                fillRoundRect(ctx, 6, 54, 9, 5, 2.5, C.marioBrown);
                fillRoundRect(ctx, 17, 54, 9, 5, 2.5, C.marioBrown);
                fillCircle(ctx, 10, 55, 1.2, C.earthBrownLight);
                fillCircle(ctx, 21, 55, 1.2, C.earthBrownLight);
            }

            ctx.restore();
        }

        drawBigMario(0, 'idle');
        addOutline(ctx, 0, 0, frameW, frameH);
        drawBigMario(frameW, 'run1');
        addOutline(ctx, frameW, 0, frameW, frameH);
        drawBigMario(frameW * 2, 'run2');
        addOutline(ctx, frameW * 2, 0, frameW, frameH);
        drawBigMario(frameW * 3, 'jump');
        addOutline(ctx, frameW * 3, 0, frameW, frameH);

        scene.textures.addSpriteSheet('mario-big', canvas, {
            frameWidth: frameW,
            frameHeight: frameH
        });
    }

    // ========================================
    // 2. TILES SPRITESHEET (32x32, 16 tiles)
    // ========================================
    function generateTiles(scene) {
        var T = 32;
        var canvas = makeCanvas(T * 2 * 16, T * 2);
        var ctx = canvas.getContext('2d');

        ctx.save();
        ctx.scale(2, 2);

        // --- Tile 0: Empty/transparent ---

        // --- Tile 1: Grass top ---
        (function () {
            var ox = T * 1;
            // Earth base with smoother gradient
            var earthGrad = ctx.createLinearGradient(ox, T * 0.4, ox, T);
            earthGrad.addColorStop(0, C.earthBrownLight);
            earthGrad.addColorStop(0.3, C.earthBrown);
            earthGrad.addColorStop(0.7, C.earthBrown);
            earthGrad.addColorStop(1, C.earthBrownDark);
            ctx.fillStyle = earthGrad;
            ctx.fillRect(ox, Math.floor(T * 0.35), T, Math.ceil(T * 0.65));

            // Subtle mortar lines on earth
            ctx.strokeStyle = 'rgba(232,160,96,0.3)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(ox, T * 0.55); ctx.lineTo(ox + T, T * 0.55);
            ctx.moveTo(ox, T * 0.75); ctx.lineTo(ox + T, T * 0.75);
            ctx.moveTo(ox + T * 0.5, T * 0.35); ctx.lineTo(ox + T * 0.5, T * 0.55);
            ctx.moveTo(ox + T * 0.25, T * 0.55); ctx.lineTo(ox + T * 0.25, T * 0.75);
            ctx.moveTo(ox + T * 0.75, T * 0.55); ctx.lineTo(ox + T * 0.75, T * 0.75);
            ctx.stroke();

            // Green grass with gradient
            var grassGrad = ctx.createLinearGradient(ox, 0, ox, T * 0.4);
            grassGrad.addColorStop(0, '#70FF70');
            grassGrad.addColorStop(0.3, C.grassGreen);
            grassGrad.addColorStop(0.7, C.grassGreenMid);
            grassGrad.addColorStop(1, C.grassGreenDark);
            ctx.fillStyle = grassGrad;
            ctx.fillRect(ox, 0, T, Math.ceil(T * 0.4));

            // Wavy grass top edge
            ctx.fillStyle = '#80FF80';
            ctx.beginPath();
            ctx.moveTo(ox, 2);
            for (var gx = 0; gx <= T; gx += 4) {
                ctx.quadraticCurveTo(ox + gx + 2, gx % 8 === 0 ? 0 : 3, ox + gx + 4, 2);
            }
            ctx.lineTo(ox + T, 4);
            ctx.lineTo(ox, 4);
            ctx.fill();
        })();

        // --- Tile 2: Earth body ---
        (function () {
            var ox = T * 2;
            var earthGrad = ctx.createLinearGradient(ox, 0, ox, T);
            earthGrad.addColorStop(0, C.earthBrownLight);
            earthGrad.addColorStop(0.5, C.earthBrown);
            earthGrad.addColorStop(1, C.earthBrownDark);
            ctx.fillStyle = earthGrad;
            ctx.fillRect(ox, 0, T, T);

            // Brick mortar pattern
            ctx.strokeStyle = C.mortar;
            ctx.lineWidth = 1;
            ctx.beginPath();
            // Horizontal lines
            ctx.moveTo(ox, T * 0.5); ctx.lineTo(ox + T, T * 0.5);
            // Vertical lines (offset per row)
            ctx.moveTo(ox + T * 0.5, 0); ctx.lineTo(ox + T * 0.5, T * 0.5);
            ctx.moveTo(ox, T * 0.5); ctx.lineTo(ox, T);
            ctx.moveTo(ox + T * 0.25, T * 0.5); ctx.lineTo(ox + T * 0.25, T);
            ctx.moveTo(ox + T * 0.75, T * 0.5); ctx.lineTo(ox + T * 0.75, T);
            ctx.stroke();

            // Subtle highlight on top of each brick
            ctx.fillStyle = 'rgba(255,200,140,0.2)';
            ctx.fillRect(ox + 1, 1, T * 0.5 - 2, 2);
            ctx.fillRect(ox + T * 0.5 + 1, 1, T * 0.5 - 2, 2);
            ctx.fillRect(ox + 1, T * 0.5 + 1, T * 0.25 - 2, 2);
            ctx.fillRect(ox + T * 0.25 + 1, T * 0.5 + 1, T * 0.5 - 2, 2);
            ctx.fillRect(ox + T * 0.75 + 1, T * 0.5 + 1, T * 0.25 - 2, 2);
        })();

        // --- Tile 3: Brick block ---
        (function () {
            var ox = T * 3;
            // Base with smoother gradient
            var brickGrad = ctx.createLinearGradient(ox, 0, ox, T);
            brickGrad.addColorStop(0, '#E07040');
            brickGrad.addColorStop(0.2, '#D86838');
            brickGrad.addColorStop(0.5, C.brick);
            brickGrad.addColorStop(0.8, '#B04010');
            brickGrad.addColorStop(1, C.brickDark);
            ctx.fillStyle = brickGrad;
            roundRect(ctx, ox, 0, T, T, 2);
            ctx.fill();

            // Mortar grid
            ctx.strokeStyle = C.mortar;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(ox, T * 0.5); ctx.lineTo(ox + T, T * 0.5);
            ctx.moveTo(ox + T * 0.5, 0); ctx.lineTo(ox + T * 0.5, T * 0.5);
            ctx.moveTo(ox + T * 0.25, T * 0.5); ctx.lineTo(ox + T * 0.25, T);
            ctx.moveTo(ox + T * 0.75, T * 0.5); ctx.lineTo(ox + T * 0.75, T);
            ctx.stroke();

            // Highlight top edge of each brick (emboss top)
            ctx.fillStyle = 'rgba(255,200,130,0.45)';
            ctx.fillRect(ox + 1, 1, T * 0.5 - 2, 2);
            ctx.fillRect(ox + T * 0.5 + 1, 1, T * 0.5 - 2, 2);
            ctx.fillRect(ox + 1, T * 0.5 + 1, T * 0.25 - 2, 2);
            ctx.fillRect(ox + T * 0.25 + 1, T * 0.5 + 1, T * 0.5 - 2, 2);
            ctx.fillRect(ox + T * 0.75 + 1, T * 0.5 + 1, T * 0.25 - 2, 2);

            // Highlight left edge of each brick (emboss left)
            ctx.fillStyle = 'rgba(255,180,100,0.25)';
            ctx.fillRect(ox + 1, 1, 1.5, T * 0.5 - 2);
            ctx.fillRect(ox + T * 0.5 + 1, 1, 1.5, T * 0.5 - 2);
            ctx.fillRect(ox + 1, T * 0.5 + 1, 1.5, T * 0.5 - 2);
            ctx.fillRect(ox + T * 0.25 + 1, T * 0.5 + 1, 1.5, T * 0.5 - 2);
            ctx.fillRect(ox + T * 0.75 + 1, T * 0.5 + 1, 1.5, T * 0.5 - 2);

            // Shadow bottom edge of each brick (emboss bottom)
            ctx.fillStyle = 'rgba(80,30,0,0.35)';
            ctx.fillRect(ox + 1, T * 0.5 - 2, T * 0.5 - 2, 1.5);
            ctx.fillRect(ox + T * 0.5 + 1, T * 0.5 - 2, T * 0.5 - 2, 1.5);
            ctx.fillRect(ox + 1, T - 2, T - 2, 1.5);

            // Shadow right edge of each brick (emboss right)
            ctx.fillStyle = 'rgba(80,30,0,0.2)';
            ctx.fillRect(ox + T * 0.5 - 1.5, 1, 1.5, T * 0.5 - 2);
            ctx.fillRect(ox + T - 1.5, 1, 1.5, T * 0.5 - 2);
            ctx.fillRect(ox + T * 0.25 - 1.5, T * 0.5 + 1, 1.5, T * 0.5 - 2);
            ctx.fillRect(ox + T * 0.75 - 1.5, T * 0.5 + 1, 1.5, T * 0.5 - 2);
            ctx.fillRect(ox + T - 1.5, T * 0.5 + 1, 1.5, T * 0.5 - 2);

            // Outer bevel
            ctx.strokeStyle = '#F0A060';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(ox, T); ctx.lineTo(ox, 0); ctx.lineTo(ox + T, 0);
            ctx.stroke();
            ctx.strokeStyle = '#602000';
            ctx.beginPath();
            ctx.moveTo(ox + T, 0); ctx.lineTo(ox + T, T); ctx.lineTo(ox, T);
            ctx.stroke();
        })();

        // --- Tile 4: Question block ---
        (function () {
            var ox = T * 4;
            // Golden gradient base with smoother transitions
            var qGrad = ctx.createLinearGradient(ox, 0, ox, T);
            qGrad.addColorStop(0, '#FFF8C0');
            qGrad.addColorStop(0.15, C.questionLight);
            qGrad.addColorStop(0.35, '#F8C840');
            qGrad.addColorStop(0.6, C.questionGold);
            qGrad.addColorStop(0.85, '#C08820');
            qGrad.addColorStop(1, C.questionDark);
            ctx.fillStyle = qGrad;
            roundRect(ctx, ox, 0, T, T, 3);
            ctx.fill();

            // Inner bevel - brighter top-left
            ctx.strokeStyle = 'rgba(255,255,220,0.7)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(ox + 2, T - 2);
            ctx.lineTo(ox + 2, 2);
            ctx.lineTo(ox + T - 2, 2);
            ctx.stroke();
            // Inner bevel - darker bottom-right
            ctx.strokeStyle = 'rgba(100,60,0,0.55)';
            ctx.beginPath();
            ctx.moveTo(ox + T - 2, 2);
            ctx.lineTo(ox + T - 2, T - 2);
            ctx.lineTo(ox + 2, T - 2);
            ctx.stroke();

            // Corner rivets with highlight
            fillCircle(ctx, ox + 5, 5, 2, C.questionLight);
            fillCircle(ctx, ox + 5, 5, 1, 'rgba(255,255,255,0.5)');
            fillCircle(ctx, ox + T - 5, 5, 2, C.questionLight);
            fillCircle(ctx, ox + T - 5, 5, 1, 'rgba(255,255,255,0.5)');
            fillCircle(ctx, ox + 5, T - 5, 2, C.questionDark);
            fillCircle(ctx, ox + T - 5, T - 5, 2, C.questionDark);

            // "?" character - bolder with stronger shadow and outline
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Dark outline (drawn in 4 directions)
            ctx.fillStyle = 'rgba(80,40,0,0.6)';
            ctx.fillText('?', ox + T / 2 - 1, T / 2 + 1);
            ctx.fillText('?', ox + T / 2 + 2, T / 2 + 1);
            ctx.fillText('?', ox + T / 2 + 0.5, T / 2);
            ctx.fillText('?', ox + T / 2 + 0.5, T / 2 + 3);
            // Shadow
            ctx.fillStyle = C.questionDark;
            ctx.fillText('?', ox + T / 2 + 1, T / 2 + 2);
            // Main
            ctx.fillStyle = C.white;
            ctx.fillText('?', ox + T / 2, T / 2 + 1);

            // Shine spot
            var shine = ctx.createRadialGradient(ox + 8, 8, 0, ox + 8, 8, 8);
            shine.addColorStop(0, 'rgba(255,255,255,0.6)');
            shine.addColorStop(0.5, 'rgba(255,255,255,0.2)');
            shine.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = shine;
            ctx.fillRect(ox, 0, T, T);
        })();

        // --- Tile 5: Used/empty block ---
        (function () {
            var ox = T * 5;
            var uGrad = ctx.createLinearGradient(ox, 0, ox, T);
            uGrad.addColorStop(0, '#997755');
            uGrad.addColorStop(0.5, '#775533');
            uGrad.addColorStop(1, '#554422');
            ctx.fillStyle = uGrad;
            roundRect(ctx, ox, 0, T, T, 2);
            ctx.fill();

            // Bevel
            ctx.strokeStyle = '#997755';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(ox + 1, T - 1); ctx.lineTo(ox + 1, 1); ctx.lineTo(ox + T - 1, 1);
            ctx.stroke();
            ctx.strokeStyle = '#443322';
            ctx.beginPath();
            ctx.moveTo(ox + T - 1, 1); ctx.lineTo(ox + T - 1, T - 1); ctx.lineTo(ox + 1, T - 1);
            ctx.stroke();

            // Corner dots
            fillCircle(ctx, ox + 5, 5, 1.5, '#554422');
            fillCircle(ctx, ox + T - 5, 5, 1.5, '#554422');
            fillCircle(ctx, ox + 5, T - 5, 1.5, '#443311');
            fillCircle(ctx, ox + T - 5, T - 5, 1.5, '#443311');
        })();

        // --- Tile 6: Pipe top-left ---
        (function () {
            var ox = T * 6;
            // Lip (top 10px)
            var lipGrad = ctx.createLinearGradient(ox, 0, ox + T, 0);
            lipGrad.addColorStop(0, C.pipeHighlight);
            lipGrad.addColorStop(0.15, C.pipeLight);
            lipGrad.addColorStop(0.5, C.pipeGreen);
            lipGrad.addColorStop(1, C.pipeDark);
            ctx.fillStyle = lipGrad;
            roundRect(ctx, ox, 0, T, 10, 3);
            ctx.fill();

            // Body
            var bodyGrad = ctx.createLinearGradient(ox, 0, ox + T, 0);
            bodyGrad.addColorStop(0, C.pipeHighlight);
            bodyGrad.addColorStop(0.12, C.pipeLight);
            bodyGrad.addColorStop(0.3, C.pipeGreen);
            bodyGrad.addColorStop(0.9, C.pipeDark);
            bodyGrad.addColorStop(1, '#106010');
            ctx.fillStyle = bodyGrad;
            ctx.fillRect(ox, 10, T, T - 10);

            // Rim shadow under lip
            ctx.fillStyle = 'rgba(0,60,0,0.4)';
            ctx.fillRect(ox, 10, T, 2);

            // Lip top highlight
            ctx.fillStyle = 'rgba(180,255,180,0.4)';
            ctx.fillRect(ox, 0, T, 2);
        })();

        // --- Tile 7: Pipe top-right ---
        (function () {
            var ox = T * 7;
            var lipGrad = ctx.createLinearGradient(ox, 0, ox + T, 0);
            lipGrad.addColorStop(0, C.pipeLight);
            lipGrad.addColorStop(0.5, C.pipeGreen);
            lipGrad.addColorStop(0.85, C.pipeDark);
            lipGrad.addColorStop(1, '#106010');
            ctx.fillStyle = lipGrad;
            roundRect(ctx, ox, 0, T, 10, 3);
            ctx.fill();

            var bodyGrad = ctx.createLinearGradient(ox, 0, ox + T, 0);
            bodyGrad.addColorStop(0, C.pipeLight);
            bodyGrad.addColorStop(0.1, C.pipeGreen);
            bodyGrad.addColorStop(0.7, C.pipeGreen);
            bodyGrad.addColorStop(0.88, C.pipeDark);
            bodyGrad.addColorStop(1, '#106010');
            ctx.fillStyle = bodyGrad;
            ctx.fillRect(ox, 10, T, T - 10);

            ctx.fillStyle = 'rgba(0,60,0,0.4)';
            ctx.fillRect(ox, 10, T, 2);
            ctx.fillStyle = 'rgba(180,255,180,0.4)';
            ctx.fillRect(ox, 0, T, 2);
        })();

        // --- Tile 8: Pipe body-left ---
        (function () {
            var ox = T * 8;
            var grad = ctx.createLinearGradient(ox, 0, ox + T, 0);
            grad.addColorStop(0, C.pipeHighlight);
            grad.addColorStop(0.12, C.pipeLight);
            grad.addColorStop(0.3, C.pipeGreen);
            grad.addColorStop(0.9, C.pipeDark);
            grad.addColorStop(1, '#106010');
            ctx.fillStyle = grad;
            ctx.fillRect(ox, 0, T, T);
        })();

        // --- Tile 9: Pipe body-right ---
        (function () {
            var ox = T * 9;
            var grad = ctx.createLinearGradient(ox, 0, ox + T, 0);
            grad.addColorStop(0, C.pipeLight);
            grad.addColorStop(0.1, C.pipeGreen);
            grad.addColorStop(0.7, C.pipeGreen);
            grad.addColorStop(0.88, C.pipeDark);
            grad.addColorStop(1, '#106010');
            ctx.fillStyle = grad;
            ctx.fillRect(ox, 0, T, T);
        })();

        // --- Tile 10: Underground brick (dark) ---
        (function () {
            var ox = T * 10;
            var dGrad = ctx.createLinearGradient(ox, 0, ox, T);
            dGrad.addColorStop(0, '#445588');
            dGrad.addColorStop(0.5, '#334466');
            dGrad.addColorStop(1, '#222244');
            ctx.fillStyle = dGrad;
            roundRect(ctx, ox, 0, T, T, 2);
            ctx.fill();

            // Mortar
            ctx.strokeStyle = '#556699';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(ox, T * 0.5); ctx.lineTo(ox + T, T * 0.5);
            ctx.moveTo(ox + T * 0.5, 0); ctx.lineTo(ox + T * 0.5, T * 0.5);
            ctx.moveTo(ox + T * 0.25, T * 0.5); ctx.lineTo(ox + T * 0.25, T);
            ctx.moveTo(ox + T * 0.75, T * 0.5); ctx.lineTo(ox + T * 0.75, T);
            ctx.stroke();

            // Bevel
            ctx.strokeStyle = '#556699';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(ox, T); ctx.lineTo(ox, 0); ctx.lineTo(ox + T, 0);
            ctx.stroke();
            ctx.strokeStyle = '#111133';
            ctx.beginPath();
            ctx.moveTo(ox + T, 0); ctx.lineTo(ox + T, T); ctx.lineTo(ox, T);
            ctx.stroke();
        })();

        // --- Tile 11: Stone platform ---
        (function () {
            var ox = T * 11;
            var stGrad = ctx.createLinearGradient(ox, 0, ox, T);
            stGrad.addColorStop(0, '#888888');
            stGrad.addColorStop(0.5, '#666666');
            stGrad.addColorStop(1, '#444444');
            ctx.fillStyle = stGrad;
            roundRect(ctx, ox, 0, T, T, 2);
            ctx.fill();

            // Bevel highlight
            ctx.strokeStyle = '#999999';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(ox + 1, T - 1); ctx.lineTo(ox + 1, 1); ctx.lineTo(ox + T - 1, 1);
            ctx.stroke();
            ctx.strokeStyle = '#333333';
            ctx.beginPath();
            ctx.moveTo(ox + T - 1, 1); ctx.lineTo(ox + T - 1, T - 1); ctx.lineTo(ox + 1, T - 1);
            ctx.stroke();

            // Segment line
            ctx.strokeStyle = 'rgba(100,100,100,0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(ox + T * 0.5, 2); ctx.lineTo(ox + T * 0.5, T - 2);
            ctx.stroke();

            // Surface cracks
            ctx.strokeStyle = 'rgba(80,80,80,0.4)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(ox + 6, 10); ctx.lineTo(ox + 12, 11);
            ctx.moveTo(ox + 20, 20); ctx.lineTo(ox + 28, 21);
            ctx.stroke();
        })();

        // --- Tile 12: Cloud platform left ---
        (function () {
            var ox = T * 12;
            // Puff
            fillCircle(ctx, ox + 16, 12, 10, C.white);
            ctx.fillStyle = C.white;
            ctx.fillRect(ox + 8, 10, T - 8, T - 14);
            // Shadow
            fillCircle(ctx, ox + 16, 20, 10, '#C0D8FF');
            ctx.fillStyle = '#C0D8FF';
            ctx.fillRect(ox + 8, T - 8, T - 8, 4);
            // Bright top
            var cShine = ctx.createRadialGradient(ox + 14, 8, 0, ox + 14, 8, 8);
            cShine.addColorStop(0, '#F8FCFF');
            cShine.addColorStop(1, 'rgba(248,252,255,0)');
            ctx.fillStyle = cShine;
            fillCircle(ctx, ox + 14, 8, 7, '#F8FCFF');
        })();

        // --- Tile 13: Cloud platform middle ---
        (function () {
            var ox = T * 13;
            ctx.fillStyle = C.white;
            ctx.fillRect(ox, 6, T, T - 10);
            fillCircle(ctx, ox + 16, 8, 12, C.white);
            ctx.fillStyle = '#C0D8FF';
            ctx.fillRect(ox, T - 6, T, 4);
            fillCircle(ctx, ox + 14, 4, 8, '#F8FCFF');
        })();

        // --- Tile 14: Cloud platform right ---
        (function () {
            var ox = T * 14;
            fillCircle(ctx, ox + 16, 12, 10, C.white);
            ctx.fillStyle = C.white;
            ctx.fillRect(ox, 10, T - 8, T - 14);
            ctx.fillStyle = '#C0D8FF';
            ctx.fillRect(ox, T - 6, T - 8, 4);
            fillCircle(ctx, ox + 18, 8, 6, '#F8FCFF');
        })();

        // --- Tile 15: Invisible platform ---
        (function () {
            var ox = T * 15;
            ctx.fillStyle = 'rgba(255,255,255,0.12)';
            for (var dy = 0; dy < T; dy += 6) {
                for (var dx = 0; dx < T; dx += 6) {
                    if ((dx + dy) % 12 === 0) {
                        fillCircle(ctx, ox + dx + 1, dy + 1, 1, 'rgba(255,255,255,0.15)');
                    }
                }
            }
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.fillRect(ox, 0, T, 2);
        })();

        ctx.restore();

        scene.textures.addSpriteSheet('tiles', canvas, {
            frameWidth: T * 2,
            frameHeight: T * 2
        });
    }

    // ========================================
    // 3. COIN (16x16, 4 frames)
    // ========================================
    function generateCoin(scene) {
        var frameW = 64, frameH = 64;
        var numFrames = 4;
        var canvas = makeCanvas(frameW * numFrames, frameH);
        var ctx = canvas.getContext('2d');

        function drawCoinFrame(ox, widthScale) {
            ctx.save();
            ctx.translate(ox, 0);
            ctx.scale(4, 4);
            var cx = 8;
            var cy = 8;
            var rx = 6 * widthScale;
            var ry = 6;

            if (rx < 1) rx = 1;

            // Outer ring (dark gold)
            var outerGrad = ctx.createRadialGradient(cx, cy - 1, 0, cx, cy, ry + 1);
            outerGrad.addColorStop(0, C.coinLight);
            outerGrad.addColorStop(0.6, C.coinYellow);
            outerGrad.addColorStop(1, C.coinDark);
            ctx.fillStyle = outerGrad;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx + 1, ry + 1, 0, 0, Math.PI * 2);
            ctx.fill();

            // Inner face (bright gold)
            var innerGrad = ctx.createRadialGradient(cx - rx * 0.2, cy - 1, 0, cx, cy, ry);
            innerGrad.addColorStop(0, '#FFFFF0');
            innerGrad.addColorStop(0.3, C.coinLight);
            innerGrad.addColorStop(0.7, C.coinYellow);
            innerGrad.addColorStop(1, '#B89820');
            ctx.fillStyle = innerGrad;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();

            // Shine highlight
            if (widthScale > 0.3) {
                var shineGrad = ctx.createRadialGradient(cx - rx * 0.3, cy - 2, 0, cx - rx * 0.3, cy - 2, 3);
                shineGrad.addColorStop(0, 'rgba(255,255,255,0.7)');
                shineGrad.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.fillStyle = shineGrad;
                ctx.beginPath();
                ctx.ellipse(cx - rx * 0.3, cy - 2, rx * 0.4, 2.5, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        // Frame 0: full circle
        drawCoinFrame(0, 1.0);
        // Frame 1: 3/4 width
        drawCoinFrame(frameW, 0.65);
        // Frame 2: edge-on thin
        drawCoinFrame(frameW * 2, 0.15);
        // Frame 3: 3/4 reversed
        drawCoinFrame(frameW * 3, 0.65);

        scene.textures.addSpriteSheet('coin', canvas, {
            frameWidth: frameW,
            frameHeight: frameH
        });
    }

    // ========================================
    // 4. GOOMBA (32x32, 3 frames)
    // ========================================
    function generateGoomba(scene) {
        var frameW = 128, frameH = 128;
        var numFrames = 3;
        var canvas = makeCanvas(frameW * numFrames, frameH);
        var ctx = canvas.getContext('2d');

        function drawGoomba(ox, pose) {
            ctx.save();
            ctx.translate(ox, 0);
            ctx.scale(4, 4);

            if (pose === 'squished') {
                // Flat squished goomba
                var sqGrad = ctx.createLinearGradient(0, 22, 0, 30);
                sqGrad.addColorStop(0, C.goombaBrown);
                sqGrad.addColorStop(1, C.goombaBrownDark);
                ctx.fillStyle = sqGrad;
                fillEllipse(ctx, 16, 26, 13, 4, C.goombaBrown);

                // Squished eyes (angry, flat)
                fillEllipse(ctx, 10, 25, 2, 1.5, C.white);
                fillEllipse(ctx, 22, 25, 2, 1.5, C.white);
                fillCircle(ctx, 11, 25, 0.8, C.black);
                fillCircle(ctx, 23, 25, 0.8, C.black);

                // Squished frown
                ctx.strokeStyle = C.goombaTan;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(13, 28);
                ctx.lineTo(19, 28);
                ctx.stroke();

                ctx.restore();
                return;
            }

            // Head (mushroom cap shape)
            var headGrad = ctx.createRadialGradient(16, 10, 2, 16, 12, 13);
            headGrad.addColorStop(0, '#C07040');
            headGrad.addColorStop(0.7, C.goombaBrown);
            headGrad.addColorStop(1, C.goombaBrownDark);
            ctx.fillStyle = headGrad;
            ctx.beginPath();
            ctx.moveTo(3, 18);
            ctx.quadraticCurveTo(3, 2, 16, 1);
            ctx.quadraticCurveTo(29, 2, 29, 18);
            ctx.lineTo(3, 18);
            ctx.fill();

            // Eyes
            fillEllipse(ctx, 10, 11, 3.5, 3, C.white);
            fillEllipse(ctx, 22, 11, 3.5, 3, C.white);
            // Pupils
            fillCircle(ctx, 11, 12, 1.8, C.black);
            fillCircle(ctx, 23, 12, 1.8, C.black);
            // Eye highlights
            fillCircle(ctx, 10, 10, 0.8, C.white);
            fillCircle(ctx, 22, 10, 0.8, C.white);

            // Angry eyebrows
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(6, 8);
            ctx.lineTo(12, 7);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(26, 8);
            ctx.lineTo(20, 7);
            ctx.stroke();

            // Mouth/Fang area
            var mouthGrad = ctx.createLinearGradient(0, 15, 0, 20);
            mouthGrad.addColorStop(0, C.goombaTan);
            mouthGrad.addColorStop(1, '#E0C8A0');
            ctx.fillStyle = mouthGrad;
            ctx.beginPath();
            ctx.moveTo(8, 15);
            ctx.quadraticCurveTo(16, 22, 24, 15);
            ctx.quadraticCurveTo(16, 20, 8, 15);
            ctx.fill();

            // Fang line
            ctx.strokeStyle = C.goombaBrownDark;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(14, 16); ctx.lineTo(14, 18);
            ctx.moveTo(18, 16); ctx.lineTo(18, 18);
            ctx.stroke();

            // Body/Feet
            var footY = 24;
            var footOff = (pose === 'walk2') ? 1 : -1;
            // Left foot
            fillEllipse(ctx, 10 + footOff, footY + 4, 5, 4, '#654321');
            fillEllipse(ctx, 10 + footOff, footY + 5, 5, 3, '#543210');
            // Right foot
            fillEllipse(ctx, 22 - footOff, footY + 4, 5, 4, '#654321');
            fillEllipse(ctx, 22 - footOff, footY + 5, 5, 3, '#543210');

            ctx.restore();
        }

        drawGoomba(0, 'walk1');
        addOutline(ctx, 0, 0, frameW, frameH);
        drawGoomba(frameW, 'walk2');
        addOutline(ctx, frameW, 0, frameW, frameH);
        drawGoomba(frameW * 2, 'squished');
        addOutline(ctx, frameW * 2, 0, frameW, frameH);

        scene.textures.addSpriteSheet('goomba', canvas, {
            frameWidth: frameW,
            frameHeight: frameH
        });
    }

    // ========================================
    // 5. KOOPA (32x48, 4 frames)
    // ========================================
    function generateKoopa(scene) {
        var frameW = 128, frameH = 192;
        var numFrames = 4;
        var canvas = makeCanvas(frameW * numFrames, frameH);
        var ctx = canvas.getContext('2d');

        function drawKoopa(ox, pose) {
            ctx.save();
            ctx.translate(ox, 0);
            ctx.scale(4, 4);

            if (pose === 'shell' || pose === 'shell-spin') {
                // Shell only (centered vertically)
                var sy = 14;
                var shellGrad = ctx.createRadialGradient(16, sy + 10, 2, 16, sy + 10, 14);
                shellGrad.addColorStop(0, C.koopaGreenLight);
                shellGrad.addColorStop(0.6, C.koopaGreen);
                shellGrad.addColorStop(1, C.koopaGreenDark);
                ctx.fillStyle = shellGrad;
                ctx.beginPath();
                ctx.ellipse(16, sy + 10, 13, 10, 0, 0, Math.PI * 2);
                ctx.fill();

                // Shell pattern (hexagonal lines)
                ctx.strokeStyle = 'rgba(0,80,0,0.4)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(8, sy + 6); ctx.lineTo(24, sy + 6);
                ctx.moveTo(6, sy + 14); ctx.lineTo(26, sy + 14);
                ctx.moveTo(12, sy + 2); ctx.lineTo(10, sy + 10);
                ctx.moveTo(20, sy + 2); ctx.lineTo(22, sy + 10);
                ctx.moveTo(10, sy + 10); ctx.lineTo(12, sy + 18);
                ctx.moveTo(22, sy + 10); ctx.lineTo(20, sy + 18);
                ctx.stroke();

                // Belly stripe
                var bellyGrad = ctx.createLinearGradient(0, sy + 12, 0, sy + 18);
                bellyGrad.addColorStop(0, C.koopaBelly);
                bellyGrad.addColorStop(1, '#C8A020');
                ctx.fillStyle = bellyGrad;
                ctx.beginPath();
                ctx.ellipse(16, sy + 15, 10, 4, 0, 0, Math.PI);
                ctx.fill();

                // Shell highlight
                var shineGrad = ctx.createRadialGradient(12, sy + 5, 0, 12, sy + 5, 6);
                shineGrad.addColorStop(0, 'rgba(200,255,200,0.5)');
                shineGrad.addColorStop(1, 'rgba(200,255,200,0)');
                ctx.fillStyle = shineGrad;
                ctx.beginPath();
                ctx.arc(12, sy + 5, 6, 0, Math.PI * 2);
                ctx.fill();

                if (pose === 'shell-spin') {
                    // Motion lines
                    ctx.strokeStyle = '#88FF88';
                    ctx.lineWidth = 1;
                    ctx.globalAlpha = 0.6;
                    ctx.beginPath();
                    ctx.moveTo(-2, sy + 8); ctx.lineTo(4, sy + 8);
                    ctx.moveTo(-4, sy + 12); ctx.lineTo(3, sy + 12);
                    ctx.moveTo(-2, sy + 16); ctx.lineTo(4, sy + 16);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }

                ctx.restore();
                return;
            }

            // Walking koopa
            // Head
            var headGrad = ctx.createRadialGradient(16, 6, 1, 16, 8, 8);
            headGrad.addColorStop(0, C.koopaGreenLight);
            headGrad.addColorStop(1, C.koopaGreenDark);
            fillEllipse(ctx, 16, 6, 7, 6, C.koopaGreen);
            ctx.fillStyle = headGrad;
            ctx.beginPath();
            ctx.ellipse(16, 6, 7, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            // Eyes
            fillEllipse(ctx, 12, 5, 3, 2.5, C.white);
            fillCircle(ctx, 13, 5, 1.3, C.black);
            fillCircle(ctx, 12, 4, 0.5, C.white);

            // Beak/mouth
            fillEllipse(ctx, 16, 10, 4, 2, '#F0C858');

            // Neck
            fillEllipse(ctx, 16, 13, 4, 3, C.marioSkin);

            // Shell
            var shellGrad2 = ctx.createRadialGradient(16, 20, 2, 16, 22, 12);
            shellGrad2.addColorStop(0, C.koopaGreenLight);
            shellGrad2.addColorStop(0.6, C.koopaGreen);
            shellGrad2.addColorStop(1, C.koopaGreenDark);
            ctx.fillStyle = shellGrad2;
            ctx.beginPath();
            ctx.ellipse(16, 22, 12, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            // Shell pattern
            ctx.strokeStyle = 'rgba(0,80,0,0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(8, 18); ctx.lineTo(24, 18);
            ctx.moveTo(6, 24); ctx.lineTo(26, 24);
            ctx.moveTo(12, 14); ctx.lineTo(10, 22);
            ctx.moveTo(20, 14); ctx.lineTo(22, 22);
            ctx.stroke();

            // Belly
            ctx.fillStyle = C.koopaBelly;
            ctx.beginPath();
            ctx.ellipse(16, 25, 8, 5, 0, 0, Math.PI);
            ctx.fill();

            // Shell highlight
            var shGrad = ctx.createRadialGradient(11, 16, 0, 11, 16, 5);
            shGrad.addColorStop(0, 'rgba(200,255,200,0.4)');
            shGrad.addColorStop(1, 'rgba(200,255,200,0)');
            ctx.fillStyle = shGrad;
            ctx.beginPath();
            ctx.arc(11, 16, 5, 0, Math.PI * 2);
            ctx.fill();

            // Legs
            var legOff = (pose === 'walk2') ? 2 : -2;
            fillEllipse(ctx, 10 + legOff, 34, 3.5, 5, C.marioSkin);
            fillEllipse(ctx, 22 - legOff, 34, 3.5, 5, C.marioSkin);

            // Shoes
            fillEllipse(ctx, 10 + legOff, 38, 4, 3, C.white);
            fillEllipse(ctx, 22 - legOff, 38, 4, 3, C.white);

            ctx.restore();
        }

        drawKoopa(0, 'walk1');
        addOutline(ctx, 0, 0, frameW, frameH);
        drawKoopa(frameW, 'walk2');
        addOutline(ctx, frameW, 0, frameW, frameH);
        drawKoopa(frameW * 2, 'shell');
        addOutline(ctx, frameW * 2, 0, frameW, frameH);
        drawKoopa(frameW * 3, 'shell-spin');
        addOutline(ctx, frameW * 3, 0, frameW, frameH);

        scene.textures.addSpriteSheet('koopa', canvas, {
            frameWidth: frameW,
            frameHeight: frameH
        });
    }

    // ========================================
    // 6. MUSHROOM (32x32, 1 frame)
    // ========================================
    function generateMushroom(scene) {
        var frameW = 128, frameH = 128;
        var canvas = makeCanvas(frameW, frameH);
        var ctx = canvas.getContext('2d');

        ctx.save();
        ctx.scale(4, 4);

        // Cap - red with white spots
        var capGrad = ctx.createRadialGradient(16, 10, 2, 16, 12, 14);
        capGrad.addColorStop(0, '#FF4444');
        capGrad.addColorStop(0.6, C.mushRed);
        capGrad.addColorStop(1, C.mushRedDark);
        ctx.fillStyle = capGrad;
        ctx.beginPath();
        ctx.ellipse(16, 11, 14, 10, 0, Math.PI, 0);
        ctx.fill();
        // Cap bottom edge
        ctx.fillStyle = C.mushRedDark;
        ctx.fillRect(2, 10, 28, 3);

        // White spots on cap
        fillCircle(ctx, 9, 5, 3.5, C.white);
        fillCircle(ctx, 23, 5, 3.5, C.white);
        fillCircle(ctx, 16, 2, 3, C.white);
        fillCircle(ctx, 6, 9, 2, C.white);
        fillCircle(ctx, 26, 9, 2, C.white);

        // Cap shine
        var shineGrad = ctx.createRadialGradient(10, 3, 0, 10, 3, 5);
        shineGrad.addColorStop(0, 'rgba(255,255,255,0.4)');
        shineGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = shineGrad;
        ctx.beginPath();
        ctx.arc(10, 3, 5, 0, Math.PI * 2);
        ctx.fill();

        // Stem
        var stemGrad = ctx.createLinearGradient(9, 13, 23, 13);
        stemGrad.addColorStop(0, '#E0D0B0');
        stemGrad.addColorStop(0.3, '#FFF0D8');
        stemGrad.addColorStop(0.7, '#FFF0D8');
        stemGrad.addColorStop(1, '#D0C0A0');
        ctx.fillStyle = stemGrad;
        roundRect(ctx, 9, 13, 14, 12, 3);
        ctx.fill();

        // Stem outline
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        roundRect(ctx, 9, 13, 14, 12, 3);
        ctx.stroke();

        // Eyes on stem
        fillEllipse(ctx, 13, 18, 2, 2, C.white);
        fillEllipse(ctx, 19, 18, 2, 2, C.white);
        fillCircle(ctx, 14, 18, 1, C.black);
        fillCircle(ctx, 20, 18, 1, C.black);

        // Smile
        ctx.strokeStyle = '#AA7744';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(16, 20, 3, 0.1, Math.PI - 0.1);
        ctx.stroke();

        ctx.restore();
        addOutline(ctx, 0, 0, frameW, frameH);

        scene.textures.addSpriteSheet('mushroom', canvas, {
            frameWidth: frameW,
            frameHeight: frameH
        });
    }

    // ========================================
    // 7. STAR (32x32, 4 frames)
    // ========================================
    function generateStar(scene) {
        var frameW = 128, frameH = 128;
        var numFrames = 4;
        var canvas = makeCanvas(frameW * numFrames, frameH);
        var ctx = canvas.getContext('2d');

        var palettes = [
            { outer: C.starOrange, inner: C.starYellow, shine: C.starLight, eye: C.black },
            { outer: '#FFD020', inner: '#FFEC50', shine: '#FFFFC0', eye: C.black },
            { outer: '#FFF080', inner: '#FFFFA0', shine: C.white, eye: '#444444' },
            { outer: '#FFC818', inner: '#FFE040', shine: '#FFF0A0', eye: C.black }
        ];

        for (var f = 0; f < 4; f++) {
            var ox = frameW * f;
            var pal = palettes[f];
            ctx.save();
            ctx.translate(ox, 0);
            ctx.scale(4, 4);

            // Star shape with gradient
            var starGrad = ctx.createRadialGradient(16, 15, 2, 16, 15, 14);
            starGrad.addColorStop(0, pal.shine);
            starGrad.addColorStop(0.5, pal.inner);
            starGrad.addColorStop(1, pal.outer);

            ctx.fillStyle = starGrad;
            starPath(ctx, 16, 15, 13, 6, 5);
            ctx.fill();

            // Outline
            ctx.strokeStyle = pal.outer;
            ctx.lineWidth = 1;
            starPath(ctx, 16, 15, 13, 6, 5);
            ctx.stroke();

            // Eyes
            fillEllipse(ctx, 13, 14, 2, 1.8, C.white);
            fillEllipse(ctx, 19, 14, 2, 1.8, C.white);
            fillCircle(ctx, 13.5, 14, 1, pal.eye);
            fillCircle(ctx, 19.5, 14, 1, pal.eye);

            // Smile
            ctx.strokeStyle = pal.eye;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.arc(16, 16, 2.5, 0.2, Math.PI - 0.2);
            ctx.stroke();

            // Shine
            var shGrad = ctx.createRadialGradient(11, 8, 0, 11, 8, 5);
            shGrad.addColorStop(0, 'rgba(255,255,255,0.6)');
            shGrad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = shGrad;
            ctx.beginPath();
            ctx.arc(11, 8, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
            addOutline(ctx, ox, 0, frameW, frameH);
        }

        scene.textures.addSpriteSheet('star', canvas, {
            frameWidth: frameW,
            frameHeight: frameH
        });
    }

    // ========================================
    // 8. FLAGPOLE (16x192 single frame)
    // ========================================
    function generateFlagpole(scene) {
        var w = 16, h = 192;
        var canvas = makeCanvas(w * 2, h * 2);
        var ctx = canvas.getContext('2d');

        ctx.save();
        ctx.scale(2, 2);

        // Pole with metallic gradient
        var poleGrad = ctx.createLinearGradient(5, 0, 12, 0);
        poleGrad.addColorStop(0, '#DDDDDD');
        poleGrad.addColorStop(0.3, C.grayLight);
        poleGrad.addColorStop(0.6, C.gray);
        poleGrad.addColorStop(1, '#555555');
        ctx.fillStyle = poleGrad;
        roundRect(ctx, 6, 12, 4, h - 20, 1);
        ctx.fill();

        // Ball top (golden sphere)
        var ballGrad = ctx.createRadialGradient(8, 6, 1, 8, 6, 6);
        ballGrad.addColorStop(0, C.coinLight);
        ballGrad.addColorStop(0.4, C.coinYellow);
        ballGrad.addColorStop(1, C.starOrange);
        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(8, 6, 6, 0, Math.PI * 2);
        ctx.fill();
        // Ball shine
        fillCircle(ctx, 6, 4, 2, 'rgba(255,255,255,0.5)');

        // Flag (triangular, green gradient)
        var flagGrad = ctx.createLinearGradient(10, 14, 10, 38);
        flagGrad.addColorStop(0, C.koopaGreenLight);
        flagGrad.addColorStop(0.5, C.pipeGreen);
        flagGrad.addColorStop(1, C.grassGreenDark);
        ctx.fillStyle = flagGrad;
        ctx.beginPath();
        ctx.moveTo(10, 14);
        ctx.lineTo(w, 14);
        ctx.lineTo(10, 38);
        ctx.closePath();
        ctx.fill();

        // Flag highlight edge
        ctx.strokeStyle = '#80FF80';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(10, 14);
        ctx.lineTo(w, 14);
        ctx.stroke();

        // Base block at bottom
        var baseGrad = ctx.createLinearGradient(1, h - 8, 1, h);
        baseGrad.addColorStop(0, C.koopaGreenLight);
        baseGrad.addColorStop(0.3, C.pipeGreen);
        baseGrad.addColorStop(1, C.grassGreenDark);
        ctx.fillStyle = baseGrad;
        roundRect(ctx, 1, h - 8, 14, 8, 2);
        ctx.fill();

        ctx.restore();

        scene.textures.addSpriteSheet('flagpole', canvas, {
            frameWidth: w * 2,
            frameHeight: h * 2
        });
    }

    // ========================================
    // 9. PRINCESS (32x64 single frame)
    // ========================================
    function generatePrincess(scene) {
        var frameW = 128, frameH = 256;
        var canvas = makeCanvas(frameW, frameH);
        var ctx = canvas.getContext('2d');

        ctx.save();
        ctx.scale(4, 4);

        // Crown
        ctx.fillStyle = C.princessGold;
        ctx.beginPath();
        ctx.moveTo(9, 10);
        ctx.lineTo(10, 4);
        ctx.lineTo(12, 8);
        ctx.lineTo(14, 2);
        ctx.lineTo(16, 8);
        ctx.lineTo(18, 2);
        ctx.lineTo(20, 8);
        ctx.lineTo(22, 4);
        ctx.lineTo(23, 10);
        ctx.closePath();
        ctx.fill();
        // Crown jewels
        fillCircle(ctx, 14, 5, 1, '#FF4444');
        fillCircle(ctx, 18, 5, 1, '#4444FF');

        // Hair
        var hairGrad = ctx.createLinearGradient(0, 8, 0, 28);
        hairGrad.addColorStop(0, '#F0C848');
        hairGrad.addColorStop(1, C.princessHair);
        ctx.fillStyle = hairGrad;
        ctx.beginPath();
        ctx.ellipse(16, 14, 9, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        // Hair flowing down sides
        fillEllipse(ctx, 8, 20, 3, 8, C.princessHair);
        fillEllipse(ctx, 24, 20, 3, 8, C.princessHair);

        // Face
        var faceGrad = ctx.createRadialGradient(16, 16, 1, 16, 16, 7);
        faceGrad.addColorStop(0, '#FFE0C0');
        faceGrad.addColorStop(1, C.marioSkin);
        ctx.fillStyle = faceGrad;
        ctx.beginPath();
        ctx.ellipse(16, 16, 6, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        fillEllipse(ctx, 13, 15, 2, 2, C.white);
        fillEllipse(ctx, 19, 15, 2, 2, C.white);
        fillCircle(ctx, 13.5, 15, 1, '#4488FF');
        fillCircle(ctx, 19.5, 15, 1, '#4488FF');
        fillCircle(ctx, 13, 14.5, 0.5, C.white);
        fillCircle(ctx, 19, 14.5, 0.5, C.white);

        // Eyelashes
        ctx.strokeStyle = C.black;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(11, 13.5); ctx.lineTo(12, 13);
        ctx.moveTo(15, 13); ctx.lineTo(14.5, 13.5);
        ctx.moveTo(17, 13.5); ctx.lineTo(18, 13);
        ctx.moveTo(21, 13); ctx.lineTo(20.5, 13.5);
        ctx.stroke();

        // Lips
        ctx.fillStyle = '#FF6688';
        ctx.beginPath();
        ctx.arc(16, 19, 2, 0, Math.PI);
        ctx.fill();

        // Nose
        fillCircle(ctx, 16, 17, 0.8, '#E8A060');

        // Dress
        var dressGrad = ctx.createLinearGradient(0, 24, 0, 50);
        dressGrad.addColorStop(0, C.princessPinkLight);
        dressGrad.addColorStop(0.3, C.princessPink);
        dressGrad.addColorStop(1, C.princessPinkDark);
        ctx.fillStyle = dressGrad;
        ctx.beginPath();
        ctx.moveTo(10, 24);
        ctx.quadraticCurveTo(16, 22, 22, 24);
        ctx.lineTo(26, 50);
        ctx.quadraticCurveTo(16, 52, 6, 50);
        ctx.closePath();
        ctx.fill();

        // Dress highlight (waist sash)
        fillEllipse(ctx, 16, 28, 5, 1.5, C.princessPinkLight);

        // Dress ruffle at bottom
        ctx.fillStyle = C.princessPinkLight;
        ctx.beginPath();
        for (var rx = 6; rx <= 26; rx += 4) {
            ctx.arc(rx, 50, 2, Math.PI, 0);
        }
        ctx.fill();

        // Arms
        fillEllipse(ctx, 8, 30, 2.5, 6, C.marioSkin);
        fillEllipse(ctx, 24, 30, 2.5, 6, C.marioSkin);

        // Shoes peeking from dress
        fillEllipse(ctx, 12, 51, 3, 2, C.white);
        fillEllipse(ctx, 20, 51, 3, 2, C.white);

        ctx.restore();
        addOutline(ctx, 0, 0, frameW, frameH);

        scene.textures.addSpriteSheet('princess', canvas, {
            frameWidth: frameW,
            frameHeight: frameH
        });
    }

    // ========================================
    // 10a. CLOUD (64x32)
    // ========================================
    function generateCloud(scene) {
        var w = 64, h = 32;
        var canvas = makeCanvas(w * 2, h * 2);
        var ctx = canvas.getContext('2d');

        ctx.save();
        ctx.scale(2, 2);

        // Shadow puffs
        fillCircle(ctx, 14, 22, 10, '#D0E4FF');
        fillCircle(ctx, 32, 22, 12, '#D0E4FF');
        fillCircle(ctx, 50, 22, 10, '#D0E4FF');

        // Main white puffs with radial gradients
        var puff1 = ctx.createRadialGradient(12, 14, 2, 12, 16, 11);
        puff1.addColorStop(0, '#FFFFFF');
        puff1.addColorStop(1, '#F0F4FF');
        ctx.fillStyle = puff1;
        ctx.beginPath();
        ctx.arc(12, 16, 10, 0, Math.PI * 2);
        ctx.fill();

        var puff2 = ctx.createRadialGradient(28, 6, 2, 28, 10, 14);
        puff2.addColorStop(0, '#FFFFFF');
        puff2.addColorStop(1, '#F0F4FF');
        ctx.fillStyle = puff2;
        ctx.beginPath();
        ctx.arc(28, 10, 14, 0, Math.PI * 2);
        ctx.fill();

        var puff3 = ctx.createRadialGradient(44, 8, 2, 44, 12, 12);
        puff3.addColorStop(0, '#FFFFFF');
        puff3.addColorStop(1, '#F0F4FF');
        ctx.fillStyle = puff3;
        ctx.beginPath();
        ctx.arc(44, 12, 12, 0, Math.PI * 2);
        ctx.fill();

        var puff4 = ctx.createRadialGradient(56, 14, 1, 56, 16, 8);
        puff4.addColorStop(0, '#FFFFFF');
        puff4.addColorStop(1, '#F0F4FF');
        ctx.fillStyle = puff4;
        ctx.beginPath();
        ctx.arc(56, 16, 8, 0, Math.PI * 2);
        ctx.fill();

        // Fill center
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(6, 10, 52, 10);

        // Top highlight shine
        var topShine = ctx.createRadialGradient(26, 4, 0, 26, 6, 10);
        topShine.addColorStop(0, 'rgba(255,255,255,0.8)');
        topShine.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = topShine;
        ctx.beginPath();
        ctx.arc(26, 6, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        scene.textures.addSpriteSheet('cloud', canvas, {
            frameWidth: w * 2,
            frameHeight: h * 2
        });
    }

    // ========================================
    // 10b. HILL (128x64)
    // ========================================
    function generateHill(scene) {
        var w = 128, h = 64;
        var canvas = makeCanvas(w * 2, h * 2);
        var ctx = canvas.getContext('2d');

        ctx.save();
        ctx.scale(2, 2);

        // Main hill shape with gradient
        var hillGrad = ctx.createLinearGradient(0, 0, 0, h);
        hillGrad.addColorStop(0, '#48D848');
        hillGrad.addColorStop(0.4, '#30A030');
        hillGrad.addColorStop(1, '#208020');

        ctx.fillStyle = hillGrad;
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.bezierCurveTo(w * 0.05, -h * 0.2, w * 0.95, -h * 0.2, w, h);
        ctx.fill();

        // Lighter inner hill (highlight)
        var innerGrad = ctx.createRadialGradient(w / 2, h * 0.3, 5, w / 2, h * 0.5, w * 0.4);
        innerGrad.addColorStop(0, 'rgba(100,240,100,0.4)');
        innerGrad.addColorStop(1, 'rgba(100,240,100,0)');
        ctx.fillStyle = innerGrad;
        ctx.beginPath();
        ctx.moveTo(10, h);
        ctx.bezierCurveTo(w * 0.1, h * 0.1, w * 0.9, h * 0.1, w - 10, h);
        ctx.fill();

        // Subtle dark spots for texture
        ctx.fillStyle = 'rgba(30,120,30,0.2)';
        for (var dy = 0; dy < h; dy += 14) {
            for (var dx = 0; dx < w; dx += 18) {
                var hx = dx + (dy % 28 < 14 ? 0 : 9);
                var hy = h - dy;
                var relX = hx / w - 0.5;
                var relY = 1 - dy / h;
                if (relX * relX * 4 + relY * relY < 0.85 && relY > 0.15) {
                    ctx.beginPath();
                    ctx.arc(hx, hy, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        ctx.restore();

        scene.textures.addSpriteSheet('hill', canvas, {
            frameWidth: w * 2,
            frameHeight: h * 2
        });
    }

    // ========================================
    // 10c. BUSH (64x32)
    // ========================================
    function generateBush(scene) {
        var w = 64, h = 32;
        var canvas = makeCanvas(w * 2, h * 2);
        var ctx = canvas.getContext('2d');

        ctx.save();
        ctx.scale(2, 2);

        // Shadow base
        fillEllipse(ctx, 32, 24, 20, 8, C.grassGreenDark);
        fillEllipse(ctx, 14, 24, 13, 6, C.grassGreenDark);
        fillEllipse(ctx, 50, 24, 13, 6, C.grassGreenDark);

        // Main green body with gradient
        var bushGrad = ctx.createRadialGradient(32, 12, 2, 32, 16, 18);
        bushGrad.addColorStop(0, C.koopaGreenLight);
        bushGrad.addColorStop(0.7, C.pipeGreen);
        bushGrad.addColorStop(1, C.grassGreenDark);

        ctx.fillStyle = bushGrad;
        ctx.beginPath();
        ctx.arc(32, 16, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = C.pipeGreen;
        ctx.beginPath();
        ctx.arc(14, 18, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(50, 18, 11, 0, Math.PI * 2);
        ctx.fill();

        // Highlights
        var hlGrad = ctx.createRadialGradient(28, 8, 0, 28, 10, 10);
        hlGrad.addColorStop(0, 'rgba(150,255,150,0.6)');
        hlGrad.addColorStop(1, 'rgba(150,255,150,0)');
        ctx.fillStyle = hlGrad;
        ctx.beginPath();
        ctx.arc(28, 10, 10, 0, Math.PI * 2);
        ctx.fill();

        var hl2 = ctx.createRadialGradient(14, 12, 0, 14, 14, 6);
        hl2.addColorStop(0, 'rgba(150,255,150,0.5)');
        hl2.addColorStop(1, 'rgba(150,255,150,0)');
        ctx.fillStyle = hl2;
        ctx.beginPath();
        ctx.arc(14, 12, 6, 0, Math.PI * 2);
        ctx.fill();

        var hl3 = ctx.createRadialGradient(46, 12, 0, 46, 14, 6);
        hl3.addColorStop(0, 'rgba(150,255,150,0.5)');
        hl3.addColorStop(1, 'rgba(150,255,150,0)');
        ctx.fillStyle = hl3;
        ctx.beginPath();
        ctx.arc(46, 12, 6, 0, Math.PI * 2);
        ctx.fill();

        // Bright sparkles
        fillCircle(ctx, 30, 6, 2, 'rgba(200,255,200,0.6)');
        fillCircle(ctx, 16, 10, 1.5, 'rgba(200,255,200,0.5)');

        ctx.restore();

        scene.textures.addSpriteSheet('bush', canvas, {
            frameWidth: w * 2,
            frameHeight: h * 2
        });
    }

    // ========================================
    // 11. FIREBALL (16x16, 2 frames)
    // ========================================
    function generateFireball(scene) {
        var frameW = 64, frameH = 64;
        var numFrames = 2;
        var canvas = makeCanvas(frameW * numFrames, frameH);
        var ctx = canvas.getContext('2d');

        // Frame 0
        ctx.save();
        ctx.scale(4, 4);
        var fb0 = ctx.createRadialGradient(8, 8, 0, 8, 8, 7);
        fb0.addColorStop(0, '#FFFFFF');
        fb0.addColorStop(0.2, '#FFFF44');
        fb0.addColorStop(0.5, '#FF8800');
        fb0.addColorStop(1, '#FF2200');
        ctx.fillStyle = fb0;
        ctx.beginPath();
        ctx.arc(8, 8, 6, 0, Math.PI * 2);
        ctx.fill();
        // Glow
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#FF4400';
        ctx.beginPath();
        ctx.arc(8, 8, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();

        // Frame 1
        ctx.save();
        ctx.translate(frameW, 0);
        ctx.scale(4, 4);
        var fb1 = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        fb1.addColorStop(0, '#FFFFFF');
        fb1.addColorStop(0.15, '#FFFF44');
        fb1.addColorStop(0.4, '#FFCC00');
        fb1.addColorStop(0.7, '#FF6600');
        fb1.addColorStop(1, '#FF2200');
        ctx.fillStyle = fb1;
        ctx.beginPath();
        ctx.arc(8, 8, 7, 0, Math.PI * 2);
        ctx.fill();

        // Spark particles
        fillCircle(ctx, 3, 3, 1.5, '#FFCC00');
        fillCircle(ctx, 13, 2, 1, '#FF8800');
        fillCircle(ctx, 2, 12, 1, '#FF4400');

        // Outer glow
        ctx.globalAlpha = 0.2;
        fillCircle(ctx, 8, 8, 8, '#FF4400');
        ctx.globalAlpha = 1;
        ctx.restore();

        scene.textures.addSpriteSheet('fireball', canvas, {
            frameWidth: frameW,
            frameHeight: frameH
        });
    }

    // ========================================
    // 12. BOWSER (64x64, 2 frames)
    // ========================================
    function generateBowser(scene) {
        var frameW = 256, frameH = 256;
        var numFrames = 2;
        var canvas = makeCanvas(frameW * numFrames, frameH);
        var ctx = canvas.getContext('2d');

        function drawBowserFrame(ox, variant) {
            ctx.save();
            ctx.translate(ox, 0);
            ctx.scale(4, 4);

            // Horns
            var hornGrad = ctx.createLinearGradient(0, 0, 0, 12);
            hornGrad.addColorStop(0, C.coinLight);
            hornGrad.addColorStop(1, C.bowserHorn);
            ctx.fillStyle = hornGrad;
            // Left horn
            ctx.beginPath();
            ctx.moveTo(12, 12);
            ctx.quadraticCurveTo(8, 0, 6, 2);
            ctx.quadraticCurveTo(4, 4, 12, 12);
            ctx.fill();
            // Right horn
            ctx.beginPath();
            ctx.moveTo(38, 12);
            ctx.quadraticCurveTo(42, 0, 44, 2);
            ctx.quadraticCurveTo(46, 4, 38, 12);
            ctx.fill();

            // Head
            var headGrad = ctx.createRadialGradient(25, 16, 2, 25, 18, 14);
            headGrad.addColorStop(0, C.koopaGreenLight);
            headGrad.addColorStop(0.7, C.bowserGreen);
            headGrad.addColorStop(1, C.bowserGreenDark);
            ctx.fillStyle = headGrad;
            ctx.beginPath();
            ctx.ellipse(25, 16, 16, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            // Eyes
            fillEllipse(ctx, 18, 14, 5, 3.5, C.white);
            fillEllipse(ctx, 32, 14, 5, 3.5, C.white);
            // Red pupils
            fillCircle(ctx, 19, 15, 2.5, '#CC0000');
            fillCircle(ctx, 33, 15, 2.5, '#CC0000');
            fillCircle(ctx, 19, 14.5, 1, C.black);
            fillCircle(ctx, 33, 14.5, 1, C.black);

            // Angry brows
            ctx.fillStyle = C.bowserGreenDark;
            ctx.beginPath();
            ctx.moveTo(12, 12); ctx.lineTo(22, 10); ctx.lineTo(22, 12); ctx.lineTo(12, 14);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(38, 12); ctx.lineTo(28, 10); ctx.lineTo(28, 12); ctx.lineTo(38, 14);
            ctx.fill();

            // Mouth / snout
            fillEllipse(ctx, 25, 22, 10, 5, '#D88040');
            // Fangs
            ctx.fillStyle = C.white;
            ctx.beginPath();
            ctx.moveTo(17, 20); ctx.lineTo(19, 25); ctx.lineTo(21, 20);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(29, 20); ctx.lineTo(31, 25); ctx.lineTo(33, 20);
            ctx.fill();
            // Open mouth
            fillEllipse(ctx, 25, 24, 7, 2.5, '#AA2020');

            // Shell on back
            var shellGrad = ctx.createRadialGradient(25, 38, 3, 25, 38, 18);
            shellGrad.addColorStop(0, '#556655');
            shellGrad.addColorStop(1, C.bowserShell);
            ctx.fillStyle = shellGrad;
            ctx.beginPath();
            ctx.ellipse(25, 38, 20, 14, 0, 0, Math.PI * 2);
            ctx.fill();

            // Shell spikes
            for (var i = 0; i < 4; i++) {
                var sx = 12 + i * 8;
                var spikeGrad = ctx.createLinearGradient(sx, 24, sx, 30);
                spikeGrad.addColorStop(0, C.coinLight);
                spikeGrad.addColorStop(1, C.bowserHorn);
                ctx.fillStyle = spikeGrad;
                ctx.beginPath();
                ctx.moveTo(sx, 30);
                ctx.lineTo(sx + 2.5, 22);
                ctx.lineTo(sx + 5, 30);
                ctx.fill();
            }

            // Body / belly
            var bellyGrad = ctx.createRadialGradient(25, 38, 2, 25, 38, 14);
            bellyGrad.addColorStop(0, '#FFF0A0');
            bellyGrad.addColorStop(1, C.bowserBelly);
            ctx.fillStyle = bellyGrad;
            ctx.beginPath();
            ctx.ellipse(25, 38, 12, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            // Belly lines
            ctx.strokeStyle = '#C8A020';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(15, 36); ctx.lineTo(35, 36);
            ctx.moveTo(14, 40); ctx.lineTo(36, 40);
            ctx.stroke();

            // Arms
            fillEllipse(ctx, 4, 36, 4, 6, C.bowserGreen);
            fillEllipse(ctx, 46, 36, 4, 6, C.bowserGreen);
            // Claws
            ctx.fillStyle = C.bowserGreenDark;
            ctx.beginPath();
            ctx.moveTo(1, 40); ctx.lineTo(0, 42); ctx.lineTo(3, 41);
            ctx.moveTo(3, 41); ctx.lineTo(2, 43); ctx.lineTo(5, 42);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(49, 40); ctx.lineTo(50, 42); ctx.lineTo(47, 41);
            ctx.moveTo(47, 41); ctx.lineTo(48, 43); ctx.lineTo(45, 42);
            ctx.fill();

            // Legs
            var legOff = (variant === 0) ? 0 : 2;
            fillEllipse(ctx, 14 + legOff, 54, 5, 6, C.bowserGreen);
            fillEllipse(ctx, 36 - legOff, 54, 5, 6, C.bowserGreen);
            // Feet
            fillEllipse(ctx, 12 + legOff, 58, 6, 3, C.bowserGreenDark);
            fillEllipse(ctx, 34 - legOff, 58, 6, 3, C.bowserGreenDark);

            // Tail
            ctx.fillStyle = C.bowserGreen;
            ctx.beginPath();
            ctx.moveTo(46, 44);
            ctx.quadraticCurveTo(54, 42, 58, 38);
            ctx.quadraticCurveTo(56, 46, 46, 48);
            ctx.fill();
            // Tail spike
            var tSpike = ctx.createLinearGradient(56, 36, 60, 40);
            tSpike.addColorStop(0, C.coinLight);
            tSpike.addColorStop(1, C.bowserHorn);
            ctx.fillStyle = tSpike;
            ctx.beginPath();
            ctx.moveTo(58, 40);
            ctx.lineTo(62, 36);
            ctx.lineTo(60, 42);
            ctx.fill();

            ctx.restore();
        }

        drawBowserFrame(0, 0);
        addOutline(ctx, 0, 0, frameW, frameH);
        drawBowserFrame(frameW, 1);
        addOutline(ctx, frameW, 0, frameW, frameH);

        scene.textures.addSpriteSheet('bowser', canvas, {
            frameWidth: frameW,
            frameHeight: frameH
        });
    }

    // ========================================
    // 13. DECORATIVE FLOWER (16x16)
    // ========================================
    function generateFlower(scene) {
        var w = 16, h = 16;
        var canvas = makeCanvas(w * 2, h * 2);
        var ctx = canvas.getContext('2d');

        ctx.save();
        ctx.scale(2, 2);

        // Stem
        ctx.strokeStyle = '#30A030';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(8, 8);
        ctx.quadraticCurveTo(7, 12, 8, h);
        ctx.stroke();

        // Leaves
        ctx.fillStyle = '#48D848';
        ctx.beginPath();
        ctx.ellipse(5, 11, 2.5, 1.5, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(11, 12, 2.5, 1.5, 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Petals
        var petalColors = ['#FF5555', '#FF4444', '#FF6666', '#FF3333', '#FF5050'];
        var angles = [0, 1.256, 2.513, 3.77, 5.026];
        for (var p = 0; p < 5; p++) {
            ctx.fillStyle = petalColors[p];
            var px2 = 8 + Math.cos(angles[p]) * 3.5;
            var py = 5 + Math.sin(angles[p]) * 3.5;
            ctx.beginPath();
            ctx.ellipse(px2, py, 2.5, 1.5, angles[p], 0, Math.PI * 2);
            ctx.fill();
        }

        // Center
        var centerGrad = ctx.createRadialGradient(8, 5, 0, 8, 5, 2.5);
        centerGrad.addColorStop(0, '#FFF8A0');
        centerGrad.addColorStop(1, '#F8D830');
        ctx.fillStyle = centerGrad;
        ctx.beginPath();
        ctx.arc(8, 5, 2, 0, Math.PI * 2);
        ctx.fill();

        // Sparkle
        fillCircle(ctx, 7, 4, 0.7, C.white);

        ctx.restore();

        scene.textures.addSpriteSheet('flower-deco', canvas, {
            frameWidth: w * 2,
            frameHeight: h * 2
        });
    }

    // ========================================
    // 14. GRASS TUFT (16x12)
    // ========================================
    function generateGrassTuft(scene) {
        var w = 16, h = 12;
        var canvas = makeCanvas(w * 2, h * 2);
        var ctx = canvas.getContext('2d');

        ctx.save();
        ctx.scale(2, 2);

        // Grass blades with gradient
        var grassGrad = ctx.createLinearGradient(0, 0, 0, h);
        grassGrad.addColorStop(0, '#80FF80');
        grassGrad.addColorStop(0.5, '#48D848');
        grassGrad.addColorStop(1, '#30A030');

        ctx.fillStyle = grassGrad;

        // Blade 1 (left, curved left)
        ctx.beginPath();
        ctx.moveTo(3, h);
        ctx.quadraticCurveTo(0, 5, 1, 2);
        ctx.quadraticCurveTo(3, 3, 5, h);
        ctx.fill();

        // Blade 2 (center, tall)
        ctx.beginPath();
        ctx.moveTo(6, h);
        ctx.quadraticCurveTo(7, 3, 8, 0);
        ctx.quadraticCurveTo(9, 3, 10, h);
        ctx.fill();

        // Blade 3 (right, curved right)
        ctx.beginPath();
        ctx.moveTo(11, h);
        ctx.quadraticCurveTo(13, 5, 14, 3);
        ctx.quadraticCurveTo(15, 5, 13, h);
        ctx.fill();

        // Darker tips
        ctx.fillStyle = '#30A030';
        fillCircle(ctx, 1.5, 2.5, 1, '#30A030');
        fillCircle(ctx, 8, 0.5, 1, '#30A030');
        fillCircle(ctx, 14, 3.5, 1, '#30A030');

        ctx.restore();

        scene.textures.addSpriteSheet('grass-tuft', canvas, {
            frameWidth: w * 2,
            frameHeight: h * 2
        });
    }

    // ========================================
    // 15. MUSHROOM DECO (12x12)
    // ========================================
    function generateMushroomDeco(scene) {
        var w = 12, h = 12;
        var canvas = makeCanvas(w * 2, h * 2);
        var ctx = canvas.getContext('2d');

        ctx.save();
        ctx.scale(2, 2);

        // Stem
        var stemGrad = ctx.createLinearGradient(3, 6, 9, 6);
        stemGrad.addColorStop(0, '#E0D0B0');
        stemGrad.addColorStop(0.5, '#FFF0D8');
        stemGrad.addColorStop(1, '#D0C0A0');
        ctx.fillStyle = stemGrad;
        roundRect(ctx, 4, 6, 4, 6, 1.5);
        ctx.fill();

        // Cap
        var capGrad = ctx.createRadialGradient(6, 4, 1, 6, 5, 5.5);
        capGrad.addColorStop(0, '#FF4444');
        capGrad.addColorStop(0.7, '#E8261C');
        capGrad.addColorStop(1, '#B01010');
        ctx.fillStyle = capGrad;
        ctx.beginPath();
        ctx.ellipse(6, 5, 5.5, 4.5, 0, Math.PI, 0);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(6, 5, 5.5, 1, 0, 0, Math.PI);
        ctx.fill();

        // White dots on cap
        fillCircle(ctx, 4, 3, 1.2, C.white);
        fillCircle(ctx, 8, 3.5, 1, C.white);
        fillCircle(ctx, 6, 1.5, 0.8, C.white);

        // Shine
        fillCircle(ctx, 4, 2, 0.5, 'rgba(255,255,255,0.5)');

        ctx.restore();

        scene.textures.addSpriteSheet('mushroom-deco', canvas, {
            frameWidth: w * 2,
            frameHeight: h * 2
        });
    }

    // ========================================
    // 16. ROCK (24x16)
    // ========================================
    function generateRock(scene) {
        var w = 24, h = 16;
        var canvas = makeCanvas(w * 2, h * 2);
        var ctx = canvas.getContext('2d');

        ctx.save();
        ctx.scale(2, 2);

        // Rock shape with gradient
        var rockGrad = ctx.createLinearGradient(0, 0, 0, h);
        rockGrad.addColorStop(0, '#AAAAAA');
        rockGrad.addColorStop(0.5, '#888888');
        rockGrad.addColorStop(1, '#666666');
        ctx.fillStyle = rockGrad;

        ctx.beginPath();
        ctx.moveTo(2, h);
        ctx.quadraticCurveTo(0, h - 4, 4, 4);
        ctx.quadraticCurveTo(8, 0, 14, 1);
        ctx.quadraticCurveTo(20, 2, 22, 8);
        ctx.quadraticCurveTo(24, h - 2, 22, h);
        ctx.closePath();
        ctx.fill();

        // Highlight face
        var hlGrad = ctx.createRadialGradient(10, 5, 0, 10, 8, 8);
        hlGrad.addColorStop(0, 'rgba(200,200,200,0.5)');
        hlGrad.addColorStop(1, 'rgba(200,200,200,0)');
        ctx.fillStyle = hlGrad;
        ctx.beginPath();
        ctx.moveTo(6, h - 2);
        ctx.quadraticCurveTo(6, 4, 12, 2);
        ctx.quadraticCurveTo(16, 3, 14, 8);
        ctx.quadraticCurveTo(12, h - 2, 6, h - 2);
        ctx.fill();

        // Dark bottom edge
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(2, h - 1);
        ctx.lineTo(22, h - 1);
        ctx.stroke();

        // Subtle crack
        ctx.strokeStyle = 'rgba(80,80,80,0.3)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(10, 4);
        ctx.lineTo(12, 8);
        ctx.lineTo(10, 12);
        ctx.stroke();

        ctx.restore();

        scene.textures.addSpriteSheet('rock-deco', canvas, {
            frameWidth: w * 2,
            frameHeight: h * 2
        });
    }

    // ========================================
    // 17. FENCE (32x24)
    // ========================================
    function generateFence(scene) {
        var w = 32, h = 24;
        var canvas = makeCanvas(w * 2, h * 2);
        var ctx = canvas.getContext('2d');

        ctx.save();
        ctx.scale(2, 2);

        var woodGrad = ctx.createLinearGradient(0, 0, 0, h);
        woodGrad.addColorStop(0, '#E8C878');
        woodGrad.addColorStop(0.5, '#D4A056');
        woodGrad.addColorStop(1, '#B08040');

        // Posts with pointed tops
        var postPositions = [3, 15, 27];
        for (var i = 0; i < 3; i++) {
            var px2 = postPositions[i];
            ctx.fillStyle = woodGrad;
            roundRect(ctx, px2 - 2, 3, 4, h - 3, 1);
            ctx.fill();

            // Pointed top
            ctx.beginPath();
            ctx.moveTo(px2 - 2, 4);
            ctx.lineTo(px2, 0);
            ctx.lineTo(px2 + 2, 4);
            ctx.closePath();
            ctx.fill();

            // Wood grain
            ctx.strokeStyle = 'rgba(160,100,40,0.3)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(px2 - 1, 4); ctx.lineTo(px2 - 1, h);
            ctx.moveTo(px2 + 1, 6); ctx.lineTo(px2 + 1, h);
            ctx.stroke();
        }

        // Horizontal rails
        var railGrad = ctx.createLinearGradient(0, 0, w, 0);
        railGrad.addColorStop(0, '#E8C070');
        railGrad.addColorStop(0.5, '#D4A056');
        railGrad.addColorStop(1, '#C09048');

        ctx.fillStyle = railGrad;
        roundRect(ctx, 0, 6, w, 3, 1);
        ctx.fill();
        roundRect(ctx, 0, 16, w, 3, 1);
        ctx.fill();

        // Rail highlights
        ctx.fillStyle = 'rgba(255,220,160,0.3)';
        ctx.fillRect(0, 6, w, 1);
        ctx.fillRect(0, 16, w, 1);

        // Rail shadows
        ctx.fillStyle = 'rgba(120,80,40,0.3)';
        ctx.fillRect(0, 8, w, 1);
        ctx.fillRect(0, 18, w, 1);

        ctx.restore();

        scene.textures.addSpriteSheet('fence', canvas, {
            frameWidth: w * 2,
            frameHeight: h * 2
        });
    }

    // ========================================
    // MAIN: generateAll(scene)
    // ========================================
    var SpriteGenerator = {
        generateAll: function (scene) {
            generateMario(scene);
            generateBigMario(scene);
            generateTiles(scene);
            generateCoin(scene);
            generateGoomba(scene);
            generateKoopa(scene);
            generateMushroom(scene);
            generateStar(scene);
            generateFlagpole(scene);
            generatePrincess(scene);
            generateCloud(scene);
            generateHill(scene);
            generateBush(scene);
            generateFireball(scene);
            generateBowser(scene);
            generateFlower(scene);
            generateGrassTuft(scene);
            generateMushroomDeco(scene);
            generateRock(scene);
            generateFence(scene);

            console.log('[SpriteGenerator] All sprites generated successfully.');
        }
    };

    // Attach to window
    window.SpriteGenerator = SpriteGenerator;

})();
