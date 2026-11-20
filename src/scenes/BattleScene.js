import { CLASSES } from '../data/classes.js';
import { WARRIOR_SKILLS } from '../data/warriorSkills.js';
import { RANGER_SKILLS } from '../data/rangerSkills.js';
import { MAGE_SKILLS } from '../data/mageSkills.js';
import { RARITIES } from '../data/items.js';
import { createStageEncounters, getChapterIdx, getStageLabel, ZONE_OBSTACLES } from '../data/monsters.js';
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
  }

  init(data) {
    const src = (data && typeof data.getState === 'function') ? data : (window.__IDLE_ARPG_BRIDGE__ || {});
    this.callbacks = src.callbacks;
    this.getState = src.getState;
    this.getStats = src.getStats;
  }

  preload() {
    ['down', 'up', 'right'].forEach((d) => {
      ['walk', 'atk'].forEach((st) => {
        for (let i = 0; i < 4; i++) {
          this.load.image(`wf_${d}_${st}_${i}`, `./assets/heroes/warrior_frames/${d}_${st}_${i}.png`);
          this.load.image(`rf_${d}_${st}_${i}`, `./assets/heroes/ranger_frames/${d}_${st}_${i}.png`);
          this.load.image(`mf_${d}_${st}_${i}`, `./assets/heroes/mage_frames/${d}_${st}_${i}.png`);
        }
      });
    });

    ['down', 'up', 'right'].forEach((d) => {
      ['move', 'atk'].forEach((s) => {
        this.load.image(`hero_mage_${d}_${s}`, `./assets/heroes/mage_${d}_${s}.png`);
      });
    });

    ['goblin', 'spider', 'skeleton', 'imp', 'orc', 'necromancer', 'boss_demon'].forEach((mid) => {
      ['walk', 'atk'].forEach((st) => {
        for (let i = 0; i < 4; i++) {
          this.load.image(`mob_${mid}_${st}_${i}`, `./assets/monsters/${mid}_frames/${st}_${i}.png`);
        }
      });
    });

    this.load.image('mob_goblin', './assets/monsters/goblin.png');
    this.load.image('mob_spider', './assets/monsters/spider.png');
    this.load.image('mob_skeleton', './assets/monsters/skeleton.png');
    this.load.image('mob_imp', './assets/monsters/imp.png');
    this.load.image('mob_orc', './assets/monsters/orc.png');
    this.load.image('mob_necromancer', './assets/monsters/necromancer.png');
    this.load.image('mob_boss_demon', './assets/monsters/boss_demon.png');

    for (let i = 0; i < 10; i++) {
      this.load.image(`map_zone_${i}`, `./assets/bg/map_${i}.jpg`);
    }
    for (let i = 0; i < 8; i++) {
      this.load.image(`obs_${i}`, `./assets/props/obs_${i}.png`);
    }

    FX_NAMES.forEach((fx) => {
      this.load.image(fx, `./assets/fx/${fx}.png`);
    });
  }

  create() {
    this.generateFxTextures();
    this.createClassAnims();

    this.bgImage = this.add.image(MAP_W / 2, MAP_H / 2, 'map_zone_0')
      .setDisplaySize(MAP_W, MAP_H)
      .setDepth(0);

    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.createHero();
    this.createMinimap();

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

    this.waveInfoText = this.add.text(this.scale.width / 2, 24, '', {
      fontSize: '15px', color: '#fde68a', fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(5000);

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
    const defs = [
      { prefix: 'w', tex: 'wf', walkFps: 10, atkFps: 15 },
      { prefix: 'r', tex: 'rf', walkFps: 12, atkFps: 16 },
      { prefix: 'm', tex: 'mf', walkFps: 10, atkFps: 15 },
    ];
    defs.forEach(({ prefix, tex, walkFps, atkFps }) => {
      ['down', 'up', 'right'].forEach((d) => {
        if (!this.anims.exists(`${prefix}_${d}_walk`)) {
          this.anims.create({
            key: `${prefix}_${d}_walk`,
            frames: [0, 1, 2, 3, 2, 1].map((i) => ({ key: `${tex}_${d}_walk_${i}` })),
            frameRate: Math.max(12, walkFps + 2),
            repeat: -1,
          });
        }
        if (!this.anims.exists(`${prefix}_${d}_atk`)) {
          this.anims.create({
            key: `${prefix}_${d}_atk`,
            frames: [0, 1, 2, 3].map((i) => ({ key: `${tex}_${d}_atk_${i}` })),
            frameRate: atkFps,
            repeat: 0,
          });
        }
      });
    });

    ['goblin', 'spider', 'skeleton', 'imp', 'orc', 'necromancer', 'boss_demon'].forEach((mid) => {
      const walkFps = mid === 'spider' ? 12 : (mid === 'imp' ? 10 : (mid === 'orc' || mid === 'boss_demon' ? 7 : 9));
      if (!this.anims.exists(`mob_${mid}_walk`)) {
        this.anims.create({
          key: `mob_${mid}_walk`,
          frames: [0, 1, 2, 3].map((i) => ({ key: `mob_${mid}_walk_${i}` })),
          frameRate: walkFps,
          repeat: -1,
        });
      }
      if (!this.anims.exists(`mob_${mid}_atk`)) {
        this.anims.create({
          key: `mob_${mid}_atk`,
          frames: [0, 1, 2, 3].map((i) => ({ key: `mob_${mid}_atk_${i}` })),
          frameRate: 13,
          repeat: 0,
        });
      }
    });
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
    const texKey = cid === 'warrior' ? 'wf_down_walk_0' : (cid === 'ranger' ? 'rf_down_walk_0' : 'mf_down_walk_0');

    this.heroGroundShadow = this.add.image(cx, cy + 44, 'fx_glow')
      .setTint(0x000000).setScale(1.7, 0.6).setAlpha(0.62).setDepth(2);
    this.heroCastShadow = this.add.image(cx - 14, cy + 28, texKey)
      .setTint(0x000000).setScale(0.56, 0.25).setAlpha(0.32).setDepth(3);

    this.hero = this.add.sprite(cx, cy, texKey).setScale(0.56).setDepth(cy);
    if (cid === 'warrior') this.hero.play('w_down_walk');
    else if (cid === 'ranger') this.hero.play('r_down_walk');
    else if (cid === 'mage') this.hero.play('m_down_walk');

    this.heroHpBg = this.add.rectangle(cx, cy - 86, 108, 10, 0x0b0e14).setStrokeStyle(1.5, 0xc89b3c).setDepth(4000);
    this.heroHpFill = this.add.rectangle(cx - 54, cy - 86, 108, 8, 0x22c55e).setOrigin(0, 0.5).setDepth(4001);
    this.heroHpText = this.add.text(cx, cy - 101, '', {
      fontSize: '12px', color: '#f8fafc', fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(4002);

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

    if (cid === 'warrior' || cid === 'ranger' || cid === 'mage') {
      const book = cid === 'warrior' ? WARRIOR_SKILLS : (cid === 'ranger' ? RANGER_SKILLS : MAGE_SKILLS);
      const sid = eqList[slotIdx];
      if (!sid || !book[sid]) return null;
      const sk = book[sid];
      const lvl = state.skillTree?.[sk.treeNodeId] || 0;
      if (lvl <= 0) return null;
      const cd = Math.round(sk.cooldownMs * (this.getStats().cdrMult || 1));
      const mpCost = (sid === 'bladestorm' || sid === 'phantombow' || sid === 'void_beam') ? 26 : 18;
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
    if (this.playerMp < cost) {
      if (isManual) this.spawnFloatingText(this.hero.x, this.hero.y - 90, '魔力不足!', '#60a5fa', 14);
      return false;
    }
    this.playerMp = Math.max(0, this.playerMp - cost);
    this.slotCdTimers[slotIdx] = 0;

    if (info.cid === 'warrior') {
      this.castWarriorSkill(info.id, info.level, this.getStats(), isManual);
    } else if (info.cid === 'ranger') {
      this.castRangerSkill(info.id, info.level, this.getStats(), isManual);
    } else if (info.cid === 'mage') {
      this.castMageSkill(info.id, info.level, this.getStats(), isManual);
    }
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
    const initKey = `mob_${data.id}_walk_0`;
    const castShadow = this.add.image(sx - 12, sy + 26, initKey)
      .setTint(0x000000).setScale(data.scale, data.scale * 0.42).setAlpha(0.28).setDepth(3);

    const sprite = this.add.sprite(sx, sy, initKey).setScale(data.scale).setDepth(sy).setAlpha(0);
    sprite.play(`mob_${data.id}_walk`);
    this.tweens.add({ targets: sprite, alpha: 1, duration: 260 });

    const barW = data.isBoss ? 140 : 72;
    const hpBg = this.add.rectangle(sx, sy - (data.isBoss ? 100 : 64), barW, 8, 0x0b0e14).setStrokeStyle(1, 0x64748b).setDepth(3500);
    const hpFill = this.add.rectangle(sx - barW / 2, sy - (data.isBoss ? 100 : 64), barW, 6, data.isBoss ? 0xf97316 : 0xef4444).setOrigin(0, 0.5).setDepth(3501);
    const nameText = this.add.text(sx, sy - (data.isBoss ? 116 : 78), data.isBoss ? data.name : '', {
      fontSize: '12px', color: '#fde68a', fontFamily: 'sans-serif', fontStyle: 'bold',
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
      jitterAngle: Math.random() * Math.PI * 2,
      stunUntil: 0,
      slowUntil: 0,
    });
  }

  spawnWaveSquad() {
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
    for (let i = 0; i < 3; i++) {
      const info = this.getSlotSkillInfo(i);
      if (info) {
        this.slotCdTimers[i] = Math.min(info.cooldownMs, this.slotCdTimers[i] + delta);
        ratios[i] = this.slotCdTimers[i] / info.cooldownMs;
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
      this.callbacks.onSkillTicks(ratios);
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

    this.updateMinimap();
    if (this.isTransitioning) return;

    const stats = this.getStats();
    const dt = delta / 1000;
    this.waveElapsedSec += dt;



    const cid = this.getState().classId || 'warrior';
    this.updateHeroMovement(time, delta, dt, stats, cid);
    this.updateMonstersAI(time, delta, dt, stats);
    this.updateProjectiles(dt, stats);

    const nearest = this.findNearestMonster(this.hero.x, this.hero.y);
    if (nearest) {
      const atkRange = cid === 'warrior' ? 165 : (cid === 'ranger' ? 430 : 370);
      const dist = Phaser.Math.Distance.Between(this.hero.x, this.hero.y, nearest.sprite.x, nearest.sprite.y);

      if (dist <= Math.max(260, atkRange)) {
        for (let i = 0; i < 3; i++) {
          if (this.castSkillSlot(i)) break;
        }
      }

      this.heroAttackTimer += delta;
      if (this.heroAttackTimer >= stats.atkIntervalMs && dist <= atkRange) {
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
      if (this.bossTimeLeft <= 0) {
        this.handleHeroDefeat('首領戰超時，退回起點重整旗鼓！');
      }
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
          const isRanged = classId !== 'warrior';
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
              const idealR = classId === 'ranger' ? 310 : 330;
              if (dist > idealR) {
                vx = (dx / dist) * stats.moveSpeed;
                vy = (dy / dist) * stats.moveSpeed;
              } else {
                vx = (-dy / dist) * stats.moveSpeed * 0.5;
                vy = (dx / dist) * stats.moveSpeed * 0.5;
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
            if (dist > 95) {
              vx = (dx / dist) * stats.moveSpeed;
              vy = (dy / dist) * stats.moveSpeed;
            } else {
              vx = (-dy / dist) * stats.moveSpeed * 0.35;
              vy = (dx / dist) * stats.moveSpeed * 0.35;
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
    this.heroCastShadow.setTexture(this.hero.texture.key);
    this.heroHpBg.setPosition(this.hero.x, this.hero.y - 86);
    this.heroHpFill.setPosition(this.hero.x - 54, this.hero.y - 86);
    this.heroHpText.setPosition(this.hero.x, this.hero.y - 101);
  }

  updateHeroVisualPose(vx, vy, time = 0) {
    const cid = this.getState().classId || 'warrior';
    const spd = Math.hypot(vx, vy);
    const isMoving = spd > 14;
    const isAttacking = time < this.heroAttackAnimUntil;

    if (isMoving && !isAttacking && time >= (this.heroDirLockUntil || 0)) {
      let nextDir = this.heroDir;
      let nextFlip = this.heroFlipX;
      if (Math.abs(vy) > Math.abs(vx) * 1.25) {
        nextDir = vy < 0 ? 'up' : 'down';
        nextFlip = false;
      } else if (Math.abs(vx) > 10) {
        nextDir = 'right';
        nextFlip = vx < 0;
      }
      if (nextDir !== this.heroDir || nextFlip !== this.heroFlipX) {
        this.heroDir = nextDir;
        this.heroFlipX = nextFlip;
        this.heroDirLockUntil = time + 110;
      }
    }
    this.hero.setFlipX(this.heroFlipX);

    if (cid === 'warrior' || cid === 'ranger' || cid === 'mage') {
      const prefix = cid === 'warrior' ? 'w' : (cid === 'ranger' ? 'r' : 'm');
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
      const dx = this.hero.x - m.sprite.x;
      const dy = this.hero.y - m.sprite.y;
      const dist = Math.hypot(dx, dy) || 1;
      const stopRange = m.isBoss ? 94 : (m.isRanged ? 260 : 70);

      if (dist > stopRange) {
        const mx = (dx / dist + Math.cos(m.jitterAngle) * 0.16) * m.speed * slowFactor * dt;
        const my = (dy / dist + Math.sin(m.jitterAngle) * 0.16) * m.speed * slowFactor * dt;
        m.sprite.x = Phaser.Math.Clamp(m.sprite.x + mx, 120, MAP_W - 120);
        m.sprite.y = Phaser.Math.Clamp(m.sprite.y + my, 180, MAP_H - 180);
        this.resolveObstacleCollision(m.sprite, m.isBoss ? 34 : 24);
      }

      const mobFlip = dx < 0;
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
      m.castShadow.setPosition(m.sprite.x - 12, m.sprite.y + 26).setFlipX(mobFlip).setTexture(m.sprite.texture.key);

      m.dustTimer = (m.dustTimer || 0) + delta;
      if (m.dustTimer >= (m.isBoss ? 520 : 880) && dist > stopRange) {
        m.dustTimer = 0;
        const puffColor = m.moveStyle === 'hover' ? 0xf97316 : (m.moveStyle === 'float' ? 0xa855f7 : 0x94a3b8);
        const puff = this.add.image(m.sprite.x, m.sprite.y + 34, 'fx_glow')
          .setTint(puffColor).setScale(m.isBoss ? 0.55 : 0.28).setAlpha(0.45).setDepth(4);
        this.tweens.add({ targets: puff, y: puff.y - 12, scale: 0.08, alpha: 0, duration: 360, onComplete: () => puff.destroy() });
      }

      if (m.isBoss) {
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

      if (dist <= stopRange + 28) {
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

  performHeroAttack(time, stats, classId, target) {
    this.faceHeroToward(target.sprite.x, target.sprite.y);
    this.heroAttackAnimUntil = time + 270;
    const atkPrefix = classId === 'warrior' ? 'w' : (classId === 'ranger' ? 'r' : 'm');
    this.hero.play(`${atkPrefix}_${this.heroDir}_atk`, false);
    const mpGain = classId === 'mage' ? 7 : (classId === 'ranger' ? 5 : 4);
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

    if (classId === 'warrior') {
      const step = this.basicComboStep % 3;
      this.basicComboStep = (this.basicComboStep + 1) % 3;
      const isFinisher = step === 2;
      const reach = isFinisher ? 215 : 170;
      const arcDeg = isFinisher ? 115 : 75;
      const dmgMult = isFinisher ? 1.35 : 0.95;

      const cx = this.hero.x + Math.cos(baseAngle) * (isFinisher ? 68 : 56);
      const cy = this.hero.y + Math.sin(baseAngle) * (isFinisher ? 68 : 56);
      this.playFxSprite('wfx_cleave', cx, cy, isFinisher ? 1.22 : 0.88, baseAngle + (step === 1 ? 0.3 : 0), 250);
      this.playFxSprite('wfx_sparks', cx, cy, isFinisher ? 0.95 : 0.62, Math.random() * Math.PI, 260);

      let hitAny = false;
      this.monsters.filter((m) => m.hp > 0).forEach((m) => {
        const d = Phaser.Math.Distance.Between(this.hero.x, this.hero.y, m.sprite.x, m.sprite.y);
        if (d <= reach) {
          const mobAng = Math.atan2(m.sprite.y - this.hero.y, m.sprite.x - this.hero.x);
          const diff = Math.abs(Phaser.Math.Angle.Wrap(mobAng - baseAngle));
          if (diff <= Phaser.Math.DegToRad(arcDeg) || d <= 74) {
            const { dmg, isCrit } = calcRollDmg(m, dmgMult);
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

    const dmgMult = stats.skillDmgMult || 1;
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

    const dmgMult = stats.skillDmgMult || 1;
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

    const dmgMult = stats.skillDmgMult || 1;
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
    }
  }

  showSkillBanner(name, color = '#fde047') {
    const banner = this.add.text(this.scale.width / 2, 68, `⚡ 【${name}】`, {
      fontSize: '23px', color, fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(5000);
    this.tweens.add({ targets: banner, y: 42, alpha: 0, duration: 920, onComplete: () => banner.destroy() });
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

    if (stats.lifesteal > 0) {
      this.healHero(Math.max(1, Math.round(dmg * (stats.lifesteal / 100))));
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
      return;
    }

    const mitigation = stats.armor / (stats.armor + 45 + m.stage * 14);
    const guardBonus = (this.getState().classId === 'warrior' && this.time.now < (this.warriorGuardUntil || 0))
      ? Math.min(0.20, this.warriorGuardStacks * 0.04) : 0;
    let dmg = Math.max(1, Math.round(m.atk * atkMult * (1 - mitigation) * (1 - guardBonus)));
    if (this.mageShieldHp > 0) {
      const absorbed = Math.min(this.mageShieldHp, dmg);
      this.mageShieldHp -= absorbed;
      dmg -= absorbed;
      if (absorbed > 0) this.spawnFloatingText(this.hero.x, this.hero.y - 84, `🛡️-${formatNum(absorbed)}`, '#38bdf8', 13);
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
    if (stats.activeEffects.has('vampiric_aura')) this.healHero(Math.round(this.playerMaxHp * 0.08));

    this.playFxSprite('fx_explosion', m.sprite.x, m.sprite.y, m.isBoss ? 1.25 : 0.48, 0, 320);
    const mx = m.sprite.x;
    const my = m.sprite.y;

    m.sprite.destroy();
    m.groundShadow.destroy();
    m.castShadow.destroy();
    m.hpBg.destroy();
    m.hpFill.destroy();
    m.nameText.destroy();

    this.waveKills += 1;
    const remaining = this.monsters.filter((t) => t.hp > 0).length;
    const waveCleared = remaining === 0;
    const dropResult = this.callbacks.onMonsterKilled(m, waveCleared);
    if (dropResult && dropResult.item) {
      this.spawnLootBeam(mx, my + 24, dropResult.item);
    }

    this.updateWaveBanner();

    if (waveCleared) {
      this.potionCharges = Math.min(this.potionMaxCharges, this.potionCharges + 1);
      this.isTransitioning = true;
      this.time.delayedCall(550, () => {
        if (this.callbacks?.onStageCleared) {
          this.callbacks.onStageCleared(m.stage);
        } else {
          this.spawnWaveSquad();
        }
      });
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
    const beam = this.add.rectangle(x, y - 95, 18, 190, r.beam, 0.65).setBlendMode(Phaser.BlendModes.ADD).setDepth(4400);
    const orb = this.add.circle(x, y - 6, 9, r.beam, 1).setStrokeStyle(2, 0xffffff).setDepth(4401);
    const tag = this.add.text(x, y - 38, `[${r.label}] ${item.name}`, {
      fontSize: '13px', color: r.color, fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(4402);

    this.tweens.add({
      targets: [beam, orb],
      alpha: 0,
      scaleX: 0.4,
      duration: 1200,
      delay: 350,
      onComplete: () => { beam.destroy(); orb.destroy(); },
    });
    this.tweens.add({
      targets: tag,
      y: y - 80,
      alpha: 0,
      duration: 1400,
      delay: 300,
      onComplete: () => tag.destroy(),
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
