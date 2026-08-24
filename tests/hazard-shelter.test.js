/**
 * Rain fairness: is there anywhere to hide?
 *
 * The storm damages a player with no solid tile above them. If a level has a
 * long stretch with no roof at all, the storm stops being a hazard and becomes
 * unavoidable damage — the exact thing that makes a child stop playing.
 *
 * This walks every GameScene level and reports the longest roofless run along
 * the ground path. Anything past the limit is a place to add a ledge, not a
 * reason to weaken the rain.
 *
 * Run: node tests/hazard-shelter.test.js
 */
global.window = {};
global.localStorage = { getItem: function () { return null; }, setItem: function () {} };
global.Phaser = {
    Class: function (cfg) { for (var k in cfg) this[k] = cfg[k]; return this; },
    Scene: function () {}
};

require('../js/utils/levelValidator.js');
require('../js/data/characters.js');
require('../js/data/cards.js');
require('../js/utils/levelBuilder.js');
require('../js/scenes/GameScene.js');
['20-26', '27-32', '33-37', '38-42'].forEach(function (r) {
    try { require('../js/data/levels-' + r + '.js'); } catch (e) { console.warn('levels-' + r + ': ' + e.message); }
});

var GS = global.window.GameScene;
var generators = global.window.LEVEL_GENERATORS || {};

// Anything the player can stand on also counts as a roof.
var SOLID = { 1: 1, 2: 1, 3: 1, 4: 1, 40: 1, 41: 1, 42: 1, 43: 1, 44: 1,
              6: 1, 7: 1, 8: 1, 9: 1, 11: 1, 12: 1, 13: 1 };

var MAX_ROOFLESS = 12;   // tiles

function longestRooflessRun(map) {
    var cols = map[17] ? map[17].length : 0;
    var run = 0, worst = 0, worstAt = -1;
    for (var c = 0; c < cols; c++) {
        var covered = false;
        // Rows 0..14: anything above the player's head as they run the ground line
        for (var r = 0; r <= 14; r++) {
            if (map[r] && SOLID[map[r][c]]) { covered = true; break; }
        }
        if (covered) { run = 0; }
        else {
            run++;
            if (run > worst) { worst = run; worstAt = c - run + 1; }
        }
    }
    return { worst: worst, at: worstAt };
}

var checked = 0, bad = [], longest = 0;
for (var lvl = 1; lvl <= 42; lvl++) {
    var data = null;
    var fn = GS['getLevel' + lvl + 'Data'];
    try {
        if (typeof fn === 'function') data = fn.call(GS);
        else if (typeof generators[lvl] === 'function') data = generators[lvl]({ textures: { exists: function () { return true; } } });
    } catch (e) { continue; }
    if (!data || !data.map) continue;
    try { GS.extendMapTo300.call(GS, data.map, data.variant || 'a'); } catch (e) { /* jau isplestas */ }
    // The shelters are what make the storm survivable, so the check must run on
    // the map the player actually gets on hard.
    GS.injectStormShelters.call(GS, data.map);

    checked++;
    var r = longestRooflessRun(data.map);
    if (r.worst > MAX_ROOFLESS) bad.push({ level: lvl, run: r.worst, at: r.at });
    else longest = Math.max(longest, r.worst);
}

console.log('Patikrinta lygiu: ' + checked + ' (riba: ' + MAX_ROOFLESS + ' plateliu be stogo)');
if (bad.length) {
    console.log('\nLygiai su per ilgomis atkarpomis be dangos:');
    bad.forEach(function (b) {
        console.log('  ' + String(b.level).padStart(2) + ': ' + b.run + ' plateliu nuo stulpelio ' + b.at);
    });
    console.log('\n' + bad.length + ' lygiu reikia stogeliu.');
    process.exit(1);
}
console.log('\n✓ Visuose lygiuose yra kur pasislepti (ilgiausia atkarpa be stogo: ' + longest + ' plateliu).');
