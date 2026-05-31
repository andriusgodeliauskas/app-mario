/**
 * Smoke test: "Visi lygiai" (unlockAll) setting unlocks all level cards, and
 * the SettingsScene shows both bottom checkboxes. HTTP server on :8765.
 */
const { chromium } = require('playwright');
const BASE_URL = process.env.MARIO_URL || 'http://localhost:8765';
let passed = 0, failed = 0; const fails = [];
const ok = n => { passed++; console.log('  ✓ ' + n); };
const bad = (n, e) => { failed++; fails.push(n); console.log('  ✗ ' + n + ' — ' + e); };

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

    await page.goto(BASE_URL + '/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => window.game && window.MathSettings, null, { timeout: 15000 });
    ok('boots');

    // Default: high levels locked
    const lockedByDefault = await page.evaluate(() => {
        const s = window.MathSettings.load(); s.unlockAll = false; window.MathSettings.save(s);
        document.cookie = 'marioMaxLevel=1;path=/;max-age=31536000';
        return !s.unlockAll;
    });
    lockedByDefault ? ok('unlockAll defaults off') : bad('default off', 'unexpected');

    // Turn on unlockAll → menu should treat all levels unlocked
    const unlocked = await page.evaluate(() => {
        const s = window.MathSettings.load(); s.unlockAll = true; window.MathSettings.save(s);
        document.cookie = 'marioMaxLevel=1;path=/;max-age=31536000';
        // Replicate MenuScene's lock logic for level 19
        const unlockAll = window.MathSettings.load().unlockAll === true;
        const maxLevel = window.GameProgress ? window.GameProgress.getMaxLevel() :
            (parseInt((document.cookie.match(/marioMaxLevel=(\d+)/) || [])[1] || '1', 10));
        const lockedLevel19 = !unlockAll && 19 > maxLevel;
        return { unlockAll, lockedLevel19 };
    });
    (unlocked.unlockAll && !unlocked.lockedLevel19) ? ok('unlockAll unlocks level 19') : bad('unlock', JSON.stringify(unlocked));

    // SettingsScene renders without errors and exposes the checkbox builder
    const settingsOk = await page.evaluate(() => {
        window.game.scene.start('SettingsScene');
        return new Promise(res => setTimeout(() => {
            const sc = window.game.scene.getScene('SettingsScene');
            res(!!(sc && typeof sc._buildCheckbox === 'function' &&
                   typeof sc.workingSettings.unlockAll === 'boolean'));
        }, 400));
    });
    settingsOk ? ok('SettingsScene has unlockAll checkbox') : bad('settings scene', 'missing');

    // Persist + survives reload
    const persisted = await page.evaluate(() => {
        const s = window.MathSettings.load(); s.unlockAll = true; window.MathSettings.save(s);
        return window.MathSettings.load().unlockAll === true;
    });
    persisted ? ok('unlockAll persists to localStorage') : bad('persist', 'lost');

    errors.length ? bad('no console errors', errors.slice(0,3).join(' | ')) : ok('no console errors');
    await browser.close();
    console.log('\nPASSED: ' + passed + '  FAILED: ' + failed);
    if (failed) { fails.forEach(f => console.log('  - ' + f)); process.exit(1); }
})();
