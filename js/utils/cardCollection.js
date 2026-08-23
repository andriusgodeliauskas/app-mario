/**
 * CardCollection — which cards the child has found, in localStorage.
 *
 * Same defensive shape as MathSettings and CharacterSettings: every read
 * validates and falls back to an empty collection rather than throwing. Losing
 * the collection is sad; a crash on the menu screen is worse.
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'app-mario:cards:v1';

    var CardsData = (typeof window !== 'undefined' && window.Cards)
        ? window.Cards
        : (typeof require !== 'undefined' ? require('../data/cards.js') : null);

    function getStorage() {
        try {
            if (typeof localStorage !== 'undefined' && localStorage) return localStorage;
        } catch (e) { /* private mode throws on access */ }
        return null;
    }

    /** Every unlocked id, filtered against the registry. */
    function all() {
        var s = getStorage();
        if (!s) return [];
        try {
            var raw = s.getItem(STORAGE_KEY);
            if (!raw) return [];
            var parsed = JSON.parse(raw);
            if (!parsed || !Array.isArray(parsed.unlocked)) return [];
            return parsed.unlocked.filter(function (id) {
                return typeof id === 'string' && (!CardsData || CardsData.byId(id) !== null);
            });
        } catch (e) {
            return [];
        }
    }

    function isUnlocked(id) {
        return all().indexOf(id) !== -1;
    }

    function unlockedCount() {
        return all().length;
    }

    /** Returns true when this call actually unlocked something new. */
    function unlock(id) {
        if (!id || (CardsData && CardsData.byId(id) === null)) return false;
        var current = all();
        if (current.indexOf(id) !== -1) return false;

        var s = getStorage();
        if (!s) return false;
        current.push(id);
        try {
            s.setItem(STORAGE_KEY, JSON.stringify({ unlocked: current }));
        } catch (e) {
            return false;
        }
        return true;
    }

    function reset() {
        var s = getStorage();
        if (!s) return;
        try { s.removeItem(STORAGE_KEY); } catch (e) { /* nothing to do */ }
    }

    var CardCollection = {
        STORAGE_KEY: STORAGE_KEY,
        all: all,
        isUnlocked: isUnlocked,
        unlockedCount: unlockedCount,
        unlock: unlock,
        reset: reset
    };

    if (typeof window !== 'undefined') window.CardCollection = CardCollection;
    if (typeof module !== 'undefined' && module.exports) module.exports = CardCollection;
})();
