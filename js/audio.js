/**
 * DAYCRAFT — PROCEDURAL WEB AUDIO SYNTHESIZER & AMBIENT SOUNDSCAPE
 * Generates continuous ambient noise, soundscape scenes, and sleep timers natively with Web Audio API.
 */

class DayCraftAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isInitialized = false;

    this.tracks = {
      rain: { gainNode: null, noiseNode: null, isPlaying: false, targetVolume: 0 },
      cafe: { gainNode: null, noiseNode: null, isPlaying: false, targetVolume: 0 },
      forest: { gainNode: null, noiseNode: null, isPlaying: false, targetVolume: 0 },
      ocean: { gainNode: null, noiseNode: null, isPlaying: false, targetVolume: 0 },
      binaural: { gainNode: null, leftOsc: null, rightOsc: null, isPlaying: false, targetVolume: 0 }
    };

    // Continuous Playback & Sleep Timer
    this.timerMode = 'continuous'; // 'continuous' or minutes (e.g. 15, 30, 45, 60)
    this.timerSecondsLeft = null;
    this.timerInterval = null;
    this.timerListeners = [];
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.isInitialized = true;
    } catch (e) {
      console.warn("Web Audio API not supported in this environment", e);
    }
  }

  ensureContext() {
    if (!this.isInitialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Create White/Pink Noise Buffer
  createNoiseBuffer(type = 'pink') {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    } else {
      // White noise
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    return buffer;
  }

  // Set individual track volume (0 to 1)
  setTrackVolume(trackName, volume) {
    this.ensureContext();
    if (!this.ctx) return;

    volume = Math.max(0, Math.min(1, volume));
    if (this.tracks[trackName]) {
      this.tracks[trackName].targetVolume = volume;
    }

    if (volume > 0 && !this.tracks[trackName]?.isPlaying) {
      this.startTrack(trackName);
    }

    if (this.tracks[trackName]?.gainNode) {
      this.tracks[trackName].gainNode.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.1);
    }

    if (volume === 0 && this.tracks[trackName]?.isPlaying) {
      setTimeout(() => {
        if (this.tracks[trackName]?.gainNode?.gain.value <= 0.01) {
          this.stopTrack(trackName);
        }
      }, 300);
    }

    this.checkActiveStatus();
  }

  startTrack(trackName) {
    this.ensureContext();
    if (!this.ctx) return;
    if (this.tracks[trackName]?.isPlaying) return;

    const track = this.tracks[trackName];
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    gainNode.connect(this.masterGain);
    track.gainNode = gainNode;

    switch (trackName) {
      case 'rain': {
        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = this.createNoiseBuffer('pink');
        noiseSource.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.ctx.currentTime);

        noiseSource.connect(filter);
        filter.connect(gainNode);
        noiseSource.start();
        track.noiseNode = noiseSource;
        break;
      }

      case 'cafe': {
        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = this.createNoiseBuffer('pink');
        noiseSource.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(650, this.ctx.currentTime);
        filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

        noiseSource.connect(filter);
        filter.connect(gainNode);
        noiseSource.start();
        track.noiseNode = noiseSource;
        break;
      }

      case 'forest': {
        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = this.createNoiseBuffer('pink');
        noiseSource.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1800, this.ctx.currentTime);

        noiseSource.connect(filter);
        filter.connect(gainNode);
        noiseSource.start();
        track.noiseNode = noiseSource;
        break;
      }

      case 'ocean': {
        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = this.createNoiseBuffer('pink');
        noiseSource.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, this.ctx.currentTime);

        // LFO for rhythmic ocean wave swell
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // ~8 sec wave cycle
        lfoGain.gain.setValueAtTime(350, this.ctx.currentTime);
        lfo.connect(filter.frequency);
        lfo.start();

        noiseSource.connect(filter);
        filter.connect(gainNode);
        noiseSource.start();
        track.noiseNode = noiseSource;
        break;
      }

      case 'binaural': {
        // 432Hz Alpha wave generator
        const oscL = this.ctx.createOscillator();
        oscL.type = 'sine';
        oscL.frequency.setValueAtTime(432, this.ctx.currentTime);

        const oscR = this.ctx.createOscillator();
        oscR.type = 'sine';
        oscR.frequency.setValueAtTime(442, this.ctx.currentTime); // 10Hz Alpha differential

        const panL = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
        const panR = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

        if (panL && panR) {
          panL.pan.setValueAtTime(-1, this.ctx.currentTime);
          panR.pan.setValueAtTime(1, this.ctx.currentTime);
          oscL.connect(panL);
          oscR.connect(panR);
          panL.connect(gainNode);
          panR.connect(gainNode);
        } else {
          oscL.connect(gainNode);
          oscR.connect(gainNode);
        }

        oscL.start();
        oscR.start();
        track.leftOsc = oscL;
        track.rightOsc = oscR;
        break;
      }
    }

    track.isPlaying = true;
  }

  stopTrack(trackName) {
    const track = this.tracks[trackName];
    if (!track || !track.isPlaying) return;

    if (track.noiseNode) {
      try { track.noiseNode.stop(); } catch (e) {}
      track.noiseNode = null;
    }
    if (track.leftOsc) {
      try { track.leftOsc.stop(); } catch (e) {}
      track.leftOsc = null;
    }
    if (track.rightOsc) {
      try { track.rightOsc.stop(); } catch (e) {}
      track.rightOsc = null;
    }

    track.isPlaying = false;
  }

  stopAll() {
    Object.keys(this.tracks).forEach(name => this.stopTrack(name));
    this.checkActiveStatus();
  }

  // --- AUDIO SLEEP / CONTINUOUS PLAYBACK TIMER ---
  setAudioTimer(mins) {
    clearInterval(this.timerInterval);
    if (!mins || mins === 'continuous' || mins === 0) {
      this.timerMode = 'continuous';
      this.timerSecondsLeft = null;
      this.notifyTimerListeners("Continuous ∞");
      return;
    }

    const durationMins = parseInt(mins, 10);
    this.timerMode = `${durationMins}m`;
    this.timerSecondsLeft = durationMins * 60;
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      if (this.timerSecondsLeft > 0) {
        this.timerSecondsLeft--;
        this.updateTimerDisplay();
      } else {
        clearInterval(this.timerInterval);
        this.fadeOutAndStop();
      }
    }, 1000);
  }

  updateTimerDisplay() {
    if (this.timerSecondsLeft === null) {
      this.notifyTimerListeners("Continuous ∞");
      return;
    }
    const mins = Math.floor(this.timerSecondsLeft / 60);
    const secs = this.timerSecondsLeft % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    this.notifyTimerListeners(formatted);
  }

  onTimerTick(callback) {
    this.timerListeners.push(callback);
  }

  notifyTimerListeners(text) {
    this.timerListeners.forEach(cb => cb(text, this.timerMode));
  }

  fadeOutAndStop() {
    if (!this.ctx || !this.masterGain) {
      this.stopAll();
      return;
    }
    // Smooth 3-second fade out
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
    this.masterGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 3);

    setTimeout(() => {
      this.stopAll();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.timerMode = 'continuous';
      this.timerSecondsLeft = null;
      this.notifyTimerListeners("Timer Finished");
    }, 3200);
  }

  checkActiveStatus() {
    const isAnyActive = Object.values(this.tracks).some(t => t.isPlaying);
    const indicator = document.getElementById('audioPlayingIndicator');
    if (indicator) {
      indicator.classList.toggle('active', isAnyActive);
    }
  }

  // --- SHORT CHIMES & HAPTIC AUDITORY FEEDBACK ---
  playChime(type = 'success') {
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    if (type === 'success') {
      // Ascending major chord chime (C5 -> E5 -> G5)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);

      gain.gain.setValueAtTime(0.20, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.40);

      osc.start(now);
      osc.stop(now + 0.40);
    } else if (type === 'timer') {
      // Use the full alarm for timer completions
      this.playAlarm();
      osc.disconnect();
      return;
    } else if (type === 'alert') {
      // Friendly soft double ping for breaks
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880.00, now + 0.10); // A5

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'task') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  }

  /**
   * LOUD ALARM — Plays through Web Audio API media channel which bypasses
   * Android/iOS silent/vibrate mode. Uses maximum gain, repeating tones,
   * and heavy vibration pattern to guarantee the user is alerted.
   */
  playAlarm() {
    this.ensureContext();
    if (!this.ctx) return;

    // Stop any previously playing alarm
    this.stopAlarm();

    const now = this.ctx.currentTime;
    const totalDuration = 4.5; // seconds
    const beepCount = 6;
    const beepDuration = 0.35;
    const beepGap = 0.40;

    // Create a dedicated compressor to maximize loudness
    const compressor = this.ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-10, now);
    compressor.knee.setValueAtTime(0, now);
    compressor.ratio.setValueAtTime(20, now);
    compressor.attack.setValueAtTime(0.003, now);
    compressor.release.setValueAtTime(0.05, now);
    compressor.connect(this.ctx.destination);

    // Create a master alarm gain at MAXIMUM volume
    const alarmMasterGain = this.ctx.createGain();
    alarmMasterGain.gain.setValueAtTime(1.0, now);
    alarmMasterGain.connect(compressor);

    this._alarmNodes = [compressor, alarmMasterGain];
    this._alarmOscillators = [];

    for (let i = 0; i < beepCount; i++) {
      const startTime = now + i * beepGap;

      // Primary tone (A5 = 880Hz)
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(880, startTime);
      osc1.frequency.setValueAtTime(1046.5, startTime + beepDuration * 0.5); // C6 rising

      const gain1 = this.ctx.createGain();
      gain1.gain.setValueAtTime(0, startTime);
      gain1.gain.linearRampToValueAtTime(0.6, startTime + 0.02); // Sharp attack
      gain1.gain.setValueAtTime(0.6, startTime + beepDuration - 0.05);
      gain1.gain.linearRampToValueAtTime(0, startTime + beepDuration);

      osc1.connect(gain1);
      gain1.connect(alarmMasterGain);
      osc1.start(startTime);
      osc1.stop(startTime + beepDuration);

      // Harmonic overtone (E6 = 1318Hz)
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.5, startTime);

      const gain2 = this.ctx.createGain();
      gain2.gain.setValueAtTime(0, startTime);
      gain2.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
      gain2.gain.setValueAtTime(0.3, startTime + beepDuration - 0.05);
      gain2.gain.linearRampToValueAtTime(0, startTime + beepDuration);

      osc2.connect(gain2);
      gain2.connect(alarmMasterGain);
      osc2.start(startTime);
      osc2.stop(startTime + beepDuration);

      this._alarmOscillators.push(osc1, osc2);
      this._alarmNodes.push(gain1, gain2);
    }

    // Heavy vibration pattern (works on Android even in silent mode)
    if (navigator.vibrate) {
      navigator.vibrate([
        400, 200, 400, 200, 400, 200, 
        600, 300, 600, 300, 800
      ]);
    }

    // Auto-cleanup after alarm finishes
    this._alarmTimeout = setTimeout(() => {
      this.stopAlarm();
    }, (totalDuration + 0.5) * 1000);
  }

  stopAlarm() {
    if (this._alarmTimeout) {
      clearTimeout(this._alarmTimeout);
      this._alarmTimeout = null;
    }
    if (this._alarmOscillators) {
      this._alarmOscillators.forEach(osc => {
        try { osc.stop(); } catch (e) { /* already stopped */ }
      });
      this._alarmOscillators = null;
    }
    if (this._alarmNodes) {
      this._alarmNodes.forEach(node => {
        try { node.disconnect(); } catch (e) { /* already disconnected */ }
      });
      this._alarmNodes = null;
    }
    if (navigator.vibrate) {
      navigator.vibrate(0); // Stop vibration
    }
  }
}

// Global Audio Engine Instance
window.audioEngine = new DayCraftAudioEngine();
