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
    firePressed: false,
    fireJustPressed: false,
    downPressed: false,
    enabled: false,
    _listenersBound: false,
    _viewportListenersBound: false,
    _pausedForRotate: false,

    // Track active touches per button so multi-touch works correctly
    _activeTouches: {
        left: {},
        right: {},
        jump: {},
        fire: {},
        down: {}
    },

    init: function () {
        var self = this;
        var controlsEl = document.getElementById('touch-controls');

        this._bindViewportListeners();
        this._handleViewportChange();

        // If no touch support, hide controls and bail out
        if (!('ontouchstart' in window) && !navigator.maxTouchPoints) {
            if (controlsEl) controlsEl.style.display = 'none';
            return;
        }

        this.enabled = true;

        var leftBtn = document.getElementById('touch-left');
        var rightBtn = document.getElementById('touch-right');
        var jumpBtn = document.getElementById('touch-jump');
        var fireBtn = document.getElementById('touch-fire');
        var downBtn = document.getElementById('touch-down');

        if (!leftBtn || !rightBtn || !jumpBtn) return;
        if (this._listenersBound) return;
        this._listenersBound = true;

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
        if (fireBtn) bindButton(fireBtn, 'fire');
        if (downBtn) bindButton(downBtn, 'down');

        // Prevent all default touch behaviors on the entire controls overlay
        controlsEl.addEventListener('touchstart', function (e) { e.preventDefault(); }, { passive: false });
        controlsEl.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
        controlsEl.addEventListener('touchend', function (e) { e.preventDefault(); }, { passive: false });

        // Prevent context menu (long-press) on touch buttons
        controlsEl.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    },

    clearState: function () {
        this.leftPressed = false;
        this.rightPressed = false;
        this.jumpPressed = false;
        this.jumpJustPressed = false;
        this.firePressed = false;
        this.fireJustPressed = false;
        this.downPressed = false;
        this._jumpConsumed = false;
        this._fireConsumed = false;
        this._activeTouches = {
            left: {},
            right: {},
            jump: {},
            fire: {},
            down: {}
        };
    },

    _bindViewportListeners: function () {
        var self = this;

        if (this._viewportListenersBound) return;
        this._viewportListenersBound = true;

        window.addEventListener('orientationchange', function () {
            // A real rotation can strand a held button, so wipe input state.
            self._handleViewportChange(true);
        });

        window.addEventListener('resize', function () {
            // NOT a rotation. Entering fullscreen (and the URL bar hiding on
            // mobile) fires a burst of resize events; wiping input state on each
            // one silently kills a jump the player is in the middle of making,
            // which reads as "jump lags in fullscreen".
            self._handleViewportChange(false);
        });
    },

    // clearInput=true only for genuine orientation changes. Bursts of events are
    // debounced into a single trailing refresh instead of one refresh each.
    _handleViewportChange: function (clearInput) {
        var self = this;

        if (clearInput) this.clearState();
        this._refreshScale();
        this._syncRotatePause();

        this._pendingClearInput = this._pendingClearInput || clearInput;
        if (this._viewportTimer) window.clearTimeout(this._viewportTimer);
        this._viewportTimer = window.setTimeout(function () {
            self._viewportTimer = null;
            if (self._pendingClearInput) self.clearState();
            self._pendingClearInput = false;
            self._refreshScale();
            self._syncRotatePause();
        }, 150);
    },

    _refreshScale: function () {
        if (window.game && window.game.scale && window.game.scale.refresh) {
            window.game.scale.refresh();
        }
    },

    _isRotateOverlayVisible: function () {
        if (!window.matchMedia) return false;
        return window.matchMedia('(orientation: portrait) and (pointer: coarse)').matches;
    },

    _syncRotatePause: function () {
        if (!window.game || !window.game.scene) return;

        var sceneManager = window.game.scene;
        var overlayVisible = this._isRotateOverlayVisible();

        if (overlayVisible) {
            if (sceneManager.isActive && sceneManager.isActive('GameScene')) {
                sceneManager.pause('GameScene');
                this._pausedForRotate = true;
            }
            if (sceneManager.isActive && sceneManager.isActive('RunnerScene')) {
                sceneManager.pause('RunnerScene');
                this._pausedForRotate = true;
            }
            if (sceneManager.isActive && sceneManager.isActive('WonderScene')) {
                sceneManager.pause('WonderScene');
                this._pausedForRotate = true;
            }
            return;
        }

        if (this._pausedForRotate && sceneManager.isPaused && sceneManager.isPaused('GameScene')) {
            sceneManager.resume('GameScene');
        }
        if (this._pausedForRotate && sceneManager.isPaused && sceneManager.isPaused('RunnerScene')) {
            sceneManager.resume('RunnerScene');
        }
        if (this._pausedForRotate && sceneManager.isPaused && sceneManager.isPaused('WonderScene')) {
            sceneManager.resume('WonderScene');
        }
        this._pausedForRotate = false;
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
        } else if (key === 'fire') {
            this.firePressed = pressed;
            if (pressed) {
                this.fireJustPressed = true;
            }
        } else if (key === 'down') {
            this.downPressed = pressed;
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
        // Same two-frame consume pattern for the fire button
        if (this._fireConsumed) {
            this.fireJustPressed = false;
            this._fireConsumed = false;
        }
        if (this.fireJustPressed) {
            this._fireConsumed = true;
        }
    }
};
