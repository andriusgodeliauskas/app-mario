/**
 * FullscreenController — HTML overlay fullscreen toggle.
 * Uses Phaser Scale Manager when available, with native Fullscreen API fallback.
 */
(function () {
    var BUTTON_ID = 'fullscreen-toggle';
    var CONTAINER_ID = 'game-container';
    var ENTER_ICON = '⛶';
    var EXIT_ICON = '✕';
    var lastTouchToggleAt = 0;

    function getButton() {
        return document.getElementById(BUTTON_ID);
    }

    function getContainer() {
        return document.getElementById(CONTAINER_ID);
    }

    function getFullscreenElement() {
        return document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement ||
            null;
    }

    function hasNativeFullscreen(container) {
        var enabled = document.fullscreenEnabled ||
            document.webkitFullscreenEnabled ||
            document.mozFullScreenEnabled ||
            document.msFullscreenEnabled;

        return !!enabled && !!container && !!(
            container.requestFullscreen ||
            container.webkitRequestFullscreen ||
            container.mozRequestFullScreen ||
            container.msRequestFullscreen
        );
    }

    function hasPhaserFullscreen() {
        return !!(
            window.game &&
            window.game.scale &&
            window.game.scale.fullscreen &&
            window.game.scale.fullscreen.available
        );
    }

    function isFullscreen() {
        if (window.game && window.game.scale && window.game.scale.isFullscreen) {
            return true;
        }

        return !!getFullscreenElement();
    }

    function requestNativeFullscreen(container) {
        var request = container.requestFullscreen ||
            container.webkitRequestFullscreen ||
            container.mozRequestFullScreen ||
            container.msRequestFullscreen;

        if (!request) return null;
        return request.call(container);
    }

    function exitNativeFullscreen() {
        var exit = document.exitFullscreen ||
            document.webkitExitFullscreen ||
            document.mozCancelFullScreen ||
            document.msExitFullscreen;

        if (!exit) return null;
        return exit.call(document);
    }

    function setButtonSupported(button, supported) {
        button.classList.remove('fullscreen-pending');
        button.hidden = !supported;
        button.setAttribute('aria-hidden', supported ? 'false' : 'true');
    }

    function syncButton() {
        var button = getButton();
        if (!button) return;

        var icon = button.querySelector('.fullscreen-icon');
        var active = isFullscreen();

        if (icon) icon.textContent = active ? EXIT_ICON : ENTER_ICON;
        button.classList.toggle('is-fullscreen', active);
        button.setAttribute('aria-label', active ? 'Išjungti visą ekraną' : 'Įjungti visą ekraną');
        button.setAttribute('title', active ? 'Išeiti iš viso ekrano' : 'Visas ekranas');
    }

    function enterFullscreen(container) {
        if (hasPhaserFullscreen() && window.game.scale.startFullscreen) {
            window.game.scale.startFullscreen();
            return null;
        }

        if (hasNativeFullscreen(container)) {
            return requestNativeFullscreen(container);
        }

        return null;
    }

    function leaveFullscreen() {
        if (window.game && window.game.scale && window.game.scale.isFullscreen && window.game.scale.stopFullscreen) {
            window.game.scale.stopFullscreen();
            return null;
        }

        if (getFullscreenElement()) {
            return exitNativeFullscreen();
        }

        return null;
    }

    function toggleFullscreen(event) {
        var container = getContainer();
        var result;

        if (event) {
            event.preventDefault();
            event.stopPropagation();

            if (event.type === 'touchend') {
                lastTouchToggleAt = Date.now();
            } else if (event.type === 'click' && Date.now() - lastTouchToggleAt < 650) {
                return;
            }
        }

        try {
            result = isFullscreen() ? leaveFullscreen() : enterFullscreen(container);
        } catch (err) {
            syncButton();
            return;
        }

        if (result && result.catch) {
            result.catch(function () {
                syncButton();
            });
        }

        window.setTimeout(syncButton, 80);
    }

    function init() {
        var button = getButton();
        var container = getContainer();
        var supported = hasPhaserFullscreen() || hasNativeFullscreen(container);

        if (!button) return;
        setButtonSupported(button, supported);
        if (!supported) return;

        if (!button.dataset.fullscreenBound) {
            button.dataset.fullscreenBound = 'true';
            button.addEventListener('click', toggleFullscreen);
            button.addEventListener('touchend', toggleFullscreen, { passive: false });
        }

        syncButton();
    }

    document.addEventListener('fullscreenchange', syncButton);
    document.addEventListener('webkitfullscreenchange', syncButton);
    document.addEventListener('mozfullscreenchange', syncButton);
    document.addEventListener('MSFullscreenChange', syncButton);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.setTimeout(init, 250);

    window.FullscreenController = {
        init: init,
        sync: syncButton,
        toggle: toggleFullscreen,
        isSupported: function () {
            return hasPhaserFullscreen() || hasNativeFullscreen(getContainer());
        },
        isFullscreen: isFullscreen
    };
})();
