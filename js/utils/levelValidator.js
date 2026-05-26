/**
 * levelValidator — pure tilemap reachability checks for app-mario levels.
 *
 * Dev/test tool: given a 2D tile-id map (rows of columns), report whether the
 * level is playable for a 6-7yo: solid spawn area, a flagpole, and no
 * un-jumpable void gaps.
 *
 * Usage (Node test):   const { validateLevelMap } = require('./levelValidator');
 * Usage (browser):     window.validateLevelMap(map)
 *
 * A column is "standable" if any of rows 11..18 holds a solid/landable tile.
 * Mario's jump clears ~5 tiles, so a run of >maxGap standable-void columns in a
 * row means a fall with no landing — flagged as unreachable.
 *
 * Tile ids: 1=grass,2=earth,3=brick,4/40/41=?-block,6-9=pipe,11=stone,
 *           50=coin,60=goomba,61=koopa,70=flagpole,0=empty.
 */
(function () {
    var SOLID = { 1: 1, 2: 1, 3: 1, 4: 1, 40: 1, 41: 1, 6: 1, 7: 1, 8: 1, 9: 1, 11: 1 };

    function validateLevelMap(map, opts) {
        opts = opts || {};
        var maxGap = opts.maxGap || 5;       // max consecutive void columns
        var safeStart = opts.safeStart || 6; // first N cols must be solid ground
        var errors = [];

        if (!map || map.length < 19) {
            errors.push('map must have at least 19 rows');
            return { ok: false, errors: errors };
        }
        if (!map[17] || !map[18]) {
            errors.push('ground rows 17 and 18 are required');
            return { ok: false, errors: errors };
        }

        var cols = map[17].length;

        // Safe start: spawn area (cols 0..safeStart-1) must have ground at row 17.
        for (var c = 0; c < safeStart && c < cols; c++) {
            if (!SOLID[map[17][c]]) {
                errors.push('safe-start col ' + c + ' has no ground at row 17');
                break;
            }
        }

        // Flagpole present (gets relocated by extendMapTo300, but must exist).
        var hasFlag = false;
        for (var r = 0; r < map.length && !hasFlag; r++) {
            if (!map[r]) continue;
            for (var fc = 0; fc < map[r].length; fc++) {
                if (map[r][fc] === 70) { hasFlag = true; break; }
            }
        }
        if (!hasFlag) errors.push('no flagpole (70) found');

        // No un-jumpable void runs (rows 11..18).
        function standable(col) {
            for (var rr = 11; rr <= 18; rr++) {
                if (map[rr] && SOLID[map[rr][col]]) return true;
            }
            return false;
        }
        var run = 0;
        for (var col = 0; col < cols; col++) {
            if (standable(col)) {
                run = 0;
            } else {
                run++;
                if (run === maxGap + 1) {
                    errors.push('void gap wider than ' + maxGap + ' tiles near col ' + (col - maxGap) + '-' + col);
                }
            }
        }

        return { ok: errors.length === 0, errors: errors };
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { validateLevelMap: validateLevelMap };
    }
    if (typeof window !== 'undefined') {
        window.validateLevelMap = validateLevelMap;
    }
})();
