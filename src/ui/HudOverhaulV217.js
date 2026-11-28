import { UniversalTooltip } from './UniversalTooltip.js?v=318';
/**
 * HudOverhaulV217.js (v217)
 * 1. 右上功能列移至右下角橫排 + 放大圖示 + 直覺縮放小圖示
 * 2. 左上角角色名片放大 + 下方全新獨立任務欄 + 移除舊關卡追蹤
 * 3. 左下角多頻道可輸入聊天室（一般 / 世界 / 隊伍 / 私訊 / 系統 / 掉落）+ Firestore 世界頻道即時同步
 */

import { subscribeWorldChat, sendWorldChatMessage } from '../auth/firebase.js?v=318';

const QUESTS_BY_CH = {
  1:  [
    { id: 'ch1_q1', tag: '野怪懸賞', cls: '',         title: '清剿腐朽野狼群',           type: 'kills', req: 30,    gold: 600,    rType: 'gear',      reward: '600金 + 稀有箱' },
    { id: 'ch1_q2', tag: '首領通緝', cls: 'is-elite', title: '討伐邊境首領 (5/10 關)',   type: 'boss',  req: 2,     gold: 1200,   rType: 'sp',        reward: '1,200金 + 1技能點' },
    { id: 'ch1_q3', tag: '黃金試煉', cls: 'is-trial', title: '百戰哨兵試煉',             type: 'kills', req: 120,   gold: 2500,   rType: 'legendary', reward: '2,500金 + 傳說箱' },
  ],
  2:  [
    { id: 'ch2_q1', tag: '野怪懸賞', cls: '',         title: '清剿巢穴哥布林與孢子怪',   type: 'kills', req: 200,   gold: 1800,   rType: 'gear',      reward: '1,800金 + 稀有箱' },
    { id: 'ch2_q2', tag: '首領通緝', cls: 'is-elite', title: '討伐地下巢穴首領',         type: 'boss',  req: 5,     gold: 3200,   rType: 'sp',        reward: '3,200金 + 1技能點' },
    { id: 'ch2_q3', tag: '黃金試煉', cls: 'is-trial', title: '深淵礦脈清道夫',           type: 'kills', req: 450,   gold: 6000,   rType: 'legendary', reward: '6,000金 + 傳說箱' },
  ],
  3:  [
    { id: 'ch3_q1', tag: '野怪懸賞', cls: '',         title: '淨化白骨墓穴食屍鬼',       type: 'kills', req: 550,   gold: 4200,   rType: 'gear',      reward: '4,200金 + 稀有箱' },
    { id: 'ch3_q2', tag: '首領通緝', cls: 'is-elite', title: '討伐白骨領主首領',         type: 'boss',  req: 10,    gold: 7500,   rType: 'sp',        reward: '7,500金 + 1技能點' },
    { id: 'ch3_q3', tag: '黃金試煉', cls: 'is-trial', title: '守夜人聖骨試煉',           type: 'kills', req: 900,   gold: 12000,  rType: 'legendary', reward: '12,000金 + 傳說箱' },
  ],
  4:  [
    { id: 'ch4_q1', tag: '野怪懸賞', cls: '',         title: '清剿焦土炎魔與火蜥蜴',     type: 'kills', req: 1150,  gold: 8500,   rType: 'gear',      reward: '8,500金 + 稀有箱' },
    { id: 'ch4_q2', tag: '首領通緝', cls: 'is-elite', title: '討伐伊弗利特烈焰首領',     type: 'boss',  req: 18,    gold: 15000,  rType: 'sp',        reward: '15,000金 + 1技能點' },
    { id: 'ch4_q3', tag: '黃金試煉', cls: 'is-trial', title: '黑曜石熔爐宗師試煉',       type: 'kills', req: 1700,  gold: 24000,  rType: 'legendary', reward: '24,000金 + 傳說箱' },
  ],
  5:  [
    { id: 'ch5_q1', tag: '野怪懸賞', cls: '',         title: '肅清深淵聖殿魅魔與魔僕',   type: 'kills', req: 2200,  gold: 18000,  rType: 'gear',      reward: '18,000金 + 稀有箱' },
    { id: 'ch5_q2', tag: '首領通緝', cls: 'is-elite', title: '討伐深淵將軍與魔王首領',   type: 'boss',  req: 28,    gold: 30000,  rType: 'sp',        reward: '30,000金 + 1技能點' },
    { id: 'ch5_q3', tag: '黃金試煉', cls: 'is-trial', title: '緋紅王庭血戰試煉',         type: 'kills', req: 3200,  gold: 48000,  rType: 'legendary', reward: '48,000金 + 傳說箱' },
  ],
  6:  [
    { id: 'ch6_q1', tag: '野怪懸賞', cls: '',         title: '獵殺永凍雪原冰狼與雪怪',   type: 'kills', req: 3800,  gold: 36000,  rType: 'gear',      reward: '36,000金 + 稀有箱' },
    { id: 'ch6_q2', tag: '首領通緝', cls: 'is-elite', title: '討伐冰霜泰坦首領',         type: 'boss',  req: 40,    gold: 55000,  rType: 'sp',        reward: '55,000金 + 1技能點' },
    { id: 'ch6_q3', tag: '黃金試煉', cls: 'is-trial', title: '英靈殿女武神試煉',         type: 'kills', req: 5200,  gold: 88000,  rType: 'legendary', reward: '88,000金 + 傳說箱' },
  ],
  7:  [
    { id: 'ch7_q1', tag: '野怪懸賞', cls: '',         title: '肅清毒沼巨蛙與劇毒食人花', type: 'kills', req: 6500,  gold: 68000,  rType: 'gear',      reward: '68,000金 + 稀有箱' },
    { id: 'ch7_q2', tag: '首領通緝', cls: 'is-elite', title: '討伐劇毒九頭蛇首領',       type: 'boss',  req: 55,    gold: 95000,  rType: 'sp',        reward: '95,000金 + 1技能點' },
    { id: 'ch7_q3', tag: '黃金試煉', cls: 'is-trial', title: '翠玉樹冠水寨守護試煉',     type: 'kills', req: 8500,  gold: 150000, rType: 'legendary', reward: '150,000金 + 傳說箱' },
  ],
  8:  [
    { id: 'ch8_q1', tag: '野怪懸賞', cls: '',         title: '攔截風暴高塔電弧元素',     type: 'kills', req: 10500, gold: 120000, rType: 'gear',      reward: '120,000金 + 稀有箱' },
    { id: 'ch8_q2', tag: '首領通緝', cls: 'is-elite', title: '討伐雷鳴風暴泰坦首領',     type: 'boss',  req: 75,    gold: 180000, rType: 'sp',        reward: '180,000金 + 1技能點' },
    { id: 'ch8_q3', tag: '黃金試煉', cls: 'is-trial', title: '蒼穹浮空城制空試煉',       type: 'kills', req: 13500, gold: 280000, rType: 'legendary', reward: '280,000金 + 傳說箱' },
  ],
  9:  [
    { id: 'ch9_q1', tag: '野怪懸賞', cls: '',         title: '淨化血色修道院墮落審判官', type: 'kills', req: 16000, gold: 210000, rType: 'gear',      reward: '210,000金 + 稀有箱' },
    { id: 'ch9_q2', tag: '首領通緝', cls: 'is-elite', title: '討伐血色大主教領主首領',   type: 'boss',  req: 100,   gold: 320000, rType: 'sp',        reward: '320,000金 + 1技能點' },
    { id: 'ch9_q3', tag: '黃金試煉', cls: 'is-trial', title: '聖血薔薇修道院聖戰試煉',   type: 'kills', req: 20000, gold: 500000, rType: 'legendary', reward: '500,000金 + 傳說箱' },
  ],
  10: [
    { id: 'ch10_q1', tag: '終局懸賞', cls: '',         title: '討伐深淵萬界殘響魔軍',    type: 'kills', req: 25000, gold: 400000, rType: 'gear',      reward: '400,000金 + 稀有箱' },
    { id: 'ch10_q2', tag: '終局首領', cls: 'is-elite', title: '擊破星界魔王化身首領',    type: 'boss',  req: 140,   gold: 650000, rType: 'sp',        reward: '650,000金 + 1技能點' },
    { id: 'ch10_q3', tag: '終極試煉', cls: 'is-trial', title: '永恆星辰聖域至高試煉',    type: 'kills', req: 35000, gold: 999999, rType: 'legendary', reward: '999,999金 + 傳說箱' },
  ],
};

const LOCAL_CHAT_KEY = 'idle_arpg_local_chat_v217';
const CH_META = {
  general: { label: '一般', cls: 'general' },
  world:   { label: '世界', cls: 'world' },
  party:   { label: '隊伍', cls: 'party' },
  whisper: { label: '私訊', cls: 'whisper' },
};

let initialized = false;

function ensureCss() {
  if (document.getElementById('hud-overhaul-v217-css')) return;
  const link = document.createElement('link');
  link.id = 'hud-overhaul-v217-css';
  link.rel = 'stylesheet';
  link.href = './src/ui/hudOverhaul.css?v=224';
  document.head.appendChild(link);
}

/* ===== 1. 右下角橫排功能列 + 縮放小圖示 ===== */
function mountBottomRightDock() {
  const menu = document.querySelector('.mmo-top-menu.v80-matrix-dock');
  const viewport = document.getElementById('battle-viewport');
  if (!menu || !viewport || document.getElementById('hud-bottom-right-dock')) return;

  const SVG_ICONS = {
    '🐾': `<svg class="dock-svg-icon" viewBox="0 0 24 24" fill="none"><circle cx="7" cy="8.5" r="2.1" fill="#c084fc" stroke="#fef08a" stroke-width="1.2"/><circle cx="12" cy="6.5" r="2.1" fill="#c084fc" stroke="#fef08a" stroke-width="1.2"/><circle cx="17" cy="8.5" r="2.1" fill="#c084fc" stroke="#fef08a" stroke-width="1.2"/><path d="M12 11.5c-3.2 0-5.5 2.4-5.5 4.8 0 1.8 1.5 2.7 3.2 2.7 1 0 1.6-.4 2.3-.4s1.3.4 2.3.4c1.7 0 3.2-.9 3.2-2.7 0-2.4-2.3-4.8-5.5-4.8z" fill="#a855f7" stroke="#fde68a" stroke-width="1.3"/></svg>`,
    '🏆': `<svg class="dock-svg-icon" viewBox="0 0 24 24" fill="none"><path d="M7 4h10v6a5 5 0 01-10 0V4z" fill="#d97706" stroke="#fef08a" stroke-width="1.5"/><path d="M7 6H4.5a1.5 1.5 0 000 3H7M17 6h2.5a1.5 1.5 0 010 3H17M12 15v4M8.5 20h7" stroke="#fde68a" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    '🛒': `<svg class="dock-svg-icon" viewBox="0 0 24 24" fill="none"><path d="M6 8h12l-1.2 11H7.2L6 8z" fill="#b45309" stroke="#fde68a" stroke-width="1.5"/><path d="M9 8V6a3 3 0 016 0v2" stroke="#fef08a" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="13.5" r="2" fill="#fde047"/></svg>`,
    '🎵': `<svg class="dock-svg-icon" viewBox="0 0 24 24" fill="none"><path d="M9 17V6l10-2v11" stroke="#38bdf8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7" cy="17.5" r="2.5" fill="#0284c7" stroke="#bae6fd" stroke-width="1.3"/><circle cx="17" cy="15.5" r="2.5" fill="#0284c7" stroke="#bae6fd" stroke-width="1.3"/></svg>`,
    '⚙️': `<svg class="dock-svg-icon" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3.2" fill="#94a3b8" stroke="#fde68a" stroke-width="1.4"/><path d="M12 3.5v2.2M12 18.3v2.2M4.9 7l1.9 1.1M17.2 15.9l1.9 1.1M3.5 12h2.2M18.3 12h2.2M4.9 17l1.9-1.1M17.2 8.1l1.9-1.1" stroke="#cbd5e1" stroke-width="1.9" stroke-linecap="round"/></svg>`,
  };
  menu.querySelectorAll('.mmo-emoji').forEach((em) => {
    const svg = SVG_ICONS[(em.textContent || '').trim()];
    if (svg) em.outerHTML = svg;
  });

  const dockWrap = document.createElement('div');
  dockWrap.id = 'hud-bottom-right-dock';
  dockWrap.appendChild(menu);
  viewport.appendChild(dockWrap);

  const oldBtn = document.getElementById('btn-collapse-topmenu');
  if (oldBtn) {
    // 用 clone 取代舊監聽器，改為直覺的右下角展開/縮合小圖示
    const newBtn = oldBtn.cloneNode(false);
    oldBtn.parentNode.replaceChild(newBtn, oldBtn);

    const hasAlert = () => {
      const bagDot = document.getElementById('bag-dot');
      const achDot = document.getElementById('ach-dot');
      const spBadge = document.getElementById('tree-sp-badge');
      return (bagDot && !bagDot.classList.contains('hidden'))
        || (achDot && !achDot.classList.contains('hidden'))
        || (spBadge && !spBadge.classList.contains('hidden'));
    };

    const renderToggle = () => {
      const collapsed = menu.classList.contains('is-dock-collapsed');
      if (collapsed) {
        newBtn.setAttribute('data-tip', '展開功能選單');
        newBtn.innerHTML = `
          <div class="dock-mini-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fde68a" stroke-width="2.1" stroke-linecap="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5"/>
            </svg>
            <span class="dock-mini-label">選單</span>
          </div>
          ${hasAlert() ? '<span class="dock-mini-dot"></span>' : ''}
        `;
      } else {
        newBtn.setAttribute('data-tip', '收合功能列');
        newBtn.innerHTML = `<span style="font-size:14px;font-weight:900;line-height:1;">▸</span>`;
      }
    };

    newBtn.addEventListener('click', () => {
      menu.classList.toggle('is-dock-collapsed');
      try { localStorage.setItem('idle_arpg_dock_collapsed', menu.classList.contains('is-dock-collapsed') ? '1' : '0'); } catch { /* ignore */ }
      renderToggle();
    });

    try {
      if (localStorage.getItem('idle_arpg_dock_collapsed') === '1') {
        menu.classList.add('is-dock-collapsed');
      }
    } catch { /* ignore */ }
    renderToggle();
    setInterval(renderToggle, 1500);
  }
}

/* ===== 2. 左上角全新任務欄（角色名片下方） ===== */
function mountQuestPanel() {
  const topLeft = document.getElementById('hud-top-left');
  if (!topLeft) return;

  // 確保移除舊關卡追蹤
  const oldTracker = document.getElementById('quest-tracker');
  if (oldTracker) oldTracker.remove();

  let panel = document.getElementById('hud-quest-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'hud-quest-panel';
    panel.className = 'hud-quest-panel';
    const heroCard = topLeft.querySelector('.mmo-hero-card');
    if (heroCard && heroCard.nextSibling) {
      topLeft.insertBefore(panel, heroCard.nextSibling);
    } else {
      topLeft.appendChild(panel);
    }
  }

  let collapsed = false;
  panel.innerHTML = `
    <div class="hqp-header" id="hqp-header">
      <div class="hqp-title">
        <span>📜 冒險任務</span>
        <span class="hqp-stage-tag" id="hqp-stage-tag">第 1-1 關</span>
      </div>
      <button type="button" class="hqp-toggle" id="hqp-toggle-btn">▾</button>
    </div>
    <div class="hqp-body" id="hqp-body"></div>
  `;

  panel.querySelector('#hqp-header')?.addEventListener('click', () => {
    collapsed = !collapsed;
    panel.classList.toggle('is-collapsed', collapsed);
    const btn = panel.querySelector('#hqp-toggle-btn');
    if (btn) btn.textContent = collapsed ? '▸' : '▾';
  });

  const renderQuests = () => {
    const st = window.__IDLE_ARPG_BRIDGE__?.getState?.();
    const body = document.getElementById('hqp-body');
    const stageTag = document.getElementById('hqp-stage-tag');
    if (!st || !body) return;

    const stage = Math.max(1, st.stage || 1);
    const ch = Math.max(1, Math.min(10, Math.floor((stage - 1) / 10) + 1));
    const sub = ((stage - 1) % 10) + 1;
    if (stageTag) stageTag.textContent = `第 ${ch}-${sub} 關`;

    const bp = st.bountyProgress || { bossKills: 0, claimed: {} };
    const quests = QUESTS_BY_CH[ch] || QUESTS_BY_CH[1];

    const acceptedIds = Array.isArray(st.acceptedQuests) ? st.acceptedQuests : [];
    const acceptedMeta = st.acceptedQuestDefs || {};
    const kills = st.kills || 0;
    const bossKills = bp.bossKills || 0;
    const lv = st.level || 1;
    const maxStg = st.maxStageReached || st.stage || 1;
    const hasTownBuff = Object.entries(st.potionBuffs || {}).some(([k, v]) => k.endsWith('Until') && v > Date.now());

    const activeQuests = acceptedIds
      .filter((qid) => !bp.claimed?.[qid])
      .map((qid) => {
        const meta = acceptedMeta[qid] || quests.find((x) => x.id === qid);
        if (!meta) return null;
        let cur = kills;
        if (meta.progType === 'boss' || meta.type === 'boss') cur = bossKills;
        else if (meta.progType === 'level') cur = lv;
        else if (meta.progType === 'stage') cur = maxStg;
        else if (meta.progType === 'bless') cur = hasTownBuff ? 1 : 0;
        else if (meta.progType === 'daily_kill') cur = Math.min(kills, meta.req || 50);
        else if (meta.progType === 'daily_boss') cur = Math.min(bossKills, meta.req || 1);
        return { ...meta, cur };
      })
      .filter(Boolean);

    panel.classList.toggle('is-all-done', activeQuests.length === 0);
    if (activeQuests.length === 0) {
      body.innerHTML = '';
      return;
    }

    body.innerHTML = activeQuests.map((q) => {
      const req = Math.max(1, q.req || 1);
      const pct = Math.min(100, Math.round((q.cur / req) * 100));
      const ready = q.cur >= req;
      const rewTxt = Array.isArray(q.rewardTags) ? q.rewardTags.join(' + ') : (q.reward || '任務獎勵');
      return `
        <div class="hqp-item ${ready ? 'is-ready' : ''}">
          <div class="hqp-item-top">
            <span class="hqp-item-name"><span class="hqp-tag ${q.cls || ''}">${q.tag || '任務'}</span>${q.title}</span>
            <span class="hqp-item-prog-txt">${Math.min(q.cur, req)} / ${req}</span>
          </div>
          <div class="hqp-bar-track"><div class="hqp-bar-fill" style="width:${pct}%"></div></div>
          <div class="hqp-item-bot">
            <span class="hqp-reward">${rewTxt}</span>
            <div style="display:flex;gap:5px;align-items:center;">
              ${ready
                ? `<button type="button" class="hqp-claim-btn" data-qid="${q.id}">領取獎勵</button>`
                : `<button type="button" class="hqp-abandon-btn" data-abandon="${q.id}" title="放棄此任務" style="padding:2px 7px;border-radius:5px;border:1px solid rgba(248,113,113,0.45);background:rgba(127,29,29,0.45);color:#fecaca;font-size:10px;font-weight:800;cursor:pointer;">放棄</button>`}
            </div>
          </div>
        </div>
      `;
    }).join('');

    body.querySelectorAll('.hqp-claim-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const qid = btn.dataset.qid;
        const qObj = st.acceptedQuestDefs?.[qid] || window.__v223ActiveQuestMap?.[qid];
        if (qObj) window.__IDLE_ARPG_BRIDGE__?.claimCategorizedQuest?.(qObj);
        renderQuests();
      });
    });
    body.querySelectorAll('.hqp-abandon-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.__IDLE_ARPG_BRIDGE__?.abandonQuest?.(btn.dataset.abandon);
        renderQuests();
      });
    });
  };

  renderQuests();
  setInterval(renderQuests, 1000);
}

/* ===== 3. 左下角：多頻道可輸入聊天室（一般/世界/隊伍/私訊/系統/掉落） ===== */
function mountMultiChannelChat() {
  const box = document.getElementById('floating-log-box');
  const tabsWrap = box?.querySelector('.floating-log-tabs');
  const entries = document.getElementById('floating-log-entries');
  if (!box || !tabsWrap || !entries || box.dataset.v217ChatMounted) return;
  box.dataset.v217ChatMounted = '1';

  let activeFilter = 'all';

  tabsWrap.innerHTML = `
    <button class="flog-tab active" data-logfilter="all">全部</button>
    <button class="flog-tab" data-logfilter="general">一般</button>
    <button class="flog-tab" data-logfilter="world">世界</button>
    <button class="flog-tab" data-logfilter="party">隊伍</button>
    <button class="flog-tab" data-logfilter="whisper">私訊</button>
    <button class="flog-tab" data-logfilter="loot">掉落</button>
    <button class="flog-tab" data-logfilter="system">系統</button>
    <button id="btn-toggle-flog-v217" class="btn-collapse" title="收合/展開訊息框" style="margin-left:auto;">▾</button>
  `;

  const inputBar = document.createElement('div');
  inputBar.className = 'chat-input-bar';
  inputBar.innerHTML = `
    <select id="chat-channel-select" class="chat-ch-select" title="選擇發言頻道">
      <option value="general">一般</option>
      <option value="world" selected>世界</option>
      <option value="party">隊伍</option>
      <option value="whisper">私訊</option>
    </select>
    <input id="chat-target-input" class="chat-target-input hidden" type="text" maxlength="16" placeholder="對方暱稱" />
    <input id="chat-text-input" class="chat-text-input" type="text" maxlength="180" placeholder="輸入訊息，按 Enter 發送（/w 對象 訊息）" />
    <button type="button" id="btn-chat-send" class="chat-send-btn">發送</button>
  `;
  box.appendChild(inputBar);

  const chSelect = document.getElementById('chat-channel-select');
  const targetInput = document.getElementById('chat-target-input');
  const textInput = document.getElementById('chat-text-input');
  const sendBtn = document.getElementById('btn-chat-send');
  const toggleBtn = document.getElementById('btn-toggle-flog-v217');

  const applyFilter = () => {
    Array.from(entries.children).forEach((el) => {
      const cat = el.dataset.cat || 'system';
      el.classList.toggle('hidden', activeFilter !== 'all' && cat !== activeFilter);
    });
    entries.scrollTop = entries.scrollHeight;
  };

  tabsWrap.querySelectorAll('.flog-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      activeFilter = tab.dataset.logfilter || 'all';
      tabsWrap.querySelectorAll('.flog-tab').forEach((t) => t.classList.toggle('active', t === tab));
      if (['general', 'world', 'party', 'whisper'].includes(activeFilter) && chSelect) {
        chSelect.value = activeFilter;
        targetInput?.classList.toggle('hidden', activeFilter !== 'whisper');
      }
      applyFilter();
    });
  });

  toggleBtn?.addEventListener('click', () => {
    const col = entries.classList.toggle('collapsed');
    inputBar.style.display = col ? 'none' : 'flex';
    toggleBtn.textContent = col ? '▸' : '▾';
  });

  chSelect?.addEventListener('change', () => {
    targetInput?.classList.toggle('hidden', chSelect.value !== 'whisper');
  });

  const seenRemoteIds = new Set();

  const appendChatLine = ({ id, channel, sender, target, text, createdAt }) => {
    if (id && seenRemoteIds.has(id)) return;
    if (id) seenRemoteIds.add(id);

    const meta = CH_META[channel] || CH_META.general;
    const d = createdAt ? new Date(createdAt) : new Date();
    const ts = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const el = document.createElement('div');
    el.className = `log-entry chat-${meta.cls}`;
    el.dataset.cat = channel;
    const prefix = channel === 'whisper' && target
      ? `[${ts}] <span class="chat-badge ${meta.cls}">${meta.label}</span><b>${escapeHtml(sender)}</b> → <b>${escapeHtml(target)}</b>：`
      : `[${ts}] <span class="chat-badge ${meta.cls}">${meta.label}</span><b>${escapeHtml(sender)}</b>：`;
    el.innerHTML = `${prefix}${escapeHtml(text)}`;
    if (activeFilter !== 'all' && activeFilter !== channel) el.classList.add('hidden');
    entries.appendChild(el);
    while (entries.children.length > 100) entries.removeChild(entries.firstChild);
    entries.scrollTop = entries.scrollHeight;
  };

  // 載入本機近期聊天紀錄
  try {
    const saved = JSON.parse(localStorage.getItem(LOCAL_CHAT_KEY) || '[]');
    if (Array.isArray(saved)) saved.slice(-25).forEach((m) => appendChatLine(m));
  } catch { /* ignore */ }

  const saveLocalMsg = (msg) => {
    try {
      const saved = JSON.parse(localStorage.getItem(LOCAL_CHAT_KEY) || '[]');
      saved.push(msg);
      localStorage.setItem(LOCAL_CHAT_KEY, JSON.stringify(saved.slice(-40)));
    } catch { /* ignore */ }
  };

  let worldSyncAvailable = true;
  let warnedNoPerm = false;

  // 訂閱 Firestore 世界頻道即時同步
  subscribeWorldChat(
    (msgs) => {
      worldSyncAvailable = true;
      msgs.forEach((m) => appendChatLine(m));
    },
    () => {
      worldSyncAvailable = false;
    }
  );

  const doSend = async () => {
    let raw = (textInput?.value || '').trim();
    if (!raw) return;
    let channel = chSelect?.value || 'general';
    let target = (targetInput?.value || '').trim();

    // 支援 /w 對象 訊息 快速私訊
    if (raw.startsWith('/w ') || raw.startsWith('/W ')) {
      const parts = raw.slice(3).trim().split(/\s+/);
      if (parts.length >= 2) {
        channel = 'whisper';
        target = parts[0];
        raw = parts.slice(1).join(' ');
      }
    }
    if (channel === 'whisper' && !target) {
      target = '隊友';
    }

    const st = window.__IDLE_ARPG_BRIDGE__?.getState?.();
    const sender = (st?.nickname || '冒險者').trim();
    textInput.value = '';

    const payload = {
      id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      channel,
      sender,
      target,
      text: raw,
      createdAt: Date.now(),
    };

    if (channel === 'world' && worldSyncAvailable) {
      const res = await sendWorldChatMessage(payload);
      if (res.ok) return; // onSnapshot 會自動回推顯示
      if (res.reason === 'permission-denied') {
        worldSyncAvailable = false;
        if (!warnedNoPerm) {
          warnedNoPerm = true;
          window.__IDLE_ARPG_BRIDGE__?.addLog?.('💬 世界頻道尚未在 Firebase 後台開放規則，暫以本機顯示（開通後自動即時同步）', 'system', 'system');
        }
      }
    }

    appendChatLine(payload);
    saveLocalMsg(payload);
  };

  sendBtn?.addEventListener('click', doSend);
  textInput?.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      doSend();
    } else if (e.key === 'Escape') {
      textInput.blur();
    }
  });
  targetInput?.addEventListener('keydown', (e) => e.stopPropagation());
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function initHudOverhaulV217() {
  if (initialized || typeof document === 'undefined') return;
  initialized = true;
  ensureCss();

  const run = () => {
    mountBottomRightDock();
    mountQuestPanel();
    mountMultiChannelChat();
    mountAltarBuffBar();
    mountResponsiveDockGuard();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
}


const BUFF_CATALOG = [
  { key: 'beaconUntil',  img: 'buff_beacon',  name: '曙光祝福',   tip: '曙光烽火台：攻擊+15% / 防禦+15% / 掉寶+15%',               col: '#f59e0b' },
  { key: 'sporeUntil',   img: 'buff_spore',   name: '孢子狂熱',   tip: '螢光孢子噴泉：攻速+20% / 爆擊+15% / 金幣+20%',             col: '#a855f7' },
  { key: 'soulUntil',    img: 'buff_soul',    name: '魂火祝福',   tip: '靈魂永恆火盆：攻擊+18% / 爆傷+25% / 掉寶+15%',             col: '#38bdf8' },
  { key: 'lavaUntil',    img: 'buff_lava',    name: '熔爐狂怒',   tip: '雙頭巨龍熔岩噴泉：攻擊+25% / 爆傷+20% / 技能傷+20%',       col: '#f97316' },
  { key: 'abyssUntil',   img: 'buff_abyss',   name: '魔王血契',   tip: '深淵召喚巨陣：攻擊+30% / 爆傷+20% / 掉寶+25%',             col: '#e879f9' },
  { key: 'auroraUntil',  img: 'buff_aurora',  name: '極光祝福',   tip: '永凍極光水晶塔：防禦+25% / 攻速+25% / 減傷+10%',           col: '#22d3ee' },
  { key: 'emeraldUntil', img: 'buff_emerald', name: '翠玉生機',   tip: '翡翠毒液瀑布池：攻擊+25% / 攻速+25% / 掉寶+30%',           col: '#4ade80' },
  { key: 'stormUntil',   img: 'buff_storm',   name: '蒼穹雷霆',   tip: '聚雷磁能核心球：攻速+30% / 技能傷+25% / 爆擊+20%',         col: '#facc15' },
  { key: 'roseUntil',    img: 'buff_rose',    name: '聖血薔薇',   tip: '垂淚聖母血泉：攻擊+35% / 爆傷+25% / 吸血+5%',              col: '#f43f5e' },
  { key: 'astralUntil',  img: 'buff_astral',  name: '永恆星辰',   tip: '旋轉黑洞星象儀：攻擊+45% / 爆傷+35% / 攻速+30% / 掉寶+40%', col: '#c084fc' },
  { key: 'expUntil',     img: 'buff_exp',     name: '經驗藥水',   tip: '經驗值取得大幅提升 (+50%)',                                 col: '#facc15' },
  { key: 'furyUntil',    img: 'buff_fury',    name: '狂暴藥水',   tip: '攻擊速度 +25% / 暴擊率 +10%',                               col: '#c084fc' },
  { key: 'mfUntil',      img: 'buff_mf',      name: '尋寶藥水',   tip: '掉寶率 +40% / 金幣獲取 +30%',                               col: '#4ade80' },
  { key: 'titanUntil',   img: 'buff_titan',   name: '泰坦秘藥',   tip: '攻擊力 +30% / 暴擊傷害 +40%',                               col: '#fb923c' },
  { key: 'ironUntil',    img: 'buff_iron',    name: '鋼鐵秘藥',   tip: '防禦力 +35% / 受到傷害減免 +12%',                           col: '#94a3b8' },
  { key: 'sageUntil',    img: 'buff_sage',    name: '先知秘藥',   tip: '冷卻縮減 +18% / 掉寶率 +50%',                               col: '#38bdf8' },
  { key: 'tavernUntil',  img: 'buff_tavern',  name: '酒館飽足',   tip: '冒險者大餐：金幣 +15% / 經驗 +15%',                         col: '#fbbf24' },
  { key: 'guardUntil',   img: 'buff_guard',   name: '哨站守備',   tip: '主城守衛激勵：防禦力 +10%',                                 col: '#60a5fa' },
];

function fmtCountdown(sec) {
  if (sec >= 60) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
  return `${sec}s`;
}

function mountAltarBuffBar() {
  if (window.__V253_BUFF_BAR_TIMER__) {
    clearInterval(window.__V253_BUFF_BAR_TIMER__);
  }
  window.__V253_BUFF_BAR_OWNED__ = true;
  const buffMetaMap = new Map();
  let hoveredKey = null;

  const ensureBarDelegation = (bar) => {
    if (bar._v257TipBound) return;
    bar._v257TipBound = true;
    bar.addEventListener('mouseover', (ev) => {
      const tile = ev.target?.closest?.('.v253-buff-tile');
      if (!tile) return;
      const k = tile.dataset.buffKey;
      hoveredKey = k;
      const info = buffMetaMap.get(k);
      if (info) {
        UniversalTooltip.showRich(ev, {
          title: info.name,
          subtitle: info.sub,
          icon: `./assets/buffs/${info.img}.png?v=253`,
          color: info.col || '#fde68a',
          lines: [info.tip],
          footer: info.footer || '目前生效中',
        });
      }
    });
    bar.addEventListener('mousemove', (ev) => {
      if (hoveredKey) UniversalTooltip.move(ev);
    });
    bar.addEventListener('mouseout', (ev) => {
      const tile = ev.target?.closest?.('.v253-buff-tile');
      if (!tile) return;
      if (tile.contains(ev.relatedTarget)) return;
      hoveredKey = null;
      UniversalTooltip.hide();
    });
  };

  const renderBuffs = () => {
    const bar = document.getElementById('hud-altar-buffs');
    const st = window.__IDLE_ARPG_BRIDGE__?.getState?.();
    if (!bar || !st) return;
    ensureBarDelegation(bar);

    const buffs = st.potionBuffs || {};
    const nowTs = Date.now();
    const desired = [];

    for (const def of BUFF_CATALOG) {
      const until = buffs[def.key] || 0;
      if (until > nowTs) {
        const rem = Math.max(1, Math.ceil((until - nowTs) / 1000));
        const label = fmtCountdown(rem);
        desired.push({
          id: def.key,
          img: def.img,
          name: def.name,
          sub: `剩餘時間：${label}`,
          tip: def.tip,
          col: def.col,
          label,
          isCombat: false,
          footer: '藥水／主城祭壇常駐增益',
        });
      }
    }
    const liveBuffs = window.__IDLE_ARPG_BRIDGE__?.getLiveCombatBuffs?.() || [];
    for (const lb of liveBuffs) {
      desired.push({
        id: `live_${lb.img}`,
        img: lb.img,
        name: lb.name,
        sub: `狀態：${lb.label}`,
        tip: lb.tip,
        col: lb.col || '#fbbf24',
        label: lb.label,
        isCombat: true,
        footer: '實戰即時技能狀態',
      });
    }

    const activeIds = new Set(desired.map((d) => d.id));
    // 移除已過期的節點（保留滑鼠懸停中的其他節點不重建，徹底消滅跳動！）
    Array.from(bar.children).forEach((el) => {
      const k = el.dataset?.buffKey;
      if (!activeIds.has(k)) {
        if (hoveredKey === k) { hoveredKey = null; UniversalTooltip.hide(); }
        el.remove();
      }
    });

    desired.forEach((d) => {
      buffMetaMap.set(d.id, d);
      let tile = bar.querySelector(`.v253-buff-tile[data-buff-key="${d.id}"]`);
      if (!tile) {
        tile = document.createElement('div');
        tile.className = `altar-buff-tile v253-buff-tile${d.isCombat ? ' is-combat' : ''}`;
        tile.dataset.buffKey = d.id;
        tile.style.setProperty('--buff-col', d.col);
        tile.innerHTML = `<img class="altar-buff-img" src="./assets/buffs/${d.img}.png?v=253" alt="${d.name}" /><span class="altar-buff-sec">${d.label}</span>`;
        bar.appendChild(tile);
      } else {
        const secEl = tile.querySelector('.altar-buff-sec');
        if (secEl && secEl.textContent !== d.label) secEl.textContent = d.label;
      }
    });

    bar.classList.toggle('is-empty', desired.length === 0);
    const oldWrap = document.getElementById('hud-potion-buffs');
    if (oldWrap) oldWrap.style.display = 'none';
  };
  renderBuffs();
  window.__V253_BUFF_BAR_TIMER__ = setInterval(renderBuffs, 450);
}

function mountResponsiveDockGuard() {
  // v224：維持一列式橫排並通知自由排版管理器掛載所有獨立物件把手
  const syncHandles = () => {
    const dock = document.querySelector('#hud-bottom-right-dock .v80-matrix-dock');
    if (dock) dock.classList.remove('is-compact-2row', 'is-ultra-compact');
    window.__hudSettingsMgr?.applyAll?.();
  };
  setTimeout(syncHandles, 250);
  setTimeout(syncHandles, 1200);
}
