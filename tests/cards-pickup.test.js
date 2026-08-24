/**
 * Hidden collectible cards in the levels.
 *
 * The card must be findable, unlock on touch, show what was found, and — the
 * part that is easy to get wrong — NOT come back next time you play that level.
 *
 * Run: python3 -m http.server 8765 &  node tests/cards-pickup.test.js
 */
const { chromium } = require('playwright');
const BASE = process.env.MARIO_URL || 'http://localhost:8765';
let passed = 0, failed = 0; const fails = [];
const ok = n => { passed++; console.log('  ✓ ' + n); };
const bad = (n, e) => { failed++; fails.push(n); console.log('  ✗ ' + n + ' — ' + e); };

// A stopped scene keeps its old properties, so waiting on `s.player` alone
// happily returns the PREVIOUS level's state. Wait for the scene to be active
// AND reporting the level we asked for.
const startLevel = async (p, lvl) => {
  await p.evaluate(n => {
    ['GameScene', 'MenuScene', 'WonderScene'].forEach(s => window.game.scene.stop(s));
    window.game.scene.start('GameScene', { level: n });
  }, lvl);
  await p.waitForFunction(n => {
    const s = window.game.scene.getScene('GameScene');
    return s && s.player && s.enemies && s.currentLevel === n && window.game.scene.isActive('GameScene');
  }, lvl, { timeout: 15000 });
  await p.evaluate(async () => { for (let i = 0; i < 20; i++) await new Promise(r => requestAnimationFrame(r)); });
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('app-mario:math-settings:v1', JSON.stringify({ add: { enabled: true, max: 10 }, subtract: { enabled: true, max: 10 }, multiply: { enabled: false, max: 10 }, divide: { enabled: false, max: 10 }, missingOperand: false, unlockAll: true, difficulty: 'easy' }));
  });
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.game && window.game.textures.exists('card-pickup'), null, { timeout: 20000 });

  const registry = await p.evaluate(() => ({
    total: window.Cards.TOTAL,
    levels: window.Cards.LIST.map(c => c.level).sort((a, b) => a - b),
    anim: window.game.anims.exists('card-shine')
  }));
  registry.total === 13 ? ok('registre 13 korteliu') : bad('korteliu skaicius', registry.total);
  registry.anim ? ok('card-shine animacija sukurta') : bad('nera card-shine animacijos', '');

  // ── Every card level actually contains its pickup ──────────────────────────
  const missing = [];
  for (const lvl of registry.levels) {
    if (lvl > 42) continue;
    await startLevel(p, lvl);
    const has = await p.evaluate(() => {
      const s = window.game.scene.getScene('GameScene');
      return { pickup: !!s.cardPickup, card: s.levelCard ? s.levelCard.id : null };
    });
    if (!has.pickup) missing.push(lvl);
  }
  missing.length === 0 ? ok('visi 13 lygiu turi savo kortele')
    : bad('truksta korteliu lygiuose', missing.join(', '));

  // ── Touching it unlocks, scores and shows the card ────────────────────────
  await startLevel(p, 1);
  const before = await p.evaluate(() => window.CardCollection.unlockedCount());
  const pick = await p.evaluate(async () => {
    const s = window.game.scene.getScene('GameScene');
    const id = s.levelCard.id;
    s.player.x = s.cardPickup.x;
    s.player.y = s.cardPickup.y;
    for (let i = 0; i < 30; i++) await new Promise(r => requestAnimationFrame(r));
    return { id: id, unlocked: window.CardCollection.isUnlocked(id), popup: !!s.cardPopup, gone: !s.cardPickup.active };
  });
  const after = await p.evaluate(() => window.CardCollection.unlockedCount());
  pick.unlocked ? ok('palietus kortele atsirakina (' + pick.id + ')') : bad('neatsirakino', pick.id);
  after === before + 1 ? ok('skaitiklis 0 → 1') : bad('skaitiklis', before + ' → ' + after);
  pick.popup ? ok('parodoma kortele su aprasymu') : bad('nerodomas popup', '');
  pick.gone ? ok('paimta kortele dingsta is lygio') : bad('kortele liko', '');

  // ── It does not come back ─────────────────────────────────────────────────
  await startLevel(p, 1);
  const again = await p.evaluate(() => {
    const s = window.game.scene.getScene('GameScene');
    return { pickup: !!s.cardPickup, card: s.levelCard };
  });
  !again.pickup ? ok('jau surinkta kortele nebeatsiranda') : bad('kortele grizo', 'turetu likti paimta');

  // ── Popup shows the real text, not a placeholder ──────────────────────────
  await p.evaluate(() => localStorage.removeItem('app-mario:cards:v1'));
  await startLevel(p, 11);
  const texts = await p.evaluate(async () => {
    const s = window.game.scene.getScene('GameScene');
    s.player.x = s.cardPickup.x; s.player.y = s.cardPickup.y;
    for (let i = 0; i < 30; i++) await new Promise(r => requestAnimationFrame(r));
    if (!s.cardPopup) return null;
    return s.cardPopup.list.filter(o => o.type === 'Text').map(o => o.text);
  });
  const joined = (texts || []).join(' | ');
  (texts && joined.indexOf('Donkey Kong') !== -1 && joined.indexOf('jungle') !== -1)
    ? ok('kortele rodo tikra angliska aprasyma')
    : bad('kortele be teksto', joined || '(nera popup)');
  joined.indexOf('/ 13') !== -1 ? ok('rodo progresa n / 13') : bad('nera progreso', joined);

  errs.length === 0 ? ok('nulis konsoles klaidu') : bad('konsoles klaidos', errs.join(' | '));

  await b.close();
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed) { fails.forEach(f => console.log('  - ' + f)); process.exit(1); }
})().catch(e => { console.error('FATAL: ' + e.message); process.exit(1); });
