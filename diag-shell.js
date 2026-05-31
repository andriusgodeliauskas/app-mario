const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  await p.goto('http://localhost:8765/index.html');
  await p.waitForFunction(()=>window.game&&window.game.textures.exists('koopa'),null,{timeout:15000});
  await p.evaluate(()=>{window.game.scene.stop('MenuScene');window.game.scene.start('GameScene',{level:1});});
  await p.waitForFunction(()=>{const s=window.game.scene.getScene('GameScene');return s&&s.player&&s.enemies;},null,{timeout:8000});
  const r = await p.evaluate(()=>{
    const s = window.game.scene.getScene('GameScene');
    s.isDead=false; s.isBig=false; s.isFire=false; s.isInvincible=false; s.starPower=false; s.lives=3;
    s.enemies.clear(true,true);
    const k = s.enemies.create(s.player.x, s.player.y+30, 'koopa'); k.enemyType='koopa';
    s.squishEnemy(k);
    s.player.body.velocity.y = 200; s.player.y = k.y - 30;
    s.handleEnemyCollision(s.player, k);                  // kick
    const afterKick = { moving:!!k.shellMoving, vy:Math.round(s.player.body.velocity.y), dead:s.isDead };
    const beforeLives = s.lives;
    s.handleEnemyCollision(s.player, k);                  // immediate re-collision (player moving up)
    const afterRecollide = { dead:s.isDead, livesLost: beforeLives - s.lives };
    // After grace expires, a genuine side-hit by a moving shell should still hurt
    s.time.now = (s.time.now || 0) + 1000;               // advance past grace
    const beforeLives2 = s.lives;
    s.player.body.velocity.y = 0;                        // not falling — side hit
    s.handleEnemyCollision(s.player, k);
    const sideHitAfterGrace = { dead:s.isDead, livesLost: beforeLives2 - s.lives };
    return { afterKick, afterRecollide, sideHitAfterGrace };
  });
  console.log(JSON.stringify(r,null,0));
  await b.close();
})();
