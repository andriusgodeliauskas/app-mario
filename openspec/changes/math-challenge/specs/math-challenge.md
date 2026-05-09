# Spec: Math Challenge System

## Capability
In-level matematikos iššūkis, integruotas į Mario žaidimo srautą. Naudotojas (vaikas) sprendžia aritmetinius uždavinius šokinėdamas ant atsakymo grybukų. Tėvas konfigūruoja sunkumą per atskirą nustatymų ekraną.

## Requirements

### REQ-MC-1: Iššūkis spawninasi periodiškai
Lygio metu, kas ~10 sekundžių (su saugiomis sąlygomis), priešais Mario išdygsta:
- Medinė lentelė su uždaviniu (`a [+−×÷] b = ?`)
- 3 žali atsakymo grybukai eilėje su skaičiais virš galvų
- Tikslūs spawn'inimo kriterijai išdėstyti REQ-MC-7

### REQ-MC-2: Užtvara — vaikas privalo atsakyti
Trys grybukai stovi tankiai (16px tarpas tarp kraštų), kad Mario (32px) negalėtų pratūpti tarp jų. Lentelė virš grybukų pakankamai aukštai (160px), kad Mario negalėtų jos peršokti.

### REQ-MC-3: Teisingas atsakymas
Mario šoka ant grybuko su teisingu skaičiumi (kerta iš viršaus, `velocity.y > 0`):
- +50 taškų, +1 moneta
- `mathCorrect` audio efektas
- Žalias popup'as `"TEISINGAI! 2 + 3 = 5"`
- Grybukas pavirsta į monetą, kyla aukštyn ir dingsta
- Likę 2 grybukai ir lentelė švelniai dingsta (fade + scale)
- Mario gauna švelnų atšokimą (velocity.y = -300)

### REQ-MC-4: Klaidingas atsakymas
Mario šoka ant grybuko su klaidingu skaičiumi:
- `mathWrong` audio efektas
- Raudonas popup'as su teisingu atsakymu (`"❌ 2 + 3 = 5"`) — mokomasis momentas
- `loseOnePower({source: 'math'})` iškvietimas:
  - Didelis Mario → mažas + 1s nepažeidžiamumas + mirksi
  - Mažas Mario → atstumiamas atgal (vx=-200, vy=-300), -50 taškų, 1s nepažeidžiamumas + mirksi (NĖRA mirties)
- Visi 3 grybukai ir lentelė dingsta

### REQ-MC-5: 4 matematikos veiksmai
Sistema palaiko: sudėtį (+), atimtį (−), daugybą (×), dalybą (÷). Kiekvienas gali būti įjungtas/išjungtas atskirai.

### REQ-MC-6: Saugios matematikos taisyklės
- Sudėtis: `a, b ∈ [1..max]`, `a + b ≤ max`
- Atimtis: `a, b ∈ [1..max]`, `a ≥ b` (atsakymas niekada neigiamas)
- Daugyba: `a, b ∈ [1..max]`, `a × b ≤ max`
- Dalyba: tik sveiki rezultatai (`a % b === 0`), `a ≤ max × 2`, `answer ∈ [1..max]`

### REQ-MC-7: Saugios spawn'inimo vietos
Iššūkis spawn'inasi tik kai tenkinamos VISOS sąlygos:
- 3 plytelės iš eilės plokščios žemės priešais Mario (400-900px atstumu)
- 5 plytelės virš tų — tuščia (vietos lentelei)
- ±2 plytelės nuo centro: nėra priešų
- ±2 plytelės: nėra duobių
- Pozicija ne arčiau 5 plytelių iki flagpole (lygio pabaigoje neblokuojam)

Jei sąlygos netenkinamos per 5s — timer'is resetinamas, kitas bandymas po 10s.

### REQ-MC-8: Anti-kartojimas vienos sesijos metu
Per vieną lygį tas pats uždavinys (key = `"<op>:<a>:<b>"`) nesikartoja, kol nepraėjo 8 kiti uždaviniai. Lygio pabaigoje history resetinasi.

### REQ-MC-9: Mišrios užduotys
Jei įjungti keli veiksmai, kiekvienam iššūkiui veiksmas pasirenkamas atsitiktinai (uniform distribution). Statistiškai per ilgesnę sesiją kiekvienas veiksmas pasirodo ~lygiai.

### REQ-MC-10: Distractoriai (klaidingi atsakymai)
Kiekvienas iššūkis turi 2 distractorius + teisingą atsakymą (3 pasirinkimai):
- Vienas distractorius: `answer ± 1` arba `± 2` (tipinė skaičiavimo klaida)
- Kitas distractorius: priklausomai nuo veiksmo (sumaišyti veiksmai — pvz. `multiply` → `a + b`)
- Visi unique, visi ≥ 0, visi ≤ `max × 2`
- Sumaišyti per Fisher-Yates shuffle

### REQ-MC-11: Settings persistencija
Nustatymai saugomi `localStorage[app-mario:math-settings:v1]`. localStorage neprieinamumo atveju (privatus naršymas, quota) — tyliai grąžinami defaults, žaidimas nesilaužia.

### REQ-MC-12: Default settings (pirmas paleidimas)
Pirmą kartą atvėrus žaidimą:
- `add: { enabled: true, max: 10 }`
- visi kiti: `enabled: false`

### REQ-MC-13: Settings UI
Atskiras `SettingsScene` ekranas, pasiekiamas per ⚙️ mygtuką MenuScene. Kiekvienam veiksmui:
- ON/OFF toggle
- Rėžio mygtukai (10/20/50/100 sudėčiai-atimčiai; 10/20/50 daugybai-dalybai)
- Pakeitimai pritaikomi tik paspaudus IŠSAUGOTI; ✕ atsisako pakeitimų

### REQ-MC-14: Validacija — bent vienas veiksmas
Jei vartotojas išjungia visus veiksmus ir spaudžia IŠSAUGOTI:
- Sistema automatiškai įjungia `add`
- Parodomas trumpas pranešimas
- Garantuoja, kad iššūkiai veiks

### REQ-MC-15: Cleanup taškai
`MathSpawner.destroy()` iškviečiamas:
- Mario miršta (`playerDie()`)
- Vartotojas paspaudžia Quit (HUDScene dialog)
- Lygis baigiasi (flagpole)

`destroy()` saugiai išvalo visus aktyvius sprite'us, popup'us, collider'ius, tween'us.

### REQ-MC-16: Pause savybė
Phaser native scene pause sustabdo visus tween'us, physics, ir timer'ius natyviai. Iššūkis lieka tame pačiame state'e.

## Out of scope (šiam change'ui)
- Trupmenos, dešimtainiai
- Žodiniai uždaviniai ("Jonas turi 3 obuolius...")
- Multiplayer / leaderboardai
- Iššūkių istorijos peržiūra ekrane
- Skirtingos kalbos UI (LT only)
