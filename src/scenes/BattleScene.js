import { CLASSES } from '../data/classes.js';
import { RARITIES } from '../data/items.js';
import { createWaveSquad } from '../data/monsters.js';
import { formatNum } from '../logic/statCalc.js';

const MAP_W = 3600;
const MAP_H = 2100;
const ZONE_EMBERS = [0xfbbf24, 0x34d399, 0x38bdf8, 0xf97316, 0xe879f9];
const FX_NAMES = [
  'fx_slash', 'fx_cross', 'fx_whirlwind', 'fx_crack',
  'fx_arrow', 'fx_beam', 'fx_lightning', 'fx_crit',
  'fx_orb', 'fx_sigil', 'fx_meteor', 'fx_explosion',
];

export class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
    this.callbacks = null;
    this.hero = null;
    this.heroCastShadow = null;
    this.heroGroundShadow = null;
    this.monsters = [];
    this.playerHp = 240;
    this.playerMaxHp = 240;
    this.heroAttackTimer = 0;
    this.skillCooldownTimer = 0;
    this.bossTimeLeft = 0;
    this.isBossWave = false;
    this.isTransitioning = false;
    this.isPaused = false;
    this.lastZoneIdx = -1;
    this.patrolTarget = { x: MAP_W / 2, y: MAP_H / 2 };

    // 2.5D 方向與動作狀態
    this.heroDir = 'down';
    this.heroFlipX = false;
    this.heroAttackAnimUntil = 0;
    this.afterimageTimer = 0;

    // 手動 WASD / 自動模式
    this.autoMoveEnabled = true;
    this.manualOverrideTimer = 0;
  }

  init(data) {
    this.callbacks = data.callbacks;
    this.getState = data.getState;
    this.getStats = data.getStats;
  }

  preload() {
    const dirs = ['down', 'up', 'right'];
    const states = ['move', 'atk'];
    Object.keys(CLASSES).forEach((cid) => {
      dirs.forEach((d) => {
        states.forEach((s) => {
          this.load.image(`hero_${cid}_${d}_${s}`, `./assets/heroes/${cid}_${d}_${s}.png`);
        });
      });
    });

    this.load.image('mob_goblin', './assets/monsters/goblin.png');
    this.load.image('mob_skeleton', './assets/monsters/skeleton.png');
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

    this.bgImage = this.add.image(MAP_W / 2, MAP_H / 2, 'map_zone_0')
      .setDisplaySize(MAP_W, MAP_H)
      .setDepth(0);

    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.createHero();
    this.createMinimap();

    // 鍵盤 WASD + 方向鍵
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

    this.bossTimerText = this.add.text(this.scale.width / 2, 28, '', {
      fontSize: '18px', color: '#fb923c', fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(5000).setVisible(false);

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
        const tapDmg = Math.max(2, Math.round(stats.atk * 0.45));
        this.damageMonster(target, tapDmg, false, true);
        this.playFxSprite('fx_slash', target.sprite.x, target.sprite.y - 10, 0.48, Phaser.Math.FloatBetween(-0.6, 0.6), 220);
      }
    });

    this.scale.on('resize', (gameSize) => {
      this.handleResize(gameSize.width, gameSize.height);
    });

    const stats = this.getStats();
    const cls = CLASSES[this.getState().classId] || CLASSES.warrior;
    this.playerMaxHp = stats.maxHp;
    this.playerHp = stats.maxHp;
    this.skillCooldownTimer = cls.skill.cooldownMs;
    this.spawnWaveSquad();
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
    const texKey = `hero_${cid}_down_move`;

    // 2.5D 雙層立體陰影：底層接地橢圓 ＋ 上層斜向角色剪影
    this.heroGroundShadow = this.add.image(cx, cy + 44, 'fx_glow')
      .setTint(0x000000).setScale(1.65, 0.58).setAlpha(0.62).setDepth(2);
    this.heroCastShadow = this.add.image(cx - 14, cy + 28, texKey)
      .setTint(0x000000).setScale(0.54, 0.24).setAlpha(0.32).setDepth(3);

    this.hero = this.add.image(cx, cy, texKey).setScale(0.54).setDepth(cy);

    this.tweens.add({
      targets: this.hero,
      scaleY: 0.56,
      scaleX: 0.52,
      duration: 620,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.heroHpBg = this.add.rectangle(cx, cy - 84, 108, 10, 0x0b0e14).setStrokeStyle(1.5, 0xc89b3c).setDepth(4000);
    this.heroHpFill = this.add.rectangle(cx - 54, cy - 84, 108, 8, 0x22c55e).setOrigin(0, 0.5).setDepth(4001);
    this.heroHpText = this.add.text(cx, cy - 99, '', {
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

  castSkillManual() {
    if (this.isPaused || this.isTransitioning || this.monsters.length === 0) return false;
    const cls = CLASSES[this.getState().classId] || CLASSES.warrior;
    if (this.skillCooldownTimer < cls.skill.cooldownMs) return false;
    this.skillCooldownTimer = 0;
    this.triggerClassSkill(cls, this.getStats());
    return true;
  }

  refreshHeroClass() {
    const stats = this.getStats();
    this.playerMaxHp = stats.maxHp;
    this.playerHp = stats.maxHp;
    const cls = CLASSES[this.getState().classId] || CLASSES.warrior;
    this.skillCooldownTimer = cls.skill.cooldownMs;
    this.updateHeroVisualPose(0, 0);
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
  }

  spawnWaveSquad() {
    this.updateZoneBackground();
    this.clearAllMonsters();

    const state = this.getState();
    const squad = createWaveSquad(state.stage, state.wave);
    this.isTransitioning = false;
    this.isBossWave = squad.some((m) => m.isBoss);
    this.bossTimeLeft = this.isBossWave ? 28 : 0;
    this.bossTimerText.setVisible(this.isBossWave);

    squad.forEach((data, idx) => {
      const angle = (Math.PI * 2 * idx) / squad.length + Math.random() * 0.6;
      const dist = data.isBoss ? 520 : Phaser.Math.Between(420, 700);
      const sx = Phaser.Math.Clamp(this.hero.x + Math.cos(angle) * dist, 200, MAP_W - 200);
      const sy = Phaser.Math.Clamp(this.hero.y + Math.sin(angle) * dist, 200, MAP_H - 200);

      const groundShadow = this.add.image(sx, sy + 40, 'fx_glow')
        .setTint(0x000000).setScale(data.isBoss ? 2.1 : 1.3, data.isBoss ? 0.72 : 0.45).setAlpha(0.58).setDepth(2);
      const castShadow = this.add.image(sx - 12, sy + 26, data.spriteKey)
        .setTint(0x000000).setScale(data.scale, data.scale * 0.42).setAlpha(0.28).setDepth(3);

      const sprite = this.add.image(sx, sy, data.spriteKey).setScale(data.scale).setDepth(sy).setAlpha(0);
      this.tweens.add({ targets: sprite, alpha: 1, duration: 280 });

      const barW = data.isBoss ? 140 : 76;
      const hpBg = this.add.rectangle(sx, sy - (data.isBoss ? 100 : 66), barW, 8, 0x0b0e14).setStrokeStyle(1, 0x64748b).setDepth(3500);
      const hpFill = this.add.rectangle(sx - barW / 2, sy - (data.isBoss ? 100 : 66), barW, 6, data.isBoss ? 0xf97316 : 0xef4444).setOrigin(0, 0.5).setDepth(3501);
      const nameText = this.add.text(sx, sy - (data.isBoss ? 116 : 80), data.isBoss ? data.name : '', {
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
      });
    });

    this.updateHeroHpBar();
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

    const cls = CLASSES[this.getState().classId] || CLASSES.warrior;
    this.skillCooldownTimer = Math.min(cls.skill.cooldownMs, this.skillCooldownTimer + delta);
    if (this.callbacks?.onSkillTick) {
      this.callbacks.onSkillTick(this.skillCooldownTimer / cls.skill.cooldownMs);
    }

    this.updateMinimap();
    if (this.isTransitioning) return;

    const stats = this.getStats();
    const dt = delta / 1000;

    // 1. WASD 手動優先 + AI 自動走位
    this.updateHeroMovement(time, delta, dt, stats, cls.id);

    // 2. 怪物四面八方湧入與陰影同步
    this.updateMonstersAI(delta, dt, stats);

    // 3. 英雄自動攻擊與技能
    const nearest = this.findNearestMonster(this.hero.x, this.hero.y);
    if (nearest) {
      const atkRange = cls.id === 'warrior' ? 125 : 350;
      const dist = Phaser.Math.Distance.Between(this.hero.x, this.hero.y, nearest.sprite.x, nearest.sprite.y);

      if (this.skillCooldownTimer >= cls.skill.cooldownMs && dist <= Math.max(230, atkRange)) {
        this.skillCooldownTimer = 0;
        this.triggerClassSkill(cls, stats, nearest);
      }

      this.heroAttackTimer += delta;
      if (this.heroAttackTimer >= stats.atkIntervalMs && dist <= atkRange) {
        this.heroAttackTimer = 0;
        this.performHeroAttack(time, stats, cls.id, nearest);
      }
    }

    if (this.isBossWave) {
      this.bossTimeLeft -= dt;
      this.bossTimerText.setText(`🔥 首領狂暴倒數: ${Math.max(0, this.bossTimeLeft).toFixed(1)}s`);
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
      vx = (kx / len) * stats.moveSpeed * 1.25;
      vy = (ky / len) * stats.moveSpeed * 1.25;
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

          if (isRanged && dist < 140) {
            vx = -(dx / dist) * stats.moveSpeed;
            vy = -(dy / dist) * stats.moveSpeed;
          } else if (dist > (isRanged ? 260 : 90)) {
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

    // 奔跑殘影
    if (Math.hypot(vx, vy) > 25) {
      this.afterimageTimer += delta;
      if (this.afterimageTimer >= 135) {
        this.afterimageTimer = 0;
        const ghost = this.add.image(this.hero.x, this.hero.y, this.hero.texture.key)
          .setScale(0.53).setFlipX(this.heroFlipX).setAlpha(0.28).setTint(0x93c5fd).setDepth(this.hero.y - 1);
        this.tweens.add({ targets: ghost, alpha: 0, duration: 240, onComplete: () => ghost.destroy() });
      }
    }

    this.heroGroundShadow.setPosition(this.hero.x, this.hero.y + 44);
    this.heroCastShadow.setPosition(this.hero.x - 14, this.hero.y + 28).setFlipX(this.heroFlipX);
    this.heroHpBg.setPosition(this.hero.x, this.hero.y - 84);
    this.heroHpFill.setPosition(this.hero.x - 54, this.hero.y - 84);
    this.heroHpText.setPosition(this.hero.x, this.hero.y - 99);
  }

  updateHeroVisualPose(vx, vy, time = 0) {
    const cid = this.getState().classId || 'warrior';
    if (Math.abs(vx) > 8 || Math.abs(vy) > 8) {
      if (Math.abs(vy) > Math.abs(vx) * 1.15) {
        this.heroDir = vy < 0 ? 'up' : 'down';
        this.heroFlipX = false;
      } else {
        this.heroDir = 'right';
        this.heroFlipX = vx < 0;
      }
    }
    const isAttacking = time < this.heroAttackAnimUntil;
    const state = isAttacking ? 'atk' : 'move';
    const key = `hero_${cid}_${this.heroDir}_${state}`;
    if (this.hero.texture.key !== key) this.hero.setTexture(key);
    if (this.heroCastShadow.texture.key !== key) this.heroCastShadow.setTexture(key);
    this.hero.setFlipX(this.heroFlipX);
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
  }

  updateMonstersAI(delta, dt, stats) {
    for (const m of this.monsters) {
      if (m.hp <= 0) continue;
      const dx = this.hero.x - m.sprite.x;
      const dy = this.hero.y - m.sprite.y;
      const dist = Math.hypot(dx, dy) || 1;
      const stopRange = m.isBoss ? 94 : 72;

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

      const barY = m.sprite.y - (m.isBoss ? 100 : 66);
      m.hpBg.setPosition(m.sprite.x, barY);
      m.hpFill.setPosition(m.sprite.x - m.barW / 2, barY);
      m.nameText.setPosition(m.sprite.x, barY - 16);

      if (dist <= stopRange + 24) {
        m.attackTimer += delta;
        if (m.attackTimer >= m.atkIntervalMs) {
          m.attackTimer = 0;
          this.performMonsterAttack(m, stats);
        }
      }
    }
  }

  performHeroAttack(time, stats, classId, target) {
    this.faceHeroToward(target.sprite.x, target.sprite.y);
    this.heroAttackAnimUntil = time + 260;

    const isCrit = Math.random() * 100 < stats.critRate;
    let dmg = stats.atk * (0.92 + Math.random() * 0.16);
    if (stats.activeEffects.has('execute') && target.hp / target.maxHp < 0.35) dmg *= 1.35;
    if (isCrit) dmg *= stats.critDmg / 100;
    dmg = Math.max(1, Math.round(dmg));

    const finishHit = (hitMob) => {
      if (!hitMob || hitMob.hp <= 0) return;
      this.damageMonster(hitMob, dmg, isCrit, false);
      if (isCrit) {
        this.playFxSprite('fx_crit', hitMob.sprite.x, hitMob.sprite.y - 10, 0.56, Math.random() * Math.PI, 240);
      }

      const boltChance = stats.activeEffects.has('chain_lightning') ? Math.max(100, stats.treeBoltChance) : stats.treeBoltChance;
      if (isCrit && boltChance > 0 && Math.random() * 100 < boltChance) {
        const boltDmg = Math.max(1, Math.round(stats.atk * 0.5));
        const second = this.monsters.find((m) => m.hp > 0 && m !== hitMob) || hitMob;
        if (second && second.hp > 0) {
          this.spawnLightningSprite(hitMob.sprite.x, hitMob.sprite.y - 12, second.sprite.x, second.sprite.y - 12);
          this.damageMonster(second, boltDmg, false, false, '#60a5fa', '⚡');
        }
      }

      if (stats.lifesteal > 0) {
        this.healHero(Math.max(1, Math.round(dmg * (stats.lifesteal / 100))));
      }
    };

    const ang = Math.atan2(target.sprite.y - this.hero.y, target.sprite.x - this.hero.x);
    if (classId === 'warrior') {
      this.playFxSprite('fx_slash', target.sprite.x, target.sprite.y - 12, isCrit ? 0.72 : 0.56, ang, 220);
      if (isCrit) this.playFxSprite('fx_cross', target.sprite.x, target.sprite.y - 10, 0.52, 0, 240);
      finishHit(target);
    } else if (classId === 'ranger') {
      this.launchFxProjectile('fx_arrow', this.hero.x, this.hero.y - 12, target.sprite.x, target.sprite.y - 12, 0.45, () => finishHit(target));
    } else {
      this.launchFxProjectile('fx_orb', this.hero.x, this.hero.y - 16, target.sprite.x, target.sprite.y - 12, 0.42, () => finishHit(target));
    }
  }

  triggerClassSkill(cls, stats, primaryTarget = null) {
    const alive = this.monsters.filter((m) => m.hp > 0);
    if (alive.length === 0) return;
    const sk = cls.skill;
    const target = primaryTarget || this.findNearestMonster(this.hero.x, this.hero.y) || alive[0];
    this.faceHeroToward(target.sprite.x, target.sprite.y);
    this.heroAttackAnimUntil = this.time.now + 380;

    const dmgMult = stats.skillDmgMult || 1;
    const radMult = stats.skillRadiusMult || 1;

    const banner = this.add.text(this.scale.width / 2, 68, `⚡ 【${sk.name}】`, {
      fontSize: '23px', color: '#fde047', fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(5000);
    this.tweens.add({ targets: banner, y: 42, alpha: 0, duration: 920, onComplete: () => banner.destroy() });

    if (sk.type === 'whirlwind') {
      const radius = 220 * radMult;
      const vortex = this.add.image(this.hero.x, this.hero.y, 'fx_whirlwind')
        .setScale(1.35 * radMult).setBlendMode(Phaser.BlendModes.ADD).setDepth(4502);
      this.tweens.add({
        targets: vortex,
        angle: 360,
        scale: 1.75 * radMult,
        alpha: 0,
        duration: 480,
        onComplete: () => vortex.destroy(),
      });
      this.playFxSprite('fx_crack', this.hero.x, this.hero.y + 18, 1.15 * radMult, 0, 500);
      this.playFxSprite('fx_cross', this.hero.x, this.hero.y - 10, 0.95 * radMult, 0, 360);

      const dmg = Math.round(stats.atk * sk.mult * dmgMult);
      alive.forEach((m) => {
        if (Phaser.Math.Distance.Between(this.hero.x, this.hero.y, m.sprite.x, m.sprite.y) <= radius) {
          this.damageMonster(m, dmg, true, false, '#fb923c', '💥');
        }
      });
      this.healHero(Math.round(this.playerMaxHp * sk.healPct));
      this.cameras.main.shake(180, 0.011);
    } else if (sk.type === 'volley') {
      for (let i = 0; i < sk.hits; i++) {
        this.time.delayedCall(i * 115, () => {
          const curAlive = this.monsters.filter((m) => m.hp > 0);
          if (curAlive.length === 0) return;
          const tMob = curAlive[i % curAlive.length];
          this.launchFxProjectile('fx_beam', this.hero.x, this.hero.y - 14, tMob.sprite.x, tMob.sprite.y - 12, 0.72, () => {
            this.playFxSprite('fx_crit', tMob.sprite.x, tMob.sprite.y - 10, 0.72 * radMult, Math.random() * Math.PI, 280);
            const isCrit = Math.random() * 100 < (stats.critRate + sk.bonusCrit);
            let dmg = stats.atk * sk.mult * dmgMult;
            if (isCrit) dmg *= stats.critDmg / 100;
            this.monsters.filter((m) => m.hp > 0).forEach((m) => {
              if (Phaser.Math.Distance.Between(tMob.sprite.x, tMob.sprite.y, m.sprite.x, m.sprite.y) <= 125 * radMult) {
                this.damageMonster(m, Math.round(dmg), isCrit, false, '#34d399', '🏹');
              }
            });
          }, 120);
        });
      }
    } else if (sk.type === 'meteor') {
      const mx = target.sprite.x;
      const my = target.sprite.y;
      const radius = 230 * radMult;

      const sigil = this.add.image(mx, my + 20, 'fx_sigil')
        .setScale(1.1 * radMult).setAlpha(0.95).setBlendMode(Phaser.BlendModes.ADD).setDepth(4499);
      this.tweens.add({ targets: sigil, angle: 90, duration: 360 });

      const meteor = this.add.image(mx - 140, my - 300, 'fx_meteor')
        .setScale(0.95).setBlendMode(Phaser.BlendModes.ADD).setDepth(4505);

      this.tweens.add({
        targets: meteor,
        x: mx,
        y: my,
        duration: 330,
        ease: 'Quad.easeIn',
        onComplete: () => {
          meteor.destroy();
          sigil.destroy();
          this.playFxSprite('fx_explosion', mx, my - 14, 1.45 * radMult, 0, 460);
          this.playFxSprite('fx_crack', mx, my + 18, 1.1 * radMult, 0, 520);
          const dmg = Math.round(stats.atk * sk.mult * dmgMult);
          this.monsters.filter((m) => m.hp > 0).forEach((m) => {
            if (Phaser.Math.Distance.Between(mx, my, m.sprite.x, m.sprite.y) <= radius) {
              this.damageMonster(m, dmg, true, false, '#e879f9', '☄️');
            }
          });
          this.cameras.main.shake(220, 0.012);
        },
      });
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
    if (this.isTransitioning || m.hp <= 0) return;

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

    const dropResult = this.callbacks.onMonsterKilled(m, this.monsters.every((mob) => mob.hp <= 0));
    if (dropResult && dropResult.item) {
      this.spawnLootBeam(mx, my + 24, dropResult.item);
    }

    if (this.monsters.every((mob) => mob.hp <= 0)) {
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
    if (this.bossTimerText) this.bossTimerText.setPosition(w / 2, 28);
  }
}
