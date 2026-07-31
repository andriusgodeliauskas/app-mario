/**
 * LEVEL_THEMES — data-driven level metadata for menu, visuals, words, and music.
 * Geometry stays in GameScene level methods; this file is presentation/game-data.
 */
(function () {
    var LEVEL_THEMES = [
        { num: 1, name: 'GRASSLAND', lt: 'Pieva', bg: '#6B8CFF', tint: null, menuColor: 0x30A030, icon: 'hill', decorSet: 'grassland', words: ['coin', 'mushroom', 'brick', 'jump'], music: 'overworld' },
        { num: 2, name: 'UNDERGROUND', lt: 'Pozemis', bg: '#000000', tint: null, menuColor: 0x8B6914, icon: 'tiles', decorSet: 'underground', words: ['star', 'run', 'turtle', 'life'], music: 'underground' },
        { num: 3, name: 'SKY', lt: 'Dangus', bg: '#9494FF', tint: null, menuColor: 0x9494FF, icon: 'cloud', decorSet: 'sky', words: ['cloud', 'flag', 'score', 'castle'], music: 'overworld' },
        { num: 4, name: 'CASTLE', lt: 'Pilis', bg: '#1A0A1E', tint: null, menuColor: 0x666666, icon: 'tiles', decorSet: 'castle', words: ['princess', 'hero', 'coin', 'star'], music: 'castle' },
        { num: 5, name: 'BEACH', lt: 'Papludimys', bg: '#87CEEB', tint: null, menuColor: 0x44BBDD, icon: 'cloud', decorSet: 'beach', words: ['beach', 'water', 'fish', 'sun'], music: 'overworld' },
        { num: 6, name: 'FOREST', lt: 'Miskas', bg: '#1A3A1A', tint: null, menuColor: 0x1B7A1B, icon: 'hill', decorSet: 'forest', words: ['tree', 'forest', 'bird', 'leaf'], music: 'overworld' },
        { num: 7, name: 'DESERT', lt: 'Dykuma', bg: '#E8A050', tint: null, menuColor: 0xD4A030, icon: 'tiles', decorSet: 'desert', words: ['sand', 'cactus', 'hot', 'dry'], music: 'underground' },
        { num: 8, name: 'SNOW', lt: 'Sniegas', bg: '#C0D8E8', tint: null, menuColor: 0xB0D0E8, icon: 'cloud', decorSet: 'snow', words: ['snow', 'cold', 'ice', 'white'], music: 'overworld' },
        { num: 9, name: 'VOLCANO', lt: 'Ugnikalnis', bg: '#2A0808', tint: null, menuColor: 0xCC2200, icon: 'tiles', decorSet: 'volcano', words: ['fire', 'lava', 'dragon', 'victory'], music: 'castle' },
        { num: 10, name: 'CAVE', lt: 'Ola', bg: '#1A1230', tint: 0x9aa0c0, menuColor: 0x5A4A7A, icon: 'tiles', decorSet: 'cave', words: ['moon', 'brick', 'black', 'mushroom'], music: 'underground' },
        { num: 11, name: 'JUNGLE', lt: 'Dziungles', bg: '#0E3A1E', tint: 0x7bc47b, menuColor: 0x1B7A1B, icon: 'hill', decorSet: 'jungle', words: ['tree', 'leaf', 'frog', 'butterfly'], music: 'overworld' },
        { num: 12, name: 'OCEAN', lt: 'Vandenynas', bg: '#2E86C1', tint: 0x9ad6ff, menuColor: 0x2E86C1, icon: 'cloud', decorSet: 'ocean', words: ['water', 'fish', 'boat', 'river'], music: 'overworld' },
        { num: 13, name: 'SPACE', lt: 'Kosmosas', bg: '#05050F', tint: 0xc8ccd8, menuColor: 0x202840, icon: 'tiles', decorSet: 'space', words: ['star', 'moon', 'black', 'blue'], music: 'castle' },
        { num: 14, name: 'RAINBOW', lt: 'Vaivorykste', bg: '#FFB6E6', tint: 0xffd6f2, menuColor: 0xFF6FB5, icon: 'cloud', decorSet: 'rainbow', words: ['rainbow', 'red', 'yellow', 'pink'], music: 'overworld' },
        { num: 15, name: 'VOLCANO', lt: 'Ugnikalnis*', bg: '#2A0A0A', tint: 0xff8866, menuColor: 0xC0392B, icon: 'tiles', decorSet: 'volcano', words: ['fire', 'lava', 'hot', 'dragon'], music: 'castle' },
        { num: 16, name: 'SWAMP', lt: 'Pelke', bg: '#10240F', tint: 0x88aa66, menuColor: 0x4A7A2A, icon: 'hill', decorSet: 'swamp', words: ['frog', 'water', 'green', 'leaf'], music: 'underground' },
        { num: 17, name: 'CLOUD CITY', lt: 'Debesys', bg: '#BFE3FF', tint: 0xddeeff, menuColor: 0x7FB3FF, icon: 'cloud', decorSet: 'cloudcity', words: ['cloud', 'star', 'white', 'jump'], music: 'overworld' },
        { num: 18, name: 'CANDY', lt: 'Saldainiai', bg: '#FFD9F0', tint: 0xffc0e0, menuColor: 0xFF7FD0, icon: 'cloud', decorSet: 'candy', words: ['candy', 'cake', 'pink', 'gift'], music: 'overworld' },
        { num: 19, name: 'FINAL', lt: 'Finalas*', bg: '#0A0A14', tint: 0xb0b0c0, menuColor: 0x2C2C44, icon: 'tiles', decorSet: 'final', words: ['castle', 'princess', 'hero', 'victory'], music: 'castle' }
    ];

    function getLevelTheme(num) {
        for (var i = 0; i < LEVEL_THEMES.length; i++) {
            if (LEVEL_THEMES[i].num === num) return LEVEL_THEMES[i];
        }
        return null;
    }

    window.LEVEL_THEMES = LEVEL_THEMES;
    window.getLevelTheme = getLevelTheme;
})();
