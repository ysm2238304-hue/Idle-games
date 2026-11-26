import { getClassMechanicConfig } from '../logic/classMechanics.js?v=251';
import { computeSkillBuildMods, checkCompoundReaction, getSmartAutoSlotOrder } from '../logic/buildEngine.js?v=251';
import { CLASSES } from '../data/classes.js?v=99';
import { WARRIOR_SKILLS } from '../data/warriorSkills.js?v=235';
import { RANGER_SKILLS } from '../data/rangerSkills.js?v=236';
import { MAGE_SKILLS } from '../data/mageSkills.js?v=241';
import { PALADIN_SKILLS } from '../data/paladinSkills.js?v=235';
import { NECRO_SKILLS } from '../data/necroSkills.js?v=251';
import { ASSASSIN_SKILLS } from '../data/assassinSkills.js?v=235';
import { RARITIES } from '../data/items.js?v=99';
import { PET_CATALOG, getPetDef, PET_SCHOOLS, getPetRarityMeta, getPetPickupRadius, getPetCodexInfo } from '../data/pets.js?v=99';
import { createStageEncounters, spawnSingleMonster, getChapterIdx, getStageLabel, ZONE_OBSTACLES } from '../data/monsters.js?v=232';
import { formatNum } from '../logic/statCalc.js?v=240';
import { MageVfxDirector } from '../vfx/MageVfxDirector.js?v=250';
import { NecroVfxDirector } from '../vfx/NecroVfxDirector.js?v=252';

const MAP_W = 4096;
const MAP_H = 2304;
const ZONE_EMBERS = [0xfbbf24, 0x34d399, 0x38bdf8, 0xf97316, 0xe879f9, 0x7dd3fc, 0x4ade80, 0xfacc15, 0xf87171, 0xc084fc];
const FX_NAMES = [
  'fx_slash', 'fx_cross', 'fx_whirlwind', 'fx_crack',
  'fx_arrow', 'fx_beam', 'fx_lightning', 'fx_crit',
  'fx_orb', 'fx_sigil', 'fx_meteor', 'fx_explosion',
  'wfx_cleave', 'wfx_hitflash', 'wfx_sparks', 'wfx_whirl_inner',
  'wfx_whirl_outer', 'wfx_whirl_wind', 'wfx_slam_pillar', 'wfx_lava_ring',
  'wfx_rubble', 'wfx_lava_crack', 'wfx_charge_aura', 'wfx_fire_trail',
  'wfx_blood_ring', 'wfx_blade_wave', 'wfx_wave_trail', 'wfx_pierce_burst',
  'rfx_arrow', 'rfx_pierce_flash', 'rfx_beam', 'rfx_wind_trail',
  'rfx_rain_sigil', 'rfx_rain_fall', 'rfx_rain_impact', 'rfx_leaf_sparks',
  'rfx_shadow_smoke', 'rfx_trap_rune', 'rfx_poison_burst', 'rfx_dodge_aura',
  'rfx_phantom_dragon', 'rfx_charge_bow', 'rfx_sonic_ring', 'rfx_emerald_star',
  'mfx_bolt', 'mfx_orb', 'mfx_spark', 'mfx_nova_ring',
  'mfx_meteor_rock', 'mfx_meteor_blast', 'mfx_meteor_crater', 'mfx_meteor_flame',
  'mfx_frost_ring', 'mfx_frost_shard', 'mfx_frost_burst', 'mfx_arcane_shield',
  'mfx_void_beam', 'mfx_void_core', 'mfx_star_sigil', 'mfx_void_slash',
  'efx_claw', 'efx_venom', 'efx_imp_fire', 'efx_necro_orb',
  'nfx_totem', 'nfx_warcry', 'nfx_caltrops', 'nfx_deathmark',
  'nfx_lightning', 'nfx_icicles', 'nfx_blackhole', 'nfx_overload',
  'vfx_react_hemorrhage', 'vfx_react_superconduct', 'vfx_react_plaguefire', 'vfx_react_souljudge', 'vfx_proc_overpower', 'vfx_proc_luckyhit',
  'vfx_w_rend_arc', 'vfx_w_hammer_slam', 'vfx_w_iron_dome', 'vfx_w_ancients_spirit', 'vfx_w_lava_fissure',
  'vfx_p_cross_fire', 'vfx_p_thorns_ring', 'vfx_p_redemption_halo', 'vfx_p_seraph_wings', 'vfx_p_verdict_sword',
  'vfx_a_boomerang', 'vfx_a_backstab_pierce', 'vfx_a_crimson_mist', 'vfx_a_bloodmoon_array', 'vfx_a_fivestar_slash',
  'vfx_r_shadow_arrow', 'vfx_r_venom_spear', 'vfx_r_decoy_phantom', 'vfx_r_abyss_meteor_arrow', 'vfx_r_void_star_sigil',
  'vfx_m_flame_hydra', 'vfx_m_ice_hex_shield', 'vfx_m_blink_lightning', 'vfx_m_cataclysm_sigil', 'vfx_m_supernova_core',
  'vfx_n_blood_surge', 'vfx_n_blight_pool', 'vfx_n_bone_shield', 'vfx_n_scourge_rift', 'vfx_n_bone_splinter',
  // v242: 暗黑 4 秘法師 20 張多層純黑底疊加戰鬥特效
  'vfx_m_fire_bolt', 'vfx_m_fireball_blast', 'vfx_m_flame_shield', 'vfx_m_firewall',
  'vfx_m_hydra_turret', 'vfx_m_meteor_impact', 'vfx_m_inferno_serpent', 'vfx_m_fire_enchant_nova',
  'vfx_m_frozen_orb', 'vfx_m_ice_shards', 'vfx_m_ice_armor', 'vfx_m_ice_blades',
  'vfx_m_frost_nova', 'vfx_m_blizzard_field', 'vfx_m_deep_freeze', 'vfx_m_shatter_burst',
  'vfx_m_ball_lightning', 'vfx_m_lightning_spear', 'vfx_m_crackling_orb', 'vfx_m_enlightenment_nova',
  // v245: 暗黑 4 秘法師精繪去背 2.5D 召喚實體
  'conj_m_hydra', 'conj_m_ice_blades', 'conj_m_lightning_spear', 'conj_m_familiar',
];

export class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
    this.callbacks = null;
    this.hero = null;
    this.heroCastShadow = null;
    this.heroGroundShadow = null;
    this.monsters = [];
    this.projectiles = [];
    this.groundLoot = [];
    this.lootClickTarget = null;
    this.playerHp = 240;
    this.playerMaxHp = 240;
    this.playerMp = 100;
    this.playerMaxMp = 100;
    this.potionCharges = 3;
    this.potionMaxCharges = 3;
    this.potionRechargeTimer = 0;
    this.heroAttackTimer = 0;
    this.slotCdTimers = [99999, 99999, 99999, 99999, 99999, 99999];
    this.bossTimeLeft = 0;
    this.isBossWave = false;
    this.isTransitioning = false;
    this.isPaused = false;
    this.lastZoneIdx = -1;
    this.obstacles = [];
    this.patrolTarget = { x: MAP_W / 2, y: MAP_H / 2 };

    this.waveKills = 0;
    this.mapKills = 0;
    this.waveTargetKills = 12;
    this.stageTotalMonsters = 12;
    this.bossEngaged = false;
    this.waveElapsedSec = 0;
    this.swarmSpawnTimer = 0;

    this.heroDir = 'down';
    this.heroFlipX = false;
    this.heroAttackAnimUntil = 0;
    this.heroDirLockUntil = 0;
    this.smoothVx = 0;
    this.smoothVy = 0;
    this.dodgeBuffUntil = 0;
    this.afterimageTimer = 0;
    // v242: 暗黑 4 秘法師場上實體引擎（召喚實體／劈啪電花／屏障護盾／啟蒙層數）
    this.mageConjurations = [];
    // v252: 暗黑 4 死靈法師戰場實體引擎（真實地面屍體／磁吸鮮血球／4 類動態亡靈隨從／暗影枯萎計數）
    this.necroCorpses = [];
    this.necroBloodOrbs = [];
    this.necroMinions = [];
    this.necroBloodOrbStacks = 0;
    this.necroShadowHits = 0;
    this.necroFrenzyUntil = 0;
    this.necroBoneStormUntil = 0;
    this.cracklingOrbs = [];
    this.heroBarrierHp = 0;
    this.heroBarrierUntil = 0;
    this.heroBarrierSprite = null;
    this.heroBarrierKey = '';
    this.enlightenmentStacks = 0;
    this.enlightenmentLastElem = '';
    this.enlightenmentUntil = 0;

    this.autoMoveEnabled = true;
    this.manualOverrideTimer = 0;
    this.basicComboStep = 0;
    this.warriorGuardStacks = 0;
    this.warriorGuardUntil = 0;
    this.mageShieldHp = 0;
    this.arcaneChargeStacks = 0;
    this.hasPointerMoved = false;
    this.warcryUntil = 0;
    this.windwalkUntil = 0;
    this.overloadUntil = 0;
    this.holyAegisHp = 0;
    this.holyAegisUntil = 0;
    this.radiantAuraUntil = 0;
    this.thornsModUntil = 0;
    this.summons = [];
    this.undeadFrenzyUntil = 0;
    this.lethalFangsUntil = 0;
    this.mapKills = 0;
    this.respawnTimer = 0;
  }

  init(data) {
    const src = (data && typeof data.getState === 'function') ? data : (window.__IDLE_ARPG_BRIDGE__ || {});
    this.callbacks = src.callbacks;
    this.getState = src.getState;
    this.getStats = src.getStats;
  }

  preload() {
    const state = this.getState ? this.getState() : {};
    const initCid = state.classId || 'warrior';
    const initZone = getChapterIdx(state.stage || 1);
    const initCh = initZone + 1;

    this.loadedClasses = new Set([initCid]);
    this.loadedChapters = new Set([initCh]);
    this.isLoadingAssets = false;

    this.load.atlas(`atlas_${initCid}`, `./assets/heroes/atlas_${initCid}.png?v=66`, `./assets/heroes/atlas_${initCid}.json?v=66`);
    if (initCid === 'necro') {
      this.loadedSummons = true;
      this.load.atlas('atlas_summons', './assets/heroes/atlas_summons.png', './assets/heroes/atlas_summons.json');
    window.__petTexQueued = window.__petTexQueued || new Set();
    PET_CATALOG.forEach((p) => {
      const k = `pet_${p.id}`;
      if (!this.textures.exists(k) && !window.__petTexQueued.has(k)) {
        window.__petTexQueued.add(k);
        this.load.image(k, `./assets/pets/${p.id}.png?v=90`);
      }
    });
      ['skel_summon', 'skel_slash', 'frenzy', 'wraith_boom', 'golem_summon', 'golem_slam', 'blood_leech', 'bone_shield'].forEach((k) => {
        this.load.image(`sfx_${k}`, `./assets/fx/sfx_${k}.png`);
      });
    } else {
      this.loadedSummons = false;
    }

    this.load.atlas(`atlas_ch${initCh}`, `./assets/monsters/atlas_ch${initCh}.png`, `./assets/monsters/atlas_ch${initCh}.json`);
    this.load.atlas('atlas_legacy', './assets/monsters/atlas_legacy.png', './assets/monsters/atlas_legacy.json');
    this.load.image(`map_zone_${initZone}`, `./assets/bg/map_${initZone}.jpg`);

    for (let i = 0; i < 8; i++) {
      this.load.image(`obs_${i}`, `./assets/props/obs_${i}.png`);
    }

    FX_NAMES.forEach((fx) => {
      this.load.image(fx, `./assets/fx/${fx}.png`);
    });
    // v246: 載入 10 組秘法師 2.5D 暗黑手繪 9 格序列幀動畫（320x320）
    const DARK_MAGE_SEQS = [
      'anim_m_fireball_blast', 'anim_m_firewall', 'anim_m_frozen_orb', 'anim_m_blizzard',
      'anim_m_ball_lightning', 'anim_m_supernova', 'anim_m_meteor', 'anim_m_frost_nova',
      'anim_m_lightning_strike', 'anim_m_inferno',
    ];
    for (const sk of DARK_MAGE_SEQS) {
      this.load.spritesheet(sk, `./assets/fx/${sk}.png?v=246`, { frameWidth: 320, frameHeight: 320 });
    }
    MageVfxDirector.preload(this);
    NecroVfxDirector.preload(this);
  }

  getHeroAtlasKey(cid) {
    return `atlas_${cid || 'warrior'}`;
  }

  getMobAtlasKey(mid) {
    if (mid && mid.startsWith('ch')) {
      return `atlas_${mid.split('_')[0]}`;
    }
    return 'atlas_legacy';
  }

  ensureClassLoaded(cid, cb) {
    const needSummons = cid === 'necro' && !this.loadedSummons;
    const needClass = !this.loadedClasses.has(cid) || !this.textures.exists(`atlas_${cid}`);
    if (!needClass && !needSummons) {
      if (cb) cb();
      return;
    }
    this.isLoadingAssets = true;
    if (needClass) {
      this.load.atlas(`atlas_${cid}`, `./assets/heroes/atlas_${cid}.png?v=66`, `./assets/heroes/atlas_${cid}.json?v=66`);
    }
    if (needSummons) {
      this.load.atlas('atlas_summons', './assets/heroes/atlas_summons.png', './assets/heroes/atlas_summons.json');
      ['skel_summon', 'skel_slash', 'frenzy', 'wraith_boom', 'golem_summon', 'golem_slam', 'blood_leech', 'bone_shield'].forEach((k) => {
        if (!this.textures.exists(`sfx_${k}`)) this.load.image(`sfx_${k}`, `./assets/fx/sfx_${k}.png`);
      });
    }
    this.load.once('complete', () => {
      this.loadedClasses.add(cid);
      this.registerClassAnims(cid);
      if (needSummons) {
        this.loadedSummons = true;
        this.registerSummonAnims();
      }
      this.isLoadingAssets = false;
      if (cb) cb();
    });
    this.load.start();
  }

  ensureChapterLoaded(zoneIdx, cb) {
    const chNum = zoneIdx + 1;
    const ak = `atlas_ch${chNum}`;
    const mk = `map_zone_${zoneIdx}`;
    const needAtlas = !this.loadedChapters.has(chNum) || !this.textures.exists(ak);
    const needMap = !this.textures.exists(mk);
    if (!needAtlas && !needMap) {
      if (cb) cb();
      return;
    }
    this.isLoadingAssets = true;
    if (needAtlas) {
      this.load.atlas(ak, `./assets/monsters/${ak}.png`, `./assets/monsters/${ak}.json`);
    }
    if (needMap) {
      this.load.image(mk, `./assets/bg/map_${zoneIdx}.jpg`);
    }
    this.load.once('complete', () => {
      this.loadedChapters.add(chNum);
      this.registerChapterAnims(chNum);
      this.isLoadingAssets = false;
      if (cb) cb();
    });
    this.load.start();
  }

  create() {
    this.generateFxTextures();
    this.createClassAnims();
    this.registerMageSeqAnims();
    this.mageVfx = new MageVfxDirector(this);
    this.mageVfx.registerAnims();
    this.necroVfx = new NecroVfxDirector(this);
    this.necroVfx.registerAnims();

    const initZone = this.getZoneIdx();
    this.bgImage = this.add.image(MAP_W / 2, MAP_H / 2, `map_zone_${initZone}`)
      .setDisplaySize(MAP_W, MAP_H)
      .setDepth(0);

    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.createHero();

    this.keys = this.input.keyboard.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    });

    this.hudTickTimer = 0;

    this.time.addEvent({
      delay: 240,
      loop: true,
      callback: () => {
        if (!this.isPaused) this.spawnAmbientEmber();
      },
    });

    this.input.on('pointermove', () => { this.hasPointerMoved = true; });
    this.input.on('pointerdown', (pointer) => {
      if (this.isPaused || this.isTransitioning || this.monsters.length === 0) return;
      const worldPt = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const target = this.findNearestMonster(worldPt.x, worldPt.y, 140);
      if (target) {
        const stats = this.getStats();
        const tapDmg = Math.max(2, Math.round(stats.atk * 0.55));
        this.damageMonster(target, tapDmg, false, true);
        const tapCid = this.getState()?.classId || 'warrior';
        const tapFx = { warrior: 'wfx_cleave', ranger: 'rfx_pierce_flash', mage: 'mfx_spark', paladin: 'pfx_slash', necro: 'nfx_p_slash', assassin: 'afx_slash' }[tapCid] || 'wfx_cleave';
        this.playFxSprite(tapFx, target.sprite.x, target.sprite.y - 10, 0.54, Phaser.Math.FloatBetween(-0.6, 0.6), 220);
      }
    });

    this.scale.on('resize', (gameSize) => {
      this.handleResize(gameSize.width, gameSize.height);
    });

    const stats = this.getStats();
    this.playerMaxHp = stats.maxHp;
    this.playerHp = stats.maxHp;
    this.playerMaxMp = stats.maxMp || 100;
    this.playerMp = this.playerMaxMp;
    this.spawnWaveSquad();
  }

  createClassAnims() {
    const state = this.getState ? this.getState() : {};
    const initCid = state.classId || 'warrior';
    const initCh = getChapterIdx(state.stage || 1) + 1;
    this.registerClassAnims(initCid);
    if (initCid === 'necro') this.registerSummonAnims();
    this.registerChapterAnims(initCh);
    this.registerLegacyAnims();
  }

  registerClassAnims(cid) {
    const map = {
      warrior:  { prefix: 'w', tex: 'wf', walkFps: 10, atkFps: 15 },
      ranger:   { prefix: 'r', tex: 'rf', walkFps: 12, atkFps: 16 },
      mage:     { prefix: 'm', tex: 'mf', walkFps: 10, atkFps: 15 },
      paladin:  { prefix: 'p', tex: 'pf', walkFps: 10, atkFps: 15 },
      necro:    { prefix: 'n', tex: 'nf', walkFps: 10, atkFps: 15 },
      assassin: { prefix: 'a', tex: 'af', walkFps: 13, atkFps: 18 },
    };
    const def = map[cid];
    if (!def) return;
    const atlasKey = `atlas_${cid}`;
    const tex = this.textures.get(atlasKey);
    ['down', 'up', 'right'].forEach((d) => {
      if (!tex.has(`${def.tex}_${d}_walk_7`)) return;
      if (!this.anims.exists(`${def.prefix}_${d}_walk`)) {
        this.anims.create({
          key: `${def.prefix}_${d}_walk`,
          frames: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ key: atlasKey, frame: `${def.tex}_${d}_walk_${i}` })),
          frameRate: Math.max(14, def.walkFps + 4),
          repeat: -1,
        });
      }
      if (!this.anims.exists(`${def.prefix}_${d}_idle`)) {
        this.anims.create({
          key: `${def.prefix}_${d}_idle`,
          frames: [0, 1, 2, 3].map((i) => ({ key: atlasKey, frame: `${def.tex}_${d}_idle_${i}` })),
          frameRate: 5,
          repeat: -1,
        });
      }
      if (!this.anims.exists(`${def.prefix}_${d}_atk`)) {
        this.anims.create({
          key: `${def.prefix}_${d}_atk`,
          frames: [0, 1, 2, 3].map((i) => ({ key: atlasKey, frame: `${def.tex}_${d}_atk_${i}` })),
          frameRate: def.atkFps,
          repeat: 0,
        });
      }
    });
  }

  registerSummonAnims() {
    if (!this.anims.exists('sum_wraith_walk')) {
      this.anims.create({ key: 'sum_wraith_walk', frames: [0, 1, 2, 3].map((i) => ({ key: 'atlas_summons', frame: `wraith_walk_${i}` })), frameRate: 10, repeat: -1 });
      this.anims.create({ key: 'sum_wraith_atk', frames: [0, 1, 2, 3].map((i) => ({ key: 'atlas_summons', frame: `wraith_atk_${i}` })), frameRate: 14, repeat: 0 });
    }
    [{ prefix: 'sum_skel', tex: 'skel', walkFps: 10, atkFps: 14 }, { prefix: 'sum_gol', tex: 'gol', walkFps: 8, atkFps: 12 }].forEach(({ prefix, tex, walkFps, atkFps }) => {
      ['down', 'up', 'right'].forEach((d) => {
        if (!this.anims.exists(`${prefix}_${d}_walk`)) {
          this.anims.create({
            key: `${prefix}_${d}_walk`,
            frames: [0, 1, 2, 3].map((i) => ({ key: 'atlas_summons', frame: `${tex}_${d}_walk_${i}` })),
            frameRate: walkFps,
            repeat: -1,
          });
        }
        if (!this.anims.exists(`${prefix}_${d}_atk`)) {
          this.anims.create({
            key: `${prefix}_${d}_atk`,
            frames: [0, 1, 2, 3].map((i) => ({ key: 'atlas_summons', frame: `${tex}_${d}_atk_${i}` })),
            frameRate: atkFps,
            repeat: 0,
          });
        }
      });
    });
  }

  registerMobAnimsList(mids, atlasKey) {
    mids.forEach((mid) => {
      const walkFps = mid === 'spider' ? 12 : (mid === 'imp' ? 10 : (mid === 'orc' || mid === 'boss_demon' ? 7 : 9));
      if (!this.anims.exists(`mob_${mid}_walk`)) {
        this.anims.create({
          key: `mob_${mid}_walk`,
          frames: [0, 1, 2, 3].map((i) => ({ key: atlasKey, frame: `mob_${mid}_walk_${i}` })),
          frameRate: walkFps,
          repeat: -1,
        });
      }
      if (!this.anims.exists(`mob_${mid}_atk`)) {
        this.anims.create({
          key: `mob_${mid}_atk`,
          frames: [0, 1, 2, 3].map((i) => ({ key: atlasKey, frame: `mob_${mid}_atk_${i}` })),
          frameRate: 13,
          repeat: 0,
        });
      }
    });
  }

  registerChapterAnims(chNum) {
    const CH_MOBS = {
      1: ['ch1_wolf', 'ch1_bandit', 'ch1_boar', 'ch1_slime', 'ch1_militia', 'ch1_treant', 'ch1_crow', 'ch1_raider', 'ch1_rat', 'ch1_warlord'],
      2: ['ch2_shaman', 'ch2_bomber', 'ch2_rider', 'ch2_bat', 'ch2_spore', 'ch2_sapper', 'ch2_worm', 'ch2_stalker', 'ch2_arachne', 'ch2_chieftain'],
      3: ['ch3_ghoul', 'ch3_archer', 'ch3_bonemage', 'ch3_wraith', 'ch3_abom', 'ch3_mummy', 'ch3_hound', 'ch3_scarab', 'ch3_guard', 'ch3_lord'],
      4: ['ch4_imp', 'ch4_hound', 'ch4_elemental', 'ch4_salamander', 'ch4_golem', 'ch4_harpy', 'ch4_cultist', 'ch4_knight', 'ch4_scorpion', 'ch4_ifrit'],
      5: ['ch5_thrall', 'ch5_succubus', 'ch5_warlock', 'ch5_gargoyle', 'ch5_cerberus', 'ch5_torturer', 'ch5_eye', 'ch5_guard', 'ch5_archfiend', 'ch5_general'],
      6: ['ch6_wolf', 'ch6_sprite', 'ch6_yeti', 'ch6_witch', 'ch6_crab', 'ch6_golem', 'ch6_knight', 'ch6_wyvern', 'ch6_banshee', 'ch6_titan'],
      7: ['ch7_toad', 'ch7_mosquito', 'ch7_slime', 'ch7_lizard', 'ch7_shaman', 'ch7_plant', 'ch7_leech', 'ch7_spider', 'ch7_croc', 'ch7_hydra'],
      8: ['ch8_spark', 'ch8_eagle', 'ch8_mage', 'ch8_golem', 'ch8_harpy', 'ch8_knight', 'ch8_elemental', 'ch8_wyrm', 'ch8_centaur', 'ch8_titan'],
      9: ['ch9_thrall', 'ch9_bat', 'ch9_nun', 'ch9_inquisitor', 'ch9_gargoyle', 'ch9_knight', 'ch9_priest', 'ch9_hound', 'ch9_executioner', 'ch9_lord'],
      10: ['ch10_wisp', 'ch10_stalker', 'ch10_horror', 'ch10_mage', 'ch10_construct', 'ch10_seraph', 'ch10_devourer', 'ch10_knight', 'ch10_eye', 'ch10_titan'],
    };
    const mids = CH_MOBS[chNum];
    if (mids) this.registerMobAnimsList(mids, `atlas_ch${chNum}`);
  }

  registerLegacyAnims() {
    this.registerMobAnimsList(['goblin', 'spider', 'skeleton', 'imp', 'orc', 'necromancer', 'boss_demon'], 'atlas_legacy');
  }

  generateFxTextures() {
    if (!this.textures.exists('fx_glow')) {
      const tex = this.textures.createCanvas('fx_glow', 64, 64);
      const ctx = tex.getContext();
      const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.35, 'rgba(255,255,255,0.65)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
      tex.refresh();
    }
  }

  createHero() {
    const cid = this.getState().classId || 'warrior';
    const cx = MAP_W / 2;
    const cy = MAP_H / 2;
    const texKey = cid === 'warrior' ? 'wf_down_walk_0' : (cid === 'ranger' ? 'rf_down_walk_0' : (cid === 'paladin' ? 'pf_down_walk_0' : (cid === 'necro' ? 'nf_down_walk_0' : (cid === 'assassin' ? 'af_down_walk_0' : 'mf_down_walk_0'))));

    this.heroGroundShadow = this.add.image(cx, cy + 44, 'fx_glow')
      .setTint(0x000000).setScale(1.7, 0.6).setAlpha(0.62).setDepth(2);
    const heroAtlas = this.getHeroAtlasKey(cid);
    this.heroCastShadow = this.add.image(cx - 14, cy + 28, heroAtlas, texKey)
      .setTint(0x000000).setScale(0.56, 0.25).setAlpha(0.32).setDepth(3);

    this.hero = this.add.sprite(cx, cy, heroAtlas, texKey).setScale(0.56).setDepth(cy);
    if (cid === 'warrior') this.hero.play('w_down_walk');
    else if (cid === 'ranger') this.hero.play('r_down_walk');
    else if (cid === 'mage') this.hero.play('m_down_walk');
    else if (cid === 'paladin') this.hero.play('p_down_walk');
    else if (cid === 'necro') this.hero.play('n_down_walk');
    else if (cid === 'assassin') this.hero.play('a_down_walk');

    this.heroHpBg = this.add.rectangle(cx, cy - 86, 108, 10, 0x0b0e14).setStrokeStyle(1.5, 0xc89b3c).setDepth(4000);
    this.heroHpFill = this.add.rectangle(cx - 54, cy - 86, 108, 8, 0x22c55e).setOrigin(0, 0.5).setDepth(4001);
    this.heroHpText = this.add.text(cx, cy - 101, '', {
      fontSize: '12px', color: '#f8fafc', fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(4002);
    this.petShadow = this.add.image(cx - 54, cy + 28, 'fx_glow').setTint(0x000000).setScale(0.65, 0.26).setAlpha(0.42).setDepth(2);
    this.petAura = this.add.image(cx - 54, cy - 14, 'fx_glow').setTint(0xf97316).setScale(0.95).setAlpha(0.32).setBlendMode(Phaser.BlendModes.ADD).setDepth(cy - 1);
    this.petBuddy = this.add.image(cx - 54, cy - 18, this.textures.exists('pet_pet_c1') ? 'pet_pet_c1' : 'fx_glow').setScale(0.46).setOrigin(0.5).setDepth(cy);
    this.petLabel = this.add.text(cx - 54, cy - 46, '', { fontSize: '11px', color: '#fde68a', fontFamily: 'Noto Sans TC, sans-serif', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(cy + 3);
    this._lastBattlePetId = null;
    this._petTrailAt = 0;
    this._petAutoAtkAt = 0;
    this._bossTelegraphAt = 0;
    this._perfectDodgeUntil = 0;
    this.comboCount = 0;
    this.comboExpireAt = 0;
    this.heroAfkText = this.add.text(cx, cy - 117, this.autoMoveEnabled ? '★ 自動狩獵' : '手動', {
      fontSize: '11px', color: this.autoMoveEnabled ? '#fde047' : '#cbd5e1',
      fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(4003);
    const battleNick = (this.getState?.()?.nickname || window.__IDLE_ARPG_BRIDGE__?.getState?.()?.nickname || '冒險者').trim();
    this.heroNameText = this.add.text(cx, cy - 140, battleNick, {
      fontSize: '20px',
      fontFamily: 'Noto Sans TC, sans-serif',
      fontStyle: 'bold',
      color: '#fef08a',
      stroke: '#000000',
      strokeThickness: 5,
      shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 6, fill: true },
    }).setOrigin(0.5).setDepth(4005);

    this.cameras.main.startFollow(this.hero, true, 0.14, 0.14);
    this.cameras.main.setZoom(0.86);
  }

  createMinimap() {
    this.miniW = 168;
    this.miniH = 96;
    this.miniX = 16;
    this.miniY = 16;
    this.miniBg = this.add.rectangle(this.miniX, this.miniY, this.miniW, this.miniH, 0x090b12, 0.78)
      .setOrigin(0, 0).setStrokeStyle(1.5, 0xc89b3c).setScrollFactor(0).setDepth(4990);
    this.miniGfx = this.add.graphics().setScrollFactor(0).setDepth(4991);
  }

  updateMinimap() {
    if (!this.miniGfx || !this.hero) return;
    const g = this.miniGfx;
    g.clear();

    g.fillStyle(0x64748b, 0.75);
    this.obstacles.forEach((ob) => {
      const ox = this.miniX + (ob.x / MAP_W) * this.miniW;
      const oy = this.miniY + (ob.y / MAP_H) * this.miniH;
      g.fillRect(ox - 1.5, oy - 1.5, 3, 3);
    });

    this.monsters.forEach((m) => {
      if (m.hp <= 0) return;
      const mx = this.miniX + (m.sprite.x / MAP_W) * this.miniW;
      const my = this.miniY + (m.sprite.y / MAP_H) * this.miniH;
      g.fillStyle(m.isBoss ? 0xf97316 : 0xef4444, 1);
      g.fillCircle(mx, my, m.isBoss ? 4.5 : 2.5);
    });

    const hx = this.miniX + (this.hero.x / MAP_W) * this.miniW;
    const hy = this.miniY + (this.hero.y / MAP_H) * this.miniH;
    g.fillStyle(0x4ade80, 1);
    g.fillCircle(hx, hy, 3.8);
  }

  toggleAutoMove() {
    this.autoMoveEnabled = !this.autoMoveEnabled;
    if (this.autoMoveEnabled) this.manualOverrideTimer = 0;
    if (this.heroAfkText) {
      this.heroAfkText.setText(this.autoMoveEnabled ? '★ 自動狩獵' : '手動');
      this.heroAfkText.setColor(this.autoMoveEnabled ? '#fde047' : '#cbd5e1');
    }
    return this.autoMoveEnabled;
  }

  getZoneIdx() {
    const stage = this.getState()?.stage || 1;
    return getChapterIdx(stage);
  }

  updateZoneBackground() {
    const idx = this.getZoneIdx();
    if (idx !== this.lastZoneIdx && this.bgImage) {
      this.lastZoneIdx = idx;
      this.bgImage.setTexture(`map_zone_${idx}`).setDisplaySize(MAP_W, MAP_H);
      this.rebuildZoneObstacles(idx);
    }
  }

  rebuildZoneObstacles(zoneIdx) {
    this.obstacles.forEach((ob) => {
      ob.sprite?.destroy();
      ob.shadow?.destroy();
    });
    this.obstacles = [];

    const pool = ZONE_OBSTACLES[zoneIdx] || ZONE_OBSTACLES[0];
    // 淨空中央主戰區 (1050~3050, 620~1680)，僅在外圍邊界與角落配置主題地標，絕不隨機擋路
    const slots = [
      [420, 380], [920, 340], [1680, 310], [2420, 310], [3180, 340], [3660, 390],
      [380, 1140], [3710, 1140],
      [440, 1920], [980, 1960], [1740, 1990], [2380, 1990], [3120, 1960], [3650, 1910],
    ];
    slots.forEach(([ox, oy], idx) => {
      const texKey = pool[idx % pool.length];
      const sc = 0.42 + (idx % 3) * 0.05;
      const shadow = this.add.image(ox, oy + 26, 'fx_glow').setTint(0x000000).setScale(1.4, 0.5).setAlpha(0.45).setDepth(2);
      const spr = this.add.image(ox, oy, texKey).setScale(sc).setDepth(oy);
      this.obstacles.push({ x: ox, y: oy, radius: 28, sprite: spr, shadow });
    });
  }

  resolveObstacleCollision(ent, entRadius = 26) {
    for (const ob of this.obstacles) {
      const dx = ent.x - ob.x;
      const dy = ent.y - ob.y;
      const dist = Math.hypot(dx, dy) || 0.01;
      const minD = ob.r + entRadius;
      if (dist < minD) {
        const push = minD - dist;
        ent.x = Phaser.Math.Clamp(ent.x + (dx / dist) * push, 140, MAP_W - 140);
        ent.y = Phaser.Math.Clamp(ent.y + (dy / dist) * push, 140, MAP_H - 140);
      }
    }
  }

  playRecallAnimation(tintColor = 0x38bdf8, onComplete) {
    if (!this.hero) {
      onComplete?.();
      return;
    }
    const hx = this.hero.x;
    const hy = this.hero.y;
    const sigil = this.textures.exists('fx_sigil')
      ? this.add.image(hx, hy + 24, 'fx_sigil').setTint(tintColor).setScale(0.25).setAlpha(0.95).setDepth(4200)
      : null;
    const beam = this.textures.exists('fx_glow')
      ? this.add.image(hx, hy - 40, 'fx_glow').setTint(tintColor).setScale(0.45, 2.4).setAlpha(0).setDepth(4300)
      : null;

    if (sigil) {
      this.tweens.add({
        targets: sigil,
        scale: 1.05,
        angle: 180,
        alpha: 0,
        duration: 720,
        ease: 'Cubic.easeOut',
        onComplete: () => sigil.destroy(),
      });
    }
    if (beam) {
      this.tweens.add({
        targets: beam,
        alpha: 0.78,
        scaleX: 0.85,
        duration: 340,
        yoyo: true,
        onComplete: () => beam.destroy(),
      });
    }
    this.tweens.add({
      targets: this.hero,
      alpha: 0.2,
      scaleX: 0.64,
      scaleY: 0.64,
      duration: 680,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (this.hero) {
          this.hero.setAlpha(1);
          this.hero.setScale(0.56);
        }
        onComplete?.();
      },
    });
  }

  setPaused(paused) {
    this.isPaused = paused;
  }

  getSlotSkillInfo(slotIdx) {
    const state = this.getState();
    const cid = state.classId || 'warrior';
    const eqList = state.equippedSkillsByClass?.[cid] || [];

    if (cid === 'warrior' || cid === 'ranger' || cid === 'mage' || cid === 'paladin' || cid === 'necro' || cid === 'assassin') {
      const book = cid === 'warrior' ? WARRIOR_SKILLS : (cid === 'ranger' ? RANGER_SKILLS : (cid === 'paladin' ? PALADIN_SKILLS : (cid === 'necro' ? NECRO_SKILLS : (cid === 'assassin' ? ASSASSIN_SKILLS : MAGE_SKILLS))));
      const sid = eqList[slotIdx];
      if (!sid || !book[sid]) return null;
      const sk = book[sid];
      const lvl = state.skillTree?.[sk.treeNodeId] || 0;
      if (lvl <= 0) return null;
      const cd = Math.round(sk.cooldownMs * (this.getStats().cdrMult || 1));
      const mpCost = ['bladestorm', 'phantombow', 'void_beam', 'execute_cleave', 'earth_stomp', 'shadow_clones', 'death_mark', 'black_hole', 'judgment', 'consecration', 'holy_aegis', 'blood_golem', 'wraith_army', 'bone_prison', 'shadow_execute', 'venom_burst', 'lethal_fangs'].includes(sid) ? 26 : (sid === 'mana_overload' ? 0 : 18);
      return { id: sid, name: sk.name, cooldownMs: cd, level: lvl, cid, mpCost };
    }
    if (slotIdx > 0) return null;
    const cls = CLASSES[cid] || CLASSES.mage;
    const cd = Math.round(cls.skill.cooldownMs * (this.getStats().cdrMult || 1));
    return { id: cls.skill.type, name: cls.skill.name, cooldownMs: cd, level: 1, cid: 'mage', cls };
  }

  getAimPoint(isManual = false, maxRange = 460) {
    if (isManual && this.hasPointerMoved && this.input?.activePointer) {
      const pt = this.cameras.main.getWorldPoint(this.input.activePointer.x, this.input.activePointer.y);
      const dx = pt.x - this.hero.x;
      const dy = pt.y - this.hero.y;
      const dist = Math.hypot(dx, dy) || 1;
      const clamped = Math.min(dist, maxRange);
      return {
        x: Phaser.Math.Clamp(this.hero.x + (dx / dist) * clamped, 160, MAP_W - 160),
        y: Phaser.Math.Clamp(this.hero.y + (dy / dist) * clamped, 160, MAP_H - 160),
        mob: this.findNearestMonster(pt.x, pt.y, 180) || this.findNearestMonster(this.hero.x, this.hero.y),
      };
    }
    return this.findDensestClusterCenter(maxRange);
  }

  findDensestClusterCenter(maxRange = 480) {
    const alive = this.monsters.filter((m) => m.hp > 0);
    if (alive.length === 0) return { x: this.hero.x + 120, y: this.hero.y, mob: null };
    let pool = alive.filter((m) => Phaser.Math.Distance.Between(this.hero.x, this.hero.y, m.sprite.x, m.sprite.y) <= maxRange);
    if (pool.length === 0) pool = alive;
    let best = pool[0];
    let bestScore = -1;
    for (const cand of pool) {
      let score = cand.isBoss ? 2.5 : 0;
      for (const other of alive) {
        if (Phaser.Math.Distance.Between(cand.sprite.x, cand.sprite.y, other.sprite.x, other.sprite.y) <= 195) {
          score += 1;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        best = cand;
      }
    }
    return { x: best.sprite.x, y: best.sprite.y, mob: best };
  }

  shouldAutoCastSkill(skillId) {
    if (skillId === 'shadowstep' || skillId === 'frost_nova') {
      const lowHp = this.playerHp < this.playerMaxHp * 0.72;
      let near = 0;
      for (const m of this.monsters) {
        if (m.hp > 0 && Phaser.Math.Distance.Between(this.hero.x, this.hero.y, m.sprite.x, m.sprite.y) <= 200) near++;
      }
      return lowHp || near >= 2;
    }
    return true;
  }

  castSkillSlot(slotIdx, isManual = false) {
    if (this.isPaused || this.isTransitioning || this.monsters.length === 0) return false;
    const info = this.getSlotSkillInfo(slotIdx);
    if (!info) return false;
    if (this.slotCdTimers[slotIdx] < info.cooldownMs) return false;
    if (!isManual && !this.shouldAutoCastSkill(info.id)) return false;
    const cost = info.mpCost || 18;
    const tree = this.getState().skillTree || {};
    const freeAstral = ((this.getState().classId === 'mage' && (tree.m_key_astral || 0) > 0 && Math.random() < 0.35) || (this.getState().classId === 'ranger' && (this.time?.now || 0) < (this._rInnerSightUntil || 0)));
    const curCid = this.getState().classId;
    if (!freeAstral && this.playerMp < cost) {
      if (isManual) {
        const rMap = {
          warrior: ['能量不足!', '#fb923c'],
          ranger:  ['精力不足!', '#34d399'],
          mage:    ['魔力不足!', '#60a5fa'],
          paladin: ['聖能不足!', '#fde047'],
          necro:   ['魂能不足!', '#5eead4'],
          assassin:['影能不足!', '#d8b4fe'],
        };
        const [rName, rCol] = rMap[curCid] || rMap.mage;
        this.spawnFloatingText(this.hero.x, this.hero.y - 90, rName, rCol, 14);
      }
      return false;
    }
    if (!freeAstral) this.playerMp = Math.max(0, this.playerMp - cost);
    const echoRefund = (curCid === 'mage' && this.getStats().activeEffects.has('arcane_echo') && Math.random() < 0.25);
    const buildMods = computeSkillBuildMods(this.getState(), curCid, info.id, info.level);
    this._activeBuildMods = buildMods;
    this._activeBuildModsUntil = (this.time?.now || 0) + 1200;
    const effCd = Math.max(900, Math.round(info.cooldownMs * (buildMods.cdMult || 1)));
    const cdSaved = Math.max(0, info.cooldownMs - effCd);
    this.slotCdTimers[slotIdx] = freeAstral ? Math.round(info.cooldownMs * 0.3) : (echoRefund ? Math.round(info.cooldownMs * 0.5) : cdSaved);

    const stNow = this.getStats();
    const mechCfg = getClassMechanicConfig(this.getState(), curCid);
    const nowCastT = this.time?.now || 0;

    // v234: 施放技能觸發六大職業專屬機制
    if (curCid === 'warrior') {
      this._wCastCount = (this._wCastCount || 0) + 1;
      if (this._wCastCount >= 3) {
        this._wCastCount = 0;
        this._wArsenalOverloadUntil = nowCastT + 1500;
        this.spawnFloatingText(this.hero.x, this.hero.y - 102, '⚔️武器精通過載!', '#38bdf8', 15);
      }
    } else if (curCid === 'ranger') {
      if (mechCfg.specialization === 'combo_points' && (this._rComboStars || 0) > 0) {
        this._rSpentStars = this._rComboStars;
        this._rComboStars = 0;
        this._rSpentStarsUntil = nowCastT + 1200;
        this.spawnFloatingText(this.hero.x, this.hero.y - 102, `★消耗 ${this._rSpentStars} 星連擊爆發!`, '#4ade80', 14);
      } else if (mechCfg.specialization === 'preparation') {
        this.slotCdTimers = this.slotCdTimers.map((t, idx) => (idx === slotIdx ? t : t + 1100));
      }
    } else if (curCid === 'mage') {
      const ench = mechCfg.enchants || [];
      this._mCastCount = (this._mCastCount || 0) + 1;
      if (ench.includes('chain_lightning') && this._mCastCount % 2 === 0 && this.monsters.length > 0) {
        const tgt = this.findNearestMonster(this.hero.x, this.hero.y);
        if (tgt && tgt.hp > 0) {
          this.playAdditiveVfx('vfx_react_superconduct', tgt.sprite.x, tgt.sprite.y - 12, 0.55, 320);
          if (!tgt._statuses) tgt._statuses = {};
          tgt._statuses.shock = Math.max(tgt._statuses.shock || 0, nowCastT + 4500);
          this.damageMonster(tgt, Math.round(stNow.atk * 1.5), true, false, '#facc15', '⚡附魔雷鏈 ', true);
        }
      }
    } else if (curCid === 'paladin') {
      if (mechCfg.oath === 'martyr_oath' && this.playerHp > this.playerMaxHp * 0.15) {
        this.playerHp = Math.max(1, Math.round(this.playerHp - this.playerMaxHp * 0.03));
      }
    } else if (curCid === 'assassin') {
      if ((this._aShadowStars || 0) >= 5) {
        this._aShadowStars = 0;
        this._aFiveStarUntil = nowCastT + 1200;
        this.spawnFloatingText(this.hero.x, this.hero.y - 102, '🌑五星暗影絕殺爆發!', '#c084fc', 16);
      }
    }

    if (info.cid === 'warrior') {
      this.castWarriorSkill(info.id, info.level, stNow, isManual);
    } else if (info.cid === 'ranger') {
      this.castRangerSkill(info.id, info.level, stNow, isManual);
    } else if (info.cid === 'mage') {
      this.castMageSkill(info.id, info.level, stNow, isManual);
    } else if (info.cid === 'paladin') {
      this.castPaladinSkill(info.id, info.level, stNow, isManual);
    } else if (info.cid === 'necro') {
      this.castNecroSkill(info.id, info.level, stNow, isManual);
    } else if (info.cid === 'assassin') {
      this.castAssassinSkill(info.id, info.level, stNow, isManual);
    }
    this.lungeHeroJuice(1.09, 0.93);
    return true;
  }

  usePotion(isManual = true) {
    if (this.isPaused || this.isTransitioning) return false;
    if (this.potionCharges <= 0) {
      if (isManual && this.hero) this.spawnFloatingText(this.hero.x, this.hero.y - 88, '藥水冷卻中!', '#fca5a5', 14);
      return false;
    }
    if (this.playerHp >= this.playerMaxHp) return false;
    this.potionCharges -= 1;
    const healAmt = Math.max(15, Math.round(this.playerMaxHp * 0.45));
    this.healHero(healAmt);
    if (this.hero) {
      this.playFxSprite('wfx_blood_ring', this.hero.x, this.hero.y, 0.72, 0, 320);
      this.spawnFloatingText(this.hero.x, this.hero.y - 88, `+${formatNum(healAmt)} 🧪`, '#4ade80', 16);
    }
    return true;
  }

  refreshHeroClass() {
    const cid = this.getState().classId || 'warrior';
    this.ensureClassLoaded(cid, () => {
      this._applyRefreshHeroClass();
    });
  }

  _applyRefreshHeroClass() {
    if (this.summons) {
      this.summons.forEach((s) => { s.sprite?.destroy(); s.barBg?.destroy(); s.barFill?.destroy(); s.label?.destroy(); });
      this.summons = [];
    }
    const stats = this.getStats();
    this.playerMaxHp = stats.maxHp;
    this.playerHp = stats.maxHp;
    this.playerMaxMp = stats.maxMp || 100;
    this.playerMp = this.playerMaxMp;
    this.slotCdTimers = [99999, 99999, 99999, 99999, 99999, 99999];
    this.basicComboStep = 0;
    this.warriorGuardStacks = 0;
    this.arcaneChargeStacks = 0;
    this.mageShieldHp = this.getState().classId === 'mage' ? Math.round(stats.maxHp * 0.15) : 0;
    this.updateHeroVisualPose(0, 0, this.time.now);
    this.updateHeroHpBar();
  }

  syncMaxHp() {
    const stats = this.getStats();
    const diff = stats.maxHp - this.playerMaxHp;
    this.playerMaxHp = stats.maxHp;
    this.playerMaxMp = stats.maxMp || 100;
    this.playerMp = Math.min(this.playerMaxMp, this.playerMp);
    if (diff > 0) this.playerHp = Math.min(this.playerMaxHp, this.playerHp + diff);
    else this.playerHp = Math.min(this.playerMaxHp, this.playerHp);
    this.updateHeroHpBar();
  }

  clearAllMonsters() {
    this.monsters.forEach((m) => {
      m.sprite?.destroy();
      m.groundShadow?.destroy();
      m.castShadow?.destroy();
      m.hpBg?.destroy();
      m.hpFill?.destroy();
      m.nameText?.destroy();
    });
    this.monsters = [];
    this.projectiles.forEach((p) => p.sprite?.destroy());
    this.projectiles = [];
  }

  spawnMonsterInstance(data, angle, fixedX = null, fixedY = null) {
    const dist = data.isBoss ? 480 : Phaser.Math.Between(380, 650);
    const sx = fixedX !== null ? Phaser.Math.Clamp(fixedX, 220, MAP_W - 220)
      : Phaser.Math.Clamp(this.hero.x + Math.cos(angle) * dist, 220, MAP_W - 220);
    const sy = fixedY !== null ? Phaser.Math.Clamp(fixedY, 270, MAP_H - 180)
      : Phaser.Math.Clamp(this.hero.y + Math.sin(angle) * dist, 270, MAP_H - 180);

    const groundShadow = this.add.image(sx, sy + 40, 'fx_glow')
      .setTint(0x000000).setScale(data.isBoss ? 2.1 : 1.3, data.isBoss ? 0.72 : 0.45).setAlpha(0.58).setDepth(2);
    const mak = this.getMobAtlasKey(data.id);
    const initKey = `mob_${data.id}_walk_0`;
    const castShadow = this.add.image(sx - 12, sy + 26, mak, initKey)
      .setTint(0x000000).setScale(data.scale, data.scale * 0.42).setAlpha(0.28).setDepth(3);

    const sprite = this.add.sprite(sx, sy, mak, initKey).setScale(data.scale).setDepth(sy).setAlpha(0);
    sprite.play(`mob_${data.id}_walk`);
    this.tweens.add({ targets: sprite, alpha: 1, duration: 260 });

    const barW = data.isBoss ? 140 : 72;
    const hpBg = this.add.rectangle(sx, sy - (data.isBoss ? 100 : 64), barW, 8, 0x0b0e14).setStrokeStyle(1, 0x64748b).setDepth(3500);
    const hpFill = this.add.rectangle(sx - barW / 2, sy - (data.isBoss ? 100 : 64), barW, 6, data.isBoss ? 0xf97316 : 0xef4444).setOrigin(0, 0.5).setDepth(3501);
    const mobTag = data.isBoss ? data.name : (data.isAggressive ? `🔴 ${data.name}` : `⚪ ${data.name}`);
    const mobCol = data.isBoss ? '#fb923c' : (data.isAggressive ? '#fca5a5' : '#cbd5e1');
    const nameText = this.add.text(sx, sy - (data.isBoss ? 116 : 78), mobTag, {
      fontSize: data.isBoss ? '12.5px' : '11px', color: mobCol, fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(3502);

    this.monsters.push({
      ...data,
      sprite,
      groundShadow,
      castShadow,
      hpBg,
      hpFill,
      barW,
      nameText,
      attackTimer: Phaser.Math.Between(0, 900),
      dustTimer: Phaser.Math.Between(0, 500),
      bossSkillTimer: 2800,
      bobPhase: Math.random() * Math.PI * 2,
      homeX: sx,
      homeY: sy,
      roamAngle: Math.random() * Math.PI * 2,
      roamTimer: 0,
      jitterAngle: Math.random() * Math.PI * 2,
      stunUntil: 0,
      slowUntil: 0,
    });
  }

  spawnWaveSquad() {
    this.collectAllGroundLoot?.();
    const zoneIdx = this.getZoneIdx();
    this.ensureChapterLoaded(zoneIdx, () => {
      this._applySpawnWaveSquad();
    });
  }

  _applySpawnWaveSquad() {
    this.updateZoneBackground();
    this.clearAllMonsters();

    if (this.hero) {
      this.hero.setPosition(MAP_W / 2, MAP_H / 2);
      this.heroDir = 'down';
      this.heroFlipX = false;
    }

    const state = this.getState();
    const encounters = createStageEncounters(state.stage);
    this.isTransitioning = false;
    this.waveKills = 0;
    this.waveElapsedSec = 0;
    this.swarmSpawnTimer = 0;
    this.stageTotalMonsters = encounters.length;
    this.waveTargetKills = encounters.length;
    this.isBossWave = encounters.some((e) => e.mob.isBoss);
    this.bossEngaged = false;
    this.bossTimeLeft = 40;

    encounters.forEach((enc) => {
      this.spawnMonsterInstance(enc.mob, Math.PI, enc.x, enc.y);
    });

    this.updateHeroHpBar();
    this.updateWaveBanner();
  }

  updateWaveBanner() {
    if (!this.waveInfoText) return;
    const lbl = getStageLabel(this.getState()?.stage || 1);
    const rem = this.monsters.filter((m) => m.hp > 0).length;
    if (this.bossEngaged) {
      this.waveInfoText.setColor('#fb923c');
      this.waveInfoText.setText(`🔥 第 ${lbl} 關首領激戰！剩餘 ${rem} 隻・倒數: ${Math.max(0, this.bossTimeLeft).toFixed(1)}s`);
    } else {
      this.waveInfoText.setColor('#fde68a');
      this.waveInfoText.setText(`⚔️ 第 ${lbl} 關・剩餘怪物: ${rem} / ${this.stageTotalMonsters}（需全數擊殺）`);
    }
  }

  findNearestMonster(x, y, maxRange = Infinity) {
    let best = null;
    let bestDist = maxRange;
    for (const m of this.monsters) {
      if (m.hp <= 0) continue;
      const d = Phaser.Math.Distance.Between(x, y, m.sprite.x, m.sprite.y);
      if (d < bestDist) {
        bestDist = d;
        best = m;
      }
    }
    return best;
  }

  update(time, delta) {
    if (this.isPaused) return;

    const ratios = [0, 0, 0, 0, 0, 0];
    const cdDetails = [null, null, null, null, null, null];
    for (let i = 0; i < 6; i++) {
      const info = this.getSlotSkillInfo(i);
      if (info) {
        this.slotCdTimers[i] = Math.min(info.cooldownMs, this.slotCdTimers[i] + delta);
        const r = this.slotCdTimers[i] / info.cooldownMs;
        ratios[i] = r;
        cdDetails[i] = { ratio: r, remMs: Math.max(0, info.cooldownMs - this.slotCdTimers[i]), mpCost: info.mpCost || 18 };
      }
    }
    this.updateMageBattlefieldEntities(delta);
    this.updateNecroBattlefieldEntities(delta);
    const stForMp = this.getStats();
    const dtSec = delta / 1000;
    this.playerMaxMp = stForMp.maxMp || 100;
    this.playerMp = Math.min(this.playerMaxMp, this.playerMp + (stForMp.mpRegenPerSec || 8) * dtSec);
    if (this.potionCharges < this.potionMaxCharges) {
      this.potionRechargeTimer += delta;
      if (this.potionRechargeTimer >= 12000) {
        this.potionRechargeTimer = 0;
        this.potionCharges += 1;
      }
    }
    if (this.autoMoveEnabled && this.potionCharges > 0 && this.playerHp > 0 && this.playerHp < this.playerMaxHp * 0.35) {
      this.usePotion(false);
    }
    if (this.callbacks?.onSkillTicks) {
      this.callbacks.onSkillTicks(ratios, cdDetails);
    }
    if (this.callbacks?.onVitalsTick) {
      this.callbacks.onVitalsTick({
        hp: this.playerHp,
        maxHp: this.playerMaxHp,
        mp: this.playerMp,
        maxMp: this.playerMaxMp,
        potions: this.potionCharges,
        maxPotions: this.potionMaxCharges,
      });
    }

    this.hudTickTimer = (this.hudTickTimer || 0) + delta;
    if (this.hudTickTimer >= 100) {
      this.hudTickTimer = 0;
      if (this.callbacks?.onHudTick && this.hero) {
        const remMobs = this.monsters.filter((m) => m.hp > 0);
        const bossTarget = remMobs.find((m) => m.isBoss && this.bossEngaged);
        const lockTarget = bossTarget || this.findNearestMonster(this.hero.x, this.hero.y, 900);
        this.callbacks.onHudTick({
          target: lockTarget ? {
            name: lockTarget.name,
            hp: lockTarget.hp,
            maxHp: lockTarget.maxHp,
            isBoss: !!lockTarget.isBoss,
            stage: lockTarget.stage || this.getState()?.stage || 1,
          } : null,
          tracker: {
            remaining: remMobs.length,
            mapKills: this.mapKills || 0,
            bossEvery: 24,
            bossEngaged: remMobs.some((m) => m.isBoss),
            bossTimeLeft: this.bossTimeLeft || 0,
          },
          minimap: {
            mode: 'battle',
            chapterIdx: this.getZoneIdx(),
            bgUrl: `./assets/bg/map_${this.getZoneIdx()}.jpg`,
            zoneName: document.getElementById('hud-stage-title')?.textContent || '前線戰場',
            heroX: this.hero.x,
            heroY: this.hero.y,
            heroDir: this.heroDir,
            heroFlipX: !!this.heroFlipX,
            mapW: MAP_W,
            mapH: MAP_H,
            obstacles: this.obstacles,
            monsters: remMobs.map((m) => ({
              x: m.sprite.x,
              y: m.sprite.y,
              hp: m.hp,
              isBoss: !!m.isBoss,
              isElite: !!m.isElite,
            })),
          },
        });
      }
    }
    if (this.isTransitioning) return;

    const stats = this.getStats();
    const dt = delta / 1000;
    this.waveElapsedSec += dt;



    const cid = this.getState().classId || 'warrior';
    this.updateHeroMovement(time, delta, dt, stats, cid);
    this.updateMonstersAI(time, delta, dt, stats);
    this.updateProjectiles(dt, stats);
    this.updateSummons(dt, stats);

    const TARGET_MOBS = 29;
    this.rollingSpawnTimer = (this.rollingSpawnTimer || 0) + delta;
    if (this.rollingSpawnTimer >= 850) {
      this.rollingSpawnTimer = 0;
      // 清理已死亡的殘留物件引用，保持陣列輕量
      if (this.monsters.length > 60) {
        this.monsters = this.monsters.filter((m) => m.hp > 0);
      }
      const aliveCount = this.monsters.filter((m) => m.hp > 0).length;
      if (aliveCount < TARGET_MOBS) {
        const curStage = this.getState().stage || 1;
        const need = Math.min(3, TARGET_MOBS - aliveCount);
        for (let i = 0; i < need; i++) {
          const mob = spawnSingleMonster(curStage, false);
          const ang = Math.random() * Math.PI * 2;
          const dist = 620 + Math.random() * 340;
          const rx = Phaser.Math.Clamp(this.hero.x + Math.cos(ang) * dist, 220, MAP_W - 220);
          const ry = Phaser.Math.Clamp(this.hero.y + Math.sin(ang) * dist * 0.72, 240, MAP_H - 200);
          this.spawnMonsterInstance(mob, ang, rx, ry);
        }
      }
    }

    const nearest = this.findNearestMonster(this.hero.x, this.hero.y);
    if (nearest) {
      const atkRange = (cid === 'warrior' || cid === 'paladin' || cid === 'assassin') ? 170 : (cid === 'ranger' ? 430 : 370);
      const dist = Phaser.Math.Distance.Between(this.hero.x, this.hero.y, nearest.sprite.x, nearest.sprite.y);

      if (dist <= Math.max(260, atkRange)) {
        const eqIds = this.getState()?.equippedSkillsByClass?.[cid] || [];
        const smartOrder = getSmartAutoSlotOrder(eqIds, this.monsters, time);
        const orderToTry = smartOrder.length ? smartOrder : [0, 1, 2, 3, 4, 5];
        for (const sIdx of orderToTry) {
          if (this.castSkillSlot(sIdx)) break;
        }
      }

      this.heroAttackTimer += delta;
      const tree = this.getState().skillTree || {};
      const lowBloodKey = cid === 'warrior' && (tree.w_key_blood || 0) > 0 && this.playerHp < this.playerMaxHp * 0.55;
      const spdMult = (time < this.warcryUntil ? 1.35 : 1) * (time < this.windwalkUntil ? 1.40 : 1) * (time < (this.lethalFangsUntil || 0) ? 1.45 : 1) * (lowBloodKey ? 1.45 : 1);
      const effInterval = Math.max(180, Math.round(stats.atkIntervalMs / spdMult));
      if (this.heroAttackTimer >= effInterval && dist <= atkRange) {
        this.heroAttackTimer = 0;
        this.performHeroAttack(time, stats, cid, nearest);
      }
    }

    const bossMob = this.monsters.find((m) => m.hp > 0 && m.isBoss);
    if (bossMob && Phaser.Math.Distance.Between(this.hero.x, this.hero.y, bossMob.sprite.x, bossMob.sprite.y) <= 820) {
      this.bossEngaged = true;
    }
    if (this.bossEngaged && bossMob) {
      this.bossTimeLeft -= dt;
      this.updateWaveBanner();
      // 持續刷圖模式：不因首領倒數強制踢回起點
    }
  }

  updateHeroMovement(time, delta, dt, stats, classId) {
    let kx = 0;
    let ky = 0;
    if (this.keys) {
      if (this.keys.a.isDown || this.keys.left.isDown) kx -= 1;
      if (this.keys.d.isDown || this.keys.right.isDown) kx += 1;
      if (this.keys.w.isDown || this.keys.up.isDown) ky -= 1;
      if (this.keys.s.isDown || this.keys.down.isDown) ky += 1;
    }

    let vx = 0;
    let vy = 0;

    if (kx !== 0 || ky !== 0) {
      const len = Math.hypot(kx, ky) || 1;
      vx = (kx / len) * stats.moveSpeed * 1.28;
      vy = (ky / len) * stats.moveSpeed * 1.28;
      this.manualOverrideTimer = 2500;
    } else {
      if (this.manualOverrideTimer > 0) this.manualOverrideTimer = Math.max(0, this.manualOverrideTimer - delta);

      this.updateGroundLoot(time);
      if (this.lootClickTarget && this.manualOverrideTimer <= 0) {
        const ldx = this.lootClickTarget.x - this.hero.x;
        const ldy = this.lootClickTarget.y - this.hero.y;
        const ld = Math.hypot(ldx, ldy);
        if (ld <= 46 || !this.groundLoot?.includes(this.lootClickTarget)) {
          this.lootClickTarget = null;
        } else {
          vx = (ldx / ld) * stats.moveSpeed * 1.15;
          vy = (ldy / ld) * stats.moveSpeed * 1.15;
        }
      } else if (this.autoMoveEnabled && this.manualOverrideTimer <= 0) {
        const nearestLoot = this.findNearestGroundLoot?.(this.hero.x, this.hero.y);
        const nearest = this.findNearestMonster(this.hero.x, this.hero.y);
        const nearDist = nearest ? Math.hypot(nearest.sprite.x - this.hero.x, nearest.sprite.y - this.hero.y) : Infinity;
        if (nearestLoot && (!nearest || nearDist > 260)) {
          const ldx = nearestLoot.x - this.hero.x;
          const ldy = nearestLoot.y - this.hero.y;
          const ld = Math.hypot(ldx, ldy) || 1;
          vx = (ldx / ld) * stats.moveSpeed * 1.08;
          vy = (ldy / ld) * stats.moveSpeed * 1.08;
        } else if (nearest) {
          const isRanged = classId === 'ranger' || classId === 'mage' || classId === 'necro';
          if (isRanged) {
            // 遠攻智慧風箏：計算近身怪物合斥力 + 邊界安全避讓
            let repX = 0;
            let repY = 0;
            let threatCount = 0;
            const dangerR = classId === 'ranger' ? 195 : 215;
            for (const m of this.monsters) {
              if (m.hp <= 0) continue;
              const mdx = this.hero.x - m.sprite.x;
              const mdy = this.hero.y - m.sprite.y;
              const md = Math.hypot(mdx, mdy) || 1;
              if (md < dangerR) {
                const w = (dangerR - md) / dangerR;
                repX += (mdx / md) * w;
                repY += (mdy / md) * w;
                threatCount++;
              }
            }
            if (threatCount > 0) {
              // 邊界推離，防止退到牆角被圍
              if (this.hero.x < 360) repX += 0.9;
              if (this.hero.x > MAP_W - 360) repX -= 0.9;
              if (this.hero.y < 320) repY += 0.9;
              if (this.hero.y > MAP_H - 320) repY -= 0.9;
              const rLen = Math.hypot(repX, repY) || 1;
              // 加入少許側向切線方便滑步風箏
              const nx = repX / rLen;
              const ny = repY / rLen;
              vx = (nx * 0.85 - ny * 0.35) * stats.moveSpeed;
              vy = (ny * 0.85 + nx * 0.35) * stats.moveSpeed;
            } else {
              const dx = nearest.sprite.x - this.hero.x;
              const dy = nearest.sprite.y - this.hero.y;
              const dist = Math.hypot(dx, dy) || 1;
              const idealR = classId === 'ranger' ? 310 : 335;
              if (dist > idealR + 35) {
                vx = (dx / dist) * stats.moveSpeed;
                vy = (dy / dist) * stats.moveSpeed;
              } else if (dist < idealR - 45) {
                vx = (-dx / dist) * stats.moveSpeed * 0.65;
                vy = (-dy / dist) * stats.moveSpeed * 0.65;
              } else {
                vx = (-dy / dist) * stats.moveSpeed * 0.48;
                vy = (dx / dist) * stats.moveSpeed * 0.48;
              }
            }
          } else {
            // 近戰智慧聚怪：優先切入怪群中心
            const cluster = this.findDensestClusterCenter(420);
            const tx = cluster.mob ? cluster.x : nearest.sprite.x;
            const ty = cluster.mob ? cluster.y : nearest.sprite.y;
            const dx = tx - this.hero.x;
            const dy = ty - this.hero.y;
            const dist = Math.hypot(dx, dy) || 1;
            if (dist > 112) {
              vx = (dx / dist) * stats.moveSpeed;
              vy = (dy / dist) * stats.moveSpeed;
            } else if (dist > 78) {
              vx = (-dy / dist) * stats.moveSpeed * 0.32;
              vy = (dx / dist) * stats.moveSpeed * 0.32;
            }
          }
        } else {
          const dx = this.patrolTarget.x - this.hero.x;
          const dy = this.patrolTarget.y - this.hero.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 28) {
            this.patrolTarget = {
              x: Phaser.Math.Between(360, MAP_W - 360),
              y: Phaser.Math.Between(280, MAP_H - 280),
            };
          } else {
            vx = (dx / dist) * stats.moveSpeed * 0.75;
            vy = (dy / dist) * stats.moveSpeed * 0.75;
          }
        }
      }
    }

    const lerp = Math.min(1, dt * 14);
    this.smoothVx = Phaser.Math.Linear(this.smoothVx, vx, lerp);
    this.smoothVy = Phaser.Math.Linear(this.smoothVy, vy, lerp);
    if (Math.hypot(this.smoothVx, this.smoothVy) < 4) {
      this.smoothVx = 0;
      this.smoothVy = 0;
    }

    this.hero.x = Phaser.Math.Clamp(this.hero.x + this.smoothVx * dt, 200, MAP_W - 200);
    this.hero.y = Phaser.Math.Clamp(this.hero.y + this.smoothVy * dt, 220, MAP_H - 200);
    this.resolveObstacleCollision(this.hero, 28);
    this.hero.setDepth(this.hero.y);

    this.updateHeroVisualPose(this.smoothVx, this.smoothVy, time);

    if (Math.hypot(vx, vy) > 25) {
      this.afterimageTimer += delta;
      if (this.afterimageTimer >= 135 && !window.__powerSaveMode && (window.__gameSettings?.graphics?.particles || 'high') !== 'low') {
        this.afterimageTimer = 0;
        const tint = classId === 'ranger' ? 0x34d399 : (classId === 'mage' ? 0xc084fc : 0xfbbf24);
        const ghost = this.add.image(this.hero.x, this.hero.y, this.hero.texture.key)
          .setScale(0.54).setFlipX(this.heroFlipX).setAlpha(0.24).setTint(tint).setDepth(this.hero.y - 1);
        this.tweens.add({ targets: ghost, alpha: 0, duration: 220, onComplete: () => ghost.destroy() });
      }
    }

    this.heroGroundShadow.setPosition(this.hero.x, this.hero.y + 44);
    this.heroCastShadow.setPosition(this.hero.x - 14, this.hero.y + 28).setFlipX(this.heroFlipX);
    this.heroCastShadow.setTexture(this.hero.texture.key, this.hero.frame.name);
    this.heroHpBg.setPosition(this.hero.x, this.hero.y - 86);
    this.heroHpFill.setPosition(this.hero.x - 54, this.hero.y - 86);
    this.heroHpText.setPosition(this.hero.x, this.hero.y - 101);
    if (this.heroAfkText) this.heroAfkText.setPosition(this.hero.x, this.hero.y - 117);
    if (this.heroNameText) {
      this.heroNameText.setPosition(this.hero.x, this.hero.y - 140);
      const curNick = (this.getState?.()?.nickname || window.__IDLE_ARPG_BRIDGE__?.getState?.()?.nickname || '冒險者').trim();
      if (this.heroNameText.text !== curNick) this.heroNameText.setText(curNick);
    }
    this.updatePetCompanion?.(time);
    this.updateCombatFeel?.(time);
  }

  triggerHeroAttackAnim(durationMs = 340) {
    const now = this.time?.now || 0;
    this.heroAttackAnimUntil = now + durationMs;
    if (!this.hero) return;
    const cid = this.getState().classId || 'warrior';
    const prefix = cid === 'warrior' ? 'w' : (cid === 'ranger' ? 'r' : (cid === 'paladin' ? 'p' : (cid === 'necro' ? 'n' : (cid === 'assassin' ? 'a' : 'm'))));
    const atkKey = `${prefix}_${this.heroDir || 'down'}_atk`;
    if (this.anims.exists(atkKey)) {
      this.hero.anims.timeScale = 1;
      if (this.hero.anims.isPaused) this.hero.anims.resume();
      this.hero.play(atkKey, false);
    }
    this.tweens.add({
      targets: this.hero,
      scaleX: 0.61,
      scaleY: 0.53,
      duration: 95,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  updateHeroVisualPose(vx, vy, time = 0) {
    const cid = this.getState().classId || 'warrior';
    const spd = Math.hypot(vx, vy);
    if (spd > 18) {
      this.heroIsMoving = true;
      this.heroStopAt = time + 140;
    } else if (spd < 8 && time >= (this.heroStopAt || 0)) {
      this.heroIsMoving = false;
    }
    const isMoving = !!this.heroIsMoving;
    const isAttacking = time < this.heroAttackAnimUntil;

    if (isMoving && !isAttacking && time >= (this.heroDirLockUntil || 0)) {
      let nextDir = this.heroDir;
      let nextFlip = this.heroFlipX;
      if (Math.abs(vy) > Math.abs(vx) * 1.35 && Math.abs(vy) > 18) {
        nextDir = vy < 0 ? 'up' : 'down';
        nextFlip = false;
      } else if (Math.abs(vx) > 20) {
        nextDir = 'right';
        nextFlip = vx < 0;
      }
      if (nextDir !== this.heroDir || nextFlip !== this.heroFlipX) {
        this.heroDir = nextDir;
        this.heroFlipX = nextFlip;
        this.heroDirLockUntil = time + 90;
      }
    }
    this.hero.setFlipX(this.heroFlipX);
    if (!isAttacking) {
      if (isMoving) {
        const bounce = Math.abs(Math.sin(time * 0.016));
        this.hero.setScale(0.56 * (1.02 - bounce * 0.04), 0.56 * (0.95 + bounce * 0.07));
        this.hero.anims.timeScale = Phaser.Math.Clamp(spd / 135, 0.9, 1.5);
        if (time >= (this.heroStepDustAt || 0)) {
          this.heroStepDustAt = time + 260;
          const d = this.add.image(this.hero.x, this.hero.y + 38, 'fx_glow').setTint(0x94a3b8).setScale(0.24).setAlpha(0.35).setDepth(4);
          this.tweens.add({ targets: d, y: d.y - 10, scale: 0.06, alpha: 0, duration: 300, onComplete: () => d.destroy() });
        }
      } else {
        this.hero.setScale(0.56, 0.56);
        this.hero.anims.timeScale = 1;
      }
    }

    if (cid === 'warrior' || cid === 'ranger' || cid === 'mage' || cid === 'paladin' || cid === 'necro' || cid === 'assassin') {
      const prefix = cid === 'warrior' ? 'w' : (cid === 'ranger' ? 'r' : (cid === 'paladin' ? 'p' : (cid === 'necro' ? 'n' : (cid === 'assassin' ? 'a' : 'm'))));
      const animKey = `${prefix}_${this.heroDir}_${isAttacking ? 'atk' : (isMoving ? 'walk' : 'idle')}`;
      if (isAttacking) {
        if (this.hero.anims.currentAnim?.key !== animKey) {
          this.hero.play(animKey, false);
        }
      } else {
        if (this.anims.exists(animKey)) {
          if (this.hero.anims.currentAnim?.key !== animKey) {
            this.hero.play(animKey, true);
          } else if (this.hero.anims.isPaused) {
            this.hero.anims.resume();
          }
        }
      }
    } else {
      const key = `hero_mage_${this.heroDir}_${isAttacking ? 'atk' : 'move'}`;
      if (this.hero.texture.key !== key) this.hero.setTexture(key);
    }
  }

  faceHeroToward(tx, ty) {
    const dx = tx - this.hero.x;
    const dy = ty - this.hero.y;
    if (Math.abs(dy) > Math.abs(dx) * 1.15) {
      this.heroDir = dy < 0 ? 'up' : 'down';
      this.heroFlipX = false;
    } else {
      this.heroDir = 'right';
      this.heroFlipX = dx < 0;
    }
    this.hero.setFlipX(this.heroFlipX);
  }

  updateMonstersAI(time, delta, dt, stats) {
    for (const m of this.monsters) {
      if (m.hp <= 0) continue;
      if (m.bleedUntil && time < m.bleedUntil && time - (m.lastBleedTick || 0) >= 600) {
        m.lastBleedTick = time;
        this.damageMonster(m, Math.max(1, m.bleedDmg || 4), false, false, '#f87171', '🩸');
        if (m.hp <= 0) continue;
      }
      if (time < (m.stunUntil || 0)) continue;

      const slowFactor = time < (m.slowUntil || 0) ? 0.5 : 1.0;
      const willChase = !!(m.isAggressive || m.isProvoked);
      const dx = this.hero.x - m.sprite.x;
      const dy = this.hero.y - m.sprite.y;
      const dist = Math.hypot(dx, dy) || 1;
      const stopRange = m.isBoss ? 94 : (m.isRanged ? 260 : 70);

      let mobFlip = dx < 0;
      if (willChase) {
        if (dist > stopRange) {
          const mx = (dx / dist + Math.cos(m.jitterAngle) * 0.16) * m.speed * slowFactor * dt;
          const my = (dy / dist + Math.sin(m.jitterAngle) * 0.16) * m.speed * slowFactor * dt;
          m.sprite.x = Phaser.Math.Clamp(m.sprite.x + mx, 120, MAP_W - 120);
          m.sprite.y = Phaser.Math.Clamp(m.sprite.y + my, 180, MAP_H - 180);
          this.resolveObstacleCollision(m.sprite, m.isBoss ? 34 : 24);
        }
      } else {
        m.roamTimer = (m.roamTimer || 0) - delta;
        if (m.roamTimer <= 0) {
          m.roamTimer = Phaser.Math.Between(1600, 3200);
          const toHome = Math.atan2((m.homeY || m.sprite.y) - m.sprite.y, (m.homeX || m.sprite.x) - m.sprite.x);
          const homeDist = Math.hypot((m.homeX || m.sprite.x) - m.sprite.x, (m.homeY || m.sprite.y) - m.sprite.y);
          m.roamAngle = homeDist > 150 ? toHome : Math.random() * Math.PI * 2;
        }
        const rVx = Math.cos(m.roamAngle) * m.speed * 0.38 * slowFactor;
        const rVy = Math.sin(m.roamAngle) * m.speed * 0.38 * slowFactor;
        m.sprite.x = Phaser.Math.Clamp(m.sprite.x + rVx * dt, 140, MAP_W - 140);
        m.sprite.y = Phaser.Math.Clamp(m.sprite.y + rVy * dt, 200, MAP_H - 200);
        mobFlip = rVx < 0;
      }

      const isMobAtk = time < (m.atkAnimUntil || 0);
      const wantAnim = `mob_${m.id}_${isMobAtk ? 'atk' : 'walk'}`;
      if (m.sprite.anims.currentAnim?.key !== wantAnim) {
        m.sprite.play(wantAnim, true);
      }
      const t = time * 0.001 + (m.bobPhase || 0);
      let squashX = 1;
      let squashY = 1;
      let tilt = 0;
      if (m.moveStyle === 'hop') {
        const b = Math.abs(Math.sin(t * 7.5));
        squashY = 1 + b * 0.11;
        squashX = 1 - b * 0.06;
        tilt = Math.sin(t * 7.5) * 0.07;
      } else if (m.moveStyle === 'scuttle') {
        squashX = 1 + Math.sin(t * 14) * 0.08;
        squashY = 1 - Math.sin(t * 14) * 0.06;
        tilt = Math.sin(t * 14) * 0.09;
      } else if (m.moveStyle === 'hover' || m.moveStyle === 'float') {
        const f = Math.sin(t * 4.5);
        squashY = 1 + f * 0.06;
        tilt = Math.cos(t * 3.5) * 0.05;
      } else {
        const h = Math.abs(Math.sin(t * 4.8));
        squashY = 1 + h * 0.07;
        squashX = 1 - h * 0.04;
      }
      m.sprite.setFlipX(mobFlip).setDepth(m.sprite.y)
        .setScale(m.scale * squashX, m.scale * squashY)
        .setRotation(tilt);
      m.groundShadow.setPosition(m.sprite.x, m.sprite.y + 40);
      m.castShadow.setPosition(m.sprite.x - 12, m.sprite.y + 26).setFlipX(mobFlip).setTexture(m.sprite.texture.key, m.sprite.frame.name);

      m.dustTimer = (m.dustTimer || 0) + delta;
      if (m.dustTimer >= (m.isBoss ? 520 : 880) && dist > stopRange) {
        m.dustTimer = 0;
        const puffColor = m.moveStyle === 'hover' ? 0xf97316 : (m.moveStyle === 'float' ? 0xa855f7 : 0x94a3b8);
        const puff = this.add.image(m.sprite.x, m.sprite.y + 34, 'fx_glow')
          .setTint(puffColor).setScale(m.isBoss ? 0.55 : 0.28).setAlpha(0.45).setDepth(4);
        this.tweens.add({ targets: puff, y: puff.y - 12, scale: 0.08, alpha: 0, duration: 360, onComplete: () => puff.destroy() });
      }

      if (m.isBoss && willChase) {
        m.bossSkillTimer = (m.bossSkillTimer || 0) + delta;
        if (m.bossSkillTimer >= 5200) {
          m.bossSkillTimer = 0;
          this.triggerBossWarningAoe(m, stats);
        }
      }

      const barY = m.sprite.y - (m.isBoss ? 100 : 64);
      m.hpBg.setPosition(m.sprite.x, barY);
      m.hpFill.setPosition(m.sprite.x - m.barW / 2, barY);
      m.nameText.setPosition(m.sprite.x, barY - 16);

      if (willChase && dist <= stopRange + 28) {
        m.attackTimer += delta;
        if (m.attackTimer >= m.atkIntervalMs) {
          m.attackTimer = 0;
          m.atkAnimUntil = time + 360;
          m.sprite.play(`mob_${m.id}_atk`, true);
          if (m.isRanged) {
            this.time.delayedCall(140, () => {
              if (m.hp > 0 && !this.isTransitioning) this.fireEnemyBolt(m);
            });
          } else {
            const lx = (dx / dist) * 26;
            const ly = (dy / dist) * 26;
            this.tweens.add({
              targets: m.sprite,
              x: m.sprite.x + lx,
              y: m.sprite.y + ly,
              duration: 115,
              yoyo: true,
              ease: 'Quad.easeOut',
            });
            this.time.delayedCall(115, () => {
              if (m.hp > 0 && !this.isTransitioning) this.performMonsterAttack(m, stats);
            });
          }
        }
      }
    }
  }

  fireEnemyBolt(m) {
    const ang = Math.atan2(this.hero.y - m.sprite.y, this.hero.x - m.sprite.x);
    const isImp = m.atkStyle === 'imp_fire';
    const texKey = isImp ? 'efx_imp_fire' : 'efx_necro_orb';
    const sx = m.sprite.x + Math.cos(ang) * 26;
    const sy = m.sprite.y - 12 + Math.sin(ang) * 16;
    this.playFxSprite(isImp ? 'mfx_meteor_flame' : 'mfx_spark', sx, sy, 0.34, ang, 200);
    const spr = this.add.image(sx, sy, texKey)
      .setScale(isImp ? 0.38 : 0.42).setRotation(ang).setBlendMode(Phaser.BlendModes.ADD).setDepth(4505);
    const spd = isImp ? 345 : 300;
    this.projectiles.push({
      fromEnemy: true,
      atkStyle: m.atkStyle,
      sprite: spr,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      lifeMs: 1850,
      mob: m,
    });
  }

  triggerBossWarningAoe(m, stats) {
    if (!m || m.hp <= 0 || this.isTransitioning) return;
    const tx = this.hero.x;
    const ty = this.hero.y + 10;
    const radius = 155;
    const outer = this.add.circle(tx, ty, radius, 0xef4444, 0.16)
      .setStrokeStyle(3, 0xf87171, 0.9).setDepth(7);
    const inner = this.add.circle(tx, ty, 12, 0xef4444, 0.35).setDepth(7);
    this.tweens.add({
      targets: inner,
      radius,
      duration: 1150,
      ease: 'Linear',
      onComplete: () => {
        outer.destroy();
        inner.destroy();
        if (!m || m.hp <= 0 || this.isTransitioning) return;
        this.playFxSprite('mfx_meteor_blast', tx, ty - 16, 1.25, 0, 440);
        this.playFxSprite('wfx_lava_ring', tx, ty, 1.15, 0, 420);
        if (window.__gameSettings?.graphics?.screenShake !== false) this.cameras.main.shake(190, 0.01);
        if (Phaser.Math.Distance.Between(tx, ty, this.hero.x, this.hero.y) <= radius) {
          this.performMonsterAttack(m, stats, 1.45, true);
        }
      },
    });
  }


  lungeHeroJuice(sx = 1.08, sy = 0.94) {
    if (!this.hero || !this.hero.active) return;
    this.tweens.killTweensOf(this.hero);
    this.hero.setScale(0.56 * sx, 0.56 * sy);
    this.tweens.add({
      targets: this.hero,
      scaleX: 0.56,
      scaleY: 0.56,
      duration: 180,
      ease: 'Back.easeOut',
    });
  }

  performHeroAttack(time, stats, classId, target) {
    this.faceHeroToward(target.sprite.x, target.sprite.y);
    this.triggerHeroAttackAnim(340);
    this.lungeHeroJuice(1.07, 0.94);
    const atkPrefix = classId === 'warrior' ? 'w' : (classId === 'ranger' ? 'r' : (classId === 'paladin' ? 'p' : (classId === 'necro' ? 'n' : (classId === 'assassin' ? 'a' : 'm'))));
    this.hero.play(`${atkPrefix}_${this.heroDir}_atk`, false);
    const mpGain = classId === 'mage' ? 7 : (classId === 'ranger' || classId === 'paladin' ? 5 : 4);
    this.playerMp = Math.min(this.playerMaxMp, this.playerMp + mpGain);
    const baseAngle = Math.atan2(target.sprite.y - this.hero.y, target.sprite.x - this.hero.x);

    const calcRollDmg = (mob, mult = 1, bonusCrit = 0) => {
      const markCrit = mob && time < (mob.markedUntil || 0) ? 15 : 0;
      const isCrit = Math.random() * 100 < (stats.critRate + bonusCrit + markCrit);
      let dmg = stats.atk * mult * (0.92 + Math.random() * 0.16);
      if (stats.activeEffects.has('execute') && mob.hp / mob.maxHp < 0.35) dmg *= 1.35;
      if (isCrit) dmg *= stats.critDmg / 100;
      return { dmg: Math.max(1, Math.round(dmg)), isCrit };
    };

    if (classId === 'warrior' || classId === 'paladin' || classId === 'assassin') {
      const step = this.basicComboStep % 3;
      this.basicComboStep = (this.basicComboStep + 1) % 3;
      const isFinisher = step === 2;
      const reach = isFinisher ? 215 : 170;
      const arcDeg = isFinisher ? 115 : 75;
      const dmgMult = isFinisher ? 1.35 : 0.95;

      const cx = this.hero.x + Math.cos(baseAngle) * (isFinisher ? 68 : 56);
      const cy = this.hero.y + Math.sin(baseAngle) * (isFinisher ? 68 : 56);
      this.playFxSprite(classId === 'paladin' ? 'pfx_slash' : (classId === 'assassin' ? 'afx_slash' : 'wfx_cleave'), cx, cy, isFinisher ? 1.22 : 0.88, baseAngle + (step === 1 ? 0.3 : 0), 250);
      const atkSpark = classId === 'paladin' ? 'pfx_slash' : (classId === 'assassin' ? 'afx_slash' : 'wfx_sparks');
      this.playFxSprite(atkSpark, cx, cy, isFinisher ? 0.95 : 0.62, Math.random() * Math.PI, 260);

      let hitAny = false;
      this.monsters.filter((m) => m.hp > 0).forEach((m) => {
        const d = Phaser.Math.Distance.Between(this.hero.x, this.hero.y, m.sprite.x, m.sprite.y);
        if (d <= reach) {
          const mobAng = Math.atan2(m.sprite.y - this.hero.y, m.sprite.x - this.hero.x);
          const diff = Math.abs(Phaser.Math.Angle.Wrap(mobAng - baseAngle));
          if (diff <= Phaser.Math.DegToRad(arcDeg) || d <= 74) {
            const fangCrit = (classId === 'assassin' && time < (this.lethalFangsUntil || 0)) ? 20 : 0;
          const { dmg, isCrit } = calcRollDmg(m, dmgMult, fangCrit);
          if (classId === 'assassin' && time < (this.lethalFangsUntil || 0)) { m.bleedUntil = time + 4000; m.bleedDmg = Math.max(2, Math.round(stats.atk * 0.35 * (1 + (stats.poisonDmgPct || 0) / 100))); }
            const hitFxKey = classId === 'paladin' ? 'pfx_bash' : (classId === 'assassin' ? 'afx_dash' : 'wfx_hitflash');
            this.playFxSprite(hitFxKey, m.sprite.x, m.sprite.y - 10, isFinisher ? 0.56 : 0.42, 0, 180);
            this.applyHitEffects(m, dmg, isCrit, stats);
            if (isFinisher) {
              m.bleedUntil = time + 3500;
              m.bleedDmg = Math.max(2, Math.round(stats.atk * 0.28));
            }
            const kb = m.isBoss ? 10 : (isFinisher ? 38 : 22);
            m.sprite.x = Phaser.Math.Clamp(m.sprite.x + Math.cos(mobAng) * kb, 120, MAP_W - 120);
            m.sprite.y = Phaser.Math.Clamp(m.sprite.y + Math.sin(mobAng) * kb, 120, MAP_H - 120);
            hitAny = true;
          }
        }
      });
      if (hitAny) {
        this.warriorGuardStacks = Math.min(5, this.warriorGuardStacks + 1);
        this.warriorGuardUntil = time + 4000;
      } else if (target.hp > 0) {
        const { dmg, isCrit } = calcRollDmg(target, dmgMult);
        this.applyHitEffects(target, dmg, isCrit, stats);
      }
    } else if (classId === 'ranger') {
      const step = this.basicComboStep % 4;
      this.basicComboStep = (this.basicComboStep + 1) % 4;
      const isFourth = step === 3;
      const mx = this.hero.x + Math.cos(baseAngle) * 32;
      const my = this.hero.y - 12 + Math.sin(baseAngle) * 20;
      this.playFxSprite('rfx_pierce_flash', mx, my, isFourth ? 0.42 : 0.28, baseAngle, 140);
      const offsets = [-0.06, 0.06];
      offsets.forEach((off) => {
        const ang = baseAngle + off;
        const spr = this.add.image(mx, my, 'rfx_arrow')
          .setScale(0.42).setRotation(ang).setBlendMode(Phaser.BlendModes.ADD).setDepth(4508);
        this.projectiles.push({
          fromEnemy: false,
          kind: 'pierce_arrow',
          sprite: spr,
          vx: Math.cos(ang) * 760,
          vy: Math.sin(ang) * 760,
          lifeMs: 950,
          pierceLeft: 2,
          dmgMult: 0.58,
          hitIds: new Set(),
          stats,
        });
      });
      if (isFourth) {
        const spr = this.add.image(mx, my, 'rfx_beam')
          .setScale(0.55).setRotation(baseAngle).setBlendMode(Phaser.BlendModes.ADD).setDepth(4509);
        this.projectiles.push({
          fromEnemy: false,
          kind: 'pierce_arrow',
          sprite: spr,
          vx: Math.cos(baseAngle) * 860,
          vy: Math.sin(baseAngle) * 860,
          lifeMs: 1000,
          pierceLeft: 4,
          dmgMult: 1.2,
          appliesMark: true,
          hitIds: new Set(),
          stats,
        });
      }
    } else if (classId === 'necro') {
      const mx = this.hero.x + Math.cos(baseAngle) * 32;
      const my = this.hero.y - 16 + Math.sin(baseAngle) * 20;
      this.playFxSprite('nfx_p_slash', mx, my, 0.36, baseAngle, 160);
      const spr = this.add.image(mx, my, 'nfx_p_wraith')
        .setScale(0.28).setRotation(baseAngle).setBlendMode(Phaser.BlendModes.ADD).setDepth(4508);
      this.projectiles.push({
        fromEnemy: false,
        kind: 'mage_bolt',
        sprite: spr,
        vx: Math.cos(baseAngle) * 600,
        vy: Math.sin(baseAngle) * 600,
        lifeMs: 1100,
        dmgMult: 1.05,
        bouncesLeft: 1,
        hitIds: new Set(),
        stats,
      });
    } else {
      this.arcaneChargeStacks = Math.min(5, this.arcaneChargeStacks + 1);
      const mx = this.hero.x + Math.cos(baseAngle) * 34;
      const my = this.hero.y - 16 + Math.sin(baseAngle) * 22;
      this.playFxSprite('mfx_spark', mx, my, 0.34, baseAngle, 150);
      [-0.14, 0.14].forEach((off) => {
        const ang = baseAngle + off;
        const spr = this.add.image(mx, my, 'mfx_bolt')
          .setScale(0.46).setRotation(ang).setBlendMode(Phaser.BlendModes.ADD).setDepth(4508);
        this.projectiles.push({
          fromEnemy: false,
          kind: 'mage_bolt',
          sprite: spr,
          vx: Math.cos(ang) * 580,
          vy: Math.sin(ang) * 580,
          lifeMs: 1150,
          dmgMult: 0.62,
          bouncesLeft: 1,
          hitIds: new Set(),
          stats,
        });
      });
    }
  }

  // 戰士 4 大主動技能（游標指向＋流血引爆連動）
  castWarriorSkill(skillId, skillLvl, stats, isManual = false) {
    const _hx = this.hero.x, _hy = this.hero.y;
    const _n = this.findNearestMonster(_hx, _hy);
    const _tx = _n ? _n.sprite.x : _hx + 90, _ty = _n ? _n.sprite.y : _hy;
    const _aoe = (cx, cy, rad, mult, col, pre, stList = [], forceCrit = false) => {
      for (const m of [...this.monsters]) {
        if (!m || m.hp <= 0) continue;
        if (Phaser.Math.Distance.Between(cx, cy, m.sprite.x, m.sprite.y) <= rad) {
          const isC = forceCrit || (Math.random() * 100 < stats.critRate);
          const d = Math.round(stats.atk * mult * (isC ? stats.critDmg / 100 : 1));
          if (!m._statuses) m._statuses = {};
          stList.forEach((k) => { m._statuses[k] = Math.max(m._statuses[k] || 0, this.time.now + 4800); });
          this.damageMonster(m, d, isC, false, col, pre);
        }
      }
    };
    if (skillId === 'w_rend_slash') {
      this.playAdditiveVfx('vfx_w_rend_arc', _tx, _ty - 10, 0.85, 340);
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 18);
      _aoe(_tx, _ty, 210, (140 + skillLvl * 22) / 100, '#f87171', '🩸', ['bleed']);
      return;
    }
    if (skillId === 'w_ancient_hammer') {
      this.playAdditiveVfx('vfx_w_hammer_slam', _tx, _ty, 1.05, 460);
      _aoe(_tx, _ty, 250, (260 + skillLvl * 40) / 100, '#fbbf24', '🔨', ['vulnerable']);
      return;
    }
    if (skillId === 'w_iron_skin') {
      this.playAdditiveVfx('vfx_w_iron_dome', _hx, _hy - 12, 0.92, 520);
      this.healHero(Math.round(this.playerMaxHp * ((20 + skillLvl * 2) / 100)));
      _aoe(_hx, _hy, 230, (150 + skillLvl * 24) / 100, '#cbd5e1', '🛡️', ['vulnerable']);
      return;
    }
    if (skillId === 'w_chain_grasp') {
      this.playAdditiveVfx('vfx_w_lava_fissure', _hx, _hy, 0.95, 440);
      for (const m of [...this.monsters]) {
        if (!m || m.hp <= 0) continue;
        if (Phaser.Math.Distance.Between(_hx, _hy, m.sprite.x, m.sprite.y) <= 360) {
          m.sprite.x = Phaser.Math.Linear(m.sprite.x, _hx + Phaser.Math.Between(-50, 50), 0.72);
          m.sprite.y = Phaser.Math.Linear(m.sprite.y, _hy + Phaser.Math.Between(-40, 40), 0.72);
        }
      }
      _aoe(_hx, _hy, 360, (170 + skillLvl * 26) / 100, '#fb923c', '⛓️', ['vulnerable', 'burn']);
      return;
    }
    if (skillId === 'w_rupture_impale') {
      this.playAdditiveVfx('vfx_w_rend_arc', _tx, _ty - 10, 1.05, 420);
      for (const m of [...this.monsters]) {
        if (!m || m.hp <= 0) continue;
        if (Phaser.Math.Distance.Between(_tx, _ty, m.sprite.x, m.sprite.y) <= 220) {
          const isBl = this.time.now < (m.bleedUntil || 0) || this.time.now < (m._statuses?.bleed || 0);
          const mult = ((220 + skillLvl * 34) / 100) * (isBl ? 2.0 : 1.0);
          this.damageMonster(m, Math.round(stats.atk * mult * (stats.critDmg / 100)), true, false, '#ef4444', '🩸血爆 ');
          if (isBl) this.healHero(Math.round(this.playerMaxHp * 0.12));
        }
      }
      return;
    }
    if (skillId === 'w_seismic_fissure') {
      for (let w = 0; w < 3; w++) {
        this.time.delayedCall(w * 280, () => {
          this.playAdditiveVfx('vfx_w_lava_fissure', _tx + Phaser.Math.Between(-30, 30), _ty + Phaser.Math.Between(-20, 20), 0.92, 420);
          _aoe(_tx, _ty, 240, (125 + skillLvl * 22) / 100, '#fb923c', '🌋', ['burn']);
        });
      }
      return;
    }
    if (skillId === 'w_call_ancients') {
      for (let w = 0; w < 4; w++) {
        this.time.delayedCall(w * 320, () => {
          const ox = _tx + Phaser.Math.Between(-90, 90), oy = _ty + Phaser.Math.Between(-60, 60);
          this.playAdditiveVfx('vfx_w_ancients_spirit', ox, oy - 16, 1.05, 520);
          _aoe(ox, oy, 300, (180 + skillLvl * 32) / 100, '#fbbf24', '🪓先祖 ', ['bleed', 'vulnerable'], true);
        });
      }
      return;
    }
    if (skillId === 'w_wrath_berserker') {
      this.warcryUntil = Math.max(this.warcryUntil || 0, this.time.now + 7000);
      this._wArsenalOverloadUntil = Math.max(this._wArsenalOverloadUntil || 0, this.time.now + 7000);
      this.playerMp = this.playerMaxMp;
      this.playAdditiveVfx('vfx_w_hammer_slam', _hx, _hy, 1.25, 560);
      _aoe(_hx, _hy, 320, (320 + skillLvl * 48) / 100, '#ef4444', '🔥狂戰神 ', ['burn', 'vulnerable'], true);
      return;
    }
    const alive = this.monsters.filter((m) => m.hp > 0);
    if (alive.length === 0) return;
    const sk = WARRIOR_SKILLS[skillId];
    const aim = this.getAimPoint(isManual, 320);
    this.faceHeroToward(aim.x, aim.y);
    this.triggerHeroAttackAnim(420);

    const dmgMult = (stats.skillDmgMult || 1) * (this.time.now < this.overloadUntil ? 1.35 : 1);
    const radMult = stats.skillRadiusMult || 1;
    this.showSkillBanner(sk.name);

    if (skillId === 'whirlwind') {
      const radius = 235 * radMult;
      const inner = this.add.image(this.hero.x, this.hero.y, 'wfx_whirl_inner').setScale(1.25 * radMult).setBlendMode(Phaser.BlendModes.ADD).setDepth(4502);
      const outer = this.add.image(this.hero.x, this.hero.y, 'wfx_whirl_outer').setScale(1.55 * radMult).setBlendMode(Phaser.BlendModes.ADD).setDepth(4503);
      const wind = this.add.image(this.hero.x, this.hero.y + 16, 'wfx_whirl_wind').setScale(1.6 * radMult).setAlpha(0.75).setBlendMode(Phaser.BlendModes.ADD).setDepth(4500);

      const spinEv = this.time.addEvent({
        delay: 260,
        repeat: 3,
        callback: () => {
          const baseTick = stats.atk * (0.80 + skillLvl * 0.18) * dmgMult;
          this.monsters.filter((m) => m.hp > 0).forEach((m) => {
            if (Phaser.Math.Distance.Between(this.hero.x, this.hero.y, m.sprite.x, m.sprite.y) <= radius) {
              const isBleed = this.time.now < (m.bleedUntil || 0);
              const tickDmg = Math.round(baseTick * (isBleed ? 1.25 : 1));
              this.damageMonster(m, tickDmg, true, false, isBleed ? '#f87171' : '#fb923c', isBleed ? '🩸' : '🌪️');
            }
          });
          this.healHero(Math.round(this.playerMaxHp * 0.025));
        },
      });
      this.tweens.add({
        targets: [inner, wind],
        angle: 720,
        duration: 1050,
        onUpdate: () => {
          inner.setPosition(this.hero.x, this.hero.y);
          outer.setPosition(this.hero.x, this.hero.y);
          wind.setPosition(this.hero.x, this.hero.y + 16);
        },
        onComplete: () => {
          inner.destroy(); outer.destroy(); wind.destroy();
          if (spinEv) spinEv.remove();
        },
      });
      this.tweens.add({ targets: outer, angle: -540, duration: 1050 });
      if (window.__gameSettings?.graphics?.screenShake !== false) this.cameras.main.shake(240, 0.008);
    } else if (skillId === 'earthshatter') {
      const mx = this.hero.x;
      const my = this.hero.y + 10;
      const radius = 245 * radMult;
      const crack = this.add.image(mx, my + 12, 'wfx_lava_crack').setScale(1.4 * radMult).setDepth(5);
      this.tweens.add({ targets: crack, alpha: 0, delay: 1100, duration: 450, onComplete: () => crack.destroy() });

      this.playFxSprite('wfx_slam_pillar', mx, my - 50, 1.4 * radMult, 0, 420);
      this.playFxSprite('wfx_lava_ring', mx, my + 10, 1.65 * radMult, 0, 520);
      this.playFxSprite('wfx_rubble', mx, my - 10, 1.35 * radMult, 0, 480);

      const baseDmg = stats.atk * (2.1 + skillLvl * 0.35) * dmgMult;
      let bleedDetonated = 0;
      alive.forEach((m) => {
        if (Phaser.Math.Distance.Between(mx, my, m.sprite.x, m.sprite.y) <= radius) {
          const isBleed = this.time.now < (m.bleedUntil || 0);
          const dmg = Math.round(baseDmg + (isBleed ? stats.atk * 0.65 * dmgMult : 0));
          if (isBleed) {
            m.bleedUntil = 0;
            bleedDetonated++;
          }
          this.damageMonster(m, dmg, true, false, isBleed ? '#ef4444' : '#f97316', isBleed ? '💥' : '🌋');
          m.stunUntil = this.time.now + 1200;
          const ang = Math.atan2(m.sprite.y - my, m.sprite.x - mx);
          const kb = m.isBoss ? 18 : 56;
          m.sprite.x = Phaser.Math.Clamp(m.sprite.x + Math.cos(ang) * kb, 120, MAP_W - 120);
          m.sprite.y = Phaser.Math.Clamp(m.sprite.y + Math.sin(ang) * kb, 120, MAP_H - 120);
        }
      });
      if (bleedDetonated > 0) {
        const reduceMs = Math.min(1600, bleedDetonated * 400);
        this.slotCdTimers = this.slotCdTimers.map((t) => t + reduceMs);
      }
      if (window.__gameSettings?.graphics?.screenShake !== false) this.cameras.main.shake(260, 0.014);
    } else if (skillId === 'bloodcharge') {
      const ang = Math.atan2(aim.y - this.hero.y, aim.x - this.hero.x);
      const sx = this.hero.x;
      const sy = this.hero.y;
      const tx = Phaser.Math.Clamp(sx + Math.cos(ang) * 280, 200, MAP_W - 200);
      const ty = Phaser.Math.Clamp(sy + Math.sin(ang) * 280, 180, MAP_H - 180);

      const aura = this.add.image(sx, sy, 'wfx_charge_aura').setScale(1.15).setRotation(ang).setBlendMode(Phaser.BlendModes.ADD).setDepth(4505);
      const trail = this.add.image((sx + tx) / 2, (sy + ty) / 2 + 12, 'wfx_fire_trail')
        .setDisplaySize(300, 100).setRotation(ang).setBlendMode(Phaser.BlendModes.ADD).setDepth(4500);
      this.tweens.add({ targets: trail, alpha: 0, duration: 850, onComplete: () => trail.destroy() });

      this.tweens.add({
        targets: [this.hero, aura],
        x: tx,
        y: ty,
        duration: 210,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          aura.destroy();
          this.playFxSprite('wfx_blood_ring', this.hero.x, this.hero.y, 1.35 * radMult, 0, 480);
          const dmg = Math.round(stats.atk * (1.8 + skillLvl * 0.30) * dmgMult);
          this.monsters.filter((m) => m.hp > 0).forEach((m) => {
            if (Phaser.Math.Distance.Between(this.hero.x, this.hero.y, m.sprite.x, m.sprite.y) <= 195 * radMult) {
              m.bleedUntil = this.time.now + 3500;
              m.bleedDmg = Math.max(2, Math.round(stats.atk * 0.28));
              this.damageMonster(m, dmg, true, false, '#f87171', '🩸');
            }
          });
          this.healHero(Math.round(this.playerMaxHp * (0.10 + skillLvl * 0.02)));
        },
      });
    } else if (skillId === 'bladestorm') {
      const baseAng = Math.atan2(aim.y - this.hero.y, aim.x - this.hero.x);
      const angles = [baseAng - 0.34, baseAng, baseAng + 0.34];
      const waveRaw = stats.atk * (1.45 + skillLvl * 0.28) * dmgMult;

      angles.forEach((ang, idx) => {
        this.time.delayedCall(idx * 70, () => {
          const spr = this.add.image(this.hero.x, this.hero.y - 10, 'wfx_blade_wave')
            .setScale(0.75 * radMult).setRotation(ang).setBlendMode(Phaser.BlendModes.ADD).setDepth(4509);
          this.projectiles.push({
            fromEnemy: false,
            kind: 'blade_wave',
            sprite: spr,
            vx: Math.cos(ang) * 620,
            vy: Math.sin(ang) * 620,
            lifeMs: 950,
            fixedRawDmg: waveRaw,
            hitIds: new Set(),
            stats,
          });
        });
      });
    } else if (skillId === 'warcry') {
      this.warcryUntil = this.time.now + 4500;
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 30);
      this.playFxSprite('nfx_warcry', this.hero.x, this.hero.y, 1.55 * radMult, 0, 460);
      const dmg = Math.round(stats.atk * (1.2 + skillLvl * 0.2) * dmgMult);
      alive.forEach((m) => {
        if (Phaser.Math.Distance.Between(this.hero.x, this.hero.y, m.sprite.x, m.sprite.y) <= 250 * radMult) {
          this.damageMonster(m, dmg, true, false, '#f87171', '📣');
          const ang = Math.atan2(m.sprite.y - this.hero.y, m.sprite.x - this.hero.x);
          const kb = m.isBoss ? 18 : 65;
          m.sprite.x = Phaser.Math.Clamp(m.sprite.x + Math.cos(ang) * kb, 140, MAP_W - 140);
          m.sprite.y = Phaser.Math.Clamp(m.sprite.y + Math.sin(ang) * kb, 180, MAP_H - 180);
        }
      });
      // v250: zero shake
    } else if (skillId === 'execute_cleave') {
      const ang = Math.atan2(aim.y - this.hero.y, aim.x - this.hero.x);
      const cx = this.hero.x + Math.cos(ang) * 85;
      const cy = this.hero.y + Math.sin(ang) * 85;
      this.playFxSprite('wfx_cleave', cx, cy, 1.55 * radMult, ang, 320);
      this.playFxSprite('wfx_blood_ring', cx, cy, 1.25 * radMult, 0, 380);
      const baseDmg = stats.atk * (2.4 + skillLvl * 0.40) * dmgMult;
      alive.forEach((m) => {
        if (Phaser.Math.Distance.Between(cx, cy, m.sprite.x, m.sprite.y) <= 210 * radMult) {
          const low = m.hp < m.maxHp * 0.5;
          const isCrit = low || Math.random() * 100 < stats.critRate;
          const dmg = Math.round(baseDmg * (low ? 1.6 : 1) * (isCrit ? stats.critDmg / 100 : 1));
          this.damageMonster(m, dmg, isCrit, false, '#ef4444', '⚔️');
        }
      });
      if (window.__gameSettings?.graphics?.screenShake !== false) this.cameras.main.shake(190, 0.011);
    } else if (skillId === 'volcano_totem') {
      const tx = aim.x;
      const ty = aim.y;
      const totem = this.add.image(tx, ty, 'nfx_totem').setScale(0.85).setBlendMode(Phaser.BlendModes.ADD).setDepth(ty);
      this.time.addEvent({
        delay: 520,
        repeat: 3,
        callback: () => {
          this.playFxSprite('wfx_lava_ring', tx, ty + 12, 1.45 * radMult, 0, 420);
          this.playFxSprite('wfx_slam_pillar', tx, ty - 24, 1.15 * radMult, 0, 420);
          const dmg = Math.round(stats.atk * (0.85 + skillLvl * 0.18) * dmgMult);
          this.monsters.filter((m) => m.hp > 0).forEach((m) => {
            if (Phaser.Math.Distance.Between(tx, ty, m.sprite.x, m.sprite.y) <= 240 * radMult) {
              this.damageMonster(m, dmg, Math.random() * 100 < stats.critRate, false, '#fb923c', '🌋');
            }
          });
        },
      });
      this.time.delayedCall(2200, () => totem.destroy());
    } else if (skillId === 'earth_stomp') {
      const mx = this.hero.x;
      const my = this.hero.y;
      const radius = 310 * radMult;
      this.playFxSprite('wfx_lava_ring', mx, my + 10, 1.8 * radMult, 0, 500);
      this.playFxSprite('wfx_rubble', mx, my, 1.55 * radMult, 0, 460);
      const dmg = Math.round(stats.atk * (1.75 + skillLvl * 0.30) * dmgMult);
      alive.forEach((m) => {
        if (Phaser.Math.Distance.Between(mx, my, m.sprite.x, m.sprite.y) <= radius) {
          m.stunUntil = this.time.now + 1500;
          this.tweens.add({
            targets: m.sprite,
            x: mx + Phaser.Math.Between(-75, 75),
            y: my + Phaser.Math.Between(-55, 55),
            duration: 240,
            ease: 'Cubic.easeOut',
          });
          this.damageMonster(m, dmg, true, false, '#fbbf24', '💥');
        }
      });
      if (window.__gameSettings?.graphics?.screenShake !== false) this.cameras.main.shake(220, 0.012);
    }
  }

  // 遊俠 4 大主動技能（游標指向＋獵手印記連動）
  castRangerSkill(skillId, skillLvl, stats, isManual = false) {
    const _hx = this.hero.x, _hy = this.hero.y;
    const _n = this.findNearestMonster(_hx, _hy);
    const _tx = _n ? _n.sprite.x : _hx + 160, _ty = _n ? _n.sprite.y : _hy;
    const _aoe = (cx, cy, rad, mult, col, pre, stList = [], forceCrit = false) => {
      for (const m of [...this.monsters]) {
        if (!m || m.hp <= 0) continue;
        if (Phaser.Math.Distance.Between(cx, cy, m.sprite.x, m.sprite.y) <= rad) {
          const isC = forceCrit || (Math.random() * 100 < stats.critRate);
          const d = Math.round(stats.atk * mult * (isC ? stats.critDmg / 100 : 1));
          if (!m._statuses) m._statuses = {};
          stList.forEach((k) => { m._statuses[k] = Math.max(m._statuses[k] || 0, this.time.now + 4800); });
          this.damageMonster(m, d, isC, false, col, pre);
        }
      }
    };
    if (skillId === 'r_shadow_imbue') {
      this.playAdditiveVfx('vfx_r_shadow_arrow', _tx, _ty - 10, 0.92, 360);
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 18);
      _aoe(_tx, _ty, 230, (160 + skillLvl * 25) / 100, '#c084fc', '🌑', ['vulnerable', 'curse']);
      return;
    }
    if (skillId === 'r_venom_pierce') {
      this.playAdditiveVfx('vfx_r_venom_spear', _tx, _ty - 8, 1.0, 400);
      _aoe(_tx, _ty, 260, (245 + skillLvl * 38) / 100, '#4ade80', '☠️毒矛 ', ['poison']);
      return;
    }
    if (skillId === 'r_smoke_decoy') {
      this.playAdditiveVfx('vfx_r_decoy_phantom', _hx, _hy - 12, 0.96, 480);
      this.healHero(Math.round(this.playerMaxHp * 0.18));
      _aoe(_hx, _hy, 270, (195 + skillLvl * 30) / 100, '#a3e635', '💨誘餌 ', ['poison', 'vulnerable']);
      return;
    }
    if (skillId === 'r_frost_barrage') {
      for (let w = 0; w < 3; w++) {
        this.time.delayedCall(w * 200, () => {
          this.playAdditiveVfx('vfx_react_superconduct', _tx, _ty - 10, 0.72, 320);
          _aoe(_tx, _ty, 240, (95 + skillLvl * 18) / 100, '#38bdf8', '❄️', ['freeze']);
        });
      }
      return;
    }
    if (skillId === 'r_razor_snare') {
      this.playAdditiveVfx('vfx_react_hemorrhage', _tx, _ty, 0.92, 420);
      _aoe(_tx, _ty, 240, (230 + skillLvl * 34) / 100, '#f87171', '🩸陷阱 ', ['bleed', 'vulnerable']);
      return;
    }
    if (skillId === 'r_gale_snipe') {
      this.playAdditiveVfx('vfx_r_venom_spear', _tx, _ty - 10, 1.05, 380);
      this._rComboStars = Math.min(3, (this._rComboStars || 0) + 2);
      _aoe(_tx, _ty, 220, (280 + skillLvl * 44) / 100, '#34d399', '🎯狙殺 ', ['vulnerable'], true);
      return;
    }
    if (skillId === 'r_abyss_barrage') {
      for (let w = 0; w < 5; w++) {
        this.time.delayedCall(w * 240, () => {
          const ox = _tx + Phaser.Math.Between(-90, 90), oy = _ty + Phaser.Math.Between(-60, 60);
          this.playAdditiveVfx('vfx_r_abyss_meteor_arrow', ox, oy - 16, 1.12, 460);
          _aoe(ox, oy, 330, (150 + skillLvl * 28) / 100, '#c084fc', '☄️箭幕 ', ['poison', 'vulnerable'], true);
        });
      }
      return;
    }
    if (skillId === 'r_void_hunter') {
      this._rInnerSightUntil = Math.max(this._rInnerSightUntil || 0, this.time.now + 6000);
      this.playAdditiveVfx('vfx_r_void_star_sigil', _tx, _ty - 10, 1.32, 620);
      _aoe(_tx, _ty, 360, (360 + skillLvl * 54) / 100, '#e879f9', '⭐虛空獵手 ', ['curse', 'vulnerable'], true);
      return;
    }
    const alive = this.monsters.filter((m) => m.hp > 0);
    if (alive.length === 0) return;
    const sk = RANGER_SKILLS[skillId];
    const aim = this.getAimPoint(isManual, 480);
    this.faceHeroToward(aim.x, aim.y);
    this.triggerHeroAttackAnim(400);

    const dmgMult = (stats.skillDmgMult || 1) * (this.time.now < this.overloadUntil ? 1.35 : 1);
    const radMult = stats.skillRadiusMult || 1;
    this.showSkillBanner(sk.name, '#34d399');

    if (skillId === 'volley') {
      const baseAng = Math.atan2(aim.y - this.hero.y, aim.x - this.hero.x);
      this.playFxSprite('rfx_wind_trail', this.hero.x, this.hero.y, 0.85, baseAng, 320);
      const offsets = [-0.36, -0.18, 0, 0.18, 0.36];
      const rawDmg = stats.atk * (0.80 + skillLvl * 0.18) * dmgMult;

      offsets.forEach((off, idx) => {
        this.time.delayedCall(idx * 45, () => {
          const ang = baseAng + off;
          const spr = this.add.image(this.hero.x, this.hero.y - 12, 'rfx_beam')
            .setScale(0.65).setRotation(ang).setBlendMode(Phaser.BlendModes.ADD).setDepth(4509);
          this.projectiles.push({
            fromEnemy: false,
            kind: 'ranger_beam',
            sprite: spr,
            vx: Math.cos(ang) * 820,
            vy: Math.sin(ang) * 820,
            lifeMs: 850,
            fixedRawDmg: rawDmg,
            bonusCrit: 25,
            appliesMark: true,
            hitIds: new Set(),
            stats,
          });
        });
      });
    } else if (skillId === 'arrowrain') {
      const tx = aim.x;
      const ty = aim.y;
      const radius = 225 * radMult;
      const sigil = this.add.image(tx, ty + 14, 'rfx_rain_sigil')
        .setScale(1.4 * radMult).setBlendMode(Phaser.BlendModes.ADD).setDepth(6);
      this.tweens.add({ targets: sigil, angle: 120, duration: 1300, onComplete: () => sigil.destroy() });

      const waveDmg = Math.round(stats.atk * (0.65 + skillLvl * 0.16) * dmgMult);
      this.time.addEvent({
        delay: 280,
        repeat: 3,
        callback: () => {
          this.playFxSprite('rfx_rain_fall', tx + Phaser.Math.Between(-30, 30), ty - 60, 1.3 * radMult, 0, 320);
          this.playFxSprite('rfx_rain_impact', tx, ty + 10, 1.35 * radMult, 0, 360);
          this.playFxSprite('rfx_leaf_sparks', tx, ty, 1.2 * radMult, Math.random() * Math.PI, 400);

          let healed = false;
          this.monsters.filter((m) => m.hp > 0).forEach((m) => {
            if (Phaser.Math.Distance.Between(tx, ty, m.sprite.x, m.sprite.y) <= radius) {
              const isMarked = this.time.now < (m.markedUntil || 0);
              m.slowUntil = this.time.now + (isMarked ? 2400 : 1500);
              if (isMarked && !healed) {
                healed = true;
                this.healHero(Math.round(this.playerMaxHp * 0.015));
              }
              this.damageMonster(m, waveDmg, Math.random() * 100 < (stats.critRate + (isMarked ? 15 : 0)), false, '#34d399', isMarked ? '🎯' : '🌧️');
            }
          });
        },
      });
    } else if (skillId === 'shadowstep') {
      const ox = this.hero.x;
      const oy = this.hero.y;
      const nearest = this.findNearestMonster(ox, oy) || alive[0];
      const awayAng = isManual && this.hasPointerMoved
        ? Math.atan2(aim.y - oy, aim.x - ox)
        : Math.atan2(oy - nearest.sprite.y, ox - nearest.sprite.x);
      const nx = Phaser.Math.Clamp(ox + Math.cos(awayAng) * 260, 200, MAP_W - 200);
      const ny = Phaser.Math.Clamp(oy + Math.sin(awayAng) * 260, 180, MAP_H - 180);

      this.playFxSprite('rfx_shadow_smoke', ox, oy, 1.0, 0, 380);
      const trap = this.add.image(ox, oy + 10, 'rfx_trap_rune').setScale(1.15 * radMult).setBlendMode(Phaser.BlendModes.ADD).setDepth(6);

      this.hero.setPosition(nx, ny);
      this.dodgeBuffUntil = this.time.now + 3000;
      this.playFxSprite('rfx_dodge_aura', nx, ny, 1.2, 0, 750);

      this.time.delayedCall(260, () => {
        trap.destroy();
        this.playFxSprite('rfx_poison_burst', ox, oy, 1.45 * radMult, 0, 480);
        const baseDmg = stats.atk * (1.9 + skillLvl * 0.32) * dmgMult;
        this.monsters.filter((m) => m.hp > 0).forEach((m) => {
          if (Phaser.Math.Distance.Between(ox, oy, m.sprite.x, m.sprite.y) <= 215 * radMult) {
            const isMarked = this.time.now < (m.markedUntil || 0);
            const dmg = Math.round(baseDmg + (isMarked ? stats.atk * 0.80 * dmgMult : 0));
            this.damageMonster(m, dmg, true, false, '#4ade80', isMarked ? '🎯' : '☠️');
          }
        });
      });
    } else if (skillId === 'phantombow') {
      const ang = Math.atan2(aim.y - this.hero.y, aim.x - this.hero.x);
      this.playFxSprite('rfx_charge_bow', this.hero.x, this.hero.y, 1.1, 0, 340);
      this.playFxSprite('rfx_sonic_ring', this.hero.x + Math.cos(ang) * 40, this.hero.y + Math.sin(ang) * 40, 0.9, ang, 320);

      const dragonDmg = Math.round(stats.atk * (3.0 + skillLvl * 0.45) * (stats.critDmg / 100) * dmgMult);
      const spr = this.add.image(this.hero.x, this.hero.y - 12, 'rfx_phantom_dragon')
        .setScale(0.95 * radMult).setRotation(ang).setBlendMode(Phaser.BlendModes.ADD).setDepth(4512);
      this.projectiles.push({
        fromEnemy: false,
        kind: 'phantom_dragon',
        sprite: spr,
        vx: Math.cos(ang) * 860,
        vy: Math.sin(ang) * 860,
        lifeMs: 1100,
        fixedDmg: dragonDmg,
        hitIds: new Set(),
        stats,
      });
      if (window.__gameSettings?.graphics?.screenShake !== false) this.cameras.main.shake(180, 0.01);
    } else if (skillId === 'windwalk') {
      this.windwalkUntil = this.time.now + 4500;
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 25);
      this.playFxSprite('rfx_dodge_aura', this.hero.x, this.hero.y, 1.35, 0, 650);
      this.playFxSprite('rfx_wind_trail', this.hero.x, this.hero.y, 1.15, 0, 450);
    } else if (skillId === 'caltrops') {
      const tx = aim.x;
      const ty = aim.y;
      const field = this.add.image(tx, ty + 10, 'nfx_caltrops').setScale(1.25 * radMult).setBlendMode(Phaser.BlendModes.ADD).setDepth(6);
      this.time.addEvent({
        delay: 650,
        repeat: 5,
        callback: () => {
          const dmg = Math.round(stats.atk * (0.55 + skillLvl * 0.14) * dmgMult);
          this.monsters.filter((m) => m.hp > 0).forEach((m) => {
            if (Phaser.Math.Distance.Between(tx, ty, m.sprite.x, m.sprite.y) <= 220 * radMult) {
              m.slowUntil = this.time.now + 1200;
              this.damageMonster(m, dmg, Math.random() * 100 < stats.critRate, false, '#a3e635', '☠️');
            }
          });
        },
      });
      this.time.delayedCall(4000, () => field.destroy());
    } else if (skillId === 'shadow_clones') {
      const baseAng = Math.atan2(aim.y - this.hero.y, aim.x - this.hero.x);
      const rawDmg = stats.atk * (0.90 + skillLvl * 0.20) * dmgMult;
      [-90, 90].forEach((oy) => {
        const cx = this.hero.x - 20;
        const cy = this.hero.y + oy;
        const clone = this.add.image(cx, cy, this.hero.texture.key).setScale(0.52).setTint(0x10b981).setAlpha(0.75).setDepth(cy);
        this.playFxSprite('rfx_shadow_smoke', cx, cy, 0.85, 0, 320);
        [-0.18, 0, 0.18].forEach((off) => {
          const ang = baseAng + off;
          const spr = this.add.image(cx, cy, 'rfx_beam').setScale(0.58).setRotation(ang).setBlendMode(Phaser.BlendModes.ADD).setDepth(4509);
          this.projectiles.push({
            fromEnemy: false, kind: 'ranger_beam', sprite: spr,
            vx: Math.cos(ang) * 800, vy: Math.sin(ang) * 800, lifeMs: 850,
            fixedRawDmg: rawDmg, bonusCrit: 15, appliesMark: true, hitIds: new Set(), stats,
          });
        });
        this.tweens.add({ targets: clone, alpha: 0, duration: 550, onComplete: () => clone.destroy() });
      });
    } else if (skillId === 'death_mark') {
      const dmgBase = stats.atk * (1.8 + skillLvl * 0.35) * dmgMult;
      alive.forEach((m) => {
        if (Phaser.Math.Distance.Between(this.hero.x, this.hero.y, m.sprite.x, m.sprite.y) <= 520) {
          const isMarked = this.time.now < (m.markedUntil || 0);
          m.markedUntil = this.time.now + 5000;
          this.playFxSprite('nfx_deathmark', m.sprite.x, m.sprite.y - 10, 0.72, 0, 380);
          this.damageMonster(m, Math.round(dmgBase * (isMarked ? 2.0 : 1.0)), true, false, '#f87171', '💀');
        }
      });
    }
  }

  // 法師 4 大主動技能（游標指向＋冰寒共鳴與奧術充能連動）
  castMageSkill(skillId, skillLvl, stats, isManual = false) {
    const _hx = this.hero.x, _hy = this.hero.y;
    const _n = this.findNearestMonster(_hx, _hy);
    const _tx = _n ? _n.sprite.x : _hx + 160, _ty = _n ? _n.sprite.y : _hy;
    const _aoe = (cx, cy, rad, mult, col, pre, stList = [], forceCrit = false) => {
      for (const m of [...this.monsters]) {
        if (!m || m.hp <= 0) continue;
        if (Phaser.Math.Distance.Between(cx, cy, m.sprite.x, m.sprite.y) <= rad) {
          const isC = forceCrit || (Math.random() * 100 < stats.critRate);
          const d = Math.round(stats.atk * mult * (isC ? stats.critDmg / 100 : 1));
          if (!m._statuses) m._statuses = {};
          stList.forEach((k) => { m._statuses[k] = Math.max(m._statuses[k] || 0, this.time.now + 4800); });
          this.damageMonster(m, d, isC, false, col, pre);
        }
      }
    };
    const _d4Mult = this.getMageD4LiveMult();
    const _aoeD4 = (cx, cy, rad, mul, col, pre, stList = [], forceC = false) => {
      const elem = stList.includes('freeze') ? 'frost' : (stList.includes('shock') ? 'shock' : 'fire');
      const tintHex = elem === 'frost' ? 0x7dd3fc : (elem === 'shock' ? 0xc084fc : 0xfb923c);
      const hitSeq = elem === 'frost' ? 'anim_m_frost_nova' : (elem === 'shock' ? 'anim_m_lightning_strike' : 'anim_m_fireball_blast');
      let sparkBudget = 3;
      this.monsters.forEach((m) => {
        if (m.hp > 0 && m.sprite && Phaser.Math.Distance.Between(cx, cy, m.sprite.x, m.sprite.y) <= rad) {
          m.sprite.setTint(tintHex);
          this.time.delayedCall(110, () => m.sprite && m.sprite.active && m.sprite.clearTint());
          if (sparkBudget > 0) {
            sparkBudget--;
            this.mageVfx?.spawnDebrisBurst(m.sprite.x, m.sprite.y, elem, forceC ? 7 : 4);
          }
        }
      });
      _aoe(cx, cy, rad, mul * _d4Mult, col, pre, stList, forceC);
    };
    const mv = this.mageVfx;
    const _pickPrimary = () => this.findNearestMonster(_tx, _ty, 360) || this.findNearestMonster(_hx, _hy, 560);
    const _applyHitVisual = (m, elem, forceC) => {
      if (!m || m.hp <= 0 || !m.sprite) return;
      const tintHex = elem === 'frost' ? 0x7dd3fc : (elem === 'shock' ? 0xc084fc : 0xfb923c);
      m.sprite.setTint(tintHex);
      this.time.delayedCall(110, () => m.sprite && m.sprite.active && m.sprite.clearTint());
      mv?.spawnDebrisBurst(m.sprite.x, m.sprite.y, elem, forceC ? 7 : 4);
    };

    // 幾何 1：精準單體判定（絕不亂濺射，高單體倍率專打首領與精英）
    const _singleD4 = (m, mul, col, pre, stList = [], forceC = false) => {
      if (!m || m.hp <= 0 || !m.sprite) return;
      const elem = stList.includes('freeze') ? 'frost' : (stList.includes('shock') ? 'shock' : 'fire');
      const isC = forceC || Math.random() * 100 < stats.critChance;
      const d = Math.max(1, Math.round(stats.atk * mul * _d4Mult * (isC ? stats.critDmg / 100 : 1)));
      if (!m._statuses) m._statuses = {};
      stList.forEach((k) => { m._statuses[k] = Math.max(m._statuses[k] || 0, this.time.now + 4800); });
      _applyHitVisual(m, elem, isC);
      this.damageMonster(m, d, isC, false, col, pre);
    };

    // 幾何 2：前方扇形揮斬判定（電弧鞭 130° 近戰扇形）
    const _coneD4 = (ox, oy, dirAng, rad, halfAng, mul, col, pre, stList = []) => {
      const elem = stList.includes('freeze') ? 'frost' : (stList.includes('shock') ? 'shock' : 'fire');
      for (const m of this.monsters) {
        if (!m || m.hp <= 0 || !m.sprite) continue;
        const dist = Phaser.Math.Distance.Between(ox, oy, m.sprite.x, m.sprite.y);
        if (dist > rad) continue;
        const ang = Phaser.Math.Angle.Between(ox, oy, m.sprite.x, m.sprite.y);
        const diff = Math.abs(Phaser.Math.Angle.Wrap(ang - dirAng));
        if (diff <= halfAng || dist < 56) {
          const isC = Math.random() * 100 < stats.critChance;
          const d = Math.max(1, Math.round(stats.atk * mul * _d4Mult * (isC ? stats.critDmg / 100 : 1)));
          if (!m._statuses) m._statuses = {};
          stList.forEach((k) => { m._statuses[k] = Math.max(m._statuses[k] || 0, this.time.now + 4800); });
          _applyHitVisual(m, elem, isC);
          this.damageMonster(m, d, isC, false, col, pre);
        }
      }
    };

    // 幾何 3：矩形火道判定（烈焰火牆 320x96px）
    const _rectD4 = (cx, cy, halfW, halfH, mul, col, pre, stList = []) => {
      for (const m of this.monsters) {
        if (!m || m.hp <= 0 || !m.sprite) continue;
        if (Math.abs(m.sprite.x - cx) <= halfW && Math.abs(m.sprite.y - cy) <= halfH) {
          const isC = Math.random() * 100 < stats.critChance;
          const d = Math.max(1, Math.round(stats.atk * mul * _d4Mult * (isC ? stats.critDmg / 100 : 1)));
          if (!m._statuses) m._statuses = {};
          stList.forEach((k) => { m._statuses[k] = Math.max(m._statuses[k] || 0, this.time.now + 4800); });
          _applyHitVisual(m, 'fire', isC);
          this.damageMonster(m, d, isC, false, col, pre);
        }
      }
    };

    // 幾何 4：真實連鎖彈跳判定（英雄→怪 A→怪 B→C，單體首領時反覆彈跳）
    const _chainD4 = (bounces, baseMul, col, pre, stList = []) => {
      const first = _pickPrimary();
      if (!first || !first.sprite) return;
      let curX = _hx, curY = _hy - 14;
      let curTgt = first;
      const visited = new Set();
      for (let b = 0; b < bounces; b++) {
        if (!curTgt || curTgt.hp <= 0 || !curTgt.sprite) break;
        const sx0 = curX, sy0 = curY;
        const tgtSnap = curTgt;
        const mulSnap = baseMul * Math.pow(0.92, b);
        visited.add(tgtSnap.uid);
        curX = tgtSnap.sprite.x;
        curY = tgtSnap.sprite.y - 10;

        this.time.delayedCall(b * 60, () => {
          if (!tgtSnap.sprite) return;
          mv?.playChainArc(sx0, sy0, tgtSnap.sprite.x, tgtSnap.sprite.y - 10, 0.46, 230);
          mv?.playSeq16('seq16_m_ball_lightning', tgtSnap.sprite.x, tgtSnap.sprite.y - 8, 0.58, 24, 16);
          if (tgtSnap.hp > 0) _singleD4(tgtSnap, mulSnap, col, pre, stList, b === 0);
        });

        // 找下一名最近的未命中敵人；若只剩單體首領則反彈回英雄再打同一目標
        const nextList = this.monsters
          .filter((m) => m.hp > 0 && m.sprite && !visited.has(m.uid) && Phaser.Math.Distance.Between(curX, curY, m.sprite.x, m.sprite.y) <= 320)
          .sort((a, b2) => Phaser.Math.Distance.Between(curX, curY, a.sprite.x, a.sprite.y) - Phaser.Math.Distance.Between(curX, curY, b2.sprite.x, b2.sprite.y));
        if (nextList.length > 0) {
          curTgt = nextList[0];
        } else if (tgtSnap.hp > 0) {
          // 單體首領反彈：從英雄再次射回首領
          curX = _hx; curY = _hy - 14;
          curTgt = tgtSnap;
        } else {
          break;
        }
      }
    };

    // 幾何 5：真實聚怪牽引（煉獄／黑洞把周圍非首領怪拉向中心）
    const _pullVortex = (cx, cy, rad, pullPx = 42) => {
      for (const m of this.monsters) {
        if (!m || m.hp <= 0 || !m.sprite || m.isBoss) continue;
        const dist = Phaser.Math.Distance.Between(cx, cy, m.sprite.x, m.sprite.y);
        if (dist > 28 && dist <= rad) {
          const ang = Phaser.Math.Angle.Between(m.sprite.x, m.sprite.y, cx, cy);
          const step = Math.min(pullPx, dist - 22);
          m.sprite.x += Math.cos(ang) * step;
          m.sprite.y += Math.sin(ang) * step;
        }
      }
    };

    if (skillId === 'm_fire_bolt') {
      this.registerEnlightenment('fire');
      const tgt = _pickPrimary();
      const ex = tgt?.sprite?.x ?? _tx, ey = tgt?.sprite?.y ?? _ty;
      mv.launchProjectile('proj_m_fire_bolt', _hx, _hy - 14, ex, ey - 10, 0.56, 175, 'fire', () => {
        mv.playSeq16('seq16_m_fireball_blast', ex, ey - 8, 0.65, 24, 14);
        _singleD4(tgt, (175 + skillLvl * 26) / 100, '#fb923c', '🔥', ['burn']);
      });
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 22);
      return;
    }
    if (skillId === 'm_frost_bolt') {
      this.registerEnlightenment('frost');
      const tgt = _pickPrimary();
      const ex = tgt?.sprite?.x ?? _tx, ey = tgt?.sprite?.y ?? _ty;
      mv.launchProjectile('proj_m_ice_lance', _hx, _hy - 14, ex, ey - 10, 0.52, 170, 'frost', () => {
        mv.playSeq16('seq16_m_frost_nova', ex, ey - 8, 0.62, 24, 14);
        _singleD4(tgt, (168 + skillLvl * 25) / 100, '#7dd3fc', '❄️', ['freeze']);
      });
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 22);
      return;
    }
    if (skillId === 'm_arc_lash') {
      this.registerEnlightenment('shock');
      const dirAng = Phaser.Math.Angle.Between(_hx, _hy, _tx, _ty);
      const cx = _hx + Math.cos(dirAng) * 90, cy = _hy + Math.sin(dirAng) * 70;
      mv.playChainArc(_hx, _hy - 12, cx + Math.cos(dirAng + 0.6) * 75, cy + Math.sin(dirAng + 0.6) * 55, 0.44, 210);
      mv.playChainArc(_hx, _hy - 12, cx + Math.cos(dirAng - 0.6) * 75, cy + Math.sin(dirAng - 0.6) * 55, 0.44, 210);
      mv.playSeq16('seq16_m_lightning_strike', cx, cy - 10, 0.85, 24, 16);
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 20);
      this.slotCdTimers = this.slotCdTimers.map((t) => t + 420);
      _coneD4(_hx, _hy, dirAng, 235, 1.15, (168 + skillLvl * 25) / 100, '#c084fc', '⚡電弧鞭 ', ['shock']);
      if (Math.random() < 0.45) this.spawnCracklingOrb(cx, cy);
      return;
    }
    if (skillId === 'm_spark') {
      this.registerEnlightenment('shock');
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 20);
      _chainD4(3, (118 + skillLvl * 18) / 100, '#60a5fa', '✦電花 ', ['shock']);
      if (Math.random() < 0.65) this.spawnCracklingOrb(_tx, _ty);
      return;
    }
    if (skillId === 'm_fireball') {
      this.registerEnlightenment('fire');
      const tgt = _pickPrimary();
      const ex = tgt?.sprite?.x ?? _tx, ey = tgt?.sprite?.y ?? _ty;
      mv.launchProjectile('proj_m_fireball', _hx, _hy - 14, ex, ey - 10, 0.64, 200, 'fire', () => {
        mv.spawnGroundDecal('fire', ex, ey, 0.82, 1750);
        mv.playSeq16('seq16_m_fireball_blast', ex, ey - 10, 1.32, 20, 16);
        mv.spawnDebrisBurst(ex, ey, 'fire', 9);
        _aoeD4(ex, ey, 215, (255 + skillLvl * 38) / 100, '#fb923c', '🔥火球 ', ['burn']);
      });
      return;
    }
    if (skillId === 'm_ice_shards') {
      this.registerEnlightenment('frost');
      const tgt = _pickPrimary();
      for (let w = 0; w < 3; w++) {
        this.time.delayedCall(w * 135, () => {
          const curT = (tgt && tgt.hp > 0) ? tgt : _pickPrimary();
          if (!curT || !curT.sprite) return;
          const ex = curT.sprite.x, ey = curT.sprite.y;
          mv.launchProjectile('proj_m_ice_lance', _hx, _hy - 12, ex, ey - 10, 0.56, 165, 'frost', () => {
            mv.playSeq16('seq16_m_frost_nova', ex, ey - 6, 0.58, 24, 14);
            const wasFrozen = (curT._statuses?.freeze || 0) > this.time.now || (curT.chilledUntil || 0) > this.time.now;
            _singleD4(curT, (108 + skillLvl * 16) / 100, '#38bdf8', '🧊冰片 ', ['freeze', 'vulnerable']);
            // 暗黑 4 冰片規則：命中凍結目標時自動彈射 1 枚冰片至鄰近敵人
            if (wasFrozen) {
              const near = this.monsters.find((m) => m.hp > 0 && m !== curT && m.sprite && Phaser.Math.Distance.Between(ex, ey, m.sprite.x, m.sprite.y) <= 260);
              if (near && near.sprite) {
                mv.launchProjectile('proj_m_ice_lance', ex, ey - 10, near.sprite.x, near.sprite.y - 10, 0.45, 130, 'frost', () => {
                  _singleD4(near, (88 + skillLvl * 12) / 100, '#7dd3fc', '🧊彈射 ', ['freeze']);
                });
              }
            }
          });
        });
      }
      return;
    }
    if (skillId === 'm_frozen_orb') {
      this.registerEnlightenment('frost');
      mv.launchFrozenOrb(
        _hx, _hy, _tx, _ty,
        (mx, my) => {
          const midTgt = this.findNearestMonster(mx, my, 240);
          if (midTgt) _singleD4(midTgt, (105 + skillLvl * 15) / 100, '#7dd3fc', '❄️冰刺 ', ['freeze']);
        },
        () => {
          _aoeD4(_tx, _ty, 265, (180 + skillLvl * 24) / 100, '#38bdf8', '💥冰球碎裂 ', ['freeze', 'vulnerable'], true);
        }
      );
      return;
    }
    if (skillId === 'm_flame_shield') {
      this.registerEnlightenment('fire');
      this.activateHeroBarrier(Math.round(this.playerMaxHp * 0.38), 5500, 'ent_m_flame_shield');
      mv.spawnGroundDecal('fire', _hx, _hy, 0.72, 1400);
      mv.playSeq16('seq16_m_inferno', _hx, _hy - 12, 1.05, 20, 16);
      this.healHero(Math.round(this.playerMaxHp * ((22 + skillLvl * 2) / 100)));
      _aoeD4(_hx, _hy, 230, (175 + skillLvl * 26) / 100, '#fb923c', '🔥烈焰護盾 ', ['burn']);
      return;
    }
    if (skillId === 'm_ice_armor') {
      this.registerEnlightenment('frost');
      this.activateHeroBarrier(Math.round(this.playerMaxHp * 0.45), 6500, 'ent_m_ice_armor');
      mv.spawnGroundDecal('frost', _hx, _hy, 0.72, 1400);
      mv.playSeq16('seq16_m_frost_nova', _hx, _hy - 8, 1.02, 20, 16);
      this.healHero(Math.round(this.playerMaxHp * ((24 + skillLvl * 2) / 100)));
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 30);
      _aoeD4(_hx, _hy, 230, (158 + skillLvl * 24) / 100, '#38bdf8', '🧊寒冰護甲 ', ['freeze']);
      return;
    }
    if (skillId === 'm_arcane_blink') {
      this.registerEnlightenment('shock');
      // 真實傳送閃現：將英雄座標瞬移至目標側翼安全點！
      mv.spawnConjurationPoof(_hx, _hy, 'shock');
      mv.playSeq16('seq16_m_lightning_strike', _hx, _hy - 10, 0.85, 24, 14);
      const ang = Phaser.Math.Angle.Between(_hx, _hy, _tx, _ty);
      const dist = Math.min(260, Phaser.Math.Distance.Between(_hx, _hy, _tx, _ty));
      const destX = Phaser.Math.Clamp(_hx + Math.cos(ang) * Math.max(90, dist - 52), 140, MAP_W - 140);
      const destY = Phaser.Math.Clamp(_hy + Math.sin(ang) * Math.max(70, dist - 52), 140, MAP_H - 140);
      if (this.hero) {
        this.hero.setPosition(destX, destY);
        if (this.heroGroundShadow) this.heroGroundShadow.setPosition(destX, destY + 18);
        if (this.heroCastShadow) this.heroCastShadow.setPosition(destX, destY + 16);
      }
      mv.spawnGroundDecal('shock', destX, destY, 0.78, 1500);
      mv.playSeq16('seq16_m_lightning_strike', destX, destY - 14, 1.22, 22, 18);
      this.slotCdTimers = this.slotCdTimers.map((t) => t + 1000);
      _aoeD4(destX, destY, 220, (215 + skillLvl * 32) / 100, '#60a5fa', '⚡傳送閃現 ', ['shock', 'vulnerable']);
      this.spawnCracklingOrb(destX, destY);
      return;
    }
    if (skillId === 'm_flame_hydra') {
      this.registerEnlightenment('fire');
      const hx2 = _tx + Phaser.Math.Between(-35, 35), hy2 = _ty + Phaser.Math.Between(-25, 25);
      this.spawnMageConjuration('hydra', hx2, hy2, skillLvl, 10500);
      mv.spawnGroundDecal('fire', hx2, hy2, 0.65, 2400);
      mv.playSeq16('seq16_m_fireball_blast', hx2, hy2 - 8, 0.88, 22, 12);
      const tgt = _pickPrimary();
      if (tgt) _singleD4(tgt, (135 + skillLvl * 20) / 100, '#fb923c', '🐍多頭火蛇 ', ['burn']);
      return;
    }
    if (skillId === 'm_ice_blades') {
      this.registerEnlightenment('frost');
      this.spawnMageConjuration('ice_blades', _tx, _ty, skillLvl, 8500);
      mv.spawnGroundDecal('frost', _tx, _ty, 0.62, 1500);
      mv.playSeq16('seq16_m_frost_nova', _tx, _ty - 8, 0.85, 22, 12);
      this.slotCdTimers = this.slotCdTimers.map((t) => t + 500);
      const tgt = _pickPrimary();
      if (tgt) _singleD4(tgt, (145 + skillLvl * 20) / 100, '#7dd3fc', '⚔️寒冰之刃 ', ['freeze', 'vulnerable']);
      return;
    }
    if (skillId === 'm_lightning_spear') {
      this.registerEnlightenment('shock');
      this.spawnMageConjuration('lightning_spear', _tx, _ty, skillLvl, 8000);
      mv.spawnGroundDecal('shock', _tx, _ty, 0.68, 1500);
      _chainD4(2, (145 + skillLvl * 22) / 100, '#facc15', '⚡閃電長矛 ', ['shock']);
      this.spawnCracklingOrb(_tx, _ty);
      return;
    }
    if (skillId === 'm_familiar') {
      this.registerEnlightenment(['fire', 'frost', 'shock'][Math.floor(Math.random() * 3)]);
      this.spawnMageConjuration('familiar', _hx + Phaser.Math.Between(-45, 45), _hy - 26, skillLvl, 10000);
      mv.spawnGroundDecal('void', _tx, _ty, 0.68, 1500);
      mv.playSeq16('seq16_m_supernova', _tx, _ty - 10, 0.92, 20, 14);
      _aoeD4(_tx, _ty, 220, (130 + skillLvl * 18) / 100, '#fde047', '🔮元素使魔 ', ['burn', 'freeze', 'shock']);
      return;
    }
    if (skillId === 'm_firewall') {
      this.registerEnlightenment('fire');
      mv.spawnGroundDecal('fire', _tx, _ty, 1.05, 2400);
      mv.playSeq16('seq16_m_firewall', _tx, _ty - 6, 1.52, 12, -4);
      for (let w = 0; w < 4; w++) {
        this.time.delayedCall(w * 320, () => {
          _rectD4(_tx, _ty, 165, 52, (132 + skillLvl * 22) / 100, '#ef4444', '🔥烈焰火牆 ', ['burn']);
        });
      }
      return;
    }
    if (skillId === 'm_ball_lightning') {
      this.registerEnlightenment('shock');
      for (let w = 0; w < 3; w++) {
        this.time.delayedCall(w * 250, () => {
          const ox = _tx + Phaser.Math.Between(-42, 42), oy = _ty + Phaser.Math.Between(-30, 30);
          mv.playSeq16('seq16_m_ball_lightning', ox, oy - 8, 1.12, 18, 14);
          _aoeD4(ox, oy, 165, (118 + skillLvl * 18) / 100, '#a78bfa', '⚡球狀閃電 ', ['shock']);
        });
      }
      this.spawnCracklingOrb(_tx, _ty);
      return;
    }
    if (skillId === 'm_blizzard_field') {
      this.registerEnlightenment('frost');
      mv.spawnGroundDecal('frost', _tx, _ty, 1.15, 2300);
      mv.playSeq16('seq16_m_blizzard', _tx, _ty - 14, 1.55, 13, 18);
      for (let w = 0; w < 4; w++) {
        this.time.delayedCall(w * 300, () => {
          _aoeD4(_tx, _ty, 265, (118 + skillLvl * 20) / 100, '#7dd3fc', '❄️暴風雪 ', ['freeze']);
        });
      }
      return;
    }
    if (skillId === 'm_inferno') {
      this.registerEnlightenment('fire');
      this.playerMp = this.playerMaxMp;
      mv.spawnGroundDecal('fire', _tx, _ty, 1.28, 2500);
      mv.playSeq16('seq16_m_inferno', _tx, _ty - 18, 1.65, 13, 20);
      for (let w = 0; w < 5; w++) {
        this.time.delayedCall(w * 270, () => {
          _pullVortex(_tx, _ty, 330, 48);
          _aoeD4(_tx, _ty, 310, (182 + skillLvl * 30) / 100, '#fb923c', '🐍煉獄巨蛇 ', ['burn', 'vulnerable'], true);
        });
      }
      return;
    }
    if (skillId === 'm_deep_freeze') {
      this.registerEnlightenment('frost');
      // 真正進入 2.2 秒無敵冰封狀態！
      this.heroInvulnUntil = Math.max(this.heroInvulnUntil || 0, this.time.now + 2200);
      if (this.hero) {
        this.hero.setTint(0x7dd3fc);
        this.time.delayedCall(2200, () => this.hero && this.hero.active && this.hero.clearTint());
      }
      this.activateHeroBarrier(Math.round(this.playerMaxHp * 0.65), 6000, 'ent_m_ice_armor');
      this.healHero(Math.round(this.playerMaxHp * 0.35));
      this.slotCdTimers = this.slotCdTimers.map((t) => t + 4500);
      mv.spawnGroundDecal('frost', _hx, _hy, 1.25, 2200);
      mv.playSeq16('seq16_m_blizzard', _hx, _hy - 14, 1.62, 14, 18);
      for (let w = 0; w < 4; w++) {
        this.time.delayedCall(w * 500, () => {
          if (w === 3) {
            mv.playSeq16('seq16_m_frost_nova', _hx, _hy - 10, 1.65, 18, 20);
            mv.spawnDebrisBurst(_hx, _hy, 'frost', 12);
          }
          _aoeD4(_hx, _hy, 330, (128 + skillLvl * 18) / 100, '#38bdf8', '❄️深度凍結 ', ['freeze', 'vulnerable'], true);
        });
      }
      return;
    }
    if (skillId === 'm_unstable_currents') {
      this.registerEnlightenment('shock');
      mv.spawnGroundDecal('shock', _hx, _hy, 1.15, 2200);
      mv.playSeq16('seq16_m_ball_lightning', _hx, _hy - 12, 1.38, 18, 18);
      this.spawnMageConjuration('lightning_spear', _tx, _ty, skillLvl, 7500);
      this.spawnCracklingOrb(_tx - 30, _ty);
      this.spawnCracklingOrb(_tx + 30, _ty);
      for (let w = 0; w < 5; w++) {
        this.time.delayedCall(w * 240, () => {
          const ox = _tx + Phaser.Math.Between(-85, 85), oy = _ty + Phaser.Math.Between(-55, 55);
          if (w % 2 === 0) mv.playSeq16('seq16_m_lightning_strike', ox, oy - 16, 1.32, 22, 18);
          else mv.playSeq16('seq16_m_ball_lightning', ox, oy - 10, 1.25, 20, 18);
          _aoeD4(ox, oy, 280, (176 + skillLvl * 30) / 100, '#c084fc', '⚡不穩電流 ', ['shock', 'vulnerable'], true);
        });
      }
      return;
    }
    if (skillId === 'm_elemental_cataclysm') {
      this.registerEnlightenment('fire');
      this.registerEnlightenment('frost');
      this.registerEnlightenment('shock');
      mv.spawnGroundDecal('void', _tx, _ty, 1.25, 2400);
      mv.playSeq16('seq16_m_supernova', _tx, _ty - 12, 1.62, 15, 20);
      for (let w = 0; w < 4; w++) {
        this.time.delayedCall(w * 270, () => {
          if (w === 1) mv.playSeq16('seq16_m_meteor', _tx, _ty - 14, 1.45, 18, 18);
          if (w === 2) mv.playSeq16('seq16_m_frost_nova', _tx, _ty - 10, 1.45, 20, 18);
          if (w === 3) mv.playSeq16('seq16_m_lightning_strike', _tx, _ty - 16, 1.45, 22, 18);
          _aoeD4(_tx, _ty, 340, (185 + skillLvl * 32) / 100, '#e879f9', '🌀元素天災 ', ['burn', 'freeze', 'shock'], true);
        });
      }
      return;
    }
    if (skillId === 'm_astral_supernova') {
      this.registerEnlightenment('fire');
      this.registerEnlightenment('frost');
      this.registerEnlightenment('shock');
      this.playerMp = this.playerMaxMp;
      mv.spawnGroundDecal('void', _tx, _ty, 1.35, 2500);
      mv.playSeq16('seq16_m_supernova', _tx, _ty - 12, 1.75, 15, 22);
      mv.spawnDebrisBurst(_tx, _ty, 'shock', 12);
      _aoeD4(_tx, _ty, 360, (410 + skillLvl * 60) / 100, '#fde047', '🌟星界超新星 ', ['vulnerable', 'curse'], true);
      return;
    }
    if (skillId === 'meteor') {
      this.registerEnlightenment('fire');
      mv.playSeq16('seq16_m_meteor', _tx, _ty - 14, 1.58, 16, 18);
      this.time.delayedCall(320, () => {
        mv.spawnGroundDecal('fire', _tx, _ty, 1.15, 2200);
        mv.spawnDebrisBurst(_tx, _ty, 'fire', 12);
        _aoeD4(_tx, _ty, 250, (295 + skillLvl * 42) / 100, '#fb923c', '☄️隕石 ', ['burn', 'vulnerable'], true);
      });
      return;
    }
    if (skillId === 'frost_nova') {
      this.registerEnlightenment('frost');
      mv.spawnGroundDecal('frost', _hx, _hy, 1.05, 1900);
      mv.playSeq16('seq16_m_frost_nova', _hx, _hy - 8, 1.48, 20, 18);
      mv.spawnDebrisBurst(_hx, _hy, 'frost', 10);
      _aoeD4(_hx, _hy, 250, (195 + skillLvl * 28) / 100, '#38bdf8', '❄️冰霜新星 ', ['freeze', 'vulnerable']);
      return;
    }
    if (skillId === 'chain_lightning') {
      this.registerEnlightenment('shock');
      mv.spawnGroundDecal('shock', _tx, _ty, 0.72, 1400);
      _chainD4(5, (165 + skillLvl * 24) / 100, '#a78bfa', '⚡連鎖閃電 ', ['shock']);
      if (Math.random() < 0.65) this.spawnCracklingOrb(_tx, _ty);
      return;
    }
    if (skillId === 'black_hole') {
      this.registerEnlightenment('shock');
      mv.spawnGroundDecal('void', _tx, _ty, 1.15, 2200);
      mv.playSeq16('seq16_m_supernova', _tx, _ty - 10, 1.52, 15, 16);
      for (let w = 0; w < 4; w++) {
        this.time.delayedCall(w * 240, () => {
          _pullVortex(_tx, _ty, 310, 52);
          if (w === 3) _aoeD4(_tx, _ty, 275, (250 + skillLvl * 36) / 100, '#c084fc', '🕳️黑洞坍縮 ', ['vulnerable', 'curse'], true);
        });
      }
      return;
    }
    const alive = this.monsters.filter((m) => m.hp > 0);
    if (alive.length === 0) return;
    const sk = MAGE_SKILLS[skillId];
    const aim = this.getAimPoint(isManual, 480);
    this.faceHeroToward(aim.x, aim.y);
    this.triggerHeroAttackAnim(420);

    const dmgMult = (stats.skillDmgMult || 1) * (this.time.now < this.overloadUntil ? 1.35 : 1);
    const radMult = stats.skillRadiusMult || 1;
    this.showSkillBanner(sk.name, '#c084fc');

    if (skillId === 'meteor') {
      const mx = aim.x;
      const my = aim.y;
      const sigil = this.add.image(mx, my + 16, 'mfx_nova_ring')
        .setScale(1.35 * radMult).setBlendMode(Phaser.BlendModes.ADD).setDepth(6);
      this.tweens.add({ targets: sigil, angle: 90, duration: 380 });

      const meteor = this.add.image(mx - 150, my - 340, 'mfx_meteor_rock')
        .setScale(1.15).setBlendMode(Phaser.BlendModes.ADD).setDepth(4510);
      this.tweens.add({
        targets: meteor,
        x: mx,
        y: my,
        duration: 340,
        ease: 'Quad.easeIn',
        onComplete: () => {
          meteor.destroy();
          sigil.destroy();
          const crater = this.add.image(mx, my + 12, 'mfx_meteor_crater')
            .setScale(1.45 * radMult).setBlendMode(Phaser.BlendModes.ADD).setDepth(5);
          this.tweens.add({ targets: crater, alpha: 0, delay: 950, duration: 420, onComplete: () => crater.destroy() });

          this.playFxSprite('mfx_meteor_blast', mx, my - 16, 1.65 * radMult, 0, 480);
          this.playFxSprite('mfx_meteor_flame', mx, my - 30, 1.35 * radMult, 0, 520);

          const baseDmg = stats.atk * (2.6 + skillLvl * 0.42) * dmgMult;
          this.monsters.filter((m) => m.hp > 0).forEach((m) => {
            if (Phaser.Math.Distance.Between(mx, my, m.sprite.x, m.sprite.y) <= 230 * radMult) {
              const isChill = this.time.now < (m.chilledUntil || 0);
              const dmg = Math.round(baseDmg * (isChill ? 1.35 : 1));
              this.damageMonster(m, dmg, true, false, isChill ? '#38bdf8' : '#e879f9', isChill ? '❄️' : '☄️');
            }
          });
          if (window.__gameSettings?.graphics?.screenShake !== false) this.cameras.main.shake(240, 0.013);
        },
      });
    } else if (skillId === 'arcane_orb') {
      const baseAng = Math.atan2(aim.y - this.hero.y, aim.x - this.hero.x);
      this.playFxSprite('mfx_star_sigil', this.hero.x, this.hero.y - 10, 0.9, 0, 280);
      const offsets = [-0.28, 0, 0.28];
      const rawDmg = stats.atk * (1.15 + skillLvl * 0.22) * dmgMult;

      offsets.forEach((off, idx) => {
        this.time.delayedCall(idx * 65, () => {
          const ang = baseAng + off;
          const spr = this.add.image(this.hero.x, this.hero.y - 12, 'mfx_orb')
            .setScale(0.62 * radMult).setBlendMode(Phaser.BlendModes.ADD).setDepth(4510);
          this.tweens.add({ targets: spr, angle: 360, duration: 900, repeat: -1 });
          this.projectiles.push({
            fromEnemy: false,
            kind: 'mage_orb',
            sprite: spr,
            vx: Math.cos(ang) * 580,
            vy: Math.sin(ang) * 580,
            lifeMs: 1100,
            fixedRawDmg: rawDmg,
            bonusCrit: 15,
            hitIds: new Set(),
            stats,
          });
        });
      });
    } else if (skillId === 'frost_nova') {
      const mx = this.hero.x;
      const my = this.hero.y;
      const radius = 240 * radMult;
      this.playFxSprite('mfx_frost_ring', mx, my + 8, 1.75 * radMult, 0, 520);
      this.playFxSprite('mfx_frost_shard', mx, my - 12, 1.45 * radMult, 0, 440);
      this.playFxSprite('mfx_frost_burst', mx, my, 1.35 * radMult, Math.random() * Math.PI, 460);

      const shieldGain = Math.round(this.playerMaxHp * (0.16 + skillLvl * 0.02));
      this.mageShieldHp = Math.min(Math.round(this.playerMaxHp * 0.5), this.mageShieldHp + shieldGain);

      const shield = this.add.image(mx, my, 'mfx_arcane_shield')
        .setScale(0.85).setAlpha(0.75).setBlendMode(Phaser.BlendModes.ADD).setDepth(4508);
      this.tweens.add({
        targets: shield,
        alpha: 0,
        scale: 1.15,
        duration: 1400,
        onUpdate: () => shield.setPosition(this.hero.x, this.hero.y),
        onComplete: () => shield.destroy(),
      });

      const dmg = Math.round(stats.atk * (1.8 + skillLvl * 0.30) * dmgMult);
      alive.forEach((m) => {
        if (Phaser.Math.Distance.Between(mx, my, m.sprite.x, m.sprite.y) <= radius) {
          m.slowUntil = this.time.now + 3500;
          m.chilledUntil = this.time.now + 3500;
          this.damageMonster(m, dmg, Math.random() * 100 < stats.critRate, false, '#38bdf8', '❄️');
        }
      });
      this.healHero(Math.round(this.playerMaxHp * (0.08 + skillLvl * 0.02)));
    } else if (skillId === 'void_beam') {
      const charges = this.arcaneChargeStacks || 0;
      this.arcaneChargeStacks = 0;
      const chargeDmgMult = 1 + charges * 0.12;
      const chargeWidthMult = 1 + charges * 0.10;

      const ang = Math.atan2(aim.y - this.hero.y, aim.x - this.hero.x);
      const sx = this.hero.x;
      const sy = this.hero.y - 12;
      this.playFxSprite('mfx_void_core', sx, sy, 1.05 * chargeWidthMult, 0, 380);
      this.playFxSprite('mfx_void_slash', sx + Math.cos(ang) * 45, sy + Math.sin(ang) * 45, 0.95, ang, 340);

      const beamLen = 580 * radMult;
      const bx = sx + Math.cos(ang) * (beamLen / 2);
      const by = sy + Math.sin(ang) * (beamLen / 2);
      const beam = this.add.image(bx, by, 'mfx_void_beam')
        .setDisplaySize(beamLen, 145 * radMult * chargeWidthMult).setRotation(ang).setBlendMode(Phaser.BlendModes.ADD).setDepth(4512);
      this.tweens.add({ targets: beam, alpha: 0, scaleY: 0.4, duration: 420, onComplete: () => beam.destroy() });

      const beamDmg = Math.round(stats.atk * (3.1 + skillLvl * 0.48) * (stats.critDmg / 100) * dmgMult * chargeDmgMult);
      const cosA = Math.cos(ang);
      const sinA = Math.sin(ang);
      alive.forEach((m) => {
        const dx = m.sprite.x - sx;
        const dy = m.sprite.y - sy;
        const along = dx * cosA + dy * sinA;
        const perp = Math.abs(-dx * sinA + dy * cosA);
        if (along >= -40 && along <= beamLen && perp <= 105 * radMult * chargeWidthMult) {
          this.playFxSprite('mfx_star_sigil', m.sprite.x, m.sprite.y - 10, 0.85, Math.random() * Math.PI, 300);
          this.applyHitEffects(m, beamDmg, true, stats);
        }
      });
      if (window.__gameSettings?.graphics?.screenShake !== false) this.cameras.main.shake(210, 0.011);
    } else if (skillId === 'mana_overload') {
      this.overloadUntil = this.time.now + 4500;
      this.arcaneChargeStacks = 5;
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + Math.round(this.playerMaxMp * (0.5 + skillLvl * 0.05)));
      this.playFxSprite('nfx_overload', this.hero.x, this.hero.y - 20, 1.35, 0, 560);
      this.spawnFloatingText(this.hero.x, this.hero.y - 95, '⚡魔力超載!', '#38bdf8', 16);
    } else if (skillId === 'chain_lightning') {
      let curX = this.hero.x;
      let curY = this.hero.y - 12;
      const hitSet = new Set();
      for (let hop = 0; hop < 6; hop++) {
        const next = this.monsters.find((m) => m.hp > 0 && !hitSet.has(m.uid) && Phaser.Math.Distance.Between(curX, curY, m.sprite.x, m.sprite.y) <= 420);
        if (!next) break;
        hitSet.add(next.uid);
        const mx = (curX + next.sprite.x) / 2;
        const my = (curY + next.sprite.y) / 2;
        const dist = Math.max(60, Phaser.Math.Distance.Between(curX, curY, next.sprite.x, next.sprite.y));
        const ang = Math.atan2(next.sprite.y - curY, next.sprite.x - curX);
        const arc = this.add.image(mx, my, 'nfx_lightning').setDisplaySize(dist, 85).setRotation(ang).setBlendMode(Phaser.BlendModes.ADD).setDepth(4512);
        this.tweens.add({ targets: arc, alpha: 0, duration: 280, onComplete: () => arc.destroy() });
        const isChill = this.time.now < (next.chilledUntil || 0);
        const dmg = Math.round(stats.atk * (1.3 + skillLvl * 0.26) * (isChill ? 1.85 : 1) * dmgMult);
        this.damageMonster(next, dmg, Math.random() * 100 < stats.critRate, false, '#38bdf8', '⚡');
        curX = next.sprite.x;
        curY = next.sprite.y;
      }
    } else if (skillId === 'icicle_rain') {
      const tx = aim.x;
      const ty = aim.y;
      const radius = 235 * radMult;
      this.time.addEvent({
        delay: 280,
        repeat: 3,
        callback: () => {
          this.playFxSprite('nfx_icicles', tx + Phaser.Math.Between(-30, 30), ty - 45, 1.35 * radMult, 0, 360);
          this.playFxSprite('mfx_frost_burst', tx, ty + 10, 1.15 * radMult, 0, 340);
          const dmg = Math.round(stats.atk * (0.78 + skillLvl * 0.16) * dmgMult);
          this.monsters.filter((m) => m.hp > 0).forEach((m) => {
            if (Phaser.Math.Distance.Between(tx, ty, m.sprite.x, m.sprite.y) <= radius) {
              m.slowUntil = this.time.now + 3500;
              m.chilledUntil = this.time.now + 3500;
              this.damageMonster(m, dmg, Math.random() * 100 < stats.critRate, false, '#7dd3fc', '❄️');
            }
          });
        },
      });
    } else if (skillId === 'black_hole') {
      const bx = aim.x;
      const by = aim.y;
      const radius = 330 * radMult;
      const bh = this.add.image(bx, by, 'nfx_blackhole').setScale(1.4 * radMult).setBlendMode(Phaser.BlendModes.ADD).setDepth(4505);
      this.tweens.add({ targets: bh, angle: 360, duration: 1200 });
      alive.forEach((m) => {
        if (Phaser.Math.Distance.Between(bx, by, m.sprite.x, m.sprite.y) <= radius) {
          m.stunUntil = this.time.now + 1200;
          this.tweens.add({
            targets: m.sprite,
            x: bx + Phaser.Math.Between(-50, 50),
            y: by + Phaser.Math.Between(-40, 40),
            duration: 550,
            ease: 'Quad.easeIn',
          });
        }
      });
      this.time.delayedCall(1100, () => {
        bh.destroy();
        this.playFxSprite('mfx_void_core', bx, by, 1.6 * radMult, 0, 450);
        const dmg = Math.round(stats.atk * (2.5 + skillLvl * 0.42) * dmgMult);
        this.monsters.filter((m) => m.hp > 0).forEach((m) => {
          if (Phaser.Math.Distance.Between(bx, by, m.sprite.x, m.sprite.y) <= radius * 0.85) {
            this.damageMonster(m, dmg, true, false, '#c084fc', '🕳️');
          }
        });
        if (window.__gameSettings?.graphics?.screenShake !== false) this.cameras.main.shake(220, 0.012);
      });
    }
  }

  showSkillBanner(name, color = '#fde047') {
    const banner = this.add.text(this.scale.width / 2, 68, `⚡ 【${name}】`, {
      fontSize: '23px', color, fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(5000);
    this.tweens.add({ targets: banner, y: 42, alpha: 0, duration: 920, onComplete: () => banner.destroy() });
  }


  castPaladinSkill(skillId, skillLvl, stats, isManual = false) {
    const _hx = this.hero.x, _hy = this.hero.y;
    const _n = this.findNearestMonster(_hx, _hy);
    const _tx = _n ? _n.sprite.x : _hx + 90, _ty = _n ? _n.sprite.y : _hy;
    const _aoe = (cx, cy, rad, mult, col, pre, stList = [], forceCrit = false, extraFlat = 0) => {
      for (const m of [...this.monsters]) {
        if (!m || m.hp <= 0) continue;
        if (Phaser.Math.Distance.Between(cx, cy, m.sprite.x, m.sprite.y) <= rad) {
          const isC = forceCrit || (Math.random() * 100 < stats.critRate);
          const d = Math.round((stats.atk * mult + extraFlat) * (isC ? stats.critDmg / 100 : 1));
          if (!m._statuses) m._statuses = {};
          stList.forEach((k) => { m._statuses[k] = Math.max(m._statuses[k] || 0, this.time.now + 5000); });
          this.damageMonster(m, d, isC, false, col, pre);
        }
      }
    };
    if (skillId === 'p_smite_lash') {
      this.playAdditiveVfx('vfx_p_cross_fire', _tx, _ty - 10, 0.78, 340);
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 18);
      _aoe(_tx, _ty, 220, (145 + skillLvl * 22) / 100, '#fde047', '✨', ['conviction']);
      return;
    }
    if (skillId === 'p_holy_lance') {
      this.playAdditiveVfx('vfx_p_cross_fire', _tx, _ty - 8, 1.0, 420);
      for (const m of [...this.monsters]) {
        if (!m || m.hp <= 0) continue;
        if (Phaser.Math.Distance.Between(_tx, _ty, m.sprite.x, m.sprite.y) <= 250) {
          const hasConv = this.time.now < (m._statuses?.conviction || 0);
          const mult = ((240 + skillLvl * 38) / 100) * (hasConv ? 1.55 : 1.0);
          this.damageMonster(m, Math.round(stats.atk * mult), Math.random() * 100 < stats.critRate, false, '#fde047', '🔱聖槍 ');
        }
      }
      return;
    }
    if (skillId === 'p_crusader_charge') {
      this.playAdditiveVfx('vfx_p_cross_fire', _tx, _ty, 1.08, 460);
      _aoe(_tx, _ty, 260, (210 + skillLvl * 32) / 100, '#fbbf24', '✝️', ['burn', 'conviction']);
      return;
    }
    if (skillId === 'p_redemption_prayer') {
      this.playAdditiveVfx('vfx_p_redemption_halo', _hx, _hy - 12, 1.0, 520);
      this.healHero(Math.round(this.playerMaxHp * ((35 + skillLvl * 3) / 100)));
      _aoe(_hx, _hy, 260, (160 + skillLvl * 25) / 100, '#fef08a', '🕊️', ['conviction']);
      return;
    }
    if (skillId === 'p_thorns_aura') {
      this.playAdditiveVfx('vfx_p_thorns_ring', _hx, _hy - 6, 1.02, 460);
      _aoe(_hx, _hy, 270, (175 + skillLvl * 28) / 100, '#fbbf24', '🛡️荊棘 ', ['vulnerable'], false, (stats.armor || 20) * 2.8);
      return;
    }
    if (skillId === 'p_solar_beacon') {
      for (let w = 0; w < 3; w++) {
        this.time.delayedCall(w * 280, () => {
          this.playAdditiveVfx('vfx_p_redemption_halo', _tx, _ty - 10, 0.95, 420);
          _aoe(_tx, _ty, 260, (130 + skillLvl * 22) / 100, '#fde047', '☀️', ['conviction', 'burn']);
        });
      }
      return;
    }
    if (skillId === 'p_seraph_descent') {
      this.healHero(Math.round(this.playerMaxHp * 0.30));
      this.playAdditiveVfx('vfx_p_seraph_wings', _hx, _hy - 30, 1.25, 680);
      for (let w = 0; w < 4; w++) {
        this.time.delayedCall(w * 300, () => {
          this.playAdditiveVfx('vfx_p_redemption_halo', _tx, _ty - 12, 1.08, 460);
          _aoe(_tx, _ty, 340, (175 + skillLvl * 30) / 100, '#fde047', '👼熾天使 ', ['conviction', 'burn'], true);
        });
      }
      return;
    }
    if (skillId === 'p_heavens_verdict') {
      this.playAdditiveVfx('vfx_p_verdict_sword', _tx, _ty - 36, 1.28, 620);
      _aoe(_tx, _ty, 330, (380 + skillLvl * 55) / 100, '#fef08a', '⚔️天罰巨劍 ', ['conviction', 'shock'], true);
      return;
    }
    const alive = this.monsters.filter((m) => m.hp > 0);
    if (alive.length === 0) return;
    const tree = this.getState().skillTree || {};
    const aim = this.getAimPoint(isManual, 360);
    this.faceHeroToward(aim.x, aim.y);
    this.triggerHeroAttackAnim(420);
    this.hero.play(`p_${this.heroDir}_atk`, false);

    const auraBonus = this.time.now < this.radiantAuraUntil ? 1.25 : 1;
    const dmgMult = (stats.skillDmgMult || 1) * auraBonus;
    const stunMult = 1 + (stats.stunDurPct || 0) / 100;
    const keyJudg = (tree.p_key_judgment || 0) > 0;

    const dealHolyDmg = (mob, mult, forceCrit = false, color = '#fde047') => {
      if (!mob || mob.hp <= 0) return;
      const isStun = this.time.now < (mob.stunUntil || 0);
      const isCrit = forceCrit || (keyJudg && isStun) || Math.random() * 100 < stats.critRate;
      const dmg = Math.max(1, Math.round(stats.atk * mult * dmgMult * (isCrit ? stats.critDmg / 100 : 1)));
      this.damageMonster(mob, dmg, isCrit, false, color, '✨');
    };

    if (skillId === 'blessed_hammer') {
      const count = 3 + (skillLvl >= 4 ? 1 : 0) + ((tree.p_mod_spiral || 0) > 0 ? 2 : 0) + (stats.activeEffects.has('hammer_extra') ? 2 : 0);
      const mult = 0.95 + skillLvl * 0.20;
      const speedMult = (tree.p_mod_spiral || 0) > 0 ? 1.25 : 1;
      for (let i = 0; i < count; i++) {
        const startAng = (Math.PI * 2 * i) / count;
        const spr = this.add.image(this.hero.x, this.hero.y, 'pfx_hammer')
          .setScale(0.45).setBlendMode(Phaser.BlendModes.ADD).setDepth(4512);
        const hitSet = new Set();
        const stateObj = { t: 0 };
        this.tweens.add({
          targets: stateObj,
          t: 1,
          duration: Math.round(1700 / speedMult),
          onUpdate: () => {
            if (!spr.active || !this.hero) return;
            const ang = startAng + stateObj.t * Math.PI * 4.2;
            const rad = 45 + stateObj.t * 210;
            spr.x = this.hero.x + Math.cos(ang) * rad;
            spr.y = this.hero.y + Math.sin(ang) * rad;
            spr.rotation += 0.28;
            for (const m of this.monsters) {
              if (m.hp <= 0 || hitSet.has(m.uid)) continue;
              if (Phaser.Math.Distance.Between(spr.x, spr.y, m.sprite.x, m.sprite.y) <= 68) {
                hitSet.add(m.uid);
                const stunBoost = this.time.now < (m.stunUntil || 0) ? 1.25 : 1;
                dealHolyDmg(m, mult * stunBoost);
              }
            }
          },
          onComplete: () => spr.destroy(),
        });
      }
      return;
    }

    if (skillId === 'heaven_fist') {
      this.playFxSprite('pfx_heaven', aim.x, aim.y - 45, 1.35, 0, 420);
      if (window.__gameSettings?.graphics?.screenShake !== false) this.cameras.main.shake(120, 0.006);
      const mult = 2.10 + skillLvl * 0.36;
      const hasMod = (tree.p_mod_bolts || 0) > 0;
      for (const m of alive) {
        if (Phaser.Math.Distance.Between(aim.x, aim.y, m.sprite.x, m.sprite.y) <= 185) {
          if (hasMod) m.stunUntil = Math.max(m.stunUntil || 0, this.time.now + Math.round(800 * stunMult));
          dealHolyDmg(m, mult);
        }
      }
      const bolts = hasMod ? 8 : 6;
      for (let i = 0; i < bolts; i++) {
        const ang = (Math.PI * 2 * i) / bolts;
        const spr = this.add.image(aim.x, aim.y - 10, 'pfx_slash')
          .setScale(0.42).setRotation(ang).setBlendMode(Phaser.BlendModes.ADD).setDepth(4508);
        this.projectiles.push({
          fromEnemy: false, kind: 'mage_bolt', sprite: spr,
          vx: Math.cos(ang) * 620, vy: Math.sin(ang) * 620,
          lifeMs: 750, dmgMult: 0.65 + skillLvl * 0.12, bouncesLeft: 0, hitIds: new Set(), stats,
        });
      }
      return;
    }

    if (skillId === 'judgment') {
      this.playFxSprite('pfx_judgment', aim.x, aim.y - 12, 1.45, 0, 480);
      if (window.__gameSettings?.graphics?.screenShake !== false) this.cameras.main.shake(160, 0.008);
      const mult = 2.35 + skillLvl * 0.42;
      let hits = 0;
      for (const m of alive) {
        if (Phaser.Math.Distance.Between(aim.x, aim.y, m.sprite.x, m.sprite.y) <= 220) {
          m.stunUntil = Math.max(m.stunUntil || 0, this.time.now + Math.round(1500 * stunMult));
          dealHolyDmg(m, mult, false, '#fef08a');
          hits++;
        }
      }
      if (hits > 0) this.playerMp = Math.min(this.playerMaxMp, this.playerMp + hits * 4);
      return;
    }

    if (skillId === 'divine_storm') {
      this.playFxSprite('pfx_storm', this.hero.x, this.hero.y, 1.65, 0, 460);
      const mult = 1.75 + skillLvl * 0.32;
      let hits = 0;
      for (const m of alive) {
        if (Phaser.Math.Distance.Between(this.hero.x, this.hero.y, m.sprite.x, m.sprite.y) <= 260) {
          dealHolyDmg(m, mult);
          hits++;
        }
      }
      if (hits > 0) {
        this.healHero(Math.round(this.playerMaxHp * Math.min(0.30, hits * 0.03)));
        this.playerMp = Math.min(this.playerMaxMp, this.playerMp + hits * 3);
      }
      return;
    }

    if (skillId === 'shield_bash') {
      const ang = Math.atan2(aim.y - this.hero.y, aim.x - this.hero.x);
      const dist = Math.min(260, Math.hypot(aim.x - this.hero.x, aim.y - this.hero.y));
      const nx = Phaser.Math.Clamp(this.hero.x + Math.cos(ang) * dist, 180, MAP_W - 180);
      const ny = Phaser.Math.Clamp(this.hero.y + Math.sin(ang) * dist, 220, MAP_H - 180);
      this.hero.setPosition(nx, ny);
      this.playFxSprite('pfx_bash', nx + Math.cos(ang) * 40, ny + Math.sin(ang) * 40, 1.15, ang, 380);
      const mult = 1.55 + skillLvl * 0.28;
      const armBonus = stats.armor * (0.65 + skillLvl * 0.10);
      let hits = 0;
      for (const m of alive) {
        if (Phaser.Math.Distance.Between(nx, ny, m.sprite.x, m.sprite.y) <= 200) {
          m.stunUntil = Math.max(m.stunUntil || 0, this.time.now + Math.round(1000 * stunMult));
          const isCrit = keyJudg || Math.random() * 100 < stats.critRate;
          const dmg = Math.max(1, Math.round((stats.atk * mult + armBonus) * dmgMult * (isCrit ? stats.critDmg / 100 : 1)));
          this.damageMonster(m, dmg, isCrit, false, '#fbbf24', '🛡️');
          hits++;
        }
      }
      if ((tree.p_mod_thorns || 0) > 0) this.thornsModUntil = this.time.now + 3000;
      if ((tree.p_mod_taunt || 0) > 0 && hits > 0) {
        this.healHero(Math.round(this.playerMaxHp * Math.min(0.25, hits * 0.03)));
        this.playerMp = Math.min(this.playerMaxMp, this.playerMp + hits * 4);
      }
      return;
    }

    if (skillId === 'holy_aegis') {
      this.holyAegisHp = Math.round(this.playerMaxHp * (0.40 + skillLvl * 0.06));
      this.holyAegisUntil = this.time.now + 5000;
      const dome = this.add.image(this.hero.x, this.hero.y - 12, 'pfx_aegis')
        .setScale(0.75).setAlpha(0.85).setBlendMode(Phaser.BlendModes.ADD).setDepth(4515);
      this.tweens.add({
        targets: dome, alpha: 0, scale: 1.05, duration: 1200,
        onUpdate: () => { if (dome.active && this.hero) dome.setPosition(this.hero.x, this.hero.y - 12); },
        onComplete: () => dome.destroy(),
      });
      this.spawnFloatingText(this.hero.x, this.hero.y - 90, `🛡️ 聖盾 +${formatNum(this.holyAegisHp)}`, '#fde047', 15);
      return;
    }

    if (skillId === 'consecration') {
      const cx = this.hero.x;
      const cy = this.hero.y + 12;
      const circle = this.add.image(cx, cy, 'pfx_consecration')
        .setScale(1.25).setAlpha(0.9).setBlendMode(Phaser.BlendModes.ADD).setDepth(6);
      const waveMult = 0.75 + skillLvl * 0.16;
      const healPct = (3 + skillLvl * 0.8) / 100;
      for (let w = 0; w < 4; w++) {
        this.time.delayedCall(w * 950, () => {
          if (this.isTransitioning) return;
          this.healHero(Math.max(1, Math.round(this.playerMaxHp * healPct)));
          for (const m of this.monsters) {
            if (m.hp > 0 && Phaser.Math.Distance.Between(cx, cy, m.sprite.x, m.sprite.y) <= 230) {
              dealHolyDmg(m, waveMult);
            }
          }
        });
      }
      this.tweens.add({ targets: circle, angle: 90, alpha: 0, delay: 3200, duration: 800, onComplete: () => circle.destroy() });
      return;
    }

    if (skillId === 'radiant_aura') {
      this.radiantAuraUntil = this.time.now + 4500;
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 28);
      this.playFxSprite('pfx_storm', this.hero.x, this.hero.y, 1.4, 0, 420);
      const mult = 1.30 + skillLvl * 0.24;
      for (const m of alive) {
        if (Phaser.Math.Distance.Between(this.hero.x, this.hero.y, m.sprite.x, m.sprite.y) <= 240) {
          dealHolyDmg(m, mult);
        }
      }
      this.spawnFloatingText(this.hero.x, this.hero.y - 90, '✨ 熾光懲戒光環！', '#fef08a', 15);
    }
  }


  updateSummons(dt, stats) {
    if (!this.summons || this.summons.length === 0) return;
    const now = this.time.now;
    const frenzy = now < (this.undeadFrenzyUntil || 0);
    const tree = this.getState().skillTree || {};
    const keyOverlord = (tree.n_key_overlord || 0) > 0;

    for (let i = this.summons.length - 1; i >= 0; i--) {
      const s = this.summons[i];
      s.lifeMs -= dt * 1000;
      if (s.lifeMs <= 0 || !s.sprite || !s.sprite.active) {
        s.sprite?.destroy();
        s.barBg?.destroy();
        s.barFill?.destroy();
        s.label?.destroy();
        this.summons.splice(i, 1);
        continue;
      }

      const baseScale = s.kind === 'golem' ? 0.58 : 0.48;
      const bob = Math.sin(now * 0.015 + i) * 0.025;
      s.sprite.setScale(baseScale * (1 - bob * 0.5), baseScale * (1 + bob));

      const animPref = s.kind === 'golem' ? 'sum_gol' : 'sum_skel';
      const isSumAtk = now < (s.atkAnimUntil || 0);
      const target = this.findNearestMonster(s.sprite.x, s.sprite.y);
      if (target) {
        const dx = target.sprite.x - s.sprite.x;
        const dy = target.sprite.y - s.sprite.y;
        const dist = Math.hypot(dx, dy) || 1;
        let sDir = 'right';
        let sFlip = dx < 0;
        if (Math.abs(dy) > Math.abs(dx) * 1.25) {
          sDir = dy < 0 ? 'up' : 'down';
          sFlip = false;
        }
        s.dir = sDir;
        s.sprite.setFlipX(sFlip);
        const wantKey = `${animPref}_${sDir}_${isSumAtk ? 'atk' : 'walk'}`;
        if (s.sprite.anims && s.sprite.anims.currentAnim?.key !== wantKey) {
          s.sprite.play(wantKey, !isSumAtk);
        }
        const atkR = s.kind === 'golem' ? 115 : 85;
        if (dist > atkR) {
          const spd = (s.kind === 'golem' ? 185 : 225) * (frenzy ? 1.35 : 1);
          s.sprite.x += (dx / dist) * spd * dt;
          s.sprite.y += (dy / dist) * spd * dt;
          s.sprite.setDepth(s.sprite.y);
        }
        s.atkTimer -= dt * 1000 * (frenzy ? 1.6 : 1);
        if (dist <= atkR + 28 && s.atkTimer <= 0) {
          s.atkTimer = s.kind === 'golem' ? 1300 : 880;
          s.atkAnimUntil = now + 360;
          if (s.sprite.anims) s.sprite.play(`${animPref}_${s.dir || 'down'}_atk`, false);
          const sumMult = (1 + (stats.summonDmgPct || 0) / 100) * (frenzy ? 1.35 : 1);
          const isCrit = Math.random() * 100 < stats.critRate;
          if (s.kind === 'golem') {
            this.playFxSprite('sfx_golem_slam', s.sprite.x, s.sprite.y + 10, 1.05, 0, 340);
            this.playFxSprite('sfx_blood_leech', this.hero.x, this.hero.y - 10, 0.65, 0, 300);
            const mult = (1.35 + s.lvl * 0.28) * sumMult;
            for (const m of this.monsters) {
              if (m.hp > 0 && Phaser.Math.Distance.Between(s.sprite.x, s.sprite.y, m.sprite.x, m.sprite.y) <= 155) {
                const dmg = Math.max(1, Math.round(stats.atk * mult * (isCrit ? stats.critDmg / 100 : 1)));
                this.damageMonster(m, dmg, isCrit, false, '#fb7185', '🩸');
              }
            }
            const healMult = (tree.n_mod_leech || 0) > 0 ? 2 : 1;
            this.healHero(Math.max(1, Math.round(this.playerMaxHp * ((3 + s.lvl * 0.8) / 100) * healMult)));
          } else {
            this.playFxSprite('sfx_skel_slash', target.sprite.x, target.sprite.y - 8, 0.62, Math.atan2(dy, dx), 220);
            const mult = (0.75 + s.lvl * 0.18) * sumMult;
            const dmg = Math.max(1, Math.round(stats.atk * mult * (isCrit ? stats.critDmg / 100 : 1)));
            this.damageMonster(target, dmg, isCrit, false, '#5eead4', '💀');
            if (keyOverlord) {
              const sec = this.monsters.find((m) => m.hp > 0 && m !== target && Phaser.Math.Distance.Between(target.sprite.x, target.sprite.y, m.sprite.x, m.sprite.y) <= 200);
              if (sec) this.damageMonster(sec, Math.round(dmg * 0.65), false, false, '#2dd4bf', '👻');
            }
          }
        }
      } else if (this.hero) {
        const dx = this.hero.x + s.offX - s.sprite.x;
        const dy = this.hero.y + s.offY - s.sprite.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 30) {
          s.sprite.x += (dx / dist) * 195 * dt;
          s.sprite.y += (dy / dist) * 195 * dt;
          s.sprite.setDepth(s.sprite.y);
        }
      }

      const barY = s.sprite.y - (s.kind === 'golem' ? 68 : 48);
      const ratio = Math.max(0, Math.min(1, s.lifeMs / s.maxLifeMs));
      if (s.barBg) s.barBg.setPosition(s.sprite.x, barY);
      if (s.barFill) {
        s.barFill.setPosition(s.sprite.x - 24, barY);
        s.barFill.width = 48 * ratio;
      }
      if (s.label) s.label.setPosition(s.sprite.x, barY - 12);
    }
  }

  // v252: 暗黑 4 死靈法師即時倍率（亡者之書獻祭孤狼加成＋關鍵被動＋鮮血球層數）
  getNecroD4LiveMult() {
    const st = this.getState();
    const book = st?.classMechanic?.necro || {};
    const ks = st?.activeKeystone?.necro || '';
    let mult = 1.0;
    let sacCount = 0;
    if (book.skeleton === 'sacrifice') sacCount += 1;
    if (book.mage === 'sacrifice') sacCount += 1;
    if (book.golem === 'sacrifice') sacCount += 1;
    if (sacCount === 3) mult *= 1.45;
    else if (sacCount > 0) mult *= (1 + sacCount * 0.14);
    if (ks === 'nk_undead_overlord' && (this.necroMinions?.length || 0) >= 3) mult *= 1.28;
    if (ks === 'nk_bone_tyrant') mult *= 1.18;
    if (ks === 'nk_plague_sea') mult *= 1.16;
    if (ks === 'nk_lich_phylactery' && this.playerMp >= this.playerMaxMp * 0.5) mult *= 1.22;
    return mult;
  }

  // v252: 在地面生成真實屍體（ent_n_corpse，供屍爆／屍體觸鬚／亡靈軍團消耗）
  spawnNecroCorpse(x, y) {
    if (!this.textures.exists('ent_n_corpse')) return null;
    if (!this.necroCorpses) this.necroCorpses = [];
    while (this.necroCorpses.length >= 12) {
      const old = this.necroCorpses.shift();
      if (old?.sprite?.active) old.sprite.destroy();
    }
    const cx = Phaser.Math.Clamp(x + Phaser.Math.Between(-18, 18), 80, MAP_W - 80);
    const cy = Phaser.Math.Clamp(y + Phaser.Math.Between(-10, 14), 80, MAP_H - 80);
    const sp = this.add.image(cx, cy, 'ent_n_corpse')
      .setScale(0.32)
      .setAlpha(0)
      .setDepth(52);
    this.tweens.add({ targets: sp, scale: 0.56, alpha: 0.94, duration: 180, ease: 'Back.easeOut' });
    const entry = { x: cx, y: cy, sprite: sp, expiresAt: this.time.now + 18000 };
    this.necroCorpses.push(entry);
    return entry;
  }

  // v252: 消耗（或定位）最近地面屍體
  consumeNearestNecroCorpse(x, y, maxDist = 440, destroyCorpse = true) {
    if (!this.necroCorpses || this.necroCorpses.length === 0) {
      return { x, y, consumed: false };
    }
    let bestIdx = -1;
    let bestDist = maxDist;
    for (let i = 0; i < this.necroCorpses.length; i++) {
      const c = this.necroCorpses[i];
      if (!c?.sprite?.active) continue;
      const d = Phaser.Math.Distance.Between(x, y, c.x, c.y);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    if (bestIdx === -1) return { x, y, consumed: false };
    const picked = this.necroCorpses[bestIdx];
    const rx = picked.x;
    const ry = picked.y;
    if (destroyCorpse) {
      if (picked.sprite?.active) picked.sprite.destroy();
      this.necroCorpses.splice(bestIdx, 1);
    }
    return { x: rx, y: ry, consumed: true };
  }

  // v252: 生成磁吸鮮血球（ent_n_blood_orb，回血＋回魂能＋疊加拉斯瑪壓制）
  spawnNecroBloodOrb(x, y) {
    if (!this.textures.exists('ent_n_blood_orb')) return null;
    if (!this.necroBloodOrbs) this.necroBloodOrbs = [];
    while (this.necroBloodOrbs.length >= 10) {
      const old = this.necroBloodOrbs.shift();
      if (old?.sprite?.active) old.sprite.destroy();
    }
    const ox = Phaser.Math.Clamp(x + Phaser.Math.Between(-36, 36), 80, MAP_W - 80);
    const oy = Phaser.Math.Clamp(y + Phaser.Math.Between(-24, 24), 80, MAP_H - 80);
    const sp = this.add.image(ox, oy, 'ent_n_blood_orb')
      .setScale(0.24)
      .setAlpha(0)
      .setDepth(Math.max(115, Math.round(oy + 6)));
    this.tweens.add({ targets: sp, scale: 0.44, alpha: 0.96, duration: 200, ease: 'Back.easeOut' });
    const entry = { x: ox, y: oy, sprite: sp, phase: Math.random() * 6.28, expiresAt: this.time.now + 14000 };
    this.necroBloodOrbs.push(entry);
    return entry;
  }

  // v252: 暗影枯萎（Shadowblight）累積觸發器
  triggerNecroShadowHit(target, stats) {
    if (!target || !target.sprite || target.hp <= 0) return;
    const st = this.getState();
    const hasKeystone = st?.activeKeystone?.necro === 'nk_shadowblight';
    this.necroShadowHits = (this.necroShadowHits || 0) + 1;
    const threshold = hasKeystone ? 8 : 14;
    if (this.necroShadowHits >= threshold) {
      this.necroShadowHits = 0;
      const sx = target.sprite.x;
      const sy = target.sprite.y;
      this.necroVfx?.playSeq16('seq16_n_soul_rift', sx, sy - 8, 1.05, 18, 18);
      this.necroVfx?.spawnDebrisBurst(sx, sy, 'shadow', 7);
      const sbMult = (hasKeystone ? 2.45 : 1.35) * this.getNecroD4LiveMult();
      for (const m of [...this.monsters]) {
        if (!m || m.hp <= 0 || !m.sprite) continue;
        if (Phaser.Math.Distance.Between(sx, sy, m.sprite.x, m.sprite.y) <= 230) {
          const dmg = Math.max(1, Math.round(stats.atk * sbMult * (stats.critDmg / 100)));
          this.damageMonster(m, dmg, true, false, '#c084fc', '☠️暗影枯萎 ', true);
        }
      }
    }
  }

  // v252: 生成 2x2 四幀動態亡靈隨從（嚴格尊重亡者之書獻祭設定）
  spawnNecroMinion(kind, x, y, skillLvl = 1, lifeMs = 20000) {
    const st = this.getState();
    const book = st?.classMechanic?.necro || {};
    const ks = st?.activeKeystone?.necro || '';
    if (kind === 'skeleton' && book.skeleton === 'sacrifice') return false;
    if (kind === 'mage' && book.mage === 'sacrifice') return false;
    if (kind === 'golem' && book.golem === 'sacrifice') return false;

    const animKeyMap = {
      skeleton: 'anim_n_skeleton',
      mage: 'anim_n_mage',
      golem: 'anim_n_golem',
      wraith: 'anim_n_wraith',
    };
    const scaleMap = { skeleton: 0.44, mage: 0.46, golem: 0.62, wraith: 0.46 };
    const capMap = {
      skeleton: ks === 'nk_undead_overlord' ? 6 : 4,
      mage: ks === 'nk_undead_overlord' ? 4 : 3,
      golem: 1,
      wraith: 5,
    };
    const intervalMap = { skeleton: 920, mage: 1120, golem: 1420, wraith: 780 };
    const themeMap = { skeleton: 'bone', mage: 'shadow', golem: 'blood', wraith: 'shadow' };

    const key = animKeyMap[kind];
    if (!key || !this.textures.exists(key)) return false;
    if (!this.necroMinions) this.necroMinions = [];

    const existing = this.necroMinions.filter((m) => m.kind === kind);
    if (existing.length >= (capMap[kind] || 3)) {
      const oldest = existing[0];
      oldest.expiresAt = this.time.now + lifeMs;
      oldest.skillLvl = Math.max(oldest.skillLvl, skillLvl);
      this.necroVfx?.spawnSummonPoof(oldest.x, oldest.y, themeMap[kind]);
      return true;
    }

    const mx = Phaser.Math.Clamp(x, 80, MAP_W - 80);
    const my = Phaser.Math.Clamp(y, 80, MAP_H - 80);
    const shadow = this.add.ellipse(mx, my + 12, kind === 'golem' ? 56 : 36, kind === 'golem' ? 20 : 14, 0x050507, 0.52)
      .setDepth(Math.max(50, Math.round(my - 2)));
    const sp = this.add.sprite(mx, my - 10, key, 0)
      .setScale(scaleMap[kind])
      .setDepth(Math.max(120, Math.round(my + 10)));
    if (this.anims.exists(key)) sp.play(key);
    this.necroVfx?.spawnSummonPoof(mx, my, themeMap[kind]);

    this.necroMinions.push({
      kind,
      x: mx,
      y: my,
      sprite: sp,
      shadow,
      skillLvl,
      interval: intervalMap[kind],
      atkCd: 260 + Math.random() * 220,
      expiresAt: this.time.now + lifeMs,
      phase: Math.random() * 6.28,
      slamCount: 0,
      theme: themeMap[kind],
      homeOffX: Phaser.Math.Between(-95, 95),
      homeOffY: Phaser.Math.Between(-65, 65),
    });
    return true;
  }

  // v252: 每幀更新死靈法師地面屍體、磁吸鮮血球與 4 類動態亡靈隨從
  updateNecroBattlefieldEntities(delta) {
    const now = this.time.now;
    const dtSec = delta / 1000;

    // 1. 地面屍體過期清除
    if (this.necroCorpses && this.necroCorpses.length > 0) {
      for (let i = this.necroCorpses.length - 1; i >= 0; i--) {
        const c = this.necroCorpses[i];
        if (!c?.sprite?.active || now >= c.expiresAt) {
          if (c?.sprite?.active) c.sprite.destroy();
          this.necroCorpses.splice(i, 1);
        }
      }
    }

    // 2. 鮮血球磁吸拾取（回血＋回魂能＋疊加拉斯瑪層數）
    if (this.necroBloodOrbs && this.necroBloodOrbs.length > 0 && this.hero) {
      for (let i = this.necroBloodOrbs.length - 1; i >= 0; i--) {
        const orb = this.necroBloodOrbs[i];
        if (!orb?.sprite?.active || now >= orb.expiresAt) {
          if (orb?.sprite?.active) orb.sprite.destroy();
          this.necroBloodOrbs.splice(i, 1);
          continue;
        }
        orb.phase += dtSec * 5.0;
        const dist = Phaser.Math.Distance.Between(orb.x, orb.y, this.hero.x, this.hero.y);
        if (dist <= 250) {
          const ang = Phaser.Math.Angle.Between(orb.x, orb.y, this.hero.x, this.hero.y);
          orb.x += Math.cos(ang) * 340 * dtSec;
          orb.y += Math.sin(ang) * 340 * dtSec;
        }
        orb.sprite.setPosition(orb.x, orb.y - 6 + Math.sin(orb.phase) * 4);
        orb.sprite.setDepth(Math.max(118, Math.round(orb.y + 8)));
        if (dist <= 44) {
          orb.sprite.destroy();
          this.necroBloodOrbs.splice(i, 1);
          this.healHero(Math.round(this.playerMaxHp * 0.08));
          this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 10);
          this.necroBloodOrbStacks = Math.min(5, (this.necroBloodOrbStacks || 0) + 1);
          this.necroVfx?.spawnDebrisBurst(this.hero.x, this.hero.y - 8, 'blood', 4);
        }
      }
    }

    // 3. 4 類動態亡靈隨從自主追蹤、走位與攻擊
    if (this.necroMinions && this.necroMinions.length > 0) {
      const stats = this.getStats();
      const mult = this.getNecroD4LiveMult();
      const frenzied = now < (this.necroFrenzyUntil || 0);
      const atkSpdFactor = frenzied ? 0.65 : 1.0;

      for (let i = this.necroMinions.length - 1; i >= 0; i--) {
        const mn = this.necroMinions[i];
        if (!mn?.sprite?.active || now >= mn.expiresAt) {
          this.necroVfx?.spawnSummonPoof(mn.x, mn.y, mn.theme || 'shadow');
          if (mn?.sprite?.active) mn.sprite.destroy();
          if (mn?.shadow?.active) mn.shadow.destroy();
          this.necroMinions.splice(i, 1);
          continue;
        }
        mn.phase += dtSec * 4.2;
        const tgt = this.findNearestMonster(mn.x, mn.y, 680);
        const speedMap = { skeleton: 215, mage: 175, golem: 185, wraith: 285 };
        const desiredRange = mn.kind === 'mage' ? 210 : (mn.kind === 'golem' ? 58 : 48);

        if (tgt && tgt.sprite && tgt.hp > 0) {
          const dist = Phaser.Math.Distance.Between(mn.x, mn.y, tgt.sprite.x, tgt.sprite.y);
          const ang = Phaser.Math.Angle.Between(mn.x, mn.y, tgt.sprite.x, tgt.sprite.y);
          if (dist > desiredRange) {
            mn.x += Math.cos(ang) * speedMap[mn.kind] * dtSec;
            mn.y += Math.sin(ang) * speedMap[mn.kind] * dtSec;
          } else if (mn.kind === 'mage' && dist < 130) {
            mn.x -= Math.cos(ang) * 110 * dtSec;
            mn.y -= Math.sin(ang) * 110 * dtSec;
          }
          mn.sprite.setFlipX(tgt.sprite.x < mn.x);
        } else if (this.hero) {
          const hx = this.hero.x + mn.homeOffX;
          const hy = this.hero.y + mn.homeOffY;
          const distH = Phaser.Math.Distance.Between(mn.x, mn.y, hx, hy);
          if (distH > 40) {
            const angH = Phaser.Math.Angle.Between(mn.x, mn.y, hx, hy);
            mn.x += Math.cos(angH) * speedMap[mn.kind] * dtSec;
            mn.y += Math.sin(angH) * speedMap[mn.kind] * dtSec;
            mn.sprite.setFlipX(hx < mn.x);
          }
        }

        if (mn.shadow?.active) {
          mn.shadow.setPosition(mn.x, mn.y + 12);
          mn.shadow.setDepth(Math.max(50, Math.round(mn.y - 2)));
        }
        const bob = mn.kind === 'wraith' ? Math.sin(mn.phase * 1.4) * 6 : Math.sin(mn.phase) * 2.5;
        mn.sprite.setPosition(mn.x, mn.y - 12 + bob);
        mn.sprite.setDepth(Math.max(120, Math.round(mn.y + 10)));

        mn.atkCd -= delta;
        if (mn.atkCd <= 0 && tgt && tgt.sprite && tgt.hp > 0) {
          const hitDist = Phaser.Math.Distance.Between(mn.x, mn.y, tgt.sprite.x, tgt.sprite.y);
          if (hitDist <= desiredRange + 65) {
            mn.atkCd = mn.interval * atkSpdFactor;
            const baseDmg = Math.max(1, Math.round(stats.atk * (0.68 + mn.skillLvl * 0.11) * mult * (frenzied ? 1.30 : 1)));
            this.tweens.add({ targets: mn.sprite, scaleX: mn.sprite.scaleX * 1.16, scaleY: mn.sprite.scaleY * 1.16, duration: 85, yoyo: true });

            if (mn.kind === 'skeleton') {
              this.necroVfx?.playSeq16('seq16_n_bone_burst', tgt.sprite.x, tgt.sprite.y - 6, 0.44, 22, 14);
              this.necroVfx?.spawnDebrisBurst(tgt.sprite.x, tgt.sprite.y, 'bone', 4);
              this.damageMonster(tgt, baseDmg, false, false, '#e2e8f0', '💀骷髏 ', true);
            } else if (mn.kind === 'mage') {
              this.necroVfx?.playSeq16('seq16_n_soul_rift', tgt.sprite.x, tgt.sprite.y - 8, 0.48, 20, 14);
              this.damageMonster(tgt, Math.round(baseDmg * 1.12), false, false, '#c084fc', '🔮骸法 ', true);
              this.triggerNecroShadowHit(tgt, stats);
            } else if (mn.kind === 'golem') {
              mn.slamCount += 1;
              this.necroVfx?.playSeq16('seq16_n_blood_surge', tgt.sprite.x, tgt.sprite.y - 8, 0.72, 20, 16);
              this.necroVfx?.spawnGroundDecal('blood', tgt.sprite.x, tgt.sprite.y, 0.65, 1400);
              for (const m of [...this.monsters]) {
                if (m && m.hp > 0 && m.sprite && Phaser.Math.Distance.Between(tgt.sprite.x, tgt.sprite.y, m.sprite.x, m.sprite.y) <= 170) {
                  this.damageMonster(m, Math.round(baseDmg * 1.35), false, false, '#fb7185', '🩸魔像 ', true);
                }
              }
              if (mn.slamCount % 2 === 0) this.spawnNecroBloodOrb(tgt.sprite.x, tgt.sprite.y);
            } else if (mn.kind === 'wraith') {
              this.necroVfx?.playSeq16('seq16_n_blight_pool', tgt.sprite.x, tgt.sprite.y - 6, 0.46, 20, 14);
              this.damageMonster(tgt, Math.round(baseDmg * 1.18), true, false, '#5eead4', '👻怨靈 ', true);
              this.triggerNecroShadowHit(tgt, stats);
            }
          }
        }
      }
    }
  }

  // v252: 暗黑 4 死靈法師 24 招實戰判定幾何＋16 幀暗黑序列＋動態亡靈軍團（零震動、零音效）
  castNecroSkill(skillId, skillLvl, stats, isManual = false) {
    const _hx = this.hero.x, _hy = this.hero.y;
    const aim = this.getAimPoint(isManual, 440);
    const nearest = this.findNearestMonster(_hx, _hy);
    const _tx = isManual ? aim.x : (nearest ? nearest.sprite.x : aim.x);
    const _ty = isManual ? aim.y : (nearest ? nearest.sprite.y : aim.y);
    const _ang = Phaser.Math.Angle.Between(_hx, _hy, _tx, _ty);

    this.faceHeroToward(_tx, _ty);
    this.triggerHeroAttackAnim(380);
    if (this.anims.exists(`n_${this.heroDir}_atk`)) {
      this.hero.play(`n_${this.heroDir}_atk`, false);
    }

    const st = this.getState();
    const ks = st?.activeKeystone?.necro || '';
    const nv = this.necroVfx;
    const liveMult = (stats.skillDmgMult || 1) * this.getNecroD4LiveMult();
    const boneMult = (1 + (stats.boneDmgPct || 0) / 100) * (ks === 'nk_bone_tyrant' ? 1.25 : 1);

    const _hitOne = (m, mult, col, pre, stList = [], opts = {}) => {
      if (!m || m.hp <= 0 || !m.sprite) return false;
      const bonusCrit = opts.bonusCrit || 0;
      const isC = opts.forceCrit || (Math.random() * 100 < (stats.critRate + bonusCrit));
      const curseAmp = (this.time.now < (m.cursedUntil || 0)) ? 1.25 : 1.0;
      const d = Math.max(1, Math.round(stats.atk * mult * liveMult * curseAmp * (isC ? stats.critDmg / 100 : 1)));
      if (!m._statuses) m._statuses = {};
      stList.forEach((k) => {
        m._statuses[k] = Math.max(m._statuses[k] || 0, this.time.now + 5000);
        if (k === 'curse') m.cursedUntil = Math.max(m.cursedUntil || 0, this.time.now + 6000);
        if (k === 'chill' || k === 'slow') m.chilledUntil = Math.max(m.chilledUntil || 0, this.time.now + 3600);
        if (k === 'bleed') m.bleedUntil = Math.max(m.bleedUntil || 0, this.time.now + 5000);
      });
      this.damageMonster(m, d, isC, false, col, pre);
      if (opts.shadow) this.triggerNecroShadowHit(m, stats);
      return true;
    };

    const _aoe = (cx, cy, rad, mult, col, pre, stList = [], opts = {}) => {
      let hits = 0;
      for (const m of [...this.monsters]) {
        if (!m || m.hp <= 0 || !m.sprite) continue;
        if (Phaser.Math.Distance.Between(cx, cy, m.sprite.x, m.sprite.y) <= rad) {
          if (_hitOne(m, mult, col, pre, stList, opts)) hits += 1;
        }
      }
      return hits;
    };

    const _cone = (ox, oy, dirAng, halfArcRad, maxDist, mult, col, pre, stList = [], opts = {}) => {
      let hits = 0;
      for (const m of [...this.monsters]) {
        if (!m || m.hp <= 0 || !m.sprite) continue;
        const dist = Phaser.Math.Distance.Between(ox, oy, m.sprite.x, m.sprite.y);
        if (dist > maxDist) continue;
        const mAng = Phaser.Math.Angle.Between(ox, oy, m.sprite.x, m.sprite.y);
        const diff = Math.abs(Phaser.Math.Angle.Wrap(mAng - dirAng));
        if (diff <= halfArcRad || dist <= 48) {
          if (_hitOne(m, mult, col, pre, stList, opts)) hits += 1;
        }
      }
      return hits;
    };

    const _line = (ox, oy, dirAng, length, halfWidth, mult, col, pre, stList = [], opts = {}) => {
      const cosA = Math.cos(dirAng), sinA = Math.sin(dirAng);
      const hitList = [];
      for (const m of [...this.monsters]) {
        if (!m || m.hp <= 0 || !m.sprite) continue;
        const dx = m.sprite.x - ox, dy = m.sprite.y - oy;
        const proj = dx * cosA + dy * sinA;
        if (proj < -20 || proj > length) continue;
        const perp = Math.abs(-dx * sinA + dy * cosA);
        if (perp <= halfWidth) {
          if (_hitOne(m, mult, col, pre, stList, opts)) hitList.push(m);
        }
      }
      return hitList;
    };

    // ===================== [1] 基礎產能 =====================
    if (skillId === 'n_reap_scythe') {
      // 125° 前方鐮刀扇形掃擊＋必定產出 1 具地面屍體
      const sx = _hx + Math.cos(_ang) * 95;
      const sy = _hy + Math.sin(_ang) * 95;
      nv?.playSeq16('seq16_n_soul_rift', sx, sy - 8, 0.78, 22, 14);
      nv?.spawnDebrisBurst(sx, sy, 'shadow', 6);
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 20);
      const hits = _cone(_hx, _hy, _ang, 1.09, 235, (1.48 + skillLvl * 0.22), '#5eead4', '💀收割 ', ['curse'], { shadow: true });
      if (hits > 0 || nearest) this.spawnNecroCorpse(_tx, _ty);
      return;
    }

    if (skillId === 'n_bone_splinters') {
      // 125° 扇形三枚碎骨貫穿飛矛
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 18);
      [-0.24, 0, 0.24].forEach((off) => {
        const a = _ang + off;
        const ex = _hx + Math.cos(a) * 340;
        const ey = _hy + Math.sin(a) * 340;
        nv?.launchSpear('proj_n_bone_spear', _hx, _hy - 12, ex, ey, 0.44, 175, 'bone', () => {
          nv?.spawnDebrisBurst(ex, ey, 'bone', 4);
        });
        _line(_hx, _hy, a, 350, 44, (0.78 + skillLvl * 0.13) * boneMult, '#e2e8f0', '🦴碎骨 ', ['vulnerable'], { bonusCrit: 12 });
      });
      return;
    }

    if (skillId === 'n_hemorrhage') {
      // 單體鎖定鮮血汲取＋50% 機率掉落磁吸鮮血球
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 18);
      const target = nearest;
      const bx = target ? target.sprite.x : _tx;
      const by = target ? target.sprite.y : _ty;
      nv?.playSeq16('seq16_n_blood_surge', bx, by - 8, 0.62, 22, 14);
      nv?.spawnGroundDecal('blood', bx, by, 0.52, 1400);
      if (target) {
        _hitOne(target, (1.62 + skillLvl * 0.24), '#fb7185', '🩸血湧汲 ', ['bleed']);
        if (Math.random() < 0.55) this.spawnNecroBloodOrb(bx, by);
      }
      return;
    }

    if (skillId === 'n_decompose') {
      // 單體腐化鎖定（2 段持續傷害＋必生屍體＋觸發暗影枯萎）
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 22);
      const target = nearest;
      const dx = target ? target.sprite.x : _tx;
      const dy = target ? target.sprite.y : _ty;
      nv?.playSeq16('seq16_n_blight_pool', dx, dy - 6, 0.66, 16, 14);
      nv?.spawnGroundDecal('plague', dx, dy, 0.58, 1600);
      if (target) {
        _hitOne(target, (1.05 + skillLvl * 0.17), '#c084fc', '☠️分解 ', ['curse', 'vulnerable'], { shadow: true });
        this.time.delayedCall(280, () => {
          if (target.hp > 0) _hitOne(target, (1.05 + skillLvl * 0.17), '#c084fc', '☠️腐蝕 ', ['curse'], { shadow: true });
          this.spawnNecroCorpse(dx, dy);
        });
      }
      return;
    }

    // ===================== [2] 核心輸出 =====================
    if (skillId === 'bone_spear') {
      // 560px 直線貫穿長矛＋末端 3 枚折返碎骨彈射
      const ex = _hx + Math.cos(_ang) * 520;
      const ey = _hy + Math.sin(_ang) * 520;
      const spearBonus = stats.activeEffects?.has('bone_pierce') ? 1.30 : 1.0;
      nv?.launchSpear('proj_n_bone_spear', _hx, _hy - 14, ex, ey, 0.72, 200, 'bone', () => {
        nv?.playSeq16('seq16_n_bone_burst', ex, ey - 8, 0.92, 20, 16);
        nv?.spawnGroundDecal('bone', ex, ey, 0.78, 1800);
        nv?.spawnDebrisBurst(ex, ey, 'bone', 8);
        // 3 枚折返碎骨回擊路徑敵人
        [-0.26, 0, 0.26].forEach((off) => {
          const backAng = _ang + Math.PI + off;
          const rx = ex + Math.cos(backAng) * 280;
          const ry = ey + Math.sin(backAng) * 280;
          nv?.launchSpear('proj_n_bone_spear', ex, ey - 10, rx, ry, 0.42, 160, 'bone');
          _line(ex, ey, backAng, 290, 48, (0.95 + skillLvl * 0.16) * boneMult, '#f1f5f9', '🦴折返 ', ['vulnerable'], { bonusCrit: ks === 'nk_bone_tyrant' ? 100 : 25 });
        });
      });
      _line(_hx, _hy, _ang, 540, 56, (2.25 + skillLvl * 0.36) * boneMult * spearBonus, '#e2e8f0', '🦴骨矛 ', ['vulnerable'], { bonusCrit: ks === 'nk_bone_tyrant' ? 100 : 25 });
      return;
    }

    if (skillId === 'n_blood_surge') {
      // 二段式鮮血新星＋消耗 3 層鮮血球觸發拉斯瑪壓制暴擊
      const overpower = (this.necroBloodOrbStacks || 0) >= 3 || ks === 'nk_rathma_vigor';
      if (this.necroBloodOrbStacks >= 3) this.necroBloodOrbStacks -= 3;
      nv?.playSeq16('seq16_n_blood_surge', _hx, _hy - 10, overpower ? 1.38 : 1.15, 20, 18);
      nv?.spawnGroundDecal('blood', _hx, _hy, 0.96, 1800);
      nv?.spawnDebrisBurst(_hx, _hy, 'blood', overpower ? 10 : 6);
      this.healHero(Math.round(this.playerMaxHp * (overpower ? 0.26 : 0.18)));
      _aoe(_hx, _hy, 305, (2.45 + skillLvl * 0.38) * (overpower ? 1.48 : 1.0), '#fb7185', overpower ? '🩸壓制血湧 ' : '🩸血湧 ', ['bleed'], { forceCrit: overpower });
      return;
    }

    if (skillId === 'n_blood_lance') {
      // 540px 直線貫穿鮮血長矛＋全場「穿刺連動共鳴」＋掉落鮮血球
      const ex = _hx + Math.cos(_ang) * 510;
      const ey = _hy + Math.sin(_ang) * 510;
      nv?.launchSpear('proj_n_blood_lance', _hx, _hy - 12, ex, ey, 0.72, 195, 'blood', () => {
        nv?.spawnDebrisBurst(ex, ey, 'blood', 7);
        this.spawnNecroBloodOrb(ex, ey);
      });
      const hitList = _line(_hx, _hy, _ang, 530, 52, (2.05 + skillLvl * 0.34), '#f43f5e', '🩸血矛 ', ['bleed']);
      hitList.forEach((m) => { m.bloodLancedUntil = this.time.now + 5500; });
      // 觸發全場已穿刺敵人共鳴血爆
      for (const m of [...this.monsters]) {
        if (m && m.hp > 0 && m.sprite && this.time.now < (m.bloodLancedUntil || 0)) {
          nv?.playSeq16('seq16_n_blood_surge', m.sprite.x, m.sprite.y - 6, 0.54, 24, 14);
          _hitOne(m, (1.10 + skillLvl * 0.18), '#fda4af', '🩸共鳴 ', ['bleed']);
        }
      }
      return;
    }

    if (skillId === 'n_sever') {
      // 幽魂死神直線衝刺斬擊＋回旋暗影收割
      const ex = _hx + Math.cos(_ang) * 380;
      const ey = _hy + Math.sin(_ang) * 380;
      nv?.playSeq16('seq16_n_soul_rift', (_hx + ex) / 2, (_hy + ey) / 2 - 8, 1.05, 20, 16);
      nv?.spawnGroundDecal('rift', ex, ey, 0.78, 1700);
      nv?.spawnDebrisBurst(ex, ey, 'shadow', 7);
      _line(_hx, _hy, _ang, 410, 66, (2.15 + skillLvl * 0.34), '#2dd4bf', '👻斬裂 ', ['curse', 'vulnerable'], { shadow: true });
      this.time.delayedCall(220, () => {
        nv?.playSeq16('seq16_n_soul_rift', ex, ey - 8, 0.88, 22, 16);
        _aoe(ex, ey, 175, (1.35 + skillLvl * 0.22), '#c084fc', '👻回旋 ', ['curse'], { shadow: true });
      });
      return;
    }

    // ===================== [3] 屍骸與防禦 =====================
    if (skillId === 'n_blood_mist') {
      // 2.0 秒真正無敵血霧形態＋路徑殘留屍體＋3 段血霧脈衝
      this.heroInvulnUntil = Math.max(this.heroInvulnUntil || 0, this.time.now + 2000);
      this.healHero(Math.round(this.playerMaxHp * 0.16));
      if (this.hero) {
        this.hero.setTint(0xef4444).setAlpha(0.55);
        this.time.delayedCall(2000, () => {
          if (this.hero?.active) this.hero.clearTint().setAlpha(1);
        });
      }
      this.spawnFloatingText(_hx, _hy - 78, '🩸 血霧無敵 2.0s', '#fb7185', 14);
      for (let w = 0; w < 3; w++) {
        this.time.delayedCall(w * 520, () => {
          if (!this.hero?.active || this.isTransitioning) return;
          nv?.playSeq16('seq16_n_blood_surge', this.hero.x, this.hero.y - 6, 0.86, 20, 14);
          nv?.spawnGroundDecal('blood', this.hero.x, this.hero.y, 0.72, 1600);
          _aoe(this.hero.x, this.hero.y, 215, (1.25 + skillLvl * 0.20), '#fb7185', '🩸血霧 ', ['bleed']);
          if (w < 2) this.spawnNecroCorpse(this.hero.x, this.hero.y);
        });
      }
      return;
    }

    if (skillId === 'n_bone_shield') {
      // 白骨護盾屏障＋周身骨刺爆裂新星
      const shieldAmt = Math.round(this.playerMaxHp * (0.30 + skillLvl * 0.025));
      if (typeof this.grantHeroBarrier === 'function') this.grantHeroBarrier(shieldAmt, 5500);
      this.healHero(Math.round(this.playerMaxHp * 0.15));
      nv?.playSeq16('seq16_n_bone_burst', _hx, _hy - 10, 1.15, 18, 16);
      nv?.spawnGroundDecal('bone', _hx, _hy, 0.92, 1800);
      nv?.spawnDebrisBurst(_hx, _hy, 'bone', 8);
      _aoe(_hx, _hy, 275, (1.90 + skillLvl * 0.28) * boneMult, '#e2e8f0', '🦴骨盾 ', ['vulnerable']);
      return;
    }

    if (skillId === 'bone_prison') {
      // 圓環骨牢困敵（235px 定身減速＋4 段穿刺脈衝）
      nv?.playSeq16('seq16_n_bone_burst', _tx, _ty - 6, 1.24, 16, 16);
      nv?.spawnGroundDecal('bone', _tx, _ty, 1.05, 2400);
      for (let w = 0; w < 4; w++) {
        this.time.delayedCall(w * 540, () => {
          if (this.isTransitioning) return;
          if (w > 0) nv?.playSeq16('seq16_n_bone_burst', _tx, _ty - 6, 0.90, 20, 14);
          _aoe(_tx, _ty, 235, (0.92 + skillLvl * 0.16) * boneMult, '#e2e8f0', '🦴骨牢 ', ['chill', 'curse', 'vulnerable']);
        });
      }
      return;
    }

    if (skillId === 'corpse_explosion') {
      // 消耗真實地面屍體爆破（有屍體傷害 ×1.35 且範圍擴大）
      const spot = this.consumeNearestNecroCorpse(_tx, _ty, 460, true);
      const rad = (spot.consumed ? 275 : 225) * (1 + (stats.corpseRadiusPct || 0) / 100);
      nv?.playSeq16('seq16_n_corpse_boom', spot.x, spot.y - 10, spot.consumed ? 1.28 : 1.05, 20, 18);
      nv?.spawnGroundDecal('plague', spot.x, spot.y, 0.95, 2000);
      nv?.spawnDebrisBurst(spot.x, spot.y, 'blood', 9);
      const mult = (2.45 + skillLvl * 0.42) * (spot.consumed ? 1.35 : 1.0);
      _aoe(spot.x, spot.y, rad, mult, '#fb7185', spot.consumed ? '💥屍爆 ' : '💥爆裂 ', ['bleed', 'curse'], { shadow: ks === 'nk_plague_sea' });
      return;
    }

    // ===================== [4] 詛咒與控場 =====================
    if (skillId === 'decrepify') {
      // 衰老詛咒法陣（320px 減速＋易傷＋每命中減冷卻）
      nv?.playSeq16('seq16_n_blight_pool', _tx, _ty - 6, 1.25, 16, 14);
      nv?.spawnGroundDecal('plague', _tx, _ty, 1.05, 2200);
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 18);
      const hits = _aoe(_tx, _ty, 320, (1.45 + skillLvl * 0.24), '#a78bfa', '🔮衰老 ', ['curse', 'chill'], { shadow: true });
      if (hits > 0) {
        const cdrMs = Math.min(2400, hits * 420);
        this.slotCdTimers = this.slotCdTimers.map((t) => t + cdrMs);
      }
      return;
    }

    if (skillId === 'n_iron_maiden') {
      // 鋼鐵處女詛咒（320px 群體回魂能＋流血反傷印記）
      nv?.playSeq16('seq16_n_blood_surge', _tx, _ty - 6, 1.12, 18, 14);
      nv?.spawnGroundDecal('blood', _tx, _ty, 0.98, 2200);
      const hits = _aoe(_tx, _ty, 320, (1.65 + skillLvl * 0.26), '#fda4af', '🩸鐵處女 ', ['curse', 'bleed']);
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + Math.min(36, 12 + hits * 6));
      return;
    }

    if (skillId === 'n_corpse_tendrils') {
      // 屍體觸鬚漩渦強拉聚怪（不消耗屍體，340px 全部拉至屍體中心＋易傷定身）
      const spot = this.consumeNearestNecroCorpse(_tx, _ty, 460, false);
      nv?.playSeq16('seq16_n_tendrils', spot.x, spot.y - 8, 1.32, 18, 18);
      nv?.spawnGroundDecal('blood', spot.x, spot.y, 1.05, 2200);
      nv?.spawnDebrisBurst(spot.x, spot.y, 'blood', 8);
      for (const m of [...this.monsters]) {
        if (!m || m.hp <= 0 || !m.sprite) continue;
        if (Phaser.Math.Distance.Between(spot.x, spot.y, m.sprite.x, m.sprite.y) <= 345) {
          const nx = spot.x + Phaser.Math.Between(-28, 28);
          const ny = spot.y + Phaser.Math.Between(-22, 22);
          this.tweens.add({ targets: m.sprite, x: nx, y: ny, duration: 240, ease: 'Cubic.easeOut' });
        }
      }
      _aoe(spot.x, spot.y, 345, (1.95 + skillLvl * 0.30), '#fb7185', '🩸觸鬚聚怪 ', ['vulnerable', 'chill', 'bleed']);
      return;
    }

    if (skillId === 'n_blight_pool') {
      // 枯萎腐沼（3 段持續暗影腐蝕池，連觸暗影枯萎）
      nv?.spawnGroundDecal('plague', _tx, _ty, 1.08, 2400);
      for (let w = 0; w < 3; w++) {
        this.time.delayedCall(w * 340, () => {
          if (this.isTransitioning) return;
          nv?.playSeq16('seq16_n_blight_pool', _tx, _ty - 6, 1.15, 14, 14);
          nv?.spawnDebrisBurst(_tx, _ty, 'shadow', 5);
          _aoe(_tx, _ty, 275, (1.35 + skillLvl * 0.22), '#a855f7', '☠️枯萎 ', ['poison', 'curse'], { shadow: true });
        });
      }
      return;
    }

    // ===================== [E] 亡靈召喚軍團 =====================
    if (skillId === 'raise_skeleton') {
      // 召喚 2 名動態骷髏戰士＋1 名骸骨法師（若已獻祭則改為孤狼骨爆＋回魔）
      let spawned = 0;
      if (this.spawnNecroMinion('skeleton', _hx + Phaser.Math.Between(-75, 75), _hy + Phaser.Math.Between(-50, 50), skillLvl, 22000)) spawned += 1;
      if (this.spawnNecroMinion('skeleton', _hx + Phaser.Math.Between(-75, 75), _hy + Phaser.Math.Between(-50, 50), skillLvl, 22000)) spawned += 1;
      if (this.spawnNecroMinion('mage', _hx + Phaser.Math.Between(-90, 90), _hy + Phaser.Math.Between(-60, 60), skillLvl, 22000)) spawned += 1;
      if (spawned === 0) {
        nv?.playSeq16('seq16_n_bone_burst', _hx, _hy - 8, 1.18, 20, 16);
        this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 26);
        _aoe(_hx, _hy, 270, (2.10 + skillLvl * 0.30) * boneMult, '#e2e8f0', '🦴獻祭骨爆 ', ['vulnerable']);
      } else {
        this.spawnFloatingText(_hx, _hy - 78, `💀 亡靈喚醒 +${spawned}`, '#5eead4', 13);
      }
      return;
    }

    if (skillId === 'blood_golem') {
      // 召喚／指令猛擊 4 幀動態鮮血魔像＋掉落 2 顆鮮血球（若已獻祭則改為鮮血衝擊波）
      const ok = this.spawnNecroMinion('golem', _tx, _ty, skillLvl, 24000);
      nv?.playSeq16('seq16_n_blood_surge', _tx, _ty - 10, 1.18, 18, 18);
      nv?.spawnGroundDecal('blood', _tx, _ty, 0.96, 1800);
      _aoe(_tx, _ty, 240, (2.15 + skillLvl * 0.34) * (ok ? 1.0 : 1.35), '#fb7185', ok ? '🩸魔像猛擊 ' : '🩸獻祭血爆 ', ['bleed', 'vulnerable']);
      this.spawnNecroBloodOrb(_tx - 24, _ty);
      this.spawnNecroBloodOrb(_tx + 24, _ty);
      return;
    }

    if (skillId === 'undead_frenzy') {
      // 亡靈狂熱（全軍團 6 秒攻速＋50%、續命＋5 秒、英雄回血回魂能）
      this.necroFrenzyUntil = this.time.now + 6000;
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 26);
      this.healHero(Math.round(this.playerMaxHp * 0.14));
      nv?.playSeq16('seq16_n_soul_rift', _hx, _hy - 10, 1.12, 18, 16);
      (this.necroMinions || []).forEach((mn) => { mn.expiresAt += 5000; });
      this.spawnFloatingText(_hx, _hy - 84, '💀 亡靈狂熱 6s！', '#5eead4', 15);
      return;
    }

    if (skillId === 'wraith_army') {
      // 召喚 4 隻 4 幀動態怨靈自主穿刺敵群
      const count = 3 + (skillLvl >= 4 ? 1 : 0);
      nv?.playSeq16('seq16_n_soul_rift', _hx, _hy - 10, 1.05, 18, 16);
      for (let i = 0; i < count; i++) {
        this.spawnNecroMinion('wraith', _hx + Phaser.Math.Between(-85, 85), _hy + Phaser.Math.Between(-60, 60), skillLvl, 10000);
      }
      _aoe(_tx, _ty, 250, (1.85 + skillLvl * 0.28), '#5eead4', '👻怨靈出擊 ', ['curse'], { shadow: true });
      return;
    }

    // ===================== [R] 終極奧義 =====================
    if (skillId === 'n_army_scourge') {
      // 亡者大軍（5 波交錯自爆骷髏屍爆＋生出 3 具屍體＋2 隻怨靈）
      nv?.spawnGroundDecal('rift', _tx, _ty, 1.25, 2800);
      this.spawnNecroMinion('wraith', _tx - 40, _ty, skillLvl, 11000);
      this.spawnNecroMinion('wraith', _tx + 40, _ty, skillLvl, 11000);
      for (let w = 0; w < 5; w++) {
        this.time.delayedCall(w * 260, () => {
          if (this.isTransitioning) return;
          const bx = _tx + Phaser.Math.Between(-110, 110);
          const by = _ty + Phaser.Math.Between(-75, 75);
          nv?.playSeq16(w % 2 === 0 ? 'seq16_n_corpse_boom' : 'seq16_n_soul_rift', bx, by - 8, 1.22, 18, 18);
          nv?.spawnDebrisBurst(bx, by, 'shadow', 7);
          _aoe(bx, by, 260, (1.85 + skillLvl * 0.30), '#2dd4bf', '☠️亡者大軍 ', ['curse', 'poison'], { forceCrit: true, shadow: true });
          if (w < 3) this.spawnNecroCorpse(bx, by);
        });
      }
      return;
    }

    if (skillId === 'n_blood_wave') {
      // 鮮血巨浪（3 段 480px 前推擊退巨浪＋殘留 3 顆磁吸鮮血球）
      for (let w = 0; w < 3; w++) {
        this.time.delayedCall(w * 240, () => {
          if (this.isTransitioning) return;
          const dist = 140 + w * 145;
          const wx = _hx + Math.cos(_ang) * dist;
          const wy = _hy + Math.sin(_ang) * dist;
          nv?.playSeq16('seq16_n_blood_wave', wx, wy - 10, 1.38, 18, 18);
          nv?.spawnGroundDecal('blood', wx, wy, 1.08, 2200);
          nv?.spawnDebrisBurst(wx, wy, 'blood', 8);
          this.spawnNecroBloodOrb(wx, wy);
          for (const m of [...this.monsters]) {
            if (!m || m.hp <= 0 || !m.sprite) continue;
            if (Phaser.Math.Distance.Between(wx, wy, m.sprite.x, m.sprite.y) <= 235) {
              const kx = Phaser.Math.Clamp(m.sprite.x + Math.cos(_ang) * 115, 80, MAP_W - 80);
              const ky = Phaser.Math.Clamp(m.sprite.y + Math.sin(_ang) * 115, 80, MAP_H - 80);
              this.tweens.add({ targets: m.sprite, x: kx, y: ky, duration: 220, ease: 'Quad.easeOut' });
              _hitOne(m, (2.15 + skillLvl * 0.34), '#f43f5e', '🌊血浪 ', ['bleed', 'chill'], { forceCrit: true });
            }
          }
        });
      }
      return;
    }

    if (skillId === 'n_bone_storm') {
      // 白骨風暴（周身 5 段高暴擊白骨漩渦＋護盾屏障）
      this.necroBoneStormUntil = this.time.now + 2600;
      if (typeof this.grantHeroBarrier === 'function') {
        this.grantHeroBarrier(Math.round(this.playerMaxHp * 0.28), 4500);
      }
      for (let w = 0; w < 5; w++) {
        this.time.delayedCall(w * 420, () => {
          if (!this.hero?.active || this.isTransitioning) return;
          nv?.playSeq16('seq16_n_bone_storm', this.hero.x, this.hero.y - 10, 1.36, 16, 18);
          nv?.spawnGroundDecal('bone', this.hero.x, this.hero.y, 1.05, 1800);
          nv?.spawnDebrisBurst(this.hero.x, this.hero.y, 'bone', 7);
          _aoe(this.hero.x, this.hero.y, 345, (1.80 + skillLvl * 0.30) * boneMult, '#e2e8f0', '🦴骨風暴 ', ['vulnerable', 'bleed'], { forceCrit: true });
        });
      }
      return;
    }

    if (skillId === 'n_soul_rift') {
      // 靈魂裂隙（4 段深淵裂縫吸收魂能＋持續觸發暗影枯萎）
      nv?.spawnGroundDecal('rift', _tx, _ty, 1.24, 2600);
      for (let w = 0; w < 4; w++) {
        this.time.delayedCall(w * 360, () => {
          if (this.isTransitioning) return;
          nv?.playSeq16('seq16_n_soul_rift', _tx, _ty - 10, 1.36, 16, 18);
          nv?.spawnDebrisBurst(_tx, _ty, 'shadow', 7);
          this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 12);
          _aoe(_tx, _ty, 330, (1.95 + skillLvl * 0.32), '#2dd4bf', '🔮靈魂裂隙 ', ['curse', 'vulnerable'], { forceCrit: w === 3, shadow: true });
        });
      }
      return;
    }
  }


  castAssassinSkill(skillId, skillLvl, stats, isManual = false) {
    const _hx = this.hero.x, _hy = this.hero.y;
    const _n = this.findNearestMonster(_hx, _hy);
    const _tx = _n ? _n.sprite.x : _hx + 90, _ty = _n ? _n.sprite.y : _hy;
    const _aoe = (cx, cy, rad, mult, col, pre, stList = [], forceCrit = false) => {
      for (const m of [...this.monsters]) {
        if (!m || m.hp <= 0) continue;
        if (Phaser.Math.Distance.Between(cx, cy, m.sprite.x, m.sprite.y) <= rad) {
          const isC = forceCrit || (Math.random() * 100 < stats.critRate);
          const d = Math.round(stats.atk * mult * (isC ? stats.critDmg / 100 : 1));
          if (!m._statuses) m._statuses = {};
          stList.forEach((k) => { m._statuses[k] = Math.max(m._statuses[k] || 0, this.time.now + 4800); });
          this.damageMonster(m, d, isC, false, col, pre);
        }
      }
    };
    if (skillId === 'a_twin_fang') {
      this.playAdditiveVfx('vfx_a_backstab_pierce', _tx, _ty - 10, 0.78, 320);
      this._aShadowStars = Math.min(5, (this._aShadowStars || 0) + 2);
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 18);
      _aoe(_tx, _ty, 210, (150 + skillLvl * 24) / 100, '#c084fc', '🗡️', ['bleed']);
      return;
    }
    if (skillId === 'a_boomerang_blades') {
      for (let w = 0; w < 2; w++) {
        this.time.delayedCall(w * 260, () => {
          this.playAdditiveVfx('vfx_a_boomerang', _tx, _ty - 8, 0.92, 380);
          _aoe(_tx, _ty, 240, (145 + skillLvl * 26) / 100, '#d8b4fe', '🌀', ['vulnerable', 'bleed']);
        });
      }
      return;
    }
    if (skillId === 'a_shadow_backstab') {
      this.playAdditiveVfx('vfx_a_backstab_pierce', _tx, _ty - 12, 1.02, 380);
      _aoe(_tx, _ty, 210, (275 + skillLvl * 42) / 100, '#f43f5e', '🩸背刺 ', ['vulnerable', 'bleed'], true);
      this.slotCdTimers = this.slotCdTimers.map((t) => t + 1000);
      return;
    }
    if (skillId === 'a_crimson_mist') {
      for (let w = 0; w < 3; w++) {
        this.time.delayedCall(w * 280, () => {
          this.playAdditiveVfx('vfx_a_crimson_mist', _tx, _ty, 0.96, 440);
          _aoe(_tx, _ty, 250, (120 + skillLvl * 20) / 100, '#4ade80', '☠️毒霧 ', ['poison', 'burn']);
        });
      }
      return;
    }
    if (skillId === 'a_death_lotus') {
      for (let w = 0; w < 3; w++) {
        this.time.delayedCall(w * 220, () => {
          this.playAdditiveVfx('vfx_a_boomerang', _hx, _hy, 1.05, 360);
          _aoe(_hx, _hy, 280, (130 + skillLvl * 22) / 100, '#e879f9', '🌸蓮華 ', ['bleed']);
        });
      }
      return;
    }
    if (skillId === 'a_venom_imbue') {
      this.playAdditiveVfx('vfx_a_crimson_mist', _hx, _hy, 0.95, 420);
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 20);
      _aoe(_hx, _hy, 290, (210 + skillLvl * 34) / 100, '#4ade80', '🧪淬毒 ', ['poison', 'vulnerable']);
      return;
    }
    if (skillId === 'a_thousand_shadows') {
      for (let w = 0; w < 5; w++) {
        this.time.delayedCall(w * 220, () => {
          this.playAdditiveVfx('vfx_a_bloodmoon_array', _tx, _ty - 10, 1.15, 460);
          _aoe(_tx, _ty, 340, (145 + skillLvl * 26) / 100, '#f43f5e', '🌙千影 ', ['bleed', 'vulnerable'], true);
        });
      }
      return;
    }
    if (skillId === 'a_crimson_eclipse') {
      this.playAdditiveVfx('vfx_a_fivestar_slash', _tx, _ty - 14, 1.32, 620);
      _aoe(_tx, _ty, 350, (390 + skillLvl * 58) / 100, '#e879f9', '⭐血月絕殺 ', ['bleed', 'vulnerable', 'poison'], true);
      return;
    }
    const alive = this.monsters.filter((m) => m.hp > 0);
    if (alive.length === 0) return;
    const tree = this.getState().skillTree || {};
    const aim = this.getAimPoint(isManual, 380);
    this.faceHeroToward(aim.x, aim.y);
    this.triggerHeroAttackAnim(360);
    this.hero.play(`a_${this.heroDir}_atk`, false);

    const dmgMult = stats.skillDmgMult || 1;
    const poisonMult = 1 + (stats.poisonDmgPct || 0) / 100;
    const keyVenom = (tree.a_key_venom || 0) > 0;
    const poisonDur = stats.activeEffects.has('venom_core') ? 6000 : 4000;

    const applyPoison = (mob) => {
      if (!mob) return;
      mob.bleedUntil = Math.max(mob.bleedUntil || 0, this.time.now + poisonDur);
      mob.bleedDmg = Math.max(3, Math.round(stats.atk * 0.35 * poisonMult * (keyVenom ? 1.6 : 1)));
      mob.poisonedUntil = Math.max(mob.poisonedUntil || 0, this.time.now + poisonDur);
    };

    if (skillId === 'shadow_blitz') {
      const ang = Math.atan2(aim.y - this.hero.y, aim.x - this.hero.x);
      this.playFxSprite('afx_dash', this.hero.x, this.hero.y - 10, 0.9, ang, 280);
      const tx = Phaser.Math.Clamp(aim.x - Math.cos(ang) * 40, 180, MAP_W - 180);
      const ty = Phaser.Math.Clamp(aim.y - Math.sin(ang) * 40, 220, MAP_H - 180);
      this.hero.setPosition(tx, ty);
      this.playFxSprite('afx_slash', aim.x, aim.y - 10, 1.15, ang, 320);
      this.dodgeBuffUntil = Math.max(this.dodgeBuffUntil || 0, this.time.now + 2500);
      const mult = (1.75 + skillLvl * 0.32) * dmgMult;
      let hits = 0;
      for (const m of alive) {
        if (Phaser.Math.Distance.Between(aim.x, aim.y, m.sprite.x, m.sprite.y) <= 185) {
          const isCrit = Math.random() * 100 < (stats.critRate + 25);
          const dmg = Math.max(1, Math.round(stats.atk * mult * (isCrit ? stats.critDmg / 100 : 1)));
          this.damageMonster(m, dmg, isCrit, false, '#d8b4fe', '⚡');
          hits++;
        }
      }
      if ((tree.a_mod_leech || 0) > 0 && hits > 0) this.healHero(Math.round(this.playerMaxHp * 0.10));
      return;
    }

    if (skillId === 'shadow_clones') {
      const count = 2 + (skillLvl >= 4 ? 1 : 0) + ((tree.a_mod_phantom || 0) > 0 ? 1 : 0) + (stats.activeEffects.has('extra_clone') ? 1 : 0);
      const mult = (1.20 + skillLvl * 0.24) * dmgMult;
      const forceCrit = (tree.a_mod_phantom || 0) > 0;
      for (let i = 0; i < count; i++) {
        const tgt = alive[i % alive.length];
        const cx = tgt.sprite.x + Phaser.Math.Between(-50, 50);
        const cy = tgt.sprite.y + Phaser.Math.Between(-35, 35);
        const clone = this.add.image(cx, cy, 'atlas_assassin', 'af_down_atk_2').setScale(0.54).setTint(0xc084fc).setAlpha(0.85).setDepth(cy);
        this.playFxSprite('afx_slash', tgt.sprite.x, tgt.sprite.y - 10, 0.95, Math.random() * Math.PI, 280);
        const isCrit = forceCrit || Math.random() * 100 < stats.critRate;
        const dmg = Math.max(1, Math.round(stats.atk * mult * (isCrit ? stats.critDmg / 100 : 1)));
        this.damageMonster(tgt, dmg, isCrit, false, '#c084fc', '👥');
        this.tweens.add({ targets: clone, alpha: 0, duration: 480, onComplete: () => clone.destroy() });
      }
      return;
    }

    if (skillId === 'blade_flurry') {
      const mult = (0.82 + skillLvl * 0.18) * dmgMult;
      for (let w = 0; w < 3; w++) {
        this.time.delayedCall(w * 240, () => {
          if (this.isTransitioning || !this.hero) return;
          this.playFxSprite('afx_flurry', this.hero.x, this.hero.y - 6, 1.35, w * 0.8, 320);
          let hits = 0;
          for (const m of this.monsters) {
            if (m.hp > 0 && Phaser.Math.Distance.Between(this.hero.x, this.hero.y, m.sprite.x, m.sprite.y) <= 240) {
              const isCrit = Math.random() * 100 < stats.critRate;
              const dmg = Math.max(1, Math.round(stats.atk * mult * (isCrit ? stats.critDmg / 100 : 1)));
              this.damageMonster(m, dmg, isCrit, false, '#e9d5ff', '🌀');
              hits++;
            }
          }
          if (hits > 0) this.playerMp = Math.min(this.playerMaxMp, this.playerMp + hits * 3);
        });
      }
      return;
    }

    if (skillId === 'shadow_execute') {
      this.playFxSprite('afx_execute', aim.x, aim.y - 10, 1.5, 0, 520);
      if (window.__gameSettings?.graphics?.screenShake !== false) this.cameras.main.shake(170, 0.009);
      const mult = (2.50 + skillLvl * 0.45) * dmgMult;
      for (const m of alive) {
        if (Phaser.Math.Distance.Between(aim.x, aim.y, m.sprite.x, m.sprite.y) <= 250) {
          const lowHp = m.hp / m.maxHp < 0.50;
          const isCrit = lowHp || Math.random() * 100 < stats.critRate;
          const dmg = Math.max(1, Math.round(stats.atk * mult * (lowHp ? 1.55 : 1) * (isCrit ? stats.critDmg / 100 : 1)));
          this.damageMonster(m, dmg, isCrit, false, '#f0abfc', '⚔️絕殺 ');
        }
      }
      return;
    }

    if (skillId === 'poison_kunai') {
      const baseAng = Math.atan2(aim.y - this.hero.y, aim.x - this.hero.x);
      const count = (tree.a_mod_fan || 0) > 0 ? 7 : 5;
      const spread = 0.65;
      for (let i = 0; i < count; i++) {
        const off = -spread / 2 + (spread * i) / (count - 1);
        const ang = baseAng + off;
        const spr = this.add.image(this.hero.x, this.hero.y - 12, 'afx_kunai')
          .setScale(0.38).setRotation(ang).setBlendMode(Phaser.BlendModes.ADD).setDepth(4510);
        this.projectiles.push({
          fromEnemy: false, kind: 'pierce_arrow', sprite: spr,
          vx: Math.cos(ang) * 780, vy: Math.sin(ang) * 780,
          lifeMs: 900, pierceLeft: 2, dmgMult: (0.88 + skillLvl * 0.18) * dmgMult * poisonMult,
          appliesMark: false, hitIds: new Set(), stats,
        });
      }
      for (const m of alive) {
        if (Phaser.Math.Distance.Between(aim.x, aim.y, m.sprite.x, m.sprite.y) <= 200) applyPoison(m);
      }
      return;
    }

    if (skillId === 'smoke_veil') {
      this.playFxSprite('afx_smoke', this.hero.x, this.hero.y, 1.45, 0, 540);
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 25);
      this.dodgeBuffUntil = Math.max(this.dodgeBuffUntil || 0, this.time.now + 3500);
      const mult = (1.10 + skillLvl * 0.20) * dmgMult;
      for (const m of alive) {
        if (Phaser.Math.Distance.Between(this.hero.x, this.hero.y, m.sprite.x, m.sprite.y) <= 260) {
          m.chilledUntil = Math.max(m.chilledUntil || 0, this.time.now + 3500);
          applyPoison(m);
          this.damageMonster(m, Math.max(1, Math.round(stats.atk * mult)), false, false, '#a855f7', '💨');
        }
      }
      return;
    }

    if (skillId === 'venom_burst') {
      this.playFxSprite('afx_venom', aim.x, aim.y - 10, 1.5, 0, 480);
      if (window.__gameSettings?.graphics?.screenShake !== false) this.cameras.main.shake(130, 0.007);
      const mult = (2.10 + skillLvl * 0.38) * dmgMult * poisonMult;
      for (const m of alive) {
        if (Phaser.Math.Distance.Between(aim.x, aim.y, m.sprite.x, m.sprite.y) <= 240) {
          const isPois = this.time.now < (m.bleedUntil || 0) || this.time.now < (m.poisonedUntil || 0);
          const isCrit = (keyVenom || isPois) && Math.random() * 100 < stats.critRate;
          const dmg = Math.max(1, Math.round(stats.atk * mult * (isPois ? 1.45 : 1) * (isCrit ? stats.critDmg / 100 : 1)));
          this.damageMonster(m, dmg, isCrit, false, '#4ade80', '☠️');
        }
      }
      return;
    }

    if (skillId === 'lethal_fangs') {
      this.lethalFangsUntil = this.time.now + 4500;
      this.playFxSprite('afx_fangs', this.hero.x, this.hero.y - 8, 1.35, 0, 440);
      for (const m of alive) {
        if (Phaser.Math.Distance.Between(this.hero.x, this.hero.y, m.sprite.x, m.sprite.y) <= 220) applyPoison(m);
      }
      this.spawnFloatingText(this.hero.x, this.hero.y - 90, '🐍 致命毒牙！', '#4ade80', 15);
    }
  }

  applyHitEffects(mob, dmg, isCrit, stats) {
    if (!mob || mob.hp <= 0) return;
    this.damageMonster(mob, dmg, isCrit, false);
    if (isCrit) {
      this.playFxSprite('fx_crit', mob.sprite.x, mob.sprite.y - 10, 0.56, Math.random() * Math.PI, 240);
    }

    const boltChance = stats.activeEffects.has('chain_lightning') ? Math.max(100, stats.treeBoltChance) : stats.treeBoltChance;
    if (isCrit && boltChance > 0 && Math.random() * 100 < boltChance) {
      const boltDmg = Math.max(1, Math.round(stats.atk * 0.5));
      const second = this.monsters.find((m) => m.hp > 0 && m !== mob) || mob;
      if (second && second.hp > 0) {
        this.spawnLightningSprite(mob.sprite.x, mob.sprite.y - 12, second.sprite.x, second.sprite.y - 12);
        this.damageMonster(second, boltDmg, false, false, '#60a5fa', '⚡');
      }
    }

    const tree = this.getState().skillTree || {};
    const cid = this.getState().classId;
    const lowBlood = cid === 'warrior' && (tree.w_key_blood || 0) > 0 && this.playerHp < this.playerMaxHp * 0.55;
    let totalLS = stats.lifesteal + (this.time.now < this.warcryUntil ? 12 : 0);
    if (stats.activeEffects.has('berserk_soul') && this.playerHp < this.playerMaxHp * 0.5) totalLS *= 1.3;
    if (lowBlood) {
      totalLS *= 2;
      mob.bleedUntil = this.time.now + 3000;
      mob.bleedDmg = Math.max(2, Math.round(stats.atk * 0.25));
    }
    if (totalLS > 0) {
      this.healHero(Math.max(1, Math.round(dmg * (totalLS / 100))));
    }
    if (this.time.now < this.windwalkUntil && (tree.r_mod_gale || 0) > 0) {
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 5);
    }
    if (isCrit && cid === 'ranger' && (tree.r_key_gale || 0) > 0 && Math.random() < 0.45 && this.projectiles.length < 36) {
      const bang = Math.atan2(mob.sprite.y - this.hero.y, mob.sprite.x - this.hero.x);
      [-0.12, 0.12].forEach((o) => {
        const s = this.add.image(this.hero.x, this.hero.y - 12, 'rfx_arrow').setScale(0.42).setRotation(bang + o).setBlendMode(Phaser.BlendModes.ADD).setDepth(4508);
        this.projectiles.push({ fromEnemy: false, kind: 'pierce_arrow', sprite: s, vx: Math.cos(bang + o) * 820, vy: Math.sin(bang + o) * 820, lifeMs: 850, pierceLeft: 2, dmgMult: 0.75, hitIds: new Set([mob.uid]), stats });
      });
    }
  }

  updateProjectiles(dt, stats) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.lifeMs -= dt * 1000;
      p.sprite.x += p.vx * dt;
      p.sprite.y += p.vy * dt;

      let remove = p.lifeMs <= 0;

      if (!remove && p.fromEnemy) {
        if (Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, this.hero.x, this.hero.y) <= 44) {
          const hitFx = p.atkStyle === 'imp_fire' ? 'mfx_meteor_blast' : 'mfx_void_slash';
          this.playFxSprite(hitFx, this.hero.x, this.hero.y - 10, 0.45, Math.random() * Math.PI, 220);
          this.performMonsterAttack(p.mob, stats, 1, true);
          remove = true;
        }
      } else if (!remove && !p.fromEnemy) {
        for (const m of this.monsters) {
          if (m.hp <= 0 || (p.hitIds && p.hitIds.has(m.uid))) continue;
          const hitR = (p.kind === 'blade_wave' || p.kind === 'phantom_dragon' ? 95 : 50) + (m.isBoss ? 25 : 0);
          if (Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, m.sprite.x, m.sprite.y) <= hitR) {
            const now = this.time.now;
            if (p.kind === 'blade_wave') {
              p.hitIds.add(m.uid);
              const isBleed = now < (m.bleedUntil || 0);
              const isCrit = isBleed || Math.random() * 100 < p.stats.critRate;
              const dmg = Math.round(p.fixedRawDmg * (isCrit ? p.stats.critDmg / 100 : 1));
              this.playFxSprite('wfx_pierce_burst', m.sprite.x, m.sprite.y - 10, 0.72, Math.random() * Math.PI, 260);
              this.applyHitEffects(m, dmg, isCrit, p.stats);
            } else if (p.kind === 'phantom_dragon') {
              p.hitIds.add(m.uid);
              const isMarked = now < (m.markedUntil || 0);
              m.markedUntil = now + 5000;
              const dmg = Math.round(p.fixedDmg * (isMarked ? 1.35 : 1));
              this.playFxSprite('rfx_emerald_star', m.sprite.x, m.sprite.y - 10, 0.92, Math.random() * Math.PI, 300);
              this.applyHitEffects(m, dmg, true, p.stats);
            } else if (p.kind === 'ranger_beam') {
              p.hitIds.add(m.uid);
              if (p.appliesMark) m.markedUntil = now + 5000;
              const markCrit = now < (m.markedUntil || 0) ? 15 : 0;
              const isCrit = Math.random() * 100 < (p.stats.critRate + (p.bonusCrit || 0) + markCrit);
              const dmg = Math.round(p.fixedRawDmg * (isCrit ? p.stats.critDmg / 100 : 1));
              this.playFxSprite('rfx_pierce_flash', m.sprite.x, m.sprite.y - 10, 0.62, 0, 220);
              this.applyHitEffects(m, dmg, isCrit, p.stats);
            } else if (p.kind === 'mage_orb') {
              p.hitIds.add(m.uid);
              const isChill = now < (m.chilledUntil || 0);
              const isCrit = Math.random() * 100 < (p.stats.critRate + (p.bonusCrit || 0));
              const dmg = Math.round(p.fixedRawDmg * (isChill ? 1.35 : 1) * (isCrit ? p.stats.critDmg / 100 : 1));
              this.playFxSprite(isChill ? 'mfx_frost_burst' : 'mfx_spark', m.sprite.x, m.sprite.y - 10, 0.72, Math.random() * Math.PI, 240);
              this.applyHitEffects(m, dmg, isCrit, p.stats);
            } else {
              const markCrit = now < (m.markedUntil || 0) ? 15 : 0;
              const isCrit = Math.random() * 100 < (p.stats.critRate + markCrit);
              let dmg = p.stats.atk * (p.dmgMult || 1) * (0.92 + Math.random() * 0.16);
              if (isCrit) dmg *= p.stats.critDmg / 100;
              dmg = Math.max(1, Math.round(dmg));

              if (p.kind === 'pierce_arrow') {
                p.hitIds.add(m.uid);
                if (p.appliesMark) {
                  m.markedUntil = now + 5000;
                  this.spawnFloatingText(m.sprite.x, m.sprite.y - 70, '🎯印記', '#34d399', 13);
                }
                this.playFxSprite('rfx_pierce_flash', m.sprite.x, m.sprite.y - 10, 0.45, 0, 190);
                this.applyHitEffects(m, dmg, isCrit, p.stats);
                p.pierceLeft -= 1;
                if (p.pierceLeft <= 0) { remove = true; break; }
              } else if (p.kind === 'mage_bolt') {
                p.hitIds.add(m.uid);
                this.playFxSprite('mfx_spark', m.sprite.x, m.sprite.y - 10, 0.52, Math.random() * Math.PI, 220);
                this.applyHitEffects(m, dmg, isCrit, p.stats);
                if ((p.bouncesLeft || 0) > 0) {
                  const next = this.monsters.find((t) => t.hp > 0 && !p.hitIds.has(t.uid) && Phaser.Math.Distance.Between(m.sprite.x, m.sprite.y, t.sprite.x, t.sprite.y) <= 210);
                  if (next) {
                    p.bouncesLeft -= 1;
                    const bang = Math.atan2(next.sprite.y - p.sprite.y, next.sprite.x - p.sprite.x);
                    p.vx = Math.cos(bang) * 620;
                    p.vy = Math.sin(bang) * 620;
                    p.sprite.setRotation(bang);
                    p.lifeMs = Math.max(p.lifeMs, 450);
                    break;
                  }
                }
                remove = true;
                break;
              }
            }
          }
        }
      }

      if (remove) {
        p.sprite.destroy();
        this.projectiles.splice(i, 1);
      }
    }
  }

  playFxSprite(key, x, y, scale = 0.6, rotation = 0, duration = 260) {
    const spr = this.add.image(x, y, key)
      .setScale(scale * 0.7).setRotation(rotation).setBlendMode(Phaser.BlendModes.ADD).setDepth(4510);
    this.tweens.add({
      targets: spr,
      scale: scale * 1.12,
      alpha: 0,
      duration,
      ease: 'Cubic.easeOut',
      onComplete: () => spr.destroy(),
    });
  }

  spawnLightningSprite(x1, y1, x2, y2) {
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const dist = Math.max(80, Phaser.Math.Distance.Between(x1, y1, x2, y2));
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const bolt = this.add.image(cx, cy, 'fx_lightning')
      .setDisplaySize(dist, 90).setRotation(ang).setBlendMode(Phaser.BlendModes.ADD).setDepth(4512);
    this.tweens.add({ targets: bolt, alpha: 0, duration: 250, onComplete: () => bolt.destroy() });
  }

  performMonsterAttack(m, stats, atkMult = 1, skipMeleeFx = false) {
    if (this.isTransitioning || !m || m.hp <= 0) return;

    if (!skipMeleeFx && !m.isRanged) {
      const ang = Math.atan2(this.hero.y - m.sprite.y, this.hero.x - m.sprite.x);
      const midX = (m.sprite.x + this.hero.x) / 2;
      const midY = (m.sprite.y + this.hero.y) / 2 - 8;
      const trailColor = m.atkStyle === 'venom' ? 0x4ade80 : (m.atkStyle === 'slash' ? 0x93c5fd : (m.atkStyle === 'smash' ? 0xf59e0b : 0xef4444));
      const trail = this.add.image(midX, midY, 'wfx_wave_trail')
        .setTint(trailColor).setScale(m.isBoss ? 1.25 : 0.85).setRotation(ang).setAlpha(0.85)
        .setBlendMode(Phaser.BlendModes.ADD).setDepth(4511);
      this.tweens.add({ targets: trail, alpha: 0, scale: m.isBoss ? 1.55 : 1.1, duration: 260, onComplete: () => trail.destroy() });

      if (m.atkStyle === 'venom') {
        this.playFxSprite('efx_venom', this.hero.x, this.hero.y - 8, 0.94, Math.random() * Math.PI, 320);
      } else if (m.atkStyle === 'slash') {
        const sl = this.add.image(this.hero.x, this.hero.y - 8, 'wfx_cleave')
          .setTint(0x93c5fd).setScale(0.9).setRotation(ang).setBlendMode(Phaser.BlendModes.ADD).setDepth(4512);
        this.tweens.add({ targets: sl, scale: 1.18, alpha: 0, duration: 280, onComplete: () => sl.destroy() });
      } else if (m.atkStyle === 'smash') {
        this.playFxSprite('wfx_rubble', this.hero.x, this.hero.y, 1.15, 0, 340);
        this.playFxSprite('efx_claw', this.hero.x, this.hero.y - 8, 1.10, ang, 300);
        // v250: zero shake
      } else if (m.atkStyle === 'boss_cleave') {
        this.playFxSprite('efx_claw', this.hero.x, this.hero.y - 8, 1.65, ang, 360);
        this.playFxSprite('mfx_meteor_flame', this.hero.x, this.hero.y - 12, 1.25, 0, 380);
        this.playFxSprite('wfx_lava_ring', this.hero.x, this.hero.y + 8, 1.10, 0, 360);
        // v250: zero shake
      } else {
        this.playFxSprite('efx_claw', this.hero.x, this.hero.y - 8, 0.98, ang, 300);
      }
    }

    if (this.time.now < (this.heroInvulnUntil || 0)) {
      this.spawnFloatingText(this.hero.x, this.hero.y - 74, '❄️ 冰封無敵', '#7dd3fc', 14);
      return;
    }
    const totalDodge = stats.dodge + (this.time.now < this.dodgeBuffUntil ? 25 : 0);
    if (Math.random() * 100 < totalDodge) {
      this.spawnFloatingText(this.hero.x, this.hero.y - 68, 'MISS', '#94a3b8', 14);
      if ((stats.dodgeHealPct || 0) > 0) this.healHero(Math.max(1, Math.round(this.playerMaxHp * (stats.dodgeHealPct / 100))));
      if ((stats.dodgeShadow || 0) > 0) this.playerMp = Math.min(this.playerMaxMp, this.playerMp + stats.dodgeShadow);
      const dTree = this.getState().skillTree || {};
      if (this.getState().classId === 'assassin' && (dTree.a_key_dancer || 0) > 0 && m && m.hp > 0) {
        this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 6);
        this.playFxSprite('afx_slash', m.sprite.x, m.sprite.y - 8, 0.85, Math.random() * Math.PI, 240);
        this.damageMonster(m, Math.max(1, Math.round(stats.atk * 1.5)), true, false, '#d8b4fe', '⚡閃反 ');
      }
      if (stats.activeEffects.has('dodge_kunai') && m && m.hp > 0) {
        const kang = Math.atan2(m.sprite.y - this.hero.y, m.sprite.x - this.hero.x);
        [-0.18, 0, 0.18].forEach((o) => {
          const spr = this.add.image(this.hero.x, this.hero.y - 10, 'afx_kunai').setScale(0.32).setRotation(kang + o).setBlendMode(Phaser.BlendModes.ADD).setDepth(4510);
          this.projectiles.push({ fromEnemy: false, kind: 'pierce_arrow', sprite: spr, vx: Math.cos(kang + o) * 760, vy: Math.sin(kang + o) * 760, lifeMs: 750, pierceLeft: 1, dmgMult: 0.75, hitIds: new Set(), stats });
        });
      }
      return;
    }

    const effArmor = (stats.activeEffects.has('berserk_soul') && this.playerHp < this.playerMaxHp * 0.5) ? Math.round(stats.armor * 1.3) : stats.armor;
    const mitigation = effArmor / (effArmor + 45 + m.stage * 14);
    const guardBonus = (this.getState().classId === 'warrior' && this.time.now < (this.warriorGuardUntil || 0))
      ? Math.min(0.20, this.warriorGuardStacks * 0.04) : 0;
    const curseDr = (m && this.time.now < (m.cursedUntil || 0)) ? 0.25 : 0;
    const thornsDr = this.time.now < (this.thornsModUntil || 0) ? 0.35 : 0;
    let dmg = Math.max(1, Math.round(m.atk * atkMult * (1 - mitigation) * (1 - guardBonus) * (1 - thornsDr) * (1 - curseDr)));
    if (this.mageShieldHp > 0) {
      const absorbed = Math.min(this.mageShieldHp, dmg);
      this.mageShieldHp -= absorbed;
      dmg -= absorbed;
      if (absorbed > 0) this.spawnFloatingText(this.hero.x, this.hero.y - 84, `🛡️-${formatNum(absorbed)}`, '#38bdf8', 13);
    }
    if (this.holyAegisHp > 0 && this.time.now < (this.holyAegisUntil || 0)) {
      const absorbed = Math.min(this.holyAegisHp, dmg);
      this.holyAegisHp -= absorbed;
      dmg -= absorbed;
      if (absorbed > 0) this.spawnFloatingText(this.hero.x, this.hero.y - 84, `🛡️-${formatNum(absorbed)}`, '#fde047', 13);
    }
    const cid = this.getState().classId;
    if (cid === 'paladin' && m.hp > 0 && (this.time.now < (this.holyAegisUntil || 0) || (stats.thornsPct || 0) > 0 || stats.activeEffects.has('thorns_nova'))) {
      const tree = this.getState().skillTree || {};
      const thornsMult = (0.8 + (stats.thornsPct || 0) / 100) * ((tree.p_mod_thorns || 0) > 0 ? 1.5 : 1) * (stats.activeEffects.has('aegis_judgment') ? 1.8 : 1);
      const isThornsCrit = (tree.p_key_bulwark || 0) > 0 || Math.random() * 100 < stats.critRate;
      const tDmg = Math.max(1, Math.round(stats.armor * thornsMult * (isThornsCrit ? stats.critDmg / 100 : 1)));
      this.playFxSprite('pfx_storm', this.hero.x, this.hero.y, 0.75, 0, 260);
      this.damageMonster(m, tDmg, isThornsCrit, false, '#fde047', '⚡反傷 ');
    }
    if ((stats.dmgReducePct || 0) > 0) dmg = Math.max(1, Math.round(dmg * (1 - stats.dmgReducePct / 100)));
    if ((stats.blockHealPct || 0) > 0 && Math.random() < 0.28) {
      this.healHero(Math.max(1, Math.round(this.playerMaxHp * (stats.blockHealPct / 100))));
    }
    this.playerHp = Math.max(0, this.playerHp - dmg);

    window.__battleSfx?.playHeroHurt?.();
    this.hero.setTintFill(0xff4444);
    this.time.delayedCall(90, () => this.hero && this.hero.clearTint());
    this.spawnFloatingText(this.hero.x, this.hero.y - 68, `-${formatNum(dmg)}`, '#f87171', 15);
    this.updateHeroHpBar();

    if (this.playerHp <= 0) {
      if (this.towerMode) { this.playerHp = this.playerMaxHp; this.exitTowerMode('挑戰失敗，安全返回主城休整！'); } else { this.handleHeroDefeat('生命歸零，返回第 1 波休整！'); }
    }
  }

  // v246: 註冊秘法師 10 組 9 格暗黑手繪序列幀動畫
  registerMageSeqAnims() {
    const seqs = [
      ['anim_m_fireball_blast', 12],
      ['anim_m_firewall', 7],
      ['anim_m_frozen_orb', 10],
      ['anim_m_blizzard', 8],
      ['anim_m_ball_lightning', 10],
      ['anim_m_supernova', 9],
      ['anim_m_meteor', 9],
      ['anim_m_frost_nova', 11],
      ['anim_m_lightning_strike', 13],
      ['anim_m_inferno', 8],
    ];
    for (const [key, fps] of seqs) {
      if (this.textures.exists(key) && !this.anims.exists(key)) {
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers(key, { start: 0, end: 8 }),
          frameRate: fps,
          repeat: 0,
        });
      }
    }
  }

  // v246: 於 Phaser 2.5D 同層景深（Y-Depth Sorting + NormalBlending）播放暗黑手繪序列幀
  playDarkSeqAnim(key, x, y, scale = 0.92, frameRate = null, depthOffset = 14) {
    if (!this.textures.exists(key) || !this.anims.exists(key)) return false;
    const sp = this.add.sprite(x, y, key, 0)
      .setScale(scale)
      .setDepth(Math.max(100, Math.round(y + depthOffset)));
    if (frameRate) {
      sp.play({ key, frameRate });
    } else {
      sp.play(key);
    }
    sp.once('animationcomplete', () => sp.destroy());
    return true;
  }

  playAdditiveVfx(key, x, y, targetScale = 0.82, durationMs = 420) {
    if (!this.textures.exists(key)) return;
    const sp = this.add.image(x, y, key)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(targetScale * 0.25)
      .setAlpha(0.96)
      .setDepth(4400);
    this.tweens.add({
      targets: sp,
      scale: targetScale,
      alpha: 0,
      angle: Phaser.Math.Between(-28, 28),
      duration: durationMs,
      ease: 'Cubic.easeOut',
      onComplete: () => sp.destroy(),
    });
  }

  // v242: 暗黑 4 秘法師實戰加成倍率（召喚精通層數＋屏障增傷＋啟蒙三系爆發）
  getMageD4LiveMult() {
    let mult = 1;
    const conjStacks = Math.min(10, (this.mageConjurations || []).length);
    if (conjStacks > 0) mult *= (1 + conjStacks * 0.06);
    if (this.heroBarrierHp > 0 && this.time.now < (this.heroBarrierUntil || 0)) mult *= 1.25;
    if (this.time.now < (this.enlightenmentUntil || 0)) mult *= 1.45;
    return mult;
  }

  // v242: 飛行投射物特效（火彈／火球／冰片）
  launchVfxProjectile(key, sx, sy, tx, ty, scale = 0.6, durationMs = 200, onHit = null) {
    if (!this.textures.exists(key)) {
      if (onHit) onHit();
      return;
    }
    const ang = Phaser.Math.Angle.Between(sx, sy, tx, ty);
    const sp = this.add.image(sx, sy, key)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(scale)
      .setRotation(ang)
      .setDepth(4410);
    this.tweens.add({
      targets: sp,
      x: tx,
      y: ty,
      duration: durationMs,
      ease: 'Quad.easeOut',
      onComplete: () => {
        sp.destroy();
        if (onHit) onHit();
      },
    });
  }

  // v242: 啟蒙（Enlightenment）三系輪流施法累積至 100 層觸發三元素超新星爆發
  registerEnlightenment(elem) {
    const now = this.time.now;
    if (now < (this.enlightenmentUntil || 0)) return;
    const gain = this.enlightenmentLastElem && this.enlightenmentLastElem !== elem ? 25 : 10;
    this.enlightenmentLastElem = elem;
    this.enlightenmentStacks = Math.min(100, (this.enlightenmentStacks || 0) + gain);
    if (this.enlightenmentStacks >= 100) {
      this.enlightenmentStacks = 0;
      this.enlightenmentUntil = now + 8000;
      this.playerMp = this.playerMaxMp;
      if (this.hero) {
        this.mageVfx?.playSeq16('seq16_m_supernova', this.hero.x, this.hero.y - 10, 1.55, 16, 20);
        this.spawnFloatingText(this.hero.x, this.hero.y - 96, '✨ 啟蒙爆發 (+45%傷害)', '#fde047', 16);
        const st = this.getStats();
        const dmg = Math.round(st.atk * 2.4);
        this.monsters.forEach((m) => {
          if (m.hp > 0 && Phaser.Math.Distance.Between(this.hero.x, this.hero.y, m.sprite.x, m.sprite.y) <= 320) {
            this.damageMonster(m, dmg, true, false, '#fde047', '✨啟蒙 ', true);
          }
        });
      }
    }
  }

  // v242: 啟動秘法師屏障護盾（寒冰護甲／烈焰護盾／深度凍結）與視覺跟隨光環
  activateHeroBarrier(amount, durationMs, vfxKey = 'ent_m_ice_armor') {
    this.heroBarrierHp = Math.max(this.heroBarrierHp || 0, amount);
    this.heroBarrierUntil = Math.max(this.heroBarrierUntil || 0, this.time.now + durationMs);
    const key = this.textures.exists(vfxKey) ? vfxKey : 'ent_m_ice_armor';
    if (this.heroBarrierSprite && this.heroBarrierKey !== key) {
      this.heroBarrierSprite.destroy();
      this.heroBarrierSprite = null;
    }
    if (!this.heroBarrierSprite && this.hero && this.textures.exists(key)) {
      this.heroBarrierKey = key;
      this.heroBarrierSprite = this.add.image(this.hero.x, this.hero.y - 4, key)
        .setScale(0.58)
        .setAlpha(0.92)
        .setDepth(Math.max(120, Math.round(this.hero.y + 10)));
    }
  }

  // v242: 生成地面劈啪電花能量球（靠近自動磁吸拾取回魔＋減冷卻＋放電）
  spawnCracklingOrb(x, y) {
    const key = this.textures.exists('ent_m_crackling_orb') ? 'ent_m_crackling_orb' : 'vfx_m_crackling_orb';
    if (!this.textures.exists(key)) return;
    if ((this.cracklingOrbs || []).length >= 12) return;
    const ox = x + Phaser.Math.Between(-55, 55);
    const oy = y + Phaser.Math.Between(-35, 35);
    const sp = this.add.image(ox, oy, key)
      .setScale(0.32)
      .setAlpha(0.96)
      .setDepth(Math.max(110, Math.round(oy + 8)));
    this.cracklingOrbs.push({
      sprite: sp,
      x: ox,
      y: oy,
      expiresAt: this.time.now + 12000,
      phase: Math.random() * 6.28,
    });
  }

  // v242: 生成場上真實召喚實體（火蛇炮台／寒冰之刃／閃電長矛／元素使魔）
  spawnMageConjuration(type, x, y, skillLvl = 1, durationMs = 9000) {
    if ((this.mageConjurations || []).length >= 8) {
      const oldest = this.mageConjurations.shift();
      if (oldest?.sprite) oldest.sprite.destroy();
      if (oldest?.shadow) oldest.shadow.destroy();
    }
    const animMap = {
      hydra: 'anim_conj_hydra',
      ice_blades: 'anim_conj_ice_blades',
      lightning_spear: 'anim_conj_lightning_spear',
      familiar: 'anim_conj_familiar',
    };
    const fallbackMap = {
      hydra: 'conj_m_hydra',
      ice_blades: 'conj_m_ice_blades',
      lightning_spear: 'conj_m_lightning_spear',
      familiar: 'conj_m_familiar',
    };
    const animKey = animMap[type] || 'anim_conj_hydra';
    const fbKey = fallbackMap[type] || 'conj_m_hydra';
    const scaleMap = { hydra: 0.54, ice_blades: 0.46, lightning_spear: 0.48, familiar: 0.42 };
    const baseSc = scaleMap[type] || 0.48;
    const elemMap = { hydra: 'fire', ice_blades: 'frost', lightning_spear: 'shock', familiar: 'shock' };
    const elem = elemMap[type] || 'fire';
    this.mageVfx?.spawnConjurationPoof(x, y, elem);
    const shadow = this.add.ellipse(x, y + 10, 58, 22, 0x050507, 0.58)
      .setDepth(Math.max(50, Math.round(y - 2)));
    let sp = null;
    if (this.textures.exists(animKey) && this.anims.exists(animKey)) {
      sp = this.add.sprite(x, y - 14, animKey, 0)
        .setScale(baseSc * 0.2)
        .setAlpha(0.98)
        .setDepth(Math.max(120, Math.round(y + 10)));
      sp.play(animKey);
    } else if (this.textures.exists(fbKey)) {
      sp = this.add.image(x, y - 14, fbKey)
        .setScale(baseSc * 0.2)
        .setAlpha(0.98)
        .setDepth(Math.max(120, Math.round(y + 10)));
    }
    if (sp) {
      this.tweens.add({ targets: sp, scale: baseSc, duration: 220, ease: 'Back.easeOut' });
    }
    this.mageConjurations.push({
      type,
      elem,
      sprite: sp,
      shadow,
      x,
      y,
      skillLvl,
      expiresAt: this.time.now + durationMs,
      atkCd: 350,
      interval: type === 'hydra' ? 850 : (type === 'ice_blades' ? 750 : 800),
      phase: Math.random() * 6.28,
    });
  }

  // v242: 每幀更新場上召喚實體、劈啪電花拾取與屏障光環
  updateMageBattlefieldEntities(delta) {
    const now = this.time.now;
    const dtSec = delta / 1000;

    // 1. 屏障護盾光環跟隨與過期清除
    if (this.heroBarrierSprite) {
      if (!this.hero || now >= (this.heroBarrierUntil || 0) || (this.heroBarrierHp || 0) <= 0) {
        this.heroBarrierSprite.destroy();
        this.heroBarrierSprite = null;
        this.heroBarrierHp = 0;
      } else {
        this.heroBarrierSprite.setVisible(true);
        this.heroBarrierSprite.setPosition(this.hero.x, this.hero.y - 4);
        this.heroBarrierSprite.setDepth(Math.max(120, Math.round(this.hero.y + 10)));
        this.heroBarrierSprite.setScale(0.56 + Math.sin(now * 0.006) * 0.03);
      }
    }

    // 2. 啟蒙爆發期間額外回魔
    if (now < (this.enlightenmentUntil || 0)) {
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 16 * dtSec);
    }

    // 3. 場上召喚實體（火蛇／冰刃／閃電長矛／元素使魔）自主鎖敵與攻擊
    if (this.mageConjurations && this.mageConjurations.length > 0) {
      const stats = this.getStats();
      const mult = this.getMageD4LiveMult();
      // 召喚精通每層額外回魔
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + Math.min(10, this.mageConjurations.length) * 1.4 * dtSec);

      for (let i = this.mageConjurations.length - 1; i >= 0; i--) {
        const c = this.mageConjurations[i];
        if (now >= c.expiresAt) {
          this.mageVfx?.spawnConjurationPoof(c.x, c.y, c.elem || 'fire');
          if (c.sprite) c.sprite.destroy();
          if (c.shadow) c.shadow.destroy();
          this.mageConjurations.splice(i, 1);
          continue;
        }
        c.phase += dtSec * 4.5;
        const tgt = this.findNearestMonster(c.x, c.y, 650);
        if (c.type === 'ice_blades' || c.type === 'lightning_spear') {
          if (tgt && tgt.sprite) {
            const ang = Phaser.Math.Angle.Between(c.x, c.y, tgt.sprite.x, tgt.sprite.y);
            const spd = c.type === 'lightning_spear' ? 280 : 220;
            if (Phaser.Math.Distance.Between(c.x, c.y, tgt.sprite.x, tgt.sprite.y) > 48) {
              c.x += Math.cos(ang) * spd * dtSec;
              c.y += Math.sin(ang) * spd * dtSec;
            }
            if (c.sprite) c.sprite.setRotation(ang);
          }
        } else if (c.type === 'familiar' && this.hero) {
          c.x = this.hero.x + Math.cos(c.phase * 0.7) * 62;
          c.y = this.hero.y - 24 + Math.sin(c.phase * 0.7) * 34;
        }

        if (c.shadow) {
          c.shadow.setPosition(c.x, c.y + 10);
          c.shadow.setDepth(Math.max(50, Math.round(c.y - 2)));
        }
        if (c.sprite) {
          c.sprite.setVisible(true);
          const bob = c.type === 'hydra' ? Math.sin(c.phase * 0.9) * 2.5 : Math.sin(c.phase) * 5;
          c.sprite.setPosition(c.x, c.y - 14 + bob);
          c.sprite.setDepth(Math.max(120, Math.round(c.y + 10)));
          if (tgt && tgt.sprite && (c.type === 'hydra' || c.type === 'familiar')) {
            c.sprite.setFlipX(tgt.sprite.x < c.x);
          }
        }
        c.atkCd -= delta;
        if (c.atkCd <= 0 && tgt && tgt.sprite && tgt.hp > 0) {
          c.atkCd = c.interval;
          const baseDmg = Math.round(stats.atk * ((0.72 + c.skillLvl * 0.11) * mult));
          if (c.sprite) {
            this.tweens.add({ targets: c.sprite, scaleX: c.sprite.scaleX * 1.18, scaleY: c.sprite.scaleY * 1.18, duration: 90, yoyo: true });
          }
          if (c.type === 'hydra') {
            this.mageVfx?.launchProjectile('proj_m_fire_bolt', c.x, c.y - 24, tgt.sprite.x, tgt.sprite.y - 8, 0.42, 160, 'fire', () => {
              if (tgt.hp > 0) {
                this.mageVfx?.playSeq16('seq16_m_fireball_blast', tgt.sprite.x, tgt.sprite.y - 6, 0.58, 22, 14);
                this.damageMonster(tgt, baseDmg, false, false, '#fb923c', '🐍火蛇 ', true);
              }
            });
          } else if (c.type === 'ice_blades') {
            this.mageVfx?.playSeq16('seq16_m_frost_nova', tgt.sprite.x, tgt.sprite.y - 6, 0.58, 22, 14);
            this.slotCdTimers = this.slotCdTimers.map((t) => t + 380);
            this.damageMonster(tgt, baseDmg, false, false, '#7dd3fc', '⚔️冰刃 ', true);
          } else if (c.type === 'lightning_spear') {
            this.mageVfx?.playChainArc(c.x, c.y - 10, tgt.sprite.x, tgt.sprite.y - 8, 0.42, 200); this.mageVfx?.playSeq16('seq16_m_ball_lightning', tgt.sprite.x, tgt.sprite.y - 8, 0.62, 24, 16);
            this.damageMonster(tgt, Math.round(baseDmg * 1.15), true, false, '#facc15', '⚡雷矛 ', true);
          } else if (c.type === 'familiar') {
            this.mageVfx?.playChainArc(c.x, c.y - 12, tgt.sprite.x, tgt.sprite.y - 8, 0.34, 190); this.mageVfx?.playSeq16('seq16_m_ball_lightning', tgt.sprite.x, tgt.sprite.y - 6, 0.56, 22, 14);
            this.damageMonster(tgt, baseDmg, false, false, '#fde047', '🔮使魔 ', true);
          }
        }
      }
    }

    // 4. 地面劈啪電花能量球：磁吸拾取回魔＋減冷卻＋放電
    if (this.cracklingOrbs && this.cracklingOrbs.length > 0 && this.hero) {
      const stats = this.getStats();
      for (let i = this.cracklingOrbs.length - 1; i >= 0; i--) {
        const orb = this.cracklingOrbs[i];
        if (now >= orb.expiresAt) {
          orb.sprite.destroy();
          this.cracklingOrbs.splice(i, 1);
          continue;
        }
        orb.phase += dtSec * 6;
        const dist = Phaser.Math.Distance.Between(orb.x, orb.y, this.hero.x, this.hero.y);
        if (dist < 210) {
          const ang = Phaser.Math.Angle.Between(orb.x, orb.y, this.hero.x, this.hero.y);
          orb.x += Math.cos(ang) * 320 * dtSec;
          orb.y += Math.sin(ang) * 320 * dtSec;
        }
        orb.sprite.setVisible(true);
        orb.sprite.setPosition(orb.x, orb.y + Math.sin(orb.phase) * 4);
        orb.sprite.setScale(0.26 + Math.sin(orb.phase) * 0.04);
        if (dist <= 44) {
          orb.sprite.destroy();
          this.cracklingOrbs.splice(i, 1);
          this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 18);
          this.slotCdTimers = this.slotCdTimers.map((t) => t + 600);
          const near = this.findNearestMonster(this.hero.x, this.hero.y, 420);
          if (near && near.sprite && near.hp > 0) {
            this.mageVfx?.playChainArc(this.hero.x, this.hero.y - 14, near.sprite.x, near.sprite.y - 10, 0.38, 200);
            this.damageMonster(near, Math.round(stats.atk * 0.95 * this.getMageD4LiveMult()), false, false, '#38bdf8', '⚡電花 ', true);
          }
        }
      }
    }
  }

  damageMonster(m, dmg, isCrit, isTap, customColor = null, prefix = '', _isProc = false) {
    if (!m || m.hp <= 0) return;
    if (!m.isAggressive && !m.isProvoked) {
      m.isProvoked = true;
      if (m.nameText) {
        m.nameText.setText(`🔴 ${m.name}`).setColor('#fca5a5');
      }
    }
    const st = this.getStats();
    const nowT = this.time.now;
    let bonusMult = 1;
    if ((st.stunDmgPct || 0) > 0 && nowT < (m.stunUntil || 0)) bonusMult += st.stunDmgPct / 100;
    if ((st.chillDmgPct || 0) > 0 && nowT < (m.chilledUntil || 0)) bonusMult += st.chillDmgPct / 100;
    if (nowT < (m.markedUntil || 0)) {
      if ((st.markCritDmgPct || 0) > 0 && isCrit) bonusMult += st.markCritDmgPct / 100;
      if (st.activeEffects.has('shadow_veil')) bonusMult += 0.25;
    }
    if (prefix === '🩸' && (st.bleedDmgPct || 0) > 0) bonusMult += st.bleedDmgPct / 100;
    if (nowT < (m.cursedUntil || 0)) bonusMult += 0.20;
    if (nowT < (m.shredUntil || 0)) bonusMult += 0.30;
    const activeMods = (!_isProc && !isTap && nowT <= (this._activeBuildModsUntil || 0)) ? this._activeBuildMods : null;
    if (activeMods && activeMods.dmgMult > 1) bonusMult *= activeMods.dmgMult;

    const _cidNow = this.getState()?.classId || 'warrior';
    const _mCfg = getClassMechanicConfig(this.getState(), _cidNow);
    let isOverpower = false;
    if (!_isProc && !isTap) {
      // 職業專屬增傷倍率（武器過載 / 遊俠連擊星 / 刺客五星印記 / 死靈孤高暴君）
      if (_cidNow === 'warrior' && nowT < (this._wArsenalOverloadUntil || 0)) bonusMult *= 1.35;
      if (_cidNow === 'ranger' && nowT < (this._rSpentStarsUntil || 0)) bonusMult *= (1 + (this._rSpentStars || 0) * 0.28);
      if (_cidNow === 'assassin' && nowT < (this._aFiveStarUntil || 0)) bonusMult *= 1.60;
      if (_cidNow === 'necro' && st.isLoneTyrant) bonusMult *= 1.25;

      const baseOp = (activeMods ? activeMods.overpowerChance : 0.04) + ((st.mechOverpowerPct || 0) / 100);
      const forceOp = (_cidNow === 'warrior' && nowT < (this._wArsenalOverloadUntil || 0));
      if (forceOp || Math.random() < baseOp) {
        isOverpower = true;
        const opMult = (_cidNow === 'warrior' && _mCfg.arsenal === 'warhammer') ? 2.20 : 1.75;
        bonusMult *= opMult;
        customColor = '#38bdf8';
        prefix = '💠壓制 ' + (prefix || '');
        this.playAdditiveVfx('vfx_proc_overpower', m.sprite.x, m.sprite.y - 12, 0.68, 380);
      }
    }
    dmg = Math.max(1, Math.round(dmg * bonusMult));
    m.hp = Math.max(0, m.hp - dmg);

    m.sprite.setTintFill(0xffffff);
    this.time.delayedCall(75, () => m.sprite && m.sprite.active && m.sprite.clearTint());

    const ratio = Math.max(0, Math.min(1, m.hp / Math.max(1, m.maxHp)));
    m.hpFill.width = m.barW * ratio;

    const color = customColor || (isTap ? '#fde047' : (isCrit ? '#facc15' : '#ffffff'));
    const size = isCrit ? 20 : (isTap ? 14 : 15);
    const label = `${prefix}${isCrit ? '💥' : ''}-${formatNum(dmg)}${isCrit ? '!' : ''}`;
    this.spawnFloatingText(m.sprite.x + Phaser.Math.Between(-18, 18), m.sprite.y - 54, label, color, size);

    if (isCrit) {
      window.__battleSfx?.playCrit?.();
      // v245: zero screen shake per user preference
      if (st.activeEffects.has('toxic_arrow') && m.hp > 0) {
        m.poisonedUntil = Math.max(m.poisonedUntil || 0, nowT + 3000);
        m.poisonDmg = Math.max(m.poisonDmg || 0, Math.round(st.atk * 0.35));
      }
    }

    if (!_isProc && !isTap && m.hp > 0) {
      if (!m._statuses) m._statuses = {};
      if (activeMods && activeMods.applyStatuses) {
        activeMods.applyStatuses.forEach((sk) => {
          m._statuses[sk] = Math.max(m._statuses[sk] || 0, nowT + 4800);
          if (sk === 'bleed') { m.bleedUntil = Math.max(m.bleedUntil || 0, nowT + 4500); m.bleedDmg = Math.max(m.bleedDmg || 0, Math.round(st.atk * 0.25)); }
          if (sk === 'poison') { m.poisonedUntil = Math.max(m.poisonedUntil || 0, nowT + 4500); m.poisonDmg = Math.max(m.poisonDmg || 0, Math.round(st.atk * 0.28)); }
          if (sk === 'freeze') { m.chilledUntil = Math.max(m.chilledUntil || 0, nowT + 3500); m.slowUntil = Math.max(m.slowUntil || 0, nowT + 3500); }
          if (sk === 'vulnerable') { m.markedUntil = Math.max(m.markedUntil || 0, nowT + 4800); }
          if (sk === 'curse') { m.cursedUntil = Math.max(m.cursedUntil || 0, nowT + 5000); }
        });
      }

      // v234: 六大職業命中觸發（武器庫 / 連擊星與心眼 / 法師附魔 / 聖騎印記與荊棘 / 死靈亡者之書 / 刺客雙毒與暗影星）
      if (_cidNow === 'warrior') {
        if (_mCfg.arsenal === 'greatsword') {
          m._statuses.bleed = Math.max(m._statuses.bleed || 0, nowT + 4500);
          m.bleedUntil = Math.max(m.bleedUntil || 0, nowT + 4500);
        } else if (_mCfg.arsenal === 'dual_axes' && isCrit) {
          this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 6);
        } else if (_mCfg.arsenal === 'warhammer') {
          m._statuses.vulnerable = Math.max(m._statuses.vulnerable || 0, nowT + 4500);
        }
      } else if (_cidNow === 'ranger') {
        if (_mCfg.specialization === 'combo_points') {
          this._rComboStars = Math.min(3, (this._rComboStars || 0) + 1);
        } else if (_mCfg.specialization === 'inner_sight' && nowT >= (this._rInnerSightUntil || 0)) {
          this._rInnerSightGauge = (this._rInnerSightGauge || 0) + 12;
          if (this._rInnerSightGauge >= 100) {
            this._rInnerSightGauge = 0;
            this._rInnerSightUntil = nowT + 4000;
            this.spawnFloatingText(this.hero.x, this.hero.y - 106, '👁️心眼洞察啟動（4秒無限精力）!', '#c084fc', 15);
          }
        }
      } else if (_cidNow === 'mage') {
        const ench = _mCfg.enchants || [];
        if (ench.includes('meteor') && isCrit && Math.random() < 0.18) {
          m._statuses.burn = Math.max(m._statuses.burn || 0, nowT + 4500);
          this.playAdditiveVfx('vfx_react_plaguefire', m.sprite.x, m.sprite.y - 16, 0.72, 380);
          this.damageMonster(m, Math.round(st.atk * 1.8), true, false, '#fb923c', '☄️附魔隕石 ', true);
        }
        if (ench.includes('frost_nova') && nowT - (this._mLastFrostEnch || 0) >= 5500) {
          this._mLastFrostEnch = nowT;
          m._statuses.freeze = Math.max(m._statuses.freeze || 0, nowT + 3500);
          m._statuses.vulnerable = Math.max(m._statuses.vulnerable || 0, nowT + 4000);
          this.playAdditiveVfx('vfx_react_superconduct', m.sprite.x, m.sprite.y - 10, 0.65, 360);
          this.damageMonster(m, Math.round(st.atk * 1.35), false, false, '#38bdf8', '❄️附魔冰環 ', true);
        }
        if (ench.includes('arcane_orb') && isCrit && Math.random() < 0.25) {
          m._statuses.vulnerable = Math.max(m._statuses.vulnerable || 0, nowT + 4500);
          this.damageMonster(m, Math.round(st.atk * 1.2), false, false, '#a78bfa', '🔮附魔奧球 ', true);
        }
        if (ench.includes('black_hole') && nowT - (this._mLastBhEnch || 0) >= 8000) {
          this._mLastBhEnch = nowT;
          m._statuses.curse = Math.max(m._statuses.curse || 0, nowT + 5000);
          this.playAdditiveVfx('vfx_react_souljudge', m.sprite.x, m.sprite.y - 12, 0.68, 380);
          this.damageMonster(m, Math.round(st.atk * 1.65), true, false, '#c084fc', '🕳️附魔黑洞 ', true);
        }
        if (ench.includes('icicle_rain') && (m._statuses.freeze || 0) > nowT && Math.random() < 0.30) {
          this.damageMonster(m, Math.round(st.atk * 1.15), false, false, '#7dd3fc', '🧊附魔冰錐 ', true);
        }
        if (ench.includes('void_beam') && Math.random() < 0.15) {
          m._statuses.curse = Math.max(m._statuses.curse || 0, nowT + 4500);
          this.damageMonster(m, Math.round(st.atk * 1.75), true, false, '#e879f9', '⚡附魔虛空 ', true);
        }
      } else if (_cidNow === 'paladin') {
        if (_mCfg.oath === 'sun_oath') {
          m._holyMarks = (m._holyMarks || 0) + 1;
          if (m._holyMarks >= 5) {
            m._holyMarks = 0;
            m._statuses.conviction = Math.max(m._statuses.conviction || 0, nowT + 5000);
            m._statuses.burn = Math.max(m._statuses.burn || 0, nowT + 4500);
            this.playAdditiveVfx('vfx_react_souljudge', m.sprite.x, m.sprite.y - 14, 0.78, 400);
            this.damageMonster(m, Math.round(st.atk * 2.4), true, false, '#fde047', '☀️烈陽天罰 ', true);
          }
        } else if (_mCfg.oath === 'bastion_oath' && nowT - (this._pLastBastion || 0) >= 3000) {
          this._pLastBastion = nowT;
          const thDmg = Math.max(10, Math.round((st.armor || 20) * 1.8));
          this.damageMonster(m, thDmg, false, false, '#60a5fa', '🛡️荊棘反震 ', true);
        }
      } else if (_cidNow === 'necro') {
        const bk = _mCfg.book || {};
        if (bk.skeleton === 'reaper') { m._statuses.bleed = Math.max(m._statuses.bleed || 0, nowT + 4000); m._statuses.vulnerable = Math.max(m._statuses.vulnerable || 0, nowT + 4000); }
        if (bk.mage === 'frost_mage') { m._statuses.freeze = Math.max(m._statuses.freeze || 0, nowT + 3500); }
        if (bk.mage === 'shadow_mage') { m._statuses.curse = Math.max(m._statuses.curse || 0, nowT + 4500); }
        if (bk.golem === 'iron_golem') { m._statuses.vulnerable = Math.max(m._statuses.vulnerable || 0, nowT + 4500); }
      } else if (_cidNow === 'assassin') {
        const vn = _mCfg.venom || {};
        if (vn.mainHand === 'corrosive') m._statuses.vulnerable = Math.max(m._statuses.vulnerable || 0, nowT + 4500);
        if (vn.mainHand === 'paralyze')  m._statuses.shock = Math.max(m._statuses.shock || 0, nowT + 4500);
        if (vn.offHand === 'hellvenom')  { m._statuses.burn = Math.max(m._statuses.burn || 0, nowT + 4500); m._statuses.poison = Math.max(m._statuses.poison || 0, nowT + 4500); }
        if (vn.offHand === 'bloodtoxin') { m._statuses.bleed = Math.max(m._statuses.bleed || 0, nowT + 4500); m._statuses.poison = Math.max(m._statuses.poison || 0, nowT + 4500); }
        this._aShadowStars = Math.min(5, (this._aShadowStars || 0) + 1);
      }

      // v235: 近戰三職關鍵被動（Keystone）實戰觸發
      const _ksId = st.activeKeystoneId;
      if (_ksId === 'wk_blood_tide' && (m._statuses.bleed || 0) > nowT && Math.random() < 0.35) {
        this.playAdditiveVfx('vfx_w_rend_arc', m.sprite.x, m.sprite.y - 10, 0.72, 320);
        this.damageMonster(m, Math.round(st.atk * 1.15), true, false, '#f87171', '🩸血河 ', true);
      } else if (_ksId === 'wk_aftershock' && Math.random() < 0.40) {
        this.playAdditiveVfx('vfx_w_hammer_slam', m.sprite.x, m.sprite.y, 0.65, 340);
        this.damageMonster(m, Math.round(st.atk * 0.65), false, false, '#fb923c', '🌋餘震 ', true);
      } else if (_ksId === 'pk_divine_thunder' && isCrit && (m._statuses.conviction || 0) > nowT && Math.random() < 0.45) {
        m._statuses.shock = Math.max(m._statuses.shock || 0, nowT + 4500);
        this.playAdditiveVfx('vfx_p_verdict_sword', m.sprite.x, m.sprite.y - 24, 0.68, 360);
        this.damageMonster(m, Math.round(st.atk * 1.40), true, false, '#38bdf8', '⚡天罰雷 ', true);
      } else if (_ksId === 'pk_hammer_domain') {
        m._statuses.conviction = Math.max(m._statuses.conviction || 0, nowT + 4500);
      } else if (_ksId === 'ak_mirror_phantoms' && Math.random() < 0.40) {
        this.playAdditiveVfx('vfx_a_backstab_pierce', m.sprite.x, m.sprite.y - 8, 0.65, 300);
        this.damageMonster(m, Math.round(dmg * 0.55), isCrit, false, '#c084fc', '👥幻影 ', true);
      } else if (_ksId === 'ak_corrosive_heart' && (m._statuses.poison || 0) > nowT) {
        m._statuses.burn = Math.max(m._statuses.burn || 0, nowT + 4000);
      } else if (_ksId === 'ak_glass_reaper' && Math.random() < 0.45) {
        this.playAdditiveVfx('vfx_a_fivestar_slash', m.sprite.x, m.sprite.y - 10, 0.60, 300);
        this.damageMonster(m, Math.round(dmg * 0.85), true, false, '#f43f5e', '💀死神連擊 ', true);
      } else if (_ksId === 'rk_chain_shadow' && (m._statuses.vulnerable || 0) > nowT && Math.random() < 0.40) {
        m._statuses.curse = Math.max(m._statuses.curse || 0, nowT + 4500);
        this.playAdditiveVfx('vfx_r_shadow_arrow', m.sprite.x, m.sprite.y - 10, 0.72, 340);
        this.damageMonster(m, Math.round(st.atk * 1.25), true, false, '#c084fc', '🌑連鎖暗爆 ', true);
      } else if (_ksId === 'rk_corrosive_venom' && (m._statuses.poison || 0) > nowT && Math.random() < 0.35) {
        m._statuses.burn = Math.max(m._statuses.burn || 0, nowT + 4000);
      } else if (_ksId === 'rk_gale_crossbow' && Math.random() < 0.35) {
        this.playAdditiveVfx('vfx_r_venom_spear', m.sprite.x, m.sprite.y - 8, 0.65, 300);
        this.damageMonster(m, Math.round(st.atk * 0.90), isCrit, false, '#34d399', '🏹連弩 ', true);
      } else if (_ksId === 'mk_shatter_frost' && (m._statuses.freeze || 0) > nowT && Math.random() < 0.45) {
        m._statuses.shock = Math.max(m._statuses.shock || 0, nowT + 4500);
        this.playAdditiveVfx('vfx_m_ice_hex_shield', m.sprite.x, m.sprite.y - 10, 0.74, 340);
        this.damageMonster(m, Math.round(st.atk * 1.35), true, false, '#38bdf8', '❄️碎冰爆 ', true);
      } else if (_ksId === 'mk_inferno_burn') {
        m._statuses.burn = Math.max(m._statuses.burn || 0, nowT + 4500);
      } else if (_ksId === 'mk_void_overload' && Math.random() < 0.40) {
        this.playAdditiveVfx('vfx_m_supernova_core', m.sprite.x, m.sprite.y - 12, 0.72, 340);
        this.damageMonster(m, Math.round(st.atk * 1.30), true, false, '#a78bfa', '🌟虛空過載 ', true);
      } else if (_ksId === 'nk_bone_tyrant' && Math.random() < 0.40) {
        this.playAdditiveVfx('vfx_n_bone_splinter', m.sprite.x, m.sprite.y - 8, 0.76, 340);
        this.damageMonster(m, Math.round(st.atk * 1.15), true, false, '#e2e8f0', '🦴骨刺分裂 ', true);
      } else if (_ksId === 'nk_plague_sea' && (m._statuses.curse || 0) > nowT && Math.random() < 0.45) {
        m._statuses.poison = Math.max(m._statuses.poison || 0, nowT + 4500);
        this.playAdditiveVfx('vfx_n_blight_pool', m.sprite.x, m.sprite.y, 0.72, 340);
        this.damageMonster(m, Math.round(st.atk * 1.30), true, false, '#4ade80', '☠️血海屍爆 ', true);
      }

      // v237: 傳奇威能實戰觸發（塵魔血浪 / 幽影裂片 / 千影回響）
      const _egProcs = st.endgameProcs;
      if (_egProcs && _egProcs.size > 0) {
        if (_egProcs.has('dust_devil') && Math.random() < 0.30) {
          m._statuses.bleed = Math.max(m._statuses.bleed || 0, nowT + 4500);
          this.playAdditiveVfx('vfx_w_rend_arc', m.sprite.x, m.sprite.y - 10, 0.72, 320);
          this.damageMonster(m, Math.round(st.atk * 0.95), true, false, '#fb923c', '🌪️塵魔 ', true);
        }
        if (_egProcs.has('shadow_slicer') && isCrit && Math.random() < 0.30) {
          this.playAdditiveVfx('vfx_r_shadow_arrow', m.sprite.x, m.sprite.y - 10, 0.70, 320);
          this.damageMonster(m, Math.round(st.atk * 1.10), true, false, '#c084fc', '🌑裂片 ', true);
        }
        if (_egProcs.has('clone_echo') && Math.random() < 0.30) {
          this.playAdditiveVfx('vfx_a_backstab_pierce', m.sprite.x, m.sprite.y - 10, 0.68, 300);
          this.damageMonster(m, Math.round(dmg * 0.65), isCrit, false, '#e879f9', '👥影回響 ', true);
        }
      }

      // 4 大複合異常反應結算
      const react = checkCompoundReaction(m, nowT);
      if (react) {
        this.playAdditiveVfx(react.vfx, m.sprite.x, m.sprite.y - 14, 0.96, 480);
        this.spawnFloatingText(m.sprite.x, m.sprite.y - 84, `${react.prefix}${react.name}!`, react.color, 17);
        const rBase = Math.round(st.atk * react.dmgMult);
        for (const other of [...this.monsters]) {
          if (!other || other.hp <= 0) continue;
          const d = Phaser.Math.Distance.Between(m.sprite.x, m.sprite.y, other.sprite.x, other.sprite.y);
          if (d <= react.radius) {
            if (react.shredMs) other.shredUntil = Math.max(other.shredUntil || 0, nowT + react.shredMs);
            const extraPct = react.pctMaxHp ? Math.round(other.maxHp * (other.isBoss ? react.pctMaxHp * 0.5 : react.pctMaxHp)) : 0;
            this.damageMonster(other, rBase + extraPct, true, false, react.color, react.prefix, true);
          }
        }
      }

      // 幸運一擊（Lucky Hit）觸發
      const lkChance = activeMods ? activeMods.luckyChance : (isCrit ? 0.06 : 0);
      if (lkChance > 0 && Math.random() < lkChance) {
        this.playAdditiveVfx('vfx_proc_luckyhit', m.sprite.x, m.sprite.y - 18, 0.56, 340);
        const eff = activeMods?.luckyEffect;
        if (eff?.mpRefund) this.playerMp = Math.min(this.playerMaxMp, this.playerMp + eff.mpRefund);
        if (eff?.cdRefundMs) this.slotCdTimers = this.slotCdTimers.map((t) => t + eff.cdRefundMs);
        if (eff?.bonusMult && m.hp > 0) {
          this.damageMonster(m, Math.max(1, Math.round(dmg * eff.bonusMult)), true, false, '#fde047', '✦幸運 ', true);
        } else {
          this.spawnFloatingText(m.sprite.x, m.sprite.y - 72, '✦幸運一擊!', '#fde047', 14);
        }
      }
    }

    if (m.hp <= 0) {
      this.handleSingleMonsterKilled(m, this.getStats());
    }
  }

  handleSingleMonsterKilled(m, stats) {
    if (stats.killHealPct > 0) this.healHero(Math.round(this.playerMaxHp * (stats.killHealPct / 100)));
    const kTree = this.getState().skillTree || {};
    if ((kTree.r_key_plague || 0) > 0 && this.time.now < (m.markedUntil || 0)) {
      this.playFxSprite('rfx_poison_burst', m.sprite.x, m.sprite.y, 1.35, 0, 420);
      const pdmg = Math.round(stats.atk * 1.4);
      this.monsters.filter((t) => t.hp > 0 && t !== m && Phaser.Math.Distance.Between(m.sprite.x, m.sprite.y, t.sprite.x, t.sprite.y) <= 210)
        .forEach((t) => this.damageMonster(t, pdmg, true, false, '#4ade80', '☠️'));
    }
    if ((kTree.m_key_zero || 0) > 0 && this.time.now < (m.chilledUntil || 0)) {
      this.playFxSprite('mfx_frost_burst', m.sprite.x, m.sprite.y, 1.35, 0, 420);
      const zdmg = Math.round(stats.atk * 1.45);
      this.monsters.filter((t) => t.hp > 0 && t !== m && Phaser.Math.Distance.Between(m.sprite.x, m.sprite.y, t.sprite.x, t.sprite.y) <= 210)
        .forEach((t) => this.damageMonster(t, zdmg, true, false, '#38bdf8', '❄️'));
    }
    if (stats.activeEffects.has('vampiric_aura')) this.healHero(Math.round(this.playerMaxHp * 0.08));
    // v242: 暗黑 4 秘法師【火球附魔連鎖屍爆】與【碎裂冰霜關鍵被動爆破】
    const curState = this.getState();
    if (curState?.classId === 'mage') {
      const enchants = curState?.classMechanic?.mage?.enchants || [];
      if (enchants.includes('m_fireball')) {
        this.mageVfx?.playSeq16('seq16_m_fireball_blast', m.sprite.x, m.sprite.y - 8, 1.02, 22, 16); this.mageVfx?.spawnDebrisBurst(m.sprite.x, m.sprite.y, 'fire', 6);
        const fbDmg = Math.round(stats.atk * 1.05 * this.getMageD4LiveMult());
        this.monsters
          .filter((t) => t.hp > 0 && t !== m && Phaser.Math.Distance.Between(m.sprite.x, m.sprite.y, t.sprite.x, t.sprite.y) <= 215)
          .forEach((t) => this.damageMonster(t, fbDmg, false, false, '#fb923c', '🔥屍爆 ', true));
      }
      const isFrozen = (m._statuses?.freeze || 0) > this.time.now || (m.chilledUntil || 0) > this.time.now;
      if (curState?.activeKeystone?.mage === 'mk_shatter_frost' && isFrozen) {
        this.mageVfx?.playSeq16('seq16_m_frost_nova', m.sprite.x, m.sprite.y - 8, 1.02, 22, 16); this.mageVfx?.spawnDebrisBurst(m.sprite.x, m.sprite.y, 'frost', 6);
        const shDmg = Math.round(stats.atk * 1.35 * this.getMageD4LiveMult());
        this.monsters
          .filter((t) => t.hp > 0 && t !== m && Phaser.Math.Distance.Between(m.sprite.x, m.sprite.y, t.sprite.x, t.sprite.y) <= 230)
          .forEach((t) => this.damageMonster(t, shDmg, true, false, '#38bdf8', '💎碎裂 ', true));
      }
    }
    if (stats.activeEffects.has('blood_nova') && this.time.now < (m.bleedUntil || 0)) {
      this.playFxSprite('wfx_blood_ring', m.sprite.x, m.sprite.y, 1.0, 0, 340);
      const bd = Math.round(stats.atk * 1.1);
      this.monsters.filter((t) => t.hp > 0 && t !== m && Phaser.Math.Distance.Between(m.sprite.x, m.sprite.y, t.sprite.x, t.sprite.y) <= 185)
        .forEach((t) => this.damageMonster(t, bd, false, false, '#f87171', '🩸'));
    }

    this.playFxSprite('fx_explosion', m.sprite.x, m.sprite.y, m.isBoss ? 1.25 : 0.48, 0, 320);
    const mx = m.sprite.x;
    const my = m.sprite.y;

    m.sprite.destroy();
    m.groundShadow.destroy();
    m.castShadow.destroy();
    m.hpBg.destroy();
    m.hpFill.destroy();
    m.nameText.destroy();

    const kStats = this.getStats();
    if ((kStats.killEssence || 0) > 0) {
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + kStats.killEssence);
    }
    if (this.getState().classId === 'necro') {
      // v252: 擊殺怪物必定留下真實地面屍體（供屍爆／屍體觸鬚消耗）
      this.spawnNecroCorpse(mx, my);
      const nKs = this.getState().activeKeystone?.necro || '';
      if (nKs === 'nk_plague_sea' || (kTree.n_key_plague || 0) > 0 || (kStats.activeEffects.has('blood_corpse') && Math.random() < 0.45)) {
        this.necroVfx?.playSeq16('seq16_n_corpse_boom', mx, my - 8, 0.92, 22, 16);
        this.necroVfx?.spawnDebrisBurst(mx, my, 'blood', 6);
        const ceDmg = Math.max(1, Math.round(kStats.atk * 1.45 * (kStats.skillDmgMult || 1) * this.getNecroD4LiveMult()));
        for (const om of [...this.monsters]) {
          if (om && om.hp > 0 && om !== m && om.sprite && Phaser.Math.Distance.Between(mx, my, om.sprite.x, om.sprite.y) <= 200) {
            this.damageMonster(om, ceDmg, true, false, '#fb7185', '💥連鎖屍爆 ', true);
          }
        }
      }
    }
    if (this.getState().classId === 'assassin' && (kTree.a_key_venom || 0) > 0 && (this.time.now < (m.bleedUntil || 0) || this.time.now < (m.poisonedUntil || 0))) {
      this.playFxSprite('afx_venom', mx, my, 1.05, 0, 380);
      const vDmg = Math.max(1, Math.round(kStats.atk * 1.45 * (1 + (kStats.poisonDmgPct || 0) / 100)));
      for (const om of this.monsters) {
        if (om.hp > 0 && om !== m && Phaser.Math.Distance.Between(mx, my, om.sprite.x, om.sprite.y) <= 195) {
          this.damageMonster(om, vDmg, true, false, '#4ade80', '☠️');
        }
      }
    }
    this.waveKills += 1;
    this.comboCount = (this.comboCount || 0) + 1;
    this.comboExpireAt = (this.time?.now || 0) + 5500;
    if (m.isBoss) {
      for (let bi = 0; bi < 8; bi++) {
        const coin = this.add.circle(mx, my, 5, 0xfacc15, 0.95).setDepth(4450);
        const ang = (Math.PI * 2 * bi) / 8;
        this.tweens.add({ targets: coin, x: mx + Math.cos(ang) * 76, y: my + Math.sin(ang) * 48 - 18, alpha: 0, duration: 540, ease: 'Quad.easeOut', onComplete: () => coin.destroy() });
      }
    }
    this.mapKills = (this.mapKills || 0) + 1;
    const dropResult = this.callbacks.onMonsterKilled(m, false);
    if (dropResult && dropResult.item) {
      this.spawnLootBeam(mx, my + 24, dropResult.item);
    }
    if (dropResult && dropResult.pet) {
      this.spawnLootBeam(mx + 22, my + 18, { ...dropResult.pet, isPet: true });
    }
    if (dropResult && dropResult.potion) {
      const p = dropResult.potion;
      const orb = this.add.image(mx, my, 'fx_glow').setTint(p.color).setScale(0.42).setDepth(3600);
      this.spawnFloatingText(mx, my - 28, p.label, '#fde68a', 13);
      this.tweens.add({
        targets: orb,
        x: this.hero.x,
        y: this.hero.y - 10,
        scale: 0.14,
        alpha: 0,
        duration: 480,
        ease: 'Cubic.easeIn',
        onComplete: () => orb.destroy(),
      });
    }
    if (this.mapKills % 24 === 0) {
      this.potionCharges = Math.min(this.potionMaxCharges, this.potionCharges + 1);
      const curStage = this.getState().stage || 1;
      const bossMob = spawnSingleMonster(curStage, true);
      const bang = Math.random() * Math.PI * 2;
      const bx = Phaser.Math.Clamp(this.hero.x + Math.cos(bang) * 620, 260, MAP_W - 260);
      const by = Phaser.Math.Clamp(this.hero.y + Math.sin(bang) * 460, 260, MAP_H - 220);
      this.spawnMonsterInstance(bossMob, bang, bx, by);
      this.spawnFloatingText(this.hero.x, this.hero.y - 115, '💀 地圖首領降臨！', '#fb923c', 17);
    }
  }

  handleHeroDefeat(reason) {
    this.isTransitioning = true;
    this.playerHp = this.playerMaxHp;
    this.updateHeroHpBar();
    this.callbacks.onPlayerDefeated(reason);
    this.time.delayedCall(900, () => {
      this.spawnWaveSquad();
    });
  }

  healHero(amount) {
    if (amount <= 0) return;
    this.playerHp = Math.min(this.playerMaxHp, this.playerHp + amount);
    this.updateHeroHpBar();
  }

  addPotionCharge(cnt = 1) {
    this.potionCharges = Math.min(this.potionMaxCharges, (this.potionCharges || 0) + cnt);
  }

  restoreMana(amount) {
    if (amount <= 0) return;
    this.playerMp = Math.min(this.playerMaxMp, this.playerMp + amount);
  }

  updateHeroHpBar() {
    if (!this.heroHpFill) return;
    const ratio = Math.max(0, Math.min(1, this.playerHp / Math.max(1, this.playerMaxHp)));
    this.heroHpFill.width = 108 * ratio;
    const shTxt = this.mageShieldHp > 0 ? ` (+${formatNum(this.mageShieldHp)}🛡️)` : '';
    this.heroHpText.setText(`${formatNum(this.playerHp)} / ${formatNum(this.playerMaxHp)}${shTxt}`);
  }

  spawnAmbientEmber() {
    const cam = this.cameras.main;
    const color = ZONE_EMBERS[this.getZoneIdx()];
    const px = cam.scrollX + Phaser.Math.Between(30, Math.max(80, cam.width - 30));
    const py = cam.scrollY + Phaser.Math.Between(60, Math.max(120, cam.height - 40));
    const dot = this.add.image(px, py, 'fx_glow').setTint(color).setScale(0.22).setAlpha(0.75).setBlendMode(Phaser.BlendModes.ADD).setDepth(3900);
    this.tweens.add({
      targets: dot,
      y: py - Phaser.Math.Between(45, 95),
      x: px + Phaser.Math.Between(-24, 24),
      alpha: 0,
      duration: Phaser.Math.Between(1200, 1900),
      onComplete: () => dot.destroy(),
    });
  }

  startTowerRun(floor = 1) {
    this.towerMode = true;
    this.towerFloor = Math.max(1, floor);
    this.towerEndAt = (this.time?.now || 0) + 60000;
    this.towerClearing = false;
    this.clearMonsters();
    this.collectAllGroundLoot?.();

    const banner = document.getElementById('tower-hud-banner');
    if (banner) banner.classList.remove('hidden');
    const fl = document.getElementById('tower-floor-lbl');
    if (fl) fl.textContent = `🌀 無盡深淵 第 ${this.towerFloor} 層`;

    const effStage = Math.min(100, Math.max(1, this.towerFloor * 3));
    const scaleMult = Math.pow(1.16, this.towerFloor - 1);
    const count = Math.min(12, 5 + Math.floor(this.towerFloor / 2));
    for (let i = 0; i < count; i++) {
      const mob = spawnSingleMonster(effStage, i === count - 1);
      mob.maxHp = Math.round(mob.maxHp * scaleMult);
      mob.hp = mob.maxHp;
      mob.atk = Math.round(mob.atk * (1 + (this.towerFloor - 1) * 0.1));
      if (i === count - 1) mob.name = `【第${this.towerFloor}層守衛】${mob.name}`;
      const ang = (Math.PI * 2 * i) / count;
      const dist = i === count - 1 ? 340 : 250 + (i % 3) * 55;
      const mx = Phaser.Math.Clamp(this.hero.x + Math.cos(ang) * dist, 280, MAP_W - 280);
      const my = Phaser.Math.Clamp(this.hero.y + Math.sin(ang) * dist, 280, MAP_H - 240);
      this.spawnBossAt(mob, mx, my);
    }
    this.showBossAlertBanner?.(`無盡深淵 第 ${this.towerFloor} 層試煉`);
  }

  exitTowerMode(reason = '') {
    if (!this.towerMode) return;
    this.towerMode = false;
    this.towerClearing = false;
    document.getElementById('tower-hud-banner')?.classList.add('hidden');
    this.collectAllGroundLoot?.();
    this.callbacks?.onTowerExit?.(this.towerFloor, reason);
  }

  showBossAlertBanner(bossName) {
    const el = document.getElementById('boss-alert-banner');
    if (el) {
      el.innerHTML = `☠️ 警告：深淵首領【${bossName}】降臨戰場！`;
      el.classList.remove('hidden');
      clearTimeout(this._bossBannerTimer);
      this._bossBannerTimer = setTimeout(() => el.classList.add('hidden'), 3200);
    }
    window.__battleSfx?.playBossAlert?.();
    if (window.__gameSettings?.graphics?.screenShake !== false) {
      this.cameras.main.shake(260, 0.008);
    }
  }

  castBossRedCircle(boss) {
    if (!boss || boss.hp <= 0 || !this.hero) return;
    const tx = this.hero.x;
    const ty = this.hero.y + 12;
    const radius = 104;
    const outer = this.add.circle(tx, ty, radius, 0xef4444, 0.14)
      .setStrokeStyle(2.5, 0xef4444, 0.92).setDepth(38);
    const inner = this.add.circle(tx, ty, 10, 0xdc2626, 0.34).setDepth(39);
    const warnTxt = this.add.text(tx, ty - radius - 12, '⚠️ 首領重擊！快閃避', {
      fontSize: '13px', color: '#fca5a5', fontFamily: 'Noto Sans TC, sans-serif', fontStyle: 'bold', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(4200);

    this.tweens.add({
      targets: inner,
      scale: radius / 10,
      duration: 1250,
      ease: 'Linear',
      onComplete: () => {
        outer.destroy();
        inner.destroy();
        warnTxt.destroy();
        if (!this.scene?.isActive?.() || !boss || boss.hp <= 0 || !this.hero) return;
        const burst = this.add.circle(tx, ty, radius, 0xf97316, 0.55).setBlendMode(Phaser.BlendModes.ADD).setDepth(4510);
        this.tweens.add({ targets: burst, scale: 1.25, alpha: 0, duration: 280, onComplete: () => burst.destroy() });
        if (window.__gameSettings?.graphics?.screenShake !== false) this.cameras.main.shake(180, 0.01);

        const dist = Math.hypot(this.hero.x - tx, (this.hero.y + 12) - ty);
        if (dist <= radius) {
          this.performMonsterAttack(boss, this.getStats(), 1.55, true);
        } else {
          this._perfectDodgeUntil = (this.time?.now || 0) + 3500;
          window.__battleSfx?.playPerfectDodge?.();
          this.spawnFloatingText(this.hero.x, this.hero.y - 76, '✨ 完美閃避！攻速↑', '#67e8f9', 16);
        }
      },
    });
  }

  updateCombatFeel(time) {
    // 1. 低血量心跳紅幕 (<30% HP)
    const vig = document.getElementById('low-hp-vignette');
    if (vig) {
      const low = this.playerMaxHp > 0 && (this.playerHp / this.playerMaxHp) < 0.3;
      vig.classList.toggle('hidden', !low);
    }

    // 2. 連斬計數更新
    const cBox = document.getElementById('hud-combo-box');
    if (cBox) {
      if (this.comboCount > 0 && time > (this.comboExpireAt || 0)) {
        this.comboCount = 0;
      }
      if (this.comboCount >= 3) {
        cBox.classList.remove('hidden');
        const cNum = document.getElementById('combo-count');
        const cTxt = document.getElementById('combo-bonus-txt');
        if (cNum) cNum.textContent = String(this.comboCount);
        const pct = this.comboCount >= 100 ? 30 : (this.comboCount >= 60 ? 18 : (this.comboCount >= 30 ? 10 : (this.comboCount >= 15 ? 5 : 0)));
        if (cTxt) cTxt.textContent = pct > 0 ? `經驗 / 金幣 +${pct}%` : '持續連斬觸發加成';
      } else {
        cBox.classList.add('hidden');
      }
    }

    // 2.5 無盡深淵爬塔計時與通關判定
    if (this.towerMode) {
      const leftMs = Math.max(0, (this.towerEndAt || 0) - time);
      const aliveCnt = (this.monsters || []).filter((m) => m.hp > 0).length;
      const tl = document.getElementById('tower-timer-lbl');
      const ml = document.getElementById('tower-mobs-lbl');
      if (tl) tl.textContent = `⏱️ ${(leftMs / 1000).toFixed(1)}s`;
      if (ml) ml.textContent = `剩餘 ${aliveCnt} 隻`;
      if (aliveCnt === 0 && !this.towerClearing) {
        this.towerClearing = true;
        this.callbacks?.onTowerFloorCleared?.(this.towerFloor);
        this.time.delayedCall(2000, () => {
          if (this.towerMode && this.scene?.isActive?.()) {
            this.startTowerRun(this.towerFloor + 1);
          }
        });
      } else if (leftMs <= 0 && aliveCnt > 0) {
        this.exitTowerMode('時間耗盡，安全撤退回主城！');
      }
    }

    // 3. 首領每 6.5 秒施放地面紅圈預警重擊
    if (time >= (this._bossTelegraphAt || 0) && this.monsters?.length) {
      const aliveBoss = this.monsters.find((m) => m.hp > 0 && m.isBoss);
      if (aliveBoss && Math.hypot(aliveBoss.sprite.x - this.hero.x, aliveBoss.sprite.y - this.hero.y) < 620) {
        this._bossTelegraphAt = time + 6500;
        this.castBossRedCircle(aliveBoss);
      }
    }
  }

  updatePetCompanion(time) {
    if (!this.petBuddy || !this.hero) return;
    const st = this.getState?.();
    const pet = getPetDef(st?.equippedPetId);
    if (!pet) {
      this.petBuddy.setVisible(false);
      this.petAura?.setVisible(false);
      this.petShadow?.setVisible(false);
      this.petLabel?.setVisible(false);
      this._lastBattlePetId = null;
      return;
    }
    const rec = (st?.pets || []).find((x) => x.petId === pet.id);
    const upg = rec?.upgradeLevel || 0;
    const rar = getPetRarityMeta(pet.rarity);
    const sch = PET_SCHOOLS[pet.school] || PET_SCHOOLS.fire;
    const texKey = `pet_${pet.id}`;
    if (this.textures.exists(texKey) && this.petBuddy.texture?.key !== texKey) {
      this.petBuddy.setTexture(texKey);
    }

    if (this._lastBattlePetId && this._lastBattlePetId !== pet.id) {
      const burst = this.add.image(this.petBuddy.x, this.petBuddy.y, 'fx_glow').setTint(pet.tint).setScale(0.4).setAlpha(0.95).setBlendMode(Phaser.BlendModes.ADD).setDepth(this.petBuddy.y + 6);
      this.tweens.add({ targets: burst, scale: 2.4, alpha: 0, duration: 420, onComplete: () => burst.destroy() });
    }
    this._lastBattlePetId = pet.id;

    const pickR = getPetPickupRadius(pet, upg);
    let tx = this.hero.x + (this.heroFlipX ? 54 : -54);
    let ty = this.hero.y - 18;
    const nearLoot = this.findNearestGroundLoot?.(this.hero.x, this.hero.y);
    if (nearLoot && Math.hypot(nearLoot.x - this.hero.x, nearLoot.y - this.hero.y) <= pickR + 30) {
      tx = nearLoot.x;
      ty = nearLoot.y - 10;
    }

    const nx = Phaser.Math.Linear(this.petBuddy.x, tx, 0.13);
    const ny = Phaser.Math.Linear(this.petBuddy.y, ty, 0.13);
    const stepX = nx - this.petBuddy.x;
    const moveSpd = Math.hypot(stepX, ny - this.petBuddy.y);
    const moving = moveSpd > 0.5;
    const bob = moving ? Math.abs(Math.sin(time * 0.017)) * 10 : Math.sin(time * 0.0055) * 5;
    const sxScale = moving ? 0.46 * (1.07 - Math.abs(Math.sin(time * 0.017)) * 0.1) : 0.46 * (1 + Math.sin(time * 0.0055) * 0.04);
    const syScale = moving ? 0.46 * (0.93 + Math.abs(Math.sin(time * 0.017)) * 0.12) : 0.46 * (1 - Math.sin(time * 0.0055) * 0.04);
    const flip = Math.abs(stepX) > 0.4 ? (stepX < 0) : this.heroFlipX;
    const tilt = moving ? Phaser.Math.Clamp(stepX * 0.045, -0.24, 0.24) : Math.sin(time * 0.003) * 0.04;

    this.petBuddy.setVisible(true).setScale(sxScale, syScale).setFlipX(flip).setRotation(tilt).setPosition(nx, ny - bob).setDepth(ny + 2);
    this.petShadow?.setVisible(true).setPosition(nx, ny + 28).setScale(0.62 - bob * 0.012, 0.24).setDepth(2);
    this.petAura?.setVisible(true).setTint(pet.tint).setPosition(nx, ny - bob + 4).setScale(0.9 + Math.sin(time * 0.009) * 0.15).setAlpha(moving ? 0.45 : 0.28).setDepth(ny + 1);
    this.petLabel?.setVisible(true).setText(`${pet.name}${upg > 0 ? ` +${upg}` : ''}`).setColor(rar.color).setPosition(nx, ny - bob - 32).setDepth(ny + 4);

    if (moving && time >= (this._petTrailAt || 0)) {
      this._petTrailAt = time + 90;
      const pt = this.add.image(nx, ny - bob + 6, 'fx_glow').setTint(pet.tint).setScale(0.28).setAlpha(0.68).setBlendMode(Phaser.BlendModes.ADD).setDepth(ny);
      this.tweens.add({ targets: pt, y: pt.y - 12, scale: 0.05, alpha: 0, duration: 360, onComplete: () => pt.destroy() });
    }

    if (time >= (this._petAutoAtkAt || 0) && this.monsters?.length) {
      const target = this.findNearestMonster?.(this.petBuddy.x, this.petBuddy.y);
      if (target && target.hp > 0 && Math.hypot(target.sprite.x - this.petBuddy.x, target.sprite.y - this.petBuddy.y) <= 460) {
        this._petAutoAtkAt = time + 2400;
        const stats = this.getStats();
        const codex = getPetCodexInfo(st?.pets, st?.petCodex);
        const dmg = Math.max(1, Math.round(stats.atk * (0.35 + upg * 0.08) * (1 + codex.bonusPct / 100)));
        const px = this.petBuddy.x, py = this.petBuddy.y;
        const bolt = this.add.image(px, py, 'fx_glow').setTint(pet.tint).setScale(0.45).setBlendMode(Phaser.BlendModes.ADD).setDepth(4510);
        this.tweens.add({
          targets: bolt,
          x: target.sprite.x,
          y: target.sprite.y - 10,
          duration: 240,
          onComplete: () => {
            bolt.destroy();
            if (target.hp > 0) {
              this.spawnPetExclusiveFx(sch, px, py, target.sprite.x, target.sprite.y - 10, pet.tint);
              this.damageMonster(target, dmg, false, false, sch.color, '🐾');
            }
          },
        });
      }
    }
  }

  spawnPetExclusiveFx(sch, px, py, mx, my, tint) {
    // 寵物專屬元素特效（完全不借用其他職業招牌技能貼圖）
    const ring = this.add.circle(mx, my, 12, tint, 0.25).setStrokeStyle(3, tint, 0.95).setBlendMode(Phaser.BlendModes.ADD).setDepth(4515);
    this.tweens.add({ targets: ring, scale: sch.derivative === 'void_pull' ? 3.2 : 2.6, alpha: 0, duration: 360, onComplete: () => ring.destroy() });
    const core = this.add.image(mx, my - 6, 'fx_glow').setTint(tint).setScale(1.15).setAlpha(0.9).setBlendMode(Phaser.BlendModes.ADD).setDepth(4516);
    this.tweens.add({ targets: core, scale: 0.2, alpha: 0, duration: 320, onComplete: () => core.destroy() });
    if (sch.derivative === 'holy_pillar') {
      const pil = this.add.rectangle(mx, my - 70, 20, 150, tint, 0.72).setBlendMode(Phaser.BlendModes.ADD).setDepth(4514);
      this.tweens.add({ targets: pil, scaleX: 0.1, alpha: 0, duration: 360, onComplete: () => pil.destroy() });
    } else if (sch.derivative === 'chain_arc') {
      const g = this.add.graphics().setDepth(4516);
      g.lineStyle(3, tint, 0.95);
      g.beginPath();
      g.moveTo(px, py);
      g.lineTo((px + mx) / 2 + Phaser.Math.Between(-18, 18), (py + my) / 2 + Phaser.Math.Between(-18, 18));
      g.lineTo(mx, my - 8);
      g.strokePath();
      this.tweens.add({ targets: g, alpha: 0, duration: 240, onComplete: () => g.destroy() });
    }
  }

  triggerPetSkillDerivative(aimX, aimY) {
    const st = this.getState?.();
    const pet = getPetDef(st?.equippedPetId);
    if (!pet || !this.hero || !this.monsters) return;
    const now = this.time?.now || 0;
    if (now < (this._lastPetProcAt || 0)) return;
    this._lastPetProcAt = now + 420;

    const stats = this.getStats();
    const sch = PET_SCHOOLS[pet.school] || PET_SCHOOLS.fire;
    const petRec = (st?.pets || []).find((x) => x.petId === pet.id);
    const petUpg = petRec?.upgradeLevel || 0;
    const petUpgMult = 1 + petUpg * 0.18;
    const codex = getPetCodexInfo(st?.pets, st?.petCodex);
    const extraHits = petUpg >= 10 ? 3 : (petUpg >= 8 ? 2 : (petUpg >= 6 ? 1 : 0));
    const dmg = Math.max(1, Math.round(stats.atk * (pet.dmgMult || 0.45) * petUpgMult * (1 + codex.bonusPct / 100) * (stats.skillDmgMult || 1)));
    const alive = this.monsters.filter((m) => m.hp > 0);
    if (!alive.length) return;

    if (this.petAura) {
      this.tweens.add({ targets: this.petAura, scale: 1.85, alpha: 0.85, duration: 180, yoyo: true });
    }
    const px = this.petBuddy?.x ?? this.hero.x;
    const py = this.petBuddy?.y ?? this.hero.y;

    const targets = alive
      .map((m) => ({ m, d: Math.hypot(m.sprite.x - this.hero.x, m.sprite.y - this.hero.y) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, (pet.bonusHits || 2) + extraHits)
      .map((x) => x.m);

    for (const tm of targets) {
      const mx = tm.sprite.x, my = tm.sprite.y;
      const trail = this.add.image(px, py, 'fx_glow').setTint(pet.tint).setScale(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(4512);
      this.tweens.add({ targets: trail, x: mx, y: my - 10, scale: 0.15, alpha: 0, duration: 220, onComplete: () => trail.destroy() });

      if (sch.derivative === 'fire_wave') {
        this.spawnPetExclusiveFx(sch, px, py, mx, my - 10, pet.tint);
        this.damageMonster(tm, dmg, true, false, sch.color, '🔥');
      } else if (sch.derivative === 'chain_arc') {
        this.spawnPetExclusiveFx(sch, px, py, mx, my - 10, pet.tint);
        this.damageMonster(tm, dmg, true, false, sch.color, '⚡');
      } else if (sch.derivative === 'frost_nova') {
        this.spawnPetExclusiveFx(sch, px, py, mx, my, pet.tint);
        tm.chilledUntil = Math.max(tm.chilledUntil || 0, now + 2200);
        this.damageMonster(tm, dmg, true, false, sch.color, '❄️');
      } else if (sch.derivative === 'shadow_bolt') {
        this.spawnPetExclusiveFx(sch, px, py, mx, my - 8, pet.tint);
        this.damageMonster(tm, dmg, true, false, sch.color, '🦇');
      } else if (sch.derivative === 'holy_pillar') {
        this.spawnPetExclusiveFx(sch, px, py, mx, my, pet.tint);
        this.damageMonster(tm, dmg, true, false, sch.color, '✨');
      } else if (sch.derivative === 'void_pull') {
        this.spawnPetExclusiveFx(sch, px, py, mx, my, pet.tint);
        tm.sprite.x = Phaser.Math.Linear(tm.sprite.x, targets[0].sprite.x, 0.32);
        tm.sprite.y = Phaser.Math.Linear(tm.sprite.y, targets[0].sprite.y, 0.32);
        this.damageMonster(tm, dmg, true, false, sch.color, '🌌');
      }
    }
    if (sch.derivative === 'holy_pillar' && pet.bonusHits >= 2) {
      this.healHero?.(Math.max(1, Math.round(stats.maxHp * (pet.bonusHits * 0.01))));
    }
  }

  findNearestGroundLoot(x, y) {
    if (!this.groundLoot || !this.groundLoot.length) return null;
    let best = null, bd = Infinity;
    for (const l of this.groundLoot) {
      const d = Math.hypot(l.x - x, l.y - y);
      if (d < bd) { bd = d; best = l; }
    }
    return best;
  }

  spawnLootBeam(x, y, item) {
    if (!item) return;
    if (!this.groundLoot) this.groundLoot = [];
    const r = RARITIES[item.rarity] || RARITIES.common;
    const isHigh = item.rarity === 'legendary' || item.rarity === 'rare' || item.rarity === 'set';
    const lx = Phaser.Math.Clamp(x + Phaser.Math.Between(-28, 28), 220, MAP_W - 220);
    const ly = Phaser.Math.Clamp(y + Phaser.Math.Between(-16, 22), 240, MAP_H - 220);

    const beamH = isHigh ? 210 : 135;
    const beamW = isHigh ? 20 : 12;
    const beam = this.add.rectangle(lx, ly - beamH / 2, beamW, beamH, r.beam, isHigh ? 0.62 : 0.38)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(4400);
    const orb = this.add.circle(lx, ly - 4, isHigh ? 9 : 6, r.beam, 1)
      .setStrokeStyle(2, 0xffffff).setDepth(4401);

    const labelStr = item.isPet ? `${item.emoji || '🐾'} [寵物・${r.label}] ${item.name}` : `[${r.label}] ${item.name}`;
    const tag = this.add.text(lx, ly - 42, labelStr, {
      fontSize: (isHigh || item.isPet) ? '17px' : '16px', color: r.color, fontFamily: 'Noto Sans TC, sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(4403);
    const padW = Math.max(120, tag.width + 24);
    const plate = this.add.rectangle(lx, ly - 42, padW, 30, 0x090b12, 0.92)
      .setStrokeStyle(2, r.beam).setDepth(4402)
      .setInteractive({ useHandCursor: true });

    const lootObj = {
      item, x: lx, y: ly, beam, orb, plate, tag,
      spawnAt: this.time?.now || 0,
      picked: false,
    };

    plate.on('pointerdown', (pointer) => {
      pointer.event?.stopPropagation?.();
      this.lootClickTarget = lootObj;
      this.manualOverrideTimer = 0;
    });

    // 小幅彈跳落地效果
    orb.y = ly - 26;
    this.tweens.add({ targets: orb, y: ly - 4, duration: 280, ease: 'Bounce.easeOut' });
    this.tweens.add({ targets: orb, y: '-=4', duration: 900, yoyo: true, repeat: -1, delay: 300 });
    if (isHigh) {
      this.tweens.add({ targets: beam, alpha: 0.35, duration: 850, yoyo: true, repeat: -1 });
    }

    window.__battleSfx?.playLootDrop?.(item.rarity, !!item.isPet);
    this.groundLoot.push(lootObj);
  }

  pickupGroundLoot(loot, instant = false) {
    if (!loot || loot.picked) return;
    loot.picked = true;
    const idx = this.groundLoot ? this.groundLoot.indexOf(loot) : -1;
    if (idx >= 0) this.groundLoot.splice(idx, 1);
    if (this.lootClickTarget === loot) this.lootClickTarget = null;

    const r = RARITIES[loot.item.rarity] || RARITIES.common;
    loot.beam?.destroy();
    loot.plate?.destroy();
    loot.tag?.destroy();

    if (instant || !this.hero) {
      loot.orb?.destroy();
    } else {
      this.spawnFloatingText(loot.x, loot.y - 24, `+ ${loot.item.name}`, r.color, 13);
      this.tweens.add({
        targets: loot.orb,
        x: this.hero.x,
        y: this.hero.y - 12,
        scale: 0.25,
        alpha: 0,
        duration: 240,
        ease: 'Cubic.easeIn',
        onComplete: () => loot.orb?.destroy(),
      });
    }
    if (!instant) window.__battleSfx?.playPickup?.();
    this.callbacks?.onLootPickedUp?.(loot.item);
  }

  updateGroundLoot(time) {
    if (!this.groundLoot || !this.groundLoot.length || !this.hero) return;
    for (let i = this.groundLoot.length - 1; i >= 0; i--) {
      const l = this.groundLoot[i];
      if (!l || l.picked) continue;
      const stG = this.getState?.();
      const eqPetG = getPetDef(stG?.equippedPetId);
      const eqRecG = (stG?.pets || []).find((x) => x.petId === eqPetG?.id);
      const pickDist = getPetPickupRadius(eqPetG, eqRecG?.upgradeLevel || 0);
      const d = Math.hypot(this.hero.x - l.x, this.hero.y - l.y);
      const dp = this.petBuddy?.visible ? Math.hypot(this.petBuddy.x - l.x, this.petBuddy.y - l.y) : Infinity;
      if (d <= pickDist || dp <= 64 || (time - l.spawnAt) > 60000) {
        this.pickupGroundLoot(l, false);
      }
    }
  }

  collectAllGroundLoot() {
    if (!this.groundLoot || !this.groundLoot.length) return;
    const list = [...this.groundLoot];
    for (const l of list) this.pickupGroundLoot(l, true);
    this.groundLoot = [];
  }

  spawnFloatingText(x, y, msg, color, fontSize = 16) {
    if (window.__powerSaveMode) return;
    const dens = window.__gameSettings?.graphics?.particles || 'high';
    if (dens === 'low' && Math.random() < 0.45 && fontSize < 18) return;
    const txt = this.add.text(x, y, msg, {
      fontSize: `${fontSize}px`,
      color,
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(4600);

    this.tweens.add({
      targets: txt,
      y: y - 42,
      alpha: 0,
      duration: 700,
      ease: 'Cubic.easeOut',
      onComplete: () => txt.destroy(),
    });
  }

  handleResize(w, h) {
    if (w < 10 || h < 10) return;
    if (this.waveInfoText) this.waveInfoText.setPosition(w / 2, 24);
  }
}
