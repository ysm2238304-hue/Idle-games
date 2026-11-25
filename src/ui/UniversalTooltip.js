/**
 * UniversalTooltip.js (v232)
 * 全域暗黑奇幻懸停詳情引擎：
 * 1. 裝備雙欄並排比較（目標裝備 vs 目前穿戴中同部位裝備 + 屬性增減彙整）
 * 2. 寵物詳情與現有出戰寵物對比
 * 3. 技能詳情（冷卻、魔耗、目前與下一級倍率）
 * 4. 藥水 / 消耗品 / BUFF / 貨幣與素材詳情
 * 5. 經驗條懸停即時顯示 EXP/hr 與預估升級剩餘時間
 */

import { RARITIES, EQUIP_SLOTS, BASE_ITEMS, SET_DEFINITIONS } from '../data/items.js?v=240';
import { getPetDef, getPetRarityMeta, PET_SCHOOLS } from '../data/pets.js?v=99';
import { calcItemPower } from '../logic/lootGen.js?v=240';
import { getExpToNext, formatNum } from '../logic/statCalc.js?v=240';
import { SKILL_BUILD_SPECS, STATUS_META, getSkillSpecChoice } from '../logic/buildEngine.js?v=236';

const STAT_LABELS = {
  atk: '攻擊力',
  maxHp: '生命上限',
  armor: '護甲值',
  critRate: '暴擊率',
  critDmg: '暴擊傷害',
  atkSpeedPct: '攻擊速度',
  lifesteal: '攻擊吸血',
  dodge: '閃避率',
  goldFind: '金幣掉落',
  magicFind: '掉寶率',
  moveSpeed: '移動速度',
  skillDmgPct: '技能傷害',
  cooldownPct: '冷卻縮減',
  maxMp: '魔力上限',
  mpRegen: '回魔速度',
  expMultPct: '經驗加成',
};

const PCT_KEYS = new Set([
  'critRate', 'critDmg', 'atkSpeedPct', 'lifesteal', 'dodge',
  'goldFind', 'magicFind', 'skillDmgPct', 'cooldownPct', 'expMultPct',
]);

const CLASS_REQ_LABELS = {
  all: { label: '全職業通用', color: '#cbd5e1' },
  warrior: { label: '狂戰士專屬', color: '#f87171' },
  ranger: { label: '暗影遊俠專屬', color: '#4ade80' },
  mage: { label: '奧術法師專屬', color: '#60a5fa' },
  paladin: { label: '聖殿騎士專屬', color: '#fde047' },
  necro: { label: '死靈法師專屬', color: '#c084fc' },
  assassin: { label: '影舞刺客專屬', color: '#fb7185' },
};

const MATERIAL_DOCS = {
  gold: {
    title: '深淵金幣',
    subtitle: '基礎流通貨幣',
    emoji: '💰',
    color: '#fbbf24',
    desc: '暗黑大陸通用的交易貨幣，用於鐵匠強化裝備、煉金釀造藥水、黑市採購、酒館盛宴與學習職業技能。',
    sources: '擊殺怪物、關卡結算、分解裝備、懸賞委託、章節補給禮盒。',
  },
  dust: {
    title: '奧術強化粉塵',
    subtitle: '裝備鍛造與寵物進階核心素材',
    emoji: '✨',
    color: '#c084fc',
    desc: '分解多餘裝備後淬鍊出的魔力微粒，是提升裝備強化等級（+1～+15）、重鑄詞綴與進階寵物的關鍵材料。',
    sources: '自動／手動分解裝備、懸賞委託獎勵、黑市補給、章節禮盒。',
  },
  crystals: {
    title: '靈魂結晶',
    subtitle: '高階聖殿與轉生稀有結晶',
    emoji: '💎',
    color: '#38bdf8',
    desc: '凝聚深淵首領殘魂的稀世結晶，可用於靈魂聖殿點亮永久星陣光環、轉生升階與召喚高階魔寵。',
    sources: '轉生結算、章節首領首殺、懸賞高階任務、成就塔里程碑。',
  },
};

export function resolveItemIconUniversal(item) {
  if (!item) return './assets/items/weapon_0.png';
  if (item.icon) return item.icon;
  const list = BASE_ITEMS[item.slot] || [];
  const matched = list.find((b) => item.name && item.name.includes(b.name));
  if (matched) return matched.icon;
  return `./assets/items/${item.slot || 'weapon'}_0.png`;
}

function collectItemStatMap(item) {
  const map = {};
  if (!item) return map;
  const upgMult = 1 + (item.upgradeLevel || 0) * 0.12;
  if (item.baseStat && item.baseStat.key) {
    map[item.baseStat.key] = (map[item.baseStat.key] || 0) + Math.round(item.baseStat.value * upgMult);
  }
  for (const af of item.affixes || []) {
    map[af.key] = (map[af.key] || 0) + Math.round(af.value * upgMult * 10) / 10;
  }
  return map;
}

function formatDuration(sec) {
  if (!isFinite(sec) || sec <= 0) return '計算中...';
  if (sec < 60) return `${Math.ceil(sec)} 秒`;
  const mins = Math.floor(sec / 60);
  if (mins < 60) return `${mins} 分 ${Math.floor(sec % 60)} 秒`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs} 小時 ${mins % 60} 分`;
  const days = Math.floor(hrs / 24);
  return `${days} 天 ${hrs % 24} 小時`;
}

class UniversalTooltipEngine {
  constructor() {
    this.el = null;
    this.getStateFn = () => window.__IDLE_ARPG_BRIDGE__?.getState?.() || null;
    this._inited = false;
  }

  ensureEl() {
    if (this.el && document.body.contains(this.el)) return this.el;
    let el = document.getElementById('universal-tooltip');
    if (!el) {
      el = document.createElement('div');
      el.id = 'universal-tooltip';
      el.className = 'hidden';
      document.body.appendChild(el);
    }
    this.el = el;
    return el;
  }

  init(getStateFn) {
    if (typeof getStateFn === 'function') this.getStateFn = getStateFn;
    this.ensureEl();
    if (this._inited) return;
    this._inited = true;

    // 委派監聽：資源欄、經驗條、以及所有帶 data-ut-type / data-tip 的元素
    document.addEventListener('mouseover', (e) => {
      const target = e.target?.closest?.('[data-ut-type], .res-pill-sm, #diablo-exp-bar, .npc-res-chip');
      if (!target) return;
      const st = this.getStateFn();

      if (target.id === 'diablo-exp-bar') {
        this.showExpBar(e, st);
        return;
      }

      if (target.classList.contains('res-pill-sm') || target.classList.contains('npc-res-chip')) {
        let matKey = target.dataset.utKey || '';
        if (!matKey) {
          if (target.querySelector('#hud-gold') || target.textContent.includes('💰') || (target.title || '').includes('金幣')) matKey = 'gold';
          else if (target.querySelector('#hud-dust') || target.textContent.includes('💎') || target.textContent.includes('粉') || (target.title || '').includes('粉塵')) matKey = 'dust';
          else if (target.querySelector('#hud-crystals') || target.textContent.includes('🔮') || target.textContent.includes('晶') || (target.title || '').includes('魂晶')) matKey = 'crystals';
        }
        if (matKey && MATERIAL_DOCS[matKey]) {
          this.showMaterial(e, matKey, st);
        }
        return;
      }

      const utType = target.dataset.utType;
      if (utType === 'material' && target.dataset.utKey) {
        this.showMaterial(e, target.dataset.utKey, st);
      } else if (utType === 'rich') {
        this.showRich(e, {
          title: target.dataset.utTitle || '',
          subtitle: target.dataset.utSub || '',
          emoji: target.dataset.utEmoji || '📜',
          color: target.dataset.utColor || '#fde68a',
          lines: (target.dataset.utLines || '').split('|').filter(Boolean),
          footer: target.dataset.utFooter || '',
        });
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (this.el && !this.el.classList.contains('hidden')) {
        this.move(e);
      }
    });

    document.addEventListener('mouseout', (e) => {
      const target = e.target?.closest?.('[data-ut-type], .res-pill-sm, #diablo-exp-bar, .npc-res-chip');
      if (target && (!e.relatedTarget || !target.contains(e.relatedTarget))) {
        this.hide();
      }
    });
  }

  _renderItemPane(item, badgeText, isEquippedPane, state) {
    const r = RARITIES[item.rarity] || RARITIES.common;
    const pwr = calcItemPower(item);
    const reqKey = item.classReq || 'all';
    const reqInfo = CLASS_REQ_LABELS[reqKey] || CLASS_REQ_LABELS.all;
    const canWear = reqKey === 'all' || reqKey === (state?.classId || 'warrior');
    const slotLabel = item.subType || EQUIP_SLOTS[item.slot]?.label || item.slot || '裝備';
    const upgMult = 1 + (item.upgradeLevel || 0) * 0.12;
    const baseVal = item.baseStat ? Math.round(item.baseStat.value * upgMult) : 0;
    const baseKey = item.baseStat?.key || 'atk';
    const baseUnit = PCT_KEYS.has(baseKey) ? '%' : '';

    const affixesHtml = (item.affixes || []).map((a) => {
      const scaled = Math.round(a.value * upgMult * 10) / 10;
      if (a.isGreater) {
        return `<div class="ut-affix" style="color:#fde047;font-weight:900;">★ [太古] ${a.label || STAT_LABELS[a.key] || a.key} +${scaled}${a.unit || ''}</div>`;
      }
      return `<div class="ut-affix">◆ ${a.label || STAT_LABELS[a.key] || a.key} +${scaled}${a.unit || ''}</div>`;
    }).join('') + (item.temperedAffixes || []).map((t) =>
      `<div class="ut-affix" style="color:#5eead4;font-weight:800;">⚒️ ${t.label} +${t.value}${t.unit || ''}</div>`
    ).join('');

    const mythHtml = item.mythicEffect
      ? `<div class="ut-legendary" style="background:rgba(225,29,72,0.22);border-color:#fb7185;color:#fecdd3;">🌌 <b>[神話暗金] ${item.mythicEffect.name}</b>：${item.mythicEffect.desc}</div>`
      : '';
    const legHtml = item.legendaryEffect
      ? `<div class="ut-legendary">★ <b>${item.legendaryEffect.name}</b>：${item.legendaryEffect.desc}</div>`
      : '';
    const setHtml = (item.rarity === 'set' && item.setId && SET_DEFINITIONS[item.setId])
      ? (() => {
          const sd = SET_DEFINITIONS[item.setId];
          const b2 = sd.bonuses?.[2]?.desc || '';
          const b4 = sd.bonuses?.[4]?.desc || '';
          return `<div class="ut-set">❖ 套裝【${sd.name}】${b2 ? `<div style="margin-top:2px;">${b2}</div>` : ''}${b4 ? `<div>${b4}</div>` : ''}</div>`;
        })()
      : '';

    return `
      <div class="ut-pane ${isEquippedPane ? 'is-equipped-pane' : ''}" style="border-color:${isEquippedPane ? 'rgba(148,163,184,0.6)' : r.border};">
        <div class="ut-badge-tag">${badgeText}</div>
        <div class="ut-head">
          <img class="ut-icon" src="${resolveItemIconUniversal(item)}" style="border-color:${r.border};" alt="" />
          <div>
            <div class="ut-title" style="color:${r.color};">[${r.label}] ${item.name}${item.upgradeLevel ? ` +${item.upgradeLevel}` : ''}</div>
            <div class="ut-sub">${slotLabel} • Lv.${item.level || 1} • 戰力 <b style="color:#fef08a;">${formatNum(pwr)}</b></div>
            <div class="ut-sub" style="color:${canWear ? reqInfo.color : '#f87171'};font-weight:700;">[${reqInfo.label}]${canWear ? '' : '（目前職業無法穿戴）'}</div>
          </div>
        </div>
        ${item.baseStat ? `<div class="ut-base-stat">主屬性：${STAT_LABELS[baseKey] || baseKey} +${formatNum(baseVal)}${baseUnit}</div>` : ''}
        ${affixesHtml || '<div class="ut-sub">無額外附加詞綴</div>'}
        ${mythHtml}
        ${legHtml}
        ${setHtml}
      </div>
    `;
  }

  showItem(e, item, isEquipped = false, state = null) {
    if (!item) return;
    const st = state || this.getStateFn();
    const el = this.ensureEl();
    const eq = (!isEquipped && st?.equipment) ? st.equipment[item.slot] : null;

    const leftPane = this._renderItemPane(item, isEquipped ? '目前穿戴中' : '目標裝備詳情', isEquipped, st);
    const rightPane = eq ? this._renderItemPane(eq, '目前穿戴中（對比）', true, st) : '';

    let diffBarHtml = '';
    if (!isEquipped) {
      const pwr = calcItemPower(item);
      const eqPwr = calcItemPower(eq);
      const pDiff = pwr - eqPwr;
      const myMap = collectItemStatMap(item);
      const eqMap = collectItemStatMap(eq);
      const keys = new Set([...Object.keys(myMap), ...Object.keys(eqMap)]);
      const chips = [];
      if (pDiff !== 0) {
        chips.push(`<span class="${pDiff > 0 ? 'ut-up' : 'ut-down'}">${pDiff > 0 ? '▲' : '▼'} 戰力 ${pDiff > 0 ? '+' : ''}${formatNum(pDiff)}</span>`);
      }
      keys.forEach((k) => {
        const d = Math.round(((myMap[k] || 0) - (eqMap[k] || 0)) * 10) / 10;
        if (d !== 0) {
          const u = PCT_KEYS.has(k) ? '%' : '';
          chips.push(`<span class="${d > 0 ? 'ut-up' : 'ut-down'}">${d > 0 ? '▲' : '▼'} ${STAT_LABELS[k] || k} ${d > 0 ? '+' : ''}${d}${u}</span>`);
        }
      });
      diffBarHtml = `
        <div class="ut-diff-bar">
          <div class="ut-diff-title">${eq ? '替換裝備後的屬性變化' : '此部位尚未穿戴裝備（直接穿戴獲得全額加成）'}</div>
          <div class="ut-diff-grid">${chips.join('') || '<span class="ut-eq">屬性與目前穿戴相同</span>'}</div>
        </div>
      `;
    }

    el.innerHTML = `<div class="ut-row">${leftPane}${rightPane}</div>${diffBarHtml}`;
    el.classList.remove('hidden');
    this.move(e);
  }

  showPet(e, petDef, petRec = null, state = null) {
    if (!petDef) return;
    const st = state || this.getStateFn();
    const el = this.ensureEl();
    const r = getPetRarityMeta(petDef.rarity);
    const sch = PET_SCHOOLS[petDef.school] || { name: '魔寵', color: '#fde68a' };
    const upg = petRec?.upgradeLevel || 0;
    const mult = 1 + upg * 0.15;
    const isEq = st?.equippedPetId === petDef.id;
    const eqDef = (!isEq && st?.equippedPetId) ? getPetDef(st.equippedPetId) : null;
    const eqRec = eqDef ? (st.pets || []).find((p) => p.petId === eqDef.id) : null;

    const renderPetCard = (def, rec, tag, isEqPane) => {
      const rm = getPetRarityMeta(def.rarity);
      const sc = PET_SCHOOLS[def.school] || { label: '魔寵', name: '魔寵', color: '#fde68a' };
      const u = rec?.upgradeLevel || 0;
      const m = 1 + u * 0.15;
      const bonusLines = Object.entries(def.bonuses || {}).map(([k, v]) => {
        const val = Math.round(v * m * 10) / 10;
        const unit = PCT_KEYS.has(k) ? '%' : '';
        return `<div class="ut-affix">◆ ${STAT_LABELS[k] || k} +${val}${unit}</div>`;
      }).join('');
      return `
        <div class="ut-pane ${isEqPane ? 'is-equipped-pane' : ''}" style="border-color:${isEqPane ? 'rgba(148,163,184,0.6)' : rm.color};">
          <div class="ut-badge-tag">${tag}</div>
          <div class="ut-head">
            <img class="ut-icon" src="${def.icon || `./assets/pets/${def.id}.png`}" style="border-color:${rm.color};" onerror="this.style.display='none'" alt="" />
            <div>
              <div class="ut-title" style="color:${rm.color};">[${rm.label}] ${def.name}${u > 0 ? ` +${u}` : ''}</div>
              <div class="ut-sub" style="color:${sc.color};">流派：${sc.label || sc.name || '魔寵'} • 進階倍率 ×${m.toFixed(2)}</div>
            </div>
          </div>
          <div class="ut-desc">${def.desc || ''}</div>
          ${bonusLines}
          ${def.skillDesc ? `<div class="ut-legendary">★ 主動技：${def.skillDesc}</div>` : ''}
        </div>
      `;
    };

    const left = renderPetCard(petDef, petRec, isEq ? '目前出戰中' : '寵物詳情', isEq);
    const right = eqDef ? renderPetCard(eqDef, eqRec, '目前出戰中（對比）', true) : '';
    el.innerHTML = `<div class="ut-row">${left}${right}</div>`;
    el.classList.remove('hidden');
    this.move(e);
  }

  showSkill(e, skill, level = 1, extra = '') {
    if (!skill) return;
    const st = this.getStateFn();
    const el = this.ensureEl();
    const lv = Math.max(1, Number(level) || 1);
    const cdMs = skill.cooldownMs || skill.cdMs || 0;
    const cd = cdMs ? `${(cdMs / 1000).toFixed(1)} 秒` : (skill.cd ? `${skill.cd} 秒` : '被動／無冷卻');
    const mp = skill.mpCost ? `${skill.mpCost}` : '18';
    const spec = SKILL_BUILD_SPECS[skill.id];
    const tagsHtml = spec ? [
      ...(spec.tags || []).map((t) => `<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(148,163,184,0.2);color:#e2e8f0;margin-right:4px;">${t}</span>`),
      ...(spec.applies || []).map((k) => {
        const m = STATUS_META[k];
        return m ? `<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:rgba(251,146,60,0.2);color:${m.color};border:1px solid ${m.color}55;margin-right:4px;">${m.icon}${m.label}</span>` : '';
      }),
    ].join('') : '';

    const curDetail = typeof skill.getDetail === 'function' ? skill.getDetail(lv) : '';
    const nextDetail = typeof skill.getDetail === 'function' ? skill.getDetail(lv + 1) : '';
    let specSummary = '';
    if (spec && st) {
      const ch = getSkillSpecChoice(st, st.classId, skill.id);
      const t4Node = (spec.t4 || []).find((x) => x.id === ch.t4);
      const t6Node = ch.t6 ? (spec.t6 || []).find((x) => x.id === ch.t6) : null;
      const lines = [];
      if (lv >= 2 && spec.t2) lines.push(`Lv.2 質變：${spec.t2.name}`);
      if (lv >= 4 && t4Node) lines.push(`Lv.4 分歧：${t4Node.name}`);
      if (lv >= 6 && t6Node) lines.push(`Lv.6 轉化：${t6Node.name}`);
      if (lv >= 8 && spec.t8) lines.push(`Lv.8 幸運：${spec.t8.name}`);
      if (lines.length) {
        specSummary = `<div class="ut-legendary">⚡ 已啟用專精：${lines.join(' ｜ ')}</div>`;
      }
    }

    el.innerHTML = `
      <div class="ut-pane" style="border-color:#c89b3c;width:310px;">
        <div class="ut-badge-tag">暗黑職業技能預覽</div>
        <div class="ut-head">
          ${skill.icon ? `<img class="ut-icon" src="${skill.icon}" alt="" />` : `<div class="ut-icon-emoji">⚔️</div>`}
          <div>
            <div class="ut-title" style="color:#fde68a;">${skill.name || '未知技能'} <span style="color:#4ade80;font-size:12px;">Lv.${lv}</span></div>
            <div class="ut-sub">冷卻：${cd} • 消耗：${mp} 能量</div>
            ${tagsHtml ? `<div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:2px;">${tagsHtml}</div>` : ''}
          </div>
        </div>
        <div class="ut-desc">${skill.desc || ''}</div>
        ${curDetail ? `<div class="ut-base-stat" style="margin-top:6px;">目前效果：${curDetail}</div>` : ''}
        ${nextDetail ? `<div class="ut-affix" style="color:#86efac;">下一級 (Lv.${lv + 1})：${nextDetail}</div>` : ''}
        ${specSummary}
        ${extra ? `<div class="ut-footer">${extra}</div>` : ''}
      </div>
    `;
    el.classList.remove('hidden');
    this.move(e);
  }

  showMaterial(e, matKey, state = null) {
    const doc = MATERIAL_DOCS[matKey];
    if (!doc) return;
    const st = state || this.getStateFn();
    const held = st ? (matKey === 'gold' ? st.gold : matKey === 'dust' ? st.dust : (st.soulCrystals ?? st.crystals ?? 0)) : 0;
    this.showRich(e, {
      title: doc.title,
      subtitle: `${doc.subtitle} • 持有：${formatNum(held || 0)}`,
      emoji: doc.emoji,
      color: doc.color,
      lines: [doc.desc],
      footer: `主要取得：${doc.sources}`,
    });
  }

  showExpBar(e, state = null) {
    const st = state || this.getStateFn();
    if (!st) return;
    const lv = st.level || 1;
    const cur = st.exp || 0;
    const need = getExpToNext(lv);
    const pct = Math.min(100, (cur / Math.max(1, need)) * 100).toFixed(2);
    const tracker = window.__EXP_TRACKER__;
    const expPerHr = tracker?.getExpPerHour?.() || 0;
    const remainExp = Math.max(0, need - cur);
    const etaSec = expPerHr > 0 ? (remainExp / expPerHr) * 3600 : 0;

    this.showRich(e, {
      title: `角色等級 Lv.${lv}（千小時長線進度）`,
      subtitle: `經驗值：${formatNum(cur)} / ${formatNum(need)}（${pct}%）`,
      emoji: '⭐',
      color: '#fde047',
      lines: [
        `目前掛機效率：約 ${expPerHr > 0 ? `${formatNum(expPerHr)} EXP / 小時` : '開始戰鬥後統計'}`,
        `距離 Lv.${lv + 1} 預估：${expPerHr > 0 ? formatDuration(etaSec) : '需累積實戰擊殺數據'}`,
        '提示：挑戰與自身等級相近或更高的關卡可獲得完整／越級經驗；低於自身 5 級以上的地圖將觸發經驗衰減。',
      ],
      footer: 'Lv.1–20 拓荒 → Lv.21–50 養成 → Lv.51–80 深淵 → Lv.81–100+ 千小時巔峰',
    });
  }

  showRich(e, { title, subtitle = '', icon = '', emoji = '📜', color = '#fde68a', lines = [], footer = '' }) {
    const el = this.ensureEl();
    el.innerHTML = `
      <div class="ut-pane" style="border-color:${color};">
        <div class="ut-head">
          ${icon ? `<img class="ut-icon" src="${icon}" alt="" />` : `<div class="ut-icon-emoji">${emoji}</div>`}
          <div>
            <div class="ut-title" style="color:${color};">${title}</div>
            ${subtitle ? `<div class="ut-sub">${subtitle}</div>` : ''}
          </div>
        </div>
        ${lines.map((l) => `<div class="ut-desc">${l}</div>`).join('')}
        ${footer ? `<div class="ut-footer">${footer}</div>` : ''}
      </div>
    `;
    el.classList.remove('hidden');
    this.move(e);
  }

  move(e) {
    if (!this.el || this.el.classList.contains('hidden')) return;
    const pad = 14;
    const rect = this.el.getBoundingClientRect();
    let x = e.clientX + 18;
    let y = e.clientY - 16;
    if (x + rect.width > window.innerWidth - pad) {
      x = Math.max(pad, e.clientX - rect.width - 18);
    }
    if (y + rect.height > window.innerHeight - pad) {
      y = Math.max(pad, window.innerHeight - rect.height - pad);
    }
    if (y < pad) y = pad;
    this.el.style.left = `${Math.round(x)}px`;
    this.el.style.top = `${Math.round(y)}px`;
  }

  hide() {
    if (this.el) this.el.classList.add('hidden');
  }
}

export const UniversalTooltip = new UniversalTooltipEngine();
if (typeof window !== 'undefined') {
  window.__UNIVERSAL_TOOLTIP__ = UniversalTooltip;
}
