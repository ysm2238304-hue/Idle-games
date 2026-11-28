/**
 * ClassMechanicModal.js (v234)
 * 六大職業專屬機制互動設定介面（狂戰武器庫 / 遊俠三專精 / 法師雙附魔槽 / 聖騎三誓約 / 死靈亡者之書 / 刺客雙極調毒）
 */

import { CLASSES } from '../data/classes.js?v=319';
import { CLASS_MECHANIC_DEFS, getClassMechanicConfig } from '../logic/classMechanics.js?v=319';

export class ClassMechanicModal {
  constructor({ getState, onChanged }) {
    this.getState = getState;
    this.onChanged = onChanged || (() => {});
    this.el = null;
  }

  ensureEl() {
    if (this.el && document.body.contains(this.el)) return this.el;
    let el = document.getElementById('modal-class-mechanic');
    if (!el) {
      el = document.createElement('div');
      el.id = 'modal-class-mechanic';
      el.className = 'hidden';
      document.body.appendChild(el);
    }
    this.el = el;
    return el;
  }

  open() {
    const el = this.ensureEl();
    el.classList.remove('hidden');
    this.render();
  }

  close() {
    if (this.el) this.el.classList.add('hidden');
  }

  _savePatch(st, cid, patch) {
    if (!st.classMechanic) st.classMechanic = {};
    st.classMechanic[cid] = { ...(st.classMechanic[cid] || {}), ...patch };
    this.onChanged();
    this.render();
  }

  render() {
    const st = this.getState();
    if (!st) return;
    const el = this.ensureEl();
    const cid = st.classId || 'warrior';
    const cls = CLASSES[cid] || { name: cid, color: '#fde68a' };
    const def = CLASS_MECHANIC_DEFS[cid];
    if (!def) return;
    const cfg = getClassMechanicConfig(st, cid);

    let bodyHtml = '';

    if (def.type === 'single') {
      const cur = cfg[def.key];
      bodyHtml = `
        <div class="v234-opt-grid">
          ${def.options.map((o) => `
            <button type="button" class="v234-opt-card ${cur === o.id ? 'is-active' : ''}" data-pick-single="${o.id}">
              <div class="v234-opt-badge" style="color:${o.color};">${o.badge} ${cur === o.id ? '• 啟用中' : ''}</div>
              <div class="v234-opt-name">${o.name}</div>
              <div class="v234-opt-desc">${o.desc}</div>
            </button>
          `).join('')}
        </div>
      `;
    } else if (def.type === 'dual_enchant') {
      const slots = cfg.enchants || ['meteor', 'frost_nova'];
      const entries = Object.entries(def.enchants);
      bodyHtml = [0, 1].map((slotIdx) => `
        <div class="v234-group-box">
          <div class="v234-group-title">✨ 附魔槽 ${slotIdx === 0 ? 'I' : 'II'}（目前：${def.enchants[slots[slotIdx]]?.name || '未設定'}）</div>
          <div class="v234-opt-grid">
            ${entries.map(([k, info]) => {
              const isPicked = slots[slotIdx] === k;
              const inOther = slots[1 - slotIdx] === k;
              return `
                <button type="button" class="v234-opt-card ${isPicked ? 'is-active' : ''}" data-enchant-slot="${slotIdx}" data-enchant-key="${k}" ${inOther ? 'disabled style="opacity:0.45;"' : ''}>
                  <div class="v234-opt-name" style="color:${info.color};">${info.name} ${isPicked ? '✓' : (inOther ? '(已於另槽)' : '')}</div>
                  <div class="v234-opt-desc">${info.desc}</div>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `).join('');
    } else if (def.type === 'book_of_dead') {
      const bk = cfg.book || {};
      const allSac = bk.skeleton === 'sacrifice' && bk.mage === 'sacrifice' && bk.golem === 'sacrifice';
      bodyHtml = `
        ${allSac ? '<div class="v234-tyrant-banner">👑 已啟動隱藏終極被動【孤高死靈暴君】：獻祭全體亡靈，全技能最終傷害額外 ×1.25！</div>' : ''}
        ${def.groups.map((g) => `
          <div class="v234-group-box">
            <div class="v234-group-title">💀 ${g.label}</div>
            <div class="v234-opt-grid">
              ${g.choices.map((c) => `
                <button type="button" class="v234-opt-card ${bk[g.key] === c.id ? 'is-active' : ''}" data-book-group="${g.key}" data-book-val="${c.id}">
                  <div class="v234-opt-name">${c.name} ${bk[g.key] === c.id ? '✓' : ''}</div>
                  <div class="v234-opt-desc">${c.desc}</div>
                </button>
              `).join('')}
            </div>
          </div>
        `).join('')}
      `;
    } else if (def.type === 'dual_venom') {
      const vn = cfg.venom || {};
      bodyHtml = `
        <div class="v234-group-box">
          <div class="v234-group-title">🗡️ 主手毒藥塗層</div>
          <div class="v234-opt-grid">
            ${def.mainOptions.map((o) => `
              <button type="button" class="v234-opt-card ${vn.mainHand === o.id ? 'is-active' : ''}" data-venom-hand="mainHand" data-venom-val="${o.id}">
                <div class="v234-opt-name" style="color:${o.color};">${o.name} ${vn.mainHand === o.id ? '✓' : ''}</div>
                <div class="v234-opt-desc">${o.desc}</div>
              </button>
            `).join('')}
          </div>
        </div>
        <div class="v234-group-box">
          <div class="v234-group-title">🧪 副手毒藥塗層（與主手產生化合反應）</div>
          <div class="v234-opt-grid">
            ${def.offOptions.map((o) => `
              <button type="button" class="v234-opt-card ${vn.offHand === o.id ? 'is-active' : ''}" data-venom-hand="offHand" data-venom-val="${o.id}">
                <div class="v234-opt-name" style="color:${o.color};">${o.name} ${vn.offHand === o.id ? '✓' : ''}</div>
                <div class="v234-opt-desc">${o.desc}</div>
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    el.innerHTML = `
      <div class="v234-mech-window">
        <div class="v234-mech-header">
          <div>
            <div class="v234-mech-title" style="color:${cls.color || '#f3e8ff'};">⚔️ 【${cls.name}】${def.title}</div>
            <div class="v234-mech-sub">${def.subtitle}</div>
          </div>
          <button type="button" class="v233-spec-close" id="btn-close-class-mech">關閉 ✕</button>
        </div>
        <div class="v234-mech-body">${bodyHtml}</div>
      </div>
    `;

    el.querySelector('#btn-close-class-mech')?.addEventListener('click', () => this.close());
    el.addEventListener('click', (ev) => { if (ev.target === el) this.close(); }, { once: true });

    el.querySelectorAll('[data-pick-single]').forEach((b) => {
      b.addEventListener('click', () => this._savePatch(st, cid, { [def.key]: b.dataset.pickSingle }));
    });
    el.querySelectorAll('[data-enchant-slot]').forEach((b) => {
      b.addEventListener('click', () => {
        const sIdx = Number(b.dataset.enchantSlot);
        const next = [...(cfg.enchants || ['meteor', 'frost_nova'])];
        next[sIdx] = b.dataset.enchantKey;
        this._savePatch(st, cid, { enchants: next });
      });
    });
    el.querySelectorAll('[data-book-group]').forEach((b) => {
      b.addEventListener('click', () => {
        const next = { ...(cfg.book || {}), [b.dataset.bookGroup]: b.dataset.bookVal };
        this._savePatch(st, cid, { book: next });
      });
    });
    el.querySelectorAll('[data-venom-hand]').forEach((b) => {
      b.addEventListener('click', () => {
        const next = { ...(cfg.venom || {}), [b.dataset.venomHand]: b.dataset.venomVal };
        this._savePatch(st, cid, { venom: next });
      });
    });
  }
}
