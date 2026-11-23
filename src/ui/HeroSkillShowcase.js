// 創角大廳：全 6 職業 × 全 8 技能 (48 招) 實戰打小怪演武預覽模組 (v72)
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
    this.heroX = 92;
    this.heroBaseX = 92;
    this.heroY = 128;
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
    const spots = [{ x: 255, y: 108 }, { x: 298, y: 132 }, { x: 262, y: 156 }];
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
    this.skillIdx = ((idx % skills.length) + skills.length) % skills.length;
    const sk = skills[this.skillIdx];
    const now = performance.now();
    this.castAnimUntil = now + 750;
    this.autoSwitchAt = now + 2600;
    this.onSkillChange?.(this.skillIdx, sk);

    const color = CLASS_COLORS[this.classId] || '#fbbf24';
    const type = sk?.type || sk?.id || 'slash';
    const isDash = /charge|dash|blitz|step|leap|bash/i.test(type);
    if (isDash) {
      this.heroX = 175;
    } else {
      this.heroX = this.heroBaseX;
    }

    // Spawn bespoke visual effects for all 48 skills
    const cx = 272;
    const cy = 130;
    if (/meteor|star|blackhole|singularity|fissure|stomp|consecrate|nova|rain|blizzard|volley/i.test(type)) {
      for (let i = 0; i < 12; i++) {
        this.fx.push({
          kind: 'meteor',
          x: 215 + Math.random() * 125,
          y: 25 + Math.random() * 40,
          tx: 225 + Math.random() * 105,
          ty: 105 + Math.random() * 55,
          life: 0,
          maxLife: 450 + Math.random() * 250,
          color,
        });
      }
    } else if (/arrow|spear|kunai|bolt|snipe|chain|hammer/i.test(type)) {
      for (let i = 0; i < 7; i++) {
        this.fx.push({
          kind: 'proj',
          x: this.heroX + 24,
          y: this.heroY - 12 + (i - 3) * 8,
          vx: 380 + Math.random() * 140,
          vy: (i - 3) * 18,
          life: 0,
          maxLife: 520,
          color,
        });
      }
    } else {
      // Melee cleave / shockwave / aura / summon burst
      this.fx.push({ kind: 'ring', x: cx, y: cy, r: 12, maxR: 86, life: 0, maxLife: 520, color });
      this.fx.push({ kind: 'ring', x: this.heroX + 22, y: this.heroY - 10, r: 8, maxR: 62, life: 0, maxLife: 400, color: '#ffffff' });
      for (let i = 0; i < 14; i++) {
        const ang = (Math.PI * 2 * i) / 14;
        this.fx.push({
          kind: 'spark',
          x: cx,
          y: cy - 10,
          vx: Math.cos(ang) * (90 + Math.random() * 110),
          vy: Math.sin(ang) * (55 + Math.random() * 75),
          life: 0,
          maxLife: 480,
          color,
        });
      }
    }

    // Damage & knockback mobs
    for (const m of this.mobs) {
      if (now < m.deadUntil) continue;
      const dmg = Math.round(180 + Math.random() * 420);
      m.hp -= 45;
      m.flashUntil = now + 180;
      m.x = m.baseX + 12;
      this.popups.push({
        x: m.x + (Math.random() - 0.5) * 18,
        y: m.y - 34,
        text: `${dmg}!`,
        color: Math.random() < 0.5 ? '#fde047' : '#fb923c',
        life: 0,
        maxLife: 700,
      });
      if (m.hp <= 0) {
        m.hp = m.maxHp;
        m.deadUntil = now + 750;
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

    // Smooth return hero back to left stance
    this.heroX += (this.heroBaseX - this.heroX) * 0.08;

    // Background & Arena Stone Floor
    ctx.clearRect(0, 0, w, h);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#090c14');
    grad.addColorStop(1, '#151b2b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle magic circle floor
    const col = CLASS_COLORS[this.classId] || '#fbbf24';
    ctx.strokeStyle = `${col}33`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(w / 2, 146, 155, 36, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Draw Hero
    const heroAtlas = this.atlasCache.get(`./assets/heroes/atlas_${this.classId}.png?v=66`);
    if (!heroAtlas?.ready) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px Noto Sans TC, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚔️ 載入職業實戰演武中...', w / 2, h / 2);
    }
    const pf = HERO_PREFIX[this.classId] || 'wf';
    if (heroAtlas?.ready) {
      const isAtk = now < this.castAnimUntil;
      const fIdx = isAtk ? Math.floor((now / 110) % 4) : Math.floor((now / 150) % 4);
      const fname = isAtk ? `${pf}_right_atk_${fIdx}` : `${pf}_right_walk_${fIdx}`;
      const fr = heroAtlas.frames[fname]?.frame || heroAtlas.frames[`${pf}_right_walk_0`]?.frame;
      if (fr) {
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
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
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.beginPath();
          ctx.ellipse(m.x, m.y + 12, 16, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.save();
          if (now < m.flashUntil) ctx.filter = 'brightness(2.2)';
          ctx.translate(m.x, m.y);
          ctx.scale(-1, 1); // Face left toward hero
          ctx.drawImage(this.mobAtlas.img, fr.x, fr.y, fr.w, fr.h, -32, -50, 64, 64);
          ctx.restore();
        }
      }
      // Mob HP Bar
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(m.x - 16, m.y - 44, 32, 4);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(m.x - 16, m.y - 44, 32 * Math.max(0, m.hp / m.maxHp), 4);
    }

    // Update & Draw Skill FX
    this.fx = this.fx.filter((f) => {
      f.life += 16;
      const p = f.life / f.maxLife;
      if (p >= 1) return false;
      ctx.save();
      ctx.globalAlpha = 1 - p;
      if (f.kind === 'ring') {
        ctx.strokeStyle = f.color;
        ctx.lineWidth = 3 * (1 - p);
        ctx.beginPath();
        ctx.ellipse(f.x, f.y, f.r + (f.maxR - f.r) * p, (f.r + (f.maxR - f.r) * p) * 0.48, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (f.kind === 'proj') {
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        ctx.fillStyle = f.color;
        ctx.fillRect(f.x - 10, f.y - 2, 20, 4);
      } else if (f.kind === 'meteor') {
        const mx = f.x + (f.tx - f.x) * p;
        const my = f.y + (f.ty - f.y) * p;
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(mx, my, 6 * (1 - p * 0.4), 0, Math.PI * 2);
        ctx.fill();
      } else if (f.kind === 'spark') {
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return true;
    });

    // Damage popups
    ctx.font = 'bold 13px Noto Sans TC, sans-serif';
    ctx.textAlign = 'center';
    this.popups = this.popups.filter((pp) => {
      pp.life += 16;
      const p = pp.life / pp.maxLife;
      if (p >= 1) return false;
      pp.y -= 0.45;
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
