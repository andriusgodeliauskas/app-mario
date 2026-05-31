# Nauji lygiai 15–19

## Problem
14 lygių jau yra; norime 5 naujų su naujomis temomis, integruojančių visas naujas mechanikas.

## Goals
- `getLevel15..19Data()`: temos **15 Volcano, 16 Swamp, 17 Cloud City, 18 Candy, 19 Final Castle**
- Kiekvienam: bgColor, tileTint, music, decorations, validuotas pasiekiamumas (levelValidator)
- Integruoja vamzdžių bonus kambarius (markeriai), judančias platformas, ugnies gėlę, žvaigždę
- **15 lygyje** — mini-bosas, **19 lygyje** — finalinis bosas (kartu su boss-battles)
- MenuScene tinklelis → 19; atrakinimo grandinė; WinScene finalinė pergalė po 19

## Non-goals
- Neperrašom 1–14 geometrijos
- Boss logika gyvena boss-battles change (čia tik placement)

## Scope
**Modifikuojami:** `js/scenes/GameScene.js` (`getLevel15..19Data`, bgColors/tileTint/music įrašai),
`js/scenes/MenuScene.js` (15–19 kortelės, grid), `js/scenes/WinScene.js` (finalas po 19, unlock 19),
`js/utils/sprites.js` (naujos dekoracijos jei reikia), `js/utils/levelValidator.js` (testai).

## Tasks
- [ ] T1 getLevel15Data (Volcano) + tema + dekoracijos + bonus pipe + mini-bosas
- [ ] T2 getLevel16Data (Swamp)
- [ ] T3 getLevel17Data (Cloud City) — judančios platformos
- [ ] T4 getLevel18Data (Candy)
- [ ] T5 getLevel19Data (Final Castle) + finalinis bosas
- [ ] T6 MenuScene grid → 19 + unlock grandinė
- [ ] T7 WinScene finalas po 19
- [ ] T8 levelValidator pasiekiamumo testai visiems 15–19
