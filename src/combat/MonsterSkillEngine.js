// MonsterSkillEngine.js — v278 全107隻怪物 2.5D 遠近戰主動技能＋實戰判定幾何＋動態召喚實體＋菁英詞綴＋首領二階段引擎
// 設計規範：零震動（Zero Screen Shake）、零音效（Zero Audio）、全局普通怪同時蓄力上限 3 隻（保持戰場可讀性）

const MAP_W = 4096;
const MAP_H = 2304;

export const RANGED_ATK_STYLES = new Set(['imp_fire', 'venom', 'necro_orb']);

export const ELITE_AFFIX_POOL = [
  { id: 'arcane_enchanted', label: '⚡祕法加持', color: '#e879f9', cdMs: 7200 },
  { id: 'frozen_pulse',     label: '❄️極寒脈衝', color: '#38bdf8', cdMs: 6800 },
  { id: 'molten',           label: '🔥熔火行者', color: '#fb923c', cdMs: 4200 },
  { id: 'plague_bearer',    label: '☠️瘟疫之源', color: '#4ade80', cdMs: 6400 },
  { id: 'vampiric_totem',   label: '🩸鮮血圖騰', color: '#fb7185', cdMs: 8500 },
];

export class MonsterSkillEngine {
  constructor(scene, vfx) {
    this.scene = scene;
    this.vfx = vfx;
    this.activeRegularCasts = 0;
    this.maxRegularCasts = 3; // 全局同場普通小怪同時蓄力上限
    this.hazards = [];        // 地面持續區域（熔岩池、劇毒酸液池）
    this.dynamicEntities = []; // 動態召喚實體（祕法哨塔、冰霜追蹤球、深淵小鬼、鮮血圖騰）
    this.enemyProjectiles = []; // 怪物 2.5D 技能投射物
    this.activeTelegraphs = [];
    this.heroBleedUntil = 0;
    this.heroBleedTickAt = 0;
    this.heroBleedDmg = 0;
  }

  clearAll() {
    this.activeRegularCasts = 0;
    for (const t of this.activeTelegraphs) {
      try { t.cancel?.(); } catch (_e) {}
    }
    this.activeTelegraphs = [];
    for (const h of this.hazards) {
      h.sprite?.destroy();
      h.ring?.destroy();
    }
    this.hazards = [];
    for (const e of this.dynamicEntities) {
      this._destroyEntityVisuals(e);
    }
    this.dynamicEntities = [];
    for (const p of this.enemyProjectiles) {
      p.sprite?.destroy();
    }
    this.enemyProjectiles = [];
    this.heroBleedUntil = 0;
  }

  // 依據怪物 atkStyle 決定最佳站位與拉打距離（遠程自動拉打 265~360px）
  getCombatSpacing(m) {
    if (m.isBoss) return { stopRange: 108, kiteMin: 0, isRanged: false };
    const st = m.atkStyle || 'claw';
    if (st === 'imp_fire') return { stopRange: 315, kiteMin: 155, isRanged: true };
    if (st === 'venom')    return { stopRange: 285, kiteMin: 145, isRanged: true };
    if (st === 'necro_orb') return { stopRange: 335, kiteMin: 165, isRanged: true };
    if (st === 'slash')    return { stopRange: 84,  kiteMin: 0,   isRanged: false };
    if (st === 'smash')    return { stopRange: 88,  kiteMin: 0,   isRanged: false };
    return { stopRange: 74, kiteMin: 0, isRanged: false };
  }

  // 初始化怪物技能計時器與菁英詞綴（107 隻全涵蓋）
  ensureMonsterInit(m) {
    if (m._v278Init) return;
    m._v278Init = true;
    const st = m.atkStyle || 'claw';
    m.isRanged = m.isRanged || RANGED_ATK_STYLES.has(st);
    // 錯開首次施法時間，避免整群同時起手
    const baseCd = m.isBoss ? 3600 : (m.isElite || m.isRare ? 4400 : 5200);
    m._skillCdMs = baseCd;
    m._skillTimer = Phaser.Math.Between(900, Math.round(baseCd * 0.72));
    m._skillCycle = 0;
    m._isCastingSkill = false;
    m._bossPhase2 = false;

    // 菁英 / 稀有怪配發 1~2 個暗黑4 詞綴；首領配發 1 個專屬詞綴
    if (m.isElite || m.isRare || m.isBoss) {
      const cnt = (m.isRare && !m.isBoss) ? 2 : 1;
      const pool = Phaser.Utils.Array.Shuffle([...ELITE_AFFIX_POOL]);
      m._affixes = pool.slice(0, cnt);
      m._affixTimers = m._affixes.map((a) => Phaser.Math.Between(1200, Math.round(a.cdMs * 0.65)));
      if (m.nameText && m.nameText.active && !m._affixBadgeAdded) {
        m._affixBadgeAdded = true;
        const tag = m._affixes.map((a) => a.label).join(' ');
        m.nameText.setText(`${m.nameText.text}\n${tag}`);
      }
    }
  }

  // 主迴圈：每幀由 BattleScene.update 呼叫
  update(time, delta, stats) {
    const s = this.scene;
    if (!s || !s.hero || s.isTransitioning || s.trainingArena?.isActive) return;

    // 1. 英雄流血 DoT（來自爪擊飛撲）
    if (this.heroBleedUntil > time && time - this.heroBleedTickAt >= 750) {
      this.heroBleedTickAt = time;
      if (s.playerHp > 1 && this.heroBleedDmg > 0) {
        s.playerHp = Math.max(1, s.playerHp - this.heroBleedDmg);
        s.spawnFloatingText(s.hero.x, s.hero.y - 62, `🩸 -${this.heroBleedDmg}`, '#fb7185', 13);
      }
    }

    // 2. 掃描場上存活怪物，驅動主動技能、菁英詞綴與首領二階段
    for (const m of s.monsters || []) {
      if (!m || m.hp <= 0) {
        if (m && m._moltenPendingDeath) {
          m._moltenPendingDeath = false;
          this._triggerMoltenDeathExplosion(m, stats);
        }
        continue;
      }
      this.ensureMonsterInit(m);
      if (m._affixes?.some((a) => a.id === 'molten')) {
        m._moltenPendingDeath = true;
      }

      if (time < (m.stunUntil || 0)) continue;
      const willChase = !!(m.isAggressive || m.isProvoked);
      if (!willChase) continue;

      const dist = Math.hypot(s.hero.x - m.sprite.x, s.hero.y - m.sprite.y);

      // 首領二階段 (<50% HP)：召喚深淵小鬼＋連續災變
      if (m.isBoss && !m._bossPhase2 && m.maxHp > 0 && m.hp <= m.maxHp * 0.5) {
        this._enterBossPhase2(m, stats);
      }

      // 主動技能冷卻
      if (!m._isCastingSkill) {
        m._skillTimer += delta;
        if (m._skillTimer >= m._skillCdMs && dist <= 580) {
          const isRegular = !m.isBoss && !m.isElite && !m.isRare;
          if (!isRegular || this.activeRegularCasts < this.maxRegularCasts) {
            const fired = this._castMonsterSkill(m, stats, dist, isRegular);
            if (fired) {
              m._skillTimer = 0;
              m._skillCycle = (m._skillCycle || 0) + 1;
            }
          }
        }
      }

      // 菁英詞綴獨立計時
      if (m._affixes && m._affixes.length > 0 && dist <= 600) {
        for (let i = 0; i < m._affixes.length; i++) {
          m._affixTimers[i] += delta;
          if (m._affixTimers[i] >= m._affixes[i].cdMs) {
            m._affixTimers[i] = 0;
            this._triggerEliteAffix(m, m._affixes[i], stats);
          }
        }
      }
    }

    // 3. 更新地面持續傷害區（熔岩池 / 酸液池）
    this._updateHazards(time, delta, stats);

    // 4. 更新動態召喚實體（祕法哨塔 / 冰霜追蹤球 / 深淵小鬼 / 鮮血圖騰）
    this._updateDynamicEntities(time, delta, stats);

    // 5. 更新怪物技能投射物
    this._updateEnemyProjectiles(delta, stats);
  }

  // 供玩家點擊或 AoE 技能擊打「可破壞動態實體（鮮血圖騰 / 深淵小鬼）」
  tryHitDynamicEntity(x, y, radius, dmg) {
    let hitAny = false;
    for (let i = this.dynamicEntities.length - 1; i >= 0; i--) {
      const e = this.dynamicEntities[i];
      if (!e.destructible || e.hp <= 0) continue;
      if (Math.hypot(e.x - x, e.y - y) <= radius + (e.hitRadius || 36)) {
        e.hp -= Math.max(1, Math.round(dmg));
        hitAny = true;
        this.scene.spawnFloatingText(e.x, e.y - 38, `-${Math.round(dmg)}`, '#fde68a', 14);
        this.vfx.spawnDebrisBurst(e.x, e.y - 10, e.kind === 'blood_totem' ? 0xf43f5e : 0xf97316, 6);
        if (e.hpBarFill && e.hpBarFill.active) {
          e.hpBarFill.width = Math.max(0, 48 * (Math.max(0, e.hp) / e.maxHp));
        }
        if (e.hp <= 0) {
          this.scene.spawnFloatingText(e.x, e.y - 54, e.kind === 'blood_totem' ? '💥 圖騰粉碎！' : '💥 小鬼擊破！', '#34d399', 15);
          this._destroyEntityVisuals(e);
          this.dynamicEntities.splice(i, 1);
        }
      }
    }
    return hitAny;
  }

  // ═══════════════════════════════════════════════════════════════
  // 7 大 atkStyle 怪物主動技能分派（107 隻全覆蓋，遠近戰皆有）
  // ═══════════════════════════════════════════════════════════════
  _castMonsterSkill(m, stats, dist, isRegular) {
    const st = m.atkStyle || 'claw';
    if (m.isBoss || st === 'boss_cleave') {
      return this._skillBossSuite(m, stats);
    }
    if (st === 'claw')      return this._skillClawLeap(m, stats, isRegular);
    if (st === 'slash')     return this._skillSlashDual(m, stats, dist, isRegular);
    if (st === 'smash')     return this._skillHellSmash(m, stats, isRegular);
    if (st === 'imp_fire')  return this._skillImpFire(m, stats, isRegular);
    if (st === 'venom')     return this._skillVenom(m, stats, isRegular);
    if (st === 'necro_orb') return this._skillNecroOrb(m, stats, isRegular);
    return this._skillClawLeap(m, stats, isRegular);
  }

  _beginCast(m, isRegular) {
    m._isCastingSkill = true;
    if (isRegular) this.activeRegularCasts += 1;
  }

  _endCast(m, isRegular) {
    if (m) m._isCastingSkill = false;
    if (isRegular) this.activeRegularCasts = Math.max(0, this.activeRegularCasts - 1);
  }

  // 1. claw（21隻近戰）：裂魂飛撲（0.55s 直線紅帶預警 → 突進 220px → seq16_e_claw_rend ＋ 3秒流血）
  _skillClawLeap(m, stats, isRegular) {
    const s = this.scene;
    this._beginCast(m, isRegular);
    const sx = m.sprite.x;
    const sy = m.sprite.y;
    const ang = Math.atan2(s.hero.y - sy, s.hero.x - sx);
    const len = 225;
    const width = 54;
    const tx = Phaser.Math.Clamp(sx + Math.cos(ang) * len, 120, MAP_W - 120);
    const ty = Phaser.Math.Clamp(sy + Math.sin(ang) * len, 180, MAP_H - 180);

    const tg = this.vfx.spawnTelegraphLine(sx, sy, ang, len, width, 540, 0xf43f5e, () => {
      this._endCast(m, isRegular);
      if (!m || m.hp <= 0 || s.isTransitioning) return;
      m.atkAnimUntil = (s.time?.now || 0) + 420;
      s.tweens.add({
        targets: m.sprite,
        x: tx,
        y: ty,
        duration: 180,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          if (!m || m.hp <= 0 || s.isTransitioning) return;
          this.vfx.playSeq16('seq16_e_claw_rend', tx, ty - 8, { scale: 0.92, rotation: ang });
          this.vfx.spawnDebrisBurst(tx, ty, 0xf43f5e, 8);
          if (this._pointToSegmentDist(s.hero.x, s.hero.y, sx, sy, tx, ty) <= width * 0.65) {
            s.performMonsterAttack(m, stats, 1.25, true);
            this.heroBleedUntil = (s.time?.now || 0) + 3000;
            this.heroBleedDmg = Math.max(3, Math.round((m.atk || 12) * 0.22));
          }
        },
      });
    });
    if (tg) this.activeTelegraphs.push(tg);
    return true;
  }

  // 2. slash（22隻雙態劍士）：近距 110° 扇形斬擊 / 玩家拉遠 180~380px 時改發遠程影刃波
  _skillSlashDual(m, stats, dist, isRegular) {
    const s = this.scene;
    this._beginCast(m, isRegular);
    const sx = m.sprite.x;
    const sy = m.sprite.y;
    const ang = Math.atan2(s.hero.y - sy, s.hero.x - sx);

    if (dist > 175) {
      // 遠程影刃斬（反拉打技能）
      const tg = this.vfx.spawnTelegraphLine(sx, sy, ang, 360, 44, 480, 0x60a5fa, () => {
        this._endCast(m, isRegular);
        if (!m || m.hp <= 0 || s.isTransitioning) return;
        m.atkAnimUntil = (s.time?.now || 0) + 380;
        this._fireProjectile(m, sx, sy - 10, ang, 'proj_e_bone_spear', 470, 1.2, 0x93c5fd, 0.56);
        this.vfx.playSeq16('seq16_e_claw_rend', sx + Math.cos(ang) * 44, sy + Math.sin(ang) * 44, {
          scale: 0.72, rotation: ang, tint: 0x60a5fa,
        });
      });
      if (tg) this.activeTelegraphs.push(tg);
    } else {
      // 近距 110° 扇形重斬
      const range = 165;
      const spread = Phaser.Math.DegToRad(110);
      const tg = this.vfx.spawnTelegraphCone(sx, sy, ang, spread, range, 500, 0x60a5fa, () => {
        this._endCast(m, isRegular);
        if (!m || m.hp <= 0 || s.isTransitioning) return;
        m.atkAnimUntil = (s.time?.now || 0) + 400;
        this.vfx.playSeq16('seq16_e_claw_rend', sx + Math.cos(ang) * 68, sy + Math.sin(ang) * 68, {
          scale: 1.05, rotation: ang, tint: 0x93c5fd,
        });
        const hDist = Math.hypot(s.hero.x - sx, s.hero.y - sy);
        const hAng = Math.atan2(s.hero.y - sy, s.hero.x - sx);
        const diff = Math.abs(Phaser.Math.Angle.Wrap(hAng - ang));
        if (hDist <= range && diff <= spread * 0.55) {
          s.performMonsterAttack(m, stats, 1.32, true);
        }
      });
      if (tg) this.activeTelegraphs.push(tg);
    }
    return true;
  }

  // 3. smash（19隻重擊怪）：熔岩重砸（0.75s 圓形預警 155px → seq16_e_hell_smash）
  _skillHellSmash(m, stats, isRegular) {
    const s = this.scene;
    this._beginCast(m, isRegular);
    const tx = s.hero.x;
    const ty = s.hero.y + 8;
    const radius = 150;
    const tg = this.vfx.spawnTelegraphCircle(tx, ty, radius, 740, 0xf97316, () => {
      this._endCast(m, isRegular);
      if (!m || m.hp <= 0 || s.isTransitioning) return;
      m.atkAnimUntil = (s.time?.now || 0) + 450;
      this.vfx.playSeq16('seq16_e_hell_smash', tx, ty - 14, { scale: 1.18, isoFlatten: true });
      this.vfx.spawnDebrisBurst(tx, ty, 0xf97316, 12);
      if (Math.hypot(s.hero.x - tx, s.hero.y - ty) <= radius) {
        s.performMonsterAttack(m, stats, 1.4, true);
      }
    });
    if (tg) this.activeTelegraphs.push(tg);
    return true;
  }

  // 4. imp_fire（10隻火系遠程）：奇數次 3 連扇形火球、偶數次 0.8s 隕石火環＋3.5s 熔岩池
  _skillImpFire(m, stats, isRegular) {
    const s = this.scene;
    this._beginCast(m, isRegular);
    const sx = m.sprite.x;
    const sy = m.sprite.y - 10;
    const ang = Math.atan2(s.hero.y - sy, s.hero.x - sx);

    if ((m._skillCycle || 0) % 2 === 0) {
      // 3 連扇形火球
      s.time.delayedCall(260, () => {
        this._endCast(m, isRegular);
        if (!m || m.hp <= 0 || s.isTransitioning) return;
        m.atkAnimUntil = (s.time?.now || 0) + 380;
        [-0.24, 0, 0.24].forEach((off) => {
          this._fireProjectile(m, sx, sy, ang + off, 'proj_e_fireball', 360, 0.95, null, 0.44);
        });
      });
    } else {
      // 墜火隕石＋持續熔岩池
      const tx = s.hero.x;
      const ty = s.hero.y + 8;
      const radius = 128;
      const tg = this.vfx.spawnTelegraphCircle(tx, ty, radius, 800, 0xf97316, () => {
        this._endCast(m, isRegular);
        if (!m || m.hp <= 0 || s.isTransitioning) return;
        this.vfx.playSeq16('seq16_e_abyss_fire', tx, ty - 16, { scale: 1.06 });
        this.vfx.spawnDebrisBurst(tx, ty, 0xfb923c, 10);
        if (Math.hypot(s.hero.x - tx, s.hero.y - ty) <= radius) {
          s.performMonsterAttack(m, stats, 1.35, true);
        }
        this._spawnHazard('molten', tx, ty, 108, 3500, Math.max(4, Math.round((m.atk || 14) * 0.32)), m);
      });
      if (tg) this.activeTelegraphs.push(tg);
    }
    return true;
  }

  // 5. venom（15隻毒系遠程）：劇毒連噴＋酸液炸彈（seq16_e_venom_pool＋4s 腐蝕酸池）
  _skillVenom(m, stats, isRegular) {
    const s = this.scene;
    this._beginCast(m, isRegular);
    const tx = s.hero.x;
    const ty = s.hero.y + 6;
    const ang = Math.atan2(ty - m.sprite.y, tx - m.sprite.x);

    if ((m._skillCycle || 0) % 2 === 0) {
      s.time.delayedCall(220, () => {
        this._endCast(m, isRegular);
        if (!m || m.hp <= 0 || s.isTransitioning) return;
        [-0.16, 0.16].forEach((off) => {
          this._fireProjectile(m, m.sprite.x, m.sprite.y - 8, ang + off, 'proj_e_venom_spit', 340, 0.9, null, 0.44);
        });
      });
    } else {
      const radius = 122;
      const tg = this.vfx.spawnTelegraphCircle(tx, ty, radius, 680, 0x4ade80, () => {
        this._endCast(m, isRegular);
        if (!m || m.hp <= 0 || s.isTransitioning) return;
        this.vfx.playSeq16('seq16_e_venom_pool', tx, ty - 8, { scale: 1.05, isoFlatten: true });
        this.vfx.spawnDebrisBurst(tx, ty, 0x4ade80, 9);
        if (Math.hypot(s.hero.x - tx, s.hero.y - ty) <= radius) {
          s.performMonsterAttack(m, stats, 1.25, true);
        }
        this._spawnHazard('acid', tx, ty, 114, 4000, Math.max(4, Math.round((m.atk || 14) * 0.28)), m);
      });
      if (tg) this.activeTelegraphs.push(tg);
    }
    return true;
  }

  // 6. necro_orb（19隻死靈/秘法遠程）：輪替「死靈擴散環 / 召喚冰霜追蹤球 / 插下可破壞鮮血圖騰」
  _skillNecroOrb(m, stats, isRegular) {
    const s = this.scene;
    this._beginCast(m, isRegular);
    const phase = (m._skillCycle || 0) % 3;
    const sx = m.sprite.x;
    const sy = m.sprite.y;

    if (phase === 0) {
      // 死靈擴散環（seq16_e_necro_nova）＋魂箭
      const tg = this.vfx.spawnTelegraphCircle(s.hero.x, s.hero.y + 6, 132, 720, 0xc084fc, () => {
        this._endCast(m, isRegular);
        if (!m || m.hp <= 0 || s.isTransitioning) return;
        this.vfx.playSeq16('seq16_e_necro_nova', s.hero.x, s.hero.y, { scale: 1.08 });
        const ang = Math.atan2(s.hero.y - sy, s.hero.x - sx);
        this._fireProjectile(m, sx, sy - 10, ang, 'proj_e_soul_bolt', 325, 1.05, null, 0.45);
      });
      if (tg) this.activeTelegraphs.push(tg);
    } else if (phase === 1) {
      // 召喚動態追蹤實體：冰霜追蹤球（anim_e_frost_orb）
      s.time.delayedCall(260, () => {
        this._endCast(m, isRegular);
        if (!m || m.hp <= 0 || s.isTransitioning) return;
        this._spawnFrostOrb(m, sx, sy - 10, stats);
      });
    } else {
      // 插下可破壞鮮血圖騰（anim_e_blood_totem），每 1.8s 治療周遭怪物
      s.time.delayedCall(280, () => {
        this._endCast(m, isRegular);
        if (!m || m.hp <= 0 || s.isTransitioning) return;
        const aliveTotems = this.dynamicEntities.filter((e) => e.kind === 'blood_totem').length;
        if (aliveTotems < 2) {
          this._spawnBloodTotem(m, sx + Phaser.Math.Between(-50, 50), sy + Phaser.Math.Between(-30, 30));
        } else {
          const ang = Math.atan2(s.hero.y - sy, s.hero.x - sx);
          this._fireProjectile(m, sx, sy - 10, ang, 'proj_e_soul_bolt', 330, 1.1, null, 0.46);
        }
      });
    }
    return true;
  }

  // 7. boss_cleave（章節首領）：災變重擊 / 五連骨矛扇射 / 祕法旋轉哨塔
  _skillBossSuite(m, stats) {
    const s = this.scene;
    m._isCastingSkill = true;
    const phase = (m._skillCycle || 0) % 3;
    const sx = m.sprite.x;
    const sy = m.sprite.y;

    if (phase === 0) {
      const tx = s.hero.x;
      const ty = s.hero.y + 8;
      const radius = m._bossPhase2 ? 195 : 168;
      const tg = this.vfx.spawnTelegraphCircle(tx, ty, radius, m._bossPhase2 ? 780 : 940, 0xef4444, () => {
        m._isCastingSkill = false;
        if (!m || m.hp <= 0 || s.isTransitioning) return;
        this.vfx.playSeq16('seq16_e_boss_cataclysm', tx, ty - 22, { scale: m._bossPhase2 ? 1.55 : 1.35 });
        this.vfx.spawnDebrisBurst(tx, ty, 0xfbbf24, 16);
        if (Math.hypot(s.hero.x - tx, s.hero.y - ty) <= radius) {
          s.performMonsterAttack(m, stats, m._bossPhase2 ? 1.65 : 1.45, true);
        } else {
          s.spawnFloatingText(s.hero.x, s.hero.y - 72, '✨ 完美閃避！', '#67e8f9', 15);
        }
      });
      if (tg) this.activeTelegraphs.push(tg);
    } else if (phase === 1) {
      s.time.delayedCall(320, () => {
        m._isCastingSkill = false;
        if (!m || m.hp <= 0 || s.isTransitioning) return;
        const baseAng = Math.atan2(s.hero.y - sy, s.hero.x - sx);
        const offsets = m._bossPhase2 ? [-0.42, -0.21, 0, 0.21, 0.42] : [-0.3, -0.15, 0, 0.15, 0.3];
        offsets.forEach((off) => {
          this._fireProjectile(m, sx, sy - 14, baseAng + off, 'proj_e_bone_spear', 410, 1.15, 0xfbbf24, 0.54);
        });
      });
    } else {
      s.time.delayedCall(300, () => {
        m._isCastingSkill = false;
        if (!m || m.hp <= 0 || s.isTransitioning) return;
        const sentries = this.dynamicEntities.filter((e) => e.kind === 'arcane_sentry').length;
        if (sentries < 2) {
          this._spawnArcaneSentry(m, s.hero.x + Phaser.Math.Between(-110, 110), s.hero.y + Phaser.Math.Between(-80, 80), stats);
        }
      });
    }
    return true;
  }

  _enterBossPhase2(m, stats) {
    m._bossPhase2 = true;
    m._skillCdMs = 2850;
    const s = this.scene;
    s.spawnFloatingText(m.sprite.x, m.sprite.y - 110, '🔥 首領狂暴二階段！召喚深淵小鬼！', '#fbbf24', 18);
    this.vfx.playSeq16('seq16_e_boss_cataclysm', m.sprite.x, m.sprite.y - 16, { scale: 1.45, tint: 0xfbbf24 });
    const count = 2;
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + 0.5;
      this._spawnAbyssImp(m, m.sprite.x + Math.cos(ang) * 95, m.sprite.y + Math.sin(ang) * 65, stats);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 5 大暗黑4 菁英詞綴觸發
  // ═══════════════════════════════════════════════════════════════
  _triggerEliteAffix(m, affix, stats) {
    const s = this.scene;
    if (affix.id === 'arcane_enchanted') {
      if (this.dynamicEntities.filter((e) => e.kind === 'arcane_sentry').length < 2) {
        this._spawnArcaneSentry(m, s.hero.x + Phaser.Math.Between(-95, 95), s.hero.y + Phaser.Math.Between(-75, 75), stats);
      }
    } else if (affix.id === 'frozen_pulse') {
      if (this.dynamicEntities.filter((e) => e.kind === 'frost_orb').length < 3) {
        this._spawnFrostOrb(m, m.sprite.x, m.sprite.y - 10, stats);
      }
    } else if (affix.id === 'molten') {
      this._spawnHazard('molten', m.sprite.x, m.sprite.y + 12, 74, 3200, Math.max(4, Math.round((m.atk || 14) * 0.25)), m);
    } else if (affix.id === 'plague_bearer') {
      this._spawnHazard('acid', s.hero.x, s.hero.y + 10, 96, 3800, Math.max(4, Math.round((m.atk || 14) * 0.28)), m);
    } else if (affix.id === 'vampiric_totem') {
      if (this.dynamicEntities.filter((e) => e.kind === 'blood_totem').length < 2) {
        this._spawnBloodTotem(m, m.sprite.x + Phaser.Math.Between(-60, 60), m.sprite.y + Phaser.Math.Between(-40, 40));
      }
    }
  }

  _triggerMoltenDeathExplosion(m, stats) {
    const s = this.scene;
    if (!s || !m?.sprite) return;
    const x = m.sprite.x;
    const y = m.sprite.y;
    const tg = this.vfx.spawnTelegraphCircle(x, y, 138, 1100, 0xfb923c, () => {
      if (s.isTransitioning) return;
      this.vfx.playSeq16('seq16_e_abyss_fire', x, y - 12, { scale: 1.15 });
      if (Math.hypot(s.hero.x - x, s.hero.y - y) <= 138) {
        s.performMonsterAttack({ ...m, hp: 1 }, stats, 1.35, true);
      }
    });
    if (tg) this.activeTelegraphs.push(tg);
  }

  // ═══════════════════════════════════════════════════════════════
  // 4 種 2.5D 動態召喚實體（4幀循環精靈圖＋實戰幾何判定）
  // ═══════════════════════════════════════════════════════════════
  _spawnArcaneSentry(owner, x, y, stats) {
    const s = this.scene;
    const cx = Phaser.Math.Clamp(x, 150, MAP_W - 150);
    const cy = Phaser.Math.Clamp(y, 200, MAP_H - 200);
    const spr = s.add.sprite(cx, cy, 'anim_e_arcane_sentry', 0).setScale(0.56).setDepth(cy + 18);
    if (s.anims.exists('anim_e_arcane_sentry_loop')) spr.play('anim_e_arcane_sentry_loop');

    // 旋轉祕法雷射光束（雙向 190px）
    const beam = s.add.rectangle(cx, cy - 8, 210, 14, 0xe879f9, 0.72)
      .setOrigin(0, 0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(cy + 16);

    this.dynamicEntities.push({
      kind: 'arcane_sentry',
      owner,
      stats,
      x: cx,
      y: cy,
      sprite: spr,
      beam,
      angle: Math.random() * Math.PI * 2,
      beamLen: 210,
      lifeMs: 5600,
      tickTimer: 0,
      destructible: false,
    });
  }

  _spawnFrostOrb(owner, x, y, stats) {
    const s = this.scene;
    const spr = s.add.sprite(x, y, 'anim_e_frost_orb', 0)
      .setScale(0.46).setBlendMode(Phaser.BlendModes.ADD).setDepth(y + 22);
    if (s.anims.exists('anim_e_frost_orb_loop')) spr.play('anim_e_frost_orb_loop');

    this.dynamicEntities.push({
      kind: 'frost_orb',
      owner,
      stats,
      x,
      y,
      sprite: spr,
      speed: 138,
      lifeMs: 4200,
      destructible: false,
    });
  }

  _spawnAbyssImp(owner, x, y, stats) {
    const s = this.scene;
    const cx = Phaser.Math.Clamp(x, 140, MAP_W - 140);
    const cy = Phaser.Math.Clamp(y, 190, MAP_H - 190);
    const spr = s.add.sprite(cx, cy, 'anim_e_abyss_imp', 0).setScale(0.48).setDepth(cy + 15);
    if (s.anims.exists('anim_e_abyss_imp_loop')) spr.play('anim_e_abyss_imp_loop');
    const maxHp = Math.max(40, Math.round((owner.maxHp || 300) * 0.14));
    const hpBarBg = s.add.rectangle(cx, cy - 42, 48, 5, 0x0f172a, 0.85).setDepth(cy + 30);
    const hpBarFill = s.add.rectangle(cx - 24, cy - 42, 48, 5, 0xf97316, 0.95).setOrigin(0, 0.5).setDepth(cy + 31);

    this.dynamicEntities.push({
      kind: 'abyss_imp',
      owner,
      stats,
      x: cx,
      y: cy,
      sprite: spr,
      hpBarBg,
      hpBarFill,
      hp: maxHp,
      maxHp,
      hitRadius: 34,
      speed: 155,
      atkTimer: 900,
      lifeMs: 14000,
      destructible: true,
    });
  }

  _spawnBloodTotem(owner, x, y) {
    const s = this.scene;
    const cx = Phaser.Math.Clamp(x, 150, MAP_W - 150);
    const cy = Phaser.Math.Clamp(y, 200, MAP_H - 200);
    const spr = s.add.sprite(cx, cy, 'anim_e_blood_totem', 0).setScale(0.54).setDepth(cy + 14);
    if (s.anims.exists('anim_e_blood_totem_loop')) spr.play('anim_e_blood_totem_loop');
    const maxHp = Math.max(35, Math.round((owner.maxHp || 240) * 0.22));
    const hpBarBg = s.add.rectangle(cx, cy - 48, 48, 5, 0x0f172a, 0.85).setDepth(cy + 30);
    const hpBarFill = s.add.rectangle(cx - 24, cy - 48, 48, 5, 0xf43f5e, 0.95).setOrigin(0, 0.5).setDepth(cy + 31);
    const ring = s.add.circle(cx, cy + 12, 165, 0xf43f5e, 0.06).setStrokeStyle(1.5, 0xf43f5e, 0.45).setScale(1, 0.65).setDepth(5);

    this.dynamicEntities.push({
      kind: 'blood_totem',
      owner,
      x: cx,
      y: cy,
      sprite: spr,
      hpBarBg,
      hpBarFill,
      ring,
      hp: maxHp,
      maxHp,
      hitRadius: 36,
      pulseTimer: 0,
      lifeMs: 11000,
      destructible: true,
    });
  }

  _updateDynamicEntities(time, delta, stats) {
    const s = this.scene;
    const dt = delta / 1000;

    for (let i = this.dynamicEntities.length - 1; i >= 0; i--) {
      const e = this.dynamicEntities[i];
      e.lifeMs -= delta;
      if (e.lifeMs <= 0) {
        if (e.kind === 'frost_orb') this._detonateFrostOrb(e, stats);
        this._destroyEntityVisuals(e);
        this.dynamicEntities.splice(i, 1);
        continue;
      }

      if (e.kind === 'arcane_sentry') {
        e.angle += dt * 1.15;
        if (e.beam?.active) e.beam.setRotation(e.angle);
        e.tickTimer += delta;
        if (e.tickTimer >= 360) {
          e.tickTimer = 0;
          const bx = e.x + Math.cos(e.angle) * e.beamLen;
          const by = e.y + Math.sin(e.angle) * e.beamLen;
          if (this._pointToSegmentDist(s.hero.x, s.hero.y, e.x, e.y, bx, by) <= 26) {
            this.vfx.playSeq16('seq16_e_arcane_beam', s.hero.x, s.hero.y - 8, { scale: 0.58, rotation: e.angle });
            s.performMonsterAttack(e.owner && e.owner.hp > 0 ? e.owner : { ...e.owner, hp: 1 }, stats, 0.72, true);
          }
        }
      } else if (e.kind === 'frost_orb') {
        const dx = s.hero.x - e.x;
        const dy = s.hero.y - e.y;
        const d = Math.hypot(dx, dy) || 1;
        e.x += (dx / d) * e.speed * dt;
        e.y += (dy / d) * e.speed * dt;
        e.sprite?.setPosition(e.x, e.y).setDepth(e.y + 22);
        if (d <= 44) {
          this._detonateFrostOrb(e, stats);
          this._destroyEntityVisuals(e);
          this.dynamicEntities.splice(i, 1);
        }
      } else if (e.kind === 'abyss_imp') {
        const dx = s.hero.x - e.x;
        const dy = s.hero.y - e.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d > 190) {
          e.x += (dx / d) * e.speed * dt;
          e.y += (dy / d) * e.speed * dt;
        }
        e.sprite?.setPosition(e.x, e.y).setFlipX(dx < 0).setDepth(e.y + 15);
        e.hpBarBg?.setPosition(e.x, e.y - 42);
        e.hpBarFill?.setPosition(e.x - 24, e.y - 42);
        e.atkTimer -= delta;
        if (e.atkTimer <= 0 && d <= 420) {
          e.atkTimer = 1950;
          const ang = Math.atan2(dy, dx);
          this._fireProjectile(e.owner, e.x, e.y - 8, ang, 'proj_e_fireball', 310, 0.55, null, 0.34);
        }
      } else if (e.kind === 'blood_totem') {
        e.pulseTimer += delta;
        if (e.pulseTimer >= 1800) {
          e.pulseTimer = 0;
          this.vfx.spawnDebrisBurst(e.x, e.y - 16, 0xf43f5e, 7);
          for (const m of s.monsters || []) {
            if (!m || m.hp <= 0 || m.hp >= m.maxHp) continue;
            if (Math.hypot(m.sprite.x - e.x, m.sprite.y - e.y) <= 180) {
              const heal = Math.max(5, Math.round(m.maxHp * 0.06));
              m.hp = Math.min(m.maxHp, m.hp + heal);
              s.spawnFloatingText(m.sprite.x, m.sprite.y - 52, `+${heal}`, '#fb7185', 12);
            }
          }
        }
      }
    }
  }

  _detonateFrostOrb(e, stats) {
    const s = this.scene;
    this.vfx.playSeq16('seq16_e_frost_pulse', e.x, e.y - 8, { scale: 0.96 });
    this.vfx.spawnDebrisBurst(e.x, e.y, 0x38bdf8, 10);
    if (Math.hypot(s.hero.x - e.x, s.hero.y - e.y) <= 112) {
      s.performMonsterAttack(e.owner && e.owner.hp > 0 ? e.owner : { ...e.owner, hp: 1 }, stats, 1.15, true);
    }
  }

  _destroyEntityVisuals(e) {
    e.sprite?.destroy();
    e.beam?.destroy();
    e.hpBarBg?.destroy();
    e.hpBarFill?.destroy();
    e.ring?.destroy();
  }

  // ═══════════════════════════════════════════════════════════════
  // 地面持續傷害區與怪物投射物
  // ═══════════════════════════════════════════════════════════════
  _spawnHazard(kind, x, y, radius, durationMs, tickDmg, owner) {
    const s = this.scene;
    const key = kind === 'acid' ? 'decal_e_acid' : 'decal_e_molten';
    const spr = s.textures.exists(key)
      ? s.add.image(x, y, key).setDisplaySize(radius * 2.1, radius * 1.4).setAlpha(0.84).setBlendMode(Phaser.BlendModes.ADD).setDepth(5)
      : s.add.ellipse(x, y, radius * 2, radius * 1.3, kind === 'acid' ? 0x4ade80 : 0xf97316, 0.32).setDepth(5);
    this.hazards.push({
      kind,
      x,
      y,
      radius,
      lifeMs: durationMs,
      tickTimer: 0,
      tickDmg,
      owner,
      sprite: spr,
    });
  }

  _updateHazards(_time, delta, stats) {
    const s = this.scene;
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      h.lifeMs -= delta;
      if (h.lifeMs <= 0) {
        h.sprite?.destroy();
        this.hazards.splice(i, 1);
        continue;
      }
      if (h.lifeMs < 600 && h.sprite?.active) {
        h.sprite.setAlpha(Math.max(0.1, (h.lifeMs / 600) * 0.84));
      }
      h.tickTimer += delta;
      if (h.tickTimer >= 620) {
        h.tickTimer = 0;
        if (Math.hypot(s.hero.x - h.x, s.hero.y - h.y) <= h.radius) {
          s.performMonsterAttack(h.owner && h.owner.hp > 0 ? h.owner : { ...h.owner, hp: 1 }, stats, 0.42, true);
        }
      }
    }
  }

  _fireProjectile(mob, x, y, ang, texKey, speed, dmgMult = 1.0, tint = null, scale = 0.46) {
    const s = this.scene;
    const key = s.textures.exists(texKey) ? texKey : 'efx_imp_fire';
    const spr = s.add.image(x, y, key)
      .setScale(scale).setRotation(ang).setBlendMode(Phaser.BlendModes.ADD).setDepth(4510);
    if (tint) spr.setTint(tint);
    this.enemyProjectiles.push({
      mob,
      sprite: spr,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      lifeMs: 2100,
      dmgMult,
      texKey,
    });
  }

  _updateEnemyProjectiles(delta, stats) {
    const s = this.scene;
    const dt = delta / 1000;
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const p = this.enemyProjectiles[i];
      p.lifeMs -= delta;
      if (!p.sprite?.active || p.lifeMs <= 0) {
        p.sprite?.destroy();
        this.enemyProjectiles.splice(i, 1);
        continue;
      }
      p.sprite.x += p.vx * dt;
      p.sprite.y += p.vy * dt;
      if (Math.hypot(s.hero.x - p.sprite.x, (s.hero.y - 10) - p.sprite.y) <= 34) {
        const hitX = p.sprite.x;
        const hitY = p.sprite.y;
        p.sprite.destroy();
        this.enemyProjectiles.splice(i, 1);
        const col = p.texKey === 'proj_e_venom_spit' ? 0x4ade80 : (p.texKey === 'proj_e_soul_bolt' ? 0xc084fc : 0xf97316);
        this.vfx.spawnDebrisBurst(hitX, hitY, col, 7);
        s.performMonsterAttack(p.mob && p.mob.hp > 0 ? p.mob : { ...p.mob, hp: 1 }, stats, p.dmgMult, true);
      }
    }
  }

  _pointToSegmentDist(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq < 1e-4) return Math.hypot(px - x1, py - y1);
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }
}
