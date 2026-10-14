'use strict';
/* Portaaljacht – geluid, volledig met WebAudio gemaakt (geen bestanden nodig) */

const SND = {
  ctx: null, master: null, sfx: null, music: null, noise: null,
  muted: false, musicMode: 'none', nextNote: 0, step: 0, lastNote: 4,
  hum: null, ambient: null,

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { this.ctx = new AC(); } catch (e) { this.ctx = null; return; }
    const c = this.ctx;
    this.master = c.createGain();
    this.master.gain.value = this.muted ? 0 : 0.8;
    this.master.connect(c.destination);
    this.sfx = c.createGain(); this.sfx.gain.value = 1; this.sfx.connect(this.master);
    this.music = c.createGain(); this.music.gain.value = 0.45; this.music.connect(this.master);
    const len = c.sampleRate;
    this.noise = c.createBuffer(1, len, c.sampleRate);
    const ch = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    // iOS: een stil geluidje ontgrendelt de audio
    const src = c.createBufferSource();
    src.buffer = c.createBuffer(1, 1, 22050);
    src.connect(c.destination);
    src.start(0);
    if (c.state === 'suspended') c.resume();
    this.startDrones();
  },

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.05);
  },

  tone(o) {
    const c = this.ctx;
    const t = c.currentTime + (o.t || 0);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(o.f0, t);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur);
    const a = o.a || 0.005;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.vol), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    let node = osc;
    if (o.lp) {
      const f = c.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = o.lp;
      osc.connect(f); node = f;
    }
    if (o.vib) {
      const lfo = c.createOscillator(), lg = c.createGain();
      lfo.frequency.value = o.vib; lg.gain.value = o.vibAmt || 20;
      lfo.connect(lg); lg.connect(osc.frequency);
      lfo.start(t); lfo.stop(t + o.dur + 0.05);
    }
    node.connect(g);
    g.connect(o.dest || this.sfx);
    osc.start(t);
    osc.stop(t + o.dur + 0.05);
  },

  noiseBurst(o) {
    const c = this.ctx;
    const t = c.currentTime + (o.t || 0);
    const src = c.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    src.playbackRate.value = o.rate || 1;
    const f = c.createBiquadFilter();
    f.type = o.filter || 'lowpass';
    f.frequency.setValueAtTime(o.f0 || 1000, t);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur);
    f.Q.value = o.q || 0.8;
    const g = c.createGain();
    const a = o.a || 0.004;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.vol), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    src.connect(f); f.connect(g); g.connect(o.dest || this.sfx);
    src.start(t, Math.random() * 0.5);
    src.stop(t + o.dur + 0.05);
  },

  // Geluid afspelen; opts.at = positie in de wereld (zachter op afstand)
  play(name, opts) {
    if (!this.ctx || this.muted) return;
    opts = opts || {};
    let v = opts.vol === undefined ? 1 : opts.vol;
    if (opts.at && typeof player !== 'undefined') {
      const dx = opts.at.x - player.pos.x, dy = opts.at.y - player.pos.y, dz = opts.at.z - player.pos.z;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      v *= clamp(1 - d / (opts.range || 24), 0, 1);
      if (v < 0.02) return;
    }
    switch (name) {
      case 'step':
        this.noiseBurst({ dur: 0.09, vol: 0.09 * v, filter: opts.kind === 'stone' ? 'bandpass' : 'lowpass', f0: opts.kind === 'stone' ? 1400 : 700, f1: 300, q: 1.2 });
        break;
      case 'break':
        this.noiseBurst({ dur: 0.2, vol: 0.32 * v, f0: 1600, f1: 300 });
        this.tone({ type: 'square', f0: 140, f1: 60, dur: 0.09, vol: 0.06 * v });
        break;
      case 'dig':
        this.noiseBurst({ dur: 0.07, vol: 0.12 * v, f0: 1000, f1: 400 });
        break;
      case 'place':
        this.noiseBurst({ dur: 0.1, vol: 0.28 * v, f0: 900, f1: 200 });
        this.tone({ type: 'sine', f0: 190, f1: 90, dur: 0.09, vol: 0.14 * v });
        break;
      case 'swing':
        this.noiseBurst({ dur: 0.13, vol: 0.1 * v, filter: 'bandpass', f0: 2200, f1: 700, q: 0.7 });
        break;
      case 'hit':
        this.noiseBurst({ dur: 0.1, vol: 0.38 * v, f0: 900, f1: 200 });
        this.tone({ type: 'triangle', f0: 210, f1: 80, dur: 0.12, vol: 0.28 * v });
        break;
      case 'crit':
        this.tone({ type: 'square', f0: 900, f1: 1500, dur: 0.09, vol: 0.06 * v });
        this.tone({ type: 'square', f0: 1300, f1: 2000, dur: 0.08, vol: 0.04 * v, t: 0.05 });
        break;
      case 'hurt':
        this.tone({ type: 'triangle', f0: 300, f1: 170, dur: 0.2, vol: 0.32 * v, lp: 1400 });
        this.tone({ type: 'square', f0: 260, f1: 150, dur: 0.16, vol: 0.06 * v });
        break;
      case 'bossHurt':
        this.tone({ type: 'sawtooth', f0: 120, f1: 58, dur: 0.32, vol: 0.22 * v, lp: 900 });
        this.noiseBurst({ dur: 0.18, vol: 0.2 * v, f0: 700, f1: 200 });
        break;
      case 'roar':
        this.tone({ type: 'sawtooth', f0: 82, f1: 48, dur: 1.5, vol: 0.32 * v, lp: 700, vib: 9, vibAmt: 9, a: 0.08 });
        this.tone({ type: 'square', f0: 150, f1: 70, dur: 1.2, vol: 0.06 * v, lp: 600, a: 0.1 });
        this.noiseBurst({ dur: 1.3, vol: 0.22 * v, f0: 500, f1: 150, a: 0.1 });
        break;
      case 'shoot':
        this.noiseBurst({ dur: 0.4, vol: 0.25 * v, filter: 'bandpass', f0: 500, f1: 2400, q: 1.5 });
        this.tone({ type: 'sawtooth', f0: 260, f1: 700, dur: 0.3, vol: 0.06 * v, lp: 1500 });
        break;
      case 'explode':
        this.noiseBurst({ dur: 0.9, vol: 0.55 * v, f0: 1400, f1: 90 });
        this.tone({ type: 'sine', f0: 90, f1: 30, dur: 0.7, vol: 0.5 * v });
        break;
      case 'slam':
        this.tone({ type: 'sine', f0: 70, f1: 28, dur: 0.6, vol: 0.7 * v });
        this.noiseBurst({ dur: 0.45, vol: 0.45 * v, f0: 500, f1: 80 });
        break;
      case 'deflect':
        this.tone({ type: 'square', f0: 600, f1: 1400, dur: 0.14, vol: 0.1 * v });
        this.noiseBurst({ dur: 0.15, vol: 0.25 * v, filter: 'highpass', f0: 1500 });
        break;
      case 'portal':
        this.noiseBurst({ dur: 2.2, vol: 0.18 * v, filter: 'bandpass', f0: 200, f1: 2600, q: 3, a: 0.4 });
        this.tone({ type: 'sawtooth', f0: 70, f1: 340, dur: 2.2, vol: 0.08 * v, lp: 1200, vib: 6, vibAmt: 15, a: 0.4 });
        break;
      case 'whoosh':
        this.noiseBurst({ dur: 0.8, vol: 0.3 * v, filter: 'bandpass', f0: 2500, f1: 200, q: 2 });
        break;
      case 'pop':
        this.tone({ type: 'square', f0: 820, f1: 620, dur: 0.05, vol: 0.08 * v });
        break;
      case 'click':
        this.tone({ type: 'square', f0: 1000, f1: 800, dur: 0.04, vol: 0.06 * v });
        break;
      case 'oink':
        this.tone({ type: 'square', f0: 420, f1: 300, dur: 0.14, vol: 0.06 * v, lp: 1600, vib: 30, vibAmt: 40 });
        this.tone({ type: 'square', f0: 380, f1: 280, dur: 0.12, vol: 0.05 * v, lp: 1600, vib: 30, vibAmt: 40, t: 0.18 });
        break;
      case 'baa':
        this.tone({ type: 'sawtooth', f0: 430, f1: 380, dur: 0.5, vol: 0.06 * v, lp: 1800, vib: 22, vibAmt: 30, a: 0.03 });
        break;
      case 'moo':
        this.tone({ type: 'sawtooth', f0: 150, f1: 105, dur: 0.9, vol: 0.12 * v, lp: 700, a: 0.08 });
        break;
      case 'splash':
        this.noiseBurst({ dur: 0.4, vol: 0.25 * v, f0: 2500, f1: 400 });
        break;
      case 'fizz':
        this.noiseBurst({ dur: 0.35, vol: 0.2 * v, filter: 'highpass', f0: 3000 });
        break;
      case 'lavapop':
        this.tone({ type: 'sine', f0: 300, f1: 90, dur: 0.12, vol: 0.12 * v });
        break;
      case 'death':
        this.tone({ type: 'square', f0: 400, f1: 80, dur: 0.9, vol: 0.12 * v, lp: 1500 });
        break;
      case 'victory': {
        const notes = [523.3, 659.3, 784, 1046.5, 784, 1046.5, 1318.5];
        notes.forEach((f, i) => this.tone({ type: 'square', f0: f, dur: i === notes.length - 1 ? 1.0 : 0.16, vol: 0.09 * v, t: i * 0.13, lp: 3000 }));
        notes.forEach((f, i) => this.tone({ type: 'triangle', f0: f / 2, dur: 0.2, vol: 0.12 * v, t: i * 0.13 }));
        break;
      }
      case 'bow':
        this.noiseBurst({ dur: 0.18, vol: 0.2 * v, filter: 'bandpass', f0: 1800, f1: 500, q: 1.4 });
        this.tone({ type: 'triangle', f0: 220, f1: 110, dur: 0.12, vol: 0.12 * v });
        break;
      case 'eat':
        for (let i = 0; i < 4; i++) this.noiseBurst({ dur: 0.07, vol: 0.18 * v, f0: 1400, f1: 500, t: i * 0.13 });
        this.tone({ type: 'triangle', f0: 523.3, f1: 784, dur: 0.2, vol: 0.06 * v, t: 0.55 });
        break;
      case 'hmm':
        this.tone({ type: 'sawtooth', f0: 210, f1: 170, dur: 0.35, vol: 0.06 * v, lp: 900, vib: 7, vibAmt: 8, a: 0.03 });
        this.tone({ type: 'sawtooth', f0: 190, f1: 230, dur: 0.25, vol: 0.05 * v, lp: 900, t: 0.32 });
        break;
      case 'freeze':
        this.noiseBurst({ dur: 0.5, vol: 0.25 * v, filter: 'highpass', f0: 2500 });
        this.tone({ type: 'sine', f0: 1800, f1: 2600, dur: 0.4, vol: 0.05 * v });
        break;
      case 'shatter':
        for (let i = 0; i < 3; i++) this.tone({ type: 'square', f0: 2000 + Math.random() * 1500, f1: 900, dur: 0.08, vol: 0.04 * v, t: i * 0.04 });
        this.noiseBurst({ dur: 0.25, vol: 0.25 * v, filter: 'highpass', f0: 2000 });
        break;
      case 'zap':
        this.noiseBurst({ dur: 0.6, vol: 0.5 * v, filter: 'highpass', f0: 600, f1: 3000 });
        this.tone({ type: 'sawtooth', f0: 90, f1: 40, dur: 0.6, vol: 0.3 * v });
        break;
      case 'teleport':
        this.tone({ type: 'sine', f0: 300, f1: 1200, dur: 0.25, vol: 0.12 * v });
        this.tone({ type: 'sine', f0: 1100, f1: 250, dur: 0.3, vol: 0.1 * v, t: 0.15 });
        break;
      case 'wind':
        this.noiseBurst({ dur: 1.4, vol: 0.25 * v, filter: 'bandpass', f0: 400, f1: 1200, q: 0.8, a: 0.3 });
        break;
      case 'coin':
        this.tone({ type: 'square', f0: 988, dur: 0.07, vol: 0.06 * v });
        this.tone({ type: 'square', f0: 1319, dur: 0.18, vol: 0.06 * v, t: 0.07 });
        break;
      case 'levelup':
        [392, 523.3, 659.3, 784].forEach((f, i) => this.tone({ type: 'triangle', f0: f, dur: 0.25, vol: 0.12 * v, t: i * 0.09 }));
        break;
      default: break;
    }
  },

  // Doorlopende achtergrondgeluiden: portaalgezoem en lavageborrel
  startDrones() {
    const c = this.ctx;
    const mk = (type, freq, lp) => {
      const o = c.createOscillator(); o.type = type; o.frequency.value = freq;
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp;
      o.connect(f); o.start();
      return f;
    };
    this.hum = c.createGain(); this.hum.gain.value = 0; this.hum.connect(this.sfx);
    mk('sawtooth', 55, 380).connect(this.hum);
    mk('sawtooth', 58.5, 380).connect(this.hum);
    mk('triangle', 220, 900).connect(this.hum);

    this.ambient = c.createGain(); this.ambient.gain.value = 0; this.ambient.connect(this.sfx);
    const src = c.createBufferSource(); src.buffer = this.noise; src.loop = true;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260;
    src.connect(f); f.connect(this.ambient); src.start();
  },

  // het hoofdvolume regelt al het dempen
  setHum(v) {
    if (this.hum) this.hum.gain.setTargetAtTime(v * 0.16, this.ctx.currentTime, 0.2);
  },
  setAmbient(v) {
    if (this.ambient) this.ambient.gain.setTargetAtTime(v * 0.25, this.ctx.currentTime, 0.3);
  },

  setMusic(mode, variant) {
    this.musicMode = mode;
    this.variant = variant || 0;
    this.step = 0;
    if (this.ctx) this.nextNote = this.ctx.currentTime + (mode === 'calm' ? 2 : 0.3);
  },

  note(f, t, dur, vol, type) {
    const c = this.ctx;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'triangle';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.music);
    o.start(t); o.stop(t + dur + 0.05);
  },

  // Rustige pianomuziek in de bovenwereld, spannende baslijn bij het monster
  updateMusic() {
    if (!this.ctx || this.muted || this.musicMode === 'none') return;
    const c = this.ctx;
    if (this.nextNote < c.currentTime - 1) this.nextNote = c.currentTime + 0.1;
    while (this.nextNote < c.currentTime + 0.4) {
      const t = this.nextNote;
      if (this.musicMode === 'calm') {
        const scale = [196, 220, 261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3];
        this.lastNote = clamp(this.lastNote + Math.floor(Math.random() * 5) - 2, 0, scale.length - 1);
        const f = scale[this.lastNote];
        this.note(f, t, 2.6, 0.07, 'triangle');
        this.note(f * 2, t, 1.4, 0.015, 'sine');
        if (Math.random() < 0.25) this.note(scale[Math.max(0, this.lastNote - 2)] / 2, t, 3.2, 0.05, 'sine');
        this.nextNote += Math.random() < 0.12 ? 3 + Math.random() * 4 : 0.55 + Math.random() * 0.9;
      } else if (this.musicMode === 'boss') {
        const bass = [110, 110, 130.8, 110, 98, 110, 82.4, 98];
        const s = this.step % 8;
        const bar = Math.floor(this.step / 8) % 4;
        const keys = [1, 0.84, 0.75, 1.12];
        const shift = (bar === 3 ? 0.89 : 1) * keys[(this.variant || 0) % 4];
        this.note(bass[s] * shift, t, 0.18, 0.11, 'sawtooth');
        if (s % 2 === 0) {
          const o = c.createOscillator(), g = c.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
          g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
          o.connect(g); g.connect(this.music); o.start(t); o.stop(t + 0.16);
        }
        if (bar % 2 === 1 && (s === 0 || s === 3 || s === 6)) {
          const lead = [440, 523.3, 659.3, 587.3];
          this.note(lead[(s + bar) % 4] * shift, t, 0.22, 0.035, 'square');
        }
        this.step++;
        this.nextNote += [0.19, 0.18, 0.21, 0.16][(this.variant || 0) % 4];
      }
    }
  },
};
