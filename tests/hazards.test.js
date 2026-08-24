/**
 * Hard-difficulty hazards: rain, lightning, wind, chaser, level timer.
 *
 * Two things matter most and both are tested here:
 *   1. On easy/medium/harder NOTHING appears. A younger child must never meet
 *      any of this.
 *   2. Every threat is survivable. Rain under a roof does not hurt; lightning
 *      under a roof does not hurt; the storm never strikes the instant it
 *      starts. A hazard that cannot be dodged is unfair, not hard.
 *
 * Run: python3 -m http.server 8765 &  node tests/hazards.test.js
 */
const { chromium } = require('playwright');
const BASE = process.env.MARIO_URL || 'http://localhost:8765';
let passed = 0, failed = 0; const fails = [];
const ok = n => { passed++; console.log('  ✓ ' + n); };
const bad = (n, e) => { failed++; fails.push(n); console.log('  ✗ ' + n + ' — ' + e); };

const load = async (p, difficulty) => {
  await p.evaluate(d => {
    // MathSettings rejects any shape it does not recognise and silently falls
    // back to easy — which would make every hazard assertion below vacuous.
    localStorage.setItem('app-mario:math-settings:v1', JSON.stringify({
      add: { enabled: true, max: 10 }, subtract: { enabled: true, max: 10 },
      multiply: { enabled: false, max: 10 }, divide: { enabled: false, max: 10 },
      missingOperand: false, unlockAll: true, difficulty: d }));
  }, difficulty);
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.game && window.Hazards, null, { timeout: 20000 });
  await p.evaluate(() => {
    ['MenuScene', 'GameScene', 'WonderScene', 'WinScene'].forEach(s => window.game.scene.stop(s));
    window.game.scene.start('GameScene', { level: 1, lives: 5 });
  });
  await p.waitForFunction(() => {
    const s = window.game.scene.getScene('GameScene');
    return s && s.player && s.player.body && s.currentLevel === 1 && window.game.scene.isActive('GameScene');
  }, null, { timeout: 20000 });
  await p.evaluate(async () => { for (let i = 0; i < 20; i++) await new Promise(r => requestAnimationFrame(r)); });
};

/** Drive the scene by hand: fixed steps, nothing drawn, ~23x real time. */
const runFrames = (p, n) => p.evaluate(async count => {
  const game = window.game;
  game.scene.scenes.forEach(sc => sc.sys && sc.sys.setVisible && sc.sys.setVisible(false));
  if (game.loop.running) game.loop.stop();
  window.__clock = window.__clock || game.loop.time;
  for (let i = 0; i < count; i++) { window.__clock += 16.6667; game.loop.step(window.__clock); }
}, n);

(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });

  // ── Nothing on the gentler difficulties ───────────────────────────────────
  for (const d of ['easy', 'medium', 'harder']) {
    await load(p, d);
    const off = await p.evaluate(() => {
      const s = window.game.scene.getScene('GameScene');
      return { active: window.Hazards.isActive(s), state: !!(s._hazards && s._hazards.enabled) };
    });
    (!off.active && !off.state) ? ok(d + ': jokiu gresmiu') : bad(d + ': gresmes ijungtos', JSON.stringify(off));
  }

  // ── On hard they exist ────────────────────────────────────────────────────
  await load(p, 'hard');
  const applied = await p.evaluate(() => window.MathSettings.load().difficulty);
  applied === 'hard' ? ok('nustatymai tikrai pritaikyti (hard)') : bad('nustatymai negaliojo', applied);
  const on = await p.evaluate(() => {
    const s = window.game.scene.getScene('GameScene');
    return { active: window.Hazards.isActive(s), phase: s._hazards.phase, time: s._hazards.timeLeft };
  });
  on.active ? ok('hard: gresmes ijungtos') : bad('hard: neijungtos', '');
  on.phase === 'calm' ? ok('lygis prasideda ramybeje') : bad('pradine faze', on.phase);
  on.time > 299000 ? ok('laikmatis ~300 s (' + Math.round(on.time / 1000) + ')') : bad('laikmatis', on.time);

  // ── The storm announces itself before it can hurt ─────────────────────────
  const cycle = await p.evaluate(() => {
    const s = window.game.scene.getScene('GameScene');
    const seen = [];
    s.events.on('hazard', e => { if (['warning', 'storm', 'calm', 'soaked'].indexOf(e.type) !== -1) seen.push(e.type); });
    s._hazards.phaseMs = 50;                 // jump to the end of the calm
    window.__seen = seen;
    return true;
  });
  await runFrames(p, 60);                    // ~1s: warning must have started
  const afterWarn = await p.evaluate(() => ({ seen: window.__seen.slice(), phase: window.game.scene.getScene('GameScene')._hazards.phase }));
  afterWarn.phase === 'warning' ? ok('po ramybes ateina ISPEJIMAS, ne smugis') : bad('faze po ramybes', afterWarn.phase);
  afterWarn.seen.indexOf('soaked') === -1 ? ok('per ispejima niekas nesuslampa') : bad('ispejimas jau kenkia', '');

  // ── Rain: a roof protects, open sky does not ─────────────────────────────
  const shelter = await p.evaluate(async () => {
    const s = window.game.scene.getScene('GameScene');
    // Force the storm
    s._hazards.phase = 'storm'; s._hazards.phaseMs = 600000; s._hazards.rainTick = 10;
    s.isInvincible = false;
    const roofed = window.Hazards.underRoof(s);
    return { roofed };
  });

  const openSky = await p.evaluate(async () => {
    const s = window.game.scene.getScene('GameScene');
    // Put the player where nothing is overhead
    while (window.Hazards.underRoof(s) && s.player.x < 8000) s.player.x += 32;
    const before = s.lives;
    s._hazards.rainTick = 10;
    s.isInvincible = false;
    return { before, roof: window.Hazards.underRoof(s) };
  });
  await runFrames(p, 6);
  const soaked = await p.evaluate(() => {
    const s = window.game.scene.getScene('GameScene');
    return { lives: s.lives, dead: s.isDead, big: s.isBig };
  });
  (!openSky.roof && (soaked.lives < openSky.before || soaked.dead))
    ? ok('po atviru dangumi lietus atima gyvybe')
    : bad('lietus nekenkia', JSON.stringify({ openSky, soaked }));

  // ── Under a roof the same storm is harmless ──────────────────────────────
  await load(p, 'hard');
  const roofed = await p.evaluate(async () => {
    const s = window.game.scene.getScene('GameScene');
    s.isDead = false;
    // Find a spot with a roof
    let found = false;
    for (let x = 200; x < 9000; x += 16) {
      s.player.x = x;
      if (window.Hazards.underRoof(s)) { found = true; break; }
    }
    s._hazards.phase = 'storm'; s._hazards.phaseMs = 600000; s._hazards.rainTick = 10;
    s.isInvincible = false;
    return { found, x: s.player.x, before: s.lives };
  });
  await runFrames(p, 120);
  const afterRoof = await p.evaluate(() => {
    const s = window.game.scene.getScene('GameScene');
    return { lives: s.lives, dead: s.isDead };
  });
  roofed.found ? ok('lygyje yra kur pasislepti (x=' + Math.round(roofed.x) + ')') : bad('nerasta priedanga', '');
  (afterRoof.lives === roofed.before && !afterRoof.dead)
    ? ok('po stogu lietus nekenkia')
    : bad('po stogu vis tiek kenkia', JSON.stringify(afterRoof));

  // ── Lightning warns first, and a roof stops it too ───────────────────────
  // The player is pinned under the roof on every step: left to gravity they
  // slide off the ledge and the test measures the fall, not the lightning.
  const boltUnderRoof = await p.evaluate(async () => {
    const s = window.game.scene.getScene('GameScene');
    const game = window.game;
    s.isDead = false; s.isBig = false; s.isInvincible = false;

    let roofX = null;
    for (let x = 200; x < 9000; x += 8) {
      s.player.x = x;
      if (window.Hazards.underRoof(s)) { roofX = x; break; }
    }
    if (roofX === null) return { noRoof: true };

    const roofY = s.player.y;
    const events = [];
    s.events.on('hazard', e => { if (e.type === 'boltWarning' || e.type === 'bolt') events.push(e); });

    s._hazards.phase = 'storm'; s._hazards.phaseMs = 600000;
    s._hazards.rainTick = 600000;          // rain off, lightning only
    s._hazards.bolt = null; s._hazards.boltMs = 10;

    const before = s.lives;
    let warnedFirst = null;
    for (let i = 0; i < 90; i++) {
      s.player.x = roofX; s.player.y = roofY;      // hold the shelter
      s.player.body.setVelocity(0, 0);
      window.__clock += 16.6667;
      game.loop.step(window.__clock);
      if (warnedFirst === null && events.length) warnedFirst = events[0].type;
      if (s._hazards.bolt) s._hazards.bolt.x = roofX;   // aim it straight at us
    }
    return { roofX, warnedFirst, events: events.map(e => e.type + (e.hit ? ':pataike' : ':pro sali')),
             before, after: s.lives, dead: s.isDead };
  });

  if (boltUnderRoof.noRoof) bad('zaibo testas', 'lygyje nerasta priedanga');
  else {
    boltUnderRoof.warnedFirst === 'boltWarning'
      ? ok('zaibas pirma parodo seseli') : bad('zaibas be ispejimo', boltUnderRoof.events.join(' '));
    (boltUnderRoof.after === boltUnderRoof.before && !boltUnderRoof.dead)
      ? ok('po stogu zaibas nepataiko (' + boltUnderRoof.events.join(' ') + ')')
      : bad('zaibas pataike po stogu', JSON.stringify(boltUnderRoof));
  }

  // ── ...but in the open it does ───────────────────────────────────────────
  await load(p, 'hard');
  const boltOpen = await p.evaluate(async () => {
    const s = window.game.scene.getScene('GameScene');
    const game = window.game;
    s.isDead = false; s.isBig = false; s.isInvincible = false;
    while (window.Hazards.underRoof(s) && s.player.x < 8000) s.player.x += 32;
    const openX = s.player.x, openY = s.player.y;

    s._hazards.phase = 'storm'; s._hazards.phaseMs = 600000;
    s._hazards.rainTick = 600000;
    s._hazards.bolt = null; s._hazards.boltMs = 10;

    const before = s.lives;
    let hit = false;
    s.events.on('hazard', e => { if (e.type === 'bolt' && e.hit) hit = true; });
    for (let i = 0; i < 90; i++) {
      s.player.x = openX; s.player.y = openY;
      s.player.body.setVelocity(0, 0);
      window.__clock += 16.6667;
      game.loop.step(window.__clock);
      if (s._hazards.bolt) s._hazards.bolt.x = openX;
    }
    return { hit, before, after: s.lives, dead: s.isDead };
  });
  (boltOpen.hit && (boltOpen.after < boltOpen.before || boltOpen.dead))
    ? ok('po atviru dangumi zaibas pataiko')
    : bad('zaibas nepataike atvirame lauke', JSON.stringify(boltOpen));

  // ── Wind pushes ──────────────────────────────────────────────────────────
  await load(p, 'hard');
  const wind = await p.evaluate(async () => {
    const s = window.game.scene.getScene('GameScene');
    s._hazards.windDir = 1;
    const samples = [];
    for (let i = 0; i < 3; i++) {
      window.__clock = (window.__clock || window.game.loop.time) + 16.6667;
      window.game.loop.step(window.__clock);
      samples.push(Math.round(s.player.body.velocity.x));
    }
    return { dir: s._hazards.windDir, samples, force: window.Hazards.TUNING.WIND_FORCE };
  });
  wind.samples.some(v => Math.abs(v - wind.force) < 3)
    ? ok('vejas stumia stovinti zaideja (' + wind.samples.join(',') + ')')
    : bad('vejas neveikia', JSON.stringify(wind));

  // ── Chaser arrives late and freezes when watched ─────────────────────────
  const chaser = await p.evaluate(async () => {
    const s = window.game.scene.getScene('GameScene');
    const early = !!s._hazards.chaser;
    s._hazards.chaserMs = 10;
    for (let i = 0; i < 5; i++) { window.__clock += 16.6667; window.game.loop.step(window.__clock); }
    const c = s._hazards.chaser;
    return { early, arrived: !!c, behind: c ? c.x < s.player.x : null, speed: c ? c.chaseSpeed : null };
  });
  !chaser.early ? ok('persekiotojas neateina is karto') : bad('persekiotojas jau buvo', '');
  (chaser.arrived && chaser.behind) ? ok('persekiotojas atsiranda uz nugaros') : bad('persekiotojas', JSON.stringify(chaser));
  chaser.speed === 170 ? ok('persekiotojo greitis 170 (85% zaidejo)') : bad('persekiotojo greitis', chaser.speed);

  // ── Timer runs out ───────────────────────────────────────────────────────
  const timer = await p.evaluate(async () => {
    const s = window.game.scene.getScene('GameScene');
    s.isDead = false; s.isBig = false;
    s._hazards.timeLeft = 30;
    let fired = false;
    s.events.on('hazard', e => { if (e.type === 'timeup') fired = true; });
    for (let i = 0; i < 6; i++) { window.__clock += 16.6667; window.game.loop.step(window.__clock); }
    return { fired, left: s._hazards.timeLeft };
  });
  timer.fired ? ok('laikui pasibaigus ivyksta timeup') : bad('laikmatis nesuveike', JSON.stringify(timer));

  errs.length === 0 ? ok('nulis konsoles klaidu') : bad('konsoles klaidos', errs.slice(0, 3).join(' | '));

  await b.close();
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed) { fails.forEach(f => console.log('  - ' + f)); process.exit(1); }
})().catch(e => { console.error('FATAL: ' + e.message); process.exit(1); });
