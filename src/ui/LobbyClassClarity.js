/**
 * LobbyClassClarity.js (v206)
 * 方向 B（各職業獨立練等）：優化歡迎大廳的職業等級標示，
 * 明確顯示「上次出戰職業與等級」及「6 大職業獨立儲存」提示，避免切換職業時誤以為等級跳掉。
 */

const CLASS_NAMES = {
  warrior: '狂戰士',
  ranger: '暗影遊俠',
  mage: '秘法師',
  paladin: '聖殿騎士',
  necro: '死靈法師',
  assassin: '影殺刺客',
};

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
  if (typeof document === 'undefined') return;

  const summaryEl = document.getElementById('welcome-save-summary');
  const classListEl = document.getElementById('welcome-class-list');

  const applySummaryFormat = () => {
    if (!summaryEl) return;
    const txt = (summaryEl.textContent || '').trim();
    if (!txt || txt.includes('上次出戰：')) return;
    const clsName = getSavedClassLabel();
    if (!clsName) return;
    // 將 "【暱稱】 Lv.21 • 第 1-1 關" 轉為 "【暱稱】上次出戰：秘法師 Lv.21 • 第 1-1 關"
    const updated = txt.replace(/(Lv\.\d+)/, `上次出戰：${clsName} $1`);
    if (updated !== txt) {
      summaryEl.textContent = updated;
    }
  };

  if (classListEl && !document.getElementById('lobby-class-indep-note')) {
    const note = document.createElement('div');
    note.id = 'lobby-class-indep-note';
    note.style.cssText = [
      'margin: 6px auto 2px;',
      'padding: 4px 12px;',
      'border-radius: 999px;',
      'font-size: 11.5px;',
      'color: #cbd5e1;',
      'background: rgba(15, 23, 42, 0.72);',
      'border: 1px solid rgba(251, 191, 36, 0.28);',
      'text-align: center;',
      'width: fit-content;',
    ].join('');
    note.textContent = '提示：6 大職業等級、裝備與技能各自獨立練等儲存，點選不同職業將載入該職業進度';
    classListEl.insertAdjacentElement('afterend', note);
  }

  applySummaryFormat();

  if (summaryEl && !summaryEl.dataset.clarityObserved) {
    summaryEl.dataset.clarityObserved = '1';
    const obs = new MutationObserver(() => applySummaryFormat());
    obs.observe(summaryEl, { childList: true, characterData: true, subtree: true });
  }
}
