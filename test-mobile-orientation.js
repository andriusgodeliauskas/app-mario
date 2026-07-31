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

function isVisible(display) {
    return display !== 'none';
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

        var portraitDisplay = await page.$eval('#rotate-overlay', function (el) {
            return getComputedStyle(el).display;
        });
        console.log('Portrait overlay display: ' + portraitDisplay);
        if (!isVisible(portraitDisplay)) {
            throw new Error('Rotate overlay should be visible in portrait');
        }

        console.log('Switching to landscape phone viewport 844x390...');
        await page.setViewportSize({ width: 844, height: 390 });
        await page.waitForTimeout(300);

        var landscapeDisplay = await page.$eval('#rotate-overlay', function (el) {
            return getComputedStyle(el).display;
        });
        console.log('Landscape overlay display: ' + landscapeDisplay);
        if (landscapeDisplay !== 'none') {
            throw new Error('Rotate overlay should be hidden in landscape');
        }

        await page.evaluate(function () {
            window.game.scene.stop('MenuScene');
            window.game.scene.start('GameScene', { level: 1 });
        });
        await page.waitForFunction(function () {
            var scene = window.game && window.game.scene.getScene('GameScene');
            return !!scene && !!scene.player && !!scene.player.body;
        });

        console.log('Rotating portrait -> landscape before using touch controls...');
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(300);
        await page.setViewportSize({ width: 844, height: 390 });
        await page.waitForTimeout(500);

        var startX = await page.evaluate(function () {
            return window.game.scene.getScene('GameScene').player.x;
        });

        await page.$eval('#touch-right', function (btn) {
            var event = new Event('touchstart', { bubbles: true, cancelable: true });
            Object.defineProperty(event, 'changedTouches', {
                value: [{ identifier: 101 }]
            });
            btn.dispatchEvent(event);
        });
        await page.waitForTimeout(650);
        await page.$eval('#touch-right', function (btn) {
            var event = new Event('touchend', { bubbles: true, cancelable: true });
            Object.defineProperty(event, 'changedTouches', {
                value: [{ identifier: 101 }]
            });
            btn.dispatchEvent(event);
        });

        var endX = await page.evaluate(function () {
            return window.game.scene.getScene('GameScene').player.x;
        });
        console.log('Player X before touch-right: ' + startX.toFixed(2));
        console.log('Player X after touch-right: ' + endX.toFixed(2));
        if (endX <= startX + 10) {
            throw new Error('Touch-right did not move the player after rotation');
        }

        if (errors.length > 0) {
            throw new Error('Console errors detected: ' + errors.join(' | '));
        }

        console.log('Mobile orientation test passed.');
    } finally {
        if (browser) await browser.close();
        server.close();
    }
})();
