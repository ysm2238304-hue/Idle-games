/**
 * buildEngine.js (v233 - 第 1 批：五層深度構築底層引擎)
 * - 涵蓋 6 職業 × 8 招（共 48 招舊技能）完整暗黑 4 標籤、狀態連攜與 4 階專精樹（Lv.2 / Lv.4 3選1 / Lv.6 2選1 / Lv.8 幸運一擊）
 * - 4 大跨狀態複合異常反應（大出血・重創 / 超導碎冰 / 煉獄毒爆 / 靈魂審判）
 * - 壓制傷害（Overpower）與幸運一擊（Lucky Hit）觸發引擎
 * - 智慧連招自動戰鬥優先權評分器
 */

export const STATUS_META = {
  bleed:      { label: '流血', color: '#f87171', icon: '🩸' },
  vulnerable: { label: '易傷', color: '#c084fc', icon: '🎯' },
  freeze:     { label: '凍結', color: '#38bdf8', icon: '❄️' },
  shock:      { label: '感電', color: '#facc15', icon: '⚡' },
  burn:       { label: '灼燒', color: '#fb923c', icon: '🔥' },
  poison:     { label: '中毒', color: '#4ade80', icon: '☠️' },
  curse:      { label: '詛咒', color: '#a78bfa', icon: '🔮' },
  conviction: { label: '定罪', color: '#fde047', icon: '⚖️' },
};

export const COMPOUND_REACTIONS = [
  {
    id: 'hemorrhage',
    name: '大出血・重創',
    need: ['bleed', 'vulnerable'],
    vfx: 'vfx_react_hemorrhage',
    color: '#ef4444',
    prefix: '🩸大出血重創 ',
    dmgMult: 2.25,
    radius: 170,
    cdMs: 2200,
    desc: '流血＋易傷觸發：瞬間引爆 225% 攻擊力猩紅血爆並延長流血。',
  },
  {
    id: 'superconduct',
    name: '超導碎冰',
    need: ['freeze', 'shock'],
    vfx: 'vfx_react_superconduct',
    color: '#38bdf8',
    prefix: '❄️超導碎冰 ',
    dmgMult: 1.95,
    radius: 210,
    cdMs: 2200,
    shredMs: 5000,
    desc: '凍結＋感電觸發：冰雷碎裂範圍爆傷，並使周圍目標承受傷害 +30%（5 秒）。',
  },
  {
    id: 'plaguefire',
    name: '煉獄毒爆',
    need: ['burn', 'poison'],
    vfx: 'vfx_react_plaguefire',
    color: '#a3e635',
    prefix: '☣️煉獄毒爆 ',
    dmgMult: 2.40,
    radius: 200,
    cdMs: 2400,
    desc: '灼燒＋中毒觸發：立即引爆殘餘持續傷害並炸開毒火腐蝕雲。',
  },
  {
    id: 'souljudge',
    name: '靈魂審判',
    need: ['curse', 'conviction'],
    vfx: 'vfx_react_souljudge',
    color: '#fde047',
    prefix: '⚖️靈魂審判 ',
    dmgMult: 2.15,
    pctMaxHp: 0.08,
    radius: 190,
    cdMs: 2600,
    desc: '詛咒＋定罪觸發：降下神聖冥火光柱，附加目標 8% 最大生命真實審判傷（首領減半）。',
  },
];

// 通用 4 階專精樹產生器（為每招技能客製標籤、狀態、機制分歧、屬性轉化與幸運一擊）
function makeSpec(id, role, tags, applies, detonates, t2, t4List, t6List, t8) {
  return { id, role, tags, applies, detonates, t2, t4: t4List, t6: t6List, t8 };
}

export const SKILL_BUILD_SPECS = {
  // ==================== 狂戰士 (8 招重構) ====================
  whirlwind: makeSpec('whirlwind', 'core', ['核心', '物理', '引導'], ['bleed'], ['bleed'],
    { name: '狂風擴張', desc: '傷害 +22%，冷卻 -10%', dmgPct: 22, cdPct: 10 },
    [
      { id: 'a', name: '血刃旋風', desc: '旋轉同時穩定附加【流血】並 +18% 傷', dmgPct: 18, addStatus: 'bleed' },
      { id: 'b', name: '黑洞聚怪旋風', desc: '傷害 +15% 且附加【易傷】觸發大出血', dmgPct: 15, addStatus: 'vulnerable' },
      { id: 'c', name: '雷電塵魔旋風', desc: '附加【感電】且幸運一擊率 +10%', dmgPct: 12, addStatus: 'shock', luckyPct: 10 },
    ],
    [
      { id: 'a', name: '烈焰戰斧轉化', desc: '轉為火焰傷害，附加【灼燒】', elem: 'fire', addStatus: 'burn' },
      { id: 'b', name: '猩紅血煞轉化', desc: '轉為鮮血傷害，壓制率 +8%', elem: 'blood', overpowerPct: 8 },
    ],
    { name: '幸運：血怒回湧', desc: '幸運一擊 25% 機率回復 15 能量並縮短全技能 CD 0.8s', procChance: 0.25, mpRefund: 15, cdRefundMs: 800 }
  ),
  earthshatter: makeSpec('earthshatter', 'core', ['核心', '大地', '控場'], ['vulnerable'], ['bleed'],
    { name: '重震裂隙', desc: '傷害 +25%，壓制率 +5%', dmgPct: 25, overpowerPct: 5 },
    [
      { id: 'a', name: '二次餘震', desc: '額外 +30% 震盪傷害', dmgPct: 30 },
      { id: 'b', name: '破甲碎地', desc: '必掛【易傷】5 秒，聯動流血爆大出血', dmgPct: 14, addStatus: 'vulnerable' },
      { id: 'c', name: '熔岩噴發', desc: '附加【灼燒】並 +20% 範圍爆發', dmgPct: 20, addStatus: 'burn' },
    ],
    [
      { id: 'a', name: '極寒冰震', desc: '轉為冰霜傷害並附加【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '雷霆震擊', desc: '轉為雷電傷害並附加【感電】', elem: 'lightning', addStatus: 'shock' },
    ],
    { name: '幸運：震盪壓制', desc: '幸運一擊 28% 機率觸發額外壓制衝擊', procChance: 0.28, bonusMult: 0.65 }
  ),
  bloodcharge: makeSpec('bloodcharge', 'primer', ['位移', '流血', '回能'], ['bleed'], [],
    { name: '嗜血突進', desc: '冷卻 -15%，傷害 +18%', dmgPct: 18, cdPct: 15 },
    [
      { id: 'a', name: '撕裂貫穿', desc: '同時掛上【流血】＋【易傷】直接爆大出血', dmgPct: 12, addStatus: 'vulnerable' },
      { id: 'b', name: '戰神撞擊', desc: '壓制率 +12%，大幅提高爆發', dmgPct: 22, overpowerPct: 12 },
      { id: 'c', name: '血怒狂衝', desc: '冷卻額外 -12%，高頻起手', dmgPct: 10, cdPct: 12 },
    ],
    [
      { id: 'a', name: '獄火衝鋒', desc: '轉為火焰並附加【灼燒】', elem: 'fire', addStatus: 'burn' },
      { id: 'b', name: '暗影狂襲', desc: '轉為暗影並附加【詛咒】', elem: 'shadow', addStatus: 'curse' },
    ],
    { name: '幸運：連環衝鋒', desc: '幸運一擊 30% 機率返還 1.5s 冷卻', procChance: 0.30, cdRefundMs: 1500 }
  ),
  bladestorm: makeSpec('bladestorm', 'core', ['核心', '火焰', '貫穿'], ['burn'], ['bleed'],
    { name: '熾炎劍氣', desc: '傷害 +24%，暴擊倍率提升', dmgPct: 24 },
    [
      { id: 'a', name: '五連劍氣扇', desc: '劍氣總傷 +30%', dmgPct: 30 },
      { id: 'b', name: '焦土餘燼', desc: '必掛【灼燒】並提高幸運率 +8%', dmgPct: 16, addStatus: 'burn', luckyPct: 8 },
      { id: 'c', name: '破防血波', desc: '附加【易傷】直接串聯大出血', dmgPct: 18, addStatus: 'vulnerable' },
    ],
    [
      { id: 'a', name: '毒焰劍氣', desc: '轉為毒傷並掛【中毒】，自爆煉獄毒爆', elem: 'poison', addStatus: 'poison' },
      { id: 'b', name: '寒霜斬波', desc: '轉為冰霜並掛【凍結】', elem: 'frost', addStatus: 'freeze' },
    ],
    { name: '幸運：劍氣回響', desc: '幸運一擊 25% 機率追加 55% 斬擊回響', procChance: 0.25, bonusMult: 0.55 }
  ),
  warcry: makeSpec('warcry', 'buff', ['戰吼', '增益', '回能'], ['vulnerable'], [],
    { name: '震天怒吼', desc: '冷卻 -15%，傷害 +15%', dmgPct: 15, cdPct: 15 },
    [
      { id: 'a', name: '破膽戰吼', desc: '吼叫附加【易傷】4 秒', dmgPct: 10, addStatus: 'vulnerable' },
      { id: 'b', name: '鮮血戰鼓', desc: '壓制率 +10%，強化後續大招', dmgPct: 12, overpowerPct: 10 },
      { id: 'c', name: '恐懼咆哮', desc: '附加【詛咒】削弱敵人', dmgPct: 10, addStatus: 'curse' },
    ],
    [
      { id: 'a', name: '聖怒戰吼', desc: '附加【定罪】印記', elem: 'holy', addStatus: 'conviction' },
      { id: 'b', name: '雷鳴咆哮', desc: '附加【感電】狀態', elem: 'lightning', addStatus: 'shock' },
    ],
    { name: '幸運：戰意沸騰', desc: '幸運一擊 35% 機率回復 20 能量', procChance: 0.35, mpRefund: 20 }
  ),
  execute_cleave: makeSpec('execute_cleave', 'ultimate', ['終極', '處決', '斬殺'], ['bleed'], ['bleed', 'vulnerable'],
    { name: '無情斷罪', desc: '傷害 +28%，壓制率 +8%', dmgPct: 28, overpowerPct: 8 },
    [
      { id: 'a', name: '血祭處決', desc: '附加【流血】且傷害 +25%', dmgPct: 25, addStatus: 'bleed' },
      { id: 'b', name: '粉碎重斬', desc: '必掛【易傷】並觸發壓制 +12%', dmgPct: 20, addStatus: 'vulnerable', overpowerPct: 12 },
      { id: 'c', name: '連斬狂熱', desc: '冷卻 -18%，高頻斬殺', dmgPct: 15, cdPct: 18 },
    ],
    [
      { id: 'a', name: '聖炎審判斬', desc: '轉為聖光並附加【定罪】', elem: 'holy', addStatus: 'conviction' },
      { id: 'b', name: '冥暗滅絕斬', desc: '轉為暗影並附加【詛咒】', elem: 'shadow', addStatus: 'curse' },
    ],
    { name: '幸運：斬首連環', desc: '幸運一擊 30% 機率縮短 CD 2 秒', procChance: 0.30, cdRefundMs: 2000 }
  ),
  volcano_totem: makeSpec('volcano_totem', 'tactical', ['圖騰', '火焰', '持續'], ['burn'], ['poison'],
    { name: '地核熔爐', desc: '傷害 +22%，冷卻 -12%', dmgPct: 22, cdPct: 12 },
    [
      { id: 'a', name: '雙子火山', desc: '爆發傷害 +28%', dmgPct: 28 },
      { id: 'b', name: '硫磺毒煙', desc: '同時附加【中毒】自觸發煉獄毒爆', dmgPct: 15, addStatus: 'poison' },
      { id: 'c', name: '碎岩震波', desc: '壓制率 +10%', dmgPct: 16, overpowerPct: 10 },
    ],
    [
      { id: 'a', name: '極寒冰柱圖騰', desc: '轉為冰霜並附加【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '雷暴尖塔圖騰', desc: '轉為雷電並附加【感電】', elem: 'lightning', addStatus: 'shock' },
    ],
    { name: '幸運：熔岩連鎖', desc: '幸運一擊 26% 機率追加 60% 火焰衝擊', procChance: 0.26, bonusMult: 0.60 }
  ),
  earth_stomp: makeSpec('earth_stomp', 'defensive', ['控場', '大地', '暈眩'], ['vulnerable'], ['bleed'],
    { name: '撼地巨力', desc: '傷害 +20%，冷卻 -12%', dmgPct: 20, cdPct: 12 },
    [
      { id: 'a', name: '震盪裂甲', desc: '附加【易傷】5 秒', dmgPct: 14, addStatus: 'vulnerable' },
      { id: 'b', name: '焦炎踏擊', desc: '附加【灼燒】', dmgPct: 18, addStatus: 'burn' },
      { id: 'c', name: '泰坦重踏', desc: '壓制率 +12%', dmgPct: 22, overpowerPct: 12 },
    ],
    [
      { id: 'a', name: '冰霜震踏', desc: '轉為寒冰並掛【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '雷霆踐踏', desc: '轉為雷電並掛【感電】', elem: 'lightning', addStatus: 'shock' },
    ],
    { name: '幸運：大地回響', desc: '幸運一擊 28% 機率回魔 15 並縮短 CD 1s', procChance: 0.28, mpRefund: 15, cdRefundMs: 1000 }
  ),

  // ==================== 暗影遊俠 (8 招重構) ====================
  volley: makeSpec('volley', 'primer', ['基礎', '射擊', '貫穿'], ['vulnerable'], [],
    { name: '強化箭簇', desc: '傷害 +20%，冷卻 -12%', dmgPct: 20, cdPct: 12 },
    [
      { id: 'a', name: '破甲散射', desc: '穩定施加【易傷】', dmgPct: 15, addStatus: 'vulnerable' },
      { id: 'b', name: '淬毒箭羽', desc: '附加【中毒】狀態', dmgPct: 15, addStatus: 'poison' },
      { id: 'c', name: '疾風連發', desc: '幸運一擊率 +12%', dmgPct: 14, luckyPct: 12 },
    ],
    [
      { id: 'a', name: '烈焰火箭', desc: '轉為火焰並掛【灼燒】', elem: 'fire', addStatus: 'burn' },
      { id: 'b', name: '冰霜寒箭', desc: '轉為寒冰並掛【凍結】', elem: 'frost', addStatus: 'freeze' },
    ],
    { name: '幸運：回能連射', desc: '幸運一擊 28% 機率回復 16 精力', procChance: 0.28, mpRefund: 16 }
  ),
  arrowrain: makeSpec('arrowrain', 'ultimate', ['終極', '箭雨', '範圍'], ['poison', 'vulnerable'], ['poison'],
    { name: '覆蓋箭幕', desc: '傷害 +25%，冷卻 -10%', dmgPct: 25, cdPct: 10 },
    [
      { id: 'a', name: '劇毒天降', desc: '必掛【中毒】且傷害 +20%', dmgPct: 20, addStatus: 'poison' },
      { id: 'b', name: '烈焰火箭雨', desc: '附加【灼燒】，配中毒爆煉獄毒爆', dmgPct: 22, addStatus: 'burn' },
      { id: 'c', name: '穿雲弱點雨', desc: '附加【易傷】並 +10% 幸運一擊', dmgPct: 16, addStatus: 'vulnerable', luckyPct: 10 },
    ],
    [
      { id: 'a', name: '極寒冰箭雨', desc: '轉為寒冰並掛【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '雷霆箭雨', desc: '轉為雷電並掛【感電】', elem: 'lightning', addStatus: 'shock' },
    ],
    { name: '幸運：箭雨延續', desc: '幸運一擊 25% 機率追加 60% 追蹤箭爆', procChance: 0.25, bonusMult: 0.60 }
  ),
  shadowstep: makeSpec('shadowstep', 'defensive', ['位移', '暗影', '控場'], ['vulnerable'], [],
    { name: '無聲影步', desc: '冷卻 -15%，傷害 +18%', dmgPct: 18, cdPct: 15 },
    [
      { id: 'a', name: '暗影背襲', desc: '必掛【易傷】＋【流血】', dmgPct: 16, addStatus: 'bleed' },
      { id: 'b', name: '毒霧殘影', desc: '附加【中毒】', dmgPct: 15, addStatus: 'poison' },
      { id: 'c', name: '靈動閃身', desc: '冷卻再 -12%', dmgPct: 10, cdPct: 12 },
    ],
    [
      { id: 'a', name: '電光瞬步', desc: '轉為雷電並掛【感電】', elem: 'lightning', addStatus: 'shock' },
      { id: 'b', name: '寒影瞬步', desc: '轉為冰霜並掛【凍結】', elem: 'frost', addStatus: 'freeze' },
    ],
    { name: '幸運：影步重置', desc: '幸運一擊 30% 機率返還 1.5s CD', procChance: 0.30, cdRefundMs: 1500 }
  ),
  phantombow: makeSpec('phantombow', 'core', ['核心', '狙擊', '貫穿'], ['bleed'], ['vulnerable'],
    { name: '幻影穿心', desc: '傷害 +26%，壓制率 +6%', dmgPct: 26, overpowerPct: 6 },
    [
      { id: 'a', name: '穿血狙殺', desc: '附加【流血】，對易傷引爆大出血', dmgPct: 22, addStatus: 'bleed' },
      { id: 'b', name: '毒牙狙擊', desc: '附加【中毒】並 +20% 傷', dmgPct: 20, addStatus: 'poison' },
      { id: 'c', name: '雙箭齊發', desc: '總傷 +30%', dmgPct: 30 },
    ],
    [
      { id: 'a', name: '聖光破魔箭', desc: '轉為聖光並掛【定罪】', elem: 'holy', addStatus: 'conviction' },
      { id: 'b', name: '冥火穿魂箭', desc: '轉為暗影並掛【詛咒】', elem: 'shadow', addStatus: 'curse' },
    ],
    { name: '幸運：致命追擊', desc: '幸運一擊 28% 機率追加 70% 穿刺傷', procChance: 0.28, bonusMult: 0.70 }
  ),
  windwalk: makeSpec('windwalk', 'buff', ['增益', '疾風', '機動'], [], [],
    { name: '御風而行', desc: '冷卻 -15%，幸運一擊率 +8%', cdPct: 15, luckyPct: 8 },
    [
      { id: 'a', name: '疾風破甲', desc: '攻擊附帶【易傷】', dmgPct: 14, addStatus: 'vulnerable' },
      { id: 'b', name: '風暴殘影', desc: '附加【感電】', dmgPct: 14, addStatus: 'shock' },
      { id: 'c', name: '狩獵直覺', desc: '壓制率 +10%', dmgPct: 15, overpowerPct: 10 },
    ],
    [
      { id: 'a', name: '焰風步', desc: '附加【灼燒】', elem: 'fire', addStatus: 'burn' },
      { id: 'b', name: '毒風步', desc: '附加【中毒】', elem: 'poison', addStatus: 'poison' },
    ],
    { name: '幸運：疾風回能', desc: '幸運一擊 35% 機率回復 20 精力', procChance: 0.35, mpRefund: 20 }
  ),
  caltrops: makeSpec('caltrops', 'tactical', ['陷阱', '劇毒', '控場'], ['poison'], ['burn'],
    { name: '深毒蒺藜', desc: '傷害 +22%，冷卻 -12%', dmgPct: 22, cdPct: 12 },
    [
      { id: 'a', name: '爆裂毒雷', desc: '同時附加【灼燒】，直接觸發煉獄毒爆', dmgPct: 18, addStatus: 'burn' },
      { id: 'b', name: '倒鉤血釘', desc: '附加【流血】＋【易傷】', dmgPct: 16, addStatus: 'bleed' },
      { id: 'c', name: '麻痺陷阱', desc: '附加【感電】', dmgPct: 16, addStatus: 'shock' },
    ],
    [
      { id: 'a', name: '寒冰地雷', desc: '轉為冰霜並掛【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '詛咒荊棘', desc: '轉為暗影並掛【詛咒】', elem: 'shadow', addStatus: 'curse' },
    ],
    { name: '幸運：陷阱再裝填', desc: '幸運一擊 30% 機率縮短 CD 1.5s', procChance: 0.30, cdRefundMs: 1500 }
  ),
  shadow_clones: makeSpec('shadow_clones', 'tactical', ['分身', '暗影', '爆發'], ['vulnerable'], [],
    { name: '雙影協攻', desc: '傷害 +24%，冷卻 -10%', dmgPct: 24, cdPct: 10 },
    [
      { id: 'a', name: '血影分身', desc: '分身附加【流血】', dmgPct: 20, addStatus: 'bleed' },
      { id: 'b', name: '毒影分身', desc: '分身附加【中毒】', dmgPct: 20, addStatus: 'poison' },
      { id: 'c', name: '自爆幻影', desc: '額外 +28% 範圍爆發', dmgPct: 28 },
    ],
    [
      { id: 'a', name: '雷影分身', desc: '轉為雷電並掛【感電】', elem: 'lightning', addStatus: 'shock' },
      { id: 'b', name: '焰影分身', desc: '轉為火焰並掛【灼燒】', elem: 'fire', addStatus: 'burn' },
    ],
    { name: '幸運：影分身共鳴', desc: '幸運一擊 26% 機率追加 60% 暗影斬', procChance: 0.26, bonusMult: 0.60 }
  ),
  death_mark: makeSpec('death_mark', 'primer', ['標記', '易傷', '爆發'], ['vulnerable', 'curse'], ['bleed'],
    { name: '死神凝視', desc: '傷害 +22%，冷卻 -15%', dmgPct: 22, cdPct: 15 },
    [
      { id: 'a', name: '死亡連鎖', desc: '同時掛【易傷】＋【流血】', dmgPct: 18, addStatus: 'bleed' },
      { id: 'b', name: '審判死印', desc: '附加【定罪】，直接聯動靈魂審判', dmgPct: 18, addStatus: 'conviction' },
      { id: 'c', name: '致命弱點', desc: '壓制率 +12%', dmgPct: 22, overpowerPct: 12 },
    ],
    [
      { id: 'a', name: '腐毒印記', desc: '附加【中毒】', elem: 'poison', addStatus: 'poison' },
      { id: 'b', name: '灼魂印記', desc: '附加【灼燒】', elem: 'fire', addStatus: 'burn' },
    ],
    { name: '幸運：死印回收', desc: '幸運一擊 32% 機率返還 1.8s CD', procChance: 0.32, cdRefundMs: 1800 }
  ),

  // ==================== 秘法師 (8 招重構) ====================
  meteor: makeSpec('meteor', 'ultimate', ['終極', '火焰', '範圍'], ['burn'], ['burn', 'poison'],
    { name: '巨型隕石', desc: '傷害 +28%，壓制率 +6%', dmgPct: 28, overpowerPct: 6 },
    [
      { id: 'a', name: '隕石雨群', desc: '總傷 +30%，灼燒覆蓋全場', dmgPct: 30, addStatus: 'burn' },
      { id: 'b', name: '毒炎星隕', desc: '附加【中毒】直接引爆煉獄毒爆', dmgPct: 20, addStatus: 'poison' },
      { id: 'c', name: '碎甲衝擊', desc: '附加【易傷】5 秒', dmgPct: 20, addStatus: 'vulnerable' },
    ],
    [
      { id: 'a', name: '極寒冰隕', desc: '轉為冰霜並掛【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '天雷星隕', desc: '轉為雷電並掛【感電】', elem: 'lightning', addStatus: 'shock' },
    ],
    { name: '幸運：二次墜落', desc: '幸運一擊 25% 機率再砸 65% 隕石衝擊', procChance: 0.25, bonusMult: 0.65 }
  ),
  arcane_orb: makeSpec('arcane_orb', 'primer', ['基礎', '奧術', '貫穿'], ['vulnerable'], [],
    { name: '星界聚能', desc: '傷害 +22%，冷卻 -12%', dmgPct: 22, cdPct: 12 },
    [
      { id: 'a', name: '冰凍法球', desc: '附加【凍結】', dmgPct: 16, addStatus: 'freeze' },
      { id: 'b', name: '感電法球', desc: '附加【感電】', dmgPct: 16, addStatus: 'shock' },
      { id: 'c', name: '分裂法球', desc: '傷害 +26%', dmgPct: 26 },
    ],
    [
      { id: 'a', name: '烈焰火球', desc: '轉為火焰並掛【灼燒】', elem: 'fire', addStatus: 'burn' },
      { id: 'b', name: '冥暗蝕球', desc: '轉為暗影並掛【詛咒】', elem: 'shadow', addStatus: 'curse' },
    ],
    { name: '幸運：奧術回流', desc: '幸運一擊 30% 機率回復 18 MP', procChance: 0.30, mpRefund: 18 }
  ),
  frost_nova: makeSpec('frost_nova', 'defensive', ['防禦', '冰霜', '控場'], ['freeze', 'vulnerable'], ['shock'],
    { name: '極寒擴散', desc: '傷害 +20%，冷卻 -15%', dmgPct: 20, cdPct: 15 },
    [
      { id: 'a', name: '碎冰易傷', desc: '必掛【易傷】且傷害 +20%', dmgPct: 20, addStatus: 'vulnerable' },
      { id: 'b', name: '冰雷爆環', desc: '同時附加【感電】直接炸超導碎冰', dmgPct: 18, addStatus: 'shock' },
      { id: 'c', name: '冰霜護體', desc: '壓制率 +10%', dmgPct: 16, overpowerPct: 10 },
    ],
    [
      { id: 'a', name: '烈焰新星', desc: '轉為火焰並掛【灼燒】', elem: 'fire', addStatus: 'burn' },
      { id: 'b', name: '劇毒新星', desc: '轉為毒素並掛【中毒】', elem: 'poison', addStatus: 'poison' },
    ],
    { name: '幸運：急凍重置', desc: '幸運一擊 30% 機率縮短 CD 1.5s', procChance: 0.30, cdRefundMs: 1500 }
  ),
  void_beam: makeSpec('void_beam', 'core', ['核心', '虛空', '射線'], ['curse'], ['vulnerable'],
    { name: '虛空聚焦', desc: '傷害 +25%，幸運率 +8%', dmgPct: 25, luckyPct: 8 },
    [
      { id: 'a', name: '裂解射線', desc: '附加【易傷】且傷害 +22%', dmgPct: 22, addStatus: 'vulnerable' },
      { id: 'b', name: '審判光束', desc: '附加【定罪】觸發靈魂審判', dmgPct: 18, addStatus: 'conviction' },
      { id: 'c', name: '過載星爆', desc: '傷害 +30%', dmgPct: 30 },
    ],
    [
      { id: 'a', name: '極寒射線', desc: '轉為冰霜並掛【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '灼熱光束', desc: '轉為火焰並掛【灼燒】', elem: 'fire', addStatus: 'burn' },
    ],
    { name: '幸運：虛空穿透', desc: '幸運一擊 26% 機率追加 60% 虛空爆傷', procChance: 0.26, bonusMult: 0.60 }
  ),
  mana_overload: makeSpec('mana_overload', 'buff', ['增益', '奧術', '回魔'], ['shock'], [],
    { name: '魔能湧流', desc: '冷卻 -15%，幸運率 +10%', cdPct: 15, luckyPct: 10 },
    [
      { id: 'a', name: '電弧超載', desc: '周圍附加【感電】', dmgPct: 16, addStatus: 'shock' },
      { id: 'b', name: '灼熱過載', desc: '附加【灼燒】', dmgPct: 16, addStatus: 'burn' },
      { id: 'c', name: '壓制魔能', desc: '壓制率 +12%', dmgPct: 18, overpowerPct: 12 },
    ],
    [
      { id: 'a', name: '冰霜超載', desc: '附加【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '暗影超載', desc: '附加【詛咒】', elem: 'shadow', addStatus: 'curse' },
    ],
    { name: '幸運：無限魔泉', desc: '幸運一擊 35% 機率回復 25 MP', procChance: 0.35, mpRefund: 25 }
  ),
  chain_lightning: makeSpec('chain_lightning', 'core', ['核心', '雷電', '連鎖'], ['shock'], ['freeze'],
    { name: '高壓連鎖', desc: '傷害 +24%，幸運率 +10%', dmgPct: 24, luckyPct: 10 },
    [
      { id: 'a', name: '超導雷鏈', desc: '附加【凍結】自爆超導碎冰', dmgPct: 18, addStatus: 'freeze' },
      { id: 'b', name: '九連電弧', desc: '傷害 +28%', dmgPct: 28 },
      { id: 'c', name: '破防雷擊', desc: '附加【易傷】', dmgPct: 16, addStatus: 'vulnerable' },
    ],
    [
      { id: 'a', name: '熾炎火鏈', desc: '轉為火焰並掛【灼燒】', elem: 'fire', addStatus: 'burn' },
      { id: 'b', name: '聖光懲戒鏈', desc: '轉為聖光並掛【定罪】', elem: 'holy', addStatus: 'conviction' },
    ],
    { name: '幸運：雷球彈跳', desc: '幸運一擊 28% 機率追加 55% 電弧爆擊', procChance: 0.28, bonusMult: 0.55 }
  ),
  icicle_rain: makeSpec('icicle_rain', 'core', ['核心', '冰霜', '範圍'], ['freeze'], ['shock'],
    { name: '暴雪冰錐', desc: '傷害 +24%，冷卻 -10%', dmgPct: 24, cdPct: 10 },
    [
      { id: 'a', name: '雷冰暴雪', desc: '同時掛【感電】觸發超導碎冰', dmgPct: 18, addStatus: 'shock' },
      { id: 'b', name: '極寒穿刺', desc: '附加【易傷】並 +20% 傷', dmgPct: 20, addStatus: 'vulnerable' },
      { id: 'c', name: '巨型冰槍', desc: '傷害 +28%', dmgPct: 28 },
    ],
    [
      { id: 'a', name: '劇毒酸雨', desc: '轉為毒傷並掛【中毒】', elem: 'poison', addStatus: 'poison' },
      { id: 'b', name: '血刃冰雨', desc: '轉為鮮血並掛【流血】', elem: 'blood', addStatus: 'bleed' },
    ],
    { name: '幸運：碎冰齊射', desc: '幸運一擊 26% 機率追加 58% 冰爆', procChance: 0.26, bonusMult: 0.58 }
  ),
  black_hole: makeSpec('black_hole', 'tactical', ['控場', '虛空', '聚怪'], ['curse', 'vulnerable'], [],
    { name: '重力坍縮', desc: '傷害 +24%，冷卻 -12%', dmgPct: 24, cdPct: 12 },
    [
      { id: 'a', name: '審判黑洞', desc: '附加【定罪】引爆靈魂審判', dmgPct: 20, addStatus: 'conviction' },
      { id: 'b', name: '感電奇點', desc: '附加【感電】', dmgPct: 18, addStatus: 'shock' },
      { id: 'c', name: '超新星坍縮', desc: '壓制率 +12%', dmgPct: 24, overpowerPct: 12 },
    ],
    [
      { id: 'a', name: '熔火黑洞', desc: '轉為火焰並掛【灼燒】', elem: 'fire', addStatus: 'burn' },
      { id: 'b', name: '極寒奇點', desc: '轉為冰霜並掛【凍結】', elem: 'frost', addStatus: 'freeze' },
    ],
    { name: '幸運：奇點回能', desc: '幸運一擊 30% 機率回復 20 MP 並減 CD 1.2s', procChance: 0.30, mpRefund: 20, cdRefundMs: 1200 }
  ),

  // ==================== 聖殿騎士 (8 招重構) ====================
  blessed_hammer: makeSpec('blessed_hammer', 'core', ['核心', '聖光', '旋轉'], ['conviction'], ['curse'],
    { name: '祝福雙鎚', desc: '傷害 +24%，冷卻 -10%', dmgPct: 24, cdPct: 10 },
    [
      { id: 'a', name: '熾炎聖鎚', desc: '附加【灼燒】且傷害 +20%', dmgPct: 20, addStatus: 'burn' },
      { id: 'b', name: '雷霆聖鎚', desc: '附加【感電】並 +8% 幸運率', dmgPct: 18, addStatus: 'shock', luckyPct: 8 },
      { id: 'c', name: '破邪巨鎚', desc: '壓制率 +10%', dmgPct: 22, overpowerPct: 10 },
    ],
    [
      { id: 'a', name: '極寒聖鎚', desc: '轉為冰霜並掛【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '冥火審判鎚', desc: '轉為暗影並掛【詛咒】自爆靈魂審判', elem: 'shadow', addStatus: 'curse' },
    ],
    { name: '幸運：聖鎚分裂', desc: '幸運一擊 26% 機率追加 55% 聖光衝擊', procChance: 0.26, bonusMult: 0.55 }
  ),
  heaven_fist: makeSpec('heaven_fist', 'core', ['核心', '雷電', '聖光'], ['conviction', 'shock'], ['curse'],
    { name: '天界雷拳', desc: '傷害 +25%，幸運率 +8%', dmgPct: 25, luckyPct: 8 },
    [
      { id: 'a', name: '審判裂雷', desc: '附加【詛咒】直接引爆靈魂審判', dmgPct: 18, addStatus: 'curse' },
      { id: 'b', name: '天罰震爆', desc: '傷害 +28%', dmgPct: 28 },
      { id: 'c', name: '神聖破甲', desc: '附加【易傷】', dmgPct: 18, addStatus: 'vulnerable' },
    ],
    [
      { id: 'a', name: '極寒天拳', desc: '轉為冰霜並掛【凍結】爆超導碎冰', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '烈陽天拳', desc: '轉為火焰並掛【灼燒】', elem: 'fire', addStatus: 'burn' },
    ],
    { name: '幸運：天雷連降', desc: '幸運一擊 28% 機率追加 62% 聖雷傷', procChance: 0.28, bonusMult: 0.62 }
  ),
  judgment: makeSpec('judgment', 'ultimate', ['終極', '聖光', '審判'], ['conviction', 'vulnerable'], ['curse'],
    { name: '神聖裁決', desc: '傷害 +28%，壓制率 +8%', dmgPct: 28, overpowerPct: 8 },
    [
      { id: 'a', name: '靈魂裁決', desc: '同時附加【詛咒】必爆靈魂審判', dmgPct: 20, addStatus: 'curse' },
      { id: 'b', name: '烈日制裁', desc: '附加【灼燒】且傷害 +25%', dmgPct: 25, addStatus: 'burn' },
      { id: 'c', name: '永恆定罪', desc: '冷卻 -15%，高頻大招', dmgPct: 18, cdPct: 15 },
    ],
    [
      { id: 'a', name: '血焰審判', desc: '轉為鮮血並掛【流血】', elem: 'blood', addStatus: 'bleed' },
      { id: 'b', name: '雷霆審判', desc: '轉為雷電並掛【感電】', elem: 'lightning', addStatus: 'shock' },
    ],
    { name: '幸運：神聖餘暉', desc: '幸運一擊 28% 機率縮短 CD 2 秒', procChance: 0.28, cdRefundMs: 2000 }
  ),
  divine_storm: makeSpec('divine_storm', 'core', ['核心', '聖光', '範圍'], ['conviction'], [],
    { name: '神聖颶風', desc: '傷害 +24%，冷卻 -10%', dmgPct: 24, cdPct: 10 },
    [
      { id: 'a', name: '淨化風暴', desc: '附加【易傷】', dmgPct: 18, addStatus: 'vulnerable' },
      { id: 'b', name: '熾熱風暴', desc: '附加【灼燒】', dmgPct: 20, addStatus: 'burn' },
      { id: 'c', name: '壓制風暴', desc: '壓制率 +12%', dmgPct: 22, overpowerPct: 12 },
    ],
    [
      { id: 'a', name: '冰霜聖暴', desc: '轉為冰霜並掛【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '暗影聖暴', desc: '轉為暗影並掛【詛咒】', elem: 'shadow', addStatus: 'curse' },
    ],
    { name: '幸運：風暴回能', desc: '幸運一擊 30% 機率回復 18 聖能', procChance: 0.30, mpRefund: 18 }
  ),
  shield_bash: makeSpec('shield_bash', 'primer', ['基礎', '護盾', '壓制'], ['vulnerable'], [],
    { name: '重盾猛撞', desc: '傷害 +22%，壓制率 +8%', dmgPct: 22, overpowerPct: 8 },
    [
      { id: 'a', name: '破甲盾擊', desc: '必掛【易傷】並 +18% 傷', dmgPct: 18, addStatus: 'vulnerable' },
      { id: 'b', name: '荊棘重盾', desc: '附加【流血】觸發大出血', dmgPct: 16, addStatus: 'bleed' },
      { id: 'c', name: '定罪重擊', desc: '附加【定罪】', dmgPct: 16, addStatus: 'conviction' },
    ],
    [
      { id: 'a', name: '火焰盾擊', desc: '轉為火焰並掛【灼燒】', elem: 'fire', addStatus: 'burn' },
      { id: 'b', name: '雷電盾擊', desc: '轉為雷電並掛【感電】', elem: 'lightning', addStatus: 'shock' },
    ],
    { name: '幸運：盾擊連打', desc: '幸運一擊 30% 機率縮短 CD 1.2s', procChance: 0.30, cdRefundMs: 1200 }
  ),
  holy_aegis: makeSpec('holy_aegis', 'defensive', ['防禦', '護盾', '聖光'], ['conviction'], [],
    { name: '不朽神盾', desc: '冷卻 -15%，壓制率 +8%', cdPct: 15, overpowerPct: 8 },
    [
      { id: 'a', name: '復仇聖盾', desc: '傷害 +22%', dmgPct: 22 },
      { id: 'b', name: '致盲神盾', desc: '附加【易傷】', dmgPct: 14, addStatus: 'vulnerable' },
      { id: 'c', name: '聖能湧泉', desc: '幸運率 +10%', dmgPct: 12, luckyPct: 10 },
    ],
    [
      { id: 'a', name: '寒冰神盾', desc: '附加【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '烈焰神盾', desc: '附加【灼燒】', elem: 'fire', addStatus: 'burn' },
    ],
    { name: '幸運：神盾反震', desc: '幸運一擊 30% 機率回復 20 聖能', procChance: 0.30, mpRefund: 20 }
  ),
  consecration: makeSpec('consecration', 'tactical', ['領域', '聖光', '持續'], ['conviction', 'burn'], [],
    { name: '廣域聖地', desc: '傷害 +24%，冷卻 -12%', dmgPct: 24, cdPct: 12 },
    [
      { id: 'a', name: '審判聖域', desc: '附加【詛咒】自爆靈魂審判', dmgPct: 18, addStatus: 'curse' },
      { id: 'b', name: '焦炎奉獻', desc: '附加【灼燒】且傷害 +24%', dmgPct: 24, addStatus: 'burn' },
      { id: 'c', name: '神聖壓制域', desc: '壓制率 +12%', dmgPct: 20, overpowerPct: 12 },
    ],
    [
      { id: 'a', name: '極寒聖地', desc: '轉為冰霜並掛【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '雷霆聖地', desc: '轉為雷電並掛【感電】', elem: 'lightning', addStatus: 'shock' },
    ],
    { name: '幸運：聖火爆發', desc: '幸運一擊 25% 機率追加 58% 聖火傷', procChance: 0.25, bonusMult: 0.58 }
  ),
  radiant_aura: makeSpec('radiant_aura', 'buff', ['光環', '增益', '懲戒'], ['conviction'], [],
    { name: '耀眼光環', desc: '冷卻 -15%，傷害 +18%', dmgPct: 18, cdPct: 15 },
    [
      { id: 'a', name: '懲戒破甲', desc: '附加【易傷】', dmgPct: 15, addStatus: 'vulnerable' },
      { id: 'b', name: '烈陽灼目', desc: '附加【灼燒】', dmgPct: 18, addStatus: 'burn' },
      { id: 'c', name: '天恩幸運', desc: '幸運率 +12%', dmgPct: 12, luckyPct: 12 },
    ],
    [
      { id: 'a', name: '電弧光環', desc: '附加【感電】', elem: 'lightning', addStatus: 'shock' },
      { id: 'b', name: '冥火光環', desc: '附加【詛咒】', elem: 'shadow', addStatus: 'curse' },
    ],
    { name: '幸運：光環共鳴', desc: '幸運一擊 32% 機率回復 18 聖能', procChance: 0.32, mpRefund: 18 }
  ),

  // ==================== 死靈法師 (8 招重構) ====================
  raise_skeleton: makeSpec('raise_skeleton', 'tactical', ['召喚', '亡靈', '協戰'], ['curse'], [],
    { name: '精銳骸骨', desc: '召喚物傷害 +24%，冷卻 -12%', dmgPct: 24, cdPct: 12 },
    [
      { id: 'a', name: '收割者骷髏', desc: '攻擊附加【流血】', dmgPct: 18, addStatus: 'bleed' },
      { id: 'b', name: '冰霜法師骷髏', desc: '附加【凍結】', dmgPct: 18, addStatus: 'freeze' },
      { id: 'c', name: '狂暴骷髏', desc: '總傷 +28%', dmgPct: 28 },
    ],
    [
      { id: 'a', name: '瘟疫骷髏', desc: '轉為毒傷並掛【中毒】', elem: 'poison', addStatus: 'poison' },
      { id: 'b', name: '暗影審判骷髏', desc: '附加【定罪】', elem: 'holy', addStatus: 'conviction' },
    ],
    { name: '幸運：骸骨復燃', desc: '幸運一擊 28% 機率回復 18 魂能', procChance: 0.28, mpRefund: 18 }
  ),
  blood_golem: makeSpec('blood_golem', 'defensive', ['召喚', '鮮血', '坦克'], ['bleed'], ['vulnerable'],
    { name: '巨型血魔', desc: '傷害 +24%，壓制率 +10%', dmgPct: 24, overpowerPct: 10 },
    [
      { id: 'a', name: '鮮血重擊', desc: '附加【流血】＋【易傷】爆大出血', dmgPct: 18, addStatus: 'vulnerable' },
      { id: 'b', name: '骨刺魔像', desc: '壓制率 +12%', dmgPct: 22, overpowerPct: 12 },
      { id: 'c', name: '血爆魔像', desc: '傷害 +28%', dmgPct: 28 },
    ],
    [
      { id: 'a', name: '劇毒腐肉魔像', desc: '轉為毒傷並掛【中毒】', elem: 'poison', addStatus: 'poison' },
      { id: 'b', name: '冥火魔像', desc: '轉為火焰並掛【灼燒】', elem: 'fire', addStatus: 'burn' },
    ],
    { name: '幸運：血球汲取', desc: '幸運一擊 28% 機率追加 60% 血潮傷', procChance: 0.28, bonusMult: 0.60 }
  ),
  undead_frenzy: makeSpec('undead_frenzy', 'buff', ['增益', '亡靈', '狂熱'], ['curse'], [],
    { name: '冥界號角', desc: '冷卻 -15%，傷害 +18%', dmgPct: 18, cdPct: 15 },
    [
      { id: 'a', name: '噬血狂熱', desc: '附加【流血】', dmgPct: 16, addStatus: 'bleed' },
      { id: 'b', name: '枯萎狂熱', desc: '附加【中毒】', dmgPct: 16, addStatus: 'poison' },
      { id: 'c', name: '死靈幸運', desc: '幸運率 +12%', dmgPct: 14, luckyPct: 12 },
    ],
    [
      { id: 'a', name: '雷電狂熱', desc: '附加【感電】', elem: 'lightning', addStatus: 'shock' },
      { id: 'b', name: '聖譴狂熱', desc: '附加【定罪】', elem: 'holy', addStatus: 'conviction' },
    ],
    { name: '幸運：魂能沸騰', desc: '幸運一擊 35% 機率回復 22 魂能', procChance: 0.35, mpRefund: 22 }
  ),
  wraith_army: makeSpec('wraith_army', 'ultimate', ['終極', '冥靈', '範圍'], ['curse', 'vulnerable'], ['conviction'],
    { name: '冥界潮汐', desc: '傷害 +28%，冷卻 -10%', dmgPct: 28, cdPct: 10 },
    [
      { id: 'a', name: '審判亡靈潮', desc: '附加【定罪】全場引爆靈魂審判', dmgPct: 20, addStatus: 'conviction' },
      { id: 'b', name: '冰霜幽魂軍', desc: '附加【凍結】', dmgPct: 20, addStatus: 'freeze' },
      { id: 'c', name: '吞噬千魂', desc: '總傷 +32%', dmgPct: 32 },
    ],
    [
      { id: 'a', name: '冥火幽魂', desc: '轉為火焰並掛【灼燒】', elem: 'fire', addStatus: 'burn' },
      { id: 'b', name: '瘟疫幽魂', desc: '轉為毒傷並掛【中毒】', elem: 'poison', addStatus: 'poison' },
    ],
    { name: '幸運：靈魂收割', desc: '幸運一擊 28% 機率縮短 CD 2 秒', procChance: 0.28, cdRefundMs: 2000 }
  ),
  bone_spear: makeSpec('bone_spear', 'core', ['核心', '白骨', '貫穿'], ['vulnerable'], ['bleed'],
    { name: '超自然骨矛', desc: '傷害 +26%，壓制率 +6%', dmgPct: 26, overpowerPct: 6 },
    [
      { id: 'a', name: '五向骨片分裂', desc: '傷害 +30% 並必掛【易傷】', dmgPct: 30, addStatus: 'vulnerable' },
      { id: 'b', name: '鮮血骨矛', desc: '附加【流血】自爆大出血', dmgPct: 20, addStatus: 'bleed' },
      { id: 'c', name: '靈魂貫穿', desc: '附加【定罪】聯動靈魂審判', dmgPct: 20, addStatus: 'conviction' },
    ],
    [
      { id: 'a', name: '極寒冰矛', desc: '轉為冰霜並掛【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '劇毒骨矛', desc: '轉為毒傷並掛【中毒】', elem: 'poison', addStatus: 'poison' },
    ],
    { name: '幸運：骨片回彈', desc: '幸運一擊 28% 機率追加 65% 骨片回擊', procChance: 0.28, bonusMult: 0.65 }
  ),
  corpse_explosion: makeSpec('corpse_explosion', 'core', ['核心', '屍爆', '範圍'], ['poison'], ['burn', 'curse'],
    { name: '連環屍爆', desc: '傷害 +25%，冷卻 -12%', dmgPct: 25, cdPct: 12 },
    [
      { id: 'a', name: '瘟疫屍霧', desc: '附加【灼燒】直接引爆煉獄毒爆', dmgPct: 20, addStatus: 'burn' },
      { id: 'b', name: '血腥屍爆', desc: '附加【流血】且壓制率 +10%', dmgPct: 22, addStatus: 'bleed', overpowerPct: 10 },
      { id: 'c', name: '深淵廣域爆', desc: '總傷 +28%', dmgPct: 28 },
    ],
    [
      { id: 'a', name: '冰霜屍爆', desc: '轉為冰霜並掛【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '聖炎淨化屍爆', desc: '轉為聖光並掛【定罪】', elem: 'holy', addStatus: 'conviction' },
    ],
    { name: '幸運：二次殉爆', desc: '幸運一擊 28% 機率再炸 62% 屍爆', procChance: 0.28, bonusMult: 0.62 }
  ),
  bone_prison: makeSpec('bone_prison', 'defensive', ['控場', '白骨', '易傷'], ['vulnerable', 'curse'], [],
    { name: '強化骨牢', desc: '冷卻 -15%，傷害 +20%', dmgPct: 20, cdPct: 15 },
    [
      { id: 'a', name: '枯萎骨牢', desc: '附加【中毒】', dmgPct: 18, addStatus: 'poison' },
      { id: 'b', name: '尖刺血牢', desc: '附加【流血】', dmgPct: 18, addStatus: 'bleed' },
      { id: 'c', name: '審判骨牢', desc: '附加【定罪】', dmgPct: 18, addStatus: 'conviction' },
    ],
    [
      { id: 'a', name: '寒冰囚籠', desc: '轉為冰霜並掛【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '煉獄火牢', desc: '轉為火焰並掛【灼燒】', elem: 'fire', addStatus: 'burn' },
    ],
    { name: '幸運：骨牢回能', desc: '幸運一擊 30% 機率回復 20 魂能', procChance: 0.30, mpRefund: 20 }
  ),
  decrepify: makeSpec('decrepify', 'primer', ['基礎', '詛咒', '減速'], ['curse'], [],
    { name: '衰老蔓延', desc: '冷卻 -15%，傷害 +18%', dmgPct: 18, cdPct: 15 },
    [
      { id: 'a', name: '審判衰老', desc: '同時掛【定罪】引爆靈魂審判', dmgPct: 16, addStatus: 'conviction' },
      { id: 'b', name: '脆弱衰老', desc: '附加【易傷】', dmgPct: 16, addStatus: 'vulnerable' },
      { id: 'c', name: '絕望減CD', desc: '幸運率 +12%', dmgPct: 12, luckyPct: 12 },
    ],
    [
      { id: 'a', name: '劇毒詛咒', desc: '附加【中毒】', elem: 'poison', addStatus: 'poison' },
      { id: 'b', name: '灼魂詛咒', desc: '附加【灼燒】', elem: 'fire', addStatus: 'burn' },
    ],
    { name: '幸運：衰老減CD', desc: '幸運一擊 32% 機率縮短全技能 CD 1.2s', procChance: 0.32, cdRefundMs: 1200 }
  ),

  // ==================== 影殺刺客 (8 招重構) ====================
  shadow_blitz: makeSpec('shadow_blitz', 'primer', ['基礎', '位移', '暗影'], ['vulnerable'], [],
    { name: '疾影閃切', desc: '傷害 +22%，冷卻 -15%', dmgPct: 22, cdPct: 15 },
    [
      { id: 'a', name: '割喉閃襲', desc: '必掛【流血】＋【易傷】爆大出血', dmgPct: 18, addStatus: 'bleed' },
      { id: 'b', name: '毒刃閃襲', desc: '附加【中毒】', dmgPct: 18, addStatus: 'poison' },
      { id: 'c', name: '雷光閃襲', desc: '附加【感電】並 +10% 幸運率', dmgPct: 16, addStatus: 'shock', luckyPct: 10 },
    ],
    [
      { id: 'a', name: '冰影閃襲', desc: '轉為冰霜並掛【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '炎影閃襲', desc: '轉為火焰並掛【灼燒】', elem: 'fire', addStatus: 'burn' },
    ],
    { name: '幸運：閃襲重置', desc: '幸運一擊 30% 機率縮短 CD 1.4s', procChance: 0.30, cdRefundMs: 1400 }
  ),
  blade_flurry: makeSpec('blade_flurry', 'core', ['核心', '連斬', '物理'], ['bleed'], ['vulnerable'],
    { name: '高速亂舞', desc: '傷害 +25%，幸運率 +8%', dmgPct: 25, luckyPct: 8 },
    [
      { id: 'a', name: '血影亂舞', desc: '附加【流血】且傷害 +22%', dmgPct: 22, addStatus: 'bleed' },
      { id: 'b', name: '毒牙亂舞', desc: '附加【中毒】', dmgPct: 20, addStatus: 'poison' },
      { id: 'c', name: '千刃狂舞', desc: '總傷 +30%', dmgPct: 30 },
    ],
    [
      { id: 'a', name: '熾炎亂舞', desc: '轉為火焰並掛【灼燒】', elem: 'fire', addStatus: 'burn' },
      { id: 'b', name: '電弧亂舞', desc: '轉為雷電並掛【感電】', elem: 'lightning', addStatus: 'shock' },
    ],
    { name: '幸運：劍刃殘影', desc: '幸運一擊 28% 機率追加 58% 斬擊', procChance: 0.28, bonusMult: 0.58 }
  ),
  shadow_execute: makeSpec('shadow_execute', 'ultimate', ['終極', '處決', '暗影'], ['vulnerable', 'curse'], ['bleed', 'poison'],
    { name: '影殺終結', desc: '傷害 +28%，壓制率 +8%', dmgPct: 28, overpowerPct: 8 },
    [
      { id: 'a', name: '血月絕殺', desc: '必掛【流血】引爆大出血', dmgPct: 24, addStatus: 'bleed' },
      { id: 'b', name: '審判影殺', desc: '附加【定罪】引爆靈魂審判', dmgPct: 22, addStatus: 'conviction' },
      { id: 'c', name: '無影連斬', desc: '冷卻 -18%', dmgPct: 18, cdPct: 18 },
    ],
    [
      { id: 'a', name: '極寒絕殺', desc: '轉為冰霜並掛【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '毒火絕殺', desc: '轉為火焰並掛【灼燒】', elem: 'fire', addStatus: 'burn' },
    ],
    { name: '幸運：影殺再臨', desc: '幸運一擊 28% 機率縮短 CD 2 秒', procChance: 0.28, cdRefundMs: 2000 }
  ),
  poison_kunai: makeSpec('poison_kunai', 'primer', ['基礎', '劇毒', '投擲'], ['poison'], [],
    { name: '多連苦無', desc: '傷害 +22%，冷卻 -12%', dmgPct: 22, cdPct: 12 },
    [
      { id: 'a', name: '爆炎苦無', desc: '同時掛【灼燒】自爆煉獄毒爆', dmgPct: 18, addStatus: 'burn' },
      { id: 'b', name: '破甲苦無', desc: '附加【易傷】', dmgPct: 18, addStatus: 'vulnerable' },
      { id: 'c', name: '神經麻痺苦無', desc: '附加【感電】', dmgPct: 16, addStatus: 'shock' },
    ],
    [
      { id: 'a', name: '寒冰飛鏢', desc: '轉為冰霜並掛【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '鮮血苦無', desc: '轉為鮮血並掛【流血】', elem: 'blood', addStatus: 'bleed' },
    ],
    { name: '幸運：淬毒回能', desc: '幸運一擊 30% 機率回復 18 影能', procChance: 0.30, mpRefund: 18 }
  ),
  smoke_veil: makeSpec('smoke_veil', 'defensive', ['防禦', '隱遁', '控場'], ['curse'], [],
    { name: '深淵煙幕', desc: '冷卻 -15%，傷害 +18%', dmgPct: 18, cdPct: 15 },
    [
      { id: 'a', name: '劇毒煙幕', desc: '附加【中毒】', dmgPct: 16, addStatus: 'poison' },
      { id: 'b', name: '破綻煙幕', desc: '附加【易傷】', dmgPct: 16, addStatus: 'vulnerable' },
      { id: 'c', name: '影遁蓄力', desc: '壓制率 +12%', dmgPct: 16, overpowerPct: 12 },
    ],
    [
      { id: 'a', name: '灼熱煙幕', desc: '附加【灼燒】', elem: 'fire', addStatus: 'burn' },
      { id: 'b', name: '冰霧隱遁', desc: '附加【凍結】', elem: 'frost', addStatus: 'freeze' },
    ],
    { name: '幸運：影霧回能', desc: '幸運一擊 32% 機率回復 20 影能', procChance: 0.32, mpRefund: 20 }
  ),
  venom_burst: makeSpec('venom_burst', 'core', ['核心', '劇毒', '引爆'], ['poison'], ['poison', 'burn'],
    { name: '高壓毒爆', desc: '傷害 +26%，壓制率 +6%', dmgPct: 26, overpowerPct: 6 },
    [
      { id: 'a', name: '煉獄毒火', desc: '必掛【灼燒】立即引爆煉獄毒爆', dmgPct: 22, addStatus: 'burn' },
      { id: 'b', name: '蝕骨易傷', desc: '附加【易傷】', dmgPct: 20, addStatus: 'vulnerable' },
      { id: 'c', name: '連鎖毒雲', desc: '總傷 +30%', dmgPct: 30 },
    ],
    [
      { id: 'a', name: '冰毒爆裂', desc: '轉為冰霜並掛【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '血毒爆裂', desc: '轉為鮮血並掛【流血】', elem: 'blood', addStatus: 'bleed' },
    ],
    { name: '幸運：毒素再爆', desc: '幸運一擊 28% 機率追加 62% 毒爆', procChance: 0.28, bonusMult: 0.62 }
  ),
  lethal_fangs: makeSpec('lethal_fangs', 'buff', ['增益', '劇毒', '攻速'], ['poison'], [],
    { name: '致命毒腺', desc: '冷卻 -15%，幸運率 +10%', cdPct: 15, luckyPct: 10 },
    [
      { id: 'a', name: '噬血毒牙', desc: '附加【流血】', dmgPct: 16, addStatus: 'bleed' },
      { id: 'b', name: '烈炎毒牙', desc: '附加【灼燒】', dmgPct: 18, addStatus: 'burn' },
      { id: 'c', name: '壓制獠牙', desc: '壓制率 +12%', dmgPct: 18, overpowerPct: 12 },
    ],
    [
      { id: 'a', name: '雷電獠牙', desc: '附加【感電】', elem: 'lightning', addStatus: 'shock' },
      { id: 'b', name: '冥咒獠牙', desc: '附加【詛咒】', elem: 'shadow', addStatus: 'curse' },
    ],
    { name: '幸運：毒牙回能', desc: '幸運一擊 35% 機率回復 22 影能', procChance: 0.35, mpRefund: 22 }
  ),

  // ==================== v235 近戰三職新增 24 招專精樹 ====================
  w_rend_slash: makeSpec('w_rend_slash', 'primer', ['基礎', '流血', '回能'], ['bleed'], [],
    { name: '深層割裂', desc: '傷害 +22%，冷卻 -12%', dmgPct: 22, cdPct: 12 },
    [
      { id: 'a', name: '破甲撕裂', desc: '同時掛【易傷】立即觸發大出血', dmgPct: 16, addStatus: 'vulnerable' },
      { id: 'b', name: '狂怒連斬', desc: '傷害 +26%', dmgPct: 26 },
      { id: 'c', name: '燃血重擊', desc: '附加【灼燒】', dmgPct: 18, addStatus: 'burn' },
    ],
    [
      { id: 'a', name: '毒刃撕裂', desc: '轉為毒傷並掛【中毒】', elem: 'poison', addStatus: 'poison' },
      { id: 'b', name: '雷刃撕裂', desc: '轉為雷電並掛【感電】', elem: 'lightning', addStatus: 'shock' },
    ],
    { name: '幸運：血怒回流', desc: '幸運一擊 30% 機率回復 20 能量', procChance: 0.30, mpRefund: 20 }
  ),
  w_ancient_hammer: makeSpec('w_ancient_hammer', 'core', ['核心', '壓制', '大地'], ['vulnerable'], ['bleed'],
    { name: '泰坦巨錘', desc: '傷害 +26%，壓制率 +12%', dmgPct: 26, overpowerPct: 12 },
    [
      { id: 'a', name: '烈炎震錘', desc: '附加【灼燒】且傷害 +22%', dmgPct: 22, addStatus: 'burn' },
      { id: 'b', name: '血錘碎骨', desc: '附加【流血】自爆大出血', dmgPct: 20, addStatus: 'bleed' },
      { id: 'c', name: '雙倍壓制錘', desc: '壓制率 +18%', dmgPct: 24, overpowerPct: 18 },
    ],
    [
      { id: 'a', name: '極寒戰錘', desc: '轉為冰霜並掛【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '審判聖錘', desc: '轉為聖光並掛【定罪】', elem: 'holy', addStatus: 'conviction' },
    ],
    { name: '幸運：餘震錘擊', desc: '幸運一擊 28% 機率追加 65% 壓制傷', procChance: 0.28, bonusMult: 0.65 }
  ),
  w_iron_skin: makeSpec('w_iron_skin', 'defensive', ['防禦', '護盾', '反傷'], ['vulnerable'], [],
    { name: '精鋼淬鍊', desc: '冷卻 -15%，壓制率 +10%', cdPct: 15, overpowerPct: 10 },
    [
      { id: 'a', name: '反傷棘甲', desc: '傷害 +25%', dmgPct: 25 },
      { id: 'b', name: '震懾戰膚', desc: '附加【易傷】', dmgPct: 16, addStatus: 'vulnerable' },
      { id: 'c', name: '鋼鐵意志', desc: '冷卻再 -12%', dmgPct: 12, cdPct: 12 },
    ],
    [
      { id: 'a', name: '寒冰戰甲', desc: '附加【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '烈焰戰甲', desc: '附加【灼燒】', elem: 'fire', addStatus: 'burn' },
    ],
    { name: '幸運：鋼鐵回能', desc: '幸運一擊 30% 機率回復 20 能量', procChance: 0.30, mpRefund: 20 }
  ),
  w_chain_grasp: makeSpec('w_chain_grasp', 'tactical', ['控場', '聚怪', '火焰'], ['vulnerable', 'burn'], ['bleed'],
    { name: '地獄鎖鏈', desc: '傷害 +22%，冷卻 -14%', dmgPct: 22, cdPct: 14 },
    [
      { id: 'a', name: '倒鉤血鏈', desc: '附加【流血】直接引爆大出血', dmgPct: 18, addStatus: 'bleed' },
      { id: 'b', name: '毒焰鎖鏈', desc: '附加【中毒】直接引爆煉獄毒爆', dmgPct: 18, addStatus: 'poison' },
      { id: 'c', name: '雷電鐵鍊', desc: '附加【感電】', dmgPct: 18, addStatus: 'shock' },
    ],
    [
      { id: 'a', name: '冥暗鎖鏈', desc: '轉為暗影並掛【詛咒】', elem: 'shadow', addStatus: 'curse' },
      { id: 'b', name: '極寒冰鏈', desc: '轉為冰霜並掛【凍結】', elem: 'frost', addStatus: 'freeze' },
    ],
    { name: '幸運：鐵鍊再甩', desc: '幸運一擊 30% 機率縮短 CD 1.5s', procChance: 0.30, cdRefundMs: 1500 }
  ),
  w_rupture_impale: makeSpec('w_rupture_impale', 'core', ['精通', '鮮血', '引爆'], ['bleed'], ['bleed', 'vulnerable'],
    { name: '動脈爆裂', desc: '傷害 +28%，壓制率 +8%', dmgPct: 28, overpowerPct: 8 },
    [
      { id: 'a', name: '血爆破甲', desc: '附加【易傷】必爆大出血', dmgPct: 22, addStatus: 'vulnerable' },
      { id: 'b', name: '雙重貫穿', desc: '總傷 +32%', dmgPct: 32 },
      { id: 'c', name: '毒血爆裂', desc: '附加【中毒】', dmgPct: 20, addStatus: 'poison' },
    ],
    [
      { id: 'a', name: '冥咒血槍', desc: '附加【詛咒】', elem: 'shadow', addStatus: 'curse' },
      { id: 'b', name: '熾炎血槍', desc: '附加【灼燒】', elem: 'fire', addStatus: 'burn' },
    ],
    { name: '幸運：血瀑連鎖', desc: '幸運一擊 28% 機率追加 65% 血爆', procChance: 0.28, bonusMult: 0.65 }
  ),
  w_seismic_fissure: makeSpec('w_seismic_fissure', 'tactical', ['精通', '熔岩', '持續'], ['burn'], ['poison'],
    { name: '火山裂谷', desc: '傷害 +25%，冷卻 -12%', dmgPct: 25, cdPct: 12 },
    [
      { id: 'a', name: '毒氣裂縫', desc: '附加【中毒】自爆煉獄毒爆', dmgPct: 20, addStatus: 'poison' },
      { id: 'b', name: '餘震地裂', desc: '傷害 +30%', dmgPct: 30 },
      { id: 'c', name: '熔岩壓制', desc: '壓制率 +14%', dmgPct: 20, overpowerPct: 14 },
    ],
    [
      { id: 'a', name: '冰川裂縫', desc: '轉為冰霜並掛【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '雷暴裂縫', desc: '轉為雷電並掛【感電】', elem: 'lightning', addStatus: 'shock' },
    ],
    { name: '幸運：岩漿噴湧', desc: '幸運一擊 26% 機率追加 60% 火焰傷', procChance: 0.26, bonusMult: 0.60 }
  ),
  w_call_ancients: makeSpec('w_call_ancients', 'ultimate', ['終極', '召喚', '英靈'], ['bleed', 'vulnerable'], ['bleed'],
    { name: '先祖狂怒', desc: '傷害 +30%，冷卻 -12%', dmgPct: 30, cdPct: 12 },
    [
      { id: 'a', name: '烈焰先祖', desc: '附加【灼燒】且傷害 +25%', dmgPct: 25, addStatus: 'burn' },
      { id: 'b', name: '泰坦先祖', desc: '壓制率 +18%', dmgPct: 24, overpowerPct: 18 },
      { id: 'c', name: '不滅英靈', desc: '冷卻 -16%', dmgPct: 18, cdPct: 16 },
    ],
    [
      { id: 'a', name: '冰霜先祖', desc: '附加【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '雷霆先祖', desc: '附加【感電】', elem: 'lightning', addStatus: 'shock' },
    ],
    { name: '幸運：先祖再臨', desc: '幸運一擊 30% 機率縮短 CD 2.2s', procChance: 0.30, cdRefundMs: 2200 }
  ),
  w_wrath_berserker: makeSpec('w_wrath_berserker', 'ultimate', ['終極', '狂暴', '壓制'], ['burn', 'vulnerable'], [],
    { name: '戰神降世', desc: '傷害 +30%，壓制率 +15%', dmgPct: 30, overpowerPct: 15 },
    [
      { id: 'a', name: '鮮血戰神', desc: '附加【流血】爆大出血', dmgPct: 24, addStatus: 'bleed' },
      { id: 'b', name: '無盡狂神', desc: '總傷 +35%', dmgPct: 35 },
      { id: 'c', name: '極速神軀', desc: '冷卻 -18%', dmgPct: 18, cdPct: 18 },
    ],
    [
      { id: 'a', name: '雷神降臨', desc: '附加【感電】', elem: 'lightning', addStatus: 'shock' },
      { id: 'b', name: '聖怒戰神', desc: '附加【定罪】', elem: 'holy', addStatus: 'conviction' },
    ],
    { name: '幸運：戰神回能', desc: '幸運一擊 32% 機率回復 25 能量', procChance: 0.32, mpRefund: 25 }
  ),

  p_smite_lash: makeSpec('p_smite_lash', 'primer', ['基礎', '聖光', '回能'], ['conviction'], [],
    { name: '炙熱鞭影', desc: '傷害 +22%，冷卻 -12%', dmgPct: 22, cdPct: 12 },
    [
      { id: 'a', name: '審判詛咒鞭', desc: '附加【詛咒】立即爆靈魂審判', dmgPct: 16, addStatus: 'curse' },
      { id: 'b', name: '烈陽聖鞭', desc: '附加【灼燒】', dmgPct: 20, addStatus: 'burn' },
      { id: 'c', name: '雙連聖鞭', desc: '傷害 +26%', dmgPct: 26 },
    ],
    [
      { id: 'a', name: '雷光鞭撻', desc: '附加【感電】', elem: 'lightning', addStatus: 'shock' },
      { id: 'b', name: '冰霜聖鞭', desc: '附加【凍結】', elem: 'frost', addStatus: 'freeze' },
    ],
    { name: '幸運：聖能湧流', desc: '幸運一擊 30% 機率回復 20 聖能', procChance: 0.30, mpRefund: 20 }
  ),
  p_holy_lance: makeSpec('p_holy_lance', 'core', ['核心', '聖光', '貫穿'], ['conviction'], ['curse'],
    { name: '審判長槍', desc: '傷害 +26%，壓制率 +8%', dmgPct: 26, overpowerPct: 8 },
    [
      { id: 'a', name: '破甲聖槍', desc: '附加【易傷】', dmgPct: 20, addStatus: 'vulnerable' },
      { id: 'b', name: '冥炎聖槍', desc: '附加【詛咒】自爆靈魂審判', dmgPct: 20, addStatus: 'curse' },
      { id: 'c', name: '三連聖槍', desc: '總傷 +30%', dmgPct: 30 },
    ],
    [
      { id: 'a', name: '雷霆長槍', desc: '附加【感電】', elem: 'lightning', addStatus: 'shock' },
      { id: 'b', name: '烈焰聖槍', desc: '附加【灼燒】', elem: 'fire', addStatus: 'burn' },
    ],
    { name: '幸運：聖槍貫心', desc: '幸運一擊 28% 機率追加 62% 聖傷', procChance: 0.28, bonusMult: 0.62 }
  ),
  p_crusader_charge: makeSpec('p_crusader_charge', 'defensive', ['位移', '聖火', '衝鋒'], ['burn', 'conviction'], [],
    { name: '十字烈焰', desc: '傷害 +24%，冷卻 -14%', dmgPct: 24, cdPct: 14 },
    [
      { id: 'a', name: '衝鋒破甲', desc: '附加【易傷】', dmgPct: 18, addStatus: 'vulnerable' },
      { id: 'b', name: '聖戰壓制', desc: '壓制率 +14%', dmgPct: 22, overpowerPct: 14 },
      { id: 'c', name: '淨化十字', desc: '附加【詛咒】爆靈魂審判', dmgPct: 18, addStatus: 'curse' },
    ],
    [
      { id: 'a', name: '雷霆衝鋒', desc: '附加【感電】', elem: 'lightning', addStatus: 'shock' },
      { id: 'b', name: '極寒衝鋒', desc: '附加【凍結】', elem: 'frost', addStatus: 'freeze' },
    ],
    { name: '幸運：衝鋒重置', desc: '幸運一擊 30% 機率縮短 CD 1.5s', procChance: 0.30, cdRefundMs: 1500 }
  ),
  p_redemption_prayer: makeSpec('p_redemption_prayer', 'defensive', ['防禦', '治療', '護盾'], ['conviction'], [],
    { name: '天使恩典', desc: '冷卻 -15%，傷害 +20%', dmgPct: 20, cdPct: 15 },
    [
      { id: 'a', name: '淨化耀光', desc: '附加【易傷】', dmgPct: 18, addStatus: 'vulnerable' },
      { id: 'b', name: '聖羽復仇', desc: '壓制率 +12%', dmgPct: 22, overpowerPct: 12 },
      { id: 'c', name: '慈悲回能', desc: '幸運率 +12%', dmgPct: 14, luckyPct: 12 },
    ],
    [
      { id: 'a', name: '冰霜禱言', desc: '附加【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '烈陽禱言', desc: '附加【灼燒】', elem: 'fire', addStatus: 'burn' },
    ],
    { name: '幸運：天使祝福', desc: '幸運一擊 32% 機率回復 22 聖能', procChance: 0.32, mpRefund: 22 }
  ),
  p_thorns_aura: makeSpec('p_thorns_aura', 'tactical', ['精通', '荊棘', '反傷'], ['vulnerable'], ['bleed'],
    { name: '黃金尖刺', desc: '傷害 +25%，壓制率 +10%', dmgPct: 25, overpowerPct: 10 },
    [
      { id: 'a', name: '血刺荊棘', desc: '附加【流血】自爆大出血', dmgPct: 20, addStatus: 'bleed' },
      { id: 'b', name: '審判荊棘', desc: '附加【定罪】', dmgPct: 20, addStatus: 'conviction' },
      { id: 'c', name: '萬刺齊發', desc: '總傷 +30%', dmgPct: 30 },
    ],
    [
      { id: 'a', name: '劇毒荊棘', desc: '附加【中毒】', elem: 'poison', addStatus: 'poison' },
      { id: 'b', name: '雷電荊棘', desc: '附加【感電】', elem: 'lightning', addStatus: 'shock' },
    ],
    { name: '幸運：荊棘反震', desc: '幸運一擊 28% 機率追加 60% 反傷波', procChance: 0.28, bonusMult: 0.60 }
  ),
  p_solar_beacon: makeSpec('p_solar_beacon', 'tactical', ['精通', '領域', '烈陽'], ['conviction', 'burn'], [],
    { name: '熾陽聖旗', desc: '傷害 +24%，冷卻 -12%', dmgPct: 24, cdPct: 12 },
    [
      { id: 'a', name: '審判聖標', desc: '附加【詛咒】爆靈魂審判', dmgPct: 20, addStatus: 'curse' },
      { id: 'b', name: '雙倍光柱', desc: '傷害 +30%', dmgPct: 30 },
      { id: 'c', name: '毒炎聖標', desc: '附加【中毒】爆煉獄毒爆', dmgPct: 20, addStatus: 'poison' },
    ],
    [
      { id: 'a', name: '極寒聖標', desc: '附加【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '天雷聖標', desc: '附加【感電】', elem: 'lightning', addStatus: 'shock' },
    ],
    { name: '幸運：聖標脈衝', desc: '幸運一擊 28% 機率追加 58% 聖火', procChance: 0.28, bonusMult: 0.58 }
  ),
  p_seraph_descent: makeSpec('p_seraph_descent', 'ultimate', ['終極', '天使', '全場'], ['conviction', 'burn'], [],
    { name: '六翼熾天使', desc: '傷害 +30%，冷卻 -12%', dmgPct: 30, cdPct: 12 },
    [
      { id: 'a', name: '審判天使', desc: '附加【詛咒】全場靈魂審判', dmgPct: 24, addStatus: 'curse' },
      { id: 'b', name: '神聖壓制翼', desc: '壓制率 +18%', dmgPct: 24, overpowerPct: 18 },
      { id: 'c', name: '永恆光翼', desc: '冷卻 -18%', dmgPct: 18, cdPct: 18 },
    ],
    [
      { id: 'a', name: '雷翼天使', desc: '附加【感電】', elem: 'lightning', addStatus: 'shock' },
      { id: 'b', name: '霜翼天使', desc: '附加【凍結】', elem: 'frost', addStatus: 'freeze' },
    ],
    { name: '幸運：天恩再降', desc: '幸運一擊 30% 機率縮短 CD 2.2s', procChance: 0.30, cdRefundMs: 2200 }
  ),
  p_heavens_verdict: makeSpec('p_heavens_verdict', 'ultimate', ['終極', '巨劍', '落雷'], ['conviction', 'shock'], ['freeze', 'curse'],
    { name: '天界裁決', desc: '傷害 +32%，壓制率 +12%', dmgPct: 32, overpowerPct: 12 },
    [
      { id: 'a', name: '霜雷巨劍', desc: '附加【凍結】全場炸超導碎冰', dmgPct: 24, addStatus: 'freeze' },
      { id: 'b', name: '冥雷巨劍', desc: '附加【詛咒】全場炸靈魂審判', dmgPct: 24, addStatus: 'curse' },
      { id: 'c', name: '萬鈞天劍', desc: '總傷 +36%', dmgPct: 36 },
    ],
    [
      { id: 'a', name: '烈陽天劍', desc: '附加【灼燒】', elem: 'fire', addStatus: 'burn' },
      { id: 'b', name: '血罰巨劍', desc: '附加【流血】', elem: 'blood', addStatus: 'bleed' },
    ],
    { name: '幸運：二次天罰', desc: '幸運一擊 28% 機率追加 70% 天雷傷', procChance: 0.28, bonusMult: 0.70 }
  ),

  a_twin_fang: makeSpec('a_twin_fang', 'primer', ['基礎', '連擊', '回能'], ['bleed'], [],
    { name: '極速雙牙', desc: '傷害 +22%，冷卻 -14%', dmgPct: 22, cdPct: 14 },
    [
      { id: 'a', name: '破甲毒牙', desc: '附加【易傷】自爆大出血', dmgPct: 16, addStatus: 'vulnerable' },
      { id: 'b', name: '劇毒雙牙', desc: '附加【中毒】', dmgPct: 18, addStatus: 'poison' },
      { id: 'c', name: '雷光雙牙', desc: '附加【感電】並 +10% 幸運率', dmgPct: 16, addStatus: 'shock', luckyPct: 10 },
    ],
    [
      { id: 'a', name: '炎牙快刺', desc: '附加【灼燒】', elem: 'fire', addStatus: 'burn' },
      { id: 'b', name: '冰牙快刺', desc: '附加【凍結】', elem: 'frost', addStatus: 'freeze' },
    ],
    { name: '幸運：影能湧流', desc: '幸運一擊 30% 機率回復 20 影能', procChance: 0.30, mpRefund: 20 }
  ),
  a_boomerang_blades: makeSpec('a_boomerang_blades', 'core', ['核心', '貫穿', '暗影'], ['vulnerable', 'bleed'], ['bleed'],
    { name: '雙倍迴旋', desc: '傷害 +26%，幸運率 +8%', dmgPct: 26, luckyPct: 8 },
    [
      { id: 'a', name: '血刃迴旋', desc: '總傷 +30%', dmgPct: 30 },
      { id: 'b', name: '毒焰飛刃', desc: '附加【中毒】＋【灼燒】', dmgPct: 20, addStatus: 'poison' },
      { id: 'c', name: '雷影飛刃', desc: '附加【感電】', dmgPct: 20, addStatus: 'shock' },
    ],
    [
      { id: 'a', name: '寒霜飛刃', desc: '附加【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '冥咒飛刃', desc: '附加【詛咒】', elem: 'shadow', addStatus: 'curse' },
    ],
    { name: '幸運：飛刃再返', desc: '幸運一擊 28% 機率追加 62% 迴旋傷', procChance: 0.28, bonusMult: 0.62 }
  ),
  a_shadow_backstab: makeSpec('a_shadow_backstab', 'defensive', ['位移', '必暴', '背刺'], ['vulnerable', 'bleed'], ['bleed'],
    { name: '致命繞背', desc: '傷害 +28%，冷卻 -14%', dmgPct: 28, cdPct: 14 },
    [
      { id: 'a', name: '穿心壓制', desc: '壓制率 +16%', dmgPct: 24, overpowerPct: 16 },
      { id: 'b', name: '蝕毒背刺', desc: '附加【中毒】', dmgPct: 22, addStatus: 'poison' },
      { id: 'c', name: '連環影步', desc: '冷卻再 -14%', dmgPct: 16, cdPct: 14 },
    ],
    [
      { id: 'a', name: '炎刃背刺', desc: '附加【灼燒】', elem: 'fire', addStatus: 'burn' },
      { id: 'b', name: '審判背刺', desc: '附加【定罪】', elem: 'holy', addStatus: 'conviction' },
    ],
    { name: '幸運：背刺重置', desc: '幸運一擊 32% 機率縮短 CD 1.8s', procChance: 0.32, cdRefundMs: 1800 }
  ),
  a_crimson_mist: makeSpec('a_crimson_mist', 'tactical', ['控場', '劇毒', '領域'], ['poison', 'burn'], ['poison'],
    { name: '濃烈毒煙', desc: '傷害 +24%，冷卻 -12%', dmgPct: 24, cdPct: 12 },
    [
      { id: 'a', name: '煉獄毒雲', desc: '總傷 +30% 必爆煉獄毒爆', dmgPct: 30, addStatus: 'burn' },
      { id: 'b', name: '血腥毒霧', desc: '附加【流血】＋【易傷】', dmgPct: 20, addStatus: 'bleed' },
      { id: 'c', name: '致盲詛咒霧', desc: '附加【詛咒】', dmgPct: 18, addStatus: 'curse' },
    ],
    [
      { id: 'a', name: '極寒毒霧', desc: '附加【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '雷暴毒霧', desc: '附加【感電】', elem: 'lightning', addStatus: 'shock' },
    ],
    { name: '幸運：毒霧擴散', desc: '幸運一擊 28% 機率追加 60% 毒爆', procChance: 0.28, bonusMult: 0.60 }
  ),
  a_death_lotus: makeSpec('a_death_lotus', 'core', ['精通', '刀雨', '範圍'], ['bleed'], ['vulnerable'],
    { name: '曼珠沙華', desc: '傷害 +25%，幸運率 +10%', dmgPct: 25, luckyPct: 10 },
    [
      { id: 'a', name: '破甲蓮華', desc: '附加【易傷】爆大出血', dmgPct: 20, addStatus: 'vulnerable' },
      { id: 'b', name: '劇毒蓮華', desc: '附加【中毒】', dmgPct: 22, addStatus: 'poison' },
      { id: 'c', name: '千刃蓮華', desc: '總傷 +30%', dmgPct: 30 },
    ],
    [
      { id: 'a', name: '霜華刀雨', desc: '附加【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '炎華刀雨', desc: '附加【灼燒】', elem: 'fire', addStatus: 'burn' },
    ],
    { name: '幸運：飛刀彈射', desc: '幸運一擊 28% 機率追加 58% 刀傷', procChance: 0.28, bonusMult: 0.58 }
  ),
  a_venom_imbue: makeSpec('a_venom_imbue', 'buff', ['精通', '淬毒', '回能'], ['poison', 'vulnerable'], [],
    { name: '深淵毒液', desc: '傷害 +22%，冷卻 -15%', dmgPct: 22, cdPct: 15 },
    [
      { id: 'a', name: '爆炎淬毒', desc: '附加【灼燒】自爆煉獄毒爆', dmgPct: 20, addStatus: 'burn' },
      { id: 'b', name: '神經麻痺', desc: '附加【感電】', dmgPct: 18, addStatus: 'shock' },
      { id: 'c', name: '致命腐蝕', desc: '壓制率 +14%', dmgPct: 22, overpowerPct: 14 },
    ],
    [
      { id: 'a', name: '極寒淬刃', desc: '附加【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '冥咒淬刃', desc: '附加【詛咒】', elem: 'shadow', addStatus: 'curse' },
    ],
    { name: '幸運：毒液沸騰', desc: '幸運一擊 32% 機率回復 22 影能', procChance: 0.32, mpRefund: 22 }
  ),
  a_thousand_shadows: makeSpec('a_thousand_shadows', 'ultimate', ['終極', '血月', '必暴'], ['bleed', 'vulnerable'], ['poison'],
    { name: '無盡千影', desc: '傷害 +30%，冷卻 -12%', dmgPct: 30, cdPct: 12 },
    [
      { id: 'a', name: '毒月千影', desc: '附加【中毒】＋【灼燒】', dmgPct: 24, addStatus: 'poison' },
      { id: 'b', name: '千影壓制', desc: '壓制率 +18%', dmgPct: 24, overpowerPct: 18 },
      { id: 'c', name: '影舞再臨', desc: '冷卻 -18%', dmgPct: 18, cdPct: 18 },
    ],
    [
      { id: 'a', name: '雷月千影', desc: '附加【感電】', elem: 'lightning', addStatus: 'shock' },
      { id: 'b', name: '霜月千影', desc: '附加【凍結】', elem: 'frost', addStatus: 'freeze' },
    ],
    { name: '幸運：千影連斬', desc: '幸運一擊 30% 機率縮短 CD 2.2s', procChance: 0.30, cdRefundMs: 2200 }
  ),
  a_crimson_eclipse: makeSpec('a_crimson_eclipse', 'ultimate', ['終極', '五星', '絕殺'], ['bleed', 'vulnerable', 'poison'], ['burn'],
    { name: '血月降臨', desc: '傷害 +32%，壓制率 +12%', dmgPct: 32, overpowerPct: 12 },
    [
      { id: 'a', name: '煉獄血月', desc: '附加【灼燒】必爆雙重複合反應', dmgPct: 25, addStatus: 'burn' },
      { id: 'b', name: '審判血月', desc: '附加【定罪】＋【詛咒】', dmgPct: 24, addStatus: 'conviction' },
      { id: 'c', name: '絕影破滅', desc: '總傷 +36%', dmgPct: 36 },
    ],
    [
      { id: 'a', name: '極寒血月', desc: '附加【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '雷霆血月', desc: '附加【感電】', elem: 'lightning', addStatus: 'shock' },
    ],
    { name: '幸運：五星回響', desc: '幸運一擊 28% 機率追加 70% 絕殺傷', procChance: 0.28, bonusMult: 0.70 }
  ),

  // ==================== v236 遠程／法系三職新增 24 招專精樹 ====================
  r_shadow_imbue: makeSpec('r_shadow_imbue', 'primer', ['基礎', '暗影', '回能'], ['vulnerable', 'curse'], [],
    { name: '幽冥箭羽', desc: '傷害 +24%，冷卻 -12%', dmgPct: 24, cdPct: 12 },
    [
      { id: 'a', name: '審判暗矢', desc: '附加【定罪】引爆靈魂審判', dmgPct: 22, addStatus: 'conviction' },
      { id: 'b', name: '血影箭', desc: '附加【流血】引爆大出血', dmgPct: 20, addStatus: 'bleed', overpowerPct: 10 },
      { id: 'c', name: '極速灌注', desc: '傷害 +28% 並提幸運率', dmgPct: 28, luckyPct: 8 },
    ],
    [
      { id: 'a', name: '毒影灌注', desc: '轉化並附加【中毒】', elem: 'poison', addStatus: 'poison' },
      { id: 'b', name: '霜影灌注', desc: '轉化並附加【凍結】', elem: 'frost', addStatus: 'freeze' },
    ],
    { name: '幸運：暗影連爆', desc: '幸運一擊 28% 機率追加 62% 連攜爆發並回能 15', procChance: 0.28, bonusMult: 0.62, mpRefund: 15 }
  ),
  r_venom_pierce: makeSpec('r_venom_pierce', 'core', ['核心', '劇毒', '貫穿'], ['poison'], ['burn', 'vulnerable'],
    { name: '高壓毒矛', desc: '傷害 +24%，冷卻 -12%', dmgPct: 24, cdPct: 12 },
    [
      { id: 'a', name: '毒火穿心', desc: '附加【灼燒】必爆煉獄毒爆', dmgPct: 22, addStatus: 'burn' },
      { id: 'b', name: '破甲酸箭', desc: '附加【易傷】並 +10% 壓制', dmgPct: 20, addStatus: 'vulnerable', overpowerPct: 10 },
      { id: 'c', name: '三連毒矛', desc: '總傷 +28%', dmgPct: 28, luckyPct: 8 },
    ],
    [
      { id: 'a', name: '血毒貫穿', desc: '轉化並附加【流血】', elem: 'blood', addStatus: 'bleed' },
      { id: 'b', name: '雷毒貫穿', desc: '轉化並附加【感電】', elem: 'lightning', addStatus: 'shock' },
    ],
    { name: '幸運：腐蝕穿刺', desc: '幸運一擊 28% 機率追加 62% 連攜爆發並回能 15', procChance: 0.28, bonusMult: 0.62, mpRefund: 15 }
  ),
  r_smoke_decoy: makeSpec('r_smoke_decoy', 'defensive', ['防禦', '誘餌', '毒霧'], ['poison', 'vulnerable'], [],
    { name: '雙倍毒霧', desc: '傷害 +24%，冷卻 -12%', dmgPct: 24, cdPct: 12 },
    [
      { id: 'a', name: '爆炎假人', desc: '附加【灼燒】炸煉獄毒爆', dmgPct: 22, addStatus: 'burn' },
      { id: 'b', name: '血刺誘餌', desc: '附加【流血】炸大出血', dmgPct: 20, addStatus: 'bleed', overpowerPct: 10 },
      { id: 'c', name: '厚霧幻影', desc: '傷害 +28%', dmgPct: 28, luckyPct: 8 },
    ],
    [
      { id: 'a', name: '冰霧誘餌', desc: '轉化並附加【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '冥霧誘餌', desc: '轉化並附加【詛咒】', elem: 'shadow', addStatus: 'curse' },
    ],
    { name: '幸運：誘餌再爆', desc: '幸運一擊 28% 機率追加 62% 連攜爆發並回能 15', procChance: 0.28, bonusMult: 0.62, mpRefund: 15 }
  ),
  r_frost_barrage: makeSpec('r_frost_barrage', 'core', ['核心', '冰霜', '散射'], ['freeze'], ['shock'],
    { name: '極寒散矢', desc: '傷害 +24%，冷卻 -12%', dmgPct: 24, cdPct: 12 },
    [
      { id: 'a', name: '冰雷齊射', desc: '附加【感電】自爆超導碎冰', dmgPct: 22, addStatus: 'shock' },
      { id: 'b', name: '碎冰易傷', desc: '附加【易傷】＋壓制', dmgPct: 20, addStatus: 'vulnerable', overpowerPct: 10 },
      { id: 'c', name: '七連冰箭', desc: '總傷 +28%', dmgPct: 28, luckyPct: 8 },
    ],
    [
      { id: 'a', name: '炎霜箭幕', desc: '轉化並附加【灼燒】', elem: 'fire', addStatus: 'burn' },
      { id: 'b', name: '毒冰箭幕', desc: '轉化並附加【中毒】', elem: 'poison', addStatus: 'poison' },
    ],
    { name: '幸運：冰晶飛散', desc: '幸運一擊 28% 機率追加 62% 連攜爆發並回能 15', procChance: 0.28, bonusMult: 0.62, mpRefund: 15 }
  ),
  r_razor_snare: makeSpec('r_razor_snare', 'tactical', ['控場', '陷阱', '流血'], ['bleed', 'vulnerable'], ['bleed'],
    { name: '鋸齒鋼夾', desc: '傷害 +24%，冷卻 -12%', dmgPct: 24, cdPct: 12 },
    [
      { id: 'a', name: '大出血陷阱', desc: '總傷高爆並延續流血', dmgPct: 22, addStatus: 'bleed' },
      { id: 'b', name: '毒牙捕獸夾', desc: '附加【中毒】', dmgPct: 20, addStatus: 'poison', overpowerPct: 10 },
      { id: 'c', name: '連環夾陣', desc: '總傷 +28%', dmgPct: 28, luckyPct: 8 },
    ],
    [
      { id: 'a', name: '電網陷阱', desc: '轉化並附加【感電】', elem: 'lightning', addStatus: 'shock' },
      { id: 'b', name: '冰凍陷阱', desc: '轉化並附加【凍結】', elem: 'frost', addStatus: 'freeze' },
    ],
    { name: '幸運：陷阱重裝', desc: '幸運一擊 28% 機率追加 62% 連攜爆發並回能 15', procChance: 0.28, bonusMult: 0.62, mpRefund: 15 }
  ),
  r_gale_snipe: makeSpec('r_gale_snipe', 'core', ['精通', '狙擊', '必暴'], ['vulnerable'], ['bleed'],
    { name: '貫風長箭', desc: '傷害 +24%，冷卻 -12%', dmgPct: 24, cdPct: 12 },
    [
      { id: 'a', name: '穿血狙殺', desc: '附加【流血】爆大出血', dmgPct: 22, addStatus: 'bleed' },
      { id: 'b', name: '雷風狙殺', desc: '附加【感電】', dmgPct: 20, addStatus: 'shock', overpowerPct: 10 },
      { id: 'c', name: '致命風眼', desc: '總傷 +28%', dmgPct: 28, luckyPct: 8 },
    ],
    [
      { id: 'a', name: '聖風狙殺', desc: '轉化並附加【定罪】', elem: 'holy', addStatus: 'conviction' },
      { id: 'b', name: '毒風狙殺', desc: '轉化並附加【中毒】', elem: 'poison', addStatus: 'poison' },
    ],
    { name: '幸運：疾風追箭', desc: '幸運一擊 28% 機率追加 62% 連攜爆發並回能 15', procChance: 0.28, bonusMult: 0.62, mpRefund: 15 }
  ),
  r_abyss_barrage: makeSpec('r_abyss_barrage', 'ultimate', ['終極', '箭雨', '全場'], ['poison', 'vulnerable'], ['burn'],
    { name: '深淵覆蓋', desc: '傷害 +24%，冷卻 -12%', dmgPct: 24, cdPct: 12 },
    [
      { id: 'a', name: '毒火流星雨', desc: '附加【灼燒】全場煉獄毒爆', dmgPct: 22, addStatus: 'burn' },
      { id: 'b', name: '血雨流星', desc: '附加【流血】全場大出血', dmgPct: 20, addStatus: 'bleed', overpowerPct: 10 },
      { id: 'c', name: '無盡箭幕', desc: '總傷 +28%', dmgPct: 28, luckyPct: 8 },
    ],
    [
      { id: 'a', name: '極寒流星雨', desc: '轉化並附加【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '雷霆流星雨', desc: '轉化並附加【感電】', elem: 'lightning', addStatus: 'shock' },
    ],
    { name: '幸運：箭幕延續', desc: '幸運一擊 28% 機率追加 62% 連攜爆發並回能 15', procChance: 0.28, bonusMult: 0.62, mpRefund: 15 }
  ),
  r_void_hunter: makeSpec('r_void_hunter', 'ultimate', ['終極', '虛空', '必暴'], ['curse', 'vulnerable'], ['conviction'],
    { name: '星紋擴張', desc: '傷害 +24%，冷卻 -12%', dmgPct: 24, cdPct: 12 },
    [
      { id: 'a', name: '審判星陣', desc: '附加【定罪】全場靈魂審判', dmgPct: 22, addStatus: 'conviction' },
      { id: 'b', name: '壓制虛空', desc: '附加【流血】＋壓制', dmgPct: 20, addStatus: 'bleed', overpowerPct: 10 },
      { id: 'c', name: '永恆星海', desc: '總傷 +28%', dmgPct: 28, luckyPct: 8 },
    ],
    [
      { id: 'a', name: '雷光星陣', desc: '轉化並附加【感電】', elem: 'lightning', addStatus: 'shock' },
      { id: 'b', name: '烈焰星陣', desc: '轉化並附加【灼燒】', elem: 'fire', addStatus: 'burn' },
    ],
    { name: '幸運：星光回響', desc: '幸運一擊 28% 機率追加 62% 連攜爆發並回能 15', procChance: 0.28, bonusMult: 0.62, mpRefund: 15 }
  ),
  m_fire_bolt: makeSpec('m_fire_bolt', 'primer', ['基礎', '火焰', '回魔'], ['burn'], [],
    { name: '高溫炎核', desc: '傷害 +24%，冷卻 -12%', dmgPct: 24, cdPct: 12 },
    [
      { id: 'a', name: '毒炎彈', desc: '附加【中毒】爆煉獄毒爆', dmgPct: 22, addStatus: 'poison' },
      { id: 'b', name: '碎甲炎彈', desc: '附加【易傷】', dmgPct: 20, addStatus: 'vulnerable', overpowerPct: 10 },
      { id: 'c', name: '三連炎彈', desc: '總傷 +28%', dmgPct: 28, luckyPct: 8 },
    ],
    [
      { id: 'a', name: '冰焰彈', desc: '轉化並附加【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '雷炎彈', desc: '轉化並附加【感電】', elem: 'lightning', addStatus: 'shock' },
    ],
    { name: '幸運：炎魔湧泉', desc: '幸運一擊 28% 機率追加 62% 連攜爆發並回能 15', procChance: 0.28, bonusMult: 0.62, mpRefund: 15 }
  ),
  m_flame_hydra: makeSpec('m_flame_hydra', 'tactical', ['精通', '召喚', '火焰'], ['burn'], ['poison'],
    { name: '三頭火蛇', desc: '傷害 +24%，冷卻 -12%', dmgPct: 24, cdPct: 12 },
    [
      { id: 'a', name: '毒炎火蛇', desc: '附加【中毒】自爆煉獄毒爆', dmgPct: 22, addStatus: 'poison' },
      { id: 'b', name: '破防龍息', desc: '附加【易傷】', dmgPct: 20, addStatus: 'vulnerable', overpowerPct: 10 },
      { id: 'c', name: '熔核火蛇', desc: '總傷 +28%', dmgPct: 28, luckyPct: 8 },
    ],
    [
      { id: 'a', name: '極寒冰蛇', desc: '轉化並附加【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '雷電蛇神', desc: '轉化並附加【感電】', elem: 'lightning', addStatus: 'shock' },
    ],
    { name: '幸運：火蛇齊噴', desc: '幸運一擊 28% 機率追加 62% 連攜爆發並回能 15', procChance: 0.28, bonusMult: 0.62, mpRefund: 15 }
  ),
  m_ice_armor: makeSpec('m_ice_armor', 'defensive', ['防禦', '冰霜', '護盾'], ['freeze'], ['shock'],
    { name: '厚重冰晶', desc: '傷害 +24%，冷卻 -12%', dmgPct: 24, cdPct: 12 },
    [
      { id: 'a', name: '超導冰甲', desc: '附加【感電】自爆超導碎冰', dmgPct: 22, addStatus: 'shock' },
      { id: 'b', name: '破甲冰刺', desc: '附加【易傷】', dmgPct: 20, addStatus: 'vulnerable', overpowerPct: 10 },
      { id: 'c', name: '極寒反震', desc: '總傷 +28%', dmgPct: 28, luckyPct: 8 },
    ],
    [
      { id: 'a', name: '冥霜冰甲', desc: '轉化並附加【詛咒】', elem: 'shadow', addStatus: 'curse' },
      { id: 'b', name: '聖霜護甲', desc: '轉化並附加【定罪】', elem: 'holy', addStatus: 'conviction' },
    ],
    { name: '幸運：冰盾回魔', desc: '幸運一擊 28% 機率追加 62% 連攜爆發並回能 15', procChance: 0.28, bonusMult: 0.62, mpRefund: 15 }
  ),
  m_arcane_blink: makeSpec('m_arcane_blink', 'defensive', ['位移', '雷電', '控場'], ['shock', 'vulnerable'], ['freeze'],
    { name: '極速閃現', desc: '傷害 +24%，冷卻 -12%', dmgPct: 24, cdPct: 12 },
    [
      { id: 'a', name: '冰雷閃現', desc: '附加【凍結】必爆超導碎冰', dmgPct: 22, addStatus: 'freeze' },
      { id: 'b', name: '重壓雷環', desc: '附加【易傷】＋壓制', dmgPct: 20, addStatus: 'vulnerable', overpowerPct: 10 },
      { id: 'c', name: '雙重閃現', desc: '總傷 +28%', dmgPct: 28, luckyPct: 8 },
    ],
    [
      { id: 'a', name: '烈焰閃現', desc: '轉化並附加【灼燒】', elem: 'fire', addStatus: 'burn' },
      { id: 'b', name: '暗影閃現', desc: '轉化並附加【詛咒】', elem: 'shadow', addStatus: 'curse' },
    ],
    { name: '幸運：閃現重置', desc: '幸運一擊 28% 機率追加 62% 連攜爆發並回能 15', procChance: 0.28, bonusMult: 0.62, mpRefund: 15 }
  ),
  m_ball_lightning: makeSpec('m_ball_lightning', 'core', ['核心', '雷電', '環繞'], ['shock'], ['freeze'],
    { name: '雙倍電球', desc: '傷害 +24%，冷卻 -12%', dmgPct: 24, cdPct: 12 },
    [
      { id: 'a', name: '超導電球', desc: '附加【凍結】高頻超導碎冰', dmgPct: 22, addStatus: 'freeze' },
      { id: 'b', name: '過載電核', desc: '附加【易傷】＋壓制', dmgPct: 20, addStatus: 'vulnerable', overpowerPct: 10 },
      { id: 'c', name: '高頻電場', desc: '總傷 +28%', dmgPct: 28, luckyPct: 8 },
    ],
    [
      { id: 'a', name: '烈焰火球陣', desc: '轉化並附加【灼燒】', elem: 'fire', addStatus: 'burn' },
      { id: 'b', name: '冥雷球', desc: '轉化並附加【詛咒】', elem: 'shadow', addStatus: 'curse' },
    ],
    { name: '幸運：電球分裂', desc: '幸運一擊 28% 機率追加 62% 連攜爆發並回能 15', procChance: 0.28, bonusMult: 0.62, mpRefund: 15 }
  ),
  m_blizzard_field: makeSpec('m_blizzard_field', 'tactical', ['精通', '冰霜', '領域'], ['freeze'], ['shock'],
    { name: '極地風暴', desc: '傷害 +24%，冷卻 -12%', dmgPct: 24, cdPct: 12 },
    [
      { id: 'a', name: '雷雪交加', desc: '附加【感電】全場超導碎冰', dmgPct: 22, addStatus: 'shock' },
      { id: 'b', name: '凍裂破甲', desc: '附加【易傷】', dmgPct: 20, addStatus: 'vulnerable', overpowerPct: 10 },
      { id: 'c', name: '永冬領域', desc: '總傷 +28%', dmgPct: 28, luckyPct: 8 },
    ],
    [
      { id: 'a', name: '酸雪風暴', desc: '轉化並附加【中毒】', elem: 'poison', addStatus: 'poison' },
      { id: 'b', name: '冥雪風暴', desc: '轉化並附加【詛咒】', elem: 'shadow', addStatus: 'curse' },
    ],
    { name: '幸運：暴雪延續', desc: '幸運一擊 28% 機率追加 62% 連攜爆發並回能 15', procChance: 0.28, bonusMult: 0.62, mpRefund: 15 }
  ),
  m_elemental_cataclysm: makeSpec('m_elemental_cataclysm', 'ultimate', ['終極', '三系', '全場'], ['burn', 'freeze', 'shock'], ['poison'],
    { name: '天災增幅', desc: '傷害 +24%，冷卻 -12%', dmgPct: 24, cdPct: 12 },
    [
      { id: 'a', name: '毒火天災', desc: '附加【中毒】再爆煉獄毒爆', dmgPct: 22, addStatus: 'poison' },
      { id: 'b', name: '審判天災', desc: '附加【定罪】＋【詛咒】', dmgPct: 20, addStatus: 'conviction', overpowerPct: 10 },
      { id: 'c', name: '終焉天災', desc: '總傷 +28%', dmgPct: 28, luckyPct: 8 },
    ],
    [
      { id: 'a', name: '鮮血天災', desc: '轉化並附加【流血】', elem: 'blood', addStatus: 'bleed' },
      { id: 'b', name: '虛空天災', desc: '轉化並附加【詛咒】', elem: 'shadow', addStatus: 'curse' },
    ],
    { name: '幸運：元素共鳴', desc: '幸運一擊 28% 機率追加 62% 連攜爆發並回能 15', procChance: 0.28, bonusMult: 0.62, mpRefund: 15 }
  ),
  m_astral_supernova: makeSpec('m_astral_supernova', 'ultimate', ['終極', '星界', '必暴'], ['vulnerable', 'curse'], ['conviction'],
    { name: '星核過載', desc: '傷害 +24%，冷卻 -12%', dmgPct: 24, cdPct: 12 },
    [
      { id: 'a', name: '審判超新星', desc: '附加【定罪】引爆靈魂審判', dmgPct: 22, addStatus: 'conviction' },
      { id: 'b', name: '超導星爆', desc: '附加【感電】＋【凍結】', dmgPct: 20, addStatus: 'shock', overpowerPct: 10 },
      { id: 'c', name: '銀河坍縮', desc: '總傷 +28%', dmgPct: 28, luckyPct: 8 },
    ],
    [
      { id: 'a', name: '烈陽超新星', desc: '轉化並附加【灼燒】', elem: 'fire', addStatus: 'burn' },
      { id: 'b', name: '劇毒超新星', desc: '轉化並附加【中毒】', elem: 'poison', addStatus: 'poison' },
    ],
    { name: '幸運：星爆餘波', desc: '幸運一擊 28% 機率追加 62% 連攜爆發並回能 15', procChance: 0.28, bonusMult: 0.62, mpRefund: 15 }
  ),
  n_reap_scythe: makeSpec('n_reap_scythe', 'primer', ['基礎', '暗影', '回魂'], ['curse'], [],
    { name: '寬刃魂鐮', desc: '傷害 +24%，冷卻 -12%', dmgPct: 24, cdPct: 12 },
    [
      { id: 'a', name: '審判魂鐮', desc: '附加【定罪】爆靈魂審判', dmgPct: 22, addStatus: 'conviction' },
      { id: 'b', name: '血割鬼鐮', desc: '附加【流血】', dmgPct: 20, addStatus: 'bleed', overpowerPct: 10 },
      { id: 'c', name: '雙揮收割', desc: '總傷 +28%', dmgPct: 28, luckyPct: 8 },
    ],
    [
      { id: 'a', name: '毒魂鐮', desc: '轉化並附加【中毒】', elem: 'poison', addStatus: 'poison' },
      { id: 'b', name: '霜魂鐮', desc: '轉化並附加【凍結】', elem: 'frost', addStatus: 'freeze' },
    ],
    { name: '幸運：魂能收割', desc: '幸運一擊 28% 機率追加 62% 連攜爆發並回能 15', procChance: 0.28, bonusMult: 0.62, mpRefund: 15 }
  ),
  n_blood_surge: makeSpec('n_blood_surge', 'core', ['核心', '鮮血', '吸血'], ['bleed'], ['vulnerable'],
    { name: '澎湃血潮', desc: '傷害 +24%，冷卻 -12%', dmgPct: 24, cdPct: 12 },
    [
      { id: 'a', name: '破甲血潮', desc: '附加【易傷】必爆大出血', dmgPct: 22, addStatus: 'vulnerable' },
      { id: 'b', name: '壓制血浪', desc: '壓制率大幅提升', dmgPct: 20, addStatus: 'bleed', overpowerPct: 10 },
      { id: 'c', name: '雙重血湧', desc: '總傷 +28%', dmgPct: 28, luckyPct: 8 },
    ],
    [
      { id: 'a', name: '毒血湧動', desc: '轉化並附加【中毒】', elem: 'poison', addStatus: 'poison' },
      { id: 'b', name: '冥火血湧', desc: '轉化並附加【灼燒】', elem: 'fire', addStatus: 'burn' },
    ],
    { name: '幸運：鮮血回湧', desc: '幸運一擊 28% 機率追加 62% 連攜爆發並回能 15', procChance: 0.28, bonusMult: 0.62, mpRefund: 15 }
  ),
  n_blight_pool: makeSpec('n_blight_pool', 'tactical', ['精通', '瘟疫', '領域'], ['poison', 'curse'], ['burn'],
    { name: '深層腐化', desc: '傷害 +24%，冷卻 -12%', dmgPct: 24, cdPct: 12 },
    [
      { id: 'a', name: '毒火瘟疫', desc: '附加【灼燒】必爆煉獄毒爆', dmgPct: 22, addStatus: 'burn' },
      { id: 'b', name: '審判瘟疫', desc: '附加【定罪】爆靈魂審判', dmgPct: 20, addStatus: 'conviction', overpowerPct: 10 },
      { id: 'c', name: '廣域腐池', desc: '總傷 +28%', dmgPct: 28, luckyPct: 8 },
    ],
    [
      { id: 'a', name: '極寒瘟疫', desc: '轉化並附加【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '鮮血瘟疫', desc: '轉化並附加【流血】', elem: 'blood', addStatus: 'bleed' },
    ],
    { name: '幸運：瘟疫蔓延', desc: '幸運一擊 28% 機率追加 62% 連攜爆發並回能 15', procChance: 0.28, bonusMult: 0.62, mpRefund: 15 }
  ),
  n_bone_shield: makeSpec('n_bone_shield', 'defensive', ['防禦', '白骨', '護盾'], ['vulnerable'], ['bleed'],
    { name: '七片骨盾', desc: '傷害 +24%，冷卻 -12%', dmgPct: 24, cdPct: 12 },
    [
      { id: 'a', name: '血刺骨盾', desc: '附加【流血】爆大出血', dmgPct: 22, addStatus: 'bleed' },
      { id: 'b', name: '魂火骨盾', desc: '附加【詛咒】', dmgPct: 20, addStatus: 'curse', overpowerPct: 10 },
      { id: 'c', name: '反震骨甲', desc: '總傷 +28%', dmgPct: 28, luckyPct: 8 },
    ],
    [
      { id: 'a', name: '極寒骨盾', desc: '轉化並附加【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '雷光骨盾', desc: '轉化並附加【感電】', elem: 'lightning', addStatus: 'shock' },
    ],
    { name: '幸運：骨片再聚', desc: '幸運一擊 28% 機率追加 62% 連攜爆發並回能 15', procChance: 0.28, bonusMult: 0.62, mpRefund: 15 }
  ),
  n_corpse_tendrils: makeSpec('n_corpse_tendrils', 'tactical', ['控場', '聚怪', '鮮血'], ['vulnerable', 'bleed'], ['bleed'],
    { name: '廣域血鬚', desc: '傷害 +24%，冷卻 -12%', dmgPct: 24, cdPct: 12 },
    [
      { id: 'a', name: '血海大出血', desc: '強化大出血引爆', dmgPct: 22, addStatus: 'bleed' },
      { id: 'b', name: '毒鬚纏繞', desc: '附加【中毒】', dmgPct: 20, addStatus: 'poison', overpowerPct: 10 },
      { id: 'c', name: '強力絞殺', desc: '總傷 +28%', dmgPct: 28, luckyPct: 8 },
    ],
    [
      { id: 'a', name: '冥咒觸鬚', desc: '轉化並附加【詛咒】', elem: 'shadow', addStatus: 'curse' },
      { id: 'b', name: '冰霜觸鬚', desc: '轉化並附加【凍結】', elem: 'frost', addStatus: 'freeze' },
    ],
    { name: '幸運：觸鬚再拉', desc: '幸運一擊 28% 機率追加 62% 連攜爆發並回能 15', procChance: 0.28, bonusMult: 0.62, mpRefund: 15 }
  ),
  n_soul_rift: makeSpec('n_soul_rift', 'core', ['精通', '靈魂', '審判'], ['curse', 'conviction'], ['curse'],
    { name: '冥界深淵', desc: '傷害 +24%，冷卻 -12%', dmgPct: 24, cdPct: 12 },
    [
      { id: 'a', name: '雙重靈魂審判', desc: '高倍引爆靈魂審判', dmgPct: 22, addStatus: 'conviction' },
      { id: 'b', name: '虛空易傷', desc: '附加【易傷】', dmgPct: 20, addStatus: 'vulnerable', overpowerPct: 10 },
      { id: 'c', name: '永恆裂隙', desc: '總傷 +28%', dmgPct: 28, luckyPct: 8 },
    ],
    [
      { id: 'a', name: '毒魂裂隙', desc: '轉化並附加【中毒】', elem: 'poison', addStatus: 'poison' },
      { id: 'b', name: '雷魂裂隙', desc: '轉化並附加【感電】', elem: 'lightning', addStatus: 'shock' },
    ],
    { name: '幸運：裂隙回能', desc: '幸運一擊 28% 機率追加 62% 連攜爆發並回能 15', procChance: 0.28, bonusMult: 0.62, mpRefund: 15 }
  ),
  n_army_scourge: makeSpec('n_army_scourge', 'ultimate', ['終極', '亡靈', '全場'], ['curse', 'poison'], ['burn', 'conviction'],
    { name: '萬鬼齊鳴', desc: '傷害 +24%，冷卻 -12%', dmgPct: 24, cdPct: 12 },
    [
      { id: 'a', name: '煉獄亡靈軍', desc: '附加【灼燒】全場煉獄毒爆', dmgPct: 22, addStatus: 'burn' },
      { id: 'b', name: '審判亡靈軍', desc: '附加【定罪】全場靈魂審判', dmgPct: 20, addStatus: 'conviction', overpowerPct: 10 },
      { id: 'c', name: '無盡天災', desc: '總傷 +28%', dmgPct: 28, luckyPct: 8 },
    ],
    [
      { id: 'a', name: '極寒亡靈軍', desc: '轉化並附加【凍結】', elem: 'frost', addStatus: 'freeze' },
      { id: 'b', name: '血潮亡靈軍', desc: '轉化並附加【流血】', elem: 'blood', addStatus: 'bleed' },
    ],
    { name: '幸運：天災再湧', desc: '幸運一擊 28% 機率追加 62% 連攜爆發並回能 15', procChance: 0.28, bonusMult: 0.62, mpRefund: 15 }
  ),
  n_bone_storm: makeSpec('n_bone_storm', 'ultimate', ['終極', '白骨', '必暴'], ['vulnerable', 'bleed'], ['bleed'],
    { name: '千骨狂嵐', desc: '傷害 +24%，冷卻 -12%', dmgPct: 24, cdPct: 12 },
    [
      { id: 'a', name: '血骨大風暴', desc: '高頻引爆大出血', dmgPct: 22, addStatus: 'bleed' },
      { id: 'b', name: '冰雷骨風暴', desc: '附加【凍結】＋【感電】', dmgPct: 20, addStatus: 'freeze', overpowerPct: 10 },
      { id: 'c', name: '不滅骨嵐', desc: '總傷 +28%', dmgPct: 28, luckyPct: 8 },
    ],
    [
      { id: 'a', name: '毒骨風暴', desc: '轉化並附加【中毒】', elem: 'poison', addStatus: 'poison' },
      { id: 'b', name: '冥火骨風暴', desc: '轉化並附加【灼燒】', elem: 'fire', addStatus: 'burn' },
    ],
    { name: '幸運：骨刺飛射', desc: '幸運一擊 28% 機率追加 62% 連攜爆發並回能 15', procChance: 0.28, bonusMult: 0.62, mpRefund: 15 }
  ),
};

// 讀取或初始化該角色某招技能的 4 階專精選擇
export function getSkillSpecChoice(state, classId, skillId) {
  const cid = classId || state?.classId || 'warrior';
  const saved = state?.skillSpecs?.[cid]?.[skillId] || {};
  return {
    t2: saved.t2 !== false,          // Lv.2 達標自動生效
    t4: saved.t4 || 'a',             // Lv.4 三選一預設 a
    t6: saved.t6 || null,            // Lv.6 二選一（可選轉化或保持原屬性）
    t8: saved.t8 !== false,          // Lv.8 達標自動生效
  };
}

// 計算某技能在當前等級與 4 階專精下的完整戰鬥修正值
export function computeSkillBuildMods(state, classId, skillId, skillLevel = 1) {
  const spec = SKILL_BUILD_SPECS[skillId];
  const out = {
    dmgMult: 1.0,
    cdMult: 1.0,
    overpowerChance: 0.04,
    luckyChance: 0.06,
    applyStatuses: new Set(),
    elemOverride: null,
    luckyEffect: null,
  };
  if (!spec) return out;

  (spec.applies || []).forEach((s) => out.applyStatuses.add(s));
  const choice = getSkillSpecChoice(state, classId, skillId);
  const lv = Math.max(1, Number(skillLevel) || 1);

  if (lv >= 2 && choice.t2 && spec.t2) {
    out.dmgMult += (spec.t2.dmgPct || 0) / 100;
    out.cdMult *= 1 - (spec.t2.cdPct || 0) / 100;
    out.overpowerChance += (spec.t2.overpowerPct || 0) / 100;
    out.luckyChance += (spec.t2.luckyPct || 0) / 100;
  }
  if (lv >= 4 && choice.t4) {
    const node = (spec.t4 || []).find((x) => x.id === choice.t4);
    if (node) {
      out.dmgMult += (node.dmgPct || 0) / 100;
      out.cdMult *= 1 - (node.cdPct || 0) / 100;
      out.overpowerChance += (node.overpowerPct || 0) / 100;
      out.luckyChance += (node.luckyPct || 0) / 100;
      if (node.addStatus) out.applyStatuses.add(node.addStatus);
    }
  }
  if (lv >= 6 && choice.t6) {
    const node = (spec.t6 || []).find((x) => x.id === choice.t6);
    if (node) {
      out.elemOverride = node.elem || null;
      out.overpowerChance += (node.overpowerPct || 0) / 100;
      if (node.addStatus) out.applyStatuses.add(node.addStatus);
    }
  }
  if (lv >= 8 && choice.t8 && spec.t8) {
    out.luckyChance += 0.10;
    out.luckyEffect = spec.t8;
  }
  return out;
}

// 檢查怪物是否滿足 4 大複合異常反應條件（附內建冷卻避免洗頻）
export function checkCompoundReaction(mob, nowT) {
  if (!mob || mob.hp <= 0) return null;
  if (!mob._statuses) mob._statuses = {};
  if (!mob._reactCd) mob._reactCd = {};

  // 同步舊有狀態欄位
  if ((mob.bleedUntil || 0) > nowT) mob._statuses.bleed = Math.max(mob._statuses.bleed || 0, mob.bleedUntil);
  if ((mob.poisonedUntil || 0) > nowT) mob._statuses.poison = Math.max(mob._statuses.poison || 0, mob.poisonedUntil);
  if ((mob.chilledUntil || 0) > nowT) mob._statuses.freeze = Math.max(mob._statuses.freeze || 0, mob.chilledUntil);
  if ((mob.markedUntil || 0) > nowT) mob._statuses.vulnerable = Math.max(mob._statuses.vulnerable || 0, mob.markedUntil);
  if ((mob.cursedUntil || 0) > nowT) mob._statuses.curse = Math.max(mob._statuses.curse || 0, mob.cursedUntil);

  for (const r of COMPOUND_REACTIONS) {
    if ((mob._reactCd[r.id] || 0) > nowT) continue;
    const ok = r.need.every((stKey) => (mob._statuses[stKey] || 0) > nowT);
    if (ok) {
      mob._reactCd[r.id] = nowT + r.cdMs;
      return r;
    }
  }
  return null;
}

// 智慧連招自動戰鬥優先排序（增益/上狀態 > 控場/領域 > 引爆核心 > 終極大招）
export function getSmartAutoSlotOrder(equippedSkillIds, monsters, nowT) {
  const hasDebuffedMob = (monsters || []).some((m) => {
    if (!m || m.hp <= 0) return false;
    const st = m._statuses || {};
    return Object.values(st).some((until) => until > nowT) || (m.bleedUntil || 0) > nowT || (m.markedUntil || 0) > nowT;
  });
  const hasBossOrPack = (monsters || []).some((m) => m && m.hp > 0 && (m.isBoss || m.isMiniBoss)) || (monsters || []).length >= 4;

  const scored = [];
  for (let i = 0; i < 5; i++) {
    const id = equippedSkillIds?.[i];
    if (!id) continue;
    const spec = SKILL_BUILD_SPECS[id];
    let prio = 50;
    if (spec) {
      if (spec.role === 'buff') prio = 95;
      else if (spec.role === 'primer') prio = hasDebuffedMob ? 65 : 90;
      else if (spec.role === 'tactical') prio = 80;
      else if (spec.role === 'core') prio = hasDebuffedMob ? 92 : 70;
      else if (spec.role === 'ultimate') prio = hasBossOrPack ? 98 : 60;
      else if (spec.role === 'defensive') prio = 55;
    }
    scored.push({ slotIdx: i, prio });
  }
  scored.sort((a, b) => b.prio - a.prio);
  return scored.map((x) => x.slotIdx);
}


// v235: 關鍵被動（Keystone Passives，每職業 4 選 1，含高風險變異流派）
export const KEYSTONE_PASSIVES = {
  warrior: [
    { id: 'wk_blood_tide',   name: '血河狂潮', icon: './assets/skills/ks_wk_blood_tide.png?v=235', badge: '流血流', color: '#f87171', desc: '流血傷害 +60% 且必定暴擊，攻擊流血目標有 35% 機率引爆周圍猩紅血浪。' },
    { id: 'wk_aftershock',   name: '餘震轟鳴', icon: './assets/skills/ks_wk_aftershock.png?v=235', badge: '大地流', color: '#fb923c', desc: '所有技能命中後有 40% 機率觸發二次大地餘震（65% 攻擊範圍傷＋壓制率 +10%）。' },
    { id: 'wk_endless_fury', name: '無盡狂怒', icon: './assets/skills/ks_wk_endless_fury.png?v=235', badge: '狂暴流', color: '#fbbf24', desc: '攻速 +28%、吸血 +10%、技能冷卻縮短 15%，越戰越狂。' },
    { id: 'wk_blood_pact',   name: '血契戰鬼', icon: './assets/skills/ks_wk_blood_pact.png?v=235', badge: '變異高危', color: '#ef4444', desc: '【變異】最大生命上限縮減 55%，換取全技能傷害 +65%、壓制觸發率 +45%！' },
  ],
  paladin: [
    { id: 'pk_hammer_domain',   name: '迴旋聖域', icon: './assets/skills/ks_pk_hammer_domain.png?v=235', badge: '聖鎚流', color: '#fde047', desc: '技能傷害 +35%，所有攻擊必附加【定罪】且擴大聖光範圍。' },
    { id: 'pk_divine_thunder',  name: '天罰雷霆', icon: './assets/skills/ks_pk_divine_thunder.png?v=235', badge: '審判流', color: '#38bdf8', desc: '對【定罪】目標暴擊時 45% 機率降下 140% 天罰落雷並附加【感電】。' },
    { id: 'pk_immortal_bulwark',name: '不朽壁壘', icon: './assets/skills/ks_pk_immortal_bulwark.png?v=235', badge: '鐵壁流', color: '#60a5fa', desc: '護甲 +45%、最大生命 +30%、每 2.5 秒自動釋放聖光反震波。' },
    { id: 'pk_martyr_crown',    name: '荊棘王冠', icon: './assets/skills/ks_pk_martyr_crown.png?v=235', badge: '變異高危', color: '#fb923c', desc: '【變異】閃避歸零，換取將 180% 護甲值直接轉化為基礎攻擊力＋壓制率 +18%！' },
  ],
  assassin: [
    { id: 'ak_mirror_phantoms', name: '千面幻影', icon: './assets/skills/ks_ak_mirror_phantoms.png?v=235', badge: '分身流', color: '#c084fc', desc: '施放任何核心技有 40% 機率由暗影分身額外複製 55% 威力追擊。' },
    { id: 'ak_corrosive_heart', name: '蝕骨毒心', icon: './assets/skills/ks_ak_corrosive_heart.png?v=235', badge: '劇毒流', color: '#4ade80', desc: '毒素傷害 +75%，命中中毒敵人自動擴散劇毒並附加【灼燒】。' },
    { id: 'ak_lethal_tempo',    name: '必殺連攜', icon: './assets/skills/ks_ak_lethal_tempo.png?v=235', badge: '暴殺流', color: '#fb7185', desc: '暴擊率 +15%、暴擊傷害 +70%、每 3 次暴擊必觸發壓制穿甲。' },
    { id: 'ak_glass_reaper',    name: '玻璃死神', icon: './assets/skills/ks_ak_glass_reaper.png?v=235', badge: '變異高危', color: '#f43f5e', desc: '【變異】護甲減半，換取所有技能傷害 +55% 且有 45% 機率觸發雙倍連擊！' },
  ],
  ranger: [
    { id: 'rk_chain_shadow',   name: '連鎖暗爆', icon: './assets/skills/ks_rk_chain_shadow.png?v=236', badge: '暗影流', color: '#c084fc', desc: '命中【易傷】目標有 40% 機率引爆暗影衝擊波（125% 傷＋掛詛咒）。' },
    { id: 'rk_corrosive_venom',name: '腐蝕劇毒', icon: './assets/skills/ks_rk_corrosive_venom.png?v=236', badge: '劇毒流', color: '#4ade80', desc: '毒素傷害 +70%，命中中毒敵人 35% 機率附加【灼燒】直接自爆煉獄毒爆。' },
    { id: 'rk_gale_crossbow',  name: '疾風連弩', icon: './assets/skills/ks_rk_gale_crossbow.png?v=236', badge: '彈幕流', color: '#34d399', desc: '攻速 +28%、幸運一擊率 +15%，每命中 35% 機率免費射出額外穿透箭。' },
    { id: 'rk_void_sniper',    name: '虛空死狙', icon: './assets/skills/ks_rk_void_sniper.png?v=236', badge: '變異高危', color: '#a855f7', desc: '【變異】移動速度大幅降低，換取暴擊傷害 +110%、全技能傷害 +55%！' },
  ],
  mage: [
    { id: 'mk_shatter_frost',   name: '極寒碎裂', icon: './assets/skills/ks_mk_shatter_frost.png?v=236', badge: '冰霜流', color: '#38bdf8', desc: '命中【凍結】目標有 45% 機率碎裂冰爆（135% 傷＋掛感電爆超導碎冰）。' },
    { id: 'mk_inferno_burn',    name: '煉獄焚城', icon: './assets/skills/ks_mk_inferno_burn.png?v=236', badge: '烈焰流', color: '#fb923c', desc: '火焰與技能傷害 +45%，所有攻擊必附加【灼燒】並降目標防禦。' },
    { id: 'mk_void_overload',   name: '虛空過載', icon: './assets/skills/ks_mk_void_overload.png?v=236', badge: '雷奧流', color: '#a78bfa', desc: '幸運一擊率 +18%，技能命中 40% 機率免費引爆 130% 奧術超新星。' },
    { id: 'mk_mana_singularity',name: '魔能奇點', icon: './assets/skills/ks_mk_mana_singularity.png?v=236', badge: '變異高危', color: '#60a5fa', desc: '【變異】最大生命 -45%，換取魔力上限翻倍、回魔 +80%、全技能傷害 +65%！' },
  ],
  necro: [
    { id: 'nk_undead_overlord', name: '死靈統御', icon: './assets/skills/ks_nk_undead_overlord.png?v=236', badge: '召喚流', color: '#2dd4bf', desc: '攻速 +25%、暴擊率 +15%、全召喚與技能傷害 +35%。' },
    { id: 'nk_bone_tyrant',     name: '骸骨暴君', icon: './assets/skills/ks_nk_bone_tyrant.png?v=236', badge: '白骨流', color: '#e2e8f0', desc: '暴擊傷害 +85%、壓制率 +15%，命中 40% 機率噴射五向分裂骨刺！' },
    { id: 'nk_plague_sea',      name: '血海瘟疫', icon: './assets/skills/ks_nk_plague_sea.png?v=236', badge: '屍爆流', color: '#4ade80', desc: '命中【詛咒】目標 45% 機率引爆免費血毒屍爆（130% 傷＋掛中毒）。' },
    { id: 'nk_lich_phylactery', name: '巫妖命匣', icon: './assets/skills/ks_nk_lich_phylactery.png?v=236', badge: '變異高危', color: '#38bdf8', desc: '【變異】護甲 -40%，換取吸血 +14% 與全暗影／白骨技能傷害 +70%！' },
  ]
};

export function getActiveKeystone(state, classId = null) {
  const cid = classId || state?.classId || 'warrior';
  const list = KEYSTONE_PASSIVES[cid] || [];
  if (!list.length) return null;
  const id = state?.activeKeystone?.[cid] || list[0].id;
  return list.find((k) => k.id === id) || list[0];
}
