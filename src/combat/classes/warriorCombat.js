// v266: WARRIOR 職業獨立戰鬥模組（抽離自 BattleScene.js，透過 prototype 零開銷掛接）
const MAP_W = 4096;
const MAP_H = 2304;

export const warriorCombatMethods = {
  getWarriorD4LiveMult() {
    const st = this.getState();
    const ks = st?.activeKeystone?.warrior || '';
    const now = this.time?.now || 0;
    let mult = 1.0;
    if (now < (this.warriorBerserkUntil || 0)) {
      mult *= (ks === 'wk_unconstrained' ? 1.55 : 1.25);
    }
    if (now < (this.warriorFrenzyUntil || 0) && (this.warriorFrenzyStacks || 0) > 0) {
      mult *= (1 + this.warriorFrenzyStacks * 0.06);
    }
    if (ks === 'wk_walking_arsenal' && (this.warriorArsenalSet?.size || 0) >= 3) {
      mult *= 1.55;
    }
    return mult;
  },

  trackWarriorArsenal(cat) {
    if (!this.warriorArsenalSet) this.warriorArsenalSet = new Set();
    this.warriorArsenalSet.add(cat);
    if (this.warriorArsenalSet.size >= 3 && this.getState()?.activeKeystone?.warrior === 'wk_walking_arsenal') {
      this.spawnFloatingText(this.hero.x, this.hero.y - 94, '⚔️ 行走武器庫滿層 +55%', '#38bdf8', 13);
    }
  },

  spawnWarriorRageOrb(x, y) {
    if (!this.textures.exists('ent_w_rage_orb')) return null;
    if (!this.warriorRageOrbs) this.warriorRageOrbs = [];
    while (this.warriorRageOrbs.length >= 10) {
      const old = this.warriorRageOrbs.shift();
      if (old?.sprite?.active) old.sprite.destroy();
    }
    const ox = Phaser.Math.Clamp(x + Phaser.Math.Between(-36, 36), 80, MAP_W - 80);
    const oy = Phaser.Math.Clamp(y + Phaser.Math.Between(-24, 24), 80, MAP_H - 80);
    const sp = this.add.image(ox, oy, 'ent_w_rage_orb')
      .setScale(0.24)
      .setAlpha(0)
      .setDepth(Math.max(115, Math.round(oy + 6)));
    this.tweens.add({ targets: sp, scale: 0.44, alpha: 0.96, duration: 190, ease: 'Back.easeOut' });
    const entry = { x: ox, y: oy, sprite: sp, phase: Math.random() * 6.28, expiresAt: this.time.now + 14000 };
    this.warriorRageOrbs.push(entry);
    return entry;
  },

  spawnWarriorEntity(kind, x, y, skillLvl = 1, lifeMs = 12000) {
    const animKeyMap = {
      totem:          'anim_w_totem',
      ancient_axe:    'anim_w_ancient_axe',
      ancient_hammer: 'anim_w_ancient_hammer',
      ancient_leap:   'anim_w_ancient_leap',
    };
    const scaleMap = { totem: 0.56, ancient_axe: 0.54, ancient_hammer: 0.58, ancient_leap: 0.54 };
    const capMap = { totem: 2, ancient_axe: 1, ancient_hammer: 1, ancient_leap: 1 };
    const intervalMap = { totem: 1350, ancient_axe: 880, ancient_hammer: 1220, ancient_leap: 960 };
    const themeMap = { totem: 'fire', ancient_axe: 'gold', ancient_hammer: 'gold', ancient_leap: 'blood' };

    const key = animKeyMap[kind];
    if (!key || !this.textures.exists(key)) return false;
    if (!this.warriorEntities) this.warriorEntities = [];

    const existing = this.warriorEntities.filter((e) => e.kind === kind);
    if (existing.length >= (capMap[kind] || 1)) {
      const oldest = existing[0];
      oldest.expiresAt = this.time.now + lifeMs;
      oldest.skillLvl = Math.max(oldest.skillLvl, skillLvl);
      oldest.x = Phaser.Math.Clamp(x, 80, MAP_W - 80);
      oldest.y = Phaser.Math.Clamp(y, 80, MAP_H - 80);
      this.warriorVfx?.spawnSummonPoof(oldest.x, oldest.y, themeMap[kind]);
      return true;
    }

    const mx = Phaser.Math.Clamp(x, 80, MAP_W - 80);
    const my = Phaser.Math.Clamp(y, 80, MAP_H - 80);
    const shadow = this.add.ellipse(mx, my + 14, kind === 'totem' ? 48 : 42, 16, 0x050507, 0.54)
      .setDepth(Math.max(50, Math.round(my - 2)));
    const sp = this.add.sprite(mx, my - 12, key, 0)
      .setScale(scaleMap[kind])
      .setDepth(Math.max(120, Math.round(my + 10)));
    if (this.anims.exists(key)) sp.play(key);
    this.warriorVfx?.spawnSummonPoof(mx, my, themeMap[kind]);

    this.warriorEntities.push({
      kind,
      x: mx,
      y: my,
      sprite: sp,
      shadow,
      skillLvl,
      interval: intervalMap[kind],
      atkCd: 280 + Math.random() * 200,
      expiresAt: this.time.now + lifeMs,
      phase: Math.random() * 6.28,
      theme: themeMap[kind],
      homeOffX: Phaser.Math.Between(-95, 95),
      homeOffY: Phaser.Math.Between(-65, 65),
    });
    return true;
  },

  updateWarriorBattlefieldEntities(delta) {
    const now = this.time.now;
    const dtSec = delta / 1000;
    const st = this.getState();

    // 1. 狂怒無拘狂暴期間每秒額外回怒
    if (st?.classId === 'warrior' && now < (this.warriorBerserkUntil || 0) && st?.activeKeystone?.warrior === 'wk_unconstrained') {
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 6 * dtSec);
    }

    // 2. 磁吸怒氣血珠拾取
    if (this.warriorRageOrbs && this.warriorRageOrbs.length > 0 && this.hero) {
      for (let i = this.warriorRageOrbs.length - 1; i >= 0; i--) {
        const orb = this.warriorRageOrbs[i];
        if (!orb?.sprite?.active || now >= orb.expiresAt) {
          if (orb?.sprite?.active) orb.sprite.destroy();
          this.warriorRageOrbs.splice(i, 1);
          continue;
        }
        orb.phase += dtSec * 5.2;
        const dist = Phaser.Math.Distance.Between(orb.x, orb.y, this.hero.x, this.hero.y);
        if (dist <= 260) {
          const ang = Phaser.Math.Angle.Between(orb.x, orb.y, this.hero.x, this.hero.y);
          orb.x += Math.cos(ang) * 360 * dtSec;
          orb.y += Math.sin(ang) * 360 * dtSec;
        }
        orb.sprite.setPosition(orb.x, orb.y - 6 + Math.sin(orb.phase) * 4);
        orb.sprite.setDepth(Math.max(118, Math.round(orb.y + 8)));
        if (dist <= 44) {
          orb.sprite.destroy();
          this.warriorRageOrbs.splice(i, 1);
          const rallyMult = now < (this.warriorRallyUntil || 0) ? 1.65 : 1.0;
          this.playerMp = Math.min(this.playerMaxMp, this.playerMp + Math.round(12 * rallyMult));
          this.healHero(Math.round(this.playerMaxHp * 0.06));
          this.warriorVfx?.spawnDebrisBurst(this.hero.x, this.hero.y - 8, 'fire', 4);
        }
      }
    }

    // 3. 動態火山圖騰與 3 位上古先祖英靈自主鎖敵與戰鬥
    if (this.warriorEntities && this.warriorEntities.length > 0) {
      const stats = this.getStats();
      const mult = this.getWarriorD4LiveMult();
      const rallied = now < (this.warriorRallyUntil || 0);
      const cdFactor = rallied ? 0.68 : 1.0;

      for (let i = this.warriorEntities.length - 1; i >= 0; i--) {
        const ent = this.warriorEntities[i];
        if (!ent?.sprite?.active || now >= ent.expiresAt) {
          this.warriorVfx?.spawnSummonPoof(ent.x, ent.y, ent.theme || 'gold');
          if (ent?.sprite?.active) ent.sprite.destroy();
          if (ent?.shadow?.active) ent.shadow.destroy();
          this.warriorEntities.splice(i, 1);
          continue;
        }
        ent.phase += dtSec * 4.0;
        const tgt = this.findNearestMonster(ent.x, ent.y, 700);
        const isStatic = ent.kind === 'totem';
        const spd = ent.kind === 'ancient_leap' ? 275 : (ent.kind === 'ancient_axe' ? 235 : 195);

        if (!isStatic) {
          if (tgt && tgt.sprite && tgt.hp > 0) {
            const dist = Phaser.Math.Distance.Between(ent.x, ent.y, tgt.sprite.x, tgt.sprite.y);
            const ang = Phaser.Math.Angle.Between(ent.x, ent.y, tgt.sprite.x, tgt.sprite.y);
            if (dist > 54) {
              ent.x += Math.cos(ang) * spd * dtSec;
              ent.y += Math.sin(ang) * spd * dtSec;
            }
            ent.sprite.setFlipX(tgt.sprite.x < ent.x);
          } else if (this.hero) {
            const hx = this.hero.x + ent.homeOffX;
            const hy = this.hero.y + ent.homeOffY;
            if (Phaser.Math.Distance.Between(ent.x, ent.y, hx, hy) > 42) {
              const angH = Phaser.Math.Angle.Between(ent.x, ent.y, hx, hy);
              ent.x += Math.cos(angH) * spd * dtSec;
              ent.y += Math.sin(angH) * spd * dtSec;
              ent.sprite.setFlipX(hx < ent.x);
            }
          }
        }

        if (ent.shadow?.active) {
          ent.shadow.setPosition(ent.x, ent.y + 14);
          ent.shadow.setDepth(Math.max(50, Math.round(ent.y - 2)));
        }
        const bob = isStatic ? 0 : Math.sin(ent.phase) * 2.5;
        ent.sprite.setPosition(ent.x, ent.y - 12 + bob);
        ent.sprite.setDepth(Math.max(120, Math.round(ent.y + 10)));

        ent.atkCd -= delta;
        if (ent.atkCd <= 0 && tgt && tgt.sprite && tgt.hp > 0) {
          const hitRange = isStatic ? 260 : 125;
          if (Phaser.Math.Distance.Between(ent.x, ent.y, tgt.sprite.x, tgt.sprite.y) <= hitRange) {
            ent.atkCd = ent.interval * cdFactor;
            const baseDmg = Math.max(1, Math.round(stats.atk * (0.95 + ent.skillLvl * 0.14) * mult));
            this.tweens.add({ targets: ent.sprite, scaleX: ent.sprite.scaleX * 1.15, scaleY: ent.sprite.scaleY * 1.15, duration: 90, yoyo: true });

            if (ent.kind === 'totem') {
              this.warriorVfx?.playSeq16('seq16_w_fissure', ent.x, ent.y - 6, 0.85, 18, 14);
              this.warriorVfx?.spawnGroundDecal('lava', ent.x, ent.y, 0.72, 1400);
              for (const m of [...this.monsters]) {
                if (m && m.hp > 0 && m.sprite && Phaser.Math.Distance.Between(ent.x, ent.y, m.sprite.x, m.sprite.y) <= 245) {
                  this.damageMonster(m, baseDmg, false, false, '#fb923c', '🌋圖騰 ', true);
                }
              }
            } else if (ent.kind === 'ancient_axe') {
              this.warriorVfx?.playSeq16('seq16_w_whirlwind', ent.x, ent.y - 8, 0.72, 22, 16);
              for (const m of [...this.monsters]) {
                if (m && m.hp > 0 && m.sprite && Phaser.Math.Distance.Between(ent.x, ent.y, m.sprite.x, m.sprite.y) <= 175) {
                  this.damageMonster(m, Math.round(baseDmg * 1.15), false, false, '#fbbf24', '🪓先祖斧 ', true);
                }
              }
            } else if (ent.kind === 'ancient_hammer') {
              this.warriorVfx?.playSeq16('seq16_w_hammer_slam', tgt.sprite.x, tgt.sprite.y - 6, 0.78, 20, 16);
              this.warriorVfx?.spawnGroundDecal('crater', tgt.sprite.x, tgt.sprite.y, 0.65, 1500);
              for (const m of [...this.monsters]) {
                if (m && m.hp > 0 && m.sprite && Phaser.Math.Distance.Between(tgt.sprite.x, tgt.sprite.y, m.sprite.x, m.sprite.y) <= 185) {
                  m.stunUntil = Math.max(m.stunUntil || 0, now + 900);
                  this.damageMonster(m, Math.round(baseDmg * 1.38), true, false, '#fde047', '🔨先祖錘 ', true);
                }
              }
            } else if (ent.kind === 'ancient_leap') {
              this.warriorVfx?.playSeq16('seq16_w_rend_burst', tgt.sprite.x, tgt.sprite.y - 8, 0.76, 22, 16);
              tgt.bleedUntil = Math.max(tgt.bleedUntil || 0, now + 4500);
              this.damageMonster(tgt, Math.round(baseDmg * 1.42), true, false, '#f87171', '⚔️先祖刃 ', true);
            }
          }
        }
      }
    }
  },

  castWarriorSkill(skillId, skillLvl, stats, isManual = false) {
    const _hx = this.hero.x, _hy = this.hero.y;
    const aim = this.getAimPoint(isManual, 440);
    const nearest = this.findNearestMonster(_hx, _hy);
    const _tx = isManual ? aim.x : (nearest ? nearest.sprite.x : aim.x);
    const _ty = isManual ? aim.y : (nearest ? nearest.sprite.y : aim.y);
    const _ang = Phaser.Math.Angle.Between(_hx, _hy, _tx, _ty);

    this.faceHeroToward(_tx, _ty);
    this.triggerHeroAttackAnim(380);
    if (this.anims.exists(`w_${this.heroDir}_atk`)) {
      this.hero.play(`w_${this.heroDir}_atk`, false);
    }

    const st = this.getState();
    const ks = st?.activeKeystone?.warrior || '';
    const wv = this.warriorVfx;
    const now = this.time.now;
    const liveMult = (stats.skillDmgMult || 1) * this.getWarriorD4LiveMult();
    const rallyMult = now < (this.warriorRallyUntil || 0) ? 1.65 : 1.0;
    const gainRage = (amt) => {
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + Math.round(amt * rallyMult));
    };

    const _hitOne = (m, mult, col, pre, stList = [], opts = {}) => {
      if (!m || m.hp <= 0 || !m.sprite) return false;
      const isBleed = now < (m.bleedUntil || 0);
      const isC = opts.forceCrit || (opts.bleedCrit && isBleed) || (Math.random() * 100 < (stats.critRate + (opts.bonusCrit || 0)));
      const bleedAmp = (opts.bleedAmp && isBleed) ? opts.bleedAmp : 1.0;
      const d = Math.max(1, Math.round(stats.atk * mult * liveMult * bleedAmp * (isC ? stats.critDmg / 100 : 1)));
      if (!m._statuses) m._statuses = {};
      stList.forEach((k) => {
        m._statuses[k] = Math.max(m._statuses[k] || 0, now + 5000);
        if (k === 'bleed') { m.bleedUntil = Math.max(m.bleedUntil || 0, now + 4800); m.bleedDmg = Math.max(m.bleedDmg || 0, Math.round(stats.atk * 0.28)); }
        if (k === 'stun') m.stunUntil = Math.max(m.stunUntil || 0, now + (opts.stunMs || 1300));
        if (k === 'vulnerable') m.markedUntil = Math.max(m.markedUntil || 0, now + 5000);
      });
      this.damageMonster(m, d, isC, false, col, pre);
      // 餘震轟鳴關鍵被動觸發
      if (ks === 'wk_aftershock' && !opts.noAftershock && Math.random() < 0.35 && m.hp > 0) {
        wv?.playSeq16('seq16_w_earth_stomp', m.sprite.x, m.sprite.y - 4, 0.52, 24, 12);
        this.damageMonster(m, Math.max(1, Math.round(stats.atk * 0.65 * liveMult)), false, false, '#fb923c', '🌋餘震 ', true);
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
        if (Math.abs(Phaser.Math.Angle.Wrap(mAng - dirAng)) <= halfArcRad || dist <= 52) {
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
        if (proj < -24 || proj > length) continue;
        if (Math.abs(-dx * sinA + dy * cosA) <= halfWidth) {
          if (_hitOne(m, mult, col, pre, stList, opts)) hitList.push(m);
        }
      }
      return hitList;
    };

    // ===================== [1] 基礎產怒（0 耗怒） =====================
    if (skillId === 'w_rend_slash') {
      this.trackWarriorArsenal('slash');
      const sx = _hx + Math.cos(_ang) * 90, sy = _hy + Math.sin(_ang) * 90;
      wv?.playSeq16('seq16_w_rend_burst', sx, sy - 8, 0.84, 22, 14);
      wv?.spawnGroundDecal('blood', sx, sy, 0.62, 1500);
      wv?.spawnDebrisBurst(sx, sy, 'blood', 6);
      gainRage(14);
      _cone(_hx, _hy, _ang, 1.18, 225, (1.35 + skillLvl * 0.18), '#f87171', '🩸撕裂 ', ['bleed']);
      return;
    }

    if (skillId === 'w_lunging_strike') {
      this.trackWarriorArsenal('slash');
      const dist = Math.min(240, Phaser.Math.Distance.Between(_hx, _hy, _tx, _ty));
      const nx = Phaser.Math.Clamp(_hx + Math.cos(_ang) * Math.max(60, dist - 34), 80, MAP_W - 80);
      const ny = Phaser.Math.Clamp(_hy + Math.sin(_ang) * Math.max(60, dist - 34), 80, MAP_H - 80);
      this.tweens.add({ targets: this.hero, x: nx, y: ny, duration: 150, ease: 'Quad.easeOut' });
      wv?.playSeq16('seq16_w_rend_burst', nx, ny - 8, 0.82, 22, 16);
      wv?.spawnDebrisBurst(nx, ny, 'fire', 6);
      gainRage(14);
      _aoe(nx, ny, 165, (1.40 + skillLvl * 0.18), '#fb923c', '⚔️突進 ', ['bleed']);
      return;
    }

    if (skillId === 'w_frenzy_flurry') {
      this.trackWarriorArsenal('slash');
      this.warriorFrenzyStacks = Math.min(5, (this.warriorFrenzyStacks || 0) + 1);
      this.warriorFrenzyUntil = now + 5000;
      gainRage(12);
      const tgt = nearest;
      const fx = tgt ? tgt.sprite.x : _tx, fy = tgt ? tgt.sprite.y : _ty;
      wv?.playSeq16('seq16_w_rend_burst', fx, fy - 8, 0.68, 24, 14);
      if (tgt) {
        _hitOne(tgt, (0.82 + skillLvl * 0.12), '#fb923c', '🪓狂亂 ', ['vulnerable']);
        this.time.delayedCall(150, () => {
          if (tgt.hp > 0) {
            wv?.spawnDebrisBurst(tgt.sprite.x, tgt.sprite.y, 'fire', 4);
            _hitOne(tgt, (0.82 + skillLvl * 0.12), '#fbbf24', '🪓二連 ', []);
          }
        });
      }
      return;
    }

    if (skillId === 'w_bash_crush') {
      this.trackWarriorArsenal('crush');
      this.warriorBashCount = (this.warriorBashCount || 0) + 1;
      const forceOp = this.warriorBashCount % 4 === 0;
      gainRage(15);
      const tgt = nearest;
      const bx = tgt ? tgt.sprite.x : _tx, by = tgt ? tgt.sprite.y : _ty;
      wv?.playSeq16('seq16_w_hammer_slam', bx, by - 6, forceOp ? 0.88 : 0.66, 22, 14);
      wv?.spawnGroundDecal('crater', bx, by, 0.56, 1400);
      if (tgt) {
        _hitOne(tgt, (1.45 + skillLvl * 0.20) * (forceOp ? 1.65 : 1.0), forceOp ? '#38bdf8' : '#fde047', forceOp ? '🔨壓制重鎚 ' : '🔨重鎚 ', ['stun', 'vulnerable'], { forceCrit: forceOp, stunMs: 1200 });
      }
      return;
    }

    // ===================== [2] 核心耗怒輸出 =====================
    if (skillId === 'whirlwind') {
      this.trackWarriorArsenal('slash');
      for (let w = 0; w < 4; w++) {
        this.time.delayedCall(w * 260, () => {
          if (!this.hero?.active || this.isTransitioning) return;
          wv?.playSeq16('seq16_w_whirlwind', this.hero.x, this.hero.y - 8, 1.15, 22, 16);
          wv?.spawnDebrisBurst(this.hero.x, this.hero.y, 'fire', 5);
          this.healHero(Math.round(this.playerMaxHp * 0.025));
          _aoe(this.hero.x, this.hero.y, 240, (0.92 + skillLvl * 0.16), '#fb923c', '🌪️旋風 ', ['bleed'], { bleedAmp: 1.25 });
        });
      }
      return;
    }

    if (skillId === 'w_ancient_hammer') {
      this.trackWarriorArsenal('crush');
      wv?.playSeq16('seq16_w_hammer_slam', _tx, _ty - 10, 1.28, 20, 18);
      wv?.spawnGroundDecal('crater', _tx, _ty, 1.05, 2200);
      wv?.spawnDebrisBurst(_tx, _ty, 'rock', 10);
      _aoe(_tx, _ty, 255, (2.50 + skillLvl * 0.34), '#fde047', '🔨上古之錘 ', ['vulnerable', 'stun'], { bonusCrit: 25, stunMs: 900 });
      return;
    }

    if (skillId === 'w_upheaval_wave') {
      this.trackWarriorArsenal('crush');
      const sx = _hx + Math.cos(_ang) * 165, sy = _hy + Math.sin(_ang) * 165;
      wv?.playSeq16('seq16_w_fissure', sx, sy - 6, 1.28, 18, 16);
      wv?.spawnGroundDecal('lava', sx, sy, 1.05, 2000);
      [-0.32, 0, 0.32].forEach((off) => {
        const a = _ang + off;
        wv?.launchProjectile('proj_w_rock_shard', _hx, _hy - 8, _hx + Math.cos(a) * 400, _hy + Math.sin(a) * 400, 0.56, 220, 'rock');
      });
      _cone(_hx, _hy, _ang, 0.96, 420, (2.35 + skillLvl * 0.32), '#f97316', '🌋動地裂波 ', ['burn', 'vulnerable']);
      return;
    }

    if (skillId === 'w_double_swing') {
      this.trackWarriorArsenal('slash');
      const sx = _hx + Math.cos(_ang) * 95, sy = _hy + Math.sin(_ang) * 95;
      wv?.playSeq16('seq16_w_rend_burst', sx, sy - 8, 1.08, 22, 16);
      wv?.spawnDebrisBurst(sx, sy, 'blood', 7);
      let refunded = false;
      for (const m of [...this.monsters]) {
        if (!m || m.hp <= 0 || !m.sprite) continue;
        if (Phaser.Math.Distance.Between(sx, sy, m.sprite.x, m.sprite.y) <= 215) {
          if (!refunded && (now < (m.stunUntil || 0) || now < (m.markedUntil || 0))) {
            refunded = true;
            gainRage(14);
          }
          _hitOne(m, (2.20 + skillLvl * 0.30), '#f87171', '🪓交叉斬 ', ['vulnerable']);
        }
      }
      return;
    }

    // ===================== [3] 防禦與戰吼 =====================
    if (skillId === 'w_iron_skin') {
      const shieldAmt = Math.round(this.playerMaxHp * (0.35 + skillLvl * 0.03));
      if (typeof this.grantHeroBarrier === 'function') this.grantHeroBarrier(shieldAmt, 5500);
      this.healHero(Math.round(this.playerMaxHp * 0.18));
      wv?.playSeq16('seq16_w_warcry', _hx, _hy - 8, 1.15, 18, 16);
      wv?.spawnGroundDecal('rune', _hx, _hy, 0.95, 2000);
      _aoe(_hx, _hy, 240, (1.45 + skillLvl * 0.20), '#cbd5e1', '🛡️鋼鐵戰膚 ', ['vulnerable']);
      return;
    }

    if (skillId === 'warcry') {
      const dur = ks === 'wk_unconstrained' ? 9000 : 6000;
      this.warriorBerserkUntil = Math.max(this.warriorBerserkUntil || 0, now + dur);
      wv?.playSeq16('seq16_w_warcry', _hx, _hy - 8, 1.28, 18, 16);
      wv?.spawnGroundDecal('rune', _hx, _hy, 1.05, 2200);
      this.spawnFloatingText(_hx, _hy - 84, `🔥 狂暴 ${Math.round(dur / 1000)}s！`, '#fbbf24', 15);
      _aoe(_hx, _hy, 320, (1.30 + skillLvl * 0.18), '#fbbf24', '📣血吼 ', ['vulnerable']);
      this.spawnWarriorRageOrb(_hx + 34, _hy);
      return;
    }

    if (skillId === 'w_challenging_shout') {
      this.thornsModUntil = Math.max(this.thornsModUntil || 0, now + 5000);
      this.warriorGuardUntil = Math.max(this.warriorGuardUntil || 0, now + 5000);
      this.warriorGuardStacks = 5;
      wv?.playSeq16('seq16_w_warcry', _hx, _hy - 8, 1.24, 18, 16);
      wv?.spawnGroundDecal('rune', _hx, _hy, 1.02, 2200);
      _aoe(_hx, _hy, 340, (1.20 + skillLvl * 0.18), '#fb923c', '🛡️挑戰怒吼 ', ['vulnerable']);
      return;
    }

    if (skillId === 'w_rallying_cry') {
      this.warriorRallyUntil = Math.max(this.warriorRallyUntil || 0, now + 6000);
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 24);
      this.healHero(Math.round(this.playerMaxHp * 0.15));
      (this.warriorEntities || []).forEach((e) => { e.expiresAt += 4000; });
      wv?.playSeq16('seq16_w_warcry', _hx, _hy - 8, 1.22, 18, 16);
      wv?.spawnGroundDecal('rune', _hx, _hy, 1.0, 2000);
      this.spawnFloatingText(_hx, _hy - 84, '🚩 集結戰吼！回怒 +65%', '#fde047', 14);
      return;
    }

    // ===================== [4] 搏鬥位移與控場 =====================
    if (skillId === 'bloodcharge') {
      this.trackWarriorArsenal('brawl');
      const endX = Phaser.Math.Clamp(_hx + Math.cos(_ang) * 350, 90, MAP_W - 90);
      const endY = Phaser.Math.Clamp(_hy + Math.sin(_ang) * 350, 90, MAP_H - 90);
      this.tweens.add({ targets: this.hero, x: endX, y: endY, duration: 220, ease: 'Cubic.easeOut' });
      wv?.playSeq16('seq16_w_rend_burst', endX, endY - 8, 1.15, 20, 16);
      wv?.spawnGroundDecal('blood', endX, endY, 0.92, 1800);
      this.healHero(Math.round(this.playerMaxHp * (0.10 + skillLvl * 0.015)));
      const hits = _line(_hx, _hy, _ang, 370, 72, (1.95 + skillLvl * 0.28), '#f87171', '🩸血怒衝鋒 ', ['bleed']);
      hits.forEach((m) => {
        if (m.hp > 0 && m.sprite) {
          this.tweens.add({ targets: m.sprite, x: endX + Phaser.Math.Between(-35, 35), y: endY + Phaser.Math.Between(-25, 25), duration: 200, ease: 'Quad.easeOut' });
        }
      });
      return;
    }

    if (skillId === 'earth_stomp') {
      this.trackWarriorArsenal('brawl');
      wv?.playSeq16('seq16_w_earth_stomp', _hx, _hy - 6, 1.32, 18, 18);
      wv?.spawnGroundDecal('crater', _hx, _hy, 1.10, 2200);
      wv?.spawnDebrisBurst(_hx, _hy, 'rock', 10);
      gainRage(18);
      for (const m of [...this.monsters]) {
        if (!m || m.hp <= 0 || !m.sprite) continue;
        if (Phaser.Math.Distance.Between(_hx, _hy, m.sprite.x, m.sprite.y) <= 325) {
          this.tweens.add({ targets: m.sprite, x: _hx + Phaser.Math.Between(-45, 45), y: _hy + Phaser.Math.Between(-35, 35), duration: 230, ease: 'Cubic.easeOut' });
        }
      }
      _aoe(_hx, _hy, 325, (1.75 + skillLvl * 0.24), '#fbbf24', '🌋大地踐踏 ', ['stun', 'vulnerable'], { stunMs: 1800 });
      return;
    }

    if (skillId === 'w_chain_grasp') {
      this.trackWarriorArsenal('brawl');
      [-0.36, 0, 0.36].forEach((off) => {
        const a = _ang + off;
        wv?.launchProjectile('proj_w_chain_hook', _hx, _hy - 10, _hx + Math.cos(a) * 360, _hy + Math.sin(a) * 360, 0.56, 180, 'fire');
      });
      const pulled = _cone(_hx, _hy, _ang, 0.85, 385, (1.80 + skillLvl * 0.24), '#fb923c', '⛓️鎖鏈拖曳 ', ['vulnerable', 'burn']);
      for (const m of [...this.monsters]) {
        if (!m || m.hp <= 0 || !m.sprite) continue;
        if (Phaser.Math.Distance.Between(_hx, _hy, m.sprite.x, m.sprite.y) <= 385) {
          const destX = _hx + Math.cos(_ang) * 58 + Phaser.Math.Between(-24, 24);
          const destY = _hy + Math.sin(_ang) * 58 + Phaser.Math.Between(-20, 20);
          this.tweens.add({ targets: m.sprite, x: destX, y: destY, duration: 240, ease: 'Cubic.easeOut' });
        }
      }
      if (pulled > 0) wv?.playSeq16('seq16_w_maelstrom', _hx + Math.cos(_ang) * 65, _hy + Math.sin(_ang) * 65, 0.82, 22, 16);
      return;
    }

    if (skillId === 'w_leap_slam') {
      this.trackWarriorArsenal('brawl');
      const dist = Math.min(380, Phaser.Math.Distance.Between(_hx, _hy, _tx, _ty));
      const lx = Phaser.Math.Clamp(_hx + Math.cos(_ang) * dist, 90, MAP_W - 90);
      const ly = Phaser.Math.Clamp(_hy + Math.sin(_ang) * dist, 90, MAP_H - 90);
      this.tweens.add({ targets: this.hero, x: lx, y: ly, duration: 260, ease: 'Quad.easeInOut' });
      this.time.delayedCall(250, () => {
        if (this.isTransitioning) return;
        wv?.playSeq16('seq16_w_earth_stomp', lx, ly - 8, 1.24, 18, 18);
        wv?.spawnGroundDecal('crater', lx, ly, 1.02, 2000);
        wv?.spawnDebrisBurst(lx, ly, 'rock', 9);
        gainRage(20);
        _aoe(lx, ly, 265, (2.10 + skillLvl * 0.28), '#fbbf24', '🦅戰神躍擊 ', ['stun', 'vulnerable'], { stunMs: 1100 });
      });
      return;
    }

    // ===================== [E] 武器精通與動態圖騰 =====================
    if (skillId === 'bladestorm') {
      this.trackWarriorArsenal('slash');
      [-0.24, 0, 0.24].forEach((off) => {
        const a = _ang + off;
        const ex = _hx + Math.cos(a) * 500, ey = _hy + Math.sin(a) * 500;
        wv?.launchProjectile('proj_w_flame_wave', _hx, _hy - 12, ex, ey, 0.70, 230, 'fire', () => {
          wv?.spawnDebrisBurst(ex, ey, 'fire', 4);
        });
        _line(_hx, _hy, a, 510, 52, (1.55 + skillLvl * 0.24), '#fb923c', '🔥烈焰劍氣 ', ['burn'], { bleedCrit: true });
      });
      return;
    }

    if (skillId === 'w_rupture_impale') {
      this.trackWarriorArsenal('slash');
      wv?.playSeq16('seq16_w_rend_burst', _tx, _ty - 8, 1.28, 20, 18);
      wv?.spawnGroundDecal('blood', _tx, _ty, 1.05, 2200);
      wv?.spawnDebrisBurst(_tx, _ty, 'blood', 10);
      let hadBleed = false;
      for (const m of [...this.monsters]) {
        if (!m || m.hp <= 0 || !m.sprite) continue;
        if (Phaser.Math.Distance.Between(_tx, _ty, m.sprite.x, m.sprite.y) <= 235) {
          const isB = now < (m.bleedUntil || 0);
          if (isB) hadBleed = true;
          _hitOne(m, (2.25 + skillLvl * 0.30) * (isB ? 1.85 : 1.0), '#ef4444', isB ? '🩸血爆引爆 ' : '⚔️貫穿 ', ['bleed'], { forceCrit: isB });
        }
      }
      if (hadBleed) this.healHero(Math.round(this.playerMaxHp * 0.14));
      return;
    }

    if (skillId === 'volcano_totem') {
      this.trackWarriorArsenal('crush');
      this.spawnWarriorEntity('totem', _tx, _ty, skillLvl, 14000);
      wv?.playSeq16('seq16_w_fissure', _tx, _ty - 6, 1.05, 18, 16);
      wv?.spawnGroundDecal('lava', _tx, _ty, 0.96, 2200);
      _aoe(_tx, _ty, 240, (1.35 + skillLvl * 0.20), '#f97316', '🌋火山圖騰 ', ['burn']);
      return;
    }

    if (skillId === 'w_seismic_fissure') {
      this.trackWarriorArsenal('crush');
      for (let w = 0; w < 3; w++) {
        this.time.delayedCall(w * 200, () => {
          if (this.isTransitioning) return;
          const dist = 135 + w * 145;
          const fx = _hx + Math.cos(_ang) * dist, fy = _hy + Math.sin(_ang) * dist;
          wv?.playSeq16('seq16_w_fissure', fx, fy - 6, 1.18, 18, 16);
          wv?.spawnGroundDecal('lava', fx, fy, 0.95, 2200);
          wv?.spawnDebrisBurst(fx, fy, 'rock', 7);
          _aoe(fx, fy, 200, (1.45 + skillLvl * 0.22), '#f97316', '🌋熔岩裂縫 ', ['burn', 'vulnerable']);
        });
      }
      return;
    }

    // ===================== [R] 終極毀滅奧義 =====================
    if (skillId === 'w_call_ancients') {
      wv?.playSeq16('seq16_w_warcry', _hx, _hy - 10, 1.38, 16, 18);
      wv?.spawnGroundDecal('rune', _hx, _hy, 1.25, 2800);
      this.spawnWarriorEntity('ancient_axe', _hx - 75, _hy - 20, skillLvl, 12000);
      this.spawnWarriorEntity('ancient_hammer', _hx + 75, _hy - 20, skillLvl, 12000);
      this.spawnWarriorEntity('ancient_leap', _hx, _hy + 55, skillLvl, 12000);
      this.spawnFloatingText(_hx, _hy - 90, '⚔️ 三先祖英靈降臨 12s！', '#fde047', 16);
      _aoe(_tx, _ty, 300, (1.85 + skillLvl * 0.28), '#fde047', '👑先祖降臨 ', ['bleed', 'vulnerable'], { forceCrit: true });
      return;
    }

    if (skillId === 'w_wrath_berserker') {
      const dur = ks === 'wk_unconstrained' ? 10500 : 7000;
      this.warriorBerserkUntil = Math.max(this.warriorBerserkUntil || 0, now + dur);
      this.heroInvulnUntil = Math.max(this.heroInvulnUntil || 0, now + 1800);
      wv?.playSeq16('seq16_w_maelstrom', _hx, _hy - 10, 1.42, 16, 20);
      wv?.spawnGroundDecal('lava', _hx, _hy, 1.20, 2600);
      wv?.spawnDebrisBurst(_hx, _hy, 'fire', 12);
      this.spawnWarriorRageOrb(_hx - 40, _hy);
      this.spawnWarriorRageOrb(_hx + 40, _hy);
      this.spawnFloatingText(_hx, _hy - 92, '🔥 狂戰神降臨！', '#f97316', 17);
      _aoe(_hx, _hy, 340, (3.10 + skillLvl * 0.42), '#f97316', '🔥狂戰神 ', ['burn', 'vulnerable'], { forceCrit: true });
      return;
    }

    if (skillId === 'execute_cleave') {
      this.trackWarriorArsenal('slash');
      const sx = _hx + Math.cos(_ang) * 120, sy = _hy + Math.sin(_ang) * 120;
      wv?.playSeq16('seq16_w_execute', sx, sy - 10, 1.38, 18, 20);
      wv?.spawnGroundDecal('blood', sx, sy, 1.15, 2400);
      wv?.spawnDebrisBurst(sx, sy, 'blood', 11);
      let killedAny = false;
      for (const m of [...this.monsters]) {
        if (!m || m.hp <= 0 || !m.sprite) continue;
        if (Phaser.Math.Distance.Between(sx, sy, m.sprite.x, m.sprite.y) <= 265) {
          const lowHp = m.hp < m.maxHp * 0.5;
          _hitOne(m, (2.85 + skillLvl * 0.38) * (lowHp ? 1.75 : 1.0), '#ef4444', lowHp ? '🪓斷罪斬殺 ' : '🪓斷罪 ', ['bleed', 'vulnerable'], { forceCrit: lowHp });
          if (m.hp <= 0) killedAny = true;
        }
      }
      if (killedAny) {
        this.slotCdTimers = this.slotCdTimers.map((t) => t + 3800);
        this.spawnWarriorRageOrb(sx, sy);
      }
      return;
    }

    if (skillId === 'w_iron_maelstrom') {
      // 武器庫三段終極切換：巨劍旋風 → 戰錘重砸 → 鎖鏈漩渦
      this.trackWarriorArsenal('slash');
      this.trackWarriorArsenal('crush');
      this.trackWarriorArsenal('brawl');
      const stages = [
        { seq: 'seq16_w_whirlwind',   decal: 'blood',  col: '#f87171', pre: '⚔️巨劍旋風 ', st: ['bleed'] },
        { seq: 'seq16_w_hammer_slam', decal: 'crater', col: '#fde047', pre: '🔨戰錘震擊 ', st: ['stun'] },
        { seq: 'seq16_w_maelstrom',   decal: 'lava',   col: '#fb923c', pre: '⛓️鋼鐵漩渦 ', st: ['vulnerable', 'burn'] },
      ];
      stages.forEach((stg, idx) => {
        this.time.delayedCall(idx * 360, () => {
          if (!this.hero?.active || this.isTransitioning) return;
          wv?.playSeq16(stg.seq, this.hero.x, this.hero.y - 10, 1.38, 18, 20);
          wv?.spawnGroundDecal(stg.decal, this.hero.x, this.hero.y, 1.15, 2200);
          wv?.spawnDebrisBurst(this.hero.x, this.hero.y, idx === 0 ? 'blood' : 'fire', 9);
          _aoe(this.hero.x, this.hero.y, 345, (1.95 + skillLvl * 0.28), stg.col, stg.pre, stg.st, { forceCrit: idx === 2 });
        });
      });
      return;
    }
  },
};
