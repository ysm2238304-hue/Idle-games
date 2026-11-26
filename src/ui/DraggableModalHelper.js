// DraggableModalHelper.js — v291 全系統彈窗與抽屜通用拖曳引擎
// 支援：角色與裝備抽屜 (#rpg-drawer)、NPC 設施彈窗、設定、商店、成就塔、世界地圖、職業、關卡與離線彈窗
// 特性：點擊標題列自由拖曳、視窗邊界安全鉗制、點擊自動置頂、自動忽略關閉／分頁／輸入按鈕

const TARGET_SELECTORS = [
  '#rpg-drawer',
  '#modal-town-facility .town-modal-card',
  '#modal-town-facility .modal-card',
  '#modal-settings .modal-card',
  '#modal-shop .modal-card',
  '#modal-ach-tower .modal-card',
  '#modal-world-map .worldmap-25d-card',
  '#modal-world-map .modal-card',
  '#modal-stage-clear .modal-card',
  '#modal-class .modal-card',
  '#modal-offline .modal-card',
  '.modal-overlay .modal-card',
  '.npc-modal-backdrop .npc-modal-window',
];

const HEADER_SELECTORS = [
  '.drawer-header',
  '.drawer-head',
  '.modal-header',
  '.town-modal-header',
  '.npc-modal-head',
  '.worldmap-header',
  '.wm25d-header',
  '[data-drag-handle]',
];

let topZ = 240;

function findHandle(panel) {
  for (const sel of HEADER_SELECTORS) {
    const el = panel.querySelector(sel);
    if (el) return el;
  }
  return panel.firstElementChild || panel;
}

function attachDrag(panel) {
  if (!panel || panel.dataset.v291Draggable === '1') return;
  const handle = findHandle(panel);
  if (!handle) return;

  panel.dataset.v291Draggable = '1';
  handle.style.cursor = 'grab';
  handle.style.userSelect = 'none';
  handle.title = handle.title || '按住標題列可自由拖曳移動視窗';

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let origLeft = 0;
  let origTop = 0;

  const bringToFront = () => {
    topZ += 1;
    const parentOverlay = panel.closest('.modal-overlay, .npc-modal-backdrop');
    if (parentOverlay) {
      parentOverlay.style.zIndex = String(topZ);
    } else {
      panel.style.zIndex = String(topZ);
    }
  };

  panel.addEventListener('pointerdown', bringToFront, { passive: true });

  handle.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    // 忽略關閉鈕、一般按鈕、輸入框與分頁標籤
    if (e.target.closest('button, a, input, select, textarea, [role="tab"], .btn-close')) return;

    bringToFront();
    const rect = panel.getBoundingClientRect();
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    origLeft = rect.left;
    origTop = rect.top;

    // 轉為 fixed 絕對座標，清除右側/置中約束以利自由移動
    panel.style.position = 'fixed';
    panel.style.left = `${origLeft}px`;
    panel.style.top = `${origTop}px`;
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    panel.style.margin = '0';
    panel.style.transform = 'none';
    handle.style.cursor = 'grabbing';
    handle.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  });

  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const vw = window.innerWidth || 1280;
    const vh = window.innerHeight || 720;
    const w = panel.offsetWidth || 360;
    const h = panel.offsetHeight || 240;

    // 保留至少 60px 在視窗內避免拖到螢幕外找不回來
    const nx = Math.max(-w + 80, Math.min(vw - 80, origLeft + dx));
    const ny = Math.max(4, Math.min(vh - Math.min(64, h), origTop + dy));
    panel.style.left = `${nx}px`;
    panel.style.top = `${ny}px`;
  });

  const stopDrag = () => {
    if (!dragging) return;
    dragging = false;
    handle.style.cursor = 'grab';
  };
  window.addEventListener('pointerup', stopDrag);
  window.addEventListener('pointercancel', stopDrag);
}

export function initAllDraggableModals() {
  if (typeof document === 'undefined') return;
  const scan = () => {
    for (const sel of TARGET_SELECTORS) {
      document.querySelectorAll(sel).forEach(attachDrag);
    }
    // 同步維護 body.modal-open 讓常駐任務追蹤與小地圖在彈窗開啟時自動讓位
    const anyOpen = !!document.querySelector(
      '#rpg-drawer:not(.hidden), .modal-overlay:not(.hidden), .npc-modal-backdrop:not(.hidden)'
    );
    document.body.classList.toggle('v291-modal-open', anyOpen);
  };

  scan();
  const obs = new MutationObserver(() => scan());
  obs.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style'],
  });
}
