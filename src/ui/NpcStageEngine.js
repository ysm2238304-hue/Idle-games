/**
 * NpcStageEngine.js (v101 - Batch 2)
 * 60 FPS Canvas 動態 NPC 舞台引擎（全 10 章節視覺深化版）：
 * - 23 套專屬動作曲線 (MOTION_PROFILES)
 * - 10 套章節專屬背景特效（極光波紋、電弧閃電、聖光柱、星象儀軌道、岩漿脈動、孢子螢火等）
 * - 支援現有圖集精靈 (atlas_town_npc_chX) 與特效貼圖 (assets/fx/*.png)
 * - 按鈕點擊即時觸發動作反饋與特效爆發 (triggerActionBurst)
 */

const FX_ASSETS = {
  sigil: './assets/fx/fx_sigil.png',
  starSigil: './assets/fx/mfx_star_sigil.png',
  crit: './assets/fx/fx_crit.png',
  explosion: './assets/fx/fx_explosion.png',
  orb: './assets/fx/mfx_orb.png',
  slash: './assets/fx/afx_slash.png',
  aegis: './assets/fx/pfx_aegis.png',
  voidCore: './assets/fx/mfx_void_core.png',
  frostRing: './assets/fx/mfx_frost_ring.png',
  poisonBurst: './assets/fx/rfx_poison_burst.png',
  lightning: './assets/fx/fx_lightning.png',
  heaven: './assets/fx/pfx_heaven.png',
};

const CHAPTER_ATMOSPHERE = {
  1: {
    name: '曙光哨站堡壘',
    bgTop: '#1d140c',
    bgMid: '#2a1a0e',
    bgBot: '#120b06',
    glow: 'rgba(251, 191, 36, 0.34)',
    accent: '#fbbf24',
    particleType: 'embers',
    specialBg: 'torch',
    particleColors: ['#fbbf24', '#f97316', '#fde68a'],
  },
  2: {
    name: '地下菌菇黑市',
    bgTop: '#110a1e',
    bgMid: '#1f1236',
    bgBot: '#090512',
    glow: 'rgba(168, 85, 247, 0.34)',
    accent: '#a855f7',
    particleType: 'spores',
    specialBg: 'cavern',
    particleColors: ['#a855f7', '#c084fc', '#2dd4bf'],
  },
  3: {
    name: '守夜人聖骨禮拜堂',
    bgTop: '#08121e',
    bgMid: '#102238',
    bgBot: '#050b12',
    glow: 'rgba(56, 189, 248, 0.32)',
    accent: '#38bdf8',
    particleType: 'wisps',
    specialBg: 'stainedGlass',
    particleColors: ['#38bdf8', '#7dd3fc', '#bae6fd'],
  },
  4: {
    name: '黑曜石熔爐要塞',
    bgTop: '#1d0b07',
    bgMid: '#31130b',
    bgBot: '#100503',
    glow: 'rgba(249, 115, 22, 0.38)',
    accent: '#f97316',
    particleType: 'embers',
    specialBg: 'magma',
    particleColors: ['#f97316', '#ef4444', '#fbbf24'],
  },
  5: {
    name: '緋紅魔獄王庭',
    bgTop: '#1d0819',
    bgMid: '#320d27',
    bgBot: '#0e030c',
    glow: 'rgba(232, 121, 249, 0.34)',
    accent: '#e879f9',
    particleType: 'wisps',
    specialBg: 'demonCourt',
    particleColors: ['#e879f9', '#f43f5e', '#c084fc'],
  },
  6: {
    name: '極光冰晶堡',
    bgTop: '#061720',
    bgMid: '#0d2b3b',
    bgBot: '#040d13',
    glow: 'rgba(34, 211, 238, 0.34)',
    accent: '#22d3ee',
    particleType: 'snow',
    specialBg: 'aurora',
    particleColors: ['#22d3ee', '#cffafe', '#a5f3fc'],
  },
  7: {
    name: '翠玉樹冠水寨',
    bgTop: '#071a10',
    bgMid: '#0e2e1d',
    bgBot: '#040d08',
    glow: 'rgba(74, 222, 128, 0.32)',
    accent: '#4ade80',
    particleType: 'spores',
    specialBg: 'swampMist',
    particleColors: ['#4ade80', '#86efac', '#a3e635'],
  },
  8: {
    name: '蒼穹電弧浮空城',
    bgTop: '#131625',
    bgMid: '#1f243b',
    bgBot: '#090b14',
    glow: 'rgba(250, 204, 21, 0.34)',
    accent: '#facc15',
    particleType: 'sparks',
    specialBg: 'electricArc',
    particleColors: ['#facc15', '#38bdf8', '#fef08a'],
  },
  9: {
    name: '聖血薔薇修道院',
    bgTop: '#1e0810',
    bgMid: '#310f1b',
    bgBot: '#0f0408',
    glow: 'rgba(244, 63, 94, 0.34)',
    accent: '#f43f5e',
    particleType: 'petals',
    specialBg: 'holyShaft',
    particleColors: ['#f43f5e', '#fda4af', '#fbbf24'],
  },
  10: {
    name: '永恆星辰聖域',
    bgTop: '#100a24',
    bgMid: '#1e1440',
    bgBot: '#070413',
    glow: 'rgba(192, 132, 252, 0.38)',
    accent: '#c084fc',
    particleType: 'stars',
    specialBg: 'astrolabe',
    particleColors: ['#c084fc', '#facc15', '#e9d5ff'],
  },
};

export const MOTION_PROFILES = {
  modal_blacksmith: { mode: 'hammer', speed: 2.3, ampY: 5, ampRot: 0.06, fxKey: 'crit', fxSpin: 0.2, auraColor: 'rgba(249, 115, 22, 0.40)' },
  modal_alchemy: { mode: 'stir', speed: 1.7, ampX: 4, ampY: 3, ampRot: 0.04, fxKey: 'orb', fxSpin: -0.35, auraColor: 'rgba(16, 185, 129, 0.36)' },
  modal_market: { mode: 'peek', speed: 1.4, ampX: 3, ampY: 4, ampRot: 0.03, fxKey: 'sigil', fxSpin: 0.15, auraColor: 'rgba(168, 85, 247, 0.35)' },
  modal_bounty: { mode: 'nod', speed: 1.2, ampY: 3, ampRot: 0.025, fxKey: 'sigil', fxSpin: 0.08, auraColor: 'rgba(245, 158, 11, 0.32)' },
  modal_tavern: { mode: 'sway', speed: 1.9, ampX: 5, ampY: 3, ampRot: 0.045, fxKey: 'orb', fxSpin: 0.12, auraColor: 'rgba(251, 191, 36, 0.36)' },
  modal_trainer: { mode: 'combat', speed: 2.6, ampX: 7, ampY: 4, ampRot: 0.05, fxKey: 'slash', fxSpin: 0.45, auraColor: 'rgba(239, 68, 68, 0.36)' },
  modal_portal: { mode: 'levitate', speed: 1.5, ampY: 8, ampRot: 0.02, fxKey: 'starSigil', fxSpin: 0.5, auraColor: 'rgba(56, 189, 248, 0.42)' },
  modal_waypoint: { mode: 'levitate', speed: 1.6, ampY: 7, ampRot: 0.015, fxKey: 'sigil', fxSpin: -0.45, auraColor: 'rgba(139, 92, 246, 0.40)' },
  modal_vault: { mode: 'steady', speed: 1.1, ampY: 2.5, ampRot: 0.015, fxKey: 'aegis', fxSpin: 0.1, auraColor: 'rgba(250, 204, 21, 0.32)' },
  modal_sanctum: { mode: 'prayer', speed: 1.3, ampY: 6, ampRot: 0.02, fxKey: 'voidCore', fxSpin: 0.38, auraColor: 'rgba(192, 132, 252, 0.42)' },
  modal_tower: { mode: 'scan', speed: 0.9, ampX: 8, ampY: 2, ampRot: 0.03, fxKey: 'sigil', fxSpin: 0.12, auraColor: 'rgba(56, 189, 248, 0.30)' },
  modal_patrol_guard: { mode: 'steady', speed: 1.4, ampY: 3, ampRot: 0.015, fxKey: 'aegis', fxSpin: 0.15, auraColor: 'rgba(251, 191, 36, 0.34)' },
  modal_patrol_villager: { mode: 'sway', speed: 2.0, ampX: 4, ampY: 4, ampRot: 0.04, fxKey: 'orb', fxSpin: 0.2, auraColor: 'rgba(74, 222, 128, 0.30)' },

  // 10 位章節限定 NPC 專屬動作與 FX 強化
  modal_scout: { mode: 'combat', speed: 2.1, ampX: 5, ampY: 4, ampRot: 0.04, fxKey: 'sigil', fxSpin: 0.22, auraColor: 'rgba(251, 191, 36, 0.40)' },
  modal_smuggler: { mode: 'peek', speed: 1.65, ampX: 4.5, ampY: 4, ampRot: 0.045, fxKey: 'orb', fxSpin: -0.32, auraColor: 'rgba(168, 85, 247, 0.42)' },
  modal_chronicler: { mode: 'levitate', speed: 1.25, ampY: 7.5, ampRot: 0.025, fxKey: 'voidCore', fxSpin: 0.28, auraColor: 'rgba(56, 189, 248, 0.40)' },
  modal_forgemaster: { mode: 'hammer', speed: 2.45, ampY: 6.5, ampRot: 0.065, fxKey: 'explosion', fxSpin: 0.35, auraColor: 'rgba(249, 115, 22, 0.46)' },
  modal_contractor: { mode: 'prayer', speed: 1.45, ampY: 5.5, ampRot: 0.03, fxKey: 'starSigil', fxSpin: -0.42, auraColor: 'rgba(232, 121, 249, 0.44)' },
  modal_shaman: { mode: 'sway', speed: 1.55, ampX: 4.5, ampY: 5, ampRot: 0.035, fxKey: 'frostRing', fxSpin: 0.34, auraColor: 'rgba(34, 211, 238, 0.44)' },
  modal_witchdoctor: { mode: 'stir', speed: 1.85, ampX: 5, ampY: 4.5, ampRot: 0.055, fxKey: 'poisonBurst', fxSpin: -0.38, auraColor: 'rgba(74, 222, 128, 0.42)' },
  modal_engineer: { mode: 'scan', speed: 2.25, ampX: 5.5, ampY: 3, ampRot: 0.035, fxKey: 'lightning', fxSpin: 0.58, auraColor: 'rgba(250, 204, 21, 0.44)' },
  modal_penitent: { mode: 'prayer', speed: 1.15, ampY: 5.5, ampRot: 0.02, fxKey: 'heaven', fxSpin: 0.22, auraColor: 'rgba(244, 63, 94, 0.42)' },
  modal_weaver: { mode: 'levitate', speed: 1.4, ampY: 9.5, ampRot: 0.025, fxKey: 'starSigil', fxSpin: 0.65, auraColor: 'rgba(192, 132, 252, 0.48)' },
};

export class NpcStageEngine {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.chapter = Math.max(1, Math.min(10, Number(opts.chapter) || 1));
    this.action = opts.action || 'modal_bounty';
    this.profile = MOTION_PROFILES[this.action] || MOTION_PROFILES.modal_bounty;
    this.theme = CHAPTER_ATMOSPHERE[this.chapter] || CHAPTER_ATMOSPHERE[1];

    this.npcImg = null;
    this.bldImg = null;
    this.fxImg = null;
    this.burstImg = null;

    this.particles = [];
    this.burstParticles = [];
    this.burstTimer = 0;
    this.shakeTimer = 0;
    this.lastHammerCycle = -1;

    this._rafId = null;
    this._destroyed = false;
    this._startTime = performance.now();

    this._loadImages(opts.npcUrl, opts.bldUrl);
    this._initParticles();
    if (this.ctx) {
      this._loop(performance.now());
    }
  }

  _loadImage(url, onLoad) {
    if (!url) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!this._destroyed) onLoad(img);
    };
    img.src = url;
  }

  _loadImages(npcUrl, bldUrl) {
    this._loadImage(npcUrl, (img) => { this.npcImg = img; });
    this._loadImage(bldUrl, (img) => { this.bldImg = img; });
    const fxSrc = FX_ASSETS[this.profile.fxKey] || FX_ASSETS.sigil;
    this._loadImage(fxSrc, (img) => { this.fxImg = img; });
    this._loadImage(FX_ASSETS.crit, (img) => { this.burstImg = img; });
  }

  _initParticles() {
    const w = this.canvas?.width || 300;
    const h = this.canvas?.height || 248;
    this.particles = [];
    for (let i = 0; i < 26; i++) {
      this.particles.push(this._makeAmbientParticle(w, h, true));
    }
  }

  _makeAmbientParticle(w, h, randomY = false) {
    const colors = this.theme.particleColors;
    const type = this.theme.particleType;
    const isFalling = type === 'snow' || type === 'petals';
    return {
      x: Math.random() * w,
      y: randomY ? Math.random() * h : (isFalling ? -10 : h + 10),
      vx: (Math.random() - 0.5) * (type === 'sparks' ? 1.9 : 0.65),
      vy: isFalling ? (0.45 + Math.random() * 0.9) : -(0.4 + Math.random() * 1.15),
      r: type === 'petals' ? (2.5 + Math.random() * 2.5) : (1.5 + Math.random() * 2.6),
      alpha: 0.28 + Math.random() * 0.65,
      phase: Math.random() * Math.PI * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
  }

  triggerActionBurst(kind = 'success') {
    if (this._destroyed || !this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w * 0.5;
    const cy = h * 0.54;
    this.burstTimer = 0.65;
    this.shakeTimer = kind === 'impact' ? 0.24 : 0.12;

    const palette = kind === 'impact'
      ? ['#f97316', '#fbbf24', '#ffffff']
      : [this.theme.accent, '#fde68a', '#ffffff'];

    for (let i = 0; i < 24; i++) {
      const ang = (Math.PI * 2 * i) / 24 + Math.random() * 0.25;
      const spd = 1.6 + Math.random() * 3.8;
      this.burstParticles.push({
        x: cx,
        y: cy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 0.8,
        r: 2 + Math.random() * 3.2,
        life: 1,
        decay: 0.022 + Math.random() * 0.02,
        color: palette[i % palette.length],
      });
    }
  }

  _drawChapterSpecialBackdrop(ctx, w, h, t) {
    const kind = this.theme.specialBg;
    ctx.save();
    if (kind === 'aurora') {
      // Ch6: 極光波紋
      const grad = ctx.createLinearGradient(0, 0, w, h * 0.45);
      grad.addColorStop(0, 'rgba(34, 211, 238, 0.0)');
      grad.addColorStop(0.5, 'rgba(34, 211, 238, 0.22)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let x = 0; x <= w; x += 24) {
        const y = 38 + Math.sin(x * 0.028 + t * 1.4) * 16 + Math.cos(x * 0.015 - t) * 8;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, 0);
      ctx.closePath();
      ctx.fill();
    } else if (kind === 'stainedGlass' || kind === 'holyShaft') {
      // Ch3 / Ch9: 彩繪玻璃或聖光斜射光束
      ctx.globalCompositeOperation = 'screen';
      const beamColor = kind === 'holyShaft' ? 'rgba(244, 63, 94, 0.14)' : 'rgba(56, 189, 248, 0.13)';
      for (let i = 0; i < 3; i++) {
        const offset = Math.sin(t * 0.6 + i) * 10;
        const bx = w * (0.25 + i * 0.25) + offset;
        const bg = ctx.createLinearGradient(bx, 0, bx + 20, h);
        bg.addColorStop(0, beamColor);
        bg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.moveTo(bx - 16, 0);
        ctx.lineTo(bx + 16, 0);
        ctx.lineTo(bx + 54, h);
        ctx.lineTo(bx - 4, h);
        ctx.closePath();
        ctx.fill();
      }
    } else if (kind === 'magma') {
      // Ch4: 底部熔岩脈動熱光
      const pulse = 0.25 + Math.sin(t * 2.8) * 0.1;
      const mg = ctx.createLinearGradient(0, h * 0.65, 0, h);
      mg.addColorStop(0, 'rgba(249, 115, 22, 0)');
      mg.addColorStop(1, `rgba(249, 115, 22, ${pulse})`);
      ctx.fillStyle = mg;
      ctx.fillRect(0, h * 0.65, w, h * 0.35);
    } else if (kind === 'electricArc') {
      // Ch8: 偶發電弧跳動
      if (Math.sin(t * 17) > 0.78) {
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.65)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        let ax = Math.random() > 0.5 ? 18 : w - 18;
        let ay = 16;
        ctx.moveTo(ax, ay);
        for (let s = 0; s < 5; s++) {
          ax += (w * 0.5 - ax) * 0.35 + (Math.random() - 0.5) * 28;
          ay += 22 + Math.random() * 14;
          ctx.lineTo(ax, ay);
        }
        ctx.stroke();
      }
    } else if (kind === 'astrolabe') {
      // Ch10: 黃金星象儀雙軌道
      ctx.translate(w * 0.5, h * 0.52);
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.24)';
      ctx.lineWidth = 1;
      ctx.save();
      ctx.rotate(t * 0.25);
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(w, h) * 0.40, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      ctx.rotate(-t * 0.18);
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.28)';
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(w, h) * 0.32, 0, Math.PI * 2);
      ctx.stroke();
    } else if (kind === 'swampMist') {
      // Ch7: 沼澤底部毒霧
      const sg = ctx.createLinearGradient(0, h * 0.7, 0, h);
      sg.addColorStop(0, 'rgba(74, 222, 128, 0)');
      sg.addColorStop(1, 'rgba(74, 222, 128, 0.18)');
      ctx.fillStyle = sg;
      ctx.fillRect(0, h * 0.7, w, h * 0.3);
    }
    ctx.restore();
  }

  _computeMotion(t) {
    const p = this.profile;
    const s = t * p.speed;
    let dx = 0;
    let dy = 0;
    let rot = 0;
    let scale = 1;

    switch (p.mode) {
      case 'hammer': {
        const cyc = (s * 0.45) % 1;
        const cycleIdx = Math.floor(s * 0.45);
        if (cyc < 0.7) {
          const lift = Math.sin((cyc / 0.7) * Math.PI * 0.5);
          dy = -lift * (p.ampY || 5);
          rot = -lift * (p.ampRot || 0.06);
        } else {
          const slam = (cyc - 0.7) / 0.3;
          dy = (1 - slam) * -4 + Math.sin(slam * Math.PI) * 5;
          rot = (1 - slam) * 0.05;
          if (cycleIdx !== this.lastHammerCycle && slam > 0.35) {
            this.lastHammerCycle = cycleIdx;
            this._spawnLocalSparks();
          }
        }
        break;
      }
      case 'stir':
        dx = Math.cos(s) * (p.ampX || 4);
        dy = Math.sin(s * 2) * (p.ampY || 3);
        rot = Math.sin(s) * (p.ampRot || 0.04);
        break;
      case 'peek':
        dx = Math.sin(s * 0.8) * (p.ampX || 3);
        dy = Math.abs(Math.sin(s)) * -(p.ampY || 4);
        rot = Math.sin(s * 0.8) * (p.ampRot || 0.03);
        break;
      case 'combat':
        dx = Math.sin(s * 1.3) * (p.ampX || 6);
        dy = Math.abs(Math.cos(s * 1.3)) * -(p.ampY || 4);
        rot = Math.cos(s * 1.3) * (p.ampRot || 0.04);
        scale = 1 + Math.sin(s * 2.6) * 0.02;
        break;
      case 'levitate':
        dy = Math.sin(s) * (p.ampY || 8);
        rot = Math.sin(s * 0.7) * (p.ampRot || 0.02);
        scale = 1 + Math.sin(s) * 0.015;
        break;
      case 'prayer':
        dy = Math.sin(s) * (p.ampY || 5);
        rot = Math.sin(s * 0.5) * (p.ampRot || 0.02);
        scale = 1 + Math.sin(s * 1.5) * 0.018;
        break;
      case 'scan':
        dx = Math.sin(s * 0.7) * (p.ampX || 7);
        dy = Math.sin(s * 2) * (p.ampY || 2);
        rot = Math.sin(s * 0.7) * (p.ampRot || 0.03);
        break;
      case 'sway':
        dx = Math.sin(s) * (p.ampX || 4);
        dy = Math.abs(Math.cos(s)) * -(p.ampY || 3);
        rot = Math.sin(s) * (p.ampRot || 0.04);
        break;
      case 'nod':
      case 'steady':
      default:
        dy = Math.sin(s) * (p.ampY || 3);
        rot = Math.sin(s * 0.5) * (p.ampRot || 0.015);
        scale = 1 + Math.sin(s) * 0.012;
        break;
    }
    return { dx, dy, rot, scale };
  }

  _spawnLocalSparks() {
    if (!this.canvas) return;
    const cx = this.canvas.width * 0.5;
    const cy = this.canvas.height * 0.66;
    for (let i = 0; i < 6; i++) {
      const ang = -Math.PI * 0.15 - Math.random() * Math.PI * 0.7;
      const spd = 1.2 + Math.random() * 2.2;
      this.burstParticles.push({
        x: cx + (Math.random() - 0.5) * 24,
        y: cy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r: 1.5 + Math.random() * 2,
        life: 0.7,
        decay: 0.03,
        color: this.theme.accent,
      });
    }
  }

  _loop(now) {
    if (this._destroyed || !this.ctx || !this.canvas) return;
    const dt = 0.016;
    const t = (now - this._startTime) / 1000;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    if (this.burstTimer > 0) this.burstTimer = Math.max(0, this.burstTimer - dt);
    if (this.shakeTimer > 0) this.shakeTimer = Math.max(0, this.shakeTimer - dt);

    ctx.save();
    if (this.shakeTimer > 0) {
      const mag = this.shakeTimer * 14;
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, this.theme.bgTop);
    grad.addColorStop(0.55, this.theme.bgMid);
    grad.addColorStop(1, this.theme.bgBot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    this._drawChapterSpecialBackdrop(ctx, w, h, t);

    const rad = ctx.createRadialGradient(w * 0.5, h * 0.54, 10, w * 0.5, h * 0.54, w * 0.58);
    rad.addColorStop(0, this.profile.auraColor || this.theme.glow);
    rad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, w, h);

    if (this.bldImg) {
      ctx.save();
      ctx.globalAlpha = 0.24;
      const bScale = Math.min((w * 0.85) / this.bldImg.width, (h * 0.65) / this.bldImg.height);
      const bw = this.bldImg.width * bScale;
      const bh = this.bldImg.height * bScale;
      ctx.drawImage(this.bldImg, (w - bw) * 0.5, h * 0.14, bw, bh);
      ctx.restore();
    }

    if (this.fxImg) {
      ctx.save();
      ctx.translate(w * 0.5, h * 0.55);
      ctx.rotate(t * (this.profile.fxSpin || 0.2));
      const pulse = 1 + Math.sin(t * 2.2) * 0.05;
      const fxSize = Math.min(w, h) * 0.62 * pulse;
      ctx.globalAlpha = 0.34 + Math.sin(t * 2.2) * 0.08;
      ctx.globalCompositeOperation = 'screen';
      ctx.drawImage(this.fxImg, -fxSize * 0.5, -fxSize * 0.5, fxSize, fxSize);
      ctx.restore();
    }

    const { dx, dy, rot, scale } = this._computeMotion(t);
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
    ctx.beginPath();
    ctx.ellipse(w * 0.5 + dx * 0.3, h * 0.79, 54 * (2 - scale), 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = this.theme.accent;
    ctx.globalAlpha = 0.44 + Math.sin(t * 2.5) * 0.14;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.79, 64, 14, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    if (this.npcImg) {
      ctx.save();
      const targetH = h * 0.54;
      const ratio = Math.min((w * 0.68) / this.npcImg.width, targetH / this.npcImg.height);
      const nw = this.npcImg.width * ratio;
      const nh = this.npcImg.height * ratio;
      ctx.translate(w * 0.5 + dx, h * 0.54 + dy);
      ctx.rotate(rot);
      ctx.scale(scale, scale);
      ctx.shadowColor = this.theme.accent;
      ctx.shadowBlur = this.burstTimer > 0 ? 28 : 14;
      ctx.drawImage(this.npcImg, -nw * 0.5, -nh * 0.5, nw, nh);
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(w * 0.5 + dx, h * 0.54 + dy);
      ctx.fillStyle = this.theme.glow;
      ctx.beginPath();
      ctx.arc(0, 0, 42 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (this.burstTimer > 0 && this.burstImg) {
      ctx.save();
      ctx.translate(w * 0.5, h * 0.54);
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = Math.min(1, this.burstTimer * 1.4);
      const bSize = Math.min(w, h) * (0.45 + (0.65 - this.burstTimer) * 0.6);
      ctx.drawImage(this.burstImg, -bSize * 0.5, -bSize * 0.5, bSize, bSize);
      ctx.restore();
    }

    for (let i = 0; i < this.particles.length; i++) {
      const pt = this.particles[i];
      pt.x += pt.vx + Math.sin(t * 2 + pt.phase) * 0.25;
      pt.y += pt.vy;
      if (pt.y < -12 || pt.y > h + 12 || pt.x < -12 || pt.x > w + 12) {
        this.particles[i] = this._makeAmbientParticle(w, h, false);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = pt.alpha * (0.65 + Math.sin(t * 3 + pt.phase) * 0.35);
      ctx.fillStyle = pt.color;
      if (this.theme.particleType === 'petals') {
        ctx.translate(pt.x, pt.y);
        ctx.rotate(t * 1.5 + pt.phase);
        ctx.beginPath();
        ctx.ellipse(0, 0, pt.r * 1.3, pt.r * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    for (let i = this.burstParticles.length - 1; i >= 0; i--) {
      const bp = this.burstParticles[i];
      bp.x += bp.vx;
      bp.y += bp.vy;
      bp.vy += 0.06;
      bp.life -= bp.decay;
      if (bp.life <= 0) {
        this.burstParticles.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = bp.life;
      ctx.fillStyle = bp.color;
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, bp.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
    this._rafId = requestAnimationFrame((ts) => this._loop(ts));
  }

  destroy() {
    this._destroyed = true;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }
}
