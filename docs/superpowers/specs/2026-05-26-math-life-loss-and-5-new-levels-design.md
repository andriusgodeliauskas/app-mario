# app-mario — Math klaida atima gyvybę + 5 nauji lygiai (10–14)

**Data:** 2026-05-26
**Statusas:** patvirtinta, įgyvendinama

## Tikslas

Trys pakeitimai vaikų Mario žaidime (mario.godeliauskas.com):

1. Neteisingas matematikos atsakymas atima gyvybę (kaip atsitrenkus į priešą).
2. Matematikos užduotys atsiranda ~10 % dažniau.
3. 5 nauji, sudėtingesni lygiai (10–14) su visiškai naujais vizualiniais motyvais.

Žaidimas skirtas 6–7 m. vaikams — sudėtingumas auga, bet kiekvienas lygis **lieka pereinamas** (jokių neįmanomų šuolių).

---

## Item 1 — Math klaida atima gyvybę

**Dabar:** `GameScene.loseOnePower({source:'math'})` mažam Mario daro tik atstūmimą (vx=-200, vy=-300), −50 taškų, 2.5 s neliečiamumą — **gyvybė neprarandama**.

**Nauja elgsena = identiška priešo logikai:**

| Mario būsena | Neteisingas math atsakymas |
|---|---|
| Didelis | → tampa mažu, 2 s neliečiamumas (gyvybė neprarandama) |
| Mažas | → `playerDeath()`: −1 gyvybė, mirties animacija, respawn arba Game Over jei `lives <= 0` |
| Star power | nepaveiktas (imunitetas lieka) |

**Įgyvendinimas:**
- `js/entities/MathChallenge.js`: neteisingo atsakymo handleris kviečia `scene.loseOnePower({source:'enemy'})` vietoj `{source:'math'}`.
- `js/scenes/GameScene.js`: `loseOnePower` `source==='math'` šaka tampa nebenaudojama → pašalinama (lieka tik bendra: didelis→mažas, mažas→`playerDeath`). Komentaras atnaujinamas.
- Edukacinis raudonas popup su teisingu atsakymu ir `mathWrong` garsas **lieka** (rodomi prieš damage).
- Math challenge cleanup turi įvykti prieš `playerDeath` scene restart (jau veikia `playerDeath` viduje per `mathSpawner.destroy()`).

**Testas:** atnaujinti lūkestį `tests/` / `test-math-feature.js` — po neteisingo atsakymo mažam Mario `lives` sumažėja 1 (vietoj knockback be mirties).

---

## Item 2 — Math užduotys 10 % dažniau

`js/systems/MathSpawner.js`: `this.SPAWN_INTERVAL = 6000` → `5400` (ms). Tai vienintelis pakeitimas; visi taimerio reset'ai naudoja šią konstantą.

---

## Item 3 — 5 nauji lygiai (10–14)

### Vizualų strategija (Variantas A)

Kiekvienam naujam lygiui:
- Unikalus dangaus fonas (`bgColors` įrašas).
- 2–3 **nauji Canvas-generuoti dekoracijų sprite'ai** (tikrai nauja grafika) — registruojami `BootScene`, piešiami `sprites.js`.
- Tematinis tile'ų atspalvis (per-lygio tint ant ground/stone, kad žemė atrodytų temos spalvos).

Tile geometrija (atlasas `tiles`, frame'ai 64×64, setScale 0.5) **nekeičiama** — tik tint. Tai išlaiko fiziką/collision stabilius.

### Temos

| # | EN / LT | Dangus (hex) | Tile tint | Nauji sprite'ai | Muzika |
|---|---|---|---|---|---|
| 10 | CAVE / Ola | `#1A1230` | tamsiai pilka-mėlyna | `crystal-deco`, `stalactite-deco` | underground |
| 11 | JUNGLE / Džiunglės | `#0E3A1E` | sodri žalia | `vine-deco`, `palm-deco`, `leaf-deco` | overworld |
| 12 | OCEAN / Vandenynas | `#2E86C1` | žydra-balta | `wave-deco`, `coral-deco`, `plank-deco` | overworld |
| 13 | SPACE / Kosmosas | `#05050F` | šaltai pilka | `planet-deco`, `starfield-deco`, `rocket-deco` | castle |
| 14 | RAINBOW / Vaivorykštė | `#FFB6E6` | šviesi vaivorykštinė | `rainbow-arch-deco`, `sparkle-deco` | overworld |

(Temos/pavadinimai gali būti koreguojami; sprite'ai piešiami pixel-art Canvas stiliumi, derančiu prie esamų dekoracijų.)

### Sudėtingumo dizainas (visi svertai, laipsniškai 10→14)

Bendros taisyklės (sąžiningumas 6–7 m.):
- Vertikalūs šuoliai ≤ ~5 tile (Mario šuolio aukštis ~5.3 tile / 169 px).
- Horizontalios duobės ≤ ~4–5 tile (pereinamos su įsibėgėjimu); kiekviena duobė turi nusileidimo platformą.
- Lava/vanduo mechaniškai = duobė (kritimas žemiau pasaulio = mirtis), vizualiai temos spalvos. Saugūs tiltai (stone row) virš mirtinų duobių — mažiau nei ankstesniuose lygiuose, bet visada bent vienas pereinamas kelias.
- Priešai: tik `goomba` (60) ir `koopa` (61) — esami tipai.

Eskalacija:

| # | Pagrindinis iššūkis | Priešai (~) | Duobės | Platformos |
|---|---|---|---|---|
| 10 Ola | vertikalus laipiojimas, siauros stone platformos | 12 | mažos, retos | siauros, daug aukščio kaitos |
| 11 Džiunglės | tankūs priešai + platform-hopping | 16 | vidutinės su platformomis | vidutinės |
| 12 Vandenynas | platūs vandens tarpai, tikslūs šuoliai | 16 | platesnės, lentų platformos | trumpos lentos virš vandens |
| 13 Kosmosas | ilgas, tikslus platforming virš tuštumos | 18 | dažnos, siauros | siauros, mažai saugių tiltų |
| 14 Vaivorykštė | finalas — viskas kartu, ilgiausias | 20 | plačiausios, minimalūs tiltai | mišrios, kulminacija |

Kiekvienas lygis: 300 col tilemap (kaip esami, per `getLevelData` extension), flagpole (70) gale, monetos (50), power-up ? blokai (4/40/41), ground rows 17–18, end staircase prieš flagpole.

### Kodo pakeitimai (failai)

- **`js/scenes/GameScene.js`**
  - `bgColors`: + įrašai 10–14.
  - `musicMap`: + įrašai 10–14 (žr. lentelę).
  - 5 naujos funkcijos `getLevel10Data`–`getLevel14Data` (hardcoded tilemap'ai).
  - `createDecorations`: naujos šakos kiekvienam naujam sprite tipui.
  - Tile tint: per-lygio tint taikomas ground/stone tile'ams kūrimo metu (žemėlapis: `tileTint[level]`).
- **`js/utils/sprites.js`**: ~12 naujų dekoracijų sprite generatorių (Canvas API, pixel-art stilius).
- **`js/scenes/BootScene.js`**: naujų sprite'ų generavimas/registravimas.
- **`js/scenes/MenuScene.js`**
  - `levels` masyvas: + 5 įrašai (num, name, lt, color, icon).
  - Tinklelis: **3 stulpeliai → 5 stulpeliai × 3 eilutės** (14 kortelių + 1 tuščias slot). `col = i % 5`, `row = Math.floor(i / 5)`, `startX` perskaičiuojamas 5 stulpeliams. Telpa 800×600 (5×130 + 4×15 = 710 < 800; 3×105 + startY 165 = 480 < 600).
- **`js/scenes/WinScene.js`**
  - Finalo riba `playerLevel >= 9` → `>= 14`.
  - Tarpiniai lygiai: `unlockLevel(level+1)`; finalas (14): `unlockLevel(14)` ir pergalės/princesės ekranas.
- **`deploy.sh`**: patikrinti, kad visi keisti/nauji failai yra upload sąraše (GameScene, sprites, BootScene, MenuScene, WinScene, MathSpawner, MathChallenge jau turėtų būti).

---

## Architektūros principai

- Lygių duomenys lieka izoliuotose `getLevelNData` funkcijose — vienas lygis, viena funkcija.
- Sprite generatoriai — grynos Canvas funkcijos `sprites.js`, be priklausomybių nuo žaidimo būsenos.
- Temos konfigūracija (dangus, tint, muzika) — duomenų lentelėse `GameScene` viršuje, ne išbarstyta logikoje.

## Testavimas / verifikacija

1. **Syntax check** visų keistų JS failų (`node --check`).
2. **Unit:** math wrong-answer elgsena (mažas Mario → −1 gyvybė).
3. **Playwright** (`test-math-feature.js` ar naujas): visi 14 lygių užsikrauna be klaidų; math spawn intervalas; math klaida atima gyvybę.
4. **Manualus paleidimas:** kiekvienas naujas lygis pereinamas iki flagpole; meniu rodo 14 kortelių; dekoracijos matomos.
5. Tik patvirtinus verifikaciją — `bash deploy.sh`.

## Rizikos

- **Lygio pereinamumas:** didžiausia rizika — neperšokama duobė/per aukšta platforma. Mažinama laikantis ≤5 tile vertikalaus / ≤5 tile horizontalaus limito ir manualaus playtest.
- **Meniu išdėstymas:** 5 stulpeliai turi tilpti ir mažesniuose ekranuose (mobile scale Phaser FIT) — patikrinti.
- **Sprite'ų našumas:** ~12 naujų tekstūrų — generuojamos vieną kartą BootScene, įtakos nėra.
