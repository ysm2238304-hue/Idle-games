// v256: 戰士（狂戰士）2.5D 暗黑手繪三層景深特效導演（WarriorVfxDirector）
// Layer 1 (depth 45): 重錘地裂坑／熔岩焦土／猩紅血泊／先祖符文貼地貼花
// Layer 2 (depth Y): 8 組 4x4 十六幀純素色去背手繪序列（128 幀）＋ 4 組 2x2 四幀動態火山圖騰與先祖英靈
// Layer 3 (depth Y+24): 碎岩／火星／血沫物理粒子＋烈焰劍氣／燃燒鎖鏈／碎岩投射物（零震動、零音效）

export const WARRIOR_SEQ16_DEFS = [
  { key: 'seq16_w_whirlwind',   fps: 20 },
  { key: 'seq16_w_hammer_slam', fps: 20 },
  { key: 'seq16_w_rend_burst',  fps: 20 },
  { key: 'seq16_w_earth_stomp', fps: 18 },
  { key: 'seq16_w_fissure',     fps: 18 },
  { key: 'seq16_w_warcry',      fps: 18 },
  { key: 'seq16_w_execute',     fps: 20 },
  { key: 'seq16_w_maelstrom',   fps: 18 },
];

export const WARRIOR_ENTITY_ANIM_DEFS = [
  { key: 'anim_w_totem',          fps: 6 },
  { key: 'anim_w_ancient_axe',    fps: 8 },
  { key: 'anim_w_ancient_hammer', fps: 7 },
  { key: 'anim_w_ancient_leap',   fps: 8 },
];

export const WARRIOR_V256_IMAGES = [
  'proj_w_flame_wave',
  'proj_w_chain_hook',
  'proj_w_rock_shard',
  'ent_w_rage_orb',
  'decal_w_crater',
  'decal_w_lava',
  'decal_w_blood',
  'decal_w_rune',
];

export class WarriorVfxDirector {
  constructor(scene) {
    this.scene = scene;
    this._activeDecals = [];
  }

  static preload(scene) {
    for (const def of WARRIOR_SEQ16_DEFS) {
      if (!scene.textures.exists(def.key)) scene.load.spritesheet(def.key, `./assets/fx/${def.key}.webp?v=265`, {
        frameWidth: 256,
        frameHeight: 256,
      });
    }
    for (const edef of WARRIOR_ENTITY_ANIM_DEFS) {
      if (!scene.textures.exists(edef.key)) scene.load.spritesheet(edef.key, `./assets/fx/${edef.key}.webp?v=265`, {
        frameWidth: 224,
        frameHeight: 224,
      });
    }
    for (const key of WARRIOR_V256_IMAGES) {
      if (!scene.textures.exists(key)) scene.load.image(key, `./assets/fx/${key}.webp?v=265`);
    }
  }


  static unload(scene) {
    const animKeys = [
      ...WARRIOR_SEQ16_DEFS.map((d) => d.key),
      ...WARRIOR_ENTITY_ANIM_DEFS.map((d) => d.key),
    ];
    for (const k of animKeys) {
      if (scene.anims?.exists(k)) scene.anims.remove(k);
      if (scene.textures?.exists(k)) scene.textures.remove(k);
    }
    for (const k of WARRIOR_V256_IMAGES) {
      if (scene.textures?.exists(k)) scene.textures.remove(k);
    }
  }

  registerAnims() {
    const s = this.scene;
    for (const def of WARRIOR_SEQ16_DEFS) {
      if (s.textures.exists(def.key) && !s.anims.exists(def.key)) {
        s.anims.create({
          key: def.key,
          frames: s.anims.generateFrameNumbers(def.key, { start: 0, end: 15 }),
          frameRate: def.fps,
          repeat: 0,
        });
      }
    }
    for (const edef of WARRIOR_ENTITY_ANIM_DEFS) {
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

  spawnGroundDecal(type, x, y, scale = 0.88, holdMs = 1900) {
    const s = this.scene;
    const map = {
      crater: 'decal_w_crater',
      lava: 'decal_w_lava',
      blood: 'decal_w_blood',
      rune: 'decal_w_rune',
    };
    const key = map[type] || 'decal_w_crater';
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
            duration: 620,
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

  spawnDebrisBurst(x, y, theme = 'rock', count = 7) {
    const s = this.scene;
    const pal = theme === 'blood'
      ? [0x7f1d1d, 0xdc2626, 0x450a0a, 0xf87171]
      : (theme === 'fire'
        ? [0xf97316, 0xfbbf24, 0x7c2d12, 0xef4444]
        : (theme === 'gold'
          ? [0xfde047, 0xd97706, 0xfef3c7, 0x78350f]
          : [0x57534e, 0x292524, 0xf97316, 0xa8a29e]));
    for (let i = 0; i < count; i++) {
      const piece = s.add.rectangle(x, y - 6, Phaser.Math.Between(3, 8), Phaser.Math.Between(3, 6), pal[i % pal.length], 0.94)
        .setDepth(Math.max(120, Math.round(y + 24)));
      const ang = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.FloatBetween(26, 82);
      s.tweens.add({
        targets: piece,
        x: x + Math.cos(ang) * dist,
        y: y + Math.sin(ang) * dist * 0.65 - Phaser.Math.Between(8, 24),
        angle: Phaser.Math.Between(-260, 260),
        alpha: 0,
        duration: Phaser.Math.Between(260, 430),
        ease: 'Quad.easeOut',
        onComplete: () => piece.destroy(),
      });
    }
  }

  spawnSummonPoof(x, y, theme = 'gold') {
    const s = this.scene;
    const col = theme === 'fire' ? 0x7c2d12 : (theme === 'blood' ? 0x450a0a : 0x78350f);
    for (let i = 0; i < 6; i++) {
      const puff = s.add.circle(
        x + Phaser.Math.Between(-18, 18),
        y + Phaser.Math.Between(-4, 10),
        Phaser.Math.Between(8, 15),
        col,
        0.72
      ).setDepth(Math.max(110, Math.round(y + 18)));
      s.tweens.add({
        targets: puff,
        y: puff.y - Phaser.Math.Between(18, 36),
        scale: 1.9,
        alpha: 0,
        duration: Phaser.Math.Between(280, 440),
        ease: 'Quad.easeOut',
        onComplete: () => puff.destroy(),
      });
    }
    this.spawnDebrisBurst(x, y, theme, 6);
  }

  launchProjectile(key, sx, sy, tx, ty, scale = 0.62, durationMs = 210, theme = 'fire', onHit = null) {
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
    const puffCol = theme === 'rock' ? 0x44403c : (theme === 'blood' ? 0x7f1d1d : 0x9a3412);
    for (let i = 1; i <= 3; i++) {
      s.time.delayedCall(Math.round((durationMs * i) / 4), () => {
        if (!sp.active) return;
        const p = s.add.circle(sp.x, sp.y, Phaser.Math.Between(4, 7), puffCol, 0.56).setDepth(sp.depth - 2);
        s.tweens.add({ targets: p, scale: 1.8, alpha: 0, duration: 210, onComplete: () => p.destroy() });
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
