/**
 * Unit tests for MathProblemGenerator (math.js).
 * Run: node tests/unit/math.test.js
 */

const MathGen = require('../../js/utils/math.js');

let passed = 0, failed = 0;
const failures = [];

function assert(cond, msg) {
    if (cond) {
        passed++;
    } else {
        failed++;
        failures.push(msg);
        console.error('  FAIL: ' + msg);
    }
}

function test(name, fn) {
    console.log('\n→ ' + name);
    try { fn(); } catch (e) { failed++; failures.push(name + ' threw: ' + e.message); console.error('  THREW: ' + e.message); }
}

// -------- Helpers --------
function settingsOnly(op, max) {
    const s = { add: { enabled: false, max: 10 }, subtract: { enabled: false, max: 10 },
                multiply: { enabled: false, max: 10 }, divide: { enabled: false, max: 10 } };
    s[op].enabled = true;
    s[op].max = max;
    return s;
}

// =========================================================
test('add: 1000 generations stay within bounds', () => {
    const s = settingsOnly('add', 10);
    for (let i = 0; i < 1000; i++) {
        const p = MathGen.next(s, []);
        assert(p.operation === 'add', 'op is add');
        assert(p.a >= 1 && p.a <= 10, 'a in [1,10] but got ' + p.a);
        assert(p.b >= 1 && p.b <= 10, 'b in [1,10] but got ' + p.b);
        assert(p.a + p.b <= 10, 'sum ≤ 10 but got ' + (p.a + p.b));
        assert(p.answer === p.a + p.b, 'answer correct');
    }
});

test('subtract: 1000 generations a >= b, answer >= 0', () => {
    const s = settingsOnly('subtract', 20);
    for (let i = 0; i < 1000; i++) {
        const p = MathGen.next(s, []);
        assert(p.a >= p.b, 'a ≥ b but got ' + p.a + '<' + p.b);
        assert(p.answer >= 0, 'answer non-negative but got ' + p.answer);
        assert(p.answer === p.a - p.b, 'answer correct');
    }
});

test('multiply: a * b never exceeds max', () => {
    const s = settingsOnly('multiply', 50);
    for (let i = 0; i < 1000; i++) {
        const p = MathGen.next(s, []);
        assert(p.a >= 1 && p.b >= 1, 'operands ≥ 1');
        assert(p.a * p.b <= 50, 'product ≤ 50 but got ' + (p.a * p.b));
        assert(p.answer === p.a * p.b, 'answer correct');
    }
});

test('divide: always whole number, a within bounds', () => {
    const s = settingsOnly('divide', 10);
    for (let i = 0; i < 1000; i++) {
        const p = MathGen.next(s, []);
        assert(p.b >= 2, 'b ≥ 2');
        assert(p.a % p.b === 0, 'a % b === 0 but ' + p.a + '%' + p.b);
        assert(p.a <= 20, 'a ≤ 20 but got ' + p.a);
        assert(p.answer === p.a / p.b, 'answer correct');
    }
});

test('options always length 3, contains answer, all unique', () => {
    const s = settingsOnly('add', 20);
    for (let i = 0; i < 500; i++) {
        const p = MathGen.next(s, []);
        assert(p.options.length === 3, 'options length 3');
        assert(p.options.indexOf(p.answer) !== -1, 'options contains answer');
        const set = new Set(p.options);
        assert(set.size === 3, 'options unique: ' + JSON.stringify(p.options) + ' answer=' + p.answer);
    }
});

test('options never contain negatives', () => {
    const s = settingsOnly('subtract', 10);
    for (let i = 0; i < 500; i++) {
        const p = MathGen.next(s, []);
        for (let j = 0; j < p.options.length; j++) {
            assert(p.options[j] >= 0, 'option ≥ 0 but got ' + p.options[j]);
        }
    }
});

test('mixed operations: 4 enabled give roughly equal distribution', () => {
    const s = { add: { enabled: true, max: 10 }, subtract: { enabled: true, max: 10 },
                multiply: { enabled: true, max: 10 }, divide: { enabled: true, max: 10 } };
    const counts = { add: 0, subtract: 0, multiply: 0, divide: 0 };
    for (let i = 0; i < 4000; i++) {
        const p = MathGen.next(s, []);
        counts[p.operation]++;
    }
    // Each should be ~1000, allow 20% variance
    Object.keys(counts).forEach(op => {
        assert(counts[op] > 700 && counts[op] < 1300,
               op + ' count ' + counts[op] + ' should be ~1000 (700..1300)');
    });
});

test('anti-repeat: history pushed key is not repeated immediately (90% of time)', () => {
    const s = settingsOnly('add', 20);
    let repeats = 0;
    for (let i = 0; i < 200; i++) {
        const p1 = MathGen.next(s, []);
        const history = [p1.key];
        const p2 = MathGen.next(s, history);
        if (p2.key === p1.key) repeats++;
    }
    assert(repeats < 30, 'anti-repeat should give <15% repeats but got ' + repeats + '/200');
});

test('throws when no operations enabled', () => {
    const s = { add: { enabled: false, max: 10 }, subtract: { enabled: false, max: 10 },
                multiply: { enabled: false, max: 10 }, divide: { enabled: false, max: 10 } };
    let threw = false;
    try { MathGen.next(s, []); } catch (e) { threw = true; }
    assert(threw, 'should throw with no ops enabled');
});

test('only one op enabled: always uses it', () => {
    const s = settingsOnly('multiply', 20);
    for (let i = 0; i < 100; i++) {
        const p = MathGen.next(s, []);
        assert(p.operation === 'multiply', 'always multiply');
    }
});

test('symbol matches operation', () => {
    const ops = ['add', 'subtract', 'multiply', 'divide'];
    const expected = { add: '+', subtract: '-', multiply: 'x', divide: '/' };
    ops.forEach(op => {
        const s = settingsOnly(op, 20);
        const p = MathGen.next(s, []);
        assert(p.symbol === expected[op], op + ' symbol is ' + expected[op] + ' but got ' + p.symbol);
    });
});

// =========================================================
// MISSING-OPERAND ("find x") MODE
// =========================================================
function settingsMissing(op, max) {
    const s = settingsOnly(op, max);
    s.missingOperand = true;
    return s;
}

test('missing-operand: produces missing form when enabled (eventually)', () => {
    const s = settingsMissing('subtract', 10);
    let sawMissing = false, sawStandard = false;
    for (let i = 0; i < 500; i++) {
        const p = MathGen.next(s, []);
        if (p.form === 'missing') sawMissing = true;
        if (p.form === 'standard') sawStandard = true;
    }
    assert(sawMissing, 'at least one missing-operand problem generated');
    assert(sawStandard, 'standard problems still appear (~60%)');
});

test('missing-operand: never generated when flag off', () => {
    const s = settingsOnly('subtract', 10); // no missingOperand flag
    for (let i = 0; i < 300; i++) {
        const p = MathGen.next(s, []);
        assert(p.form !== 'missing', 'no missing form when flag absent');
    }
});

test('missing-operand: x (answer) is among options and satisfies the equation', () => {
    const ops = ['add', 'subtract', 'multiply', 'divide'];
    ops.forEach(op => {
        const s = settingsMissing(op, 20);
        for (let i = 0; i < 400; i++) {
            const p = MathGen.next(s, []);
            if (p.form !== 'missing') continue;
            assert(p.options.indexOf(p.answer) !== -1, op + ': answer among options');
            assert(p.options.length === 3, op + ': exactly 3 options');
            assert(p.answer >= 0, op + ': x is non-negative (' + p.answer + ')');
            assert(p.options.filter(o => o === p.answer).length === 1, op + ': exactly one correct option');
            // Plug x back into the hidden slot — equation must hold
            const a = p.hideA ? p.answer : p.a;
            const b = p.hideA ? p.b : p.answer;
            let res;
            if (op === 'add') res = a + b;
            else if (op === 'subtract') res = a - b;
            else if (op === 'multiply') res = a * b;
            else res = a / b;
            assert(res === p.result, op + ': x satisfies ' + a + p.symbol + b + '=' + res + ' want ' + p.result);
        }
    });
});

test('missing-operand: display contains x and a result; solvedText fully solved', () => {
    const s = settingsMissing('add', 20);
    for (let i = 0; i < 200; i++) {
        const p = MathGen.next(s, []);
        if (p.form !== 'missing') continue;
        assert(/x/.test(p.display), 'display contains x: ' + p.display);
        assert(/= \d+$/.test(p.display), 'display ends with = <result>: ' + p.display);
        assert(/= \d+$/.test(p.solvedText), 'solvedText solved: ' + p.solvedText);
    }
});

test('standard form: display and solvedText present', () => {
    const s = settingsOnly('add', 10);
    const p = MathGen.next(s, []);
    assert(p.form === 'standard', 'form is standard');
    assert(/= \?$/.test(p.display), 'standard display ends with = ?: ' + p.display);
    assert(/= \d+$/.test(p.solvedText), 'standard solvedText solved: ' + p.solvedText);
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
