// v252: 死靈法師 2.5D 暗黑手繪三層景深特效導演（NecroVfxDirector）
// Layer 1 (depth 45): 血坑／骨裂／腐土／幽冥裂縫貼地貼花（殘留冷卻 1.8 秒）
// Layer 2 (depth Y): 8 組 4x4 十六幀純素色去背手繪序列（128 幀）＋ 4 組 2x2 四幀動態亡靈精靈
// Layer 3 (depth Y+24): 物理碎骨／暗血／腐灰粒子＋白骨長矛／鮮血長矛實體投射物（零震動、零音效）

export const NECRO_SEQ16_DEFS = [
  { key: 'seq16_n_corpse_boom', fps: 20 },
  { key: 'seq16_n_bone_burst',  fps: 18 },
  { key: 'seq16_n_tendrils',    fps: 18 },
  { key: 'seq16_n_blight_pool', fps: 12 },
  { key: 'seq16_n_blood_surge', fps: 20 },
  { key: 'seq16_n_blood_wave',  fps: 16 },
  { key: 'seq16_n_bone_storm',  fps: 16 },
  { key: 'seq16_n_soul_rift',   fps: 16 },
];

export const NECRO_MINION_ANIM_DEFS = [
  { key: 'anim_n_skeleton', fps: 7 },
  { key: 'anim_n_mage',     fps: 6 },
  { key: 'anim_n_golem',    fps: 6 },
  { key: 'anim_n_wraith',   fps: 8 },
];

export const NECRO_V252_IMAGES = [
  'proj_n_bone_spear',
  'proj_n_blood_lance',
  'ent_n_corpse',
  'ent_n_blood_orb',
  'decal_n_blood',
  'decal_n_bone',
  'decal_n_plague',
  'decal_n_rift',
];

export class NecroVfxDirector {
  constructor(scene) {
    this.scene = scene;
    this._activeDecals = [];
  }

  static preload(scene) {
    for (const def of NECRO_SEQ16_DEFS) {
      scene.load.spritesheet(def.key, `./assets/fx/${def.key}.png?v=252`, {
        frameWidth: 256,
        frameHeight: 256,
      });
    }
    for (const mdef of NECRO_MINION_ANIM_DEFS) {
      scene.load.spritesheet(mdef.key, `./assets/fx/${mdef.key}.png?v=252`, {
        frameWidth: 224,
        frameHeight: 224,
      });
    }
    for (const key of NECRO_V252_IMAGES) {
      scene.load.image(key, `./assets/fx/${key}.png?v=252`);
    }
  }

  registerAnims() {
    const s = this.scene;
    for (const def of NECRO_SEQ16_DEFS) {
      if (s.textures.exists(def.key) && !s.anims.exists(def.key)) {
        s.anims.create({
          key: def.key,
          frames: s.anims.generateFrameNumbers(def.key, { start: 0, end: 15 }),
          frameRate: def.fps,
          repeat: 0,
        });
      }
    }
    for (const mdef of NECRO_MINION_ANIM_DEFS) {
      if (s.textures.exists(mdef.key) && !s.anims.exists(mdef.key)) {
        s.anims.create({
          key: mdef.key,
          frames: s.anims.generateFrameNumbers(mdef.key, { start: 0, end: 3 }),
          frameRate: mdef.fps,
          repeat: -1,
        });
      }
    }
  }

  spawnGroundDecal(type, x, y, scale = 0.85, holdMs = 1800) {
    const s = this.scene;
    const map = {
      blood: 'decal_n_blood',
      bone: 'decal_n_bone',
      plague: 'decal_n_plague',
      rift: 'decal_n_rift',
    };
    const key = map[type] || 'decal_n_blood';
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
      alpha: 0.88,
      duration: 160,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        s.time.delayedCall(holdMs, () => {
          if (!sp.active) return;
          s.tweens.add({
            targets: sp,
            alpha: 0,
            duration: 650,
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

  spawnDebrisBurst(x, y, theme = 'blood', count = 7) {
    const s = this.scene;
    const pal = theme === 'bone'
      ? [0xd6d3d1, 0xa8a29e, 0x44403c, 0xf5f5f4]
      : (theme === 'shadow'
        ? [0x1c1917, 0x581c87, 0x3f6212, 0x27272a]
        : [0x450a0a, 0x991b1b, 0x1c1917, 0xdc2626]);
    for (let i = 0; i < count; i++) {
      const piece = s.add.rectangle(x, y - 6, Phaser.Math.Between(3, 7), Phaser.Math.Between(3, 6), pal[i % pal.length], 0.92)
        .setDepth(Math.max(120, Math.round(y + 24)));
      const ang = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.FloatBetween(24, 74);
      s.tweens.add({
        targets: piece,
        x: x + Math.cos(ang) * dist,
        y: y + Math.sin(ang) * dist * 0.65 - Phaser.Math.Between(6, 20),
        angle: Phaser.Math.Between(-240, 240),
        alpha: 0,
        duration: Phaser.Math.Between(260, 420),
        ease: 'Quad.easeOut',
        onComplete: () => piece.destroy(),
      });
    }
  }

  spawnSummonPoof(x, y, theme = 'shadow') {
    const s = this.scene;
    const col = theme === 'blood' ? 0x450a0a : (theme === 'bone' ? 0x44403c : 0x18181b);
    for (let i = 0; i < 6; i++) {
      const puff = s.add.circle(
        x + Phaser.Math.Between(-18, 18),
        y + Phaser.Math.Between(-4, 10),
        Phaser.Math.Between(7, 14),
        col,
        0.74
      ).setDepth(Math.max(110, Math.round(y + 18)));
      s.tweens.add({
        targets: puff,
        y: puff.y - Phaser.Math.Between(16, 34),
        scale: 1.9,
        alpha: 0,
        duration: Phaser.Math.Between(280, 440),
        ease: 'Quad.easeOut',
        onComplete: () => puff.destroy(),
      });
    }
    this.spawnDebrisBurst(x, y, theme, 5);
  }

  launchSpear(key, sx, sy, tx, ty, scale = 0.64, durationMs = 210, theme = 'bone', onHit = null) {
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
    const puffCol = theme === 'blood' ? 0x450a0a : 0x292524;
    for (let i = 1; i <= 3; i++) {
      s.time.delayedCall(Math.round((durationMs * i) / 4), () => {
        if (!sp.active) return;
        const p = s.add.circle(sp.x, sp.y, Phaser.Math.Between(4, 7), puffCol, 0.55).setDepth(sp.depth - 2);
        s.tweens.add({ targets: p, scale: 1.8, alpha: 0, duration: 220, onComplete: () => p.destroy() });
      });
    }
    s.tweens.add({
      targets: sp,
      x: tx,
      y: ty,
      duration: durationMs,
      ease: 'Quad.easeOut',
      onComplete: () => {
        sp.destroy();
        if (onHit) onHit();
      },
    });
  }
}
