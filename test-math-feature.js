/**
 * Playwright integration tests for math challenge feature.
 *
 * Prereq: a local HTTP server running on port 8765 serving the project root.
 *   python3 -m http.server 8765 --directory /workspace/child/app-mario
 *
 * Run: node test-math-feature.js
 */

const { chromium } = require('playwright');

const BASE_URL = process.env.MARIO_URL || 'http://localhost:8765';

let totalPassed = 0, totalFailed = 0;
const failures = [];

function pass(name) { totalPassed++; console.log('  ✓ ' + name); }
function fail(name, err) { totalFailed++; failures.push(name + ': ' + err); console.log('  ✗ ' + name + ' — ' + err); }

async function waitFor(page, fn, timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const v = await page.evaluate(fn);
        if (v) return v;
        await page.waitForTimeout(100);
    }
    return null;
}

(async () => {
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });

    const consoleErrors = [];
    page.on('pageerror', err => consoleErrors.push(err.message));
    page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // ============================================
    // T0: Game loads without errors
    // ============================================
    console.log('\n[T0] Game loads without console errors');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    if (consoleErrors.length === 0) {
        pass('no console errors on load');
    } else {
        fail('no console errors on load', JSON.stringify(consoleErrors));
    }

    // Verify globals are exposed
    const globals = await page.evaluate(() => ({
        MathGen: !!window.MathGen,
        MathSettings: !!window.MathSettings,
        MathSpawner: !!window.MathSpawner,
        MathChallenge: !!window.MathChallenge,
        AnswerBlock: !!window.AnswerBlock,
        MathSign: !!window.MathSign,
        SettingsScene: !!window.SettingsScene
    }));
    Object.keys(globals).forEach(k => {
        if (globals[k]) pass('window.' + k + ' exists');
        else fail('window.' + k + ' exists', 'undefined');
    });

    await page.screenshot({ path: '/tmp/mario-math-01-menu.png' });

    // ============================================
    // T1: Settings persistence (round-trip via localStorage)
    // ============================================
    console.log('\n[T1] Settings persist via localStorage');
    await page.evaluate(() => {
        const s = {
            add:      { enabled: true,  max: 20 },
            subtract: { enabled: true,  max: 50 },
            multiply: { enabled: false, max: 10 },
            divide:   { enabled: true,  max: 50 }
        };
        window.MathSettings.save(s);
    });

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const loaded = await page.evaluate(() => window.MathSettings.load());
    if (loaded.add.max === 20 && loaded.subtract.enabled === true && loaded.divide.max === 50) {
        pass('round-trip: add.max=20, subtract on, divide.max=50');
    } else {
        fail('round-trip', JSON.stringify(loaded));
    }

    // ============================================
    // T2: Math challenge spawns in level
    // ============================================
    console.log('\n[T2] Math challenge spawns within ~12s after level start');
    // Reset settings to defaults for predictable behavior
    await page.evaluate(() => window.MathSettings.save(window.MathSettings.defaults()));
    // Start level 1 directly (avoids brittleness of canvas click coordinates)
    await page.evaluate(() => window.game.scene.getScene('MenuScene').startLevel(1));
    await page.waitForTimeout(2500);

    // Wait up to 20s for active math challenge to appear (10s timer + scene init + safe-spot search delay)
    const spawned = await waitFor(page, () => {
        const game = window.game;
        if (!game) return false;
        const scene = game.scene.getScene('GameScene');
        return scene && scene.mathSpawner && scene.mathSpawner.active !== null;
    }, 20000);

    if (spawned) {
        pass('math challenge spawned within timeout');
        await page.screenshot({ path: '/tmp/mario-math-02-spawned.png' });
    } else {
        fail('math challenge spawned', 'no active challenge after 14s');
        await page.screenshot({ path: '/tmp/mario-math-02-no-spawn.png' });
    }

    // Verify problem structure
    const problem = await page.evaluate(() => {
        const scene = window.game.scene.getScene('GameScene');
        if (!scene || !scene.mathSpawner || !scene.mathSpawner.active) return null;
        return scene.mathSpawner.active.problem;
    });
    if (problem && problem.options && problem.options.length === 3 &&
        problem.options.indexOf(problem.answer) !== -1) {
        pass('problem has 3 options including correct answer');
    } else if (problem) {
        fail('problem structure', JSON.stringify(problem));
    }

    // ============================================
    // T3: Force-jump-from-below into correct block → score increases
    // ============================================
    console.log('\n[T3] Correct answer increases score');
    if (spawned) {
        const beforeScore = await page.evaluate(() => {
            const s = window.game.scene.getScene('GameScene');
            return s.score;
        });

        await page.evaluate(() => {
            const scene = window.game.scene.getScene('GameScene');
            const ch = scene.mathSpawner.active;
            if (!ch || !ch.blocks) return;
            const correct = ch.blocks.find(b => b.isCorrect);
            if (!correct || !correct.sprite) return;
            // Teleport Mario just below the correct block and rocket upward —
            // this simulates the jump-from-below hit.
            scene.player.x = correct.sprite.x;
            scene.player.y = correct.sprite.y + 40;
            scene.player.body.setVelocity(0, -300);
        });
        await page.waitForTimeout(2500);

        const afterScore = await page.evaluate(() => {
            const s = window.game.scene.getScene('GameScene');
            return s.score;
        });

        if (afterScore >= beforeScore + 50) {
            pass('score increased by ≥50 (' + beforeScore + ' → ' + afterScore + ')');
        } else {
            fail('correct answer score', 'before=' + beforeScore + ' after=' + afterScore);
        }
        await page.screenshot({ path: '/tmp/mario-math-03-correct.png' });
    } else {
        fail('correct answer test', 'skipped — no challenge spawned');
    }

    // ============================================
    // T4: Wrong answer (small Mario) — knockback, no death
    // ============================================
    console.log('\n[T4] Wrong answer with small Mario does not kill player');

    // Wait for a FRESH challenge (not the old one still cleaning up).
    // A fresh challenge has unresolved blocks with live sprites.
    const next = await waitFor(page, () => {
        const game = window.game;
        if (!game) return false;
        const scene = game.scene.getScene('GameScene');
        if (!scene || scene.isDead || !scene.mathSpawner || !scene.mathSpawner.active) return false;
        var ch = scene.mathSpawner.active;
        if (ch.resolved || ch.cleaned) return false;
        if (!ch.blocks || ch.blocks.length === 0) return false;
        // All blocks must have live sprites
        return ch.blocks.every(function (b) { return b && b.sprite && !b.destroyed; });
    }, 14000);

    if (next) {
        await page.evaluate(() => {
            const scene = window.game.scene.getScene('GameScene');
            scene.isBig = false;
            const ch = scene.mathSpawner.active;
            const wrong = ch.blocks.find(b => !b.isCorrect);
            if (!wrong || !wrong.sprite) return null;
            scene.player.x = wrong.sprite.x;
            scene.player.y = wrong.sprite.y + 40;
            scene.player.body.setVelocity(0, -300);
        });

        // Quick check (within invuln window of ~1500ms)
        await page.waitForTimeout(700);
        const stateMid = await page.evaluate(() => {
            const s = window.game.scene.getScene('GameScene');
            return { isDead: s.isDead, isInvincible: s.isInvincible, score: s.score };
        });
        if (stateMid.isInvincible) {
            pass('invulnerability triggered shortly after wrong');
        } else {
            fail('invulnerability', 'not triggered (state=' + JSON.stringify(stateMid) + ')');
        }

        // Final check — make sure Mario is still alive after invuln expires
        await page.waitForTimeout(1800);
        const stateAfter = await page.evaluate(() => {
            const scene = window.game.scene.getScene('GameScene');
            return { isDead: scene.isDead, score: scene.score };
        });
        if (!stateAfter.isDead) {
            pass('small Mario survives wrong answer (isDead=false)');
        } else {
            fail('small Mario survives', 'isDead=true');
        }
        await page.screenshot({ path: '/tmp/mario-math-04-wrong.png' });
    } else {
        fail('wrong answer test', 'skipped — no challenge spawned');
    }

    // ============================================
    // T9: Standard ? block hit-from-below registers a coin
    // ============================================
    console.log('\n[T9] Standard question block hit registers when bumped from below');
    await page.evaluate(() => window.MathSettings.save(window.MathSettings.defaults()));
    await page.evaluate(() => window.game.scene.start('GameScene', { level: 1 }));
    await page.waitForTimeout(2500);

    const qHitResult = await page.evaluate(() => {
        const gs = window.game.scene.getScene('GameScene');
        const qBlocks = gs.questionTiles.children.entries.filter(b => !b.isUsed);
        if (qBlocks.length === 0) return { found: false };
        const target = qBlocks[0];
        const beforeCoins = gs.coins;
        // Teleport Mario directly below block, rocket up
        gs.player.x = target.x;
        gs.player.y = target.body.bottom + 30;
        gs.player.body.setVelocity(0, -400);
        return {
            found: true,
            beforeCoins,
            blockX: target.x, blockY: target.y,
            blockBodyBottom: target.body.bottom,
            playerX: gs.player.x, playerY: gs.player.y
        };
    });

    if (!qHitResult.found) {
        fail('? block hit', 'no question blocks found');
    } else {
        await page.waitForTimeout(800);
        const after = await page.evaluate(() => {
            const gs = window.game.scene.getScene('GameScene');
            const qBlocks = gs.questionTiles.children.entries;
            const usedCount = qBlocks.filter(b => b.isUsed).length;
            return { coins: gs.coins, usedCount };
        });
        if (after.coins > qHitResult.beforeCoins && after.usedCount > 0) {
            pass('? block registered hit when centered (coins ' + qHitResult.beforeCoins + ' → ' + after.coins + ')');
        } else {
            fail('? block hit centered', JSON.stringify({ before: qHitResult, after }));
        }
    }

    // ============================================
    // T9b: ?-block hit with horizontal offset (off-center bump)
    // ============================================
    console.log('\n[T9b] ? block hit registers even when Mario is slightly off-center');
    await page.evaluate(() => window.game.scene.start('GameScene', { level: 1 }));
    await page.waitForTimeout(2500);

    const offsetTest = await page.evaluate(() => {
        const gs = window.game.scene.getScene('GameScene');
        const qBlocks = gs.questionTiles.children.entries.filter(b => !b.isUsed);
        if (qBlocks.length === 0) return { found: false };
        const target = qBlocks[0];
        const before = gs.coins;
        // Teleport Mario 10px LEFT of block center, rocket up
        gs.player.x = target.x - 10;
        gs.player.y = target.body.bottom + 30;
        gs.player.body.setVelocity(0, -400);
        return { found: true, before, blockX: target.x };
    });

    if (!offsetTest.found) {
        fail('? block offset hit', 'no question blocks');
    } else {
        await page.waitForTimeout(800);
        const after = await page.evaluate(() => window.game.scene.getScene('GameScene').coins);
        if (after > offsetTest.before) {
            pass('? block offset hit registered (coins ' + offsetTest.before + ' → ' + after + ')');
        } else {
            fail('? block offset hit', 'coins did not change (' + offsetTest.before + ' → ' + after + ')');
        }
    }

    // ============================================
    // T9c: ?-block hit with arc trajectory (jumping while moving sideways)
    // ============================================
    console.log('\n[T9c] ? block hit registers when Mario jumps with horizontal velocity');
    await page.evaluate(() => window.game.scene.start('GameScene', { level: 1 }));
    await page.waitForTimeout(2500);

    const arcTest = await page.evaluate(() => {
        const gs = window.game.scene.getScene('GameScene');
        const qBlocks = gs.questionTiles.children.entries.filter(b => !b.isUsed);
        if (qBlocks.length === 0) return { found: false };
        const target = qBlocks[0];
        const before = gs.coins;
        // Position Mario to the LEFT and BELOW, with both horizontal and upward velocity
        gs.player.x = target.x - 32;
        gs.player.y = target.body.bottom + 60;
        gs.player.body.setVelocity(150, -400);
        return { found: true, before };
    });

    if (!arcTest.found) {
        fail('? block arc hit', 'no question blocks');
    } else {
        await page.waitForTimeout(1200);
        const after = await page.evaluate(() => window.game.scene.getScene('GameScene').coins);
        if (after > arcTest.before) {
            pass('? block arc hit registered (coins ' + arcTest.before + ' → ' + after + ')');
        } else {
            fail('? block arc hit', 'coins did not change (' + arcTest.before + ' → ' + after + ')');
        }
    }

    // ============================================
    // T6: Answer wall blocks Mario from passing until he answers
    // ============================================
    console.log('\n[T6] Answer wall blocks Mario until question answered');
    // Reset to clean state — start a fresh level
    await page.evaluate(() => window.MathSettings.save(window.MathSettings.defaults()));
    await page.evaluate(() => window.game.scene.start('GameScene', { level: 1 }));
    await page.waitForTimeout(2500);

    // Wait for a math challenge to spawn
    const wallSpawned = await waitFor(page, () => {
        const scene = window.game.scene.getScene('GameScene');
        return scene && scene.mathSpawner && scene.mathSpawner.active && scene.mathSpawner.active.wall;
    }, 20000);

    if (wallSpawned) {
        const wallInfo = await page.evaluate(() => {
            const scene = window.game.scene.getScene('GameScene');
            const ch = scene.mathSpawner.active;
            return {
                hasWall: !!ch.wall,
                wallX: ch.wall ? ch.wall.x : null,
                challengeX: ch.x
            };
        });
        if (wallInfo.hasWall && wallInfo.wallX > wallInfo.challengeX) {
            pass('answer wall is positioned right of challenge (challenge.x=' + wallInfo.challengeX + ', wall.x=' + wallInfo.wallX + ')');
        } else {
            fail('answer wall positioning', JSON.stringify(wallInfo));
        }

        // Wall should disappear after a correct answer
        await page.evaluate(() => {
            const scene = window.game.scene.getScene('GameScene');
            const ch = scene.mathSpawner.active;
            const correct = ch.blocks.find(b => b.isCorrect);
            scene.player.x = correct.sprite.x;
            scene.player.y = correct.sprite.y + 40;
            scene.player.body.setVelocity(0, -300);
        });
        await page.waitForTimeout(1500);

        const wallGone = await page.evaluate(() => {
            const scene = window.game.scene.getScene('GameScene');
            const ch = scene.mathSpawner.active;
            return !ch || !ch.wall;
        });
        if (wallGone) {
            pass('answer wall removed after correct answer');
        } else {
            fail('answer wall removed', 'still present');
        }
    } else {
        fail('answer wall test', 'no challenge with wall spawned');
    }

    // ============================================
    // T7: Side hit on block does NOT register an answer
    // ============================================
    console.log('\n[T7] Side hit on a block does not trigger an answer');
    // Wait for next challenge
    const nextCh = await waitFor(page, () => {
        const scene = window.game.scene.getScene('GameScene');
        return scene && scene.mathSpawner && scene.mathSpawner.active && scene.mathSpawner.active.blocks;
    }, 20000);

    if (nextCh) {
        const beforeScore = await page.evaluate(() => window.game.scene.getScene('GameScene').score);
        // Approach block from the side at the same height (no jumping into bottom)
        await page.evaluate(() => {
            const scene = window.game.scene.getScene('GameScene');
            const ch = scene.mathSpawner.active;
            const block = ch.blocks[0];
            // Position Mario to the LEFT of the block, AT block height, moving right
            scene.player.x = block.sprite.x - 50;
            scene.player.y = block.sprite.y; // same y as block center → side approach
            scene.player.body.setVelocity(400, 0);
        });
        await page.waitForTimeout(800);

        const afterScore = await page.evaluate(() => window.game.scene.getScene('GameScene').score);
        const stillActive = await page.evaluate(() => {
            const scene = window.game.scene.getScene('GameScene');
            return scene.mathSpawner.active !== null;
        });

        // Score should not change (no answer registered) and challenge should still be active
        if (afterScore === beforeScore && stillActive) {
            pass('side hit did not register answer (score unchanged, challenge still active)');
        } else {
            fail('side hit', 'score=' + afterScore + ' (was ' + beforeScore + ') challengeActive=' + stillActive);
        }
    } else {
        fail('side hit test', 'no challenge spawned');
    }

    // ============================================
    // T8: Level 1 variant rotation
    // ============================================
    console.log('\n[T8] Level 1 cycles through 4 variants');
    const seenVariants = {};
    for (let attempt = 0; attempt < 6; attempt++) {
        await page.evaluate(() => window.game.scene.start('GameScene', { level: 1 }));
        await page.waitForTimeout(1500);
        const v = await page.evaluate(() => {
            try {
                return localStorage.getItem('app-mario:level1-variant-idx');
            } catch (e) { return null; }
        });
        if (v !== null) seenVariants[v] = true;
    }
    const uniqueCount = Object.keys(seenVariants).length;
    if (uniqueCount >= 3) {
        pass('saw at least 3 distinct variants in 6 attempts (' + Object.keys(seenVariants).join(',') + ')');
    } else {
        fail('variant rotation', 'only saw ' + uniqueCount + ' variants: ' + Object.keys(seenVariants).join(','));
    }

    // ============================================
    // T5: WinScene → GameScene transition (Next Level button)
    // ============================================
    console.log('\n[T5] WinScene Next Level button transitions to next level');
    // Reset to clean state
    await page.evaluate(() => {
        const gs = window.game.scene.getScene('GameScene');
        gs.scene.stop('HUDScene');
        gs.scene.start('WinScene', { score: 200, coins: 7, lives: 3, level: 1 });
    });
    await page.waitForTimeout(1500);

    const winState = await page.evaluate(() => {
        const ws = window.game.scene.getScene('WinScene');
        return { active: ws.scene.isActive(), level: ws.playerLevel };
    });
    if (winState.active && winState.level === 1) {
        pass('WinScene loaded for level 1');
    } else {
        fail('WinScene loaded', JSON.stringify(winState));
    }

    // Click Next Level
    await page.evaluate(() => {
        window.game.scene.getScene('WinScene').goToNextLevel();
    });
    await page.waitForTimeout(2500);

    const after = await page.evaluate(() => {
        const gs = window.game.scene.getScene('GameScene');
        return {
            gsActive: gs.scene.isActive(),
            level: gs.currentLevel,
            hasPlayer: !!gs.player
        };
    });
    if (after.gsActive && after.level === 2 && after.hasPlayer) {
        pass('Next Level transitioned to level 2');
    } else {
        fail('Next Level transition', JSON.stringify(after));
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n========================================');
    console.log('PASSED: ' + totalPassed + '   FAILED: ' + totalFailed);
    console.log('========================================');
    if (failures.length > 0) {
        console.log('\nFailures:');
        failures.forEach(f => console.log('  - ' + f));
    }
    if (consoleErrors.length > 0) {
        console.log('\nConsole errors collected:');
        consoleErrors.forEach(e => console.log('  - ' + e));
    }

    await browser.close();
    process.exit(totalFailed > 0 ? 1 : 0);
})();
