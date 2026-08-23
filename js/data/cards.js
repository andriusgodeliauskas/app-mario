/**
 * Cards — the collectible character cards.
 *
 * Thirteen of them: the eight playable heroes and the five villains. Each is
 * hidden in exactly one level, so finding them all means exploring rather than
 * running straight for the flagpole.
 *
 * Hero entries are BUILT FROM the character registry rather than retyped: the
 * name and English description a child reads on the card are the same strings
 * that describe the hero everywhere else, so they cannot drift apart.
 *
 *   Cards.forLevel(11)   // -> the DK card, hidden in the jungle
 *   Cards.byId('boo')
 */
(function () {
    'use strict';

    var Chars = (typeof window !== 'undefined' && window.Characters)
        ? window.Characters
        : (typeof require !== 'undefined' ? require('./characters.js') : null);

    // Which level hides which card. Heroes are spread across the early and
    // middle game; each villain's card sits in a level where that villain
    // actually appears, so finding it is a reward for meeting them.
    var HERO_LEVELS = {
        mario: 1, luigi: 3, peach: 5, toad: 7,
        yoshi: 12, daisy: 16, rosalina: 20, diddy: 26
    };

    var VILLAINS = [
        {
            id: 'wario', name: 'Wario', lt: 'Vario', level: 24,
            texture: 'wario', frame: 0,
            description: 'The self-professed archrival of Mario. He loves garlic and making money, and his zigzag moustache is impossible to miss.'
        },
        {
            id: 'waluigi', name: 'Waluigi', lt: 'Valuidzis', level: 40,
            texture: 'waluigi', frame: 0,
            description: "Wario's pal and the self-proclaimed rival of Luigi. His long arms and long legs keep him competitive at every sport."
        },
        {
            id: 'boo', name: 'Boo', lt: 'Vaiduoklis', level: 42,
            texture: 'boo', frame: 0,
            description: 'A mischievous ghost from dark, abandoned places. He is incredibly shy: he freezes and covers his eyes when someone looks right at him.'
        },
        {
            id: 'bowser-jr', name: 'Bowser Jr.', lt: 'Baurio sunus', level: 14,
            texture: 'bowser-jr', frame: 0,
            description: 'The only son of Bowser. He is small but has inherited great strength from his father, and he wears a mask with a scary mouth drawn on it.'
        },
        {
            id: 'dk', name: 'Donkey Kong', lt: 'Donkis Kongas', level: 11,
            texture: 'dk', frame: 0,
            description: 'The king of the jungle, known for his red necktie. He can hurl giant barrels with ease and loves bananas above all else.'
        }
    ];

    function heroCards() {
        if (!Chars) return [];
        return Chars.LIST.map(function (ch) {
            return {
                id: ch.id,
                name: ch.name,
                lt: ch.lt,
                description: ch.description,
                texture: ch.id === 'mario' ? 'mario' : 'hero-' + ch.id,
                frame: 0,
                level: HERO_LEVELS[ch.id],
                isHero: true
            };
        });
    }

    var LIST = heroCards().concat(VILLAINS.map(function (v) {
        v.isHero = false;
        return v;
    }));

    var BY_ID = {};
    var BY_LEVEL = {};
    LIST.forEach(function (c) {
        BY_ID[c.id] = c;
        BY_LEVEL[c.level] = c;
    });

    function byId(id) {
        if (!id) return null;
        return Object.prototype.hasOwnProperty.call(BY_ID, id) ? BY_ID[id] : null;
    }

    function forLevel(level) {
        return Object.prototype.hasOwnProperty.call(BY_LEVEL, level) ? BY_LEVEL[level] : null;
    }

    var Cards = {
        LIST: LIST,
        TOTAL: LIST.length,
        byId: byId,
        forLevel: forLevel
    };

    if (typeof window !== 'undefined') window.Cards = Cards;
    if (typeof module !== 'undefined' && module.exports) module.exports = Cards;
})();
