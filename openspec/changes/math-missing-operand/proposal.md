# Math: Missing-Operand uždaviniai (8 − x = 3)

## Problem
Dabar matematikos iššūkis visada rodo `a ? b = ?` (ieškomas rezultatas). Vaikui reikia
ir atvirkštinio mąstymo — rasti trūkstamą dėmenį (`8 − x = 3`).

## Goals
- `MathGen` palaiko `missingOperand` formą: rodo `a ? x = c` arba `x ? b = c`; blokuose — x variantai
- Saugu: x ≥ 0, sveikieji, neperžengia rėžio; jokių neigiamų
- `MathSign` rodo `x` raudonai (kintamasis), `=` ir rezultatą normaliai
- Naujas perjungiklis SettingsScene „Rasti X"; įjungus ~40% iššūkių — missing-operand
- Veikia su visomis įjungtomis operacijomis (+ − × ÷)

## Non-goals
- Nekeičiam blokų mušimo mechanikos, popupų, baudos logikos
- Jokių neigiamų / trupmenų

## Scope
**Modifikuojami:** `js/utils/math.js` (MathGen.next palaiko form='missing'), `js/entities/MathSign.js`
(render x), `js/utils/settings.js` (`missingOperand` flag + validacija), `js/scenes/SettingsScene.js`
(perjungiklis), `js/entities/MathChallenge.js` (popup tekstas su x), `tests/unit/math.test.js`.
