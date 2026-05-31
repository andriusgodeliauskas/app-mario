const { chromium } = require('playwright');
const BASE = process.env.MARIO_URL || 'http://localhost:8765';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + '/index.html');
  await p.waitForFunction(() => window.game && window.game.textures.exists('koopa'), null, {timeout:15000});

  // find a level that has koopas
  const lvl = await p.evaluate(() => {
    const s = window.game.scene.getScene('GameScene');
    for (const n of [3,5,6,8,1,2,4,7,9]) {
      const d = s['getLevel'+n+'Data'] ? s['getLevel'+n+'Data']() : null;
      if (d && d.map.some(row => row.indexOf(61) !== -1)) return n;
    }
    return 1;
  });

  await p.evaluate((n) => { window.game.scene.stop('MenuScene'); window.game.scene.start('GameScene', {level:n}); }, lvl);
  await p.waitForFunction(() => { const s=window.game.scene.getScene('GameScene'); return s && s.enemies && s.enemies.getChildren().length>0; }, null, {timeout:8000});

  // Measure koopa spawn embedding + movement over 40 frames
  const data = await p.evaluate(() => {
    const s = window.game.scene.getScene('GameScene');
    const koopas = s.enemies.getChildren().filter(e => e.enemyType==='koopa');
    if (!koopas.length) return {noKoopa:true};
    const k = koopas[0];
    const groundTop = (19-2)*32; // 544
    const spawnBodyBottom = k.body.bottom;
    const startX = k.x;
    const xs = [];
    for (let f=0; f<40; f++) { s.update(0,16); xs.push(Math.round(k.x)); }
    const moved = Math.abs(k.x - startX);
    return { level: window.game.scene.getScene('GameScene').currentLevel,
             koopaCount: koopas.length, spawnBodyBottom, groundTop,
             embeddedPx: Math.round(spawnBodyBottom - groundTop),
             startX: Math.round(startX), movedAfter40f: Math.round(moved),
             xSample: [xs[0],xs[10],xs[20],xs[39]] };
  });
  console.log('MOVEMENT:', JSON.stringify(data));

  // Stomp one koopa, then check the OTHERS
  const stomp = await p.evaluate(() => {
    const s = window.game.scene.getScene('GameScene');
    const koopas = s.enemies.getChildren().filter(e => e.enemyType==='koopa' && !e.isSquished);
    if (koopas.length < 2) return {note:'need 2+ koopas', count:koopas.length};
    const target = koopas[0];
    const others = koopas.slice(1);
    const otherBefore = others.map(o => ({sq:!!o.isSquished, shell:!!o.isShell, active:o.active}));
    // simulate stomp
    s.player.x = target.x; s.player.y = target.y - 40; s.player.body.velocity.y = 200;
    s.handleEnemyCollision(s.player, target);
    for (let f=0; f<10; f++) s.update(0,16);
    const otherAfter = others.map(o => ({sq:!!o.isSquished, shell:!!o.isShell, active:o.active}));
    return { targetIsShell: !!target.isShell, otherBefore, otherAfter };
  });
  console.log('STOMP:', JSON.stringify(stomp));
  console.log('ERRORS:', errs.length ? errs.slice(0,2).join(' | ') : 'none');
  await b.close();
})();
