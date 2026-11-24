import { createWaveSquad } from '../data/monsters.js?v=99';
import { generateLoot } from './lootGen.js?v=99';

const SAVE_KEY = 'desk_diablo_idle_save_v1';

export function createInitialState(classId = 'warrior') {
  return {
    classId,
    nickname: '',
    characterCreated: false,
    classProgress: null,
    level: 1,
    exp: 0,
    skillPoints: 1,
    skillTree: { w_whirlwind: 1, r_volley: 1, m_meteor: 1, p_hammer: 1, n_skeleton: 1, a_blitz: 1 },
    equippedSkillsByClass: {
      warrior: ['whirlwind', null, null],
      ranger: ['volley', null, null],
      mage: ['meteor', null, null],
      paladin: ['blessed_hammer', null, null],
      necro: ['raise_skeleton', null, null],
      assassin: ['shadow_blitz', null, null],
    },
    soulCrystals: 0,
    rebirthCount: 0,
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
    equippedPetId: 'pet_c1',
    pets: [{ uid: 'starter_pet_1', petId: 'pet_c1', name: '火精靈幼雛', rarity: 'common', school: 'fire', emoji: '🔥', obtainedAt: Date.now() }],
    petEssence: 0,
    protectStones: 0,
    userSettings: null,
    equipmentByClass: null,
    petByClass: null,
    claimedAchievements: {},
    activeTitle: '',
    maxTowerFloor: 0,
    autoSalvage: {
      common: false,
      magic: false,
      rare: false,
      legendary: false,
      set: false,
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
    const merged = {
      ...base,
      ...parsed,
      upgrades: { ...base.upgrades, ...(parsed.upgrades || {}) },
      equipment: { ...base.equipment, ...(parsed.equipment || {}) },
      autoSalvage: { ...base.autoSalvage, ...(parsed.autoSalvage || {}) },
      skillTree: { w_whirlwind: 1, r_volley: 1, m_meteor: 1, p_hammer: 1, n_skeleton: 1, a_blitz: 1, ...(parsed.skillTree || {}) },
      equippedSkillsByClass: {
        ...base.equippedSkillsByClass,
        ...(parsed.equippedSkillsByClass || {}),
      },
      nickname: typeof parsed.nickname === 'string' ? parsed.nickname : '',
      characterCreated: !!parsed.characterCreated,
      classProgress: (parsed.classProgress && typeof parsed.classProgress === 'object') ? parsed.classProgress : null,
      inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [],
      equippedPetId: parsed.equippedPetId !== undefined ? parsed.equippedPetId : 'pet_c1',
      pets: Array.isArray(parsed.pets) && parsed.pets.length ? parsed.pets : [{ uid: 'starter_pet_1', petId: 'pet_c1', name: '火精靈幼雛', rarity: 'common', school: 'fire', emoji: '🔥', obtainedAt: Date.now() }],
      petEssence: parsed.petEssence || 0,
      protectStones: parsed.protectStones || 0,
      userSettings: parsed.userSettings || null,
      equipmentByClass: parsed.equipmentByClass || null,
      petByClass: parsed.petByClass || null,
      claimedAchievements: parsed.claimedAchievements || {},
      activeTitle: parsed.activeTitle || '',
      maxTowerFloor: parsed.maxTowerFloor || 0,
    };
    if (!merged.equippedSkillsByClass.mage || merged.equippedSkillsByClass.mage.every((s) => !s)) {
      merged.equippedSkillsByClass.mage = ['meteor', null, null];
    }
    if (!merged.equippedSkillsByClass.paladin || merged.equippedSkillsByClass.paladin.every((s) => !s)) {
      merged.equippedSkillsByClass.paladin = ['blessed_hammer', null, null];
    }
    if (!merged.equippedSkillsByClass.necro || merged.equippedSkillsByClass.necro.every((s) => !s)) {
      merged.equippedSkillsByClass.necro = ['raise_skeleton', null, null];
    }
    if (!merged.equippedSkillsByClass.assassin || merged.equippedSkillsByClass.assassin.every((s) => !s)) {
      merged.equippedSkillsByClass.assassin = ['shadow_blitz', null, null];
    }
    // 相容舊版單一 equippedSkills
    if (Array.isArray(parsed.equippedSkills) && !parsed.equippedSkillsByClass) {
      merged.equippedSkillsByClass.warrior = parsed.equippedSkills;
    }
    const freeDefaults = 3; // w_whirlwind:1 + r_volley:1 + m_meteor:1
    const spent = Math.max(0, Object.values(merged.skillTree).reduce((s, v) => s + v, 0) - freeDefaults);
    if (merged.level - 1 > spent + (merged.skillPoints || 0)) {
      merged.skillPoints = Math.max(0, (merged.level - 1) - spent);
    }
    return merged;
  } catch (e) {
    console.warn('讀檔失敗:', e);
    return null;
  }
}

export function calcOfflineProgress(state, computedStats) {
  const now = Date.now();
  const elapsedSec = Math.floor((now - (state.lastSavedAt || now)) / 1000);
  if (elapsedSec < 25) return null;

  const offTree = state.skillTree?.greed_offline || 0;
  const capHours = 6 + offTree;
  const effRate = 0.50 + offTree * 0.08;
  const cappedSec = Math.min(elapsedSec, capHours * 3600);

  const squad = createWaveSquad(state.stage, 1);
  const sampleMob = squad[0];
  const timePerKill = Math.max(1.8, sampleMob.maxHp / Math.max(1, computedStats.dps) + 0.9);
  const estKills = Math.floor((cappedSec / timePerKill) * effRate);

  if (estKills <= 0) return null;

  const goldEarned = Math.round(estKills * sampleMob.gold * (1 + computedStats.goldFind / 100));
  const expEarned = Math.round(estKills * sampleMob.exp * (computedStats.expMult || 1));
  const itemsFound = [];
  const rollCount = Math.min(6, Math.floor(estKills / 6));
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
