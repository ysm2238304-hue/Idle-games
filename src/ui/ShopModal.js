// 暗黑深淵商城模組：基礎物資 / 裝備盲盒 / 寵物契約蛋 / 強效藥水 (v86)
import { RARITIES } from '../data/items.js';
import { PET_CATALOG } from '../data/pets.js';
import { generateLoot, generateBlackMarketItem } from '../logic/lootGen.js';

export const SHOP_ITEMS = {
  basic: [
    { id: 'protect_stone_g', name: '鍛造保護石 ×1', icon: '🛡️', currency: 'gold', price: 2500, desc: '強化 +6～+10 失敗時消耗 1 顆，保證裝備／寵物不降階。' },
    { id: 'protect_stone_d', name: '鍛造保護石 ×2', icon: '🛡️', currency: 'dust', price: 140, desc: '使用奧術粉塵一次兌換 2 顆鍛造保護石。' },
    { id: 'dust_pouch',      name: '奧術粉塵袋 (+150 粉塵)', icon: '💎', currency: 'gold', price: 4000, desc: '立即獲得 150 個奧術粉塵，用於洗鍊與 +6 以上強化。' },
    { id: 'pet_essence_bag', name: '寵物精華結晶 (+30 精華)', icon: '✨', currency: 'gold', price: 5000, desc: '立即獲得 30 點寵物精華，用於強化或召喚寵物。' },
    { id: 'gold_chest',      name: '深淵金幣寶袋 (+6,000 G)', icon: '💰', currency: 'crystals', price: 1, desc: '消耗 1 顆深淵魂晶兌換大量冒險金幣。' },
  ],
  gear: [
    { id: 'box_rare',      name: '精良稀有裝備箱', icon: '📦', currency: 'gold', price: 3500, desc: '必出【稀有】以上當前職業／通用裝備（含 3～4 條隨機詞條）。' },
    { id: 'box_legend_g',  name: '遠古傳奇裝備箱', icon: '🎁', currency: 'gold', price: 18000, desc: '必出【傳奇】橘裝（附帶強大傳奇特效與 4 條隨機詞條）。' },
    { id: 'box_legend_d',  name: '粉塵傳奇裝備箱', icon: '🎁', currency: 'dust', price: 120, desc: '消耗奧術粉塵鍛造必出【傳奇】橘裝。' },
    { id: 'box_set_g',     name: '綠色套裝秘匣',   icon: '🌿', currency: 'gold', price: 45000, desc: '必出【套裝】綠裝！附帶專屬 2件／4件套裝詞條。' },
    { id: 'box_set_c',     name: '魂晶綠色套裝秘匣', icon: '🌿', currency: 'crystals', price: 5, desc: '消耗 5 顆魂晶立即開啟一件當前等級【套裝】綠裝。' },
  ],
  pet: [
    { id: 'egg_basic',     name: '初階靈獸蛋', icon: '🥚', currency: 'gold', price: 3200, desc: '隨機孵化普通～稀有品質技能變異寵物。' },
    { id: 'egg_abyss_g',   name: '深淵契約蛋', icon: '🔮', currency: 'gold', price: 16000, desc: '必出【稀有】～【傳奇】技能衍生型寵物！' },
    { id: 'egg_abyss_e',   name: '精華契約蛋', icon: '🔮', currency: 'petEssence', price: 30, desc: '消耗 30 寵物精華召喚魔法～神話級別寵物。' },
    { id: 'egg_mythic_c',  name: '太古神話寵蛋', icon: '🐉', currency: 'crystals', price: 8, desc: '高機率直接孵化【傳奇】或【太古綠色神話】寵物！' },
  ],
  potion: [
    { id: 'pot_heal',      name: '生命與藥水補充包', icon: '🔴', currency: 'gold', price: 600, desc: '立即回滿生命值並補滿戰場生命藥水次數。' },
    { id: 'pot_fury',      name: '狂暴戰神藥水 (60秒)', icon: '🟣', currency: 'gold', price: 1800, desc: '60 秒內攻速 +25%、暴擊率 +10%。' },
    { id: 'pot_exp',       name: '經驗祝福藥水 (90秒)', icon: '🟡', currency: 'gold', price: 2000, desc: '90 秒內戰鬥獲得經驗值 +50%。' },
    { id: 'pot_mf',        name: '深淵尋寶藥水 (90秒)', icon: '🟢', currency: 'gold', price: 2200, desc: '90 秒內掉寶率 +40%、金幣掉落 +30%。' },
    { id: 'pot_titan',     name: '泰坦＆賢者合劑 (120秒)', icon: '⚗️', currency: 'gold', price: 3500, desc: '120 秒內攻擊 +30%、暴傷 +40%、冷卻縮減 18%。' },
  ],
};

const CURRENCY_LABELS = {
  gold: '金幣',
  dust: '粉塵',
  crystals: '魂晶',
  petEssence: '寵物精華',
};

export class ShopModal {
  constructor({ getState, onPurchaseComplete } = {}) {
    this.getState = getState;
    this.onPurchaseComplete = onPurchaseComplete;
    this.activeTab = 'basic';
    this.modal = null;
  }

  init() {
    this.modal = document.getElementById('modal-shop');
    document.getElementById('btn-open-shop')?.addEventListener('click', () => this.open());
    document.getElementById('btn-close-shop')?.addEventListener('click', () => this.close());
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });
  }

  open(tab = null) {
    if (tab) this.activeTab = tab;
    if (!this.modal) return;
    this.render();
    this.modal.classList.remove('hidden');
  }

  close() {
    this.modal?.classList.add('hidden');
  }

  toggle() {
    if (!this.modal) return;
    if (this.modal.classList.contains('hidden')) this.open();
    else this.close();
  }

  _canAfford(st, item) {
    if (item.currency === 'gold') return (st.gold || 0) >= item.price;
    if (item.currency === 'dust') return (st.dust || 0) >= item.price;
    if (item.currency === 'crystals') return (st.soulCrystals || 0) >= item.price;
    if (item.currency === 'petEssence') return (st.petEssence || 0) >= item.price;
    return false;
  }

  _deduct(st, item) {
    if (item.currency === 'gold') st.gold -= item.price;
    else if (item.currency === 'dust') st.dust -= item.price;
    else if (item.currency === 'crystals') st.soulCrystals -= item.price;
    else if (item.currency === 'petEssence') st.petEssence -= item.price;
  }

  _grantPet(st, rarPoolWeights) {
    const roll = Math.random() * 100;
    let acc = 0, rar = 'common';
    for (const [r, w] of rarPoolWeights) {
      acc += w;
      if (roll < acc) { rar = r; break; }
    }
    const pool = PET_CATALOG.filter((p) => p.rarity === rar);
    const tpl = pool[Math.floor(Math.random() * pool.length)] || PET_CATALOG[0];
    const petObj = {
      uid: `pet_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      petId: tpl.id, name: tpl.name, rarity: tpl.rarity, school: tpl.school, emoji: tpl.emoji, upgradeLevel: 0, obtainedAt: Date.now(),
    };
    if (!st.pets) st.pets = [];
    st.pets.push(petObj);
    if (!st.equippedPetId) st.equippedPetId = tpl.id;
    return petObj;
  }

  buy(item) {
    const st = this.getState?.();
    if (!st || !this._canAfford(st, item)) return;
    this._deduct(st, item);
    let msg = '';
    const stage = Math.max(1, st.maxStageReached || st.stage || 1);
    const now = Date.now();

    if (item.id === 'protect_stone_g') { st.protectStones = (st.protectStones || 0) + 1; msg = '🛡️ 購得 鍛造保護石 ×1'; }
    else if (item.id === 'protect_stone_d') { st.protectStones = (st.protectStones || 0) + 2; msg = '🛡️ 購得 鍛造保護石 ×2'; }
    else if (item.id === 'dust_pouch') { st.dust = (st.dust || 0) + 150; msg = '💎 獲得 +150 奧術粉塵'; }
    else if (item.id === 'pet_essence_bag') { st.petEssence = (st.petEssence || 0) + 30; msg = '✨ 獲得 +30 寵物精華'; }
    else if (item.id === 'gold_chest') { st.gold = (st.gold || 0) + 6000; msg = '💰 獲得 +6,000 金幣'; }
    else if (item.id === 'box_rare') {
      const eq = generateBlackMarketItem(stage, st.classId, 'rare');
      st.inventory.unshift(eq);
      msg = `📦 開出 [${RARITIES[eq.rarity].label}] ${eq.name}！`;
    } else if (item.id === 'box_legend_g' || item.id === 'box_legend_d') {
      const eq = generateBlackMarketItem(stage, st.classId, 'legendary');
      st.inventory.unshift(eq);
      msg = `🎁 開出 [${RARITIES[eq.rarity].label}] ${eq.name}！`;
    } else if (item.id === 'box_set_g' || item.id === 'box_set_c') {
      const eq = generateBlackMarketItem(stage, st.classId, 'set');
      st.inventory.unshift(eq);
      msg = `🌿 開出 [${RARITIES[eq.rarity].label}] ${eq.name}！`;
    } else if (item.id === 'egg_basic') {
      const p = this._grantPet(st, [['common', 45], ['magic', 38], ['rare', 17]]);
      msg = `🥚 孵化寵物 [${RARITIES[p.rarity].label}] ${p.name}！`;
    } else if (item.id === 'egg_abyss_g') {
      const p = this._grantPet(st, [['rare', 65], ['legendary', 35]]);
      msg = `🔮 孵化寵物 [${RARITIES[p.rarity].label}] ${p.name}！`;
    } else if (item.id === 'egg_abyss_e') {
      const p = this._grantPet(st, [['magic', 35], ['rare', 35], ['legendary', 20], ['set', 10]]);
      msg = `🔮 孵化寵物 [${RARITIES[p.rarity].label}] ${p.name}！`;
    } else if (item.id === 'egg_mythic_c') {
      const p = this._grantPet(st, [['legendary', 65], ['set', 35]]);
      msg = `🐉 孵化寵物 [${RARITIES[p.rarity].label}] ${p.name}！`;
    } else if (item.id === 'pot_heal') {
      msg = '🔴 已補充生命與藥水次數！';
    } else if (item.id === 'pot_fury') {
      if (!st.potionBuffs) st.potionBuffs = {};
      st.potionBuffs.furyUntil = Math.max(now, st.potionBuffs.furyUntil || 0) + 60000;
      msg = '🟣 狂暴戰神藥水生效 (60秒)！';
    } else if (item.id === 'pot_exp') {
      if (!st.potionBuffs) st.potionBuffs = {};
      st.potionBuffs.expUntil = Math.max(now, st.potionBuffs.expUntil || 0) + 90000;
      msg = '🟡 經驗祝福藥水生效 (90秒)！';
    } else if (item.id === 'pot_mf') {
      if (!st.potionBuffs) st.potionBuffs = {};
      st.potionBuffs.mfUntil = Math.max(now, st.potionBuffs.mfUntil || 0) + 90000;
      msg = '🟢 深淵尋寶藥水生效 (90秒)！';
    } else if (item.id === 'pot_titan') {
      if (!st.potionBuffs) st.potionBuffs = {};
      st.potionBuffs.titanUntil = Math.max(now, st.potionBuffs.titanUntil || 0) + 120000;
      st.potionBuffs.sageUntil = Math.max(now, st.potionBuffs.sageUntil || 0) + 120000;
      msg = '⚗️ 泰坦＆賢者合劑生效 (120秒)！';
    }

    this.onPurchaseComplete?.(item.id, msg);
    this.render(msg);
  }

  render(toastMsg = '') {
    const st = this.getState?.() || {};
    const body = document.getElementById('shop-modal-body');
    const wallet = document.getElementById('shop-wallet-bar');
    const tabs = this.modal?.querySelectorAll('.shop-tab-btn');
    tabs?.forEach((b) => {
      b.classList.toggle('active', b.dataset.shoptab === this.activeTab);
      b.onclick = () => { this.activeTab = b.dataset.shoptab; this.render(); };
    });
    if (wallet) {
      wallet.innerHTML = `
        <span>💰 金幣：<b>${(st.gold || 0).toLocaleString()}</b></span>
        <span>💎 粉塵：<b>${(st.dust || 0).toLocaleString()}</b></span>
        <span>🔮 魂晶：<b>${st.soulCrystals || 0}</b></span>
        <span>✨ 寵物精華：<b>${st.petEssence || 0}</b></span>
        <span>🛡️ 保護石：<b>${st.protectStones || 0}</b></span>
      `;
    }
    if (!body) return;
    const list = SHOP_ITEMS[this.activeTab] || [];
    body.innerHTML = `
      ${toastMsg ? `<div style="padding:7px 12px;margin-bottom:10px;border-radius:7px;background:rgba(34,197,94,0.16);border:1px solid #22c55e;color:#86efac;font-size:12.5px;font-weight:700;">${toastMsg}</div>` : ''}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        ${list.map((it) => {
          const ok = this._canAfford(st, it);
          return `
            <div style="display:flex;flex-direction:column;justify-content:space-between;gap:8px;padding:11px 12px;border-radius:9px;background:rgba(18,14,18,0.92);border:1px solid rgba(154,114,54,0.45);">
              <div style="display:flex;align-items:flex-start;gap:10px;">
                <div style="font-size:24px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:8px;background:rgba(120,53,15,0.22);border:1px solid rgba(251,191,36,0.4);flex-shrink:0;">${it.icon}</div>
                <div>
                  <b style="color:#fde68a;font-size:13.5px;">${it.name}</b>
                  <p style="margin:3px 0 0;font-size:11.5px;color:#94a3b8;line-height:1.45;">${it.desc}</p>
                </div>
              </div>
              <button type="button" class="btn-gold-sm" data-shop-buy="${it.id}" ${ok ? '' : 'disabled'} style="width:100%;">
                ${ok ? `購買 (${it.price.toLocaleString()} ${CURRENCY_LABELS[it.currency]})` : `不足 (${it.price.toLocaleString()} ${CURRENCY_LABELS[it.currency]})`}
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;
    body.querySelectorAll('[data-shop-buy]').forEach((btn) => {
      const it = list.find((x) => x.id === btn.dataset.shopBuy);
      if (it) btn.onclick = () => this.buy(it);
    });
  }
}
