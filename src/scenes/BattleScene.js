import { CLASSES } from '../data/classes.js';
import { RARITIES } from '../data/items.js';
import { createWaveMonster } from '../data/monsters.js';
import { formatNum } from '../logic/statCalc.js';

const ZONE_THEMES = [
  { wall: 0x0b0e14, pillar: 0x141a26, floor: 0x161a24, line: 0x2d3548, torch: 0xf59e0b, ember: 0xfbbf24 },
  { wall: 0x09110d, pillar: 0x111f18, floor: 0x121d18, line: 0x243b2f, torch: 0x10b981, ember: 0x34d399 },
  { wall: 0x0b0e17, pillar: 0x14192b, floor: 0x151926, line: 0x2f3854, torch: 0x38bdf8, ember: 0x7dd3fc },
  { wall: 0x140a09, pillar: 0x241210, floor: 0x1f1210, line: 0x4a251d, torch: 0xf97316, ember: 0xfb923c },
  { wall: 0x120916, pillar: 0x211129, floor: 0x1b1021, line: 0x452354, torch: 0xc084fc, ember: 0xe879f9 },
];

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
    this.floorScrollOffset = 0;
    this.isScrollingFloor = false;
    this.torchLights = [];
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
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.generateFxTextures();
    this.bgGraphics = this.add.graphics().setDepth(0);
    this.floorGraphics = this.add.graphics().setDepth(1);
    this.torchGroup = this.add.group();
    this.redrawBackdrop(w, h);

    this.createCharacters(w);
    this.createHudBars(w);

    this.time.addEvent({
      delay: 320,
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
        this.spawnArcSlash(this.monsterSprite.x, this.monsterSprite.y - 12, 0xfbbf24, 38);
      }
    });

    this.scale.on('resize', (gameSize) => {
      this.handleResize(gameSize.width, gameSize.height);
    });

    const stats = this.getStats();
    const cls = CLASSES[this.getState().classId] || CLASSES.warrior;
    this.playerMaxHp = stats.maxHp;
    this.playerHp = stats.maxHp;
    // 開局滿能量，進場就能馬上施放第一次大招
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

  getTheme() {
    const stage = this.getState()?.stage || 1;
    const idx = Math.floor((stage - 1) / 3) % ZONE_THEMES.length;
    return { idx, theme: ZONE_THEMES[idx] };
  }

  redrawBackdrop(w, h) {
    this.floorY = Math.round(h * 0.72);
    const { idx, theme } = this.getTheme();
    this.lastZoneIdx = idx;

    const g = this.bgGraphics;
    g.clear();
    g.fillStyle(theme.wall, 1);
    g.fillRect(0, 0, w, this.floorY);

    this.torchGroup.clear(true, true);
    this.torchLights = [];

    for (let x = 56; x < w; x += 155) {
      g.fillStyle(theme.pillar, 1);
      g.fillRect(x, 34, 30, this.floorY - 34);
      g.fillStyle(theme.line, 0.8);
      g.fillRect(x - 5, 34, 40, 12);

      const ty = Math.round(this.floorY * 0.45);
      const glow = this.add.image(x + 15, ty, 'fx_glow').setTint(theme.torch).setScale(1.6).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD).setDepth(2);
      const flame = this.add.circle(x + 15, ty, 6, theme.ember, 0.9).setDepth(3);
      this.torchGroup.add(glow);
      this.torchGroup.add(flame);
      this.torchLights.push(glow, flame);
      this.tweens.add({
        targets: glow,
        scale: 1.95,
        alpha: 0.55,
        duration: Phaser.Math.Between(500, 820),
        yoyo: true,
        repeat: -1,
      });
    }

    this.drawFloor(w, h, theme);
  }

  drawFloor(w, h, theme) {
    const fg = this.floorGraphics;
    fg.clear();
    fg.fillStyle(theme.floor, 1);
    fg.fillRect(0, this.floorY, w, h - this.floorY);
    fg.lineStyle(2, theme.line, 0.95);
    fg.lineBetween(0, this.floorY, w, this.floorY);

    fg.lineStyle(1, theme.line, 0.55);
    const step = 64;
    const off = ((this.floorScrollOffset % step) + step) % step;
    for (let x = -step; x < w + step; x += step) {
      const drawX = x - off;
      fg.lineBetween(drawX, this.floorY, drawX - 36, h);
    }
  }

  spawnAmbientEmber() {
    if (!this.scale) return;
    const w = this.scale.width;
    const { theme } = this.getTheme();
    const px = Phaser.Math.Between(20, Math.max(40, w - 20));
    const py = Phaser.Math.Between(this.floorY - 40, this.floorY + 25);
    const dot = this.add.image(px, py, 'fx_glow').setTint(theme.ember).setScale(0.18).setAlpha(0.7).setBlendMode(Phaser.BlendModes.ADD).setDepth(4);
    this.tweens.add({
      targets: dot,
      y: py - Phaser.Math.Between(45, 95),
      x: px + Phaser.Math.Between(-20, 20),
      alpha: 0,
      duration: Phaser.Math.Between(1200, 2000),
      onComplete: () => dot.destroy(),
    });
  }

  createCharacters(w) {
    const cls = CLASSES[this.getState().classId] || CLASSES.warrior;
    this.heroShadow = this.add.ellipse(w * 0.24, this.floorY + 12, 92, 22, 0x000000, 0.5).setDepth(4);
    this.mobShadow = this.add.ellipse(w * 0.74, this.floorY + 12, 100, 24, 0x000000, 0.5).setDepth(4);

    this.hero = this.add.image(w * 0.24, this.floorY - 68, cls.spriteKey).setScale(0.58).setDepth(6);
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
      .setScale(0.56).setDepth(6).setVisible(false);
    this.tweens.add({
      targets: this.monsterSprite,
      y: '+=5',
      duration: 820,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  createHudBars(w) {
    this.heroHpBg = this.add.rectangle(w * 0.24, this.floorY - 155, 110, 10, 0x0f172a).setStrokeStyle(1, 0x475569).setDepth(10);
    this.heroHpFill = this.add.rectangle(w * 0.24 - 55, this.floorY - 155, 110, 8, 0x22c55e).setOrigin(0, 0.5).setDepth(11);
    this.heroHpText = this.add.text(w * 0.24, this.floorY - 170, '', {
      fontSize: '12px', color: '#e2e8f0', fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(12);

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
    const state = this.getState();
    const { idx } = this.getTheme();
    if (idx !== this.lastZoneIdx) {
      this.redrawBackdrop(this.scale.width, this.scale.height);
    }

    this.currentMonster = createWaveMonster(state.stage, state.wave);
    this.isTransitioning = false;
    this.isScrollingFloor = false;
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

    this.tweens.add({
      targets: this.monsterSprite,
      x: w * 0.74,
      duration: 360,
      ease: 'Cubic.easeOut',
    });

    this.bossTimerText.setVisible(this.currentMonster.isBoss);
    this.updateHpBars();
  }

  update(time, delta) {
    if (this.isPaused) return;

    if (this.isScrollingFloor) {
      this.floorScrollOffset += delta * 0.24;
      this.drawFloor(this.scale.width, this.scale.height, this.getTheme().theme);
    }

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
            this.spawnLightningChain(this.hero.x + 20, this.hero.y - 30, this.monsterSprite.x, this.monsterSprite.y - 10);
            this.applyDamageToMonster(boltDmg, false, false, '#60a5fa', '⚡');
          }
        });
      }

      if (stats.lifesteal > 0) {
        this.healHero(Math.max(1, Math.round(dmg * (stats.lifesteal / 100))));
      }
    };

    if (classId === 'warrior') {
      this.tweens.add({ targets: this.hero, x: w * 0.36, duration: 95, yoyo: true, ease: 'Power2' });
      this.spawnArcSlash(this.monsterSprite.x - 16, this.monsterSprite.y - 12, isCrit ? 0xfacc15 : 0xf97316, isCrit ? 64 : 48);
      this.spawnSparkBurst(this.monsterSprite.x, this.monsterSprite.y - 10, 0xfb923c, 6);
      finishHit();
    } else if (classId === 'ranger') {
      this.tweens.add({ targets: this.hero, x: w * 0.22, duration: 70, yoyo: true });
      this.spawnProjectile(this.hero.x + 30, this.hero.y - 16, this.monsterSprite.x, this.monsterSprite.y - 14, 0x34d399, 'arrow', finishHit);
    } else {
      this.tweens.add({ targets: this.hero, y: '-=8', duration: 90, yoyo: true });
      this.spawnProjectile(this.hero.x + 32, this.hero.y - 24, this.monsterSprite.x, this.monsterSprite.y - 14, 0xc084fc, 'orb', finishHit);
    }
  }

  triggerClassSkill(cls, stats) {
    if (!this.currentMonster || this.currentMonster.hp <= 0) return;
    const sk = cls.skill;
    const w = this.scale.width;

    // 顯眼技能宣言橫幅與英雄高光蓄力
    const banner = this.add.text(w * 0.5, 62, `⚡ 【${sk.name}】`, {
      fontSize: '20px', color: '#fde047', fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(35);
    this.tweens.add({ targets: banner, y: 40, alpha: 0, duration: 950, onComplete: () => banner.destroy() });

    const heroAura = this.add.image(this.hero.x, this.hero.y, 'fx_glow')
      .setTint(sk.fxColor).setScale(3.2).setAlpha(0.75).setBlendMode(Phaser.BlendModes.ADD).setDepth(5);
    this.tweens.add({ targets: heroAura, scale: 4.5, alpha: 0, duration: 420, onComplete: () => heroAura.destroy() });

    if (sk.type === 'whirlwind') {
      this.tweens.add({ targets: this.hero, angle: 360, duration: 400, ease: 'Cubic.easeOut' });
      const mx = this.monsterSprite.x;
      const my = this.monsterSprite.y;
      const glowRing = this.add.image(mx, my, 'fx_glow')
        .setTint(0xff6b35).setScale(2.8).setAlpha(0.95).setBlendMode(Phaser.BlendModes.ADD).setDepth(21);
      const shock = this.add.circle(mx, my, 24, 0xff6b35, 0)
        .setStrokeStyle(6, 0xfde047, 1).setBlendMode(Phaser.BlendModes.ADD).setDepth(22);
      this.tweens.add({ targets: glowRing, scale: 5.5, alpha: 0, duration: 450, onComplete: () => glowRing.destroy() });
      this.tweens.add({ targets: shock, scale: 4.2, alpha: 0, duration: 420, onComplete: () => shock.destroy() });
      this.spawnArcSlash(mx, my, 0xfacc15, 86);
      this.spawnSparkBurst(mx, my, 0xfde047, 18);

      const dmg = Math.round(stats.atk * sk.mult);
      this.applyDamageToMonster(dmg, true, false, '#fb923c', '💥');
      this.healHero(Math.round(this.playerMaxHp * sk.healPct));
      this.cameras.main.shake(170, 0.01);
    } else if (sk.type === 'volley') {
      for (let i = 0; i < sk.hits; i++) {
        this.time.delayedCall(i * 110, () => {
          if (!this.currentMonster || this.currentMonster.hp <= 0) return;
          this.spawnProjectile(
            this.hero.x + 30,
            this.hero.y - 28 + i * 14,
            this.monsterSprite.x,
            this.monsterSprite.y - 24 + i * 14,
            0x34d399,
            'beam',
            () => {
              if (!this.currentMonster || this.currentMonster.hp <= 0) return;
              const burst = this.add.image(this.monsterSprite.x, this.monsterSprite.y - 10, 'fx_glow')
                .setTint(0x34d399).setScale(2.6).setAlpha(0.9).setBlendMode(Phaser.BlendModes.ADD).setDepth(22);
              this.tweens.add({ targets: burst, scale: 4.0, alpha: 0, duration: 260, onComplete: () => burst.destroy() });
              const isCrit = Math.random() * 100 < (stats.critRate + sk.bonusCrit);
              let dmg = stats.atk * sk.mult;
              if (isCrit) dmg *= stats.critDmg / 100;
              this.applyDamageToMonster(Math.round(dmg), isCrit, false, '#34d399', '🏹');
              this.spawnSparkBurst(this.monsterSprite.x, this.monsterSprite.y - 10, 0x34d399, 8);
            }
          );
        });
      }
    } else if (sk.type === 'meteor') {
      const mx = this.monsterSprite.x;
      const my = this.monsterSprite.y;
      const sigil = this.add.ellipse(mx, this.floorY + 10, 150, 42, 0xa855f7, 0.35)
        .setStrokeStyle(3, 0xe879f9, 1).setBlendMode(Phaser.BlendModes.ADD).setDepth(17);
      const meteorCore = this.add.circle(mx - 95, -40, 26, 0xf97316, 1)
        .setStrokeStyle(5, 0xfde047, 1).setDepth(22);
      const meteorHalo = this.add.image(mx - 95, -40, 'fx_glow')
        .setTint(0xe879f9).setScale(3.0).setBlendMode(Phaser.BlendModes.ADD).setDepth(21);

      this.tweens.add({
        targets: [meteorCore, meteorHalo],
        x: mx,
        y: my,
        duration: 330,
        ease: 'Quad.easeIn',
        onUpdate: () => {
          const trail = this.add.image(meteorCore.x, meteorCore.y, 'fx_glow')
            .setTint(0xc084fc).setScale(1.4).setAlpha(0.75).setBlendMode(Phaser.BlendModes.ADD).setDepth(20);
          this.tweens.add({ targets: trail, scale: 0.2, alpha: 0, duration: 220, onComplete: () => trail.destroy() });
        },
        onComplete: () => {
          meteorCore.destroy();
          meteorHalo.destroy();
          sigil.destroy();
          const blast = this.add.image(mx, my, 'fx_glow')
            .setTint(0xf97316).setScale(4.8).setAlpha(1).setBlendMode(Phaser.BlendModes.ADD).setDepth(23);
          const ring = this.add.circle(mx, my, 24, 0xe879f9, 0.35)
            .setStrokeStyle(5, 0xfde047).setBlendMode(Phaser.BlendModes.ADD).setDepth(24);
          this.tweens.add({ targets: [blast, ring], scale: 5.5, alpha: 0, duration: 380, onComplete: () => { blast.destroy(); ring.destroy(); } });
          this.spawnSparkBurst(mx, my, 0xe879f9, 20);
          if (!this.currentMonster || this.currentMonster.hp <= 0) return;
          const dmg = Math.round(stats.atk * sk.mult);
          this.applyDamageToMonster(dmg, true, false, '#e879f9', '☄️');
          this.cameras.main.shake(220, 0.012);
        },
      });
    }
  }

  spawnArcSlash(x, y, color, radius = 48) {
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
      proj = this.add.rectangle(sx, sy, 32, 4, color, 1).setBlendMode(Phaser.BlendModes.ADD).setDepth(18);
    } else if (style === 'beam') {
      proj = this.add.rectangle(sx, sy, 62, 8, color, 1).setBlendMode(Phaser.BlendModes.ADD).setDepth(19);
    } else {
      proj = this.add.image(sx, sy, 'fx_glow').setTint(color).setScale(0.9).setBlendMode(Phaser.BlendModes.ADD).setDepth(18);
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
      const dist = Phaser.Math.Between(28, 76);
      const p = this.add.image(x, y, 'fx_glow').setTint(color).setScale(0.32).setBlendMode(Phaser.BlendModes.ADD).setDepth(20);
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

    this.tweens.add({ targets: this.monsterSprite, x: w * 0.62, duration: 100, yoyo: true });

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

    this.spawnSparkBurst(this.monsterSprite.x, this.monsterSprite.y, defeated.isBoss ? 0xfb923c : 0x94a3b8, 12);

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

    this.isScrollingFloor = true;
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
    const beam = this.add.rectangle(x, y - 95, 18, 190, r.beam, 0.65).setBlendMode(Phaser.BlendModes.ADD).setDepth(18);
    const orb = this.add.circle(x, y - 6, 9, r.beam, 1).setStrokeStyle(2, 0xffffff).setDepth(19);
    const tag = this.add.text(x, y - 36, `[${r.label}] ${item.name}`, {
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
      y: y - 76,
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
      this.hero.setPosition(w * 0.24, this.floorY - 68);
      this.heroShadow.setPosition(w * 0.24, this.floorY + 12);
      this.heroHpBg.setPosition(w * 0.24, this.floorY - 155);
      this.heroHpFill.setPosition(w * 0.24 - 55, this.floorY - 155);
      this.heroHpText.setPosition(w * 0.24, this.floorY - 170);
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
