// v266: RANGER 職業獨立戰鬥模組（抽離自 BattleScene.js，透過 prototype 零開銷掛接）
const MAP_W = 4096;
const MAP_H = 2304;

export const rangerCombatMethods = {
  getRangerD4LiveMult() {
    const st = this.getState();
    const spec = st?.classMechanic?.ranger?.specialization || 'combo_points';
    const now = this.time?.now || 0;
    let mult = 1.0;
    if (now < (this.rangerWindwalkUntil || 0)) mult *= 1.18;
    if (now < (this._rInnerSightUntil || 0)) mult *= 1.28;
    if (spec === 'preparation') mult *= 1.15;
    return mult;
  },

  spawnRangerComboOrb(x, y) {
    if (!this.textures.exists('ent_r_combo_orb')) return null;
    if (!this.rangerComboOrbs) this.rangerComboOrbs = [];
    while (this.rangerComboOrbs.length >= 10) {
      const old = this.rangerComboOrbs.shift();
      if (old?.sprite?.active) old.sprite.destroy();
    }
    const ox = Phaser.Math.Clamp(x + Phaser.Math.Between(-36, 36), 80, MAP_W - 80);
    const oy = Phaser.Math.Clamp(y + Phaser.Math.Between(-24, 24), 80, MAP_H - 80);
    const sp = this.add.image(ox, oy, 'ent_r_combo_orb')
      .setScale(0.24)
      .setAlpha(0)
      .setDepth(Math.max(115, Math.round(oy + 6)));
    this.tweens.add({ targets: sp, scale: 0.44, alpha: 0.96, duration: 190, ease: 'Back.easeOut' });
    const entry = { x: ox, y: oy, sprite: sp, phase: Math.random() * 6.28, expiresAt: this.time.now + 14000 };
    this.rangerComboOrbs.push(entry);
    return entry;
  },

  spawnRangerEntity(kind, x, y, skillLvl = 1, lifeMs = 10000) {
    const animKeyMap = {
      clone:    'anim_r_clone',
      decoy:    'anim_r_decoy',
      caltrops: 'anim_r_caltrops',
      snare:    'anim_r_snare',
    };
    const scaleMap = { clone: 0.50, decoy: 0.48, caltrops: 0.52, snare: 0.48 };
    const capMap = { clone: 3, decoy: 1, caltrops: 2, snare: 2 };
    const intervalMap = { clone: 880, decoy: 1300, caltrops: 1100, snare: 1250 };
    const themeMap = { clone: 'shadow', decoy: 'venom', caltrops: 'venom', snare: 'blood' };

    const key = animKeyMap[kind];
    if (!key || !this.textures.exists(key)) return false;
    if (!this.rangerEntities) this.rangerEntities = [];

    const existing = this.rangerEntities.filter((e) => e.kind === kind);
    if (existing.length >= (capMap[kind] || 2)) {
      const oldest = existing[0];
      oldest.expiresAt = this.time.now + lifeMs;
      oldest.skillLvl = Math.max(oldest.skillLvl, skillLvl);
      oldest.x = Phaser.Math.Clamp(x, 80, MAP_W - 80);
      oldest.y = Phaser.Math.Clamp(y, 80, MAP_H - 80);
      this.rangerVfx?.spawnSummonPoof(oldest.x, oldest.y, themeMap[kind]);
      return true;
    }

    const mx = Phaser.Math.Clamp(x, 80, MAP_W - 80);
    const my = Phaser.Math.Clamp(y, 80, MAP_H - 80);
    const isGroundTrap = kind === 'caltrops' || kind === 'snare';
    const shadow = this.add.ellipse(mx, my + (isGroundTrap ? 8 : 14), isGroundTrap ? 48 : 36, 14, 0x050507, 0.50)
      .setDepth(Math.max(50, Math.round(my - 2)));
    const sp = this.add.sprite(mx, my - (isGroundTrap ? 4 : 12), key, 0)
      .setScale(scaleMap[kind])
      .setDepth(Math.max(115, Math.round(my + (isGroundTrap ? 4 : 10))));
    if (this.anims.exists(key)) sp.play(key);
    this.rangerVfx?.spawnSummonPoof(mx, my, themeMap[kind]);

    this.rangerEntities.push({
      kind,
      x: mx,
      y: my,
      sprite: sp,
      shadow,
      skillLvl,
      interval: intervalMap[kind],
      atkCd: 240 + Math.random() * 200,
      expiresAt: this.time.now + lifeMs,
      phase: Math.random() * 6.28,
      theme: themeMap[kind],
      homeOffX: Phaser.Math.Between(-105, 105),
      homeOffY: Phaser.Math.Between(-70, 70),
    });
    return true;
  },

  updateRangerBattlefieldEntities(delta) {
    const now = this.time.now;
    const dtSec = delta / 1000;

    // 1. 磁吸連擊結晶拾取（回精力 +12 與 +1 連擊星）
    if (this.rangerComboOrbs && this.rangerComboOrbs.length > 0 && this.hero) {
      for (let i = this.rangerComboOrbs.length - 1; i >= 0; i--) {
        const orb = this.rangerComboOrbs[i];
        if (!orb?.sprite?.active || now >= orb.expiresAt) {
          if (orb?.sprite?.active) orb.sprite.destroy();
          this.rangerComboOrbs.splice(i, 1);
          continue;
        }
        orb.phase += dtSec * 5.2;
        const dist = Phaser.Math.Distance.Between(orb.x, orb.y, this.hero.x, this.hero.y);
        if (dist <= 265) {
          const ang = Phaser.Math.Angle.Between(orb.x, orb.y, this.hero.x, this.hero.y);
          orb.x += Math.cos(ang) * 370 * dtSec;
          orb.y += Math.sin(ang) * 370 * dtSec;
        }
        orb.sprite.setPosition(orb.x, orb.y - 6 + Math.sin(orb.phase) * 4);
        orb.sprite.setDepth(Math.max(118, Math.round(orb.y + 8)));
        if (dist <= 44) {
          orb.sprite.destroy();
          this.rangerComboOrbs.splice(i, 1);
          this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 12);
          this.rangerComboStars = Math.min(3, (this.rangerComboStars || 0) + 1);
          this.rangerVfx?.spawnDebrisBurst(this.hero.x, this.hero.y - 8, 'venom', 4);
        }
      }
    }

    // 2. 4 類動態暗影分身與陷阱實體運作
    if (this.rangerEntities && this.rangerEntities.length > 0) {
      const stats = this.getStats();
      const mult = this.getRangerD4LiveMult();

      for (let i = this.rangerEntities.length - 1; i >= 0; i--) {
        const ent = this.rangerEntities[i];
        if (!ent?.sprite?.active || now >= ent.expiresAt) {
          // 誘餌到期時引爆最終毒爆
          if (ent?.kind === 'decoy') {
            this.rangerVfx?.playSeq16('seq16_r_venom_burst', ent.x, ent.y - 6, 1.05, 18, 16);
            this.rangerVfx?.spawnGroundDecal('venom', ent.x, ent.y, 0.88, 1800);
            const popDmg = Math.max(1, Math.round(stats.atk * (1.85 + ent.skillLvl * 0.24) * mult));
            for (const m of [...this.monsters]) {
              if (m && m.hp > 0 && m.sprite && Phaser.Math.Distance.Between(ent.x, ent.y, m.sprite.x, m.sprite.y) <= 240) {
                this.damageMonster(m, popDmg, true, false, '#4ade80', '☠️誘餌自爆 ', true);
              }
            }
          }
          this.rangerVfx?.spawnSummonPoof(ent.x, ent.y, ent.theme || 'shadow');
          if (ent?.sprite?.active) ent.sprite.destroy();
          if (ent?.shadow?.active) ent.shadow.destroy();
          this.rangerEntities.splice(i, 1);
          continue;
        }
        ent.phase += dtSec * 4.2;
        const tgt = this.findNearestMonster(ent.x, ent.y, 700);
        if (ent.kind === 'clone') {
          // 暗影分身保持 190~260px 射擊距離拉打
          if (tgt && tgt.sprite && tgt.hp > 0) {
            const d = Phaser.Math.Distance.Between(ent.x, ent.y, tgt.sprite.x, tgt.sprite.y);
            const ang = Phaser.Math.Angle.Between(ent.x, ent.y, tgt.sprite.x, tgt.sprite.y);
            if (d > 260) { ent.x += Math.cos(ang) * 210 * dtSec; ent.y += Math.sin(ang) * 210 * dtSec; }
            else if (d < 140) { ent.x -= Math.cos(ang) * 140 * dtSec; ent.y -= Math.sin(ang) * 140 * dtSec; }
            ent.sprite.setFlipX(tgt.sprite.x < ent.x);
          } else if (this.hero) {
            const hx = this.hero.x + ent.homeOffX, hy = this.hero.y + ent.homeOffY;
            if (Phaser.Math.Distance.Between(ent.x, ent.y, hx, hy) > 44) {
              const aH = Phaser.Math.Angle.Between(ent.x, ent.y, hx, hy);
              ent.x += Math.cos(aH) * 210 * dtSec;
              ent.y += Math.sin(aH) * 210 * dtSec;
              ent.sprite.setFlipX(hx < ent.x);
            }
          }
        }

        const isGroundTrap = ent.kind === 'caltrops' || ent.kind === 'snare';
        if (ent.shadow?.active) {
          ent.shadow.setPosition(ent.x, ent.y + (isGroundTrap ? 8 : 14));
          ent.shadow.setDepth(Math.max(50, Math.round(ent.y - 2)));
        }
        ent.sprite.setPosition(ent.x, ent.y - (isGroundTrap ? 4 : 12) + (ent.kind === 'decoy' ? Math.sin(ent.phase) * 3 : 0));
        ent.sprite.setDepth(Math.max(115, Math.round(ent.y + (isGroundTrap ? 4 : 10))));

        ent.atkCd -= delta;
        if (ent.atkCd <= 0 && tgt && tgt.sprite && tgt.hp > 0) {
          const range = ent.kind === 'clone' ? 460 : 250;
          if (Phaser.Math.Distance.Between(ent.x, ent.y, tgt.sprite.x, tgt.sprite.y) <= range) {
            ent.atkCd = ent.interval;
            const baseDmg = Math.max(1, Math.round(stats.atk * (0.85 + ent.skillLvl * 0.14) * mult));
            this.tweens.add({ targets: ent.sprite, scaleX: ent.sprite.scaleX * 1.14, scaleY: ent.sprite.scaleY * 1.14, duration: 85, yoyo: true });

            if (ent.kind === 'clone') {
              this.rangerVfx?.launchArrow('proj_r_shadow_arrow', ent.x, ent.y - 12, tgt.sprite.x, tgt.sprite.y - 8, 0.48, 160, 'shadow', () => {
                if (tgt.hp > 0) {
                  this.rangerVfx?.playSeq16('seq16_r_shadow_boom', tgt.sprite.x, tgt.sprite.y - 6, 0.52, 24, 14);
                  tgt.markedUntil = Math.max(tgt.markedUntil || 0, now + 5000);
                  this.damageMonster(tgt, Math.round(baseDmg * 1.22), false, false, '#c084fc', '🌑分身箭 ', true);
                }
              });
            } else if (ent.kind === 'decoy') {
              this.rangerVfx?.playSeq16('seq16_r_smoke_bomb', ent.x, ent.y - 6, 0.72, 20, 14);
              for (const m of [...this.monsters]) {
                if (m && m.hp > 0 && m.sprite && Phaser.Math.Distance.Between(ent.x, ent.y, m.sprite.x, m.sprite.y) <= 230) {
                  m.markedUntil = Math.max(m.markedUntil || 0, now + 4500);
                  this.damageMonster(m, Math.round(baseDmg * 0.85), false, false, '#4ade80', '🌫️毒煙 ', true);
                }
              }
            } else if (ent.kind === 'caltrops') {
              this.rangerVfx?.playSeq16('seq16_r_venom_burst', ent.x, ent.y - 4, 0.68, 20, 12);
              for (const m of [...this.monsters]) {
                if (m && m.hp > 0 && m.sprite && Phaser.Math.Distance.Between(ent.x, ent.y, m.sprite.x, m.sprite.y) <= 235) {
                  m.chilledUntil = Math.max(m.chilledUntil || 0, now + 2200);
                  m.poisonedUntil = Math.max(m.poisonedUntil || 0, now + 3500);
                  this.damageMonster(m, baseDmg, false, false, '#4ade80', '☠️蒺藜 ', true);
                }
              }
            } else if (ent.kind === 'snare') {
              this.rangerVfx?.playSeq16('seq16_r_death_trap', ent.x, ent.y - 4, 0.68, 22, 14);
              for (const m of [...this.monsters]) {
                if (m && m.hp > 0 && m.sprite && Phaser.Math.Distance.Between(ent.x, ent.y, m.sprite.x, m.sprite.y) <= 230) {
                  m.bleedUntil = Math.max(m.bleedUntil || 0, now + 4500);
                  m.markedUntil = Math.max(m.markedUntil || 0, now + 4500);
                  this.damageMonster(m, Math.round(baseDmg * 1.32), true, false, '#fb7185', '🩸捕獸夾 ', true);
                }
              }
            }
          }
        }
      }
    }
  },

  castRangerSkill(skillId, skillLvl, stats, isManual = false) {
    const _hx = this.hero.x, _hy = this.hero.y;
    const aim = this.getAimPoint(isManual, 500);
    const nearest = this.findNearestMonster(_hx, _hy);
    const _tx = isManual ? aim.x : (nearest ? nearest.sprite.x : aim.x);
    const _ty = isManual ? aim.y : (nearest ? nearest.sprite.y : aim.y);
    const _ang = Phaser.Math.Angle.Between(_hx, _hy, _tx, _ty);

    this.faceHeroToward(_tx, _ty);
    this.triggerHeroAttackAnim(340);
    if (this.anims.exists(`r_${this.heroDir}_atk`)) {
      this.hero.play(`r_${this.heroDir}_atk`, false);
    }

    const st = this.getState();
    const ks = st?.activeKeystone?.ranger || '';
    const spec = st?.classMechanic?.ranger?.specialization || 'combo_points';
    const rv = this.rangerVfx;
    const now = this.time.now;
    let liveMult = (stats.skillDmgMult || 1) * this.getRangerD4LiveMult();

    // 精準射擊關鍵被動：每第 4 招必觸發精準必暴 (+65% 暴傷)
    this.rangerPrecisionCount = (this.rangerPrecisionCount || 0) + 1;
    const precisionProc = ks === 'rk_precision' && (this.rangerPrecisionCount % 4 === 0);
    if (precisionProc) {
      liveMult *= 1.45;
      this.spawnFloatingText(_hx, _hy - 90, '🎯 精準必暴！', '#fde047', 14);
    }

    // 戰術預備契約：每次施放縮短全冷卻 0.9s
    if (spec === 'preparation') {
      this.slotCdTimers = this.slotCdTimers.map((t) => t + 900);
    }

    const isCoreSkill = ['volley', 'r_venom_pierce', 'r_frost_barrage', 'r_rapid_fire'].includes(skillId);
    let comboSpent = 0;
    if (isCoreSkill && spec === 'combo_points' && (this.rangerComboStars || 0) > 0) {
      comboSpent = this.rangerComboStars;
      this.rangerComboStars = 0;
      liveMult *= (1 + comboSpent * 0.28);
      this.spawnFloatingText(_hx, _hy - 84, `✨ ${comboSpent}★連擊爆發`, '#4ade80', 13);
    }

    const _hitOne = (m, mult, col, pre, stList = [], opts = {}) => {
      if (!m || m.hp <= 0 || !m.sprite) return false;
      const isMarked = now < (m.markedUntil || 0);
      const isC = precisionProc || opts.forceCrit || (Math.random() * 100 < (stats.critRate + (opts.bonusCrit || 0)));
      const markAmp = (opts.markAmp && isMarked) ? opts.markAmp : 1.0;
      const d = Math.max(1, Math.round(stats.atk * mult * liveMult * markAmp * (isC ? stats.critDmg / 100 : 1)));
      if (!m._statuses) m._statuses = {};
      stList.forEach((k) => {
        m._statuses[k] = Math.max(m._statuses[k] || 0, now + 5000);
        if (k === 'vulnerable' || k === 'mark') m.markedUntil = Math.max(m.markedUntil || 0, now + 5500);
        if (k === 'poison') { m.poisonedUntil = Math.max(m.poisonedUntil || 0, now + 5000); m.poisonDmg = Math.max(m.poisonDmg || 0, Math.round(stats.atk * 0.30)); }
        if (k === 'freeze' || k === 'chill') m.chilledUntil = Math.max(m.chilledUntil || 0, now + 3200);
        if (k === 'stun') m.stunUntil = Math.max(m.stunUntil || 0, now + (opts.stunMs || 1600));
        if (k === 'bleed') { m.bleedUntil = Math.max(m.bleedUntil || 0, now + 4800); m.bleedDmg = Math.max(m.bleedDmg || 0, Math.round(stats.atk * 0.28)); }
        if (k === 'curse') m.cursedUntil = Math.max(m.cursedUntil || 0, now + 5000);
      });
      this.damageMonster(m, d, isC, false, col, pre);
      // 連鎖暗爆／弱點暴露被動觸發
      if (ks === 'rk_chain_shadow' && isMarked && !opts.noProc && Math.random() < 0.35 && m.hp > 0) {
        rv?.playSeq16('seq16_r_shadow_boom', m.sprite.x, m.sprite.y - 6, 0.56, 24, 14);
        this.damageMonster(m, Math.max(1, Math.round(stats.atk * 1.15 * liveMult)), false, false, '#c084fc', '🌑暗爆 ', true);
      }
      if (ks === 'rk_exposure' && (now < (m.chilledUntil || 0) || now < (m.stunUntil || 0)) && !opts.noProc && Math.random() < 0.38 && m.hp > 0) {
        rv?.playSeq16('seq16_r_venom_burst', m.sprite.x, m.sprite.y - 6, 0.58, 22, 14);
        this.slotCdTimers = this.slotCdTimers.map((t) => t + 850);
        this.damageMonster(m, Math.max(1, Math.round(stats.atk * 1.10 * liveMult)), true, false, '#fb7185', '💥弱點毒雷 ', true);
      }
      return true;
    };

    const _aoe = (cx, cy, rad, mult, col, pre, stList = [], opts = {}) => {
      let hits = 0;
      for (const m of [...this.monsters]) {
        if (!m || m.hp <= 0 || !m.sprite) continue;
        if (Phaser.Math.Distance.Between(cx, cy, m.sprite.x, m.sprite.y) <= rad) {
          if (_hitOne(m, mult, col, pre, stList, opts)) hits += 1;
        }
      }
      return hits;
    };

    const _cone = (ox, oy, dirAng, halfArcRad, maxDist, mult, col, pre, stList = [], opts = {}) => {
      let hits = 0;
      for (const m of [...this.monsters]) {
        if (!m || m.hp <= 0 || !m.sprite) continue;
        const dist = Phaser.Math.Distance.Between(ox, oy, m.sprite.x, m.sprite.y);
        if (dist > maxDist) continue;
        const mAng = Phaser.Math.Angle.Between(ox, oy, m.sprite.x, m.sprite.y);
        if (Math.abs(Phaser.Math.Angle.Wrap(mAng - dirAng)) <= halfArcRad || dist <= 48) {
          if (_hitOne(m, mult, col, pre, stList, opts)) hits += 1;
        }
      }
      return hits;
    };

    const _line = (ox, oy, dirAng, length, halfWidth, mult, col, pre, stList = [], opts = {}) => {
      const cosA = Math.cos(dirAng), sinA = Math.sin(dirAng);
      const hitList = [];
      for (const m of [...this.monsters]) {
        if (!m || m.hp <= 0 || !m.sprite) continue;
        const dx = m.sprite.x - ox, dy = m.sprite.y - oy;
        const proj = dx * cosA + dy * sinA;
        if (proj < -20 || proj > length) continue;
        if (Math.abs(-dx * sinA + dy * cosA) <= halfWidth) {
          if (_hitOne(m, mult, col, pre, stList, opts)) hitList.push(m);
        }
      }
      return hitList;
    };

    // ===================== [1] 基礎產能（0 耗精力＋連擊星） =====================
    if (skillId === 'r_shadow_imbue') {
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 15);
      this.rangerComboStars = Math.min(3, (this.rangerComboStars || 0) + 1);
      rv?.launchArrow('proj_r_shadow_arrow', _hx, _hy - 12, _tx, _ty - 8, 0.56, 175, 'shadow', () => {
        rv?.playSeq16('seq16_r_shadow_boom', _tx, _ty - 6, 0.88, 22, 16);
        rv?.spawnGroundDecal('shadow', _tx, _ty, 0.68, 1600);
        _aoe(_tx, _ty, 215, (1.45 + skillLvl * 0.20), '#c084fc', '🌑暗影灌注 ', ['vulnerable', 'curse']);
      });
      return;
    }

    if (skillId === 'r_puncture') {
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 14);
      this.rangerComboStars = Math.min(3, (this.rangerComboStars || 0) + 1);
      [-0.28, 0, 0.28].forEach((off) => {
        const a = _ang + off;
        rv?.launchArrow('proj_r_venom_spear', _hx, _hy - 10, _hx + Math.cos(a) * 320, _hy + Math.sin(a) * 320, 0.42, 160, 'venom');
        _line(_hx, _hy, a, 330, 40, (0.74 + skillLvl * 0.12), '#4ade80', '🗡️飛刀 ', ['poison', 'vulnerable']);
      });
      return;
    }

    if (skillId === 'r_heartseeker') {
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 14);
      this.rangerComboStars = Math.min(3, (this.rangerComboStars || 0) + 1);
      const tgt = nearest;
      const hx2 = tgt ? tgt.sprite.x : _tx, hy2 = tgt ? tgt.sprite.y : _ty;
      rv?.launchArrow('proj_r_shadow_arrow', _hx, _hy - 12, hx2, hy2 - 8, 0.54, 165, 'shadow', () => {
        if (tgt && tgt.hp > 0) {
          _hitOne(tgt, (1.35 + skillLvl * 0.18), '#38bdf8', '🏹尋心 ', ['vulnerable'], { bonusCrit: 18 });
          const next = this.monsters.find((m) => m && m.hp > 0 && m !== tgt && m.sprite && Phaser.Math.Distance.Between(hx2, hy2, m.sprite.x, m.sprite.y) <= 280);
          if (next) {
            rv?.launchArrow('proj_r_shadow_arrow', hx2, hy2 - 8, next.sprite.x, next.sprite.y - 8, 0.46, 130, 'shadow', () => {
              if (next.hp > 0) _hitOne(next, (1.05 + skillLvl * 0.14), '#a78bfa', '🏹彈射 ', ['vulnerable'], { bonusCrit: 18 });
            });
          }
        }
      });
      return;
    }

    if (skillId === 'r_forceful_arrow') {
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 15);
      this.rangerComboStars = Math.min(3, (this.rangerComboStars || 0) + 1);
      this.rangerForcefulCount = (this.rangerForcefulCount || 0) + 1;
      const knock = this.rangerForcefulCount % 3 === 0;
      const ex = _hx + Math.cos(_ang) * 440, ey = _hy + Math.sin(_ang) * 440;
      rv?.launchArrow('proj_r_emerald_arrow', _hx, _hy - 12, ex, ey, 0.62, 185, 'venom');
      const hits = _line(_hx, _hy, _ang, 450, 48, (1.50 + skillLvl * 0.20) * (knock ? 1.35 : 1), '#34d399', knock ? '💨強襲擊退 ' : '🏹強襲 ', ['vulnerable']);
      if (knock) {
        hits.forEach((m) => {
          if (m.hp > 0 && m.sprite) {
            this.tweens.add({ targets: m.sprite, x: Phaser.Math.Clamp(m.sprite.x + Math.cos(_ang) * 85, 80, MAP_W - 80), y: Phaser.Math.Clamp(m.sprite.y + Math.sin(_ang) * 85, 80, MAP_H - 80), duration: 180, ease: 'Quad.easeOut' });
          }
        });
      }
      return;
    }

    // ===================== [2] 核心耗能箭技 =====================
    if (skillId === 'volley') {
      [-0.36, -0.18, 0, 0.18, 0.36].forEach((off) => {
        const a = _ang + off;
        rv?.launchArrow('proj_r_emerald_arrow', _hx, _hy - 12, _hx + Math.cos(a) * 480, _hy + Math.sin(a) * 480, 0.56, 195, 'venom');
        _line(_hx, _hy, a, 490, 40, (0.90 + skillLvl * 0.16), '#34d399', '🏹連射 ', ['mark'], { bonusCrit: 25 });
      });
      rv?.spawnGroundDecal('arrows', _tx, _ty, 0.78, 1700);
      return;
    }

    if (skillId === 'r_venom_pierce') {
      const ex = _hx + Math.cos(_ang) * 570, ey = _hy + Math.sin(_ang) * 570;
      rv?.launchArrow('proj_r_venom_spear', _hx, _hy - 12, ex, ey, 0.74, 200, 'venom', () => {
        rv?.playSeq16('seq16_r_venom_burst', ex, ey - 6, 0.92, 18, 16);
        rv?.spawnGroundDecal('venom', ex, ey, 0.88, 2000);
      });
      _line(_hx, _hy, _ang, 580, 56, (2.40 + skillLvl * 0.34), '#4ade80', '☠️劇毒貫穿 ', ['poison'], { markAmp: 1.45 });
      return;
    }

    if (skillId === 'r_frost_barrage') {
      for (let w = 0; w < 3; w++) {
        this.time.delayedCall(w * 200, () => {
          if (this.isTransitioning) return;
          const fx = _hx + Math.cos(_ang) * (150 + w * 95), fy = _hy + Math.sin(_ang) * (150 + w * 95);
          rv?.playSeq16('seq16_r_frost_barrage', fx, fy - 6, 1.02, 20, 16);
          rv?.spawnDebrisBurst(fx, fy, 'frost', 6);
          _cone(_hx, _hy, _ang, 1.05, 420, (1.05 + skillLvl * 0.18), '#38bdf8', '❄️寒霜箭幕 ', ['freeze']);
        });
      }
      return;
    }

    if (skillId === 'r_rapid_fire') {
      const tgt = nearest;
      for (let i = 0; i < 5; i++) {
        this.time.delayedCall(i * 95, () => {
          if (this.isTransitioning) return;
          const tx2 = (tgt && tgt.hp > 0 && tgt.sprite) ? tgt.sprite.x : _tx;
          const ty2 = (tgt && tgt.hp > 0 && tgt.sprite) ? tgt.sprite.y : _ty;
          rv?.launchArrow('proj_r_shadow_arrow', this.hero.x, this.hero.y - 12, tx2, ty2 - 8, 0.54, 130, 'shadow', () => {
            if (tgt && tgt.hp > 0) {
              _hitOne(tgt, (0.78 + skillLvl * 0.13), '#c084fc', '🏹連珠 ', ['vulnerable'], { bonusCrit: 15 });
              if (Math.random() < 0.45) this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 4);
            } else {
              _aoe(tx2, ty2, 110, (0.78 + skillLvl * 0.13), '#c084fc', '🏹連珠 ', ['vulnerable']);
            }
          });
        });
      }
      return;
    }

    // ===================== [3] 敏捷位移與防禦 =====================
    if (skillId === 'shadowstep') {
      const oldX = _hx, oldY = _hy;
      const dist = Math.min(340, Phaser.Math.Distance.Between(_hx, _hy, _tx, _ty));
      const nx = Phaser.Math.Clamp(_hx + Math.cos(_ang) * Math.max(120, dist), 90, MAP_W - 90);
      const ny = Phaser.Math.Clamp(_hy + Math.sin(_ang) * Math.max(120, dist), 90, MAP_H - 90);
      this.hero.setPosition(nx, ny);
      this.heroInvulnUntil = Math.max(this.heroInvulnUntil || 0, now + 1500);
      this.dodgeBuffUntil = Math.max(this.dodgeBuffUntil || 0, now + 3500);
      rv?.playSeq16('seq16_r_venom_burst', oldX, oldY - 6, 1.05, 20, 16);
      rv?.playSeq16('seq16_r_shadow_boom', nx, ny - 6, 0.88, 22, 16);
      rv?.spawnGroundDecal('venom', oldX, oldY, 0.85, 1800);
      this.spawnFloatingText(nx, ny - 78, '🌑 暗影瞬步無敵', '#c084fc', 14);
      _aoe(oldX, oldY, 230, (1.95 + skillLvl * 0.28), '#4ade80', '☠️瞬步毒爆 ', ['poison'], { markAmp: 1.75 });
      return;
    }

    if (skillId === 'windwalk') {
      this.rangerWindwalkUntil = Math.max(this.rangerWindwalkUntil || 0, now + 5000);
      this.dodgeBuffUntil = Math.max(this.dodgeBuffUntil || 0, now + 4500);
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 22);
      this.healHero(Math.round(this.playerMaxHp * 0.12));
      rv?.playSeq16('seq16_r_smoke_bomb', _hx, _hy - 6, 0.96, 18, 14);
      this.spawnRangerComboOrb(_hx + 30, _hy);
      this.spawnFloatingText(_hx, _hy - 82, '🍃 風行疾步 5s！', '#34d399', 14);
      return;
    }

    if (skillId === 'r_smoke_decoy') {
      this.healHero(Math.round(this.playerMaxHp * 0.18));
      this.spawnRangerEntity('decoy', _tx, _ty, skillLvl, 6500);
      rv?.playSeq16('seq16_r_smoke_bomb', _tx, _ty - 6, 1.05, 18, 16);
      rv?.spawnGroundDecal('venom', _tx, _ty, 0.90, 2000);
      _aoe(_tx, _ty, 235, (1.45 + skillLvl * 0.22), '#4ade80', '🌫️煙霧誘餌 ', ['poison', 'vulnerable']);
      return;
    }

    if (skillId === 'r_dark_shroud') {
      if (typeof this.grantHeroBarrier === 'function') {
        this.grantHeroBarrier(Math.round(this.playerMaxHp * (0.34 + skillLvl * 0.03)), 5500);
      }
      this.dodgeBuffUntil = Math.max(this.dodgeBuffUntil || 0, now + 4500);
      rv?.playSeq16('seq16_r_smoke_bomb', _hx, _hy - 8, 1.15, 18, 16);
      rv?.spawnGroundDecal('shadow', _hx, _hy, 0.95, 2000);
      _aoe(_hx, _hy, 260, (1.55 + skillLvl * 0.22), '#a855f7', '🌑暗影帷幕 ', ['curse', 'vulnerable']);
      return;
    }

    // ===================== [4] 陷阱與控場 =====================
    if (skillId === 'caltrops') {
      const backX = Phaser.Math.Clamp(_hx - Math.cos(_ang) * 140, 90, MAP_W - 90);
      const backY = Phaser.Math.Clamp(_hy - Math.sin(_ang) * 140, 90, MAP_H - 90);
      this.tweens.add({ targets: this.hero, x: backX, y: backY, duration: 180, ease: 'Quad.easeOut' });
      this.spawnRangerEntity('caltrops', _hx, _hy, skillLvl, 8500);
      rv?.spawnGroundDecal('venom', _hx, _hy, 0.92, 2200);
      _aoe(_hx, _hy, 230, (1.15 + skillLvl * 0.16), '#4ade80', '☠️蒺藜陣 ', ['poison', 'chill']);
      return;
    }

    if (skillId === 'r_razor_snare') {
      this.spawnRangerEntity('snare', _tx, _ty, skillLvl, 8500);
      rv?.spawnGroundDecal('trap', _tx, _ty, 0.88, 2200);
      for (const m of [...this.monsters]) {
        if (m && m.hp > 0 && m.sprite && Phaser.Math.Distance.Between(_tx, _ty, m.sprite.x, m.sprite.y) <= 250) {
          this.tweens.add({ targets: m.sprite, x: _tx + Phaser.Math.Between(-24, 24), y: _ty + Phaser.Math.Between(-18, 18), duration: 200, ease: 'Cubic.easeOut' });
        }
      }
      _aoe(_tx, _ty, 250, (1.85 + skillLvl * 0.26), '#fb7185', '🩸捕獸夾 ', ['bleed', 'vulnerable']);
      return;
    }

    if (skillId === 'r_poison_trap') {
      rv?.spawnGroundDecal('venom', _tx, _ty, 1.05, 2400);
      for (let w = 0; w < 3; w++) {
        this.time.delayedCall(w * 260, () => {
          if (this.isTransitioning) return;
          const px = _tx + Phaser.Math.Between(-65, 65), py = _ty + Phaser.Math.Between(-45, 45);
          rv?.playSeq16('seq16_r_venom_burst', px, py - 6, 1.12, 18, 16);
          rv?.spawnDebrisBurst(px, py, 'venom', 7);
          _aoe(px, py, 240, (1.35 + skillLvl * 0.20), '#4ade80', '☠️劇毒地雷 ', ['poison', 'stun'], { stunMs: 1500 });
        });
      }
      return;
    }

    if (skillId === 'r_smoke_grenade') {
      rv?.playSeq16('seq16_r_smoke_bomb', _tx, _ty - 6, 1.28, 16, 18);
      rv?.spawnGroundDecal('shadow', _tx, _ty, 1.02, 2200);
      _aoe(_tx, _ty, 305, (1.65 + skillLvl * 0.24), '#c084fc', '🌫️致盲毒煙 ', ['stun', 'vulnerable'], { stunMs: 2400 });
      return;
    }

    // ===================== [E] 分身與獵殺精通 =====================
    if (skillId === 'shadow_clones') {
      this.spawnRangerEntity('clone', _hx - 65, _hy - 20, skillLvl, 11500);
      this.spawnRangerEntity('clone', _hx + 65, _hy + 20, skillLvl, 11500);
      rv?.playSeq16('seq16_r_shadow_boom', _hx, _hy - 8, 1.05, 20, 16);
      this.spawnFloatingText(_hx, _hy - 84, '🌑 雙暗影分身出擊 11s！', '#c084fc', 14);
      return;
    }

    if (skillId === 'arrowrain') {
      rv?.spawnGroundDecal('arrows', _tx, _ty, 1.10, 2400);
      for (let w = 0; w < 4; w++) {
        this.time.delayedCall(w * 240, () => {
          if (this.isTransitioning) return;
          rv?.playSeq16('seq16_r_arrow_storm', _tx + Phaser.Math.Between(-45, 45), _ty + Phaser.Math.Between(-30, 30) - 8, 1.12, 20, 16);
          const hits = _aoe(_tx, _ty, 290, (0.94 + skillLvl * 0.16), '#34d399', '🌧️翡翠箭雨 ', ['chill']);
          if (hits > 0) this.healHero(Math.round(this.playerMaxHp * 0.02));
        });
      }
      return;
    }

    if (skillId === 'death_mark') {
      rv?.playSeq16('seq16_r_shadow_boom', _tx, _ty - 8, 1.32, 18, 18);
      rv?.spawnGroundDecal('shadow', _tx, _ty, 1.12, 2400);
      _aoe(_tx, _ty, 360, (2.10 + skillLvl * 0.32), '#f43f5e', '💀死神標記 ', ['mark', 'curse'], { markAmp: 1.90, forceCrit: true });
      return;
    }

    if (skillId === 'r_gale_snipe') {
      this.rangerComboStars = Math.min(3, (this.rangerComboStars || 0) + 2);
      const ex = _hx + Math.cos(_ang) * 630, ey = _hy + Math.sin(_ang) * 630;
      rv?.launchArrow('proj_r_emerald_arrow', _hx, _hy - 12, ex, ey, 0.78, 180, 'venom', () => {
        rv?.playSeq16('seq16_r_phantom_beam', ex, ey - 8, 0.96, 20, 16);
      });
      _line(_hx, _hy, _ang, 640, 56, (2.75 + skillLvl * 0.38), '#34d399', '🎯疾風狙擊 ', ['mark'], { forceCrit: true });
      return;
    }

    // ===================== [R] 終極毀滅奧義 =====================
    if (skillId === 'phantombow') {
      const ex = _hx + Math.cos(_ang) * 660, ey = _hy + Math.sin(_ang) * 660;
      rv?.launchArrow('proj_r_emerald_arrow', _hx, _hy - 14, ex, ey, 0.92, 195, 'venom', () => {
        rv?.playSeq16('seq16_r_phantom_beam', ex, ey - 10, 1.42, 18, 20);
        rv?.spawnGroundDecal('arrows', ex, ey, 1.18, 2400);
      });
      rv?.playSeq16('seq16_r_phantom_beam', _tx, _ty - 10, 1.32, 18, 20);
      _line(_hx, _hy, _ang, 680, 72, (3.20 + skillLvl * 0.42), '#34d399', '🐉幻影龍魂 ', ['mark'], { forceCrit: true, markAmp: 1.65 });
      return;
    }

    if (skillId === 'r_abyss_barrage') {
      this.spawnRangerEntity('clone', _hx + 55, _hy - 20, skillLvl, 11000);
      rv?.spawnGroundDecal('arrows', _tx, _ty, 1.25, 2800);
      for (let w = 0; w < 5; w++) {
        this.time.delayedCall(w * 240, () => {
          if (this.isTransitioning) return;
          const bx = _tx + Phaser.Math.Between(-95, 95), by = _ty + Phaser.Math.Between(-65, 65);
          rv?.playSeq16('seq16_r_arrow_storm', bx, by - 8, 1.26, 20, 18);
          rv?.spawnDebrisBurst(bx, by, 'venom', 7);
          _aoe(bx, by, 300, (1.55 + skillLvl * 0.26), '#a855f7', '☄️深淵箭幕 ', ['poison', 'vulnerable'], { forceCrit: w === 4 });
        });
      }
      return;
    }

    if (skillId === 'r_void_hunter') {
      this._rInnerSightUntil = Math.max(this._rInnerSightUntil || 0, now + 6000);
      this.playerMp = this.playerMaxMp;
      rv?.spawnGroundDecal('shadow', _tx, _ty, 1.25, 2800);
      this.spawnFloatingText(_hx, _hy - 90, '👁️ 虛空心眼無限精力 6s！', '#c084fc', 16);
      for (let w = 0; w < 3; w++) {
        this.time.delayedCall(w * 320, () => {
          if (this.isTransitioning) return;
          rv?.playSeq16('seq16_r_void_rift', _tx, _ty - 10, 1.42, 16, 20);
          rv?.spawnDebrisBurst(_tx, _ty, 'shadow', 9);
          _aoe(_tx, _ty, 350, (2.10 + skillLvl * 0.34), '#c084fc', '✨虛空星爆 ', ['mark', 'curse'], { forceCrit: true });
        });
      }
      return;
    }

    if (skillId === 'r_death_trap') {
      rv?.spawnGroundDecal('trap', _tx, _ty, 1.28, 2800);
      let killedAny = false;
      for (let w = 0; w < 3; w++) {
        this.time.delayedCall(w * 300, () => {
          if (this.isTransitioning) return;
          rv?.playSeq16('seq16_r_death_trap', _tx, _ty - 8, 1.42, 18, 20);
          rv?.spawnDebrisBurst(_tx, _ty, 'blood', 9);
          for (const m of [...this.monsters]) {
            if (!m || m.hp <= 0 || !m.sprite) continue;
            if (Phaser.Math.Distance.Between(_tx, _ty, m.sprite.x, m.sprite.y) <= 365) {
              this.tweens.add({ targets: m.sprite, x: _tx + Phaser.Math.Between(-30, 30), y: _ty + Phaser.Math.Between(-24, 24), duration: 220, ease: 'Cubic.easeOut' });
              _hitOne(m, (2.05 + skillLvl * 0.30), '#f43f5e', '☠️死亡陷阱 ', ['bleed', 'vulnerable'], { forceCrit: true });
              if (m.hp <= 0) killedAny = true;
            }
          }
          if (w === 2 && killedAny) {
            this.slotCdTimers = this.slotCdTimers.map((t) => t + 4000);
            this.spawnRangerComboOrb(_tx, _ty);
          }
        });
      }
      return;
    }
  },
};
