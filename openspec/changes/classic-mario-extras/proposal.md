# Klasikinės Mario mechanikos (1-UP, žvaigždė, platformos, kiautas)

## Problem
Trūksta klasikinių Mario elementų, kurie praturtina žaidimą ir įvairina iššūkį.

## Goals
- **1-UP gyvybės**: 100 surinktų monetų → +1 gyvybė (counteris resetinasi); žalias 1-UP grybas (? blokas tileId 43)
- **Žvaigždės nemirtingumas**: išplėsti esamą star — invincible timeris (~8s), mirgėjimas, priešų naikinimas prisilietus, garsas
- **Judančios platformos** (tileId 12): kinematic, juda horizontaliai/vertikaliai, Mario nešamas (carry)
- **Judantys vamzdžiai**: kai kurie pipe segmentai juda aukštyn/žemyn
- **Koopa kiauto spardymas**: užšokus → `shell` būsena (sustoja); spyris paleidžia kiautą, naikinantį kitus priešus, atšoka nuo sienų

## Non-goals
- Nekeičiam esamos Goomba logikos
- Žvaigždė neapsaugo nuo duobių (fall death lieka)

## Scope
**Modifikuojami:** `js/scenes/GameScene.js` (coin→1up, star invincible, moving platforms grupė+update,
koopa shell state+kick), `js/entities/Koopa.js`, `js/utils/sprites.js` (`generate1UpMushroom`, moving
platform, shell frame), `js/scenes/BootScene.js`, `js/scenes/HUDScene.js` (gyvybių/monetų rodymas),
`js/utils/audio.js` (`oneUp`, `kick`, `invincible`), `index.html`.

## Tasks
- [ ] T1 1-UP: monetų counteris + 1up grybas (tileId 43) + sprite
- [ ] T2 Žvaigždė: invincible timeris, mirgėjimas, priešų naikinimas
- [ ] T3 Judančios platformos (tileId 12) + carry
- [ ] T4 Judantys vamzdžiai
- [ ] T5 Koopa shell state + kick mechanika
- [ ] T6 HUD + audio + index.html + smoke test
