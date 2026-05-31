# Bosų kovos

## Problem
Žaidime nėra bosų — trūksta kulminacijos ir iššūkio tarp lygių etapų.

## Goals
- `Boss` entity: HP (3–5), HP juosta HUD'e, atakų raštai (judėjimas + sviediniai), telegrafuoti
- Nugalimas **liepsnos burbuliukais** arba šuoliais ant galvos (kai atviras pažeidžiamumo langas)
- **Matematikos vartai**: tarp fazių pasirodo matematikos iššūkis; teisingas atsakymas atveria
  pažeidžiamumo langą / leidžia padaryti žalą (mokomoji integracija)
- Pasirodo lygių **5, 10, 15** gale (mini-bosai) + **finalinis bosas** po 19 lygio
- Boss kambarys: kamera fiksuojama, vėliava pakeičiama bosu; nugalėjus → WinScene/kitas lygis
- Vaikams saugu: aiškus telegrafas, maža žala, matematika mokomoji

## Non-goals
- Ne kiekvienas lygis turi bosą
- Boss nedaro instant-kill (small Mario praranda gyvybę kaip įprasta)

## Scope
**Nauji:** `js/entities/Boss.js` (HP, AI raštai, fazės), `js/systems/BossEncounter.js` (kamera lock,
math gate, HP juosta, pergalė). **Modifikuojami:** `js/scenes/GameScene.js` (boss lygiuose 5/10/15,
fireball↔boss collision, jump↔boss), `js/scenes/HUDScene.js` (boss HP juosta), `js/utils/sprites.js`
(`generateBoss*`, sviedinys), `js/utils/audio.js` (`bossHit`, `bossDefeat`, boss music), `index.html`.
Priklauso nuo `fire-flower-power`.

## Tasks
- [ ] T1 Boss sprite(s) + sviedinys
- [ ] T2 Boss.js entity: HP, judėjimas, atakos, fazės, telegrafas
- [ ] T3 BossEncounter.js: kamera lock, HP juosta, math gate, pergalė
- [ ] T4 GameScene integracija (lygiai 5/10/15 + finalas)
- [ ] T5 Fireball/jump žalos collisions
- [ ] T6 Audio + smoke test
