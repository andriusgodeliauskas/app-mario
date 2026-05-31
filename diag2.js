const { chromium } = require('playwright');
const BASE = process.env.MARIO_URL || 'http://localhost:8765';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + '/index.html');
  await p.waitForFunction(() => window.game && window.game.textures.exists('koopa'), null, {timeout:15000});
  // find level with >=2 koopas
  const lvl = await p.evaluate(() => {
    const s = window.game.scene.getScene('GameScene');
    for (const n of [16,15,18,11,6,3,8,5]) {
      const fn = s['getLevel'+n+'Data']; if (!fn) continue;
      const d = fn.call(s);
      const cnt = d.map.reduce((a,row)=>a+row.filter(v=>v===61).length,0);
      if (cnt>=2) return n;
    }
    return 16;
  });
  await p.evaluate((n)=>{window.game.scene.stop('MenuScene');window.game.scene.start('GameScene',{level:n});}, lvl);
  await p.waitForFunction(()=>{const s=window.game.scene.getScene('GameScene');return s&&s.enemies&&s.enemies.getChildren().length>0;},null,{timeout:8000});
  const res = await p.evaluate(() => {
    const s = window.game.scene.getScene('GameScene');
    const koopas = s.enemies.getChildren().filter(e=>e.enemyType==='koopa'&&!e.isSquished);
    const target = koopas[0], others = koopas.slice(1);
    const before = others.map(o=>({x:Math.round(o.x),sq:!!o.isSquished,shell:!!o.isShell,active:o.active}));
    s.player.x = target.x; s.player.y = target.y-40; s.player.body.velocity.y = 200;
    s.handleEnemyCollision(s.player, target);
    let threw=false;
    try { for (let f=0;f<15;f++) s.update(0,16); } catch(e){ threw=true; errs2=e.message; }
    const after = others.map(o=>({x:Math.round(o.x),sq:!!o.isSquished,shell:!!o.isShell,active:o.active}));
    return { level:s.currentLevel, koopaCount:koopas.length, targetShell:!!target.isShell, threw, before, after };
  });
  console.log(JSON.stringify(res,null,0));
  console.log('ERRORS:', errs.length?errs.slice(0,2).join(' | '):'none');
  await b.close();
})();
