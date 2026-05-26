/**
 * Pre-deploy validation of the real getLevelNData functions (levels 10-14).
 * Loads GameScene.js with a minimal Phaser stub, builds each level, runs the
 * extendMapTo300 pipeline, and validates the final map with validateLevelMap.
 *
 * Run: node tests/validate-new-levels.js
 */

// --- Minimal stubs so GameScene.js executes under Node ---
global.window = {};
global.localStorage = { getItem: function () { return null; }, setItem: function () {} };
global.Phaser = {
    Class: function (cfg) { for (var k in cfg) this[k] = cfg[k]; return this; },
    Scene: function () {}
};

require('../js/utils/levelValidator.js');
require('../js/scenes/GameScene.js');

var validateLevelMap = global.window.validateLevelMap;
var GS = global.window.GameScene;

var failed = 0;
var LEVELS = [10, 11, 12, 13, 14];

LEVELS.forEach(function (lvl) {
    var fn = GS['getLevel' + lvl + 'Data'];
    if (typeof fn !== 'function') {
        console.error('Level ' + lvl + ': getLevel' + lvl + 'Data MISSING');
        failed++;
        return;
    }
    var data = fn.call(GS);
    // Validate the authored base map first
    var base = validateLevelMap(data.map);
    // Then run the real extension pipeline and validate the full 300-col map
    GS.extendMapTo300.call(GS, data.map, data.variant || 'a');
    var full = validateLevelMap(data.map);

    var ok = base.ok && full.ok;
    if (!ok) {
        failed++;
        console.error('Level ' + lvl + ': FAIL');
        if (!base.ok) console.error('   base: ' + JSON.stringify(base.errors));
        if (!full.ok) console.error('   full: ' + JSON.stringify(full.errors));
    } else {
        // Count enemies for a quick difficulty sanity readout
        var enemies = 0, flags = 0;
        for (var r = 0; r < data.map.length; r++) {
            for (var c = 0; c < data.map[r].length; c++) {
                var t = data.map[r][c];
                if (t === 60 || t === 61) enemies++;
                if (t === 70) flags++;
            }
        }
        console.log('Level ' + lvl + ': OK  (enemies=' + enemies + ', flagpoles=' + flags + ')');
    }
});

console.log('\n' + (failed ? (failed + ' level(s) FAILED') : 'All new levels valid.'));
process.exit(failed ? 1 : 0);
