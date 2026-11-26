// v266: ASSASSIN 職業獨立戰鬥模組（抽離自 BattleScene.js，透過 prototype 零開銷掛接）
const MAP_W = 4096;
const MAP_H = 2304;

export const assassinCombatMethods = {
  getAssassinD4LiveMult() {
    const now = this.time?.now || 0;
    let mult = 1.0;
    if (now < (this.assassinVenomOverloadUntil || 0)) mult *= 1.32;
    if (now < (this._aFiveStarUntil || 0)) mult *= 1.30;
    return mult;
  },

  addAssassinShadowStars(count = 1, skillLvl = 1) {
    const ks = this.getState()?.activeKeystone?.assassin || '';
    const gain = ks === 'ak_shadow_mastery' ? count * 2 : count;
    this._aShadowStars = (this._aShadowStars || 0) + gain;
    if (this._aShadowStars >= 5) {
      this._aShadowStars = 0;
      this._aFiveStarUntil = this.time.now + 4500;
      this.spawnFloatingText(this.hero.x, this.hero.y - 92, '⭐ 五星暗影絕殺！+60%', '#c084fc', 15);
      if (ks === 'ak_shadow_mastery') {
        this.spawnAssassinEntity('clone', this.hero.x + Phaser.Math.Between(-60, 60), this.hero.y + Phaser.Math.Between(-40, 40), skillLvl, 6500);
      }
    }
  },

  spawnAssassinStarOrb(x, y) {
    if (!this.textures.exists('ent_a_shadow_star')) return null;
    if (!this.assassinStarOrbs) this.assassinStarOrbs = [];
    while (this.assassinStarOrbs.length >= 10) {
      const old = this.assassinStarOrbs.shift();
      if (old?.sprite?.active) old.sprite.destroy();
    }
    const ox = Phaser.Math.Clamp(x + Phaser.Math.Between(-36, 36), 80, MAP_W - 80);
    const oy = Phaser.Math.Clamp(y + Phaser.Math.Between(-24, 24), 80, MAP_H - 80);
    const sp = this.add.image(ox, oy, 'ent_a_shadow_star')
      .setScale(0.24)
      .setAlpha(0)
      .setDepth(Math.max(115, Math.round(oy + 6)));
    this.tweens.add({ targets: sp, scale: 0.44, alpha: 0.96, duration: 190, ease: 'Back.easeOut' });
    const entry = { x: ox, y: oy, sprite: sp, phase: Math.random() * 6.28, expiresAt: this.time.now + 14000 };
    this.assassinStarOrbs.push(entry);
    return entry;
  },

  spawnAssassinEntity(kind, x, y, skillLvl = 1, lifeMs = 9500) {
    const animKeyMap = {
      clone:       'anim_a_clone',
      orbit_blade: 'anim_a_orbit_blade',
      mist_core:   'anim_a_mist_core',
      shadow_bomb: 'anim_a_shadow_bomb',
    };
    const scaleMap = { clone: 0.50, orbit_blade: 0.44, mist_core: 0.50, shadow_bomb: 0.50 };
    const capMap = { clone: 3, orbit_blade: 2, mist_core: 2, shadow_bomb: 2 };
    const intervalMap = { clone: 780, orbit_blade: 560, mist_core: 1150, shadow_bomb: 99999 };
    const themeMap = { clone: 'shadow', orbit_blade: 'blood', mist_core: 'venom', shadow_bomb: 'shadow' };

    const key = animKeyMap[kind];
    if (!key || !this.textures.exists(key)) return false;
    if (!this.assassinEntities) this.assassinEntities = [];

    const existing = this.assassinEntities.filter((e) => e.kind === kind);
    if (existing.length >= (capMap[kind] || 2)) {
      const oldest = existing[0];
      oldest.expiresAt = this.time.now + lifeMs;
      oldest.skillLvl = Math.max(oldest.skillLvl, skillLvl);
      oldest.x = Phaser.Math.Clamp(x, 80, MAP_W - 80);
      oldest.y = Phaser.Math.Clamp(y, 80, MAP_H - 80);
      this.assassinVfx?.spawnSummonPoof(oldest.x, oldest.y, themeMap[kind]);
      return true;
    }

    const mx = Phaser.Math.Clamp(x, 80, MAP_W - 80);
    const my = Phaser.Math.Clamp(y, 80, MAP_H - 80);
    const shadow = this.add.ellipse(mx, my + 12, 36, 14, 0x050507, 0.50)
      .setDepth(Math.max(50, Math.round(my - 2)));
    const sp = this.add.sprite(mx, my - 12, key, 0)
      .setScale(scaleMap[kind])
      .setDepth(Math.max(120, Math.round(my + 10)));
    if (this.anims.exists(key)) sp.play(key);
    this.assassinVfx?.spawnSummonPoof(mx, my, themeMap[kind]);

    this.assassinEntities.push({
      kind,
      x: mx,
      y: my,
      sprite: sp,
      shadow,
      skillLvl,
      interval: intervalMap[kind],
      atkCd: 220 + Math.random() * 180,
      expiresAt: this.time.now + lifeMs,
      phase: existing.length * Math.PI,
      theme: themeMap[kind],
      homeOffX: Phaser.Math.Between(-90, 90),
      homeOffY: Phaser.Math.Between(-60, 60),
    });
    return true;
  },

  updateAssassinBattlefieldEntities(delta) {
    const now = this.time.now;
    const dtSec = delta / 1000;

    // 1. 磁吸暗影血星珠拾取
    if (this.assassinStarOrbs && this.assassinStarOrbs.length > 0 && this.hero) {
      for (let i = this.assassinStarOrbs.length - 1; i >= 0; i--) {
        const orb = this.assassinStarOrbs[i];
        if (!orb?.sprite?.active || now >= orb.expiresAt) {
          if (orb?.sprite?.active) orb.sprite.destroy();
          this.assassinStarOrbs.splice(i, 1);
          continue;
        }
        orb.phase += dtSec * 5.4;
        const dist = Phaser.Math.Distance.Between(orb.x, orb.y, this.hero.x, this.hero.y);
        if (dist <= 270) {
          const ang = Phaser.Math.Angle.Between(orb.x, orb.y, this.hero.x, this.hero.y);
          orb.x += Math.cos(ang) * 380 * dtSec;
          orb.y += Math.sin(ang) * 380 * dtSec;
        }
        orb.sprite.setPosition(orb.x, orb.y - 6 + Math.sin(orb.phase) * 4);
        orb.sprite.setDepth(Math.max(118, Math.round(orb.y + 8)));
        if (dist <= 44) {
          orb.sprite.destroy();
          this.assassinStarOrbs.splice(i, 1);
          this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 12);
          this.healHero(Math.round(this.playerMaxHp * 0.05));
          this.addAssassinShadowStars(1, 1);
          this.assassinVfx?.spawnDebrisBurst(this.hero.x, this.hero.y - 8, 'shadow', 4);
        }
      }
    }

    // 2. 4 類動態刺客實體運作
    if (this.assassinEntities && this.assassinEntities.length > 0) {
      const stats = this.getStats();
      const mult = this.getAssassinD4LiveMult();

      for (let i = this.assassinEntities.length - 1; i >= 0; i--) {
        const ent = this.assassinEntities[i];
        if (!ent?.sprite?.active || now >= ent.expiresAt) {
          // 血影炸彈替身到期劇烈引爆
          if (ent?.kind === 'shadow_bomb') {
            this.assassinVfx?.playSeq16('seq16_a_eclipse', ent.x, ent.y - 8, 1.18, 20, 18);
            this.assassinVfx?.spawnGroundDecal('blood', ent.x, ent.y, 0.96, 2000);
            this.assassinVfx?.spawnDebrisBurst(ent.x, ent.y, 'blood', 10);
            const boomDmg = Math.max(1, Math.round(stats.atk * (2.55 + ent.skillLvl * 0.36) * mult * (stats.critDmg / 100)));
            for (const m of [...this.monsters]) {
              if (m && m.hp > 0 && m.sprite && Phaser.Math.Distance.Between(ent.x, ent.y, m.sprite.x, m.sprite.y) <= 290) {
                m.stunUntil = Math.max(m.stunUntil || 0, now + 1600);
                m.markedUntil = Math.max(m.markedUntil || 0, now + 5000);
                this.damageMonster(m, boomDmg, true, false, '#f43f5e', '💥影爆替身 ', true);
              }
            }
          }
          this.assassinVfx?.spawnSummonPoof(ent.x, ent.y, ent.theme || 'shadow');
          if (ent?.sprite?.active) ent.sprite.destroy();
          if (ent?.shadow?.active) ent.shadow.destroy();
          this.assassinEntities.splice(i, 1);
          continue;
        }
        ent.phase += dtSec * 4.8;
        const tgt = this.findNearestMonster(ent.x, ent.y, 700);

        if (ent.kind === 'clone') {
          if (tgt && tgt.sprite && tgt.hp > 0) {
            const d = Phaser.Math.Distance.Between(ent.x, ent.y, tgt.sprite.x, tgt.sprite.y);
            const ang = Phaser.Math.Angle.Between(ent.x, ent.y, tgt.sprite.x, tgt.sprite.y);
            if (d > 48) { ent.x += Math.cos(ang) * 295 * dtSec; ent.y += Math.sin(ang) * 295 * dtSec; }
            ent.sprite.setFlipX(tgt.sprite.x < ent.x);
          } else if (this.hero) {
            const hx = this.hero.x + ent.homeOffX, hy = this.hero.y + ent.homeOffY;
            if (Phaser.Math.Distance.Between(ent.x, ent.y, hx, hy) > 40) {
              const aH = Phaser.Math.Angle.Between(ent.x, ent.y, hx, hy);
              ent.x += Math.cos(aH) * 270 * dtSec;
              ent.y += Math.sin(aH) * 270 * dtSec;
              ent.sprite.setFlipX(hx < ent.x);
            }
          }
        } else if (ent.kind === 'orbit_blade' && this.hero) {
          ent.x = this.hero.x + Math.cos(ent.phase * 1.35) * 92;
          ent.y = this.hero.y + Math.sin(ent.phase * 1.35) * 64;
          ent.sprite.setRotation(ent.phase * 2.2);
        }

        if (ent.shadow?.active) {
          ent.shadow.setPosition(ent.x, ent.y + 12);
          ent.shadow.setDepth(Math.max(50, Math.round(ent.y - 2)));
        }
        ent.sprite.setPosition(ent.x, ent.y - 12 + (ent.kind === 'mist_core' ? Math.sin(ent.phase) * 4 : 0));
        ent.sprite.setDepth(Math.max(120, Math.round(ent.y + 10)));

        ent.atkCd -= delta;
        if (ent.atkCd <= 0 && tgt && tgt.sprite && tgt.hp > 0) {
          const hitRange = ent.kind === 'mist_core' ? 260 : 120;
          if (Phaser.Math.Distance.Between(ent.x, ent.y, tgt.sprite.x, tgt.sprite.y) <= hitRange) {
            ent.atkCd = ent.interval;
            const baseDmg = Math.max(1, Math.round(stats.atk * (0.95 + ent.skillLvl * 0.16) * mult));
            if (ent.kind === 'clone') {
              this.assassinVfx?.playSeq16('seq16_a_shadow_slash', tgt.sprite.x, tgt.sprite.y - 8, 0.62, 24, 16);
              tgt.markedUntil = Math.max(tgt.markedUntil || 0, now + 4500);
              this.damageMonster(tgt, Math.round(baseDmg * 1.18), true, false, '#c084fc', '🌑影分身 ', true);
            } else if (ent.kind === 'orbit_blade') {
              this.assassinVfx?.spawnDebrisBurst(tgt.sprite.x, tgt.sprite.y, 'venom', 4);
              tgt.poisonedUntil = Math.max(tgt.poisonedUntil || 0, now + 4000);
              this.damageMonster(tgt, baseDmg, false, false, '#4ade80', '🗡️毒魔刃 ', true);
            } else if (ent.kind === 'mist_core') {
              this.assassinVfx?.playSeq16('seq16_a_venom_nova', ent.x, ent.y - 6, 0.85, 20, 14);
              for (const m of [...this.monsters]) {
                if (m && m.hp > 0 && m.sprite && Phaser.Math.Distance.Between(ent.x, ent.y, m.sprite.x, m.sprite.y) <= 250) {
                  m.poisonedUntil = Math.max(m.poisonedUntil || 0, now + 4500);
                  this.damageMonster(m, Math.round(baseDmg * 1.10), false, false, '#4ade80', '☠️毒霧核 ', true);
                }
              }
            }
          }
        }
      }
    }
  },

  castAssassinSkill(skillId, skillLvl, stats, isManual = false) {
    const _hx = this.hero.x, _hy = this.hero.y;
    const aim = this.getAimPoint(isManual, 460);
    const nearest = this.findNearestMonster(_hx, _hy);
    const _tx = isManual ? aim.x : (nearest ? nearest.sprite.x : aim.x);
    const _ty = isManual ? aim.y : (nearest ? nearest.sprite.y : aim.y);
    const _ang = Phaser.Math.Angle.Between(_hx, _hy, _tx, _ty);

    this.faceHeroToward(_tx, _ty);
    this.triggerHeroAttackAnim(320);
    if (this.anims.exists(`a_${this.heroDir}_atk`)) {
      this.hero.play(`a_${this.heroDir}_atk`, false);
    }

    const st = this.getState();
    const ks = st?.activeKeystone?.assassin || '';
    const av = this.assassinVfx;
    const now = this.time.now;
    const liveMult = (stats.skillDmgMult || 1) * this.getAssassinD4LiveMult();

    const _hitOne = (m, mult, col, pre, stList = [], opts = {}) => {
      if (!m || m.hp <= 0 || !m.sprite) return false;
      const isPoison = now < (m.poisonedUntil || 0);
      const lowHp = m.hp < m.maxHp * 0.55;
      const bloodMoonAmp = (ks === 'ak_blood_moon' && lowHp) ? 1.45 : 1.0;
      const poisonAmp = (opts.poisonAmp && isPoison) ? opts.poisonAmp : 1.0;
      const isC = opts.forceCrit || (Math.random() * 100 < (stats.critRate + (opts.bonusCrit || 0)));
      const d = Math.max(1, Math.round(stats.atk * mult * liveMult * bloodMoonAmp * poisonAmp * (isC ? stats.critDmg / 100 : 1)));
      if (!m._statuses) m._statuses = {};
      stList.forEach((k) => {
        m._statuses[k] = Math.max(m._statuses[k] || 0, now + 5000);
        if (k === 'poison') { m.poisonedUntil = Math.max(m.poisonedUntil || 0, now + 5000); m.poisonDmg = Math.max(m.poisonDmg || 0, Math.round(stats.atk * 0.30)); }
        if (k === 'bleed') { m.bleedUntil = Math.max(m.bleedUntil || 0, now + 4800); m.bleedDmg = Math.max(m.bleedDmg || 0, Math.round(stats.atk * 0.28)); }
        if (k === 'vulnerable') m.markedUntil = Math.max(m.markedUntil || 0, now + 5000);
        if (k === 'stun') m.stunUntil = Math.max(m.stunUntil || 0, now + (opts.stunMs || 1800));
        if (k === 'chill') m.chilledUntil = Math.max(m.chilledUntil || 0, now + 3500);
      });
      this.damageMonster(m, d, isC, false, col, pre);
      if (ks === 'ak_blood_moon' && m.hp <= 0) {
        this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 12);
        this.healHero(Math.round(this.playerMaxHp * 0.08));
        this.slotCdTimers[2] = (this.slotCdTimers[2] || 0) + 4500;
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

    // ===================== [1] 基礎產影能（0 耗影能＋暗影星） =====================
    if (skillId === 'a_twin_fang') {
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 15);
      this.addAssassinShadowStars(2, skillLvl);
      const tgt = nearest;
      const fx = tgt ? tgt.sprite.x : _tx, fy = tgt ? tgt.sprite.y : _ty;
      av?.playSeq16('seq16_a_shadow_slash', fx, fy - 8, 0.78, 24, 14);
      if (tgt) _hitOne(tgt, (1.48 + skillLvl * 0.20), '#c084fc', '🗡️雙牙 ', ['bleed', 'poison']);
      return;
    }

    if (skillId === 'a_blade_shift') {
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 14);
      this.addAssassinShadowStars(1, skillLvl);
      this.dodgeBuffUntil = Math.max(this.dodgeBuffUntil || 0, now + 2500);
      const nx = Phaser.Math.Clamp(_hx + Math.cos(_ang) * 175, 85, MAP_W - 85);
      const ny = Phaser.Math.Clamp(_hy + Math.sin(_ang) * 175, 85, MAP_H - 85);
      this.tweens.add({ targets: this.hero, x: nx, y: ny, duration: 140, ease: 'Quad.easeOut' });
      av?.playSeq16('seq16_a_shadow_slash', nx, ny - 8, 0.80, 24, 16);
      _line(_hx, _hy, _ang, 195, 55, (1.38 + skillLvl * 0.18), '#d8b4fe', '💨影刃滑步 ', ['vulnerable']);
      return;
    }

    if (skillId === 'a_venom_slash') {
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 15);
      this.addAssassinShadowStars(1, skillLvl);
      const sx = _hx + Math.cos(_ang) * 90, sy = _hy + Math.sin(_ang) * 90;
      av?.playSeq16('seq16_a_venom_nova', sx, sy - 6, 0.80, 22, 14);
      _cone(_hx, _hy, _ang, 1.13, 220, (1.42 + skillLvl * 0.18), '#4ade80', '☠️毒影斬 ', ['poison']);
      return;
    }

    if (skillId === 'a_shuriken_fan') {
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 14);
      this.addAssassinShadowStars(1, skillLvl);
      [-0.28, 0, 0.28].forEach((off) => {
        const a = _ang + off;
        av?.launchBlade('proj_a_shuriken', _hx, _hy - 10, _hx + Math.cos(a) * 350, _hy + Math.sin(a) * 350, 0.46, 175, true, 'blood');
        _line(_hx, _hy, a, 360, 42, (0.74 + skillLvl * 0.12), '#fb7185', '✴️影鏢 ', ['bleed']);
      });
      return;
    }

    // ===================== [2] 核心耗影能輸出 =====================
    if (skillId === 'a_boomerang_blades') {
      const ex = _hx + Math.cos(_ang) * 450, ey = _hy + Math.sin(_ang) * 450;
      av?.launchBlade('proj_a_boomerang', _hx, _hy - 10, ex, ey, 0.64, 210, true, 'shadow', () => {
        if (this.isTransitioning) return;
        av?.launchBlade('proj_a_boomerang', ex, ey - 10, this.hero.x, this.hero.y - 10, 0.64, 210, true, 'shadow');
        _line(ex, ey, _ang + Math.PI, 460, 56, (1.45 + skillLvl * 0.24), '#d8b4fe', '🌀折返刃 ', ['vulnerable', 'bleed']);
      });
      _line(_hx, _hy, _ang, 460, 56, (1.45 + skillLvl * 0.24), '#c084fc', '🌀迴旋刃 ', ['vulnerable', 'bleed']);
      return;
    }

    if (skillId === 'blade_flurry') {
      for (let w = 0; w < 3; w++) {
        this.time.delayedCall(w * 200, () => {
          if (!this.hero?.active || this.isTransitioning) return;
          av?.playSeq16('seq16_a_blade_flurry', this.hero.x, this.hero.y - 8, 1.15, 22, 16);
          const hits = _aoe(this.hero.x, this.hero.y, 245, (0.92 + skillLvl * 0.16), '#f43f5e', '🌪️刃亂舞 ', ['bleed']);
          if (hits > 0) this.playerMp = Math.min(this.playerMaxMp, this.playerMp + Math.min(9, hits * 2));
        });
      }
      return;
    }

    if (skillId === 'poison_kunai') {
      [-0.36, -0.18, 0, 0.18, 0.36].forEach((off) => {
        const a = _ang + off;
        av?.launchBlade('proj_a_kunai', _hx, _hy - 10, _hx + Math.cos(a) * 440, _hy + Math.sin(a) * 440, 0.52, 185, false, 'venom');
        _line(_hx, _hy, a, 450, 42, (0.90 + skillLvl * 0.16), '#4ade80', '🗡️毒苦無 ', ['poison']);
      });
      av?.spawnGroundDecal('kunai', _tx, _ty, 0.80, 1800);
      return;
    }

    if (skillId === 'a_twisting_blades') {
      const tgt = nearest;
      const bx = tgt ? tgt.sprite.x : _tx, by = tgt ? tgt.sprite.y : _ty;
      av?.playSeq16('seq16_a_shadow_slash', bx, by - 8, 0.96, 22, 16);
      if (tgt) _hitOne(tgt, (1.65 + skillLvl * 0.24), '#c084fc', '🗡️絞殺刺 ', ['vulnerable', 'bleed']);
      this.time.delayedCall(420, () => {
        if (!this.hero?.active || this.isTransitioning) return;
        const retAng = Phaser.Math.Angle.Between(bx, by, this.hero.x, this.hero.y);
        const retDist = Math.max(160, Phaser.Math.Distance.Between(bx, by, this.hero.x, this.hero.y));
        av?.launchBlade('proj_a_boomerang', bx, by - 10, this.hero.x, this.hero.y - 10, 0.60, 170, true, 'blood');
        _line(bx, by, retAng, retDist + 40, 62, (2.45 + skillLvl * 0.34), '#f43f5e', '🩸絞殺折返 ', ['vulnerable', 'bleed'], { forceCrit: true });
        this.slotCdTimers = this.slotCdTimers.map((t) => t + 1200);
      });
      return;
    }

    // ===================== [3] 瞬影位移與防禦 =====================
    if (skillId === 'shadow_blitz') {
      const dist = Math.min(320, Phaser.Math.Distance.Between(_hx, _hy, _tx, _ty));
      const nx = Phaser.Math.Clamp(_hx + Math.cos(_ang) * Math.max(90, dist - 28), 85, MAP_W - 85);
      const ny = Phaser.Math.Clamp(_hy + Math.sin(_ang) * Math.max(90, dist - 28), 85, MAP_H - 85);
      this.hero.setPosition(nx, ny);
      this.dodgeBuffUntil = Math.max(this.dodgeBuffUntil || 0, now + 2600);
      av?.playSeq16('seq16_a_shadow_slash', nx, ny - 8, 1.12, 22, 16);
      av?.spawnGroundDecal('blood', nx, ny, 0.78, 1600);
      _aoe(nx, ny, 210, (1.95 + skillLvl * 0.28), '#c084fc', '⚡瞬影閃襲 ', ['vulnerable'], { bonusCrit: 25 });
      return;
    }

    if (skillId === 'a_shadow_backstab') {
      const bx = Phaser.Math.Clamp(_tx + Math.cos(_ang) * 42, 85, MAP_W - 85);
      const by = Phaser.Math.Clamp(_ty + Math.sin(_ang) * 42, 85, MAP_H - 85);
      this.hero.setPosition(bx, by);
      av?.playSeq16('seq16_a_shadow_slash', _tx, _ty - 10, 1.18, 22, 18);
      av?.spawnGroundDecal('blood', _tx, _ty, 0.84, 1800);
      av?.spawnDebrisBurst(_tx, _ty, 'blood', 8);
      _aoe(_tx, _ty, 195, (2.75 + skillLvl * 0.38), '#f43f5e', '🩸影步背刺 ', ['vulnerable', 'bleed'], { forceCrit: true });
      this.slotCdTimers = this.slotCdTimers.map((t) => t + 1500);
      return;
    }

    if (skillId === 'smoke_veil') {
      this.heroInvulnUntil = Math.max(this.heroInvulnUntil || 0, now + 1800);
      this.dodgeBuffUntil = Math.max(this.dodgeBuffUntil || 0, now + 3800);
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 24);
      av?.playSeq16('seq16_a_smoke_veil', _hx, _hy - 8, 1.24, 16, 16);
      this.spawnFloatingText(_hx, _hy - 80, '🌫️ 煙霧隱遁無敵 1.8s', '#c084fc', 14);
      _aoe(_hx, _hy, 270, (1.25 + skillLvl * 0.18), '#a855f7', '🌫️隱遁毒霧 ', ['chill', 'poison']);
      return;
    }

    if (skillId === 'a_blood_cloak') {
      if (typeof this.grantHeroBarrier === 'function') {
        this.grantHeroBarrier(Math.round(this.playerMaxHp * (0.35 + skillLvl * 0.03)), 5500);
      }
      this.healHero(Math.round(this.playerMaxHp * 0.14));
      av?.playSeq16('seq16_a_smoke_veil', _hx, _hy - 8, 1.15, 18, 16);
      av?.spawnDebrisBurst(_hx, _hy, 'blood', 8);
      _aoe(_hx, _hy, 255, (1.65 + skillLvl * 0.22), '#fb7185', '🩸血月影衣 ', ['bleed', 'vulnerable']);
      return;
    }

    // ===================== [4] 毒爆與控場 =====================
    if (skillId === 'venom_burst') {
      av?.playSeq16('seq16_a_venom_nova', _tx, _ty - 8, 1.28, 20, 18);
      av?.spawnGroundDecal('venom', _tx, _ty, 1.02, 2200);
      av?.spawnDebrisBurst(_tx, _ty, 'venom', 9);
      _aoe(_tx, _ty, 265, (2.20 + skillLvl * 0.34), '#4ade80', '☠️毒刃引爆 ', ['poison'], { poisonAmp: 1.65 });
      return;
    }

    if (skillId === 'a_crimson_mist') {
      this.spawnAssassinEntity('mist_core', _tx, _ty, skillLvl, 7500);
      av?.playSeq16('seq16_a_venom_nova', _tx, _ty - 6, 1.05, 18, 16);
      av?.spawnGroundDecal('venom', _tx, _ty, 0.96, 2200);
      _aoe(_tx, _ty, 250, (1.25 + skillLvl * 0.18), '#4ade80', '☠️猩紅毒霧 ', ['poison', 'burn']);
      return;
    }

    if (skillId === 'a_garrote_bind') {
      av?.playSeq16('seq16_a_garrote', _tx, _ty - 6, 1.32, 20, 18);
      av?.spawnGroundDecal('blood', _tx, _ty, 1.02, 2200);
      for (const m of [...this.monsters]) {
        if (m && m.hp > 0 && m.sprite && Phaser.Math.Distance.Between(_tx, _ty, m.sprite.x, m.sprite.y) <= 345) {
          this.tweens.add({ targets: m.sprite, x: _tx + Phaser.Math.Between(-28, 28), y: _ty + Phaser.Math.Between(-22, 22), duration: 220, ease: 'Cubic.easeOut' });
        }
      }
      _aoe(_tx, _ty, 345, (1.85 + skillLvl * 0.26), '#f43f5e', '🕸️血線絞殺 ', ['stun', 'bleed', 'vulnerable'], { stunMs: 2000 });
      return;
    }

    if (skillId === 'a_shadow_decoy_bomb') {
      const backX = Phaser.Math.Clamp(_hx - Math.cos(_ang) * 155, 85, MAP_W - 85);
      const backY = Phaser.Math.Clamp(_hy - Math.sin(_ang) * 155, 85, MAP_H - 85);
      this.tweens.add({ targets: this.hero, x: backX, y: backY, duration: 170, ease: 'Quad.easeOut' });
      this.spawnAssassinEntity('shadow_bomb', _hx, _hy, skillLvl, 2000);
      this.spawnFloatingText(_hx, _hy - 78, '💣 影爆替身 2s！', '#f43f5e', 13);
      return;
    }

    // ===================== [E] 分身與毒刃精通 =====================
    if (skillId === 'shadow_clones') {
      this.spawnAssassinEntity('clone', _hx - 60, _hy - 20, skillLvl, 10500);
      this.spawnAssassinEntity('clone', _hx + 60, _hy + 20, skillLvl, 10500);
      av?.playSeq16('seq16_a_shadow_slash', _hx, _hy - 8, 1.05, 22, 16);
      this.spawnFloatingText(_hx, _hy - 84, '🌑 雙影分身斬殺 10s！', '#c084fc', 14);
      return;
    }

    if (skillId === 'a_death_lotus') {
      this.addAssassinShadowStars(2, skillLvl);
      for (let w = 0; w < 3; w++) {
        this.time.delayedCall(w * 220, () => {
          if (!this.hero?.active || this.isTransitioning) return;
          av?.playSeq16('seq16_a_blade_flurry', this.hero.x, this.hero.y - 8, 1.24, 22, 16);
          _aoe(this.hero.x, this.hero.y, 285, (1.30 + skillLvl * 0.20), '#f43f5e', '🌸死神蓮華 ', ['bleed']);
        });
      }
      return;
    }

    if (skillId === 'a_venom_imbue') {
      this.assassinVenomOverloadUntil = Math.max(this.assassinVenomOverloadUntil || 0, now + 6000);
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 20);
      av?.playSeq16('seq16_a_venom_nova', _hx, _hy - 8, 1.22, 20, 16);
      av?.spawnGroundDecal('venom', _hx, _hy, 1.0, 2200);
      this.spawnFloatingText(_hx, _hy - 84, '☠️ 雙毒過載 6s！', '#4ade80', 14);
      _aoe(_hx, _hy, 265, (2.10 + skillLvl * 0.30), '#4ade80', '☠️劇毒淬刃 ', ['poison', 'vulnerable']);
      return;
    }

    if (skillId === 'lethal_fangs') {
      this.spawnAssassinEntity('orbit_blade', _hx + 80, _hy, skillLvl, 9500);
      this.spawnAssassinEntity('orbit_blade', _hx - 80, _hy, skillLvl, 9500);
      av?.playSeq16('seq16_a_venom_nova', _hx, _hy - 8, 0.98, 20, 14);
      this.spawnFloatingText(_hx, _hy - 84, '🗡️ 雙血毒魔刃環繞 9s！', '#4ade80', 14);
      return;
    }

    // ===================== [R] 終極毀滅奧義 =====================
    if (skillId === 'shadow_execute') {
      av?.playSeq16('seq16_a_execute', _tx, _ty - 10, 1.42, 22, 20);
      av?.spawnGroundDecal('blood', _tx, _ty, 1.18, 2400);
      av?.spawnDebrisBurst(_tx, _ty, 'blood', 11);
      let killedAny = false;
      for (const m of [...this.monsters]) {
        if (!m || m.hp <= 0 || !m.sprite) continue;
        if (Phaser.Math.Distance.Between(_tx, _ty, m.sprite.x, m.sprite.y) <= 305) {
          const lowHp = m.hp < m.maxHp * 0.5;
          _hitOne(m, (2.85 + skillLvl * 0.40) * (lowHp ? 1.70 : 1.0), '#f43f5e', lowHp ? '⚔️絕殺斬 ' : '⚔️絕殺陣 ', ['bleed', 'vulnerable'], { forceCrit: lowHp });
          if (m.hp <= 0) killedAny = true;
        }
      }
      if (killedAny) {
        this.slotCdTimers = this.slotCdTimers.map((t) => t + 4200);
        this.spawnAssassinStarOrb(_tx, _ty);
      }
      return;
    }

    if (skillId === 'a_thousand_shadows') {
      this.spawnAssassinEntity('clone', _tx + 40, _ty, skillLvl, 10000);
      av?.spawnGroundDecal('blood', _tx, _ty, 1.24, 2600);
      for (let w = 0; w < 5; w++) {
        this.time.delayedCall(w * 200, () => {
          if (this.isTransitioning) return;
          const sx = _tx + Phaser.Math.Between(-85, 85), sy = _ty + Phaser.Math.Between(-60, 60);
          av?.playSeq16('seq16_a_reaper_dance', sx, sy - 8, 1.18, 22, 18);
          av?.spawnDebrisBurst(sx, sy, 'shadow', 7);
          _aoe(sx, sy, 290, (1.55 + skillLvl * 0.24), '#f43f5e', '🌑千影滅絕 ', ['bleed', 'poison'], { forceCrit: true });
        });
      }
      return;
    }

    if (skillId === 'a_crimson_eclipse') {
      av?.spawnGroundDecal('eclipse', _tx, _ty, 1.32, 2800);
      for (let w = 0; w < 3; w++) {
        this.time.delayedCall(w * 300, () => {
          if (this.isTransitioning) return;
          av?.playSeq16('seq16_a_eclipse', _tx, _ty - 10, 1.44, 18, 20);
          av?.spawnDebrisBurst(_tx, _ty, 'blood', 10);
          _aoe(_tx, _ty, 380, (1.95 + skillLvl * 0.30), '#fb7185', '🩸血月絕影 ', ['bleed', 'vulnerable', 'poison'], { forceCrit: true });
        });
      }
      return;
    }

    if (skillId === 'a_reaper_dance') {
      this.heroInvulnUntil = Math.max(this.heroInvulnUntil || 0, now + 2000);
      this.spawnFloatingText(_hx, _hy - 90, '🗡️ 死神影舞無敵 6 連瞬斬！', '#f43f5e', 16);
      for (let w = 0; w < 6; w++) {
        this.time.delayedCall(w * 220, () => {
          if (!this.hero?.active || this.isTransitioning) return;
          const alive = this.monsters.filter((m) => m && m.hp > 0 && m.sprite);
          const pick = alive.length > 0 ? alive[w % alive.length] : null;
          const dx = pick ? pick.sprite.x : _tx + Phaser.Math.Between(-70, 70);
          const dy = pick ? pick.sprite.y : _ty + Phaser.Math.Between(-50, 50);
          this.hero.setPosition(Phaser.Math.Clamp(dx, 85, MAP_W - 85), Phaser.Math.Clamp(dy, 85, MAP_H - 85));
          av?.playSeq16('seq16_a_reaper_dance', dx, dy - 8, 1.15, 24, 18);
          av?.spawnDebrisBurst(dx, dy, 'blood', 6);
          _aoe(dx, dy, 190, (1.75 + skillLvl * 0.26), '#f43f5e', '🗡️死神影舞 ', ['bleed', 'vulnerable'], { forceCrit: true });
          if (w === 2 || w === 5) this.spawnAssassinStarOrb(dx, dy);
        });
      }
      return;
    }
  },
};
