# Fire Flower power-up + liepsnos burbuliukai

## Problem
Mario turi tik small/big būsenas, jokio puolimo per atstumą. Bosams reikia ginklo, o vaikams
— smagaus klasikinio ugnies mechanizmo.

## Goals
- Nauja būsena `fire` po `big`. Power grandinė: small → big → fire. Praradus galią: fire → big → small.
- Naujas ? bloko turinys `fireflower` (tileId 42), sprite `generateFireFlower()`
- Šaudymas: klaviatūra **F**, touch — naujas ugnies mygtukas; max 2 burbuliukai vienu metu
- `Fireball` entity (naujas failas): horizontalus greitis, atšoka nuo žemės, gravitacija, ~3s gyvybė, naikina priešus, +taškai
- Fire Mario vizualas — baltai/raudonai atspalvintos animacijos

## Non-goals
- Nekeičiam big/small grybų logikos esmės (tik prailginam grandinę)
- Burbuliukai nedaro žalos bosui per sienas (žr. boss-battles)

## Scope
**Nauji:** `js/entities/Fireball.js`. **Modifikuojami:** `js/scenes/GameScene.js` (fire state,
shoot input, fireball group, collisions, powerUp/loseOnePower grandinė), `js/utils/sprites.js`
(`generateFireFlower`, `generateFireball`, fire-mario tint anim), `js/scenes/BootScene.js` (tekstūros),
`js/utils/audio.js` (`fireShoot`), `js/utils/touch.js` (fire mygtukas), `index.html`.

## Tasks
- [ ] T1 Fireball.js entity + fizikos
- [ ] T2 sprites: fireflower, fireball, fire-mario anim
- [ ] T3 BootScene registracija
- [ ] T4 GameScene: fire būsena + grybo grandinė
- [ ] T5 GameScene: shoot input + fireball group + collisions
- [ ] T6 touch mygtukas + audio
- [ ] T7 index.html script tag + syntax check + smoke test
