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

    function circle(ctx, x, y, r, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    function ellipse(ctx, x, y, rx, ry, rot, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2);
        ctx.fill();
    }

    function addOutline(ctx, x, y, w, h) {
        var temp = makeCanvas(w + 10, h + 10);
        var tc = temp.getContext('2d');
        tc.drawImage(ctx.canvas, x, y, w, h, 5, 5, w, h);
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.globalAlpha = 0.45;
        ctx.drawImage(temp, x - 6, y - 3);
        ctx.drawImage(temp, x - 4, y - 6);
        ctx.drawImage(temp, x - 2, y - 3);
        ctx.drawImage(temp, x - 4, y);
        ctx.restore();
    }

    function generateRunnerMario(scene) {
        if (scene.textures.exists('mario-runner')) return;

        var frameW = 128;
        var frameH = 128;
        var canvas = makeCanvas(frameW * 4, frameH);
        var ctx = canvas.getContext('2d');

        function drawFrame(ox, pose) {
            ctx.save();
            ctx.translate(ox, 0);
            ctx.scale(4, 4);

            var step = pose === 'run1' ? -1.8 : (pose === 'run2' ? 1.8 : 0);
            var jumping = pose === 'jump';
            var lean = jumping ? -1.2 : 0;

            // Shadow under the character's feet, visible from behind.
            ellipse(ctx, 16, 30.5, jumping ? 7 : 9, 2.4, 0, 'rgba(0,0,0,0.25)');

            // Shoes behind the overalls.
            fillRoundRect(ctx, 7 + step, jumping ? 26 : 27.5, 8, 4.5, 2, '#5E3219');
            fillRoundRect(ctx, 17 - step, jumping ? 24.5 : 27.5, 8, 4.5, 2, '#5E3219');
            circle(ctx, 10 + step, jumping ? 27 : 28.5, 1, '#B8793B');
            circle(ctx, 21 - step, jumping ? 25.5 : 28.5, 1, '#B8793B');

            // Legs / overalls.
            fillRoundRect(ctx, 8.5 + step, jumping ? 21.5 : 23.5, 6.5, 7, 2, '#202090');
            fillRoundRect(ctx, 17 - step, jumping ? 20 : 23.5, 6.5, 7, 2, '#202090');
            fillRoundRect(ctx, 8.5 + lean, 16.5, 15, 10.5, 3, '#2532B4');
            fillRoundRect(ctx, 10.5 + lean, 17.5, 4, 9.5, 1.5, '#4359F5');
            fillRoundRect(ctx, 17.5 + lean, 17.5, 4, 9.5, 1.5, '#4359F5');
            circle(ctx, 13, 20.5, 1.1, '#F8D830');
            circle(ctx, 19, 20.5, 1.1, '#F8D830');

            // Red sleeves and gloved hands.
            fillRoundRect(ctx, 5.8, 17 + (jumping ? -4.8 : step), 4.5, 8.8, 2, '#E8261C');
            fillRoundRect(ctx, 21.7, 17 + (jumping ? -7.5 : -step), 4.5, 8.8, 2, '#E8261C');
            circle(ctx, 6.4, 24 + (jumping ? -7.8 : step), 2.6, '#FFFFFF');
            circle(ctx, 25.6, 24 + (jumping ? -10.5 : -step), 2.6, '#FFFFFF');
            circle(ctx, 5.5, 23 + (jumping ? -7.8 : step), 0.8, '#D6EEFF');
            circle(ctx, 26.5, 23 + (jumping ? -10.5 : -step), 0.8, '#D6EEFF');

            // Back of head and hair peeking under the cap.
            ellipse(ctx, 16 + lean, 12.8, 8.4, 7.2, 0, '#FCA044');
            fillRoundRect(ctx, 8.8 + lean, 10.7, 14.4, 6.4, 3, '#8B4A22');
            ellipse(ctx, 10, 14.5, 2.5, 3.5, 0, '#6B3518');
            ellipse(ctx, 22, 14.5, 2.5, 3.5, 0, '#6B3518');

            // Red cap from behind with a clear brim and white logo dot.
            var hatGrad = ctx.createLinearGradient(0, 2, 0, 11);
            hatGrad.addColorStop(0, '#FF4438');
            hatGrad.addColorStop(1, '#A90F0F');
            ctx.fillStyle = hatGrad;
            roundRect(ctx, 6.6 + lean, 2.6, 18.8, 9.4, 4);
            ctx.fill();
            fillRoundRect(ctx, 4.8 + lean, 9, 22.4, 4, 2, '#B01010');
            circle(ctx, 16, 7.5, 2.5, '#FFFFFF');
            ctx.fillStyle = '#E8261C';
            ctx.font = 'bold 4px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('M', 16, 7.8);

            ctx.restore();
        }

        drawFrame(0, 'idle');
        addOutline(ctx, 0, 0, frameW, frameH);
        drawFrame(frameW, 'run1');
        addOutline(ctx, frameW, 0, frameW, frameH);
        drawFrame(frameW * 2, 'run2');
        addOutline(ctx, frameW * 2, 0, frameW, frameH);
        drawFrame(frameW * 3, 'jump');
        addOutline(ctx, frameW * 3, 0, frameW, frameH);

        scene.textures.addSpriteSheet('mario-runner', canvas, { frameWidth: frameW, frameHeight: frameH });
    }

    function generateRunnerObstacles(scene) {
        if (!scene.textures.exists('runner-low-obstacle')) {
            var low = makeCanvas(192, 88);
            var lc = low.getContext('2d');
            lc.scale(4, 4);
            var baseGrad = lc.createLinearGradient(0, 9, 0, 21);
            baseGrad.addColorStop(0, '#FFEC72');
            baseGrad.addColorStop(0.5, '#FFB82E');
            baseGrad.addColorStop(1, '#D87516');
            lc.fillStyle = 'rgba(40,30,40,0.25)';
            lc.beginPath();
            lc.ellipse(24, 20, 21, 3, 0, 0, Math.PI * 2);
            lc.fill();
            lc.fillStyle = baseGrad;
            roundRect(lc, 4, 10, 40, 10, 4);
            lc.fill();
            lc.lineWidth = 1.5;
            lc.strokeStyle = '#8A430E';
            lc.stroke();
            lc.fillStyle = '#FFF9B8';
            roundRect(lc, 8, 12, 32, 3, 1.5);
            lc.fill();
            lc.fillStyle = '#FF5EA8';
            for (var a = 0; a < 4; a++) {
                lc.beginPath();
                lc.moveTo(10 + a * 9, 10);
                lc.lineTo(14 + a * 9, 4);
                lc.lineTo(18 + a * 9, 10);
                lc.closePath();
                lc.fill();
                lc.strokeStyle = '#9B245C';
                lc.stroke();
            }
            lc.fillStyle = '#FFFFFF';
            lc.font = 'bold 5px sans-serif';
            lc.textAlign = 'center';
            lc.fillText('JUMP', 24, 18);
            scene.textures.addCanvas('runner-low-obstacle', low);
        }

        if (!scene.textures.exists('runner-solid-obstacle')) {
            var solid = makeCanvas(160, 168);
            var sc = solid.getContext('2d');
            sc.scale(4, 4);
            sc.fillStyle = 'rgba(35,25,45,0.28)';
            sc.beginPath();
            sc.ellipse(20, 39, 15, 3.4, 0, 0, Math.PI * 2);
            sc.fill();
            var bodyGrad = sc.createLinearGradient(0, 4, 0, 38);
            bodyGrad.addColorStop(0, '#FF6B7C');
            bodyGrad.addColorStop(0.55, '#E8261C');
            bodyGrad.addColorStop(1, '#8F1010');
            sc.fillStyle = bodyGrad;
            roundRect(sc, 8, 5, 24, 34, 5);
            sc.fill();
            sc.lineWidth = 1.5;
            sc.strokeStyle = '#5E0808';
            sc.stroke();
            sc.fillStyle = '#FFFFFF';
            roundRect(sc, 12, 10, 16, 6, 2);
            sc.fill();
            sc.fillStyle = '#18235A';
            circle(sc, 16, 13, 1.5, '#18235A');
            circle(sc, 24, 13, 1.5, '#18235A');
            sc.fillStyle = '#FFD447';
            roundRect(sc, 11, 23, 18, 5, 2);
            sc.fill();
            sc.fillStyle = '#FFFFFF';
            roundRect(sc, 13, 24, 14, 2, 1);
            sc.fill();
            sc.fillStyle = '#72F2FF';
            sc.beginPath();
            sc.moveTo(8, 21);
            sc.lineTo(1, 25);
            sc.lineTo(8, 29);
            sc.closePath();
            sc.fill();
            sc.beginPath();
            sc.moveTo(32, 21);
            sc.lineTo(39, 25);
            sc.lineTo(32, 29);
            sc.closePath();
            sc.fill();
            scene.textures.addCanvas('runner-solid-obstacle', solid);
        }
    }

    window.EXTRA_SPRITE_GENERATORS.push(function (scene) {
        generateRunnerMario(scene);
        generateRunnerObstacles(scene);
    });
})();
