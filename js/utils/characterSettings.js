/**
 * CharacterSettings — localStorage I/O for the selected playable hero.
 *
 * Mirrors the MathSettings module: every read validates, and anything that
 * fails validation (missing key, corrupt JSON, an id that is not a playable
 * hero) falls back to Mario rather than throwing. A child on a device with
 * storage disabled still gets a working game.
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'app-mario:character:v1';

    var Chars = (typeof window !== 'undefined' && window.Characters)
        ? window.Characters
        : (typeof require !== 'undefined' ? require('../data/characters.js') : null);

    function defaults() {
        return { id: Chars ? Chars.DEFAULT_ID : 'mario' };
    }

    function getStorage() {
        try {
            if (typeof localStorage !== 'undefined' && localStorage) return localStorage;
        } catch (e) { /* Safari private mode throws on access */ }
        return null;
    }

    function load() {
        var s = getStorage();
        if (!s) return defaults();
        try {
            var raw = s.getItem(STORAGE_KEY);
            if (!raw) return defaults();
            var parsed = JSON.parse(raw);
            if (!parsed || typeof parsed.id !== 'string') return defaults();
            if (Chars && !Chars.isPlayable(parsed.id)) return defaults();
            return { id: parsed.id };
        } catch (e) {
            return defaults();
        }
    }

    function save(settings) {
        if (!settings || typeof settings.id !== 'string') return;
        var s = getStorage();
        if (!s) return;
        try {
            s.setItem(STORAGE_KEY, JSON.stringify({ id: settings.id }));
        } catch (e) { /* quota or disabled storage — selection is not worth failing over */ }
    }

    function selectedId() {
        return load().id;
    }

    var CharacterSettings = {
        STORAGE_KEY: STORAGE_KEY,
        defaults: defaults,
        load: load,
        save: save,
        selectedId: selectedId
    };

    if (typeof window !== 'undefined') window.CharacterSettings = CharacterSettings;
    if (typeof module !== 'undefined' && module.exports) module.exports = CharacterSettings;
})();
