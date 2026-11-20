import { CLASSES } from './data/classes.js';
import { getStageLabel } from './data/monsters.js';
import { WARRIOR_SKILLS } from './data/warriorSkills.js';
import { RANGER_SKILLS } from './data/rangerSkills.js';
import { MAGE_SKILLS } from './data/mageSkills.js';
import { RARITIES } from './data/items.js';
import { SKILL_TREE_NODES, isNodeUnlocked } from './data/skillTree.js';
import { generateLoot, getSalvageReward, calcItemPower } from './logic/lootGen.js';
import { recalcPlayerStats, getExpToNext, getUpgradeCost, calcRebirthCrystals, formatNum } from './logic/statCalc.js';
import { createInitialState, loadGame, saveGame, calcOfflineProgress } from './logic/saveSystem.js';
import {
  initCloudAuth,
  signInWithGoogle,
  signOutGoogle,
  getCurrentUser,
  loadCloudSave,
  saveCloudData,
} from './auth/firebase.js';
import { BattleScene } from './scenes/BattleScene.js';
import { DashboardUI } from './ui/DashboardUI.js';

let gameState = loadGame() || createInitialState('warrior');
let computedStats = recalcPlayerStats(gameState);
let phaserGame = null;
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

  onEquipSkill: (slotIdx, skillId) => {
    const cid = gameState.classId || 'warrior';
    const book = cid === 'warrior' ? WARRIOR_SKILLS : (cid === 'ranger' ? RANGER_SKILLS : MAGE_SKILLS);
    if (!gameState.equippedSkillsByClass) {
      gameState.equippedSkillsByClass = { warrior: ['whirlwind', null, null], ranger: ['volley', null, null], mage: ['meteor', null, null] };
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
    const spent = Object.values(tree).reduce((s, v) => s + v, 0) - 3;
    if (spent <= 0) return;
    gameState.skillPoints = (gameState.skillPoints || 0) + spent;
    gameState.skillTree = { w_whirlwind: 1, r_volley: 1, m_meteor: 1 };
    gameState.equippedSkillsByClass = { warrior: ['whirlwind', null, null], ranger: ['volley', null, null], mage: ['meteor', null, null] };
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
    gameState.skillTree = { w_whirlwind: 1, r_volley: 1, m_meteor: 1 };
    gameState.equippedSkillsByClass = { warrior: ['whirlwind', null, null], ranger: ['volley', null, null], mage: ['meteor', null, null] };
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
    const target = Math.max(1, Math.min(100, Math.min(gameState.maxStageReached, targetStage)));
    gameState.stage = target;
    gameState.wave = 1;
    ui.addLog(`傳送至第 ${getStageLabel(target)} 關刷寶。`, 'system');
    refreshStatsAndUI();
    if (battleScene) battleScene.spawnWaveSquad();
    persistAll(true);
  },

  onChangeStage: (delta) => {
    const target = Math.max(1, Math.min(100, Math.min(gameState.maxStageReached, gameState.stage + delta)));
    if (target === gameState.stage) return;
    gameState.stage = target;
    gameState.wave = 1;
    ui.addLog(`切換至第 ${getStageLabel(target)} 關刷寶。`, 'system');
    refreshStatsAndUI();
    if (battleScene) battleScene.spawnWaveSquad();
    persistAll();
  },
});

function grantExp(amount) {
  const gained = Math.round(amount * (computedStats.expMult || 1));
  gameState.exp += gained;
  let need = getExpToNext(gameState.level);
  while (gameState.exp >= need) {
    gameState.exp -= need;
    gameState.level += 1;
    gameState.skillPoints = (gameState.skillPoints || 0) + 1;
    need = getExpToNext(gameState.level);
    ui.addLog(`🎉 角色升級至 Lv.${gameState.level}（獲得 +1 技能點）`, 'victory');
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
  const h = Math.max(400, stageEl?.clientHeight || (window.innerHeight - 122));

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
    scene: [BattleScene],
  };

  window.__IDLE_ARPG_BRIDGE__ = {
    getState: () => gameState,
    getStats: () => computedStats,
    callbacks: {
      onSkillTicks: (ratios, cdDetails) => ui.updateSkillProgress(ratios, cdDetails),
      onVitalsTick: (vitals) => ui.updateVitals(vitals),
      onMonsterKilled: (mob, waveCleared) => {
        const goldGain = Math.round(mob.gold * (1 + computedStats.goldFind / 100));
        gameState.gold += goldGain;
        gameState.kills += 1;
        grantExp(mob.exp);

        const dropped = generateLoot(mob.stage, mob.isBoss, computedStats.magicFind);
        const keptItem = handleLootDrop(dropped);

        if (waveCleared) {
          const clearedLabel = getStageLabel(gameState.stage);
          ui.addLog(`🏆 成功全清第 ${clearedLabel} 關！`, 'victory');
          const nextUnlock = Math.min(100, gameState.stage + 1);
          gameState.maxStageReached = Math.max(gameState.maxStageReached || 1, nextUnlock);
          persistAll(true);
        }

        refreshStatsAndUI();
        return { item: keptItem || dropped };
      },
      onStageCleared: (clearedStage) => {
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
    battleScene?.setPaused(false);
    requestAnimationFrame(() => phaserGame?.scale?.refresh());
  });
}

// --- 全螢幕暗黑歡迎頁 ---
const welcomeScreen = document.getElementById('welcome-screen');
const gameScreen = document.getElementById('game-screen');
const welcomeAuthStep = document.getElementById('welcome-step-auth');
const welcomeClassStep = document.getElementById('welcome-step-class');
const welcomeAuthStatus = document.getElementById('welcome-auth-status');
const welcomeClassGrid = document.getElementById('welcome-class-grid');
const welcomeSaveSummary = document.getElementById('welcome-save-summary');

function renderWelcomeClasses() {
  welcomeClassGrid.innerHTML = '';
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
      renderWelcomeClasses();
    };
    welcomeClassGrid.appendChild(card);
  });
}

function enterWelcomeClassStep(userLabel) {
  welcomeAuthStep.classList.add('hidden');
  welcomeClassStep.classList.remove('hidden');
  welcomeSaveSummary.textContent = `${userLabel} ｜ Lv.${gameState.level}・第 ${getStageLabel(gameState.stage)} 關・魂晶 ${gameState.soulCrystals || 0}`;
  selectedLobbyClass = gameState.classId || 'warrior';
  renderWelcomeClasses();
}

function startAdventure() {
  gameState.classId = selectedLobbyClass;
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

document.getElementById('btn-start-game')?.addEventListener('click', () => {
  startAdventure();
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
  if (label) label.textContent = isAuto ? '自動' : '手動';
  if (btn) btn.classList.toggle('active', isAuto);
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
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

  if (e.code === 'Space') {
    e.preventDefault();
    battleScene?.castSkillSlot(0, true);
  } else if (e.code === 'KeyE') {
    battleScene?.castSkillSlot(1, true);
  } else if (e.code === 'KeyR') {
    battleScene?.castSkillSlot(2, true);
  } else if (e.code === 'KeyT') {
    toggleAutoMoveMode();
  } else if (e.code === 'KeyH') {
    battleScene?.usePotion(true);
  } else if (e.code === 'KeyM') {
    const wm = document.getElementById('modal-world-map');
    wm?.classList.contains('hidden') ? ui.openWorldMapModal(gameState) : wm.classList.add('hidden');
  } else if (e.code === 'KeyI') {
    ui.activeDrawer === 'gear' ? ui.closeDrawer() : ui.openDrawer('gear');
  } else if (e.code === 'KeyQ') {
    document.getElementById('btn-salvage-junk')?.click();
  } else if (e.code === 'Escape') {
    ui.closeDrawer();
    document.getElementById('modal-class')?.classList.add('hidden');
    document.getElementById('modal-world-map')?.classList.add('hidden');
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
        skillTree: { w_whirlwind: 1, r_volley: 1, m_meteor: 1, ...(cloudData.skillTree || {}) },
        equippedSkillsByClass: {
          ...base.equippedSkillsByClass,
          ...(cloudData.equippedSkillsByClass || {}),
        },
        inventory: Array.isArray(cloudData.inventory) ? cloudData.inventory : [],
      };
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
