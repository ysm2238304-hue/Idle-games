/**
 * BattleStuckGuard.js (v214)
 * 修復剛進遊戲時因為 BattleScene 非同步 preload/create 晚於 enterTown 完成，
 * 導致「BattleScene 蓋在主城上方又被 setPaused(true) 卡死、顯示剩餘 0/0 角色不動」的時序 Bug。
 */

let guardInstalled = false;

export function initBattleStuckGuard() {
  if (guardInstalled || typeof window === 'undefined') return;
  guardInstalled = true;

  const hookPhaser = () => {
    const P = window.Phaser;
    if (!P || !P.Game || P.Game._v214Wrapped) return false;

    const OrigGame = P.Game;
    P.Game = function (...args) {
      const game = new OrigGame(...args);
      window.__idlePhaserGame = game;

      // 定期檢查前 6 秒的啟動時序衝突（僅在進遊戲初期執行 6 次）
      let checks = 0;
      const timer = setInterval(() => {
        checks++;
        if (checks > 12) {
          clearInterval(timer);
          return;
        }
        try {
          const townBtn = document.getElementById('btn-town-toggle');
          const inTown = !!townBtn?.classList?.contains('in-town');
          const bs = game.scene?.getScene?.('BattleScene');
          const ts = game.scene?.getScene?.('TownScene');

          if (inTown && ts && game.scene.isActive('TownScene')) {
            if (bs && game.scene.isActive('BattleScene')) {
              game.scene.sleep('BattleScene');
            }
            game.scene.bringToTop('TownScene');
          } else if (!inTown && bs && game.scene.isActive('BattleScene')) {
            // 若在戰鬥中卻意外被鎖在暫停且無任何彈窗，自動解開暫停
            const anyModalOpen = Array.from(document.querySelectorAll('.modal-overlay'))
              .some((m) => !m.classList.contains('hidden'));
            if (!anyModalOpen && bs.isPaused) {
              bs.setPaused?.(false);
            }
          }
        } catch { /* ignore */ }
      }, 450);

      return game;
    };
    P.Game.prototype = OrigGame.prototype;
    Object.setPrototypeOf(P.Game, OrigGame);
    P.Game._v214Wrapped = true;
    return true;
  };

  if (!hookPhaser()) {
    const waitPhaser = setInterval(() => {
      if (hookPhaser()) clearInterval(waitPhaser);
    }, 100);
    setTimeout(() => clearInterval(waitPhaser), 8000);
  }
}
