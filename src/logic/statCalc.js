import { CLASSES } from '../data/classes.js';

export function formatNum(num) {
  const n = Math.floor(num);
  if (n < 1000) return n.toString();
  if (n < 1e6) return (n / 1e3).toFixed(n >= 1e5 ? 0 : 1) + 'K';
  if (n < 1e9) return (n / 1e6).toFixed(n >= 1e8 ? 0 : 2) + 'M';
  return (n / 1e9).toFixed(2) + 'B';
}

export function getExpToNext(level) {
  return Math.round(45 * Math.pow(1.28, level - 1));
}

export function getUpgradeCost(type, lvl) {
  const base = { atk: 20, hp: 18, crit: 35, speed: 40 }[type] || 25;
  return Math.round(base * Math.pow(1.32, lvl));
}

export function recalcPlayerStats(state) {
  const cls = CLASSES[state.classId] || CLASSES.warrior;
  const lvlBonus = Math.max(0, state.level - 1);

  const flat = {
    hp: cls.baseStats.hp + Math.round(cls.perLevel.hp * lvlBonus) + (state.upgrades.hp * 22),
    atk: cls.baseStats.atk + Math.round(cls.perLevel.atk * lvlBonus) + (state.upgrades.atk * 4),
    armor: cls.baseStats.armor + Math.round(cls.perLevel.armor * lvlBonus),
    critRate: cls.baseStats.critRate + (state.upgrades.crit * 1.5),
    critDmg: cls.baseStats.critDmg,
    atkSpeedPct: state.upgrades.speed * 4,
    dodge: cls.baseStats.dodge,
    lifesteal: cls.baseStats.lifesteal,
    goldFind: cls.baseStats.goldFind,
    magicFind: cls.baseStats.magicFind,
  };

  let atkPct = 0;
  let hpPct = 0;
  const activeEffects = new Set();

  for (const slotKey of Object.keys(state.equipment)) {
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

  const maxHp = Math.round(flat.hp * (1 + hpPct / 100));
  const atk = Math.round(flat.atk * (1 + atkPct / 100));
  const atkIntervalMs = Math.max(320, Math.round(cls.baseStats.atkIntervalMs / (1 + flat.atkSpeedPct / 100)));
  const critRate = Math.min(85, Math.round(flat.critRate * 10) / 10);
  const critDmg = Math.round(flat.critDmg);
  const armor = Math.round(flat.armor);
  const dodge = Math.min(55, Math.round(flat.dodge * 10) / 10);
  const lifesteal = Math.min(40, Math.round(flat.lifesteal * 10) / 10);
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
    dps,
    activeEffects,
  };
}
