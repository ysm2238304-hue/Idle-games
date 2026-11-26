/**
 * NpcModalRenderer.js (v203 - Full Parity + Concept Refactor)
 * 修復排查出的 5 項遺漏與數值誤差：
 * 1. modal_waypoint 完整補回「出城挑戰關卡 (data-wp-stg)」與「跨章節主城傳送 (data-wp-ch)」
 * 2. modal_bounty 還原第 1～10 章全部 30 個專屬任務標題、目標數與獎勵
 * 3. modal_market 補回貨架刷新倒數 (nextRefreshAt) 並對齊原版價格基數 (600 / 350)
 * 4. modal_alchemy 對齊原版藥水價格基數 (180/420/480/520/680/620/700)
 * 5. modal_trainer 補回目前裝備技能與暴擊率顯示
 */

import { NpcStageEngine } from './NpcStageEngine.js?v=204';
import { RARITIES } from '../data/items.js?v=99';
import { calcItemPower } from '../logic/lootGen.js?v=99';
import { UniversalTooltip, resolveItemIconUniversal } from './UniversalTooltip.js?v=232';
import { renderDeepBlacksmithHTML, bindDeepBlacksmithEvents, renderDeepAlchemyHTML, bindDeepAlchemyEvents, renderDeepMarketHTML, bindDeepMarketEvents } from './TownDeepPanels.js?v=276';

let activeStageEngine = null;
let activeDummyTimer = null;
let activeBountyTab = 'hunt';
let activeVaultTab = 0;

export function destroyActiveNpcStage() {
  UniversalTooltip.hide();
  if (activeStageEngine) {
    activeStageEngine.destroy();
    activeStageEngine = null;
  }
  if (activeDummyTimer) {
    clearInterval(activeDummyTimer);
    activeDummyTimer = null;
  }
}

function ensureNpcModalCss() {
  if (typeof document === 'undefined') return;
  const old = document.getElementById('npc-modal-v2-css');
  if (old) {
    if (!old.href.includes('v=204')) old.href = './src/ui/npcModal.css?v=230';
    return;
  }
  const link = document.createElement('link');
  link.id = 'npc-modal-v2-css';
  link.rel = 'stylesheet';
  link.href = './src/ui/npcModal.css?v=230';
  document.head.appendChild(link);
}

const SVG = {
  gold: `<svg viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9 10h6M9 14h6"/></svg>`,
  dust: `<svg viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2"><path d="M12 3l2.2 5.3L20 10l-5.8 1.7L12 17l-2.2-5.3L4 10l5.8-1.7z"/></svg>`,
  crystal: `<svg viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><polygon points="12 2 19 9 12 22 5 9 12 2"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M7 17L17 7M9 7h8v8"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="#86efac" stroke-width="2.5" width="15" height="15"><path d="M5 13l4 4L19 7"/></svg>`,
  anvil: `<svg class="anvil-svg-glow" viewBox="0 0 64 64" fill="none"><path d="M10 24h40c4 0 8 4 8 8-6 2-12 3-16 6l4 14H18l4-14c-4-3-10-4-12-14z" fill="#334155" stroke="#f97316" stroke-width="2.2"/><path d="M16 52h32v6H16z" fill="#1e293b" stroke="#fbbf24" stroke-width="1.8"/></svg>`,
  chestStd: `<svg width="46" height="46" viewBox="0 0 48 48" fill="none"><rect x="6" y="16" width="36" height="24" rx="4" fill="#312e81" stroke="#a855f7" stroke-width="2"/><path d="M6 24h36" stroke="#c084fc" stroke-width="2"/><rect x="20" y="21" width="8" height="8" rx="2" fill="#fbbf24"/></svg>`,
  chestHigh: `<svg width="46" height="46" viewBox="0 0 48 48" fill="none"><rect x="6" y="14" width="36" height="26" rx="5" fill="#451a03" stroke="#fbbf24" stroke-width="2.2"/><path d="M6 23h36M14 14v26M34 14v26" stroke="#f59e0b" stroke-width="1.8"/><circle cx="24" cy="23" r="4.5" fill="#e879f9" stroke="#fde68a" stroke-width="1.5"/></svg>`,
  dummy: `<svg width="52" height="58" viewBox="0 0 48 56" fill="none"><path d="M24 46v8M16 54h16" stroke="#92400e" stroke-width="3"/><rect x="15" y="20" width="18" height="26" rx="4" fill="#78350f" stroke="#f59e0b" stroke-width="1.8"/><path d="M8 26h32" stroke="#b45309" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="12" r="7" fill="#92400e" stroke="#fbbf24" stroke-width="1.8"/></svg>`,
  flask: (col) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 3h6M10 3v5l-5 9a2 2 0 001.7 3h10.6a2 2 0 001.7-3l-5-9V3" stroke="${col}" stroke-width="1.8"/><path d="M7.5 15h9l1.8 3.2a.8.8 0 01-.7 1.2H6.4a.8.8 0 01-.7-1.2L7.5 15z" fill="${col}" fill-opacity="0.55"/></svg>`,
};

const CHAPTER_NAMES = [
  '第1章・曙光哨站堡壘', '第2章・地下菌菇黑市', '第3章・守夜人聖骨禮拜堂', '第4章・黑曜石熔爐要塞', '第5章・緋紅魔獄王庭',
  '第6章・極光冰晶堡', '第7章・翠玉樹冠水寨', '第8章・蒼穹電弧浮空城', '第9章・聖血薔薇修道院', '第10章・永恆星辰聖域',
];

const BOUNTIES_BY_CH = {
  1: [
    { id: 'ch1_q1', tag: '野怪懸賞', cls: '', title: '清剿腐朽野狼群', type: 'kills', req: 30, reward: '600 金幣 + 稀有裝備箱' },
    { id: 'ch1_q2', tag: '首領通緝', cls: 'is-elite', title: '討伐邊境首領 (5/10 關)', type: 'boss', req: 2, reward: '1,200 金幣 + +1 技能點' },
    { id: 'ch1_q3', tag: '黃金試煉', cls: 'is-trial', title: '百戰哨兵試煉', type: 'kills', req: 120, reward: '2,500 金幣 + 傳說保底箱' },
  ],
  2: [
    { id: 'ch2_q1', tag: '野怪懸賞', cls: '', title: '清剿巢穴哥布林與孢子怪', type: 'kills', req: 200, reward: '1,800 金幣 + 高階稀有箱' },
    { id: 'ch2_q2', tag: '首領通緝', cls: 'is-elite', title: '討伐地下巢穴首領', type: 'boss', req: 5, reward: '3,200 金幣 + +1 技能點' },
    { id: 'ch2_q3', tag: '黃金試煉', cls: 'is-trial', title: '深淵礦脈清道夫', type: 'kills', req: 450, reward: '6,000 金幣 + 傳說保底箱' },
  ],
  3: [
    { id: 'ch3_q1', tag: '野怪懸賞', cls: '', title: '淨化白骨墓穴食屍鬼', type: 'kills', req: 550, reward: '4,200 金幣 + 高階稀有箱' },
    { id: 'ch3_q2', tag: '首領通緝', cls: 'is-elite', title: '討伐白骨領主首領', type: 'boss', req: 10, reward: '7,500 金幣 + +1 技能點' },
    { id: 'ch3_q3', tag: '黃金試煉', cls: 'is-trial', title: '守夜人聖骨試煉', type: 'kills', req: 900, reward: '12,000 金幣 + 傳說保底箱' },
  ],
  4: [
    { id: 'ch4_q1', tag: '野怪懸賞', cls: '', title: '清剿焦土炎魔與火蜥蜴', type: 'kills', req: 1150, reward: '8,500 金幣 + 高階稀有箱' },
    { id: 'ch4_q2', tag: '首領通緝', cls: 'is-elite', title: '討伐伊弗利特烈焰首領', type: 'boss', req: 18, reward: '15,000 金幣 + +1 技能點' },
    { id: 'ch4_q3', tag: '黃金試煉', cls: 'is-trial', title: '黑曜石熔爐宗師試煉', type: 'kills', req: 1700, reward: '24,000 金幣 + 傳說保底箱' },
  ],
  5: [
    { id: 'ch5_q1', tag: '野怪懸賞', cls: '', title: '肅清深淵聖殿魅魔與魔僕', type: 'kills', req: 2200, reward: '18,000 金幣 + 高階稀有箱' },
    { id: 'ch5_q2', tag: '首領通緝', cls: 'is-elite', title: '討伐深淵將軍與魔王首領', type: 'boss', req: 28, reward: '30,000 金幣 + +1 技能點' },
    { id: 'ch5_q3', tag: '黃金試煉', cls: 'is-trial', title: '緋紅王庭血戰試煉', type: 'kills', req: 3200, reward: '48,000 金幣 + 傳說保底箱' },
  ],
  6: [
    { id: 'ch6_q1', tag: '野怪懸賞', cls: '', title: '獵殺永凍雪原冰狼與雪怪', type: 'kills', req: 3800, reward: '36,000 金幣 + 高階稀有箱' },
    { id: 'ch6_q2', tag: '首領通緝', cls: 'is-elite', title: '討伐冰霜泰坦首領', type: 'boss', req: 40, reward: '55,000 金幣 + +1 技能點' },
    { id: 'ch6_q3', tag: '黃金試煉', cls: 'is-trial', title: '英靈殿女武神試煉', type: 'kills', req: 5200, reward: '88,000 金幣 + 傳說保底箱' },
  ],
  7: [
    { id: 'ch7_q1', tag: '野怪懸賞', cls: '', title: '肅清毒沼巨蛙與劇毒食人花', type: 'kills', req: 6500, reward: '68,000 金幣 + 高階稀有箱' },
    { id: 'ch7_q2', tag: '首領通緝', cls: 'is-elite', title: '討伐劇毒九頭蛇首領', type: 'boss', req: 55, reward: '95,000 金幣 + +1 技能點' },
    { id: 'ch7_q3', tag: '黃金試煉', cls: 'is-trial', title: '翠玉樹冠水寨守護試煉', type: 'kills', req: 8500, reward: '150,000 金幣 + 傳說保底箱' },
  ],
  8: [
    { id: 'ch8_q1', tag: '野怪懸賞', cls: '', title: '攔截風暴高塔電弧元素', type: 'kills', req: 10500, reward: '120,000 金幣 + 高階稀有箱' },
    { id: 'ch8_q2', tag: '首領通緝', cls: 'is-elite', title: '討伐雷鳴風暴泰坦首領', type: 'boss', req: 75, reward: '180,000 金幣 + +1 技能點' },
    { id: 'ch8_q3', tag: '黃金試煉', cls: 'is-trial', title: '蒼穹浮空城制空試煉', type: 'kills', req: 13500, reward: '280,000 金幣 + 傳說保底箱' },
  ],
  9: [
    { id: 'ch9_q1', tag: '野怪懸賞', cls: '', title: '淨化血色修道院墮落審判官', type: 'kills', req: 16000, reward: '210,000 金幣 + 高階稀有箱' },
    { id: 'ch9_q2', tag: '首領通緝', cls: 'is-elite', title: '討伐血色大主教領主首領', type: 'boss', req: 100, reward: '320,000 金幣 + +1 技能點' },
    { id: 'ch9_q3', tag: '黃金試煉', cls: 'is-trial', title: '聖血薔薇修道院聖戰試煉', type: 'kills', req: 20000, reward: '500,000 金幣 + 傳說保底箱' },
  ],
  10: [
    { id: 'ch10_q1', tag: '野怪懸賞', cls: '', title: '肅清混沌星界星靈與吞噬者', type: 'kills', req: 25000, reward: '380,000 金幣 + 高階稀有箱' },
    { id: 'ch10_q2', tag: '首領通緝', cls: 'is-elite', title: '討伐混沌星界終極泰坦首領', type: 'boss', req: 150, reward: '600,000 金幣 + +2 技能點' },
    { id: 'ch10_q3', tag: '終局試煉', cls: 'is-trial', title: '永恆星辰聖域終局試煉', type: 'kills', req: 32000, reward: '1,000,000 金幣 + 神話保底箱' },
  ],
};

const FACILITY_META = {
  modal_blacksmith: { title: '鐵匠鍛造台・詞綴洗鍊與精煉', icon: './assets/ui/ui_upgrade.png', defaultName: '鐵砧・布魯', defaultRole: '鍛造大師', greeting: '把裝備放上鐵砧！只要材料夠，廢鐵也能敲成神兵！' },
  modal_alchemy: { title: '祕法煉金鍋・高階秘藥調配', icon: './assets/ui/ui_potion.png', defaultName: '艾莉絲', defaultRole: '邊境煉金術師', greeting: '大鍋正在沸騰，選一瓶配方直接投入熬煮吧！' },
  modal_market: { title: '深淵黑市賭桌・走私秘寶與貨架', icon: './assets/ui/ui_chest.png', defaultName: '無面行商', defaultRole: '黑市商人', greeting: '別問貨從哪裡來的……挑個寶箱試試手氣吧。' },
  modal_portal: { title: '跨章節十界星門星圖', icon: './assets/ui/ui_waypoint.png', defaultName: '加雷斯', defaultRole: '星門守衛長', greeting: '十界星門已校準完成，隨時準備重返前線或前往下一個主城。' },
  modal_bounty: { title: '實木懸賞告示板', icon: './assets/ui/ui_log.png', defaultName: '凱爾', defaultRole: '賞金獵人隊長', greeting: '這批懸賞單全是周邊最棘手的魔物，完成後賞金少不了你的。' },
  modal_tavern: { title: '冒險者酒館', icon: './assets/ui/ui_potion.png', defaultName: '酒館老闆', defaultRole: '補給總管', greeting: '進來歇口氣吧，熱騰騰的佳餚能讓你戰力暴漲。' },
  modal_tower: { title: '瞭望哨塔・魔物圖鑑', icon: './assets/ui/ui_worldmap.png', defaultName: '哨塔瞭望員', defaultRole: '情報官', greeting: '從高處已鎖定本章魔物動向，知己知彼才能百戰百勝。' },
  modal_trainer: { title: '戰技神殿・實戰木樁演武場', icon: './assets/ui/ui_skills.png', defaultName: '雷恩', defaultRole: '戰技總教頭', greeting: '實戰與木人樁演練缺一不可，隨時來測試你的流派輸出！' },
  modal_waypoint: { title: '主城快速傳送陣', icon: './assets/ui/ui_waypoint.png', defaultName: '傳送陣導師', defaultRole: '空間引導者', greeting: '透過符文節點，可以瞬間抵達城內各處、出城關卡或跨章節主城。' },
  modal_vault: { title: '冒險者金庫・防誤拆鎖定庫', icon: './assets/ui/ui_bag.png', defaultName: '霍克', defaultRole: '軍需書記官', greeting: '把極品神裝鎖進重型金庫，才不會在批量分解時誤傷。' },
  modal_sanctum: { title: '三芒星魂晶祭壇・永久光環', icon: './assets/ui/ui_rebirth.png', defaultName: '奧爾登', defaultRole: '虛空先知', greeting: '將魂晶注入祭壇星辰，這份力量將跨越多輪輪迴。' },
  modal_patrol_guard: { title: '城防巡邏衛兵', icon: './assets/ui/ui_auto.png', defaultName: '巡邏衛兵', defaultRole: '城防精銳', greeting: '防線一切正常！需要我為你施加城防激勵嗎？' },
  modal_patrol_villager: { title: '城鎮旅人', icon: './assets/ui/ui_chest.png', defaultName: '城鎮旅人', defaultRole: '行腳商旅', greeting: '冒險者大人！這是路上撿到的小補給，請收下吧。' },
  modal_scout: { title: '邊境斥候長・莉娜的哨站補給', icon: './assets/ui/ui_worldmap.png', defaultName: '莉娜', defaultRole: '邊境斥候長', greeting: '歡迎來到曙光哨站！點燃中央烽火台可獲得戰意祝福。' },
  modal_smuggler: { title: '洞窟走私客・尼克的見面禮', icon: './assets/ui/ui_chest.png', defaultName: '尼克', defaultRole: '洞窟走私客', greeting: '噓……這批從哥布林酋長金庫摸來的貨拿去用吧。' },
  modal_chronicler: { title: '亡靈記錄者・阿爾文手札', icon: './assets/ui/ui_log.png', defaultName: '阿爾文', defaultRole: '亡靈記錄者', greeting: '我用魂羽筆記錄了每位勇者，這份聖骨補給請收下。' },
  modal_forgemaster: { title: '火元素鍛造宗師・赫菲斯', icon: './assets/ui/ui_upgrade.png', defaultName: '赫菲斯', defaultRole: '火元素鍛造宗師', greeting: '凡人，你的勇氣堪比赤炎，收下這份熔爐贈禮吧！' },
  modal_contractor: { title: '墮落契約官・墨菲斯托', icon: './assets/ui/ui_rebirth.png', defaultName: '墨菲斯托', defaultRole: '墮落契約官', greeting: '簽下這份黃金魔契吧，10,000 金幣與秘藥已備妥！' },
  modal_shaman: { title: '極地先知長老・奧丁森', icon: './assets/ui/ui_tree.png', defaultName: '奧丁森', defaultRole: '極地先知長老', greeting: '極地風雪考驗著戰士，這份先知贈禮請收下。' },
  modal_witchdoctor: { title: '沼澤巫醫長・祖爾聖禮', icon: './assets/ui/ui_potion.png', defaultName: '祖爾', defaultRole: '沼澤巫醫長', greeting: '收下這份部族聖禮，願螢火蟲指引你的道路。' },
  modal_engineer: { title: '風暴首席工程師・艾迪生', icon: './assets/ui/ui_gear.png', defaultName: '艾迪生', defaultRole: '風暴首席工程師', greeting: '這是我最新設計的蒼穹補給包，拿著 50,000 金幣去大展身手吧！' },
  modal_penitent: { title: '苦行聖女・特蕾莎賜福', icon: './assets/ui/ui_rebirth.png', defaultName: '特蕾莎', defaultRole: '苦行聖女', greeting: '願薔薇念珠與 80,000 金幣聖糧支撐你渡過長夜。' },
  modal_weaver: { title: '星界編織者・伊莉雅終極贈禮', icon: './assets/ui/ui_tree.png', defaultName: '伊莉雅', defaultRole: '星界編織者', greeting: '你已走完十界征途！收下這份終極星界贈禮吧！' },
};

const fmtNum = (n) => Math.floor(Number(n) || 0).toLocaleString();

function fmtCountdown(ms) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function costBtnHtml(idOrAttr, label, costText, canAfford) {
  return `<button ${idOrAttr} class="npc-btn-primary ${canAfford ? '' : 'is-short'}" ${canAfford ? '' : 'disabled'}>
    <span>${label}</span>
    <span class="npc-cost-pill ${canAfford ? 'is-ok' : 'is-short'}">${costText}</span>
  </button>`;
}

export function renderTownFacilityModal(ui, action, data, ctx, deps = {}) {
  ensureNpcModalCss();
  destroyActiveNpcStage();

  const modal = document.getElementById('modal-town-facility');
  const titleEl = document.getElementById('town-modal-title');
  const bodyEl = document.getElementById('town-modal-body');
  const closeBtn = document.getElementById('btn-close-town-modal');
  if (!modal || !titleEl || !bodyEl) return;

  const _rawSt = ui.getState?.() || {};
  const st = Object.keys(_rawSt).length ? _rawSt : (window.__IDLE_ARPG_BRIDGE__?.getState?.() || {});
  const getChapterIdx = deps.getChapterIdx || ((s) => Math.min(9, Math.floor((Math.max(1, s) - 1) / 10)));
  const chIdx = data?.chapterIdx ?? getChapterIdx(st.stage || 1);
  const chapter = Math.max(1, Math.min(10, Number(chIdx) + 1));

  modal.classList.add('npc-modal-v2');
  modal.dataset.chapter = String(chapter);

  const meta = FACILITY_META[action] || FACILITY_META.modal_bounty;
  const npcObj = data?.npc || data || {};
  const npcName = npcObj.name || data?.name || meta.defaultName;
  const npcTitle = npcObj.title || meta.defaultRole;
  const npcGreeting = npcObj.greeting || meta.greeting;

  const npcImgUrl = ctx?.getPortrait?.(data?.atlasKey, npcObj.frame || data?.frame) || '';
  const bldImgUrl = data?.frame && data?.frame !== npcObj.frame
    ? (ctx?.getPortrait?.(data?.atlasKey, data.frame) || '')
    : '';
  const animatedUrl = data?.animatedUrl || npcObj.animatedUrl || '';

  titleEl.innerHTML = `<img src="${meta.icon}" alt="" style="width:22px;height:22px;object-fit:contain;" />
    <span>${data?.title || meta.title}</span>`;

  const NPC_WORK_BG_MAP = {
    modal_blacksmith: './assets/ui/npc_bg_blacksmith.jpg?v=227',
    modal_alchemy:    './assets/ui/npc_bg_alchemy.jpg?v=227',
    modal_market:     './assets/ui/npc_bg_market.jpg?v=227',
    modal_bounty:     './assets/ui/npc_bg_bounty.jpg?v=227',
    modal_trainer:    './assets/ui/npc_bg_trainer.jpg?v=227',
    modal_sanctum:    './assets/ui/npc_bg_sanctum.jpg?v=227',
    modal_vault:      './assets/ui/npc_bg_vault.jpg?v=227',
    modal_tavern:     './assets/ui/npc_bg_tavern.jpg?v=227',
    modal_waypoint:   './assets/ui/npc_bg_waypoint.jpg?v=227',
    modal_portal:     './assets/ui/npc_bg_portal.jpg?v=227',
    modal_tower:      './assets/ui/npc_bg_tower.jpg?v=227',
  };
  const workBgUrl = NPC_WORK_BG_MAP[action] || './assets/ui/npc_bg_gift.jpg?v=227';
  const workspaceHtml = buildWorkspaceHtml(ui, action, data, ctx, deps, st, chIdx, chapter);

  bodyEl.innerHTML = `
    <div class="npc-shell">
      <aside class="npc-stage-col">
        <div class="npc-canvas-wrap">
          <canvas id="npc-stage-canvas" class="npc-stage-canvas" width="282" height="248"></canvas>
          <div id="npc-anim-slot" class="npc-anim-slot"></div>
          <div class="npc-ch-badge">${CHAPTER_NAMES[chapter - 1] || `第 ${chapter} 章`}</div>
          <div class="npc-nameplate">
            <strong>${npcName}</strong>
            <span>${npcTitle}</span>
          </div>
        </div>
        <div id="npc-speech-box" class="npc-speech-box">「${npcGreeting}」</div>
        <div class="npc-res-bar">
          <div class="npc-res-chip" title="金幣">${SVG.gold}<span>${fmtNum(st.gold)}</span></div>
          <div class="npc-res-chip" title="奧術粉塵">${SVG.dust}<span>${fmtNum(st.dust)}</span></div>
          <div class="npc-res-chip" title="魂晶">${SVG.crystal}<span>${fmtNum(st.soulCrystals)}</span></div>
        </div>
      </aside>
      <section class="npc-work-col has-npc-art-bg" id="npc-work-col" data-action="${action}" style="background-image: linear-gradient(180deg, rgba(10,8,14,0.34) 0%, rgba(10,8,14,0.52) 55%, rgba(8,7,12,0.72) 100%), url('${workBgUrl}');">${workspaceHtml}</section>
    </div>
  `;

  const canvas = document.getElementById('npc-stage-canvas');
  const animSlot = document.getElementById('npc-anim-slot');
  activeStageEngine = new NpcStageEngine(canvas, {
    chapter,
    action,
    npcUrl: npcImgUrl,
    bldUrl: bldImgUrl,
    animatedUrl,
    animatedSlotEl: animSlot,
  });

  const say = (text, burstKind = 'success') => {
    const box = document.getElementById('npc-speech-box');
    if (box && text) {
      box.textContent = `「${text}」`;
      box.classList.remove('is-reacting');
      void box.offsetWidth;
      box.classList.add('is-reacting');
    }
    activeStageEngine?.triggerActionBurst(burstKind);
  };

  bindWorkspaceEvents(ui, action, data, ctx, deps, st, chIdx, bodyEl, modal, say);

  if (closeBtn && !closeBtn.dataset.npcV2Bound) {
    closeBtn.dataset.npcV2Bound = '1';
    closeBtn.addEventListener('click', () => {
      destroyActiveNpcStage();
      modal.classList.add('hidden');
    });
  }

  modal.classList.remove('hidden');
}

function buildWorkspaceHtml(ui, action, data, ctx, deps, st, chIdx, chapter) {
  const gold = Number(st.gold) || 0;
  const dust = Number(st.dust) || 0;
  const crystals = Number(st.soulCrystals) || 0;
  const chMult = 1 + chIdx * 0.4;

  if (action === 'modal_blacksmith') {
    return renderDeepBlacksmithHTML(ui, st);
  }

  if (action === 'modal_alchemy') {
    return renderDeepAlchemyHTML(ui, st, chMult);
  }

  if (action === 'modal_market') {
    return renderDeepMarketHTML(ui, st, chMult);
  }

  if (action === 'modal_portal') {
    const maxStg = st.maxStageReached || st.maxStage || st.stage || 1;
    const getChIdx = deps.getChapterIdx || ((s) => Math.min(9, Math.floor((Math.max(1, s) - 1) / 10)));
    const maxCh = Math.min(9, getChIdx(maxStg));
    const RING_COORDS = [
      [50.0, 12.5], [64.5, 19.5], [72.0, 35.5], [72.0, 56.5], [64.5, 76.5],
      [50.0, 86.5], [35.5, 76.5], [28.0, 56.5], [28.0, 35.5], [35.5, 19.5],
    ];
    return `
      <div class="npc-sec-head" style="margin-bottom:6px;">
        <div class="npc-sec-title">十界星門星象羅盤（點選星環錨點傳送）</div>
        <button id="btn-portal-map" class="npc-btn-secondary"><span>開啟 2.5D 世界地圖</span>${SVG.arrow}</button>
      </div>
      <div class="v229-starmap-dial">
        <button type="button" id="btn-portal-battle" class="v229-vortex-btn" title="立即踏入星門出城戰鬥">
          <span>⚔️</span>
          <b>出城戰鬥</b>
        </button>
        ${CHAPTER_NAMES.map((cname, idx) => {
          const isCur = idx === chIdx;
          const unlocked = idx <= maxCh;
          const [px, py] = RING_COORDS[idx];
          const shortName = cname.split('・')[1] || cname;
          return `
            <button type="button" class="v229-dial-node ${isCur ? 'is-current' : ''} ${unlocked ? 'is-unlocked' : ''}" data-tp-ch="${idx}" style="left:${px}%;top:${py}%;" title="${cname}（${isCur ? '目前所在' : (unlocked ? '點擊傳送' : '觀光傳送')}）">
              <span class="v229-dn-num">CH.${idx + 1}</span>
              <span class="v229-dn-name">${shortName}</span>
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  if (action === 'modal_bounty') {
    const bp = st.bountyProgress || {};
    const kills = bp.kills ?? st.kills ?? 0;
    const bossKills = bp.bossKills ?? 0;
    const claimed = bp.claimed || {};
    const lv = st.level || 1;
    const maxStage = st.maxStageReached || st.stage || 1;
    const todayKey = new Date().toISOString().slice(0, 10);
    const hasTownBuff = Object.entries(st.potionBuffs || {}).some(([k, v]) => k.endsWith('Until') && v > Date.now());
    const chBase = (chapter - 1) * 10 + 1;
    const chMult = Math.pow(1.45, chapter - 1);

    const QUEST_TABS = [
      { id: 'hunt',   label: '⚔️ 討伐懸賞', sub: '獎勵：金幣・粉塵・稀有裝備箱' },
      { id: 'boss',   label: '💀 首領通緝', sub: '獎勵：技能點・保護石・傳說裝備箱' },
      { id: 'growth', label: '🏆 成長試煉', sub: '獎勵：魂晶・寵物精華' },
      { id: 'daily',  label: '☀️ 每日任務', sub: '獎勵：藥水禮盒・寵物精華（每日重置）' },
    ];

    const ALL_QUESTS = {
      hunt: [
        { id: `ch${chapter}_q1`, catLabel: '討伐懸賞', tag: '清怪懸賞', cls: '', title: `第 ${chapter} 章前線清剿`, desc: `於深淵戰場累計擊殺魔物`, cur: kills, req: Math.round(30 * Math.pow(2.1, chapter - 1)), rewardTags: [`💰 ${fmtNum(Math.round(600 * chMult))} 金`, `✨ ${Math.round(25 * chMult)} 粉塵`, '📦 稀有裝備箱'], rewards: { gold: Math.round(600 * chMult), dust: Math.round(25 * chMult), rareBox: true, stageHint: chBase } },
        { id: `ch${chapter}_q3`, catLabel: '討伐懸賞', tag: '百戰試煉', cls: 'is-trial', title: `第 ${chapter} 章哨兵百戰`, desc: `持續掃蕩魔物群達成里程碑`, cur: kills, req: Math.round(120 * Math.pow(1.9, chapter - 1)), rewardTags: [`💰 ${fmtNum(Math.round(2400 * chMult))} 金`, `✨ ${Math.round(80 * chMult)} 粉塵`, '📦 稀有裝備箱'], rewards: { gold: Math.round(2400 * chMult), dust: Math.round(80 * chMult), rareBox: true, stageHint: chBase + 4 } },
      ],
      boss: [
        { id: `ch${chapter}_q2`, catLabel: '首領通緝', tag: '首領通緝', cls: 'is-elite', title: `討伐第 ${chapter} 章首領`, desc: `擊破精英小王或章節首領`, cur: bossKills, req: Math.max(2, chapter * 2), rewardTags: ['📘 +1 技能點', '🛡️ 保護石 ×1'], rewards: { sp: 1, protectStones: 1 } },
        { id: `ch${chapter}_boss_pro`, catLabel: '首領通緝', tag: '弒王懸賞', cls: 'is-elite', title: `第 ${chapter} 章極限弒王`, desc: `累計擊破更多區域首領`, cur: bossKills, req: Math.max(5, chapter * 5), rewardTags: ['🛡️ 保護石 ×2', '🌟 傳說裝備箱'], rewards: { protectStones: 2, legendaryBox: true, stageHint: chBase + 9 } },
      ],
      growth: [
        { id: 'grow_lv10', catLabel: '成長試煉', tag: '等級里程碑', cls: '', title: '初階覺醒：角色達 Lv.15', desc: '鍛鍊職業等級突破 15 級', cur: lv, req: 15, rewardTags: ['🔮 魂晶 ×2', '🐾 寵物精華 ×30'], rewards: { crystals: 2, petEssence: 30 } },
        { id: 'grow_lv30', catLabel: '成長試煉', tag: '高階覺醒', cls: 'is-trial', title: '深淵宗師：角色達 Lv.30', desc: '鍛鍊職業等級突破 30 級', cur: lv, req: 30, rewardTags: ['🔮 魂晶 ×5', '🐾 寵物精華 ×60'], rewards: { crystals: 5, petEssence: 60 } },
        { id: 'grow_st20', catLabel: '成長試煉', tag: '征途推進', cls: '', title: '遠征突破：解鎖第 2-10 關', desc: '推進主線關卡至第 20 關', cur: maxStage, req: 20, rewardTags: ['🔮 魂晶 ×4', '🐾 寵物精華 ×50'], rewards: { crystals: 4, petEssence: 50 } },
      ],
      daily: [
        { id: `daily_kill_${todayKey}`, catLabel: '每日任務', tag: '今日清剿', cls: '', title: '每日例行巡邏（擊殺 50 隻）', desc: '每日登入並達成基礎擊殺門檻', cur: Math.min(kills, 50), req: 50, rewardTags: ['🧪 經驗+尋寶藥水禮盒', '🐾 寵物精華 ×20'], rewards: { potionBundle: true, petEssence: 20 } },
        { id: `daily_boss_${todayKey}`, catLabel: '每日任務', tag: '今日討伐', cls: 'is-elite', title: '每日首領巡查（擊破 1 隻首領）', desc: '每日至少擊破 1 隻首領', cur: Math.min(bossKills, 1), req: 1, rewardTags: ['🧪 經驗+尋寶藥水禮盒', '🐾 寵物精華 ×35'], rewards: { potionBundle: true, petEssence: 35 } },
        { id: `daily_bless_${todayKey}`, catLabel: '每日任務', tag: '主城祈福', cls: 'is-trial', title: '點燃主城祝福地標', desc: '於任一主城點燃烽火台／噴泉獲得祝福', cur: hasTownBuff ? 1 : 0, req: 1, rewardTags: ['🐾 寵物精華 ×25', '✨ 粉塵 ×40'], rewards: { petEssence: 25, dust: 40 } },
      ],
    };

    window.__v223ActiveQuestMap = {};
    Object.values(ALL_QUESTS).flat().forEach((q) => { window.__v223ActiveQuestMap[q.id] = q; });

    const curList = ALL_QUESTS[activeBountyTab] || ALL_QUESTS.hunt;
    const curTabMeta = QUEST_TABS.find((t) => t.id === activeBountyTab) || QUEST_TABS[0];

    return `
      <div class="npc-sec-head">
        <div class="npc-sec-title">第 ${chapter} 章實木懸賞告示板</div>
        <span style="font-size:12px;color:#cbd5e1;">累計擊殺：<b>${fmtNum(kills)}</b> ｜ 首領：<b>${fmtNum(bossKills)}</b> ｜ 等級：<b>Lv.${lv}</b></span>
      </div>
      <div class="v223-tab-row">
        ${QUEST_TABS.map((t) => {
          const readyCnt = (ALL_QUESTS[t.id] || []).filter((q) => q.cur >= q.req && !claimed[q.id]).length;
          return `<button type="button" class="v223-tab-btn ${activeBountyTab === t.id ? 'is-active' : ''}" data-qtab="${t.id}">${t.label}${readyCnt ? ` <span class="v223-tab-dot">${readyCnt}</span>` : ''}</button>`;
        }).join('')}
      </div>
      <div class="v223-tab-hint">🎁 本類專屬獎勵方向：<b>${curTabMeta.sub}</b></div>
      <div class="bounty-board v223-bounty-grid">
        ${curList.map((q) => {
          const isClaimed = !!claimed[q.id];
          const pct = Math.min(100, Math.floor((q.cur / Math.max(1, q.req)) * 100));
          const ready = q.cur >= q.req && !isClaimed;
          return `
            <div class="wanted-poster ${q.cls} ${isClaimed ? 'is-claimed-poster' : ''}">
              <div>
                <div class="poster-pin"></div>
                <div style="font-size:10.5px;font-weight:900;color:var(--npc-accent);text-align:center;margin-bottom:4px;">【${q.tag}】</div>
                <div class="npc-card-title" style="text-align:center;">${q.title}</div>
                <div class="npc-card-desc" style="text-align:center;margin:4px 0 8px;">${q.desc}</div>
                <div class="v223-reward-pills">${q.rewardTags.map((rt) => `<span class="v223-rpill">${rt}</span>`).join('')}</div>
                <div class="npc-progress-track" style="margin-top:8px;"><div class="npc-progress-fill" style="width:${pct}%"></div></div>
                <div style="font-size:11px;color:#cbd5e1;text-align:center;margin-top:4px;">${fmtNum(Math.min(q.cur, q.req))} / ${fmtNum(q.req)}（${pct}%）</div>
              </div>
              ${(() => {
                const acceptedList = Array.isArray(st.acceptedQuests) ? st.acceptedQuests : [];
                const isAccepted = acceptedList.includes(q.id);
                if (isClaimed) return `<div class="npc-btn-claimed"><img class="v229-wax-ico" src="./assets/ui/ui_wax_stamp.png?v=229" alt="" /><span>已完成並領獎</span></div>`;
                if (!isAccepted) return costBtnHtml(`data-accept-quest="${q.id}"`, '📜 接取任務', '追蹤至介面', true);
                if (ready) {
                  return `<div style="display:flex;gap:6px;width:100%;">
                    ${costBtnHtml(`data-bounty-v223="${q.id}"`, '🎁 領取獎勵', '100%', true)}
                  </div>`;
                }
                return `<div style="display:flex;gap:6px;width:100%;align-items:center;">
                  <div style="flex:1;text-align:center;font-size:11.5px;color:#fde68a;font-weight:800;padding:8px 6px;border-radius:8px;background:rgba(245,158,11,0.14);border:1px solid rgba(245,158,11,0.35);">追蹤中 (${pct}%)</div>
                  <button type="button" class="v227-abandon-btn" data-abandon-quest="${q.id}" title="放棄並從左側任務欄移除">放棄</button>
                </div>`;
              })()}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  if (action === 'modal_trainer') {
    const cid = st.classId || 'warrior';
    const presets = st.skillPresetsByClass?.[cid] || [null, null, null];
    const eqSkills = (st.equippedSkillsByClass?.[cid] || []).filter(Boolean);
    const bestDps = Number(st.bestDummyDps) || 0;
    const stats = ctx?.getComputedStats?.() || {};
    const estDps = Number(stats.dps) || 0;
    const critPct = Math.round((Number(stats.critRate) || 0) * 100);
    return `
      <div class="npc-sec-head">
        <div class="npc-sec-title">實戰演武木樁場與劍譜流派</div>
        <button id="btn-tr-drawer" class="npc-btn-secondary"><span>開啟天賦與技能面板 (K)</span>${SVG.arrow}</button>
      </div>
      <div class="trainer-arena">
        <div id="dummy-target-box" class="dummy-target-box">
          ${SVG.dummy}
          <span style="font-size:11px;color:#fde68a;margin-top:6px;">演武木樁（實戰測試）</span>
        </div>
        <div style="display:flex;flex-direction:column;justify-content:space-between;gap:8px;">
          <div>
            <div class="npc-card-title">歷史最高木樁 DPS：${fmtNum(bestDps)}</div>
            <div id="npc-dummy-status" class="npc-card-desc">面板預估秒傷：${fmtNum(estDps)} ｜ 暴擊率：${critPct}%</div>
            <div style="font-size:11.5px;color:#cbd5e1;margin-top:4px;">當前技能：${eqSkills.length ? eqSkills.join(' / ') : '尚未配置技能'}</div>
          </div>
          <div class="npc-progress-track"><div id="npc-dummy-bar" class="npc-progress-fill" style="width:0%"></div></div>
          ${costBtnHtml('id="btn-start-dummy"', '開始 10 秒木樁實戰演武', '免費演武', true)}
        </div>
      </div>
      <div class="skill-scroll-row">
        ${['劍譜 A・清圖群攻', '劍譜 B・單體首領', '劍譜 C・自訂流派'].map((label, idx) => {
          const p = presets[idx];
          return `
            <div class="skill-scroll-card">
              <div class="npc-card-title" style="font-size:12.5px;">${label}</div>
              <div class="npc-card-desc">${p ? '已錄入技能連招' : '空白捲軸'}</div>
              <div style="display:flex;gap:6px;margin-top:auto;">
                <button data-save-preset="${idx}" class="npc-btn-secondary" style="flex:1;justify-content:center;">錄入</button>
                <button data-apply-preset="${idx}" class="npc-btn-secondary" style="flex:1;justify-content:center;" ${p ? '' : 'disabled'}>套用</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  if (action === 'modal_sanctum') {
    const lv = st.sanctumLevels || {};
    const auras = [
      { id: 'atk_aura', name: '水晶武魄光環', desc: '永久全攻擊力 +6%・最大生命 +6% / 級', cur: Number(lv.atk_aura) || 0, baseCost: 2 },
      { id: 'loot_aura', name: '秘寶指引光環', desc: '永久掉寶率 +12%・金幣掉落 +12% / 級', cur: Number(lv.loot_aura) || 0, baseCost: 2 },
      { id: 'boss_aura', name: '弒神威壓光環', desc: '永久暴擊傷害 +15%・全減傷 +2% / 級', cur: Number(lv.boss_aura) || 0, baseCost: 3 },
    ];
    return `
      <div class="npc-sec-head">
        <div class="npc-sec-title">三芒星靈魂水晶祭壇</div>
        <button id="btn-sanctum-rebirth" class="npc-btn-secondary"><span>開啟輪迴轉生面板 (V)</span>${SVG.arrow}</button>
      </div>
      <div class="sanctum-altar-core">
        <div style="width:42px;height:42px;display:flex;align-items:center;justify-content:center;">${SVG.crystal}</div>
        <div>
          <div class="npc-card-title">當前持有靈魂水晶：${fmtNum(crystals)} 顆</div>
          <div class="npc-card-desc">點亮下方三芒星節點，光環效果將跨越多輪深淵輪迴永久保留。</div>
        </div>
      </div>
      <div class="npc-card-grid">
        ${auras.map((a) => {
          const cost = a.baseCost + a.cur * 2;
          return `
            <div class="npc-card is-highlight">
              <div>
                <div class="npc-card-title">${a.name}（Lv.${a.cur}/10）</div>
                <div class="crystal-pips">
                  ${Array.from({ length: 10 }, (_, idx) => `<div class="crystal-pip ${idx < a.cur ? 'is-lit' : ''}"></div>`).join('')}
                </div>
                <div class="npc-card-desc">${a.desc}</div>
              </div>
              ${costBtnHtml(`data-sanctum="${a.id}"`, '注入魂晶點亮', `${cost} 魂晶`, crystals >= cost)}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  if (action === 'modal_vault') {
    const VAULT_TAB_NAMES = ['頁 1・裝備庫', '頁 2・傳說套裝', '頁 3・備用庫', '頁 4・雜項庫'];
    const tabs = Array.isArray(st.vaultTabs)
      ? st.vaultTabs
      : [Array.isArray(st.vaultItems) ? st.vaultItems : [], [], [], []];
    const curItems = tabs[activeVaultTab] || [];
    const rules = st.vaultRules || {};
    const invItems = (st.inventory || []).filter(Boolean).slice(0, 24);
    const rarColor = { common: '#cbd5e1', magic: '#60a5fa', rare: '#facc15', legendary: '#fb923c', set: '#4ade80' };

    return `
      <div class="npc-sec-head">
        <div class="npc-sec-title">冒險者金庫・分頁倉庫（本頁 ${curItems.length} / 24 格）</div>
        <button id="btn-vault-bag" class="npc-btn-secondary"><span>開啟完整背包 (B)</span>${SVG.arrow}</button>
      </div>
      <div class="v223-tab-row">
        ${VAULT_TAB_NAMES.map((tn, idx) => {
          const cnt = (tabs[idx] || []).length;
          return `<button type="button" class="v223-tab-btn ${activeVaultTab === idx ? 'is-active' : ''}" data-vtab="${idx}">${tn} <small style="opacity:.8;">(${cnt}/24)</small></button>`;
        }).join('')}
      </div>
      <div class="v232-vault-grid">
        ${Array.from({ length: 24 }, (_, slotIdx) => {
          const it = curItems[slotIdx];
          if (!it) {
            return `<div class="v232-vslot is-empty"><span>#${slotIdx + 1}</span></div>`;
          }
          const rMeta = RARITIES[it.rarity] || { border: rarColor[it.rarity] || '#cbd5e1', bg: 'rgba(18,14,14,0.9)' };
          const upg = it.upgradeLevel ? `<span class="v232-vslot-upg">+${it.upgradeLevel}</span>` : '';
          const eqSlot = st.equipment?.[it.slot];
          const pDiff = calcItemPower(it) - calcItemPower(eqSlot);
          const deltaBadge = pDiff > 0 ? '<span class="v232-vslot-delta up">▲</span>' : (pDiff < 0 ? '<span class="v232-vslot-delta down">▼</span>' : '');
          return `
            <button type="button" class="v232-vslot is-filled" data-vault-out-tab="${slotIdx}" style="border-color:${rMeta.border};background:${rMeta.bg};">
              <img class="v232-vslot-img" src="${resolveItemIconUniversal(it)}" alt="${it.name}" />
              ${upg}
              ${deltaBadge}
              <span class="v232-vslot-lvl">Lv.${it.level || 1}</span>
            </button>
          `;
        }).join('')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px;">
        <button id="btn-rule-cls" class="npc-btn-toggle ${rules.keepClassReq ? 'is-active' : ''}" style="justify-content:space-between;">
          <span>${SVG.lock} 自動鎖定本職業專屬裝</span>
          <span>${rules.keepClassReq ? '已開啟' : '未啟用'}</span>
        </button>
        <button id="btn-rule-crit" class="npc-btn-toggle ${rules.keepDoubleCrit ? 'is-active' : ''}" style="justify-content:space-between;">
          <span>${SVG.lock} 自動鎖定雙爆詞綴裝備</span>
          <span>${rules.keepDoubleCrit ? '已開啟' : '未啟用'}</span>
        </button>
      </div>
      <div class="v223-bag-deposit-box">
        <div style="font-size:12px;font-weight:800;color:#fde68a;margin-bottom:6px;">🎒 目前背包裝備（點擊一鍵存入「${VAULT_TAB_NAMES[activeVaultTab]}」）：</div>
        <div class="v232-dep-grid">
          ${invItems.length
            ? invItems.map((it) => {
                const rMeta = RARITIES[it.rarity] || { border: rarColor[it.rarity] || '#e2e8f0', bg: 'rgba(18,14,14,0.9)' };
                const upg = it.upgradeLevel ? `<span class="v232-vslot-upg">+${it.upgradeLevel}</span>` : '';
                return `<button type="button" data-vault-in-tab="${it.uid}" class="v232-dep-slot" style="border-color:${rMeta.border};background:${rMeta.bg};"><img src="${resolveItemIconUniversal(it)}" alt="${it.name}" />${upg}</button>`;
              }).join('')
            : '<span style="font-size:12px;color:#94a3b8;">目前背包內沒有可存入的裝備。</span>'}
        </div>
      </div>
    `;
  }

  if (action === 'modal_tavern') {
    const feastCost = (chIdx + 1) * 350;
    return `
      <div class="npc-sec-head"><div class="npc-sec-title">酒館壁爐休憩與豐盛菜單</div></div>
      <div class="npc-card-grid">
        <div class="npc-card is-highlight">
          <div class="npc-card-title">壁爐免費休憩</div>
          <div class="npc-card-desc">立即將生命值與藥水回復至 100%。</div>
          ${costBtnHtml('id="btn-tavern-rest"', '免費休憩回滿', '免費', true)}
        </div>
        <div class="npc-card">
          <div class="npc-card-title">冒險者豐盛大餐</div>
          <div class="npc-card-desc">享用主廚特製烤肉，獲得短時間全屬性激勵！</div>
          ${costBtnHtml('id="btn-tavern-feast"', '點購豐盛盛宴', `${fmtNum(feastCost)} G`, gold >= feastCost)}
        </div>
      </div>
    `;
  }

  // =========================================================
  // 完整修復 modal_waypoint：城內瞬移 + 出城打第 X 關 + 10 章主城傳送
  // =========================================================
  if (action === 'modal_waypoint') {
    const wps = ctx?.getWaypoints?.() || [];
    const maxStg = st.maxStageReached || st.maxStage || st.stage || 1;
    const getChIdx = deps.getChapterIdx || ((s) => Math.min(9, Math.floor((Math.max(1, s) - 1) / 10)));
    const maxCh = Math.min(9, getChIdx(maxStg));
    const getStageLabel = deps.getStageLabel || ((s) => `${Math.floor((s - 1) / 10) + 1}-${((s - 1) % 10) + 1}`);
    const quickStages = [chIdx * 10 + 1, chIdx * 10 + 5, chIdx * 10 + 10].filter((s) => s <= maxStg);

    return `
      <div class="npc-sec-head">
        <div class="npc-sec-title">城內設施瞬移節點</div>
        <button id="btn-wp-exit-cur" class="npc-btn-primary" style="width:auto;"><span>繼續第 ${getStageLabel(st.stage || 1)} 關作戰</span></button>
      </div>
      <div class="npc-chip-list">
        ${wps.map((wp, idx) => `<button data-wp-idx="${idx}" class="npc-btn-secondary">${wp.label || `傳送點 ${idx + 1}`}</button>`).join('')}
      </div>
      ${quickStages.length ? `
        <div class="npc-sec-head"><div class="npc-sec-title">快速出城挑戰本章關卡</div></div>
        <div class="npc-chip-list">
          ${quickStages.map((s) => `<button data-wp-stg="${s}" class="npc-btn-secondary">出城打第 ${getStageLabel(s)} 關</button>`).join('')}
        </div>
      ` : ''}
      <div class="npc-sec-head"><div class="npc-sec-title">跨章節主城傳送（1～10 章）</div></div>
      <div class="starmap-route">
        ${CHAPTER_NAMES.map((name, i) => {
          const isCur = i === chIdx;
          const isUnlocked = i <= maxCh;
          const cls = isCur ? 'is-current' : (isUnlocked ? '' : 'is-preview');
          return `
            <button data-wp-ch="${i}" class="starmap-node ${cls}" ${isCur ? 'disabled' : ''}>
              <span style="font-size:12.5px;font-weight:800;">${name}</span>
              <span class="starmap-badge">${isCur ? '所在主城' : (isUnlocked ? '傳送' : '觀光傳送')}</span>
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  if (action === 'modal_tower') {
    const pool = deps.ZONE_POOLS?.[chIdx] || [];
    const templates = deps.MONSTER_TEMPLATES || {};
    return `
      <div class="npc-sec-head"><div class="npc-sec-title">第 ${chapter} 章魔物偵察檔案</div></div>
      <div class="npc-card-grid">
        ${pool.map((mid) => {
          const m = templates[mid] || { name: mid };
          return `<div class="npc-card"><div class="npc-card-title">${m.name || mid}</div><div class="npc-card-desc">${m.desc || `出沒於第 ${chapter} 章區域。`}</div></div>`;
        }).join('')}
      </div>
    `;
  }

  if (action === 'modal_patrol_guard' || action === 'modal_patrol_villager') {
    const isGuard = action === 'modal_patrol_guard';
    const cdUntil = isGuard ? (st.guardBlessCdUntil || 0) : (st.villagerGiftCdUntil || 0);
    const remainSec = Math.max(0, Math.ceil((cdUntil - Date.now()) / 1000));
    const btnId = isGuard ? 'btn-guard-bless' : 'btn-villager-gift';
    return `
      <div class="npc-sec-head"><div class="npc-sec-title">${isGuard ? '城防激勵祝福' : '旅途見面小禮'}</div></div>
      <div class="chapter-gift-box">
        <div class="npc-card-title">${isGuard ? '城防堅盾鼓舞（3 分鐘防禦 +10%）' : '行腳旅人的補給小包'}</div>
        ${remainSec > 0 ? `<div class="npc-btn-claimed">冷卻倒數中（${remainSec} 秒）</div>` : costBtnHtml(`id="${btnId}"`, isGuard ? '領取衛兵激勵' : '收下旅人贈禮', '免費領取', true)}
      </div>
    `;
  }

  const CHAPTER_GIFTS = {
    modal_scout: { key: 'ch1ScoutGiftClaimed', btn: 'btn-claim-scout', title: '曙光哨站新人補給包', rewards: ['500 金幣', '經驗藥水（60 秒 +50% 經驗）'], tip: '點擊城中央「曙光烽火台」可獲得 5 分鐘全屬性祝福。' },
    modal_smuggler: { key: 'ch2SmugglerGiftClaimed', btn: 'btn-claim-smuggler', title: '洞窟走私見面禮盒', rewards: ['1,500 金幣', '奧術粉塵補給'], tip: '轉動城內的「高壓蒸汽閥門」可釋放蒸汽並瞬間回滿生命與能量。' },
    modal_chronicler: { key: 'ch3ChroniclerGiftClaimed', btn: 'btn-claim-chronicler', title: '聖骨墓穴手札禮盒', rewards: ['3,000 金幣', '聖骨靈魂精華'], tip: '點燃「祈禱幽藍燭台」可撫平傷痛並回復全部狀態。' },
    modal_forgemaster: { key: 'ch4ForgemasterGiftClaimed', btn: 'btn-claim-forgemaster', title: '熔爐宗師赤炎禮盒', rewards: ['6,000 金幣', '高純度鍛造粉塵'], tip: '開啟「熔岩閘門壓力閥」可瞬間冷卻回滿血量。' },
    modal_contractor: { key: 'ch5ContractorGiftClaimed', btn: 'btn-claim-contractor', title: '王庭黃金魔契禮盒', rewards: ['10,000 金幣', '戰鬥秘藥補給'], tip: '飲用「猩紅聖血聖杯座」可立即回復全部生命與能量。' },
    modal_shaman: { key: 'ch6ShamanGiftClaimed', btn: 'btn-claim-shaman', title: '極地先知冰晶禮盒', rewards: ['20,000 金幣', '靈魂結晶補給'], tip: '靠近「北歐符文暖火盆」可驅散寒霜並回滿狀態。' },
    modal_witchdoctor: { key: 'ch7WitchdoctorGiftClaimed', btn: 'btn-claim-witchdoctor', title: '翡翠部族巫醫聖禮', rewards: ['35,000 金幣', '大量強化粉塵'], tip: '吹響「沼澤巫毒號角柱」可招來治癒螢火蟲群回滿生命。' },
    modal_engineer: { key: 'ch8EngineerGiftClaimed', btn: 'btn-claim-engineer', title: '蒼穹電弧補給箱', rewards: ['50,000 金幣', '奧術秘藥核心'], tip: '釋放「特斯拉線圈」高壓電流可瞬間恢復全部生命與能量。' },
    modal_penitent: { key: 'ch9PenitentGiftClaimed', btn: 'btn-claim-penitent', title: '聖血薔薇苦行賜福', rewards: ['80,000 金幣', '聖光魂晶祝福'], tip: '敲響「修道院黃金大鐘」可降下聖光洗禮回滿狀態。' },
    modal_weaver: { key: 'ch10WeaverGiftClaimed', btn: 'btn-claim-weaver', title: '星界編織者終極聖禮', rewards: ['十界星輝重金', '終極魂晶與秘藥'], tip: '沐浴於「星界銀河許願泉」可瞬間恢復全部生命與能量。' },
  };
  const gift = CHAPTER_GIFTS[action];
  if (gift) {
    const claimed = !!st[gift.key];
    return `
      <div class="npc-sec-head"><div class="npc-sec-title">第 ${chapter} 章限定・封蠟補給禮盒</div></div>
      <div class="chapter-gift-box ${claimed ? 'is-gift-claimed' : ''}">
        <div style="display:flex;align-items:center;gap:12px;">
          ${SVG.chestHigh}
          <div>
            <div class="npc-card-title" style="font-size:15px;color:${claimed ? '#94a3b8' : '#fef3c7'};">${gift.title}</div>
            <div class="npc-chip-list" style="margin-top:6px;">
              ${gift.rewards.map((r) => `<span class="npc-item-pill ${claimed ? '' : 'is-selected'}">${r}</span>`).join('')}
            </div>
          </div>
        </div>
        <div class="landmark-tip-bar">主城地標攻略：${gift.tip}</div>
        ${claimed
          ? `<button type="button" class="v223-gift-claimed-btn" disabled>${SVG.check} <span>已領取本章節補給（不可重複領取）</span></button>`
          : costBtnHtml(`id="${gift.btn}"`, '拆開蠟封領取補給', '章節限定 1 次', true)}
      </div>
    `;
  }

  return `<div class="npc-card"><div class="npc-card-desc">此設施準備中。</div></div>`;
}

function bindWorkspaceEvents(ui, action, data, ctx, deps, st, chIdx, bodyEl, modal, say) {
  const reopen = () => renderTownFacilityModal(ui, action, data, ctx, deps);
  const closeAnd = (fn) => {
    destroyActiveNpcStage();
    modal.classList.add('hidden');
    fn?.();
  };

  if (action === 'modal_alchemy') {
    bindDeepAlchemyEvents(bodyEl, ui, st, ctx, 1 + chIdx * 0.4, reopen, say);
  } else if (action === 'modal_market') {
    bindDeepMarketEvents(bodyEl, ui, st, ctx, 1 + chIdx * 0.4, reopen, say);
  } else if (action === 'modal_blacksmith') {
    bindDeepBlacksmithEvents(bodyEl, ui, st, ctx, reopen, say, closeAnd);
  } else if (action === 'modal_portal') {
    bodyEl.querySelector('#btn-portal-battle')?.addEventListener('click', () => closeAnd(() => ctx?.onExitTown?.()));
    bodyEl.querySelector('#btn-portal-map')?.addEventListener('click', () => closeAnd(() => ctx?.onOpenWorldMap?.()));
    bodyEl.querySelectorAll('button[data-tp-ch]').forEach((b) => b.addEventListener('click', () => closeAnd(() => ctx?.onTeleportTown?.(Number(b.dataset.tpCh)))));
  } else if (action === 'modal_bounty') {
    bodyEl.querySelectorAll('button[data-qtab]').forEach((btn) => {
      btn.addEventListener('click', () => { activeBountyTab = btn.dataset.qtab || 'hunt'; reopen(); });
    });
    bodyEl.querySelectorAll('button[data-accept-quest]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const q = window.__v223ActiveQuestMap?.[btn.dataset.acceptQuest];
        if (q && window.__IDLE_ARPG_BRIDGE__?.acceptQuest?.(q)) {
          say(`已接取任務「${q.title}」，已顯示於左側任務追蹤欄！`, 'success');
          setTimeout(reopen, 180);
        }
      });
    });
    bodyEl.querySelectorAll('button[data-abandon-quest]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const qid = btn.dataset.abandonQuest;
        if (window.__IDLE_ARPG_BRIDGE__?.abandonQuest?.(qid)) {
          say('已放棄該任務並從左側任務欄移除。', 'info');
          setTimeout(reopen, 180);
        }
      });
    });
    bodyEl.querySelectorAll('button[data-bounty-v223]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const q = window.__v223ActiveQuestMap?.[btn.dataset.bountyV223];
        if (q && window.__IDLE_ARPG_BRIDGE__?.claimCategorizedQuest?.(q)) {
          say('賞金與專屬獎勵已核發！', 'success');
          setTimeout(reopen, 220);
        }
      });
    });
  } else if (action === 'modal_tavern') {
    const feastCost = (chIdx + 1) * 350;
    bodyEl.querySelector('#btn-tavern-rest')?.addEventListener('click', () => closeAnd(() => ctx?.onTavernRest?.()));
    bodyEl.querySelector('#btn-tavern-feast')?.addEventListener('click', () => { ctx?.onTavernFeast?.(feastCost); say('大快朵頤！', 'success'); setTimeout(reopen, 260); });
  } else if (action === 'modal_trainer') {
    bodyEl.querySelector('#btn-tr-drawer')?.addEventListener('click', () => closeAnd(() => ctx?.onOpenDrawer?.('skills')));
    bodyEl.querySelectorAll('button[data-save-preset]').forEach((b) => b.addEventListener('click', () => { ctx?.onSaveSkillPreset?.(Number(b.dataset.savePreset)); say('劍譜連招已錄入！', 'success'); setTimeout(reopen, 240); }));
    bodyEl.querySelectorAll('button[data-apply-preset]').forEach((b) => b.addEventListener('click', () => { ctx?.onApplySkillPreset?.(Number(b.dataset.applyPreset)); say('劍譜流派切換完成！', 'success'); setTimeout(reopen, 240); }));
    bodyEl.querySelector('#btn-start-dummy')?.addEventListener('click', (e) => {
      if (ctx?.onEnterTrainingArena) { closeAnd(() => ctx.onEnterTrainingArena()); return; }
      e.currentTarget.disabled = true;
      const stats = ctx?.getComputedStats?.() || {};
      const baseDps = Math.max(50, Number(stats.dps) || Number(stats.atk) * 2 || 120);
      let elapsed = 0, totalDmg = 0, maxCrit = 0;
      say('全力出招！木樁演武正式開始！', 'impact');
      if (activeDummyTimer) clearInterval(activeDummyTimer);
      activeDummyTimer = setInterval(() => {
        elapsed += 1;
        const tickDmg = Math.floor(baseDps * (0.85 + Math.random() * 0.45));
        totalDmg += tickDmg;
        if (tickDmg > maxCrit) maxCrit = Math.floor(tickDmg * 1.45);
        const statusEl = document.getElementById('npc-dummy-status');
        const barEl = document.getElementById('npc-dummy-bar');
        const dummyBox = document.getElementById('dummy-target-box');
        if (statusEl) statusEl.textContent = `演武中 ${elapsed}/10 秒 ｜ 累計傷害 ${fmtNum(totalDmg)}`;
        if (barEl) barEl.style.width = `${elapsed * 10}%`;
        if (dummyBox) {
          dummyBox.classList.remove('is-hit');
          void dummyBox.offsetWidth;
          dummyBox.classList.add('is-hit');
          const floater = document.createElement('span');
          floater.className = 'dummy-float-dmg';
          floater.textContent = `-${fmtNum(tickDmg)}`;
          floater.style.left = `${30 + Math.random() * 40}%`;
          dummyBox.appendChild(floater);
          setTimeout(() => floater.remove(), 650);
        }
        activeStageEngine?.triggerActionBurst('impact');
        if (elapsed >= 10) {
          clearInterval(activeDummyTimer);
          activeDummyTimer = null;
          const avgDps = Math.floor(totalDmg / 10);
          ctx?.onRecordDummyDps?.(avgDps, totalDmg, maxCrit);
          say(`演武結束！平均 DPS ${fmtNum(avgDps)}！`, 'success');
          setTimeout(reopen, 450);
        }
      }, 1000);
    });
  } else if (action === 'modal_waypoint') {
    const wps = ctx?.getWaypoints?.() || [];
    bodyEl.querySelector('#btn-wp-exit-cur')?.addEventListener('click', () => closeAnd(() => ctx?.onExitTown?.()));
    bodyEl.querySelectorAll('button[data-wp-idx]').forEach((b) => {
      b.addEventListener('click', () => { const wp = wps[Number(b.dataset.wpIdx)]; if (wp) closeAnd(() => ctx?.onTeleportWaypoint?.(wp.x, wp.y, wp.label)); });
    });
    bodyEl.querySelectorAll('button[data-wp-stg]').forEach((b) => {
      b.addEventListener('click', () => closeAnd(() => ctx?.onTeleportToStage?.(Number(b.dataset.wpStg))));
    });
    bodyEl.querySelectorAll('button[data-wp-ch]').forEach((b) => {
      b.addEventListener('click', () => closeAnd(() => ctx?.onTeleportTown?.(Number(b.dataset.wpCh))));
    });
  } else if (action === 'modal_vault') {
    bodyEl.querySelector('#btn-vault-bag')?.addEventListener('click', () => closeAnd(() => ctx?.onOpenDrawer?.('bag')));
    bodyEl.querySelectorAll('button[data-vtab]').forEach((b) => {
      b.addEventListener('click', () => { activeVaultTab = Number(b.dataset.vtab) || 0; reopen(); });
    });
    const _vTabs = Array.isArray(st.vaultTabs) ? st.vaultTabs : [Array.isArray(st.vaultItems) ? st.vaultItems : [], [], [], []];
    const _vCur = _vTabs[activeVaultTab] || [];
    bodyEl.querySelectorAll('button[data-vault-out-tab]').forEach((b) => {
      const idx = Number(b.dataset.vaultOutTab);
      const it = _vCur[idx];
      if (it) {
        b.addEventListener('mouseenter', (ev) => UniversalTooltip.showItem(ev, it, false, st));
        b.addEventListener('mousemove', (ev) => UniversalTooltip.move(ev));
        b.addEventListener('mouseleave', () => UniversalTooltip.hide());
      }
      b.addEventListener('click', () => {
        UniversalTooltip.hide();
        if (window.__IDLE_ARPG_BRIDGE__?.vaultWithdrawFromTab?.(activeVaultTab, idx)) {
          say('已從金庫取出裝備至背包。', 'success');
          setTimeout(reopen, 200);
        }
      });
    });
    bodyEl.querySelectorAll('button[data-vault-in-tab]').forEach((b) => {
      const uid = b.dataset.vaultInTab;
      const it = (st.inventory || []).find((x) => x && x.uid === uid);
      if (it) {
        b.addEventListener('mouseenter', (ev) => UniversalTooltip.showItem(ev, it, false, st));
        b.addEventListener('mousemove', (ev) => UniversalTooltip.move(ev));
        b.addEventListener('mouseleave', () => UniversalTooltip.hide());
      }
      b.addEventListener('click', () => {
        UniversalTooltip.hide();
        if (window.__IDLE_ARPG_BRIDGE__?.vaultDepositToTab?.(activeVaultTab, uid)) {
          say('已鎖入分頁金庫！', 'success');
          setTimeout(reopen, 200);
        }
      });
    });
    bodyEl.querySelector('#btn-rule-cls')?.addEventListener('click', () => { ctx?.onToggleVaultRule?.('keepClassReq'); setTimeout(reopen, 200); });
    bodyEl.querySelector('#btn-rule-crit')?.addEventListener('click', () => { ctx?.onToggleVaultRule?.('keepDoubleCrit'); setTimeout(reopen, 200); });
  } else if (action === 'modal_sanctum') {
    bodyEl.querySelector('#btn-sanctum-rebirth')?.addEventListener('click', () => closeAnd(() => ctx?.onOpenDrawer?.('rebirth')));
    bodyEl.querySelectorAll('button[data-sanctum]').forEach((b) => b.addEventListener('click', () => { ctx?.onUpgradeSanctum?.(b.dataset.sanctum); say('魂晶點亮成功，星陣光環更進一步！', 'impact'); setTimeout(reopen, 260); }));
  } else if (action === 'modal_patrol_guard') {
    bodyEl.querySelector('#btn-guard-bless')?.addEventListener('click', () => { ctx?.onGuardBlessing?.(); say('城防之盾將守護你 3 分鐘！', 'success'); setTimeout(reopen, 260); });
  } else if (action === 'modal_patrol_villager') {
    bodyEl.querySelector('#btn-villager-gift')?.addEventListener('click', () => { ctx?.onVillagerGift?.(); say('一點小心意，願你冒險順利！', 'success'); setTimeout(reopen, 260); });
  } else {
    const GIFT_HANDLERS = {
      modal_scout: ['#btn-claim-scout', 'onClaimScoutGift'],
      modal_smuggler: ['#btn-claim-smuggler', 'onClaimSmugglerGift'],
      modal_chronicler: ['#btn-claim-chronicler', 'onClaimChroniclerGift'],
      modal_forgemaster: ['#btn-claim-forgemaster', 'onClaimForgemasterGift'],
      modal_contractor: ['#btn-claim-contractor', 'onClaimContractorGift'],
      modal_shaman: ['#btn-claim-shaman', 'onClaimShamanGift'],
      modal_witchdoctor: ['#btn-claim-witchdoctor', 'onClaimWitchdoctorGift'],
      modal_engineer: ['#btn-claim-engineer', 'onClaimEngineerGift'],
      modal_penitent: ['#btn-claim-penitent', 'onClaimPenitentGift'],
      modal_weaver: ['#btn-claim-weaver', 'onClaimWeaverGift'],
    };
    const pair = GIFT_HANDLERS[action];
    if (pair) {
      bodyEl.querySelector(pair[0])?.addEventListener('click', () => { ctx?.[pair[1]]?.(); say('蠟封已拆開，請收下這份章節專屬補給！', 'impact'); setTimeout(reopen, 280); });
    }
  }
}
