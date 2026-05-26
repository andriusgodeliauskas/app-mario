/**
 * Unit tests for validateLevelMap (levelValidator.js).
 * Run: node tests/unit/levels.test.js
 */

const { validateLevelMap } = require('../../js/utils/levelValidator.js');

let passed = 0, failed = 0;
const failures = [];

function assert(cond, msg) {
    if (cond) { passed++; }
    else { failed++; failures.push(msg); console.error('  FAIL: ' + msg); }
}

function test(name, fn) {
    console.log('\n→ ' + name);
    try { fn(); } catch (e) { failed++; failures.push(name + ' threw: ' + e.message); console.error('  THREW: ' + e.message); }
}

// -------- Helpers --------
function makeRow(len, val) {
    const r = [];
    for (let i = 0; i < len; i++) r.push(val);
    return r;
}
// Base playable map: 19 rows x cols, empty sky, solid ground rows 17-18, flag at col 190.
function baseMap(cols) {
    cols = cols || 200;
    const map = [];
    for (let r = 0; r < 19; r++) map[r] = makeRow(cols, 0);
    map[17] = makeRow(cols, 1); // grass
    map[18] = makeRow(cols, 2); // earth
    map[5][190] = 70;           // flagpole
    return map;
}
function pit(map, from, to) {            // carve a void pit (no ground) cols [from,to]
    for (let c = from; c <= to; c++) { map[17][c] = 0; map[18][c] = 0; }
}
function bridge(map, from, to, row) {    // stone bridge over a pit
    row = row || 12;
    for (let c = from; c <= to; c++) map[row][c] = 11;
}

// =========================================================
test('valid flat level passes', () => {
    const r = validateLevelMap(baseMap());
    assert(r.ok === true, 'flat level should be ok, got: ' + JSON.stringify(r.errors));
});

test('small pit (3 wide) passes', () => {
    const m = baseMap();
    pit(m, 40, 42);
    const r = validateLevelMap(m);
    assert(r.ok === true, '3-wide pit ok, got: ' + JSON.stringify(r.errors));
});

test('5-wide pit passes (at jump limit)', () => {
    const m = baseMap();
    pit(m, 40, 44);
    const r = validateLevelMap(m);
    assert(r.ok === true, '5-wide pit ok, got: ' + JSON.stringify(r.errors));
});

test('7-wide void pit fails', () => {
    const m = baseMap();
    pit(m, 40, 46);
    const r = validateLevelMap(m);
    assert(r.ok === false, '7-wide void should fail');
    assert(/void gap/.test(r.errors.join(' ')), 'error mentions void gap');
});

test('7-wide pit with stone bridge passes', () => {
    const m = baseMap();
    pit(m, 40, 46);
    bridge(m, 40, 46, 12); // landing platform spanning the pit
    const r = validateLevelMap(m);
    assert(r.ok === true, 'bridged pit ok, got: ' + JSON.stringify(r.errors));
});

test('no flagpole fails', () => {
    const m = baseMap();
    m[5][190] = 0;
    const r = validateLevelMap(m);
    assert(r.ok === false, 'missing flag should fail');
    assert(/flagpole/.test(r.errors.join(' ')), 'error mentions flagpole');
});

test('hole in spawn area fails', () => {
    const m = baseMap();
    m[17][2] = 0; m[18][2] = 0;
    const r = validateLevelMap(m);
    assert(r.ok === false, 'spawn hole should fail');
    assert(/safe-start/.test(r.errors.join(' ')), 'error mentions safe-start');
});

test('too-few rows fails', () => {
    const r = validateLevelMap([[0], [0]]);
    assert(r.ok === false, 'short map should fail');
});

// =========================================================
console.log('\n========================================');
console.log('Passed: ' + passed + ' | Failed: ' + failed);
if (failures.length) {
    console.log('\nFailures:');
    failures.forEach(f => console.log('  - ' + f));
    process.exit(1);
}
console.log('All level-validator tests passed.');
