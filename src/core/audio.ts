// All sounds are made with Web Audio at runtime, so the app ships no sound files.

class LabAudio {
  private ctx: AudioContext | null = null;
  private noise: AudioBuffer | null = null;
  private pourGain: GainNode | null = null;
  private fizzGain: GainNode | null = null;
  private pourLevel = 0;
  private fizzLevel = 0;

  /** Browsers only allow audio after a user gesture, so call this from one. */
  unlock() {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        return;
      }
      const len = this.ctx.sampleRate * 2;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.pourGain = this.loop('bandpass', 700, 0.8);
      this.fizzGain = this.loop('highpass', 3500, 0.7);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private loop(type: BiquadFilterType, freq: number, q: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();
    return gain;
  }

  /** Continuous sounds, set every frame: 0 = silent, 1 = full. */
  setPour(level: number) {
    this.pourLevel += (level - this.pourLevel) * 0.2;
    if (this.pourGain) this.pourGain.gain.value = this.pourLevel * 0.18;
  }

  setFizz(level: number) {
    this.fizzLevel += (level - this.fizzLevel) * 0.1;
    if (this.fizzGain) this.fizzGain.gain.value = this.fizzLevel * (0.05 + Math.random() * 0.05);
  }

  private tone(f0: number, f1: number, dur: number, vol: number, type: OscillatorType = 'sine') {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private burst(dur: number, vol: number, type: BiquadFilterType, f0: number, f1: number) {
    const ctx = this.ctx;
    if (!ctx || !this.noise) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(f0, t);
    filter.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter).connect(g).connect(ctx.destination);
    src.start(t, Math.random());
    src.stop(t + dur + 0.02);
  }

  drip() {
    this.tone(1100, 450, 0.09, 0.15);
  }

  clink() {
    this.tone(2600, 2400, 0.12, 0.05, 'triangle');
  }

  click() {
    this.tone(900, 700, 0.04, 0.06, 'square');
  }

  plop() {
    this.tone(500, 180, 0.08, 0.12);
  }

  /** Hydrogen's squeaky pop; louder with more gas. */
  pop(strength: number) {
    const s = Math.min(1, Math.max(0.2, strength));
    this.burst(0.35, 0.9 * s, 'lowpass', 2500, 300);
    this.tone(140, 50, 0.25, 0.6 * s);
    this.tone(1500, 650, 0.14, 0.12 * s, 'sawtooth');
  }

  whoosh() {
    this.burst(0.6, 0.35, 'bandpass', 300, 1800);
  }

  success() {
    this.tone(660, 660, 0.12, 0.08);
    setTimeout(() => this.tone(880, 880, 0.18, 0.08), 110);
  }
}

export const audio = new LabAudio();
