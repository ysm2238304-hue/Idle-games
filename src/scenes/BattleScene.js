import { CLASSES } from '../data/classes.js';
import { RARITIES } from '../data/items.js';
import { createWaveMonster } from '../data/monsters.js';
import { formatNum } from '../logic/statCalc.js';

export class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
    this.callbacks = null;
    this.hero = null;
    this.monsterSprite = null;
    this.currentMonster = null;
    this.playerHp = 240;
    this.playerMaxHp = 240;
    this.heroAttackTimer = 0;
    this.mobAttackTimer = 0;
    this.skillCooldownTimer = 0;
    this.bossTimeLeft = 0;
    this.isTransitioning = false;
    this.bgTiles = [];
    this.torches = [];
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
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.drawDungeonBackground(w, h);
    this.createCharacters(w, h);
    this.createHudBars(w, h);

    // 點擊怪物造成輔助點擊傷害
    this.input.on('pointerdown', (pointer) => {
      if (this.isTransitioning || !this.currentMonster || this.currentMonster.hp <= 0) return;
      if (pointer.x > w * 0.45) {
        const stats = this.getStats();
        const tapDmg = Math.max(2, Math.round(stats.atk * 0.45));
        this.applyDamageToMonster(tapDmg, false, true);
        this.spawnSlashEffect(this.monsterSprite.x, this.monsterSprite.y - 20, 0xfbbf24);
      }
    });

    this.scale.on('resize', (gameSize) => {
      this.handleResize(gameSize.width, gameSize.height);
    });

    const stats = this.getStats();
    this.playerMaxHp = stats.maxHp;
    this.playerHp = stats.maxHp;
    this.spawnWaveMonster();
  }

  drawDungeonBackground(w, h) {
    this.bgGraphics = this.add.graphics();
    this.floorY = Math.round(h * 0.72);
    this.redrawBackdrop(w, h);
  }

  redrawBackdrop(w, h) {
    this.floorY = Math.round(h * 0.72);
    const g = this.bgGraphics;
    g.clear();

    // 暗黑地下城牆壁漸層感
    g.fillStyle(0x0b0d13, 1);
    g.fillRect(0, 0, w, this.floorY);

    // 遠景石柱
    g.fillStyle(0x141824, 1);
    for (let x = 40; x < w; x += 150) {
      g.fillRect(x, 40, 28, this.floorY - 40);
      g.fillStyle(0x1f2537, 1);
      g.fillRect(x - 4, 40, 36, 14);
      g.fillStyle(0x141824, 1);
    }

    // 地面石板
    g.fillStyle(0x161922, 1);
    g.fillRect(0, this.floorY, w, h - this.floorY);
    g.lineStyle(2, 0x2d3348, 0.9);
    g.lineBetween(0, this.floorY, w, this.floorY);

    g.lineStyle(1, 0x232838, 0.6);
    for (let x = 0; x < w; x += 64) {
      g.lineBetween(x, this.floorY, x - 35, h);
    }
  }

  createCharacters(w, h) {
    const cls = CLASSES[this.getState().classId] || CLASSES.warrior;

    // 地面陰影
    this.heroShadow = this.add.ellipse(w * 0.25, this.floorY + 12, 92, 22, 0x000000, 0.45);
    this.mobShadow = this.add.ellipse(w * 0.74, this.floorY + 12, 100, 24, 0x000000, 0.45);

    this.hero = this.add.image(w * 0.25, this.floorY - 68, cls.spriteKey)
      .setScale(0.58)
      .setDepth(5);

    // 待機呼吸動畫
    this.tweens.add({
      targets: this.hero,
      scaleY: 0.60,
      scaleX: 0.56,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.monsterSprite = this.add.image(w * 0.74, this.floorY - 72, 'mob_goblin')
      .setScale(0.56)
      .setDepth(5)
      .setVisible(false);

    this.tweens.add({
      targets: this.monsterSprite,
      y: '+=5',
      duration: 820,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  createHudBars(w, h) {
    // 玩家血條 (畫布內角色頭上)
    this.heroHpBg = this.add.rectangle(w * 0.25, this.floorY - 155, 110, 10, 0x0f172a).setStrokeStyle(1, 0x475569).setDepth(10);
    this.heroHpFill = this.add.rectangle(w * 0.25 - 55, this.floorY - 155, 110, 8, 0x22c55e).setOrigin(0, 0.5).setDepth(11);
    this.heroHpText = this.add.text(w * 0.25, this.floorY - 170, '', {
      fontSize: '12px', color: '#e2e8f0', fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(12);

    // 怪物血條
    this.mobHpBg = this.add.rectangle(w * 0.74, this.floorY - 165, 140, 12, 0x0f172a).setStrokeStyle(1, 0x64748b).setDepth(10);
    this.mobHpFill = this.add.rectangle(w * 0.74 - 70, this.floorY - 165, 140, 10, 0xef4444).setOrigin(0, 0.5).setDepth(11);
    this.mobNameText = this.add.text(w * 0.74, this.floorY - 186, '', {
      fontSize: '13px', color: '#f8fafc', fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(12);
    this.mobHpText = this.add.text(w * 0.74, this.floorY - 165, '', {
      fontSize: '10px', color: '#ffffff', fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(13);

    this.bossTimerText = this.add.text(w * 0.5, 26, '', {
      fontSize: '15px', color: '#fb923c', fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(15).setVisible(false);
  }

  refreshHeroClass(classId) {
    const cls = CLASSES[classId] || CLASSES.warrior;
    if (this.hero) {
      this.hero.setTexture(cls.spriteKey);
    }
    const stats = this.getStats();
    this.playerMaxHp = stats.maxHp;
    this.playerHp = stats.maxHp;
    this.skillCooldownTimer = 0;
    this.updateHpBars();
  }

  syncMaxHp() {
    const stats = this.getStats();
    const diff = stats.maxHp - this.playerMaxHp;
    this.playerMaxHp = stats.maxHp;
    if (diff > 0) this.playerHp = Math.min(this.playerMaxHp, this.playerHp + diff);
    else this.playerHp = Math.min(this.playerMaxHp, this.playerHp);
    this.updateHpBars();
  }

  spawnWaveMonster() {
    const state = this.getState();
    this.currentMonster = createWaveMonster(state.stage, state.wave);
    this.isTransitioning = false;
    this.mobAttackTimer = 0;
    this.bossTimeLeft = this.currentMonster.isBoss ? this.currentMonster.timeLimitSec : 0;

    const w = this.scale.width;
    this.monsterSprite
      .setTexture(this.currentMonster.spriteKey)
      .setScale(this.currentMonster.scale)
      .setPosition(w + 80, this.floorY - (this.currentMonster.isBoss ? 92 : 68))
      .setAlpha(1)
      .clearTint()
      .setVisible(true);

    // 怪物進場滑動
    this.tweens.add({
      targets: this.monsterSprite,
      x: w * 0.74,
      duration: 380,
      ease: 'Cubic.easeOut',
    });

    this.bossTimerText.setVisible(this.currentMonster.isBoss);
    this.updateHpBars();
  }

  update(time, delta) {
    if (this.isTransitioning || !this.currentMonster || this.currentMonster.hp <= 0) return;

    const stats = this.getStats();
    const cls = CLASSES[this.getState().classId] || CLASSES.warrior;

    // 技能冷卻
    this.skillCooldownTimer += delta;
    if (this.skillCooldownTimer >= cls.skill.cooldownMs) {
      this.skillCooldownTimer = 0;
      this.triggerClassSkill(cls, stats);
    }
    if (this.callbacks?.onSkillTick) {
      this.callbacks.onSkillTick(Math.min(1, this.skillCooldownTimer / cls.skill.cooldownMs));
    }

    // 英雄普攻
    this.heroAttackTimer += delta;
    if (this.heroAttackTimer >= stats.atkIntervalMs) {
      this.heroAttackTimer = 0;
      this.performHeroAttack(stats);
    }

    // 怪物反擊
    this.mobAttackTimer += delta;
    if (this.mobAttackTimer >= this.currentMonster.atkIntervalMs) {
      this.mobAttackTimer = 0;
      this.performMonsterAttack(stats);
    }

    // BOSS 倒數
    if (this.currentMonster.isBoss) {
      this.bossTimeLeft -= delta / 1000;
      this.bossTimerText.setText(`🔥 首領狂暴倒數: ${Math.max(0, this.bossTimeLeft).toFixed(1)}s`);
      if (this.bossTimeLeft <= 0) {
        this.handleHeroDefeat('首領戰超時，退回第 1 波重整旗鼓！');
      }
    }
  }

  performHeroAttack(stats) {
    const w = this.scale.width;
    this.tweens.add({
      targets: this.hero,
      x: w * 0.34,
      duration: 95,
      yoyo: true,
      ease: 'Power2',
    });

    const isCrit = Math.random() * 100 < stats.critRate;
    let dmg = stats.atk * (0.92 + Math.random() * 0.16);
    if (stats.activeEffects.has('execute') && this.currentMonster.hp / this.currentMonster.maxHp < 0.35) {
      dmg *= 1.35;
    }
    if (isCrit) dmg *= stats.critDmg / 100;
    dmg = Math.max(1, Math.round(dmg));

    this.applyDamageToMonster(dmg, isCrit, false);
    this.spawnSlashEffect(this.monsterSprite.x, this.monsterSprite.y - 10, isCrit ? 0xfacc15 : 0x38bdf8);

    // 傳奇特效：暴擊閃電鏈
    if (isCrit && stats.activeEffects.has('chain_lightning') && this.currentMonster.hp > 0) {
      const boltDmg = Math.max(1, Math.round(stats.atk * 0.45));
      this.time.delayedCall(120, () => {
        if (this.currentMonster && this.currentMonster.hp > 0) {
          this.applyDamageToMonster(boltDmg, false, false, '#60a5fa', '⚡');
        }
      });
    }

    // 吸血
    if (stats.lifesteal > 0) {
      const heal = Math.max(1, Math.round(dmg * (stats.lifesteal / 100)));
      this.healHero(heal);
    }
  }

  triggerClassSkill(cls, stats) {
    if (!this.currentMonster || this.currentMonster.hp <= 0) return;
    const sk = cls.skill;

    this.spawnFloatingText(this.hero.x, this.hero.y - 95, `✨ ${sk.name}!`, '#fde047', 16);

    if (sk.type === 'whirlwind') {
      this.tweens.add({ targets: this.hero, angle: 360, duration: 360, ease: 'Cubic.easeOut' });
      const dmg = Math.round(stats.atk * sk.mult);
      this.applyDamageToMonster(dmg, true, false, '#fb923c', '💥');
      this.healHero(Math.round(this.playerMaxHp * sk.healPct));
      this.cameras.main.shake(140, 0.008);
    } else if (sk.type === 'volley') {
      for (let i = 0; i < sk.hits; i++) {
        this.time.delayedCall(i * 110, () => {
          if (!this.currentMonster || this.currentMonster.hp <= 0) return;
          const isCrit = Math.random() * 100 < (stats.critRate + sk.bonusCrit);
          let dmg = stats.atk * sk.mult;
          if (isCrit) dmg *= stats.critDmg / 100;
          this.applyDamageToMonster(Math.round(dmg), isCrit, false, '#34d399', '🏹');
          this.spawnSlashEffect(this.monsterSprite.x, this.monsterSprite.y - 20 + i * 14, 0x34d399);
        });
      }
    } else if (sk.type === 'meteor') {
      const mx = this.monsterSprite.x;
      const my = this.monsterSprite.y;
      const meteor = this.add.circle(mx - 60, 20, 22, 0xc084fc, 0.9).setDepth(20);
      this.tweens.add({
        targets: meteor,
        x: mx,
        y: my,
        duration: 280,
        ease: 'Quad.easeIn',
        onComplete: () => {
          meteor.destroy();
          if (!this.currentMonster || this.currentMonster.hp <= 0) return;
          const dmg = Math.round(stats.atk * sk.mult);
          this.applyDamageToMonster(dmg, true, false, '#e879f9', '☄️');
          this.cameras.main.shake(180, 0.01);
        },
      });
    }
  }

  performMonsterAttack(stats) {
    if (!this.currentMonster || this.currentMonster.hp <= 0) return;
    const w = this.scale.width;

    this.tweens.add({
      targets: this.monsterSprite,
      x: w * 0.62,
      duration: 100,
      yoyo: true,
    });

    // 閃避判定
    if (Math.random() * 100 < stats.dodge) {
      this.spawnFloatingText(this.hero.x, this.hero.y - 75, 'MISS', '#94a3b8', 15);
      return;
    }

    const mitigation = stats.armor / (stats.armor + 40 + this.currentMonster.stage * 12);
    const dmg = Math.max(1, Math.round(this.currentMonster.atk * (1 - mitigation)));
    this.playerHp = Math.max(0, this.playerHp - dmg);

    this.hero.setTintFill(0xff4444);
    this.time.delayedCall(90, () => this.hero && this.hero.clearTint());
    this.spawnFloatingText(this.hero.x, this.hero.y - 75, `-${formatNum(dmg)}`, '#f87171', 15);
    this.updateHpBars();

    if (this.playerHp <= 0) {
      this.handleHeroDefeat('生命歸零，返回第 1 波休整！');
    }
  }

  applyDamageToMonster(dmg, isCrit, isTap, customColor = null, prefix = '') {
    if (!this.currentMonster || this.currentMonster.hp <= 0) return;
    this.currentMonster.hp = Math.max(0, this.currentMonster.hp - dmg);

    this.monsterSprite.setTintFill(0xffffff);
    this.time.delayedCall(75, () => this.monsterSprite && this.monsterSprite.clearTint());

    this.tweens.add({
      targets: this.monsterSprite,
      x: this.scale.width * 0.74 + (isCrit ? 12 : 6),
      duration: 55,
      yoyo: true,
    });

    const color = customColor || (isTap ? '#fde047' : (isCrit ? '#facc15' : '#ffffff'));
    const size = isCrit ? 22 : (isTap ? 14 : 16);
    const label = `${prefix}${isCrit ? '💥' : ''}-${formatNum(dmg)}${isCrit ? '!' : ''}`;
    this.spawnFloatingText(
      this.monsterSprite.x + Phaser.Math.Between(-24, 24),
      this.monsterSprite.y - 65,
      label,
      color,
      size
    );

    if (isCrit) this.cameras.main.shake(80, 0.004);
    this.updateHpBars();

    if (this.currentMonster.hp <= 0) {
      this.handleMonsterKilled();
    }
  }

  healHero(amount) {
    if (amount <= 0) return;
    this.playerHp = Math.min(this.playerMaxHp, this.playerHp + amount);
    this.updateHpBars();
  }

  handleMonsterKilled() {
    this.isTransitioning = true;
    const defeated = this.currentMonster;
    const stats = this.getStats();

    if (stats.activeEffects.has('vampiric_aura')) {
      this.healHero(Math.round(this.playerMaxHp * 0.08));
    }

    // 怪物倒下淡出
    this.tweens.add({
      targets: this.monsterSprite,
      alpha: 0,
      y: this.monsterSprite.y + 18,
      duration: 280,
      onComplete: () => this.monsterSprite.setVisible(false),
    });

    const dropResult = this.callbacks.onMonsterKilled(defeated);
    if (dropResult && dropResult.item) {
      this.spawnLootBeam(this.monsterSprite.x, this.floorY + 6, dropResult.item);
    }

    // 往前推進感
    this.time.delayedCall(680, () => {
      this.spawnWaveMonster();
    });
  }

  handleHeroDefeat(reason) {
    this.isTransitioning = true;
    this.playerHp = this.playerMaxHp;
    this.callbacks.onPlayerDefeated(reason);
    this.time.delayedCall(900, () => {
      this.spawnWaveMonster();
    });
  }

  spawnLootBeam(x, y, item) {
    const r = RARITIES[item.rarity] || RARITIES.common;
    const beam = this.add.rectangle(x, y - 90, 16, 180, r.beam, 0.55).setDepth(18);
    const orb = this.add.circle(x, y - 6, 9, r.beam, 1).setStrokeStyle(2, 0xffffff).setDepth(19);
    const tag = this.add.text(x, y - 34, `[${r.label}] ${item.name}`, {
      fontSize: '12px', color: r.color, fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20);

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
      y: y - 72,
      alpha: 0,
      duration: 1400,
      delay: 300,
      onComplete: () => tag.destroy(),
    });
  }

  spawnSlashEffect(x, y, color) {
    const slash = this.add.rectangle(x, y, 54, 5, color, 0.9)
      .setAngle(Phaser.Math.Between(-35, 35))
      .setDepth(16);
    this.tweens.add({
      targets: slash,
      scaleX: 1.4,
      alpha: 0,
      duration: 160,
      onComplete: () => slash.destroy(),
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
    }).setOrigin(0.5).setDepth(30);

    this.tweens.add({
      targets: txt,
      y: y - 42,
      alpha: 0,
      duration: 720,
      ease: 'Cubic.easeOut',
      onComplete: () => txt.destroy(),
    });
  }

  updateHpBars() {
    if (!this.heroHpFill) return;
    const hRatio = Math.max(0, Math.min(1, this.playerHp / Math.max(1, this.playerMaxHp)));
    this.heroHpFill.width = 110 * hRatio;
    this.heroHpText.setText(`${formatNum(this.playerHp)} / ${formatNum(this.playerMaxHp)}`);

    if (this.currentMonster) {
      const mRatio = Math.max(0, Math.min(1, this.currentMonster.hp / Math.max(1, this.currentMonster.maxHp)));
      this.mobHpFill.width = 140 * mRatio;
      this.mobNameText.setText(this.currentMonster.name);
      this.mobHpText.setText(`${formatNum(this.currentMonster.hp)} / ${formatNum(this.currentMonster.maxHp)}`);
    }
  }

  handleResize(w, h) {
    this.redrawBackdrop(w, h);
    if (this.hero) {
      this.hero.setPosition(w * 0.25, this.floorY - 68);
      this.heroShadow.setPosition(w * 0.25, this.floorY + 12);
      this.heroHpBg.setPosition(w * 0.25, this.floorY - 155);
      this.heroHpFill.setPosition(w * 0.25 - 55, this.floorY - 155);
      this.heroHpText.setPosition(w * 0.25, this.floorY - 170);
    }
    if (this.monsterSprite) {
      const my = this.floorY - (this.currentMonster?.isBoss ? 92 : 68);
      this.monsterSprite.setPosition(w * 0.74, my);
      this.mobShadow.setPosition(w * 0.74, this.floorY + 12);
      this.mobHpBg.setPosition(w * 0.74, this.floorY - 165);
      this.mobHpFill.setPosition(w * 0.74 - 70, this.floorY - 165);
      this.mobNameText.setPosition(w * 0.74, this.floorY - 186);
      this.mobHpText.setPosition(w * 0.74, this.floorY - 165);
    }
    if (this.bossTimerText) this.bossTimerText.setPosition(w * 0.5, 26);
  }
}
