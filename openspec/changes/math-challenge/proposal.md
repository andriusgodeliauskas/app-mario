# Math Challenge: In-Level Arithmetic Mini-Game

## Problem
Žaidimas mokina anglų kalbos žodžius, bet neturi matematikos turinio. 6-7m vaikams reikia ir skaičiavimo praktikos. Norime pridėti matematikos iššūkius, kurie integruojasi į žaidimo srautą natūraliai, motyvuoja teisingai galvoti (ne atsitiktiniu spustelėjimu) ir leidžia tėvui konfigūruoti sunkumą pagal vaiko lygį.

## Goals
- Kas ~10s lygyje pasirodo medinė lentelė su uždaviniu (`2 + 3 = ?`) ir 3 žali atsakymo grybukai stovintys eilėje su skaičiais virš galvų
- Mario priverstas užšokti ant vieno iš trijų grybukų — užtvara neleidžia praeiti pro šalį
- Teisingas atsakymas: +50 taškų, +1 moneta, žalias popup'as "TEISINGAI! 2 + 3 = 5"
- Klaidingas atsakymas: praranda galias kaip nuo Goombos (didelis → mažas), raudonas popup'as su teisingu atsakymu (mokomasis momentas)
- Mažas Mario nemiršta nuo klaidos — atstumiamas atgal + −50 taškų + 1s nepažeidžiamumas (vaikams tinkama bauda, ne lygio katastrofa)
- Naujas SettingsScene leidžia įjungti/išjungti 4 veiksmus (sudėtis, atimtis, daugyba, dalyba) ir kiekvienam pasirinkti rėžį (10/20/50/100 sudėčiai-atimčiai, 10/20/50 daugybai-dalybai)
- Numatyta: tik sudėtis iki 10 (B1 — saugus pirmas paleidimas)
- Saugios matematikos taisyklės: niekada neigiami rezultatai, dalyba tik sveikais skaičiais, sumos/sandaugos neviršija pasirinkto rėžio
- Mišrios užduotys: jei įjungti keli veiksmai, atsitiktinai pasirenkamas vienas kiekvienam iššūkiui

## Non-goals
- Nekeičiame esamos anglų žodžių mokymosi sistemos
- Nekeičiame lygių struktūros, fizikos, priešų AI
- Nediegiame jokių išorinių UI bibliotekų — viskas Phaser native
- Nediegiame jokio testavimo framework'o (Jest/Mocha) — paprasti Node `assert` skriptai unit'ams
- Nepalaikome neigiamų atsakymų ar trupmenų

## Scope
**Nauji failai:**
- `js/utils/math.js` — `MathProblemGenerator` (gryna logika, ~200 eil.)
- `js/utils/settings.js` — `MathSettings` (localStorage I/O, ~80 eil.)
- `js/entities/MathSign.js` — medinė lentelė su uždaviniu (~50 eil.)
- `js/entities/AnswerMushroom.js` — žalias grybukas + medalionas su skaičiumi (~80 eil.)
- `js/entities/MathChallenge.js` — vienos užduoties valdiklis (~120 eil.)
- `js/systems/MathSpawner.js` — timer + saugios vietos paieška (~150 eil.)
- `js/scenes/SettingsScene.js` — UI ekranas nustatymams (~250 eil.)
- `tests/unit/math.test.js` — generator unit'ai (~150 eil.)
- `tests/unit/settings.test.js` — settings unit'ai (~80 eil.)
- `test-math-feature.js` — Playwright integracijos testai

**Modifikuojami failai:**
- `js/scenes/GameScene.js` — instancijuoti MathSpawner, pridėti `loseOnePower()` helper'į (refaktorinti esamą Goomba logiką į jį)
- `js/scenes/MenuScene.js` — pridėti ⚙️ nustatymų mygtuką
- `js/scenes/HUDScene.js` — quitDialog kviečia `mathSpawner.destroy()`
- `js/scenes/BootScene.js` — registruoti naujas sprite'as
- `js/utils/sprites.js` — `generateGreenMushroom()`, `generateWoodSign()`, `generateAnswerMedallion()`
- `js/utils/audio.js` — du nauji efektai: `mathCorrect`, `mathWrong`
- `index.html` — `<script>` tag'ai naujiems failams

## Risk
- **GameScene jau 2291 eil.** — nauja logika privalo gyventi atskiruose moduliuose, kad neaugintume monolito. Mitigacija: spawner + challenge + entity klasės atskiruose failuose, GameScene tik kviečia `spawner.update(time, delta)`.
- **localStorage neprieinama privačiame naršyme** — `try/catch` aplink visus I/O su fallback į defaults.
- **Saugios vietos algoritmas gali nerasti vietos siaurame lygyje** — po 5s laukimo timer'is resetinamas, kitas iššūkis bandomas po 10s. Be klaidų.
- **Per griežta bauda 6m vaikui** — A3 sprendimas: mažas Mario nemiršta nuo matematikos klaidos, tik atstumiamas atgal.
- **Šuolio aukštis vs. lentelės pozicionavimas** — Mario maks. šuolis 169px; lentelė statoma 160px aukštyje, kad būtų pasiekiama nuo grybuko galvos.
