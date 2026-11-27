// v299: 創角大廳 2.5D 三層景深實戰技能演武引擎（HeroSkillShowcase）
// 全面同步六大職業最新 4×4 十六幀手繪 RGBA 序列幀（seq16_*）、地表貼花（decal_*）、手繪投射物（proj_*）與頭頂高對比暴擊數字
import { WARRIOR_SKILLS } from '../data/warriorSkills.js?v=235';
import { RANGER_SKILLS } from '../data/rangerSkills.js?v=236';
import { MAGE_SKILLS } from '../data/mageSkills.js?v=241';
import { PALADIN_SKILLS } from '../data/paladinSkills.js?v=235';
import { NECRO_SKILLS } from '../data/necroSkills.js?v=236';
import { ASSASSIN_SKILLS } from '../data/assassinSkills.js?v=235';

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

// 六大職業實戰最新 2.5D seq16 + decal + proj 精確映射（100% 對齊實戰 VfxDirector 資產）
const CLASS_V299_VFX = {
  warrior: {
    color: '#fb923c',
    seqs: ['seq16_w_whirlwind', 'seq16_w_hammer_slam', 'seq16_w_rend_burst', 'seq16_w_earth_stomp', 'seq16_w_fissure', 'seq16_w_warcry', 'seq16_w_maelstrom', 'seq16_w_execute'],
    decals: ['decal_w_crater', 'decal_w_lava', 'decal_w_blood', 'decal_w_rune'],
    projs: ['proj_w_flame_wave', 'proj_w_rock_shard', 'proj_w_chain_hook'],
    bySkillId: {
      whirlwind:  { seq: 'seq16_w_whirlwind',  decal: 'decal_w_crater', selfCentered: true, scale: 1.35 },
      earthquake: { seq: 'seq16_w_fissure',    decal: 'decal_w_lava',   scale: 1.40 },
      warcry:     { seq: 'seq16_w_warcry',     decal: 'decal_w_rune',   selfCentered: true, scale: 1.30 },
      bleed_slash:{ seq: 'seq16_w_rend_burst', decal: 'decal_w_blood',  proj: 'proj_w_flame_wave', scale: 1.25 },
      charge:     { seq: 'seq16_w_earth_stomp',decal: 'decal_w_crater', dash: true, scale: 1.28 },
      ancients:   { seq: 'seq16_w_hammer_slam',decal: 'decal_w_lava',   scale: 1.45 },
    },
  },
  ranger: {
    color: '#4ade80',
    seqs: ['seq16_r_arrow_storm', 'seq16_r_venom_burst', 'seq16_r_shadow_boom', 'seq16_r_frost_barrage', 'seq16_r_phantom_beam', 'seq16_r_death_trap', 'seq16_r_smoke_bomb', 'seq16_r_void_rift'],
    decals: ['decal_r_arrows', 'decal_r_venom', 'decal_r_shadow', 'decal_r_trap'],
    projs: ['proj_r_emerald_arrow', 'proj_r_shadow_arrow', 'proj_r_venom_spear'],
    bySkillId: {
      volley:        { seq: 'seq16_r_frost_barrage', decal: 'decal_r_arrows', proj: 'proj_r_emerald_arrow', multiProj: 3, scale: 1.25 },
      arrowrain:     { seq: 'seq16_r_arrow_storm',   decal: 'decal_r_arrows', scale: 1.45 },
      phantombow:    { seq: 'seq16_r_phantom_beam',  decal: 'decal_r_shadow', proj: 'proj_r_shadow_arrow', scale: 1.42 },
      r_venom_pierce:{ seq: 'seq16_r_venom_burst',   decal: 'decal_r_venom',  proj: 'proj_r_venom_spear', scale: 1.30 },
      caltrops:      { seq: 'seq16_r_death_trap',    decal: 'decal_r_trap',   scale: 1.28 },
      death_mark:    { seq: 'seq16_r_void_rift',     decal: 'decal_r_shadow', scale: 1.38 },
      shadowstep:    { seq: 'seq16_r_smoke_bomb',    decal: 'decal_r_shadow', dash: true, scale: 1.25 },
      shadow_clones: { seq: 'seq16_r_shadow_boom',   decal: 'decal_r_shadow', scale: 1.35 },
    },
  },
  mage: {
    color: '#38bdf8',
    seqs: ['seq16_m_meteor', 'seq16_m_frost_nova', 'seq16_m_lightning_strike', 'seq16_m_inferno', 'seq16_m_fireball_blast', 'seq16_m_blizzard', 'seq16_m_firewall', 'seq16_m_ball_lightning', 'seq16_m_supernova'],
    decals: ['decal_m_scorch', 'decal_m_frost', 'decal_m_lightning', 'decal_m_void'],
    projs: ['proj_m_fireball', 'proj_m_frozen_orb', 'proj_m_ice_lance', 'proj_m_fire_bolt'],
    bySkillId: {
      m_frozen_orb:       { seq: 'seq16_m_blizzard',         decal: 'decal_m_frost',     proj: 'proj_m_frozen_orb', scale: 1.38 },
      frost_nova:         { seq: 'seq16_m_frost_nova',       decal: 'decal_m_frost',     selfCentered: true, scale: 1.42 },
      m_deep_freeze:      { seq: 'seq16_m_blizzard',         decal: 'decal_m_frost',     proj: 'proj_m_ice_lance', scale: 1.45 },
      m_fireball:         { seq: 'seq16_m_fireball_blast',   decal: 'decal_m_scorch',    proj: 'proj_m_fireball', scale: 1.36 },
      m_flame_hydra:      { seq: 'seq16_m_firewall',         decal: 'decal_m_scorch',    proj: 'proj_m_fire_bolt', scale: 1.35 },
      m_inferno:          { seq: 'seq16_m_inferno',          decal: 'decal_m_scorch',    scale: 1.48 },
      chain_lightning:    { seq: 'seq16_m_lightning_strike', decal: 'decal_m_lightning', scale: 1.40 },
      m_ball_lightning:   { seq: 'seq16_m_ball_lightning',   decal: 'decal_m_lightning', scale: 1.36 },
      m_unstable_currents:{ seq: 'seq16_m_supernova',        decal: 'decal_m_void',      scale: 1.50 },
      meteor:             { seq: 'seq16_m_meteor',           decal: 'decal_m_scorch',    scale: 1.50 },
    },
  },
  paladin: {
    color: '#fde047',
    seqs: ['seq16_p_holy_slash', 'seq16_p_heaven_pillar', 'seq16_p_divine_storm', 'seq16_p_judgment_cross', 'seq16_p_shield_bash', 'seq16_p_condemn_vortex', 'seq16_p_thorns_burst', 'seq16_p_verdict_sword'],
    decals: ['decal_p_consecration', 'decal_p_cross_crater', 'decal_p_sanctuary', 'decal_p_aegis_ring'],
    projs: ['proj_p_justice_hammer', 'proj_p_holy_lance', 'proj_p_holy_bolt'],
    bySkillId: {
      hammer:       { seq: 'seq16_p_divine_storm',   decal: 'decal_p_consecration', proj: 'proj_p_justice_hammer', multiProj: 2, scale: 1.35 },
      consecration: { seq: 'seq16_p_condemn_vortex', decal: 'decal_p_consecration', scale: 1.40 },
      judgment:     { seq: 'seq16_p_judgment_cross', decal: 'decal_p_cross_crater', scale: 1.45 },
      aegis:        { seq: 'seq16_p_thorns_burst',   decal: 'decal_p_aegis_ring',   selfCentered: true, scale: 1.32 },
      holy_storm:   { seq: 'seq16_p_holy_slash',     decal: 'decal_p_sanctuary',    proj: 'proj_p_holy_lance', scale: 1.36 },
      heaven_fury:  { seq: 'seq16_p_heaven_pillar',  decal: 'decal_p_cross_crater', scale: 1.50 },
    },
  },
  necro: {
    color: '#2dd4bf',
    seqs: ['seq16_n_corpse_boom', 'seq16_n_bone_burst', 'seq16_n_tendrils', 'seq16_n_blight_pool', 'seq16_n_blood_surge', 'seq16_n_blood_wave', 'seq16_n_bone_storm', 'seq16_n_soul_rift'],
    decals: ['decal_n_bone', 'decal_n_blood', 'decal_n_plague', 'decal_n_rift'],
    projs: ['proj_n_bone_spear', 'proj_n_blood_lance'],
    bySkillId: {
      skeleton:       { seq: 'seq16_n_soul_rift',   decal: 'decal_n_rift',   scale: 1.36 },
      golem:          { seq: 'seq16_n_bone_storm',  decal: 'decal_n_bone',   scale: 1.42 },
      frenzy:         { seq: 'seq16_n_blood_surge', decal: 'decal_n_blood',  selfCentered: true, scale: 1.32 },
      corpse_explode: { seq: 'seq16_n_corpse_boom', decal: 'decal_n_blood',  scale: 1.48 },
      bone_spear:     { seq: 'seq16_n_bone_burst',  decal: 'decal_n_bone',   proj: 'proj_n_bone_spear', scale: 1.34 },
      blood_curse:    { seq: 'seq16_n_blight_pool', decal: 'decal_n_plague', proj: 'proj_n_blood_lance', scale: 1.40 },
    },
  },
  assassin: {
    color: '#c084fc',
    seqs: ['seq16_a_shadow_slash', 'seq16_a_blade_flurry', 'seq16_a_venom_nova', 'seq16_a_smoke_veil', 'seq16_a_garrote', 'seq16_a_execute', 'seq16_a_eclipse', 'seq16_a_reaper_dance'],
    decals: ['decal_a_blood_cross', 'decal_a_venom_pool', 'decal_a_eclipse', 'decal_a_kunai'],
    projs: ['proj_a_kunai', 'proj_a_shuriken', 'proj_a_boomerang'],
    bySkillId: {
      shadow_dash: { seq: 'seq16_a_shadow_slash', decal: 'decal_a_eclipse',     dash: true, scale: 1.34 },
      flurry:      { seq: 'seq16_a_blade_flurry', decal: 'decal_a_blood_cross', dash: true, scale: 1.38 },
      execute:     { seq: 'seq16_a_execute',      decal: 'decal_a_blood_cross', dash: true, scale: 1.48 },
      kunai:       { seq: 'seq16_a_garrote',      decal: 'decal_a_kunai',       proj: 'proj_a_kunai', multiProj: 3, scale: 1.28 },
      venom_blade: { seq: 'seq16_a_venom_nova',   decal: 'decal_a_venom_pool',  proj: 'proj_a_shuriken', scale: 1.38 },
      smoke_bomb:  { seq: 'seq16_a_smoke_veil',   decal: 'decal_a_eclipse',     scale: 1.40 },
    },
  },
};

export class HeroSkillShowcase {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.rafId = null;
    this.classId = 'warrior';
    this.skillIdx = 0;
    this.autoPlay = true;
    this.nextCastAt = 0;
    this.castAnimUntil = 0;
    this.heroBaseX = 190;
    this.heroBaseY = 262;
    this.heroX = 190;
    this.heroY = 262;
    this.dashUntil = 0;
    this.dashTargetX = 480;

    this.imgCache = new Map();
    this.atlasCache = new Map();
    this.decals = [];
    this.seqAnims = [];
    this.projs = [];
    this.popups = [];
    this.onSkillChange = null;
    this.targets = [
      { x: 540, y: 248, key: 'dummy_boss_v299',     scale: 0.34, wobbleUntil: 0, flashUntil: 0 },
      { x: 632, y: 205, key: 'dummy_standard_v299', scale: 0.28, wobbleUntil: 0, flashUntil: 0 },
      { x: 625, y: 304, key: 'dummy_standard_v299', scale: 0.28, wobbleUntil: 0, flashUntil: 0 },
    ];
  }

  _loadImg(url) {
    if (this.imgCache.has(url)) return this.imgCache.get(url);
    const rec = { img: new Image(), ready: false };
    rec.img.onload = () => { rec.ready = true; };
    rec.img.src = url;
    this.imgCache.set(url, rec);
    return rec;
  }

  _loadHeroAtlas(cid) {
    const pref = HERO_PREFIX[cid] || 'wf';
    const key = `hero_${pref}`;
    if (this.atlasCache.has(key)) return this.atlasCache.get(key);
    const rec = { img: new Image(), frames: null, ready: false };
    this.atlasCache.set(key, rec);
    fetch(`./assets/hero/atlas_${pref}.json`)
      .then((r) => r.json())
      .then((meta) => {
        rec.frames = meta.frames || {};
        rec.img.onload = () => { rec.ready = true; };
        rec.img.src = `./assets/hero/atlas_${pref}.png`;
      })
      .catch(() => {});
    return rec;
  }

  _preloadClassAssets(cid) {
    this._loadImg('./assets/bg/arena_training_v299.webp?v=299');
    this._loadImg('./assets/fx/dummy_boss_v299.webp?v=299');
    this._loadImg('./assets/fx/dummy_standard_v299.webp?v=299');
    this._loadHeroAtlas(cid);
    const cfg = CLASS_V299_VFX[cid] || CLASS_V299_VFX.warrior;
    cfg.seqs.forEach((k) => this._loadImg(`./assets/fx/${k}.webp`));
    cfg.decals.forEach((k) => this._loadImg(`./assets/fx/${k}.webp`));
    cfg.projs.forEach((k) => this._loadImg(`./assets/fx/${k}.webp`));
  }

  setAutoPlay(flag) {
    this.autoPlay = !!flag;
  }

  attach(canvas, classId, onSkillChange) {
    this.detach();
    this.canvas = canvas;
    this.ctx = canvas?.getContext('2d') || null;
    this.classId = classId || 'warrior';
    this.onSkillChange = onSkillChange || null;
    this.skillIdx = 0;
    this.decals = [];
    this.seqAnims = [];
    this.projs = [];
    this.popups = [];
    this.heroX = this.heroBaseX;
    this.heroY = this.heroBaseY;
    this._preloadClassAssets(this.classId);

    this.triggerSkill(0);
    const loop = (now) => {
      this._update(now);
      this._render(now);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  detach() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  _getSkills() {
    const raw = CLASS_SKILLS_MAP[this.classId] || [];
    return Array.isArray(raw) ? raw : Object.values(raw);
  }

  triggerSkill(idx) {
    const skills = this._getSkills();
    if (!skills.length) return;
    const safeIdx = ((idx % skills.length) + skills.length) % skills.length;
    this.skillIdx = safeIdx;
    const sk = skills[safeIdx];
    const now = performance.now();
    this.castAnimUntil = now + 520;
    this.nextCastAt = now + 2600;

    if (this.onSkillChange) this.onSkillChange(safeIdx, sk);

    const cfg = CLASS_V299_VFX[this.classId] || CLASS_V299_VFX.warrior;
    const spec = (sk && cfg.bySkillId?.[sk.id]) || {
      seq: cfg.seqs[safeIdx % cfg.seqs.length],
      decal: cfg.decals[safeIdx % cfg.decals.length],
      proj: (safeIdx % 2 === 1 && cfg.projs.length) ? cfg.projs[safeIdx % cfg.projs.length] : null,
      scale: 1.35,
    };

    const mainTgt = this.targets[0];
    const fxX = spec.selfCentered ? this.heroBaseX + 35 : mainTgt.x;
    const fxY = spec.selfCentered ? this.heroBaseY - 12 : mainTgt.y - 14;

    if (spec.dash) {
      this.dashUntil = now + 380;
      this.dashTargetX = mainTgt.x - 86;
    }

    const triggerImpact = (impactAt) => {
      // Layer 1: Ground Decal
      if (spec.decal) {
        this.decals.push({
          url: `./assets/fx/${spec.decal}.webp`,
          x: fxX,
          y: fxY + 26,
          scale: (spec.scale || 1.3) * 0.44,
          bornAt: impactAt,
          dur: 1850,
        });
      }
      // Layer 2: 4x4 16-frame hand-drawn RGBA sequence
      if (spec.seq) {
        this.seqAnims.push({
          url: `./assets/fx/${spec.seq}.webp`,
          x: fxX,
          y: fxY - 6,
          scale: spec.scale || 1.35,
          bornAt: impactAt,
          fps: 19,
        });
      }
      // Layer 3: Target wobble + high-contrast overhead damage numbers
      this.targets.forEach((t, ti) => {
        const hitAt = impactAt + ti * 75;
        t.wobbleUntil = hitAt + 200;
        t.flashUntil = hitAt + 110;
        const isCrit = (ti === 0) || Math.random() < 0.45;
        const base = 1800 + safeIdx * 620 + Math.floor(Math.random() * 1400);
        const dmg = isCrit ? Math.round(base * 2.15) : base;
        this.popups.push({
          x: t.x + (Math.random() - 0.5) * 26,
          y: t.y - 82 - ti * 6,
          text: isCrit ? `${dmg.toLocaleString()}!` : dmg.toLocaleString(),
          color: isCrit ? '#fde047' : (ti === 0 ? cfg.color : '#ffffff'),
          size: isCrit ? 24 : 18,
          isCrit,
          bornAt: hitAt,
          dur: 920,
        });
      });
    };

    if (spec.proj) {
      const count = spec.multiProj || 1;
      for (let i = 0; i < count; i++) {
        const tgt = this.targets[i % this.targets.length];
        this.projs.push({
          url: `./assets/fx/${spec.proj}.webp`,
          sx: this.heroBaseX + 34,
          sy: this.heroBaseY - 22 + (i - (count - 1) / 2) * 16,
          tx: tgt.x,
          ty: tgt.y - 18,
          bornAt: now + i * 55,
          dur: 260,
          scale: 0.34,
        });
      }
      setTimeout(() => {
        if (this.rafId) triggerImpact(performance.now());
      }, 240);
    } else {
      triggerImpact(now + (spec.dash ? 120 : 40));
    }
  }

  _update(now) {
    if (now >= this.nextCastAt) {
      if (this.autoPlay) {
        this.triggerSkill(this.skillIdx + 1);
      } else {
        this.triggerSkill(this.skillIdx);
      }
    }
    if (now < this.dashUntil) {
      const p = 1 - (this.dashUntil - now) / 380;
      const arc = Math.sin(p * Math.PI);
      this.heroX = this.heroBaseX + (this.dashTargetX - this.heroBaseX) * arc;
    } else {
      this.heroX = this.heroBaseX;
    }
    this.decals = this.decals.filter((d) => now - d.bornAt < d.dur);
    this.seqAnims = this.seqAnims.filter((a) => ((now - a.bornAt) / 1000) * a.fps < 16);
    this.projs = this.projs.filter((p) => now - p.bornAt < p.dur);
    this.popups = this.popups.filter((p) => now - p.bornAt < p.dur);
  }

  _render(now) {
    const ctx = this.ctx;
    if (!ctx || !this.canvas) return;
    const W = this.canvas.width, H = this.canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background: crisp octagonal arena floor
    const bgRec = this._loadImg('./assets/bg/arena_training_v299.webp?v=299');
    if (bgRec.ready) {
      ctx.drawImage(bgRec.img, 0, 0, W, H);
      // Subtle dark vignette for VFX contrast
      const grad = ctx.createRadialGradient(W * 0.5, H * 0.52, W * 0.14, W * 0.5, H * 0.52, W * 0.62);
      grad.addColorStop(0, 'rgba(6,8,14,0.08)');
      grad.addColorStop(1, 'rgba(4,5,9,0.68)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = '#0d1018';
      ctx.fillRect(0, 0, W, H);
    }

    // Layer 1: Ground Decals
    for (const d of this.decals) {
      const rec = this._loadImg(d.url);
      if (!rec.ready) continue;
      const p = Math.max(0, (now - d.bornAt) / d.dur);
      const alpha = p > 0.55 ? Math.max(0, 1 - (p - 0.55) / 0.45) : 0.85;
      const dw = rec.img.width * d.scale;
      const dh = rec.img.height * d.scale * 0.62;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(rec.img, d.x - dw / 2, d.y - dh / 2, dw, dh);
      ctx.restore();
    }

    // Targets (3 Grounded Dummies)
    for (const t of this.targets) {
      const rec = this._loadImg(`./assets/fx/${t.key}.webp?v=299`);
      if (!rec.ready) continue;
      const dw = rec.img.width * t.scale;
      const dh = rec.img.height * t.scale;
      const wob = now < t.wobbleUntil ? Math.sin(now * 0.06) * 0.12 : 0;
      ctx.save();
      ctx.translate(t.x, t.y + 18);
      ctx.rotate(wob);
      if (now < t.flashUntil) ctx.filter = 'brightness(1.75)';
      ctx.drawImage(rec.img, -dw / 2, -dh + 12, dw, dh);
      ctx.restore();
    }

    // Hero Sprite
    const hRec = this._loadHeroAtlas(this.classId);
    const pref = HERO_PREFIX[this.classId] || 'wf';
    if (hRec.ready && hRec.frames) {
      const isCast = now < this.castAnimUntil;
      const fIdx = Math.floor(now / 100) % 4;
      const candidates = isCast
        ? [`${pref}_atk_right_${fIdx}`, `${pref}_atk_down_${fIdx}`, `${pref}_idle_right_0`, `${pref}_idle_down_0`]
        : [`${pref}_idle_right_${fIdx}`, `${pref}_idle_down_${fIdx}`, `${pref}_idle_right_0`, `${pref}_idle_down_0`];
      let fData = null;
      for (const ck of candidates) {
        if (hRec.frames[ck]) { fData = hRec.frames[ck].frame; break; }
      }
      if (!fData) {
        const firstKey = Object.keys(hRec.frames)[0];
        if (firstKey) fData = hRec.frames[firstKey].frame;
      }
      if (fData) {
        const sc = 0.56;
        const dw = fData.w * sc;
        const dh = fData.h * sc;
        ctx.drawImage(hRec.img, fData.x, fData.y, fData.w, fData.h, this.heroX - dw / 2, this.heroY - dh * 0.85, dw, dh);
      }
    }

    // Layer 2: 4x4 16-Frame Hand-Drawn RGBA Sequences
    for (const a of this.seqAnims) {
      const rec = this._loadImg(a.url);
      if (!rec.ready) continue;
      const elapsed = Math.max(0, (now - a.bornAt) / 1000);
      const frame = Math.min(15, Math.floor(elapsed * a.fps));
      const fw = Math.floor(rec.img.width / 4);
      const fh = Math.floor(rec.img.height / 4);
      const col = frame % 4;
      const row = Math.floor(frame / 4);
      const dw = fw * a.scale;
      const dh = fh * a.scale;
      ctx.save();
      ctx.drawImage(rec.img, col * fw, row * fh, fw, fh, a.x - dw / 2, a.y - dh / 2, dw, dh);
      ctx.restore();
    }

    // Layer 3a: Hand-Drawn Projectiles
    for (const p of this.projs) {
      if (now < p.bornAt) continue;
      const rec = this._loadImg(p.url);
      if (!rec.ready) continue;
      const prog = Math.min(1, (now - p.bornAt) / p.dur);
      const px = p.sx + (p.tx - p.sx) * prog;
      const py = p.sy + (p.ty - p.sy) * prog;
      const ang = Math.atan2(p.ty - p.sy, p.tx - p.sx);
      const dw = rec.img.width * p.scale;
      const dh = rec.img.height * p.scale;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(ang);
      ctx.drawImage(rec.img, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
    }

    // Layer 3b: High-Contrast Overhead Combat Damage Numbers
    for (const pop of this.popups) {
      if (now < pop.bornAt) continue;
      const p = (now - pop.bornAt) / pop.dur;
      const py = pop.y - p * 44;
      const alpha = p > 0.62 ? Math.max(0, 1 - (p - 0.62) / 0.38) : 1;
      const sc = p < 0.16 ? (1.36 - (p / 0.16) * 0.36) : 1.0;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(pop.x, py);
      ctx.scale(sc, sc);
      ctx.font = `900 ${pop.size}px "Noto Sans TC", "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = pop.isCrit ? 6 : 5;
      ctx.strokeStyle = '#000000';
      ctx.strokeText(pop.text, 0, 0);
      ctx.fillStyle = pop.color;
      ctx.fillText(pop.text, 0, 0);
      ctx.restore();
    }
  }
}
