/**
 * Regression: Koopas must patrol like Goombas, not spawn buried in the ground.
 *
 * Bug history: Koopa is 48px tall vs Goomba's 32, but both spawned at the same
 * tile-center Y, burying the Koopa body ~9px in the ground. An embedded body
 * side-collides with adjacent ground tiles every frame → turn-cooldown thrash →
 * the Koopa never moved, and a kicked shell then mowed through every stuck koopa.
 * Fix: lift the Koopa spawn by its extra height so its feet land on the ground.
 *
 * Verification is RAF-throttling-proof: we use a Goomba (known-good mover) as a
 * control and assert the Koopa is (a) not buried and (b) travels as far as the
 * Goomba over the same real-time window. HTTP server on :8765.
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
  await p.goto(BASE + '/index.html');
  await p.waitForFunction(() => window.game && window.game.textures.exists('koopa'), null, { timeout: 15000 });

  // pick a level that has both a goomba and a koopa
  const lvl = await p.evaluate(() => {
    const s = window.game.scene.getScene('GameScene');
    for (const n of [16, 15, 6, 3, 8]) {
      const fn = s['getLevel' + n + 'Data']; if (!fn) continue;
      const d = fn.call(s);
      const g = d.map.reduce((a, r) => a + r.filter(v => v === 60).length, 0);
      const k = d.map.reduce((a, r) => a + r.filter(v => v === 61).length, 0);
      if (g >= 1 && k >= 1) return n;
    }
    return 16;
  });
  await p.evaluate((n) => { window.game.scene.stop('MenuScene'); window.game.scene.start('GameScene', { level: n }); }, lvl);
  await p.waitForFunction(() => { const s = window.game.scene.getScene('GameScene'); return s && s.enemies && s.enemies.getChildren().length > 0; }, null, { timeout: 8000 });

  const spawn = await p.evaluate(() => {
    const s = window.game.scene.getScene('GameScene');
    const g = s.enemies.getChildren().find(e => e.enemyType === 'goomba');
    const k = s.enemies.getChildren().find(e => e.enemyType === 'koopa');
    const gt = (19 - 2) * 32;
    window.__g = g; window.__k = k; window.__gx = g.x; window.__kx = k.x;
    return { koopaEmbed: Math.round(k.body.bottom - gt), goombaEmbed: Math.round(g.body.bottom - gt) };
  });
  await p.waitForTimeout(3000); // real game loop drives physics for both equally
  const r = await p.evaluate(() => {
    const gt = (19 - 2) * 32, g = window.__g, k = window.__k;
    return {
      goombaMoved: Math.round(Math.abs(g.x - window.__gx)),
      koopaMoved: Math.round(Math.abs(k.x - window.__kx)),
      koopaVx: Math.round(k.body.velocity.x),
      koopaOnGround: !!(k.body.blocked.down || k.body.touching.down),
      koopaEmbedNow: Math.round(k.body.bottom - gt)
    };
  });
  console.log('  spawn:', JSON.stringify(spawn), ' after:', JSON.stringify(r));

  (spawn.koopaEmbed <= 1) ? ok('koopa not buried at spawn (' + spawn.koopaEmbed + 'px, was +9 before fix)') : bad('embedding', spawn.koopaEmbed + 'px buried');
  (r.koopaOnGround && r.koopaEmbedNow <= 1) ? ok('koopa rests on ground') : bad('on ground', JSON.stringify(r));
  // Control: koopa must travel at least as far as the goomba in the same window.
  (r.koopaMoved >= Math.max(4, r.goombaMoved * 0.8)) ?
    ok('koopa patrols like the goomba (koopa ' + r.koopaMoved + 'px vs goomba ' + r.goombaMoved + 'px)') :
    bad('patrol', 'koopa moved ' + r.koopaMoved + 'px vs goomba ' + r.goombaMoved + 'px');

  errs.length ? bad('no errors', errs.slice(0, 2).join(' | ')) : ok('no console/page errors');
  await b.close();
  console.log('\nPASSED: ' + passed + '  FAILED: ' + failed);
  if (failed) { fails.forEach(f => console.log('  - ' + f)); process.exit(1); }
})();
