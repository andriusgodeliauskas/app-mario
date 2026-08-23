/**
 * Unit tests for CharacterSettings (js/utils/characterSettings.js).
 * Run: node tests/unit/characterSettings.test.js
 */

// localStorage mock — must be set BEFORE requiring the module
const _store = {};
global.localStorage = {
    getItem: (k) => _store[k] !== undefined ? _store[k] : null,
    setItem: (k, v) => { _store[k] = String(v); },
    removeItem: (k) => { delete _store[k]; },
    clear: () => { Object.keys(_store).forEach(k => delete _store[k]); }
};

const CharacterSettings = require('../../js/utils/characterSettings.js');

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

test('be irasu grazina mario', () => {
    assert(CharacterSettings.selectedId() === 'mario', 'default mario');
});

test('issaugo ir atkuria', () => {
    CharacterSettings.save({ id: 'yoshi' });
    assert(CharacterSettings.selectedId() === 'yoshi', 'yoshi issaugotas');
    assert(CharacterSettings.load().id === 'yoshi', 'load grazina yoshi');
});

test('sugadintas JSON krenta i mario', () => {
    localStorage.setItem(CharacterSettings.STORAGE_KEY, '{neteisingas json');
    assert(CharacterSettings.selectedId() === 'mario', 'fallback mario');
});

test('nezaidziamas herojus krenta i mario', () => {
    CharacterSettings.save({ id: 'bowser' });
    assert(CharacterSettings.selectedId() === 'mario', 'bowser nezaidziamas -> mario');
});

test('tuscias objektas krenta i mario', () => {
    localStorage.setItem(CharacterSettings.STORAGE_KEY, '{}');
    assert(CharacterSettings.selectedId() === 'mario', 'be id -> mario');
});

test('save be argumentu nesugriauna irasu', () => {
    CharacterSettings.save({ id: 'toad' });
    CharacterSettings.save();
    assert(CharacterSettings.selectedId() === 'toad', 'liko toad');
});

test('veikia be localStorage', () => {
    const real = global.localStorage;
    global.localStorage = undefined;
    try {
        assert(CharacterSettings.selectedId() === 'mario', 'be storage -> mario');
        CharacterSettings.save({ id: 'peach' }); // neturi mesti klaidos
        assert(true, 'save be storage nemeta klaidos');
    } finally { global.localStorage = real; }
});

test('STORAGE_KEY yra versijuotas', () => {
    assert(CharacterSettings.STORAGE_KEY === 'app-mario:character:v1', 'raktas teisingas');
});

console.log('\n' + '='.repeat(50));
console.log(passed + ' passed, ' + failed + ' failed');
if (failed) { failures.forEach(f => console.log('  - ' + f)); process.exit(1); }
