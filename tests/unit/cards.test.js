/**
 * Unit tests for the collectible card registry (js/data/cards.js) and the
 * unlock persistence (js/utils/cardCollection.js).
 *
 * Run: node tests/unit/cards.test.js
 */
const _store = {};
global.localStorage = {
    getItem: (k) => _store[k] !== undefined ? _store[k] : null,
    setItem: (k, v) => { _store[k] = String(v); },
    removeItem: (k) => { delete _store[k]; },
    clear: () => { Object.keys(_store).forEach(k => delete _store[k]); }
};

const Characters = require('../../js/data/characters.js');
const Cards = require('../../js/data/cards.js');
const CardCollection = require('../../js/utils/cardCollection.js');

let passed = 0, failed = 0;
const failures = [];
function assert(cond, msg) {
    if (cond) { passed++; }
    else { failed++; failures.push(msg); console.error('  FAIL: ' + msg); }
}
function test(name, fn) {
    console.log('\n→ ' + name);
    localStorage.clear();
    try { fn(); } catch (e) { failed++; failures.push(name + ' threw: ' + e.message); console.error('  THREW: ' + e.message); }
}

test('13 korteliu: 8 herojai + 5 blogieciai', () => {
    assert(Cards.LIST.length === 13, 'yra 13, rasta ' + Cards.LIST.length);
    assert(Cards.TOTAL === 13, 'TOTAL = 13');
    const ids = Cards.LIST.map(c => c.id);
    assert(new Set(ids).size === 13, 'id unikalus');
    Characters.PLAYABLE_IDS.forEach(id => {
        assert(ids.indexOf(id) !== -1, 'yra herojaus kortele: ' + id);
    });
    ['wario', 'waluigi', 'boo', 'bowser-jr', 'dk'].forEach(id => {
        assert(ids.indexOf(id) !== -1, 'yra blogiecio kortele: ' + id);
    });
});

test('heroju aprasymai imami is Characters, ne perrasyti ranka', () => {
    Characters.LIST.forEach(ch => {
        const card = Cards.byId(ch.id);
        assert(card !== null, ch.id + ' turi kortele');
        assert(card.description === ch.description, ch.id + ' aprasymas sutampa su registru');
        assert(card.name === ch.name, ch.id + ' vardas sutampa su registru');
    });
});

test('kiekviena kortele turi savo lygi', () => {
    const levels = Cards.LIST.map(c => c.level);
    assert(new Set(levels).size === levels.length, 'lygiai nesikartoja');
    levels.forEach(l => assert(l >= 1 && l <= 42, 'lygis ' + l + ' egzistuoja (1-42)'));
});

test('forLevel grazina tos vietos kortele', () => {
    Cards.LIST.forEach(c => {
        const found = Cards.forLevel(c.level);
        assert(found && found.id === c.id, 'lygis ' + c.level + ' -> ' + c.id);
    });
    assert(Cards.forLevel(999) === null, 'nezinomas lygis -> null');
});

test('kiekviena kortele turi tekstura ir apibudinima', () => {
    Cards.LIST.forEach(c => {
        assert(typeof c.texture === 'string' && c.texture.length > 0, c.id + ' turi tekstura');
        assert(typeof c.frame === 'number', c.id + ' turi kadra');
        assert(typeof c.description === 'string' && c.description.length > 20, c.id + ' turi prasminga aprasyma');
        assert(typeof c.lt === 'string' && c.lt.length > 0, c.id + ' turi LT varda');
    });
});

test('pradzioje nieko neatrakinta', () => {
    assert(CardCollection.unlockedCount() === 0, 'skaitiklis 0');
    assert(CardCollection.isUnlocked('yoshi') === false, 'yoshi uzrakintas');
});

test('atrakinimas issaugomas ir nesidubliuoja', () => {
    CardCollection.unlock('yoshi');
    CardCollection.unlock('yoshi');
    assert(CardCollection.isUnlocked('yoshi') === true, 'yoshi atrakintas');
    assert(CardCollection.unlockedCount() === 1, 'be dubliu, rasta ' + CardCollection.unlockedCount());
});

test('nezinomas id neatrakinamas', () => {
    CardCollection.unlock('nesamone');
    assert(CardCollection.unlockedCount() === 0, 'sarasas svarus');
});

test('sugadintas irasas nesugriauna kolekcijos', () => {
    localStorage.setItem(CardCollection.STORAGE_KEY, '{blogas json');
    assert(CardCollection.unlockedCount() === 0, 'fallback i tuscia');
    CardCollection.unlock('boo');
    assert(CardCollection.isUnlocked('boo') === true, 'po fallback vis tiek veikia');
});

test('veikia be localStorage', () => {
    const real = global.localStorage;
    global.localStorage = undefined;
    try {
        assert(CardCollection.unlockedCount() === 0, 'be storage 0');
        CardCollection.unlock('dk');
        assert(true, 'unlock be storage nemeta klaidos');
    } finally { global.localStorage = real; }
});

console.log('\n' + '='.repeat(50));
console.log(passed + ' passed, ' + failed + ' failed');
if (failed) { failures.forEach(f => console.log('  - ' + f)); process.exit(1); }
