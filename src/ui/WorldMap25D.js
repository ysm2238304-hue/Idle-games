/**
 * WorldMap25D.js (v222)
 * 滿視窗「暗黑四風格」2.5D 立體世界大陸地圖
 * - 10 大區域領土總覽（支援滑鼠拖曳平移＋滾輪縮放）
 * - 點擊任一區域平滑拉近（Zoom-in），在該區域真實地形上展開 10 個關卡地標（X-1 ~ X-10）與主城傳送陣
 */

const REGIONS_25D = [
  { ch: 0, name: '腐朽邊境營地',   town: '曙光哨站堡壘',     x: 23, y: 18, drop: '武器・胸甲・戰靴',   affix: '攻擊・生命・跑速',       lv: 'Lv.1~10'  },
  { ch: 1, name: '幽暗哥布林巢穴', town: '地下菌菇黑市',     x: 50, y: 18, drop: '頭盔・護手・戰靴',   affix: '閃避・掉金・尋寶',       lv: 'Lv.11~20' },
  { ch: 2, name: '白骨墓穴長廊',   town: '守夜人聖骨禮拜堂', x: 19, y: 44, drop: '胸甲・副手・項鍊',   affix: '護甲・生命%・回魔',      lv: 'Lv.21~30' },
  { ch: 3, name: '焦土熔岩裂谷',   town: '黑曜石熔爐要塞',   x: 41, y: 42, drop: '武器・護手',         affix: '爆傷・流血・攻擊%',      lv: 'Lv.31~40' },
  { ch: 4, name: '深淵魔王聖殿',   town: '緋紅魔獄王庭',     x: 61, y: 44, drop: '胸甲・戒指',         affix: '吸血・爆擊・攻擊%',      lv: 'Lv.41~50' },
  { ch: 5, name: '永凍冰霜凍原',   town: '極光冰晶堡',       x: 80, y: 24, drop: '頭盔・胸甲・腰帶',   affix: '冰緩・護甲轉攻・暈眩',   lv: 'Lv.51~60' },
  { ch: 6, name: '劇毒腐蝕沼澤',   town: '翠玉樹冠水寨',     x: 18, y: 74, drop: '武器・護手・項鍊',   affix: '攻速・吸血・閃避回血',   lv: 'Lv.61~70' },
  { ch: 7, name: '雷鳴風暴高塔',   town: '蒼穹電弧浮空城',   x: 41, y: 75, drop: '項鍊・戒指・副手',   affix: '冷卻・攻速・技能範圍',   lv: 'Lv.71~80' },
  { ch: 8, name: '血色修道院廢墟', town: '聖血薔薇修道院',   x: 64, y: 74, drop: '胸甲・頭盔・武器',   affix: '爆擊・爆傷・吸血・回魔', lv: 'Lv.81~90' },
  { ch: 9, name: '混沌星界虛空',   town: '永恆星辰聖域',     x: 87, y: 76, drop: '戒指・項鍊・武器',   affix: '冷卻・雙爆・攻擊%・尋寶', lv: 'Lv.91~100'},
];

// 每個區域放大後的 10 關真實路線相對偏移（圍繞區域中心展開成古道推進路徑）
const STAGE_OFFSETS = [
  [-9.5,  5.5], [-7.2,  1.2], [-4.8, -3.4], [-1.8, -6.2], [ 1.6, -4.5],
  [ 4.8, -6.4], [ 8.2, -3.2], [ 7.5,  1.8], [ 4.2,  5.2], [ 0.5,  2.2],
];

let overlayEl = null;
let zoom = 1;
let panX = 0;
let panY = 0;
let focusedCh = null;
let selectedStage = null;

function ensureCss() {
  if (document.getElementById('worldmap-25d-v222-css')) return;
  const l = document.createElement('link');
  l.id = 'worldmap-25d-v222-css';
  l.rel = 'stylesheet';
  l.href = './src/ui/worldMap25d.css?v=222';
  document.head.appendChild(l);
}

function buildOverlay() {
  if (overlayEl) return overlayEl;
  ensureCss();
  const el = document.createElement('div');
  el.id = 'worldmap-25d-overlay';
  el.className = 'hidden';
  el.innerHTML = `
    <div class="wm25-topbar">
      <div class="wm25-title-group">
        <button type="button" id="wm25-back-btn" class="wm25-back-btn hidden">← 返回全大陸總覽</button>
        <h2 id="wm25-title" class="wm25-title">🗺️ 無限深淵・世界大陸地圖</h2>
      </div>
      <div class="wm25-top-tools">
        <button type="button" id="wm25-zoom-in" class="wm25-tool-btn">＋ 放大</button>
        <button type="button" id="wm25-zoom-out" class="wm25-tool-btn">－ 縮小</button>
        <button type="button" id="wm25-reset" class="wm25-tool-btn">↺ 重置視角</button>
        <button type="button" id="wm25-close" class="wm25-tool-btn" style="border-color:#ef4444;color:#fca5a5;">✕ 關閉 (M)</button>
      </div>
    </div>

    <div id="wm25-viewport" class="wm25-viewport">
      <div id="wm25-stage" class="wm25-stage">
        <img class="wm25-bg-img" src="./assets/ui/worldmap_25d.jpg?v=222" alt="暗黑大陸地圖" draggable="false" />
        <div class="wm25-vignette"></div>
        <svg id="wm25-trail-svg" class="wm25-trail-svg" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
        <div id="wm25-pins-layer"></div>
      </div>
    </div>

    <div id="wm25-detail-card" class="wm25-detail-card hidden"></div>
    <div id="wm25-hint" class="wm25-hint">💡 點選大陸上的任一區域可拉近展開 10 個真實關卡地標｜滑鼠拖曳平移・滾輪縮放</div>
  `;
  document.body.appendChild(el);
  overlayEl = el;

  const vp = el.querySelector('#wm25-viewport');
  const stage = el.querySelector('#wm25-stage');

  const applyTransform = () => {
    stage.style.transform = `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${zoom})`;
  };
  el._applyTransform = applyTransform;

  // 拖曳平移
  let dragging = false;
  let sx = 0, sy = 0, spx = 0, spy = 0;
  vp.addEventListener('mousedown', (e) => {
    if (e.target.closest('button')) return;
    dragging = true;
    sx = e.clientX; sy = e.clientY;
    spx = panX; spy = panY;
    stage.classList.add('is-dragging');
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    panX = spx + (e.clientX - sx);
    panY = spy + (e.clientY - sy);
    applyTransform();
  });
  window.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove('is-dragging');
  });

  // 滾輪縮放
  vp.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    zoom = Math.max(1.0, Math.min(2.8, +(zoom + delta).toFixed(2)));
    if (zoom <= 1.02) { panX = 0; panY = 0; }
    applyTransform();
  }, { passive: false });

  el.querySelector('#wm25-zoom-in').onclick = () => { zoom = Math.min(2.8, +(zoom + 0.3).toFixed(2)); applyTransform(); };
  el.querySelector('#wm25-zoom-out').onclick = () => { zoom = Math.max(1.0, +(zoom - 0.3).toFixed(2)); if (zoom <= 1.02) { panX = 0; panY = 0; } applyTransform(); };
  el.querySelector('#wm25-reset').onclick = () => showOverview();
  el.querySelector('#wm25-back-btn').onclick = () => showOverview();
  el.querySelector('#wm25-close').onclick = () => closeWorldMap25D();

  return el;
}

function showOverview() {
  const el = buildOverlay();
  focusedCh = null;
  selectedStage = null;
  zoom = 1.0;
  panX = 0;
  panY = 0;
  el._applyTransform();

  el.querySelector('#wm25-back-btn').classList.add('hidden');
  el.querySelector('#wm25-title').textContent = '🗺️ 無限深淵・2.5D 世界大陸地圖';
  el.querySelector('#wm25-detail-card').classList.add('hidden');
  el.querySelector('#wm25-trail-svg').innerHTML = '';

  const st = window.__IDLE_ARPG_BRIDGE__?.getState?.() || { stage: 1, maxStageReached: 1 };
  const curCh = Math.floor((Math.max(1, st.stage || 1) - 1) / 10);
  const maxSt = st.maxStageReached || 1;

  const layer = el.querySelector('#wm25-pins-layer');
  layer.innerHTML = REGIONS_25D.map((r) => {
    const chCleared = Math.max(0, Math.min(10, maxSt - r.ch * 10));
    const isCur = r.ch === curCh;
    return `
      <button type="button" class="wm25-region-pin ${isCur ? 'is-current' : ''}" data-ch="${r.ch}" style="left:${r.x}%;top:${r.y}%;">
        <span class="wm25-rp-ch">第 ${r.ch + 1} 章・${r.lv}</span>
        <span class="wm25-rp-name">${isCur ? '📍 ' : ''}${r.name}</span>
        <span class="wm25-rp-sub">探索 ${chCleared}/10 ・ 點擊拉近選關</span>
      </button>
    `;
  }).join('');

  layer.querySelectorAll('.wm25-region-pin').forEach((btn) => {
    btn.addEventListener('click', () => focusRegion(Number(btn.dataset.ch)));
  });
}

function focusRegion(chIdx) {
  const el = buildOverlay();
  const r = REGIONS_25D[chIdx] || REGIONS_25D[0];
  focusedCh = chIdx;

  // 計算平滑拉近至該區域中心的偏移量
  const stageEl = el.querySelector('#wm25-stage');
  const sw = stageEl.clientWidth || window.innerWidth;
  const sh = stageEl.clientHeight || window.innerHeight;
  zoom = 2.15;
  panX = -((r.x - 50) / 100) * sw * zoom;
  panY = -((r.y - 50) / 100) * sh * zoom;
  // 限制邊界避免拉出黑邊過多
  const maxPanX = sw * (zoom - 1) * 0.52;
  const maxPanY = sh * (zoom - 1) * 0.52;
  panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
  panY = Math.max(-maxPanY, Math.min(maxPanY, panY));
  el._applyTransform();

  el.querySelector('#wm25-back-btn').classList.remove('hidden');
  el.querySelector('#wm25-title').textContent = `⚔️ 第 ${chIdx + 1} 章・${r.name}（10 大地形關卡）`;

  const st = window.__IDLE_ARPG_BRIDGE__?.getState?.() || { stage: 1 };
  const nodes = STAGE_OFFSETS.map(([dx, dy], i) => {
    const nx = Math.max(4, Math.min(96, r.x + dx));
    const ny = Math.max(8, Math.min(92, r.y + dy));
    return { sub: i + 1, stageNum: chIdx * 10 + i + 1, x: nx, y: ny };
  });

  // 繪製古道虛線連接 1~10 關
  const pathD = nodes.map((n, idx) => `${idx === 0 ? 'M' : 'L'} ${n.x} ${n.y}`).join(' ');
  el.querySelector('#wm25-trail-svg').innerHTML = `
    <path d="${pathD}" fill="none" stroke="rgba(0,0,0,0.75)" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${pathD}" fill="none" stroke="#fde047" stroke-width="0.42" stroke-dasharray="1.1 0.8" stroke-linecap="round" stroke-linejoin="round"/>
  `;

  // 主城星門節點放在區域左下側
  const townX = Math.max(5, Math.min(95, r.x - 5.2));
  const townY = Math.max(8, Math.min(92, r.y + 6.4));

  const layer = el.querySelector('#wm25-pins-layer');
  layer.innerHTML = `
    <button type="button" class="wm25-stage-node is-town" data-town="${chIdx}" style="left:${townX}%;top:${townY}%;">
      <span class="wm25-node-orb">🏰</span>
      <span class="wm25-node-lbl">${r.town}</span>
    </button>
    ${nodes.map((n) => {
      const isMini = n.sub === 5;
      const isBoss = n.sub === 10;
      const cls = isBoss ? 'is-boss' : (isMini ? 'is-miniboss' : '');
      const ico = isBoss ? '💀' : (isMini ? '🔥' : n.sub);
      const isCur = st.stage === n.stageNum;
      return `
        <button type="button" class="wm25-stage-node ${cls} ${isCur ? 'is-selected' : ''}" data-stage="${n.stageNum}" style="left:${n.x}%;top:${n.y}%;">
          <span class="wm25-node-orb">${ico}</span>
          <span class="wm25-node-lbl">${chIdx + 1}-${n.sub}${isBoss ? ' 首領' : (isMini ? ' 小王' : '')}</span>
        </button>
      `;
    }).join('')}
  `;

  layer.querySelector('[data-town]')?.addEventListener('click', () => {
    closeWorldMap25D();
    window.__IDLE_ARPG_BRIDGE__?.enterChapterTown?.(chIdx);
  });

  layer.querySelectorAll('[data-stage]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sNum = Number(btn.dataset.stage);
      layer.querySelectorAll('[data-stage]').forEach((b) => b.classList.toggle('is-selected', b === btn));
      renderStageDetail(r, sNum);
    });
  });

  // 預設顯示該章目前關卡或第 1 關詳情
  const defStage = (st.stage >= chIdx * 10 + 1 && st.stage <= chIdx * 10 + 10) ? st.stage : chIdx * 10 + 1;
  renderStageDetail(r, defStage);
}

function renderStageDetail(r, stageNum) {
  selectedStage = stageNum;
  const sub = ((stageNum - 1) % 10) + 1;
  const isBoss = sub === 10;
  const isMini = sub === 5;
  const card = overlayEl.querySelector('#wm25-detail-card');
  card.classList.remove('hidden');
  card.innerHTML = `
    <div class="wm25-dc-head">
      <span class="wm25-dc-badge">${isBoss ? '💀 章節最終首領' : (isMini ? '🔥 區域精英小王' : '⚔️ 前線巡邏關卡')}</span>
      <span style="font-size:12px;color:#94a3b8;font-weight:700;">${r.lv}</span>
    </div>
    <h3 class="wm25-dc-title">第 ${r.ch + 1}-${sub} 關・${r.name}</h3>
    <div class="wm25-dc-meta">
      <div>🎯 <b>區域掉落部位偏向</b>：${r.drop}</div>
      <div>✨ <b>區域強化詞條偏向</b>：${r.affix}</div>
      <div>🏰 <b>所屬主城安全區</b>：${r.town}</div>
    </div>
    <div class="wm25-dc-actions">
      <button type="button" id="wm25-btn-enter" class="wm25-enter-btn">⚔️ 傳送進入第 ${r.ch + 1}-${sub} 關</button>
      <button type="button" id="wm25-btn-town" class="wm25-town-btn">🏰 回本章主城</button>
    </div>
  `;
  card.querySelector('#wm25-btn-enter').onclick = () => {
    closeWorldMap25D();
    window.__IDLE_ARPG_BRIDGE__?.jumpStage?.(stageNum);
  };
  card.querySelector('#wm25-btn-town').onclick = () => {
    closeWorldMap25D();
    window.__IDLE_ARPG_BRIDGE__?.enterChapterTown?.(r.ch);
  };
}

export function openWorldMap25D() {
  const el = buildOverlay();
  el.classList.remove('hidden');
  showOverview();
}

export function closeWorldMap25D() {
  if (overlayEl) overlayEl.classList.add('hidden');
}

export function hookWorldMap25D(DashboardUI) {
  if (!DashboardUI?.prototype || DashboardUI.prototype._wm25Hooked) return;
  DashboardUI.prototype._wm25Hooked = true;
  DashboardUI.prototype.openWorldMapModal = function () {
    if (overlayEl && !overlayEl.classList.contains('hidden')) {
      closeWorldMap25D();
    } else {
      openWorldMap25D();
    }
  };
  // 攔截 Esc 關閉滿視窗地圖
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlayEl && !overlayEl.classList.contains('hidden')) {
      closeWorldMap25D();
    }
  });
}

export function isWorldMap25DOpen() {
  return !!(overlayEl && !overlayEl.classList.contains('hidden'));
}

export function toggleWorldMap25D() {
  if (isWorldMap25DOpen()) closeWorldMap25D();
  else openWorldMap25D();
}
