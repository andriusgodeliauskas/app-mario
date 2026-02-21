/**
 * TouchController — HTML overlay touch controls for mobile/tablet
 * Works alongside keyboard input, supports multi-touch (move + jump).
 * Designed for a 6 year old playing on a tablet!
 */

window.TouchController = {
    leftPressed: false,
    rightPressed: false,
    jumpPressed: false,
    jumpJustPressed: false,
    enabled: false,

    // Track active touches per button so multi-touch works correctly
    _activeTouches: {
        left: {},
        right: {},
        jump: {}
    },

    init: function () {
        var self = this;
        var controlsEl = document.getElementById('touch-controls');

        // If no touch support, hide controls and bail out
        if (!('ontouchstart' in window) && !navigator.maxTouchPoints) {
            if (controlsEl) controlsEl.style.display = 'none';
            return;
        }

        this.enabled = true;

        var leftBtn = document.getElementById('touch-left');
        var rightBtn = document.getElementById('touch-right');
        var jumpBtn = document.getElementById('touch-jump');

        if (!leftBtn || !rightBtn || !jumpBtn) return;

        // --- Helper: bind a button to a direction/action ---
        function bindButton(el, key) {
            el.addEventListener('touchstart', function (e) {
                e.preventDefault();
                // Track each individual touch by identifier
                for (var i = 0; i < e.changedTouches.length; i++) {
                    self._activeTouches[key][e.changedTouches[i].identifier] = true;
                }
                self._updateState(key, true);
            }, { passive: false });

            el.addEventListener('touchend', function (e) {
                e.preventDefault();
                for (var i = 0; i < e.changedTouches.length; i++) {
                    delete self._activeTouches[key][e.changedTouches[i].identifier];
                }
                // Only release if NO touches remain on this button
                var stillActive = Object.keys(self._activeTouches[key]).length > 0;
                if (!stillActive) {
                    self._updateState(key, false);
                }
            }, { passive: false });

            el.addEventListener('touchcancel', function (e) {
                e.preventDefault();
                for (var i = 0; i < e.changedTouches.length; i++) {
                    delete self._activeTouches[key][e.changedTouches[i].identifier];
                }
                var stillActive = Object.keys(self._activeTouches[key]).length > 0;
                if (!stillActive) {
                    self._updateState(key, false);
                }
            }, { passive: false });
        }

        bindButton(leftBtn, 'left');
        bindButton(rightBtn, 'right');
        bindButton(jumpBtn, 'jump');

        // Prevent all default touch behaviors on the entire controls overlay
        controlsEl.addEventListener('touchstart', function (e) { e.preventDefault(); }, { passive: false });
        controlsEl.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
        controlsEl.addEventListener('touchend', function (e) { e.preventDefault(); }, { passive: false });

        // Prevent context menu (long-press) on touch buttons
        controlsEl.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    },

    _updateState: function (key, pressed) {
        if (key === 'left') {
            this.leftPressed = pressed;
        } else if (key === 'right') {
            this.rightPressed = pressed;
        } else if (key === 'jump') {
            this.jumpPressed = pressed;
            if (pressed) {
                // Set "just pressed" flag — will be consumed in one game frame
                this.jumpJustPressed = true;
            }
        }
    },

    /**
     * Called each frame from GameScene.update().
     * Resets the jumpJustPressed flag after it has been read once.
     */
    update: function () {
        // jumpJustPressed is consumed by the game logic, then we reset it
        // We use a two-frame approach: the flag stays true for one full frame
        if (this._jumpConsumed) {
            this.jumpJustPressed = false;
            this._jumpConsumed = false;
        }
        if (this.jumpJustPressed) {
            this._jumpConsumed = true;
        }
    }
};
