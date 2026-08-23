/**
 * The collection gallery.
 *
 * A child must be able to see what they have found and — more motivating — what
 * they have not. Locked cards show as silhouettes with a "?", never as blanks.
 *
 * Run: python3 -m http.server 8765 &  node tests/cards-gallery.test.js
 */
const { chromium } = require('playwright');
const BASE = process.env.MARIO_URL || 'http://localhost:8765';
let passed = 0, failed = 0; const fails = [];
const ok = n => { passed++; console.log('  ✓ ' + n); };
const bad = (n, e) => { failed++; fails.push(n); console.log('  ✗ ' + n + ' — ' + e); };

const openGallery = async p => {
  await p.evaluate(() => {
    window.game.scene.stop('MenuScene');
    window.game.scene.start('CardsScene');
  });
  await p.waitForFunction(() => {
    const s = window.game.scene.getScene('CardsScene');
    return s && s.cardSlots && s.cardSlots.length && window.game.scene.isActive('CardsScene');
  }, null, { timeout: 15000 });
  await p.evaluate(async () => { for (let i = 0; i < 15; i++) await new Promise(r => requestAnimationFrame(r)); });
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 800, height: 620 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.game && window.game.textures.exists('card-pickup'), null, { timeout: 20000 });

  // ── The menu offers a way in ──────────────────────────────────────────────
  const menuBtn = await p.evaluate(() => {
    const s = window.game.scene.getScene('MenuScene');
    return !!s.cardsButtonZone;
  });
  menuBtn ? ok('meniu turi KORTELES mygtuka') : bad('nera mygtuko meniu', '');

  // ── Empty collection: 13 locked slots ─────────────────────────────────────
  await openGallery(p);
  const empty = await p.evaluate(() => {
    const s = window.game.scene.getScene('CardsScene');
    return {
      slots: s.cardSlots.length,
      locked: s.cardSlots.filter(x => !x.unlocked).length,
      counter: s.counterText ? s.counterText.text : null,
      questionMarks: s.cardSlots.filter(x => x.lockMark && x.lockMark.text === '?').length
    };
  });
  empty.slots === 13 ? ok('galerijoje 13 vietu') : bad('vietu skaicius', empty.slots);
  empty.locked === 13 ? ok('pradzioje visos uzrakintos') : bad('uzrakintu', empty.locked);
  empty.questionMarks === 13 ? ok('uzrakintos rodo "?"') : bad('klaustuku', empty.questionMarks);
  (empty.counter && empty.counter.indexOf('0') !== -1 && empty.counter.indexOf('13') !== -1)
    ? ok('skaitiklis rodo 0 / 13') : bad('skaitiklis', empty.counter);

  // ── Unlock two, reopen ────────────────────────────────────────────────────
  await p.evaluate(() => {
    window.CardCollection.unlock('yoshi');
    window.CardCollection.unlock('boo');
  });
  await openGallery(p);
  const some = await p.evaluate(() => {
    const s = window.game.scene.getScene('CardsScene');
    const unlocked = s.cardSlots.filter(x => x.unlocked);
    return {
      count: unlocked.length,
      ids: unlocked.map(x => x.id).sort(),
      counter: s.counterText.text,
      // an unlocked slot shows a real portrait, not a silhouette
      hasPortrait: unlocked.every(x => x.portrait && x.portrait.texture && x.portrait.texture.key !== '__MISSING'),
      silhouetteTint: s.cardSlots.filter(x => !x.unlocked).every(x => x.portrait && x.portrait.tintTopLeft === 0x000000)
    };
  });
  some.count === 2 ? ok('atrakintos 2 kortelės') : bad('atrakintu skaicius', some.count);
  JSON.stringify(some.ids) === JSON.stringify(['boo', 'yoshi']) ? ok('teisingos: boo, yoshi') : bad('id', some.ids.join(','));
  some.counter.indexOf('2') !== -1 ? ok('skaitiklis 2 / 13') : bad('skaitiklis', some.counter);
  some.hasPortrait ? ok('atrakintos rodo portreta') : bad('nera portreto', '');
  some.silhouetteTint ? ok('uzrakintos rodomos kaip siluetai') : bad('siluetai nepatamsinti', '');

  // ── Tapping an unlocked card shows its English description ────────────────
  const detail = await p.evaluate(async () => {
    const s = window.game.scene.getScene('CardsScene');
    const slot = s.cardSlots.find(x => x.id === 'boo');
    slot.zone.emit('pointerdown');
    for (let i = 0; i < 20; i++) await new Promise(r => requestAnimationFrame(r));
    if (!s.detailPanel) return null;
    return s.detailPanel.list.filter(o => o.type === 'Text').map(o => o.text).join(' | ');
  });
  (detail && detail.indexOf('Boo') !== -1 && detail.toLowerCase().indexOf('ghost') !== -1)
    ? ok('paspaudus rodomas angliskas aprasymas')
    : bad('nera aprasymo', detail || '(nera panelio)');

  // ── A locked card reveals nothing ─────────────────────────────────────────
  const lockedTap = await p.evaluate(async () => {
    const s = window.game.scene.getScene('CardsScene');
    if (s.detailPanel) s.closeDetail();
    const slot = s.cardSlots.find(x => !x.unlocked);
    slot.zone.emit('pointerdown');
    for (let i = 0; i < 15; i++) await new Promise(r => requestAnimationFrame(r));
    if (!s.detailPanel) return 'nera';
    return s.detailPanel.list.filter(o => o.type === 'Text').map(o => o.text).join(' | ');
  });
  (lockedTap === 'nera' || lockedTap.indexOf('?') !== -1)
    ? ok('uzrakinta kortele neatskleidzia veikejo')
    : bad('uzrakinta atskleide', lockedTap);

  // ── Back to the menu ──────────────────────────────────────────────────────
  const back = await p.evaluate(async () => {
    const s = window.game.scene.getScene('CardsScene');
    if (s.detailPanel) s.closeDetail();
    s.backZone.emit('pointerdown');
    for (let i = 0; i < 40; i++) await new Promise(r => requestAnimationFrame(r));
    return window.game.scene.isActive('MenuScene');
  });
  back ? ok('grizta i meniu') : bad('negrizo i meniu', '');

  errs.length === 0 ? ok('nulis konsoles klaidu') : bad('konsoles klaidos', errs.join(' | '));

  await b.close();
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed) { fails.forEach(f => console.log('  - ' + f)); process.exit(1); }
})().catch(e => { console.error('FATAL: ' + e.message); process.exit(1); });
