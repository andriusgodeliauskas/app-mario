/**
 * MathSettings — localStorage I/O for math challenge configuration.
 *
 * Stores per-operation enabled flag and max range.
 * Defaults: only addition enabled, max=10 (B1 — safe first run for 6-7 year olds).
 */

(function () {
    var STORAGE_KEY = 'app-mario:math-settings:v1';

    var MAX_OPTIONS = {
        add:      [10, 20, 50, 100],
        subtract: [10, 20, 50, 100],
        multiply: [10, 20, 50],
        divide:   [10, 20, 50]
    };

    var DIFFICULTIES = ['easy', 'medium', 'harder', 'hard'];

    var DIFFICULTY_PROFILES = {
        easy: {
            lives: 3,
            enemyCount: 1.0,
            enemySpeed: 1.0,
            coyoteMs: 140,
            jumpBufferMs: 200,
            firePowerupRatio: 1.0,
            oneUp: 'guaranteed',
            invincibleMs: 2000,
            bossHpMul: 1.0,
            mathAnswerTimeMul: 1.0,
            distractorCloseness: 'far'
        },
        medium: {
            lives: 3,
            enemyCount: 1.3,
            enemySpeed: 1.15,
            coyoteMs: 120,
            jumpBufferMs: 180,
            firePowerupRatio: 0.7,
            oneUp: 'guaranteed',
            invincibleMs: 1800,
            bossHpMul: 1.2,
            mathAnswerTimeMul: 0.85,
            distractorCloseness: 'medium'
        },
        harder: {
            lives: 2,
            enemyCount: 1.6,
            enemySpeed: 1.3,
            coyoteMs: 100,
            jumpBufferMs: 150,
            firePowerupRatio: 0.5,
            oneUp: 'rare',
            invincibleMs: 1500,
            bossHpMul: 1.4,
            mathAnswerTimeMul: 0.7,
            distractorCloseness: 'close'
        },
        hard: {
            lives: 2,
            enemyCount: 2.0,
            enemySpeed: 1.45,
            coyoteMs: 80,
            jumpBufferMs: 120,
            firePowerupRatio: 0.3,
            oneUp: 'none',
            invincibleMs: 1200,
            bossHpMul: 1.6,
            mathAnswerTimeMul: 0.6,
            distractorCloseness: 'close'
        }
    };

    function defaults() {
        return {
            add:      { enabled: true,  max: 10 },
            subtract: { enabled: false, max: 10 },
            multiply: { enabled: false, max: 10 },
            divide:   { enabled: false, max: 10 },
            // "Find x" mode (e.g. 8 - x = 3). Off by default. Top-level boolean
            // so the per-op validation loop below ignores it.
            missingOperand: false,
            // Unlock every level in the menu (for testing/free play). Off by default.
            unlockAll: false,
            difficulty: 'easy'
        };
    }

    function validDifficulty(value) {
        return DIFFICULTIES.indexOf(value) !== -1 ? value : 'easy';
    }

    function isValidOp(op, settings) {
        if (!settings[op]) return false;
        if (typeof settings[op].enabled !== 'boolean') return false;
        if (typeof settings[op].max !== 'number') return false;
        if (MAX_OPTIONS[op].indexOf(settings[op].max) === -1) return false;
        return true;
    }

    function isAnyEnabled(settings) {
        return ['add', 'subtract', 'multiply', 'divide'].some(function (op) {
            return settings[op] && settings[op].enabled === true;
        });
    }

    function enabledOps(settings) {
        var ops = [];
        ['add', 'subtract', 'multiply', 'divide'].forEach(function (op) {
            if (settings[op] && settings[op].enabled) ops.push(op);
        });
        return ops;
    }

    function getStorage() {
        try {
            if (typeof localStorage !== 'undefined') return localStorage;
        } catch (e) { /* private mode etc. */ }
        return null;
    }

    function load() {
        var s = getStorage();
        if (!s) return defaults();
        try {
            var raw = s.getItem(STORAGE_KEY);
            if (!raw) return defaults();
            var parsed = JSON.parse(raw);
            // Validate structure; if anything's wrong, reset to defaults
            var valid = ['add', 'subtract', 'multiply', 'divide'].every(function (op) {
                return isValidOp(op, parsed);
            });
            if (!valid) return defaults();
            // Defensive: ensure at least one is enabled
            if (!isAnyEnabled(parsed)) parsed.add.enabled = true;
            // Coerce optional flags (absent in older saves → false)
            parsed.missingOperand = parsed.missingOperand === true;
            parsed.unlockAll = parsed.unlockAll === true;
            parsed.difficulty = validDifficulty(parsed.difficulty);
            return parsed;
        } catch (e) {
            return defaults();
        }
    }

    function save(settings) {
        // Validate + auto-fix: if all disabled, force add on
        var clone = JSON.parse(JSON.stringify(settings));
        if (!isAnyEnabled(clone)) clone.add.enabled = true;
        clone.difficulty = validDifficulty(clone.difficulty);

        var s = getStorage();
        if (!s) return clone;
        try {
            s.setItem(STORAGE_KEY, JSON.stringify(clone));
        } catch (e) { /* quota / private mode; settings still effective in memory */ }
        return clone;
    }

    function difficultyProfile(settings) {
        var difficulty = validDifficulty(settings && settings.difficulty);
        return JSON.parse(JSON.stringify(DIFFICULTY_PROFILES[difficulty]));
    }

    var MathSettings = {
        STORAGE_KEY: STORAGE_KEY,
        MAX_OPTIONS: MAX_OPTIONS,
        DIFFICULTIES: DIFFICULTIES,
        DIFFICULTY_PROFILES: DIFFICULTY_PROFILES,
        defaults: defaults,
        load: load,
        save: save,
        validDifficulty: validDifficulty,
        difficultyProfile: difficultyProfile,
        isAnyEnabled: isAnyEnabled,
        enabledOps: enabledOps
    };

    if (typeof window !== 'undefined') window.MathSettings = MathSettings;
    if (typeof module !== 'undefined' && module.exports) module.exports = MathSettings;
})();
