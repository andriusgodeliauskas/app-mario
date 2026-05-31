const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  await p.goto('http://localhost:8765/index.html');
  await p.waitForFunction(() => window.game && window.MathSettings, null, { timeout: 15000 });
  await p.evaluate(() => { window.game.scene.start('SettingsScene'); });
  await p.waitForTimeout(600);
  await p.screenshot({ path: '/tmp/settings.png' });
  await b.close();
})();
