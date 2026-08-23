/**
 * CardsScene — the collection gallery.
 *
 * Thirteen slots in a grid. Found cards show the character; the rest show a
 * black silhouette with a "?", because a child chasing a collection needs to
 * see the SHAPE of what is missing — an empty square motivates nobody.
 *
 * Tapping a found card opens its English name and description; tapping a locked
 * one says only where it hides, never who it is.
 */
var CardsScene = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize: function CardsScene() {
        Phaser.Scene.call(this, { key: 'CardsScene' });
    },

    create: function () {
        var self = this;
        var W = this.cameras.main.width;
        var H = this.cameras.main.height;

        this.cameras.main.setBackgroundColor('#14142B');
        this.detailPanel = null;

        // ── Title ────────────────────────────────────────────────────────────
        this.add.text(W / 2, 34, 'VEIKEJU KORTELES', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '16px',
            color: '#F8D830'
        }).setOrigin(0.5);

        var found = window.CardCollection ? CardCollection.unlockedCount() : 0;
        var total = window.Cards ? Cards.TOTAL : 0;
        this.counterText = this.add.text(W / 2, 60, found + ' / ' + total, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '12px',
            color: found === total ? '#6CD82C' : '#FFFFFF'
        }).setOrigin(0.5);

        this.add.text(W / 2, 80, found === total
            ? 'VISOS SURINKTOS! SAUNUOLIS!'
            : 'Ieskok korteliu lygiuose!', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px',
            color: '#88D8F0'
        }).setOrigin(0.5);

        // ── Grid ─────────────────────────────────────────────────────────────
        this.cardSlots = [];
        var list = window.Cards ? Cards.LIST : [];
        var perRow = 5;
        var cellW = 140, cellH = 112;
        // Starts below y=137: the fullscreen button is an HTML overlay pinned
        // to the top-left corner and it sat on top of the first card.
        var startY = 185;

        list.forEach(function (card, i) {
            var row = Math.floor(i / perRow);
            var inRow = Math.min(perRow, list.length - row * perRow);
            var x = W / 2 + (i % perRow - (inRow - 1) / 2) * cellW;
            var y = startY + row * cellH;
            self.cardSlots.push(self.createSlot(card, x, y));
        });

        // ── Back button ──────────────────────────────────────────────────────
        var backX = 70, backY = H - 40;
        var backBg = this.add.graphics();
        backBg.fillStyle(0x000000, 0.6);
        backBg.fillRoundedRect(backX - 56, backY - 20, 112, 40, 10);
        backBg.lineStyle(3, 0xF8B800, 1);
        backBg.strokeRoundedRect(backX - 56, backY - 20, 112, 40, 10);

        this.add.text(backX, backY, '< ATGAL', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '10px',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        this.backZone = this.add.zone(backX, backY, 112, 40).setInteractive({ useHandCursor: true });
        this.backZone.on('pointerdown', function () {
            if (self.detailPanel) { self.closeDetail(); return; }
            self.scene.start('MenuScene');
        });

        this.input.keyboard.on('keydown-ESC', function () {
            if (self.detailPanel) { self.closeDetail(); return; }
            self.scene.start('MenuScene');
        });
    },

    /** One grid cell: frame, portrait (or silhouette), name, tap target. */
    createSlot: function (card, x, y) {
        var self = this;
        var unlocked = window.CardCollection ? CardCollection.isUnlocked(card.id) : false;

        var frame = this.add.graphics();
        frame.fillStyle(unlocked ? 0x2A2A4E : 0x1C1C33, 1);
        frame.fillRoundedRect(x - 58, y - 48, 116, 96, 10);
        frame.lineStyle(3, unlocked ? 0xF8D030 : 0x44446A, 1);
        frame.strokeRoundedRect(x - 58, y - 48, 116, 96, 10);

        var portrait = null;
        if (this.textures.exists(card.texture)) {
            portrait = this.add.sprite(x, y - 6, card.texture, card.frame);
            portrait.setScale(0.34).setOrigin(0.5);
            // Locked: the shape, nothing else
            if (!unlocked) portrait.setTint(0x000000).setAlpha(0.55);
        }

        var lockMark = null;
        if (!unlocked) {
            lockMark = this.add.text(x, y - 6, '?', {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '22px',
                color: '#F8D830'
            }).setOrigin(0.5);
        }

        this.add.text(x, y + 34, unlocked ? card.name : '???', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: card.name.length > 12 ? '7px' : '8px',
            color: unlocked ? '#FFFFFF' : '#666688'
        }).setOrigin(0.5);

        var zone = this.add.zone(x, y, 116, 96).setInteractive({ useHandCursor: true });
        var slot = { id: card.id, card: card, unlocked: unlocked, portrait: portrait, lockMark: lockMark, zone: zone };
        zone.on('pointerdown', function () { self.showDetail(slot); });
        return slot;
    },

    /** The full card, or a hint about where a locked one hides. */
    showDetail: function (slot) {
        if (this.detailPanel) this.closeDetail();
        var self = this;
        var W = this.cameras.main.width;
        var H = this.cameras.main.height;

        var panel = this.add.container(W / 2, H / 2).setDepth(500);

        var bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.75);
        bg.fillRect(-W / 2, -H / 2, W, H);
        bg.fillStyle(0x1A1A2E, 0.98);
        bg.fillRoundedRect(-210, -130, 420, 260, 16);
        bg.lineStyle(5, 0xF8D030, 1);
        bg.strokeRoundedRect(-210, -130, 420, 260, 16);
        panel.add(bg);

        if (slot.unlocked) {
            var card = slot.card;
            if (this.textures.exists(card.texture)) {
                var portrait = this.add.sprite(-135, -10, card.texture, card.frame).setScale(0.5);
                panel.add(portrait);
            }
            panel.add(this.add.text(-70, -100, card.name, {
                fontFamily: '"Press Start 2P", monospace', fontSize: '13px', color: '#F8D830'
            }).setOrigin(0, 0));
            panel.add(this.add.text(-70, -78, card.lt, {
                fontFamily: '"Press Start 2P", monospace', fontSize: '9px', color: '#88D8F0'
            }).setOrigin(0, 0));
            panel.add(this.add.text(-70, -50, card.description, {
                fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#F0F0F0',
                wordWrap: { width: 260 }, lineSpacing: 4
            }).setOrigin(0, 0));
        } else {
            panel.add(this.add.text(0, -40, '?', {
                fontFamily: '"Press Start 2P", monospace', fontSize: '48px', color: '#F8D830'
            }).setOrigin(0.5));
            panel.add(this.add.text(0, 20, 'Sia kortele slepia\nlygis ' + slot.card.level, {
                fontFamily: '"Press Start 2P", monospace', fontSize: '11px',
                color: '#FFFFFF', align: 'center', lineSpacing: 8
            }).setOrigin(0.5));
        }

        panel.add(this.add.text(0, 105, 'Paspausk, kad uzdarytum', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '8px', color: '#888899'
        }).setOrigin(0.5));

        var closeZone = this.add.zone(0, 0, W, H).setInteractive({ useHandCursor: true });
        closeZone.on('pointerdown', function () { self.closeDetail(); });
        panel.add(closeZone);

        panel.setScale(0.85);
        this.tweens.add({ targets: panel, scale: 1, duration: 180, ease: 'Back.easeOut' });
        this.detailPanel = panel;
    },

    closeDetail: function () {
        if (!this.detailPanel) return;
        this.detailPanel.destroy();
        this.detailPanel = null;
    }
});
