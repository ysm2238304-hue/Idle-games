// v260: 暗影遊俠 2.5D 暗黑手繪三層景深特效導演（RangerVfxDirector）
// Layer 1 (depth 45): 腐蝕毒泊／暗影星紋／滿地箭痕／死亡陷阱裂痕貼地貼花
// Layer 2 (depth Y): 8 組 4x4 十六幀純素色去背手繪序列（128 幀）＋ 4 組 2x2 四幀動態分身／誘餌／陷阱精靈
// Layer 3 (depth Y+24): 翠綠箭羽／墨綠毒沫／暗紫影灰物理粒子＋翡翠矢／劇毒矛／暗影矢投射物（零震動、零音效）

export const RANGER_SEQ16_DEFS = [
  { key: 'seq16_r_arrow_storm',   fps: 20 },
  { key: 'seq16_r_shadow_boom',   fps: 20 },
  { key: 'seq16_r_venom_burst',   fps: 18 },
  { key: 'seq16_r_frost_barrage', fps: 20 },
  { key: 'seq16_r_phantom_beam',  fps: 20 },
  { key: 'seq16_r_smoke_bomb',    fps: 16 },
  { key: 'seq16_r_death_trap',    fps: 18 },
  { key: 'seq16_r_void_rift',     fps: 18 },
];

export const RANGER_ENTITY_ANIM_DEFS = [
  { key: 'anim_r_clone',    fps: 8 },
  { key: 'anim_r_decoy',    fps: 6 },
  { key: 'anim_r_caltrops', fps: 6 },
  { key: 'anim_r_snare',    fps: 7 },
];

export const RANGER_V260_IMAGES = [
  'proj_r_emerald_arrow',
  'proj_r_venom_spear',
  'proj_r_shadow_arrow',
  'ent_r_combo_orb',
  'decal_r_venom',
  'decal_r_shadow',
  'decal_r_arrows',
  'decal_r_trap',
];

export class RangerVfxDirector {
  constructor(scene) {
    this.scene = scene;
    this._activeDecals = [];
  }

  static preload(scene) {
    for (const def of RANGER_SEQ16_DEFS) {
      if (!scene.textures.exists(def.key)) scene.load.spritesheet(def.key, `./assets/fx/${def.key}.webp?v=265`, {
        frameWidth: 256,
        frameHeight: 256,
      });
    }
    for (const edef of RANGER_ENTITY_ANIM_DEFS) {
      if (!scene.textures.exists(edef.key)) scene.load.spritesheet(edef.key, `./assets/fx/${edef.key}.webp?v=265`, {
        frameWidth: 224,
        frameHeight: 224,
      });
    }
    for (const key of RANGER_V260_IMAGES) {
      if (!scene.textures.exists(key)) scene.load.image(key, `./assets/fx/${key}.webp?v=265`);
    }
  }


  static unload(scene) {
    const animKeys = [
      ...RANGER_SEQ16_DEFS.map((d) => d.key),
      ...RANGER_ENTITY_ANIM_DEFS.map((d) => d.key),
    ];
    for (const k of animKeys) {
      if (scene.anims?.exists(k)) scene.anims.remove(k);
      if (scene.textures?.exists(k)) scene.textures.remove(k);
    }
    for (const k of RANGER_V260_IMAGES) {
      if (scene.textures?.exists(k)) scene.textures.remove(k);
    }
  }

  registerAnims() {
    const s = this.scene;
    for (const def of RANGER_SEQ16_DEFS) {
      if (s.textures.exists(def.key) && !s.anims.exists(def.key)) {
        s.anims.create({
          key: def.key,
          frames: s.anims.generateFrameNumbers(def.key, { start: 0, end: 15 }),
          frameRate: def.fps,
          repeat: 0,
        });
      }
    }
    for (const edef of RANGER_ENTITY_ANIM_DEFS) {
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
      venom: 'decal_r_venom',
      shadow: 'decal_r_shadow',
      arrows: 'decal_r_arrows',
      trap: 'decal_r_trap',
    };
    const key = map[type] || 'decal_r_arrows';
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
      duration: 150,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        s.time.delayedCall(holdMs, () => {
          if (!sp.active) return;
          s.tweens.add({
            targets: sp,
            alpha: 0,
            duration: 600,
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

  spawnDebrisBurst(x, y, theme = 'venom', count = 7) {
    const s = this.scene;
    const pal = theme === 'shadow'
      ? [0x581c87, 0xa855f7, 0x18181b, 0xc084fc]
      : (theme === 'frost'
        ? [0x38bdf8, 0x7dd3fc, 0x0c4a6e, 0xe0f2fe]
        : (theme === 'blood'
          ? [0x991b1b, 0xf43f5e, 0x450a0a, 0xfb7185]
          : [0x15803d, 0x4ade80, 0x14532d, 0x86efac]));
    for (let i = 0; i < count; i++) {
      const piece = s.add.rectangle(x, y - 6, Phaser.Math.Between(3, 7), Phaser.Math.Between(3, 6), pal[i % pal.length], 0.92)
        .setDepth(Math.max(120, Math.round(y + 24)));
      const ang = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.FloatBetween(24, 76);
      s.tweens.add({
        targets: piece,
        x: x + Math.cos(ang) * dist,
        y: y + Math.sin(ang) * dist * 0.65 - Phaser.Math.Between(6, 20),
        angle: Phaser.Math.Between(-240, 240),
        alpha: 0,
        duration: Phaser.Math.Between(240, 400),
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
        y: puff.y - Phaser.Math.Between(16, 34),
        scale: 1.85,
        alpha: 0,
        duration: Phaser.Math.Between(260, 420),
        ease: 'Quad.easeOut',
        onComplete: () => puff.destroy(),
      });
    }
    this.spawnDebrisBurst(x, y, theme, 5);
  }

  launchArrow(key, sx, sy, tx, ty, scale = 0.56, durationMs = 185, theme = 'venom', onHit = null) {
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
    const puffCol = theme === 'shadow' ? 0x581c87 : (theme === 'frost' ? 0x0284c7 : 0x15803d);
    for (let i = 1; i <= 3; i++) {
      s.time.delayedCall(Math.round((durationMs * i) / 4), () => {
        if (!sp.active) return;
        const p = s.add.circle(sp.x, sp.y, Phaser.Math.Between(3, 6), puffCol, 0.54).setDepth(sp.depth - 2);
        s.tweens.add({ targets: p, scale: 1.7, alpha: 0, duration: 190, onComplete: () => p.destroy() });
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
