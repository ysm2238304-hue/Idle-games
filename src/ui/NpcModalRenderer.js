/**
 * NpcModalRenderer.js (v101 - Batch 2)
 * 完整重構主城 NPC 視窗：
 * - 1～10 章專屬材質框體 + 60 FPS 動態舞台 (NpcStageEngine v101)
 * - 完整支援 23 個功能視窗 + 10 位章節限定 NPC 專屬人設台詞
 * - 4 級直覺按鈕系統（花費餘額自動判斷、SVG/UI 圖示）
 */

import { NpcStageEngine } from './NpcStageEngine.js?v=102';
import { initSecondaryModalThemes, syncSecondaryModalChapter } from './SecondaryModalTheme.js?v=102';

let activeStageEngine = null;
let activeDummyTimer = null;

export function destroyActiveNpcStage() {
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
    if (!old.href.includes('v=102')) old.href = './src/ui/npcModal.css?v=102';
    return;
  }
  const link = document.createElement('link');
  link.id = 'npc-modal-v2-css';
  link.rel = 'stylesheet';
  link.href = './src/ui/npcModal.css?v=102';
  document.head.appendChild(link);
}

const SVG = {
  gold: `<svg viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9 10h6M9 14h6"/></svg>`,
  dust: `<svg viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2"><path d="M12 3l2.2 5.3L20 10l-5.8 1.7L12 17l-2.2-5.3L4 10l5.8-1.7z"/></svg>`,
  crystal: `<svg viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><polygon points="12 2 19 9 12 22 5 9 12 2"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M7 17L17 7M9 7h8v8"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="#86efac" stroke-width="2.5" width="15" height="15"><path d="M5 13l4 4L19 7"/></svg>`,
};

const CHAPTER_NAMES = [
  '第一章・曙光哨站堡壘',
  '第二章・地下菌菇黑市',
  '第三章・守夜人聖骨禮拜堂',
  '第四章・黑曜石熔爐要塞',
  '第五章・緋紅魔獄王庭',
  '第六章・極光冰晶堡',
  '第七章・翠玉樹冠水寨',
  '第八章・蒼穹電弧浮空城',
  '第九章・聖血薔薇修道院',
  '第十章・永恆星辰聖域',
];

const FACILITY_META = {
  modal_alchemy: { title: '秘法煉金工坊', icon: './assets/ui/ui_potion.png', defaultName: '艾莉絲', defaultRole: '煉金術師', greeting: '爐火正旺，要調配哪一種高階秘藥？' },
  modal_bounty: { title: '懸賞任務佈告欄', icon: './assets/ui/ui_log.png', defaultName: '凱爾', defaultRole: '賞金獵人隊長', greeting: '深淵魔物越發躁動，完成懸賞就能領取重金。' },
  modal_market: { title: '深淵黑市帳篷', icon: './assets/ui/ui_chest.png', defaultName: '無面行商', defaultRole: '黑市商人', greeting: '貨架只留給懂行的人，看中就快下手。' },
  modal_tavern: { title: '冒險者酒館', icon: './assets/ui/ui_potion.png', defaultName: '酒館老闆', defaultRole: '補給總管', greeting: '進來歇口氣吧，熱騰騰的佳餚能讓你戰力暴漲。' },
  modal_tower: { title: '瞭望哨塔・魔物圖鑑', icon: './assets/ui/ui_worldmap.png', defaultName: '哨塔瞭望員', defaultRole: '情報官', greeting: '從高處已鎖定本章魔物動向，知己知彼才能百戰百勝。' },
  modal_blacksmith: { title: '鐵匠鍛造工坊', icon: './assets/ui/ui_upgrade.png', defaultName: '鐵砧・布魯', defaultRole: '鍛造大師', greeting: '好鋼要千錘百鍊！把裝備交給我精煉或洗鍊詞綴吧。' },
  modal_trainer: { title: '戰技神殿・實戰演武', icon: './assets/ui/ui_skills.png', defaultName: '雷恩', defaultRole: '戰技總教頭', greeting: '想驗證流派輸出？對著木樁全力出招 10 秒看看！' },
  modal_portal: { title: '跨章節星門傳送驛站', icon: './assets/ui/ui_waypoint.png', defaultName: '加雷斯', defaultRole: '星門守衛長', greeting: '星門已校準完成，隨時準備好前往下一座戰場或主城。' },
  modal_waypoint: { title: '主城快速傳送陣', icon: './assets/ui/ui_waypoint.png', defaultName: '傳送陣導師', defaultRole: '空間引導者', greeting: '透過符文節點，可以瞬間抵達城內各處或已解鎖關卡。' },
  modal_vault: { title: '冒險者珍藏保險箱', icon: './assets/ui/ui_bag.png', defaultName: '霍克', defaultRole: '軍需書記官', greeting: '把極品神裝鎖進保險箱，才不會在批量分解時誤傷。' },
  modal_sanctum: { title: '遠古靈魂輪迴聖殿', icon: './assets/ui/ui_rebirth.png', defaultName: '奧爾登', defaultRole: '虛空先知', greeting: '將魂晶注入聖殿光環，這份力量將跨越多輪輪迴。' },
  modal_patrol_guard: { title: '城防巡邏衛兵', icon: './assets/ui/ui_auto.png', defaultName: '巡邏衛兵', defaultRole: '城防精銳', greeting: '防線一切正常！需要我為你施加城防激勵嗎？' },
  modal_patrol_villager: { title: '城鎮旅人', icon: './assets/ui/ui_chest.png', defaultName: '城鎮旅人', defaultRole: '行腳商旅', greeting: '冒險者大人！這是路上撿到的小補給，請收下吧。' },
  modal_scout: { title: '邊境斥候哨站', icon: './assets/ui/ui_worldmap.png', defaultName: '莉娜', defaultRole: '邊境斥候長', greeting: '前方哨站情勢緊張，這份邊境補給請務必收下！' },
  modal_smuggler: { title: '洞窟走私密道', icon: './assets/ui/ui_chest.png', defaultName: '尼克', defaultRole: '洞窟走私客', greeting: '噓……我剛從哥布林酋長金庫順手摸了一批貨，這份見面禮拿去用吧！' },
  modal_chronicler: { title: '聖骨亡靈檔案室', icon: './assets/ui/ui_log.png', defaultName: '阿爾文', defaultRole: '亡靈記錄者', greeting: '我用魂羽筆記錄了每一位踏入墓穴的勇者，這份聖骨補給請收下。' },
  modal_forgemaster: { title: '熔爐宗師工坊', icon: './assets/ui/ui_upgrade.png', defaultName: '赫菲斯', defaultRole: '火元素鍛造宗師', greeting: '凡人，你的勇氣堪比純淨的赤炎。收下這份熔爐宗師的贈禮吧！' },
  modal_contractor: { title: '魔獄契約殿堂', icon: './assets/ui/ui_rebirth.png', defaultName: '墨菲斯托', defaultRole: '墮落契約官', greeting: '與我簽下這份黃金魔契吧，這 10,000 金幣與秘藥算是王庭的誠意！' },
  modal_shaman: { title: '極光薩滿帳棚', icon: './assets/ui/ui_tree.png', defaultName: '奧丁森', defaultRole: '極地先知長老', greeting: '遠道而來的勇者，極地的風雪考驗著每一位戰士，這份先知贈禮收下吧。' },
  modal_witchdoctor: { title: '翠玉巫醫祭壇', icon: './assets/ui/ui_potion.png', defaultName: '祖爾', defaultRole: '沼澤巫醫長', greeting: '歡迎來到翠玉樹冠水寨！收下這份部族的巫醫聖禮，願螢火蟲指引你的道路。' },
  modal_engineer: { title: '蒼穹動力機庫', icon: './assets/ui/ui_gear.png', defaultName: '艾迪生', defaultRole: '風暴首席工程師', greeting: '這是我最新設計的蒼穹電弧補給包，拿著這 50,000 金幣和秘藥去大展身手吧！' },
  modal_penitent: { title: '聖血苦行聖壇', icon: './assets/ui/ui_rebirth.png', defaultName: '特蕾莎', defaultRole: '苦行聖女', greeting: '願這串薔薇念珠與 80,000 金幣聖糧，支撐你渡過最黑暗的修道院長夜。' },
  modal_weaver: { title: '星界編織聖域', icon: './assets/ui/ui_tree.png', defaultName: '伊莉雅', defaultRole: '星界編織者', greeting: '偉大的旅者，你已走完十界征途！收下這份星界編織者的終極贈禮吧！' },
};

const fmtNum = (n) => Math.floor(Number(n) || 0).toLocaleString();

function costBtnHtml(idOrAttr, label, costText, canAfford, extraClass = '') {
  return `<button ${idOrAttr} class="npc-btn-primary ${canAfford ? '' : 'is-short'} ${extraClass}" ${canAfford ? '' : 'disabled'}>
    <span>${label}</span>
    <span class="npc-cost-pill ${canAfford ? 'is-ok' : 'is-short'}">${costText}</span>
  </button>`;
}

initSecondaryModalThemes();

export function renderTownFacilityModal(ui, action, data, ctx, deps = {}) {
  ensureNpcModalCss();
  destroyActiveNpcStage();

  const modal = document.getElementById('modal-town-facility');
  const titleEl = document.getElementById('town-modal-title');
  const bodyEl = document.getElementById('town-modal-body');
  const closeBtn = document.getElementById('btn-close-town-modal');
  if (!modal || !titleEl || !bodyEl) return;

  const st = ui.getState();
  const getChapterIdx = deps.getChapterIdx || ((s) => Math.min(9, Math.floor((Math.max(1, s) - 1) / 10)));
  const chIdx = data?.chapterIdx ?? getChapterIdx(st.stage || 1);
  const chapter = Math.max(1, Math.min(10, Number(chIdx) + 1));

  modal.classList.add('npc-modal-v2');
  modal.dataset.chapter = String(chapter);
  initSecondaryModalThemes(() => chapter);
  syncSecondaryModalChapter(chapter);

  const meta = FACILITY_META[action] || FACILITY_META.modal_bounty;
  const npcObj = data?.npc || data || {};
  const npcName = npcObj.name || data?.name || meta.defaultName;
  const npcTitle = npcObj.title || meta.defaultRole;
  const npcGreeting = npcObj.greeting || meta.greeting;

  const npcImgUrl = ctx?.getPortrait?.(data?.atlasKey, npcObj.frame || data?.frame) || '';
  const bldImgUrl = data?.frame && data?.frame !== npcObj.frame
    ? (ctx?.getPortrait?.(data?.atlasKey, data.frame) || '')
    : '';

  titleEl.innerHTML = `<img src="${meta.icon}" alt="" style="width:22px;height:22px;object-fit:contain;" />
    <span>${data?.title || meta.title}</span>`;

  const workspaceHtml = buildWorkspaceHtml(ui, action, data, ctx, deps, st, chIdx, chapter);

  bodyEl.innerHTML = `
    <div class="npc-shell">
      <aside class="npc-stage-col">
        <div class="npc-canvas-wrap">
          <canvas id="npc-stage-canvas" class="npc-stage-canvas" width="282" height="248"></canvas>
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
      <section class="npc-work-col" id="npc-work-col">${workspaceHtml}</section>
    </div>
  `;

  const canvas = document.getElementById('npc-stage-canvas');
  activeStageEngine = new NpcStageEngine(canvas, {
    chapter,
    action,
    npcUrl: npcImgUrl,
    bldUrl: bldImgUrl,
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

  if (action === 'modal_alchemy') {
    const buffs = st.potionBuffs || {};
    const now = Date.now();
    const brews = [
      { id: 'hp_refill', name: '生命源泉補滿', desc: '立即將 HP 與藥水瓶補至滿格。', cost: Math.floor(180 * chMult), active: false },
      { id: 'exp_pot', name: '智慧結晶秘藥', desc: '10 分鐘內獲得經驗值 +35%。', cost: Math.floor(420 * chMult), active: (buffs.expUntil || 0) > now },
      { id: 'fury_pot', name: '狂怒之血合劑', desc: '10 分鐘內攻擊力與暴擊率提升。', cost: Math.floor(480 * chMult), active: (buffs.furyUntil || 0) > now },
      { id: 'mf_pot', name: '尋寶幸運靈藥', desc: '10 分鐘內掉寶品質與金幣掉落提升。', cost: Math.floor(520 * chMult), active: (buffs.mfUntil || 0) > now },
      { id: 'titan_pot', name: '泰坦巨力藥劑', desc: '10 分鐘內全傷害大幅強化。', cost: Math.floor(680 * chMult), active: (buffs.titanUntil || 0) > now },
      { id: 'iron_pot', name: '鋼鐵壁壘藥劑', desc: '10 分鐘內防禦力與減傷大幅提升。', cost: Math.floor(620 * chMult), active: (buffs.ironUntil || 0) > now },
      { id: 'sage_pot', name: '賢者專注靈液', desc: '10 分鐘內技能傷害與冷卻縮減提升。', cost: Math.floor(700 * chMult), active: (buffs.sageUntil || 0) > now },
    ];
    const bundleCost = Math.floor(brews.slice(1).reduce((s, b) => s + b.cost, 0) * 0.9);
    return `
      <div class="npc-sec-head">
        <div class="npc-sec-title">高階秘藥調配</div>
        <div style="min-width:210px;">
          ${costBtnHtml('id="btn-brew-all"', '9 折一鍵飲用全套戰鬥秘藥', `${fmtNum(bundleCost)} 金幣`, gold >= bundleCost)}
        </div>
      </div>
      <div class="npc-card-grid">
        ${brews.map((b) => `
          <div class="npc-card ${b.active ? 'is-highlight' : ''}">
            <div class="npc-card-top">
              <div class="npc-card-icon"><img src="./assets/ui/ui_potion.png" alt="" /></div>
              <div>
                <div class="npc-card-title">${b.name} ${b.active ? '<span style="color:#4ade80;font-size:11px;">● 生效中</span>' : ''}</div>
                <div class="npc-card-desc">${b.desc}</div>
              </div>
            </div>
            ${costBtnHtml(`data-brew="${b.id}"`, b.active ? '延長藥效' : '立即煉製飲用', `${fmtNum(b.cost)} 金幣`, gold >= b.cost)}
          </div>
        `).join('')}
      </div>
    `;
  }

  if (action === 'modal_bounty') {
    const bp = st.bountyProgress || {};
    const kills = bp.kills ?? st.kills ?? 0;
    const bossKills = bp.bossKills ?? 0;
    const claimed = bp.claimed || {};
    const quests = [
      { id: `ch${chapter}_q1`, title: `清剿第 ${chapter} 章巡邏魔物`, cur: kills, req: 30 * chapter, reward: `${fmtNum(800 * chapter)} 金幣` },
      { id: `ch${chapter}_q2`, title: `擊潰第 ${chapter} 章菁英首領`, cur: bossKills, req: 3 * chapter, reward: `${fmtNum(1800 * chapter)} 金幣 + 粉塵` },
      { id: `ch${chapter}_q3`, title: `長期深淵討伐累計`, cur: kills, req: 120 * chapter, reward: `${fmtNum(3500 * chapter)} 金幣 + 魂晶` },
    ];
    return `
      <div class="npc-sec-head">
        <div class="npc-sec-title">第 ${chapter} 章懸賞通緝令</div>
        <span style="font-size:12px;color:#cbd5e1;">累計擊殺：<b>${fmtNum(kills)}</b> ｜ 首領：<b>${fmtNum(bossKills)}</b></span>
      </div>
      <div class="npc-card-grid">
        ${quests.map((q) => {
          const isClaimed = !!claimed[q.id];
          const pct = Math.min(100, Math.floor((q.cur / Math.max(1, q.req)) * 100));
          const ready = q.cur >= q.req && !isClaimed;
          return `
            <div class="npc-card ${ready ? 'is-highlight' : ''}">
              <div>
                <div class="npc-card-title">${q.title}</div>
                <div class="npc-card-desc" style="margin-bottom:8px;">懸賞獎勵：<b style="color:var(--npc-accent);">${q.reward}</b></div>
                <div class="npc-progress-track"><div class="npc-progress-fill" style="width:${pct}%"></div></div>
                <div style="font-size:11px;color:#94a3b8;margin-top:4px;">進度 ${fmtNum(q.cur)} / ${fmtNum(q.req)}（${pct}%）</div>
              </div>
              ${isClaimed
                ? `<div class="npc-btn-claimed">${SVG.check}<span>已完成並領取賞金</span></div>`
                : costBtnHtml(`data-bounty="${q.id}"`, ready ? '領取懸賞賞金' : '討伐進度未達標', `${pct}%`, ready)}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  if (action === 'modal_market') {
    ctx?.onEnsureMarketShelf?.();
    const bm = st.blackMarket || {};
    const items = bm.items || [];
    const pity = Number(bm.pityCount) || 0;
    const stageCost = Math.floor(600 * (1 + (st.stage || 1) * 0.22));
    const highCost = stageCost * 3;
    const refreshCost = Math.floor(350 * chMult);

    return `
      <div class="npc-sec-head">
        <div class="npc-sec-title">黑市定時貨架與神秘盲盒</div>
        <button id="btn-bm-refresh" class="npc-btn-secondary" ${gold >= refreshCost ? '' : 'disabled'}>
          <span>立即刷新貨架</span>
          <span class="npc-cost-pill ${gold >= refreshCost ? 'is-ok' : 'is-short'}">${fmtNum(refreshCost)} 金幣</span>
        </button>
      </div>
      <div class="npc-card is-highlight">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <strong style="font-size:13px;color:#fef3c7;">黑市保底進度（必出傳說裝備）</strong>
          <span style="font-size:12px;color:var(--npc-accent);font-weight:800;">${pity} / 10</span>
        </div>
        <div class="npc-progress-track"><div class="npc-progress-fill" style="width:${Math.min(100, pity * 10)}%"></div></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;">
          ${costBtnHtml('id="btn-gamble-std"', '神秘裝備盲盒 (+1 保底)', `${fmtNum(stageCost)} 金幣`, gold >= stageCost)}
          ${costBtnHtml('id="btn-gamble-high"', '高階走私秘寶箱 (+2 保底)', `${fmtNum(highCost)} 金幣`, gold >= highCost)}
        </div>
      </div>
      <div class="npc-card-grid">
        ${items.length ? items.map((it, idx) => {
          const price = Number(it.price) || stageCost;
          const sold = !!it.sold;
          return `
            <div class="npc-card">
              <div class="npc-card-top">
                <div class="npc-card-icon"><img src="./assets/ui/ui_chest.png" alt="" /></div>
                <div>
                  <div class="npc-card-title">${it.name || '神秘黑市貨品'}</div>
                  <div class="npc-card-desc">${it.desc || '經黑市管道流入的稀有戰利品。'}</div>
                </div>
              </div>
              ${sold
                ? `<div class="npc-btn-claimed">${SVG.check}<span>已售罄</span></div>`
                : costBtnHtml(`data-shelf="${idx}"`, '立即直購', `${fmtNum(price)} 金幣`, gold >= price)}
            </div>
          `;
        }).join('') : `<div class="npc-card"><div class="npc-card-desc">目前貨架空空如也，請嘗試刷新貨架或開啟盲盒。</div></div>`}
      </div>
    `;
  }

  if (action === 'modal_tavern') {
    const feastCost = (chIdx + 1) * 350;
    return `
      <div class="npc-sec-head"><div class="npc-sec-title">酒館補給與休整</div></div>
      <div class="npc-card-grid">
        <div class="npc-card is-highlight">
          <div class="npc-card-top">
            <div class="npc-card-icon"><img src="./assets/ui/ui_potion.png" alt="" /></div>
            <div>
              <div class="npc-card-title">壁爐免費休憩</div>
              <div class="npc-card-desc">在暖爐旁小憩片刻，立即將生命值與藥水回復至 100%。</div>
            </div>
          </div>
          ${costBtnHtml('id="btn-tavern-rest"', '免費休憩回滿', '免費', true)}
        </div>
        <div class="npc-card">
          <div class="npc-card-top">
            <div class="npc-card-icon"><img src="./assets/ui/ui_chest.png" alt="" /></div>
            <div>
              <div class="npc-card-title">冒險者豐盛大餐</div>
              <div class="npc-card-desc">享用主廚特製烤肉與麥酒，獲得短時間全屬性激勵！</div>
            </div>
          </div>
          ${costBtnHtml('id="btn-tavern-feast"', '點購豐盛盛宴', `${fmtNum(feastCost)} 金幣`, gold >= feastCost)}
        </div>
      </div>
    `;
  }

  if (action === 'modal_tower') {
    const pool = deps.ZONE_POOLS?.[chIdx] || [];
    const templates = deps.MONSTER_TEMPLATES || {};
    return `
      <div class="npc-sec-head"><div class="npc-sec-title">第 ${chapter} 章魔物偵察圖鑑</div></div>
      <div class="npc-card-grid">
        ${pool.length ? pool.map((mid) => {
          const m = templates[mid] || { name: mid, desc: '深淵出沒的敵對魔物。' };
          return `
            <div class="npc-card">
              <div class="npc-card-title">${m.name || mid}</div>
              <div class="npc-card-desc">${m.desc || `出沒於第 ${chapter} 章區域，建議確認抗性後出戰。`}</div>
            </div>
          `;
        }).join('') : `<div class="npc-card"><div class="npc-card-desc">目前章節偵察情報已同步至戰場，請留意菁英詞綴變化。</div></div>`}
      </div>
    `;
  }

  if (action === 'modal_blacksmith') {
    const eqList = Object.entries(st.equipment || {})
      .filter(([, item]) => item && item.uid)
      .map(([slot, item]) => ({ ...item, isEq: true, slot }));
    const invList = (st.inventory || [])
      .filter((it) => it && ['rare', 'legendary', 'magic', 'set'].includes(it.rarity))
      .slice(0, 12)
      .map((it) => ({ ...it, isEq: false }));
    const allTargets = [...eqList, ...invList];
    const curTarget = allTargets.find((x) => x.uid === ui._bsSelectedUid) || allTargets[0] || null;
    if (curTarget) ui._bsSelectedUid = curTarget.uid;

    const rerollCost = Math.floor(20 + (curTarget?.level || 1) * 3);
    const refineCost = Math.floor(450 * (1 + (curTarget?.enhance || 0) * 0.45));
    const affixes = curTarget?.affixes || [];

    return `
      <div class="npc-sec-head">
        <div class="npc-sec-title">詞綴洗鍊與裝備精煉</div>
        <button id="btn-bs-drawer" class="npc-btn-secondary"><span>開啟全身強化面板</span>${SVG.arrow}</button>
      </div>
      <div class="npc-chip-list">
        ${allTargets.length ? allTargets.map((it) => `
          <button data-bs-uid="${it.uid}" class="npc-item-pill ${curTarget?.uid === it.uid ? 'is-selected' : ''}">
            ${it.isEq ? '[已裝備] ' : ''}${it.name || '裝備'} +${it.enhance || 0}
          </button>
        `).join('') : '<span style="font-size:12px;color:#94a3b8;">目前沒有可鍛造的裝備。</span>'}
      </div>
      ${curTarget ? `
        <div class="npc-card is-highlight">
          <div class="npc-card-title">${curTarget.name}（+${curTarget.enhance || 0}）</div>
          <div style="font-size:12px;color:#cbd5e1;margin-bottom:6px;">點擊詞綴可鎖定 1 條屬性後進行洗鍊：</div>
          <div class="npc-chip-list">
            ${affixes.length ? affixes.map((af, idx) => {
              const locked = ui._bsLockIdx === idx;
              return `<button data-bs-lock="${idx}" class="npc-btn-toggle ${locked ? 'is-active' : ''}">
                ${SVG.lock}<span>${af.label || af.key || '屬性'} +${af.val ?? ''}</span>
              </button>`;
            }).join('') : '<span style="font-size:12px;color:#94a3b8;">此裝備無隨機詞綴</span>'}
          </div>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#fde68a;margin-top:8px;cursor:pointer;">
            <input type="checkbox" id="chk-bs-protect" /> 啟用強化保護（失敗時不降階）
          </label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;">
            ${costBtnHtml('id="btn-bs-reroll"', '洗鍊裝備詞綴', `${fmtNum(rerollCost)} 粉塵`, dust >= rerollCost)}
            ${costBtnHtml('id="btn-bs-refine"', '精煉裝備強化', `${fmtNum(refineCost)} 金幣`, gold >= refineCost)}
          </div>
        </div>
      ` : ''}
    `;
  }

  if (action === 'modal_trainer') {
    const cid = st.classId || 'warrior';
    const presets = st.skillPresetsByClass?.[cid] || [null, null, null];
    const bestDps = Number(st.bestDummyDps) || 0;
    return `
      <div class="npc-sec-head">
        <div class="npc-sec-title">木樁 10 秒 DPS 實戰檢定</div>
        <button id="btn-tr-drawer" class="npc-btn-secondary"><span>開啟天賦與技能樹</span>${SVG.arrow}</button>
      </div>
      <div class="npc-card is-highlight">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div class="npc-card-title">歷史最佳木樁 DPS：${fmtNum(bestDps)}</div>
            <div id="npc-dummy-status" class="npc-card-desc">點擊下方按鈕開始 10 秒連續輸出測試</div>
          </div>
        </div>
        <div id="npc-dummy-bar-wrap" class="npc-progress-track" style="margin:6px 0;"><div id="npc-dummy-bar" class="npc-progress-fill" style="width:0%"></div></div>
        ${costBtnHtml('id="btn-start-dummy"', '開始 10 秒木樁實戰測試', '免費演武', true)}
      </div>
      <div class="npc-card-grid">
        ${[0, 1, 2].map((idx) => {
          const p = presets[idx];
          return `
            <div class="npc-card">
              <div class="npc-card-title">流派預設方案 #${idx + 1}</div>
              <div class="npc-card-desc">${p ? '已儲存技能組合' : '尚未儲存'}</div>
              <div style="display:flex;gap:6px;">
                <button data-save-preset="${idx}" class="npc-btn-secondary" style="flex:1;justify-content:center;">儲存目前</button>
                <button data-apply-preset="${idx}" class="npc-btn-secondary" style="flex:1;justify-content:center;" ${p ? '' : 'disabled'}>套用方案</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  if (action === 'modal_portal') {
    const maxStg = st.maxStageReached || st.maxStage || st.stage || 1;
    const unlockedCh = Math.min(9, Math.floor((Math.max(1, maxStg) - 1) / 10));
    return `
      <div class="npc-sec-head">
        <div class="npc-sec-title">出城作戰與跨章節主城星門</div>
        <div style="display:flex;gap:6px;">
          <button id="btn-portal-map" class="npc-btn-secondary"><span>大地圖選關</span>${SVG.arrow}</button>
          <button id="btn-portal-battle" class="npc-btn-primary" style="width:auto;"><span>立即出城作戰</span></button>
        </div>
      </div>
      <div class="npc-card-grid">
        ${CHAPTER_NAMES.map((name, i) => {
          const isCur = i === chIdx;
          const isUnlocked = i <= unlockedCh;
          return `
            <div class="npc-card ${isCur ? 'is-highlight' : ''}">
              <div class="npc-card-title">${name}</div>
              <div class="npc-card-desc">${isUnlocked ? '星門節點已開啟' : '搶先觀光傳送（尚未通關）'}</div>
              <button data-tp-ch="${i}" class="${isCur ? 'npc-btn-claimed' : 'npc-btn-secondary'}" ${isCur ? 'disabled' : ''}>
                <span>${isCur ? '目前所在主城' : '傳送至此主城'}</span>
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  if (action === 'modal_waypoint') {
    const wps = ctx?.getWaypoints?.() || [];
    const curStg = st.stage || 1;
    return `
      <div class="npc-sec-head">
        <div class="npc-sec-title">主城瞬移節點與關卡直達</div>
        <button id="btn-wp-exit-cur" class="npc-btn-primary" style="width:auto;"><span>繼續第 ${curStg} 關作戰</span></button>
      </div>
      <div class="npc-chip-list">
        ${wps.map((wp, idx) => `
          <button data-wp-idx="${idx}" class="npc-btn-secondary"><span>${wp.label || `傳送點 ${idx + 1}`}</span></button>
        `).join('')}
      </div>
      <div class="npc-sec-head"><div class="npc-sec-title">切換主城章節</div></div>
      <div class="npc-chip-list">
        ${CHAPTER_NAMES.map((name, i) => `
          <button data-wp-ch="${i}" class="npc-item-pill ${i === chIdx ? 'is-selected' : ''}">${name}</button>
        `).join('')}
      </div>
    `;
  }

  if (action === 'modal_vault') {
    const vaultItems = st.vaultItems || [];
    const rules = st.vaultRules || {};
    const invItems = (st.inventory || []).filter((it) => it && ['legendary', 'rare', 'set'].includes(it.rarity)).slice(0, 8);
    return `
      <div class="npc-sec-head">
        <div class="npc-sec-title">防誤拆保險庫（${vaultItems.length} / 6）</div>
        <button id="btn-vault-bag" class="npc-btn-secondary"><span>開啟完整背包</span>${SVG.arrow}</button>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button id="btn-rule-cls" class="npc-btn-toggle ${rules.keepClassReq ? 'is-active' : ''}">${SVG.lock}<span>自動鎖定本職業專屬裝</span></button>
        <button id="btn-rule-crit" class="npc-btn-toggle ${rules.keepDoubleCrit ? 'is-active' : ''}">${SVG.lock}<span>自動鎖定雙爆詞綴裝</span></button>
      </div>
      <div class="npc-card-grid">
        ${[0, 1, 2, 3, 4, 5].map((slotIdx) => {
          const it = vaultItems[slotIdx];
          return `
            <div class="npc-card ${it ? 'is-highlight' : ''}">
              <div class="npc-card-title">${it ? it.name : `保險格 #${slotIdx + 1}（空）`}</div>
              <div class="npc-card-desc">${it ? `等級 ${it.level || 1} ｜ 已受鎖定保護` : '可從下方背包存入稀有或傳說裝備'}</div>
              ${it ? `<button data-vault-out="${slotIdx}" class="npc-btn-secondary">取出至背包</button>` : ''}
            </div>
          `;
        }).join('')}
      </div>
      <div class="npc-sec-head"><div class="npc-sec-title">從背包快速存入</div></div>
      <div class="npc-chip-list">
        ${invItems.length ? invItems.map((it) => `
          <button data-vault-in="${it.uid}" class="npc-btn-secondary"><span>存入：${it.name}</span></button>
        `).join('') : '<span style="font-size:12px;color:#94a3b8;">背包中無可存入的高階裝備。</span>'}
      </div>
    `;
  }

  if (action === 'modal_sanctum') {
    const lv = st.sanctumLevels || {};
    const auras = [
      { id: 'atk_aura', name: '戰神毀滅光環', desc: '永久提升全職業基礎攻擊力。', cur: Number(lv.atk_aura) || 0 },
      { id: 'loot_aura', name: '貪婪星輝光環', desc: '永久提升金幣與稀有裝備掉率。', cur: Number(lv.loot_aura) || 0 },
      { id: 'boss_aura', name: '弒神破甲光環', desc: '永久提升對首領與深淵王的傷害。', cur: Number(lv.boss_aura) || 0 },
    ];
    return `
      <div class="npc-sec-head">
        <div class="npc-sec-title">永久靈魂光環注魔</div>
        <button id="btn-sanctum-rebirth" class="npc-btn-secondary"><span>開啟輪迴轉生面板</span>${SVG.arrow}</button>
      </div>
      <div class="npc-card-grid">
        ${auras.map((a) => {
          const cost = 2 + a.cur * 2;
          return `
            <div class="npc-card is-highlight">
              <div>
                <div class="npc-card-title">${a.name}（Lv.${a.cur}）</div>
                <div class="npc-card-desc">${a.desc}</div>
              </div>
              ${costBtnHtml(`data-sanctum="${a.id}"`, '注魔升級光環', `${cost} 魂晶`, crystals >= cost)}
            </div>
          `;
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
      <div class="npc-card is-highlight">
        <div class="npc-card-title">${isGuard ? '城防堅盾鼓舞（3 分鐘防禦 +10%）' : '行腳旅人的補給小包'}</div>
        <div class="npc-card-desc" style="margin-bottom:8px;">
          ${remainSec > 0 ? `冷卻中，尚餘 ${remainSec} 秒可再次領取。` : '目前狀態就緒，可直接領取！'}
        </div>
        ${remainSec > 0
          ? `<div class="npc-btn-claimed">冷卻倒數中（${remainSec} 秒）</div>`
          : costBtnHtml(`id="${btnId}"`, isGuard ? '領取衛兵防禦激勵' : '收下旅人補給贈禮', '免費領取', true)}
      </div>
    `;
  }

  const CHAPTER_GIFTS = {
    modal_scout: { key: 'ch1ScoutGiftClaimed', btn: 'btn-claim-scout', title: '第 1 章・邊境斥候補給箱', desc: '內含邊境軍需金幣與初期強化資源。' },
    modal_smuggler: { key: 'ch2SmugglerGiftClaimed', btn: 'btn-claim-smuggler', title: '第 2 章・黑貨走私見面禮', desc: '哥布林酋長金庫流出的稀缺粉塵與黑市通行資金。' },
    modal_chronicler: { key: 'ch3ChroniclerGiftClaimed', btn: 'btn-claim-chronicler', title: '第 3 章・亡靈墓穴手札', desc: '記載著失落秘寶的古卷與聖骨靈魂精華。' },
    modal_forgemaster: { key: 'ch4ForgemasterGiftClaimed', btn: 'btn-claim-forgemaster', title: '第 4 章・熔岩宗師鍛造贈禮', desc: '高純度鍛造粉塵與火山金礦補給。' },
    modal_contractor: { key: 'ch5ContractorGiftClaimed', btn: 'btn-claim-contractor', title: '第 5 章・黃金魔契貢品', desc: '深淵王庭簽署的 10,000 金幣契約重金與秘藥。' },
    modal_shaman: { key: 'ch6ShamanGiftClaimed', btn: 'btn-claim-shaman', title: '第 6 章・北境先祖冰晶禮', desc: '極光祝福凝聚的靈魂結晶與禦寒補給。' },
    modal_witchdoctor: { key: 'ch7WitchdoctorGiftClaimed', btn: 'btn-claim-witchdoctor', title: '第 7 章・翡翠部族聖禮', desc: '沼澤秘藥精華與大量強化粉塵。' },
    modal_engineer: { key: 'ch8EngineerGiftClaimed', btn: 'btn-claim-engineer', title: '第 8 章・蒼穹電弧補給包', desc: '首席工程師設計的 50,000 金幣與秘藥能源核心。' },
    modal_penitent: { key: 'ch9PenitentGiftClaimed', btn: 'btn-claim-penitent', title: '第 9 章・聖光苦行賜福禮', desc: '薔薇念珠與 80,000 金幣聖糧的淨化祝福。' },
    modal_weaver: { key: 'ch10WeaverGiftClaimed', btn: 'btn-claim-weaver', title: '第 10 章・星界編織者終極贈禮', desc: '匯聚十界星輝的終極冒險資源大禮。' },
  };
  const gift = CHAPTER_GIFTS[action];
  if (gift) {
    const claimed = !!st[gift.key];
    return `
      <div class="npc-sec-head"><div class="npc-sec-title">章節限定一次性贈禮</div></div>
      <div class="npc-card is-highlight">
        <div class="npc-card-title">${gift.title}</div>
        <div class="npc-card-desc" style="margin-bottom:8px;">${gift.desc}</div>
        ${claimed
          ? `<div class="npc-btn-claimed">${SVG.check}<span>已領取此章節限定贈禮</span></div>`
          : costBtnHtml(`id="${gift.btn}"`, '立即領取章節贈禮', '限定 1 次', true)}
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
    const chMult = 1 + chIdx * 0.4;
    const bundleCost = Math.floor((420 + 480 + 520 + 680 + 620 + 700) * chMult * 0.9);
    bodyEl.querySelector('#btn-brew-all')?.addEventListener('click', () => {
      ctx?.onBrewAllCombat?.(bundleCost);
      say('全套戰鬥秘藥已為你注入！', 'success');
      setTimeout(reopen, 280);
    });
    bodyEl.querySelectorAll('button[data-brew]').forEach((btn) => {
      btn.addEventListener('click', () => {
        ctx?.onBrewPotion?.(btn.dataset.brew);
        say('喝下這瓶秘藥，祝你旗開得勝！', 'success');
        setTimeout(reopen, 240);
      });
    });
  } else if (action === 'modal_bounty') {
    bodyEl.querySelectorAll('button[data-bounty]').forEach((btn) => {
      btn.addEventListener('click', () => {
        ctx?.onClaimBounty?.(btn.dataset.bounty);
        say('賞金已核發，繼續獵殺更多深淵魔物吧！', 'success');
        setTimeout(reopen, 260);
      });
    });
  } else if (action === 'modal_market') {
    const chMult = 1 + chIdx * 0.4;
    const stageCost = Math.floor(600 * (1 + (st.stage || 1) * 0.22));
    const highCost = stageCost * 3;
    const refreshCost = Math.floor(350 * chMult);
    bodyEl.querySelectorAll('button[data-shelf]').forEach((btn) => {
      btn.addEventListener('click', () => {
        ctx?.onBuyMarketShelf?.(Number(btn.dataset.shelf));
        say('成交！這件貨品現在歸你了。', 'success');
        setTimeout(reopen, 260);
      });
    });
    bodyEl.querySelector('#btn-bm-refresh')?.addEventListener('click', () => {
      ctx?.onRefreshMarketShelf?.(refreshCost);
      say('新一批走私貨品已擺上貨架！', 'success');
      setTimeout(reopen, 260);
    });
    bodyEl.querySelector('#btn-gamble-std')?.addEventListener('click', () => {
      ctx?.onGambleGear?.(stageCost, false);
      say('看看這個神秘盲盒開出了什麼……', 'impact');
      setTimeout(reopen, 320);
    });
    bodyEl.querySelector('#btn-gamble-high')?.addEventListener('click', () => {
      ctx?.onGambleGear?.(highCost, true);
      say('高階走私秘寶箱開啟！保底進度大幅推進！', 'impact');
      setTimeout(reopen, 320);
    });
  } else if (action === 'modal_tavern') {
    const feastCost = (chIdx + 1) * 350;
    bodyEl.querySelector('#btn-tavern-rest')?.addEventListener('click', () => {
      closeAnd(() => ctx?.onTavernRest?.());
    });
    bodyEl.querySelector('#btn-tavern-feast')?.addEventListener('click', () => {
      ctx?.onTavernFeast?.(feastCost);
      say('大快朵頤之後，全身充滿了力量！', 'success');
      setTimeout(reopen, 280);
    });
  } else if (action === 'modal_blacksmith') {
    bodyEl.querySelector('#btn-bs-drawer')?.addEventListener('click', () => closeAnd(() => ctx?.onOpenDrawer?.('upgrade')));
    bodyEl.querySelectorAll('button[data-bs-uid]').forEach((b) => {
      b.addEventListener('click', () => {
        ui._bsSelectedUid = b.dataset.bsUid;
        ui._bsLockIdx = -1;
        reopen();
      });
    });
    bodyEl.querySelectorAll('button[data-bs-lock]').forEach((b) => {
      b.addEventListener('click', () => {
        const idx = Number(b.dataset.bsLock);
        ui._bsLockIdx = ui._bsLockIdx === idx ? -1 : idx;
        reopen();
      });
    });
    bodyEl.querySelector('#btn-bs-reroll')?.addEventListener('click', () => {
      const uid = ui._bsSelectedUid;
      const isEq = Object.values(st.equipment || {}).some((x) => x?.uid === uid);
      ctx?.onRerollItem?.(uid, isEq, ui._bsLockIdx ?? -1);
      say('叮噹！詞綴已重新鍛造！', 'impact');
      setTimeout(reopen, 300);
    });
    bodyEl.querySelector('#btn-bs-refine')?.addEventListener('click', () => {
      const uid = ui._bsSelectedUid;
      const isEq = Object.values(st.equipment || {}).some((x) => x?.uid === uid);
      const prot = !!bodyEl.querySelector('#chk-bs-protect')?.checked;
      ctx?.onRefineItem?.(uid, isEq, prot);
      say('火焰淬鍊完成，看看裝備的鋒芒！', 'impact');
      setTimeout(reopen, 300);
    });
  } else if (action === 'modal_trainer') {
    bodyEl.querySelector('#btn-tr-drawer')?.addEventListener('click', () => closeAnd(() => ctx?.onOpenDrawer?.('skills')));
    bodyEl.querySelectorAll('button[data-save-preset]').forEach((b) => {
      b.addEventListener('click', () => {
        ctx?.onSaveSkillPreset?.(Number(b.dataset.savePreset));
        say('這套連招預設已經記下來了！', 'success');
        setTimeout(reopen, 240);
      });
    });
    bodyEl.querySelectorAll('button[data-apply-preset]').forEach((b) => {
      b.addEventListener('click', () => {
        ctx?.onApplySkillPreset?.(Number(b.dataset.applyPreset));
        say('技能流派切換完成！', 'success');
        setTimeout(reopen, 240);
      });
    });
    bodyEl.querySelector('#btn-start-dummy')?.addEventListener('click', (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      const stats = ctx?.getComputedStats?.() || {};
      const baseDps = Math.max(50, Number(stats.dps) || Number(stats.atk) * 2 || 120);
      let elapsed = 0;
      let totalDmg = 0;
      let maxCrit = 0;
      say('全力出招！測試正式開始！', 'impact');
      if (activeDummyTimer) clearInterval(activeDummyTimer);
      activeDummyTimer = setInterval(() => {
        elapsed += 1;
        const tickDmg = Math.floor(baseDps * (0.85 + Math.random() * 0.45));
        totalDmg += tickDmg;
        if (tickDmg > maxCrit) maxCrit = Math.floor(tickDmg * 1.45);
        const statusEl = document.getElementById('npc-dummy-status');
        const barEl = document.getElementById('npc-dummy-bar');
        if (statusEl) statusEl.textContent = `測試中 ${elapsed}/10 秒 ｜ 累計傷害 ${fmtNum(totalDmg)}`;
        if (barEl) barEl.style.width = `${elapsed * 10}%`;
        activeStageEngine?.triggerActionBurst('impact');
        if (elapsed >= 10) {
          clearInterval(activeDummyTimer);
          activeDummyTimer = null;
          const avgDps = Math.floor(totalDmg / 10);
          ctx?.onRecordDummyDps?.(avgDps, totalDmg, maxCrit);
          say(`測試結束！平均 DPS ${fmtNum(avgDps)}！`, 'success');
          setTimeout(reopen, 420);
        }
      }, 1000);
    });
  } else if (action === 'modal_portal') {
    bodyEl.querySelector('#btn-portal-battle')?.addEventListener('click', () => closeAnd(() => ctx?.onExitTown?.()));
    bodyEl.querySelector('#btn-portal-map')?.addEventListener('click', () => closeAnd(() => ctx?.onOpenWorldMap?.()));
    bodyEl.querySelectorAll('button[data-tp-ch]').forEach((b) => {
      b.addEventListener('click', () => closeAnd(() => ctx?.onTeleportTown?.(Number(b.dataset.tpCh))));
    });
  } else if (action === 'modal_waypoint') {
    const wps = ctx?.getWaypoints?.() || [];
    bodyEl.querySelector('#btn-wp-exit-cur')?.addEventListener('click', () => closeAnd(() => ctx?.onExitTown?.()));
    bodyEl.querySelectorAll('button[data-wp-idx]').forEach((b) => {
      b.addEventListener('click', () => {
        const wp = wps[Number(b.dataset.wpIdx)];
        if (wp) closeAnd(() => ctx?.onTeleportWaypoint?.(wp.x, wp.y, wp.label));
      });
    });
    bodyEl.querySelectorAll('button[data-wp-stg]').forEach((b) => {
      b.addEventListener('click', () => closeAnd(() => ctx?.onTeleportToStage?.(Number(b.dataset.wpStg))));
    });
    bodyEl.querySelectorAll('button[data-wp-ch]').forEach((b) => {
      b.addEventListener('click', () => closeAnd(() => ctx?.onTeleportTown?.(Number(b.dataset.wpCh))));
    });
  } else if (action === 'modal_vault') {
    bodyEl.querySelector('#btn-vault-bag')?.addEventListener('click', () => closeAnd(() => ctx?.onOpenDrawer?.('bag')));
    bodyEl.querySelectorAll('button[data-vault-out]').forEach((b) => {
      b.addEventListener('click', () => {
        ctx?.onVaultWithdraw?.(Number(b.dataset.vaultOut));
        say('已從保險箱取出裝備。', 'success');
        setTimeout(reopen, 240);
      });
    });
    bodyEl.querySelectorAll('button[data-vault-in]').forEach((b) => {
      b.addEventListener('click', () => {
        ctx?.onVaultDeposit?.(b.dataset.vaultIn);
        say('已將珍貴裝備鎖入保險箱！', 'success');
        setTimeout(reopen, 240);
      });
    });
    bodyEl.querySelector('#btn-rule-cls')?.addEventListener('click', () => {
      ctx?.onToggleVaultRule?.('keepClassReq');
      setTimeout(reopen, 200);
    });
    bodyEl.querySelector('#btn-rule-crit')?.addEventListener('click', () => {
      ctx?.onToggleVaultRule?.('keepDoubleCrit');
      setTimeout(reopen, 200);
    });
  } else if (action === 'modal_sanctum') {
    bodyEl.querySelector('#btn-sanctum-rebirth')?.addEventListener('click', () => closeAnd(() => ctx?.onOpenDrawer?.('rebirth')));
    bodyEl.querySelectorAll('button[data-sanctum]').forEach((b) => {
      b.addEventListener('click', () => {
        ctx?.onUpgradeSanctum?.(b.dataset.sanctum);
        say('魂晶共鳴成功，永久光環進一步強化！', 'impact');
        setTimeout(reopen, 260);
      });
    });
  } else if (action === 'modal_patrol_guard') {
    bodyEl.querySelector('#btn-guard-bless')?.addEventListener('click', () => {
      ctx?.onGuardBlessing?.();
      say('城防之盾將守護你 3 分鐘！', 'success');
      setTimeout(reopen, 260);
    });
  } else if (action === 'modal_patrol_villager') {
    bodyEl.querySelector('#btn-villager-gift')?.addEventListener('click', () => {
      ctx?.onVillagerGift?.();
      say('一點小心意，願你冒險順利！', 'success');
      setTimeout(reopen, 260);
    });
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
      bodyEl.querySelector(pair[0])?.addEventListener('click', () => {
        ctx?.[pair[1]]?.();
        say('請收下這份章節限定贈禮！', 'impact');
        setTimeout(reopen, 280);
      });
    }
  }
}
