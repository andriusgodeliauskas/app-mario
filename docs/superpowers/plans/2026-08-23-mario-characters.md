# Mario veikėjai: herojaus pasirinkimas + blogiečių įvairovė — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pridėti 8 žaidžiamus herojus su pasirinkimu meniu (kiekvienas su sava galia) ir 5 naujus blogiečius, nesulaužant nė vieno iš 52 esamų lygių.

**Architecture:** Naujas `CHARACTERS` registras aprašo kiekvieną herojų duomenimis (paletė, fizikos daugikliai, galia). `sprites-heroes.js` generuoja tekstūras su **identišku** 5 kadrų 128×128 išdėstymu kaip esamas `mario`, todėl BootScene animacijos ir GameScene big/small logika veikia be pakeitimų — keičiasi tik tekstūros raktas. Pasirinkimas saugomas localStorage per `CharacterSettings` (tikslus `MathSettings` šablonas).

**Tech Stack:** Phaser 3.80.1 (CDN), grynas ES5-stiliaus JS, jokio build žingsnio. Testai: `node tests/unit/*.test.js` (unit) ir Playwright skriptai prieš `http://localhost:8765`.

**Spec:** `docs/superpowers/specs/2026-08-23-mario-characters-design.md`

## Global Constraints

- Jokio build žingsnio: nauji failai pridedami kaip `<script>` į `index.html`; po to privaloma paleisti `python3 bump-cache-version.py`.
- Failų stilius: IIFE + `window.X` / `module.exports` dvigubas eksportas (kaip `js/utils/settings.js`).
- ES5 sintaksė žaidimo kode (`var`, `function`) — projekte nenaudojami `let/const/=>` naršyklės failuose.
- Herojų tekstūros PRIVALO turėti 5 kadrus po 128×128: 0-2 bėgimas, 3 šuolis, 4 mirtis.
- Bazinė fizika: greitis 200 (`GameScene.js:725`). Daugikliai leidžiami tik intervale 0.90–1.10.
- Numatytasis herojus — `mario`; be pasirinkimo žaidimas elgiasi lygiai kaip dabar.
- Lietuviški tekstai UI be diakritikų (kaip esami: `PASIRINK PASAULI`, `NUSTATYMAI`).

---

### Task 1: Veikėjų registras (`characters.js`)

**Files:**
- Create: `js/data/characters.js`
- Test: `tests/unit/characters.test.js`

**Interfaces:**
- Produces: `Characters.LIST` (masyvas), `Characters.byId(id)`, `Characters.DEFAULT_ID = 'mario'`, `Characters.PLAYABLE_IDS`. Kiekvienas įrašas: `{ id, name, lt, palette:{}, physics:{speedMul, jumpMul}, power, description }`.

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/characters.test.js
const Characters = require('../../js/data/characters.js');
test('kiekvieno herojaus fizika saugiose ribose', () => {
    Characters.LIST.forEach(c => {
        assert(c.physics.speedMul >= 0.9 && c.physics.speedMul <= 1.1, c.id + ' speedMul ribose');
        assert(c.physics.jumpMul  >= 0.9 && c.physics.jumpMul  <= 1.1, c.id + ' jumpMul ribose');
    });
});
test('mario yra numatytasis ir neutralus', () => {
    const m = Characters.byId('mario');
    assert(m.physics.speedMul === 1 && m.physics.jumpMul === 1, 'mario neutralus');
    assert(Characters.DEFAULT_ID === 'mario', 'default mario');
});
test('8 zaidziami herojai, unikalus id', () => {
    assert(Characters.PLAYABLE_IDS.length === 8, 'yra 8');
    assert(new Set(Characters.PLAYABLE_IDS).size === 8, 'id unikalus');
});
test('nezinomas id grazina null', () => {
    assert(Characters.byId('nera') === null, 'null');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/unit/characters.test.js`
Expected: FAIL — `Cannot find module '../../js/data/characters.js'`

- [ ] **Step 3: Write minimal implementation**

`js/data/characters.js` — IIFE su 8 įrašais (mario, luigi, peach, toad, yoshi, daisy, rosalina, diddy), paletės pagal spec'o lentelę, `physics` daugikliai iš spec'o, `power` eilutės: `fireball, slippery, glide, quickstart, doublejump, superbounce, luma, rolldash`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/unit/characters.test.js`
Expected: PASS (4 testai)

- [ ] **Step 5: Commit**

```bash
git add js/data/characters.js tests/unit/characters.test.js
git commit -m "feat(characters): add character registry with 8 playable heroes"
```

---

### Task 2: Pasirinkimo išsaugojimas (`characterSettings.js`)

**Files:**
- Create: `js/utils/characterSettings.js`
- Test: `tests/unit/characterSettings.test.js`

**Interfaces:**
- Consumes: `Characters.byId`, `Characters.DEFAULT_ID` (Task 1).
- Produces: `CharacterSettings.load()` → `{ id }`, `.save({id})`, `.selectedId()` → string, `.STORAGE_KEY = 'app-mario:character:v1'`.

- [ ] **Step 1: Write the failing test**

```js
// localStorage mock PRIES require (kaip tests/unit/settings.test.js)
const CharacterSettings = require('../../js/utils/characterSettings.js');
test('be irasu grazina mario', () => {
    assert(CharacterSettings.selectedId() === 'mario', 'default mario');
});
test('issaugo ir atkuria', () => {
    CharacterSettings.save({ id: 'yoshi' });
    assert(CharacterSettings.selectedId() === 'yoshi', 'yoshi issaugotas');
});
test('sugadintas irasas krenta i mario', () => {
    localStorage.setItem(CharacterSettings.STORAGE_KEY, '{neteisingas json');
    assert(CharacterSettings.selectedId() === 'mario', 'fallback mario');
});
test('nezinomas herojus krenta i mario', () => {
    CharacterSettings.save({ id: 'bowser' });
    assert(CharacterSettings.selectedId() === 'mario', 'nezaidziamas -> mario');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/unit/characterSettings.test.js` → FAIL (modulio nėra)

- [ ] **Step 3: Write minimal implementation**

Kopijuoti `js/utils/settings.js` struktūrą: `getStorage()` su try/catch, `load()` validuoja per `Characters.byId` ir `PLAYABLE_IDS`, `save()` klonuoja. Node aplinkoje `Characters` gaunamas per `require`, naršyklėje — iš `window`.

- [ ] **Step 4: Run test to verify it passes** → PASS (4 testai)

- [ ] **Step 5: Commit**

```bash
git add js/utils/characterSettings.js tests/unit/characterSettings.test.js
git commit -m "feat(characters): persist selected hero in localStorage"
```

---

### Task 3: Herojų sprite'ai (`sprites-heroes.js`)

**Files:**
- Create: `js/utils/sprites-heroes.js`
- Modify: `js/utils/sprites.js` (`generateAll` — pridėti `generateHeroes(scene)` kvietimą)
- Modify: `index.html` (naujas `<script>`)
- Test: `tests/hero-textures.test.js` (Playwright)

**Interfaces:**
- Consumes: `Characters.LIST` (Task 1).
- Produces: tekstūros `hero-<id>` ir `hero-<id>-big` kiekvienam žaidžiamam id; `mario` ir `mario-big` NEKEIČIAMI (Mario ir toliau naudoja senuosius raktus).

**Kodo kryptis:** bendra `drawHeroFrame(ctx, spec, pose, size)` piešia skeletą (batai, kojos, kombinezonas, rankos, galva) iš `spec.palette`; `spec.shape` parenka siluetą: `'plumber'` (Mario/Luigi/Wario stilius), `'dress'` (Peach/Daisy/Rosalina), `'mushroom'` (Toad), `'dino'` (Yoshi), `'monkey'` (Diddy). Kiekvienas siluetas — atskira mažа funkcija tame pačiame faile.

- [ ] **Step 1: Write the failing test**

```js
// tests/hero-textures.test.js — Playwright, BASE=http://localhost:8765
await p.waitForFunction(() => window.game && window.game.textures.exists('hero-peach'));
const info = await p.evaluate(() => {
    const t = window.game.textures.get('hero-peach').getSourceImage();
    const ids = window.Characters.PLAYABLE_IDS;
    return {
        w: t.width, h: t.height,
        visi: ids.every(id => window.game.textures.exists('hero-' + id) &&
                              window.game.textures.exists('hero-' + id + '-big')),
        kadrai: window.game.textures.get('hero-peach').frameTotal
    };
});
assert(info.w === 640 && info.h === 128, '5 kadrai po 128x128');
assert(info.visi, 'visos 8 herojų tekstūros (small + big)');
assert(info.kadrai >= 5, 'bent 5 kadrai');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m http.server 8765 & node tests/hero-textures.test.js`
Expected: FAIL — timeout laukiant `hero-peach`

- [ ] **Step 3: Write minimal implementation**

Sukurti `sprites-heroes.js`, prijungti `index.html`, iškviesti iš `generateAll`.

- [ ] **Step 4: Run test to verify it passes** → PASS

- [ ] **Step 5: Commit**

```bash
git add js/utils/sprites-heroes.js js/utils/sprites.js index.html tests/hero-textures.test.js
git commit -m "feat(characters): generate hero sprites for all 8 playable characters"
```

---

### Task 4: Animacijos ir GameScene prijungimas

**Files:**
- Modify: `js/scenes/BootScene.js:44-140` (`createAnimations` — ciklas per `Characters.PLAYABLE_IDS`)
- Modify: `js/scenes/GameScene.js:239, 773, 1732, 1769, 1956`
- Test: `tests/hero-play.test.js` (Playwright)

**Interfaces:**
- Consumes: `hero-<id>` tekstūros (Task 3), `CharacterSettings.selectedId()` (Task 2).
- Produces: `GameScene.heroKey` (pvz. `'hero-yoshi'` arba `'mario'`), `GameScene.heroBigKey`, animacijų raktai `<heroKey>-idle|run|jump|death`.

**Kodo kryptis:** `GameScene.create()` pradžioje:
```js
var heroId = (typeof CharacterSettings !== 'undefined') ? CharacterSettings.selectedId() : 'mario';
this.hero = Characters.byId(heroId) || Characters.byId('mario');
this.heroKey = heroId === 'mario' ? 'mario' : 'hero-' + heroId;
this.heroBigKey = this.heroKey + '-big';
```
Tada `:239` → `this.physics.add.sprite(spawnX, spawnY, this.heroKey)`, `:773` → `var prefix = (this.isBig ? this.heroBigKey : this.heroKey) + '-'`, `:1732/:1769` → `setTexture(this.heroBigKey)`, `:1956` → `setTexture(this.heroKey)`.

- [ ] **Step 1: Write the failing test**

```js
// Kiekvienam herojui: nustatom localStorage, kraunam lygį, tikrinam tekstūrą ir kad nėra klaidų
for (const id of ['mario','luigi','peach','toad','yoshi','daisy','rosalina','diddy']) {
  await p.evaluate(i => localStorage.setItem('app-mario:character:v1', JSON.stringify({id:i})), id);
  await p.reload({ waitUntil: 'domcontentloaded' });
  await startLevel(p, 1);
  const r = await p.evaluate(() => {
      const s = window.game.scene.getScene('GameScene');
      return { tex: s.player.texture.key, anim: s.player.anims.currentAnim && s.player.anims.currentAnim.key };
  });
  assert(r.tex === (id === 'mario' ? 'mario' : 'hero-' + id), id + ' tekstura teisinga');
  assert(r.anim && r.anim.indexOf(id === 'mario' ? 'mario' : 'hero-' + id) === 0, id + ' animacija teisinga');
  assert(errs.length === 0, id + ' be konsoles klaidu');
}
```

- [ ] **Step 2: Run test to verify it fails** → FAIL (visada `mario` tekstūra)

- [ ] **Step 3: Write minimal implementation** (aukščiau aprašyti keitimai)

- [ ] **Step 4: Run test to verify it passes** → PASS 8 herojams

- [ ] **Step 5: Narvelyje sedinti mergina nesidubliuoja su zaidejo herojumi**

`js/scenes/GameScene.js:1389` — vietoj visada `'princess'`:
```js
var captiveKey = (this.heroKey === 'hero-peach') ? 'hero-daisy' : 'princess';
var princess = this.add.sprite(0, 28, captiveKey).setScale(0.36);
```
Patikra (prideti i `tests/hero-play.test.js`): zaidziant Peach narvelio sprite raktas yra `hero-daisy`, zaidziant Mario — `princess`.

- [ ] **Step 6: Commit**

```bash
git add js/scenes/BootScene.js js/scenes/GameScene.js tests/hero-play.test.js
git commit -m "feat(characters): play any of the 8 heroes; anims driven by hero key"
```

---

### Task 5: Pasirinkimo ekranas meniu

**Files:**
- Modify: `js/scenes/MenuScene.js` (portretų juosta virš `PASIRINK PASAULI` ties `:143`)
- Test: `tests/hero-picker.test.js` (Playwright)

**Interfaces:**
- Consumes: `Characters.LIST`, `CharacterSettings.save/selectedId`.
- Produces: nieko naujo kitiems taskams.

**UI:** 8 apvalūs portretai eilėje (statiškas kadras 0 iš `hero-<id>`), po jais herojaus vardas EN + LT. Pasirinktas — ryškesnis rėmelis. Paspaudimas iškart išsaugo. Antraštė: `PASIRINK VEIKEJA:`.

- [ ] **Step 1: Write the failing test**

```js
const before = await p.evaluate(() => localStorage.getItem('app-mario:character:v1'));
await p.evaluate(() => {                       // paspausti Yoshi portretą
    const s = window.game.scene.getScene('MenuScene');
    s.heroButtons.find(b => b.id === 'yoshi').zone.emit('pointerdown');
});
const after = await p.evaluate(() => JSON.parse(localStorage.getItem('app-mario:character:v1')).id);
assert(after === 'yoshi', 'paspaudus issaugoma');
assert(before !== JSON.stringify({id:'yoshi'}), 'pasikeite');
```

- [ ] **Step 2: Run test to verify it fails** → FAIL (`s.heroButtons` undefined)

- [ ] **Step 3: Write minimal implementation**

- [ ] **Step 4: Run test to verify it passes** → PASS

- [ ] **Step 5: Commit**

```bash
git add js/scenes/MenuScene.js tests/hero-picker.test.js
git commit -m "feat(characters): hero picker row in the main menu"
```

---

### Task 6: Fizikos daugikliai + 52 lygių patikra

**Files:**
- Modify: `js/scenes/GameScene.js:725` (`var speed = 200` → daugiklis) ir šuolio vieta
- Test: `tests/hero-physics.test.js` (Playwright), `tests/unit/levels.test.js` (papildyti)

**Interfaces:**
- Consumes: `this.hero.physics` (Task 4).

- [ ] **Step 1: Write the failing test**

```js
// Toad (1.10) turi nubegti toliau nei Rosalina (0.95) per ta pati laika
async function distance(p, id) { /* nustato herojų, laiko dešinę 1.5 s, grąžina Δx */ }
const toad = await distance(p, 'toad'), rosa = await distance(p, 'rosalina');
assert(toad > rosa * 1.08, 'Toad greitesnis uz Rosalina');
assert(toad < rosa * 1.25, 'skirtumas nevirsija saugios ribos');
```

- [ ] **Step 2: Run test to verify it fails** → FAIL (greičiai vienodi)

- [ ] **Step 3: Write minimal implementation**

```js
var speed = 200 * (this.hero.physics.speedMul || 1);
```
ir analogiškai šuolio greičiui `× jumpMul`.

- [ ] **Step 4: Run test to verify it passes**

Papildomai paleisti `node tests/unit/levels.test.js` — visi 52 lygiai turi likti `ok: true`.

- [ ] **Step 5: Commit**

```bash
git add js/scenes/GameScene.js tests/hero-physics.test.js
git commit -m "feat(characters): per-hero speed/jump multipliers within ±10%"
```

---

### Task 7: Galios

**Files:**
- Create: `js/utils/heroPowers.js`
- Modify: `js/scenes/GameScene.js` (`update()` — kviesti `HeroPowers.update(this, delta)`; šuolio apdorojime — `HeroPowers.onJump`)
- Test: `tests/hero-powers.test.js` (Playwright)

**Interfaces:**
- Produces: `HeroPowers.apply(scene)`, `HeroPowers.update(scene, delta)`, `HeroPowers.onJumpPressed(scene)`, `HeroPowers.onStomp(scene)`.

Galios: `glide` (Peach — laikant šuolį krytis ≤ 60 px/s ne ilgiau 600 ms), `doublejump` (Yoshi — vienas papildomas 60% šuolis ore), `superbounce` (Daisy — atšokimas ×1.4), `quickstart` (Toad — pagreitis ×2 pirmas 200 ms), `slippery` (Luigi — stabdymo trintis ×0.6), `luma` (Rosalina — monetų trauka 60 px spinduliu), `rolldash` (Diddy — dvigubas krypties spustelėjimas → ×1.6 greitis 400 ms), `fireball` (Mario — esama, nekeičiama).

- [ ] **Step 1: Write the failing test**

```js
// Peach sklendimas: kritimo greitis laikant soki turi buti mazesnis nei Mario
const peachFall = await fallSpeedHoldingJump(p, 'peach');
const marioFall = await fallSpeedHoldingJump(p, 'mario');
assert(peachFall < marioFall * 0.7, 'Peach sklendzia');
// bet nekaba amzinai
assert(await stillFallingAfter(p, 'peach', 1500), 'sklendimas baigiasi');
// Yoshi antras sokis
assert(await maxAirJumps(p, 'yoshi') === 2, 'Yoshi turi 2 sokius');
assert(await maxAirJumps(p, 'mario') === 1, 'Mario turi 1');
```

- [ ] **Step 2: Run test to verify it fails** → FAIL

- [ ] **Step 3: Write minimal implementation**

- [ ] **Step 4: Run test to verify it passes** → PASS

- [ ] **Step 5: Commit**

```bash
git add js/utils/heroPowers.js js/scenes/GameScene.js index.html tests/hero-powers.test.js
git commit -m "feat(characters): per-hero powers (glide, double jump, dash, luma...)"
```

---

### Task 8: Nauji blogiečiai — sprite'ai ir elgsena

**Files:**
- Create: `js/utils/sprites-villains.js`, `js/entities/Villains.js`
- Modify: `js/scenes/GameScene.js:200-290` (spawn kodai 62–66), `index.html`
- Test: `tests/villains.test.js` (Playwright)

**Interfaces:**
- Produces: tekstūros `wario, waluigi, boo, bowser-jr, dk`; `Villains.spawn(scene, type, x, y)`, `Villains.update(scene, delta)`.

Elgsena pagal spec'ą: Wario (įsibėgėja pastebėjęs), Waluigi (peršoka), Boo (sustingsta kai žiūri; neužminamas), Bowser Jr. (2 HP), DK (ridena statines).

- [ ] **Step 1: Write the failing test**

```js
// Boo: sustingsta, kai zaidejas i ji ziuri
await spawnVillain(p, 'boo', { x: 400, y: 300 });
const judaZiurint = await booMovement(p, { playerFacing: 'toward' });
const judaNusisukus = await booMovement(p, { playerFacing: 'away' });
assert(judaZiurint < 2, 'Boo sustingsta kai i ji ziuri');
assert(judaNusisukus > 20, 'Boo vejasi kai nusisukama');
```

- [ ] **Step 2: Run test to verify it fails** → FAIL

- [ ] **Step 3: Write minimal implementation**

- [ ] **Step 4: Run test to verify it passes** → PASS

- [ ] **Step 5: Commit**

```bash
git add js/utils/sprites-villains.js js/entities/Villains.js js/scenes/GameScene.js index.html tests/villains.test.js
git commit -m "feat(villains): Wario, Waluigi, Boo, Bowser Jr. and DK enemies"
```

---

### Task 9: Blogiečių įdėjimas į lygius + galutinė patikra

**Files:**
- Modify: `js/data/levels-*.js` (pasirinktinai ~10 lygių)
- Modify: `index.html` (cache bump)
- Test: visi esami testai + `tests/unit/levels.test.js`

- [ ] **Step 1: Run the full suite first (baseline)**

Run: `for f in tests/unit/*.test.js; do node $f; done` — visi turi praeiti PRIEŠ keitimus.

- [ ] **Step 2: Įdėti naujus priešus į pasirinktus lygius**

Nuo lygio 8 ir toliau, po 1–2 naujus priešus lygyje; Boo tik tamsiuose/urviniuose lygiuose; DK ir Bowser Jr. — po vieną prieš bosų lygius.

- [ ] **Step 3: Run level validator**

Run: `node tests/unit/levels.test.js`
Expected: visi 52 lygiai `ok: true`

- [ ] **Step 4: Run Playwright suite for regressions**

Run: `node test-game.js && node test-expansion.js && node test-koopa-patrol.js`
Expected: PASS, nulis konsolės klaidų

- [ ] **Step 5: Cache bump + commit**

```bash
python3 bump-cache-version.py
git add -A && git commit -m "feat(villains): place new enemies across levels 8+"
```

---

## Self-Review

**Spec coverage:** aktorių pasiskirstymas → Task 1; galios → Task 7; fizika ±10% → Task 6; nauji blogiečiai → Task 8+9; architektūros failai → Task 1,2,3,7,8; testavimo punktai 1-4 → Task 4,6,8,9. Peach→Daisy narvelyje niuansas — Task 4, Step 5.

**Placeholders:** nėra TBD/TODO; kiekvienas žingsnis turi konkrečią komandą arba kodą.

**Type consistency:** `Characters.byId`, `Characters.PLAYABLE_IDS`, `CharacterSettings.selectedId`, `heroKey`/`heroBigKey`, `HeroPowers.*`, `Villains.*` naudojami vienodai visuose taskuose.
