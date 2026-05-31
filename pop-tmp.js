const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8765/index.html');
  await p.waitForFunction(()=>window.game&&window.game.textures.exists('koopa'),null,{timeout:15000});
  await p.evaluate(()=>{window.game.scene.stop('MenuScene');window.game.scene.start('GameScene',{level:1});});
  await p.waitForFunction(()=>{const s=window.game.scene.getScene('GameScene');return s&&s.player;},null,{timeout:8000});
  const r = await p.evaluate(()=>{
    const s=window.game.scene.getScene('GameScene');
    const before=s.tweens.getTweens().length;
    s.showEnglishPopup();
    const tws=s.tweens.getTweens();
    const durs=tws.map(t=>t.duration).sort((a,b)=>b-a).slice(0,3);
    return { newTweens: tws.length-before, topDurations: durs };
  });
  console.log(JSON.stringify(r), 'errors:', errs.length?errs.slice(0,2).join('|'):'none');
  await b.close();
})();
