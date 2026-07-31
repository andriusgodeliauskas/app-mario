(function () {
    'use strict';

    window.LEVEL_GENERATORS = window.LEVEL_GENERATORS || {};

    var TILE = 32;
    var GROUND_Y = 544;

    function build(opts) {
        if (!window.buildThemedMap) {
            throw new Error('buildThemedMap is required before levels-38-42.js');
        }
        return window.buildThemedMap(opts);
    }

    function x(col) {
        return col * TILE + 16;
    }

    function deco(cols, y, baseScale, tints) {
        var list = [];
        for (var i = 0; i < cols.length; i++) {
            var item = { x: x(cols[i]), y: y, scale: baseScale + ((i % 3) * 0.08) };
            if (tints && tints[i % tints.length]) item.tint = tints[i % tints.length];
            list.push(item);
        }
        return list;
    }

    function customDeco(items, y) {
        var list = [];
        for (var i = 0; i < items.length; i++) {
            list.push({
                x: x(items[i][0]),
                y: items[i][2] || y || 520,
                key: items[i][1],
                scale: items[i][3] || 0.72,
                depth: items[i][4] !== undefined ? items[i][4] : -7,
                flipX: !!items[i][5]
            });
        }
        return list;
    }

    function coinList(cols, row) {
        var list = [];
        for (var i = 0; i < cols.length; i++) list.push({ col: cols[i], row: row || 16, tile: 50 });
        return list;
    }

    function coinArc(from, to, row) {
        var list = [];
        for (var c = from; c <= to; c++) list.push({ col: c, row: row, tile: 50 });
        return list;
    }

    function withArcs(base, arcs) {
        var out = base.slice();
        for (var i = 0; i < arcs.length; i++) out = out.concat(coinArc(arcs[i][0], arcs[i][1], arcs[i][2]));
        return out;
    }

    function fill(map, row, from, to, tile) {
        for (var c = from; c <= to; c++) {
            if (map[row] && c >= 0 && c < map[row].length) map[row][c] = tile;
        }
    }

    function put(map, row, col, tile) {
        if (map[row] && col >= 0 && col < map[row].length) map[row][col] = tile;
    }

    function addSteps(map, startCol, baseRow, heights, tile) {
        for (var i = 0; i < heights.length; i++) {
            for (var h = 0; h < heights[i]; h++) put(map, baseRow - h, startCol + i, tile);
        }
    }

    function addPillars(map, cols, topRow, tile) {
        for (var i = 0; i < cols.length; i++) {
            for (var r = topRow + (i % 2); r <= 16; r++) put(map, r, cols[i], tile);
        }
    }

    function clearBossArena(map, groundTile, earthTile) {
        for (var r = 10; r <= 16; r++) fill(map, r, 268, 292, 0);
        for (var c = 262; c <= 296; c++) {
            map[17][c] = groundTile || 1;
            map[18][c] = earthTile || 2;
        }
        put(map, 14, 266, 42);
        put(map, 12, 260, 11);
        put(map, 12, 261, 11);
        put(map, 12, 262, 11);
    }

    function makeLevel(opts) {
        return {
            map: build(opts),
            decorations: opts.decorations || {},
            variant: 'a'
        };
    }

    // LEVEL 38 - ROBOT FACTORY / Robotu fabrikas
    window.LEVEL_GENERATORS[38] = function () {
        var map = build({
            groundTile: 11,
            earthTile: 3,
            safeStart: 12,
            sections: [
                { from: 16, to: 48, groundTile: 12, earthTile: 3 },
                { from: 66, to: 102, groundTile: 12, earthTile: 3 },
                { from: 126, to: 166, groundTile: 12, earthTile: 3 },
                { from: 190, to: 238, groundTile: 12, earthTile: 3 }
            ],
            gaps: [
                { from: 52, to: 54, bridgeRow: 15, bridgeTile: 11 },
                { from: 112, to: 115, bridgeRow: 14, bridgeTile: 12 },
                { from: 176, to: 178, bridgeRow: 15, bridgeTile: 11 },
                { from: 246, to: 248, bridgeRow: 15, bridgeTile: 12 }
            ],
            platforms: [
                { col: 20, row: 13, width: 8, tile: 11 }, { col: 36, row: 12, width: 6, tile: 3 },
                { col: 74, row: 13, width: 10, tile: 11 }, { col: 96, row: 11, width: 5, tile: 3 },
                { col: 132, row: 13, width: 9, tile: 11 }, { col: 152, row: 12, width: 7, tile: 3 },
                { col: 202, row: 13, width: 10, tile: 11 }, { col: 226, row: 11, width: 6, tile: 3 },
                { col: 256, row: 13, width: 7, tile: 11 }
            ],
            pipes: [{ col: 58, row: 15 }, { col: 118, row: 15 }, { col: 182, row: 15 }, { col: 242, row: 15 }],
            movers: [{ col: 48, row: 13 }, { col: 108, row: 12 }, { col: 170, row: 13 }, { col: 252, row: 13 }],
            blocks: [{ col: 22, row: 12, tile: 42 }, { col: 38, row: 11, tile: 4 }, { col: 78, row: 12, tile: 40 },
                { col: 98, row: 10, tile: 4 }, { col: 136, row: 12, tile: 41 }, { col: 206, row: 12, tile: 4 }, { col: 228, row: 10, tile: 43 }],
            coins: withArcs(coinList([8,9,10,30,31,56,57,68,69,88,89,120,121,144,145,168,169,184,185,216,217,240,241,266,267]), [[20,28,11], [74,84,11], [132,141,11], [202,212,11], [256,263,11]]),
            enemies: [{ col: 34 }, { col: 70, tile: 61 }, { col: 104 }, { col: 146 }, { col: 188, tile: 61 }, { col: 220 }, { col: 260 }],
            flagCol: 290,
            decorations: {
                rocks: deco([24, 82, 138, 204, 260], GROUND_Y, 0.9, [0x777777, 0xb0b0b0]),
                fences: deco([18, 42, 76, 100, 134, 158, 202, 230], GROUND_Y, 0.85, [0x555555]),
                sparkles: deco([30, 92, 154, 214, 274], 116, 0.85, [0x77ddff, 0xffee77]),
                clouds: deco([46, 128, 210, 282], 58, 0.7, [0xdde8ef])
            }
        });
        addPillars(map, [46, 92, 160, 236], 13, 11);
        return { map: map, decorations: {
            custom: customDeco([
                [14, 'robot-panel-deco', 522, 0.72],
                [28, 'robot-gear-deco', 522, 0.7],
                [46, 'robot-arm-deco', 516, 0.72],
                [82, 'robot-conveyor-deco', 526, 0.74],
                [138, 'robot-spark-deco', 116, 0.7],
                [158, 'robot-panel-deco', 522, 0.72],
                [204, 'robot-gear-deco', 522, 0.7],
                [236, 'robot-arm-deco', 516, 0.72, -7, true]
            ]),
            rocks: deco([24, 82, 138, 204, 260], GROUND_Y, 0.9, [0x777777, 0xb0b0b0]),
            fences: deco([18, 42, 76, 100, 134, 158, 202, 230], GROUND_Y, 0.85, [0x555555]),
            sparkles: deco([30, 92, 154, 214, 274], 116, 0.85, [0x77ddff, 0xffee77]),
            clouds: deco([46, 128, 210, 282], 58, 0.7, [0xdde8ef])
        }, variant: 'a' };
    };

    // LEVEL 39 - HOSPITAL / Ligonine
    window.LEVEL_GENERATORS[39] = function () {
        var map = build({
            groundTile: 11,
            earthTile: 11,
            safeStart: 14,
            gaps: [{ from: 82, to: 83, bridgeRow: 16, bridgeTile: 11 }, { from: 180, to: 181, bridgeRow: 16, bridgeTile: 11 }],
            platforms: [
                { col: 18, row: 14, width: 9, tile: 11 }, { col: 40, row: 13, width: 8, tile: 3 },
                { col: 66, row: 14, width: 10, tile: 11 }, { col: 100, row: 13, width: 8, tile: 3 },
                { col: 128, row: 14, width: 10, tile: 11 }, { col: 158, row: 13, width: 8, tile: 3 },
                { col: 198, row: 14, width: 10, tile: 11 }, { col: 232, row: 13, width: 8, tile: 3 }
            ],
            pipes: [{ col: 88, row: 15 }, { col: 214, row: 15 }],
            blocks: [{ col: 22, row: 13, tile: 42 }, { col: 44, row: 12, tile: 4 }, { col: 70, row: 13, tile: 40 },
                { col: 104, row: 12, tile: 4 }, { col: 132, row: 13, tile: 41 }, { col: 202, row: 13, tile: 43 }, { col: 236, row: 12, tile: 4 }],
            coins: withArcs(coinList([7,8,9,10,30,31,56,57,86,87,116,117,146,147,176,177,190,191,220,221,252,253,274,275]), [[18,27,12], [40,48,11], [66,76,12], [100,108,11], [128,138,12], [198,208,12], [232,240,11]]),
            enemies: [{ col: 54 }, { col: 122 }, { col: 186 }, { col: 246, tile: 61 }],
            flagCol: 290,
            decorations: {
                clouds: deco([28, 90, 152, 214, 276], 62, 0.75, [0xffffff]),
                fences: deco([20, 44, 70, 104, 132, 164, 202, 236], GROUND_Y, 0.75, [0xe8f4f8]),
                flowers: deco([34, 96, 154, 224, 268], GROUND_Y, 0.75, [0x66ccee, 0xff8899]),
                sparkles: deco([50, 140, 230], 118, 0.75, [0xffffff, 0x99eeff])
            }
        });
        fill(map, 16, 30, 36, 11);
        fill(map, 16, 112, 118, 11);
        fill(map, 16, 188, 194, 11);
        return { map: map, decorations: {
            custom: customDeco([
                [16, 'hospital-cross-sign-deco', 518, 0.72],
                [34, 'hospital-medicine-deco', 522, 0.68],
                [66, 'hospital-bed-deco', 523, 0.72],
                [104, 'hospital-iv-stand-deco', 516, 0.72],
                [132, 'hospital-cross-sign-deco', 518, 0.72],
                [164, 'hospital-medicine-deco', 522, 0.68],
                [202, 'hospital-bed-deco', 523, 0.72, -7, true],
                [236, 'hospital-iv-stand-deco', 516, 0.72]
            ]),
            clouds: deco([28, 90, 152, 214, 276], 62, 0.75, [0xffffff]),
            fences: deco([20, 44, 70, 104, 132, 164, 202, 236], GROUND_Y, 0.75, [0xe8f4f8]),
            flowers: deco([34, 96, 154, 224, 268], GROUND_Y, 0.75, [0x66ccee, 0xff8899]),
            sparkles: deco([50, 140, 230], 118, 0.75, [0xffffff, 0x99eeff])
        }, variant: 'a' };
    };

    // LEVEL 40 - STADIUM / Stadionas
    window.LEVEL_GENERATORS[40] = function () {
        var map = build({
            groundTile: 1,
            earthTile: 3,
            safeStart: 12,
            sections: [
                { from: 20, to: 72, groundTile: 12, earthTile: 3 },
                { from: 112, to: 168, groundTile: 12, earthTile: 3 },
                { from: 206, to: 262, groundTile: 12, earthTile: 3 }
            ],
            gaps: [{ from: 88, to: 91, bridgeRow: 15, bridgeTile: 11 }, { from: 184, to: 187, bridgeRow: 15, bridgeTile: 11 }],
            platforms: [
                { col: 22, row: 13, width: 8, tile: 11 }, { col: 48, row: 12, width: 6, tile: 11 },
                { col: 76, row: 13, width: 5, tile: 3 }, { col: 116, row: 13, width: 9, tile: 11 },
                { col: 140, row: 12, width: 7, tile: 11 }, { col: 170, row: 13, width: 5, tile: 3 },
                { col: 210, row: 13, width: 10, tile: 11 }, { col: 238, row: 12, width: 7, tile: 11 }
            ],
            pipes: [{ col: 94, row: 15 }, { col: 190, row: 15 }],
            movers: [{ col: 62, row: 13 }, { col: 156, row: 13 }, { col: 252, row: 13 }],
            blocks: [{ col: 24, row: 12, tile: 42 }, { col: 50, row: 11, tile: 4 }, { col: 118, row: 12, tile: 40 },
                { col: 142, row: 11, tile: 4 }, { col: 212, row: 12, tile: 41 }, { col: 240, row: 11, tile: 43 }],
            coins: withArcs(coinList([8,9,10,34,35,58,59,84,85,98,99,130,131,162,163,178,179,194,195,224,225,252,253,274,275]), [[22,30,11], [48,54,10], [116,125,11], [140,147,10], [210,220,11], [238,245,10]]),
            enemies: [{ col: 40 }, { col: 82, tile: 61 }, { col: 134 }, { col: 174 }, { col: 226, tile: 61 }, { col: 258 }],
            flagCol: 290,
            decorations: {
                fences: deco([18, 24, 30, 116, 122, 128, 210, 216, 222], GROUND_Y, 0.75, [0xffffff]),
                hills: deco([54, 146, 242], GROUND_Y, 0.7, [0xff5555, 0xffdd55, 0x55aaff]),
                rainbows: deco([88, 184, 278], GROUND_Y, 0.7),
                clouds: deco([70, 160, 250], 58, 0.7)
            }
        });
        addSteps(map, 32, 16, [1, 2, 3, 4, 3, 2, 1], 11);
        addSteps(map, 128, 16, [1, 2, 3, 4, 5, 4, 3, 2, 1], 11);
        addSteps(map, 224, 16, [1, 2, 3, 4, 3, 2, 1], 11);
        return { map: map, decorations: {
            custom: customDeco([
                [16, 'stadium-scoreboard-deco', 516, 0.72],
                [30, 'stadium-ball-deco', 526, 0.66],
                [54, 'stadium-goal-deco', 517, 0.72],
                [88, 'stadium-banner-deco', 130, 0.76],
                [116, 'stadium-bleachers-deco', 520, 0.72],
                [146, 'stadium-ball-deco', 526, 0.66],
                [210, 'stadium-goal-deco', 517, 0.72, -7, true],
                [242, 'stadium-scoreboard-deco', 516, 0.72]
            ]),
            fences: deco([18, 24, 30, 116, 122, 128, 210, 216, 222], GROUND_Y, 0.75, [0xffffff]),
            hills: deco([54, 146, 242], GROUND_Y, 0.7, [0xff5555, 0xffdd55, 0x55aaff]),
            rainbows: deco([88, 184, 278], GROUND_Y, 0.7),
            clouds: deco([70, 160, 250], 58, 0.7)
        }, variant: 'a' };
    };

    // LEVEL 41 - AIRPORT / Oro uostas
    window.LEVEL_GENERATORS[41] = function () {
        var map = build({
            groundTile: 11,
            earthTile: 12,
            safeStart: 12,
            sections: [
                { from: 14, to: 86, groundTile: 12, earthTile: 11 },
                { from: 112, to: 178, groundTile: 12, earthTile: 11 },
                { from: 210, to: 270, groundTile: 12, earthTile: 11 }
            ],
            gaps: [{ from: 96, to: 99, bridgeRow: 15, bridgeTile: 11 }, { from: 190, to: 193, bridgeRow: 15, bridgeTile: 11 }],
            platforms: [
                { col: 24, row: 13, width: 10, tile: 11 }, { col: 48, row: 12, width: 8, tile: 11 },
                { col: 78, row: 13, width: 8, tile: 3 }, { col: 118, row: 13, width: 12, tile: 11 },
                { col: 148, row: 12, width: 9, tile: 11 }, { col: 172, row: 13, width: 6, tile: 3 },
                { col: 218, row: 13, width: 12, tile: 11 }, { col: 248, row: 12, width: 9, tile: 11 }
            ],
            pipes: [{ col: 102, row: 15 }, { col: 198, row: 15 }],
            movers: [{ col: 66, row: 13 }, { col: 136, row: 13 }, { col: 236, row: 13 }],
            blocks: [{ col: 26, row: 12, tile: 42 }, { col: 50, row: 11, tile: 4 }, { col: 120, row: 12, tile: 40 },
                { col: 150, row: 11, tile: 4 }, { col: 220, row: 12, tile: 41 }, { col: 250, row: 11, tile: 43 }],
            coins: withArcs(coinList([8,9,10,36,37,60,61,88,89,108,109,132,133,162,163,184,185,202,203,232,233,262,263,276,277]), [[24,34,11], [48,56,10], [118,130,11], [148,157,10], [218,230,11], [248,257,10]]),
            enemies: [{ col: 42 }, { col: 92, tile: 61 }, { col: 142 }, { col: 182 }, { col: 242, tile: 61 }, { col: 266 }],
            flagCol: 290,
            decorations: {
                clouds: deco([20, 66, 112, 158, 204, 250, 286], 54, 0.85),
                rockets: deco([58, 138, 238], 132, 0.75, [0xddeeff]),
                fences: deco([18, 38, 76, 118, 156, 218, 256], GROUND_Y, 0.8, [0xdddddd]),
                planks: deco([66, 136, 236], GROUND_Y, 0.8, [0x444444])
            }
        });
        fill(map, 16, 160, 163, 11);
        fill(map, 15, 161, 162, 11);
        fill(map, 14, 162, 162, 11);
        return { map: map, decorations: {
            custom: customDeco([
                [14, 'airport-runway-light-deco', 516, 0.68],
                [28, 'airport-airplane-deco', 122, 0.74],
                [58, 'airport-tower-deco', 514, 0.76],
                [88, 'airport-luggage-cart-deco', 524, 0.72],
                [136, 'airport-windsock-deco', 514, 0.72],
                [172, 'airport-airplane-deco', 112, 0.74, -7, true],
                [218, 'airport-runway-light-deco', 516, 0.68],
                [250, 'airport-tower-deco', 514, 0.76]
            ]),
            clouds: deco([20, 66, 112, 158, 204, 250, 286], 54, 0.85),
            rockets: deco([58, 138, 238], 132, 0.75, [0xddeeff]),
            fences: deco([18, 38, 76, 118, 156, 218, 256], GROUND_Y, 0.8, [0xdddddd]),
            planks: deco([66, 136, 236], GROUND_Y, 0.8, [0x444444])
        }, variant: 'a' };
    };

    // LEVEL 42 - HAUNTED HOUSE / Vaiduokliu namas - final boss
    window.LEVEL_GENERATORS[42] = function () {
        var map = build({
            groundTile: 3,
            earthTile: 11,
            safeStart: 14,
            sections: [
                { from: 26, to: 62, groundTile: 11, earthTile: 3 },
                { from: 86, to: 128, groundTile: 3, earthTile: 11 },
                { from: 150, to: 202, groundTile: 11, earthTile: 3 },
                { from: 224, to: 260, groundTile: 3, earthTile: 11 }
            ],
            gaps: [
                { from: 68, to: 71, bridgeRow: 15, bridgeTile: 11 },
                { from: 136, to: 139, bridgeRow: 14, bridgeTile: 12 },
                { from: 210, to: 213, bridgeRow: 15, bridgeTile: 11 }
            ],
            platforms: [
                { col: 18, row: 13, width: 6, tile: 11 }, { col: 34, row: 12, width: 7, tile: 3 },
                { col: 52, row: 11, width: 5, tile: 11 }, { col: 78, row: 13, width: 6, tile: 3 },
                { col: 96, row: 12, width: 7, tile: 11 }, { col: 116, row: 10, width: 5, tile: 3 },
                { col: 146, row: 13, width: 6, tile: 11 }, { col: 166, row: 12, width: 7, tile: 3 },
                { col: 188, row: 10, width: 5, tile: 11 }, { col: 220, row: 13, width: 6, tile: 3 },
                { col: 238, row: 12, width: 7, tile: 11 }, { col: 252, row: 11, width: 5, tile: 3 }
            ],
            pipes: [{ col: 74, row: 15 }, { col: 142, row: 15 }, { col: 216, row: 15 }],
            movers: [{ col: 64, row: 13 }, { col: 132, row: 12 }, { col: 206, row: 13 }],
            blocks: [{ col: 20, row: 12, tile: 42 }, { col: 36, row: 11, tile: 4 }, { col: 54, row: 10, tile: 40 },
                { col: 98, row: 11, tile: 4 }, { col: 118, row: 9, tile: 41 }, { col: 168, row: 11, tile: 4 },
                { col: 190, row: 9, tile: 43 }, { col: 240, row: 11, tile: 4 }],
            coins: withArcs(coinList([8,9,10,28,29,46,47,64,65,76,77,88,89,108,109,130,131,144,145,160,161,180,181,204,205,218,219,232,233,260,261]), [[18,24,11], [34,41,10], [52,57,9], [96,103,10], [116,121,8], [166,173,10], [188,193,8], [238,245,10], [252,257,9]]),
            enemies: [{ col: 44 }, { col: 84, tile: 61 }, { col: 112 }, { col: 154 }, { col: 184, tile: 61 }, { col: 226 }, { col: 252, tile: 61 }],
            flagCol: 290,
            decorations: {
                stalactites: deco([24, 58, 94, 128, 164, 198, 232, 266], 0, 0.9, [0x5f557a]),
                sparkles: deco([38, 82, 126, 170, 214, 258], 104, 0.8, [0xffffaa, 0xd8ccff]),
                rocks: deco([44, 118, 188, 246], GROUND_Y, 0.85, [0x4c4263]),
                mushrooms: deco([30, 100, 176, 236], GROUND_Y, 0.75, [0xbb99ff]),
                clouds: deco([46, 136, 226, 286], 56, 0.7, [0xd6ccff])
            }
        });
        addSteps(map, 10, 16, [1, 2, 3, 2, 1], 11);
        addSteps(map, 106, 16, [1, 2, 3, 4, 3, 2, 1], 11);
        addSteps(map, 176, 16, [1, 2, 3, 4, 5, 4, 3, 2, 1], 11);
        fill(map, 16, 228, 235, 11);
        clearBossArena(map, 3, 11);
        return { map: map, decorations: {
            custom: customDeco([
                [16, 'haunted-ghost-deco', 512, 0.74],
                [32, 'haunted-candle-deco', 522, 0.68],
                [54, 'haunted-cobweb-deco', 130, 0.72],
                [96, 'haunted-tombstone-deco', 522, 0.72],
                [126, 'haunted-pumpkin-deco', 524, 0.72],
                [166, 'haunted-ghost-deco', 512, 0.74, -7, true],
                [220, 'haunted-candle-deco', 522, 0.68],
                [252, 'haunted-pumpkin-deco', 524, 0.72]
            ]),
            stalactites: deco([24, 58, 94, 128, 164, 198, 232, 266], 0, 0.9, [0x5f557a]),
            sparkles: deco([38, 82, 126, 170, 214, 258], 104, 0.8, [0xffffaa, 0xd8ccff]),
            rocks: deco([44, 118, 188, 246], GROUND_Y, 0.85, [0x4c4263]),
            mushrooms: deco([30, 100, 176, 236], GROUND_Y, 0.75, [0xbb99ff]),
            clouds: deco([46, 136, 226, 286], 56, 0.7, [0xd6ccff])
        }, variant: 'a' };
    };
})();
