// v248: 秘法師 2.5D 暗黑手繪三層景深特效導演（MageVfxDirector — Batch 1+2 完整收官版）
// Layer 1 (depth 45): 地表焦痕／凍痕／雷印／虛空裂紋貼花（殘留冷卻 1.8 秒）
// Layer 2 (depth Y): 9 組 4x4 十六幀純素色去背手繪序列幀（144 幀零破圖，與英雄／怪物 Y 軸同層遮擋）
// Layer 3 (depth Y+24): 物理炭塊／碎冰／火星粒子＋手繪投射物＋手繪分段連鎖電弧＋手繪雙護盾／電花＋召喚進退場煙塵

export const MAGE_CONJ_ANIM_DEFS = [
  { key: 'anim_conj_hydra',           fps: 6 },
  { key: 'anim_conj_ice_blades',      fps: 10 },
  { key: 'anim_conj_lightning_spear', fps: 9 },
  { key: 'anim_conj_familiar',        fps: 7 },
];

export const MAGE_SEQ16_DEFS = [
  { key: 'seq16_m_meteor',           fps: 18 },
  { key: 'seq16_m_frost_nova',       fps: 20 },
  { key: 'seq16_m_lightning_strike', fps: 22 },
  { key: 'seq16_m_inferno',          fps: 16 },
  { key: 'seq16_m_fireball_blast',   fps: 20 },
  { key: 'seq16_m_blizzard',         fps: 16 },
  { key: 'seq16_m_firewall',         fps: 14 },
  { key: 'seq16_m_ball_lightning',   fps: 18 },
  { key: 'seq16_m_supernova',        fps: 16 },
];

export const MAGE_V248_IMAGES = [
  'proj_m_fire_bolt',
  'proj_m_fireball',
  'proj_m_ice_lance',
  'proj_m_frozen_orb',
  'decal_m_scorch',
  'decal_m_frost',
  'decal_m_lightning',
  'decal_m_void',
  'ent_m_flame_shield',
  'ent_m_ice_armor',
  'ent_m_crackling_orb',
  'ent_m_chain_arc',
];

export class MageVfxDirector {
  constructor(scene) {
    this.scene = scene;
    this._activeDecals = [];
  }

  static preload(scene) {
    for (const def of MAGE_SEQ16_DEFS) {
      scene.load.spritesheet(def.key, `./assets/fx/${def.key}.png?v=248`, {
        frameWidth: 256,
        frameHeight: 256,
      });
    }
    for (const key of MAGE_V248_IMAGES) {
      scene.load.image(key, `./assets/fx/${key}.png?v=248`);
    }
    for (const cdef of MAGE_CONJ_ANIM_DEFS) {
      scene.load.spritesheet(cdef.key, `./assets/fx/${cdef.key}.png?v=250`, {
        frameWidth: 224,
        frameHeight: 224,
      });
    }
  }

  registerAnims() {
    const s = this.scene;
    for (const def of MAGE_SEQ16_DEFS) {
      if (s.textures.exists(def.key) && !s.anims.exists(def.key)) {
        s.anims.create({
          key: def.key,
          frames: s.anims.generateFrameNumbers(def.key, { start: 0, end: 15 }),
          frameRate: def.fps,
          repeat: 0,
        });
      }
    }
    for (const cdef of MAGE_CONJ_ANIM_DEFS) {
      if (s.textures.exists(cdef.key) && !s.anims.exists(cdef.key)) {
        s.anims.create({
          key: cdef.key,
          frames: s.anims.generateFrameNumbers(cdef.key, { start: 0, end: 3 }),
          frameRate: cdef.fps,
          repeat: -1,
        });
      }
    }
  }

  // Layer 1: 貼地暗黑焦痕／凍痕／雷印／虛空裂痕
  spawnGroundDecal(type, x, y, scale = 0.85, holdMs = 1750) {
    const s = this.scene;
    const keyMap = {
      fire: 'decal_m_scorch',
      frost: 'decal_m_frost',
      shock: 'decal_m_lightning',
      void: 'decal_m_void',
    };
    const key = keyMap[type] || 'decal_m_scorch';
    if (!s.textures.exists(key)) return null;

    if (this._activeDecals.length >= 16) {
      const old = this._activeDecals.shift();
      if (old && old.active) old.destroy();
    }

    const sp = s.add.image(x, y + 6, key)
      .setScale(scale * 0.65)
      .setAlpha(0.0)
      .setDepth(45);
    this._activeDecals.push(sp);

    s.tweens.add({
      targets: sp,
      scale: scale,
      alpha: 0.86,
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

  // Layer 2: 2.5D 同層景深播放 16 幀手繪序列動畫（自動 Y-Depth 排序，NormalBlending）
  playSeq16(key, x, y, scale = 1.0, fps = null, depthOffset = 12) {
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

  // 手繪分段連鎖電弧：從 (x1, y1) 精準拉伸旋轉連接至 (x2, y2)
  playChainArc(x1, y1, x2, y2, thickness = 0.42, durationMs = 220) {
    const s = this.scene;
    if (!s.textures.exists('ent_m_chain_arc')) return false;
    const dist = Math.max(36, Phaser.Math.Distance.Between(x1, y1, x2, y2));
    const ang = Phaser.Math.Angle.Between(x1, y1, x2, y2);
    const mx = (x1 + x2) * 0.5;
    const my = (y1 + y2) * 0.5;
    const sp = s.add.image(mx, my, 'ent_m_chain_arc')
      .setRotation(ang)
      .setDisplaySize(dist + 18, Math.round(96 * thickness))
      .setAlpha(0.98)
      .setDepth(Math.max(160, Math.round(Math.max(y1, y2) + 26)));

    s.tweens.add({
      targets: sp,
      alpha: 0,
      scaleY: sp.scaleY * 0.4,
      duration: durationMs,
      ease: 'Quad.easeIn',
      onComplete: () => sp.destroy(),
    });
    return true;
  }

  // 召喚物破土登場／化煙退場煙塵過場
  spawnConjurationPoof(x, y, elem = 'fire') {
    const s = this.scene;
    const col = elem === 'frost' ? 0x475569 : (elem === 'shock' ? 0x312e81 : 0x1c1917);
    for (let i = 0; i < 6; i++) {
      const puff = s.add.circle(
        x + Phaser.Math.Between(-20, 20),
        y + Phaser.Math.Between(-6, 10),
        Phaser.Math.Between(7, 14),
        col,
        0.72
      ).setDepth(Math.max(110, Math.round(y + 18)));
      s.tweens.add({
        targets: puff,
        y: puff.y - Phaser.Math.Between(16, 36),
        scale: 1.9,
        alpha: 0,
        duration: Phaser.Math.Between(280, 440),
        ease: 'Quad.easeOut',
        onComplete: () => puff.destroy(),
      });
    }
    this.spawnDebrisBurst(x, y, elem, 5);
  }

  // Layer 3: 物理炭塊／碎冰碴／火星微粒拋物線噴濺（純視覺實質打擊感，零震動）
  spawnDebrisBurst(x, y, elem = 'fire', count = 7) {
    const s = this.scene;
    const palette = elem === 'frost'
      ? [0x1e3a5f, 0x38bdf8, 0x94a3b8, 0xe0f2fe]
      : (elem === 'shock'
        ? [0x1e1b4b, 0xc084fc, 0xe2e8f0, 0x312e81]
        : [0x1c1917, 0x451a03, 0xea580c, 0x78350f]);

    for (let i = 0; i < count; i++) {
      const col = palette[i % palette.length];
      const sz = Phaser.Math.Between(3, 7);
      const piece = s.add.rectangle(x, y - 6, sz, sz * 0.7, col, 0.92)
        .setDepth(Math.max(120, Math.round(y + 24)));
      const ang = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.FloatBetween(26, 76);
      const tx = x + Math.cos(ang) * dist;
      const ty = y + Math.sin(ang) * dist * 0.65;
      s.tweens.add({
        targets: piece,
        x: tx,
        y: ty - Phaser.Math.Between(8, 22),
        angle: Phaser.Math.Between(-240, 240),
        alpha: 0,
        duration: Phaser.Math.Between(260, 420),
        ease: 'Quad.easeOut',
        onComplete: () => piece.destroy(),
      });
    }
  }

  // 手繪去背飛行投射物＋沿途暗煙／霜霧拖尾
  launchProjectile(key, sx, sy, tx, ty, scale = 0.56, durationMs = 200, trailElem = 'fire', onHit = null) {
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

    const trailCol = trailElem === 'frost' ? 0x64748b : 0x1c1917;
    for (let i = 1; i <= 3; i++) {
      s.time.delayedCall(Math.round((durationMs * i) / 4), () => {
        if (!sp.active) return;
        const puff = s.add.circle(sp.x, sp.y, Phaser.Math.Between(4, 8), trailCol, 0.52)
          .setDepth(sp.depth - 2);
        s.tweens.add({
          targets: puff,
          scale: 2.0,
          alpha: 0,
          y: puff.y - 10,
          duration: 240,
          onComplete: () => puff.destroy(),
        });
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

  // 真實滾動推進的暗黑手繪「冰封球」
  launchFrozenOrb(sx, sy, tx, ty, onMidTick = null, onFinalShatter = null) {
    const s = this.scene;
    const key = 'proj_m_frozen_orb';
    if (!s.textures.exists(key)) {
      if (onFinalShatter) onFinalShatter();
      return;
    }
    const orb = s.add.image(sx, sy - 10, key)
      .setScale(0.62)
      .setDepth(Math.max(150, Math.round(sy + 26)));

    for (let k = 0; k < 4; k++) {
      s.time.delayedCall(150 + k * 155, () => {
        if (!orb.active) return;
        const a1 = k * 1.55;
        const a2 = a1 + Math.PI;
        this.launchProjectile('proj_m_ice_lance', orb.x, orb.y, orb.x + Math.cos(a1) * 115, orb.y + Math.sin(a1) * 80, 0.34, 150, 'frost');
        this.launchProjectile('proj_m_ice_lance', orb.x, orb.y, orb.x + Math.cos(a2) * 115, orb.y + Math.sin(a2) * 80, 0.34, 150, 'frost');
        if (k === 1 && onMidTick) onMidTick(orb.x, orb.y);
      });
    }

    s.tweens.add({
      targets: orb,
      x: tx,
      y: ty - 10,
      angle: 540,
      duration: 740,
      ease: 'Sine.easeOut',
      onUpdate: () => {
        if (orb.active) orb.setDepth(Math.max(150, Math.round(orb.y + 26)));
      },
      onComplete: () => {
        s.tweens.add({
          targets: orb,
          scale: 0.36,
          duration: 110,
          ease: 'Back.easeIn',
          onComplete: () => {
            orb.destroy();
            this.spawnGroundDecal('frost', tx, ty, 0.92, 1800);
            this.playSeq16('seq16_m_frost_nova', tx, ty - 8, 1.32, 20, 18);
            this.spawnDebrisBurst(tx, ty, 'frost', 10);
            if (onFinalShatter) onFinalShatter();
          },
        });
      },
    });
  }
}
