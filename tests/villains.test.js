/**
 * The five new villains: they must spawn, behave differently from each other,
 * and above all not break the existing enemies.
 *
 * Boo is the centrepiece: he freezes when the player looks at him and chases
 * when they turn away, and he cannot be stomped. That is the behaviour from his
 * character bio and the one that makes children pay attention.
 *
 * Run: python3 -m http.server 8765 &  node tests/villains.test.js
 */
const { chromium } = require('playwright');
const BASE = process.env.MARIO_URL || 'http://localhost:8765';
let passed = 0, failed = 0; const fails = [];
const ok = n => { passed++; console.log('  ✓ ' + n); };
const bad = (n, e) => { failed++; fails.push(n); console.log('  ✗ ' + n + ' — ' + e); };

const frames = (p, n) => p.evaluate(async k => {
  for (let i = 0; i < k; i++) await new Promise(r => requestAnimationFrame(r));
}, n);

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForFunction(() => window.game && window.game.textures.exists('boo'), null, { timeout: 20000 });

  const tex = await p.evaluate(() => ['wario', 'waluigi', 'boo', 'bowser-jr', 'dk', 'dk-barrel']
    .filter(k => !window.game.textures.exists(k)));
  tex.length === 0 ? ok('visos blogieciu teksturos sugeneruotos') : bad('teksturos', 'truksta: ' + tex.join(', '));

  const anims = await p.evaluate(() => {
    const need = ['wario-walk', 'waluigi-walk', 'boo-walk', 'boo-shy', 'bowser-jr-walk', 'dk-walk',
                  'wario-squish', 'bowser-jr-squish', 'dk-barrel-roll'];
    return need.filter(a => !window.game.anims.exists(a));
  });
  anims.length === 0 ? ok('visos blogieciu animacijos sukurtos') : bad('animacijos', 'truksta: ' + anims.join(', '));

  await p.evaluate(() => { window.game.scene.stop('MenuScene'); window.game.scene.start('GameScene', { level: 1 }); });
  await p.waitForFunction(() => {
    const s = window.game.scene.getScene('GameScene');
    return s && s.player && s.enemies;
  }, null, { timeout: 15000 });
  await frames(p, 20);

  // ── Boo freezes under the player's gaze ───────────────────────────────────
  const gaze = await p.evaluate(async () => {
    const s = window.game.scene.getScene('GameScene');
    const boo = window.Villains.spawn(s, 'boo', s.player.x + 200, s.player.y);
    const travel = async facingRight => {
      boo.x = s.player.x + 200; boo.y = s.player.y;
      s.player.setFlipX(!facingRight);              // flipX true = facing left
      const x0 = boo.x;
      for (let i = 0; i < 40; i++) await new Promise(r => requestAnimationFrame(r));
      return Math.abs(boo.x - x0);
    };
    const watched = await travel(true);             // player looks toward Boo
    const away = await travel(false);               // player turns away
    boo.destroy();
    return { watched, away };
  });
  console.log('  Boo pajudejo: ziurint ' + Math.round(gaze.watched) + 'px, nusisukus ' + Math.round(gaze.away) + 'px');
  gaze.watched < 3 ? ok('Boo sustingsta, kai i ji ziuri') : bad('Boo nesustingsta', gaze.watched);
  gaze.away > 15 ? ok('Boo vejasi, kai nusisukama') : bad('Boo nesiveja', gaze.away);

  // ── Boo cannot be stomped ─────────────────────────────────────────────────
  const stomp = await p.evaluate(() => {
    const s = window.game.scene.getScene('GameScene');
    const boo = window.Villains.spawn(s, 'boo', s.player.x + 300, s.player.y);
    const verdict = window.Villains.onStomp(s, boo);
    boo.destroy();
    return verdict;
  });
  stomp === 'ignore' ? ok('Boo neuzminamas (onStomp = ignore)') : bad('Boo uzminamas', stomp);

  // ── A Boo you are looking at must be safe to pass ────────────────────────
  // He freezes and covers his eyes when watched. If he still hurt on contact he
  // would be an impassable wall: you cannot stomp him (that is the point), and
  // landing on him counts as a stomp, so there would be no way past him at all.
  const frozenSafe = await p.evaluate(async () => {
    const s = window.game.scene.getScene('GameScene');
    const livesBefore = s.lives;
    s.isInvincible = false;
    s.player.setFlipX(false);                      // facing right
    const boo = window.Villains.spawn(s, 'boo', s.player.x + 60, s.player.y);
    for (let i = 0; i < 10; i++) await new Promise(r => requestAnimationFrame(r));
    const frozen = boo.isFrozen;
    // walk straight into him while watching him
    for (let i = 0; i < 25; i++) {
      boo.x = s.player.x + 4; boo.y = s.player.y;
      await new Promise(r => requestAnimationFrame(r));
    }
    const result = { frozen: frozen, livesBefore: livesBefore, livesAfter: s.lives, dead: s.isDead };
    if (boo.active) boo.destroy();
    return result;
  });
  frozenSafe.frozen ? ok('Boo sustingo, kai i ji ziurima') : bad('Boo nesustingo', '');
  (frozenSafe.livesAfter === frozenSafe.livesBefore && !frozenSafe.dead)
    ? ok('sustinges Boo nekenkia — pro ji galima praeiti')
    : bad('sustinges Boo vis tiek atima gyvybe', JSON.stringify(frozenSafe));

  // ── Bowser Jr. takes two stomps ───────────────────────────────────────────
  const jr = await p.evaluate(() => {
    const s = window.game.scene.getScene('GameScene');
    const e = window.Villains.spawn(s, 'bowser-jr', s.player.x + 300, s.player.y);
    const first = window.Villains.onStomp(s, e);
    const second = window.Villains.onStomp(s, e);
    e.destroy();
    return { first, second };
  });
  (jr.first === 'damage' && jr.second === 'kill')
    ? ok('Bowser Jr. atlaiko pirma uzminima, krenta nuo antro')
    : bad('Bowser Jr. HP', JSON.stringify(jr));

  // ── Wario charges when he sees you ────────────────────────────────────────
  const wario = await p.evaluate(async () => {
    const s = window.game.scene.getScene('GameScene');
    const w = window.Villains.spawn(s, 'wario', s.player.x + 700, s.player.y);
    for (let i = 0; i < 6; i++) await new Promise(r => requestAnimationFrame(r));
    const calm = Math.abs(w.body.velocity.x);
    w.x = s.player.x + 100;                       // now within sight
    for (let i = 0; i < 6; i++) await new Promise(r => requestAnimationFrame(r));
    const charge = Math.abs(w.body.velocity.x);
    w.destroy();
    return { calm, charge };
  });
  wario.charge > wario.calm * 1.5
    ? ok('Wario ismeta greiti pamates zaideja (' + Math.round(wario.calm) + ' → ' + Math.round(wario.charge) + ')')
    : bad('Wario nepuola', JSON.stringify(wario));

  // ── DK throws barrels ─────────────────────────────────────────────────────
  const dk = await p.evaluate(async () => {
    const s = window.game.scene.getScene('GameScene');
    const d = window.Villains.spawn(s, 'dk', s.player.x + 250, s.player.y);
    const count = () => s.enemies.getChildren().filter(e => e.enemyType === 'dk-barrel').length;
    const before = count();
    // Fire the next throw now. Waiting out the real 2.6s timer made this flaky:
    // this container renders at ~4fps, so how much game time 300 animation
    // frames buy varies run to run. The interval is not what is under test.
    d._throwTimer = 20;
    let after = before, stayedPut = true;
    // Stop as soon as a barrel exists: left running, it rolls into the player,
    // costs a life and restarts the scene out from under the assertions.
    for (let i = 0; i < 300; i++) {
      await new Promise(r => requestAnimationFrame(r));
      if (!d.body) break;
      if (Math.abs(d.body.velocity.x) >= 1) stayedPut = false;
      after = count();
      if (after > before) break;
    }
    if (d.body) d.destroy();
    s.enemies.getChildren().filter(e => e.enemyType === 'dk-barrel').forEach(e => e.destroy());
    return { before, after, stayedPut };
  });
  dk.after > dk.before ? ok('DK ridena statines (' + dk.before + ' → ' + dk.after + ')') : bad('DK nemeta statiniu', JSON.stringify(dk));
  dk.stayedPut ? ok('DK stovi vietoje') : bad('DK vaiksto', 'turetu stoveti');

  // ── The old enemies still work ────────────────────────────────────────────
  const old = await p.evaluate(async () => {
    const s = window.game.scene.getScene('GameScene');
    const g = s.enemies.getChildren().find(e => e.enemyType === 'goomba' && e.active);
    if (!g) return { skipped: true };
    const x0 = g.x;
    for (let i = 0; i < 30; i++) await new Promise(r => requestAnimationFrame(r));
    return { skipped: false, moved: Math.abs(g.x - x0) };
  });
  old.skipped ? bad('Goomba regresija', 'lygyje nerasta goombos')
    : (old.moved > 5 ? ok('Goomba vis dar patruliuoja') : bad('Goomba nustojo judeti', old.moved));

  errs.length === 0 ? ok('nulis konsoles klaidu') : bad('konsoles klaidos', errs.join(' | '));

  await b.close();
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed) { fails.forEach(f => console.log('  - ' + f)); process.exit(1); }
})().catch(e => { console.error('FATAL: ' + e.message); process.exit(1); });
