# app-mario didysis plėtinys — dizainas

**Data:** 2026-05-31
**Statusas:** Patvirtinta (vartotojas patvirtino 2026-05-31)

## Kontekstas

`app-mario` — Phaser 3 Super Mario stiliaus žaidimas, mokantis anglų kalbos ir matematikos
6–7 m. vaikams. Visos sprites generuojamos programiškai (Canvas API, 4x). Šiuo metu:

- **14 lygių** (`getLevel1..14Data()` GameScene.js), tilemap 300×19, TILE=32px
- Mario būsenos: **small / big** (grybas). Nėra šaudymo.
- Priešai: **Goomba, Koopa**. Nėra bosų.
- **Matematikos iššūkiai**: periodiškai pasirodo medinė lentelė `a ? b = ?` + 3 atsakymų
  blokai, mušami iš apačios (`MathChallenge`, `MathSpawner`, `MathGen`, `MathSettings`).
- Power-up turinys ? blokuose: coin (4), mushroom (40), star (41 — dalinai yra `this.stars`).
- Perėjimai: GameScene → WinScene → kitas lygis. Atrakinimas: cookie `marioMaxLevel` +
  `window.GameProgress`.

## Tikslas

Pridėti: 5 naujus lygius, vamzdžių bonus kambarius, ugnies šaudymą, bosų kovas, naują
matematikos tipą („Rasti X"), ir kelias klasikines Mario mechanikas. **Matematika lieka
integruota visur** (bonus kambariai ir bosai naudoja matematiką).

## Architektūra — 6 nepriklausomos OpenSpec changes

Kiekviena nauja logika gyvena **atskiruose moduliuose** (GameScene jau 3172 eil. —
neauginam monolito). Kiekviena change turi unit + Playwright testus.

### 1. `math-missing-operand` — užduoties tipas `8 − x = 3`
- `MathGen.next()` palaiko `missingOperand` formą: rodo `a ? x = c` arba `x ? b = c`,
  3 blokuose — galimi **x** variantai (teisingas + 2 distraktoriai).
- Saugios taisyklės: x ≥ 0, sveikieji, neperžengia rėžio; nėra neigiamų.
- `MathSign` atvaizduoja `x` raudonai (kintamasis).
- Naujas perjungiklis `SettingsScene`: „Rasti X". Kai įjungtas, dalis (~40%) iššūkių
  generuojami kaip missing-operand iš įjungtų operacijų.

### 2. `fire-flower-power` — Ugnies gėlė + liepsnos burbuliukai
- Nauja Mario būsena `fire` (po `big`). Power grandinė: small → big → fire.
- Naujas ? bloko turinys `fireflower` (tileId 42). Sprite: `generateFireFlower()`.
- Šaudymo mygtukas (klaviatūra: **F** arba **↓+SPACE**; touch: nauja ugnies mygtukas).
- `Fireball` entity: skrieja horizontaliai, atšoka nuo žemės, gravitacija; naikina
  priešus; max 2 vienu metu; gyvuoja ~3s arba iki sienos.
- Praradus galią: fire → big → small (klasikinė grandinė), o ne iškart mirtis.
- Sprites: `generateFireMario*` animacijos (atspalvis), `generateFireball()`.

### 3. `classic-mario-extras` — 4 klasikinės mechanikos
- **1-UP gyvybės**: 100 monetų → +1 gyvybė; žalias 1-UP grybas (? blokas tileId 43).
- **Žvaigždės nemirtingumas**: išplėsti esamą star — mirgėjimas, invincible timer,
  priešų naikinimas prisilietus, tema-muzika.
- **Judančios platformos** (tileId 12) + **judantys vamzdžiai**: kinematic platformos,
  ant kurių Mario stovi (carry velocity).
- **Koopa kiauto spardymas**: užšokus ant Koopos — `shell` būsena; spyris paleidžia
  kiautą, kuris naikina kitus priešus ir atšoka nuo sienų.

### 4. `bonus-pipe-rooms` — nusileidimas į vamzdį → vidinis kambarys
- „Enterable" vamzdžiai pažymimi nauju tileId (pvz. 6 viršus + marker 44).
- Paspaudus **↓** stovint ant enterable vamzdžio žiočių — animacija (Mario nusileidžia),
  tada `GameScene` perkraunamas į **bonus kambario** režimą (mažas uždaras tilemap su
  monetomis + **1 matematikos iššūkiu**), arba atskiras lengvas `BonusRoomScene`.
- Surinkus/atsakius — išėjimo vamzdis grąžina į pagrindinį lygį (ta pati pozicija,
  išsaugomas score/coins/lives).
- Po 1–2 enterable vamzdžius kiekviename lygyje.

### 5. `boss-battles` — bosų kovos
- `Boss` entity: HP juosta (HUD), atakų raštai (judėjimas, sviediniai), pažeidžiamumo
  langai. Nugalimas **liepsnos burbuliukais** arba šuoliais ant galvos (kai atvira).
- **Matematikos vartai**: tarp bosų fazių pasirodo matematikos iššūkis; teisingas
  atsakymas atveria pažeidžiamumo langą / padaro žalą.
- Pasirodo lygių **5, 10, 15** gale (mini-bosai) + didelis **finalinis bosas** po 19.
- Boss kambarys: kamera užfiksuojama, vėliava pakeičiama bosu; nugalėjus — pergalė/kitas.
- Priklauso nuo `fire-flower-power` (ginklas).

### 6. `new-levels-15-19` — 5 nauji pilni lygiai
- `getLevel15..19Data()` + temos (Volcano, Swamp, Cloud City, Candy, Final Castle),
  bgColors, tileTint, music, decorations.
- Integruoja vamzdžių bonus kambarius ir naujas mechanikas; 15 lygyje — mini-bosas,
  19 — finalinis bosas.
- Atnaujinimai: `MenuScene` tinklelis → 19, atrakinimo grandinė, `WinScene` finalinė
  pergalė po 19, `levelValidator` pasiekiamumo testai.
- Paskutinis — sujungia visas mechanikas.

## Vykdymo eiliškumas (agentais)

- **Banga A (lygiagrečiai):** `math-missing-operand` · `fire-flower-power` ·
  `classic-mario-extras` — nepriklausomi posistemiai.
- **Banga B:** `bonus-pipe-rooms` · `boss-battles` (po fire-flower).
- **Banga C:** `new-levels-15-19` — sujungia mechanikas.

Po kiekvienos bangos — `superpowers:code-reviewer` peržiūra + Playwright smoke testai.

## Non-goals

- Nekeičiame esamos anglų kalbos mokymosi sistemos.
- Neperrašome esamų 1–14 lygių geometrijos (tik pridedam vamzdžių markerius/platformas).
- Jokių išorinių UI/žaidimo bibliotekų — viskas Phaser native + Canvas sprites.
- Jokio neigiamo matematikos rezultato, jokių trupmenų.

## Rizikos

- **GameScene monolitas** — visa nauja logika atskiruose moduliuose; GameScene tik
  kviečia `system.update()`.
- **Bonus kambario perėjimas** — rizika prarasti state; sprendimas: saugoti score/coins/
  lives/isBig/fire registry'je prieš perėjimą, atkurti grįžus.
- **Boss balansas 6 m. vaikui** — HP mažas (3–5), aiškūs telegrafuoti atakų raštai,
  matematikos vartai mokomieji, ne baudžiamieji.
- **Touch valdymas** — naujas ugnies mygtukas neturi trukdyti šuoliui; atskira zona.
