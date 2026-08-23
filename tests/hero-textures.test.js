/**
 * Hero sprite textures: every playable hero must produce a spritesheet with
 * EXACTLY the same frame layout as the built-in 'mario' sheet — 5 frames of
 * 128x128 (small) and 4 frames of 128x256 (big).
 *
 * Why the layout matters: BootScene builds each hero's animations with the same
 * generateFrameNumbers ranges it uses for Mario, and GameScene swaps textures
 * on the big/small transition. A sheet with a different frame count silently
 * yields blank or wrong frames instead of an error.
 *
 * Run: python3 -m http.server 8765 &  node tests/hero-textures.test.js
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
  await p.waitForFunction(() => window.game && window.game.textures && window.game.textures.exists('hero-peach'),
    null, { timeout: 20000 });

  const info = await p.evaluate(() => {
    const T = window.game.textures;
    const ids = window.Characters.PLAYABLE_IDS;
    const missing = [], wrongSmall = [], wrongBig = [], blank = [];

    ids.forEach(id => {
      const smallKey = 'hero-' + id, bigKey = 'hero-' + id + '-big';
      if (!T.exists(smallKey) || !T.exists(bigKey)) { missing.push(id); return; }

      const s = T.get(smallKey), sImg = s.getSourceImage();
      if (sImg.width !== 640 || sImg.height !== 128 || s.frameTotal < 5) {
        wrongSmall.push(id + ':' + sImg.width + 'x' + sImg.height + '/' + s.frameTotal);
      }
      const g = T.get(bigKey), gImg = g.getSourceImage();
      if (gImg.width !== 512 || gImg.height !== 256 || g.frameTotal < 4) {
        wrongBig.push(id + ':' + gImg.width + 'x' + gImg.height + '/' + g.frameTotal);
      }

      // Every frame must actually contain pixels — a silhouette that draws
      // nothing is the failure mode a frame-count check cannot catch.
      const c = document.createElement('canvas');
      c.width = 640; c.height = 128;
      const cx = c.getContext('2d');
      cx.drawImage(sImg, 0, 0);
      for (let f = 0; f < 5; f++) {
        const d = cx.getImageData(f * 128, 0, 128, 128).data;
        let opaque = 0;
        for (let i = 3; i < d.length; i += 4) if (d[i] > 40) opaque++;
        if (opaque < 500) blank.push(id + ' frame ' + f + ' (' + opaque + 'px)');
      }
    });
    return { ids, missing, wrongSmall, wrongBig, blank };
  });

  info.missing.length === 0 ? ok('visos 8 heroju teksturos sugeneruotos (small + big)')
    : bad('visos 8 heroju teksturos', 'truksta: ' + info.missing.join(', '));
  info.wrongSmall.length === 0 ? ok('small sheet = 5 kadrai po 128x128')
    : bad('small sheet layout', info.wrongSmall.join(', '));
  info.wrongBig.length === 0 ? ok('big sheet = 4 kadrai po 128x256')
    : bad('big sheet layout', info.wrongBig.join(', '));
  info.blank.length === 0 ? ok('nei vienas kadras nera tuscias')
    : bad('tusti kadrai', info.blank.join(', '));
  errs.length === 0 ? ok('nulis konsoles klaidu') : bad('konsoles klaidos', errs.join(' | '));

  await b.close();
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed) { fails.forEach(f => console.log('  - ' + f)); process.exit(1); }
})().catch(e => { console.error('FATAL: ' + e.message); process.exit(1); });
