/**
 * Per-hero powers. Each hero must do something the others cannot, and no power
 * may break the levels — a glide that never ends or a double jump that stacks
 * turns a platformer into a flying game.
 *
 * Run: python3 -m http.server 8765 &  node tests/hero-powers.test.js
 */
const { chromium } = require('playwright');
const BASE = process.env.MARIO_URL || 'http://localhost:8765';
let passed = 0, failed = 0; const fails = [];
const ok = n => { passed++; console.log('  ✓ ' + n); };
const bad = (n, e) => { failed++; fails.push(n); console.log('  ✗ ' + n + ' — ' + e); };

async function load(p, id) {
  await p.evaluate(i => localStorage.setItem('app-mario:character:v1', JSON.stringify({ id: i })), id);
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.game && window.game.textures.exists('hero-peach'), null, { timeout: 20000 });
  await p.evaluate(() => { window.game.scene.stop('MenuScene'); window.game.scene.start('GameScene', { level: 1 }); });
  await p.waitForFunction(() => {
    const s = window.game.scene.getScene('GameScene');
    return s && s.player && s.player.body && s.player.body.blocked.down;
  }, null, { timeout: 15000 });
  await p.waitForTimeout(300);
}

/** Average downward speed while falling with the jump button held down. */
async function fallSpeedHoldingJump(p) {
  await p.keyboard.down('Space');
  const result = await p.evaluate(async () => {
    const s = window.game.scene.getScene('GameScene');
    // Wait until we are past the apex, then sample while the key is still held.
    for (let i = 0; i < 90; i++) {
      await new Promise(r => requestAnimationFrame(r));
      if (s.player.body.velocity.y > 20) break;
    }
    let sum = 0, n = 0;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => requestAnimationFrame(r));
      sum += s.player.body.velocity.y; n++;
    }
    return sum / n;
  });
  await p.keyboard.up('Space');
  return result;
}

/** How many times the hero can leave the ground before landing again. */
async function airJumps(p) {
  return p.evaluate(async () => {
    const s = window.game.scene.getScene('GameScene');
    let jumps = 0;
    s.jumpBufferTimer = 200;
    for (let i = 0; i < 8; i++) await new Promise(r => requestAnimationFrame(r));
    jumps++;
    const yAfterFirst = s.player.y;
    // Ask for a second jump while airborne
    s.jumpBufferTimer = 200;
    for (let i = 0; i < 25; i++) await new Promise(r => requestAnimationFrame(r));
    if (s.player.y < yAfterFirst - 8) jumps++;
    return jumps;
  });
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });

  // ── Peach: glide ──────────────────────────────────────────────────────────
  await load(p, 'mario');
  const marioFall = await fallSpeedHoldingJump(p);
  await load(p, 'peach');
  const peachFall = await fallSpeedHoldingJump(p);
  console.log('  kritimo greitis: mario ' + Math.round(marioFall) + ', peach ' + Math.round(peachFall));
  peachFall < marioFall * 0.75 ? ok('Peach sklendzia (letesnis kritimas)')
    : bad('Peach sklendimas', peachFall + ' vs ' + marioFall);

  // ...but the glide must run out, or she can cross any gap
  await load(p, 'peach');
  await p.keyboard.down('Space');
  const glideEnds = await p.evaluate(async () => {
    const s = window.game.scene.getScene('GameScene');
    for (let i = 0; i < 200; i++) {
      await new Promise(r => requestAnimationFrame(r));
      if (s.player.body.velocity.y > 300) return true;
    }
    return false;
  });
  await p.keyboard.up('Space');
  glideEnds ? ok('sklendimas baigiasi (nekaba amzinai)') : bad('sklendimas be galo', 'greitis niekada nevirsijo 300');

  // ── Yoshi: double jump ────────────────────────────────────────────────────
  await load(p, 'mario');
  const marioJumps = await airJumps(p);
  await load(p, 'yoshi');
  const yoshiJumps = await airJumps(p);
  marioJumps === 1 ? ok('Mario turi 1 sokj') : bad('Mario sokiu skaicius', marioJumps);
  yoshiJumps === 2 ? ok('Yoshi turi 2 sokius') : bad('Yoshi sokiu skaicius', yoshiJumps);

  const yoshiNoTriple = await p.evaluate(async () => {
    const s = window.game.scene.getScene('GameScene');
    let y = s.player.y;
    for (let i = 0; i < 3; i++) { s.jumpBufferTimer = 200; for (let k = 0; k < 10; k++) await new Promise(r => requestAnimationFrame(r)); }
    // after three requests in the air we must be falling, not climbing
    const before = s.player.y;
    for (let k = 0; k < 20; k++) await new Promise(r => requestAnimationFrame(r));
    return s.player.y > before;
  });
  yoshiNoTriple ? ok('Yoshi negali sokineti be galo') : bad('Yoshi begalinis sokis', 'kyla ir toliau');

  // ── Toad: quick start ─────────────────────────────────────────────────────
  await load(p, 'toad');
  const toadPower = await p.evaluate(() => window.game.scene.getScene('GameScene').hero.power);
  toadPower === 'quickstart' ? ok('Toad turi quickstart galia') : bad('Toad galia', toadPower);

  // The burst must be a burst: fast off the mark, then settling back. A
  // permanent boost would quietly rewrite every level's difficulty for him.
  // Warm rAF up first: idle headless Chrome throttles it, and the catch-up
  // frame right after a keypress carries a delta big enough to consume the
  // whole burst before the first sample.
  await p.evaluate(async () => { for (let i = 0; i < 10; i++) await new Promise(r => requestAnimationFrame(r)); });
  await p.keyboard.down('ArrowRight');
  const burst = await p.evaluate(async () => {
    const s = window.game.scene.getScene('GameScene');
    let peak = 0;
    for (let i = 0; i < 6; i++) { await new Promise(r => requestAnimationFrame(r)); peak = Math.max(peak, Math.abs(s.player.body.velocity.x)); }
    for (let i = 0; i < 45; i++) await new Promise(r => requestAnimationFrame(r));
    return { peak: peak, settled: Math.abs(s.player.body.velocity.x) };
  });
  await p.keyboard.up('ArrowRight');
  burst.peak > burst.settled * 1.2
    ? ok('Toad startuoja greiciau (' + Math.round(burst.peak) + ' → ' + Math.round(burst.settled) + ')')
    : bad('Toad burstas', JSON.stringify(burst));
  burst.settled <= 221
    ? ok('burstas baigiasi, greitis grizta i 220')
    : bad('burstas nesibaigia', burst.settled);

  // ── Rosalina: Luma coin magnet ────────────────────────────────────────────
  await load(p, 'rosalina');
  const magnet = await p.evaluate(async () => {
    const s = window.game.scene.getScene('GameScene');
    const coin = s.coinGroup && s.coinGroup.getChildren().find(c => c.active);
    if (!coin) return { skipped: true };
    // Put a coin just out of reach and watch whether it drifts toward her
    coin.x = s.player.x + 50; coin.y = s.player.y;
    const before = Math.abs(coin.x - s.player.x);
    for (let i = 0; i < 20; i++) await new Promise(r => requestAnimationFrame(r));
    return { skipped: false, before: before, after: Math.abs(coin.x - s.player.x) };
  });
  if (magnet.skipped) bad('Luma magnetas', 'lygyje nerasta monetos');
  else (magnet.after < magnet.before - 4)
    ? ok('Luma traukia monetas (' + Math.round(magnet.before) + '→' + Math.round(magnet.after) + 'px)')
    : bad('Luma magnetas', magnet.before + ' → ' + magnet.after);

  // ── Every hero has a distinct power and none of them error ────────────────
  await load(p, 'daisy');
  const daisyPower = await p.evaluate(() => window.game.scene.getScene('GameScene').hero.power);
  daisyPower === 'superbounce' ? ok('Daisy turi superbounce galia') : bad('Daisy galia', daisyPower);

  errs.length === 0 ? ok('nulis konsoles klaidu') : bad('konsoles klaidos', errs.join(' | '));

  await b.close();
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed) { fails.forEach(f => console.log('  - ' + f)); process.exit(1); }
})().catch(e => { console.error('FATAL: ' + e.message); process.exit(1); });
