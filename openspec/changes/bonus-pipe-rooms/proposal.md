# Bonus vamzdžių kambariai

## Problem
Vamzdžiai dabar tik dekoratyvūs/kliūtys. Klasikiniame Mario galima nusileisti į vamzdį ir
patekti į slaptą bonus kambarį.

## Goals
- „Enterable" vamzdžiai pažymimi tilemap (marker tileId 44 virš pipe žiočių)
- Mario stovėdamas ant enterable vamzdžio + paspaudus **↓** → nusileidimo animacija
- Perėjimas į **bonus kambarį**: mažas uždaras tilemap su monetomis + **1 matematikos iššūkiu**
- Surinkus/atsakius → išėjimo vamzdis grąžina į pagrindinį lygį toje pat vietoje
- State (score/coins/lives/isBig/fire) išsaugomas per registry ir atkuriamas

## Non-goals
- Ne kiekvienas vamzdis enterable (1–2 per lygį)
- Bonus kambary nėra priešų/bosų (tik monetos + matematika)

## Scope
**Nauji:** `js/scenes/BonusRoomScene.js` (mažas kambarys, monetos, MathChallenge, exit pipe).
**Modifikuojami:** `js/scenes/GameScene.js` (enterable pipe detection, ↓ input, save state, launch
BonusRoom, resume), `js/config.js` (registruoti BonusRoomScene), `js/utils/sprites.js` (room bg/tiles
jei reikia), `index.html`. Bonus kambariai pridedami ir į esamus lygius (markerius prideda
new-levels change owner / atskirai).

## Tasks
- [ ] T1 BonusRoomScene su tilemap, monetomis, exit pipe
- [ ] T2 GameScene: enterable pipe detection + ↓ input + animacija
- [ ] T3 State save/restore per registry
- [ ] T4 BonusRoom MathChallenge integracija
- [ ] T5 Markeriai keliuose esamuose lygiuose + smoke test
