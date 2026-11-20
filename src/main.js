import { CLASSES } from './data/classes.js';
import { RARITIES } from './data/items.js';
import { generateLoot, getSalvageReward } from './logic/lootGen.js';
import { recalcPlayerStats, getExpToNext, getUpgradeCost, formatNum } from './logic/statCalc.js';
import { createInitialState, loadGame, saveGame, calcOfflineProgress } from './logic/saveSystem.js';
import { BattleScene } from './scenes/BattleScene.js';
import { DashboardUI } from './ui/DashboardUI.js';

let gameState = loadGame();
const isFirstLaunch = !gameState;
if (!gameState) {
  gameState = createInitialState('warrior');
}

let computedStats = recalcPlayerStats(gameState);
let battleScene = null;

function refreshStatsAndUI() {
  computedStats = recalcPlayerStats(gameState);
  ui.updateTopBar(gameState, computedStats);
  ui.renderAllPanels(gameState, computedStats);
  if (battleScene) battleScene.syncMaxHp();
}

const ui = new DashboardUI({
  onSelectClass: (classId) => {
    gameState.classId = classId;
    const cls = CLASSES[classId];
    ui.addLog(`切換職業為【${cls.name}】！`, 'system');
    refreshStatsAndUI();
    if (battleScene) battleScene.refreshHeroClass(classId);
    saveGame(gameState);
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
    saveGame(gameState);
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
    saveGame(gameState);
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
    saveGame(gameState);
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
      saveGame(gameState);
    } else {
      ui.addLog('背包內沒有可分解的普通/魔法裝備。', 'normal');
    }
  },

  onToggleAutoSalvage: (rarity, checked) => {
    gameState.autoSalvage[rarity] = checked;
    saveGame(gameState);
  },

  onBuyUpgrade: (key) => {
    const cost = getUpgradeCost(key, gameState.upgrades[key] || 0);
    if (gameState.gold < cost) return;
    gameState.gold -= cost;
    gameState.upgrades[key] = (gameState.upgrades[key] || 0) + 1;
    refreshStatsAndUI();
    saveGame(gameState);
  },

  onChangeStage: (delta) => {
    const target = Math.max(1, Math.min(gameState.maxStageReached, gameState.stage + delta));
    if (target === gameState.stage) return;
    gameState.stage = target;
    gameState.wave = 1;
    ui.addLog(`切換至第 ${target} 關刷寶。`, 'system');
    refreshStatsAndUI();
    if (battleScene) battleScene.spawnWaveMonster();
    saveGame(gameState);
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
    onSkillTick: (ratio) => ui.updateSkillProgress(ratio),
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
});

// 啟動與離線收益檢查
refreshStatsAndUI();
if (isFirstLaunch) {
  ui.openClassModal(false);
} else {
  const offline = calcOfflineProgress(gameState, computedStats);
  if (offline) {
    ui.showOfflineModal(offline, () => {
      gameState.gold += offline.goldEarned;
      grantExp(offline.expEarned);
      offline.itemsFound.forEach((it) => handleLootDrop(it));
      refreshStatsAndUI();
      saveGame(gameState);
    });
  }
}

setInterval(() => saveGame(gameState), 10000);
window.addEventListener('beforeunload', () => saveGame(gameState));
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') saveGame(gameState);
});
