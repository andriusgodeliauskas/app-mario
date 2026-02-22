/**
 * English Word Dictionary with Lithuanian Translations
 * Used for the "Learn English" game mechanic
 * 60+ words organized by categories for 6-7 year old children
 */

var EnglishWords = {
    words: {
        // === ANIMALS ===
        cat:       { en: 'Cat',       lt: 'Katė',      icon: 'cat',      category: 'animals' },
        dog:       { en: 'Dog',       lt: 'Šuo',       icon: 'dog',      category: 'animals' },
        bird:      { en: 'Bird',      lt: 'Paukštis',  icon: 'bird',     category: 'animals' },
        fish:      { en: 'Fish',      lt: 'Žuvis',     icon: 'fish',     category: 'animals' },
        bear:      { en: 'Bear',      lt: 'Meška',     icon: 'bear',     category: 'animals' },
        rabbit:    { en: 'Rabbit',    lt: 'Triušis',   icon: 'rabbit',   category: 'animals' },
        frog:      { en: 'Frog',      lt: 'Varlė',     icon: 'frog',     category: 'animals' },
        bee:       { en: 'Bee',       lt: 'Bitė',      icon: 'bee',      category: 'animals' },
        turtle:    { en: 'Turtle',    lt: 'Vėžlys',    icon: 'turtle',   category: 'animals' },
        butterfly: { en: 'Butterfly', lt: 'Drugelis',  icon: 'butterfly',category: 'animals' },

        // === NATURE ===
        tree:      { en: 'Tree',      lt: 'Medis',     icon: 'tree',     category: 'nature' },
        flower:    { en: 'Flower',    lt: 'Gėlė',      icon: 'flower',   category: 'nature' },
        sun:       { en: 'Sun',       lt: 'Saulė',     icon: 'sun',      category: 'nature' },
        moon:      { en: 'Moon',      lt: 'Mėnulis',   icon: 'moon',     category: 'nature' },
        star:      { en: 'Star',      lt: 'Žvaigždė',  icon: 'star',     category: 'nature' },
        cloud:     { en: 'Cloud',     lt: 'Debesis',   icon: 'cloud',    category: 'nature' },
        rain:      { en: 'Rain',      lt: 'Lietus',    icon: 'rain',     category: 'nature' },
        rainbow:   { en: 'Rainbow',   lt: 'Vaivorykštė', icon: 'rainbow', category: 'nature' },
        mountain:  { en: 'Mountain',  lt: 'Kalnas',    icon: 'mountain', category: 'nature' },
        river:     { en: 'River',     lt: 'Upė',       icon: 'river',    category: 'nature' },

        // === FRUITS ===
        apple:     { en: 'Apple',     lt: 'Obuolys',   icon: 'apple',    category: 'fruits' },
        banana:    { en: 'Banana',    lt: 'Bananas',   icon: 'banana',   category: 'fruits' },
        cherry:    { en: 'Cherry',    lt: 'Vyšnia',    icon: 'cherry',   category: 'fruits' },
        grape:     { en: 'Grape',     lt: 'Vynuogė',   icon: 'grape',    category: 'fruits' },
        strawberry:{ en: 'Strawberry',lt: 'Braškė',    icon: 'strawberry',category: 'fruits' },
        orange:    { en: 'Orange',    lt: 'Apelsinas', icon: 'orange',   category: 'fruits' },
        watermelon:{ en: 'Watermelon',lt: 'Arbūzas',   icon: 'watermelon',category: 'fruits' },
        lemon:     { en: 'Lemon',     lt: 'Citrina',   icon: 'lemon',    category: 'fruits' },

        // === COLORS ===
        red:       { en: 'Red',       lt: 'Raudona',   icon: 'red',      category: 'colors' },
        blue:      { en: 'Blue',      lt: 'Mėlyna',    icon: 'blue',     category: 'colors' },
        green:     { en: 'Green',     lt: 'Žalia',      icon: 'green',    category: 'colors' },
        yellow:    { en: 'Yellow',    lt: 'Geltona',   icon: 'yellow',   category: 'colors' },
        pink:      { en: 'Pink',      lt: 'Rožinė',    icon: 'pink',     category: 'colors' },
        purple:    { en: 'Purple',    lt: 'Violetinė', icon: 'purple',   category: 'colors' },
        white:     { en: 'White',     lt: 'Balta',     icon: 'white',    category: 'colors' },
        black:     { en: 'Black',     lt: 'Juoda',     icon: 'black',    category: 'colors' },

        // === OBJECTS ===
        house:     { en: 'House',     lt: 'Namas',     icon: 'house',    category: 'objects' },
        car:       { en: 'Car',       lt: 'Automobilis', icon: 'car',    category: 'objects' },
        book:      { en: 'Book',      lt: 'Knyga',     icon: 'book',     category: 'objects' },
        ball:      { en: 'Ball',      lt: 'Kamuolys',  icon: 'ball',     category: 'objects' },
        key:       { en: 'Key',       lt: 'Raktas',    icon: 'key',      category: 'objects' },
        bell:      { en: 'Bell',      lt: 'Varpas',    icon: 'bell',     category: 'objects' },
        cake:      { en: 'Cake',      lt: 'Tortas',    icon: 'cake',     category: 'objects' },
        gift:      { en: 'Gift',      lt: 'Dovana',    icon: 'gift',     category: 'objects' },
        hat:       { en: 'Hat',       lt: 'Kepurė',    icon: 'hat',      category: 'objects' },
        boat:      { en: 'Boat',      lt: 'Valtis',    icon: 'boat',     category: 'objects' },

        // === BODY ===
        eye:       { en: 'Eye',       lt: 'Akis',      icon: 'eye',      category: 'body' },
        hand:      { en: 'Hand',      lt: 'Ranka',     icon: 'hand',     category: 'body' },
        heart:     { en: 'Heart',     lt: 'Širdis',    icon: 'heart',    category: 'body' },
        foot:      { en: 'Foot',      lt: 'Pėda',      icon: 'foot',     category: 'body' },

        // === FOOD ===
        bread:     { en: 'Bread',     lt: 'Duona',     icon: 'bread',    category: 'food' },
        milk:      { en: 'Milk',      lt: 'Pienas',    icon: 'milk',     category: 'food' },
        egg:       { en: 'Egg',       lt: 'Kiaušinis', icon: 'egg',      category: 'food' },
        cheese:    { en: 'Cheese',    lt: 'Sūris',     icon: 'cheese',   category: 'food' },
        pizza:     { en: 'Pizza',     lt: 'Pica',      icon: 'pizza',    category: 'food' },
        candy:     { en: 'Candy',     lt: 'Saldainis', icon: 'candy',    category: 'food' },

        // === GAME WORDS (kept from original) ===
        coin:      { en: 'Coin',      lt: 'Moneta',    icon: 'coin',     category: 'game' },
        mushroom:  { en: 'Mushroom',  lt: 'Grybas',    icon: 'mushroom', category: 'game' },
        brick:     { en: 'Brick',     lt: 'Plyta',     icon: 'brick',    category: 'game' },
        flag:      { en: 'Flag',      lt: 'Vėliava',   icon: 'flag',     category: 'game' },
        jump:      { en: 'Jump',      lt: 'Šuolis',    icon: 'jump',     category: 'game' },
        run:       { en: 'Run',       lt: 'Bėgti',     icon: 'run',      category: 'game' },
        life:      { en: 'Life',      lt: 'Gyvybė',    icon: 'life',     category: 'game' },
        score:     { en: 'Score',     lt: 'Taškai',    icon: 'score',    category: 'game' },
        castle:    { en: 'Castle',    lt: 'Pilis',     icon: 'castle',   category: 'game' },
        princess:  { en: 'Princess',  lt: 'Princesė',  icon: 'princess', category: 'game' },
        hero:      { en: 'Hero',      lt: 'Didvyris',  icon: 'hero',     category: 'game' }
    },

    // Recently shown words — avoid repeats
    _recentWords: [],
    _maxRecent: 10,

    /**
     * Get a random word that hasn't been shown recently
     */
    getRandomWord: function () {
        var keys = Object.keys(this.words);
        // Filter out recently shown
        var available = [];
        for (var i = 0; i < keys.length; i++) {
            if (this._recentWords.indexOf(keys[i]) === -1) {
                available.push(keys[i]);
            }
        }
        // If all words shown recently, reset
        if (available.length === 0) {
            this._recentWords = [];
            available = keys.slice();
        }

        var randomKey = available[Math.floor(Math.random() * available.length)];

        // Add to recent history
        this._recentWords.push(randomKey);
        if (this._recentWords.length > this._maxRecent) {
            this._recentWords.shift();
        }

        var w = this.words[randomKey];
        return { key: randomKey, en: w.en, lt: w.lt, icon: w.icon, category: w.category };
    },

    /**
     * Get a specific word pair by key
     */
    getWord: function (key) {
        if (this.words[key]) {
            var w = this.words[key];
            return { en: w.en, lt: w.lt, icon: w.icon, category: w.category };
        }
        return null;
    },

    /**
     * Get a random word from a specific category
     */
    getWordByCategory: function (category) {
        var keys = Object.keys(this.words);
        var matching = [];
        for (var i = 0; i < keys.length; i++) {
            if (this.words[keys[i]].category === category) {
                matching.push(keys[i]);
            }
        }
        if (matching.length === 0) return this.getRandomWord();
        var randomKey = matching[Math.floor(Math.random() * matching.length)];
        var w = this.words[randomKey];
        return { key: randomKey, en: w.en, lt: w.lt, icon: w.icon, category: w.category };
    }
};

// Attach to window for global access
window.EnglishWords = EnglishWords;
