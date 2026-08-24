/**
 * Playthrough bot — can a level actually be FINISHED, not just validated?
 *
 * The level validator only checks the tilemap (gaps, ground, a flagpole). It
 * knows nothing about vertical reach, enemies standing where you must land, or
 * the Wonder rooms' own mechanics. This drives the game with real DOM keyboard
 * events and reports how far it gets.
 *
 * What it proves: a level is not a dead end.
 * What it does NOT prove: that a level is fun, fair, or beatable by a child.
 * A failure here is a place to LOOK, not automatically a bug — some rooms need
 * mechanics (magnets, the mirror twin) no simple bot will ever use.
 *
 * It does NOT run in real time. This container software-renders Phaser at ~4fps,
 * which would hand the physics 250ms steps and produce failures caused by the
 * environment rather than the level. Instead every scene is hidden (an invisible
 * scene still updates but is not drawn) and Phaser's loop is pumped manually at a
 * fixed 16.67ms — deterministic, and about 23x faster than real time.
 *
 * Run: python3 -m http.server 8765 &  node tests/playthrough.test.js [levels...]
 */
const { chromium } = require('playwright');
const BASE = process.env.MARIO_URL || 'http://localhost:8765';
const HERO = process.env.HERO || 'mario';

// Everything this work touched, plus every Wonder room.
const DEFAULT_LEVELS = [1, 3, 5, 7, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 31, 32, 38, 40, 42,
                        43, 44, 45, 46, 47, 48, 49, 50, 51, 52];
const LEVELS = process.argv.slice(2).length ? process.argv.slice(2).map(Number) : DEFAULT_LEVELS;
const ATTEMPTS = Number(process.env.ATTEMPTS || 2);

/** Drives one attempt in-page with a manually pumped, fixed-step game loop. */
async function attempt(p, level, sceneKey) {
  return p.evaluate(async ({ sceneKey, maxFrames }) => {
    const game = window.game;
    const send = (type, key, code, keyCode) => window.dispatchEvent(
      new KeyboardEvent(type, { key, code, keyCode, which: keyCode, bubbles: true }));
    const right = d => send(d ? 'keydown' : 'keyup', 'ArrowRight', 'ArrowRight', 39);
    const left = d => send(d ? 'keydown' : 'keyup', 'ArrowLeft', 'ArrowLeft', 37);
    const jump = d => send(d ? 'keydown' : 'keyup', ' ', 'Space', 32);

    const scene = () => game.scene.getScene(sceneKey);
    let s = scene();
    if (!s || !s.player) return { error: 'scena neuzsikrove' };

    // Nothing is drawn while the bot plays — that is what makes it fast.
    game.scene.scenes.forEach(sc => { if (sc.sys && sc.sys.setVisible) sc.sys.setVisible(false); });
    game.loop.stop();
    let clock = game.loop.time;
    const stepOnce = () => { clock += 16.6667; game.loop.step(clock); };

    const startX = s.player.x;
    let maxX = startX, jumpHeld = false, sinceJump = 0, stuckFrames = 0, lastX = startX;
    let backupFrames = 0;   // pressed against a wall: back off and take a run-up

    right(true);
    for (let f = 0; f < maxFrames; f++) {
      stepOnce();
      if (f % 200 === 0) await new Promise(r => setTimeout(r, 0));   // let the page breathe

      if (game.scene.isActive('WinScene')) { right(false); jump(false); return { done: true, maxX, frames: f }; }
      s = scene();
      if (!s || !s.player || !s.player.body) break;
      if (s.levelComplete) { right(false); jump(false); return { done: true, maxX, frames: f }; }
      if (s.isDead) { right(false); jump(false); return { done: false, died: true, maxX, x: s.player.x, frames: f }; }

      const pl = s.player;
      maxX = Math.max(maxX, pl.x);
      const onGround = pl.body.blocked.down || pl.body.touching.down;

      // Backing up. Jumping while flush against a wall gets nowhere — the same
      // thing that makes a child step back and run at it.
      if (backupFrames > 0) {
        backupFrames--;
        if (backupFrames === 0) { left(false); right(true); jump(true); jumpHeld = true; sinceJump = 0; }
        lastX = pl.x;
        continue;
      }

      let needJump = false;
      if (Math.abs(pl.x - lastX) < 0.4) stuckFrames++;
      else stuckFrames = 0;

      // An enemy just ahead: jump on it. A bot that walks into every goomba
      // reports level after level as "impossible" for reasons no player has.
      let enemyAhead = false;
      if (s.enemies && s.enemies.getChildren) {
        const kids = s.enemies.getChildren();
        for (let e = 0; e < kids.length; e++) {
          const en = kids[e];
          if (!en.active || en.isSquished) continue;
          const dx = en.x - pl.x;
          if (dx > 0 && dx < 90 && Math.abs(en.y - pl.y) < 60) { enemyAhead = true; break; }
        }
      }

      if (onGround) {
        if (enemyAhead) needJump = true;
        if (pl.body.blocked.right) needJump = true;
        if (stuckFrames > 12) needJump = true;
        if (s.hasSolidTileAtPoint) {
          const feet = pl.body.bottom + 6;
          if (!s.hasSolidTileAtPoint(pl.body.right + 30, feet)) needJump = true;
          else if (!s.hasSolidTileAtPoint(pl.body.right + 70, feet)) needJump = true;
        }
      }

      // Jumping in place has not helped for a while: take a run-up.
      if (stuckFrames > 45) {
        right(false); jump(false); jumpHeld = false;
        left(true);
        backupFrames = 22;
        stuckFrames = 0;
        lastX = pl.x;
        continue;
      }
      lastX = pl.x;

      sinceJump++;
      if (needJump && onGround && sinceJump > 8) { jump(true); jumpHeld = true; sinceJump = 0; }
      else if (jumpHeld && sinceJump > 16) { jump(false); jumpHeld = false; }

      if (pl.y > 900) { right(false); jump(false); return { done: false, fell: true, maxX, x: pl.x, frames: f }; }
    }
    right(false); left(false); jump(false);
    return { done: false, timeout: true, maxX, x: s && s.player ? s.player.x : -1 };
  }, { sceneKey, maxFrames: Number(process.env.FRAMES || 5400) });
}

(async () => {
  // Headless Chrome throttles rAF for a page nobody is looking at, which makes
  // a 3000-frame playthrough take minutes of wall time. These flags keep the
  // render loop at full speed.
  const b = await chromium.launch({
    args: ['--disable-background-timer-throttling',
           '--disable-renderer-backgrounding',
           '--disable-backgrounding-occluded-windows',
           '--disable-features=CalculateNativeWinOcclusion']
  });
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.evaluate(h => {
    localStorage.setItem('app-mario:character:v1', JSON.stringify({ id: h }));
    localStorage.setItem('app-mario:math-settings:v1', JSON.stringify({ add: { enabled: true, max: 10 }, subtract: { enabled: true, max: 10 }, multiply: { enabled: false, max: 10 }, divide: { enabled: false, max: 10 }, missingOperand: false, unlockAll: true, difficulty: 'easy' }));
    document.cookie = 'marioMaxLevel=52;path=/;max-age=31536000';
  }, HERO);
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.game && window.game.textures.exists('mario'), null, { timeout: 30000 });

  const results = [];
  for (const level of LEVELS) {
    const theme = await p.evaluate(l => {
      const t = window.getLevelTheme ? window.getLevelTheme(l) : null;
      return { scene: (t && t.scene) ? t.scene : 'GameScene', name: t ? t.name : '?' };
    }, level);

    let outcome = null;
    for (let a = 1; a <= ATTEMPTS && !(outcome && outcome.done); a++) {
      errs.length = 0;
      await p.evaluate(({ l, sk }) => {
        // The previous attempt left the loop stopped and the scenes hidden.
        if (!window.game.loop.running) window.game.loop.start(window.game.loop.callback);
        window.game.scene.scenes.forEach(sc => { if (sc.sys && sc.sys.setVisible) sc.sys.setVisible(true); });
        ['GameScene', 'WonderScene', 'WinScene', 'HUDScene', 'MenuScene', 'BonusRoomScene'].forEach(s => window.game.scene.stop(s));
        window.game.scene.start(sk, { level: l, lives: 9 });
      }, { l: level, sk: theme.scene });
      await p.waitForFunction(sk => {
        const s = window.game.scene.getScene(sk);
        return s && s.player && s.player.body && window.game.scene.isActive(sk);
      }, theme.scene, { timeout: 20000 }).catch(() => {});
      outcome = await attempt(p, level, theme.scene);
      if (outcome && outcome.done) break;
    }

    const line = { level, name: theme.name, scene: theme.scene, ...outcome, errs: errs.slice(0, 2) };
    results.push(line);
    const status = outcome.done ? '✓ PEREITA'
      : outcome.died ? '✗ mire'
      : outcome.fell ? '✗ ikrito'
      : outcome.timeout ? '✗ neuzbaige (timeout)'
      : '✗ ' + JSON.stringify(outcome);
    console.log(`  ${String(level).padStart(2)} ${theme.name.padEnd(24)} ${status}   maxX=${Math.round(outcome.maxX || 0)}`);
    if (line.errs.length) console.log('       klaidos: ' + line.errs.join(' | '));
  }

  const done = results.filter(r => r.done).length;
  console.log('\n' + '='.repeat(60));
  console.log(`Herojus: ${HERO} | Pereita: ${done}/${results.length}`);
  const stuck = results.filter(r => !r.done);
  if (stuck.length) {
    console.log('\nNeuzbaigti (reikia pasiziureti rankomis):');
    stuck.forEach(r => console.log(`  ${r.level} ${r.name} — ${r.died ? 'mire' : r.fell ? 'ikrito' : 'timeout'} ties x=${Math.round(r.x || r.maxX || 0)}`));
  }
  require('fs').writeFileSync('/tmp/claude-1000/-workspace/206d2d55-d51d-4aa1-920e-1131339c9b26/scratchpad/playthrough-' + HERO + '.json', JSON.stringify(results, null, 1));
  await b.close();
})().catch(e => { console.error('FATAL: ' + e.message); process.exit(1); });
