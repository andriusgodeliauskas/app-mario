/**
 * Playwright smoke test for new levels 10-14.
 * Loads each level in the real game, validates its built tilemap with
 * window.validateLevelMap, and checks for console errors. Saves a screenshot
 * of each level for visual review.
 *
 * Prereq: HTTP server on :8765 serving the project root.
 * Run: node test-new-levels.js
 */
const { chromium } = require('playwright');
const BASE_URL = process.env.MARIO_URL || 'http://localhost:8765';

let passed = 0, failed = 0;
const fails = [];
function ok(n) { passed++; console.log('  ✓ ' + n); }
function bad(n, e) { failed++; fails.push(n + ': ' + e); console.log('  ✗ ' + n + ' — ' + e); }

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });

    const consoleErrors = [];
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', e => consoleErrors.push('PAGEERROR: ' + e.message));

    await page.goto(BASE_URL + '/index.html');
    // Wait for the game + sprite generation (BootScene) to finish.
    await page.waitForFunction(() => window.game && window.game.scene && window.game.textures.exists('crystal-deco'), null, { timeout: 15000 });
    ok('game boots and new decoration textures generated');

    for (const lvl of [10, 11, 12, 13, 14, 15, 16, 17, 18, 19]) {
        consoleErrors.length = 0;
        await page.evaluate((n) => {
            window.game.scene.stop('GameScene');
            window.game.scene.stop('MenuScene');
            window.game.scene.start('GameScene', { level: n });
        }, lvl);

        const built = await page.waitForFunction(() => {
            const s = window.game.scene.getScene('GameScene');
            return s && s.levelMap ? true : false;
        }, null, { timeout: 8000 }).then(() => true).catch(() => false);

        if (!built) { bad('level ' + lvl + ' builds', 'levelMap not set in time'); continue; }

        const res = await page.evaluate(() => {
            const s = window.game.scene.getScene('GameScene');
            return window.validateLevelMap(s.levelMap);
        });
        if (res.ok) ok('level ' + lvl + ' tilemap valid (reachable)');
        else bad('level ' + lvl + ' tilemap valid', JSON.stringify(res.errors));

        await page.waitForTimeout(600); // let one frame of decorations render
        await page.screenshot({ path: '/tmp/mario-level-' + lvl + '.png' });

        if (consoleErrors.length) bad('level ' + lvl + ' no console errors', consoleErrors.slice(0, 3).join(' | '));
        else ok('level ' + lvl + ' no console errors');
    }

    // Menu renders 14 levels without error
    consoleErrors.length = 0;
    await page.evaluate(() => { window.game.scene.stop('GameScene'); window.game.scene.start('MenuScene'); });
    await page.waitForTimeout(800);
    await page.screenshot({ path: '/tmp/mario-menu.png' });
    if (consoleErrors.length) bad('menu no console errors', consoleErrors.slice(0, 3).join(' | '));
    else ok('menu (14 levels) renders without console errors');

    await browser.close();
    console.log('\nPassed: ' + passed + ' | Failed: ' + failed);
    if (fails.length) { console.log('Failures:'); fails.forEach(f => console.log('  - ' + f)); process.exit(1); }
    console.log('All new-level smoke checks passed.');
})();
