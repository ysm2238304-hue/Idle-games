// v264: 聖殿騎士 2.5D 暗黑手繪三層景深特效導演（PaladinVfxDirector）
// Layer 1 (depth 45): 奉獻聖地／聖域結界／十字裂地／天使羽環貼地貼花
// Layer 2 (depth Y): 8 組 4x4 十六幀去背手繪序列（128 幀）＋ 4 組 2x2 四幀動態祝福聖鎚／烈陽聖旗／英靈聖衛／熾天使光翼
// Layer 3 (depth Y+24): 聖金粒子／天雷火花物理飛濺＋聖光箭／黃金聖槍／正義飛鎚投射物（零震動、零音效）

export const PALADIN_SEQ16_DEFS = [
  { key: 'seq16_p_holy_slash',     fps: 22 },
  { key: 'seq16_p_heaven_pillar',  fps: 20 },
  { key: 'seq16_p_divine_storm',   fps: 22 },
  { key: 'seq16_p_judgment_cross', fps: 20 },
  { key: 'seq16_p_shield_bash',    fps: 22 },
  { key: 'seq16_p_thorns_burst',   fps: 20 },
  { key: 'seq16_p_condemn_vortex', fps: 18 },
  { key: 'seq16_p_verdict_sword',  fps: 18 },
];

export const PALADIN_ENTITY_ANIM_DEFS = [
  { key: 'anim_p_hammer',       fps: 12 },
  { key: 'anim_p_solar_banner', fps: 7 },
  { key: 'anim_p_valkyrie',     fps: 8 },
  { key: 'anim_p_seraph_wing',  fps: 8 },
];

export const PALADIN_V264_IMAGES = [
  'proj_p_holy_bolt',
  'proj_p_holy_lance',
  'proj_p_justice_hammer',
  'ent_p_light_orb',
  'decal_p_consecration',
  'decal_p_sanctuary',
  'decal_p_cross_crater',
  'decal_p_aegis_ring',
];

export class PaladinVfxDirector {
  constructor(scene) {
    this.scene = scene;
    this._activeDecals = [];
  }

  static preload(scene) {
    for (const def of PALADIN_SEQ16_DEFS) {
      if (!scene.textures.exists(def.key)) scene.load.spritesheet(def.key, `./assets/fx/${def.key}.webp?v=265`, {
        frameWidth: 256,
        frameHeight: 256,
      });
    }
    for (const edef of PALADIN_ENTITY_ANIM_DEFS) {
      if (!scene.textures.exists(edef.key)) scene.load.spritesheet(edef.key, `./assets/fx/${edef.key}.webp?v=265`, {
        frameWidth: 224,
        frameHeight: 224,
      });
    }
    for (const key of PALADIN_V264_IMAGES) {
      if (!scene.textures.exists(key)) scene.load.image(key, `./assets/fx/${key}.webp?v=265`);
    }
  }


  static unload(scene) {
    const animKeys = [
      ...PALADIN_SEQ16_DEFS.map((d) => d.key),
      ...PALADIN_ENTITY_ANIM_DEFS.map((d) => d.key),
    ];
    for (const k of animKeys) {
      if (scene.anims?.exists(k)) scene.anims.remove(k);
      if (scene.textures?.exists(k)) scene.textures.remove(k);
    }
    for (const k of PALADIN_V264_IMAGES) {
      if (scene.textures?.exists(k)) scene.textures.remove(k);
    }
  }

  registerAnims() {
    const s = this.scene;
    for (const def of PALADIN_SEQ16_DEFS) {
      if (s.textures.exists(def.key) && !s.anims.exists(def.key)) {
        s.anims.create({
          key: def.key,
          frames: s.anims.generateFrameNumbers(def.key, { start: 0, end: 15 }),
          frameRate: def.fps,
          repeat: 0,
        });
      }
    }
    for (const edef of PALADIN_ENTITY_ANIM_DEFS) {
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

  spawnGroundDecal(type, x, y, scale = 0.88, holdMs = 2000) {
    const s = this.scene;
    const map = {
      consecration: 'decal_p_consecration',
      sanctuary: 'decal_p_sanctuary',
      crater: 'decal_p_cross_crater',
      aegis: 'decal_p_aegis_ring',
    };
    const key = map[type] || 'decal_p_cross_crater';
    if (!s.textures.exists(key)) return null;
    if (this._activeDecals.length >= 16) {
      const old = this._activeDecals.shift();
      if (old && old.active) old.destroy();
    }
    const sp = s.add.image(x, y + 6, key)
      .setScale(scale * 0.68)
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

  playSeq16(key, x, y, scale = 1.0, fps = null, depthOffset = 14, rotation = 0) {
    const s = this.scene;
    if (!s.textures.exists(key)) return null;
    if (!s.anims.exists(key)) this.registerAnims();
    const sp = s.add.sprite(x, y, key, 0)
      .setScale(scale)
      .setRotation(rotation)
      .setDepth(Math.max(60, Math.round(y + depthOffset)))
      .setBlendMode(Phaser.BlendModes.SCREEN);
    if (fps) sp.play({ key, frameRate: fps, repeat: 0 });
    else sp.play(key);
    sp.once('animationcomplete', () => {
      if (sp && sp.active) sp.destroy();
    });
    return sp;
  }

  spawnDebrisBurst(x, y, theme = 'holy', count = 7) {
    const s = this.scene;
    const palettes = {
      holy:      [0xfef08a, 0xfde047, 0xf59e0b, 0xffffff],
      thunder:   [0x7dd3fc, 0x38bdf8, 0xfef08a, 0xffffff],
      solar:     [0xfb923c, 0xf59e0b, 0xfef08a, 0xea580c],
      sanctuary: [0x60a5fa, 0x93c5fd, 0xfde047, 0xffffff],
    };
    const cols = palettes[theme] || palettes.holy;
    if (s.particlePool) { s.particlePool.burst(x, y, cols, count); return; }
    for (let i = 0; i < count; i++) {
      const col = cols[i % cols.length];
      const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.45;
      const dist = 24 + Math.random() * 54;
      const sz = 2.5 + Math.random() * 3.5;
      const p = s.add.circle(x, y, sz, col, 0.92)
        .setDepth(Math.max(80, Math.round(y + 24)))
        .setBlendMode(Phaser.BlendModes.ADD);
      s.tweens.add({
        targets: p,
        x: x + Math.cos(ang) * dist,
        y: y + Math.sin(ang) * dist - (8 + Math.random() * 18),
        scale: 0.15,
        alpha: 0,
        duration: 280 + Math.random() * 200,
        ease: 'Cubic.easeOut',
        onComplete: () => { if (p.active) p.destroy(); },
      });
    }
  }

  spawnSummonPoof(x, y, theme = 'holy') {
    const s = this.scene;
    const col = theme === 'sanctuary' ? 0x60a5fa : (theme === 'solar' ? 0xf59e0b : 0xfde047);
    const ring = s.add.circle(x, y, 16, col, 0.30)
      .setStrokeStyle(2.5, 0xfef08a, 0.90)
      .setDepth(Math.max(70, Math.round(y + 10)))
      .setBlendMode(Phaser.BlendModes.ADD);
    s.tweens.add({
      targets: ring,
      scale: 2.6,
      alpha: 0,
      duration: 340,
      ease: 'Cubic.easeOut',
      onComplete: () => { if (ring.active) ring.destroy(); },
    });
    this.spawnDebrisBurst(x, y, theme, 6);
  }

  launchProjectile(key, sx, sy, tx, ty, scale = 0.56, durationMs = 200, spin = false, theme = 'holy', onHit = null) {
    const s = this.scene;
    if (!s.textures.exists(key)) {
      if (onHit) onHit();
      return null;
    }
    const ang = Phaser.Math.Angle.Between(sx, sy, tx, ty);
    const sp = s.add.image(sx, sy - 8, key)
      .setScale(scale)
      .setRotation(spin ? 0 : ang)
      .setDepth(Math.max(90, Math.round(Math.max(sy, ty) + 22)))
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const trailCol = theme === 'thunder' ? 0x38bdf8 : (theme === 'solar' ? 0xf59e0b : 0xfde047);
    for (let i = 1; i <= 3; i++) {
      s.time.delayedCall(Math.round((durationMs * i) / 4), () => {
        if (!sp.active) return;
        const p = s.add.circle(sp.x, sp.y, 4, trailCol, 0.72)
          .setDepth(sp.depth - 1)
          .setBlendMode(Phaser.BlendModes.ADD);
        s.tweens.add({
          targets: p, scale: 1.7, alpha: 0, duration: 180,
          onComplete: () => { if (p.active) p.destroy(); },
        });
      });
    }
    s.tweens.add({
      targets: sp,
      x: tx,
      y: ty - 8,
      angle: spin ? 720 : Phaser.Math.RadToDeg(ang),
      duration: durationMs,
      ease: 'Linear',
      onComplete: () => {
        if (sp.active) sp.destroy();
        this.spawnDebrisBurst(tx, ty - 6, theme, 5);
        if (onHit) onHit();
      },
    });
    return sp;
  }
}
