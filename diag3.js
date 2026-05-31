const { chromium } = require('playwright');
const BASE = process.env.MARIO_URL || 'http://localhost:8765';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  await p.goto(BASE + '/index.html');
  await p.waitForFunction(() => window.game && window.game.textures.exists('koopa'), null, {timeout:15000});
  const lvl = await p.evaluate(() => {
    const s = window.game.scene.getScene('GameScene');
    for (const n of [16,15,6,3]) { const fn=s['getLevel'+n+'Data']; if(!fn)continue;
      const d=fn.call(s); const g=d.map.reduce((a,r)=>a+r.filter(v=>v===60).length,0);
      const k=d.map.reduce((a,r)=>a+r.filter(v=>v===61).length,0); if(g>=1&&k>=1)return n; }
    return 16;
  });
  await p.evaluate((n)=>{window.game.scene.stop('MenuScene');window.game.scene.start('GameScene',{level:n});},lvl);
  await p.waitForFunction(()=>{const s=window.game.scene.getScene('GameScene');return s&&s.enemies&&s.enemies.getChildren().length>0;},null,{timeout:8000});
  await p.evaluate(() => {
    const s = window.game.scene.getScene('GameScene');
    const g = s.enemies.getChildren().find(e=>e.enemyType==='goomba');
    const k = s.enemies.getChildren().find(e=>e.enemyType==='koopa');
    window.__g = g; window.__k = k;
    window.__gx0 = g?g.x:null; window.__kx0 = k?k.x:null;
    // freeze camera target so enemies near spawn keep updating: pin player far away isn't needed
  });
  // real game loop, 3 seconds
  await p.waitForTimeout(3000);
  const r = await p.evaluate(() => {
    const gt=(19-2)*32;
    const g=window.__g,k=window.__k;
    return {
      goomba: g?{moved:Math.round(Math.abs(g.x-window.__gx0)),vx:Math.round(g.body.velocity.x),onG:g.body.blocked.down,emb:Math.round(g.body.bottom-gt)}:null,
      koopa: k?{moved:Math.round(Math.abs(k.x-window.__kx0)),vx:Math.round(k.body.velocity.x),onG:k.body.blocked.down,emb:Math.round(k.body.bottom-gt)}:null
    };
  });
  console.log(JSON.stringify(r));
  await b.close();
})();
