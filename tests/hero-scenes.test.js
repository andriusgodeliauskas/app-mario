/**
 * The chosen hero must appear in EVERY scene that puts a player on screen,
 * not just the main levels: WonderScene drives levels 43-52 and BonusRoomScene
 * the bonus tunnels. Picking Yoshi and turning back into Mario ten levels in
 * is the bug this guards.
 *
 * Run: python3 -m http.server 8765 &  node tests/hero-scenes.test.js
 */
const { chromium } = require('playwright');
const BASE = process.env.MARIO_URL || 'http://localhost:8765';
let passed = 0, failed = 0; const fails = [];
const ok = n => { passed++; console.log('  ✓ ' + n); };
const bad = (n, e) => { failed++; fails.push(n); console.log('  ✗ ' + n + ' — ' + e); };

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));

  await p.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.evaluate(() => localStorage.setItem('app-mario:character:v1', JSON.stringify({ id: 'yoshi' })));
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.game && window.game.textures.exists('hero-yoshi'), null, { timeout: 20000 });

  // ── WonderScene (level 43) ────────────────────────────────────────────────
  await p.evaluate(() => { window.game.scene.stop('MenuScene'); window.game.scene.start('WonderScene', { level: 43 }); });
  await p.waitForFunction(() => {
    const s = window.game.scene.getScene('WonderScene');
    return s && s.player && s.player.anims && s.player.anims.currentAnim;
  }, null, { timeout: 20000 });
  await p.waitForTimeout(1200);

  const w = await p.evaluate(() => {
    const s = window.game.scene.getScene('WonderScene');
    return { tex: s.player.texture.key, anim: s.player.anims.currentAnim.key };
  });
  w.tex === 'hero-yoshi' ? ok('WonderScene: zaidejas yra Yoshi') : bad('WonderScene tekstura', w.tex);
  w.anim.indexOf('hero-yoshi-') === 0 ? ok('WonderScene: animacija ' + w.anim) : bad('WonderScene animacija', w.anim);

  // ── BonusRoomScene ────────────────────────────────────────────────────────
  await p.evaluate(() => { window.game.scene.stop('WonderScene'); window.game.scene.start('BonusRoomScene', { level: 1, returnScene: 'GameScene' }); });
  await p.waitForFunction(() => {
    const s = window.game.scene.getScene('BonusRoomScene');
    return s && s.player && s.player.anims && s.player.anims.currentAnim;
  }, null, { timeout: 20000 });
  await p.waitForTimeout(800);

  const r = await p.evaluate(() => {
    const s = window.game.scene.getScene('BonusRoomScene');
    return { tex: s.player.texture.key, anim: s.player.anims.currentAnim.key };
  });
  r.tex === 'hero-yoshi' ? ok('BonusRoom: zaidejas yra Yoshi') : bad('BonusRoom tekstura', r.tex);
  r.anim.indexOf('hero-yoshi-') === 0 ? ok('BonusRoom: animacija ' + r.anim) : bad('BonusRoom animacija', r.anim);

  errs.length === 0 ? ok('nulis konsoles klaidu') : bad('konsoles klaidos', errs.join(' | '));

  await b.close();
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed) { fails.forEach(f => console.log('  - ' + f)); process.exit(1); }
})().catch(e => { console.error('FATAL: ' + e.message); process.exit(1); });
