# Math Challenge — Įgyvendinimo užduotys

## Etapas 1 — Pamatas (gryna logika)
- [ ] T1.1 Sukurti `js/utils/math.js` su `MathProblemGenerator`
- [ ] T1.2 Sukurti `js/utils/settings.js` su `MathSettings`
- [ ] T1.3 Sukurti `tests/unit/math.test.js` ir paleisti per Node — visi praeina
- [ ] T1.4 Sukurti `tests/unit/settings.test.js` (su localStorage mock'u) — visi praeina

## Etapas 2 — Vizualios sprite'os
- [ ] T2.1 `sprites.js` — `generateGreenMushroom()`
- [ ] T2.2 `sprites.js` — `generateWoodSign()`
- [ ] T2.3 `sprites.js` — `generateAnswerMedallion()`
- [ ] T2.4 `BootScene.js` — registruoti tris naujas tekstūras
- [ ] T2.5 Vizualus patikrinimas: paleisti žaidimą, naudoti debug spawn'ą peržiūrėti sprite'as

## Etapas 3 — Entity klasės
- [ ] T3.1 Sukurti `js/entities/MathSign.js` su spawn/destroy animacijomis
- [ ] T3.2 Sukurti `js/entities/AnswerMushroom.js` su physics body + medalionu

## Etapas 4 — Pagrindinė logika
- [ ] T4.1 Sukurti `js/entities/MathChallenge.js` — koordinuoja sign + 3 mushrooms
- [ ] T4.2 `MathChallenge.onHit` callback su collision logika (from-above check)
- [ ] T4.3 `MathChallenge` correct/wrong popup'ai (žalias/raudonas)
- [ ] T4.4 Sukurti `js/systems/MathSpawner.js` su 10s timer'iu
- [ ] T4.5 `MathSpawner.findSafeSpot()` algoritmas

## Etapas 5 — GameScene integracija
- [ ] T5.1 Refaktorinti esamą Goomba damage logiką į `loseOnePower({source: 'enemy'})`
- [ ] T5.2 `loseOnePower({source: 'math'})` — mažam Mario knockback + score -50, ne mirtis
- [ ] T5.3 GameScene `create()` instancijuoja `MathSpawner`
- [ ] T5.4 GameScene `update()` kviečia `mathSpawner.update(time, delta)`
- [ ] T5.5 GameScene `playerDie()` ir lygio pabaiga kviečia `mathSpawner.destroy()`
- [ ] T5.6 HUDScene quit dialog kviečia `mathSpawner?.destroy()`

## Etapas 6 — SettingsScene
- [ ] T6.1 Sukurti `js/scenes/SettingsScene.js` su 4 veiksmų eilutėmis
- [ ] T6.2 Toggle + rėžio mygtukai, working state
- [ ] T6.3 Išsaugoti / ✕ mygtukai
- [ ] T6.4 Validacija: visi išjungti → auto-įjungia `add` su pranešimu
- [ ] T6.5 MenuScene ⚙️ mygtukas → `scene.start('SettingsScene')`
- [ ] T6.6 Registruoti SettingsScene `index.html`

## Etapas 7 — Audio
- [ ] T7.1 `audio.js` — `mathCorrect` efektas (linksmas arpeggio)
- [ ] T7.2 `audio.js` — `mathWrong` efektas (žemas dudenimas)
- [ ] T7.3 Iškviesti iš `MathChallenge.onHit`

## Etapas 8 — Test hooks
- [ ] T8.1 `window.__mario_test` debug hooks GameScene'e

## Etapas 9 — Playwright integracijos testai
- [ ] T9.1 `test-math-feature.js` — T1: settings persistence
- [ ] T9.2 T2: math challenge spawning po 12s
- [ ] T9.3 T3: teisingas atsakymas
- [ ] T9.4 T4: klaidingas atsakymas (mažas Mario)
- [ ] T9.5 T5: klaidingas atsakymas (didelis Mario)
- [ ] T9.6 T6: visi veiksmai išjungti — nieko nespawn'ina

## Etapas 10 — Manualus QA ir deploy
- [ ] T10.1 QA: 7 manualios scenarijai (žr. design.md)
- [ ] T10.2 Code review per `superpowers:code-reviewer` agentą
- [ ] T10.3 Bump `AG_V4_VERSION` ekvivalentas (jei reikia cache busting'o)
- [ ] T10.4 `bash deploy.sh` → upload į mario.godeliauskas.com
- [ ] T10.5 Verifikuoti gyvame puslapyje
