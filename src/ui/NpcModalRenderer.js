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
