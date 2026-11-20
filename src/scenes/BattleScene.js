import { CLASSES } from '../data/classes.js';
import { RARITIES } from '../data/items.js';
import { createWaveSquad } from '../data/monsters.js';
import { formatNum } from '../logic/statCalc.js';

const MAP_W = 2200;
const MAP_H = 1230;
const ZONE_EMBERS = [0xfbbf24, 0x34d399, 0x38bdf8, 0xf97316, 0xe879f9];

export class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
    this.callbacks = null;
    this.hero = null;
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
    this.heroFacingLeft = false;
  }

  init(data) {
    this.callbacks = data.callbacks;
    this.getState = data.getState;
    this.getStats = data.getStats;
  }

  preload() {
    Object.values(CLASSES).forEach((cls) => {
      this.load.image(cls.spriteKey, cls.spritePath);
    });
    this.load.image('mob_goblin', './assets/monsters/goblin.png');
    this.load.image('mob_skeleton', './assets/monsters/skeleton.png');
    this.load.image('mob_boss_demon', './assets/monsters/boss_demon.png');
    for (let i = 0; i < 5; i++) {
      this.load.image(`map_zone_${i}`, `./assets/bg/map_${i}.jpg`);
    }
  }

  create() {
    this.generateFxTextures();

    this.bgImage = this.add.image(MAP_W / 2, MAP_H / 2, 'map_zone_0')
      .setDisplaySize(MAP_W, MAP_H)
      .setDepth(0);

    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.createHero();

    this.bossTimerText = this.add.text(this.scale.width / 2, 28, '', {
      fontSize: '18px', color: '#fb923c', fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(5000).setVisible(false);

    this.time.addEvent({
      delay: 260,
      loop: true,
      callback: () => {
        if (!this.isPaused) this.spawnAmbientEmber();
      },
    });

    // 點擊地圖任一怪物或地面造成範圍輔助點擊傷害
    this.input.on('pointerdown', (pointer) => {
      if (this.isPaused || this.isTransitioning || this.monsters.length === 0) return;
      const worldPt = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const target = this.findNearestMonster(worldPt.x, worldPt.y, 130);
      if (target) {
        const stats = this.getStats();
        const tapDmg = Math.max(2, Math.round(stats.atk * 0.45));
        this.damageMonster(target, tapDmg, false, true);
        this.spawnArcSlash(target.sprite.x, target.sprite.y - 16, 0xfbbf24, 42);
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
    const cls = CLASSES[this.getState().classId] || CLASSES.warrior;
    const cx = MAP_W / 2;
    const cy = MAP_H / 2;

    this.heroShadow = this.add.ellipse(cx, cy + 44, 86, 24, 0x000000, 0.52).setDepth(2);
    this.hero = this.add.image(cx, cy, cls.spriteKey).setScale(0.54).setDepth(cy);

    this.tweens.add({
      targets: this.hero,
      scaleY: 0.56,
      scaleX: 0.52,
      duration: 680,
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

  refreshHeroClass(classId) {
    const cls = CLASSES[classId] || CLASSES.warrior;
    if (this.hero) this.hero.setTexture(cls.spriteKey);
    const stats = this.getStats();
    this.playerMaxHp = stats.maxHp;
    this.playerHp = stats.maxHp;
    this.skillCooldownTimer = cls.skill.cooldownMs;
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
      m.shadow?.destroy();
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
      const dist = data.isBoss ? 430 : Phaser.Math.Between(360, 560);
      const sx = Phaser.Math.Clamp(this.hero.x + Math.cos(angle) * dist, 180, MAP_W - 180);
      const sy = Phaser.Math.Clamp(this.hero.y + Math.sin(angle) * dist, 180, MAP_H - 180);

      const shadow = this.add.ellipse(sx, sy + 42, data.isBoss ? 116 : 74, 22, 0x000000, 0.48).setDepth(2);
      const sprite = this.add.image(sx, sy, data.spriteKey).setScale(data.scale).setDepth(sy).setAlpha(0);
      this.tweens.add({ targets: sprite, alpha: 1, duration: 280 });

      const barW = data.isBoss ? 136 : 76;
      const hpBg = this.add.rectangle(sx, sy - (data.isBoss ? 98 : 66), barW, 8, 0x0b0e14).setStrokeStyle(1, 0x64748b).setDepth(3500);
      const hpFill = this.add.rectangle(sx - barW / 2, sy - (data.isBoss ? 98 : 66), barW, 6, data.isBoss ? 0xf97316 : 0xef4444).setOrigin(0, 0.5).setDepth(3501);
      const nameText = this.add.text(sx, sy - (data.isBoss ? 114 : 80), data.isBoss ? data.name : '', {
        fontSize: '12px', color: '#fde68a', fontFamily: 'sans-serif', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(3502);

      this.monsters.push({
        ...data,
        sprite,
        shadow,
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

    if (this.isTransitioning) return;

    const stats = this.getStats();
    const dt = delta / 1000;

    // 1. 英雄自動移動 AI（近戰追擊 / 遠程走位拉打 / 無怪時巡邏）
    this.updateHeroMovement(dt, stats, cls.id);

    // 2. 怪物四面八方包圍追蹤與攻擊
    this.updateMonstersAI(delta, dt, stats);

    // 3. 英雄自動攻擊與技能
    const nearest = this.findNearestMonster(this.hero.x, this.hero.y);
    if (nearest) {
      const atkRange = cls.id === 'warrior' ? 115 : 330;
      const dist = Phaser.Math.Distance.Between(this.hero.x, this.hero.y, nearest.sprite.x, nearest.sprite.y);

      if (this.skillCooldownTimer >= cls.skill.cooldownMs && dist <= Math.max(220, atkRange)) {
        this.skillCooldownTimer = 0;
        this.triggerClassSkill(cls, stats, nearest);
      }

      this.heroAttackTimer += delta;
      if (this.heroAttackTimer >= stats.atkIntervalMs && dist <= atkRange) {
        this.heroAttackTimer = 0;
        this.performHeroAttack(stats, cls.id, nearest);
      }
    }

    // 4. BOSS 倒數
    if (this.isBossWave) {
      this.bossTimeLeft -= dt;
      this.bossTimerText.setText(`🔥 首領狂暴倒數: ${Math.max(0, this.bossTimeLeft).toFixed(1)}s`);
      if (this.bossTimeLeft <= 0) {
        this.handleHeroDefeat('首領戰超時，退回第 1 波重整旗鼓！');
      }
    }
  }

  updateHeroMovement(dt, stats, classId) {
    const nearest = this.findNearestMonster(this.hero.x, this.hero.y);
    let vx = 0;
    let vy = 0;

    if (nearest) {
      const dx = nearest.sprite.x - this.hero.x;
      const dy = nearest.sprite.y - this.hero.y;
      const dist = Math.hypot(dx, dy) || 1;
      const isRanged = classId !== 'warrior';

      if (isRanged && dist < 135) {
        // 遠程風箏走位：往反方向拉開距離
        vx = -(dx / dist) * stats.moveSpeed;
        vy = -(dy / dist) * stats.moveSpeed;
      } else if (dist > (isRanged ? 250 : 88)) {
        vx = (dx / dist) * stats.moveSpeed;
        vy = (dy / dist) * stats.moveSpeed;
      } else {
        // 小幅繞圈走位，呈現活生生的戰鬥感
        const perpX = -dy / dist;
        const perpY = dx / dist;
        vx = perpX * stats.moveSpeed * 0.45;
        vy = perpY * stats.moveSpeed * 0.45;
      }
      this.heroFacingLeft = dx < 0;
    } else {
      const dx = this.patrolTarget.x - this.hero.x;
      const dy = this.patrolTarget.y - this.hero.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 24) {
        this.patrolTarget = {
          x: Phaser.Math.Between(360, MAP_W - 360),
          y: Phaser.Math.Between(260, MAP_H - 260),
        };
      } else {
        vx = (dx / dist) * stats.moveSpeed * 0.7;
        vy = (dy / dist) * stats.moveSpeed * 0.7;
        this.heroFacingLeft = dx < 0;
      }
    }

    this.hero.x = Phaser.Math.Clamp(this.hero.x + vx * dt, 220, MAP_W - 220);
    this.hero.y = Phaser.Math.Clamp(this.hero.y + vy * dt, 200, MAP_H - 200);
    this.hero.setFlipX(this.heroFacingLeft);
    this.hero.setDepth(this.hero.y);

    this.heroShadow.setPosition(this.hero.x, this.hero.y + 44);
    this.heroHpBg.setPosition(this.hero.x, this.hero.y - 84);
    this.heroHpFill.setPosition(this.hero.x - 54, this.hero.y - 84);
    this.heroHpText.setPosition(this.hero.x, this.hero.y - 99);
  }

  updateMonstersAI(delta, dt, stats) {
    for (const m of this.monsters) {
      if (m.hp <= 0) continue;
      const dx = this.hero.x - m.sprite.x;
      const dy = this.hero.y - m.sprite.y;
      const dist = Math.hypot(dx, dy) || 1;
      const stopRange = m.isBoss ? 92 : 70;

      if (dist > stopRange) {
        const mx = (dx / dist + Math.cos(m.jitterAngle) * 0.15) * m.speed * dt;
        const my = (dy / dist + Math.sin(m.jitterAngle) * 0.15) * m.speed * dt;
        m.sprite.x = Phaser.Math.Clamp(m.sprite.x + mx, 120, MAP_W - 120);
        m.sprite.y = Phaser.Math.Clamp(m.sprite.y + my, 120, MAP_H - 120);
      }

      // 怪物原始面向左邊，若英雄在右邊就翻轉朝右
      m.sprite.setFlipX(dx > 0);
      m.sprite.setDepth(m.sprite.y);
      m.shadow.setPosition(m.sprite.x, m.sprite.y + 42);

      const barY = m.sprite.y - (m.isBoss ? 98 : 66);
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

  performHeroAttack(stats, classId, target) {
    const isCrit = Math.random() * 100 < stats.critRate;
    let dmg = stats.atk * (0.92 + Math.random() * 0.16);
    if (stats.activeEffects.has('execute') && target.hp / target.maxHp < 0.35) {
      dmg *= 1.35;
    }
    if (isCrit) dmg *= stats.critDmg / 100;
    dmg = Math.max(1, Math.round(dmg));

    const finishHit = (hitMob) => {
      if (!hitMob || hitMob.hp <= 0) return;
      this.damageMonster(hitMob, dmg, isCrit, false);

      const boltChance = stats.activeEffects.has('chain_lightning') ? Math.max(100, stats.treeBoltChance) : stats.treeBoltChance;
      if (isCrit && boltChance > 0 && Math.random() * 100 < boltChance) {
        const boltDmg = Math.max(1, Math.round(stats.atk * 0.5));
        const second = this.monsters.find((m) => m.hp > 0 && m !== hitMob) || hitMob;
        if (second && second.hp > 0) {
          this.spawnLightningChain(hitMob.sprite.x, hitMob.sprite.y - 12, second.sprite.x, second.sprite.y - 12);
          this.damageMonster(second, boltDmg, false, false, '#60a5fa', '⚡');
        }
      }

      if (stats.lifesteal > 0) {
        this.healHero(Math.max(1, Math.round(dmg * (stats.lifesteal / 100))));
      }
    };

    if (classId === 'warrior') {
      this.spawnArcSlash(target.sprite.x, target.sprite.y - 12, isCrit ? 0xfacc15 : 0xf97316, isCrit ? 68 : 52);
      this.spawnSparkBurst(target.sprite.x, target.sprite.y - 10, 0xfb923c, 6);
      finishHit(target);
    } else if (classId === 'ranger') {
      this.spawnProjectile(this.hero.x, this.hero.y - 12, target.sprite.x, target.sprite.y - 12, 0x34d399, 'arrow', () => finishHit(target));
    } else {
      this.spawnProjectile(this.hero.x, this.hero.y - 18, target.sprite.x, target.sprite.y - 12, 0xc084fc, 'orb', () => finishHit(target));
    }
  }

  triggerClassSkill(cls, stats, primaryTarget = null) {
    const alive = this.monsters.filter((m) => m.hp > 0);
    if (alive.length === 0) return;
    const sk = cls.skill;
    const target = primaryTarget || this.findNearestMonster(this.hero.x, this.hero.y) || alive[0];
    const dmgMult = stats.skillDmgMult || 1;
    const radMult = stats.skillRadiusMult || 1;

    const banner = this.add.text(this.scale.width / 2, 68, `⚡ 【${sk.name}】`, {
      fontSize: '22px', color: '#fde047', fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(5000);
    this.tweens.add({ targets: banner, y: 42, alpha: 0, duration: 900, onComplete: () => banner.destroy() });

    const heroAura = this.add.image(this.hero.x, this.hero.y, 'fx_glow')
      .setTint(sk.fxColor).setScale(3.6).setAlpha(0.8).setBlendMode(Phaser.BlendModes.ADD).setDepth(4500);
    this.tweens.add({ targets: heroAura, scale: 5.0, alpha: 0, duration: 400, onComplete: () => heroAura.destroy() });

    if (sk.type === 'whirlwind') {
      // 以英雄為中心的 360° 旋風大範圍群傷
      const radius = 210 * radMult;
      this.tweens.add({ targets: this.hero, angle: 360, duration: 400, ease: 'Cubic.easeOut' });
      const glow = this.add.image(this.hero.x, this.hero.y, 'fx_glow')
        .setTint(0xff6b35).setScale(4.5 * radMult).setAlpha(0.95).setBlendMode(Phaser.BlendModes.ADD).setDepth(4501);
      const shock = this.add.circle(this.hero.x, this.hero.y, 26, 0xff6b35, 0)
        .setStrokeStyle(6, 0xfde047, 1).setBlendMode(Phaser.BlendModes.ADD).setDepth(4502);
      this.tweens.add({ targets: glow, scale: 6.5 * radMult, alpha: 0, duration: 450, onComplete: () => glow.destroy() });
      this.tweens.add({ targets: shock, scale: 6.2 * radMult, alpha: 0, duration: 430, onComplete: () => shock.destroy() });
      this.spawnSparkBurst(this.hero.x, this.hero.y, 0xfde047, 20);

      const dmg = Math.round(stats.atk * sk.mult * dmgMult);
      alive.forEach((m) => {
        if (Phaser.Math.Distance.Between(this.hero.x, this.hero.y, m.sprite.x, m.sprite.y) <= radius) {
          this.damageMonster(m, dmg, true, false, '#fb923c', '💥');
        }
      });
      this.healHero(Math.round(this.playerMaxHp * sk.healPct));
      this.cameras.main.shake(170, 0.01);
    } else if (sk.type === 'volley') {
      // 追蹤最近最多 3 隻怪物連射 + 小範圍濺射
      for (let i = 0; i < sk.hits; i++) {
        this.time.delayedCall(i * 110, () => {
          const curAlive = this.monsters.filter((m) => m.hp > 0);
          if (curAlive.length === 0) return;
          const tMob = curAlive[i % curAlive.length];
          this.spawnProjectile(this.hero.x, this.hero.y - 16, tMob.sprite.x, tMob.sprite.y - 12, 0x34d399, 'beam', () => {
            const burst = this.add.image(tMob.sprite.x, tMob.sprite.y, 'fx_glow')
              .setTint(0x34d399).setScale(2.8 * radMult).setAlpha(0.95).setBlendMode(Phaser.BlendModes.ADD).setDepth(4502);
            this.tweens.add({ targets: burst, scale: 4.2 * radMult, alpha: 0, duration: 260, onComplete: () => burst.destroy() });
            const isCrit = Math.random() * 100 < (stats.critRate + sk.bonusCrit);
            let dmg = stats.atk * sk.mult * dmgMult;
            if (isCrit) dmg *= stats.critDmg / 100;
            this.monsters.filter((m) => m.hp > 0).forEach((m) => {
              if (Phaser.Math.Distance.Between(tMob.sprite.x, tMob.sprite.y, m.sprite.x, m.sprite.y) <= 115 * radMult) {
                this.damageMonster(m, Math.round(dmg), isCrit, false, '#34d399', '🏹');
              }
            });
          });
        });
      }
    } else if (sk.type === 'meteor') {
      const mx = target.sprite.x;
      const my = target.sprite.y;
      const radius = 220 * radMult;
      const sigil = this.add.ellipse(mx, my + 24, 175 * radMult, 72 * radMult, 0xa855f7, 0.35)
        .setStrokeStyle(3, 0xe879f9, 1).setBlendMode(Phaser.BlendModes.ADD).setDepth(4499);
      const meteorCore = this.add.circle(mx - 100, my - 260, 28, 0xf97316, 1)
        .setStrokeStyle(5, 0xfde047, 1).setDepth(4502);
      const meteorHalo = this.add.image(mx - 100, my - 260, 'fx_glow')
        .setTint(0xe879f9).setScale(3.4).setBlendMode(Phaser.BlendModes.ADD).setDepth(4501);

      this.tweens.add({
        targets: [meteorCore, meteorHalo],
        x: mx,
        y: my,
        duration: 330,
        ease: 'Quad.easeIn',
        onUpdate: () => {
          const trail = this.add.image(meteorCore.x, meteorCore.y, 'fx_glow')
            .setTint(0xc084fc).setScale(1.5).setAlpha(0.75).setBlendMode(Phaser.BlendModes.ADD).setDepth(4500);
          this.tweens.add({ targets: trail, scale: 0.2, alpha: 0, duration: 200, onComplete: () => trail.destroy() });
        },
        onComplete: () => {
          meteorCore.destroy();
          meteorHalo.destroy();
          sigil.destroy();
          const blast = this.add.image(mx, my, 'fx_glow')
            .setTint(0xf97316).setScale(5.5 * radMult).setAlpha(1).setBlendMode(Phaser.BlendModes.ADD).setDepth(4503);
          const ring = this.add.circle(mx, my, 28, 0xe879f9, 0.35)
            .setStrokeStyle(5, 0xfde047).setBlendMode(Phaser.BlendModes.ADD).setDepth(4504);
          this.tweens.add({ targets: [blast, ring], scale: 6.2 * radMult, alpha: 0, duration: 400, onComplete: () => { blast.destroy(); ring.destroy(); } });
          this.spawnSparkBurst(mx, my, 0xe879f9, 22);
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
    if (stats.killHealPct > 0) {
      this.healHero(Math.round(this.playerMaxHp * (stats.killHealPct / 100)));
    }
    if (stats.activeEffects.has('vampiric_aura')) {
      this.healHero(Math.round(this.playerMaxHp * 0.08));
    }

    this.spawnSparkBurst(m.sprite.x, m.sprite.y, m.isBoss ? 0xfb923c : 0x94a3b8, 12);
    const mx = m.sprite.x;
    const my = m.sprite.y;

    m.sprite.destroy();
    m.shadow.destroy();
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

  spawnArcSlash(x, y, color, radius = 56) {
    const g = this.add.graphics().setDepth(4500).setBlendMode(Phaser.BlendModes.ADD);
    g.lineStyle(6, color, 1);
    g.beginPath();
    g.arc(x, y, radius, Phaser.Math.DegToRad(-60), Phaser.Math.DegToRad(60), false);
    g.strokePath();
    this.tweens.add({ targets: g, alpha: 0, scaleX: 1.2, duration: 190, onComplete: () => g.destroy() });
  }

  spawnProjectile(sx, sy, tx, ty, color, style, onHit) {
    let proj;
    if (style === 'arrow') {
      proj = this.add.rectangle(sx, sy, 32, 4, color, 1).setBlendMode(Phaser.BlendModes.ADD).setDepth(4500);
      proj.setRotation(Math.atan2(ty - sy, tx - sx));
    } else if (style === 'beam') {
      proj = this.add.rectangle(sx, sy, 68, 8, color, 1).setBlendMode(Phaser.BlendModes.ADD).setDepth(4501);
      proj.setRotation(Math.atan2(ty - sy, tx - sx));
    } else {
      proj = this.add.image(sx, sy, 'fx_glow').setTint(color).setScale(0.95).setBlendMode(Phaser.BlendModes.ADD).setDepth(4500);
    }
    this.tweens.add({
      targets: proj,
      x: tx,
      y: ty,
      duration: style === 'beam' ? 115 : 160,
      ease: 'Quad.easeOut',
      onComplete: () => {
        proj.destroy();
        if (onHit) onHit();
      },
    });
  }

  spawnLightningChain(x1, y1, x2, y2) {
    const g = this.add.graphics().setDepth(4504).setBlendMode(Phaser.BlendModes.ADD);
    g.lineStyle(4, 0x60a5fa, 1);
    g.beginPath();
    g.moveTo(x1, y1);
    const steps = 6;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      g.lineTo(Phaser.Math.Linear(x1, x2, t) + Phaser.Math.Between(-16, 16), Phaser.Math.Linear(y1, y2, t) + Phaser.Math.Between(-20, 20));
    }
    g.lineTo(x2, y2);
    g.strokePath();
    this.tweens.add({ targets: g, alpha: 0, duration: 240, onComplete: () => g.destroy() });
  }

  spawnSparkBurst(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const dist = Phaser.Math.Between(28, 78);
      const p = this.add.image(x, y, 'fx_glow').setTint(color).setScale(0.32).setBlendMode(Phaser.BlendModes.ADD).setDepth(4502);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(ang) * dist,
        y: y + Math.sin(ang) * dist,
        alpha: 0,
        scale: 0.05,
        duration: Phaser.Math.Between(220, 390),
        onComplete: () => p.destroy(),
      });
    }
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
