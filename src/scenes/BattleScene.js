import { CLASSES } from '../data/classes.js';
import { WARRIOR_SKILLS } from '../data/warriorSkills.js';
import { RARITIES } from '../data/items.js';
import { createWaveSquad, spawnSingleMonster, getWaveTargetKills } from '../data/monsters.js';
import { formatNum } from '../logic/statCalc.js';

const MAP_W = 3600;
const MAP_H = 2100;
const ZONE_EMBERS = [0xfbbf24, 0x34d399, 0x38bdf8, 0xf97316, 0xe879f9];
const FX_NAMES = [
  'fx_slash', 'fx_cross', 'fx_whirlwind', 'fx_crack',
  'fx_arrow', 'fx_beam', 'fx_lightning', 'fx_crit',
  'fx_orb', 'fx_sigil', 'fx_meteor', 'fx_explosion',
  'wfx_cleave', 'wfx_hitflash', 'wfx_sparks', 'wfx_whirl_inner',
  'wfx_whirl_outer', 'wfx_whirl_wind', 'wfx_slam_pillar', 'wfx_lava_ring',
  'wfx_rubble', 'wfx_lava_crack', 'wfx_charge_aura', 'wfx_fire_trail',
  'wfx_blood_ring', 'wfx_blade_wave', 'wfx_wave_trail', 'wfx_pierce_burst',
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
    this.heroAttackTimer = 0;
    this.slotCdTimers = [99999, 99999, 99999];
    this.bossTimeLeft = 0;
    this.isBossWave = false;
    this.isTransitioning = false;
    this.isPaused = false;
    this.lastZoneIdx = -1;
    this.patrolTarget = { x: MAP_W / 2, y: MAP_H / 2 };

    this.waveKills = 0;
    this.waveTargetKills = 12;
    this.waveElapsedSec = 0;
    this.swarmSpawnTimer = 0;

    this.heroDir = 'down';
    this.heroFlipX = false;
    this.heroAttackAnimUntil = 0;
    this.afterimageTimer = 0;
    this.isWhirlwinding = false;

    this.autoMoveEnabled = true;
    this.manualOverrideTimer = 0;
  }

  init(data) {
    this.callbacks = data.callbacks;
    this.getState = data.getState;
    this.getStats = data.getStats;
  }

  preload() {
    // 戰士 24 幀連續動作
    ['down', 'up', 'right'].forEach((d) => {
      ['walk', 'atk'].forEach((st) => {
        for (let i = 0; i < 4; i++) {
          this.load.image(`wf_${d}_${st}_${i}`, `./assets/heroes/warrior_frames/${d}_${st}_${i}.png`);
        }
      });
    });

    // 遊俠與法師 2.5D 圖
    ['ranger', 'mage'].forEach((cid) => {
      ['down', 'up', 'right'].forEach((d) => {
        ['move', 'atk'].forEach((s) => {
          this.load.image(`hero_${cid}_${d}_${s}`, `./assets/heroes/${cid}_${d}_${s}.png`);
        });
      });
    });

    this.load.image('mob_goblin', './assets/monsters/goblin.png');
    this.load.image('mob_spider', './assets/monsters/spider.png');
    this.load.image('mob_skeleton', './assets/monsters/skeleton.png');
    this.load.image('mob_imp', './assets/monsters/imp.png');
    this.load.image('mob_orc', './assets/monsters/orc.png');
    this.load.image('mob_necromancer', './assets/monsters/necromancer.png');
    this.load.image('mob_boss_demon', './assets/monsters/boss_demon.png');

    for (let i = 0; i < 5; i++) {
      this.load.image(`map_zone_${i}`, `./assets/bg/map_${i}.jpg`);
    }

    FX_NAMES.forEach((fx) => {
      this.load.image(fx, `./assets/fx/${fx}.png`);
    });
  }

  create() {
    this.generateFxTextures();
    this.createWarriorAnims();

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
    this.spawnWaveSquad();
  }

  createWarriorAnims() {
    ['down', 'up', 'right'].forEach((d) => {
      if (!this.anims.exists(`w_${d}_walk`)) {
        this.anims.create({
          key: `w_${d}_walk`,
          frames: [0, 1, 2, 3].map((i) => ({ key: `wf_${d}_walk_${i}` })),
          frameRate: 10,
          repeat: -1,
        });
      }
      if (!this.anims.exists(`w_${d}_atk`)) {
        this.anims.create({
          key: `w_${d}_atk`,
          frames: [0, 1, 2, 3].map((i) => ({ key: `wf_${d}_atk_${i}` })),
          frameRate: 15,
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
    const texKey = cid === 'warrior' ? 'wf_down_walk_0' : `hero_${cid}_down_move`;

    this.heroGroundShadow = this.add.image(cx, cy + 44, 'fx_glow')
      .setTint(0x000000).setScale(1.7, 0.6).setAlpha(0.62).setDepth(2);
    this.heroCastShadow = this.add.image(cx - 14, cy + 28, texKey)
      .setTint(0x000000).setScale(0.56, 0.25).setAlpha(0.32).setDepth(3);

    this.hero = this.add.sprite(cx, cy, texKey).setScale(0.56).setDepth(cy);
    if (cid === 'warrior') this.hero.play('w_down_walk');

    this.heroHpBg = this.add.rectangle(cx, cy - 86, 108, 10, 0x0b0e14).setStrokeStyle(1.5, 0xc89b3c).setDepth(4000);
    this.heroHpFill = this.add.rectangle(cx - 54, cy - 86, 108, 8, 0x22c55e).setOrigin(0, 0.5).setDepth(4001);
    this.heroHpText = this.add.text(cx, cy - 101, '', {
      fontSize: '12px', color: '#f8fafc', fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(4002);

    this.cameras.main.startFollow(this.hero, true, 0.09, 0.09);
  }

  createMinimap() {
    this.miniW = 152;
    this.miniH = 88;
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
    return Math.floor((stage - 1) / 3) % 5;
  }

  updateZoneBackground() {
    const idx = this.getZoneIdx();
    if (idx !== this.lastZoneIdx && this.bgImage) {
      this.lastZoneIdx = idx;
      this.bgImage.setTexture(`map_zone_${idx}`).setDisplaySize(MAP_W, MAP_H);
    }
  }

  setPaused(paused) {
    this.isPaused = paused;
  }

  getSlotSkillInfo(slotIdx) {
    const state = this.getState();
    const cid = state.classId || 'warrior';
    if (cid === 'warrior') {
      const sid = (state.equippedSkills || [])[slotIdx];
      if (!sid || !WARRIOR_SKILLS[sid]) return null;
      const sk = WARRIOR_SKILLS[sid];
      const lvl = state.skillTree?.[sk.treeNodeId] || 0;
      if (lvl <= 0) return null;
      const cd = Math.round(sk.cooldownMs * (this.getStats().cdrMult || 1));
      return { id: sid, name: sk.name, cooldownMs: cd, level: lvl, isWarrior: true };
    }
    if (slotIdx > 0) return null;
    const cls = CLASSES[cid] || CLASSES.ranger;
    const cd = Math.round(cls.skill.cooldownMs * (this.getStats().cdrMult || 1));
    return { id: cls.skill.type, name: cls.skill.name, cooldownMs: cd, level: 1, isWarrior: false, cls };
  }

  castSkillSlot(slotIdx) {
    if (this.isPaused || this.isTransitioning || this.monsters.length === 0) return false;
    const info = this.getSlotSkillInfo(slotIdx);
    if (!info) return false;
    if (this.slotCdTimers[slotIdx] < info.cooldownMs) return false;
    this.slotCdTimers[slotIdx] = 0;

    if (info.isWarrior) {
      this.castWarriorSkill(info.id, info.level, this.getStats());
    } else {
      this.triggerLegacyClassSkill(info.cls, this.getStats());
    }
    return true;
  }

  refreshHeroClass() {
    const stats = this.getStats();
    this.playerMaxHp = stats.maxHp;
    this.playerHp = stats.maxHp;
    this.slotCdTimers = [99999, 99999, 99999];
    this.updateHeroVisualPose(0, 0, this.time.now);
    this.updateHeroHpBar();
  }

  syncMaxHp() {
    const stats = this.getStats();
    const diff = stats.maxHp - this.playerMaxHp;
    this.playerMaxHp = stats.maxHp;
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

  spawnMonsterInstance(data, angle) {
    const dist = data.isBoss ? 480 : Phaser.Math.Between(380, 650);
    const sx = Phaser.Math.Clamp(this.hero.x + Math.cos(angle) * dist, 180, MAP_W - 180);
    const sy = Phaser.Math.Clamp(this.hero.y + Math.sin(angle) * dist, 180, MAP_H - 180);

    const groundShadow = this.add.image(sx, sy + 40, 'fx_glow')
      .setTint(0x000000).setScale(data.isBoss ? 2.1 : 1.3, data.isBoss ? 0.72 : 0.45).setAlpha(0.58).setDepth(2);
    const castShadow = this.add.image(sx - 12, sy + 26, data.spriteKey)
      .setTint(0x000000).setScale(data.scale, data.scale * 0.42).setAlpha(0.28).setDepth(3);

    const sprite = this.add.image(sx, sy, data.spriteKey).setScale(data.scale).setDepth(sy).setAlpha(0);
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
      jitterAngle: Math.random() * Math.PI * 2,
      stunUntil: 0,
    });
  }

  spawnWaveSquad() {
    this.updateZoneBackground();
    this.clearAllMonsters();

    const state = this.getState();
    const squad = createWaveSquad(state.stage, state.wave);
    this.isTransitioning = false;
    this.waveKills = 0;
    this.waveElapsedSec = 0;
    this.swarmSpawnTimer = 0;
    this.waveTargetKills = getWaveTargetKills(state.stage, state.wave);
    this.isBossWave = squad.some((m) => m.isBoss);
    this.bossTimeLeft = this.isBossWave ? 32 : 0;

    squad.forEach((data, idx) => {
      const angle = (Math.PI * 2 * idx) / squad.length + Math.random() * 0.6;
      this.spawnMonsterInstance(data, angle);
    });

    this.updateHeroHpBar();
    this.updateWaveBanner();
  }

  updateWaveBanner() {
    if (!this.waveInfoText) return;
    if (this.isBossWave) {
      this.waveInfoText.setColor('#fb923c');
      this.waveInfoText.setText(`🔥 首領圍攻！狂暴倒數: ${Math.max(0, this.bossTimeLeft).toFixed(1)}s`);
    } else {
      this.waveInfoText.setColor('#fde68a');
      this.waveInfoText.setText(`⚔️ 本波擊殺進度: ${this.waveKills} / ${this.waveTargetKills}（怪物持續湧入中）`);
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

    // 更新 3 個技能槽冷卻
    const ratios = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      const info = this.getSlotSkillInfo(i);
      if (info) {
        this.slotCdTimers[i] = Math.min(info.cooldownMs, this.slotCdTimers[i] + delta);
        ratios[i] = this.slotCdTimers[i] / info.cooldownMs;
      }
    }
    if (this.callbacks?.onSkillTicks) {
      this.callbacks.onSkillTicks(ratios);
    }

    this.updateMinimap();
    if (this.isTransitioning) return;

    const stats = this.getStats();
    const dt = delta / 1000;
    this.waveElapsedSec += dt;

    this.swarmSpawnTimer += delta;
    if (this.swarmSpawnTimer >= 2100) {
      this.swarmSpawnTimer = 0;
      const aliveCount = this.monsters.filter((m) => m.hp > 0).length;
      if (aliveCount < 18) {
        const batch = Math.min(5, 2 + Math.floor(this.waveElapsedSec / 7));
        const state = this.getState();
        for (let i = 0; i < batch; i++) {
          const mob = spawnSingleMonster(state.stage, state.wave, false);
          this.spawnMonsterInstance(mob, Math.random() * Math.PI * 2);
        }
      }
    }

    const cid = this.getState().classId || 'warrior';
    this.updateHeroMovement(time, delta, dt, stats, cid);
    this.updateMonstersAI(time, delta, dt, stats);
    this.updateProjectiles(dt, stats);

    const nearest = this.findNearestMonster(this.hero.x, this.hero.y);
    if (nearest) {
      const atkRange = cid === 'warrior' ? 165 : (cid === 'ranger' ? 430 : 370);
      const dist = Phaser.Math.Distance.Between(this.hero.x, this.hero.y, nearest.sprite.x, nearest.sprite.y);

      // 自動施放就緒的主動技能
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

    if (this.isBossWave) {
      this.bossTimeLeft -= dt;
      this.updateWaveBanner();
      if (this.bossTimeLeft <= 0) {
        this.handleHeroDefeat('首領戰超時，退回第 1 波重整旗鼓！');
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
          const dx = nearest.sprite.x - this.hero.x;
          const dy = nearest.sprite.y - this.hero.y;
          const dist = Math.hypot(dx, dy) || 1;
          const isRanged = classId !== 'warrior';

          if (isRanged && dist < 165) {
            vx = -(dx / dist) * stats.moveSpeed;
            vy = -(dy / dist) * stats.moveSpeed;
          } else if (dist > (isRanged ? 280 : 100)) {
            vx = (dx / dist) * stats.moveSpeed;
            vy = (dy / dist) * stats.moveSpeed;
          } else {
            vx = (-dy / dist) * stats.moveSpeed * 0.45;
            vy = (dx / dist) * stats.moveSpeed * 0.45;
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

    this.hero.x = Phaser.Math.Clamp(this.hero.x + vx * dt, 200, MAP_W - 200);
    this.hero.y = Phaser.Math.Clamp(this.hero.y + vy * dt, 180, MAP_H - 180);
    this.hero.setDepth(this.hero.y);

    this.updateHeroVisualPose(vx, vy, time);

    if (Math.hypot(vx, vy) > 25) {
      this.afterimageTimer += delta;
      if (this.afterimageTimer >= 140) {
        this.afterimageTimer = 0;
        const ghost = this.add.image(this.hero.x, this.hero.y, this.hero.texture.key)
          .setScale(0.54).setFlipX(this.heroFlipX).setAlpha(0.24).setTint(0xfbbf24).setDepth(this.hero.y - 1);
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
    const isMoving = Math.abs(vx) > 8 || Math.abs(vy) > 8;
    if (isMoving) {
      if (Math.abs(vy) > Math.abs(vx) * 1.15) {
        this.heroDir = vy < 0 ? 'up' : 'down';
        this.heroFlipX = false;
      } else {
        this.heroDir = 'right';
        this.heroFlipX = vx < 0;
      }
    }
    this.hero.setFlipX(this.heroFlipX);

    const isAttacking = time < this.heroAttackAnimUntil;
    if (cid === 'warrior') {
      const animKey = `w_${this.heroDir}_${isAttacking ? 'atk' : 'walk'}`;
      if (this.hero.anims.currentAnim?.key !== animKey || (!this.hero.anims.isPlaying && isAttacking)) {
        this.hero.play(animKey, true);
      }
      if (!isAttacking && !isMoving && this.hero.anims.isPlaying) {
        this.hero.anims.pause(this.hero.anims.currentAnim.frames[0]);
      } else if (!isAttacking && isMoving && this.hero.anims.isPaused) {
        this.hero.anims.resume();
      }
    } else {
      const key = `hero_${cid}_${this.heroDir}_${isAttacking ? 'atk' : 'move'}`;
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
      if (time < (m.stunUntil || 0)) continue;

      const dx = this.hero.x - m.sprite.x;
      const dy = this.hero.y - m.sprite.y;
      const dist = Math.hypot(dx, dy) || 1;
      const stopRange = m.isBoss ? 94 : (m.isRanged ? 260 : 70);

      if (dist > stopRange) {
        const mx = (dx / dist + Math.cos(m.jitterAngle) * 0.16) * m.speed * dt;
        const my = (dy / dist + Math.sin(m.jitterAngle) * 0.16) * m.speed * dt;
        m.sprite.x = Phaser.Math.Clamp(m.sprite.x + mx, 120, MAP_W - 120);
        m.sprite.y = Phaser.Math.Clamp(m.sprite.y + my, 120, MAP_H - 120);
      }

      const mobFlip = dx > 0;
      m.sprite.setFlipX(mobFlip).setDepth(m.sprite.y);
      m.groundShadow.setPosition(m.sprite.x, m.sprite.y + 40);
      m.castShadow.setPosition(m.sprite.x - 12, m.sprite.y + 26).setFlipX(mobFlip);

      const barY = m.sprite.y - (m.isBoss ? 100 : 64);
      m.hpBg.setPosition(m.sprite.x, barY);
      m.hpFill.setPosition(m.sprite.x - m.barW / 2, barY);
      m.nameText.setPosition(m.sprite.x, barY - 16);

      if (dist <= stopRange + 28) {
        m.attackTimer += delta;
        if (m.attackTimer >= m.atkIntervalMs) {
          m.attackTimer = 0;
          if (m.isRanged) {
            this.fireEnemyBolt(m);
          } else {
            this.performMonsterAttack(m, stats);
          }
        }
      }
    }
  }

  fireEnemyBolt(m) {
    const ang = Math.atan2(this.hero.y - m.sprite.y, this.hero.x - m.sprite.x);
    const spr = this.add.image(m.sprite.x, m.sprite.y - 10, 'fx_glow')
      .setTint(0x22c55e).setScale(0.55).setBlendMode(Phaser.BlendModes.ADD).setDepth(4500);
    this.projectiles.push({
      fromEnemy: true,
      sprite: spr,
      vx: Math.cos(ang) * 290,
      vy: Math.sin(ang) * 290,
      lifeMs: 1800,
      mob: m,
    });
  }

  performHeroAttack(time, stats, classId, target) {
    this.faceHeroToward(target.sprite.x, target.sprite.y);
    this.heroAttackAnimUntil = time + 290;
    const baseAngle = Math.atan2(target.sprite.y - this.hero.y, target.sprite.x - this.hero.x);

    const calcRollDmg = (mob) => {
      const isCrit = Math.random() * 100 < stats.critRate;
      let dmg = stats.atk * (0.92 + Math.random() * 0.16);
      if (stats.activeEffects.has('execute') && mob.hp / mob.maxHp < 0.35) dmg *= 1.35;
      if (isCrit) dmg *= stats.critDmg / 100;
      return { dmg: Math.max(1, Math.round(dmg)), isCrit };
    };

    if (classId === 'warrior') {
      const cx = this.hero.x + Math.cos(baseAngle) * 58;
      const cy = this.hero.y + Math.sin(baseAngle) * 58;
      this.playFxSprite('wfx_cleave', cx, cy, 0.92, baseAngle, 250);
      this.playFxSprite('wfx_sparks', cx, cy, 0.65, Math.random() * Math.PI, 260);

      let hitAny = false;
      this.monsters.filter((m) => m.hp > 0).forEach((m) => {
        const d = Phaser.Math.Distance.Between(this.hero.x, this.hero.y, m.sprite.x, m.sprite.y);
        if (d <= 170) {
          const mobAng = Math.atan2(m.sprite.y - this.hero.y, m.sprite.x - this.hero.x);
          const diff = Math.abs(Phaser.Math.Angle.Wrap(mobAng - baseAngle));
          if (diff <= Phaser.Math.DegToRad(75) || d <= 68) {
            const { dmg, isCrit } = calcRollDmg(m);
            this.playFxSprite('wfx_hitflash', m.sprite.x, m.sprite.y - 10, 0.42, 0, 180);
            this.applyHitEffects(m, dmg, isCrit, stats);
            const kb = m.isBoss ? 10 : 28;
            m.sprite.x = Phaser.Math.Clamp(m.sprite.x + Math.cos(mobAng) * kb, 120, MAP_W - 120);
            m.sprite.y = Phaser.Math.Clamp(m.sprite.y + Math.sin(mobAng) * kb, 120, MAP_H - 120);
            hitAny = true;
          }
        }
      });
      if (!hitAny && target.hp > 0) {
        const { dmg, isCrit } = calcRollDmg(target);
        this.applyHitEffects(target, dmg, isCrit, stats);
      }
    } else if (classId === 'ranger') {
      const spr = this.add.image(this.hero.x, this.hero.y - 12, 'fx_arrow')
        .setScale(0.46).setRotation(baseAngle).setBlendMode(Phaser.BlendModes.ADD).setDepth(4508);
      this.projectiles.push({
        fromEnemy: false,
        kind: 'pierce_arrow',
        sprite: spr,
        vx: Math.cos(baseAngle) * 680,
        vy: Math.sin(baseAngle) * 680,
        lifeMs: 950,
        pierceLeft: 3,
        hitIds: new Set(),
        stats,
      });
    } else {
      const spr = this.add.image(this.hero.x, this.hero.y - 16, 'fx_orb')
        .setScale(0.45).setBlendMode(Phaser.BlendModes.ADD).setDepth(4508);
      this.projectiles.push({
        fromEnemy: false,
        kind: 'aoe_orb',
        sprite: spr,
        vx: Math.cos(baseAngle) * 520,
        vy: Math.sin(baseAngle) * 520,
        lifeMs: 1100,
        stats,
      });
    }
  }

  // 戰士 4 大主動技能多層完整特效實作
  castWarriorSkill(skillId, skillLvl, stats) {
    const alive = this.monsters.filter((m) => m.hp > 0);
    if (alive.length === 0) return;
    const sk = WARRIOR_SKILLS[skillId];
    const target = this.findNearestMonster(this.hero.x, this.hero.y) || alive[0];
    this.faceHeroToward(target.sprite.x, target.sprite.y);
    this.heroAttackAnimUntil = this.time.now + 420;

    const dmgMult = stats.skillDmgMult || 1;
    const radMult = stats.skillRadiusMult || 1;

    const banner = this.add.text(this.scale.width / 2, 68, `⚡ 【${sk.name}】`, {
      fontSize: '23px', color: '#fde047', fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(5000);
    this.tweens.add({ targets: banner, y: 42, alpha: 0, duration: 920, onComplete: () => banner.destroy() });

    if (skillId === 'whirlwind') {
      const radius = 235 * radMult;
      const inner = this.add.image(this.hero.x, this.hero.y, 'wfx_whirl_inner').setScale(1.25 * radMult).setBlendMode(Phaser.BlendModes.ADD).setDepth(4502);
      const outer = this.add.image(this.hero.x, this.hero.y, 'wfx_whirl_outer').setScale(1.55 * radMult).setBlendMode(Phaser.BlendModes.ADD).setDepth(4503);
      const wind = this.add.image(this.hero.x, this.hero.y + 16, 'wfx_whirl_wind').setScale(1.6 * radMult).setAlpha(0.75).setBlendMode(Phaser.BlendModes.ADD).setDepth(4500);

      const spinEv = this.time.addEvent({
        delay: 260,
        repeat: 3,
        callback: () => {
          const tickDmg = Math.round(stats.atk * (0.80 + skillLvl * 0.18) * dmgMult);
          this.monsters.filter((m) => m.hp > 0).forEach((m) => {
            if (Phaser.Math.Distance.Between(this.hero.x, this.hero.y, m.sprite.x, m.sprite.y) <= radius) {
              this.damageMonster(m, tickDmg, true, false, '#fb923c', '🌪️');
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

      // 地面熔岩裂紋（保留 1.5 秒）
      const crack = this.add.image(mx, my + 12, 'wfx_lava_crack').setScale(1.4 * radMult).setDepth(5);
      this.tweens.add({ targets: crack, alpha: 0, delay: 1100, duration: 450, onComplete: () => crack.destroy() });

      this.playFxSprite('wfx_slam_pillar', mx, my - 50, 1.4 * radMult, 0, 420);
      this.playFxSprite('wfx_lava_ring', mx, my + 10, 1.65 * radMult, 0, 520);
      this.playFxSprite('wfx_rubble', mx, my - 10, 1.35 * radMult, 0, 480);

      const dmg = Math.round(stats.atk * (2.1 + skillLvl * 0.35) * dmgMult);
      alive.forEach((m) => {
        const d = Phaser.Math.Distance.Between(mx, my, m.sprite.x, m.sprite.y);
        if (d <= radius) {
          this.damageMonster(m, dmg, true, false, '#f97316', '🌋');
          m.stunUntil = this.time.now + 1200;
          const ang = Math.atan2(m.sprite.y - my, m.sprite.x - mx);
          const kb = m.isBoss ? 18 : 56;
          m.sprite.x = Phaser.Math.Clamp(m.sprite.x + Math.cos(ang) * kb, 120, MAP_W - 120);
          m.sprite.y = Phaser.Math.Clamp(m.sprite.y + Math.sin(ang) * kb, 120, MAP_H - 120);
        }
      });
      this.cameras.main.shake(260, 0.014);
    } else if (skillId === 'bloodcharge') {
      const ang = Math.atan2(target.sprite.y - this.hero.y, target.sprite.x - this.hero.x);
      const sx = this.hero.x;
      const sy = this.hero.y;
      const tx = Phaser.Math.Clamp(sx + Math.cos(ang) * 280, 200, MAP_W - 200);
      const ty = Phaser.Math.Clamp(sy + Math.sin(ang) * 280, 180, MAP_H - 180);

      const aura = this.add.image(sx, sy, 'wfx_charge_aura')
        .setScale(1.15).setRotation(ang).setBlendMode(Phaser.BlendModes.ADD).setDepth(4505);
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
            if (Phaser.Math.Distance.Between(this.hero.x, this.hero.y, m.sprite.x, m.sprite.y) <= 190 * radMult) {
              this.damageMonster(m, dmg, true, false, '#f87171', '🩸');
            }
          });
          this.healHero(Math.round(this.playerMaxHp * (0.10 + skillLvl * 0.02)));
        },
      });
    } else if (skillId === 'bladestorm') {
      const baseAng = Math.atan2(target.sprite.y - this.hero.y, target.sprite.x - this.hero.x);
      const angles = [baseAng - 0.34, baseAng, baseAng + 0.34];
      const waveDmg = Math.round(stats.atk * (1.45 + skillLvl * 0.28) * dmgMult);

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
            fixedDmg: waveDmg,
            hitIds: new Set(),
            stats,
          });
        });
      });
    }
  }

  triggerLegacyClassSkill(cls, stats) {
    const alive = this.monsters.filter((m) => m.hp > 0);
    if (alive.length === 0) return;
    const sk = cls.skill;
    const target = this.findNearestMonster(this.hero.x, this.hero.y) || alive[0];
    this.faceHeroToward(target.sprite.x, target.sprite.y);
    this.heroAttackAnimUntil = this.time.now + 360;

    const dmgMult = stats.skillDmgMult || 1;
    const radMult = stats.skillRadiusMult || 1;

    if (sk.type === 'volley') {
      for (let i = 0; i < sk.hits; i++) {
        this.time.delayedCall(i * 115, () => {
          const curAlive = this.monsters.filter((m) => m.hp > 0);
          if (curAlive.length === 0) return;
          const tMob = curAlive[i % curAlive.length];
          this.launchFxProjectile('fx_beam', this.hero.x, this.hero.y - 14, tMob.sprite.x, tMob.sprite.y - 12, 0.72, () => {
            this.playFxSprite('fx_crit', tMob.sprite.x, tMob.sprite.y - 10, 0.75 * radMult, Math.random() * Math.PI, 280);
            const isCrit = Math.random() * 100 < (stats.critRate + sk.bonusCrit);
            let dmg = stats.atk * sk.mult * dmgMult;
            if (isCrit) dmg *= stats.critDmg / 100;
            this.monsters.filter((m) => m.hp > 0).forEach((m) => {
              if (Phaser.Math.Distance.Between(tMob.sprite.x, tMob.sprite.y, m.sprite.x, m.sprite.y) <= 135 * radMult) {
                this.damageMonster(m, Math.round(dmg), isCrit, false, '#34d399', '🏹');
              }
            });
          }, 120);
        });
      }
    } else if (sk.type === 'meteor') {
      const mx = target.sprite.x;
      const my = target.sprite.y;
      const sigil = this.add.image(mx, my + 20, 'fx_sigil').setScale(1.15 * radMult).setBlendMode(Phaser.BlendModes.ADD).setDepth(4499);
      const meteor = this.add.image(mx - 140, my - 300, 'fx_meteor').setScale(0.95).setBlendMode(Phaser.BlendModes.ADD).setDepth(4505);
      this.tweens.add({
        targets: meteor,
        x: mx,
        y: my,
        duration: 330,
        ease: 'Quad.easeIn',
        onComplete: () => {
          meteor.destroy();
          sigil.destroy();
          this.playFxSprite('fx_explosion', mx, my - 14, 1.5 * radMult, 0, 460);
          const dmg = Math.round(stats.atk * sk.mult * dmgMult);
          this.monsters.filter((m) => m.hp > 0).forEach((m) => {
            if (Phaser.Math.Distance.Between(mx, my, m.sprite.x, m.sprite.y) <= 240 * radMult) {
              this.damageMonster(m, dmg, true, false, '#e879f9', '☄️');
            }
          });
          this.cameras.main.shake(220, 0.012);
        },
      });
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
        if (Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, this.hero.x, this.hero.y) <= 42) {
          this.performMonsterAttack(p.mob, stats);
          remove = true;
        }
      } else if (!remove && !p.fromEnemy) {
        for (const m of this.monsters) {
          if (m.hp <= 0 || (p.hitIds && p.hitIds.has(m.uid))) continue;
          const hitR = (p.kind === 'blade_wave' ? 95 : 48) + (m.isBoss ? 25 : 0);
          if (Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, m.sprite.x, m.sprite.y) <= hitR) {
            if (p.kind === 'blade_wave') {
              p.hitIds.add(m.uid);
              this.playFxSprite('wfx_pierce_burst', m.sprite.x, m.sprite.y - 10, 0.72, Math.random() * Math.PI, 260);
              this.applyHitEffects(m, p.fixedDmg, true, p.stats);
            } else {
              const isCrit = Math.random() * 100 < p.stats.critRate;
              let dmg = p.stats.atk * (0.92 + Math.random() * 0.16);
              if (isCrit) dmg *= p.stats.critDmg / 100;
              dmg = Math.max(1, Math.round(dmg));

              if (p.kind === 'pierce_arrow') {
                p.hitIds.add(m.uid);
                this.applyHitEffects(m, dmg, isCrit, p.stats);
                p.pierceLeft -= 1;
                if (p.pierceLeft <= 0) { remove = true; break; }
              } else if (p.kind === 'aoe_orb') {
                this.playFxSprite('fx_explosion', p.sprite.x, p.sprite.y, 0.56, 0, 260);
                this.monsters.filter((t) => t.hp > 0).forEach((t) => {
                  if (Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, t.sprite.x, t.sprite.y) <= 105) {
                    this.applyHitEffects(t, dmg, isCrit, p.stats);
                  }
                });
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

  launchFxProjectile(key, sx, sy, tx, ty, scale, onHit, duration = 155) {
    const ang = Math.atan2(ty - sy, tx - sx);
    const proj = this.add.image(sx, sy, key)
      .setScale(scale).setRotation(ang).setBlendMode(Phaser.BlendModes.ADD).setDepth(4508);
    this.tweens.add({
      targets: proj,
      x: tx,
      y: ty,
      duration,
      ease: 'Quad.easeOut',
      onComplete: () => {
        proj.destroy();
        if (onHit) onHit();
      },
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

  performMonsterAttack(m, stats) {
    if (this.isTransitioning || !m || m.hp <= 0) return;

    if (Math.random() * 100 < stats.dodge) {
      this.spawnFloatingText(this.hero.x, this.hero.y - 68, 'MISS', '#94a3b8', 14);
      return;
    }

    const mitigation = stats.armor / (stats.armor + 45 + m.stage * 14);
    const dmg = Math.max(1, Math.round(m.atk * (1 - mitigation)));
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

    if (!this.isBossWave || m.isBoss) {
      this.waveKills += 1;
    }

    const waveCleared = this.isBossWave ? m.isBoss : (this.waveKills >= this.waveTargetKills);
    const dropResult = this.callbacks.onMonsterKilled(m, waveCleared);
    if (dropResult && dropResult.item) {
      this.spawnLootBeam(mx, my + 24, dropResult.item);
    }

    this.updateWaveBanner();

    if (waveCleared) {
      this.isTransitioning = true;
      this.time.delayedCall(650, () => {
        this.spawnWaveSquad();
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
    this.heroHpText.setText(`${formatNum(this.playerHp)} / ${formatNum(this.playerMaxHp)}`);
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
