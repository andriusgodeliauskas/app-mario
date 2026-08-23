/**
 * Sequential level unlocking.
 *
 * Regression: commit 10277fd removed the runner room and renumbered the Wonder
 * rooms to 43-52, but WinScene still treated level 43 as the finale. Finishing
 * room 43 showed the princess/victory screen, whose only progress call is
 * unlockLevel(43) — a level already unlocked. Room 44 never unlocked and the
 * player was stuck. The real last room (52) meanwhile never showed the finale.
 *
 * Run: python3 -m http.server 8765 &  node tests/level-unlock.test.js
 */
const { chromium } = require('playwright');
const BASE = process.env.MARIO_URL || 'http://localhost:8765';
let passed = 0, failed = 0; const fails = [];
const ok = n => { passed++; console.log('  ✓ ' + n); };
const bad = (n, e) => { failed++; fails.push(n); console.log('  ✗ ' + n + ' — ' + e); };

/** Finish `level` through WinScene and report what is unlocked afterwards. */
async function finish(p, level) {
  await p.evaluate(l => {
    document.cookie = 'marioMaxLevel=' + l + ';path=/;max-age=31536000';
    ['GameScene', 'WonderScene', 'MenuScene', 'WinScene', 'HUDScene'].forEach(s => window.game.scene.stop(s));
    window.game.scene.start('WinScene', { level: l, score: 0, coins: 0, lives: 3 });
  }, level);
  await p.waitForFunction(() => window.game.scene.isActive('WinScene'), null, { timeout: 15000 });
  await p.evaluate(async () => { for (let i = 0; i < 30; i++) await new Promise(r => requestAnimationFrame(r)); });
  return p.evaluate(() => ({
    max: window.GameProgress.getMaxLevel(),
    finale: !!window.game.scene.getScene('WinScene')._isFinaleScreen
  }));
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForFunction(() => window.game && window.GameProgress, null, { timeout: 20000 });

  // Ordinary levels chain forward
  for (const lvl of [1, 5, 19, 30, 42]) {
    const r = await finish(p, lvl);
    r.max === lvl + 1 ? ok('lygis ' + lvl + ' atrakina ' + (lvl + 1))
      : bad('lygis ' + lvl, 'laukta ' + (lvl + 1) + ', gauta ' + r.max);
  }

  // The Wonder rooms — the ones the renumbering broke
  for (const lvl of [43, 44, 47, 51]) {
    const r = await finish(p, lvl);
    r.max === lvl + 1 ? ok('kambarys ' + lvl + ' atrakina ' + (lvl + 1))
      : bad('kambarys ' + lvl, 'laukta ' + (lvl + 1) + ', gauta ' + r.max);
  }

  // 43 is an ordinary room now, not the finale
  const r43 = await finish(p, 43);
  !r43.finale ? ok('kambarys 43 NEBEradomas kaip finalas') : bad('43 vis dar finalas', '');

  // 52 is the finale
  const r52 = await finish(p, 52);
  r52.finale ? ok('lygis 52 rodo finalo ekrana') : bad('52 nerodo finalo', '');
  r52.max === 52 ? ok('po 52 progresas lieka 52 (nera 53)') : bad('progresas po 52', r52.max);

  errs.length === 0 ? ok('nulis konsoles klaidu') : bad('konsoles klaidos', errs.join(' | '));

  await b.close();
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed) { fails.forEach(f => console.log('  - ' + f)); process.exit(1); }
})().catch(e => { console.error('FATAL: ' + e.message); process.exit(1); });
