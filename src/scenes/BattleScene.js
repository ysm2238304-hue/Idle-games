import { CLASSES } from '../data/classes.js';
import { WARRIOR_SKILLS } from '../data/warriorSkills.js';
import { RANGER_SKILLS } from '../data/rangerSkills.js';
import { MAGE_SKILLS } from '../data/mageSkills.js';
import { PALADIN_SKILLS } from '../data/paladinSkills.js';
import { NECRO_SKILLS } from '../data/necroSkills.js';
import { ASSASSIN_SKILLS } from '../data/assassinSkills.js';
import { RARITIES } from '../data/items.js';
import { createStageEncounters, spawnSingleMonster, getChapterIdx, getStageLabel, ZONE_OBSTACLES } from '../data/monsters.js';
import { formatNum } from '../logic/statCalc.js';

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
    this.playerHp = 240;
    this.playerMaxHp = 240;
    this.playerMp = 100;
    this.playerMaxMp = 100;
    this.potionCharges = 3;
    this.potionMaxCharges = 3;
    this.potionRechargeTimer = 0;
    this.heroAttackTimer = 0;
    this.slotCdTimers = [99999, 99999, 99999];
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

    this.load.atlas(`atlas_${initCid}`, `./assets/heroes/atlas_${initCid}.png`, `./assets/heroes/atlas_${initCid}.json`);
    if (initCid === 'necro') {
      this.loadedSummons = true;
      this.load.atlas('atlas_summons', './assets/heroes/atlas_summons.png', './assets/heroes/atlas_summons.json');
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
      this.load.atlas(`atlas_${cid}`, `./assets/heroes/atlas_${cid}.png`, `./assets/heroes/atlas_${cid}.json`);
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
        this.playFxSprite('wfx_cleave', target.sprite.x, target.sprite.y - 10, 0.52, Phaser.Math.FloatBetween(-0.6, 0.6), 220);
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
    ['down', 'up', 'right'].forEach((d) => {
      if (!this.anims.exists(`${def.prefix}_${d}_walk`)) {
        this.anims.create({
          key: `${def.prefix}_${d}_walk`,
          frames: [0, 1, 2, 3].map((i) => ({ key: atlasKey, frame: `${def.tex}_${d}_walk_${i}` })),
          frameRate: Math.max(9, def.walkFps),
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
    this.heroAfkText = this.add.text(cx, cy - 117, this.autoMoveEnabled ? '★ AFK' : '手動', {
      fontSize: '11px', color: this.autoMoveEnabled ? '#fde047' : '#cbd5e1',
      fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(4003);

    this.cameras.main.startFollow(this.hero, true, 0.14, 0.14);
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
      this.heroAfkText.setText(this.autoMoveEnabled ? '★ AFK' : '手動');
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
    let seed = (zoneIdx + 1) * 9301 + 49297;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const cx = MAP_W / 2;
    const cy = MAP_H / 2;
    let attempts = 0;
    while (this.obstacles.length < 22 && attempts < 220) {
      attempts++;
      const ox = 380 + rand() * (MAP_W - 760);
      const oy = 320 + rand() * (MAP_H - 640);
      if (Math.hypot(ox - cx, oy - cy) < 380) continue;
      if (this.obstacles.some((o) => Math.hypot(o.x - ox, o.y - oy) < 360)) continue;

      const key = pool[this.obstacles.length % pool.length];
      const sc = 0.62 + rand() * 0.22;
      const r = Math.round(52 * sc / 0.72);
      const shadow = this.add.image(ox, oy + 14, 'fx_glow')
        .setTint(0x000000).setScale(2.1 * sc, 0.75 * sc).setAlpha(0.55).setDepth(2);
      const sprite = this.add.image(ox, oy, key)
        .setOrigin(0.5, 0.88).setScale(sc).setDepth(oy);
      this.obstacles.push({ x: ox, y: oy, r, sprite, shadow });
    }
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
    const freeAstral = (this.getState().classId === 'mage' && (tree.m_key_astral || 0) > 0 && Math.random() < 0.35);
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
    this.slotCdTimers[slotIdx] = freeAstral ? Math.round(info.cooldownMs * 0.3) : (echoRefund ? Math.round(info.cooldownMs * 0.5) : 0);

    const stNow = this.getStats();
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
    this.slotCdTimers = [99999, 99999, 99999];
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

    const ratios = [0, 0, 0];
    const cdDetails = [null, null, null];
    for (let i = 0; i < 3; i++) {
      const info = this.getSlotSkillInfo(i);
      if (info) {
        this.slotCdTimers[i] = Math.min(info.cooldownMs, this.slotCdTimers[i] + delta);
        const r = this.slotCdTimers[i] / info.cooldownMs;
        ratios[i] = r;
        cdDetails[i] = { ratio: r, remMs: Math.max(0, info.cooldownMs - this.slotCdTimers[i]), mpCost: info.mpCost || 18 };
      }
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
            heroX: this.hero.x,
            heroY: this.hero.y,
            mapW: MAP_W,
            mapH: MAP_H,
            obstacles: this.obstacles,
            monsters: remMobs.map((m) => ({ x: m.sprite.x, y: m.sprite.y, hp: m.hp, isBoss: !!m.isBoss })),
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
        for (let i = 0; i < 3; i++) {
          if (this.castSkillSlot(i)) break;
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

      if (this.autoMoveEnabled && this.manualOverrideTimer <= 0) {
        const nearest = this.findNearestMonster(this.hero.x, this.hero.y);
        if (nearest) {
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
      if (this.afterimageTimer >= 135) {
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
  }

  updateHeroVisualPose(vx, vy, time = 0) {
    const cid = this.getState().classId || 'warrior';
    const spd = Math.hypot(vx, vy);
    const isMoving = spd > 14;
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
        this.heroDirLockUntil = time + 260;
      }
    }
    this.hero.setFlipX(this.heroFlipX);
    if (!isAttacking) {
      if (isMoving) {
        const bob = Math.sin(time * 0.018) * 0.026;
        this.hero.setScale(0.56 * (1 - bob * 0.6), 0.56 * (1 + bob));
        this.hero.anims.timeScale = Phaser.Math.Clamp(spd / 145, 0.8, 1.45);
      } else {
        this.hero.setScale(0.56, 0.56);
        this.hero.anims.timeScale = 1;
      }
    }

    if (cid === 'warrior' || cid === 'ranger' || cid === 'mage' || cid === 'paladin' || cid === 'necro' || cid === 'assassin') {
      const prefix = cid === 'warrior' ? 'w' : (cid === 'ranger' ? 'r' : (cid === 'paladin' ? 'p' : (cid === 'necro' ? 'n' : (cid === 'assassin' ? 'a' : 'm'))));
      const animKey = `${prefix}_${this.heroDir}_${isAttacking ? 'atk' : 'walk'}`;
      if (isAttacking) {
        if (this.hero.anims.currentAnim?.key !== animKey) {
          this.hero.play(animKey, false);
        }
      } else {
        if (this.hero.anims.currentAnim?.key !== animKey) {
          this.hero.play(animKey, true);
        }
        if (!isMoving && this.hero.anims.isPlaying) {
          this.hero.anims.pause(this.hero.anims.currentAnim.frames[0]);
        } else if (isMoving && this.hero.anims.isPaused) {
          this.hero.anims.resume();
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
        this.cameras.main.shake(190, 0.01);
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
    this.heroAttackAnimUntil = time + 340;
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
      this.playFxSprite('wfx_sparks', cx, cy, isFinisher ? 0.95 : 0.62, Math.random() * Math.PI, 260);

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
            this.playFxSprite('wfx_hitflash', m.sprite.x, m.sprite.y - 10, isFinisher ? 0.56 : 0.42, 0, 180);
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
    const alive = this.monsters.filter((m) => m.hp > 0);
    if (alive.length === 0) return;
    const sk = WARRIOR_SKILLS[skillId];
    const aim = this.getAimPoint(isManual, 320);
    this.faceHeroToward(aim.x, aim.y);
    this.heroAttackAnimUntil = this.time.now + 420;

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
      this.cameras.main.shake(240, 0.008);
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
      this.cameras.main.shake(260, 0.014);
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
      this.cameras.main.shake(150, 0.008);
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
      this.cameras.main.shake(190, 0.011);
    } else if (skillId === 'volcano_totem') {
      const tx = aim.x;
      const ty = aim.y;
      const totem = this.add.image(tx, ty, 'nfx_totem').setScale(0.85).setBlendMode(Phaser.BlendModes.ADD).setDepth(ty);
      this.time.addEvent({
        delay: 520,
        repeat: 3,
        callback: () => {
          this.playFxSprite('wfx_lava_ring', tx, ty + 12, 1.45 * radMult, 0, 420);
          this.playFxSprite('mfx_meteor_flame', tx, ty - 24, 1.15 * radMult, 0, 420);
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
      this.cameras.main.shake(220, 0.012);
    }
  }

  // 遊俠 4 大主動技能（游標指向＋獵手印記連動）
  castRangerSkill(skillId, skillLvl, stats, isManual = false) {
    const alive = this.monsters.filter((m) => m.hp > 0);
    if (alive.length === 0) return;
    const sk = RANGER_SKILLS[skillId];
    const aim = this.getAimPoint(isManual, 480);
    this.faceHeroToward(aim.x, aim.y);
    this.heroAttackAnimUntil = this.time.now + 400;

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
      this.cameras.main.shake(180, 0.01);
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
    const alive = this.monsters.filter((m) => m.hp > 0);
    if (alive.length === 0) return;
    const sk = MAGE_SKILLS[skillId];
    const aim = this.getAimPoint(isManual, 480);
    this.faceHeroToward(aim.x, aim.y);
    this.heroAttackAnimUntil = this.time.now + 420;

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
          this.cameras.main.shake(240, 0.013);
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
      this.cameras.main.shake(210, 0.011);
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
        this.cameras.main.shake(220, 0.012);
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
    const alive = this.monsters.filter((m) => m.hp > 0);
    if (alive.length === 0) return;
    const tree = this.getState().skillTree || {};
    const aim = this.getAimPoint(isManual, 360);
    this.faceHeroToward(aim.x, aim.y);
    this.heroAttackAnimUntil = this.time.now + 420;
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
      this.cameras.main.shake(120, 0.006);
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
      this.cameras.main.shake(160, 0.008);
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

  castNecroSkill(skillId, skillLvl, stats, isManual = false) {
    const alive = this.monsters.filter((m) => m.hp > 0);
    if (alive.length === 0) return;
    const tree = this.getState().skillTree || {};
    const aim = this.getAimPoint(isManual, 420);
    this.faceHeroToward(aim.x, aim.y);
    this.heroAttackAnimUntil = this.time.now + 420;
    this.hero.play(`n_${this.heroDir}_atk`, false);

    const dmgMult = stats.skillDmgMult || 1;
    const boneMult = 1 + (stats.boneDmgPct || 0) / 100;
    const keyPlague = (tree.n_key_plague || 0) > 0;

    if (skillId === 'raise_skeleton') {
      const maxSk = 3 + Math.floor(skillLvl / 2) + ((tree.n_mod_horde || 0) > 0 ? 2 : 0) + ((tree.n_key_overlord || 0) > 0 ? 2 : 0) + (stats.activeEffects.has('skeleton_army') ? 2 : 0);
      const count = 2 + ((tree.n_mod_horde || 0) > 0 ? 1 : 0);
      this.playFxSprite('sfx_skel_summon', this.hero.x, this.hero.y + 14, 1.15, 0, 440);
      for (let i = 0; i < count; i++) {
        const existingSk = this.summons.filter((s) => s.kind === 'skeleton');
        if (existingSk.length >= maxSk) {
          const oldest = existingSk[0];
          oldest.lifeMs = 15000;
          oldest.lvl = skillLvl;
          continue;
        }
        const ox = Phaser.Math.Between(-90, 90);
        const oy = Phaser.Math.Between(-60, 70);
        const sx = this.hero.x + ox;
        const sy = this.hero.y + oy;
        const spr = this.add.sprite(sx, sy, 'atlas_summons', 'skel_down_walk_0').setScale(0.48).setDepth(sy);
        spr.play('sum_skel_down_walk');
        const barBg = this.add.rectangle(sx, sy - 48, 48, 5, 0x090b10).setStrokeStyle(1, 0x2dd4bf).setDepth(3500);
        const barFill = this.add.rectangle(sx - 24, sy - 48, 48, 4, 0x2dd4bf).setOrigin(0, 0.5).setDepth(3501);
        const label = this.add.text(sx, sy - 60, '💀 骷髏戰士', { fontSize: '10px', color: '#5eead4', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(3502);
        this.summons.push({ kind: 'skeleton', sprite: spr, barBg, barFill, label, lifeMs: 22000, maxLifeMs: 22000, atkTimer: 250, lvl: skillLvl, offX: ox, offY: oy });
      }
      return;
    }

    if (skillId === 'blood_golem') {
      this.playFxSprite('sfx_golem_summon', aim.x, aim.y + 14, 1.30, 0, 480);
      const existingG = this.summons.find((s) => s.kind === 'golem');
      if (existingG) {
        existingG.lifeMs = 14000;
        existingG.lvl = skillLvl;
        existingG.sprite.setPosition(aim.x, aim.y);
      } else {
        const spr = this.add.sprite(aim.x, aim.y, 'atlas_summons', 'gol_down_walk_0').setScale(0.58).setDepth(aim.y);
        spr.play('sum_gol_down_walk');
        const barBg = this.add.rectangle(aim.x, aim.y - 68, 56, 6, 0x090b10).setStrokeStyle(1, 0xfb7185).setDepth(3500);
        const barFill = this.add.rectangle(aim.x - 28, aim.y - 68, 56, 5, 0xf43f5e).setOrigin(0, 0.5).setDepth(3501);
        const label = this.add.text(aim.x, aim.y - 80, '🩸 鮮血魔像', { fontSize: '10.5px', color: '#fda4af', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(3502);
        this.summons.push({ kind: 'golem', sprite: spr, barBg, barFill, label, lifeMs: 20000, maxLifeMs: 20000, atkTimer: 300, lvl: skillLvl, offX: -75, offY: 30 });
      }
      return;
    }

    if (skillId === 'undead_frenzy') {
      this.undeadFrenzyUntil = this.time.now + 5000;
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 25);
      this.playFxSprite('sfx_frenzy', this.hero.x, this.hero.y + 10, 1.35, 0, 460);
      this.summons.forEach((s) => { s.lifeMs += 4000; });
      this.spawnFloatingText(this.hero.x, this.hero.y - 90, '💀 亡靈狂熱！', '#5eead4', 15);
      return;
    }

    if (skillId === 'wraith_army') {
      const count = 5 + (skillLvl >= 4 ? 2 : 0);
      for (let i = 0; i < count; i++) {
        const target = alive[i % alive.length];
        const ang = Math.atan2(target.sprite.y - this.hero.y, target.sprite.x - this.hero.x) + Phaser.Math.FloatBetween(-0.25, 0.25);
        const spr = this.add.sprite(this.hero.x, this.hero.y - 12, 'atlas_summons', 'wraith_walk_0')
          .setScale(0.38).setFlipX(Math.cos(ang) < 0).setDepth(4510);
        spr.play('sum_wraith_walk');
        this.projectiles.push({
          fromEnemy: false, kind: 'mage_bolt', sprite: spr,
          vx: Math.cos(ang) * 650, vy: Math.sin(ang) * 650,
          lifeMs: 1050, dmgMult: (1.20 + skillLvl * 0.25) * dmgMult, bouncesLeft: 0, hitIds: new Set(), stats,
        });
      }
      return;
    }

    if (skillId === 'bone_spear') {
      const baseAng = Math.atan2(aim.y - this.hero.y, aim.x - this.hero.x);
      const offsets = (tree.n_mod_split || 0) > 0 ? [-0.18, 0, 0.18] : [0];
      const hasModCurse = (tree.n_mod_curse || 0) > 0;
      const spearBonus = stats.activeEffects.has('bone_pierce') ? 1.35 : 1;
      offsets.forEach((off) => {
        const ang = baseAng + off;
        const spr = this.add.image(this.hero.x, this.hero.y - 14, 'nfx_p_spear')
          .setScale(0.56).setRotation(ang).setBlendMode(Phaser.BlendModes.ADD).setDepth(4512);
        this.projectiles.push({
          fromEnemy: false, kind: 'ranger_beam', sprite: spr,
          vx: Math.cos(ang) * 860, vy: Math.sin(ang) * 860,
          lifeMs: 1000,
          fixedRawDmg: stats.atk * (1.95 + skillLvl * 0.35) * dmgMult * boneMult * spearBonus,
          bonusCrit: (keyPlague || hasModCurse) ? 100 : 15,
          appliesMark: false,
          hitIds: new Set(), stats,
        });
      });
      return;
    }

    if (skillId === 'corpse_explosion') {
      const rad = 230 * (1 + (stats.corpseRadiusPct || 0) / 100);
      this.playFxSprite('nfx_p_corpse', aim.x, aim.y - 10, 1.4 * (rad / 230), 0, 460);
      this.cameras.main.shake(140, 0.007);
      const mult = (2.20 + skillLvl * 0.40) * dmgMult;
      for (const m of alive) {
        if (Phaser.Math.Distance.Between(aim.x, aim.y, m.sprite.x, m.sprite.y) <= rad) {
          const curseBoost = this.time.now < (m.cursedUntil || 0) ? 1.35 : 1;
          const isCrit = keyPlague || Math.random() * 100 < stats.critRate;
          const dmg = Math.max(1, Math.round(stats.atk * mult * curseBoost * (isCrit ? stats.critDmg / 100 : 1)));
          this.damageMonster(m, dmg, isCrit, false, '#fb7185', '💥');
        }
      }
      return;
    }

    if (skillId === 'bone_prison') {
      this.playFxSprite('nfx_p_prison', aim.x, aim.y + 8, 1.3, 0, 520);
      const mult = (0.70 + skillLvl * 0.15) * dmgMult * boneMult;
      for (let w = 0; w < 4; w++) {
        this.time.delayedCall(w * 600, () => {
          if (this.isTransitioning) return;
          for (const m of this.monsters) {
            if (m.hp > 0 && Phaser.Math.Distance.Between(aim.x, aim.y, m.sprite.x, m.sprite.y) <= 215) {
              m.chilledUntil = Math.max(m.chilledUntil || 0, this.time.now + 2500);
              m.cursedUntil = Math.max(m.cursedUntil || 0, this.time.now + 5000);
              const isCrit = keyPlague || Math.random() * 100 < stats.critRate;
              const dmg = Math.max(1, Math.round(stats.atk * mult * (isCrit ? stats.critDmg / 100 : 1)));
              this.damageMonster(m, dmg, isCrit, false, '#e2e8f0', '🦴');
            }
          }
        });
      }
      return;
    }

    if (skillId === 'decrepify') {
      this.playFxSprite('nfx_p_curse', aim.x, aim.y + 8, 1.55, 0, 500);
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 18);
      const mult = (1.25 + skillLvl * 0.22) * dmgMult;
      for (const m of alive) {
        if (Phaser.Math.Distance.Between(aim.x, aim.y, m.sprite.x, m.sprite.y) <= 300) {
          m.cursedUntil = Math.max(m.cursedUntil || 0, this.time.now + 6000);
          m.chilledUntil = Math.max(m.chilledUntil || 0, this.time.now + 3500);
          const dmg = Math.max(1, Math.round(stats.atk * mult));
          this.damageMonster(m, dmg, false, false, '#a78bfa', '🔮');
        }
      }
    }
  }


  castAssassinSkill(skillId, skillLvl, stats, isManual = false) {
    const alive = this.monsters.filter((m) => m.hp > 0);
    if (alive.length === 0) return;
    const tree = this.getState().skillTree || {};
    const aim = this.getAimPoint(isManual, 380);
    this.faceHeroToward(aim.x, aim.y);
    this.heroAttackAnimUntil = this.time.now + 360;
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
      this.cameras.main.shake(170, 0.009);
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
      this.cameras.main.shake(130, 0.007);
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
        this.cameras.main.shake(90, 0.004);
      } else if (m.atkStyle === 'boss_cleave') {
        this.playFxSprite('efx_claw', this.hero.x, this.hero.y - 8, 1.65, ang, 360);
        this.playFxSprite('mfx_meteor_flame', this.hero.x, this.hero.y - 12, 1.25, 0, 380);
        this.playFxSprite('wfx_lava_ring', this.hero.x, this.hero.y + 8, 1.10, 0, 360);
        this.cameras.main.shake(150, 0.008);
      } else {
        this.playFxSprite('efx_claw', this.hero.x, this.hero.y - 8, 0.98, ang, 300);
      }
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

    const mitigation = stats.armor / (stats.armor + 45 + m.stage * 14);
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
    this.playerHp = Math.max(0, this.playerHp - dmg);

    this.hero.setTintFill(0xff4444);
    this.time.delayedCall(90, () => this.hero && this.hero.clearTint());
    this.spawnFloatingText(this.hero.x, this.hero.y - 68, `-${formatNum(dmg)}`, '#f87171', 15);
    this.updateHeroHpBar();

    if (this.playerHp <= 0) {
      this.handleHeroDefeat('生命歸零，返回第 1 波休整！');
    }
  }

  damageMonster(m, dmg, isCrit, isTap, customColor = null, prefix = '') {
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

    if (isCrit) this.cameras.main.shake(70, 0.003);

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
    if (this.getState().classId === 'necro' && ((kTree.n_key_plague || 0) > 0 || (kStats.activeEffects.has('blood_corpse') && Math.random() < 0.5))) {
      this.playFxSprite('nfx_p_corpse', mx, my, 1.05, 0, 380);
      const ceDmg = Math.max(1, Math.round(kStats.atk * 1.45 * (kStats.skillDmgMult || 1)));
      for (const om of this.monsters) {
        if (om.hp > 0 && om !== m && Phaser.Math.Distance.Between(mx, my, om.sprite.x, om.sprite.y) <= 190) {
          this.damageMonster(om, ceDmg, true, false, '#fb7185', '💥');
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
    this.mapKills = (this.mapKills || 0) + 1;
    const dropResult = this.callbacks.onMonsterKilled(m, false);
    if (dropResult && dropResult.item) {
      this.spawnLootBeam(mx, my + 24, dropResult.item);
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

  spawnLootBeam(x, y, item) {
    const r = RARITIES[item.rarity] || RARITIES.common;
    const isHigh = item.rarity === 'legendary' || item.rarity === 'rare';
    const beamH = isHigh ? 240 : 170;
    const beamW = isHigh ? 22 : 14;
    const beam = this.add.rectangle(x, y - beamH / 2, beamW, beamH, r.beam, isHigh ? 0.78 : 0.55)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(4400);
    const orb = this.add.circle(x, y - 4, isHigh ? 10 : 7, r.beam, 1)
      .setStrokeStyle(2, 0xffffff).setDepth(4401);

    const labelStr = `[${r.label}] ${item.name}`;
    const tag = this.add.text(x, y - 44, labelStr, {
      fontSize: '12px', color: r.color, fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(4403);
    const padW = Math.max(88, tag.width + 18);
    const plate = this.add.rectangle(x, y - 44, padW, 22, 0x090b12, 0.88)
      .setStrokeStyle(1.5, r.beam).setDepth(4402);

    this.tweens.add({
      targets: [beam, orb],
      alpha: 0,
      scaleX: 0.35,
      duration: 1600,
      delay: 650,
      onComplete: () => { beam.destroy(); orb.destroy(); },
    });
    this.tweens.add({
      targets: [plate, tag],
      y: '-=36',
      alpha: 0,
      duration: 1700,
      delay: 700,
      onComplete: () => { plate.destroy(); tag.destroy(); },
    });
  }

  spawnFloatingText(x, y, msg, color, fontSize = 16) {
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
