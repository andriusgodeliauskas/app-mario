/**
 * Unit tests for MathSettings (settings.js).
 * Run: node tests/unit/settings.test.js
 */

// localStorage mock — must be set BEFORE requiring settings.js
const _store = {};
global.localStorage = {
    getItem: (k) => _store[k] !== undefined ? _store[k] : null,
    setItem: (k, v) => { _store[k] = String(v); },
    removeItem: (k) => { delete _store[k]; },
    clear: () => { Object.keys(_store).forEach(k => delete _store[k]); }
};

const MathSettings = require('../../js/utils/settings.js');

let passed = 0, failed = 0;
const failures = [];

function assert(cond, msg) {
    if (cond) passed++;
    else { failed++; failures.push(msg); console.error('  FAIL: ' + msg); }
}

function test(name, fn) {
    console.log('\n→ ' + name);
    try { fn(); } catch (e) { failed++; failures.push(name + ' threw: ' + e.message); console.error('  THREW: ' + e.message); }
}

// -------- Tests --------

test('defaults: only add enabled, all max=10', () => {
    const d = MathSettings.defaults();
    assert(d.add.enabled === true, 'add enabled');
    assert(d.subtract.enabled === false, 'subtract disabled');
    assert(d.multiply.enabled === false, 'multiply disabled');
    assert(d.divide.enabled === false, 'divide disabled');
    ['add', 'subtract', 'multiply', 'divide'].forEach(op => {
        assert(d[op].max === 10, op + ' max=10');
    });
});

test('load() with empty storage returns defaults', () => {
    localStorage.clear();
    const s = MathSettings.load();
    assert(s.add.enabled === true && s.subtract.enabled === false, 'returned defaults');
});

test('save() then load() round-trips', () => {
    localStorage.clear();
    const input = {
        add:      { enabled: true,  max: 20 },
        subtract: { enabled: true,  max: 50 },
        multiply: { enabled: false, max: 10 },
        divide:   { enabled: true,  max: 50 }
    };
    MathSettings.save(input);
    const loaded = MathSettings.load();
    assert(loaded.add.max === 20, 'add.max=20');
    assert(loaded.subtract.enabled === true, 'subtract enabled');
    assert(loaded.subtract.max === 50, 'subtract.max=50');
    assert(loaded.multiply.enabled === false, 'multiply disabled');
    assert(loaded.divide.max === 50, 'divide.max=50');
});

test('save() with all disabled auto-enables add', () => {
    localStorage.clear();
    const input = {
        add:      { enabled: false, max: 10 },
        subtract: { enabled: false, max: 10 },
        multiply: { enabled: false, max: 10 },
        divide:   { enabled: false, max: 10 }
    };
    const result = MathSettings.save(input);
    assert(result.add.enabled === true, 'save returned with add auto-enabled');
    const loaded = MathSettings.load();
    assert(loaded.add.enabled === true, 'loaded has add enabled');
});

test('load() with corrupt JSON returns defaults', () => {
    localStorage.clear();
    localStorage.setItem('app-mario:math-settings:v1', '{not valid json');
    const s = MathSettings.load();
    assert(s.add.enabled === true && s.subtract.enabled === false, 'fallback to defaults');
});

test('load() with invalid max value returns defaults', () => {
    localStorage.clear();
    localStorage.setItem('app-mario:math-settings:v1', JSON.stringify({
        add: { enabled: true, max: 999 }, // 999 not in MAX_OPTIONS
        subtract: { enabled: false, max: 10 },
        multiply: { enabled: false, max: 10 },
        divide: { enabled: false, max: 10 }
    }));
    const s = MathSettings.load();
    assert(s.add.max === 10, 'invalid max → default');
});

test('load() with missing op returns defaults', () => {
    localStorage.clear();
    localStorage.setItem('app-mario:math-settings:v1', JSON.stringify({
        add: { enabled: true, max: 10 }
        // missing other ops
    }));
    const s = MathSettings.load();
    assert(s.subtract !== undefined, 'subtract present');
    assert(s.subtract.enabled === false, 'subtract default');
});

test('isAnyEnabled', () => {
    assert(MathSettings.isAnyEnabled(MathSettings.defaults()) === true, 'defaults has add enabled');
    const allOff = {
        add: { enabled: false, max: 10 }, subtract: { enabled: false, max: 10 },
        multiply: { enabled: false, max: 10 }, divide: { enabled: false, max: 10 }
    };
    assert(MathSettings.isAnyEnabled(allOff) === false, 'all off detected');
});

test('enabledOps returns array of enabled op names', () => {
    const s = {
        add: { enabled: true, max: 10 }, subtract: { enabled: false, max: 10 },
        multiply: { enabled: true, max: 20 }, divide: { enabled: false, max: 10 }
    };
    const ops = MathSettings.enabledOps(s);
    assert(ops.length === 2 && ops.indexOf('add') !== -1 && ops.indexOf('multiply') !== -1,
           'enabledOps returns [add, multiply]');
});

test('MAX_OPTIONS exposed for UI', () => {
    assert(Array.isArray(MathSettings.MAX_OPTIONS.add), 'add max options array');
    assert(MathSettings.MAX_OPTIONS.add.indexOf(100) !== -1, 'add includes 100');
    assert(MathSettings.MAX_OPTIONS.multiply.indexOf(100) === -1, 'multiply does not include 100');
});

// =========================================================
console.log('\n========================================');
console.log('PASSED: ' + passed + '   FAILED: ' + failed);
console.log('========================================');
if (failed > 0) {
    console.error('\nFailures:');
    failures.slice(0, 20).forEach(f => console.error('  - ' + f));
    process.exit(1);
}
