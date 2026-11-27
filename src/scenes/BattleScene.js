import { getClassMechanicConfig } from '../logic/classMechanics.js?v=261';
import { computeSkillBuildMods, checkCompoundReaction, getSmartAutoSlotOrder } from '../logic/buildEngine.js?v=261';
import { CLASSES } from '../data/classes.js?v=99';
import { WARRIOR_SKILLS } from '../data/warriorSkills.js?v=255';
import { RANGER_SKILLS } from '../data/rangerSkills.js?v=259';
import { MAGE_SKILLS } from '../data/mageSkills.js?v=241';
import { PALADIN_SKILLS } from '../data/paladinSkills.js?v=263';
import { NECRO_SKILLS } from '../data/necroSkills.js?v=251';
import { ASSASSIN_SKILLS } from '../data/assassinSkills.js?v=261';
import { RARITIES } from '../data/items.js?v=99';
import { PET_CATALOG, getPetDef, PET_SCHOOLS, getPetRarityMeta, getPetPickupRadius, getPetCodexInfo } from '../data/pets.js?v=99';
import { createStageEncounters, spawnSingleMonster, getChapterIdx, getStageLabel, ZONE_OBSTACLES } from '../data/monsters.js?v=254';
import { formatNum } from '../logic/statCalc.js?v=254';
import { MageVfxDirector } from '../vfx/MageVfxDirector.js?v=266';
import { NecroVfxDirector } from '../vfx/NecroVfxDirector.js?v=266';
import { WarriorVfxDirector } from '../vfx/WarriorVfxDirector.js?v=266';
import { RangerVfxDirector } from '../vfx/RangerVfxDirector.js?v=266';
import { AssassinVfxDirector } from '../vfx/AssassinVfxDirector.js?v=266';
import { PaladinVfxDirector } from '../vfx/PaladinVfxDirector.js?v=266';
import { FloatingTextPool } from '../vfx/FloatingTextPool.js?v=298';
import { ParticlePool } from '../vfx/ParticlePool.js?v=266';
import { TrainingArenaController } from '../combat/TrainingArenaController.js?v=308-2';
import { HERO_V307_READY, getHeroAtlasInfo, getSkillAnimAction, getActionAnimDurationMs, resolveHeroAnimKey, safeQueueAtlas, waitAtlasReady } from '../combat/HeroAnimRouter.js?v=309-1';
import { BattleMiniDpsHud } from '../ui/BattleMiniDpsHud.js?v=302';
import { CameraZoomHelper } from './CameraZoomHelper.js?v=282';
import { MonsterVfxDirector } from '../vfx/MonsterVfxDirector.js?v=293';
import { MonsterSkillEngine } from '../combat/MonsterSkillEngine.js?v=278';
import { warriorCombatMethods } from '../combat/classes/warriorCombat.js?v=266';
import { rangerCombatMethods } from '../combat/classes/rangerCombat.js?v=266';
import { mageCombatMethods } from '../combat/classes/mageCombat.js?v=302';
import { paladinCombatMethods } from '../combat/classes/paladinCombat.js?v=266';
import { necroCombatMethods } from '../combat/classes/necroCombat.js?v=302';
import { assassinCombatMethods } from '../combat/classes/assassinCombat.js?v=266';


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
    // v256: 暗黑 4 戰士戰場實體引擎（動態火山圖騰／3 位先祖英靈／磁吸怒氣血珠／狂亂與行走武器庫層數）
    this.warriorEntities = [];
    this.warriorRageOrbs = [];
    this.warriorFrenzyStacks = 0;
    this.warriorFrenzyUntil = 0;
    this.warriorBashCount = 0;
    this.warriorBerserkUntil = 0;
    this.warriorRallyUntil = 0;
    this.warriorArsenalSet = new Set();
    // v260: 暗黑 4 暗影遊俠戰場實體引擎（動態暗影分身／煙霧誘餌／劇毒蒺藜／血刃捕獸夾／磁吸連擊結晶／精準計數）
    this.rangerEntities = [];
    this.rangerComboOrbs = [];
    this.rangerComboStars = 0;
    this.rangerPrecisionCount = 0;
    this.rangerForcefulCount = 0;
    this.rangerWindwalkUntil = 0;
    // v262: 暗黑 4 暗影刺客戰場實體引擎（動態暗影分身／環繞血毒魔刃／猩紅毒霧核心／影爆替身／磁吸暗影血星）
    this.assassinEntities = [];
    this.assassinStarOrbs = [];
    this.assassinVenomOverloadUntil = 0;
    this.cracklingOrbs = [];
    this.heroBarrierHp = 0;
    this.heroBarrierUntil = 0;
    this.heroBarrierSprite = null;
    this.heroBarrierKey = '';
    this.enlightenmentStacks = 0;
    this.enlightenmentLastElem = '';
    this.enlightenmentUntil = 0;

    this.autoMode = 'move'; // 'move' (自動巡航) | 'stand' (自動站樁不移動) | 'manual' (純手動)
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

    const initHeroInfo = getHeroAtlasInfo(initCid);
    safeQueueAtlas(this, initHeroInfo.baseKey, initHeroInfo.basePng, initHeroInfo.baseJson);
    if (initHeroInfo.skillsReady) {
      safeQueueAtlas(this, initHeroInfo.skillsKey, initHeroInfo.skillsPng, initHeroInfo.skillsJson);
    }
    if (initCid === 'necro') {
      this.loadedSummons = true;
      safeQueueAtlas(this, 'atlas_summons', './assets/heroes/atlas_summons.png', './assets/heroes/atlas_summons.json');
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

    safeQueueAtlas(this, `atlas_ch${initCh}`, `./assets/monsters/atlas_ch${initCh}.png`, `./assets/monsters/atlas_ch${initCh}.json`);
    safeQueueAtlas(this, 'atlas_legacy', './assets/monsters/atlas_legacy.png', './assets/monsters/atlas_legacy.json');
    this.load.image(`map_zone_${initZone}`, `./assets/bg/map_${initZone}.jpg`);

    for (let i = 0; i < 8; i++) {
      this.load.image(`obs_${i}`, `./assets/props/obs_${i}.png`);
    }

    FX_NAMES.forEach((fx) => {
      this.load.image(fx, `./assets/fx/${fx}.png`);
    });
    // v265: 職業 VFX 按需懶載入（首開只載入當前職業 WebP 圖集，大幅縮減載入時間與顯存）
    this.loadedVfxClasses = new Set();
    this.preloadClassVfx(initCid);
    MonsterVfxDirector.preload(this);
  }

  getVfxDirectorClass(cid) {
    const map = {
      mage: MageVfxDirector,
      necro: NecroVfxDirector,
      warrior: WarriorVfxDirector,
      ranger: RangerVfxDirector,
      assassin: AssassinVfxDirector,
      paladin: PaladinVfxDirector,
    };
    return map[cid] || null;
  }

  preloadClassVfx(cid) {
    if (!cid) return;
    if (cid === 'mage') {
      const DARK_MAGE_SEQS = [
        'anim_m_fireball_blast', 'anim_m_firewall', 'anim_m_frozen_orb', 'anim_m_blizzard',
        'anim_m_ball_lightning', 'anim_m_supernova', 'anim_m_meteor', 'anim_m_frost_nova',
        'anim_m_lightning_strike', 'anim_m_inferno',
      ];
      for (const sk of DARK_MAGE_SEQS) {
        if (!this.textures.exists(sk)) {
          this.load.spritesheet(sk, `./assets/fx/${sk}.png?v=246`, { frameWidth: 320, frameHeight: 320 });
        }
      }
    }
    const DirCls = this.getVfxDirectorClass(cid);
    if (DirCls) DirCls.preload(this);
    if (!this.loadedVfxClasses) this.loadedVfxClasses = new Set();
    this.loadedVfxClasses.add(cid);
  }

  registerClassVfxAnims(cid) {
    if (cid === 'mage') {
      this.registerMageSeqAnims();
      this.mageVfx?.registerAnims();
    } else if (cid === 'necro') this.necroVfx?.registerAnims();
    else if (cid === 'warrior') this.warriorVfx?.registerAnims();
    else if (cid === 'ranger') this.rangerVfx?.registerAnims();
    else if (cid === 'assassin') this.assassinVfx?.registerAnims();
    else if (cid === 'paladin') this.paladinVfx?.registerAnims();
  }

  unloadOtherClassVfx(activeCid) {
    if (!this.loadedVfxClasses) return;
    for (const oldCid of [...this.loadedVfxClasses]) {
      if (oldCid === activeCid) continue;
      const DirCls = this.getVfxDirectorClass(oldCid);
      if (DirCls && typeof DirCls.unload === 'function') {
        DirCls.unload(this);
      }
      this.loadedVfxClasses.delete(oldCid);
    }
  }

  getHeroAtlasKey(cid) {
    return getHeroAtlasInfo(cid || 'warrior').baseKey;
  }

  getMobAtlasKey(mid) {
    if (mid && mid.startsWith('ch')) {
      return `atlas_${mid.split('_')[0]}`;
    }
    return 'atlas_legacy';
  }

  ensureClassLoaded(cid, cb) {
    const needSummons = cid === 'necro' && !this.loadedSummons;
    const hInfo = getHeroAtlasInfo(cid);
    const needClass = !this.loadedClasses.has(cid) || !this.textures.exists(hInfo.baseKey) || (hInfo.skillsReady && !this.textures.exists(hInfo.skillsKey));
    const needVfx = !this.loadedVfxClasses || !this.loadedVfxClasses.has(cid);
    if (!needClass && !needSummons && !needVfx) {
      this.unloadOtherClassVfx(cid);
      if (cb) cb();
      return;
    }
    this.isLoadingAssets = true;
    let queuedAny = false;
    if (needClass) {
      if (safeQueueAtlas(this, hInfo.baseKey, hInfo.basePng, hInfo.baseJson)) queuedAny = true;
      if (hInfo.skillsReady && safeQueueAtlas(this, hInfo.skillsKey, hInfo.skillsPng, hInfo.skillsJson)) queuedAny = true;
    }
    if (needSummons) {
      if (safeQueueAtlas(this, 'atlas_summons', './assets/heroes/atlas_summons.png', './assets/heroes/atlas_summons.json')) queuedAny = true;
      ['skel_summon', 'skel_slash', 'frenzy', 'wraith_boom', 'golem_summon', 'golem_slam', 'blood_leech', 'bone_shield'].forEach((k) => {
        if (!this.textures.exists(`sfx_${k}`)) {
          this.load.image(`sfx_${k}`, `./assets/fx/sfx_${k}.png`);
          queuedAny = true;
        }
      });
    }
    if (needVfx) {
      this.preloadClassVfx(cid);
      queuedAny = true;
    }
    const finishClassLoad = () => {
      waitAtlasReady(this, hInfo.baseKey, () => {
        const doneAll = () => {
          this.loadedClasses.add(cid);
          this.registerClassAnims(cid);
          if (needSummons && this.textures.exists('atlas_summons')) {
            this.loadedSummons = true;
            this.registerSummonAnims();
          }
          if (needVfx) {
            this.registerClassVfxAnims(cid);
          }
          this.unloadOtherClassVfx(cid);
          this.isLoadingAssets = false;
          if (cb) cb();
        };
        if (hInfo.skillsReady) waitAtlasReady(this, hInfo.skillsKey, doneAll);
        else doneAll();
      });
    };
    if (queuedAny) {
      this.load.once('complete', finishClassLoad);
      this.load.start();
    } else {
      finishClassLoad();
    }
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
    let queued = false;
    if (needAtlas) {
      if (safeQueueAtlas(this, ak, `./assets/monsters/${ak}.png`, `./assets/monsters/${ak}.json`)) queued = true;
    }
    if (needMap) {
      this.load.image(mk, `./assets/bg/map_${zoneIdx}.jpg`);
      queued = true;
    }
    const finishChap = () => {
      waitAtlasReady(this, ak, () => {
        this.loadedChapters.add(chNum);
        this.registerChapterAnims(chNum);
        this.isLoadingAssets = false;
        if (cb) cb();
      });
    };
    if (queued) {
      this.load.once('complete', finishChap);
      this.load.start();
    } else {
      finishChap();
    }
  }

  create() {
    this.generateFxTextures();
    this.createClassAnims();
    this.floatingTextPool = new FloatingTextPool(this, 96);
    this.particlePool = new ParticlePool(this, 96);
    this.trainingArena = new TrainingArenaController(this);
    this.miniDpsHud = new BattleMiniDpsHud(this);
    this.monsterVfx = new MonsterVfxDirector(this);
    this.monsterVfx.registerAnims();
    this.monsterSkills = new MonsterSkillEngine(this, this.monsterVfx);
    this.cameraZoom = new CameraZoomHelper(this, { minZoom: 0.62, maxZoom: 1.38, defaultZoom: 1.0, mapWidth: MAP_W, mapHeight: MAP_H });
    this.mageVfx = new MageVfxDirector(this);
    this.necroVfx = new NecroVfxDirector(this);
    this.warriorVfx = new WarriorVfxDirector(this);
    this.rangerVfx = new RangerVfxDirector(this);
    this.assassinVfx = new AssassinVfxDirector(this);
    this.paladinVfx = new PaladinVfxDirector(this);
    const initCid = this.getState ? (this.getState().classId || 'warrior') : 'warrior';
    this.registerClassVfxAnims(initCid);

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
      if (this.monsterSkills?.tryHitDynamicEntity(worldPt.x, worldPt.y, 56, Math.max(2, Math.round((this.getStats()?.atk || 20) * 0.75)))) return;
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
    this.playerMp = Math.min(this.playerMaxMp, this.playerMp + Math.round(this.playerMaxMp * 0.30));
    // v298: 監聽 wake 事件接管待進入演武場請求，避免轉場競態誤刷章節怪
    this.events.on('sleep', () => {
      this.trainingArena?.exit?.();
      this.miniDpsHud?.hide?.();
    });
    this.events.on('shutdown', () => {
      this.trainingArena?.exit?.();
      this.miniDpsHud?.destroy?.();
    });
    this.events.on('wake', () => {
      if (window.__PENDING_TRAINING_ARENA__) {
        const req = window.__PENDING_TRAINING_ARENA__;
        window.__PENDING_TRAINING_ARENA__ = null;
        this.isTrainingMode = true;
        this.miniDpsHud?.hide?.();
        this.enterTrainingArena(req.onExit);
      } else {
        this.miniDpsHud?.show?.();
      }
    });
    if (window.__PENDING_TRAINING_ARENA__) {
      const req = window.__PENDING_TRAINING_ARENA__;
      window.__PENDING_TRAINING_ARENA__ = null;
      this.isTrainingMode = true;
      this.miniDpsHud?.hide?.();
      this.enterTrainingArena(req.onExit);
    } else {
      this.miniDpsHud?.show?.();
      this.spawnWaveSquad();
    }
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
    const hInfo = getHeroAtlasInfo(cid);
    const atlasKey = hInfo.baseKey;
    const tex = this.textures.exists(atlasKey) ? this.textures.get(atlasKey) : null;
    const skillsTex = (hInfo.skillsReady && this.textures.exists(hInfo.skillsKey)) ? this.textures.get(hInfo.skillsKey) : null;
    const ensureAnim = (animKey, expectedTexKey, frames, frameRate, repeat) => {
      if (this.anims.exists(animKey)) {
        const cur = this.anims.get(animKey);
        const curTex = cur?.frames?.[0]?.textureKey;
        if (curTex === expectedTexKey) return;
        this.anims.remove(animKey);
      }
      this.anims.create({ key: animKey, frames, frameRate, repeat });
    };
    ['down', 'up', 'right'].forEach((d) => {
      if (tex && tex.has(`${def.tex}_${d}_walk_7`)) {
        ensureAnim(
          `${def.prefix}_${d}_walk`,
          atlasKey,
          [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ key: atlasKey, frame: `${def.tex}_${d}_walk_${i}` })),
          Math.max(11, def.walkFps + 1),
          -1,
        );
      }
      if (tex && tex.has(`${def.tex}_${d}_idle_0`)) {
        ensureAnim(
          `${def.prefix}_${d}_idle`,
          atlasKey,
          [0, 1, 2, 3].map((i) => ({ key: atlasKey, frame: `${def.tex}_${d}_idle_${i}` })),
          5,
          -1,
        );
      }
      const hasAtk1 = tex && tex.has(`${def.tex}_${d}_atk1_0`);
      const hasAtk2 = tex && tex.has(`${def.tex}_${d}_atk2_0`);
      const hasLegacyAtk = tex && tex.has(`${def.tex}_${d}_atk_0`);
      if (hasAtk1) {
        ensureAnim(
          `${def.prefix}_${d}_atk1`,
          atlasKey,
          [0, 1, 2, 3].map((i) => ({ key: atlasKey, frame: `${def.tex}_${d}_atk1_${i}` })),
          def.atkFps,
          0,
        );
      }
      if (hasAtk2) {
        ensureAnim(
          `${def.prefix}_${d}_atk2`,
          atlasKey,
          [0, 1, 2, 3].map((i) => ({ key: atlasKey, frame: `${def.tex}_${d}_atk2_${i}` })),
          Math.max(12, def.atkFps - 2),
          0,
        );
      }
      if (hasLegacyAtk || hasAtk1) {
        const atkName = hasAtk1 ? 'atk1' : 'atk';
        ensureAnim(
          `${def.prefix}_${d}_atk`,
          atlasKey,
          [0, 1, 2, 3].map((i) => ({ key: atlasKey, frame: `${def.tex}_${d}_${atkName}_${i}` })),
          def.atkFps,
          0,
        );
      }
      if (skillsTex) {
        [
          { name: 'cast', fps: 12 },
          { name: 'buff', fps: 10 },
          { name: 'dash', fps: 16 },
          { name: 'special', fps: 14 },
        ].forEach(({ name, fps }) => {
          if (skillsTex.has(`${def.tex}_${d}_${name}_0`)) {
            ensureAnim(
              `${def.prefix}_${d}_${name}`,
              hInfo.skillsKey,
              [0, 1, 2, 3].map((i) => ({ key: hInfo.skillsKey, frame: `${def.tex}_${d}_${name}_${i}` })),
              fps,
              0,
            );
          }
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
    this.heroAfkText = this.add.text(cx, cy - 117, this.autoMode === 'move' ? '★ 自動巡航' : (this.autoMode === 'stand' ? '🎯 自動站樁' : '手動'), {
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

  isAutoAttackEnabled() {
    return this.autoMode === 'move' || this.autoMode === 'stand';
  }

  isAutoMoveAllowed() {
    return this.autoMode === 'move' && !this.isTrainingMode && !this.trainingArena?.active;
  }

  setAutoMode(mode) {
    let next = (mode === 'move' || mode === 'stand' || mode === 'manual') ? mode : 'move';
    // 演武場內開啟自動攻擊時強制鎖定為「原地站樁」，絕不自動移動
    if ((this.isTrainingMode || this.trainingArena?.active) && next === 'move') {
      next = 'stand';
    }
    this.autoMode = next;
    this.autoMoveEnabled = (next === 'move');
    if (next === 'move') this.manualOverrideTimer = 0;
    if (this.heroAfkText) {
      if (next === 'move') {
        this.heroAfkText.setText('★ 自動巡航');
        this.heroAfkText.setColor('#fde047');
      } else if (next === 'stand') {
        this.heroAfkText.setText('🎯 自動站樁');
        this.heroAfkText.setColor('#38bdf8');
      } else {
        this.heroAfkText.setText('手動');
        this.heroAfkText.setColor('#cbd5e1');
      }
    }
    return this.autoMode;
  }

  toggleAutoMove() {
    if (this.isTrainingMode || this.trainingArena?.active) {
      const next = this.autoMode === 'manual' ? 'stand' : 'manual';
      return this.setAutoMode(next);
    }
    const order = ['move', 'stand', 'manual'];
    const idx = order.indexOf(this.autoMode);
    const next = order[(idx + 1) % order.length];
    return this.setAutoMode(next);
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

  // v254: 與英雄等級＋技能等級嚴格掛勾的階梯耗魔與生命消耗系統
  getSkillResourcePlan(sid, skillLvl, stats, slotIdx = 0) {
    const heroLv = Math.max(1, stats?.heroLevel || this.getState()?.level || 1);
    const costMult = stats?.resourceCostMult || 1.0;
    const isBasicPrimer = [
      // 秘法師／死靈法師基礎產能招
      'm_fire_bolt', 'm_frost_bolt', 'm_arc_lash', 'm_spark',
      'n_reap_scythe', 'n_bone_splinters', 'n_hemorrhage', 'n_decompose',
      // 戰士／遊俠／聖騎／刺客基礎產能與 0 耗回能招
      'w_rend_slash', 'w_lunging_strike', 'w_frenzy_flurry', 'w_bash_crush', 'w_cleave', 'w_frenzy', 'w_bash',
      'r_shadow_imbue', 'r_puncture', 'r_heartseeker', 'r_forceful_arrow', 'r_quick_shot',
      'p_smite', 'p_zeal', 'p_smite_lash', 'p_zeal_strike', 'p_holy_bolt', 'p_justice_hammer',
      'a_twin_fang', 'a_blade_shift', 'a_venom_slash', 'a_shuriken_fan', 'a_quick_stab', 'a_invigorating',
      'mana_overload', 'undead_frenzy',
    ].includes(sid);

    const isUltimate = [
      'm_inferno', 'm_deep_freeze', 'm_unstable_currents', 'm_supernova',
      'n_army_scourge', 'n_blood_wave', 'n_bone_storm', 'n_soul_rift',
      'bladestorm', 'phantombow', 'void_beam', 'judgment', 'shadow_execute',
      'w_call_ancients', 'w_wrath_berserker', 'execute_cleave', 'w_iron_maelstrom', 'phantombow', 'r_abyss_barrage', 'r_void_hunter', 'r_death_trap', 'w_cataclysm', 'r_rain_arrows', 'p_seraph_verdict', 'p_seraph_descent', 'p_heavens_verdict', 'p_valkyrie_avatar', 'p_akarats_wrath', 'a_death_trap',
    ].includes(sid);

    const isSummonOrHeavy = [
      'm_hydra', 'm_ice_blades', 'm_lightning_spear', 'm_familiar', 'm_meteor', 'm_blizzard',
      'raise_skeleton', 'blood_golem', 'wraith_army', 'bone_prison',
      'execute_cleave', 'earth_stomp', 'shadow_clones', 'death_mark', 'black_hole',
      'consecration', 'holy_aegis', 'venom_burst', 'lethal_fangs',
    ].includes(sid);

    const isDefensiveUtility = [
      'm_flame_shield', 'm_ice_armor', 'm_teleport', 'm_frost_nova',
      'n_blood_mist', 'n_bone_shield', 'decrepify', 'n_iron_maiden', 'n_corpse_tendrils',
      'shadow_blitz', 'a_shadow_backstab', 'smoke_veil', 'a_blood_cloak', 'venom_burst', 'a_crimson_mist', 'a_garrote_bind', 'a_shadow_decoy_bomb', 'shadowstep', 'windwalk', 'r_smoke_decoy', 'r_dark_shroud', 'caltrops', 'r_razor_snare', 'r_poison_trap', 'r_smoke_grenade', 'frost_nova', 'w_iron_skin', 'warcry', 'w_challenging_shout', 'w_rallying_cry', 'w_leap_slam', 'w_chain_grasp', 'earth_stomp', 'bloodcharge', 'holy_aegis', 'p_redemption_prayer', 'shield_bash', 'p_sanctuary_ward', 'p_condemn_pull', 'p_falling_sword', 'p_crusader_charge',
    ].includes(sid);

    // 鮮血系與狂戰血契生命消耗（高風險高報酬，不會自殺，最少保留 1 HP）
    let hpCostPct = 0;
    if (sid === 'n_blood_surge') hpCostPct = 0.06;
    else if (sid === 'n_blood_lance') hpCostPct = 0.05;
    else if (sid === 'n_blood_wave') hpCostPct = 0.09;
    else if (sid === 'blood_golem') hpCostPct = 0.07;
    else if (stats?.activeKeystoneId === 'wk_blood_pact' && !isBasicPrimer) hpCostPct = 0.06;

    if (isBasicPrimer) {
      return { mpCost: 0, hpCostPct: 0, tier: 'primer' };
    }
    if (isUltimate || slotIdx === 5) {
      const raw = (48 + heroLv * 1.65 + (skillLvl - 1) * 3.0) * costMult;
      return { mpCost: Math.min(Math.round(this.playerMaxMp * 0.62), Math.round(raw)), hpCostPct, tier: 'ultimate' };
    }
    if (isSummonOrHeavy || slotIdx === 4) {
      const raw = (28 + heroLv * 1.05 + (skillLvl - 1) * 2.0) * costMult;
      return { mpCost: Math.min(Math.round(this.playerMaxMp * 0.42), Math.round(raw)), hpCostPct, tier: 'heavy' };
    }
    if (isDefensiveUtility || slotIdx === 2 || slotIdx === 3) {
      const raw = (20 + heroLv * 0.80 + (skillLvl - 1) * 1.5) * costMult;
      return { mpCost: Math.min(Math.round(this.playerMaxMp * 0.30), Math.round(raw)), hpCostPct, tier: 'utility' };
    }
    // 核心輸出技能（[2] 槽與其餘核心招）
    const rawCore = (26 + heroLv * 1.15 + (skillLvl - 1) * 2.2) * costMult;
    return { mpCost: Math.min(Math.round(this.playerMaxMp * 0.38), Math.round(rawCore)), hpCostPct, tier: 'core' };
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
      const stInfo = this.getStats();
      const cd = Math.round(sk.cooldownMs * (stInfo.cdrMult || 1));
      const plan = this.getSkillResourcePlan(sid, lvl, stInfo, slotIdx);
      return { id: sid, name: sk.name, cooldownMs: cd, level: lvl, cid, mpCost: plan.mpCost, hpCostPct: plan.hpCostPct, tier: plan.tier };
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

  resetAllSlotCdsReady() {
    for (let i = 0; i < 6; i++) {
      const info = this.getSlotSkillInfo(i);
      this.slotCdTimers[i] = info ? info.cooldownMs : 0;
    }
    this._lastLuckyCdRefundAt = 0;
    this._lastPrepRefundAt = 0;
    this._nextAutoCastAt = 0;
  }

  castSkillSlot(slotIdx, isManual = false) {
    if (this.isPaused || this.isTransitioning || this.monsters.length === 0) return false;
    const info = this.getSlotSkillInfo(slotIdx);
    if (!info) return false;
    if (this.slotCdTimers[slotIdx] < info.cooldownMs) return false;
    if (!isManual && !this.shouldAutoCastSkill(info.id)) return false;
    let cost = typeof info.mpCost === 'number' ? info.mpCost : 18;
    const hpCostPct = info.hpCostPct || 0;
    const tree = this.getState().skillTree || {};
    const freeAstral = ((this.getState().classId === 'mage' && (tree.m_key_astral || 0) > 0 && Math.random() < 0.25) || (this.getState().classId === 'ranger' && (this.time?.now || 0) < (this._rInnerSightUntil || 0)));
    const curCid = this.getState().classId;
    if (!freeAstral && cost > 0 && this.playerMp < cost) {
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
    // v305: 演武場遵循實戰正常魔力消耗
    if (!freeAstral && cost > 0) {
      this.playerMp = Math.max(0, this.playerMp - cost);
      this.updateHeroHpBar?.();
    }
    if (!this.isTrainingMode && hpCostPct > 0 && this.playerHp > 1) {
      const hpPaid = Math.min(this.playerHp - 1, Math.max(1, Math.round(this.playerHp * hpCostPct)));
      this.playerHp -= hpPaid;
      this.updateHeroHpBar?.();
      this.spawnFloatingText(this.hero.x - 16, this.hero.y - 78, `🩸-${formatNum(hpPaid)} 血祭`, '#fb7185', 12);
    }
    const echoRefund = (curCid === 'mage' && this.getStats().activeEffects.has('arcane_echo') && Math.random() < 0.25);
    const buildMods = computeSkillBuildMods(this.getState(), curCid, info.id, info.level);
    this._activeBuildMods = buildMods;
    this._activeBuildModsUntil = (this.time?.now || 0) + 1200;
    this._activeDamageSource = info?.name || info?.id || '技能';
    this._activeDamageSourceUntil = (this.time?.now || 0) + 1100;
    this._triggerHeroSelfBuffVfx?.(info?.id);
    const routedAction = getSkillAnimAction(curCid, info?.id);
    this.triggerHeroAttackAnim(getActionAnimDurationMs(routedAction), routedAction);
    const trainCdMult = 1.0; // v305: 演武場遵循實戰正常技能冷卻
    const effCd = Math.max(300, Math.round(info.cooldownMs * (buildMods.cdMult || 1) * trainCdMult));
    const cdSaved = Math.max(0, info.cooldownMs - effCd);
    const bonusRefund = freeAstral ? Math.round(info.cooldownMs * 0.30) : (echoRefund ? Math.round(info.cooldownMs * 0.45) : 0);
    const maxCdSaved = Math.round(info.cooldownMs * 0.65);
    this.slotCdTimers[slotIdx] = Math.min(maxCdSaved, Math.max(cdSaved, bonusRefund));

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
        if (nowCastT >= (this._lastPrepRefundAt || 0) + 900) {
          this._lastPrepRefundAt = nowCastT;
          for (let ci = 0; ci < 6; ci++) {
            if (ci === slotIdx) continue;
            const cInfo = this.getSlotSkillInfo(ci);
            if (cInfo) this.slotCdTimers[ci] = Math.min(cInfo.cooldownMs, (this.slotCdTimers[ci] || 0) + 1100);
          }
        }
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
    this.playerMp = Math.min(this.playerMaxMp, this.playerMp + Math.round(this.playerMaxMp * 0.30));
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

  enterTrainingArena(onExitToTown) {
    this.trainingArena?.enter(onExitToTown);
  }

  exitTrainingArena() {
    this.trainingArena?.exit();
  }

  clearAllMonsters() {
    this.monsters.forEach((m) => {
      m.sprite?.destroy();
      m.shadow?.destroy();
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
    const reqAtlas = this.getMobAtlasKey(data?.id);
    if (reqAtlas && !this.textures.exists(reqAtlas)) {
      const mCh = String(reqAtlas).match(/^atlas_ch(\d+)$/);
      if (mCh) {
        this.ensureChapterLoaded(Math.max(0, Number(mCh[1]) - 1));
      }
      return null;
    }
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
    if (this.isTrainingMode || this.trainingArena?.active || window.__PENDING_TRAINING_ARENA__) return;
    this.collectAllGroundLoot?.();
    const zoneIdx = this.getZoneIdx();
    this.ensureChapterLoaded(zoneIdx, () => {
      this._applySpawnWaveSquad();
    });
  }

  _applySpawnWaveSquad() {
    if (this.isTrainingMode || this.trainingArena?.active || window.__PENDING_TRAINING_ARENA__) return;
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
        cdDetails[i] = { ratio: r, remMs: Math.max(0, info.cooldownMs - this.slotCdTimers[i]), mpCost: typeof info.mpCost === 'number' ? info.mpCost : 18 };
      }
    }
    this.updateMageBattlefieldEntities(delta);
    this.updateNecroBattlefieldEntities(delta);
    this.updateWarriorBattlefieldEntities(delta);
    this.updateRangerBattlefieldEntities(delta);
    this.updateAssassinBattlefieldEntities(delta);
    this.updatePaladinBattlefieldEntities(delta);
    this.floatingTextPool?.update(delta);
    this.particlePool?.update(delta);
    this.trainingArena?.update(time, delta);
    this.miniDpsHud?.update(time);
    this.cameraZoom?.update(delta);
    // v304-1: 演武場內徹底停用 MonsterSkillEngine，禁止木頭人施放任何主動技能或紅圈
    if (!this.isTrainingMode && !this.trainingArena?.active) {
      this.monsterSkills?.update(time, delta, this.getStats());
    }
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
    if (this.isAutoAttackEnabled() && this.potionCharges > 0 && this.playerHp > 0 && this.playerHp < this.playerMaxHp * 0.35) {
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
    if (!this.isTrainingMode && !this.trainingArena?.active && !window.__PENDING_TRAINING_ARENA__) {
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
    }

    const nearest = this.findNearestMonster(this.hero.x, this.hero.y);
    if (nearest) {
      const atkRange = (cid === 'warrior' || cid === 'paladin' || cid === 'assassin') ? 170 : (cid === 'ranger' ? 430 : 370);
      const dist = Phaser.Math.Distance.Between(this.hero.x, this.hero.y, nearest.sprite.x, nearest.sprite.y);

      // v302: 嚴格區分「自動」與「手動」— 手動模式下絕不自動施放技能（也不會誤放傳送術拉回中間）或自動普攻
      const autoCastRange = this.isTrainingMode ? Math.max(520, atkRange) : Math.max(260, atkRange);
      if (this.isAutoAttackEnabled() && dist <= autoCastRange && time >= (this._nextAutoCastAt || 0)) {
        const eqIds = this.getState()?.equippedSkillsByClass?.[cid] || [];
        const smartOrder = getSmartAutoSlotOrder(eqIds, this.monsters, time);
        const orderToTry = smartOrder.length ? smartOrder : [0, 1, 2, 3, 4, 5];
        for (const sIdx of orderToTry) {
          if (this.castSkillSlot(sIdx)) {
            this._nextAutoCastAt = time + 320;
            break;
          }
        }
      }

      this.heroAttackTimer += delta;
      const tree = this.getState().skillTree || {};
      const lowBloodKey = cid === 'warrior' && (tree.w_key_blood || 0) > 0 && this.playerHp < this.playerMaxHp * 0.55;
      const spdMult = (time < this.warcryUntil ? 1.35 : 1) * (time < this.windwalkUntil ? 1.40 : 1) * (time < (this.lethalFangsUntil || 0) ? 1.45 : 1) * (lowBloodKey ? 1.45 : 1);
      const effInterval = Math.max(180, Math.round(stats.atkIntervalMs / spdMult));
      const autoAtkRange = this.isTrainingMode ? Math.max(atkRange, 220) : atkRange;
      if (this.isAutoAttackEnabled() && this.heroAttackTimer >= effInterval && dist <= autoAtkRange) {
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
      } else if (this.isAutoMoveAllowed() && this.manualOverrideTimer <= 0) {
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

  triggerHeroAttackAnim(durationMs = 340, action = 'atk1') {
    this.heroAttackAnimUntil = Math.max(this.heroAttackAnimUntil || 0, (this.time?.now || 0) + durationMs);
    this._heroActiveAction = action || 'atk1';
    if (!this.hero) return;
    const cid = this.getState().classId || 'warrior';
    const atkKey = resolveHeroAnimKey(this, cid, this.heroDir || 'down', this._heroActiveAction);
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
      const animKey = resolveHeroAnimKey(this, cid, this.heroDir, isAttacking ? (this._heroActiveAction || 'atk1') : (isMoving ? 'walk' : 'idle'));
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
      // v299: 演武場戰偶由 TrainingArenaController 獨立管理，跳過章節怪物追擊與陰影/血條更新，徹底杜絕 setPosition 崩潰
      if (m.isTrainingDummy) continue;
      if (time < (m.stunUntil || 0)) continue;

      const slowFactor = time < (m.slowUntil || 0) ? 0.5 : 1.0;
      const willChase = !!(m.isAggressive || m.isProvoked);
      const dx = this.hero.x - m.sprite.x;
      const dy = this.hero.y - m.sprite.y;
      const dist = Math.hypot(dx, dy) || 1;
      this.monsterSkills?.ensureMonsterInit(m);
      const spacing = this.monsterSkills ? this.monsterSkills.getCombatSpacing(m) : { stopRange: m.isBoss ? 94 : (m.isRanged ? 260 : 70), kiteMin: 0 };
      const stopRange = spacing.stopRange;

      let mobFlip = dx < 0;
      if (willChase) {
        if (dist > stopRange) {
          const mx = (dx / dist + Math.cos(m.jitterAngle) * 0.16) * m.speed * slowFactor * dt;
          const my = (dy / dist + Math.sin(m.jitterAngle) * 0.16) * m.speed * slowFactor * dt;
          m.sprite.x = Phaser.Math.Clamp(m.sprite.x + mx, 120, MAP_W - 120);
          m.sprite.y = Phaser.Math.Clamp(m.sprite.y + my, 180, MAP_H - 180);
          this.resolveObstacleCollision(m.sprite, m.isBoss ? 34 : 24);
        } else if (spacing.kiteMin > 0 && dist < spacing.kiteMin && !m._isCastingSkill) {
          // v278: 遠程怪自動拉打後撤，保持 260~360px 輸出安全距離
          const kx = (-dx / dist + Math.cos(m.jitterAngle) * 0.22) * m.speed * 0.72 * slowFactor * dt;
          const ky = (-dy / dist + Math.sin(m.jitterAngle) * 0.22) * m.speed * 0.72 * slowFactor * dt;
          m.sprite.x = Phaser.Math.Clamp(m.sprite.x + kx, 120, MAP_W - 120);
          m.sprite.y = Phaser.Math.Clamp(m.sprite.y + ky, 180, MAP_H - 180);
          this.resolveObstacleCollision(m.sprite, 24);
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
      if (this.anims.exists(wantAnim) && m.sprite.anims.currentAnim?.key !== wantAnim) {
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
      m.groundShadow?.setPosition(m.sprite.x, m.sprite.y + 40);
      m.castShadow?.setPosition(m.sprite.x - 12, m.sprite.y + 26).setFlipX(mobFlip).setTexture(m.sprite.texture.key, m.sprite.frame.name);

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
      m.hpBg?.setPosition(m.sprite.x, barY);
      m.hpFill?.setPosition(m.sprite.x - m.barW / 2, barY);
      m.nameText?.setPosition(m.sprite.x, barY - 16);

      if (willChase && dist <= stopRange + 28) {
        m.attackTimer += delta;
        if (m.attackTimer >= m.atkIntervalMs) {
          m.attackTimer = 0;
          m.atkAnimUntil = time + 360;
          if (this.anims.exists(`mob_${m.id}_atk`)) m.sprite.play(`mob_${m.id}_atk`, true);
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
    if (this.isTrainingMode || this.trainingArena?.active || m?.isTrainingDummy) return;
    const ang = Math.atan2(this.hero.y - m.sprite.y, this.hero.x - m.sprite.x);
    const isImp = m.atkStyle === 'imp_fire';
    const prefKey = isImp ? 'proj_e_fireball' : (m.atkStyle === 'venom' ? 'proj_e_venom_spit' : 'proj_e_soul_bolt');
    const texKey = this.textures.exists(prefKey) ? prefKey : (isImp ? 'efx_imp_fire' : 'efx_necro_orb');
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
    if (this.isTrainingMode || this.trainingArena?.active || m?.isTrainingDummy) return;
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
        // v278: zero screen shake
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
    const isHeavyStep = (classId === 'ranger') ? (this.basicComboStep % 4 === 3) : (this.basicComboStep % 3 === 2);
    const atkAction = isHeavyStep ? 'atk2' : 'atk1';
    this.triggerHeroAttackAnim(getActionAnimDurationMs(atkAction), atkAction);
    this.lungeHeroJuice(isHeavyStep ? 1.11 : 1.07, isHeavyStep ? 0.91 : 0.94);
    const mpGain = classId === 'warrior' ? 8 : (classId === 'assassin' || classId === 'paladin' ? 6 : (classId === 'ranger' || classId === 'necro' ? 5 : 4));
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
            if (!m.isTrainingDummy) {
              m.sprite.x = Phaser.Math.Clamp(m.sprite.x + Math.cos(mobAng) * kb, 120, MAP_W - 120);
              m.sprite.y = Phaser.Math.Clamp(m.sprite.y + Math.sin(mobAng) * kb, 120, MAP_H - 120);
            }
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
  // v256: 暗黑 4 戰士即時倍率（武器庫專精＋狂暴狀態＋行走武器庫＋狂怒無拘）

  // v256: 記錄行走武器庫三類武器切換（slash / crush / brawl）

  // v256: 生成磁吸怒氣血珠（ent_w_rage_orb，拾取回怒 +12 與回血 6%）

  // v256: 生成 2x2 四幀動態戰士實體（火山圖騰／旋風先祖／戰錘先祖／血刃先祖）

  // v256: 每幀更新戰士磁吸怒氣血珠、狂怒無拘回怒與 4 類動態先祖／火山圖騰

  // v256: 暗黑 4 戰士（狂戰士）24 招實戰判定幾何＋16 幀暗黑序列＋動態先祖英靈與火山圖騰（零震動、零音效）


  // v260: 暗影遊俠即時倍率（連擊星契約／心眼洞察／戰術預備＋關鍵被動）

  // v260: 生成磁吸連擊精力結晶（ent_r_combo_orb，拾取回精力 +12 與 +1 連擊星）

  // v260: 生成 2x2 四幀動態遊俠戰場實體（暗影分身／煙霧誘餌／劇毒蒺藜陣／血刃捕獸夾）

  // v260: 每幀更新遊俠磁吸連擊結晶與 4 類動態暗影分身／誘餌／陷阱實體

  // v260: 暗影遊俠 24 招實戰判定幾何＋16 幀暗黑序列＋動態分身與陷阱實體（零震動、零音效）



  showSkillBanner(name, color = '#fde047') {
    const banner = this.add.text(this.scale.width / 2, 68, `⚡ 【${name}】`, {
      fontSize: '23px', color, fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(5000);
    this.tweens.add({ targets: banner, y: 42, alpha: 0, duration: 920, onComplete: () => banner.destroy() });
  }


  // ===================== v264: 聖殿騎士 2.5D 動態召喚實體與磁吸聖光之球系統 =====================



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

  // v252: 在地面生成真實屍體（ent_n_corpse，供屍爆／屍體觸鬚／亡靈軍團消耗）

  // v252: 消耗（或定位）最近地面屍體

  // v252: 生成磁吸鮮血球（ent_n_blood_orb，回血＋回魂能＋疊加拉斯瑪壓制）

  // v252: 暗影枯萎（Shadowblight）累積觸發器

  // v252: 生成 2x2 四幀動態亡靈隨從（嚴格尊重亡者之書獻祭設定）

  // v252: 每幀更新死靈法師地面屍體、磁吸鮮血球與 4 類動態亡靈隨從

  // v252: 暗黑 4 死靈法師 24 招實戰判定幾何＋16 幀暗黑序列＋動態亡靈軍團（零震動、零音效）


  // v262: 暗影刺客即時倍率（雙毒過載＋五星暗影絕殺＋關鍵被動）

  // v262: 累積暗影星印（滿 5 星自動觸發五星絕殺＋五星影宗免費喚分身）

  // v262: 生成磁吸暗影血星珠（ent_a_shadow_star，拾取回影能 +12、+1 暗影星、回血 5%）

  // v262: 生成 2x2 四幀動態刺客實體（暗影刺客分身／環繞血毒魔刃／猩紅毒霧核心／血影炸彈替身）

  // v262: 每幀更新刺客磁吸血星珠與 4 類動態實體

  // v262: 暗影刺客 24 招實戰判定幾何＋16 幀暗黑序列＋動態分身與環繞魔刃（零震動、零音效）


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
      const invLbl = this.getState()?.classId === 'necro' ? '🩸 血霧無敵' : '❄️ 冰封無敵';
      const invCol = this.getState()?.classId === 'necro' ? '#fb7185' : '#7dd3fc';
      this.spawnFloatingText(this.hero.x, this.hero.y - 74, invLbl, invCol, 14);
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
    const hLvIn = Math.max(1, stats.heroLevel || this.getState()?.level || 1);
    const mLvIn = Math.max(1, m.mobLevel || Math.round((m.stage || 1) * 0.95));
    const underLvThreat = (mLvIn - hLvIn) > 3 ? Math.min(2.25, 1 + ((mLvIn - hLvIn) - 3) * 0.08) : 1.0;
    let dmg = Math.max(1, Math.round(m.atk * atkMult * underLvThreat * (1 - mitigation) * (1 - guardBonus) * (1 - thornsDr) * (1 - curseDr)));
    if (this.getState()?.classId === 'warrior') {
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 6);
    }
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
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + Math.round(this.playerMaxMp * 0.30));
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

  // v308-3: 啟動屏障護盾數值（移除舊版實心冰圈貼紙，視覺統一交由 2.5D 三層立體光環呈現）
  activateHeroBarrier(amount, durationMs, vfxKey = 'ent_m_ice_armor') {
    this.heroBarrierHp = Math.max(this.heroBarrierHp || 0, amount);
    this.heroBarrierUntil = Math.max(this.heroBarrierUntil || 0, this.time.now + durationMs);
    if (this.heroBarrierSprite) {
      this.heroBarrierSprite.destroy();
      this.heroBarrierSprite = null;
      this.heroBarrierKey = '';
    }
    const inferredSkill = vfxKey.includes('flame') ? 'm_flame_shield' : 'm_ice_armor';
    this._triggerHeroSelfBuffVfx?.(inferredSkill);
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

  // v242: 每幀更新場上召喚實體、劈啪電花拾取與屏障光環

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
    // v254: 千小時戰鬥數值重構（怪物護甲減傷＋首領減傷＋越級等級壓制＋爆發收斂）
    const heroLvNow = Math.max(1, st.heroLevel || this.getState()?.level || 1);
    const mobLvNow = Math.max(1, m.mobLevel || Math.round((m.stage || 1) * 0.95));
    const isVuln = (nowT < (m.markedUntil || 0)) || (nowT < (m._statuses?.vulnerable || 0));
    const effMobArmor = Math.round((m.armor || (22 + (m.stage || 1) * 8.5)) * (isVuln ? 0.65 : 1.0));
    const mobArmorMit = effMobArmor / (effMobArmor + 95 + heroLvNow * 14);
    const lvDiff = mobLvNow - heroLvNow;
    const lvSuppressMult = lvDiff > 3 ? Math.max(0.32, 1 - (lvDiff - 3) * 0.065) : (lvDiff < -6 ? Math.min(1.25, 1 + Math.abs(lvDiff + 6) * 0.025) : 1.0);
    const bossDrMult = 1 - (m.bossDr || 0);
    const globalPaceMult = isTap ? 0.72 : 0.62;
    if (m.isTrainingDummy) {
      const simDr = this.trainingArena?.getSimulatedDr?.() || 0;
      dmg = Math.max(1, Math.round(dmg * bonusMult * (1 - simDr) * globalPaceMult));
      m.hp = m.maxHp;
    } else {
      dmg = Math.max(1, Math.round(dmg * bonusMult * (1 - mobArmorMit) * bossDrMult * lvSuppressMult * globalPaceMult));
      m.hp = Math.max(0, m.hp - dmg);
    }

    m.sprite?.setTintFill(0xffffff);
    this.time.delayedCall(75, () => m.sprite && m.sprite.active && m.sprite.clearTint());

    if (m.hpFill) {
      const ratio = Math.max(0, Math.min(1, m.hp / Math.max(1, m.maxHp)));
      m.hpFill.width = (m.barW || 48) * ratio;
    }

    const srcName = (prefix === '🩸') ? '流血 DoT'
      : (prefix === '☠️') ? '劇毒 DoT'
      : (prefix === '🔥') ? '灼燒 DoT'
      : (prefix === '💀' || prefix === '👻') ? '亡靈召喚物'
      : (isTap ? '點擊攻擊' : ((nowT <= (this._activeDamageSourceUntil || 0) && this._activeDamageSource) ? this._activeDamageSource : '普通攻擊'));
    if (m.isTrainingDummy && this.trainingArena?.active) {
      this.trainingArena.recordHit({
        target: m,
        dmg,
        isCrit,
        isOverpower,
        sourceName: srcName,
        timestamp: nowT,
      });
    } else if (!m.isTrainingDummy && !this.isTrainingMode) {
      this.miniDpsHud?.recordHit?.({
        dmg,
        isCrit,
        isOverpower,
        sourceName: srcName,
        timestamp: nowT,
      });
    }

    // v298: 在怪物正頭頂血條上方顯示高對比戰鬥傷害數字
    const mobDispH = (m.sprite?.displayHeight && m.sprite.displayHeight > 20) ? m.sprite.displayHeight : 96;
    const headY = m.sprite.y - Math.max(66, Math.round(mobDispH * 0.78));
    const isDot = (prefix === '🩸' || prefix === '☠️' || prefix === '🔥');
    const color = isOverpower
      ? '#38bdf8'
      : (isCrit ? '#fde047' : (customColor || (isTap ? '#fef08a' : '#ffffff')));
    const size = isCrit ? 27 : (isOverpower ? 24 : (isDot ? 16 : (customColor ? 21 : 19)));
    const numStr = formatNum(dmg);
    const label = isCrit ? `${numStr}!` : (isOverpower ? `${numStr}` : (isDot ? `${prefix}${numStr}` : `${numStr}`));
    this.spawnFloatingText(
      m.sprite.x + Phaser.Math.Between(-14, 14),
      headY,
      label,
      color,
      size,
      { isCrit: isCrit || isOverpower },
    );

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
        if (eff?.cdRefundMs && (this.time?.now || 0) >= (this._lastLuckyCdRefundAt || 0) + 1500) {
          this._lastLuckyCdRefundAt = this.time?.now || 0;
          for (let ci = 0; ci < 6; ci++) {
            const cInfo = this.getSlotSkillInfo(ci);
            if (cInfo) this.slotCdTimers[ci] = Math.min(cInfo.cooldownMs, (this.slotCdTimers[ci] || 0) + eff.cdRefundMs);
          }
        }
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
    m.shadow?.destroy();
    m.groundShadow?.destroy();
    m.castShadow?.destroy();
    m.hpBg?.destroy();
    m.hpFill?.destroy();
    m.nameText?.destroy();

    const kStats = this.getStats();
    if ((kStats.killEssence || 0) > 0) {
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + kStats.killEssence);
    }
    if (this.getState().classId === 'assassin' && Math.random() < 0.28) {
      this.spawnAssassinStarOrb(mx, my);
    }
    if (this.getState().classId === 'ranger' && Math.random() < 0.28) {
      this.spawnRangerComboOrb(mx, my);
    }
    if (this.getState().classId === 'warrior' && Math.random() < 0.28) {
      this.spawnWarriorRageOrb(mx, my);
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
    if (this.isTrainingMode || this.trainingArena?.active) {
      this.playerHp = this.playerMaxHp;
      this.playerMp = this.playerMaxMp;
      this.updateHeroHpBar();
      return;
    }
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
    this.monsterSkills?.clearAll();
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
    if (this.isTrainingMode || this.trainingArena?.active || boss?.isTrainingDummy) return;
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
        // v305: zero screen shake

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

    // v298: 已移除連斬浮動框（改以怪物頭頂戰鬥傷害數字呈現）

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

    // 3. 首領每 6.5 秒施放地面紅圈預警重擊（演武場與木頭人全程禁止）
    if (!this.isTrainingMode && !this.trainingArena?.active && time >= (this._bossTelegraphAt || 0) && this.monsters?.length) {
      const aliveBoss = this.monsters.find((m) => m.hp > 0 && m.isBoss && !m.isTrainingDummy);
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
        if (!tm.isTrainingDummy) {
          tm.sprite.x = Phaser.Math.Linear(tm.sprite.x, targets[0].sprite.x, 0.32);
          tm.sprite.y = Phaser.Math.Linear(tm.sprite.y, targets[0].sprite.y, 0.32);
        }
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

  _clearHeroSelfBuffAura() {
    if (this._activeHeroBuffEv) {
      try { this._activeHeroBuffEv.remove(false); } catch {}
      this._activeHeroBuffEv = null;
    }
    if (this._activeHeroBuffFadeTimer) {
      try { this._activeHeroBuffFadeTimer.remove(false); } catch {}
      this._activeHeroBuffFadeTimer = null;
    }
    if (this._activeHeroBuffObjs) {
      for (const o of this._activeHeroBuffObjs) {
        if (o?.active) o.destroy();
      }
      this._activeHeroBuffObjs = null;
    }
    if (this._activeHeroBuffSpr?.active) {
      this._activeHeroBuffSpr.destroy();
      this._activeHeroBuffSpr = null;
    }
  }

  _triggerHeroSelfBuffVfx(skillId) {
    if (!skillId || !this.hero?.active) return;
    const PALETTES = {
      w_iron_skin:         { primary: 0xf59e0b, accent: 0xfde68a, isShield: true },
      w_challenging_shout: { primary: 0xfb923c, accent: 0xfef08a, isShield: true },
      warcry:              { primary: 0xef4444, accent: 0xfb923c, isShield: false },
      w_rallying_cry:      { primary: 0xfacc15, accent: 0xfef08a, isShield: false },
      w_wrath_berserker:   { primary: 0xdc2626, accent: 0xf97316, isShield: false },
      windwalk:            { primary: 0x34d399, accent: 0xa7f3d0, isShield: false },
      r_dark_shroud:       { primary: 0xa855f7, accent: 0xe879f9, isShield: true },
      r_shadow_imbue:      { primary: 0x9333ea, accent: 0xd8b4fe, isShield: false },
      m_flame_shield:      { primary: 0xf97316, accent: 0xfef08a, isShield: true },
      m_ice_armor:         { primary: 0x38bdf8, accent: 0xe0f2fe, isShield: true },
      m_unstable_currents: { primary: 0xa855f7, accent: 0x67e8f9, isShield: false },
      holy_aegis:          { primary: 0xfacc15, accent: 0xfef9c3, isShield: true },
      p_redemption_prayer: { primary: 0xfde047, accent: 0xffffff, isShield: true },
      p_sanctuary_ward:    { primary: 0xfbbf24, accent: 0xfef3c7, isShield: true },
      radiant_aura:        { primary: 0xfde047, accent: 0xffffff, isShield: false },
      p_thorns_aura:       { primary: 0xf59e0b, accent: 0xfef08a, isShield: false },
      p_akarats_wrath:     { primary: 0xfacc15, accent: 0xfb923c, isShield: false },
      n_bone_shield:       { primary: 0x2dd4bf, accent: 0xcffafe, isShield: true },
      n_blood_mist:        { primary: 0xdc2626, accent: 0xfca5a5, isShield: false },
      undead_frenzy:       { primary: 0x10b981, accent: 0x6ee7b7, isShield: false },
      a_venom_imbue:       { primary: 0x22c55e, accent: 0x86efac, isShield: false },
      lethal_fangs:        { primary: 0x16a34a, accent: 0xbef264, isShield: false },
      smoke_veil:          { primary: 0x9333ea, accent: 0xc084fc, isShield: true },
      a_blood_cloak:       { primary: 0xbe123c, accent: 0xfda4af, isShield: true },
    };
    const cfg = PALETTES[skillId];
    if (!cfg) return;

    this._clearHeroSelfBuffAura();
    const hx = this.hero.x;
    const hy = this.hero.y;
    const objs = [];

    // Layer 1: 腳底 2.5D 橢圓透視符文法陣（壓在英雄腳下 depth = hero.y - 4，100% 不遮擋英雄）
    const groundGlow = this.add.image(hx, hy + 26, 'fx_glow')
      .setTint(cfg.primary)
      .setScale(1.65, 0.72)
      .setAlpha(0.26)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(Math.max(4, Math.round(hy - 5)));
    objs.push(groundGlow);

    const groundRing = this.add.graphics()
      .setPosition(hx, hy + 26)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(Math.max(5, Math.round(hy - 4)));
    groundRing.lineStyle(2.6, cfg.primary, 0.56);
    groundRing.strokeEllipse(0, 0, 92, 38);
    groundRing.lineStyle(1.4, cfg.accent, 0.42);
    groundRing.strokeEllipse(0, 0, 68, 28);
    objs.push(groundRing);

    // Layer 2: 8 顆螺旋上升元素微粒（只環繞外圍、絕不擋臉與鎧甲）
    const motes = [];
    for (let i = 0; i < 8; i++) {
      const m = this.add.image(hx, hy, 'fx_glow')
        .setTint(i % 2 === 0 ? cfg.primary : cfg.accent)
        .setScale(0.16 + (i % 3) * 0.03)
        .setAlpha(0.72)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(Math.round(hy + 4));
      m._phase = (i / 8) * Math.PI * 2;
      m._rise = (i / 8);
      motes.push(m);
      objs.push(m);
    }

    // Layer 3: 防禦護盾專屬極輕透邊緣弧光（不旋轉、不糊人）
    let shieldRim = null;
    if (cfg.isShield) {
      shieldRim = this.add.graphics()
        .setPosition(hx, hy - 8)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(Math.round(hy + 5));
      shieldRim.lineStyle(2.2, cfg.primary, 0.28);
      shieldRim.strokeEllipse(0, 0, 74, 96);
      shieldRim.lineStyle(1.0, cfg.accent, 0.20);
      shieldRim.strokeEllipse(0, 0, 64, 86);
      objs.push(shieldRim);
    }

    this._activeHeroBuffObjs = objs;
    let tick = 0;
    this._activeHeroBuffEv = this.time.addEvent({
      delay: 16,
      repeat: 195,
      callback: () => {
        if (!this.hero?.active) return;
        tick += 1;
        const cx = this.hero.x;
        const cy = this.hero.y;
        const pulse = 1 + Math.sin(tick * 0.11) * 0.06;
        if (groundGlow.active) {
          groundGlow.setPosition(cx, cy + 26).setScale(1.65 * pulse, 0.72 * pulse).setDepth(Math.max(4, Math.round(cy - 5)));
        }
        if (groundRing.active) {
          groundRing.setPosition(cx, cy + 26).setScale(pulse, pulse).setDepth(Math.max(5, Math.round(cy - 4)));
        }
        if (shieldRim?.active) {
          shieldRim.setPosition(cx, cy - 8).setAlpha(0.85 + Math.sin(tick * 0.14) * 0.15).setDepth(Math.round(cy + 5));
        }
        for (const m of motes) {
          if (!m.active) continue;
          m._phase += 0.055;
          m._rise = (m._rise + 0.012) % 1.0;
          const mx = cx + Math.cos(m._phase) * 34;
          const my = (cy + 24) - m._rise * 74 + Math.sin(m._phase) * 9;
          const front = Math.sin(m._phase) >= 0;
          const fadeA = m._rise < 0.15 ? (m._rise / 0.15) : (m._rise > 0.78 ? (1 - m._rise) / 0.22 : 1);
          m.setPosition(mx, my)
            .setAlpha(0.70 * fadeA)
            .setDepth(Math.round(cy + (front ? 6 : -3)));
        }
      },
    });

    this._activeHeroBuffFadeTimer = this.time.delayedCall(3050, () => {
      if (this._activeHeroBuffEv) {
        try { this._activeHeroBuffEv.remove(false); } catch {}
        this._activeHeroBuffEv = null;
      }
      const alive = (this._activeHeroBuffObjs || []).filter((o) => o?.active);
      if (alive.length) {
        this.tweens.add({
          targets: alive,
          alpha: 0,
          duration: 360,
          onComplete: () => {
            for (const o of alive) if (o?.active) o.destroy();
          },
        });
      }
      this._activeHeroBuffObjs = null;
    });
  }

  spawnFloatingText(x, y, text, color = '#ffffff', size = 19, opts = null) {
    if (this.floatingTextPool) {
      return this.floatingTextPool.spawn(x, y, text, color, size, opts);
    }
    return null;
  }

  handleResize(w, h) {
    if (w < 10 || h < 10) return;
    if (this.waveInfoText) this.waveInfoText.setPosition(w / 2, 24);
  }
}

// v266: 將六大職業獨立戰鬥模組掛接至 BattleScene.prototype（零效能損耗、100% 相容既有呼叫）
Object.assign(
  BattleScene.prototype,
  warriorCombatMethods,
  rangerCombatMethods,
  mageCombatMethods,
  paladinCombatMethods,
  necroCombatMethods,
  assassinCombatMethods,
);
