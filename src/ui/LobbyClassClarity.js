/**
 * LobbyClassClarity.js (v211)
 * 1. 載入 classHall.css?v=211（去框化圖騰徽章＋16:9 舞台修正＋8 格遊戲快捷列）
 * 2. 移除會擠壓格線的 #lobby-class-indep-note
 * 3. 在左上角 #welcome-save-summary 明確標示「上次出戰：職業名 Lv.X」
 */

const CLASS_NAMES = {
  warrior: '狂戰士',
  ranger: '暗影遊俠',
  mage: '秘法師',
  paladin: '聖殿騎士',
  necro: '死靈法師',
  assassin: '影殺刺客',
};

function ensureClassHallCss() {
  if (typeof document === 'undefined') return;
  const old = document.getElementById('class-hall-v211-css');
  if (old) return;
  const link = document.createElement('link');
  link.id = 'class-hall-v211-css';
  link.rel = 'stylesheet';
  link.href = './src/ui/classHall.css?v=211';
  document.head.appendChild(link);
}

function getSavedClassLabel() {
  try {
    const raw = localStorage.getItem('desk_diablo_idle_save_v1');
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    const cid = parsed?.classId;
    return CLASS_NAMES[cid] || '';
  } catch {
    return '';
  }
}

export function initLobbyClassClarity() {
  ensureClassHallCss();
  if (typeof document === 'undefined') return;

  // 清除舊版插錯位置的提示條，確保不破壞格線佈局
  const oldNote = document.getElementById('lobby-class-indep-note');
  if (oldNote) oldNote.remove();

  const summaryEl = document.getElementById('welcome-save-summary');

  const applySummaryFormat = () => {
    if (!summaryEl) return;
    const txt = (summaryEl.textContent || '').trim();
    if (!txt || txt.includes('上次出戰：')) return;
    const clsName = getSavedClassLabel();
    if (!clsName) return;
    const updated = txt.replace(/(Lv\.\d+)/, `上次出戰：${clsName} $1`);
    if (updated !== txt) {
      summaryEl.textContent = updated;
    }
  };

  applySummaryFormat();

  if (summaryEl && !summaryEl.dataset.clarityObserved) {
    summaryEl.dataset.clarityObserved = '1';
    const obs = new MutationObserver(() => applySummaryFormat());
    obs.observe(summaryEl, { childList: true, characterData: true, subtree: true });
  }
}
