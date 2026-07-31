/**
 * buildThemedMap — compact 300x19 tilemap builder for future themed levels.
 *
 * Tile ids follow the project convention:
 * 1=grass, 2=earth, 3=brick, 4/40/41/42/43=? blocks, 6-9=pipe,
 * 11=stone, 12=horizontal mover, 13=vertical mover, 44=enterable pipe top,
 * 50=coin, 60=goomba, 61=koopa, 70=flagpole.
 */
(function () {
    function makeRow(length, value) {
        var row = [];
        for (var i = 0; i < length; i++) row[i] = value;
        return row;
    }

    function clamp(n, min, max) {
        return Math.max(min, Math.min(max, n));
    }

    function put(map, row, col, tile) {
        if (map[row] && col >= 0 && col < map[row].length) map[row][col] = tile;
    }

    function fillRange(map, row, from, to, tile) {
        from = clamp(from, 0, map[row].length - 1);
        to = clamp(to, 0, map[row].length - 1);
        for (var c = from; c <= to; c++) map[row][c] = tile;
    }

    function placePipe(map, pipe) {
        var col = (typeof pipe === 'number') ? pipe : pipe.col;
        var topRow = (pipe && pipe.row !== undefined) ? pipe.row : 15;
        var height = (pipe && pipe.height) || (17 - topRow);
        var enterable = pipe && pipe.enterable;
        if (col < 0 || col + 1 >= map[0].length) return;

        put(map, topRow, col, enterable ? 44 : 6);
        put(map, topRow, col + 1, 7);
        for (var r = topRow + 1; r < topRow + height; r++) {
            put(map, r, col, 8);
            put(map, r, col + 1, 9);
        }
    }

    function placeItemList(map, list, defaultRow, defaultTile) {
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            if (typeof item === 'number') {
                put(map, defaultRow, item, defaultTile);
            } else {
                put(map, item.row !== undefined ? item.row : item[1], item.col !== undefined ? item.col : item[0], item.tile || item[2] || defaultTile);
            }
        }
    }

    function placeEnemies(map, list) {
        for (var i = 0; i < list.length; i++) {
            var e = list[i];
            if (typeof e === 'number') {
                put(map, 16, e, 60);
            } else if (e.col !== undefined) {
                put(map, e.row !== undefined ? e.row : 16, e.col, e.tile || (e.type === 'koopa' ? 61 : 60));
            } else if (e.length === 2) {
                put(map, 16, e[0], e[1]);
            } else {
                put(map, e[1], e[0], e[2] || 60);
            }
        }
    }

    function placeMovers(map, list) {
        for (var i = 0; i < list.length; i++) {
            var m = list[i];
            if (typeof m === 'number') {
                put(map, 13, m, 12);
            } else if (m.col !== undefined) {
                put(map, m.row !== undefined ? m.row : 13, m.col, m.tile || (m.axis === 'v' ? 13 : 12));
            } else {
                put(map, m[1], m[0], m[2] === 'v' ? 13 : (m[2] || 12));
            }
        }
    }

    function applySection(map, section) {
        var from = section.from !== undefined ? section.from : section.start;
        var to = section.to !== undefined ? section.to : section.end;
        if (from === undefined || to === undefined) return;

        if (section.ground === false || section.type === 'gap') {
            fillRange(map, 17, from, to, 0);
            fillRange(map, 18, from, to, 0);
        } else if (section.groundTile || section.earthTile || section.type === 'ground') {
            fillRange(map, 17, from, to, section.groundTile || 1);
            fillRange(map, 18, from, to, section.earthTile || section.groundTile || 2);
        }

        if (section.bridgeRow !== undefined) {
            fillRange(map, section.bridgeRow, from, to, section.bridgeTile || 11);
        }
    }

    function buildThemedMap(opts) {
        opts = opts || {};
        var cols = opts.cols || 300;
        var rows = opts.rows || 19;
        var empty = 0;
        var map = [];
        var r;

        for (r = 0; r < rows; r++) map[r] = makeRow(cols, empty);
        map[17] = makeRow(cols, opts.groundTile || 1);
        map[18] = makeRow(cols, opts.earthTile || 2);

        for (var s = 0; s < (opts.sections || []).length; s++) applySection(map, opts.sections[s]);

        var gaps = opts.gaps || [];
        for (var g = 0; g < gaps.length; g++) {
            var gap = gaps[g];
            var start = gap.from !== undefined ? gap.from : gap[0];
            var end = gap.to !== undefined ? gap.to : gap[1];
            fillRange(map, 17, start, end, 0);
            fillRange(map, 18, start, end, 0);
            if (gap.bridgeRow !== undefined) fillRange(map, gap.bridgeRow, start, end, gap.bridgeTile || 11);
        }

        var platforms = opts.platforms || [];
        for (var p = 0; p < platforms.length; p++) {
            var pl = platforms[p];
            var col = pl.col !== undefined ? pl.col : pl[0];
            var row = pl.row !== undefined ? pl.row : pl[1];
            var width = pl.width || pl[2] || 1;
            var tile = pl.tile || pl[3] || 11;
            for (var pc = col; pc < col + width; pc++) put(map, row, pc, tile);
        }

        var pipes = opts.pipes || [];
        for (var pi = 0; pi < pipes.length; pi++) placePipe(map, pipes[pi]);

        placeItemList(map, opts.blocks || opts.powerups || [], 12, 4);
        placeItemList(map, opts.coins || [], 16, 50);
        placeEnemies(map, opts.enemies || []);
        placeMovers(map, opts.movers || []);

        var flagCol = opts.flagCol || 290;
        var flagRow = opts.flagRow || 5;
        put(map, flagRow, flagCol, 70);
        fillRange(map, 17, Math.max(0, flagCol - 10), Math.min(cols - 1, flagCol + 7), opts.flagGroundTile || opts.groundTile || 1);
        fillRange(map, 18, Math.max(0, flagCol - 10), Math.min(cols - 1, flagCol + 7), opts.flagEarthTile || opts.earthTile || 2);
        fillRange(map, 17, 0, Math.min(cols - 1, opts.safeStart || 6), opts.groundTile || 1);
        fillRange(map, 18, 0, Math.min(cols - 1, opts.safeStart || 6), opts.earthTile || 2);

        if (typeof window !== 'undefined' && window.validateLevelMap) {
            var result = window.validateLevelMap(map);
            if (!result.ok && window.console && console.warn) console.warn('[buildThemedMap] invalid map', result.errors);
        }
        return map;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { buildThemedMap: buildThemedMap };
    }
    if (typeof window !== 'undefined') {
        window.buildThemedMap = buildThemedMap;
    }
})();
