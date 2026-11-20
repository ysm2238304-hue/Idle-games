import { CLASSES } from '../data/classes.js';
import { RARITIES } from '../data/items.js';
import { createWaveMonster } from '../data/monsters.js';
import { formatNum } from '../logic/statCalc.js';

const ZONE_EMBERS = [0xfbbf24, 0x34d399, 0x38bdf8, 0xf97316, 0xe879f9];

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
    this.isPaused = true;
    this.lastZoneIdx = -1;
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
      this.load.image(`bg_zone_${i}`, `./assets/bg/zone_${i}.jpg`);
    }
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.generateFxTextures();
    this.floorY = Math.round(h * 0.78);

    this.bgImage = this.add.image(w / 2, h / 2, 'bg_zone_0').setDepth(0);
    this.bgShade = this.add.rectangle(w / 2, h / 2, w, h, 0x05060a, 0.22).setDepth(1);
    this.fitBackground(w, h);

    this.createCharacters(w);
    this.createHudBars(w);

    this.time.addEvent({
      delay: 280,
      loop: true,
      callback: () => {
        if (!this.isPaused) this.spawnAmbientEmber();
      },
    });

    this.input.on('pointerdown', (pointer) => {
      if (this.isPaused || this.isTransitioning || !this.currentMonster || this.currentMonster.hp <= 0) return;
      if (pointer.x > w * 0.42) {
        const stats = this.getStats();
        const tapDmg = Math.max(2, Math.round(stats.atk * 0.45));
        this.applyDamageToMonster(tapDmg, false, true);
        this.spawnArcSlash(this.monsterSprite.x, this.monsterSprite.y - 16, 0xfbbf24, 42);
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
    this.spawnWaveMonster();
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

  fitBackground(w, h) {
    if (!this.bgImage) return;
    const scale = Math.max(w / 1280, h / 720) * 1.06;
    this.bgImage.setPosition(w / 2, h / 2).setScale(scale);
    this.bgShade.setPosition(w / 2, h / 2).setSize(w, h);
  }

  getZoneIdx() {
    const stage = this.getState()?.stage || 1;
    return Math.floor((stage - 1) / 3) % 5;
  }

  updateZoneBackground() {
    const idx = this.getZoneIdx();
    if (idx !== this.lastZoneIdx && this.bgImage) {
      this.lastZoneIdx = idx;
      this.bgImage.setTexture(`bg_zone_${idx}`);
      this.fitBackground(this.scale.width, this.scale.height);
    }
  }

  setPaused(paused) {
    this.isPaused = paused;
  }

  castSkillManual() {
    if (this.isPaused || this.isTransitioning || !this.currentMonster || this.currentMonster.hp <= 0) return false;
    const cls = CLASSES[this.getState().classId] || CLASSES.warrior;
    if (this.skillCooldownTimer < cls.skill.cooldownMs) return false;
    this.skillCooldownTimer = 0;
    this.triggerClassSkill(cls, this.getStats());
    return true;
  }

  spawnAmbientEmber() {
    if (!this.scale) return;
    const w = this.scale.width;
    const color = ZONE_EMBERS[this.getZoneIdx()];
    const px = Phaser.Math.Between(30, Math.max(60, w - 30));
    const py = Phaser.Math.Between(this.floorY - 60, this.floorY + 30);
    const dot = this.add.image(px, py, 'fx_glow').setTint(color).setScale(0.22).setAlpha(0.75).setBlendMode(Phaser.BlendModes.ADD).setDepth(4);
    this.tweens.add({
      targets: dot,
      y: py - Phaser.Math.Between(60, 130),
      x: px + Phaser.Math.Between(-28, 28),
      alpha: 0,
      duration: Phaser.Math.Between(1400, 2200),
      onComplete: () => dot.destroy(),
    });
  }

  createCharacters(w) {
    const cls = CLASSES[this.getState().classId] || CLASSES.warrior;
    this.heroShadow = this.add.ellipse(w * 0.30, this.floorY + 14, 118, 26, 0x000000, 0.55).setDepth(4);
    this.mobShadow = this.add.ellipse(w * 0.70, this.floorY + 14, 128, 28, 0x000000, 0.55).setDepth(4);

    this.hero = this.add.image(w * 0.30, this.floorY - 80, cls.spriteKey).setScale(0.72).setDepth(6);
    this.tweens.add({
      targets: this.hero,
      scaleY: 0.74,
      scaleX: 0.70,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.monsterSprite = this.add.image(w * 0.70, this.floorY - 82, 'mob_goblin')
      .setScale(0.70).setDepth(6).setVisible(false);
    this.tweens.add({
      targets: this.monsterSprite,
      y: '+=6',
      duration: 820,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  createHudBars(w) {
    this.heroHpBg = this.add.rectangle(w * 0.30, this.floorY - 190, 136, 12, 0x0b0e14).setStrokeStyle(1.5, 0xc89b3c).setDepth(10);
    this.heroHpFill = this.add.rectangle(w * 0.30 - 68, this.floorY - 190, 136, 10, 0x22c55e).setOrigin(0, 0.5).setDepth(11);
    this.heroHpText = this.add.text(w * 0.30, this.floorY - 208, '', {
      fontSize: '13px', color: '#f8fafc', fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(12);

    this.mobHpBg = this.add.rectangle(w * 0.70, this.floorY - 202, 168, 14, 0x0b0e14).setStrokeStyle(1.5, 0xc89b3c).setDepth(10);
    this.mobHpFill = this.add.rectangle(w * 0.70 - 84, this.floorY - 202, 168, 12, 0xef4444).setOrigin(0, 0.5).setDepth(11);
    this.mobNameText = this.add.text(w * 0.70, this.floorY - 224, '', {
      fontSize: '14px', color: '#fde68a', fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(12);
    this.mobHpText = this.add.text(w * 0.70, this.floorY - 202, '', {
      fontSize: '11px', color: '#ffffff', fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(13);

    this.bossTimerText = this.add.text(w * 0.5, 34, '', {
      fontSize: '17px', color: '#fb923c', fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(15).setVisible(false);
  }

  refreshHeroClass(classId) {
    const cls = CLASSES[classId] || CLASSES.warrior;
    if (this.hero) this.hero.setTexture(cls.spriteKey);
    const stats = this.getStats();
    this.playerMaxHp = stats.maxHp;
    this.playerHp = stats.maxHp;
    this.skillCooldownTimer = cls.skill.cooldownMs;
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
    this.updateZoneBackground();
    const state = this.getState();
    this.currentMonster = createWaveMonster(state.stage, state.wave);
    this.isTransitioning = false;
    this.mobAttackTimer = 0;
    this.bossTimeLeft = this.currentMonster.isBoss ? this.currentMonster.timeLimitSec : 0;

    const w = this.scale.width;
    const baseScale = this.currentMonster.scale * 1.25;
    this.monsterSprite
      .setTexture(this.currentMonster.spriteKey)
      .setScale(baseScale)
      .setPosition(w + 90, this.floorY - (this.currentMonster.isBoss ? 110 : 82))
      .setAlpha(1)
      .clearTint()
      .setVisible(true);

    this.tweens.add({
      targets: this.monsterSprite,
      x: w * 0.70,
      duration: 380,
      ease: 'Cubic.easeOut',
    });

    this.bossTimerText.setVisible(this.currentMonster.isBoss);
    this.updateHpBars();
  }

  update(time, delta) {
    if (this.isPaused) return;

    const cls = CLASSES[this.getState().classId] || CLASSES.warrior;
    this.skillCooldownTimer = Math.min(cls.skill.cooldownMs, this.skillCooldownTimer + delta);
    if (this.callbacks?.onSkillTick) {
      this.callbacks.onSkillTick(this.skillCooldownTimer / cls.skill.cooldownMs);
    }

    if (this.isTransitioning || !this.currentMonster || this.currentMonster.hp <= 0) return;

    const stats = this.getStats();
    if (this.skillCooldownTimer >= cls.skill.cooldownMs) {
      this.skillCooldownTimer = 0;
      this.triggerClassSkill(cls, stats);
    }

    this.heroAttackTimer += delta;
    if (this.heroAttackTimer >= stats.atkIntervalMs) {
      this.heroAttackTimer = 0;
      this.performHeroAttack(stats, cls.id);
    }

    this.mobAttackTimer += delta;
    if (this.mobAttackTimer >= this.currentMonster.atkIntervalMs) {
      this.mobAttackTimer = 0;
      this.performMonsterAttack(stats);
    }

    if (this.currentMonster.isBoss) {
      this.bossTimeLeft -= delta / 1000;
      this.bossTimerText.setText(`🔥 首領狂暴倒數: ${Math.max(0, this.bossTimeLeft).toFixed(1)}s`);
      if (this.bossTimeLeft <= 0) {
        this.handleHeroDefeat('首領戰超時，退回第 1 波重整旗鼓！');
      }
    }
  }

  performHeroAttack(stats, classId) {
    const w = this.scale.width;
    const isCrit = Math.random() * 100 < stats.critRate;
    let dmg = stats.atk * (0.92 + Math.random() * 0.16);
    if (stats.activeEffects.has('execute') && this.currentMonster.hp / this.currentMonster.maxHp < 0.35) {
      dmg *= 1.35;
    }
    if (isCrit) dmg *= stats.critDmg / 100;
    dmg = Math.max(1, Math.round(dmg));

    const finishHit = () => {
      if (!this.currentMonster || this.currentMonster.hp <= 0) return;
      this.applyDamageToMonster(dmg, isCrit, false);

      if (isCrit && stats.activeEffects.has('chain_lightning') && this.currentMonster.hp > 0) {
        const boltDmg = Math.max(1, Math.round(stats.atk * 0.45));
        this.time.delayedCall(110, () => {
          if (this.currentMonster && this.currentMonster.hp > 0) {
            this.spawnLightningChain(this.hero.x + 25, this.hero.y - 36, this.monsterSprite.x, this.monsterSprite.y - 12);
            this.applyDamageToMonster(boltDmg, false, false, '#60a5fa', '⚡');
          }
        });
      }

      if (stats.lifesteal > 0) {
        this.healHero(Math.max(1, Math.round(dmg * (stats.lifesteal / 100))));
      }
    };

    if (classId === 'warrior') {
      this.tweens.add({ targets: this.hero, x: w * 0.44, duration: 95, yoyo: true, ease: 'Power2' });
      this.spawnArcSlash(this.monsterSprite.x - 18, this.monsterSprite.y - 14, isCrit ? 0xfacc15 : 0xf97316, isCrit ? 74 : 56);
      this.spawnSparkBurst(this.monsterSprite.x, this.monsterSprite.y - 12, 0xfb923c, 7);
      finishHit();
    } else if (classId === 'ranger') {
      this.tweens.add({ targets: this.hero, x: w * 0.28, duration: 70, yoyo: true });
      this.spawnProjectile(this.hero.x + 36, this.hero.y - 20, this.monsterSprite.x, this.monsterSprite.y - 18, 0x34d399, 'arrow', finishHit);
    } else {
      this.tweens.add({ targets: this.hero, y: '-=10', duration: 90, yoyo: true });
      this.spawnProjectile(this.hero.x + 38, this.hero.y - 28, this.monsterSprite.x, this.monsterSprite.y - 18, 0xc084fc, 'orb', finishHit);
    }
  }

  triggerClassSkill(cls, stats) {
    if (!this.currentMonster || this.currentMonster.hp <= 0) return;
    const sk = cls.skill;
    const w = this.scale.width;

    const banner = this.add.text(w * 0.5, 76, `⚡ 【${sk.name}】`, {
      fontSize: '24px', color: '#fde047', fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(35);
    this.tweens.add({ targets: banner, y: 48, alpha: 0, duration: 950, onComplete: () => banner.destroy() });

    const heroAura = this.add.image(this.hero.x, this.hero.y, 'fx_glow')
      .setTint(sk.fxColor).setScale(4.0).setAlpha(0.8).setBlendMode(Phaser.BlendModes.ADD).setDepth(5);
    this.tweens.add({ targets: heroAura, scale: 5.5, alpha: 0, duration: 420, onComplete: () => heroAura.destroy() });

    if (sk.type === 'whirlwind') {
      this.tweens.add({ targets: this.hero, angle: 360, duration: 400, ease: 'Cubic.easeOut' });
      const mx = this.monsterSprite.x;
      const my = this.monsterSprite.y;
      const glowRing = this.add.image(mx, my, 'fx_glow')
        .setTint(0xff6b35).setScale(3.6).setAlpha(1).setBlendMode(Phaser.BlendModes.ADD).setDepth(21);
      const shock = this.add.circle(mx, my, 28, 0xff6b35, 0)
        .setStrokeStyle(7, 0xfde047, 1).setBlendMode(Phaser.BlendModes.ADD).setDepth(22);
      this.tweens.add({ targets: glowRing, scale: 6.5, alpha: 0, duration: 460, onComplete: () => glowRing.destroy() });
      this.tweens.add({ targets: shock, scale: 4.8, alpha: 0, duration: 440, onComplete: () => shock.destroy() });
      this.spawnArcSlash(mx, my, 0xfacc15, 98);
      this.spawnSparkBurst(mx, my, 0xfde047, 20);

      const dmg = Math.round(stats.atk * sk.mult);
      this.applyDamageToMonster(dmg, true, false, '#fb923c', '💥');
      this.healHero(Math.round(this.playerMaxHp * sk.healPct));
      this.cameras.main.shake(170, 0.01);
    } else if (sk.type === 'volley') {
      for (let i = 0; i < sk.hits; i++) {
        this.time.delayedCall(i * 110, () => {
          if (!this.currentMonster || this.currentMonster.hp <= 0) return;
          this.spawnProjectile(
            this.hero.x + 36,
            this.hero.y - 32 + i * 16,
            this.monsterSprite.x,
            this.monsterSprite.y - 26 + i * 16,
            0x34d399,
            'beam',
            () => {
              if (!this.currentMonster || this.currentMonster.hp <= 0) return;
              const burst = this.add.image(this.monsterSprite.x, this.monsterSprite.y - 12, 'fx_glow')
                .setTint(0x34d399).setScale(3.0).setAlpha(0.95).setBlendMode(Phaser.BlendModes.ADD).setDepth(22);
              this.tweens.add({ targets: burst, scale: 4.5, alpha: 0, duration: 280, onComplete: () => burst.destroy() });
              const isCrit = Math.random() * 100 < (stats.critRate + sk.bonusCrit);
              let dmg = stats.atk * sk.mult;
              if (isCrit) dmg *= stats.critDmg / 100;
              this.applyDamageToMonster(Math.round(dmg), isCrit, false, '#34d399', '🏹');
              this.spawnSparkBurst(this.monsterSprite.x, this.monsterSprite.y - 12, 0x34d399, 9);
            }
          );
        });
      }
    } else if (sk.type === 'meteor') {
      const mx = this.monsterSprite.x;
      const my = this.monsterSprite.y;
      const sigil = this.add.ellipse(mx, this.floorY + 12, 175, 48, 0xa855f7, 0.35)
        .setStrokeStyle(3, 0xe879f9, 1).setBlendMode(Phaser.BlendModes.ADD).setDepth(17);
      const meteorCore = this.add.circle(mx - 110, -45, 30, 0xf97316, 1)
        .setStrokeStyle(5, 0xfde047, 1).setDepth(22);
      const meteorHalo = this.add.image(mx - 110, -45, 'fx_glow')
        .setTint(0xe879f9).setScale(3.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(21);

      this.tweens.add({
        targets: [meteorCore, meteorHalo],
        x: mx,
        y: my,
        duration: 330,
        ease: 'Quad.easeIn',
        onUpdate: () => {
          const trail = this.add.image(meteorCore.x, meteorCore.y, 'fx_glow')
            .setTint(0xc084fc).setScale(1.6).setAlpha(0.75).setBlendMode(Phaser.BlendModes.ADD).setDepth(20);
          this.tweens.add({ targets: trail, scale: 0.2, alpha: 0, duration: 220, onComplete: () => trail.destroy() });
        },
        onComplete: () => {
          meteorCore.destroy();
          meteorHalo.destroy();
          sigil.destroy();
          const blast = this.add.image(mx, my, 'fx_glow')
            .setTint(0xf97316).setScale(5.5).setAlpha(1).setBlendMode(Phaser.BlendModes.ADD).setDepth(23);
          const ring = this.add.circle(mx, my, 28, 0xe879f9, 0.35)
            .setStrokeStyle(5, 0xfde047).setBlendMode(Phaser.BlendModes.ADD).setDepth(24);
          this.tweens.add({ targets: [blast, ring], scale: 6.2, alpha: 0, duration: 400, onComplete: () => { blast.destroy(); ring.destroy(); } });
          this.spawnSparkBurst(mx, my, 0xe879f9, 22);
          if (!this.currentMonster || this.currentMonster.hp <= 0) return;
          const dmg = Math.round(stats.atk * sk.mult);
          this.applyDamageToMonster(dmg, true, false, '#e879f9', '☄️');
          this.cameras.main.shake(220, 0.012);
        },
      });
    }
  }

  spawnArcSlash(x, y, color, radius = 56) {
    const g = this.add.graphics().setDepth(18).setBlendMode(Phaser.BlendModes.ADD);
    g.lineStyle(6, color, 1);
    g.beginPath();
    g.arc(x, y, radius, Phaser.Math.DegToRad(-60), Phaser.Math.DegToRad(60), false);
    g.strokePath();
    this.tweens.add({ targets: g, alpha: 0, scaleX: 1.2, duration: 190, onComplete: () => g.destroy() });
  }

  spawnProjectile(sx, sy, tx, ty, color, style, onHit) {
    let proj;
    if (style === 'arrow') {
      proj = this.add.rectangle(sx, sy, 36, 4, color, 1).setBlendMode(Phaser.BlendModes.ADD).setDepth(18);
    } else if (style === 'beam') {
      proj = this.add.rectangle(sx, sy, 74, 9, color, 1).setBlendMode(Phaser.BlendModes.ADD).setDepth(19);
    } else {
      proj = this.add.image(sx, sy, 'fx_glow').setTint(color).setScale(1.0).setBlendMode(Phaser.BlendModes.ADD).setDepth(18);
    }
    this.tweens.add({
      targets: proj,
      x: tx,
      y: ty,
      duration: style === 'beam' ? 110 : 150,
      ease: 'Quad.easeOut',
      onComplete: () => {
        proj.destroy();
        if (onHit) onHit();
      },
    });
  }

  spawnLightningChain(x1, y1, x2, y2) {
    const g = this.add.graphics().setDepth(24).setBlendMode(Phaser.BlendModes.ADD);
    g.lineStyle(4, 0x60a5fa, 1);
    g.beginPath();
    g.moveTo(x1, y1);
    const steps = 6;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const px = Phaser.Math.Linear(x1, x2, t) + Phaser.Math.Between(-16, 16);
      const py = Phaser.Math.Linear(y1, y2, t) + Phaser.Math.Between(-24, 20);
      g.lineTo(px, py);
    }
    g.lineTo(x2, y2);
    g.strokePath();
    this.tweens.add({ targets: g, alpha: 0, duration: 240, onComplete: () => g.destroy() });
  }

  spawnSparkBurst(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const dist = Phaser.Math.Between(30, 86);
      const p = this.add.image(x, y, 'fx_glow').setTint(color).setScale(0.36).setBlendMode(Phaser.BlendModes.ADD).setDepth(20);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(ang) * dist,
        y: y + Math.sin(ang) * dist,
        alpha: 0,
        scale: 0.05,
        duration: Phaser.Math.Between(240, 420),
        onComplete: () => p.destroy(),
      });
    }
  }

  performMonsterAttack(stats) {
    if (!this.currentMonster || this.currentMonster.hp <= 0) return;
    const w = this.scale.width;

    this.tweens.add({ targets: this.monsterSprite, x: w * 0.56, duration: 100, yoyo: true });

    if (Math.random() * 100 < stats.dodge) {
      this.spawnFloatingText(this.hero.x, this.hero.y - 90, 'MISS', '#94a3b8', 16);
      return;
    }

    const mitigation = stats.armor / (stats.armor + 40 + this.currentMonster.stage * 12);
    const dmg = Math.max(1, Math.round(this.currentMonster.atk * (1 - mitigation)));
    this.playerHp = Math.max(0, this.playerHp - dmg);

    this.hero.setTintFill(0xff4444);
    this.time.delayedCall(90, () => this.hero && this.hero.clearTint());
    this.spawnFloatingText(this.hero.x, this.hero.y - 90, `-${formatNum(dmg)}`, '#f87171', 16);
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
      x: this.scale.width * 0.70 + (isCrit ? 14 : 7),
      duration: 55,
      yoyo: true,
    });

    const color = customColor || (isTap ? '#fde047' : (isCrit ? '#facc15' : '#ffffff'));
    const size = isCrit ? 24 : (isTap ? 15 : 18);
    const label = `${prefix}${isCrit ? '💥' : ''}-${formatNum(dmg)}${isCrit ? '!' : ''}`;
    this.spawnFloatingText(
      this.monsterSprite.x + Phaser.Math.Between(-28, 28),
      this.monsterSprite.y - 80,
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

    this.spawnSparkBurst(this.monsterSprite.x, this.monsterSprite.y, defeated.isBoss ? 0xfb923c : 0x94a3b8, 14);

    this.tweens.add({
      targets: this.monsterSprite,
      alpha: 0,
      y: this.monsterSprite.y + 20,
      duration: 280,
      onComplete: () => this.monsterSprite.setVisible(false),
    });

    const dropResult = this.callbacks.onMonsterKilled(defeated);
    if (dropResult && dropResult.item) {
      this.spawnLootBeam(this.monsterSprite.x, this.floorY + 8, dropResult.item);
    }

    // 背景微微視差滑動模擬前進感
    if (this.bgImage) {
      this.tweens.add({
        targets: this.bgImage,
        x: '-=18',
        duration: 500,
        yoyo: true,
        ease: 'Sine.easeInOut',
      });
    }

    this.time.delayedCall(650, () => {
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
    const beam = this.add.rectangle(x, y - 105, 20, 210, r.beam, 0.65).setBlendMode(Phaser.BlendModes.ADD).setDepth(18);
    const orb = this.add.circle(x, y - 8, 10, r.beam, 1).setStrokeStyle(2, 0xffffff).setDepth(19);
    const tag = this.add.text(x, y - 40, `[${r.label}] ${item.name}`, {
      fontSize: '13px', color: r.color, fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
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
      y: y - 85,
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
    }).setOrigin(0.5).setDepth(30);

    this.tweens.add({
      targets: txt,
      y: y - 46,
      alpha: 0,
      duration: 720,
      ease: 'Cubic.easeOut',
      onComplete: () => txt.destroy(),
    });
  }

  updateHpBars() {
    if (!this.heroHpFill) return;
    const hRatio = Math.max(0, Math.min(1, this.playerHp / Math.max(1, this.playerMaxHp)));
    this.heroHpFill.width = 136 * hRatio;
    this.heroHpText.setText(`${formatNum(this.playerHp)} / ${formatNum(this.playerMaxHp)}`);

    if (this.currentMonster) {
      const mRatio = Math.max(0, Math.min(1, this.currentMonster.hp / Math.max(1, this.currentMonster.maxHp)));
      this.mobHpFill.width = 168 * mRatio;
      this.mobNameText.setText(this.currentMonster.name);
      this.mobHpText.setText(`${formatNum(this.currentMonster.hp)} / ${formatNum(this.currentMonster.maxHp)}`);
    }
  }

  handleResize(w, h) {
    this.floorY = Math.round(h * 0.78);
    this.fitBackground(w, h);
    if (this.hero) {
      this.hero.setPosition(w * 0.30, this.floorY - 80);
      this.heroShadow.setPosition(w * 0.30, this.floorY + 14);
      this.heroHpBg.setPosition(w * 0.30, this.floorY - 190);
      this.heroHpFill.setPosition(w * 0.30 - 68, this.floorY - 190);
      this.heroHpText.setPosition(w * 0.30, this.floorY - 208);
    }
    if (this.monsterSprite) {
      const my = this.floorY - (this.currentMonster?.isBoss ? 110 : 82);
      this.monsterSprite.setPosition(w * 0.70, my);
      this.mobShadow.setPosition(w * 0.70, this.floorY + 14);
      this.mobHpBg.setPosition(w * 0.70, this.floorY - 202);
      this.mobHpFill.setPosition(w * 0.70 - 84, this.floorY - 202);
      this.mobNameText.setPosition(w * 0.70, this.floorY - 224);
      this.mobHpText.setPosition(w * 0.70, this.floorY - 202);
    }
    if (this.bossTimerText) this.bossTimerText.setPosition(w * 0.5, 34);
  }
}
