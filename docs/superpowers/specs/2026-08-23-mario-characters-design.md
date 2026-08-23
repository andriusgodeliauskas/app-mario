# Daugiau Mario veikėjų: personažo pasirinkimas + blogiečių įvairovė

Data: 2026-08-23
Statusas: patvirtintas (brainstorming)

## Problema

Žaidime yra vienintelis žaidžiamas herojus (Mario) ir du priešų tipai
(Goomba, Koopa) plius Bowser bosas. Vaikams trūksta (a) priežasties pereiti
tą patį lygį iš naujo ir (b) vizualios įvairovės 52 lygiuose.

## Sprendimas

Pridėti 8 žaidžiamus herojus su pasirinkimu meniu ir 5 naujus blogiečius.
Kiekvienas herojus turi savo galią; bazinė fizika svyruoja ne daugiau kaip
±10%, kad nė vienas iš 52 esamų lygių netaptų neįveikiamas.

## Aktorių pasiskirstymas

Žaidžiami (8): Mario (esamas), Luigi, Peach, Toad, Yoshi, Daisy, Rosalina,
Diddy Kong.

Blogiečiai (5 nauji): Wario, Waluigi, Boo, Bowser Jr., Donkey Kong.
Bowser lieka finalinis bosas (`js/entities/Boss.js`, nekeičiamas).

Peach lieka ir gelbstimoji. Kai žaidžiama Peach, narvelyje sėdi Daisy.

## Herojų galios

Fizika aprašoma dviem daugikliais nuo bazės (greitis 200, dabartinis šuolis).
Galia yra atskiras, lygių geometrijos nekeičiantis priedas.

**Pataisymas įgyvendinimo metu:** pradinis planas numatė 0.95 daugiklius Peach,
Rosalina ir Diddy. Patikra (`tests/hero-reach.test.js`) parodė, kad 6 lygiuose
(1, 5-9) ties 195-199 stulpeliu yra 5 plotelių tuštumos tarpas, kurio 0.95
greičio herojus nepasiekia. Todėl galioja griežtesnė taisyklė: **joks herojus
negali būti prastesnis už Mario** — daugikliai yra 1.00 arba 1.10, niekada
mažiau. Skirtumus kuria galios, ne trūkumai.

| Herojus | speedMul | jumpMul | Galia |
|---|---|---|---|
| Mario | 1.00 | 1.00 | ugnies gėlė (esama mechanika) |
| Luigi | 1.00 | 1.10 | slidesnis stabdymas (mažesnė trintis) |
| Peach | 1.00 | 1.00 | sklendimas: laikant šuolio mygtuką krytis sulėtėja ~0.6 s |
| Toad | 1.10 | 1.00 | greitas startas (didesnis pagreitis) |
| Yoshi | 1.00 | 1.00 | žemas antras šuolis ore (60% pirmojo) |
| Daisy | 1.00 | 1.00 | atšokimas nuo priešo +40% (kombo grandinė) |
| Rosalina | 1.00 | 1.00 | Luma skrieja aplink ir traukia monetas bei angliškų žodžių burbulus |
| Diddy Kong | 1.10 | 1.00 | ridenimosi spurtas (trumpas greitėjimas dvigubai spustelėjus kryptį) |

Galios neįjungiamos, kol nepatvirtinta, kad lygiai išeinami su visais
speedMul/jumpMul deriniais (žr. Testavimas).

## Nauji blogiečiai

Nauji tilemap kodai (esami: 60 = goomba, 61 = koopa):

| Kodas | Priešas | Elgsena |
|---|---|---|
| 62 | Wario | vaikšto lėtai, pastebėjęs žaidėją įsibėgėja; užminamas |
| 63 | Waluigi | ilgakojis, periodiškai peršoka žaidėją; užminamas |
| 64 | Boo | sustingsta, kai žaidėjas žiūri į jį; vejasi, kai nusisukama. Neužminamas — reikia apeiti |
| 65 | Bowser Jr. | mini-bosas kiaute, 2 HP, du užminimai |
| 66 | Donkey Kong | mini-bosas ant platformos, ridena statines žemyn |

Nauji priešai nededami į esamus 52 lygius automatiškai — kodai tik tampa
prieinami. Atskiras žingsnis (etapas 3b) rankiniu būdu įterpia juos į
pasirinktus lygius, kad sunkumas nepašoktų.

## Architektūra

Naujuose failuose, sekant esamus projekto šablonus (IIFE + globalus objektas,
jokio build žingsnio):

- `js/data/characters.js` — `CHARACTERS` registras. Kiekvienam: `id`,
  `name` (EN), `lt`, `palette` (spalvų objektas kaip `C`), `physics`
  ({speedMul, jumpMul}), `power` (id eilutė), `description` (EN, kortelėms).
- `js/utils/sprites-heroes.js` — `generateHeroes(scene)`. Bendras kūno
  skeletas (kojos, rankos, liemuo, pozos) + per-veikėją `head` ir `body`
  kabliukai (karūna, grybo kepurė, dinozauro galva, suknelė). Išveda
  tekstūras `hero-<id>` ir `hero-<id>-big` su **identišku 5 kadrų
  128×128 išdėstymu** kaip `mario` (0-2 bėgimas, 3 šuolis, 4 mirtis).
- `js/utils/sprites-villains.js` — Wario, Waluigi, Boo, Bowser Jr., DK.
- `js/utils/characterSettings.js` — localStorage `app-mario:character:v1`,
  tiksliai `MathSettings` šablonu (load/save/defaults/validacija, saugus
  fallback kai localStorage neprieinamas).

Keitimai esamuose failuose:

- `js/scenes/BootScene.js` — ciklas per `CHARACTERS`, kuriantis
  `<id>-idle/run/jump/death` animacijas tuo pačiu būdu kaip `mario-*`.
- `js/scenes/GameScene.js` — ~6 vietos, kur `'mario'` užkoduotas
  (239, 773, 1732, 1769, 1956) → `this.heroKey`; `var speed = 200` (725)
  → `200 * this.heroPhysics.speedMul`.
- `js/scenes/MenuScene.js` — portretų juosta virš pasaulio pasirinkimo.
- `index.html` — nauji `<script>` įrašai (per `bump-cache-version.py`).

Kadangi herojų tekstūros turi identišką kadrų išdėstymą, animacijų logika,
big/small perėjimai ir mirties kadras veikia be pakeitimų — keičiasi tik raktas.

## Testavimas

1. `levelValidator` paleidžiamas visiems 52 lygiams su kiekvienu iš 8
   speedMul/jumpMul derinių. Bet koks lygis, kuris tampa neišeinamas,
   sustabdo tos fizikos patvirtinimą (koreguojamas daugiklis, ne lygis).
2. Esami Playwright testai turi praeiti nepakitę su numatytuoju Mario.
3. Regresijos testai: Boo žiūrėjimo mechanika, Bowser Jr. dviejų užminimų
   seka, Peach sklendimas neleidžia be galo kaboti ore.
4. Konsolės klaidų nulis pereinant po vieną lygį kiekvienu herojumi.

## Etapai

1. Registras + herojų sprite'ai + pasirinkimo meniu (žaidžiama visais 8,
   fizika vienoda) — pilnai veikianti vertė.
2. Fizikos daugikliai + galios.
3. Nauji blogiečiai (3a: sprite'ai ir elgsena; 3b: įterpimas į lygius).
4. Neprivaloma: kolekcionuojamos kortelės su angliškais aprašymais.

## Ko sąmoningai nedarome (YAGNI)

- Jokio veikėjų atrakinimo/progreso — visi 8 prieinami iš karto.
- Jokių garsų iš Nintendo puslapio.
- Bowser boso mechanika nekeičiama.
