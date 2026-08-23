const { chromium } = require('playwright');

const BASE_URL = process.env.MARIO_URL || 'http://localhost:8765';
const OUT_DIR = process.env.OUT_DIR || '/tmp';

async function startLevel(page, level, difficulty) {
    await page.evaluate(({ level, difficulty }) => {
        const settings = window.MathSettings.defaults();
        settings.difficulty = difficulty;
        settings.unlockAll = true;
        window.MathSettings.save(settings);
        const game = window.game;
        ['MenuScene', 'GameScene', 'WonderScene', 'WinScene', 'HUDScene'].forEach((key) => {
            const sc = game.scene.getScene(key);
            if (sc && sc.scene.isActive()) game.scene.stop(key);
        });
        game.scene.start(level >= 43 ? 'WonderScene' : 'GameScene', { level });
    }, { level, difficulty });
    await page.waitForFunction((level) => {
        const key = level >= 43 ? 'WonderScene' : 'GameScene';
        const s = window.game.scene.getScene(key);
        return s && s.scene.isActive() && s.player && s.player.body;
    }, level, { timeout: 10000 });
    await page.waitForTimeout(250);
}

async function countWonder(page, difficulty) {
    const rows = [];
    for (let level = 43; level <= 52; level++) {
        await startLevel(page, level, difficulty);
        rows.push(await page.evaluate((level) => {
            const s = window.game.scene.getScene('WonderScene');
            return {
                level,
                name: s.levelData.name,
                count: s.wonderEnemies.getChildren().filter(e => e.active).length,
                speed: Number((s._enemyBaseSpeed || 0).toFixed(2))
            };
        }, level));
    }
    return rows;
}

async function stompAndDamageProof(page, levels) {
    const out = [];
    for (const level of levels) {
        await startLevel(page, level, 'easy');
        out.push(await page.evaluate(() => {
            const s = window.game.scene.getScene('WonderScene');
            const enemies = s.wonderEnemies.getChildren().filter(e => e.active && !e.isShell);
            const stompEnemy = enemies[0];
            s.player.body.enable = true;
            s.player.x = stompEnemy.x;
            s.player.y = stompEnemy.y - 44;
            s.player.body.reset(s.player.x, s.player.y);
            s.player.body.setVelocityY(220);
            const beforeStomp = {
                level: s.currentLevel,
                kind: stompEnemy.wonderKind,
                enemyActive: stompEnemy.active,
                score: s.score,
                vy: s.player.body.velocity.y
            };
            s.hitWonderEnemy(s.player, stompEnemy);
            const afterStomp = {
                enemyActive: stompEnemy.active,
                enemyShell: !!stompEnemy.isShell,
                enemySquished: !!stompEnemy.isSquished,
                bodyEnabled: !!(stompEnemy.body && stompEnemy.body.enable),
                score: s.score,
                vy: Number(s.player.body.velocity.y.toFixed(2))
            };

            const sideEnemy = s.wonderEnemies.getChildren().filter(e => e.active && e !== stompEnemy && !e.isShell)[0];
            s.isBig = true;
            s.isDead = false;
            s.isInvincible = false;
            s.invincibleTimer = 0;
            s.player.body.enable = true;
            s.player.x = sideEnemy.x - 34;
            s.player.y = sideEnemy.y;
            s.player.body.reset(s.player.x, s.player.y);
            s.player.body.setVelocity(80, 0);
            const beforeSide = {
                kind: sideEnemy.wonderKind,
                isBig: s.isBig,
                isDead: s.isDead,
                invincible: s.isInvincible,
                lives: s.lives
            };
            s.hitWonderEnemy(s.player, sideEnemy);
            const afterSide = {
                isBig: s.isBig,
                isDead: s.isDead,
                invincible: s.isInvincible,
                invincibleTimer: s.invincibleTimer,
                lives: s.lives
            };
            return { beforeStomp, afterStomp, beforeSide, afterSide };
        }));
    }
    return out;
}

async function shellProof(page) {
    await startLevel(page, 43, 'easy');
    return page.evaluate(() => {
        const s = window.game.scene.getScene('WonderScene');
        const shell = s.wonderEnemies.getChildren().find(e => e.active && e.enemyType === 'koopa');
        s.player.x = shell.x;
        s.player.y = shell.y - 44;
        s.player.body.reset(s.player.x, s.player.y);
        s.player.body.setVelocityY(240);
        const before = { kind: shell.wonderKind, isShell: shell.isShell, moving: shell.shellMoving, score: s.score };
        s.hitWonderEnemy(s.player, shell);
        const afterStomp = {
            active: shell.active,
            isShell: shell.isShell,
            moving: shell.shellMoving,
            score: s.score,
            vy: Number(s.player.body.velocity.y.toFixed(2))
        };
        s.player.x = shell.x - 34;
        s.player.y = shell.y;
        s.player.body.reset(s.player.x, s.player.y);
        s.player.body.setVelocity(80, 0);
        s.hitWonderEnemy(s.player, shell);
        const afterKick = {
            isShell: shell.isShell,
            moving: shell.shellMoving,
            shellDir: shell.shellDir,
            vx: Number(shell.body.velocity.x.toFixed(2)),
            playerVy: Number(s.player.body.velocity.y.toFixed(2))
        };
        return { before, afterStomp, afterKick };
    });
}

async function ledgeProof(page) {
    await startLevel(page, 43, 'easy');
    return page.evaluate(() => {
        const s = window.game.scene.getScene('WonderScene');
        const e = s.wonderEnemies.getChildren().find(x => x.active && x.enemyType === 'goomba');
        e.body.reset(804, 506);
        e._originX = 760;
        e._patrol = 120;
        e.patrolDir = 1;
        e._turnCooldown = 0;
        e.body.blocked.down = true;
        e.body.touching.down = true;
        e.setVelocityX(56);
        const samples = [];
        for (let i = 0; i < 6; i++) {
            s.updateWonderEnemies(100);
            samples.push({ t: i * 100, x: Number(e.x.toFixed(2)), dir: e.patrolDir, vx: Number(e.body.velocity.x.toFixed(2)) });
            e.x += e.body.velocity.x * 0.1;
            e.body.reset(e.x, e.y);
            e.body.blocked.down = true;
            e.body.touching.down = true;
        }
        return samples;
    });
}

async function touchRegression(page) {
    const levels = [1, 20, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52];
    const rows = [];
    for (const level of levels) {
        await startLevel(page, level, 'easy');
        const before = await page.evaluate((level) => {
            const key = level >= 43 ? 'WonderScene' : 'GameScene';
            const s = window.game.scene.getScene(key);
            return { x: s.player.x, y: s.player.y, lane: s.lane, jumpY: s.jumpY || 0 };
        }, level);
        await page.dispatchEvent('#touch-right', 'touchstart');
        await page.waitForTimeout(350);
        await page.dispatchEvent('#touch-right', 'touchend');
        await page.dispatchEvent('#touch-jump', 'touchstart');
        await page.waitForTimeout(120);
        await page.dispatchEvent('#touch-jump', 'touchend');
        await page.waitForTimeout(300);
        const after = await page.evaluate((level) => {
            const key = level >= 43 ? 'WonderScene' : 'GameScene';
            const s = window.game.scene.getScene(key);
            return {
                level,
                scene: key,
                spawned: !!(s.player && s.player.body),
                dx: Number((s.player.x - window.__beforeX || 0).toFixed ? 0 : 0),
                x: Number(s.player.x.toFixed(2)),
                y: Number(s.player.y.toFixed(2)),
                lane: s.lane,
                jumpY: s.jumpY || 0,
                vx: s.player.body ? Number(s.player.body.velocity.x.toFixed(2)) : 0,
                vy: s.player.body ? Number(s.player.body.velocity.y.toFixed(2)) : (s.jumpVelocity || 0),
                mathSpawner: !!(s.mathSpawner || s.bossActive || s.bossChallenge)
            };
        }, level);
        rows.push({
            level,
            scene: after.scene,
            spawned: after.spawned,
            movedRight: after.x > before.x + 5,
            jumpWorked: (Math.abs(after.y - before.y) > 4 || Math.abs(after.vy) > 20),
            mathSpawner: after.mathSpawner,
            before,
            after
        });
    }
    return rows;
}

async function completionProof(page) {
    const rows = [];
    for (let level = 43; level <= 52; level++) {
        await startLevel(page, level, 'easy');
        rows.push(await page.evaluate(() => {
            const s = window.game.scene.getScene('WonderScene');
            if (s.bossDoor) {
                s.bossDoorLocked = false;
                if (s.bossDoor.body) s.bossDoor.body.enable = false;
            }
            if (s.levelData.mirrorTwin) {
                s.mirrorPlayerAtExit = true;
                s.mirrorTwinAtExit = true;
            }
            s.reachFlagpole(s.player, s.flagpole);
            return { level: s.currentLevel, levelComplete: s.levelComplete };
        }));
        await page.waitForTimeout(850);
        rows[rows.length - 1].winActive = await page.evaluate(() => {
            const win = window.game.scene.getScene('WinScene');
            return !!(win && win.scene.isActive());
        });
    }
    return rows;
}

async function performance(page) {
    const levels = [1, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52];
    const rows = [];
    for (const level of levels) {
        await startLevel(page, level, 'easy');
        rows.push(await page.evaluate(async (level) => {
            const frames = [];
            let last = performance.now();
            await new Promise(resolve => {
                function step(now) {
                    frames.push(now - last);
                    last = now;
                    if (frames.length >= 90) resolve();
                    else requestAnimationFrame(step);
                }
                requestAnimationFrame(step);
            });
            const avgMs = frames.reduce((a, b) => a + b, 0) / frames.length;
            return { level, fps: Number((1000 / avgMs).toFixed(1)), avgMs: Number(avgMs.toFixed(2)) };
        }, level));
    }
    return rows;
}

async function screenshots(page) {
    const rooms = [43, 44, 46, 47, 51];
    const rows = [];
    for (const level of rooms) {
        await startLevel(page, level, 'easy');
        await page.evaluate(() => {
            const s = window.game.scene.getScene('WonderScene');
            const e = s.wonderEnemies.getChildren().find(x => x.active);
            if (e) s.cameras.main.scrollX = Math.max(0, e.x - 360);
        });
        await page.waitForTimeout(250);
        const path = `${OUT_DIR}/wonder-room-${level}.png`;
        await page.screenshot({ path });
        rows.push({ level, path });
    }
    return rows;
}

(async () => {
    const browser = await chromium.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage({ viewport: { width: 800, height: 600 }, hasTouch: true });
    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push('PAGEERROR: ' + err.message));

    await page.goto(BASE_URL + '/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => window.game && window.game.textures && window.game.textures.exists('wonder-shell-enemy'), null, { timeout: 15000 });

    const countsEasy = await countWonder(page, 'easy');
    const countsHard = await countWonder(page, 'hard');
    const stompDamage = await stompAndDamageProof(page, [43, 46, 48, 51]);
    const shell = await shellProof(page);
    const ledge = await ledgeProof(page);
    const regression = await touchRegression(page);
    const completion = await completionProof(page);
    const perf = await performance(page);
    const shots = await screenshots(page);

    console.log('ENEMY_COUNTS_EASY');
    console.table(countsEasy);
    console.log('ENEMY_COUNTS_HARD');
    console.table(countsHard);
    console.log('STOMP_DAMAGE_PROOF');
    console.log(JSON.stringify(stompDamage, null, 2));
    console.log('SHELL_PROOF');
    console.log(JSON.stringify(shell, null, 2));
    console.log('LEDGE_PROOF');
    console.log(JSON.stringify(ledge, null, 2));
    console.log('REGRESSION');
    console.table(regression.map(r => ({
        level: r.level, scene: r.scene, spawned: r.spawned, movedRight: r.movedRight,
        jumpWorked: r.jumpWorked, mathSpawner: r.mathSpawner,
        beforeX: Number(r.before.x.toFixed(2)), afterX: r.after.x, beforeY: Number(r.before.y.toFixed(2)), afterY: r.after.y
    })));
    console.log('COMPLETION');
    console.table(completion);
    console.log('PERFORMANCE');
    console.table(perf);
    console.log('SCREENSHOTS');
    console.table(shots);
    console.log('CONSOLE_ERRORS');
    console.log(consoleErrors.length ? consoleErrors.join('\n') : 'none');

    const ok = countsEasy.every(r => r.count >= 5) &&
        countsHard.every((r, i) => r.count > countsEasy[i].count) &&
        stompDamage.every(r => r.afterStomp.score > r.beforeStomp.score && r.afterStomp.vy < 0 && (r.afterStomp.enemyShell || (r.afterStomp.enemySquished && r.afterStomp.bodyEnabled === false)) && r.afterSide.isBig === false && r.afterSide.invincible === true) &&
        shell.afterStomp.isShell && shell.afterKick.moving && Math.abs(shell.afterKick.vx) > 200 &&
        ledge.some(r => r.dir === -1 && r.vx < 0) &&
        regression.every(r => r.spawned && r.movedRight && r.jumpWorked && r.mathSpawner) &&
        completion.every(r => r.levelComplete && r.winActive) &&
        perf.filter(r => r.level >= 44).every(r => r.avgMs <= perf[0].avgMs * 1.15) &&
        consoleErrors.length === 0;

    await browser.close();
    process.exit(ok ? 0 : 1);
})().catch(async err => {
    console.error(err);
    process.exit(1);
});
