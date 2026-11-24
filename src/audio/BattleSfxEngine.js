// 暗黑戰鬥與系統 Web Audio 音效合成引擎 (v95)
// 即時讀取 window.__gameSettings.audio（主音量 × SFX 音量 × 靜音開關）
export class BattleSfxEngine {
  constructor() {
    this.ctx = null;
    this._lastHitAt = 0;
  }

  _getGain() {
    const a = window.__gameSettings?.audio;
    if (a?.muted) return 0;
    const master = a?.master ?? 0.85;
    const sfx = a?.sfx ?? 0.85;
    return Math.max(0, Math.min(1, master * sfx)) * 0.32;
  }

  _ensureCtx() {
    const g = this._getGain();
    if (g <= 0.001) return null;
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return { ctx: this.ctx, gain: g };
  }

  _tone(freqStart, freqEnd, type, dur, volMult = 1, delay = 0) {
    const env = this._ensureCtx();
    if (!env) return;
    const { ctx, gain } = env;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(40, freqStart), t0);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), t0 + dur);
    }
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gain * volMult, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  playHit(style = 'melee') {
    const now = performance.now();
    if (now - this._lastHitAt < 70) return;
    this._lastHitAt = now;
    if (style === 'ranged') {
      this._tone(680, 240, 'triangle', 0.08, 0.45);
    } else if (style === 'magic') {
      this._tone(520, 880, 'sine', 0.11, 0.45);
    } else {
      this._tone(190, 75, 'sawtooth', 0.09, 0.42);
    }
  }

  playCrit() {
    this._tone(160, 55, 'sawtooth', 0.14, 0.72);
    this._tone(880, 440, 'triangle', 0.16, 0.55, 0.02);
  }

  playHeroHurt() {
    this._tone(140, 62, 'sawtooth', 0.15, 0.55);
  }

  playLootDrop(rarity = 'common', isPet = false) {
    if (isPet) {
      this._tone(659.25, 987.77, 'sine', 0.22, 0.75);
      this._tone(1318.5, 1318.5, 'triangle', 0.32, 0.65, 0.09);
      return;
    }
    if (rarity === 'legendary' || rarity === 'set') {
      // 經典暗黑傳奇／綠裝神聖鐘鳴
      this._tone(587.33, 587.33, 'triangle', 0.48, 0.85);
      this._tone(880.0, 880.0, 'sine', 0.56, 0.75, 0.06);
      this._tone(1174.66, 1174.66, 'sine', 0.65, 0.65, 0.13);
    } else if (rarity === 'rare') {
      this._tone(523.25, 659.25, 'triangle', 0.22, 0.52);
    } else {
      this._tone(420, 340, 'sine', 0.09, 0.3);
    }
  }

  playPickup() {
    this._tone(620, 930, 'sine', 0.09, 0.45);
  }

  playLevelUp() {
    const notes = [392.0, 493.88, 587.33, 783.99];
    notes.forEach((n, i) => this._tone(n, n, 'triangle', 0.35, 0.75, i * 0.08));
  }

  playEnhance(ok) {
    if (ok) {
      this._tone(523.25, 1046.5, 'triangle', 0.28, 0.8);
      this._tone(1567.98, 1567.98, 'sine', 0.38, 0.65, 0.09);
    } else {
      this._tone(210, 95, 'sawtooth', 0.26, 0.68);
      this._tone(150, 72, 'square', 0.24, 0.5, 0.08);
    }
  }

  playShopBuy() {
    this._tone(783.99, 1046.5, 'sine', 0.14, 0.6);
    this._tone(1318.5, 1318.5, 'sine', 0.2, 0.5, 0.07);
  }

  playBossAlert() {
    this._tone(110, 82.41, 'sawtooth', 0.65, 0.8);
    this._tone(164.81, 123.47, 'triangle', 0.65, 0.65, 0.08);
  }

  playPerfectDodge() {
    this._tone(520, 1240, 'sine', 0.16, 0.7);
    this._tone(1046.5, 1567.98, 'triangle', 0.22, 0.55, 0.05);
  }
}
