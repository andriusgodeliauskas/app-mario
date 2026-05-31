/**
 * SettingsScene — math challenge configuration UI.
 *
 * 4 rows (one per operation), each with:
 *   - ON/OFF toggle (large checkbox)
 *   - Range buttons (10/20/50/100 for +/−, or 10/20/50 for ×/÷)
 *
 * Saves to localStorage via MathSettings.save() on the SAVE button.
 * ✕ button discards changes.
 *
 * Validation: if all ops disabled, save() auto-enables addition.
 */

var SettingsScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function SettingsScene() {
        Phaser.Scene.call(this, { key: 'SettingsScene' });
    },

    create: function () {
        var W = this.cameras.main.width;   // 800
        var H = this.cameras.main.height;  // 600
        var self = this;

        // Working copy of settings (changes only commit on SAVE)
        this.workingSettings = window.MathSettings
            ? JSON.parse(JSON.stringify(window.MathSettings.load()))
            : { add:{enabled:true,max:10}, subtract:{enabled:false,max:10},
                multiply:{enabled:false,max:10}, divide:{enabled:false,max:10},
                missingOperand:false };
        if (typeof this.workingSettings.missingOperand !== 'boolean') {
            this.workingSettings.missingOperand = false;
        }

        // ========================================
        // BACKGROUND
        // ========================================
        this.cameras.main.setBackgroundColor('#1A1A2E');

        // Decorative top/bottom stripes
        var bgGrad = this.add.graphics();
        bgGrad.fillGradientStyle(0x16213E, 0x16213E, 0x0F3460, 0x0F3460, 1);
        bgGrad.fillRect(0, 0, W, H);

        // ========================================
        // HEADER
        // ========================================
        this.add.text(W / 2, 40, 'MATEMATIKOS NUSTATYMAI', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '18px',
            color: '#F8D830',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Close (X) button — top-right
        var closeBtnSize = 50;
        var closeX = W - closeBtnSize / 2 - 12;
        var closeY = closeBtnSize / 2 + 12;

        var closeBg = this.add.graphics();
        closeBg.fillStyle(0xC0392B, 1);
        closeBg.fillRoundedRect(closeX - closeBtnSize / 2, closeY - closeBtnSize / 2, closeBtnSize, closeBtnSize, 10);
        closeBg.lineStyle(3, 0xFFFFFF, 1);
        closeBg.strokeRoundedRect(closeX - closeBtnSize / 2, closeY - closeBtnSize / 2, closeBtnSize, closeBtnSize, 10);

        this.add.text(closeX, closeY, '✕', {
            fontFamily: 'Arial Black, sans-serif',
            fontSize: '28px',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        var closeZone = this.add.zone(closeX, closeY, closeBtnSize, closeBtnSize)
            .setInteractive({ useHandCursor: true });
        closeZone.on('pointerdown', function () {
            self._goBack();
        });

        // ========================================
        // OPERATION ROWS
        // ========================================
        var opConfig = [
            { key: 'add',      label: 'SUDETIS',  symbol: '+', color: 0x27AE60 },
            { key: 'subtract', label: 'ATIMTIS',  symbol: '-', color: 0x2980B9 },
            { key: 'multiply', label: 'DAUGYBA',  symbol: 'x', color: 0xE67E22 },
            { key: 'divide',   label: 'DALYBA',   symbol: '/', color: 0x8E44AD }
        ];

        var rowStartY = 90;
        var rowHeight = 92;
        var rowMarginX = 40;
        var rowWidth = W - rowMarginX * 2;

        this.opUI = {};
        for (var i = 0; i < opConfig.length; i++) {
            this._buildOpRow(opConfig[i], rowStartY + i * rowHeight, rowMarginX, rowWidth);
        }

        // "Find x" toggle row (single full-width toggle, no range buttons)
        this._buildMissingToggle(rowStartY + opConfig.length * rowHeight + 2, rowMarginX, rowWidth);

        // ========================================
        // SAVE BUTTON
        // ========================================
        var saveBtnW = 280, saveBtnH = 60;
        var saveBtnX = W / 2;
        var saveBtnY = H - 40;

        this.saveBg = this.add.graphics();
        this._drawButton(this.saveBg, saveBtnX, saveBtnY, saveBtnW, saveBtnH, 0xF8B800, 0xFFFFFF);

        this.saveLabel = this.add.text(saveBtnX, saveBtnY, 'ISSAUGOTI', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '20px',
            color: '#1A1A2E'
        }).setOrigin(0.5);

        var saveZone = this.add.zone(saveBtnX, saveBtnY, saveBtnW, saveBtnH)
            .setInteractive({ useHandCursor: true });
        saveZone.on('pointerover', function () { self.saveLabel.setScale(1.05); });
        saveZone.on('pointerout',  function () { self.saveLabel.setScale(1.0); });
        saveZone.on('pointerdown', function () { self._save(); });

        // Notification area (above save button) for "auto-enabled" message
        this.notifyText = this.add.text(W / 2, saveBtnY - 50, '', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '11px',
            color: '#F8D830',
            stroke: '#000',
            strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5);
    },

    // ==========================================
    // BUILD ONE OPERATION ROW
    // ==========================================
    _buildOpRow: function (cfg, y, x, width) {
        var self = this;
        var op = cfg.key;
        var ui = { cfg: cfg };
        this.opUI[op] = ui;

        // Row background
        ui.rowBg = this.add.graphics();
        ui.rowBg.fillStyle(0x222244, 0.6);
        ui.rowBg.fillRoundedRect(x, y, width, 90, 10);
        ui.rowBg.lineStyle(2, cfg.color, 0.8);
        ui.rowBg.strokeRoundedRect(x, y, width, 90, 10);

        // ----- Toggle (left side) -----
        var toggleX = x + 30;
        var toggleY = y + 25;
        var toggleSize = 30;

        ui.toggleBg = this.add.graphics();
        this._drawToggle(ui.toggleBg, toggleX, toggleY, toggleSize, this.workingSettings[op].enabled, cfg.color);

        // Label: "SUDETIS  (+)"
        ui.label = this.add.text(toggleX + 50, toggleY, cfg.label + '  (' + cfg.symbol + ')', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '14px',
            color: this.workingSettings[op].enabled ? '#FFFFFF' : '#888888'
        }).setOrigin(0, 0.5);

        // Toggle clickable zone (covers checkbox + label)
        var toggleZone = this.add.zone(toggleX + 90, toggleY, 200, 40)
            .setInteractive({ useHandCursor: true });
        toggleZone.on('pointerdown', function () {
            self.workingSettings[op].enabled = !self.workingSettings[op].enabled;
            self._refreshOpRow(op);
        });

        // ----- Range buttons (below) -----
        var maxOptions = window.MathSettings.MAX_OPTIONS[op];
        var rangeY = y + 62;
        var rangeBtnW = 60;
        var rangeBtnH = 30;
        var rangeStartX = x + 130;
        var rangeGap = 14;

        // "iki:" label
        ui.rangeLabel = this.add.text(x + 30, rangeY, 'iki:', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '12px',
            color: this.workingSettings[op].enabled ? '#CCCCCC' : '#555555'
        }).setOrigin(0, 0.5);

        ui.rangeBtns = [];
        for (var i = 0; i < maxOptions.length; i++) {
            (function (idx) {
                var maxVal = maxOptions[idx];
                var bx = rangeStartX + idx * (rangeBtnW + rangeGap);
                var by = rangeY;
                var btnBg = self.add.graphics();
                var btnText = self.add.text(bx + rangeBtnW / 2, by, String(maxVal), {
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: '14px',
                    color: '#FFFFFF'
                }).setOrigin(0.5);

                var btnZone = self.add.zone(bx + rangeBtnW / 2, by, rangeBtnW, rangeBtnH)
                    .setInteractive({ useHandCursor: true });
                btnZone.on('pointerdown', function () {
                    if (!self.workingSettings[op].enabled) return;
                    self.workingSettings[op].max = maxVal;
                    self._refreshOpRow(op);
                });

                ui.rangeBtns.push({ value: maxVal, bg: btnBg, text: btnText, zone: btnZone, x: bx, y: by, w: rangeBtnW, h: rangeBtnH });
            })(i);
        }

        this._refreshOpRow(op);
    },

    // ==========================================
    // "FIND X" TOGGLE ROW (8 - x = 3)
    // ==========================================
    _buildMissingToggle: function (y, x, width) {
        var self = this;
        var rowH = 46;
        var color = 0xE84393;

        var bg = this.add.graphics();
        bg.fillStyle(0x222244, 0.6);
        bg.fillRoundedRect(x, y, width, rowH, 10);
        bg.lineStyle(2, color, 0.8);
        bg.strokeRoundedRect(x, y, width, rowH, 10);

        var toggleX = x + 30;
        var toggleY = y + rowH / 2;

        this.missingToggleBg = this.add.graphics();
        this._drawToggle(this.missingToggleBg, toggleX, toggleY, 30, this.workingSettings.missingOperand, color);

        this.missingLabel = this.add.text(toggleX + 50, toggleY, 'RASTI X   (8 - x = 3)', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '14px',
            color: this.workingSettings.missingOperand ? '#FFFFFF' : '#888888'
        }).setOrigin(0, 0.5);

        var zone = this.add.zone(toggleX + 110, toggleY, 320, 40)
            .setInteractive({ useHandCursor: true });
        zone.on('pointerdown', function () {
            self.workingSettings.missingOperand = !self.workingSettings.missingOperand;
            self._drawToggle(self.missingToggleBg, toggleX, toggleY, 30, self.workingSettings.missingOperand, color);
            self.missingLabel.setColor(self.workingSettings.missingOperand ? '#FFFFFF' : '#888888');
        });
    },

    // ==========================================
    // REFRESH ONE OPERATION ROW (after toggle/range change)
    // ==========================================
    _refreshOpRow: function (op) {
        var ui = this.opUI[op];
        if (!ui) return;
        var enabled = this.workingSettings[op].enabled;
        var currentMax = this.workingSettings[op].max;
        var color = ui.cfg.color;

        // Toggle visual
        var toggleX = ui.label.x - 50;
        var toggleY = ui.label.y;
        this._drawToggle(ui.toggleBg, toggleX, toggleY, 30, enabled, color);

        // Label color
        ui.label.setColor(enabled ? '#FFFFFF' : '#888888');
        ui.rangeLabel.setColor(enabled ? '#CCCCCC' : '#555555');

        // Range buttons
        for (var i = 0; i < ui.rangeBtns.length; i++) {
            var btn = ui.rangeBtns[i];
            btn.bg.clear();
            var isSelected = (btn.value === currentMax) && enabled;
            var isDimmed = !enabled;
            var bgColor = isSelected ? 0xE87A2E : (isDimmed ? 0x444444 : 0x2C3E50);
            var borderColor = isSelected ? 0xFFFFFF : (isDimmed ? 0x555555 : 0x4A6080);
            this._drawButton(btn.bg, btn.x + btn.w / 2, btn.y, btn.w, btn.h, bgColor, borderColor);
            btn.text.setColor(isSelected ? '#FFFFFF' : (isDimmed ? '#666666' : '#CCCCCC'));
        }
    },

    // ==========================================
    // HELPERS
    // ==========================================
    _drawToggle: function (g, x, y, size, on, color) {
        g.clear();
        // Box
        g.fillStyle(on ? color : 0x444444, 1);
        g.fillRoundedRect(x - size / 2, y - size / 2, size, size, 5);
        g.lineStyle(2, on ? 0xFFFFFF : 0x666666, 1);
        g.strokeRoundedRect(x - size / 2, y - size / 2, size, size, 5);
        // Checkmark when on
        if (on) {
            g.lineStyle(4, 0xFFFFFF, 1);
            g.beginPath();
            g.moveTo(x - 8, y);
            g.lineTo(x - 2, y + 6);
            g.lineTo(x + 8, y - 6);
            g.strokePath();
        }
    },

    _drawButton: function (g, cx, cy, w, h, fillColor, borderColor) {
        g.clear();
        g.fillStyle(fillColor, 1);
        g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);
        g.lineStyle(3, borderColor, 1);
        g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);
    },

    // ==========================================
    // SAVE & GO BACK
    // ==========================================
    _save: function () {
        var allDisabled = !window.MathSettings.isAnyEnabled(this.workingSettings);
        var saved = window.MathSettings.save(this.workingSettings);

        if (allDisabled) {
            // Auto-enable add — show notification briefly before exiting
            this.workingSettings = JSON.parse(JSON.stringify(saved));
            this._refreshOpRow('add');
            this.notifyText.setText('Bent vienas veiksmas turi buti ijungtas\nSudetis ijungta automatiskai');
            var self = this;
            this.time.delayedCall(1800, function () { self._goBack(); });
            return;
        }

        this._goBack();
    },

    _goBack: function () {
        this.scene.start('MenuScene');
    }
});

window.SettingsScene = SettingsScene;
