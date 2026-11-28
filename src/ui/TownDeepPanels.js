// v275: 暗黑 4 級深度城鎮設施介面（鐵匠鍛造台 4 分頁＋祕法煉金工坊 3 分頁）
import { resolveItemIconUniversal } from './UniversalTooltip.js?v=319';

const RARITY_COLOR = {
  common: '#cbd5e1',
  magic: '#60a5fa',
  rare: '#c084fc',
  legendary: '#fb923c',
  ancient: '#f43f5e',
  set: '#4ade80',
};

const TEMPER_MANUALS = [
  {
    id: 'offense',
    name: '🔥 狂暴輸出手冊',
    desc: '銘印核心增傷、暴擊傷害或攻速',
    pool: [
      { key: 'skillDmg', label: '核心技能傷害', min: 10, max: 24, unit: '%' },
      { key: 'critDmg',  label: '暴擊傷害',     min: 15, max: 35, unit: '%' },
      { key: 'atkSpeed', label: '攻擊速度',     min: 6,  max: 15, unit: '%' },
    ],
  },
  {
    id: 'ailment',
    name: '☠️ 元素異常手冊',
    desc: '銘印異常持續傷、易傷增傷或幸運觸發',
    pool: [
      { key: 'dotDmg',   label: '持續異常傷害', min: 14, max: 30, unit: '%' },
      { key: 'vulnDmg',  label: '對易傷傷害',   min: 12, max: 26, unit: '%' },
      { key: 'luckyHit', label: '幸運一擊機率', min: 5,  max: 14, unit: '%' },
    ],
  },
  {
    id: 'defense',
    name: '🛡️ 鋼鐵壁壘手冊',
    desc: '銘印護甲加成、最大生命或全減傷',
    pool: [
      { key: 'armorPct', label: '總護甲值',     min: 8,  max: 20, unit: '%' },
      { key: 'maxHpPct', label: '最大生命',     min: 8,  max: 18, unit: '%' },
      { key: 'drPct',    label: '全傷害減免',   min: 4,  max: 10, unit: '%' },
    ],
  },
  {
    id: 'summon',
    name: '💀 召喚大師手冊',
    desc: '銘印召喚物傷害、回能效率或冷卻縮減',
    pool: [
      { key: 'summonDmg', label: '召喚物傷害',  min: 14, max: 32, unit: '%' },
      { key: 'cdrPct',    label: '技能冷卻縮減',min: 4,  max: 11, unit: '%' },
      { key: 'resGen',    label: '職業資源回復',min: 8,  max: 20, unit: '%' },
    ],
  },
];

function fmtNum(n) {
  return Math.floor(Number(n) || 0).toLocaleString();
}

function renderItemTileIcon(it) {
  const src = resolveItemIconUniversal?.(it) || it?.icon || '';
  if (src && (src.includes('.png') || src.includes('.webp') || src.includes('.jpg') || src.startsWith('data:'))) {
    return `<img src="${src}" alt="${it?.name || ''}" style="width:100%;height:100%;object-fit:contain;border-radius:6px;" />`;
  }
  return `<span style="font-size:24px;">${src || '⚔️'}</span>`;
}

function getAffixDisplay(af) {
  const val = af?.value ?? af?.val ?? 0;
  const unit = af?.unit ?? (String(af?.label || '').match(/率|傷|速|減|掉|金/) ? '%' : '');
  return `${af?.label || af?.key || '屬性'} +${val}${unit}`;
}

export function renderDeepBlacksmithHTML(ui, st) {
  const tab = ui._bsTab || 'refine'; // refine | reroll | temper | salvage
  const filter = ui._bsFilter || 'all'; // all | eq | high
  const eqList = Object.entries(st.equipment || {})
    .filter(([, item]) => item && item.uid)
    .map(([slot, item]) => ({ ...item, isEq: true, slot }));
  const invList = (st.inventory || [])
    .filter((it) => it && it.uid)
    .map((it) => ({ ...it, isEq: false }));
  let allTargets = [...eqList, ...invList];
  if (filter === 'eq') allTargets = eqList;
  else if (filter === 'high') allTargets = allTargets.filter((x) => ['legendary', 'ancient', 'set'].includes(x.rarity));

  const curTarget = allTargets.find((x) => x.uid === ui._bsSelectedUid) || allTargets[0] || null;
  if (curTarget) ui._bsSelectedUid = curTarget.uid;

  const gold = st.gold || 0;
  const dust = st.dust || 0;
  const protCount = st.protectStones || 0;
  const lv = curTarget?.enhance || 0;
  const succRate = lv < 3 ? 100 : (lv < 6 ? 85 - (lv - 3) * 10 : Math.max(35, 60 - (lv - 6) * 8));
  const refineCost = Math.floor(450 * (1 + lv * 0.45));
  const rerollCost = Math.floor(20 + (curTarget?.level || 1) * 3);
  const temperCost = Math.floor(65 + (curTarget?.level || 1) * 4);
  const baseVal = curTarget?.baseStat?.value || 0;
  const curStatVal = Math.round(baseVal * (1 + lv * 0.12));
  const nextStatVal = Math.round(baseVal * (1 + (lv + 1) * 0.12));
  const statLabel = curTarget?.baseStat?.label || curTarget?.baseStat?.stat || '主屬性';
  const rCol = RARITY_COLOR[curTarget?.rarity] || '#fde68a';

  const tabsHtml = [
    ['refine', '⚒️ 精煉強化'],
    ['reroll', '🎲 詞綴洗鍊'],
    ['temper', '🔥 裝備回火'],
    ['salvage','♻️ 批次拆解'],
  ].map(([id, label]) => `
    <button type="button" data-bs-tab="${id}" style="padding:7px 14px;border-radius:7px;border:1px solid ${tab === id ? '#f59e0b' : 'rgba(148,163,184,0.28)'};background:${tab === id ? 'linear-gradient(180deg,#78350f,#451a03)' : 'rgba(15,18,26,0.78)'};color:${tab === id ? '#fef08a' : '#cbd5e1'};font-size:12.5px;font-weight:800;cursor:pointer;">${label}</button>
  `).join('');

  const stripHtml = allTargets.length ? allTargets.slice(0, 28).map((it) => {
    const col = RARITY_COLOR[it.rarity] || '#94a3b8';
    const sel = curTarget?.uid === it.uid;
    return `
      <button type="button" data-bs-uid="${it.uid}" title="${it.name} (+${it.enhance || 0})" style="position:relative;flex:0 0 56px;width:56px;height:56px;padding:4px;border-radius:8px;border:2px solid ${sel ? '#fde047' : col};background:rgba(12,14,20,0.92);box-shadow:${sel ? '0 0 12px rgba(253,224,71,0.7)' : 'none'};cursor:pointer;">
        ${renderItemTileIcon(it)}
        ${it.isEq ? '<span style="position:absolute;top:-5px;left:-4px;background:#b45309;color:#fef3c7;font-size:9px;padding:1px 4px;border-radius:4px;font-weight:800;">身上</span>' : ''}
        <span style="position:absolute;bottom:1px;right:3px;background:rgba(0,0,0,0.8);color:#fde047;font-size:10px;font-weight:900;padding:0 3px;border-radius:3px;">+${it.enhance || 0}</span>
      </button>
    `;
  }).join('') : '<div style="font-size:12px;color:#94a3b8;padding:8px;">此篩選條件下無裝備。</div>';

  let mainBody = '';
  if (tab === 'salvage') {
    const cntCommon = invList.filter((x) => !x.rarity || x.rarity === 'common').length;
    const cntMagic = invList.filter((x) => x.rarity === 'magic').length;
    const cntRare = invList.filter((x) => x.rarity === 'rare').length;
    mainBody = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px;background:rgba(10,12,18,0.82);border:1px solid rgba(245,158,11,0.35);border-radius:10px;">
        <div style="padding:12px;background:rgba(20,24,34,0.85);border-radius:8px;border:1px solid rgba(148,163,184,0.25);">
          <div style="font-size:14px;font-weight:800;color:#93c5fd;margin-bottom:6px;">♻️ 一鍵拆解藍／白裝</div>
          <div style="font-size:12px;color:#cbd5e1;margin-bottom:10px;">目前背包內：普通 ${cntCommon} 件、魔法 ${cntMagic} 件<br/>預估可回收約 <b style="color:#7dd3fc;">${(cntCommon * 4 + cntMagic * 10)} 粉塵</b></div>
          <button type="button" id="btn-bs-salvage-blue" ${(cntCommon + cntMagic) === 0 ? 'disabled' : ''} style="width:100%;padding:8px;border-radius:7px;border:1px solid #38bdf8;background:#0c4a6e;color:#e0f2fe;font-weight:800;cursor:pointer;">拆解全部藍白裝</button>
        </div>
        <div style="padding:12px;background:rgba(20,24,34,0.85);border-radius:8px;border:1px solid rgba(192,132,252,0.35);">
          <div style="font-size:14px;font-weight:800;color:#d8b4fe;margin-bottom:6px;">🔥 一鍵拆解紫裝以下</div>
          <div style="font-size:12px;color:#cbd5e1;margin-bottom:10px;">目前背包內含稀有(紫)共 ${cntCommon + cntMagic + cntRare} 件（保留傳奇／遠古）<br/>預估可回收約 <b style="color:#7dd3fc;">${(cntCommon * 4 + cntMagic * 10 + cntRare * 24)} 粉塵</b></div>
          <button type="button" id="btn-bs-salvage-rare" ${(cntCommon + cntMagic + cntRare) === 0 ? 'disabled' : ''} style="width:100%;padding:8px;border-radius:7px;border:1px solid #a855f7;background:#581c87;color:#f3e8ff;font-weight:800;cursor:pointer;">拆解全部紫裝以下</button>
        </div>
      </div>
    `;
  } else if (!curTarget) {
    mainBody = '<div style="padding:28px;text-align:center;color:#94a3b8;background:rgba(10,12,18,0.75);border-radius:10px;">請先從上方點選一件裝備放上熾焰鐵砧。</div>';
  } else {
    const leftPedestal = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:14px;background:rgba(10,10,14,0.74);border:1px solid rgba(245,158,11,0.38);border-radius:10px;backdrop-filter:blur(2px);">
        <div style="width:76px;height:76px;padding:6px;border-radius:12px;border:2px solid ${rCol};background:radial-gradient(circle,rgba(245,158,11,0.22),rgba(12,14,20,0.95));box-shadow:0 0 18px ${rCol}55;">
          ${renderItemTileIcon(curTarget)}
        </div>
        <div style="font-size:15px;font-weight:900;color:${rCol};text-align:center;">${curTarget.name} <span style="color:#fde047;">+${lv}</span></div>
        <div style="font-size:11.5px;color:#cbd5e1;">等級 ${curTarget.level || 1} ｜ 戰力評分 <b style="color:#fde047;">${curTarget.powerScore || 0}</b></div>
        ${curTarget.temperedAffix ? `<div style="font-size:11.5px;color:#fb923c;background:rgba(124,45,18,0.45);border:1px solid #ea580c;padding:3px 8px;border-radius:5px;">🔥 回火銘文：${curTarget.temperedAffix.label} +${curTarget.temperedAffix.value}${curTarget.temperedAffix.unit}</div>` : ''}
      </div>
    `;

    let rightPanel = '';
    if (tab === 'refine') {
      rightPanel = `
        <div style="display:flex;flex-direction:column;gap:10px;padding:14px;background:rgba(10,12,18,0.82);border:1px solid rgba(245,158,11,0.35);border-radius:10px;">
          <div style="font-size:13px;font-weight:800;color:#fde68a;">⚒️ 精煉預覽（+${lv} → +${Math.min(10, lv + 1)}）</div>
          <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;padding:10px;background:rgba(20,24,34,0.9);border-radius:8px;font-size:12.5px;">
            <div><span style="color:#94a3b8;">${statLabel}</span><br/><b style="color:#f8fafc;font-size:15px;">+${curStatVal}</b></div>
            <div style="color:#f59e0b;font-weight:900;">➔</div>
            <div><span style="color:#86efac;">強化後預估</span><br/><b style="color:#4ade80;font-size:15px;">+${nextStatVal} (+${Math.max(1, nextStatVal - curStatVal)})</b></div>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:4px;">
              <span style="color:#cbd5e1;">本次精煉成功率</span>
              <b style="color:${succRate >= 70 ? '#4ade80' : '#fb923c'};">${succRate}%</b>
            </div>
            <div style="height:7px;background:#1e293b;border-radius:4px;overflow:hidden;">
              <div style="width:${succRate}%;height:100%;background:linear-gradient(90deg,#f59e0b,#4ade80);"></div>
            </div>
          </div>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#fde68a;cursor:pointer;">
            <input type="checkbox" id="chk-bs-protect" ${protCount > 0 ? '' : 'disabled'} />
            啟用強化保護石（失敗不降階｜剩餘 <b>${protCount}</b> 顆）
          </label>
          <button type="button" id="btn-bs-refine" ${lv >= 10 || gold < refineCost ? 'disabled' : ''} style="margin-top:auto;padding:10px 14px;border-radius:8px;border:1px solid #fbbf24;background:linear-gradient(180deg,#d97706,#92400e);color:#fffbeb;font-size:13.5px;font-weight:900;cursor:pointer;">
            ${lv >= 10 ? '已達精煉上限 (+10)' : `⚒️ 揮鎚精煉強化（${fmtNum(refineCost)} 金幣）`}
          </button>
        </div>
      `;
    } else if (tab === 'reroll') {
      const affixes = curTarget.affixes || [];
      rightPanel = `
        <div style="display:flex;flex-direction:column;gap:8px;padding:14px;background:rgba(10,12,18,0.82);border:1px solid rgba(245,158,11,0.35);border-radius:10px;">
          <div style="font-size:13px;font-weight:800;color:#fde68a;">🎲 詞綴銘文槽（點擊可鎖定 1 條保留）</div>
          ${affixes.length ? affixes.map((af, idx) => {
            const locked = ui._bsLockIdx === idx;
            return `
              <button type="button" data-bs-lock="${idx}" style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-radius:7px;border:1px solid ${locked ? '#fbbf24' : 'rgba(148,163,184,0.3)'};background:${locked ? 'rgba(120,53,15,0.5)' : 'rgba(18,22,32,0.88)'};color:${locked ? '#fef08a' : '#e2e8f0'};font-size:12.5px;cursor:pointer;">
                <span><b>${getAffixDisplay(af)}</b></span>
                <span style="font-size:11px;color:${locked ? '#fde047' : '#94a3b8'};">${locked ? '🔒 已鎖定' : '🔓 點擊鎖定'}</span>
              </button>
            `;
          }).join('') : '<div style="font-size:12px;color:#94a3b8;padding:14px 0;">此裝備無隨機詞綴可洗鍊。</div>'}
          <button type="button" id="btn-bs-reroll" ${!affixes.length || dust < rerollCost ? 'disabled' : ''} style="margin-top:auto;padding:10px 14px;border-radius:8px;border:1px solid #38bdf8;background:linear-gradient(180deg,#0284c7,#075985);color:#f0f9ff;font-size:13.5px;font-weight:900;cursor:pointer;">
            🎲 重鑄洗鍊詞綴（${fmtNum(rerollCost)} 粉塵）
          </button>
        </div>
      `;
    } else if (tab === 'temper') {
      rightPanel = `
        <div style="display:flex;flex-direction:column;gap:8px;padding:14px;background:rgba(10,12,18,0.82);border:1px solid rgba(234,88,12,0.45);border-radius:10px;">
          <div style="font-size:13px;font-weight:800;color:#fb923c;">🔥 暗黑 4 裝備回火（消耗 ${fmtNum(temperCost)} 粉塵銘印額外流派詞綴）</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            ${TEMPER_MANUALS.map((m) => `
              <button type="button" data-bs-temper="${m.id}" ${dust < temperCost ? 'disabled' : ''} style="text-align:left;padding:9px 10px;border-radius:8px;border:1px solid rgba(251,146,60,0.45);background:rgba(28,16,12,0.88);color:#ffedd5;cursor:pointer;">
                <div style="font-size:12.5px;font-weight:800;color:#fdba74;">${m.name}</div>
                <div style="font-size:11px;color:#cbd5e1;margin-top:2px;">${m.desc}</div>
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }
    mainBody = `<div style="display:grid;grid-template-columns:230px 1fr;gap:12px;">${leftPedestal}${rightPanel}</div>`;
  }

  return `
    <div style="position:relative;border-radius:12px;overflow:hidden;border:1px solid rgba(245,158,11,0.35);background:linear-gradient(180deg,rgba(10,8,8,0.68),rgba(10,8,8,0.92)),url('./assets/ui/town_panels/ui_forge_stage.webp?v=275') center/cover no-repeat;padding:14px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
        <div style="display:flex;gap:6px;flex-wrap:wrap;">${tabsHtml}</div>
        <div style="display:flex;gap:6px;align-items:center;">
          <button type="button" data-bs-filter="all" style="padding:4px 8px;border-radius:5px;border:1px solid ${filter==='all'?'#fde047':'#475569'};background:#111827;color:#f8fafc;font-size:11px;cursor:pointer;">全部</button>
          <button type="button" data-bs-filter="eq" style="padding:4px 8px;border-radius:5px;border:1px solid ${filter==='eq'?'#fde047':'#475569'};background:#111827;color:#f8fafc;font-size:11px;cursor:pointer;">身上</button>
          <button type="button" data-bs-filter="high" style="padding:4px 8px;border-radius:5px;border:1px solid ${filter==='high'?'#fb923c':'#475569'};background:#111827;color:#fdba74;font-size:11px;cursor:pointer;">傳奇/遠古</button>
          <button type="button" id="btn-bs-drawer" style="padding:4px 10px;border-radius:5px;border:1px solid #b45309;background:#292018;color:#fde68a;font-size:11px;font-weight:700;cursor:pointer;">全身部位 (U) ↗</button>
        </div>
      </div>
      ${tab !== 'salvage' ? `<div style="display:flex;gap:8px;overflow-x:auto;padding:6px 2px 10px 2px;margin-bottom:8px;">${stripHtml}</div>` : ''}
      ${mainBody}
    </div>
  `;
}

export function bindDeepBlacksmithEvents(bodyEl, ui, st, ctx, reopen, say, closeAnd) {
  bodyEl.querySelector('#btn-bs-drawer')?.addEventListener('click', () => closeAnd(() => ctx?.onOpenDrawer?.('upgrade')));
  bodyEl.querySelectorAll('button[data-bs-tab]').forEach((b) => b.addEventListener('click', () => { ui._bsTab = b.dataset.bsTab; reopen(); }));
  bodyEl.querySelectorAll('button[data-bs-filter]').forEach((b) => b.addEventListener('click', () => { ui._bsFilter = b.dataset.bsFilter; reopen(); }));
  bodyEl.querySelectorAll('button[data-bs-uid]').forEach((b) => b.addEventListener('click', () => { ui._bsSelectedUid = b.dataset.bsUid; ui._bsLockIdx = -1; reopen(); }));
  bodyEl.querySelectorAll('button[data-bs-lock]').forEach((b) => b.addEventListener('click', () => { const idx = Number(b.dataset.bsLock); ui._bsLockIdx = ui._bsLockIdx === idx ? -1 : idx; reopen(); }));
  bodyEl.querySelector('#btn-bs-refine')?.addEventListener('click', () => {
    const uid = ui._bsSelectedUid;
    const isEq = Object.values(st.equipment || {}).some((x) => x?.uid === uid);
    const prot = !!bodyEl.querySelector('#chk-bs-protect')?.checked;
    ctx?.onRefineItem?.(uid, isEq, prot);
    say('重錘淬鍊完成！熾焰鐵砧火花四濺！', 'impact');
    setTimeout(reopen, 260);
  });
  bodyEl.querySelector('#btn-bs-reroll')?.addEventListener('click', () => {
    const uid = ui._bsSelectedUid;
    const isEq = Object.values(st.equipment || {}).some((x) => x?.uid === uid);
    ctx?.onRerollItem?.(uid, isEq, ui._bsLockIdx ?? -1);
    say('叮噹！詞綴銘文已重新鑄造！', 'impact');
    setTimeout(reopen, 260);
  });
  bodyEl.querySelectorAll('button[data-bs-temper]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const manual = TEMPER_MANUALS.find((m) => m.id === btn.dataset.bsTemper);
      if (!manual) return;
      const uid = ui._bsSelectedUid;
      const eqEntry = Object.entries(st.equipment || {}).find(([, x]) => x?.uid === uid);
      const item = eqEntry ? eqEntry[1] : (st.inventory || []).find((x) => x?.uid === uid);
      if (!item) return;
      const cost = Math.floor(65 + (item.level || 1) * 4);
      if ((st.dust || 0) < cost) return;
      st.dust -= cost;
      const pick = manual.pool[Math.floor(Math.random() * manual.pool.length)];
      const rolled = pick.min + Math.floor(Math.random() * (pick.max - pick.min + 1));
      item.temperedAffix = { key: pick.key, label: pick.label, value: rolled, unit: pick.unit };
      item.powerScore = (item.powerScore || 100) + rolled * 3;
      ui.addLog?.(`🔥 鐵匠回火成功：【${item.name}】銘印「${pick.label} +${rolled}${pick.unit}」！`, 'victory');
      ctx?.onRefreshAll?.();
      say(`回火成功！銘印【${pick.label} +${rolled}${pick.unit}】！`, 'success');
      setTimeout(reopen, 260);
    });
  });
  const doSalvage = (rarities) => {
    const inv = st.inventory || [];
    let count = 0, dustGain = 0;
    const kept = [];
    for (const it of inv) {
      if (it && rarities.includes(it.rarity || 'common')) {
        count++;
        dustGain += it.rarity === 'rare' ? 24 : (it.rarity === 'magic' ? 10 : 4);
      } else {
        kept.push(it);
      }
    }
    if (count > 0) {
      st.inventory = kept;
      st.dust = (st.dust || 0) + dustGain;
      ui.addLog?.(`♻️ 批次拆解 ${count} 件裝備，獲得 ${dustGain} 粉塵！`, 'loot');
      ctx?.onRefreshAll?.();
      say(`已拆解 ${count} 件裝備，回收 ${dustGain} 粉塵！`, 'success');
      setTimeout(reopen, 220);
    }
  };
  bodyEl.querySelector('#btn-bs-salvage-blue')?.addEventListener('click', () => doSalvage(['common', 'magic']));
  bodyEl.querySelector('#btn-bs-salvage-rare')?.addEventListener('click', () => doSalvage(['common', 'magic', 'rare']));
}

export function renderDeepAlchemyHTML(ui, st, chMult) {
  const tab = ui._alcTab || 'brews'; // brews | flask | transmute
  const buffs = st.potionBuffs || {};
  const now = Date.now();
  const gold = st.gold || 0;
  const dust = st.dust || 0;
  const flaskLv = st.alchemyFlaskLevel || 0;

  const remStr = (until) => {
    const s = Math.max(0, Math.ceil(((until || 0) - now) / 1000));
    if (s <= 0) return '';
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const brews = [
    { id: 'hp_refill', name: '補滿生命源泉', desc: '回滿 100% 生命並補滿血瓶次數', icon: 'pot_hp.webp',    cost: Math.floor(180 * chMult), rem: '' },
    { id: 'exp_pot',   name: '濃稠經驗藥水', desc: '擊殺經驗 +50%（60秒）',       icon: 'pot_exp.webp',   cost: Math.floor(420 * chMult), rem: remStr(buffs.expUntil) },
    { id: 'fury_pot',  name: '狂戰士藥水',   desc: '攻速 +25%・暴擊 +10%（45秒）', icon: 'pot_fury.webp',  cost: Math.floor(480 * chMult), rem: remStr(buffs.furyUntil) },
    { id: 'mf_pot',    name: '黃金尋寶藥水', desc: '掉寶 +40%・金幣 +30%（60秒）', icon: 'pot_mf.webp',    cost: Math.floor(520 * chMult), rem: remStr(buffs.mfUntil) },
    { id: 'titan_pot', name: '泰坦巨力秘藥', desc: '攻擊 +30%・暴傷 +40%（180秒）',icon: 'pot_titan.webp', cost: Math.floor(680 * chMult), rem: remStr(buffs.titanUntil) },
    { id: 'iron_pot',  name: '鋼鐵壁壘秘藥', desc: '防禦 +35%・減傷 +12%（180秒）',icon: 'pot_iron.webp',  cost: Math.floor(620 * chMult), rem: remStr(buffs.ironUntil) },
    { id: 'sage_pot',  name: '秘法先知秘藥', desc: '冷卻縮減 +18%・掉寶 +50%',    icon: 'pot_sage.webp',  cost: Math.floor(700 * chMult), rem: remStr(buffs.sageUntil) },
  ];
  const bundleCost = Math.floor((420 + 480 + 520 + 680 + 620 + 700) * chMult * 0.9);
  const activeCount = brews.filter((b) => b.rem).length;

  const tabsHtml = [
    ['brews',     `🧪 戰前秘藥（${activeCount}/6）`],
    ['flask',     `❤️ 血瓶升級（Lv.${flaskLv}）`],
    ['transmute', '⚗️ 深淵轉化'],
  ].map(([id, label]) => `
    <button type="button" data-alc-tab="${id}" style="padding:7px 14px;border-radius:7px;border:1px solid ${tab === id ? '#34d399' : 'rgba(148,163,184,0.28)'};background:${tab === id ? 'linear-gradient(180deg,#065f46,#022c22)' : 'rgba(15,18,26,0.78)'};color:${tab === id ? '#a7f3d0' : '#cbd5e1'};font-size:12.5px;font-weight:800;cursor:pointer;">${label}</button>
  `).join('');

  let bodyHtml = '';
  if (tab === 'brews') {
    bodyHtml = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        ${brews.map((b) => `
          <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:9px;border:1px solid ${b.rem ? '#34d399' : 'rgba(148,163,184,0.28)'};background:rgba(12,16,22,0.86);">
            <img src="./assets/ui/town_panels/${b.icon}?v=275" style="width:52px;height:52px;border-radius:8px;border:1px solid rgba(251,191,36,0.45);object-fit:cover;flex-shrink:0;" />
            <div style="flex:1;min-width:0;">
              <div style="display:flex;align-items:center;gap:6px;">
                <b style="font-size:13px;color:#fef3c7;">${b.name}</b>
                ${b.rem ? `<span style="font-size:10px;padding:1px 5px;border-radius:4px;background:#065f46;color:#6ee7b7;font-weight:800;">${b.rem}</span>` : ''}
              </div>
              <div style="font-size:11px;color:#cbd5e1;margin-top:2px;">${b.desc}</div>
            </div>
            <button type="button" data-brew="${b.id}" ${gold < b.cost ? 'disabled' : ''} style="padding:7px 10px;border-radius:7px;border:1px solid #f59e0b;background:linear-gradient(180deg,#d97706,#92400e);color:#fffbeb;font-size:11.5px;font-weight:800;cursor:pointer;white-space:nowrap;">${fmtNum(b.cost)} G</button>
          </div>
        `).join('')}
      </div>
    `;
  } else if (tab === 'flask') {
    const upGold = Math.floor(2500 * Math.pow(1.45, flaskLv));
    const upDust = Math.floor(60 + flaskLv * 45);
    const curHealPct = 45 + flaskLv * 5;
    const nextHealPct = 45 + (flaskLv + 1) * 5;
    bodyHtml = `
      <div style="display:grid;grid-template-columns:160px 1fr;gap:14px;padding:14px;background:rgba(10,14,20,0.86);border:1px solid rgba(52,211,153,0.4);border-radius:10px;align-items:center;">
        <div style="text-align:center;">
          <img src="./assets/ui/town_panels/pot_hp.webp?v=275" style="width:110px;height:110px;border-radius:12px;border:2px solid #f43f5e;box-shadow:0 0 20px rgba(244,63,94,0.45);" />
          <div style="font-size:13px;font-weight:900;color:#fda4af;margin-top:6px;">深淵生命聖瓶 Lv.${flaskLv}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div style="font-size:13px;color:#e2e8f0;">永久強化戰鬥生命藥水效能，高難度推圖核心續航！</div>
          <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:8px;padding:10px;background:rgba(20,26,36,0.9);border-radius:8px;font-size:12.5px;">
            <div>單次回復：<b>${curHealPct}% 生命</b><br/>上限加成：<b>+${Math.floor(flaskLv / 2)} 次</b></div>
            <div style="color:#34d399;font-weight:900;align-self:center;">➔</div>
            <div style="color:#86efac;">強化後：<b>${nextHealPct}% 生命</b><br/>上限加成：<b>+${Math.floor((flaskLv + 1) / 2)} 次</b></div>
          </div>
          <button type="button" id="btn-alc-upgrade-flask" ${flaskLv >= 10 || gold < upGold || dust < upDust ? 'disabled' : ''} style="padding:10px;border-radius:8px;border:1px solid #34d399;background:linear-gradient(180deg,#059669,#065f46);color:#ecfdf5;font-size:13px;font-weight:900;cursor:pointer;">
            ${flaskLv >= 10 ? '已達血瓶強化上限 (Lv.10)' : `⚗️ 永久升級血瓶（${fmtNum(upGold)} G + ${fmtNum(upDust)} 粉塵）`}
          </button>
        </div>
      </div>
    `;
  } else {
    bodyHtml = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div style="display:flex;flex-direction:column;gap:8px;padding:12px;background:rgba(12,16,22,0.88);border:1px solid rgba(251,191,36,0.45);border-radius:10px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <img src="./assets/ui/town_panels/pot_stone.webp?v=275" style="width:60px;height:60px;border-radius:8px;border:1px solid #fbbf24;" />
            <div>
              <div style="font-size:14px;font-weight:800;color:#fde047;">煉成：強化保護石 ×1</div>
              <div style="font-size:11.5px;color:#cbd5e1;">目前持有：<b>${st.protectStones || 0}</b> 顆｜鐵匠強化防降階必備</div>
            </div>
          </div>
          <button type="button" id="btn-alc-craft-stone" ${dust < 180 || gold < 2000 ? 'disabled' : ''} style="padding:9px;border-radius:7px;border:1px solid #fbbf24;background:linear-gradient(180deg,#b45309,#78350f);color:#fffbeb;font-weight:800;cursor:pointer;">煉成保護石（2,000 G + 180 粉塵）</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;padding:12px;background:rgba(12,16,22,0.88);border:1px solid rgba(52,211,153,0.45);border-radius:10px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <img src="./assets/ui/town_panels/pot_box.webp?v=275" style="width:60px;height:60px;border-radius:8px;border:1px solid #34d399;" />
            <div>
              <div style="font-size:14px;font-weight:800;color:#6ee7b7;">煉成：高階秘藥補給箱</div>
              <div style="font-size:11.5px;color:#cbd5e1;">直接啟動泰坦＋壁壘＋先知 3 大高階秘藥（5 分鐘）</div>
            </div>
          </div>
          <button type="button" id="btn-alc-craft-box" ${dust < 120 ? 'disabled' : ''} style="padding:9px;border-radius:7px;border:1px solid #34d399;background:linear-gradient(180deg,#059669,#064e3b);color:#ecfdf5;font-weight:800;cursor:pointer;">粉塵煉成補給箱（120 粉塵）</button>
        </div>
      </div>
    `;
  }

  return `
    <div style="position:relative;border-radius:12px;overflow:hidden;border:1px solid rgba(52,211,153,0.35);background:linear-gradient(180deg,rgba(8,14,14,0.62),rgba(8,12,16,0.92)),url('./assets/ui/town_panels/ui_alchemy_cauldron.webp?v=275') center/cover no-repeat;padding:14px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <div style="display:flex;gap:6px;flex-wrap:wrap;">${tabsHtml}</div>
        ${tab === 'brews' ? `<button type="button" id="btn-brew-all" ${gold < bundleCost ? 'disabled' : ''} style="padding:7px 14px;border-radius:8px;border:1px solid #fbbf24;background:linear-gradient(180deg,#d97706,#92400e);color:#fffbeb;font-size:12.5px;font-weight:900;cursor:pointer;">⚡ 9 折一鍵全套熬煮（${fmtNum(bundleCost)} G）</button>` : ''}
      </div>
      ${bodyHtml}
    </div>
  `;
}

export function bindDeepAlchemyEvents(bodyEl, ui, st, ctx, chMult, reopen, say) {
  const bundleCost = Math.floor((420 + 480 + 520 + 680 + 620 + 700) * chMult * 0.9);
  bodyEl.querySelectorAll('button[data-alc-tab]').forEach((b) => b.addEventListener('click', () => { ui._alcTab = b.dataset.alcTab; reopen(); }));
  bodyEl.querySelector('#btn-brew-all')?.addEventListener('click', () => {
    ctx?.onBrewAllCombat?.(bundleCost);
    say('全套戰前秘藥已在煉金釜中沸騰完成！', 'success');
    setTimeout(reopen, 240);
  });
  bodyEl.querySelectorAll('button[data-brew]').forEach((btn) => {
    btn.addEventListener('click', () => {
      ctx?.onBrewPotion?.(btn.dataset.brew);
      say('秘藥調配完成，已注入你的藥囊！', 'success');
      setTimeout(reopen, 220);
    });
  });
  bodyEl.querySelector('#btn-alc-upgrade-flask')?.addEventListener('click', () => {
    const lv = st.alchemyFlaskLevel || 0;
    const upGold = Math.floor(2500 * Math.pow(1.45, lv));
    const upDust = Math.floor(60 + lv * 45);
    if (lv >= 10 || (st.gold || 0) < upGold || (st.dust || 0) < upDust) return;
    st.gold -= upGold;
    st.dust -= upDust;
    st.alchemyFlaskLevel = lv + 1;
    ui.addLog?.(`❤️ 深淵生命聖瓶永久升級至 Lv.${st.alchemyFlaskLevel}（單次回復 ${45 + st.alchemyFlaskLevel * 5}% 生命）！`, 'victory');
    ctx?.onRefreshAll?.();
    say(`血瓶永久升級至 Lv.${st.alchemyFlaskLevel}！`, 'success');
    setTimeout(reopen, 240);
  });
  bodyEl.querySelector('#btn-alc-craft-stone')?.addEventListener('click', () => {
    if ((st.dust || 0) < 180 || (st.gold || 0) < 2000) return;
    st.dust -= 180;
    st.gold -= 2000;
    st.protectStones = (st.protectStones || 0) + 1;
    ui.addLog?.('🛡️ 煉金轉化成功：獲得 1 顆「強化保護石」！', 'loot');
    ctx?.onRefreshAll?.();
    say('強化保護石已煉成！', 'success');
    setTimeout(reopen, 220);
  });
  bodyEl.querySelector('#btn-alc-craft-box')?.addEventListener('click', () => {
    if ((st.dust || 0) < 120) return;
    st.dust -= 120;
    if (!st.potionBuffs) st.potionBuffs = {};
    const t = Date.now() + 300000;
    st.potionBuffs.titanUntil = Math.max(st.potionBuffs.titanUntil || 0, t);
    st.potionBuffs.ironUntil = Math.max(st.potionBuffs.ironUntil || 0, t);
    st.potionBuffs.sageUntil = Math.max(st.potionBuffs.sageUntil || 0, t);
    ui.addLog?.('⚗️ 高階秘藥補給箱已開啟：3 大高階秘藥持續 5 分鐘！', 'victory');
    ctx?.onRefreshAll?.();
    say('三大高階秘藥已全數啟動！', 'success');
    setTimeout(reopen, 220);
  });
}

// ===================== v276: 深淵黑市賭桌深度重構（寶箱開箱光柱＋8 部位指定賭博＋實物對比貨架與鎖定＋10 顆符文保底軌） =====================
const GAMBLE_SLOTS = [
  { id: 'weapon',  label: '⚔️ 武器' },
  { id: 'offhand', label: '🛡️ 副手' },
  { id: 'helm',    label: '⛑️ 頭盔' },
  { id: 'armor',   label: '🦺 胸甲' },
  { id: 'gloves',  label: '🧤 手套' },
  { id: 'boots',   label: '👢 戰靴' },
  { id: 'amulet',  label: '📿 護符' },
  { id: 'ring',    label: '💍 戒指' },
];

export function renderDeepMarketHTML(ui, st, chMult) {
  const bm = st.blackMarket || { nextRefreshAt: 0, items: [], pityCount: 0 };
  const gold = st.gold || 0;
  const pity = Math.min(10, bm.pityCount || 0);
  const pityReady = pity >= 10;
  const stageCost = Math.floor(600 * (1 + (st.stage || 1) * 0.22));
  const highCost = stageCost * 3;
  const targetCost = Math.floor(stageCost * 1.35);
  const refreshCost = Math.floor(350 * chMult);
  const remSec = Math.max(0, Math.ceil(((bm.nextRefreshAt || 0) - Date.now()) / 1000));
  const remStr = `${String(Math.floor(remSec / 60)).padStart(2, '0')}:${String(remSec % 60).padStart(2, '0')}`;

  // 10 顆實體符文寶石保底軌
  const pityGems = Array.from({ length: 10 }, (_, i) => {
    const lit = i < pity;
    const bg = pityReady
      ? 'linear-gradient(135deg,#fde047,#f97316)'
      : (lit ? 'linear-gradient(135deg,#f59e0b,#dc2626)' : 'rgba(30,41,59,0.75)');
    const glow = pityReady ? '0 0 10px #fb923c' : (lit ? '0 0 6px #f59e0b' : 'none');
    return `<div style="height:12px;border-radius:3px;border:1px solid ${lit ? '#fde047' : '#334155'};background:${bg};box-shadow:${glow};"></div>`;
  }).join('');

  // 開箱揭曉光柱展示台（若剛開過箱）
  let revealHtml = '';
  const last = ui._bmLastLoot;
  if (last && last.uid) {
    const rCol = RARITY_COLOR[last.rarity] || '#fde68a';
    const eqSame = st.equipment?.[last.slot];
    const delta = (last.powerScore || 0) - (eqSame?.powerScore || 0);
    const deltaTag = delta > 0
      ? `<span style="color:#4ade80;font-weight:900;">+${delta} ▲</span>`
      : (delta < 0 ? `<span style="color:#f87171;font-weight:800;">${delta} ▼</span>` : '<span style="color:#94a3b8;">±0</span>');
    const inBag = (st.inventory || []).some((x) => x?.uid === last.uid);
    const affTxt = (last.affixes || []).slice(0, 4).map((a) => getAffixDisplay(a)).join(' ｜ ') || '基礎屬性裝備';
    revealHtml = `
      <div style="margin-bottom:10px;padding:10px 12px;border-radius:10px;border:1.5px solid ${rCol};background:linear-gradient(90deg,${rCol}26,rgba(12,14,22,0.94) 45%,${rCol}18);box-shadow:0 0 22px ${rCol}44;display:flex;align-items:center;gap:12px;">
        <div style="width:60px;height:60px;padding:4px;border-radius:9px;border:2px solid ${rCol};background:#0b0e14;flex-shrink:0;box-shadow:0 0 14px ${rCol}88;">
          ${renderItemTileIcon(last)}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-size:11px;padding:1px 6px;border-radius:4px;background:${rCol}33;color:${rCol};font-weight:900;">✨ 開箱揭曉</span>
            <b style="font-size:14px;color:${rCol};">${last.name}</b>
            <span style="font-size:12px;color:#fde047;">戰力 ${last.powerScore || 0}（${deltaTag}）</span>
          </div>
          <div style="font-size:11.5px;color:#cbd5e1;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${affTxt}</div>
        </div>
        ${inBag ? `
          <div style="display:flex;gap:6px;flex-shrink:0;">
            <button type="button" id="btn-bm-quick-equip" data-uid="${last.uid}" style="padding:6px 10px;border-radius:6px;border:1px solid #4ade80;background:#065f46;color:#ecfdf5;font-size:11.5px;font-weight:800;cursor:pointer;">⚔️ 立即裝備</button>
            <button type="button" id="btn-bm-quick-salvage" data-uid="${last.uid}" style="padding:6px 10px;border-radius:6px;border:1px solid #64748b;background:#1e293b;color:#cbd5e1;font-size:11.5px;font-weight:700;cursor:pointer;">♻️ 拆解</button>
          </div>
        ` : '<span style="font-size:11px;color:#86efac;font-weight:800;">已處理</span>'}
      </div>
    `;
  }

  // 下方 4 格真實裝備貨架（帶實圖、品質框、戰力差值、詞綴與鎖定）
  const shelfItems = bm.items || [];
  const shelfHtml = shelfItems.length ? shelfItems.map((entry, idx) => {
    const it = entry?.item;
    if (!it) return '';
    const rCol = RARITY_COLOR[it.rarity] || '#94a3b8';
    const eqSame = st.equipment?.[it.slot];
    const delta = (it.powerScore || 0) - (eqSame?.powerScore || 0);
    const deltaTag = delta > 0
      ? `<span style="color:#4ade80;">+${delta} ▲</span>`
      : (delta < 0 ? `<span style="color:#f87171;">${delta} ▼</span>` : '<span style="color:#94a3b8;">±0</span>');
    const affPreview = (it.affixes || []).slice(0, 2).map((a) => getAffixDisplay(a)).join('・') || '基礎屬性';
    return `
      <div style="display:flex;flex-direction:column;gap:6px;padding:9px 10px;border-radius:9px;border:1px solid ${entry.locked ? '#fde047' : rCol + '77'};background:rgba(12,14,22,0.88);opacity:${entry.sold ? 0.5 : 1};">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:46px;height:46px;padding:3px;border-radius:7px;border:1.5px solid ${rCol};background:#090b10;flex-shrink:0;">
            ${renderItemTileIcon(it)}
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:12.5px;font-weight:900;color:${rCol};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${it.name}">${it.name}</div>
            <div style="font-size:11px;color:#fde68a;">戰力 <b>${it.powerScore || 0}</b>（${deltaTag}）</div>
          </div>
          ${!entry.sold ? `<button type="button" data-bm-lock="${idx}" title="鎖定商品（刷新時保留）" style="background:none;border:none;font-size:14px;cursor:pointer;">${entry.locked ? '🔒' : '🔓'}</button>` : ''}
        </div>
        <div style="font-size:11px;color:#cbd5e1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${affPreview}</div>
        <button type="button" data-shelf="${idx}" ${entry.sold || gold < entry.price ? 'disabled' : ''} style="padding:6px 8px;border-radius:6px;border:1px solid #f59e0b;background:linear-gradient(180deg,#d97706,#92400e);color:#fffbeb;font-size:12px;font-weight:800;cursor:pointer;">
          ${entry.sold ? '已售罄' : `直接買斷（${fmtNum(entry.price)} G）`}
        </button>
      </div>
    `;
  }).join('') : '<div style="font-size:12px;color:#94a3b8;padding:12px;">貨架補貨中，請點擊右上角刷新貨架。</div>';

  return `
    <div style="position:relative;border-radius:12px;overflow:hidden;border:1px solid rgba(245,158,11,0.38);background:linear-gradient(180deg,rgba(14,8,12,0.68),rgba(10,8,12,0.94)),url('./assets/ui/town_panels/ui_blackmarket_table.webp?v=275') center/cover no-repeat;padding:13px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;">
        <div style="font-size:13px;font-weight:900;color:#fde68a;">
          ${pityReady ? '🔥 傳說保底已滿！下一抽必出傳說裝備！' : `💎 黑市貴賓傳說保底（${pity} / 10 顆符文寶石）`}
        </div>
        <button type="button" id="btn-bm-refresh" ${gold < refreshCost ? 'disabled' : ''} style="padding:5px 10px;border-radius:6px;border:1px solid #64748b;background:rgba(15,23,42,0.88);color:#e2e8f0;font-size:11.5px;font-weight:700;cursor:pointer;">🔄 刷新貨架 (${remStr})・${fmtNum(refreshCost)} G</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(10,1fr);gap:5px;margin-bottom:10px;">${pityGems}</div>
      ${revealHtml}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
        <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;border:1px solid rgba(168,85,247,0.55);background:linear-gradient(135deg,rgba(59,7,100,0.45),rgba(12,14,22,0.9));">
          <img src="./assets/ui/town_panels/chest_smuggler_iron.webp?v=275" style="width:74px;height:74px;object-fit:contain;flex-shrink:0;" />
          <div style="flex:1;">
            <div style="font-size:14px;font-weight:900;color:#e9d5ff;">神秘黑市鐵箱</div>
            <div style="font-size:11px;color:#cbd5e1;margin:2px 0 7px 0;">精良～傳說隨機鑑定・+1 保底</div>
            <button type="button" id="btn-gamble-std" ${gold < stageCost ? 'disabled' : ''} style="width:100%;padding:7px;border-radius:7px;border:1px solid #c084fc;background:linear-gradient(180deg,#7e22ce,#581c87);color:#faf5ff;font-size:12px;font-weight:900;cursor:pointer;">撬開鐵箱（${fmtNum(stageCost)} G）</button>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;border:1px solid rgba(251,146,60,0.7);background:linear-gradient(135deg,rgba(124,45,18,0.5),rgba(12,14,22,0.9));">
          <img src="./assets/ui/town_panels/chest_smuggler_gold.webp?v=275" style="width:74px;height:74px;object-fit:contain;flex-shrink:0;" />
          <div style="flex:1;">
            <div style="font-size:14px;font-weight:900;color:#fde047;">走私者高階秘寶箱</div>
            <div style="font-size:11px;color:#fed7aa;margin:2px 0 7px 0;">保底稀有以上・高傳說率・+2 保底</div>
            <button type="button" id="btn-gamble-high" ${gold < highCost ? 'disabled' : ''} style="width:100%;padding:7px;border-radius:7px;border:1px solid #fbbf24;background:linear-gradient(180deg,#d97706,#92400e);color:#fffbeb;font-size:12px;font-weight:900;cursor:pointer;">開啟秘寶（${fmtNum(highCost)} G）</button>
          </div>
        </div>
      </div>
      <div style="margin-bottom:10px;padding:8px 10px;border-radius:9px;border:1px solid rgba(148,163,184,0.28);background:rgba(10,12,18,0.82);">
        <div style="font-size:11.5px;font-weight:800;color:#fbbf24;margin-bottom:6px;">🎯 暗黑 4 珍品商・指定部位精準賭博（${fmtNum(targetCost)} G／次，+1 保底）</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;">
          ${GAMBLE_SLOTS.map((sl) => `<button type="button" data-gamble-slot="${sl.id}" ${gold < targetCost ? 'disabled' : ''} style="padding:5px 6px;border-radius:6px;border:1px solid rgba(251,191,36,0.38);background:#1c1917;color:#fef3c7;font-size:11.5px;font-weight:700;cursor:pointer;">${sl.label}</button>`).join('')}
        </div>
      </div>
      <div style="font-size:12px;font-weight:800;color:#fde68a;margin-bottom:6px;">🛒 限時走私實物貨架（點擊鎖頭可跨刷新保留）</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">${shelfHtml}</div>
    </div>
  `;
}

export function bindDeepMarketEvents(bodyEl, ui, st, ctx, chMult, reopen, say) {
  const stageCost = Math.floor(600 * (1 + (st.stage || 1) * 0.22));
  const highCost = stageCost * 3;
  const targetCost = Math.floor(stageCost * 1.35);
  const refreshCost = Math.floor(350 * chMult);

  bodyEl.querySelectorAll('button[data-shelf]').forEach((btn) => {
    btn.addEventListener('click', () => {
      ctx?.onBuyMarketShelf?.(Number(btn.dataset.shelf));
      say('成交！這件走私極品現在歸你了。', 'success');
      setTimeout(reopen, 200);
    });
  });
  bodyEl.querySelectorAll('button[data-bm-lock]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.bmLock);
      const entry = st.blackMarket?.items?.[idx];
      if (entry) {
        entry.locked = !entry.locked;
        ctx?.onRefreshAll?.();
        reopen();
      }
    });
  });
  bodyEl.querySelector('#btn-bm-refresh')?.addEventListener('click', () => {
    ctx?.onRefreshMarketShelf?.(refreshCost);
    say('沙漏翻轉，新一批走私貨品已上架（已保留鎖定商品）！', 'success');
    setTimeout(reopen, 200);
  });
  bodyEl.querySelector('#btn-gamble-std')?.addEventListener('click', () => {
    const rolled = ctx?.onGambleGear?.(stageCost, false, null);
    if (rolled) ui._bmLastLoot = rolled;
    say('鐵箱撬開！符文光芒湧出……', 'impact');
    setTimeout(reopen, 220);
  });
  bodyEl.querySelector('#btn-gamble-high')?.addEventListener('click', () => {
    const rolled = ctx?.onGambleGear?.(highCost, true, null);
    if (rolled) ui._bmLastLoot = rolled;
    say('高階暗金秘寶箱開啟！傳說光柱升起！', 'impact');
    setTimeout(reopen, 220);
  });
  bodyEl.querySelectorAll('button[data-gamble-slot]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const rolled = ctx?.onGambleGear?.(targetCost, false, btn.dataset.gambleSlot);
      if (rolled) ui._bmLastLoot = rolled;
      say(`指定部位【${btn.textContent}】鑑定完成！`, 'impact');
      setTimeout(reopen, 220);
    });
  });
  bodyEl.querySelector('#btn-bm-quick-equip')?.addEventListener('click', (ev) => {
    const uid = ev.currentTarget.dataset.uid;
    ctx?.onQuickEquipItem?.(uid);
    say('已立即換上這件新裝備！', 'success');
    setTimeout(reopen, 200);
  });
  bodyEl.querySelector('#btn-bm-quick-salvage')?.addEventListener('click', (ev) => {
    const uid = ev.currentTarget.dataset.uid;
    ctx?.onQuickSalvageItem?.(uid);
    say('已當場拆解換成粉塵！', 'success');
    setTimeout(reopen, 200);
  });
}
