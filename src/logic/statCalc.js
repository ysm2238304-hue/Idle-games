import { calcEndgameBonuses } from './endgameSystems.js?v=317';
import { getActiveKeystone } from './buildEngine.js?v=317';
import { getClassMechanicStatBonuses } from './classMechanics.js?v=317';
import { CLASSES } from '../data/classes.js?v=317';
import { SET_DEFINITIONS } from '../data/items.js?v=317';

export function formatNum(num) {
  const n = Math.floor(num);
  if (n < 1000) return n.toString();
  if (n < 1e6) return (n / 1e3).toFixed(n >= 1e5 ? 0 : 1) + 'K';
  if (n < 1e9) return (n / 1e6).toFixed(n >= 1e8 ? 0 : 2) + 'M';
  return (n / 1e9).toFixed(2) + 'B';
}

export function getExpToNext(level) {
  // v232 千小時長線四段式等級曲線（Lv.1-20 拓荒 → Lv.21-50 養成 → Lv.51-80 深淵 → Lv.81-100+ 千小時巔峰）
  const lv = Math.max(1, Math.floor(level || 1));
  if (lv <= 20) {
    return Math.round(520 * Math.pow(1.23, lv - 1));
  }
  const base20 = 520 * Math.pow(1.23, 19);
  if (lv <= 50) {
    return Math.round(base20 * Math.pow(1.108, lv - 20));
  }
  const base50 = base20 * Math.pow(1.108, 30);
  if (lv <= 80) {
    return Math.round(base50 * Math.pow(1.076, lv - 50));
  }
  const base80 = base50 * Math.pow(1.076, 30);
  return Math.round(base80 * Math.pow(1.105, lv - 80));
}

export function getUpgradeCost(type, lvl) {
  const base = { atk: 24, hp: 20, crit: 40, speed: 45 }[type] || 25;
  return Math.round(base * Math.pow(1.42, lvl));
}

export function calcRebirthCrystals(maxStageReached) {
  if (maxStageReached < 10) return 0;
  return Math.max(1, Math.floor(Math.pow(maxStageReached - 7, 1.35)));
}

export function recalcPlayerStats(state) {
  const cls = CLASSES[state.classId] || CLASSES.warrior;
  const lvlBonus = Math.max(0, state.level - 1);
  const tree = state.skillTree || {};

  const flat = {
    hp: cls.baseStats.hp + Math.round(cls.perLevel.hp * lvlBonus) + ((state.upgrades?.hp || 0) * 20),
    atk: cls.baseStats.atk + Math.round(cls.perLevel.atk * lvlBonus) + ((state.upgrades?.atk || 0) * 3.5),
    armor: cls.baseStats.armor + Math.round(cls.perLevel.armor * lvlBonus),
    critRate: cls.baseStats.critRate + ((state.upgrades?.crit || 0) * 1.4),
    critDmg: cls.baseStats.critDmg,
    atkSpeedPct: (state.upgrades?.speed || 0) * 3.5,
    dodge: cls.baseStats.dodge,
    lifesteal: cls.baseStats.lifesteal,
    goldFind: cls.baseStats.goldFind,
    magicFind: cls.baseStats.magicFind,
    moveSpeed: state.classId === 'assassin' ? 176 : (state.classId === 'ranger' ? 168 : (state.classId === 'mage' ? 152 : 145)),
  };
  const innate = cls.innateBonus || {};
  flat.critRate += innate.critRate || 0;
  flat.critDmg += innate.critDmg || 0;
  flat.atkSpeedPct += innate.atkSpeedPct || 0;
  flat.dodge += innate.dodge || 0;
  flat.lifesteal += innate.lifesteal || 0;

  let atkPct = innate.atkPct || 0;
  let hpPct = innate.hpPct || 0;
  let armorPct = innate.armorPct || 0;
  let bleedDmgPct = 0;
  let skillRadiusPct = 0;
  let stunDmgPct = 0;
  let armorToAtkPct = 0;
  let moveSpeedPct = innate.moveSpeedPct || 0;
  let pierceDmgPct = 0;
  let markCritDmgPct = 0;
  let dodgeHealPct = 0;
  let maxMpFlat = innate.maxMpFlat || 0;
  let mpRegenFlat = innate.mpRegenFlat || 0;
  let cdrPct = innate.cdrPct || 0;
  let chillDmgPct = 0;
  let holyDmgPct = 0;
  let thornsPct = 0;
  let stunDurPct = 0;
  let blockHealPct = 0;
  let summonDmgPct = innate.summonDmgPct || 0;
  let boneDmgPct = 0;
  let corpseRadiusPct = 0;
  let killEssence = 0;
  let poisonDmgPct = 0;
  let comboCritDmgPct = 0;
  let dodgeShadow = 0;
  let moveAtkSpdPct = 0;
  const activeEffects = new Set();

  for (const slotKey of Object.keys(state.equipment || {})) {
    const item = state.equipment[slotKey];
    if (!item) continue;
    const upgMult = 1 + (item.upgradeLevel || 0) * 0.12;

    const applyStat = (key, val) => {
      const v = val * upgMult;
      if (key === 'atkFlat') flat.atk += v;
      else if (key === 'atkPct') atkPct += v;
      else if (key === 'hpFlat') flat.hp += v;
      else if (key === 'hpPct') hpPct += v;
      else if (key === 'armorFlat') flat.armor += v;
      else if (key === 'critRate') flat.critRate += v;
      else if (key === 'critDmg') flat.critDmg += v;
      else if (key === 'atkSpeedPct') flat.atkSpeedPct += v;
      else if (key === 'dodge') flat.dodge += v;
      else if (key === 'lifesteal') flat.lifesteal += v;
      else if (key === 'goldFind') flat.goldFind += v;
      else if (key === 'magicFind') flat.magicFind += v;
      else if (key === 'bleedDmgPct') bleedDmgPct += v;
      else if (key === 'skillRadiusPct') skillRadiusPct += v;
      else if (key === 'stunDmgPct') stunDmgPct += v;
      else if (key === 'armorToAtkPct') armorToAtkPct += v;
      else if (key === 'moveSpeedPct') moveSpeedPct += v;
      else if (key === 'pierceDmgPct') pierceDmgPct += v;
      else if (key === 'markCritDmgPct') markCritDmgPct += v;
      else if (key === 'dodgeHealPct') dodgeHealPct += v;
      else if (key === 'maxMpFlat') maxMpFlat += v;
      else if (key === 'mpRegenFlat') mpRegenFlat += v;
      else if (key === 'cdrPct') cdrPct += v;
      else if (key === 'chillDmgPct') chillDmgPct += v;
      else if (key === 'holyDmgPct') holyDmgPct += v;
      else if (key === 'thornsPct') thornsPct += v;
      else if (key === 'stunDurPct') stunDurPct += v;
      else if (key === 'blockHealPct') blockHealPct += v;
      else if (key === 'summonDmgPct') summonDmgPct += v;
      else if (key === 'boneDmgPct') boneDmgPct += v;
      else if (key === 'corpseRadiusPct') corpseRadiusPct += v;
      else if (key === 'killEssence') killEssence += v;
      else if (key === 'poisonDmgPct') poisonDmgPct += v;
      else if (key === 'comboCritDmgPct') comboCritDmgPct += v;
      else if (key === 'dodgeShadow') dodgeShadow += v;
      else if (key === 'moveAtkSpdPct') moveAtkSpdPct += v;
    };

    if (item.baseStat) applyStat(item.baseStat.key, item.baseStat.value);
    for (const af of item.affixes || []) applyStat(af.key, af.value);
    if (item.legendaryEffect) activeEffects.add(item.legendaryEffect.id);
  }

  // 統計綠色套裝 (set) 2 件套／4 件套專屬詞條加成
  const setCounts = {};
  for (const item of Object.values(state.equipment || {})) {
    if (item && item.rarity === 'set' && item.setId) {
      setCounts[item.setId] = (setCounts[item.setId] || 0) + 1;
    }
  }
  const activeSets = [];
  let setSkillDmgPct = 0;
  let setDmgReducePct = 0;
  let setExpPct = 0;
  for (const [sid, cnt] of Object.entries(setCounts)) {
    const def = SET_DEFINITIONS[sid];
    if (!def) continue;
    const applyBonusObj = (b) => {
      if (!b) return;
      if (b.atkPct) atkPct += b.atkPct;
      if (b.hpPct) hpPct += b.hpPct;
      if (b.armorPct) armorPct += b.armorPct;
      if (b.critRate) flat.critRate += b.critRate;
      if (b.critDmg) flat.critDmg += b.critDmg;
      if (b.atkSpeedPct) flat.atkSpeedPct += b.atkSpeedPct;
      if (b.lifesteal) flat.lifesteal += b.lifesteal;
      if (b.dodge) flat.dodge += b.dodge;
      if (b.cdrPct) cdrPct += b.cdrPct;
      if (b.summonDmgPct) summonDmgPct += b.summonDmgPct;
      if (b.poisonDmgPct) poisonDmgPct += b.poisonDmgPct;
      if (b.magicFind) flat.magicFind += b.magicFind;
      if (b.goldFind) flat.goldFind += b.goldFind;
      if (b.skillDmgPct) setSkillDmgPct += b.skillDmgPct;
      if (b.dmgReducePct) setDmgReducePct += b.dmgReducePct;
      if (b.expMultPct) setExpPct += b.expMultPct;
    };
    if (cnt >= 2) applyBonusObj(def.bonus2);
    if (cnt >= 4) applyBonusObj(def.bonus4);
    activeSets.push({ id: sid, name: def.name, count: cnt, def });
  }

  atkPct += (tree.fury_atk || 0) * 6 + (tree.w_p_might || 0) * 4 + (tree.r_p_focus || 0) * 3 + (tree.m_p_arcane || 0) * 4.5 + (tree.p_p_faith || 0) * 4 + (tree.n_p_essence || 0) * 4 + (tree.a_p_venom || 0) * 4;
  flat.critRate += (tree.fury_crit || 0) * 2.5 + (tree.w_p_savage || 0) * 2 + (tree.r_p_toxic || 0) * 2.5 + (tree.m_p_sage || 0) * 2 + (tree.p_p_zeal || 0) * 2 + (tree.n_p_essence || 0) * 2 + (tree.a_p_weakpoint || 0) * 2.5 + (activeEffects.has('night_veil') ? 8 : 0) + (state.classId === 'assassin' ? (tree.a_cdr || 0) * 8 : 0);
  flat.critDmg += (tree.fury_crit || 0) * 10 + (tree.w_p_savage || 0) * 8 + (tree.r_p_focus || 0) * 12 + (tree.a_p_weakpoint || 0) * 12 + comboCritDmgPct;
  const keyW_Earth = (state.classId === 'warrior' && (tree.w_key_earth || 0) > 0);
  const keyM_Astral = (state.classId === 'mage' && (tree.m_key_astral || 0) > 0);
  const keyP_Judg = (state.classId === 'paladin' && (tree.p_key_judgment || 0) > 0);
  const keyP_Bulwark = (state.classId === 'paladin' && (tree.p_key_bulwark || 0) > 0);
  if (state.classId === 'paladin') armorToAtkPct += (tree.p_p_zeal || 0) * 5 + (keyP_Bulwark ? 40 : 0);
  holyDmgPct += (tree.p_p_faith || 0) * 6;
  summonDmgPct += (tree.n_p_summon || 0) * 8 + (state.classId === 'necro' && (tree.n_key_overlord || 0) > 0 ? 50 : 0);
  boneDmgPct += (tree.n_p_bone || 0) * 6;
  killEssence += (tree.n_p_essence || 0) * 3;
  const skillDmgMult = 1 + (innate.skillDmgPct || 0) / 100 + setSkillDmgPct / 100 + (tree.fury_aoe || 0) * 0.15 + (keyW_Earth ? 0.35 : 0) + (keyM_Astral ? 0.30 : 0) + (keyP_Judg ? 0.35 : 0) + (state.classId === 'paladin' ? holyDmgPct / 100 : 0) + (activeEffects.has('lava_core') ? 0.22 : 0);
  const skillRadiusMult = 1 + (tree.fury_aoe || 0) * 0.16 + (keyW_Earth ? 0.20 : 0) + skillRadiusPct / 100;
  const treeBoltChance = [0, 35, 70, 100][tree.fury_bolt || 0] || 0;
  const cdrLvl = state.classId === 'ranger'
    ? (tree.r_cdr || 0)
    : (state.classId === 'mage' ? (tree.m_cdr || 0) : (state.classId === 'paladin' ? (tree.p_cdr || 0) : (state.classId === 'necro' ? (tree.n_cdr || 0) : (state.classId === 'assassin' ? (tree.a_cdr || 0) : (tree.w_cdr || 0)))));
  let cdrMult = Math.max(0.45, 1 - cdrLvl * 0.06 - cdrPct / 100);

  hpPct += (tree.guard_hp || 0) * 8 + (tree.w_p_iron || 0) * 5 + (tree.m_p_ward || 0) * 5 + (tree.p_p_bulwark || 0) * 5 + (tree.n_p_bone || 0) * 5;
  armorPct += (tree.guard_def || 0) * 12 + (tree.w_p_iron || 0) * 8 + (tree.p_p_bulwark || 0) * 10 + (keyP_Bulwark ? 40 : 0) + (activeEffects.has('seraph_grace') ? 20 : 0);
  flat.dodge += (tree.guard_def || 0) * 1.5 + (tree.r_p_toxic || 0) * 2 + (tree.a_p_swift || 0) * 2 + (activeEffects.has('night_veil') ? 8 : 0);
  flat.lifesteal += (tree.guard_leech || 0) * 1.5 + (tree.w_p_might || 0) * 1;
  const killHealPct = (tree.guard_leech || 0) * 2;
  const keyR_Gale = (state.classId === 'ranger' && (tree.r_key_gale || 0) > 0);
  flat.atkSpeedPct += (tree.guard_speed || 0) * 6 + (tree.r_p_swift || 0) * 5 + (tree.a_p_swift || 0) * 5 + moveAtkSpdPct + (keyR_Gale ? 25 : 0);
  flat.moveSpeed *= 1 + (tree.guard_speed || 0) * 0.08 + (tree.r_p_swift || 0) * 0.04 + (tree.a_p_swift || 0) * 0.05 + ((tree.w_cdr || 0) * 0.03) + ((tree.p_cdr || 0) * 0.03) + moveSpeedPct / 100;
  if (activeEffects.has('gale_step')) { flat.dodge += 8; flat.atkSpeedPct += 12; }

  flat.goldFind += (tree.greed_gold || 0) * 10;
  flat.magicFind += (tree.greed_mf || 0) * 8 + (tree.r_cdr || 0) * 4 + (tree.m_p_sage || 0) * 6 + (tree.n_cdr || 0) * 4;
  let expMult = 1 + (tree.greed_exp || 0) * 0.03;

  const sanctum = state.sanctumLevels || {};
  const sAtk = sanctum.atk_aura || 0;
  const sLoot = sanctum.loot_aura || 0;
  const sBoss = sanctum.boss_aura || 0;
  if (sAtk > 0) {
    atkPct += sAtk * 6;
    hpPct += sAtk * 6;
  }
  if (sLoot > 0) {
    flat.magicFind += sLoot * 12;
    flat.goldFind += sLoot * 12;
  }
  if (sBoss > 0) {
    flat.critDmg += sBoss * 15;
    flat.dmgReducePct = (flat.dmgReducePct || 0) + sBoss * 2;
  }

  const crystals = state.soulCrystals || 0;
  const crystalMult = 1 + Math.min(2.5, crystals * 0.08);
  flat.goldFind += crystals * 5;
  flat.magicFind += crystals * 5;
  const nowTs = Date.now();
  const buffs = state.potionBuffs || {};
  if ((buffs.furyUntil || 0) > nowTs) {
    flat.atkSpeedPct += 25;
    flat.critRate += 10;
  }
  if ((buffs.mfUntil || 0) > nowTs) {
    flat.magicFind += 40;
    flat.goldFind += 30;
  }
  let buffSkillDmgPct = 0;
  if ((buffs.beaconUntil || 0) > nowTs) {
    atkPct += 15;
    armorPct += 15;
    flat.magicFind += 15;
  }
  if ((buffs.sporeUntil || 0) > nowTs) {
    flat.atkSpeedPct += 20;
    flat.critRate += 15;
    flat.goldFind += 20;
  }
  if ((buffs.soulUntil || 0) > nowTs) {
    atkPct += 18;
    flat.critDmg += 25;
    flat.magicFind += 15;
  }
  if ((buffs.lavaUntil || 0) > nowTs) {
    atkPct += 25;
    flat.critDmg += 20;
    buffSkillDmgPct += 20;
  }
  if ((buffs.abyssUntil || 0) > nowTs) {
    atkPct += 30;
    flat.critDmg += 20;
    flat.magicFind += 25;
  }
  if ((buffs.auroraUntil || 0) > nowTs) {
    armorPct += 25;
    flat.atkSpeedPct += 25;
    flat.dmgReducePct = (flat.dmgReducePct || 0) + 10;
  }
  if ((buffs.emeraldUntil || 0) > nowTs) {
    atkPct += 25;
    flat.atkSpeedPct += 25;
    flat.magicFind += 30;
  }
  if ((buffs.stormUntil || 0) > nowTs) {
    flat.atkSpeedPct += 30;
    buffSkillDmgPct += 25;
    flat.critRate += 20;
  }
  if ((buffs.roseUntil || 0) > nowTs) {
    atkPct += 35;
    flat.critDmg += 25;
    flat.lifesteal += 5;
  }
  if ((buffs.astralUntil || 0) > nowTs) {
    atkPct += 45;
    flat.critDmg += 35;
    flat.atkSpeedPct += 30;
    flat.magicFind += 40;
  }
  if ((buffs.tavernUntil || 0) > nowTs) {
    flat.goldFind += 15;
    expMult += 0.15;
  }
  if ((buffs.guardUntil || 0) > nowTs) {
    armorPct += 10;
  }
  if ((buffs.titanUntil || 0) > nowTs) {
    atkPct += 30;
    flat.critDmg += 40;
  }
  if ((buffs.ironUntil || 0) > nowTs) {
    armorPct += 35;
    flat.dmgReducePct = (flat.dmgReducePct || 0) + 12;
  }
  if ((buffs.sageUntil || 0) > nowTs) {
    flat.magicFind += 50;
    cdrMult = Math.max(0.45, cdrMult - 0.18);
  }

  const maxHp = Math.round(flat.hp * (1 + hpPct / 100) * crystalMult);
  const armorPre = Math.round(flat.armor * (1 + armorPct / 100));
  const atk = Math.round((flat.atk + armorPre * (armorToAtkPct / 100)) * (1 + atkPct / 100) * crystalMult);
  const atkIntervalMs = Math.max(260, Math.round(cls.baseStats.atkIntervalMs / (1 + flat.atkSpeedPct / 100)));
  const critRate = Math.min(85, Math.round(flat.critRate * 10) / 10);
  const critDmg = Math.round(flat.critDmg);
  const armor = Math.round(flat.armor * (1 + armorPct / 100));
  const dodgeCap = (state.classId === 'assassin' && (tree.a_key_dancer || 0) > 0) ? 75 : 60;
  const dodge = Math.min(dodgeCap, Math.round(flat.dodge * 10) / 10);
  const lifesteal = Math.min(45, Math.round(flat.lifesteal * 10) / 10);
  const goldFind = Math.round(flat.goldFind + (activeEffects.has('greed_blessing') ? 35 : 0));
  const magicFind = Math.round(flat.magicFind);

  const dps = Math.round(
    (atk * (1 + (critRate / 100) * ((critDmg - 100) / 100))) / (atkIntervalMs / 1000)
  );

  // v254: 六大職業資源池與被動回復分化（大幅下修無腦滿魔回復，強化「基礎產能 → 核心耗能」循環）
  const classBaseMp = { mage: 120, necro: 105, ranger: 100, paladin: 100, assassin: 100, warrior: 100 };
  const classBaseRegen = { mage: 4.8, assassin: 4.4, ranger: 4.0, paladin: 3.2, necro: 3.0, warrior: 1.6 };
  const baseMp = classBaseMp[state.classId] || 100;
  const maxMpBonusP = (state.classId === 'paladin' ? (tree.p_p_zeal || 0) * 8 : 0) + (state.classId === 'necro' ? (tree.n_p_summon || 0) * 8 + (activeEffects.has('soul_phylactery') ? 28 : 0) : 0);
  const mpRegenBonusP = (activeEffects.has('seraph_grace') ? 2.2 : 0) + (activeEffects.has('soul_phylactery') ? 2.2 : 0);
  const maxMp = Math.round(baseMp + lvlBonus * 3.5 + (tree.m_p_arcane || 0) * 8 + maxMpFlat + maxMpBonusP + (activeEffects.has('frost_heart') ? 32 : 0));
  const mpRegenPerSec = (classBaseRegen[state.classId] || 3.2)
    + (tree.m_p_ward || 0) * 0.7 + (tree.m_cdr || 0) * 0.7 + mpRegenFlat * 0.55 + mpRegenBonusP + (activeEffects.has('frost_heart') ? 2.2 : 0);

  // v234: 注入六大職業獨立專屬機制常駐屬性加成
  const cm = getClassMechanicStatBonuses(state);
  const ks = getActiveKeystone(state, state?.classId);
  if (ks) {
    if (ks.id === 'wk_endless_fury') { cm.atkSpeedPct += 28; cm.lifesteal += 10; }
    if (ks.id === 'wk_blood_pact')   { cm.maxHpPct -= 55; cm.skillDmgPct += 65; cm.overpowerPct += 45; }
    if (ks.id === 'pk_hammer_domain'){ cm.skillDmgPct += 35; }
    if (ks.id === 'pk_immortal_bulwark') { cm.armorPct += 45; cm.maxHpPct += 30; }
    if (ks.id === 'pk_martyr_crown') { cm.overpowerPct += 18; }
    if (ks.id === 'ak_lethal_tempo') { cm.critRate += 15; cm.critDmg += 70; }
    if (ks.id === 'ak_glass_reaper') { cm.armorPct -= 50; cm.skillDmgPct += 55; }
    if (ks.id === 'rk_gale_crossbow'){ cm.atkSpeedPct += 28; cm.luckyPct += 15; }
    if (ks.id === 'rk_void_sniper')  { cm.critDmg += 110; cm.skillDmgPct += 55; }
    if (ks.id === 'mk_inferno_burn') { cm.skillDmgPct += 45; }
    if (ks.id === 'mk_void_overload'){ cm.luckyPct += 18; }
    if (ks.id === 'mk_mana_singularity') { cm.maxHpPct -= 45; cm.maxMpPct += 100; cm.mpRegenPct += 80; cm.skillDmgPct += 65; }
    if (ks.id === 'nk_undead_overlord')  { cm.atkSpeedPct += 25; cm.critRate += 15; cm.skillDmgPct += 35; }
    if (ks.id === 'nk_bone_tyrant')      { cm.critDmg += 85; cm.overpowerPct += 15; }
    if (ks.id === 'nk_lich_phylactery')  { cm.armorPct -= 40; cm.lifesteal += 14; cm.skillDmgPct += 70; }
  }
  // v237: 注入傳奇威能法典（3槽倍率）＋ 深淵巔峰盤 ＋ 雕紋共鳴加成
  const eg = calcEndgameBonuses(state);
  // v239: 結算 8 部位裝備的淬火詞綴與 18 套流派套裝額外乘區
  const _eqObj = state?.equipment || {};
  const _setCnt = {};
  Object.values(_eqObj).forEach((it) => {
    if (!it) return;
    if (it.rarity === 'set' && it.setId) _setCnt[it.setId] = (_setCnt[it.setId] || 0) + 1;
    if (it.rarity === 'mythic' && it.mythicStats) {
      Object.entries(it.mythicStats).forEach(([k, v]) => {
        if (k === 'critDmgMult2x' && v) eg.critDmgMult2x = true;
        else if (typeof v === 'number' && typeof eg[k] === 'number') eg[k] += v;
      });
    }
    (it.temperedAffixes || []).forEach((tf) => {
      if (typeof eg[tf.key] === 'number') eg[tf.key] += tf.value;
    });
  });
  Object.entries(_setCnt).forEach(([sid, cnt]) => {
    const sDef = SET_DEFINITIONS[sid];
    if (!sDef || !sDef.bonuses) return;
    [2, 4].forEach((req) => {
      if (cnt >= req && sDef.bonuses[req]) {
        Object.entries(sDef.bonuses[req]).forEach(([k, v]) => {
          if (typeof v === 'number' && typeof eg[k] === 'number') eg[k] += v;
        });
      }
    });
  });
  cm.maxHpPct += eg.maxHpPct || 0;
  cm.maxMpPct += eg.maxMpPct || 0;
  cm.mpRegenPct += eg.mpRegenPct || 0;
  cm.armorPct += eg.armorPct || 0;
  cm.atkSpeedPct += eg.atkSpeedPct || 0;
  cm.critRate += eg.critRate || 0;
  cm.critDmg += eg.critDmg || 0;
  cm.lifesteal += eg.lifesteal || 0;
  cm.skillDmgPct += eg.skillDmgPct || 0;
  cm.overpowerPct += eg.overpowerPct || 0;
  cm.luckyPct += eg.luckyPct || 0;
  const egAtkMult = 1 + (eg.atkPct || 0) / 100;
  const finalMaxHp = Math.round(maxHp * (1 + (cm.maxHpPct || 0) / 100));
  const finalMaxMp = Math.round(maxMp * (1 + (cm.maxMpPct || 0) / 100));
  const finalMpRegen = Number((mpRegenPerSec * (1 + (cm.mpRegenPct || 0) / 100)).toFixed(2));
  const finalArmor = Math.round(armor * (1 + (cm.armorPct || 0) / 100));
  const finalCritRate = Math.min(95, Number((critRate + (cm.critRate || 0)).toFixed(1)));
  const finalCritDmg = Math.round((critDmg + (cm.critDmg || 0)) * (eg.critDmgMult2x ? 2.0 : 1.0));
  const finalLifesteal = Number((lifesteal + (cm.lifesteal || 0)).toFixed(1));
  const finalAtkInterval = Math.max(160, Math.round(atkIntervalMs / (1 + (cm.atkSpeedPct || 0) / 100)));
  const finalSkillDmgMult = Number((skillDmgMult * (1 + ((cm.skillDmgPct || 0) + buffSkillDmgPct) / 100)).toFixed(3));
  const resourceCostMult = Math.max(0.65, Number((1 - ((buffs.sageUntil || 0) > nowTs ? 0.14 : 0) - Math.min(0.18, (1 - cdrMult) * 0.35)).toFixed(3)));
  const finalDps = Math.round((atk * (1 + (finalCritRate / 100) * ((finalCritDmg - 100) / 100))) / (finalAtkInterval / 1000));

  return {
    heroLevel: Math.max(1, Number(state.level || 1)),
    resourceCostMult,
    maxHp: finalMaxHp,
    maxMp: finalMaxMp,
    mpRegenPerSec: finalMpRegen,
    atk: Math.round(((ks?.id === 'pk_martyr_crown') ? (atk + finalArmor * 1.8) : atk) * egAtkMult + finalArmor * ((eg.armorToAtkPct || 0) / 100)),
    atkIntervalMs: finalAtkInterval,
    critRate: finalCritRate,
    critDmg: finalCritDmg,
    armor: finalArmor,
    dodge: (ks?.id === 'pk_martyr_crown') ? 0 : dodge,
    lifesteal: finalLifesteal,
    mechOverpowerPct: cm.overpowerPct || 0,
    mechLuckyPct: cm.luckyPct || 0,
    isLoneTyrant: !!cm.isLoneTyrant,
    activeKeystoneId: ks?.id || null,
    endgameProcs: eg.activeProcs,
    goldFind,
    magicFind,
    moveSpeed: Math.round(flat.moveSpeed),
    skillDmgMult: finalSkillDmgMult,
    skillRadiusMult,
    cdrMult,
    treeBoltChance,
    killHealPct,
    expMult,
    bleedDmgPct,
    stunDmgPct,
    pierceDmgPct,
    markCritDmgPct,
    dodgeHealPct,
    chillDmgPct,
    holyDmgPct,
    thornsPct,
    stunDurPct,
    blockHealPct,
    summonDmgPct,
    boneDmgPct,
    corpseRadiusPct,
    killEssence,
    poisonDmgPct: poisonDmgPct + (tree.a_p_venom || 0) * 8 + (activeEffects.has('venom_core') ? 45 : 0),
    comboCritDmgPct,
    dodgeShadow,
    dmgReducePct: (innate.dmgReducePct || 0) + (flat.dmgReducePct || 0) + setDmgReducePct,
    activeSets,
    dps: finalDps,
    activeEffects,
  };
}
