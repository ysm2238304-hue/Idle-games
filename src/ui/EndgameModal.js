/**
 * EndgameModal.js (v237)
 * 雙分頁終局構築視窗：「📜 傳奇威能法典刻印」＋「♟️ Lv.50 深淵巔峰盤＆雕紋升級」
 */

import {
  ASPECT_CATALOG,
  IMPRINT_SLOTS,
  PARAGON_BOARD,
  PARAGON_GLYPHS,
  getTotalParagonPoints,
  getUnlockedParagonNodes,
  canUnlockParagonNode,
  getGlyphUpgradeCost,
} from '../logic/endgameSystems.js?v=317';
import { formatNum } from '../logic/statCalc.js?v=317';

export class EndgameModal {
  constructor({ getState, onChanged }) {
    this.getState = getState;
    this.onChanged = onChanged || (() => {});
    this.activeTab = 'codex';
    this.selectedImprintSlot = 0;
    this.selectedGlyphSocket = '3_0';
    this.el = null;
  }

  ensureEl() {
    if (this.el && document.body.contains(this.el)) return this.el;
    let el = document.getElementById('modal-endgame-hub');
    if (!el) {
      el = document.createElement('div');
      el.id = 'modal-endgame-hub';
      el.className = 'hidden';
      document.body.appendChild(el);
    }
    this.el = el;
    return el;
  }

  open(tab = null) {
    if (tab) this.activeTab = tab;
    const el = this.ensureEl();
    el.classList.remove('hidden');
    this.render();
  }

  close() {
    if (this.el) this.el.classList.add('hidden');
  }

  render() {
    const st = this.getState();
    if (!st) return;
    const el = this.ensureEl();
    const cid = st.classId || 'warrior';
    const unlockedCodex = new Set(Array.isArray(st.codexUnlocked) ? st.codexUnlocked : ['asp_edgemaster', 'asp_disobedience']);
    if (!st.imprintedAspects) st.imprintedAspects = {};
    if (!Array.isArray(st.imprintedAspects[cid])) st.imprintedAspects[cid] = ['asp_edgemaster', null, null];
    const imprints = st.imprintedAspects[cid];

    const totalPts = getTotalParagonPoints(st.level || 1);
    const unlockedNodes = getUnlockedParagonNodes(st);
    const spentPts = Math.max(0, unlockedNodes.size - 1);
    const remPts = Math.max(0, totalPts - spentPts);

    let contentHtml = '';
    if (this.activeTab === 'codex') {
      const availAspects = ASPECT_CATALOG.filter((a) => a.cls === 'all' || a.cls === cid);
      contentHtml = `
        <div style="font-size:12px;color:#cbd5e1;margin-bottom:10px;">
          選擇上方刻印槽位（武器 1.5x / 護符 1.25x / 戒指 1.0x），再點擊下方已解鎖威能直接刻印；尚未解鎖的威能可消耗金幣與奧術粉塵萃取收錄！
        </div>
        <div class="v237-slot-row">
          ${IMPRINT_SLOTS.map((sl) => {
            const aid = imprints[sl.idx];
            const asp = ASPECT_CATALOG.find((x) => x.id === aid);
            return `
              <button type="button" class="v237-imprint-slot ${this.selectedImprintSlot === sl.idx ? 'is-selected' : ''}" data-sel-islot="${sl.idx}">
                <div style="font-size:11px;color:#fde047;font-weight:800;">${sl.label}（${sl.desc}）</div>
                <div style="font-size:14px;font-weight:900;color:${asp ? asp.color : '#64748b'};margin-top:4px;">${asp ? asp.name : '尚未刻印威能'}</div>
                <div style="font-size:11px;color:#cbd5e1;margin-top:3px;">${asp ? asp.desc : '點擊此槽後從下方挑選威能刻印'}</div>
              </button>
            `;
          }).join('')}
        </div>
        <div class="v237-aspect-grid">
          ${availAspects.map((a) => {
            const isUnl = unlockedCodex.has(a.id);
            const eqIdx = imprints.indexOf(a.id);
            const canBuy = (st.gold || 0) >= a.goldCost && (st.dust || 0) >= a.dustCost;
            return `
              <div class="v237-aspect-card ${isUnl ? 'is-unlocked' : ''}">
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <b style="color:${a.color};font-size:13.5px;">${a.name}</b>
                    <span style="font-size:10px;padding:1px 6px;border-radius:4px;background:rgba(255,255,255,0.08);color:#fde68a;">${a.cls === 'all' ? '全職業' : '本職專屬'}</span>
                  </div>
                  <div style="font-size:11.5px;color:#cbd5e1;margin-top:4px;line-height:1.45;">${a.desc}</div>
                </div>
                <div style="display:flex;justify-content:flex-end;gap:6px;">
                  ${isUnl
                    ? `<button type="button" class="v233-slot-btn ${eqIdx >= 0 ? 'is-active' : ''}" data-imprint-asp="${a.id}">${eqIdx >= 0 ? `已刻印於槽 ${eqIdx + 1}` : `刻印至槽 ${this.selectedImprintSlot + 1}`}</button>`
                    : `<button type="button" class="v233-slot-btn" data-unlock-asp="${a.id}" ${canBuy ? '' : 'disabled style="opacity:0.45;"'}>萃取解鎖（${formatNum(a.goldCost)}G + ${a.dustCost}粉）</button>`}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else {
      const glyphSlots = st.paragonGlyphs || {};
      const glyphLevels = st.glyphLevels || {};
      const glyphXp = st.glyphXp || 0;
      const cells = [];
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const id = `${r}_${c}`;
          const nd = PARAGON_BOARD[id];
          const isLit = unlockedNodes.has(id);
          const isAvail = canUnlockParagonNode(st, id);
          const shortIcon = nd.type === 'start' ? '★起點' : (nd.type === 'legendary' ? '👑傳奇' : (nd.type === 'glyph' ? '💎雕紋' : (nd.type === 'rare' ? '◆稀有' : (nd.type === 'magic' ? '◇魔法' : '•'))));
          cells.push(`
            <button type="button" class="v237-pnode type-${nd.type} ${isLit ? 'is-lit' : ''} ${isAvail ? 'is-avail' : ''}" data-pnode="${id}" title="${nd.name}（${Object.entries(nd.stats).map(([k, v]) => `${k}+${v}`).join(' / ') || '雕紋插槽'}）">
              <span>${shortIcon}</span>
            </button>
          `);
        }
      }
      contentHtml = `
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
          <div style="font-size:12.5px;">
            <b style="color:#fde047;">目前等級 Lv.${st.level || 1}</b> ｜
            剩餘巔峰點數：<b style="color:#4ade80;font-size:15px;">${remPts}</b> / ${totalPts}
            ${(st.level || 1) < 50 ? '<span style="color:#fca5a5;">（達 Lv.50 起每級獲得 +4 巔峰點數，現可提前規劃路線）</span>' : ''}
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <span style="font-size:12px;color:#c084fc;">💎 雕紋經驗庫存：<b>${formatNum(glyphXp)}</b>（擊殺菁英與首領獲得）</span>
            <button type="button" class="v233-slot-btn" id="btn-reset-paragon">免費重置棋盤</button>
          </div>
        </div>
        <div class="v237-paragon-layout">
          <div class="v237-board-grid">${cells.join('')}</div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div style="font-size:13px;font-weight:900;color:#c084fc;">💎 雕紋插槽管理（點亮棋盤左右兩側【雕紋插槽】後生效）</div>
            <div style="display:flex;gap:8px;">
              ${['3_0', '3_6'].map((sid, i) => {
                const lit = unlockedNodes.has(sid);
                const curG = PARAGON_GLYPHS.find((x) => x.id === glyphSlots[sid]);
                return `<button type="button" class="v233-slot-btn ${this.selectedGlyphSocket === sid ? 'is-active' : ''}" data-sel-gsock="${sid}">插槽 ${i + 1}（${lit ? (curG ? curG.name : '空槽') : '未點亮'}）</button>`;
              }).join('')}
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${PARAGON_GLYPHS.map((g) => {
                const lv = Math.max(1, Number(glyphLevels[g.id] || 1));
                const cost = getGlyphUpgradeCost(lv);
                const isEq = glyphSlots[this.selectedGlyphSocket] === g.id;
                const canUpg = lv < 21 && glyphXp >= cost;
                return `
                  <div class="v237-aspect-card ${isEq ? 'is-unlocked' : ''}">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                      <b style="color:${g.color};">${g.name} <span style="color:#fde047;">Lv.${lv}/21</span></b>
                      <div style="display:flex;gap:6px;">
                        <button type="button" class="v233-slot-btn ${isEq ? 'is-active' : ''}" data-eq-glyph="${g.id}">${isEq ? '已鑲嵌 ✓' : '鑲嵌'}</button>
                        <button type="button" class="v233-slot-btn" data-upg-glyph="${g.id}" ${canUpg ? '' : 'disabled style="opacity:0.45;"'}>${lv >= 21 ? '已滿級' : `升級 (${formatNum(cost)} XP)`}</button>
                      </div>
                    </div>
                    <div style="font-size:11px;color:#cbd5e1;">${g.desc}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    }

    el.innerHTML = `
      <div class="v237-win">
        <div class="v237-head">
          <div>
            <div style="font-size:17px;font-weight:900;color:#fde68a;">👑 終局神話構築・傳奇威能法典 & Lv.50 深淵巔峰盤</div>
            <div style="font-size:11.5px;color:#cbd5e1;margin-top:2px;">千小時終局乘算系統：3 槽威能倍率刻印 ＋ 7×7 棋盤相鄰連線 ＋ Lv.21 雕紋範圍共鳴</div>
          </div>
          <button type="button" class="v233-spec-close" id="btn-close-endgame">關閉 ✕</button>
        </div>
        <div class="v237-tabs">
          <button type="button" class="v237-tab ${this.activeTab === 'codex' ? 'is-active' : ''}" data-eg-tab="codex">📜 傳奇威能法典（3 槽刻印）</button>
          <button type="button" class="v237-tab ${this.activeTab === 'paragon' ? 'is-active' : ''}" data-eg-tab="paragon">♟️ 深淵巔峰盤＆雕紋（剩餘 ${remPts} 點）</button>
        </div>
        <div class="v237-body">${contentHtml}</div>
      </div>
    `;

    el.querySelector('#btn-close-endgame')?.addEventListener('click', () => this.close());
    el.addEventListener('click', (ev) => { if (ev.target === el) this.close(); }, { once: true });

    el.querySelectorAll('[data-eg-tab]').forEach((b) => {
      b.addEventListener('click', () => { this.activeTab = b.dataset.egTab; this.render(); });
    });
    el.querySelectorAll('[data-sel-islot]').forEach((b) => {
      b.addEventListener('click', () => { this.selectedImprintSlot = Number(b.dataset.selIslot); this.render(); });
    });
    el.querySelectorAll('[data-unlock-asp]').forEach((b) => {
      b.addEventListener('click', () => {
        const asp = ASPECT_CATALOG.find((x) => x.id === b.dataset.unlockAsp);
        if (!asp || (st.gold || 0) < asp.goldCost || (st.dust || 0) < asp.dustCost) return;
        st.gold -= asp.goldCost;
        st.dust -= asp.dustCost;
        if (!Array.isArray(st.codexUnlocked)) st.codexUnlocked = ['asp_edgemaster', 'asp_disobedience'];
        if (!st.codexUnlocked.includes(asp.id)) st.codexUnlocked.push(asp.id);
        this.onChanged();
        this.render();
      });
    });
    el.querySelectorAll('[data-imprint-asp]').forEach((b) => {
      b.addEventListener('click', () => {
        const aid = b.dataset.imprintAsp;
        const prev = imprints.indexOf(aid);
        if (prev >= 0 && prev !== this.selectedImprintSlot) imprints[prev] = imprints[this.selectedImprintSlot];
        imprints[this.selectedImprintSlot] = aid;
        this.onChanged();
        this.render();
      });
    });
    el.querySelectorAll('[data-pnode]').forEach((b) => {
      b.addEventListener('click', () => {
        const nid = b.dataset.pnode;
        if (!canUnlockParagonNode(st, nid)) return;
        if (!Array.isArray(st.paragonNodes)) st.paragonNodes = [];
        if (!st.paragonNodes.includes(nid)) st.paragonNodes.push(nid);
        this.onChanged();
        this.render();
      });
    });
    el.querySelector('#btn-reset-paragon')?.addEventListener('click', () => {
      st.paragonNodes = [];
      this.onChanged();
      this.render();
    });
    el.querySelectorAll('[data-sel-gsock]').forEach((b) => {
      b.addEventListener('click', () => { this.selectedGlyphSocket = b.dataset.selGsock; this.render(); });
    });
    el.querySelectorAll('[data-eq-glyph]').forEach((b) => {
      b.addEventListener('click', () => {
        if (!st.paragonGlyphs) st.paragonGlyphs = {};
        st.paragonGlyphs[this.selectedGlyphSocket] = b.dataset.eqGlyph;
        this.onChanged();
        this.render();
      });
    });
    el.querySelectorAll('[data-upg-glyph]').forEach((b) => {
      b.addEventListener('click', () => {
        const gid = b.dataset.upgGlyph;
        if (!st.glyphLevels) st.glyphLevels = {};
        const lv = Math.max(1, Number(st.glyphLevels[gid] || 1));
        const cost = getGlyphUpgradeCost(lv);
        if (lv >= 21 || (st.glyphXp || 0) < cost) return;
        st.glyphXp -= cost;
        st.glyphLevels[gid] = lv + 1;
        this.onChanged();
        this.render();
      });
    });
  }
}
