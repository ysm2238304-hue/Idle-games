/**
 * SecondaryModalTheme.js (v102 - Batch 3)
 * 自動為商店 (#modal-shop)、成就塔 (#modal-ach-tower) 與輔助視窗套用當前章節主題皮膚，
 * 並同步載入 secondaryModals.css?v=102。
 */

const SECONDARY_MODAL_IDS = [
  'modal-shop',
  'modal-ach-tower',
  'modal-world-map',
  'modal-class',
  'modal-settings',
  'modal-stage-clear',
];

let initialized = false;
let currentChapter = 1;

function ensureSecondaryCss() {
  if (typeof document === 'undefined') return;
  const old = document.getElementById('sec-modal-v2-css');
  if (old) {
    if (!old.href.includes('v=102')) old.href = './src/ui/secondaryModals.css?v=102';
    return;
  }
  const link = document.createElement('link');
  link.id = 'sec-modal-v2-css';
  link.rel = 'stylesheet';
  link.href = './src/ui/secondaryModals.css?v=102';
  document.head.appendChild(link);
}

export function syncSecondaryModalChapter(chapter = 1) {
  currentChapter = Math.max(1, Math.min(10, Number(chapter) || 1));
  if (typeof document === 'undefined') return;
  SECONDARY_MODAL_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('sec-modal-v2');
    el.dataset.chapter = String(currentChapter);
  });
}

export function initSecondaryModalThemes(getChapterFn) {
  ensureSecondaryCss();
  if (typeof document === 'undefined') return;

  const resolveChapter = () => {
    if (typeof getChapterFn === 'function') {
      const ch = Number(getChapterFn());
      if (ch >= 1 && ch <= 10) return ch;
    }
    const townModal = document.getElementById('modal-town-facility');
    const townCh = Number(townModal?.dataset?.chapter);
    if (townCh >= 1 && townCh <= 10) return townCh;
    return currentChapter;
  };

  syncSecondaryModalChapter(resolveChapter());

  if (initialized) return;
  initialized = true;

  const observer = new MutationObserver(() => {
    syncSecondaryModalChapter(resolveChapter());
  });

  SECONDARY_MODAL_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      observer.observe(el, { attributes: true, attributeFilter: ['class'] });
    }
  });
}
