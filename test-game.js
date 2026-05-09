/**
 * Playwright test for Mario game — diagnose "Next Level" button issue
 * Run: npx playwright test test-game.js (or node test-game.js)
 */
const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({
        headless: false,
        args: ['--no-sandbox']
    });
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });

    console.log('Opening mario.godeliauskas.com...');
    await page.goto('https://mario.godeliauskas.com', { waitUntil: 'networkidle' });

    // Wait for Phaser to initialize
    await page.waitForTimeout(3000);

    // Take screenshot of menu
    await page.screenshot({ path: '/tmp/mario-01-menu.png' });
    console.log('Screenshot: /tmp/mario-01-menu.png');

    // Check for console errors
    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
        console.log(`[CONSOLE ${msg.type()}] ${msg.text()}`);
    });

    // Click first level card (WORLD 1-1, approximately center-left of the grid)
    console.log('Clicking WORLD 1-1...');
    await page.click('canvas', { position: { x: 205, y: 215 } });
    await page.waitForTimeout(2000);

    // Take screenshot of game
    await page.screenshot({ path: '/tmp/mario-02-game.png' });
    console.log('Screenshot: /tmp/mario-02-game.png');

    // Check Mario's position relative to ground
    console.log('Game loaded. Checking sprite positions...');

    // Try pressing right arrow to move Mario
    console.log('Moving Mario right...');
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(5000);
    await page.keyboard.up('ArrowRight');

    await page.screenshot({ path: '/tmp/mario-03-moved.png' });
    console.log('Screenshot: /tmp/mario-03-moved.png');

    // Check console for errors after gameplay
    if (errors.length > 0) {
        console.log('\n=== ERRORS FOUND ===');
        errors.forEach(e => console.log('  ERROR:', e));
    } else {
        console.log('\nNo console errors detected.');
    }

    console.log('\nTest complete. Browser stays open for manual inspection.');
    console.log('Press Ctrl+C to close.');

    // Keep browser open for manual inspection
    await new Promise(() => {});
})();
