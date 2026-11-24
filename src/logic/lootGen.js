import { EQUIP_SLOTS, RARITIES, BASE_ITEMS, AFFIX_POOL, LEGENDARY_EFFECTS, SET_DEFINITIONS } from '../data/items.js?v=99';

let itemUidCounter = Date.now();

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getChapterNum(stage = 1) {
  return Math.max(1, Math.min(10, Math.floor((Math.max(1, stage) - 1) / 10) + 1));
}

// 10 章逐章掉率與稀有度權重表（硬核耐玩低掉率）
const CHAPTER_LOOT_TABLE = {
  1:  { mobMin: 0.30, mobMax: 0.60, boss: 6,  chBoss: 25,  wC: 86, wM: 14,   wR: 0,    wL: 0,    wS: 0,    bossR: 2,  chBossR: 10, bossL: 0,   chBossL: 0,    bossS: 0,   chBossS: 0   },
  2:  { mobMin: 0.45, mobMax: 0.90, boss: 8,  chBoss: 32,  wC: 78, wM: 20,   wR: 2.0,  wL: 0,    wS: 0,    bossR: 5,  chBossR: 16, bossL: 0,   chBossL: 0,    bossS: 0,   chBossS: 0   },
  3:  { mobMin: 0.60, mobMax: 1.20, boss: 10, chBoss: 40,  wC: 70, wM: 26,   wR: 4.0,  wL: 0,    wS: 0,    bossR: 8,  chBossR: 24, bossL: 0.2, chBossL: 1.0,  bossS: 0,   chBossS: 0   },
  4:  { mobMin: 0.80, mobMax: 1.60, boss: 12, chBoss: 48,  wC: 63, wM: 31,   wR: 5.85, wL: 0.15, wS: 0,    bossR: 13, chBossR: 30, bossL: 0.7, chBossL: 2.2,  bossS: 0,   chBossS: 0   },
  5:  { mobMin: 1.00, mobMax: 2.00, boss: 14, chBoss: 55,  wC: 56, wM: 35.6, wR: 8.0,  wL: 0.3,  wS: 0.08, bossR: 17, chBossR: 34, bossL: 1.3, chBossL: 3.5,  bossS: 0.4, chBossS: 1.0 },
  6:  { mobMin: 1.25, mobMax: 2.50, boss: 17, chBoss: 65,  wC: 49, wM: 40.2, wR: 10.0, wL: 0.6,  wS: 0.20, bossR: 21, chBossR: 38, bossL: 2.1, chBossL: 4.6,  bossS: 0.8, chBossS: 1.8 },
  7:  { mobMin: 1.50, mobMax: 3.00, boss: 20, chBoss: 75,  wC: 42, wM: 42.6, wR: 14.0, wL: 1.0,  wS: 0.40, bossR: 25, chBossR: 40, bossL: 3.2, chBossL: 7.2,  bossS: 1.3, chBossS: 3.2 },
  8:  { mobMin: 1.80, mobMax: 3.60, boss: 23, chBoss: 85,  wC: 36, wM: 43.8, wR: 18.0, wL: 1.5,  wS: 0.70, bossR: 29, chBossR: 42, bossL: 4.6, chBossL: 10.0, bossS: 1.8, chBossS: 4.5 },
  9:  { mobMin: 2.10, mobMax: 4.20, boss: 26, chBoss: 92,  wC: 30, wM: 44.8, wR: 22.0, wL: 2.2,  wS: 1.00, bossR: 33, chBossR: 44, bossL: 6.2, chBossL: 13.5, bossS: 2.5, chBossS: 6.2 },
  10: { mobMin: 2.50, mobMax: 5.00, boss: 30, chBoss: 100, wC: 24, wM: 46.0, wR: 25.8, wL: 2.8,  wS: 1.40, bossR: 36, chBossR: 46, bossL: 8.0, chBossL: 17.5, bossS: 3.2, chBossS: 8.0 },
};

const CLASS_AFFIX_PREF = {
  warrior:  new Set(['bleedDmgPct', 'lifesteal', 'atkSpeedPct', 'critDmg', 'atkFlat', 'atkPct']),
  ranger:   new Set(['pierceDmgPct', 'critRate', 'moveSpeedPct', 'atkSpeedPct', 'dodge']),
  mage:     new Set(['cdrPct', 'maxMpFlat', 'mpRegenFlat', 'chillDmgPct', 'skillRadiusPct', 'critDmg']),
  paladin:  new Set(['armorToAtkPct', 'armorFlat', 'hpFlat', 'hpPct', 'stunDmgPct']),
  necro:    new Set(['cdrPct', 'mpRegenFlat', 'hpFlat', 'hpPct', 'skillRadiusPct', 'magicFind']),
  assassin: new Set(['dodgeHealPct', 'markCritDmgPct', 'dodge', 'critRate', 'critDmg', 'atkSpeedPct']),
};

const ZONE_SLOT_BIAS = {
  1: ['weapon', 'armor', 'boots'],
  2: ['helm', 'gloves', 'boots'],
  3: ['armor', 'offhand', 'amulet'],
  4: ['weapon', 'gloves'],
  5: ['armor', 'ring'],
  6: ['helm', 'armor', 'belt'],
  7: ['weapon', 'gloves', 'amulet'],
  8: ['amulet', 'ring', 'offhand'],
  9: ['armor', 'helm', 'weapon'],
  10: ['ring', 'amulet', 'weapon'],
};

const ZONE_AFFIX_BIAS = {
  1: new Set(['atkFlat', 'hpFlat', 'moveSpeedPct']),
  2: new Set(['dodge', 'goldFind', 'magicFind']),
  3: new Set(['armorFlat', 'hpPct', 'mpRegenFlat']),
  4: new Set(['critDmg', 'bleedDmgPct', 'atkPct']),
  5: new Set(['lifesteal', 'critRate', 'atkPct']),
  6: new Set(['chillDmgPct', 'armorToAtkPct', 'stunDmgPct']),
  7: new Set(['atkSpeedPct', 'lifesteal', 'dodgeHealPct']),
  8: new Set(['cdrPct', 'atkSpeedPct', 'skillRadiusPct']),
  9: new Set(['critRate', 'critDmg', 'lifesteal', 'mpRegenFlat']),
  10: new Set(['cdrPct', 'critRate', 'critDmg', 'atkPct', 'magicFind']),
};

export function rollRarity(isBoss, magicFindPct = 0, stage = 1) {
  const ch = getChapterNum(stage);
  const cfg = CHAPTER_LOOT_TABLE[ch];
  const mf = Math.max(0, Number(magicFindPct) || 0);
  // 遞減尋寶率曲線（最高約 1.45x 上限，確保傳說/綠裝絕不氾濫）
  const mfMult = 1 + (0.45 * mf) / (mf + 220);
  const isChapterBoss = isBoss && (stage % 10 === 0);

  let wC = cfg.wC;
  let wM = cfg.wM;
  let wR = isChapterBoss ? cfg.chBossR : (isBoss ? cfg.bossR : cfg.wR);
  let wL = isChapterBoss ? cfg.chBossL : (isBoss ? cfg.bossL : cfg.wL);
  let wS = isChapterBoss ? cfg.chBossS : (isBoss ? cfg.bossS : cfg.wS);

  if (isChapterBoss) wC = 0;

  wR *= (1 + (mfMult - 1) * 0.65);
  wL *= mfMult;
  wS *= mfMult;

  const total = wC + wM + wR + wL + wS;
  let roll = Math.random() * total;
  if (roll < wS) return 'set';
  roll -= wS;
  if (roll < wL) return 'legendary';
  roll -= wL;
  if (roll < wR) return 'rare';
  roll -= wR;
  if (roll < wM) return 'magic';
  return 'common';
}

function pickZoneWeightedSlot(stage) {
  const keys = Object.keys(EQUIP_SLOTS);
  const ch = getChapterNum(stage);
  const favored = new Set(ZONE_SLOT_BIAS[ch] || []);
  const weights = keys.map((k) => (favored.has(k) ? 16 : 9));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < keys.length; i++) {
    r -= weights[i];
    if (r <= 0) return keys[i];
  }
  return pickRandom(keys);
}

function sortAffixesByClassAndZone(affixes, playerClassId, stage) {
  const ch = getChapterNum(stage);
  const clsPref = CLASS_AFFIX_PREF[playerClassId] || new Set();
  const zonePref = ZONE_AFFIX_BIAS[ch] || new Set();
  const filtered = affixes.filter((a) => {
    if (playerClassId === 'warrior' && (a.key === 'maxMpFlat' || a.key === 'mpRegenFlat')) return false;
    if (playerClassId === 'mage' && a.key === 'bleedDmgPct') return false;
    return true;
  });
  const pool = filtered.length ? filtered : affixes;
  return [...pool].sort((a, b) => {
    const sa = (clsPref.has(a.key) ? 0.45 : 0) + (zonePref.has(a.key) ? 0.35 : 0) + Math.random();
    const sb = (clsPref.has(b.key) ? 0.45 : 0) + (zonePref.has(b.key) ? 0.35 : 0) + Math.random();
    return sb - sa;
  });
}

export function generateLoot(stage, isBoss = false, magicFindPct = 0, guaranteed = false, playerClassId = 'warrior') {
  const ch = getChapterNum(stage);
  const cfg = CHAPTER_LOOT_TABLE[ch];
  const isChapterBoss = isBoss && (stage % 10 === 0);
  const mf = Math.max(0, Number(magicFindPct) || 0);

  const mobChance = Math.min(cfg.mobMax, cfg.mobMin + (cfg.mobMax - cfg.mobMin) * (mf / (mf + 200)));
  const bossChance = Math.min(cfg.boss + 15, cfg.boss + mf * 0.05);
  const dropChance = guaranteed ? 100 : (isChapterBoss ? cfg.chBoss : (isBoss ? bossChance : mobChance));

  if (Math.random() * 100 > dropChance) return null;

  const slot = pickZoneWeightedSlot(stage);
  const rarityId = rollRarity(isBoss, magicFindPct, stage);
  const rarity = RARITIES[rarityId];

  // 細分職業掉落：60% 本職專屬 / 32% 全職通用 / 8% 跨職驚喜
  const allBases = BASE_ITEMS[slot];
  const classOnly = allBases.filter((b) => b.classReq === playerClassId);
  const universal = allBases.filter((b) => !b.classReq || b.classReq === 'all');
  const otherCls = allBases.filter((b) => b.classReq && b.classReq !== 'all' && b.classReq !== playerClassId);

  const clsRoll = Math.random();
  let bases = allBases;
  if (clsRoll < 0.60 && classOnly.length > 0) bases = classOnly;
  else if (clsRoll < 0.92 && universal.length > 0) bases = universal;
  else if (otherCls.length > 0) bases = otherCls;
  else if (universal.length > 0) bases = universal;

  const tierRatio = Math.min(1, (Math.max(1, stage) - 1) / 90);
  const maxIdx = Math.min(bases.length - 1, Math.floor(tierRatio * bases.length) + 1);
  const minIdx = Math.max(0, maxIdx - 2);
  const baseTpl = bases[randInt(minIdx, maxIdx)];

  const levelFactor = 1 + (stage - 1) * 0.22;
  const baseValue = Math.max(1, Math.round(baseTpl.baseVal * levelFactor * rarity.mult * (0.9 + Math.random() * 0.25)));

  const affixCount = randInt(rarity.affixes[0], rarity.affixes[1]);
  const itemCls = baseTpl.classReq || 'all';
  const eligibleAffixes = AFFIX_POOL.filter((a) => !a.classReq || itemCls === 'all' || a.classReq === itemCls);
  const shuffledPool = sortAffixesByClassAndZone(eligibleAffixes, itemCls === 'all' ? playerClassId : itemCls, stage);
  const affixes = [];
  for (let i = 0; i < affixCount && i < shuffledPool.length; i++) {
    const a = shuffledPool[i];
    const rawVal = randInt(a.min, a.max) + (stage - 1) * a.scalePerLvl;
    const val = Math.max(1, Math.round(rawVal * (0.85 + Math.random() * 0.3)));
    affixes.push({ key: a.key, label: a.label, unit: a.unit, value: val });
  }

  let legendaryEffect = null;
  if (rarityId === 'legendary') {
    const legPool = LEGENDARY_EFFECTS.filter((le) => le.classReq === 'all' || itemCls === 'all' || le.classReq === itemCls);
    legendaryEffect = pickRandom(legPool.length > 0 ? legPool : LEGENDARY_EFFECTS);
  }

  let setId = null, setName = null;
  if (rarityId === 'set') {
    const targetCls = (itemCls && itemCls !== 'all') ? itemCls : playerClassId;
    const setKey = SET_DEFINITIONS[`set_${targetCls}`] ? `set_${targetCls}` : 'set_abyss';
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
    baseStat: { key: baseTpl.baseStat, value: baseValue },
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
    atkFlat: 4.5, atkPct: 6.0, hpFlat: 0.6, hpPct: 3.5, armorFlat: 3.0,
    critRate: 8.0, critDmg: 2.2, atkSpeedPct: 6.5, dodge: 5.0, lifesteal: 9.0,
    goldFind: 1.5, magicFind: 1.8, bleedDmgPct: 3.5, skillRadiusPct: 4.0,
    stunDmgPct: 3.5, armorToAtkPct: 4.5, moveSpeedPct: 4.5, pierceDmgPct: 3.8,
    markCritDmgPct: 3.2, dodgeHealPct: 7.0, maxMpFlat: 2.0, mpRegenFlat: 8.5,
    cdrPct: 7.5, chillDmgPct: 3.8,
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
  const shuffledPool = sortAffixesByClassAndZone(eligibleAffixes, itemCls, stage);
  const newAffixes = [];
  if (locked) newAffixes.push({ ...locked });
  for (let i = 0; newAffixes.length < affixCount && i < shuffledPool.length; i++) {
    const a = shuffledPool[i];
    const rawVal = randInt(a.min, a.max) + (stage - 1) * a.scalePerLvl;
    const val = Math.max(1, Math.round(rawVal * (0.85 + Math.random() * 0.3)));
    newAffixes.push({ key: a.key, label: a.label, unit: a.unit, value: val });
  }
  item.affixes = newAffixes;
  item.powerScore = calcItemPower(item);
  return { oldAffixes, oldPower, newPower: item.powerScore, locked };
}

export function generateBlackMarketItem(stage, playerClassId = 'warrior', forceRarity = null) {
  const ch = getChapterNum(stage);
  const slot = pickZoneWeightedSlot(stage);

  // 黑市貨架同步下修：Ch1~2 0% 傳說；Ch3~5 2%~4%；Ch6~10 8%~12%
  let legRate = 0;
  let rareRate = 0.18;
  if (ch >= 6) {
    legRate = 0.08 + (ch - 6) * 0.01;
    rareRate = 0.52;
  } else if (ch >= 3) {
    legRate = 0.02 + (ch - 3) * 0.01;
    rareRate = 0.34;
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
  const shuffledPool = sortAffixesByClassAndZone(eligibleAffixes, itemCls === 'all' ? playerClassId : itemCls, stage);
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
    const targetCls = (itemCls && itemCls !== 'all') ? itemCls : playerClassId;
    const setKey = SET_DEFINITIONS[`set_${targetCls}`] ? `set_${targetCls}` : 'set_abyss';
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
