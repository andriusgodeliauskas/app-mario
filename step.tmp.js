const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  await p.goto('http://localhost:8765/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.game && window.game.textures.exists('card-pickup'), null, { timeout: 30000 });
  const r = await p.evaluate(async () => {
    const game = window.game;
    game.scene.stop('MenuScene');
    game.scene.start('GameScene', { level: 1, lives: 9 });
    for (let i = 0; i < 30; i++) await new Promise(r => requestAnimationFrame(r));
    const s = game.scene.getScene('GameScene');
    if (!s || !s.player) return { error: 'no scene' };

    // Hide every scene: an invisible scene still updates but is not rendered,
    // which is where all the time goes in a software-rendered container.
    game.scene.scenes.forEach(sc => { if (sc.sys && sc.sys.setVisible) sc.sys.setVisible(false); });

    game.loop.stop();
    const x0 = s.player.x;
    let t = game.loop.time;
    const t0 = performance.now();
    const STEPS = 600;
    for (let i = 0; i < STEPS; i++) { t += 16.6667; game.loop.step(t); }
    const wall = performance.now() - t0;
    return { x0, x1: s.player.x, wallMs: Math.round(wall), stepsPerSec: Math.round(STEPS / (wall / 1000)),
             delta: Math.round(game.loop.delta) };
  });
  console.log(JSON.stringify(r));
  await b.close();
})();
