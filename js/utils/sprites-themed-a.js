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

    function ellipse(ctx, x, y, rx, ry, rot, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2);
        ctx.fill();
    }

    function line(ctx, x1, y1, x2, y2, color, lw) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lw || 1;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    function addSprite(scene, key, w, h, draw) {
        if (scene.textures.exists(key)) return;
        var canvas = makeCanvas(w * 2, h * 2);
        var ctx = canvas.getContext('2d');
        ctx.save();
        ctx.scale(2, 2);
        draw(ctx, w, h);
        ctx.restore();
        scene.textures.addSpriteSheet(key, canvas, { frameWidth: w * 2, frameHeight: h * 2 });
    }

    function text(ctx, value, x, y, size, color) {
        ctx.fillStyle = color;
        ctx.font = 'bold ' + size + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value, x, y);
    }

    function drawFlag(ctx, x, y, color) {
        line(ctx, x, y, x, y + 34, '#5f6778', 2);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 2);
        ctx.lineTo(x + 24, y + 7);
        ctx.lineTo(x + 2, y + 16);
        ctx.closePath();
        ctx.fill();
        line(ctx, x + 2, y + 2, x + 24, y + 7, 'rgba(255,255,255,0.55)', 1);
    }

    function registerGarden(scene) {
        addSprite(scene, 'garden-watering-can-deco', 44, 34, function (ctx) {
            fillRoundRect(ctx, 8, 13, 25, 16, 5, '#4ec7ff');
            strokeRoundRect(ctx, 8, 13, 25, 16, 5, '#1678b5', 1.5);
            line(ctx, 31, 16, 42, 9, '#1678b5', 3);
            line(ctx, 6, 18, 0, 14, '#1678b5', 2);
            ctx.strokeStyle = '#1678b5'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(15, 14, 8, Math.PI, Math.PI * 1.85); ctx.stroke();
            circle(ctx, 15, 18, 3, '#bff3ff');
            line(ctx, 38, 12, 42, 8, '#bff3ff', 1);
            circle(ctx, 42, 7, 1.4, '#bff3ff');
        });
        addSprite(scene, 'garden-flower-bed-deco', 54, 24, function (ctx) {
            fillRoundRect(ctx, 2, 14, 50, 8, 4, '#7a4a24');
            for (var i = 0; i < 6; i++) {
                var x = 8 + i * 8;
                line(ctx, x, 15, x, 9, '#279b3a', 1.5);
                circle(ctx, x - 2, 7, 2.5, i % 2 ? '#ffd447' : '#ff65ae');
                circle(ctx, x + 2, 7, 2.5, i % 2 ? '#67d7ff' : '#ff8a5b');
                circle(ctx, x, 6, 2.5, '#ffffff');
                circle(ctx, x, 8, 1.5, '#ffc928');
            }
        });
        addSprite(scene, 'garden-hedge-deco', 52, 28, function (ctx) {
            fillRoundRect(ctx, 3, 13, 46, 12, 5, '#29a84c');
            for (var i = 0; i < 5; i++) circle(ctx, 9 + i * 9, 13, 8, i % 2 ? '#39c95b' : '#48d868');
            line(ctx, 5, 24, 48, 24, '#167a32', 1.5);
            circle(ctx, 18, 10, 2, '#ffe45f');
            circle(ctx, 36, 15, 2, '#ff72bc');
        });
        addSprite(scene, 'garden-butterfly-deco', 28, 24, function (ctx) {
            ellipse(ctx, 9, 11, 7, 5, -0.5, '#ff82c8');
            ellipse(ctx, 19, 11, 7, 5, 0.5, '#75d7ff');
            ellipse(ctx, 10, 16, 5, 3, 0.4, '#ffca43');
            ellipse(ctx, 18, 16, 5, 3, -0.4, '#8eea65');
            line(ctx, 14, 8, 14, 19, '#5b3a8e', 2);
            line(ctx, 13, 8, 9, 4, '#5b3a8e', 1);
            line(ctx, 15, 8, 19, 4, '#5b3a8e', 1);
        });
    }

    function registerShip(scene) {
        addSprite(scene, 'ship-sail-deco', 46, 58, function (ctx) {
            line(ctx, 22, 6, 22, 55, '#6e4220', 4);
            ctx.fillStyle = '#fff3c7'; ctx.beginPath(); ctx.moveTo(24, 8); ctx.lineTo(42, 32); ctx.lineTo(24, 32); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#ff6b57'; ctx.beginPath(); ctx.moveTo(20, 14); ctx.lineTo(4, 40); ctx.lineTo(20, 40); ctx.closePath(); ctx.fill();
            line(ctx, 4, 43, 42, 43, '#6e4220', 3);
            circle(ctx, 22, 7, 3, '#ffd447');
        });
        addSprite(scene, 'ship-crate-deco', 34, 30, function (ctx) {
            fillRoundRect(ctx, 3, 5, 28, 22, 3, '#c98335');
            strokeRoundRect(ctx, 3, 5, 28, 22, 3, '#7a461c', 2);
            line(ctx, 6, 8, 28, 24, '#7a461c', 2);
            line(ctx, 28, 8, 6, 24, '#7a461c', 2);
        });
        addSprite(scene, 'ship-barrel-deco', 30, 32, function (ctx) {
            ellipse(ctx, 15, 16, 11, 15, 0, '#b87333');
            line(ctx, 7, 8, 23, 8, '#5b371e', 2);
            line(ctx, 6, 24, 24, 24, '#5b371e', 2);
            line(ctx, 11, 3, 11, 29, 'rgba(255,210,130,0.45)', 1);
            line(ctx, 19, 3, 19, 29, '#7a461c', 1);
        });
        addSprite(scene, 'ship-wheel-deco', 38, 38, function (ctx) {
            for (var i = 0; i < 8; i++) {
                var a = i * Math.PI / 4;
                line(ctx, 19, 19, 19 + Math.cos(a) * 17, 19 + Math.sin(a) * 17, '#7a461c', 3);
            }
            ctx.strokeStyle = '#a96b2b'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(19, 19, 12, 0, Math.PI * 2); ctx.stroke();
            circle(ctx, 19, 19, 5, '#ffd27a');
        });
        addSprite(scene, 'ship-seagull-deco', 34, 18, function (ctx) {
            line(ctx, 4, 12, 15, 7, '#ffffff', 3);
            line(ctx, 18, 7, 30, 12, '#ffffff', 3);
            line(ctx, 15, 7, 18, 7, '#52627a', 1);
        });
    }

    function registerSchool(scene) {
        addSprite(scene, 'school-blackboard-deco', 58, 38, function (ctx) {
            fillRoundRect(ctx, 3, 4, 52, 26, 3, '#7b5126');
            fillRoundRect(ctx, 7, 8, 44, 18, 2, '#247a4b');
            line(ctx, 12, 24, 30, 24, '#ffffff', 1);
            text(ctx, 'ABC', 28, 17, 9, '#ffffff');
            line(ctx, 17, 30, 13, 36, '#7b5126', 3);
            line(ctx, 41, 30, 45, 36, '#7b5126', 3);
        });
        addSprite(scene, 'school-desk-deco', 44, 30, function (ctx) {
            fillRoundRect(ctx, 5, 8, 34, 12, 3, '#e2a34f');
            line(ctx, 9, 20, 6, 29, '#7b5126', 3);
            line(ctx, 35, 20, 38, 29, '#7b5126', 3);
            line(ctx, 8, 12, 36, 12, 'rgba(255,245,180,0.55)', 1);
        });
        addSprite(scene, 'school-books-deco', 36, 30, function (ctx) {
            fillRoundRect(ctx, 4, 20, 28, 7, 2, '#3d9cff');
            fillRoundRect(ctx, 7, 12, 25, 8, 2, '#ff6b57');
            fillRoundRect(ctx, 3, 5, 24, 8, 2, '#ffd447');
            line(ctx, 10, 5, 10, 12, '#ffffff', 1);
            line(ctx, 13, 12, 13, 20, '#ffffff', 1);
            line(ctx, 17, 20, 17, 27, '#ffffff', 1);
        });
        addSprite(scene, 'school-pencil-deco', 46, 18, function (ctx) {
            fillRoundRect(ctx, 6, 7, 28, 6, 2, '#ffd447');
            ctx.fillStyle = '#f2c093'; ctx.beginPath(); ctx.moveTo(34, 7); ctx.lineTo(44, 10); ctx.lineTo(34, 13); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#424242'; ctx.beginPath(); ctx.moveTo(40, 9); ctx.lineTo(44, 10); ctx.lineTo(40, 11); ctx.closePath(); ctx.fill();
            fillRoundRect(ctx, 1, 7, 6, 6, 2, '#ff7bbd');
        });
    }

    function registerKindergarten(scene) {
        addSprite(scene, 'kindergarten-blocks-deco', 44, 32, function (ctx) {
            var cols = ['#ff6b57', '#4ec7ff', '#ffd447', '#7ddf64'];
            for (var i = 0; i < 4; i++) {
                var x = 4 + i * 9, y = i % 2 ? 15 : 7;
                fillRoundRect(ctx, x, y, 10, 10, 2, cols[i]);
                text(ctx, String.fromCharCode(65 + i), x + 5, y + 5, 6, '#ffffff');
            }
        });
        addSprite(scene, 'kindergarten-teddy-deco', 34, 38, function (ctx) {
            circle(ctx, 10, 10, 6, '#a96b3a'); circle(ctx, 24, 10, 6, '#a96b3a');
            circle(ctx, 17, 18, 13, '#c98549');
            ellipse(ctx, 17, 23, 8, 6, 0, '#f0c08b');
            circle(ctx, 13, 16, 1.5, '#2a1a12'); circle(ctx, 21, 16, 1.5, '#2a1a12');
            circle(ctx, 17, 21, 2, '#2a1a12');
            ellipse(ctx, 8, 31, 5, 4, -0.4, '#c98549'); ellipse(ctx, 26, 31, 5, 4, 0.4, '#c98549');
        });
        addSprite(scene, 'kindergarten-ball-deco', 30, 30, function (ctx) {
            circle(ctx, 15, 15, 12, '#ffffff');
            ctx.fillStyle = '#ff6b57'; ctx.beginPath(); ctx.arc(15, 15, 12, -0.2, 1.9); ctx.lineTo(15, 15); ctx.fill();
            ctx.fillStyle = '#4ec7ff'; ctx.beginPath(); ctx.arc(15, 15, 12, 1.9, 4.0); ctx.lineTo(15, 15); ctx.fill();
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(15, 15, 12, 0, Math.PI * 2); ctx.stroke();
        });
        addSprite(scene, 'kindergarten-crayon-deco', 42, 20, function (ctx) {
            fillRoundRect(ctx, 5, 6, 27, 8, 2, '#8d65ff');
            ctx.fillStyle = '#ffe1b5'; ctx.beginPath(); ctx.moveTo(32, 6); ctx.lineTo(40, 10); ctx.lineTo(32, 14); ctx.closePath(); ctx.fill();
            line(ctx, 12, 6, 12, 14, '#ffffff', 1);
            line(ctx, 27, 6, 27, 14, '#ffffff', 1);
        });
    }

    function registerMarket(scene) {
        addSprite(scene, 'market-shelf-deco', 58, 44, function (ctx) {
            fillRoundRect(ctx, 4, 6, 50, 34, 3, '#e6a84b');
            for (var y = 15; y <= 31; y += 8) line(ctx, 7, y, 51, y, '#7d4c24', 2);
            for (var i = 0; i < 9; i++) circle(ctx, 12 + i * 5, 11 + (i % 3) * 8, 2.2, ['#ff5a56', '#7ddf64', '#4ec7ff'][i % 3]);
        });
        addSprite(scene, 'market-cart-deco', 48, 34, function (ctx) {
            line(ctx, 10, 8, 36, 8, '#708090', 2);
            line(ctx, 14, 22, 38, 22, '#708090', 2);
            line(ctx, 10, 8, 15, 22, '#708090', 2);
            line(ctx, 36, 8, 38, 22, '#708090', 2);
            line(ctx, 37, 9, 45, 4, '#708090', 2);
            for (var i = 0; i < 4; i++) line(ctx, 17 + i * 5, 9, 18 + i * 5, 21, '#9fb0bd', 1);
            circle(ctx, 17, 28, 3, '#333333'); circle(ctx, 36, 28, 3, '#333333');
        });
        addSprite(scene, 'market-fruit-crate-deco', 44, 32, function (ctx) {
            fillRoundRect(ctx, 5, 14, 34, 14, 3, '#b87333');
            for (var i = 0; i < 7; i++) circle(ctx, 11 + i * 4, 12 - (i % 2) * 3, 4, i % 2 ? '#7ddf64' : '#ff5a56');
            line(ctx, 7, 19, 37, 19, '#7d4c24', 2);
        });
        addSprite(scene, 'market-price-sign-deco', 34, 38, function (ctx) {
            line(ctx, 17, 13, 17, 37, '#6e4220', 3);
            fillRoundRect(ctx, 4, 4, 26, 14, 3, '#fff27a');
            strokeRoundRect(ctx, 4, 4, 26, 14, 3, '#e0882d', 1.5);
            text(ctx, '$', 17, 11, 11, '#2f7a43');
        });
    }

    function registerCountries(scene) {
        addSprite(scene, 'countries-flag-deco', 34, 48, function (ctx) { drawFlag(ctx, 8, 5, '#ff5a56'); line(ctx, 3, 45, 18, 45, '#5f6778', 3); });
        addSprite(scene, 'countries-eiffel-deco', 38, 54, function (ctx) {
            line(ctx, 19, 5, 7, 52, '#394050', 3); line(ctx, 19, 5, 31, 52, '#394050', 3);
            line(ctx, 11, 36, 27, 36, '#394050', 3); line(ctx, 14, 22, 24, 22, '#394050', 2);
            line(ctx, 11, 52, 27, 52, '#394050', 4);
        });
        addSprite(scene, 'countries-pyramid-deco', 52, 34, function (ctx) {
            ctx.fillStyle = '#e5bc63'; ctx.beginPath(); ctx.moveTo(26, 4); ctx.lineTo(50, 31); ctx.lineTo(2, 31); ctx.closePath(); ctx.fill();
            ctx.fillStyle = 'rgba(255,245,185,0.55)'; ctx.beginPath(); ctx.moveTo(26, 4); ctx.lineTo(26, 31); ctx.lineTo(2, 31); ctx.closePath(); ctx.fill();
            line(ctx, 10, 23, 42, 23, '#bd8e42', 1); line(ctx, 16, 16, 36, 16, '#bd8e42', 1);
        });
        addSprite(scene, 'countries-bigben-deco', 34, 56, function (ctx) {
            fillRoundRect(ctx, 9, 15, 16, 38, 2, '#b98645');
            ctx.fillStyle = '#8f5e2e'; ctx.beginPath(); ctx.moveTo(17, 4); ctx.lineTo(26, 15); ctx.lineTo(8, 15); ctx.closePath(); ctx.fill();
            circle(ctx, 17, 25, 6, '#fff4bd'); text(ctx, 'I', 17, 25, 7, '#5a3a20');
            line(ctx, 13, 36, 21, 36, '#fff4bd', 1); line(ctx, 13, 44, 21, 44, '#fff4bd', 1);
        });
        addSprite(scene, 'countries-gediminas-deco', 42, 48, function (ctx) {
            fillRoundRect(ctx, 8, 14, 26, 31, 2, '#c94a35');
            fillRoundRect(ctx, 5, 8, 32, 9, 1, '#e55c46');
            fillRoundRect(ctx, 10, 3, 6, 8, 1, '#e55c46'); fillRoundRect(ctx, 26, 3, 6, 8, 1, '#e55c46');
            fillRoundRect(ctx, 14, 26, 6, 19, 2, '#6a3a28'); fillRoundRect(ctx, 24, 26, 5, 7, 1, '#fff0b0');
        });
    }

    function registerMetro(scene) {
        addSprite(scene, 'metro-train-deco', 70, 36, function (ctx) {
            fillRoundRect(ctx, 4, 8, 62, 22, 5, '#4d8cff');
            fillRoundRect(ctx, 10, 12, 14, 8, 2, '#c8f4ff'); fillRoundRect(ctx, 29, 12, 14, 8, 2, '#c8f4ff'); fillRoundRect(ctx, 48, 12, 10, 8, 2, '#c8f4ff');
            line(ctx, 7, 25, 63, 25, '#ffd447', 2);
            circle(ctx, 18, 31, 3, '#242a38'); circle(ctx, 52, 31, 3, '#242a38');
        });
        addSprite(scene, 'metro-rail-deco', 58, 18, function (ctx) {
            line(ctx, 3, 7, 55, 7, '#9ca8b8', 3); line(ctx, 3, 14, 55, 14, '#9ca8b8', 3);
            for (var i = 0; i < 6; i++) line(ctx, 8 + i * 9, 3, 4 + i * 9, 17, '#5e6878', 2);
        });
        addSprite(scene, 'metro-light-deco', 24, 34, function (ctx) {
            line(ctx, 12, 0, 12, 11, '#6b7280', 2);
            fillRoundRect(ctx, 5, 10, 14, 11, 4, '#ffe45f');
            ctx.fillStyle = 'rgba(255,228,95,0.35)'; ctx.beginPath(); ctx.moveTo(6, 20); ctx.lineTo(18, 20); ctx.lineTo(23, 34); ctx.lineTo(1, 34); ctx.closePath(); ctx.fill();
        });
        addSprite(scene, 'metro-sign-deco', 54, 32, function (ctx) {
            line(ctx, 10, 14, 10, 31, '#778092', 3); line(ctx, 44, 14, 44, 31, '#778092', 3);
            fillRoundRect(ctx, 4, 5, 46, 14, 3, '#24314c');
            strokeRoundRect(ctx, 4, 5, 46, 14, 3, '#ffd447', 1.5);
            text(ctx, 'M', 27, 12, 12, '#ffffff');
        });
    }

    function registerWaterpark(scene) {
        addSprite(scene, 'waterpark-slide-deco', 58, 54, function (ctx) {
            line(ctx, 13, 12, 13, 52, '#888888', 3); line(ctx, 46, 24, 46, 52, '#888888', 3);
            ctx.strokeStyle = '#ff6b57'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(12, 11); ctx.quadraticCurveTo(56, 12, 44, 34); ctx.quadraticCurveTo(36, 50, 8, 47); ctx.stroke();
            line(ctx, 12, 11, 44, 34, 'rgba(255,255,255,0.45)', 2);
        });
        addSprite(scene, 'waterpark-ring-deco', 34, 34, function (ctx) {
            ctx.strokeStyle = '#ff6b57'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(17, 17, 11, 0, Math.PI * 2); ctx.stroke();
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(17, 17, 11, 0.4, 1.2); ctx.stroke(); ctx.beginPath(); ctx.arc(17, 17, 11, 3.5, 4.3); ctx.stroke();
        });
        addSprite(scene, 'waterpark-ladder-deco', 28, 44, function (ctx) {
            line(ctx, 8, 5, 8, 42, '#dfe8ef', 3); line(ctx, 20, 5, 20, 42, '#dfe8ef', 3);
            for (var y = 12; y <= 34; y += 8) line(ctx, 8, y, 20, y, '#9fb0bd', 2);
        });
        addSprite(scene, 'waterpark-splash-deco', 44, 26, function (ctx) {
            for (var i = 0; i < 6; i++) circle(ctx, 8 + i * 6, 17 - (i % 2) * 7, 3 + (i % 2), '#bff3ff');
            line(ctx, 5, 23, 39, 23, '#4ec7ff', 4);
        });
    }

    function registerPoopDemons(scene) {
        addSprite(scene, 'poopdemons-silly-deco', 42, 42, function (ctx) {
            ellipse(ctx, 21, 29, 17, 10, 0, '#9b6a34'); ellipse(ctx, 21, 20, 13, 9, 0, '#b9823f'); ellipse(ctx, 21, 12, 9, 7, 0, '#d39850');
            ctx.fillStyle = '#ffdf3f'; ctx.beginPath(); ctx.moveTo(9, 11); ctx.lineTo(4, 3); ctx.lineTo(15, 8); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(33, 11); ctx.lineTo(38, 3); ctx.lineTo(27, 8); ctx.closePath(); ctx.fill();
            circle(ctx, 16, 20, 2.4, '#ffffff'); circle(ctx, 26, 20, 2.4, '#ffffff'); circle(ctx, 17, 20, 1.1, '#28323a'); circle(ctx, 25, 20, 1.1, '#28323a');
            line(ctx, 17, 28, 25, 28, '#5b3318', 1.5);
        });
        addSprite(scene, 'poopdemons-stink-cloud-deco', 42, 30, function (ctx) {
            circle(ctx, 12, 17, 8, 'rgba(173,225,94,0.85)'); circle(ctx, 24, 13, 9, 'rgba(190,238,116,0.8)'); circle(ctx, 32, 19, 7, 'rgba(156,214,84,0.8)');
            line(ctx, 9, 8, 17, 4, '#5f8e38', 1.2); line(ctx, 22, 23, 31, 26, '#5f8e38', 1.2);
        });
        addSprite(scene, 'poopdemons-slime-deco', 46, 18, function (ctx) {
            ellipse(ctx, 23, 12, 20, 6, 0, '#74d64b'); circle(ctx, 14, 9, 4, '#a6f07a'); circle(ctx, 28, 10, 3, '#b6ff90'); circle(ctx, 35, 13, 2, '#e0ffc8');
        });
    }

    function registerSpaceForestJungleCave(scene) {
        addSprite(scene, 'space2-planet-ring-deco', 38, 34, function (ctx) {
            ctx.strokeStyle = 'rgba(255,228,135,0.8)';
            ctx.lineWidth = 4;
            ctx.save();
            ctx.translate(19, 17);
            ctx.rotate(-0.25);
            ctx.scale(1, 0.35);
            ctx.beginPath();
            ctx.arc(0, 0, 17, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            var g = ctx.createRadialGradient(14, 12, 2, 19, 17, 13);
            g.addColorStop(0, '#ff89cf');
            g.addColorStop(0.55, '#8d65ff');
            g.addColorStop(1, '#41328f');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(19, 17, 12, 0, Math.PI * 2);
            ctx.fill();
            circle(ctx, 15, 13, 2.2, 'rgba(255,255,255,0.55)');
            line(ctx, 9, 21, 29, 14, 'rgba(255,255,255,0.25)', 1);
        });
        addSprite(scene, 'space2-asteroid-deco', 34, 30, function (ctx) {
            ellipse(ctx, 17, 15, 14, 11, -0.2, '#9c8f86'); circle(ctx, 11, 11, 2.5, '#776b65'); circle(ctx, 22, 18, 3, '#776b65'); circle(ctx, 25, 10, 2, '#c5bbb3');
        });
        addSprite(scene, 'space2-satellite-deco', 46, 28, function (ctx) {
            fillRoundRect(ctx, 17, 9, 12, 10, 2, '#dfe8ef'); circle(ctx, 23, 14, 3, '#4ec7ff');
            fillRoundRect(ctx, 2, 8, 13, 12, 1, '#5aa3ff'); fillRoundRect(ctx, 31, 8, 13, 12, 1, '#5aa3ff');
            line(ctx, 15, 14, 17, 14, '#9aa5b5', 2); line(ctx, 29, 14, 31, 14, '#9aa5b5', 2);
        });
        addSprite(scene, 'forest2-pine-deco', 42, 64, function (ctx) {
            line(ctx, 21, 30, 21, 62, '#7a461c', 6);
            var ys = [8, 21, 34];
            for (var i = 0; i < ys.length; i++) {
                ctx.fillStyle = i === 0 ? '#38c45a' : '#229943';
                ctx.beginPath(); ctx.moveTo(21, ys[i]); ctx.lineTo(4 + i * 2, ys[i] + 22); ctx.lineTo(38 - i * 2, ys[i] + 22); ctx.closePath(); ctx.fill();
            }
        });
        addSprite(scene, 'forest2-fern-deco', 38, 30, function (ctx) {
            line(ctx, 19, 28, 19, 7, '#1f873a', 2);
            for (var i = 0; i < 6; i++) {
                var y = 10 + i * 3;
                line(ctx, 19, y, 8 + i, y - 5, '#37c75a', 2);
                line(ctx, 19, y, 30 - i, y - 5, '#37c75a', 2);
            }
        });
        addSprite(scene, 'forest2-fireflies-deco', 34, 28, function (ctx) {
            for (var i = 0; i < 6; i++) {
                var x = 6 + (i * 7) % 26, y = 7 + (i * 5) % 18;
                circle(ctx, x, y, 4, 'rgba(255,238,92,0.28)'); circle(ctx, x, y, 1.7, '#fff27a');
            }
        });
        addSprite(scene, 'jungle2-vine-deco', 20, 62, function (ctx) {
            ctx.strokeStyle = '#28a646'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(10, 0); ctx.quadraticCurveTo(2, 22, 12, 41); ctx.quadraticCurveTo(19, 52, 11, 62); ctx.stroke();
            ellipse(ctx, 5, 22, 6, 3, -0.7, '#54d96f'); ellipse(ctx, 16, 40, 6, 3, 0.7, '#54d96f');
        });
        addSprite(scene, 'jungle2-temple-block-deco', 46, 38, function (ctx) {
            fillRoundRect(ctx, 4, 8, 38, 27, 3, '#87905d');
            strokeRoundRect(ctx, 4, 8, 38, 27, 3, '#4f5738', 2);
            circle(ctx, 17, 20, 4, '#4f5738'); circle(ctx, 29, 20, 4, '#4f5738');
            line(ctx, 16, 30, 31, 30, '#4f5738', 2);
            line(ctx, 9, 14, 37, 14, 'rgba(255,255,210,0.35)', 1);
        });
        addSprite(scene, 'jungle2-big-leaf-deco', 42, 34, function (ctx) {
            ctx.fillStyle = '#43c967'; ctx.beginPath(); ctx.moveTo(6, 29); ctx.quadraticCurveTo(15, 0, 38, 7); ctx.quadraticCurveTo(36, 27, 6, 29); ctx.fill();
            line(ctx, 8, 28, 35, 8, '#1f873a', 2);
            line(ctx, 19, 20, 15, 10, '#1f873a', 1); line(ctx, 26, 15, 33, 19, '#1f873a', 1);
        });
        addSprite(scene, 'underground2-crystal-cluster-deco', 42, 44, function (ctx) {
            function gem(cx, by, gw, gh, a, b) {
                var g = ctx.createLinearGradient(cx, by - gh, cx, by);
                g.addColorStop(0, a); g.addColorStop(1, b); ctx.fillStyle = g;
                ctx.beginPath(); ctx.moveTo(cx, by - gh); ctx.lineTo(cx + gw, by - gh * 0.45); ctx.lineTo(cx + gw * 0.6, by); ctx.lineTo(cx - gw * 0.6, by); ctx.lineTo(cx - gw, by - gh * 0.45); ctx.closePath(); ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.moveTo(cx, by - gh); ctx.lineTo(cx, by); ctx.lineTo(cx - gw * 0.45, by - gh * 0.45); ctx.closePath(); ctx.fill();
            }
            gem(12, 42, 7, 28, '#9af4ff', '#227dcc'); gem(26, 42, 9, 38, '#e6a6ff', '#7d3cc8'); gem(33, 42, 5, 22, '#fff27a', '#d78a35');
        });
        addSprite(scene, 'underground2-minecart-deco', 50, 34, function (ctx) {
            ctx.fillStyle = '#69535a'; ctx.beginPath(); ctx.moveTo(8, 10); ctx.lineTo(42, 10); ctx.lineTo(35, 25); ctx.lineTo(14, 25); ctx.closePath(); ctx.fill();
            strokeRoundRect(ctx, 9, 10, 32, 15, 2, '#2e2730', 2);
            circle(ctx, 17, 29, 4, '#222222'); circle(ctx, 34, 29, 4, '#222222');
        });
        addSprite(scene, 'underground2-lantern-deco', 28, 42, function (ctx) {
            line(ctx, 14, 0, 14, 8, '#6b5c45', 2);
            fillRoundRect(ctx, 7, 11, 14, 20, 4, '#f2b84b');
            ctx.fillStyle = 'rgba(255,220,93,0.35)'; ctx.beginPath(); ctx.moveTo(8, 26); ctx.lineTo(20, 26); ctx.lineTo(26, 42); ctx.lineTo(2, 42); ctx.closePath(); ctx.fill();
            strokeRoundRect(ctx, 7, 11, 14, 20, 4, '#6b5c45', 2);
        });
    }

    window.EXTRA_SPRITE_GENERATORS.push(function (scene) {
        registerGarden(scene);
        registerShip(scene);
        registerSchool(scene);
        registerKindergarten(scene);
        registerMarket(scene);
        registerCountries(scene);
        registerMetro(scene);
        registerWaterpark(scene);
        registerPoopDemons(scene);
        registerSpaceForestJungleCave(scene);
    });
})();
