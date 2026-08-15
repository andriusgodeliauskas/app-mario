/**
 * Extra LEVEL_THEMES entries for expansion levels 20-42.
 * Loaded after js/data/themes.js and appends to window.LEVEL_THEMES.
 */
(function () {
    if (!window.LEVEL_THEMES) window.LEVEL_THEMES = [];

    var EXTRA_THEMES = [
        { num: 20, name: 'GARDEN', lt: 'Sodas', bg: '#9BE56E', tint: 0xa7df64, menuColor: 0x49B846, icon: 'hill', decorSet: 'garden', words: ['flower', 'tree', 'bee', 'water', 'leaf', 'green', 'sun'], music: 'overworld' },
        { num: 21, name: 'SHIP', lt: 'Laivas', bg: '#62C7F2', tint: 0xd9a760, menuColor: 0x2C82D6, icon: 'cloud', decorSet: 'ship', words: ['boat', 'water', 'fish', 'blue', 'flag', 'sun'], music: 'overworld' },
        { num: 22, name: 'SCHOOL', lt: 'Mokykla', bg: '#FFD66B', tint: 0xffc657, menuColor: 0xF28C28, icon: 'tiles', decorSet: 'school', words: ['book', 'bell', 'red', 'blue', 'yellow', 'green'], music: 'overworld' },
        { num: 23, name: 'KINDERGARTEN', lt: 'Darzelis', bg: '#FFB7DE', tint: 0xffd24d, menuColor: 0xFF6FB5, icon: 'cloud', decorSet: 'kindergarten', words: ['ball', 'gift', 'cake', 'pink', 'yellow', 'rabbit'], music: 'overworld' },
        { num: 24, name: 'SUPERMARKET', lt: 'Supermarketas', bg: '#B7F0FF', tint: 0xf0d070, menuColor: 0x36B7D8, icon: 'tiles', decorSet: 'supermarket', words: ['apple', 'banana', 'bread', 'milk', 'cheese', 'egg', 'orange'], music: 'overworld' },
        { num: 25, name: 'COUNTRIES', lt: 'Salys', bg: '#A8D8FF', tint: 0xc9e68a, menuColor: 0x5B7CFA, icon: 'cloud', decorSet: 'countries', words: ['flag', 'castle', 'mountain', 'river', 'house', 'star', 'sun'], music: 'overworld' },
        { num: 26, name: 'METRO', lt: 'Metro', bg: '#2D385C', tint: 0x8f9bb8, menuColor: 0x586B9C, icon: 'tiles', decorSet: 'metro', words: ['car', 'run', 'yellow', 'black', 'blue', 'bell'], music: 'underground' },
        { num: 27, name: 'WATER PARK', lt: 'Vandens parkas', bg: '#55D6FF', tint: 0x7fe8df, menuColor: 0x12A8D8, icon: 'cloud', decorSet: 'waterpark', words: ['water', 'rainbow', 'fish', 'blue', 'jump', 'sun', 'ball'], music: 'overworld' },
        { num: 28, name: 'POOP DEMONS', lt: 'Kakos demonai', bg: '#9EDB6F', tint: 0x9f7a45, menuColor: 0x8B6A2A, icon: 'hill', decorSet: 'poopdemons', words: ['frog', 'green', 'black', 'run', 'jump', 'hero'], music: 'castle' },
        { num: 29, name: 'DEEP SPACE', lt: 'Kosmosas 2', bg: '#090A24', tint: 0xbec7ff, menuColor: 0x343C9A, icon: 'tiles', decorSet: 'space2', words: ['star', 'moon', 'black', 'blue', 'purple', 'hero'], music: 'castle' },
        { num: 30, name: 'DEEP FOREST', lt: 'Miskas 2', bg: '#123B22', tint: 0x74b95f, menuColor: 0x227A37, icon: 'hill', decorSet: 'forest2', words: ['tree', 'forest', 'leaf', 'frog', 'bird', 'green'], music: 'overworld' },
        { num: 31, name: 'LOST JUNGLE', lt: 'Dziungles 2', bg: '#0C4D32', tint: 0x7bd877, menuColor: 0x1FA05B, icon: 'hill', decorSet: 'jungle2', words: ['tree', 'leaf', 'butterfly', 'frog', 'green', 'river'], music: 'overworld' },
        { num: 32, name: 'DEEP UNDERGROUND', lt: 'Pozemis 2', bg: '#161326', tint: 0x9788c8, menuColor: 0x5D4BA4, icon: 'tiles', decorSet: 'underground2', words: ['star', 'moon', 'black', 'brick', 'mushroom', 'fire'], music: 'underground' },
        { num: 33, name: 'ZOO', lt: 'Zoologijos sodas', bg: '#9FE38A', tint: 0xd6b06a, menuColor: 0x53A84B, icon: 'hill', decorSet: 'zoo', words: ['cat', 'dog', 'bird', 'fish', 'bear', 'rabbit', 'turtle'], music: 'overworld' },
        { num: 34, name: 'CIRCUS', lt: 'Cirkas', bg: '#FFD36E', tint: 0xff6b6b, menuColor: 0xE64B4B, icon: 'cloud', decorSet: 'circus', words: ['ball', 'hat', 'star', 'red', 'yellow', 'blue', 'jump'], music: 'overworld' },
        { num: 35, name: 'FARM', lt: 'Ukis', bg: '#B8EA7B', tint: 0xd3a35a, menuColor: 0xC9802A, icon: 'hill', decorSet: 'farm', words: ['dog', 'cat', 'bird', 'egg', 'milk', 'apple', 'tree'], music: 'castle' },
        { num: 36, name: 'DINO LAND', lt: 'Dinozaurai', bg: '#78D889', tint: 0x89b85e, menuColor: 0x35A352, icon: 'hill', decorSet: 'dino', words: ['dragon', 'mountain', 'fire', 'tree', 'leaf', 'green'], music: 'overworld' },
        { num: 37, name: 'PIRATE ISLAND', lt: 'Piratu sala', bg: '#6FD3FF', tint: 0xf0c76a, menuColor: 0xD99B22, icon: 'cloud', decorSet: 'pirate', words: ['boat', 'beach', 'water', 'fish', 'flag', 'key', 'hat'], music: 'overworld' },
        { num: 38, name: 'ROBOT FACTORY', lt: 'Robotu fabrikas', bg: '#34445F', tint: 0xa5b1c8, menuColor: 0x607DAD, icon: 'tiles', decorSet: 'robot', words: ['car', 'key', 'bell', 'black', 'blue', 'yellow'], music: 'underground' },
        { num: 39, name: 'HOSPITAL', lt: 'Ligonine', bg: '#DDF7FF', tint: 0xbbe7e8, menuColor: 0x55C7D8, icon: 'cloud', decorSet: 'hospital', words: ['heart', 'hand', 'eye', 'foot', 'white', 'water'], music: 'overworld' },
        { num: 40, name: 'STADIUM', lt: 'Stadionas', bg: '#95D96D', tint: 0x77bd4a, menuColor: 0x36A83F, icon: 'hill', decorSet: 'stadium', words: ['ball', 'run', 'jump', 'flag', 'green', 'score', 'victory'], music: 'overworld' },
        { num: 41, name: 'AIRPORT', lt: 'Oro uostas', bg: '#9FD6FF', tint: 0xb4c4d8, menuColor: 0x3F8DDE, icon: 'cloud', decorSet: 'airport', words: ['cloud', 'bird', 'car', 'hat', 'blue', 'white', 'sun'], music: 'overworld' },
        { num: 42, name: 'HAUNTED HOUSE', lt: 'Vaiduokliu namas', bg: '#282046', tint: 0x8c83b8, menuColor: 0x6A4FB0, icon: 'tiles', decorSet: 'haunted', words: ['house', 'moon', 'star', 'black', 'purple', 'castle', 'hero'], music: 'castle' },
        { num: 43, name: 'SKY RUNNER', lt: 'Dangaus begikas', bg: '#91D8FF', tint: 0xffd6f2, menuColor: 0xFF6FB5, icon: 'cloud', decorSet: 'rainbowrunner', words: ['run', 'jump', 'star', 'score'], music: 'overworld', scene: 'RunnerScene' },
        { num: 44, name: 'WONDER PLAINS', lt: 'Stebuklu pieva', bg: '#7EDBFF', tint: 0x10B981, menuColor: 0x10B981, icon: 'hill', decorSet: 'wonderplains', words: ['jump', 'green', 'block', 'water', 'coin', 'flag'], music: 'overworld', scene: 'WonderScene' },
        { num: 45, name: 'FLUFF-PUFF PEAKS', lt: 'Puku debesys', bg: '#EAF9FF', tint: 0xd9f7ff, menuColor: 0x77CFF2, icon: 'cloud', decorSet: 'fluffpuff', words: ['cloud', 'white', 'jump', 'sky', 'star', 'run'], music: 'overworld', scene: 'WonderScene' },
        { num: 46, name: 'BIOLUMINESCENT FOREST', lt: 'Svytintis miskas', bg: '#071827', tint: 0x2DD4BF, menuColor: 0x14B8A6, icon: 'hill', decorSet: 'bioforest', words: ['night', 'mushroom', 'jump', 'green', 'key', 'pot'], music: 'underground', scene: 'WonderScene' },
        { num: 47, name: 'PASTEL DEPTHS', lt: 'Pastelines gelmes', bg: '#A9E7FF', tint: 0x818CF8, menuColor: 0x818CF8, icon: 'cloud', decorSet: 'pasteldepths', words: ['water', 'swim', 'bubble', 'purple', 'coin', 'fish'], music: 'overworld', scene: 'WonderScene' },
        { num: 48, name: 'NEON UNDERGROUND', lt: 'Neoninis pozemis', bg: '#05030B', tint: 0xF472B6, menuColor: 0xC026D3, icon: 'tiles', decorSet: 'neonunderground', words: ['key', 'door', 'wall', 'up', 'down', 'run'], music: 'underground', scene: 'WonderScene' },
        { num: 49, name: 'ICE SLIDE', lt: 'Ledo slide', bg: '#DDF7FF', tint: 0x9BE7FF, menuColor: 0x67D6F7, icon: 'cloud', decorSet: 'iceslide', words: ['ice', 'slide', 'blue', 'snow', 'jump', 'flag'], music: 'overworld', scene: 'WonderScene' },
        { num: 50, name: 'WIND DUNES', lt: 'Vejo kopos', bg: '#FFDFA0', tint: 0xF6C56B, menuColor: 0xE5A53B, icon: 'hill', decorSet: 'winddunes', words: ['wind', 'sand', 'sun', 'jump', 'run', 'flag'], music: 'overworld', scene: 'WonderScene' },
        { num: 51, name: 'CLOCKWORK GEARS', lt: 'Krumpliaraciu fabrikas', bg: '#5A3A25', tint: 0xD9A441, menuColor: 0xB7791F, icon: 'tiles', decorSet: 'clockwork', words: ['gear', 'clock', 'jump', 'metal', 'coin', 'flag'], music: 'underground', scene: 'WonderScene' },
        { num: 52, name: 'MAGNET CAVES', lt: 'Magnetines olos', bg: '#130F1F', tint: 0x60A5FA, menuColor: 0x2563EB, icon: 'tiles', decorSet: 'magnetcaves', words: ['red', 'blue', 'metal', 'switch', 'cave', 'flag'], music: 'underground', scene: 'WonderScene' },
        { num: 53, name: 'MIRROR HALL', lt: 'Veidrodziu sale', bg: '#F2E8FF', tint: 0xF0ABFC, menuColor: 0xD946EF, icon: 'cloud', decorSet: 'mirrorhall', words: ['mirror', 'twin', 'left', 'right', 'jump', 'flag'], music: 'overworld', scene: 'WonderScene' }
    ];

    for (var i = 0; i < EXTRA_THEMES.length; i++) {
        window.LEVEL_THEMES.push(EXTRA_THEMES[i]);
    }
})();
