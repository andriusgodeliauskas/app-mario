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

    function strokeRoundRect(ctx, x, y, w, h, r, color, lw) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lw || 1;
        roundRect(ctx, x, y, w, h, r);
        ctx.stroke();
    }

    function circle(ctx, x, y, r, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    function ellipse(ctx, x, y, rx, ry, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    function addSprite(scene, key, w, h, draw) {
        var canvas = makeCanvas(w * 4, h * 4);
        var ctx = canvas.getContext('2d');
        ctx.save();
        ctx.scale(4, 4);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        draw(ctx, w, h);
        ctx.restore();
        scene.textures.addSpriteSheet(key, canvas, { frameWidth: w * 4, frameHeight: h * 4 });
    }

    function signStar(ctx, x, y, r, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        for (var i = 0; i < 10; i++) {
            var rr = i % 2 ? r * 0.45 : r;
            var a = -Math.PI / 2 + i * Math.PI / 5;
            var px = x + Math.cos(a) * rr;
            var py = y + Math.sin(a) * rr;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    }

    function drawZooCage(ctx, w, h) {
        fillRoundRect(ctx, 2, 7, w - 4, h - 8, 3, '#F8D16A');
        strokeRoundRect(ctx, 2, 7, w - 4, h - 8, 3, '#8A5A23', 1.5);
        ctx.strokeStyle = '#6E8FA8';
        ctx.lineWidth = 2.2;
        for (var x = 8; x < w; x += 8) {
            ctx.beginPath(); ctx.moveTo(x, 7); ctx.lineTo(x, h - 2); ctx.stroke();
        }
        fillRoundRect(ctx, 0, 3, w, 6, 3, '#C97A2D');
        fillRoundRect(ctx, 4, h - 5, w - 8, 4, 2, '#8A5A23');
    }

    function drawMonkey(ctx, w, h) {
        ellipse(ctx, w / 2, 25, 12, 11, '#9A6236');
        ellipse(ctx, w / 2, 27, 8, 7, '#E6B678');
        ellipse(ctx, 10, 25, 4, 5, '#E6B678'); ellipse(ctx, 30, 25, 4, 5, '#E6B678');
        circle(ctx, 16, 23, 1.3, '#202020'); circle(ctx, 24, 23, 1.3, '#202020');
        ctx.strokeStyle = '#67381E'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(20, 28, 4, 0.1, Math.PI - 0.1); ctx.stroke();
        ctx.beginPath(); ctx.arc(32, 18, 8, -1.2, 1.4); ctx.stroke();
    }

    function drawElephant(ctx, w, h) {
        ellipse(ctx, 18, 24, 14, 11, '#8DB7D6');
        ellipse(ctx, 29, 22, 9, 8, '#9BC8E8');
        ellipse(ctx, 26, 21, 8, 10, '#74A4C8');
        ctx.fillStyle = '#8DB7D6';
        ctx.beginPath(); ctx.moveTo(34, 26); ctx.quadraticCurveTo(38, 31, 32, 34); ctx.lineTo(30, 31); ctx.quadraticCurveTo(34, 30, 31, 25); ctx.fill();
        circle(ctx, 32, 20, 1.2, '#202020');
        fillRoundRect(ctx, 9, 31, 5, 7, 2, '#6F95B4'); fillRoundRect(ctx, 21, 31, 5, 7, 2, '#6F95B4');
    }

    function drawTrough(ctx, w, h) {
        fillRoundRect(ctx, 4, 17, w - 8, 15, 3, '#B56D36');
        fillRoundRect(ctx, 7, 13, w - 14, 6, 3, '#F1C16E');
        ctx.strokeStyle = '#7A421E'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(8, 24); ctx.lineTo(w - 8, 24); ctx.stroke();
        fillRoundRect(ctx, 7, 31, 4, 7, 1.5, '#7A421E'); fillRoundRect(ctx, w - 11, 31, 4, 7, 1.5, '#7A421E');
    }

    function drawCircusTent(ctx, w, h) {
        ctx.fillStyle = '#FFEAA0';
        ctx.beginPath(); ctx.moveTo(4, h - 3); ctx.lineTo(w / 2, 3); ctx.lineTo(w - 4, h - 3); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#EE4444';
        ctx.beginPath(); ctx.moveTo(4, h - 3); ctx.lineTo(15, h - 3); ctx.lineTo(w / 2, 3); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(w - 15, h - 3); ctx.lineTo(w - 4, h - 3); ctx.lineTo(w / 2, 3); ctx.closePath(); ctx.fill();
        fillRoundRect(ctx, 17, 27, 10, 14, 4, '#5AA7FF');
        ctx.strokeStyle = '#A12D2D'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(w / 2, 3); ctx.lineTo(w / 2, 41); ctx.stroke();
        ctx.fillStyle = '#FFCC3D';
        ctx.beginPath(); ctx.moveTo(w / 2, 3); ctx.lineTo(w / 2 + 10, 7); ctx.lineTo(w / 2, 11); ctx.closePath(); ctx.fill();
    }

    function drawBall(ctx, w, h) {
        circle(ctx, w / 2, h / 2, 14, '#F7F7F7');
        ctx.fillStyle = '#EF4444'; ctx.beginPath(); ctx.moveTo(w / 2, h / 2); ctx.arc(w / 2, h / 2, 14, -1.57, 0.3); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#3B82F6'; ctx.beginPath(); ctx.moveTo(w / 2, h / 2); ctx.arc(w / 2, h / 2, 14, 0.3, 2.2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#FDE047'; ctx.beginPath(); ctx.moveTo(w / 2, h / 2); ctx.arc(w / 2, h / 2, 14, 2.2, 4.7); ctx.closePath(); ctx.fill();
        circle(ctx, w / 2 - 4, h / 2 - 5, 3, 'rgba(255,255,255,0.8)');
    }

    function drawTrapeze(ctx, w, h) {
        ctx.strokeStyle = '#6B4A24'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(10, 4); ctx.lineTo(15, 28); ctx.moveTo(w - 10, 4); ctx.lineTo(w - 15, 28); ctx.stroke();
        fillRoundRect(ctx, 12, 28, w - 24, 4, 2, '#E56B2F');
        signStar(ctx, w / 2, 17, 5, '#FFE15A');
    }

    function drawClownHat(ctx, w, h) {
        ctx.fillStyle = '#2F80ED';
        ctx.beginPath(); ctx.moveTo(8, 30); ctx.lineTo(w / 2, 6); ctx.lineTo(w - 8, 30); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#FFEF6B';
        ctx.beginPath(); ctx.moveTo(14, 30); ctx.lineTo(w / 2, 6); ctx.lineTo(w - 14, 30); ctx.closePath(); ctx.fill();
        circle(ctx, w / 2, 6, 4, '#FF4DA6');
        fillRoundRect(ctx, 5, 29, w - 10, 7, 3, '#EF4444');
    }

    function drawBarn(ctx, w, h) {
        fillRoundRect(ctx, 5, 16, w - 10, 24, 2, '#D94A37');
        ctx.fillStyle = '#A62F2A';
        ctx.beginPath(); ctx.moveTo(3, 17); ctx.lineTo(w / 2, 4); ctx.lineTo(w - 3, 17); ctx.closePath(); ctx.fill();
        fillRoundRect(ctx, 15, 25, 14, 15, 2, '#FFE2A2');
        ctx.strokeStyle = '#A62F2A'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(15, 25); ctx.lineTo(29, 40); ctx.moveTo(29, 25); ctx.lineTo(15, 40); ctx.stroke();
        fillRoundRect(ctx, 8, 20, 7, 6, 1, '#AEE6FF');
    }

    function drawHay(ctx, w, h) {
        fillRoundRect(ctx, 5, 18, w - 10, 18, 4, '#F1C94B');
        ctx.strokeStyle = '#C88D26'; ctx.lineWidth = 1.2;
        for (var i = 0; i < 5; i++) {
            ctx.beginPath(); ctx.moveTo(9 + i * 6, 20); ctx.lineTo(5 + i * 6, 34); ctx.stroke();
        }
        fillRoundRect(ctx, 7, 26, w - 14, 3, 1.5, '#FFE684');
    }

    function drawTractor(ctx, w, h) {
        fillRoundRect(ctx, 12, 15, 14, 13, 2, '#56B85A');
        fillRoundRect(ctx, 24, 20, 15, 8, 2, '#56B85A');
        fillRoundRect(ctx, 15, 9, 9, 8, 2, '#AEE6FF');
        circle(ctx, 14, 32, 6, '#2C2C2C'); circle(ctx, 14, 32, 3, '#F9D44A');
        circle(ctx, 33, 33, 4, '#2C2C2C'); circle(ctx, 33, 33, 2, '#F9D44A');
    }

    function drawScarecrow(ctx, w, h) {
        ctx.strokeStyle = '#8B5A2B'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(w / 2, 14); ctx.lineTo(w / 2, h - 3); ctx.moveTo(8, 23); ctx.lineTo(w - 8, 23); ctx.stroke();
        circle(ctx, w / 2, 12, 6, '#F4C56A');
        fillRoundRect(ctx, 11, 18, 18, 15, 3, '#4FA3E8');
        fillRoundRect(ctx, 13, 5, 14, 4, 1.5, '#D18B2F');
        ctx.fillStyle = '#D18B2F'; ctx.beginPath(); ctx.moveTo(12, 7); ctx.lineTo(20, 1); ctx.lineTo(28, 7); ctx.closePath(); ctx.fill();
        circle(ctx, 17, 11, 1, '#202020'); circle(ctx, 23, 11, 1, '#202020');
    }

    function drawChicken(ctx, w, h) {
        ellipse(ctx, 19, 26, 11, 9, '#FFF4D8');
        circle(ctx, 27, 20, 7, '#FFF4D8');
        ctx.fillStyle = '#F59E0B'; ctx.beginPath(); ctx.moveTo(33, 20); ctx.lineTo(39, 23); ctx.lineTo(33, 25); ctx.closePath(); ctx.fill();
        circle(ctx, 29, 18, 1.2, '#202020');
        circle(ctx, 25, 12, 2.2, '#EF4444'); circle(ctx, 29, 12, 2.2, '#EF4444');
        ctx.strokeStyle = '#D97706'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(16, 34); ctx.lineTo(14, 38); ctx.moveTo(23, 34); ctx.lineTo(25, 38); ctx.stroke();
    }

    function drawVolcano(ctx, w, h) {
        ctx.fillStyle = '#7A5948';
        ctx.beginPath(); ctx.moveTo(4, h - 2); ctx.lineTo(18, 10); ctx.lineTo(24, 10); ctx.lineTo(w - 4, h - 2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#FF6B2F';
        ctx.beginPath(); ctx.moveTo(18, 10); ctx.lineTo(24, 10); ctx.lineTo(21, 22); ctx.closePath(); ctx.fill();
        circle(ctx, 21, 8, 6, '#FF453A'); circle(ctx, 17, 5, 3, '#FFD166'); circle(ctx, 25, 5, 3, '#FFD166');
    }

    function drawFern(ctx, w, h) {
        ctx.strokeStyle = '#23884B'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(w / 2, h - 3); ctx.lineTo(w / 2, 8); ctx.stroke();
        ctx.fillStyle = '#49B85F';
        for (var i = 0; i < 6; i++) {
            var y = h - 8 - i * 5;
            ctx.beginPath(); ctx.ellipse(15 - i, y, 7, 2.5, -0.55, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(25 + i, y, 7, 2.5, 0.55, 0, Math.PI * 2); ctx.fill();
        }
    }

    function drawDino(ctx, w, h) {
        ellipse(ctx, 20, 27, 14, 9, '#51B86B');
        circle(ctx, 31, 20, 7, '#62C879');
        ctx.fillStyle = '#51B86B';
        ctx.beginPath(); ctx.moveTo(8, 26); ctx.quadraticCurveTo(0, 18, 8, 15); ctx.quadraticCurveTo(10, 21, 15, 25); ctx.fill();
        circle(ctx, 33, 18, 1.2, '#202020');
        ctx.fillStyle = '#FDE047';
        for (var i = 0; i < 4; i++) {
            ctx.beginPath(); ctx.moveTo(13 + i * 5, 18 - (i % 2)); ctx.lineTo(16 + i * 5, 12); ctx.lineTo(19 + i * 5, 18 - (i % 2)); ctx.closePath(); ctx.fill();
        }
        fillRoundRect(ctx, 15, 33, 4, 6, 2, '#3D8B52'); fillRoundRect(ctx, 26, 33, 4, 6, 2, '#3D8B52');
    }

    function drawBone(ctx, w, h) {
        ctx.strokeStyle = '#F7E5BC'; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.moveTo(12, 24); ctx.lineTo(32, 14); ctx.stroke();
        circle(ctx, 9, 22, 4, '#F7E5BC'); circle(ctx, 13, 28, 4, '#F7E5BC');
        circle(ctx, 31, 10, 4, '#F7E5BC'); circle(ctx, 35, 16, 4, '#F7E5BC');
        ctx.strokeStyle = '#B99B62'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(14, 23); ctx.lineTo(29, 16); ctx.stroke();
    }

    function drawEgg(ctx, w, h) {
        ellipse(ctx, w / 2, 23, 11, 15, '#FFF4D8');
        circle(ctx, 18, 22, 2.5, '#62C879'); circle(ctx, 24, 29, 2.2, '#62C879'); circle(ctx, 23, 15, 1.8, '#62C879');
        fillRoundRect(ctx, 11, 35, 18, 4, 2, '#A36B34');
    }

    function drawPiratePalm(ctx, w, h) {
        ctx.fillStyle = '#9A6236';
        ctx.beginPath(); ctx.moveTo(18, h); ctx.quadraticCurveTo(15, 26, 22, 10); ctx.lineTo(27, 10); ctx.quadraticCurveTo(22, 27, 24, h); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#2FAE5A';
        var cx = 24, cy = 11;
        for (var i = 0; i < 6; i++) {
            ctx.save(); ctx.translate(cx, cy); ctx.rotate(-2.7 + i * 0.55);
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(13, -4, 22, 3); ctx.quadraticCurveTo(11, 4, 0, 3); ctx.closePath(); ctx.fill();
            ctx.restore();
        }
        circle(ctx, 21, 14, 2, '#6B3A1C'); circle(ctx, 27, 14, 2, '#6B3A1C');
    }

    function drawChest(ctx, w, h) {
        fillRoundRect(ctx, 5, 19, w - 10, 18, 3, '#9B5A2E');
        ctx.fillStyle = '#C47A3A';
        ctx.beginPath(); ctx.ellipse(w / 2, 20, (w - 10) / 2, 10, 0, Math.PI, 0); ctx.fill();
        fillRoundRect(ctx, 18, 18, 6, 19, 1, '#FFD45C');
        fillRoundRect(ctx, 6, 27, w - 12, 3, 1, '#FFD45C');
        circle(ctx, w / 2, 28, 2, '#8A5A23');
    }

    function drawCannon(ctx, w, h) {
        ctx.save(); ctx.translate(21, 22); ctx.rotate(-0.18);
        fillRoundRect(ctx, -15, -6, 28, 12, 5, '#4B5563');
        fillRoundRect(ctx, 11, -8, 8, 16, 4, '#374151');
        ctx.restore();
        circle(ctx, 15, 33, 5, '#2F2F36'); circle(ctx, 30, 33, 5, '#2F2F36');
        circle(ctx, 37, 16, 2.5, '#FFE15A');
    }

    function drawPirateFlag(ctx, w, h) {
        fillRoundRect(ctx, 8, 6, 3, 33, 1, '#6B4A24');
        ctx.fillStyle = '#222633';
        ctx.beginPath(); ctx.moveTo(11, 7); ctx.lineTo(35, 11); ctx.lineTo(31, 23); ctx.lineTo(11, 20); ctx.closePath(); ctx.fill();
        circle(ctx, 22, 15, 3.2, '#FFFFFF');
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.moveTo(17, 21); ctx.lineTo(28, 11); ctx.moveTo(17, 11); ctx.lineTo(28, 21); ctx.stroke();
    }

    function drawAnchor(ctx, w, h) {
        ctx.strokeStyle = '#3F5F7A'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(w / 2, 10); ctx.lineTo(w / 2, 30); ctx.arc(w / 2, 25, 12, 0.2, Math.PI - 0.2); ctx.stroke();
        circle(ctx, w / 2, 7, 4, '#6EA3C7');
        fillRoundRect(ctx, 11, 15, 18, 3, 1.5, '#6EA3C7');
    }

    function drawGear(ctx, w, h) {
        ctx.fillStyle = '#9AA9B8';
        for (var i = 0; i < 8; i++) {
            ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(i * Math.PI / 4);
            fillRoundRect(ctx, -3, -18, 6, 8, 1.5, '#9AA9B8');
            ctx.restore();
        }
        circle(ctx, w / 2, h / 2, 13, '#B9C7D3');
        circle(ctx, w / 2, h / 2, 6, '#34445F');
    }

    function drawConveyor(ctx, w, h) {
        fillRoundRect(ctx, 3, 18, w - 6, 12, 3, '#566579');
        ctx.strokeStyle = '#A7F3FF'; ctx.lineWidth = 2;
        for (var x = 8; x < w - 4; x += 8) {
            ctx.beginPath(); ctx.moveTo(x, 19); ctx.lineTo(x + 5, 29); ctx.stroke();
        }
        circle(ctx, 9, 33, 4, '#9AA9B8'); circle(ctx, w - 9, 33, 4, '#9AA9B8');
    }

    function drawRobotArm(ctx, w, h) {
        circle(ctx, 11, 31, 6, '#7C8EA3');
        ctx.strokeStyle = '#B9C7D3'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(11, 29); ctx.lineTo(23, 18); ctx.lineTo(33, 25); ctx.stroke();
        circle(ctx, 23, 18, 4, '#FDE047');
        ctx.strokeStyle = '#7C8EA3'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(35, 24); ctx.lineTo(39, 20); ctx.moveTo(35, 25); ctx.lineTo(40, 29); ctx.stroke();
    }

    function drawPanel(ctx, w, h) {
        fillRoundRect(ctx, 6, 9, w - 12, 25, 4, '#607DAD');
        strokeRoundRect(ctx, 6, 9, w - 12, 25, 4, '#C7D2FE', 1.5);
        circle(ctx, 15, 18, 3, '#EF4444'); circle(ctx, 25, 18, 3, '#22C55E'); circle(ctx, 35, 18, 3, '#FDE047');
        fillRoundRect(ctx, 13, 26, 24, 4, 2, '#DDF7FF');
    }

    function drawSpark(ctx, w, h) {
        signStar(ctx, w / 2, h / 2, 15, '#FFE15A');
        signStar(ctx, w / 2, h / 2, 8, '#FF8A3D');
        circle(ctx, w / 2 - 4, h / 2 - 5, 2, '#FFFFFF');
    }

    function drawBed(ctx, w, h) {
        fillRoundRect(ctx, 6, 18, w - 10, 12, 3, '#AEE6FF');
        fillRoundRect(ctx, 7, 13, 12, 10, 3, '#FFFFFF');
        fillRoundRect(ctx, 20, 14, 22, 7, 2, '#FF8FA3');
        fillRoundRect(ctx, 8, 30, 3, 8, 1, '#66A6B8'); fillRoundRect(ctx, 38, 30, 3, 8, 1, '#66A6B8');
    }

    function drawMedicine(ctx, w, h) {
        fillRoundRect(ctx, 15, 10, 15, 27, 4, '#FFFFFF');
        fillRoundRect(ctx, 17, 6, 11, 6, 2, '#55C7D8');
        fillRoundRect(ctx, 15, 21, 15, 8, 1, '#FF8FA3');
        ctx.fillStyle = '#FFFFFF'; fillRoundRect(ctx, 20, 22, 5, 6, 1, '#FFFFFF'); fillRoundRect(ctx, 19, 23, 7, 4, 1, '#FFFFFF');
    }

    function drawCrossSign(ctx, w, h) {
        fillRoundRect(ctx, 7, 8, w - 14, 26, 4, '#FFFFFF');
        strokeRoundRect(ctx, 7, 8, w - 14, 26, 4, '#55C7D8', 2);
        fillRoundRect(ctx, 20, 13, 6, 16, 1, '#EF4444');
        fillRoundRect(ctx, 15, 18, 16, 6, 1, '#EF4444');
        fillRoundRect(ctx, 20, 34, 6, 5, 1, '#66A6B8');
    }

    function drawIv(ctx, w, h) {
        ctx.strokeStyle = '#78A7B8'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(22, 7); ctx.lineTo(22, 38); ctx.moveTo(16, 38); ctx.lineTo(28, 38); ctx.moveTo(22, 10); ctx.lineTo(32, 10); ctx.stroke();
        fillRoundRect(ctx, 29, 12, 9, 13, 3, '#BFF3FF');
        ctx.strokeStyle = '#FF8FA3'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(33, 25); ctx.quadraticCurveTo(33, 31, 26, 32); ctx.stroke();
    }

    function drawGoal(ctx, w, h) {
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(7, 37); ctx.lineTo(7, 12); ctx.lineTo(w - 7, 12); ctx.lineTo(w - 7, 37); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1;
        for (var x = 13; x < w - 8; x += 7) { ctx.beginPath(); ctx.moveTo(x, 13); ctx.lineTo(x, 37); ctx.stroke(); }
        for (var y = 19; y < 37; y += 6) { ctx.beginPath(); ctx.moveTo(8, y); ctx.lineTo(w - 8, y); ctx.stroke(); }
    }

    function drawBleachers(ctx, w, h) {
        fillRoundRect(ctx, 5, 26, w - 10, 7, 1, '#5AA7FF');
        fillRoundRect(ctx, 9, 18, w - 18, 7, 1, '#FFDD55');
        fillRoundRect(ctx, 13, 10, w - 26, 7, 1, '#FF6B6B');
        ctx.strokeStyle = '#556'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(8, 33); ctx.lineTo(34, 10); ctx.moveTo(34, 33); ctx.lineTo(20, 10); ctx.stroke();
    }

    function drawScoreboard(ctx, w, h) {
        fillRoundRect(ctx, 6, 8, w - 12, 24, 3, '#284B3A');
        strokeRoundRect(ctx, 6, 8, w - 12, 24, 3, '#FDE047', 1.5);
        fillRoundRect(ctx, 13, 14, 8, 8, 1, '#FDE047'); fillRoundRect(ctx, 27, 14, 8, 8, 1, '#FDE047');
        fillRoundRect(ctx, 21, 32, 5, 7, 1, '#6B4A24');
    }

    function drawBanner(ctx, w, h) {
        ctx.strokeStyle = '#6B4A24'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(4, 8); ctx.quadraticCurveTo(w / 2, 16, w - 4, 8); ctx.stroke();
        var colors = ['#EF4444', '#FDE047', '#3B82F6', '#22C55E'];
        for (var i = 0; i < 4; i++) {
            ctx.fillStyle = colors[i];
            ctx.beginPath(); ctx.moveTo(9 + i * 8, 10 + (i % 2)); ctx.lineTo(16 + i * 8, 12 + (i % 2)); ctx.lineTo(12 + i * 8, 22 + (i % 2)); ctx.closePath(); ctx.fill();
        }
    }

    function drawAirplane(ctx, w, h) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.ellipse(23, 22, 18, 5, -0.08, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#55A7FF';
        ctx.beginPath(); ctx.moveTo(20, 21); ctx.lineTo(7, 11); ctx.lineTo(17, 26); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(27, 22); ctx.lineTo(39, 12); ctx.lineTo(32, 25); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#EF4444';
        ctx.beginPath(); ctx.moveTo(7, 21); ctx.lineTo(2, 15); ctx.lineTo(10, 18); ctx.closePath(); ctx.fill();
        circle(ctx, 34, 21, 1.5, '#3F8DDE');
    }

    function drawTower(ctx, w, h) {
        fillRoundRect(ctx, 13, 17, 16, 22, 2, '#B4C4D8');
        fillRoundRect(ctx, 8, 9, 26, 10, 3, '#FFFFFF');
        strokeRoundRect(ctx, 8, 9, 26, 10, 3, '#3F8DDE', 1.5);
        fillRoundRect(ctx, 16, 22, 3, 17, 1, '#8AA3B8'); fillRoundRect(ctx, 24, 22, 3, 17, 1, '#8AA3B8');
    }

    function drawLuggageCart(ctx, w, h) {
        ctx.strokeStyle = '#637C8E'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(7, 17); ctx.lineTo(13, 32); ctx.lineTo(37, 32); ctx.stroke();
        fillRoundRect(ctx, 15, 17, 10, 14, 2, '#EF4444'); fillRoundRect(ctx, 26, 21, 9, 10, 2, '#FDE047');
        circle(ctx, 17, 35, 3, '#334155'); circle(ctx, 34, 35, 3, '#334155');
    }

    function drawRunwayLight(ctx, w, h) {
        ctx.strokeStyle = '#5A6B7A'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(w / 2, 19); ctx.lineTo(w / 2, 38); ctx.stroke();
        circle(ctx, w / 2, 15, 7, '#FFE15A');
        circle(ctx, w / 2 - 2, 13, 2, '#FFFFFF');
    }

    function drawWindsock(ctx, w, h) {
        ctx.strokeStyle = '#5A6B7A'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(9, 8); ctx.lineTo(9, 39); ctx.stroke();
        ctx.fillStyle = '#EF4444';
        ctx.beginPath(); ctx.moveTo(10, 9); ctx.lineTo(37, 13); ctx.lineTo(31, 25); ctx.lineTo(10, 21); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(18, 10); ctx.lineTo(25, 11); ctx.lineTo(21, 23); ctx.lineTo(15, 22); ctx.closePath(); ctx.fill();
    }

    function drawGhost(ctx, w, h) {
        ellipse(ctx, w / 2, 22, 13, 15, '#F7F3FF');
        ctx.fillStyle = '#F7F3FF';
        ctx.beginPath(); ctx.moveTo(9, 25); ctx.lineTo(9, 38); ctx.quadraticCurveTo(13, 34, 17, 38); ctx.quadraticCurveTo(21, 34, 25, 38); ctx.quadraticCurveTo(29, 34, 33, 38); ctx.lineTo(33, 25); ctx.closePath(); ctx.fill();
        circle(ctx, 17, 21, 1.8, '#2D2548'); circle(ctx, 25, 21, 1.8, '#2D2548');
        ctx.strokeStyle = '#2D2548'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(21, 27, 4, 0.2, Math.PI - 0.2); ctx.stroke();
    }

    function drawCandle(ctx, w, h) {
        fillRoundRect(ctx, 17, 17, 10, 21, 3, '#FFF4D8');
        ctx.fillStyle = '#FFD166';
        ctx.beginPath(); ctx.moveTo(22, 5); ctx.quadraticCurveTo(31, 16, 22, 20); ctx.quadraticCurveTo(14, 14, 22, 5); ctx.fill();
        circle(ctx, 22, 14, 3, '#FF7A3D');
        fillRoundRect(ctx, 13, 37, 18, 3, 1.5, '#6A4FB0');
    }

    function drawCobweb(ctx, w, h) {
        ctx.strokeStyle = '#D8CCFF'; ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(7, 7); ctx.lineTo(36, 7); ctx.lineTo(36, 35);
        ctx.moveTo(7, 7); ctx.lineTo(36, 35);
        ctx.moveTo(18, 7); ctx.lineTo(36, 24);
        ctx.moveTo(28, 7); ctx.lineTo(36, 14);
        ctx.stroke();
        ctx.beginPath(); ctx.arc(36, 7, 14, Math.PI / 2, Math.PI); ctx.arc(36, 7, 22, Math.PI / 2, Math.PI); ctx.stroke();
    }

    function drawTombstone(ctx, w, h) {
        fillRoundRect(ctx, 10, 11, 24, 27, 7, '#8D87A8');
        strokeRoundRect(ctx, 10, 11, 24, 27, 7, '#5F557A', 1.5);
        fillRoundRect(ctx, 16, 22, 12, 3, 1, '#D8CCFF');
        fillRoundRect(ctx, 18, 27, 8, 2, 1, '#D8CCFF');
        fillRoundRect(ctx, 7, 36, 30, 4, 2, '#4C4263');
    }

    function drawPumpkin(ctx, w, h) {
        ellipse(ctx, 22, 25, 15, 12, '#F97316');
        ellipse(ctx, 15, 25, 7, 11, '#FB923C'); ellipse(ctx, 29, 25, 7, 11, '#EA580C');
        fillRoundRect(ctx, 20, 10, 5, 7, 2, '#4D7C0F');
        ctx.fillStyle = '#FFE15A';
        ctx.beginPath(); ctx.moveTo(15, 23); ctx.lineTo(19, 20); ctx.lineTo(20, 25); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(29, 23); ctx.lineTo(25, 20); ctx.lineTo(24, 25); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.arc(22, 29, 5, 0, Math.PI); ctx.fill();
    }

    window.EXTRA_SPRITE_GENERATORS.push(function (scene) {
        addSprite(scene, 'zoo-cage-bars-deco', 40, 40, drawZooCage);
        addSprite(scene, 'zoo-monkey-deco', 40, 40, drawMonkey);
        addSprite(scene, 'zoo-elephant-deco', 44, 40, drawElephant);
        addSprite(scene, 'zoo-trough-deco', 42, 40, drawTrough);

        addSprite(scene, 'circus-tent-deco', 44, 44, drawCircusTent);
        addSprite(scene, 'circus-ball-deco', 36, 36, drawBall);
        addSprite(scene, 'circus-trapeze-deco', 42, 38, drawTrapeze);
        addSprite(scene, 'circus-clown-hat-deco', 40, 40, drawClownHat);

        addSprite(scene, 'farm-barn-deco', 44, 42, drawBarn);
        addSprite(scene, 'farm-hay-bale-deco', 42, 40, drawHay);
        addSprite(scene, 'farm-tractor-deco', 46, 42, drawTractor);
        addSprite(scene, 'farm-scarecrow-deco', 40, 44, drawScarecrow);
        addSprite(scene, 'farm-chicken-deco', 42, 40, drawChicken);

        addSprite(scene, 'dino-volcano-deco', 42, 44, drawVolcano);
        addSprite(scene, 'dino-fern-deco', 42, 44, drawFern);
        addSprite(scene, 'dino-silhouette-deco', 44, 40, drawDino);
        addSprite(scene, 'dino-bone-deco', 44, 38, drawBone);
        addSprite(scene, 'dino-egg-deco', 40, 42, drawEgg);

        addSprite(scene, 'pirate-palm-deco', 48, 56, drawPiratePalm);
        addSprite(scene, 'pirate-chest-deco', 42, 40, drawChest);
        addSprite(scene, 'pirate-cannon-deco', 44, 40, drawCannon);
        addSprite(scene, 'pirate-flag-deco', 42, 42, drawPirateFlag);
        addSprite(scene, 'pirate-anchor-deco', 42, 42, drawAnchor);

        addSprite(scene, 'robot-gear-deco', 42, 42, drawGear);
        addSprite(scene, 'robot-conveyor-deco', 48, 40, drawConveyor);
        addSprite(scene, 'robot-arm-deco', 44, 42, drawRobotArm);
        addSprite(scene, 'robot-panel-deco', 46, 42, drawPanel);
        addSprite(scene, 'robot-spark-deco', 34, 34, drawSpark);

        addSprite(scene, 'hospital-bed-deco', 48, 42, drawBed);
        addSprite(scene, 'hospital-medicine-deco', 44, 42, drawMedicine);
        addSprite(scene, 'hospital-cross-sign-deco', 44, 42, drawCrossSign);
        addSprite(scene, 'hospital-iv-stand-deco', 44, 44, drawIv);

        addSprite(scene, 'stadium-goal-deco', 52, 42, drawGoal);
        addSprite(scene, 'stadium-bleachers-deco', 46, 40, drawBleachers);
        addSprite(scene, 'stadium-ball-deco', 36, 36, drawBall);
        addSprite(scene, 'stadium-scoreboard-deco', 46, 42, drawScoreboard);
        addSprite(scene, 'stadium-banner-deco', 44, 32, drawBanner);

        addSprite(scene, 'airport-airplane-deco', 48, 38, drawAirplane);
        addSprite(scene, 'airport-tower-deco', 44, 44, drawTower);
        addSprite(scene, 'airport-luggage-cart-deco', 44, 40, drawLuggageCart);
        addSprite(scene, 'airport-runway-light-deco', 34, 42, drawRunwayLight);
        addSprite(scene, 'airport-windsock-deco', 44, 44, drawWindsock);

        addSprite(scene, 'haunted-ghost-deco', 42, 42, drawGhost);
        addSprite(scene, 'haunted-candle-deco', 42, 42, drawCandle);
        addSprite(scene, 'haunted-cobweb-deco', 44, 40, drawCobweb);
        addSprite(scene, 'haunted-tombstone-deco', 44, 42, drawTombstone);
        addSprite(scene, 'haunted-pumpkin-deco', 44, 42, drawPumpkin);
    });
})();
