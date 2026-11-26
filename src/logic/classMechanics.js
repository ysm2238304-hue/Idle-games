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
    defaultSlots: ['m_fireball', 'm_frozen_orb'],
    enchants: {
      m_fire_bolt:         { name: '烈焰箭附魔',   color: '#fb923c', desc: '【經典】所有技能直接附帶 4.5 秒【灼燒】，讓冰／雷法免費吃滿燃燒暴傷！' },
      m_frost_bolt:        { name: '冰霜箭附魔',   color: '#7dd3fc', desc: '所有技能額外附加冰冷【凍結】效果，加速硬凍結。' },
      m_arc_lash:          { name: '電弧鞭附魔',   color: '#a78bfa', desc: '施放冷卻技時自動電暈周圍並縮短全技能 CD 0.5s。' },
      m_spark:             { name: '星界飛彈附魔', color: '#60a5fa', desc: '擊殺或暴擊 25% 機率在地面生成【爆裂電花】回魔並劈雷。' },
      m_fireball:          { name: '烈焰火球附魔', color: '#ef4444', desc: '【清屏神技】敵人死亡／暴擊 25% 直接原地炸出 165% 烈焰火球連鎖清屏！' },
      m_ice_shards:        { name: '寒冰裂片附魔', color: '#38bdf8', desc: '【冰流神技】敵人處於凍結時，自動從空中齊射免費寒冰裂片處決！' },
      chain_lightning:     { name: '連鎖閃電附魔', color: '#facc15', desc: '每施放 2 次技能自動釋放免費連鎖閃電（150% 傷＋感電）。' },
      m_frozen_orb:        { name: '冰封球附魔',   color: '#38bdf8', desc: '【暗黑 4 頂級】施放任何非基礎技 35% 機率免費擲出一顆冰封球！' },
      m_flame_shield:      { name: '烈焰護盾附魔', color: '#fb923c', desc: '生命危急時自動觸發無敵烈焰護盾並瞬間回復 40% 最大生命！' },
      m_ice_armor:         { name: '寒冰護甲附魔', color: '#7dd3fc', desc: '護甲 +25%、回魔 +25%，受擊高機率反凍敵群。' },
      m_arcane_blink:      { name: '傳送術附魔',   color: '#818cf8', desc: '攻速 +18%，技能命中附帶雷電衝擊與【感電】。' },
      frost_nova:          { name: '寒冰新星附魔', color: '#38bdf8', desc: '每 5.5 秒自動在目標處引爆免費寒冰新星（凍結＋易傷）。' },
      m_flame_hydra:       { name: '三頭火蛇附魔', color: '#f97316', desc: '消耗魔力自動召喚免費火蛇協戰，常駐【召喚精通】+15% 全傷！' },
      m_ice_blades:        { name: '寒冰之刃附魔', color: '#38bdf8', desc: '施放冷卻技自動召喚免費寒冰之刃，持續縮短全技能 CD！' },
      m_lightning_spear:   { name: '閃電長矛附魔', color: '#facc15', desc: '拾取電花或暴擊 25% 機率免費召喚追蹤閃電長矛！' },
      m_familiar:          { name: '元素魔寵附魔', color: '#fde047', desc: '常駐元素魔寵輪轉三系，全技能傷害 +22%、幸運一擊率 +10%。' },
      meteor:              { name: '深淵隕石附魔', color: '#fb923c', desc: '幸運一擊／暴擊 20% 機率天降免費深淵隕石（185% 傷＋灼燒）。' },
      m_firewall:          { name: '烈焰火牆附魔', color: '#ef4444', desc: '命中灼燒目標 25% 機率在敵人腳下自動展開免費烈焰火牆！' },
      m_blizzard_field:    { name: '暴風雪附魔',   color: '#7dd3fc', desc: '每 6 秒自動在戰場降下免費極寒暴風雪持續凍結敵群。' },
      m_ball_lightning:    { name: '球狀閃電附魔', color: '#60a5fa', desc: '暴擊 25% 機率在目標處生成免費球狀閃電持續電擊！' },
      black_hole:          { name: '黑洞奇點附魔', color: '#c084fc', desc: '每 8 秒於怪群自動觸發暗影奇點坍縮（165% 傷＋詛咒）。' },
      arcane_orb:          { name: '星界奧球附魔', color: '#a78bfa', desc: '暴擊 25% 機率追加貫穿星界奧球（130% 傷＋易傷）。' },
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


// v241: 暗黑 4 秘法師四大流派「一鍵套用推薦配招（6 招＋雙附魔＋關鍵被動）」
export const MAGE_D4_PRESETS = [
  { id: 'frost_orb', name: '❄️ 永冬冰封球流', color: '#38bdf8', skills: ['m_frost_bolt', 'm_frozen_orb', 'm_ice_armor', 'frost_nova', 'm_ice_blades', 'm_deep_freeze'], enchants: ['m_frozen_orb', 'm_ice_shards'], keystone: 'mk_shatter_frost' },
  { id: 'fire_hydra',name: '🔥 煉獄火蛇火牆', color: '#fb923c', skills: ['m_fire_bolt', 'm_fireball', 'm_flame_shield', 'm_arcane_blink', 'm_flame_hydra', 'm_inferno'], enchants: ['m_fireball', 'm_firewall'], keystone: 'mk_combustion' },
  { id: 'storm_arc', name: '⚡ 不穩電流電花', color: '#a78bfa', skills: ['m_arc_lash', 'chain_lightning', 'm_ice_armor', 'm_arcane_blink', 'm_lightning_spear', 'm_unstable_currents'], enchants: ['m_ball_lightning', 'm_lightning_spear'], keystone: 'mk_vyr_mastery' },
  { id: 'enlighten', name: '🔮 啟蒙三系召喚', color: '#fde047', skills: ['m_spark', 'm_frozen_orb', 'm_flame_shield', 'frost_nova', 'm_familiar', 'm_astral_supernova'], enchants: ['m_fire_bolt', 'm_frozen_orb'], keystone: 'mk_enlightenment' },
];


// v251: 暗黑 4 死靈法師四大流派「一鍵套用推薦配招（6 招＋亡者之書＋關鍵被動）」
export const NECRO_D4_PRESETS = [
  { id: 'necro_army',   name: '💀 亡靈天災大軍', color: '#2dd4bf', skills: ['n_reap_scythe', 'n_blight_pool', 'n_blood_mist', 'n_corpse_tendrils', 'raise_skeleton', 'n_army_scourge'], book: { skeleton: 'reaper', mage: 'shadow_mage', golem: 'blood_golem' }, keystone: 'nk_undead_overlord' },
  { id: 'necro_bone',   name: '🦴 孤高骨矛貫穿', color: '#e2e8f0', skills: ['n_bone_splinters', 'bone_spear', 'n_blood_mist', 'n_corpse_tendrils', 'bone_prison', 'n_bone_storm'], book: { skeleton: 'sacrifice', mage: 'sacrifice', golem: 'sacrifice' }, keystone: 'nk_bone_tyrant' },
  { id: 'necro_blood',  name: '🩸 血湧壓制血浪', color: '#ef4444', skills: ['n_hemorrhage', 'n_blood_surge', 'n_blood_mist', 'n_iron_maiden', 'blood_golem', 'n_blood_wave'], book: { skeleton: 'defender', mage: 'sacrifice', golem: 'blood_golem' }, keystone: 'nk_rathma_vigor' },
  { id: 'necro_shadow', name: '☠️ 暗影屍爆凋零', color: '#a855f7', skills: ['n_decompose', 'n_sever', 'corpse_explosion', 'n_corpse_tendrils', 'n_blight_pool', 'n_soul_rift'], book: { skeleton: 'reaper', mage: 'shadow_mage', golem: 'sacrifice' }, keystone: 'nk_shadowblight' },
];
