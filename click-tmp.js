const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  await p.goto('http://localhost:8765/index.html');
  await p.waitForFunction(() => window.game && window.MathSettings, null, { timeout: 15000 });
  // reset
  await p.evaluate(() => { const s = window.MathSettings.load(); s.unlockAll=false; window.MathSettings.save(s); });
  await p.evaluate(() => window.game.scene.start('SettingsScene'));
  await p.waitForTimeout(500);
  const before = await p.evaluate(() => window.game.scene.getScene('SettingsScene').workingSettings.unlockAll);
  // click the "VISI LYGIAI" checkbox area (right side, bottom toggle row)
  await p.mouse.click(420, 483);
  await p.waitForTimeout(150);
  const after = await p.evaluate(() => window.game.scene.getScene('SettingsScene').workingSettings.unlockAll);
  // click save
  await p.mouse.click(400, 560);
  await p.waitForTimeout(400);
  const saved = await p.evaluate(() => window.MathSettings.load().unlockAll);
  console.log(JSON.stringify({ before, after, saved }));
  await b.close();
})();
