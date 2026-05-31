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

    await page.goto(BASE_URL + '/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
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

    // Trigger the descend, then poll for launch (the descend tween is driven by
    // the scene clock; headless RAF can be throttled, so wait on the condition).
    await page.evaluate(() => window.game.scene.getScene('GameScene').enterBonusPipe());
    const launched = await page.waitForFunction(
        () => window.game.scene.isActive('BonusRoomScene'), null, { timeout: 8000 }
    ).then(() => true).catch(() => false);
    const bonus = await page.evaluate(() => {
        const br = window.game.scene.getScene('BonusRoomScene');
        return { hasPlayer: !!(br && br.player) };
    });
    (launched && bonus.hasPlayer) ? ok('bonus room launches with player') : bad('bonus room', JSON.stringify(bonus) + ' launched=' + launched);

    await page.evaluate(() => {
        const br = window.game.scene.getScene('BonusRoomScene');
        br.mathChallenge = null; // pretend math solved
        br.exitRoom();
    });
    const returned = await page.waitForFunction(
        () => !window.game.scene.isActive('BonusRoomScene') && window.game.scene.isActive('GameScene'),
        null, { timeout: 8000 }
    ).then(() => true).catch(() => false);
    returned ? ok('exit returns to level') : bad('exit room', 'did not return');

    // Boss fight on level 5
    await page.evaluate(() => {
        window.game.scene.stop('BonusRoomScene');
        window.game.scene.stop('GameScene');
        window.game.scene.start('GameScene', { level: 5 });
    });
    await page.waitForFunction(() => {
        const s = window.game.scene.getScene('GameScene');
        return s && s.boss && s.bossActive;
    }, null, { timeout: 10000 });
    ok('level 5 spawns a boss');

    const bossHp = await page.evaluate(() => {
        const s = window.game.scene.getScene('GameScene');
        const before = s.boss.hp;
        s.boss.takeDamage();
        return { before, after: s.boss.hp, max: s.boss.maxHp };
    });
    (bossHp.after === bossHp.before - 1) ? ok('boss takes damage (hp ' + bossHp.before + '→' + bossHp.after + ')') : bad('boss damage', JSON.stringify(bossHp));

    const defeated = await page.evaluate(() => {
        const s = window.game.scene.getScene('GameScene');
        let guard = 0;
        while (s.boss && !s.boss.defeated && guard++ < 20) { s.boss.invuln = 0; s.boss.takeDamage(); }
        s.updateBoss(16);
        return { defeated: s.boss ? s.boss.defeated : true, wallGone: !s.bossWall, bossActive: s.bossActive };
    });
    (defeated.defeated && defeated.wallGone && !defeated.bossActive) ? ok('boss defeat removes wall + ends fight') : bad('boss defeat', JSON.stringify(defeated));

    if (consoleErrors.length) bad('no console errors', consoleErrors.slice(0, 5).join(' | '));
    else ok('no console errors');

    await browser.close();
    console.log('\n==============================');
    console.log('PASSED: ' + passed + '   FAILED: ' + failed);
    console.log('==============================');
    if (failed > 0) { fails.forEach(f => console.log('  - ' + f)); process.exit(1); }
})();
