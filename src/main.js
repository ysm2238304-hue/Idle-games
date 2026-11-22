import { CLASSES } from './data/classes.js';
import { getStageLabel, getSubStage } from './data/monsters.js';
import { WARRIOR_SKILLS } from './data/warriorSkills.js';
import { RANGER_SKILLS } from './data/rangerSkills.js';
import { MAGE_SKILLS } from './data/mageSkills.js';
import { PALADIN_SKILLS } from './data/paladinSkills.js';
import { NECRO_SKILLS } from './data/necroSkills.js';
import { ASSASSIN_SKILLS } from './data/assassinSkills.js';
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
import { TownScene } from './scenes/TownScene.js';
import { DashboardUI } from './ui/DashboardUI.js';

let gameState = loadGame() || createInitialState('warrior');
let computedStats = recalcPlayerStats(gameState);
let phaserGame = null;
let battleScene = null;
let townScene = null;
let isInTown = false;
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
    const targets = new Set(['common', 'magic', 'rare', 'legendary'].filter((r) => gameState.autoSalvage?.[r]));
    if (targets.size === 0) { targets.add('common'); targets.add('magic'); }
    let count = 0, totalGold = 0, totalDust = 0;
    gameState.inventory = gameState.inventory.filter((item) => {
      if (targets.has(item.rarity)) {
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
    gameState.inventory = gameState.inventory.filter((item) => {
      if (targets.has(item.rarity)) {
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
    ui.addLog(`傳送至第 ${getStageLabel(target)} 關刷寶。`, 'system');
    refreshStatsAndUI();
    if (battleScene) battleScene.spawnWaveSquad();
    persistAll(true);
  },

  onChangeStage: (delta) => {
    const target = Math.max(1, Math.min(100, gameState.stage + delta));
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
  const expBuffMult = ((gameState.potionBuffs?.expUntil || 0) > Date.now()) ? 1.5 : 1.0;
  const gained = Math.round(amount * (computedStats.expMult || 1) * expBuffMult);
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
      onMonsterKilled: (mob, waveCleared) => {
        const goldGain = Math.round(mob.gold * (1 + computedStats.goldFind / 100));
        gameState.gold += goldGain;
        gameState.kills += 1;
        if (mob.isBoss) {
          if (!gameState.bountyProgress) gameState.bountyProgress = { bossKills: 0, claimed: {} };
          gameState.bountyProgress.bossKills = (gameState.bountyProgress.bossKills || 0) + 1;
        }
        grantExp(mob.exp);

        const dropped = generateLoot(mob.stage, mob.isBoss, computedStats.magicFind, false, gameState.classId);
        const keptItem = handleLootDrop(dropped);

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
        return { item: keptItem || dropped, potion: droppedPotion };
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
    battleScene?.setPaused(false);
    requestAnimationFrame(() => phaserGame?.scale?.refresh());
  });
}


function enterTown(chapterIdx = 0) {
  if (!phaserGame) return;
  isInTown = true;
  battleScene?.setPaused(true);
  phaserGame.scene.sleep('BattleScene');
  const townCallbacks = {
    getState: () => gameState,
    getComputedStats: () => computedStats,
    onHudUpdate: (data) => ui.renderMinimap(data.minimap),
    onTownAction: (action, data) => {
      if (action === 'drawer_upgrade') ui.openDrawer('upgrade');
      else if (action === 'drawer_bag') ui.openDrawer('bag');
      else if (action === 'drawer_skills') ui.openDrawer('skills');
      else if (action === 'drawer_rebirth') ui.openDrawer('rebirth');
      else if (action === 'gimmick_beacon') {
        if (!gameState.potionBuffs) gameState.potionBuffs = {};
        gameState.potionBuffs.beaconUntil = Date.now() + 300000;
        ui.addLog('🔥 點燃曙光烽火台！獲得 5 分鐘「曙光祝福」（攻擊/防禦/掉寶 +15%）！', 'victory');
        refreshStatsAndUI();
        persistAll();
      } else {
        ui.openTownFacilityModal(action, data, {
          onBrewPotion: (brewId) => {
            const prices = { hp_refill: 150, exp_pot: 300, fury_pot: 400, mf_pot: 450 };
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
            }
            refreshStatsAndUI();
            persistAll(true);
          },
          onGambleGear: (cost, highTier) => {
            if ((gameState.gold || 0) < cost) return;
            gameState.gold -= cost;
            const stg = Math.max(1, gameState.maxStageReached || gameState.stage || 1);
            const item = generateLoot(stg, highTier, highTier ? 280 : 60, false, gameState.classId);
            handleLootDrop(item);
            refreshStatsAndUI();
            persistAll();
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
    phaserGame.scene.wake('TownScene', { chapterIdx, callbacks: townCallbacks });
    townScene?.syncHeroAppearance?.();
  } else {
    phaserGame.scene.launch('TownScene', { chapterIdx, callbacks: townCallbacks });
  }
  const btn = document.getElementById('btn-town-toggle');
  if (btn) {
    btn.textContent = '⚔️ 出城戰鬥 (G)';
    btn.classList.add('in-town');
  }
  ui.addLog('🏰 已傳送至第 1 章主城「曙光哨站堡壘」（安全區）', 'system');
}

function exitTownToBattle() {
  if (!phaserGame || !isInTown) return;
  isInTown = false;
  phaserGame.scene.sleep('TownScene');
  phaserGame.scene.wake('BattleScene');
  battleScene?.setPaused(false);
  const btn = document.getElementById('btn-town-toggle');
  if (btn) {
    btn.textContent = '🏰 返回主城 (G)';
    btn.classList.remove('in-town');
  }
  ui.addLog('⚔️ 已離開主城重返前線戰鬥！', 'system');
}

document.getElementById('btn-town-toggle')?.addEventListener('click', () => {
  if (isInTown) exitTownToBattle();
  else enterTown(0);
});

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
  } else if (e.code === 'KeyB') {
    ui.activeDrawer === 'bag' ? ui.closeDrawer() : ui.openDrawer('bag');
  } else if (e.code === 'KeyU') {
    ui.activeDrawer === 'upgrade' ? ui.closeDrawer() : ui.openDrawer('upgrade');
  } else if (e.code === 'KeyK') {
    ui.activeDrawer === 'tree' ? ui.closeDrawer() : ui.openDrawer('tree');
  } else if (e.code === 'KeyN') {
    ui.activeDrawer === 'skills' ? ui.closeDrawer() : ui.openDrawer('skills');
  } else if (e.code === 'KeyV') {
    ui.activeDrawer === 'rebirth' ? ui.closeDrawer() : ui.openDrawer('rebirth');
  } else if (e.code === 'KeyC') {
    const cm = document.getElementById('modal-class');
    cm?.classList.contains('hidden') ? ui.openClassModal(gameState) : cm.classList.add('hidden');
  } else if (e.code === 'KeyG') {
    if (isInTown) exitTownToBattle(); else enterTown(0);
  } else if (e.code === 'KeyL') {
    ui.activeDrawer === 'log' ? ui.closeDrawer() : ui.openDrawer('log');
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
        skillTree: { w_whirlwind: 1, r_volley: 1, m_meteor: 1, p_hammer: 1, n_skeleton: 1, a_blitz: 1, ...(cloudData.skillTree || {}) },
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
