/**
 * SkillSpecModal.js (v233)
 * 暗黑 4 風格「4 階技能專精樹（Lv.2 / Lv.4 三選一 / Lv.6 屬性轉化 / Lv.8 幸運一擊）」＋「5 格快捷列配置」視窗
 */

import { WARRIOR_SKILLS } from '../data/warriorSkills.js?v=318';
import { RANGER_SKILLS } from '../data/rangerSkills.js?v=318';
import { MAGE_SKILLS } from '../data/mageSkills.js?v=318';
import { PALADIN_SKILLS } from '../data/paladinSkills.js?v=318';
import { NECRO_SKILLS } from '../data/necroSkills.js?v=318';
import { ASSASSIN_SKILLS } from '../data/assassinSkills.js?v=318';
import {
  SKILL_BUILD_SPECS,
  STATUS_META,
  COMPOUND_REACTIONS,
  getSkillSpecChoice,
  KEYSTONE_PASSIVES,
  getActiveKeystone,
} from '../logic/buildEngine.js?v=318';

const CLASS_SKILL_MAPS = {
  warrior: WARRIOR_SKILLS,
  ranger: RANGER_SKILLS,
  mage: MAGE_SKILLS,
  paladin: PALADIN_SKILLS,
  necro: NECRO_SKILLS,
  assassin: ASSASSIN_SKILLS,
};

const SLOT_LABELS = ['槽 1 [1 基礎]', '槽 2 [2 核心]', '槽 3 [3 防禦]', '槽 4 [4 控場]', '槽 5 [E 召喚]', '槽 6 [R 終極]'];

export class SkillSpecModal {
  constructor({ getState, onChanged }) {
    this.getState = getState;
    this.onChanged = onChanged || (() => {});
    this.selectedSkillId = null;
    this.el = null;
  }

  ensureEl() {
    if (this.el && document.body.contains(this.el)) return this.el;
    let el = document.getElementById('modal-skill-spec');
    if (!el) {
      el = document.createElement('div');
      el.id = 'modal-skill-spec';
      el.className = 'hidden';
      document.body.appendChild(el);
    }
    this.el = el;
    return el;
  }

  open(focusSkillId = null) {
    const st = this.getState();
    if (!st) return;
    const cid = st.classId || 'warrior';
    const map = CLASS_SKILL_MAPS[cid] || WARRIOR_SKILLS;
    const ids = Object.keys(map);
    this.selectedSkillId = (focusSkillId && map[focusSkillId]) ? focusSkillId : (this.selectedSkillId && map[this.selectedSkillId] ? this.selectedSkillId : ids[0]);
    const el = this.ensureEl();
    el.classList.remove('hidden');
    this.render();
  }

  close() {
    if (this.el) this.el.classList.add('hidden');
  }

  _getSkillLevel(st, sk) {
    const tree = st.skillTree || {};
    return Math.max(1, Number(tree[sk.treeNodeId] || 1));
  }

  _ensureEquipped5(st, cid) {
    if (!st.equippedSkillsByClass) st.equippedSkillsByClass = {};
    let arr = st.equippedSkillsByClass[cid];
    if (!Array.isArray(arr)) arr = [];
    while (arr.length < 6) arr.push(null);
    st.equippedSkillsByClass[cid] = arr.slice(0, 6);
    return st.equippedSkillsByClass[cid];
  }

  _setSpec(st, cid, skillId, patch) {
    if (!st.skillSpecs) st.skillSpecs = {};
    if (!st.skillSpecs[cid]) st.skillSpecs[cid] = {};
    const cur = getSkillSpecChoice(st, cid, skillId);
    st.skillSpecs[cid][skillId] = { ...cur, ...patch };
    this.onChanged();
    this.render();
  }

  render() {
    const st = this.getState();
    if (!st) return;
    const el = this.ensureEl();
    const cid = st.classId || 'warrior';
    const map = CLASS_SKILL_MAPS[cid] || WARRIOR_SKILLS;
    const skills = Object.values(map);
    const eq5 = this._ensureEquipped5(st, cid);
    const activeSk = map[this.selectedSkillId] || skills[0];
    this.selectedSkillId = activeSk.id;
    const spec = SKILL_BUILD_SPECS[activeSk.id];
    const lvl = this._getSkillLevel(st, activeSk);
    const choice = getSkillSpecChoice(st, cid, activeSk.id);

    const listHtml = skills.map((sk) => {
      const sp = SKILL_BUILD_SPECS[sk.id];
      const skLv = this._getSkillLevel(st, sk);
      const eqIdx = eq5.indexOf(sk.id);
      const tags = (sp?.tags || []).slice(0, 2).map((t) => `<span class="v233-tag">${t}</span>`).join('');
      const sts = (sp?.applies || []).map((k) => {
        const m = STATUS_META[k];
        return m ? `<span class="v233-tag is-status">${m.icon}${m.label}</span>` : '';
      }).join('');
      return `
        <button type="button" class="v233-sk-item ${sk.id === activeSk.id ? 'is-selected' : ''}" data-pick-sk="${sk.id}">
          <img src="${sk.icon}" alt="" />
          <div style="flex:1;min-width:0;">
            <div class="v233-sk-name">${sk.name} <span style="color:#fbbf24;font-size:11px;">Lv.${skLv}</span> ${eqIdx >= 0 ? `<span style="color:#4ade80;font-size:10px;">[槽${eqIdx + 1}]</span>` : ''}</div>
            <div class="v233-sk-tags">${tags}${sts}</div>
          </div>
        </button>
      `;
    }).join('');

    const slotBtns = SLOT_LABELS.map((lbl, idx) => {
      const isHere = eq5[idx] === activeSk.id;
      return `<button type="button" class="v233-slot-btn ${isHere ? 'is-active' : ''}" data-assign-slot="${idx}">${lbl}${isHere ? ' ✓' : ''}</button>`;
    }).join('');

    const reactHtml = COMPOUND_REACTIONS.map((r) => {
      const n1 = STATUS_META[r.need[0]];
      const n2 = STATUS_META[r.need[1]];
      return `<div><b style="color:${r.color};">${r.prefix}${r.name}</b>（${n1?.icon}${n1?.label}＋${n2?.icon}${n2?.label}）：<span style="color:#cbd5e1;">${r.desc}</span></div>`;
    }).join('');

    el.innerHTML = `
      <div class="v233-spec-window">
        <div class="v233-spec-header">
          <div>
            <div class="v233-spec-title">⚡ 暗黑深度構築・4 階技能專精樹 & 5 格連招配置</div>
            <div class="v233-spec-sub">點擊左側技能自由切換 Lv.2 質變 / Lv.4 三選一機制分歧 / Lv.6 屬性轉化 / Lv.8 幸運一擊觸發器（自動戰鬥會依狀態連攜智慧施放）</div>
          </div>
          <button type="button" class="v233-spec-close" id="btn-close-skill-spec">關閉 ✕</button>
        </div>
        <div class="v233-spec-body">
          <div class="v233-skill-list">${listHtml}</div>
          <div class="v233-spec-detail">
            <div style="display:flex;align-items:center;gap:12px;">
              <img src="${activeSk.icon}" style="width:54px;height:54px;border-radius:8px;border:2px solid #fbbf24;" alt="" />
              <div style="flex:1;">
                <div style="font-size:16px;font-weight:900;color:#fde68a;">${activeSk.name} <span style="font-size:12px;color:#4ade80;">目前等級 Lv.${lvl}</span></div>
                <div style="font-size:12px;color:#cbd5e1;margin-top:2px;">${activeSk.desc || ''}</div>
                <div style="font-size:11.5px;color:#93c5fd;margin-top:3px;">${activeSk.getDetail ? activeSk.getDetail(lvl) : ''}</div>
              </div>
            </div>

            <div class="v233-slot-assign-bar">
              <span style="font-size:12px;font-weight:800;color:#fde68a;">裝備至快捷列：</span>
              ${slotBtns}
            </div>

            ${(KEYSTONE_PASSIVES[cid] && KEYSTONE_PASSIVES[cid].length) ? (() => {
              const curKs = getActiveKeystone(st, cid);
              return `
                <div class="v233-tier-box" style="border-color:rgba(244,63,94,0.55);background:rgba(28,12,20,0.88);">
                  <div class="v233-tier-head">
                    <span class="v233-tier-title" style="color:#fda4af;">💎 終局關鍵被動（Keystone 4 選 1・決定核心流派）</span>
                    <span class="v233-tier-req is-ok">啟用中：${curKs?.name || ''}</span>
                  </div>
                  <div class="v233-node-grid">
                    ${KEYSTONE_PASSIVES[cid].map((ks) => `
                      <button type="button" class="v233-node-card ${curKs?.id === ks.id ? 'is-picked' : ''}" data-pick-ks="${ks.id}" style="display:flex;gap:8px;align-items:flex-start;">
                        <img src="${ks.icon}" style="width:40px;height:40px;border-radius:6px;border:1.5px solid ${ks.color};flex-shrink:0;" alt="" />
                        <div>
                          <div class="v233-node-name" style="color:${ks.color};">${ks.name} <small style="opacity:.8;">[${ks.badge}]</small> ${curKs?.id === ks.id ? '✓' : ''}</div>
                          <div class="v233-node-desc">${ks.desc}</div>
                        </div>
                      </button>
                    `).join('')}
                  </div>
                </div>
              `;
            })() : ''}

            ${spec ? `
              <div class="v233-tier-box ${lvl < 2 ? 'is-locked' : ''}">
                <div class="v233-tier-head">
                  <span class="v233-tier-title">第 1 階・Lv.2 基礎質變強化</span>
                  <span class="v233-tier-req ${lvl >= 2 ? 'is-ok' : ''}">${lvl >= 2 ? '✓ 已解鎖生效' : '需技能 Lv.2 解鎖（可於技能樹升級）'}</span>
                </div>
                <div class="v233-node-grid">
                  <div class="v233-node-card ${lvl >= 2 ? 'is-picked' : ''}">
                    <div class="v233-node-name">${spec.t2.name}</div>
                    <div class="v233-node-desc">${spec.t2.desc}</div>
                  </div>
                </div>
              </div>

              <div class="v233-tier-box ${lvl < 4 ? 'is-locked' : ''}">
                <div class="v233-tier-head">
                  <span class="v233-tier-title">第 2 階・Lv.4 機制分歧（3 選 1）</span>
                  <span class="v233-tier-req ${lvl >= 4 ? 'is-ok' : ''}">${lvl >= 4 ? '✓ 可自由切換分歧' : '需技能 Lv.4 解鎖'}</span>
                </div>
                <div class="v233-node-grid">
                  ${spec.t4.map((n) => `
                    <button type="button" class="v233-node-card ${choice.t4 === n.id && lvl >= 4 ? 'is-picked' : ''}" data-pick-t4="${n.id}" ${lvl < 4 ? 'disabled' : ''}>
                      <div class="v233-node-name">${n.name} ${choice.t4 === n.id ? '✓' : ''}</div>
                      <div class="v233-node-desc">${n.desc}</div>
                    </button>
                  `).join('')}
                </div>
              </div>

              <div class="v233-tier-box ${lvl < 6 ? 'is-locked' : ''}">
                <div class="v233-tier-head">
                  <span class="v233-tier-title">第 3 階・Lv.6 元素／屬性轉化（跨流派連攜）</span>
                  <span class="v233-tier-req ${lvl >= 6 ? 'is-ok' : ''}">${lvl >= 6 ? '✓ 可選轉化或維持原屬性' : '需技能 Lv.6 解鎖'}</span>
                </div>
                <div class="v233-node-grid">
                  <button type="button" class="v233-node-card ${!choice.t6 && lvl >= 6 ? 'is-picked' : ''}" data-pick-t6="" ${lvl < 6 ? 'disabled' : ''}>
                    <div class="v233-node-name">維持原屬性 ${!choice.t6 ? '✓' : ''}</div>
                    <div class="v233-node-desc">保留原始傷害類型與狀態標籤。</div>
                  </button>
                  ${spec.t6.map((n) => `
                    <button type="button" class="v233-node-card ${choice.t6 === n.id && lvl >= 6 ? 'is-picked' : ''}" data-pick-t6="${n.id}" ${lvl < 6 ? 'disabled' : ''}>
                      <div class="v233-node-name">${n.name} ${choice.t6 === n.id ? '✓' : ''}</div>
                      <div class="v233-node-desc">${n.desc}</div>
                    </button>
                  `).join('')}
                </div>
              </div>

              <div class="v233-tier-box ${lvl < 8 ? 'is-locked' : ''}">
                <div class="v233-tier-head">
                  <span class="v233-tier-title">第 4 階・Lv.8 幸運一擊觸發器（Lucky Hit）</span>
                  <span class="v233-tier-req ${lvl >= 8 ? 'is-ok' : ''}">${lvl >= 8 ? '✓ 已解鎖生效' : '需技能 Lv.8 解鎖'}</span>
                </div>
                <div class="v233-node-grid">
                  <div class="v233-node-card ${lvl >= 8 ? 'is-picked' : ''}">
                    <div class="v233-node-name">✦ ${spec.t8.name}</div>
                    <div class="v233-node-desc">${spec.t8.desc}</div>
                  </div>
                </div>
              </div>
            ` : ''}

            <div class="v233-react-legend">${reactHtml}</div>
          </div>
        </div>
      </div>
    `;

    el.querySelector('#btn-close-skill-spec')?.addEventListener('click', () => this.close());
    el.addEventListener('click', (ev) => {
      if (ev.target === el) this.close();
    }, { once: true });

    el.querySelectorAll('[data-pick-sk]').forEach((b) => {
      b.addEventListener('click', () => {
        this.selectedSkillId = b.dataset.pickSk;
        this.render();
      });
    });

    el.querySelectorAll('[data-assign-slot]').forEach((b) => {
      b.addEventListener('click', () => {
        const idx = Number(b.dataset.assignSlot);
        const arr = this._ensureEquipped5(st, cid);
        // 避免重複裝備同一招：若原本在別的槽位則對調
        const prev = arr.indexOf(activeSk.id);
        if (prev >= 0 && prev !== idx) {
          arr[prev] = arr[idx];
        }
        arr[idx] = activeSk.id;
        this.onChanged();
        this.render();
      });
    });

    el.querySelectorAll('[data-pick-t4]').forEach((b) => {
      b.addEventListener('click', () => this._setSpec(st, cid, activeSk.id, { t4: b.dataset.pickT4 }));
    });
    el.querySelectorAll('[data-pick-ks]').forEach((b) => {
      b.addEventListener('click', () => {
        if (!st.activeKeystone) st.activeKeystone = {};
        st.activeKeystone[cid] = b.dataset.pickKs;
        this.onChanged();
        this.render();
      });
    });
    el.querySelectorAll('[data-pick-t6]').forEach((b) => {
      b.addEventListener('click', () => this._setSpec(st, cid, activeSk.id, { t6: b.dataset.pickT6 || null }));
    });
  }
}
