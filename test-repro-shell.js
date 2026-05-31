/**
 * Reproduction: stomping a green Koopa makes a shell; kicking it (with another
 * enemy present) should NOT throw / freeze the game. Run with HTTP server on :8765.
 */
const { chromium } = require('playwright');
const BASE_URL = process.env.MARIO_URL || 'http://localhost:8765';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

    await page.goto(BASE_URL + '/index.html');
    await page.waitForFunction(() => window.game && window.game.textures && window.game.textures.exists('koopa'), null, { timeout: 15000 });

    await page.evaluate(() => {
        window.game.scene.stop('MenuScene');
        window.game.scene.start('GameScene', { level: 1 });
    });
    await page.waitForFunction(() => {
        const s = window.game.scene.getScene('GameScene');
        return s && s.player && s.enemies;
    }, null, { timeout: 10000 });

    // Real scenario: stomp a koopa → shell, kick it, run the enemy loop with a
    // second enemy present. update() must NOT throw, and the moving shell must
    // mow down the overlapping enemy.
    const loopResult = await page.evaluate(() => {
        const s = window.game.scene.getScene('GameScene');
        s.enemies.clear(true, true);
        const shell = s.enemies.create(400, 500, 'koopa');
        shell.enemyType = 'koopa';
        s.squishEnemy(shell);                 // → stationary shell
        shell.shellMoving = true; shell.shellDir = 1;
        if (shell.body) shell.body.setVelocityX(280);
        const goomba = s.enemies.create(405, 500, 'goomba'); // overlapping
        goomba.enemyType = 'goomba';
        try {
            s.update(0, 16);
            return { ok: true, goombaSquished: !!goomba.isSquished };
        } catch (e) {
            return { ok: false, err: e.message };
        }
    });
    console.log('  enemy-loop update →', JSON.stringify(loopResult));

    // Full kick flow via handleEnemyCollision (stationary shell → moving)
    const kickResult = await page.evaluate(() => {
        const s = window.game.scene.getScene('GameScene');
        s.enemies.clear(true, true);
        const k = s.enemies.create(450, 500, 'koopa');
        k.enemyType = 'koopa';
        s.squishEnemy(k);                     // stationary shell
        const wasStationary = k.isShell && !k.shellMoving;
        s.player.x = 420;                     // player to the left → kick right
        s.handleEnemyCollision(s.player, k);  // kick
        let threw = false;
        try { s.update(0, 16); s.update(0, 16); } catch (e) { threw = true; }
        return { wasStationary, nowMoving: !!k.shellMoving, threw };
    });
    console.log('  kick flow →', JSON.stringify(kickResult));

    console.log('  console/page errors:', errors.length ? errors.slice(0,3).join(' | ') : 'none');
    await browser.close();

    const ok = loopResult.ok && loopResult.goombaSquished &&
               kickResult.wasStationary && kickResult.nowMoving && !kickResult.threw &&
               errors.length === 0;
    console.log(ok ? '\nRESULT: OK (no freeze, shell works)' : '\nRESULT: BUG STILL PRESENT');
    process.exit(ok ? 0 : 1);
})();
