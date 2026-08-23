/**
 * Unit tests for the character registry (js/data/characters.js).
 * Run: node tests/unit/characters.test.js
 */

const Characters = require('../../js/data/characters.js');

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

test('kiekvieno herojaus fizika saugiose ribose (±10%)', () => {
    Characters.LIST.forEach(c => {
        assert(c.physics.speedMul >= 0.9 && c.physics.speedMul <= 1.1, c.id + ' speedMul ribose');
        assert(c.physics.jumpMul >= 0.9 && c.physics.jumpMul <= 1.1, c.id + ' jumpMul ribose');
    });
});

test('nei vienas herojus nera letesnis uz Mario', () => {
    // Six levels (1, 5-9) have a five-tile void gap only Mario's reach clears,
    // so a sub-1.0 multiplier would trap a child mid-level. Heroes may match or
    // beat him, never fall short. See tests/hero-reach.test.js.
    Characters.LIST.forEach(c => {
        assert(c.physics.speedMul >= 1, c.id + ' speedMul >= 1 (' + c.physics.speedMul + ')');
        assert(c.physics.jumpMul >= 1, c.id + ' jumpMul >= 1 (' + c.physics.jumpMul + ')');
    });
});

test('mario yra numatytasis ir fiziskai neutralus', () => {
    const m = Characters.byId('mario');
    assert(m !== null, 'mario egzistuoja');
    assert(m.physics.speedMul === 1 && m.physics.jumpMul === 1, 'mario neutralus');
    assert(Characters.DEFAULT_ID === 'mario', 'default mario');
});

test('8 zaidziami herojai, unikalus id', () => {
    assert(Characters.PLAYABLE_IDS.length === 8, 'yra 8, rasta ' + Characters.PLAYABLE_IDS.length);
    assert(new Set(Characters.PLAYABLE_IDS).size === 8, 'id unikalus');
    assert(Characters.LIST.length === Characters.PLAYABLE_IDS.length, 'LIST ir PLAYABLE_IDS sutampa');
});

test('kiekvienas irasas turi visus privalomus laukus', () => {
    const shapes = ['plumber', 'dress', 'mushroom', 'dino', 'monkey'];
    Characters.LIST.forEach(c => {
        assert(typeof c.name === 'string' && c.name.length > 0, c.id + ' turi EN varda');
        assert(typeof c.lt === 'string' && c.lt.length > 0, c.id + ' turi LT varda');
        assert(typeof c.power === 'string' && c.power.length > 0, c.id + ' turi galia');
        assert(typeof c.description === 'string' && c.description.length > 0, c.id + ' turi aprasyma');
        assert(shapes.indexOf(c.shape) !== -1, c.id + ' turi zinoma silueta (' + c.shape + ')');
        assert(c.palette && typeof c.palette === 'object', c.id + ' turi palete');
        ['hatBright', 'hatDark', 'bodyBright', 'bodyDark', 'skin', 'skinDark', 'hair'].forEach(k => {
            assert(/^#[0-9A-Fa-f]{6}$/.test(c.palette[k] || ''), c.id + ' palete turi ' + k);
        });
    });
});

test('galios yra unikalios', () => {
    const powers = Characters.LIST.map(c => c.power);
    assert(new Set(powers).size === powers.length, 'kiekvienas herojus turi savo galia');
});

test('nezinomas id grazina null', () => {
    assert(Characters.byId('nera') === null, 'null nezinomam');
    assert(Characters.byId(undefined) === null, 'null undefined');
});

console.log('\n' + '='.repeat(50));
console.log(passed + ' passed, ' + failed + ' failed');
if (failed) { failures.forEach(f => console.log('  - ' + f)); process.exit(1); }
