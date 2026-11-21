// Solmar Heat — all sound is synthesized live with WebAudio: no audio files.
// Engine hum, police siren, gunshots, pickup chimes and a sunny bassline loop.
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicTimer = null;
    this.engineOsc = null;
    this.engineGain = null;
    this.sirenOsc = null;
    this.sirenGain = null;
    this.sirenOn = false;
    this.step = 0;
  }
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.startEngine();
      this.startMusic();
    } catch { this.ctx = null; }
  }
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.5;
  }
  startEngine() {
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 55;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 420;
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0.0;
    this.engineOsc.connect(filter).connect(this.engineGain).connect(this.master);
    this.engineOsc.start();
  }
  // speedRatio 0..1, driving true while in a car.
  setEngine(speedRatio, driving) {
    if (!this.engineOsc) return;
    const t = this.ctx.currentTime;
    this.engineOsc.frequency.setTargetAtTime(50 + speedRatio * 150, t, 0.08);
    this.engineGain.gain.setTargetAtTime(driving ? 0.05 + speedRatio * 0.06 : 0.0, t, 0.1);
  }
  setSiren(on) {
    if (!this.ctx) return;
    if (on && !this.sirenOn) {
      this.sirenOn = true;
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenOsc.type = 'triangle';
      this.sirenGain = this.ctx.createGain();
      this.sirenGain.gain.value = 0.045;
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.9;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 320;
      lfo.connect(lfoGain).connect(this.sirenOsc.frequency);
      this.sirenOsc.frequency.value = 950;
      this.sirenOsc.connect(this.sirenGain).connect(this.master);
      this.sirenOsc.start(); lfo.start();
      this.sirenLfo = lfo;
    } else if (!on && this.sirenOn) {
      this.sirenOn = false;
      try { this.sirenOsc.stop(); this.sirenLfo.stop(); } catch { /* already stopped */ }
      this.sirenOsc = null;
    }
  }
  blip(freq, dur, type = 'sine', vol = 0.18) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
  }
  gunshot() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * 0.14);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    src.connect(g).connect(this.master);
    src.start(t);
    this.blip(160, 0.1, 'square', 0.12);
  }
  chime() { this.blip(660, 0.12); setTimeout(() => this.blip(990, 0.2), 110); }
  fail() { this.blip(220, 0.25, 'sawtooth', 0.14); setTimeout(() => this.blip(150, 0.35, 'sawtooth', 0.14), 140); }
  // Sunny bassline + hats: A minor groove, 8 steps, loops every ~1.9 s.
  startMusic() {
    const bass = [110, 0, 110, 130.8, 98, 0, 110, 146.8];
    this.musicTimer = setInterval(() => {
      if (!this.ctx || this.muted) { this.step = (this.step + 1) % 8; return; }
      const f = bass[this.step];
      if (f) this.blip(f, 0.22, 'triangle', 0.11);
      if (this.step % 2 === 0) this.blip(5200, 0.03, 'square', 0.02);
      this.step = (this.step + 1) % 8;
    }, 240);
  }
}
