// 創角大廳：全 6 職業 × 全 8 技能 (48 招) 高亮發光實戰打小怪演武預覽模組 (v75)
import { WARRIOR_SKILLS } from '../data/warriorSkills.js';
import { RANGER_SKILLS } from '../data/rangerSkills.js';
import { MAGE_SKILLS } from '../data/mageSkills.js';
import { PALADIN_SKILLS } from '../data/paladinSkills.js';
import { NECRO_SKILLS } from '../data/necroSkills.js';
import { ASSASSIN_SKILLS } from '../data/assassinSkills.js';

export const CLASS_SKILLS_MAP = {
  warrior: WARRIOR_SKILLS,
  ranger: RANGER_SKILLS,
  mage: MAGE_SKILLS,
  paladin: PALADIN_SKILLS,
  necro: NECRO_SKILLS,
  assassin: ASSASSIN_SKILLS,
};

const HERO_PREFIX = {
  warrior: 'wf',
  ranger: 'rf',
  mage: 'mf',
  paladin: 'pf',
  necro: 'nf',
  assassin: 'af',
};

const CLASS_COLORS = {
  warrior: '#ef4444',
  ranger: '#22c55e',
  mage: '#a855f7',
  paladin: '#facc15',
  necro: '#2dd4bf',
  assassin: '#c084fc',
};

export class HeroSkillShowcase {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.rafId = null;
    this.classId = 'warrior';
    this.skillIdx = 0;
    this.autoSwitchAt = 0;
    this.castAnimUntil = 0;
    this.heroX = 86;
    this.heroBaseX = 86;
    this.heroY = 134;
    this.afterimages = [];
    this.mobs = [];
    this.fx = [];
    this.popups = [];
    this.atlasCache = new Map();
    this.mobAtlas = null;
    this.onSkillChange = null;
    this._ensureMobAtlas();
  }

  _loadAtlas(pngUrl, jsonUrl) {
    if (this.atlasCache.has(pngUrl)) return this.atlasCache.get(pngUrl);
    const rec = { img: new Image(), frames: null, ready: false };
    this.atlasCache.set(pngUrl, rec);
    fetch(jsonUrl)
      .then((r) => r.json())
      .then((meta) => {
        rec.frames = meta.frames || {};
        rec.img.onload = () => { rec.ready = true; };
        rec.img.src = pngUrl;
      })
      .catch(() => {});
    return rec;
  }

  _ensureMobAtlas() {
    this.mobAtlas = this._loadAtlas('./assets/monsters/atlas_ch1.png', './assets/monsters/atlas_ch1.json');
  }

  attach(canvas, classId, onSkillChange) {
    this.stop();
    this.canvas = canvas;
    this.ctx = canvas?.getContext('2d');
    this.classId = classId || 'warrior';
    this.skillIdx = 0;
    this.fx = [];
    this.popups = [];
    this.afterimages = [];
    this.onSkillChange = onSkillChange;
    this._loadAtlas(`./assets/heroes/atlas_${this.classId}.png?v=66`, `./assets/heroes/atlas_${this.classId}.json?v=66`);
    this._spawnMobs();
    this.triggerSkill(0);
    const loop = (ts) => {
      this._tick(ts);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.canvas = null;
    this.ctx = null;
  }

  _spawnMobs() {
    const types = ['mob_ch1_wolf', 'mob_ch1_bandit', 'mob_ch1_boar'];
    const spots = [{ x: 252, y: 108 }, { x: 304, y: 132 }, { x: 264, y: 158 }];
    this.mobs = spots.map((sp, i) => ({
      type: types[i % types.length],
      x: sp.x,
      baseX: sp.x,
      y: sp.y,
      hp: 100,
      maxHp: 100,
      flashUntil: 0,
      deadUntil: 0,
    }));
  }

  triggerSkill(idx) {
    const rawMap = CLASS_SKILLS_MAP[this.classId] || WARRIOR_SKILLS;
    const skills = Array.isArray(rawMap) ? rawMap : Object.values(rawMap);
    if (!skills.length) return;
    this.skillIdx = ((idx % skills.length) + skills.length) % skills.length;
    const sk = skills[this.skillIdx];
    const now = performance.now();
    this.castAnimUntil = now + 950;
    this.autoSwitchAt = now + 2800;
    this.onSkillChange?.(this.skillIdx, sk);

    const color = CLASS_COLORS[this.classId] || '#fbbf24';
    const key = `${sk?.id || ''} ${sk?.type || ''}`.toLowerCase();
    const cx = 272;
    const cy = 130;

    // Dash / Blink / Charge with glowing afterimages
    if (/charge|dash|blitz|step|leap|bash|shadow/.test(key)) {
      this.afterimages = [
        { x: 115, y: this.heroY, alpha: 0.65 },
        { x: 155, y: this.heroY, alpha: 0.8 },
        { x: 195, y: this.heroY, alpha: 0.9 },
      ];
      this.heroX = 210;
      this.fx.push({ kind: 'slash', x: cx - 15, y: cy - 10, angle: -0.6, life: 0, maxLife: 900, color });
      this.fx.push({ kind: 'slash', x: cx - 10, y: cy - 10, angle: 0.6, life: 0, maxLife: 900, color: '#ffffff' });
    } else {
      this.heroX = this.heroBaseX;
    }

    // Category 1: Whirlwind / Spin / Storm / Flurry
    if (/whirlwind|storm|flurry|hammer|bladestorm/.test(key)) {
      this.fx.push({ kind: 'whirl', x: this.heroX + 24, y: this.heroY - 12, r: 58, life: 0, maxLife: 1450, color });
      this.fx.push({ kind: 'whirl', x: cx, y: cy - 8, r: 74, life: 0, maxLife: 1450, color });
    }
    // Category 2: Sky Drop (Meteor, Arrow Rain, Blizzard, Fist of Heavens, Judgment)
    else if (/meteor|volley|rain|blizzard|fist|judgment|execute|consecrate/.test(key)) {
      const cnt = /volley|rain|blizzard/.test(key) ? 16 : 6;
      for (let i = 0; i < cnt; i++) {
        this.fx.push({
          kind: /fist|judgment|consecrate/.test(key) ? 'pillar' : 'meteor',
          x: 215 + Math.random() * 118,
          y: 10 + Math.random() * 25,
          tx: 222 + Math.random() * 108,
          ty: 102 + Math.random() * 58,
          delay: i * 45,
          life: 0,
          maxLife: 1100,
          color,
        });
      }
      this.fx.push({ kind: 'ring', x: cx, y: cy + 8, r: 18, maxR: 95, life: 0, maxLife: 1350, color });
    }
    // Category 3: Vortex / Blackhole / Array / Curse / Totem / Summon
    else if (/blackhole|singularity|array|curse|cage|totem|skeleton|golem|wraith|frenzy|overload|aegis|smoke/.test(key)) {
      this.fx.push({ kind: 'vortex', x: cx, y: cy, r: 78, life: 0, maxLife: 1650, color });
      this.fx.push({ kind: 'ring', x: cx, y: cy, r: 20, maxR: 105, life: 0, maxLife: 1400, color: '#ffffff' });
      for (let i = 0; i < 4; i++) {
        this.fx.push({
          kind: 'minion',
          x: this.heroX + 32,
          y: this.heroY - 10 + (i - 1.5) * 18,
          tx: cx,
          ty: cy + (i - 1.5) * 14,
          life: 0,
          maxLife: 1200,
          color,
        });
      }
    }
    // Category 4: Chain Lightning / Projectiles / Snipe / Spear / Kunai / Fang / Orb / Wave
    else if (/chain|bolt|orb|snipe|spear|kunai|wave|fang|detonate|caltrop/.test(key)) {
      if (/chain/.test(key)) {
        this.fx.push({ kind: 'lightning', x1: this.heroX + 20, y1: this.heroY - 16, life: 0, maxLife: 1100, color: '#38bdf8' });
      }
      for (let i = 0; i < 6; i++) {
        this.fx.push({
          kind: 'proj',
          x: this.heroX + 24,
          y: this.heroY - 18 + (i - 2.5) * 10,
          vx: 310 + Math.random() * 120,
          vy: (i - 2.5) * 22,
          life: 0,
          maxLife: 950,
          color,
        });
      }
    }
    // Category 5: Ground Slam / Stomp / Roar / Cleave
    else {
      this.fx.push({ kind: 'ring', x: cx, y: cy, r: 16, maxR: 102, life: 0, maxLife: 1350, color });
      this.fx.push({ kind: 'ring', x: cx, y: cy, r: 10, maxR: 72, life: 0, maxLife: 1100, color: '#ffffff' });
      this.fx.push({ kind: 'slash', x: cx - 10, y: cy - 12, angle: -0.45, life: 0, maxLife: 950, color });
    }

    // Burst sparks on all skills
    for (let i = 0; i < 18; i++) {
      const ang = (Math.PI * 2 * i) / 18;
      this.fx.push({
        kind: 'spark',
        x: cx,
        y: cy - 8,
        vx: Math.cos(ang) * (75 + Math.random() * 125),
        vy: Math.sin(ang) * (45 + Math.random() * 80),
        life: 0,
        maxLife: 1100,
        color: i % 3 === 0 ? '#ffffff' : color,
      });
    }

    // Damage & knockback mobs
    for (const m of this.mobs) {
      if (now < m.deadUntil) continue;
      const dmg = Math.round(240 + Math.random() * 580);
      m.hp -= 42;
      m.flashUntil = now + 260;
      m.x = m.baseX + 16;
      this.popups.push({
        x: m.x + (Math.random() - 0.5) * 22,
        y: m.y - 36,
        text: `${dmg}!`,
        color: Math.random() < 0.5 ? '#fde047' : '#fb923c',
        life: 0,
        maxLife: 1050,
      });
      if (m.hp <= 0) {
        m.hp = m.maxHp;
        m.deadUntil = now + 650;
      }
    }
  }

  _tick(now) {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const dt = 0.016;

    if (now >= this.autoSwitchAt) {
      this.triggerSkill(this.skillIdx + 1);
    }

    this.heroX += (this.heroBaseX - this.heroX) * 0.07;

    ctx.clearRect(0, 0, w, h);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#090c14');
    grad.addColorStop(1, '#161d2f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const col = CLASS_COLORS[this.classId] || '#fbbf24';
    ctx.strokeStyle = `${col}44`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(w / 2, 148, 155, 36, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Draw Hero + Dash Afterimages
    const heroAtlas = this.atlasCache.get(`./assets/heroes/atlas_${this.classId}.png?v=66`);
    const pf = HERO_PREFIX[this.classId] || 'wf';
    if (!heroAtlas?.ready) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px Noto Sans TC, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚔️ 載入職業實戰演武中...', w / 2, h / 2);
    } else {
      const isAtk = now < this.castAnimUntil;
      const fIdx = isAtk ? Math.floor((now / 110) % 4) : Math.floor((now / 140) % 4);
      const fname = isAtk ? `${pf}_right_atk_${fIdx}` : `${pf}_right_walk_${fIdx}`;
      const fr = heroAtlas.frames[fname]?.frame || heroAtlas.frames[`${pf}_right_walk_0`]?.frame;
      if (fr) {
        this.afterimages = this.afterimages.filter((ai) => {
          ai.alpha -= 0.035;
          if (ai.alpha <= 0) return false;
          ctx.save();
          ctx.globalAlpha = ai.alpha * 0.55;
          ctx.drawImage(heroAtlas.img, fr.x, fr.y, fr.w, fr.h, ai.x - 54, ai.y - 76, 108, 108);
          ctx.restore();
          return true;
        });

        ctx.fillStyle = 'rgba(0,0,0,0.48)';
        ctx.beginPath();
        ctx.ellipse(this.heroX, this.heroY + 18, 22, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.drawImage(heroAtlas.img, fr.x, fr.y, fr.w, fr.h, this.heroX - 54, this.heroY - 76, 108, 108);
      }
    }

    // Draw Mobs
    for (const m of this.mobs) {
      if (now < m.deadUntil) continue;
      m.x += (m.baseX - m.x) * 0.14;
      if (this.mobAtlas?.ready) {
        const mf = Math.floor((now / 180) % 4);
        const fr = this.mobAtlas.frames[`${m.type}_walk_${mf}`]?.frame || this.mobAtlas.frames[`${m.type}_walk_0`]?.frame;
        if (fr) {
          ctx.fillStyle = 'rgba(0,0,0,0.42)';
          ctx.beginPath();
          ctx.ellipse(m.x, m.y + 12, 16, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.save();
          if (now < m.flashUntil) ctx.filter = 'brightness(2.4)';
          ctx.translate(m.x, m.y);
          ctx.scale(-1, 1);
          ctx.drawImage(this.mobAtlas.img, fr.x, fr.y, fr.w, fr.h, -32, -50, 64, 64);
          ctx.restore();
        }
      }
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(m.x - 16, m.y - 44, 32, 4);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(m.x - 16, m.y - 44, 32 * Math.max(0, m.hp / m.maxHp), 4);
    }

    // Additive Glowing Skill FX Layer
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    this.fx = this.fx.filter((f) => {
      if (f.delay && f.delay > 0) { f.delay -= 16; return true; }
      f.life += 16;
      const p = f.life / f.maxLife;
      if (p >= 1) return false;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - p);

      if (f.kind === 'ring') {
        const rr = f.r + (f.maxR - f.r) * p;
        ctx.strokeStyle = f.color;
        ctx.lineWidth = 4.5 * (1 - p);
        ctx.beginPath();
        ctx.ellipse(f.x, f.y, rr, rr * 0.48, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (f.kind === 'whirl') {
        ctx.translate(f.x, f.y);
        ctx.rotate(p * Math.PI * 7);
        ctx.strokeStyle = f.color;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, f.r * 0.85, 0, Math.PI * 1.35);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, f.r * 0.62, Math.PI, Math.PI * 2.2);
        ctx.stroke();
      } else if (f.kind === 'slash') {
        ctx.translate(f.x, f.y);
        ctx.rotate(f.angle);
        ctx.strokeStyle = f.color;
        ctx.lineWidth = 7 * (1 - p);
        ctx.beginPath();
        ctx.arc(0, 0, 62, -1.1, 1.1);
        ctx.stroke();
      } else if (f.kind === 'pillar') {
        const px = f.tx;
        const py = f.ty;
        ctx.fillStyle = f.color;
        ctx.fillRect(px - 10 * (1 - p * 0.5), 0, 20 * (1 - p * 0.5), py);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px - 3, 0, 6, py);
      } else if (f.kind === 'vortex') {
        ctx.translate(f.x, f.y);
        ctx.rotate(-p * Math.PI * 5);
        ctx.strokeStyle = f.color;
        ctx.lineWidth = 3;
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.ellipse(0, 0, f.r * (0.4 + k * 0.25), f.r * 0.45 * (0.4 + k * 0.25), k * 0.6, 0, Math.PI * 1.5);
          ctx.stroke();
        }
      } else if (f.kind === 'minion') {
        const mx = f.x + (f.tx - f.x) * Math.min(1, p * 1.3);
        const my = f.y + (f.ty - f.y) * Math.min(1, p * 1.3);
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(mx, my, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(mx + 2, my - 2, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (f.kind === 'lightning') {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4 * (1 - p);
        ctx.beginPath();
        ctx.moveTo(f.x1, f.y1);
        ctx.lineTo(180, 95 + (Math.random() - 0.5) * 18);
        ctx.lineTo(252, 108);
        ctx.lineTo(304, 132);
        ctx.lineTo(264, 158);
        ctx.stroke();
      } else if (f.kind === 'proj') {
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        ctx.strokeStyle = f.color;
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.moveTo(f.x - 24, f.y);
        ctx.lineTo(f.x + 8, f.y);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(f.x + 8, f.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (f.kind === 'meteor') {
        const mx = f.x + (f.tx - f.x) * p;
        const my = f.y + (f.ty - f.y) * p;
        ctx.strokeStyle = f.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(mx - 12, my - 22);
        ctx.lineTo(mx, my);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(mx, my, 7 * (1 - p * 0.3), 0, Math.PI * 2);
        ctx.fill();
      } else if (f.kind === 'spark') {
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 3.8 * (1 - p * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return true;
    });
    ctx.restore();

    // Damage popups
    ctx.font = 'bold 14px Noto Sans TC, sans-serif';
    ctx.textAlign = 'center';
    this.popups = this.popups.filter((pp) => {
      pp.life += 16;
      const p = pp.life / pp.maxLife;
      if (p >= 1) return false;
      pp.y -= 0.42;
      ctx.globalAlpha = 1 - p;
      ctx.fillStyle = '#000';
      ctx.fillText(pp.text, pp.x + 1, pp.y + 1);
      ctx.fillStyle = pp.color;
      ctx.fillText(pp.text, pp.x, pp.y);
      ctx.globalAlpha = 1;
      return true;
    });
  }
}
