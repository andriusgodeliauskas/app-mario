(function () {
    'use strict';

    window.LEVEL_GENERATORS = window.LEVEL_GENERATORS || {};

    var TILE = 32;
    var GROUND_Y = 544;

    function x(col) {
        return col * TILE + 16;
    }

    function deco(cols, y, baseScale, tints) {
        var list = [];
        for (var i = 0; i < cols.length; i++) {
            var item = { x: x(cols[i]), y: y, scale: baseScale + ((i % 3) * 0.1) };
            if (tints && tints[i % tints.length]) item.tint = tints[i % tints.length];
            list.push(item);
        }
        return list;
    }

    function coins(cols, row) {
        var list = [];
        for (var i = 0; i < cols.length; i++) list.push({ col: cols[i], row: row || 16, tile: 50 });
        return list;
    }

    function arcCoins(from, to, row) {
        var list = [];
        for (var c = from; c <= to; c++) list.push({ col: c, row: row, tile: 50 });
        return list;
    }

    function withArcs(base, arcs) {
        var out = base.slice();
        for (var i = 0; i < arcs.length; i++) out = out.concat(arcCoins(arcs[i][0], arcs[i][1], arcs[i][2]));
        return out;
    }

    function makeLevel(opts) {
        return {
            map: window.buildThemedMap(opts),
            decorations: opts.decorations || {},
            variant: 'a'
        };
    }

    // LEVEL 20 — GARDEN / Sodas
    window.LEVEL_GENERATORS[20] = function () {
        return makeLevel({
            groundTile: 1,
            earthTile: 2,
            safeStart: 10,
            gaps: [
                { from: 44, to: 46 },
                { from: 112, to: 114, bridgeRow: 15, bridgeTile: 11 },
                { from: 188, to: 190 }
            ],
            platforms: [
                { col: 18, row: 13, width: 5, tile: 1 }, { col: 32, row: 12, width: 4, tile: 1 },
                { col: 56, row: 13, width: 6, tile: 1 }, { col: 76, row: 12, width: 5, tile: 1 },
                { col: 100, row: 13, width: 5, tile: 1 }, { col: 132, row: 12, width: 5, tile: 1 },
                { col: 160, row: 13, width: 6, tile: 1 }, { col: 214, row: 12, width: 5, tile: 1 },
                { col: 244, row: 13, width: 6, tile: 1 }
            ],
            pipes: [{ col: 68, row: 15 }, { col: 144, row: 15 }, { col: 224, row: 15 }],
            blocks: [{ col: 21, row: 12, tile: 4 }, { col: 58, row: 12, tile: 40 }, { col: 102, row: 12, tile: 4 },
                { col: 134, row: 11, tile: 41 }, { col: 216, row: 11, tile: 4 }, { col: 246, row: 12, tile: 43 }],
            coins: withArcs(coins([8, 9, 10, 26, 27, 40, 41, 72, 73, 92, 93, 120, 121, 150, 151, 176, 177, 204, 205, 232, 233, 270, 271]), [[18, 22, 11], [56, 61, 11], [132, 136, 10], [244, 250, 11]]),
            enemies: [{ col: 36, tile: 60 }, { col: 84, tile: 60 }, { col: 124, tile: 61 }, { col: 170, tile: 60 }, { col: 236, tile: 60 }],
            flagCol: 290,
            decorations: {
                custom: [
                    { x: x(7), y: 527, key: 'garden-watering-can-deco', scale: 1.1 },
                    { x: x(16), y: 532, key: 'garden-flower-bed-deco', scale: 1.15 },
                    { x: x(31), y: 530, key: 'garden-hedge-deco', scale: 1.2 },
                    { x: x(45), y: 150, key: 'garden-butterfly-deco', scale: 1.1, depth: -5 },
                    { x: x(74), y: 527, key: 'garden-watering-can-deco', scale: 1.0, flipX: true },
                    { x: x(104), y: 532, key: 'garden-flower-bed-deco', scale: 1.2 },
                    { x: x(138), y: 530, key: 'garden-hedge-deco', scale: 1.1 },
                    { x: x(176), y: 132, key: 'garden-butterfly-deco', scale: 1.2, depth: -5, flipX: true },
                    { x: x(222), y: 527, key: 'garden-watering-can-deco', scale: 1.1 },
                    { x: x(266), y: 532, key: 'garden-flower-bed-deco', scale: 1.15 }
                ],
                clouds: deco([10, 44, 86, 130, 180, 230, 276], 64, 1.0),
                bushes: deco([14, 28, 54, 88, 118, 154, 196, 236, 266], GROUND_Y, 1.0),
                flowers: deco([20, 34, 62, 96, 126, 166, 208, 248, 282], GROUND_Y, 1.0, [0xff99cc, 0xffff66, 0x88ddff]),
                grass: deco([24, 70, 110, 140, 174, 218, 258], GROUND_Y, 0.9)
            }
        });
    };

    // LEVEL 21 — SHIP / Laivas
    window.LEVEL_GENERATORS[21] = function () {
        return makeLevel({
            groundTile: 11,
            earthTile: 3,
            safeStart: 10,
            gaps: [
                { from: 38, to: 41, bridgeRow: 15, bridgeTile: 11 }, { from: 82, to: 85 },
                { from: 130, to: 133, bridgeRow: 15, bridgeTile: 11 }, { from: 184, to: 187 },
                { from: 232, to: 235, bridgeRow: 15, bridgeTile: 11 }
            ],
            platforms: [
                { col: 20, row: 13, width: 5, tile: 3 }, { col: 48, row: 12, width: 4, tile: 11 },
                { col: 66, row: 13, width: 5, tile: 3 }, { col: 102, row: 12, width: 7, tile: 11 },
                { col: 112, row: 9, width: 3, tile: 11 }, { col: 116, row: 7, width: 3, tile: 11 },
                { col: 150, row: 13, width: 5, tile: 3 }, { col: 202, row: 12, width: 6, tile: 11 },
                { col: 250, row: 13, width: 5, tile: 3 }
            ],
            pipes: [{ col: 58, row: 15 }, { col: 216, row: 15 }],
            movers: [{ col: 92, row: 13 }, { col: 174, row: 13 }],
            blocks: [{ col: 22, row: 12, tile: 4 }, { col: 68, row: 12, tile: 40 }, { col: 104, row: 11, tile: 4 },
                { col: 117, row: 6, tile: 41 }, { col: 204, row: 11, tile: 4 }, { col: 252, row: 12, tile: 43 }],
            coins: withArcs(coins([9, 10, 30, 31, 54, 55, 74, 75, 96, 97, 140, 141, 166, 167, 196, 197, 222, 223, 262, 263]), [[48, 51, 10], [102, 108, 10], [112, 118, 8], [202, 208, 10], [250, 255, 11]]),
            enemies: [{ col: 34, tile: 60 }, { col: 72, tile: 61 }, { col: 122, tile: 60 }, { col: 158, tile: 60 }, { col: 212, tile: 61 }, { col: 258, tile: 60 }],
            flagCol: 290,
            decorations: {
                custom: [
                    { x: x(13), y: 515, key: 'ship-sail-deco', scale: 1.05 },
                    { x: x(27), y: 529, key: 'ship-crate-deco', scale: 1.1 },
                    { x: x(47), y: 528, key: 'ship-barrel-deco', scale: 1.05 },
                    { x: x(69), y: 526, key: 'ship-wheel-deco', scale: 1.0 },
                    { x: x(94), y: 84, key: 'ship-seagull-deco', scale: 1.1, depth: -9, scrollFactor: 0.35 },
                    { x: x(126), y: 515, key: 'ship-sail-deco', scale: 1.0, flipX: true },
                    { x: x(170), y: 529, key: 'ship-crate-deco', scale: 1.0 },
                    { x: x(214), y: 528, key: 'ship-barrel-deco', scale: 1.1 },
                    { x: x(254), y: 526, key: 'ship-wheel-deco', scale: 1.0 },
                    { x: x(276), y: 74, key: 'ship-seagull-deco', scale: 1.2, depth: -9, scrollFactor: 0.35, flipX: true }
                ],
                waves: deco([30, 80, 132, 184, 236, 282], GROUND_Y, 1.2),
                planks: deco([22, 60, 104, 146, 202, 250], GROUND_Y, 1.0),
                clouds: deco([18, 70, 122, 176, 232, 278], 56, 0.9),
                fences: deco([108, 116, 124, 210, 218], GROUND_Y, 0.9)
            }
        });
    };

    // LEVEL 22 — SCHOOL / Mokykla
    window.LEVEL_GENERATORS[22] = function () {
        return makeLevel({
            groundTile: 3,
            earthTile: 11,
            safeStart: 10,
            gaps: [{ from: 64, to: 66 }, { from: 146, to: 148 }, { from: 226, to: 228 }],
            platforms: [
                { col: 18, row: 13, width: 6, tile: 3 }, { col: 38, row: 12, width: 5, tile: 11 },
                { col: 72, row: 13, width: 6, tile: 3 }, { col: 96, row: 12, width: 5, tile: 11 },
                { col: 120, row: 14, width: 3, tile: 3 }, { col: 124, row: 13, width: 3, tile: 3 }, { col: 128, row: 12, width: 3, tile: 3 },
                { col: 158, row: 13, width: 6, tile: 11 }, { col: 190, row: 12, width: 5, tile: 3 }, { col: 238, row: 13, width: 6, tile: 11 }
            ],
            pipes: [{ col: 82, row: 15 }, { col: 176, row: 15 }],
            blocks: [{ col: 20, row: 12, tile: 4 }, { col: 40, row: 11, tile: 40 }, { col: 98, row: 11, tile: 4 },
                { col: 130, row: 11, tile: 41 }, { col: 192, row: 11, tile: 4 }, { col: 240, row: 12, tile: 43 }],
            coins: withArcs(coins([8, 9, 28, 29, 52, 53, 88, 89, 110, 111, 136, 137, 170, 171, 204, 205, 260, 261]), [[18, 24, 11], [38, 43, 10], [120, 131, 10], [158, 164, 11], [238, 244, 11]]),
            enemies: [{ col: 34, tile: 60 }, { col: 78, tile: 60 }, { col: 114, tile: 61 }, { col: 152, tile: 60 }, { col: 212, tile: 60 }, { col: 250, tile: 61 }],
            flagCol: 290,
            decorations: {
                custom: [
                    { x: x(12), y: 525, key: 'school-blackboard-deco', scale: 1.05 },
                    { x: x(30), y: 529, key: 'school-desk-deco', scale: 1.0 },
                    { x: x(50), y: 529, key: 'school-books-deco', scale: 1.1 },
                    { x: x(73), y: 535, key: 'school-pencil-deco', scale: 1.1 },
                    { x: x(104), y: 525, key: 'school-blackboard-deco', scale: 1.0 },
                    { x: x(142), y: 529, key: 'school-desk-deco', scale: 1.05, flipX: true },
                    { x: x(182), y: 529, key: 'school-books-deco', scale: 1.05 },
                    { x: x(230), y: 535, key: 'school-pencil-deco', scale: 1.2, flipX: true },
                    { x: x(268), y: 525, key: 'school-blackboard-deco', scale: 1.0 }
                ],
                rocks: deco([42, 96, 158, 220], GROUND_Y, 0.9, [0x203820]),
                fences: deco([20, 48, 76, 120, 164, 192, 240], GROUND_Y, 0.8, [0x7a4a20]),
                sparkles: deco([30, 92, 150, 214, 270], 110, 0.8, [0xffffff]),
                clouds: deco([58, 132, 206, 278], 62, 0.7, [0xf2f2f2])
            }
        });
    };

    // LEVEL 23 — KINDERGARTEN / Darzelis
    window.LEVEL_GENERATORS[23] = function () {
        return makeLevel({
            groundTile: 1,
            earthTile: 2,
            safeStart: 12,
            gaps: [{ from: 92, to: 93 }, { from: 178, to: 179 }],
            platforms: [
                { col: 16, row: 14, width: 5, tile: 3 }, { col: 28, row: 13, width: 5, tile: 11 },
                { col: 44, row: 12, width: 5, tile: 3 }, { col: 70, row: 14, width: 6, tile: 11 },
                { col: 106, row: 13, width: 6, tile: 3 }, { col: 138, row: 14, width: 6, tile: 11 },
                { col: 162, row: 13, width: 5, tile: 3 }, { col: 202, row: 12, width: 6, tile: 11 },
                { col: 238, row: 14, width: 6, tile: 3 }
            ],
            pipes: [{ col: 120, row: 15 }, { col: 222, row: 15 }],
            blocks: [{ col: 18, row: 13, tile: 43 }, { col: 30, row: 12, tile: 4 }, { col: 46, row: 11, tile: 40 },
                { col: 108, row: 12, tile: 4 }, { col: 164, row: 12, tile: 41 }, { col: 204, row: 11, tile: 4 }, { col: 240, row: 13, tile: 4 }],
            coins: withArcs(coins([6, 7, 8, 9, 10, 34, 35, 58, 59, 82, 83, 96, 97, 126, 127, 150, 151, 184, 185, 214, 215, 250, 251, 274, 275]), [[16, 21, 12], [28, 33, 11], [44, 50, 10], [70, 76, 12], [106, 112, 11], [138, 144, 12], [202, 208, 10], [238, 244, 12]]),
            enemies: [{ col: 54, tile: 60 }, { col: 116, tile: 60 }, { col: 190, tile: 60 }, { col: 258, tile: 60 }],
            flagCol: 290,
            decorations: {
                custom: [
                    { x: x(10), y: 528, key: 'kindergarten-blocks-deco', scale: 1.2 },
                    { x: x(24), y: 525, key: 'kindergarten-teddy-deco', scale: 1.1 },
                    { x: x(54), y: 529, key: 'kindergarten-ball-deco', scale: 1.0 },
                    { x: x(82), y: 535, key: 'kindergarten-crayon-deco', scale: 1.15 },
                    { x: x(116), y: 528, key: 'kindergarten-blocks-deco', scale: 1.15 },
                    { x: x(154), y: 525, key: 'kindergarten-teddy-deco', scale: 1.0, flipX: true },
                    { x: x(196), y: 529, key: 'kindergarten-ball-deco', scale: 1.05 },
                    { x: x(228), y: 535, key: 'kindergarten-crayon-deco', scale: 1.1, flipX: true },
                    { x: x(266), y: 528, key: 'kindergarten-blocks-deco', scale: 1.2 }
                ],
                hills: deco([36, 104, 172, 240], GROUND_Y, 0.9, [0xff6666, 0x66ccff, 0xffdd66]),
                flowers: deco([18, 46, 74, 112, 146, 186, 224, 264], GROUND_Y, 1.2, [0xff66aa, 0xffdd33, 0x66ddff]),
                mushrooms: deco([30, 96, 160, 230], GROUND_Y, 0.9),
                sparkles: deco([24, 84, 144, 204, 264], 120, 1.0, [0xffee88, 0xffffff])
            }
        });
    };

    // LEVEL 24 — SUPERMARKET / Supermarketas
    window.LEVEL_GENERATORS[24] = function () {
        return makeLevel({
            groundTile: 11,
            earthTile: 3,
            safeStart: 10,
            gaps: [{ from: 50, to: 52 }, { from: 106, to: 108 }, { from: 166, to: 168 }, { from: 226, to: 228 }],
            platforms: [
                { col: 18, row: 13, width: 10, tile: 3 }, { col: 38, row: 12, width: 8, tile: 11 },
                { col: 62, row: 13, width: 10, tile: 3 }, { col: 86, row: 12, width: 8, tile: 11 },
                { col: 118, row: 13, width: 10, tile: 3 }, { col: 144, row: 12, width: 8, tile: 11 },
                { col: 178, row: 13, width: 10, tile: 3 }, { col: 202, row: 12, width: 8, tile: 11 },
                { col: 238, row: 13, width: 10, tile: 3 }
            ],
            pipes: [{ col: 76, row: 15 }, { col: 192, row: 15 }],
            movers: [{ col: 134, row: 13 }, { col: 216, row: 13 }],
            blocks: [{ col: 22, row: 12, tile: 4 }, { col: 42, row: 11, tile: 40 }, { col: 66, row: 12, tile: 4 },
                { col: 90, row: 11, tile: 41 }, { col: 122, row: 12, tile: 4 }, { col: 182, row: 12, tile: 43 }, { col: 242, row: 12, tile: 4 }],
            coins: withArcs(coins([8, 9, 32, 33, 56, 57, 80, 81, 100, 101, 112, 113, 158, 159, 172, 173, 194, 195, 232, 233, 256, 257, 274, 275]), [[18, 28, 11], [38, 46, 10], [62, 72, 11], [118, 128, 11], [178, 188, 11], [238, 248, 11]]),
            enemies: [{ col: 34, tile: 60 }, { col: 74, tile: 61 }, { col: 116, tile: 60 }, { col: 154, tile: 60 }, { col: 198, tile: 61 }, { col: 250, tile: 60 }],
            flagCol: 290,
            decorations: {
                custom: [
                    { x: x(12), y: 522, key: 'market-shelf-deco', scale: 1.05 },
                    { x: x(34), y: 527, key: 'market-cart-deco', scale: 1.0 },
                    { x: x(56), y: 528, key: 'market-fruit-crate-deco', scale: 1.05 },
                    { x: x(82), y: 525, key: 'market-price-sign-deco', scale: 1.0 },
                    { x: x(122), y: 522, key: 'market-shelf-deco', scale: 1.0 },
                    { x: x(154), y: 527, key: 'market-cart-deco', scale: 1.0, flipX: true },
                    { x: x(188), y: 528, key: 'market-fruit-crate-deco', scale: 1.1 },
                    { x: x(222), y: 525, key: 'market-price-sign-deco', scale: 1.05 },
                    { x: x(258), y: 522, key: 'market-shelf-deco', scale: 1.0 }
                ],
                fences: deco([18, 46, 86, 126, 166, 206, 246], GROUND_Y, 0.9, [0xb06030]),
                rocks: deco([34, 94, 154, 214, 270], GROUND_Y, 0.8, [0x777777]),
                flowers: deco([26, 70, 122, 182, 242], GROUND_Y, 0.8, [0xff3333, 0x33cc66, 0xffff33]),
                sparkles: deco([58, 138, 218], 94, 0.8, [0xffffff])
            }
        });
    };

    // LEVEL 25 — COUNTRIES / Salys
    window.LEVEL_GENERATORS[25] = function () {
        return makeLevel({
            groundTile: 1,
            earthTile: 11,
            safeStart: 10,
            sections: [
                { from: 42, to: 78, groundTile: 11, earthTile: 3 },
                { from: 112, to: 148, groundTile: 3, earthTile: 11 },
                { from: 182, to: 218, groundTile: 1, earthTile: 2 },
                { from: 248, to: 286, groundTile: 11, earthTile: 3 }
            ],
            gaps: [{ from: 36, to: 38 }, { from: 96, to: 99, bridgeRow: 15, bridgeTile: 11 }, { from: 166, to: 169 }, { from: 232, to: 234 }],
            platforms: [
                { col: 18, row: 13, width: 5, tile: 11 }, { col: 50, row: 12, width: 5, tile: 3 },
                { col: 62, row: 10, width: 3, tile: 11 }, { col: 86, row: 13, width: 5, tile: 1 },
                { col: 120, row: 12, width: 6, tile: 3 }, { col: 138, row: 10, width: 4, tile: 11 },
                { col: 190, row: 13, width: 6, tile: 1 }, { col: 204, row: 11, width: 4, tile: 3 },
                { col: 254, row: 12, width: 6, tile: 11 }
            ],
            pipes: [{ col: 72, row: 15 }, { col: 152, row: 15 }, { col: 222, row: 15 }],
            blocks: [{ col: 20, row: 12, tile: 4 }, { col: 52, row: 11, tile: 40 }, { col: 88, row: 12, tile: 4 },
                { col: 122, row: 11, tile: 41 }, { col: 192, row: 12, tile: 4 }, { col: 256, row: 11, tile: 43 }],
            coins: withArcs(coins([8, 9, 28, 29, 44, 45, 80, 81, 106, 107, 156, 157, 176, 177, 224, 225, 240, 241, 272, 273]), [[18, 23, 11], [50, 65, 9], [120, 142, 10], [190, 208, 10], [254, 260, 10]]),
            enemies: [{ col: 32, tile: 60 }, { col: 82, tile: 61 }, { col: 132, tile: 60 }, { col: 160, tile: 60 }, { col: 198, tile: 61 }, { col: 264, tile: 60 }],
            flagCol: 290,
            decorations: {
                custom: [
                    { x: x(12), y: 520, key: 'countries-flag-deco', scale: 1.05 },
                    { x: x(50), y: 517, key: 'countries-eiffel-deco', scale: 1.0 },
                    { x: x(82), y: 527, key: 'countries-pyramid-deco', scale: 1.1 },
                    { x: x(120), y: 516, key: 'countries-bigben-deco', scale: 1.0 },
                    { x: x(154), y: 520, key: 'countries-gediminas-deco', scale: 1.0 },
                    { x: x(192), y: 520, key: 'countries-flag-deco', scale: 1.05, tint: 0x55dd77 },
                    { x: x(224), y: 527, key: 'countries-pyramid-deco', scale: 1.0 },
                    { x: x(258), y: 517, key: 'countries-eiffel-deco', scale: 0.95 },
                    { x: x(278), y: 520, key: 'countries-gediminas-deco', scale: 0.95 }
                ],
                hills: deco([52, 126, 198, 264], GROUND_Y, 1.2, [0xdddddd, 0xd0b080, 0x70b070, 0xaaaacc]),
                fences: deco([60, 136, 206, 258], GROUND_Y, 1.0, [0x444444, 0xd6bd7f, 0x7c4a28, 0x333333]),
                palms: deco([96, 168], GROUND_Y, 0.8),
                rainbows: deco([36, 236], GROUND_Y, 0.8)
            }
        });
    };

    // LEVEL 26 — METRO / Metro
    window.LEVEL_GENERATORS[26] = function () {
        return makeLevel({
            groundTile: 11,
            earthTile: 11,
            safeStart: 10,
            gaps: [{ from: 58, to: 60 }, { from: 118, to: 120 }, { from: 180, to: 182 }, { from: 238, to: 240 }],
            platforms: [
                { col: 16, row: 13, width: 9, tile: 3 }, { col: 34, row: 12, width: 10, tile: 11 },
                { col: 70, row: 13, width: 12, tile: 3 }, { col: 94, row: 12, width: 10, tile: 11 },
                { col: 132, row: 13, width: 12, tile: 3 }, { col: 154, row: 12, width: 10, tile: 11 },
                { col: 194, row: 13, width: 12, tile: 3 }, { col: 214, row: 12, width: 10, tile: 11 },
                { col: 252, row: 13, width: 10, tile: 3 }
            ],
            pipes: [{ col: 84, row: 15 }, { col: 168, row: 15 }, { col: 226, row: 15 }],
            movers: [{ col: 50, row: 13 }, { col: 112, row: 13 }, { col: 174, row: 13 }, { col: 234, row: 13 }],
            blocks: [{ col: 20, row: 12, tile: 4 }, { col: 38, row: 11, tile: 40 }, { col: 74, row: 12, tile: 4 },
                { col: 98, row: 11, tile: 41 }, { col: 136, row: 12, tile: 4 }, { col: 198, row: 12, tile: 43 }, { col: 256, row: 12, tile: 4 }],
            coins: withArcs(coins([8, 9, 28, 29, 64, 65, 88, 89, 124, 125, 148, 149, 186, 187, 208, 209, 244, 245, 268, 269]), [[16, 25, 11], [34, 44, 10], [70, 82, 11], [132, 144, 11], [194, 206, 11], [252, 262, 11]]),
            enemies: [{ col: 32, tile: 60 }, { col: 90, tile: 61 }, { col: 128, tile: 60 }, { col: 172, tile: 61 }, { col: 212, tile: 60 }, { col: 264, tile: 60 }],
            flagCol: 290,
            decorations: {
                custom: [
                    { x: x(14), y: 526, key: 'metro-train-deco', scale: 1.0 },
                    { x: x(38), y: 535, key: 'metro-rail-deco', scale: 1.2 },
                    { x: x(68), y: 150, key: 'metro-light-deco', scale: 1.1, depth: -7 },
                    { x: x(98), y: 526, key: 'metro-sign-deco', scale: 1.05 },
                    { x: x(132), y: 526, key: 'metro-train-deco', scale: 1.0, flipX: true },
                    { x: x(162), y: 535, key: 'metro-rail-deco', scale: 1.2 },
                    { x: x(198), y: 142, key: 'metro-light-deco', scale: 1.15, depth: -7 },
                    { x: x(230), y: 526, key: 'metro-sign-deco', scale: 1.0 },
                    { x: x(262), y: 526, key: 'metro-train-deco', scale: 1.0 }
                ],
                stalactites: deco([24, 64, 104, 144, 184, 224, 264], 0, 0.9, [0x777777]),
                planks: deco([22, 74, 136, 198, 256], GROUND_Y, 1.0, [0x99aacc]),
                rocks: deco([46, 106, 166, 226, 276], GROUND_Y, 0.9, [0x555555]),
                sparkles: deco([40, 100, 160, 220], 110, 0.7, [0xffffcc])
            }
        });
    };
})();
