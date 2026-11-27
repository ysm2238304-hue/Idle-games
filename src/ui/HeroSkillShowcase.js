// v300: 創角大廳 2.5D 三層景深實戰技能演武引擎（HeroSkillShowcase）
// 修正 stop()、修正 ./assets/heroes/atlas_${classId} 真實路徑、縮小木頭人比例並確保所有招式 100% 精準命中木頭人
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

const CLASS_V300_VFX = {
  warrior: {
    color: '#fb923c',
    seqs: ['seq16_w_whirlwind', 'seq16_w_hammer_slam', 'seq16_w_rend_burst', 'seq16_w_earth_stomp', 'seq16_w_fissure', 'seq16_w_warcry', 'seq16_w_maelstrom', 'seq16_w_execute'],
    decals: ['decal_w_crater', 'decal_w_lava', 'decal_w_blood', 'decal_w_rune'],
    projs: ['proj_w_flame_wave', 'proj_w_rock_shard', 'proj_w_chain_hook'],
    bySkillId: {
      whirlwind:        { seq: 'seq16_w_whirlwind',   decal: 'decal_w_crater', dash: true, scale: 1.26 },
      earthshatter:     { seq: 'seq16_w_fissure',     decal: 'decal_w_lava',   dash: true, scale: 1.32 },
      bloodcharge:      { seq: 'seq16_w_earth_stomp', decal: 'decal_w_crater', dash: true, scale: 1.24 },
      bladestorm:       { seq: 'seq16_w_maelstrom',   decal: 'decal_w_blood',  dash: true, scale: 1.30 },
      warcry:           { seq: 'seq16_w_warcry',      decal: 'decal_w_rune',   dash: true, scale: 1.26 },
      execute_cleave:   { seq: 'seq16_w_execute',     decal: 'decal_w_blood',  dash: true, scale: 1.32 },
      volcano_totem:    { seq: 'seq16_w_fissure',     decal: 'decal_w_lava',   scale: 1.32 },
      earth_stomp:      { seq: 'seq16_w_earth_stomp', decal: 'decal_w_crater', dash: true, scale: 1.28 },
      w_rend_slash:     { seq: 'seq16_w_rend_burst',  decal: 'decal_w_blood',  proj: 'proj_w_flame_wave', scale: 1.24 },
      w_ancient_hammer: { seq: 'seq16_w_hammer_slam', decal: 'decal_w_lava',   dash: true, scale: 1.36 },
    },
  },
  ranger: {
    color: '#4ade80',
    seqs: ['seq16_r_arrow_storm', 'seq16_r_venom_burst', 'seq16_r_shadow_boom', 'seq16_r_frost_barrage', 'seq16_r_phantom_beam', 'seq16_r_death_trap', 'seq16_r_smoke_bomb', 'seq16_r_void_rift'],
    decals: ['decal_r_arrows', 'decal_r_venom', 'decal_r_shadow', 'decal_r_trap'],
    projs: ['proj_r_emerald_arrow', 'proj_r_shadow_arrow', 'proj_r_venom_spear'],
    bySkillId: {
      volley:         { seq: 'seq16_r_frost_barrage', decal: 'decal_r_arrows', proj: 'proj_r_emerald_arrow', multiProj: 3, scale: 1.22 },
      arrowrain:      { seq: 'seq16_r_arrow_storm',   decal: 'decal_r_arrows', scale: 1.36 },
      phantombow:     { seq: 'seq16_r_phantom_beam',  decal: 'decal_r_shadow', proj: 'proj_r_shadow_arrow', scale: 1.34 },
      r_venom_pierce: { seq: 'seq16_r_venom_burst',   decal: 'decal_r_venom',  proj: 'proj_r_venom_spear', scale: 1.26 },
      caltrops:       { seq: 'seq16_r_death_trap',    decal: 'decal_r_trap',   scale: 1.24 },
      death_mark:     { seq: 'seq16_r_void_rift',     decal: 'decal_r_shadow', scale: 1.32 },
      shadowstep:     { seq: 'seq16_r_smoke_bomb',    decal: 'decal_r_shadow', dash: true, scale: 1.24 },
      shadow_clones:  { seq: 'seq16_r_shadow_boom',   decal: 'decal_r_shadow', proj: 'proj_r_shadow_arrow', multiProj: 2, scale: 1.30 },
    },
  },
  mage: {
    color: '#38bdf8',
    seqs: ['seq16_m_meteor', 'seq16_m_frost_nova', 'seq16_m_lightning_strike', 'seq16_m_inferno', 'seq16_m_fireball_blast', 'seq16_m_blizzard', 'seq16_m_firewall', 'seq16_m_ball_lightning', 'seq16_m_supernova'],
    decals: ['decal_m_scorch', 'decal_m_frost', 'decal_m_lightning', 'decal_m_void'],
    projs: ['proj_m_fireball', 'proj_m_frozen_orb', 'proj_m_ice_lance', 'proj_m_fire_bolt'],
    bySkillId: {
      m_frozen_orb:        { seq: 'seq16_m_blizzard',         decal: 'decal_m_frost',     proj: 'proj_m_frozen_orb', scale: 1.30 },
      frost_nova:          { seq: 'seq16_m_frost_nova',       decal: 'decal_m_frost',     dash: true, scale: 1.34 },
      m_deep_freeze:       { seq: 'seq16_m_blizzard',         decal: 'decal_m_frost',     proj: 'proj_m_ice_lance', scale: 1.36 },
      icicle_rain:         { seq: 'seq16_m_blizzard',         decal: 'decal_m_frost',     proj: 'proj_m_ice_lance', multiProj: 3, scale: 1.32 },
      m_fireball:          { seq: 'seq16_m_fireball_blast',   decal: 'decal_m_scorch',    proj: 'proj_m_fireball', scale: 1.30 },
      m_fire_bolt:         { seq: 'seq16_m_fireball_blast',   decal: 'decal_m_scorch',    proj: 'proj_m_fire_bolt', multiProj: 2, scale: 1.24 },
      m_flame_hydra:       { seq: 'seq16_m_firewall',         decal: 'decal_m_scorch',    proj: 'proj_m_fire_bolt', scale: 1.30 },
      m_inferno:           { seq: 'seq16_m_inferno',          decal: 'decal_m_scorch',    scale: 1.38 },
      meteor:              { seq: 'seq16_m_meteor',           decal: 'decal_m_scorch',    scale: 1.40 },
      chain_lightning:     { seq: 'seq16_m_lightning_strike', decal: 'decal_m_lightning', scale: 1.34 },
      m_ball_lightning:    { seq: 'seq16_m_ball_lightning',   decal: 'decal_m_lightning', scale: 1.30 },
      m_unstable_currents: { seq: 'seq16_m_supernova',        decal: 'decal_m_void',      scale: 1.40 },
      black_hole:          { seq: 'seq16_m_supernova',        decal: 'decal_m_void',      scale: 1.38 },
      void_beam:           { seq: 'seq16_m_lightning_strike', decal: 'decal_m_void',      scale: 1.36 },
    },
  },
  paladin: {
    color: '#fde047',
    seqs: ['seq16_p_holy_slash', 'seq16_p_heaven_pillar', 'seq16_p_divine_storm', 'seq16_p_judgment_cross', 'seq16_p_shield_bash', 'seq16_p_condemn_vortex', 'seq16_p_thorns_burst', 'seq16_p_verdict_sword'],
    decals: ['decal_p_consecration', 'decal_p_cross_crater', 'decal_p_sanctuary', 'decal_p_aegis_ring'],
    projs: ['proj_p_justice_hammer', 'proj_p_holy_lance', 'proj_p_holy_bolt'],
    bySkillId: {
      blessed_hammer: { seq: 'seq16_p_divine_storm',   decal: 'decal_p_consecration', proj: 'proj_p_justice_hammer', multiProj: 2, scale: 1.30 },
      consecration:   { seq: 'seq16_p_condemn_vortex', decal: 'decal_p_consecration', scale: 1.34 },
      judgment:       { seq: 'seq16_p_judgment_cross', decal: 'decal_p_cross_crater', scale: 1.36 },
      holy_aegis:     { seq: 'seq16_p_thorns_burst',   decal: 'decal_p_aegis_ring',   dash: true, scale: 1.28 },
      divine_storm:   { seq: 'seq16_p_divine_storm',   decal: 'decal_p_sanctuary',    dash: true, scale: 1.34 },
      heaven_fist:    { seq: 'seq16_p_heaven_pillar',  decal: 'decal_p_cross_crater', scale: 1.38 },
      shield_bash:    { seq: 'seq16_p_shield_bash',    decal: 'decal_p_aegis_ring',   dash: true, scale: 1.28 },
      p_holy_lance:   { seq: 'seq16_p_holy_slash',     decal: 'decal_p_sanctuary',    proj: 'proj_p_holy_lance', scale: 1.30 },
    },
  },
  necro: {
    color: '#2dd4bf',
    seqs: ['seq16_n_corpse_boom', 'seq16_n_bone_burst', 'seq16_n_tendrils', 'seq16_n_blight_pool', 'seq16_n_blood_surge', 'seq16_n_blood_wave', 'seq16_n_bone_storm', 'seq16_n_soul_rift'],
    decals: ['decal_n_bone', 'decal_n_blood', 'decal_n_plague', 'decal_n_rift'],
    projs: ['proj_n_bone_spear', 'proj_n_blood_lance'],
    bySkillId: {
      raise_skeleton:   { seq: 'seq16_n_soul_rift',   decal: 'decal_n_rift',   scale: 1.30 },
      blood_golem:      { seq: 'seq16_n_bone_storm',  decal: 'decal_n_bone',   scale: 1.34 },
      undead_frenzy:    { seq: 'seq16_n_blood_surge', decal: 'decal_n_blood',  scale: 1.30 },
      corpse_explosion: { seq: 'seq16_n_corpse_boom', decal: 'decal_n_blood',  scale: 1.38 },
      bone_spear:       { seq: 'seq16_n_bone_burst',  decal: 'decal_n_bone',   proj: 'proj_n_bone_spear', scale: 1.28 },
      decrepify:        { seq: 'seq16_n_blight_pool', decal: 'decal_n_plague', proj: 'proj_n_blood_lance', scale: 1.32 },
      bone_prison:      { seq: 'seq16_n_tendrils',    decal: 'decal_n_bone',   scale: 1.30 },
      n_blood_surge:    { seq: 'seq16_n_blood_wave',  decal: 'decal_n_blood',  scale: 1.34 },
    },
  },
  assassin: {
    color: '#c084fc',
    seqs: ['seq16_a_shadow_slash', 'seq16_a_blade_flurry', 'seq16_a_venom_nova', 'seq16_a_smoke_veil', 'seq16_a_garrote', 'seq16_a_execute', 'seq16_a_eclipse', 'seq16_a_reaper_dance'],
    decals: ['decal_a_blood_cross', 'decal_a_venom_pool', 'decal_a_eclipse', 'decal_a_kunai'],
    projs: ['proj_a_kunai', 'proj_a_shuriken', 'proj_a_boomerang'],
    bySkillId: {
      shadow_blitz:       { seq: 'seq16_a_shadow_slash', decal: 'decal_a_eclipse',     dash: true, scale: 1.30 },
      blade_flurry:       { seq: 'seq16_a_blade_flurry', decal: 'decal_a_blood_cross', dash: true, scale: 1.34 },
      shadow_execute:     { seq: 'seq16_a_execute',      decal: 'decal_a_blood_cross', dash: true, scale: 1.38 },
      poison_kunai:       { seq: 'seq16_a_garrote',      decal: 'decal_a_kunai',       proj: 'proj_a_kunai', multiProj: 3, scale: 1.24 },
      venom_burst:        { seq: 'seq16_a_venom_nova',   decal: 'decal_a_venom_pool',  proj: 'proj_a_shuriken', scale: 1.32 },
      smoke_veil:         { seq: 'seq16_a_smoke_veil',   decal: 'decal_a_eclipse',     dash: true, scale: 1.32 },
      lethal_fangs:       { seq: 'seq16_a_reaper_dance', decal: 'decal_a_blood_cross', dash: true, scale: 1.34 },
      a_boomerang_blades: { seq: 'seq16_a_eclipse',      decal: 'decal_a_kunai',       proj: 'proj_a_boomerang', multiProj: 2, scale: 1.30 },
    },
  },
};

export class HeroSkillShowcase {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.rafId = null;
    this._impactTimer = null;
    this.classId = 'warrior';
    this.skillIdx = 0;
    this.autoPlay = true;
    this.nextCastAt = 0;
    this.castAnimUntil = 0;
    this.heroBaseX = 225;
    this.heroBaseY = 276;
    this.heroX = 225;
    this.heroY = 276;
    this.dashUntil = 0;
    this.dashTargetX = 468;
    this.dashTargetY = 264;

    this.imgCache = new Map();
    this.atlasCache = new Map();
    this.decals = [];
    this.seqAnims = [];
    this.projs = [];
    this.popups = [];
    this.onSkillChange = null;
    // v300: 縮小木頭人比例（0.22 / 0.18），與英雄身形協調
    this.targets = [
      { x: 532, y: 264, key: 'dummy_boss_v299',     scale: 0.22, wobbleUntil: 0, flashUntil: 0 },
      { x: 612, y: 226, key: 'dummy_standard_v299', scale: 0.18, wobbleUntil: 0, flashUntil: 0 },
      { x: 604, y: 304, key: 'dummy_standard_v299', scale: 0.18, wobbleUntil: 0, flashUntil: 0 },
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
    const pngUrl = `./assets/heroes/atlas_${cid}.png?v=66`;
    const jsonUrl = `./assets/heroes/atlas_${cid}.json?v=66`;
    if (this.atlasCache.has(pngUrl)) return this.atlasCache.get(pngUrl);
    const rec = { img: new Image(), frames: null, ready: false };
    this.atlasCache.set(pngUrl, rec);
    fetch(jsonUrl)
      .then((r) => (r.ok ? r.json() : null))
      .then((meta) => {
        if (!meta) return;
        rec.frames = meta.frames || {};
        rec.img.onload = () => { rec.ready = true; };
        rec.img.src = pngUrl;
      })
      .catch(() => {});
    return rec;
  }

  _preloadClassAssets(cid) {
    this._loadImg('./assets/bg/arena_training_v299.webp?v=299');
    this._loadImg('./assets/fx/dummy_boss_v299.webp?v=299');
    this._loadImg('./assets/fx/dummy_standard_v299.webp?v=299');
    this._loadHeroAtlas(cid);
    const cfg = CLASS_V300_VFX[cid] || CLASS_V300_VFX.warrior;
    cfg.seqs.forEach((k) => this._loadImg(`./assets/fx/${k}.webp`));
    cfg.decals.forEach((k) => this._loadImg(`./assets/fx/${k}.webp`));
    cfg.projs.forEach((k) => this._loadImg(`./assets/fx/${k}.webp`));
  }

  setAutoPlay(flag) {
    this.autoPlay = !!flag;
  }

  attach(canvas, classId, onSkillChange) {
    this.stop();
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

  // v300: 補回 stop() 方法供 main.js startAdventure() 正常停止演武並進入遊戲
  stop() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    if (this._impactTimer) {
      clearTimeout(this._impactTimer);
      this._impactTimer = null;
    }
  }

  detach() {
    this.stop();
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
    this.castAnimUntil = now + 540;
    this.nextCastAt = now + 2600;

    if (this.onSkillChange) this.onSkillChange(safeIdx, sk);

    const cfg = CLASS_V300_VFX[this.classId] || CLASS_V300_VFX.warrior;
    const spec = (sk && cfg.bySkillId?.[sk.id]) || {
      seq: cfg.seqs[safeIdx % cfg.seqs.length],
      decal: cfg.decals[safeIdx % cfg.decals.length],
      proj: (safeIdx % 2 === 1 && cfg.projs.length) ? cfg.projs[safeIdx % cfg.projs.length] : null,
      dash: (this.classId === 'warrior' || this.classId === 'assassin' || this.classId === 'paladin'),
      scale: 1.28,
    };

    const mainTgt = this.targets[0];
    // v300: 強制所有特效鎖定在主木頭人身上（絕不打空）
    const fxX = mainTgt.x;
    const fxY = mainTgt.y - 16;

    if (spec.dash) {
      this.dashUntil = now + 440;
      this.dashTargetX = mainTgt.x - 58;
      this.dashTargetY = mainTgt.y + 4;
    }

    const triggerImpact = (impactAt) => {
      if (spec.decal) {
        this.decals.push({
          url: `./assets/fx/${spec.decal}.webp`,
          x: fxX,
          y: mainTgt.y + 8,
          scale: (spec.scale || 1.28) * 0.40,
          bornAt: impactAt,
          dur: 1850,
        });
      }
      if (spec.seq) {
        this.seqAnims.push({
          url: `./assets/fx/${spec.seq}.webp`,
          x: fxX,
          y: fxY,
          scale: spec.scale || 1.28,
          bornAt: impactAt,
          fps: 19,
        });
      }
      this.targets.forEach((t, ti) => {
        const hitAt = impactAt + ti * 70;
        t.wobbleUntil = hitAt + 220;
        t.flashUntil = hitAt + 120;
        const isCrit = (ti === 0) || Math.random() < 0.45;
        const base = 1900 + safeIdx * 580 + Math.floor(Math.random() * 1400);
        const dmg = isCrit ? Math.round(base * 2.15) : base;
        this.popups.push({
          x: t.x + (Math.random() - 0.5) * 20,
          y: t.y - 58 - ti * 4,
          text: isCrit ? `${dmg.toLocaleString()}!` : dmg.toLocaleString(),
          color: isCrit ? '#fde047' : (ti === 0 ? cfg.color : '#ffffff'),
          size: isCrit ? 22 : 17,
          isCrit,
          bornAt: hitAt,
          dur: 900,
        });
      });
    };

    if (this._impactTimer) {
      clearTimeout(this._impactTimer);
      this._impactTimer = null;
    }

    if (spec.proj) {
      const count = spec.multiProj || 1;
      for (let i = 0; i < count; i++) {
        const tgt = this.targets[i % this.targets.length];
        this.projs.push({
          url: `./assets/fx/${spec.proj}.webp`,
          sx: this.heroBaseX + 30,
          sy: this.heroBaseY - 28 + (i - (count - 1) / 2) * 14,
          tx: tgt.x,
          ty: tgt.y - 20,
          bornAt: now + i * 50,
          dur: 250,
          scale: 0.30,
        });
      }
      this._impactTimer = setTimeout(() => {
        this._impactTimer = null;
        if (this.rafId) triggerImpact(performance.now());
      }, 230);
    } else if (spec.dash) {
      this._impactTimer = setTimeout(() => {
        this._impactTimer = null;
        if (this.rafId) triggerImpact(performance.now());
      }, 170);
    } else {
      triggerImpact(now + 40);
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
      const p = 1 - (this.dashUntil - now) / 440;
      const arc = Math.sin(p * Math.PI);
      this.heroX = this.heroBaseX + (this.dashTargetX - this.heroBaseX) * arc;
      this.heroY = this.heroBaseY + (this.dashTargetY - this.heroBaseY) * arc;
    } else {
      this.heroX = this.heroBaseX;
      this.heroY = this.heroBaseY;
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

    const bgRec = this._loadImg('./assets/bg/arena_training_v299.webp?v=299');
    if (bgRec.ready) {
      ctx.drawImage(bgRec.img, 0, 0, W, H);
      const grad = ctx.createRadialGradient(W * 0.5, H * 0.52, W * 0.14, W * 0.5, H * 0.52, W * 0.62);
      grad.addColorStop(0, 'rgba(6,8,14,0.06)');
      grad.addColorStop(1, 'rgba(4,5,9,0.65)');
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

    // Targets (3 compact grounded dummies)
    for (const t of this.targets) {
      const rec = this._loadImg(`./assets/fx/${t.key}.webp?v=299`);
      if (!rec.ready) continue;
      const dw = rec.img.width * t.scale;
      const dh = rec.img.height * t.scale;
      const wob = now < t.wobbleUntil ? Math.sin(now * 0.06) * 0.13 : 0;
      ctx.save();
      ctx.translate(t.x, t.y + 8);
      ctx.rotate(wob);
      if (now < t.flashUntil) ctx.filter = 'brightness(1.8)';
      ctx.drawImage(rec.img, -dw / 2, -dh + 6, dw, dh);
      ctx.restore();
    }

    // Hero Sprite (real ./assets/heroes/atlas_${cid}.png?v=66)
    const hRec = this._loadHeroAtlas(this.classId);
    const pref = HERO_PREFIX[this.classId] || 'wf';
    if (hRec.ready && hRec.frames) {
      const isCast = now < this.castAnimUntil;
      const fIdx = Math.floor(now / 100) % 4;
      const candidates = isCast
        ? [`${pref}_atk_right_${fIdx}`, `${pref}_attack_right_${fIdx}`, `${pref}_atk_down_${fIdx}`, `${pref}_walk_right_${fIdx}`, `${pref}_idle_right_0`, `${pref}_idle_down_0`]
        : [`${pref}_idle_right_${fIdx}`, `${pref}_walk_right_${fIdx}`, `${pref}_idle_down_${fIdx}`, `${pref}_idle_right_0`, `${pref}_idle_down_0`];
      let fData = null;
      for (const ck of candidates) {
        if (hRec.frames[ck]) { fData = hRec.frames[ck].frame; break; }
      }
      if (!fData) {
        const keys = Object.keys(hRec.frames);
        const preferred = keys.find((k) => k.includes('right')) || keys[0];
        if (preferred) fData = hRec.frames[preferred].frame;
      }
      if (fData) {
        // Subtle grounding shadow under hero's feet
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.ellipse(this.heroX, this.heroY + 4, 24, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        const targetH = 98;
        const sc = targetH / Math.max(40, fData.h);
        const dw = fData.w * sc;
        const dh = fData.h * sc;
        ctx.drawImage(hRec.img, fData.x, fData.y, fData.w, fData.h, this.heroX - dw / 2, this.heroY - dh + 10, dw, dh);
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

    // Layer 3b: Overhead High-Contrast Damage Numbers
    for (const pop of this.popups) {
      if (now < pop.bornAt) continue;
      const p = (now - pop.bornAt) / pop.dur;
      const py = pop.y - p * 40;
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
