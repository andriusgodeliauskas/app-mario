/**
 * Debug: WinScene "Next Level" button — does it work?
 */
const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, args: ['--no-sandbox'] });
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });

    const errors = [];
    page.on('console', msg => {
        const text = `[${msg.type()}] ${msg.text()}`;
        console.log(text);
        if (msg.type() === 'error') errors.push(text);
    });
    page.on('pageerror', err => {
        console.log('[PAGE ERROR]', err.message);
        errors.push('[PAGE ERROR] ' + err.message);
    });

    console.log('=== Opening game ===');
    await page.goto('https://mario.godeliauskas.com', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Start level 1
    console.log('=== Starting Level 1 ===');
    await page.click('canvas', { position: { x: 205, y: 215 } });
    await page.waitForTimeout(2000);

    // Inject WinScene (simulate completing level 1)
    console.log('=== Injecting WinScene for level 1 ===');
    await page.evaluate(() => {
        var gs = game.scene.getScene('GameScene');
        if (gs && gs.scene) {
            gs.scene.stop('HUDScene');
            gs.scene.start('WinScene', { score: 5000, coins: 10, lives: 3, level: 1 });
            console.log('[TEST] WinScene started');
        } else {
            console.error('[TEST] GameScene not found!');
        }
    });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/debug-01-winscene.png' });

    // Check active scenes
    let scenes1 = await page.evaluate(() => {
        return game.scene.getScenes(true).map(s => s.sys.config.key);
    });
    console.log('Active scenes before click:', scenes1);

    // Check _transitioning flag
    let transFlag = await page.evaluate(() => {
        var ws = game.scene.getScene('WinScene');
        return ws ? ws._transitioning : 'WinScene not found';
    });
    console.log('_transitioning flag:', transFlag);

    // Click NEXT LEVEL button at (400, 504)
    console.log('=== Clicking NEXT LEVEL at (400, 504) ===');
    await page.click('canvas', { position: { x: 400, y: 504 } });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: '/tmp/debug-02-after-click.png' });

    // Check active scenes after click
    let scenes2 = await page.evaluate(() => {
        return game.scene.getScenes(true).map(s => s.sys.config.key);
    });
    console.log('Active scenes after click:', scenes2);

    // Check if GameScene loaded with level 2
    let levelInfo = await page.evaluate(() => {
        var gs = game.scene.getScene('GameScene');
        if (gs && gs.scene.isActive()) {
            return { active: true, level: gs.currentLevel };
        }
        return { active: false };
    });
    console.log('GameScene info:', levelInfo);

    // If still on WinScene, try clicking different positions
    if (scenes2.includes('WinScene')) {
        console.log('=== Still on WinScene! Trying different click positions ===');

        // Try clicking exactly on the button text area
        for (let y = 470; y <= 520; y += 10) {
            console.log(`Trying click at (400, ${y})...`);
            await page.click('canvas', { position: { x: 400, y: y } });
            await page.waitForTimeout(500);

            let scNow = await page.evaluate(() => {
                return game.scene.getScenes(true).map(s => s.sys.config.key);
            });
            if (!scNow.includes('WinScene')) {
                console.log(`SUCCESS at y=${y}! Scenes:`, scNow);
                break;
            }
        }
    }

    // Print errors summary
    if (errors.length > 0) {
        console.log('\n=== ERRORS ===');
        errors.forEach(e => console.log(e));
    } else {
        console.log('\nNo JS errors.');
    }

    await browser.close();
    console.log('=== Done ===');
})();
