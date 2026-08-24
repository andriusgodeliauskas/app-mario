(function () {
    'use strict';

    window.LEVEL_GENERATORS = window.LEVEL_GENERATORS || {};

    function coins(list) {
        var out = [];
        for (var i = 0; i < list.length; i++) out.push({ x: list[i][0], y: list[i][1] });
        return out;
    }

    window.LEVEL_GENERATORS[43] = function () {
        return {
            name: 'Wonder Plains',
            worldWidth: 5200,
            spawn: { x: 96, y: 450 },
            bg: 'plains',
            ground: [
                { x: 0, y: 544, width: 820, height: 64 },
                { x: 920, y: 544, width: 1060, height: 64 },
                { x: 2100, y: 544, width: 980, height: 64 },
                { x: 3220, y: 544, width: 760, height: 64 },
                { x: 4140, y: 544, width: 1060, height: 64 }
            ],
            platforms: [
                { x: 650, y: 414, width: 192 },
                { x: 1290, y: 394, width: 224 },
                { x: 2700, y: 410, width: 224 },
                { x: 3650, y: 382, width: 192 }
            ],
            rubberBlocks: [
                { x: 1040, y: 488 },
                { x: 1710, y: 488 },
                { x: 2360, y: 488 },
                { x: 3380, y: 488 }
            ],
            waterLevel: 512,
            waterZones: [
                { x: 3980, y: 512, width: 160, height: 96 }
            ],
            coins: coins([[360, 468], [650, 350], [1040, 390], [1290, 330], [1710, 385], [2360, 386], [2700, 346], [3380, 386], [4040, 474], [4300, 470], [4560, 464]]),
            flag: { x: 5040, y: 352 },
            finishGroundY: 544
        };
    };

    window.LEVEL_GENERATORS[44] = function () {
        return {
            name: 'Fluff-Puff Peaks',
            worldWidth: 5600,
            spawn: { x: 108, y: 360 },
            bg: 'peaks',
            noGround: true,
            ground: [
                { x: 40, y: 430, width: 260, height: 48 },
                // Reaches 80px further left (was x:5160,width:360). The last cloud ends at
                // 4888 and a jump from it covers ~244px against a 272px gap — the run to
                // the flag could not be completed. Right edge unchanged.
                { x: 5080, y: 430, width: 440, height: 48 }
            ],
            segmented: [
                { x: 520, y: 410, count: 5, speed: 2.0, offset: 0.42 },
                { x: 1180, y: 374, count: 6, speed: 1.65, offset: 0.48 },
                { x: 1980, y: 420, count: 5, speed: 1.9, offset: 0.5 },
                // Extended LEFT (were x:3040/count:7 and x:4200/count:6). The gap
                // from the cloud before each of these was 408px and 388px, and a
                // full running jump covers ~273px — both were uncrossable, which
                // made this room, and therefore rooms 45-52 behind it, unfinishable.
                // The right-hand ends are unchanged so the gaps after them stay as
                // authored. See tests/wonder-reach.test.js.
                { x: 2832, y: 382, count: 11, speed: 1.55, offset: 0.42 },
                { x: 4044, y: 410, count: 9, speed: 1.8, offset: 0.45 }
            ],
            dissolvingClouds: [
                { x: 860, y: 330, width: 160 },
                { x: 1670, y: 316, width: 176 },
                { x: 2520, y: 346, width: 176 },
                { x: 3700, y: 320, width: 176 },
                { x: 4800, y: 360, width: 176 }
            ],
            coins: coins([[520, 350], [660, 342], [860, 270], [1180, 310], [1360, 300], [1670, 256], [1980, 360], [2120, 352], [2520, 286], [3040, 318], [3240, 310], [3700, 260], [4200, 348], [4400, 340], [4800, 300]]),
            flag: { x: 5350, y: 276 },
            finishGroundY: 430
        };
    };

    window.LEVEL_GENERATORS[45] = function () {
        return {
            name: 'Bioluminescent Forest',
            worldWidth: 5800,
            spawn: { x: 96, y: 438 },
            bg: 'forest',
            groundTop: 'wonder-forest-top',
            groundFill: 'wonder-forest-fill',
            platformTop: 'wonder-forest-top',
            ground: [
                { x: 0, y: 544, width: 780, height: 64 },
                { x: 980, y: 544, width: 780, height: 64 },
                { x: 1920, y: 544, width: 740, height: 64 },
                { x: 2870, y: 544, width: 880, height: 64 },
                { x: 3980, y: 544, width: 660, height: 64 },
                { x: 4820, y: 544, width: 980, height: 64 }
            ],
            platforms: [
                { x: 560, y: 404, width: 224 },
                { x: 1260, y: 372, width: 224 },
                { x: 2220, y: 398, width: 256 },
                { x: 3260, y: 360, width: 224 },
                { x: 4250, y: 390, width: 256 }
            ],
            scaffolds: [
                { x: 560, y: 404, width: 224, height: 140 },
                { x: 1260, y: 372, width: 224, height: 172 },
                { x: 2220, y: 398, width: 256, height: 146 },
                { x: 3260, y: 360, width: 224, height: 184 },
                { x: 4250, y: 390, width: 256, height: 154 }
            ],
            bouncers: [
                { x: 690, y: 478, width: 142 },
                { x: 1510, y: 478, width: 150 },
                { x: 2525, y: 478, width: 150 },
                { x: 3540, y: 478, width: 150 },
                { x: 4620, y: 478, width: 150 }
            ],
            pots: [
                { x: 640, y: 366, enemyX: 660 },
                { x: 1340, y: 334, enemyX: 1360 },
                { x: 2320, y: 360, enemyX: 2340 },
                { x: 3340, y: 322, enemyX: 3360 },
                { x: 4350, y: 352, enemyX: 4370 }
            ],
            glowPlants: [
                { x: 330, y: 520 }, { x: 1110, y: 520 }, { x: 2050, y: 520 },
                { x: 3070, y: 520 }, { x: 4100, y: 520 }, { x: 5020, y: 520 }
            ],
            coins: coins([[330, 468], [610, 340], [690, 404], [1260, 304], [1510, 404], [2220, 330], [2525, 404], [3260, 292], [3540, 404], [4250, 322], [4620, 404], [5200, 468]]),
            flag: { x: 5620, y: 352 },
            finishGroundY: 544
        };
    };

    window.LEVEL_GENERATORS[46] = function () {
        return {
            name: 'Pastel Depths',
            worldWidth: 5600,
            spawn: { x: 96, y: 430 },
            bg: 'depths',
            groundTop: 'wonder-depths-top',
            groundFill: 'wonder-depths-fill',
            platformTop: 'wonder-depths-top',
            waterLevel: 350,
            waterZones: [
                { x: 720, y: 350, width: 4380, height: 258 }
            ],
            ground: [
                { x: 0, y: 544, width: 760, height: 64 },
                { x: 720, y: 544, width: 4380, height: 64 },
                { x: 5100, y: 544, width: 500, height: 64 }
            ],
            platforms: [
                { x: 420, y: 410, width: 192 },
                { x: 1040, y: 430, width: 224 },
                { x: 1650, y: 382, width: 224 },
                { x: 2280, y: 450, width: 224 },
                { x: 2940, y: 388, width: 256 },
                { x: 3720, y: 452, width: 224 },
                { x: 4560, y: 392, width: 224 }
            ],
            bubbles: [
                { x: 900, y: 500 }, { x: 1450, y: 475 }, { x: 2140, y: 510 },
                { x: 3150, y: 470 }, { x: 4200, y: 510 }
            ],
            coins: coins([[350, 468], [1040, 378], [1260, 500], [1650, 330], [1980, 488], [2280, 398], [2600, 500], [2940, 336], [3260, 482], [3720, 400], [4060, 502], [4560, 340], [4860, 486], [5280, 468]]),
            flag: { x: 5400, y: 352 },
            finishGroundY: 544
        };
    };

    window.LEVEL_GENERATORS[47] = function () {
        return {
            name: 'Neon Underground',
            worldWidth: 6200,
            spawn: { x: 96, y: 438 },
            bg: 'neon',
            groundTop: 'wonder-neon-top',
            groundFill: 'wonder-neon-fill',
            platformTop: 'wonder-neon-top',
            gravityMode: true,
            keyGoal: 5,
            ground: [
                { x: 0, y: 544, width: 780, height: 64 },
                { x: 1040, y: 544, width: 720, height: 64 },
                { x: 2140, y: 544, width: 660, height: 64 },
                { x: 3240, y: 544, width: 720, height: 64 },
                { x: 4480, y: 544, width: 1720, height: 64 },
                { x: 1330, y: -8, width: 500, height: 40 },
                { x: 2850, y: -8, width: 560, height: 40 }
            ],
            platforms: [
                { x: 520, y: 408, width: 192 },
                { x: 1120, y: 306, width: 224 },
                { x: 1560, y: 146, width: 224 },
                { x: 2180, y: 368, width: 224 },
                { x: 3020, y: 188, width: 256 },
                { x: 3560, y: 394, width: 224 },
                { x: 4320, y: 306, width: 224 }
            ],
            gravityZones: [
                { x: 1180, y: 466, axis: 'up', label: 'UP' },
                { x: 1940, y: 64, axis: 'down', label: 'DOWN' },
                { x: 2860, y: 466, axis: 'up', label: 'UP' },
                { x: 3740, y: 64, axis: 'down', label: 'DOWN' }
            ],
            keys: [
                { x: 610, y: 344 },
                { x: 1560, y: 96 },
                { x: 2320, y: 314 },
                { x: 3180, y: 136 },
                { x: 4370, y: 252 }
            ],
            neonPosts: [
                { x: 860, y: 512 }, { x: 1880, y: 66 }, { x: 2680, y: 512 },
                { x: 4100, y: 512 }, { x: 5120, y: 512 }
            ],
            coins: coins([[350, 468], [520, 352], [1120, 252], [1560, 104], [2180, 314], [3020, 136], [3560, 340], [4320, 254], [4840, 468], [5320, 468]]),
            bossDoor: { x: 5860, y: 456 },
            flag: { x: 5960, y: 352 },
            finishGroundY: 544
        };
    };

    window.LEVEL_GENERATORS[48] = function () {
        return {
            name: 'Ice Slide',
            worldWidth: 6000,
            spawn: { x: 96, y: 438 },
            bg: 'ice',
            groundTop: 'wonder-ice-top',
            groundFill: 'wonder-ice-fill',
            platformTop: 'wonder-ice-top',
            iceFriction: true,
            ground: [
                { x: 0, y: 544, width: 960, height: 64 },
                { x: 1060, y: 544, width: 1180, height: 64 },
                { x: 2380, y: 544, width: 1120, height: 64 },
                { x: 3660, y: 544, width: 2340, height: 64 }
            ],
            platforms: [
                { x: 760, y: 430, width: 224 },
                { x: 1720, y: 404, width: 256 },
                { x: 2920, y: 410, width: 224 },
                { x: 4340, y: 390, width: 256 }
            ],
            iceCrystals: [
                { x: 410, y: 506 }, { x: 1230, y: 506 }, { x: 2100, y: 506 },
                { x: 3190, y: 506 }, { x: 4040, y: 506 }, { x: 5160, y: 506 }
            ],
            coins: coins([[350, 468], [760, 366], [1260, 468], [1720, 340], [2120, 468], [2920, 346], [3440, 468], [4100, 468], [4340, 326], [4880, 468], [5400, 468]]),
            flag: { x: 5800, y: 352 },
            finishGroundY: 544
        };
    };

    window.LEVEL_GENERATORS[49] = function () {
        return {
            name: 'Wind Dunes',
            worldWidth: 6100,
            spawn: { x: 96, y: 438 },
            bg: 'dunes',
            groundTop: 'wonder-sand-top',
            groundFill: 'wonder-sand-fill',
            platformTop: 'wonder-sand-top',
            windForce: 0.085,
            windDirection: 1,
            sinkingSand: [
                { x: 850, y: 538, width: 260, height: 34 },
                { x: 2550, y: 538, width: 310, height: 34 },
                { x: 4230, y: 538, width: 330, height: 34 }
            ],
            ground: [
                { x: 0, y: 544, width: 1320, height: 64 },
                { x: 1460, y: 544, width: 1960, height: 64 },
                { x: 3560, y: 544, width: 2540, height: 64 }
            ],
            platforms: [
                { x: 1240, y: 420, width: 224 },
                { x: 2140, y: 398, width: 224 },
                { x: 3300, y: 418, width: 256 },
                { x: 5000, y: 390, width: 224 }
            ],
            duneGrass: [
                { x: 450, y: 514 }, { x: 960, y: 514 }, { x: 1780, y: 514 },
                { x: 2760, y: 514 }, { x: 3890, y: 514 }, { x: 4820, y: 514 }
            ],
            coins: coins([[320, 468], [980, 472], [1240, 356], [1800, 468], [2140, 334], [2700, 472], [3300, 354], [3960, 468], [4400, 472], [5000, 326], [5540, 468]]),
            flag: { x: 5900, y: 352 },
            finishGroundY: 544
        };
    };

    window.LEVEL_GENERATORS[50] = function () {
        return {
            name: 'Clockwork Gears',
            worldWidth: 6200,
            spawn: { x: 96, y: 438 },
            bg: 'gears',
            groundTop: 'wonder-brass-top',
            groundFill: 'wonder-brass-fill',
            platformTop: 'wonder-brass-top',
            ground: [
                { x: 0, y: 544, width: 720, height: 64 },
                { x: 5600, y: 544, width: 600, height: 64 }
            ],
            platforms: [
                { x: 430, y: 430, width: 192 },
                { x: 5280, y: 430, width: 224 }
            ],
            gearPlatforms: [
                { x: 980, y: 420, radiusX: 70, radiusY: 28, speed: 0.62, phase: 0 },
                { x: 1580, y: 372, radiusX: 82, radiusY: 32, speed: 0.55, phase: 1.7 },
                { x: 2290, y: 420, radiusX: 76, radiusY: 30, speed: 0.6, phase: 0.4 },
                { x: 3020, y: 382, radiusX: 84, radiusY: 34, speed: 0.52, phase: 1.3 },
                { x: 3860, y: 424, radiusX: 78, radiusY: 28, speed: 0.58, phase: 2.2 },
                { x: 4680, y: 388, radiusX: 84, radiusY: 32, speed: 0.54, phase: 0.9 }
            ],
            pipes: [
                { x: 760, y: 500, width: 410 }, { x: 1740, y: 492, width: 460 },
                { x: 3140, y: 500, width: 500 }, { x: 4380, y: 492, width: 440 }
            ],
            coins: coins([[360, 468], [980, 352], [1580, 304], [2290, 352], [3020, 314], [3860, 356], [4680, 320], [5320, 360], [5740, 468]]),
            flag: { x: 6000, y: 352 },
            finishGroundY: 544
        };
    };

    window.LEVEL_GENERATORS[51] = function () {
        return {
            name: 'Magnet Caves',
            worldWidth: 6100,
            spawn: { x: 96, y: 438 },
            bg: 'magnet',
            groundTop: 'wonder-magnet-top',
            groundFill: 'wonder-magnet-fill',
            platformTop: 'wonder-magnet-top',
            magnetPolarity: 'blue',
            ground: [
                { x: 0, y: 544, width: 860, height: 64 },
                { x: 980, y: 544, width: 1040, height: 64 },
                { x: 2180, y: 544, width: 1080, height: 64 },
                { x: 3440, y: 544, width: 1060, height: 64 },
                { x: 4660, y: 544, width: 1440, height: 64 }
            ],
            platforms: [
                { x: 720, y: 420, width: 224 },
                { x: 1680, y: 388, width: 224 },
                { x: 2860, y: 402, width: 256 },
                { x: 4080, y: 384, width: 224 },
                { x: 5140, y: 410, width: 224 }
            ],
            magnetSwitches: [
                { x: 560, y: 492 },
                { x: 2380, y: 492 },
                { x: 4300, y: 492 }
            ],
            magnets: [
                { x: 1200, y: 430, polarity: 'red', radius: 340, strength: 0.16 },
                { x: 1940, y: 310, polarity: 'blue', radius: 360, strength: 0.14 },
                { x: 3240, y: 430, polarity: 'blue', radius: 360, strength: 0.16 },
                { x: 4620, y: 310, polarity: 'red', radius: 380, strength: 0.14 }
            ],
            rails: [
                { x: 1100, y: 486, width: 250, polarity: 'red' },
                { x: 1840, y: 330, width: 250, polarity: 'blue' },
                { x: 3140, y: 486, width: 270, polarity: 'blue' },
                { x: 4520, y: 330, width: 270, polarity: 'red' }
            ],
            coins: coins([[340, 468], [720, 356], [1200, 384], [1680, 324], [2380, 468], [2860, 338], [3240, 384], [4080, 320], [4620, 270], [5140, 346], [5620, 468]]),
            flag: { x: 5900, y: 352 },
            finishGroundY: 544
        };
    };

    window.LEVEL_GENERATORS[52] = function () {
        return {
            name: 'Mirror Hall',
            worldWidth: 5600,
            spawn: { x: 2680, y: 438 },
            bg: 'mirror',
            groundTop: 'wonder-mirror-top',
            groundFill: 'wonder-mirror-fill',
            platformTop: 'wonder-mirror-top',
            mirrorTwin: true,
            mirrorAxisX: 2800,
            mirrorSpawn: { x: 2920, y: 438 },
            mirrorFlag: { x: 180, y: 352 },
            ground: [
                { x: 0, y: 544, width: 1220, height: 64 },
                { x: 1420, y: 544, width: 950, height: 64 },
                { x: 2380, y: 544, width: 840, height: 64 },
                { x: 3230, y: 544, width: 950, height: 64 },
                { x: 4380, y: 544, width: 1220, height: 64 }
            ],
            platforms: [
                { x: 680, y: 414, width: 224 },
                { x: 1540, y: 388, width: 224 },
                { x: 2200, y: 430, width: 224 },
                { x: 3176, y: 430, width: 224 },
                { x: 3836, y: 388, width: 224 },
                { x: 4696, y: 414, width: 224 }
            ],
            mirrorColumns: [
                { x: 880, y: 442 }, { x: 1680, y: 416 }, { x: 2480, y: 458 },
                { x: 3120, y: 458 }, { x: 3920, y: 416 }, { x: 4720, y: 442 }
            ],
            coins: coins([[360, 468], [680, 350], [1540, 324], [2200, 366], [2800, 468], [3176, 366], [3836, 324], [4696, 350], [5240, 468]]),
            flag: { x: 5420, y: 352 },
            finishGroundY: 544
        };
    };
})();
