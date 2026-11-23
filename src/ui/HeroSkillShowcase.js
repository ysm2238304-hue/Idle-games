// 創角大廳：全 6 職業 × 全 8 技能 (48 招) 實戰貼圖特效與戰鬥背景演武預覽模組 (v76)
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

const CLASS_BG_MAP = {
  warrior: './assets/bg/map_4.jpg',
  ranger: './assets/bg/map_0.jpg',
  mage: './assets/bg/map_5.jpg',
  paladin: './assets/bg/map_3.jpg',
  necro: './assets/bg/map_2.jpg',
  assassin: './assets/bg/map_7.jpg',
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
    this.heroX = 88;
    this.heroBaseX = 88;
    this.heroY = 138;
    this.afterimages = [];
    this.mobs = [];
    this.fx = [];
    this.popups = [];
    this.atlasCache = new Map();
    this.imgCache = new Map();
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

  _getImg(url) {
    if (this.imgCache.has(url)) return this.imgCache.get(url);
    const rec = { img: new Image(), ready: false };
    rec.img.onload = () => { rec.ready = true; };
    rec.img.src = url;
    this.imgCache.set(url, rec);
    return rec;
  }

  _getFxImg(key) {
    return this._getImg(`./assets/fx/${key}.png?v=76`);
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
    this._getImg(CLASS_BG_MAP[this.classId] || CLASS_BG_MAP.warrior);
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
    const spots = [{ x: 256, y: 112 }, { x: 310, y: 136 }, { x: 268, y: 162 }];
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

  _addSpriteFx(key, opts) {
    this._getFxImg(key);
    this.fx.push({
      kind: 'sprite',
      key,
      x: opts.x ?? 272,
      y: opts.y ?? 132,
      vx: opts.vx ?? 0,
      vy: opts.vy ?? 0,
      size: opts.size ?? 88,
      scaleStart: opts.scaleStart ?? 0.65,
      scaleEnd: opts.scaleEnd ?? 1.25,
      rot: opts.rot ?? 0,
      rotSpeed: opts.rotSpeed ?? 0,
      alpha: opts.alpha ?? 1,
      add: opts.add !== false,
      delay: opts.delay ?? 0,
      life: 0,
      maxLife: opts.maxLife ?? 650,
      orbit: opts.orbit || null,
    });
  }

  triggerSkill(idx) {
    const rawMap = CLASS_SKILLS_MAP[this.classId] || WARRIOR_SKILLS;
    const skills = Array.isArray(rawMap) ? rawMap : Object.values(rawMap);
    if (!skills.length) return;
    this.skillIdx = ((idx % skills.length) + skills.length) % skills.length;
    const sk = skills[this.skillIdx];
    const now = performance.now();
    this.castAnimUntil = now + 950;
    this.autoSwitchAt = now + 2900;
    this.onSkillChange?.(this.skillIdx, sk);

    const id = sk?.id || '';
    const cx = 274;
    const cy = 132;
    const hx = this.heroBaseX;
    const hy = this.heroY;

    // 衝鋒/瞬移型位移
    if (/bloodcharge|shadowstep|shield_bash|shadow_blitz/.test(id)) {
      this.afterimages = [
        { x: 118, y: hy, alpha: 0.6 },
        { x: 158, y: hy, alpha: 0.78 },
        { x: 196, y: hy, alpha: 0.9 },
      ];
      this.heroX = 212;
    } else {
      this.heroX = hx;
    }

    // 依各職業與技能 ID 對應真實戰鬥貼圖特效
    if (this.classId === 'warrior') {
      if (id === 'whirlwind') {
        this._addSpriteFx('wfx_whirl_outer', { x: cx - 20, y: cy, size: 150, scaleStart: 0.85, scaleEnd: 1.15, rotSpeed: 7, maxLife: 1100 });
        this._addSpriteFx('wfx_whirl_inner', { x: cx - 20, y: cy, size: 120, scaleStart: 0.8, scaleEnd: 1.1, rotSpeed: -9, maxLife: 1100 });
        this._addSpriteFx('wfx_whirl_wind', { x: cx - 20, y: cy + 12, size: 155, scaleStart: 0.9, scaleEnd: 1.2, rotSpeed: 5, maxLife: 1100, alpha: 0.85 });
      } else if (id === 'earthshatter') {
        this._addSpriteFx('wfx_lava_crack', { x: cx, y: cy + 16, size: 135, scaleStart: 0.8, scaleEnd: 1.1, maxLife: 1100, add: false });
        this._addSpriteFx('wfx_slam_pillar', { x: cx, y: cy - 30, size: 130, scaleStart: 0.7, scaleEnd: 1.2, maxLife: 750 });
        this._addSpriteFx('wfx_lava_ring', { x: cx, y: cy + 10, size: 145, scaleStart: 0.45, scaleEnd: 1.3, maxLife: 850 });
        this._addSpriteFx('wfx_rubble', { x: cx, y: cy, size: 125, scaleStart: 0.7, scaleEnd: 1.2, maxLife: 780, add: false });
      } else if (id === 'bloodcharge') {
        this._addSpriteFx('wfx_charge_aura', { x: 165, y: hy - 10, size: 115, scaleStart: 0.9, scaleEnd: 1.15, maxLife: 650 });
        this._addSpriteFx('wfx_fire_trail', { x: 185, y: hy, size: 125, scaleStart: 0.9, scaleEnd: 1.1, maxLife: 700 });
        this._addSpriteFx('wfx_blood_ring', { x: cx - 20, y: cy, size: 135, scaleStart: 0.5, scaleEnd: 1.25, maxLife: 820, delay: 120 });
      } else if (id === 'bladestorm') {
        for (let i = -1; i <= 1; i++) {
          this._addSpriteFx('wfx_blade_wave', { x: hx + 28, y: hy - 14 + i * 16, vx: 290, vy: i * 32, size: 86, scaleStart: 0.85, scaleEnd: 1.15, rot: i * 0.14, maxLife: 760 });
        }
        this._addSpriteFx('wfx_wave_trail', { x: hx + 60, y: hy - 10, vx: 220, size: 95, scaleStart: 0.8, scaleEnd: 1.1, maxLife: 650 });
      } else if (id === 'warcry') {
        this._addSpriteFx('nfx_warcry', { x: hx + 10, y: hy - 12, size: 145, scaleStart: 0.55, scaleEnd: 1.35, maxLife: 900 });
        this._addSpriteFx('wfx_blood_ring', { x: hx + 10, y: hy, size: 135, scaleStart: 0.4, scaleEnd: 1.35, maxLife: 850 });
      } else if (id === 'execute_cleave') {
        this._addSpriteFx('wfx_cleave', { x: cx - 10, y: cy - 8, size: 145, scaleStart: 0.75, scaleEnd: 1.25, rot: -0.35, maxLife: 650 });
        this._addSpriteFx('wfx_blood_ring', { x: cx, y: cy + 8, size: 130, scaleStart: 0.5, scaleEnd: 1.2, maxLife: 800 });
        this._addSpriteFx('wfx_sparks', { x: cx, y: cy - 8, size: 115, scaleStart: 0.7, scaleEnd: 1.3, maxLife: 650 });
      } else if (id === 'volcano_totem') {
        this._addSpriteFx('nfx_totem', { x: cx - 20, y: cy, size: 105, scaleStart: 0.85, scaleEnd: 1.05, maxLife: 1300 });
        this._addSpriteFx('wfx_lava_ring', { x: cx, y: cy + 12, size: 145, scaleStart: 0.5, scaleEnd: 1.25, maxLife: 950, delay: 140 });
        this._addSpriteFx('mfx_meteor_flame', { x: cx, y: cy - 18, size: 120, scaleStart: 0.7, scaleEnd: 1.2, maxLife: 900, delay: 180 });
      } else {
        this._addSpriteFx('wfx_lava_ring', { x: cx, y: cy + 10, size: 165, scaleStart: 0.45, scaleEnd: 1.3, maxLife: 900 });
        this._addSpriteFx('wfx_rubble', { x: cx, y: cy, size: 140, scaleStart: 0.7, scaleEnd: 1.2, maxLife: 820, add: false });
      }
    } else if (this.classId === 'ranger') {
      if (id === 'volley') {
        this._addSpriteFx('rfx_wind_trail', { x: hx + 25, y: hy - 14, size: 95, scaleStart: 0.8, scaleEnd: 1.15, maxLife: 550 });
        for (let i = -2; i <= 2; i++) {
          this._addSpriteFx('rfx_arrow', { x: hx + 24, y: hy - 16 + i * 7, vx: 360, vy: i * 38, size: 58, scaleStart: 0.9, scaleEnd: 1.0, rot: i * 0.11, maxLife: 620 });
        }
        this._addSpriteFx('rfx_pierce_flash', { x: cx, y: cy - 8, size: 105, scaleStart: 0.6, scaleEnd: 1.2, maxLife: 580, delay: 180 });
      } else if (id === 'arrowrain') {
        this._addSpriteFx('rfx_rain_sigil', { x: cx, y: cy + 16, size: 150, scaleStart: 0.7, scaleEnd: 1.15, maxLife: 1150 });
        for (let i = 0; i < 4; i++) {
          const ox = cx - 42 + i * 28;
          this._addSpriteFx('rfx_rain_fall', { x: ox, y: 20, vy: 210, size: 95, scaleStart: 0.9, scaleEnd: 1.05, delay: i * 90, maxLife: 620 });
          this._addSpriteFx('rfx_rain_impact', { x: ox, y: cy + 12, size: 95, scaleStart: 0.5, scaleEnd: 1.2, delay: 190 + i * 90, maxLife: 560 });
        }
        this._addSpriteFx('rfx_leaf_sparks', { x: cx, y: cy, size: 130, scaleStart: 0.6, scaleEnd: 1.25, delay: 200, maxLife: 850 });
      } else if (id === 'shadowstep') {
        this._addSpriteFx('rfx_shadow_smoke', { x: hx + 20, y: hy, size: 110, scaleStart: 0.7, scaleEnd: 1.2, maxLife: 700, add: false });
        this._addSpriteFx('rfx_trap_rune', { x: cx - 30, y: cy + 12, size: 115, scaleStart: 0.8, scaleEnd: 1.1, maxLife: 1050 });
        this._addSpriteFx('rfx_poison_burst', { x: cx, y: cy, size: 135, scaleStart: 0.5, scaleEnd: 1.25, delay: 180, maxLife: 800 });
      } else if (id === 'phantombow') {
        this._addSpriteFx('rfx_charge_bow', { x: hx + 18, y: hy - 14, size: 105, scaleStart: 0.8, scaleEnd: 1.15, maxLife: 620 });
        this._addSpriteFx('rfx_sonic_ring', { x: hx + 60, y: hy - 14, size: 100, scaleStart: 0.5, scaleEnd: 1.3, maxLife: 650, delay: 120 });
        this._addSpriteFx('rfx_phantom_dragon', { x: hx + 40, y: hy - 14, vx: 290, size: 135, scaleStart: 0.9, scaleEnd: 1.15, maxLife: 780, delay: 140 });
      } else if (id === 'windwalk') {
        this._addSpriteFx('rfx_dodge_aura', { x: hx + 15, y: hy - 10, size: 125, scaleStart: 0.7, scaleEnd: 1.25, maxLife: 950 });
        this._addSpriteFx('rfx_wind_trail', { x: cx - 30, y: cy, size: 130, scaleStart: 0.8, scaleEnd: 1.2, maxLife: 800 });
        this._addSpriteFx('rfx_emerald_star', { x: cx, y: cy - 8, size: 115, scaleStart: 0.5, scaleEnd: 1.3, maxLife: 800, delay: 100 });
      } else if (id === 'caltrops') {
        this._addSpriteFx('nfx_caltrops', { x: cx, y: cy + 12, size: 145, scaleStart: 0.75, scaleEnd: 1.15, maxLife: 1250 });
        this._addSpriteFx('rfx_poison_burst', { x: cx, y: cy, size: 125, scaleStart: 0.5, scaleEnd: 1.2, delay: 160, maxLife: 820 });
      } else if (id === 'shadow_clones') {
        this._addSpriteFx('rfx_shadow_smoke', { x: hx + 40, y: hy - 10, size: 105, scaleStart: 0.7, scaleEnd: 1.2, maxLife: 720, add: false });
        for (let i = -1; i <= 1; i++) {
          this._addSpriteFx('rfx_beam', { x: hx + 45, y: hy - 14 + i * 20, vx: 340, vy: i * 18, size: 75, scaleStart: 0.9, scaleEnd: 1.05, maxLife: 650, delay: 80 });
        }
      } else {
        this._addSpriteFx('nfx_deathmark', { x: cx, y: cy - 28, size: 105, scaleStart: 0.65, scaleEnd: 1.2, maxLife: 1050 });
        this._addSpriteFx('rfx_beam', { x: hx + 25, y: hy - 16, vx: 380, size: 80, scaleStart: 0.9, scaleEnd: 1.1, maxLife: 620 });
        this._addSpriteFx('rfx_emerald_star', { x: cx, y: cy - 6, size: 110, scaleStart: 0.5, scaleEnd: 1.25, delay: 180, maxLife: 700 });
      }
    } else if (this.classId === 'mage') {
      if (id === 'meteor') {
        this._addSpriteFx('mfx_nova_ring', { x: cx, y: cy + 16, size: 150, scaleStart: 0.6, scaleEnd: 1.25, maxLife: 950 });
        this._addSpriteFx('mfx_meteor_rock', { x: cx - 75, y: 12, vx: 170, vy: 280, size: 110, scaleStart: 0.85, scaleEnd: 1.15, maxLife: 460 });
        this._addSpriteFx('mfx_meteor_crater', { x: cx, y: cy + 16, size: 135, scaleStart: 0.85, scaleEnd: 1.1, delay: 420, maxLife: 900, add: false });
        this._addSpriteFx('mfx_meteor_blast', { x: cx, y: cy - 12, size: 165, scaleStart: 0.6, scaleEnd: 1.35, delay: 420, maxLife: 760 });
        this._addSpriteFx('mfx_meteor_flame', { x: cx, y: cy - 24, size: 140, scaleStart: 0.7, scaleEnd: 1.2, delay: 450, maxLife: 820 });
      } else if (id === 'arcane_orb') {
        this._addSpriteFx('mfx_star_sigil', { x: hx + 16, y: hy - 12, size: 110, scaleStart: 0.6, scaleEnd: 1.2, maxLife: 700 });
        for (let i = -1; i <= 1; i++) {
          this._addSpriteFx('mfx_orb', { x: hx + 26, y: hy - 14 + i * 16, vx: 260, vy: i * 24, size: 78, scaleStart: 0.8, scaleEnd: 1.1, rotSpeed: 6, maxLife: 820 });
        }
      } else if (id === 'frost_nova') {
        this._addSpriteFx('mfx_frost_ring', { x: cx, y: cy + 10, size: 165, scaleStart: 0.45, scaleEnd: 1.35, maxLife: 880 });
        this._addSpriteFx('mfx_frost_shard', { x: cx, y: cy - 14, size: 140, scaleStart: 0.7, scaleEnd: 1.25, maxLife: 750 });
        this._addSpriteFx('mfx_frost_burst', { x: cx, y: cy - 6, size: 140, scaleStart: 0.6, scaleEnd: 1.3, maxLife: 800, delay: 80 });
      } else if (id === 'void_beam') {
        this._addSpriteFx('mfx_void_core', { x: hx + 30, y: hy - 18, size: 105, scaleStart: 0.7, scaleEnd: 1.2, maxLife: 800 });
        this._addSpriteFx('mfx_void_beam', { x: 200, y: hy - 18, size: 190, scaleStart: 0.9, scaleEnd: 1.1, maxLife: 750 });
        this._addSpriteFx('mfx_void_slash', { x: cx, y: cy - 10, size: 125, scaleStart: 0.7, scaleEnd: 1.25, maxLife: 680, delay: 120 });
      } else if (id === 'mana_overload') {
        this._addSpriteFx('nfx_overload', { x: hx + 12, y: hy - 16, size: 150, scaleStart: 0.6, scaleEnd: 1.35, maxLife: 980 });
        this._addSpriteFx('mfx_arcane_shield', { x: hx + 12, y: hy - 12, size: 125, scaleStart: 0.75, scaleEnd: 1.2, maxLife: 950 });
        this._addSpriteFx('mfx_star_sigil', { x: cx, y: cy, size: 130, scaleStart: 0.6, scaleEnd: 1.25, maxLife: 850, delay: 120 });
      } else if (id === 'chain_lightning') {
        this._addSpriteFx('nfx_lightning', { x: 185, y: 118, size: 175, scaleStart: 0.85, scaleEnd: 1.15, rot: -0.08, maxLife: 720 });
        this._addSpriteFx('nfx_lightning', { x: cx, y: cy - 10, size: 125, scaleStart: 0.8, scaleEnd: 1.2, rot: 0.95, maxLife: 720, delay: 100 });
        this._addSpriteFx('mfx_spark', { x: cx, y: cy - 8, size: 115, scaleStart: 0.6, scaleEnd: 1.3, maxLife: 680 });
      } else if (id === 'icicle_rain') {
        this._addSpriteFx('mfx_frost_ring', { x: cx, y: cy + 14, size: 150, scaleStart: 0.6, scaleEnd: 1.25, maxLife: 950 });
        for (let i = 0; i < 4; i++) {
          const ox = cx - 40 + i * 26;
          this._addSpriteFx('nfx_icicles', { x: ox, y: 22, vy: 220, size: 100, scaleStart: 0.9, scaleEnd: 1.1, delay: i * 90, maxLife: 620 });
          this._addSpriteFx('mfx_frost_burst', { x: ox, y: cy + 6, size: 95, scaleStart: 0.5, scaleEnd: 1.2, delay: 180 + i * 90, maxLife: 560 });
        }
      } else {
        this._addSpriteFx('nfx_blackhole', { x: cx, y: cy - 8, size: 155, scaleStart: 0.6, scaleEnd: 1.25, rotSpeed: -5, maxLife: 1150 });
        this._addSpriteFx('mfx_void_core', { x: cx, y: cy - 8, size: 120, scaleStart: 0.5, scaleEnd: 1.3, rotSpeed: 4, maxLife: 950, delay: 160 });
      }
    } else if (this.classId === 'paladin') {
      if (id === 'blessed_hammer') {
        for (let i = 0; i < 3; i++) {
          this._addSpriteFx('pfx_hammer', {
            size: 62,
            scaleStart: 0.95,
            scaleEnd: 1.1,
            rotSpeed: 10,
            maxLife: 1200,
            orbit: { cx: cx - 35, cy: cy - 10, startR: 28, endR: 92, startAng: (Math.PI * 2 * i) / 3, speed: 6.2 },
          });
        }
      } else if (id === 'heaven_fist') {
        this._addSpriteFx('pfx_heaven', { x: cx, y: cy - 34, size: 145, scaleStart: 0.75, scaleEnd: 1.25, maxLife: 820 });
        this._addSpriteFx('pfx_judgment', { x: cx, y: cy + 8, size: 135, scaleStart: 0.5, scaleEnd: 1.25, maxLife: 880, delay: 140 });
      } else if (id === 'judgment') {
        this._addSpriteFx('pfx_judgment', { x: cx, y: cy - 6, size: 155, scaleStart: 0.55, scaleEnd: 1.3, maxLife: 920 });
        this._addSpriteFx('pfx_slash', { x: cx, y: cy - 12, size: 115, scaleStart: 0.7, scaleEnd: 1.2, maxLife: 680, delay: 100 });
      } else if (id === 'divine_storm') {
        this._addSpriteFx('pfx_storm', { x: cx - 18, y: cy - 8, size: 160, scaleStart: 0.55, scaleEnd: 1.3, rotSpeed: 4, maxLife: 950 });
        this._addSpriteFx('pfx_slash', { x: cx, y: cy - 10, size: 125, scaleStart: 0.7, scaleEnd: 1.2, rotSpeed: -6, maxLife: 780 });
      } else if (id === 'shield_bash') {
        this._addSpriteFx('pfx_bash', { x: cx - 22, y: cy - 8, size: 130, scaleStart: 0.75, scaleEnd: 1.25, maxLife: 700 });
        this._addSpriteFx('pfx_aegis', { x: 205, y: hy - 10, size: 115, scaleStart: 0.7, scaleEnd: 1.15, maxLife: 800 });
      } else if (id === 'holy_aegis') {
        this._addSpriteFx('pfx_aegis', { x: hx + 10, y: hy - 14, size: 145, scaleStart: 0.7, scaleEnd: 1.2, maxLife: 1100 });
        this._addSpriteFx('pfx_consecration', { x: hx + 10, y: hy + 12, size: 135, scaleStart: 0.6, scaleEnd: 1.2, maxLife: 1000 });
      } else if (id === 'consecration') {
        this._addSpriteFx('pfx_consecration', { x: cx, y: cy + 12, size: 165, scaleStart: 0.65, scaleEnd: 1.2, maxLife: 1200 });
        this._addSpriteFx('pfx_heaven', { x: cx, y: cy - 28, size: 120, scaleStart: 0.7, scaleEnd: 1.15, maxLife: 820, delay: 140 });
      } else {
        this._addSpriteFx('pfx_storm', { x: hx + 15, y: hy - 8, size: 150, scaleStart: 0.55, scaleEnd: 1.35, maxLife: 920 });
        this._addSpriteFx('pfx_judgment', { x: cx, y: cy, size: 135, scaleStart: 0.6, scaleEnd: 1.25, maxLife: 880, delay: 100 });
      }
    } else if (this.classId === 'necro') {
      if (id === 'raise_skeleton') {
        this._addSpriteFx('sfx_skel_summon', { x: hx + 35, y: hy + 8, size: 125, scaleStart: 0.6, scaleEnd: 1.2, maxLife: 880 });
        this._addSpriteFx('nfx_p_summon', { x: cx - 35, y: cy + 6, size: 120, scaleStart: 0.7, scaleEnd: 1.15, maxLife: 950 });
        this._addSpriteFx('sfx_skel_slash', { x: cx, y: cy - 8, size: 115, scaleStart: 0.7, scaleEnd: 1.2, maxLife: 650, delay: 220 });
      } else if (id === 'blood_golem') {
        this._addSpriteFx('sfx_golem_summon', { x: cx - 25, y: cy + 8, size: 140, scaleStart: 0.65, scaleEnd: 1.25, maxLife: 950 });
        this._addSpriteFx('nfx_p_golem', { x: cx - 20, y: cy - 8, size: 110, scaleStart: 0.8, scaleEnd: 1.1, maxLife: 1100, add: false });
        this._addSpriteFx('sfx_golem_slam', { x: cx, y: cy + 10, size: 135, scaleStart: 0.6, scaleEnd: 1.3, maxLife: 760, delay: 260 });
      } else if (id === 'undead_frenzy') {
        this._addSpriteFx('sfx_frenzy', { x: hx + 20, y: hy, size: 145, scaleStart: 0.6, scaleEnd: 1.3, maxLife: 920 });
        this._addSpriteFx('sfx_skel_slash', { x: cx, y: cy - 6, size: 125, scaleStart: 0.7, scaleEnd: 1.25, maxLife: 720, delay: 120 });
      } else if (id === 'wraith_army') {
        for (let i = -1; i <= 1; i++) {
          this._addSpriteFx('nfx_p_wraith', { x: hx + 35, y: hy - 14 + i * 18, vx: 265, vy: i * 12, size: 88, scaleStart: 0.85, scaleEnd: 1.1, maxLife: 780 });
        }
        this._addSpriteFx('sfx_wraith_boom', { x: cx, y: cy - 6, size: 140, scaleStart: 0.6, scaleEnd: 1.3, maxLife: 760, delay: 240 });
      } else if (id === 'bone_spear') {
        for (let i = -1; i <= 1; i++) {
          this._addSpriteFx('nfx_p_spear', { x: hx + 25, y: hy - 14 + i * 12, vx: 340, vy: i * 16, size: 88, scaleStart: 0.9, scaleEnd: 1.05, maxLife: 660 });
        }
        this._addSpriteFx('nfx_p_slash', { x: cx, y: cy - 10, size: 115, scaleStart: 0.7, scaleEnd: 1.2, maxLife: 600, delay: 160 });
      } else if (id === 'corpse_explosion') {
        this._addSpriteFx('nfx_p_corpse', { x: cx, y: cy - 6, size: 155, scaleStart: 0.55, scaleEnd: 1.35, maxLife: 880 });
        this._addSpriteFx('sfx_wraith_boom', { x: cx, y: cy - 12, size: 135, scaleStart: 0.6, scaleEnd: 1.25, maxLife: 800, delay: 100 });
      } else if (id === 'bone_prison') {
        this._addSpriteFx('nfx_p_prison', { x: cx, y: cy + 6, size: 150, scaleStart: 0.7, scaleEnd: 1.15, maxLife: 1150 });
        this._addSpriteFx('nfx_p_spear', { x: cx, y: cy - 12, size: 105, scaleStart: 0.8, scaleEnd: 1.1, maxLife: 720, delay: 180 });
      } else {
        this._addSpriteFx('nfx_p_curse', { x: cx, y: cy + 8, size: 160, scaleStart: 0.6, scaleEnd: 1.25, maxLife: 1100 });
        this._addSpriteFx('sfx_blood_leech', { x: hx + 20, y: hy - 10, size: 105, scaleStart: 0.7, scaleEnd: 1.2, maxLife: 760, delay: 140 });
      }
    } else if (this.classId === 'assassin') {
      if (id === 'shadow_blitz') {
        this._addSpriteFx('afx_dash', { x: 175, y: hy - 10, size: 120, scaleStart: 0.85, scaleEnd: 1.15, maxLife: 620 });
        this._addSpriteFx('afx_slash', { x: cx - 10, y: cy - 10, size: 135, scaleStart: 0.7, scaleEnd: 1.25, maxLife: 650, delay: 100 });
      } else if (id === 'shadow_clones') {
        this._addSpriteFx('afx_smoke', { x: hx + 30, y: hy, size: 120, scaleStart: 0.7, scaleEnd: 1.2, maxLife: 760, add: false });
        this._addSpriteFx('afx_slash', { x: cx, y: cy - 12, size: 130, scaleStart: 0.75, scaleEnd: 1.2, rot: 0.4, maxLife: 650, delay: 120 });
        this._addSpriteFx('afx_slash', { x: cx, y: cy - 6, size: 130, scaleStart: 0.75, scaleEnd: 1.2, rot: -0.4, maxLife: 650, delay: 200 });
      } else if (id === 'blade_flurry') {
        for (let i = 0; i < 3; i++) {
          this._addSpriteFx('afx_flurry', { x: cx, y: cy - 6, size: 145, scaleStart: 0.7, scaleEnd: 1.25, rot: i * 0.9, rotSpeed: 6, maxLife: 720, delay: i * 110 });
        }
      } else if (id === 'shadow_execute') {
        this._addSpriteFx('afx_execute', { x: cx, y: cy - 10, size: 165, scaleStart: 0.65, scaleEnd: 1.3, maxLife: 880 });
        this._addSpriteFx('afx_slash', { x: cx, y: cy - 10, size: 130, scaleStart: 0.75, scaleEnd: 1.2, maxLife: 650, delay: 120 });
      } else if (id === 'poison_kunai') {
        for (let i = -2; i <= 2; i++) {
          this._addSpriteFx('afx_kunai', { x: hx + 25, y: hy - 14 + i * 6, vx: 340, vy: i * 36, size: 62, scaleStart: 0.9, scaleEnd: 1.05, rot: i * 0.12, maxLife: 620 });
        }
        this._addSpriteFx('afx_venom', { x: cx, y: cy - 6, size: 120, scaleStart: 0.6, scaleEnd: 1.25, maxLife: 720, delay: 180 });
      } else if (id === 'smoke_veil') {
        this._addSpriteFx('afx_smoke', { x: hx + 15, y: hy, size: 150, scaleStart: 0.65, scaleEnd: 1.3, maxLife: 980, add: false });
        this._addSpriteFx('afx_dash', { x: cx - 25, y: cy - 8, size: 115, scaleStart: 0.75, scaleEnd: 1.2, maxLife: 700, delay: 140 });
      } else if (id === 'venom_burst') {
        this._addSpriteFx('afx_venom', { x: cx, y: cy - 8, size: 160, scaleStart: 0.55, scaleEnd: 1.35, maxLife: 900 });
        this._addSpriteFx('afx_kunai', { x: cx, y: cy - 8, size: 95, scaleStart: 0.7, scaleEnd: 1.2, maxLife: 680, delay: 100 });
      } else {
        this._addSpriteFx('afx_fangs', { x: cx - 10, y: cy - 8, size: 150, scaleStart: 0.7, scaleEnd: 1.3, maxLife: 840 });
        this._addSpriteFx('afx_execute', { x: cx, y: cy - 8, size: 130, scaleStart: 0.65, scaleEnd: 1.2, maxLife: 760, delay: 120 });
      }
    }

    // 命中閃光與傷害數字
    for (const m of this.mobs) {
      if (now < m.deadUntil) continue;
      const dmg = Math.round(280 + Math.random() * 620);
      m.hp -= 42;
      m.flashUntil = now + 260;
      m.x = m.baseX + 16;
      this.popups.push({
        x: m.x + (Math.random() - 0.5) * 20,
        y: m.y - 38,
        text: `${dmg}!`,
        color: Math.random() < 0.5 ? '#fde047' : '#fb923c',
        life: 0,
        maxLife: 1000,
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

    // 1. 對應職業真實戰鬥背景圖
    const bgRec = this._getImg(CLASS_BG_MAP[this.classId] || CLASS_BG_MAP.warrior);
    if (bgRec?.ready) {
      const iw = bgRec.img.naturalWidth || w;
      const ih = bgRec.img.naturalHeight || h;
      const scale = Math.max(w / iw, h / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      ctx.drawImage(bgRec.img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      const vig = ctx.createLinearGradient(0, 0, 0, h);
      vig.addColorStop(0, 'rgba(6, 9, 16, 0.35)');
      vig.addColorStop(0.6, 'rgba(6, 9, 16, 0.25)');
      vig.addColorStop(1, 'rgba(6, 9, 16, 0.72)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#090c14');
      grad.addColorStop(1, '#161d2f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    // 2. 英雄角色與殘影
    const heroAtlas = this.atlasCache.get(`./assets/heroes/atlas_${this.classId}.png?v=66`);
    const pf = HERO_PREFIX[this.classId] || 'wf';
    if (!heroAtlas?.ready) {
      ctx.fillStyle = '#e2e8f0';
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

        ctx.fillStyle = 'rgba(0,0,0,0.52)';
        ctx.beginPath();
        ctx.ellipse(this.heroX, this.heroY + 18, 22, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.drawImage(heroAtlas.img, fr.x, fr.y, fr.w, fr.h, this.heroX - 54, this.heroY - 76, 108, 108);
      }
    }

    // 3. 怪物實體
    for (const m of this.mobs) {
      if (now < m.deadUntil) continue;
      m.x += (m.baseX - m.x) * 0.14;
      if (this.mobAtlas?.ready) {
        const mf = Math.floor((now / 180) % 4);
        const fr = this.mobAtlas.frames[`${m.type}_walk_${mf}`]?.frame || this.mobAtlas.frames[`${m.type}_walk_0`]?.frame;
        if (fr) {
          ctx.fillStyle = 'rgba(0,0,0,0.48)';
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
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(m.x - 16, m.y - 44, 32, 4);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(m.x - 16, m.y - 44, 32 * Math.max(0, m.hp / m.maxHp), 4);
    }

    // 4. 真實 PNG 技能特效層
    this.fx = this.fx.filter((f) => {
      if (f.delay && f.delay > 0) {
        f.delay -= 16;
        return true;
      }
      f.life += 16;
      const p = f.life / f.maxLife;
      if (p >= 1) return false;

      if (f.orbit) {
        const r = f.orbit.startR + (f.orbit.endR - f.orbit.startR) * p;
        const a = f.orbit.startAng + p * f.orbit.speed;
        f.x = f.orbit.cx + Math.cos(a) * r;
        f.y = f.orbit.cy + Math.sin(a) * r * 0.65;
      } else {
        f.x += f.vx * dt;
        f.y += f.vy * dt;
      }
      f.rot += f.rotSpeed * dt;

      const rec = this._getFxImg(f.key);
      if (rec?.ready) {
        const scale = f.scaleStart + (f.scaleEnd - f.scaleStart) * p;
        const drawSize = f.size * scale;
        const fade = p < 0.15 ? p / 0.15 : Math.max(0, 1 - Math.pow((p - 0.15) / 0.85, 1.5));
        ctx.save();
        if (f.add) ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.min(1, fade * f.alpha);
        ctx.translate(f.x, f.y);
        if (f.rot) ctx.rotate(f.rot);
        ctx.drawImage(rec.img, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
        ctx.restore();
      }
      return true;
    });

    // 5. 傷害浮字
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
