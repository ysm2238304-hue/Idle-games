import { CLASSES } from '../data/classes.js';
import { WARRIOR_SKILLS } from '../data/warriorSkills.js';
import { RANGER_SKILLS } from '../data/rangerSkills.js';
import { MAGE_SKILLS } from '../data/mageSkills.js';
import { PALADIN_SKILLS } from '../data/paladinSkills.js';
import { NECRO_SKILLS } from '../data/necroSkills.js';
import { ASSASSIN_SKILLS } from '../data/assassinSkills.js';
import { EQUIP_SLOTS, CLASS_REQ_LABELS, RARITIES, BASE_ITEMS } from '../data/items.js';
import { STAGE_ZONES, getZoneName, getStageLabel, getSubStage, getChapterIdx } from '../data/monsters.js';
import { CLASS_BUILD_INFO, SKILL_TREE_NODES, getTreeSpentPoints, isNodeBlockedByMutex, isNodeUnlocked } from '../data/skillTree.js';
import { calcItemPower, getSalvageReward } from '../logic/lootGen.js';
import { formatNum, getExpToNext, getUpgradeCost, calcRebirthCrystals } from '../logic/statCalc.js';

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
  bleedDmgPct: '流血增傷',
  skillRadiusPct: '技能範圍',
  stunDmgPct: '對暈眩增傷',
  armorToAtkPct: '護甲轉攻擊',
  moveSpeedPct: '移動速度',
  pierceDmgPct: '穿透箭增傷',
  markCritDmgPct: '對印記暴傷',
  dodgeHealPct: '閃避回血',
  maxMpFlat: '最大魔力',
  mpRegenFlat: '每秒回魔',
  cdrPct: '冷卻縮減',
  chillDmgPct: '對冰寒增傷',
  holyDmgPct: '聖光增傷',
  thornsPct: '格檔反傷',
  stunDurPct: '暈眩延長',
  blockHealPct: '聖盾回血',
  summonDmgPct: '召喚物增傷',
  boneDmgPct: '白骨增傷',
  corpseRadiusPct: '屍爆範圍',
  killEssence: '擊殺回魂',
  poisonDmgPct: '劇毒增傷',
  comboCritDmgPct: '連擊暴傷',
  dodgeShadow: '閃避回影能',
  moveAtkSpdPct: '移動攻速',
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
    this.activeSkillTreeTab = null;
    this.activeLogFilter = 'all';
    this.bindDockAndDrawer();
    this.bindGlobalButtons();
    this.bindHotbarTooltips();
  }

  bindDockAndDrawer() {
    document.querySelectorAll('[data-drawer]').forEach((btn) => {
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

    document.querySelectorAll('[data-drawer]').forEach((b) => {
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
    document.querySelectorAll('[data-drawer]').forEach((b) => b.classList.remove('active'));
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
    document.getElementById('btn-sell-junk')?.addEventListener('click', () => {
      this.handlers.onSellSelectedJunk();
    });
    document.getElementById('btn-auto-equip')?.addEventListener('click', () => {
      this.handlers.onAutoEquipBest();
    });
    document.getElementById('btn-sort-bag')?.addEventListener('click', () => {
      this.handlers.onSortBag();
    });
    document.getElementById('btn-stage-prev')?.addEventListener('click', () => {
      this.handlers.onChangeStage(-1);
    });
    document.getElementById('btn-stage-next')?.addEventListener('click', () => {
      this.handlers.onChangeStage(1);
    });
    document.getElementById('btn-quick-salvage')?.addEventListener('click', () => {
      this.handlers.onSalvageAllJunk();
    });
    document.getElementById('btn-toggle-tracker')?.addEventListener('click', (e) => {
      const body = document.getElementById('tracker-body');
      if (!body) return;
      const col = body.classList.toggle('collapsed');
      e.currentTarget.textContent = col ? '▸' : '▾';
    });
    document.getElementById('btn-toggle-flog')?.addEventListener('click', (e) => {
      const entries = document.getElementById('floating-log-entries');
      if (!entries) return;
      const col = entries.classList.toggle('collapsed');
      e.currentTarget.textContent = col ? '▸' : '▾';
    });
    document.querySelectorAll('.flog-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        this.activeLogFilter = tab.dataset.logfilter || 'all';
        document.querySelectorAll('.flog-tab').forEach((t) => t.classList.toggle('active', t === tab));
        this.applyFloatingLogFilter();
      });
    });
  }


  openWorldMapModal(state) {
    const modal = document.getElementById('modal-world-map');
    const pinsEl = document.getElementById('world-map-pins');
    if (!modal || !pinsEl) return;

    const coords = [
      [21, 19], [49, 17], [19, 50], [39, 44], [57, 38],
      [83, 30], [21, 80], [44, 80], [64, 77], [85, 78],
    ];
    let selectedCh = getChapterIdx(state.stage || 1);
    const maxStage = state.maxStageReached || 1;
    const maxCh = getChapterIdx(maxStage);

    const renderPinsAndSubs = () => {
      pinsEl.innerHTML = '';
      STAGE_ZONES.forEach((zName, chIdx) => {
        const [px, py] = coords[chIdx];
        const unlocked = true;
        const btn = document.createElement('button');
        btn.className = `map-pin ${chIdx === selectedCh ? 'active' : ''}`;
        btn.style.left = `${px}%`;
        btn.style.top = `${py}%`;
        btn.disabled = !unlocked;
        btn.textContent = unlocked ? `第${chIdx + 1}章・${zName}` : `🔒 第${chIdx + 1}章`;
        btn.onclick = () => {
          selectedCh = chIdx;
          renderPinsAndSubs();
        };
        pinsEl.appendChild(btn);
      });

      const panel = document.getElementById('world-substage-panel');
      if (!panel) return;
      const zName = STAGE_ZONES[selectedCh];
      panel.innerHTML = `
        <div style="border-bottom:1px solid #3a2e1a;padding-bottom:8px;">
          <div style="font-size:16px;font-weight:900;color:#fde68a;">第 ${selectedCh + 1} 章・${zName}</div>
          <div style="font-size:12px;color:#94a3b8;">選擇已解鎖小關傳送開刷（每小關皆有小王）</div>
        </div>
        <div class="substage-grid" id="substage-grid-inner"></div>
      `;
      const grid = document.getElementById('substage-grid-inner');
      for (let sub = 1; sub <= 10; sub++) {
        const stNum = selectedCh * 10 + sub;
        const unlocked = true;
        const isCur = stNum === state.stage;
        const b = document.createElement('button');
        b.className = `substage-btn ${isCur ? 'current' : ''}`;
        b.disabled = !unlocked;
        b.innerHTML = `
          <strong style="color:${sub === 10 ? '#fb923c' : '#fde68a'};font-size:13px;">
            ${selectedCh + 1}-${sub} ${sub === 10 ? '💀 章節首領' : '🔥 菁英小王'}
          </strong>
          <small style="color:#94a3b8;font-size:11px;">${unlocked ? (isCur ? '目前所在關卡' : '點擊傳送開刷') : '尚未解鎖'}</small>
        `;
        b.onclick = () => {
          modal.classList.add('hidden');
          this.handlers.onJumpStage(stNum);
        };
        grid.appendChild(b);
      }
    };

    renderPinsAndSubs();
    document.getElementById('btn-close-world-map').onclick = () => modal.classList.add('hidden');
    modal.classList.remove('hidden');
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
      <p>你離開了 <strong>${timeStr}</strong>，英雄在 深淵戰場持續自動戰鬥：</p>
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
    const avatarEl = document.getElementById('hud-hero-avatar');
    if (avatarEl && cls.spritePath) avatarEl.src = cls.spritePath;
    const miniMpBar = document.querySelector('.mini-bar.mp');
    if (miniMpBar) {
      miniMpBar.classList.toggle('warrior', state.classId === 'warrior');
      miniMpBar.classList.toggle('ranger', state.classId === 'ranger');
      miniMpBar.classList.toggle('paladin', state.classId === 'paladin');
      miniMpBar.classList.toggle('necro', state.classId === 'necro');
      miniMpBar.classList.toggle('assassin', state.classId === 'assassin');
    }
    const zoneEl = document.getElementById('minimap-zone-name');
    if (zoneEl) zoneEl.textContent = getZoneName(state.stage);
    document.getElementById('hud-class-badge').textContent = `${cls.name} 等級 ${state.level}`;
    document.getElementById('hud-class-badge').style.borderColor = cls.color;
    document.getElementById('hud-dps').textContent = `秒傷 ${formatNum(stats.dps)}`;
    document.getElementById('hud-gold').textContent = formatNum(state.gold);
    document.getElementById('hud-dust').textContent = formatNum(state.dust);
    document.getElementById('hud-crystals').textContent = formatNum(state.soulCrystals || 0);

    const need = getExpToNext(state.level);
    const expPct = Math.min(100, Math.round((state.exp / need) * 100));
    const fillEl = document.getElementById('diablo-exp-fill');
    const txtEl = document.getElementById('diablo-exp-text');
    if (fillEl) fillEl.style.width = `${expPct}%`;
    if (txtEl) txtEl.textContent = `等級 ${state.level} • 經驗 ${formatNum(state.exp)} / ${formatNum(need)} (${expPct}%)`;

    const sLabel = getStageLabel(state.stage);
    const sub = getSubStage(state.stage);
    document.getElementById('hud-stage-title').textContent = `第 ${sLabel} 關・${getZoneName(state.stage)}`;
    document.getElementById('hud-wave-badge').textContent = `難度 ${state.stage} 階`;
    document.getElementById('btn-stage-next').disabled = state.stage >= 100;
    document.getElementById('btn-stage-prev').disabled = state.stage <= 1;

    const spDot = document.getElementById('tree-sp-badge');
    if (spDot) {
      spDot.textContent = state.skillPoints || 0;
      spDot.classList.toggle('hidden', (state.skillPoints || 0) <= 0);
    }

    const mpOrb = document.getElementById('orb-mp');
    const mpLbl = document.getElementById('orb-mp-label');
    if (mpOrb) {
      mpOrb.classList.toggle('orb-warrior', state.classId === 'warrior');
      mpOrb.classList.toggle('orb-ranger', state.classId === 'ranger');
      mpOrb.classList.toggle('orb-paladin', state.classId === 'paladin');
      mpOrb.classList.toggle('orb-necro', state.classId === 'necro');
      mpOrb.classList.toggle('orb-assassin', state.classId === 'assassin');
      mpOrb.title = state.classId === 'warrior' ? '怒氣值' : (state.classId === 'ranger' ? '精力值' : (state.classId === 'paladin' ? '聖能值' : (state.classId === 'necro' ? '魂能值' : (state.classId === 'assassin' ? '影能值' : '魔力值'))));
    }
    if (mpLbl) {
      mpLbl.textContent = state.classId === 'warrior' ? '怒氣' : (state.classId === 'ranger' ? '精力' : (state.classId === 'paladin' ? '聖能' : (state.classId === 'necro' ? '魂能' : (state.classId === 'assassin' ? '影能' : '魔力'))));
    }
    this.renderDockSkillSlots(state);
  }


  updateVitals({ hp, maxHp, mp, maxMp, potions, maxPotions }) {
    const buffWrap = document.getElementById('hud-potion-buffs');
    if (buffWrap && this.getState) {
      const b = this.getState().potionBuffs || {};
      const nowTs = Date.now();
      const pills = [];
      if ((b.expUntil || 0) > nowTs) pills.push(`<span class="potion-buff-pill">🟡 經驗+50% ${Math.ceil((b.expUntil - nowTs)/1000)}s</span>`);
      if ((b.furyUntil || 0) > nowTs) pills.push(`<span class="potion-buff-pill fury">🟣 狂暴 ${Math.ceil((b.furyUntil - nowTs)/1000)}s</span>`);
      if ((b.mfUntil || 0) > nowTs) pills.push(`<span class="potion-buff-pill mf">🟢 尋寶 ${Math.ceil((b.mfUntil - nowTs)/1000)}s</span>`);
      buffWrap.innerHTML = pills.join('');
    }
    const hpPct = Math.max(0, Math.min(100, (hp / Math.max(1, maxHp)) * 100));
    const mpPct = Math.max(0, Math.min(100, (mp / Math.max(1, maxMp)) * 100));
    const hpFill = document.getElementById('orb-hp-fill');
    const hpTxt = document.getElementById('orb-hp-text');
    const hpOrb = document.getElementById('orb-hp');
    const mpFill = document.getElementById('orb-mp-fill');
    const mpTxt = document.getElementById('orb-mp-text');
    const potTxt = document.getElementById('potion-count');
    const potBtn = document.getElementById('btn-potion');
    if (hpFill) hpFill.style.height = `${hpPct.toFixed(1)}%`;
    if (hpTxt) hpTxt.textContent = `${formatNum(hp)} / ${formatNum(maxHp)}`;
    if (hpOrb) hpOrb.classList.toggle('low-hp', hpPct > 0 && hpPct < 35);
    if (mpFill) mpFill.style.height = `${mpPct.toFixed(1)}%`;
    if (mpTxt) mpTxt.textContent = `${formatNum(mp)} / ${formatNum(maxMp)}`;
    const mHpFill = document.getElementById('mini-hp-fill');
    const mHpTxt = document.getElementById('mini-hp-text');
    const mMpFill = document.getElementById('mini-mp-fill');
    const mMpTxt = document.getElementById('mini-mp-text');
    if (mHpFill) mHpFill.style.width = `${hpPct.toFixed(1)}%`;
    if (mHpTxt) mHpTxt.textContent = `${formatNum(hp)} / ${formatNum(maxHp)}`;
    if (mMpFill) mMpFill.style.width = `${mpPct.toFixed(1)}%`;
    if (mMpTxt) mMpTxt.textContent = `${formatNum(mp)} / ${formatNum(maxMp)}`;
    if (potTxt) potTxt.textContent = `${potions}`;
    if (potBtn) potBtn.disabled = potions <= 0;
  }

  collectItemStatMap(item) {
    const map = {};
    if (!item) return map;
    const upgMult = 1 + (item.upgradeLevel || 0) * 0.12;
    if (item.baseStat) {
      map[item.baseStat.key] = (map[item.baseStat.key] || 0) + Math.round(item.baseStat.value * upgMult);
    }
    for (const af of item.affixes || []) {
      map[af.key] = (map[af.key] || 0) + Math.round(af.value * upgMult * 10) / 10;
    }
    return map;
  }

  showCompareTooltip(e, item, isEquipped, state) {
    const tt = document.getElementById('diablo-tooltip');
    if (!tt || !item) return;
    const r = RARITIES[item.rarity];
    const eq = state.equipment[item.slot];
    const pwr = calcItemPower(item);
    const eqPwr = calcItemPower(eq);

    const reqKey = item.classReq || 'all';
    const reqInfo = CLASS_REQ_LABELS[reqKey] || CLASS_REQ_LABELS.all;
    const canWear = reqKey === 'all' || reqKey === (state.classId || 'warrior');
    const affixesHtml = (item.affixes || []).map((a) =>
      `<div class="tt-affix">+ ${a.label} ${a.value}${a.unit}</div>`
    ).join('');

    let diffHtml = '';
    if (!isEquipped) {
      const myMap = this.collectItemStatMap(item);
      const eqMap = this.collectItemStatMap(eq);
      const keys = new Set([...Object.keys(myMap), ...Object.keys(eqMap)]);
      const lines = [];
      const pDiff = pwr - eqPwr;
      if (pDiff !== 0) {
        lines.push(`<div class="${pDiff > 0 ? 'tt-up' : 'tt-down'}">${pDiff > 0 ? '▲' : '▼'} 戰力 ${pDiff > 0 ? '+' : ''}${pDiff}</div>`);
      }
      keys.forEach((k) => {
        const d = Math.round(((myMap[k] || 0) - (eqMap[k] || 0)) * 10) / 10;
        if (d !== 0) {
          lines.push(`<div class="${d > 0 ? 'tt-up' : 'tt-down'}">${d > 0 ? '▲' : '▼'} ${STAT_LABELS[k] || k} ${d > 0 ? '+' : ''}${d}</div>`);
        }
      });
      diffHtml = `<div class="tt-diff">與目前裝備對比：${lines.join('') || '<div style="color:#94a3b8">屬性相同</div>'}</div>`;
    }

    tt.innerHTML = `
      <div class="tt-title" style="color:${r.color}">[${r.label}] ${item.name}${item.upgradeLevel ? ` +${item.upgradeLevel}` : ''}</div>
      <div class="tt-meta">${item.subType || EQUIP_SLOTS[item.slot].label} • ${item.level} 級 • 戰力 ${pwr} <span style="color:${canWear ? reqInfo.color : '#ef4444'};font-weight:700;">[${reqInfo.label}]</span></div>
      <div class="tt-affix" style="color:#fde68a;">基礎：${STAT_LABELS[item.baseStat.key] || item.baseStat.key} +${item.baseStat.value}</div>
      ${affixesHtml}
      ${item.legendaryEffect ? `<div style="color:#fb923c;margin-top:4px;font-size:11px;">★ ${item.legendaryEffect.name}：${item.legendaryEffect.desc}</div>` : ''}
      ${diffHtml}
    `;
    tt.style.borderColor = r.border;
    tt.classList.remove('hidden');
    this.moveCompareTooltip(e);
  }

  moveCompareTooltip(e) {
    const tt = document.getElementById('diablo-tooltip');
    if (!tt || tt.classList.contains('hidden')) return;
    const x = Math.min(window.innerWidth - 280, e.clientX + 16);
    const y = Math.min(window.innerHeight - tt.offsetHeight - 16, Math.max(12, e.clientY - 20));
    tt.style.left = `${x}px`;
    tt.style.top = `${y}px`;
  }

  hideCompareTooltip() {
    document.getElementById('diablo-tooltip')?.classList.add('hidden');
  }

  bindHotbarTooltips() {
    document.querySelectorAll('[data-tip]').forEach((el) => {
      el.addEventListener('mouseenter', (e) => {
        const tt = document.getElementById('diablo-tooltip');
        if (!tt) return;
        tt.innerHTML = `<div style="color:#fde68a;font-weight:700;">${el.dataset.tip}</div>`;
        tt.style.borderColor = '#c89b3c';
        tt.classList.remove('hidden');
        this.moveCompareTooltip(e);
      });
      el.addEventListener('mousemove', (e) => this.moveCompareTooltip(e));
      el.addEventListener('mouseleave', () => this.hideCompareTooltip());
    });
  }

  renderDockSkillSlots(state) {
    const keyLabels = ['Space', 'E', 'R'];
    const cid = state.classId || 'warrior';
    const book = cid === 'warrior' ? WARRIOR_SKILLS : (cid === 'ranger' ? RANGER_SKILLS : (cid === 'paladin' ? PALADIN_SKILLS : (cid === 'necro' ? NECRO_SKILLS : (cid === 'assassin' ? ASSASSIN_SKILLS : MAGE_SKILLS))));
    const eqList = state.equippedSkillsByClass?.[cid] || [];

    for (let i = 0; i < 3; i++) {
      const btn = document.getElementById(`skill-slot-${i}`);
      if (!btn) continue;
      const iconEl = btn.querySelector('.sk-slot-img');
      const plusEl = btn.querySelector('.mmo-empty-plus');
      const mpEl = btn.querySelector('.mmo-mp-cost');

      const sid = eqList[i];
      const sk = sid ? book[sid] : null;
      const lvl = sk ? (state.skillTree?.[sk.treeNodeId] || 0) : 0;
      if (sk && lvl > 0) {
        const mpCost = (sid === 'bladestorm' || sid === 'phantombow' || sid === 'void_beam') ? 26 : 18;
        iconEl.src = sk.icon;
        iconEl.classList.remove('hidden');
        if (plusEl) plusEl.classList.add('hidden');
        if (mpEl) mpEl.textContent = `${mpCost}`;
        btn.disabled = false;
        btn.onmouseenter = (e) => {
          const tt = document.getElementById('diablo-tooltip');
          if (!tt) return;
          tt.innerHTML = `
            <div class="tt-title" style="color:#fde047">${sk.name} [${keyLabels[i]}]</div>
            <div class="tt-meta">等級 ${lvl} • 冷卻 ${(sk.cooldownMs / 1000).toFixed(1)}s • 消耗 ${mpCost} ${cid === 'warrior' ? '能量' : (cid === 'ranger' ? '精力' : 'MP')}</div>
            <div class="tt-affix">${sk.getDetail(lvl)}</div>
          `;
          tt.style.borderColor = '#e0a63b';
          tt.classList.remove('hidden');
          this.moveCompareTooltip(e);
        };
        btn.onmousemove = (e) => this.moveCompareTooltip(e);
        btn.onmouseleave = () => this.hideCompareTooltip();
      } else {
        iconEl.classList.add('hidden');
        if (plusEl) plusEl.classList.remove('hidden');
        if (mpEl) mpEl.textContent = '';
        btn.disabled = true;
        btn.onmouseenter = (e) => {
          const tt = document.getElementById('diablo-tooltip');
          if (!tt) return;
          tt.innerHTML = `<div style="color:#94a3b8;">空技能槽 [${keyLabels[i]}]：請至「⚡ 技能頁 [6]」裝備技能</div>`;
          tt.style.borderColor = '#475569';
          tt.classList.remove('hidden');
          this.moveCompareTooltip(e);
        };
        btn.onmousemove = (e) => this.moveCompareTooltip(e);
        btn.onmouseleave = () => this.hideCompareTooltip();
      }
    }
  }

  updateSkillProgress(ratios, cdDetails = []) {
    for (let i = 0; i < 3; i++) {
      const btn = document.getElementById(`skill-slot-${i}`);
      if (!btn) continue;
      const curtain = btn.querySelector('.mmo-cd-curtain');
      const secEl = btn.querySelector('.mmo-cd-sec');
      const det = cdDetails[i];
      const r = det ? det.ratio : (ratios[i] || 0);
      if (curtain) curtain.style.height = btn.disabled ? '0%' : `${Math.round((1 - r) * 100)}%`;
      if (secEl) {
        secEl.textContent = (!btn.disabled && det && det.remMs > 80) ? `${(det.remMs / 1000).toFixed(1)}` : '';
      }
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
    const dollEl = document.getElementById('paper-doll-stage');
    if (dollEl) {
      dollEl.innerHTML = '';
      const cls = CLASSES[state.classId] || CLASSES.warrior;
      const layout = [
        { type: 'slot', id: 'weapon' },
        { type: 'slot', id: 'helm' },
        { type: 'slot', id: 'amulet' },
        { type: 'slot', id: 'armor' },
        { type: 'crest' },
        { type: 'slot', id: 'ring' },
        { type: 'empty' },
        { type: 'slot', id: 'boots' },
        { type: 'empty' },
      ];
      layout.forEach((cell) => {
        if (cell.type === 'crest') {
          const crest = document.createElement('div');
          crest.className = 'doll-center-crest';
          crest.innerHTML = `<img src="${cls.spritePath}" alt="${cls.name}" /><span style="color:${cls.color}">${cls.name}</span>`;
          dollEl.appendChild(crest);
        } else if (cell.type === 'empty') {
          const emp = document.createElement('div');
          dollEl.appendChild(emp);
        } else {
          const slotMeta = EQUIP_SLOTS[cell.id];
          const item = state.equipment[cell.id];
          const box = document.createElement('div');
          box.className = 'doll-slot';
          if (item) {
            const r = RARITIES[item.rarity];
            box.style.borderColor = r.border;
            box.style.background = r.bg;
            box.style.boxShadow = `inset 0 0 10px ${r.border}44`;
            const upgStr = item.upgradeLevel > 0 ? ` +${item.upgradeLevel}` : '';
            box.innerHTML = `
              <img src="${resolveItemIcon(item)}" alt="${item.name}" />
              <div class="doll-name" style="color:${r.color}">${item.name}${upgStr}</div>
            `;
            box.onclick = () => this.renderItemInspector(item, true, state);
            box.onmouseenter = (e) => this.showCompareTooltip(e, item, true, state);
            box.onmousemove = (e) => this.moveCompareTooltip(e);
            box.onmouseleave = () => this.hideCompareTooltip();
          } else {
            box.innerHTML = `<span style="font-size:18px;opacity:0.5;">${slotMeta.icon}</span><div class="doll-lbl">${slotMeta.label}</div>`;
          }
          dollEl.appendChild(box);
        }
      });
    }

    const statsEl = document.getElementById('char-stats-list');
    statsEl.innerHTML = `
      <div class="stat-row"><span>生命 / 魔力上限</span><strong>${formatNum(stats.maxHp)} / ${formatNum(stats.maxMp || 100)}</strong></div>
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
    if (invCount) invCount.textContent = `${state.inventory.length}`;

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
        <div class="inv-lvl">${item.level}級</div>
        ${badge}
      `;
      cell.onclick = () => {
        this.selectedItemUid = item.uid;
        this.renderInventory(state);
        this.renderItemInspector(item, false, state);
      };
      cell.ondblclick = () => {
        this.hideCompareTooltip();
        this.handlers.onEquipItem(item.uid);
      };
      cell.onmouseenter = (e) => this.showCompareTooltip(e, item, false, state);
      cell.onmousemove = (e) => this.moveCompareTooltip(e);
      cell.onmouseleave = () => this.hideCompareTooltip();
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

    const reqKey = item.classReq || 'all';
    const reqInfo = CLASS_REQ_LABELS[reqKey] || CLASS_REQ_LABELS.all;
    const canWear = reqKey === 'all' || reqKey === (state.classId || 'warrior');
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
          <div class="insp-meta">${item.subType || EQUIP_SLOTS[item.slot].label} • ${item.level} 級 • 戰力 ${myPower} • <span style="color:${canWear ? reqInfo.color : '#ef4444'};font-weight:700;">${reqInfo.label}</span></div>
          <div class="insp-base">基礎屬性：${STAT_LABELS[item.baseStat.key]} +${item.baseStat.value}</div>
        </div>
      </div>
      <ul class="insp-affixes">${affixesHtml || '<li style="color:#64748b">無額外詞條</li>'}</ul>
      ${legHtml}
      <div class="insp-actions">
        ${isEquipped ? '' : `<button id="insp-equip" class="btn-primary" ${!canWear ? 'disabled' : ''}>${canWear ? '穿戴裝備' : '職業不符'}</button>`}
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
          <div class="upg-name">${d.name} <span class="upg-lvl">等級 ${lvl}</span></div>
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
    const curTreeId = this.activeSkillTreeTab || state.classId || 'warrior';
    const meta = CLASS_BUILD_INFO[curTreeId] || CLASS_BUILD_INFO.warrior;
    const spentHere = getTreeSpentPoints(curTreeId, tree);
    const nodes = SKILL_TREE_NODES.filter((n) => n.tree === curTreeId);

    const tabsHtml = Object.entries(CLASS_BUILD_INFO).map(([tid, info]) => `
      <button class="d4-tab-btn ${tid === curTreeId ? 'active' : ''}" data-tree-tab="${tid}">
        ${info.name}
      </button>
    `).join('');

    const tierLines = curTreeId === 'shared'
      ? [{ y: 4, pts: 0, label: 'T1' }, { y: 28, pts: 0, label: 'T2' }, { y: 52, pts: 0, label: 'T3' }, { y: 76, pts: 0, label: 'T4' }]
      : [
          { y: 2, pts: 0, label: 'T1 核心' },
          { y: 17, pts: 3, label: 'T2 雙流派 (需3點)' },
          { y: 33, pts: 7, label: 'T3 互斥改造 (需7點)' },
          { y: 49, pts: 12, label: 'T4 進階戰技 (需12點)' },
          { y: 66, pts: 17, label: 'T5 終極奧義 (需17點)' },
          { y: 83, pts: 22, label: 'T6 關鍵被動 (需22點)' },
        ];

    const tiersHtml = tierLines.map((tl) => {
      const open = spentHere >= tl.pts;
      return `<div class="d4-tier-line" style="top:${tl.y}%;"><span class="d4-tier-tag ${open ? 'open' : ''}">${open ? '✓' : '🔒'} ${tl.label}</span></div>`;
    }).join('');

    const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));
    const linesSvg = nodes.filter((n) => n.req && nodeMap[n.req.id]).map((n) => {
      const p = nodeMap[n.req.id];
      const active = (tree[n.id] || 0) > 0;
      const unlocked = isNodeUnlocked(n, tree);
      const stroke = active ? meta.color : (unlocked ? '#fde047' : '#334155');
      const dash = active ? '' : 'stroke-dasharray="1.6 1.2"';
      return `<line x1="${p.x}" y1="${p.y}" x2="${n.x}" y2="${n.y}" stroke="${stroke}" stroke-width="${active ? '0.85' : '0.45'}" ${dash} opacity="${active ? '0.95' : '0.65'}" />`;
    }).join('');

    box.innerHTML = `
      <div class="tree-header-bar">
        <span>可用技能點：<strong style="color:#fde047;font-size:15px;">${sp}</strong>（升級+1／首領+1）｜ 本星圖投入：<strong>${spentHere}</strong></span>
        <button id="btn-reset-tree" class="btn-ghost">洗點重置</button>
      </div>
      <div class="d4-tree-tabs">${tabsHtml}</div>
      <div class="d4-build-legend">
        <span style="color:${meta.buildA.color}">◀ ${meta.buildA.name}</span>
        <span style="color:#94a3b8">點擊節點升級・◆為互斥二選一</span>
        <span style="color:${meta.buildB.color}">${meta.buildB.name} ▶</span>
      </div>
      <div class="d4-tree-canvas" id="d4-tree-canvas">
        ${tiersHtml}
        <svg class="d4-tree-svg" viewBox="0 0 100 100" preserveAspectRatio="none">${linesSvg}</svg>
      </div>
    `;

    const canvas = document.getElementById('d4-tree-canvas');
    nodes.forEach((node) => {
      const cur = tree[node.id] || 0;
      const blocked = isNodeBlockedByMutex(node, tree);
      const unlocked = isNodeUnlocked(node, tree);
      const maxed = cur >= node.maxLvl;
      const btn = document.createElement('button');
      let clsState = cur > 0 ? 'invested' : (blocked ? 'mutex-blocked' : (unlocked ? 'available' : 'locked'));
      btn.className = `d4-node shape-${node.shape || 'circle'} ${clsState}`;
      btn.style.left = `${node.x}%`;
      btn.style.top = `${node.y}%`;
      if (node.archetype === 'A' && cur > 0) btn.style.borderColor = meta.buildA.color;
      if (node.archetype === 'B' && cur > 0) btn.style.borderColor = meta.buildB.color;

      const glyph = node.icon
        ? `<img src="${node.icon}" alt="${node.name}" />`
        : `<span class="d4-node-inner" style="font-size:${node.kind === 'keystone' ? '18px' : '13px'};">${node.kind === 'keystone' ? '👑' : (node.kind === 'mod' ? '◆' : '✦')}</span>`;
      btn.innerHTML = `${glyph}<span class="d4-node-lvl">${cur}/${node.maxLvl}</span>`;

      btn.onclick = () => {
        if (!unlocked || maxed || sp <= 0) return;
        this.hideCompareTooltip();
        this.handlers.onUpgradeSkillNode(node.id);
      };
      btn.onmouseenter = (e) => {
        const tt = document.getElementById('diablo-tooltip');
        if (!tt) return;
        const gateTxt = (node.reqPoints || 0) > 0 ? `需星圖投入 ${node.reqPoints} 點（目前 ${spentHere}）` : '無點數門檻';
        const stateTxt = blocked
          ? '<span style="color:#f87171;">已選擇另一條互斥分支</span>'
          : (maxed ? '<span style="color:#4ade80;">已滿級</span>' : (unlocked ? '<span style="color:#fde047;">可點擊升級 (+1)</span>' : '<span style="color:#94a3b8;">尚未達成前置條件</span>'));
        tt.innerHTML = `
          <div class="tt-title" style="color:#fde68a">${node.name} (${cur}/${node.maxLvl})</div>
          <div class="tt-meta">第 ${node.tier} 階 • ${gateTxt}</div>
          <div class="tt-affix">${node.desc}</div>
          <div style="margin-top:5px;font-size:11px;font-weight:700;">${stateTxt}</div>
        `;
        tt.style.borderColor = cur > 0 ? meta.color : '#c89b3c';
        tt.classList.remove('hidden');
        this.moveCompareTooltip(e);
      };
      btn.onmousemove = (e) => this.moveCompareTooltip(e);
      btn.onmouseleave = () => this.hideCompareTooltip();
      canvas.appendChild(btn);
    });

    box.querySelectorAll('[data-tree-tab]').forEach((tb) => {
      tb.onclick = () => {
        this.activeSkillTreeTab = tb.dataset.treeTab;
        this.renderSkillTree(state);
      };
    });
    document.getElementById('btn-reset-tree')?.addEventListener('click', () => {
      this.handlers.onResetSkillTree();
    });
  }

  renderSkillSelectPanel(state) {
    const box = document.getElementById('skill-select-container');
    if (!box) return;
    const cid = state.classId || 'warrior';
    const book = cid === 'warrior' ? WARRIOR_SKILLS : (cid === 'ranger' ? RANGER_SKILLS : (cid === 'paladin' ? PALADIN_SKILLS : (cid === 'necro' ? NECRO_SKILLS : (cid === 'assassin' ? ASSASSIN_SKILLS : MAGE_SKILLS))));

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
                ${unlocked ? `等級 ${lvl} • 冷卻 ${(sk.cooldownMs / 1000).toFixed(1)}s` : '尚未解鎖'}
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

  updateTargetFrame(target) {
    const frame = document.getElementById('target-frame');
    if (!frame) return;
    if (!target || target.hp <= 0) {
      frame.classList.add('hidden');
      return;
    }
    frame.classList.remove('hidden');
    frame.classList.toggle('boss', !!target.isBoss);
    const badge = document.getElementById('target-badge');
    const nameEl = document.getElementById('target-name');
    const lvEl = document.getElementById('target-lv');
    const fillEl = document.getElementById('target-hp-fill');
    const txtEl = document.getElementById('target-hp-text');
    if (badge) badge.textContent = target.isBoss ? '💀' : '⚔️';
    if (nameEl) nameEl.textContent = target.name || '深淵怪物';
    if (lvEl) lvEl.textContent = `關卡 ${getStageLabel(target.stage || 1)}`;
    const pct = Math.max(0, Math.min(100, (target.hp / Math.max(1, target.maxHp)) * 100));
    if (fillEl) fillEl.style.width = `${pct.toFixed(1)}%`;
    if (txtEl) txtEl.textContent = `${formatNum(target.hp)} / ${formatNum(target.maxHp)}`;
  }

  updateStageTracker({ remaining, mapKills = 0, bossEvery = 15, bossEngaged, bossTimeLeft }) {
    const cntEl = document.getElementById('tracker-mob-count');
    const fillEl = document.getElementById('tracker-prog-fill');
    const bossEl = document.getElementById('tracker-boss-line');
    const prog = mapKills % bossEvery;
    if (cntEl) cntEl.textContent = `本批 ${remaining} / 24 隻 (60%基數)・累積 ${mapKills}`;
    const pct = Math.max(0, Math.min(100, (prog / bossEvery) * 100));
    if (fillEl) fillEl.style.width = `${pct.toFixed(1)}%`;
    if (bossEl) {
      if (bossEngaged) {
        bossEl.style.color = '#fb923c';
        bossEl.textContent = `🔥 首領激戰中！（本圖持續刷怪）`;
      } else {
        bossEl.style.color = '#94a3b8';
        bossEl.textContent = `殺完本批自動生成下一批 60% 怪群`;
      }
    }
  }

  renderMinimap({ heroX, heroY, mapW, mapH, obstacles, monsters }) {
    const coordsEl = document.getElementById('minimap-coords');
    if (coordsEl) coordsEl.textContent = `${Math.round(heroX)}, ${Math.round(heroY)}`;
    const canvas = document.getElementById('hud-minimap-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#090c14';
    ctx.fillRect(0, 0, w, h);

    // 網格線
    ctx.strokeStyle = 'rgba(200, 155, 60, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
    ctx.stroke();

    // 障礙物
    ctx.fillStyle = 'rgba(100, 116, 139, 0.72)';
    for (const ob of obstacles || []) {
      const ox = (ob.x / mapW) * w;
      const oy = (ob.y / mapH) * h;
      ctx.fillRect(ox - 1.5, oy - 1.5, 3, 3);
    }

    // 怪物與首領
    for (const m of monsters || []) {
      if (m.hp <= 0) continue;
      const mx = (m.x / mapW) * w;
      const my = (m.y / mapH) * h;
      ctx.fillStyle = m.isBoss ? '#f97316' : '#ef4444';
      ctx.beginPath();
      ctx.arc(mx, my, m.isBoss ? 4.2 : 2.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 玩家中心光點
    const hx = (heroX / mapW) * w;
    const hy = (heroY / mapH) * h;
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(hx, hy, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  applyFloatingLogFilter() {
    const fl = document.getElementById('floating-log-entries');
    if (!fl) return;
    const f = this.activeLogFilter || 'all';
    Array.from(fl.children).forEach((el) => {
      el.classList.toggle('hidden', f !== 'all' && el.dataset.cat !== f);
    });
    fl.scrollTop = fl.scrollHeight;
  }

  addLog(text, type = 'normal', category = null) {
    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const line = `[${ts}] ${text}`;
    const cat = category || (
      text.includes('掉落') || text.includes('分解') || text.includes('裝備') || text.includes('強化')
        ? 'loot'
        : (type === 'system' || text.includes('關') || text.includes('技能') || text.includes('職業') ? 'system' : 'combat')
    );

    const container = document.getElementById('log-content');
    if (container) {
      const p = document.createElement('div');
      p.className = `log-entry ${type}`;
      p.textContent = line;
      container.appendChild(p);
      while (container.children.length > 100) container.removeChild(container.firstChild);
      container.scrollTop = container.scrollHeight;
    }

    const fl = document.getElementById('floating-log-entries');
    if (fl) {
      const fp = document.createElement('div');
      fp.className = `log-entry ${type}`;
      fp.dataset.cat = cat;
      fp.textContent = line;
      if (this.activeLogFilter && this.activeLogFilter !== 'all' && cat !== this.activeLogFilter) {
        fp.classList.add('hidden');
      }
      fl.appendChild(fp);
      while (fl.children.length > 80) fl.removeChild(fl.firstChild);
      fl.scrollTop = fl.scrollHeight;
    }
  }
}
