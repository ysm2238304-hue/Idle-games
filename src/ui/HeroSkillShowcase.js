// 創角大廳：全 6 職業 × 全 8 技能 (48 招) 實戰貼圖特效、真實召喚物/分身與戰鬥背景演武預覽模組 (v77)
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

const CLASS_FX_PRELOAD = {
  warrior: ['wfx_whirl_outer', 'wfx_whirl_inner', 'wfx_whirl_wind', 'wfx_lava_crack', 'wfx_slam_pillar', 'wfx_lava_ring', 'wfx_rubble', 'wfx_charge_aura', 'wfx_fire_trail', 'wfx_blood_ring', 'wfx_blade_wave', 'wfx_wave_trail', 'nfx_warcry', 'wfx_cleave', 'wfx_sparks', 'nfx_totem', 'mfx_meteor_flame'],
  ranger: ['rfx_wind_trail', 'rfx_arrow', 'rfx_pierce_flash', 'rfx_rain_sigil', 'rfx_rain_fall', 'rfx_rain_impact', 'rfx_leaf_sparks', 'rfx_shadow_smoke', 'rfx_trap_rune', 'rfx_poison_burst', 'rfx_charge_bow', 'rfx_sonic_ring', 'rfx_phantom_dragon', 'rfx_dodge_aura', 'rfx_emerald_star', 'nfx_caltrops', 'rfx_beam', 'nfx_deathmark'],
  mage: ['mfx_nova_ring', 'mfx_meteor_rock', 'mfx_meteor_crater', 'mfx_meteor_blast', 'mfx_meteor_flame', 'mfx_star_sigil', 'mfx_orb', 'mfx_spark', 'mfx_frost_ring', 'mfx_frost_shard', 'mfx_frost_burst', 'mfx_void_core', 'mfx_void_beam', 'mfx_void_slash', 'nfx_overload', 'mfx_arcane_shield', 'nfx_lightning', 'nfx_icicles', 'nfx_blackhole'],
  paladin: ['pfx_hammer', 'pfx_heaven', 'pfx_judgment', 'pfx_slash', 'pfx_storm', 'pfx_bash', 'pfx_aegis', 'pfx_consecration'],
  necro: ['sfx_skel_summon', 'nfx_p_summon', 'sfx_skel_slash', 'sfx_golem_summon', 'nfx_p_golem', 'sfx_golem_slam', 'sfx_frenzy', 'nfx_p_wraith', 'sfx_wraith_boom', 'nfx_p_spear', 'nfx_p_slash', 'nfx_p_corpse', 'nfx_p_prison', 'nfx_p_curse', 'sfx_blood_leech'],
  assassin: ['afx_dash', 'afx_slash', 'afx_smoke', 'afx_flurry', 'afx_execute', 'afx_kunai', 'afx_venom', 'afx_fangs'],
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
    this.heroX = 84;
    this.heroBaseX = 84;
    this.heroY = 138;
    this.afterimages = [];
    this.summons = [];
    this.clones = [];
    this.mobs = [];
    this.fx = [];
    this.popups = [];
    this.atlasCache = new Map();
    this.imgCache = new Map();
    this.mobAtlas = null;
    this.summonAtlas = null;
    this.onSkillChange = null;
    this._ensureMobAtlas();
    this._ensureSummonAtlas();
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
    return this._getImg(`./assets/fx/${key}.png?v=77`);
  }

  _preloadClassFx(classId) {
    const keys = CLASS_FX_PRELOAD[classId] || [];
    keys.forEach((k) => this._getFxImg(k));
  }

  _ensureMobAtlas() {
    this.mobAtlas = this._loadAtlas('./assets/monsters/atlas_ch1.png', './assets/monsters/atlas_ch1.json');
  }

  _ensureSummonAtlas() {
    this.summonAtlas = this._loadAtlas('./assets/heroes/atlas_summons.png', './assets/heroes/atlas_summons.json');
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
    this.summons = [];
    this.clones = [];
    this.onSkillChange = onSkillChange;
    this._getImg(CLASS_BG_MAP[this.classId] || CLASS_BG_MAP.warrior);
    this._loadAtlas(`./assets/heroes/atlas_${this.classId}.png?v=66`, `./assets/heroes/atlas_${this.classId}.json?v=66`);
    this._preloadClassFx(this.classId);
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
    const spots = [{ x: 258, y: 112 }, { x: 312, y: 136 }, { x: 270, y: 162 }];
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
      waitMs: 0,
      maxLife: opts.maxLife ?? 720,
      orbit: opts.orbit || null,
    });
  }

  _spawnSummon(kind, x, y, tx, ty, lifeMs, frenzy = false) {
    this.summons.push({
      kind,
      x,
      y,
      tx,
      ty,
      life: 0,
      maxLife: lifeMs,
      frenzy,
      exploded: false,
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
    const cx = 276;
    const cy = 132;
    const hx = this.heroBaseX;
    const hy = this.heroY;
    this.clones = [];

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

    if (this.classId === 'warrior') {
      if (id === 'whirlwind') {
        this._addSpriteFx('wfx_whirl_outer', { x: cx - 22, y: cy, size: 155, scaleStart: 0.85, scaleEnd: 1.15, rotSpeed: 7, maxLife: 1150 });
        this._addSpriteFx('wfx_whirl_inner', { x: cx - 22, y: cy, size: 122, scaleStart: 0.8, scaleEnd: 1.1, rotSpeed: -9, maxLife: 1150 });
        this._addSpriteFx('wfx_whirl_wind', { x: cx - 22, y: cy + 12, size: 160, scaleStart: 0.9, scaleEnd: 1.2, rotSpeed: 5, maxLife: 1150, alpha: 0.85 });
      } else if (id === 'earthshatter') {
        this._addSpriteFx('wfx_lava_crack', { x: cx, y: cy + 16, size: 140, scaleStart: 0.8, scaleEnd: 1.1, maxLife: 1150, add: false });
        this._addSpriteFx('wfx_slam_pillar', { x: cx, y: cy - 30, size: 135, scaleStart: 0.7, scaleEnd: 1.2, maxLife: 820 });
        this._addSpriteFx('wfx_lava_ring', { x: cx, y: cy + 10, size: 150, scaleStart: 0.45, scaleEnd: 1.3, maxLife: 900 });
        this._addSpriteFx('wfx_rubble', { x: cx, y: cy, size: 125, scaleStart: 0.7, scaleEnd: 1.2, maxLife: 820, add: false });
      } else if (id === 'bloodcharge') {
        this._addSpriteFx('wfx_charge_aura', { x: 165, y: hy - 10, size: 120, scaleStart: 0.9, scaleEnd: 1.15, maxLife: 720 });
        this._addSpriteFx('wfx_fire_trail', { x: 185, y: hy, size: 130, scaleStart: 0.9, scaleEnd: 1.1, maxLife: 750 });
        this._addSpriteFx('wfx_blood_ring', { x: cx - 20, y: cy, size: 140, scaleStart: 0.5, scaleEnd: 1.25, maxLife: 860, delay: 120 });
      } else if (id === 'bladestorm') {
        for (let i = -1; i <= 1; i++) {
          this._addSpriteFx('wfx_blade_wave', { x: hx + 28, y: hy - 14 + i * 16, vx: 290, vy: i * 32, size: 90, scaleStart: 0.85, scaleEnd: 1.15, rot: i * 0.14, maxLife: 800 });
        }
        this._addSpriteFx('wfx_wave_trail', { x: hx + 60, y: hy - 10, vx: 220, size: 100, scaleStart: 0.8, scaleEnd: 1.1, maxLife: 700 });
      } else if (id === 'warcry') {
        this._addSpriteFx('nfx_warcry', { x: hx + 10, y: hy - 12, size: 150, scaleStart: 0.55, scaleEnd: 1.35, maxLife: 950 });
        this._addSpriteFx('wfx_blood_ring', { x: hx + 10, y: hy, size: 140, scaleStart: 0.4, scaleEnd: 1.35, maxLife: 900 });
      } else if (id === 'execute_cleave') {
        this._addSpriteFx('wfx_cleave', { x: cx - 10, y: cy - 8, size: 150, scaleStart: 0.75, scaleEnd: 1.25, rot: -0.35, maxLife: 720 });
        this._addSpriteFx('wfx_blood_ring', { x: cx, y: cy + 8, size: 135, scaleStart: 0.5, scaleEnd: 1.2, maxLife: 850 });
        this._addSpriteFx('wfx_sparks', { x: cx, y: cy - 8, size: 120, scaleStart: 0.7, scaleEnd: 1.3, maxLife: 720 });
      } else if (id === 'volcano_totem') {
        this._addSpriteFx('nfx_totem', { x: cx - 22, y: cy, size: 110, scaleStart: 0.85, scaleEnd: 1.05, maxLife: 1350 });
        this._addSpriteFx('wfx_lava_ring', { x: cx, y: cy + 12, size: 150, scaleStart: 0.5, scaleEnd: 1.25, maxLife: 980, delay: 140 });
        this._addSpriteFx('mfx_meteor_flame', { x: cx, y: cy - 18, size: 125, scaleStart: 0.7, scaleEnd: 1.2, maxLife: 950, delay: 180 });
      } else {
        // earth_stomp
        this._addSpriteFx('wfx_lava_crack', { x: cx, y: cy + 14, size: 155, scaleStart: 0.7, scaleEnd: 1.2, maxLife: 1100, add: false });
        this._addSpriteFx('wfx_lava_ring', { x: cx, y: cy + 10, size: 170, scaleStart: 0.45, scaleEnd: 1.35, maxLife: 950 });
        this._addSpriteFx('wfx_rubble', { x: cx, y: cy, size: 145, scaleStart: 0.7, scaleEnd: 1.2, maxLife: 880, add: false });
      }
    } else if (this.classId === 'ranger') {
      if (id === 'volley') {
        this._addSpriteFx('rfx_wind_trail', { x: hx + 25, y: hy - 14, size: 100, scaleStart: 0.8, scaleEnd: 1.15, maxLife: 680 });
        for (let i = -2; i <= 2; i++) {
          this._addSpriteFx('rfx_arrow', { x: hx + 24, y: hy - 16 + i * 7, vx: 340, vy: i * 36, size: 62, scaleStart: 0.9, scaleEnd: 1.05, rot: i * 0.11, maxLife: 680 });
        }
        this._addSpriteFx('rfx_pierce_flash', { x: cx, y: cy - 8, size: 110, scaleStart: 0.6, scaleEnd: 1.2, maxLife: 650, delay: 180 });
      } else if (id === 'arrowrain') {
        this._addSpriteFx('rfx_rain_sigil', { x: cx, y: cy + 16, size: 155, scaleStart: 0.7, scaleEnd: 1.15, maxLife: 1200 });
        for (let i = 0; i < 4; i++) {
          const ox = cx - 42 + i * 28;
          this._addSpriteFx('rfx_rain_fall', { x: ox, y: 20, vy: 210, size: 98, scaleStart: 0.9, scaleEnd: 1.05, delay: i * 90, maxLife: 660 });
          this._addSpriteFx('rfx_rain_impact', { x: ox, y: cy + 12, size: 98, scaleStart: 0.5, scaleEnd: 1.2, delay: 190 + i * 90, maxLife: 620 });
        }
        this._addSpriteFx('rfx_leaf_sparks', { x: cx, y: cy, size: 135, scaleStart: 0.6, scaleEnd: 1.25, delay: 200, maxLife: 900 });
      } else if (id === 'shadowstep') {
        this._addSpriteFx('rfx_shadow_smoke', { x: hx + 20, y: hy, size: 115, scaleStart: 0.7, scaleEnd: 1.2, maxLife: 760, add: false });
        this._addSpriteFx('rfx_trap_rune', { x: cx - 30, y: cy + 12, size: 120, scaleStart: 0.8, scaleEnd: 1.1, maxLife: 1100 });
        this._addSpriteFx('rfx_poison_burst', { x: cx, y: cy, size: 140, scaleStart: 0.5, scaleEnd: 1.25, delay: 180, maxLife: 850 });
      } else if (id === 'phantombow') {
        this._addSpriteFx('rfx_charge_bow', { x: hx + 18, y: hy - 14, size: 110, scaleStart: 0.8, scaleEnd: 1.15, maxLife: 680 });
        this._addSpriteFx('rfx_sonic_ring', { x: hx + 60, y: hy - 14, size: 105, scaleStart: 0.5, scaleEnd: 1.3, maxLife: 700, delay: 120 });
        this._addSpriteFx('rfx_phantom_dragon', { x: hx + 40, y: hy - 14, vx: 280, size: 140, scaleStart: 0.9, scaleEnd: 1.15, maxLife: 820, delay: 140 });
      } else if (id === 'windwalk') {
        this._addSpriteFx('rfx_dodge_aura', { x: hx + 15, y: hy - 10, size: 130, scaleStart: 0.7, scaleEnd: 1.25, maxLife: 980 });
        this._addSpriteFx('rfx_wind_trail', { x: cx - 30, y: cy, size: 135, scaleStart: 0.8, scaleEnd: 1.2, maxLife: 850 });
        this._addSpriteFx('rfx_emerald_star', { x: cx, y: cy - 8, size: 120, scaleStart: 0.5, scaleEnd: 1.3, maxLife: 850, delay: 100 });
      } else if (id === 'caltrops') {
        this._addSpriteFx('nfx_caltrops', { x: cx, y: cy + 12, size: 150, scaleStart: 0.75, scaleEnd: 1.15, maxLife: 1300 });
        this._addSpriteFx('rfx_poison_burst', { x: cx, y: cy, size: 130, scaleStart: 0.5, scaleEnd: 1.2, delay: 160, maxLife: 860 });
      } else if (id === 'shadow_clones') {
        this.clones = [
          { x: hx + 16, y: hy - 34, life: 0, maxLife: 1400 },
          { x: hx + 20, y: hy + 24, life: 0, maxLife: 1400 },
        ];
        this._addSpriteFx('rfx_shadow_smoke', { x: hx + 25, y: hy - 10, size: 115, scaleStart: 0.7, scaleEnd: 1.2, maxLife: 780, add: false });
        for (let i = -1; i <= 1; i++) {
          this._addSpriteFx('rfx_beam', { x: hx + 45, y: hy - 14 + i * 24, vx: 330, vy: i * 16, size: 80, scaleStart: 0.9, scaleEnd: 1.05, maxLife: 700, delay: 80 });
        }
      } else {
        // death_mark
        this._addSpriteFx('nfx_deathmark', { x: cx, y: cy - 28, size: 115, scaleStart: 0.65, scaleEnd: 1.2, maxLife: 1100 });
        this._addSpriteFx('rfx_beam', { x: hx + 25, y: hy - 16, vx: 360, size: 85, scaleStart: 0.9, scaleEnd: 1.1, maxLife: 680 });
        this._addSpriteFx('rfx_emerald_star', { x: cx, y: cy - 6, size: 115, scaleStart: 0.5, scaleEnd: 1.25, delay: 180, maxLife: 750 });
      }
    } else if (this.classId === 'mage') {
      if (id === 'meteor') {
        this._addSpriteFx('mfx_nova_ring', { x: cx, y: cy + 16, size: 155, scaleStart: 0.6, scaleEnd: 1.25, maxLife: 1000 });
        this._addSpriteFx('mfx_meteor_rock', { x: cx - 75, y: 12, vx: 165, vy: 250, size: 115, scaleStart: 0.85, scaleEnd: 1.15, maxLife: 520 });
        this._addSpriteFx('mfx_meteor_crater', { x: cx, y: cy + 16, size: 140, scaleStart: 0.85, scaleEnd: 1.1, delay: 460, maxLife: 950, add: false });
        this._addSpriteFx('mfx_meteor_blast', { x: cx, y: cy - 12, size: 170, scaleStart: 0.6, scaleEnd: 1.35, delay: 460, maxLife: 820 });
        this._addSpriteFx('mfx_meteor_flame', { x: cx, y: cy - 24, size: 145, scaleStart: 0.7, scaleEnd: 1.2, delay: 490, maxLife: 880 });
      } else if (id === 'arcane_orb') {
        this._addSpriteFx('mfx_star_sigil', { x: hx + 16, y: hy - 12, size: 115, scaleStart: 0.6, scaleEnd: 1.2, maxLife: 760 });
        for (let i = -1; i <= 1; i++) {
          this._addSpriteFx('mfx_orb', { x: hx + 26, y: hy - 14 + i * 16, vx: 255, vy: i * 24, size: 82, scaleStart: 0.8, scaleEnd: 1.1, rotSpeed: 6, maxLife: 860 });
        }
      } else if (id === 'frost_nova') {
        this._addSpriteFx('mfx_frost_ring', { x: cx, y: cy + 10, size: 170, scaleStart: 0.45, scaleEnd: 1.35, maxLife: 920 });
        this._addSpriteFx('mfx_frost_shard', { x: cx, y: cy - 14, size: 145, scaleStart: 0.7, scaleEnd: 1.25, maxLife: 800 });
        this._addSpriteFx('mfx_frost_burst', { x: cx, y: cy - 6, size: 145, scaleStart: 0.6, scaleEnd: 1.3, maxLife: 840, delay: 80 });
      } else if (id === 'void_beam') {
        this._addSpriteFx('mfx_void_core', { x: hx + 30, y: hy - 18, size: 110, scaleStart: 0.7, scaleEnd: 1.2, maxLife: 850 });
        this._addSpriteFx('mfx_void_beam', { x: 200, y: hy - 18, size: 195, scaleStart: 0.9, scaleEnd: 1.1, maxLife: 800 });
        this._addSpriteFx('mfx_void_slash', { x: cx, y: cy - 10, size: 130, scaleStart: 0.7, scaleEnd: 1.25, maxLife: 740, delay: 120 });
      } else if (id === 'mana_overload') {
        this._addSpriteFx('nfx_overload', { x: hx + 12, y: hy - 16, size: 155, scaleStart: 0.6, scaleEnd: 1.35, maxLife: 1000 });
        this._addSpriteFx('mfx_arcane_shield', { x: hx + 12, y: hy - 12, size: 130, scaleStart: 0.75, scaleEnd: 1.2, maxLife: 980 });
        this._addSpriteFx('mfx_star_sigil', { x: cx, y: cy, size: 135, scaleStart: 0.6, scaleEnd: 1.25, maxLife: 900, delay: 120 });
      } else if (id === 'chain_lightning') {
        this._addSpriteFx('nfx_lightning', { x: 185, y: 118, size: 180, scaleStart: 0.85, scaleEnd: 1.15, rot: -0.08, maxLife: 780 });
        this._addSpriteFx('nfx_lightning', { x: cx, y: cy - 10, size: 130, scaleStart: 0.8, scaleEnd: 1.2, rot: 0.95, maxLife: 780, delay: 100 });
        this._addSpriteFx('mfx_spark', { x: cx, y: cy - 8, size: 120, scaleStart: 0.6, scaleEnd: 1.3, maxLife: 740 });
      } else if (id === 'icicle_rain') {
        this._addSpriteFx('mfx_frost_ring', { x: cx, y: cy + 14, size: 155, scaleStart: 0.6, scaleEnd: 1.25, maxLife: 980 });
        for (let i = 0; i < 4; i++) {
          const ox = cx - 40 + i * 26;
          this._addSpriteFx('nfx_icicles', { x: ox, y: 22, vy: 220, size: 105, scaleStart: 0.9, scaleEnd: 1.1, delay: i * 90, maxLife: 680 });
          this._addSpriteFx('mfx_frost_burst', { x: ox, y: cy + 6, size: 98, scaleStart: 0.5, scaleEnd: 1.2, delay: 180 + i * 90, maxLife: 620 });
        }
      } else {
        // black_hole
        this._addSpriteFx('nfx_blackhole', { x: cx, y: cy - 8, size: 160, scaleStart: 0.6, scaleEnd: 1.25, rotSpeed: -5, maxLife: 1200 });
        this._addSpriteFx('mfx_void_core', { x: cx, y: cy - 8, size: 125, scaleStart: 0.5, scaleEnd: 1.3, rotSpeed: 4, maxLife: 1000, delay: 160 });
      }
    } else if (this.classId === 'paladin') {
      if (id === 'blessed_hammer') {
        for (let i = 0; i < 3; i++) {
          this._addSpriteFx('pfx_hammer', {
            size: 66,
            scaleStart: 0.95,
            scaleEnd: 1.1,
            rotSpeed: 10,
            maxLife: 1250,
            orbit: { cx: cx - 35, cy: cy - 10, startR: 28, endR: 92, startAng: (Math.PI * 2 * i) / 3, speed: 6.2 },
          });
        }
      } else if (id === 'heaven_fist') {
        this._addSpriteFx('pfx_heaven', { x: cx, y: cy - 34, size: 150, scaleStart: 0.75, scaleEnd: 1.25, maxLife: 880 });
        this._addSpriteFx('pfx_judgment', { x: cx, y: cy + 8, size: 140, scaleStart: 0.5, scaleEnd: 1.25, maxLife: 920, delay: 140 });
      } else if (id === 'judgment') {
        this._addSpriteFx('pfx_judgment', { x: cx, y: cy - 6, size: 160, scaleStart: 0.55, scaleEnd: 1.3, maxLife: 960 });
        this._addSpriteFx('pfx_slash', { x: cx, y: cy - 12, size: 120, scaleStart: 0.7, scaleEnd: 1.2, maxLife: 720, delay: 100 });
      } else if (id === 'divine_storm') {
        this._addSpriteFx('pfx_storm', { x: cx - 18, y: cy - 8, size: 165, scaleStart: 0.55, scaleEnd: 1.3, rotSpeed: 4, maxLife: 980 });
        this._addSpriteFx('pfx_slash', { x: cx, y: cy - 10, size: 130, scaleStart: 0.7, scaleEnd: 1.2, rotSpeed: -6, maxLife: 820 });
      } else if (id === 'shield_bash') {
        this._addSpriteFx('pfx_bash', { x: cx - 22, y: cy - 8, size: 135, scaleStart: 0.75, scaleEnd: 1.25, maxLife: 760 });
        this._addSpriteFx('pfx_aegis', { x: 205, y: hy - 10, size: 120, scaleStart: 0.7, scaleEnd: 1.15, maxLife: 850 });
      } else if (id === 'holy_aegis') {
        this._addSpriteFx('pfx_aegis', { x: hx + 10, y: hy - 14, size: 150, scaleStart: 0.7, scaleEnd: 1.2, maxLife: 1150 });
        this._addSpriteFx('pfx_consecration', { x: hx + 10, y: hy + 12, size: 140, scaleStart: 0.6, scaleEnd: 1.2, maxLife: 1050 });
      } else if (id === 'consecration') {
        this._addSpriteFx('pfx_consecration', { x: cx, y: cy + 12, size: 170, scaleStart: 0.65, scaleEnd: 1.2, maxLife: 1250 });
        this._addSpriteFx('pfx_heaven', { x: cx, y: cy - 28, size: 125, scaleStart: 0.7, scaleEnd: 1.15, maxLife: 880, delay: 140 });
      } else {
        // radiant_aura
        this._addSpriteFx('pfx_storm', { x: hx + 15, y: hy - 8, size: 155, scaleStart: 0.55, scaleEnd: 1.35, maxLife: 980 });
        this._addSpriteFx('pfx_judgment', { x: cx, y: cy, size: 140, scaleStart: 0.6, scaleEnd: 1.25, maxLife: 920, delay: 100 });
      }
    } else if (this.classId === 'necro') {
      if (id === 'raise_skeleton') {
        this._addSpriteFx('sfx_skel_summon', { x: hx + 35, y: hy + 6, size: 130, scaleStart: 0.6, scaleEnd: 1.2, maxLife: 920 });
        this._addSpriteFx('nfx_p_summon', { x: hx + 55, y: hy + 10, size: 120, scaleStart: 0.7, scaleEnd: 1.15, maxLife: 980 });
        this._spawnSummon('skeleton', hx + 46, hy - 14, 232, 114, 2100);
        this._spawnSummon('skeleton', hx + 54, hy + 16, 240, 152, 2100);
        this._addSpriteFx('sfx_skel_slash', { x: cx - 10, y: cy - 8, size: 120, scaleStart: 0.7, scaleEnd: 1.25, maxLife: 720, delay: 480 });
      } else if (id === 'blood_golem') {
        this._addSpriteFx('sfx_golem_summon', { x: hx + 62, y: hy + 4, size: 145, scaleStart: 0.65, scaleEnd: 1.25, maxLife: 980 });
        this._spawnSummon('golem', hx + 58, hy, 228, 134, 2200);
        this._addSpriteFx('sfx_golem_slam', { x: cx - 12, y: cy + 8, size: 150, scaleStart: 0.6, scaleEnd: 1.3, maxLife: 820, delay: 560 });
        this._addSpriteFx('sfx_blood_leech', { x: hx + 16, y: hy - 10, size: 105, scaleStart: 0.7, scaleEnd: 1.2, maxLife: 780, delay: 600 });
      } else if (id === 'undead_frenzy') {
        if (!this.summons.some((s) => s.kind !== 'wraith')) {
          this._spawnSummon('skeleton', hx + 90, hy - 14, 234, 114, 1900, true);
          this._spawnSummon('skeleton', hx + 96, hy + 14, 242, 150, 1900, true);
        } else {
          this.summons.forEach((s) => { s.frenzy = true; });
        }
        this._addSpriteFx('sfx_frenzy', { x: hx + 30, y: hy, size: 155, scaleStart: 0.6, scaleEnd: 1.35, maxLife: 980 });
        this._addSpriteFx('sfx_skel_slash', { x: cx - 10, y: cy - 6, size: 135, scaleStart: 0.7, scaleEnd: 1.25, maxLife: 760, delay: 220 });
      } else if (id === 'wraith_army') {
        this._spawnSummon('wraith', hx + 32, hy - 22, 256, 112, 1100);
        this._spawnSummon('wraith', hx + 38, hy, 306, 136, 1180);
        this._spawnSummon('wraith', hx + 32, hy + 20, 266, 160, 1150);
        this._addSpriteFx('nfx_p_summon', { x: hx + 30, y: hy, size: 120, scaleStart: 0.7, scaleEnd: 1.2, maxLife: 760 });
        this._addSpriteFx('sfx_wraith_boom', { x: cx, y: cy - 6, size: 155, scaleStart: 0.6, scaleEnd: 1.35, maxLife: 820, delay: 480 });
      } else if (id === 'bone_spear') {
        for (let i = -1; i <= 1; i++) {
          this._addSpriteFx('nfx_p_spear', { x: hx + 25, y: hy - 14 + i * 12, vx: 330, vy: i * 16, size: 92, scaleStart: 0.9, scaleEnd: 1.05, maxLife: 720 });
        }
        this._addSpriteFx('nfx_p_slash', { x: cx, y: cy - 10, size: 120, scaleStart: 0.7, scaleEnd: 1.2, maxLife: 680, delay: 160 });
      } else if (id === 'corpse_explosion') {
        this._addSpriteFx('nfx_p_corpse', { x: cx, y: cy - 6, size: 160, scaleStart: 0.55, scaleEnd: 1.35, maxLife: 920 });
        this._addSpriteFx('sfx_wraith_boom', { x: cx, y: cy - 12, size: 140, scaleStart: 0.6, scaleEnd: 1.25, maxLife: 840, delay: 100 });
      } else if (id === 'bone_prison') {
        this._addSpriteFx('nfx_p_prison', { x: cx, y: cy + 6, size: 155, scaleStart: 0.7, scaleEnd: 1.15, maxLife: 1200 });
        this._addSpriteFx('nfx_p_spear', { x: cx, y: cy - 12, size: 110, scaleStart: 0.8, scaleEnd: 1.1, maxLife: 780, delay: 180 });
      } else {
        // decrepify
        this._addSpriteFx('nfx_p_curse', { x: cx, y: cy + 8, size: 165, scaleStart: 0.6, scaleEnd: 1.25, maxLife: 1150 });
        this._addSpriteFx('sfx_blood_leech', { x: hx + 20, y: hy - 10, size: 110, scaleStart: 0.7, scaleEnd: 1.2, maxLife: 820, delay: 140 });
      }
    } else if (this.classId === 'assassin') {
      if (id === 'shadow_blitz') {
        this._addSpriteFx('afx_dash', { x: 175, y: hy - 10, size: 125, scaleStart: 0.85, scaleEnd: 1.15, maxLife: 700 });
        this._addSpriteFx('afx_slash', { x: cx - 10, y: cy - 10, size: 140, scaleStart: 0.7, scaleEnd: 1.25, maxLife: 720, delay: 100 });
      } else if (id === 'shadow_clones') {
        this.clones = [
          { x: cx - 55, y: cy - 28, life: 0, maxLife: 1350 },
          { x: cx - 50, y: cy + 26, life: 0, maxLife: 1350 },
        ];
        this._addSpriteFx('afx_smoke', { x: hx + 30, y: hy, size: 125, scaleStart: 0.7, scaleEnd: 1.2, maxLife: 800, add: false });
        this._addSpriteFx('afx_slash', { x: cx, y: cy - 12, size: 135, scaleStart: 0.75, scaleEnd: 1.2, rot: 0.4, maxLife: 720, delay: 120 });
        this._addSpriteFx('afx_slash', { x: cx, y: cy - 6, size: 135, scaleStart: 0.75, scaleEnd: 1.2, rot: -0.4, maxLife: 720, delay: 200 });
      } else if (id === 'blade_flurry') {
        for (let i = 0; i < 3; i++) {
          this._addSpriteFx('afx_flurry', { x: cx, y: cy - 6, size: 150, scaleStart: 0.7, scaleEnd: 1.25, rot: i * 0.9, rotSpeed: 6, maxLife: 780, delay: i * 110 });
        }
      } else if (id === 'shadow_execute') {
        this._addSpriteFx('afx_execute', { x: cx, y: cy - 10, size: 170, scaleStart: 0.65, scaleEnd: 1.3, maxLife: 920 });
        this._addSpriteFx('afx_slash', { x: cx, y: cy - 10, size: 135, scaleStart: 0.75, scaleEnd: 1.2, maxLife: 720, delay: 120 });
      } else if (id === 'poison_kunai') {
        for (let i = -2; i <= 2; i++) {
          this._addSpriteFx('afx_kunai', { x: hx + 25, y: hy - 14 + i * 6, vx: 330, vy: i * 36, size: 65, scaleStart: 0.9, scaleEnd: 1.05, rot: i * 0.12, maxLife: 680 });
        }
        this._addSpriteFx('afx_venom', { x: cx, y: cy - 6, size: 125, scaleStart: 0.6, scaleEnd: 1.25, maxLife: 780, delay: 180 });
      } else if (id === 'smoke_veil') {
        this._addSpriteFx('afx_smoke', { x: hx + 15, y: hy, size: 155, scaleStart: 0.65, scaleEnd: 1.3, maxLife: 1000, add: false });
        this._addSpriteFx('afx_dash', { x: cx - 25, y: cy - 8, size: 120, scaleStart: 0.75, scaleEnd: 1.2, maxLife: 760, delay: 140 });
      } else if (id === 'venom_burst') {
        this._addSpriteFx('afx_venom', { x: cx, y: cy - 8, size: 165, scaleStart: 0.55, scaleEnd: 1.35, maxLife: 940 });
        this._addSpriteFx('afx_kunai', { x: cx, y: cy - 8, size: 100, scaleStart: 0.7, scaleEnd: 1.2, maxLife: 740, delay: 100 });
      } else {
        // lethal_fangs
        this._addSpriteFx('afx_fangs', { x: cx - 10, y: cy - 8, size: 155, scaleStart: 0.7, scaleEnd: 1.3, maxLife: 880 });
        this._addSpriteFx('afx_execute', { x: cx, y: cy - 8, size: 135, scaleStart: 0.65, scaleEnd: 1.2, maxLife: 820, delay: 120 });
      }
    }

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

    // 2. 英雄角色、殘影與暗影分身
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

        this.clones = this.clones.filter((cl) => {
          cl.life += 16;
          if (cl.life >= cl.maxLife) return false;
          const af = heroAtlas.frames[`${pf}_right_atk_${Math.floor((now / 95) % 4)}`]?.frame || fr;
          ctx.save();
          ctx.globalAlpha = 0.68 * (1 - cl.life / cl.maxLife);
          ctx.filter = 'hue-rotate(250deg) brightness(1.25)';
          ctx.drawImage(heroAtlas.img, af.x, af.y, af.w, af.h, cl.x - 46, cl.y - 65, 92, 92);
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

    // 3. 死靈法師真實召喚物實體（骷髏戰士 / 鮮血魔像 / 冥界幽魂）
    if (this.summonAtlas?.ready) {
      this.summons = this.summons.filter((s) => {
        s.life += 16;
        if (s.life >= s.maxLife) return false;
        const speed = s.kind === 'wraith' ? 0.09 : (s.frenzy ? 0.08 : 0.055);
        s.x += (s.tx - s.x) * speed;
        s.y += (s.ty - s.y) * speed;
        const dist = Math.hypot(s.tx - s.x, s.ty - s.y);
        const fIdx = Math.floor((now / (s.frenzy ? 85 : 120)) % 4);
        let frameName = '';
        let size = 68;
        if (s.kind === 'wraith') {
          frameName = dist < 24 ? `wraith_atk_${fIdx}` : `wraith_walk_${fIdx}`;
          size = 66;
        } else if (s.kind === 'golem') {
          frameName = dist < 28 ? `gol_right_atk_${fIdx}` : `gol_right_walk_${fIdx}`;
          size = 96;
        } else {
          frameName = dist < 26 ? `skel_right_atk_${fIdx}` : `skel_right_walk_${fIdx}`;
          size = 70;
        }
        const fr = this.summonAtlas.frames[frameName]?.frame;
        if (fr) {
          ctx.save();
          if (s.frenzy) ctx.filter = 'drop-shadow(0 0 6px #ef4444) saturate(1.8)';
          ctx.fillStyle = 'rgba(0,0,0,0.42)';
          ctx.beginPath();
          ctx.ellipse(s.x, s.y + 12, size * 0.24, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.drawImage(this.summonAtlas.img, fr.x, fr.y, fr.w, fr.h, s.x - size / 2, s.y - size * 0.72, size, size);
          ctx.restore();
        }
        return true;
      });
    }

    // 4. 怪物實體
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

    // 5. 真實 PNG 技能特效層（等待貼圖 ready 後才扣生命週期，確保不漏播）
    this.fx = this.fx.filter((f) => {
      if (f.delay && f.delay > 0) {
        f.delay -= 16;
        return true;
      }
      const rec = this._getFxImg(f.key);
      if (!rec?.ready) {
        f.waitMs += 16;
        return f.waitMs < 2500;
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
      return true;
    });

    // 6. 傷害浮字
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
