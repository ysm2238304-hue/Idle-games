/**
 * classMechanics.js (v234 - 第 2 批：六大職業獨立專屬機制引擎)
 * 1. 狂戰士：戰神武器庫（巨劍 / 雙斧 / 戰錘）＋ 3 招武器精通壓制過載
 * 2. 暗影遊俠：三選一專精契約（連擊點 / 心眼洞察 / 戰術預備）
 * 3. 秘法師：雙附魔槽（任意 2 招主動技轉化為被動自動觸發）
 * 4. 聖殿騎士：神聖誓約（烈陽 / 鐵壁 / 殉道）＋ 5 層聖光印記天罰
 * 5. 死靈法師：亡者之書（骷髏戰士 / 法師 / 魔像各別進化或獻祭，三獻祭啟動孤高死靈暴君）
 * 6. 影殺刺客：雙極調毒（主手毒 × 副手毒化合）＋ 5 星暗影印記終結爆裂
 */

export const CLASS_MECHANIC_DEFS = {
  warrior: {
    title: '戰神武器庫 & 武器精通',
    subtitle: '選擇主戰武器專精；每施放 3 次技能自動觸發【武器精通過載】（下次技能必壓制＋傷害 +35%）。',
    type: 'single',
    key: 'arsenal',
    defaultVal: 'greatsword',
    options: [
      { id: 'greatsword', name: '雙手巨劍專精', badge: '流血割裂', color: '#f87171', desc: '所有技能額外掛上【流血】，對流血目標暴擊傷害 +35%、技能傷害 +15%。' },
      { id: 'dual_axes',  name: '雙持戰斧專精', badge: '極速狂怒', color: '#fb923c', desc: '攻速 +22%、暴擊率 +10%，每次暴擊立即回復 6 點能量。' },
      { id: 'warhammer',  name: '重型戰錘專精', badge: '壓制碎骨', color: '#38bdf8', desc: '壓制觸發率 +12%、壓制傷害額外 +45%，並附加【易傷】狀態。' },
    ],
  },
  ranger: {
    title: '遊俠專精契約（三選一）',
    subtitle: '徹底改變暗影遊俠的資源循環與爆發節奏。',
    type: 'single',
    key: 'specialization',
    defaultVal: 'combo_points',
    options: [
      { id: 'combo_points', name: '連擊點契約', badge: '三星爆發', color: '#4ade80', desc: '普攻累積連擊星（最高 3 星）；施放技能消耗全星，每星提供 +28% 傷害與 +8% 幸運一擊率。' },
      { id: 'inner_sight',  name: '心眼洞察契約', badge: '無限精力', color: '#c084fc', desc: '命中持續累積心眼條，集滿進入 4 秒【心眼】：無限精力、暴擊率 +25%、冷卻加速。' },
      { id: 'preparation',  name: '戰術預備契約', badge: '極速終極', color: '#fbbf24', desc: '每次施放技能自動縮短全技能冷卻 1.1 秒，且所有終極技傷害 +40%。' },
    ],
  },
  mage: {
    title: '奧術雙附魔槽（Enchantment Slots）',
    subtitle: '將任意 2 招已掌握的秘法師主動技拖入附魔槽，轉化為常駐被動自動觸發！',
    type: 'dual_enchant',
    defaultSlots: ['meteor', 'frost_nova'],
    enchants: {
      meteor:          { name: '深淵隕石附魔', color: '#fb923c', desc: '幸運一擊／暴擊 18% 機率於目標處免費天降烈焰隕石（180% 傷＋灼燒）。' },
      frost_nova:      { name: '寒冰新星附魔', color: '#38bdf8', desc: '每 5.5 秒自動在目標處引爆免費寒冰新星（135% 傷＋凍結＋易傷）。' },
      chain_lightning: { name: '閃電鏈附魔',   color: '#facc15', desc: '每施放 2 次技能自動釋放免費連鎖電弧（150% 傷＋感電）。' },
      arcane_orb:      { name: '星界奧球附魔', color: '#a78bfa', desc: '暴擊時 25% 機率追加星界奧球爆發（120% 傷＋易傷）。' },
      black_hole:      { name: '黑洞奇點附魔', color: '#c084fc', desc: '每 8 秒於怪群自動觸發暗影奇點坍縮（165% 傷＋詛咒）。' },
      icicle_rain:     { name: '極寒冰錐附魔', color: '#7dd3fc', desc: '攻擊凍結目標 30% 機率額外降下極寒冰錐（115% 傷）。' },
      void_beam:       { name: '虛空星爆附魔', color: '#e879f9', desc: '命中時 15% 機率貫穿虛空光束（175% 傷＋詛咒）。' },
      mana_overload:   { name: '魔力超載附魔', color: '#60a5fa', desc: '常駐魔力回復 +45%、技能傷害 +18%、幸運一擊率 +8%。' },
    },
  },
  paladin: {
    title: '神聖誓約 & 審判印記',
    subtitle: '擇一神聖誓約，所有攻擊會疊加【聖光印記】並依誓約觸發專屬聖罰。',
    type: 'single',
    key: 'oath',
    defaultVal: 'sun_oath',
    options: [
      { id: 'sun_oath',     name: '烈陽審判誓約', badge: '天雷定罪', color: '#fde047', desc: '每疊滿 5 層聖光印記自動降下 240% 聖炎天雷，附加【定罪】＋【灼燒】。' },
      { id: 'bastion_oath', name: '鐵壁荊棘誓約', badge: '護甲反傷', color: '#60a5fa', desc: '護甲 +35%、生命 +20%；每 3 秒將 180% 護甲值化為範圍聖光荊棘反傷波。' },
      { id: 'martyr_oath',  name: '殉道狂熱誓約', badge: '高風險高傷', color: '#f87171', desc: '技能傷害 +35%、壓制率 +10%；施放技能消耗 3% 生命換取極致神聖爆發。' },
    ],
  },
  necro: {
    title: '亡者之書（Book of the Dead）',
    subtitle: '三類亡靈各自選擇進化分支或【獻祭】；三項全獻祭將啟動隱藏被動【孤高死靈暴君】（全技能傷 ×1.25）！',
    type: 'book_of_dead',
    defaultBook: { skeleton: 'reaper', mage: 'shadow_mage', golem: 'blood_golem' },
    groups: [
      {
        key: 'skeleton',
        label: '骷髏戰士分隊',
        choices: [
          { id: 'reaper',    name: '收割者骷髏', desc: '攻擊附加【流血】與【易傷】，加速觸發大出血。' },
          { id: 'defender',  name: '白骨護衛',   desc: '玩家護甲 +25%、最大生命 +15%，穩健站樁。' },
          { id: 'sacrifice', name: '🔥 獻祭戰士', desc: '放棄戰士加成，永久獲得暴擊率 +15%、技能傷害 +25%。' },
        ],
      },
      {
        key: 'mage',
        label: '骷髏法師分隊',
        choices: [
          { id: 'frost_mage',  name: '極寒法師', desc: '攻擊附加【凍結】，聯動雷系觸發超導碎冰。' },
          { id: 'shadow_mage', name: '暗影法師', desc: '攻擊附加【詛咒】並使回魂能 +30%。' },
          { id: 'sacrifice',   name: '🔥 獻祭法師', desc: '放棄法師加成，永久獲得最大魂能 +40%、技能傷害 +30%。' },
        ],
      },
      {
        key: 'golem',
        label: '鮮血魔像主宰',
        choices: [
          { id: 'blood_golem', name: '噬血魔像', desc: '玩家吸血 +8%、壓制觸發率 +8%。' },
          { id: 'iron_golem',  name: '鋼鐵魔像', desc: '玩家護甲 +30%、攻擊必掛【易傷】。' },
          { id: 'sacrifice',   name: '🔥 獻祭魔像', desc: '放棄魔像加成，永久獲得暴擊傷害 +55%、最大生命 +25%。' },
        ],
      },
    ],
  },
  assassin: {
    title: '雙極調毒 & 五星暗影印記',
    subtitle: '自由調配主手＋副手毒藥觸發化合反應；每累積 5 星暗影印記，下次技能傷害 +60% 並引發雙毒爆裂！',
    type: 'dual_venom',
    defaultVenom: { mainHand: 'corrosive', offHand: 'hellvenom' },
    mainOptions: [
      { id: 'corrosive', name: '腐蝕破甲毒', color: '#4ade80', desc: '附加【易傷】並使暴擊傷害 +30%、技能穿透提升。' },
      { id: 'paralyze',  name: '神經麻痺毒', color: '#facc15', desc: '附加【感電】並使攻速 +18%、幸運一擊率 +10%。' },
    ],
    offOptions: [
      { id: 'hellvenom',  name: '爆裂毒火油', color: '#fb923c', desc: '附加【灼燒】＋【中毒】，高頻自爆【煉獄毒爆】！' },
      { id: 'bloodtoxin', name: '噬血劇毒油', color: '#f87171', desc: '附加【流血】＋【中毒】，吸血 +10% 並自爆【大出血】！' },
    ],
  },
};

export function getClassMechanicConfig(state, classId = null) {
  const cid = classId || state?.classId || 'warrior';
  const def = CLASS_MECHANIC_DEFS[cid];
  const saved = state?.classMechanic?.[cid] || {};
  if (!def) return {};
  if (def.type === 'single') {
    return { [def.key]: saved[def.key] || def.defaultVal };
  }
  if (def.type === 'dual_enchant') {
    const slots = Array.isArray(saved.enchants) && saved.enchants.length === 2 ? saved.enchants : [...def.defaultSlots];
    return { enchants: slots };
  }
  if (def.type === 'book_of_dead') {
    return { book: { ...def.defaultBook, ...(saved.book || {}) } };
  }
  if (def.type === 'dual_venom') {
    return { venom: { ...def.defaultVenom, ...(saved.venom || {}) } };
  }
  return {};
}

// 提供給 statCalc.js 的常駐面板加成
export function getClassMechanicStatBonuses(state) {
  const cid = state?.classId || 'warrior';
  const cfg = getClassMechanicConfig(state, cid);
  const b = {
    atkSpeedPct: 0,
    critRate: 0,
    critDmg: 0,
    armorPct: 0,
    maxHpPct: 0,
    maxMpPct: 0,
    mpRegenPct: 0,
    lifesteal: 0,
    skillDmgPct: 0,
    overpowerPct: 0,
    luckyPct: 0,
    isLoneTyrant: false,
  };

  if (cid === 'warrior') {
    if (cfg.arsenal === 'greatsword') { b.critDmg += 35; b.skillDmgPct += 15; }
    if (cfg.arsenal === 'dual_axes')  { b.atkSpeedPct += 22; b.critRate += 10; }
    if (cfg.arsenal === 'warhammer')  { b.overpowerPct += 12; }
  } else if (cid === 'mage') {
    const en = cfg.enchants || [];
    if (en.includes('mana_overload')) { b.mpRegenPct += 45; b.skillDmgPct += 18; b.luckyPct += 8; }
  } else if (cid === 'paladin') {
    if (cfg.oath === 'bastion_oath') { b.armorPct += 35; b.maxHpPct += 20; }
    if (cfg.oath === 'martyr_oath')  { b.skillDmgPct += 35; b.overpowerPct += 10; }
  } else if (cid === 'necro') {
    const bk = cfg.book || {};
    if (bk.skeleton === 'defender')  { b.armorPct += 25; b.maxHpPct += 15; }
    if (bk.skeleton === 'sacrifice') { b.critRate += 15; b.skillDmgPct += 25; }
    if (bk.mage === 'shadow_mage')   { b.mpRegenPct += 30; }
    if (bk.mage === 'sacrifice')     { b.maxMpPct += 40; b.skillDmgPct += 30; }
    if (bk.golem === 'blood_golem')  { b.lifesteal += 8; b.overpowerPct += 8; }
    if (bk.golem === 'iron_golem')   { b.armorPct += 30; }
    if (bk.golem === 'sacrifice')    { b.critDmg += 55; b.maxHpPct += 25; }
    if (bk.skeleton === 'sacrifice' && bk.mage === 'sacrifice' && bk.golem === 'sacrifice') {
      b.isLoneTyrant = true;
      b.skillDmgPct += 25;
    }
  } else if (cid === 'assassin') {
    const vn = cfg.venom || {};
    if (vn.mainHand === 'corrosive') { b.critDmg += 30; }
    if (vn.mainHand === 'paralyze')  { b.atkSpeedPct += 18; b.luckyPct += 10; }
    if (vn.offHand === 'bloodtoxin') { b.lifesteal += 10; }
  }

  return b;
}
