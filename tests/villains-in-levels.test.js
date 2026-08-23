/**
 * The villains actually appear in the levels they were placed in, and those
 * levels still load cleanly.
 *
 * Placement is thematic: Boo haunts the dark levels, DK the jungles, Wario goes
 * where the money is, Waluigi turns up at school and the stadium, and Bowser Jr.
 * guards the run-up to a boss.
 *
 * Run: python3 -m http.server 8765 &  node tests/villains-in-levels.test.js
 */
const { chromium } = require('playwright');
const BASE = process.env.MARIO_URL || 'http://localhost:8765';
let passed = 0, failed = 0; const fails = [];
const ok = n => { passed++; console.log('  ✓ ' + n); };
const bad = (n, e) => { failed++; fails.push(n); console.log('  ✗ ' + n + ' — ' + e); };

// level -> the villain type expected there
const EXPECTED = {
  9: 'wario', 10: 'boo', 11: 'dk', 14: 'bowser-jr', 18: 'bowser-jr',
  22: 'waluigi', 24: 'wario', 31: 'dk', 32: 'boo', 38: 'waluigi',
  40: 'waluigi', 42: 'boo'
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.evaluate(() => localStorage.setItem('app-mario:math-settings:v1', JSON.stringify({
    add: true, subtract: true, multiply: false, divide: false, difficulty: 'easy', unlockAll: true
  })));
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.game && window.game.textures.exists('boo'), null, { timeout: 20000 });

  for (const [lvlStr, type] of Object.entries(EXPECTED)) {
    const lvl = Number(lvlStr);
    errs.length = 0;
    await p.evaluate(n => {
      ['GameScene', 'MenuScene', 'WonderScene'].forEach(s => window.game.scene.stop(s));
      window.game.scene.start('GameScene', { level: n });
    }, lvl);

    const found = await p.evaluate(async t => {
      const wait = async () => {
        for (let i = 0; i < 120; i++) {
          await new Promise(r => requestAnimationFrame(r));
          const s = window.game.scene.getScene('GameScene');
          if (s && s.enemies) return s;
        }
        return null;
      };
      const s = await wait();
      if (!s) return { error: 'scena neuzsikrove' };
      for (let i = 0; i < 20; i++) await new Promise(r => requestAnimationFrame(r));
      const types = s.enemies.getChildren().map(e => e.enemyType);
      return { has: types.indexOf(t) !== -1, all: types.join(',') };
    }, type);

    if (found.error) bad('lygis ' + lvl, found.error);
    else found.has ? ok('lygis ' + lvl + ': rastas ' + type)
                   : bad('lygis ' + lvl + ': nerastas ' + type, 'yra: ' + (found.all || '(tuscia)'));
    if (errs.length) bad('lygis ' + lvl + ' konsoles klaidos', errs.join(' | '));
  }

  await b.close();
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed) { fails.forEach(f => console.log('  - ' + f)); process.exit(1); }
})().catch(e => { console.error('FATAL: ' + e.message); process.exit(1); });
