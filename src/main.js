import { CLASSES } from './data/classes.js?v=98';
import { getStageLabel, getSubStage, getChapterIdx } from './data/monsters.js?v=98';
import { WARRIOR_SKILLS } from './data/warriorSkills.js?v=98';
import { RANGER_SKILLS } from './data/rangerSkills.js?v=98';
import { MAGE_SKILLS } from './data/mageSkills.js?v=98';
import { PALADIN_SKILLS } from './data/paladinSkills.js?v=98';
import { NECRO_SKILLS } from './data/necroSkills.js?v=98';
import { ASSASSIN_SKILLS } from './data/assassinSkills.js?v=98';
import { RARITIES } from './data/items.js?v=98';
import { PET_CATALOG, rollPetDrop } from './data/pets.js?v=98';
import { SKILL_TREE_NODES, isNodeUnlocked } from './data/skillTree.js?v=98';
import { generateLoot, calcItemPower, getSalvageReward, rerollItemAffixes, generateBlackMarketItem } from './logic/lootGen.js?v=98';
import { recalcPlayerStats, getExpToNext, getUpgradeCost, calcRebirthCrystals, formatNum } from './logic/statCalc.js?v=98';
import { createInitialState, loadGame, saveGame, calcOfflineProgress } from './logic/saveSystem.js?v=98';
import {
  initCloudAuth,
  signInWithGoogle,
  signOutGoogle,
  getCurrentUser,
  loadCloudSave,
  saveCloudData,
} from './auth/firebase.js?v=98';
import { BattleScene } from './scenes/BattleScene.js?v=98';
import { TownScene } from './scenes/TownScene.js?v=98';
import { TOWN_SPLASHES } from './data/towns/splashes.js?v=98';
import { DashboardUI } from './ui/DashboardUI.js?v=98';
import { TownBgmEngine } from './audio/TownBgmEngine.js?v=98';
import { BattleSfxEngine } from './audio/BattleSfxEngine.js?v=98';
import { HudSettingsManager } from './ui/HudSettingsManager.js?v=98';
import { ShopModal } from './ui/ShopModal.js?v=98';
import { AchievementTowerModal } from './ui/AchievementTowerModal.js?v=98';
import { ACHIEVEMENTS } from './data/achievements.js?v=98';
import { rollEnhance, getEquipEnhanceCost, getPetEnhanceCost, MAX_ENHANCE_LEVEL } from './logic/enhanceSystem.js?v=98';
import { HeroSkillShowcase, CLASS_SKILLS_MAP } from './ui/HeroSkillShowcase.js?v=98';

let gameState = loadGame() || createInitialState('warrior');
let computedStats = recalcPlayerStats(gameState);
let phaserGame = null;
let battleScene = null;
let townScene = null;
let isInTown = false;
let isRecalling = false;
let selectedLobbyClass = gameState.classId || 'warrior';
let gameStarted = false;

function persistAll(syncCloud = false) {
  saveGame(gameState);
  const user = getCurrentUser();
  if (syncCloud && user) {
    saveCloudData(user.uid, gameState);
  }
}

function refreshStatsAndUI() {
  computedStats = recalcPlayerStats(gameState);
  ui.updateTopBar(gameState, computedStats);
  ui.renderAllPanels(gameState, computedStats);
  if (battleScene) battleScene.syncMaxHp();
}

const townBgm = new TownBgmEngine();
const battleSfx = new BattleSfxEngine();
window.__battleSfx = battleSfx;
const hudSettings = new HudSettingsManager({
  townBgm,
  onSave: (stObj) => {
    if (gameState) {
      gameState.userSettings = stObj;
      persistAll(true);
    }
  },
  onExportSave: () => JSON.stringify(gameState),
  onImportSave: (rawStr) => {
    try {
      const parsed = JSON.parse(rawStr);
      if (!parsed || typeof parsed !== 'object' || !parsed.classId) return false;
      const base = createInitialState(parsed.classId || 'warrior');
      Object.assign(gameState, base, parsed);
      if (gameState.userSettings) hudSettings.importSettings(gameState.userSettings);
      refreshStatsAndUI();
      persistAll(true);
      return true;
    } catch { return false; }
  },
});
hudSettings.init();
const shopModal = new ShopModal({
  getState: () => gameState,
  onPurchaseComplete: (id, msg) => {
    if (id === 'pot_heal') {
      battleScene?.healHero?.(computedStats.maxHp);
      battleScene?.addPotionCharge?.(3);
    }
    battleSfx.playShopBuy();
    if (msg) ui.addLog(`🛒 ${msg}`, 'loot');
    refreshStatsAndUI();
    persistAll(true);
  },
});
shopModal.init();
const achTowerModal = new AchievementTowerModal({
  getState: () => gameState,
  onClaimAchievement: (achId) => {
    const a = ACHIEVEMENTS.find((x) => x.id === achId);
    if (!a) return;
    if (!gameState.claimedAchievements) gameState.claimedAchievements = {};
    if (gameState.claimedAchievements[achId] || a.val(gameState) < a.goal) return;
    gameState.claimedAchievements[achId] = true;
    const r = a.reward || {};
    if (r.crystals) gameState.soulCrystals = (gameState.soulCrystals || 0) + r.crystals;
    if (r.protectStones) gameState.protectStones = (gameState.protectStones || 0) + r.protectStones;
    if (r.petEssence) gameState.petEssence = (gameState.petEssence || 0) + r.petEssence;
    if (r.dust) gameState.dust = (gameState.dust || 0) + r.dust;
    if (r.title && !gameState.activeTitle) gameState.activeTitle = r.title;
    battleSfx.playLevelUp();
    ui.addLog(`🏆 領取成就【${a.name}】獎勵成功！`, 'victory');
    refreshStatsAndUI();
    persistAll(true);
  },
  onEquipTitle: (t) => {
    gameState.activeTitle = t || '';
    refreshStatsAndUI();
    persistAll(true);
  },
  onStartTower: (floor) => {
    if (isInTown) exitTownToBattle();
    setTimeout(() => battleScene?.startTowerRun?.(floor), 180);
  },
});
achTowerModal.init();
let powerSaveSession = null;
let powerSaveTimer = null;
function togglePowerSaveMode(forceState = null) {
  const ov = document.getElementById('power-save-overlay');
  if (!ov) return;
  const next = forceState !== null ? !!forceState : ov.classList.contains('hidden');
  window.__powerSaveMode = next;
  ov.classList.toggle('hidden', !next);
  if (next) {
    powerSaveSession = {
      startAt: Date.now(),
      startKills: gameState.kills || 0,
      startGold: gameState.gold || 0,
      highLoot: 0,
      pets: 0,
    };
    const updatePs = () => {
      if (!window.__powerSaveMode || !powerSaveSession) return;
      const sec = Math.max(1, Math.floor((Date.now() - powerSaveSession.startAt) / 1000));
      const hh = String(Math.floor(sec / 3600)).padStart(2, '0');
      const mm = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
      const ss = String(sec % 60).padStart(2, '0');
      const k = Math.max(0, (gameState.kills || 0) - powerSaveSession.startKills);
      const g = Math.max(0, (gameState.gold || 0) - powerSaveSession.startGold);
      const gHr = Math.round((g / sec) * 3600);
      const elT = document.getElementById('ps-time'); if (elT) elT.textContent = `${hh}:${mm}:${ss}`;
      const elK = document.getElementById('ps-kills'); if (elK) elK.textContent = `${k.toLocaleString()} 隻`;
      const elG = document.getElementById('ps-gold'); if (elG) elG.textContent = `+${g.toLocaleString()} (${gHr.toLocaleString()}/時)`;
      const elL = document.getElementById('ps-loot'); if (elL) elL.textContent = `${powerSaveSession.highLoot} 裝 / ${powerSaveSession.pets} 寵`;
      const elH = document.getElementById('ps-hero-line');
      if (elH) elH.textContent = `【${gameState.nickname || '冒險者'}】Lv.${gameState.level} ・ 第 ${getStageLabel(gameState.stage)} 關 ・ 秒傷 ${computedStats.dps}`;
    };
    updatePs();
    clearInterval(powerSaveTimer);
    powerSaveTimer = setInterval(updatePs, 1000);
  } else {
    clearInterval(powerSaveTimer);
    powerSaveTimer = null;
  }
}
document.getElementById('btn-power-save')?.addEventListener('click', () => togglePowerSaveMode(true));
document.getElementById('power-save-overlay')?.addEventListener('click', () => togglePowerSaveMode(false));

document.getElementById('btn-exit-tower')?.addEventListener('click', () => {
  battleScene?.exitTowerMode?.('已主動撤退返回主城');
});
document.getElementById('btn-lobby-settings')?.addEventListener('click', () => hudSettings.openModal());
const heroShowcase = new HeroSkillShowcase();
const ui = new DashboardUI({
  onSelectClass: (classId) => {
    switchStateToClass(classId, gameState);
    selectedLobbyClass = classId;
    const cls = CLASSES[classId];
    ui.addLog(`切換職業為【${cls.name} Lv.${gameState.level}】！`, 'system');
    refreshStatsAndUI();
    if (battleScene) battleScene.refreshHeroClass(classId);
    persistAll(true);
  },

  onEquipSkill: (slotIdx, skillId) => {
    const cid = gameState.classId || 'warrior';
    const book = cid === 'warrior' ? WARRIOR_SKILLS : (cid === 'ranger' ? RANGER_SKILLS : (cid === 'paladin' ? PALADIN_SKILLS : (cid === 'necro' ? NECRO_SKILLS : (cid === 'assassin' ? ASSASSIN_SKILLS : MAGE_SKILLS))));
    if (!gameState.equippedSkillsByClass) {
      gameState.equippedSkillsByClass = { warrior: ['whirlwind', null, null], ranger: ['volley', null, null], mage: ['meteor', null, null], paladin: ['blessed_hammer', null, null], necro: ['raise_skeleton', null, null], assassin: ['shadow_blitz', null, null] };
    }
    const eq = [...(gameState.equippedSkillsByClass[cid] || [null, null, null])];
    const existIdx = eq.indexOf(skillId);
    if (existIdx !== -1 && existIdx !== slotIdx) {
      eq[existIdx] = eq[slotIdx];
    }
    eq[slotIdx] = skillId;
    gameState.equippedSkillsByClass[cid] = eq;
    ui.addLog(`已將【${book[skillId]?.name}】裝備至技能槽 ${slotIdx + 1}`, 'system');
    refreshStatsAndUI();
    persistAll(true);
  },

  onEquipItem: (uid) => {
    const idx = gameState.inventory.findIndex((i) => i.uid === uid);
    if (idx === -1) return;
    const item = gameState.inventory[idx];
    if (item.classReq && item.classReq !== 'all' && item.classReq !== gameState.classId) {
      ui.addLog(`職業不符，無法穿戴【${item.name}】！`, 'warn');
      return;
    }
    const prev = gameState.equipment[item.slot];
    gameState.equipment[item.slot] = item;
    gameState.inventory.splice(idx, 1);
    if (prev) gameState.inventory.unshift(prev);
    ui.selectedItemUid = null;
    ui.addLog(`裝備了 [${RARITIES[item.rarity].label}] ${item.name}`, 'system');
    refreshStatsAndUI();
    ui.renderItemInspector(item, true, gameState);
    persistAll(true);
  },

  onUpgradeItem: (uid, isEquipped) => {
    const item = isEquipped
      ? Object.values(gameState.equipment).find((i) => i && i.uid === uid)
      : gameState.inventory.find((i) => i.uid === uid);
    if (!item || (item.upgradeLevel || 0) >= MAX_ENHANCE_LEVEL) return;
    const { gold, dust } = getEquipEnhanceCost(item);
    if ((gameState.gold || 0) < gold || (gameState.dust || 0) < dust) {
      ui.addLog(`強化資源不足（需 ${gold} 金幣${dust ? ` + ${dust} 粉塵` : ''}）！`, 'warn');
      return;
    }
    gameState.gold -= gold;
    gameState.dust -= dust;
    const res = rollEnhance(item, (gameState.protectStones || 0) > 0, gameState);
    item.powerScore = calcItemPower(item);
    battleSfx.playEnhance(res.ok);
    if (res.ok) {
      ui.addLog(`⚒️ 強化成功！「${item.name}」升至 +${res.newLv}（成功率 ${res.rate}%）！`, 'victory');
    } else {
      ui.addLog(`💨 強化失敗（${res.rate}%），「${item.name}」${res.demoted ? `降為 +${res.newLv}` : `維持 +${res.newLv}`}${res.protectedUsed ? '（保護石已生效）' : ''}！`, 'system');
    }
    refreshStatsAndUI();
    ui.renderItemInspector(item, isEquipped, gameState);
    persistAll(true);
  },

  onSalvageItem: (uid) => {
    const idx = gameState.inventory.findIndex((i) => i.uid === uid);
    if (idx === -1) return;
    const item = gameState.inventory[idx];
    const rew = getSalvageReward(item);
    gameState.gold += rew.gold;
    gameState.dust += rew.dust;
    gameState.inventory.splice(idx, 1);
    ui.selectedItemUid = null;
    ui.renderItemInspector(null, false, gameState);
    ui.addLog(`分解 ${item.name}：+${rew.gold} 金幣、+${rew.dust} 粉塵`, 'normal');
    refreshStatsAndUI();
    persistAll();
  },

  onSalvageAllJunk: () => {
    if (gameState.inventory.length === 0) return;
    const targets = new Set(['common', 'magic', 'rare', 'legendary'].filter((r) => gameState.autoSalvage?.[r]));
    if (targets.size === 0) { targets.add('common'); targets.add('magic'); }
    let count = 0, totalGold = 0, totalDust = 0;
    const vr = gameState.vaultRules || {};
    const isProtected = (it) => {
      if (vr.keepClassReq && it.classReq === gameState.classId) return true;
      if (vr.keepDoubleCrit) {
        const keys = new Set((it.affixes || []).map((a) => a.key));
        if (keys.has('critRate') && keys.has('critDmg')) return true;
      }
      return false;
    };
    gameState.inventory = gameState.inventory.filter((item) => {
      if (targets.has(item.rarity) && !isProtected(item)) {
        const rew = getSalvageReward(item);
        totalGold += rew.gold;
        totalDust += rew.dust;
        count++;
        return false;
      }
      return true;
    });
    if (count > 0) {
      gameState.gold += totalGold;
      gameState.dust += totalDust;
      ui.selectedItemUid = null;
      ui.renderItemInspector(null, false, gameState);
      ui.addLog(`分解 ${count} 件指定品質裝備：+${totalGold} 金幣、+${totalDust} 粉塵`, 'loot');
      refreshStatsAndUI();
      persistAll(true);
    } else {
      ui.addLog('背包內沒有符合所選品質的裝備可分解。', 'normal');
    }
  },

  onSellSelectedJunk: () => {
    if (gameState.inventory.length === 0) return;
    const targets = new Set(['common', 'magic', 'rare', 'legendary'].filter((r) => gameState.autoSalvage?.[r]));
    if (targets.size === 0) { targets.add('common'); targets.add('magic'); }
    let count = 0, totalGold = 0;
    const vr = gameState.vaultRules || {};
    const isProtected = (it) => {
      if (vr.keepClassReq && it.classReq === gameState.classId) return true;
      if (vr.keepDoubleCrit) {
        const keys = new Set((it.affixes || []).map((a) => a.key));
        if (keys.has('critRate') && keys.has('critDmg')) return true;
      }
      return false;
    };
    gameState.inventory = gameState.inventory.filter((item) => {
      if (targets.has(item.rarity) && !isProtected(item)) {
        const rew = getSalvageReward(item);
        totalGold += Math.round(rew.gold * 2.5 + rew.dust * 8);
        count++;
        return false;
      }
      return true;
    });
    if (count > 0) {
      gameState.gold += totalGold;
      ui.selectedItemUid = null;
      ui.renderItemInspector(null, false, gameState);
      ui.addLog(`出售 ${count} 件指定品質裝備換取 +${totalGold} 金幣！`, 'loot');
      refreshStatsAndUI();
      persistAll(true);
    } else {
      ui.addLog('背包內沒有符合所選品質的裝備可出售。', 'normal');
    }
  },

  onAutoEquipBest: () => {
    const cid = gameState.classId || 'warrior';
    let swapped = 0;
    const slots = ['weapon', 'helm', 'armor', 'boots', 'ring', 'amulet'];
    slots.forEach((slot) => {
      const cur = gameState.equipment[slot];
      let bestIdx = -1;
      let bestPwr = calcItemPower(cur);
      gameState.inventory.forEach((it, idx) => {
        if (it.slot !== slot) return;
        if (it.classReq && it.classReq !== 'all' && it.classReq !== cid) return;
        const p = calcItemPower(it);
        if (p > bestPwr) {
          bestPwr = p;
          bestIdx = idx;
        }
      });
      if (bestIdx !== -1) {
        const newIt = gameState.inventory.splice(bestIdx, 1)[0];
        if (cur) gameState.inventory.push(cur);
        gameState.equipment[slot] = newIt;
        swapped++;
      }
    });
    if (swapped > 0) {
      ui.selectedItemUid = null;
      ui.addLog(`⚔️ 一鍵最佳裝備：已自動換上 ${swapped} 件更高戰力裝備！`, 'victory');
      refreshStatsAndUI();
      persistAll(true);
    } else {
      ui.addLog('身上裝備已是目前職業最強配置！', 'system');
    }
  },

  onSortBag: () => {
    const cid = gameState.classId || 'warrior';
    const rRank = { legendary: 4, rare: 3, magic: 2, common: 1 };
    gameState.inventory.sort((a, b) => {
      const aOk = (!a.classReq || a.classReq === 'all' || a.classReq === cid) ? 1 : 0;
      const bOk = (!b.classReq || b.classReq === 'all' || b.classReq === cid) ? 1 : 0;
      if (aOk !== bOk) return bOk - aOk;
      if ((rRank[b.rarity] || 0) !== (rRank[a.rarity] || 0)) return (rRank[b.rarity] || 0) - (rRank[a.rarity] || 0);
      return calcItemPower(b) - calcItemPower(a);
    });
    ui.addLog('🧹 已依職業適用、稀有度與戰力自動整理背包！', 'system');
    refreshStatsAndUI();
    persistAll();
  },

  onToggleAutoSalvage: (rarity, checked) => {
    gameState.autoSalvage[rarity] = checked;
    persistAll();
  },

  onBuyUpgrade: (key) => {
    const cost = getUpgradeCost(key, gameState.upgrades[key] || 0);
    if (gameState.gold < cost) return;
    gameState.gold -= cost;
    gameState.upgrades[key] = (gameState.upgrades[key] || 0) + 1;
    refreshStatsAndUI();
    persistAll(true);
  },

  onUpgradeSkillNode: (nodeId) => {
    if ((gameState.skillPoints || 0) <= 0) return;
    const node = SKILL_TREE_NODES.find((n) => n.id === nodeId);
    if (!node) return;
    const tree = gameState.skillTree || {};
    const cur = tree[nodeId] || 0;
    if (cur >= node.maxLvl || !isNodeUnlocked(node, tree)) return;

    gameState.skillPoints -= 1;
    tree[nodeId] = cur + 1;
    gameState.skillTree = tree;

    const allActive = [
      { cid: 'warrior', book: WARRIOR_SKILLS },
      { cid: 'ranger',  book: RANGER_SKILLS },
      { cid: 'mage',    book: MAGE_SKILLS },
      { cid: 'paladin', book: PALADIN_SKILLS },
      { cid: 'necro',   book: NECRO_SKILLS },
      { cid: 'assassin',book: ASSASSIN_SKILLS },
    ];
    allActive.forEach(({ cid, book }) => {
      const unlockedSk = Object.values(book).find((s) => s.treeNodeId === nodeId);
      if (unlockedSk && cur === 0) {
        const eq = [...(gameState.equippedSkillsByClass?.[cid] || [null, null, null])];
        const emptySlot = eq.indexOf(null);
        if (emptySlot !== -1 && !eq.includes(unlockedSk.id)) {
          eq[emptySlot] = unlockedSk.id;
          gameState.equippedSkillsByClass[cid] = eq;
        }
      }
    });

    ui.addLog(`技能樹升級：【${node.name}】Lv.${cur + 1}`, 'system');
    refreshStatsAndUI();
    persistAll(true);
  },

  onResetSkillTree: () => {
    const tree = gameState.skillTree || {};
    const spent = Object.values(tree).reduce((s, v) => s + v, 0) - 6;
    if (spent <= 0) return;
    gameState.skillPoints = (gameState.skillPoints || 0) + spent;
    gameState.skillTree = { w_whirlwind: 1, r_volley: 1, m_meteor: 1, p_hammer: 1, n_skeleton: 1, a_blitz: 1 };
    gameState.equippedSkillsByClass = { warrior: ['whirlwind', null, null], ranger: ['volley', null, null], mage: ['meteor', null, null], paladin: ['blessed_hammer', null, null], necro: ['raise_skeleton', null, null], assassin: ['shadow_blitz', null, null] };
    ui.addLog(`已重置技能樹並返還 ${spent} 點技能點。`, 'system');
    refreshStatsAndUI();
    persistAll(true);
  },

  onRebirth: () => {
    const gain = calcRebirthCrystals(gameState.maxStageReached || 1);
    if (gain <= 0) return;
    gameState.soulCrystals = (gameState.soulCrystals || 0) + gain;
    gameState.rebirthCount = (gameState.rebirthCount || 0) + 1;
    gameState.level = 1;
    gameState.exp = 0;
    gameState.skillPoints = 1;
    gameState.skillTree = { w_whirlwind: 1, r_volley: 1, m_meteor: 1, p_hammer: 1, n_skeleton: 1, a_blitz: 1 };
    gameState.equippedSkillsByClass = { warrior: ['whirlwind', null, null], ranger: ['volley', null, null], mage: ['meteor', null, null], paladin: ['blessed_hammer', null, null], necro: ['raise_skeleton', null, null], assassin: ['shadow_blitz', null, null] };
    gameState.gold = 0;
    gameState.stage = 1;
    gameState.wave = 1;
    gameState.maxStageReached = 1;
    gameState.upgrades = { atk: 0, hp: 0, crit: 0, speed: 0 };

    ui.addLog(`🌀 深淵輪迴成功！獲得 +${gain} 魂晶（目前共 ${gameState.soulCrystals} 顆）！`, 'victory');
    refreshStatsAndUI();
    if (battleScene) {
      battleScene.refreshHeroClass(gameState.classId);
      battleScene.spawnWaveSquad();
    }
    persistAll(true);
  },

  onJumpStage: (targetStage) => {
    const target = Math.max(1, Math.min(100, targetStage));
    gameState.stage = target;
    gameState.wave = 1;
    if (isInTown) exitTownToBattle(true);
    ui.addLog(`傳送至第 ${getStageLabel(target)} 關刷寶。`, 'system');
    refreshStatsAndUI();
    if (battleScene && battleScene.scene?.isActive()) battleScene.spawnWaveSquad();
    persistAll(true);
  },

  onChangeStage: (delta) => {
    const target = Math.max(1, Math.min(100, gameState.stage + delta));
    if (target === gameState.stage) return;
    gameState.stage = target;
    gameState.wave = 1;
    if (isInTown) exitTownToBattle(true);
    ui.addLog(`切換至第 ${getStageLabel(target)} 關刷寶。`, 'system');
    refreshStatsAndUI();
    if (battleScene && battleScene.scene?.isActive()) battleScene.spawnWaveSquad();
    persistAll();
  },
});

function ensureClassProgress(st = gameState) {
  if (!st.classProgress) st.classProgress = {};
  const curId = st.classId || 'warrior';
  for (const cid of Object.keys(CLASSES)) {
    if (!st.classProgress[cid]) {
      st.classProgress[cid] = (cid === curId)
        ? { level: st.level || 1, exp: st.exp || 0 }
        : { level: 1, exp: 0 };
    }
  }
  return st.classProgress;
}

function syncActiveClassProgress(st = gameState) {
  const cp = ensureClassProgress(st);
  const curId = st.classId || 'warrior';
  cp[curId] = { level: st.level || 1, exp: st.exp || 0 };
}

function switchStateToClass(newClassId, st = gameState) {
  const cp = ensureClassProgress(st);
  const oldId = st.classId || 'warrior';
  cp[oldId] = { level: st.level || 1, exp: st.exp || 0 };
  if (!st.equipmentByClass) st.equipmentByClass = {};
  if (!st.petByClass) st.petByClass = {};
  st.equipmentByClass[oldId] = { ...(st.equipment || { weapon: null, helm: null, armor: null, boots: null, ring: null, amulet: null }) };
  st.petByClass[oldId] = st.equippedPetId || null;

  st.classId = newClassId;
  const next = cp[newClassId] || { level: 1, exp: 0 };
  st.level = next.level || 1;
  st.exp = next.exp || 0;
  if (oldId !== newClassId) {
    st.equipment = st.equipmentByClass[newClassId]
      ? { weapon: null, helm: null, armor: null, boots: null, ring: null, amulet: null, ...st.equipmentByClass[newClassId] }
      : { weapon: null, helm: null, armor: null, boots: null, ring: null, amulet: null };
    if (st.petByClass[newClassId] !== undefined) {
      st.equippedPetId = st.petByClass[newClassId];
    }
  }
}

function grantExp(amount) {
  const expBuffMult = ((gameState.potionBuffs?.expUntil || 0) > Date.now()) ? 1.5 : 1.0;
  const gained = Math.round(amount * (computedStats.expMult || 1) * expBuffMult);
  gameState.exp += gained;
  let need = getExpToNext(gameState.level);
  while (gameState.exp >= need) {
    gameState.exp -= need;
    gameState.level += 1;
    gameState.skillPoints = (gameState.skillPoints || 0) + 1;
    need = getExpToNext(gameState.level);
    battleSfx.playLevelUp();
    ui.addLog(`🎉 角色升級至 Lv.${gameState.level}（獲得 +1 技能點）`, 'victory');
  }
  syncActiveClassProgress(gameState);
}

function handleLootDrop(item) {
  if (!item) return null;
  if (gameState.autoSalvage[item.rarity] || gameState.inventory.length >= 60) {
    const rew = getSalvageReward(item);
    gameState.gold += rew.gold;
    gameState.dust += rew.dust;
    ui.addLog(`自動分解 [${RARITIES[item.rarity].label}] ${item.name} (+${rew.gold}金/+${rew.dust}粉)`, 'normal');
    return null;
  }
  gameState.inventory.unshift(item);
  const equipped = gameState.equipment[item.slot];
  if (calcItemPower(item) > calcItemPower(equipped)) {
    ui.markBagUpgradeDot();
  }
  const r = RARITIES[item.rarity];
  if (item.rarity === 'legendary' || item.rarity === 'rare') {
    ui.addLog(`✨ 掉落 [${r.label}] ${item.name} (戰力 ${item.powerScore})！`, 'victory');
  }
  return item;
}

function initPhaserGame() {
  if (phaserGame) {
    battleScene?.setPaused(false);
    requestAnimationFrame(() => phaserGame.scale.refresh());
    return;
  }
  const stageEl = document.getElementById('phaser-stage');
  const w = Math.max(640, stageEl?.clientWidth || window.innerWidth);
  const h = Math.max(400, stageEl?.clientHeight || window.innerHeight);

  const config = {
    type: Phaser.AUTO,
    parent: 'phaser-stage',
    width: w,
    height: h,
    backgroundColor: '#090b10',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BattleScene, TownScene],
  };

  window.__IDLE_ARPG_BRIDGE__ = {
    getState: () => gameState,
    getStats: () => computedStats,
    callbacks: {
      onSkillTicks: (ratios, cdDetails) => ui.updateSkillProgress(ratios, cdDetails),
      onVitalsTick: (vitals) => ui.updateVitals(vitals),
      onHudTick: (data) => {
        ui.updateTargetFrame(data.target);
        ui.updateStageTracker(data.tracker);
        ui.renderMinimap(data.minimap);
      },
      onTowerFloorCleared: (floor) => {
        gameState.maxTowerFloor = Math.max(gameState.maxTowerFloor || 0, floor);
        const goldRew = floor * 450;
        const dustRew = 18 + floor * 6;
        gameState.gold = (gameState.gold || 0) + goldRew;
        gameState.dust = (gameState.dust || 0) + dustRew;
        if (floor % 5 === 0) {
          gameState.soulCrystals = (gameState.soulCrystals || 0) + 2;
          gameState.petEssence = (gameState.petEssence || 0) + 25;
          const setEq = generateBlackMarketItem(Math.min(100, Math.max(gameState.maxStageReached || 1, floor * 3)), gameState.classId, 'set');
          gameState.inventory.unshift(setEq);
          ui.addLog(`🌀 突破無盡塔第 ${floor} 層！獲得綠色套裝【${setEq.name}】+ 2 魂晶 + 25 寵物精華！`, 'victory');
        } else {
          ui.addLog(`🌀 突破無盡塔第 ${floor} 層！（+${goldRew} 金幣 / +${dustRew} 粉塵）`, 'victory');
        }
        battleSfx.playLevelUp();
        refreshStatsAndUI();
        persistAll(true);
      },
      onTowerExit: (floor, reason) => {
        if (reason) ui.addLog(`🌀 無盡深淵塔（第 ${floor} 層）：${reason}`, 'system');
        enterTown(Math.min(9, getChapterIdx(gameState.stage)));
      },
      onLootPickedUp: (item) => {
        if (!item) return;
        if (item.isPet) {
          if (powerSaveSession) powerSaveSession.pets += 1;
          if (!gameState.pets) gameState.pets = [];
          gameState.pets.push(item);
          if (!gameState.equippedPetId) gameState.equippedPetId = item.petId;
          ui.addLog(`🐾 拾取寵物 [${RARITIES[item.rarity]?.label || '普通'}] ${item.name}！`, 'loot');
          refreshStatsAndUI();
          persistAll(true);
          return;
        }
        if (powerSaveSession && (item.rarity === 'legendary' || item.rarity === 'set')) powerSaveSession.highLoot += 1;
        handleLootDrop(item);
        refreshStatsAndUI();
        persistAll();
      },
      onMonsterKilled: (mob, waveCleared) => {
        const cCnt = battleScene?.comboCount || 0;
        const comboMult = cCnt >= 100 ? 1.3 : (cCnt >= 60 ? 1.18 : (cCnt >= 30 ? 1.1 : (cCnt >= 15 ? 1.05 : 1)));
        const goldGain = Math.round(mob.gold * (1 + computedStats.goldFind / 100) * comboMult);
        gameState.gold += goldGain;
        gameState.kills += 1;
        if (mob.isBoss) {
          if (!gameState.bountyProgress) gameState.bountyProgress = { bossKills: 0, claimed: {} };
          gameState.bountyProgress.bossKills = (gameState.bountyProgress.bossKills || 0) + 1;
        }
        grantExp(Math.round(mob.exp * comboMult));

        const dropped = generateLoot(mob.stage, mob.isBoss, computedStats.magicFind, false, gameState.classId);
        const droppedPet = rollPetDrop(mob.stage, mob.isBoss, computedStats.magicFind);

        if (waveCleared) {
          const clearedLabel = getStageLabel(gameState.stage);
          const subSt = getSubStage(gameState.stage);
          if (subSt === 5 || subSt === 10) {
            gameState.skillPoints = (gameState.skillPoints || 0) + 1;
            ui.addLog(`🏆 全清第 ${clearedLabel} 關並擊破首領，額外獲得 +1 技能點！`, 'victory');
          } else {
            ui.addLog(`🏆 成功全清第 ${clearedLabel} 關！`, 'victory');
          }
          const nextUnlock = Math.min(100, gameState.stage + 1);
          gameState.maxStageReached = Math.max(gameState.maxStageReached || 1, nextUnlock);
          persistAll(true);
        }

        let droppedPotion = null;
        const potRoll = Math.random() * 100;
        const potChance = mob.isBoss ? 55 : 14;
        if (potRoll < potChance) {
          const r2 = Math.random();
          if (r2 < 0.30) droppedPotion = { id: 'hp_pot', label: '🔴 生命藥水', color: 0xef4444 };
          else if (r2 < 0.56) droppedPotion = { id: 'mp_pot', label: '🔵 魔力藥水', color: 0x38bdf8 };
          else if (r2 < 0.76) droppedPotion = { id: 'exp_pot', label: '🟡 經驗藥水', color: 0xfacc15 };
          else if (r2 < 0.90) droppedPotion = { id: 'fury_pot', label: '🟣 狂暴藥水', color: 0xc084fc };
          else droppedPotion = { id: 'mf_pot', label: '🟢 尋寶藥水', color: 0x4ade80 };

          if (!gameState.potionBuffs) gameState.potionBuffs = {};
          const nowTs = Date.now();
          if (droppedPotion.id === 'hp_pot') {
            battleScene?.healHero(Math.round(computedStats.maxHp * 0.35));
            battleScene?.addPotionCharge?.(1);
            ui.addLog('🔴 拾取生命藥水：回復 35% 生命並補充藥水次數！', 'loot');
          } else if (droppedPotion.id === 'mp_pot') {
            battleScene?.restoreMana?.(Math.round((computedStats.maxMp || 100) * 0.45));
            ui.addLog('🔵 拾取魔力藥水：立即回復 45% 能量！', 'loot');
          } else if (droppedPotion.id === 'exp_pot') {
            gameState.potionBuffs.expUntil = Math.max(nowTs, gameState.potionBuffs.expUntil || 0) + 60000;
            ui.addLog('🟡 拾取經驗藥水：獲得 60 秒經驗值 +50% 加成！', 'loot');
          } else if (droppedPotion.id === 'fury_pot') {
            gameState.potionBuffs.furyUntil = Math.max(nowTs, gameState.potionBuffs.furyUntil || 0) + 45000;
            ui.addLog('🟣 拾取狂暴藥水：獲得 45 秒攻速 +25%、暴擊 +10%！', 'loot');
          } else if (droppedPotion.id === 'mf_pot') {
            gameState.potionBuffs.mfUntil = Math.max(nowTs, gameState.potionBuffs.mfUntil || 0) + 60000;
            ui.addLog('🟢 拾取尋寶藥水：獲得 60 秒掉寶率 +40%、金幣 +30%！', 'loot');
          }
        }

        refreshStatsAndUI();
        return { item: dropped, pet: droppedPet, potion: droppedPotion };
      },
      onStageClearedDisabled: (clearedStage) => {
        const modal = document.getElementById('modal-stage-clear');
        const titleEl = document.getElementById('clear-modal-title');
        const descEl = document.getElementById('clear-modal-desc');
        const nextBtn = document.getElementById('btn-clear-next');
        const repBtn = document.getElementById('btn-clear-repeat');
        const chkAuto = document.getElementById('chk-auto-repeat');
        const cdEl = document.getElementById('clear-countdown');
        if (!modal) {
          battleScene?.spawnWaveSquad();
          return;
        }
        const curLbl = getStageLabel(clearedStage);
        const hasNext = clearedStage < 100;
        const nextStage = hasNext ? clearedStage + 1 : 100;
        const nextLbl = getStageLabel(nextStage);
        titleEl.textContent = `🏆 第 ${curLbl} 關全清通關！`;
        descEl.textContent = hasNext
          ? `已解鎖第 ${nextLbl} 關！要直接挑戰下一關，還是留在第 ${curLbl} 關重複刷寶？`
          : '已通關終極關卡 10-10！可重複刷本關或進行深淵輪迴。';
        nextBtn.textContent = hasNext ? `➡ 前往第 ${nextLbl} 關` : '🌟 重刷 10-10';
        repBtn.textContent = `🔄 重複刷第 ${curLbl} 關`;

        if (window.__clearTimer) clearInterval(window.__clearTimer);
        const finishChoice = (goNext) => {
          if (window.__clearTimer) { clearInterval(window.__clearTimer); window.__clearTimer = null; }
          modal.classList.add('hidden');
          gameState.stage = goNext ? nextStage : clearedStage;
          gameState.wave = 1;
          refreshStatsAndUI();
          battleScene?.spawnWaveSquad();
          persistAll(true);
        };
        nextBtn.onclick = () => finishChoice(true);
        repBtn.onclick = () => finishChoice(false);

        let sec = 5;
        const updateCd = () => {
          const modeTxt = chkAuto?.checked ? '重複刷本關' : (hasNext ? `前往 ${nextLbl}` : '重複刷本關');
          cdEl.textContent = `${sec} 秒後自動${modeTxt}`;
        };
        updateCd();
        modal.classList.remove('hidden');
        window.__clearTimer = setInterval(() => {
          sec -= 1;
          if (sec <= 0) {
            finishChoice(!chkAuto?.checked && hasNext);
          } else {
            updateCd();
          }
        }, 1000);
      },
      onPlayerDefeated: (reason) => {
        gameState.wave = 1;
        ui.addLog(`⚠️ ${reason}`, 'warn');
        refreshStatsAndUI();
      },
    },
  };

  phaserGame = new Phaser.Game(config);

  phaserGame.events.once('ready', () => {
    battleScene = phaserGame.scene.getScene('BattleScene');
    townScene = phaserGame.scene.getScene('TownScene');
    battleScene?.setPaused(true);
    requestAnimationFrame(() => {
      phaserGame?.scale?.refresh();
      enterTown(Math.min(9, getChapterIdx(gameState.stage)), true);
    });
  });
}


function enterTown(chapterIdx = 0, instant = false) {
  if (!phaserGame || isRecalling || isInTown) return;
  isRecalling = true;
  const splashCfg = TOWN_SPLASHES[chapterIdx] || TOWN_SPLASHES[0];
  battleScene?.setPaused(true);

  const startTownTransfer = () => {
    isRecalling = false;
    isInTown = true;
    const splashShownAt = Date.now();
    ui.showTownSplash(chapterIdx);
    const ovEl = document.getElementById('town-splash-overlay');
    if (ovEl) ovEl.onclick = () => ui.hideTownSplash();

    if (phaserGame.scene.isActive('BattleScene')) phaserGame.scene.sleep('BattleScene');
  const townCallbacks = {
    getState: () => gameState,
    getComputedStats: () => computedStats,
    onTownLoadProgress: (val) => ui.updateTownSplashProgress(val),
    onTownReady: () => {
      ui.updateTownSplashProgress(1);
      const elapsed = Date.now() - splashShownAt;
      const waitMs = Math.max(420, 1250 - elapsed);
      setTimeout(() => ui.hideTownSplash(), waitMs);
    },
    onHudUpdate: (data) => {
      ui.renderMinimap(data.minimap);
      ui.updateTargetFrameTown?.(data.townTarget || null);
    },
    onTownAction: (action, data) => {
      if (action === 'open_waypoint') openTownWaypointUI();
      else if (action === 'exit_battle') exitTownToBattle();
      else if (action === 'gimmick_beacon') {
        if (!gameState.potionBuffs) gameState.potionBuffs = {};
        gameState.potionBuffs.beaconUntil = Date.now() + 300000;
        ui.addLog('🔥 點燃曙光烽火台！獲得 5 分鐘「曙光祝福」（攻擊/防禦/掉寶 +15%）！', 'victory');
        refreshStatsAndUI();
        persistAll();
      } else if (action === 'gimmick_spore_fountain') {
        if (!gameState.potionBuffs) gameState.potionBuffs = {};
        gameState.potionBuffs.sporeUntil = Date.now() + 300000;
        ui.addLog('🍄 觸發螢光孢子噴泉！獲得 5 分鐘「孢子狂熱」（攻速+20% / 爆擊+15% / 金幣+20%）！', 'victory');
        refreshStatsAndUI();
        persistAll();
      } else if (action === 'gimmick_steam_valve') {
        battleScene?.restoreMana?.(computedStats.maxMp || 200);
        ui.addLog('⚙️ 轉動高壓蒸汽閥門！蒸汽灌注使你的能量瞬間回滿！', 'loot');
        refreshStatsAndUI();
      } else if (action === 'gimmick_soul_brazier') {
        if (!gameState.potionBuffs) gameState.potionBuffs = {};
        gameState.potionBuffs.soulUntil = Date.now() + 300000;
        ui.addLog('🕯️ 點燃靈魂永恆火盆！獲得 5 分鐘「魂火祝福」（攻擊+18% / 爆傷+25% / 掉寶+15%）！', 'victory');
        refreshStatsAndUI();
        persistAll();
      } else if (action === 'gimmick_candle_shrine') {
        battleScene?.healHero?.(computedStats.maxHp);
        battleScene?.restoreMana?.(computedStats.maxMp || 200);
        ui.addLog('🕯️ 點燃祈禱幽藍燭台！生命與能量已完全恢復！', 'loot');
        refreshStatsAndUI();
      } else if (action === 'gimmick_lava_fountain') {
        if (!gameState.potionBuffs) gameState.potionBuffs = {};
        gameState.potionBuffs.lavaUntil = Date.now() + 300000;
        ui.addLog('🌋 觸發雙頭巨龍熔岩噴泉！獲得 5 分鐘「熔爐狂怒」（攻擊+25% / 爆傷+20% / 技能傷+20%）！', 'victory');
        refreshStatsAndUI();
        persistAll();
      } else if (action === 'gimmick_lava_sluice') {
        battleScene?.healHero?.(computedStats.maxHp);
        battleScene?.restoreMana?.(computedStats.maxMp || 200);
        ui.addLog('⚙️ 轉動熔岩閘門冷卻閥！生命與能量已完全恢復！', 'loot');
        refreshStatsAndUI();
      } else if (action === 'gimmick_abyss_sigil') {
        if (!gameState.potionBuffs) gameState.potionBuffs = {};
        gameState.potionBuffs.abyssUntil = Date.now() + 300000;
        ui.addLog('🩸 啟動深淵召喚巨陣！獲得 5 分鐘「魔王血契」（攻擊+30% / 爆傷+20% / 掉寶+25%）！', 'victory');
        refreshStatsAndUI();
        persistAll();
      } else if (action === 'gimmick_blood_chalice') {
        battleScene?.healHero?.(computedStats.maxHp);
        battleScene?.restoreMana?.(computedStats.maxMp || 200);
        ui.addLog('🍷 飲用猩紅聖血聖杯！生命與能量已完全恢復！', 'loot');
        refreshStatsAndUI();
      } else if (action === 'gimmick_aurora_spire') {
        if (!gameState.potionBuffs) gameState.potionBuffs = {};
        gameState.potionBuffs.auroraUntil = Date.now() + 300000;
        ui.addLog('❄️ 共鳴永凍極光水晶塔！獲得 5 分鐘「極光祝福」（防禦+25% / 攻速+25% / 減傷+10%）！', 'victory');
        refreshStatsAndUI();
        persistAll();
      } else if (action === 'gimmick_runic_brazier') {
        battleScene?.healHero?.(computedStats.maxHp);
        battleScene?.restoreMana?.(computedStats.maxMp || 200);
        ui.addLog('🔥 靠近北歐符文暖火盆驅散寒霜！生命與能量已完全恢復！', 'loot');
        refreshStatsAndUI();
      } else if (action === 'gimmick_emerald_waterfall') {
        if (!gameState.potionBuffs) gameState.potionBuffs = {};
        gameState.potionBuffs.emeraldUntil = Date.now() + 300000;
        ui.addLog('🌿 共鳴翡翠毒液瀑布池！獲得 5 分鐘「翠玉生機」（攻擊+25% / 攻速+25% / 掉寶+30%）！', 'victory');
        refreshStatsAndUI();
        persistAll();
      } else if (action === 'gimmick_voodoo_horn') {
        battleScene?.healHero?.(computedStats.maxHp);
        battleScene?.restoreMana?.(computedStats.maxMp || 200);
        ui.addLog('📯 吹響沼澤巫毒號角！治癒螢火蟲群使你恢復全部生命與能量！', 'loot');
        refreshStatsAndUI();
      } else if (action === 'gimmick_storm_core') {
        if (!gameState.potionBuffs) gameState.potionBuffs = {};
        gameState.potionBuffs.stormUntil = Date.now() + 300000;
        ui.addLog('⚡ 共鳴聚雷磁能核心球！獲得 5 分鐘「蒼穹雷霆」（攻速+30% / 技能傷+25% / 爆擊+20%）！', 'victory');
        refreshStatsAndUI();
        persistAll();
      } else if (action === 'gimmick_tesla_coil') {
        battleScene?.healHero?.(computedStats.maxHp);
        battleScene?.restoreMana?.(computedStats.maxMp || 200);
        ui.addLog('⚡ 啟動蓄電共鳴特斯拉線圈！高壓充能使你恢復全部生命與能量！', 'loot');
        refreshStatsAndUI();
      } else if (action === 'gimmick_blood_fountain') {
        if (!gameState.potionBuffs) gameState.potionBuffs = {};
        gameState.potionBuffs.roseUntil = Date.now() + 300000;
        ui.addLog('🌹 沐浴垂淚聖母血泉！獲得 5 分鐘「聖血薔薇」（攻擊+35% / 爆傷+25% / 吸血+5%）！', 'victory');
        refreshStatsAndUI();
        persistAll();
      } else if (action === 'gimmick_abbey_bell') {
        battleScene?.healHero?.(computedStats.maxHp);
        battleScene?.restoreMana?.(computedStats.maxMp || 200);
        ui.addLog('🔔 敲響修道院黃金大鐘！神聖鐘聲使你恢復全部生命與能量！', 'loot');
        refreshStatsAndUI();
      } else if (action === 'gimmick_astral_orrery') {
        if (!gameState.potionBuffs) gameState.potionBuffs = {};
        gameState.potionBuffs.astralUntil = Date.now() + 300000;
        ui.addLog('🌌 校準旋轉黑洞星象儀！獲得 5 分鐘「永恆星辰」（攻擊+45% / 爆傷+35% / 攻速+30% / 掉寶+40%）！', 'victory');
        refreshStatsAndUI();
        persistAll();
      } else if (action === 'gimmick_star_well') {
        battleScene?.healHero?.(computedStats.maxHp);
        battleScene?.restoreMana?.(computedStats.maxMp || 200);
        ui.addLog('✨ 許願於星界銀河許願泉！星塵洗禮使你恢復全部生命與能量！', 'loot');
        refreshStatsAndUI();
      } else {
        const modalAction = action === 'drawer_upgrade' ? 'modal_blacksmith' : (action === 'drawer_skills' ? 'modal_trainer' : (action === 'drawer_bag' ? 'modal_vault' : (action === 'drawer_rebirth' ? 'modal_sanctum' : action)));
        const modalData = { ...(data || {}), chapterIdx };
        ui.openTownFacilityModal(modalAction, modalData, {
          onBrewAllCombat: (totalCost) => {
            if ((gameState.gold || 0) < totalCost) return;
            gameState.gold -= totalCost;
            if (!gameState.potionBuffs) gameState.potionBuffs = {};
            const nowTs = Date.now();
            gameState.potionBuffs.expUntil = Math.max(nowTs, gameState.potionBuffs.expUntil || 0) + 60000;
            gameState.potionBuffs.furyUntil = Math.max(nowTs, gameState.potionBuffs.furyUntil || 0) + 45000;
            gameState.potionBuffs.mfUntil = Math.max(nowTs, gameState.potionBuffs.mfUntil || 0) + 60000;
            gameState.potionBuffs.titanUntil = Math.max(nowTs, gameState.potionBuffs.titanUntil || 0) + 180000;
            gameState.potionBuffs.ironUntil = Math.max(nowTs, gameState.potionBuffs.ironUntil || 0) + 180000;
            gameState.potionBuffs.sageUntil = Math.max(nowTs, gameState.potionBuffs.sageUntil || 0) + 180000;
            ui.addLog('⚡ 煉金工坊：已一鍵飲用全套戰前秘藥！', 'victory');
            refreshStatsAndUI();
            persistAll();
          },
          onBrewPotion: (brewId) => {
            const chMult = 1 + getChapterIdx(gameState.stage || 1) * 0.4;
            const prices = {
              hp_refill: 150, exp_pot: 300, fury_pot: 400, mf_pot: 450,
              titan_pot: Math.round(1400 * chMult),
              iron_pot: Math.round(1400 * chMult),
              sage_pot: Math.round(1800 * chMult),
            };
            const cost = prices[brewId] || 300;
            if ((gameState.gold || 0) < cost) return;
            gameState.gold -= cost;
            if (!gameState.potionBuffs) gameState.potionBuffs = {};
            const nowTs = Date.now();
            if (brewId === 'hp_refill') {
              battleScene?.healHero?.(computedStats.maxHp);
              battleScene?.addPotionCharge?.(3);
              ui.addLog('🔴 煉金工坊：已補滿戰鬥生命藥水！', 'loot');
            } else if (brewId === 'exp_pot') {
              gameState.potionBuffs.expUntil = Math.max(nowTs, gameState.potionBuffs.expUntil || 0) + 60000;
              ui.addLog('🟡 煉金工坊：獲得 60 秒經驗 +50% 藥水效果！', 'loot');
            } else if (brewId === 'fury_pot') {
              gameState.potionBuffs.furyUntil = Math.max(nowTs, gameState.potionBuffs.furyUntil || 0) + 45000;
              ui.addLog('🟣 煉金工坊：獲得 45 秒狂暴藥水效果！', 'loot');
            } else if (brewId === 'mf_pot') {
              gameState.potionBuffs.mfUntil = Math.max(nowTs, gameState.potionBuffs.mfUntil || 0) + 60000;
              ui.addLog('🟢 煉金工坊：獲得 60 秒尋寶藥水效果！', 'loot');
            } else if (brewId === 'titan_pot') {
              gameState.potionBuffs.titanUntil = Math.max(nowTs, gameState.potionBuffs.titanUntil || 0) + 180000;
              ui.addLog('🔥 煉金工坊：獲得 180 秒「泰坦巨力秘藥」（攻擊+30% / 爆傷+40%）！', 'victory');
            } else if (brewId === 'iron_pot') {
              gameState.potionBuffs.ironUntil = Math.max(nowTs, gameState.potionBuffs.ironUntil || 0) + 180000;
              ui.addLog('🛡️ 煉金工坊：獲得 180 秒「鋼鐵壁壘秘藥」（防禦+35% / 減傷+12%）！', 'victory');
            } else if (brewId === 'sage_pot') {
              gameState.potionBuffs.sageUntil = Math.max(nowTs, gameState.potionBuffs.sageUntil || 0) + 180000;
              ui.addLog('🌟 煉金工坊：獲得 180 秒「秘法先知秘藥」（冷卻縮減+18% / 掉寶+50%）！', 'victory');
            }
            refreshStatsAndUI();
            persistAll();
          },
          onClaimBounty: (qid) => {
            if (!gameState.bountyProgress) gameState.bountyProgress = { bossKills: 0, claimed: {} };
            if (gameState.bountyProgress.claimed[qid]) return;
            gameState.bountyProgress.claimed[qid] = true;
            if (qid === 'ch1_q1') {
              gameState.gold += 600;
              handleLootDrop(generateLoot(Math.max(1, gameState.maxStageReached || 1), true, 120, false, gameState.classId));
              ui.addLog('📜 完成懸賞「清剿腐朽野狼群」：獲得 600 金幣與稀有裝備！', 'victory');
            } else if (qid === 'ch1_q2') {
              gameState.gold += 1200;
              gameState.skillPoints = (gameState.skillPoints || 0) + 1;
              ui.addLog('📜 完成懸賞「討伐邊境首領」：獲得 1,200 金幣與 +1 技能點！', 'victory');
            } else if (qid === 'ch1_q3') {
              gameState.gold += 2500;
              handleLootDrop(generateLoot(Math.max(5, gameState.maxStageReached || 5), true, 300, false, gameState.classId));
              ui.addLog('📜 完成懸賞「百戰哨兵試煉」：獲得 2,500 金幣與高階傳說箱！', 'victory');
            } else if (qid === 'ch2_q1') {
              gameState.gold += 1800;
              handleLootDrop(generateLoot(Math.max(11, gameState.maxStageReached || 11), true, 160, false, gameState.classId));
              ui.addLog('📜 完成洞窟懸賞「清剿巢穴哥布林」：獲得 1,800 金幣與高階稀有箱！', 'victory');
            } else if (qid === 'ch2_q2') {
              gameState.gold += 3200;
              gameState.skillPoints = (gameState.skillPoints || 0) + 1;
              ui.addLog('📜 完成洞窟懸賞「討伐地下巢穴首領」：獲得 3,200 金幣與 +1 技能點！', 'victory');
            } else if (qid === 'ch2_q3') {
              gameState.gold += 6000;
              handleLootDrop(generateLoot(Math.max(15, gameState.maxStageReached || 15), true, 350, false, gameState.classId));
              ui.addLog('📜 完成洞窟懸賞「深淵礦脈清道夫」：獲得 6,000 金幣與傳說保底箱！', 'victory');
            } else if (qid === 'ch3_q1') {
              gameState.gold += 4200;
              handleLootDrop(generateLoot(Math.max(21, gameState.maxStageReached || 21), true, 200, false, gameState.classId));
              ui.addLog('📜 完成墓園懸賞「淨化白骨墓穴食屍鬼」：獲得 4,200 金幣與高階稀有箱！', 'victory');
            } else if (qid === 'ch3_q2') {
              gameState.gold += 7500;
              gameState.skillPoints = (gameState.skillPoints || 0) + 1;
              ui.addLog('📜 完成墓園懸賞「討伐白骨領主首領」：獲得 7,500 金幣與 +1 技能點！', 'victory');
            } else if (qid === 'ch3_q3') {
              gameState.gold += 12000;
              handleLootDrop(generateLoot(Math.max(25, gameState.maxStageReached || 25), true, 420, false, gameState.classId));
              ui.addLog('📜 完成墓園懸賞「守夜人聖骨試煉」：獲得 12,000 金幣與傳說保底箱！', 'victory');
            } else if (qid === 'ch4_q1') {
              gameState.gold += 8500;
              handleLootDrop(generateLoot(Math.max(31, gameState.maxStageReached || 31), true, 250, false, gameState.classId));
              ui.addLog('📜 完成裂谷懸賞「清剿焦土炎魔與火蜥蜴」：獲得 8,500 金幣與高階稀有箱！', 'victory');
            } else if (qid === 'ch4_q2') {
              gameState.gold += 15000;
              gameState.skillPoints = (gameState.skillPoints || 0) + 1;
              ui.addLog('📜 完成裂谷懸賞「討伐伊弗利特烈焰首領」：獲得 15,000 金幣與 +1 技能點！', 'victory');
            } else if (qid === 'ch4_q3') {
              gameState.gold += 24000;
              handleLootDrop(generateLoot(Math.max(35, gameState.maxStageReached || 35), true, 500, false, gameState.classId));
              ui.addLog('📜 完成裂谷懸賞「黑曜石熔爐宗師試煉」：獲得 24,000 金幣與傳說保底箱！', 'victory');
            } else if (qid === 'ch5_q1') {
              gameState.gold += 18000;
              handleLootDrop(generateLoot(Math.max(41, gameState.maxStageReached || 41), true, 300, false, gameState.classId));
              ui.addLog('📜 完成血契懸賞「肅清深淵聖殿魅魔」：獲得 18,000 金幣與高階稀有箱！', 'victory');
            } else if (qid === 'ch5_q2') {
              gameState.gold += 30000;
              gameState.skillPoints = (gameState.skillPoints || 0) + 1;
              ui.addLog('📜 完成血契懸賞「討伐深淵將軍與魔王」：獲得 30,000 金幣與 +1 技能點！', 'victory');
            } else if (qid === 'ch5_q3') {
              gameState.gold += 48000;
              handleLootDrop(generateLoot(Math.max(45, gameState.maxStageReached || 45), true, 600, false, gameState.classId));
              ui.addLog('📜 完成血契懸賞「緋紅王庭血戰試煉」：獲得 48,000 金幣與傳說保底箱！', 'victory');
            } else if (qid === 'ch6_q1') {
              gameState.gold += 36000;
              handleLootDrop(generateLoot(Math.max(51, gameState.maxStageReached || 51), true, 360, false, gameState.classId));
              ui.addLog('📜 完成雪原懸賞「獵殺永凍雪原冰狼」：獲得 36,000 金幣與高階稀有箱！', 'victory');
            } else if (qid === 'ch6_q2') {
              gameState.gold += 55000;
              gameState.skillPoints = (gameState.skillPoints || 0) + 1;
              ui.addLog('📜 完成雪原懸賞「討伐冰霜泰坦首領」：獲得 55,000 金幣與 +1 技能點！', 'victory');
            } else if (qid === 'ch6_q3') {
              gameState.gold += 88000;
              handleLootDrop(generateLoot(Math.max(55, gameState.maxStageReached || 55), true, 700, false, gameState.classId));
              ui.addLog('📜 完成雪原懸賞「英靈殿女武神試煉」：獲得 88,000 金幣與傳說保底箱！', 'victory');
            } else if (qid === 'ch7_q1') {
              gameState.gold += 68000;
              handleLootDrop(generateLoot(Math.max(61, gameState.maxStageReached || 61), true, 420, false, gameState.classId));
              ui.addLog('📜 完成沼澤懸賞「肅清毒沼巨蛙」：獲得 68,000 金幣與高階稀有箱！', 'victory');
            } else if (qid === 'ch7_q2') {
              gameState.gold += 95000;
              gameState.skillPoints = (gameState.skillPoints || 0) + 1;
              ui.addLog('📜 完成沼澤懸賞「討伐劇毒九頭蛇首領」：獲得 95,000 金幣與 +1 技能點！', 'victory');
            } else if (qid === 'ch7_q3') {
              gameState.gold += 150000;
              handleLootDrop(generateLoot(Math.max(65, gameState.maxStageReached || 65), true, 800, false, gameState.classId));
              ui.addLog('📜 完成沼澤懸賞「翠玉樹冠水寨守護試煉」：獲得 150,000 金幣與傳說保底箱！', 'victory');
            } else if (qid === 'ch8_q1') {
              gameState.gold += 120000;
              handleLootDrop(generateLoot(Math.max(71, gameState.maxStageReached || 71), true, 480, false, gameState.classId));
              ui.addLog('📜 完成蒼穹懸賞「攔截風暴高塔電弧元素」：獲得 120,000 金幣與高階稀有箱！', 'victory');
            } else if (qid === 'ch8_q2') {
              gameState.gold += 180000;
              gameState.skillPoints = (gameState.skillPoints || 0) + 1;
              ui.addLog('📜 完成蒼穹懸賞「討伐雷鳴風暴泰坦首領」：獲得 180,000 金幣與 +1 技能點！', 'victory');
            } else if (qid === 'ch8_q3') {
              gameState.gold += 280000;
              handleLootDrop(generateLoot(Math.max(75, gameState.maxStageReached || 75), true, 900, false, gameState.classId));
              ui.addLog('📜 完成蒼穹懸賞「蒼穹浮空城制空試煉」：獲得 280,000 金幣與傳說保底箱！', 'victory');
            } else if (qid === 'ch9_q1') {
              gameState.gold += 210000;
              handleLootDrop(generateLoot(Math.max(81, gameState.maxStageReached || 81), true, 550, false, gameState.classId));
              ui.addLog('📜 完成審判懸賞「淨化血色修道院」：獲得 210,000 金幣與高階稀有箱！', 'victory');
            } else if (qid === 'ch9_q2') {
              gameState.gold += 320000;
              gameState.skillPoints = (gameState.skillPoints || 0) + 1;
              ui.addLog('📜 完成審判懸賞「討伐血色大主教領主」：獲得 320,000 金幣與 +1 技能點！', 'victory');
            } else if (qid === 'ch9_q3') {
              gameState.gold += 500000;
              handleLootDrop(generateLoot(Math.max(85, gameState.maxStageReached || 85), true, 1000, false, gameState.classId));
              ui.addLog('📜 完成審判懸賞「聖血薔薇修道院聖戰試煉」：獲得 500,000 金幣與傳說保底箱！', 'victory');
            } else if (qid === 'ch10_q1') {
              gameState.gold += 380000;
              handleLootDrop(generateLoot(Math.max(91, gameState.maxStageReached || 91), true, 700, false, gameState.classId));
              ui.addLog('📜 完成星圖懸賞「肅清混沌星界星靈」：獲得 380,000 金幣與高階稀有箱！', 'victory');
            } else if (qid === 'ch10_q2') {
              gameState.gold += 600000;
              gameState.skillPoints = (gameState.skillPoints || 0) + 2;
              ui.addLog('📜 完成星圖懸賞「討伐混沌星界終極泰坦」：獲得 600,000 金幣與 +2 技能點！', 'victory');
            } else if (qid === 'ch10_q3') {
              gameState.gold += 1000000;
              handleLootDrop(generateLoot(Math.max(98, gameState.maxStageReached || 98), true, 1500, false, gameState.classId));
              ui.addLog('📜 完成星圖懸賞「永恆星辰聖域終局試煉」：獲得 1,000,000 金幣與神話保底箱！', 'victory');
            }
            refreshStatsAndUI();
            persistAll(true);
          },
          onEnsureMarketShelf: () => {
            const nowTs = Date.now();
            if (!gameState.blackMarket) gameState.blackMarket = { nextRefreshAt: 0, items: [], pityCount: 0 };
            if (!gameState.blackMarket.items?.length || nowTs >= (gameState.blackMarket.nextRefreshAt || 0)) {
              const stg = gameState.stage || 1;
              const items = [0, 1, 2, 3].map((idx) => {
                const it = generateBlackMarketItem(stg, gameState.classId, idx === 3 ? 'legendary' : null);
                const price = Math.max(400, Math.round((it.powerScore || 100) * (it.rarity === 'legendary' ? 18 : 9)));
                return { item: it, price, sold: false };
              });
              gameState.blackMarket.items = items;
              gameState.blackMarket.nextRefreshAt = nowTs + 1800000;
              persistAll();
            }
          },
          onRefreshMarketShelf: (cost) => {
            if ((gameState.gold || 0) < cost) return;
            gameState.gold -= cost;
            const stg = gameState.stage || 1;
            if (!gameState.blackMarket) gameState.blackMarket = { nextRefreshAt: 0, items: [], pityCount: 0 };
            gameState.blackMarket.items = [0, 1, 2, 3].map((idx) => {
              const it = generateBlackMarketItem(stg, gameState.classId, idx === 3 ? 'legendary' : null);
              const price = Math.max(400, Math.round((it.powerScore || 100) * (it.rarity === 'legendary' ? 18 : 9)));
              return { item: it, price, sold: false };
            });
            gameState.blackMarket.nextRefreshAt = Date.now() + 1800000;
            ui.addLog('🔄 已手動刷新黑市限時貨架！', 'loot');
            refreshStatsAndUI();
            persistAll();
          },
          onBuyMarketShelf: (idx) => {
            const entry = gameState.blackMarket?.items?.[idx];
            if (!entry || entry.sold || (gameState.gold || 0) < entry.price) return;
            gameState.gold -= entry.price;
            entry.sold = true;
            gameState.inventory.unshift(entry.item);
            ui.addLog(`🛒 黑市直購獲得：${entry.item.name}（戰力 ${entry.item.powerScore}）！`, 'loot');
            refreshStatsAndUI();
            persistAll();
          },
          onGambleGear: (cost, isHigh) => {
            if ((gameState.gold || 0) < cost) return;
            gameState.gold -= cost;
            if (!gameState.blackMarket) gameState.blackMarket = { nextRefreshAt: 0, items: [], pityCount: 0 };
            const hitPity = (gameState.blackMarket.pityCount || 0) >= 10;
            const stg = Math.max(1, gameState.maxStageReached || gameState.stage || 1);
            const item = hitPity
              ? generateBlackMarketItem(stg, gameState.classId, 'legendary')
              : generateLoot(stg, isHigh, isHigh ? 280 : 60, true, gameState.classId);
            if (hitPity) {
              gameState.blackMarket.pityCount = 0;
              ui.addLog(`🌟 黑市保底觸發！必得傳說裝備：${item.name}（戰力 ${item.powerScore}）！`, 'victory');
            } else {
              gameState.blackMarket.pityCount = Math.min(10, (gameState.blackMarket.pityCount || 0) + (isHigh ? 2 : 1));
              if (item) ui.addLog(`🎪 黑市鑑定獲得：${item.name}（戰力 ${item.powerScore}）！`, 'loot');
            }
            if (item && !hitPity) gameState.inventory.unshift(item);
            else if (item && hitPity) gameState.inventory.unshift(item);
            refreshStatsAndUI();
            persistAll();
          },
          getComputedStats: () => computedStats,
          onOpenDrawer: (drawerName) => ui.openDrawer(drawerName),
          onRerollItem: (uid, isEq, lockedIdx = -1) => {
            const item = isEq
              ? Object.values(gameState.equipment || {}).find((i) => i && i.uid === uid)
              : (gameState.inventory || []).find((i) => i && i.uid === uid);
            if (!item) return;
            const hasLock = lockedIdx >= 0 && lockedIdx < (item.affixes || []).length;
            const baseCost = Math.max(200, (item.level || 1) * 120 * (item.rarity === 'legendary' || item.rarity === 'set' ? 2 : 1));
            const cost = hasLock ? Math.round(baseCost * 1.5) : baseCost;
            const dustCost = hasLock ? 15 : 0;
            if ((gameState.dust || 0) < dustCost) { ui.addLog('鎖定洗鍊需要 15 奧術粉塵！', 'warn'); return; }
            if ((gameState.gold || 0) < cost) return;
            gameState.gold -= cost;
            if (dustCost > 0) gameState.dust -= dustCost;
            const res = rerollItemAffixes(item, lockedIdx);
            if (res) {
              const delta = res.newPower - res.oldPower;
              item._lastRerollDelta = delta;
              ui.addLog(`🎲 鐵匠洗鍊「${item.name}」：戰力 ${res.oldPower} → ${res.newPower} (${delta >= 0 ? '+' : ''}${delta})`, delta >= 0 ? 'victory' : 'loot');
            }
            refreshStatsAndUI();
            persistAll();
          },
          onRefineItem: (uid, isEq) => {
            const item = isEq
              ? Object.values(gameState.equipment || {}).find((i) => i && i.uid === uid)
              : (gameState.inventory || []).find((i) => i && i.uid === uid);
            if (!item || (item.upgradeLevel || 0) >= MAX_ENHANCE_LEVEL) return;
            const { gold, dust } = getEquipEnhanceCost(item);
            if ((gameState.gold || 0) < gold || (gameState.dust || 0) < dust) return;
            gameState.gold -= gold;
            gameState.dust -= dust;
            const res = rollEnhance(item, !!useProtect, gameState);
            item.powerScore = calcItemPower(item);
            if (res.ok) {
              ui.addLog(`⚒️ 強化成功！「${item.name}」升至 +${res.newLv}（成功率 ${res.rate}%）！`, 'victory');
            } else {
              ui.addLog(`💨 強化失敗（${res.rate}%），「${item.name}」${res.demoted ? `降為 +${res.newLv}` : `維持 +${res.newLv}`}${res.protectedUsed ? '（保護石已生效）' : ''}！`, 'system');
            }
            refreshStatsAndUI();
            persistAll();
          },
          onSaveSkillPreset: (slotIdx) => {
            const cid = gameState.classId || 'warrior';
            if (!gameState.skillPresetsByClass) gameState.skillPresetsByClass = {};
            if (!gameState.skillPresetsByClass[cid]) gameState.skillPresetsByClass[cid] = [null, null, null];
            gameState.skillPresetsByClass[cid][slotIdx] = [...(gameState.equippedSkillsByClass?.[cid] || [null, null, null])];
            ui.addLog(`💾 已將目前技能配置儲存至預設 #${slotIdx + 1}！`, 'loot');
            persistAll();
          },
          onApplySkillPreset: (slotIdx) => {
            const cid = gameState.classId || 'warrior';
            const preset = gameState.skillPresetsByClass?.[cid]?.[slotIdx];
            if (!preset) return;
            if (!gameState.equippedSkillsByClass) gameState.equippedSkillsByClass = {};
            gameState.equippedSkillsByClass[cid] = [...preset];
            ui.addLog(`⚡ 已切換並套用技能預設 #${slotIdx + 1}！`, 'victory');
            refreshStatsAndUI();
            persistAll();
          },
          onRecordDummyDps: (dps, totalDmg, maxCrit) => {
            if (dps > (gameState.bestDummyDps || 0)) gameState.bestDummyDps = dps;
            ui.addLog(`🪵 10 秒木樁測試完成：平均 ${dps.toLocaleString()} DPS（總傷 ${totalDmg.toLocaleString()} / 最高單發 ${maxCrit.toLocaleString()}）！`, 'victory');
            persistAll();
          },
          onTeleportTown: (targetChIdx) => {
            isInTown = false;
            enterTown(targetChIdx, true);
            ui.addLog(`🌀 星門傳送完成！已抵達第 ${targetChIdx + 1} 章主城！`, 'victory');
          },
          getWaypoints: () => townScene?.getWaypointList?.() || [],
          onTeleportWaypoint: (wx, wy, label) => {
            townScene?.teleportHeroTo?.(wx, wy);
            ui.addLog(`🧭 已傳送至「${label}」！`, 'system');
          },
          onTeleportToStage: (stg) => {
            gameState.stage = stg;
            gameState.wave = 1;
            exitTownToBattle(true);
            refreshStatsAndUI();
            if (battleScene && battleScene.scene?.isActive()) battleScene.spawnWaveSquad();
            ui.addLog(`🚀 已從星門出城傳送至第 ${getStageLabel(stg)} 關！`, 'victory');
            persistAll(true);
          },
          onVaultDeposit: (uid) => {
            if (!gameState.vaultItems) gameState.vaultItems = [];
            if (gameState.vaultItems.length >= 6) return;
            const idx = (gameState.inventory || []).findIndex((i) => i && i.uid === uid);
            if (idx < 0) return;
            const [item] = gameState.inventory.splice(idx, 1);
            gameState.vaultItems.push(item);
            ui.addLog(`🔒 已將「${item.name}」鎖定存入保險箱！`, 'loot');
            refreshStatsAndUI();
            persistAll();
          },
          onVaultWithdraw: (slotIdx) => {
            const it = gameState.vaultItems?.[slotIdx];
            if (!it) return;
            gameState.vaultItems.splice(slotIdx, 1);
            gameState.inventory.unshift(it);
            ui.addLog(`📤 已將「${it.name}」從保險箱取出至背包！`, 'loot');
            refreshStatsAndUI();
            persistAll();
          },
          onToggleVaultRule: (ruleKey) => {
            if (!gameState.vaultRules) gameState.vaultRules = {};
            gameState.vaultRules[ruleKey] = !gameState.vaultRules[ruleKey];
            persistAll();
          },
          onUpgradeSanctum: (auraId) => {
            if (!gameState.sanctumLevels) gameState.sanctumLevels = {};
            const lv = gameState.sanctumLevels[auraId] || 0;
            const baseMap = { atk_aura: 2, loot_aura: 2, boss_aura: 3 };
            const cost = (baseMap[auraId] || 2) + lv * 2;
            if (lv >= 10 || (gameState.soulCrystals || 0) < cost) return;
            gameState.soulCrystals -= cost;
            gameState.sanctumLevels[auraId] = lv + 1;
            ui.addLog(`🔮 聖殿光環升級成功！消耗 ${cost} 顆靈魂水晶！`, 'victory');
            refreshStatsAndUI();
            persistAll(true);
          },
          onClaimWeaverGift: () => {
            if (gameState.ch10WeaverGiftClaimed) return;
            gameState.ch10WeaverGiftClaimed = true;
            gameState.gold += 150000;
            if (!gameState.potionBuffs) gameState.potionBuffs = {};
            const nowTs = Date.now();
            gameState.potionBuffs.furyUntil = Math.max(nowTs, gameState.potionBuffs.furyUntil || 0) + 45000;
            gameState.potionBuffs.mfUntil = Math.max(nowTs, gameState.potionBuffs.mfUntil || 0) + 60000;
            ui.addLog('🌌 領取星界編織者終極贈禮：獲得 150,000 金幣與狂暴＋尋寶雙藥水！', 'victory');
            refreshStatsAndUI();
            persistAll(true);
          },
          onClaimPenitentGift: () => {
            if (gameState.ch9PenitentGiftClaimed) return;
            gameState.ch9PenitentGiftClaimed = true;
            gameState.gold += 80000;
            if (!gameState.potionBuffs) gameState.potionBuffs = {};
            gameState.potionBuffs.mfUntil = Math.max(Date.now(), gameState.potionBuffs.mfUntil || 0) + 60000;
            ui.addLog('🌹 領取苦行聖女賜福：獲得 80,000 金幣與 60 秒尋寶藥水！', 'victory');
            refreshStatsAndUI();
            persistAll(true);
          },
          onClaimEngineerGift: () => {
            if (gameState.ch8EngineerGiftClaimed) return;
            gameState.ch8EngineerGiftClaimed = true;
            gameState.gold += 50000;
            if (!gameState.potionBuffs) gameState.potionBuffs = {};
            gameState.potionBuffs.furyUntil = Math.max(Date.now(), gameState.potionBuffs.furyUntil || 0) + 45000;
            ui.addLog('⚙️ 領取風暴首席工程師補給：獲得 50,000 金幣與 45 秒狂暴藥水！', 'victory');
            refreshStatsAndUI();
            persistAll(true);
          },
          onClaimWitchdoctorGift: () => {
            if (gameState.ch7WitchdoctorGiftClaimed) return;
            gameState.ch7WitchdoctorGiftClaimed = true;
            gameState.gold += 30000;
            if (!gameState.potionBuffs) gameState.potionBuffs = {};
            gameState.potionBuffs.expUntil = Math.max(Date.now(), gameState.potionBuffs.expUntil || 0) + 60000;
            ui.addLog('🎭 領取沼澤巫醫長聖禮：獲得 30,000 金幣與 60 秒經驗藥水！', 'victory');
            refreshStatsAndUI();
            persistAll(true);
          },
          onClaimShamanGift: () => {
            if (gameState.ch6ShamanGiftClaimed) return;
            gameState.ch6ShamanGiftClaimed = true;
            gameState.gold += 18000;
            if (!gameState.potionBuffs) gameState.potionBuffs = {};
            gameState.potionBuffs.furyUntil = Math.max(Date.now(), gameState.potionBuffs.furyUntil || 0) + 45000;
            ui.addLog('❄️ 領取極地先知贈禮：獲得 18,000 金幣與 45 秒狂暴藥水！', 'victory');
            refreshStatsAndUI();
            persistAll(true);
          },
          onClaimContractorGift: () => {
            if (gameState.ch5ContractorGiftClaimed) return;
            gameState.ch5ContractorGiftClaimed = true;
            gameState.gold += 10000;
            if (!gameState.potionBuffs) gameState.potionBuffs = {};
            gameState.potionBuffs.mfUntil = Math.max(Date.now(), gameState.potionBuffs.mfUntil || 0) + 60000;
            ui.addLog('📜 簽訂王庭黃金魔契：獲得 10,000 金幣與 60 秒尋寶藥水！', 'victory');
            refreshStatsAndUI();
            persistAll(true);
          },
          onClaimForgemasterGift: () => {
            if (gameState.ch4ForgemasterGiftClaimed) return;
            gameState.ch4ForgemasterGiftClaimed = true;
            gameState.gold += 5000;
            if (!gameState.potionBuffs) gameState.potionBuffs = {};
            gameState.potionBuffs.furyUntil = Math.max(Date.now(), gameState.potionBuffs.furyUntil || 0) + 45000;
            ui.addLog('🔥 領取火元素鍛造宗師贈禮：獲得 5,000 金幣與 45 秒狂暴藥水！', 'victory');
            refreshStatsAndUI();
            persistAll(true);
          },
          onClaimChroniclerGift: () => {
            if (gameState.ch3ChroniclerGiftClaimed) return;
            gameState.ch3ChroniclerGiftClaimed = true;
            gameState.gold += 2500;
            if (!gameState.potionBuffs) gameState.potionBuffs = {};
            gameState.potionBuffs.mfUntil = Math.max(Date.now(), gameState.potionBuffs.mfUntil || 0) + 60000;
            ui.addLog('🪶 領取亡靈記錄者補給：獲得 2,500 金幣與 60 秒尋寶藥水！', 'victory');
            refreshStatsAndUI();
            persistAll(true);
          },
          onClaimSmugglerGift: () => {
            if (gameState.ch2SmugglerGiftClaimed) return;
            gameState.ch2SmugglerGiftClaimed = true;
            gameState.gold += 1200;
            if (!gameState.potionBuffs) gameState.potionBuffs = {};
            gameState.potionBuffs.furyUntil = Math.max(Date.now(), gameState.potionBuffs.furyUntil || 0) + 45000;
            ui.addLog('🎒 領取洞窟走私客見面禮：獲得 1,200 金幣與 45 秒狂暴藥水！', 'victory');
            refreshStatsAndUI();
            persistAll(true);
          },
          onClaimScoutGift: () => {
            if (gameState.ch1ScoutGiftClaimed) return;
            gameState.ch1ScoutGiftClaimed = true;
            gameState.gold += 500;
            if (!gameState.potionBuffs) gameState.potionBuffs = {};
            gameState.potionBuffs.expUntil = Math.max(Date.now(), gameState.potionBuffs.expUntil || 0) + 60000;
            ui.addLog('🏹 領取邊境斥候長補給：獲得 500 金幣與 60 秒經驗藥水！', 'victory');
            refreshStatsAndUI();
            persistAll(true);
          },
          getPortrait: (ak, fr) => townScene?.getSpriteDataUrl?.(ak, fr) || '',
          onTavernRest: () => {
            battleScene?.healHero?.(computedStats.maxHp);
            battleScene?.restoreMana?.(computedStats.maxMp || 200);
            ui.addLog('🍺 在冒險者酒館壁爐旁休憩完畢，生命與魔力已回滿！', 'loot');
            refreshStatsAndUI();
          },
          onTavernFeast: (cost) => {
            if ((gameState.gold || 0) < cost) return;
            gameState.gold -= cost;
            if (!gameState.potionBuffs) gameState.potionBuffs = {};
            gameState.potionBuffs.tavernUntil = Date.now() + 1800000;
            ui.addLog('🍖 享用了冒險者大餐！獲得 30 分鐘「酒館飽足」（經驗+15% / 金幣+15%）！', 'victory');
            refreshStatsAndUI();
            persistAll();
          },
          onGuardBlessing: () => {
            if ((gameState.guardBlessCdUntil || 0) > Date.now()) return;
            gameState.guardBlessCdUntil = Date.now() + 300000;
            if (!gameState.potionBuffs) gameState.potionBuffs = {};
            gameState.potionBuffs.guardUntil = Date.now() + 180000;
            ui.addLog('🛡️ 獲得巡邏衛兵激勵！3 分鐘內防禦力 +10%！', 'victory');
            refreshStatsAndUI();
            persistAll();
          },
          onVillagerGift: () => {
            if ((gameState.villagerGiftCdUntil || 0) > Date.now()) return;
            gameState.villagerGiftCdUntil = Date.now() + 180000;
            const bonus = (getChapterIdx(gameState.stage) + 1) * 180;
            gameState.gold += bonus;
            battleScene?.healHero?.(Math.round(computedStats.maxHp * 0.25));
            ui.addLog(`💬 旅人贈送了 ${bonus.toLocaleString()} 金幣與點心（回復 25% 生命）！`, 'loot');
            refreshStatsAndUI();
            persistAll();
          },
          onExitTown: () => exitTownToBattle(),
          onOpenWorldMap: () => {
            exitTownToBattle();
            ui.openWorldMapModal(gameState, (st) => {
              gameState.stage = st;
              gameState.wave = 1;
              refreshStatsAndUI();
              battleScene?.spawnWaveSquad();
              persistAll(true);
            });
          },
        });
      }
    },
  };

  if (phaserGame.scene.isSleeping('TownScene') || phaserGame.scene.isActive('TownScene')) {
    if (townScene && townScene.townData?.chapterIdx !== chapterIdx) {
      phaserGame.scene.stop('TownScene');
      battleScene?.collectAllGroundLoot?.();
      battleScene?.collectAllGroundLoot?.();
    phaserGame.scene.start('TownScene', { chapterIdx, callbacks: townCallbacks });
    } else {
      phaserGame.scene.wake('TownScene', { chapterIdx, callbacks: townCallbacks });
      townScene?.syncHeroAppearance?.();
    }
  } else {
    battleScene?.collectAllGroundLoot?.();
    phaserGame.scene.start('TownScene', { chapterIdx, callbacks: townCallbacks });
  }
  const btn = document.getElementById('btn-town-toggle');
  if (btn) {
    btn.textContent = '⚔️ 出城戰鬥 (G)';
    btn.classList.add('in-town');
  }
  const wpBtn = document.getElementById('btn-top-waypoint');
    if (wpBtn) { wpBtn.classList.add('in-town'); wpBtn.classList.remove('is-disabled'); }
    const townNames = ["曙光哨站堡壘", "地下菌菇黑市", "守夜人聖骨禮拜堂", "黑曜石熔爐要塞", "緋紅魔獄王庭", "極光冰晶堡", "翠玉樹冠水寨", "蒼穹電弧浮空城", "聖血薔薇修道院", "永恆星辰聖域"];
    const townTitle = `第 ${chapterIdx + 1} 章主城「${townNames[chapterIdx] || townNames[0]}」`;
    ui.addLog(`🏰 已傳送至${townTitle}（安全區）`, 'system');
    townBgm.playChapter(chapterIdx);
  };

  if (!instant && battleScene?.playRecallAnimation) {
    battleScene.playRecallAnimation(splashCfg.tintColor, startTownTransfer);
  } else {
    startTownTransfer();
  }
}

function exitTownToBattle(forceRespawn = false) {
  if (!phaserGame || !isInTown) return;
  isInTown = false;
  ui.hideTownSplash();
  if (phaserGame.scene.isActive('TownScene')) phaserGame.scene.sleep('TownScene');
  if (phaserGame.scene.isSleeping('BattleScene')) {
    phaserGame.scene.wake('BattleScene');
  } else if (!phaserGame.scene.isActive('BattleScene')) {
    phaserGame.scene.start('BattleScene');
  }
  phaserGame.scene.bringToTop('BattleScene');
  battleScene = phaserGame.scene.getScene('BattleScene');
  battleScene?.cameras?.main?.fadeIn?.(350, 0, 0, 0);
  battleScene?.setPaused(false);
  if (forceRespawn && battleScene?.sys?.isActive()) {
    battleScene.spawnWaveSquad?.();
  }
  const btn = document.getElementById('btn-town-toggle');
  if (btn) {
    btn.textContent = '🏰 返回主城 (G)';
    btn.classList.remove('in-town');
  }
  const wpBtn = document.getElementById('btn-top-waypoint');
  if (wpBtn) { wpBtn.classList.remove('in-town'); wpBtn.classList.add('is-disabled'); }
  townBgm.stop();
  ui.updateTargetFrameTown?.(null);
  ui.addLog('⚔️ 已離開主城重返前線戰鬥！', 'system');
}

document.getElementById('btn-town-toggle')?.addEventListener('click', () => {
  if (isInTown) exitTownToBattle();
  else enterTown(Math.min(9, getChapterIdx(gameState.stage)));
});

function openTownWaypointUI() {
  if (!isInTown) {
    ui.addLog('🧭 快速傳送陣僅限於主城內使用，請先按 [G] 返回主城！', 'system');
    return;
  }
  const chIdx = townScene?.townData?.chapterIdx ?? Math.min(9, getChapterIdx(gameState.stage));
  ui.openTownFacilityModal('modal_waypoint', { chapterIdx: chIdx }, {
    getWaypoints: () => townScene?.getWaypointList?.() || [],
    onTeleportWaypoint: (wx, wy, label) => {
      townScene?.teleportHeroTo?.(wx, wy);
      ui.addLog(`🧭 已傳送至「${label}」！`, 'system');
    },
    onExitTown: () => exitTownToBattle(),
    onTeleportToStage: (stg) => {
      gameState.stage = stg;
      gameState.wave = 1;
      exitTownToBattle(true);
      refreshStatsAndUI();
      ui.addLog(`🚀 已從星門出城傳送至第 ${getStageLabel(stg)} 關！`, 'victory');
      persistAll(true);
    },
    onTeleportTown: (targetChIdx) => {
      isInTown = false;
      enterTown(targetChIdx, true);
      ui.addLog(`🌀 星門傳送完成！已抵達第 ${targetChIdx + 1} 章主城！`, 'victory');
    },
  });
}
document.getElementById('btn-top-waypoint')?.addEventListener('click', openTownWaypointUI);
document.getElementById('btn-town-bgm')?.addEventListener('click', (e) => {
  const muted = townBgm.toggleMute();
  const lbl = e.currentTarget.querySelector('.mmo-lbl');
  if (lbl) lbl.textContent = muted ? '靜音' : '音樂';
});

// --- 全螢幕暗黑歡迎頁 ---
const welcomeScreen = document.getElementById('welcome-screen');
const gameScreen = document.getElementById('game-screen');
const welcomeAuthStep = document.getElementById('welcome-step-auth');
const welcomeClassStep = document.getElementById('welcome-step-class');
const welcomeAuthStatus = document.getElementById('welcome-auth-status');
const welcomeClassList = document.getElementById('welcome-class-list');
const welcomeClassStage = document.getElementById('welcome-class-stage');
const welcomeSaveSummary = document.getElementById('welcome-save-summary');
const nicknameInput = document.getElementById('input-hero-nickname');
const randomNickBtn = document.getElementById('btn-random-nickname');
const resetCharBtn = document.getElementById('btn-reset-character');
const startGameBtn = document.getElementById('btn-start-game');

const CLASS_META_EXT = {
  warrior:  { role: '前排重裝坦克・吸血破陣', tag: '近戰・物理烈焰', archetype: '不朽狂戰士 / 浴血重裝流', priority: '力量 ＞ 生命 ＞ 暴擊 ＞ 吸血', gear: '重型板甲・雙手巨劍', tip: '利用旋風重斬與血怒衝鋒切入怪群，靠高額吸血站樁輸出。', bars: [85, 95, 55, 78] },
  ranger:   { role: '遠程風箏射手・高頻暴擊', tag: '遠程・穿刺劇毒', archetype: '幻影神射手 / 箭雨暴擊流', priority: '攻速 ＞ 暴擊 ＞ 敏捷 ＞ 爆傷', gear: '輕型皮甲・長弓雙弩', tip: '透過風行疾步保持距離，搭配翡翠箭雨與死神標記清場。', bars: [88, 55, 95, 86] },
  mage:     { role: '奧術毀滅法師・全場清怪', tag: '法術・冰火虛空', archetype: '星界大法師 / 隕石毀滅流', priority: '智力 ＞ 技能傷 ＞ 冷卻 ＞ 魔力', gear: '奧術法袍・星界法杖', tip: '施放魔力超載後接續深淵隕石與黑洞奇點，瞬間蒸發全場。', bars: [96, 48, 65, 98] },
  paladin:  { role: '神聖守護騎士・反傷光環', tag: '聖光・護盾反傷', archetype: '聖殿裁決官 / 祝福聖鎚流', priority: '護甲 ＞ 生命 ＞ 格擋 ＞ 聖傷', gear: '聖殿重甲・戰鎚塔盾', tip: '開啟聖光神盾與奉獻聖地，用環繞祝福之鎚穩定輾壓首領。', bars: [76, 98, 60, 74] },
  necro:    { role: '亡靈召喚主宰・骨海軍團', tag: '亡靈・召喚骨矛', archetype: '骨海死靈師 / 軍團爆破流', priority: '召喚傷 ＞ 智力 ＞ 生命 ＞ 魂能', gear: '冥骨法衣・死靈鐮杖', tip: '先召出骷髏戰士與鮮血魔像前排抗傷，再以屍體爆破收割。', bars: [86, 72, 58, 84] },
  assassin: { role: '暗影極速刺客・瞬殺連擊', tag: '暗影・瞬殺劇毒', archetype: '虛空影殺者 / 劇毒連斬流', priority: '暴擊 ＞ 爆傷 ＞ 攻速 ＞ 閃避', gear: '暗影緊身衣・淬毒雙刃', tip: '用瞬影閃襲與影分身疊滿劇毒層數，再以暗影絕殺陣斬殺。', bars: [94, 52, 98, 95] },
};

const RANDOM_NAMES = ['燼影行者', '蒼穹劍魂', '冥界守望者', '黎明裁決', '緋紅星靈', '極夜獵手', '聖血騎士', '虛空破曉', '霜狼領主', '星界旅人'];

function updateStartButtonState() {
  if (!startGameBtn || !nicknameInput) return;
  const nick = (nicknameInput.value || '').trim();
  const valid = nick.length >= 2 && nick.length <= 12;
  startGameBtn.disabled = !valid;
  const cp = ensureClassProgress(gameState);
  const cls = CLASSES[selectedLobbyClass] || CLASSES.warrior;
  const lv = cp[cls.id]?.level || 1;
  startGameBtn.textContent = valid
    ? `⚔️ 以「${nick}」進入（${cls.name} Lv.${lv}）`
    : '請輸入 2~12 字冒險者暱稱';
}

let lobbyInspectorTab = 'overview';

function renderWelcomeClasses() {
  if (!welcomeClassList || !welcomeClassStage) return;
  const cp = ensureClassProgress(gameState);
  welcomeClassList.innerHTML = '';

  Object.values(CLASSES).forEach((cls) => {
    const lv = cp[cls.id]?.level || 1;
    const isSel = selectedLobbyClass === cls.id;
    const item = document.createElement('button');
    item.type = 'button';
    item.className = `theater-class-card ${isSel ? 'active' : ''}`;
    item.style.setProperty('--cls-accent', cls.color || '#f59e0b');
    item.innerHTML = `
      <img src="${cls.spritePath}" alt="${cls.name}" />
      <div class="tcard-meta">
        <span class="tcard-name" style="color:${cls.color}">${cls.name}</span>
        <span class="tcard-lv ${lv <= 1 ? 'is-lv1' : ''}">Lv.${lv}</span>
      </div>
    `;
    item.onclick = () => {
      selectedLobbyClass = cls.id;
      renderWelcomeClasses();
      updateStartButtonState();
    };
    welcomeClassList.appendChild(item);
  });

  const cls = CLASSES[selectedLobbyClass] || CLASSES.warrior;
  const lv = cp[cls.id]?.level || 1;
  const ext = CLASS_META_EXT[cls.id] || { role: cls.title, tag: '暗黑職業', bars: [80, 80, 80, 80] };
  const barNames = ['攻擊破壞', '生存護甲', '攻速機動', '奧義爆發'];
  const rawSk = CLASS_SKILLS_MAP[cls.id] || {};
  const clsSkills = Array.isArray(rawSk) ? rawSk : Object.values(rawSk);

  welcomeClassStage.innerHTML = `
    <div class="theater-arena-col">
      <div class="theater-canvas-wrap">
        <canvas id="preview-skill-canvas" width="520" height="292"></canvas>
        <div id="showcase-active-pill" class="theater-cast-pill">⚔️ 演武中</div>
      </div>
      <div class="theater-skill-grid">
        ${clsSkills.map((sk, idx) => `<button type="button" class="showcase-sk-btn ${idx === 0 ? 'active' : ''}" data-sk-idx="${idx}">${sk.icon ? `<img class="sk-btn-ico" src="${sk.icon}" alt="" />` : ''}<span>${sk.name}</span></button>`).join('')}
      </div>
    </div>

    <div class="theater-info-col">
      <div class="theater-hero-head">
        <h2 style="color:${cls.color}">${cls.name}</h2>
        <span>${cls.title}・Lv.${lv}</span>
        <small>${ext.tag}</small>
      </div>
      <p class="theater-hero-desc">${cls.desc}</p>
      <div class="stage-stat-bars">
        ${barNames.map((bn, i) => `
          <div class="stat-bar-row">
            <div style="display:flex;justify-content:space-between;"><span>${bn}</span><b>${ext.bars[i]}</b></div>
            <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${ext.bars[i]}%;background:${cls.color};"></div></div>
          </div>`).join('')}
      </div>
      <div class="innate-plaque" style="margin:8px 0;">
        <b style="color:#fde047;">🌟 天生被動：</b><span>${cls.innateBonus?.label || ''}</span>
      </div>
      <div id="stage-skill-dynamic" class="skill-lore-scroll"></div>
    </div>
  `;

  const scCanvas = document.getElementById('preview-skill-canvas');
  const scDyn = document.getElementById('stage-skill-dynamic');
  const scPill = document.getElementById('showcase-active-pill');
  const scBtns = welcomeClassStage.querySelectorAll('.showcase-sk-btn');
  try {
    heroShowcase.attach(scCanvas, cls.id, (idx, sk) => {
      scBtns.forEach((b) => b.classList.toggle('active', Number(b.dataset.skIdx) === idx));
      if (scPill && sk) scPill.textContent = `⚔️ 正在演武：【${sk.name}】`;
      if (scDyn && sk) {
        const cdSec = sk.cooldownMs ? (sk.cooldownMs / 1000).toFixed(1) + 's' : '-';
        const ico = sk.icon ? `<img src="${sk.icon}" class="lore-sk-ico" style="border-color:${cls.color};" alt="" />` : '';
        scDyn.innerHTML = `
          <div class="lore-sk-head">
            ${ico}
            <div>
              <b style="color:${cls.color};font-size:14px;">【${sk.name}】</b>
              <div class="lore-sk-cd">冷卻時間：${cdSec}</div>
            </div>
          </div>
          <p class="lore-sk-desc" style="font-size:12.5px;">${sk.desc || ''}</p>
        `;
      }
    });
  } catch (err) { console.warn('Showcase err:', err); }
  scBtns.forEach((b) => {
    b.onclick = () => heroShowcase.triggerSkill(Number(b.dataset.skIdx));
  });
}

function enterWelcomeClassStep(userLabel) {
  welcomeAuthStep.classList.add('hidden');
  welcomeClassStep.classList.remove('hidden');
  selectedLobbyClass = gameState.classId || 'warrior';
  if (gameState.characterCreated) {
    welcomeSaveSummary.textContent = `${userLabel} ｜ 【${gameState.nickname || '無名英雄'}】Lv.${gameState.level}・第 ${getStageLabel(gameState.stage)} 關`;
    if (resetCharBtn) resetCharBtn.classList.remove('hidden');
  } else {
    welcomeSaveSummary.textContent = `${userLabel} ｜ 🆕 首次創角（各職業獨立保留等級）`;
    if (resetCharBtn) resetCharBtn.classList.add('hidden');
  }
  if (nicknameInput) {
    nicknameInput.value = gameState.nickname || '';
    nicknameInput.disabled = false;
  }
  if (randomNickBtn) randomNickBtn.style.display = 'inline-block';
  renderWelcomeClasses();
  updateStartButtonState();
}

nicknameInput?.addEventListener('input', updateStartButtonState);
randomNickBtn?.addEventListener('click', () => {
  if (!nicknameInput) return;
  const pick = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
  nicknameInput.value = `${pick}${Math.floor(10 + Math.random() * 89)}`;
  updateStartButtonState();
});
resetCharBtn?.addEventListener('click', () => {
  if (!confirm('確定要刪除目前角色並重新選擇職業與暱稱嗎？（將重置關卡與裝備進度）')) return;
  const fresh = createInitialState('warrior');
  Object.keys(gameState).forEach((k) => delete gameState[k]);
  Object.assign(gameState, fresh);
  persistAll(true);
  enterWelcomeClassStep('重建角色');
});

function startAdventure() {
  heroShowcase.stop();
  const nick = (nicknameInput?.value || gameState.nickname || '').trim();
  if (nick.length < 2) {
    updateStartButtonState();
    return;
  }
  gameState.nickname = nick;
  gameState.characterCreated = true;
  switchStateToClass(selectedLobbyClass, gameState);
  gameStarted = true;
  welcomeScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');

  refreshStatsAndUI();
  initPhaserGame();
  persistAll(true);

  const offline = calcOfflineProgress(gameState, computedStats);
  if (offline) {
    ui.showOfflineModal(offline, () => {
      gameState.gold += offline.goldEarned;
      grantExp(offline.expEarned);
      offline.itemsFound.forEach((it) => handleLootDrop(it));
      refreshStatsAndUI();
      persistAll(true);
    });
  }
}

document.getElementById('btn-google-login')?.addEventListener('click', async () => {
  welcomeAuthStatus.textContent = '正在連線 Google 帳號...';
  try {
    await signInWithGoogle();
  } catch (err) {
    welcomeAuthStatus.textContent = err.message || 'Google 登入失敗，請稍後再試。';
  }
});

document.getElementById('btn-guest-play')?.addEventListener('click', () => {
  enterWelcomeClassStep('本機離線試玩');
});

let isIntroPlaying = false;
function playCinematicIntro(onDone) {
  const ov = document.getElementById('cinematic-intro-overlay');
  const vid = document.getElementById('cinematic-intro-video');
  const cap = document.getElementById('cinematic-caption');
  const muteBtn = document.getElementById('btn-intro-mute');
  const skipBtn = document.getElementById('btn-intro-skip');
  if (!ov || !vid) { onDone?.(); return; }

  isIntroPlaying = true;
  ov.classList.remove('hidden', 'fading-out');
  vid.currentTime = 0;
  vid.muted = false;
  if (muteBtn) muteBtn.textContent = '🔊 音效開啟';

  let finished = false;
  const finishIntro = () => {
    if (finished) return;
    finished = true;
    isIntroPlaying = false;
    window.removeEventListener('keydown', onKey);
    vid.pause();
    ov.classList.add('fading-out');
    setTimeout(() => {
      ov.classList.add('hidden');
      ov.classList.remove('fading-out');
      onDone?.();
    }, 380);
  };

  const onKey = (e) => {
    if (e.code === 'Space' || e.code === 'Escape' || e.code === 'Enter') {
      e.preventDefault();
      finishIntro();
    }
  };
  window.addEventListener('keydown', onKey);
  if (skipBtn) skipBtn.onclick = finishIntro;
  if (muteBtn) {
    muteBtn.onclick = () => {
      vid.muted = !vid.muted;
      muteBtn.textContent = vid.muted ? '🔇 已靜音' : '🔊 音效開啟';
    };
  }

  vid.ontimeupdate = () => {
    if (!cap) return;
    const t = vid.currentTime || 0;
    if (t < 3.6) cap.textContent = '深淵裂隙開啟，六大英雄整裝集結⋯';
    else if (t < 6.4) cap.textContent = '各職奧義齊發，向暗黑軍團發動總攻！';
    else if (t < 10.2) cap.textContent = '無盡魔軍壓境，毀滅之戰一觸即發——';
    else cap.textContent = '《無限深淵》—— 終局之戰，即刻啟程！';
  };
  vid.onended = finishIntro;
  vid.onerror = finishIntro;

  const p = vid.play();
  if (p && p.catch) {
    p.catch(() => {
      vid.muted = true;
      if (muteBtn) muteBtn.textContent = '🔇 點擊開啟音效';
      vid.play().catch(finishIntro);
    });
  }
}

const bgVid = document.getElementById('welcome-bg-video');
const bgmBtn = document.getElementById('btn-welcome-bgm');
if (bgmBtn && bgVid) {
  bgmBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    bgVid.muted = !bgVid.muted;
    if (!bgVid.muted) bgVid.play().catch(() => {});
    bgmBtn.textContent = bgVid.muted ? '🔇 點擊開啟背景音樂' : '🔊 背景音樂播放中';
  });
}

document.getElementById('btn-start-game')?.addEventListener('click', () => {
  if (bgVid) { bgVid.pause(); bgVid.muted = true; }
  startAdventure();
});
document.getElementById('btn-watch-intro')?.addEventListener('click', () => {
  playCinematicIntro();
});

document.getElementById('btn-cloud-logout')?.addEventListener('click', async () => {
  persistAll(true);
  await signOutGoogle();
  gameStarted = false;
  if (battleScene) battleScene.setPaused(true);
  gameScreen.classList.add('hidden');
  welcomeClassStep.classList.add('hidden');
  welcomeAuthStep.classList.remove('hidden');
  welcomeScreen.classList.remove('hidden');
});

function toggleAutoMoveMode() {
  if (!battleScene) return;
  const isAuto = battleScene.toggleAutoMove();
  const label = document.getElementById('auto-mode-label');
  const btn = document.getElementById('btn-toggle-auto');
  const pill = document.getElementById('hud-afk-pill');
  if (label) label.textContent = isAuto ? '自動' : '手動';
  if (btn) btn.classList.toggle('active', isAuto);
  if (pill) {
    pill.textContent = isAuto ? '★ AFK 自動掛機中' : '🎮 手動走位模式';
    pill.classList.toggle('active', isAuto);
    pill.classList.toggle('manual', !isAuto);
  }
  ui.addLog(isAuto ? '切換為【自動巡邏模式】(按 WASD 可隨時介入走位)' : '切換為【純手動走位模式】(WASD / 方向鍵移動)', 'system');
}

document.getElementById('btn-toggle-auto')?.addEventListener('click', toggleAutoMoveMode);
document.getElementById('btn-potion')?.addEventListener('click', () => battleScene?.usePotion(true));
document.getElementById('btn-world-map')?.addEventListener('click', () => ui.openWorldMapModal(gameState));
document.getElementById('hud-stage-title')?.addEventListener('click', () => ui.openWorldMapModal(gameState));
[0, 1, 2].forEach((i) => {
  document.getElementById(`skill-slot-${i}`)?.addEventListener('click', () => battleScene?.castSkillSlot(i, true));
});

window.addEventListener('keydown', (e) => {
  if (!gameStarted) return;
  if (window.__powerSaveMode) { togglePowerSaveMode(false); return; }
  if (hudSettings.isListeningKey()) return;
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

  const kb = hudSettings.getKeybinds();
  if (e.code === kb.skill0) {
    e.preventDefault();
    battleScene?.castSkillSlot(0, true);
  } else if (e.code === kb.skill1) {
    battleScene?.castSkillSlot(1, true);
  } else if (e.code === kb.skill2) {
    battleScene?.castSkillSlot(2, true);
  } else if (e.code === kb.autoHunt) {
    toggleAutoMoveMode();
  } else if (e.code === kb.potion) {
    battleScene?.usePotion(true);
  } else if (e.code === kb.worldMap) {
    const wm = document.getElementById('modal-world-map');
    wm?.classList.contains('hidden') ? ui.openWorldMapModal(gameState) : wm.classList.add('hidden');
  } else if (e.code === kb.gear) {
    ui.activeDrawer === 'gear' ? ui.closeDrawer() : ui.openDrawer('gear');
  } else if (e.code === kb.bag) {
    ui.activeDrawer === 'bag' ? ui.closeDrawer() : ui.openDrawer('bag');
  } else if (e.code === kb.upgrade) {
    ui.activeDrawer === 'upgrade' ? ui.closeDrawer() : ui.openDrawer('upgrade');
  } else if (e.code === kb.tree) {
    ui.activeDrawer === 'tree' ? ui.closeDrawer() : ui.openDrawer('tree');
  } else if (e.code === kb.skills) {
    ui.activeDrawer === 'skills' ? ui.closeDrawer() : ui.openDrawer('skills');
  } else if (e.code === kb.rebirth) {
    ui.activeDrawer === 'rebirth' ? ui.closeDrawer() : ui.openDrawer('rebirth');
  } else if (e.code === kb.switchClass) {
    const cm = document.getElementById('modal-class');
    cm?.classList.contains('hidden') ? ui.openClassModal(gameState) : cm.classList.add('hidden');
  } else if (e.code === kb.townToggle) {
    if (isInTown) exitTownToBattle(); else enterTown(Math.min(9, getChapterIdx(gameState.stage)));
  } else if (e.code === 'KeyZ') {
    e.preventDefault(); togglePowerSaveMode();
  } else if (e.code === 'KeyA') {
    e.preventDefault(); achTowerModal.toggle();
  } else if (e.code === kb.shop) {
    e.preventDefault(); shopModal.toggle();
  } else if (e.code === kb.pets) {
    e.preventDefault(); ui.activeDrawer === 'pets' ? ui.closeDrawer() : ui.openDrawer('pets');
  } else if (e.code === kb.settings) {
    e.preventDefault(); hudSettings.toggleModal();
  } else if (e.code === kb.waypoint) {
    if (isInTown) openTownWaypointUI();
  } else if (e.code === kb.log) {
    ui.activeDrawer === 'log' ? ui.closeDrawer() : ui.openDrawer('log');
  } else if (e.code === kb.quickSalvage) {
    document.getElementById('btn-salvage-junk')?.click();
  } else if (e.code === 'Escape') {
    ui.closeDrawer();
    document.getElementById('modal-class')?.classList.add('hidden');
    document.getElementById('modal-world-map')?.classList.add('hidden');
    shopModal.close();
    achTowerModal.close();
    hudSettings.closeModal();
  } else if (e.key === '1') {
    ui.activeDrawer === 'gear' ? ui.closeDrawer() : ui.openDrawer('gear');
  } else if (e.key === '2') {
    ui.activeDrawer === 'bag' ? ui.closeDrawer() : ui.openDrawer('bag');
  } else if (e.key === '3') {
    ui.activeDrawer === 'upgrade' ? ui.closeDrawer() : ui.openDrawer('upgrade');
  } else if (e.key === '4') {
    ui.activeDrawer === 'tree' ? ui.closeDrawer() : ui.openDrawer('tree');
  } else if (e.key === '5') {
    ui.activeDrawer === 'rebirth' ? ui.closeDrawer() : ui.openDrawer('rebirth');
  } else if (e.key === '6') {
    ui.activeDrawer === 'skills' ? ui.closeDrawer() : ui.openDrawer('skills');
  }
});

refreshStatsAndUI();

initCloudAuth(async (user) => {
  const cloudBadge = document.getElementById('hud-cloud-status');
  const logoutBtn = document.getElementById('btn-cloud-logout');

  if (user) {
    if (cloudBadge) cloudBadge.textContent = `☁️ ${user.displayName || user.email}`;
    if (logoutBtn) logoutBtn.classList.remove('hidden');
    welcomeAuthStatus.textContent = '已登入，正在同步雲端存檔...';
    const cloudData = await loadCloudSave(user.uid);
    if (cloudData && (!gameState.lastSavedAt || (cloudData.lastSavedAt || 0) >= gameState.lastSavedAt)) {
      const base = createInitialState(cloudData.classId || 'warrior');
      gameState = {
        ...base,
        ...cloudData,
        upgrades: { ...base.upgrades, ...(cloudData.upgrades || {}) },
        equipment: { ...base.equipment, ...(cloudData.equipment || {}) },
        autoSalvage: { ...base.autoSalvage, ...(cloudData.autoSalvage || {}) },
        skillTree: { w_whirlwind: 1, r_volley: 1, m_meteor: 1, p_hammer: 1, n_skeleton: 1, a_blitz: 1, ...(cloudData.skillTree || {}) },
        equippedSkillsByClass: {
          ...base.equippedSkillsByClass,
          ...(cloudData.equippedSkillsByClass || {}),
        },
        nickname: cloudData.nickname || gameState.nickname || '',
        characterCreated: !!(cloudData.characterCreated || gameState.characterCreated),
        classProgress: cloudData.classProgress || gameState.classProgress || null,
        userSettings: cloudData.userSettings || gameState.userSettings || null,
        inventory: Array.isArray(cloudData.inventory) ? cloudData.inventory : [],
      };
      if (gameState.userSettings) hudSettings.importSettings(gameState.userSettings);
      refreshStatsAndUI();
    }
    if (!gameStarted) {
      enterWelcomeClassStep(`☁️ ${user.displayName || user.email}`);
    }
  } else {
    if (cloudBadge) cloudBadge.textContent = '☁️ 本機模式';
    if (logoutBtn) logoutBtn.classList.add('hidden');
    welcomeAuthStatus.textContent = '請使用 Google 帳號登入，或選擇本機離線試玩。';
  }
});

setInterval(() => {
  if (gameStarted) persistAll(true);
}, 15000);
window.addEventListener('beforeunload', () => persistAll(true));
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') persistAll(true);
});
