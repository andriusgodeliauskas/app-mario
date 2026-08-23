var chromium = require('playwright').chromium;
var http = require('http');
var fs = require('fs');
var path = require('path');

var rootDir = __dirname;

function contentType(filePath) {
    var ext = path.extname(filePath).toLowerCase();
    if (ext === '.html') return 'text/html; charset=utf-8';
    if (ext === '.js') return 'application/javascript; charset=utf-8';
    if (ext === '.css') return 'text/css; charset=utf-8';
    if (ext === '.png') return 'image/png';
    if (ext === '.json') return 'application/json; charset=utf-8';
    return 'application/octet-stream';
}

function startServer() {
    var server = http.createServer(function (req, res) {
        var urlPath = decodeURIComponent(req.url.split('?')[0]);
        var filePath = path.join(rootDir, urlPath === '/' ? 'index.html' : urlPath);

        if (!filePath.startsWith(rootDir)) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }

        fs.readFile(filePath, function (err, data) {
            if (err) {
                res.writeHead(404);
                res.end('Not found');
                return;
            }

            res.writeHead(200, { 'Content-Type': contentType(filePath) });
            res.end(data);
        });
    });

    return new Promise(function (resolve, reject) {
        server.on('error', reject);
        server.listen(0, '127.0.0.1', function () {
            resolve(server);
        });
    });
}

async function dispatchTouch(page, selector, type, id) {
    await page.$eval(selector, function (btn, data) {
        var event = new Event(data.type, { bubbles: true, cancelable: true });
        Object.defineProperty(event, 'changedTouches', {
            value: [{ identifier: data.id }]
        });
        btn.dispatchEvent(event);
    }, { type: type, id: id });
}

async function assertPortraitLayout(page) {
    return page.evaluate(function () {
        function box(id) {
            var el = document.getElementById(id);
            var r = el.getBoundingClientRect();
            return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
        }

        var canvas = document.querySelector('#game-container canvas');
        var fullscreen = document.getElementById('fullscreen-toggle');
        var canvasBox = canvas.getBoundingClientRect();
        var fullscreenBox = fullscreen.getBoundingClientRect();
        var controlsBox = document.getElementById('touch-controls').getBoundingClientRect();
        var left = box('touch-left');
        var right = box('touch-right');
        var jump = box('touch-jump');
        var edge = 24;
        var vw = window.innerWidth;
        var vh = window.innerHeight;

        return {
            overlayExists: !!document.getElementById('rotate-overlay'),
            canvas: { width: canvasBox.width, height: canvasBox.height },
            fullscreenVisible: !!(fullscreen.offsetWidth || fullscreen.offsetHeight || fullscreen.getClientRects().length),
            fullscreen: { x: fullscreenBox.x, y: fullscreenBox.y, width: fullscreenBox.width, height: fullscreenBox.height },
            controlsVisible: !!(controlsBox.width && controlsBox.height),
            left: left,
            right: right,
            jump: jump,
            edgeClear: left.x >= edge && right.x >= edge && jump.x >= edge &&
                left.right <= vw - edge && right.right <= vw - edge && jump.right <= vw - edge &&
                left.bottom <= vh - edge && right.bottom <= vh - edge && jump.bottom <= vh - edge
        };
    });
}

async function assertTouchWorks(page, label) {
    var before = await page.evaluate(function () {
        var scene = window.game.scene.getScene('GameScene');
        return { x: scene.player.x, y: scene.player.y };
    });

    await dispatchTouch(page, '#touch-right', 'touchstart', 101);
    await page.waitForTimeout(650);
    await dispatchTouch(page, '#touch-right', 'touchend', 101);
    await dispatchTouch(page, '#touch-jump', 'touchstart', 102);
    await page.waitForTimeout(140);
    await dispatchTouch(page, '#touch-jump', 'touchend', 102);
    await page.waitForTimeout(300);

    var after = await page.evaluate(function () {
        var scene = window.game.scene.getScene('GameScene');
        return {
            x: scene.player.x,
            y: scene.player.y,
            vy: scene.player.body.velocity.y,
            leftPressed: window.TouchController.leftPressed,
            rightPressed: window.TouchController.rightPressed,
            jumpPressed: window.TouchController.jumpPressed,
            paused: scene.scene.isPaused()
        };
    });

    console.log(label + ' player before: ' + JSON.stringify(before));
    console.log(label + ' player after: ' + JSON.stringify(after));
    if (after.x <= before.x + 10) {
        throw new Error(label + ': touch-right did not move the player');
    }
    if (Math.abs(after.y - before.y) <= 4 && Math.abs(after.vy) <= 20) {
        throw new Error(label + ': touch-jump did not affect the player');
    }
    if (after.leftPressed || after.rightPressed || after.jumpPressed) {
        throw new Error(label + ': touch state stuck after release');
    }
    if (after.paused) {
        throw new Error(label + ': GameScene is paused');
    }
}

(async function () {
    var server = await startServer();
    var port = server.address().port;
    var url = 'http://127.0.0.1:' + port + '/';
    var browser;
    var errors = [];

    try {
        browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
        var page = await browser.newPage({
            viewport: { width: 390, height: 844 },
            isMobile: true,
            hasTouch: true
        });

        page.on('console', function (msg) {
            if (msg.type() === 'error') errors.push(msg.text());
        });
        page.on('pageerror', function (err) {
            errors.push('PAGE ERROR: ' + err.message);
        });

        console.log('Serving local game at ' + url);
        console.log('Opening portrait phone viewport 390x844...');
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForFunction(function () { return !!window.game && !!window.TouchController; });

        await page.evaluate(function () {
            window.game.scene.stop('MenuScene');
            window.game.scene.start('GameScene', { level: 1 });
        });
        await page.waitForFunction(function () {
            var scene = window.game && window.game.scene.getScene('GameScene');
            return !!scene && !!scene.player && !!scene.player.body;
        });

        var portrait = await assertPortraitLayout(page);
        console.log('Portrait layout: ' + JSON.stringify(portrait));
        if (portrait.overlayExists) throw new Error('Rotate overlay element should not exist');
        if (portrait.canvas.width < 300 || portrait.canvas.height < 200) throw new Error('Portrait canvas rendered too small');
        if (!portrait.fullscreenVisible) throw new Error('Fullscreen button should be visible in portrait');
        if (!portrait.controlsVisible) throw new Error('Touch controls should be visible in portrait');
        if (!portrait.edgeClear) throw new Error('Portrait touch controls are too close to a screen edge');

        await assertTouchWorks(page, 'Portrait');

        console.log('Rotating portrait -> landscape -> portrait while checking input...');
        await dispatchTouch(page, '#touch-right', 'touchstart', 201);
        await page.setViewportSize({ width: 844, height: 390 });
        await page.waitForTimeout(300);
        var afterLandscapeRotate = await page.evaluate(function () {
            var scene = window.game.scene.getScene('GameScene');
            return {
                rightPressed: window.TouchController.rightPressed,
                paused: scene.scene.isPaused(),
                width: window.innerWidth,
                height: window.innerHeight
            };
        });
        console.log('After landscape rotate: ' + JSON.stringify(afterLandscapeRotate));
        if (afterLandscapeRotate.rightPressed) throw new Error('Touch-right stuck after rotating to landscape');
        if (afterLandscapeRotate.paused) throw new Error('GameScene paused after rotating to landscape');

        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(500);
        await assertTouchWorks(page, 'Portrait after rotate back');

        if (errors.length > 0) {
            throw new Error('Console errors detected: ' + errors.join(' | '));
        }

        console.log('Mobile orientation test passed.');
    } finally {
        if (browser) await browser.close();
        server.close();
    }
})();
