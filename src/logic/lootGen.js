import { EQUIP_SLOTS, RARITIES, BASE_ITEMS, AFFIX_POOL, LEGENDARY_EFFECTS, SET_DEFINITIONS } from '../data/items.js?v=99';

let itemUidCounter = Date.now();

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 耐玩漸進型・正規化權重池（總和永遠 100%，不會溢位）
 * - MF 採用遞減曲線：mfMult = 1 + (2.5 * mf) / (mf + 250)，永遠有效且不爆表
 * - 即使 81+ 關堆滿 MF，小怪傳說仍維持在 ~8.5%，章節王 ~38%，維持神裝價值
 */
export function rollRarity(isBoss, magicFindPct = 0, stage = 1) {
  const mf = Math.max(0, Number(magicFindPct) || 0);
  const mfMult = 1 + (2.5 * mf) / (mf + 250);
  const isChapterBoss = isBoss && (stage % 10 === 0);

  let wCommon = 72;
  let wMagic = 24;
  let wRare = 3.4;
  let wLeg = 0.35;
  let wSet = 0.25;

  if (stage > 80) {
    wCommon = 20; wMagic = 44; wRare = 29; wLeg = 4.8; wSet = 2.2;
  } else if (stage > 50) {
    wCommon = 34; wMagic = 44; wRare = 18; wLeg = 2.8; wSet = 1.2;
  } else if (stage > 20) {
    wCommon = 52; wMagic = 37; wRare = 9.2; wLeg = 1.2; wSet = 0.6;
  }

  if (isChapterBoss) {
    wCommon = 0;
    wMagic = Math.max(10, wMagic * 0.6);
    wRare *= 2.4;
    wLeg *= 6.0;
    wSet *= 5.5;
  } else if (isBoss) {
    wCommon *= 0.25;
    wMagic *= 1.1;
    wRare *= 2.0;
    wLeg *= 3.8;
    wSet *= 3.5;
  }

  // MF 只放大稀有、傳說、套裝權重，不吃掉整體權重正規化
  wRare *= (1 + (mfMult - 1) * 0.65);
  wLeg *= mfMult;
  wSet *= mfMult;

  const total = wCommon + wMagic + wRare + wLeg + wSet;
  let roll = Math.random() * total;

  if (roll < wSet) return 'set';
  roll -= wSet;
  if (roll < wLeg) return 'legendary';
  roll -= wLeg;
  if (roll < wRare) return 'rare';
  roll -= wRare;
  if (roll < wMagic) return 'magic';
  return 'common';
}

export function generateLoot(stage, isBoss = false, magicFindPct = 0, guaranteed = false, playerClassId = 'warrior') {
  const isChapterBoss = isBoss && (stage % 10 === 0);
  // 耐玩偏低掉率：小怪 3.5%~12%、一般 Boss 40%~68%、章節 Boss 100%
  const dropChance = guaranteed
    ? 100
    : (isChapterBoss
      ? 100
      : (isBoss
        ? Math.min(68, 40 + magicFindPct * 0.10)
        : Math.min(12, 3.5 + magicFindPct * 0.04)));

  if (Math.random() * 100 > dropChance) return null;

  const slotKeys = Object.keys(EQUIP_SLOTS);
  const slot = pickRandom(slotKeys);
  const rarityId = rollRarity(isBoss, magicFindPct, stage);
  const rarity = RARITIES[rarityId];

  const allBases = BASE_ITEMS[slot];
  // 75% 智慧掉寶 (Smart Loot)：優先掉落當前職業可穿戴或全職通用裝備
  const smartPool = allBases.filter((b) => !b.classReq || b.classReq === 'all' || b.classReq === playerClassId);
  const bases = (Math.random() < 0.75 && smartPool.length > 0) ? smartPool : allBases;

  const tierRatio = Math.min(1, (Math.max(1, stage) - 1) / 90);
  const maxIdx = Math.min(bases.length - 1, Math.floor(tierRatio * bases.length) + 1);
  const minIdx = Math.max(0, maxIdx - 2);
  const baseTpl = bases[randInt(minIdx, maxIdx)];

  const levelFactor = 1 + (stage - 1) * 0.22;
  const baseValue = Math.max(1, Math.round(baseTpl.baseVal * levelFactor * rarity.mult * (0.9 + Math.random() * 0.25)));

  const affixCount = randInt(rarity.affixes[0], rarity.affixes[1]);
  const itemCls = baseTpl.classReq || 'all';
  const eligibleAffixes = AFFIX_POOL.filter((a) => !a.classReq || itemCls === 'all' || a.classReq === itemCls);
  const shuffledPool = [...eligibleAffixes].sort(() => Math.random() - 0.5);
  const affixes = [];
  for (let i = 0; i < affixCount && i < shuffledPool.length; i++) {
    const a = shuffledPool[i];
    const rawVal = randInt(a.min, a.max) + (stage - 1) * a.scalePerLvl;
    const val = Math.max(1, Math.round(rawVal * (0.85 + Math.random() * 0.3)));
    affixes.push({
      key: a.key,
      label: a.label,
      unit: a.unit,
      value: val,
    });
  }

  let legendaryEffect = null;
  if (rarityId === 'legendary') {
    const legPool = LEGENDARY_EFFECTS.filter((le) => le.classReq === 'all' || itemCls === 'all' || le.classReq === itemCls);
    legendaryEffect = pickRandom(legPool.length > 0 ? legPool : LEGENDARY_EFFECTS);
  }

  let setId = null, setName = null;
  if (rarityId === 'set') {
    const setKey = (itemCls && itemCls !== 'all' && SET_DEFINITIONS[`set_${itemCls}`]) ? `set_${itemCls}` : 'set_abyss';
    setId = setKey;
    setName = SET_DEFINITIONS[setKey].name;
  }
  const prefixLabel = rarityId === 'set' ? '套裝・' : (rarityId === 'legendary' ? '遠古・' : (rarityId === 'rare' ? '精良・' : ''));
  const item = {
    uid: `item_${++itemUidCounter}_${Math.random().toString(36).slice(2, 6)}`,
    name: `${prefixLabel}${baseTpl.name}`,
    icon: baseTpl.icon,
    slot,
    classReq: itemCls,
    subType: baseTpl.subType || EQUIP_SLOTS[slot].label,
    rarity: rarityId,
    level: stage,
    upgradeLevel: 0,
    baseStat: {
      key: baseTpl.baseStat,
      value: baseValue,
    },
    affixes,
    legendaryEffect,
    setId,
    setName,
  };

  item.powerScore = calcItemPower(item);
  return item;
}

export function calcItemPower(item) {
  if (!item) return 0;
  const weights = {
    atkFlat: 4.5,
    atkPct: 6.0,
    hpFlat: 0.6,
    hpPct: 3.5,
    armorFlat: 3.0,
    critRate: 8.0,
    critDmg: 2.2,
    atkSpeedPct: 6.5,
    dodge: 5.0,
    lifesteal: 9.0,
    goldFind: 1.5,
    magicFind: 1.8,
    bleedDmgPct: 3.5,
    skillRadiusPct: 4.0,
    stunDmgPct: 3.5,
    armorToAtkPct: 4.5,
    moveSpeedPct: 4.5,
    pierceDmgPct: 3.8,
    markCritDmgPct: 3.2,
    dodgeHealPct: 7.0,
    maxMpFlat: 2.0,
    mpRegenFlat: 8.5,
    cdrPct: 7.5,
    chillDmgPct: 3.8,
  };
  let score = (item.baseStat.value || 0) * (weights[item.baseStat.key] || 1);
  for (const a of item.affixes || []) {
    score += a.value * (weights[a.key] || 1);
  }
  score *= 1 + (item.upgradeLevel || 0) * 0.12;
  if (item.legendaryEffect) score += 95;
  if (item.setId) score += 120;
  return Math.round(score);
}

export function getSalvageReward(item) {
  const rarityMult = { common: 1, magic: 2.2, rare: 5, legendary: 14, set: 18 }[item.rarity] || 1;
  const gold = Math.round((5 + item.level * 3) * rarityMult);
  const dust = Math.max(1, Math.round((1 + item.level * 0.5) * rarityMult));
  return { gold, dust };
}

export function rerollItemAffixes(item, lockedIdx = -1) {
  if (!item) return null;
  const rarity = RARITIES[item.rarity] || RARITIES.common;
  const stage = Math.max(1, item.level || 1);
  const oldAffixes = (item.affixes || []).map((a) => ({ ...a }));
  const oldPower = calcItemPower(item);
  const locked = (lockedIdx >= 0 && lockedIdx < oldAffixes.length) ? oldAffixes[lockedIdx] : null;

  const affixCount = Math.max(locked ? oldAffixes.length : 1, randInt(rarity.affixes[0], rarity.affixes[1]));
  const itemCls = item.classReq || 'all';
  const eligibleAffixes = AFFIX_POOL.filter((a) => (!a.classReq || itemCls === 'all' || a.classReq === itemCls) && (!locked || a.key !== locked.key));
  const shuffledPool = [...eligibleAffixes].sort(() => Math.random() - 0.5);
  const newAffixes = [];
  if (locked) newAffixes.push({ ...locked });
  for (let i = 0; newAffixes.length < affixCount && i < shuffledPool.length; i++) {
    const a = shuffledPool[i];
    const rawVal = randInt(a.min, a.max) + (stage - 1) * a.scalePerLvl;
    const val = Math.max(1, Math.round(rawVal * (0.85 + Math.random() * 0.3)));
    newAffixes.push({
      key: a.key,
      label: a.label,
      unit: a.unit,
      value: val,
    });
  }
  item.affixes = newAffixes;
  item.powerScore = calcItemPower(item);
  return { oldAffixes, oldPower, newPower: item.powerScore, locked };
}

export function generateBlackMarketItem(stage, playerClassId = 'warrior', forceRarity = null) {
  const slotKeys = Object.keys(EQUIP_SLOTS);
  const slot = pickRandom(slotKeys);

  // 黑市貨架稀有度隨章節進度成長（不再第 1 關就固定 25% 賣傳說）
  let legRate = 0.03;
  let rareRate = 0.35;
  if (stage > 80) {
    legRate = 0.20; rareRate = 0.60;
  } else if (stage > 50) {
    legRate = 0.14; rareRate = 0.56;
  } else if (stage > 20) {
    legRate = 0.08; rareRate = 0.48;
  }
  const r = Math.random();
  const rolledRarity = r < legRate ? 'legendary' : (r < legRate + rareRate ? 'rare' : 'magic');
  const rarityId = forceRarity || rolledRarity;
  const rarity = RARITIES[rarityId] || RARITIES.rare;

  const allBases = BASE_ITEMS[slot];
  const smartPool = allBases.filter((b) => !b.classReq || b.classReq === 'all' || b.classReq === playerClassId);
  const bases = (Math.random() < 0.85 && smartPool.length > 0) ? smartPool : allBases;
  const tierRatio = Math.min(1, (Math.max(1, stage) - 1) / 90);
  const maxIdx = Math.min(bases.length - 1, Math.floor(tierRatio * bases.length) + 1);
  const minIdx = Math.max(0, maxIdx - 2);
  const baseTpl = bases[randInt(minIdx, maxIdx)];

  const levelFactor = 1 + (stage - 1) * 0.22;
  const baseValue = Math.max(1, Math.round(baseTpl.baseVal * levelFactor * rarity.mult * (0.95 + Math.random() * 0.25)));
  const affixCount = randInt(rarity.affixes[0], rarity.affixes[1]);
  const itemCls = baseTpl.classReq || 'all';
  const eligibleAffixes = AFFIX_POOL.filter((a) => !a.classReq || itemCls === 'all' || a.classReq === itemCls);
  const shuffledPool = [...eligibleAffixes].sort(() => Math.random() - 0.5);
  const affixes = [];
  for (let i = 0; i < affixCount && i < shuffledPool.length; i++) {
    const a = shuffledPool[i];
    const rawVal = randInt(a.min, a.max) + (stage - 1) * a.scalePerLvl;
    const val = Math.max(1, Math.round(rawVal * (0.9 + Math.random() * 0.3)));
    affixes.push({ key: a.key, label: a.label, unit: a.unit, value: val });
  }
  let legendaryEffect = null;
  if (rarityId === 'legendary') {
    const legPool = LEGENDARY_EFFECTS.filter((le) => le.classReq === 'all' || itemCls === 'all' || le.classReq === itemCls);
    legendaryEffect = pickRandom(legPool.length > 0 ? legPool : LEGENDARY_EFFECTS);
  }
  let setId = null, setName = null;
  if (rarityId === 'set') {
    const setKey = (itemCls && itemCls !== 'all' && SET_DEFINITIONS[`set_${itemCls}`]) ? `set_${itemCls}` : 'set_abyss';
    setId = setKey;
    setName = SET_DEFINITIONS[setKey].name;
  }
  const prefixLabel = rarityId === 'set' ? '黑市・套裝' : (rarityId === 'legendary' ? '黑市・遠古' : (rarityId === 'rare' ? '黑市・精良' : '黑市・'));
  const item = {
    uid: `item_${++itemUidCounter}_${Math.random().toString(36).slice(2, 6)}`,
    name: `${prefixLabel}${baseTpl.name}`,
    icon: baseTpl.icon,
    slot,
    classReq: itemCls,
    subType: baseTpl.subType || EQUIP_SLOTS[slot].label,
    rarity: rarityId,
    level: stage,
    upgradeLevel: 0,
    baseStat: { key: baseTpl.baseStat, value: baseValue },
    affixes,
    legendaryEffect,
    setId,
    setName,
  };
  item.powerScore = calcItemPower(item);
  return item;
}
