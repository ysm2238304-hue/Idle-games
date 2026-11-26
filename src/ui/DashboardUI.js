import { TEMPERING_MANUALS } from '../data/items.js?v=240';
import { temperItem } from '../logic/lootGen.js?v=240';
import { SKILL_BUILD_SPECS, KEYSTONE_PASSIVES, getActiveKeystone } from '../logic/buildEngine.js?v=263';
import { UniversalTooltip } from './UniversalTooltip.js?v=240';
import { TOWN_SPLASHES } from '../data/towns/splashes.js?v=99';
import { CLASSES } from '../data/classes.js?v=99';
import { WARRIOR_SKILLS } from '../data/warriorSkills.js?v=255';
import { RANGER_SKILLS } from '../data/rangerSkills.js?v=259';
import { MAGE_SKILLS } from '../data/mageSkills.js?v=241';
import { PALADIN_SKILLS } from '../data/paladinSkills.js?v=263';
import { NECRO_SKILLS } from '../data/necroSkills.js?v=251';
import { ASSASSIN_SKILLS } from '../data/assassinSkills.js?v=261';
import { EQUIP_SLOTS, CLASS_REQ_LABELS, RARITIES, BASE_ITEMS, SET_DEFINITIONS } from '../data/items.js?v=240';
import { PET_CATALOG, PET_SCHOOLS, getPetDef, getPetRarityMeta, getPetPickupRadius, getPetCodexInfo } from '../data/pets.js?v=99';
import { getClaimableAchievementCount } from '../data/achievements.js?v=99';
import { getEnhanceRate, getEquipEnhanceCost, getPetEnhanceCost, MAX_ENHANCE_LEVEL } from '../logic/enhanceSystem.js?v=99';
import { MONSTER_TEMPLATES, STAGE_ZONES, ZONE_POOLS, getZoneName, getStageLabel, getSubStage, getChapterIdx } from '../data/monsters.js?v=99';
import { CLASS_BUILD_INFO, SKILL_TREE_NODES, getTreeSpentPoints, isNodeBlockedByMutex, isNodeUnlocked } from '../data/skillTree.js?v=99';
import { calcItemPower, getSalvageReward } from '../logic/lootGen.js?v=240';
import { formatNum, getExpToNext, getUpgradeCost, calcRebirthCrystals } from '../logic/statCalc.js?v=240';

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
    this.getState = () => this.handlers?.getState?.() || {};
    this.activeDrawer = null;
    this.selectedItemUid = null;
    this.activeSkillTreeTab = null;
    this.activeLogFilter = 'all';
    this.bindDockAndDrawer();
    this.bindGlobalButtons();
    this.bindHotbarTooltips();
    this._minimapZoom = 1.0;
    this._minimapBgCache = new Map();
    document.getElementById('btn-mm-zoom-in')?.addEventListener('click', () => {
      this._minimapZoom = Math.min(2.2, Number(((this._minimapZoom || 1.0) + 0.4).toFixed(1)));
      if (this._lastMinimapData) this.renderMinimap(this._lastMinimapData);
    });
    document.getElementById('btn-mm-zoom-out')?.addEventListener('click', () => {
      this._minimapZoom = Math.max(1.0, Number(((this._minimapZoom || 1.0) - 0.4).toFixed(1)));
      if (this._lastMinimapData) this.renderMinimap(this._lastMinimapData);
    });
    document.getElementById('btn-mm-world')?.addEventListener('click', () => {
      document.getElementById('btn-world-map')?.click();
    });
    document.getElementById('btn-collapse-topmenu')?.addEventListener('click', (e) => {
      const menu = e.currentTarget.closest('.mmo-top-menu');
      if (!menu) return;
      const col = menu.classList.toggle('is-collapsed');
      const lbl = e.currentTarget.querySelector('.mmo-lbl');
      if (lbl) lbl.textContent = col ? '▶' : '◀';
    });
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
    const st = this.getState();
    const cp = st.classProgress || {};
    Object.values(CLASSES).forEach((cls) => {
      const lv = (cls.id === st.classId) ? (st.level || 1) : (cp[cls.id]?.level || 1);
      const isCur = cls.id === st.classId;
      const card = document.createElement('div');
      card.className = `class-card ${isCur ? 'selected' : ''}`;
      card.innerHTML = `
        <img src="${cls.spritePath}" alt="${cls.name}" />
        <div class="class-name" style="color:${cls.color}">${cls.name} <span style="color:#fde68a;font-size:12px;">Lv.${lv}</span></div>
        <div class="class-title">${cls.title}</div>
        <p class="class-desc">${cls.desc}</p>
        <div class="class-skill"><strong>專屬技能：${cls.skill.name}</strong><br>${cls.skill.desc}</div>
        <button class="btn-primary" ${isCur ? 'disabled' : ''}>${isCur ? '目前出戰中' : `切換為 ${cls.name} (Lv.${lv})`}</button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        if (isCur) return;
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
    const _stTitle = document.getElementById('hud-stage-title');
    if (_stTitle) _stTitle.textContent = `第 ${sLabel} 關・${getZoneName(state.stage)}`;
    const _wBadge = document.getElementById('hud-wave-badge');
    if (_wBadge) _wBadge.textContent = `難度 ${state.stage} 階`;
    const _stNext = document.getElementById('btn-stage-next');
    if (_stNext) _stNext.disabled = state.stage >= 100;
    const _stPrev = document.getElementById('btn-stage-prev');
    if (_stPrev) _stPrev.disabled = state.stage <= 1;

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
      if ((b.titanUntil || 0) > nowTs) pills.push(`<span class="potion-buff-pill titan">🔥 泰坦 ${Math.ceil((b.titanUntil - nowTs)/1000)}s</span>`);
      if ((b.ironUntil || 0) > nowTs) pills.push(`<span class="potion-buff-pill iron">🛡️ 鋼鐵 ${Math.ceil((b.ironUntil - nowTs)/1000)}s</span>`);
      if ((b.sageUntil || 0) > nowTs) pills.push(`<span class="potion-buff-pill sage">🌟 先知 ${Math.ceil((b.sageUntil - nowTs)/1000)}s</span>`);
      if ((b.tavernUntil || 0) > nowTs) pills.push(`<span class="potion-buff-pill tavern">🍖 飽足 ${Math.ceil((b.tavernUntil - nowTs)/1000)}s</span>`);
      if ((b.guardUntil || 0) > nowTs) pills.push(`<span class="potion-buff-pill guard">🏰 守備 ${Math.ceil((b.guardUntil - nowTs)/1000)}s</span>`);
      if ((b.beaconUntil || 0) > nowTs) pills.push(`<span class="potion-buff-pill beacon">🔥 曙光祝福 ${Math.ceil((b.beaconUntil - nowTs)/1000)}s</span>`);
      if ((b.sporeUntil || 0) > nowTs) pills.push(`<span class="potion-buff-pill fury">🍄 孢子狂熱 ${Math.ceil((b.sporeUntil - nowTs)/1000)}s</span>`);
      if ((b.soulUntil || 0) > nowTs) pills.push(`<span class="potion-buff-pill">🕯️ 魂火祝福 ${Math.ceil((b.soulUntil - nowTs)/1000)}s</span>`);
      if ((b.lavaUntil || 0) > nowTs) pills.push(`<span class="potion-buff-pill beacon">🌋 熔爐狂怒 ${Math.ceil((b.lavaUntil - nowTs)/1000)}s</span>`);
      if ((b.abyssUntil || 0) > nowTs) pills.push(`<span class="potion-buff-pill fury">🩸 魔王血契 ${Math.ceil((b.abyssUntil - nowTs)/1000)}s</span>`);
      if ((b.auroraUntil || 0) > nowTs) pills.push(`<span class="potion-buff-pill">❄️ 極光祝福 ${Math.ceil((b.auroraUntil - nowTs)/1000)}s</span>`);
      if ((b.emeraldUntil || 0) > nowTs) pills.push(`<span class="potion-buff-pill mf">🌿 翠玉生機 ${Math.ceil((b.emeraldUntil - nowTs)/1000)}s</span>`);
      if ((b.stormUntil || 0) > nowTs) pills.push(`<span class="potion-buff-pill">⚡ 蒼穹雷霆 ${Math.ceil((b.stormUntil - nowTs)/1000)}s</span>`);
      if ((b.roseUntil || 0) > nowTs) pills.push(`<span class="potion-buff-pill beacon">🌹 聖血薔薇 ${Math.ceil((b.roseUntil - nowTs)/1000)}s</span>`);
      if ((b.astralUntil || 0) > nowTs) pills.push(`<span class="potion-buff-pill fury">🌌 永恆星辰 ${Math.ceil((b.astralUntil - nowTs)/1000)}s</span>`);
      if ((b.tavernUntil || 0) > nowTs) pills.push(`<span class="potion-buff-pill">🍺 酒館飽足 ${Math.ceil((b.tavernUntil - nowTs)/60000)}m</span>`);
      if ((b.guardUntil || 0) > nowTs) pills.push(`<span class="potion-buff-pill mf">🛡️ 衛兵激勵 ${Math.ceil((b.guardUntil - nowTs)/1000)}s</span>`);
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
    if (!item) return;
    UniversalTooltip.showItem(e, item, isEquipped, state);
  }

  moveCompareTooltip(e) {
    UniversalTooltip.move(e);
  }

  hideCompareTooltip() {
    UniversalTooltip.hide();
    document.getElementById('diablo-tooltip')?.classList.add('hidden');
  }

  bindHotbarTooltips() {
    document.querySelectorAll('[data-tip]').forEach((el) => {
      el.addEventListener('mouseenter', (e) => {
        UniversalTooltip.showRich(e, {
          title: el.dataset.tip,
          emoji: '✦',
          color: '#fde68a',
          lines: [el.dataset.tipDesc || '點擊開啟或切換對應功能介面。'],
        });
      });
      el.addEventListener('mousemove', (e) => this.moveCompareTooltip(e));
      el.addEventListener('mouseleave', () => this.hideCompareTooltip());
    });
  }

  openQuickSwapPopover(slotIdx, anchorEl, state) {
    let pop = document.getElementById('v238-quick-swap-pop');
    if (!pop) {
      pop = document.createElement('div');
      pop.id = 'v238-quick-swap-pop';
      document.body.appendChild(pop);
    }
    const cid = state.classId || 'warrior';
    const book = cid === 'warrior' ? WARRIOR_SKILLS : (cid === 'ranger' ? RANGER_SKILLS : (cid === 'paladin' ? PALADIN_SKILLS : (cid === 'necro' ? NECRO_SKILLS : (cid === 'assassin' ? ASSASSIN_SKILLS : MAGE_SKILLS))));
    const skills = Object.values(book);
    if (!state.equippedSkillsByClass) state.equippedSkillsByClass = {};
    if (!Array.isArray(state.equippedSkillsByClass[cid])) state.equippedSkillsByClass[cid] = [];
    while (state.equippedSkillsByClass[cid].length < 6) state.equippedSkillsByClass[cid].push(null);
    const eq5 = state.equippedSkillsByClass[cid];
    const keyNames = ['1 基礎', '2 核心', '3 防禦', '4 控場', 'E 召喚', 'R 終極'];

    pop.innerHTML = `
      <div class="v238-qs-head">
        <span>⇄ 快速替換技能・槽位 ${slotIdx + 1} [${keyNames[slotIdx] || ''}]</span>
        <button type="button" class="v238-st-mini-btn" id="v238-qs-close">✕</button>
      </div>
      <div class="v238-qs-grid">
        ${skills.map((sk) => {
          const isCur = eq5[slotIdx] === sk.id;
          return `
            <button type="button" class="v238-qs-item ${isCur ? 'is-cur' : ''}" data-qs-sk="${sk.id}">
              <img src="${sk.icon}" alt="" />
              <span class="v238-qs-name">${sk.name}</span>
            </button>
          `;
        }).join('')}
      </div>
    `;
    pop.classList.remove('hidden');

    const rect = anchorEl.getBoundingClientRect();
    const popW = 344;
    const left = Math.min(window.innerWidth - popW - 12, Math.max(12, rect.left + rect.width / 2 - popW / 2));
    const top = Math.max(12, rect.top - pop.offsetHeight - 12);
    pop.style.left = `${Math.round(left)}px`;
    pop.style.top = `${Math.round(top)}px`;

    const closePop = () => {
      pop.classList.add('hidden');
      UniversalTooltip.hide();
      document.removeEventListener('mousedown', onOutside);
    };
    const onOutside = (ev) => {
      if (!pop.contains(ev.target)) closePop();
    };
    setTimeout(() => document.addEventListener('mousedown', onOutside), 10);
    pop.querySelector('#v238-qs-close')?.addEventListener('click', closePop);

    pop.querySelectorAll('[data-qs-sk]').forEach((b) => {
      const sk = book[b.dataset.qsSk];
      const lvl = Math.max(1, (state.skillTree || {})[sk?.treeNodeId] || 1);
      b.addEventListener('mouseenter', (ev) => UniversalTooltip.showSkill(ev, sk, lvl, '左鍵點擊立即裝備至此技能槽'));
      b.addEventListener('mousemove', (ev) => UniversalTooltip.move(ev));
      b.addEventListener('mouseleave', () => UniversalTooltip.hide());
      b.addEventListener('click', () => {
        const prev = eq5.indexOf(sk.id);
        if (prev >= 0 && prev !== slotIdx) eq5[prev] = eq5[slotIdx];
        eq5[slotIdx] = sk.id;
        closePop();
        this.renderDockSkillSlots(state);
        this.renderSkillTree(state);
        window.__IDLE_ARPG_BRIDGE__?.saveNow?.();
      });
    });
  }

  renderDockSkillSlots(state) {
    const keyLabels = ['1', '2', '3', '4', 'E', 'R'];
    const cid = state.classId || 'warrior';
    const book = cid === 'warrior' ? WARRIOR_SKILLS : (cid === 'ranger' ? RANGER_SKILLS : (cid === 'paladin' ? PALADIN_SKILLS : (cid === 'necro' ? NECRO_SKILLS : (cid === 'assassin' ? ASSASSIN_SKILLS : MAGE_SKILLS))));
    const eqList = state.equippedSkillsByClass?.[cid] || [];

    for (let i = 0; i < 6; i++) {
      const btn = document.getElementById(`skill-slot-${i}`);
      if (!btn) continue;
      const iconEl = btn.querySelector('.sk-slot-img');
      const plusEl = btn.querySelector('.mmo-empty-plus');
      const mpEl = btn.querySelector('.mmo-mp-cost');
      const skId = eqList[i];
      const sk = skId ? book[skId] : null;
      const lvl = sk ? Math.max(1, (state.skillTree || {})[sk.treeNodeId] || 1) : 0;

      // 任何技能槽右鍵都能開啟 16 招快換選單
      btn.oncontextmenu = (ev) => {
        ev.preventDefault();
        this.openQuickSwapPopover(i, btn, state);
      };

      if (sk && lvl > 0) {
        if (iconEl) { iconEl.src = sk.icon; iconEl.classList.remove('hidden'); }
        if (plusEl) plusEl.classList.add('hidden');
        const mpCost = sk.mpCost || 18;
        if (mpEl) mpEl.textContent = `${mpCost}`;
        btn.disabled = false;
        btn.onmouseenter = (e) => UniversalTooltip.showSkill(e, sk, lvl, `熱鍵 [${keyLabels[i]}] • 右鍵快速替換其他技能`);
        btn.onmousemove = (e) => UniversalTooltip.move(e);
        btn.onmouseleave = () => UniversalTooltip.hide();
      } else {
        if (iconEl) iconEl.classList.add('hidden');
        if (plusEl) plusEl.classList.remove('hidden');
        if (mpEl) mpEl.textContent = '';
        btn.disabled = false;
        btn.onclick = () => this.openQuickSwapPopover(i, btn, state);
        btn.onmouseenter = (e) => UniversalTooltip.showRich(e, {
          title: `空技能槽 [${keyLabels[i]}]`,
          emoji: '⚡',
          color: '#fde68a',
          lines: ['左鍵或右鍵點擊立即從本職業 16 招技能中挑選裝備！'],
        });
        btn.onmousemove = (e) => UniversalTooltip.move(e);
        btn.onmouseleave = () => UniversalTooltip.hide();
      }
    }
  }

  updateSkillProgress(ratios, cdDetails = []) {
    const inTownNow = !!document.getElementById('btn-town-toggle')?.classList?.contains('in-town');
    if (inTownNow) {
      for (let i = 0; i < 6; i++) {
        const slot = document.getElementById(`skill-slot-${i}`);
        if (!slot) continue;
        const cur = slot.querySelector('.mmo-cd-curtain');
        const sec = slot.querySelector('.mmo-cd-sec');
        if (cur) cur.style.height = '0%';
        if (sec) sec.textContent = '';
        slot.classList.remove('on-cd');
      }
      return;
    }
    for (let i = 0; i < 6; i++) {
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
    this.renderPets(state);
    this.renderRebirthPanel(state);
  }

  // v258: 暗黑 4 風格分職業三欄紙娃娃裝備介面（6 職業專屬祭壇底圖＋48 張暗金浮雕空槽剪影）
  renderGearAndStats(state, stats) {
    const dollEl = document.getElementById('paper-doll-stage');
    if (dollEl) {
      dollEl.innerHTML = '';
      const cid = state.classId || 'warrior';
      const cls = CLASSES[cid] || CLASSES.warrior;
      const accentMap = {
        warrior: '#f97316',
        ranger: '#34d399',
        mage: '#a855f7',
        paladin: '#fbbf24',
        necro: '#2dd4bf',
        assassin: '#f43f5e',
      };
      const accent = accentMap[cid] || cls.color || '#c89b3c';
      const SLOT_LABELS = {
        helm: '頭盔', armor: '胸甲', gloves: '手套', boots: '戰靴',
        weapon: '武器', offhand: '副手', amulet: '護符', ring: '戒指',
      };
      const leftSlots = ['helm', 'armor', 'gloves', 'boots'];
      const rightSlots = ['weapon', 'offhand', 'amulet', 'ring'];

      const stage = document.createElement('div');
      stage.className = 'd4-paperdoll-stage';
      stage.style.setProperty('--d4-accent', accent);
      stage.style.backgroundImage = `linear-gradient(180deg, rgba(10,9,14,0.48) 0%, rgba(10,9,14,0.22) 45%, rgba(8,7,12,0.88) 100%), url('./assets/ui/paperdoll/bg_${cid}.jpg?v=257')`;

      const buildSlotBox = (slotId) => {
        const item = state.equipment?.[slotId];
        const label = SLOT_LABELS[slotId] || EQUIP_SLOTS[slotId]?.label || slotId;
        const box = document.createElement('div');
        box.className = `d4-eq-slot${item ? ' is-equipped' : ' is-empty'}`;
        if (item) {
          const r = RARITIES[item.rarity] || RARITIES.common;
          box.style.borderColor = r.border;
          box.style.background = r.bg;
          box.style.boxShadow = `inset 0 0 12px ${r.border}55, 0 0 8px ${r.border}33`;
          const upgBadge = item.upgradeLevel > 0 ? `<span class="d4-slot-upg">+${item.upgradeLevel}</span>` : '';
          box.innerHTML = `
            <img class="d4-slot-item-img" src="${resolveItemIcon(item)}" alt="${item.name}" />
            ${upgBadge}
            <div class="d4-slot-name" style="color:${r.color}">${item.name}</div>
          `;
          box.onclick = () => this.renderItemInspector(item, true, state);
          box.onmouseenter = (e) => this.showCompareTooltip(e, item, true, state);
          box.onmousemove = (e) => this.moveCompareTooltip(e);
          box.onmouseleave = () => this.hideCompareTooltip();
        } else {
          box.innerHTML = `
            <img class="d4-slot-silhouette" src="./assets/ui/paperdoll/slot_${cid}_${slotId}.png?v=258" alt="${label}" />
            <div class="d4-slot-empty-lbl">${label}</div>
          `;
          box.onmouseenter = (e) => UniversalTooltip.showRich(e, {
            title: `${cls.name}・${label}槽位`,
            subtitle: '尚未穿戴裝備',
            icon: `./assets/ui/paperdoll/slot_${cid}_${slotId}.png?v=258`,
            color: accent,
            lines: ['從右側背包點擊裝備即可立即穿戴。'],
          });
          box.onmousemove = (e) => UniversalTooltip.move(e);
          box.onmouseleave = () => UniversalTooltip.hide();
        }
        return box;
      };

      const colL = document.createElement('div');
      colL.className = 'd4-col-stack';
      leftSlots.forEach((s) => colL.appendChild(buildSlotBox(s)));

      const center = document.createElement('div');
      center.className = 'd4-center-altar';
      const nickStr = state.nickname ? `${state.nickname}・` : '';
      center.innerHTML = `
        <div class="d4-hero-plate">
          <div class="d4-hero-name" style="color:${accent};">${nickStr}${cls.name}</div>
          <div class="d4-hero-sub">Lv.${state.level || 1} ｜ ⚔️ DPS ${formatNum(stats.dps || 0)}</div>
        </div>
        <div class="d4-hero-pedestal">
          <img class="d4-hero-sprite" src="${cls.spritePath}" alt="${cls.name}" />
        </div>
      `;

      // 底部橫向出戰靈寵專屬卡槽
      const eqPet = state.equippedPetId ? getPetDef(state.equippedPetId) : null;
      const eqRec = (state.pets || []).find((p) => p.petId === state.equippedPetId);
      const petStrip = document.createElement('div');
      petStrip.className = 'd4-pet-strip';
      if (eqPet) {
        const pr = getPetRarityMeta(eqPet.rarity);
        const sch = PET_SCHOOLS[eqPet.school];
        const upgStr = (eqRec?.upgradeLevel || 0) > 0 ? ` +${eqRec.upgradeLevel}` : '';
        petStrip.style.borderColor = pr.border;
        petStrip.innerHTML = `
          <img class="d4-pet-ico" src="${eqPet.icon}" alt="${eqPet.name}" />
          <div class="d4-pet-info">
            <div class="d4-pet-name" style="color:${pr.color};">${eqPet.name}${upgStr}</div>
            <div class="d4-pet-sch" style="color:${sch?.color || '#fde68a'};">${sch?.label || '出戰靈寵'}</div>
          </div>
        `;
        petStrip.onmouseenter = (e) => UniversalTooltip.showPet(e, eqPet, eqRec, state);
        petStrip.onmousemove = (e) => UniversalTooltip.move(e);
        petStrip.onmouseleave = () => UniversalTooltip.hide();
      } else {
        petStrip.innerHTML = `<span style="font-size:16px;opacity:0.6;">🐾</span><div class="d4-pet-info"><div class="d4-pet-name" style="color:#94a3b8;">尚未出戰靈寵</div><div class="d4-pet-sch" style="color:#64748b;">點擊開啟寵物欄</div></div>`;
      }
      petStrip.onclick = () => this.openDrawer('pets');
      center.appendChild(petStrip);

      const colR = document.createElement('div');
      colR.className = 'd4-col-stack';
      rightSlots.forEach((s) => colR.appendChild(buildSlotBox(s)));

      stage.appendChild(colL);
      stage.appendChild(center);
      stage.appendChild(colR);
      dollEl.appendChild(stage);
    }

    const statsEl = document.getElementById('char-stats-list');
    if (statsEl) {
      const resName = state.classId === 'warrior' ? '怒氣' : (state.classId === 'ranger' ? '精力' : (state.classId === 'paladin' ? '聖能' : (state.classId === 'necro' ? '魂能' : (state.classId === 'assassin' ? '影能' : '魔力'))));
      statsEl.innerHTML = `
        <div class="stat-row"><span>生命 / ${resName}上限</span><strong>${formatNum(stats.maxHp)} / ${formatNum(stats.maxMp || 100)}</strong></div>
        <div class="stat-row"><span>攻擊力 / 秒傷</span><strong>${formatNum(stats.atk)} / ${formatNum(stats.dps || 0)}</strong></div>
        <div class="stat-row"><span>攻擊間隔 / 回能</span><strong>${(stats.atkIntervalMs / 1000).toFixed(2)}s / ${(stats.mpRegenPerSec || 0).toFixed(1)}/s</strong></div>
        <div class="stat-row"><span>暴擊率 / 暴傷</span><strong>${stats.critRate}% / ${stats.critDmg}%</strong></div>
        <div class="stat-row"><span>護甲 / 閃避</span><strong>${formatNum(stats.armor)} / ${stats.dodge}%</strong></div>
        <div class="stat-row"><span>攻擊吸血 / 減傷</span><strong>${stats.lifesteal}% / ${Math.round(stats.dmgReducePct || 0)}%</strong></div>
        <div class="stat-row"><span>移動速度</span><strong>${stats.moveSpeed}</strong></div>
        <div class="stat-row"><span>金幣 / 掉寶</span><strong>+${stats.goldFind}% / +${stats.magicFind}%</strong></div>
        ${(stats.activeSets && stats.activeSets.length) ? `
          <div style="grid-column:1/-1;margin-top:6px;padding:8px 10px;border-radius:7px;background:rgba(22,163,74,0.14);border:1px solid rgba(34,197,94,0.45);font-size:11.5px;">
            <div style="color:#4ade80;font-weight:700;margin-bottom:4px;">🌿 已啟動綠色套裝效果</div>
            ${stats.activeSets.map((s) => `
              <div style="margin-top:3px;">
                <b style="color:#86efac;">${s.name} (${s.count}/4)</b>
                <div style="color:${s.count >= 2 ? '#bbf7d0' : '#64748b'};font-size:10.5px;">(2件) ${s.def.bonus2Desc}</div>
                <div style="color:${s.count >= 4 ? '#bbf7d0' : '#64748b'};font-size:10.5px;">(4件) ${s.def.bonus4Desc}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      `;
    }
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
    let setHtml = '';
    if (item.rarity === 'set' && item.setId && SET_DEFINITIONS[item.setId]) {
      const sd = SET_DEFINITIONS[item.setId];
      const eqCnt = Object.values(st?.equipment || {}).filter((e) => e && e.rarity === 'set' && e.setId === item.setId).length;
      setHtml = `<div style="margin-top:6px;padding:6px 8px;border-radius:6px;background:rgba(22,163,74,0.14);border:1px solid rgba(34,197,94,0.45);font-size:11.5px;">
        <div style="color:#4ade80;font-weight:700;">❖ 套裝【${sd.name}】（已裝備 ${eqCnt}/4 件）</div>
        <div style="color:${eqCnt >= 2 ? '#86efac' : '#64748b'};">(2件套) ${sd.bonus2Desc}</div>
        <div style="color:${eqCnt >= 4 ? '#86efac' : '#64748b'};">(4件套) ${sd.bonus4Desc}</div>
      </div>`;
    }

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
      ${legHtml}${setHtml}
      <div class="insp-actions">
        ${isEquipped ? '' : `<button id="insp-equip" class="btn-primary" ${!canWear ? 'disabled' : ''}>${canWear ? '穿戴裝備' : '職業不符'}</button>`}
        <button id="insp-upgrade" class="btn-secondary">強化 (+1) 💎${upgCost}</button>
        ${isEquipped ? '' : `<button id="insp-salvage" class="btn-danger">分解 (+${salvage.gold}金 / +${salvage.dust}粉)</button>`}
      </div>
    `;

        // v239: 在裝備檢視器底部注入「⚒️ 鐵匠流派淬火鍛造」操作列
    const tWrap = document.createElement('div');
    tWrap.style.cssText = 'margin-top:8px;padding-top:7px;border-top:1px dashed rgba(94,234,212,0.35);';
    const remT = Math.max(0, 5 - (item.temperCount || 0));
    tWrap.innerHTML = `
      <div style="font-size:11px;font-weight:800;color:#5eead4;margin-bottom:5px;">⚒️ 鐵匠流派淬火（剩餘 ${remT}/5 次 • 45 粉塵）</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px;">
        ${Object.values(TEMPERING_MANUALS).map((m) => `<button type="button" class="btn-ghost-sm" data-temper-man="${m.id}" ${remT > 0 && (state.dust || 0) >= m.dustCost ? '' : 'disabled style="opacity:0.45;"'}>${m.name}</button>`).join('')}
      </div>
    `;
    box.appendChild(tWrap);
    tWrap.querySelectorAll('[data-temper-man]').forEach((tb) => {
      tb.onclick = () => {
        const res = temperItem(item, tb.dataset.temperMan);
        if (!res.ok) return;
        state.dust = Math.max(0, (state.dust || 0) - res.dustCost);
        this.renderItemInspector(item, isEquipped, state);
        window.__IDLE_ARPG_BRIDGE__?.saveNow?.();
      };
    });

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
    const cid = state.classId || 'warrior';
    const cls = CLASSES[cid] || { name: cid, color: '#fde68a' };
    const book = cid === 'warrior' ? WARRIOR_SKILLS : (cid === 'ranger' ? RANGER_SKILLS : (cid === 'paladin' ? PALADIN_SKILLS : (cid === 'necro' ? NECRO_SKILLS : (cid === 'assassin' ? ASSASSIN_SKILLS : MAGE_SKILLS))));
    const skills = Object.values(book);
    if (!state.equippedSkillsByClass) state.equippedSkillsByClass = {};
    if (!Array.isArray(state.equippedSkillsByClass[cid])) state.equippedSkillsByClass[cid] = [];
    while (state.equippedSkillsByClass[cid].length < 6) state.equippedSkillsByClass[cid].push(null);
    const eq5 = state.equippedSkillsByClass[cid];

    // 依暗黑 4 五大階層自動分組 16 招技能
    const TIERS = [
      { id: 'primer',    label: 'T1 基礎產能與起手技', match: (r) => r === 'primer' || r === 'buff' },
      { id: 'core',      label: 'T2 流派核心輸出技',   match: (r) => r === 'core' },
      { id: 'defensive', label: 'T3 防禦、位移與控場', match: (r) => r === 'defensive' },
      { id: 'tactical',  label: 'T4 精通、領域與召喚', match: (r) => r === 'tactical' },
      { id: 'ultimate',  label: 'T5 終極毀滅大招',     match: (r) => r === 'ultimate' },
    ];
    const used = new Set();
    const grouped = TIERS.map((t) => {
      const list = skills.filter((sk) => {
        if (used.has(sk.id)) return false;
        const role = SKILL_BUILD_SPECS[sk.id]?.role || 'core';
        if (t.match(role)) { used.add(sk.id); return true; }
        return false;
      });
      return { ...t, list };
    });
    const leftover = skills.filter((sk) => !used.has(sk.id));
    if (leftover.length) grouped[1].list.push(...leftover);

    const ksList = KEYSTONE_PASSIVES[cid] || [];
    const curKs = getActiveKeystone(state, cid);

    box.innerHTML = `
      <div class="v238-st-board">
        <div class="v238-st-topbar">
          <div>
            <div style="font-size:14.5px;font-weight:900;color:${cls.color || '#fde68a'};">✦ 【${cls.name}】深淵星盤技能樹（共 ${skills.length} 招主動＋${ksList.length} 關鍵被動）</div>
            <div style="font-size:11.5px;color:#cbd5e1;margin-top:2px;">可用技能點：<b style="color:#4ade80;font-size:14px;">${sp}</b> ｜ 滑鼠移上預覽詳細數值 • 點「+1」升級解鎖 Lv.2/4/6/8 專精 • 點「裝」快速換招</div>
          </div>
          <div style="display:flex;gap:6px;">
            <button type="button" class="v238-st-mini-btn" id="v238-open-spec-from-tree">⚡ 4 階專精分支</button>
            <button type="button" class="v238-st-mini-btn" id="v238-reset-tree-btn">洗點重置</button>
          </div>
        </div>

        ${grouped.map((g) => g.list.length ? `
          <div class="v238-st-tier">
            <div class="v238-st-tier-lbl"><span>${g.label}</span><span style="opacity:.75;">${g.list.length} 招</span></div>
            <div class="v238-st-row">
              ${g.list.map((sk) => {
                const lv = Math.max(1, Number(tree[sk.treeNodeId] || 1));
                const eqIdx = eq5.indexOf(sk.id);
                return `
                  <div class="v238-st-node ${eqIdx >= 0 ? 'is-equipped' : ''}" data-st-sk="${sk.id}">
                    ${eqIdx >= 0 ? `<span class="v238-st-slotbadge">槽${eqIdx + 1}</span>` : ''}
                    <span class="v238-st-lv">Lv.${lv}</span>
                    <img src="${sk.icon}" alt="${sk.name}" />
                    <div class="v238-st-name">${sk.name}</div>
                    <div class="v238-st-acts">
                      <button type="button" class="v238-st-mini-btn" data-st-up="${sk.treeNodeId}" ${sp > 0 && lv < 10 ? '' : 'disabled style="opacity:0.4;"'}>+1</button>
                      <button type="button" class="v238-st-mini-btn" data-st-eq="${sk.id}">裝</button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : '').join('')}

        ${ksList.length ? `
          <div class="v238-st-tier" style="border-color:rgba(244,63,94,0.45);">
            <div class="v238-st-tier-lbl" style="color:#fda4af;"><span>💎 T6 終局關鍵被動（${ksList.length} 選 1）</span><span>啟用：${curKs?.name || ''}</span></div>
            <div class="v238-st-row">
              ${ksList.map((ks) => `
                <button type="button" class="v238-st-node ${curKs?.id === ks.id ? 'is-equipped' : ''}" data-st-ks="${ks.id}">
                  <img src="${ks.icon}" style="border-color:${ks.color};" alt="${ks.name}" />
                  <div class="v238-st-name" style="color:${ks.color};">${ks.name}</div>
                  <div style="font-size:9px;color:#94a3b8;">${ks.badge}${curKs?.id === ks.id ? ' ✓' : ''}</div>
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    box.querySelector('#v238-open-spec-from-tree')?.addEventListener('click', () => window.__SKILL_SPEC_MODAL__?.open?.());
    box.querySelector('#v238-reset-tree-btn')?.addEventListener('click', () => this.handlers.onResetSkillTree?.());

    box.querySelectorAll('[data-st-sk]').forEach((node) => {
      const sk = book[node.dataset.stSk];
      const lv = Math.max(1, Number(tree[sk?.treeNodeId] || 1));
      node.addEventListener('mouseenter', (ev) => UniversalTooltip.showSkill(ev, sk, lv, '點擊「+1」升級；點擊「裝」選擇快捷槽位'));
      node.addEventListener('mousemove', (ev) => UniversalTooltip.move(ev));
      node.addEventListener('mouseleave', () => UniversalTooltip.hide());
    });

    box.querySelectorAll('[data-st-up]').forEach((b) => {
      b.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const nid = b.dataset.stUp;
        if ((state.skillPoints || 0) <= 0) return;
        if (!state.skillTree) state.skillTree = {};
        const cur = Math.max(1, Number(state.skillTree[nid] || 1));
        if (cur >= 10) return;
        state.skillTree[nid] = cur + 1;
        state.skillPoints = Math.max(0, (state.skillPoints || 0) - 1);
        this.renderSkillTree(state);
        this.renderDockSkillSlots(state);
        window.__IDLE_ARPG_BRIDGE__?.saveNow?.();
      });
    });

    box.querySelectorAll('[data-st-eq]').forEach((b) => {
      b.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const skId = b.dataset.stEq;
        // 自動找空槽，若全滿則開啟槽 1 快換或輪替裝備
        let targetSlot = eq5.findIndex((x) => !x);
        if (targetSlot < 0) {
          this.openQuickSwapPopover(0, b, state);
          return;
        }
        const prev = eq5.indexOf(skId);
        if (prev >= 0) eq5[prev] = null;
        eq5[targetSlot] = skId;
        this.renderDockSkillSlots(state);
        this.renderSkillTree(state);
        window.__IDLE_ARPG_BRIDGE__?.saveNow?.();
      });
    });

    box.querySelectorAll('[data-st-ks]').forEach((b) => {
      const ks = ksList.find((x) => x.id === b.dataset.stKs);
      b.addEventListener('mouseenter', (ev) => UniversalTooltip.showRich(ev, {
        title: `💎 ${ks.name} [${ks.badge}]`,
        subtitle: '終局關鍵被動（同時僅能啟用 1 個）',
        icon: ks.icon,
        color: ks.color,
        lines: [ks.desc],
        footer: '左鍵點擊立即切換啟用此關鍵被動',
      }));
      b.addEventListener('mousemove', (ev) => UniversalTooltip.move(ev));
      b.addEventListener('mouseleave', () => UniversalTooltip.hide());
      b.addEventListener('click', () => {
        if (!state.activeKeystone) state.activeKeystone = {};
        state.activeKeystone[cid] = ks.id;
        this.renderSkillTree(state);
        window.__IDLE_ARPG_BRIDGE__?.saveNow?.();
      });
    });
  }

  renderPets(state) {
    this._bindBagSubTabs();
    const targets = [document.getElementById('pets-container'), document.getElementById('bag-pets-container')].filter(Boolean);
    if (!targets.length) return;
    for (const box of targets) this._renderPetsInto(box, state);
  }

  _bindBagSubTabs() {
    if (this._bagSubBound) return;
    const bar = document.getElementById('bag-subtab-bar');
    if (!bar) return;
    this._bagSubBound = true;
    bar.querySelectorAll('.bag-sub-btn').forEach((btn) => {
      btn.onclick = () => {
        const sub = btn.dataset.bagsub;
        bar.querySelectorAll('.bag-sub-btn').forEach((b) => {
          const act = b.dataset.bagsub === sub;
          b.classList.toggle('active', act);
          b.className = `${act ? 'btn-gold-sm' : 'btn-ghost-sm'} bag-sub-btn${act ? ' active' : ''}`;
        });
        document.getElementById('bag-pane-gear')?.classList.toggle('hidden', sub !== 'gear');
        document.getElementById('bag-pane-pets')?.classList.toggle('hidden', sub !== 'pets');
      };
    });
  }

  _renderPetsInto(box, state) {
    const pets = state.pets || [];
    const eqId = state.equippedPetId;
    const eqPet = eqId ? getPetDef(eqId) : null;
    const eqRec = pets.find((x) => x.petId === eqId);
    const eqUpg = eqRec?.upgradeLevel || 0;
    const eqSch = eqPet ? PET_SCHOOLS[eqPet.school] : null;
    const eqRar = eqPet ? getPetRarityMeta(eqPet.rarity) : null;
    const codex = getPetCodexInfo(pets, state.petCodex);
    const pickR = getPetPickupRadius(eqPet, eqUpg);
    const activeSub = this._petPanelTab || 'owned';
    if (!box._v232PetTipBound) {
      box._v232PetTipBound = true;
      box.addEventListener('mouseover', (e) => {
        const card = e.target?.closest?.('[data-pet-id]');
        if (!card) return;
        const pid = card.dataset.petId;
        const def = getPetDef(pid);
        if (!def) return;
        const stNow = window.__IDLE_ARPG_BRIDGE__?.getState?.() || state;
        const rec = (stNow.pets || []).find((p) => p.petId === pid);
        UniversalTooltip.showPet(e, def, rec, stNow);
      });
      box.addEventListener('mouseout', (e) => {
        const card = e.target?.closest?.('[data-pet-id]');
        if (card && (!e.relatedTarget || !card.contains(e.relatedTarget))) UniversalTooltip.hide();
      });
    }

    box.innerHTML = `
      <div style="padding:10px;border-radius:8px;background:rgba(18,14,18,0.92);border:1px solid ${eqRar ? eqRar.border : '#64748b'};margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;gap:6px;flex-wrap:wrap;">
          <b style="color:#fde68a;">🐾 目前出戰寵物</b>
          <span style="font-size:11.5px;color:#38bdf8;">✨ 精華：<b>${state.petEssence || 0}</b> ｜ 🛡️ 保護石：<b>${state.protectStones || 0}</b></span>
        </div>
        ${eqPet ? `
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:52px;height:52px;display:flex;align-items:center;justify-content:center;border-radius:8px;background:${eqRar.bg};border:1.5px solid ${eqRar.border};overflow:hidden;flex-shrink:0;"><img src="${eqPet.icon}" alt="${eqPet.name}" style="width:46px;height:46px;object-fit:contain;" /></div>
            <div style="flex:1;min-width:0;">
              <div><b style="color:${eqRar.color};">[${eqRar.label}] ${eqPet.name}${eqUpg > 0 ? ` +${eqUpg}` : ''}</b> <span style="font-size:11px;color:${eqSch.color};">・${eqSch.label}</span></div>
              <div style="font-size:11px;color:#cbd5e1;margin-top:2px;">${eqPet.desc}</div>
              <div style="font-size:10.5px;color:#86efac;margin-top:3px;">⚡ 衍生威力 ×${(1 + eqUpg * 0.18).toFixed(2)} ｜ 🧲 協同拾取 ${pickR}px ｜ 📖 圖鑑增傷 +${codex.bonusPct}%</div>
            </div>
            <button type="button" class="btn-ghost-sm btn-unequip-pet">卸下</button>
          </div>
        ` : '<div style="font-size:12px;color:#94a3b8;">尚未出戰寵物（出戰後會跟隨於英雄身旁並觸發技能衍生特效與擴大拾取）</div>'}
        <label style="display:flex;align-items:center;gap:6px;margin-top:7px;font-size:11px;color:#86efac;"><input type="checkbox" class="chk-pet-protect" ${(state.protectStones || 0) > 0 ? 'checked' : 'disabled'} /> +6 以上強化使用保護石防降階（+6:40% +7:30% +8:20% +9:10% +10:1%）</label>
        <div style="margin-top:8px;display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          <button type="button" class="btn-gold-sm btn-summon-pet" style="flex:1;" ${(state.petEssence || 0) < 30 ? 'disabled' : ''}>✨ 召喚寵物 (30精華)</button>
          <button type="button" class="btn-ghost-sm btn-salvage-dup-pets" title="保留每種最高階的 1 隻，分解多餘重複寵物">🧹 一鍵分解重複</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;">
        <button type="button" class="${activeSub === 'owned' ? 'btn-gold-sm' : 'btn-ghost-sm'} pet-sub-btn" data-petsub="owned">🐾 持有寵物 (${pets.length})</button>
        <button type="button" class="${activeSub === 'codex' ? 'btn-gold-sm' : 'btn-ghost-sm'} pet-sub-btn" data-petsub="codex">📖 完整圖鑑 (${codex.count}/${codex.total})</button>
      </div>

      ${activeSub === 'owned' ? `
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${pets.map((p) => {
            const def = getPetDef(p.petId) || PET_CATALOG[0];
            const rar = getPetRarityMeta(def.rarity);
            const sch = PET_SCHOOLS[def.school];
            const isEq = eqId === def.id;
            const lv = p.upgradeLevel || 0;
            const rate = getEnhanceRate(lv);
            const { gold, essence } = getPetEnhanceCost(p);
            const canEnh = lv < MAX_ENHANCE_LEVEL && (state.gold || 0) >= gold && (state.petEssence || 0) >= essence;
            return `
              <div style="display:flex;align-items:center;gap:7px;padding:7px 9px;border-radius:7px;background:${isEq ? 'rgba(120,53,15,0.28)' : 'rgba(14,11,15,0.85)'};border:1px solid ${isEq ? '#f59e0b' : rar.border};">
                <div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:6px;background:${rar.bg};border:1px solid ${rar.border};overflow:hidden;flex-shrink:0;"><img src="${def.icon}" alt="${def.name}" style="width:36px;height:36px;object-fit:contain;" /></div>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:12.5px;"><b style="color:${rar.color};">[${rar.label}] ${def.name}${lv > 0 ? ` +${lv}` : ''}</b> <span style="font-size:10.5px;color:${sch.color};">${sch.label}</span></div>
                  <div style="font-size:10.5px;color:#94a3b8;">${def.desc}</div>
                </div>
                <button type="button" class="btn-gold-sm" data-enh-pet="${p.uid}" ${canEnh ? '' : 'disabled'} title="消耗 ${gold} 金幣 + ${essence} 精華">${lv >= 10 ? '+10滿' : `⚒️+${lv + 1}(${rate}%)`}</button>
                <button type="button" class="btn-gold-sm" data-equip-pet="${def.id}">${isEq ? '出戰中' : '出戰'}</button>
                <button type="button" class="btn-ghost-sm" data-salvage-pet="${p.uid}">分解</button>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div style="padding:7px 9px;margin-bottom:8px;border-radius:7px;background:rgba(14,11,16,0.9);border:1px solid rgba(251,191,36,0.35);font-size:11px;color:#e2d5be;">
          🏆 收集里程碑（全寵物衍生傷害）：
          <span style="color:${codex.count >= 5 ? '#4ade80' : '#64748b'};">5隻(+10%)</span>・
          <span style="color:${codex.count >= 10 ? '#4ade80' : '#64748b'};">10隻(+25%)</span>・
          <span style="color:${codex.count >= 20 ? '#4ade80' : '#64748b'};">20隻(+50%)</span>・
          <span style="color:${codex.count >= 30 ? '#4ade80' : '#64748b'};">30隻(+100%)</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
          ${PET_CATALOG.map((def) => {
            const has = codex.unlockedSet.has(def.id);
            const rar = getPetRarityMeta(def.rarity);
            const sch = PET_SCHOOLS[def.school];
            return `
              <div style="display:flex;align-items:center;gap:7px;padding:6px 8px;border-radius:7px;background:rgba(14,11,15,0.88);border:1px solid ${has ? rar.border : 'rgba(100,116,139,0.28)'};opacity:${has ? 1 : 0.62};">
                <div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:6px;background:${rar.bg};flex-shrink:0;overflow:hidden;">
                  <img src="${def.icon}" alt="${def.name}" style="width:32px;height:32px;object-fit:contain;${has ? '' : 'filter:brightness(0) invert(0.25);'}" />
                </div>
                <div style="min-width:0;flex:1;">
                  <div style="font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"><b style="color:${rar.color};">${has ? def.name : '???'}</b></div>
                  <div style="font-size:10px;color:${sch.color};">[${rar.label}] ${sch.label}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;

    box.querySelector('.btn-unequip-pet')?.addEventListener('click', () => this.handlers.onEquipPet?.(null));
    box.querySelector('.btn-summon-pet')?.addEventListener('click', () => this.handlers.onSummonPet?.());
    box.querySelector('.btn-salvage-dup-pets')?.addEventListener('click', () => this.handlers.onSalvageDupPets?.());
    box.querySelectorAll('.pet-sub-btn').forEach((b) => {
      b.onclick = () => { this._petPanelTab = b.dataset.petsub; this.renderPets(state); };
    });
    box.querySelectorAll('[data-enh-pet]').forEach((b) => {
      b.onclick = () => this.handlers.onEnhancePet?.(b.dataset.enhPet, !!box.querySelector('.chk-pet-protect')?.checked);
    });
    box.querySelectorAll('[data-equip-pet]').forEach((b) => {
      b.onclick = () => this.handlers.onEquipPet?.(b.dataset.equipPet);
    });
    box.querySelectorAll('[data-salvage-pet]').forEach((b) => {
      b.onclick = () => this.handlers.onSalvagePet?.(b.dataset.salvagePet);
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

  updateTargetFrameTown(info) {
    const tf = document.getElementById('target-frame');
    const nameEl = document.getElementById('target-name');
    const stageEl = document.getElementById('target-stage');
    const hpFill = document.getElementById('target-hp-fill');
    const hpText = document.getElementById('target-hp-text');
    if (!tf) return;
    if (!info) {
      tf.classList.add('hidden');
      tf.classList.remove('is-town-npc');
      return;
    }
    tf.classList.remove('hidden', 'is-boss');
    tf.classList.add('is-town-npc');
    if (nameEl) nameEl.textContent = info.title || '主城 NPC';
    if (stageEl) stageEl.textContent = `第 ${(info.chapterIdx ?? 0) + 1} 章・${info.townName || '主城'}`;
    if (hpFill) hpFill.style.width = '100%';
    if (hpText) hpText.textContent = (info.sub || '點擊或按 [F] 互動').replace('[F] ', '');
  }

  updateTargetFrame(target) {
    const tf0 = document.getElementById('target-frame');
    if (tf0) tf0.classList.remove('is-town-npc');
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

  _getMinimapBg(bgUrl) {
    if (!bgUrl) return null;
    if (!this._minimapBgCache) this._minimapBgCache = new Map();
    let rec = this._minimapBgCache.get(bgUrl);
    if (!rec) {
      const img = new Image();
      rec = { img, loaded: false };
      img.onload = () => { rec.loaded = true; };
      img.src = bgUrl;
      this._minimapBgCache.set(bgUrl, rec);
    }
    return rec.loaded ? rec.img : null;
  }

  renderMinimap(data) {
    if (!data) return;
    this._lastMinimapData = data;
    const { mode = 'battle', chapterIdx = 0, bgUrl, zoneName, heroX = 0, heroY = 0, heroDir = 'down', heroFlipX = false, mapW = 2800, mapH = 1800, walkableZones, obstacles, facilities, patrols, monsters } = data;
    const nameEl = document.getElementById('minimap-zone-name');
    if (nameEl && zoneName) nameEl.textContent = zoneName;
    const chEl = document.getElementById('minimap-ch-badge');
    if (chEl) chEl.textContent = `CH.${chapterIdx + 1}`;
    const coordsEl = document.getElementById('minimap-coords');
    if (coordsEl) coordsEl.textContent = `${Math.round(heroX)}, ${Math.round(heroY)}`;
    const statusEl = document.getElementById('minimap-status-line');

    const canvas = document.getElementById('hud-minimap-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const zoom = this._minimapZoom || 1.0;
    let hxN = (heroX / mapW) * w, hyN = (heroY / mapH) * h;
    if (zoom > 1.01) {
      const halfW = w / (2 * zoom), halfH = h / (2 * zoom);
      hxN = Math.max(halfW, Math.min(w - halfW, hxN));
      hyN = Math.max(halfH, Math.min(h - halfH, hyN));
    }
    this._lastMinimapMeta = { mode, mapW, mapH, w, h, zoom, hxN, hyN };
    if (!canvas._navBound) {
      canvas._navBound = true;
      canvas.addEventListener('click', (ev) => {
        const meta = this._lastMinimapMeta;
        if (!meta || meta.mode !== 'town') return;
        const rect = canvas.getBoundingClientRect();
        const px = ((ev.clientX - rect.left) / rect.width) * meta.w;
        const py = ((ev.clientY - rect.top) / rect.height) * meta.h;
        const mx = meta.zoom > 1.01 ? ((px - meta.w / 2) / meta.zoom + meta.hxN) : px;
        const my = meta.zoom > 1.01 ? ((py - meta.h / 2) / meta.zoom + meta.hyN) : py;
        const wx = Math.max(120, Math.min(meta.mapW - 120, (mx / meta.w) * meta.mapW));
        const wy = Math.max(120, Math.min(meta.mapH - 120, (my / meta.h) * meta.mapH));
        this.handlers.onMinimapClick?.(wx, wy);
      });
    }

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Compute camera transform for compass zoom (clamped inside map bounds so no black bars appear)
    ctx.save();
    if (zoom > 1.01) {
      const halfW = w / (2 * zoom);
      const halfH = h / (2 * zoom);
      const hxN = Math.max(halfW, Math.min(w - halfW, (heroX / mapW) * w));
      const hyN = Math.max(halfH, Math.min(h - halfH, (heroY / mapH) * h));
      ctx.translate(w / 2, h / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-hxN, -hyN);
    }

    // Draw real map background thumbnail
    const bgImg = this._getMinimapBg(bgUrl);
    if (bgImg) {
      ctx.globalAlpha = 0.85;
      ctx.drawImage(bgImg, 0, 0, w, h);
      ctx.globalAlpha = 1.0;
    } else {
      ctx.strokeStyle = 'rgba(200, 155, 60, 0.14)';
      ctx.beginPath();
      ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
      ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
      ctx.stroke();
    }

    if (mode === 'town') {
      // (底圖已直接顯示實景地形，不繪製藍色方框)

      // 2. 建築底座方塊
      ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
      for (const ob of obstacles || []) {
        const ox = (ob.x / mapW) * w;
        const oy = (ob.y / mapH) * h;
        const or = Math.max(2, (ob.radius / mapW) * w);
        ctx.fillRect(ox - or, oy - or * 0.7, or * 2, or * 1.4);
      }

      // 3. 設施與 NPC 分類色點
      let facCount = 0;
      for (const f of facilities || []) {
        if (f.action === 'modal_patrol_guard' || f.action === 'modal_patrol_villager') continue;
        facCount++;
        const fx = (f.x / mapW) * w;
        const fy = (f.y / mapH) * h;
        let color = '#7dd3fc';
        let r = 2.6;
        if (f.action === 'open_waypoint') { color = '#38bdf8'; r = 3.8; }
        else if (f.action === 'modal_portal') { color = '#c084fc'; r = 3.5; }
        else if (f.action?.startsWith('gimmick_')) { color = '#f97316'; r = 3.5; }
        else if (f.action === 'drawer_upgrade' || f.action === 'modal_blacksmith') color = '#fbbf24';
        else if (f.action === 'modal_alchemy') color = '#4ade80';
        else if (f.action === 'modal_market') color = '#f472b6';
        else if (f.action === 'drawer_skills' || f.action === 'modal_trainer') color = '#f87171';

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(fx, fy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. 動態巡邏衛兵與平民
      ctx.fillStyle = '#e0f2fe';
      for (const p of patrols || []) {
        const px = (p.x / mapW) * w;
        const py = (p.y / mapH) * h;
        ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
      }

      if (statusEl) {
        statusEl.textContent = `🏠 設施 ${facCount} 處｜🛡️ 巡邏 ${(patrols || []).length} 人｜${zoom.toFixed(1)}x`;
      }
    } else {
      // 戰鬥模式：障礙物 + 怪群（普通/精英/首領）
      ctx.fillStyle = 'rgba(100, 116, 139, 0.65)';
      for (const ob of obstacles || []) {
        const ox = (ob.x / mapW) * w;
        const oy = (ob.y / mapH) * h;
        ctx.fillRect(ox - 2, oy - 2, 4, 4);
      }

      let mobCnt = 0;
      let bossCnt = 0;
      let eliteCnt = 0;
      for (const m of monsters || []) {
        if (m.hp <= 0) continue;
        mobCnt++;
        const mx = (m.x / mapW) * w;
        const my = (m.y / mapH) * h;
        if (m.isBoss) {
          bossCnt++;
          ctx.strokeStyle = 'rgba(249, 115, 22, 0.85)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(mx, my, 6.2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#fb923c';
          ctx.beginPath();
          ctx.arc(mx, my, 3.8, 0, Math.PI * 2);
          ctx.fill();
        } else if (m.isElite) {
          eliteCnt++;
          ctx.fillStyle = '#c084fc';
          ctx.beginPath();
          ctx.moveTo(mx, my - 3.5);
          ctx.lineTo(mx + 3.5, my);
          ctx.lineTo(mx, my + 3.5);
          ctx.lineTo(mx - 3.5, my);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(mx, my, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (statusEl) {
        statusEl.textContent = (bossCnt > 0
          ? `👑 首領現身！｜👾 敵人 ${mobCnt} 隻`
          : `👾 剩餘敵人 ${mobCnt} 隻${eliteCnt > 0 ? `（精英 ${eliteCnt}）` : ''}`) + `｜${zoom.toFixed(1)}x`;
      }
    }

    // 主角綠點 + 視野光環 + 朝向箭頭
    const hx = (heroX / mapW) * w;
    const hy = (heroY / mapH) * h;
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(hx, hy, 6.5, 0, Math.PI * 2);
    ctx.stroke();

    let ang = Math.PI / 2;
    if (heroDir === 'up') ang = -Math.PI / 2;
    else if (heroDir === 'right') ang = heroFlipX ? Math.PI : 0;
    else if (heroDir === 'left') ang = Math.PI;

    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(ang);
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.moveTo(5.2, 0);
    ctx.lineTo(-3.2, -3.2);
    ctx.lineTo(-1.8, 0);
    ctx.lineTo(-3.2, 3.2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.restore();
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

  openTownFacilityModal(action, data, ctx) {
    const modal = document.getElementById('modal-town-facility');
    const titleEl = document.getElementById('town-modal-title');
    const bodyEl = document.getElementById('town-modal-body');
    const closeBtn = document.getElementById('btn-close-town-modal');
    if (!modal || !titleEl || !bodyEl) return;
    closeBtn.onclick = () => modal.classList.add('hidden');

    const st = this.getState();
    const npc = data?.npc || data || {};
    const portraitUrl = ctx.getPortrait?.(data?.atlasKey, data?.frame || npc?.frame) || '';
    const portraitHtml = portraitUrl ? `<img class="town-npc-portrait" src="${portraitUrl}" alt="${npc.name || ''}" />` : '';
    const resPills = `<div class="town-res-pills">
      <span class="town-res-pill" style="color:#fde047;">🪙 ${Math.floor(st.gold || 0).toLocaleString()} G</span>
      <span class="town-res-pill" style="color:#7dd3fc;">✨ ${Math.floor(st.dust || 0).toLocaleString()} 粉塵</span>
      <span class="town-res-pill" style="color:#d8b4fe;">💎 ${st.soulCrystals || 0} 魂晶</span>
    </div>`;
    const banner = npc.greeting
      ? `<div class="town-npc-banner">${portraitHtml}<div style="flex:1;"><b style="color:#fde68a;">${npc.title || ''} ${npc.name || ''}：</b>「${npc.greeting}」${resPills}</div></div>`
      : `<div class="town-npc-banner"><div style="flex:1;">${resPills}</div></div>`;

    if (action === 'modal_alchemy') {
      titleEl.textContent = '⚗️ 祕法煉金工坊・高階秘藥';
      const chMult = 1 + getChapterIdx(st.stage || 1) * 0.4;
      const brews = [
        { id: 'hp_refill', name: '🔴 補滿生命藥水', desc: '立即補滿戰鬥藥水次數並回復 100% 生命。', cost: 150 },
        { id: 'exp_pot', name: '🟡 濃稠經驗藥水 (60秒)', desc: '擊殺經驗值 +50%，可疊加持續時間。', cost: 300 },
        { id: 'fury_pot', name: '🟣 狂戰士藥水 (45秒)', desc: '攻速 +25%、暴擊率 +10%。', cost: 400 },
        { id: 'mf_pot', name: '🟢 黃金尋寶藥水 (60秒)', desc: '掉寶率 +40%、金幣獲取 +30%。', cost: 450 },
        { id: 'titan_pot', name: '🔥 泰坦巨力秘藥 (180秒)', desc: '高階秘藥：攻擊力 +30%、暴擊傷害 +40%。', cost: Math.round(1400 * chMult) },
        { id: 'iron_pot', name: '🛡️ 鋼鐵壁壘秘藥 (180秒)', desc: '高階秘藥：防禦力 +35%、減傷 +12%。', cost: Math.round(1400 * chMult) },
        { id: 'sage_pot', name: '🌟 秘法先知秘藥 (180秒)', desc: '高階秘藥：技能冷卻縮減 +18%、掉寶率 +50%。', cost: Math.round(1800 * chMult) },
      ];
      const nowTs = Date.now();
      const pb = st.potionBuffs || {};
      const remMap = {
        exp_pot: Math.max(0, Math.ceil(((pb.expUntil || 0) - nowTs) / 1000)),
        fury_pot: Math.max(0, Math.ceil(((pb.furyUntil || 0) - nowTs) / 1000)),
        mf_pot: Math.max(0, Math.ceil(((pb.mfUntil || 0) - nowTs) / 1000)),
        titan_pot: Math.max(0, Math.ceil(((pb.titanUntil || 0) - nowTs) / 1000)),
        iron_pot: Math.max(0, Math.ceil(((pb.ironUntil || 0) - nowTs) / 1000)),
        sage_pot: Math.max(0, Math.ceil(((pb.sageUntil || 0) - nowTs) / 1000)),
      };
      const bundleCost = Math.round(brews.slice(1).reduce((s, x) => s + x.cost, 0) * 0.9);
      bodyEl.innerHTML = banner + `
        <div class="town-section-title">
          <span>🧪 藥水煉製（即時顯示剩餘持續時間）</span>
          <button id="btn-brew-all" class="town-item-chip active" ${(st.gold || 0) < bundleCost ? 'disabled' : ''}>⚡ 9折一鍵打包飲用 (${bundleCost.toLocaleString()} G)</button>
        </div>
        <div class="town-option-grid">${brews.map((b) => {
          const rem = remMap[b.id] || 0;
          return `<div class="town-option-card">
            <div><h4>${b.name} ${rem > 0 ? `<span style="color:#4ade80;font-size:11px;">(剩 ${rem}s)</span>` : ''}</h4><p>${b.desc}</p></div>
            <button data-brew="${b.id}" ${(st.gold || 0) < b.cost ? 'disabled' : ''}>煉製購買（${b.cost.toLocaleString()} G）</button>
          </div>`;
        }).join('')}</div>`;
      bodyEl.querySelector('#btn-brew-all')?.addEventListener('click', () => {
        ctx.onBrewAllCombat?.(bundleCost);
        this.openTownFacilityModal(action, data, ctx);
      });
      bodyEl.querySelectorAll('button[data-brew]').forEach((btn) => {
        btn.onclick = () => {
          ctx.onBrewPotion(btn.dataset.brew);
          this.openTownFacilityModal(action, data, ctx);
        };
      });
    } else if (action === 'modal_bounty') {
      const stg = st.stage || 1;
      const isCh10 = stg >= 91;
      const isCh9 = stg >= 81 && stg < 91;
      const isCh8 = stg >= 71 && stg < 81;
      const isCh7 = stg >= 61 && stg < 71;
      const isCh6 = stg >= 51 && stg < 61;
      const isCh5 = stg >= 41 && stg < 51;
      const isCh4 = stg >= 31 && stg < 41;
      const isCh3 = stg >= 21 && stg < 31;
      const isCh2 = stg >= 11 && stg < 21;
      titleEl.textContent = isCh10 ? '📜 第 10 章・星圖天命懸賞羅盤' : (isCh9 ? '📜 第 9 章・審判庭紅蠟懸賞聖碑' : (isCh8 ? '📜 第 8 章・黃銅電弧懸賞觀測塔' : (isCh7 ? '📜 第 7 章・巫毒圖騰懸賞柱' : (isCh6 ? '📜 第 6 章・北歐符文懸賞巨石' : (isCh5 ? '📜 第 5 章・魔王通緝血契柱' : (isCh4 ? '📜 第 4 章・焦土戰功鐵碑' : (isCh3 ? '📜 第 3 章・墓園亡靈通緝碑' : (isCh2 ? '📜 第 2 章・地下洞窟懸賞石柱' : '📜 第 1 章・曙光哨站懸賞告示板'))))))));
      const bp = st.bountyProgress || { kills: st.kills || 0, bossKills: 0, claimed: {} };
      const quests = isCh10
        ? [
            { id: 'ch10_q1', name: '🌌 肅清混沌星界星靈與吞噬者', cur: st.kills || 0, goal: 25000, reward: '380,000 金幣 ＋ 高階稀有箱' },
            { id: 'ch10_q2', name: '🌠 討伐混沌星界終極泰坦首領', cur: bp.bossKills || 0, goal: 150, reward: '600,000 金幣 ＋ +2 技能點' },
            { id: 'ch10_q3', name: '🪐 永恆星辰聖域終局試煉', cur: st.kills || 0, goal: 32000, reward: '1,000,000 金幣 ＋ 神話保底箱' },
          ]
        : isCh9
        ? [
            { id: 'ch9_q1', name: '🌹 淨化血色修道院墮落審判官', cur: st.kills || 0, goal: 16000, reward: '210,000 金幣 ＋ 高階稀有箱' },
            { id: 'ch9_q2', name: '⚔️ 討伐血色大主教領主首領', cur: bp.bossKills || 0, goal: 100, reward: '320,000 金幣 ＋ +1 技能點' },
            { id: 'ch9_q3', name: '🔔 聖血薔薇修道院聖戰試煉', cur: st.kills || 0, goal: 20000, reward: '500,000 金幣 ＋ 傳說保底箱' },
          ]
        : isCh8
        ? [
            { id: 'ch8_q1', name: '⚡ 攔截風暴高塔電弧元素', cur: st.kills || 0, goal: 10500, reward: '120,000 金幣 ＋ 高階稀有箱' },
            { id: 'ch8_q2', name: '🌩️ 討伐雷鳴風暴泰坦首領', cur: bp.bossKills || 0, goal: 75, reward: '180,000 金幣 ＋ +1 技能點' },
            { id: 'ch8_q3', name: '⚙️ 蒼穹浮空城制空試煉', cur: st.kills || 0, goal: 13500, reward: '280,000 金幣 ＋ 傳說保底箱' },
          ]
        : isCh7
        ? [
            { id: 'ch7_q1', name: '🐸 肅清毒沼巨蛙與劇毒食人花', cur: st.kills || 0, goal: 6500, reward: '68,000 金幣 ＋ 高階稀有箱' },
            { id: 'ch7_q2', name: '🐍 討伐劇毒九頭蛇首領', cur: bp.bossKills || 0, goal: 55, reward: '95,000 金幣 ＋ +1 技能點' },
            { id: 'ch7_q3', name: '🌿 翠玉樹冠水寨守護試煉', cur: st.kills || 0, goal: 8500, reward: '150,000 金幣 ＋ 傳說保底箱' },
          ]
        : isCh6
        ? [
            { id: 'ch6_q1', name: '❄️ 獵殺永凍雪原冰狼與雪怪', cur: st.kills || 0, goal: 3800, reward: '36,000 金幣 ＋ 高階稀有箱' },
            { id: 'ch6_q2', name: '🧊 討伐冰霜泰坦首領', cur: bp.bossKills || 0, goal: 40, reward: '55,000 金幣 ＋ +1 技能點' },
            { id: 'ch6_q3', name: '🛡️ 英靈殿女武神試煉', cur: st.kills || 0, goal: 5200, reward: '88,000 金幣 ＋ 傳說保底箱' },
          ]
        : isCh5
        ? [
            { id: 'ch5_q1', name: '😈 肅清深淵聖殿魅魔與魔僕', cur: st.kills || 0, goal: 2200, reward: '18,000 金幣 ＋ 高階稀有箱' },
            { id: 'ch5_q2', name: '👑 討伐深淵將軍與魔王首領', cur: bp.bossKills || 0, goal: 28, reward: '30,000 金幣 ＋ +1 技能點' },
            { id: 'ch5_q3', name: '🩸 緋紅王庭血戰試煉', cur: st.kills || 0, goal: 3200, reward: '48,000 金幣 ＋ 傳說保底箱' },
          ]
        : isCh4
        ? [
            { id: 'ch4_q1', name: '🔥 清剿焦土炎魔與火蜥蜴', cur: st.kills || 0, goal: 1150, reward: '8,500 金幣 ＋ 高階稀有箱' },
            { id: 'ch4_q2', name: '🌋 討伐伊弗利特烈焰首領', cur: bp.bossKills || 0, goal: 18, reward: '15,000 金幣 ＋ +1 技能點' },
            { id: 'ch4_q3', name: '⚒️ 黑曜石熔爐宗師試煉', cur: st.kills || 0, goal: 1700, reward: '24,000 金幣 ＋ 傳說保底箱' },
          ]
        : isCh3
        ? [
            { id: 'ch3_q1', name: '💀 淨化白骨墓穴食屍鬼', cur: st.kills || 0, goal: 550, reward: '4,200 金幣 ＋ 高階稀有箱' },
            { id: 'ch3_q2', name: '👑 討伐白骨領主首領', cur: bp.bossKills || 0, goal: 10, reward: '7,500 金幣 ＋ +1 技能點' },
            { id: 'ch3_q3', name: '🕯️ 守夜人聖骨試煉', cur: st.kills || 0, goal: 900, reward: '12,000 金幣 ＋ 傳說保底箱' },
          ]
        : isCh2
        ? [
            { id: 'ch2_q1', name: '🍄 清剿巢穴哥布林與孢子怪', cur: st.kills || 0, goal: 200, reward: '1,800 金幣 ＋ 高階稀有箱' },
            { id: 'ch2_q2', name: '🕷️ 討伐地下巢穴首領', cur: bp.bossKills || 0, goal: 5, reward: '3,200 金幣 ＋ +1 技能點' },
            { id: 'ch2_q3', name: '⛏️ 深淵礦脈清道夫', cur: st.kills || 0, goal: 450, reward: '6,000 金幣 ＋ 傳說保底箱' },
          ]
        : [
            { id: 'ch1_q1', name: '🐺 清剿腐朽野狼群', cur: st.kills || 0, goal: 30, reward: '600 金幣 ＋ 稀有裝備箱' },
            { id: 'ch1_q2', name: '💀 討伐邊境首領（5/10 關）', cur: bp.bossKills || 0, goal: 2, reward: '1,200 金幣 ＋ +1 技能點' },
            { id: 'ch1_q3', name: '⚔️ 百戰哨兵試煉', cur: st.kills || 0, goal: 120, reward: '2,500 金幣 ＋ 傳說保底箱' },
          ];
      bodyEl.innerHTML = banner + `<div class="town-option-grid">${quests.map((q) => {
        const done = !!bp.claimed?.[q.id];
        const ready = !done && q.cur >= q.goal;
        return `<div class="town-option-card">
          <div><h4>${q.name}</h4><p>進度：${Math.min(q.cur, q.goal)} / ${q.goal}<br>獎勵：${q.reward}</p></div>
          <button data-bounty="${q.id}" ${ready ? '' : 'disabled'}>${done ? '已領取' : (ready ? '領取懸賞獎勵' : '進行中')}</button>
        </div>`;
      }).join('')}</div>`;
      bodyEl.querySelectorAll('button[data-bounty]').forEach((btn) => {
        btn.onclick = () => {
          ctx.onClaimBounty(btn.dataset.bounty);
          this.openTownFacilityModal(action, data, ctx);
        };
      });
    } else if (action === 'modal_market') {
      titleEl.textContent = '🎪 深淵黑市帳篷・定時貨架與保底盲盒';
      ctx.onEnsureMarketShelf?.();
      const bm = st.blackMarket || { nextRefreshAt: Date.now() + 1800000, items: [], pityCount: 0 };
      const pity = bm.pityCount || 0;
      const pityPct = Math.min(100, Math.round((pity / 10) * 100));
      const secLeft = Math.max(0, Math.ceil((bm.nextRefreshAt - Date.now()) / 1000));
      const mm = String(Math.floor(secLeft / 60)).padStart(2, '0');
      const ss = String(secLeft % 60).padStart(2, '0');
      const isCh2 = (st.stage || 1) >= 11;
      const baseCost = Math.max(350, (st.stage || 1) * 180);
      const stageCost = isCh2 ? Math.round(baseCost * 0.8) : baseCost;
      const highCost = stageCost * 3;
      const refreshCost = Math.max(500, Math.round(stageCost * 0.6));

      const shelfHtml = (bm.items || []).map((entry, idx) => {
        const it = entry.item;
        const rName = RARITIES[it.rarity]?.name || it.rarity;
        const rColor = RARITIES[it.rarity]?.color || '#e2e8f0';
        return `<div class="town-option-card">
          <div>
            <h4 style="color:${rColor}">${it.icon || '⚔️'} ${it.name}</h4>
            <p>${rName}・戰力 ${it.powerScore || 0}<br>${(it.affixes || []).slice(0, 2).map((a) => `${a.label}+${a.value}${a.unit}`).join(' / ') || '基礎屬性強化'}</p>
          </div>
          <button data-shelf="${idx}" ${entry.sold || (st.gold || 0) < entry.price ? 'disabled' : ''}>${entry.sold ? '已售出' : `直購 (${entry.price.toLocaleString()} G)`}</button>
        </div>`;
      }).join('');

      bodyEl.innerHTML = banner + `
        <div class="bm-pity-wrap">
          <div style="display:flex;justify-content:space-between;font-size:12px;">
            <span>🎯 <b>黑市貴賓傳說保底：</b>${pity >= 10 ? '<span style="color:#fb923c">已達保底！下次盲盒必出傳說！</span>' : `${pity} / 10 次`}</span>
            <span style="color:#94a3b8;">貨架刷新倒數：${mm}:${ss}</span>
          </div>
          <div class="bm-pity-bar"><div class="bm-pity-fill" style="width:${pityPct}%"></div></div>
        </div>
        <div class="town-section-title">
          <span>🛒 黑市限時特賣貨架 (每30分自動刷新)</span>
          <button id="btn-bm-refresh" class="town-item-chip" ${(st.gold || 0) < refreshCost ? 'disabled' : ''}>🔄 立即刷新 (${refreshCost.toLocaleString()} G)</button>
        </div>
        <div class="bm-shelf-grid">${shelfHtml}</div>
        <div class="town-section-title"><span>🎲 神秘盲盒鑑定</span></div>
        <div class="town-option-grid">
          <div class="town-option-card">
            <div><h4>🎲 神秘黑市裝備盲盒</h4><p>隨機鑑定 精良～傳說 裝備，累積 +1 保底點數。</p></div>
            <button id="btn-gamble-std" ${(st.gold || 0) < stageCost ? 'disabled' : ''}>購買鑑定（${stageCost.toLocaleString()} G）</button>
          </div>
          <div class="town-option-card">
            <div><h4>💎 走私者高階秘寶箱</h4><p>保證 稀有 以上品質，大幅提高傳說機率，累積 +2 保底點數！</p></div>
            <button id="btn-gamble-high" ${(st.gold || 0) < highCost ? 'disabled' : ''}>購買高階盲盒（${highCost.toLocaleString()} G）</button>
          </div>
        </div>`;
      bodyEl.querySelectorAll('button[data-shelf]').forEach((btn) => {
        btn.onclick = () => { ctx.onBuyMarketShelf?.(Number(btn.dataset.shelf)); this.openTownFacilityModal(action, data, ctx); };
      });
      const brf = bodyEl.querySelector('#btn-bm-refresh');
      if (brf) brf.onclick = () => { ctx.onRefreshMarketShelf?.(refreshCost); this.openTownFacilityModal(action, data, ctx); };
      const b1 = bodyEl.querySelector('#btn-gamble-std');
      const b2 = bodyEl.querySelector('#btn-gamble-high');
      if (b1) b1.onclick = () => { ctx.onGambleGear(stageCost, false); this.openTownFacilityModal(action, data, ctx); };
      if (b2) b2.onclick = () => { ctx.onGambleGear(highCost, true); this.openTownFacilityModal(action, data, ctx); };
    } else if (action === 'modal_weaver') {
      titleEl.textContent = '🌌 星界編織者・伊莉雅的終極贈禮';
      const claimed = !!st.ch10WeaverGiftClaimed;
      bodyEl.innerHTML = banner + `<div class="town-option-card">
        <div><h4>🎁 永恆星辰聖域終極秘藏</h4><p>內含：150,000 金幣 ＋ 狂暴藥水 ＋ 尋寶藥水！<br>提示：中央「旋轉黑洞星象儀」可賜予永恆星辰祝福，南門「銀河許願泉」可回滿狀態。</p></div>
        <button id="btn-claim-weaver" ${claimed ? 'disabled' : ''}>${claimed ? '已領取終極贈禮' : '領取星界終極贈禮'}</button>
      </div>`;
      const bwv = bodyEl.querySelector('#btn-claim-weaver');
      if (bwv) bwv.onclick = () => { ctx.onClaimWeaverGift(); this.openTownFacilityModal(action, data, ctx); };
    } else if (action === 'modal_penitent') {
      titleEl.textContent = '🌹 苦行聖女・特蕾莎的聖光賜福';
      const claimed = !!st.ch9PenitentGiftClaimed;
      bodyEl.innerHTML = banner + `<div class="town-option-card">
        <div><h4>🎁 聖血薔薇修道院賜福包</h4><p>內含：80,000 金幣 ＋ 尋寶藥水（60 秒 掉寶+40%、金幣+30%）！<br>提示：中央「垂淚聖母血泉」可賜予聖血薔薇祝福，南門「黃金大鐘」可降下聖光回滿狀態。</p></div>
        <button id="btn-claim-penitent" ${claimed ? 'disabled' : ''}>${claimed ? '已領取聖女賜福' : '領取聖女賜福'}</button>
      </div>`;
      const bpn = bodyEl.querySelector('#btn-claim-penitent');
      if (bpn) bpn.onclick = () => { ctx.onClaimPenitentGift(); this.openTownFacilityModal(action, data, ctx); };
    } else if (action === 'modal_engineer') {
      titleEl.textContent = '⚙️ 風暴首席工程師・艾迪生的蒼穹補給';
      const claimed = !!st.ch8EngineerGiftClaimed;
      bodyEl.innerHTML = banner + `<div class="town-option-card">
        <div><h4>🎁 蒼穹電弧首席工程包</h4><p>內含：50,000 金幣 ＋ 狂暴藥水（45 秒 攻速+25%、暴擊+10%）！<br>提示：中央「聚雷磁能核心球」可賜予蒼穹雷霆祝福，南側「蓄電共鳴特斯拉線圈」可回滿狀態。</p></div>
        <button id="btn-claim-engineer" ${claimed ? 'disabled' : ''}>${claimed ? '已領取工程師補給' : '領取蒼穹補給'}</button>
      </div>`;
      const beg = bodyEl.querySelector('#btn-claim-engineer');
      if (beg) beg.onclick = () => { ctx.onClaimEngineerGift(); this.openTownFacilityModal(action, data, ctx); };
    } else if (action === 'modal_witchdoctor') {
      titleEl.textContent = '🎭 沼澤巫醫長・祖爾的部族聖禮';
      const claimed = !!st.ch7WitchdoctorGiftClaimed;
      bodyEl.innerHTML = banner + `<div class="town-option-card">
        <div><h4>🎁 翠玉樹冠巫醫補給箱</h4><p>內含：30,000 金幣 ＋ 經驗藥水（60 秒 +50% 經驗）！<br>提示：中央「翡翠毒液瀑布池」可賜予翠玉生機祝福，南門「沼澤巫毒號角柱」可召喚螢火蟲回滿狀態。</p></div>
        <button id="btn-claim-witchdoctor" ${claimed ? 'disabled' : ''}>${claimed ? '已領取部族聖禮' : '領取部族聖禮'}</button>
      </div>`;
      const bwd = bodyEl.querySelector('#btn-claim-witchdoctor');
      if (bwd) bwd.onclick = () => { ctx.onClaimWitchdoctorGift(); this.openTownFacilityModal(action, data, ctx); };
    } else if (action === 'modal_shaman') {
      titleEl.textContent = '❄️ 極地先知長老・奧丁森的北境贈禮';
      const claimed = !!st.ch6ShamanGiftClaimed;
      bodyEl.innerHTML = banner + `<div class="town-option-card">
        <div><h4>🎁 極光冰晶先知補給袋</h4><p>內含：18,000 金幣 ＋ 狂暴藥水（45 秒 攻速+25%、暴擊+10%）！<br>提示：中央「永凍極光水晶塔」可賜予極光祝福，南側「北歐符文暖火盆」可回滿狀態。</p></div>
        <button id="btn-claim-shaman" ${claimed ? 'disabled' : ''}>${claimed ? '已領取先知贈禮' : '領取北境贈禮'}</button>
      </div>`;
      const bsh = bodyEl.querySelector('#btn-claim-shaman');
      if (bsh) bsh.onclick = () => { ctx.onClaimShamanGift(); this.openTownFacilityModal(action, data, ctx); };
    } else if (action === 'modal_contractor') {
      titleEl.textContent = '📜 墮落契約官・墨菲斯托的黃金魔契';
      const claimed = !!st.ch5ContractorGiftClaimed;
      bodyEl.innerHTML = banner + `<div class="town-option-card">
        <div><h4>🎁 緋紅王庭魔契補給箱</h4><p>內含：10,000 金幣 ＋ 尋寶藥水（60 秒 掉寶+40%、金幣+30%）！<br>提示：中央「深淵召喚巨陣」可賜予魔王血契祝福，南門「猩紅聖血聖杯座」可回滿狀態。</p></div>
        <button id="btn-claim-contractor" ${claimed ? 'disabled' : ''}>${claimed ? '已簽訂王庭魔契' : '簽訂領取補給'}</button>
      </div>`;
      const bct = bodyEl.querySelector('#btn-claim-contractor');
      if (bct) bct.onclick = () => { ctx.onClaimContractorGift(); this.openTownFacilityModal(action, data, ctx); };
    } else if (action === 'modal_forgemaster') {
      titleEl.textContent = '🔥 火元素鍛造宗師・赫菲斯的贈禮';
      const claimed = !!st.ch4ForgemasterGiftClaimed;
      bodyEl.innerHTML = banner + `<div class="town-option-card">
        <div><h4>🎁 黑曜石熔爐宗師補給</h4><p>內含：5,000 金幣 ＋ 狂暴藥水（45 秒 攻速+25%、暴擊+10%）！<br>提示：中央火山島「雙頭巨龍熔岩噴泉」可賜予熔爐狂怒祝福。</p></div>
        <button id="btn-claim-forgemaster" ${claimed ? 'disabled' : ''}>${claimed ? '已領取宗師贈禮' : '領取宗師贈禮'}</button>
      </div>`;
      const bfg = bodyEl.querySelector('#btn-claim-forgemaster');
      if (bfg) bfg.onclick = () => { ctx.onClaimForgemasterGift(); this.openTownFacilityModal(action, data, ctx); };
    } else if (action === 'modal_chronicler') {
      titleEl.textContent = '🪶 亡靈記錄者・阿爾文的墓穴手札';
      const claimed = !!st.ch3ChroniclerGiftClaimed;
      bodyEl.innerHTML = banner + `<div class="town-option-card">
        <div><h4>🎁 守夜人聖骨補給匣</h4><p>內含：2,500 金幣 ＋ 尋寶藥水（60 秒 掉寶+40%、金幣+30%）！<br>提示：中央「靈魂永恆火盆」可賜予魂火祝福，南側「祈禱幽藍燭台」可隨時回滿狀態。</p></div>
        <button id="btn-claim-chronicler" ${claimed ? 'disabled' : ''}>${claimed ? '已領取記錄者補給' : '領取聖骨補給'}</button>
      </div>`;
      const bch = bodyEl.querySelector('#btn-claim-chronicler');
      if (bch) bch.onclick = () => { ctx.onClaimChroniclerGift(); this.openTownFacilityModal(action, data, ctx); };
    } else if (action === 'modal_smuggler') {
      titleEl.textContent = '🎒 洞窟走私客・尼克的黑貨見面禮';
      const claimed = !!st.ch2SmugglerGiftClaimed;
      bodyEl.innerHTML = banner + `<div class="town-option-card">
        <div><h4>🎁 地下黑市走私補給袋</h4><p>內含：1,200 金幣 ＋ 狂暴藥水（45 秒 攻速+25%、暴擊+10%）！<br>提示：點擊中央「螢光孢子噴泉」或西側「高壓蒸汽閥門」可觸發洞窟機關。</p></div>
        <button id="btn-claim-smuggler" ${claimed ? 'disabled' : ''}>${claimed ? '已領取走私客見面禮' : '領取見面禮'}</button>
      </div>`;
      const bsm = bodyEl.querySelector('#btn-claim-smuggler');
      if (bsm) bsm.onclick = () => { ctx.onClaimSmugglerGift(); this.openTownFacilityModal(action, data, ctx); };
    } else if (action === 'modal_scout') {
      titleEl.textContent = '🏹 邊境斥候長・莉娜的哨站補給';
      const claimed = !!st.ch1ScoutGiftClaimed;
      bodyEl.innerHTML = banner + `<div class="town-option-card">
        <div><h4>🎁 曙光哨站新人補給包</h4><p>內含：500 金幣 ＋ 經驗藥水（60 秒 +50% 經驗）！<br>提示：點擊城中央「曙光烽火台」可獲得 5 分鐘全屬性祝福。</p></div>
        <button id="btn-claim-scout" ${claimed ? 'disabled' : ''}>${claimed ? '已領取哨站補給' : '領取斥候補給'}</button>
      </div>`;
      const bs = bodyEl.querySelector('#btn-claim-scout');
      if (bs) bs.onclick = () => { ctx.onClaimScoutGift(); this.openTownFacilityModal(action, data, ctx); };
    } else if (action === 'modal_tavern') {
      titleEl.textContent = `🍺 ${data?.name || '冒險者酒館'}`;
      const chIdx = getChapterIdx(st.stage || 1);
      const feastCost = (chIdx + 1) * 350;
      bodyEl.innerHTML = banner + `<div class="town-option-grid">
        <div class="town-option-card">
          <div><h4>🛏️ 免費休憩整頓</h4><p>在酒館壁爐旁稍作歇息，立即回滿 100% 生命與魔力。</p></div>
          <button id="btn-tavern-rest">免費休憩回滿</button>
        </div>
        <div class="town-option-card">
          <div><h4>🍖 冒險者大餐與麥酒 (30分鐘)</h4><p>獲得 30 分鐘「酒館飽足」祝福：打怪經驗 +15%、金幣 +15%！</p></div>
          <button id="btn-tavern-feast" ${(st.gold || 0) < feastCost ? 'disabled' : ''}>點購大餐（${feastCost.toLocaleString()} G）</button>
        </div>
      </div>`;
      bodyEl.querySelector('#btn-tavern-rest').onclick = () => { ctx.onTavernRest(); modal.classList.add('hidden'); };
      bodyEl.querySelector('#btn-tavern-feast').onclick = () => { ctx.onTavernFeast(feastCost); this.openTownFacilityModal(action, data, ctx); };
    } else if (action === 'modal_tower') {
      const chIdx = getChapterIdx(st.stage || 1);
      titleEl.textContent = `🔭 ${data?.name || '瞭望哨塔'}・第 ${chIdx + 1} 章怪物圖鑑`;
      const pool = ZONE_POOLS[chIdx] || ZONE_POOLS[0];
      const cards = pool.map((mid, i) => {
        const m = MONSTER_TEMPLATES[mid];
        if (!m) return '';
        const isBoss = i === 9;
        const dropTxt = isBoss ? '首領掉裝 100%・技能點' : (i >= 7 ? '高階精英掉裝 50%' : '普通掉裝 5%・藥水 14%');
        return `<div class="codex-card ${isBoss ? 'is-boss' : ''}"><b>${isBoss ? '👑 ' : ''}${m.name}</b><br>特性：${m.atkStyle || '近戰'}｜${dropTxt}</div>`;
      }).join('');
      bodyEl.innerHTML = banner + `<div class="codex-grid">${cards}</div>`;
    } else if (action === 'modal_patrol_guard') {
      const chIdx = getChapterIdx(st.stage || 1);
      const pool = ZONE_POOLS[chIdx] || ZONE_POOLS[0];
      const boss = MONSTER_TEMPLATES[pool[9]];
      const cdLeft = Math.max(0, Math.ceil(((st.guardBlessCdUntil || 0) - Date.now()) / 1000));
      titleEl.textContent = `🛡️ ${data?.name || '城防巡邏衛兵'}`;
      bodyEl.innerHTML = banner + `<div class="town-option-card">
        <div><h4>📋 本章首領情報：${boss?.name || '章節首領'}</h4><p>出沒於第 ${chIdx + 1}-5 與 ${chIdx + 1}-10 關！建議在主城點燃中央地標祝福並飲用狂暴藥水後再前往討伐。</p></div>
        <button id="btn-guard-bless" ${cdLeft > 0 ? 'disabled' : ''}>${cdLeft > 0 ? `衛兵激勵冷卻中 (${cdLeft}s)` : '領取衛兵激勵（3分鐘 防禦+10%）'}</button>
      </div>`;
      bodyEl.querySelector('#btn-guard-bless').onclick = () => { ctx.onGuardBlessing(); this.openTownFacilityModal(action, data, ctx); };
    } else if (action === 'modal_patrol_villager') {
      const cdLeft = Math.max(0, Math.ceil(((st.villagerGiftCdUntil || 0) - Date.now()) / 1000));
      titleEl.textContent = `💬 ${data?.name || '城鎮旅人'}`;
      bodyEl.innerHTML = banner + `<div class="town-option-card">
        <div><h4>🎁 旅人的熱情贈禮</h4><p>城鎮裡的居民很感謝你的守護！每隔 3 分鐘可向巡邏平民領取一次旅途盤纏或補給。</p></div>
        <button id="btn-villager-gift" ${cdLeft > 0 ? 'disabled' : ''}>${cdLeft > 0 ? `冷卻中 (${cdLeft}s)` : '收下旅人贈禮'}</button>
      </div>`;
      bodyEl.querySelector('#btn-villager-gift').onclick = () => { ctx.onVillagerGift(); this.openTownFacilityModal(action, data, ctx); };
    } else if (action === 'modal_blacksmith') {
      titleEl.textContent = '🔨 鐵匠鍛造工坊・詞綴洗鍊與精煉';
      const eqList = Object.entries(st.equipment || {})
        .filter(([, it]) => !!it)
        .map(([slot, it]) => ({ uid: it.uid, isEq: true, slot, item: it }));
      const bagList = (st.inventory || [])
        .filter((it) => it && (it.rarity === 'rare' || it.rarity === 'legendary' || it.rarity === 'magic'))
        .slice(0, 12)
        .map((it) => ({ uid: it.uid, isEq: false, slot: it.slot, item: it }));
      const allTargets = [...eqList, ...bagList];
      if (!this._bsSelectedUid || !allTargets.some((t) => t.uid === this._bsSelectedUid)) {
        this._bsSelectedUid = allTargets[0]?.uid || null;
      }
      const curTarget = allTargets.find((t) => t.uid === this._bsSelectedUid) || null;
      const chipsHtml = allTargets.map((t) => {
        const it = t.item;
        const lvTag = (it.upgradeLevel || 0) > 0 ? ` +${it.upgradeLevel}` : '';
        return `<button class="town-item-chip rarity-${it.rarity} ${t.uid === this._bsSelectedUid ? 'active' : ''}" data-bs-uid="${it.uid}">${t.isEq ? '[穿戴]' : '[背包]'} ${it.icon || ''}${it.name}${lvTag}</button>`;
      }).join('');

      let detailHtml = '<p style="color:#94a3b8;">目前沒有可鍛造的裝備。</p>';
      if (curTarget) {
        const it = curTarget.item;
        const lv = it.upgradeLevel || 0;
        const rerollCost = Math.max(200, (it.level || 1) * 120 * (it.rarity === 'legendary' ? 2 : 1));
        const refineCost = Math.max(300, (it.level || 1) * 160 * (lv + 1));
        const bless = it.refineBless || 0;
        const succRate = Math.min(100, (lv < 3 ? 100 : (lv < 6 ? 80 : 60)) + bless);
        const rDelta = it._lastRerollDelta;
        const deltaHtml = (typeof rDelta === 'number')
          ? `<span style="margin-left:6px;font-weight:800;color:${rDelta >= 0 ? '#4ade80' : '#f87171'};">(${rDelta >= 0 ? '▲+' : '▼'}${rDelta})</span>`
          : '';
        const rColor = RARITIES[it.rarity]?.color || '#e2e8f0';
        const statName = STAT_LABELS[it.baseStat?.key] || it.baseStat?.key || '基礎';
        detailHtml = `
          <div class="town-affix-box">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <b style="color:${rColor};font-size:14px;">${it.icon || '⚔️'} ${it.name} ${lv > 0 ? `<span style="color:#38bdf8;">+${lv}</span>` : ''}</b>
              <span style="color:#fde047;">戰力評分：${it.powerScore || 0}${deltaHtml}</span>
            </div>
            <div style="color:#cbd5e1;">主屬性：${statName} +${Math.round((it.baseStat?.value || 0) * (1 + lv * 0.12))}</div>
            <div style="color:#93c5fd;margin-top:4px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;"><span>隨機詞綴：</span>${(it.affixes || []).length ? it.affixes.map((a, ai) => `<button type="button" data-bs-lock="${ai}" style="padding:2px 7px;border-radius:5px;border:1px solid ${this._bsLockIdx === ai ? '#fbbf24' : 'rgba(147,197,253,0.4)'};background:${this._bsLockIdx === ai ? 'rgba(120,53,15,0.45)' : 'rgba(15,23,42,0.75)'};color:${this._bsLockIdx === ai ? '#fde047' : '#bfdbfe'};font-size:11px;cursor:pointer;">${this._bsLockIdx === ai ? '🔒' : '🔓'} ${a.label} +${a.value}${a.unit}</button>`).join('') : '<span>無隨機詞綴</span>'}</div>
            ${it.legendaryEffect ? `<div style="color:#fb923c;margin-top:4px;">★ 傳奇特效：${it.legendaryEffect.name} — ${it.legendaryEffect.desc}</div>` : ''}
          </div>
          <div class="town-option-grid">
            <div class="town-option-card">
              <div><h4>🎲 詞綴重鑄洗鍊</h4><p>保留部位與傳奇特效，重新隨機抽取所有詞綴屬性。</p></div>
              <button id="btn-bs-reroll" ${(st.gold || 0) < rerollCost || (it.affixes || []).length === 0 ? 'disabled' : ''}>洗鍊詞綴 (${rerollCost.toLocaleString()} G)</button>
            </div>
            <div class="town-option-card">
              <div><h4>⚒️ 裝備強化 (+${lv} → +${Math.min(10, lv + 1)})</h4><p>每級提升基礎屬性 +12%（本次成功率 <b style="color:#fde047;">${succRate}%</b>｜+6以上失敗可能降1階，保護石剩餘 ${st.protectStones || 0} 顆）。</p>${lv >= 5 ? `<label style="font-size:11.5px;color:#86efac;display:flex;align-items:center;gap:6px;margin-top:4px;"><input type="checkbox" id="chk-bs-protect" ${(st.protectStones || 0) > 0 ? 'checked' : 'disabled'} /> 使用保護石防降階</label>` : ''}</div>
              <button id="btn-bs-refine" ${lv >= 10 || (st.gold || 0) < refineCost || (st.dust || 0) < refineDust ? 'disabled' : ''}>${lv >= 10 ? '已達精煉上限 (+10)' : `進行強化 (${refineCost.toLocaleString()} G${refineDust ? ` + ${refineDust}粉` : ''})`}</button>
            </div>
          </div>`;
      }

      bodyEl.innerHTML = banner + `
        <div class="town-section-title">
          <span>選擇要鍛造的裝備</span>
          <button id="btn-bs-drawer" class="town-item-chip">⚙️ 開啟全身部位強化面板 (U)</button>
        </div>
        <div class="town-item-selector">${chipsHtml}</div>
        ${detailHtml}`;
      bodyEl.querySelectorAll('button[data-bs-uid]').forEach((btn) => {
        btn.onclick = () => { this._bsSelectedUid = btn.dataset.bsUid; this._bsLockIdx = -1; this.openTownFacilityModal(action, data, ctx); };
      });
      bodyEl.querySelectorAll('button[data-bs-lock]').forEach((btn) => {
        btn.onclick = () => { const li = Number(btn.dataset.bsLock); this._bsLockIdx = this._bsLockIdx === li ? -1 : li; this.openTownFacilityModal(action, data, ctx); };
      });
      bodyEl.querySelector('#btn-bs-drawer')?.addEventListener('click', () => { modal.classList.add('hidden'); ctx.onOpenDrawer?.('upgrade'); });
      bodyEl.querySelector('#btn-bs-reroll')?.addEventListener('click', () => {
        if (curTarget) ctx.onRerollItem?.(curTarget.uid, curTarget.isEq, this._bsLockIdx ?? -1);
        this.openTownFacilityModal(action, data, ctx);
      });
      bodyEl.querySelector('#btn-bs-refine')?.addEventListener('click', () => {
        if (curTarget) ctx.onRefineItem?.(curTarget.uid, curTarget.isEq, !!bodyEl.querySelector('#chk-bs-protect')?.checked);
        this.openTownFacilityModal(action, data, ctx);
      });
    } else if (action === 'modal_trainer') {
      titleEl.textContent = '⚔️ 技能訓練師・木樁測試與流派預設';
      const cid = st.classId || 'warrior';
      const presets = st.skillPresetsByClass?.[cid] || [null, null, null];
      const presetNames = ['預設 A (清圖群攻)', '預設 B (單體首領)', '預設 C (自訂流派)'];
      const curSkills = st.equippedSkillsByClass?.[cid] || [null, null, null];
      const bestDps = Math.round(st.bestDummyDps || 0);
      const cs = ctx.getComputedStats?.() || { atk: 100, critRate: 10, critDmg: 150, atkSpeed: 1, skillDmgMult: 1, dps: 150 };

      bodyEl.innerHTML = banner + `
        <div class="dps-meter-box">
          <div style="font-size:12px;color:#94a3b8;">🪵 10 秒木樁實戰演練（依當前屬性、爆擊率、技能倍率模擬）</div>
          <div class="dps-big-num" id="dummy-dps-val">${bestDps > 0 ? `最高紀錄 ${bestDps.toLocaleString()} DPS` : '尚未測試'}</div>
          <div id="dummy-dps-sub" style="font-size:12px;color:#cbd5e1;margin-bottom:8px;">面板預估秒傷：${Math.round(cs.dps || 0).toLocaleString()}｜暴擊率：${Math.round(cs.critRate || 0)}%</div>
          <button id="btn-start-dummy" class="town-item-chip active" style="padding:7px 18px;font-weight:700;">⚔️ 開始 10 秒木樁實戰測試</button>
        </div>
        <div class="town-section-title">
          <span>📋 職業技能組快速預設（當前：${curSkills.map((s) => s || '空').join(' / ')}）</span>
          <button id="btn-tr-drawer" class="town-item-chip">📖 開啟天賦與技能面板 (K)</button>
        </div>
        <div class="preset-row">${presetNames.map((nm, i) => {
          const saved = presets[i];
          return `<div class="town-option-card" style="padding:8px;">
            <div><h4 style="font-size:12px;">${nm}</h4><p style="font-size:11px;">${saved ? saved.map((s) => s || '空').join(' / ') : '尚未儲存'}</p></div>
            <div style="display:flex;gap:4px;">
              <button data-save-preset="${i}" style="flex:1;font-size:11px;">💾 儲存</button>
              <button data-apply-preset="${i}" ${saved ? '' : 'disabled'} style="flex:1;font-size:11px;">⚡ 套用</button>
            </div>
          </div>`;
        }).join('')}</div>`;

      bodyEl.querySelector('#btn-tr-drawer')?.addEventListener('click', () => { modal.classList.add('hidden'); ctx.onOpenDrawer?.('skills'); });
      bodyEl.querySelectorAll('button[data-save-preset]').forEach((b) => {
        b.onclick = () => { ctx.onSaveSkillPreset?.(Number(b.dataset.savePreset)); this.openTownFacilityModal(action, data, ctx); };
      });
      bodyEl.querySelectorAll('button[data-apply-preset]').forEach((b) => {
        b.onclick = () => { ctx.onApplySkillPreset?.(Number(b.dataset.applyPreset)); this.openTownFacilityModal(action, data, ctx); };
      });

      const dummyBtn = bodyEl.querySelector('#btn-start-dummy');
      if (dummyBtn) {
        dummyBtn.onclick = () => {
          if (this._dummyTimer) clearInterval(this._dummyTimer);
          dummyBtn.disabled = true;
          let ticks = 0;
          const totalTicks = 40; // 10 seconds @ 250ms
          let totalDmg = 0;
          let maxCrit = 0;
          const valEl = bodyEl.querySelector('#dummy-dps-val');
          const subEl = bodyEl.querySelector('#dummy-dps-sub');
          this._dummyTimer = setInterval(() => {
            if (modal.classList.contains('hidden')) { clearInterval(this._dummyTimer); return; }
            ticks += 1;
            const elapsedSec = ticks * 0.25;
            const baseHit = (cs.atk || 50) * (cs.atkSpeed || 1) * 0.25 * (cs.skillDmgMult || 1) * (0.9 + Math.random() * 0.25);
            const isCrit = Math.random() * 100 < (cs.critRate || 10);
            const hit = Math.round(baseHit * (isCrit ? (cs.critDmg || 150) / 100 : 1));
            totalDmg += hit;
            if (hit > maxCrit) maxCrit = hit;
            const curDps = Math.round(totalDmg / elapsedSec);
            if (valEl) valEl.textContent = `${curDps.toLocaleString()} DPS`;
            if (subEl) subEl.textContent = `剩餘 ${(10 - elapsedSec).toFixed(1)}s｜累計傷害：${totalDmg.toLocaleString()}｜最高單發：${maxCrit.toLocaleString()}${isCrit ? ' 💥暴擊' : ''}`;
            if (ticks >= totalTicks) {
              clearInterval(this._dummyTimer);
              dummyBtn.disabled = false;
              const grade = curDps >= (cs.dps || 100) * 1.15 ? '🏆 S級爆發' : (curDps >= (cs.dps || 100) * 0.9 ? '⚔️ A級穩定' : '🛡️ B級待強化');
              if (valEl) valEl.textContent = `${curDps.toLocaleString()} DPS (${grade})`;
              dummyBtn.textContent = '🔁 再測一次 10 秒木樁';
              ctx.onRecordDummyDps?.(curDps, totalDmg, maxCrit);
            }
          }, 250);
        };
      }
    } else if (action === 'modal_portal') {
      titleEl.textContent = '🌀 跨章節主城星門傳送驛站';
      const townNames = [
        '第1章・曙光哨站堡壘', '第2章・地下菌菇黑市', '第3章・守夜人聖骨禮拜堂', '第4章・黑曜石熔爐要塞', '第5章・緋紅魔獄王庭',
        '第6章・極光冰晶堡', '第7章・翠玉樹冠水寨', '第8章・蒼穹電弧浮空城', '第9章・聖血薔薇修道院', '第10章・永恆星辰聖域',
      ];
      const maxUnlockedCh = Math.min(9, getChapterIdx(st.maxStageReached || st.maxStage || st.stage || 1));
      const curTownCh = data?.chapterIdx ?? getChapterIdx(st.stage || 1);
      const chCards = townNames.map((tName, idx) => {
        const unlocked = idx <= maxUnlockedCh;
        const isCur = idx === curTownCh;
        return `<div class="portal-chapter-card ${isCur ? 'is-current' : ''}">
          <div style="font-size:12px;font-weight:700;color:${isCur ? '#7dd3fc' : '#e2e8f0'}">${tName}</div>
          <button data-tp-ch="${idx}" ${isCur ? 'disabled' : ''}>${isCur ? '目前所在主城' : (unlocked ? '🌀 傳送至此主城' : '🔭 搶先觀光傳送')}</button>
        </div>`;
      }).join('');

      bodyEl.innerHTML = banner + `<div class="town-option-grid">
        <div class="town-option-card">
          <div><h4>⚔️ 立即出城戰鬥</h4><p>返回當前關卡前線，繼續自動巡邏刷怪掉寶。</p></div>
          <button id="btn-portal-battle">出城進入戰鬥</button>
        </div>
        <div class="town-option-card">
          <div><h4>🗺️ 開啟世界大地圖</h4><p>選擇要傳送挑戰的章節與第 1–10 小關卡。</p></div>
          <button id="btn-portal-map">開啟大地圖選關</button>
        </div>
      </div>
      <div class="town-section-title"><span>🌌 跨章節主城星門傳送陣</span></div>
      <div class="portal-chapter-grid">${chCards}</div>`;
      bodyEl.querySelector('#btn-portal-battle').onclick = () => { modal.classList.add('hidden'); ctx.onExitTown(); };
      bodyEl.querySelector('#btn-portal-map').onclick = () => { modal.classList.add('hidden'); ctx.onOpenWorldMap(); };
      bodyEl.querySelectorAll('button[data-tp-ch]').forEach((btn) => {
        btn.onclick = () => { modal.classList.add('hidden'); ctx.onTeleportTown?.(Number(btn.dataset.tpCh)); };
      });
    } else if (action === 'modal_waypoint') {
      titleEl.textContent = '🧭 主城快速傳送陣';
      const wps = ctx.getWaypoints?.() || [];
      const curCh = data?.chapterIdx ?? getChapterIdx(st.stage || 1);
      const maxCh = Math.min(9, getChapterIdx(st.maxStageReached || st.maxStage || st.stage || 1));
      const townNames = [
        '第1章・曙光哨站', '第2章・菌菇黑市', '第3章・聖骨教堂', '第4章・黑曜熔爐', '第5章・緋紅王庭',
        '第6章・極光冰堡', '第7章・翠玉水寨', '第8章・蒼穹浮空城', '第9章・聖血修道院', '第10章・星辰聖域',
      ];
      const wpHtml = wps.map((w, idx) => `<button class="waypoint-btn" data-wp-idx="${idx}">${w.label}</button>`).join('');
      const chHtml = townNames.map((nm, idx) => {
        const isCur = idx === curCh;
        return `<button class="waypoint-btn" data-wp-ch="${idx}" ${isCur ? 'disabled' : ''}>${isCur ? '📍 ' : (idx <= maxCh ? '🌀 ' : '🔭 ')}${nm}</button>`;
      }).join('');
      const maxStg = st.maxStageReached || st.stage || 1;
      const quickStages = [curCh * 10 + 1, curCh * 10 + 5, curCh * 10 + 10].filter((s) => s <= maxStg);

      bodyEl.innerHTML = `
        <div class="town-section-title"><span>⚡ 城內設施一鍵瞬移</span><span style="color:#94a3b8;font-size:11px;">點擊即刻抵達 NPC 身旁</span></div>
        <div class="waypoint-grid">${wpHtml}</div>
        <div class="town-section-title"><span>⚔️ 快速出城至本章關卡</span></div>
        <div class="waypoint-grid">
          <button class="waypoint-btn" id="btn-wp-exit-cur">⚔️ 繼續當前關卡 (${getStageLabel(st.stage || 1)})</button>
          ${quickStages.map((s) => `<button class="waypoint-btn" data-wp-stg="${s}">🚀 出城打第 ${getStageLabel(s)} 關</button>`).join('')}
        </div>
        <div class="town-section-title"><span>🌌 跨章節主城星門切換</span></div>
        <div class="waypoint-grid">${chHtml}</div>
      `;
      bodyEl.querySelectorAll('button[data-wp-idx]').forEach((b) => {
        b.onclick = () => {
          const wp = wps[Number(b.dataset.wpIdx)];
          if (wp) ctx.onTeleportWaypoint?.(wp.x, wp.y, wp.label);
          modal.classList.add('hidden');
        };
      });
      bodyEl.querySelector('#btn-wp-exit-cur')?.addEventListener('click', () => {
        modal.classList.add('hidden');
        ctx.onExitTown?.();
      });
      bodyEl.querySelectorAll('button[data-wp-stg]').forEach((b) => {
        b.onclick = () => {
          modal.classList.add('hidden');
          ctx.onTeleportToStage?.(Number(b.dataset.wpStg));
        };
      });
      bodyEl.querySelectorAll('button[data-wp-ch]').forEach((b) => {
        b.onclick = () => {
          modal.classList.add('hidden');
          ctx.onTeleportTown?.(Number(b.dataset.wpCh));
        };
      });
    } else if (action === 'modal_vault') {
      titleEl.textContent = '📦 冒險者珍藏保險箱・防誤拆鎖定庫';
      const vault = st.vaultItems || [];
      const rules = st.vaultRules || { keepClassReq: false, keepDoubleCrit: false };
      const bagCandidates = (st.inventory || []).filter((it) => it && (it.rarity === 'legendary' || it.rarity === 'rare')).slice(0, 8);
      const vaultSlotsHtml = [0, 1, 2, 3, 4, 5].map((i) => {
        const it = vault[i];
        if (!it) return `<div class="vault-slot-card"><span style="color:#64748b;">空保險格 #${i + 1}</span><span style="font-size:11px;color:#475569;">安全存放・防誤拆</span></div>`;
        const rColor = RARITIES[it.rarity]?.color || '#e2e8f0';
        return `<div class="vault-slot-card">
          <div><b style="color:${rColor}">${it.icon || '⚔️'} ${it.name}</b><br><span style="color:#94a3b8;font-size:11px;">戰力 ${it.powerScore || 0}</span></div>
          <button data-vault-out="${i}" style="font-size:11px;">取出至背包</button>
        </div>`;
      }).join('');
      const bagHtml = bagCandidates.map((it) => {
        const rColor = RARITIES[it.rarity]?.color || '#e2e8f0';
        return `<button class="town-item-chip rarity-${it.rarity}" data-vault-in="${it.uid}" ${vault.length >= 6 ? 'disabled' : ''}>存入 ${it.icon || ''}${it.name} (${it.powerScore})</button>`;
      }).join('');

      bodyEl.innerHTML = banner + `
        <div class="town-section-title">
          <span>🔒 永久保險箱 (${vault.length} / 6 格)</span>
          <button id="btn-vault-bag" class="town-item-chip">🎒 開啟完整背包 (B)</button>
        </div>
        <div class="vault-grid">${vaultSlotsHtml}</div>
        <div class="town-section-title"><span>📥 從背包存入稀有 / 傳說裝備</span></div>
        <div class="town-item-selector">${bagHtml || '<span style="color:#64748b;font-size:12px;">背包內暫無稀有以上裝備可存入。</span>'}</div>
        <div class="town-section-title"><span>🛡️ 自動保護規則</span></div>
        <div class="town-option-grid">
          <div class="town-option-card">
            <div><h4>⚔️ 自動鎖定本職業專屬詞綴裝</h4><p>一鍵分解時略過含有當前職業專屬技能/詞綴的裝備。</p></div>
            <button id="btn-rule-cls">${rules.keepClassReq ? '✅ 已啟用保護' : '⚪ 點擊啟用'}</button>
          </div>
          <div class="town-option-card">
            <div><h4>💥 自動鎖定雙爆詞綴裝備</h4><p>同時擁有暴擊率與暴擊傷害詞綴時自動跳過分解。</p></div>
            <button id="btn-rule-crit">${rules.keepDoubleCrit ? '✅ 已啟用保護' : '⚪ 點擊啟用'}</button>
          </div>
        </div>`;
      bodyEl.querySelector('#btn-vault-bag')?.addEventListener('click', () => { modal.classList.add('hidden'); ctx.onOpenDrawer?.('bag'); });
      bodyEl.querySelectorAll('button[data-vault-out]').forEach((b) => {
        b.onclick = () => { ctx.onVaultWithdraw?.(Number(b.dataset.vaultOut)); this.openTownFacilityModal(action, data, ctx); };
      });
      bodyEl.querySelectorAll('button[data-vault-in]').forEach((b) => {
        b.onclick = () => { ctx.onVaultDeposit?.(b.dataset.vaultIn); this.openTownFacilityModal(action, data, ctx); };
      });
      bodyEl.querySelector('#btn-rule-cls')?.addEventListener('click', () => { ctx.onToggleVaultRule?.('keepClassReq'); this.openTownFacilityModal(action, data, ctx); });
      bodyEl.querySelector('#btn-rule-crit')?.addEventListener('click', () => { ctx.onToggleVaultRule?.('keepDoubleCrit'); this.openTownFacilityModal(action, data, ctx); });
    } else if (action === 'modal_sanctum') {
      titleEl.textContent = '🔮 靈魂水晶聖殿・永久光環祝福';
      const crystals = st.soulCrystals || 0;
      const sanctum = st.sanctumLevels || {};
      const auras = [
        { id: 'atk_aura', name: '⚔️ 水晶武魄光環', desc: '永久提升全攻擊力 +6% 與最大生命 +6% / 級', baseCost: 2 },
        { id: 'loot_aura', name: '💎 秘寶指引光環', desc: '永久提升掉寶率 +12% 與金幣掉落 +12% / 級', baseCost: 2 },
        { id: 'boss_aura', name: '👑 弒神威壓光環', desc: '永久提升暴擊傷害 +15% 與全減傷 +2% / 級', baseCost: 3 },
      ];
      bodyEl.innerHTML = banner + `
        <div class="town-section-title">
          <span>💎 目前持有靈魂水晶：<b style="color:#c084fc;font-size:14px;">${crystals}</b> 顆</span>
          <button id="btn-sanctum-rebirth" class="town-item-chip">🌀 開啟輪迴轉生面板 (V)</button>
        </div>
        <div class="sanctum-grid">${auras.map((a) => {
          const lv = sanctum[a.id] || 0;
          const cost = a.baseCost + lv * 2;
          const maxed = lv >= 10;
          return `<div class="town-option-card">
            <div><h4>${a.name} (Lv.${lv}/10)</h4><p>${a.desc}</p></div>
            <button data-sanctum="${a.id}" ${maxed || crystals < cost ? 'disabled' : ''}>${maxed ? '已達聖殿滿級' : `注魔升級 (${cost} 💎)`}</button>
          </div>`;
        }).join('')}</div>`;
      bodyEl.querySelector('#btn-sanctum-rebirth')?.addEventListener('click', () => { modal.classList.add('hidden'); ctx.onOpenDrawer?.('rebirth'); });
      bodyEl.querySelectorAll('button[data-sanctum]').forEach((b) => {
        b.onclick = () => { ctx.onUpgradeSanctum?.(b.dataset.sanctum); this.openTownFacilityModal(action, data, ctx); };
      });
    }
    modal.classList.remove('hidden');
  }


  showTownSplash(chapterIdx = 0) {
    const ov = document.getElementById('town-splash-overlay');
    const card = document.getElementById('town-splash-card');
    const bg = document.getElementById('town-splash-bg');
    const badge = document.getElementById('town-splash-badge');
    const title = document.getElementById('town-splash-title');
    const style = document.getElementById('town-splash-style');
    const quote = document.getElementById('town-splash-quote');
    const tip = document.getElementById('town-splash-tip');
    if (!ov || !card) return;

    const cfg = TOWN_SPLASHES[chapterIdx] || TOWN_SPLASHES[0];
    card.className = `town-splash-card ${cfg.themeClass}`;
    if (bg) bg.style.backgroundImage = `url('${cfg.bgUrl}')`;
    if (badge) badge.textContent = cfg.badge;
    if (title) title.textContent = cfg.title;
    if (style) style.textContent = cfg.styleTag;
    if (quote) quote.textContent = cfg.quote;
    if (tip) tip.textContent = cfg.tip;
    this.updateTownSplashProgress(0.08);
    ov.classList.remove('hidden', 'fading');
    return cfg;
  }

  updateTownSplashProgress(ratio) {
    const fill = document.getElementById('town-splash-progress-fill');
    const txt = document.getElementById('town-splash-progress-text');
    const pct = Math.max(0, Math.min(100, Math.round((ratio || 0) * 100)));
    if (fill) fill.style.width = `${pct}%`;
    if (txt) txt.textContent = pct >= 100 ? '✨ 傳送完成，點擊或即將進入主城...' : `傳送陣共鳴中... ${pct}%`;
  }

  hideTownSplash() {
    const ov = document.getElementById('town-splash-overlay');
    if (!ov || ov.classList.contains('hidden')) return;
    ov.classList.add('fading');
    setTimeout(() => {
      ov.classList.add('hidden');
      ov.classList.remove('fading');
    }, 380);
  }

}
