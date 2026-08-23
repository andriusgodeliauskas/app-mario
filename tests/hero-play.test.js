/**
 * Playing as each of the 8 heroes.
 *
 * The player sprite, its animations and the big/small texture swap must all
 * follow the hero chosen in the menu. Mario keeps the original 'mario' texture
 * keys so nothing about the default experience shifts.
 *
 * Also covers the captive in the cage: playing AS Peach must not put a second
 * Peach behind the bars.
 *
 * Run: python3 -m http.server 8765 &  node tests/hero-play.test.js
 */
const { chromium } = require('playwright');
const BASE = process.env.MARIO_URL || 'http://localhost:8765';
let passed = 0, failed = 0; const fails = [];
const ok = n => { passed++; console.log('  ✓ ' + n); };
const bad = (n, e) => { failed++; fails.push(n); console.log('  ✗ ' + n + ' — ' + e); };

const IDS = ['mario', 'luigi', 'peach', 'toad', 'yoshi', 'daisy', 'rosalina', 'diddy'];

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));

  for (const id of IDS) {
    errs.length = 0;
    await p.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await p.evaluate(i => localStorage.setItem('app-mario:character:v1', JSON.stringify({ id: i })), id);
    await p.reload({ waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => window.game && window.game.textures.exists('hero-peach'), null, { timeout: 20000 });
    await p.evaluate(() => { window.game.scene.stop('MenuScene'); window.game.scene.start('GameScene', { level: 1 }); });
    await p.waitForFunction(() => {
      const s = window.game.scene.getScene('GameScene');
      return s && s.player && s.player.anims && s.player.anims.currentAnim;
    }, null, { timeout: 15000 });

    const r = await p.evaluate(() => {
      const s = window.game.scene.getScene('GameScene');
      return {
        tex: s.player.texture.key,
        anim: s.player.anims.currentAnim.key,
        heroKey: s.heroKey,
        bigKey: s.heroBigKey,
        bigExists: window.game.textures.exists(s.heroBigKey),
        animsExist: ['idle', 'run', 'jump', 'death'].every(a => window.game.anims.exists(s.heroKey + '-' + a)),
        bigAnimsExist: ['idle', 'run', 'jump'].every(a => window.game.anims.exists(s.heroBigKey + '-' + a))
      };
    });

    const expected = id === 'mario' ? 'mario' : 'hero-' + id;
    r.tex === expected ? ok(id + ': tekstura ' + expected)
      : bad(id + ': tekstura', 'laukta ' + expected + ', gauta ' + r.tex);
    r.anim.indexOf(expected + '-') === 0 ? ok(id + ': animacija ' + r.anim)
      : bad(id + ': animacija', r.anim);
    r.animsExist && r.bigAnimsExist ? ok(id + ': visos 7 animacijos sukurtos')
      : bad(id + ': animacijos', 'small=' + r.animsExist + ' big=' + r.bigAnimsExist);
    r.bigExists ? ok(id + ': big tekstura ' + r.bigKey) : bad(id + ': big tekstura', r.bigKey);
    errs.length === 0 ? ok(id + ': nulis konsoles klaidu') : bad(id + ': konsoles klaidos', errs.join(' | '));
  }

  // The captive must never be the hero the player is controlling.
  for (const [id, expectedCaptive] of [['peach', 'hero-daisy'], ['mario', 'princess']]) {
    await p.evaluate(i => localStorage.setItem('app-mario:character:v1', JSON.stringify({ id: i })), id);
    await p.reload({ waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => window.game && window.game.textures.exists('hero-peach'), null, { timeout: 20000 });
    const captive = await p.evaluate(() => {
      const s = window.game.scene.getScene('GameScene');
      return s.captiveTextureKey();
    });
    captive === expectedCaptive ? ok('zaidziant ' + id + ' narvelyje sedi ' + expectedCaptive)
      : bad('narvelio veikejas (' + id + ')', 'laukta ' + expectedCaptive + ', gauta ' + captive);
  }

  await b.close();
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed) { fails.forEach(f => console.log('  - ' + f)); process.exit(1); }
})().catch(e => { console.error('FATAL: ' + e.message); process.exit(1); });
