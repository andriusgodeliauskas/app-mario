/**
 * Wonder rooms 43-52: can the flag be reached at all?
 *
 * The playthrough bot cannot answer this — it dies in these rooms the same way
 * it died before any of this work started, because they need mechanics (magnet
 * polarity, gravity zones, a mirror twin) that no simple bot will use. So this
 * asks the geometry directly.
 *
 * Every solid surface in the room becomes a node; two surfaces are connected
 * when a jump can carry the player from one to the other. Then it checks that
 * the flag stands on a surface reachable from the spawn.
 *
 * WHAT THIS PROVES: the platforms form a connected path to the exit.
 * WHAT IT DOES NOT: that the room is fun, that enemies leave you room to land,
 * or that key/mirror/boss-door gates can be satisfied. Those are called out per
 * room and still want a human.
 *
 * Run: python3 -m http.server 8765 &  node tests/wonder-reach.test.js
 */
const { chromium } = require('playwright');
const BASE = process.env.MARIO_URL || 'http://localhost:8765';
const SETTINGS = { add: { enabled: true, max: 10 }, subtract: { enabled: true, max: 10 },
  multiply: { enabled: false, max: 10 }, divide: { enabled: false, max: 10 },
  missingOperand: false, unlockAll: true, difficulty: 'easy' };

let passed = 0, failed = 0; const fails = [];
const ok = n => { passed++; console.log('  ✓ ' + n); };
const bad = (n, e) => { failed++; fails.push(n); console.log('  ✗ ' + n + ' — ' + e); };

(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.evaluate(s => localStorage.setItem('app-mario:math-settings:v1', JSON.stringify(s)), SETTINGS);
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.game && window.WonderScene, null, { timeout: 30000 });

  for (let level = 43; level <= 52; level++) {
    errs.length = 0;
    await p.evaluate(l => {
      ['GameScene', 'WonderScene', 'MenuScene', 'WinScene', 'HUDScene'].forEach(s => window.game.scene.stop(s));
      window.game.scene.start('WonderScene', { level: l, lives: 9 });
    }, level);
    await p.waitForFunction(l => {
      const s = window.game.scene.getScene('WonderScene');
      return s && s.player && s._solidRects && s.currentLevel === l && window.game.scene.isActive('WonderScene');
    }, level, { timeout: 20000 }).catch(() => {});

    const r = await p.evaluate(() => {
      const s = window.game.scene.getScene('WonderScene');
      if (!s || !s._solidRects) return { error: 'scena neuzsikrove' };

      // Reach comes from the physics, per jump, because a drop buys airtime and
      // a rise spends it. Jump 520, gravity 800, run 200.
      //   landing d px BELOW the take-off:  400t^2 - 520t - d = 0
      //   landing d px ABOVE:               400t^2 - 520t + d = 0  (first root)
      // A flat constant flagged real jumps as impossible and cleared others that
      // are not.
      // MARGIN is calibrated, not guessed: a measured full-speed, fully-held
      // jump on flat ground covers 220px and rises 165px. The bare parabola
      // says 260px — the difference is that landing registers when the body
      // touches down, not when the arc completes.
      const V0 = 520, G = 800, RUN = 200, MARGIN = 0.846;
      const MAX_UP = (V0 * V0) / (2 * G);        // 169px

      const reachFor = rise => {                  // rise > 0 => target is higher
        if (rise > MAX_UP - 12) return -1;        // cannot get up there at all
        const disc = V0 * V0 - 4 * (G / 2) * rise;
        if (disc < 0) return -1;
        const t = (V0 + Math.sqrt(disc)) / G;     // time until back at target height
        return RUN * t * MARGIN;
      };

      // Static ground is only part of the floor in these rooms: FLUFF-PUFF is
      // crossed on dissolving clouds and CLOCKWORK GEARS on moving gears. Left
      // out, they read as "unreachable" when they are simply not static.
      const collected = s._solidRects.map(q => ({ x1: q.x, x2: q.x + q.width, top: q.y, kind: 'ground' }));
      const kinds = { ground: collected.length };
      // Everything the player can actually stand on. Missing one of these
      // reads as "unreachable" when the room simply uses a different kind of
      // floor — segmented platforms are what bridge FLUFF-PUFF's cloud gaps.
      [['segmentedPlatforms', 'segmentai'], ['dissolvingClouds', 'debesys'],
       ['gearPlatforms', 'krumpliaraciai'], ['bouncers', 'batutai'],
       ['rubberBlocks', 'gumos'], ['sinkingSandGroup', 'smelis']]
        .forEach(([g, label]) => {
          if (!s[g] || !s[g].getChildren) return;
          const kids = s[g].getChildren();
          kids.forEach(o => {
            if (!o.body) return;
            collected.push({ x1: o.body.x, x2: o.body.x + o.body.width, top: o.body.y, kind: label });
          });
          if (kids.length) kinds[label] = kids.length;
        });

      const rects = collected.map((q, i) => Object.assign({ i }, q)).sort((a, b) => a.x1 - b.x1);

      const jumpable = (a, b) => {
        const gap = (b.x1 > a.x2) ? b.x1 - a.x2 : (a.x1 > b.x2 ? a.x1 - b.x2 : 0);
        const rise = a.top - b.top;          // positive = b is higher
        const reach = reachFor(rise);
        return reach >= 0 && gap <= reach;
      };

      // Which surface do we start on / must we finish on?
      const under = (x, y) => {
        let best = null;
        rects.forEach(q => {
          if (x >= q.x1 - 24 && x <= q.x2 + 24 && q.top >= y - 40) {
            if (!best || q.top < best.top) best = q;
          }
        });
        return best;
      };

      const spawn = s.levelData.spawn || { x: 96, y: 450 };
      const flag = s.levelData.flag || { x: s.worldWidth - 160, y: 480 };
      const start = under(spawn.x, spawn.y);
      const goal = under(flag.x, flag.y || 480);
      if (!start) return { error: 'nerasta starto platforma' };
      if (!goal) return { error: 'nerasta vėliavos platforma' };

      // Flood fill from the spawn surface
      const seen = new Set([start.i]);
      const queue = [start];
      while (queue.length) {
        const cur = queue.shift();
        for (const q of rects) {
          if (seen.has(q.i)) continue;
          if (jumpable(cur, q)) { seen.add(q.i); queue.push(q); }
        }
      }

      // Widest gap along the reachable chain, for a difficulty readout
      let widest = 0;
      const reachable = rects.filter(q => seen.has(q.i));
      for (let i = 1; i < reachable.length; i++) {
        const g = reachable[i].x1 - reachable[i - 1].x2;
        if (g > widest) widest = g;
      }

      // Where does the chain stop? That is the difference between "a gap no
      // jump can cross" and "a mechanic this checker does not model".
      const reachedRects = rects.filter(q => seen.has(q.i));
      const furthest = reachedRects.reduce((a, q) => (!a || q.x2 > a.x2) ? q : a, null);
      const nextUnreached = rects
        .filter(q => !seen.has(q.i) && furthest && q.x1 >= furthest.x2)
        .sort((a, b) => a.x1 - b.x1)[0] || null;

      return {
        rects: rects.length,
        kinds: kinds,
        breakAt: furthest ? {
          fromX: Math.round(furthest.x2), fromTop: Math.round(furthest.top), fromKind: furthest.kind,
          toX: nextUnreached ? Math.round(nextUnreached.x1) : null,
          toTop: nextUnreached ? Math.round(nextUnreached.top) : null,
          toKind: nextUnreached ? nextUnreached.kind : null,
          gap: nextUnreached ? Math.round(nextUnreached.x1 - furthest.x2) : null,
          rise: nextUnreached ? Math.round(furthest.top - nextUnreached.top) : null
        } : null,
        reached: seen.size,
        goalReachable: seen.has(goal.i),
        widestGap: Math.round(widest),
        gates: {
          keys: s.levelData.keyGoal || 0,
          mirror: !!s.levelData.mirrorTwin,
          bossDoor: !!s.levelData.bossDoor,
          gravity: !!(s.levelData.gravityZones && s.levelData.gravityZones.length),
          magnets: s.levelData.magnetPolarity !== undefined
        },
        name: (window.getLevelTheme ? (window.getLevelTheme(s.currentLevel) || {}).name : '') || ''
      };
    });

    if (r.error) { bad('lygis ' + level, r.error); continue; }

    const gates = Object.keys(r.gates).filter(k => r.gates[k] && r.gates[k] !== 0)
      .map(k => k === 'keys' ? (r.gates.keys + ' rakt.') : k);
    const note = gates.length ? '  [' + gates.join(', ') + ']' : '';
    const kindNote = Object.keys(r.kinds).filter(k => k !== 'ground').length
      ? ' (' + Object.keys(r.kinds).map(k => k + ':' + r.kinds[k]).join(' ') + ')' : '';

    r.goalReachable
      ? ok(`${level} ${r.name.padEnd(22)} veliava pasiekiama (${r.reached}/${r.rects} pavirsiu)${kindNote}${note}`)
      : bad(`${level} ${r.name} veliava NEPASIEKIAMA`,
            `pasiekta ${r.reached}/${r.rects} pavirsiu${kindNote}${note}` +
            (r.breakAt ? `\n       nutruksta: ${r.breakAt.fromKind} baigiasi x=${r.breakAt.fromX} (y=${r.breakAt.fromTop}) -> ` +
              (r.breakAt.toX === null ? 'toliau nieko nera'
               : `${r.breakAt.toKind} x=${r.breakAt.toX} (y=${r.breakAt.toTop}); tarpas ${r.breakAt.gap}px, kilimas ${r.breakAt.rise}px`) : ''));
    if (errs.length) bad(level + ' konsoles klaidos', errs.slice(0, 2).join(' | '));
  }

  await b.close();
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed) { fails.forEach(f => console.log('  - ' + f)); process.exit(1); }
})().catch(e => { console.error('FATAL: ' + e.message); process.exit(1); });
