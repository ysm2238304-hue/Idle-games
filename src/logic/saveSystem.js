import { createWaveMonster } from '../data/monsters.js';
import { generateLoot } from './lootGen.js';

const SAVE_KEY = 'desk_diablo_idle_save_v1';

export function createInitialState(classId = 'warrior') {
  return {
    classId,
    level: 1,
    exp: 0,
    gold: 0,
    dust: 0,
    stage: 1,
    wave: 1,
    maxStageReached: 1,
    kills: 0,
    upgrades: {
      atk: 0,
      hp: 0,
      crit: 0,
      speed: 0,
    },
    equipment: {
      weapon: null,
      helm: null,
      armor: null,
      boots: null,
      ring: null,
      amulet: null,
    },
    inventory: [],
    autoSalvage: {
      common: false,
      magic: false,
      rare: false,
    },
    lastSavedAt: Date.now(),
  };
}

export function saveGame(state) {
  try {
    state.lastSavedAt = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('存檔失敗:', e);
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const base = createInitialState(parsed.classId || 'warrior');
    return {
      ...base,
      ...parsed,
      upgrades: { ...base.upgrades, ...(parsed.upgrades || {}) },
      equipment: { ...base.equipment, ...(parsed.equipment || {}) },
      autoSalvage: { ...base.autoSalvage, ...(parsed.autoSalvage || {}) },
      inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [],
    };
  } catch (e) {
    console.warn('讀檔失敗:', e);
    return null;
  }
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}

export function calcOfflineProgress(state, computedStats) {
  const now = Date.now();
  const elapsedSec = Math.floor((now - (state.lastSavedAt || now)) / 1000);
  if (elapsedSec < 20) return null;

  const cappedSec = Math.min(elapsedSec, 12 * 3600); // 上限 12 小時
  const sampleMob = createWaveMonster(state.stage, 1);
  const timePerKill = Math.max(1.5, sampleMob.maxHp / Math.max(1, computedStats.dps) + 0.8);
  const estKills = Math.floor((cappedSec / timePerKill) * 0.75); // 75% 離線效率

  if (estKills <= 0) return null;

  const goldEarned = Math.round(estKills * sampleMob.gold * (1 + computedStats.goldFind / 100));
  const expEarned = estKills * sampleMob.exp;
  const itemsFound = [];
  const rollCount = Math.min(8, Math.floor(estKills / 4));
  for (let i = 0; i < rollCount; i++) {
    const loot = generateLoot(state.stage, false, computedStats.magicFind, false);
    if (loot) itemsFound.push(loot);
  }

  return {
    elapsedSec: cappedSec,
    kills: estKills,
    goldEarned,
    expEarned,
    itemsFound,
  };
}
