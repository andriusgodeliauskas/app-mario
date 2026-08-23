/**
 * Can the SLOWEST hero still finish every level?
 *
 * The validator's maxGap is the widest void run a hero can clear, tuned for
 * Mario at speed 200. Rosalina and Peach run at 0.95, so their horizontal jump
 * reach is ~5% shorter. This walks every authored level through the real
 * extendMapTo300 pipeline and validates it at the tighter bound, so a gap that
 * only Mario can clear fails here instead of trapping a child mid-level.
 *
 * Run: node tests/hero-reach.test.js
 */
global.window = {};
global.localStorage = { getItem: function () { return null; }, setItem: function () {} };
global.Phaser = {
    Class: function (cfg) { for (var k in cfg) this[k] = cfg[k]; return this; },
    Scene: function () {}
};

require('../js/utils/levelValidator.js');
require('../js/data/characters.js');
require('../js/utils/levelBuilder.js');
require('../js/scenes/GameScene.js');
// Levels 20-42 are authored as generators in js/data/levels-*.js rather than
// as getLevelNData methods, so they have to be loaded too or the sweep would
// silently cover only a third of the game.
['20-26', '27-32', '33-37', '38-42'].forEach(function (range) {
    try { require('../js/data/levels-' + range + '.js'); }
    catch (e) { console.warn('nepavyko uzkrauti levels-' + range + ': ' + e.message); }
});

var validateLevelMap = global.window.validateLevelMap;
var GS = global.window.GameScene;
var Characters = global.window.Characters || require('../js/data/characters.js');

// Slowest hero decides the bound. maxGap 5 is Mario's; a 0.95 runner covers
// ~4.75 tiles, so anything that needs the 5th tile is off-limits for them.
var slowest = Characters.LIST.reduce(function (a, c) {
    return c.physics.speedMul < a.physics.speedMul ? c : a;
}, Characters.LIST[0]);
var strictGap = Math.floor(5 * slowest.physics.speedMul);

console.log('Leciausias herojus: ' + slowest.name + ' (speedMul ' + slowest.physics.speedMul + ')');
console.log('Griezta tarpo riba: ' + strictGap + ' (Mario riba 5)\n');

var checked = 0, mariosOnly = [], broken = [];

var generators = global.window.LEVEL_GENERATORS || {};
var skipped = [];

for (var lvl = 1; lvl <= 52; lvl++) {
    var data = null;
    var fn = GS['getLevel' + lvl + 'Data'];
    if (typeof fn === 'function') {
        try { data = fn.call(GS); } catch (e) { skipped.push(lvl + ' (getLevel threw: ' + e.message + ')'); continue; }
    } else if (typeof generators[lvl] === 'function') {
        try { data = generators[lvl]({ textures: { exists: function () { return true; } } }); }
        catch (e) { skipped.push(lvl + ' (generator threw: ' + e.message + ')'); continue; }
    } else {
        skipped.push(lvl + ' (nera duomenu funkcijos)');
        continue;
    }
    if (!data || !data.map) { skipped.push(lvl + ' (be zemelapio)'); continue; }

    try { GS.extendMapTo300.call(GS, data.map, data.variant || 'a'); } catch (e) { /* already extended */ }

    checked++;
    var mario = validateLevelMap(data.map, { maxGap: 5 });
    var slow = validateLevelMap(data.map, { maxGap: strictGap });

    if (!mario.ok) broken.push(lvl + ': ' + mario.errors.join('; '));
    else if (!slow.ok) mariosOnly.push(lvl + ': ' + slow.errors.join('; '));
}

console.log('Patikrinta lygiu: ' + checked);
if (skipped.length) console.log('Nepatikrinta (' + skipped.length + '): ' + skipped.join(', '));

if (broken.length) {
    console.error('\nLygiai, neisstojantys net Mario ribai:');
    broken.forEach(function (b) { console.error('  ✗ ' + b); });
}
if (mariosOnly.length) {
    console.error('\nLygiai, iseinami TIK greitiems herojams:');
    mariosOnly.forEach(function (b) { console.error('  ✗ ' + b); });
}

if (!broken.length && !mariosOnly.length) {
    console.log('\n✓ Visi ' + checked + ' lygiai iseinami ir leciausiu herojumi.');
}
process.exit((broken.length || mariosOnly.length) ? 1 : 0);
