import { CLASSES } from '../data/classes.js?v=98';
import { SET_DEFINITIONS } from '../data/items.js?v=98';

export function formatNum(num) {
  const n = Math.floor(num);
  if (n < 1000) return n.toString();
  if (n < 1e6) return (n / 1e3).toFixed(n >= 1e5 ? 0 : 1) + 'K';
  if (n < 1e9) return (n / 1e6).toFixed(n >= 1e8 ? 0 : 2) + 'M';
  return (n / 1e9).toFixed(2) + 'B';
}

export function getExpToNext(level) {
  return Math.round(90 * Math.pow(1.40, level - 1));
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
  let expMult = 1 + (tree.greed_exp || 0) * 0.12;

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
  const crystalMult = 1 + crystals * 0.15;
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
  if ((buffs.beaconUntil || 0) > nowTs) {
    flat.atkPct += 15;
    flat.defPct += 15;
    flat.magicFind += 15;
  }
  if ((buffs.sporeUntil || 0) > nowTs) {
    flat.atkSpeedPct += 20;
    flat.critRate += 15;
    flat.goldFind += 20;
  }
  if ((buffs.soulUntil || 0) > nowTs) {
    flat.atkPct += 18;
    flat.critDmg += 25;
    flat.magicFind += 15;
  }
  if ((buffs.lavaUntil || 0) > nowTs) {
    flat.atkPct += 25;
    flat.critDmg += 20;
    flat.skillDmgPct += 20;
  }
  if ((buffs.abyssUntil || 0) > nowTs) {
    flat.atkPct += 30;
    flat.critDmg += 20;
    flat.magicFind += 25;
  }
  if ((buffs.auroraUntil || 0) > nowTs) {
    flat.defPct += 25;
    flat.atkSpeedPct += 25;
    flat.dmgReducePct += 10;
  }
  if ((buffs.emeraldUntil || 0) > nowTs) {
    flat.atkPct += 25;
    flat.atkSpeedPct += 25;
    flat.magicFind += 30;
  }
  if ((buffs.stormUntil || 0) > nowTs) {
    flat.atkSpeedPct += 30;
    flat.skillDmgPct += 25;
    flat.critRate += 20;
  }
  if ((buffs.roseUntil || 0) > nowTs) {
    flat.atkPct += 35;
    flat.critDmg += 25;
    flat.lifeSteal += 5;
  }
  if ((buffs.astralUntil || 0) > nowTs) {
    flat.atkPct += 45;
    flat.critDmg += 35;
    flat.atkSpeedPct += 30;
    flat.magicFind += 40;
  }
  if ((buffs.tavernUntil || 0) > nowTs) {
    flat.goldFind += 15;
    expMult += 0.15;
  }
  if ((buffs.guardUntil || 0) > nowTs) {
    flat.defPct += 10;
  }
  if ((buffs.titanUntil || 0) > nowTs) {
    flat.atkPct += 30;
    flat.critDmg += 40;
  }
  if ((buffs.ironUntil || 0) > nowTs) {
    flat.defPct += 35;
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

  const baseMp = state.classId === 'mage' ? 160 : (state.classId === 'ranger' ? 120 : 100);
  const maxMpBonusP = (state.classId === 'paladin' ? (tree.p_p_zeal || 0) * 10 : 0) + (state.classId === 'necro' ? (tree.n_p_summon || 0) * 10 + (activeEffects.has('soul_phylactery') ? 35 : 0) : 0);
  const mpRegenBonusP = (activeEffects.has('seraph_grace') ? 4 : 0) + (activeEffects.has('soul_phylactery') ? 4 : 0);
  const maxMp = Math.round(baseMp + lvlBonus * 4 + (tree.m_p_arcane || 0) * 10 + maxMpFlat + (activeEffects.has('frost_heart') ? 40 : 0));
  const mpRegenPerSec = (state.classId === 'mage' ? 13 : (state.classId === 'ranger' ? 9 : 7))
    + (tree.m_p_ward || 0) * 1.5 + (tree.m_cdr || 0) * 1.5 + mpRegenFlat + (activeEffects.has('frost_heart') ? 4 : 0);

  return {
    maxHp,
    maxMp,
    mpRegenPerSec,
    atk,
    atkIntervalMs,
    critRate,
    critDmg,
    armor,
    dodge,
    lifesteal,
    goldFind,
    magicFind,
    moveSpeed: Math.round(flat.moveSpeed),
    skillDmgMult,
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
    dps,
    activeEffects,
  };
}
