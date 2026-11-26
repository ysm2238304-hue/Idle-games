// v266: NECRO 職業獨立戰鬥模組（抽離自 BattleScene.js，透過 prototype 零開銷掛接）
const MAP_W = 4096;
const MAP_H = 2304;

export const necroCombatMethods = {
  getNecroD4LiveMult() {
    const st = this.getState();
    const book = st?.classMechanic?.necro || {};
    const ks = st?.activeKeystone?.necro || '';
    let mult = 1.0;
    let sacCount = 0;
    if (book.skeleton === 'sacrifice') sacCount += 1;
    if (book.mage === 'sacrifice') sacCount += 1;
    if (book.golem === 'sacrifice') sacCount += 1;
    if (sacCount === 3) mult *= 1.45;
    else if (sacCount > 0) mult *= (1 + sacCount * 0.14);
    if (ks === 'nk_undead_overlord' && (this.necroMinions?.length || 0) >= 3) mult *= 1.28;
    if (ks === 'nk_bone_tyrant') mult *= 1.18;
    if (ks === 'nk_plague_sea') mult *= 1.16;
    if (ks === 'nk_lich_phylactery' && this.playerMp >= this.playerMaxMp * 0.5) mult *= 1.22;
    return mult;
  },

  spawnNecroCorpse(x, y) {
    if (!this.textures.exists('ent_n_corpse')) return null;
    if (!this.necroCorpses) this.necroCorpses = [];
    while (this.necroCorpses.length >= 12) {
      const old = this.necroCorpses.shift();
      if (old?.sprite?.active) old.sprite.destroy();
    }
    const cx = Phaser.Math.Clamp(x + Phaser.Math.Between(-18, 18), 80, MAP_W - 80);
    const cy = Phaser.Math.Clamp(y + Phaser.Math.Between(-10, 14), 80, MAP_H - 80);
    const sp = this.add.image(cx, cy, 'ent_n_corpse')
      .setScale(0.32)
      .setAlpha(0)
      .setDepth(52);
    this.tweens.add({ targets: sp, scale: 0.56, alpha: 0.94, duration: 180, ease: 'Back.easeOut' });
    const entry = { x: cx, y: cy, sprite: sp, expiresAt: this.time.now + 18000 };
    this.necroCorpses.push(entry);
    return entry;
  },

  consumeNearestNecroCorpse(x, y, maxDist = 440, destroyCorpse = true) {
    if (!this.necroCorpses || this.necroCorpses.length === 0) {
      return { x, y, consumed: false };
    }
    let bestIdx = -1;
    let bestDist = maxDist;
    for (let i = 0; i < this.necroCorpses.length; i++) {
      const c = this.necroCorpses[i];
      if (!c?.sprite?.active) continue;
      const d = Phaser.Math.Distance.Between(x, y, c.x, c.y);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    if (bestIdx === -1) return { x, y, consumed: false };
    const picked = this.necroCorpses[bestIdx];
    const rx = picked.x;
    const ry = picked.y;
    if (destroyCorpse) {
      if (picked.sprite?.active) picked.sprite.destroy();
      this.necroCorpses.splice(bestIdx, 1);
    }
    return { x: rx, y: ry, consumed: true };
  },

  spawnNecroBloodOrb(x, y) {
    if (!this.textures.exists('ent_n_blood_orb')) return null;
    if (!this.necroBloodOrbs) this.necroBloodOrbs = [];
    while (this.necroBloodOrbs.length >= 10) {
      const old = this.necroBloodOrbs.shift();
      if (old?.sprite?.active) old.sprite.destroy();
    }
    const ox = Phaser.Math.Clamp(x + Phaser.Math.Between(-36, 36), 80, MAP_W - 80);
    const oy = Phaser.Math.Clamp(y + Phaser.Math.Between(-24, 24), 80, MAP_H - 80);
    const sp = this.add.image(ox, oy, 'ent_n_blood_orb')
      .setScale(0.24)
      .setAlpha(0)
      .setDepth(Math.max(115, Math.round(oy + 6)));
    this.tweens.add({ targets: sp, scale: 0.44, alpha: 0.96, duration: 200, ease: 'Back.easeOut' });
    const entry = { x: ox, y: oy, sprite: sp, phase: Math.random() * 6.28, expiresAt: this.time.now + 14000 };
    this.necroBloodOrbs.push(entry);
    return entry;
  },

  triggerNecroShadowHit(target, stats) {
    if (!target || !target.sprite || target.hp <= 0) return;
    const st = this.getState();
    const hasKeystone = st?.activeKeystone?.necro === 'nk_shadowblight';
    this.necroShadowHits = (this.necroShadowHits || 0) + 1;
    const threshold = hasKeystone ? 8 : 14;
    if (this.necroShadowHits >= threshold) {
      this.necroShadowHits = 0;
      const sx = target.sprite.x;
      const sy = target.sprite.y;
      this.necroVfx?.playSeq16('seq16_n_soul_rift', sx, sy - 8, 1.05, 18, 18);
      this.necroVfx?.spawnDebrisBurst(sx, sy, 'shadow', 7);
      const sbMult = (hasKeystone ? 2.45 : 1.35) * this.getNecroD4LiveMult();
      for (const m of [...this.monsters]) {
        if (!m || m.hp <= 0 || !m.sprite) continue;
        if (Phaser.Math.Distance.Between(sx, sy, m.sprite.x, m.sprite.y) <= 230) {
          const dmg = Math.max(1, Math.round(stats.atk * sbMult * (stats.critDmg / 100)));
          this.damageMonster(m, dmg, true, false, '#c084fc', '☠️暗影枯萎 ', true);
        }
      }
    }
  },

  spawnNecroMinion(kind, x, y, skillLvl = 1, lifeMs = 20000) {
    const st = this.getState();
    const book = st?.classMechanic?.necro || {};
    const ks = st?.activeKeystone?.necro || '';
    if (kind === 'skeleton' && book.skeleton === 'sacrifice') return false;
    if (kind === 'mage' && book.mage === 'sacrifice') return false;
    if (kind === 'golem' && book.golem === 'sacrifice') return false;

    const animKeyMap = {
      skeleton: 'anim_n_skeleton',
      mage: 'anim_n_mage',
      golem: 'anim_n_golem',
      wraith: 'anim_n_wraith',
    };
    const scaleMap = { skeleton: 0.44, mage: 0.46, golem: 0.62, wraith: 0.46 };
    const capMap = {
      skeleton: ks === 'nk_undead_overlord' ? 6 : 4,
      mage: ks === 'nk_undead_overlord' ? 4 : 3,
      golem: 1,
      wraith: 5,
    };
    const intervalMap = { skeleton: 920, mage: 1120, golem: 1420, wraith: 780 };
    const themeMap = { skeleton: 'bone', mage: 'shadow', golem: 'blood', wraith: 'shadow' };

    const key = animKeyMap[kind];
    if (!key || !this.textures.exists(key)) return false;
    if (!this.necroMinions) this.necroMinions = [];

    const existing = this.necroMinions.filter((m) => m.kind === kind);
    if (existing.length >= (capMap[kind] || 3)) {
      const oldest = existing[0];
      oldest.expiresAt = this.time.now + lifeMs;
      oldest.skillLvl = Math.max(oldest.skillLvl, skillLvl);
      this.necroVfx?.spawnSummonPoof(oldest.x, oldest.y, themeMap[kind]);
      return true;
    }

    const mx = Phaser.Math.Clamp(x, 80, MAP_W - 80);
    const my = Phaser.Math.Clamp(y, 80, MAP_H - 80);
    const shadow = this.add.ellipse(mx, my + 12, kind === 'golem' ? 56 : 36, kind === 'golem' ? 20 : 14, 0x050507, 0.52)
      .setDepth(Math.max(50, Math.round(my - 2)));
    const sp = this.add.sprite(mx, my - 10, key, 0)
      .setScale(scaleMap[kind])
      .setDepth(Math.max(120, Math.round(my + 10)));
    if (this.anims.exists(key)) sp.play(key);
    this.necroVfx?.spawnSummonPoof(mx, my, themeMap[kind]);

    this.necroMinions.push({
      kind,
      x: mx,
      y: my,
      sprite: sp,
      shadow,
      skillLvl,
      interval: intervalMap[kind],
      atkCd: 260 + Math.random() * 220,
      expiresAt: this.time.now + lifeMs,
      phase: Math.random() * 6.28,
      slamCount: 0,
      theme: themeMap[kind],
      homeOffX: Phaser.Math.Between(-95, 95),
      homeOffY: Phaser.Math.Between(-65, 65),
    });
    return true;
  },

  updateNecroBattlefieldEntities(delta) {
    const now = this.time.now;
    const dtSec = delta / 1000;

    // 1. 地面屍體過期清除
    if (this.necroCorpses && this.necroCorpses.length > 0) {
      for (let i = this.necroCorpses.length - 1; i >= 0; i--) {
        const c = this.necroCorpses[i];
        if (!c?.sprite?.active || now >= c.expiresAt) {
          if (c?.sprite?.active) c.sprite.destroy();
          this.necroCorpses.splice(i, 1);
        }
      }
    }

    // 2. 鮮血球磁吸拾取（回血＋回魂能＋疊加拉斯瑪層數）
    if (this.necroBloodOrbs && this.necroBloodOrbs.length > 0 && this.hero) {
      for (let i = this.necroBloodOrbs.length - 1; i >= 0; i--) {
        const orb = this.necroBloodOrbs[i];
        if (!orb?.sprite?.active || now >= orb.expiresAt) {
          if (orb?.sprite?.active) orb.sprite.destroy();
          this.necroBloodOrbs.splice(i, 1);
          continue;
        }
        orb.phase += dtSec * 5.0;
        const dist = Phaser.Math.Distance.Between(orb.x, orb.y, this.hero.x, this.hero.y);
        if (dist <= 250) {
          const ang = Phaser.Math.Angle.Between(orb.x, orb.y, this.hero.x, this.hero.y);
          orb.x += Math.cos(ang) * 340 * dtSec;
          orb.y += Math.sin(ang) * 340 * dtSec;
        }
        orb.sprite.setPosition(orb.x, orb.y - 6 + Math.sin(orb.phase) * 4);
        orb.sprite.setDepth(Math.max(118, Math.round(orb.y + 8)));
        if (dist <= 44) {
          orb.sprite.destroy();
          this.necroBloodOrbs.splice(i, 1);
          this.healHero(Math.round(this.playerMaxHp * 0.08));
          this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 10);
          this.necroBloodOrbStacks = Math.min(5, (this.necroBloodOrbStacks || 0) + 1);
          this.necroVfx?.spawnDebrisBurst(this.hero.x, this.hero.y - 8, 'blood', 4);
        }
      }
    }

    // 3. 4 類動態亡靈隨從自主追蹤、走位與攻擊
    if (this.necroMinions && this.necroMinions.length > 0) {
      const stats = this.getStats();
      const mult = this.getNecroD4LiveMult();
      const frenzied = now < (this.necroFrenzyUntil || 0);
      const atkSpdFactor = frenzied ? 0.65 : 1.0;

      for (let i = this.necroMinions.length - 1; i >= 0; i--) {
        const mn = this.necroMinions[i];
        if (!mn?.sprite?.active || now >= mn.expiresAt) {
          this.necroVfx?.spawnSummonPoof(mn.x, mn.y, mn.theme || 'shadow');
          if (mn?.sprite?.active) mn.sprite.destroy();
          if (mn?.shadow?.active) mn.shadow.destroy();
          this.necroMinions.splice(i, 1);
          continue;
        }
        mn.phase += dtSec * 4.2;
        const tgt = this.findNearestMonster(mn.x, mn.y, 680);
        const speedMap = { skeleton: 215, mage: 175, golem: 185, wraith: 285 };
        const desiredRange = mn.kind === 'mage' ? 210 : (mn.kind === 'golem' ? 58 : 48);

        if (tgt && tgt.sprite && tgt.hp > 0) {
          const dist = Phaser.Math.Distance.Between(mn.x, mn.y, tgt.sprite.x, tgt.sprite.y);
          const ang = Phaser.Math.Angle.Between(mn.x, mn.y, tgt.sprite.x, tgt.sprite.y);
          if (dist > desiredRange) {
            mn.x += Math.cos(ang) * speedMap[mn.kind] * dtSec;
            mn.y += Math.sin(ang) * speedMap[mn.kind] * dtSec;
          } else if (mn.kind === 'mage' && dist < 130) {
            mn.x -= Math.cos(ang) * 110 * dtSec;
            mn.y -= Math.sin(ang) * 110 * dtSec;
          }
          mn.sprite.setFlipX(tgt.sprite.x < mn.x);
        } else if (this.hero) {
          const hx = this.hero.x + mn.homeOffX;
          const hy = this.hero.y + mn.homeOffY;
          const distH = Phaser.Math.Distance.Between(mn.x, mn.y, hx, hy);
          if (distH > 40) {
            const angH = Phaser.Math.Angle.Between(mn.x, mn.y, hx, hy);
            mn.x += Math.cos(angH) * speedMap[mn.kind] * dtSec;
            mn.y += Math.sin(angH) * speedMap[mn.kind] * dtSec;
            mn.sprite.setFlipX(hx < mn.x);
          }
        }

        if (mn.shadow?.active) {
          mn.shadow.setPosition(mn.x, mn.y + 12);
          mn.shadow.setDepth(Math.max(50, Math.round(mn.y - 2)));
        }
        const bob = mn.kind === 'wraith' ? Math.sin(mn.phase * 1.4) * 6 : Math.sin(mn.phase) * 2.5;
        mn.sprite.setPosition(mn.x, mn.y - 12 + bob);
        mn.sprite.setDepth(Math.max(120, Math.round(mn.y + 10)));

        mn.atkCd -= delta;
        if (mn.atkCd <= 0 && tgt && tgt.sprite && tgt.hp > 0) {
          const hitDist = Phaser.Math.Distance.Between(mn.x, mn.y, tgt.sprite.x, tgt.sprite.y);
          if (hitDist <= desiredRange + 65) {
            mn.atkCd = mn.interval * atkSpdFactor;
            const baseDmg = Math.max(1, Math.round(stats.atk * (0.68 + mn.skillLvl * 0.11) * mult * (frenzied ? 1.30 : 1)));
            this.tweens.add({ targets: mn.sprite, scaleX: mn.sprite.scaleX * 1.16, scaleY: mn.sprite.scaleY * 1.16, duration: 85, yoyo: true });

            if (mn.kind === 'skeleton') {
              this.necroVfx?.playSeq16('seq16_n_bone_burst', tgt.sprite.x, tgt.sprite.y - 6, 0.44, 22, 14);
              this.necroVfx?.spawnDebrisBurst(tgt.sprite.x, tgt.sprite.y, 'bone', 4);
              this.damageMonster(tgt, baseDmg, false, false, '#e2e8f0', '💀骷髏 ', true);
            } else if (mn.kind === 'mage') {
              this.necroVfx?.playSeq16('seq16_n_soul_rift', tgt.sprite.x, tgt.sprite.y - 8, 0.48, 20, 14);
              this.damageMonster(tgt, Math.round(baseDmg * 1.12), false, false, '#c084fc', '🔮骸法 ', true);
              this.triggerNecroShadowHit(tgt, stats);
            } else if (mn.kind === 'golem') {
              mn.slamCount += 1;
              this.necroVfx?.playSeq16('seq16_n_blood_surge', tgt.sprite.x, tgt.sprite.y - 8, 0.72, 20, 16);
              this.necroVfx?.spawnGroundDecal('blood', tgt.sprite.x, tgt.sprite.y, 0.65, 1400);
              for (const m of [...this.monsters]) {
                if (m && m.hp > 0 && m.sprite && Phaser.Math.Distance.Between(tgt.sprite.x, tgt.sprite.y, m.sprite.x, m.sprite.y) <= 170) {
                  this.damageMonster(m, Math.round(baseDmg * 1.35), false, false, '#fb7185', '🩸魔像 ', true);
                }
              }
              if (mn.slamCount % 2 === 0) this.spawnNecroBloodOrb(tgt.sprite.x, tgt.sprite.y);
            } else if (mn.kind === 'wraith') {
              this.necroVfx?.playSeq16('seq16_n_blight_pool', tgt.sprite.x, tgt.sprite.y - 6, 0.46, 20, 14);
              this.damageMonster(tgt, Math.round(baseDmg * 1.18), true, false, '#5eead4', '👻怨靈 ', true);
              this.triggerNecroShadowHit(tgt, stats);
            }
          }
        }
      }
    }
  },

  castNecroSkill(skillId, skillLvl, stats, isManual = false) {
    const _hx = this.hero.x, _hy = this.hero.y;
    const aim = this.getAimPoint(isManual, 440);
    const nearest = this.findNearestMonster(_hx, _hy);
    const _tx = isManual ? aim.x : (nearest ? nearest.sprite.x : aim.x);
    const _ty = isManual ? aim.y : (nearest ? nearest.sprite.y : aim.y);
    const _ang = Phaser.Math.Angle.Between(_hx, _hy, _tx, _ty);

    this.faceHeroToward(_tx, _ty);
    this.triggerHeroAttackAnim(380);
    if (this.anims.exists(`n_${this.heroDir}_atk`)) {
      this.hero.play(`n_${this.heroDir}_atk`, false);
    }

    const st = this.getState();
    const ks = st?.activeKeystone?.necro || '';
    const nv = this.necroVfx;
    const liveMult = (stats.skillDmgMult || 1) * this.getNecroD4LiveMult();
    const boneMult = (1 + (stats.boneDmgPct || 0) / 100) * (ks === 'nk_bone_tyrant' ? 1.25 : 1);

    const _hitOne = (m, mult, col, pre, stList = [], opts = {}) => {
      if (!m || m.hp <= 0 || !m.sprite) return false;
      const bonusCrit = opts.bonusCrit || 0;
      const isC = opts.forceCrit || (Math.random() * 100 < (stats.critRate + bonusCrit));
      const curseAmp = (this.time.now < (m.cursedUntil || 0)) ? 1.25 : 1.0;
      const d = Math.max(1, Math.round(stats.atk * mult * liveMult * curseAmp * (isC ? stats.critDmg / 100 : 1)));
      if (!m._statuses) m._statuses = {};
      stList.forEach((k) => {
        m._statuses[k] = Math.max(m._statuses[k] || 0, this.time.now + 5000);
        if (k === 'curse') m.cursedUntil = Math.max(m.cursedUntil || 0, this.time.now + 6000);
        if (k === 'chill' || k === 'slow') m.chilledUntil = Math.max(m.chilledUntil || 0, this.time.now + 3600);
        if (k === 'bleed') m.bleedUntil = Math.max(m.bleedUntil || 0, this.time.now + 5000);
      });
      this.damageMonster(m, d, isC, false, col, pre);
      if (opts.shadow) this.triggerNecroShadowHit(m, stats);
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
        const diff = Math.abs(Phaser.Math.Angle.Wrap(mAng - dirAng));
        if (diff <= halfArcRad || dist <= 48) {
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
        const perp = Math.abs(-dx * sinA + dy * cosA);
        if (perp <= halfWidth) {
          if (_hitOne(m, mult, col, pre, stList, opts)) hitList.push(m);
        }
      }
      return hitList;
    };

    // ===================== [1] 基礎產能 =====================
    if (skillId === 'n_reap_scythe') {
      // 125° 前方鐮刀扇形掃擊＋必定產出 1 具地面屍體
      const sx = _hx + Math.cos(_ang) * 95;
      const sy = _hy + Math.sin(_ang) * 95;
      nv?.playSeq16('seq16_n_soul_rift', sx, sy - 8, 0.78, 22, 14);
      nv?.spawnDebrisBurst(sx, sy, 'shadow', 6);
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 20);
      const hits = _cone(_hx, _hy, _ang, 1.09, 235, (1.48 + skillLvl * 0.22), '#5eead4', '💀收割 ', ['curse'], { shadow: true });
      if (hits > 0 || nearest) this.spawnNecroCorpse(_tx, _ty);
      return;
    }

    if (skillId === 'n_bone_splinters') {
      // 125° 扇形三枚碎骨貫穿飛矛
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 18);
      [-0.24, 0, 0.24].forEach((off) => {
        const a = _ang + off;
        const ex = _hx + Math.cos(a) * 340;
        const ey = _hy + Math.sin(a) * 340;
        nv?.launchSpear('proj_n_bone_spear', _hx, _hy - 12, ex, ey, 0.44, 175, 'bone', () => {
          nv?.spawnDebrisBurst(ex, ey, 'bone', 4);
        });
        _line(_hx, _hy, a, 350, 44, (0.78 + skillLvl * 0.13) * boneMult, '#e2e8f0', '🦴碎骨 ', ['vulnerable'], { bonusCrit: 12 });
      });
      return;
    }

    if (skillId === 'n_hemorrhage') {
      // 單體鎖定鮮血汲取＋50% 機率掉落磁吸鮮血球
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 18);
      const target = nearest;
      const bx = target ? target.sprite.x : _tx;
      const by = target ? target.sprite.y : _ty;
      nv?.playSeq16('seq16_n_blood_surge', bx, by - 8, 0.62, 22, 14);
      nv?.spawnGroundDecal('blood', bx, by, 0.52, 1400);
      if (target) {
        _hitOne(target, (1.62 + skillLvl * 0.24), '#fb7185', '🩸血湧汲 ', ['bleed']);
        if (Math.random() < 0.55) this.spawnNecroBloodOrb(bx, by);
      }
      return;
    }

    if (skillId === 'n_decompose') {
      // 單體腐化鎖定（2 段持續傷害＋必生屍體＋觸發暗影枯萎）
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 22);
      const target = nearest;
      const dx = target ? target.sprite.x : _tx;
      const dy = target ? target.sprite.y : _ty;
      nv?.playSeq16('seq16_n_blight_pool', dx, dy - 6, 0.66, 16, 14);
      nv?.spawnGroundDecal('plague', dx, dy, 0.58, 1600);
      if (target) {
        _hitOne(target, (1.05 + skillLvl * 0.17), '#c084fc', '☠️分解 ', ['curse', 'vulnerable'], { shadow: true });
        this.time.delayedCall(280, () => {
          if (target.hp > 0) _hitOne(target, (1.05 + skillLvl * 0.17), '#c084fc', '☠️腐蝕 ', ['curse'], { shadow: true });
          this.spawnNecroCorpse(dx, dy);
        });
      }
      return;
    }

    // ===================== [2] 核心輸出 =====================
    if (skillId === 'bone_spear') {
      // 560px 直線貫穿長矛＋末端 3 枚折返碎骨彈射
      const ex = _hx + Math.cos(_ang) * 520;
      const ey = _hy + Math.sin(_ang) * 520;
      const spearBonus = stats.activeEffects?.has('bone_pierce') ? 1.30 : 1.0;
      nv?.launchSpear('proj_n_bone_spear', _hx, _hy - 14, ex, ey, 0.72, 200, 'bone', () => {
        nv?.playSeq16('seq16_n_bone_burst', ex, ey - 8, 0.92, 20, 16);
        nv?.spawnGroundDecal('bone', ex, ey, 0.78, 1800);
        nv?.spawnDebrisBurst(ex, ey, 'bone', 8);
        // 3 枚折返碎骨回擊路徑敵人
        [-0.26, 0, 0.26].forEach((off) => {
          const backAng = _ang + Math.PI + off;
          const rx = ex + Math.cos(backAng) * 280;
          const ry = ey + Math.sin(backAng) * 280;
          nv?.launchSpear('proj_n_bone_spear', ex, ey - 10, rx, ry, 0.42, 160, 'bone');
          _line(ex, ey, backAng, 290, 48, (0.95 + skillLvl * 0.16) * boneMult, '#f1f5f9', '🦴折返 ', ['vulnerable'], { bonusCrit: ks === 'nk_bone_tyrant' ? 100 : 25 });
        });
      });
      _line(_hx, _hy, _ang, 540, 56, (2.25 + skillLvl * 0.36) * boneMult * spearBonus, '#e2e8f0', '🦴骨矛 ', ['vulnerable'], { bonusCrit: ks === 'nk_bone_tyrant' ? 100 : 25 });
      return;
    }

    if (skillId === 'n_blood_surge') {
      // 二段式鮮血新星＋消耗 3 層鮮血球觸發拉斯瑪壓制暴擊
      const overpower = (this.necroBloodOrbStacks || 0) >= 3 || ks === 'nk_rathma_vigor';
      if (this.necroBloodOrbStacks >= 3) this.necroBloodOrbStacks -= 3;
      nv?.playSeq16('seq16_n_blood_surge', _hx, _hy - 10, overpower ? 1.38 : 1.15, 20, 18);
      nv?.spawnGroundDecal('blood', _hx, _hy, 0.96, 1800);
      nv?.spawnDebrisBurst(_hx, _hy, 'blood', overpower ? 10 : 6);
      this.healHero(Math.round(this.playerMaxHp * (overpower ? 0.26 : 0.18)));
      _aoe(_hx, _hy, 305, (2.45 + skillLvl * 0.38) * (overpower ? 1.48 : 1.0), '#fb7185', overpower ? '🩸壓制血湧 ' : '🩸血湧 ', ['bleed'], { forceCrit: overpower });
      return;
    }

    if (skillId === 'n_blood_lance') {
      // 540px 直線貫穿鮮血長矛＋全場「穿刺連動共鳴」＋掉落鮮血球
      const ex = _hx + Math.cos(_ang) * 510;
      const ey = _hy + Math.sin(_ang) * 510;
      nv?.launchSpear('proj_n_blood_lance', _hx, _hy - 12, ex, ey, 0.72, 195, 'blood', () => {
        nv?.spawnDebrisBurst(ex, ey, 'blood', 7);
        this.spawnNecroBloodOrb(ex, ey);
      });
      const hitList = _line(_hx, _hy, _ang, 530, 52, (2.05 + skillLvl * 0.34), '#f43f5e', '🩸血矛 ', ['bleed']);
      hitList.forEach((m) => { m.bloodLancedUntil = this.time.now + 5500; });
      // 觸發全場已穿刺敵人共鳴血爆
      for (const m of [...this.monsters]) {
        if (m && m.hp > 0 && m.sprite && this.time.now < (m.bloodLancedUntil || 0)) {
          nv?.playSeq16('seq16_n_blood_surge', m.sprite.x, m.sprite.y - 6, 0.54, 24, 14);
          _hitOne(m, (1.10 + skillLvl * 0.18), '#fda4af', '🩸共鳴 ', ['bleed']);
        }
      }
      return;
    }

    if (skillId === 'n_sever') {
      // 幽魂死神直線衝刺斬擊＋回旋暗影收割
      const ex = _hx + Math.cos(_ang) * 380;
      const ey = _hy + Math.sin(_ang) * 380;
      nv?.playSeq16('seq16_n_soul_rift', (_hx + ex) / 2, (_hy + ey) / 2 - 8, 1.05, 20, 16);
      nv?.spawnGroundDecal('rift', ex, ey, 0.78, 1700);
      nv?.spawnDebrisBurst(ex, ey, 'shadow', 7);
      _line(_hx, _hy, _ang, 410, 66, (2.15 + skillLvl * 0.34), '#2dd4bf', '👻斬裂 ', ['curse', 'vulnerable'], { shadow: true });
      this.time.delayedCall(220, () => {
        nv?.playSeq16('seq16_n_soul_rift', ex, ey - 8, 0.88, 22, 16);
        _aoe(ex, ey, 175, (1.35 + skillLvl * 0.22), '#c084fc', '👻回旋 ', ['curse'], { shadow: true });
      });
      return;
    }

    // ===================== [3] 屍骸與防禦 =====================
    if (skillId === 'n_blood_mist') {
      // 2.0 秒真正無敵血霧形態＋路徑殘留屍體＋3 段血霧脈衝
      this.heroInvulnUntil = Math.max(this.heroInvulnUntil || 0, this.time.now + 2000);
      this.healHero(Math.round(this.playerMaxHp * 0.16));
      if (this.hero) {
        this.hero.setTint(0xef4444).setAlpha(0.55);
        this.time.delayedCall(2000, () => {
          if (this.hero?.active) this.hero.clearTint().setAlpha(1);
        });
      }
      this.spawnFloatingText(_hx, _hy - 78, '🩸 血霧無敵 2.0s', '#fb7185', 14);
      for (let w = 0; w < 3; w++) {
        this.time.delayedCall(w * 520, () => {
          if (!this.hero?.active || this.isTransitioning) return;
          nv?.playSeq16('seq16_n_blood_surge', this.hero.x, this.hero.y - 6, 0.86, 20, 14);
          nv?.spawnGroundDecal('blood', this.hero.x, this.hero.y, 0.72, 1600);
          _aoe(this.hero.x, this.hero.y, 215, (1.25 + skillLvl * 0.20), '#fb7185', '🩸血霧 ', ['bleed']);
          if (w < 2) this.spawnNecroCorpse(this.hero.x, this.hero.y);
        });
      }
      return;
    }

    if (skillId === 'n_bone_shield') {
      // 白骨護盾屏障＋周身骨刺爆裂新星
      const shieldAmt = Math.round(this.playerMaxHp * (0.30 + skillLvl * 0.025));
      if (typeof this.grantHeroBarrier === 'function') this.grantHeroBarrier(shieldAmt, 5500);
      this.healHero(Math.round(this.playerMaxHp * 0.15));
      nv?.playSeq16('seq16_n_bone_burst', _hx, _hy - 10, 1.15, 18, 16);
      nv?.spawnGroundDecal('bone', _hx, _hy, 0.92, 1800);
      nv?.spawnDebrisBurst(_hx, _hy, 'bone', 8);
      _aoe(_hx, _hy, 275, (1.90 + skillLvl * 0.28) * boneMult, '#e2e8f0', '🦴骨盾 ', ['vulnerable']);
      return;
    }

    if (skillId === 'bone_prison') {
      // 圓環骨牢困敵（235px 定身減速＋4 段穿刺脈衝）
      nv?.playSeq16('seq16_n_bone_burst', _tx, _ty - 6, 1.24, 16, 16);
      nv?.spawnGroundDecal('bone', _tx, _ty, 1.05, 2400);
      for (let w = 0; w < 4; w++) {
        this.time.delayedCall(w * 540, () => {
          if (this.isTransitioning) return;
          if (w > 0) nv?.playSeq16('seq16_n_bone_burst', _tx, _ty - 6, 0.90, 20, 14);
          _aoe(_tx, _ty, 235, (0.92 + skillLvl * 0.16) * boneMult, '#e2e8f0', '🦴骨牢 ', ['chill', 'curse', 'vulnerable']);
        });
      }
      return;
    }

    if (skillId === 'corpse_explosion') {
      // 消耗真實地面屍體爆破（有屍體傷害 ×1.35 且範圍擴大）
      const spot = this.consumeNearestNecroCorpse(_tx, _ty, 460, true);
      const rad = (spot.consumed ? 275 : 225) * (1 + (stats.corpseRadiusPct || 0) / 100);
      nv?.playSeq16('seq16_n_corpse_boom', spot.x, spot.y - 10, spot.consumed ? 1.28 : 1.05, 20, 18);
      nv?.spawnGroundDecal('plague', spot.x, spot.y, 0.95, 2000);
      nv?.spawnDebrisBurst(spot.x, spot.y, 'blood', 9);
      const mult = (2.45 + skillLvl * 0.42) * (spot.consumed ? 1.35 : 1.0);
      _aoe(spot.x, spot.y, rad, mult, '#fb7185', spot.consumed ? '💥屍爆 ' : '💥爆裂 ', ['bleed', 'curse'], { shadow: ks === 'nk_plague_sea' });
      return;
    }

    // ===================== [4] 詛咒與控場 =====================
    if (skillId === 'decrepify') {
      // 衰老詛咒法陣（320px 減速＋易傷＋每命中減冷卻）
      nv?.playSeq16('seq16_n_blight_pool', _tx, _ty - 6, 1.25, 16, 14);
      nv?.spawnGroundDecal('plague', _tx, _ty, 1.05, 2200);
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 18);
      const hits = _aoe(_tx, _ty, 320, (1.45 + skillLvl * 0.24), '#a78bfa', '🔮衰老 ', ['curse', 'chill'], { shadow: true });
      if (hits > 0) {
        const cdrMs = Math.min(2400, hits * 420);
        this.slotCdTimers = this.slotCdTimers.map((t) => t + cdrMs);
      }
      return;
    }

    if (skillId === 'n_iron_maiden') {
      // 鋼鐵處女詛咒（320px 群體回魂能＋流血反傷印記）
      nv?.playSeq16('seq16_n_blood_surge', _tx, _ty - 6, 1.12, 18, 14);
      nv?.spawnGroundDecal('blood', _tx, _ty, 0.98, 2200);
      const hits = _aoe(_tx, _ty, 320, (1.65 + skillLvl * 0.26), '#fda4af', '🩸鐵處女 ', ['curse', 'bleed']);
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + Math.min(36, 12 + hits * 6));
      return;
    }

    if (skillId === 'n_corpse_tendrils') {
      // 屍體觸鬚漩渦強拉聚怪（不消耗屍體，340px 全部拉至屍體中心＋易傷定身）
      const spot = this.consumeNearestNecroCorpse(_tx, _ty, 460, false);
      nv?.playSeq16('seq16_n_tendrils', spot.x, spot.y - 8, 1.32, 18, 18);
      nv?.spawnGroundDecal('blood', spot.x, spot.y, 1.05, 2200);
      nv?.spawnDebrisBurst(spot.x, spot.y, 'blood', 8);
      for (const m of [...this.monsters]) {
        if (!m || m.hp <= 0 || !m.sprite) continue;
        if (Phaser.Math.Distance.Between(spot.x, spot.y, m.sprite.x, m.sprite.y) <= 345) {
          const nx = spot.x + Phaser.Math.Between(-28, 28);
          const ny = spot.y + Phaser.Math.Between(-22, 22);
          this.tweens.add({ targets: m.sprite, x: nx, y: ny, duration: 240, ease: 'Cubic.easeOut' });
        }
      }
      _aoe(spot.x, spot.y, 345, (1.95 + skillLvl * 0.30), '#fb7185', '🩸觸鬚聚怪 ', ['vulnerable', 'chill', 'bleed']);
      return;
    }

    if (skillId === 'n_blight_pool') {
      // 枯萎腐沼（3 段持續暗影腐蝕池，連觸暗影枯萎）
      nv?.spawnGroundDecal('plague', _tx, _ty, 1.08, 2400);
      for (let w = 0; w < 3; w++) {
        this.time.delayedCall(w * 340, () => {
          if (this.isTransitioning) return;
          nv?.playSeq16('seq16_n_blight_pool', _tx, _ty - 6, 1.15, 14, 14);
          nv?.spawnDebrisBurst(_tx, _ty, 'shadow', 5);
          _aoe(_tx, _ty, 275, (1.35 + skillLvl * 0.22), '#a855f7', '☠️枯萎 ', ['poison', 'curse'], { shadow: true });
        });
      }
      return;
    }

    // ===================== [E] 亡靈召喚軍團 =====================
    if (skillId === 'raise_skeleton') {
      // 召喚 2 名動態骷髏戰士＋1 名骸骨法師（若已獻祭則改為孤狼骨爆＋回魔）
      let spawned = 0;
      if (this.spawnNecroMinion('skeleton', _hx + Phaser.Math.Between(-75, 75), _hy + Phaser.Math.Between(-50, 50), skillLvl, 22000)) spawned += 1;
      if (this.spawnNecroMinion('skeleton', _hx + Phaser.Math.Between(-75, 75), _hy + Phaser.Math.Between(-50, 50), skillLvl, 22000)) spawned += 1;
      if (this.spawnNecroMinion('mage', _hx + Phaser.Math.Between(-90, 90), _hy + Phaser.Math.Between(-60, 60), skillLvl, 22000)) spawned += 1;
      if (spawned === 0) {
        nv?.playSeq16('seq16_n_bone_burst', _hx, _hy - 8, 1.18, 20, 16);
        this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 26);
        _aoe(_hx, _hy, 270, (2.10 + skillLvl * 0.30) * boneMult, '#e2e8f0', '🦴獻祭骨爆 ', ['vulnerable']);
      } else {
        this.spawnFloatingText(_hx, _hy - 78, `💀 亡靈喚醒 +${spawned}`, '#5eead4', 13);
      }
      return;
    }

    if (skillId === 'blood_golem') {
      // 召喚／指令猛擊 4 幀動態鮮血魔像＋掉落 2 顆鮮血球（若已獻祭則改為鮮血衝擊波）
      const ok = this.spawnNecroMinion('golem', _tx, _ty, skillLvl, 24000);
      nv?.playSeq16('seq16_n_blood_surge', _tx, _ty - 10, 1.18, 18, 18);
      nv?.spawnGroundDecal('blood', _tx, _ty, 0.96, 1800);
      _aoe(_tx, _ty, 240, (2.15 + skillLvl * 0.34) * (ok ? 1.0 : 1.35), '#fb7185', ok ? '🩸魔像猛擊 ' : '🩸獻祭血爆 ', ['bleed', 'vulnerable']);
      this.spawnNecroBloodOrb(_tx - 24, _ty);
      this.spawnNecroBloodOrb(_tx + 24, _ty);
      return;
    }

    if (skillId === 'undead_frenzy') {
      // 亡靈狂熱（全軍團 6 秒攻速＋50%、續命＋5 秒、英雄回血回魂能）
      this.necroFrenzyUntil = this.time.now + 6000;
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 26);
      this.healHero(Math.round(this.playerMaxHp * 0.14));
      nv?.playSeq16('seq16_n_soul_rift', _hx, _hy - 10, 1.12, 18, 16);
      (this.necroMinions || []).forEach((mn) => { mn.expiresAt += 5000; });
      this.spawnFloatingText(_hx, _hy - 84, '💀 亡靈狂熱 6s！', '#5eead4', 15);
      return;
    }

    if (skillId === 'wraith_army') {
      // 召喚 4 隻 4 幀動態怨靈自主穿刺敵群
      const count = 3 + (skillLvl >= 4 ? 1 : 0);
      nv?.playSeq16('seq16_n_soul_rift', _hx, _hy - 10, 1.05, 18, 16);
      for (let i = 0; i < count; i++) {
        this.spawnNecroMinion('wraith', _hx + Phaser.Math.Between(-85, 85), _hy + Phaser.Math.Between(-60, 60), skillLvl, 10000);
      }
      _aoe(_tx, _ty, 250, (1.85 + skillLvl * 0.28), '#5eead4', '👻怨靈出擊 ', ['curse'], { shadow: true });
      return;
    }

    // ===================== [R] 終極奧義 =====================
    if (skillId === 'n_army_scourge') {
      // 亡者大軍（5 波交錯自爆骷髏屍爆＋生出 3 具屍體＋2 隻怨靈）
      nv?.spawnGroundDecal('rift', _tx, _ty, 1.25, 2800);
      this.spawnNecroMinion('wraith', _tx - 40, _ty, skillLvl, 11000);
      this.spawnNecroMinion('wraith', _tx + 40, _ty, skillLvl, 11000);
      for (let w = 0; w < 5; w++) {
        this.time.delayedCall(w * 260, () => {
          if (this.isTransitioning) return;
          const bx = _tx + Phaser.Math.Between(-110, 110);
          const by = _ty + Phaser.Math.Between(-75, 75);
          nv?.playSeq16(w % 2 === 0 ? 'seq16_n_corpse_boom' : 'seq16_n_soul_rift', bx, by - 8, 1.22, 18, 18);
          nv?.spawnDebrisBurst(bx, by, 'shadow', 7);
          _aoe(bx, by, 260, (1.85 + skillLvl * 0.30), '#2dd4bf', '☠️亡者大軍 ', ['curse', 'poison'], { forceCrit: true, shadow: true });
          if (w < 3) this.spawnNecroCorpse(bx, by);
        });
      }
      return;
    }

    if (skillId === 'n_blood_wave') {
      // 鮮血巨浪（3 段 480px 前推擊退巨浪＋殘留 3 顆磁吸鮮血球）
      for (let w = 0; w < 3; w++) {
        this.time.delayedCall(w * 240, () => {
          if (this.isTransitioning) return;
          const dist = 140 + w * 145;
          const wx = _hx + Math.cos(_ang) * dist;
          const wy = _hy + Math.sin(_ang) * dist;
          nv?.playSeq16('seq16_n_blood_wave', wx, wy - 10, 1.38, 18, 18);
          nv?.spawnGroundDecal('blood', wx, wy, 1.08, 2200);
          nv?.spawnDebrisBurst(wx, wy, 'blood', 8);
          this.spawnNecroBloodOrb(wx, wy);
          for (const m of [...this.monsters]) {
            if (!m || m.hp <= 0 || !m.sprite) continue;
            if (Phaser.Math.Distance.Between(wx, wy, m.sprite.x, m.sprite.y) <= 235) {
              const kx = Phaser.Math.Clamp(m.sprite.x + Math.cos(_ang) * 115, 80, MAP_W - 80);
              const ky = Phaser.Math.Clamp(m.sprite.y + Math.sin(_ang) * 115, 80, MAP_H - 80);
              this.tweens.add({ targets: m.sprite, x: kx, y: ky, duration: 220, ease: 'Quad.easeOut' });
              _hitOne(m, (2.15 + skillLvl * 0.34), '#f43f5e', '🌊血浪 ', ['bleed', 'chill'], { forceCrit: true });
            }
          }
        });
      }
      return;
    }

    if (skillId === 'n_bone_storm') {
      // 白骨風暴（周身 5 段高暴擊白骨漩渦＋護盾屏障）
      this.necroBoneStormUntil = this.time.now + 2600;
      if (typeof this.grantHeroBarrier === 'function') {
        this.grantHeroBarrier(Math.round(this.playerMaxHp * 0.28), 4500);
      }
      for (let w = 0; w < 5; w++) {
        this.time.delayedCall(w * 420, () => {
          if (!this.hero?.active || this.isTransitioning) return;
          nv?.playSeq16('seq16_n_bone_storm', this.hero.x, this.hero.y - 10, 1.36, 16, 18);
          nv?.spawnGroundDecal('bone', this.hero.x, this.hero.y, 1.05, 1800);
          nv?.spawnDebrisBurst(this.hero.x, this.hero.y, 'bone', 7);
          _aoe(this.hero.x, this.hero.y, 345, (1.80 + skillLvl * 0.30) * boneMult, '#e2e8f0', '🦴骨風暴 ', ['vulnerable', 'bleed'], { forceCrit: true });
        });
      }
      return;
    }

    if (skillId === 'n_soul_rift') {
      // 靈魂裂隙（4 段深淵裂縫吸收魂能＋持續觸發暗影枯萎）
      nv?.spawnGroundDecal('rift', _tx, _ty, 1.24, 2600);
      for (let w = 0; w < 4; w++) {
        this.time.delayedCall(w * 360, () => {
          if (this.isTransitioning) return;
          nv?.playSeq16('seq16_n_soul_rift', _tx, _ty - 10, 1.36, 16, 18);
          nv?.spawnDebrisBurst(_tx, _ty, 'shadow', 7);
          this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 12);
          _aoe(_tx, _ty, 330, (1.95 + skillLvl * 0.32), '#2dd4bf', '🔮靈魂裂隙 ', ['curse', 'vulnerable'], { forceCrit: w === 3, shadow: true });
        });
      }
      return;
    }
  },
};
