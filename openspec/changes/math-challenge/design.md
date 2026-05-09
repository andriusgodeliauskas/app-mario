# Math Challenge — Detalus dizainas

## 1. Aukšto lygio architektūra

```
SettingsScene → localStorage → MathSettings.load()
                                    ↓
            GameScene.create() → new MathSpawner(scene, settings)
                                    ↓
            update() → 10s timer + safe-spot check → spawn MathChallenge
                                    ↓
            MathChallenge → MathProblemGenerator.next(settings, history)
                          → MathSign + 3× AnswerMushroom
                          → collision callback → correct/wrong → cleanup
                          → onResolved() → spawner.active = null
```

**Naujų modulių atsakomybės (Single Responsibility):**

| Failas | Atsakomybė | Phaser priklausomybės |
|---|---|---|
| `utils/math.js` | Uždavinių generavimas, distractoriai, anti-repeat | Nėra (gryna JS) |
| `utils/settings.js` | localStorage I/O, defaults, validacija | Nėra (gryna JS) |
| `entities/MathSign.js` | Lentelės sprite + tekstas, spawn/destroy animacijos | Phaser sprite/tween |
| `entities/AnswerMushroom.js` | Grybuko sprite + medalionas + collision body | Phaser arcade physics |
| `entities/MathChallenge.js` | Vienos užduoties koordinavimas (sign + 3 mushrooms) | Phaser collision |
| `systems/MathSpawner.js` | Timer, saugios vietos paieška, lifecycle valdymas | Phaser scene refs |
| `scenes/SettingsScene.js` | UI nustatymams | Phaser scene |

**`GameScene` minimalūs pakeitimai:**
- `create()`: `this.mathSettings = MathSettings.load(); this.mathSpawner = new MathSpawner(this, this.mathSettings);`
- `update(time, delta)`: prie esamų update'ų prideda `this.mathSpawner.update(time, delta);`
- Pridedamas `loseOnePower(opts)` helper'is — esamas Goomba collision iškvies su `{source: 'enemy'}`, matematikos klaida iškvies su `{source: 'math'}`. Vidinė logika sprendžia mirtį/atstūmimą pagal Mario dydį ir šaltinį.
- `playerDie()` → `this.mathSpawner.destroy()` PRIEŠ scene restart.

## 2. Duomenų modelis (Settings)

**localStorage raktas:** `app-mario:math-settings:v1`

**Schema:**
```js
{
  add:      { enabled: true,  max: 10 },
  subtract: { enabled: false, max: 10 },
  multiply: { enabled: false, max: 10 },
  divide:   { enabled: false, max: 10 }
}
```

**Rėžio variantai:**
- `add`, `subtract`: `[10, 20, 50, 100]`
- `multiply`, `divide`: `[10, 20, 50]`

**Versionavimas:** raktas baigiasi `:v1`. Schema pakeitus → `:v2`, senas raktas tiesiog ignoruojamas, vartotojas grįžta į defaults. Migracijos kodo nėra (YAGNI).

**`MathSettings` API:**
```js
MathSettings.defaults()       // → B1 default objektas (tik add iki 10)
MathSettings.load()           // try/catch localStorage → grąžina settings arba defaults
MathSettings.save(settings)   // validuoja, įrašo į localStorage, try/catch
MathSettings.enabledOps(s)    // → ['add', 'subtract'...] pagal enabled flag
MathSettings.isAnyEnabled(s)  // → bool
MathSettings.MAX_OPTIONS      // → { add: [10,20,50,100], subtract: [...], ... }
```

**Validacijos taisyklė:** jei `save()` gauna settings, kuriuose niekas nėra `enabled: true`, automatiškai nustato `add.enabled = true`. Užtikrina, kad iššūkiai veiks.

## 3. MathProblemGenerator

**Public API:**
```js
MathGen.next(settings, history) → {
  operation: 'add' | 'subtract' | 'multiply' | 'divide',
  a: number, b: number,
  symbol: '+' | '−' | '×' | '÷',
  answer: number,
  distractors: [number, number],
  options: [number, number, number]   // sumaišytas su answer
}
```

`history` — paskutinių 8 uždavinių keys masyvas (`"add:2:3"`).

**Algoritmas:**

1. **Pasirinkti veiksmą** iš `enabledOps(settings)` (random uniform). Jei tuščias → mėto `Error('No operations enabled')`.
2. **Generuoti operandus** pagal saugias taisykles (žr. žemiau).
3. **Anti-repeat:** jei key yra `history` paskutiniuose 8 įrašuose → bandom dar kartą (max 10 bandymų; po 10 nepavykusių grąžinam paskutinį, kad neužstrigtume).
4. **Distractoriai** (2 klaidingi atsakymai):
   - `d1` = `answer ± 1` arba `± 2` (random)
   - `d2` priklauso nuo veiksmo:
     - `add`/`subtract` → `|a - b|` arba `a + b` (sumaišyti veiksmai)
     - `multiply` → `a + b` (vaikai dažnai sumaišo × ir +)
     - `divide` → `a - b`
   - Validacija: `d1 ≠ d2 ≠ answer`, visi `≥ 0`, visi `≤ max × 2`. Jei netinka — fallback `[answer + 1, answer + 2]`, jei answer < 1 → fallback `[1, 2]`.
5. **Fisher-Yates shuffle** `[answer, d1, d2]` → `options`.

**Saugios operandų taisyklės:**

```js
add(max):       a, b ∈ [1..max]; iki kol a + b ≤ max
subtract(max):  a, b ∈ [1..max]; iki kol a ≥ b
multiply(max):  a, b ∈ [1..max]; iki kol a × b ≤ max
divide(max):    b ∈ [2..max]; answer ∈ [1..max]; a = b × answer; iki kol a ≤ max × 2
```

**Pavyzdžiai (max=10):**
- `add` → `2 + 3 = 5`, `7 + 2 = 9`, niekada `8 + 9`
- `subtract` → `9 - 3 = 6`, `5 - 5 = 0`, niekada `3 - 9`
- `multiply` → `2 × 3 = 6`, `3 × 3 = 9`, niekada `4 × 5 = 20`
- `divide` → `12 ÷ 3 = 4`, `9 ÷ 3 = 3`, niekada `100 ÷ 10`

## 4. MathSpawner — spawning + lifecycle

**Vidiniai laukai:**
```js
{
  scene, settings,
  nextSpawnAt: time + 10000,   // pirmas iššūkis po ~10s
  active: null,                 // esamas MathChallenge arba null
  history: [],                  // paskutiniai 8 keys
  pendingSince: null            // jei timer'is suveikė, bet saugios vietos nėra
}
```

**`update(time, delta)` srautas (C variantas):**

```
1. jei active ≠ null:
   - jei active.x < player.x - 500 → active.cleanup() // praleido kažkokiu būdu
   - return
2. jei time < nextSpawnAt → return
3. jei !MathSettings.isAnyEnabled(settings) → nextSpawnAt = time + 10000; return
4. spot = findSafeSpot() // žr. žemiau
5. jei spot === null:
   - jei pendingSince === null → pendingSince = time; return
   - jei time - pendingSince > 5000 → pendingSince = null; nextSpawnAt = time + 10000; return
   - return
6. active = new MathChallenge(scene, settings, history, spot.x, spot.y, () => {
     active = null;
     nextSpawnAt = time + 10000;
   });
   pendingSince = null
```

**`findSafeSpot()` algoritmas:**

```
mario_x = player.x
range = [mario_x + 400, mario_x + 900]

for x = range[0]; x < range[1]; x += 64:
  ground_y = findGroundTile(x)  // pirma solid tile žemyn nuo viršaus
  jei !ground_y → continue

  // 3 plytelės iš eilės plokščios žemės
  jei !isFlat(x, ground_y, 3) → continue

  // Virš grybukų vietos (4 plytelės) tuščia
  jei !isClearAbove(x, ground_y, 5) → continue

  // ±2 plytelės nuo centro: nėra priešų
  jei hasEnemyNear(x, ground_y, 2) → continue

  // ±2 plytelės: nėra duobės kraštuose
  jei hasPitNear(x, ground_y, 2) → continue

  // ne arčiau 5 plytelių iki flagpole
  jei distanceToFlagpole(x) < 160 → continue

  return { x: x, y: ground_y }

return null
```

**Cleanup taškai:**
- Mario miršta → `playerDie()` → `mathSpawner.destroy()` PRIEŠ restart
- HUDScene quit dialog → `gameScene.mathSpawner?.destroy()`
- Lygis baigiasi (flagpole) → `mathSpawner.destroy()`

## 5. MathChallenge lifecycle

**Konstruktorius:**
```js
new MathChallenge(scene, settings, history, x, y, onResolved)
```

**Inicializacija:**
1. `problem = MathGen.next(settings, history)`
2. `history.push("op:a:b")`; jei `history.length > 8` → `shift()`
3. `this.sign = new MathSign(scene, x, y - 160, problem)`
4. 3× `AnswerMushroom`:
   - X koordinatės: `[x - 48, x, x + 48]`
   - `value = problem.options[i]`
   - `isCorrect = (value === problem.answer)`
5. Kiekvienam mushroom: `scene.physics.add.collider(player, mushroom.sprite, this.onHit, null, this)`

**`onHit(player, mushroomSprite)` callback:**

```js
// Tik jei Mario kerta iš viršaus (klasikinis Mario taisyklės)
const isFromAbove = player.body.velocity.y > 0 && player.body.bottom <= mushroomSprite.body.top + 8;
jei !isFromAbove:
  // Mario priekiu atsitrenkė į grybuką — tiesiog atstumti, nelaikom kaip atsakymą
  player.body.velocity.x = (player.x < mushroomSprite.x ? -150 : 150)
  return

const mushroom = mushroomSprite._answerMushroomRef
jei this._resolved → return  // jei jau atsakyta, ignoruojam (race condition)
this._resolved = true

jei mushroom.isCorrect:
  AudioManager.play('mathCorrect')
  scene.score += 50
  scene.coins += 1
  scene.registry.set('score', scene.score)
  scene.registry.set('coins', scene.coins)
  scene.events.emit('coinCollect', scene.coins)
  showCorrectPopup(player.x, player.y - 80, problem)
  player.setVelocityY(-300)  // bouncy effect
  mushroom.destroy({ burstAsCoin: true })
  this._otherMushrooms.forEach(m => m.destroy())
  this.sign.destroy()

else:
  AudioManager.play('mathWrong')
  showWrongPopup(player.x, player.y - 80, problem)
  scene.loseOnePower({ source: 'math' })
  this._allMushrooms.forEach(m => m.destroy())
  this.sign.destroy()

setTimeout(() => onResolved(), 100)  // mažas delay, kad popup'ai turėtų laiko
```

**`scene.loseOnePower({ source })` helper'is:**
```js
jei this.player.isInvulnerable → return
jei this.player.isBig:
  // didelis → mažas (esama logika): setTexture/scale, isBig = false, 1s nepažeidžiamumas, mirksi
  this._shrinkPlayer()
  this._startInvulnerability(1000)
else:
  jei source === 'enemy':
    this.playerDie()  // esama logika
  else jei source === 'math':
    this.player.body.velocity.x = -200
    this.player.body.velocity.y = -300
    this.score = Math.max(0, this.score - 50)
    this.registry.set('score', this.score)
    this._startInvulnerability(1000)
```

## 6. Vizualinis sluoksnis

**Naujos sprite'os (Canvas API, `sprites.js`):**

`generateWoodSign()`:
- 256×96 px tekstūra (4x), `setScale(0.5)` → 128×48 world
- Layers: tamsus rėmas (#3B2208) → vidurinis brown (#A0522D) → šviesus highlight (#D2691E)
- Du varžtai kampuose (juodos elipsės)
- Stulpas (16×64) tamsesnio medžio po lenta

`generateGreenMushroom()`:
- 128×128 px, `setScale(0.25)` → 32×32 world
- Kepurė: žalias gradient (#1E8449 → #2ECC40 → #58D68D)
- 3 baltos apvalios dėmės kepurėje
- Kotas: kreminė (#F5DEB3) su šviesesniu top edge
- Akys: dvi baltos elipsės su juodais vyzdžiais (draugiškas veidas — kontrastas su Goomba)

`generateAnswerMedallion()`:
- 96×96 px, `setScale(0.5)` → 48×48 world
- Apskritimas: auksinis kraštas (#DAA520) → vidus (#FFE066) → centras (#FFFACD)
- Be teksto tekstūroje — skaičius piešiamas per `scene.add.text()` ant medallion sprite'o

**MathSign klasė:**
```js
class MathSign {
  constructor(scene, x, y, problem) {
    this.sprite = scene.add.sprite(x, y, 'wood-sign').setDepth(20)
    this.text = scene.add.text(x, y - 4,
      `${problem.a} ${problem.symbol} ${problem.b} = ?`,
      { fontFamily: 'Arial Black, sans-serif', fontSize: 28, color: '#1a1a1a',
        stroke: '#FFFFFF', strokeThickness: 2 })
      .setOrigin(0.5).setDepth(21)
    // spawn animacija: alpha 0→1 + y -16→0 (300ms ease-out)
    this.sprite.setAlpha(0); this.text.setAlpha(0)
    scene.tweens.add({ targets: [this.sprite, this.text],
      alpha: 1, y: '+=16', duration: 300, ease: 'Cubic.Out' })
  }
  destroy() {
    const scene = this.sprite.scene
    scene.tweens.add({ targets: [this.sprite, this.text],
      alpha: 0, y: '-=32', duration: 200,
      onComplete: () => { this.sprite.destroy(); this.text.destroy() } })
  }
}
```

**AnswerMushroom klasė:**
```js
class AnswerMushroom {
  constructor(scene, x, y, value, isCorrect) {
    this.value = value
    this.isCorrect = isCorrect
    this.sprite = scene.physics.add.sprite(x, y, 'green-mushroom')
      .setScale(0.25).setDepth(15)
    this.sprite.body.setSize(28, 28).setOffset(50, 50)
    this.sprite.body.setImmovable(true)
    this.sprite.body.setAllowGravity(false)
    this.sprite._answerMushroomRef = this  // back-reference for collision callback

    this.medallion = scene.add.sprite(x, y - 32, 'answer-medallion')
      .setScale(0.5).setDepth(16)
    this.numberText = scene.add.text(x, y - 32, String(value),
      { fontFamily: 'Arial Black, sans-serif', fontSize: 24, color: '#000',
        stroke: '#FFF', strokeThickness: 3 })
      .setOrigin(0.5).setDepth(17)

    // spawn: scale 0→1 elastic.out
    [this.sprite, this.medallion, this.numberText].forEach(o => o.setScale(o.scale * 0))
    scene.tweens.add({ targets: [this.sprite, this.medallion, this.numberText],
      scaleX: (i, o) => o.getData('originalScale') || o.scaleX, // kompleksiškiau, žr. impl.
      scaleY: ..., duration: 400, ease: 'Elastic.Out' })

    // idle: medallion + text plūduriavimas
    this.idleTween = scene.tweens.add({ targets: [this.medallion, this.numberText],
      y: '-=4', duration: 800, yoyo: true, repeat: -1 })
  }

  destroy(opts = {}) {
    const scene = this.sprite.scene
    this.idleTween?.stop()
    if (opts.burstAsCoin) {
      const coin = scene.add.sprite(this.sprite.x, this.sprite.y, 'coin')
      coin.play('coin-spin')
      scene.tweens.add({ targets: coin, y: '-=64', alpha: 0, duration: 600,
        onComplete: () => coin.destroy() })
    }
    scene.tweens.add({
      targets: [this.sprite, this.medallion, this.numberText],
      alpha: 0, scaleX: 0, scaleY: 0, duration: 200,
      onComplete: () => {
        this.sprite.destroy(); this.medallion.destroy(); this.numberText.destroy()
      }
    })
  }
}
```

**Popup'ai (per esamą `english.js` popup stilių):**

`showCorrectPopup(x, y, problem)`:
- Žalias gradient'inis fonas (#27AE60 → #2ECC71)
- Tekstas: `"TEISINGAI!\n${a} ${symbol} ${b} = ${answer}"`, baltas, 22px bold
- scale 0 → 1.2 → 1 (elastic.out, 500ms), holds 1s, fade out 300ms

`showWrongPopup(x, y, problem)`:
- Raudonas (#C0392B → #E74C3C)
- Tekstas: `"❌\n${a} ${symbol} ${b} = ${answer}"` (parodom teisingą atsakymą — mokomasis)
- Tas pats animacijos pattern, holds 1.5s

## 7. Audio

**`audio.js` du nauji efektai:**

`mathCorrect`:
- Linksmas arpeggio: C5 → E5 → G5 → C6 (~80ms each)
- Square wave su trumpu attack/decay envelope
- Tipo: panašus į esamą `coin` efektą, bet ilgesnis ir aukštesnis

`mathWrong`:
- Žemas dudenimas: A2 → F2 (~150ms each)
- Sawtooth wave, low-pass filter
- Tipo: panašus į esamą `damage` efektą

## 8. SettingsScene UI

**Layout (800×600 viewport):**
```
[0, 0] header (40px) — pavadinimas + ✕ mygtukas
[0, 60] eilutės (po 110px aukščio) — 4 veiksmai
[0, 520] išsaugoti mygtukas (60px aukščio)
```

**Vienos eilutės struktūra (900px plotis, paddingais centruotas):**
```
┌──────────────────────────────────────────────┐
│  [✓] Sudėtis  (+)                            │  ← toggle (vienas tap'as)
│      iki:  [10]  [20]  [50]  [100]           │  ← rėžio mygtukai (vienas selected)
└──────────────────────────────────────────────┘
```

**Stiliai:**
- Toggle ON: žalias kvadratas (✓), tekstas baltas
- Toggle OFF: pilkas kvadratas, tekstas pilkas, rėžio mygtukai pilki/disabled
- Rėžio mygtukas selected: oranžinis (#e87a2e — projekto akcento spalva), white text
- Rėžio mygtukas not selected: tamsus (#2C3E50), pilkas tekstas

**Mygtukai (top-right [✕] ir bottom [IŠSAUGOTI]):**
- ✕ — be saugojimo grįžta į MenuScene (`scene.start('MenuScene')`)
- IŠSAUGOTI — `MathSettings.save(this.workingSettings)` → grįžta į MenuScene

**Validacija (visi išjungti):**
- Jei vartotojas spaudžia IŠSAUGOTI su visais išjungtais → `MathSettings.save()` automatiškai įjungia `add` ir parodo trumpą popup'ą "Bent vienas veiksmas turi būti įjungtas — sudėtis įjungta automatiškai" prieš grįžtant.

**MenuScene pakeitimas:**
- Viršuje, dešinėje: ⚙️ ikona (interactive sprite arba text emoji su button background)
- Click: `this.scene.start('SettingsScene')`

## 9. Klaidų ir kraštinių atvejų valdymas

| # | Atvejis | Sprendimas |
|---|---|---|
| 1 | Mario miršta su aktyviu iššūkiu | `playerDie()` → `mathSpawner.destroy()` PRIEŠ scene restart |
| 2 | Quit per HUD | `quitDialog.confirm` → `gameScene.mathSpawner?.destroy()` |
| 3 | Pause / restart [X] mygtuku | Phaser pause sustabdo viską natyviai; restart per destroy() |
| 4 | Didelis Mario surenka Super Mushroom | Iššūkis nepriklauso nuo Mario dydžio |
| 5 | Klaida ant duobės krašto | safe-spot algoritmas užtikrina ±2 plytelės be duobės |
| 6 | `options` dublikatai | Generator validuoja unique; defensive 10 retry; fallback `[1,2]` |
| 7 | Vaikas nešoka, sėdi | Be laiko limito; spawner active != null → naujų nedaro |
| 8 | Saugi vieta nerasta | 5s laukimas → reset timer'is |
| 9 | Lygio pabaiga | Iššūkis blokuojamas paskutiniuose 5 plytelėse iki flagpole |
| 10 | localStorage neprieinama | try/catch su fallback į defaults |
| 11 | Visi veiksmai išjungti | Spawner praleidžia (be klaidos), validacija save'ui |
| 12 | Touch / mobile | Esami valdikliai veikia, naujų nereikia |
| 13 | Lygio pasikeitimas | Naujas spawner, nauja history |

## 10. Testavimas

**Sluoksnis 1 — unit testai (paprasti Node skriptai):**

`tests/unit/math.test.js`:
- 1000× generavimas kiekvienam veiksmui — visi atsakymai tarp 0 ir max
- `divide` → `a % b === 0` visais atvejais
- `subtract` → `a ≥ b` visais atvejais
- `options` length === 3, unique, contains answer
- Anti-repeat: su mock'inta history, tas pats key < 10% atvejų
- Mišrios užduotys: 4 įjungti veiksmai → kiekvienas ~25% (±5%)

`tests/unit/settings.test.js`:
- `defaults()` grąžina B1 (tik add iki 10)
- `save()` su pilnai išjungtu → `load()` grąžina su `add: enabled=true`
- localStorage round-trip
- Korumpuoti localStorage duomenys → fallback į defaults

**Sluoksnis 2 — Playwright integracija (`test-math-feature.js`):**

```
T1: Settings persistence — toggle, save, reload, verify
T2: Math challenge appears in level — fast-forward 12s
T3: Correct answer — score +50, popup, cleanup
T4: Wrong answer (small Mario) — knockback, score -50, alive
T5: Wrong answer (big Mario) — shrink, no death
T6: Disabled all ops — no challenges spawn
```

**Test hooks (tik dev/test režimu):**
```js
window.__mario_test = {
  scene: () => game.scene.getScene('GameScene'),
  spawnChallenge: (x, y) => ...,
  setMarioBig: () => ..., setMarioSmall: () => ...,
  forceJumpOn: (mushroomIndex) => ...,
  fastForward: (ms) => ...
}
```

## 11. Įgyvendinimo eiliškumas

1. **Pamatas (gryna logika, lengvai testuojama):** `math.js` + `settings.js` + jų unit'ai
2. **Vizualios sprite'os:** `sprites.js` papildymai + `BootScene.js` registracija
3. **Entity klasės:** `MathSign.js` + `AnswerMushroom.js`
4. **Pagrindinė logika:** `MathChallenge.js` + `MathSpawner.js`
5. **GameScene integracija:** `loseOnePower()` refaktoras, spawner instancijavimas
6. **SettingsScene + MenuScene mygtukas**
7. **Audio efektai** (`audio.js`)
8. **Playwright testai**
9. **Manualus QA + FTP deploy**
