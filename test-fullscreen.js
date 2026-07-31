var chromium = require('playwright').chromium;
var http = require('http');
var fs = require('fs');
var path = require('path');

var rootDir = __dirname;
var screenshotDir = path.join(rootDir, 'test-artifacts');

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

function rectsIntersect(a, b) {
    return !!a && !!b &&
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y;
}

async function newCheckedPage(browser, options, errors) {
    var page = await browser.newPage(options);

    page.on('console', function (msg) {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
    });
    page.on('pageerror', function (err) {
        errors.push('PAGE ERROR: ' + err.message);
    });

    return page;
}

async function openGame(page, url, options) {
    options = options || {};

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(function () {
        return !!window.game && !!window.FullscreenController;
    });

    if (options.expectButtonHidden) {
        await page.waitForSelector('#fullscreen-toggle', { state: 'attached' });
    } else {
        await page.waitForSelector('#fullscreen-toggle', { state: 'visible' });
    }
}

async function visibleBox(page, selector) {
    var locator = page.locator(selector);
    await locator.waitFor({ state: 'visible' });
    return await locator.boundingBox();
}

async function assertPortraitOverlayHidesButton(page, url) {
    await openGame(page, url, { expectButtonHidden: true });

    var overlayDisplay = await page.$eval('#rotate-overlay', function (el) {
        return getComputedStyle(el).display;
    });
    if (overlayDisplay === 'none') {
        throw new Error('Rotate overlay should be visible in portrait phone viewport');
    }

    var buttonVisible = await page.$eval('#fullscreen-toggle', function (el) {
        return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    });
    if (buttonVisible) {
        throw new Error('Fullscreen button should not be visible over rotate overlay');
    }
}

async function assertLandscapeLayout(page, url) {
    await openGame(page, url);
    await page.screenshot({ path: path.join(screenshotDir, 'fullscreen-phone-landscape.png'), fullPage: true });

    var buttonBox = await visibleBox(page, '#fullscreen-toggle');
    var dpadBox = await visibleBox(page, '#touch-dpad');
    var jumpBox = await visibleBox(page, '#touch-jump');

    if (buttonBox.width < 60 || buttonBox.height < 60) {
        throw new Error('Fullscreen button hit target is smaller than 60px');
    }
    if (rectsIntersect(buttonBox, dpadBox)) {
        throw new Error('Fullscreen button intersects touch D-pad');
    }
    if (rectsIntersect(buttonBox, jumpBox)) {
        throw new Error('Fullscreen button intersects JUMP button');
    }

    return {
        button: buttonBox,
        dpad: dpadBox,
        jump: jumpBox
    };
}

async function assertDesktopVisible(page, url) {
    await openGame(page, url);
    await page.screenshot({ path: path.join(screenshotDir, 'fullscreen-desktop.png'), fullPage: true });

    var buttonBox = await visibleBox(page, '#fullscreen-toggle');
    if (buttonBox.width < 60 || buttonBox.height < 60) {
        throw new Error('Desktop fullscreen button hit target is smaller than 60px');
    }

    return buttonBox;
}

async function assertFullscreenClick(page, url) {
    await openGame(page, url);

    var before = await page.$eval('#fullscreen-toggle .fullscreen-icon', function (el) {
        return el.textContent;
    });
    if (before !== '⛶') {
        throw new Error('Expected windowed fullscreen icon before click, got: ' + before);
    }

    await page.locator('#fullscreen-toggle').click();

    var exercisedRealFullscreen = await page.waitForFunction(function () {
        return !!document.fullscreenElement ||
            !!document.webkitFullscreenElement ||
            document.querySelector('#fullscreen-toggle .fullscreen-icon').textContent === '✕';
    }, null, { timeout: 2500 }).then(function () {
        return page.evaluate(function () {
            return !!document.fullscreenElement || !!document.webkitFullscreenElement;
        });
    }).catch(function () {
        return false;
    });

    if (!exercisedRealFullscreen) {
        await page.evaluate(function () {
            window.__fullscreenHandlerInvoked = false;
            window.game.scale.startFullscreen = function () {
                window.__fullscreenHandlerInvoked = true;
                window.game.scale.isFullscreen = true;
                window.FullscreenController.sync();
            };
        });
        await page.locator('#fullscreen-toggle').click();
    }

    var clickResult = await page.evaluate(function () {
        return {
            icon: document.querySelector('#fullscreen-toggle .fullscreen-icon').textContent,
            realFullscreen: !!document.fullscreenElement || !!document.webkitFullscreenElement,
            handlerInvoked: window.__fullscreenHandlerInvoked === true
        };
    });

    if (clickResult.icon !== '✕') {
        throw new Error('Fullscreen icon did not flip after click');
    }
    if (!clickResult.realFullscreen && !clickResult.handlerInvoked) {
        throw new Error('Fullscreen click did not enter real fullscreen or invoke fallback handler path');
    }

    return clickResult;
}

(async function () {
    var server = await startServer();
    var port = server.address().port;
    var url = 'http://127.0.0.1:' + port + '/';
    var browser;
    var errors = [];

    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir);
    }

    try {
        browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

        console.log('Serving local game at ' + url);

        var desktopPage = await newCheckedPage(browser, {
            viewport: { width: 1280, height: 720 }
        }, errors);
        var desktopBox = await assertDesktopVisible(desktopPage, url);
        console.log('Desktop button box: ' + JSON.stringify(desktopBox));
        await desktopPage.close();

        var landscapePage = await newCheckedPage(browser, {
            viewport: { width: 844, height: 390 },
            isMobile: true,
            hasTouch: true
        }, errors);
        var landscapeBoxes = await assertLandscapeLayout(landscapePage, url);
        console.log('Landscape button box: ' + JSON.stringify(landscapeBoxes.button));
        console.log('Landscape D-pad box: ' + JSON.stringify(landscapeBoxes.dpad));
        console.log('Landscape JUMP box: ' + JSON.stringify(landscapeBoxes.jump));
        await landscapePage.close();

        var portraitPage = await newCheckedPage(browser, {
            viewport: { width: 390, height: 844 },
            isMobile: true,
            hasTouch: true
        }, errors);
        await assertPortraitOverlayHidesButton(portraitPage, url);
        console.log('Portrait rotate overlay hides fullscreen button: yes');
        await portraitPage.close();

        var clickPage = await newCheckedPage(browser, {
            viewport: { width: 1280, height: 720 }
        }, errors);
        var clickResult = await assertFullscreenClick(clickPage, url);
        console.log('Fullscreen click result: ' + JSON.stringify(clickResult));
        await clickPage.close();

        if (errors.length > 0) {
            throw new Error('Console errors detected: ' + errors.join(' | '));
        }

        console.log('Screenshots:');
        console.log('  ' + path.join(screenshotDir, 'fullscreen-phone-landscape.png'));
        console.log('  ' + path.join(screenshotDir, 'fullscreen-desktop.png'));
        console.log('Fullscreen test passed.');
    } finally {
        if (browser) await browser.close();
        server.close();
    }
})();
