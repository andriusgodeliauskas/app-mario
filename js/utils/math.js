/**
 * MathProblemGenerator — generates arithmetic problems for the math challenge feature.
 *
 * Pure logic, no Phaser dependencies. Safe operand rules:
 *   add:      a, b in [1..max], a + b <= max
 *   subtract: a, b in [1..max], a >= b (no negatives)
 *   multiply: a, b in [1..max], a * b <= max
 *   divide:   b in [2..max], answer in [1..max], a = b * answer (whole results only)
 */

(function () {
    var SYMBOLS = { add: '+', subtract: '-', multiply: 'x', divide: '/' };

    function randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
        }
        return a;
    }

    function key(op, a, b) { return op + ':' + a + ':' + b; }

    function generateOperands(op, max) {
        var a, b, attempts = 0;
        while (attempts < 50) {
            attempts++;
            if (op === 'add') {
                a = randInt(1, Math.max(1, max - 1));
                b = randInt(1, max - a);
                if (b >= 1 && a + b <= max) return { a: a, b: b, answer: a + b };
            } else if (op === 'subtract') {
                a = randInt(1, max);
                b = randInt(1, a);
                return { a: a, b: b, answer: a - b };
            } else if (op === 'multiply') {
                a = randInt(1, max);
                b = randInt(1, Math.floor(max / a));
                if (b >= 1 && a * b <= max) return { a: a, b: b, answer: a * b };
            } else if (op === 'divide') {
                b = randInt(2, Math.max(2, Math.min(max, 10)));
                var answer = randInt(1, max);
                a = b * answer;
                if (a <= max * 2) return { a: a, b: b, answer: answer };
            }
        }
        // Fallback if we somehow can't generate (e.g. max=1 for multiply)
        return { a: 1, b: 1, answer: op === 'subtract' ? 0 : (op === 'divide' ? 1 : op === 'multiply' ? 1 : 2) };
    }

    function generateDistractors(op, a, b, answer, max) {
        var d1, d2;
        // Ceiling: stay close to max for add/subtract; allow up to max*2 for ×/÷
        // (since multiply confusion like 3×3 → 6 needs room when answer=9)
        var ceiling = (op === 'add' || op === 'subtract') ? max : max * 2;

        function valid(n) {
            return n >= 0 && n <= ceiling && n !== answer;
        }

        // d1: typical off-by-one or off-by-two error
        var candidates = [answer + 1, answer - 1, answer + 2, answer - 2];
        d1 = null;
        for (var i = 0; i < candidates.length; i++) {
            if (valid(candidates[i])) { d1 = candidates[i]; break; }
        }
        if (d1 === null) d1 = (answer === 0 ? 1 : 0);

        // d2: operation confusion (kids mix + with × etc.)
        var d2Candidate;
        if (op === 'add')          d2Candidate = Math.abs(a - b);
        else if (op === 'subtract') d2Candidate = a + b;
        else if (op === 'multiply') d2Candidate = a + b;
        else                        d2Candidate = Math.abs(a - b); // divide

        if (valid(d2Candidate) && d2Candidate !== d1) {
            d2 = d2Candidate;
        } else {
            // Pick first valid integer != answer, != d1
            d2 = null;
            for (var n = 0; n <= ceiling; n++) {
                if (n !== answer && n !== d1) { d2 = n; break; }
            }
            if (d2 === null) d2 = answer + 3;
        }

        return [d1, d2];
    }

    var MathGen = {
        SYMBOLS: SYMBOLS,
        _key: key,

        /**
         * Generate the next math problem.
         * @param {Object} settings - MathSettings object
         * @param {Array<string>} history - recent problem keys (last ~8)
         * @returns {Object} problem
         */
        next: function (settings, history) {
            history = history || [];
            var enabled = [];
            if (settings.add && settings.add.enabled)           enabled.push('add');
            if (settings.subtract && settings.subtract.enabled) enabled.push('subtract');
            if (settings.multiply && settings.multiply.enabled) enabled.push('multiply');
            if (settings.divide && settings.divide.enabled)     enabled.push('divide');

            if (enabled.length === 0) {
                throw new Error('No operations enabled');
            }

            var problem = null;
            for (var attempt = 0; attempt < 10; attempt++) {
                var op = enabled[Math.floor(Math.random() * enabled.length)];
                var max = settings[op].max;
                var ops = generateOperands(op, max);
                var k = key(op, ops.a, ops.b);

                if (history.indexOf(k) === -1) {
                    problem = { op: op, a: ops.a, b: ops.b, answer: ops.answer, max: max };
                    break;
                }
                if (attempt === 9) {
                    // Give up on uniqueness; ship anyway
                    problem = { op: op, a: ops.a, b: ops.b, answer: ops.answer, max: max };
                }
            }

            var distractors = generateDistractors(problem.op, problem.a, problem.b, problem.answer, problem.max);
            var options = shuffle([problem.answer, distractors[0], distractors[1]]);

            return {
                operation: problem.op,
                a: problem.a,
                b: problem.b,
                symbol: SYMBOLS[problem.op],
                answer: problem.answer,
                distractors: distractors,
                options: options,
                key: key(problem.op, problem.a, problem.b)
            };
        }
    };

    // Export for browser + Node (tests)
    if (typeof window !== 'undefined') window.MathGen = MathGen;
    if (typeof module !== 'undefined' && module.exports) module.exports = MathGen;
})();
