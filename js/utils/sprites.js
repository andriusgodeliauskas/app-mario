/**
 * SpriteGenerator — Programmatic NES-style sprite generation
 * All sprites drawn via Canvas API, no external images needed.
 * Uses pixel art style matching mockup.html art direction.
 */

(function () {
    'use strict';

    // ========================================
    // HELPER FUNCTIONS
    // ========================================

    /** Fill a rectangle on canvas (pixel drawing) */
    function px(ctx, x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h));
    }

    /** Draw a pixel grid from string array with palette lookup */
    function drawPixelGrid(ctx, startX, startY, scale, grid, palette) {
        for (var row = 0; row < grid.length; row++) {
            for (var col = 0; col < grid[row].length; col++) {
                var ch = grid[row][col];
                if (ch && ch !== '.' && palette[ch]) {
                    ctx.fillStyle = palette[ch];
                    ctx.fillRect(
                        startX + col * scale,
                        startY + row * scale,
                        scale,
                        scale
                    );
                }
            }
        }
    }

    /** Create an offscreen canvas of given dimensions */
    function makeCanvas(w, h) {
        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        return c;
    }

    // ========================================
    // COLOR CONSTANTS (from mockup)
    // ========================================
    var C = {
        // Mario
        marioRed: '#E8261C',
        marioRedDark: '#B01010',
        marioSkin: '#FCA044',
        marioSkinDark: '#E08030',
        marioBrown: '#AC7C00',
        marioBrownDark: '#8A5A00',
        marioWhite: '#FFFFFF',
        // Ground / tiles
        groundGreen: '#30C030',
        groundGreenLight: '#58E858',
        groundGreenDark: '#208020',
        brown: '#C06000',
        brownLight: '#D88030',
        brownDark: '#804000',
        brick: '#C84C0C',
        brickLight: '#E09050',
        brickDark: '#803808',
        mortar: '#E8A060',
        // Question block
        questionGold: '#F8B800',
        questionLight: '#FFF0A0',
        questionDark: '#885500',
        // Coin
        coinYellow: '#F8D830',
        coinDark: '#C8A020',
        coinLight: '#FFF8A0',
        // Pipe
        pipeGreen: '#30C030',
        pipeLight: '#58E858',
        pipeBright: '#68F868',
        pipeDark: '#188018',
        pipeDarkest: '#106010',
        pipeHighlight: '#78FF78',
        // Goomba
        goombaBrown: '#A0522D',
        goombaBrownDark: '#8B4513',
        goombaBrownDeep: '#654321',
        goombaTan: '#F5DEB3',
        goombaTanDark: '#E0C8A0',
        // Koopa
        koopaGreen: '#30C030',
        koopaGreenDark: '#208020',
        koopaGreenDeep: '#106010',
        koopaGreenLight: '#48D848',
        koopaBelly: '#F8D830',
        koopaBellyDark: '#C8A020',
        // Mushroom
        mushRed: '#E8261C',
        mushRedDark: '#B01010',
        mushStem: '#FCA044',
        mushStemDark: '#E08030',
        // Star
        starYellow: '#F8D830',
        starDark: '#C8A020',
        starLight: '#FFF8A0',
        starOrange: '#F8B800',
        // Princess
        princessPink: '#FF69B4',
        princessPinkDark: '#CC5599',
        princessPinkLight: '#FFB0D0',
        princessGold: '#F8D830',
        princessHair: '#E0B020',
        // Bowser
        bowserGreen: '#30C030',
        bowserGreenDark: '#208020',
        bowserShell: '#445544',
        bowserHorn: '#F8D830',
        bowserBelly: '#F8D830',
        // General
        black: '#000000',
        white: '#FFFFFF',
        gray: '#AAAAAA',
        grayLight: '#CCCCCC',
        grayDark: '#555555',
    };

    // ========================================
    // 1. MARIO SPRITES (small: 32x32, 5 frames)
    // ========================================
    function generateMario(scene) {
        var frameW = 32, frameH = 32;
        var numFrames = 5;
        var canvas = makeCanvas(frameW * numFrames, frameH);
        var ctx = canvas.getContext('2d');
        var s = 2; // pixel scale (16x16 grid -> 32x32)

        var pal = {
            'R': C.marioRed, 'r': C.marioRedDark,
            'S': C.marioSkin, 's': C.marioSkinDark,
            'B': C.marioBrown, 'b': C.marioBrownDark,
            'W': C.marioWhite, 'K': C.black,
            'H': '#D07018', 'O': '#F87818',
            'Y': C.coinYellow
        };

        // Frame 0: Standing (idle) — facing right
        var idle = [
            '....rRRRRr......',
            '...rRRRRRRRR....',
            '...HHHSSSKSs....',
            '..HSHSSSkSSSs...',
            '..HSHHSSSkSSS...',
            '..HHsSSSKKKK....',
            '.....SSSSSS.....',
            '...RRBRRBR......',
            '..RRRBRRBRRRs...',
            '..SSRRBBBBRSS...',
            '..SSBBWBBWBBs...',
            '...bBBBBBBBb....',
            '...BBBB.BBBb....',
            '..BBBb...bBBB...',
            '.bbbbb...bbbbb..',
            '................'
        ];
        drawPixelGrid(ctx, 0, 0, s, idle, pal);

        // Frame 1: Run frame 1 — legs apart
        var run1 = [
            '....rRRRRr......',
            '...rRRRRRRRR....',
            '...HHHSSSKSs....',
            '..HSHSSSkSSSs...',
            '..HSHHSSSkSSS...',
            '..HHsSSSKKKK....',
            '.....SSSSSS.....',
            '...RRRRRRR......',
            '..RRRRBRRBRRs...',
            '..SSRRBBBBRSS...',
            '..SSBBWBBWBBs...',
            '...bBBBBBBBb....',
            '....BBBBBb......',
            '...bBBb.........',
            '..bbbbb.........',
            '................'
        ];
        drawPixelGrid(ctx, frameW, 0, s, run1, pal);

        // Frame 2: Run frame 2 — legs together
        var run2 = [
            '....rRRRRr......',
            '...rRRRRRRRR....',
            '...HHHSSSKSs....',
            '..HSHSSSkSSSs...',
            '..HSHHSSSkSSS...',
            '..HHsSSSKKKK....',
            '.....SSSSSS.....',
            '...RRRRRRR......',
            '..RRRRBRRBRRs...',
            '..SSRRBBBBRSS...',
            '..SSBBWBBWBBs...',
            '...bBBBBBBBb....',
            '.......BBBBb....',
            '........bBBb....',
            '.........bbbbb..',
            '................'
        ];
        drawPixelGrid(ctx, frameW * 2, 0, s, run2, pal);

        // Frame 3: Jump — arms up
        var jump = [
            '..W..rRRRRr.....',
            '..W.rRRRRRRRR...',
            '..W.HHHSSSKSs...',
            '..WHSHSSSKSSS...',
            '...HSHHSSSkSSS..',
            '...HHsSSSKKKK...',
            '.....SSSSSS.....',
            '..WWRRRRRRRRWW..',
            '..WWRRBRRBRWW...',
            '...SRRBBBBRSS...',
            '...SBBWBBWBBs...',
            '...bBBBBBBBb....',
            '..BBBb..bBBB....',
            '.bbb......bbb...',
            '................',
            '................'
        ];
        drawPixelGrid(ctx, frameW * 3, 0, s, jump, pal);

        // Frame 4: Death — X eyes, arms up
        var death = [
            '....rRRRRr......',
            '...rRRRRRRRR....',
            '...HHHSSSKSs....',
            '..HSKSSSkKSSs...',
            '..HSSKSKSSSss...',
            '..HSKSSSkKKKK...',
            '.....SSSSSS.....',
            '..WWRRRRRRRRWW..',
            '..WWRRBRRBRWW...',
            '...SRRBBBBRSS...',
            '...SBBWBBWBBs...',
            '...bBBBBBBBb....',
            '...BBBB.BBBb....',
            '..BBBb...bBBB...',
            '.bbbbb...bbbbb..',
            '................'
        ];
        drawPixelGrid(ctx, frameW * 4, 0, s, death, pal);

        scene.textures.addSpriteSheet('mario', canvas, {
            frameWidth: frameW,
            frameHeight: frameH
        });
    }

    // ========================================
    // 1b. BIG MARIO SPRITES (32x64, 4 frames)
    // ========================================
    function generateBigMario(scene) {
        var frameW = 32, frameH = 64;
        var numFrames = 4;
        var canvas = makeCanvas(frameW * numFrames, frameH);
        var ctx = canvas.getContext('2d');
        var s = 2; // pixel scale

        var pal = {
            'R': C.marioRed, 'r': C.marioRedDark,
            'S': C.marioSkin, 's': C.marioSkinDark,
            'B': C.marioBrown, 'b': C.marioBrownDark,
            'W': C.marioWhite, 'K': C.black,
            'H': '#D07018', 'O': '#F87818',
            'Y': C.coinYellow
        };

        // Big Mario standing (16x32 grid -> 32x64)
        var bigStand = [
            '................',
            '....rRRRRr......',
            '...rRRRRRRRR....',
            '...HHHSSSKSs....',
            '..HSHSSSkSSSs...',
            '..HSHHSSSkSSS...',
            '..HHsSSSKKKK....',
            '.....SSSSSS.....',
            '...RRBRRBR......',
            '..RRRBRRBRRRs...',
            '..SSRRBBBBRSS...',
            '..SSBBWBBWBBs...',
            '...bBBBBBBBb....',
            '...RRRRRRRR.....',
            '..RRRRRRRRRRs...',
            '..RRRRRRRRRRR...',
            '..RRBRRRRRBR....',
            '..RRBRRRRRBRR...',
            '..SSBRRRRRBRSS..',
            '...SBBRRRBBS....',
            '...SSBRRRBS.....',
            '....SSSSSSS.....',
            '...SSSSSSSS.....',
            '...BBBB.BBBb....',
            '..BBBBb.bBBBB...',
            '..BBBBb.bBBBB...',
            '.bbbbb...bbbbb..',
            '................',
            '................',
            '................',
            '................',
            '................'
        ];
        drawPixelGrid(ctx, 0, 0, s, bigStand, pal);

        // Big Mario run 1
        var bigRun1 = [
            '................',
            '....rRRRRr......',
            '...rRRRRRRRR....',
            '...HHHSSSKSs....',
            '..HSHSSSkSSSs...',
            '..HSHHSSSkSSS...',
            '..HHsSSSKKKK....',
            '.....SSSSSS.....',
            '...RRRRRRR......',
            '..RRRRBRRBRRRs..',
            '..SSRRBBBBRRSS..',
            '..SSBBWBBWBBs...',
            '...bBBBBBBBb....',
            '...RRRRRRRR.....',
            '..RRRRRRRRRRR...',
            '..RRRRRRRRRRR...',
            '..RRBRRRRRBR....',
            '..RRBRRRRRBRs...',
            '..SSBRRRRRBRSS..',
            '...SBBRRRBBS....',
            '....SBRRRBBS....',
            '....SSSSSSS.....',
            '...BBBBBb.......',
            '..BBBBbb........',
            '..bbbbb.........',
            '................',
            '................',
            '................',
            '................',
            '................',
            '................',
            '................'
        ];
        drawPixelGrid(ctx, frameW, 0, s, bigRun1, pal);

        // Big Mario run 2
        var bigRun2 = [
            '................',
            '....rRRRRr......',
            '...rRRRRRRRR....',
            '...HHHSSSKSs....',
            '..HSHSSSkSSSs...',
            '..HSHHSSSkSSS...',
            '..HHsSSSKKKK....',
            '.....SSSSSS.....',
            '...RRRRRRR......',
            '..RRRRBRRBRRRs..',
            '..SSRRBBBBRRSS..',
            '..SSBBWBBWBBs...',
            '...bBBBBBBBb....',
            '...RRRRRRRR.....',
            '..RRRRRRRRRRR...',
            '..RRRRRRRRRRR...',
            '..RRBRRRRRBR....',
            '..RRBRRRRRBRs...',
            '..SSBRRRRRBRSS..',
            '...SBBRRRBBS....',
            '....SBRRRBBs....',
            '....SSSSSSS.....',
            '.......BBBBb....',
            '........bBBBB...',
            '.........bbbbb..',
            '................',
            '................',
            '................',
            '................',
            '................',
            '................',
            '................'
        ];
        drawPixelGrid(ctx, frameW * 2, 0, s, bigRun2, pal);

        // Big Mario jump
        var bigJump = [
            '..W..rRRRRr.....',
            '..W.rRRRRRRRR...',
            '..W.HHHSSSKSs...',
            '..WHSHSSSKSSS...',
            '...HSHHSSSkSSS..',
            '...HHsSSSKKKK...',
            '.....SSSSSS.....',
            '..WWRRRRRRRRWW..',
            '..WWRRBRRBRWW...',
            '...SRRBBBBRRSS..',
            '...SBBWBBWBBs...',
            '...bBBBBBBBb....',
            '...RRRRRRRR.....',
            '..RRRRRRRRRRR...',
            '..RRRRRRRRRRR...',
            '..RRBRRRRRBR....',
            '..RRBRRRRRBRs...',
            '..SSBRRRRRBRSS..',
            '...SBBRRRBBS....',
            '....SSSSSSS.....',
            '...SSSSSSSS.....',
            '..BBBb...bBBB...',
            '.BBBb.....bBBB..',
            '.bbb.......bbb..',
            '................',
            '................',
            '................',
            '................',
            '................',
            '................',
            '................',
            '................'
        ];
        drawPixelGrid(ctx, frameW * 3, 0, s, bigJump, pal);

        scene.textures.addSpriteSheet('mario-big', canvas, {
            frameWidth: frameW,
            frameHeight: frameH
        });
    }

    // ========================================
    // 2. TILES SPRITESHEET (32x32 per tile, 16 tiles)
    // ========================================
    function generateTiles(scene) {
        var tileSize = 32;
        var numTiles = 16;
        var canvas = makeCanvas(tileSize * numTiles, tileSize);
        var ctx = canvas.getContext('2d');

        // --- Tile 0: Empty/transparent (nothing to draw) ---

        // --- Tile 1: Ground top (green grass on brown) ---
        (function () {
            var ox = tileSize * 1;
            // Brown base
            px(ctx, ox, 0, tileSize, tileSize, C.brown);
            // Green grass top
            px(ctx, ox, 0, tileSize, 12, C.groundGreen);
            // Grass highlight
            px(ctx, ox, 0, tileSize, 3, C.groundGreenLight);
            // Grass dark bottom
            px(ctx, ox, 9, tileSize, 3, C.groundGreenDark);
            // Earth brick pattern
            px(ctx, ox, 14, tileSize, 1, C.brownLight);
            px(ctx, ox, 22, tileSize, 1, C.brownLight);
            px(ctx, ox + 16, 12, 1, 10, C.brownLight);
            px(ctx, ox, 22, 1, 10, C.brownLight);
            // Dark accents
            px(ctx, ox, tileSize - 1, tileSize, 1, C.brownDark);
        })();

        // --- Tile 2: Ground body (brown earth bricks) ---
        (function () {
            var ox = tileSize * 2;
            px(ctx, ox, 0, tileSize, tileSize, C.brown);
            // Brick pattern: horizontal mortar lines
            px(ctx, ox, 0, tileSize, 1, C.brownLight);
            px(ctx, ox, 15, tileSize, 2, C.mortar);
            // Vertical mortar — top half
            px(ctx, ox + 15, 0, 2, 16, C.mortar);
            // Vertical mortar — bottom half (offset)
            px(ctx, ox, 15, 2, 17, C.mortar);
            px(ctx, ox + 31, 15, 1, 17, C.mortar);
            // Highlight top of each brick
            px(ctx, ox, 1, 14, 1, C.brownLight);
            px(ctx, ox + 17, 1, 14, 1, C.brownLight);
            px(ctx, ox + 2, 17, 12, 1, C.brownLight);
            // Shadow bottom
            px(ctx, ox, 14, 14, 1, C.brownDark);
            px(ctx, ox + 17, 14, 14, 1, C.brownDark);
            px(ctx, ox + 2, tileSize - 1, 28, 1, C.brownDark);
        })();

        // --- Tile 3: Brick block (brown with mortar, 3D shading) ---
        (function () {
            var ox = tileSize * 3;
            var s = tileSize;
            var half = s / 2;
            var qtr = s / 4;
            // Black outline
            px(ctx, ox, 0, s, s, C.black);
            // Fill bricks
            // Top-left
            px(ctx, ox + 1, 1, half - 2, half - 2, C.brick);
            px(ctx, ox + 1, 1, half - 2, 2, C.brickLight);
            px(ctx, ox + 1, 1, 2, half - 2, C.brickLight);
            px(ctx, ox + 1, half - 3, half - 2, 2, C.brickDark);
            px(ctx, ox + half - 3, 1, 2, half - 2, C.brickDark);
            // Top-right
            px(ctx, ox + half, 1, half - 1, half - 2, C.brick);
            px(ctx, ox + half, 1, half - 1, 2, C.brickLight);
            px(ctx, ox + half, 1, 2, half - 2, C.brickLight);
            px(ctx, ox + half, half - 3, half - 1, 2, C.brickDark);
            px(ctx, ox + s - 3, 1, 2, half - 2, C.brickDark);
            // Bottom-left (offset)
            px(ctx, ox + 1, half, qtr - 2, half - 1, C.brick);
            px(ctx, ox + 1, half, qtr - 2, 2, C.brickLight);
            // Bottom-center
            px(ctx, ox + qtr, half, half, half - 1, C.brick);
            px(ctx, ox + qtr, half, half, 2, C.brickLight);
            px(ctx, ox + qtr, half, 2, half - 1, C.brickLight);
            px(ctx, ox + qtr, s - 3, half, 2, C.brickDark);
            px(ctx, ox + qtr + half - 2, half, 2, half - 1, C.brickDark);
            // Bottom-right
            px(ctx, ox + qtr + half, half, qtr - 1, half - 1, C.brick);
            px(ctx, ox + qtr + half, half, qtr - 1, 2, C.brickLight);
            px(ctx, ox + s - 3, half, 2, half - 1, C.brickDark);
            // Mortar lines
            px(ctx, ox, half - 1, s, 2, C.mortar);
            px(ctx, ox + half - 1, 0, 2, half, C.mortar);
            px(ctx, ox + qtr - 1, half, 2, half, C.mortar);
            px(ctx, ox + qtr + half - 1, half, 2, half, C.mortar);
            // Outer bevels
            px(ctx, ox, 0, s, 1, '#F0A060');
            px(ctx, ox, 0, 1, s, '#F0A060');
            px(ctx, ox, s - 1, s, 1, '#602000');
            px(ctx, ox + s - 1, 0, 1, s, '#602000');
        })();

        // --- Tile 4: Question block (gold with "?" mark) ---
        (function () {
            var ox = tileSize * 4;
            var s = tileSize;
            // Main gold fill
            px(ctx, ox, 0, s, s, C.questionGold);
            px(ctx, ox + 3, 3, s - 6, s - 6, '#E8A800');
            // Beveled edges
            px(ctx, ox, 0, s, 3, C.questionLight);
            px(ctx, ox, 0, 3, s, C.questionLight);
            px(ctx, ox, s - 3, s, 3, C.questionDark);
            px(ctx, ox + s - 3, 0, 3, s, C.questionDark);
            // Corner rivets
            px(ctx, ox + 5, 5, 2, 2, C.questionLight);
            px(ctx, ox + s - 7, 5, 2, 2, C.questionLight);
            px(ctx, ox + 5, s - 7, 2, 2, C.questionDark);
            px(ctx, ox + s - 7, s - 7, 2, 2, C.questionDark);
            // "?" mark
            // Shadow
            drawQMark(ctx, ox + 9, 6, 2, C.questionDark);
            // White
            drawQMark(ctx, ox + 8, 5, 2, C.white);
        })();

        // --- Tile 5: Question block used (dark, empty) ---
        (function () {
            var ox = tileSize * 5;
            var s = tileSize;
            px(ctx, ox, 0, s, s, '#886644');
            px(ctx, ox + 2, 2, s - 4, s - 4, '#775533');
            // Beveled
            px(ctx, ox, 0, s, 2, '#997755');
            px(ctx, ox, 0, 2, s, '#997755');
            px(ctx, ox, s - 2, s, 2, '#554422');
            px(ctx, ox + s - 2, 0, 2, s, '#554422');
            // Corner dots
            px(ctx, ox + 4, 4, 2, 2, '#554422');
            px(ctx, ox + s - 6, 4, 2, 2, '#554422');
            px(ctx, ox + 4, s - 6, 2, 2, '#554422');
            px(ctx, ox + s - 6, s - 6, 2, 2, '#554422');
        })();

        // --- Tile 6: Pipe top-left ---
        (function () {
            var ox = tileSize * 6;
            var s = tileSize;
            // Lip (top 10px)
            px(ctx, ox, 0, s, 10, C.pipeGreen);
            px(ctx, ox, 0, s, 2, C.pipeHighlight);
            px(ctx, ox, 0, 4, 10, C.pipeLight);
            px(ctx, ox, 8, s, 2, C.pipeDark);
            // Body (below lip)
            px(ctx, ox, 10, s, s - 10, C.pipeGreen);
            px(ctx, ox, 10, 4, s - 10, C.pipeLight);
            px(ctx, ox + 4, 10, 3, s - 10, C.pipeBright);
            px(ctx, ox + s - 2, 10, 2, s - 10, C.pipeDarkest);
            // Rim under lip
            px(ctx, ox, 10, s, 2, C.pipeDarkest);
        })();

        // --- Tile 7: Pipe top-right ---
        (function () {
            var ox = tileSize * 7;
            var s = tileSize;
            // Lip
            px(ctx, ox, 0, s, 10, C.pipeGreen);
            px(ctx, ox, 0, s, 2, C.pipeHighlight);
            px(ctx, ox + s - 4, 0, 4, 10, C.pipeDarkest);
            px(ctx, ox, 8, s, 2, C.pipeDark);
            // Body
            px(ctx, ox, 10, s, s - 10, C.pipeGreen);
            px(ctx, ox, 10, 2, s - 10, C.pipeBright);
            px(ctx, ox + s - 6, 10, 4, s - 10, C.pipeDark);
            px(ctx, ox + s - 2, 10, 2, s - 10, C.pipeDarkest);
            // Rim
            px(ctx, ox, 10, s, 2, C.pipeDarkest);
        })();

        // --- Tile 8: Pipe body-left ---
        (function () {
            var ox = tileSize * 8;
            var s = tileSize;
            px(ctx, ox, 0, s, s, C.pipeGreen);
            px(ctx, ox, 0, 4, s, C.pipeLight);
            px(ctx, ox + 4, 0, 3, s, C.pipeBright);
            px(ctx, ox + s - 2, 0, 2, s, C.pipeDarkest);
        })();

        // --- Tile 9: Pipe body-right ---
        (function () {
            var ox = tileSize * 9;
            var s = tileSize;
            px(ctx, ox, 0, s, s, C.pipeGreen);
            px(ctx, ox, 0, 2, s, C.pipeBright);
            px(ctx, ox + s - 6, 0, 4, s, C.pipeDark);
            px(ctx, ox + s - 2, 0, 2, s, C.pipeDarkest);
        })();

        // --- Tile 10: Underground brick (darker) ---
        (function () {
            var ox = tileSize * 10;
            var s = tileSize;
            var half = s / 2;
            px(ctx, ox, 0, s, s, '#222244');
            // Brick pattern
            px(ctx, ox + 1, 1, half - 2, half - 2, '#334466');
            px(ctx, ox + half, 1, half - 1, half - 2, '#334466');
            px(ctx, ox + 1, half, s - 2, half - 1, '#334466');
            // Mortar
            px(ctx, ox, half - 1, s, 2, '#445588');
            px(ctx, ox + half - 1, 0, 2, half, '#445588');
            // Highlight
            px(ctx, ox, 0, s, 1, '#556699');
            px(ctx, ox, 0, 1, s, '#556699');
            // Shadow
            px(ctx, ox, s - 1, s, 1, '#111133');
            px(ctx, ox + s - 1, 0, 1, s, '#111133');
        })();

        // --- Tile 11: Stone platform (castle, gray) ---
        (function () {
            var ox = tileSize * 11;
            var s = tileSize;
            px(ctx, ox, 0, s, s, '#555555');
            // Highlight top-left
            px(ctx, ox, 0, s, 3, '#777777');
            px(ctx, ox, 0, 3, s, '#777777');
            // Shadow bottom-right
            px(ctx, ox, s - 3, s, 3, '#333333');
            px(ctx, ox + s - 3, 0, 3, s, '#333333');
            // Segment line in middle
            px(ctx, ox + 15, 0, 2, s, '#444444');
            // Surface cracks
            px(ctx, ox + 6, 10, 6, 1, '#444444');
            px(ctx, ox + 20, 20, 8, 1, '#444444');
        })();

        // --- Tile 12: Cloud platform left ---
        (function () {
            var ox = tileSize * 12;
            var s = tileSize;
            // White cloud with curved left edge
            // Bottom fill
            px(ctx, ox + 8, 10, s - 8, s - 14, C.white);
            // Rounded top-left puff
            fillCircleOnCtx(ctx, ox + 16, 12, 10, C.white);
            // Bottom shadow
            px(ctx, ox + 8, s - 6, s - 8, 4, '#C0D8FF');
            // Top highlight
            fillCircleOnCtx(ctx, ox + 14, 10, 6, '#F8FCFF');
        })();

        // --- Tile 13: Cloud platform middle ---
        (function () {
            var ox = tileSize * 13;
            var s = tileSize;
            px(ctx, ox, 6, s, s - 10, C.white);
            // Puff on top
            fillCircleOnCtx(ctx, ox + 16, 8, 12, C.white);
            // Highlight
            fillCircleOnCtx(ctx, ox + 14, 4, 8, '#F8FCFF');
            // Bottom shadow
            px(ctx, ox, s - 6, s, 4, '#C0D8FF');
        })();

        // --- Tile 14: Cloud platform right ---
        (function () {
            var ox = tileSize * 14;
            var s = tileSize;
            px(ctx, ox, 10, s - 8, s - 14, C.white);
            fillCircleOnCtx(ctx, ox + 16, 12, 10, C.white);
            px(ctx, ox, s - 6, s - 8, 4, '#C0D8FF');
            fillCircleOnCtx(ctx, ox + 18, 10, 6, '#F8FCFF');
        })();

        // --- Tile 15: Invisible/one-way platform (subtle dots) ---
        (function () {
            var ox = tileSize * 15;
            // Very subtle dotted outline
            for (var dy = 0; dy < tileSize; dy += 4) {
                for (var dx = 0; dx < tileSize; dx += 4) {
                    if ((dx + dy) % 8 === 0) {
                        px(ctx, ox + dx, dy, 2, 2, 'rgba(255,255,255,0.15)');
                    }
                }
            }
            // Top line slightly visible
            px(ctx, ox, 0, tileSize, 2, 'rgba(255,255,255,0.25)');
        })();

        scene.textures.addSpriteSheet('tiles', canvas, {
            frameWidth: tileSize,
            frameHeight: tileSize
        });
    }

    /** Helper to draw ? mark on question block tile */
    function drawQMark(ctx, x, y, s, color) {
        px(ctx, x + 2 * s, y, 4 * s, s, color);
        px(ctx, x + s, y + s, 2 * s, s, color);
        px(ctx, x + 6 * s, y + s, 2 * s, s, color);
        px(ctx, x + 5 * s, y + 2 * s, 3 * s, s, color);
        px(ctx, x + 4 * s, y + 3 * s, 2 * s, s, color);
        px(ctx, x + 3 * s, y + 4 * s, 2 * s, s, color);
        // Dot
        px(ctx, x + 3 * s, y + 6 * s, 2 * s, s, color);
    }

    /** Helper to fill a circle on a context */
    function fillCircleOnCtx(ctx, cx, cy, r, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // ========================================
    // 3. COIN (16x16 per frame, 4 frames)
    // ========================================
    function generateCoin(scene) {
        var frameW = 16, frameH = 16;
        var numFrames = 4;
        var canvas = makeCanvas(frameW * numFrames, frameH);
        var ctx = canvas.getContext('2d');

        var pal = {
            'Y': C.coinYellow, 'y': C.coinDark, 'O': C.starOrange,
            'W': '#FFFFF0', 'w': '#FFF0B0', 'D': '#A07800', 'H': C.coinLight
        };

        // Frame 0: Full circle
        var coin0 = [
            '....YYYY....',
            '...YOOOOY...',
            '..YOwwOOOY..',
            '.YOwWWOOOY..',
            '.YOOOOOOOY..',
            '.YOOOOOOOY..',
            '.YOOOOOOOY..',
            '.YOwWWOOOY..',
            '..YOwwOOOY..',
            '...YOOOOY...',
            '....yyyy....',
            '............'
        ];
        drawPixelGrid(ctx, 0, 2, 1, coin0, pal);
        // Shine
        px(ctx, 3, 4, 1, 1, C.white);

        // Frame 1: 3/4 width
        var coin1 = [
            '.....YYY....',
            '....YOOOY...',
            '...YwOOOY...',
            '...YWOOOY...',
            '...YOOOOY...',
            '...YOOOOY...',
            '...YOOOOY...',
            '...YWOOOY...',
            '...YwOOOY...',
            '....YOOOY...',
            '.....yyy....',
            '............'
        ];
        drawPixelGrid(ctx, frameW, 2, 1, coin1, pal);

        // Frame 2: Thin line (edge-on)
        var coin2 = [
            '......YY....',
            '......YY....',
            '.....YOY....',
            '.....YWY....',
            '.....YOY....',
            '.....YOY....',
            '.....YOY....',
            '.....YWY....',
            '.....YOY....',
            '......YY....',
            '......yy....',
            '............'
        ];
        drawPixelGrid(ctx, frameW * 2, 2, 1, coin2, pal);

        // Frame 3: 3/4 width reversed
        var coin3 = [
            '....YYY.....',
            '...YOOOY....',
            '..YOOOwY....',
            '..YOOOWY....',
            '..YOOOOY....',
            '..YOOOOY....',
            '..YOOOOY....',
            '..YOOOWY....',
            '..YOOOwY....',
            '...YOOOY....',
            '....yyy.....',
            '............'
        ];
        drawPixelGrid(ctx, frameW * 3, 2, 1, coin3, pal);

        scene.textures.addSpriteSheet('coin', canvas, {
            frameWidth: frameW,
            frameHeight: frameH
        });
    }

    // ========================================
    // 4. GOOMBA (32x32, 3 frames)
    // ========================================
    function generateGoomba(scene) {
        var frameW = 32, frameH = 32;
        var numFrames = 3;
        var canvas = makeCanvas(frameW * numFrames, frameH);
        var ctx = canvas.getContext('2d');
        var s = 2;

        var pal = {
            'B': C.goombaBrown, 'b': C.goombaBrownDark, 'D': C.goombaBrownDeep,
            'W': C.white, 'K': C.black,
            'T': C.goombaTan, 't': C.goombaTanDark,
            'A': '#FF4444' // angry brows
        };

        // Frame 0: Walk left foot forward
        var walk0 = [
            '......BBBBB.....',
            '.....BBBBBBB....',
            '....BBBBBBBBB...',
            '...BBBBBBBBBBb..',
            '..bBWWBBbBBWWBb.',
            '..BWKKWBBBBWKKB.',
            '..BBBKKBTTBKKBDb',
            '..BBBBBBTTBBBBBb',
            '..BBBBBbTTbBBBBb',
            '...bBBBBTTBBBBb.',
            '.....TTtKKtTT...',
            '....TTTT..TTTT..',
            '...DDD......DDD.',
            '..DDDD......DDDD',
            '................',
            '................'
        ];
        drawPixelGrid(ctx, 0, 0, s, walk0, pal);

        // Frame 1: Walk right foot forward
        var walk1 = [
            '......BBBBB.....',
            '.....BBBBBBB....',
            '....BBBBBBBBB...',
            '...BBBBBBBBBBb..',
            '..bBWWBBbBBWWBb.',
            '..BWKKWBBBBWKKB.',
            '..BBBKKBTTBKKBDb',
            '..BBBBBBTTBBBBBb',
            '..BBBBBbTTbBBBBb',
            '...bBBBBTTBBBBb.',
            '.....TTtKKtTT...',
            '....TTTT..TTTT..',
            '..DDD......DDD..',
            '.DDDD......DDDD.',
            '................',
            '................'
        ];
        drawPixelGrid(ctx, frameW, 0, s, walk1, pal);

        // Frame 2: Squished (flat)
        var squished = [
            '................',
            '................',
            '................',
            '................',
            '................',
            '................',
            '................',
            '................',
            '................',
            '................',
            '.bBBBBBBBBBBBBb.',
            '.BWKWBBBBBBWKWB.',
            '.BBBBBBTTBBBBBBb',
            '.bBBBBBTTBBBBBb.',
            '..bbbbbbbbbbbb..',
            '................'
        ];
        drawPixelGrid(ctx, frameW * 2, 0, s, squished, pal);

        scene.textures.addSpriteSheet('goomba', canvas, {
            frameWidth: frameW,
            frameHeight: frameH
        });
    }

    // ========================================
    // 5. KOOPA (32x48, 4 frames)
    // ========================================
    function generateKoopa(scene) {
        var frameW = 32, frameH = 48;
        var numFrames = 4;
        var canvas = makeCanvas(frameW * numFrames, frameH);
        var ctx = canvas.getContext('2d');
        var s = 2;

        var pal = {
            'G': C.koopaGreen, 'g': C.koopaGreenDark, 'd': C.koopaGreenDeep,
            'Y': C.koopaBelly, 'y': C.koopaBellyDark,
            'W': C.white, 'K': C.black,
            'S': C.marioSkin, 's': C.marioSkinDark,
            'R': C.marioRed, 'B': C.starOrange,
            'H': C.koopaGreenLight
        };

        // Frame 0: Walk frame 1
        var walk0 = [
            '......GGGg......',
            '.....GGGGGg.....',
            '....GWKGGGGg....',
            '...GWKKGBGGGg...',
            '...gGGGGGGGGg...',
            '....sSGGGGSs....',
            '...sYYYYYYYs....',
            '..gYHYYYHYYYg...',
            '.gGYYHYYYHYYGg..',
            '.gGGYYYYYYYGGg..',
            '.gGGGYYYYYGGGg..',
            '..gGGGGGGGGGg...',
            '...dGGGGGGGd....',
            '...SSS..SSS.....',
            '..SSSS..SSSS....',
            '..sss....sss....',
            '................',
            '................',
            '................',
            '................',
            '................',
            '................',
            '................',
            '................'
        ];
        drawPixelGrid(ctx, 0, 0, s, walk0, pal);

        // Frame 1: Walk frame 2
        var walk1 = [
            '......GGGg......',
            '.....GGGGGg.....',
            '....GWKGGGGg....',
            '...GWKKGBGGGg...',
            '...gGGGGGGGGg...',
            '....sSGGGGSs....',
            '...sYYYYYYYs....',
            '..gYHYYYHYYYg...',
            '.gGYYHYYYHYYGg..',
            '.gGGYYYYYYYGGg..',
            '.gGGGYYYYYGGGg..',
            '..gGGGGGGGGGg...',
            '...dGGGGGGGd....',
            '....SSS..SSS....',
            '...SSSS..SSSS...',
            '....sss..sss....',
            '................',
            '................',
            '................',
            '................',
            '................',
            '................',
            '................',
            '................'
        ];
        drawPixelGrid(ctx, frameW, 0, s, walk1, pal);

        // Frame 2: Shell (green circle)
        var shell = [
            '................',
            '................',
            '................',
            '................',
            '................',
            '................',
            '................',
            '....GGGGGGG.....',
            '...GGGGGGGGGg...',
            '..GGHGGGHGGGGg..',
            '..GGGHGGGHGGGg..',
            '.gGGGGGGGGGGGGg.',
            '.gGGGYYYYYGGGGg.',
            '.gGGGYYYYYGGGGg.',
            '..gGGGGGGGGGGg..',
            '...gGGGGGGGGg...',
            '....ggggggg.....',
            '................',
            '................',
            '................',
            '................',
            '................',
            '................',
            '................'
        ];
        drawPixelGrid(ctx, frameW * 2, 0, s, shell, pal);

        // Frame 3: Shell spinning (with motion lines)
        var shellSpin = [
            '................',
            '................',
            '................',
            '................',
            '................',
            '................',
            '................',
            '....GGGGGGG.....',
            '...GGGGGGGGGg...',
            '..GGGGGGGGGGGg..',
            '..GGGGGGGGGGGg..',
            '.gGGGGGGGGGGGGg.',
            '.gGGGYYYYYGGGGg.',
            '.gGGGYYYYYGGGGg.',
            '..gGGGGGGGGGGg..',
            '...gGGGGGGGGg...',
            '....ggggggg.....',
            '................',
            '................',
            '................',
            '................',
            '................',
            '................',
            '................'
        ];
        drawPixelGrid(ctx, frameW * 3, 0, s, shellSpin, pal);
        // Motion lines
        px(ctx, frameW * 3 - 2, 22, 4, 1, '#88FF88');
        px(ctx, frameW * 3 - 4, 26, 6, 1, '#88FF88');
        px(ctx, frameW * 3 - 2, 30, 4, 1, '#88FF88');

        scene.textures.addSpriteSheet('koopa', canvas, {
            frameWidth: frameW,
            frameHeight: frameH
        });
    }

    // ========================================
    // 6. MUSHROOM (32x32 single frame)
    // ========================================
    function generateMushroom(scene) {
        var frameW = 32, frameH = 32;
        var canvas = makeCanvas(frameW, frameH);
        var ctx = canvas.getContext('2d');
        var s = 2;

        var pal = {
            'R': C.mushRed, 'r': C.mushRedDark,
            'W': C.white, 'w': '#E0E0E0',
            'S': C.mushStem, 's': C.mushStemDark,
            'K': C.black, 'C': '#CC1818',
            'H': '#FF4444'
        };

        var mush = [
            '.....RRRRRR.....',
            '...RRRRRRRRRR...',
            '..RRWWRRRRWWRr..',
            '.RRWWWWRRWWWWRr.',
            '.RWWWWRRRRWWWRr.',
            'RRRWWRRRRRWWRRr.',
            'RRRRRRRRRRRRRRr.',
            '.rRRRRRRRRRRRr..',
            '...KSSSSSSSK....',
            '..KSSSSSSSSSSK..',
            '..KSSwwSSwwSSK..',
            '..KSSwwSSwwSSK..',
            '..KSSSSSSSSSSK..',
            '...KSSSSSSSK....',
            '....KKKKKKKK....',
            '................'
        ];
        drawPixelGrid(ctx, 0, 0, s, mush, pal);

        scene.textures.addSpriteSheet('mushroom', canvas, {
            frameWidth: frameW,
            frameHeight: frameH
        });
    }

    // ========================================
    // 7. STAR (32x32, 4 frames)
    // ========================================
    function generateStar(scene) {
        var frameW = 32, frameH = 32;
        var numFrames = 4;
        var canvas = makeCanvas(frameW * numFrames, frameH);
        var ctx = canvas.getContext('2d');
        var s = 2;

        var pal0 = {
            'Y': C.starYellow, 'y': C.starDark, 'O': C.starOrange,
            'W': C.white, 'K': C.black, 'H': C.starLight
        };

        var starShape = [
            '.......YY.......',
            '......YYYY......',
            '......YHYY......',
            '.....YYYYYY.....',
            '....YYYYYYYY....',
            'YYYYYYYYYYYYYY..',
            '.YYYYYYYYYYYY...',
            '..YYWYYYYWYY....',
            '..YYKYYYYKYY....',
            '...YYYYYYYY.....',
            '...YYYOYYYY.....',
            '..YYYY..YYYY....',
            '..YYY....YYY....',
            '.YYy......yYY...',
            '.Yy........yY...',
            '................'
        ];

        // Frame 0: Normal yellow
        drawPixelGrid(ctx, 0, 0, s, starShape, pal0);

        // Frame 1: Slightly brighter
        var pal1 = {
            'Y': '#FFEC50', 'y': '#D8B830', 'O': '#FFD020',
            'W': C.white, 'K': C.black, 'H': '#FFFFC0'
        };
        drawPixelGrid(ctx, frameW, 0, s, starShape, pal1);

        // Frame 2: White flash
        var pal2 = {
            'Y': '#FFFFA0', 'y': '#F0E060', 'O': '#FFF080',
            'W': C.white, 'K': '#444444', 'H': C.white
        };
        drawPixelGrid(ctx, frameW * 2, 0, s, starShape, pal2);

        // Frame 3: Back towards yellow
        var pal3 = {
            'Y': '#FFE040', 'y': '#D0A828', 'O': '#FFC818',
            'W': C.white, 'K': C.black, 'H': '#FFF0A0'
        };
        drawPixelGrid(ctx, frameW * 3, 0, s, starShape, pal3);

        scene.textures.addSpriteSheet('star', canvas, {
            frameWidth: frameW,
            frameHeight: frameH
        });
    }

    // ========================================
    // 8. FLAGPOLE (16x192 single frame)
    // ========================================
    function generateFlagpole(scene) {
        var w = 16, h = 192;
        var canvas = makeCanvas(w, h);
        var ctx = canvas.getContext('2d');

        // Pole shadow
        px(ctx, 9, 12, 3, h - 12, '#555555');
        // Pole main
        px(ctx, 6, 12, 4, h - 12, C.gray);
        // Pole highlight
        px(ctx, 6, 12, 2, h - 12, C.grayLight);

        // Ball top (golden)
        px(ctx, 2, 0, 12, 12, C.starOrange);
        px(ctx, 3, 1, 10, 10, C.coinYellow);
        px(ctx, 4, 2, 4, 4, C.coinLight); // highlight

        // Triangular flag (green)
        for (var fy = 0; fy < 24; fy++) {
            var fw = Math.floor(24 - fy);
            if (fw > 0) {
                // Dark green base
                ctx.fillStyle = C.pipeGreen;
                ctx.fillRect(10, 14 + fy, Math.min(fw, w - 10), 1);
            }
        }
        // Flag highlight (top portion)
        for (var fy2 = 0; fy2 < 12; fy2++) {
            var fw2 = Math.floor(12 - fy2);
            if (fw2 > 0) {
                ctx.fillStyle = C.koopaGreenLight;
                ctx.fillRect(10, 14 + fy2, Math.min(fw2, w - 10), 1);
            }
        }

        // Top edge of flag
        px(ctx, 10, 14, 6, 1, C.groundGreenLight);

        // Base block at bottom
        px(ctx, 1, h - 8, 14, 8, C.pipeGreen);
        px(ctx, 1, h - 8, 14, 2, C.koopaGreenLight);
        px(ctx, 2, h - 4, 12, 4, C.groundGreenDark);

        scene.textures.addSpriteSheet('flagpole', canvas, {
            frameWidth: w,
            frameHeight: h
        });
    }

    // ========================================
    // 9. PRINCESS (32x64 single frame)
    // ========================================
    function generatePrincess(scene) {
        var frameW = 32, frameH = 64;
        var canvas = makeCanvas(frameW, frameH);
        var ctx = canvas.getContext('2d');
        var s = 2;

        var pal = {
            'P': C.princessPink, 'p': C.princessPinkDark, 'H': '#FF88CC',
            'Y': C.princessGold, 'y': C.koopaBellyDark,
            'S': C.marioSkin, 's': C.marioSkinDark,
            'W': C.white, 'K': C.black,
            'R': C.marioRed, 'B': '#4444FF',
            'G': C.princessGold,
            'g': C.princessHair,
            'L': C.princessPinkLight,
        };

        var princess = [
            '................',
            '....Y.Y.Y.......',
            '...YYYYYYY......',
            '...YYYYYYY......',
            '..gGGGGGGGg.....',
            '..GGGGGGGGGg....',
            '..gGSSSSGGg.....',
            '...SSWKWSS......',
            '...SSRSRSS......',
            '...SSSSSSS......',
            '..LPPPPPPPL.....',
            '..PPPPPPPPPP....',
            '.PPPPPpPPPPP....',
            '.PPPPPpPPPPP....',
            '..PPPPPPPPPP....',
            '...PPPPPPPP.....',
            '...PPPHPPPP.....',
            '...PPPPPPPP.....',
            '...PPPPPPPP.....',
            '...PPPPPPPP.....',
            '...PPPPPPPP.....',
            '...PPPHPPPP.....',
            '...PPPPPPPP.....',
            '....PP..PP......',
            '...WW....WW.....',
            '................',
            '................',
            '................',
            '................',
            '................',
            '................',
            '................'
        ];
        drawPixelGrid(ctx, 0, 0, s, princess, pal);

        scene.textures.addSpriteSheet('princess', canvas, {
            frameWidth: frameW,
            frameHeight: frameH
        });
    }

    // ========================================
    // 10a. CLOUD (64x32 decorative)
    // ========================================
    function generateCloud(scene) {
        var w = 64, h = 32;
        var canvas = makeCanvas(w, h);
        var ctx = canvas.getContext('2d');

        // Blue tint shadow bottom
        ctx.fillStyle = '#C0D8FF';
        fillCircleOnCtx(ctx, 14, 22, 10, '#C0D8FF');
        fillCircleOnCtx(ctx, 32, 22, 12, '#C0D8FF');
        fillCircleOnCtx(ctx, 50, 22, 10, '#C0D8FF');

        // Main white puffs
        fillCircleOnCtx(ctx, 12, 16, 10, C.white);
        fillCircleOnCtx(ctx, 28, 10, 14, C.white);
        fillCircleOnCtx(ctx, 44, 12, 12, C.white);
        fillCircleOnCtx(ctx, 56, 16, 8, C.white);
        // Fill center
        px(ctx, 6, 10, 52, 12, C.white);

        // Highlight
        fillCircleOnCtx(ctx, 26, 6, 8, '#F8FCFF');
        fillCircleOnCtx(ctx, 42, 8, 6, '#F8FCFF');

        scene.textures.addSpriteSheet('cloud', canvas, {
            frameWidth: w,
            frameHeight: h
        });
    }

    // ========================================
    // 10b. HILL (128x64 decorative)
    // ========================================
    function generateHill(scene) {
        var w = 128, h = 64;
        var canvas = makeCanvas(w, h);
        var ctx = canvas.getContext('2d');

        // Main hill shape
        ctx.fillStyle = '#30A030';
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.bezierCurveTo(w * 0.05, -h * 0.2, w * 0.95, -h * 0.2, w, h);
        ctx.fill();

        // Dark spots
        ctx.fillStyle = '#28A028';
        for (var dy = 0; dy < h; dy += 12) {
            for (var dx = 0; dx < w; dx += 16) {
                var hx = dx + (dy % 24 < 12 ? 0 : 8);
                var hy = h - dy;
                var relX = hx / w - 0.5;
                var relY = 1 - dy / h;
                if (relX * relX * 4 + relY * relY < 0.85 && relY > 0.15) {
                    fillCircleOnCtx(ctx, hx, hy, 3, '#28A028');
                }
            }
        }

        // Highlight on top
        ctx.fillStyle = '#48D848';
        ctx.beginPath();
        ctx.moveTo(30, h);
        ctx.bezierCurveTo(w * 0.15, h * 0.1, w * 0.85, h * 0.1, w - 30, h);
        ctx.fill();

        scene.textures.addSpriteSheet('hill', canvas, {
            frameWidth: w,
            frameHeight: h
        });
    }

    // ========================================
    // 10c. BUSH (64x32 decorative)
    // ========================================
    function generateBush(scene) {
        var w = 64, h = 32;
        var canvas = makeCanvas(w, h);
        var ctx = canvas.getContext('2d');

        // Shadow base
        fillCircleOnCtx(ctx, 32, 22, 18, C.groundGreenDark);
        fillCircleOnCtx(ctx, 14, 22, 12, C.groundGreenDark);
        fillCircleOnCtx(ctx, 50, 22, 12, C.groundGreenDark);

        // Main green body
        fillCircleOnCtx(ctx, 32, 16, 16, C.pipeGreen);
        fillCircleOnCtx(ctx, 14, 18, 11, C.pipeGreen);
        fillCircleOnCtx(ctx, 50, 18, 11, C.pipeGreen);

        // Highlight
        fillCircleOnCtx(ctx, 28, 10, 8, C.koopaGreenLight);
        fillCircleOnCtx(ctx, 14, 12, 6, C.koopaGreenLight);
        fillCircleOnCtx(ctx, 46, 12, 6, C.koopaGreenLight);

        // Bright top spots
        fillCircleOnCtx(ctx, 30, 6, 3, C.pipeHighlight);
        fillCircleOnCtx(ctx, 16, 10, 2, C.pipeHighlight);

        scene.textures.addSpriteSheet('bush', canvas, {
            frameWidth: w,
            frameHeight: h
        });
    }

    // ========================================
    // 11. FIREBALL (16x16, 2 frames)
    // ========================================
    function generateFireball(scene) {
        var frameW = 16, frameH = 16;
        var numFrames = 2;
        var canvas = makeCanvas(frameW * numFrames, frameH);
        var ctx = canvas.getContext('2d');

        // Frame 0: fireball
        fillCircleOnCtx(ctx, 8, 8, 6, '#FF4400');
        fillCircleOnCtx(ctx, 8, 8, 4, '#FF8800');
        fillCircleOnCtx(ctx, 7, 6, 2, '#FFCC00');
        px(ctx, 6, 5, 2, 2, '#FFFFFF');

        // Frame 1: slightly different
        var ox = frameW;
        fillCircleOnCtx(ctx, ox + 8, 8, 7, '#FF4400');
        fillCircleOnCtx(ctx, ox + 8, 8, 5, '#FF8800');
        fillCircleOnCtx(ctx, ox + 9, 7, 3, '#FFCC00');
        px(ctx, ox + 8, 5, 2, 2, '#FFFFFF');
        // Spark particles
        px(ctx, ox + 2, 3, 2, 2, '#FF8800');
        px(ctx, ox + 12, 2, 2, 2, '#FFCC00');
        px(ctx, ox + 1, 11, 2, 2, '#FF4400');

        scene.textures.addSpriteSheet('fireball', canvas, {
            frameWidth: frameW,
            frameHeight: frameH
        });
    }

    // ========================================
    // 12. BOWSER (64x64, 2 frames)
    // ========================================
    function generateBowser(scene) {
        var frameW = 64, frameH = 64;
        var numFrames = 2;
        var canvas = makeCanvas(frameW * numFrames, frameH);
        var ctx = canvas.getContext('2d');

        function drawBowserFrame(ox, variant) {
            var s = 2; // scale

            // Horns
            px(ctx, ox + 6, 2, 6, 10, C.bowserHorn);
            px(ctx, ox + 38, 2, 6, 10, C.bowserHorn);
            px(ctx, ox + 7, 2, 3, 3, C.coinLight);
            px(ctx, ox + 39, 2, 3, 3, C.coinLight);

            // Head
            px(ctx, ox + 10, 8, 30, 18, C.bowserGreen);
            px(ctx, ox + 14, 6, 22, 4, C.bowserGreen);

            // Eyes
            px(ctx, ox + 14, 12, 8, 6, C.white);
            px(ctx, ox + 28, 12, 8, 6, C.white);
            // Pupils
            px(ctx, ox + 18, 14, 4, 4, C.marioRed);
            px(ctx, ox + 32, 14, 4, 4, C.marioRed);
            // Angry brows
            px(ctx, ox + 12, 10, 12, 3, C.bowserGreenDark);
            px(ctx, ox + 26, 10, 12, 3, C.bowserGreenDark);

            // Mouth with fangs
            px(ctx, ox + 14, 20, 22, 6, C.marioRed);
            px(ctx, ox + 16, 20, 4, 3, C.white); // fang
            px(ctx, ox + 24, 20, 4, 3, C.white); // fang
            px(ctx, ox + 30, 20, 4, 3, C.white); // fang

            // Body
            px(ctx, ox + 6, 26, 38, 26, C.bowserGreen);

            // Belly
            px(ctx, ox + 14, 28, 22, 18, C.bowserBelly);
            // Belly lines
            px(ctx, ox + 14, 34, 22, 1, C.koopaBellyDark);
            px(ctx, ox + 14, 40, 22, 1, C.koopaBellyDark);

            // Shell on back
            px(ctx, ox + 4, 30, 42, 18, C.bowserShell);
            px(ctx, ox + 8, 32, 34, 14, C.bowserGreen);
            // Shell spikes
            for (var i = 0; i < 4; i++) {
                px(ctx, ox + 12 + i * 8, 26, 5, 6, C.bowserHorn);
                px(ctx, ox + 12 + i * 8, 24, 3, 3, C.coinLight);
            }

            // Arms
            px(ctx, ox + 2, 30, 6, 10, C.bowserGreen);
            px(ctx, ox + 42, 30, 6, 10, C.bowserGreen);
            // Claws
            px(ctx, ox + 2, 38, 6, 4, C.bowserGreenDark);
            px(ctx, ox + 42, 38, 6, 4, C.bowserGreenDark);

            // Legs
            if (variant === 0) {
                px(ctx, ox + 10, 52, 10, 8, C.bowserGreen);
                px(ctx, ox + 30, 52, 10, 8, C.bowserGreen);
                px(ctx, ox + 8, 56, 12, 6, C.bowserGreenDark);
                px(ctx, ox + 28, 56, 12, 6, C.bowserGreenDark);
            } else {
                px(ctx, ox + 12, 52, 10, 8, C.bowserGreen);
                px(ctx, ox + 28, 52, 10, 8, C.bowserGreen);
                px(ctx, ox + 10, 56, 12, 6, C.bowserGreenDark);
                px(ctx, ox + 30, 56, 12, 6, C.bowserGreenDark);
            }

            // Tail
            px(ctx, ox + 44, 44, 10, 4, C.bowserGreen);
            px(ctx, ox + 52, 42, 6, 4, C.bowserGreen);
            px(ctx, ox + 56, 40, 4, 4, C.bowserGreenDark);
            // Tail spike
            px(ctx, ox + 58, 38, 4, 3, C.bowserHorn);
        }

        drawBowserFrame(0, 0);
        drawBowserFrame(frameW, 1);

        scene.textures.addSpriteSheet('bowser', canvas, {
            frameWidth: frameW,
            frameHeight: frameH
        });
    }

    // ========================================
    // MAIN: generateAll(scene)
    // ========================================
    var SpriteGenerator = {
        generateAll: function (scene) {
            generateMario(scene);
            generateBigMario(scene);
            generateTiles(scene);
            generateCoin(scene);
            generateGoomba(scene);
            generateKoopa(scene);
            generateMushroom(scene);
            generateStar(scene);
            generateFlagpole(scene);
            generatePrincess(scene);
            generateCloud(scene);
            generateHill(scene);
            generateBush(scene);
            generateFireball(scene);
            generateBowser(scene);

            console.log('[SpriteGenerator] All sprites generated successfully.');
        }
    };

    // Attach to window
    window.SpriteGenerator = SpriteGenerator;

})();
