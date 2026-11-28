/**
 * BagFixEnhancer.js (v213)
 * 修復戰利品背包「分解所選 [Q]」與「出售(2.5x金)」的 2 個 Bug：
 * 1. 補上「套裝 (#auto-salvage-set)」的勾選處理
 * 2. 若背包無符合裝備或全數被保險箱規則鎖定，明確跳出系統提示，不再靜默無反應
 */

import { getSalvageReward } from '../logic/lootGen.js?v=319';

function isProtectedItem(item, st) {
  if (!item) return true;
  const rules = st?.vaultRules || {};
  if (rules.keepClassReq && item.classReq && item.classReq === st.classId) return true;
  if (rules.keepDoubleCrit) {
    const keys = new Set((item.affixes || []).map((a) => a.key));
    if (keys.has('critRate') && keys.has('critDmg')) return true;
  }
  return false;
}

export function initBagSalvageFix(DashboardUI) {
  if (!DashboardUI?.prototype || DashboardUI.prototype._v213BagPatched) return;
  DashboardUI.prototype._v213BagPatched = true;

  const origRenderBag = DashboardUI.prototype.renderBag;
  if (typeof origRenderBag === 'function') {
    DashboardUI.prototype.renderBag = function (...args) {
      if (!this._v213HandlersWrapped && this.handlers) {
        this._v213HandlersWrapped = true;
        const origSalvage = this.handlers.onSalvageAllJunk;
        const origSell = this.handlers.onSellSelectedJunk;

        const processSetAndNotify = (mode) => {
          const st = this.getState?.();
          if (!st || !Array.isArray(st.inventory)) return;
          const setChecked = !!document.getElementById('auto-salvage-set')?.checked;
          let handledSet = 0;
          let gainGold = 0;
          let gainDust = 0;

          if (setChecked) {
            const remain = [];
            for (const it of st.inventory) {
              if (it?.rarity === 'set' && !isProtectedItem(it, st)) {
                const rew = getSalvageReward(it);
                if (mode === 'sell') {
                  gainGold += Math.round(rew.gold * 2.5 + rew.dust * 8);
                } else {
                  gainGold += rew.gold;
                  gainDust += rew.dust;
                }
                handledSet++;
              } else {
                remain.push(it);
              }
            }
            if (handledSet > 0) {
              st.inventory = remain;
              st.gold = (Number(st.gold) || 0) + gainGold;
              st.dust = (Number(st.dust) || 0) + gainDust;
              this.addLog?.(
                mode === 'sell'
                  ? `已出售 ${handledSet} 件套裝，獲得 ${gainGold.toLocaleString()} 金幣！`
                  : `已分解 ${handledSet} 件套裝，獲得 ${gainGold.toLocaleString()} 金幣與 ${gainDust.toLocaleString()} 粉塵！`,
                'loot'
              );
              this.renderAllPanels?.(st, this.handlers.getComputedStats?.());
              this.updateTopBar?.(st, this.handlers.getComputedStats?.());
            }
          }
          return handledSet;
        };

        if (typeof origSalvage === 'function') {
          this.handlers.onSalvageAllJunk = (...a) => {
            const st = this.getState?.();
            const beforeLen = st?.inventory?.length || 0;
            origSalvage(...a);
            const setDone = processSetAndNotify('salvage');
            const afterLen = st?.inventory?.length || 0;
            if (beforeLen === afterLen && !setDone) {
              this.addLog?.('目前背包沒有符合勾選品質的可分解裝備（或已受保險箱規則保護）。', 'sys');
            }
          };
        }

        if (typeof origSell === 'function') {
          this.handlers.onSellSelectedJunk = (...a) => {
            const st = this.getState?.();
            const beforeLen = st?.inventory?.length || 0;
            origSell(...a);
            const setDone = processSetAndNotify('sell');
            const afterLen = st?.inventory?.length || 0;
            if (beforeLen === afterLen && !setDone) {
              this.addLog?.('目前背包沒有符合勾選品質的可出售裝備（或已受保險箱規則保護）。', 'sys');
            }
          };
        }
      }
      return origRenderBag.apply(this, args);
    };
  }
}
