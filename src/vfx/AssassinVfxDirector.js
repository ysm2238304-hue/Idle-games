// v262: 暗影刺客 2.5D 暗黑手繪三層景深特效導演（AssassinVfxDirector）
// Layer 1 (depth 45): 十字絕殺血痕／雙毒酸坑／血月五星紋／插地苦無貼地貼花
// Layer 2 (depth Y): 8 組 4x4 十六幀純素色去背手繪序列（128 幀）＋ 4 組 2x2 四幀動態刺客分身／環繞魔刃／毒霧核心／影爆替身
// Layer 3 (depth Y+24): 暗紫影刃／猩紅血沫／墨綠酸液物理粒子＋淬毒苦無／手裡劍／迴旋雙刃投射物（零震動、零音效）

export const ASSASSIN_SEQ16_DEFS = [
  { key: 'seq16_a_shadow_slash', fps: 22 },
  { key: 'seq16_a_blade_flurry', fps: 22 },
  { key: 'seq16_a_venom_nova',   fps: 20 },
  { key: 'seq16_a_smoke_veil',   fps: 16 },
  { key: 'seq16_a_garrote',      fps: 20 },
  { key: 'seq16_a_execute',      fps: 22 },
  { key: 'seq16_a_eclipse',      fps: 18 },
  { key: 'seq16_a_reaper_dance', fps: 22 },
];

export const ASSASSIN_ENTITY_ANIM_DEFS = [
  { key: 'anim_a_clone',       fps: 8 },
  { key: 'anim_a_orbit_blade', fps: 10 },
  { key: 'anim_a_mist_core',   fps: 7 },
  { key: 'anim_a_shadow_bomb', fps: 7 },
];

export const ASSASSIN_V262_IMAGES = [
  'proj_a_kunai',
  'proj_a_shuriken',
  'proj_a_boomerang',
  'ent_a_shadow_star',
  'decal_a_blood_cross',
  'decal_a_venom_pool',
  'decal_a_eclipse',
  'decal_a_kunai',
];

export class AssassinVfxDirector {
  constructor(scene) {
    this.scene = scene;
    this._activeDecals = [];
  }

  static preload(scene) {
    for (const def of ASSASSIN_SEQ16_DEFS) {
      if (!scene.textures.exists(def.key)) scene.load.spritesheet(def.key, `./assets/fx/${def.key}.webp?v=265`, {
        frameWidth: 256,
        frameHeight: 256,
      });
    }
    for (const edef of ASSASSIN_ENTITY_ANIM_DEFS) {
      if (!scene.textures.exists(edef.key)) scene.load.spritesheet(edef.key, `./assets/fx/${edef.key}.webp?v=265`, {
        frameWidth: 224,
        frameHeight: 224,
      });
    }
    for (const key of ASSASSIN_V262_IMAGES) {
      if (!scene.textures.exists(key)) scene.load.image(key, `./assets/fx/${key}.webp?v=265`);
    }
  }


  static unload(scene) {
    const animKeys = [
      ...ASSASSIN_SEQ16_DEFS.map((d) => d.key),
      ...ASSASSIN_ENTITY_ANIM_DEFS.map((d) => d.key),
    ];
    for (const k of animKeys) {
      if (scene.anims?.exists(k)) scene.anims.remove(k);
      if (scene.textures?.exists(k)) scene.textures.remove(k);
    }
    for (const k of ASSASSIN_V262_IMAGES) {
      if (scene.textures?.exists(k)) scene.textures.remove(k);
    }
  }

  registerAnims() {
    const s = this.scene;
    for (const def of ASSASSIN_SEQ16_DEFS) {
      if (s.textures.exists(def.key) && !s.anims.exists(def.key)) {
        s.anims.create({
          key: def.key,
          frames: s.anims.generateFrameNumbers(def.key, { start: 0, end: 15 }),
          frameRate: def.fps,
          repeat: 0,
        });
      }
    }
    for (const edef of ASSASSIN_ENTITY_ANIM_DEFS) {
      if (s.textures.exists(edef.key) && !s.anims.exists(edef.key)) {
        s.anims.create({
          key: edef.key,
          frames: s.anims.generateFrameNumbers(edef.key, { start: 0, end: 3 }),
          frameRate: edef.fps,
          repeat: -1,
        });
      }
    }
  }

  spawnGroundDecal(type, x, y, scale = 0.86, holdMs = 1900) {
    const s = this.scene;
    const map = {
      blood: 'decal_a_blood_cross',
      venom: 'decal_a_venom_pool',
      eclipse: 'decal_a_eclipse',
      kunai: 'decal_a_kunai',
    };
    const key = map[type] || 'decal_a_blood_cross';
    if (!s.textures.exists(key)) return null;
    if (this._activeDecals.length >= 16) {
      const old = this._activeDecals.shift();
      if (old && old.active) old.destroy();
    }
    const sp = s.add.image(x, y + 6, key)
      .setScale(scale * 0.65)
      .setAlpha(0)
      .setDepth(45);
    this._activeDecals.push(sp);
    s.tweens.add({
      targets: sp,
      scale,
      alpha: 0.90,
      duration: 145,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        s.time.delayedCall(holdMs, () => {
          if (!sp.active) return;
          s.tweens.add({
            targets: sp,
            alpha: 0,
            duration: 580,
            onComplete: () => {
              const idx = this._activeDecals.indexOf(sp);
              if (idx !== -1) this._activeDecals.splice(idx, 1);
              if (sp.active) sp.destroy();
            },
          });
        });
      },
    });
    return sp;
  }

  playSeq16(key, x, y, scale = 1.0, fps = null, depthOffset = 14) {
    const s = this.scene;
    if (!s.textures.exists(key) || !s.anims.exists(key)) return false;
    const sp = s.add.sprite(x, y, key, 0)
      .setScale(scale)
      .setDepth(Math.max(100, Math.round(y + depthOffset)));
    if (fps) sp.play({ key, frameRate: fps });
    else sp.play(key);
    sp.once('animationcomplete', () => sp.destroy());
    return true;
  }

  spawnDebrisBurst(x, y, theme = 'shadow', count = 7) {
    const s = this.scene;
    const pal = theme === 'venom'
      ? [0x15803d, 0x4ade80, 0xf97316, 0x86efac]
      : (theme === 'blood'
        ? [0x991b1b, 0xf43f5e, 0x450a0a, 0xfb7185]
        : [0x581c87, 0xc084fc, 0x18181b, 0xf43f5e]);
    for (let i = 0; i < count; i++) {
      const piece = s.add.rectangle(x, y - 6, Phaser.Math.Between(3, 7), Phaser.Math.Between(3, 6), pal[i % pal.length], 0.92)
        .setDepth(Math.max(120, Math.round(y + 24)));
      const ang = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.FloatBetween(24, 78);
      s.tweens.add({
        targets: piece,
        x: x + Math.cos(ang) * dist,
        y: y + Math.sin(ang) * dist * 0.65 - Phaser.Math.Between(6, 20),
        angle: Phaser.Math.Between(-260, 260),
        alpha: 0,
        duration: Phaser.Math.Between(220, 380),
        ease: 'Quad.easeOut',
        onComplete: () => piece.destroy(),
      });
    }
  }

  spawnSummonPoof(x, y, theme = 'shadow') {
    const s = this.scene;
    const col = theme === 'venom' ? 0x14532d : (theme === 'blood' ? 0x450a0a : 0x3b0764);
    for (let i = 0; i < 6; i++) {
      const puff = s.add.circle(
        x + Phaser.Math.Between(-16, 16),
        y + Phaser.Math.Between(-4, 10),
        Phaser.Math.Between(7, 14),
        col,
        0.72
      ).setDepth(Math.max(110, Math.round(y + 18)));
      s.tweens.add({
        targets: puff,
        y: puff.y - Phaser.Math.Between(16, 32),
        scale: 1.85,
        alpha: 0,
        duration: Phaser.Math.Between(240, 400),
        ease: 'Quad.easeOut',
        onComplete: () => puff.destroy(),
      });
    }
    this.spawnDebrisBurst(x, y, theme, 5);
  }

  launchBlade(key, sx, sy, tx, ty, scale = 0.54, durationMs = 175, spin = false, theme = 'shadow', onHit = null) {
    const s = this.scene;
    if (!s.textures.exists(key)) {
      if (onHit) onHit();
      return;
    }
    const ang = Phaser.Math.Angle.Between(sx, sy, tx, ty);
    const sp = s.add.image(sx, sy, key)
      .setScale(scale)
      .setRotation(ang)
      .setDepth(Math.max(140, Math.round(Math.max(sy, ty) + 22)));
    const puffCol = theme === 'venom' ? 0x15803d : (theme === 'blood' ? 0x991b1b : 0x581c87);
    for (let i = 1; i <= 3; i++) {
      s.time.delayedCall(Math.round((durationMs * i) / 4), () => {
        if (!sp.active) return;
        const p = s.add.circle(sp.x, sp.y, Phaser.Math.Between(3, 6), puffCol, 0.52).setDepth(sp.depth - 2);
        s.tweens.add({ targets: p, scale: 1.7, alpha: 0, duration: 180, onComplete: () => p.destroy() });
      });
    }
    s.tweens.add({
      targets: sp,
      x: tx,
      y: ty,
      angle: spin ? sp.angle + 540 : sp.angle,
      duration: durationMs,
      ease: 'Quad.easeOut',
      onComplete: () => {
        sp.destroy();
        if (onHit) onHit();
      },
    });
  }
}
