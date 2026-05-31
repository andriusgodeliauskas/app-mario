/**
 * Playwright smoke test for the expansion features (fire flower, fireballs,
 * missing-operand math). Prereq: HTTP server on :8765 serving project root.
 * Run: node test-expansion.js
 */
const { chromium } = require('playwright');
const BASE_URL = process.env.MARIO_URL || 'http://localhost:8765';

let passed = 0, failed = 0; const fails = [];
function ok(n) { passed++; console.log('  ✓ ' + n); }
function bad(n, e) { failed++; fails.push(n + ': ' + e); console.log('  ✗ ' + n + ' — ' + e); }

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
    const consoleErrors = [];
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', e => consoleErrors.push('PAGEERROR: ' + e.message));

    await page.goto(BASE_URL + '/index.html');
    await page.waitForFunction(() => window.game && window.game.textures && window.game.textures.exists('fireball'), null, { timeout: 15000 });
    ok('game boots');

    // Textures
    for (const t of ['fireflower', 'fireball']) {
        const has = await page.evaluate((k) => window.game.textures.exists(k), t);
        has ? ok('texture exists: ' + t) : bad('texture exists: ' + t, 'missing');
    }

    // Start level 1
    await page.evaluate(() => {
        window.game.scene.stop('MenuScene');
        window.game.scene.start('GameScene', { level: 1 });
    });
    await page.waitForFunction(() => {
        const s = window.game.scene.getScene('GameScene');
        return s && s.player && s.fireballs;
    }, null, { timeout: 10000 });
    ok('GameScene starts with fireballs group');

    // Fire Mario can shoot
    const shot = await page.evaluate(() => {
        const s = window.game.scene.getScene('GameScene');
        s.isBig = true; s.isFire = true; s.fireCooldown = 0;
        const before = s.fireballs.countActive(true);
        s.shootFireball();
        return { before, after: s.fireballs.countActive(true) };
    });
    (shot.after === shot.before + 1) ? ok('shootFireball spawns a fireball') : bad('shootFireball', JSON.stringify(shot));

    // Non-fire Mario cannot shoot
    const noShot = await page.evaluate(() => {
        const s = window.game.scene.getScene('GameScene');
        s.fireballs.clear(true, true);
        s.isFire = false; s.fireCooldown = 0;
        s.shootFireball();
        return s.fireballs.countActive(true);
    });
    (noShot === 0) ? ok('non-fire Mario cannot shoot') : bad('non-fire shoot', 'spawned ' + noShot);

    // loseOnePower: fire → big (keeps big, drops fire)
    const chain = await page.evaluate(() => {
        const s = window.game.scene.getScene('GameScene');
        s.isBig = true; s.isFire = true; s.isInvincible = false; s.starPower = false; s.isDead = false;
        s.loseOnePower({ source: 'enemy' });
        return { isFire: s.isFire, isBig: s.isBig };
    });
    (chain.isFire === false && chain.isBig === true) ? ok('fire→big power chain') : bad('power chain', JSON.stringify(chain));

    // Missing-operand math generation
    const mo = await page.evaluate(() => {
        const s = { add:{enabled:true,max:10}, subtract:{enabled:true,max:10},
                    multiply:{enabled:false,max:10}, divide:{enabled:false,max:10}, missingOperand:true };
        let found = null;
        for (let i = 0; i < 300 && !found; i++) {
            const p = window.MathGen.next(s, []);
            if (p.form === 'missing') found = p;
        }
        return found;
    });
    if (mo && mo.display && /x/.test(mo.display) && mo.options.indexOf(mo.answer) !== -1) {
        ok('missing-operand problem: ' + mo.display + '  (x=' + mo.answer + ')');
    } else { bad('missing-operand', JSON.stringify(mo)); }

    // Koopa shell: stomping a koopa turns it into a shell, not instant death
    const shell = await page.evaluate(() => {
        const s = window.game.scene.getScene('GameScene');
        const k = s.enemies.create(400, 300, 'koopa');
        k.enemyType = 'koopa';
        s.squishEnemy(k);
        return { isShell: !!k.isShell, active: k.active };
    });
    (shell.isShell && shell.active) ? ok('koopa stomp → kickable shell') : bad('koopa shell', JSON.stringify(shell));

    // 1-UP via 100 coins milestone (handled in update loop)
    const oneUp = await page.evaluate(() => {
        const s = window.game.scene.getScene('GameScene');
        s.coins = 100; s.lifeMilestone = 0; const before = s.lives;
        s.update(0, 16);
        return { gained: s.lives - before };
    });
    (oneUp.gained >= 1) ? ok('100 coins → +1 life') : bad('1up milestone', JSON.stringify(oneUp));

    // Methods exist
    const methods = await page.evaluate(() => {
        const s = window.game.scene.getScene('GameScene');
        return ['collectFireFlower','collectOneUp','updateMovingPlatforms','shootFireball','fireballHitEnemy']
            .every(m => typeof s[m] === 'function');
    });
    methods ? ok('all new GameScene methods present') : bad('methods', 'missing');

    // Bonus pipe injected into the level + enter → BonusRoomScene runs
    const pipeInfo = await page.evaluate(() => {
        const s = window.game.scene.getScene('GameScene');
        return { count: (s._enterPipes || []).length, hasEnter: typeof s.enterBonusPipe === 'function' };
    });
    (pipeInfo.count >= 1 && pipeInfo.hasEnter) ? ok('bonus pipe injected (' + pipeInfo.count + ')') : bad('bonus pipe', JSON.stringify(pipeInfo));

    const bonus = await page.evaluate(async () => {
        const s = window.game.scene.getScene('GameScene');
        s.enterBonusPipe();
        await new Promise(r => setTimeout(r, 700)); // wait descend tween + launch
        const br = window.game.scene.getScene('BonusRoomScene');
        return { active: window.game.scene.isActive('BonusRoomScene'),
                 hasPlayer: !!(br && br.player), gamePaused: window.game.scene.isPaused('GameScene') };
    });
    (bonus.active && bonus.hasPlayer) ? ok('bonus room launches with player') : bad('bonus room', JSON.stringify(bonus));

    const exited = await page.evaluate(async () => {
        const br = window.game.scene.getScene('BonusRoomScene');
        br.mathChallenge = null; // pretend math solved
        br.exitRoom();
        await new Promise(r => setTimeout(r, 500));
        return { bonusActive: window.game.scene.isActive('BonusRoomScene'),
                 gameActive: window.game.scene.isActive('GameScene') };
    });
    (!exited.bonusActive && exited.gameActive) ? ok('exit returns to level') : bad('exit room', JSON.stringify(exited));

    if (consoleErrors.length) bad('no console errors', consoleErrors.slice(0, 5).join(' | '));
    else ok('no console errors');

    await browser.close();
    console.log('\n==============================');
    console.log('PASSED: ' + passed + '   FAILED: ' + failed);
    console.log('==============================');
    if (failed > 0) { fails.forEach(f => console.log('  - ' + f)); process.exit(1); }
})();
