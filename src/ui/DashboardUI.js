import { CLASSES } from './data/classes.js';
import { WARRIOR_SKILLS } from './data/warriorSkills.js';
import { RANGER_SKILLS } from './data/rangerSkills.js';
import { MAGE_SKILLS } from './data/mageSkills.js';
import { EQUIP_SLOTS, RARITIES, BASE_ITEMS } from './data/items.js';
import { getZoneName } from './data/monsters.js';
import { SKILL_BRANCHES, SKILL_TREE_NODES, isNodeUnlocked } from './data/skillTree.js';
import { calcItemPower, getSalvageReward } from './logic/lootGen.js';
import { formatNum, getExpToNext, getUpgradeCost, calcRebirthCrystals } from './logic/statCalc.js';

const STAT_LABELS = {
  atkFlat: '攻擊力',
  atkPct: '攻擊加成',
  hpFlat: '最大生命',
  hpPct: '生命加成',
  armorFlat: '護甲',
  critRate: '暴擊率',
  critDmg: '暴擊傷害',
  atkSpeedPct: '攻速',
  dodge: '閃避',
  lifesteal: '吸血',
  goldFind: '金幣掉落',
  magicFind: '掉寶率',
};

function resolveItemIcon(item) {
  if (item.icon) return item.icon;
  const list = BASE_ITEMS[item.slot] || [];
  const matched = list.find((b) => item.name.includes(b.name));
  if (matched) return matched.icon;
  return `./assets/items/${item.slot}_0.png`;
}

export class DashboardUI {
  constructor(handlers) {
    this.handlers = handlers;
    this.activeDrawer = null;
    this.selectedItemUid = null;
    this.bindDockAndDrawer();
    this.bindGlobalButtons();
  }

  bindDockAndDrawer() {
    document.querySelectorAll('.dock-btn[data-drawer]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.drawer;
        if (this.activeDrawer === target) {
          this.closeDrawer();
          return;
        }
        this.openDrawer(target);
      });
    });

    document.getElementById('btn-close-drawer')?.addEventListener('click', () => {
      this.closeDrawer();
    });
  }

  openDrawer(tabName) {
    this.activeDrawer = tabName;
    document.getElementById('rpg-drawer')?.classList.remove('hidden');

    document.querySelectorAll('.dock-btn[data-drawer]').forEach((b) => {
      b.classList.toggle('active', b.dataset.drawer === tabName);
    });
    document.querySelectorAll('.tab-panel').forEach((p) => {
      p.classList.toggle('active', p.id === `tab-${tabName}`);
    });

    const titles = {
      gear: '🛡️ 角色與裝備',
      bag: '🎒 戰利品背包',
      upgrade: '🔥 屬性強化',
      tree: '🌳 深淵技能樹',
      skills: '⚡ 技能選擇配置',
      rebirth: '🌀 深淵輪迴',
      log: '📜 戰鬥日誌',
    };
    document.getElementById('drawer-title').textContent = titles[tabName] || '';

    const insp = document.getElementById('item-inspector');
    if (insp) insp.classList.toggle('hidden', tabName !== 'gear' && tabName !== 'bag');

    if (tabName === 'bag') {
      document.getElementById('bag-dot')?.classList.add('hidden');
    }
  }

  closeDrawer() {
    this.activeDrawer = null;
    document.getElementById('rpg-drawer')?.classList.add('hidden');
    document.querySelectorAll('.dock-btn[data-drawer]').forEach((b) => b.classList.remove('active'));
  }

  markBagUpgradeDot() {
    if (this.activeDrawer !== 'bag') {
      document.getElementById('bag-dot')?.classList.remove('hidden');
    }
  }

  bindGlobalButtons() {
    document.getElementById('btn-switch-class')?.addEventListener('click', () => {
      this.openClassModal(true);
    });
    document.getElementById('btn-salvage-junk')?.addEventListener('click', () => {
      this.handlers.onSalvageAllJunk();
    });
    document.getElementById('btn-stage-prev')?.addEventListener('click', () => {
      this.handlers.onChangeStage(-1);
    });
    document.getElementById('btn-stage-next')?.addEventListener('click', () => {
      this.handlers.onChangeStage(1);
    });
  }

  openClassModal(isSwitching = false) {
    const modal = document.getElementById('modal-class');
    const grid = document.getElementById('class-select-grid');
    const closeBtn = document.getElementById('btn-close-class-modal');
    if (closeBtn) closeBtn.style.display = isSwitching ? 'inline-block' : 'none';

    grid.innerHTML = '';
    Object.values(CLASSES).forEach((cls) => {
      const card = document.createElement('div');
      card.className = 'class-card';
      card.innerHTML = `
        <img src="${cls.spritePath}" alt="${cls.name}" />
        <div class="class-name" style="color:${cls.color}">${cls.name}</div>
        <div class="class-title">${cls.title}</div>
        <p class="class-desc">${cls.desc}</p>
        <div class="class-skill"><strong>專屬技能：${cls.skill.name}</strong><br>${cls.skill.desc}</div>
        <button class="btn-primary">選擇此職業</button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        modal.classList.add('hidden');
        this.handlers.onSelectClass(cls.id);
      });
      grid.appendChild(card);
    });

    if (closeBtn) {
      closeBtn.onclick = () => modal.classList.add('hidden');
    }
    modal.classList.remove('hidden');
  }

  showOfflineModal(report, onClaim) {
    const modal = document.getElementById('modal-offline');
    const body = document.getElementById('offline-summary');
    const mins = Math.floor(report.elapsedSec / 60);
    const hrs = Math.floor(mins / 60);
    const timeStr = hrs > 0 ? `${hrs} 小時 ${mins % 60} 分鐘` : `${mins} 分鐘`;

    body.innerHTML = `
      <p>你離開了 <strong>${timeStr}</strong>，英雄在 2.5D 地下城持續自動戰鬥：</p>
      <ul class="offline-list">
        <li>擊殺怪物：<strong>${formatNum(report.kills)} 隻</strong></li>
        <li>獲得金幣：<strong style="color:#facc15">+${formatNum(report.goldEarned)}</strong></li>
        <li>獲得經驗：<strong style="color:#38bdf8">+${formatNum(report.expEarned)}</strong></li>
        <li>拾取戰利品：<strong>${report.itemsFound.length} 件</strong></li>
      </ul>
    `;
    document.getElementById('btn-claim-offline').onclick = () => {
      modal.classList.add('hidden');
      onClaim();
    };
    modal.classList.remove('hidden');
  }

  updateTopBar(state, stats) {
    const cls = CLASSES[state.classId] || CLASSES.warrior;
    document.getElementById('hud-class-badge').textContent = `${cls.name} Lv.${state.level}`;
    document.getElementById('hud-class-badge').style.borderColor = cls.color;
    document.getElementById('hud-dps').textContent = `DPS ${formatNum(stats.dps)}`;
    document.getElementById('hud-gold').textContent = formatNum(state.gold);
    document.getElementById('hud-dust').textContent = formatNum(state.dust);
    document.getElementById('hud-crystals').textContent = formatNum(state.soulCrystals || 0);

    const need = getExpToNext(state.level);
    const expPct = Math.min(100, Math.round((state.exp / need) * 100));
    document.getElementById('hud-exp-bar').style.width = `${expPct}%`;
    document.getElementById('hud-exp-text').textContent = `EXP ${formatNum(state.exp)} / ${formatNum(need)}`;

    document.getElementById('hud-stage-title').textContent = `第 ${state.stage} 關・${getZoneName(state.stage)}`;
    document.getElementById('hud-wave-badge').textContent = state.wave >= 5 ? '🔥 BOSS 圍攻' : `波次 ${state.wave} / 5`;
    document.getElementById('btn-stage-next').disabled = state.stage >= state.maxStageReached;
    document.getElementById('btn-stage-prev').disabled = state.stage <= 1;

    const spDot = document.getElementById('tree-sp-badge');
    if (spDot) {
      spDot.textContent = state.skillPoints || 0;
      spDot.classList.toggle('hidden', (state.skillPoints || 0) <= 0);
    }

    this.renderDockSkillSlots(state);
  }

  renderDockSkillSlots(state) {
    const keyLabels = ['Space', 'E', 'R'];
    const cid = state.classId || 'warrior';
    const book = cid === 'warrior' ? WARRIOR_SKILLS : (cid === 'ranger' ? RANGER_SKILLS : MAGE_SKILLS);
    const eqList = state.equippedSkillsByClass?.[cid] || [];

    for (let i = 0; i < 3; i++) {
      const btn = document.getElementById(`skill-slot-${i}`);
      if (!btn) continue;
      const iconEl = btn.querySelector('.sk-slot-img');
      const nameEl = btn.querySelector('.sk-slot-name');

      if (book) {
        const sid = eqList[i];
        const sk = sid ? book[sid] : null;
        const lvl = sk ? (state.skillTree?.[sk.treeNodeId] || 0) : 0;
        if (sk && lvl > 0) {
          iconEl.src = sk.icon;
          iconEl.classList.remove('hidden');
          nameEl.textContent = `${sk.name} [${keyLabels[i]}]`;
          btn.disabled = false;
        } else {
          iconEl.classList.add('hidden');
          nameEl.textContent = `空技能槽 [${keyLabels[i]}]`;
          btn.disabled = true;
        }
      } else {
        if (i === 0) {
          const cls = CLASSES[cid];
          iconEl.classList.add('hidden');
          nameEl.textContent = `${cls.skill.name} [Space]`;
          btn.disabled = false;
        } else {
          iconEl.classList.add('hidden');
          nameEl.textContent = `— [${keyLabels[i]}]`;
          btn.disabled = true;
        }
      }
    }
  }

  updateSkillProgress(ratios) {
    for (let i = 0; i < 3; i++) {
      const btn = document.getElementById(`skill-slot-${i}`);
      if (!btn) continue;
      const fill = btn.querySelector('.skill-cd-fill');
      const r = ratios[i] || 0;
      if (fill) fill.style.width = `${Math.round(r * 100)}%`;
      btn.classList.toggle('ready', !btn.disabled && r >= 1);
    }
  }

  renderAllPanels(state, stats) {
    this.renderGearAndStats(state, stats);
    this.renderInventory(state);
    this.renderUpgrades(state);
    this.renderSkillTree(state);
    this.renderSkillSelectPanel(state);
    this.renderRebirthPanel(state);
  }

  renderGearAndStats(state, stats) {
    const slotsEl = document.getElementById('equip-slots-grid');
    slotsEl.innerHTML = '';

    Object.values(EQUIP_SLOTS).forEach((slotMeta) => {
      const item = state.equipment[slotMeta.id];
      const card = document.createElement('div');
      card.className = `equip-slot-card ${item ? `rarity-${item.rarity}` : ''}`;

      if (item) {
        const r = RARITIES[item.rarity];
        card.style.borderColor = r.border;
        card.style.background = r.bg;
        const upgStr = item.upgradeLevel > 0 ? ` +${item.upgradeLevel}` : '';
        card.innerHTML = `
          <div class="slot-row">
            <img class="slot-item-icon" src="${resolveItemIcon(item)}" alt="${item.name}" />
            <div class="slot-info">
              <div class="slot-header">
                <span>${slotMeta.label}</span>
                <span style="color:${r.color};font-size:11px;">戰力 ${calcItemPower(item)}</span>
              </div>
              <div class="item-title" style="color:${r.color}">${item.name}${upgStr}</div>
              <div class="item-sub">${STAT_LABELS[item.baseStat.key] || item.baseStat.key} +${item.baseStat.value}</div>
            </div>
          </div>
        `;
        card.onclick = () => this.renderItemInspector(item, true, state);
      } else {
        card.innerHTML = `
          <div class="slot-header"><span>${slotMeta.icon} ${slotMeta.label}</span></div>
          <div class="item-empty">尚未裝備</div>
        `;
      }
      slotsEl.appendChild(card);
    });

    const statsEl = document.getElementById('char-stats-list');
    statsEl.innerHTML = `
      <div class="stat-row"><span>生命上限</span><strong>${formatNum(stats.maxHp)}</strong></div>
      <div class="stat-row"><span>攻擊力</span><strong>${formatNum(stats.atk)}</strong></div>
      <div class="stat-row"><span>攻擊間隔</span><strong>${(stats.atkIntervalMs / 1000).toFixed(2)}s</strong></div>
      <div class="stat-row"><span>暴擊率 / 暴傷</span><strong>${stats.critRate}% / ${stats.critDmg}%</strong></div>
      <div class="stat-row"><span>護甲 / 閃避</span><strong>${formatNum(stats.armor)} / ${stats.dodge}%</strong></div>
      <div class="stat-row"><span>攻擊吸血</span><strong>${stats.lifesteal}%</strong></div>
      <div class="stat-row"><span>移動速度</span><strong>${stats.moveSpeed}</strong></div>
      <div class="stat-row"><span>金幣 / 掉寶</span><strong>+${stats.goldFind}% / +${stats.magicFind}%</strong></div>
    `;
  }

  renderInventory(state) {
    const invCount = document.getElementById('inv-count');
    if (invCount) invCount.textContent = `${state.inventory.length}/60`;

    ['common', 'magic', 'rare'].forEach((rar) => {
      const cb = document.getElementById(`auto-salvage-${rar}`);
      if (cb) {
        cb.checked = !!state.autoSalvage[rar];
        cb.onchange = () => this.handlers.onToggleAutoSalvage(rar, cb.checked);
      }
    });

    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';

    if (state.inventory.length === 0) {
      grid.innerHTML = '<div class="empty-tip">背包目前空空如也，英雄正在努力刷怪中...</div>';
      return;
    }

    state.inventory.forEach((item) => {
      const r = RARITIES[item.rarity];
      const equipped = state.equipment[item.slot];
      const delta = calcItemPower(item) - calcItemPower(equipped);
      const cell = document.createElement('div');
      cell.className = `inv-cell rarity-${item.rarity} ${this.selectedItemUid === item.uid ? 'selected' : ''}`;
      cell.style.borderColor = r.border;
      cell.style.background = r.bg;

      const badge = delta > 0 ? '<span class="power-up">▲</span>' : (delta < 0 ? '<span class="power-down">▼</span>' : '');
      cell.innerHTML = `
        <img class="inv-item-img" src="${resolveItemIcon(item)}" alt="${item.name}" />
        <div class="inv-lvl">Lv.${item.level}</div>
        ${badge}
      `;
      cell.onclick = () => {
        this.selectedItemUid = item.uid;
        this.renderInventory(state);
        this.renderItemInspector(item, false, state);
      };
      grid.appendChild(cell);
    });
  }

  renderItemInspector(item, isEquipped, state) {
    const box = document.getElementById('item-inspector');
    if (!item) {
      box.innerHTML = '<div class="empty-tip">點擊裝備或背包物品查看詳細詞條</div>';
      return;
    }
    const r = RARITIES[item.rarity];
    const equipped = state.equipment[item.slot];
    const myPower = calcItemPower(item);
    const eqPower = calcItemPower(equipped);
    const delta = myPower - eqPower;
    const deltaHtml = isEquipped
      ? '<span style="color:#94a3b8">(目前穿戴中)</span>'
      : (delta >= 0
        ? `<span style="color:#4ade80">▲ 戰力 +${delta}</span>`
        : `<span style="color:#f87171">▼ 戰力 ${delta}</span>`);

    const upgCost = Math.round(12 * Math.pow(1.45, item.upgradeLevel || 0) + item.level * 2);
    const salvage = getSalvageReward(item);

    const affixesHtml = (item.affixes || []).map((a) =>
      `<li>+ ${a.label} ${a.value}${a.unit}</li>`
    ).join('');

    const legHtml = item.legendaryEffect
      ? `<div class="leg-effect">★ 傳奇特效【${item.legendaryEffect.name}】：${item.legendaryEffect.desc}</div>`
      : '';

    box.innerHTML = `
      <div class="insp-top">
        <img class="insp-icon-img" style="border-color:${r.border};background:${r.bg}" src="${resolveItemIcon(item)}" alt="${item.name}" />
        <div class="insp-top-text">
          <div class="insp-head" style="color:${r.color}">
            <span>[${r.label}] ${item.name}${item.upgradeLevel ? ` +${item.upgradeLevel}` : ''}</span>
            <span style="font-size:12px;">${deltaHtml}</span>
          </div>
          <div class="insp-meta">${EQUIP_SLOTS[item.slot].label} • 物品等級 ${item.level} • 戰力 ${myPower}</div>
          <div class="insp-base">基礎屬性：${STAT_LABELS[item.baseStat.key]} +${item.baseStat.value}</div>
        </div>
      </div>
      <ul class="insp-affixes">${affixesHtml || '<li style="color:#64748b">無額外詞條</li>'}</ul>
      ${legHtml}
      <div class="insp-actions">
        ${isEquipped ? '' : `<button id="insp-equip" class="btn-primary">穿戴裝備</button>`}
        <button id="insp-upgrade" class="btn-secondary">強化 (+1) 💎${upgCost}</button>
        ${isEquipped ? '' : `<button id="insp-salvage" class="btn-danger">分解 (+${salvage.gold}金 / +${salvage.dust}粉)</button>`}
      </div>
    `;

    document.getElementById('insp-equip')?.addEventListener('click', () => this.handlers.onEquipItem(item.uid));
    document.getElementById('insp-upgrade')?.addEventListener('click', () => this.handlers.onUpgradeItem(item.uid, isEquipped, upgCost));
    document.getElementById('insp-salvage')?.addEventListener('click', () => this.handlers.onSalvageItem(item.uid));
  }

  renderUpgrades(state) {
    const list = document.getElementById('gold-upgrades-list');
    const defs = [
      { key: 'atk',   name: '磨礪武器', desc: '每級基礎攻擊 +3.5' },
      { key: 'hp',    name: '強健體魄', desc: '每級最大生命 +20' },
      { key: 'crit',  name: '弱點洞悉', desc: '每級暴擊率 +1.4%' },
      { key: 'speed', name: '迅捷身法', desc: '每級攻擊速度 +3.5%' },
    ];
    list.innerHTML = '';
    defs.forEach((d) => {
      const lvl = state.upgrades[d.key] || 0;
      const cost = getUpgradeCost(d.key, lvl);
      const row = document.createElement('div');
      row.className = 'upgrade-row';
      row.innerHTML = `
        <div>
          <div class="upg-name">${d.name} <span class="upg-lvl">Lv.${lvl}</span></div>
          <div class="upg-desc">${d.desc}</div>
        </div>
        <button class="btn-primary" ${state.gold < cost ? 'disabled' : ''}>💰 ${formatNum(cost)}</button>
      `;
      row.querySelector('button').onclick = () => this.handlers.onBuyUpgrade(d.key);
      list.appendChild(row);
    });
  }

  renderSkillTree(state) {
    const box = document.getElementById('skill-tree-container');
    if (!box) return;
    const sp = state.skillPoints || 0;
    const tree = state.skillTree || {};

    let html = `
      <div class="tree-header-bar">
        <span>可用技能點：<strong style="color:#fde047;font-size:15px;">${sp}</strong>（每升 1 級 +1 點）</span>
        <button id="btn-reset-tree" class="btn-ghost">洗點重置</button>
      </div>
    `;

    SKILL_BRANCHES.forEach((br) => {
      html += `<div class="tree-branch-title" style="color:${br.color}">${br.icon} ${br.name}</div><div class="tree-nodes-grid">`;
      const nodes = SKILL_TREE_NODES.filter((n) => n.branch === br.id);
      nodes.forEach((node) => {
        const cur = tree[node.id] || 0;
        const unlocked = isNodeUnlocked(node, tree);
        const maxed = cur >= node.maxLvl;
        html += `
          <div class="tree-node-card ${unlocked ? '' : 'locked'} ${maxed ? 'maxed' : ''}">
            <div class="node-top">
              <strong>${node.name}</strong>
              <span>${cur} / ${node.maxLvl}</span>
            </div>
            <div class="node-desc">${node.desc}</div>
            <button class="btn-primary btn-node-up" data-node="${node.id}" ${!unlocked || maxed || sp <= 0 ? 'disabled' : ''}>
              ${maxed ? '已滿級' : (unlocked ? '+1 升級' : '需前置解鎖')}
            </button>
          </div>
        `;
      });
      html += '</div>';
    });

    box.innerHTML = html;
    box.querySelectorAll('.btn-node-up').forEach((btn) => {
      btn.onclick = () => this.handlers.onUpgradeSkillNode(btn.dataset.node);
    });
    document.getElementById('btn-reset-tree')?.addEventListener('click', () => {
      this.handlers.onResetSkillTree();
    });
  }

  renderSkillSelectPanel(state) {
    const box = document.getElementById('skill-select-container');
    if (!box) return;
    const cid = state.classId || 'warrior';
    const book = cid === 'warrior' ? WARRIOR_SKILLS : (cid === 'ranger' ? RANGER_SKILLS : MAGE_SKILLS);

    if (!book) {
      box.innerHTML = `<div class="empty-tip">目前「狂戰士」與「暗影遊俠」已實裝 4 大技能配置頁，秘法師將於下一階段補齊。</div>`;
      return;
    }

    const eq = state.equippedSkillsByClass?.[cid] || [];
    const keys = ['Space', 'E', 'R'];

    let slotsHtml = '<div class="section-subtitle">目前已裝備主動技能（掛機自動輪替／可按快捷鍵施放）</div><div class="equipped-skills-row">';
    for (let i = 0; i < 3; i++) {
      const sk = eq[i] ? book[eq[i]] : null;
      slotsHtml += `
        <div class="eq-sk-box">
          <div class="eq-sk-key">槽位 ${i + 1} [${keys[i]}]</div>
          ${sk
            ? `<img src="${sk.icon}" alt="${sk.name}" /><strong>${sk.name}</strong>`
            : `<span style="color:#64748b;font-size:12px;">空欄位</span>`}
        </div>
      `;
    }
    slotsHtml += '</div>';

    let listHtml = '<div class="section-subtitle">職業技能庫（需先於「🌳 技能樹」解鎖對應節點）</div><div class="skill-library-list">';
    Object.values(book).forEach((sk) => {
      const lvl = state.skillTree?.[sk.treeNodeId] || 0;
      const unlocked = lvl > 0;
      listHtml += `
        <div class="sk-lib-card ${unlocked ? '' : 'locked'}">
          <img class="sk-lib-icon" src="${sk.icon}" alt="${sk.name}" />
          <div class="sk-lib-body">
            <div class="sk-lib-head">
              <strong>${sk.name}</strong>
              <span style="color:${unlocked ? '#fde047' : '#64748b'};font-size:12px;">
                ${unlocked ? `Lv.${lvl} • 冷卻 ${(sk.cooldownMs / 1000).toFixed(1)}s` : '尚未解鎖'}
              </span>
            </div>
            <div class="sk-lib-desc">${sk.desc}</div>
            <div class="sk-lib-detail">${sk.getDetail(Math.max(1, lvl))}</div>
            <div class="sk-lib-actions">
              ${[0, 1, 2].map((sIdx) => `
                <button class="btn-secondary btn-eq-sk" data-slot="${sIdx}" data-skill="${sk.id}" ${!unlocked ? 'disabled' : ''}>
                  ${eq[sIdx] === sk.id ? `✓ 已裝槽${sIdx + 1}` : `裝入槽 ${sIdx + 1}`}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    });
    listHtml += '</div>';

    box.innerHTML = slotsHtml + listHtml;
    box.querySelectorAll('.btn-eq-sk').forEach((btn) => {
      btn.onclick = () => this.handlers.onEquipSkill(Number(btn.dataset.slot), btn.dataset.skill);
    });
  }

  renderRebirthPanel(state) {
    const box = document.getElementById('rebirth-container');
    if (!box) return;
    const gain = calcRebirthCrystals(state.maxStageReached || 1);
    const crystals = state.soulCrystals || 0;

    box.innerHTML = `
      <div class="rebirth-card">
        <h3>🌀 深淵輪迴（永久轉生）</h3>
        <p class="rebirth-desc">通關第 10 關後即可進行深淵輪迴。輪迴會重置<strong>等級、金幣、技能點與當前關卡</strong>，並<strong>保留所有已裝備與背包道具</strong>，換取永久性的深淵魂晶倍率！</p>
        <div class="rebirth-stats">
          <div>目前輪迴次數：<strong>${state.rebirthCount || 0} 次</strong></div>
          <div>持有深淵魂晶：<strong>🔮 ${formatNum(crystals)}</strong></div>
          <div>當前永久加成：<strong style="color:#4ade80">全攻防 +${crystals * 15}% / 金幣掉寶 +${crystals * 5}%</strong></div>
          <div>本次輪迴可獲得：<strong style="color:#fbbf24">+${formatNum(gain)} 🔮</strong></div>
        </div>
        <button id="btn-do-rebirth" class="btn-gold-lg" style="width:100%;" ${gain <= 0 ? 'disabled' : ''}>
          ${gain > 0 ? `🌀 立即輪迴（獲得 +${gain} 魂晶）` : '需抵達第 10 關才可輪迴'}
        </button>
      </div>
    `;

    document.getElementById('btn-do-rebirth')?.addEventListener('click', () => {
      this.handlers.onRebirth();
    });
  }

  addLog(text, type = 'normal') {
    const container = document.getElementById('log-content');
    if (!container) return;
    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const p = document.createElement('div');
    p.className = `log-entry ${type}`;
    p.textContent = `[${ts}] ${text}`;
    container.appendChild(p);
    while (container.children.length > 100) container.removeChild(container.firstChild);
    container.scrollTop = container.scrollHeight;
  }
}
