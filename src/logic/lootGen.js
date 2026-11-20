import { EQUIP_SLOTS, RARITIES, BASE_ITEMS, AFFIX_POOL, LEGENDARY_EFFECTS } from '../data/items.js';

let itemUidCounter = Date.now();

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function rollRarity(isBoss, magicFindPct = 0) {
  const mfMult = 1 + Math.max(0, magicFindPct) / 100;
  const roll = Math.random() * 100;
  const legChance = (isBoss ? 14 : 1.8) * mfMult;
  const rareChance = (isBoss ? 44 : 13) * mfMult;
  const magicChance = (isBoss ? 42 : 36) * mfMult;

  if (roll < legChance) return 'legendary';
  if (roll < legChance + rareChance) return 'rare';
  if (roll < legChance + rareChance + magicChance) return 'magic';
  return 'common';
}

export function generateLoot(stage, isBoss = false, magicFindPct = 0, guaranteed = false) {
  // 群怪時代：小怪單隻掉率下修，BOSS 必掉
  const dropChance = guaranteed ? 100 : (isBoss ? 100 : Math.min(48, 14 + magicFindPct * 0.15));
  if (Math.random() * 100 > dropChance) return null;

  const slotKeys = Object.keys(EQUIP_SLOTS);
  const slot = pickRandom(slotKeys);
  const rarityId = rollRarity(isBoss, magicFindPct);
  const rarity = RARITIES[rarityId];

  const bases = BASE_ITEMS[slot];
  const tierIdx = Math.min(bases.length - 1, Math.floor((stage - 1) / 4));
  const baseTpl = bases[randInt(Math.max(0, tierIdx - 1), tierIdx)];

  const levelFactor = 1 + (stage - 1) * 0.24;
  const baseValue = Math.max(1, Math.round(baseTpl.baseVal * levelFactor * rarity.mult * (0.9 + Math.random() * 0.25)));

  const affixCount = randInt(rarity.affixes[0], rarity.affixes[1]);
  const shuffledPool = [...AFFIX_POOL].sort(() => Math.random() - 0.5);
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
    legendaryEffect = pickRandom(LEGENDARY_EFFECTS);
  }

  const prefixLabel = rarityId === 'legendary' ? '遠古・' : (rarityId === 'rare' ? '精良・' : '');
  const item = {
    uid: `item_${++itemUidCounter}_${Math.random().toString(36).slice(2, 6)}`,
    name: `${prefixLabel}${baseTpl.name}`,
    icon: baseTpl.icon,
    slot,
    rarity: rarityId,
    level: stage,
    upgradeLevel: 0,
    baseStat: {
      key: baseTpl.baseStat,
      value: baseValue,
    },
    affixes,
    legendaryEffect,
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
  };
  let score = (item.baseStat.value || 0) * (weights[item.baseStat.key] || 1);
  for (const a of item.affixes || []) {
    score += a.value * (weights[a.key] || 1);
  }
  score *= 1 + (item.upgradeLevel || 0) * 0.12;
  if (item.legendaryEffect) score += 85;
  return Math.round(score);
}

export function getSalvageReward(item) {
  const rarityMult = { common: 1, magic: 2.2, rare: 5, legendary: 14 }[item.rarity] || 1;
  const gold = Math.round((5 + item.level * 3) * rarityMult);
  const dust = Math.max(1, Math.round((1 + item.level * 0.5) * rarityMult));
  return { gold, dust };
}
