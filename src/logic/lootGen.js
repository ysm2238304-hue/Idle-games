import { EQUIP_SLOTS, RARITIES, BASE_ITEMS, AFFIX_POOL, LEGENDARY_EFFECTS, SET_DEFINITIONS, CLASS_ARCHETYPE_SETS, TEMPERING_MANUALS, MYTHIC_UNIQUES } from '../data/items.js?v=317';

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
  1:  { mobMin: 0.6, mobMax: 1.2, boss: 10, chBoss: 45, wC: 85, wM: 15,   wR: 0,    wL: 0,    wS: 0,    bossR: 2,  chBossR: 12, bossL: 0,   chBossL: 0,    bossS: 0,   chBossS: 0   },
  2:  { mobMin: 0.9, mobMax: 1.8, boss: 14, chBoss: 60, wC: 76, wM: 22,   wR: 2.0,  wL: 0,    wS: 0,    bossR: 5,  chBossR: 18, bossL: 0,   chBossL: 0,    bossS: 0,   chBossS: 0   },
  3:  { mobMin: 1.2, mobMax: 2.4, boss: 18, chBoss: 75, wC: 69, wM: 27,   wR: 4.0,  wL: 0,    wS: 0,    bossR: 9,  chBossR: 26, bossL: 0.3, chBossL: 1.2,  bossS: 0,   chBossS: 0   },
  4:  { mobMin: 1.6, mobMax: 3.2, boss: 22, chBoss: 85, wC: 62, wM: 31.8, wR: 6.0,  wL: 0.15, wS: 0,    bossR: 14, chBossR: 32, bossL: 0.8, chBossL: 2.5,  bossS: 0,   chBossS: 0   },
  5:  { mobMin: 2.0, mobMax: 4.0, boss: 26, chBoss: 100,wC: 55, wM: 36.6, wR: 8.0,  wL: 0.3,  wS: 0.08, bossR: 18, chBossR: 36, bossL: 1.5, chBossL: 3.8,  bossS: 0.5, chBossS: 1.2 },
  6:  { mobMin: 2.5, mobMax: 5.0, boss: 30, chBoss: 100,wC: 48, wM: 41.2, wR: 10.0, wL: 0.6,  wS: 0.20, bossR: 22, chBossR: 40, bossL: 2.4, chBossL: 5.0,  bossS: 0.9, chBossS: 2.0 },
  7:  { mobMin: 3.0, mobMax: 6.0, boss: 35, chBoss: 100,wC: 41, wM: 43.6, wR: 14.0, wL: 1.0,  wS: 0.40, bossR: 26, chBossR: 42, bossL: 3.5, chBossL: 8.0,  bossS: 1.4, chBossS: 3.5 },
  8:  { mobMin: 3.6, mobMax: 7.2, boss: 40, chBoss: 100,wC: 35, wM: 44.8, wR: 18.0, wL: 1.5,  wS: 0.70, bossR: 30, chBossR: 44, bossL: 5.0, chBossL: 11.0, bossS: 2.0, chBossS: 5.0 },
  9:  { mobMin: 4.2, mobMax: 8.5, boss: 45, chBoss: 100,wC: 29, wM: 45.8, wR: 22.0, wL: 2.2,  wS: 1.00, bossR: 34, chBossR: 46, bossL: 6.8, chBossL: 15.0, bossS: 2.8, chBossS: 7.0 },
  10: { mobMin: 5.0, mobMax: 10.0,boss: 50, chBoss: 100,wC: 23, wM: 47.0, wR: 25.8, wL: 2.8,  wS: 1.40, bossR: 38, chBossR: 48, bossL: 8.5, chBossL: 19.0, bossS: 3.6, chBossS: 9.0 },
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
  // v240: 第 5 章（Stage 41+）起首領與高難度關卡極低機率掉落「神話暗金（Mythic Unique）」
  if (stage >= 41) {
    const mfBonus = 1 + Math.min(2.5, (magicFindPct || 0) / 150);
    const mythicChance = (isBoss ? 0.018 : 0.0018) * mfBonus;
    if (Math.random() < mythicChance) {
      const pool = MYTHIC_UNIQUES.filter((m) => m.classReq === 'all' || m.classReq === playerClassId);
      const mTpl = pool[Math.floor(Math.random() * pool.length)] || MYTHIC_UNIQUES[0];
      const baseVal = Math.round((28 + stage * 4.5) * 3.1);
      const baseKey = mTpl.slot === 'weapon' || mTpl.slot === 'gloves' || mTpl.slot === 'offhand' ? 'atk' : (mTpl.slot === 'armor' || mTpl.slot === 'helm' ? 'armor' : 'maxHp');
      const affixes = [
        { key: 'critRate', label: '暴擊率', value: Number((6 + Math.random() * 6).toFixed(1)), unit: '%', isGreater: true },
        { key: 'critDmg',  label: '暴擊傷害', value: Math.round(35 + stage * 0.6), unit: '%', isGreater: true },
        { key: 'atk',      label: '攻擊力', value: Math.round(24 + stage * 3.2), unit: '', isGreater: Math.random() < 0.6 },
        { key: 'maxHp',    label: '生命上限', value: Math.round(120 + stage * 18), unit: '', isGreater: false },
      ];
      return {
        uid: `myth_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        mythicId: mTpl.id,
        name: mTpl.name,
        slot: mTpl.slot,
        subType: `神話・${EQUIP_SLOTS[mTpl.slot]?.label || ''}`,
        rarity: 'mythic',
        level: stage,
        classReq: mTpl.classReq,
        icon: mTpl.icon,
        baseStat: { key: baseKey, value: baseVal },
        affixes,
        greaterCount: affixes.filter((a) => a.isGreater).length,
        temperedAffixes: [],
        temperCount: 0,
        mythicEffect: mTpl.mythicEffect,
        mythicStats: mTpl.stats,
        upgradeLevel: 0,
      };
    }
  }
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
    const _archPool = CLASS_ARCHETYPE_SETS[targetCls] || [`set_${targetCls}`];
    const setKey = _archPool[Math.floor(Math.random() * _archPool.length)] || 'set_abyss';
    setId = setKey;
    setName = SET_DEFINITIONS[setKey].name;
  }
  const prefixLabel = rarityId === 'set' ? '套裝・' : (rarityId === 'legendary' ? '遠古・' : (rarityId === 'rare' ? '精良・' : ''));
  // v239: 太古大詞綴 ★（第 4 章 / Stage 31+ 傳奇、套裝、神話有機率骰出 1~3 條 ×1.5 倍大詞綴）
  let greaterCount = 0;
  if (stage >= 31 && (rarityId === 'legendary' || rarityId === 'set' || rarityId === 'mythic')) {
    affixes.forEach((af) => {
      const chance = rarityId === 'mythic' ? 0.45 : (stage >= 61 ? 0.28 : 0.18);
      if (greaterCount < 3 && Math.random() < chance) {
        af.isGreater = true;
        af.value = Math.round(af.value * 1.5 * 10) / 10;
        greaterCount += 1;
      }
    });
  }
  const item = {
    greaterCount,
    temperedAffixes: [],
    temperCount: 0,
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
    const _archPool = CLASS_ARCHETYPE_SETS[targetCls] || [`set_${targetCls}`];
    const setKey = _archPool[Math.floor(Math.random() * _archPool.length)] || 'set_abyss';
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


// v239: 鐵匠流派淬火鍛造（最多淬火 5 次，每次自選定手冊賦予 2 條專屬流派詞綴）
export function temperItem(item, manualId) {
  if (!item) return { ok: false, msg: '請先選擇裝備' };
  const manual = TEMPERING_MANUALS[manualId];
  if (!manual) return { ok: false, msg: '未知的淬火手冊' };
  const used = Number(item.temperCount || 0);
  if (used >= 5) return { ok: false, msg: '此裝備已達淬火上限（5/5 次）' };
  const pool = [...manual.pool];
  const rolled = [];
  for (let i = 0; i < 2 && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const tpl = pool.splice(idx, 1)[0];
    const val = Math.round((tpl.min + Math.random() * (tpl.max - tpl.min)) * 10) / 10;
    rolled.push({ key: tpl.key, label: tpl.label, value: val, unit: tpl.unit, isTempered: true });
  }
  item.temperedAffixes = rolled;
  item.temperCount = used + 1;
  return { ok: true, dustCost: manual.dustCost, rolled, remain: 5 - item.temperCount };
}
