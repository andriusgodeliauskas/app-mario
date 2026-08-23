/**
 * Characters — the playable hero roster.
 *
 * Everything that makes a hero different lives here as data: the palette the
 * sprite generator paints with, the silhouette it draws, the physics
 * multipliers GameScene applies, and the id of the power HeroPowers runs.
 *
 * Physics multipliers are deliberately capped at ±10%. The 52 levels were laid
 * out for Mario's reach; a bigger spread would make some jumps unreachable for
 * the slower heroes. Personality comes from `power`, not from the multipliers.
 *
 *   Characters.byId('yoshi').physics.jumpMul
 *   Characters.PLAYABLE_IDS  // ['mario', 'luigi', ...]
 */
(function () {
    'use strict';

    var LIST = [
        {
            id: 'mario',
            name: 'Mario',
            lt: 'Mario',
            shape: 'plumber',
            power: 'fireball',
            physics: { speedMul: 1.00, jumpMul: 1.00 },
            description: 'The hero of the Mushroom Kingdom. Brave, cheerful and always ready to help.',
            palette: {
                hatBright: '#FF4030', hatDark: '#B01010',
                bodyBright: '#3030C0', bodyDark: '#202090',
                skin: '#FCA044', skinDark: '#D07020',
                hair: '#8B5A2B', shoe: '#8B5A2B', trim: '#F8D030'
            }
        },
        {
            id: 'luigi',
            name: 'Luigi',
            lt: 'Luidzis',
            shape: 'plumber',
            power: 'slippery',
            physics: { speedMul: 1.00, jumpMul: 1.10 },
            description: "Mario's younger brother. He is taller, jumps higher and is a little bit shy.",
            palette: {
                hatBright: '#4CD34C', hatDark: '#1B7A1B',
                bodyBright: '#3050C8', bodyDark: '#203098',
                skin: '#FCA044', skinDark: '#D07020',
                hair: '#5C3A1A', shoe: '#6B4A2B', trim: '#F8D030'
            }
        },
        {
            id: 'peach',
            name: 'Princess Peach',
            lt: 'Princese Peach',
            shape: 'dress',
            power: 'glide',
            physics: { speedMul: 0.95, jumpMul: 1.00 },
            description: 'The beloved princess of the Mushroom Kingdom. She is extremely kind to everyone.',
            palette: {
                hatBright: '#FFD84A', hatDark: '#C89A10',
                bodyBright: '#FF9EC8', bodyDark: '#E0578F',
                skin: '#FFD8B0', skinDark: '#E0A878',
                hair: '#FFE04A', shoe: '#E0578F', trim: '#3A7BD5'
            }
        },
        {
            id: 'toad',
            name: 'Toad',
            lt: 'Grybiukas',
            shape: 'mushroom',
            power: 'quickstart',
            physics: { speedMul: 1.10, jumpMul: 1.00 },
            description: 'A cheerful resident of the Mushroom Kingdom. He is loyal and always helps his friends.',
            palette: {
                hatBright: '#FFFFFF', hatDark: '#D8D0C8',
                bodyBright: '#F4F0E8', bodyDark: '#C8C0B4',
                skin: '#FFE0B8', skinDark: '#E0B888',
                hair: '#E82020', shoe: '#8B5A2B', trim: '#3040C0'
            }
        },
        {
            id: 'yoshi',
            name: 'Yoshi',
            lt: 'Josis',
            shape: 'dino',
            power: 'doublejump',
            physics: { speedMul: 1.00, jumpMul: 1.00 },
            description: "Mario's dependable companion from Yoshi's Island. He is kind and carefree.",
            palette: {
                hatBright: '#6CD82C', hatDark: '#3A8C10',
                bodyBright: '#F8F8F0', bodyDark: '#D0D0C0',
                skin: '#6CD82C', skinDark: '#3A8C10',
                hair: '#E84C10', shoe: '#F07020', trim: '#E03030'
            }
        },
        {
            id: 'daisy',
            name: 'Daisy',
            lt: 'Deize',
            shape: 'dress',
            power: 'superbounce',
            physics: { speedMul: 1.00, jumpMul: 1.00 },
            description: 'The princess of Sarasaland. Cheerful, energetic and great at every sport.',
            palette: {
                hatBright: '#FFE44A', hatDark: '#C8A010',
                bodyBright: '#FFD028', bodyDark: '#E87818',
                skin: '#FFD8B0', skinDark: '#E0A878',
                hair: '#8B5A2B', shoe: '#E87818', trim: '#40B0A0'
            }
        },
        {
            id: 'rosalina',
            name: 'Rosalina',
            lt: 'Rozalina',
            shape: 'dress',
            power: 'luma',
            physics: { speedMul: 0.95, jumpMul: 1.00 },
            description: 'A mysterious lady who travels the galaxy with her star-like family, the Lumas.',
            palette: {
                hatBright: '#E8E8F0', hatDark: '#A8A8C0',
                bodyBright: '#A8E8DC', bodyDark: '#5AAFA4',
                skin: '#FFD8B0', skinDark: '#E0A878',
                hair: '#FFE878', shoe: '#5AAFA4', trim: '#88D8F0'
            }
        },
        {
            id: 'diddy',
            name: 'Diddy Kong',
            lt: 'Didis Kongas',
            shape: 'monkey',
            power: 'rolldash',
            physics: { speedMul: 1.10, jumpMul: 0.95 },
            description: "Donkey Kong's trusted partner. He is agile, fast and a great jumper.",
            palette: {
                hatBright: '#E82828', hatDark: '#A81010',
                bodyBright: '#E82828', bodyDark: '#A81010',
                skin: '#C08048', skinDark: '#8B5A2B',
                hair: '#6B4020', shoe: '#6B4020', trim: '#F8D030'
            }
        }
    ];

    var DEFAULT_ID = 'mario';

    var BY_ID = {};
    var PLAYABLE_IDS = [];
    LIST.forEach(function (c) {
        BY_ID[c.id] = c;
        PLAYABLE_IDS.push(c.id);
    });

    function byId(id) {
        if (!id) return null;
        return Object.prototype.hasOwnProperty.call(BY_ID, id) ? BY_ID[id] : null;
    }

    function isPlayable(id) {
        return byId(id) !== null;
    }

    var Characters = {
        LIST: LIST,
        PLAYABLE_IDS: PLAYABLE_IDS,
        DEFAULT_ID: DEFAULT_ID,
        byId: byId,
        isPlayable: isPlayable
    };

    if (typeof window !== 'undefined') window.Characters = Characters;
    if (typeof module !== 'undefined' && module.exports) module.exports = Characters;
})();
