/**
 * AudioManager -- Complete 8-bit audio system using Web Audio API
 * All sounds generated programmatically (no external files).
 * Designed for Super Mario -- Learn English Adventure.
 *
 * Usage:
 *   AudioManager.init();              // call on first user click
 *   AudioManager.play('jump');        // play SFX
 *   AudioManager.startMusic('overworld');
 *   AudioManager.stopMusic();
 *   AudioManager.toggleMute();
 */

var AudioManager = (function () {
    'use strict';

    // ========================================
    // STATE
    // ========================================
    var ctx = null;             // AudioContext
    var masterGain = null;      // Master gain node
    var sfxGain = null;         // SFX channel gain
    var musicGain = null;       // Music channel gain
    var initialized = false;
    var muted = false;
    var previousVolume = 0.5;
    var currentMusic = null;    // { osc1, osc2, gain, intervalId, type }
    var musicTempo = 1.0;       // tempo multiplier (for star power)

    // ========================================
    // NOTE FREQUENCIES (Equal temperament)
    // ========================================
    var NOTE = {
        C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
        G4: 392.00, A4: 440.00, Bb4: 466.16, B4: 493.88,
        C5: 523.25, D5: 587.33, Eb5: 622.25, E5: 659.25,
        F5: 698.46, Fs5: 739.99, G5: 783.99, Ab5: 830.61,
        A5: 880.00, Bb5: 932.33, B5: 987.77,
        C6: 1046.50, D6: 1174.66, Eb6: 1244.51, E6: 1318.51,
        F6: 1396.91, G6: 1567.98, A6: 1760.00, B6: 1975.53,
        C7: 2093.00
    };

    // ========================================
    // INIT
    // ========================================
    function init() {
        if (initialized && ctx) {
            // If context was suspended (browser policy), try resuming
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
            return;
        }

        try {
            var AudioCtx = window.AudioContext || window.webkitAudioContext;
            ctx = new AudioCtx();

            // Master gain
            masterGain = ctx.createGain();
            masterGain.gain.value = 0.5;
            masterGain.connect(ctx.destination);

            // SFX channel
            sfxGain = ctx.createGain();
            sfxGain.gain.value = 1.0;
            sfxGain.connect(masterGain);

            // Music channel
            musicGain = ctx.createGain();
            musicGain.gain.value = 0.35;
            musicGain.connect(masterGain);

            initialized = true;

            // Resume on user interaction if suspended
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            console.log('[AudioManager] Initialized successfully.');
        } catch (e) {
            console.warn('[AudioManager] Web Audio API not available:', e);
        }
    }

    // ========================================
    // LOW-LEVEL HELPERS
    // ========================================

    /** Play a single oscillator tone */
    function playTone(freq, duration, type, startTime, gainValue, targetGain) {
        if (!ctx) return;
        var t = startTime || ctx.currentTime;
        var g = gainValue || 0.3;
        var tg = targetGain || sfxGain;

        var osc = ctx.createOscillator();
        var gain = ctx.createGain();

        osc.type = type || 'square';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(g, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc.connect(gain);
        gain.connect(tg);
        osc.start(t);
        osc.stop(t + duration + 0.05);
    }

    /** Play a frequency sweep (slide) */
    function playSweep(freqStart, freqEnd, duration, type, startTime, gainValue) {
        if (!ctx) return;
        var t = startTime || ctx.currentTime;
        var g = gainValue || 0.3;

        var osc = ctx.createOscillator();
        var gain = ctx.createGain();

        osc.type = type || 'square';
        osc.frequency.setValueAtTime(freqStart, t);
        osc.frequency.linearRampToValueAtTime(freqEnd, t + duration);
        gain.gain.setValueAtTime(g, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(t);
        osc.stop(t + duration + 0.05);
    }

    /** Play a noise burst (for brick break etc.) */
    function playNoise(duration, startTime, gainValue) {
        if (!ctx) return;
        var t = startTime || ctx.currentTime;
        var g = gainValue || 0.2;

        // Create white noise via buffer
        var bufferSize = Math.floor(ctx.sampleRate * duration);
        var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        var data = buffer.getChannelData(0);
        for (var i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        var source = ctx.createBufferSource();
        source.buffer = buffer;

        var gain = ctx.createGain();
        gain.gain.setValueAtTime(g, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        source.connect(gain);
        gain.connect(sfxGain);
        source.start(t);
        source.stop(t + duration + 0.02);
    }

    // ========================================
    // SOUND EFFECTS
    // ========================================

    var sounds = {};

    /** Jump -- quick ascending tone 200->600Hz, 150ms, square */
    sounds.jump = function () {
        playSweep(200, 600, 0.15, 'square', null, 0.25);
    };

    /** Coin -- two quick high notes E6, G6, 80ms each, square */
    sounds.coin = function () {
        var t = ctx.currentTime;
        playTone(NOTE.E6, 0.08, 'square', t, 0.2);
        playTone(NOTE.G6, 0.12, 'square', t + 0.08, 0.2);
    };

    /** Power-up -- rising arpeggio C5->E5->G5->C6, 100ms each, square */
    sounds.powerup = function () {
        var t = ctx.currentTime;
        var notes = [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6];
        for (var i = 0; i < notes.length; i++) {
            playTone(notes[i], 0.12, 'square', t + i * 0.1, 0.2);
        }
    };

    /** Stomp -- short thud 100->50Hz, 100ms, triangle */
    sounds.stomp = function () {
        playSweep(100, 50, 0.1, 'triangle', null, 0.35);
    };

    /** Death -- descending slide 400->100Hz, 800ms, square */
    sounds.death = function () {
        var t = ctx.currentTime;
        playSweep(400, 100, 0.8, 'square', t, 0.3);
    };

    /** Level complete -- victory fanfare: C5->D5->E5->F5->G5->A5->B5->C6, 150ms each */
    sounds.levelComplete = function () {
        var t = ctx.currentTime;
        var notes = [NOTE.C5, NOTE.D5, NOTE.E5, NOTE.F5, NOTE.G5, NOTE.A5, NOTE.B5, NOTE.C6];
        for (var i = 0; i < notes.length; i++) {
            playTone(notes[i], 0.18, 'square', t + i * 0.15, 0.25);
        }
    };

    /** Brick break -- white noise burst, 50ms */
    sounds.brickBreak = function () {
        playNoise(0.05, null, 0.25);
    };

    /** Bump -- low thud, 80Hz, 60ms, sine */
    sounds.bump = function () {
        playTone(80, 0.06, 'sine', null, 0.3);
    };

    /** 1-UP -- quick ascending 3 notes C5->E5->G5, 100ms, triangle */
    sounds.oneUp = function () {
        var t = ctx.currentTime;
        var notes = [NOTE.C5, NOTE.E5, NOTE.G5];
        for (var i = 0; i < notes.length; i++) {
            playTone(notes[i], 0.12, 'triangle', t + i * 0.1, 0.25);
        }
    };

    /** Flagpole -- descending notes as Mario slides down */
    sounds.flagpole = function () {
        var t = ctx.currentTime;
        var notes = [NOTE.G5, NOTE.E5, NOTE.C5, NOTE.G4, NOTE.E4, NOTE.C4];
        for (var i = 0; i < notes.length; i++) {
            playTone(notes[i], 0.15, 'triangle', t + i * 0.12, 0.2);
        }
    };

    /** Pause -- single beep */
    sounds.pause = function () {
        playTone(440, 0.1, 'square', null, 0.15);
    };

    /** Fireball / shell kick -- short descending noise, 80ms */
    sounds.fireball = function () {
        playSweep(800, 200, 0.08, 'square', null, 0.2);
    };

    // ========================================
    // PLAY SOUND EFFECT
    // ========================================
    function play(soundName) {
        if (!ctx || muted) return;
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        if (sounds[soundName]) {
            try {
                sounds[soundName]();
            } catch (e) {
                console.warn('[AudioManager] Error playing sound:', soundName, e);
            }
        } else {
            console.warn('[AudioManager] Unknown sound:', soundName);
        }
    }

    // ========================================
    // BACKGROUND MUSIC
    // ========================================

    // Music definitions: arrays of { note, duration } for melody and bass
    // Duration is in beats (1 = quarter note at base BPM)

    var musicDefs = {};

    /** Overworld theme -- happy C major, ~4 bars, 140 BPM */
    musicDefs.overworld = {
        bpm: 140,
        melody: [
            // Bar 1
            { n: NOTE.E5, d: 0.5 }, { n: NOTE.E5, d: 0.5 }, { n: 0, d: 0.5 }, { n: NOTE.E5, d: 0.5 },
            { n: 0, d: 0.5 }, { n: NOTE.C5, d: 0.5 }, { n: NOTE.E5, d: 1 },
            // Bar 2
            { n: NOTE.G5, d: 1 }, { n: 0, d: 1 }, { n: NOTE.G4, d: 1 }, { n: 0, d: 1 },
            // Bar 3
            { n: NOTE.C5, d: 1 }, { n: 0, d: 0.5 }, { n: NOTE.G4, d: 1 }, { n: 0, d: 0.5 },
            { n: NOTE.E4, d: 1 }, { n: 0, d: 1 },
            // Bar 4
            { n: NOTE.A4, d: 1 }, { n: NOTE.B4, d: 1 }, { n: NOTE.Bb4, d: 0.5 }, { n: NOTE.A4, d: 1 },
            { n: NOTE.G4, d: 0.75 }, { n: NOTE.E5, d: 0.75 }, { n: NOTE.G5, d: 0.75 }, { n: NOTE.A5, d: 1 },
            { n: NOTE.F5, d: 0.5 }, { n: NOTE.G5, d: 0.5 }, { n: 0, d: 0.5 }, { n: NOTE.E5, d: 1 },
            { n: NOTE.C5, d: 0.5 }, { n: NOTE.D5, d: 0.5 }, { n: NOTE.B4, d: 1 }
        ],
        bass: [
            // Bar 1
            { n: NOTE.D4, d: 0.5 }, { n: NOTE.D4, d: 0.5 }, { n: 0, d: 0.5 }, { n: NOTE.D4, d: 0.5 },
            { n: 0, d: 0.5 }, { n: NOTE.D4, d: 0.5 }, { n: NOTE.D4, d: 1 },
            // Bar 2
            { n: NOTE.G4, d: 1 }, { n: 0, d: 1 }, { n: NOTE.G4, d: 1 }, { n: 0, d: 1 },
            // Bar 3
            { n: NOTE.G4, d: 1 }, { n: 0, d: 0.5 }, { n: NOTE.E4, d: 1 }, { n: 0, d: 0.5 },
            { n: NOTE.C4, d: 1 }, { n: 0, d: 1 },
            // Bar 4
            { n: NOTE.F4, d: 1 }, { n: NOTE.G4, d: 1 }, { n: NOTE.F4, d: 0.5 }, { n: NOTE.F4, d: 1 },
            { n: NOTE.E4, d: 0.75 }, { n: NOTE.C4, d: 0.75 }, { n: NOTE.E4, d: 0.75 }, { n: NOTE.F4, d: 1 },
            { n: NOTE.D4, d: 0.5 }, { n: NOTE.E4, d: 0.5 }, { n: 0, d: 0.5 }, { n: NOTE.C4, d: 1 },
            { n: NOTE.A4, d: 0.5 }, { n: NOTE.B4, d: 0.5 }, { n: NOTE.G4, d: 1 }
        ]
    };

    /** Underground theme -- minor key, slower, 100 BPM */
    musicDefs.underground = {
        bpm: 100,
        melody: [
            // Bar 1 -- low mysterious melody
            { n: NOTE.C4, d: 0.5 }, { n: NOTE.C5, d: 0.5 }, { n: NOTE.A4, d: 0.5 }, { n: NOTE.A5, d: 0.5 },
            { n: NOTE.Bb4, d: 0.5 }, { n: NOTE.Bb5, d: 0.5 }, { n: 0, d: 1 },
            // Bar 2
            { n: NOTE.C4, d: 0.5 }, { n: NOTE.C5, d: 0.5 }, { n: NOTE.A4, d: 0.5 }, { n: NOTE.A5, d: 0.5 },
            { n: NOTE.Bb4, d: 0.5 }, { n: NOTE.Bb5, d: 0.5 }, { n: 0, d: 1 },
            // Bar 3
            { n: NOTE.F4, d: 0.5 }, { n: NOTE.F5, d: 0.5 }, { n: NOTE.D4, d: 0.5 }, { n: NOTE.D5, d: 0.5 },
            { n: NOTE.Eb5, d: 0.5 }, { n: NOTE.Eb6, d: 0.5 }, { n: 0, d: 1 }
        ],
        bass: [
            // Bar 1
            { n: NOTE.C4, d: 1 }, { n: 0, d: 0.5 }, { n: NOTE.C4, d: 0.5 }, { n: NOTE.C4, d: 1 }, { n: 0, d: 1 },
            // Bar 2
            { n: NOTE.C4, d: 1 }, { n: 0, d: 0.5 }, { n: NOTE.C4, d: 0.5 }, { n: NOTE.C4, d: 1 }, { n: 0, d: 1 },
            // Bar 3
            { n: NOTE.F4, d: 1 }, { n: 0, d: 0.5 }, { n: NOTE.F4, d: 0.5 }, { n: NOTE.F4, d: 1 }, { n: 0, d: 1 }
        ]
    };

    /** Castle theme -- tense, chromatic, 120 BPM */
    musicDefs.castle = {
        bpm: 120,
        melody: [
            // Bar 1 -- tense chromatic
            { n: NOTE.A4, d: 0.5 }, { n: NOTE.A4, d: 0.25 }, { n: NOTE.A4, d: 0.5 },
            { n: NOTE.A4, d: 0.25 }, { n: NOTE.Bb4, d: 0.5 },
            { n: NOTE.A4, d: 0.5 }, { n: NOTE.G4, d: 0.5 }, { n: NOTE.A4, d: 1 },
            // Bar 2
            { n: NOTE.E5, d: 0.5 }, { n: NOTE.E5, d: 0.25 }, { n: NOTE.E5, d: 0.5 },
            { n: NOTE.E5, d: 0.25 }, { n: NOTE.F5, d: 0.5 },
            { n: NOTE.E5, d: 0.5 }, { n: NOTE.D5, d: 0.5 }, { n: NOTE.E5, d: 1 },
            // Bar 3
            { n: NOTE.A5, d: 0.5 }, { n: NOTE.G5, d: 0.5 },
            { n: NOTE.F5, d: 0.5 }, { n: NOTE.E5, d: 0.5 },
            { n: NOTE.D5, d: 0.5 }, { n: NOTE.C5, d: 0.5 },
            { n: NOTE.B4, d: 0.5 }, { n: NOTE.A4, d: 0.5 }
        ],
        bass: [
            // Bar 1
            { n: NOTE.A4, d: 0.5 }, { n: 0, d: 0.25 }, { n: NOTE.A4, d: 0.5 },
            { n: 0, d: 0.25 }, { n: NOTE.A4, d: 0.5 },
            { n: NOTE.A4, d: 0.5 }, { n: NOTE.A4, d: 0.5 }, { n: NOTE.A4, d: 1 },
            // Bar 2
            { n: NOTE.E4, d: 0.5 }, { n: 0, d: 0.25 }, { n: NOTE.E4, d: 0.5 },
            { n: 0, d: 0.25 }, { n: NOTE.E4, d: 0.5 },
            { n: NOTE.E4, d: 0.5 }, { n: NOTE.E4, d: 0.5 }, { n: NOTE.E4, d: 1 },
            // Bar 3
            { n: NOTE.A4, d: 0.5 }, { n: NOTE.A4, d: 0.5 },
            { n: NOTE.D4, d: 0.5 }, { n: NOTE.D4, d: 0.5 },
            { n: NOTE.G4, d: 0.5 }, { n: NOTE.G4, d: 0.5 },
            { n: NOTE.E4, d: 0.5 }, { n: NOTE.A4, d: 0.5 }
        ]
    };

    // Sky uses overworld theme (same happy vibe but slightly higher)
    musicDefs.sky = musicDefs.overworld;

    // ========================================
    // MUSIC PLAYER
    // ========================================

    /**
     * Schedule and play a looping music sequence using 2 oscillators
     * (melody: square, bass: triangle)
     */
    function startMusic(levelType) {
        if (!ctx) return;
        stopMusic();

        var def = musicDefs[levelType] || musicDefs.overworld;
        var baseBPM = def.bpm * musicTempo;
        var beatDur = 60 / baseBPM; // seconds per beat

        // Calculate total duration of melody
        var melodyTotalBeats = 0;
        for (var i = 0; i < def.melody.length; i++) {
            melodyTotalBeats += def.melody[i].d;
        }
        var loopDuration = melodyTotalBeats * beatDur;

        // Schedule function for one iteration
        function scheduleLoop(startTime) {
            // Melody (square wave)
            var melTime = startTime;
            for (var m = 0; m < def.melody.length; m++) {
                var mn = def.melody[m];
                var dur = mn.d * beatDur;
                if (mn.n > 0) {
                    playTone(mn.n, dur * 0.85, 'square', melTime, 0.15, musicGain);
                }
                melTime += dur;
            }

            // Bass (triangle wave)
            var bassTime = startTime;
            for (var b = 0; b < def.bass.length; b++) {
                var bn = def.bass[b];
                var bDur = bn.d * beatDur;
                if (bn.n > 0) {
                    playTone(bn.n * 0.5, bDur * 0.85, 'triangle', bassTime, 0.2, musicGain);
                }
                bassTime += bDur;
            }
        }

        // Schedule first iteration
        var nextStart = ctx.currentTime + 0.05;
        scheduleLoop(nextStart);

        // Set up repeating loop via setInterval
        var intervalMs = loopDuration * 1000;
        var loopCount = 1;
        var intervalId = setInterval(function () {
            if (!ctx || muted) return;
            try {
                var t = ctx.currentTime + 0.05;
                scheduleLoop(t);
                loopCount++;
            } catch (e) {
                console.warn('[AudioManager] Music loop error:', e);
            }
        }, intervalMs);

        currentMusic = {
            type: levelType,
            intervalId: intervalId,
            loopDuration: loopDuration
        };
    }

    function stopMusic() {
        if (currentMusic) {
            clearInterval(currentMusic.intervalId);
            currentMusic = null;
        }
    }

    // ========================================
    // CONTROLS
    // ========================================

    function toggleMute() {
        if (!ctx) return;
        muted = !muted;
        if (muted) {
            previousVolume = masterGain.gain.value;
            masterGain.gain.setValueAtTime(0, ctx.currentTime);
            stopMusic();
        } else {
            masterGain.gain.setValueAtTime(previousVolume, ctx.currentTime);
        }
        return muted;
    }

    function setMusicTempo(multiplier) {
        musicTempo = multiplier || 1.0;
        // If music is currently playing, restart with new tempo
        if (currentMusic) {
            var type = currentMusic.type;
            stopMusic();
            startMusic(type);
        }
    }

    // ========================================
    // VISIBILITY CHANGE -- suspend when tab hidden
    // ========================================
    if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', function () {
            if (!ctx) return;
            if (document.hidden) {
                if (ctx.state === 'running') {
                    ctx.suspend();
                }
            } else {
                if (ctx.state === 'suspended' && !muted) {
                    ctx.resume();
                }
            }
        });
    }

    // ========================================
    // PUBLIC API
    // ========================================
    var api = {
        init: init,
        play: play,
        startMusic: startMusic,
        stopMusic: stopMusic,
        toggleMute: toggleMute,
        setMusicTempo: setMusicTempo,

        /** Read-only muted state */
        get isMuted() {
            return muted;
        }
    };

    return api;
})();

// Attach to window for global access
window.AudioManager = AudioManager;
