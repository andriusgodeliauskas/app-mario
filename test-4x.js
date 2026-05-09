const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: false, args: ['--no-sandbox'] });
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', err => { errors.push('PAGE ERROR: ' + err.message); console.log('PAGE ERROR:', err.message); });

    console.log('Opening game...');
    await page.goto('https://mario.godeliauskas.com', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/4x-01-menu.png' });
    console.log('Menu screenshot taken');

    // Start level 1
    await page.click('canvas', { position: { x: 205, y: 215 } });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/4x-02-game-start.png' });

    // Move right
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(4000);
    await page.keyboard.up('ArrowRight');
    await page.screenshot({ path: '/tmp/4x-03-gameplay.png' });
    console.log('Gameplay screenshot taken');

    if (errors.length > 0) {
        console.log('ERRORS:', errors);
    } else {
        console.log('No errors!');
    }
    await browser.close();
})();
