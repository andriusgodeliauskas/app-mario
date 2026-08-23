(function () {
    'use strict';

    window.LEVEL_GENERATORS = window.LEVEL_GENERATORS || {};

    function build(opts) {
        if (!window.buildThemedMap) {
            throw new Error('buildThemedMap is required before levels-27-32.js');
        }
        return window.buildThemedMap(opts);
    }

    function fill(map, row, from, to, tile) {
        for (var c = from; c <= to; c++) {
            if (map[row] && c >= 0 && c < map[row].length) map[row][c] = tile;
        }
    }

    function put(map, row, col, tile) {
        if (map[row] && col >= 0 && col < map[row].length) map[row][col] = tile;
    }

    function addCoinTrail(map, cols, row) {
        row = row || 16;
        for (var i = 0; i < cols.length; i++) {
            if (map[row] && map[row][cols[i]] === 0) map[row][cols[i]] = 50;
        }
    }

    function addSteps(map, startCol, baseRow, heights, tile) {
        tile = tile || 11;
        for (var i = 0; i < heights.length; i++) {
            for (var h = 0; h < heights[i]; h++) put(map, baseRow - h, startCol + i, tile);
        }
    }

    function clearBossArena(map, groundTile, earthTile) {
        var r, c;
        for (r = 10; r <= 16; r++) fill(map, r, 268, 292, 0);
        for (c = 264; c <= 295; c++) {
            map[17][c] = groundTile || 1;
            map[18][c] = earthTile || 2;
        }
        put(map, 14, 266, 42);
    }

    function classicSkyDecor(tints) {
        return {
            clouds: [
                { x: 260, y: 58, scale: 0.9 },
                { x: 940, y: 42, scale: 0.7 },
                { x: 1620, y: 70, scale: 1.0 },
                { x: 2460, y: 48, scale: 0.8 },
                { x: 3280, y: 62, scale: 1.1 },
                { x: 4140, y: 38, scale: 0.75 },
                { x: 5050, y: 68, scale: 0.95 },
                { x: 5960, y: 46, scale: 0.8 },
                { x: 7060, y: 58, scale: 1.0 },
                { x: 8260, y: 44, scale: 0.85 }
            ],
            hills: [
                { x: 520, y: 544, scale: 0.9, tint: tints && tints.hill },
                { x: 1840, y: 544, scale: 1.15, tint: tints && tints.hill2 },
                { x: 3360, y: 544, scale: 0.75, tint: tints && tints.hill },
                { x: 5200, y: 544, scale: 1.0, tint: tints && tints.hill2 },
                { x: 7100, y: 544, scale: 0.9, tint: tints && tints.hill }
            ],
            bushes: [
                { x: 360, y: 544, scale: 0.65 },
                { x: 1320, y: 544, scale: 0.55 },
                { x: 2760, y: 544, scale: 0.7 },
                { x: 4520, y: 544, scale: 0.6 },
                { x: 6260, y: 544, scale: 0.7 },
                { x: 8020, y: 544, scale: 0.55 }
            ]
        };
    }

    window.LEVEL_GENERATORS[27] = function () {
        var map = build({
            cols: 300,
            groundTile: 1,
            earthTile: 2,
            gaps: [
                { from: 38, to: 41, bridgeRow: 15, bridgeTile: 11 },
                { from: 82, to: 86, bridgeRow: 14, bridgeTile: 12 },
                { from: 128, to: 132, bridgeRow: 15, bridgeTile: 11 },
                { from: 184, to: 188, bridgeRow: 14, bridgeTile: 12 },
                { from: 232, to: 236, bridgeRow: 15, bridgeTile: 11 }
            ],
            platforms: [
                { col: 24, row: 13, width: 4, tile: 11 },
                { col: 56, row: 12, width: 5, tile: 11 },
                { col: 96, row: 13, width: 4, tile: 12 },
                { col: 146, row: 12, width: 5, tile: 11 },
                { col: 204, row: 13, width: 4, tile: 12 },
                { col: 250, row: 12, width: 5, tile: 11 }
            ],
            pipes: [{ col: 68, row: 15 }, { col: 158, row: 15 }, { col: 220, row: 15 }],
            blocks: [{ col: 25, row: 12, tile: 4 }, { col: 58, row: 11, tile: 42 }, { col: 147, row: 11, tile: 4 }, { col: 252, row: 11, tile: 43 }],
            coins: [8,9,10,26,27,36,37,42,43,57,58,59,76,77,96,97,98,112,113,130,131,146,147,148,166,167,185,186,204,205,206,234,235,250,251,252,274,275,276],
            enemies: [{ col: 52 }, { col: 105 }, { col: 170, tile: 61 }, { col: 214 }, { col: 244, tile: 61 }],
            flagCol: 290,
            variant: 'a'
        });
        addSteps(map, 14, 16, [1, 2, 3, 4, 5, 4, 3, 2], 11);
        addSteps(map, 116, 16, [1, 2, 3, 4, 5, 4, 3], 11);
        addSteps(map, 194, 16, [1, 2, 3, 4, 5, 4, 3, 2], 11);
        addCoinTrail(map, [15,16,17,18,116,117,118,119,196,197,198,199], 10);
        return {
            map: map,
            decorations: {
                custom: [
                    { x: 360, y: 517, key: 'waterpark-slide-deco', scale: 1.05 },
                    { x: 820, y: 527, key: 'waterpark-ring-deco', scale: 1.15 },
                    { x: 1260, y: 522, key: 'waterpark-ladder-deco', scale: 1.0 },
                    { x: 1740, y: 535, key: 'waterpark-splash-deco', scale: 1.2 },
                    { x: 2640, y: 517, key: 'waterpark-slide-deco', scale: 1.0, flipX: true },
                    { x: 3760, y: 527, key: 'waterpark-ring-deco', scale: 1.1 },
                    { x: 4980, y: 522, key: 'waterpark-ladder-deco', scale: 1.05 },
                    { x: 6440, y: 535, key: 'waterpark-splash-deco', scale: 1.25 },
                    { x: 8120, y: 517, key: 'waterpark-slide-deco', scale: 1.05 }
                ],
                waves: [
                    { x: 760, y: 544, scale: 1.2 }, { x: 1320, y: 544, scale: 1.0 }, { x: 2380, y: 544, scale: 1.15 },
                    { x: 3440, y: 544, scale: 1.0 }, { x: 4840, y: 544, scale: 1.2 }, { x: 6460, y: 544, scale: 1.0 }
                ],
                corals: [
                    { x: 420, y: 544, scale: 0.8, tint: 0x66ddff }, { x: 1700, y: 544, scale: 0.9, tint: 0xff88dd },
                    { x: 3060, y: 544, scale: 0.75, tint: 0xffff66 }, { x: 5620, y: 544, scale: 0.9, tint: 0x66ffbb }
                ],
                planks: [{ x: 1220, y: 544, scale: 0.9 }, { x: 4200, y: 544, scale: 1.0 }, { x: 7600, y: 544, scale: 0.9 }],
                clouds: classicSkyDecor({}).clouds
            },
            variant: 'a'
        };
    };

    window.LEVEL_GENERATORS[28] = function () {
        var map = build({
            cols: 300,
            groundTile: 1,
            earthTile: 2,
            platforms: [
                { col: 20, row: 13, width: 4, tile: 3 }, { col: 48, row: 12, width: 4, tile: 11 },
                { col: 76, row: 13, width: 5, tile: 3 }, { col: 112, row: 12, width: 4, tile: 11 },
                { col: 150, row: 13, width: 5, tile: 3 }, { col: 206, row: 12, width: 4, tile: 11 }
            ],
            pipes: [{ col: 62, row: 15 }, { col: 136, row: 15 }, { col: 226, row: 15 }],
            blocks: [{ col: 22, row: 12, tile: 42 }, { col: 50, row: 11, tile: 4 }, { col: 114, row: 11, tile: 4 }, { col: 208, row: 11, tile: 43 }],
            coins: [8,9,10,21,22,23,36,37,49,50,51,70,71,78,79,96,97,113,114,115,132,133,151,152,153,176,177,206,207,208,240,241,242,262,263],
            enemies: [{ col: 34 }, { col: 58, tile: 61 }, { col: 94 }, { col: 128 }, { col: 172, tile: 61 }, { col: 212 }, { col: 246 }],
            flagCol: 290,
            variant: 'a'
        });
        addSteps(map, 184, 16, [1, 1, 2, 2, 3, 3, 2, 2, 1], 11);
        clearBossArena(map, 1, 2);
        return {
            map: map,
            decorations: {
                custom: [
                    { x: 360, y: 523, key: 'poopdemons-silly-deco', scale: 1.1 },
                    { x: 780, y: 528, key: 'poopdemons-slime-deco', scale: 1.2 },
                    { x: 1120, y: 490, key: 'poopdemons-stink-cloud-deco', scale: 1.1, alpha: 0.9 },
                    { x: 1840, y: 523, key: 'poopdemons-silly-deco', scale: 1.0, flipX: true },
                    { x: 2920, y: 528, key: 'poopdemons-slime-deco', scale: 1.15 },
                    { x: 4140, y: 490, key: 'poopdemons-stink-cloud-deco', scale: 1.2, alpha: 0.9 },
                    { x: 5560, y: 523, key: 'poopdemons-silly-deco', scale: 1.1 },
                    { x: 7240, y: 528, key: 'poopdemons-slime-deco', scale: 1.2 },
                    { x: 8420, y: 490, key: 'poopdemons-stink-cloud-deco', scale: 1.05, alpha: 0.9 }
                ],
                hills: [
                    { x: 560, y: 544, scale: 0.8, tint: 0x8b5a2b },
                    { x: 1960, y: 544, scale: 1.0, tint: 0x6b8e23 },
                    { x: 3740, y: 544, scale: 0.9, tint: 0x8b5a2b },
                    { x: 6280, y: 544, scale: 1.1, tint: 0x6b8e23 }
                ],
                bushes: [
                    { x: 420, y: 544, scale: 0.65, tint: 0x7a4a24 },
                    { x: 1480, y: 544, scale: 0.55, tint: 0x4f7f2a },
                    { x: 2860, y: 544, scale: 0.7, tint: 0x7a4a24 },
                    { x: 5100, y: 544, scale: 0.6, tint: 0x4f7f2a }
                ],
                sparkles: [
                    { x: 980, y: 120, scale: 0.8, tint: 0xb6e36a },
                    { x: 2560, y: 100, scale: 0.9, tint: 0xb6e36a },
                    { x: 4440, y: 130, scale: 0.75, tint: 0xd9b05c },
                    { x: 8180, y: 110, scale: 0.8, tint: 0xb6e36a }
                ]
            },
            variant: 'a'
        };
    };

    window.LEVEL_GENERATORS[29] = function () {
        var map = build({
            cols: 300,
            groundTile: 11,
            earthTile: 11,
            gaps: [
                { from: 30, to: 34, bridgeRow: 14, bridgeTile: 11 },
                { from: 66, to: 70, bridgeRow: 13, bridgeTile: 12 },
                { from: 108, to: 112, bridgeRow: 14, bridgeTile: 11 },
                { from: 152, to: 156, bridgeRow: 13, bridgeTile: 12 },
                { from: 196, to: 200, bridgeRow: 14, bridgeTile: 11 },
                { from: 238, to: 242, bridgeRow: 13, bridgeTile: 12 }
            ],
            platforms: [
                { col: 18, row: 12, width: 4, tile: 11 }, { col: 46, row: 11, width: 3, tile: 11 },
                { col: 84, row: 12, width: 4, tile: 12 }, { col: 126, row: 11, width: 4, tile: 11 },
                { col: 170, row: 12, width: 4, tile: 13 }, { col: 214, row: 11, width: 4, tile: 11 },
                { col: 258, row: 12, width: 4, tile: 12 }
            ],
            blocks: [{ col: 19, row: 11, tile: 42 }, { col: 86, row: 11, tile: 4 }, { col: 128, row: 10, tile: 41 }, { col: 216, row: 10, tile: 43 }],
            coins: [8,9,20,21,32,33,47,48,68,69,85,86,87,109,110,127,128,129,154,155,171,172,198,199,215,216,217,240,241,259,260,274,275,276],
            enemies: [{ col: 40 }, { col: 76, tile: 61 }, { col: 118 }, { col: 164 }, { col: 208, tile: 61 }, { col: 250 }],
            movers: [{ col: 58, row: 12 }, { col: 142, row: 12 }, { col: 226, row: 12 }],
            flagCol: 290,
            variant: 'a'
        });
        addCoinTrail(map, [118,119,120,121,122,123,124,125,126], 9);
        return {
            map: map,
            decorations: {
                custom: [
                    { x: 360, y: 120, key: 'space2-planet-ring-deco', scale: 1.25, depth: -10, scrollFactor: 0.3 },
                    { x: 860, y: 164, key: 'space2-asteroid-deco', scale: 1.0, depth: -10, scrollFactor: 0.35 },
                    { x: 1340, y: 92, key: 'space2-satellite-deco', scale: 1.0, depth: -9, scrollFactor: 0.4 },
                    { x: 2520, y: 134, key: 'space2-planet-ring-deco', scale: 1.05, depth: -10, scrollFactor: 0.3 },
                    { x: 3540, y: 96, key: 'space2-satellite-deco', scale: 1.05, depth: -9, scrollFactor: 0.4, flipX: true },
                    { x: 4780, y: 150, key: 'space2-asteroid-deco', scale: 1.2, depth: -10, scrollFactor: 0.35 },
                    { x: 6120, y: 110, key: 'space2-planet-ring-deco', scale: 1.15, depth: -10, scrollFactor: 0.3 },
                    { x: 7480, y: 148, key: 'space2-satellite-deco', scale: 1.0, depth: -9, scrollFactor: 0.4 },
                    { x: 8420, y: 92, key: 'space2-asteroid-deco', scale: 1.05, depth: -10, scrollFactor: 0.35 }
                ],
                planets: [
                    { x: 440, y: 120, scale: 1.15 }, { x: 1660, y: 82, scale: 0.85 }, { x: 2980, y: 138, scale: 1.0 },
                    { x: 4380, y: 96, scale: 1.2 }, { x: 5900, y: 132, scale: 0.9 }, { x: 7600, y: 96, scale: 1.05 }
                ],
                starfields: [
                    { x: 220, y: 78, scale: 1.0 }, { x: 980, y: 108, scale: 0.9 }, { x: 2060, y: 70, scale: 1.1 },
                    { x: 3440, y: 118, scale: 0.85 }, { x: 4900, y: 82, scale: 1.0 }, { x: 6460, y: 112, scale: 1.1 },
                    { x: 8140, y: 74, scale: 0.95 }
                ],
                rockets: [{ x: 1220, y: 160, scale: 0.8 }, { x: 3840, y: 150, scale: 0.9 }, { x: 7040, y: 142, scale: 0.8 }]
            },
            variant: 'a'
        };
    };

    window.LEVEL_GENERATORS[30] = function () {
        var map = build({
            cols: 300,
            groundTile: 1,
            earthTile: 2,
            gaps: [
                { from: 54, to: 57, bridgeRow: 13, bridgeTile: 11 },
                { from: 118, to: 121, bridgeRow: 14, bridgeTile: 11 },
                { from: 188, to: 191, bridgeRow: 13, bridgeTile: 11 }
            ],
            platforms: [
                { col: 18, row: 13, width: 5, tile: 11 }, { col: 42, row: 11, width: 5, tile: 11 },
                { col: 74, row: 12, width: 6, tile: 11 }, { col: 104, row: 11, width: 5, tile: 11 },
                { col: 138, row: 12, width: 6, tile: 11 }, { col: 168, row: 11, width: 5, tile: 11 },
                { col: 218, row: 12, width: 6, tile: 11 }, { col: 252, row: 11, width: 5, tile: 11 }
            ],
            pipes: [{ col: 92, row: 15 }, { col: 202, row: 15 }],
            blocks: [{ col: 20, row: 12, tile: 42 }, { col: 44, row: 10, tile: 4 }, { col: 140, row: 11, tile: 4 }, { col: 254, row: 10, tile: 43 }],
            coins: [8,9,10,19,20,21,43,44,45,55,56,76,77,78,106,107,119,120,140,141,142,170,171,189,190,220,221,222,253,254,255,274,275,276],
            enemies: [{ col: 34 }, { col: 86 }, { col: 130, tile: 61 }, { col: 180 }, { col: 232, tile: 61 }, { col: 264 }],
            flagCol: 290,
            variant: 'a'
        });
        var trunks = [30, 64, 96, 154, 210, 240];
        for (var i = 0; i < trunks.length; i++) {
            fill(map, 16, trunks[i], trunks[i] + 1, 11);
            fill(map, 15, trunks[i], trunks[i] + 1, 11);
            fill(map, 14, trunks[i], trunks[i] + 1, 11);
            if (i % 2 === 0) fill(map, 13, trunks[i], trunks[i] + 1, 11);
        }
        addSteps(map, 226, 16, [1, 2, 3, 2, 1, 2, 3, 2, 1], 11);
        return {
            map: map,
            decorations: {
                custom: [
                    { x: 300, y: 512, key: 'forest2-pine-deco', scale: 1.05 },
                    { x: 780, y: 529, key: 'forest2-fern-deco', scale: 1.2 },
                    { x: 1140, y: 146, key: 'forest2-fireflies-deco', scale: 1.2, depth: -5, alpha: 0.95 },
                    { x: 2040, y: 512, key: 'forest2-pine-deco', scale: 1.0, flipX: true },
                    { x: 2840, y: 529, key: 'forest2-fern-deco', scale: 1.15 },
                    { x: 3960, y: 132, key: 'forest2-fireflies-deco', scale: 1.25, depth: -5, alpha: 0.95 },
                    { x: 5280, y: 512, key: 'forest2-pine-deco', scale: 1.1 },
                    { x: 6660, y: 529, key: 'forest2-fern-deco', scale: 1.2 },
                    { x: 8060, y: 142, key: 'forest2-fireflies-deco', scale: 1.15, depth: -5, alpha: 0.95 }
                ],
                vines: [{ x: 520, y: 0, scale: 0.9 }, { x: 1440, y: 0, scale: 1.1 }, { x: 2620, y: 0, scale: 0.95 }, { x: 4080, y: 0, scale: 1.2 }, { x: 6200, y: 0, scale: 1.0 }],
                leaves: [{ x: 680, y: 544, scale: 0.9 }, { x: 1760, y: 544, scale: 1.0 }, { x: 3140, y: 544, scale: 0.85 }, { x: 4960, y: 544, scale: 1.1 }, { x: 7040, y: 544, scale: 0.9 }],
                mushrooms: [{ x: 360, y: 544, scale: 0.9 }, { x: 1240, y: 544, scale: 1.1 }, { x: 2300, y: 544, scale: 0.8 }, { x: 3720, y: 544, scale: 1.0 }, { x: 5680, y: 544, scale: 0.9 }, { x: 7880, y: 544, scale: 1.1 }],
                bushes: classicSkyDecor({}).bushes
            },
            variant: 'a'
        };
    };

    window.LEVEL_GENERATORS[31] = function () {
        var map = build({
            cols: 300,
            groundTile: 1,
            earthTile: 2,
            gaps: [
                { from: 44, to: 48, bridgeRow: 14, bridgeTile: 11 },
                { from: 96, to: 100, bridgeRow: 13, bridgeTile: 11 },
                { from: 154, to: 158, bridgeRow: 14, bridgeTile: 11 },
                { from: 220, to: 224, bridgeRow: 13, bridgeTile: 11 }
            ],
            platforms: [
                { col: 22, row: 12, width: 5, tile: 3 }, { col: 62, row: 13, width: 5, tile: 11 },
                { col: 82, row: 11, width: 4, tile: 3 }, { col: 118, row: 13, width: 6, tile: 11 },
                { col: 178, row: 12, width: 5, tile: 3 }, { col: 236, row: 13, width: 5, tile: 11 },
                { col: 258, row: 11, width: 4, tile: 3 }
            ],
            pipes: [{ col: 70, row: 15 }, { col: 132, row: 15 }, { col: 198, row: 15 }],
            blocks: [{ col: 24, row: 11, tile: 42 }, { col: 84, row: 10, tile: 4 }, { col: 120, row: 12, tile: 4 }, { col: 260, row: 10, tile: 43 }],
            coins: [8,9,10,23,24,25,46,47,63,64,83,84,85,98,99,120,121,122,156,157,179,180,181,222,223,237,238,259,260,261,274,275],
            enemies: [{ col: 36 }, { col: 76, tile: 61 }, { col: 110 }, { col: 146 }, { col: 188, tile: 61 }, { col: 244 }, { col: 266 }, { col: 150, tile: 66 }],
            movers: [{ col: 54, row: 12 }, { col: 166, row: 12 }],
            flagCol: 290,
            variant: 'a'
        });
        addSteps(map, 12, 16, [1, 2, 3, 4, 3, 2], 11);
        addSteps(map, 138, 16, [1, 2, 3, 4, 5, 4, 3, 2], 11);
        addSteps(map, 204, 16, [1, 2, 3, 4, 3, 2], 11);
        return {
            map: map,
            decorations: {
                custom: [
                    { x: 260, y: 31, key: 'jungle2-vine-deco', scale: 1.1, depth: -6 },
                    { x: 640, y: 525, key: 'jungle2-temple-block-deco', scale: 1.05 },
                    { x: 920, y: 527, key: 'jungle2-big-leaf-deco', scale: 1.15 },
                    { x: 1820, y: 31, key: 'jungle2-vine-deco', scale: 1.0, depth: -6, flipX: true },
                    { x: 2760, y: 525, key: 'jungle2-temple-block-deco', scale: 1.0 },
                    { x: 3540, y: 527, key: 'jungle2-big-leaf-deco', scale: 1.2, flipX: true },
                    { x: 4980, y: 31, key: 'jungle2-vine-deco', scale: 1.15, depth: -6 },
                    { x: 6300, y: 525, key: 'jungle2-temple-block-deco', scale: 1.05 },
                    { x: 7660, y: 527, key: 'jungle2-big-leaf-deco', scale: 1.15 }
                ],
                vines: [{ x: 360, y: 0, scale: 1.1 }, { x: 1100, y: 0, scale: 0.9 }, { x: 2140, y: 0, scale: 1.2 }, { x: 3460, y: 0, scale: 1.0 }, { x: 5220, y: 0, scale: 1.15 }, { x: 7160, y: 0, scale: 0.95 }],
                palms: [{ x: 620, y: 544, scale: 0.85 }, { x: 1860, y: 544, scale: 1.0 }, { x: 3260, y: 544, scale: 0.9 }, { x: 5060, y: 544, scale: 1.1 }, { x: 7460, y: 544, scale: 0.95 }],
                leaves: [{ x: 880, y: 544, scale: 0.8 }, { x: 2520, y: 544, scale: 1.0 }, { x: 4320, y: 544, scale: 0.9 }, { x: 6600, y: 544, scale: 1.05 }],
                rocks: [{ x: 1440, y: 544, scale: 0.7 }, { x: 3840, y: 544, scale: 0.8 }, { x: 6060, y: 544, scale: 0.75 }]
            },
            variant: 'a'
        };
    };

    window.LEVEL_GENERATORS[32] = function () {
        var map = build({
            cols: 300,
            groundTile: 11,
            earthTile: 11,
            sections: [
                { from: 40, to: 70, groundTile: 11, earthTile: 11, bridgeRow: 13, bridgeTile: 11 },
                { from: 122, to: 154, groundTile: 11, earthTile: 11, bridgeRow: 12, bridgeTile: 11 },
                { from: 202, to: 232, groundTile: 11, earthTile: 11, bridgeRow: 13, bridgeTile: 11 }
            ],
            gaps: [
                { from: 82, to: 85, bridgeRow: 15, bridgeTile: 11 },
                { from: 174, to: 177, bridgeRow: 15, bridgeTile: 11 }
            ],
            platforms: [
                { col: 18, row: 13, width: 5, tile: 11 }, { col: 52, row: 11, width: 4, tile: 11 },
                { col: 96, row: 13, width: 5, tile: 11 }, { col: 136, row: 10, width: 4, tile: 11 },
                { col: 188, row: 12, width: 5, tile: 11 }, { col: 238, row: 12, width: 5, tile: 11 }
            ],
            pipes: [{ col: 72, row: 15 }, { col: 158, row: 15 }, { col: 236, row: 15 }],
            blocks: [{ col: 20, row: 12, tile: 42 }, { col: 54, row: 10, tile: 4 }, { col: 138, row: 9, tile: 41 }, { col: 240, row: 11, tile: 43 }],
            coins: [8,9,10,19,20,21,53,54,55,83,84,97,98,99,136,137,138,175,176,189,190,191,218,219,239,240,241,260,261],
            enemies: [{ col: 34 }, { col: 66, tile: 61 }, { col: 112 }, { col: 146 }, { col: 194, tile: 61 }, { col: 250 }, { col: 130, tile: 64 }],
            movers: [{ col: 104, row: 12 }, { col: 166, row: 12 }],
            flagCol: 290,
            variant: 'a'
        });
        var crystals = [28, 88, 116, 180, 214, 252];
        for (var i = 0; i < crystals.length; i++) {
            fill(map, 16, crystals[i], crystals[i] + 1, 11);
            if (i % 2 === 0) fill(map, 15, crystals[i], crystals[i] + 1, 11);
        }
        clearBossArena(map, 11, 11);
        return {
            map: map,
            decorations: {
                custom: [
                    { x: 320, y: 522, key: 'underground2-crystal-cluster-deco', scale: 1.1 },
                    { x: 820, y: 527, key: 'underground2-minecart-deco', scale: 1.0 },
                    { x: 1220, y: 523, key: 'underground2-lantern-deco', scale: 1.1 },
                    { x: 2080, y: 522, key: 'underground2-crystal-cluster-deco', scale: 1.0 },
                    { x: 3160, y: 527, key: 'underground2-minecart-deco', scale: 1.05, flipX: true },
                    { x: 4300, y: 523, key: 'underground2-lantern-deco', scale: 1.15 },
                    { x: 5720, y: 522, key: 'underground2-crystal-cluster-deco', scale: 1.1 },
                    { x: 7060, y: 527, key: 'underground2-minecart-deco', scale: 1.0 },
                    { x: 8240, y: 523, key: 'underground2-lantern-deco', scale: 1.1 }
                ],
                crystals: [{ x: 420, y: 544, scale: 1.0 }, { x: 1420, y: 544, scale: 1.2 }, { x: 2700, y: 544, scale: 0.9 }, { x: 4200, y: 544, scale: 1.1 }, { x: 5880, y: 544, scale: 1.0 }, { x: 7960, y: 544, scale: 1.2 }],
                stalactites: [{ x: 500, y: 0, scale: 0.9 }, { x: 1520, y: 0, scale: 1.1 }, { x: 2820, y: 0, scale: 0.95 }, { x: 4560, y: 0, scale: 1.2 }, { x: 6480, y: 0, scale: 1.0 }],
                planks: [{ x: 980, y: 544, scale: 1.0 }, { x: 3300, y: 544, scale: 1.1 }, { x: 5320, y: 544, scale: 1.0 }, { x: 7420, y: 544, scale: 1.1 }],
                rocks: [{ x: 660, y: 544, scale: 0.7 }, { x: 2300, y: 544, scale: 0.9 }, { x: 5140, y: 544, scale: 0.8 }]
            },
            variant: 'a'
        };
    };
})();
