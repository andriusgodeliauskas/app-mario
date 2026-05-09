/**
 * Test "Next Level" button on WinScene
 */
const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({
        headless: false,
        args: ['--no-sandbox']
    });
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });

    const logs = [];
    page.on('console', msg => {
        const text = `[${msg.type()}] ${msg.text()}`;
        logs.push(text);
        console.log(text);
    });
    page.on('pageerror', err => {
        console.log('[PAGE ERROR]', err.message);
        logs.push('[PAGE ERROR] ' + err.message);
    });

    console.log('=== Opening mario.godeliauskas.com ===');
    await page.goto('https://mario.godeliauskas.com', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Start level 1
    console.log('\n=== Starting Level 1 ===');
    await page.click('canvas', { position: { x: 205, y: 215 } });
    await page.waitForTimeout(2000);

    // Inject: go to WinScene using correct Phaser 3 API
    console.log('\n=== Injecting WinScene ===');
    await page.evaluate(() => {
        var gameScene = game.scene.getScene('GameScene');
        if (gameScene && gameScene.scene) {
            // Stop HUD first
            gameScene.scene.stop('HUDScene');
            // Start WinScene from GameScene context
            gameScene.scene.start('WinScene', {
                score: 12345,
                coins: 7,
                lives: 3,
                level: 1
            });
            console.log('[TEST] WinScene started successfully');
        } else {
            console.error('[TEST] GameScene not found');
        }
    });

    await page.waitForTimeout(4000);
    await page.screenshot({ path: '/tmp/mario-next-01-winscene.png' });
    console.log('Screenshot: WinScene');

    // Try clicking "NEXT LEVEL" button (center, near bottom)
    console.log('\n=== Clicking NEXT LEVEL button at (400, 504) ===');
    await page.click('canvas', { position: { x: 400, y: 504 } });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: '/tmp/mario-next-02-after-click.png' });
    console.log('Screenshot: After click');

    // Check what scene is active
    const activeScenes = await page.evaluate(() => {
        var scenes = game.scene.getScenes(true);
        return scenes.map(s => s.sys.config.key + ' (active=' + s.scene.isActive() + ')');
    });
    console.log('\n=== Active scenes after click ===');
    activeScenes.forEach(s => console.log('  ', s));

    // If still on WinScene, try Enter key
    console.log('\n=== Pressing Space key ===');
    await page.keyboard.press('Space');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: '/tmp/mario-next-03-after-space.png' });

    const activeScenes2 = await page.evaluate(() => {
        var scenes = game.scene.getScenes(true);
        return scenes.map(s => s.sys.config.key + ' (active=' + s.scene.isActive() + ')');
    });
    console.log('\n=== Active scenes after Space ===');
    activeScenes2.forEach(s => console.log('  ', s));

    // Print errors
    const errorMsgs = logs.filter(l => l.includes('error') || l.includes('ERROR') || l.includes('Error') || l.includes('PAGE'));
    if (errorMsgs.length > 0) {
        console.log('\n=== ERRORS ===');
        errorMsgs.forEach(e => console.log('  ', e));
    }

    await browser.close();
    console.log('\n=== Test complete ===');
})();
