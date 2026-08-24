# Sunkiausio lygio grėsmės

Data: 2026-08-24
Statusas: patvirtintas (brainstorming)

## Problema

`hard` sunkumas nuo `harder` skiriasi tik skaičiais (daugiau priešų, greitesni,
mažiau laiko atsakyti). Vaikui, kuris jau perprato žaidimą, tai nėra kitoks
iššūkis — tik tas pats žaidimas su didesniais skaičiais.

## Sprendimas

Keturios grėsmės, veikiančios **tik `hard` profilyje**. Kiekviena mokina
skirtingo įgūdžio ir veikia visuose lygiuose nekeičiant nė vieno lygio
geometrijos.

## Pagrindinis principas: įspėta, ne netikėta

6-7 m. vaikui grėsmė, atimanti gyvybę be perspėjimo, yra ne sunki, o
neteisinga — vaikas nustoja žaisti. Kiekviena grėsmė turi matomą telegrafą
prieš smūgį.

## Grėsmės

### 1. Lietus

Ciklas: 35 s ramybės → **3 s įspėjimas** (dangus tamsėja, griaustinis, HUD
užrašas „LIETUS!") → 6 s liūtis → iš naujo.

Liūties metu kas 800 ms tikrinama, ar virš žaidėjo yra kieta plytelė. Nėra
priedangos → `playerHit()` (tas pats kelias kaip nuo priešo: mažas herojus
praranda gyvybę, didelis sumažėja).

Pirmas patikrinimas įvyksta praėjus 800 ms nuo liūties pradžios, ne iš karto —
kartu su 3 s įspėjimu vaikas turi beveik 4 sekundes pasislėpti.

### 2. Žaibas (liūties metu)

Kas ~2,5 s parenkamas stulpelis netoli žaidėjo. **1 s ant žemės matomas
šešėlis**, tada smūgis. Pataiko tik jei žaidėjas per 40 px nuo to stulpelio IR
neturi priedangos. Priedanga saugo ir nuo žaibo — taisyklė viena: po stogu esi
saugus.

### 3. Persekiotojas

Po 20 s lygyje už žaidėjo nugaros atsiranda Boo ir vejasi 85% žaidėjo greičio
(170 px/s). Nepasiveja judančio pirmyn; baudžia už stovėjimą.

Sąveika, kuri daro jį įdomų, o ne erzinantį: Boo sustingsta, kai į jį žiūri.
Atsisukęs atgal žaidėjas jį sustabdo — bet tuo metu neina pirmyn.

### 4. Vėjas

Pučia į šoną, keičia kryptį kas ~12 s, stiprumas ±45 px/s prie horizontalaus
greičio. HUD rodyklė rodo kryptį ir stiprumą. Perprojektuoja kiekvieną šuolį
nekeičiant nė vieno lygio.

### 5. Laiko limitas

300 s lygiui, rodoma HUD'e. Likus 60 s — skaitiklis raudonas. Pasibaigus —
`playerHit()`.

## Architektūra

- `js/utils/hazards.js` — `Hazards.init(scene)`, `.update(scene, delta)`,
  `.cleanup(scene)`, `.isActive(scene)`. Visa būsena scenoje (`scene._hazards`),
  kad scenos perkrovimas ją išvalytų.
- `js/utils/settings.js` — `hard` profilis gauna `hazards: true`. Kiti profiliai
  jo neturi, tad grėsmės niekur kitur neįsijungia.
- `js/scenes/GameScene.js` — `Hazards.init(this)` kūrime, `Hazards.update(this,
  delta)` kadre. Daugiau niekur.
- `js/scenes/HUDScene.js` — laikmatis, vėjo rodyklė, „LIETUS!" įspėjimas.

Sluoksniavimas: `Hazards` nieko nežino apie HUD — jis skelbia įvykius per
`scene.events.emit('hazard', {...})`, o HUD klausosi. Taip grėsmes galima
testuoti be HUD scenos.

## Teisingumo patikra (privaloma)

`tests/hazard-shelter.test.js`: kiekviename lygyje neturi būti ilgesnės nei
**12 plotelių** atkarpos be jokios dangos virš žemės kelio. Ilgesnė atkarpa =
neišvengiama žala per liūtį. Radus tokias vietas — įterpiami stogeliai, o ne
švelninamas lietus.

## Testavimas

1. `hazard-shelter.test.js` — dangos patikra visuose lygiuose (žr. aukščiau).
2. `hazards.test.js` — ciklo fazės, žala tik be dangos, žaibas nepataiko po
   stogu, vėjas keičia greitį, laikmatis baigiasi, persekiotojas sustingsta
   atsisukus.
3. `hazards-off.test.js` — `easy`/`medium`/`harder` profiliuose neatsiranda
   NIEKO: nei lietaus, nei vėjo, nei laikmačio.

## Ko sąmoningai nedarome

- Griūvančių platformų ir tamsos — reikalauja lygių perdarymo, atskiras etapas.
- Grėsmių Wonder kambariuose (43-52) — jie turi savo mechanikas, sumaišius būtų
  chaosas. Tik `GameScene` lygiai 1-42.
