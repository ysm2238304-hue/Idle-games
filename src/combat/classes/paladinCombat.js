// v266: PALADIN 職業獨立戰鬥模組（抽離自 BattleScene.js，透過 prototype 零開銷掛接）

export const paladinCombatMethods = {
  spawnPaladinLightOrb(x, y) {
    if (!this._paladinLightOrbs) this._paladinLightOrbs = [];
    if (this._paladinLightOrbs.length >= 10) return;
    if (!this.textures.exists('ent_p_light_orb')) return;
    const sp = this.add.image(x, y - 6, 'ent_p_light_orb')
      .setScale(0.28)
      .setDepth(Math.max(85, Math.round(y + 18)))
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this._paladinLightOrbs.push({ sprite: sp, x, y: y - 6, bornAt: this.time.now, lifeMs: 8500 });
  },

  spawnPaladinEntity(kind, x, y, opts = {}) {
    if (!this._paladinEntities) this._paladinEntities = [];
    const keyMap = {
      hammer: 'anim_p_hammer',
      solar_banner: 'anim_p_solar_banner',
      valkyrie: 'anim_p_valkyrie',
      seraph_wing: 'anim_p_seraph_wing',
    };
    const themeMap = {
      hammer: 'holy',
      solar_banner: 'solar',
      valkyrie: 'holy',
      seraph_wing: 'solar',
    };
    const key = keyMap[kind];
    if (!key || !this.textures.exists(key)) return null;
    const maxSame = kind === 'hammer' ? 10 : (kind === 'solar_banner' ? 3 : 2);
    const same = this._paladinEntities.filter((e) => e.kind === kind);
    if (same.length >= maxSame) {
      const oldest = same[0];
      if (oldest.sprite?.active) oldest.sprite.destroy();
      this._paladinEntities = this._paladinEntities.filter((e) => e !== oldest);
    }
    if (!this.anims.exists(key)) this.paladinVfx?.registerAnims();
    const scale = opts.scale || (kind === 'hammer' ? 0.34 : (kind === 'valkyrie' ? 0.62 : (kind === 'solar_banner' ? 0.56 : 0.72)));
    const sp = this.add.sprite(x, y, key, 0)
      .setScale(scale)
      .setDepth(Math.max(70, Math.round(y + (kind === 'seraph_wing' ? -4 : 12))));
    if (kind === 'seraph_wing' || kind === 'hammer') sp.setBlendMode(Phaser.BlendModes.SCREEN);
    sp.play(key);
    if (kind !== 'hammer') this.paladinVfx?.spawnSummonPoof(x, y, themeMap[kind]);
    const ent = {
      kind,
      sprite: sp,
      x,
      y,
      bornAt: this.time.now,
      expiresAt: this.time.now + (opts.durationMs || 5000),
      nextTickAt: this.time.now + (opts.tickIntervalMs || 400),
      tickIntervalMs: opts.tickIntervalMs || 400,
      angle: opts.angle || 0,
      radius: opts.radius || 38,
      spiralSpeed: opts.spiralSpeed || 4.8,
      expandRate: opts.expandRate || 62,
      dmgMult: opts.dmgMult || 1.0,
      hitCooldowns: new Map(),
      theme: themeMap[kind],
    };
    this._paladinEntities.push(ent);
    return ent;
  },

  updatePaladinBattlefieldEntities(delta) {
    const now = this.time.now;
    const dt = Math.min(0.05, (delta || 16) / 1000);
    const state = this.getState();
    const cid = state?.classId;

    // 1. 磁吸聖光之球（飛向英雄並回聖能／回血／觸發聖恩救贖 pk_radiant_grace）
    if (this._paladinLightOrbs && this._paladinLightOrbs.length > 0 && this.hero) {
      const ks = state?.activeKeystone?.paladin;
      for (let i = this._paladinLightOrbs.length - 1; i >= 0; i--) {
        const orb = this._paladinLightOrbs[i];
        if (!orb.sprite?.active || now - orb.bornAt > orb.lifeMs) {
          orb.sprite?.destroy();
          this._paladinLightOrbs.splice(i, 1);
          continue;
        }
        const dist = Phaser.Math.Distance.Between(orb.x, orb.y, this.hero.x, this.hero.y);
        if (dist < 320 || now - orb.bornAt > 420) {
          const ang = Phaser.Math.Angle.Between(orb.x, orb.y, this.hero.x, this.hero.y);
          const spd = 390;
          orb.x += Math.cos(ang) * spd * dt;
          orb.y += Math.sin(ang) * spd * dt;
          orb.sprite.setPosition(orb.x, orb.y).setDepth(Math.max(85, Math.round(orb.y + 18)));
        }
        if (dist <= 38) {
          orb.sprite.destroy();
          this._paladinLightOrbs.splice(i, 1);
          const mpGain = ks === 'pk_radiant_grace' ? 12 : 6;
          const hpGain = Math.round(this.playerMaxHp * (ks === 'pk_radiant_grace' ? 0.06 : 0.025));
          this.playerMp = Math.min(this.playerMaxMp, this.playerMp + mpGain);
          this.healHero(hpGain);
          if (ks === 'pk_radiant_grace') {
            this._paladinGraceUntil = now + 4000;
            this.spawnFloatingText(this.hero.x, this.hero.y - 96, '✨聖恩救贖 +40%必爆', '#fef08a', 13);
          }
          this.paladinVfx?.spawnDebrisBurst(this.hero.x, this.hero.y - 8, 'holy', 4);
        }
      }
    }

    if (cid !== 'paladin' || !this.hero) return;
    const stats = this.getStats();
    const ks = state?.activeKeystone?.paladin;
    const zealotMult = ks === 'pk_solar_zealot' ? 1.35 : 1.0;

    // 2. 神聖化身（p_akarats_wrath）每秒自動免費生成 1 把螺旋祝福之鎚
    if (this._paladinAkaratUntil && now < this._paladinAkaratUntil) {
      if (!this._paladinAkaratNextHammer || now >= this._paladinAkaratNextHammer) {
        this._paladinAkaratNextHammer = now + 1000;
        this.spawnPaladinEntity('hammer', this.hero.x, this.hero.y, {
          durationMs: 2800,
          angle: Math.random() * Math.PI * 2,
          radius: 34,
          spiralSpeed: 5.2,
          expandRate: 68,
          dmgMult: (this._paladinAkaratHammerMult || 1.25) * zealotMult,
        });
      }
    }

    // 3. 更新動態召喚實體（螺旋祝福聖鎚／烈陽聖旗／天界英靈聖衛／熾天使光翼）
    if (!this._paladinEntities || this._paladinEntities.length === 0) return;
    for (let i = this._paladinEntities.length - 1; i >= 0; i--) {
      const ent = this._paladinEntities[i];
      if (!ent.sprite?.active || now >= ent.expiresAt) {
        if (ent.kind !== 'hammer' && ent.sprite?.active) {
          this.paladinVfx?.spawnSummonPoof(ent.x, ent.y, ent.theme || 'holy');
        }
        ent.sprite?.destroy();
        this._paladinEntities.splice(i, 1);
        continue;
      }

      if (ent.kind === 'hammer') {
        ent.angle += ent.spiralSpeed * dt;
        ent.radius += ent.expandRate * dt;
        ent.x = this.hero.x + Math.cos(ent.angle) * ent.radius;
        ent.y = this.hero.y + Math.sin(ent.angle) * ent.radius * 0.72;
        ent.sprite.setPosition(ent.x, ent.y).setDepth(Math.max(70, Math.round(ent.y + 14)));
        for (const m of [...this.monsters]) {
          if (!m || m.hp <= 0 || !m.sprite?.active) continue;
          const lastHit = ent.hitCooldowns.get(m) || 0;
          if (now - lastHit < 420) continue;
          if (Phaser.Math.Distance.Between(ent.x, ent.y, m.sprite.x, m.sprite.y) <= 56) {
            ent.hitCooldowns.set(m, now);
            const hasBonus = (m.stunUntil && now < m.stunUntil) || (m._statuses?.conviction && now < m._statuses.conviction);
            const isC = Math.random() * 100 < stats.critRate;
            const dmg = Math.round(stats.atk * ent.dmgMult * (hasBonus ? 1.25 : 1.0) * (isC ? stats.critDmg / 100 : 1));
            if (!m._statuses) m._statuses = {};
            m._statuses.conviction = Math.max(m._statuses.conviction || 0, now + 5000);
            this.damageMonster(m, dmg, isC, false, '#fde047', '🔨');
            this.paladinVfx?.spawnDebrisBurst(m.sprite.x, m.sprite.y - 6, 'holy', 3);
            if (m.hp <= 0 && Math.random() < 0.35) this.spawnPaladinLightOrb(m.sprite.x, m.sprite.y);
          }
        }
      } else if (ent.kind === 'seraph_wing') {
        ent.x = this.hero.x;
        ent.y = this.hero.y - 24;
        ent.sprite.setPosition(ent.x, ent.y).setDepth(Math.max(55, Math.round(this.hero.y - 4)));
      } else if (ent.kind === 'solar_banner') {
        if (now >= ent.nextTickAt) {
          ent.nextTickAt = now + ent.tickIntervalMs;
          const tgt = this.findNearestMonster(ent.x, ent.y);
          const bx = tgt && Phaser.Math.Distance.Between(ent.x, ent.y, tgt.sprite.x, tgt.sprite.y) <= 320 ? tgt.sprite.x : ent.x;
          const by = tgt && Phaser.Math.Distance.Between(ent.x, ent.y, tgt.sprite.x, tgt.sprite.y) <= 320 ? tgt.sprite.y : ent.y;
          this.paladinVfx?.playSeq16('seq16_p_heaven_pillar', bx, by - 36, 0.92, 22, 18);
          this.paladinVfx?.spawnDebrisBurst(bx, by, 'solar', 6);
          for (const m of [...this.monsters]) {
            if (!m || m.hp <= 0) continue;
            if (Phaser.Math.Distance.Between(bx, by, m.sprite.x, m.sprite.y) <= 175) {
              const isC = Math.random() * 100 < stats.critRate;
              const dmg = Math.round(stats.atk * ent.dmgMult * zealotMult * (isC ? stats.critDmg / 100 : 1));
              if (!m._statuses) m._statuses = {};
              m._statuses.conviction = Math.max(m._statuses.conviction || 0, now + 5000);
              m._statuses.burn = Math.max(m._statuses.burn || 0, now + 5000);
              this.damageMonster(m, dmg, isC, false, '#fb923c', '☀️聖旗 ');
              if (m.hp <= 0 && Math.random() < 0.45) this.spawnPaladinLightOrb(m.sprite.x, m.sprite.y);
            }
          }
        }
      } else if (ent.kind === 'valkyrie') {
        const tgt = this.findNearestMonster(ent.x, ent.y);
        if (tgt && tgt.sprite?.active) {
          const dist = Phaser.Math.Distance.Between(ent.x, ent.y, tgt.sprite.x, tgt.sprite.y);
          if (dist > 64) {
            const ang = Phaser.Math.Angle.Between(ent.x, ent.y, tgt.sprite.x, tgt.sprite.y);
            ent.x += Math.cos(ang) * 215 * dt;
            ent.y += Math.sin(ang) * 215 * dt;
            ent.sprite.setFlipX(tgt.sprite.x < ent.x);
            ent.sprite.setPosition(ent.x, ent.y).setDepth(Math.max(70, Math.round(ent.y + 12)));
          }
          if (dist <= 110 && now >= ent.nextTickAt) {
            ent.nextTickAt = now + ent.tickIntervalMs;
            const ang = Phaser.Math.Angle.Between(ent.x, ent.y, tgt.sprite.x, tgt.sprite.y);
            this.paladinVfx?.playSeq16('seq16_p_holy_slash', tgt.sprite.x, tgt.sprite.y - 10, 0.72, 24, 16, ang);
            for (const m of [...this.monsters]) {
              if (!m || m.hp <= 0) continue;
              if (Phaser.Math.Distance.Between(tgt.sprite.x, tgt.sprite.y, m.sprite.x, m.sprite.y) <= 130) {
                const isC = Math.random() * 100 < stats.critRate;
                const dmg = Math.round(stats.atk * ent.dmgMult * zealotMult * (isC ? stats.critDmg / 100 : 1));
                if (!m._statuses) m._statuses = {};
                m._statuses.conviction = Math.max(m._statuses.conviction || 0, now + 5000);
                this.damageMonster(m, dmg, isC, false, '#fef08a', '👼英靈 ');
                if (m.hp <= 0 && Math.random() < 0.40) this.spawnPaladinLightOrb(m.sprite.x, m.sprite.y);
              }
            }
          }
        }
      }
    }
  },

  castPaladinSkill(skillId, skillLvl, stats, isManual = false) {
    const pv = this.paladinVfx;
    const now = this.time.now;
    const state = this.getState();
    const ks = state?.activeKeystone?.paladin;
    const oath = state?.classMechanic?.paladin?.oath || 'sun_oath';
    const _hx = this.hero.x, _hy = this.hero.y;
    const _n = this.findNearestMonster(_hx, _hy);
    const _tx = _n ? _n.sprite.x : _hx + 120, _ty = _n ? _n.sprite.y : _hy;
    const baseAng = Phaser.Math.Angle.Between(_hx, _hy, _tx, _ty);
    const areaMult = ks === 'pk_hammer_domain' ? 1.22 : 1.0;
    const zealotMult = ks === 'pk_solar_zealot' ? 1.35 : 1.0;

    // 殉道狂熱誓約（martyr_oath）：非基礎招消耗 3% HP 換取額外爆發
    const isBasic = ['p_smite_lash', 'p_zeal_strike', 'p_holy_bolt', 'p_justice_hammer'].includes(skillId);
    if (oath === 'martyr_oath' && !isBasic && this.playerHp > this.playerMaxHp * 0.15) {
      this.playerHp = Math.max(1, this.playerHp - Math.round(this.playerMaxHp * 0.03));
      this.updateHeroHpBar();
    }

    // 聖恩救贖（pk_radiant_grace）消耗：核心／終極必爆且 +40% 傷
    let graceMult = 1.0;
    let graceCrit = false;
    if (!isBasic && this._paladinGraceUntil && now < this._paladinGraceUntil) {
      graceMult = 1.40;
      graceCrit = true;
      this._paladinGraceUntil = 0;
    }
    const akaratCritBonus = (this._paladinAkaratUntil && now < this._paladinAkaratUntil) ? 20 : 0;

    // 聖光印記累計（每滿 5 層觸發烈陽天雷＋掉落聖光之球）
    const addHolyMark = (amt = 1, gx = _tx, gy = _ty) => {
      this._paladinHolyMarks = (this._paladinHolyMarks || 0) + amt;
      if (this._paladinHolyMarks >= 5) {
        this._paladinHolyMarks -= 5;
        this.spawnPaladinLightOrb(gx, gy);
        if (oath === 'sun_oath') {
          pv?.playSeq16('seq16_p_heaven_pillar', gx, gy - 34, 0.96, 22, 18);
          for (const m of [...this.monsters]) {
            if (!m || m.hp <= 0) continue;
            if (Phaser.Math.Distance.Between(gx, gy, m.sprite.x, m.sprite.y) <= 170 * areaMult) {
              const d = Math.round(stats.atk * 2.40);
              if (!m._statuses) m._statuses = {};
              m._statuses.conviction = Math.max(m._statuses.conviction || 0, now + 5000);
              m._statuses.burn = Math.max(m._statuses.burn || 0, now + 5000);
              this.damageMonster(m, d, true, false, '#fde047', '☀️誓約天雷 ');
            }
          }
        }
      }
    };

    const hitMonster = (m, mult, col, pre, stList = [], forceCrit = false, extraFlat = 0, stunMs = 0) => {
      if (!m || m.hp <= 0) return false;
      const effCritRate = (stats.critRate || 10) + akaratCritBonus;
      const isC = forceCrit || graceCrit || (Math.random() * 100 < effCritRate);
      const dmg = Math.round((stats.atk * mult * graceMult + extraFlat) * (isC ? (stats.critDmg || 150) / 100 : 1));
      if (!m._statuses) m._statuses = {};
      if (ks === 'pk_hammer_domain' && !stList.includes('conviction')) stList = [...stList, 'conviction'];
      stList.forEach((k) => { m._statuses[k] = Math.max(m._statuses[k] || 0, now + 5200); });
      if (stunMs > 0) m.stunUntil = Math.max(m.stunUntil || 0, now + stunMs);
      this.damageMonster(m, dmg, isC, false, col, pre);
      // 關鍵被動：烈陽狂熱（觸發定罪縮短終極技能冷卻 0.4s）
      if (ks === 'pk_solar_zealot' && stList.includes('conviction') && this.slotCdTimers) {
        this.slotCdTimers[5] = (this.slotCdTimers[5] || 0) + 400;
      }
      // 關鍵被動：天罰雷霆（對定罪暴擊 45% 機率落雷）
      if (ks === 'pk_divine_thunder' && isC && now < (m._statuses.conviction || 0) && Math.random() < 0.45 && m.hp > 0) {
        pv?.playSeq16('seq16_p_heaven_pillar', m.sprite.x, m.sprite.y - 32, 0.72, 24, 18);
        m._statuses.shock = Math.max(m._statuses.shock || 0, now + 5000);
        this.damageMonster(m, Math.round(stats.atk * 1.40), false, false, '#38bdf8', '⚡天罰 ');
      }
      if (m.hp <= 0 && (stList.includes('conviction') || Math.random() < 0.35)) {
        this.spawnPaladinLightOrb(m.sprite.x, m.sprite.y);
      }
      return true;
    };

    const _aoe = (cx, cy, rad, mult, col, pre, stList = [], forceCrit = false, extraFlat = 0, stunMs = 0) => {
      let hits = 0;
      const effRad = rad * areaMult;
      for (const m of [...this.monsters]) {
        if (!m || m.hp <= 0) continue;
        if (Phaser.Math.Distance.Between(cx, cy, m.sprite.x, m.sprite.y) <= effRad) {
          if (hitMonster(m, mult, col, pre, stList, forceCrit, extraFlat, stunMs)) hits++;
        }
      }
      return hits;
    };

    const _cone = (ox, oy, ang, rad, halfArcRad, mult, col, pre, stList = [], extraFlat = 0, stunMs = 0) => {
      let hits = 0;
      const effRad = rad * areaMult;
      for (const m of [...this.monsters]) {
        if (!m || m.hp <= 0) continue;
        const d = Phaser.Math.Distance.Between(ox, oy, m.sprite.x, m.sprite.y);
        if (d > effRad) continue;
        const mAng = Phaser.Math.Angle.Between(ox, oy, m.sprite.x, m.sprite.y);
        if (Math.abs(Phaser.Math.Angle.Wrap(mAng - ang)) <= halfArcRad || d < 46) {
          if (hitMonster(m, mult, col, pre, stList, false, extraFlat, stunMs)) hits++;
        }
      }
      return hits;
    };

    const _rect = (ox, oy, ang, length, halfWidth, multFn, col, pre, stList = [], extraFlat = 0, stunMs = 0) => {
      let hits = 0;
      const cosA = Math.cos(ang), sinA = Math.sin(ang);
      for (const m of [...this.monsters]) {
        if (!m || m.hp <= 0) continue;
        const dx = m.sprite.x - ox, dy = m.sprite.y - oy;
        const proj = dx * cosA + dy * sinA;
        const perp = Math.abs(-dx * sinA + dy * cosA);
        if (proj >= -24 && proj <= length && perp <= halfWidth * areaMult) {
          const mult = typeof multFn === 'function' ? multFn(m) : multFn;
          if (hitMonster(m, mult, col, pre, stList, false, extraFlat, stunMs)) hits++;
        }
      }
      return hits;
    };

    // ===================== [1] 基礎回聖能技能（4 招） =====================
    if (skillId === 'p_smite_lash') {
      pv?.playSeq16('seq16_p_holy_slash', _hx + Math.cos(baseAng) * 58, _hy + Math.sin(baseAng) * 44, 0.92, 24, 16, baseAng);
      pv?.spawnDebrisBurst(_tx, _ty, 'holy', 5);
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 18);
      _cone(_hx, _hy, baseAng, 210, Phaser.Math.DegToRad(58), (148 + skillLvl * 22) / 100, '#fde047', '✨', ['conviction']);
      addHolyMark(1, _tx, _ty);
      return;
    }
    if (skillId === 'p_zeal_strike') {
      const segMult = (52 + skillLvl * 7.5) / 100;
      for (let s = 0; s < 3; s++) {
        this.time.delayedCall(s * 110, () => {
          if (!this.hero?.active) return;
          const a = baseAng + (s - 1) * 0.28;
          pv?.playSeq16('seq16_p_holy_slash', this.hero.x + Math.cos(a) * 52, this.hero.y + Math.sin(a) * 38, 0.80, 26, 16, a);
          _cone(this.hero.x, this.hero.y, a, 165, Phaser.Math.DegToRad(55), segMult, '#fef08a', '⚔️狂熱 ', ['conviction']);
          this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 7);
          addHolyMark(1, _tx, _ty);
        });
      }
      return;
    }
    if (skillId === 'p_holy_bolt') {
      const ex = _hx + Math.cos(baseAng) * 500, ey = _hy + Math.sin(baseAng) * 500;
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 16);
      pv?.launchProjectile('proj_p_holy_bolt', _hx, _hy, ex, ey, 0.52, 210, false, 'holy', () => {
        const hits = _rect(_hx, _hy, baseAng, 520, 48, (138 + skillLvl * 20) / 100, '#fef08a', '🏹聖箭 ', ['conviction']);
        if (hits > 0) this.healHero(Math.round(this.playerMaxHp * 0.03));
        addHolyMark(1, _tx, _ty);
      });
      return;
    }
    if (skillId === 'p_justice_hammer') {
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 18);
      pv?.launchProjectile('proj_p_justice_hammer', _hx, _hy, _tx, _ty, 0.44, 210, true, 'holy', () => {
        _aoe(_tx, _ty, 130, (132 + skillLvl * 18) / 100, '#fde047', '🔨正義 ', ['conviction']);
        for (const offset of [-0.45, 0.45]) {
          const sx = _tx + Math.cos(baseAng + offset) * 180, sy = _ty + Math.sin(baseAng + offset) * 180;
          pv?.launchProjectile('proj_p_holy_bolt', _tx, _ty, sx, sy, 0.36, 150, false, 'holy', () => {
            _aoe(sx, sy, 95, (62 + skillLvl * 10) / 100, '#fef08a', '✨', ['conviction']);
          });
        }
        addHolyMark(1, _tx, _ty);
      });
      return;
    }

    // ===================== [2] 核心耗聖能輸出（4 招） =====================
    if (skillId === 'blessed_hammer') {
      const baseCount = 3 + (skillLvl >= 4 ? 1 : 0) + (ks === 'pk_solar_zealot' ? 1 : 0);
      const mult = ((105 + skillLvl * 20) / 100) * zealotMult;
      pv?.spawnSummonPoof(_hx, _hy, 'holy');
      for (let i = 0; i < baseCount; i++) {
        this.spawnPaladinEntity('hammer', _hx, _hy, {
          durationMs: 3200,
          angle: (Math.PI * 2 * i) / baseCount,
          radius: 36,
          spiralSpeed: 4.9,
          expandRate: 64,
          dmgMult: mult,
        });
      }
      addHolyMark(1, _hx, _hy);
      return;
    }
    if (skillId === 'heaven_fist') {
      pv?.playSeq16('seq16_p_heaven_pillar', _tx, _ty - 36, 1.15, 20, 18);
      pv?.spawnGroundDecal('crater', _tx, _ty, 0.80, 1800);
      pv?.spawnDebrisBurst(_tx, _ty, 'thunder', 9);
      _aoe(_tx, _ty, 160, (218 + skillLvl * 36) / 100, '#fde047', '⚡天拳 ', ['conviction', 'shock']);
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6;
        const bx = _tx + Math.cos(a) * 260, by = _ty + Math.sin(a) * 260;
        pv?.launchProjectile('proj_p_holy_bolt', _tx, _ty, bx, by, 0.40, 185, false, 'thunder', () => {
          _aoe(bx, by, 92, (68 + skillLvl * 12) / 100, '#7dd3fc', '✨', ['conviction']);
        });
      }
      addHolyMark(2, _tx, _ty);
      return;
    }
    if (skillId === 'p_holy_lance') {
      const ex = _hx + Math.cos(baseAng) * 540, ey = _hy + Math.sin(baseAng) * 540;
      pv?.launchProjectile('proj_p_holy_lance', _hx, _hy, ex, ey, 0.66, 200, false, 'solar', () => {
        pv?.spawnGroundDecal('crater', _tx, _ty, 0.72, 1600);
      });
      _rect(_hx, _hy, baseAng, 560, 48, (m) => {
        const hasConv = now < (m._statuses?.conviction || 0);
        return ((245 + skillLvl * 38) / 100) * (hasConv ? 1.55 : 1.0);
      }, '#fde047', '🔱聖槍 ', ['conviction']);
      addHolyMark(1, _tx, _ty);
      return;
    }
    if (skillId === 'divine_storm') {
      pv?.playSeq16('seq16_p_divine_storm', _hx, _hy - 8, 1.32 * areaMult, 22, 14);
      pv?.spawnDebrisBurst(_hx, _hy, 'holy', 10);
      const hits = _aoe(_hx, _hy, 260, (182 + skillLvl * 32) / 100, '#fde047', '🌟風暴 ', ['conviction']);
      if (hits > 0) {
        this.healHero(Math.round(this.playerMaxHp * Math.min(0.24, hits * 0.03)));
        this.playerMp = Math.min(this.playerMaxMp, this.playerMp + hits * 3);
      }
      addHolyMark(1, _hx, _hy);
      return;
    }

    // ===================== [3] 防禦技能（4 招） =====================
    if (skillId === 'holy_aegis') {
      pv?.spawnGroundDecal('aegis', _hx, _hy, 0.96, 4800);
      pv?.playSeq16('seq16_p_thorns_burst', _hx, _hy - 8, 1.05, 20, 14);
      const shieldVal = Math.round(this.playerMaxHp * ((42 + skillLvl * 6) / 100));
      this.mageShieldHp = Math.max(this.mageShieldHp || 0, shieldVal);
      this._paladinAegisUntil = now + 5000;
      this.spawnFloatingText(_hx, _hy - 90, `🛡️聖光神盾 +${shieldVal}`, '#fef08a', 14);
      _aoe(_hx, _hy, 195, 0.65, '#fde047', '🛡️反傷 ', ['conviction'], false, (stats.armor || 20) * ((85 + skillLvl * 18) / 100));
      return;
    }
    if (skillId === 'p_redemption_prayer') {
      pv?.spawnGroundDecal('aegis', _hx, _hy, 1.08, 2400);
      pv?.playSeq16('seq16_p_divine_storm', _hx, _hy - 10, 1.15, 20, 16);
      const healVal = Math.round(this.playerMaxHp * ((35 + skillLvl * 3) / 100));
      this.healHero(healVal);
      this.spawnFloatingText(_hx, _hy - 92, `🕊️救贖 +${healVal}`, '#4ade80', 15);
      _aoe(_hx, _hy, 240, (165 + skillLvl * 25) / 100, '#fef08a', '🕊️淨化 ', ['conviction']);
      return;
    }
    if (skillId === 'shield_bash') {
      const nx = Phaser.Math.Clamp(_hx + Math.cos(baseAng) * 140, 80, 1120);
      const ny = Phaser.Math.Clamp(_hy + Math.sin(baseAng) * 105, 80, 640);
      this.tweens.add({ targets: this.hero, x: nx, y: ny, duration: 150, ease: 'Cubic.easeOut' });
      pv?.playSeq16('seq16_p_shield_bash', nx + Math.cos(baseAng) * 32, ny + Math.sin(baseAng) * 24, 1.08, 22, 16, baseAng);
      pv?.spawnDebrisBurst(nx, ny, 'holy', 8);
      const armorDmg = (stats.armor || 20) * ((65 + skillLvl * 10) / 100);
      _rect(_hx, _hy, baseAng, 270, 58, (160 + skillLvl * 28) / 100, '#fde047', '🛡️盾擊 ', ['conviction'], armorDmg, 1000);
      addHolyMark(1, nx, ny);
      return;
    }
    if (skillId === 'p_sanctuary_ward') {
      pv?.spawnGroundDecal('sanctuary', _hx, _hy, 1.18, 5000);
      pv?.spawnSummonPoof(_hx, _hy, 'sanctuary');
      this._paladinSanctuaryUntil = now + 5000;
      const armorMult = (120 + skillLvl * 22) / 100;
      for (let w = 0; w < 4; w++) {
        this.time.delayedCall(w * 1150, () => {
          pv?.playSeq16('seq16_p_thorns_burst', _hx, _hy - 6, 0.92, 22, 14);
          _aoe(_hx, _hy, 230, 0.72, '#60a5fa', '💠聖域 ', ['conviction'], false, (stats.armor || 20) * armorMult);
        });
      }
      return;
    }

    // ===================== [4] 懲戒／機動技能（4 招） =====================
    if (skillId === 'p_crusader_charge') {
      const dist = Math.min(340, Math.max(150, Phaser.Math.Distance.Between(_hx, _hy, _tx, _ty)));
      const nx = Phaser.Math.Clamp(_hx + Math.cos(baseAng) * dist, 80, 1120);
      const ny = Phaser.Math.Clamp(_hy + Math.sin(baseAng) * dist, 80, 640);
      this.tweens.add({ targets: this.hero, x: nx, y: ny, duration: 220, ease: 'Cubic.easeOut' });
      pv?.playSeq16('seq16_p_shield_bash', nx, ny - 6, 1.18, 22, 16, baseAng);
      for (let seg = 1; seg <= 4; seg++) {
        const sx = _hx + ((nx - _hx) * seg) / 4;
        const sy = _hy + ((ny - _hy) * seg) / 4;
        pv?.spawnGroundDecal('crater', sx, sy, 0.62, 2200);
      }
      _rect(_hx, _hy, baseAng, dist + 60, 62, (215 + skillLvl * 32) / 100, '#fbbf24', '✝️衝鋒 ', ['burn', 'conviction']);
      addHolyMark(2, nx, ny);
      return;
    }
    if (skillId === 'judgment') {
      pv?.playSeq16('seq16_p_judgment_cross', _tx, _ty - 16, 1.24, 20, 18);
      pv?.spawnGroundDecal('crater', _tx, _ty, 0.96, 2200);
      pv?.spawnDebrisBurst(_tx, _ty, 'solar', 10);
      const hits = _aoe(_tx, _ty, 215, (240 + skillLvl * 42) / 100, '#fde047', '✝️審判 ', ['conviction'], false, 0, 1500);
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + hits * 4);
      addHolyMark(2, _tx, _ty);
      return;
    }
    if (skillId === 'p_condemn_pull') {
      pv?.playSeq16('seq16_p_condemn_vortex', _hx, _hy - 8, 1.35 * areaMult, 16, 16);
      for (const m of [...this.monsters]) {
        if (!m || m.hp <= 0 || !m.sprite?.active) continue;
        if (Phaser.Math.Distance.Between(_hx, _hy, m.sprite.x, m.sprite.y) <= 280 * areaMult) {
          this.tweens.add({
            targets: m.sprite,
            x: _hx + (Math.random() - 0.5) * 56,
            y: _hy + (Math.random() - 0.5) * 44,
            duration: 320,
            ease: 'Cubic.easeIn',
          });
        }
      }
      this.time.delayedCall(750, () => {
        if (!this.hero?.active) return;
        pv?.playSeq16('seq16_p_heaven_pillar', this.hero.x, this.hero.y - 34, 1.12, 22, 18);
        pv?.spawnDebrisBurst(this.hero.x, this.hero.y, 'thunder', 12);
        _aoe(this.hero.x, this.hero.y, 260, (238 + skillLvl * 38) / 100, '#38bdf8', '🌀天譴 ', ['vulnerable', 'conviction', 'shock']);
        addHolyMark(2, this.hero.x, this.hero.y);
      });
      return;
    }
    if (skillId === 'p_falling_sword') {
      const nx = Phaser.Math.Clamp(_tx, 90, 1110), ny = Phaser.Math.Clamp(_ty, 90, 630);
      this.tweens.add({ targets: this.hero, x: nx, y: ny, duration: 220, ease: 'Cubic.easeIn' });
      this.time.delayedCall(180, () => {
        pv?.playSeq16('seq16_p_verdict_sword', nx, ny - 28, 1.05, 22, 18);
        pv?.spawnGroundDecal('crater', nx, ny, 1.04, 2400);
        pv?.spawnDebrisBurst(nx, ny, 'solar', 12);
        _aoe(nx, ny, 240, (265 + skillLvl * 44) / 100, '#fb923c', '☄️天劍 ', ['burn', 'conviction'], false, 0, 1200);
        addHolyMark(2, nx, ny);
      });
      return;
    }

    // ===================== [5] 精通／光環召喚技能（4 招） =====================
    if (skillId === 'consecration') {
      pv?.spawnGroundDecal('consecration', _hx, _hy, 1.24 * areaMult, 4000);
      for (let w = 0; w < 4; w++) {
        this.time.delayedCall(w * 980, () => {
          pv?.spawnDebrisBurst(_hx, _hy, 'solar', 6);
          _aoe(_hx, _hy, 250, (82 + skillLvl * 16) / 100, '#fbbf24', '🔥奉獻 ', ['burn', 'conviction']);
          this.healHero(Math.round(this.playerMaxHp * ((3.5 + skillLvl * 0.8) / 100)));
        });
      }
      return;
    }
    if (skillId === 'radiant_aura') {
      pv?.playSeq16('seq16_p_divine_storm', _hx, _hy - 8, 1.15, 22, 14);
      pv?.spawnDebrisBurst(_hx, _hy, 'holy', 9);
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 28);
      this._paladinRadiantUntil = now + 4500;
      _aoe(_hx, _hy, 240, (138 + skillLvl * 24) / 100, '#fef08a', '☀️懲戒 ', ['conviction']);
      return;
    }
    if (skillId === 'p_thorns_aura') {
      pv?.playSeq16('seq16_p_thorns_burst', _hx, _hy - 8, 1.24 * areaMult, 20, 16);
      pv?.spawnDebrisBurst(_hx, _hy, 'solar', 10);
      _aoe(_hx, _hy, 250, (180 + skillLvl * 28) / 100, '#fbbf24', '🛡️荊棘 ', ['vulnerable', 'conviction'], false, (stats.armor || 20) * 2.8);
      addHolyMark(1, _hx, _hy);
      return;
    }
    if (skillId === 'p_solar_beacon') {
      const bx = Phaser.Math.Clamp(_tx, 100, 1100), by = Phaser.Math.Clamp(_ty, 100, 620);
      pv?.spawnGroundDecal('consecration', bx, by, 0.85, 8000);
      this.spawnPaladinEntity('solar_banner', bx, by, {
        durationMs: 8000,
        tickIntervalMs: 1800,
        dmgMult: (135 + skillLvl * 22) / 100,
      });
      if (ks === 'pk_solar_zealot') {
        this.spawnPaladinEntity('solar_banner', Phaser.Math.Clamp(bx + 75, 100, 1100), by, {
          durationMs: 8000,
          tickIntervalMs: 1800,
          dmgMult: (110 + skillLvl * 18) / 100,
        });
      }
      return;
    }

    // ===================== [6] 終極奧義（4 招） =====================
    if (skillId === 'p_seraph_descent') {
      this.healHero(Math.round(this.playerMaxHp * 0.30));
      this.spawnPaladinEntity('seraph_wing', _hx, _hy - 24, { durationMs: 4200, scale: 0.80 });
      pv?.spawnGroundDecal('aegis', _hx, _hy, 1.28, 4000);
      for (let w = 0; w < 4; w++) {
        this.time.delayedCall(w * 820, () => {
          const tgt = this.findNearestMonster(this.hero?.x || _hx, this.hero?.y || _hy);
          const px = tgt ? tgt.sprite.x : (this.hero?.x || _hx) + (Math.random() - 0.5) * 160;
          const py = tgt ? tgt.sprite.y : (this.hero?.y || _hy) + (Math.random() - 0.5) * 120;
          pv?.playSeq16('seq16_p_heaven_pillar', px, py - 38, 1.24, 20, 20);
          pv?.spawnDebrisBurst(px, py, 'holy', 10);
          _aoe(px, py, 240, (185 + skillLvl * 30) / 100, '#fef08a', '👼熾天使 ', ['conviction', 'burn']);
        });
      }
      addHolyMark(3, _hx, _hy);
      return;
    }
    if (skillId === 'p_heavens_verdict') {
      pv?.playSeq16('seq16_p_verdict_sword', _tx, _ty - 36, 1.48, 18, 22);
      pv?.spawnGroundDecal('crater', _tx, _ty, 1.26, 3000);
      pv?.spawnDebrisBurst(_tx, _ty, 'thunder', 16);
      _aoe(_tx, _ty, 320, (390 + skillLvl * 55) / 100, '#fde047', '⚔️天罰巨劍 ', ['conviction', 'shock'], true, 0, 1400);
      // 引爆全場已帶定罪或感電目標
      for (const m of [...this.monsters]) {
        if (!m || m.hp <= 0) continue;
        if (now < (m._statuses?.conviction || 0) || now < (m._statuses?.shock || 0)) {
          pv?.playSeq16('seq16_p_judgment_cross', m.sprite.x, m.sprite.y - 14, 0.85, 22, 18);
          this.damageMonster(m, Math.round(stats.atk * 1.45), true, false, '#38bdf8', '⚡引爆 ');
        }
      }
      this.spawnPaladinLightOrb(_tx, _ty);
      return;
    }
    if (skillId === 'p_valkyrie_avatar') {
      const count = ks === 'pk_solar_zealot' ? 2 : 1;
      for (let i = 0; i < count; i++) {
        this.spawnPaladinEntity('valkyrie', _hx + (i === 0 ? 52 : -52), _hy + 12, {
          durationMs: 10000,
          tickIntervalMs: 920,
          dmgMult: (165 + skillLvl * 28) / 100,
        });
      }
      this._paladinValkyrieUntil = now + 10000;
      this.spawnFloatingText(_hx, _hy - 94, '👼英靈聖衛降臨！', '#fef08a', 15);
      return;
    }
    if (skillId === 'p_akarats_wrath') {
      this._paladinAkaratUntil = now + 8000;
      this._paladinAkaratNextHammer = now + 200;
      this._paladinAkaratHammerMult = (115 + skillLvl * 22) / 100;
      this.spawnPaladinEntity('seraph_wing', _hx, _hy - 24, { durationMs: 8000, scale: 0.78 });
      pv?.playSeq16('seq16_p_divine_storm', _hx, _hy - 10, 1.38, 20, 18);
      pv?.spawnGroundDecal('consecration', _hx, _hy, 1.15, 3600);
      this.spawnFloatingText(_hx, _hy - 96, '🔥神聖化身（8秒）！', '#fbbf24', 16);
      _aoe(_hx, _hy, 250, 1.85, '#fde047', '🔥化身 ', ['conviction', 'burn']);
      return;
    }

    // 兜底相容
    pv?.playSeq16('seq16_p_judgment_cross', _tx, _ty - 12, 1.0, 20, 16);
    _aoe(_tx, _ty, 210, 1.8, '#fde047', '✨', ['conviction']);
  },
};
