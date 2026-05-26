/**
 * MathSpawner — periodic timer + safe-spot finder for math challenges.
 *
 * Strategy (variant C from design):
 *   - Tick every frame via update(time, delta)
 *   - Every ~10s, find a safe spawn location ahead of Mario
 *   - If no safe location available within 5s, reset the timer
 *
 * "Safe location" criteria:
 *   - 3 consecutive flat ground tiles ahead of player (400-900 px)
 *   - 5 tiles of clear space above (room for sign)
 *   - No enemies within ±2 tiles
 *   - No pit within ±2 tiles
 *   - At least 5 tiles away from flagpole (don't block the win condition)
 */

var MathSpawner = function (scene, settings) {
    this.scene = scene;
    this.settings = settings || (window.MathSettings ? window.MathSettings.load() : null);

    this.TILE = 32;
    this.SPAWN_INTERVAL = 5400;   // 10% more frequent than the previous 6000ms
    this.PENDING_TIMEOUT = 5000;
    this.LOOK_AHEAD_MIN = 400;
    this.LOOK_AHEAD_MAX = 900;

    this.nextSpawnAt = -1;            // set on first update() tick (relative to time)
    this.active = null;
    this.history = [];
    this.pendingSince = null;
    this.destroyed = false;
};

MathSpawner.prototype.update = function (time, delta) {
    if (this.destroyed) return;
    if (!this.scene.player || this.scene.isDead || this.scene.levelComplete) return;

    if (this.nextSpawnAt < 0) {
        this.nextSpawnAt = time + this.SPAWN_INTERVAL;
        return;
    }

    if (this.active) {
        // If somehow Mario got past the active challenge, give up on it
        var challengeX = this.active.getX();
        if (challengeX < this.scene.player.x - 600) {
            this.active.cleanup();
            this.active = null;
            this.nextSpawnAt = time + this.SPAWN_INTERVAL;
        }
        return;
    }

    if (time < this.nextSpawnAt) return;

    if (!window.MathSettings || !window.MathSettings.isAnyEnabled(this.settings)) {
        this.nextSpawnAt = time + this.SPAWN_INTERVAL;
        return;
    }

    var spot = this._findSafeSpot();
    if (!spot) {
        if (this.pendingSince === null) {
            this.pendingSince = time;
        } else if (time - this.pendingSince > this.PENDING_TIMEOUT) {
            this.pendingSince = null;
            this.nextSpawnAt = time + this.SPAWN_INTERVAL;
        }
        return;
    }

    var self = this;
    this.active = new window.MathChallenge(
        this.scene, this.settings, this.history,
        spot.x, spot.y,
        function () {
            self.active = null;
            if (!self.scene || !self.scene.time) return;
            self.nextSpawnAt = self.scene.time.now + self.SPAWN_INTERVAL;
        }
    );
    this.pendingSince = null;
};

MathSpawner.prototype._findSafeSpot = function () {
    var scene = this.scene;
    var player = scene.player;
    if (!player) return null;

    var TILE = this.TILE;
    var startX = player.x + this.LOOK_AHEAD_MIN;
    var endX = player.x + this.LOOK_AHEAD_MAX;

    // Sample at half-tile resolution
    for (var x = startX; x < endX; x += TILE) {
        if (!this._isFlatGround(x)) continue;
        if (!this._isClearAbove(x)) continue;
        if (this._hasEnemyNear(x)) continue;
        if (this._isNearFlagpole(x)) continue;

        var groundY = this._findGroundY(x);
        if (groundY === null) continue;

        return { x: x, y: groundY };
    }

    return null;
};

/**
 * Find the world-Y of the topmost solid surface near x that Mario could stand on.
 *
 * Considers groundTiles + pipeTiles (NOT bricks/question blocks — those are
 * typically floating platforms above the main playfield, and a mushroom row
 * spawned on them looks wrong).
 *
 * Returns the SMALLEST topY (highest visible surface) — the grass row, not the
 * earth-fill rows beneath it. Mushrooms stand on top of the surface.
 */
MathSpawner.prototype._findGroundY = function (x) {
    var scene = this.scene;
    var groups = [scene.groundTiles, scene.pipeTiles];
    var bestY = null;

    for (var g = 0; g < groups.length; g++) {
        var group = groups[g];
        if (!group || !group.children) continue;
        var arr = group.children.entries;
        for (var i = 0; i < arr.length; i++) {
            var t = arr[i];
            if (!t || !t.body) continue;
            if (Math.abs(t.x - x) <= this.TILE / 2 + 1) {
                var topY = t.body.top;
                // Only consider tiles below Mario (so they're "ground", not above)
                if (topY > scene.player.y - 16) {
                    // Smallest topY = highest visible surface (grass on top of earth fill)
                    if (bestY === null || topY < bestY) bestY = topY;
                }
            }
        }
    }
    return bestY;
};

MathSpawner.prototype._isFlatGround = function (x) {
    // The mushroom row needs 3 tiles of flat ground beneath it.
    // Plus a knockback-back from a wrong answer also pushes Mario backwards,
    // so we additionally require no pit at x-64 (one extra tile on the left).
    var TILE = this.TILE;
    var centerY = this._findGroundY(x);
    if (centerY === null) return false;

    var offsets = [-2, -1, 1, 2];  // ±2 tiles checked, but allow ±2 to be slightly different
    for (var i = 0; i < offsets.length; i++) {
        var sideY = this._findGroundY(x + offsets[i] * TILE);
        // ±1 tiles MUST match (the mushroom stands here)
        if (Math.abs(offsets[i]) === 1) {
            if (sideY === null) return false;
            if (Math.abs(sideY - centerY) > 4) return false;
        }
        // ±2 tiles MUST exist (no pit) but can be slightly different height
        if (Math.abs(offsets[i]) === 2) {
            if (sideY === null) return false;
        }
    }
    return true;
};

MathSpawner.prototype._isClearAbove = function (x) {
    // The block row spans ~192px (3 blocks 80px apart) and the sign hovers ~192px
    // above ground. Need a clear box ±3 tiles wide and 7 tiles tall — no solid
    // tiles inside it, otherwise blocks/sign would be embedded in geometry.
    var groundY = this._findGroundY(x);
    if (groundY === null) return false;

    var scene = this.scene;
    var groups = [scene.groundTiles, scene.brickTiles, scene.questionTiles, scene.pipeTiles];
    var TILE = this.TILE;
    var WIDE = TILE * 3;        // ±3 tiles horizontally (covers full block row)
    var TALL = TILE * 7;        // 7 tiles upward (covers sign at top)

    for (var g = 0; g < groups.length; g++) {
        var group = groups[g];
        if (!group || !group.children) continue;
        var arr = group.children.entries;
        for (var i = 0; i < arr.length; i++) {
            var t = arr[i];
            if (!t || !t.body) continue;
            if (t.body.top >= groundY - 4) continue;
            if (Math.abs(t.x - x) <= WIDE &&
                t.body.top >= groundY - TALL &&
                t.body.top < groundY) {
                return false;
            }
        }
    }
    return true;
};

MathSpawner.prototype._hasEnemyNear = function (x) {
    var scene = this.scene;
    var TILE = this.TILE;
    if (!scene.enemies || !scene.enemies.children) return false;
    var arr = scene.enemies.children.entries;
    for (var i = 0; i < arr.length; i++) {
        var e = arr[i];
        if (!e || !e.active) continue;
        if (Math.abs(e.x - x) < TILE * 2.5) return true;
    }
    return false;
};

MathSpawner.prototype._isNearFlagpole = function (x) {
    var scene = this.scene;
    if (!scene.flagpole || !scene.flagpole.x) return false;
    return (scene.flagpole.x - x) < this.TILE * 5;
};

/**
 * Force-cleanup any active challenge and disable spawning.
 * Call from playerDie(), level end, scene shutdown.
 */
MathSpawner.prototype.destroy = function () {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.active) {
        this.active.cleanup();
        this.active = null;
    }
};

if (typeof window !== 'undefined') window.MathSpawner = MathSpawner;
