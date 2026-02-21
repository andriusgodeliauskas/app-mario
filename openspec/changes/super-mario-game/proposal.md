## Why

Reikia sukurti edukacinį Super Mario žaidimą 6 metų vaikui, kuriame klasikinis platformerio gameplay derinamas su minimaliu anglų kalbos mokymu. Žaidimas bus pasiekiamas per naršyklę adresu mario.godeliauskas.com ir papildys esamą edukacinių vaikų aplikacijų ekosistemą (app-english, app-menar, app-multiplay).

## What Changes

- Sukuriamas naujas HTML5 Canvas platformerio žaidimas su Phaser 3 framework
- Klasikinis Super Mario gameplay: bėgimas, šuoliai, monetos, ? blokai, priešai, power-ups
- 4 žaidimo lygiai: Grassland, Underground, Sky, Castle
- Anglų kalbos elementai: objektų pavadinimai angliškai, HUD angliškai, princesės dialogai EN/LT
- Touch valdymas mobiliems įrenginiams
- Pixel art retro grafika (16-bit stilius)
- Garso efektai ir foninė muzika
- Deploy į mario.godeliauskas.com per FTP

## Capabilities

### New Capabilities
- `game-engine`: Phaser 3 žaidimo variklis su fizika, sprite sistema, tilemap palaikymu
- `player-mechanics`: Mario valdymas — bėgimas, šuoliai (coyote time, jump buffering, variable height), power-ups
- `level-system`: 4 lygių sistema su skirtingomis temomis, priešais, platformomis
- `enemy-ai`: Priešų (Goomba, Koopa) elgsena ir collision detection
- `english-learning`: Anglų kalbos elementai — objektų pavadinimai, HUD, princesės dialogai
- `touch-controls`: Mobilaus valdymo mygtukai liečiamiems ekranams
- `audio-system`: Garso efektai ir foninė muzika
- `deploy-pipeline`: FTP deploy skriptas į mario.godeliauskas.com

### Modified Capabilities
<!-- Nėra esamų specifikacijų — naujas projektas -->

## Impact

- Naujas projektas `/workspace/child/app-mario/`
- Naujas subdomas: mario.godeliauskas.com (reikia sukurti hosting'e)
- Priklausomybės: Phaser 3 (CDN), naršyklė su Canvas palaikymu
- FTP deploy naudojant esamą serverį altas.serveriai.lt
