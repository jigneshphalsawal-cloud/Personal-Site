/**
 * Audio Lab - Synthesizer and Recorder
 */

(function (global) {
    'use strict';

    const AudioLab = {
        ctx: null,
        masterGain: null,
        filter: null,
        analyser: null,
        oscillator: null,
        isPlaying: false,

        // Volume defaults (kept in sync with UI sliders)
        synthVolume: 0.25,
        musicVolume: 0.9,

        // Polyphonic voices (multiple notes at once)
        voices: new Map(), // key -> { osc, gain, padEl }
        maxVoices: 12,

        // Media Recorder
        mediaRecorder: null,
        recordedChunks: [],
        isRecording: false,
        destNode: null,

        // External audio sources routed into the same filter/recorder
        externalSources: new Map(), // audioEl -> { sourceNode, gainNode }
        externalDefaultVolume: 0.9,

        ensureExternalSource(audioEl, { volume } = {}) {
            if (!audioEl) return null;

            if (this.externalSources.has(audioEl)) {
                const existing = this.externalSources.get(audioEl);
                if (existing && existing.gainNode && typeof volume === 'number') {
                    existing.gainNode.gain.value = volume;
                }
                return existing;
            }

            this.ensureContext();

            const sourceNode = this.ctx.createMediaElementSource(audioEl);
            const gainNode = this.ctx.createGain();
            gainNode.gain.value = typeof volume === 'number' ? volume : this.externalDefaultVolume;

            sourceNode.connect(gainNode);
            gainNode.connect(this.filter);

            const sourceData = { sourceNode, gainNode };
            this.externalSources.set(audioEl, sourceData);
            return sourceData;
        },

        playExternalSong(audioEl) {
            this.ensureExternalSource(audioEl);
            this.ensureContext();

            try {
                const p = audioEl.play();
                // Avoid unhandled promise rejections.
                if (p && typeof p.catch === 'function') p.catch(() => {});
                return p;
            } catch (_) {
                // Some browsers throw synchronously if playback is blocked.
                return null;
            }
        },

        stopExternalSong(audioEl) {
            if (!audioEl) return;
            try {
                audioEl.pause();
            } catch (_) {
                // Ignore
            }
        },

        init() {
            this.canvasEl = document.getElementById('vizCanvas');
            this.btnPlay = document.getElementById('btnPlaySynth');
            this.btnRecord = document.getElementById('btnToggleRecord');
            this.downloadLink = document.getElementById('recordDownloadLink');
            this.waveSelect = document.getElementById('waveSelect');
            this.freqSlider = document.getElementById('freqSlider');
            this.freqVal = document.getElementById('freqVal');
            this.filterSlider = document.getElementById('filterSlider');
            this.filterVal = document.getElementById('filterVal');
            this.beatPads = document.querySelectorAll('.beat-pad');

            this.bindEvents();
        },

        ensureContext() {
            if (!this.ctx) {
                const AudioContextCtor = window.AudioContext || window['webkitAudioContext'];
                if (!AudioContextCtor) throw new Error('AudioContext is not supported in this browser');
                this.ctx = new AudioContextCtor();
                this.analyser = this.ctx.createAnalyser();
                this.analyser.fftSize = 512;
                this.analyser.smoothingTimeConstant = 0.85;

                // Master Filter
                this.filter = this.ctx.createBiquadFilter();
                this.filter.type = 'lowpass';
                this.filter.frequency.value = parseFloat(this.filterSlider?.value || 1200);

                // Master Gain
                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.value = 0.25;

                // Stream destination for recording
                this.destNode = this.ctx.createMediaStreamDestination();

                // Routing
                this.filter.connect(this.masterGain);
                this.masterGain.connect(this.analyser);
                this.analyser.connect(this.ctx.destination);
                this.masterGain.connect(this.destNode);

                // Initialize Visualizer with the Analyser
                if (global.AudioLabViz && this.canvasEl) {
                    global.AudioLabViz.init(this.canvasEl, this.analyser);
                }

                // Resume context for iOS compatibility (requires user gesture)
                this.ctx.resume().catch(() => {
                    // If resume fails, it will be triggered by user interaction later
                    console.debug('AudioContext resumed on user gesture');
                });
            }

            if (this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {
                    // Silent fail for Safari/iOS edge cases
                });
            }
        },

        bindEvents() {
            // Volume controls
            const synthVolumeSlider = document.getElementById('synthVolume');
            const musicVolumeSlider = document.getElementById('musicVolume');

            if (synthVolumeSlider) {
                synthVolumeSlider.addEventListener('input', (e) => {
                    const val = parseFloat(e.target.value);
                    if (this.masterGain) {
                        this.masterGain.gain.value = val;
                    }
                });
            }

            if (musicVolumeSlider) {
                musicVolumeSlider.addEventListener('input', (e) => {
                    const val = parseFloat(e.target.value);
                    // Update all external source gain nodes
                    this.externalSources.forEach((source) => {
                        if (source.gainNode) {
                            source.gainNode.gain.value = val;
                        }
                    });
                });
            }

            if (this.btnPlay) {
                this.btnPlay.addEventListener('click', () => this.toggleSynth());
            }

            if (this.freqSlider) {
                this.freqSlider.addEventListener('input', (e) => {
                    const val = parseFloat(e.target.value);
                    if (this.freqVal) this.freqVal.textContent = val;
                    if (this.oscillator) {
                        this.oscillator.frequency.setTargetAtTime(val, this.ctx.currentTime, 0.05);
                    }
                });
            }

            if (this.filterSlider) {
                this.filterSlider.addEventListener('input', (e) => {
                    const val = parseFloat(e.target.value);
                    if (this.filterVal) this.filterVal.textContent = val;
                    if (this.filter) {
                        this.filter.frequency.setTargetAtTime(val, this.ctx.currentTime, 0.05);
                    }
                });
            }

            if (this.waveSelect) {
                this.waveSelect.addEventListener('change', (e) => {
                    if (this.oscillator) {
                        this.oscillator.type = e.target.value;
                    }
                });
            }

            // Beat Pads (Mouse & Touch) — polyphonic (pointer capture)
            this.beatPads.forEach(pad => {
                const freq = parseFloat(pad.dataset.note || 220);
                const padKey = pad; // Map key

                const start = (e) => {
                    e.preventDefault();
                    this.startVoice(freq, padKey, pad);
                    try {
                        if (e.pointerId != null && e.currentTarget?.setPointerCapture) {
                            e.currentTarget.setPointerCapture(e.pointerId);
                        }
                    } catch (_) {
                        // Ignore pointer capture failures.
                    }
                };

                const stop = (e) => {
                    e.preventDefault();
                    this.stopVoice(padKey);
                };

                pad.addEventListener('pointerdown', start);
                pad.addEventListener('pointerup', stop);
                pad.addEventListener('pointercancel', stop);
                pad.addEventListener('pointerleave', (e) => {
                    // If user drags away with no buttons pressed, release the note.
                    if (!e.buttons) this.stopVoice(padKey);
                });
            });

            // Keyboard Shortcuts (1-8 and Spacebar)
            // - Keydown starts a voice
            // - Keyup releases it
            window.addEventListener('keydown', (e) => {
                // If user is typing in terminal or command palette, ignore
                if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
                if (e.repeat) return;

                const key = e.key;
                const padIndex = parseInt(key, 10) - 1;
                if (padIndex >= 0 && padIndex < this.beatPads.length) {
                    const pad = this.beatPads[padIndex];
                    const freq = parseFloat(pad.dataset.note);
                    const voiceKey = `kbd-${padIndex}`;
                    this.startVoice(freq, voiceKey, pad);
                }

                if (e.code === 'Space') {
                    // Check if audio lab is currently in view
                    const rect = document.getElementById('audio-lab')?.getBoundingClientRect();
                    if (rect && rect.top < window.innerHeight && rect.bottom > 0) {
                        e.preventDefault();
                        this.toggleSynth();
                    }
                }
            });

            window.addEventListener('keyup', (e) => {
                if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

                const key = e.key;
                const padIndex = parseInt(key, 10) - 1;
                if (padIndex >= 0 && padIndex < this.beatPads.length) {
                    const voiceKey = `kbd-${padIndex}`;
                    this.stopVoice(voiceKey);
                }
            });

            // Recording
            if (this.btnRecord) {
                this.btnRecord.addEventListener('click', () => this.toggleRecord());
            }
        },

        toggleSynth() {
            this.ensureContext();

            if (this.isPlaying) {
                this.stopContinuousSynth();
                this.btnPlay.innerHTML = '<i class="fas fa-play"></i> Start Synth';
                this.btnPlay.classList.remove('active');
                this.isPlaying = false;
            } else {
                this.startContinuousSynth();
                this.btnPlay.innerHTML = '<i class="fas fa-pause"></i> Pause Synth';
                this.btnPlay.classList.add('active');
                this.isPlaying = true;
            }
        },

        startContinuousSynth() {
            this.stopContinuousSynth();

            const osc = this.ctx.createOscillator();
            osc.type = this.waveSelect?.value || 'sawtooth';
            osc.frequency.setValueAtTime(parseFloat(this.freqSlider?.value || 220), this.ctx.currentTime);

            osc.connect(this.filter);
            osc.start();
            this.oscillator = osc;
        },

        stopContinuousSynth() {
            if (this.oscillator) {
                try {
                    this.oscillator.stop();
                    this.oscillator.disconnect();
                } catch (e) {
                    // Ignore
                }
                this.oscillator = null;
            }
        },

        startVoice(frequency, voiceKey, padEl) {
            this.ensureContext();

            if (this.voices.has(voiceKey)) {
                this.stopVoice(voiceKey);
            }

            // Simple voice limit to avoid runaway.
            while (this.voices.size >= this.maxVoices) {
                const oldestKey = this.voices.keys().next().value;
                this.stopVoice(oldestKey);
            }

            const osc = this.ctx.createOscillator();
            const noteGain = this.ctx.createGain();

            osc.type = this.waveSelect?.value || 'sawtooth';
            osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

            const now = this.ctx.currentTime;
            const attack = 0.02;

            // Gate-style envelope: start -> sustain until stopVoice()
            noteGain.gain.cancelScheduledValues(now);
            noteGain.gain.setValueAtTime(0.0001, now);
            noteGain.gain.linearRampToValueAtTime(0.42, now + attack);

            osc.connect(noteGain);
            noteGain.connect(this.filter);

            osc.start(now);

            if (padEl) {
                padEl.classList.add('active');
            }

            this.voices.set(voiceKey, {
                osc,
                gain: noteGain,
                padEl
            });
        },

        stopVoice(voiceKey) {
            const v = this.voices.get(voiceKey);
            if (!v) return;

            const now = this.ctx.currentTime;
            const release = 0.15;
            const min = 0.0001;

            try {
                v.gain.gain.cancelScheduledValues(now);
                v.gain.gain.setValueAtTime(Math.max(v.gain.gain.value || min, min), now);
                v.gain.gain.exponentialRampToValueAtTime(min, now + release);
            } catch (_) {
                // Ignore envelope errors.
            }

            const stopAt = now + release + 0.03;
            try {
                v.osc.stop(stopAt);
            } catch (_) {
                // Ignore stop errors.
            }

            // Cleanup after end.
            try {
                v.osc.onended = () => {
                    try { v.osc.disconnect(); } catch (_) {}
                    try { v.gain.disconnect(); } catch (_) {}
                };
            } catch (_) {
                // Ignore onended assignment errors.
            }

            this.voices.delete(voiceKey);

            if (v.padEl) {
                v.padEl.classList.remove('active');
            }
        },

        toggleRecord() {
            this.ensureContext();

            if (!this.isRecording) {
                this.startRecording();
            } else {
                this.stopRecording();
            }
        },

        startRecording() {
            this.recordedChunks = [];

            // Combine Canvas stream and Audio stream
            const canvasStream = this.canvasEl.captureStream(30);
            const audioStream = this.destNode.stream;

            const combinedStream = new MediaStream([
                ...canvasStream.getVideoTracks(),
                ...audioStream.getAudioTracks()
            ]);

            try {
                this.mediaRecorder = new MediaRecorder(combinedStream, {
                    mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
                        ? 'video/webm;codecs=vp9,opus'
                        : 'video/webm'
                });
            } catch (e) {
                console.warn('Recording fallback to default mimeType');
                this.mediaRecorder = new MediaRecorder(combinedStream);
            }

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    this.recordedChunks.push(e.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                if (this.downloadLink) {
                    this.downloadLink.href = url;
                    this.downloadLink.style.display = 'inline-flex';
                }
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            this.btnRecord.classList.add('recording');
            this.btnRecord.innerHTML = '<i class="fas fa-stop"></i> <span>Stop Rec</span>';
        },

        stopRecording() {
            if (this.mediaRecorder && this.isRecording) {
                this.mediaRecorder.stop();
                this.isRecording = false;
                this.btnRecord.classList.remove('recording');
                this.btnRecord.innerHTML = '<i class="fas fa-circle"></i> <span>Start Rec</span>';
            }
        }
    };

    global.AudioLab = AudioLab;

    document.addEventListener('DOMContentLoaded', () => {
        AudioLab.init();
    });
})(window);
