/**
 * DebugHUD — on-device diagnostics overlay.
 *
 * Enabled ONLY with ?debug=1 in the URL, so the child never sees it.
 * Purpose: the headless test environment cannot reproduce phone-specific
 * behaviour (its "fullscreen" does not actually resize anything), so these
 * numbers have to be read on the real device.
 *
 * Open:  https://mario.godeliauskas.com/?debug=1
 * Play, switch to fullscreen, jump a few times, then read the panel.
 */
(function () {
    if (typeof window === 'undefined') return;
    if (window.location.search.indexOf('debug=1') === -1) return;

    var stats = {
        resize: 0,
        orientationchange: 0,
        fullscreenchange: 0,
        clearState: 0,
        scaleRefresh: 0,
        jumpTaps: 0,
        jumpsFired: 0,
        lastLatency: null,
        worstLatency: 0
    };

    var pendingTapAt = null;
    var fpsSamples = [];
    var lastFrame = 0;
    var worstFrame = 0;

    // ---- counters ---------------------------------------------------------
    window.addEventListener('resize', function () { stats.resize++; });
    window.addEventListener('orientationchange', function () { stats.orientationchange++; });
    document.addEventListener('fullscreenchange', function () { stats.fullscreenchange++; });
    document.addEventListener('webkitfullscreenchange', function () { stats.fullscreenchange++; });

    // Timestamp the physical tap as early as possible (capture phase).
    var jumpBtn = document.getElementById('touch-jump');
    if (jumpBtn) {
        jumpBtn.addEventListener('touchstart', function () {
            pendingTapAt = performance.now();
            stats.jumpTaps++;
        }, { capture: true, passive: true });
    }

    // ---- panel ------------------------------------------------------------
    var el = document.createElement('div');
    el.id = 'debug-hud';
    el.style.cssText = [
        'position:fixed', 'top:0', 'left:0', 'z-index:99999',
        'font:11px/1.35 monospace', 'color:#0f0', 'background:rgba(0,0,0,.78)',
        'padding:6px 8px', 'white-space:pre', 'pointer-events:none',
        'max-width:60vw', 'border-bottom-right-radius:8px'
    ].join(';');

    // Only the fullscreen element and its descendants are rendered in the
    // browser's top layer — anything left in <body> disappears the moment the
    // game goes fullscreen. Keep the panel parented to whatever is on top.
    function reparent() {
        var target = document.fullscreenElement ||
                     document.webkitFullscreenElement ||
                     document.getElementById('game-container') ||
                     document.body;
        if (el.parentElement !== target) target.appendChild(el);
    }
    reparent();
    document.addEventListener('fullscreenchange', reparent);
    document.addEventListener('webkitfullscreenchange', reparent);

    function wrapOnce() {
        var tc = window.TouchController;
        if (tc && !tc.__dbgWrapped && typeof tc.clearState === 'function') {
            tc.__dbgWrapped = true;
            var origClear = tc.clearState.bind(tc);
            tc.clearState = function () { stats.clearState++; return origClear(); };
        }
        var g = window.game;
        if (g && g.scale && !g.scale.__dbgWrapped && typeof g.scale.refresh === 'function') {
            g.scale.__dbgWrapped = true;
            var origRefresh = g.scale.refresh.bind(g.scale);
            g.scale.refresh = function () { stats.scaleRefresh++; return origRefresh(); };
        }
    }

    function tick(now) {
        wrapOnce();

        if (lastFrame) {
            var dt = now - lastFrame;
            fpsSamples.push(dt);
            if (fpsSamples.length > 60) fpsSamples.shift();
            if (dt > worstFrame) worstFrame = dt;
        }
        lastFrame = now;

        var g = window.game;
        var scene = g && g.scene && g.scene.getScene ? g.scene.getScene('GameScene') : null;

        // Jump landed? measure tap -> upward velocity actually applied.
        if (pendingTapAt && scene && scene.player && scene.player.body &&
            scene.player.body.velocity.y < -100) {
            stats.lastLatency = Math.round(now - pendingTapAt);
            if (stats.lastLatency > stats.worstLatency) stats.worstLatency = stats.lastLatency;
            stats.jumpsFired++;
            pendingTapAt = null;
        }
        // Give up on a tap that never produced a jump (counts as a dropped input).
        if (pendingTapAt && now - pendingTapAt > 1200) pendingTapAt = null;

        var avgDt = fpsSamples.length
            ? fpsSamples.reduce(function (a, b) { return a + b; }, 0) / fpsSamples.length
            : 0;
        var fps = avgDt ? (1000 / avgDt).toFixed(1) : '--';

        var canvas = g ? g.canvas : null;
        var rect = canvas ? canvas.getBoundingClientRect() : null;
        var visible = 0, total = 0;
        if (scene && scene.children && scene.children.list) {
            total = scene.children.list.length;
            for (var i = 0; i < total; i++) if (scene.children.list[i].visible) visible++;
        }

        el.textContent =
            'fps ' + fps + '  worstFrame ' + Math.round(worstFrame) + 'ms\n' +
            'jump lat ' + (stats.lastLatency === null ? '--' : stats.lastLatency + 'ms') +
            '  worst ' + stats.worstLatency + 'ms\n' +
            'taps ' + stats.jumpTaps + '  jumps ' + stats.jumpsFired +
            '  dropped ' + (stats.jumpTaps - stats.jumpsFired) + '\n' +
            'resize ' + stats.resize + '  orient ' + stats.orientationchange +
            '  fsChg ' + stats.fullscreenchange + '\n' +
            'clearState ' + stats.clearState + '  scaleRefresh ' + stats.scaleRefresh + '\n' +
            'fullscreen ' + (!!document.fullscreenElement) +
            '  dpr ' + (window.devicePixelRatio || 1) + '\n' +
            'canvas ' + (canvas ? canvas.width + 'x' + canvas.height : '--') +
            ' css ' + (rect ? Math.round(rect.width) + 'x' + Math.round(rect.height) : '--') + '\n' +
            'objects ' + visible + '/' + total;

        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    window.__debugStats = stats;
})();
