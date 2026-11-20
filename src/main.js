import { CLASSES } from './data/classes.js';
import { RARITIES } from './data/items.js';
import { generateLoot, getSalvageReward } from './logic/lootGen.js';
import { recalcPlayerStats, getExpToNext, getUpgradeCost, formatNum } from './logic/statCalc.js';
import { createInitialState, loadGame, saveGame, calcOfflineProgress } from './logic/saveSystem.js';
import {
  initCloudAuth,
  signInWithGoogle,
  signOutGoogle,
  getCurrentUser,
  loadCloudSave,
  saveCloudData,
  isFirebaseConfigured,
} from './auth/firebase.js';
import { BattleScene } from './scenes/BattleScene.js';
import { DashboardUI } from './ui/DashboardUI.js';

let gameState = loadGame() || createInitialState('warrior');
let computedStats = recalcPlayerStats(gameState);
let battleScene = null;
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

const ui = new DashboardUI({
  onSelectClass: (classId) => {
    gameState.classId = classId;
    selectedLobbyClass = classId;
    const cls = CLASSES[classId];
    ui.addLog(`切換職業為【${cls.name}】！`, 'system');
    refreshStatsAndUI();
    if (battleScene) battleScene.refreshHeroClass(classId);
    persistAll(true);
  },

  onEquipItem: (uid) => {
    const idx = gameState.inventory.findIndex((i) => i.uid === uid);
    if (idx === -1) return;
    const item = gameState.inventory[idx];
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

  onUpgradeItem: (uid, isEquipped, cost) => {
    if (gameState.dust < cost) {
      ui.addLog(`強化粉塵不足（需要 ${cost}）！請分解多餘裝備取得。`, 'warn');
      return;
    }
    const item = isEquipped
      ? Object.values(gameState.equipment).find((i) => i && i.uid === uid)
      : gameState.inventory.find((i) => i.uid === uid);
    if (!item) return;

    gameState.dust -= cost;
    item.upgradeLevel = (item.upgradeLevel || 0) + 1;
    ui.addLog(`強化成功！${item.name} 升至 +${item.upgradeLevel}`, 'victory');
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
    let count = 0;
    let totalGold = 0;
    let totalDust = 0;
    gameState.inventory = gameState.inventory.filter((item) => {
      if (item.rarity === 'common' || item.rarity === 'magic') {
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
      ui.addLog(`一鍵分解 ${count} 件普通/魔法裝備：+${totalGold} 金幣、+${totalDust} 粉塵`, 'system');
      refreshStatsAndUI();
      persistAll(true);
    } else {
      ui.addLog('背包內沒有可分解的普通/魔法裝備。', 'normal');
    }
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

  onChangeStage: (delta) => {
    const target = Math.max(1, Math.min(gameState.maxStageReached, gameState.stage + delta));
    if (target === gameState.stage) return;
    gameState.stage = target;
    gameState.wave = 1;
    ui.addLog(`切換至第 ${target} 關刷寶。`, 'system');
    refreshStatsAndUI();
    if (battleScene) battleScene.spawnWaveMonster();
    persistAll();
  },
});

function grantExp(amount) {
  gameState.exp += amount;
  let need = getExpToNext(gameState.level);
  while (gameState.exp >= need) {
    gameState.exp -= need;
    gameState.level += 1;
    need = getExpToNext(gameState.level);
    ui.addLog(`🎉 角色升級！目前 Lv.${gameState.level}`, 'victory');
  }
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
  const r = RARITIES[item.rarity];
  if (item.rarity === 'legendary' || item.rarity === 'rare') {
    ui.addLog(`✨ 掉落 [${r.label}] ${item.name} (戰力 ${item.powerScore})！`, 'victory');
  }
  return item;
}

// --- 歡迎大廳：Google 登入 → 選職業 → 開始遊戲 ---
const lobbyModal = document.getElementById('modal-lobby');
const lobbyAuthStep = document.getElementById('lobby-step-auth');
const lobbyClassStep = document.getElementById('lobby-step-class');
const lobbyAuthStatus = document.getElementById('lobby-auth-status');
const lobbyClassGrid = document.getElementById('lobby-class-grid');
const lobbySaveSummary = document.getElementById('lobby-save-summary');

function renderLobbyClasses() {
  lobbyClassGrid.innerHTML = '';
  Object.values(CLASSES).forEach((cls) => {
    const card = document.createElement('div');
    card.className = `class-card ${selectedLobbyClass === cls.id ? 'selected' : ''}`;
    card.innerHTML = `
      <img src="${cls.spritePath}" alt="${cls.name}" />
      <div class="class-name" style="color:${cls.color}">${cls.name}</div>
      <div class="class-title">${cls.title}</div>
      <p class="class-desc">${cls.desc}</p>
      <div class="class-skill"><strong>專屬技能：${cls.skill.name}</strong><br>${cls.skill.desc}</div>
    `;
    card.onclick = () => {
      selectedLobbyClass = cls.id;
      renderLobbyClasses();
    };
    lobbyClassGrid.appendChild(card);
  });
}

function enterLobbyClassStep(userLabel) {
  lobbyAuthStep.classList.add('hidden');
  lobbyClassStep.classList.remove('hidden');
  lobbySaveSummary.textContent = `${userLabel} ｜ 存檔進度：Lv.${gameState.level}・第 ${gameState.stage} 關・金幣 ${formatNum(gameState.gold)}`;
  selectedLobbyClass = gameState.classId || 'warrior';
  renderLobbyClasses();
}

function startAdventure() {
  gameState.classId = selectedLobbyClass;
  gameStarted = true;
  lobbyModal.classList.add('hidden');
  refreshStatsAndUI();
  if (battleScene) {
    battleScene.refreshHeroClass(gameState.classId);
    battleScene.setPaused(false);
  }
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
  lobbyAuthStatus.textContent = '正在連線 Google 帳號...';
  try {
    await signInWithGoogle();
  } catch (err) {
    lobbyAuthStatus.textContent = err.message || 'Google 登入失敗，請檢查 Firebase 設定。';
  }
});

document.getElementById('btn-guest-play')?.addEventListener('click', () => {
  enterLobbyClassStep('本機離線試玩');
});

document.getElementById('btn-start-game')?.addEventListener('click', () => {
  startAdventure();
});

document.getElementById('btn-cloud-logout')?.addEventListener('click', async () => {
  persistAll(true);
  await signOutGoogle();
  gameStarted = false;
  if (battleScene) battleScene.setPaused(true);
  lobbyClassStep.classList.add('hidden');
  lobbyAuthStep.classList.remove('hidden');
  lobbyModal.classList.remove('hidden');
});

// 主動點擊 / 空白鍵施放技能
function triggerManualSkill() {
  if (!battleScene) return;
  battleScene.castSkillManual();
}
document.getElementById('btn-cast-skill')?.addEventListener('click', triggerManualSkill);
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && gameStarted) {
    e.preventDefault();
    triggerManualSkill();
  }
});

// 啟動 Phaser 場景
const config = {
  type: Phaser.AUTO,
  parent: 'phaser-stage',
  width: 640,
  height: 520,
  backgroundColor: '#0b0d13',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BattleScene],
};

const game = new Phaser.Game(config);
game.scene.start('BattleScene', {
  getState: () => gameState,
  getStats: () => computedStats,
  callbacks: {
    onSkillTick: (ratio) => {
      ui.updateSkillProgress(ratio);
      const btn = document.getElementById('btn-cast-skill');
      if (btn) btn.classList.toggle('ready', ratio >= 1);
    },
    onMonsterKilled: (mob) => {
      const goldGain = Math.round(mob.gold * (1 + computedStats.goldFind / 100));
      gameState.gold += goldGain;
      gameState.kills += 1;
      grantExp(mob.exp);

      const dropped = generateLoot(mob.stage, mob.isBoss, computedStats.magicFind);
      const keptItem = handleLootDrop(dropped);

      if (mob.isBoss) {
        ui.addLog(`🏆 擊敗第 ${gameState.stage} 關首領！獲得 ${formatNum(goldGain)} 金幣`, 'victory');
        gameState.stage += 1;
        gameState.wave = 1;
        gameState.maxStageReached = Math.max(gameState.maxStageReached, gameState.stage);
        persistAll(true);
      } else {
        gameState.wave += 1;
      }

      refreshStatsAndUI();
      return { item: keptItem || dropped };
    },
    onPlayerDefeated: (reason) => {
      gameState.wave = 1;
      ui.addLog(`⚠️ ${reason}`, 'warn');
      refreshStatsAndUI();
    },
  },
});

game.events.once('ready', () => {
  battleScene = game.scene.getScene('BattleScene');
  battleScene.setPaused(!gameStarted);
});

refreshStatsAndUI();

// 初始化 Google 帳號狀態
initCloudAuth(async (user, status) => {
  const cloudBadge = document.getElementById('hud-cloud-status');
  const logoutBtn = document.getElementById('btn-cloud-logout');

  if (user) {
    if (cloudBadge) cloudBadge.textContent = `☁️ ${user.displayName || user.email}`;
    if (logoutBtn) logoutBtn.classList.remove('hidden');
    lobbyAuthStatus.textContent = '已登入，正在同步雲端存檔...';
    const cloudData = await loadCloudSave(user.uid);
    if (cloudData && (!gameState.lastSavedAt || (cloudData.lastSavedAt || 0) >= gameState.lastSavedAt)) {
      const base = createInitialState(cloudData.classId || 'warrior');
      gameState = {
        ...base,
        ...cloudData,
        upgrades: { ...base.upgrades, ...(cloudData.upgrades || {}) },
        equipment: { ...base.equipment, ...(cloudData.equipment || {}) },
        autoSalvage: { ...base.autoSalvage, ...(cloudData.autoSalvage || {}) },
        inventory: Array.isArray(cloudData.inventory) ? cloudData.inventory : [],
      };
      refreshStatsAndUI();
    }
    if (!gameStarted) {
      enterLobbyClassStep(`☁️ ${user.displayName || user.email}`);
    }
  } else {
    if (cloudBadge) cloudBadge.textContent = isFirebaseConfigured() ? '☁️ 未登入' : '☁️ 本機模式';
    if (logoutBtn) logoutBtn.classList.add('hidden');
    lobbyAuthStatus.textContent = isFirebaseConfigured()
      ? '請先登入 Google 帳號以同步雲端存檔。'
      : '提示：尚未於 src/auth/firebase.js 填入 apiKey，目前可先用本機試玩。';
  }
});

setInterval(() => {
  if (gameStarted) persistAll(true);
}, 15000);
window.addEventListener('beforeunload', () => persistAll(true));
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') persistAll(true);
});
