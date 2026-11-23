// 10 大主城專屬 Web Audio 奇幻音樂引擎 (v71)
const CHAPTER_THEMES = [
  { name: '曙光哨站・民謠魯特琴', tempoMs: 460, wave: 'triangle', filterHz: 1400, notes: [293.66, 369.99, 440.00, 587.33, 440.00, 369.99, 329.63, 440.00], bass: 146.83 },
  { name: '菌菇黑市・神秘水晶鐘琴', tempoMs: 520, wave: 'sine',     filterHz: 2200, notes: [369.99, 440.00, 554.37, 659.25, 554.37, 493.88, 440.00, 329.63], bass: 185.00 },
  { name: '聖骨禮拜堂・莊嚴管風琴', tempoMs: 640, wave: 'sawtooth', filterHz: 750,  notes: [261.63, 311.13, 392.00, 466.16, 392.00, 311.13, 293.66, 261.63], bass: 130.81 },
  { name: '黑曜熔爐・矮人低音銅管', tempoMs: 500, wave: 'sawtooth', filterHz: 620,  notes: [164.81, 196.00, 246.94, 293.66, 246.94, 220.00, 196.00, 164.81], bass: 82.41  },
  { name: '緋紅王庭・巴洛克大鍵琴', tempoMs: 400, wave: 'triangle', filterHz: 1850, notes: [392.00, 466.16, 587.33, 739.99, 587.33, 466.16, 440.00, 392.00], bass: 196.00 },
  { name: '極光冰堡・北歐空靈豎琴', tempoMs: 580, wave: 'sine',     filterHz: 2000, notes: [440.00, 523.25, 659.25, 783.99, 659.25, 587.33, 523.25, 440.00], bass: 110.00 },
  { name: '翠玉水寨・巫毒木琴竹笛', tempoMs: 440, wave: 'triangle', filterHz: 1200, notes: [293.66, 329.63, 349.23, 440.00, 523.25, 440.00, 349.23, 293.66], bass: 146.83 },
  { name: '蒼穹浮空城・奧術天籟', tempoMs: 480, wave: 'sine',     filterHz: 2400, notes: [329.63, 415.30, 493.88, 659.25, 739.99, 659.25, 493.88, 415.30], bass: 164.81 },
  { name: '聖血修道院・憂鬱大提琴', tempoMs: 600, wave: 'triangle', filterHz: 950,  notes: [246.94, 293.66, 369.99, 440.00, 369.99, 329.63, 293.66, 246.94], bass: 123.47 },
  { name: '永恆星辰聖域・星界交響', tempoMs: 540, wave: 'sine',     filterHz: 2100, notes: [277.18, 329.63, 415.30, 554.37, 659.25, 554.37, 415.30, 329.63], bass: 138.59 },
];

export class TownBgmEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.timer = null;
    this.step = 0;
    this.currentCh = -1;
    this.muted = false;
  }

  _ensureCtx() {
    if (this.ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.22;

    // Gentle stereo-like feedback delay for warm room reverb
    const delay = this.ctx.createDelay();
    delay.delayTime.value = 0.28;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.28;
    const wet = this.ctx.createGain();
    wet.gain.value = 0.35;

    this.master.connect(this.ctx.destination);
    this.master.connect(delay);
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(wet);
    wet.connect(this.ctx.destination);
    return true;
  }

  playChapter(chIdx = 0) {
    const idx = Math.max(0, Math.min(9, chIdx));
    if (this.currentCh === idx && this.timer) return;
    this.stop();
    if (!this._ensureCtx()) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.currentCh = idx;
    this.step = 0;
    const theme = CHAPTER_THEMES[idx];

    const tick = () => {
      if (!this.ctx || this.currentCh !== idx) return;
      const now = this.ctx.currentTime;
      const freq = theme.notes[this.step % theme.notes.length];
      this._playTone(freq, theme.wave, theme.filterHz, 0.14, 1.35, now);
      if (this.step % 4 === 0) {
        this._playTone(theme.bass, 'sine', 420, 0.16, 2.1, now);
      }
      this.step++;
    };
    tick();
    this.timer = setInterval(tick, theme.tempoMs);
  }

  _playTone(freq, type, cutoff, peakGain, durSec, startTime) {
    const osc = this.ctx.createOscillator();
    const flt = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    flt.type = 'lowpass';
    flt.frequency.setValueAtTime(cutoff, startTime);

    g.gain.setValueAtTime(0.0001, startTime);
    g.gain.linearRampToValueAtTime(peakGain, startTime + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + durSec);

    osc.connect(flt);
    flt.connect(g);
    g.connect(this.master);
    osc.start(startTime);
    osc.stop(startTime + durSec + 0.05);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.currentCh = -1;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this._ensureCtx()) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.22, this.ctx.currentTime, 0.08);
    }
    return this.muted;
  }
}
