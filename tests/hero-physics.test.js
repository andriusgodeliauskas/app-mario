/**
 * Per-hero speed and jump multipliers.
 *
 * The multipliers are deliberately small (±10%): the 52 levels were laid out
 * for Mario's reach, so a bigger spread would make some jumps unreachable.
 * These tests assert BOTH directions — the difference is real, and it stays
 * inside the safe band.
 *
 * Run: python3 -m http.server 8765 &  node tests/hero-physics.test.js
 */
const { chromium } = require('playwright');
const BASE = process.env.MARIO_URL || 'http://localhost:8765';
let passed = 0, failed = 0; const fails = [];
const ok = n => { passed++; console.log('  ✓ ' + n); };
const bad = (n, e) => { failed++; fails.push(n); console.log('  ✗ ' + n + ' — ' + e); };

/** Velocity the scene actually applies when the hero runs / jumps. */
async function profile(p, id) {
  await p.evaluate(i => localStorage.setItem('app-mario:character:v1', JSON.stringify({ id: i })), id);
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.game && window.game.textures.exists('hero-peach'), null, { timeout: 20000 });
  await p.evaluate(() => { window.game.scene.stop('MenuScene'); window.game.scene.start('GameScene', { level: 1 }); });
  await p.waitForFunction(() => {
    const s = window.game.scene.getScene('GameScene');
    return s && s.player && s.player.body;
  }, null, { timeout: 15000 });
  await p.waitForTimeout(600);

  // Read the STEADY-STATE speed, measured in GAME FRAMES.
  //
  // Wall-clock waits are useless here: headless Chrome throttles rAF while the
  // test is idle, so waitForTimeout(700) advanced the game by only ~200ms and
  // sampled Toad mid-burst. Driving rAF from inside the page is the only
  // reliable clock.
  await p.keyboard.down('ArrowRight');
  const vx = await p.evaluate(async () => {
    const s = window.game.scene.getScene('GameScene');
    for (let i = 0; i < 45; i++) await new Promise(r => requestAnimationFrame(r));  // past any burst
    return Math.abs(s.player.body.velocity.x);
  });
  await p.keyboard.up('ArrowRight');
  await p.evaluate(async () => { for (let i = 0; i < 10; i++) await new Promise(r => requestAnimationFrame(r)); });

  // Jump: the peak height reached is what a child feels.
  const jump = await p.evaluate(async () => {
    const s = window.game.scene.getScene('GameScene');
    const startY = s.player.y;
    s.jumpBufferTimer = 200;                       // request a jump next frame
    let peak = startY;
    for (let i = 0; i < 70; i++) {
      await new Promise(r => requestAnimationFrame(r));
      peak = Math.min(peak, s.player.y);
    }
    return startY - peak;
  });

  return { vx, jump };
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });

  const mario = await profile(p, 'mario');
  const toad = await profile(p, 'toad');     // speedMul 1.10
  const rosa = await profile(p, 'rosalina'); // speedMul 1.00 — never slower than Mario
  const luigi = await profile(p, 'luigi');   // jumpMul 1.10

  console.log('  mario', JSON.stringify(mario), 'toad', JSON.stringify(toad),
              'rosalina', JSON.stringify(rosa), 'luigi', JSON.stringify(luigi));

  Math.abs(mario.vx - 200) < 1 ? ok('Mario greitis nepakites (200)') : bad('Mario greitis', mario.vx);
  Math.abs(toad.vx - 220) < 1 ? ok('Toad greitis x1.10 (220)') : bad('Toad greitis', toad.vx);
  // No hero may be slower than Mario: six levels have a five-tile gap only his
  // reach clears. Rosalina's character comes from her Luma, not from a handicap.
  Math.abs(rosa.vx - 200) < 1 ? ok('Rosalina neletesne uz Mario (200)') : bad('Rosalina greitis', rosa.vx);

  toad.vx > mario.vx ? ok('Toad greitesnis uz Mario') : bad('greicio tvarka', toad.vx + ' vs ' + mario.vx);
  toad.vx < mario.vx * 1.25 ? ok('greicio skirtumas saugioje riboje') : bad('per didelis skirtumas', toad.vx / mario.vx);

  luigi.jump > mario.jump * 1.03
    ? ok('Luigi soka auksciau (' + Math.round(luigi.jump) + ' vs ' + Math.round(mario.jump) + ' px)')
    : bad('Luigi sokis', luigi.jump + ' vs ' + mario.jump);
  luigi.jump < mario.jump * 1.30
    ? ok('sokio skirtumas saugioje riboje')
    : bad('sokis per aukstas', luigi.jump / mario.jump);

  errs.length === 0 ? ok('nulis konsoles klaidu') : bad('konsoles klaidos', errs.join(' | '));

  await b.close();
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed) { fails.forEach(f => console.log('  - ' + f)); process.exit(1); }
})().catch(e => { console.error('FATAL: ' + e.message); process.exit(1); });
