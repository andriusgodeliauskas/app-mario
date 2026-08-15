(function () {
    'use strict';

    window.EXTRA_SPRITE_GENERATORS = window.EXTRA_SPRITE_GENERATORS || [];

    function makeCanvas(w, h) {
        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        return c;
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

    function addTexture(scene, key, canvas) {
        if (!scene.textures.exists(key)) scene.textures.addCanvas(key, canvas);
    }

    function addSpriteSheet(scene, key, canvas, frameW, frameH) {
        if (!scene.textures.exists(key)) scene.textures.addSpriteSheet(key, canvas, {
            frameWidth: frameW,
            frameHeight: frameH
        });
    }

    function drawEye(ctx, x, y) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(x, y, 3.2, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#151515';
        ctx.beginPath();
        ctx.arc(x + 0.8, y + 0.4, 1.3, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawWonderWalker(ctx, kind, pose) {
        var p = {
            'wonder-plains-walker': ['#C47A36', '#6F3A18', '#F8D08A'],
            'wonder-cloud-puff': ['#FFFFFF', '#7DCFEA', '#DDF7FF'],
            'wonder-glow-crawler': ['#2DD4BF', '#064E3B', '#B9FFF2'],
            'wonder-depths-fish': ['#A78BFA', '#5B21B6', '#F2D7FF'],
            'wonder-depths-crab': ['#FB7185', '#9F1239', '#FED7E2'],
            'wonder-neon-bot': ['#22D3EE', '#4C1D95', '#F472B6'],
            'wonder-ice-penguin': ['#60A5FA', '#1E3A8A', '#FFFFFF'],
            'wonder-sand-crab': ['#FBBF24', '#92400E', '#FFE8A3'],
            'wonder-windup-bot': ['#F7C765', '#5A3216', '#FDE68A'],
            'wonder-metal-bug': ['#D1D5DB', '#374151', '#60A5FA'],
            'wonder-mirror-creature': ['#EBD7FF', '#6D4DCC', '#FFFFFF']
        }[kind] || ['#C47A36', '#6F3A18', '#F8D08A'];
        var step = pose === 1 ? 2 : -2;
        var g = ctx.createLinearGradient(0, 6, 0, 42);
        g.addColorStop(0, p[2]);
        g.addColorStop(0.5, p[0]);
        g.addColorStop(1, p[1]);
        ctx.fillStyle = g;

        if (kind === 'wonder-depths-fish') {
            ctx.beginPath();
            ctx.moveTo(7, 24);
            ctx.quadraticCurveTo(21, 8, 38, 22);
            ctx.quadraticCurveTo(22, 39, 7, 24);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(38, 22);
            ctx.lineTo(46, 14 + step);
            ctx.lineTo(45, 31 - step);
            ctx.closePath();
            ctx.fill();
        } else if (kind === 'wonder-cloud-puff') {
            ctx.beginPath();
            ctx.ellipse(15, 28, 12, 9, 0, 0, Math.PI * 2);
            ctx.ellipse(26, 24, 14, 12, 0, 0, Math.PI * 2);
            ctx.ellipse(36, 29, 10, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (kind === 'wonder-neon-bot' || kind === 'wonder-windup-bot') {
            roundRect(ctx, 9, 12, 30, 26, 7);
            ctx.fill();
            ctx.fillStyle = p[2];
            roundRect(ctx, 15, 7, 18, 9, 4);
            ctx.fill();
        } else if (kind === 'wonder-ice-penguin') {
            ctx.beginPath();
            ctx.ellipse(24, 23, 14, 19, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.ellipse(24, 28, 8, 10, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.ellipse(24, 27, 17, 14, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.strokeStyle = p[1];
        ctx.lineWidth = 2.4;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.65)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(12, 17);
        ctx.quadraticCurveTo(24, 10, 36, 17);
        ctx.stroke();

        drawEye(ctx, 19, 23);
        drawEye(ctx, 29, 23);
        ctx.fillStyle = p[1];
        ctx.beginPath();
        ctx.moveTo(20, 32);
        ctx.quadraticCurveTo(24, 35, 28, 32);
        ctx.stroke();

        ctx.fillStyle = p[1];
        if (kind === 'wonder-depths-crab' || kind === 'wonder-sand-crab') {
            for (var c = 0; c < 3; c++) {
                ctx.fillRect(8 + c * 6, 39 + (c % 2) * step, 5, 3);
                ctx.fillRect(30 + c * 4, 39 - (c % 2) * step, 5, 3);
            }
        } else {
            ctx.beginPath();
            ctx.ellipse(15 + step, 40, 5, 3, 0, 0, Math.PI * 2);
            ctx.ellipse(33 - step, 40, 5, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawWonderShell(ctx, pose) {
        var spin = pose === 3;
        var g;
        if (pose < 2) {
            g = ctx.createLinearGradient(0, 6, 0, 42);
            g.addColorStop(0, '#B7F7A2');
            g.addColorStop(0.5, '#30C030');
            g.addColorStop(1, '#136F28');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.ellipse(24, 27, 15, 15, 0, 0, Math.PI * 2);
            ctx.fill();
            drawEye(ctx, 18, 20);
            drawEye(ctx, 29, 20);
            ctx.fillStyle = '#F8D830';
            ctx.beginPath();
            ctx.ellipse(24, 32, 10, 6, 0, 0, Math.PI);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.ellipse(15 + (pose ? 2 : -2), 41, 5, 3, 0, 0, Math.PI * 2);
            ctx.ellipse(33 - (pose ? 2 : -2), 41, 5, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            g = ctx.createRadialGradient(24, 25, 2, 24, 25, 17);
            g.addColorStop(0, '#B7F7A2');
            g.addColorStop(0.58, '#30C030');
            g.addColorStop(1, '#136F28');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.ellipse(24, 28, 17, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#0F5F23';
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.moveTo(11, 25); ctx.lineTo(37, 25);
            ctx.moveTo(13, 31); ctx.lineTo(35, 31);
            ctx.moveTo(20, 17); ctx.lineTo(18, 37);
            ctx.moveTo(29, 17); ctx.lineTo(31, 37);
            ctx.stroke();
            if (spin) {
                ctx.strokeStyle = '#D9FFD1';
                ctx.beginPath();
                ctx.moveTo(2, 25); ctx.lineTo(10, 25);
                ctx.moveTo(1, 31); ctx.lineTo(9, 31);
                ctx.stroke();
            }
        }
        ctx.strokeStyle = '#063B16';
        ctx.lineWidth = 2.2;
        ctx.stroke();
    }

    function generateWonderEnemySheet(scene, key, shell) {
        var frameW = 192;
        var frameH = 192;
        var frames = shell ? 4 : 3;
        var c = makeCanvas(frameW * frames, frameH);
        var ctx = c.getContext('2d');
        for (var f = 0; f < frames; f++) {
            ctx.save();
            ctx.translate(f * frameW, 0);
            ctx.scale(4, 4);
            if (shell) drawWonderShell(ctx, f);
            else if (f === 2) {
                ctx.scale(1, 0.5);
                ctx.translate(0, 42);
                drawWonderWalker(ctx, key, 0);
            } else {
                drawWonderWalker(ctx, key, f);
            }
            ctx.restore();
        }
        addSpriteSheet(scene, key, c, frameW, frameH);
    }

    function generateWonderSprites(scene) {
        var c, ctx, g, i, x, y;

        c = makeCanvas(128, 128);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createLinearGradient(0, 0, 0, 32);
        g.addColorStop(0, '#7CF3B6');
        g.addColorStop(0.35, '#10B981');
        g.addColorStop(1, '#045C43');
        ctx.fillStyle = g;
        roundRect(ctx, 0.5, 0.5, 31, 31, 5);
        ctx.fill();
        ctx.fillStyle = '#ECFFF7';
        roundRect(ctx, 2, 2, 28, 5, 3);
        ctx.fill();
        ctx.strokeStyle = 'rgba(236,255,247,0.58)';
        ctx.lineWidth = 1;
        for (i = -16; i < 48; i += 8) {
            ctx.beginPath();
            ctx.moveTo(i, 16);
            ctx.lineTo(i + 16, 0);
            ctx.lineTo(i + 32, 16);
            ctx.lineTo(i + 16, 32);
            ctx.closePath();
            ctx.stroke();
        }
        ctx.strokeStyle = '#075F43';
        ctx.lineWidth = 2;
        roundRect(ctx, 1, 1, 30, 30, 5);
        ctx.stroke();
        ctx.strokeStyle = '#033D2D';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(2, 7);
        ctx.quadraticCurveTo(16, 1, 30, 7);
        ctx.stroke();
        addTexture(scene, 'wonder-grass-block', c);

        c = makeCanvas(128, 128);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createLinearGradient(0, 0, 0, 32);
        g.addColorStop(0, '#B07144');
        g.addColorStop(0.5, '#7B4728');
        g.addColorStop(1, '#3F2416');
        ctx.fillStyle = g;
        roundRect(ctx, 1, 1, 30, 30, 5);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        for (y = 5; y < 30; y += 8) {
            for (x = (y % 16 === 5 ? 4 : 12); x < 30; x += 16) {
                ctx.fillRect(x, y, 8, 2);
            }
        }
        ctx.strokeStyle = '#4D2B1A';
        ctx.lineWidth = 2;
        roundRect(ctx, 1, 1, 30, 30, 5);
        ctx.stroke();
        addTexture(scene, 'wonder-earth-block', c);

        c = makeCanvas(384, 384);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createLinearGradient(0, 0, 0, 96);
        g.addColorStop(0, '#FFF275');
        g.addColorStop(0.55, '#FFD447');
        g.addColorStop(1, '#F2A900');
        ctx.fillStyle = g;
        roundRect(ctx, 4, 4, 88, 88, 13);
        ctx.fill();
        ctx.strokeStyle = '#B87900';
        ctx.lineWidth = 3;
        roundRect(ctx, 4, 4, 88, 88, 13);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.82)';
        ctx.lineWidth = 2;
        for (i = 1; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(4 + i * 29.3, 8);
            ctx.lineTo(4 + i * 29.3, 88);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(8, 4 + i * 29.3);
            ctx.lineTo(88, 4 + i * 29.3);
            ctx.stroke();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        roundRect(ctx, 12, 10, 68, 12, 6);
        ctx.fill();
        addTexture(scene, 'wonder-rubber-block', c);

        c = makeCanvas(192, 96);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createLinearGradient(0, 0, 0, 24);
        g.addColorStop(0, '#FFFFFF');
        g.addColorStop(0.38, '#BDEFFF');
        g.addColorStop(1, '#2F83A8');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(24, 17, 24, 10, 0, 0, Math.PI * 2);
        ctx.ellipse(12, 18, 13, 9, 0, 0, Math.PI * 2);
        ctx.ellipse(34, 16, 16, 10, 0, 0, Math.PI * 2);
        ctx.ellipse(22, 11, 15, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(28,107,143,0.24)';
        ctx.beginPath();
        ctx.ellipse(25, 22, 21, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#176B91';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(24, 17, 24, 10, 0, 0, Math.PI * 2);
        ctx.ellipse(12, 18, 13, 9, 0, 0, Math.PI * 2);
        ctx.ellipse(34, 16, 16, 10, 0, 0, Math.PI * 2);
        ctx.ellipse(22, 11, 15, 11, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(5, 14);
        ctx.quadraticCurveTo(22, 5, 44, 14);
        ctx.stroke();
        addTexture(scene, 'wonder-cloud-platform', c);

        c = makeCanvas(192, 64);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createLinearGradient(0, 0, 0, 16);
        g.addColorStop(0, '#FFFFFF');
        g.addColorStop(0.36, '#9FE3FA');
        g.addColorStop(1, '#12698D');
        ctx.fillStyle = g;
        roundRect(ctx, 2, 2, 44, 12, 6);
        ctx.fill();
        ctx.strokeStyle = '#0F5C7C';
        ctx.lineWidth = 3;
        roundRect(ctx, 2, 2, 44, 12, 6);
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        roundRect(ctx, 7, 4, 30, 3, 2);
        ctx.fill();
        addTexture(scene, 'wonder-segment', c);

        c = makeCanvas(24, 24);
        ctx = c.getContext('2d');
        g = ctx.createRadialGradient(12, 12, 1, 12, 12, 11);
        g.addColorStop(0, 'rgba(255,255,255,0.95)');
        g.addColorStop(0.55, 'rgba(180,245,255,0.45)');
        g.addColorStop(1, 'rgba(45,212,191,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(12, 12, 11, 0, Math.PI * 2);
        ctx.fill();
        addTexture(scene, 'wonder-bubble', c);

        c = makeCanvas(128, 128);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createLinearGradient(0, 0, 0, 32);
        g.addColorStop(0, '#27485C');
        g.addColorStop(0.42, '#172D3C');
        g.addColorStop(1, '#071827');
        ctx.fillStyle = g;
        roundRect(ctx, 0.5, 0.5, 31, 31, 5);
        ctx.fill();
        ctx.strokeStyle = 'rgba(45,212,191,0.72)';
        ctx.lineWidth = 1.2;
        for (i = -8; i < 40; i += 10) {
            ctx.beginPath();
            ctx.moveTo(i, 18);
            ctx.lineTo(i + 12, 5);
            ctx.lineTo(i + 24, 18);
            ctx.lineTo(i + 12, 29);
            ctx.closePath();
            ctx.stroke();
        }
        ctx.strokeStyle = '#2DD4BF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(1, 5);
        ctx.quadraticCurveTo(16, -1, 31, 5);
        ctx.stroke();
        addTexture(scene, 'wonder-forest-top', c);

        c = makeCanvas(128, 128);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createLinearGradient(0, 0, 0, 32);
        g.addColorStop(0, '#172D3C');
        g.addColorStop(0.5, '#102231');
        g.addColorStop(1, '#07111D');
        ctx.fillStyle = g;
        roundRect(ctx, 1, 1, 30, 30, 5);
        ctx.fill();
        ctx.strokeStyle = 'rgba(45,212,191,0.22)';
        ctx.lineWidth = 1;
        for (i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(4 + i * 8, 3);
            ctx.lineTo(13 + i * 6, 29);
            ctx.stroke();
        }
        addTexture(scene, 'wonder-forest-fill', c);

        c = makeCanvas(128, 128);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createLinearGradient(0, 0, 0, 32);
        g.addColorStop(0, '#F2D7FF');
        g.addColorStop(0.38, '#A855F7');
        g.addColorStop(1, '#4C1D95');
        ctx.fillStyle = g;
        roundRect(ctx, 0.5, 0.5, 31, 31, 8);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.beginPath();
        ctx.ellipse(12, 8, 8, 3, -0.2, 0, Math.PI * 2);
        ctx.ellipse(23, 16, 5, 8, 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5B21B6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(1, 6);
        ctx.quadraticCurveTo(16, 0, 31, 6);
        ctx.stroke();
        addTexture(scene, 'wonder-depths-top', c);

        c = makeCanvas(128, 128);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createLinearGradient(0, 0, 0, 32);
        g.addColorStop(0, '#9B82F4');
        g.addColorStop(0.52, '#6D28D9');
        g.addColorStop(1, '#32116F');
        ctx.fillStyle = g;
        roundRect(ctx, 1, 1, 30, 30, 7);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        for (i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.ellipse(6 + i * 6, 9 + (i % 2) * 11, 3, 1.6, 0.2, 0, Math.PI * 2);
            ctx.fill();
        }
        addTexture(scene, 'wonder-depths-fill', c);

        c = makeCanvas(128, 128);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createLinearGradient(0, 0, 0, 32);
        g.addColorStop(0, '#5B21B6');
        g.addColorStop(0.55, '#1E102E');
        g.addColorStop(1, '#08040F');
        ctx.fillStyle = g;
        roundRect(ctx, 0.5, 0.5, 31, 31, 4);
        ctx.fill();
        ctx.strokeStyle = '#F472B6';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(1, 5);
        ctx.lineTo(31, 5);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(34,211,238,0.7)';
        for (i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(4 + i * 8, 9);
            ctx.lineTo(12 + i * 8, 26);
            ctx.stroke();
        }
        addTexture(scene, 'wonder-neon-top', c);

        c = makeCanvas(128, 128);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createLinearGradient(0, 0, 0, 32);
        g.addColorStop(0, '#1E102E');
        g.addColorStop(0.48, '#12091D');
        g.addColorStop(1, '#05030B');
        ctx.fillStyle = g;
        roundRect(ctx, 1, 1, 30, 30, 4);
        ctx.fill();
        ctx.strokeStyle = 'rgba(244,114,182,0.28)';
        ctx.lineWidth = 1;
        for (i = -12; i < 36; i += 12) {
            ctx.beginPath();
            ctx.moveTo(i, 30);
            ctx.lineTo(i + 14, 2);
            ctx.stroke();
        }
        addTexture(scene, 'wonder-neon-fill', c);

        c = makeCanvas(640, 256);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        for (i = 0; i < 3; i++) {
            ctx.globalAlpha = 0.18 - i * 0.045;
            ctx.fillStyle = '#2DD4BF';
            ctx.beginPath();
            ctx.ellipse(80, 35, 72 + i * 8, 25 + i * 5, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        g = ctx.createLinearGradient(0, 7, 0, 56);
        g.addColorStop(0, '#D9FFFF');
        g.addColorStop(0.52, '#2DD4BF');
        g.addColorStop(1, '#0F766E');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(10, 44);
        ctx.quadraticCurveTo(45, 4, 88, 10);
        ctx.quadraticCurveTo(136, 16, 152, 48);
        ctx.quadraticCurveTo(86, 62, 10, 44);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#D9FFFF';
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 1;
        for (i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(38 + i * 18, 20);
            ctx.quadraticCurveTo(74, 35, 82, 51);
            ctx.stroke();
        }
        addTexture(scene, 'wonder-mushroom-cap', c);

        c = makeCanvas(256, 320);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createLinearGradient(0, 0, 0, 80);
        g.addColorStop(0, '#FFE96B');
        g.addColorStop(0.52, '#FACC15');
        g.addColorStop(1, '#B45309');
        ctx.fillStyle = g;
        roundRect(ctx, 12, 20, 40, 50, 8);
        ctx.fill();
        ctx.fillStyle = '#FFF7AD';
        roundRect(ctx, 8, 14, 48, 14, 7);
        ctx.fill();
        ctx.strokeStyle = '#7C2D12';
        ctx.lineWidth = 2;
        roundRect(ctx, 12, 20, 40, 50, 8);
        ctx.stroke();
        addTexture(scene, 'wonder-yellow-pot', c);

        c = makeCanvas(192, 192);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createRadialGradient(24, 24, 3, 24, 24, 28);
        g.addColorStop(0, 'rgba(255,255,255,0.95)');
        g.addColorStop(0.35, 'rgba(250,204,21,0.75)');
        g.addColorStop(1, 'rgba(250,204,21,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(24, 24, 28, 0, Math.PI * 2);
        ctx.fill();
        g = ctx.createLinearGradient(0, 8, 0, 42);
        g.addColorStop(0, '#FFF7AD');
        g.addColorStop(0.5, '#FACC15');
        g.addColorStop(1, '#B45309');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(20, 20, 9, 0, Math.PI * 2);
        ctx.fill();
        roundRect(ctx, 27, 17, 17, 7, 3);
        ctx.fill();
        roundRect(ctx, 37, 21, 7, 7, 2);
        ctx.fill();
        roundRect(ctx, 38, 30, 7, 7, 2);
        ctx.fill();
        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(20, 20, 9, 0, Math.PI * 2);
        ctx.stroke();
        addTexture(scene, 'wonder-key', c);

        c = makeCanvas(320, 448);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createLinearGradient(0, 0, 0, 112);
        g.addColorStop(0, '#A855F7');
        g.addColorStop(0.55, '#3B0764');
        g.addColorStop(1, '#05030B');
        ctx.fillStyle = g;
        roundRect(ctx, 8, 4, 64, 104, 10);
        ctx.fill();
        ctx.strokeStyle = '#F472B6';
        ctx.lineWidth = 3;
        roundRect(ctx, 8, 4, 64, 104, 10);
        ctx.stroke();
        ctx.strokeStyle = '#22D3EE';
        ctx.lineWidth = 2;
        roundRect(ctx, 18, 18, 44, 76, 8);
        ctx.stroke();
        ctx.fillStyle = '#FACC15';
        ctx.beginPath();
        ctx.arc(58, 58, 4, 0, Math.PI * 2);
        ctx.fill();
        addTexture(scene, 'wonder-boss-door', c);

        c = makeCanvas(192, 192);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createRadialGradient(24, 24, 1, 24, 24, 27);
        g.addColorStop(0, 'rgba(255,255,255,0.98)');
        g.addColorStop(0.45, 'rgba(244,114,182,0.72)');
        g.addColorStop(1, 'rgba(124,58,237,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(24, 24, 27, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#F472B6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(24, 7);
        ctx.lineTo(24, 41);
        ctx.moveTo(10, 20);
        ctx.lineTo(24, 7);
        ctx.lineTo(38, 20);
        ctx.stroke();
        addTexture(scene, 'wonder-gravity-up', c);

        c = makeCanvas(192, 192);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createRadialGradient(24, 24, 1, 24, 24, 27);
        g.addColorStop(0, 'rgba(255,255,255,0.98)');
        g.addColorStop(0.45, 'rgba(34,211,238,0.72)');
        g.addColorStop(1, 'rgba(34,211,238,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(24, 24, 27, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#22D3EE';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(24, 7);
        ctx.lineTo(24, 41);
        ctx.moveTo(10, 28);
        ctx.lineTo(24, 41);
        ctx.lineTo(38, 28);
        ctx.stroke();
        addTexture(scene, 'wonder-gravity-down', c);

        c = makeCanvas(128, 128);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createLinearGradient(0, 0, 0, 32);
        g.addColorStop(0, '#F5FEFF');
        g.addColorStop(0.32, '#60C8E8');
        g.addColorStop(1, '#0E4D70');
        ctx.fillStyle = g;
        roundRect(ctx, 0.5, 0.5, 31, 31, 6);
        ctx.fill();
        ctx.strokeStyle = '#155D7E';
        ctx.lineWidth = 2.2;
        roundRect(ctx, 0.5, 0.5, 31, 31, 6);
        ctx.stroke();
        ctx.strokeStyle = '#0F5F84';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(1, 6);
        ctx.quadraticCurveTo(16, 0, 31, 6);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        for (i = -8; i < 42; i += 12) {
            ctx.beginPath();
            ctx.moveTo(i, 22);
            ctx.lineTo(i + 14, 7);
            ctx.lineTo(i + 28, 22);
            ctx.stroke();
        }
        addTexture(scene, 'wonder-ice-top', c);

        c = makeCanvas(128, 128);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createLinearGradient(0, 0, 0, 32);
        g.addColorStop(0, '#64CBE5');
        g.addColorStop(0.52, '#247FA8');
        g.addColorStop(1, '#0B3F5D');
        ctx.fillStyle = g;
        roundRect(ctx, 1, 1, 30, 30, 6);
        ctx.fill();
        ctx.strokeStyle = '#0F4D69';
        ctx.lineWidth = 2;
        roundRect(ctx, 1, 1, 30, 30, 6);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.34)';
        ctx.lineWidth = 1;
        for (i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(4 + i * 8, 6);
            ctx.lineTo(14 + i * 6, 28);
            ctx.stroke();
        }
        addTexture(scene, 'wonder-ice-fill', c);

        c = makeCanvas(128, 128);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createLinearGradient(0, 0, 0, 32);
        g.addColorStop(0, '#FFE39A');
        g.addColorStop(0.36, '#C97A20');
        g.addColorStop(1, '#54300A');
        ctx.fillStyle = g;
        roundRect(ctx, 0.5, 0.5, 31, 31, 7);
        ctx.fill();
        ctx.strokeStyle = '#6D3F0E';
        ctx.lineWidth = 2.4;
        roundRect(ctx, 0.5, 0.5, 31, 31, 7);
        ctx.stroke();
        ctx.strokeStyle = '#6A3D0E';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(1, 7);
        ctx.quadraticCurveTo(14, 2, 31, 7);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(126,82,35,0.25)';
        for (i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(-4 + i * 10, 20);
            ctx.quadraticCurveTo(8 + i * 10, 16, 22 + i * 10, 20);
            ctx.stroke();
        }
        addTexture(scene, 'wonder-sand-top', c);

        c = makeCanvas(128, 128);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createLinearGradient(0, 0, 0, 32);
        g.addColorStop(0, '#B96F20');
        g.addColorStop(0.5, '#7A4614');
        g.addColorStop(1, '#321D08');
        ctx.fillStyle = g;
        roundRect(ctx, 1, 1, 30, 30, 6);
        ctx.fill();
        ctx.strokeStyle = '#4A2A0C';
        ctx.lineWidth = 2;
        roundRect(ctx, 1, 1, 30, 30, 6);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,238,185,0.20)';
        for (i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.ellipse(5 + i * 5, 8 + (i % 3) * 7, 2.5, 1.2, 0.1, 0, Math.PI * 2);
            ctx.fill();
        }
        addTexture(scene, 'wonder-sand-fill', c);

        c = makeCanvas(256, 64);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createLinearGradient(0, 0, 0, 16);
        g.addColorStop(0, '#FFE49B');
        g.addColorStop(0.5, '#B96F20');
        g.addColorStop(1, '#5B3511');
        ctx.fillStyle = g;
        roundRect(ctx, 1, 1, 62, 14, 7);
        ctx.fill();
        ctx.strokeStyle = '#5B3511';
        ctx.lineWidth = 2;
        roundRect(ctx, 1, 1, 62, 14, 7);
        ctx.stroke();
        ctx.strokeStyle = '#FFF0B8';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(4, 4);
        ctx.quadraticCurveTo(32, 0, 60, 4);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(72,43,15,0.38)';
        ctx.lineWidth = 1;
        for (i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(6 + i * 12, 10);
            ctx.quadraticCurveTo(12 + i * 12, 6, 18 + i * 12, 10);
            ctx.stroke();
        }
        addTexture(scene, 'wonder-sinking-sand', c);

        c = makeCanvas(128, 128);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createLinearGradient(0, 0, 0, 32);
        g.addColorStop(0, '#FFD982');
        g.addColorStop(0.5, '#B7791F');
        g.addColorStop(1, '#5A3216');
        ctx.fillStyle = g;
        roundRect(ctx, 0.5, 0.5, 31, 31, 4);
        ctx.fill();
        ctx.strokeStyle = '#F7C765';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(1, 5);
        ctx.lineTo(31, 5);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(75,42,20,0.32)';
        for (i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(2, 10 + i * 5);
            ctx.lineTo(30, 7 + i * 5);
            ctx.stroke();
        }
        addTexture(scene, 'wonder-brass-top', c);

        c = makeCanvas(128, 128);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createLinearGradient(0, 0, 0, 32);
        g.addColorStop(0, '#9B6727');
        g.addColorStop(0.52, '#6B3D1A');
        g.addColorStop(1, '#2C1A13');
        ctx.fillStyle = g;
        roundRect(ctx, 1, 1, 30, 30, 4);
        ctx.fill();
        ctx.strokeStyle = 'rgba(247,199,101,0.22)';
        for (i = -8; i < 38; i += 10) {
            ctx.beginPath();
            ctx.moveTo(i, 30);
            ctx.lineTo(i + 12, 2);
            ctx.stroke();
        }
        addTexture(scene, 'wonder-brass-fill', c);

        c = makeCanvas(600, 188);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createRadialGradient(75, 23, 4, 75, 23, 80);
        g.addColorStop(0, 'rgba(255,239,184,0.92)');
        g.addColorStop(0.55, 'rgba(217,164,65,0.70)');
        g.addColorStop(1, 'rgba(88,50,20,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(75, 23, 80, 28, 0, 0, Math.PI * 2);
        ctx.fill();
        g = ctx.createLinearGradient(0, 0, 0, 46);
        g.addColorStop(0, '#FFE6A3');
        g.addColorStop(0.52, '#B7791F');
        g.addColorStop(1, '#6B3D1A');
        ctx.fillStyle = g;
        roundRect(ctx, 8, 9, 134, 28, 10);
        ctx.fill();
        ctx.strokeStyle = '#5A3216';
        ctx.lineWidth = 2;
        roundRect(ctx, 8, 9, 134, 28, 10);
        ctx.stroke();
        ctx.strokeStyle = '#FFF0B8';
        ctx.lineWidth = 1.5;
        for (i = 0; i < 9; i++) {
            ctx.beginPath();
            ctx.moveTo(20 + i * 14, 12);
            ctx.lineTo(28 + i * 14, 34);
            ctx.stroke();
        }
        addTexture(scene, 'wonder-gear-platform', c);

        c = makeCanvas(128, 128);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createLinearGradient(0, 0, 0, 32);
        g.addColorStop(0, '#4B4368');
        g.addColorStop(0.55, '#211A35');
        g.addColorStop(1, '#090711');
        ctx.fillStyle = g;
        roundRect(ctx, 0.5, 0.5, 31, 31, 5);
        ctx.fill();
        ctx.strokeStyle = 'rgba(96,165,250,0.48)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(1, 6);
        ctx.quadraticCurveTo(16, 0, 31, 6);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(248,113,113,0.35)';
        for (i = -8; i < 38; i += 12) {
            ctx.beginPath();
            ctx.moveTo(i, 28);
            ctx.lineTo(i + 14, 5);
            ctx.stroke();
        }
        addTexture(scene, 'wonder-magnet-top', c);

        c = makeCanvas(128, 128);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createLinearGradient(0, 0, 0, 32);
        g.addColorStop(0, '#211A35');
        g.addColorStop(0.55, '#151025');
        g.addColorStop(1, '#090711');
        ctx.fillStyle = g;
        roundRect(ctx, 1, 1, 30, 30, 5);
        ctx.fill();
        ctx.strokeStyle = 'rgba(96,165,250,0.22)';
        for (i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(4 + i * 8, 4);
            ctx.lineTo(12 + i * 6, 29);
            ctx.stroke();
        }
        addTexture(scene, 'wonder-magnet-fill', c);

        c = makeCanvas(256, 180);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createLinearGradient(0, 0, 0, 45);
        g.addColorStop(0, '#FEE2E2');
        g.addColorStop(0.5, '#60A5FA');
        g.addColorStop(1, '#1D4ED8');
        ctx.fillStyle = g;
        roundRect(ctx, 6, 8, 52, 30, 9);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        roundRect(ctx, 6, 8, 52, 30, 9);
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(32, 23, 8, 0, Math.PI * 2);
        ctx.fill();
        addTexture(scene, 'wonder-magnet-switch', c);

        c = makeCanvas(128, 128);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createRadialGradient(16, 16, 2, 16, 16, 20);
        g.addColorStop(0, 'rgba(255,255,255,0.95)');
        g.addColorStop(0.55, 'rgba(96,165,250,0.72)');
        g.addColorStop(1, 'rgba(96,165,250,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(16, 16, 20, 0, Math.PI * 2);
        ctx.fill();
        g = ctx.createLinearGradient(4, 4, 28, 28);
        g.addColorStop(0, '#D1D5DB');
        g.addColorStop(1, '#4B5563');
        ctx.fillStyle = g;
        roundRect(ctx, 8, 8, 16, 16, 5);
        ctx.fill();
        ctx.strokeStyle = '#F9FAFB';
        ctx.lineWidth = 1.4;
        roundRect(ctx, 8, 8, 16, 16, 5);
        ctx.stroke();
        addTexture(scene, 'wonder-metal-node', c);

        c = makeCanvas(128, 128);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createLinearGradient(0, 0, 0, 32);
        g.addColorStop(0, '#FFFFFF');
        g.addColorStop(0.32, '#B9A3FF');
        g.addColorStop(1, '#4B34B8');
        ctx.fillStyle = g;
        roundRect(ctx, 0.5, 0.5, 31, 31, 7);
        ctx.fill();
        ctx.strokeStyle = '#6D4DCC';
        ctx.lineWidth = 2.4;
        roundRect(ctx, 0.5, 0.5, 31, 31, 7);
        ctx.stroke();
        ctx.strokeStyle = '#5936B4';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(1, 6);
        ctx.quadraticCurveTo(16, 0, 31, 6);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(168,85,247,0.34)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(4, 24);
        ctx.quadraticCurveTo(16, 18, 28, 24);
        ctx.stroke();
        addTexture(scene, 'wonder-mirror-top', c);

        c = makeCanvas(128, 128);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createLinearGradient(0, 0, 0, 32);
        g.addColorStop(0, '#AFA0FF');
        g.addColorStop(0.5, '#6B52D6');
        g.addColorStop(1, '#30217F');
        ctx.fillStyle = g;
        roundRect(ctx, 1, 1, 30, 30, 7);
        ctx.fill();
        ctx.strokeStyle = '#4430A5';
        ctx.lineWidth = 2;
        roundRect(ctx, 1, 1, 30, 30, 7);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.24)';
        for (i = 0; i < 4; i++) {
            roundRect(ctx, 5 + i * 6, 6 + (i % 2) * 9, 4, 11, 2);
            ctx.fill();
        }
        addTexture(scene, 'wonder-mirror-fill', c);

        c = makeCanvas(96, 128);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createLinearGradient(0, 0, 0, 32);
        g.addColorStop(0, '#FFFFFF');
        g.addColorStop(0.55, '#BDEFFF');
        g.addColorStop(1, '#60A5FA');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(12, 2);
        ctx.lineTo(21, 18);
        ctx.lineTo(14, 30);
        ctx.lineTo(6, 18);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.3;
        ctx.stroke();
        addTexture(scene, 'wonder-ice-crystal', c);

        c = makeCanvas(128, 128);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        ctx.strokeStyle = '#7A5B2F';
        ctx.lineWidth = 2;
        for (i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(15, 30);
            ctx.quadraticCurveTo(10 + i * 3, 17, 5 + i * 7, 6);
            ctx.stroke();
        }
        addTexture(scene, 'wonder-dune-grass', c);

        c = makeCanvas(160, 288);
        ctx = c.getContext('2d');
        ctx.scale(4, 4);
        g = ctx.createLinearGradient(0, 0, 0, 72);
        g.addColorStop(0, '#FFFFFF');
        g.addColorStop(0.45, '#EBD7FF');
        g.addColorStop(1, '#A5B4FC');
        ctx.fillStyle = g;
        roundRect(ctx, 9, 4, 22, 64, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(168,85,247,0.42)';
        ctx.lineWidth = 1.4;
        roundRect(ctx, 9, 4, 22, 64, 8);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.72)';
        ctx.beginPath();
        ctx.moveTo(14, 10);
        ctx.lineTo(25, 10);
        ctx.moveTo(14, 28);
        ctx.lineTo(25, 28);
        ctx.moveTo(14, 46);
        ctx.lineTo(25, 46);
        ctx.stroke();
        addTexture(scene, 'wonder-mirror-column', c);

        generateWonderEnemySheet(scene, 'wonder-plains-walker', false);
        generateWonderEnemySheet(scene, 'wonder-cloud-puff', false);
        generateWonderEnemySheet(scene, 'wonder-glow-crawler', false);
        generateWonderEnemySheet(scene, 'wonder-depths-fish', false);
        generateWonderEnemySheet(scene, 'wonder-depths-crab', false);
        generateWonderEnemySheet(scene, 'wonder-neon-bot', false);
        generateWonderEnemySheet(scene, 'wonder-ice-penguin', false);
        generateWonderEnemySheet(scene, 'wonder-sand-crab', false);
        generateWonderEnemySheet(scene, 'wonder-windup-bot', false);
        generateWonderEnemySheet(scene, 'wonder-metal-bug', false);
        generateWonderEnemySheet(scene, 'wonder-mirror-creature', false);
        generateWonderEnemySheet(scene, 'wonder-shell-enemy', true);
    }

    window.EXTRA_SPRITE_GENERATORS.push(generateWonderSprites);
})();
