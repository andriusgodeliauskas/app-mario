/**
 * Design invariants for the gravity room (47 NEON UNDERGROUND).
 *
 * Flipping gravity is the room's whole identity, but as authored it could not be
 * played: the first floor gap came BEFORE the first pad and was too wide to
 * jump, and both DOWN pads sat past the end of their ceiling, so a flipped
 * player had no way back down. Flipping with nothing overhead throws you out of
 * the world and kills you outright.
 *
 * These rules keep it playable AND keep the mechanic:
 *   1. Every floor gap is crossable on foot — nobody is ever hard-stuck.
 *   2. Every UP pad has a ceiling where the flip actually lands you.
 *   3. Every DOWN pad sits over a ceiling, so a flip can always be undone.
 *   4. At least keyGoal keys sit on the floor route, so the door opens without
 *      mastering the flip; the rest are the reward for mastering it.
 *
 * Run: python3 -m http.server 8765 &  node tests/wonder-gravity.test.js
 */
const { chromium } = require('playwright');
const BASE = process.env.MARIO_URL || 'http://localhost:8765';
const SETTINGS = { add: { enabled: true, max: 10 }, subtract: { enabled: true, max: 10 },
  multiply: { enabled: false, max: 10 }, divide: { enabled: false, max: 10 },
  missingOperand: false, unlockAll: true, difficulty: 'easy' };

let passed = 0, failed = 0; const fails = [];
const ok = n => { passed++; console.log('  ✓ ' + n); };
const bad = (n, e) => { failed++; fails.push(n); console.log('  ✗ ' + n + ' — ' + e); };

// Measured in WonderScene, not assumed.
const RUN_JUMP = 270, RISE = 165, DRIFT = 225, SPEED = 205;

(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.evaluate(s => localStorage.setItem('app-mario:math-settings:v1', JSON.stringify(s)), SETTINGS);
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.game && window.LEVEL_GENERATORS, null, { timeout: 30000 });

  const d = await p.evaluate(() => window.LEVEL_GENERATORS[47]());

  const floors = d.ground.filter(g => g.y === 544).sort((a, b) => a.x - b.x);
  const ceilings = d.ground.filter(g => g.y < 100).sort((a, b) => a.x - b.x);

  // ── 1. Every floor gap crossable on foot ─────────────────────────────────
  const wide = [];
  for (let i = 0; i < floors.length - 1; i++) {
    const gap = floors[i + 1].x - (floors[i].x + floors[i].width);
    if (gap > RUN_JUMP * 0.85) wide.push(`${floors[i].x + floors[i].width}->${floors[i + 1].x} = ${gap}px`);
  }
  wide.length === 0
    ? ok(`visi ${floors.length - 1} grindu tarpai perzengiami pesciomis`)
    : bad('per platus tarpai', wide.join(', '));

  // ── 2. Every UP pad lands you on a ceiling ───────────────────────────────
  const ups = d.gravityZones.filter(z => z.axis === 'up');
  const strandedUp = ups.filter(z => {
    const landing = z.x + DRIFT;
    return !ceilings.some(c => landing >= c.x && landing <= c.x + c.width);
  }).map(z => `UP@${z.x} -> ${z.x + DRIFT}`);
  strandedUp.length === 0
    ? ok(`visi ${ups.length} UP padai nuneša ant lubu`)
    : bad('UP padas meta i tustuma (mirtis)', strandedUp.join(', '));

  // ── 3. Every DOWN pad is над a ceiling you can walk to ───────────────────
  const downs = d.gravityZones.filter(z => z.axis === 'down');
  const strandedDown = downs.filter(z =>
    !ceilings.some(c => z.x >= c.x && z.x <= c.x + c.width)).map(z => 'DOWN@' + z.x);
  strandedDown.length === 0
    ? ok(`visi ${downs.length} DOWN padai yra virs lubu`)
    : bad('DOWN padas uz lubu ribu — nera kaip nusileisti', strandedDown.join(', '));

  // ── 4. Every DOWN pad drops you onto floor, not into a pit ───────────────
  const badDrop = downs.filter(z => {
    const landing = z.x + DRIFT;
    return !floors.some(f => landing >= f.x && landing <= f.x + f.width);
  }).map(z => `DOWN@${z.x} -> ${z.x + DRIFT}`);
  badDrop.length === 0
    ? ok('kiekvienas DOWN padas nuleidzia ant grindu')
    : bad('DOWN padas meta i duobe', badDrop.join(', '));

  // ── 5. keyGoal keys reachable without ever flipping ──────────────────────
  const onFloorRoute = d.keys.filter(k => {
    // reachable if some floor or a platform standing within jump range of a
    // floor puts the key inside a jump arc
    const fromFloor = 544 - RISE;
    if (k.y >= fromFloor) return true;
    return d.platforms.some(pl => {
      const standable = floors.some(f =>
        pl.x + pl.width > f.x - RUN_JUMP && pl.x < f.x + f.width + RUN_JUMP && (544 - pl.y) <= RISE);
      return standable && k.x >= pl.x - 60 && k.x <= pl.x + pl.width + 60 && k.y >= pl.y - RISE;
    });
  });
  const keyReport = d.keys.map(k => {
    const hit = onFloorRoute.indexOf(k) !== -1;
    const pl = d.platforms.filter(pp => k.x >= pp.x - 60 && k.x <= pp.x + pp.width + 60)
      .map(pp => `pl@${pp.x},y${pp.y}(kilimas ${544 - pp.y})`).join('/') || 'nera platformos';
    return `${k.x},${k.y} ${hit ? 'OK' : 'ne'} [${pl}]`;
  });
  console.log('    raktai: ' + keyReport.join(' | '));

  onFloorRoute.length >= d.keyGoal
    ? ok(`${onFloorRoute.length} raktai pasiekiami be apvertimo (reikia ${d.keyGoal})`)
    : bad('per mazai pasiekiamu raktu', `${onFloorRoute.length} < ${d.keyGoal}`);

  d.keys.length > d.keyGoal
    ? ok(`apvertimas atveria ${d.keys.length - d.keyGoal} papildomus raktus`)
    : bad('apvertimas neduoda nieko papildomo', '');

  errs.length === 0 ? ok('nulis konsoles klaidu') : bad('konsoles klaidos', errs.slice(0, 2).join(' | '));

  await b.close();
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed) { fails.forEach(f => console.log('  - ' + f)); process.exit(1); }
})().catch(e => { console.error('FATAL: ' + e.message); process.exit(1); });
