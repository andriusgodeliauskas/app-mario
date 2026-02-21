## Context

Kuriamas naujas Super Mario platformerio žaidimas kaip dalis edukacinių vaikų aplikacijų ekosistemos. Esami projektai naudoja skirtingas technologijas (vanilla HTML/JS, React+Vite), bet visi deploy'inami per FTP į subdomains ant godeliauskas.com. Žaidimas skirtas 6 metų vaikui, turi būti paprastas valdyti ir vizualiai patrauklus.

## Goals / Non-Goals

**Goals:**
- Klasikinis Super Mario gameplay su sklandžia fizika
- 4 žaidimo lygiai su progresu
- Retro pixel art grafika
- Anglų kalbos elementai integruoti į gameplay
- Veikia naršyklėje (desktop + mobile)
- Deploy per FTP kaip statiniai failai

**Non-Goals:**
- Multiplayer režimas
- Lygio redaktorius
- Vartotojų registracija / cloud save
- Sudėtinga power-up sistema (tik mushroom + star)
- Procedūrinis lygių generavimas

## Decisions

### 1. Phaser 3 framework (per CDN)
**Pasirinkimas:** Phaser 3 per CDN `<script>` tag
**Alternatyvos:** Vanilla Canvas (per daug rankinio darbo), Kaboom.js (mažesnė bendruomenė)
**Priežastis:** Phaser turi integruotą Arcade fiziką, sprite animacijas, tilemap palaikymą, garso sistemą. Per CDN — jokio build proceso, deploy'iname tik statinius failus.

### 2. Failų struktūra
```
app-mario/
├── index.html              # Pagrindinis failas
├── js/
│   ├── config.js           # Phaser konfigūracija
│   ├── scenes/
│   │   ├── BootScene.js    # Asset loading
│   │   ├── MenuScene.js    # Pradinis ekranas
│   │   ├── GameScene.js    # Pagrindinis žaidimas
│   │   ├── HUDScene.js     # Score, lives overlay
│   │   └── WinScene.js     # Pergalės ekranas
│   ├── entities/
│   │   ├── Player.js       # Mario logika
│   │   ├── Goomba.js       # Goomba priešas
│   │   └── Koopa.js        # Koopa priešas
│   └── utils/
│       └── english.js      # Anglų kalbos žodžiai
├── assets/
│   ├── sprites/            # Sprite sheets (PNG)
│   ├── tilemaps/           # Lygių JSON + tilesets
│   ├── audio/              # Garso efektai + muzika
│   └── fonts/              # Pixel font
├── css/
│   └── style.css           # UI stiliai (menu, HUD, touch)
├── deploy.sh               # FTP upload skriptas
└── .htaccess               # HTTPS redirect
```

### 3. Lygių kūrimas su Tiled JSON
**Pasirinkimas:** Hardcoded JSON tilemap failai
**Priežastis:** Phaser natively palaiko Tiled JSON formatą. Lygius galima aprašyti kaip JSON masyvus arba sukurti Tiled redaktoriumi.

### 4. Sprite'ai — programiškai generuojami pixel art
**Pasirinkimas:** Canvas API generuojami sprite'ai kode
**Alternatyva:** Išoriniai sprite sheets (copyright problemos)
**Priežastis:** Visi Mario sprite'ai yra Nintendo nuosavybė. Generuosime savo originalius pixel art personažus, panašaus stiliaus bet unikalius.

### 5. Garso efektai — Web Audio API
**Pasirinkimas:** Programiškai generuojami 8-bit garsai
**Priežastis:** Nereikia išorinių garso failų, retro stilius, maži failai.

### 6. Touch valdymas
**Pasirinkimas:** Phaser built-in touch + custom on-screen buttons
**Priežastis:** 6 metų vaikas dažnai žaidžia planšetėje. Virtual D-pad kairėje, Jump mygtukas dešinėje.

## Risks / Trade-offs

- **[Performansas mobiliuose]** → Arcade fizika (ne Matter.js) yra greita, tilemap'ai optimizuoti. Phaser automatiškai naudoja WebGL su Canvas fallback.
- **[Žaidimo sudėtingumas]** → 6 metų vaikui lygiai turi būti lengvi. Pirmasis lygis beveik be priešų, tik platformos ir monetos.
- **[Sprite copyright]** → Generuojame savo originalius personažus, vengiame Nintendo IP.
- **[Failų dydis]** → Be build proceso failai gali būti didesni. Bet žaidimas nesudėtingas, bendras dydis < 2MB.
