/**
 * The menu hero picker: tapping a character must select it, persist it, and
 * be the character you actually play as.
 *
 * Run: python3 -m http.server 8765 &  node tests/hero-picker.test.js
 */
const { chromium } = require('playwright');
const BASE = process.env.MARIO_URL || 'http://localhost:8765';
let passed = 0, failed = 0; const fails = [];
const ok = n => { passed++; console.log('  ✓ ' + n); };
const bad = (n, e) => { failed++; fails.push(n); console.log('  ✗ ' + n + ' — ' + e); };

const menuReady = p => p.waitForFunction(
  () => { const s = window.game && window.game.scene.getScene('MenuScene'); return s && s.heroButtons && s.heroButtons.length; },
  null, { timeout: 20000 });

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 800, height: 620 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: 'domcontentloaded' });
  await menuReady(p);

  const count = await p.evaluate(() => window.game.scene.getScene('MenuScene').heroButtons.length);
  count === 8 ? ok('meniu rodo visus 8 veikejus') : bad('veikeju skaicius', count);

  const initial = await p.evaluate(() => window.CharacterSettings.selectedId());
  initial === 'mario' ? ok('be pasirinkimo pazymetas Mario') : bad('pradinis pasirinkimas', initial);

  // Tap Yoshi
  await p.evaluate(() => {
    const s = window.game.scene.getScene('MenuScene');
    s.heroButtons.find(b => b.id === 'yoshi').zone.emit('pointerdown');
  });
  const after = await p.evaluate(() => window.CharacterSettings.selectedId());
  after === 'yoshi' ? ok('paspaudus Yoshi jis issaugomas') : bad('pasirinkimas po paspaudimo', after);

  // The selected one must be visibly bigger than the rest — that is the only
  // cue a child who cannot read gets.
  const scales = await p.evaluate(() => {
    const s = window.game.scene.getScene('MenuScene');
    return s.heroButtons.map(b => ({ id: b.id, scale: b.sprite.scaleX }));
  });
  const sel = scales.find(s => s.id === 'yoshi');
  const others = scales.filter(s => s.id !== 'yoshi');
  others.every(o => sel.scale > o.scale * 1.15)
    ? ok('pasirinktas veikejas vizualiai isskirtas')
    : bad('vizualus isskyrimas', JSON.stringify(scales));

  // Survives a reload and reaches the game
  await p.reload({ waitUntil: 'domcontentloaded' });
  await menuReady(p);
  const persisted = await p.evaluate(() => window.CharacterSettings.selectedId());
  persisted === 'yoshi' ? ok('pasirinkimas islieka perkrovus') : bad('islikimas', persisted);

  await p.evaluate(() => { window.game.scene.stop('MenuScene'); window.game.scene.start('GameScene', { level: 1 }); });
  await p.waitForFunction(() => {
    const s = window.game.scene.getScene('GameScene');
    return s && s.player && s.player.texture;
  }, null, { timeout: 15000 });
  const tex = await p.evaluate(() => window.game.scene.getScene('GameScene').player.texture.key);
  tex === 'hero-yoshi' ? ok('zaidime valdomas butent Yoshi') : bad('zaidimo tekstura', tex);

  errs.length === 0 ? ok('nulis konsoles klaidu') : bad('konsoles klaidos', errs.join(' | '));

  await b.close();
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed) { fails.forEach(f => console.log('  - ' + f)); process.exit(1); }
})().catch(e => { console.error('FATAL: ' + e.message); process.exit(1); });
