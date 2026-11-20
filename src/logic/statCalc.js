import { CLASSES } from '../data/classes.js';

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
    moveSpeed: 135,
  };

  let atkPct = 0;
  let hpPct = 0;
  let armorPct = 0;
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
    };

    if (item.baseStat) applyStat(item.baseStat.key, item.baseStat.value);
    for (const af of item.affixes || []) applyStat(af.key, af.value);
    if (item.legendaryEffect) activeEffects.add(item.legendaryEffect.id);
  }

  // 技能樹加成
  atkPct += (tree.fury_atk || 0) * 6;
  flat.critRate += (tree.fury_crit || 0) * 2.5;
  flat.critDmg += (tree.fury_crit || 0) * 10;
  const skillDmgMult = 1 + (tree.fury_aoe || 0) * 0.15;
  const skillRadiusMult = 1 + (tree.fury_aoe || 0) * 0.16;
  const treeBoltChance = [0, 35, 70, 100][tree.fury_bolt || 0] || 0;

  hpPct += (tree.guard_hp || 0) * 8;
  armorPct += (tree.guard_def || 0) * 12;
  flat.dodge += (tree.guard_def || 0) * 1.5;
  flat.lifesteal += (tree.guard_leech || 0) * 1.5;
  const killHealPct = (tree.guard_leech || 0) * 2;
  flat.atkSpeedPct += (tree.guard_speed || 0) * 6;
  flat.moveSpeed *= 1 + (tree.guard_speed || 0) * 0.08;

  flat.goldFind += (tree.greed_gold || 0) * 10;
  flat.magicFind += (tree.greed_mf || 0) * 8;
  const expMult = 1 + (tree.greed_exp || 0) * 0.12;

  // 深淵魂晶永久輪迴加成
  const crystals = state.soulCrystals || 0;
  const crystalMult = 1 + crystals * 0.15;
  flat.goldFind += crystals * 5;
  flat.magicFind += crystals * 5;

  const maxHp = Math.round(flat.hp * (1 + hpPct / 100) * crystalMult);
  const atk = Math.round(flat.atk * (1 + atkPct / 100) * crystalMult);
  const atkIntervalMs = Math.max(280, Math.round(cls.baseStats.atkIntervalMs / (1 + flat.atkSpeedPct / 100)));
  const critRate = Math.min(85, Math.round(flat.critRate * 10) / 10);
  const critDmg = Math.round(flat.critDmg);
  const armor = Math.round(flat.armor * (1 + armorPct / 100));
  const dodge = Math.min(60, Math.round(flat.dodge * 10) / 10);
  const lifesteal = Math.min(45, Math.round(flat.lifesteal * 10) / 10);
  const goldFind = Math.round(flat.goldFind + (activeEffects.has('greed_blessing') ? 35 : 0));
  const magicFind = Math.round(flat.magicFind);

  const dps = Math.round(
    (atk * (1 + (critRate / 100) * ((critDmg - 100) / 100))) / (atkIntervalMs / 1000)
  );

  return {
    maxHp,
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
    treeBoltChance,
    killHealPct,
    expMult,
    dps,
    activeEffects,
  };
}
