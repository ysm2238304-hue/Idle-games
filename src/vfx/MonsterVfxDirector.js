// MonsterVfxDirector.js — v278 暗黑破壞神4 2.5D 怪物序列幀特效與地面預警導演（零震動、零音效）

const V278 = 'v=278';

export const MONSTER_SEQ16_SPECS = [
  { key: 'seq16_e_claw_rend',      fps: 22, frameSize: 256 },
  { key: 'seq16_e_hell_smash',     fps: 20, frameSize: 256 },
  { key: 'seq16_e_venom_pool',     fps: 18, frameSize: 256 },
  { key: 'seq16_e_abyss_fire',     fps: 20, frameSize: 256 },
  { key: 'seq16_e_necro_nova',     fps: 20, frameSize: 256 },
  { key: 'seq16_e_frost_pulse',    fps: 20, frameSize: 256 },
  { key: 'seq16_e_arcane_beam',    fps: 22, frameSize: 256 },
  { key: 'seq16_e_boss_cataclysm', fps: 18, frameSize: 256 },
];

export const MONSTER_ANIM4_SPECS = [
  { key: 'anim_e_arcane_sentry', fps: 8, frameSize: 224 },
  { key: 'anim_e_frost_orb',     fps: 9, frameSize: 224 },
  { key: 'anim_e_abyss_imp',     fps: 9, frameSize: 224 },
  { key: 'anim_e_blood_totem',   fps: 7, frameSize: 224 },
];

export const MONSTER_PROJ_KEYS = [
  'proj_e_fireball',
  'proj_e_venom_spit',
  'proj_e_soul_bolt',
  'proj_e_bone_spear',
];

export const MONSTER_DECAL_KEYS = [
  'decal_e_molten',
  'decal_e_acid',
  'decal_e_telegraph_circle',
  'decal_e_telegraph_line',
];

export class MonsterVfxDirector {
  constructor(scene) {
    this.scene = scene;
  }

  static preload(scene) {
    if (!scene?.load) return;
    for (const s of MONSTER_SEQ16_SPECS) {
      if (!scene.textures.exists(s.key)) {
        scene.load.spritesheet(s.key, `./assets/fx/${s.key}.webp?${V278}`, {
          frameWidth: s.frameSize,
          frameHeight: s.frameSize,
        });
      }
    }
    for (const a of MONSTER_ANIM4_SPECS) {
      if (!scene.textures.exists(a.key)) {
        scene.load.spritesheet(a.key, `./assets/fx/${a.key}.webp?${V278}`, {
          frameWidth: a.frameSize,
          frameHeight: a.frameSize,
        });
      }
    }
    for (const k of MONSTER_PROJ_KEYS) {
      if (!scene.textures.exists(k)) {
        scene.load.image(k, `./assets/fx/${k}.webp?${V278}`);
      }
    }
    for (const k of MONSTER_DECAL_KEYS) {
      if (!scene.textures.exists(k)) {
        scene.load.image(k, `./assets/fx/${k}.webp?${V278}`);
      }
    }
  }

  registerAnims() {
    const anims = this.scene?.anims;
    if (!anims) return;
    for (const s of MONSTER_SEQ16_SPECS) {
      const animKey = `${s.key}_play`;
      if (!anims.exists(animKey) && this.scene.textures.exists(s.key)) {
        anims.create({
          key: animKey,
          frames: anims.generateFrameNumbers(s.key, { start: 0, end: 15 }),
          frameRate: s.fps,
          repeat: 0,
        });
      }
    }
    for (const a of MONSTER_ANIM4_SPECS) {
      const animKey = `${a.key}_loop`;
      if (!anims.exists(animKey) && this.scene.textures.exists(a.key)) {
        anims.create({
          key: animKey,
          frames: anims.generateFrameNumbers(a.key, { start: 0, end: 3 }),
          frameRate: a.fps,
          repeat: -1,
        });
      }
    }
  }

  playSeq16(key, x, y, opts = {}) {
    const s = this.scene;
    if (!s || !s.textures?.exists(key)) return null;
    const animKey = `${key}_play`;
    if (!s.anims?.exists(animKey)) this.registerAnims();
    const spr = s.add.sprite(x, y, key, 0);
    const scaleX = opts.scaleX ?? opts.scale ?? 0.95;
    const scaleY = opts.scaleY ?? (opts.isoFlatten ? scaleX * 0.68 : scaleX);
    spr.setScale(scaleX, scaleY)
      .setRotation(opts.rotation || 0)
      .setAlpha(opts.alpha ?? 0.96)
      .setDepth(opts.depth ?? (y + 38));
    if (opts.tint) spr.setTint(opts.tint);
    if (opts.additive !== false) spr.setBlendMode(Phaser.BlendModes.ADD);
    spr.play(animKey);
    spr.once('animationcomplete', () => {
      if (spr.active) spr.destroy();
    });
    // 安全兜底清理，避免異常殘留
    s.time.delayedCall(1200, () => {
      if (spr && spr.active) spr.destroy();
    });
    return spr;
  }

  spawnTelegraphCircle(x, y, radius, durationMs, color = 0xef4444, onFinish = null) {
    const s = this.scene;
    if (!s) return null;
    const container = s.add.container(x, y).setDepth(6);
    // 2.5D 透視壓扁比例 0.66
    container.setScale(1, 0.66);

    const hasDecal = s.textures?.exists('decal_e_telegraph_circle');
    const decal = hasDecal
      ? s.add.image(0, 0, 'decal_e_telegraph_circle')
          .setDisplaySize(radius * 2.15, radius * 2.15)
          .setAlpha(0.72)
          .setBlendMode(Phaser.BlendModes.ADD)
      : null;
    if (decal && color !== 0xef4444) decal.setTint(color);

    const ring = s.add.circle(0, 0, radius, color, 0.14).setStrokeStyle(3, color, 0.92);
    const fill = s.add.circle(0, 0, Math.max(8, radius * 0.08), color, 0.34);
    container.add(decal ? [decal, ring, fill] : [ring, fill]);

    const tw = s.tweens.add({
      targets: fill,
      radius,
      duration: Math.max(180, durationMs),
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (container.active) container.destroy();
        if (onFinish) onFinish();
      },
    });
    return { container, tween: tw, cancel: () => { tw?.stop(); if (container.active) container.destroy(); } };
  }

  spawnTelegraphLine(x1, y1, angle, length, width, durationMs, color = 0xf43f5e, onFinish = null) {
    const s = this.scene;
    if (!s) return null;
    const cx = x1 + Math.cos(angle) * (length * 0.5);
    const cy = y1 + Math.sin(angle) * (length * 0.5);
    const container = s.add.container(cx, cy).setRotation(angle).setDepth(6);

    const hasDecal = s.textures?.exists('decal_e_telegraph_line');
    const decal = hasDecal
      ? s.add.image(0, 0, 'decal_e_telegraph_line')
          .setDisplaySize(length, width * 1.45)
          .setAlpha(0.76)
          .setBlendMode(Phaser.BlendModes.ADD)
      : null;
    if (decal && color !== 0xf43f5e) decal.setTint(color);

    const bgRect = s.add.rectangle(0, 0, length, width, color, 0.14).setStrokeStyle(2, color, 0.9);
    const chargeRect = s.add.rectangle(-length * 0.5, 0, 8, width * 0.86, color, 0.36).setOrigin(0, 0.5);
    container.add(decal ? [decal, bgRect, chargeRect] : [bgRect, chargeRect]);

    const tw = s.tweens.add({
      targets: chargeRect,
      width: length,
      duration: Math.max(160, durationMs),
      ease: 'Linear',
      onComplete: () => {
        if (container.active) container.destroy();
        if (onFinish) onFinish();
      },
    });
    return { container, tween: tw, cancel: () => { tw?.stop(); if (container.active) container.destroy(); } };
  }

  spawnTelegraphCone(x, y, angle, spreadRad, range, durationMs, color = 0x60a5fa, onFinish = null) {
    const s = this.scene;
    if (!s) return null;
    const g = s.add.graphics().setDepth(6);
    const state = { p: 0.12 };
    const draw = () => {
      if (!g.active) return;
      g.clear();
      // 外框扇形
      g.lineStyle(2.5, color, 0.9);
      g.fillStyle(color, 0.15);
      g.beginPath();
      g.moveTo(x, y);
      g.arc(x, y, range, angle - spreadRad * 0.5, angle + spreadRad * 0.5, false);
      g.closePath();
      g.fillPath();
      g.strokePath();
      // 充能推進扇形
      g.fillStyle(color, 0.32);
      g.beginPath();
      g.moveTo(x, y);
      g.arc(x, y, range * state.p, angle - spreadRad * 0.5, angle + spreadRad * 0.5, false);
      g.closePath();
      g.fillPath();
    };
    draw();
    const tw = s.tweens.add({
      targets: state,
      p: 1,
      duration: Math.max(180, durationMs),
      ease: 'Linear',
      onUpdate: draw,
      onComplete: () => {
        if (g.active) g.destroy();
        if (onFinish) onFinish();
      },
    });
    return { graphics: g, tween: tw, cancel: () => { tw?.stop(); if (g.active) g.destroy(); } };
  }

  spawnDebrisBurst(x, y, color = 0xf97316, count = 10) {
    const pool = this.scene?.particlePool;
    if (!pool || typeof pool.burst !== 'function') return;
    pool.burst(x, y, [color, 0xfef08a], Math.min(12, Math.max(4, count)));
  }
}
