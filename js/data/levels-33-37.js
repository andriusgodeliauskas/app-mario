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

    function rowCoins(from, to, row) {
        var list = [];
        for (var c = from; c <= to; c++) list.push({ col: c, row: row || 16, tile: 50 });
        return list;
    }

    function coinCols(cols, row) {
        var list = [];
        for (var i = 0; i < cols.length; i++) list.push({ col: cols[i], row: row || 16, tile: 50 });
        return list;
    }

    function joinCoins(base, arcs) {
        var out = base.slice();
        for (var i = 0; i < arcs.length; i++) out = out.concat(rowCoins(arcs[i][0], arcs[i][1], arcs[i][2]));
        return out;
    }

    function put(map, row, col, tile) {
        if (map[row] && col >= 0 && col < map[row].length) map[row][col] = tile;
    }

    function fill(map, row, from, to, tile) {
        for (var c = from; c <= to; c++) put(map, row, c, tile);
    }

    function addSteps(map, startCol, baseRow, heights, tile) {
        for (var i = 0; i < heights.length; i++) {
            for (var h = 0; h < heights[i]; h++) put(map, baseRow - h, startCol + i, tile || 11);
        }
    }

    function addPillar(map, col, topRow, width, tile) {
        width = width || 2;
        for (var r = topRow; r <= 16; r++) fill(map, r, col, col + width - 1, tile || 11);
    }

    function clearBossArena(map, groundTile, earthTile) {
        var r, c;
        for (r = 9; r <= 16; r++) fill(map, r, 266, 293, 0);
        for (c = 262; c <= 296; c++) {
            put(map, 17, c, groundTile || 1);
            put(map, 18, c, earthTile || 2);
        }
        put(map, 13, 265, 42);
        put(map, 13, 267, 43);
    }

    function makeLevel(opts) {
        if (!window.buildThemedMap) throw new Error('buildThemedMap is required before levels-33-37.js');
        return {
            map: window.buildThemedMap(opts),
            decorations: opts.decorations || {},
            variant: 'a'
        };
    }

    // LEVEL 33 - ZOO / Zoologijos sodas
    window.LEVEL_GENERATORS[33] = function () {
        var map = window.buildThemedMap({
            groundTile: 1,
            earthTile: 2,
            safeStart: 12,
            gaps: [{ from: 64, to: 66 }, { from: 146, to: 148 }, { from: 226, to: 228 }],
            platforms: [
                { col: 18, row: 14, width: 7, tile: 11 }, { col: 28, row: 13, width: 7, tile: 11 },
                { col: 38, row: 12, width: 7, tile: 11 }, { col: 74, row: 13, width: 8, tile: 3 },
                { col: 92, row: 12, width: 6, tile: 11 }, { col: 116, row: 13, width: 8, tile: 3 },
                { col: 158, row: 14, width: 7, tile: 11 }, { col: 168, row: 13, width: 7, tile: 11 },
                { col: 178, row: 12, width: 7, tile: 11 }, { col: 238, row: 13, width: 8, tile: 3 },
                { col: 252, row: 12, width: 6, tile: 11 }
            ],
            pipes: [{ col: 54, row: 15 }, { col: 132, row: 15 }, { col: 212, row: 15 }],
            blocks: [{ col: 30, row: 12, tile: 4 }, { col: 40, row: 11, tile: 42 }, { col: 94, row: 11, tile: 4 },
                { col: 118, row: 12, tile: 40 }, { col: 180, row: 11, tile: 41 }, { col: 254, row: 11, tile: 43 }],
            coins: joinCoins(coinCols([8,9,10,52,53,70,71,88,89,110,111,138,139,152,153,206,207,222,223,234,235,270,271]), [[18, 24, 12], [28, 34, 11], [38, 45, 10], [74, 82, 11], [158, 165, 12], [168, 185, 10], [238, 258, 10]]),
            enemies: [{ col: 48 }, { col: 86, tile: 61 }, { col: 126 }, { col: 192 }, { col: 218, tile: 61 }, { col: 260 }],
            flagCol: 290
        });
        addPillar(map, 72, 12, 1, 11);
        addPillar(map, 86, 11, 1, 11);
        addPillar(map, 104, 12, 1, 11);
        addPillar(map, 150, 11, 1, 11);
        addPillar(map, 198, 12, 1, 11);
        addPillar(map, 232, 11, 1, 11);
        return {
            map: map,
            decorations: {
                custom: customDeco([
                    [14, 'zoo-cage-bars-deco', 520, 0.72],
                    [22, 'zoo-monkey-deco', 522, 0.68],
                    [58, 'zoo-elephant-deco', 520, 0.78, -7, true],
                    [90, 'zoo-trough-deco', 523, 0.72],
                    [124, 'zoo-monkey-deco', 522, 0.68, -7, true],
                    [172, 'zoo-cage-bars-deco', 520, 0.72],
                    [210, 'zoo-elephant-deco', 520, 0.78],
                    [246, 'zoo-trough-deco', 523, 0.72]
                ]),
                fences: deco([16, 46, 76, 106, 136, 166, 196, 236, 258], GROUND_Y, 0.9, [0x6b4a24, 0x888888]),
                bushes: deco([24, 58, 92, 124, 172, 210, 246, 278], GROUND_Y, 0.65),
                rocks: deco([36, 84, 144, 204, 264], GROUND_Y, 0.75),
                clouds: deco([14, 66, 128, 190, 248], 58, 0.85)
            },
            variant: 'a'
        };
    };

    // LEVEL 34 - CIRCUS / Cirkas
    window.LEVEL_GENERATORS[34] = function () {
        var map = window.buildThemedMap({
            groundTile: 3,
            earthTile: 11,
            safeStart: 12,
            gaps: [
                { from: 48, to: 51, bridgeRow: 14, bridgeTile: 12 },
                { from: 102, to: 105, bridgeRow: 13, bridgeTile: 12 },
                { from: 160, to: 163, bridgeRow: 14, bridgeTile: 12 },
                { from: 218, to: 221, bridgeRow: 13, bridgeTile: 12 }
            ],
            platforms: [
                { col: 20, row: 13, width: 4, tile: 3 }, { col: 30, row: 11, width: 3, tile: 11 },
                { col: 58, row: 12, width: 9, tile: 11 }, { col: 78, row: 11, width: 2, tile: 12 },
                { col: 84, row: 11, width: 2, tile: 12 }, { col: 90, row: 11, width: 2, tile: 12 },
                { col: 118, row: 13, width: 4, tile: 3 }, { col: 134, row: 12, width: 9, tile: 11 },
                { col: 174, row: 11, width: 2, tile: 12 }, { col: 180, row: 11, width: 2, tile: 12 },
                { col: 186, row: 11, width: 2, tile: 12 }, { col: 236, row: 13, width: 4, tile: 3 },
                { col: 248, row: 12, width: 7, tile: 11 }
            ],
            pipes: [{ col: 70, row: 15 }, { col: 150, row: 15 }],
            movers: [{ col: 108, row: 13 }, { col: 206, row: 13 }],
            blocks: [{ col: 22, row: 12, tile: 42 }, { col: 32, row: 10, tile: 4 }, { col: 60, row: 11, tile: 40 },
                { col: 120, row: 12, tile: 4 }, { col: 136, row: 11, tile: 41 }, { col: 250, row: 11, tile: 43 }],
            coins: joinCoins(coinCols([8,9,10,26,27,46,47,52,53,74,75,100,101,106,107,116,117,156,157,164,165,214,215,222,223,232,233,270,271]), [[20, 24, 11], [30, 34, 9], [58, 67, 10], [78, 92, 9], [134, 143, 10], [174, 188, 9], [248, 255, 10]]),
            enemies: [{ col: 40 }, { col: 96, tile: 60 }, { col: 126, tile: 61 }, { col: 170 }, { col: 230, tile: 61 }, { col: 260 }],
            flagCol: 290
        });
        addSteps(map, 12, 16, [1, 2, 3, 2, 1], 3);
        addSteps(map, 196, 16, [1, 2, 3, 4, 3, 2, 1], 3);
        return {
            map: map,
            decorations: {
                custom: customDeco([
                    [14, 'circus-tent-deco', 516, 0.78],
                    [28, 'circus-ball-deco', 526, 0.68],
                    [58, 'circus-clown-hat-deco', 524, 0.7],
                    [82, 'circus-trapeze-deco', 120, 0.72],
                    [126, 'circus-tent-deco', 516, 0.78, -7, true],
                    [174, 'circus-ball-deco', 526, 0.68],
                    [236, 'circus-clown-hat-deco', 524, 0.7],
                    [254, 'circus-trapeze-deco', 120, 0.72]
                ]),
                rainbows: deco([32, 136, 250], GROUND_Y, 1.0, [0xff4444, 0xffdd44, 0x44aaff]),
                sparkles: deco([24, 80, 140, 184, 242, 276], 110, 0.85, [0xffffff, 0xffee66]),
                fences: deco([56, 88, 132, 178, 236], GROUND_Y, 0.85, [0xd42828, 0xf6d743]),
                clouds: deco([18, 74, 152, 220, 282], 54, 0.8)
            },
            variant: 'a'
        };
    };

    // LEVEL 35 - FARM / Ukis - BOSS
    window.LEVEL_GENERATORS[35] = function () {
        var map = window.buildThemedMap({
            groundTile: 1,
            earthTile: 2,
            safeStart: 12,
            sections: [
                { from: 36, to: 64, groundTile: 3, earthTile: 2 },
                { from: 118, to: 150, groundTile: 1, earthTile: 2, bridgeRow: 14, bridgeTile: 11 },
                { from: 192, to: 222, groundTile: 3, earthTile: 2 }
            ],
            gaps: [{ from: 82, to: 84 }, { from: 170, to: 172 }],
            platforms: [
                { col: 18, row: 14, width: 5, tile: 11 }, { col: 42, row: 13, width: 7, tile: 3 },
                { col: 54, row: 11, width: 6, tile: 3 }, { col: 96, row: 13, width: 6, tile: 11 },
                { col: 126, row: 12, width: 8, tile: 3 }, { col: 150, row: 13, width: 5, tile: 11 },
                { col: 202, row: 12, width: 8, tile: 3 }, { col: 232, row: 13, width: 6, tile: 11 }
            ],
            pipes: [{ col: 72, row: 15 }, { col: 180, row: 15 }, { col: 244, row: 15 }],
            blocks: [{ col: 20, row: 13, tile: 42 }, { col: 44, row: 12, tile: 4 }, { col: 56, row: 10, tile: 40 },
                { col: 128, row: 11, tile: 4 }, { col: 204, row: 11, tile: 41 }, { col: 234, row: 12, tile: 43 }],
            coins: joinCoins(coinCols([8,9,10,28,29,68,69,78,79,88,89,108,109,158,159,176,177,188,189,226,227,240,241,252,253]), [[18, 23, 12], [42, 60, 9], [96, 102, 11], [126, 134, 10], [202, 210, 10], [232, 238, 11]]),
            enemies: [{ col: 34 }, { col: 66, tile: 61 }, { col: 112 }, { col: 154 }, { col: 212, tile: 61 }, { col: 250 }],
            flagCol: 290
        });
        addSteps(map, 24, 16, [1, 2, 3, 3, 2, 1], 11);
        addSteps(map, 136, 16, [1, 1, 2, 2, 3, 3, 2, 1], 11);
        addSteps(map, 216, 16, [1, 2, 3, 4, 3, 2, 1], 11);
        clearBossArena(map, 1, 2);
        return {
            map: map,
            decorations: {
                custom: customDeco([
                    [14, 'farm-barn-deco', 518, 0.78],
                    [34, 'farm-hay-bale-deco', 524, 0.72],
                    [60, 'farm-chicken-deco', 526, 0.66, -7, true],
                    [96, 'farm-tractor-deco', 522, 0.72],
                    [126, 'farm-scarecrow-deco', 516, 0.72],
                    [158, 'farm-hay-bale-deco', 524, 0.72],
                    [204, 'farm-barn-deco', 518, 0.78],
                    [236, 'farm-chicken-deco', 526, 0.66]
                ]),
                fences: deco([16, 52, 88, 124, 160, 198, 234], GROUND_Y, 0.95, [0x8b5a2b]),
                planks: deco([44, 58, 204, 218], GROUND_Y, 1.05, [0xb6532b]),
                grass: deco([24, 76, 114, 152, 190, 230, 260], GROUND_Y, 0.9),
                hills: deco([48, 142, 216], GROUND_Y, 0.85, [0xd14a2f, 0xf1c04d, 0xb9412e]),
                clouds: deco([20, 94, 170, 252], 60, 0.8)
            },
            variant: 'a'
        };
    };

    // LEVEL 36 - DINO LAND / Dinozaurai
    window.LEVEL_GENERATORS[36] = function () {
        var map = window.buildThemedMap({
            groundTile: 11,
            earthTile: 2,
            safeStart: 12,
            gaps: [
                { from: 44, to: 47, bridgeRow: 15, bridgeTile: 11 },
                { from: 110, to: 113 },
                { from: 176, to: 179, bridgeRow: 15, bridgeTile: 11 },
                { from: 236, to: 239 }
            ],
            platforms: [
                { col: 18, row: 13, width: 5, tile: 11 }, { col: 58, row: 12, width: 6, tile: 11 },
                { col: 82, row: 13, width: 5, tile: 3 }, { col: 124, row: 12, width: 7, tile: 11 },
                { col: 146, row: 10, width: 5, tile: 3 }, { col: 190, row: 13, width: 6, tile: 11 },
                { col: 212, row: 11, width: 6, tile: 3 }, { col: 250, row: 12, width: 6, tile: 11 }
            ],
            pipes: [{ col: 70, row: 15 }, { col: 160, row: 15 }, { col: 224, row: 15 }],
            movers: [{ col: 100, row: 13 }, { col: 166, row: 13 }],
            blocks: [{ col: 20, row: 12, tile: 42 }, { col: 60, row: 11, tile: 4 }, { col: 84, row: 12, tile: 40 },
                { col: 126, row: 11, tile: 4 }, { col: 148, row: 9, tile: 41 }, { col: 252, row: 11, tile: 43 }],
            coins: joinCoins(coinCols([8,9,10,42,43,48,49,76,77,106,107,114,115,154,155,172,173,180,181,232,233,240,241,270,271]), [[18, 23, 11], [58, 64, 10], [82, 88, 11], [124, 131, 10], [146, 151, 8], [190, 196, 11], [212, 218, 9], [250, 256, 10]]),
            enemies: [{ col: 34 }, { col: 78, tile: 61 }, { col: 118 }, { col: 138 }, { col: 204, tile: 61 }, { col: 244 }],
            flagCol: 290
        });
        addSteps(map, 30, 16, [1, 2, 3, 4, 5, 4, 3, 2], 11);
        addSteps(map, 134, 16, [1, 2, 2, 3, 4, 5, 4, 3, 2], 11);
        addSteps(map, 260, 16, [1, 2, 3, 4, 3, 2, 1], 11);
        return {
            map: map,
            decorations: {
                custom: customDeco([
                    [14, 'dino-egg-deco', 522, 0.7],
                    [30, 'dino-fern-deco', 516, 0.72],
                    [58, 'dino-silhouette-deco', 523, 0.78],
                    [96, 'dino-bone-deco', 526, 0.7],
                    [124, 'dino-volcano-deco', 516, 0.78],
                    [166, 'dino-fern-deco', 516, 0.72, -7, true],
                    [212, 'dino-silhouette-deco', 523, 0.78, -7, true],
                    [250, 'dino-egg-deco', 522, 0.7]
                ]),
                hills: deco([36, 140, 262], GROUND_Y, 1.2, [0x6b4a3a, 0x854b34, 0x5c5c42]),
                leaves: deco([26, 72, 118, 166, 220, 258], GROUND_Y, 0.95, [0x2f8f4e, 0x68b957]),
                rocks: deco([42, 96, 150, 204, 246], GROUND_Y, 0.9, [0x6b6b5a, 0x8a7658]),
                sparkles: deco([62, 128, 214], 122, 0.7, [0xffe69b]),
                clouds: deco([18, 94, 182, 268], 58, 0.8)
            },
            variant: 'a'
        };
    };

    // LEVEL 37 - PIRATE ISLAND / Piratu sala
    window.LEVEL_GENERATORS[37] = function () {
        var map = window.buildThemedMap({
            groundTile: 1,
            earthTile: 2,
            safeStart: 12,
            gaps: [
                { from: 36, to: 40, bridgeRow: 15, bridgeTile: 11 },
                { from: 78, to: 82, bridgeRow: 14, bridgeTile: 11 },
                { from: 126, to: 130, bridgeRow: 15, bridgeTile: 11 },
                { from: 184, to: 188, bridgeRow: 14, bridgeTile: 11 },
                { from: 236, to: 240, bridgeRow: 15, bridgeTile: 11 }
            ],
            platforms: [
                { col: 18, row: 13, width: 5, tile: 11 }, { col: 52, row: 12, width: 6, tile: 3 },
                { col: 92, row: 13, width: 5, tile: 11 }, { col: 110, row: 11, width: 4, tile: 3 },
                { col: 144, row: 13, width: 6, tile: 11 }, { col: 164, row: 12, width: 4, tile: 3 },
                { col: 204, row: 13, width: 6, tile: 11 }, { col: 252, row: 12, width: 6, tile: 3 }
            ],
            pipes: [{ col: 66, row: 15 }, { col: 154, row: 15 }, { col: 222, row: 15 }],
            movers: [{ col: 86, row: 13 }, { col: 194, row: 13 }],
            blocks: [{ col: 20, row: 12, tile: 42 }, { col: 54, row: 11, tile: 4 }, { col: 112, row: 10, tile: 40 },
                { col: 146, row: 12, tile: 4 }, { col: 206, row: 12, tile: 41 }, { col: 254, row: 11, tile: 43 }],
            coins: joinCoins(coinCols([8,9,10,34,35,41,42,74,75,83,84,122,123,131,132,180,181,189,190,232,233,241,242,270,271]), [[18, 23, 11], [52, 58, 10], [92, 96, 11], [110, 114, 9], [144, 150, 11], [164, 168, 10], [204, 210, 11], [252, 258, 10]]),
            enemies: [{ col: 30 }, { col: 62, tile: 61 }, { col: 104 }, { col: 138 }, { col: 176, tile: 61 }, { col: 216 }, { col: 262 }],
            flagCol: 290
        });
        addPillar(map, 26, 13, 2, 11);
        addPillar(map, 100, 12, 2, 11);
        addPillar(map, 174, 13, 2, 11);
        addPillar(map, 246, 12, 2, 11);
        return {
            map: map,
            decorations: {
                custom: customDeco([
                    [14, 'pirate-palm-deco', 506, 0.78],
                    [28, 'pirate-chest-deco', 524, 0.72],
                    [56, 'pirate-cannon-deco', 524, 0.72],
                    [96, 'pirate-flag-deco', 518, 0.72],
                    [128, 'pirate-anchor-deco', 522, 0.72],
                    [166, 'pirate-palm-deco', 506, 0.78, -7, true],
                    [214, 'pirate-chest-deco', 524, 0.72],
                    [246, 'pirate-cannon-deco', 524, 0.72, -7, true]
                ]),
                waves: deco([38, 80, 128, 186, 238], GROUND_Y, 1.1, [0x66ddee]),
                palms: deco([26, 100, 174, 246], GROUND_Y, 0.9),
                planks: deco([38, 80, 128, 186, 238], GROUND_Y, 0.9, [0x8b5a2b]),
                rocks: deco([56, 116, 166, 214, 262], GROUND_Y, 0.75),
                clouds: deco([22, 86, 154, 226, 282], 56, 0.85)
            },
            variant: 'a'
        };
    };
})();
