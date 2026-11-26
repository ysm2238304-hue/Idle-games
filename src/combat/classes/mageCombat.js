// v266: MAGE 職業獨立戰鬥模組（抽離自 BattleScene.js，透過 prototype 零開銷掛接）
const MAP_W = 4096;
const MAP_H = 2304;

export const mageCombatMethods = {
  castMageSkill(skillId, skillLvl, stats, isManual = false) {
    const _hx = this.hero.x, _hy = this.hero.y;
    const _n = this.findNearestMonster(_hx, _hy);
    const _tx = _n ? _n.sprite.x : _hx + 160, _ty = _n ? _n.sprite.y : _hy;
    const _aoe = (cx, cy, rad, mult, col, pre, stList = [], forceCrit = false) => {
      for (const m of [...this.monsters]) {
        if (!m || m.hp <= 0) continue;
        if (Phaser.Math.Distance.Between(cx, cy, m.sprite.x, m.sprite.y) <= rad) {
          const isC = forceCrit || (Math.random() * 100 < stats.critRate);
          const d = Math.round(stats.atk * mult * (isC ? stats.critDmg / 100 : 1));
          if (!m._statuses) m._statuses = {};
          stList.forEach((k) => { m._statuses[k] = Math.max(m._statuses[k] || 0, this.time.now + 4800); });
          this.damageMonster(m, d, isC, false, col, pre);
        }
      }
    };
    const _d4Mult = this.getMageD4LiveMult();
    const _aoeD4 = (cx, cy, rad, mul, col, pre, stList = [], forceC = false) => {
      const elem = stList.includes('freeze') ? 'frost' : (stList.includes('shock') ? 'shock' : 'fire');
      const tintHex = elem === 'frost' ? 0x7dd3fc : (elem === 'shock' ? 0xc084fc : 0xfb923c);
      const hitSeq = elem === 'frost' ? 'anim_m_frost_nova' : (elem === 'shock' ? 'anim_m_lightning_strike' : 'anim_m_fireball_blast');
      let sparkBudget = 3;
      this.monsters.forEach((m) => {
        if (m.hp > 0 && m.sprite && Phaser.Math.Distance.Between(cx, cy, m.sprite.x, m.sprite.y) <= rad) {
          m.sprite.setTint(tintHex);
          this.time.delayedCall(110, () => m.sprite && m.sprite.active && m.sprite.clearTint());
          if (sparkBudget > 0) {
            sparkBudget--;
            this.mageVfx?.spawnDebrisBurst(m.sprite.x, m.sprite.y, elem, forceC ? 7 : 4);
          }
        }
      });
      _aoe(cx, cy, rad, mul * _d4Mult, col, pre, stList, forceC);
    };
    const mv = this.mageVfx;
    const _pickPrimary = () => this.findNearestMonster(_tx, _ty, 360) || this.findNearestMonster(_hx, _hy, 560);
    const _applyHitVisual = (m, elem, forceC) => {
      if (!m || m.hp <= 0 || !m.sprite) return;
      const tintHex = elem === 'frost' ? 0x7dd3fc : (elem === 'shock' ? 0xc084fc : 0xfb923c);
      m.sprite.setTint(tintHex);
      this.time.delayedCall(110, () => m.sprite && m.sprite.active && m.sprite.clearTint());
      mv?.spawnDebrisBurst(m.sprite.x, m.sprite.y, elem, forceC ? 7 : 4);
    };

    // 幾何 1：精準單體判定（絕不亂濺射，高單體倍率專打首領與精英）
    const _singleD4 = (m, mul, col, pre, stList = [], forceC = false) => {
      if (!m || m.hp <= 0 || !m.sprite) return;
      const elem = stList.includes('freeze') ? 'frost' : (stList.includes('shock') ? 'shock' : 'fire');
      const isC = forceC || Math.random() * 100 < stats.critChance;
      const d = Math.max(1, Math.round(stats.atk * mul * _d4Mult * (isC ? stats.critDmg / 100 : 1)));
      if (!m._statuses) m._statuses = {};
      stList.forEach((k) => { m._statuses[k] = Math.max(m._statuses[k] || 0, this.time.now + 4800); });
      _applyHitVisual(m, elem, isC);
      this.damageMonster(m, d, isC, false, col, pre);
    };

    // 幾何 2：前方扇形揮斬判定（電弧鞭 130° 近戰扇形）
    const _coneD4 = (ox, oy, dirAng, rad, halfAng, mul, col, pre, stList = []) => {
      const elem = stList.includes('freeze') ? 'frost' : (stList.includes('shock') ? 'shock' : 'fire');
      for (const m of this.monsters) {
        if (!m || m.hp <= 0 || !m.sprite) continue;
        const dist = Phaser.Math.Distance.Between(ox, oy, m.sprite.x, m.sprite.y);
        if (dist > rad) continue;
        const ang = Phaser.Math.Angle.Between(ox, oy, m.sprite.x, m.sprite.y);
        const diff = Math.abs(Phaser.Math.Angle.Wrap(ang - dirAng));
        if (diff <= halfAng || dist < 56) {
          const isC = Math.random() * 100 < stats.critChance;
          const d = Math.max(1, Math.round(stats.atk * mul * _d4Mult * (isC ? stats.critDmg / 100 : 1)));
          if (!m._statuses) m._statuses = {};
          stList.forEach((k) => { m._statuses[k] = Math.max(m._statuses[k] || 0, this.time.now + 4800); });
          _applyHitVisual(m, elem, isC);
          this.damageMonster(m, d, isC, false, col, pre);
        }
      }
    };

    // 幾何 3：矩形火道判定（烈焰火牆 320x96px）
    const _rectD4 = (cx, cy, halfW, halfH, mul, col, pre, stList = []) => {
      for (const m of this.monsters) {
        if (!m || m.hp <= 0 || !m.sprite) continue;
        if (Math.abs(m.sprite.x - cx) <= halfW && Math.abs(m.sprite.y - cy) <= halfH) {
          const isC = Math.random() * 100 < stats.critChance;
          const d = Math.max(1, Math.round(stats.atk * mul * _d4Mult * (isC ? stats.critDmg / 100 : 1)));
          if (!m._statuses) m._statuses = {};
          stList.forEach((k) => { m._statuses[k] = Math.max(m._statuses[k] || 0, this.time.now + 4800); });
          _applyHitVisual(m, 'fire', isC);
          this.damageMonster(m, d, isC, false, col, pre);
        }
      }
    };

    // 幾何 4：真實連鎖彈跳判定（英雄→怪 A→怪 B→C，單體首領時反覆彈跳）
    const _chainD4 = (bounces, baseMul, col, pre, stList = []) => {
      const first = _pickPrimary();
      if (!first || !first.sprite) return;
      let curX = _hx, curY = _hy - 14;
      let curTgt = first;
      const visited = new Set();
      for (let b = 0; b < bounces; b++) {
        if (!curTgt || curTgt.hp <= 0 || !curTgt.sprite) break;
        const sx0 = curX, sy0 = curY;
        const tgtSnap = curTgt;
        const mulSnap = baseMul * Math.pow(0.92, b);
        visited.add(tgtSnap.uid);
        curX = tgtSnap.sprite.x;
        curY = tgtSnap.sprite.y - 10;

        this.time.delayedCall(b * 60, () => {
          if (!tgtSnap.sprite) return;
          mv?.playChainArc(sx0, sy0, tgtSnap.sprite.x, tgtSnap.sprite.y - 10, 0.46, 230);
          mv?.playSeq16('seq16_m_ball_lightning', tgtSnap.sprite.x, tgtSnap.sprite.y - 8, 0.58, 24, 16);
          if (tgtSnap.hp > 0) _singleD4(tgtSnap, mulSnap, col, pre, stList, b === 0);
        });

        // 找下一名最近的未命中敵人；若只剩單體首領則反彈回英雄再打同一目標
        const nextList = this.monsters
          .filter((m) => m.hp > 0 && m.sprite && !visited.has(m.uid) && Phaser.Math.Distance.Between(curX, curY, m.sprite.x, m.sprite.y) <= 320)
          .sort((a, b2) => Phaser.Math.Distance.Between(curX, curY, a.sprite.x, a.sprite.y) - Phaser.Math.Distance.Between(curX, curY, b2.sprite.x, b2.sprite.y));
        if (nextList.length > 0) {
          curTgt = nextList[0];
        } else if (tgtSnap.hp > 0) {
          // 單體首領反彈：從英雄再次射回首領
          curX = _hx; curY = _hy - 14;
          curTgt = tgtSnap;
        } else {
          break;
        }
      }
    };

    // 幾何 5：真實聚怪牽引（煉獄／黑洞把周圍非首領怪拉向中心）
    const _pullVortex = (cx, cy, rad, pullPx = 42) => {
      for (const m of this.monsters) {
        if (!m || m.hp <= 0 || !m.sprite || m.isBoss) continue;
        const dist = Phaser.Math.Distance.Between(cx, cy, m.sprite.x, m.sprite.y);
        if (dist > 28 && dist <= rad) {
          const ang = Phaser.Math.Angle.Between(m.sprite.x, m.sprite.y, cx, cy);
          const step = Math.min(pullPx, dist - 22);
          m.sprite.x += Math.cos(ang) * step;
          m.sprite.y += Math.sin(ang) * step;
        }
      }
    };

    if (skillId === 'm_fire_bolt') {
      this.registerEnlightenment('fire');
      const tgt = _pickPrimary();
      const ex = tgt?.sprite?.x ?? _tx, ey = tgt?.sprite?.y ?? _ty;
      mv.launchProjectile('proj_m_fire_bolt', _hx, _hy - 14, ex, ey - 10, 0.56, 175, 'fire', () => {
        mv.playSeq16('seq16_m_fireball_blast', ex, ey - 8, 0.65, 24, 14);
        _singleD4(tgt, (175 + skillLvl * 26) / 100, '#fb923c', '🔥', ['burn']);
      });
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 22);
      return;
    }
    if (skillId === 'm_frost_bolt') {
      this.registerEnlightenment('frost');
      const tgt = _pickPrimary();
      const ex = tgt?.sprite?.x ?? _tx, ey = tgt?.sprite?.y ?? _ty;
      mv.launchProjectile('proj_m_ice_lance', _hx, _hy - 14, ex, ey - 10, 0.52, 170, 'frost', () => {
        mv.playSeq16('seq16_m_frost_nova', ex, ey - 8, 0.62, 24, 14);
        _singleD4(tgt, (168 + skillLvl * 25) / 100, '#7dd3fc', '❄️', ['freeze']);
      });
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 22);
      return;
    }
    if (skillId === 'm_arc_lash') {
      this.registerEnlightenment('shock');
      const dirAng = Phaser.Math.Angle.Between(_hx, _hy, _tx, _ty);
      const cx = _hx + Math.cos(dirAng) * 90, cy = _hy + Math.sin(dirAng) * 70;
      mv.playChainArc(_hx, _hy - 12, cx + Math.cos(dirAng + 0.6) * 75, cy + Math.sin(dirAng + 0.6) * 55, 0.44, 210);
      mv.playChainArc(_hx, _hy - 12, cx + Math.cos(dirAng - 0.6) * 75, cy + Math.sin(dirAng - 0.6) * 55, 0.44, 210);
      mv.playSeq16('seq16_m_lightning_strike', cx, cy - 10, 0.85, 24, 16);
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 20);
      this.slotCdTimers = this.slotCdTimers.map((t) => t + 420);
      _coneD4(_hx, _hy, dirAng, 235, 1.15, (168 + skillLvl * 25) / 100, '#c084fc', '⚡電弧鞭 ', ['shock']);
      if (Math.random() < 0.45) this.spawnCracklingOrb(cx, cy);
      return;
    }
    if (skillId === 'm_spark') {
      this.registerEnlightenment('shock');
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 20);
      _chainD4(3, (118 + skillLvl * 18) / 100, '#60a5fa', '✦電花 ', ['shock']);
      if (Math.random() < 0.65) this.spawnCracklingOrb(_tx, _ty);
      return;
    }
    if (skillId === 'm_fireball') {
      this.registerEnlightenment('fire');
      const tgt = _pickPrimary();
      const ex = tgt?.sprite?.x ?? _tx, ey = tgt?.sprite?.y ?? _ty;
      mv.launchProjectile('proj_m_fireball', _hx, _hy - 14, ex, ey - 10, 0.64, 200, 'fire', () => {
        mv.spawnGroundDecal('fire', ex, ey, 0.82, 1750);
        mv.playSeq16('seq16_m_fireball_blast', ex, ey - 10, 1.32, 20, 16);
        mv.spawnDebrisBurst(ex, ey, 'fire', 9);
        _aoeD4(ex, ey, 215, (255 + skillLvl * 38) / 100, '#fb923c', '🔥火球 ', ['burn']);
      });
      return;
    }
    if (skillId === 'm_ice_shards') {
      this.registerEnlightenment('frost');
      const tgt = _pickPrimary();
      for (let w = 0; w < 3; w++) {
        this.time.delayedCall(w * 135, () => {
          const curT = (tgt && tgt.hp > 0) ? tgt : _pickPrimary();
          if (!curT || !curT.sprite) return;
          const ex = curT.sprite.x, ey = curT.sprite.y;
          mv.launchProjectile('proj_m_ice_lance', _hx, _hy - 12, ex, ey - 10, 0.56, 165, 'frost', () => {
            mv.playSeq16('seq16_m_frost_nova', ex, ey - 6, 0.58, 24, 14);
            const wasFrozen = (curT._statuses?.freeze || 0) > this.time.now || (curT.chilledUntil || 0) > this.time.now;
            _singleD4(curT, (108 + skillLvl * 16) / 100, '#38bdf8', '🧊冰片 ', ['freeze', 'vulnerable']);
            // 暗黑 4 冰片規則：命中凍結目標時自動彈射 1 枚冰片至鄰近敵人
            if (wasFrozen) {
              const near = this.monsters.find((m) => m.hp > 0 && m !== curT && m.sprite && Phaser.Math.Distance.Between(ex, ey, m.sprite.x, m.sprite.y) <= 260);
              if (near && near.sprite) {
                mv.launchProjectile('proj_m_ice_lance', ex, ey - 10, near.sprite.x, near.sprite.y - 10, 0.45, 130, 'frost', () => {
                  _singleD4(near, (88 + skillLvl * 12) / 100, '#7dd3fc', '🧊彈射 ', ['freeze']);
                });
              }
            }
          });
        });
      }
      return;
    }
    if (skillId === 'm_frozen_orb') {
      this.registerEnlightenment('frost');
      mv.launchFrozenOrb(
        _hx, _hy, _tx, _ty,
        (mx, my) => {
          const midTgt = this.findNearestMonster(mx, my, 240);
          if (midTgt) _singleD4(midTgt, (105 + skillLvl * 15) / 100, '#7dd3fc', '❄️冰刺 ', ['freeze']);
        },
        () => {
          _aoeD4(_tx, _ty, 265, (180 + skillLvl * 24) / 100, '#38bdf8', '💥冰球碎裂 ', ['freeze', 'vulnerable'], true);
        }
      );
      return;
    }
    if (skillId === 'm_flame_shield') {
      this.registerEnlightenment('fire');
      this.activateHeroBarrier(Math.round(this.playerMaxHp * 0.38), 5500, 'ent_m_flame_shield');
      mv.spawnGroundDecal('fire', _hx, _hy, 0.72, 1400);
      mv.playSeq16('seq16_m_inferno', _hx, _hy - 12, 1.05, 20, 16);
      this.healHero(Math.round(this.playerMaxHp * ((22 + skillLvl * 2) / 100)));
      _aoeD4(_hx, _hy, 230, (175 + skillLvl * 26) / 100, '#fb923c', '🔥烈焰護盾 ', ['burn']);
      return;
    }
    if (skillId === 'm_ice_armor') {
      this.registerEnlightenment('frost');
      this.activateHeroBarrier(Math.round(this.playerMaxHp * 0.45), 6500, 'ent_m_ice_armor');
      mv.spawnGroundDecal('frost', _hx, _hy, 0.72, 1400);
      mv.playSeq16('seq16_m_frost_nova', _hx, _hy - 8, 1.02, 20, 16);
      this.healHero(Math.round(this.playerMaxHp * ((24 + skillLvl * 2) / 100)));
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 30);
      _aoeD4(_hx, _hy, 230, (158 + skillLvl * 24) / 100, '#38bdf8', '🧊寒冰護甲 ', ['freeze']);
      return;
    }
    if (skillId === 'm_arcane_blink') {
      this.registerEnlightenment('shock');
      // 真實傳送閃現：將英雄座標瞬移至目標側翼安全點！
      mv.spawnConjurationPoof(_hx, _hy, 'shock');
      mv.playSeq16('seq16_m_lightning_strike', _hx, _hy - 10, 0.85, 24, 14);
      const ang = Phaser.Math.Angle.Between(_hx, _hy, _tx, _ty);
      const dist = Math.min(260, Phaser.Math.Distance.Between(_hx, _hy, _tx, _ty));
      const destX = Phaser.Math.Clamp(_hx + Math.cos(ang) * Math.max(90, dist - 52), 140, MAP_W - 140);
      const destY = Phaser.Math.Clamp(_hy + Math.sin(ang) * Math.max(70, dist - 52), 140, MAP_H - 140);
      if (this.hero) {
        this.hero.setPosition(destX, destY);
        if (this.heroGroundShadow) this.heroGroundShadow.setPosition(destX, destY + 18);
        if (this.heroCastShadow) this.heroCastShadow.setPosition(destX, destY + 16);
      }
      mv.spawnGroundDecal('shock', destX, destY, 0.78, 1500);
      mv.playSeq16('seq16_m_lightning_strike', destX, destY - 14, 1.22, 22, 18);
      this.slotCdTimers = this.slotCdTimers.map((t) => t + 1000);
      _aoeD4(destX, destY, 220, (215 + skillLvl * 32) / 100, '#60a5fa', '⚡傳送閃現 ', ['shock', 'vulnerable']);
      this.spawnCracklingOrb(destX, destY);
      return;
    }
    if (skillId === 'm_flame_hydra') {
      this.registerEnlightenment('fire');
      const hx2 = _tx + Phaser.Math.Between(-35, 35), hy2 = _ty + Phaser.Math.Between(-25, 25);
      this.spawnMageConjuration('hydra', hx2, hy2, skillLvl, 10500);
      mv.spawnGroundDecal('fire', hx2, hy2, 0.65, 2400);
      mv.playSeq16('seq16_m_fireball_blast', hx2, hy2 - 8, 0.88, 22, 12);
      const tgt = _pickPrimary();
      if (tgt) _singleD4(tgt, (135 + skillLvl * 20) / 100, '#fb923c', '🐍多頭火蛇 ', ['burn']);
      return;
    }
    if (skillId === 'm_ice_blades') {
      this.registerEnlightenment('frost');
      this.spawnMageConjuration('ice_blades', _tx, _ty, skillLvl, 8500);
      mv.spawnGroundDecal('frost', _tx, _ty, 0.62, 1500);
      mv.playSeq16('seq16_m_frost_nova', _tx, _ty - 8, 0.85, 22, 12);
      this.slotCdTimers = this.slotCdTimers.map((t) => t + 500);
      const tgt = _pickPrimary();
      if (tgt) _singleD4(tgt, (145 + skillLvl * 20) / 100, '#7dd3fc', '⚔️寒冰之刃 ', ['freeze', 'vulnerable']);
      return;
    }
    if (skillId === 'm_lightning_spear') {
      this.registerEnlightenment('shock');
      this.spawnMageConjuration('lightning_spear', _tx, _ty, skillLvl, 8000);
      mv.spawnGroundDecal('shock', _tx, _ty, 0.68, 1500);
      _chainD4(2, (145 + skillLvl * 22) / 100, '#facc15', '⚡閃電長矛 ', ['shock']);
      this.spawnCracklingOrb(_tx, _ty);
      return;
    }
    if (skillId === 'm_familiar') {
      this.registerEnlightenment(['fire', 'frost', 'shock'][Math.floor(Math.random() * 3)]);
      this.spawnMageConjuration('familiar', _hx + Phaser.Math.Between(-45, 45), _hy - 26, skillLvl, 10000);
      mv.spawnGroundDecal('void', _tx, _ty, 0.68, 1500);
      mv.playSeq16('seq16_m_supernova', _tx, _ty - 10, 0.92, 20, 14);
      _aoeD4(_tx, _ty, 220, (130 + skillLvl * 18) / 100, '#fde047', '🔮元素使魔 ', ['burn', 'freeze', 'shock']);
      return;
    }
    if (skillId === 'm_firewall') {
      this.registerEnlightenment('fire');
      mv.spawnGroundDecal('fire', _tx, _ty, 1.05, 2400);
      mv.playSeq16('seq16_m_firewall', _tx, _ty - 6, 1.52, 12, -4);
      for (let w = 0; w < 4; w++) {
        this.time.delayedCall(w * 320, () => {
          _rectD4(_tx, _ty, 165, 52, (132 + skillLvl * 22) / 100, '#ef4444', '🔥烈焰火牆 ', ['burn']);
        });
      }
      return;
    }
    if (skillId === 'm_ball_lightning') {
      this.registerEnlightenment('shock');
      for (let w = 0; w < 3; w++) {
        this.time.delayedCall(w * 250, () => {
          const ox = _tx + Phaser.Math.Between(-42, 42), oy = _ty + Phaser.Math.Between(-30, 30);
          mv.playSeq16('seq16_m_ball_lightning', ox, oy - 8, 1.12, 18, 14);
          _aoeD4(ox, oy, 165, (118 + skillLvl * 18) / 100, '#a78bfa', '⚡球狀閃電 ', ['shock']);
        });
      }
      this.spawnCracklingOrb(_tx, _ty);
      return;
    }
    if (skillId === 'm_blizzard_field') {
      this.registerEnlightenment('frost');
      mv.spawnGroundDecal('frost', _tx, _ty, 1.15, 2300);
      mv.playSeq16('seq16_m_blizzard', _tx, _ty - 14, 1.55, 13, 18);
      for (let w = 0; w < 4; w++) {
        this.time.delayedCall(w * 300, () => {
          _aoeD4(_tx, _ty, 265, (118 + skillLvl * 20) / 100, '#7dd3fc', '❄️暴風雪 ', ['freeze']);
        });
      }
      return;
    }
    if (skillId === 'm_inferno') {
      this.registerEnlightenment('fire');
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + Math.round(this.playerMaxMp * 0.30));
      mv.spawnGroundDecal('fire', _tx, _ty, 1.28, 2500);
      mv.playSeq16('seq16_m_inferno', _tx, _ty - 18, 1.65, 13, 20);
      for (let w = 0; w < 5; w++) {
        this.time.delayedCall(w * 270, () => {
          _pullVortex(_tx, _ty, 330, 48);
          _aoeD4(_tx, _ty, 310, (182 + skillLvl * 30) / 100, '#fb923c', '🐍煉獄巨蛇 ', ['burn', 'vulnerable'], true);
        });
      }
      return;
    }
    if (skillId === 'm_deep_freeze') {
      this.registerEnlightenment('frost');
      // 真正進入 2.2 秒無敵冰封狀態！
      this.heroInvulnUntil = Math.max(this.heroInvulnUntil || 0, this.time.now + 2200);
      if (this.hero) {
        this.hero.setTint(0x7dd3fc);
        this.time.delayedCall(2200, () => this.hero && this.hero.active && this.hero.clearTint());
      }
      this.activateHeroBarrier(Math.round(this.playerMaxHp * 0.65), 6000, 'ent_m_ice_armor');
      this.healHero(Math.round(this.playerMaxHp * 0.35));
      this.slotCdTimers = this.slotCdTimers.map((t) => t + 4500);
      mv.spawnGroundDecal('frost', _hx, _hy, 1.25, 2200);
      mv.playSeq16('seq16_m_blizzard', _hx, _hy - 14, 1.62, 14, 18);
      for (let w = 0; w < 4; w++) {
        this.time.delayedCall(w * 500, () => {
          if (w === 3) {
            mv.playSeq16('seq16_m_frost_nova', _hx, _hy - 10, 1.65, 18, 20);
            mv.spawnDebrisBurst(_hx, _hy, 'frost', 12);
          }
          _aoeD4(_hx, _hy, 330, (128 + skillLvl * 18) / 100, '#38bdf8', '❄️深度凍結 ', ['freeze', 'vulnerable'], true);
        });
      }
      return;
    }
    if (skillId === 'm_unstable_currents') {
      this.registerEnlightenment('shock');
      mv.spawnGroundDecal('shock', _hx, _hy, 1.15, 2200);
      mv.playSeq16('seq16_m_ball_lightning', _hx, _hy - 12, 1.38, 18, 18);
      this.spawnMageConjuration('lightning_spear', _tx, _ty, skillLvl, 7500);
      this.spawnCracklingOrb(_tx - 30, _ty);
      this.spawnCracklingOrb(_tx + 30, _ty);
      for (let w = 0; w < 5; w++) {
        this.time.delayedCall(w * 240, () => {
          const ox = _tx + Phaser.Math.Between(-85, 85), oy = _ty + Phaser.Math.Between(-55, 55);
          if (w % 2 === 0) mv.playSeq16('seq16_m_lightning_strike', ox, oy - 16, 1.32, 22, 18);
          else mv.playSeq16('seq16_m_ball_lightning', ox, oy - 10, 1.25, 20, 18);
          _aoeD4(ox, oy, 280, (176 + skillLvl * 30) / 100, '#c084fc', '⚡不穩電流 ', ['shock', 'vulnerable'], true);
        });
      }
      return;
    }
    if (skillId === 'm_elemental_cataclysm') {
      this.registerEnlightenment('fire');
      this.registerEnlightenment('frost');
      this.registerEnlightenment('shock');
      mv.spawnGroundDecal('void', _tx, _ty, 1.25, 2400);
      mv.playSeq16('seq16_m_supernova', _tx, _ty - 12, 1.62, 15, 20);
      for (let w = 0; w < 4; w++) {
        this.time.delayedCall(w * 270, () => {
          if (w === 1) mv.playSeq16('seq16_m_meteor', _tx, _ty - 14, 1.45, 18, 18);
          if (w === 2) mv.playSeq16('seq16_m_frost_nova', _tx, _ty - 10, 1.45, 20, 18);
          if (w === 3) mv.playSeq16('seq16_m_lightning_strike', _tx, _ty - 16, 1.45, 22, 18);
          _aoeD4(_tx, _ty, 340, (185 + skillLvl * 32) / 100, '#e879f9', '🌀元素天災 ', ['burn', 'freeze', 'shock'], true);
        });
      }
      return;
    }
    if (skillId === 'm_astral_supernova') {
      this.registerEnlightenment('fire');
      this.registerEnlightenment('frost');
      this.registerEnlightenment('shock');
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + Math.round(this.playerMaxMp * 0.30));
      mv.spawnGroundDecal('void', _tx, _ty, 1.35, 2500);
      mv.playSeq16('seq16_m_supernova', _tx, _ty - 12, 1.75, 15, 22);
      mv.spawnDebrisBurst(_tx, _ty, 'shock', 12);
      _aoeD4(_tx, _ty, 360, (410 + skillLvl * 60) / 100, '#fde047', '🌟星界超新星 ', ['vulnerable', 'curse'], true);
      return;
    }
    if (skillId === 'meteor') {
      this.registerEnlightenment('fire');
      mv.playSeq16('seq16_m_meteor', _tx, _ty - 14, 1.58, 16, 18);
      this.time.delayedCall(320, () => {
        mv.spawnGroundDecal('fire', _tx, _ty, 1.15, 2200);
        mv.spawnDebrisBurst(_tx, _ty, 'fire', 12);
        _aoeD4(_tx, _ty, 250, (295 + skillLvl * 42) / 100, '#fb923c', '☄️隕石 ', ['burn', 'vulnerable'], true);
      });
      return;
    }
    if (skillId === 'frost_nova') {
      this.registerEnlightenment('frost');
      mv.spawnGroundDecal('frost', _hx, _hy, 1.05, 1900);
      mv.playSeq16('seq16_m_frost_nova', _hx, _hy - 8, 1.48, 20, 18);
      mv.spawnDebrisBurst(_hx, _hy, 'frost', 10);
      _aoeD4(_hx, _hy, 250, (195 + skillLvl * 28) / 100, '#38bdf8', '❄️冰霜新星 ', ['freeze', 'vulnerable']);
      return;
    }
    if (skillId === 'chain_lightning') {
      this.registerEnlightenment('shock');
      mv.spawnGroundDecal('shock', _tx, _ty, 0.72, 1400);
      _chainD4(5, (165 + skillLvl * 24) / 100, '#a78bfa', '⚡連鎖閃電 ', ['shock']);
      if (Math.random() < 0.65) this.spawnCracklingOrb(_tx, _ty);
      return;
    }
    if (skillId === 'black_hole') {
      this.registerEnlightenment('shock');
      mv.spawnGroundDecal('void', _tx, _ty, 1.15, 2200);
      mv.playSeq16('seq16_m_supernova', _tx, _ty - 10, 1.52, 15, 16);
      for (let w = 0; w < 4; w++) {
        this.time.delayedCall(w * 240, () => {
          _pullVortex(_tx, _ty, 310, 52);
          if (w === 3) _aoeD4(_tx, _ty, 275, (250 + skillLvl * 36) / 100, '#c084fc', '🕳️黑洞坍縮 ', ['vulnerable', 'curse'], true);
        });
      }
      return;
    }
    const alive = this.monsters.filter((m) => m.hp > 0);
    if (alive.length === 0) return;
    const sk = MAGE_SKILLS[skillId];
    const aim = this.getAimPoint(isManual, 480);
    this.faceHeroToward(aim.x, aim.y);
    this.triggerHeroAttackAnim(420);

    const dmgMult = (stats.skillDmgMult || 1) * (this.time.now < this.overloadUntil ? 1.35 : 1);
    const radMult = stats.skillRadiusMult || 1;
    this.showSkillBanner(sk.name, '#c084fc');

    if (skillId === 'meteor') {
      const mx = aim.x;
      const my = aim.y;
      const sigil = this.add.image(mx, my + 16, 'mfx_nova_ring')
        .setScale(1.35 * radMult).setBlendMode(Phaser.BlendModes.ADD).setDepth(6);
      this.tweens.add({ targets: sigil, angle: 90, duration: 380 });

      const meteor = this.add.image(mx - 150, my - 340, 'mfx_meteor_rock')
        .setScale(1.15).setBlendMode(Phaser.BlendModes.ADD).setDepth(4510);
      this.tweens.add({
        targets: meteor,
        x: mx,
        y: my,
        duration: 340,
        ease: 'Quad.easeIn',
        onComplete: () => {
          meteor.destroy();
          sigil.destroy();
          const crater = this.add.image(mx, my + 12, 'mfx_meteor_crater')
            .setScale(1.45 * radMult).setBlendMode(Phaser.BlendModes.ADD).setDepth(5);
          this.tweens.add({ targets: crater, alpha: 0, delay: 950, duration: 420, onComplete: () => crater.destroy() });

          this.playFxSprite('mfx_meteor_blast', mx, my - 16, 1.65 * radMult, 0, 480);
          this.playFxSprite('mfx_meteor_flame', mx, my - 30, 1.35 * radMult, 0, 520);

          const baseDmg = stats.atk * (2.6 + skillLvl * 0.42) * dmgMult;
          this.monsters.filter((m) => m.hp > 0).forEach((m) => {
            if (Phaser.Math.Distance.Between(mx, my, m.sprite.x, m.sprite.y) <= 230 * radMult) {
              const isChill = this.time.now < (m.chilledUntil || 0);
              const dmg = Math.round(baseDmg * (isChill ? 1.35 : 1));
              this.damageMonster(m, dmg, true, false, isChill ? '#38bdf8' : '#e879f9', isChill ? '❄️' : '☄️');
            }
          });
          if (window.__gameSettings?.graphics?.screenShake !== false) this.cameras.main.shake(240, 0.013);
        },
      });
    } else if (skillId === 'arcane_orb') {
      const baseAng = Math.atan2(aim.y - this.hero.y, aim.x - this.hero.x);
      this.playFxSprite('mfx_star_sigil', this.hero.x, this.hero.y - 10, 0.9, 0, 280);
      const offsets = [-0.28, 0, 0.28];
      const rawDmg = stats.atk * (1.15 + skillLvl * 0.22) * dmgMult;

      offsets.forEach((off, idx) => {
        this.time.delayedCall(idx * 65, () => {
          const ang = baseAng + off;
          const spr = this.add.image(this.hero.x, this.hero.y - 12, 'mfx_orb')
            .setScale(0.62 * radMult).setBlendMode(Phaser.BlendModes.ADD).setDepth(4510);
          this.tweens.add({ targets: spr, angle: 360, duration: 900, repeat: -1 });
          this.projectiles.push({
            fromEnemy: false,
            kind: 'mage_orb',
            sprite: spr,
            vx: Math.cos(ang) * 580,
            vy: Math.sin(ang) * 580,
            lifeMs: 1100,
            fixedRawDmg: rawDmg,
            bonusCrit: 15,
            hitIds: new Set(),
            stats,
          });
        });
      });
    } else if (skillId === 'frost_nova') {
      const mx = this.hero.x;
      const my = this.hero.y;
      const radius = 240 * radMult;
      this.playFxSprite('mfx_frost_ring', mx, my + 8, 1.75 * radMult, 0, 520);
      this.playFxSprite('mfx_frost_shard', mx, my - 12, 1.45 * radMult, 0, 440);
      this.playFxSprite('mfx_frost_burst', mx, my, 1.35 * radMult, Math.random() * Math.PI, 460);

      const shieldGain = Math.round(this.playerMaxHp * (0.16 + skillLvl * 0.02));
      this.mageShieldHp = Math.min(Math.round(this.playerMaxHp * 0.5), this.mageShieldHp + shieldGain);

      const shield = this.add.image(mx, my, 'mfx_arcane_shield')
        .setScale(0.85).setAlpha(0.75).setBlendMode(Phaser.BlendModes.ADD).setDepth(4508);
      this.tweens.add({
        targets: shield,
        alpha: 0,
        scale: 1.15,
        duration: 1400,
        onUpdate: () => shield.setPosition(this.hero.x, this.hero.y),
        onComplete: () => shield.destroy(),
      });

      const dmg = Math.round(stats.atk * (1.8 + skillLvl * 0.30) * dmgMult);
      alive.forEach((m) => {
        if (Phaser.Math.Distance.Between(mx, my, m.sprite.x, m.sprite.y) <= radius) {
          m.slowUntil = this.time.now + 3500;
          m.chilledUntil = this.time.now + 3500;
          this.damageMonster(m, dmg, Math.random() * 100 < stats.critRate, false, '#38bdf8', '❄️');
        }
      });
      this.healHero(Math.round(this.playerMaxHp * (0.08 + skillLvl * 0.02)));
    } else if (skillId === 'void_beam') {
      const charges = this.arcaneChargeStacks || 0;
      this.arcaneChargeStacks = 0;
      const chargeDmgMult = 1 + charges * 0.12;
      const chargeWidthMult = 1 + charges * 0.10;

      const ang = Math.atan2(aim.y - this.hero.y, aim.x - this.hero.x);
      const sx = this.hero.x;
      const sy = this.hero.y - 12;
      this.playFxSprite('mfx_void_core', sx, sy, 1.05 * chargeWidthMult, 0, 380);
      this.playFxSprite('mfx_void_slash', sx + Math.cos(ang) * 45, sy + Math.sin(ang) * 45, 0.95, ang, 340);

      const beamLen = 580 * radMult;
      const bx = sx + Math.cos(ang) * (beamLen / 2);
      const by = sy + Math.sin(ang) * (beamLen / 2);
      const beam = this.add.image(bx, by, 'mfx_void_beam')
        .setDisplaySize(beamLen, 145 * radMult * chargeWidthMult).setRotation(ang).setBlendMode(Phaser.BlendModes.ADD).setDepth(4512);
      this.tweens.add({ targets: beam, alpha: 0, scaleY: 0.4, duration: 420, onComplete: () => beam.destroy() });

      const beamDmg = Math.round(stats.atk * (3.1 + skillLvl * 0.48) * (stats.critDmg / 100) * dmgMult * chargeDmgMult);
      const cosA = Math.cos(ang);
      const sinA = Math.sin(ang);
      alive.forEach((m) => {
        const dx = m.sprite.x - sx;
        const dy = m.sprite.y - sy;
        const along = dx * cosA + dy * sinA;
        const perp = Math.abs(-dx * sinA + dy * cosA);
        if (along >= -40 && along <= beamLen && perp <= 105 * radMult * chargeWidthMult) {
          this.playFxSprite('mfx_star_sigil', m.sprite.x, m.sprite.y - 10, 0.85, Math.random() * Math.PI, 300);
          this.applyHitEffects(m, beamDmg, true, stats);
        }
      });
      if (window.__gameSettings?.graphics?.screenShake !== false) this.cameras.main.shake(210, 0.011);
    } else if (skillId === 'mana_overload') {
      this.overloadUntil = this.time.now + 4500;
      this.arcaneChargeStacks = 5;
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + Math.round(this.playerMaxMp * (0.5 + skillLvl * 0.05)));
      this.playFxSprite('nfx_overload', this.hero.x, this.hero.y - 20, 1.35, 0, 560);
      this.spawnFloatingText(this.hero.x, this.hero.y - 95, '⚡魔力超載!', '#38bdf8', 16);
    } else if (skillId === 'chain_lightning') {
      let curX = this.hero.x;
      let curY = this.hero.y - 12;
      const hitSet = new Set();
      for (let hop = 0; hop < 6; hop++) {
        const next = this.monsters.find((m) => m.hp > 0 && !hitSet.has(m.uid) && Phaser.Math.Distance.Between(curX, curY, m.sprite.x, m.sprite.y) <= 420);
        if (!next) break;
        hitSet.add(next.uid);
        const mx = (curX + next.sprite.x) / 2;
        const my = (curY + next.sprite.y) / 2;
        const dist = Math.max(60, Phaser.Math.Distance.Between(curX, curY, next.sprite.x, next.sprite.y));
        const ang = Math.atan2(next.sprite.y - curY, next.sprite.x - curX);
        const arc = this.add.image(mx, my, 'nfx_lightning').setDisplaySize(dist, 85).setRotation(ang).setBlendMode(Phaser.BlendModes.ADD).setDepth(4512);
        this.tweens.add({ targets: arc, alpha: 0, duration: 280, onComplete: () => arc.destroy() });
        const isChill = this.time.now < (next.chilledUntil || 0);
        const dmg = Math.round(stats.atk * (1.3 + skillLvl * 0.26) * (isChill ? 1.85 : 1) * dmgMult);
        this.damageMonster(next, dmg, Math.random() * 100 < stats.critRate, false, '#38bdf8', '⚡');
        curX = next.sprite.x;
        curY = next.sprite.y;
      }
    } else if (skillId === 'icicle_rain') {
      const tx = aim.x;
      const ty = aim.y;
      const radius = 235 * radMult;
      this.time.addEvent({
        delay: 280,
        repeat: 3,
        callback: () => {
          this.playFxSprite('nfx_icicles', tx + Phaser.Math.Between(-30, 30), ty - 45, 1.35 * radMult, 0, 360);
          this.playFxSprite('mfx_frost_burst', tx, ty + 10, 1.15 * radMult, 0, 340);
          const dmg = Math.round(stats.atk * (0.78 + skillLvl * 0.16) * dmgMult);
          this.monsters.filter((m) => m.hp > 0).forEach((m) => {
            if (Phaser.Math.Distance.Between(tx, ty, m.sprite.x, m.sprite.y) <= radius) {
              m.slowUntil = this.time.now + 3500;
              m.chilledUntil = this.time.now + 3500;
              this.damageMonster(m, dmg, Math.random() * 100 < stats.critRate, false, '#7dd3fc', '❄️');
            }
          });
        },
      });
    } else if (skillId === 'black_hole') {
      const bx = aim.x;
      const by = aim.y;
      const radius = 330 * radMult;
      const bh = this.add.image(bx, by, 'nfx_blackhole').setScale(1.4 * radMult).setBlendMode(Phaser.BlendModes.ADD).setDepth(4505);
      this.tweens.add({ targets: bh, angle: 360, duration: 1200 });
      alive.forEach((m) => {
        if (Phaser.Math.Distance.Between(bx, by, m.sprite.x, m.sprite.y) <= radius) {
          m.stunUntil = this.time.now + 1200;
          this.tweens.add({
            targets: m.sprite,
            x: bx + Phaser.Math.Between(-50, 50),
            y: by + Phaser.Math.Between(-40, 40),
            duration: 550,
            ease: 'Quad.easeIn',
          });
        }
      });
      this.time.delayedCall(1100, () => {
        bh.destroy();
        this.playFxSprite('mfx_void_core', bx, by, 1.6 * radMult, 0, 450);
        const dmg = Math.round(stats.atk * (2.5 + skillLvl * 0.42) * dmgMult);
        this.monsters.filter((m) => m.hp > 0).forEach((m) => {
          if (Phaser.Math.Distance.Between(bx, by, m.sprite.x, m.sprite.y) <= radius * 0.85) {
            this.damageMonster(m, dmg, true, false, '#c084fc', '🕳️');
          }
        });
        if (window.__gameSettings?.graphics?.screenShake !== false) this.cameras.main.shake(220, 0.012);
      });
    }
  },

  getMageD4LiveMult() {
    let mult = 1;
    const conjStacks = Math.min(10, (this.mageConjurations || []).length);
    if (conjStacks > 0) mult *= (1 + conjStacks * 0.06);
    if (this.heroBarrierHp > 0 && this.time.now < (this.heroBarrierUntil || 0)) mult *= 1.25;
    if (this.time.now < (this.enlightenmentUntil || 0)) mult *= 1.45;
    return mult;
  },

  spawnMageConjuration(type, x, y, skillLvl = 1, durationMs = 9000) {
    if ((this.mageConjurations || []).length >= 8) {
      const oldest = this.mageConjurations.shift();
      if (oldest?.sprite) oldest.sprite.destroy();
      if (oldest?.shadow) oldest.shadow.destroy();
    }
    const animMap = {
      hydra: 'anim_conj_hydra',
      ice_blades: 'anim_conj_ice_blades',
      lightning_spear: 'anim_conj_lightning_spear',
      familiar: 'anim_conj_familiar',
    };
    const fallbackMap = {
      hydra: 'conj_m_hydra',
      ice_blades: 'conj_m_ice_blades',
      lightning_spear: 'conj_m_lightning_spear',
      familiar: 'conj_m_familiar',
    };
    const animKey = animMap[type] || 'anim_conj_hydra';
    const fbKey = fallbackMap[type] || 'conj_m_hydra';
    const scaleMap = { hydra: 0.54, ice_blades: 0.46, lightning_spear: 0.48, familiar: 0.42 };
    const baseSc = scaleMap[type] || 0.48;
    const elemMap = { hydra: 'fire', ice_blades: 'frost', lightning_spear: 'shock', familiar: 'shock' };
    const elem = elemMap[type] || 'fire';
    this.mageVfx?.spawnConjurationPoof(x, y, elem);
    const shadow = this.add.ellipse(x, y + 10, 58, 22, 0x050507, 0.58)
      .setDepth(Math.max(50, Math.round(y - 2)));
    let sp = null;
    if (this.textures.exists(animKey) && this.anims.exists(animKey)) {
      sp = this.add.sprite(x, y - 14, animKey, 0)
        .setScale(baseSc * 0.2)
        .setAlpha(0.98)
        .setDepth(Math.max(120, Math.round(y + 10)));
      sp.play(animKey);
    } else if (this.textures.exists(fbKey)) {
      sp = this.add.image(x, y - 14, fbKey)
        .setScale(baseSc * 0.2)
        .setAlpha(0.98)
        .setDepth(Math.max(120, Math.round(y + 10)));
    }
    if (sp) {
      this.tweens.add({ targets: sp, scale: baseSc, duration: 220, ease: 'Back.easeOut' });
    }
    this.mageConjurations.push({
      type,
      elem,
      sprite: sp,
      shadow,
      x,
      y,
      skillLvl,
      expiresAt: this.time.now + durationMs,
      atkCd: 350,
      interval: type === 'hydra' ? 850 : (type === 'ice_blades' ? 750 : 800),
      phase: Math.random() * 6.28,
    });
  },

  updateMageBattlefieldEntities(delta) {
    const now = this.time.now;
    const dtSec = delta / 1000;

    // 1. 屏障護盾光環跟隨與過期清除
    if (this.heroBarrierSprite) {
      if (!this.hero || now >= (this.heroBarrierUntil || 0) || (this.heroBarrierHp || 0) <= 0) {
        this.heroBarrierSprite.destroy();
        this.heroBarrierSprite = null;
        this.heroBarrierHp = 0;
      } else {
        this.heroBarrierSprite.setVisible(true);
        this.heroBarrierSprite.setPosition(this.hero.x, this.hero.y - 4);
        this.heroBarrierSprite.setDepth(Math.max(120, Math.round(this.hero.y + 10)));
        this.heroBarrierSprite.setScale(0.56 + Math.sin(now * 0.006) * 0.03);
      }
    }

    // 2. 啟蒙爆發期間額外回魔
    if (now < (this.enlightenmentUntil || 0)) {
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 16 * dtSec);
    }

    // 3. 場上召喚實體（火蛇／冰刃／閃電長矛／元素使魔）自主鎖敵與攻擊
    if (this.mageConjurations && this.mageConjurations.length > 0) {
      const stats = this.getStats();
      const mult = this.getMageD4LiveMult();
      // 召喚精通每層額外回魔
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + Math.min(10, this.mageConjurations.length) * 1.4 * dtSec);

      for (let i = this.mageConjurations.length - 1; i >= 0; i--) {
        const c = this.mageConjurations[i];
        if (now >= c.expiresAt) {
          this.mageVfx?.spawnConjurationPoof(c.x, c.y, c.elem || 'fire');
          if (c.sprite) c.sprite.destroy();
          if (c.shadow) c.shadow.destroy();
          this.mageConjurations.splice(i, 1);
          continue;
        }
        c.phase += dtSec * 4.5;
        const tgt = this.findNearestMonster(c.x, c.y, 650);
        if (c.type === 'ice_blades' || c.type === 'lightning_spear') {
          if (tgt && tgt.sprite) {
            const ang = Phaser.Math.Angle.Between(c.x, c.y, tgt.sprite.x, tgt.sprite.y);
            const spd = c.type === 'lightning_spear' ? 280 : 220;
            if (Phaser.Math.Distance.Between(c.x, c.y, tgt.sprite.x, tgt.sprite.y) > 48) {
              c.x += Math.cos(ang) * spd * dtSec;
              c.y += Math.sin(ang) * spd * dtSec;
            }
            if (c.sprite) c.sprite.setRotation(ang);
          }
        } else if (c.type === 'familiar' && this.hero) {
          c.x = this.hero.x + Math.cos(c.phase * 0.7) * 62;
          c.y = this.hero.y - 24 + Math.sin(c.phase * 0.7) * 34;
        }

        if (c.shadow) {
          c.shadow.setPosition(c.x, c.y + 10);
          c.shadow.setDepth(Math.max(50, Math.round(c.y - 2)));
        }
        if (c.sprite) {
          c.sprite.setVisible(true);
          const bob = c.type === 'hydra' ? Math.sin(c.phase * 0.9) * 2.5 : Math.sin(c.phase) * 5;
          c.sprite.setPosition(c.x, c.y - 14 + bob);
          c.sprite.setDepth(Math.max(120, Math.round(c.y + 10)));
          if (tgt && tgt.sprite && (c.type === 'hydra' || c.type === 'familiar')) {
            c.sprite.setFlipX(tgt.sprite.x < c.x);
          }
        }
        c.atkCd -= delta;
        if (c.atkCd <= 0 && tgt && tgt.sprite && tgt.hp > 0) {
          c.atkCd = c.interval;
          const baseDmg = Math.round(stats.atk * ((0.72 + c.skillLvl * 0.11) * mult));
          if (c.sprite) {
            this.tweens.add({ targets: c.sprite, scaleX: c.sprite.scaleX * 1.18, scaleY: c.sprite.scaleY * 1.18, duration: 90, yoyo: true });
          }
          if (c.type === 'hydra') {
            this.mageVfx?.launchProjectile('proj_m_fire_bolt', c.x, c.y - 24, tgt.sprite.x, tgt.sprite.y - 8, 0.42, 160, 'fire', () => {
              if (tgt.hp > 0) {
                this.mageVfx?.playSeq16('seq16_m_fireball_blast', tgt.sprite.x, tgt.sprite.y - 6, 0.58, 22, 14);
                this.damageMonster(tgt, baseDmg, false, false, '#fb923c', '🐍火蛇 ', true);
              }
            });
          } else if (c.type === 'ice_blades') {
            this.mageVfx?.playSeq16('seq16_m_frost_nova', tgt.sprite.x, tgt.sprite.y - 6, 0.58, 22, 14);
            this.slotCdTimers = this.slotCdTimers.map((t) => t + 380);
            this.damageMonster(tgt, baseDmg, false, false, '#7dd3fc', '⚔️冰刃 ', true);
          } else if (c.type === 'lightning_spear') {
            this.mageVfx?.playChainArc(c.x, c.y - 10, tgt.sprite.x, tgt.sprite.y - 8, 0.42, 200); this.mageVfx?.playSeq16('seq16_m_ball_lightning', tgt.sprite.x, tgt.sprite.y - 8, 0.62, 24, 16);
            this.damageMonster(tgt, Math.round(baseDmg * 1.15), true, false, '#facc15', '⚡雷矛 ', true);
          } else if (c.type === 'familiar') {
            this.mageVfx?.playChainArc(c.x, c.y - 12, tgt.sprite.x, tgt.sprite.y - 8, 0.34, 190); this.mageVfx?.playSeq16('seq16_m_ball_lightning', tgt.sprite.x, tgt.sprite.y - 6, 0.56, 22, 14);
            this.damageMonster(tgt, baseDmg, false, false, '#fde047', '🔮使魔 ', true);
          }
        }
      }
    }

    // 4. 地面劈啪電花能量球：磁吸拾取回魔＋減冷卻＋放電
    if (this.cracklingOrbs && this.cracklingOrbs.length > 0 && this.hero) {
      const stats = this.getStats();
      for (let i = this.cracklingOrbs.length - 1; i >= 0; i--) {
        const orb = this.cracklingOrbs[i];
        if (now >= orb.expiresAt) {
          orb.sprite.destroy();
          this.cracklingOrbs.splice(i, 1);
          continue;
        }
        orb.phase += dtSec * 6;
        const dist = Phaser.Math.Distance.Between(orb.x, orb.y, this.hero.x, this.hero.y);
        if (dist < 210) {
          const ang = Phaser.Math.Angle.Between(orb.x, orb.y, this.hero.x, this.hero.y);
          orb.x += Math.cos(ang) * 320 * dtSec;
          orb.y += Math.sin(ang) * 320 * dtSec;
        }
        orb.sprite.setVisible(true);
        orb.sprite.setPosition(orb.x, orb.y + Math.sin(orb.phase) * 4);
        orb.sprite.setScale(0.26 + Math.sin(orb.phase) * 0.04);
        if (dist <= 44) {
          orb.sprite.destroy();
          this.cracklingOrbs.splice(i, 1);
          this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 18);
          this.slotCdTimers = this.slotCdTimers.map((t) => t + 600);
          const near = this.findNearestMonster(this.hero.x, this.hero.y, 420);
          if (near && near.sprite && near.hp > 0) {
            this.mageVfx?.playChainArc(this.hero.x, this.hero.y - 14, near.sprite.x, near.sprite.y - 10, 0.38, 200);
            this.damageMonster(near, Math.round(stats.atk * 0.95 * this.getMageD4LiveMult()), false, false, '#38bdf8', '⚡電花 ', true);
          }
        }
      }
    }
  },
};
