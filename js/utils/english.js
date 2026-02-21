/**
 * English Word Dictionary with Lithuanian Translations
 * Used for the "Learn English" game mechanic
 */

var EnglishWords = {
    words: {
        coin:      { en: 'Coin',      lt: 'Moneta' },
        mushroom:  { en: 'Mushroom',  lt: 'Grybas' },
        star:      { en: 'Star',      lt: 'Žvaigždė' },
        brick:     { en: 'Brick',     lt: 'Plyta' },
        flag:      { en: 'Flag',      lt: 'Vėliava' },
        jump:      { en: 'Jump',      lt: 'Šuolis' },
        run:       { en: 'Run',       lt: 'Bėgti' },
        life:      { en: 'Life',      lt: 'Gyvybė' },
        score:     { en: 'Score',     lt: 'Taškai' },
        castle:    { en: 'Castle',    lt: 'Pilis' },
        cloud:     { en: 'Cloud',     lt: 'Debesis' },
        turtle:    { en: 'Turtle',    lt: 'Vėžlys' },
        princess:  { en: 'Princess',  lt: 'Princesė' },
        hero:      { en: 'Hero',      lt: 'Didvyris' }
    },

    /**
     * Get a random word pair from the dictionary
     * @returns {{ key: string, en: string, lt: string }}
     */
    getRandomWord: function () {
        var keys = Object.keys(this.words);
        var randomKey = keys[Math.floor(Math.random() * keys.length)];
        return {
            key: randomKey,
            en: this.words[randomKey].en,
            lt: this.words[randomKey].lt
        };
    },

    /**
     * Get a specific word pair by key
     * @param {string} key - The word key (e.g. 'coin', 'mushroom')
     * @returns {{ en: string, lt: string } | null}
     */
    getWord: function (key) {
        if (this.words[key]) {
            return {
                en: this.words[key].en,
                lt: this.words[key].lt
            };
        }
        return null;
    }
};

// Attach to window for global access
window.EnglishWords = EnglishWords;
